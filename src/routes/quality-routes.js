const express = require('express');
const { requireManager } = require('../middleware/require-manager');
const { text, ids, atomic, validDate } = require('./workflow-utils');

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
    const { title, category, analysis, feedbackIds } = req.body || {};
    if (!text(title, 160) || !text(category, 80) || !text(analysis, 2000) || !ids(feedbackIds) || !feedbackIds.length ||
      feedbackIds.some((id) => !db.prepare('SELECT id FROM feedbacks WHERE id = ?').get(id))) return res.status(400).json({ error: 'Informe título, categoria, análise e ao menos um feedback válido.' });
    const id = atomic(db, () => {
      const result = db.prepare('INSERT INTO quality_problems(title, category, analysis, manager_id, created_at) VALUES (?, ?, ?, ?, ?)').run(title.trim(), category.trim(), analysis.trim(), req.manager.id, new Date().toISOString());
      for (const feedbackId of feedbackIds) db.prepare('INSERT INTO problem_feedbacks VALUES (?, ?)').run(result.lastInsertRowid, feedbackId);
      event(result.lastInsertRowid, req.manager.id, 'Problema aberto após triagem humana.');
      return result.lastInsertRowid;
    });
    return res.status(201).json({ id });
  });
  router.get('/:id', (req, res) => {
    const problem = db.prepare('SELECT * FROM quality_problems WHERE id = ?').get(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problema não encontrado.' });
    return res.json({ problem,
      feedbacks: db.prepare('SELECT f.* FROM feedback_overview f JOIN problem_feedbacks pf ON pf.feedback_id = f.id WHERE pf.problem_id = ?').all(problem.id),
      actions: db.prepare('SELECT * FROM quality_actions WHERE problem_id = ? ORDER BY id').all(problem.id),
      events: db.prepare('SELECT e.*, m.email AS actor FROM quality_events e JOIN managers m ON m.id = e.manager_id WHERE problem_id = ? ORDER BY e.id DESC').all(problem.id) });
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
    if (!['pending', 'ineffective'].includes(action.status)) return res.status(409).json({ error: 'Esta ação não está pendente de execução.' });
    const { evidence } = req.body || {};
    if (!text(evidence, 2000)) return res.status(400).json({ error: 'Registre uma evidência de conclusão de até 2.000 caracteres.' });
    atomic(db, () => {
      db.prepare("UPDATE quality_actions SET status = 'completed', evidence = ?, completed_at = ?, verification_note = NULL, verified_at = NULL WHERE id = ?").run(evidence.trim(), new Date().toISOString(), action.id);
      event(action.problem_id, req.manager.id, `Ação #${action.id} concluída. Evidência: ${evidence.trim()}`);
    });
    return res.json({ updated: true });
  });
  router.post('/actions/:id/verify', (req, res) => {
    const action = db.prepare('SELECT * FROM quality_actions WHERE id = ?').get(req.params.id);
    if (!action) return res.status(404).json({ error: 'Ação não encontrada.' });
    if (action.status !== 'completed') return res.status(409).json({ error: 'Conclua a ação com evidência antes de verificar a eficácia.' });
    const { effective, note } = req.body || {};
    if (typeof effective !== 'boolean' || !text(note, 2000)) return res.status(400).json({ error: 'Informe o resultado e a justificativa da verificação.' });
    atomic(db, () => {
      db.prepare('UPDATE quality_actions SET status = ?, verification_note = ?, verified_at = ? WHERE id = ?').run(effective ? 'effective' : 'ineffective', note.trim(), new Date().toISOString(), action.id);
      event(action.problem_id, req.manager.id, `Ação #${action.id} verificada: ${effective ? 'eficaz' : 'ineficaz; requer nova execução'}. ${note.trim()}`);
    });
    return res.json({ updated: true });
  });
  router.post('/:id/close', (req, res) => {
    const problem = db.prepare('SELECT * FROM quality_problems WHERE id = ?').get(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problema não encontrado.' });
    const actions = db.prepare('SELECT status FROM quality_actions WHERE problem_id = ?').all(problem.id);
    if (problem.status === 'closed' || !actions.length || actions.some((action) => action.status !== 'effective')) return res.status(409).json({ error: 'O encerramento exige ao menos uma ação e todas com eficácia verificada.' });
    atomic(db, () => {
      db.prepare("UPDATE quality_problems SET status = 'closed', closed_at = ? WHERE id = ?").run(new Date().toISOString(), problem.id);
      event(problem.id, req.manager.id, 'Problema encerrado após verificação de eficácia de todas as ações.');
    });
    return res.json({ updated: true });
  });
  return router;
}
module.exports = { createQualityRouter };
