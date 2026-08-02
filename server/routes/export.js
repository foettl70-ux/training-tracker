const express = require('express');
const db = require('../db');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function toRow(values) {
  return values.map(csvEscape).join(',') + '\r\n';
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const header = ['type', 'date', 'training_name', 'exercise', 'set_number', 'weight_kg', 'reps', 'volume_kg', 'note'];
    let csv = toRow(header);

    const setRows = await db.all(`
      SELECT w.date AS date, w.name AS training_name, e.name AS exercise,
             s.position AS position, s.weight AS weight, s.reps AS reps, s.note AS note
      FROM sets s
      JOIN workout_exercises we ON we.id = s.workout_exercise_id
      JOIN workouts w ON w.id = we.workout_id
      JOIN exercises e ON e.id = we.exercise_id
      ORDER BY w.date ASC, w.id ASC, we.position ASC, s.position ASC
    `);

    setRows.forEach((r) => {
      csv += toRow(['training', r.date, r.training_name, r.exercise, r.position + 1, r.weight, r.reps, r.weight * r.reps, r.note]);
    });

    const bwRows = await db.all('SELECT date, weight FROM bodyweight ORDER BY date ASC');
    bwRows.forEach((r) => {
      csv += toRow(['bodyweight', r.date, '', '', '', r.weight, '', '', '']);
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="training-export-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('﻿' + csv);
  }),
);

module.exports = router;
