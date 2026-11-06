const express = require('express');
const { requireManager } = require('../middleware/require-manager');
const { mountClientRoutes, audit, atomic } = require('./client-routes');
const { createIngestionService } = require('../services/feedback-ingestion');

function createCrmRouter(db) {
  const router = express.Router();
  router.use(requireManager(db));
  router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  mountClientRoutes(router, db);
  const ingestion = createIngestionService(db);
  router.get('/identity-pending', (req, res) => res.json({ items: ingestion.listPending() }));
  router.post('/identity-pending/:id/review', (req, res) => {
    const data = req.body || {};
    if (Object.keys(data).some(key => !['action', 'clientId', 'justification'].includes(key)) ||
      !['link', 'create', 'reject'].includes(data.action) || typeof data.justification !== 'string' ||
      !data.justification.trim() || data.justification.length > 1000 ||
      (data.action === 'link' && (!Number.isSafeInteger(data.clientId) || !db.prepare('SELECT id FROM clients WHERE id = ?').get(data.clientId)))) {
      return res.status(400).json({ error: 'Decisão, cliente ou justificativa inválidos.' });
    }
    if (!db.prepare('SELECT id FROM identity_pending WHERE id = ?').get(req.params.id)) return res.status(404).json({ error: 'Pendência não encontrada.' });
    try { return res.json(ingestion.review(req.params.id, { ...data, managerId: req.manager.id })); }
    catch { return res.status(409).json({ error: 'Pendência já revisada ou com decisão interna incompatível.' }); }
  });
  router.get('/feedback/:id', (req, res) => {
    const feedback = db.prepare('SELECT * FROM feedback_overview WHERE id = ?').get(req.params.id);
    if (!feedback) return res.status(404).json({ error: 'Feedback não encontrado.' });
    return res.json({ feedback,
      identity: db.prepare('SELECT * FROM identity_pending WHERE feedback_id = ?').get(feedback.id) || null,
      occurrences: db.prepare('SELECT p.id, p.title, p.status FROM quality_problems p JOIN problem_feedbacks pf ON pf.problem_id = p.id WHERE pf.feedback_id = ?').all(feedback.id),
      reviews: db.prepare('SELECT r.*, m.email AS reviewer FROM sentiment_reviews r JOIN managers m ON m.id = r.manager_id WHERE feedback_id = ? ORDER BY r.id DESC').all(feedback.id) });
  });
  router.put('/feedback/:id', (req, res) => {
    const feedback = db.prepare('SELECT * FROM feedback_overview WHERE id = ?').get(req.params.id);
    if (!feedback) return res.status(404).json({ error: 'Feedback não encontrado.' });
    const data = req.body || {};
    if (Object.keys(data).some(key => !['clientId', 'contactId', 'productId', 'serviceInstanceId', 'justification'].includes(key)) ||
      typeof data.justification !== 'string' || !data.justification.trim() || data.justification.length > 1000) {
      return res.status(400).json({ error: 'Somente vínculos contextuais internos e justificativa são aceitos; conteúdo, tipo e origem são imutáveis.' });
    }
    if (feedback.source_system || feedback.identity_status) return res.status(409).json({ error: 'Vínculo definido pela ingestão; use a revisão de identidade pendente.' });
    const { clientId, contactId = null, productId = null, serviceInstanceId = null } = data;
    const kind = feedback.kind;
    const instance = serviceInstanceId === null ? null : db.prepare('SELECT * FROM service_instances WHERE id = ?').get(serviceInstanceId);
    if (!Number.isSafeInteger(clientId) || clientId < 1 ||
      (clientId !== null && (!Number.isSafeInteger(clientId) || !db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId))) ||
      (contactId !== null && (!Number.isSafeInteger(contactId) || clientId === null ||
        !db.prepare('SELECT id FROM client_contacts WHERE id = ? AND client_id = ?').get(contactId, clientId))) ||
      (productId !== null && (!Number.isSafeInteger(productId) || !db.prepare('SELECT id FROM products WHERE id = ?').get(productId))) ||
      (clientId !== null && productId !== null && !db.prepare('SELECT 1 FROM client_products WHERE client_id = ? AND product_id = ?').get(clientId, productId)) ||
      (serviceInstanceId !== null && (!Number.isSafeInteger(serviceInstanceId) || !instance ||
        instance.client_id !== clientId || instance.product_id !== productId))) {
      return res.status(400).json({ error: 'Selecione cliente, contato e serviço com vínculos válidos.' });
    }
    atomic(db, () => {
      const before = db.prepare('SELECT * FROM feedback_context WHERE feedback_id = ?').get(feedback.id) || null;
      db.prepare(`INSERT INTO feedback_context(feedback_id, client_id, contact_id, product_id, kind, manager_id, updated_at, service_instance_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(feedback_id) DO UPDATE SET client_id=excluded.client_id, product_id=excluded.product_id,
        contact_id=excluded.contact_id, service_instance_id=excluded.service_instance_id, kind=excluded.kind,
        manager_id=excluded.manager_id, updated_at=excluded.updated_at`)
        .run(req.params.id, clientId, contactId, productId, kind, req.manager.id, new Date().toISOString(), serviceInstanceId);
      const event = { action: 'legacy-feedback-context', feedbackId: feedback.id, justification: data.justification.trim(), before,
        after: db.prepare('SELECT * FROM feedback_context WHERE feedback_id = ?').get(feedback.id) };
      audit(db, clientId, req.manager.id, event);
      if (before?.client_id && before.client_id !== clientId) audit(db, before.client_id, req.manager.id, event);
    });
    return res.json({ updated: true });
  });
  return router;
}
module.exports = { createCrmRouter };
