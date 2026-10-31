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

test('fluxo CRM e qualidade preserva sugestão, exige evidência e verificação humana', async (context) => {
  const { request, db } = await setup(context);
  const client = await request('/api/manager/crm/clients', 'POST', { name: 'Cliente sintético', contact: 'Equipe de suporte', productIds: [1] });
  assert.equal(client.status, 201);
  assert.equal((await request('/api/manager/crm/feedback/1', 'PUT', { clientId: client.body.id, productId: 1, kind: 'complaint' })).status, 200);
  assert.equal((await request('/api/manager/crm/feedback/1/reviews', 'POST', { sentiment: 'neutral', note: 'Revisão do contexto' })).status, 201);
  assert.equal(db.prepare('SELECT sentiment FROM feedbacks WHERE id = 1').get().sentiment, 'negative');
  assert.equal((await request('/api/manager/summary')).body.sentimentCounts.neutral, 1);
  const history = await request('/api/manager/crm/clients/' + client.body.id);
  assert.equal(history.body.feedbacks.length, 1);
  const problem = await request('/api/manager/quality', 'POST', { title: 'Oscilação recorrente', category: 'Conectividade', analysis: 'Investigar o enlace', feedbackIds: [1] });
  assert.equal(problem.status, 201);
  const path = '/api/manager/quality/' + problem.body.id;
  assert.equal((await request(path + '/close', 'POST')).status, 409);
  const action = await request(path + '/actions', 'POST', { description: 'Revisar configuração', owner: 'Equipe técnica', dueDate: '2026-11-10' });
  assert.equal(action.status, 201);
  const actionPath = '/api/manager/quality/actions/' + action.body.id;
  assert.equal((await request(actionPath + '/verify', 'POST', { effective: true, note: 'Tentativa prematura' })).status, 409);
  assert.equal((await request(actionPath + '/complete', 'POST', { evidence: '' })).status, 400);
  assert.equal((await request(actionPath + '/complete', 'POST', { evidence: 'Registro de teste sintético' })).status, 200);
  assert.equal((await request(path + '/close', 'POST')).status, 409);
  assert.equal((await request(actionPath + '/verify', 'POST', { effective: true, note: 'Sem oscilação no período observado' })).status, 200);
  assert.equal((await request(path + '/close', 'POST')).status, 200);
  const detail = (await request(path)).body;
  assert.equal(detail.problem.status, 'closed');
  assert.ok(detail.events.length >= 5);
  assert.equal(detail.actions[0].verification_note, 'Sem oscilação no período observado');
  assert.equal((await request(path + '/actions', 'POST', { description: 'Nova', owner: 'Equipe', dueDate: '2026-11-11' })).status, 409);
});

test('rotas de gestão bloqueiam anônimos e validam referências e datas', async (context) => {
  const { request } = await setup(context);
  for (const path of ['/api/manager/crm/clients', '/api/manager/quality']) assert.equal((await request(path, 'GET', undefined, false)).status, 401);
  assert.equal((await request('/api/manager/crm/clients', 'POST', { name: ' ', productIds: [] })).status, 400);
  assert.equal((await request('/api/manager/crm/clients', 'POST', { name: 'Cliente', productIds: [999] })).status, 400);
  assert.equal((await request('/api/manager/crm/feedback/1', 'PUT', { clientId: 999, productId: 1, kind: 'complaint' })).status, 400);
  assert.equal((await request('/api/manager/crm/feedback/999/reviews', 'POST', { sentiment: 'positive' })).status, 404);
  assert.equal((await request('/api/manager/crm/feedback/1/reviews', 'POST', { sentiment: 'unknown' })).status, 400);
  assert.equal((await request('/api/manager/quality', 'POST', { title: 'Problema', category: 'Rede', analysis: 'Análise', feedbackIds: [999] })).status, 400);
  const problem = await request('/api/manager/quality', 'POST', { title: 'Problema', category: 'Rede', analysis: 'Análise', feedbackIds: [1] });
  assert.equal((await request('/api/manager/quality/' + problem.body.id + '/actions', 'POST', { description: 'Teste', owner: 'Equipe', dueDate: '2026-02-30' })).status, 400);
});

test('ação ineficaz impede encerramento e mantém evidências das tentativas no histórico', async (context) => {
  const { request } = await setup(context);
  const problem = await request('/api/manager/quality', 'POST', { title: 'Falha recorrente', category: 'Rede', analysis: 'Análise humana', feedbackIds: [1] });
  const path = '/api/manager/quality/' + problem.body.id;
  const action = await request(path + '/actions', 'POST', { description: 'Ajustar enlace', owner: 'Suporte', dueDate: '2026-11-10' });
  const actionPath = '/api/manager/quality/actions/' + action.body.id;
  await request(actionPath + '/complete', 'POST', { evidence: 'Primeira tentativa' });
  await request(actionPath + '/verify', 'POST', { effective: false, note: 'A oscilação persistiu' });
  assert.equal((await request(path + '/close', 'POST')).status, 409);
  await request(actionPath + '/complete', 'POST', { evidence: 'Segunda tentativa' });
  await request(actionPath + '/verify', 'POST', { effective: true, note: 'Estável no teste posterior' });
  assert.equal((await request(path + '/close', 'POST')).status, 200);
  const detail = (await request(path)).body;
  assert.ok(detail.events.some((e) => e.description.includes('Primeira tentativa')));
  assert.ok(detail.events.some((e) => e.description.includes('A oscilação persistiu')));
});

test('filtro e exportação usam revisão humana sem esconder a sugestão original', async (context) => {
  const { request, base, cookie } = await setup(context);
  await request('/api/manager/crm/feedback/1/reviews', 'POST', { sentiment: 'positive', note: 'Correção sintética' });
  const list = (await request('/api/manager/feedback?sentiment=positive')).body;
  assert.equal(list.total, 1);
  assert.equal(list.items[0].sentiment, 'negative');
  assert.equal(list.items[0].final_sentiment, 'positive');
  assert.equal((await request('/api/manager/feedback?sentiment=negative')).body.total, 0);
  assert.equal((await request('/api/manager/feedback?to=2026-99-99')).status, 200);
  const csv = await fetch(base + '/api/manager/export.csv?sentiment=positive', { headers: { cookie } }).then((response) => response.text());
  assert.match(csv, /Sugestão da IA/);
  assert.match(csv, /Revisão humana/);
  assert.match(csv, /"negative"/);
  assert.match(csv, /"positive"/);
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
  assert.equal((await request('/api/manager/crm/feedback/1', 'PUT', { clientId: created.body.id, productId: 1, kind: 'feedback' })).status, 200);
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
  assert.equal((await request('/api/manager/crm/feedback/1', 'PUT', { clientId: client.body.id, productId: 1, serviceInstanceId: first.body.id, kind: 'complaint' })).status, 200);
  assert.equal((await request('/api/manager/crm/feedback/1')).body.feedback.service_instance_name, 'Unidade A');
  assert.equal((await request('/api/manager/crm/feedback/1', 'PUT', { clientId: client.body.id, productId: null, serviceInstanceId: first.body.id, kind: 'complaint' })).status, 400);
  assert.equal((await request(path + '/services/' + first.body.id, 'PUT', { ...payload, name: 'Unidade A atualizada', active: false })).status, 200);
  assert.equal((await request('/api/manager/crm/feedback/1')).body.feedback.service_instance_name, 'Unidade A atualizada');
  const problem = await request('/api/manager/quality', 'POST', { title: 'Falha', category: 'Rede', analysis: 'Investigar', feedbackIds: [1] });
  assert.equal((await request('/api/manager/quality/' + problem.body.id)).body.problem.service_instance_id, first.body.id);
  assert.equal((await request('/api/manager/quality/' + problem.body.id + '/service', 'PUT', { serviceInstanceId: second.body.id })).status, 200);
  assert.equal((await request('/api/manager/quality/' + problem.body.id + '/service', 'PUT', { serviceInstanceId: 999 })).status, 400);
  assert.equal((await request('/api/manager/crm/feedback/1', 'PUT', { clientId: client.body.id, productId: 1, serviceInstanceId: null, kind: 'complaint' })).status, 200);
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
