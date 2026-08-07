const db = require('./db');

// Sets from the most recent OTHER workout that included this exercise,
// used both to seed a new workout's sets and to show a "last time" reference.
async function getLastSets(exerciseId, excludeWorkoutId) {
  return db.all(
    `SELECT s.weight, s.reps, s.note
     FROM sets s
     JOIN workout_exercises we ON we.id = s.workout_exercise_id
     WHERE we.exercise_id = ?
       AND we.workout_id = (
         SELECT w2.id
         FROM workouts w2
         JOIN workout_exercises we2 ON we2.workout_id = w2.id
         WHERE we2.exercise_id = ?
           AND w2.id != ?
         ORDER BY w2.date DESC, w2.id DESC
         LIMIT 1
       )
     ORDER BY s.position ASC`,
    [exerciseId, exerciseId, excludeWorkoutId ?? -1],
  );
}

module.exports = { getLastSets };
