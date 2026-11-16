import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';

/* ---------- Botão ---------- */
export function Button({ title, onPress, variant = 'primary', icon, disabled, style }) {
  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'accent'
      ? colors.accent
      : variant === 'danger'
      ? colors.danger
      : 'transparent';
  const textColor = variant === 'accent' ? '#06231D' : colors.text;
  const border = variant === 'ghost' ? { borderWidth: 1, borderColor: colors.border } : null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { backgroundColor: bg, opacity: disabled ? 0.45 : 1 }, border, style]}
    >
      {icon ? <Ionicons name={icon} size={20} color={textColor} style={{ marginRight: 8 }} /> : null}
      <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

/* ---------- Cartão ---------- */
export function Card({ children, style, onPress, onLongPress }) {
  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onLongPress={onLongPress}
        style={[styles.card, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

/* ---------- Chip de filtro ---------- */
export function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.chip,
        active && { backgroundColor: colors.primary, borderColor: colors.primary },
      ]}
    >
      <Text style={[styles.chipText, active && { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ---------- Campo de texto com rótulo e erro ---------- */
export function Field({ label, error, style, ...props }) {
  return (
    <View style={[{ marginBottom: spacing.md }, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        {...props}
        style={[
          styles.input,
          props.multiline && { minHeight: 80, textAlignVertical: 'top' },
          error && { borderColor: colors.danger },
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

/* ---------- Estado vazio (com imagem) ---------- */
export function EmptyState({ title, text, actionLabel, onAction }) {
  return (
    <View style={styles.empty}>
      <Image source={require('../../assets/empty.png')} style={styles.emptyImage} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {text ? <Text style={styles.emptyText}>{text}</Text> : null}
      {actionLabel ? (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: spacing.lg }} />
      ) : null}
    </View>
  );
}

/* ---------- Caixa de estatística ---------- */
export function StatBox({ icon, value, label, color = colors.primary }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ---------- Título de seção ---------- */
export function SectionTitle({ children, style }) {
  return <Text style={[styles.sectionTitle, style]}>{children}</Text>;
}

/* ---------- Linha horizontal de chips ---------- */
export function ChipRow({ children }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}
      style={{ flexGrow: 0 }}
    >
      {children}
    </ScrollView>
  );
}

/* ---------- Botão flutuante ---------- */
export function Fab({ icon = 'add', onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.fab}>
      <Ionicons name={icon} size={30} color="#fff" />
    </TouchableOpacity>
  );
}

/* ---------- Botão de ícone pequeno ---------- */
export function IconButton({ name, onPress, color = colors.muted, size = 22 }) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={10} style={{ padding: 6 }}>
      <Ionicons name={name} size={size} color={color} />
    </TouchableOpacity>
  );
}

/* ---------- Seletor numérico (- valor +) ---------- */
export function Stepper({ value, onChange, min = 0, max = 999, step = 1, format }) {
  const dec = () => onChange(Math.max(min, Math.round((value - step) * 100) / 100));
  const inc = () => onChange(Math.min(max, Math.round((value + step) * 100) / 100));
  return (
    <View style={styles.stepper}>
      <TouchableOpacity onPress={dec} style={styles.stepBtn}>
        <Ionicons name="remove" size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.stepValue}>{format ? format(value) : value}</Text>
      <TouchableOpacity onPress={inc} style={styles.stepBtn}>
        <Ionicons name="add" size={22} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.md,
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipText: { color: colors.muted, fontWeight: '600' },
  label: { color: colors.muted, fontSize: 13, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
  empty: { alignItems: 'center', padding: spacing.xl, marginTop: spacing.xl },
  emptyImage: { width: 160, height: 160, marginBottom: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: 6 },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 6 },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 2, textAlign: 'center' },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    minWidth: 56,
    textAlign: 'center',
  },
});
