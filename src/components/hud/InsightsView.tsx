import { useStore } from '../../store';
import { getPhase, PHASE_LABELS } from '../../types';

export function InsightsView() {
  const projects = useStore(s => s.projects);

  const totalTasks = projects.reduce((s, p) => s + p.tasks.total, 0);
  const doneTasks = projects.reduce((s, p) => s + p.tasks.done, 0);
  const totalAgents = projects.reduce((s, p) => s + p.agents.length, 0);
  const activeAgents = projects.reduce((s, p) => s + p.agents.filter(a => a.state === 'active').length, 0);
  const avgProgress = projects.reduce((s, p) => s + p.progress, 0) / projects.length;

  return (
    <div className="fixed top-14 left-0 right-0 bottom-16 z-25 overflow-y-auto"
         style={{ background: 'rgba(8,12,28,0.96)', backdropFilter: 'blur(20px)' }}>
      <div className="px-4 py-3 border-b sticky top-0 z-10" style={{ borderColor: 'rgba(0,240,255,0.08)', background: 'rgba(8,12,28,0.98)' }}>
        <span className="text-[10px] text-gray-600 tracking-[3px] font-orbitron">SYSTEM INSIGHTS</span>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <Card label="TOTAL TASKS" value={`${doneTasks}/${totalTasks}`} color="#00f0ff" sub={`${Math.round(doneTasks/totalTasks*100)}% complete`} />
        <Card label="AGENTS" value={`${activeAgents}/${totalAgents}`} color="#00ff88" sub={`${activeAgents} active`} />
        <Card label="AVG PROGRESS" value={`${Math.round(avgProgress*100)}%`} color="#4488ff" sub="across all projects" />
        <Card label="PROJECTS" value={projects.length.toString()} color="#aa44ff" sub={`${projects.filter(p=>p.status==='building').length} building`} />
      </div>

      {/* Per-project breakdown */}
      <div className="px-4 pb-4">
        <div className="text-[9px] text-gray-600 tracking-[2px] font-orbitron mb-3">PROJECT BREAKDOWN</div>
        {projects.map(p => {
          const phase = getPhase(p.progress);
          return (
            <div key={p.id} className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(0,240,255,0.02)', border: `1px solid ${p.color}15` }}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-orbitron text-xs tracking-wider" style={{ color: p.color }}>{p.name}</span>
                <span className="text-[9px]" style={{ color: p.color }}>{PHASE_LABELS[phase]}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(0,240,255,0.06)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${p.progress*100}%`, background: p.color }} />
              </div>
              <div className="flex justify-between text-[9px] text-gray-600">
                <span>Tasks: {p.tasks.done}/{p.tasks.total}</span>
                <span>Agents: {p.agents.filter(a=>a.state==='active').length}/{p.agents.length}</span>
                <span>{p.version}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Card({ label, value, color, sub }: { label: string; value: string; color: string; sub: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: 'rgba(0,240,255,0.03)', border: '1px solid rgba(0,240,255,0.08)' }}>
      <div className="text-[8px] text-gray-600 tracking-widest mb-1">{label}</div>
      <div className="font-orbitron font-bold text-xl" style={{ color, textShadow: `0 0 10px ${color}30` }}>{value}</div>
      <div className="text-[9px] text-gray-600 mt-0.5">{sub}</div>
    </div>
  );
}
