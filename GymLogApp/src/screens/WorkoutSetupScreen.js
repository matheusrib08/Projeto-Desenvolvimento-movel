import React, { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, GROUP_ICONS, radius, spacing } from '../theme';
import { Button, EmptyState } from '../components/UI';
import { useApp } from '../context/AppContext';
import { listExercises } from '../db/database';

export default function WorkoutSetupScreen({ navigation }) {
  const { showToast, feedback } = useApp();
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState([]); // ids na ordem de escolha
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const list = await listExercises();
        if (!active) return;
        setItems(list);
        // remove ids que foram excluídos
        setSelected((sel) => sel.filter((id) => list.some((e) => e.id === id)));
        setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const toggle = (id) => {
    feedback.tap();
    setSelected((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]));
  };

  const totalSets = items
    .filter((e) => selected.includes(e.id))
    .reduce((acc, e) => acc + e.sets, 0);

  const start = () => {
    if (selected.length === 0) {
      feedback.error();
      showToast('Selecione pelo menos um exercício', 'error');
      return;
    }
    navigation.navigate('TreinoAtivo', { ids: selected });
  };

  const renderItem = ({ item }) => {
    const order = selected.indexOf(item.id);
    const isSel = order >= 0;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => toggle(item.id)}
        style={[styles.item, isSel && styles.itemSelected]}
      >
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name={GROUP_ICONS[item.muscle_group] || 'barbell-outline'} size={22} color={colors.primary} />
          </View>
        )}
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            {item.muscle_group} • {item.sets} × {item.reps}
          </Text>
        </View>
        {isSel ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{order + 1}</Text>
          </View>
        ) : (
          <Ionicons name="ellipse-outline" size={26} color={colors.muted} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        ListHeaderComponent={
          items.length > 0 ? (
            <View style={styles.header}>
              <Text style={styles.title}>Monte seu treino</Text>
              <Text style={styles.subtitle}>
                Toque nos exercícios na ordem em que deseja fazê-los.
              </Text>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => setSelected(items.map((i) => i.id))}>
                  <Text style={styles.link}>Selecionar todos</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelected([])}>
                  <Text style={[styles.link, { color: colors.muted }]}>Limpar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 130 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              title="Sem exercícios"
              text="Cadastre exercícios na aba Exercícios para montar um treino."
              actionLabel="Cadastrar exercício"
              onAction={() => navigation.navigate('FormExercicio')}
            />
          )
        }
      />

      {items.length > 0 ? (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {selected.length} exercício(s) • {totalSets} série(s)
          </Text>
          <Button title="Começar" icon="play" variant="accent" onPress={start} disabled={selected.length === 0} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { marginBottom: spacing.md },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.muted, marginTop: 4 },
  headerActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  link: { color: colors.accent, fontWeight: '700' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemSelected: { borderColor: colors.primary, backgroundColor: colors.cardAlt },
  thumb: { width: 52, height: 52, borderRadius: radius.sm },
  thumbPlaceholder: { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontWeight: '800' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: { color: colors.muted, textAlign: 'center', marginBottom: spacing.sm, fontWeight: '600' },
});
