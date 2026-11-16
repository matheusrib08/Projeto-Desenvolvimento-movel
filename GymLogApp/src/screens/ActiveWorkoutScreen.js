import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { Button, Card, Stepper } from '../components/UI';
import { useApp } from '../context/AppContext';
import { getExercisesByIds, saveWorkout } from '../db/database';
import { formatDuration, formatKg, parseNumber } from '../utils/format';

export default function ActiveWorkoutScreen({ route, navigation }) {
  useKeepAwake(); // mantém a tela acesa durante o treino
  const { ids } = route.params;
  const { settings, showToast, feedback } = useApp();

  const [exercises, setExercises] = useState(null);
  const [exIndex, setExIndex] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  const [reps, setReps] = useState(0);
  const [weight, setWeight] = useState(0);
  const [done, setDone] = useState([]);
  const [restEnd, setRestEnd] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [sensorOk, setSensorOk] = useState(true);

  const startRef = useRef(Date.now());
  const doneRef = useRef([]);
  const finishedRef = useRef(false);
  const lastShake = useRef(0);

  useEffect(() => {
    doneRef.current = done;
  }, [done]);

  /* ---------- carregar exercícios ---------- */
  useEffect(() => {
    (async () => {
      const list = await getExercisesByIds(ids);
      if (list.length === 0) {
        showToast('Nenhum exercício encontrado', 'error');
        finishedRef.current = true;
        navigation.goBack();
        return;
      }
      setExercises(list);
      setWeight(list[0].weight);
      startRef.current = Date.now();
    })();
  }, [ids, navigation, showToast]);

  /* ---------- relógio (cronômetro + descanso) ---------- */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const elapsed = Math.floor((now - startRef.current) / 1000);
  const restLeft = restEnd ? Math.max(0, Math.ceil((restEnd - now) / 1000)) : 0;
  const resting = restEnd !== null;

  // fim do descanso -> vibra e avisa
  useEffect(() => {
    if (restEnd && now >= restEnd) {
      setRestEnd(null);
      feedback.rest();
      showToast('Descanso finalizado! Próxima série.');
    }
  }, [now, restEnd, feedback, showToast]);

  /* ---------- SENSOR: acelerômetro (chacoalhar = +1 repetição) ---------- */
  useEffect(() => {
    let sub = null;
    let cancelled = false;
    (async () => {
      const available = await Accelerometer.isAvailableAsync();
      if (cancelled) return;
      setSensorOk(available);
      if (!available || !settings.shake || resting || !exercises) return;

      Accelerometer.setUpdateInterval(80);
      sub = Accelerometer.addListener(({ x, y, z }) => {
        const magnitude = Math.sqrt(x * x + y * y + z * z); // em "g"; parado ≈ 1
        const t = Date.now();
        if (magnitude > settings.shakeThreshold && t - lastShake.current > 700) {
          lastShake.current = t;
          setReps((r) => r + 1);
          feedback.tap();
        }
      });
    })();
    return () => {
      cancelled = true;
      if (sub) sub.remove();
    };
  }, [settings.shake, settings.shakeThreshold, resting, exercises, feedback]);

  /* ---------- finalizar e salvar ---------- */
  const finishWorkout = useCallback(
    async (list) => {
      if (list.length === 0) {
        finishedRef.current = true;
        showToast('Treino cancelado: nenhuma série registrada', 'error');
        navigation.goBack();
        return;
      }
      try {
        const durationSec = Math.max(1, Math.floor((Date.now() - startRef.current) / 1000));
        const id = await saveWorkout({ durationSec, sets: list });
        finishedRef.current = true;
        feedback.success();
        showToast('Treino salvo! Parabéns 💪');
        navigation.replace('DetalheTreino', { id });
      } catch (e) {
        console.error(e);
        showToast('Erro ao salvar o treino', 'error');
      }
    },
    [feedback, navigation, showToast]
  );

  /* ---------- confirmar saída ---------- */
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (finishedRef.current || doneRef.current.length === 0) return;
      e.preventDefault();
      Alert.alert('Sair do treino?', 'Você já registrou séries neste treino.', [
        { text: 'Continuar treinando', style: 'cancel' },
        { text: 'Salvar e sair', onPress: () => finishWorkout(doneRef.current) },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            finishedRef.current = true;
            navigation.dispatch(e.data.action);
          },
        },
      ]);
    });
    return unsub;
  }, [navigation, finishWorkout]);

  if (!exercises) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const ex = exercises[exIndex];
  const isLastExercise = exIndex === exercises.length - 1;

  const goToNextExercise = (list) => {
    if (isLastExercise) {
      finishWorkout(list);
      return;
    }
    const next = exercises[exIndex + 1];
    setExIndex(exIndex + 1);
    setSetNumber(1);
    setReps(0);
    setWeight(next.weight);
  };

  const completeSet = () => {
    if (reps <= 0) {
      feedback.error();
      showToast('Conte pelo menos 1 repetição', 'error');
      return;
    }
    const entry = { exerciseId: ex.id, name: ex.name, setNumber, reps, weight };
    const list = [...done, entry];
    setDone(list);
    feedback.success();
    setReps(0);

    if (setNumber < ex.sets) {
      setSetNumber(setNumber + 1);
      setRestEnd(Date.now() + settings.restSeconds * 1000);
    } else if (isLastExercise) {
      finishWorkout(list);
    } else {
      goToNextExercise(list);
      setRestEnd(Date.now() + settings.restSeconds * 1000);
    }
  };

  const skipExercise = () => {
    Alert.alert('Pular exercício', `Pular "${ex.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Pular', onPress: () => goToNextExercise(done) },
    ]);
  };

  const finishNow = () => {
    Alert.alert('Finalizar treino', 'Deseja encerrar e salvar o treino agora?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Finalizar', onPress: () => finishWorkout(done) },
    ]);
  };

  const exerciseSets = done.filter((d) => d.exerciseId === ex.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 50 }}>
      {/* topo: cronômetro + status do sensor */}
      <View style={styles.topRow}>
        <View style={styles.timerPill}>
          <Ionicons name="time-outline" size={18} color={colors.accent} />
          <Text style={styles.timerText}>{formatDuration(elapsed)}</Text>
        </View>
        <View style={styles.timerPill}>
          <Ionicons
            name="phone-portrait-outline"
            size={18}
            color={sensorOk && settings.shake ? colors.accent : colors.muted}
          />
          <Text style={[styles.timerText, { fontSize: 13 }]}>
            {!sensorOk ? 'Sem sensor' : settings.shake ? 'Chacoalhe p/ contar' : 'Sensor desligado'}
          </Text>
        </View>
      </View>

      {/* progresso entre exercícios */}
      <View style={styles.progressRow}>
        {exercises.map((e, i) => (
          <View
            key={e.id}
            style={[
              styles.progressDot,
              i < exIndex && { backgroundColor: colors.accent },
              i === exIndex && { backgroundColor: colors.primary },
            ]}
          />
        ))}
      </View>

      <Text style={styles.exIndex}>
        Exercício {exIndex + 1} de {exercises.length}
      </Text>
      <Text style={styles.exName}>{ex.name}</Text>
      <Text style={styles.exMeta}>
        {ex.muscle_group} • meta {ex.sets} × {ex.reps}
      </Text>
      {ex.notes ? <Text style={styles.notes}>💡 {ex.notes}</Text> : null}

      {resting ? (
        /* ---------------- DESCANSO ---------------- */
        <Card style={styles.restCard}>
          <Text style={styles.restLabel}>Descansando</Text>
          <Text style={styles.restTime}>{formatDuration(restLeft)}</Text>
          <Text style={styles.restNext}>
            Próxima: série {setNumber} de {ex.sets}
            {setNumber === 1 ? ` — ${ex.name}` : ''}
          </Text>
          <View style={styles.restButtons}>
            <Button
              title="+15s"
              variant="ghost"
              onPress={() => setRestEnd((r) => (r ? r + 15000 : r))}
              style={{ flex: 1 }}
            />
            <View style={{ width: spacing.md }} />
            <Button title="Pular" variant="accent" onPress={() => setRestEnd(null)} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : (
        /* ---------------- SÉRIE ATIVA ---------------- */
        <Card style={{ marginTop: spacing.lg, alignItems: 'center' }}>
          <Text style={styles.setLabel}>
            Série {setNumber} de {ex.sets}
          </Text>

          <View style={styles.repsRow}>
            <TouchableOpacity
              onPress={() => {
                feedback.tap();
                setReps((r) => Math.max(0, r - 1));
              }}
              style={styles.roundBtn}
            >
              <Ionicons name="remove" size={30} color={colors.text} />
            </TouchableOpacity>

            <View style={{ alignItems: 'center', marginHorizontal: spacing.xl }}>
              <Text style={styles.repsNumber}>{reps}</Text>
              <Text style={styles.repsLabel}>repetições</Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                feedback.tap();
                setReps((r) => r + 1);
              }}
              style={[styles.roundBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Carga (kg)</Text>
          <Stepper value={weight} onChange={setWeight} min={0} max={1000} step={2.5} format={formatKg} />

          <Button
            title="Concluir série"
            icon="checkmark-circle"
            variant="accent"
            onPress={completeSet}
            style={{ alignSelf: 'stretch', marginTop: spacing.xl }}
          />
        </Card>
      )}

      {/* séries já feitas neste exercício */}
      {exerciseSets.length > 0 ? (
        <View style={{ marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>Séries concluídas</Text>
          {exerciseSets.map((s) => (
            <View key={`${s.exerciseId}-${s.setNumber}`} style={styles.doneRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
              <Text style={styles.doneText}>
                Série {s.setNumber}: {s.reps} reps × {formatKg(s.weight)} kg
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ marginTop: spacing.xl }}>
        <Button title="Pular exercício" variant="ghost" icon="play-skip-forward" onPress={skipExercise} />
        <Button
          title="Finalizar treino"
          variant="danger"
          icon="stop-circle"
          onPress={finishNow}
          style={{ marginTop: spacing.md }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timerText: { color: colors.text, fontWeight: '800', marginLeft: 8, fontSize: 16 },
  progressRow: { flexDirection: 'row', marginTop: spacing.lg },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.cardAlt,
    marginHorizontal: 2,
  },
  exIndex: { color: colors.muted, marginTop: spacing.lg, fontWeight: '600' },
  exName: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 4 },
  exMeta: { color: colors.accent, fontWeight: '700', marginTop: 4 },
  notes: { color: colors.muted, marginTop: spacing.sm, fontStyle: 'italic' },
  setLabel: { color: colors.muted, fontSize: 15, fontWeight: '700', marginBottom: spacing.md },
  repsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  roundBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repsNumber: { color: colors.text, fontSize: 72, fontWeight: '900', lineHeight: 80 },
  repsLabel: { color: colors.muted, fontWeight: '600' },
  label: { color: colors.muted, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  restCard: { marginTop: spacing.lg, alignItems: 'center', borderColor: colors.warning },
  restLabel: { color: colors.warning, fontWeight: '800', fontSize: 16 },
  restTime: { color: colors.text, fontSize: 72, fontWeight: '900', marginVertical: spacing.sm },
  restNext: { color: colors.muted, textAlign: 'center' },
  restButtons: { flexDirection: 'row', marginTop: spacing.lg, alignSelf: 'stretch' },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: spacing.sm },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: 6,
  },
  doneText: { color: colors.text, marginLeft: 10, fontWeight: '600' },
});
