const express = require('express');
const { requireManager } = require('../middleware/require-manager');

function createProductRouter(database) {
  const router = express.Router();
  router.use(requireManager(database));
  router.get('/', (request, response) => response.json({ items: database.prepare('SELECT * FROM products ORDER BY id DESC').all() }));
  router.post('/', (request, response) => {
    const { name, description = '', type } = request.body || {};
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 120 ||
        typeof description !== 'string' || description.trim().length > 1000 || !['product', 'service'].includes(type)) {
      return response.status(400).json({ error: 'Informe nome de até 120 caracteres, tipo válido e descrição de até 1.000 caracteres.' });
    }
    const result = database.prepare('INSERT INTO products (name, description, type, created_at) VALUES (?, ?, ?, ?)')
      .run(name.trim(), description.trim(), type, new Date().toISOString());
    return response.status(201).json(database.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid));
  });
  return router;
}
module.exports = { createProductRouter };
