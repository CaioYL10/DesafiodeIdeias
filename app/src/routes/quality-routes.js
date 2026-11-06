const express = require('express');
const { requireManager } = require('../middleware/require-manager');
const { text, ids, atomic, validDate } = require('./workflow-utils');
const impacts = ['low', 'medium', 'high', 'critical'];
const priorities = ['low', 'normal', 'high'];
function validAnalysis(data, db, currentId = null) {
  const { impact, priority, containment, cause, recurrent, relatedProblemId } = data;
  if (!impacts.includes(impact) || !priorities.includes(priority) || !text(containment, 2000) ||
    typeof cause !== 'string' || cause.trim().length > 2000 || typeof recurrent !== 'boolean') return false;
  if (relatedProblemId === null) return true;
  return recurrent && Number.isSafeInteger(relatedProblemId) && relatedProblemId > 0 &&
    relatedProblemId !== currentId && (!currentId || relatedProblemId < currentId) &&
    Boolean(db.prepare('SELECT id FROM quality_problems WHERE id = ?').get(relatedProblemId));
}

function createQualityRouter(db) {
  const router = express.Router();
  router.use(requireManager(db));
  const event = (problemId, managerId, description) => db.prepare('INSERT INTO quality_events(problem_id, manager_id, description, created_at) VALUES (?, ?, ?, ?)').run(problemId, managerId, description, new Date().toISOString());
  router.get('/', (req, res) => {
    const items = db.prepare(`SELECT p.*,
      (SELECT COUNT(*) FROM quality_actions WHERE problem_id = p.id) AS action_count,
      (SELECT COUNT(*) FROM quality_actions WHERE problem_id = p.id AND status IN ('pending', 'ineffective') AND due_date < date('now','-3 hours')) AS overdue_count
      FROM quality_problems p ORDER BY p.id DESC`).all();
    return res.json({ items });
  });
  router.post('/', (req, res) => {
    const { title, category, analysis, hypothesisId, clientId, feedbackIds } = req.body || {};
    const structured = {
      impact: req.body?.impact ?? 'medium', priority: req.body?.priority ?? 'normal',
      containment: req.body?.containment ?? 'A definir na triagem', cause: '',
      recurrent: req.body?.recurrent ?? false, relatedProblemId: req.body?.relatedProblemId ?? null
    };
    if (!text(title, 160) || !text(category, 80) || !text(analysis, 2000) ||
      !Number.isSafeInteger(hypothesisId) || hypothesisId <= 0 || !Number.isSafeInteger(clientId) || clientId <= 0 ||
      !ids(feedbackIds) || !feedbackIds.length || !validAnalysis(structured, db) ||
      (req.body.cause !== undefined && req.body.cause !== '')) return res.status(400).json({ error: 'Informe hipótese, cliente, evidências e descrição relacional válidos.' });
    const hypothesis = db.prepare('SELECT * FROM relationship_hypotheses WHERE id = ?').get(hypothesisId);
    if (!hypothesis) return res.status(404).json({ error: 'Hipótese não encontrada.' });
    const decision = db.prepare("SELECT * FROM relationship_decisions WHERE hypothesis_id = ? AND status = 'confirmed' ORDER BY id DESC LIMIT 1").get(hypothesisId);
    const evidence = db.prepare(`SELECT e.feedback_id, i.client_id, i.dimension, c.client_id AS context_client,
      ip.status AS identity_status FROM relationship_evidence e JOIN imported_feedbacks i ON i.feedback_id = e.feedback_id
      LEFT JOIN feedback_context c ON c.feedback_id = i.feedback_id
      LEFT JOIN identity_pending ip ON ip.feedback_id = i.feedback_id WHERE e.hypothesis_id = ? ORDER BY e.feedback_id`).all(hypothesisId);
    if (hypothesis.status !== 'confirmed' || !decision || hypothesis.client_id !== clientId || !evidence.length ||
      evidence.some(e => e.client_id !== clientId || (e.context_client !== null && e.context_client !== clientId) ||
        !['relationship', 'mixed'].includes(e.dimension) || e.identity_status === 'pending') ||
      evidence.length !== feedbackIds.length || evidence.some(e => !feedbackIds.includes(e.feedback_id)))
      return res.status(409).json({ error: 'Hipótese, decisão, cliente ou evidências incompatíveis.' });
    if (structured.relatedProblemId && !db.prepare('SELECT id FROM quality_problems WHERE id = ? AND client_id = ?').get(structured.relatedProblemId, clientId))
      return res.status(409).json({ error: 'Ocorrência relacionada pertence a outro cliente ou é histórica.' });
    const id = atomic(db, () => {
      const instances = db.prepare(`SELECT DISTINCT service_instance_id FROM feedback_overview
        WHERE id IN (${feedbackIds.map(() => '?').join(',')})`).all(...feedbackIds);
      const instanceId = instances.length === 1 ? instances[0].service_instance_id : null;
      const result = db.prepare(`INSERT INTO quality_problems(title, category, analysis, manager_id, created_at,
        service_instance_id, impact, priority, containment, cause, recurrent, related_problem_id, hypothesis_id, decision_id, client_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(title.trim(), category.trim(), analysis.trim(), req.manager.id,
          new Date().toISOString(), instanceId, structured.impact, structured.priority, structured.containment.trim(),
          '', Number(structured.recurrent), structured.relatedProblemId, hypothesisId, decision.id, clientId);
      for (const feedbackId of feedbackIds) db.prepare('INSERT INTO problem_feedbacks VALUES (?, ?)').run(result.lastInsertRowid, feedbackId);
      event(result.lastInsertRowid, req.manager.id, `Ocorrência relacional aberta por decisão humana #${decision.id} da hipótese #${hypothesisId}.`);
      return result.lastInsertRowid;
    });
    return res.status(201).json({ id });
  });
  router.get('/:id', (req, res) => {
    const problem = db.prepare(`SELECT p.*, s.name AS service_instance_name, s.client_id AS service_client_id,
      s.product_id AS service_product_id FROM quality_problems p
      LEFT JOIN service_instances s ON s.id = p.service_instance_id WHERE p.id = ?`).get(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problema não encontrado.' });
    return res.json({ problem,
      feedbacks: db.prepare('SELECT f.* FROM feedback_overview f JOIN problem_feedbacks pf ON pf.feedback_id = f.id WHERE pf.problem_id = ?').all(problem.id),
      actions: db.prepare('SELECT * FROM quality_actions WHERE problem_id = ? ORDER BY id').all(problem.id),
      attempts: db.prepare(`SELECT t.* FROM quality_action_attempts t JOIN quality_actions a ON a.id = t.action_id
        WHERE a.problem_id = ? ORDER BY t.id`).all(problem.id),
      events: db.prepare('SELECT e.*, m.email AS actor FROM quality_events e JOIN managers m ON m.id = e.manager_id WHERE problem_id = ? ORDER BY e.id DESC').all(problem.id) });
  });
  router.put('/:id/analysis', (req, res) => {
    const problem = db.prepare('SELECT * FROM quality_problems WHERE id = ?').get(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problema não encontrado.' });
    if (problem.status === 'closed') return res.status(409).json({ error: 'O problema já está encerrado.' });
    const data = req.body || {};
    if (data.relatedProblemId && problem.client_id && !db.prepare('SELECT id FROM quality_problems WHERE id = ? AND client_id = ?').get(data.relatedProblemId, problem.client_id)) return res.status(409).json({ error: 'Ocorrência relacionada incompatível.' });
    if (!validAnalysis(data, db, problem.id)) return res.status(400).json({ error: 'Impacto, prioridade, contenção, causa ou recorrência inválidos.' });
    const changes = [
      ['impact', data.impact], ['priority', data.priority], ['containment', data.containment.trim()],
      ['cause', data.cause.trim()], ['recurrent', Number(data.recurrent)], ['related_problem_id', data.relatedProblemId]
    ].filter(([field, value]) => problem[field] !== value);
    if (changes.length) atomic(db, () => {
      db.prepare(`UPDATE quality_problems SET impact = ?, priority = ?, containment = ?, cause = ?, recurrent = ?, related_problem_id = ? WHERE id = ?`)
        .run(data.impact, data.priority, data.containment.trim(), data.cause.trim(), Number(data.recurrent), data.relatedProblemId, problem.id);
      for (const [field, value] of changes) event(problem.id, req.manager.id, `${field}: ${String(problem[field] ?? 'não informado')} → ${String(value ?? 'não informado')}.`);
    });
    return res.json({ updated: true });
  });
  router.put('/:id/service', (req, res) => {
    const problem = db.prepare('SELECT * FROM quality_problems WHERE id = ?').get(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problema não encontrado.' });
    if (problem.status === 'closed') return res.status(409).json({ error: 'O problema já está encerrado.' });
    const { serviceInstanceId = null } = req.body || {};
    if (serviceInstanceId !== null && (!Number.isSafeInteger(serviceInstanceId) ||
      !db.prepare(`SELECT 1 FROM service_instances s JOIN problem_feedbacks pf ON pf.problem_id = ?
        JOIN feedback_overview f ON f.id = pf.feedback_id WHERE s.id = ? AND s.client_id = f.client_id
        LIMIT 1`).get(req.params.id, serviceInstanceId))) return res.status(400).json({ error: 'Serviço contratado não pertence aos relatos do problema.' });
    atomic(db, () => {
      db.prepare('UPDATE quality_problems SET service_instance_id = ? WHERE id = ?').run(serviceInstanceId, req.params.id);
      event(req.params.id, req.manager.id, serviceInstanceId === null ? 'Contexto do serviço removido.' : `Serviço contratado #${serviceInstanceId} associado ao problema.`);
    });
    return res.json({ updated: true });
  });
  router.post('/:id/actions', (req, res) => {
    const problem = db.prepare('SELECT * FROM quality_problems WHERE id = ?').get(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problema não encontrado.' });
    if (problem.status === 'closed') return res.status(409).json({ error: 'O problema já está encerrado.' });
    const { description, owner, dueDate } = req.body || {};
    if (!text(description, 1000) || !text(owner, 120) || !validDate(dueDate)) return res.status(400).json({ error: 'Informe ação, responsável e uma data de prazo válida.' });
    const id = atomic(db, () => {
      const result = db.prepare('INSERT INTO quality_actions(problem_id, description, owner, due_date, created_at) VALUES (?, ?, ?, ?, ?)').run(problem.id, description.trim(), owner.trim(), dueDate, new Date().toISOString());
      db.prepare("UPDATE quality_problems SET status = 'in_progress' WHERE id = ?").run(problem.id);
      event(problem.id, req.manager.id, `Ação #${result.lastInsertRowid} criada: ${description.trim()}. Responsável: ${owner.trim()}. Prazo: ${dueDate}.`);
      return result.lastInsertRowid;
    });
    return res.status(201).json({ id });
  });
  router.post('/actions/:id/complete', (req, res) => {
    const action = db.prepare('SELECT * FROM quality_actions WHERE id = ?').get(req.params.id);
    if (!action) return res.status(404).json({ error: 'Ação não encontrada.' });
    if (db.prepare('SELECT status FROM quality_problems WHERE id = ?').get(action.problem_id).status === 'closed') return res.status(409).json({ error: 'O problema já está encerrado.' });
    if (!['pending', 'ineffective'].includes(action.status)) return res.status(409).json({ error: 'Esta ação não está pendente de execução.' });
    const { evidence } = req.body || {};
    if (!text(evidence, 2000)) return res.status(400).json({ error: 'Registre uma evidência de conclusão de até 2.000 caracteres.' });
    atomic(db, () => {
      const now = new Date().toISOString();
      db.prepare("UPDATE quality_actions SET status = 'completed', evidence = ?, completed_at = ?, verification_note = NULL, verified_at = NULL WHERE id = ?").run(evidence.trim(), now, action.id);
      db.prepare('INSERT INTO quality_action_attempts(action_id, evidence, completed_at) VALUES (?, ?, ?)').run(action.id, evidence.trim(), now);
      event(action.problem_id, req.manager.id, `Ação #${action.id} concluída. Evidência: ${evidence.trim()}`);
    });
    return res.json({ updated: true });
  });
  router.post('/actions/:id/verify', (req, res) => {
    const action = db.prepare('SELECT * FROM quality_actions WHERE id = ?').get(req.params.id);
    if (!action) return res.status(404).json({ error: 'Ação não encontrada.' });
    if (db.prepare('SELECT status FROM quality_problems WHERE id = ?').get(action.problem_id).status === 'closed') return res.status(409).json({ error: 'O problema já está encerrado.' });
    if (action.status !== 'completed') return res.status(409).json({ error: 'Conclua a ação com evidência antes de verificar a eficácia.' });
    const { effective, note, criterion } = req.body || {};
    if (typeof effective !== 'boolean' || !text(note, 2000) || !text(criterion, 1000)) return res.status(400).json({ error: 'Informe o resultado e a justificativa da verificação.' });
    atomic(db, () => {
      const now = new Date().toISOString();
      db.prepare('UPDATE quality_actions SET status = ?, verification_note = ?, verified_at = ? WHERE id = ?').run(effective ? 'effective' : 'ineffective', note.trim(), now, action.id);
      db.prepare(`UPDATE quality_action_attempts SET effective = ?, verification_note = ?, verified_at = ?, criterion = ?
        WHERE id = (SELECT MAX(id) FROM quality_action_attempts WHERE action_id = ?)`).run(Number(effective), note.trim(), now, criterion.trim(), action.id);
      event(action.problem_id, req.manager.id, `Ação #${action.id} verificada: ${effective ? 'eficaz' : 'ineficaz; requer nova execução'}. Critério: ${criterion.trim()}. Justificativa: ${note.trim()}`);
    });
    return res.json({ updated: true });
  });
  router.post('/:id/close', (req, res) => {
    const problem = db.prepare('SELECT * FROM quality_problems WHERE id = ?').get(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problema não encontrado.' });
    const { justification } = req.body || {};
    if (!text(justification, 2000)) return res.status(400).json({ error: 'Informe justificativa de encerramento.' });
    const actions = db.prepare('SELECT status FROM quality_actions WHERE problem_id = ?').all(problem.id);
    if (problem.status === 'closed' || !problem.cause.trim() || !actions.length || actions.some((action) => action.status !== 'effective')) return res.status(409).json({ error: 'O encerramento exige causa identificada, ao menos uma ação e todas com eficácia verificada.' });
    atomic(db, () => {
      db.prepare("UPDATE quality_problems SET status = 'closed', closed_at = ? WHERE id = ?").run(new Date().toISOString(), problem.id);
      event(problem.id, req.manager.id, `Problema encerrado após verificação de eficácia: ${justification.trim()}`);
    });
    return res.json({ updated: true });
  });
  router.post('/:id/reopen', (req, res) => {
    const problem = db.prepare('SELECT * FROM quality_problems WHERE id = ?').get(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problema não encontrado.' });
    if (problem.status !== 'closed') return res.status(409).json({ error: 'Somente problemas encerrados podem ser reabertos.' });
    if (!text(req.body?.justification, 2000)) return res.status(400).json({ error: 'Informe justificativa de reabertura.' });
    atomic(db, () => {
      db.prepare("UPDATE quality_problems SET status = 'in_progress', closed_at = NULL WHERE id = ?").run(problem.id);
      event(problem.id, req.manager.id, `Problema reaberto: ${req.body.justification.trim()}`);
    });
    return res.json({ updated: true });
  });
  return router;
}
module.exports = { createQualityRouter };
