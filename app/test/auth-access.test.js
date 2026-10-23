const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { openDatabase } = require('../src/db/database');
const { createApp } = require('../src/app');

test('gestor não autenticado não consulta o resumo', async (t) => {
  const database = openDatabase(':memory:');
  const app = createApp({ database, sentimentService: { classify: async () => ({ sentiment: 'neutral' }) } });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => {
    server.close();
    database.close();
  });

  const address = server.address();
  const response = await fetch('http://127.0.0.1:' + address.port + '/api/manager/summary');

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Autenticação necessária.' });
});
