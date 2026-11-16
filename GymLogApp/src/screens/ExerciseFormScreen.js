import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, GROUPS, radius, spacing } from '../theme';
import { Button, Chip, Field } from '../components/UI';
import { useApp } from '../context/AppContext';
import { createExercise, deleteExercise, getExercise, updateExercise } from '../db/database';
import { chooseImage } from '../utils/images';
import { parseNumber } from '../utils/format';

export default function ExerciseFormScreen({ route, navigation }) {
  const id = route.params?.id;
  const editing = !!id;
  const { showToast, feedback } = useApp();

  const [name, setName] = useState('');
  const [group, setGroup] = useState(GROUPS[0]);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('0');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Editar exercício' : 'Novo exercício' });
    if (!editing) return;
    (async () => {
      const ex = await getExercise(id);
      if (!ex) return;
      setName(ex.name);
      setGroup(ex.muscle_group);
      setSets(String(ex.sets));
      setReps(String(ex.reps));
      setWeight(String(ex.weight).replace('.', ','));
      setNotes(ex.notes || '');
      setPhoto(ex.photo);
    })();
  }, [id, editing, navigation]);

  const validate = () => {
    const e = {};
    if (name.trim().length < 2) e.name = 'Informe um nome com pelo menos 2 letras.';
    const s = parseNumber(sets);
    const r = parseNumber(reps);
    const w = parseNumber(weight || '0');
    if (!Number.isInteger(s) || s < 1 || s > 20) e.sets = 'Use um número inteiro de 1 a 20.';
    if (!Number.isInteger(r) || r < 1 || r > 200) e.reps = 'Use um número inteiro de 1 a 200.';
    if (Number.isNaN(w) || w < 0 || w > 1000) e.weight = 'Peso inválido (0 a 1000).';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) {
      feedback.error();
      showToast('Corrija os campos destacados', 'error');
      return;
    }
    setSaving(true);
    const data = {
      name: name.trim(),
      muscle_group: group,
      sets: parseNumber(sets),
      reps: parseNumber(reps),
      weight: parseNumber(weight || '0'),
      notes: notes.trim(),
      photo,
    };
    try {
      if (editing) await updateExercise(id, data);
      else await createExercise(data);
      feedback.success();
      showToast(editing ? 'Exercício atualizado!' : 'Exercício criado!');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar', 'error');
      setSaving(false);
    }
  };

  const remove = () => {
    Alert.alert('Remover exercício', `Deseja remover "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          await deleteExercise(id);
          feedback.success();
          showToast('Exercício removido');
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
      <TouchableOpacity activeOpacity={0.85} onPress={() => chooseImage(setPhoto)} style={styles.photoBox}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <View style={styles.photoEmpty}>
            <Ionicons name="camera-outline" size={36} color={colors.muted} />
            <Text style={styles.photoText}>Adicionar foto do exercício</Text>
          </View>
        )}
      </TouchableOpacity>
      {photo ? (
        <Button
          title="Remover foto"
          variant="ghost"
          icon="close"
          onPress={() => setPhoto(null)}
          style={{ marginBottom: spacing.md }}
        />
      ) : null}

      <Field label="Nome" value={name} onChangeText={setName} placeholder="Ex.: Supino inclinado" error={errors.name} />

      <Text style={styles.label}>Grupo muscular</Text>
      <View style={styles.chips}>
        {GROUPS.map((g) => (
          <Chip key={g} label={g} active={group === g} onPress={() => setGroup(g)} />
        ))}
      </View>

      <View style={styles.row}>
        <Field label="Séries" value={sets} onChangeText={setSets} keyboardType="number-pad" style={{ flex: 1 }} error={errors.sets} />
        <View style={{ width: spacing.md }} />
        <Field label="Repetições" value={reps} onChangeText={setReps} keyboardType="number-pad" style={{ flex: 1 }} error={errors.reps} />
        <View style={{ width: spacing.md }} />
        <Field label="Carga (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" style={{ flex: 1 }} error={errors.weight} />
      </View>

      <Field label="Observações" value={notes} onChangeText={setNotes} placeholder="Dicas de execução, ajustes da máquina..." multiline />

      <Button title={editing ? 'Salvar alterações' : 'Criar exercício'} icon="checkmark" onPress={save} disabled={saving} />
      {editing ? (
        <Button title="Excluir exercício" icon="trash-outline" variant="danger" onPress={remove} style={{ marginTop: spacing.md }} />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  photoBox: {
    height: 180,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: spacing.md,
  },
  photo: { width: '100%', height: '100%' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoText: { color: colors.muted, marginTop: 8 },
  label: { color: colors.muted, fontSize: 13, marginBottom: 8, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  row: { flexDirection: 'row' },
});
