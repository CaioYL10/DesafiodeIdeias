const express = require('express');
const { requireManager } = require('../middleware/require-manager');
const { createRelationshipAnalysis } = require('../services/relationship-analysis');
function createRelationshipRouter(db) {
  const router = express.Router(); const service = createRelationshipAnalysis(db);
  router.use(requireManager(db));
  const validId = value => typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
  router.get('/', (req, res) => {
    if (req.query.clientId !== undefined && !validId(req.query.clientId)) return res.status(400).json({ error: 'Cliente inválido.' });
    return res.json({ items: service.list(req.query.clientId ? Number(req.query.clientId) : null) });
  });
  router.post('/analyze', (req, res) => {
    const clientId = req.body?.clientId;
    if (!Number.isSafeInteger(clientId) || clientId <= 0) return res.status(400).json({ error: 'Cliente inválido.' });
    const items = service.analyze(clientId);
    return items ? res.json({ items }) : res.status(404).json({ error: 'Cliente não encontrado.' });
  });
  router.get('/:id', (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Hipótese inválida.' });
    const result = service.get(Number(req.params.id));
    return result ? res.json(result) : res.status(404).json({ error: 'Hipótese não encontrada.' });
  });
  router.post('/:id/review', (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'Hipótese inválida.' });
    const result = service.review(Number(req.params.id), req.body || {}, req.manager.id);
    return result.error ? res.status(result.code).json({ error: result.error }) : res.json(result);
  });
  return router;
}
module.exports = { createRelationshipRouter };
