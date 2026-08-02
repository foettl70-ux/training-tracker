import { useEffect, useState } from 'react';
import { api } from '../api';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function BodyweightPage() {
  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState(todayIso());
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    api
      .getBodyweight()
      .then((rows) => setEntries([...rows].sort((a, b) => b.date.localeCompare(a.date))))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!weight || !date) return;
    api
      .addBodyweight(date, Number(weight))
      .then(() => {
        setWeight('');
        load();
      })
      .catch((e) => setError(e.message));
  }

  function handleDelete(id) {
    if (!confirm('Eintrag löschen?')) return;
    api
      .deleteBodyweight(id)
      .then(load)
      .catch((e) => setError(e.message));
  }

  return (
    <div>
      <h2>Körpergewicht</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <form className="row wrap" onSubmit={handleAdd}>
          <div className="field">
            <label>Datum</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="field">
            <label>Gewicht (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="82.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
          </div>
          <button type="submit" style={{ alignSelf: 'flex-end' }}>
            Eintragen
          </button>
        </form>
      </div>

      <div className="card">
        {loading && <p className="muted">Lädt...</p>}
        {!loading && entries.length === 0 && <p className="muted">Noch keine Einträge.</p>}
        {entries.map((e) => (
          <div className="list-item" key={e.id}>
            <span>
              {e.date} — <strong>{e.weight} kg</strong>
            </span>
            <button type="button" className="danger" onClick={() => handleDelete(e.id)}>
              Löschen
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
