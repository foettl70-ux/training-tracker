import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { buildMonthGrid, formatIsoDate, MONTH_NAMES_LONG, MONTH_NAMES_SHORT } from '../dateUtils';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function todayIso() {
  return formatIsoDate(new Date());
}

function formatSets(sets) {
  return sets.map((s) => `${s.weight}kg×${s.reps}`).join(', ');
}

function DayCell({ date, size, status, isToday, isFuture, onClick }) {
  if (!date) return <div className={`day-cell empty size-${size}`} />;
  const iso = formatIsoDate(date);
  const cls = ['day-cell', `size-${size}`, status || 'none', isToday ? 'today' : '', isFuture ? 'future' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={cls} disabled={isFuture} onClick={() => onClick(iso)} title={iso}>
      {size === 'lg' ? date.getDate() : ''}
    </button>
  );
}

function MiniMonth({ year, monthIndex, statusByDate, todayStr, onSelectDay }) {
  const weeks = useMemo(() => buildMonthGrid(year, monthIndex), [year, monthIndex]);
  return (
    <div className="mini-month">
      <div className="mini-month-label">{MONTH_NAMES_SHORT[monthIndex]}</div>
      {weeks.map((week, wi) => (
        <div className="mini-month-row" key={wi}>
          {week.map((date, di) => {
            const iso = date ? formatIsoDate(date) : null;
            return (
              <DayCell
                key={di}
                date={date}
                size="sm"
                status={iso ? statusByDate.get(iso)?.type : null}
                isToday={iso === todayStr}
                isFuture={iso > todayStr}
                onClick={onSelectDay}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DayDetail({ date, entry, onClose, onChange }) {
  const [workoutDetails, setWorkoutDetails] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNote('');
    setError('');
    if (entry?.type === 'training') {
      setWorkoutDetails(null);
      Promise.all(entry.workouts.map((w) => api.getWorkout(w.id)))
        .then(setWorkoutDetails)
        .catch((e) => setError(e.message));
    }
  }, [date, entry]);

  function markSkip() {
    setBusy(true);
    api
      .setSkipDay(date, note || undefined)
      .then(onChange)
      .catch((e) => setError(e.message))
      .finally(() => setBusy(false));
  }

  function removeSkip() {
    if (!entry?.skip) return;
    setBusy(true);
    api
      .deleteSkipDay(entry.skip.id)
      .then(onChange)
      .catch((e) => setError(e.message))
      .finally(() => setBusy(false));
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <strong>{date}</strong>
        <button type="button" className="icon-btn secondary" onClick={onClose} aria-label="Schließen">
          ✕
        </button>
      </div>
      {error && <div className="error-banner">{error}</div>}

      {entry?.type === 'training' && (
        <>
          {!workoutDetails && <p className="muted">Lädt...</p>}
          {workoutDetails?.map((w) => (
            <div key={w.id} className="day-detail-workout">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{w.name}</strong>
                <Link to={`/training/${w.id}`}>
                  <button type="button" className="secondary">
                    Öffnen
                  </button>
                </Link>
              </div>
              {w.exercises.length === 0 && <p className="muted">Keine Übungen erfasst.</p>}
              {w.exercises.map((ex) => (
                <div key={ex.workout_exercise_id} className="day-detail-exercise">
                  <span className="muted">{ex.name}: </span>
                  <span>{ex.sets.length > 0 ? formatSets(ex.sets) : '–'}</span>
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {entry?.type === 'skip' && (
        <>
          <p className="muted">Als Skip markiert{entry.skip.note ? ` — ${entry.skip.note}` : ''}</p>
          <button type="button" className="danger" onClick={removeSkip} disabled={busy}>
            Skip entfernen
          </button>
        </>
      )}

      {!entry && (
        <>
          <p className="muted">Kein Eintrag für diesen Tag.</p>
          <div className="field" style={{ marginBottom: '0.6rem' }}>
            <label>Notiz (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="z. B. krank, Urlaub..."
            />
          </div>
          <button type="button" className="danger" onClick={markSkip} disabled={busy}>
            Als Skip markieren
          </button>
        </>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const now = new Date();
  const [mode, setMode] = useState('year');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [workouts, setWorkouts] = useState([]);
  const [skipDays, setSkipDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    Promise.all([api.getWorkouts(), api.getSkipDays()])
      .then(([w, s]) => {
        setWorkouts(w);
        setSkipDays(s);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function reloadAfterChange() {
    setSelectedDate(null);
    load();
  }

  const statusByDate = useMemo(() => {
    const map = new Map();
    workouts.forEach((w) => {
      if (!map.has(w.date)) map.set(w.date, { type: 'training', workouts: [] });
      map.get(w.date).workouts.push(w);
    });
    skipDays.forEach((s) => {
      if (!map.has(s.date)) map.set(s.date, { type: 'skip', skip: s });
    });
    return map;
  }, [workouts, skipDays]);

  const todayStr = todayIso();

  function handleSelectDay(iso) {
    if (iso > todayStr) return;
    setSelectedDate(iso);
  }

  function shiftMonth(delta) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  const monthWeeks = useMemo(() => buildMonthGrid(year, month), [year, month]);

  return (
    <div>
      <h2>Kalender</h2>
      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="muted">Lädt...</p>}

      <div className="chart-toggle">
        <button type="button" className={mode === 'year' ? '' : 'secondary'} onClick={() => setMode('year')}>
          Jahr
        </button>
        <button type="button" className={mode === 'month' ? '' : 'secondary'} onClick={() => setMode('month')}>
          Monat
        </button>
      </div>

      {!loading && mode === 'year' && (
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: '0.9rem' }}>
            <button type="button" className="icon-btn secondary" onClick={() => setYear((y) => y - 1)} aria-label="Vorheriges Jahr">
              ◀
            </button>
            <strong>{year}</strong>
            <button
              type="button"
              className="icon-btn secondary"
              onClick={() => setYear((y) => y + 1)}
              disabled={year >= now.getFullYear()}
              aria-label="Nächstes Jahr"
            >
              ▶
            </button>
          </div>
          <div className="year-grid">
            {Array.from({ length: 12 }, (_, i) => (
              <MiniMonth
                key={i}
                year={year}
                monthIndex={i}
                statusByDate={statusByDate}
                todayStr={todayStr}
                onSelectDay={handleSelectDay}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && mode === 'month' && (
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: '0.9rem' }}>
            <button type="button" className="icon-btn secondary" onClick={() => shiftMonth(-1)} aria-label="Vorheriger Monat">
              ◀
            </button>
            <strong>
              {MONTH_NAMES_LONG[month]} {year}
            </strong>
            <button
              type="button"
              className="icon-btn secondary"
              onClick={() => shiftMonth(1)}
              disabled={year === now.getFullYear() && month === now.getMonth()}
              aria-label="Nächster Monat"
            >
              ▶
            </button>
          </div>
          <div className="month-row weekday-row">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          {monthWeeks.map((week, wi) => (
            <div className="month-row" key={wi}>
              {week.map((date, di) => {
                const iso = date ? formatIsoDate(date) : null;
                return (
                  <DayCell
                    key={di}
                    date={date}
                    size="lg"
                    status={iso ? statusByDate.get(iso)?.type : null}
                    isToday={iso === todayStr}
                    isFuture={iso > todayStr}
                    onClick={handleSelectDay}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div className="row wrap legend">
        <span className="legend-item">
          <span className="legend-dot training" /> Training
        </span>
        <span className="legend-item">
          <span className="legend-dot skip" /> Skip
        </span>
        <span className="legend-item">
          <span className="legend-dot none" /> Kein Eintrag
        </span>
      </div>

      {selectedDate && (
        <DayDetail
          date={selectedDate}
          entry={statusByDate.get(selectedDate)}
          onClose={() => setSelectedDate(null)}
          onChange={reloadAfterChange}
        />
      )}
    </div>
  );
}
