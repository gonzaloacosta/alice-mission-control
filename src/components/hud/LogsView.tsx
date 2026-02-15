import { useStore } from '../../store';

const SEV = { info: '#5a6a7a', warning: '#ffcc00', error: '#ff3355', critical: '#ff3355' };

export function LogsView() {
  const events = useStore(s => s.events);
  const projects = useStore(s => s.projects);
  const getColor = (pid: string) => projects.find(p => p.id === pid)?.color || '#5a6a7a';

  return (
    <div className="fixed top-14 left-0 right-0 bottom-16 z-25 overflow-y-auto"
         style={{ background: 'rgba(8,12,28,0.96)', backdropFilter: 'blur(20px)' }}>
      <div className="px-4 py-3 border-b sticky top-0 z-10" style={{ borderColor: 'rgba(0,240,255,0.08)', background: 'rgba(8,12,28,0.98)' }}>
        <span className="text-[10px] text-gray-600 tracking-[3px] font-orbitron">EVENT LOG</span>
        <span className="text-[10px] text-gray-700 ml-3">{events.length} events</span>
      </div>
      <div className="px-4">
        {events.map(evt => (
          <div key={evt.id} className="flex items-start gap-3 py-2.5 border-b" style={{ borderColor: 'rgba(0,240,255,0.03)' }}>
            <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: SEV[evt.severity], boxShadow: evt.severity !== 'info' ? `0 0 6px ${SEV[evt.severity]}` : 'none' }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-orbitron tracking-wider" style={{ color: getColor(evt.projectId) }}>{evt.projectId.toUpperCase()}</span>
                <span className="text-[9px] text-gray-600">{evt.agentName}</span>
                <span className="text-[9px] text-gray-700 ml-auto">
                  {new Date(evt.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                </span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">{evt.message}</div>
            </div>
          </div>
        ))}
        {events.length === 0 && <div className="text-center text-gray-600 text-xs py-8">No events yet</div>}
      </div>
    </div>
  );
}
