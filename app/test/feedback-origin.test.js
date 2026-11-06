const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { openDatabase } = require('../src/db/database');
const { createApp } = require('../src/app');
const { hashPassword } = require('../src/security/passwords');
const { startServer } = require('../test-support/server');

async function setup(context, sentimentService) {
  const db = openDatabase(':memory:');
  context.after(() => db.close());
  const password = await hashPassword('senha-demonstracao-segura');
  db.prepare('INSERT INTO managers(email, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?)')
    .run('gestor@demo.local', password.salt, password.hash, new Date().toISOString());
  const base = await startServer(createApp({ database: db, sentimentService }), context);
  const login = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'gestor@demo.local', password: 'senha-demonstracao-segura' }) });
  return { db, base, cookie: login.headers.get('set-cookie').split(';')[0] };
}

const payload = { service: 'internet', comment: 'Relato fictício de oscilação.', reportedOrganization: 'Empresa Exemplo',
  reportedContact: 'Ana Exemplo', reportedEmail: 'ana@example.test' };
const post = (base, url, body, cookie) => fetch(base + url, { method: 'POST',
  headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });

test('coleta pública e registro interno não existem, mesmo com sessão', async (context) => {
  const { db, base, cookie } = await setup(context);
  for (const path of ['/api/feedback', '/api/feedback/internal']) {
    for (const session of [undefined, cookie]) {
      assert.equal((await post(base, path, { ...payload, kind: 'complaint' }, session)).status, 404);
    }
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM feedbacks').get().total, 0);
});

test('vínculo legado exige decisão auditável e preserva autor, tipo, contato e serviço', async (context) => {
  const { db, base, cookie } = await setup(context);
  const now = new Date().toISOString();
  db.prepare("INSERT INTO clients(id, name, created_at) VALUES (1, 'Empresa cadastrada', ?)").run(now);
  db.prepare("INSERT INTO clients(id, name, created_at) VALUES (2, 'Outra empresa', ?)").run(now);
  db.prepare("INSERT INTO client_contacts(id, client_id, name, created_at, updated_at) VALUES (1, 1, 'Contato cadastrado', ?, ?)").run(now, now);
  db.prepare("INSERT INTO client_contacts(id, client_id, name, created_at, updated_at) VALUES (2, 2, 'Contato alheio', ?, ?)").run(now, now);
  db.prepare("INSERT INTO products(id, name, type, created_at) VALUES (1, 'Internet', 'service', ?)").run(now);
  db.prepare('INSERT INTO client_products VALUES (1, 1)').run();
  db.prepare("INSERT INTO service_instances(id, client_id, product_id, name, created_at, updated_at) VALUES (1, 1, 1, 'Unidade A', ?, ?)").run(now, now);
  const id = db.prepare("INSERT INTO feedbacks(service, comment, created_at, reported_contact) VALUES ('internet', ?, ?, ?)").run(payload.comment, now, payload.reportedContact).lastInsertRowid;
  const put = (body, authenticated = true) => fetch(base + '/api/manager/crm/feedback/' + id, { method: 'PUT', headers: { ...(authenticated ? { cookie } : {}), 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = { clientId: 1, contactId: 1, productId: 1, serviceInstanceId: 1, justification: 'Vínculo histórico conferido pela equipe.' };
  assert.equal((await put(data, false)).status, 401);
  assert.equal((await put({ ...data, justification: '' })).status, 400);
  assert.equal((await put({ ...data, kind: 'complaint' })).status, 400);
  assert.equal((await put({ ...data, contactId: 2 })).status, 400);
  assert.equal((await put(data)).status, 200);
  const detail = await fetch(base + '/api/manager/crm/feedback/' + id, { headers: { cookie } }).then((r) => r.json());
  assert.equal(detail.feedback.contact_name, 'Contato cadastrado');
  assert.equal(detail.feedback.service_instance_name, 'Unidade A');
  assert.equal(detail.feedback.reported_contact, 'Ana Exemplo');
  assert.equal(detail.feedback.kind, 'feedback');
  assert.equal((await put({ clientId: null, justification: 'Não há cliente escolhido.' })).status, 400);
  assert.equal((await put({ clientId: 2, contactId: 1, justification: 'Contato incompatível.' })).status, 400);
  assert.equal((await put({ clientId: 2, justification: 'Identificação histórica corrigida por pessoa autorizada.' })).status, 200);
  assert.equal(db.prepare('SELECT reported_contact FROM feedbacks WHERE id = ?').get(id).reported_contact, 'Ana Exemplo');
  const events = db.prepare("SELECT * FROM client_interactions WHERE type = 'audit_crm'").all();
  assert.equal(events.length, 3);
  const event = JSON.parse(events[1].summary);
  assert.equal(event.managerId, 1);
  assert.equal(event.feedbackId, Number(id));
  assert.equal(event.before.client_id, 1);
  assert.equal(event.after.client_id, 2);
});

test('migração de feedback antigo permite nota nula e preserva vínculos', (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cti-origin-'));
  const filename = path.join(directory, 'old.sqlite');
  const old = new DatabaseSync(filename);
  old.exec(`CREATE TABLE feedbacks(id INTEGER PRIMARY KEY, service TEXT NOT NULL, rating INTEGER NOT NULL,
    comment TEXT NOT NULL, demo_data INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
    sentiment TEXT, sentiment_status TEXT NOT NULL DEFAULT 'pending', handling_status TEXT NOT NULL DEFAULT 'new');
    CREATE TABLE managers(id INTEGER PRIMARY KEY, email TEXT, password_salt TEXT, password_hash TEXT, created_at TEXT);
    CREATE TABLE feedback_context(feedback_id INTEGER PRIMARY KEY REFERENCES feedbacks(id), client_id INTEGER,
      product_id INTEGER, kind TEXT, manager_id INTEGER, updated_at TEXT);
    INSERT INTO managers VALUES (1, 'gestor@demo.local', 'salt', 'hash', '2026-10-31');
    INSERT INTO feedbacks VALUES (1, 'internet', 4, 'Texto original', 0, '2026-10-31T10:00:00.000Z', NULL, 'pending', 'new');
    INSERT INTO feedback_context VALUES (1, NULL, NULL, 'feedback', 1, '2026-10-31');`);
  old.close();
  const db = openDatabase(filename);
  context.after(() => { db.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  assert.equal(db.prepare('SELECT comment, rating, received_at FROM feedback_overview WHERE id = 1').get().received_at, '2026-10-31T10:00:00.000Z');
  assert.equal(db.prepare('SELECT kind FROM feedback_overview WHERE id = 1').get().kind, 'feedback');
  db.prepare("INSERT INTO feedbacks(service, rating, comment, created_at) VALUES ('internet', NULL, 'Sem nota', '2026-10-31')").run();
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
});
