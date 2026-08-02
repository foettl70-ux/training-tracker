import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function TrainingPage() {
  const [templates, setTemplates] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [workoutName, setWorkoutName] = useState('');
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    Promise.all([api.getTemplates(), api.getWorkouts()])
      .then(([t, w]) => {
        setTemplates(t);
        setWorkouts(w);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function handleStart(e) {
    e.preventDefault();
    setStarting(true);
    const template = templates.find((t) => String(t.id) === String(templateId));
    const name = workoutName.trim() || template?.name || 'Training';
    const exerciseIds = template ? template.exercises.map((ex) => ex.exercise_id) : [];
    api
      .createWorkout({ date, template_id: template ? template.id : null, name, exerciseIds })
      .then((w) => navigate(`/training/${w.id}`))
      .catch((e) => {
        setError(e.message);
        setStarting(false);
      });
  }

  function handleDelete(id) {
    if (!confirm('Training wirklich löschen? Alle Sätze gehen verloren.')) return;
    api
      .deleteWorkout(id)
      .then(load)
      .catch((e) => setError(e.message));
  }

  return (
    <div>
      <h2>Training</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Neues Training starten</h3>
        <form onSubmit={handleStart}>
          <div className="row wrap" style={{ marginBottom: '0.7rem' }}>
            <div className="field">
              <label>Datum</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="field">
              <label>Vorlage</label>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                <option value="">Ohne Vorlage (leer starten)</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Name (optional)</label>
              <input
                type="text"
                placeholder={templates.find((t) => String(t.id) === String(templateId))?.name || 'Training'}
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" disabled={starting}>
            Training starten
          </button>
        </form>
      </div>

      <h3>Bisherige Trainings</h3>
      {loading && <p className="muted">Lädt...</p>}
      {!loading && workouts.length === 0 && <p className="muted">Noch keine Trainings erfasst.</p>}
      <div className="card">
        {workouts.map((w) => (
          <div className="list-item" key={w.id}>
            <div>
              <strong>{w.name}</strong> <span className="muted">— {w.date}</span>
            </div>
            <div className="row">
              <button type="button" className="secondary" onClick={() => navigate(`/training/${w.id}`)}>
                Öffnen
              </button>
              <button type="button" className="danger" onClick={() => handleDelete(w.id)}>
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
