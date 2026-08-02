export function parseIsoDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function shortWeekday(date) {
  return date.toLocaleDateString('de-DE', { weekday: 'short' });
}

export function shortDate(date) {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

// Grouping key for a week: the ISO date of its Monday. Simple and stable,
// avoids ISO-8601 week-number edge cases while still grouping Mon-Sun.
export function weekKey(date) {
  return formatIsoDate(startOfWeek(date));
}
