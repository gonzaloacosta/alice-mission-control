import { useStore } from '../../store';

const SEV_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  info:     { color: 'var(--cyan)',   bg: 'rgba(0,240,255,0.06)',  label: 'INFO' },
  warning:  { color: 'var(--yellow)', bg: 'rgba(255,204,0,0.06)',  label: 'WARN' },
  error:    { color: 'var(--red)',    bg: 'rgba(255,51,85,0.06)',   label: 'ERR' },
  critical: { color: 'var(--red)',    bg: 'rgba(255,51,85,0.10)',   label: 'CRIT' },
};

export function LogsView() {
  const events = useStore(s => s.events);
  const projects = useStore(s => s.projects);
  const getColor = (pid: string) => projects.find(p => p.id === pid)?.color || '#6a7a8a';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="detail-header" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '14px', color: 'var(--cyan)', letterSpacing: '2px', margin: 0 }}>
            EVENT LOG
          </h2>
          <span style={{
            fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
            background: 'rgba(0,240,255,0.08)', color: 'var(--cyan)', border: '1px solid rgba(0,240,255,0.15)',
            fontFamily: 'Orbitron, sans-serif',
          }}>
            {events.length}
          </span>
        </div>
      </div>

      {/* Event list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4a5a6a' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '13px', fontFamily: 'Share Tech Mono, monospace' }}>No events recorded yet</div>
          </div>
        )}

        {events.map(evt => {
          const sev = SEV_STYLES[evt.severity] || SEV_STYLES.info;
          return (
            <div key={evt.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              padding: '12px 20px', borderBottom: '1px solid rgba(0,240,255,0.04)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,240,255,0.02)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Severity badge */}
              <span style={{
                fontSize: '9px', fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px',
                padding: '3px 8px', borderRadius: '3px', flexShrink: 0, marginTop: '2px',
                background: sev.bg, color: sev.color, border: `1px solid ${sev.color}30`,
                fontWeight: 700,
              }}>
                {sev.label}
              </span>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '12px', fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px',
                    color: getColor(evt.projectId), fontWeight: 700,
                  }}>
                    {evt.projectId.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '11px', color: '#6a7a8a', fontFamily: 'Share Tech Mono, monospace' }}>
                    {evt.agentName}
                  </span>
                </div>
                <div style={{
                  fontSize: '13px', color: '#c8d8e8', fontFamily: 'Share Tech Mono, monospace',
                  lineHeight: '1.5',
                }}>
                  {evt.message}
                </div>
              </div>

              {/* Timestamp */}
              <span style={{
                fontSize: '11px', color: '#4a5a6a', fontFamily: 'Orbitron, sans-serif',
                flexShrink: 0, marginTop: '2px',
              }}>
                {new Date(evt.timestamp).toLocaleTimeString('en-US', { hour12: false })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
