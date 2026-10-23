const test = require('node:test');
const assert = require('node:assert/strict');
const { openDatabase } = require('../src/db/database');
const { createApp } = require('../src/app');
const { startServer } = require('../test-support/server');

test('salva feedback mesmo quando a análise de sentimento falha', async (context) => {
  const database = openDatabase(':memory:');
  context.after(() => database.close());
  const app = createApp({ database, sentimentService: { classify: async () => { throw new Error('provedor indisponível'); } } });
  const baseUrl = await startServer(app, context);
  const response = await fetch(baseUrl + '/api/feedback', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ service: 'internet', rating: 2, comment: 'A conexão caiu várias vezes durante o expediente.', demoData: true })
  });
  assert.equal(response.status, 201);
  const saved = database.prepare('SELECT * FROM feedbacks').get();
  assert.equal(saved.comment, 'A conexão caiu várias vezes durante o expediente.');
  assert.equal(saved.sentiment, null);
  assert.equal(saved.sentiment_status, 'failed');
  assert.equal(saved.handling_status, 'new');
});

test('rejeita feedback sem comentário, serviço inválido ou nota fora do intervalo', async (context) => {
  const database = openDatabase(':memory:');
  context.after(() => database.close());
  const baseUrl = await startServer(createApp({ database }), context);
  for (const body of [
    { service: 'internet', rating: 5, comment: '  ' },
    { service: 'inventado', rating: 5, comment: 'comentário' },
    { service: 'internet', rating: 6, comment: 'comentário' }
  ]) {
    const response = await fetch(baseUrl + '/api/feedback', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
    });
    assert.equal(response.status, 400);
  }
  assert.equal(database.prepare('SELECT COUNT(*) AS count FROM feedbacks').get().count, 0);
});

test('não encaminha comentários sem confirmação de demonstração à IA', async (context) => {
  const database = openDatabase(':memory:');
  context.after(() => database.close());
  let calls = 0;
  const baseUrl = await startServer(createApp({ database, sentimentService: { classify: async () => { calls += 1; return { sentiment: 'neutral' }; } } }), context);
  const response = await fetch(baseUrl + '/api/feedback', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ service: 'suporte', rating: 3, comment: 'Texto sem confirmação.' })
  });
  assert.equal(response.status, 201);
  assert.equal(calls, 0);
  assert.equal(database.prepare('SELECT demo_data FROM feedbacks').get().demo_data, 0);
});

test('classifica apenas comentário explicitamente marcado como demonstrativo', async (context) => {
  const database = openDatabase(':memory:');
  context.after(() => database.close());
  let received;
  const baseUrl = await startServer(createApp({ database, sentimentService: { classify: async (comment) => { received = comment; return { sentiment: 'positive' }; } } }), context);
  const response = await fetch(baseUrl + '/api/feedback', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ service: 'cloud', rating: 5, comment: '  Comentário fictício.  ', demoData: true })
  });
  assert.equal(response.status, 201);
  assert.equal(received, 'Comentário fictício.');
  assert.equal(database.prepare('SELECT sentiment, sentiment_status FROM feedbacks').get().sentiment, 'positive');
});

test('deixa a análise pendente quando o provedor não tem chave configurada', async (context) => {
  const database = openDatabase(':memory:');
  context.after(() => database.close());
  const { createSentimentService } = require('../src/services/sentiment');
  const baseUrl = await startServer(createApp({ database, sentimentService: createSentimentService({ apiKey: '' }) }), context);
  const response = await fetch(baseUrl + '/api/feedback', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ service: 'internet', rating: 4, comment: 'Comentário fictício para testar chave ausente.', demoData: true })
  });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).sentimentStatus, 'pending');
  const saved = database.prepare('SELECT sentiment_status FROM feedbacks').get();
  assert.equal(saved.sentiment_status, 'pending');
});
