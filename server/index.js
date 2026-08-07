const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/workouts', require('./routes/workouts'));
app.use('/api/sets', require('./routes/sets'));
app.use('/api/bodyweight', require('./routes/bodyweight'));
app.use('/api/skip-days', require('./routes/skipDays'));
app.use('/api/export', require('./routes/export'));

// Wenn ein Production-Build des Frontends existiert, wird er direkt mit
// ausgeliefert - dann reicht ein einzelner Server (siehe README).
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Interner Serverfehler' });
});

const PORT = process.env.PORT || 4000;
db.initSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server läuft auf http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Datenbank-Initialisierung fehlgeschlagen:', err);
    process.exit(1);
  });
