const test = require('node:test');
const assert = require('node:assert/strict');
const { openDatabase } = require('../src/db/database');
const { createApp } = require('../src/app');
const { hashPassword } = require('../src/security/passwords');
const { startServer } = require('../test-support/server');

async function setup(context) {
  const db = openDatabase(':memory:');
  context.after(() => db.close());
  const password = await hashPassword('senha-demonstracao-segura');
  db.prepare('INSERT INTO managers VALUES (1, ?, ?, ?, ?)').run('teste@demo.local', password.salt, password.hash, new Date().toISOString());
  db.prepare("INSERT INTO products VALUES (1, 'Internet dedicada', '', 'service', ?)").run(new Date().toISOString());
  db.prepare("INSERT INTO feedbacks (id, service, rating, comment, created_at, sentiment) VALUES (1, 'internet', 2, 'Relato fictício de oscilação', ?, 'negative')").run(new Date().toISOString());
  const base = await startServer(createApp({ database: db }), context);
  const login = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'teste@demo.local', password: 'senha-demonstracao-segura' }) });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  async function request(path, method = 'GET', body, authenticated = true) {
    const response = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(authenticated ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  }
  return { db, request, base, cookie };
}

test('rotas de gestão bloqueiam anônimos e validam referências e datas', async (context) => {
  const { request } = await setup(context);
  for (const path of ['/api/manager/crm/clients', '/api/manager/quality']) assert.equal((await request(path, 'GET', undefined, false)).status, 401);
  assert.equal((await request('/api/manager/crm/clients', 'POST', { name: ' ', productIds: [] })).status, 400);
  assert.equal((await request('/api/manager/crm/clients', 'POST', { name: 'Cliente', productIds: [999] })).status, 400);
  assert.equal((await request('/api/manager/crm/feedback/1', 'PUT', { clientId: 999, productId: 1, justification: 'Vinculação humana verificada' })).status, 400);
  assert.equal((await request('/api/manager/crm/feedback/999/reviews', 'POST', { sentiment: 'positive' })).status, 404);
  assert.equal((await request('/api/manager/crm/feedback/1/reviews', 'POST', { sentiment: 'unknown' })).status, 404);
  assert.equal((await request('/api/manager/quality', 'POST', { title: 'Problema', category: 'Rede', analysis: 'Análise', feedbackIds: [999] })).status, 400);
  assert.equal((await request('/api/manager/quality', 'POST', { title: 'Problema', category: 'Rede', analysis: 'Análise', feedbackIds: [1] })).status, 400);
});

test('consulta preserva histórico e exportação não adota sentimento local', async (context) => {
  const { request, base, cookie, db } = await setup(context);
  db.prepare("INSERT INTO sentiment_reviews(feedback_id, sentiment, note, manager_id, created_at) VALUES (1, 'positive', 'Revisão histórica', 1, '2026-10-31')").run();
  assert.equal((await request('/api/manager/crm/feedback/1/reviews', 'POST', { sentiment: 'neutral' })).status, 404);
  const detail = (await request('/api/manager/crm/feedback/1')).body;
  assert.equal(detail.feedback.sentiment, 'negative');
  assert.equal(detail.reviews[0].sentiment, 'positive');
  assert.equal((await request('/api/manager/feedback?sentiment=positive')).status, 400);
  assert.equal((await request('/api/manager/feedback')).body.total, 1);
  const csv = await fetch(base + '/api/manager/export.csv', { headers: { cookie } }).then(r => r.text());
  assert.match(csv, /Classificação externa/);
  assert.doesNotMatch(csv, /Sugestão da IA|Revisão humana|Sentimento adotado|"negative"|"positive"/);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM sentiment_reviews').get().total, 1);
});

test('banco existente mantém feedback legado ao reabrir', async (context) => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cti-db-test-'));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const filename = path.join(directory, 'database.sqlite');
  let db = openDatabase(filename);
  db.prepare("INSERT INTO feedbacks(service, rating, comment, created_at) VALUES ('cloud', 4, 'Relato legado', ?)").run(new Date().toISOString());
  db.close();
  db = openDatabase(filename);
  assert.equal(db.prepare('SELECT comment FROM feedback_overview').get().comment, 'Relato legado');
  db.close();
});

test('CRM preserva contatos e interações vinculados', async (context) => {
  const { request } = await setup(context);
  const created = await request('/api/manager/crm/clients', 'POST', { name: 'Empresa A', contact: 'Contato antigo', accountOwner: 'Caio', productIds: [1] });
  const path = '/api/manager/crm/clients/' + created.body.id;
  const first = await request(path + '/contacts', 'POST', { name: 'Ana', email: 'ana@empresa.test' });
  const second = await request(path + '/contacts', 'POST', { name: 'Beto' });
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.equal((await request(path + '/contacts/' + first.body.id, 'PUT', { name: 'Ana Silva' })).status, 200);
  const interaction = await request(path + '/interactions', 'POST', { type: 'Reunião', occurredAt: '2026-10-31T12:00:00', summary: 'Alinhamento', contactId: first.body.id });
  assert.equal(interaction.status, 201);
  assert.equal((await request(path + '/interactions/' + interaction.body.id, 'PUT', { type: 'Ligação', occurredAt: '2026-10-31T13:00:00', summary: 'Retorno', contactId: second.body.id })).status, 200);
  assert.equal((await request(path, 'PUT', { name: 'Empresa A atualizada', accountOwner: 'Enzo' })).status, 200);
  assert.equal((await request('/api/manager/crm/feedback/1', 'PUT', { clientId: created.body.id, productId: 1, justification: 'Vinculação humana verificada' })).status, 200);
  const detail = (await request(path)).body;
  assert.equal(detail.client.account_owner, 'Enzo');
  assert.equal(detail.contacts.length, 3);
  assert.ok(detail.contacts.some((item) => item.legacy && item.name === 'Contato antigo'));
  assert.equal(detail.interactions[0].contact_name, 'Beto');
  assert.equal(detail.feedbacks.length, 1);
  assert.equal((await request(path + '/interactions', 'POST', { type: 'Teste', occurredAt: '2026-10-31', summary: 'Inválido', contactId: 999 })).status, 400);
});

test('migração de banco antigo preserva contato livre sem duplicar', (context) => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const { DatabaseSync } = require('node:sqlite');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cti-crm-old-'));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const filename = path.join(directory, 'old.sqlite');
  const old = new DatabaseSync(filename);
  old.exec("CREATE TABLE clients(id INTEGER PRIMARY KEY, name TEXT NOT NULL, contact TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL)");
  old.prepare('INSERT INTO clients(name, contact, created_at) VALUES (?, ?, ?)').run('Empresa antiga', 'Equipe antiga', '2026-10-01T00:00:00.000Z');
  old.close();
  let db = openDatabase(filename);
  assert.equal(db.prepare('SELECT name FROM client_contacts').get().name, 'Equipe antiga');
  assert.equal(db.prepare('SELECT account_owner FROM clients').get().account_owner, '');
  db.close();
  db = openDatabase(filename);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM client_contacts').get().total, 1);
  db.close();
});

test('servicos contratados aceitam multiplas instancias e preservam contexto', async (context) => {
  const { request, db } = await setup(context);
  const client = await request('/api/manager/crm/clients', 'POST', { name: 'Empresa teste', productIds: [1] });
  const path = '/api/manager/crm/clients/' + client.body.id;
  let detail = (await request(path)).body;
  assert.equal(detail.serviceInstances.length, 1);
  assert.equal(detail.serviceInstances[0].legacy, 1);
  const payload = { productId: 1, name: 'Unidade A', location: 'Santo Andre', externalId: 'LINK-1', description: 'Acesso principal', active: true };
  const first = await request(path + '/services', 'POST', payload);
  const second = await request(path + '/services', 'POST', { ...payload, name: 'Unidade B', externalId: 'LINK-2' });
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.equal((await request(path + '/services')).body.items.length, 3);
  assert.equal((await request('/api/manager/crm/feedback/1', 'PUT', { clientId: client.body.id, productId: 1, serviceInstanceId: first.body.id, justification: 'Vinculação humana verificada' })).status, 200);
  assert.equal((await request('/api/manager/crm/feedback/1')).body.feedback.service_instance_name, 'Unidade A');
  assert.equal((await request('/api/manager/crm/feedback/1', 'PUT', { clientId: client.body.id, productId: null, serviceInstanceId: first.body.id, justification: 'Vinculação humana verificada' })).status, 400);
  assert.equal((await request(path + '/services/' + first.body.id, 'PUT', { ...payload, name: 'Unidade A atualizada', active: false })).status, 200);
  assert.equal((await request('/api/manager/crm/feedback/1')).body.feedback.service_instance_name, 'Unidade A atualizada');
  assert.equal((await request('/api/manager/quality', 'POST', { title: 'Falha', category: 'Rede', analysis: 'Investigar', feedbackIds: [1] })).status, 400);
  assert.equal((await request('/api/manager/crm/feedback/1', 'PUT', { clientId: client.body.id, productId: 1, serviceInstanceId: null, justification: 'Vinculação humana verificada' })).status, 200);
  assert.equal((await request('/api/manager/crm/feedback/1')).body.feedback.service_instance_id, null);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM feedbacks').get().count, 1);
});

test('migracao associa vinculos antigos sem recriar instancia na reabertura', (context) => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const { DatabaseSync } = require('node:sqlite');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cti-services-'));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const filename = path.join(directory, 'database.sqlite');
  const old = new DatabaseSync(filename);
  old.exec(fs.readFileSync(path.join(__dirname, '../src/db/schema.sql'), 'utf8'));
  old.prepare("INSERT INTO managers VALUES (1, 'm@demo.test', 'salt', 'hash', '2026-10-31')").run();
  old.prepare("INSERT INTO products VALUES (1, 'Internet dedicada', '', 'service', '2026-10-31')").run();
  old.prepare("INSERT INTO clients VALUES (1, 'Empresa', '', '2026-10-31', '')").run();
  old.prepare('INSERT INTO client_products VALUES (1, 1)').run();
  old.prepare("INSERT INTO feedbacks(service, rating, comment, created_at) VALUES ('internet', 4, 'Teste', '2026-10-31')").run();
  old.prepare("INSERT INTO feedback_context(feedback_id, client_id, product_id, kind, manager_id, updated_at) VALUES (1, 1, 1, 'feedback', 1, '2026-10-31')").run();
  old.close();
  let db = openDatabase(filename);
  assert.equal(db.prepare('SELECT service_instance_name FROM feedback_overview').get().service_instance_name, 'Internet dedicada');
  db.prepare('UPDATE feedback_context SET service_instance_id = NULL WHERE feedback_id = 1').run();
  db.close();
  db = openDatabase(filename);
  assert.equal(db.prepare('SELECT service_instance_id FROM feedback_overview').get().service_instance_id, null);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM service_instances').get().count, 1);
  db.close();
});

test('migração preserva problema e ação anteriores à análise estruturada', (context) => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const { DatabaseSync } = require('node:sqlite');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cti-quality-old-'));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const filename = path.join(directory, 'old.sqlite');
  const old = new DatabaseSync(filename);
  old.exec(`CREATE TABLE quality_problems(id INTEGER PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL,
    analysis TEXT NOT NULL, status TEXT NOT NULL, manager_id INTEGER NOT NULL, created_at TEXT NOT NULL,
    closed_at TEXT, service_instance_id INTEGER);
    CREATE TABLE quality_actions(id INTEGER PRIMARY KEY, problem_id INTEGER NOT NULL, description TEXT NOT NULL,
    owner TEXT NOT NULL, due_date TEXT NOT NULL, status TEXT NOT NULL, evidence TEXT, completed_at TEXT,
    verification_note TEXT, verified_at TEXT, created_at TEXT NOT NULL);
    INSERT INTO quality_problems VALUES (1, 'Caso legado', 'Rede', 'Análise antiga', 'in_progress', 1, '2026-10-01', NULL, NULL);
    INSERT INTO quality_actions VALUES (1, 1, 'Revisar enlace', 'Equipe', '2026-11-01', 'ineffective',
      'Evidência antiga', '2026-10-02', 'Falha persistiu', '2026-10-03', '2026-10-01');`);
  old.close();
  let db = openDatabase(filename);
  assert.equal(db.prepare('SELECT impact FROM quality_problems').get().impact, 'medium');
  assert.equal(db.prepare('SELECT cause FROM quality_problems').get().cause, '');
  assert.equal(db.prepare('SELECT evidence, effective FROM quality_action_attempts').get().evidence, 'Evidência antiga');
  db.close();
  db = openDatabase(filename);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM quality_action_attempts').get().total, 1);
  db.close();
});
