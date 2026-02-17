import { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '../../store';
import { getPhase, PHASE_LABELS } from '../../types';

interface ApiProject {
  id: string;
  name: string;
  dir: string;
  agents: string[];
}

const API_BASE = import.meta.env.VITE_API_URL || '';

export function ProjectDetail() {
  const projects = useStore(s => s.projects);
  const focusedId = useStore(s => s.focusedProjectId);
  const isChatOpen = useStore(s => s.isChatOpen);
  const unfocusProject = useStore(s => s.unfocusProject);
  const openChat = useStore(s => s.openChat);
  const setSelectedAgent = useStore(s => s.setSelectedAgent);
  const [height, setHeight] = useState(85);
  const [apiAgents, setApiAgents] = useState<string[]>([]);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  const project = projects.find(p => p.id === focusedId);

  // Fetch real agents from API
  useEffect(() => {
    if (!focusedId) return;
    fetch(`${API_BASE}/api/v1/projects`)
      .then(r => r.json())
      .then(data => {
        const p = data.projects?.find((p: ApiProject) => p.id === focusedId);
        setApiAgents(p?.agents || []);
      })
      .catch(() => setApiAgents([]));
  }, [focusedId]);

  const onDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startH: height };
    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const deltaVh = ((dragRef.current.startY - ev.clientY) / window.innerHeight) * 100;
      setHeight(Math.max(20, Math.min(80, dragRef.current.startH + deltaVh)));
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [height]);

  const handleAgentClick = (agentName: string | null) => {
    setSelectedAgent(agentName);
    openChat();
  };

  if (!project || isChatOpen) return null;

  const phase = getPhase(project.progress);

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 z-20 overflow-hidden flex flex-col"
         style={{ background: 'rgba(8,12,28,0.96)', backdropFilter: 'blur(20px)' }}>

      {/* Header */}
      <div className="px-5 py-2 flex justify-between items-center"
           style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex-shrink-0"
               style={{ background: `${project.color}20`, border: `2px solid ${project.color}40`, boxShadow: `0 0 12px ${project.color}20` }} />
          <div>
            <h2 className="font-orbitron text-sm tracking-widest" style={{ color: project.color }}>{project.name}</h2>
            <div className="text-[10px] text-gray-500 mt-0.5">{project.description}</div>
          </div>
        </div>
        <button onClick={unfocusProject}
          className="px-3 py-1.5 border rounded-lg flex items-center justify-center text-[#00f0ff] hover:text-white text-sm font-mono border-[#00f0ff]/30 hover:border-[#00f0ff]/60 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 transition-all">
          ✕ Close
        </button>
      </div>

      {/* Body */}
      <div className="px-5 pb-5 overflow-y-auto flex-1">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <StatBox label="VERSION" value={project.version} color={project.color} />
          <StatBox label="STATUS" value={project.status.toUpperCase()} color={project.status === 'orbiting' ? '#00ff88' : '#ffcc00'} />
          <StatBox label="TASKS" value={`${project.tasks.done}/${project.tasks.total}`} color={project.color} />
          <StatBox label="PHASE" value={PHASE_LABELS[phase]} color={project.color} />
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[9px] text-gray-600 tracking-widest mb-1">
            <span>EVOLUTION</span>
            <span className="font-orbitron" style={{ color: project.color }}>{Math.round(project.progress * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,240,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${project.progress * 100}%`, background: `linear-gradient(90deg, ${project.color}80, ${project.color})` }} />
          </div>
        </div>

        {/* Links */}
        {(project.notionUrl || project.repoUrl) && (
          <div className="flex gap-2 mb-4">
            {project.notionUrl && (
              <a href={project.notionUrl} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] tracking-wider transition-all hover:opacity-80"
                 style={{ background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.15)', color: '#a0b0c0' }}>
                📋 Notion
              </a>
            )}
            {project.repoUrl && (
              <a href={project.repoUrl} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] tracking-wider transition-all hover:opacity-80"
                 style={{ background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.15)', color: '#a0b0c0' }}>
                ⚙️ GitHub
              </a>
            )}
          </div>
        )}

        {/* Agents — clickable to open chat */}
        <div className="text-[9px] text-gray-600 tracking-[2px] mb-3">AGENTS — TAP TO CHAT</div>
        <div className="space-y-2">
          {/* Default agent */}
          <button
            onClick={() => handleAgentClick(null)}
            className="w-full text-left p-3 rounded-lg border transition-all hover:border-[#00f0ff]/40 group"
            style={{ background: 'rgba(0,240,255,0.04)', borderColor: 'rgba(0,240,255,0.12)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                     style={{ background: `${project.color}15`, border: `1px solid ${project.color}30` }}>
                  ⚡
                </div>
                <div>
                  <span className="text-xs text-gray-300 group-hover:text-[#00f0ff] transition-colors">Default Agent</span>
                  <div className="text-[10px] text-gray-600">General project assistant</div>
                </div>
              </div>
              <span className="text-[10px] text-[#00f0ff]/50 group-hover:text-[#00f0ff] transition-colors">CHAT →</span>
            </div>
          </button>

          {/* Named agents from project data */}
          {project.agents.map(agent => {
            const isApiAgent = apiAgents.includes(agent.name.toLowerCase());
            return (
              <button
                key={agent.id}
                onClick={() => handleAgentClick(isApiAgent ? agent.name.toLowerCase() : null)}
                className="w-full text-left p-3 rounded-lg border transition-all hover:border-[#00f0ff]/40 group"
                style={{ background: 'rgba(0,240,255,0.04)', borderColor: 'rgba(0,240,255,0.12)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                         style={{ background: agent.state === 'active' ? '#00ff88' : '#3a4a5a',
                                  boxShadow: agent.state === 'active' ? '0 0 6px #00ff88' : 'none' }} />
                    <div>
                      <span className="text-xs text-gray-300 group-hover:text-[#00f0ff] transition-colors">{agent.name}</span>
                      <span className="text-[9px] ml-2 px-1.5 py-0 rounded"
                            style={{ background: agent.state === 'active' ? '#00ff8815' : 'transparent',
                                     color: agent.state === 'active' ? '#00ff88' : '#5a6a7a',
                                     border: `1px solid ${agent.state === 'active' ? '#00ff8830' : '#5a6a7a20'}` }}>
                        {agent.role}
                      </span>
                      <div className="text-[10px] text-gray-600 mt-0.5">{agent.task}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#00f0ff]/50 group-hover:text-[#00f0ff] transition-colors">CHAT →</span>
                </div>
                {/* Energy bar */}
                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,240,255,0.04)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${agent.contribution * 100}%`, background: agent.state === 'active' ? project.color : '#3a4a5a' }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.08)' }}>
      <div className="text-[8px] text-gray-600 tracking-widest">{label}</div>
      <div className="font-orbitron text-[11px] mt-0.5" style={{ color }}>{value}</div>
    </div>
  );
}
