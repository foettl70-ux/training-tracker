const express = require('express');
const db = require('../db');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await db.all('SELECT id, date, note FROM skip_days ORDER BY date ASC');
    res.json(rows);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { date, note } = req.body;
    if (!date) return res.status(400).json({ error: 'Datum ist erforderlich' });
    const existing = await db.get('SELECT id FROM skip_days WHERE date = ?', [date]);
    if (existing) {
      await db.run('UPDATE skip_days SET note = ? WHERE id = ?', [note || null, existing.id]);
      return res.json(await db.get('SELECT id, date, note FROM skip_days WHERE id = ?', [existing.id]));
    }
    const info = await db.run('INSERT INTO skip_days (date, note) VALUES (?, ?)', [date, note || null]);
    res.status(201).json(await db.get('SELECT id, date, note FROM skip_days WHERE id = ?', [info.lastInsertRowid]));
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await db.run('DELETE FROM skip_days WHERE id = ?', [req.params.id]);
    res.status(204).end();
  }),
);

module.exports = router;
