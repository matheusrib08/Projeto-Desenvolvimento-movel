import React, { useCallback, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { Button, Card, SectionTitle, StatBox } from '../components/UI';
import { useApp } from '../context/AppContext';
import { getStats, listWorkouts } from '../db/database';
import { formatDateTime, formatDuration, greeting } from '../utils/format';

export default function HomeScreen({ navigation }) {
  const { settings } = useApp();
  const [stats, setStats] = useState(null);
  const [last, setLast] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const s = await getStats();
        const w = await listWorkouts(1);
        if (active) {
          setStats(s);
          setLast(w[0] || null);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const goal = Math.max(1, settings.weeklyGoal);
  const weekCount = stats ? stats.weekCount : 0;
  const progress = Math.min(1, weekCount / goal);
  const maxBar = stats ? Math.max(1, ...stats.last7.map((d) => d.count)) : 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
    >
      <ImageBackground
        source={require('../../assets/banner.png')}
        style={styles.banner}
        imageStyle={{ borderRadius: radius.lg }}
      >
        <Text style={styles.hello}>
          {greeting()}, {settings.userName}!
        </Text>
        <Text style={styles.sub}>Pronto para superar o treino de ontem?</Text>
      </ImageBackground>

      <Button
        title="Iniciar treino"
        icon="play"
        variant="accent"
        onPress={() => navigation.navigate('Treinar')}
        style={{ marginTop: spacing.lg }}
      />

      <SectionTitle>Meta da semana</SectionTitle>
      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.goalText}>
            {weekCount} de {goal} treinos
          </Text>
          <Text style={[styles.goalText, { color: colors.accent }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
        {progress >= 1 ? (
          <Text style={styles.congrats}>🎉 Meta batida! Continue assim.</Text>
        ) : (
          <Text style={styles.muted}>
            Faltam {goal - weekCount} treino(s) para bater a meta.
          </Text>
        )}
      </Card>

      <SectionTitle>Resumo geral</SectionTitle>
      <View style={styles.row}>
        <StatBox icon="trophy-outline" value={stats ? stats.totalWorkouts : 0} label="Treinos" color={colors.warning} />
        <View style={{ width: spacing.sm }} />
        <StatBox icon="repeat-outline" value={stats ? stats.totalReps : 0} label="Repetições" color={colors.primary} />
        <View style={{ width: spacing.sm }} />
        <StatBox icon="time-outline" value={stats ? stats.totalMinutes : 0} label="Minutos" color={colors.accent} />
      </View>

      <SectionTitle>Últimos 7 dias</SectionTitle>
      <Card>
        <View style={styles.chart}>
          {(stats ? stats.last7 : []).map((d, i) => (
            <View key={i} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${(d.count / maxBar) * 100}%`,
                      backgroundColor: d.count > 0 ? colors.primary : 'transparent',
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{d.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <SectionTitle>Último treino</SectionTitle>
      {last ? (
        <Card onPress={() => navigation.navigate('DetalheTreino', { id: last.id })}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lastTitle}>{formatDateTime(last.started_at)}</Text>
              <Text style={styles.muted}>
                {last.exercise_count} exercício(s) • {last.total_reps} reps •{' '}
                {formatDuration(last.duration_sec)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.muted} />
          </View>
        </Card>
      ) : (
        <Card>
          <Text style={styles.muted}>Você ainda não registrou nenhum treino.</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  banner: { height: 160, justifyContent: 'flex-end', padding: spacing.lg },
  hello: { color: '#fff', fontSize: 24, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  row: { flexDirection: 'row' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  track: {
    height: 10,
    backgroundColor: colors.cardAlt,
    borderRadius: 5,
    marginVertical: spacing.md,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: 5 },
  muted: { color: colors.muted, fontSize: 13 },
  congrats: { color: colors.accent, fontWeight: '700' },
  chart: { flexDirection: 'row', justifyContent: 'space-between', height: 120 },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: {
    flex: 1,
    width: 18,
    backgroundColor: colors.cardAlt,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: { width: '100%', borderRadius: 6 },
  barLabel: { color: colors.muted, fontSize: 12, marginTop: 6, fontWeight: '600' },
  lastTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
});
