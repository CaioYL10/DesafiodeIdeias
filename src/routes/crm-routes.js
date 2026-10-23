const express = require('express');
const { requireManager } = require('../middleware/require-manager');
const { text, ids, atomic } = require('./workflow-utils');

function createCrmRouter(db) {
  const router = express.Router();
  router.use(requireManager(db));
  router.get('/clients', (req, res) => res.json({ items: db.prepare(`SELECT c.*,
    (SELECT COUNT(*) FROM feedback_context WHERE client_id = c.id) AS feedback_count
    FROM clients c ORDER BY c.name`).all() }));
  router.post('/clients', (req, res) => {
    const { name, contact = '', productIds = [] } = req.body || {};
    if (!text(name, 120) || typeof contact !== 'string' || contact.length > 200 || !ids(productIds) ||
      productIds.some((id) => !db.prepare('SELECT id FROM products WHERE id = ?').get(id))) return res.status(400).json({ error: 'Informe nome, contato de até 200 caracteres e serviços válidos.' });
    const id = atomic(db, () => {
      const result = db.prepare('INSERT INTO clients(name, contact, created_at) VALUES (?, ?, ?)').run(name.trim(), contact.trim(), new Date().toISOString());
      for (const productId of productIds) db.prepare('INSERT INTO client_products VALUES (?, ?)').run(result.lastInsertRowid, productId);
      return result.lastInsertRowid;
    });
    return res.status(201).json({ id });
  });
  router.get('/clients/:id', (req, res) => {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado.' });
    return res.json({ client, products: db.prepare('SELECT p.* FROM products p JOIN client_products cp ON cp.product_id = p.id WHERE cp.client_id = ?').all(client.id),
      feedbacks: db.prepare('SELECT * FROM feedback_overview WHERE client_id = ? ORDER BY id DESC').all(client.id) });
  });
  router.get('/feedback/:id', (req, res) => {
    const feedback = db.prepare('SELECT * FROM feedback_overview WHERE id = ?').get(req.params.id);
    if (!feedback) return res.status(404).json({ error: 'Feedback não encontrado.' });
    return res.json({ feedback, reviews: db.prepare('SELECT r.*, m.email AS reviewer FROM sentiment_reviews r JOIN managers m ON m.id = r.manager_id WHERE feedback_id = ? ORDER BY r.id DESC').all(feedback.id) });
  });
  router.put('/feedback/:id', (req, res) => {
    if (!db.prepare('SELECT id FROM feedbacks WHERE id = ?').get(req.params.id)) return res.status(404).json({ error: 'Feedback não encontrado.' });
    const { clientId = null, productId = null, kind } = req.body || {};
    if (!['feedback', 'complaint', 'suggestion'].includes(kind) ||
      (clientId !== null && (!Number.isSafeInteger(clientId) || !db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId))) ||
      (productId !== null && (!Number.isSafeInteger(productId) || !db.prepare('SELECT id FROM products WHERE id = ?').get(productId))) ||
      (clientId !== null && productId !== null && !db.prepare('SELECT 1 FROM client_products WHERE client_id = ? AND product_id = ?').get(clientId, productId))) {
      return res.status(400).json({ error: 'Selecione cliente, serviço vinculado e tipo válidos.' });
    }
    db.prepare(`INSERT INTO feedback_context VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(feedback_id) DO UPDATE SET client_id=excluded.client_id, product_id=excluded.product_id,
      kind=excluded.kind, manager_id=excluded.manager_id, updated_at=excluded.updated_at`)
      .run(req.params.id, clientId, productId, kind, req.manager.id, new Date().toISOString());
    return res.json({ updated: true });
  });
  router.post('/feedback/:id/reviews', (req, res) => {
    if (!db.prepare('SELECT id FROM feedbacks WHERE id = ?').get(req.params.id)) return res.status(404).json({ error: 'Feedback não encontrado.' });
    const { sentiment, note = '' } = req.body || {};
    if (!['positive', 'neutral', 'negative'].includes(sentiment) || typeof note !== 'string' || note.length > 1000) return res.status(400).json({ error: 'Selecione um sentimento válido e observação de até 1.000 caracteres.' });
    const result = db.prepare('INSERT INTO sentiment_reviews(feedback_id, sentiment, note, manager_id, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, sentiment, note.trim(), req.manager.id, new Date().toISOString());
    return res.status(201).json({ id: result.lastInsertRowid });
  });
  return router;
}
module.exports = { createCrmRouter };
