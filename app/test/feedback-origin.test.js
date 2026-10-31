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

test('formulário público registra autor sem expor clientes e aceita reclamação sem nota', async (context) => {
  const { db, base } = await setup(context);
  const page = await fetch(base + '/feedback').then((res) => res.text());
  assert.match(page, /name="reportedOrganization"/);
  assert.doesNotMatch(page, /api\/manager\/crm\/clients/);
  const response = await post(base, '/api/feedback', { ...payload, kind: 'complaint' });
  assert.equal(response.status, 201);
  const saved = db.prepare('SELECT * FROM feedback_overview').get();
  assert.equal(saved.rating, null);
  assert.equal(saved.kind, 'complaint');
  assert.equal(saved.source_channel, 'form');
  assert.equal(saved.reported_contact, 'Ana Exemplo');
  assert.equal(saved.client_id, null);
  assert.ok(saved.received_at);
  assert.equal((await post(base, '/api/feedback', { ...payload, kind: 'feedback' })).status, 400);
});

test('registro interno exige sessão, detecta protocolo por canal e preserva relato após falha da análise', async (context) => {
  const { db, base, cookie } = await setup(context, { classify: async () => { throw new Error('Indisponível'); } });
  const body = { ...payload, kind: 'suggestion', sourceChannel: 'email', sourceProtocol: 'CTI-123', demoData: true };
  assert.equal((await post(base, '/api/feedback/internal', body)).status, 401);
  const first = await post(base, '/api/feedback/internal', body, cookie);
  assert.equal(first.status, 201);
  assert.equal((await first.json()).sentimentStatus, 'failed');
  assert.equal(db.prepare('SELECT comment FROM feedbacks').get().comment, payload.comment);
  const duplicate = await post(base, '/api/feedback/internal', body, cookie);
  assert.equal(duplicate.status, 409);
  assert.equal((await duplicate.json()).duplicateId, 1);
  assert.equal((await post(base, '/api/feedback/internal', { ...body, allowDuplicate: true, demoData: false }, cookie)).status, 201);
  assert.equal((await post(base, '/api/feedback/internal', { ...body, sourceChannel: 'phone', demoData: false }, cookie)).status, 201);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM feedbacks').get().total, 3);
});

test('triagem associa e corrige organização, contato e serviço contratado sem alterar autor informado', async (context) => {
  const { db, base, cookie } = await setup(context);
  const now = new Date().toISOString();
  db.prepare("INSERT INTO clients(id, name, created_at) VALUES (1, 'Empresa cadastrada', ?)").run(now);
  db.prepare("INSERT INTO clients(id, name, created_at) VALUES (2, 'Outra empresa', ?)").run(now);
  db.prepare("INSERT INTO client_contacts(id, client_id, name, created_at, updated_at) VALUES (1, 1, 'Contato cadastrado', ?, ?)").run(now, now);
  db.prepare("INSERT INTO client_contacts(id, client_id, name, created_at, updated_at) VALUES (2, 2, 'Contato alheio', ?, ?)").run(now, now);
  db.prepare("INSERT INTO products(id, name, type, created_at) VALUES (1, 'Internet', 'service', ?)").run(now);
  db.prepare('INSERT INTO client_products VALUES (1, 1)').run();
  db.prepare("INSERT INTO service_instances(id, client_id, product_id, name, created_at, updated_at) VALUES (1, 1, 1, 'Unidade A', ?, ?)").run(now, now);
  const created = await post(base, '/api/feedback', { ...payload, kind: 'complaint' });
  const id = (await created.json()).id;
  const put = (body) => fetch(base + '/api/manager/crm/feedback/' + id, { method: 'PUT', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await put({ clientId: 1, contactId: 2, productId: 1, serviceInstanceId: 1, kind: 'complaint' })).status, 400);
  assert.equal((await put({ clientId: 1, contactId: 1, productId: 1, serviceInstanceId: 1, kind: 'complaint' })).status, 200);
  const detail = await fetch(base + '/api/manager/crm/feedback/' + id, { headers: { cookie } }).then((r) => r.json());
  assert.equal(detail.feedback.contact_name, 'Contato cadastrado');
  assert.equal(detail.feedback.service_instance_name, 'Unidade A');
  assert.equal(detail.feedback.reported_contact, 'Ana Exemplo');
  assert.equal((await put({ clientId: null, contactId: null, productId: null, serviceInstanceId: null, kind: 'complaint' })).status, 200);
  assert.equal(db.prepare('SELECT reported_contact FROM feedbacks WHERE id = ?').get(id).reported_contact, 'Ana Exemplo');
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
