import * as SQLite from 'expo-sqlite';
import { dayKey } from '../utils/format';

/* ------------------------------------------------------------------ *
 *  Conexão + criação das tabelas
 * ------------------------------------------------------------------ */
let dbPromise = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('gymlog.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS exercises (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          muscle_group TEXT NOT NULL,
          sets INTEGER NOT NULL DEFAULT 3,
          reps INTEGER NOT NULL DEFAULT 10,
          weight REAL NOT NULL DEFAULT 0,
          notes TEXT,
          photo TEXT,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS workouts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          started_at TEXT NOT NULL,
          duration_sec INTEGER NOT NULL DEFAULT 0,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS workout_sets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
          exercise_id INTEGER,
          exercise_name TEXT NOT NULL,
          set_number INTEGER NOT NULL,
          reps INTEGER NOT NULL,
          weight REAL NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS body_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          weight REAL NOT NULL,
          note TEXT,
          photo TEXT
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

/* ------------------------------------------------------------------ *
 *  Configurações
 * ------------------------------------------------------------------ */
export const DEFAULT_SETTINGS = {
  userName: 'Atleta',
  weeklyGoal: 3,
  restSeconds: 60,
  shake: true,
  shakeThreshold: 2.0,
  haptics: true,
};

export async function loadSettings() {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT key, value FROM settings');
  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (!(row.key in DEFAULT_SETTINGS)) continue;
    const def = DEFAULT_SETTINGS[row.key];
    if (typeof def === 'boolean') settings[row.key] = row.value === '1';
    else if (typeof def === 'number') settings[row.key] = Number(row.value);
    else settings[row.key] = row.value;
  }
  return settings;
}

export async function saveSetting(key, value) {
  const db = await getDb();
  const v = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, v]
  );
}

/* ------------------------------------------------------------------ *
 *  Exercícios (CRUD completo)
 * ------------------------------------------------------------------ */
const SEED_EXERCISES = [
  ['Supino reto', 'Peito', 4, 10, 40, 'Mantenha as escápulas firmes no banco.'],
  ['Remada curvada', 'Costas', 4, 10, 30, 'Coluna neutra, puxe até o abdômen.'],
  ['Agachamento livre', 'Pernas', 4, 12, 50, 'Joelhos alinhados com os pés.'],
  ['Desenvolvimento militar', 'Ombros', 3, 10, 20, ''],
  ['Rosca direta', 'Braços', 3, 12, 15, 'Sem balançar o tronco.'],
  ['Abdominal infra', 'Abdômen', 3, 15, 0, ''],
];

export async function seedExercises(force = false) {
  const db = await getDb();
  if (!force) {
    const flag = await db.getFirstAsync("SELECT value FROM settings WHERE key = 'seeded'");
    if (flag) return;
  }
  const now = new Date().toISOString();
  for (const [name, group, sets, reps, weight, notes] of SEED_EXERCISES) {
    await db.runAsync(
      'INSERT INTO exercises (name, muscle_group, sets, reps, weight, notes, photo, created_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?)',
      [name, group, sets, reps, weight, notes, now]
    );
  }
  await db.runAsync(
    "INSERT INTO settings (key, value) VALUES ('seeded', '1') ON CONFLICT(key) DO UPDATE SET value = '1'"
  );
}

export async function initDatabase() {
  await getDb();
  await seedExercises(false);
}

export async function listExercises() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM exercises ORDER BY name COLLATE NOCASE');
}

export async function getExercise(id) {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM exercises WHERE id = ?', [id]);
}

export async function getExercisesByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT * FROM exercises WHERE id IN (${ids.map(() => '?').join(',')})`,
    ids
  );
  // mantém a ordem escolhida pelo usuário
  return ids.map((id) => rows.find((r) => r.id === id)).filter(Boolean);
}

export async function createExercise(e) {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO exercises (name, muscle_group, sets, reps, weight, notes, photo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [e.name, e.muscle_group, e.sets, e.reps, e.weight, e.notes || '', e.photo || null, new Date().toISOString()]
  );
  return res.lastInsertRowId;
}

export async function updateExercise(id, e) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE exercises SET name = ?, muscle_group = ?, sets = ?, reps = ?, weight = ?, notes = ?, photo = ? WHERE id = ?',
    [e.name, e.muscle_group, e.sets, e.reps, e.weight, e.notes || '', e.photo || null, id]
  );
}

export async function deleteExercise(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM exercises WHERE id = ?', [id]);
}

/* ------------------------------------------------------------------ *
 *  Treinos realizados
 * ------------------------------------------------------------------ */
export async function saveWorkout({ durationSec, sets }) {
  const db = await getDb();
  let workoutId = null;
  await db.withTransactionAsync(async () => {
    const startedAt = new Date(Date.now() - durationSec * 1000).toISOString();
    const res = await db.runAsync(
      'INSERT INTO workouts (started_at, duration_sec, notes) VALUES (?, ?, ?)',
      [startedAt, durationSec, '']
    );
    workoutId = res.lastInsertRowId;
    for (const s of sets) {
      await db.runAsync(
        'INSERT INTO workout_sets (workout_id, exercise_id, exercise_name, set_number, reps, weight) VALUES (?, ?, ?, ?, ?, ?)',
        [workoutId, s.exerciseId, s.name, s.setNumber, s.reps, s.weight]
      );
    }
  });
  return workoutId;
}

const WORKOUT_SELECT = `
  SELECT w.*,
    COALESCE((SELECT SUM(reps) FROM workout_sets WHERE workout_id = w.id), 0) AS total_reps,
    COALESCE((SELECT SUM(reps * weight) FROM workout_sets WHERE workout_id = w.id), 0) AS volume,
    COALESCE((SELECT COUNT(DISTINCT exercise_name) FROM workout_sets WHERE workout_id = w.id), 0) AS exercise_count,
    COALESCE((SELECT COUNT(*) FROM workout_sets WHERE workout_id = w.id), 0) AS set_count
  FROM workouts w
`;

export async function listWorkouts(limit) {
  const db = await getDb();
  const sql = `${WORKOUT_SELECT} ORDER BY w.started_at DESC${limit ? ' LIMIT ' + Number(limit) : ''}`;
  return db.getAllAsync(sql);
}

export async function getWorkout(id) {
  const db = await getDb();
  return db.getFirstAsync(`${WORKOUT_SELECT} WHERE w.id = ?`, [id]);
}

export async function getWorkoutSets(workoutId) {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM workout_sets WHERE workout_id = ? ORDER BY id ASC', [workoutId]);
}

export async function updateWorkoutNotes(id, notes) {
  const db = await getDb();
  await db.runAsync('UPDATE workouts SET notes = ? WHERE id = ?', [notes, id]);
}

export async function deleteWorkout(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
}

/* ------------------------------------------------------------------ *
 *  Estatísticas para a Home
 * ------------------------------------------------------------------ */
const WEEK_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export async function getStats() {
  const workouts = await listWorkouts();

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7)); // segunda-feira

  const weekCount = workouts.filter((w) => new Date(w.started_at) >= weekStart).length;
  const totalReps = workouts.reduce((acc, w) => acc + w.total_reps, 0);
  const totalMinutes = Math.round(workouts.reduce((acc, w) => acc + w.duration_sec, 0) / 60);

  const counts = {};
  workouts.forEach((w) => {
    const k = dayKey(w.started_at);
    counts[k] = (counts[k] || 0) + 1;
  });

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7.push({ label: WEEK_LABELS[d.getDay()], count: counts[dayKey(d)] || 0 });
  }

  return { weekCount, totalWorkouts: workouts.length, totalReps, totalMinutes, last7 };
}

/* ------------------------------------------------------------------ *
 *  Registros corporais (CRUD completo)
 * ------------------------------------------------------------------ */
export async function listBodyLogs() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM body_logs ORDER BY date DESC, id DESC');
}

export async function createBodyLog({ weight, note, photo }) {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO body_logs (date, weight, note, photo) VALUES (?, ?, ?, ?)',
    [new Date().toISOString(), weight, note || '', photo || null]
  );
  return res.lastInsertRowId;
}

export async function updateBodyLog(id, { weight, note, photo }) {
  const db = await getDb();
  await db.runAsync('UPDATE body_logs SET weight = ?, note = ?, photo = ? WHERE id = ?', [
    weight,
    note || '',
    photo || null,
    id,
  ]);
}

export async function deleteBodyLog(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM body_logs WHERE id = ?', [id]);
}

/* ------------------------------------------------------------------ *
 *  Resetar tudo
 * ------------------------------------------------------------------ */
export async function resetAllData() {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM workout_sets');
    await db.runAsync('DELETE FROM workouts');
    await db.runAsync('DELETE FROM body_logs');
    await db.runAsync('DELETE FROM exercises');
  });
  await seedExercises(true);
}
