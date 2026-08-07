const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let message = `Fehler ${res.status}`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Übungen
  getExercises: () => request('/exercises'),
  createExercise: (name) => request('/exercises', { method: 'POST', body: JSON.stringify({ name }) }),
  updateExercise: (id, name) => request(`/exercises/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteExercise: (id) => request(`/exercises/${id}`, { method: 'DELETE' }),
  getExerciseHistory: (id) => request(`/exercises/${id}/history`),

  // Vorlagen
  getTemplates: () => request('/templates'),
  getTemplate: (id) => request(`/templates/${id}`),
  createTemplate: (name, exerciseIds) => request('/templates', { method: 'POST', body: JSON.stringify({ name, exerciseIds }) }),
  updateTemplate: (id, name, exerciseIds) => request(`/templates/${id}`, { method: 'PUT', body: JSON.stringify({ name, exerciseIds }) }),
  deleteTemplate: (id) => request(`/templates/${id}`, { method: 'DELETE' }),

  // Trainings
  getWorkouts: () => request('/workouts'),
  getWorkout: (id) => request(`/workouts/${id}`),
  createWorkout: (data) => request('/workouts', { method: 'POST', body: JSON.stringify(data) }),
  deleteWorkout: (id) => request(`/workouts/${id}`, { method: 'DELETE' }),
  addExerciseToWorkout: (workoutId, exerciseId) =>
    request(`/workouts/${workoutId}/exercises`, { method: 'POST', body: JSON.stringify({ exercise_id: exerciseId }) }),
  removeExerciseFromWorkout: (workoutId, weId) =>
    request(`/workouts/${workoutId}/exercises/${weId}`, { method: 'DELETE' }),
  reorderWorkoutExercises: (workoutId, workoutExerciseIds) =>
    request(`/workouts/${workoutId}/exercises/reorder`, { method: 'PUT', body: JSON.stringify({ workoutExerciseIds }) }),
  addSet: (workoutId, weId, set) =>
    request(`/workouts/${workoutId}/exercises/${weId}/sets`, { method: 'POST', body: JSON.stringify(set) }),
  updateSet: (setId, set) => request(`/sets/${setId}`, { method: 'PUT', body: JSON.stringify(set) }),
  deleteSet: (setId) => request(`/sets/${setId}`, { method: 'DELETE' }),

  // Körpergewicht
  getBodyweight: () => request('/bodyweight'),
  addBodyweight: (date, weight) => request('/bodyweight', { method: 'POST', body: JSON.stringify({ date, weight }) }),
  deleteBodyweight: (id) => request(`/bodyweight/${id}`, { method: 'DELETE' }),
};
