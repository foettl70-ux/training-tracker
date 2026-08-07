import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

function formatSet(s) {
  return `${s.weight}kg×${s.reps}`;
}

function formatSets(sets) {
  return sets.map(formatSet).join(', ');
}

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
        inputMode="decimal"
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
        inputMode="numeric"
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
      <button type="button" className="danger icon-btn" onClick={() => onDelete(set.id)} aria-label="Satz löschen">
        ✕
      </button>
    </div>
  );
}

function HistoryPanel({ exerciseId }) {
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getExerciseHistory(exerciseId)
      .then((rows) => {
        const byWorkout = new Map();
        rows.forEach((r) => {
          if (!byWorkout.has(r.workout_id)) byWorkout.set(r.workout_id, { date: r.date, sets: [] });
          byWorkout.get(r.workout_id).sets.push(r);
        });
        const groups = Array.from(byWorkout.values()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
        setEntries(groups);
      })
      .catch((e) => setError(e.message));
  }, [exerciseId]);

  return (
    <div className="history-panel">
      {error && <div className="error-banner">{error}</div>}
      {entries === null && <p className="muted">Lädt...</p>}
      {entries?.length === 0 && <p className="muted">Noch keine früheren Trainings mit dieser Übung.</p>}
      {entries?.map((g) => (
        <div className="history-row" key={g.date}>
          <span className="muted">{g.date}</span>
          <span>{formatSets(g.sets)}</span>
        </div>
      ))}
    </div>
  );
}

function ExerciseBlock({ workoutId, exercise, onChange, onMoveUp, onMoveDown, isFirst, isLast }) {
  const suggestion =
    exercise.previousSets[exercise.sets.length] ??
    exercise.sets[exercise.sets.length - 1] ??
    exercise.previousSets[exercise.previousSets.length - 1] ??
    null;

  const [weight, setWeight] = useState(suggestion?.weight ?? '');
  const [reps, setReps] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setWeight(suggestion?.weight ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.workout_exercise_id, exercise.sets.length]);

  function addSet(e) {
    e.preventDefault();
    if (weight === '' || reps === '') return;
    api
      .addSet(workoutId, exercise.workout_exercise_id, { weight: Number(weight), reps: Number(reps), note: note || undefined })
      .then((w) => {
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
    <div className="card exercise-card">
      <div className="exercise-header">
        <div className="reorder-buttons">
          <button type="button" className="icon-btn secondary" disabled={isFirst} onClick={onMoveUp} aria-label="Nach oben">
            ▲
          </button>
          <button type="button" className="icon-btn secondary" disabled={isLast} onClick={onMoveDown} aria-label="Nach unten">
            ▼
          </button>
        </div>
        <div className="exercise-title">
          <strong>{exercise.name}</strong>
          {exercise.previousSets.length > 0 && (
            <span className="muted last-time">Letztes Mal: {formatSets(exercise.previousSets)}</span>
          )}
        </div>
        <button
          type="button"
          className="icon-btn secondary"
          onClick={() => setShowHistory((v) => !v)}
          aria-label="Verlauf anzeigen"
          title="Letzte 5 Trainings"
        >
          ⓘ
        </button>
        <button type="button" className="danger icon-btn" onClick={removeExercise} aria-label="Übung entfernen" title="Übung entfernen">
          🗑
        </button>
      </div>

      {showHistory && <HistoryPanel exerciseId={exercise.exercise_id} />}
      {error && <div className="error-banner">{error}</div>}

      {exercise.sets.length > 0 && (
        <div className="set-row muted set-row-header">
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
        <input
          type="number"
          step="0.5"
          min="0"
          inputMode="decimal"
          placeholder="kg"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <input
          type="number"
          min="0"
          inputMode="numeric"
          placeholder={suggestion ? String(suggestion.reps) : 'Wdh.'}
          value={reps}
          onChange={(e) => setReps(e.target.value)}
        />
        <input type="text" placeholder="Notiz (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button type="submit" className="icon-btn" aria-label="Satz hinzufügen">
          +
        </button>
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

  function moveExercise(index, direction) {
    const order = workout.exercises.map((ex) => ex.workout_exercise_id);
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    api.reorderWorkoutExercises(id, order).then(setWorkout).catch((e) => setError(e.message));
  }

  const availableExercises = useMemo(
    () => allExercises.filter((e) => !workout?.exercises.some((we) => we.exercise_id === e.id)),
    [allExercises, workout],
  );

  if (loading) return <p className="muted">Lädt...</p>;
  if (!workout) return <p className="error-banner">Training nicht gefunden.</p>;

  return (
    <div>
      <Link to="/training" className="muted back-link">
        ← Zurück
      </Link>
      <h2>
        {workout.name} <span className="muted" style={{ fontSize: '1rem' }}>— {workout.date}</span>
      </h2>
      {error && <div className="error-banner">{error}</div>}

      {workout.exercises.map((ex, index) => (
        <ExerciseBlock
          key={ex.workout_exercise_id}
          workoutId={id}
          exercise={ex}
          onChange={setWorkout}
          onMoveUp={() => moveExercise(index, -1)}
          onMoveDown={() => moveExercise(index, 1)}
          isFirst={index === 0}
          isLast={index === workout.exercises.length - 1}
        />
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
