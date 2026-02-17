export type AgentState = 'idle' | 'active' | 'warning' | 'error';
export type ProjectPhase = 'forming' | 'growing' | 'maturing' | 'ready' | 'launched';

// Legacy exports for compatibility (can be removed later)
export const STATE_COLORS: Record<AgentState, string> = {
  idle: '#5a6a7a',
  active: '#00ff88',
  warning: '#ffaa00',
  error: '#ff4444'
};

export const STATE_EMISSIVE: Record<AgentState, string> = {
  idle: '#5a6a7a',
  active: '#00ff88',
  warning: '#ffaa00',
  error: '#ff4444'
};

// Legacy types for compatibility
export interface Agent {
  id: string;
  name: string;
  type: string;
  state: AgentState;
  cluster: string;
}

export interface Link {
  id: string;
  source: string;
  target: string;
  type: string;
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
