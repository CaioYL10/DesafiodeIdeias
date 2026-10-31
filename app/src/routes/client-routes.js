const { text, ids, atomic } = require('./workflow-utils');

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

  router.get('/clients', (req, res) => res.json({ items: db.prepare(`SELECT c.*,
    (SELECT COUNT(*) FROM feedback_context WHERE client_id = c.id) AS feedback_count,
    (SELECT COUNT(*) FROM client_contacts WHERE client_id = c.id) AS contact_count
    FROM clients c ORDER BY c.name`).all() }));
  router.post('/clients', (req, res) => {
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
      for (const productId of productIds) db.prepare('INSERT INTO client_products VALUES (?, ?)').run(result.lastInsertRowid, productId);
      return result.lastInsertRowid;
    });
    return res.status(201).json({ id });
  });
  router.get('/clients/:id', (req, res) => {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    if (!client) return res.status(404).json({ error: 'Organização não encontrada.' });
    return res.json({ client,
      contacts: db.prepare('SELECT * FROM client_contacts WHERE client_id = ? ORDER BY name, id').all(client.id),
      interactions: db.prepare(`SELECT i.*, c.name AS contact_name FROM client_interactions i
        LEFT JOIN client_contacts c ON c.id = i.contact_id WHERE i.client_id = ?
        ORDER BY i.occurred_at DESC, i.id DESC`).all(client.id),
      products: db.prepare('SELECT p.* FROM products p JOIN client_products cp ON cp.product_id = p.id WHERE cp.client_id = ?').all(client.id),
      feedbacks: db.prepare('SELECT * FROM feedback_overview WHERE client_id = ? ORDER BY id DESC').all(client.id) });
  });
  router.put('/clients/:id', (req, res) => {
    if (!exists(req.params.id)) return res.status(404).json({ error: 'Organização não encontrada.' });
    const { name, accountOwner = '' } = req.body || {};
    if (!text(name, 120) || typeof accountOwner !== 'string' || accountOwner.length > 120) return res.status(400).json({ error: 'Nome ou responsável inválido.' });
    db.prepare('UPDATE clients SET name = ?, account_owner = ? WHERE id = ?').run(name.trim(), accountOwner.trim(), req.params.id);
    return res.json({ updated: true });
  });
  router.post('/clients/:id/contacts', (req, res) => {
    if (!exists(req.params.id)) return res.status(404).json({ error: 'Organização não encontrada.' });
    const data = req.body || {};
    if (!validContact(data)) return res.status(400).json({ error: 'Dados do contato inválidos.' });
    const now = new Date().toISOString();
    const result = db.prepare('INSERT INTO client_contacts(client_id, name, role, email, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(req.params.id, data.name.trim(), (data.role || '').trim(), (data.email || '').trim(), (data.phone || '').trim(), now, now);
    return res.status(201).json({ id: result.lastInsertRowid });
  });
  router.put('/clients/:id/contacts/:contactId', (req, res) => {
    if (!contact(req.params.contactId, req.params.id)) return res.status(404).json({ error: 'Contato não encontrado.' });
    const data = req.body || {};
    if (!validContact(data)) return res.status(400).json({ error: 'Dados do contato inválidos.' });
    db.prepare('UPDATE client_contacts SET name = ?, role = ?, email = ?, phone = ?, updated_at = ? WHERE id = ?')
      .run(data.name.trim(), (data.role || '').trim(), (data.email || '').trim(), (data.phone || '').trim(), new Date().toISOString(), req.params.contactId);
    return res.json({ updated: true });
  });
  router.post('/clients/:id/interactions', (req, res) => {
    if (!exists(req.params.id)) return res.status(404).json({ error: 'Organização não encontrada.' });
    const data = req.body || {};
    if (!validInteraction(data, req.params.id)) return res.status(400).json({ error: 'Dados da interação inválidos.' });
    const now = new Date().toISOString();
    const result = db.prepare('INSERT INTO client_interactions(client_id, contact_id, type, occurred_at, summary, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(req.params.id, data.contactId ?? null, data.type.trim(), new Date(data.occurredAt).toISOString(), data.summary.trim(), now, now);
    return res.status(201).json({ id: result.lastInsertRowid });
  });
  router.put('/clients/:id/interactions/:interactionId', (req, res) => {
    if (!db.prepare('SELECT id FROM client_interactions WHERE id = ? AND client_id = ?').get(req.params.interactionId, req.params.id)) return res.status(404).json({ error: 'Interação não encontrada.' });
    const data = req.body || {};
    if (!validInteraction(data, req.params.id)) return res.status(400).json({ error: 'Dados da interação inválidos.' });
    db.prepare('UPDATE client_interactions SET contact_id = ?, type = ?, occurred_at = ?, summary = ?, updated_at = ? WHERE id = ?')
      .run(data.contactId ?? null, data.type.trim(), new Date(data.occurredAt).toISOString(), data.summary.trim(), new Date().toISOString(), req.params.interactionId);
    return res.json({ updated: true });
  });
}

module.exports = { mountClientRoutes };
