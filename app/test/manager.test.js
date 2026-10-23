const test = require('node:test');
const assert = require('node:assert/strict');
const { openDatabase } = require('../src/db/database');
const { createApp } = require('../src/app');
const { hashPassword } = require('../src/security/passwords');
const { startServer } = require('../test-support/server');

async function setup(context) {
  const database = openDatabase(':memory:');
  context.after(() => database.close());
  const credentials = await hashPassword('senha-demonstracao-segura');
  database.prepare('INSERT INTO managers (email, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?)')
    .run('gestor@demo.local', credentials.salt, credentials.hash, new Date().toISOString());
  database.prepare(`INSERT INTO feedbacks (service, rating, comment, created_at, sentiment, sentiment_status, handling_status)
    VALUES (?, ?, ?, ?, ?, 'completed', 'new')`).run('internet', 2, '=1+1', '2026-10-20T12:00:00.000Z', 'negative');
  database.prepare(`INSERT INTO feedbacks (service, rating, comment, created_at, sentiment, sentiment_status, handling_status)
    VALUES (?, ?, ?, ?, ?, 'completed', 'resolved')`).run('cloud', 5, 'Serviço excelente', '2026-10-21T12:00:00.000Z', 'positive');
  const baseUrl = await startServer(createApp({ database }), context);
  const login = await fetch(baseUrl + '/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'gestor@demo.local', password: 'senha-demonstracao-segura' })
  });
  return { database, baseUrl, cookie: login.headers.get('set-cookie').split(';')[0] };
}

test('gestor filtra feedbacks, acompanha métricas e atualiza status', async (context) => {
  const { baseUrl, cookie } = await setup(context);
  const headers = { cookie };
  const summary = await fetch(baseUrl + '/api/manager/summary', { headers }).then((r) => r.json());
  assert.equal(summary.total, 2);
  assert.equal(summary.averageRating, 3.5);
  assert.equal(summary.sentimentCounts.positive, 1);
  const list = await fetch(baseUrl + '/api/manager/feedback?service=internet', { headers }).then((r) => r.json());
  assert.equal(list.total, 1);
  assert.equal(list.items[0].service, 'internet');
  const update = await fetch(baseUrl + '/api/manager/feedback/1/status', {
    method: 'PATCH', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ status: 'in_review' })
  });
  assert.equal(update.status, 200);
});

test('CSV respeita filtro e neutraliza texto que possa virar fórmula', async (context) => {
  const { baseUrl, cookie } = await setup(context);
  const response = await fetch(baseUrl + '/api/manager/export.csv?service=internet', { headers: { cookie } });
  const csv = await response.text();
  assert.equal(response.status, 200);
  assert.match(csv, /'=1\+1/);
  assert.doesNotMatch(csv, /Serviço excelente/);
  assert.match(response.headers.get('content-disposition'), /attachment/);
});

test('busca textual filtra comentário sem interpolar SQL', async (context) => {
  const { baseUrl, cookie } = await setup(context);
  const response = await fetch(baseUrl + '/api/manager/feedback?search=excelente', { headers: { cookie } });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.total, 1);
  assert.equal(result.items[0].service, 'cloud');
});

test('bloqueia reanálise por IA de feedback que não foi marcado como demonstração', async (context) => {
  const { database, baseUrl, cookie } = await setup(context);
  database.prepare(`INSERT INTO feedbacks (service, rating, comment, created_at, sentiment_status, handling_status)
    VALUES ('suporte', 3, 'Texto sem demonstração', ?, 'pending', 'new')`).run(new Date().toISOString());
  const response = await fetch(baseUrl + '/api/manager/feedback/3/reanalyze', {
    method: 'POST', headers: { cookie }
  });
  assert.equal(response.status, 403);
});


test('aplica filtros de período inclusivos à lista de feedbacks', async (context) => {
  const { baseUrl, cookie } = await setup(context);
  const response = await fetch(baseUrl + '/api/manager/feedback?from=2026-10-21&to=2026-10-21', { headers: { cookie } });
  const result = await response.json();
  assert.equal(result.total, 1);
  assert.equal(result.items[0].service, 'cloud');
});
