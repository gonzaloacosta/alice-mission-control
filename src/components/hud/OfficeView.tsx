import { useStore } from '../../store';
import { STATE_COLORS } from '../../types';
import type { ProjectAgent, AgentState } from '../../types';

const STATE_LABELS: Record<AgentState, string> = {
  active: 'WORKING',
  idle: 'IDLE',
  warning: 'WARNING',
  error: 'ERROR',
  running: 'RUNNING',
  recovery: 'RECOVERY',
};

const ROLE_AVATARS: Record<string, string> = {
  'Go Proxy & Lambda': '⚙️',
  'Infra & CI/CD': '🔧',
  Security: '🛡️',
  'React UI': '🎨',
  Testing: '🧪',
  'WireGuard & Caddy': '🔒',
  'React & Three.js': '🌐',
  Research: '📚',
  'Backend API': '⚙️',
  'Frontend App': '🎨',
  'Code Review': '👁️',
  Architecture: '📐',
};

function getAvatar(role: string): string {
  return ROLE_AVATARS[role] || '🤖';
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '255,255,255';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

function TerminalLines({ active }: { active: boolean }) {
  if (!active) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#30435c',
          fontSize: '10px',
          fontFamily: 'Share Tech Mono, monospace',
        }}
      >
        STANDBY
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 4,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {[0.85, 0.7, 0.55, 0.4, 0.3].map((opacity, i) => (
        <div
          key={i}
          style={{
            height: 3,
            background: `rgba(0, 255, 136, ${opacity * 0.6})`,
            borderRadius: 1,
            width: `${40 + Math.sin(i * 1.7) * 35}%`,
            animation: active ? `termLine ${1.5 + i * 0.3}s ease-in-out infinite alternate` : 'none',
          }}
        />
      ))}
    </div>
  );
}

function Workstation({ agent, projectColor }: { agent: ProjectAgent; projectColor: string }) {
  const isActive = agent.state === 'active';
  const stateColor = STATE_COLORS[agent.state];
  const glowColor = isActive ? projectColor : 'transparent';

  return (
    <article
      style={{
        background: 'rgba(8, 12, 28, 0.82)',
        border: `1px solid ${isActive ? `${projectColor}35` : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 12,
        padding: 14,
        backdropFilter: 'blur(12px)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.25s',
        boxShadow: isActive
          ? `0 8px 24px ${projectColor}18, inset 0 1px 0 rgba(255,255,255,0.05)`
          : '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div
        style={{
          background: 'rgba(15, 20, 40, 0.85)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 8,
          padding: 10,
          marginBottom: 10,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '100%',
            height: 56,
            background: isActive ? 'rgba(0, 15, 8, 0.95)' : 'rgba(10, 12, 20, 0.95)',
            border: `1.5px solid ${isActive ? `${glowColor}60` : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 5,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: isActive ? `0 0 12px ${glowColor}20` : 'none',
            transition: 'all 0.4s',
          }}
        >
          <TerminalLines active={isActive} />
          {isActive && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.03) 50%)',
                backgroundSize: '100% 4px',
                pointerEvents: 'none',
                animation: 'scanline 8s linear infinite',
              }}
            />
          )}
        </div>

        <div
          style={{
            width: 16,
            height: 6,
            background: 'rgba(255,255,255,0.07)',
            margin: '0 auto',
            borderRadius: '0 0 3px 3px',
          }}
        />
        <div
          style={{
            width: 30,
            height: 3,
            background: 'rgba(255,255,255,0.04)',
            margin: '0 auto',
            borderRadius: 2,
          }}
        />

        <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 6 }}>
          {[18, 14, 22, 14, 18].map((w, i) => (
            <div
              key={i}
              style={{
                width: w,
                height: 4,
                background: isActive
                  ? `rgba(${hexToRgb(projectColor)}, ${0.15 + i * 0.03})`
                  : 'rgba(255,255,255,0.05)',
                borderRadius: 1,
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 6,
            right: 8,
            fontSize: 20,
            filter: isActive ? 'none' : 'grayscale(0.6) opacity(0.5)',
            transition: 'filter 0.3s',
            transform: isActive ? 'translateY(0)' : 'translateY(-2px) rotate(-8deg)',
          }}
        >
          {getAvatar(agent.role)}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: stateColor,
            boxShadow: isActive ? `0 0 8px ${stateColor}` : 'none',
            flexShrink: 0,
            animation: isActive ? 'pulse 2s ease-in-out infinite' : 'none',
          }}
        />
        <span
          style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            color: '#e0e8f0',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {agent.name}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 9,
            color: stateColor,
            letterSpacing: '0.08em',
            opacity: 0.9,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {STATE_LABELS[agent.state]}
        </span>
      </div>

      <div
        style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: 10,
          color: '#607496',
          marginBottom: 5,
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
        }}
      >
        {agent.role}
      </div>

      <div
        style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: 10,
          color: isActive ? projectColor : '#466081',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          opacity: 0.9,
        }}
      >
        {isActive && <span style={{ animation: 'blink 1s step-end infinite' }}>{'> '}</span>}
        {agent.task}
      </div>

      <div
        style={{
          marginTop: 10,
          height: 3,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(agent.contribution * 100, 100))}%`,
            background: isActive
              ? `linear-gradient(90deg, ${projectColor}80, ${projectColor})`
              : 'rgba(255,255,255,0.1)',
            borderRadius: 2,
            transition: 'width 0.6s ease, background 0.3s',
          }}
        />
      </div>
    </article>
  );
}

export function OfficeView() {
  const projects = useStore(s => s.projects);
  const totalAgents = projects.reduce((sum, p) => sum + p.agents.length, 0);
  const totalActive = projects.reduce((sum, p) => sum + p.agents.filter(a => a.state === 'active').length, 0);

  return (
    <div
      style={{
        padding: 'clamp(16px, 2.2vw, 24px)',
        height: '100%',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, rgba(8,12,28,0.96) 0%, rgba(4,6,16,0.99) 100%)',
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes scanline {
          0% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }
        @keyframes termLine {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}</style>

      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 20,
          paddingBottom: 14,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🏢</span>
          <div>
            <h2
              style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: 16,
                fontWeight: 700,
                color: '#e0e8f0',
                margin: 0,
                letterSpacing: '0.1em',
              }}
            >
              DIGITAL OFFICE
            </h2>
            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#607496' }}>
              Live workspace for all project agents
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ border: '1px solid rgba(0,240,255,0.25)', color: '#8bdcff', background: 'rgba(0,240,255,0.08)', borderRadius: 999, padding: '3px 10px', fontSize: 10 }}>
            {projects.length} PROJECTS
          </div>
          <div style={{ border: '1px solid rgba(255,255,255,0.16)', color: '#adc0dd', background: 'rgba(255,255,255,0.06)', borderRadius: 999, padding: '3px 10px', fontSize: 10 }}>
            {totalAgents} AGENTS
          </div>
          <div style={{ border: '1px solid rgba(0,255,136,0.25)', color: '#87f8bf', background: 'rgba(0,255,136,0.08)', borderRadius: 999, padding: '3px 10px', fontSize: 10 }}>
            {totalActive} ACTIVE
          </div>
        </div>
      </header>

      {projects.length === 0 && (
        <div
          style={{
            border: '1px dashed rgba(0,240,255,0.22)',
            borderRadius: 12,
            padding: 20,
            color: '#7f93b4',
            textAlign: 'center',
            background: 'rgba(8,12,28,0.6)',
          }}
        >
          No projects yet. Create one from the sidebar to populate the office.
        </div>
      )}

      {projects.map(project => {
        const activeInProject = project.agents.filter(a => a.state === 'active').length;

        return (
          <section key={project.id} style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: project.color,
                  boxShadow: `0 0 10px ${project.color}55`,
                }}
              />
              <span
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: 12,
                  fontWeight: 700,
                  color: project.color,
                  letterSpacing: '0.11em',
                }}
              >
                {project.name}
              </span>
              <span
                style={{
                  fontFamily: 'Share Tech Mono, monospace',
                  fontSize: 10,
                  color: '#607496',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 'min(480px, 100%)',
                }}
              >
                — {project.description}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontFamily: 'Share Tech Mono, monospace',
                  fontSize: 10,
                  color: '#88a2c8',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeInProject}/{project.agents.length} active
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: 12,
                alignItems: 'stretch',
              }}
            >
              {project.agents.map(agent => (
                <Workstation key={agent.id} agent={agent} projectColor={project.color} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
