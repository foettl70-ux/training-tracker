import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import ExercisesPage from './pages/Exercises.jsx';
import TemplatesPage from './pages/Templates.jsx';
import TrainingPage from './pages/Training.jsx';
import WorkoutDetailPage from './pages/WorkoutDetail.jsx';
import BodyweightPage from './pages/Bodyweight.jsx';
import ProgressPage from './pages/Progress.jsx';

function Logo() {
  return (
    <svg className="logo-mark" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 17L9.5 10.5L14 15L21 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7H21V13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const navItems = [
  { to: '/training', label: 'Training' },
  { to: '/exercises', label: 'Übungen' },
  { to: '/templates', label: 'Vorlagen' },
  { to: '/bodyweight', label: 'Körpergewicht' },
  { to: '/progress', label: 'Fortschritt' },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <header className="mobile-topbar">
        <button
          type="button"
          className="icon-btn secondary menu-toggle"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menü öffnen"
        >
          ☰
        </button>
        <span className="mobile-brand">
          <Logo />
          Progressor
        </span>
      </header>

      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}

      <nav className={`sidebar${menuOpen ? ' open' : ''}`}>
        <div className="brand">
          <Logo />
          <h1>Progressor</h1>
        </div>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            {item.label}
          </NavLink>
        ))}
        <a className="export-btn" href="/api/export">
          <button type="button" className="secondary" style={{ width: '100%' }}>
            Daten exportieren
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
