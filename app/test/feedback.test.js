const test = require('node:test');
const assert = require('node:assert/strict');
const { openDatabase } = require('../src/db/database');
const { createApp } = require('../src/app');
const { startServer } = require('../test-support/server');

for (const [name, body] of [
  ['válido demonstrativo', { service: 'internet', rating: 2, comment: 'Relato fictício', demoData: true }],
  ['inválido', { service: 'inventado', rating: 6, comment: '' }],
  ['sem confirmação de demonstração', { service: 'suporte', rating: 3, comment: 'Texto fictício' }],
  ['com classificação fornecida', { service: 'cloud', rating: 5, comment: 'Texto fictício', sentiment: 'positive' }],
  ['com provedor configurado', { service: 'internet', rating: 4, comment: 'Texto fictício', demoData: true }]
]) {
  test('coleta removida rejeita payload ' + name + ' sem chamar classificador', async (context) => {
    const database = openDatabase(':memory:');
    context.after(() => database.close());
    let calls = 0;
    const sentimentService = { isConfigured: true, classify: async () => { calls++; throw new Error('Não deve executar'); } };
    const base = await startServer(createApp({ database, sentimentService }), context);
    const response = await fetch(base + '/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal(response.status, 404);
    assert.equal(calls, 0);
    assert.equal(database.prepare('SELECT COUNT(*) AS total FROM feedbacks').get().total, 0);
  });
}
