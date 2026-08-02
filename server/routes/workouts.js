const express = require('express');
const db = require('../db');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

async function getWorkoutDetail(id) {
  const workout = await db.get('SELECT id, date, template_id, name, created_at FROM workouts WHERE id = ?', [id]);
  if (!workout) return null;
  const exercises = await db.all(
    `SELECT we.id AS workout_exercise_id, e.id AS exercise_id, e.name AS name, we.position AS position
     FROM workout_exercises we
     JOIN exercises e ON e.id = we.exercise_id
     WHERE we.workout_id = ?
     ORDER BY we.position ASC`,
    [id],
  );
  await Promise.all(
    exercises.map(async (ex) => {
      ex.sets = await db.all(
        'SELECT id, weight, reps, note, position FROM sets WHERE workout_exercise_id = ? ORDER BY position ASC',
        [ex.workout_exercise_id],
      );
    }),
  );
  return { ...workout, exercises };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await db.all('SELECT id, date, template_id, name, created_at FROM workouts ORDER BY date DESC, id DESC');
    res.json(rows);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const workout = await getWorkoutDetail(req.params.id);
    if (!workout) return res.status(404).json({ error: 'Training nicht gefunden' });
    res.json(workout);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const date = req.body.date || new Date().toISOString().slice(0, 10);
    const templateId = req.body.template_id || null;
    const name = (req.body.name || '').trim() || 'Training';
    const exerciseIds = Array.isArray(req.body.exerciseIds) ? req.body.exerciseIds : [];

    const info = await db.run('INSERT INTO workouts (date, template_id, name) VALUES (?, ?, ?)', [date, templateId, name]);
    if (exerciseIds.length > 0) {
      await db.batch(
        exerciseIds.map((exerciseId, index) => ({
          sql: 'INSERT INTO workout_exercises (workout_id, exercise_id, position) VALUES (?, ?, ?)',
          args: [info.lastInsertRowid, exerciseId, index],
        })),
      );
    }
    res.status(201).json(await getWorkoutDetail(info.lastInsertRowid));
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await db.run('DELETE FROM workouts WHERE id = ?', [req.params.id]);
    res.status(204).end();
  }),
);

router.post(
  '/:id/exercises',
  asyncHandler(async (req, res) => {
    const exerciseId = req.body.exercise_id;
    if (!exerciseId) return res.status(400).json({ error: 'exercise_id ist erforderlich' });
    const maxPosRow = await db.get('SELECT COALESCE(MAX(position), -1) AS m FROM workout_exercises WHERE workout_id = ?', [
      req.params.id,
    ]);
    await db.run('INSERT INTO workout_exercises (workout_id, exercise_id, position) VALUES (?, ?, ?)', [
      req.params.id,
      exerciseId,
      maxPosRow.m + 1,
    ]);
    res.status(201).json(await getWorkoutDetail(req.params.id));
  }),
);

router.delete(
  '/:id/exercises/:weId',
  asyncHandler(async (req, res) => {
    await db.run('DELETE FROM workout_exercises WHERE id = ? AND workout_id = ?', [req.params.weId, req.params.id]);
    res.json(await getWorkoutDetail(req.params.id));
  }),
);

router.post(
  '/:id/exercises/:weId/sets',
  asyncHandler(async (req, res) => {
    const { weight, reps, note } = req.body;
    if (weight === undefined || reps === undefined) {
      return res.status(400).json({ error: 'Gewicht und Wiederholungen sind erforderlich' });
    }
    const maxPosRow = await db.get('SELECT COALESCE(MAX(position), -1) AS m FROM sets WHERE workout_exercise_id = ?', [
      req.params.weId,
    ]);
    await db.run('INSERT INTO sets (workout_exercise_id, weight, reps, note, position) VALUES (?, ?, ?, ?, ?)', [
      req.params.weId,
      weight,
      reps,
      note || null,
      maxPosRow.m + 1,
    ]);
    res.status(201).json(await getWorkoutDetail(req.params.id));
  }),
);

module.exports = router;
