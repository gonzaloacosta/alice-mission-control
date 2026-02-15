import { useStore } from '../../store';
import { STATE_COLORS } from '../../types';

export function RightPanel() {
  const agents = useStore(s => s.agents);
  const selectedAgentId = useStore(s => s.selectedAgentId);
  const selectAgent = useStore(s => s.selectAgent);

  const agent = agents.find(a => a.id === selectedAgentId);

  if (!agent) return null;

  return (
    <div className="fixed top-16 right-3 z-20 w-72 rounded-lg overflow-hidden"
         style={{ background: 'rgba(8,12,28,0.92)', border: '1px solid rgba(0,240,255,0.12)', backdropFilter: 'blur(16px)' }}>

      {/* Header */}
      <div className="p-4 border-b border-cyan-900/20 flex justify-between items-center">
        <div>
          <div className="font-orbitron text-xs tracking-widest" style={{ color: STATE_COLORS[agent.state] }}>
            {agent.name}
          </div>
          <div className="text-[9px] text-gray-600 mt-0.5">{agent.id}</div>
        </div>
        <button
          onClick={() => selectAgent(null)}
          className="w-7 h-7 border border-cyan-900/30 rounded text-gray-500 hover:text-cyan-400 hover:border-cyan-500/50 transition-all flex items-center justify-center text-sm"
        >✕</button>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-3">
        <Row label="STATUS">
          <span className="font-orbitron text-xs px-2 py-0.5 rounded"
                style={{ background: `${STATE_COLORS[agent.state]}15`, color: STATE_COLORS[agent.state], border: `1px solid ${STATE_COLORS[agent.state]}30` }}>
            {agent.state.toUpperCase()}
          </span>
        </Row>
        <Row label="TYPE"><span className="text-gray-300 text-xs">{agent.type}</span></Row>
        <Row label="CLUSTER"><span className="text-gray-300 text-xs">{agent.cluster}</span></Row>

        {/* Load bar */}
        <div>
          <Row label="LOAD"><span className="font-orbitron text-xs" style={{ color: agent.load > 0.8 ? '#ff3355' : agent.load > 0.6 ? '#ffcc00' : '#00ff88' }}>{Math.round(agent.load * 100)}%</span></Row>
          <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,240,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{
              width: `${agent.load * 100}%`,
              background: agent.load > 0.8 ? '#ff3355' : agent.load > 0.6 ? '#ffcc00' : '#00ff88',
            }} />
          </div>
        </div>

        <Row label="LATENCY">
          <span className="font-orbitron text-xs" style={{ color: agent.latencyMs > 100 ? '#ffcc00' : '#00f0ff' }}>
            {Math.round(agent.latencyMs)}ms
          </span>
        </Row>
        <Row label="THROUGHPUT">
          <span className="font-orbitron text-xs text-blue-400">{Math.round(agent.throughput)}/s</span>
        </Row>
        <Row label="POSITION">
          <span className="text-[10px] text-gray-500">
            [{agent.x.toFixed(1)}, {agent.y.toFixed(1)}, {agent.z.toFixed(1)}]
          </span>
        </Row>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[9px] text-gray-600 tracking-widest">{label}</span>
      {children}
    </div>
  );
}
