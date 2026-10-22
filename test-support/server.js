const { once } = require('node:events');

async function startServer(app, testContext) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  testContext.after(() => new Promise((resolve) => server.close(resolve)));
  return 'http://127.0.0.1:' + server.address().port;
}

module.exports = { startServer };
