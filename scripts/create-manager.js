const { openDatabase } = require('../src/db/database');
const { hashPassword } = require('../src/security/passwords');

async function main() {
  const email = (process.env.MANAGER_EMAIL || '').trim().toLowerCase();
  const password = process.env.MANAGER_PASSWORD || '';

  if (!email || !email.includes('@')) {
    throw new Error('Defina MANAGER_EMAIL com um e-mail válido.');
  }
  if (password.length < 12) {
    throw new Error('MANAGER_PASSWORD deve conter pelo menos 12 caracteres.');
  }

  const databasePath = process.env.DB_PATH || 'data/feedback.sqlite';
  const database = openDatabase(databasePath);
  const existing = database.prepare('SELECT id FROM managers WHERE email = ?').get(email);
  if (existing) {
    database.close();
    throw new Error('Já existe um gestor com esse e-mail.');
  }

  const { salt, hash } = await hashPassword(password);
  database.prepare(
    'INSERT INTO managers (email, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?)'
  ).run(email, salt, hash, new Date().toISOString());
  database.close();
  process.stdout.write('Gestor criado: ' + email + String.fromCharCode(10));
}

main().catch((error) => {
  process.stderr.write(error.message + String.fromCharCode(10));
  process.exitCode = 1;
});
