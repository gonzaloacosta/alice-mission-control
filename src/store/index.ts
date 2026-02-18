import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, SystemEvent } from '../types';
import type { View } from '../components/layout/Sidebar';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: number;
  sessionId?: string;
}

interface ChatTab {
  projectId: string;
  agentName: string | null;
}

interface AppState {
  projects: Project[];
  events: SystemEvent[];
  selectedProjectId: string | null;
  quality: 'low' | 'medium' | 'high';
  paused: boolean;
  coreName: string;
  creatorName: string;
  
  // UI state
  activeView: View;
  
  // Chat feature state
  focusedProjectId: string | null;
  openChats: ChatTab[];
  activeChatKey: string | null;
  chatMessages: Record<string, ChatMessage[]>;
  streamingChats: Record<string, boolean>;
  currentSessionId: string | null;

  init: () => void;
  tick: () => void;
  addProject: (project: Project) => void;
  selectProject: (id: string | null) => void;
  setQuality: (q: 'low' | 'medium' | 'high') => void;
  togglePause: () => void;
  
  // UI actions
  setActiveView: (view: View) => void;
  
  // Chat actions
  focusProject: (id: string | null) => void;
  openChatTab: (projectId: string, agentName: string | null) => void;
  closeChatTab: (key: string) => void;
  unfocusProject: () => void;
  addChatMessage: (chatKey: string, message: ChatMessage) => void;
  setChatMessages: (chatKey: string, messages: ChatMessage[]) => void;
  setStreamingForChat: (chatKey: string, streaming: boolean) => void;
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
    notionUrl: 'https://www.notion.so/3066ba83421981a6b656c2642befb009',
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
  {
    id: 'pki-ca-admin',
    name: 'PKI-CA-ADMIN',
    description: 'Certificate Authority Administration — Multi-tier PKI & mTLS',
    color: '#00f5d4',
    emissiveColor: '#00f5d4',
    progress: 0.0,
    version: 'v0.0.1',
    status: 'building',
    orbitRadius: 54,
    orbitSpeed: 0.018,
    size: 2.2,
    startAngle: 1.7,
    tasks: { done: 0, total: 5 },
    agents: [
      { id: 'pki-backend', name: 'Backend', role: 'Backend API', state: 'idle', task: 'Awaiting tasks', contribution: 0 },
      { id: 'pki-frontend', name: 'Frontend', role: 'Frontend App', state: 'idle', task: 'Awaiting tasks', contribution: 0 },
      { id: 'pki-devops', name: 'DevOps', role: 'Infra & CI/CD', state: 'idle', task: 'Awaiting tasks', contribution: 0 },
      { id: 'pki-devsecops', name: 'DevSecOps', role: 'Security', state: 'idle', task: 'Awaiting tasks', contribution: 0 },
      { id: 'pki-qa', name: 'QA', role: 'Testing', state: 'idle', task: 'Awaiting tasks', contribution: 0 },
      { id: 'pki-reviewer', name: 'Reviewer', role: 'Code Review', state: 'idle', task: 'Awaiting tasks', contribution: 0 },
      { id: 'pki-planner', name: 'Planner', role: 'Architecture', state: 'idle', task: 'Awaiting tasks', contribution: 0 },
    ],
    repoUrl: 'https://github.com/gonzaloacosta/pki-ca-admin',
  },
];

const MESSAGES = {
  info: ['Task completed', 'Build passing', 'Tests green', 'Deployed OK', 'Cache refreshed'],
  warning: ['High latency', 'Memory pressure', 'Cert expiring soon', 'Rate limit near'],
  error: ['Build failed', 'Connection lost', 'Auth error', 'Timeout exceeded'],
  critical: ['System unreachable', 'Data issue', 'Cascade failure'],
};

export const useStore = create<AppState>()(persist((set, get) => ({
  projects: [],
  events: [],
  selectedProjectId: null,
  quality: 'high',
  paused: false,
  coreName: import.meta.env.VITE_CORE_NAME || 'ALICE',
  creatorName: import.meta.env.VITE_CREATOR_NAME || 'Gonzalo',
  
  // UI state
  activeView: 'overview' as View,
  
  // Chat feature state
  focusedProjectId: null,
  openChats: [],
  activeChatKey: null,
  chatMessages: {},
  streamingChats: {},
  currentSessionId: null,

  init: () => {
    set({ projects: INITIAL_PROJECTS.map(p => ({ ...p })) });
  },

  addProject: (project) => set(state => ({
    projects: [...state.projects, project],
  })),

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
  
  // UI actions
  setActiveView: (view) => set({ activeView: view }),
  
  // Chat actions
  focusProject: (id) => set({ focusedProjectId: id, selectedProjectId: id }),
  openChatTab: (projectId, agentName) => set(state => {
    const chatKey = `${projectId}:${agentName || 'default'}`;
    const existingIndex = state.openChats.findIndex(
      chat => chat.projectId === projectId && chat.agentName === agentName
    );
    
    let newOpenChats = [...state.openChats];
    
    if (existingIndex === -1) {
      // Add new chat tab
      newOpenChats.push({ projectId, agentName });
    }
    
    return {
      openChats: newOpenChats,
      activeChatKey: chatKey,
      activeView: 'chat' as View,
    };
  }),
  closeChatTab: (key) => set(state => {
    const [projectId, agentName] = key.split(':');
    const actualAgentName = agentName === 'default' ? null : agentName;
    
    const newOpenChats = state.openChats.filter(
      chat => !(chat.projectId === projectId && chat.agentName === actualAgentName)
    );
    
    let newActiveChatKey = state.activeChatKey;
    
    // If we're closing the active tab, switch to another tab
    if (state.activeChatKey === key) {
      if (newOpenChats.length > 0) {
        const nextChat = newOpenChats[newOpenChats.length - 1];
        newActiveChatKey = `${nextChat.projectId}:${nextChat.agentName || 'default'}`;
      } else {
        newActiveChatKey = null;
      }
    }
    
    // Clean up streaming state for closed tab
    const newStreamingChats = { ...state.streamingChats };
    delete newStreamingChats[key];
    
    return {
      openChats: newOpenChats,
      activeChatKey: newActiveChatKey,
      streamingChats: newStreamingChats,
    };
  }),
  unfocusProject: () => set({
    focusedProjectId: null,
    selectedProjectId: null,
  }),
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
  setChatMessages: (chatKey, messages) => set(state => ({
    chatMessages: { ...state.chatMessages, [chatKey]: messages }
  })),
  setStreamingForChat: (chatKey, streaming) => set(state => ({
    streamingChats: { ...state.streamingChats, [chatKey]: streaming }
  })),
  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),
}), {
  name: 'alice-mission-control',
  partialize: (state) => ({
    quality: state.quality,
  }),
}));
