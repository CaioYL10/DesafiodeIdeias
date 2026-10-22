const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const Database = require('better-sqlite3');
const { createApp } = require('../src/app');

test('login rejeita gestor inexistente sem criar cookie de sessão', async (t) => {
  const database = new Database(':memory:');
  database.exec(
    'CREATE TABLE managers (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);' +
    'CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, manager_id INTEGER NOT NULL, expires_at TEXT NOT NULL, FOREIGN KEY (manager_id) REFERENCES managers(id));'
  );
  const app = createApp({ database, sentimentService: { classify: async () => ({ sentiment: 'neutral' }) } });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => {
    server.close();
    database.close();
  });

  const address = server.address();
  const response = await fetch('http://127.0.0.1:' + address.port + '/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'gestor@demo.local', password: 'senha-errada' })
  });

  assert.equal(response.status, 401);
  assert.equal(response.headers.get('set-cookie'), null);
});
