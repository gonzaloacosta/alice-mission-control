// Project configuration mapping
// Static defaults — overridden by persistent projects.json if it exists
const DEFAULT_PROJECTS = {
  kubiverse: { dir: '/home/alice/github/kubiverse', agents: ['backend', 'devops', 'devsecops', 'frontend', 'qa'] },
  // Backward-compat alias for older references
  cid: { dir: '/home/alice/github/kubiverse', agents: ['backend', 'devops', 'devsecops', 'frontend', 'qa'] },
  vpn: { dir: '/home/alice/github/vpn-project', agents: [] },
  mctl: { dir: '/home/alice/github/alice-mission-control', agents: [] },
  books: { dir: '/home/alice/.openclaw/workspace', agents: [] },
  'pki-ca-admin': { dir: '/home/alice/github/pki-ca-admin', agents: [] },
};

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_FILE = path.join(__dirname, 'projects.json');

// Load persisted projects or fall back to defaults
function loadProjects() {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.warn('Failed to load projects.json, using defaults:', e.message);
  }
  return { ...DEFAULT_PROJECTS };
}

function saveProjects(projects) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

const PROJECTS = loadProjects();

// Check which directories actually exist and which have .claude/agents
function getAvailableAgents(projectDir) {
  try {
    const agentsDir = path.join(projectDir, '.claude', 'agents');
    
    if (!fs.existsSync(agentsDir)) {
      return [];
    }
    
    return fs.readdirSync(agentsDir)
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace('.md', ''));
  } catch (error) {
    console.log(`Error reading agents for ${projectDir}:`, error.message);
    return [];
  }
}

// Validate and enrich project config
function validateProjects() {
  const validProjects = {};
  
  for (const [id, config] of Object.entries(PROJECTS)) {
    if (fs.existsSync(config.dir)) {
      const availableAgents = getAvailableAgents(config.dir);
      validProjects[id] = {
        ...config,
        // Use available agents from .claude/agents/, fallback to config
        agents: availableAgents.length > 0 ? availableAgents : config.agents
      };
    } else {
      console.warn(`Project directory not found: ${config.dir} (skipping ${id})`);
    }
  }
  
  return validProjects;
}

function addProject(id, dir) {
  PROJECTS[id] = { dir, agents: [] };
  const availableAgents = getAvailableAgents(dir);
  PROJECTS[id].agents = availableAgents.length > 0 ? availableAgents : [];
  // Persist so it survives restarts
  saveProjects(PROJECTS);
  return { id, dir, agents: PROJECTS[id].agents };
}

export { PROJECTS, validateProjects, addProject };