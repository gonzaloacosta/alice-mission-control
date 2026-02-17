import { create } from 'zustand';
import type { Project, SystemEvent } from '../types';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: number;
  sessionId?: string;
}

interface AppState {
  projects: Project[];
  events: SystemEvent[];
  selectedProjectId: string | null;
  quality: 'low' | 'medium' | 'high';
  paused: boolean;
  coreName: string;
  creatorName: string;
  
  // Chat feature state
  focusedProjectId: string | null;
  isChatOpen: boolean;
  selectedAgent: string | null;
  chatMessages: Record<string, ChatMessage[]>;
  isStreaming: boolean;
  currentSessionId: string | null;

  init: () => void;
  tick: () => void;
  selectProject: (id: string | null) => void;
  setQuality: (q: 'low' | 'medium' | 'high') => void;
  togglePause: () => void;
  
  // Chat actions
  focusProject: (id: string | null) => void;
  openChat: () => void;
  closeChat: () => void;
  unfocusProject: () => void;
  setSelectedAgent: (agent: string | null) => void;
  addChatMessage: (projectId: string, message: ChatMessage) => void;
  setStreaming: (streaming: boolean) => void;
  setCurrentSession: (sessionId: string | null) => void;
}

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'cid',
    name: 'CID',
    description: 'Auth Proxy — Identity & Access',
    color: '#00ff88',
    emissiveColor: '#00ff88',
    progress: 0.85,
    version: 'v0.1.0',
    status: 'orbiting',
    orbitRadius: 14,
    orbitSpeed: 0.06,
    size: 1.8,
    startAngle: 0,
    tasks: { done: 17, total: 20 },
    agents: [
      { id: 'cid-backend', name: 'Backend', role: 'Go Proxy & Lambda', state: 'active', task: 'JWT auth & DynamoDB', contribution: 0.8 },
      { id: 'cid-devops', name: 'DevOps', role: 'Infra & CI/CD', state: 'active', task: 'Terraform & Helm', contribution: 0.7 },
      { id: 'cid-devsecops', name: 'DevSecOps', role: 'Security', state: 'idle', task: 'Dependency scanning', contribution: 0.3 },
      { id: 'cid-frontend', name: 'Frontend', role: 'React UI', state: 'active', task: 'Admin dashboard', contribution: 0.6 },
      { id: 'cid-qa', name: 'QA', role: 'Testing', state: 'idle', task: 'Integration tests', contribution: 0.4 },
    ],
    repoUrl: 'https://github.com/gonzaloacosta/cid',
    notionUrl: 'https://www.notion.so/CID-v2-Task-Board-cb6113fb15444eaf9c5759a66335a55f',
  },
  {
    id: 'vpn',
    name: 'VPN',
    description: 'Shield Infrastructure — WireGuard',
    color: '#4488ff',
    emissiveColor: '#4488ff',
    progress: 0.60,
    version: 'v0.0.1',
    status: 'building',
    orbitRadius: 24,
    orbitSpeed: 0.04,
    size: 2.2,
    startAngle: 2.1,
    tasks: { done: 6, total: 10 },
    agents: [
      { id: 'vpn-infra', name: 'Infra', role: 'WireGuard & Caddy', state: 'active', task: 'VPN maintenance', contribution: 0.7 },
    ],
    notionUrl: 'https://www.notion.so/VPN-Domain-3086ba83421981b5928ed8f84c34ee76',
  },
  {
    id: 'mctl',
    name: 'MISSION CTRL',
    description: 'Dashboard — Visualization Hub',
    color: '#00f0ff',
    emissiveColor: '#00f0ff',
    progress: 0.45,
    version: 'v0.1.0',
    status: 'building',
    orbitRadius: 36,
    orbitSpeed: 0.025,
    size: 2.0,
    startAngle: 4.2,
    tasks: { done: 5, total: 12 },
    agents: [
      { id: 'mc-fullstack', name: 'Fullstack', role: 'React & Three.js', state: 'active', task: 'Solar system UI', contribution: 0.8 },
    ],
    notionUrl: 'https://www.notion.so/Agent-Mission-Control-3086ba83421981778177b6e3c524f22fb794',
  },
  {
    id: 'books',
    name: 'KNOWLEDGE',
    description: 'Learning Library — Books & Research',
    color: '#aa44ff',
    emissiveColor: '#aa44ff',
    progress: 1.0,
    version: 'v1.0.0',
    status: 'orbiting',
    orbitRadius: 46,
    orbitSpeed: 0.015,
    size: 1.4,
    startAngle: 5.5,
    tasks: { done: 5, total: 5 },
    agents: [
      { id: 'books-cur', name: 'Curator', role: 'Research', state: 'idle', task: 'All books catalogued', contribution: 0.3 },
    ],
    notionUrl: 'https://www.notion.so/Lecturas-y-m-s-9bc028199f164135b4f2029c4c36ad07',
  },
];

const MESSAGES = {
  info: ['Task completed', 'Build passing', 'Tests green', 'Deployed OK', 'Cache refreshed'],
  warning: ['High latency', 'Memory pressure', 'Cert expiring soon', 'Rate limit near'],
  error: ['Build failed', 'Connection lost', 'Auth error', 'Timeout exceeded'],
  critical: ['System unreachable', 'Data issue', 'Cascade failure'],
};

export const useStore = create<AppState>((set, get) => ({
  projects: [],
  events: [],
  selectedProjectId: null,
  quality: 'high',
  paused: false,
  coreName: import.meta.env.VITE_CORE_NAME || 'ALICE',
  creatorName: import.meta.env.VITE_CREATOR_NAME || 'Gonzalo',
  
  // Chat feature state
  focusedProjectId: null,
  isChatOpen: false,
  selectedAgent: null,
  chatMessages: {},
  isStreaming: false,
  currentSessionId: null,

  init: () => {
    set({ projects: INITIAL_PROJECTS.map(p => ({ ...p })) });
  },

  tick: () => {
    const { projects, paused } = get();
    if (paused) return;

    // Mutate agent states slightly
    const updated = projects.map(p => ({
      ...p,
      agents: p.agents.map(a => ({
        ...a,
        contribution: Math.max(0, Math.min(1, a.contribution + (Math.random() - 0.5) * 0.05)),
      })),
    }));

    // Generate event
    const proj = updated[Math.floor(Math.random() * updated.length)];
    const agent = proj.agents[Math.floor(Math.random() * proj.agents.length)];
    const severities = ['info', 'info', 'info', 'info', 'warning', 'error'] as const;
    const sev = severities[Math.floor(Math.random() * severities.length)];
    const msgs = MESSAGES[sev === 'critical' ? 'error' : sev];

    const event: SystemEvent = {
      id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: Date.now(),
      severity: sev,
      projectId: proj.id,
      agentName: agent.name,
      message: msgs[Math.floor(Math.random() * msgs.length)],
    };

    set({ projects: updated, events: [event, ...get().events].slice(0, 80) });
  },

  selectProject: (id) => set({ selectedProjectId: id }),
  setQuality: (q) => set({ quality: q }),
  togglePause: () => set(s => ({ paused: !s.paused })),
  
  // Chat actions
  focusProject: (id) => set({ focusedProjectId: id, selectedProjectId: id }),
  openChat: () => set({ isChatOpen: true }),
  closeChat: () => set({ 
    isChatOpen: false, 
    selectedAgent: null,
    isStreaming: false,
    currentSessionId: null 
  }),
  unfocusProject: () => set({
    focusedProjectId: null,
    selectedProjectId: null,
    isChatOpen: false,
    selectedAgent: null,
    isStreaming: false,
    currentSessionId: null
  }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  addChatMessage: (chatKey, message) => set(state => {
    const existing = state.chatMessages[chatKey] || [];
    const idx = existing.findIndex(m => m.id === message.id);
    if (idx >= 0) {
      const updated = [...existing];
      updated[idx] = message;
      return { chatMessages: { ...state.chatMessages, [chatKey]: updated } };
    }
    return { chatMessages: { ...state.chatMessages, [chatKey]: [...existing, message] } };
  }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),
}));
