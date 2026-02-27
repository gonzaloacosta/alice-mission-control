export type AgentState = 'idle' | 'active' | 'warning' | 'error' | 'running' | 'recovery';
export type ProjectPhase = 'forming' | 'growing' | 'maturing' | 'ready' | 'launched';

// Legacy exports for compatibility (can be removed later)
export const STATE_COLORS: Record<AgentState, string> = {
  idle: 'var(--muted-foreground)',
  active: 'var(--green)',
  warning: 'var(--yellow)',
  error: 'var(--red)',
  running: 'var(--cyan)',
  recovery: 'var(--neon-orange)'
};

export const STATE_EMISSIVE: Record<AgentState, string> = {
  idle: 'var(--muted-foreground)',
  active: 'var(--green)',
  warning: 'var(--yellow)',
  error: 'var(--red)',
  running: 'var(--cyan)',
  recovery: 'var(--neon-orange)'
};

// Legacy types for compatibility
export interface Agent {
  id: string;
  name: string;
  type: string;
  state: AgentState;
  cluster: string;
  // Additional properties used in legacy code
  x?: number;
  y?: number;
  z?: number;
  load?: number;
  latencyMs?: number;
  throughput?: number;
  parentId?: string;
}

export interface Link {
  id: string;
  source: string;
  target: string;
  type: string;
  // Additional properties used in legacy code
  sourceId?: string;
  targetId?: string;
  status?: string;
  weight?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  emissiveColor: string;
  progress: number;        // 0-1
  version: string;
  status: 'building' | 'orbiting';
  orbitRadius: number;
  orbitSpeed: number;
  size: number;
  startAngle: number;
  tasks: { done: number; total: number };
  agents: ProjectAgent[];
  repoUrl?: string;
  notionUrl?: string;
}

export interface ProjectAgent {
  id: string;
  name: string;
  role: string;
  state: AgentState;
  task: string;
  contribution: number;    // 0-1 energy contribution
}

export interface SystemEvent {
  id: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  projectId: string;
  agentName: string;
  message: string;
  // Additional property used in legacy code
  agentId?: string;
}

export function getPhase(progress: number): ProjectPhase {
  if (progress < 0.2) return 'forming';
  if (progress < 0.5) return 'growing';
  if (progress < 0.75) return 'maturing';
  if (progress < 1.0) return 'ready';
  return 'launched';
}

export const PHASE_LABELS: Record<ProjectPhase, string> = {
  forming: '◇ FORMING',
  growing: '◈ GROWING',
  maturing: '◉ MATURING',
  ready: '● READY',
  launched: '🚀 LAUNCHED',
};
