import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { Button, Card, EmptyState, Fab, Field, IconButton } from '../components/UI';
import { useApp } from '../context/AppContext';
import { createBodyLog, deleteBodyLog, listBodyLogs, updateBodyLog } from '../db/database';
import { chooseImage } from '../utils/images';
import { formatDate, formatKg, parseNumber } from '../utils/format';

export default function ProgressScreen() {
  const { showToast, feedback } = useApp();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // estado do modal (formulário)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLogs(await listBodyLogs());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openNew = () => {
    setEditingId(null);
    setWeight('');
    setNote('');
    setPhoto(null);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (log) => {
    setEditingId(log.id);
    setWeight(String(log.weight).replace('.', ','));
    setNote(log.note || '');
    setPhoto(log.photo);
    setError('');
    setModalOpen(true);
  };

  const save = async () => {
    const w = parseNumber(weight);
    if (Number.isNaN(w) || w < 20 || w > 400) {
      setError('Informe um peso válido entre 20 e 400 kg.');
      feedback.error();
      return;
    }
    try {
      if (editingId) await updateBodyLog(editingId, { weight: w, note: note.trim(), photo });
      else await createBodyLog({ weight: w, note: note.trim(), photo });
      feedback.success();
      showToast(editingId ? 'Registro atualizado!' : 'Registro adicionado!');
      setModalOpen(false);
      load();
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar', 'error');
    }
  };

  const confirmDelete = (log) => {
    Alert.alert('Excluir registro', `Excluir o registro de ${formatDate(log.date)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteBodyLog(log.id);
          feedback.success();
          showToast('Registro excluído');
          load();
        },
      },
    ]);
  };

  /* ---------- gráfico: últimos 8 registros ---------- */
  const chartData = logs.slice(0, 8).reverse();
  const weights = chartData.map((l) => l.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const first = logs.length > 0 ? logs[logs.length - 1].weight : 0;
  const latest = logs.length > 0 ? logs[0].weight : 0;
  const diff = latest - first;

  const Header = (
    <View>
      {logs.length > 0 ? (
        <>
          <View style={styles.summaryRow}>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Peso atual</Text>
              <Text style={styles.summaryValue}>{formatKg(latest)} kg</Text>
            </Card>
            <View style={{ width: spacing.sm }} />
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Variação total</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: diff === 0 ? colors.text : diff < 0 ? colors.accent : colors.warning },
                ]}
              >
                {diff > 0 ? '+' : ''}
                {formatKg(Math.round(diff * 10) / 10)} kg
              </Text>
            </Card>
          </View>

          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.chartTitle}>Evolução do peso</Text>
            <View style={styles.chart}>
              {chartData.map((l) => {
                const h = 24 + ((l.weight - minW) / range) * 96;
                return (
                  <View key={l.id} style={styles.barCol}>
                    <Text style={styles.barValue}>{formatKg(l.weight)}</Text>
                    <View style={[styles.bar, { height: h }]} />
                    <Text style={styles.barLabel}>{formatDate(l.date).slice(0, 5)}</Text>
                  </View>
                );
              })}
            </View>
          </Card>

          <Text style={styles.listTitle}>Registros</Text>
        </>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={(i) => String(i.id)}
        ListHeaderComponent={Header}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              title="Sem registros"
              text="Registre seu peso e uma foto para acompanhar a evolução do seu corpo."
              actionLabel="Novo registro"
              onAction={openNew}
            />
          )
        }
        renderItem={({ item }) => (
          <Card style={styles.logRow} onPress={() => openEdit(item)}>
            {item.photo ? (
              <Image source={{ uri: item.photo }} style={styles.logPhoto} />
            ) : (
              <View style={[styles.logPhoto, styles.logPhotoEmpty]}>
                <Ionicons name="person-outline" size={24} color={colors.muted} />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.logWeight}>{formatKg(item.weight)} kg</Text>
              <Text style={styles.logDate}>{formatDate(item.date)}</Text>
              {item.note ? (
                <Text style={styles.logNote} numberOfLines={1}>
                  {item.note}
                </Text>
              ) : null}
            </View>
            <IconButton name="trash-outline" color={colors.danger} onPress={() => confirmDelete(item)} />
          </Card>
        )}
      />

      <Fab onPress={openNew} />

      {/* ---------- Modal de criar / editar ---------- */}
      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Editar registro' : 'Novo registro'}</Text>
              <IconButton name="close" onPress={() => setModalOpen(false)} color={colors.text} />
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <Field
                label="Peso (kg)"
                value={weight}
                onChangeText={(t) => {
                  setWeight(t);
                  setError('');
                }}
                keyboardType="decimal-pad"
                placeholder="Ex.: 72,5"
                error={error}
              />
              <Field label="Anotação" value={note} onChangeText={setNote} placeholder="Opcional" />

              <TouchableOpacity activeOpacity={0.85} onPress={() => chooseImage(setPhoto, [3, 4])} style={styles.photoBox}>
                {photo ? (
                  <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="camera-outline" size={32} color={colors.muted} />
                    <Text style={{ color: colors.muted, marginTop: 6 }}>Foto de progresso (opcional)</Text>
                  </View>
                )}
              </TouchableOpacity>
              {photo ? (
                <Button title="Remover foto" variant="ghost" onPress={() => setPhoto(null)} style={{ marginBottom: spacing.md }} />
              ) : null}

              <Button title="Salvar" icon="checkmark" onPress={save} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  summaryRow: { flexDirection: 'row' },
  summaryCard: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  summaryValue: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 4 },
  chartTitle: { color: colors.text, fontWeight: '700', marginBottom: spacing.md },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 170 },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 18, backgroundColor: colors.primary, borderRadius: 6, marginVertical: 4 },
  barValue: { color: colors.text, fontSize: 10, fontWeight: '700' },
  barLabel: { color: colors.muted, fontSize: 10 },
  listTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.md },
  logRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  logPhoto: { width: 56, height: 72, borderRadius: radius.sm },
  logPhotoEmpty: { backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  logWeight: { color: colors.text, fontSize: 18, fontWeight: '800' },
  logDate: { color: colors.muted, fontSize: 13, marginTop: 2 },
  logNote: { color: colors.accent, fontSize: 13, marginTop: 4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  photoBox: {
    height: 160,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
});
