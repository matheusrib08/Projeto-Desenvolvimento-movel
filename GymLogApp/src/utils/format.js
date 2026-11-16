export const pad = (n) => String(n).padStart(2, '0');

export function formatDuration(totalSec) {
  const sec = Math.max(0, Math.floor(totalSec || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function formatDate(iso) {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatDateTime(iso) {
  const d = new Date(iso);
  return `${formatDate(iso)} às ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Aceita "12,5" ou "12.5". Retorna NaN se inválido.
export function parseNumber(text) {
  const n = parseFloat(String(text).replace(',', '.'));
  return Number.isNaN(n) ? NaN : n;
}

export function formatKg(n) {
  const v = Number(n) || 0;
  return Number.isInteger(v) ? `${v}` : v.toFixed(1).replace('.', ',');
}

export function dayKey(dateLike) {
  const d = new Date(dateLike);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}
