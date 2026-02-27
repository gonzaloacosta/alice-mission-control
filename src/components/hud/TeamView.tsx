import { useEffect, useMemo, useState } from 'react';
import { STATE_COLORS } from '../../types';

type AgentCard = {
  name: string;
  role: string;
  model: string;
  status: 'active' | 'idle' | 'warning' | 'error';
  avatar: string;
  description: string;
  skills: string[];
};

const LEAD = {
  name: 'Alice',
  role: 'Lead Agent',
  model: 'GPT-5.3 Codex',
  status: 'active' as const,
  avatar: '🤖',
  description: 'Main session, planning, coordination',
};

const TEAM: AgentCard[] = [
  { name: 'Coder', role: 'Developer', model: 'Claude Code / Sonnet', status: 'active', avatar: '👨‍💻', description: 'Feature development and refactoring', skills: ['TypeScript', 'Go', 'React', 'Docker'] },
  { name: 'Reviewer', role: 'Code Review', model: 'Haiku', status: 'idle', avatar: '🔍', description: 'PR reviews and quality checks', skills: ['Security', 'Static Analysis'] },
  { name: 'Architect', role: 'System Design', model: 'GPT-5.3 / Sonnet', status: 'idle', avatar: '🏗️', description: 'Architecture and technical decisions', skills: ['Cloud', 'K8s', 'Design'] },
  { name: 'Reporter', role: 'News & Briefings', model: 'Sonnet', status: 'idle', avatar: '📰', description: 'Morning briefings and summaries', skills: ['Research', 'Summarization'] },
  { name: 'Writer', role: 'Documentation', model: 'GPT-5.3', status: 'idle', avatar: '📝', description: 'Docs, memory logs, reports', skills: ['Docs', 'Communication'] },
  { name: 'DevOps', role: 'Infrastructure', model: 'Claude Code / Sonnet', status: 'active', avatar: '⚙️', description: 'Docker, services, observability', skills: ['Docker', 'Caddy', 'Linux'] },
];

export function TeamView() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(id);
  }, []);

  const stats = useMemo(() => {
    const active = TEAM.filter((a) => a.status === 'active').length;
    const idle = TEAM.filter((a) => a.status === 'idle').length;
    const warning = TEAM.filter((a) => a.status === 'warning').length;
    return { active, idle, warning, total: TEAM.length + 1 };
  }, []);

  return (
    <div style={{ padding: '20px 24px', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ margin: 0, color: 'var(--foreground)', fontFamily: 'Geist, sans-serif', letterSpacing: '0.08em' }}>👥 TEAM STRUCTURE</h2>
      <p style={{ marginTop: 6, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
        Alice + sub-agents organized by responsibilities
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 12, marginBottom: 14 }}>
        {[
          { label: 'Total', value: stats.total, color: 'var(--foreground)' },
          { label: 'Active', value: stats.active + 1, color: 'var(--green)' },
          { label: 'Idle', value: stats.idle, color: 'var(--muted-foreground)' },
          { label: 'Alerts', value: stats.warning, color: 'var(--neon-orange)' },
        ].map((s) => (
          <div key={s.label} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', background: 'rgba(36,40,59,0.9)' }}>
            <div style={{ color: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</div>
            <div style={{ color: s.color, fontFamily: 'Geist, sans-serif', fontSize: 16, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{
          minWidth: 300,
          background: 'rgba(36,40,59,0.94)',
          border: '1px solid rgba(125,207,255,0.25)',
          borderRadius: 12,
          padding: 14,
          textAlign: 'center',
          boxShadow: '0 0 20px rgba(125,207,255,0.12)',
        }}>
          <div style={{ fontSize: 30 }}>{LEAD.avatar}</div>
          <div style={{ color: 'var(--cyan)', fontFamily: 'Geist, sans-serif', fontSize: 14 }}>{LEAD.name}</div>
          <div style={{ color: 'var(--muted-foreground)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{LEAD.role} · {LEAD.model}</div>
          <div style={{ color: 'var(--green)', fontSize: 11, marginTop: 6 }}>● ACTIVE</div>
          <div style={{ color: 'var(--muted-foreground)', fontSize: 11, marginTop: 4 }}>{LEAD.description}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ background: 'rgba(36,40,59,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12 }}>
              <div style={{ height: 12, width: '45%', background: 'rgba(127,147,180,0.35)', borderRadius: 4 }} />
              <div style={{ height: 10, width: '65%', background: 'rgba(127,147,180,0.2)', borderRadius: 4, marginTop: 8 }} />
              <div style={{ height: 10, width: '90%', background: 'rgba(127,147,180,0.15)', borderRadius: 4, marginTop: 10 }} />
            </div>
          ))}
        </div>
      ) : TEAM.length === 0 ? (
        <div style={{ marginTop: 16, border: '1px dashed rgba(125,207,255,0.35)', borderRadius: 10, padding: 18, color: 'var(--muted-foreground)', textAlign: 'center' }}>
          No team members configured yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {TEAM.map((a) => (
            <div key={a.name} style={{ background: 'rgba(36,40,59,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>{a.avatar}</span>
                <div>
                  <div style={{ color: 'var(--foreground)', fontFamily: 'Geist, sans-serif', fontSize: 12 }}>{a.name}</div>
                  <div style={{ color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{a.role}</div>
                </div>
                <span style={{ marginLeft: 'auto', color: STATE_COLORS[a.status], fontSize: 10 }}>● {a.status.toUpperCase()}</span>
              </div>
              <div style={{ color: 'var(--muted-foreground)', fontSize: 11, marginTop: 8 }}>{a.description}</div>
              <div style={{ color: 'var(--muted-foreground)', fontSize: 10, marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>{a.model}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {a.skills.map((s) => (
                  <span key={s} style={{ fontSize: 10, color: 'var(--foreground)', border: '1px solid rgba(125,207,255,0.22)', borderRadius: 999, padding: '2px 7px' }}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
