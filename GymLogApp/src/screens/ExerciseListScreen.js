import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, GROUPS, GROUP_ICONS, radius, spacing } from '../theme';
import { Card, Chip, ChipRow, EmptyState, Fab, IconButton } from '../components/UI';
import { useApp } from '../context/AppContext';
import { deleteExercise, listExercises } from '../db/database';
import { formatKg } from '../utils/format';

export default function ExerciseListScreen({ navigation }) {
  const { showToast, feedback } = useApp();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setItems(await listExercises());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) => (!group || i.muscle_group === group) && i.name.toLowerCase().includes(q)
    );
  }, [items, group, query]);

  const confirmDelete = (item) => {
    Alert.alert('Remover exercício', `Deseja remover "${item.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await deleteExercise(item.id);
          feedback.success();
          showToast('Exercício removido');
          load();
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <Card
      style={styles.item}
      onPress={() => navigation.navigate('FormExercicio', { id: item.id })}
    >
      {item.photo ? (
        <Image source={{ uri: item.photo }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Ionicons name={GROUP_ICONS[item.muscle_group] || 'barbell-outline'} size={28} color={colors.primary} />
        </View>
      )}
      <View style={{ flex: 1, marginHorizontal: spacing.md }}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.group}>{item.muscle_group}</Text>
        <Text style={styles.meta}>
          {item.sets} × {item.reps}
          {item.weight > 0 ? `  •  ${formatKg(item.weight)} kg` : '  •  peso corporal'}
        </Text>
      </View>
      <IconButton name="trash-outline" color={colors.danger} onPress={() => confirmDelete(item)} />
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar exercício"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
        {query ? <IconButton name="close-circle" size={18} onPress={() => setQuery('')} /> : null}
      </View>

      <ChipRow>
        <Chip label="Todos" active={!group} onPress={() => setGroup(null)} />
        {GROUPS.map((g) => (
          <Chip key={g} label={g} active={group === g} onPress={() => setGroup(group === g ? null : g)} />
        ))}
      </ChipRow>

      <FlatList
        data={filtered}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              title={items.length === 0 ? 'Nenhum exercício' : 'Nada encontrado'}
              text={
                items.length === 0
                  ? 'Cadastre seu primeiro exercício para montar seus treinos.'
                  : 'Tente outro nome ou grupo muscular.'
              }
              actionLabel={items.length === 0 ? 'Novo exercício' : undefined}
              onAction={() => navigation.navigate('FormExercicio')}
            />
          )
        }
      />

      <Fab onPress={() => navigation.navigate('FormExercicio')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.text, paddingVertical: 12, marginLeft: 8, fontSize: 16 },
  item: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  thumb: { width: 64, height: 64, borderRadius: radius.sm },
  thumbPlaceholder: {
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  group: { color: colors.accent, fontSize: 12, fontWeight: '700', marginTop: 2 },
  meta: { color: colors.muted, fontSize: 13, marginTop: 4 },
});
