import { execSync, exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const GITHUB_USER = 'gonzaloacosta';
const TEMPLATE_REPO = 'gonzaloacosta/project-template';
const BASE_DIR = '/home/alice/github';
const GIT_NAME = 'Gonzalo Acosta';
const GIT_EMAIL = 'gonzaloacostapeiro@gmail.com';

// Random colors for new planets
const PLANET_COLORS = [
  '#ff6b35', '#ff3366', '#33ffcc', '#ff9f1c', '#e63946',
  '#06d6a0', '#118ab2', '#ef476f', '#ffd166', '#073b4c',
  '#9b5de5', '#f15bb5', '#00bbf9', '#00f5d4', '#fee440',
];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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
    // If repo already exists, try cloning
    if (e.stderr?.toString().includes('already exists')) {
      steps.push({ step: 'repo_created', success: true, note: 'already existed' });
    } else {
      throw new Error(`Failed to create repo: ${e.stderr?.toString() || e.message}`);
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
    const claudeTemplate = fs.readFileSync(path.join(projectDir, 'CLAUDE.md'), 'utf8');
    const filled = claudeTemplate
      .replace(/\{\{PROJECT_NAME\}\}/g, name)
      .replace(/\{\{PROJECT_DESCRIPTION\}\}/g, idea)
      .replace('<!-- Fill this with the project idea, goals, and scope -->', idea);
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

  // 5. Commit and push
  try {
    execSync(
      `git add -A && git -c user.name="${GIT_NAME}" -c user.email="${GIT_EMAIL}" commit -m "feat: initialize ${name} from project template" && git push origin main`,
      { cwd: projectDir, stdio: 'pipe', timeout: 30000 }
    );
    steps.push({ step: 'pushed', success: true });
  } catch (e) {
    steps.push({ step: 'pushed', success: false, error: e.stderr?.toString() || e.message });
  }

  // 6. Generate planet config
  const color = PLANET_COLORS[Math.floor(Math.random() * PLANET_COLORS.length)];
  const existingProjects = fs.readdirSync(BASE_DIR).filter(d => {
    try { return fs.statSync(path.join(BASE_DIR, d, '.git')).isDirectory(); } catch { return false; }
  });
  const orbitRadius = 14 + (existingProjects.length * 12);

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
    ],
    repoUrl: `https://github.com/${GITHUB_USER}/${slug}`,
  };

  return {
    success: true,
    slug,
    projectDir,
    repoUrl: `https://github.com/${GITHUB_USER}/${slug}`,
    planet,
    steps,
  };
}
