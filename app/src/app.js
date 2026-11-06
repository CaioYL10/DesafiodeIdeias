const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const { createAuthRouter } = require('./routes/auth-routes');
const { createManagerRouter } = require('./routes/manager-routes');
const { createProductRouter } = require('./routes/product-routes');
const { createCrmRouter } = require('./routes/crm-routes');
const { createQualityRouter } = require('./routes/quality-routes');
const { createRelationshipRouter } = require('./routes/relationship-routes');
const { createRetentionRouter } = require('./routes/retention-routes');
const { findManagerByToken, readCookie, SESSION_COOKIE } = require('./security/sessions');

function createApp({ database, clock }) {
  const app = express();
  const publicPath = path.join(__dirname, '..', 'public');
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.use('/api/auth', createAuthRouter(database));
  app.use('/api/manager/products', createProductRouter(database));
  app.use('/api/manager/crm', createCrmRouter(database));
  app.use('/api/manager/quality', createQualityRouter(database));
  app.use('/api/manager/relationships', createRelationshipRouter(database));
  app.use('/api/manager/retention', createRetentionRouter(database, { clock }));
  app.use('/api/manager', createManagerRouter(database));
  function protectedPage(urls, filename, nextPath) {
    app.get(urls, (request, response) => {
      response.set('Cache-Control', 'no-store');
      const manager = findManagerByToken(database, readCookie(request, SESSION_COOKIE));
      if (!manager) return response.redirect(302, nextPath === '/dashboard' ? '/login' : '/login?next=' + nextPath);
      return response.type('html').send(fs.readFileSync(path.join(publicPath, filename)));
    });
  }
  protectedPage(['/dashboard', '/dashboard.html'], 'dashboard.html', '/dashboard');
  protectedPage(['/feedbacks', '/feedbacks.html'], 'manager-feedbacks.html', '/feedbacks');
  protectedPage(['/products', '/products.html'], 'products.html', '/products');
  protectedPage(['/workspace', '/workspace.html'], 'workspace.html', '/workspace');
  app.get('/login', (request, response) => response.type('html').send(fs.readFileSync(path.join(publicPath, 'login.html'))));
  app.use('/api', (request, response) => response.status(404).json({ error: 'Endpoint não encontrado.' }));
  app.use(express.static(publicPath));
  app.use((error, request, response, next) => {
    if (response.headersSent) return next(error);
    if (error.type === 'entity.too.large') return response.status(413).json({ error: 'O envio excede o limite permitido.' });
    return response.status(500).json({ error: 'Erro interno.' });
  });
  return app;
}
module.exports = { createApp };
