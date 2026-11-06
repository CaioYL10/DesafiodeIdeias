const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { openDatabase } = require('../src/db/database');
const { createApp } = require('../src/app');
const { createSession, SESSION_COOKIE } = require('../src/security/sessions');
const { createIngestionService } = require('../src/services/feedback-ingestion');
const { getDemoFeedbacks } = require('../src/services/demo-feedback-source');
const { startServer } = require('../test-support/server');

async function setup(context) {
  const db = openDatabase(':memory:');
  context.after(() => db.close());
  db.prepare("INSERT INTO managers VALUES (1, 'gestor@demo.local', 'salt', 'hash', '2026-11-05')").run();
  const ingestion = createIngestionService(db);
  const fixture = getDemoFeedbacks();
  const imported = ingestion.ingestBatch(fixture);
  const base = await startServer(createApp({ database: db }), context);
  const cookie = SESSION_COOKIE + '=' + createSession(db, 1).token;
  async function request(url, method = 'GET', body, authenticated = true) {
    const response = await fetch(base + '/api/manager/' + url, { method,
      headers: { 'content-type': 'application/json', ...(authenticated ? { cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: await response.json(), headers: response.headers };
  }
  return { db, ingestion, fixture, imported, request, base, cookie };
}

test('T04: leitura autenticada, paginação determinística, filtros e busca literal', async context => {
  const { request } = await setup(context);
  for (const url of ['feedback', 'crm/clients', 'crm/clients/1', 'crm/feedback/1', 'crm/identity-pending']) {
    assert.equal((await request(url, 'GET', undefined, false)).status, 401);
  }
  const first = await request('feedback?pageSize=2&page=1');
  const second = await request('feedback?pageSize=2&page=2');
  assert.equal(first.body.total, 5);
  assert.equal(first.body.items.length, 2);
  assert.ok(second.body.items.every(item => !first.body.items.some(other => item.id === other.id)));
  assert.equal(first.headers.get('cache-control'), 'no-store');
  const pending = await request('feedback?identity=pending&dimension=relationship&source=demo-external');
  assert.equal(pending.body.total, 1);
  assert.equal((await request('feedback?search=evt-1002')).body.total, 1);
  assert.equal((await request('feedback?search=%25')).body.total, 0);
  assert.equal((await request('feedback?search=%27%20OR%201%3D1--')).body.total, 0);
  for (const query of ['page=-1', 'page=2x', 'pageSize=101', 'dimension=invalid', 'identity=invalid', 'service=invalid', 'from=2026-02-30', 'from=2026-11-02&to=2026-11-01']) {
    assert.equal((await request('feedback?' + query)).status, 400, query);
  }
  const clients = await request('crm/clients?pageSize=1&origin=imported');
  assert.equal(clients.body.items.length, 1);
  assert.ok(clients.body.items[0].feedback_count > 0);
  assert.equal((await request('crm/clients?search=%25')).body.total, 0);
  assert.equal((await request('crm/clients?pageSize=101')).status, 400);
  const summary = (await request('summary')).body;
  assert.match(summary.definitions.averageRating, /Soma das notas/);
  assert.ok(summary.definitions.from < summary.definitions.toExclusive);
});

test('T04: decisão de identidade usa sessão, justificativa e vínculo imutável com reprocessamento', async context => {
  const { request, db, ingestion, fixture } = await setup(context);
  const pending = (await request('crm/identity-pending')).body.items[0];
  const endpoint = 'crm/identity-pending/' + pending.id + '/review';
  const decision = { action: 'link', clientId: 1, justification: 'Identificação conferida na demonstração.' };
  assert.equal((await request(endpoint, 'POST', decision, false)).status, 401);
  assert.equal((await request(endpoint, 'POST', { ...decision, managerId: 99 })).status, 400);
  assert.equal((await request(endpoint, 'POST', { ...decision, justification: ' ' })).status, 400);
  assert.equal((await request(endpoint, 'POST', { ...decision, clientId: 999 })).status, 400);
  assert.equal((await request(endpoint, 'POST', decision)).status, 200);
  assert.equal((await request(endpoint, 'POST', decision)).status, 409);
  const identity = db.prepare('SELECT * FROM identity_pending WHERE id = ?').get(pending.id);
  assert.equal(identity.reviewed_by, 1);
  assert.equal(identity.justification, decision.justification);
  assert.ok(identity.reviewed_at);
  const before = JSON.stringify(db.prepare('SELECT * FROM imported_feedbacks WHERE feedback_id = ?').get(pending.feedback_id));
  ingestion.ingestBatch(fixture);
  assert.equal(JSON.stringify(db.prepare('SELECT * FROM imported_feedbacks WHERE feedback_id = ?').get(pending.feedback_id)), before);
  assert.equal((await request('crm/identity-pending')).body.items.length, 0);
  const detail = (await request('crm/clients/1')).body;
  assert.ok(detail.origins.some(item => item.source_system === 'demo-external'));
  assert.ok(detail.feedbacks.some(item => item.id === pending.feedback_id));
  assert.equal(detail.identityReviews[0].reviewed_by, 1);
});

for (const action of ['create', 'reject']) {
  test('T04: revisão explícita de identidade permite ' + action, async context => {
    const { request } = await setup(context);
    const item = (await request('crm/identity-pending')).body.items[0];
    const review = await request('crm/identity-pending/' + item.id + '/review', 'POST', { action, justification: 'Decisão humana fictícia.' });
    assert.equal(review.status, 200);
    const detail = (await request('crm/feedback/' + item.feedback_id)).body;
    assert.equal(detail.identity.status, action === 'create' ? 'created' : 'rejected');
    assert.equal(!!detail.feedback.client_id, action === 'create');
  });
}

test('T04: nenhuma escrita contextual muda conteúdo, tipo, origem ou vínculo importado', async context => {
  const { db, request } = await setup(context);
  const before = JSON.stringify(db.prepare('SELECT * FROM feedback_overview ORDER BY id').all());
  for (const body of [{ comment: 'Outro' }, { kind: 'feedback' }, { sourceSystem: 'outro' }, { clientId: 2 }]) {
    const result = await request('crm/feedback/1', 'PUT', { justification: 'Tentativa negada.', ...body });
    assert.ok([400, 409].includes(result.status));
  }
  assert.equal(JSON.stringify(db.prepare('SELECT * FROM feedback_overview ORDER BY id').all()), before);
  assert.equal((await request('crm/feedback/999')).status, 404);
});

test('T04: cadastro excepcional e edição interna auditáveis, proteção da trilha e rollback', async context => {
  const { db, request } = await setup(context);
  const created = await request('crm/clients', 'POST', { name: 'Cliente excepcional', accountOwner: 'Gestor' });
  assert.equal(created.status, 201);
  const url = 'crm/clients/' + created.body.id;
  assert.equal((await request(url, 'PUT', { name: 'Cliente corrigido', accountOwner: 'Revisor' })).status, 200);
  const contact = await request(url + '/contacts', 'POST', { name: 'Contato fictício', email: 'contato@example.test' });
  assert.equal(contact.status, 201);
  const detail = (await request(url)).body;
  assert.equal(detail.auditEvents.length, 3);
  const event = JSON.parse(detail.auditEvents.find(item => JSON.parse(item.summary).action === 'PUT /clients/:id').summary);
  assert.equal(event.managerId, 1);
  assert.equal(event.before.client.name, 'Cliente excepcional');
  assert.equal(event.after.client.name, 'Cliente corrigido');
  assert.ok(detail.auditEvents.every(item => !item.summary.includes('contato@example.test')));
  assert.equal((await request(url + '/interactions', 'POST', { type: ' audit_crm ', occurredAt: '2026-11-05', summary: 'Falso' })).status, 400);
  assert.equal((await request(url + '/interactions/' + detail.auditEvents[0].id, 'PUT', { type: 'Ligação', occurredAt: '2026-11-05', summary: 'Adulteração' })).status, 409);
  db.exec("CREATE TRIGGER fail_audit BEFORE INSERT ON client_interactions WHEN NEW.type = 'audit_crm' BEGIN SELECT RAISE(ABORT, 'falha simulada'); END");
  assert.equal((await request(url, 'PUT', { name: 'Não deve persistir' })).status, 500);
  assert.equal(db.prepare('SELECT name FROM clients WHERE id = ?').get(created.body.id).name, 'Cliente corrigido');
});

test('T04: vínculo contextual legado requer ação humana e registra feedback, antes e depois', async context => {
  const { request, db } = await setup(context);
  const id = Number(db.prepare("INSERT INTO feedbacks(service, comment, created_at) VALUES ('cloud', 'Registro histórico preservado', '2026-10-01')").run().lastInsertRowid);
  const url = 'crm/feedback/' + id;
  assert.equal((await request(url, 'PUT', { clientId: 1 })).status, 400);
  assert.equal((await request(url, 'PUT', { clientId: 1, justification: 'Conferência humana do histórico.' }, false)).status, 401);
  assert.equal((await request(url, 'PUT', { clientId: 1, justification: 'Conferência humana do histórico.' })).status, 200);
  const event = JSON.parse((await request('crm/clients/1')).body.auditEvents[0].summary);
  assert.equal(event.feedbackId, id);
  assert.equal(event.managerId, 1);
  assert.equal(event.before, null);
  assert.equal(event.after.client_id, 1);
  assert.equal((await request(url, 'PUT', { clientId: 1, justification: 'Tentativa', kind: 'complaint' })).status, 400);
});

test('T04: interface executada escapa conteúdo externo e conserva navegação de consulta', async () => {
  const content = { innerHTML: '', setAttribute() {}, querySelectorAll: () => [], querySelector: () => ({ focus() {} }) };
  const message = {};
  const feedback = { id: 1, comment: '<img src=x onerror=alert(1)>', source_system: '<externo>', external_event_id: 'evento', external_classification: '<script>alert(1)</script>', client_id: 1, client_name: '<Cliente>', kind: 'complaint' };
  const sandbox = { document: { querySelector: selector => selector === '#workspace-content' ? content : message, querySelectorAll: () => [], getElementById: () => null },
    location: { hash: '#triage/1' }, window: { addEventListener() {} }, URLSearchParams, FormData: class {},
    fetch: async () => ({ ok: true, status: 200, json: async () => ({ feedback, identity: null, occurrences: [{ id: 4, title: '<Ocorrência>', status: 'open' }] }) }) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/workspace.js'), 'utf8'), sandbox);
  await new Promise(resolve => setImmediate(resolve));
  assert.match(content.innerHTML, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(content.innerHTML, /&lt;script&gt;/);
  assert.doesNotMatch(content.innerHTML, /<script>|<img/);
  assert.match(content.innerHTML, /href="#clients\/1"/);
  assert.match(content.innerHTML, /href="#quality\/4"/);
  for (const filename of ['workspace.js', 'app.js', 'navigation.js', 'index.html', 'manager-feedbacks.html', 'dashboard.html']) {
    const source = fs.readFileSync(path.join(__dirname, '../public', filename), 'utf8');
    assert.doesNotMatch(source, /\/api\/feedback|\/reanalyze|review-sentiment|internal-feedback-form|href="\/feedback"|name="sentiment"|SENTIMENTO/);
  }
  assert.equal(fs.existsSync(path.join(__dirname, '../public/feedback.html')), false);
});

test('T04: estados de carregamento, vazio, erro e falta de permissão são anunciados', async () => {
  for (const state of ['empty', 'error', 'forbidden']) {
    let complete;
    const gate = new Promise(resolve => { complete = resolve; });
    const attributes = {};
    const content = { innerHTML: '', setAttribute: (key, value) => { attributes[key] = value; }, querySelectorAll: () => [], querySelector: () => ({ focus() {} }) };
    const message = {};
    const sandbox = { document: { querySelector: selector => selector === '#workspace-content' ? content : selector === '#retry' ? { addEventListener() {} } : message,
      querySelectorAll: () => [], getElementById: () => null }, location: { hash: '#triage' }, window: { addEventListener() {} }, URLSearchParams,
      fetch: async () => { await gate; if (state === 'error') throw new Error('Falha de rede local.'); return { ok: state !== 'forbidden', status: state === 'forbidden' ? 403 : 200,
        json: async () => state === 'forbidden' ? { error: 'Acesso negado.' } : { items: [], total: 0, page: 1, pageSize: 20 } }; } };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/workspace.js'), 'utf8'), sandbox);
    assert.match(content.innerHTML, /Carregando/);
    assert.equal(attributes['aria-busy'], 'true');
    complete();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(attributes['aria-busy'], 'false');
    if (state === 'empty') assert.match(content.innerHTML, /Nenhum feedback encontrado/);
    else {
      assert.match(content.innerHTML, /Tentar novamente/);
      assert.match(message.textContent, state === 'forbidden' ? /Sem permissão/ : /Falha de rede local/);
    }
  }
});
