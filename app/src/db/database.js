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
  return database;
}

module.exports = { openDatabase };
