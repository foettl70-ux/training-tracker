const express = require('express');
const db = require('../db');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { weight, reps, note } = req.body;
    if (weight === undefined || reps === undefined) {
      return res.status(400).json({ error: 'Gewicht und Wiederholungen sind erforderlich' });
    }
    await db.run('UPDATE sets SET weight = ?, reps = ?, note = ? WHERE id = ?', [weight, reps, note || null, req.params.id]);
    const row = await db.get('SELECT id, weight, reps, note, position FROM sets WHERE id = ?', [req.params.id]);
    res.json(row);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await db.run('DELETE FROM sets WHERE id = ?', [req.params.id]);
    res.status(204).end();
  }),
);

module.exports = router;
