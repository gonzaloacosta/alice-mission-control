import { useStore } from '../../store';

interface ProjectsListViewProps {
  onNewProject: () => void;
}

export function ProjectsListView({ onNewProject }: ProjectsListViewProps) {
  const projects = useStore(s => s.projects);
  const selectedProjectId = useStore(s => s.selectedProjectId);
  const selectProject = useStore(s => s.selectProject);
  const focusProject = useStore(s => s.focusProject);
  const setActiveView = useStore(s => s.setActiveView);

  const handleProjectClick = (projectId: string) => {
    selectProject(projectId);
    focusProject(projectId);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="detail-header" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{
              fontFamily: 'Orbitron, sans-serif', fontSize: '14px',
              color: 'var(--cyan)', letterSpacing: '2px', margin: 0,
            }}>
              PROJECTS
            </h2>
            <span style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
              background: 'rgba(0,240,255,0.08)', color: 'var(--cyan)',
              border: '1px solid rgba(0,240,255,0.15)',
              fontFamily: 'Orbitron, sans-serif',
            }}>
              {projects.length}
            </span>
          </div>
          <button
            onClick={onNewProject}
            style={{
              padding: '8px 16px', borderRadius: '8px',
              background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)',
              color: 'var(--cyan)', fontSize: '11px',
              fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            + NEW PROJECT
          </button>
        </div>

        {/* Quick nav */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['kanban', 'chat', 'logs'] as const).map(view => {
            const labels: Record<string, { icon: string; label: string }> = {
              kanban: { icon: '📊', label: 'Board' },
              chat: { icon: '💬', label: 'Chat' },
              logs: { icon: '📋', label: 'Logs' },
            };
            const item = labels[view];
            return (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                style={{
                  padding: '6px 14px', borderRadius: '6px',
                  background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.12)',
                  color: '#6a7a8a', fontSize: '11px',
                  fontFamily: 'Share Tech Mono, monospace',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {item.icon} {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Project list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {projects.map(project => {
          const selected = selectedProjectId === project.id;
          const activeAgents = project.agents.filter(a => a.state === 'active').length;
          return (
            <div
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(0,240,255,0.04)',
                background: selected ? 'rgba(0,240,255,0.04)' : 'transparent',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
            >
              {/* Color dot */}
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: project.color,
                boxShadow: `0 0 8px ${project.color}40`,
                flexShrink: 0,
              }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '13px', fontFamily: 'Orbitron, sans-serif',
                    letterSpacing: '1px', color: project.color, fontWeight: 700,
                  }}>
                    {project.name}
                  </span>
                  <span style={{
                    fontSize: '10px', color: '#4a5a6a',
                    fontFamily: 'Share Tech Mono, monospace',
                  }}>
                    {project.version}
                  </span>
                </div>
                <div style={{
                  fontSize: '11px', color: '#5a6a7a',
                  fontFamily: 'Share Tech Mono, monospace',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {project.description}
                </div>
                {/* Progress bar */}
                <div style={{
                  marginTop: '8px', height: '3px', borderRadius: '2px',
                  background: 'rgba(0,240,255,0.06)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: '2px',
                    width: `${project.progress * 100}%`,
                    background: project.color,
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>

              {/* Stats */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontSize: '10px', color: '#4a5a6a',
                  fontFamily: 'Share Tech Mono, monospace',
                }}>
                  {project.tasks.done}/{project.tasks.total} tasks
                </div>
                <div style={{
                  fontSize: '10px', marginTop: '2px',
                  color: activeAgents > 0 ? '#00ff88' : '#4a5a6a',
                  fontFamily: 'Share Tech Mono, monospace',
                }}>
                  {activeAgents}/{project.agents.length} agents
                </div>
                <div style={{
                  fontSize: '9px', marginTop: '4px', padding: '2px 6px',
                  borderRadius: '3px',
                  background: project.status === 'building' ? 'rgba(255,204,0,0.08)' : 'rgba(0,255,136,0.08)',
                  color: project.status === 'building' ? '#ffcc00' : '#00ff88',
                  border: `1px solid ${project.status === 'building' ? 'rgba(255,204,0,0.2)' : 'rgba(0,255,136,0.2)'}`,
                  fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px',
                }}>
                  {project.status.toUpperCase()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
