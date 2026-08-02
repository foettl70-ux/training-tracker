import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

function SetRow({ set, onSave, onDelete }) {
  const [weight, setWeight] = useState(set.weight);
  const [reps, setReps] = useState(set.reps);
  const [note, setNote] = useState(set.note || '');
  const [dirty, setDirty] = useState(false);

  function commit() {
    if (!dirty) return;
    onSave(set.id, { weight: Number(weight), reps: Number(reps), note });
    setDirty(false);
  }

  return (
    <div className="set-row">
      <span className="set-index">#{set.position + 1}</span>
      <input
        type="number"
        step="0.5"
        min="0"
        value={weight}
        onChange={(e) => {
          setWeight(e.target.value);
          setDirty(true);
        }}
        onBlur={commit}
      />
      <input
        type="number"
        min="0"
        value={reps}
        onChange={(e) => {
          setReps(e.target.value);
          setDirty(true);
        }}
        onBlur={commit}
      />
      <input
        type="text"
        placeholder="Notiz (optional)"
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setDirty(true);
        }}
        onBlur={commit}
      />
      <button type="button" className="danger" onClick={() => onDelete(set.id)}>
        ✕
      </button>
    </div>
  );
}

function ExerciseBlock({ workoutId, exercise, onChange }) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  function addSet(e) {
    e.preventDefault();
    if (weight === '' || reps === '') return;
    api
      .addSet(workoutId, exercise.workout_exercise_id, { weight: Number(weight), reps: Number(reps), note: note || undefined })
      .then((w) => {
        setWeight('');
        setReps('');
        setNote('');
        onChange(w);
      })
      .catch((e) => setError(e.message));
  }

  function saveSet(setId, data) {
    api
      .updateSet(setId, data)
      .then(() => api.getWorkout(workoutId))
      .then(onChange)
      .catch((e) => setError(e.message));
  }

  function deleteSet(setId) {
    api
      .deleteSet(setId)
      .then(() => api.getWorkout(workoutId))
      .then(onChange)
      .catch((e) => setError(e.message));
  }

  function removeExercise() {
    if (!confirm(`"${exercise.name}" aus diesem Training entfernen? Alle erfassten Sätze gehen verloren.`)) return;
    api.removeExerciseFromWorkout(workoutId, exercise.workout_exercise_id).then(onChange).catch((e) => setError(e.message));
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong>{exercise.name}</strong>
        <button type="button" className="danger" onClick={removeExercise}>
          Übung entfernen
        </button>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {exercise.sets.length > 0 && (
        <div className="set-row muted" style={{ fontSize: '0.8rem' }}>
          <span></span>
          <span>kg</span>
          <span>Wdh.</span>
          <span>Notiz</span>
          <span></span>
        </div>
      )}
      {exercise.sets.map((s) => (
        <SetRow key={s.id} set={s} onSave={saveSet} onDelete={deleteSet} />
      ))}
      <form className="set-row" onSubmit={addSet} style={{ marginTop: '0.4rem' }}>
        <span className="set-index muted">neu</span>
        <input type="number" step="0.5" min="0" placeholder="kg" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <input type="number" min="0" placeholder="Wdh." value={reps} onChange={(e) => setReps(e.target.value)} />
        <input type="text" placeholder="Notiz (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button type="submit">+ Satz</button>
      </form>
    </div>
  );
}

export default function WorkoutDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [allExercises, setAllExercises] = useState([]);
  const [addExerciseId, setAddExerciseId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [id]);

  function load() {
    setLoading(true);
    Promise.all([api.getWorkout(id), api.getExercises()])
      .then(([w, e]) => {
        setWorkout(w);
        setAllExercises(e);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function handleAddExercise(e) {
    e.preventDefault();
    if (!addExerciseId) return;
    api
      .addExerciseToWorkout(id, Number(addExerciseId))
      .then((w) => {
        setWorkout(w);
        setAddExerciseId('');
      })
      .catch((e) => setError(e.message));
  }

  if (loading) return <p className="muted">Lädt...</p>;
  if (!workout) return <p className="error-banner">Training nicht gefunden.</p>;

  const availableExercises = allExercises.filter(
    (e) => !workout.exercises.some((we) => we.exercise_id === e.id),
  );

  return (
    <div>
      <Link to="/training" className="muted" style={{ textDecoration: 'none' }}>
        ← Zurück
      </Link>
      <h2>
        {workout.name} <span className="muted" style={{ fontSize: '1rem' }}>— {workout.date}</span>
      </h2>
      {error && <div className="error-banner">{error}</div>}

      {workout.exercises.map((ex) => (
        <ExerciseBlock key={ex.workout_exercise_id} workoutId={id} exercise={ex} onChange={setWorkout} />
      ))}

      <div className="card">
        <form className="row" onSubmit={handleAddExercise}>
          <select value={addExerciseId} onChange={(e) => setAddExerciseId(e.target.value)}>
            <option value="">Übung spontan hinzufügen...</option>
            {availableExercises.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={!addExerciseId}>
            Hinzufügen
          </button>
        </form>
        {availableExercises.length === 0 && allExercises.length === 0 && (
          <p className="muted" style={{ marginTop: '0.5rem' }}>
            Noch keine Übungen angelegt — geh zu "Übungen".
          </p>
        )}
      </div>

      <button type="button" className="secondary" onClick={() => navigate('/training')}>
        Training abschließen
      </button>
    </div>
  );
}
