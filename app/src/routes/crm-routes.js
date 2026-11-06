const express = require('express');
const { requireManager } = require('../middleware/require-manager');
const { mountClientRoutes } = require('./client-routes');

function createCrmRouter(db) {
  const router = express.Router();
  router.use(requireManager(db));
  mountClientRoutes(router, db);
  router.get('/feedback/:id', (req, res) => {
    const feedback = db.prepare('SELECT * FROM feedback_overview WHERE id = ?').get(req.params.id);
    if (!feedback) return res.status(404).json({ error: 'Feedback não encontrado.' });
    return res.json({ feedback, reviews: db.prepare('SELECT r.*, m.email AS reviewer FROM sentiment_reviews r JOIN managers m ON m.id = r.manager_id WHERE feedback_id = ? ORDER BY r.id DESC').all(feedback.id) });
  });
  router.put('/feedback/:id', (req, res) => {
    if (!db.prepare('SELECT id FROM feedbacks WHERE id = ?').get(req.params.id)) return res.status(404).json({ error: 'Feedback não encontrado.' });
    const { clientId = null, contactId = null, productId = null, serviceInstanceId = null, kind } = req.body || {};
    const instance = serviceInstanceId === null ? null : db.prepare('SELECT * FROM service_instances WHERE id = ?').get(serviceInstanceId);
    if (!['feedback', 'complaint', 'suggestion'].includes(kind) ||
      (clientId !== null && (!Number.isSafeInteger(clientId) || !db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId))) ||
      (contactId !== null && (!Number.isSafeInteger(contactId) || clientId === null ||
        !db.prepare('SELECT id FROM client_contacts WHERE id = ? AND client_id = ?').get(contactId, clientId))) ||
      (productId !== null && (!Number.isSafeInteger(productId) || !db.prepare('SELECT id FROM products WHERE id = ?').get(productId))) ||
      (clientId !== null && productId !== null && !db.prepare('SELECT 1 FROM client_products WHERE client_id = ? AND product_id = ?').get(clientId, productId)) ||
      (serviceInstanceId !== null && (!Number.isSafeInteger(serviceInstanceId) || !instance ||
        instance.client_id !== clientId || instance.product_id !== productId))) {
      return res.status(400).json({ error: 'Selecione cliente, serviço vinculado e tipo válidos.' });
    }
    db.prepare(`INSERT INTO feedback_context(feedback_id, client_id, contact_id, product_id, kind, manager_id, updated_at, service_instance_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(feedback_id) DO UPDATE SET client_id=excluded.client_id, product_id=excluded.product_id,
      contact_id=excluded.contact_id, service_instance_id=excluded.service_instance_id, kind=excluded.kind,
      manager_id=excluded.manager_id, updated_at=excluded.updated_at`)
      .run(req.params.id, clientId, contactId, productId, kind, req.manager.id, new Date().toISOString(), serviceInstanceId);
    return res.json({ updated: true });
  });
  return router;
}
module.exports = { createCrmRouter };
