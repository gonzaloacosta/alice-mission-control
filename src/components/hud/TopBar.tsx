import { useStore } from '../../store';

export function TopBar() {
  const projects = useStore(s => s.projects);
  const paused = useStore(s => s.paused);
  const togglePause = useStore(s => s.togglePause);

  const totalTasks = projects.reduce((s, p) => s + p.tasks.total, 0);
  const doneTasks = projects.reduce((s, p) => s + p.tasks.done, 0);
  const activeAgents = projects.reduce((s, p) => s + p.agents.filter(a => a.state === 'active').length, 0);
  const totalAgents = projects.reduce((s, p) => s + p.agents.length, 0);
  const building = projects.filter(p => p.status === 'building').length;
  const orbiting = projects.filter(p => p.status === 'orbiting').length;

  return (
    <div className="absolute top-0 left-0 right-0 z-20 h-14 flex items-center justify-between px-6"
         style={{ background: 'linear-gradient(180deg, rgba(0,12,24,0.95) 0%, rgba(0,12,24,0.6) 100%)', borderBottom: '1px solid rgba(0,240,255,0.15)', backdropFilter: 'blur(12px)' }}>

      <div className="flex items-center gap-3">
        <h1 className="font-orbitron font-black text-sm tracking-[4px]"
            style={{ background: 'linear-gradient(90deg, #00f0ff, #4488ff, #00f0ff)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'shimmer 3s linear infinite' }}>
          MISSION CONTROL
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <Stat label="PROJECTS" value={projects.length} color="#00f0ff" />
        <Stat label="BUILDING" value={building} color="#ffcc00" />
        <Stat label="IN ORBIT" value={orbiting} color="#00ff88" />
        <Stat label="AGENTS" value={`${activeAgents}/${totalAgents}`} color="#aa44ff" />
        <Stat label="TASKS" value={`${doneTasks}/${totalTasks}`} color="#4488ff" />
        <button onClick={togglePause}
          className="text-[10px] tracking-wider px-3 py-1 border rounded transition-all"
          style={{ borderColor: paused ? '#ff3355' : 'rgba(0,240,255,0.2)', color: paused ? '#ff3355' : '#5a6a7a' }}>
          {paused ? '▶ RESUME' : '⏸ PAUSE'}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="text-center">
      <div className="font-orbitron font-bold text-base" style={{ color, textShadow: `0 0 10px ${color}40` }}>{value}</div>
      <div className="text-[8px] text-gray-600 tracking-widest">{label}</div>
    </div>
  );
}
