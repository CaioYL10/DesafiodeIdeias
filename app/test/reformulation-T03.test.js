const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { openDatabase } = require('../src/db/database');
const { createApp } = require('../src/app');
const { createSession, SESSION_COOKIE } = require('../src/security/sessions');
const { createIngestionService } = require('../src/services/feedback-ingestion');
const { getDemoFeedbacks } = require('../src/services/demo-feedback-source');
const { startServer } = require('../test-support/server');

async function setup(context) {
  const database = openDatabase(':memory:');
  context.after(() => database.close());
  database.prepare("INSERT INTO managers VALUES (1, 'gestor@demo.local', 'salt', 'hash', '2026-11-05')").run();
  database.prepare("INSERT INTO feedbacks(service, rating, comment, created_at, sentiment, sentiment_status) VALUES ('internet', 2, '=1+1', '2026-10-01', 'negative', 'completed')").run();
  database.prepare("INSERT INTO sentiment_reviews(feedback_id, sentiment, note, manager_id, created_at) VALUES (1, 'neutral', 'Histórico preservado', 1, '2026-10-02')").run();
  const ingestion = createIngestionService(database);
  const fixture = getDemoFeedbacks();
  const imported = ingestion.ingestOne({ ...fixture[0], externalClassification: '=CLASSIFICACAO_ORIGEM' });
  let calls = 0;
  const base = await startServer(createApp({ database, sentimentService: { isConfigured: true, classify: async () => { calls++; throw new Error('Classificação local proibida'); } } }), context);
  const cookie = SESSION_COOKIE + '=' + createSession(database, 1).token;
  return { database, base, cookie, ingestion, fixture, imported, calls: () => calls };
}

test('T03: entradas antigas e equivalentes não executam nem alteram histórico ou origem', async (context) => {
  const { database, base, cookie, calls } = await setup(context);
  const snapshot = () => JSON.stringify(['feedbacks', 'sentiment_reviews', 'imported_feedbacks', 'clients'].map(table => database.prepare('SELECT * FROM ' + table + ' ORDER BY 1').all()));
  const before = snapshot();
  for (const endpoint of ['/api/feedback', '/api/feedback/internal', '/api/manager/feedback/1/reanalyze', '/api/manager/crm/feedback/1/reviews']) {
    for (const session of [null, cookie]) {
      const response = await fetch(base + endpoint, { method: 'POST', headers: { 'content-type': 'application/json', ...(session ? { cookie: session } : {}) }, body: JSON.stringify({ service: 'internet', rating: 2, comment: 'Texto fictício', demoData: true, sentiment: 'positive' }) });
      assert.equal(response.status, !session && endpoint.startsWith('/api/manager/') ? 401 : 404, endpoint);
    }
  }
  for (const endpoint of ['/api/manager/feedback', '/api/manager/crm/feedback', '/api/manager/feedback/1/classify', '/api/feedback/1/reanalyze']) {
    const response = await fetch(base + endpoint, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: '{"sentiment":"positive"}' });
    assert.equal(response.status, 404, endpoint);
  }
  assert.equal(snapshot(), before);
  assert.equal(calls(), 0);
});

test('T03: leituras exigem sessão; origem, cadastro manual e exportação segura permanecem', async (context) => {
  const { database, base, cookie, imported, ingestion, fixture, calls } = await setup(context);
  for (const endpoint of ['/api/manager/feedback', '/api/manager/summary', '/api/manager/export.csv', '/api/manager/crm/feedback/1', '/api/manager/crm/clients']) {
    assert.equal((await fetch(base + endpoint)).status, 401, endpoint);
  }
  const response = await fetch(base + '/api/manager/feedback?pageSize=1', { headers: { cookie } });
  const list = await response.json();
  assert.equal(response.status, 200);
  assert.equal(list.total, 2);
  assert.equal(list.items.length, 1);
  assert.equal(list.items[0].external_classification, '=CLASSIFICACAO_ORIGEM');
  assert.equal(list.items[0].sentiment, null);
  const detail = await fetch(base + '/api/manager/crm/feedback/' + imported.feedbackId, { headers: { cookie } }).then(r => r.json());
  assert.equal(detail.feedback.source_system, 'demo-external');
  assert.equal(detail.feedback.external_event_id, fixture[0].externalEventId);
  assert.equal(detail.feedback.external_classification, '=CLASSIFICACAO_ORIGEM');
  const csv = await fetch(base + '/api/manager/export.csv', { headers: { cookie } }).then(r => r.text());
  assert.match(csv, /Classificação externa \(origem\)/);
  assert.match(csv, /'=CLASSIFICACAO_ORIGEM/);
  assert.match(csv, /'=1\+1/);
  assert.doesNotMatch(csv, /Sugestão da IA|Status da análise|Revisão humana|Sentimento adotado|"negative"|"neutral"/);
  const summary = await fetch(base + '/api/manager/summary', { headers: { cookie } }).then(r => r.json());
  assert.equal(Object.hasOwn(summary, 'sentimentCounts'), false);
  for (const endpoint of ['/api/manager/feedback?sentiment=negative', '/api/manager/export.csv?sentiment=negative']) {
    assert.equal((await fetch(base + endpoint, { headers: { cookie } })).status, 400);
  }
  const manual = await fetch(base + '/api/manager/crm/clients', { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Cadastro manual fictício' }) });
  assert.equal(manual.status, 201);
  assert.equal(ingestion.ingestOne(fixture[0]).status, 'duplicate');
  assert.equal(database.prepare('SELECT COUNT(*) AS total FROM feedbacks').get().total, 2);
  assert.equal(database.prepare('SELECT sentiment FROM feedbacks WHERE id = 1').get().sentiment, 'negative');
  assert.equal(calls(), 0);
});

for (const script of ['src/server.js', 'scripts/start-demo.js']) {
  test('T03: inicializa ' + script + ' com banco em memória e porta efêmera', { timeout: 10000 }, async (context) => {
    const child = spawn(process.execPath, [path.join(__dirname, '..', script)], { env: { ...process.env, DB_PATH: ':memory:', PORT: '0' }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    context.after(async () => {
      if (child.exitCode === null && child.signalCode === null) {
        const stopped = once(child, 'exit');
        child.kill();
        await stopped;
      }
    });
    let output = '';
    const base = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', code => reject(new Error('Servidor encerrou antes de iniciar: ' + code + ' ' + output)));
      child.stderr.on('data', data => { output += data; });
      child.stdout.on('data', data => {
        output += data;
        const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
        if (match) resolve(match[0]);
      });
    });
    assert.equal((await fetch(base + '/api/manager/feedback')).status, 401);
    assert.equal((await fetch(base + '/api/feedback', { method: 'POST' })).status, 404);
    if (script.includes('demo')) {
      const login = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'gestor@demo.local', password: 'demonstracao-cti-2026' }) });
      assert.equal(login.status, 200);
      const cookie = login.headers.get('set-cookie').split(';')[0];
      const list = await fetch(base + '/api/manager/feedback', { headers: { cookie } }).then(r => r.json());
      assert.equal(list.total, 5);
      assert.ok(list.items.every(item => item.source_system === 'demo-external'));
    }
  });
}
