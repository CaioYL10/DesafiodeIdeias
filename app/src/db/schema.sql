CREATE TABLE IF NOT EXISTS managers (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  manager_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (manager_id) REFERENCES managers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id INTEGER PRIMARY KEY,
  service TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  source_channel TEXT NOT NULL DEFAULT 'form' CHECK (source_channel IN ('form', 'email', 'phone', 'internal')),
  source_protocol TEXT NOT NULL DEFAULT '',
  reported_organization TEXT NOT NULL DEFAULT '',
  reported_contact TEXT NOT NULL DEFAULT '',
  reported_email TEXT NOT NULL DEFAULT '',
  received_at TEXT NOT NULL DEFAULT '',
  source_kind TEXT NOT NULL DEFAULT 'feedback' CHECK (source_kind IN ('feedback', 'complaint', 'suggestion')),
  demo_data INTEGER NOT NULL DEFAULT 0 CHECK (demo_data IN (0, 1)),
  created_at TEXT NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sentiment_status IN ('pending', 'completed', 'failed')),
  handling_status TEXT NOT NULL DEFAULT 'new'
    CHECK (handling_status IN ('new', 'in_review', 'resolved'))
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at);
CREATE INDEX IF NOT EXISTS idx_feedbacks_service ON feedbacks(service);
CREATE INDEX IF NOT EXISTS idx_feedbacks_sentiment ON feedbacks(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedbacks_handling_status ON feedbacks(handling_status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_source_protocol ON feedbacks(source_channel, source_protocol);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);


CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('product', 'service')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, contact TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL,
  account_owner TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS client_contacts (
  id INTEGER PRIMARY KEY, client_id INTEGER NOT NULL REFERENCES clients(id),
  name TEXT NOT NULL, role TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '', legacy INTEGER NOT NULL DEFAULT 0 CHECK (legacy IN (0, 1)),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_legacy_contact ON client_contacts(client_id) WHERE legacy = 1;
CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts(client_id);
CREATE TABLE IF NOT EXISTS client_interactions (
  id INTEGER PRIMARY KEY, client_id INTEGER NOT NULL REFERENCES clients(id),
  contact_id INTEGER REFERENCES client_contacts(id), type TEXT NOT NULL,
  occurred_at TEXT NOT NULL, summary TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_client_interactions_client ON client_interactions(client_id, occurred_at DESC);
CREATE TABLE IF NOT EXISTS client_products (
  client_id INTEGER NOT NULL REFERENCES clients(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  PRIMARY KEY (client_id, product_id)
);
CREATE TABLE IF NOT EXISTS service_instances (
  id INTEGER PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  external_id TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  legacy INTEGER NOT NULL DEFAULT 0 CHECK (legacy IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_service_instances_client ON service_instances(client_id, product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_instances_legacy ON service_instances(client_id, product_id) WHERE legacy = 1;
CREATE TABLE IF NOT EXISTS feedback_context (
  feedback_id INTEGER PRIMARY KEY REFERENCES feedbacks(id),
  client_id INTEGER REFERENCES clients(id), product_id INTEGER REFERENCES products(id),
  contact_id INTEGER REFERENCES client_contacts(id),
  kind TEXT NOT NULL CHECK (kind IN ('feedback', 'complaint', 'suggestion')),
  manager_id INTEGER NOT NULL REFERENCES managers(id), updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sentiment_reviews (
  id INTEGER PRIMARY KEY, feedback_id INTEGER NOT NULL REFERENCES feedbacks(id),
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  note TEXT NOT NULL, manager_id INTEGER NOT NULL REFERENCES managers(id), created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_feedback ON sentiment_reviews(feedback_id, id);
CREATE TABLE IF NOT EXISTS quality_problems (
  id INTEGER PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, analysis TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  manager_id INTEGER NOT NULL REFERENCES managers(id), created_at TEXT NOT NULL, closed_at TEXT,
  service_instance_id INTEGER REFERENCES service_instances(id),
  impact TEXT NOT NULL DEFAULT 'medium' CHECK (impact IN ('low', 'medium', 'high', 'critical')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  containment TEXT NOT NULL DEFAULT '', cause TEXT NOT NULL DEFAULT '',
  recurrent INTEGER NOT NULL DEFAULT 0 CHECK (recurrent IN (0, 1)),
  related_problem_id INTEGER REFERENCES quality_problems(id)
);
CREATE TABLE IF NOT EXISTS problem_feedbacks (
  problem_id INTEGER NOT NULL REFERENCES quality_problems(id),
  feedback_id INTEGER NOT NULL REFERENCES feedbacks(id), PRIMARY KEY (problem_id, feedback_id)
);
CREATE TABLE IF NOT EXISTS quality_actions (
  id INTEGER PRIMARY KEY, problem_id INTEGER NOT NULL REFERENCES quality_problems(id),
  description TEXT NOT NULL, owner TEXT NOT NULL, due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'effective', 'ineffective')),
  evidence TEXT, completed_at TEXT, verification_note TEXT, verified_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quality_action_attempts (
  id INTEGER PRIMARY KEY, action_id INTEGER NOT NULL REFERENCES quality_actions(id),
  evidence TEXT NOT NULL, completed_at TEXT NOT NULL,
  effective INTEGER CHECK (effective IN (0, 1)), verification_note TEXT,
  verified_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_quality_attempts_action ON quality_action_attempts(action_id, id);
CREATE TABLE IF NOT EXISTS quality_events (
  id INTEGER PRIMARY KEY, problem_id INTEGER NOT NULL REFERENCES quality_problems(id),
  manager_id INTEGER NOT NULL REFERENCES managers(id), description TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE VIEW IF NOT EXISTS feedback_overview AS
SELECT f.*, c.client_id, c.product_id, COALESCE(c.kind, 'feedback') AS kind,
  cl.name AS client_name, p.name AS product_name,
  r.sentiment AS reviewed_sentiment, r.created_at AS reviewed_at,
  COALESCE(r.sentiment, f.sentiment) AS final_sentiment
FROM feedbacks f
LEFT JOIN feedback_context c ON c.feedback_id = f.id
LEFT JOIN clients cl ON cl.id = c.client_id
LEFT JOIN products p ON p.id = c.product_id
LEFT JOIN sentiment_reviews r ON r.id = (SELECT MAX(id) FROM sentiment_reviews WHERE feedback_id = f.id);

CREATE TABLE IF NOT EXISTS external_client_ids (
  source_system TEXT NOT NULL, external_client_id TEXT NOT NULL,
  client_id INTEGER NOT NULL REFERENCES clients(id), PRIMARY KEY(source_system, external_client_id)
);
CREATE TABLE IF NOT EXISTS client_cnpjs (
  cnpj TEXT NOT NULL, client_id INTEGER NOT NULL REFERENCES clients(id), PRIMARY KEY(cnpj, client_id)
);
CREATE TABLE IF NOT EXISTS imported_feedbacks (
  feedback_id INTEGER PRIMARY KEY REFERENCES feedbacks(id), source_system TEXT NOT NULL,
  external_event_id TEXT NOT NULL, external_client_id TEXT, occurred_at TEXT NOT NULL,
  dimension TEXT NOT NULL CHECK(dimension IN ('technical','relationship','mixed')),
  external_classification TEXT, technical_reference TEXT, reported_cnpj TEXT, reported_phone TEXT,
  client_id INTEGER REFERENCES clients(id),
  UNIQUE(source_system, external_event_id)
);
CREATE TABLE IF NOT EXISTS identity_pending (
  id INTEGER PRIMARY KEY, feedback_id INTEGER NOT NULL UNIQUE REFERENCES feedbacks(id),
  source_system TEXT NOT NULL, external_client_id TEXT, client_name TEXT NOT NULL, cnpj TEXT,
  reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','linked','created','rejected')),
  reviewed_by INTEGER REFERENCES managers(id), reviewed_at TEXT, justification TEXT,
  resolved_client_id INTEGER REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS relationship_hypotheses (
  id INTEGER PRIMARY KEY, client_id INTEGER NOT NULL REFERENCES clients(id),
  fingerprint TEXT NOT NULL UNIQUE, criterion TEXT NOT NULL, description TEXT NOT NULL,
  limitations TEXT NOT NULL, period_start TEXT NOT NULL, period_end TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','rejected','adjusted')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS relationship_evidence (
  hypothesis_id INTEGER NOT NULL REFERENCES relationship_hypotheses(id),
  feedback_id INTEGER NOT NULL REFERENCES imported_feedbacks(feedback_id),
  technical_reference TEXT, PRIMARY KEY(hypothesis_id, feedback_id)
);
CREATE TABLE IF NOT EXISTS relationship_decisions (
  id INTEGER PRIMARY KEY, hypothesis_id INTEGER NOT NULL REFERENCES relationship_hypotheses(id),
  previous_status TEXT NOT NULL, status TEXT NOT NULL, previous_description TEXT NOT NULL,
  description TEXT NOT NULL, justification TEXT NOT NULL,
  manager_id INTEGER NOT NULL REFERENCES managers(id), created_at TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS relationship_decision_no_update BEFORE UPDATE ON relationship_decisions
BEGIN SELECT RAISE(ABORT, 'Histórico de decisão imutável'); END;
CREATE TRIGGER IF NOT EXISTS relationship_decision_no_delete BEFORE DELETE ON relationship_decisions
BEGIN SELECT RAISE(ABORT, 'Histórico de decisão imutável'); END;
CREATE TRIGGER IF NOT EXISTS relationship_evidence_no_update BEFORE UPDATE ON relationship_evidence
BEGIN SELECT RAISE(ABORT, 'Evidência imutável'); END;
CREATE TRIGGER IF NOT EXISTS relationship_evidence_no_delete BEFORE DELETE ON relationship_evidence
BEGIN SELECT RAISE(ABORT, 'Evidência imutável'); END;
CREATE TRIGGER IF NOT EXISTS relationship_import_client_guard BEFORE UPDATE OF client_id ON imported_feedbacks
WHEN EXISTS (SELECT 1 FROM relationship_evidence e JOIN relationship_hypotheses h ON h.id = e.hypothesis_id
 WHERE e.feedback_id = OLD.feedback_id AND NEW.client_id IS NOT h.client_id)
BEGIN SELECT RAISE(ABORT, 'Feedback vinculado a hipótese'); END;
CREATE TRIGGER IF NOT EXISTS relationship_context_insert_guard BEFORE INSERT ON feedback_context
WHEN NEW.client_id IS NOT NULL AND EXISTS (SELECT 1 FROM relationship_evidence e JOIN relationship_hypotheses h ON h.id = e.hypothesis_id
 WHERE e.feedback_id = NEW.feedback_id AND NEW.client_id IS NOT h.client_id)
BEGIN SELECT RAISE(ABORT, 'Feedback vinculado a hipótese'); END;
CREATE TRIGGER IF NOT EXISTS relationship_context_update_guard BEFORE UPDATE OF client_id ON feedback_context
WHEN NEW.client_id IS NOT NULL AND EXISTS (SELECT 1 FROM relationship_evidence e JOIN relationship_hypotheses h ON h.id = e.hypothesis_id
 WHERE e.feedback_id = NEW.feedback_id AND NEW.client_id IS NOT h.client_id)
BEGIN SELECT RAISE(ABORT, 'Feedback vinculado a hipótese'); END;
CREATE TABLE IF NOT EXISTS relationship_interaction_evidence (
  hypothesis_id INTEGER NOT NULL REFERENCES relationship_hypotheses(id),
  interaction_id INTEGER NOT NULL REFERENCES client_interactions(id), occurred_at TEXT NOT NULL,
  summary_snapshot TEXT NOT NULL, PRIMARY KEY(hypothesis_id, interaction_id)
);
CREATE TRIGGER IF NOT EXISTS relationship_interaction_evidence_no_update BEFORE UPDATE ON relationship_interaction_evidence
BEGIN SELECT RAISE(ABORT, 'Evidência imutável'); END;
CREATE TRIGGER IF NOT EXISTS relationship_interaction_evidence_no_delete BEFORE DELETE ON relationship_interaction_evidence
BEGIN SELECT RAISE(ABORT, 'Evidência imutável'); END;
CREATE TRIGGER IF NOT EXISTS relationship_hypothesis_client_guard BEFORE UPDATE OF client_id ON relationship_hypotheses
WHEN NEW.client_id IS NOT OLD.client_id
BEGIN SELECT RAISE(ABORT, 'Cliente da hipótese imutável'); END;
CREATE TRIGGER IF NOT EXISTS relationship_evidence_client_guard BEFORE INSERT ON relationship_evidence
WHEN NOT EXISTS (SELECT 1 FROM relationship_hypotheses h JOIN imported_feedbacks i ON i.feedback_id = NEW.feedback_id
 LEFT JOIN feedback_context c ON c.feedback_id = i.feedback_id
 WHERE h.id = NEW.hypothesis_id AND i.client_id = h.client_id AND (c.client_id IS NULL OR c.client_id = h.client_id)
 AND i.dimension IN ('relationship', 'mixed'))
BEGIN SELECT RAISE(ABORT, 'Evidência incompatível com cliente ou dimensão'); END;
CREATE TRIGGER IF NOT EXISTS relationship_context_feedback_guard BEFORE UPDATE OF feedback_id ON feedback_context
WHEN NEW.client_id IS NOT NULL AND EXISTS (SELECT 1 FROM relationship_evidence e JOIN relationship_hypotheses h ON h.id = e.hypothesis_id
 WHERE e.feedback_id = NEW.feedback_id AND NEW.client_id IS NOT h.client_id)
BEGIN SELECT RAISE(ABORT, 'Feedback vinculado a hipótese'); END;

CREATE TABLE IF NOT EXISTS retention_preferences (
  client_id INTEGER PRIMARY KEY REFERENCES clients(id), purpose TEXT NOT NULL,
  consent INTEGER NOT NULL CHECK(consent IN (0,1)), recipient TEXT NOT NULL,
  frequency_days INTEGER NOT NULL CHECK(frequency_days BETWEEN 1 AND 365),
  active INTEGER NOT NULL CHECK(active IN (0,1)), updated_by INTEGER NOT NULL REFERENCES managers(id), updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS retention_templates (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL,
  updated_by INTEGER NOT NULL REFERENCES managers(id), updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS retention_events (
  id INTEGER PRIMARY KEY, client_id INTEGER NOT NULL REFERENCES clients(id),
  service_instance_id INTEGER REFERENCES service_instances(id), kind TEXT NOT NULL CHECK(kind IN ('follow_up','maintenance')),
  title TEXT NOT NULL, due_at TEXT NOT NULL, created_by INTEGER NOT NULL REFERENCES managers(id), created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS retention_jobs (
  id INTEGER PRIMARY KEY, client_id INTEGER NOT NULL REFERENCES clients(id), event_id INTEGER NOT NULL REFERENCES retention_events(id),
  template_id INTEGER NOT NULL REFERENCES retention_templates(id), rule TEXT NOT NULL, window TEXT NOT NULL,
  purpose TEXT NOT NULL, recipient TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('planned','simulated_success','simulated_failure','cancelled')),
  created_by INTEGER NOT NULL REFERENCES managers(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  UNIQUE(client_id, rule, event_id, window)
);
CREATE TABLE IF NOT EXISTS retention_history (
  id INTEGER PRIMARY KEY, client_id INTEGER NOT NULL REFERENCES clients(id), job_id INTEGER REFERENCES retention_jobs(id),
  event_type TEXT NOT NULL, manager_id INTEGER NOT NULL REFERENCES managers(id), created_at TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS retention_history_no_update BEFORE UPDATE ON retention_history
BEGIN SELECT RAISE(ABORT, 'Histórico imutável'); END;
CREATE TRIGGER IF NOT EXISTS retention_history_no_delete BEFORE DELETE ON retention_history
BEGIN SELECT RAISE(ABORT, 'Histórico imutável'); END;
