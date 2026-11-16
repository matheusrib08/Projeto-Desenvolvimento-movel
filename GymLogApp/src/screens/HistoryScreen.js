import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import { Card, EmptyState, IconButton } from '../components/UI';
import { useApp } from '../context/AppContext';
import { deleteWorkout, listWorkouts } from '../db/database';
import { formatDateTime, formatDuration, formatKg } from '../utils/format';

export default function HistoryScreen({ navigation }) {
  const { showToast, feedback } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setItems(await listWorkouts());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const confirmDelete = (w) => {
    Alert.alert('Excluir treino', `Excluir o treino de ${formatDateTime(w.started_at)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteWorkout(w.id);
          feedback.success();
          showToast('Treino excluído');
          load();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              title="Histórico vazio"
              text="Quando você finalizar um treino, ele aparecerá aqui."
              actionLabel="Iniciar treino"
              onAction={() => navigation.navigate('Treinar')}
            />
          )
        }
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('DetalheTreino', { id: item.id })}>
            <View style={styles.row}>
              <View style={styles.icon}>
                <Ionicons name="barbell" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.date}>{formatDateTime(item.started_at)}</Text>
                <Text style={styles.meta}>
                  {item.exercise_count} exercício(s) • {item.set_count} série(s)
                </Text>
                <Text style={styles.meta}>
                  {item.total_reps} reps • {formatKg(item.volume)} kg de volume •{' '}
                  {formatDuration(item.duration_sec)}
                </Text>
                {item.notes ? (
                  <Text style={styles.note} numberOfLines={1}>
                    📝 {item.notes}
                  </Text>
                ) : null}
              </View>
              <IconButton name="trash-outline" color={colors.danger} onPress={() => confirmDelete(item)} />
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  meta: { color: colors.muted, fontSize: 13, marginTop: 1 },
  note: { color: colors.accent, fontSize: 13, marginTop: 4 },
});
