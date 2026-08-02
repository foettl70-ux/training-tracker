import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import ExercisesPage from './pages/Exercises.jsx';
import TemplatesPage from './pages/Templates.jsx';
import TrainingPage from './pages/Training.jsx';
import WorkoutDetailPage from './pages/WorkoutDetail.jsx';
import BodyweightPage from './pages/Bodyweight.jsx';
import ProgressPage from './pages/Progress.jsx';

function App() {
  return (
    <div className="app-layout">
      <nav className="sidebar">
        <h1>🏋️ Trainings-Tracker</h1>
        <NavLink to="/training" className={({ isActive }) => (isActive ? 'active' : '')}>
          Training
        </NavLink>
        <NavLink to="/exercises" className={({ isActive }) => (isActive ? 'active' : '')}>
          Übungen
        </NavLink>
        <NavLink to="/templates" className={({ isActive }) => (isActive ? 'active' : '')}>
          Vorlagen
        </NavLink>
        <NavLink to="/bodyweight" className={({ isActive }) => (isActive ? 'active' : '')}>
          Körpergewicht
        </NavLink>
        <NavLink to="/progress" className={({ isActive }) => (isActive ? 'active' : '')}>
          Fortschritt
        </NavLink>
        <a className="export-btn" href="/api/export">
          <button type="button" className="secondary" style={{ width: '100%' }}>
            📤 Daten exportieren
          </button>
        </a>
      </nav>
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/training" replace />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/training/:id" element={<WorkoutDetailPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/bodyweight" element={<BodyweightPage />} />
          <Route path="/progress" element={<ProgressPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
