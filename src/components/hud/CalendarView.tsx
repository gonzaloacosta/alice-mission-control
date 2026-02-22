type CalendarItem = {
  id: string;
  title: string;
  when: string;
  owner: 'alice' | 'gonzalo';
  type: 'cron' | 'task';
  status: 'scheduled' | 'running' | 'done';
};

const ITEMS: CalendarItem[] = [
  { id: '1', title: 'Morning Briefing 7AM', when: 'Daily · 07:00', owner: 'alice', type: 'cron', status: 'scheduled' },
  { id: '2', title: 'Hourly memory checkpoint', when: 'Every hour', owner: 'alice', type: 'cron', status: 'scheduled' },
  { id: '3', title: 'Review Kubiverse UI', when: 'Today · 19:30', owner: 'gonzalo', type: 'task', status: 'scheduled' },
  { id: '4', title: 'Mission Control Office view', when: 'Today · 21:30', owner: 'alice', type: 'task', status: 'running' },
];

const STATUS_COLOR: Record<CalendarItem['status'], string> = {
  scheduled: '#7f93b4',
  running: '#00f0ff',
  done: '#57c58f',
};

export function CalendarView() {
  return (
    <div style={{ padding: '20px 24px', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ margin: 0, color: '#dfe8ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>📅 TASK CALENDAR</h2>
      <p style={{ marginTop: 6, color: '#6b7c96', fontFamily: 'Share Tech Mono, monospace', fontSize: 12 }}>
        Scheduled tasks and cron jobs (mock version)
      </p>

      <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
        {ITEMS.map((it) => (
          <div key={it.id} style={{ background: 'rgba(8,12,28,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: it.type === 'cron' ? '#00f0ff' : '#e6a85d', fontSize: 11 }}>{it.type.toUpperCase()}</span>
              <span style={{ color: '#dfe8ff', fontFamily: 'Orbitron, sans-serif', fontSize: 12 }}>{it.title}</span>
              <span style={{ marginLeft: 'auto', color: STATUS_COLOR[it.status], fontSize: 11 }}>● {it.status.toUpperCase()}</span>
            </div>
            <div style={{ marginTop: 6, color: '#8ea3c8', fontFamily: 'Share Tech Mono, monospace', fontSize: 11 }}>{it.when}</div>
            <div style={{ marginTop: 4, color: '#5d7192', fontSize: 10 }}>Owner: {it.owner === 'alice' ? 'Alice (AI)' : 'Gonzalo'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
