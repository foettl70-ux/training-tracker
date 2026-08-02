const express = require('express');
const db = require('../db');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await db.all('SELECT id, date, weight FROM bodyweight ORDER BY date ASC');
    res.json(rows);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { date, weight } = req.body;
    if (!date || weight === undefined) return res.status(400).json({ error: 'Datum und Gewicht sind erforderlich' });
    const existing = await db.get('SELECT id FROM bodyweight WHERE date = ?', [date]);
    if (existing) {
      await db.run('UPDATE bodyweight SET weight = ? WHERE id = ?', [weight, existing.id]);
      return res.json(await db.get('SELECT id, date, weight FROM bodyweight WHERE id = ?', [existing.id]));
    }
    const info = await db.run('INSERT INTO bodyweight (date, weight) VALUES (?, ?)', [date, weight]);
    res.status(201).json(await db.get('SELECT id, date, weight FROM bodyweight WHERE id = ?', [info.lastInsertRowid]));
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await db.run('DELETE FROM bodyweight WHERE id = ?', [req.params.id]);
    res.status(204).end();
  }),
);

module.exports = router;
