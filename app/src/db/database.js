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
  const oldFeedback = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'feedbacks'").get();
  if (oldFeedback && database.prepare('PRAGMA table_info(feedbacks)').all().some((column) => column.name === 'rating' && column.notnull)) {
    const definition = schema.match(/CREATE TABLE IF NOT EXISTS feedbacks \([\s\S]*?\n\);/)[0]
      .replace('CREATE TABLE IF NOT EXISTS feedbacks', 'CREATE TABLE feedbacks_new');
    database.exec('PRAGMA foreign_keys = OFF');
    try {
      database.exec(`BEGIN; DROP VIEW IF EXISTS feedback_overview; ${definition}
        INSERT INTO feedbacks_new(id, service, rating, comment, demo_data, created_at, sentiment, sentiment_status, handling_status)
        SELECT id, service, rating, comment, demo_data, created_at, sentiment, sentiment_status, handling_status FROM feedbacks;
        UPDATE feedbacks_new SET received_at = created_at;
        DROP TABLE feedbacks; ALTER TABLE feedbacks_new RENAME TO feedbacks; COMMIT;`);
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    } finally {
      database.exec('PRAGMA foreign_keys = ON');
    }
  }
  database.exec(schema);
  if (!database.prepare('PRAGMA table_info(clients)').all().some((column) => column.name === 'account_owner')) {
    database.exec("ALTER TABLE clients ADD COLUMN account_owner TEXT NOT NULL DEFAULT ''");
  }
  const migrateFeedback = !database.prepare('PRAGMA table_info(feedback_context)').all().some((column) => column.name === 'service_instance_id');
  const migrateProblems = !database.prepare('PRAGMA table_info(quality_problems)').all().some((column) => column.name === 'service_instance_id');
  if (migrateFeedback) {
    database.exec('ALTER TABLE feedback_context ADD COLUMN service_instance_id INTEGER REFERENCES service_instances(id)');
  }
  if (!database.prepare('PRAGMA table_info(feedback_context)').all().some((column) => column.name === 'contact_id')) {
    database.exec('ALTER TABLE feedback_context ADD COLUMN contact_id INTEGER REFERENCES client_contacts(id)');
  }
  if (migrateProblems) {
    database.exec('ALTER TABLE quality_problems ADD COLUMN service_instance_id INTEGER REFERENCES service_instances(id)');
  }
  const problemColumns = new Set(database.prepare('PRAGMA table_info(quality_problems)').all().map((column) => column.name));
  for (const [name, definition] of Object.entries({
    impact: "TEXT NOT NULL DEFAULT 'medium' CHECK (impact IN ('low', 'medium', 'high', 'critical'))",
    priority: "TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high'))",
    containment: "TEXT NOT NULL DEFAULT ''",
    cause: "TEXT NOT NULL DEFAULT ''",
    recurrent: 'INTEGER NOT NULL DEFAULT 0 CHECK (recurrent IN (0, 1))',
    related_problem_id: 'INTEGER REFERENCES quality_problems(id)'
  })) {
    if (!problemColumns.has(name)) database.exec(`ALTER TABLE quality_problems ADD COLUMN ${name} ${definition}`);
  }
  database.exec(`INSERT INTO quality_action_attempts(action_id, evidence, completed_at, effective, verification_note, verified_at)
    SELECT id, evidence, completed_at,
      CASE status WHEN 'effective' THEN 1 WHEN 'ineffective' THEN 0 ELSE NULL END,
      verification_note, verified_at FROM quality_actions a
    WHERE evidence IS NOT NULL AND completed_at IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM quality_action_attempts WHERE action_id = a.id)`);
  database.exec(`INSERT INTO service_instances(client_id, product_id, name, legacy, created_at, updated_at)
    SELECT cp.client_id, cp.product_id, p.name, 1, c.created_at, c.created_at
    FROM client_products cp JOIN products p ON p.id = cp.product_id JOIN clients c ON c.id = cp.client_id
    WHERE NOT EXISTS (SELECT 1 FROM service_instances s WHERE s.client_id = cp.client_id AND s.product_id = cp.product_id);
    UPDATE feedback_context SET service_instance_id = (
      SELECT id FROM service_instances s WHERE s.client_id = feedback_context.client_id
        AND s.product_id = feedback_context.product_id AND s.legacy = 1)
    WHERE ${migrateFeedback ? 1 : 0} = 1 AND service_instance_id IS NULL AND client_id IS NOT NULL AND product_id IS NOT NULL;
    UPDATE quality_problems SET service_instance_id = (
      SELECT MIN(c.service_instance_id) FROM problem_feedbacks pf
      JOIN feedback_context c ON c.feedback_id = pf.feedback_id WHERE pf.problem_id = quality_problems.id)
    WHERE ${migrateProblems ? 1 : 0} = 1 AND service_instance_id IS NULL
      AND (SELECT COUNT(*) FROM problem_feedbacks WHERE problem_id = quality_problems.id) > 0
      AND (SELECT COUNT(*) FROM problem_feedbacks pf LEFT JOIN feedback_context c ON c.feedback_id = pf.feedback_id
        WHERE pf.problem_id = quality_problems.id AND c.service_instance_id IS NULL) = 0
      AND (SELECT COUNT(DISTINCT c.service_instance_id) FROM problem_feedbacks pf
        JOIN feedback_context c ON c.feedback_id = pf.feedback_id WHERE pf.problem_id = quality_problems.id) = 1;
    DROP VIEW feedback_overview;
    CREATE VIEW feedback_overview AS
    SELECT f.*, c.client_id, c.contact_id, c.product_id, c.service_instance_id, COALESCE(c.kind, f.source_kind) AS kind,
      cl.name AS client_name, cc.name AS contact_name, p.name AS product_name, s.name AS service_instance_name,
      r.sentiment AS reviewed_sentiment, r.created_at AS reviewed_at,
      COALESCE(r.sentiment, f.sentiment) AS final_sentiment
    FROM feedbacks f
    LEFT JOIN feedback_context c ON c.feedback_id = f.id
    LEFT JOIN clients cl ON cl.id = c.client_id
    LEFT JOIN client_contacts cc ON cc.id = c.contact_id
    LEFT JOIN products p ON p.id = c.product_id
    LEFT JOIN service_instances s ON s.id = c.service_instance_id
    LEFT JOIN sentiment_reviews r ON r.id = (SELECT MAX(id) FROM sentiment_reviews WHERE feedback_id = f.id);`);
  database.exec(`INSERT INTO client_contacts(client_id, name, legacy, created_at, updated_at)
    SELECT id, trim(contact), 1, created_at, created_at FROM clients
    WHERE trim(contact) <> '' AND NOT EXISTS
      (SELECT 1 FROM client_contacts WHERE client_id = clients.id AND legacy = 1)`);
  return database;
}

module.exports = { openDatabase };
