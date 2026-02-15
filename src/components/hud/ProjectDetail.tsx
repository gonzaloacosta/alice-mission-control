import { useState, useRef, useCallback } from 'react';
import { useStore } from '../../store';
import { getPhase, PHASE_LABELS } from '../../types';

export function ProjectDetail() {
  const projects = useStore(s => s.projects);
  const selectedId = useStore(s => s.selectedProjectId);
  const selectProject = useStore(s => s.selectProject);
  const [height, setHeight] = useState(42); // vh
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  const project = projects.find(p => p.id === selectedId);

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

  if (!project) return null;

  const phase = getPhase(project.progress);

  return (
    <div className="fixed left-0 right-0 z-20 rounded-t-2xl overflow-hidden transition-[max-height] duration-200"
         style={{ bottom: '64px', maxHeight: `${height}vh`, background: 'rgba(8,12,28,0.94)', borderTop: `1px solid ${project.color}30`, backdropFilter: 'blur(20px)' }}>

      {/* Drag handle */}
      <div className="flex justify-center pt-2 pb-1 cursor-ns-resize touch-none" onPointerDown={onDragStart}>
        <div className="w-10 h-1 rounded-full" style={{ background: `${project.color}30` }} />
      </div>

      {/* Header */}
      <div className="px-6 py-2 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: `${project.color}20`, border: `2px solid ${project.color}40`, boxShadow: `0 0 12px ${project.color}20` }} />
          <div>
            <h2 className="font-orbitron text-sm tracking-widest" style={{ color: project.color }}>{project.name}</h2>
            <div className="text-[10px] text-gray-500 mt-0.5">{project.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Resize presets */}
          <button onClick={() => setHeight(25)} className="text-[9px] text-gray-600 hover:text-cyan-400 px-1.5 py-0.5 border rounded transition-all"
                  style={{ borderColor: height <= 26 ? 'rgba(0,240,255,0.3)' : 'rgba(0,240,255,0.08)', color: height <= 26 ? '#00f0ff' : undefined }}>SM</button>
          <button onClick={() => setHeight(42)} className="text-[9px] text-gray-600 hover:text-cyan-400 px-1.5 py-0.5 border rounded transition-all"
                  style={{ borderColor: height > 26 && height < 65 ? 'rgba(0,240,255,0.3)' : 'rgba(0,240,255,0.08)', color: height > 26 && height < 65 ? '#00f0ff' : undefined }}>MD</button>
          <button onClick={() => setHeight(75)} className="text-[9px] text-gray-600 hover:text-cyan-400 px-1.5 py-0.5 border rounded transition-all"
                  style={{ borderColor: height >= 65 ? 'rgba(0,240,255,0.3)' : 'rgba(0,240,255,0.08)', color: height >= 65 ? '#00f0ff' : undefined }}>LG</button>
          <button onClick={() => selectProject(null)}
            className="w-8 h-8 border rounded flex items-center justify-center text-gray-500 hover:text-cyan-400 transition-all ml-2"
            style={{ borderColor: 'rgba(0,240,255,0.15)' }}>✕</button>
        </div>
      </div>

      {/* Body — scrollable */}
      <div className="px-6 pb-5 overflow-y-auto" style={{ maxHeight: `calc(${height}vh - 90px)` }}>
        <div className="flex gap-8 flex-wrap">
          {/* Stats */}
          <div className="flex-1 min-w-[200px] space-y-2">
            <Row label="VERSION" value={project.version} color={project.color} />
            <Row label="STATUS" value={project.status.toUpperCase()} color={project.status === 'orbiting' ? '#00ff88' : '#ffcc00'} />
            <Row label="TASKS" value={`${project.tasks.done} / ${project.tasks.total}`} color={project.color} />
            <Row label="PHASE" value={PHASE_LABELS[phase]} color={project.color} />

            {/* Links */}
            {(project.notionUrl || project.repoUrl) && (
              <div className="flex gap-2 pt-2">
                {project.notionUrl && (
                  <a href={project.notionUrl} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] tracking-wider transition-all hover:opacity-80"
                     style={{ background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.15)', color: '#a0b0c0', textDecoration: 'none' }}>
                    <span style={{ fontSize: '12px' }}>📋</span> Notion
                  </a>
                )}
                {project.repoUrl && (
                  <a href={project.repoUrl} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] tracking-wider transition-all hover:opacity-80"
                     style={{ background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.15)', color: '#a0b0c0', textDecoration: 'none' }}>
                    <span style={{ fontSize: '12px' }}>⚙️</span> GitHub
                  </a>
                )}
              </div>
            )}

            {/* Progress bar */}
            <div className="pt-1">
              <div className="flex justify-between text-[9px] text-gray-600 tracking-widest mb-1">
                <span>EVOLUTION</span>
                <span className="font-orbitron" style={{ color: project.color }}>{Math.round(project.progress * 100)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,240,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${project.progress * 100}%`, background: `linear-gradient(90deg, ${project.color}80, ${project.color})` }} />
              </div>
            </div>
          </div>

          {/* Agents */}
          <div className="flex-1 min-w-[200px]">
            <div className="text-[9px] text-gray-600 tracking-[2px] mb-3">ENERGY SATELLITES</div>
            <div className="space-y-3">
              {project.agents.map(agent => (
                <div key={agent.id} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                       style={{ background: agent.state === 'active' ? '#00ff88' : '#3a4a5a', boxShadow: agent.state === 'active' ? '0 0 6px #00ff88' : 'none' }} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-300">{agent.name}</span>
                      <span className="text-[9px] px-1.5 py-0 rounded" style={{
                        background: agent.state === 'active' ? '#00ff8815' : 'transparent',
                        color: agent.state === 'active' ? '#00ff88' : '#5a6a7a',
                        border: `1px solid ${agent.state === 'active' ? '#00ff8830' : '#5a6a7a20'}`,
                      }}>{agent.role}</span>
                    </div>
                    <div className="text-[10px] text-gray-600 mt-0.5">{agent.task}</div>
                    {/* Energy bar */}
                    <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,240,255,0.04)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${agent.contribution * 100}%`, background: agent.state === 'active' ? project.color : '#3a4a5a' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: 'rgba(0,240,255,0.04)' }}>
      <span className="text-[9px] text-gray-600 tracking-widest">{label}</span>
      <span className="font-orbitron text-xs" style={{ color }}>{value}</span>
    </div>
  );
}
