import { useEffect, useMemo, useState } from 'react';

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
  scheduled: 'var(--muted-foreground)',
  running: 'var(--cyan)',
  done: 'var(--green)',
};

export function CalendarView() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(id);
  }, []);

  const stats = useMemo(() => {
    const scheduled = ITEMS.filter((it) => it.status === 'scheduled').length;
    const running = ITEMS.filter((it) => it.status === 'running').length;
    const done = ITEMS.filter((it) => it.status === 'done').length;
    return { scheduled, running, done };
  }, []);

  return (
    <div style={{ padding: '20px 24px', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ margin: 0, color: 'var(--foreground)', fontFamily: 'Geist, sans-serif', letterSpacing: '0.08em' }}>📅 TASK CALENDAR</h2>
      <p style={{ marginTop: 6, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
        Scheduled tasks and cron jobs (mock version)
      </p>

      <div style={{ marginTop: 12, marginBottom: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {[
          { label: 'Scheduled', value: stats.scheduled, color: 'var(--muted-foreground)' },
          { label: 'Running', value: stats.running, color: 'var(--cyan)' },
          { label: 'Completed', value: stats.done, color: 'var(--green)' },
        ].map((s) => (
          <div key={s.label} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', background: 'rgba(36,40,59,0.9)' }}>
            <div style={{ color: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</div>
            <div style={{ color: s.color, fontFamily: 'Geist, sans-serif', fontSize: 16 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ background: 'rgba(36,40,59,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12 }}>
              <div style={{ height: 12, width: '40%', background: 'rgba(127,147,180,0.35)', borderRadius: 4 }} />
              <div style={{ height: 10, width: '20%', background: 'rgba(127,147,180,0.2)', borderRadius: 4, marginTop: 8 }} />
            </div>
          ))}
        </div>
      ) : ITEMS.length === 0 ? (
        <div style={{ marginTop: 16, border: '1px dashed rgba(125,207,255,0.35)', borderRadius: 10, padding: 18, color: 'var(--muted-foreground)', textAlign: 'center' }}>
          No tasks scheduled yet.
        </div>
      ) : (
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          {ITEMS.map((it) => (
            <div key={it.id} style={{ background: 'rgba(36,40,59,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: it.type === 'cron' ? 'var(--cyan)' : 'var(--yellow)', fontSize: 11 }}>{it.type.toUpperCase()}</span>
                <span style={{ color: 'var(--foreground)', fontFamily: 'Geist, sans-serif', fontSize: 12 }}>{it.title}</span>
                <span style={{ marginLeft: 'auto', color: STATUS_COLOR[it.status], fontSize: 11 }}>● {it.status.toUpperCase()}</span>
              </div>
              <div style={{ marginTop: 6, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{it.when}</div>
              <div style={{ marginTop: 4, color: 'var(--muted-foreground)', fontSize: 10 }}>Owner: {it.owner === 'alice' ? 'Alice (AI)' : 'Gonzalo'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
