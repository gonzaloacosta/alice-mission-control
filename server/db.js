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

// Graceful shutdown
export async function closeDb() {
  await pool.end();
  console.log('📦 Database connections closed');
}