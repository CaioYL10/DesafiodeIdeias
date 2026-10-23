// Demonstração local isolada: nenhum dado real ou arquivo de banco é alterado.
const { openDatabase } = require('../src/db/database');
const { createApp } = require('../src/app');
const { hashPassword } = require('../src/security/passwords');

async function main() {
  const database = openDatabase(':memory:');
  const password = await hashPassword('demonstracao-cti-2026');
  const now = new Date().toISOString();
  database.prepare('INSERT INTO managers VALUES (1, ?, ?, ?, ?)').run('gestor@demo.local', password.salt, password.hash, now);
  database.prepare("INSERT INTO products VALUES (1, 'Internet dedicada', 'Serviço fictício para demonstração', 'service', ?)").run(now);
  database.prepare("INSERT INTO products VALUES (2, 'Cloud corporativa', 'Serviço fictício para demonstração', 'service', ?)").run(now);
  database.prepare("INSERT INTO clients VALUES (1, 'Oficina Horizonte · fictícia', 'Equipe de operações (demonstração)', ?)").run(now);
  database.prepare('INSERT INTO client_products VALUES (1, 1)').run();
  const insert = database.prepare("INSERT INTO feedbacks(service, rating, comment, demo_data, created_at) VALUES (?, ?, ?, 1, ?)");
  insert.run('internet', 2, 'Relato fictício: a conexão apresentou oscilações durante a reunião da equipe.', now);
  insert.run('cloud', 5, 'Relato fictício: a equipe conseguiu recuperar os arquivos no ambiente de cloud.', now);
  database.prepare("INSERT INTO feedback_context VALUES (1, 1, 1, 'complaint', 1, ?)").run(now);
  const server = createApp({ database }).listen(3100, '127.0.0.1', () => {
    console.log('Demonstração: http://127.0.0.1:3100/workspace');
    console.log('Acesso local: gestor@demo.local / demonstracao-cti-2026');
    console.log('Dados sintéticos em memória; nenhuma chamada de IA. Os dados são descartados ao parar.');
  });
  process.on('SIGINT', () => server.close(() => { database.close(); process.exit(0); }));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
