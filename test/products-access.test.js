const test = require('node:test');
const assert = require('node:assert/strict');
const { openDatabase } = require('../src/db/database');
const { createApp } = require('../src/app');
const { createSession, sessionCookie } = require('../src/security/sessions');
const { startServer } = require('../test-support/server');

test('visitante acessa visão geral e formulário; gestão e API de produtos exigem sessão', async (context) => {
  const database = openDatabase(':memory:'); context.after(() => database.close());
  const url = await startServer(createApp({ database }), context);
  assert.match(await fetch(url + '/').then(r => r.text()), /id="home-title"/);
  assert.match(await fetch(url + '/feedback').then(r => r.text()), /id="feedback-form"/);
  for (const path of ['/dashboard', '/dashboard.html', '/products', '/products.html']) {
    const response = await fetch(url + path, { redirect: 'manual' }); assert.equal(response.status, 302, path);
  }
  assert.equal((await fetch(url + '/api/manager/products')).status, 401);
  assert.equal((await fetch(url + '/api/manager/products', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({name:'Teste',type:'product'}) })).status, 401);
  assert.equal(database.prepare('SELECT COUNT(*) AS total FROM products').get().total, 0);
});

test('gestor cadastra produto válido, mantém dados no banco e perde acesso ao sair', async (context) => {
  const database = openDatabase(':memory:'); context.after(() => database.close());
  database.prepare('INSERT INTO managers(email,password_salt,password_hash,created_at) VALUES (?,?,?,?)').run('demo@local.test','salt','hash',new Date().toISOString());
  const {token} = createSession(database, 1); const cookie = sessionCookie(token).split(';')[0];
  const url = await startServer(createApp({ database }), context);
  assert.equal((await fetch(url+'/products', {headers:{cookie}})).status, 200);
  const created = await fetch(url+'/api/manager/products', {method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({name:'Cloud demonstrativa',type:'service',description:'Exemplo fictício'})});
  assert.equal(created.status, 201); assert.equal(database.prepare('SELECT name FROM products').get().name, 'Cloud demonstrativa');
  assert.equal((await fetch(url+'/api/manager/products',{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({name:' ',type:'service'})})).status,400);
  await fetch(url+'/api/auth/logout',{method:'POST',headers:{cookie}});
  assert.equal((await fetch(url+'/api/manager/products',{headers:{cookie}})).status,401);
  assert.equal((await fetch(url+'/products',{headers:{cookie},redirect:'manual'})).status,302);
});
