// Project configuration mapping
const PROJECTS = {
  cid: { 
    dir: '/home/alice/github/cid', 
    agents: ['backend', 'devops', 'devsecops', 'frontend', 'qa'] 
  },
  vpn: { 
    dir: '/home/alice/github/vpn-project', 
    agents: [] 
  },
  mctl: { 
    dir: '/home/alice/alice-mission-control', 
    agents: [] 
  },
  books: { 
    dir: '/home/alice/.openclaw/workspace', 
    agents: [] 
  },
};

import fs from 'fs';
import path from 'path';

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

export { PROJECTS, validateProjects };