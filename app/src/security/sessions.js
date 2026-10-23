const { createHash, randomBytes } = require('node:crypto');

const SESSION_COOKIE = 'cti_manager_session';
const SESSION_HOURS = 8;

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function createSession(database, managerId, now = Date.now()) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(now + SESSION_HOURS * 60 * 60 * 1000).toISOString();

  database.prepare(
    'INSERT INTO sessions (token_hash, manager_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).run(hashToken(token), managerId, expiresAt, new Date(now).toISOString());

  return { token, expiresAt };
}

function findManagerByToken(database, token, now = Date.now()) {
  if (!token) return null;

  const row = database.prepare(
    'SELECT managers.id, managers.email, sessions.expires_at ' +
    'FROM sessions JOIN managers ON managers.id = sessions.manager_id ' +
    'WHERE sessions.token_hash = ?'
  ).get(hashToken(token));

  if (!row) return null;
  if (Date.parse(row.expires_at) <= now) {
    database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
    return null;
  }

  return { id: row.id, email: row.email };
}

function removeSession(database, token) {
  if (token) {
    database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
  }
}

function readCookie(request, name = SESSION_COOKIE) {
  const cookieHeader = request.headers.cookie || '';
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(name + '='));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function cookieOptions() {
  const options = ['Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=' + (SESSION_HOURS * 60 * 60)];
  if (process.env.SESSION_COOKIE_SECURE === 'true') options.push('Secure');
  return options.join('; ');
}

function sessionCookie(token) {
  return SESSION_COOKIE + '=' + encodeURIComponent(token) + '; ' + cookieOptions();
}

function expiredSessionCookie() {
  return SESSION_COOKIE + '=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0';
}

module.exports = {
  SESSION_COOKIE,
  createSession,
  findManagerByToken,
  removeSession,
  readCookie,
  sessionCookie,
  expiredSessionCookie
};
