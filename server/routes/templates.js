const express = require('express');
const db = require('../db');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

async function getTemplateWithExercises(id) {
  const template = await db.get('SELECT id, name, created_at FROM templates WHERE id = ?', [id]);
  if (!template) return null;
  const exercises = await db.all(
    `SELECT te.id AS template_exercise_id, e.id AS exercise_id, e.name AS name
     FROM template_exercises te
     JOIN exercises e ON e.id = te.exercise_id
     WHERE te.template_id = ?
     ORDER BY te.position ASC`,
    [id],
  );
  return { ...template, exercises };
}

async function upsertExercises(templateId, exerciseIds) {
  const statements = [{ sql: 'DELETE FROM template_exercises WHERE template_id = ?', args: [templateId] }];
  exerciseIds.forEach((exerciseId, index) => {
    statements.push({
      sql: 'INSERT INTO template_exercises (template_id, exercise_id, position) VALUES (?, ?, ?)',
      args: [templateId, exerciseId, index],
    });
  });
  await db.batch(statements);
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const templates = await db.all('SELECT id FROM templates WHERE deleted_at IS NULL ORDER BY name COLLATE NOCASE');
    const result = await Promise.all(templates.map((t) => getTemplateWithExercises(t.id)));
    res.json(result);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const template = await getTemplateWithExercises(req.params.id);
    if (!template) return res.status(404).json({ error: 'Vorlage nicht gefunden' });
    res.json(template);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const name = (req.body.name || '').trim();
    const exerciseIds = Array.isArray(req.body.exerciseIds) ? req.body.exerciseIds : [];
    if (!name) return res.status(400).json({ error: 'Name ist erforderlich' });
    const info = await db.run('INSERT INTO templates (name) VALUES (?)', [name]);
    await upsertExercises(info.lastInsertRowid, exerciseIds);
    res.status(201).json(await getTemplateWithExercises(info.lastInsertRowid));
  }),
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const name = (req.body.name || '').trim();
    const exerciseIds = Array.isArray(req.body.exerciseIds) ? req.body.exerciseIds : [];
    if (!name) return res.status(400).json({ error: 'Name ist erforderlich' });
    await db.run('UPDATE templates SET name = ? WHERE id = ?', [name, req.params.id]);
    await upsertExercises(req.params.id, exerciseIds);
    res.json(await getTemplateWithExercises(req.params.id));
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await db.run("UPDATE templates SET deleted_at = datetime('now') WHERE id = ?", [req.params.id]);
    res.status(204).end();
  }),
);

module.exports = router;
