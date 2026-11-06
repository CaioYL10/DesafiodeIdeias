const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../server');

test('rotas da aplicação carregam o mesmo documento e os recursos locais', async () => {
  const server = createServer().listen(0);
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const route of ['/', '/login', '/dashboard', '/clientes', '/triagem', '/acoes', '/problemas', '/servicos']) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200, route);
      const html = await response.text();
      assert.match(html, /<html lang="pt-BR">/);
      assert.match(html, /rel="icon" type="image\/png" href="\/assets\/favicon-cti.png"/);
    }
    for (const asset of ['/assets/app.js', '/assets/app.css', '/assets/dashboard.css', '/assets/layout.css', '/assets/home.css', '/assets/public.css', '/assets/repair.css', '/assets/dashboardTrend.svg', '/assets/dashboardMessage.svg', '/assets/imgImage2.png', '/assets/favicon-cti.png', '/assets/imgSaoPaulo.svg']) {
      const response = await fetch(base + asset);
      assert.equal(response.status, 200, asset);
      assert.ok((await response.arrayBuffer()).byteLength > 0, asset);
    }
    const absent = await fetch(base + '/assets/inexistente.svg');
    assert.equal(absent.status, 404);
  } finally {
    server.close();
  }
});
