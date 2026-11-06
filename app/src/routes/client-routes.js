const { text, ids } = require('./workflow-utils');
const { createHash } = require('node:crypto');

const AUDIT_TYPE = 'audit_crm';
let sequence = 0;
// Savepoints compõem alteração e auditoria sem transações aninhadas incompatíveis.
function atomic(db, operation) {
  const name = 'crm_' + ++sequence;
  db.exec('SAVEPOINT ' + name);
  try { const result = operation(); db.exec('RELEASE ' + name); return result; }
  catch (error) { db.exec('ROLLBACK TO ' + name); db.exec('RELEASE ' + name); throw error; }
}
function audit(db, clientId, managerId, event) {
  const now = new Date().toISOString();
  db.prepare('INSERT INTO client_interactions(client_id, type, occurred_at, summary, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(clientId, AUDIT_TYPE, now, JSON.stringify({ managerId, ...event }), now, now);
}
function snapshot(db, clientId) {
  const protect = (row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key,
    ['email', 'phone', 'contact', 'summary', 'description'].includes(key) && value
      ? 'sha256:' + createHash('sha256').update(String(value)).digest('hex') : value]));
  return {
    client: protect(db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId) || {}),
    contacts: db.prepare('SELECT * FROM client_contacts WHERE client_id = ? ORDER BY id').all(clientId).map(protect),
    services: db.prepare('SELECT * FROM service_instances WHERE client_id = ? ORDER BY id').all(clientId).map(protect),
    interactions: db.prepare('SELECT * FROM client_interactions WHERE client_id = ? AND type <> ? ORDER BY id').all(clientId, AUDIT_TYPE).map(protect)
  };
}

function audited(db, handler) {
  return (req, res, next) => {
    if (typeof req.body?.type === 'string' && req.body.type.trim().toLowerCase() === AUDIT_TYPE) return res.status(400).json({ error: 'Tipo reservado à auditoria do servidor.' });
    if (req.params.interactionId && db.prepare('SELECT type FROM client_interactions WHERE id = ? AND client_id = ?')
      .get(req.params.interactionId, req.params.id)?.type === AUDIT_TYPE) return res.status(409).json({ error: 'Auditoria imutável.' });
    const send = res.json;
    let payload;
    res.json = (data) => { payload = data; return res; };
    try {
      atomic(db, () => {
        const before = req.params.id ? snapshot(db, req.params.id) : null;
        handler(req, res);
        if (res.statusCode < 400) {
          const clientId = req.params.id || payload.id;
          audit(db, clientId, req.manager.id, { action: req.method + ' ' + req.route.path, before, after: snapshot(db, clientId) });
        }
      });
      res.json = send;
      return res.json(payload);
    } catch (error) { res.json = send; return next(error); }
  };
}

function mountClientRoutes(router, db) {
  const exists = (id) => db.prepare('SELECT id FROM clients WHERE id = ?').get(id);
  const contact = (id, clientId) => db.prepare('SELECT id FROM client_contacts WHERE id = ? AND client_id = ?').get(id, clientId);
  const validContact = (data) => text(data.name, 120) &&
    ['role', 'email', 'phone'].every((key) => typeof (data[key] ?? '') === 'string') &&
    (data.role ?? '').length <= 120 && (data.email ?? '').length <= 254 && (data.phone ?? '').length <= 40 &&
    (!data.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email));
  const validInteraction = (data, clientId) => text(data.type, 80) && text(data.summary, 2000) &&
    typeof data.occurredAt === 'string' && !Number.isNaN(Date.parse(data.occurredAt)) &&
    (data.contactId == null || (Number.isSafeInteger(data.contactId) && !!contact(data.contactId, clientId)));
  const validInstance = (data) => Number.isSafeInteger(data.productId) &&
    !!db.prepare('SELECT id FROM products WHERE id = ?').get(data.productId) && text(data.name, 120) &&
    ['location', 'externalId', 'description'].every((key) => typeof (data[key] ?? '') === 'string') &&
    (data.location ?? '').length <= 160 && (data.externalId ?? '').length <= 120 &&
    (data.description ?? '').length <= 500 && typeof data.active === 'boolean';

  router.get('/clients', (req, res) => {
    const page = Number(req.query.page || 1), pageSize = Number(req.query.pageSize || 50);
    if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100 ||
      (req.query.search !== undefined && (typeof req.query.search !== 'string' || req.query.search.length > 200)) ||
      (req.query.origin && !['imported', 'manual'].includes(req.query.origin))) return res.status(400).json({ error: 'Filtros de clientes inválidos.' });
    const clauses = [], values = [];
    if (req.query.search) {
      clauses.push("(c.name LIKE ? ESCAPE '\\' OR c.account_owner LIKE ? ESCAPE '\\')");
      const term = '%' + req.query.search.trim().replace(/[\\%_]/g, '\\$&') + '%'; values.push(term, term);
    }
    const imported = 'EXISTS (SELECT 1 FROM external_client_ids e WHERE e.client_id = c.id) OR EXISTS (SELECT 1 FROM imported_feedbacks f WHERE f.client_id = c.id)';
    if (req.query.origin) clauses.push((req.query.origin === 'manual' ? 'NOT ' : '') + '(' + imported + ')');
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
    const total = db.prepare('SELECT COUNT(*) AS total FROM clients c ' + where).get(...values).total;
    const items = db.prepare(`SELECT c.*, (${imported}) AS imported,
    (SELECT COUNT(*) FROM feedback_overview WHERE client_id = c.id) AS feedback_count,
    (SELECT COUNT(*) FROM client_contacts WHERE client_id = c.id) AS contact_count
    FROM clients c ${where} ORDER BY c.name, c.id LIMIT ? OFFSET ?`).all(...values, pageSize, (page - 1) * pageSize);
    return res.json({ items, total, page, pageSize });
  });
  const post = (path, handler) => router.post(path, audited(db, handler));
  const put = (path, handler) => router.put(path, audited(db, handler));
  post('/clients', (req, res) => {
    const { name, contact: legacy = '', accountOwner = '', productIds = [] } = req.body || {};
    if (!text(name, 120) || typeof legacy !== 'string' || legacy.length > 200 ||
      typeof accountOwner !== 'string' || accountOwner.length > 120 || !ids(productIds) ||
      productIds.some((id) => !db.prepare('SELECT id FROM products WHERE id = ?').get(id))) {
      return res.status(400).json({ error: 'Dados da organização inválidos.' });
    }
    const id = atomic(db, () => {
      const now = new Date().toISOString();
      const result = db.prepare('INSERT INTO clients(name, contact, account_owner, created_at) VALUES (?, ?, ?, ?)')
        .run(name.trim(), legacy.trim(), accountOwner.trim(), now);
      if (legacy.trim()) db.prepare('INSERT INTO client_contacts(client_id, name, legacy, created_at, updated_at) VALUES (?, ?, 1, ?, ?)')
        .run(result.lastInsertRowid, legacy.trim(), now, now);
      for (const productId of productIds) {
        db.prepare('INSERT INTO client_products VALUES (?, ?)').run(result.lastInsertRowid, productId);
        const product = db.prepare('SELECT name FROM products WHERE id = ?').get(productId);
        db.prepare(`INSERT INTO service_instances(client_id, product_id, name, legacy, created_at, updated_at)
          VALUES (?, ?, ?, 1, ?, ?)`).run(result.lastInsertRowid, productId, product.name, now, now);
      }
      return result.lastInsertRowid;
    });
    return res.status(201).json({ id });
  });
  router.get('/clients/:id', (req, res) => {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    if (!client) return res.status(404).json({ error: 'Organização não encontrada.' });
    return res.json({ client,
      origins: db.prepare('SELECT source_system, external_client_id FROM external_client_ids WHERE client_id = ?').all(client.id),
      identityReviews: db.prepare('SELECT id, feedback_id, status, reviewed_by, reviewed_at, justification FROM identity_pending WHERE resolved_client_id = ?').all(client.id),
      occurrences: db.prepare(`SELECT DISTINCT p.id, p.title, p.status FROM quality_problems p JOIN problem_feedbacks pf ON pf.problem_id = p.id JOIN feedback_overview f ON f.id = pf.feedback_id WHERE f.client_id = ?`).all(client.id),
      contacts: db.prepare('SELECT * FROM client_contacts WHERE client_id = ? ORDER BY name, id').all(client.id),
      auditEvents: db.prepare('SELECT * FROM client_interactions WHERE client_id = ? AND type = ? ORDER BY id DESC').all(client.id, AUDIT_TYPE),
      interactions: db.prepare(`SELECT i.*, c.name AS contact_name FROM client_interactions i
        LEFT JOIN client_contacts c ON c.id = i.contact_id WHERE i.client_id = ? AND i.type <> ?
        ORDER BY i.occurred_at DESC, i.id DESC`).all(client.id, AUDIT_TYPE),
      products: db.prepare('SELECT p.* FROM products p JOIN client_products cp ON cp.product_id = p.id WHERE cp.client_id = ?').all(client.id),
      serviceInstances: db.prepare(`SELECT s.*, p.name AS product_name FROM service_instances s
        JOIN products p ON p.id = s.product_id WHERE s.client_id = ? ORDER BY s.id`).all(client.id),
      feedbacks: db.prepare('SELECT * FROM feedback_overview WHERE client_id = ? ORDER BY id DESC').all(client.id) });
  });
  router.get('/clients/:id/services', (req, res) => {
    if (!exists(req.params.id)) return res.status(404).json({ error: 'Organização não encontrada.' });
    return res.json({ items: db.prepare(`SELECT s.*, p.name AS product_name FROM service_instances s
      JOIN products p ON p.id = s.product_id WHERE s.client_id = ? ORDER BY s.id`).all(req.params.id) });
  });
  post('/clients/:id/services', (req, res) => {
    if (!exists(req.params.id)) return res.status(404).json({ error: 'Organização não encontrada.' });
    const data = req.body || {};
    if (!validInstance(data)) return res.status(400).json({ error: 'Dados do serviço contratado inválidos.' });
    const id = atomic(db, () => {
      const now = new Date().toISOString();
      const result = db.prepare(`INSERT INTO service_instances(client_id, product_id, name, location, external_id, description, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(req.params.id, data.productId, data.name.trim(),
        (data.location || '').trim(), (data.externalId || '').trim(), (data.description || '').trim(), data.active ? 1 : 0, now, now);
      db.prepare('INSERT OR IGNORE INTO client_products VALUES (?, ?)').run(req.params.id, data.productId);
      return result.lastInsertRowid;
    });
    return res.status(201).json({ id });
  });
  put('/clients/:id/services/:serviceId', (req, res) => {
    const current = db.prepare('SELECT id FROM service_instances WHERE id = ? AND client_id = ?').get(req.params.serviceId, req.params.id);
    if (!current) return res.status(404).json({ error: 'Serviço contratado não encontrado.' });
    const data = req.body || {};
    if (!validInstance(data)) return res.status(400).json({ error: 'Dados do serviço contratado inválidos.' });
    if (db.prepare(`SELECT 1 FROM feedback_context c JOIN imported_feedbacks i ON i.feedback_id = c.feedback_id
      WHERE c.service_instance_id = ? AND c.product_id IS NOT ?`).get(req.params.serviceId, data.productId)) return res.status(409).json({ error: 'O serviço possui evidência importada e não pode trocar de produto.' });
    atomic(db, () => {
      db.prepare(`UPDATE service_instances SET product_id = ?, name = ?, location = ?, external_id = ?,
        description = ?, active = ?, legacy = 0, updated_at = ? WHERE id = ?`).run(data.productId, data.name.trim(),
        (data.location || '').trim(), (data.externalId || '').trim(), (data.description || '').trim(), data.active ? 1 : 0,
        new Date().toISOString(), req.params.serviceId);
      db.prepare('INSERT OR IGNORE INTO client_products VALUES (?, ?)').run(req.params.id, data.productId);
      db.prepare('UPDATE feedback_context SET product_id = ? WHERE service_instance_id = ?').run(data.productId, req.params.serviceId);
    });
    return res.json({ updated: true });
  });
  put('/clients/:id', (req, res) => {
    if (!exists(req.params.id)) return res.status(404).json({ error: 'Organização não encontrada.' });
    const { name, accountOwner = '' } = req.body || {};
    if (!text(name, 120) || typeof accountOwner !== 'string' || accountOwner.length > 120) return res.status(400).json({ error: 'Nome ou responsável inválido.' });
    db.prepare('UPDATE clients SET name = ?, account_owner = ? WHERE id = ?').run(name.trim(), accountOwner.trim(), req.params.id);
    return res.json({ updated: true });
  });
  post('/clients/:id/contacts', (req, res) => {
    if (!exists(req.params.id)) return res.status(404).json({ error: 'Organização não encontrada.' });
    const data = req.body || {};
    if (!validContact(data)) return res.status(400).json({ error: 'Dados do contato inválidos.' });
    const now = new Date().toISOString();
    const result = db.prepare('INSERT INTO client_contacts(client_id, name, role, email, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(req.params.id, data.name.trim(), (data.role || '').trim(), (data.email || '').trim(), (data.phone || '').trim(), now, now);
    return res.status(201).json({ id: result.lastInsertRowid });
  });
  put('/clients/:id/contacts/:contactId', (req, res) => {
    if (!contact(req.params.contactId, req.params.id)) return res.status(404).json({ error: 'Contato não encontrado.' });
    const data = req.body || {};
    if (!validContact(data)) return res.status(400).json({ error: 'Dados do contato inválidos.' });
    db.prepare('UPDATE client_contacts SET name = ?, role = ?, email = ?, phone = ?, updated_at = ? WHERE id = ?')
      .run(data.name.trim(), (data.role || '').trim(), (data.email || '').trim(), (data.phone || '').trim(), new Date().toISOString(), req.params.contactId);
    return res.json({ updated: true });
  });
  post('/clients/:id/interactions', (req, res) => {
    if (!exists(req.params.id)) return res.status(404).json({ error: 'Organização não encontrada.' });
    const data = req.body || {};
    if (!validInteraction(data, req.params.id)) return res.status(400).json({ error: 'Dados da interação inválidos.' });
    const now = new Date().toISOString();
    const result = db.prepare('INSERT INTO client_interactions(client_id, contact_id, type, occurred_at, summary, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(req.params.id, data.contactId ?? null, data.type.trim(), new Date(data.occurredAt).toISOString(), data.summary.trim(), now, now);
    return res.status(201).json({ id: result.lastInsertRowid });
  });
  put('/clients/:id/interactions/:interactionId', (req, res) => {
    if (!db.prepare('SELECT id FROM client_interactions WHERE id = ? AND client_id = ?').get(req.params.interactionId, req.params.id)) return res.status(404).json({ error: 'Interação não encontrada.' });
    const data = req.body || {};
    if (!validInteraction(data, req.params.id)) return res.status(400).json({ error: 'Dados da interação inválidos.' });
    db.prepare('UPDATE client_interactions SET contact_id = ?, type = ?, occurred_at = ?, summary = ?, updated_at = ? WHERE id = ?')
      .run(data.contactId ?? null, data.type.trim(), new Date(data.occurredAt).toISOString(), data.summary.trim(), new Date().toISOString(), req.params.interactionId);
    return res.json({ updated: true });
  });
}

module.exports = { mountClientRoutes, audit, atomic, AUDIT_TYPE };
