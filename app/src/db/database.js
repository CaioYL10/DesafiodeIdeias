const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync: Database } = require('node:sqlite');

function openDatabase(filename) {
  if (filename !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
  }

  const database = new Database(filename);
  database.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');

  if (filename !== ':memory:') {
    database.exec('PRAGMA journal_mode = WAL;');
  }

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  database.exec(schema);
  if (!database.prepare('PRAGMA table_info(clients)').all().some((column) => column.name === 'account_owner')) {
    database.exec("ALTER TABLE clients ADD COLUMN account_owner TEXT NOT NULL DEFAULT ''");
  }
  database.exec(`INSERT INTO client_contacts(client_id, name, legacy, created_at, updated_at)
    SELECT id, trim(contact), 1, created_at, created_at FROM clients
    WHERE trim(contact) <> '' AND NOT EXISTS
      (SELECT 1 FROM client_contacts WHERE client_id = clients.id AND legacy = 1)`);
  return database;
}

module.exports = { openDatabase };
