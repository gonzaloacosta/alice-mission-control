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
  return (
    <div style={{ padding: '20px 24px', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ margin: 0, color: '#dfe8ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>👥 TEAM STRUCTURE</h2>
      <p style={{ marginTop: 6, color: '#6b7c96', fontFamily: 'Share Tech Mono, monospace', fontSize: 12 }}>
        Alice + sub-agents organized by responsibilities
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, marginBottom: 16 }}>
        <div style={{
          minWidth: 280,
          background: 'rgba(8,12,28,0.92)',
          border: '1px solid rgba(0,240,255,0.25)',
          borderRadius: 10,
          padding: 14,
          textAlign: 'center',
          boxShadow: '0 0 20px rgba(0,240,255,0.12)',
        }}>
          <div style={{ fontSize: 30 }}>{LEAD.avatar}</div>
          <div style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', fontSize: 14 }}>{LEAD.name}</div>
          <div style={{ color: '#91a5c5', fontSize: 11, fontFamily: 'Share Tech Mono, monospace' }}>{LEAD.role} · {LEAD.model}</div>
          <div style={{ color: '#57c58f', fontSize: 11, marginTop: 6 }}>● ACTIVE</div>
          <div style={{ color: '#6b7c96', fontSize: 11, marginTop: 4 }}>{LEAD.description}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {TEAM.map((a) => (
          <div key={a.name} style={{ background: 'rgba(8,12,28,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>{a.avatar}</span>
              <div>
                <div style={{ color: '#dfe8ff', fontFamily: 'Orbitron, sans-serif', fontSize: 12 }}>{a.name}</div>
                <div style={{ color: '#7f93b4', fontFamily: 'Share Tech Mono, monospace', fontSize: 10 }}>{a.role}</div>
              </div>
              <span style={{ marginLeft: 'auto', color: STATE_COLORS[a.status], fontSize: 10 }}>● {a.status.toUpperCase()}</span>
            </div>
            <div style={{ color: '#5f7396', fontSize: 11, marginTop: 8 }}>{a.description}</div>
            <div style={{ color: '#8ea3c8', fontSize: 10, marginTop: 4, fontFamily: 'Share Tech Mono, monospace' }}>{a.model}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {a.skills.map((s) => (
                <span key={s} style={{ fontSize: 10, color: '#a8b8d3', border: '1px solid rgba(0,240,255,0.22)', borderRadius: 999, padding: '2px 7px' }}>{s}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
