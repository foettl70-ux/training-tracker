const express = require('express');
const db = require('../db');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await db.all('SELECT id, name, created_at FROM exercises WHERE deleted_at IS NULL ORDER BY name COLLATE NOCASE');
    res.json(rows);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Name ist erforderlich' });
    const info = await db.run('INSERT INTO exercises (name) VALUES (?)', [name]);
    const row = await db.get('SELECT id, name, created_at FROM exercises WHERE id = ?', [info.lastInsertRowid]);
    res.status(201).json(row);
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Name ist erforderlich' });
    await db.run('UPDATE exercises SET name = ? WHERE id = ?', [name, req.params.id]);
    const row = await db.get('SELECT id, name, created_at FROM exercises WHERE id = ?', [req.params.id]);
    res.json(row);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await db.run("UPDATE exercises SET deleted_at = datetime('now') WHERE id = ?", [req.params.id]);
    res.status(204).end();
  }),
);

router.get(
  '/:id/history',
  asyncHandler(async (req, res) => {
    const rows = await db.all(
      `SELECT w.id AS workout_id, w.date AS date, s.weight AS weight, s.reps AS reps, s.note AS note
       FROM sets s
       JOIN workout_exercises we ON we.id = s.workout_exercise_id
       JOIN workouts w ON w.id = we.workout_id
       WHERE we.exercise_id = ?
       ORDER BY w.date ASC, w.id ASC, s.position ASC`,
      [req.params.id],
    );
    res.json(rows);
  }),
);

module.exports = router;
