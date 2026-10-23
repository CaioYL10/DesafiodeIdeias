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
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);


CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('product', 'service')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, contact TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS client_products (
  client_id INTEGER NOT NULL REFERENCES clients(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  PRIMARY KEY (client_id, product_id)
);
CREATE TABLE IF NOT EXISTS feedback_context (
  feedback_id INTEGER PRIMARY KEY REFERENCES feedbacks(id),
  client_id INTEGER REFERENCES clients(id), product_id INTEGER REFERENCES products(id),
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
  manager_id INTEGER NOT NULL REFERENCES managers(id), created_at TEXT NOT NULL, closed_at TEXT
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
