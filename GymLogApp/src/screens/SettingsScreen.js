import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, Vibration, View } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { colors, spacing } from '../theme';
import { Button, Card, Chip, Field, SectionTitle, Stepper } from '../components/UI';
import { useApp } from '../context/AppContext';
import { resetAllData } from '../db/database';

const SENSITIVITY = [
  { label: 'Alta', value: 1.5 },
  { label: 'Média', value: 2.0 },
  { label: 'Baixa', value: 2.6 },
];

export default function SettingsScreen() {
  const { settings, updateSetting, showToast, feedback } = useApp();
  const [name, setName] = useState(settings.userName);
  const [live, setLive] = useState(null); // leitura ao vivo do acelerômetro
  const [testing, setTesting] = useState(false);
  const subRef = React.useRef(null);

  const saveName = () => {
    const n = name.trim() || 'Atleta';
    setName(n);
    updateSetting('userName', n);
    feedback.success();
    showToast('Nome atualizado!');
  };

  // Teste do sensor: mostra a força medida em tempo real
  const toggleSensorTest = async () => {
    if (testing) {
      if (subRef.current) subRef.current.remove();
      subRef.current = null;
      setTesting(false);
      setLive(null);
      return;
    }
    const ok = await Accelerometer.isAvailableAsync();
    if (!ok) {
      showToast('Este aparelho não tem acelerômetro', 'error');
      return;
    }
    Accelerometer.setUpdateInterval(100);
    subRef.current = Accelerometer.addListener(({ x, y, z }) =>
      setLive(Math.sqrt(x * x + y * y + z * z))
    );
    setTesting(true);
  };

  React.useEffect(() => {
    return () => {
      if (subRef.current) subRef.current.remove();
    };
  }, []);

  const testVibration = () => {
    Vibration.vibrate([0, 300, 100, 300]);
    showToast('Vibração testada');
  };

  const resetData = () => {
    Alert.alert(
      'Apagar todos os dados',
      'Isso remove treinos, registros corporais e exercícios (os exercícios de exemplo serão recriados). Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar tudo',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            feedback.success();
            showToast('Dados apagados');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      <SectionTitle style={{ marginTop: 0 }}>Perfil</SectionTitle>
      <Field label="Seu nome" value={name} onChangeText={setName} onBlur={saveName} onSubmitEditing={saveName} />

      <SectionTitle>Treino</SectionTitle>
      <Card>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Meta semanal</Text>
            <Text style={styles.desc}>Treinos por semana</Text>
          </View>
          <Stepper value={settings.weeklyGoal} onChange={(v) => updateSetting('weeklyGoal', v)} min={1} max={7} />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Descanso entre séries</Text>
            <Text style={styles.desc}>Em segundos</Text>
          </View>
          <Stepper
            value={settings.restSeconds}
            onChange={(v) => updateSetting('restSeconds', v)}
            min={15}
            max={300}
            step={15}
          />
        </View>
      </Card>

      <SectionTitle>Sensores e vibração</SectionTitle>
      <Card>
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.title}>Contar repetições ao chacoalhar</Text>
            <Text style={styles.desc}>Usa o acelerômetro. Segure o celular durante o movimento.</Text>
          </View>
          <Switch
            value={settings.shake}
            onValueChange={(v) => updateSetting('shake', v)}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor="#fff"
          />
        </View>

        <Text style={[styles.title, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Sensibilidade</Text>
        <View style={{ flexDirection: 'row' }}>
          {SENSITIVITY.map((s) => (
            <Chip
              key={s.label}
              label={s.label}
              active={settings.shakeThreshold === s.value}
              onPress={() => updateSetting('shakeThreshold', s.value)}
            />
          ))}
        </View>

        <Button
          title={testing ? 'Parar teste' : 'Testar acelerômetro'}
          variant="ghost"
          icon="speedometer-outline"
          onPress={toggleSensorTest}
          style={{ marginTop: spacing.md }}
        />
        {testing ? (
          <Text style={styles.live}>
            Força atual: {live ? live.toFixed(2) : '--'} g{'  '}
            {live && live > settings.shakeThreshold ? '✅ contaria' : '(parado ≈ 1.00 g)'}
          </Text>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.title}>Vibração / feedback tátil</Text>
            <Text style={styles.desc}>Vibra ao contar, concluir série e fim do descanso.</Text>
          </View>
          <Switch
            value={settings.haptics}
            onValueChange={(v) => updateSetting('haptics', v)}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor="#fff"
          />
        </View>
        <Button title="Testar vibração" variant="ghost" icon="radio-outline" onPress={testVibration} style={{ marginTop: spacing.md }} />
      </Card>

      <SectionTitle>Dados</SectionTitle>
      <Button title="Apagar todos os dados" variant="danger" icon="trash-outline" onPress={resetData} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  desc: { color: colors.muted, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  live: { color: colors.accent, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' },
});
