import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connection pool
const pool = new Pool({
  connectionString: 'postgresql://alice:alice_mc_2026@localhost:5432/alice_mc'
});

// Initialize database - run schema
export async function initDb() {
  try {
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('📦 Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

// Save a message
export async function saveMessage(projectId, agentName, role, content) {
  const query = `
    INSERT INTO chat_messages (project_id, agent_name, role, content)
    VALUES ($1, $2, $3, $4)
    RETURNING id, created_at
  `;
  
  try {
    const result = await pool.query(query, [projectId, agentName, role, content]);
    return {
      id: result.rows[0].id,
      created_at: result.rows[0].created_at
    };
  } catch (error) {
    console.error('❌ Save message failed:', error.message);
    throw error;
  }
}

// Get messages for a project/agent
export async function getMessages(projectId, agentName, limit = 100) {
  const query = `
    SELECT id, project_id, agent_name, role, content, created_at
    FROM chat_messages
    WHERE project_id = $1 AND agent_name = $2
    ORDER BY created_at ASC
    LIMIT $3
  `;
  
  try {
    const result = await pool.query(query, [projectId, agentName, limit]);
    return result.rows.map(row => ({
      id: `db-${row.id}`,
      type: row.role,
      content: row.content,
      timestamp: new Date(row.created_at).getTime(),
      projectId: row.project_id,
      agentName: row.agent_name
    }));
  } catch (error) {
    console.error('❌ Get messages failed:', error.message);
    throw error;
  }
}

// Delete messages for a project/agent (optional - for clear history)
export async function deleteMessages(projectId, agentName) {
  const query = 'DELETE FROM chat_messages WHERE project_id = $1 AND agent_name = $2';
  
  try {
    const result = await pool.query(query, [projectId, agentName]);
    return result.rowCount;
  } catch (error) {
    console.error('❌ Delete messages failed:', error.message);
    throw error;
  }
}

// Test connection
export async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('🔗 Database connection successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// ─── Kanban ───

const DEFAULT_COLUMNS = [
  { name: 'Backlog', position: 0, color: '#6a7a8a' },
  { name: 'Todo', position: 1, color: '#00f0ff' },
  { name: 'In Progress', position: 2, color: '#ffcc00' },
  { name: 'Review', position: 3, color: '#ff8800' },
  { name: 'Done', position: 4, color: '#00ff88' },
];

export async function initKanban(projectId) {
  // Create board if not exists, with default columns
  const existing = await pool.query('SELECT id FROM kanban_boards WHERE project_id = $1', [projectId]);
  if (existing.rows.length > 0) return existing.rows[0].id;

  const board = await pool.query(
    'INSERT INTO kanban_boards (project_id, name) VALUES ($1, $2) RETURNING id',
    [projectId, projectId.toUpperCase() + ' Board']
  );
  const boardId = board.rows[0].id;

  for (const col of DEFAULT_COLUMNS) {
    await pool.query(
      'INSERT INTO kanban_columns (board_id, name, position, color) VALUES ($1, $2, $3, $4)',
      [boardId, col.name, col.position, col.color]
    );
  }
  return boardId;
}

export async function getBoard(projectId) {
  const boardId = await initKanban(projectId);
  const cols = await pool.query(
    'SELECT id, name, position, color FROM kanban_columns WHERE board_id = $1 ORDER BY position',
    [boardId]
  );
  const cards = await pool.query(
    `SELECT c.id, c.column_id, c.project_id, c.title, c.description, c.assignee, c.priority, c.notion_page_id, c.position, c.created_at, c.updated_at
     FROM kanban_cards c
     JOIN kanban_columns col ON c.column_id = col.id
     WHERE col.board_id = $1
     ORDER BY c.position`,
    [boardId]
  );
  return {
    boardId,
    projectId,
    columns: cols.rows.map(col => ({
      ...col,
      cards: cards.rows.filter(card => card.column_id === col.id)
    }))
  };
}

export async function getAllCards() {
  // Get all boards, columns, cards across all projects
  const boards = await pool.query('SELECT id, project_id FROM kanban_boards');
  const allColumns = await pool.query('SELECT id, board_id, name, position, color FROM kanban_columns ORDER BY position');
  const allCards = await pool.query('SELECT * FROM kanban_cards ORDER BY position');

  // Build a unified column structure using the first board's column names as template
  const columnNames = DEFAULT_COLUMNS.map(c => c.name);
  const unified = columnNames.map((name, i) => {
    const matchingCols = allColumns.rows.filter(c => c.name === name);
    const colIds = matchingCols.map(c => c.id);
    return {
      id: matchingCols[0]?.id || i,
      name,
      position: i,
      color: DEFAULT_COLUMNS[i].color,
      cards: allCards.rows.filter(card => colIds.includes(card.column_id))
    };
  });
  return { columns: unified, projects: boards.rows.map(b => b.project_id) };
}

export async function getCards(projectId) {
  const board = await getBoard(projectId);
  return board.columns.flatMap(col => col.cards);
}

export async function createCard(projectId, columnName, title, description = '', assignee = '', priority = 'low') {
  const boardId = await initKanban(projectId);
  const col = await pool.query(
    'SELECT id FROM kanban_columns WHERE board_id = $1 AND name = $2',
    [boardId, columnName || 'Backlog']
  );
  if (col.rows.length === 0) throw new Error('Column not found');
  const columnId = col.rows[0].id;

  const maxPos = await pool.query('SELECT COALESCE(MAX(position), -1) as max FROM kanban_cards WHERE column_id = $1', [columnId]);
  const position = maxPos.rows[0].max + 1;

  const result = await pool.query(
    `INSERT INTO kanban_cards (column_id, project_id, title, description, assignee, priority, position)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [columnId, projectId, title, description, assignee, priority, position]
  );
  return result.rows[0];
}

export async function updateCard(cardId, updates) {
  const fields = [];
  const values = [];
  let i = 1;
  for (const [key, val] of Object.entries(updates)) {
    if (['title', 'description', 'assignee', 'priority', 'column_id', 'position', 'notion_page_id'].includes(key)) {
      fields.push(`${key} = $${i}`);
      values.push(val);
      i++;
    }
  }
  if (fields.length === 0) throw new Error('No valid fields to update');
  fields.push(`updated_at = now()`);
  values.push(cardId);

  const result = await pool.query(
    `UPDATE kanban_cards SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function moveCard(cardId, targetColumnId, position) {
  const result = await pool.query(
    'UPDATE kanban_cards SET column_id = $1, position = $2, updated_at = now() WHERE id = $3 RETURNING *',
    [targetColumnId, position, cardId]
  );
  return result.rows[0];
}

export async function deleteCard(cardId) {
  const result = await pool.query('DELETE FROM kanban_cards WHERE id = $1 RETURNING id', [cardId]);
  return result.rowCount > 0;
}

// ─── Events ───

export async function createEvent(projectSlug, source, agentName, eventType, summary, metadata = {}) {
  const result = await pool.query(
    `INSERT INTO events (project_slug, source, agent_name, event_type, summary, metadata)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [projectSlug, source, agentName, eventType, summary, JSON.stringify(metadata)]
  );
  return result.rows[0];
}

export async function getEvents({ project, source, limit = 50, offset = 0 } = {}) {
  const conditions = [];
  const values = [];
  let i = 1;
  if (project) { conditions.push(`project_slug = $${i++}`); values.push(project); }
  if (source) { conditions.push(`source = $${i++}`); values.push(source); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  values.push(parseInt(limit), parseInt(offset));
  const result = await pool.query(
    `SELECT * FROM events ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
    values
  );
  return result.rows;
}

// Graceful shutdown
export async function closeDb() {
  await pool.end();
  console.log('📦 Database connections closed');
}