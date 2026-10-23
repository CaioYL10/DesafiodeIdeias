const test = require('node:test');
const assert = require('node:assert/strict');
const { openDatabase } = require('../src/db/database');
const { createApp } = require('../src/app');
const { startServer } = require('../test-support/server');

test('serve formulário e login, mas exige sessão para o painel', async (context) => {
  const database = openDatabase(':memory:');
  context.after(() => database.close());
  const baseUrl = await startServer(createApp({ database }), context);
  assert.equal((await fetch(baseUrl + '/')).status, 200);
  assert.equal((await fetch(baseUrl + '/login')).status, 200);
  const dashboard = await fetch(baseUrl + '/dashboard', { redirect: 'manual' });
  assert.equal(dashboard.status, 302);
  assert.equal(dashboard.headers.get('location'), '/login');
  assert.equal((await fetch(baseUrl + '/styles.css')).status, 200);
  assert.equal((await fetch(baseUrl + '/app.js')).status, 200);
  assert.equal((await fetch(baseUrl + '/favicon.svg')).status, 200);
});
