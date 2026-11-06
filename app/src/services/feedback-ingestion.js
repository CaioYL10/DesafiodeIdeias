const { ALLOWED_SERVICES } = require('../db/feedback-repository');

function validCnpj(value) {
  if (!/^\d{14}$/.test(value) || /^(\d)\1{13}$/.test(value)) return false;
  const digit = (length) => {
    let weight = length - 7;
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(value[i]) * weight--;
      if (weight < 2) weight = 9;
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return digit(12) === Number(value[12]) && digit(13) === Number(value[13]);
}
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && Number.isFinite(Date.parse(value));
}
function validate(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Item inválido');
  const required = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max && value === value.trim();
  const optional = (value, max) => value == null || (typeof value === 'string' && value.length <= max && value === value.trim());
  if (!required(item.sourceSystem, 100) || !required(item.externalEventId, 150) || !optional(item.externalClientId, 150) || item.externalClientId === '' ||
      !validDate(item.occurredAt) ||
      !ALLOWED_SERVICES.has(item.service) || !['feedback', 'complaint', 'suggestion'].includes(item.kind) || !required(item.comment, 5000) ||
      !['technical', 'relationship', 'mixed'].includes(item.dimension) || !item.client || !required(item.client.name, 200) ||
      (item.client.cnpj != null && !validCnpj(item.client.cnpj)) ||
      !optional(item.contact, 200) || !optional(item.email, 254) || !optional(item.phone, 40) ||
      !optional(item.externalClassification, 200) || !optional(item.technicalReference, 500) ||
      (item.rating != null && (!Number.isInteger(item.rating) || item.rating < 1 || item.rating > 5))) throw new Error('Campos de origem inválidos');
  if (!item.externalClientId && !item.client.cnpj) throw new Error('Identificador confiável ausente');
}
function createIngestionService(db) {
  const transaction = (operation) => {
    db.exec('BEGIN IMMEDIATE');
    try { const result = operation(); db.exec('COMMIT'); return result; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  };
  const bind = (source, externalId, clientId) => {
    if (!externalId) return;
    const old = db.prepare('SELECT client_id FROM external_client_ids WHERE source_system = ? AND external_client_id = ?').get(source, externalId);
    if (old && old.client_id !== clientId) throw new Error('Identificador externo já vinculado a outro cliente');
    if (!old) db.prepare('INSERT INTO external_client_ids VALUES (?, ?, ?)').run(source, externalId, clientId);
  };
  function ingestOne(item) {
    validate(item);
    return transaction(() => {
      const existing = db.prepare('SELECT feedback_id FROM imported_feedbacks WHERE source_system = ? AND external_event_id = ?').get(item.sourceSystem, item.externalEventId);
      if (existing) return { status: 'duplicate', feedbackId: existing.feedback_id };
      const linked = item.externalClientId && db.prepare('SELECT client_id FROM external_client_ids WHERE source_system = ? AND external_client_id = ?').get(item.sourceSystem, item.externalClientId);
      const matches = item.client.cnpj ? db.prepare('SELECT client_id FROM client_cnpjs WHERE cnpj = ?').all(item.client.cnpj).map((row) => row.client_id) : [];
      const ambiguous = matches.length > 1 || (linked && matches.length === 1 && linked.client_id !== matches[0]) ||
        (linked && item.client.cnpj && db.prepare('SELECT 1 FROM client_cnpjs WHERE client_id = ? AND cnpj <> ?').get(linked.client_id, item.client.cnpj));
      let clientId = null;
      const now = new Date().toISOString();
      if (!ambiguous) {
        clientId = linked?.client_id || matches[0] || null;
        if (!clientId) clientId = Number(db.prepare('INSERT INTO clients(name, created_at) VALUES (?, ?)').run(item.client.name, now).lastInsertRowid);
        bind(item.sourceSystem, item.externalClientId, clientId);
        if (item.client.cnpj) db.prepare('INSERT OR IGNORE INTO client_cnpjs VALUES (?, ?)').run(item.client.cnpj, clientId);
      }
      const feedbackId = Number(db.prepare(`INSERT INTO feedbacks(service, rating, comment, demo_data, created_at, received_at, source_kind, reported_organization, reported_contact, reported_email)
        VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`).run(item.service, item.rating ?? null, item.comment, now, now, item.kind, item.client.name, item.contact || '', item.email || '').lastInsertRowid);
      db.prepare(`INSERT INTO imported_feedbacks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(feedbackId, item.sourceSystem, item.externalEventId, item.externalClientId || null, item.occurredAt, item.dimension, item.externalClassification ?? null, item.technicalReference ?? null, item.client.cnpj || null, item.phone || null, clientId);
      if (ambiguous) db.prepare('INSERT INTO identity_pending(feedback_id, source_system, external_client_id, client_name, cnpj, reason) VALUES (?, ?, ?, ?, ?, ?)').run(feedbackId, item.sourceSystem, item.externalClientId || null, item.client.name, item.client.cnpj || null, 'Identificadores conflitantes ou múltiplos candidatos');
      return { status: ambiguous ? 'pending' : 'imported', feedbackId, clientId };
    });
  }
  return {
    ingestOne,
    ingestBatch(items) { return items.map((item) => { try { return ingestOne(item); } catch (error) { return { status: 'error', error: error.message }; } }); },
    listPending() { return db.prepare("SELECT * FROM identity_pending WHERE status = 'pending' ORDER BY id").all(); },
    // O chamador deve autenticar a sessão do gestor antes de fornecer sua identidade.
    review(id, { managerId, action, clientId, justification }) {
      if (!Number.isSafeInteger(managerId) || !db.prepare('SELECT id FROM managers WHERE id = ?').get(managerId) || !['link', 'create', 'reject'].includes(action) || typeof justification !== 'string' || !justification.trim() || justification.length > 1000) throw new Error('Revisão inválida ou gestor não autorizado');
      return transaction(() => {
        const pending = db.prepare("SELECT * FROM identity_pending WHERE id = ? AND status = 'pending'").get(id);
        if (!pending) throw new Error('Pendência inexistente ou já revisada');
        if (db.prepare('SELECT client_id FROM feedback_context WHERE feedback_id = ? AND client_id IS NOT NULL').get(pending.feedback_id)) throw new Error('Feedback já possui decisão interna');
        const now = new Date().toISOString();
        let resolved = null;
        if (action === 'link') {
          if (!Number.isSafeInteger(clientId) || !db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId)) throw new Error('Cliente inválido');
          resolved = clientId;
        } else if (action === 'create') {
          resolved = Number(db.prepare('INSERT INTO clients(name, created_at) VALUES (?, ?)').run(pending.client_name, now).lastInsertRowid);
        }
        // Não altera um vínculo anterior nem cadastra CNPJ conflitante implicitamente.
        if (resolved) {
          bind(pending.source_system, pending.external_client_id, resolved);
          db.prepare('UPDATE imported_feedbacks SET client_id = ? WHERE feedback_id = ? AND client_id IS NULL').run(resolved, pending.feedback_id);
        }
        const status = { link: 'linked', create: 'created', reject: 'rejected' }[action];
        db.prepare('UPDATE identity_pending SET status = ?, reviewed_by = ?, reviewed_at = ?, justification = ?, resolved_client_id = ? WHERE id = ?').run(status, managerId, now, justification.trim(), resolved, id);
        return { status, clientId: resolved };
      });
    }
  };
}
module.exports = { createIngestionService, validCnpj };
