const express = require('express');
const { requireManager } = require('../middleware/require-manager');
const { createRetentionService } = require('../services/retention');

function createRetentionRouter(db, options) {
  const router = express.Router();
  const service = createRetentionService(db, options);
  const validId = value => /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
  const respond = (res, result, status = 200) => result?.error ? res.status(result.code).json({ error: result.error }) : res.status(status).json(result);
  router.use(requireManager(db));
  router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.get('/templates', (req,res) => res.json({ items: service.templates() }));
  router.post('/templates', (req,res) => respond(res, service.saveTemplate(null, req.body, req.manager.id), 201));
  router.put('/templates/:id', (req,res) => validId(req.params.id) ? respond(res, service.saveTemplate(Number(req.params.id), req.body, req.manager.id)) : res.status(400).json({error:'Template inválido.'}));
  router.get('/clients/:id', (req,res) => {
    if (!validId(req.params.id)) return res.status(400).json({error:'Cliente inválido.'});
    const client = Number(req.params.id);
    if (!db.prepare('SELECT id FROM clients WHERE id=?').get(client)) return res.status(404).json({error:'Cliente não encontrado.'});
    return res.json({ preference:service.getPreference(client), events:service.events(client), jobs:service.jobs(client), history:service.history(client) });
  });
  router.put('/clients/:id/preference', (req,res) => validId(req.params.id) ? respond(res,service.preference(Number(req.params.id),req.body,req.manager.id)) : res.status(400).json({error:'Cliente inválido.'}));
  router.post('/events', (req,res) => respond(res,service.createEvent(req.body,req.manager.id),201));
  router.post('/jobs', (req,res) => {
    const result = service.plan(req.body,req.manager.id);
    return respond(res,result,result?.duplicate ? 200 : 201);
  });
  router.get('/jobs/:id', (req,res) => {
    if (!validId(req.params.id)) return res.status(400).json({error:'Simulação inválida.'});
    const job=service.getJob(Number(req.params.id));
    return job ? res.json(job) : res.status(404).json({error:'Simulação não encontrada.'});
  });
  router.post('/jobs/:id/:action', (req,res) => validId(req.params.id) ? respond(res,service.transition(Number(req.params.id),req.params.action,req.body || {},req.manager.id)) : res.status(400).json({error:'Simulação inválida.'}));
  return router;
}
module.exports = { createRetentionRouter };
