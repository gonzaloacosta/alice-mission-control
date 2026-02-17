import { useStore } from '../../store';

type View = 'projects' | 'insights' | 'logs' | 'settings' | 'terminal';

export function BottomNav({ activeView, onChangeView }: { activeView: View; onChangeView: (v: View) => void }) {
  const projects = useStore(s => s.projects);
  const events = useStore(s => s.events);
  const errorCount = events.filter(e => e.severity === 'error' || e.severity === 'critical').length;

  const items: { id: View; label: string; icon: JSX.Element; badge?: string | number }[] = [
    {
      id: 'projects',
      label: `PROJECTS (${projects.length})`,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" strokeDasharray="4 3"/><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/></svg>,
    },
    {
      id: 'insights',
      label: 'INSIGHTS',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>,
    },
    {
      id: 'logs',
      label: 'LOGS',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>,
      badge: errorCount > 0 ? errorCount : undefined,
    },
    {
      id: 'terminal',
      label: 'TERMINAL',
      icon: <span style={{ fontSize: '20px' }}>🖥️</span>,
    },
    {
      id: 'settings',
      label: 'SETTINGS',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around h-16"
         style={{ background: 'rgba(8,12,28,0.95)', borderTop: '1px solid rgba(0,240,255,0.12)', backdropFilter: 'blur(16px)' }}>
      {items.map(item => {
        const active = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className="flex flex-col items-center gap-1 px-4 py-1 relative transition-all"
            style={{ color: active ? '#00f0ff' : '#4a5a6a' }}
          >
            <div className="relative">
              {item.icon}
              {item.badge && (
                <span className="absolute -top-1 -right-2 text-[8px] px-1 rounded-full"
                      style={{ background: '#ff335530', color: '#ff3355', border: '1px solid #ff335540', minWidth: '14px', textAlign: 'center' }}>
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[8px] tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>{item.label}</span>
            {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: '#00f0ff', boxShadow: '0 0 8px #00f0ff50' }} />}
          </button>
        );
      })}
    </div>
  );
}
