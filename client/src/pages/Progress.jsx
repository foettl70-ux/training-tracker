import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../api';
import { addDays, formatIsoDate, parseIsoDate, shortDate, shortWeekday, startOfWeek, weekKey } from '../dateUtils';

const RANGE_OPTIONS = [
  { label: '3 Monate', weeks: 13 },
  { label: '6 Monate', weeks: 26 },
  { label: '12 Monate', weeks: 52 },
  { label: 'Alle', weeks: Infinity },
];

function BodyweightSection({ entries }) {
  const [mode, setMode] = useState('week');
  const [rangeIdx, setRangeIdx] = useState(1);

  const weekData = useMemo(() => {
    const monday = startOfWeek(new Date());
    const byDate = Object.fromEntries(entries.map((e) => [e.date, e.weight]));
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i);
      const iso = formatIsoDate(d);
      return { label: shortWeekday(d), weight: byDate[iso] ?? null };
    });
  }, [entries]);

  const longTermData = useMemo(() => {
    const groups = new Map();
    entries.forEach((e) => {
      const key = weekKey(parseIsoDate(e.date));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(e.weight);
    });
    let rows = Array.from(groups.entries())
      .map(([key, weights]) => ({
        key,
        label: shortDate(parseIsoDate(key)),
        weight: Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));
    const weeks = RANGE_OPTIONS[rangeIdx].weeks;
    if (weeks !== Infinity) rows = rows.slice(-weeks);
    return rows;
  }, [entries, rangeIdx]);

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Körpergewicht</h3>
      <div className="chart-toggle">
        <button type="button" className={mode === 'week' ? '' : 'secondary'} onClick={() => setMode('week')}>
          Diese Woche
        </button>
        <button type="button" className={mode === 'long' ? '' : 'secondary'} onClick={() => setMode('long')}>
          Langzeit (Wochendurchschnitt)
        </button>
      </div>

      {mode === 'week' && (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
            <XAxis dataKey="label" stroke="#9aa1ac" />
            <YAxis stroke="#9aa1ac" domain={['auto', 'auto']} unit=" kg" />
            <Tooltip contentStyle={{ background: '#1f232c', border: '1px solid #2a2f3a' }} />
            <Line type="monotone" dataKey="weight" name="Gewicht" stroke="#4f8cff" connectNulls={false} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )}

      {mode === 'long' && (
        <>
          <div className="chart-toggle">
            {RANGE_OPTIONS.map((r, i) => (
              <button key={r.label} type="button" className={rangeIdx === i ? '' : 'secondary'} onClick={() => setRangeIdx(i)}>
                {r.label}
              </button>
            ))}
          </div>
          {longTermData.length === 0 ? (
            <p className="muted">Noch nicht genug Daten.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={longTermData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
                <XAxis dataKey="label" stroke="#9aa1ac" />
                <YAxis stroke="#9aa1ac" domain={['auto', 'auto']} unit=" kg" />
                <Tooltip contentStyle={{ background: '#1f232c', border: '1px solid #2a2f3a' }} />
                <Line type="monotone" dataKey="weight" name="Ø Gewicht/Woche" stroke="#3ecf8e" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
}

function ExerciseSection({ exercises }) {
  const [exerciseId, setExerciseId] = useState('');
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!exerciseId) {
      setHistory([]);
      return;
    }
    api.getExerciseHistory(exerciseId).then(setHistory).catch((e) => setError(e.message));
  }, [exerciseId]);

  const byDay = useMemo(() => {
    const groups = new Map();
    history.forEach((s) => {
      if (!groups.has(s.date)) groups.set(s.date, []);
      groups.get(s.date).push(s);
    });
    return Array.from(groups.entries())
      .map(([date, sets]) => ({
        date,
        label: shortDate(parseIsoDate(date)),
        maxWeight: Math.max(...sets.map((s) => s.weight)),
        volume: sets.reduce((sum, s) => sum + s.weight * s.reps, 0),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [history]);

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Übungs-Fortschritt</h3>
      {error && <div className="error-banner">{error}</div>}
      <div className="field" style={{ marginBottom: '1rem', maxWidth: 320 }}>
        <label>Übung</label>
        <select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
          <option value="">Übung wählen...</option>
          {exercises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      {exerciseId && byDay.length === 0 && <p className="muted">Noch keine Sätze für diese Übung erfasst.</p>}

      {byDay.length > 0 && (
        <>
          <p className="muted">Maximales Gewicht pro Trainingstag</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
              <XAxis dataKey="label" stroke="#9aa1ac" />
              <YAxis stroke="#9aa1ac" domain={['auto', 'auto']} unit=" kg" />
              <Tooltip contentStyle={{ background: '#1f232c', border: '1px solid #2a2f3a' }} />
              <Line type="monotone" dataKey="maxWeight" name="Max. Gewicht" stroke="#4f8cff" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>

          <p className="muted" style={{ marginTop: '1.2rem' }}>
            Gesamtvolumen pro Trainingstag (Gewicht × Wiederholungen)
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3a" />
              <XAxis dataKey="label" stroke="#9aa1ac" />
              <YAxis stroke="#9aa1ac" unit=" kg" />
              <Tooltip contentStyle={{ background: '#1f232c', border: '1px solid #2a2f3a' }} />
              <Bar dataKey="volume" name="Volumen" fill="#3ecf8e" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

export default function ProgressPage() {
  const [bodyweight, setBodyweight] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getBodyweight(), api.getExercises()])
      .then(([bw, ex]) => {
        setBodyweight(bw);
        setExercises(ex);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Fortschritt</h2>
      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="muted">Lädt...</p>}
      {!loading && (
        <>
          <BodyweightSection entries={bodyweight} />
          <ExerciseSection exercises={exercises} />
        </>
      )}
    </div>
  );
}
