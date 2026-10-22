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
