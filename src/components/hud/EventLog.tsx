import { useState } from 'react';
import { useStore } from '../../store';

const SEV = { info: 'var(--muted-foreground)', warning: 'var(--yellow)', error: 'var(--red)', critical: 'var(--red)' };

export function EventLog() {
  const events = useStore(s => s.events);
  const projects = useStore(s => s.projects);
  const [open, setOpen] = useState(false);

  const getColor = (pid: string) => projects.find(p => p.id === pid)?.color || 'var(--muted-foreground)';
  const errorCount = events.filter(e => e.severity === 'error' || e.severity === 'critical').length;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-16 right-3 z-20 flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
          style={{ background: 'rgba(36,40,59,0.88)', border: '1px solid rgba(125,207,255,0.12)', backdropFilter: 'blur(12px)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
          </svg>
          <span className="text-[10px] tracking-wider text-gray-500">LOG</span>
          {errorCount > 0 && (
            <span className="text-[9px] px-1.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--red) 12%, transparent)', color: 'var(--red)', border: '1px solid color-mix(in srgb, var(--red) 18%, transparent)' }}>
              {errorCount}
            </span>
          )}
        </button>
      )}

      {/* Drawer */}
      <div className="fixed top-14 right-0 z-30 h-[calc(100vh-56px)] w-80 transition-transform duration-300"
           style={{
             transform: open ? 'translateX(0)' : 'translateX(100%)',
             background: 'rgba(36,40,59,0.95)',
             borderLeft: '1px solid rgba(125,207,255,0.12)',
             backdropFilter: 'blur(20px)',
           }}>
        {/* Header */}
        <div className="px-4 py-3 flex justify-between items-center border-b" style={{ borderColor: 'rgba(125,207,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-600 tracking-[3px]">EVENT LOG</span>
            <span className="text-[9px] text-gray-700">{events.length}</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-cyan-400 transition-colors text-lg px-1">✕</button>
        </div>

        {/* Events */}
        <div className="overflow-y-auto h-[calc(100%-44px)] px-4 py-1">
          {events.map(evt => (
            <div key={evt.id} className="flex items-start gap-2 py-2 border-b" style={{ borderColor: 'rgba(125,207,255,0.03)' }}>
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: SEV[evt.severity], boxShadow: evt.severity !== 'info' ? `0 0 4px ${SEV[evt.severity]}` : 'none' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-orbitron" style={{ color: getColor(evt.projectId) }}>{evt.projectId.toUpperCase()}</span>
                  <span className="text-[8px] text-gray-600">{evt.agentName}</span>
                  <span className="text-[8px] text-gray-700 ml-auto flex-shrink-0">
                    {new Date(evt.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{evt.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-25" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={() => setOpen(false)} />
      )}
    </>
  );
}
