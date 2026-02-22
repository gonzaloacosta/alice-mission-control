import { useStore } from '../../store';
import { STATE_COLORS } from '../../types';
import type { ProjectAgent, AgentState } from '../../types';

const STATE_LABELS: Record<AgentState, string> = {
  active: 'WORKING',
  idle: 'IDLE',
  warning: 'WARNING',
  error: 'ERROR',
};

const ROLE_AVATARS: Record<string, string> = {
  'Go Proxy & Lambda': '⚙️',
  'Infra & CI/CD': '🔧',
  'Security': '🛡️',
  'React UI': '🎨',
  'Testing': '🧪',
  'WireGuard & Caddy': '🔒',
  'React & Three.js': '🌐',
  'Research': '📚',
  'Backend API': '⚙️',
  'Frontend App': '🎨',
  'Code Review': '👁️',
  'Architecture': '📐',
};

function getAvatar(role: string): string {
  return ROLE_AVATARS[role] || '🤖';
}

function TerminalLines({ active }: { active: boolean }) {
  if (!active) {
    return (
      <div style={{
        position: 'absolute', inset: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#1a2a3a', fontSize: '10px',
        fontFamily: 'Share Tech Mono, monospace',
      }}>
        STANDBY
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', inset: 4,
      overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      {[0.85, 0.7, 0.55, 0.4, 0.3].map((opacity, i) => (
        <div key={i} style={{
          height: 3,
          background: `rgba(0, 255, 136, ${opacity * 0.6})`,
          borderRadius: 1,
          width: `${40 + Math.sin(i * 1.7) * 35}%`,
          animation: active ? `termLine ${1.5 + i * 0.3}s ease-in-out infinite alternate` : 'none',
        }} />
      ))}
    </div>
  );
}

function Workstation({ agent, projectColor }: { agent: ProjectAgent; projectColor: string }) {
  const isActive = agent.state === 'active';
  const stateColor = STATE_COLORS[agent.state];
  const glowColor = isActive ? projectColor : 'transparent';

  return (
    <div style={{
      background: 'rgba(8, 12, 28, 0.85)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 8,
      padding: 16,
      backdropFilter: 'blur(12px)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.3s, box-shadow 0.3s',
      boxShadow: isActive
        ? `0 0 20px ${projectColor}15, inset 0 1px 0 rgba(255,255,255,0.05)`
        : 'inset 0 1px 0 rgba(255,255,255,0.03)',
      borderColor: isActive ? `${projectColor}30` : 'rgba(255,255,255,0.06)',
    }}>
      {/* Desk surface */}
      <div style={{
        background: 'rgba(15, 20, 40, 0.9)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 6,
        padding: 12,
        marginBottom: 12,
        position: 'relative',
      }}>
        {/* Monitor */}
        <div style={{
          width: '100%', height: 56,
          background: isActive ? 'rgba(0, 15, 8, 0.95)' : 'rgba(10, 12, 20, 0.95)',
          border: `1.5px solid ${isActive ? glowColor + '60' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: isActive ? `0 0 12px ${glowColor}20` : 'none',
          transition: 'all 0.4s',
        }}>
          <TerminalLines active={isActive} />
          {/* Screen flicker overlay */}
          {isActive && (
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(transparent 50%, rgba(0,0,0,0.03) 50%)`,
              backgroundSize: '100% 4px',
              pointerEvents: 'none',
              animation: 'scanline 8s linear infinite',
            }} />
          )}
        </div>

        {/* Monitor stand */}
        <div style={{
          width: 16, height: 6,
          background: 'rgba(255,255,255,0.06)',
          margin: '0 auto',
          borderRadius: '0 0 3px 3px',
        }} />
        <div style={{
          width: 30, height: 3,
          background: 'rgba(255,255,255,0.04)',
          margin: '0 auto',
          borderRadius: 2,
        }} />

        {/* Keyboard */}
        <div style={{
          display: 'flex', gap: 2,
          justifyContent: 'center',
          marginTop: 6,
        }}>
          {[18, 14, 22, 14, 18].map((w, i) => (
            <div key={i} style={{
              width: w, height: 4,
              background: isActive
                ? `rgba(${hexToRgb(projectColor)}, ${0.15 + i * 0.03})`
                : 'rgba(255,255,255,0.04)',
              borderRadius: 1,
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Avatar at desk */}
        <div style={{
          position: 'absolute',
          bottom: 6,
          right: 8,
          fontSize: 20,
          filter: isActive ? 'none' : 'grayscale(0.6) opacity(0.5)',
          transition: 'filter 0.3s',
          transform: isActive ? 'translateY(0)' : 'translateY(-2px) rotate(-8deg)',
        }}>
          {getAvatar(agent.role)}
        </div>
      </div>

      {/* Agent info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        {/* Status dot */}
        <div style={{
          width: 8, height: 8,
          borderRadius: '50%',
          background: stateColor,
          boxShadow: isActive ? `0 0 6px ${stateColor}` : 'none',
          flexShrink: 0,
          animation: isActive ? 'pulse 2s ease-in-out infinite' : 'none',
        }} />
        <span style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 11,
          fontWeight: 600,
          color: '#e0e8f0',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          {agent.name}
        </span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: 9,
          color: stateColor,
          letterSpacing: '0.08em',
          opacity: 0.9,
        }}>
          {STATE_LABELS[agent.state]}
        </span>
      </div>

      {/* Role */}
      <div style={{
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: 10,
        color: '#4a5a6a',
        marginBottom: 4,
      }}>
        {agent.role}
      </div>

      {/* Current task */}
      <div style={{
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: 10,
        color: isActive ? projectColor : '#3a4a5a',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        opacity: 0.85,
      }}>
        {isActive && <span style={{ animation: 'blink 1s step-end infinite' }}>{'> '}</span>}
        {agent.task}
      </div>

      {/* Contribution bar */}
      <div style={{
        marginTop: 8,
        height: 2,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 1,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${agent.contribution * 100}%`,
          background: isActive
            ? `linear-gradient(90deg, ${projectColor}80, ${projectColor})`
            : 'rgba(255,255,255,0.08)',
          borderRadius: 1,
          transition: 'width 0.6s ease, background 0.3s',
        }} />
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '255,255,255';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

export function OfficeView() {
  const projects = useStore(s => s.projects);

  return (
    <div style={{
      padding: '20px 24px',
      height: '100%',
      overflowY: 'auto',
      background: 'linear-gradient(180deg, rgba(8,12,28,0.97) 0%, rgba(4,6,16,0.99) 100%)',
    }}>
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

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <span style={{ fontSize: 22 }}>🏢</span>
        <div>
          <h2 style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 16,
            fontWeight: 700,
            color: '#e0e8f0',
            margin: 0,
            letterSpacing: '0.1em',
          }}>
            DIGITAL OFFICE
          </h2>
          <span style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: 11,
            color: '#4a5a6a',
          }}>
            {projects.reduce((sum, p) => sum + p.agents.length, 0)} agents across {projects.length} projects
          </span>
        </div>
      </div>

      {/* Projects with agent workstations */}
      {projects.map(project => (
        <div key={project.id} style={{ marginBottom: 28 }}>
          {/* Project header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 12,
          }}>
            <div style={{
              width: 10, height: 10,
              borderRadius: '50%',
              background: project.color,
              boxShadow: `0 0 8px ${project.color}40`,
            }} />
            <span style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 12,
              fontWeight: 600,
              color: project.color,
              letterSpacing: '0.12em',
            }}>
              {project.name}
            </span>
            <span style={{
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: 10,
              color: '#3a4a5a',
            }}>
              — {project.description}
            </span>
            <span style={{
              marginLeft: 'auto',
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: 10,
              color: '#3a4a5a',
            }}>
              {project.agents.filter(a => a.state === 'active').length}/{project.agents.length} active
            </span>
          </div>

          {/* Workstation grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
          }}>
            {project.agents.map(agent => (
              <Workstation
                key={agent.id}
                agent={agent}
                projectColor={project.color}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
