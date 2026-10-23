const express = require('express');
const { verifyPassword } = require('../security/passwords');
const {
  createSession,
  findManagerByToken,
  removeSession,
  readCookie,
  SESSION_COOKIE,
  sessionCookie,
  expiredSessionCookie
} = require('../security/sessions');

function createAuthRouter(database) {
  const router = express.Router();

  router.post('/login', async (request, response, next) => {
    try {
      const email = typeof request.body.email === 'string' ? request.body.email.trim().toLowerCase() : '';
      const password = typeof request.body.password === 'string' ? request.body.password : '';
      const manager = database.prepare(
        'SELECT id, email, password_salt, password_hash FROM managers WHERE email = ?'
      ).get(email);

      const isValid = manager
        ? await verifyPassword(password, manager.password_salt, manager.password_hash)
        : false;

      if (!isValid) {
        return response.status(401).json({ error: 'E-mail ou senha inválidos.' });
      }

      const existingToken = readCookie(request, SESSION_COOKIE);
      removeSession(database, existingToken);
      const session = createSession(database, manager.id);
      response.setHeader('Set-Cookie', sessionCookie(session.token));
      return response.json({ authenticated: true, email: manager.email });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/session', (request, response) => {
    const token = readCookie(request, SESSION_COOKIE);
    const manager = findManagerByToken(database, token);
    return response.json({ authenticated: Boolean(manager), email: manager ? manager.email : null });
  });

  router.post('/logout', (request, response) => {
    const token = readCookie(request, SESSION_COOKIE);
    removeSession(database, token);
    response.setHeader('Set-Cookie', expiredSessionCookie());
    return response.json({ authenticated: false });
  });

  return router;
}

module.exports = { createAuthRouter };
