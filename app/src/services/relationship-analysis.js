const { createHash } = require('node:crypto');
const { atomic, text } = require('../routes/workflow-utils');

// Expressões explícitas, sem classificação de sentimento ou diagnóstico técnico.
const rules = [
  ['retorno', /\b(?:n[aã]o (?:recebemos|recebi|houve|obtivemos) retorno|sem retorno|falta de retorno|demora (?:no|de) retorno)\b/i, 'Possível falta ou demora de retorno'],
  ['atendimento', /\b(?:atendimento (?:inadequado|insatisfat[oó]rio|ruim)|insatisfa[çc][aã]o com (?:o )?atendimento)\b/i, 'Possível insatisfação com atendimento'],
  ['demanda', /\b(?:demanda n[aã]o atendida|solicita[çc][aã]o n[aã]o atendida)\b/i, 'Possível demanda não atendida'],
  ['comunicacao', /\b(?:comunica[çc][aã]o inadequada|falta de comunica[çc][aã]o)\b/i, 'Possível dificuldade de comunicação'],
  ['acompanhamento', /\b(?:acompanhamento insuficiente|falta de acompanhamento|sem acompanhamento)\b/i, 'Possível acompanhamento insuficiente'],
  ['adequacao', /\b(?:servi[çc]o inadequado|servi[çc]o desnecess[aá]rio)\b/i, 'Possível inadequação do serviço'],
  ['retencao', /\b(?:risco de abandono|pretendemos cancelar|pretendo cancelar)\b/i, 'Possível risco de abandono']
];
const limitations = 'Regra por expressões explícitas; pode omitir ou interpretar incorretamente o contexto. A hipótese não demonstra causa, culpa ou conclusão. Em relato misto, somente a expressão relacional é considerada; a referência técnica permanece externa.';
function createRelationshipAnalysis(db) {
  function get(id) {
    const hypothesis = db.prepare(`SELECT h.*, c.name AS client_name FROM relationship_hypotheses h JOIN clients c ON c.id = h.client_id WHERE h.id = ?`).get(id);
    if (!hypothesis) return null;
    const evidence = db.prepare(`SELECT e.feedback_id, e.technical_reference, i.dimension, i.occurred_at, i.source_system, i.external_event_id
      FROM relationship_evidence e JOIN imported_feedbacks i ON i.feedback_id = e.feedback_id WHERE e.hypothesis_id = ? ORDER BY e.feedback_id`).all(id);
    const decisions = db.prepare(`SELECT d.*, m.email AS actor FROM relationship_decisions d JOIN managers m ON m.id = d.manager_id WHERE d.hypothesis_id = ? ORDER BY d.id`).all(id);
    const interactions = db.prepare('SELECT interaction_id, occurred_at, summary_snapshot FROM relationship_interaction_evidence WHERE hypothesis_id = ? ORDER BY interaction_id').all(id);
    return { ...hypothesis, evidence, interactions, decisions };
  }
  function analyze(clientId) {
    if (!db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId)) return null;
    const feedbacks = db.prepare(`SELECT i.feedback_id, i.occurred_at, i.dimension, i.technical_reference, f.comment
      FROM imported_feedbacks i JOIN feedbacks f ON f.id = i.feedback_id
      LEFT JOIN feedback_context c ON c.feedback_id = i.feedback_id
      WHERE i.client_id = ? AND (c.client_id IS NULL OR c.client_id = i.client_id)
        AND i.dimension IN ('relationship','mixed') ORDER BY i.feedback_id`).all(clientId);
    const interactions = db.prepare('SELECT id, occurred_at, summary FROM client_interactions WHERE client_id = ? ORDER BY id').all(clientId).filter(row => Number.isFinite(Date.parse(row.occurred_at)));
    return atomic(db, () => {
      const ids = [];
      for (const [key, pattern, description] of rules) {
        const matches = feedbacks.filter(row => pattern.test(row.comment));
        if (!matches.length) continue;
        const history = interactions.filter(row => pattern.test(row.summary));
        const fingerprint = createHash('sha256').update(JSON.stringify([clientId, key, matches.map(x => x.feedback_id), history.map(x => [x.id, x.occurred_at, x.summary])])).digest('hex');
        let h = db.prepare('SELECT id FROM relationship_hypotheses WHERE fingerprint = ?').get(fingerprint);
        if (!h) {
          const dates = matches.map(x => new Date(x.occurred_at).toISOString()).concat(history.map(x => new Date(x.occurred_at).toISOString())).sort();
          const id = Number(db.prepare(`INSERT INTO relationship_hypotheses(client_id, fingerprint, criterion, description, limitations, period_start, period_end, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(clientId, fingerprint, `Expressão relacional explícita: ${key}`, description, limitations, dates[0], dates.at(-1), new Date().toISOString()).lastInsertRowid);
          for (const row of matches) db.prepare('INSERT INTO relationship_evidence VALUES (?, ?, ?)').run(id, row.feedback_id, row.dimension === 'mixed' ? row.technical_reference : null);
          for (const row of history) db.prepare('INSERT INTO relationship_interaction_evidence VALUES (?, ?, ?, ?)').run(id, row.id, row.occurred_at, row.summary);
          h = { id };
        }
        ids.push(h.id);
      }
      return ids.map(get);
    });
  }
  function review(id, { status, justification, description }, managerId) {
    if (!['confirmed', 'rejected', 'adjusted'].includes(status) || !text(justification, 1000) || (status === 'adjusted' && !text(description, 2000)) || (status !== 'adjusted' && description !== undefined)) return { error: 'Decisão, justificativa ou descrição inválida.', code: 400 };
    return atomic(db, () => {
      const h = db.prepare('SELECT * FROM relationship_hypotheses WHERE id = ?').get(id);
      if (!h) return { error: 'Hipótese não encontrada.', code: 404 };
      if (!['pending', 'adjusted'].includes(h.status)) return { error: 'Transição não permitida.', code: 409 };
      if (!db.prepare('SELECT id FROM managers WHERE id = ?').get(managerId)) return { error: 'Gestor inválido.', code: 403 };
      const nextDescription = status === 'adjusted' ? description.trim() : h.description;
      db.prepare(`INSERT INTO relationship_decisions(hypothesis_id, previous_status, status, previous_description, description, justification, manager_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, h.status, status, h.description, nextDescription, justification.trim(), managerId, new Date().toISOString());
      db.prepare('UPDATE relationship_hypotheses SET status = ?, description = ? WHERE id = ?').run(status, nextDescription, id);
      return get(id);
    });
  }
  return { analyze, get, review, list(clientId) {
    const rows = clientId ? db.prepare('SELECT id FROM relationship_hypotheses WHERE client_id = ? ORDER BY id').all(clientId) : db.prepare('SELECT id FROM relationship_hypotheses ORDER BY id').all();
    return rows.map(row => get(row.id));
  } };
}
module.exports = { createRelationshipAnalysis };
