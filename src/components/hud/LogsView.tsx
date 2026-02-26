import { useEffect, useState, useRef, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';
const WS_BASE = API_BASE ? API_BASE.replace(/^http/, 'ws') : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

interface EventRow {
  id: number;
  project_slug: string;
  source: string;
  agent_name: string | null;
  event_type: string;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const SOURCE_ICONS: Record<string, string> = {
  'claude-hook': '🤖',
  'github-actions': '🔧',
  'git-push': '📝',
};

const TYPE_COLORS: Record<string, string> = {
  task_complete: '#00ff88',
  task_start: '#00f0ff',
  task_fail: '#ff3355',
  build_pass: '#00ff88',
  build_fail: '#ff3355',
  commit: '#ffcc00',
};

export function LogsView() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [projectFilter, setProjectFilter] = useState<string>('');
  const [projects, setProjects] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchEvents = useCallback(async () => {
    const params = new URLSearchParams();
    if (projectFilter) params.set('project', projectFilter);
    params.set('limit', '100');
    try {
      const res = await fetch(`${API_BASE}/api/v1/events?${params}`);
      const data = await res.json();
      setEvents(data.events || []);
      // Extract unique projects
      const eventsList = data.events || [];
      const slugs = eventsList.map((e: EventRow) => e.project_slug).filter((slug: any) => typeof slug === 'string') as string[];
      const uniqueSlugs = [...new Set(slugs)];
      setProjects(prev => {
        const merged = [...new Set([...prev, ...uniqueSlugs])].sort();
        return merged.length !== prev.length ? merged : prev;
      });
    } catch {}
  }, [projectFilter]);

  // Initial fetch
  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // WebSocket for live updates
  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws/events`);
    wsRef.current = ws;
    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === 'new_event') {
          const evt = data.event as EventRow;
          if (!projectFilter || evt.project_slug === projectFilter) {
            setEvents(prev => [evt, ...prev].slice(0, 100));
          }
          setProjects(prev => prev.includes(evt.project_slug) ? prev : [...prev, evt.project_slug].sort());
        }
      } catch {}
    };
    ws.onclose = () => { setTimeout(() => { /* reconnect handled by re-render */ }, 3000); };
    return () => { ws.close(); };
  }, [projectFilter]);

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
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            style={{
              marginLeft: 'auto', background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.15)',
              color: 'var(--cyan)', fontFamily: 'Share Tech Mono, monospace', fontSize: '11px',
              padding: '4px 8px', borderRadius: '4px', outline: 'none',
            }}
          >
            <option value="">ALL PROJECTS</option>
            {projects.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
          </select>
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
          const icon = SOURCE_ICONS[evt.source] || '📌';
          const typeColor = TYPE_COLORS[evt.event_type] || '#00f0ff';
          return (
            <div key={evt.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              padding: '12px 20px', borderBottom: '1px solid rgba(0,240,255,0.04)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,240,255,0.02)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Source icon */}
              <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '2px' }}>{icon}</span>

              {/* Type badge */}
              <span style={{
                fontSize: '9px', fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px',
                padding: '3px 8px', borderRadius: '3px', flexShrink: 0, marginTop: '2px',
                background: `${typeColor}10`, color: typeColor, border: `1px solid ${typeColor}30`,
                fontWeight: 700,
              }}>
                {evt.event_type.toUpperCase().replace('_', ' ')}
              </span>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '12px', fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px',
                    color: '#00f0ff', fontWeight: 700,
                  }}>
                    {evt.project_slug.toUpperCase()}
                  </span>
                  {evt.agent_name && (
                    <span style={{ fontSize: '11px', color: '#6a7a8a', fontFamily: 'Share Tech Mono, monospace' }}>
                      {evt.agent_name}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '13px', color: '#c8d8e8', fontFamily: 'Share Tech Mono, monospace',
                  lineHeight: '1.5',
                }}>
                  {evt.summary}
                </div>
              </div>

              {/* Timestamp */}
              <span style={{
                fontSize: '11px', color: '#4a5a6a', fontFamily: 'Orbitron, sans-serif',
                flexShrink: 0, marginTop: '2px',
              }}>
                {new Date(evt.created_at).toLocaleTimeString('en-US', { hour12: false })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
