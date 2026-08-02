import { useEffect, useState } from 'react';
import { api } from '../api';

function TemplateEditor({ initial, exercises, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [selected, setSelected] = useState(initial?.exercises.map((e) => e.exercise_id) || []);

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function selectedFirst(a, b) {
    const aSel = selected.includes(a.id);
    const bSel = selected.includes(b.id);
    if (aSel === bSel) return a.name.localeCompare(b.name);
    return aSel ? -1 : 1;
  }

  return (
    <div className="card">
      <div className="field" style={{ marginBottom: '0.8rem' }}>
        <label>Name der Vorlage</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Push Day" />
      </div>
      <p className="muted" style={{ marginBottom: '0.4rem' }}>Übungen auswählen</p>
      <div className="row wrap" style={{ marginBottom: '0.9rem' }}>
        {exercises.length === 0 && <p className="muted">Erst unter "Übungen" welche anlegen.</p>}
        {[...exercises].sort(selectedFirst).map((ex) => (
          <span
            key={ex.id}
            className="tag"
            style={{
              cursor: 'pointer',
              borderColor: selected.includes(ex.id) ? 'var(--accent)' : 'var(--border)',
              color: selected.includes(ex.id) ? 'var(--accent)' : 'var(--text-dim)',
            }}
            onClick={() => toggle(ex.id)}
          >
            {selected.includes(ex.id) ? '✓ ' : ''}
            {ex.name}
          </span>
        ))}
      </div>
      <div className="row">
        <button type="button" disabled={!name.trim()} onClick={() => onSave(name.trim(), selected)}>
          Speichern
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    Promise.all([api.getTemplates(), api.getExercises()])
      .then(([t, e]) => {
        setTemplates(t);
        setExercises(e);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function handleCreate(name, exerciseIds) {
    api
      .createTemplate(name, exerciseIds)
      .then(() => {
        setCreating(false);
        load();
      })
      .catch((e) => setError(e.message));
  }

  function handleUpdate(id, name, exerciseIds) {
    api
      .updateTemplate(id, name, exerciseIds)
      .then(() => {
        setEditingId(null);
        load();
      })
      .catch((e) => setError(e.message));
  }

  function handleDelete(id) {
    if (!confirm('Vorlage wirklich löschen? Vergangene Trainings bleiben erhalten.')) return;
    api
      .deleteTemplate(id)
      .then(load)
      .catch((e) => setError(e.message));
  }

  return (
    <div>
      <h2>Trainingstag-Vorlagen</h2>
      {error && <div className="error-banner">{error}</div>}

      {!creating && (
        <button type="button" style={{ marginBottom: '1rem' }} onClick={() => setCreating(true)}>
          + Neue Vorlage
        </button>
      )}

      {creating && (
        <TemplateEditor exercises={exercises} onSave={handleCreate} onCancel={() => setCreating(false)} />
      )}

      {loading && <p className="muted">Lädt...</p>}
      {!loading && templates.length === 0 && !creating && <p className="muted">Noch keine Vorlagen angelegt.</p>}

      {templates.map((t) =>
        editingId === t.id ? (
          <TemplateEditor
            key={t.id}
            initial={t}
            exercises={exercises}
            onSave={(name, ids) => handleUpdate(t.id, name, ids)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div className="card" key={t.id}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <strong>{t.name}</strong>
              <div className="row">
                <button type="button" className="secondary" onClick={() => setEditingId(t.id)}>
                  Bearbeiten
                </button>
                <button type="button" className="danger" onClick={() => handleDelete(t.id)}>
                  Löschen
                </button>
              </div>
            </div>
            <div className="row wrap">
              {t.exercises.length === 0 && <span className="muted">Keine Übungen zugewiesen</span>}
              {t.exercises.map((e) => (
                <span className="tag" key={e.template_exercise_id}>
                  {e.name}
                </span>
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  );
}
