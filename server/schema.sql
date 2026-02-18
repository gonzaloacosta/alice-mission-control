CREATE TABLE IF NOT EXISTS chat_messages (
  id          SERIAL PRIMARY KEY,
  project_id  TEXT NOT NULL,
  agent_name  TEXT NOT NULL,
  role        TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_project_agent ON chat_messages(project_id, agent_name, created_at);

-- Kanban tables
CREATE TABLE IF NOT EXISTS kanban_boards (
  id          SERIAL PRIMARY KEY,
  project_id  TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kanban_columns (
  id          SERIAL PRIMARY KEY,
  board_id    INTEGER NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  position    INTEGER NOT NULL DEFAULT 0,
  color       TEXT NOT NULL DEFAULT '#00f0ff',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kanban_cards (
  id              SERIAL PRIMARY KEY,
  column_id       INTEGER NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
  project_id      TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT DEFAULT '',
  assignee        TEXT DEFAULT '',
  priority        TEXT DEFAULT 'low',
  notion_page_id  TEXT DEFAULT '',
  position        INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kanban_cards_column ON kanban_cards(column_id, position);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_project ON kanban_cards(project_id);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  project_slug VARCHAR(100) NOT NULL,
  source VARCHAR(50) NOT NULL,
  agent_name VARCHAR(100),
  event_type VARCHAR(50) NOT NULL,
  summary TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_slug);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);