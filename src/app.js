const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const { createAuthRouter } = require('./routes/auth-routes');
const { createManagerRouter } = require('./routes/manager-routes');
const { createFeedbackRouter } = require('./routes/feedback-routes');
const { createProductRouter } = require('./routes/product-routes');
const { findManagerByToken, readCookie, SESSION_COOKIE } = require('./security/sessions');

function createApp({ database, sentimentService }) {
  const app = express();
  const publicPath = path.join(__dirname, '..', 'public');
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.use('/api/feedback', createFeedbackRouter(database, sentimentService));
  app.use('/api/auth', createAuthRouter(database));
  app.use('/api/manager/products', createProductRouter(database));
  app.use('/api/manager', createManagerRouter(database, sentimentService));
  function protectedPage(urls, filename, nextPath) {
    app.get(urls, (request, response) => {
      response.set('Cache-Control', 'no-store');
      const manager = findManagerByToken(database, readCookie(request, SESSION_COOKIE));
      if (!manager) return response.redirect(302, nextPath === '/dashboard' ? '/login' : '/login?next=' + nextPath);
      return response.type('html').send(fs.readFileSync(path.join(publicPath, filename)));
    });
  }
  protectedPage(['/dashboard', '/dashboard.html'], 'dashboard.html', '/dashboard');
  protectedPage(['/products', '/products.html'], 'products.html', '/products');
  app.get('/feedback', (request, response) => response.type('html').send(fs.readFileSync(path.join(publicPath, 'feedback.html'))));
  app.get('/login', (request, response) => response.type('html').send(fs.readFileSync(path.join(publicPath, 'login.html'))));
  app.use(express.static(publicPath));
  app.use((error, request, response, next) => {
    if (response.headersSent) return next(error);
    if (error.type === 'entity.too.large') return response.status(413).json({ error: 'O envio excede o limite permitido.' });
    return response.status(500).json({ error: 'Erro interno.' });
  });
  return app;
}
module.exports = { createApp };
