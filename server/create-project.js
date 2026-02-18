import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { addProject } from './config.js';

const GITHUB_USER = 'gonzaloacosta';
const TEMPLATE_REPO = 'gonzaloacosta/project-template';
const BASE_DIR = '/home/alice/github';
const GIT_NAME = 'Gonzalo Acosta';
const GIT_EMAIL = 'gonzaloacostapeiro@gmail.com';
const NOTION_PROJECTS_DB = '3066ba83-4219-80a1-afeb-f637fc5a24d6';

// Load Notion API key
let NOTION_KEY = null;
try {
  NOTION_KEY = fs.readFileSync(path.join(process.env.HOME, '.config/notion/api_key'), 'utf8').trim();
} catch { /* Notion integration optional */ }

// Planet colors
const PLANET_COLORS = [
  '#ff6b35', '#ff3366', '#33ffcc', '#ff9f1c', '#e63946',
  '#06d6a0', '#118ab2', '#ef476f', '#ffd166', '#073b4c',
  '#9b5de5', '#f15bb5', '#00bbf9', '#00f5d4', '#fee440',
];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function createNotionPage(name, idea, repoUrl) {
  if (!NOTION_KEY) return { success: false, error: 'No Notion API key configured' };

  try {
    const body = {
      parent: { database_id: NOTION_PROJECTS_DB },
      icon: { type: 'emoji', emoji: '🪐' },
      properties: {
        title: { title: [{ text: { content: name } }] },
      },
      children: [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: { rich_text: [{ text: { content: 'Project Idea' } }] },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ text: { content: idea } }] },
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: { rich_text: [{ text: { content: 'Links' } }] },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: `GitHub: ${repoUrl}`, link: { url: repoUrl } } }],
          },
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: { rich_text: [{ text: { content: 'Status' } }] },
        },
        {
          object: 'block',
          type: 'to_do',
          to_do: { rich_text: [{ text: { content: 'Define MVP scope' } }], checked: false },
        },
        {
          object: 'block',
          type: 'to_do',
          to_do: { rich_text: [{ text: { content: 'Create architecture doc' } }], checked: false },
        },
        {
          object: 'block',
          type: 'to_do',
          to_do: { rich_text: [{ text: { content: 'Set up CI/CD' } }], checked: false },
        },
        {
          object: 'block',
          type: 'to_do',
          to_do: { rich_text: [{ text: { content: 'First working prototype' } }], checked: false },
        },
      ],
    };

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': '2025-09-03',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || `HTTP ${res.status}` };
    }

    return { success: true, pageId: data.id, url: data.url };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function createProject({ name, idea }) {
  const slug = slugify(name);
  const projectDir = path.join(BASE_DIR, slug);
  const steps = [];

  // 1. Create repo from template
  try {
    execSync(
      `gh repo create ${GITHUB_USER}/${slug} --template ${TEMPLATE_REPO} --public --clone`,
      { cwd: BASE_DIR, stdio: 'pipe', timeout: 30000 }
    );
    steps.push({ step: 'repo_created', success: true });
  } catch (e) {
    const stderr = e.stderr?.toString() || '';
    if (stderr.includes('already exists')) {
      steps.push({ step: 'repo_created', success: true, note: 'already existed' });
    } else {
      throw new Error(`Failed to create repo: ${stderr || e.message}`);
    }
  }

  // 2. Configure git
  try {
    execSync(`git config user.name "${GIT_NAME}" && git config user.email "${GIT_EMAIL}"`, {
      cwd: projectDir, stdio: 'pipe',
    });
    steps.push({ step: 'git_configured', success: true });
  } catch (e) {
    steps.push({ step: 'git_configured', success: false, error: e.message });
  }

  // 3. Fill CLAUDE.md with the idea
  try {
    const claudeMd = fs.readFileSync(path.join(projectDir, 'CLAUDE.md'), 'utf8');
    const filled = claudeMd
      .replace(/\{\{PROJECT_NAME\}\}/g, name)
      .replace(/\{\{PROJECT_DESCRIPTION\}\}/g, idea);
    fs.writeFileSync(path.join(projectDir, 'CLAUDE.md'), filled);
    steps.push({ step: 'claude_md_filled', success: true });
  } catch (e) {
    steps.push({ step: 'claude_md_filled', success: false, error: e.message });
  }

  // 4. Fill README.md
  try {
    const readme = fs.readFileSync(path.join(projectDir, 'README.md'), 'utf8');
    const filled = readme
      .replace(/\{\{PROJECT_NAME\}\}/g, name)
      .replace(/\{\{PROJECT_DESCRIPTION\}\}/g, idea);
    fs.writeFileSync(path.join(projectDir, 'README.md'), filled);
    steps.push({ step: 'readme_filled', success: true });
  } catch (e) {
    steps.push({ step: 'readme_filled', success: false, error: e.message });
  }

  // 5. Create Notion project page
  const repoUrl = `https://github.com/${GITHUB_USER}/${slug}`;
  let notionUrl = null;
  try {
    const notion = await createNotionPage(name, idea, repoUrl);
    if (notion.success) {
      notionUrl = notion.url;
      // Update CLAUDE.md with Notion URL
      try {
        const claudeMd = fs.readFileSync(path.join(projectDir, 'CLAUDE.md'), 'utf8');
        fs.writeFileSync(path.join(projectDir, 'CLAUDE.md'),
          claudeMd.replace('- Notion project page: TODO', `- Notion project page: ${notionUrl}`)
        );
      } catch { /* non-critical */ }
      steps.push({ step: 'notion_page_created', success: true, note: notion.url });
    } else {
      steps.push({ step: 'notion_page_created', success: false, error: notion.error });
    }
  } catch (e) {
    steps.push({ step: 'notion_page_created', success: false, error: e.message });
  }

  // 6. Commit and push
  try {
    execSync(
      `git add -A && git -c user.name="${GIT_NAME}" -c user.email="${GIT_EMAIL}" commit -m "feat: initialize ${name} from project template" && git push origin main`,
      { cwd: projectDir, stdio: 'pipe', timeout: 30000 }
    );
    steps.push({ step: 'pushed', success: true });
  } catch (e) {
    steps.push({ step: 'pushed', success: false, error: e.stderr?.toString() || e.message });
  }

  // 7. Register project in server config
  try {
    addProject(slug, projectDir);
    steps.push({ step: 'server_config_updated', success: true });
  } catch (e) {
    steps.push({ step: 'server_config_updated', success: false, error: e.message });
  }

  // 8. Generate planet config
  const color = PLANET_COLORS[Math.floor(Math.random() * PLANET_COLORS.length)];
  const existingProjects = fs.readdirSync(BASE_DIR).filter(d => {
    try { return fs.statSync(path.join(BASE_DIR, d, '.git')).isDirectory(); } catch { return false; }
  });
  const orbitRadius = 14 + (existingProjects.length * 10);

  const planet = {
    id: slug,
    name: name.toUpperCase(),
    description: idea.substring(0, 60),
    color,
    emissiveColor: color,
    progress: 0.0,
    version: 'v0.0.1',
    status: 'building',
    orbitRadius,
    orbitSpeed: 0.03 + Math.random() * 0.03,
    size: 1.6 + Math.random() * 0.8,
    startAngle: Math.random() * Math.PI * 2,
    tasks: { done: 0, total: 5 },
    agents: [
      { id: `${slug}-backend`, name: 'Backend', role: 'Backend API', state: 'idle', task: 'Awaiting tasks', contribution: 0.0 },
      { id: `${slug}-frontend`, name: 'Frontend', role: 'Frontend App', state: 'idle', task: 'Awaiting tasks', contribution: 0.0 },
      { id: `${slug}-devops`, name: 'DevOps', role: 'Infra & CI/CD', state: 'idle', task: 'Awaiting tasks', contribution: 0.0 },
      { id: `${slug}-devsecops`, name: 'DevSecOps', role: 'Security', state: 'idle', task: 'Awaiting tasks', contribution: 0.0 },
      { id: `${slug}-qa`, name: 'QA', role: 'Testing', state: 'idle', task: 'Awaiting tasks', contribution: 0.0 },
      { id: `${slug}-reviewer`, name: 'Reviewer', role: 'Code Review', state: 'idle', task: 'Awaiting tasks', contribution: 0.0 },
      { id: `${slug}-planner`, name: 'Planner', role: 'Architecture', state: 'idle', task: 'Awaiting tasks', contribution: 0.0 },
    ],
    repoUrl,
    notionUrl,
  };

  return {
    success: true,
    slug,
    projectDir,
    repoUrl,
    notionUrl,
    planet,
    steps,
  };
}
