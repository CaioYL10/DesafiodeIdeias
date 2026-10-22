const { findManagerByToken, readCookie, SESSION_COOKIE } = require('../security/sessions');

function requireManager(database) {
  return (request, response, next) => {
    const token = readCookie(request, SESSION_COOKIE);
    const manager = findManagerByToken(database, token);

    if (!manager) {
      return response.status(401).json({ error: 'Autenticação necessária.' });
    }

    request.manager = manager;
    return next();
  };
}

module.exports = { requireManager };
