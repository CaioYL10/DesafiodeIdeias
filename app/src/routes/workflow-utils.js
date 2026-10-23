function text(value, max = 1000) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
}
function ids(value) {
  return Array.isArray(value) && value.length <= 100 && value.every((id) => Number.isSafeInteger(id) && id > 0) && new Set(value).size === value.length;
}
function atomic(database, operation) {
  database.exec('BEGIN IMMEDIATE');
  try { const result = operation(); database.exec('COMMIT'); return result; }
  catch (error) { database.exec('ROLLBACK'); throw error; }
}
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
module.exports = { text, ids, atomic, validDate };
