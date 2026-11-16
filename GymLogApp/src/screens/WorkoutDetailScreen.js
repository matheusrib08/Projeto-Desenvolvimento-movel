import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme';
import { Button, Card, Field, SectionTitle, StatBox } from '../components/UI';
import { useApp } from '../context/AppContext';
import { deleteWorkout, getWorkout, getWorkoutSets, updateWorkoutNotes } from '../db/database';
import { formatDateTime, formatDuration, formatKg } from '../utils/format';

export default function WorkoutDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { showToast, feedback } = useApp();
  const [workout, setWorkout] = useState(null);
  const [sets, setSets] = useState([]);
  const [notes, setNotes] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const w = await getWorkout(id);
        const s = await getWorkoutSets(id);
        if (!active) return;
        setWorkout(w);
        setSets(s);
        setNotes(w ? w.notes || '' : '');
      })();
      return () => {
        active = false;
      };
    }, [id])
  );

  if (!workout) {
    return <View style={styles.container} />;
  }

  // agrupa as séries por exercício (mantendo a ordem em que foram feitas)
  const groups = [];
  sets.forEach((s) => {
    let g = groups.find((x) => x.name === s.exercise_name);
    if (!g) {
      g = { name: s.exercise_name, sets: [] };
      groups.push(g);
    }
    g.sets.push(s);
  });

  const saveNotes = async () => {
    await updateWorkoutNotes(id, notes.trim());
    feedback.success();
    showToast('Anotação salva!');
  };

  const remove = () => {
    Alert.alert('Excluir treino', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteWorkout(id);
          feedback.success();
          showToast('Treino excluído');
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.date}>{formatDateTime(workout.started_at)}</Text>

      <View style={styles.row}>
        <StatBox icon="time-outline" value={formatDuration(workout.duration_sec)} label="Duração" color={colors.accent} />
        <View style={{ width: spacing.sm }} />
        <StatBox icon="repeat-outline" value={workout.total_reps} label="Repetições" color={colors.primary} />
        <View style={{ width: spacing.sm }} />
        <StatBox icon="barbell-outline" value={formatKg(workout.volume)} label="Volume (kg)" color={colors.warning} />
      </View>

      <SectionTitle>Exercícios realizados</SectionTitle>
      {groups.map((g) => (
        <Card key={g.name} style={{ marginBottom: spacing.md }}>
          <Text style={styles.exName}>{g.name}</Text>
          {g.sets.map((s) => (
            <View key={s.id} style={styles.setRow}>
              <Text style={styles.setNum}>Série {s.set_number}</Text>
              <Text style={styles.setVal}>
                {s.reps} reps × {formatKg(s.weight)} kg
              </Text>
            </View>
          ))}
        </Card>
      ))}

      <SectionTitle>Anotações</SectionTitle>
      <Field value={notes} onChangeText={setNotes} placeholder="Como foi o treino? Sensações, dores, ajustes..." multiline />
      <Button title="Salvar anotação" icon="save-outline" variant="ghost" onPress={saveNotes} />

      <Button
        title="Excluir treino"
        icon="trash-outline"
        variant="danger"
        onPress={remove}
        style={{ marginTop: spacing.xl }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  date: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: spacing.lg },
  row: { flexDirection: 'row' },
  exName: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: spacing.sm },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  setNum: { color: colors.muted, fontWeight: '600' },
  setVal: { color: colors.text, fontWeight: '700' },
});
