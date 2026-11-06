// Demonstração local isolada: nenhum dado real ou arquivo de banco é alterado.
const { openDatabase } = require('../src/db/database');
const { createApp } = require('../src/app');
const { createIngestionService } = require('../src/services/feedback-ingestion');
const { getDemoFeedbacks } = require('../src/services/demo-feedback-source');
const { hashPassword } = require('../src/security/passwords');

async function main() {
  const database = openDatabase(':memory:');
  const password = await hashPassword('demonstracao-cti-2026');
  const now = new Date().toISOString();
  database.prepare('INSERT INTO managers VALUES (1, ?, ?, ?, ?)').run('gestor@demo.local', password.salt, password.hash, now);
  database.prepare("INSERT INTO products VALUES (1, 'Internet dedicada', 'Serviço fictício para demonstração', 'service', ?)").run(now);
  database.prepare("INSERT INTO products VALUES (2, 'Cloud corporativa', 'Serviço fictício para demonstração', 'service', ?)").run(now);
  const results = createIngestionService(database).ingestBatch(getDemoFeedbacks());
  console.log('Importação fictícia:', JSON.stringify(results));
  const server = createApp({ database }).listen(Number(process.env.PORT || 3100), '127.0.0.1', () => {
    console.log(`Demonstração: http://127.0.0.1:${server.address().port}/workspace`);
    console.log('Acesso local: gestor@demo.local / demonstracao-cti-2026');
    console.log('Dados sintéticos em memória; nenhuma chamada de IA. Os dados são descartados ao parar.');
  });
  const close = () => server.close(() => { database.close(); process.exit(0); });
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
