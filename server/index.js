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
  app.use(
    express.static(clientDist, {
      setHeaders: (res, filePath) => {
        // index.html must always be revalidated so a homescreen shortcut or
        // browser never keeps serving a stale build after a deploy. The
        // hashed JS/CSS files change name on every build, so they're safe
        // to cache aggressively.
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
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
