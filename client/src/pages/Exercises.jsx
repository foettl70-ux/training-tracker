import { useEffect, useState } from 'react';
import { api } from '../api';

export default function ExercisesPage() {
  const [exercises, setExercises] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    api
      .getExercises()
      .then(setExercises)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    api
      .createExercise(name.trim())
      .then(() => {
        setName('');
        load();
      })
      .catch((e) => setError(e.message));
  }

  function handleDelete(id) {
    if (!confirm('Übung wirklich löschen? Vergangene Trainings bleiben erhalten.')) return;
    api
      .deleteExercise(id)
      .then(load)
      .catch((e) => setError(e.message));
  }

  function startEdit(ex) {
    setEditingId(ex.id);
    setEditingName(ex.name);
  }

  function saveEdit(id) {
    if (!editingName.trim()) return;
    api
      .updateExercise(id, editingName.trim())
      .then(() => {
        setEditingId(null);
        load();
      })
      .catch((e) => setError(e.message));
  }

  return (
    <div>
      <h2>Übungen</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <form className="row" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Neue Übung, z. B. Bankdrücken"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit">Hinzufügen</button>
        </form>
      </div>

      <div className="card">
        {loading && <p className="muted">Lädt...</p>}
        {!loading && exercises.length === 0 && <p className="muted">Noch keine Übungen angelegt.</p>}
        {exercises.map((ex) => (
          <div className="list-item" key={ex.id}>
            {editingId === ex.id ? (
              <form
                className="row"
                style={{ flex: 1 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  saveEdit(ex.id);
                }}
              >
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  autoFocus
                />
                <button type="submit">Speichern</button>
                <button type="button" className="secondary" onClick={() => setEditingId(null)}>
                  Abbrechen
                </button>
              </form>
            ) : (
              <>
                <span>{ex.name}</span>
                <div className="row">
                  <button type="button" className="secondary" onClick={() => startEdit(ex)}>
                    Umbenennen
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(ex.id)}>
                    Löschen
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
