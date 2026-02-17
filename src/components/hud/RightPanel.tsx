import { useStore } from '../../store';
import { getPhase, PHASE_LABELS } from '../../types';

export function RightPanel() {
  const projects = useStore(s => s.projects);
  const focusedId = useStore(s => s.focusedProjectId);
  const unfocusProject = useStore(s => s.unfocusProject);
  const openChatTab = useStore(s => s.openChatTab);

  const project = projects.find(p => p.id === focusedId);
  const isOpen = !!project;

  const handleAgentClick = (agentName: string | null) => {
    if (project) {
      openChatTab(project.id, agentName);
    }
  };

  return (
    <div className={`right-panel ${isOpen ? 'open' : ''}`}>
      {project && (
        <>
          <div className="detail-header">
            <h2>{project.name}</h2>
            <button className="detail-close" onClick={unfocusProject}>✕</button>
          </div>
          <div className="detail-body">
            <div className="detail-grid">
              <div className="detail-item">
                <label>Status</label>
                <span className="detail-value">
                  <span className={`badge badge-${project.status}`}>{project.status.toUpperCase()}</span>
                </span>
              </div>
              <div className="detail-item">
                <label>Version</label>
                <span className="detail-value">{project.version}</span>
              </div>
              <div className="detail-item">
                <label>Phase</label>
                <span className="detail-value">{PHASE_LABELS[getPhase(project.progress)]}</span>
              </div>
              <div className="detail-item">
                <label>Tasks</label>
                <span className="detail-value" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--cyan)' }}>
                  {project.tasks.done}/{project.tasks.total}
                </span>
              </div>

              {/* Progress bar */}
              <div className="token-bar-container">
                <div className="token-bar-label">Progress</div>
                <div className="token-bar-row">
                  <span className="token-bar-name">Done</span>
                  <div className="token-bar-track">
                    <div className="token-bar-fill" style={{ width: `${project.progress * 100}%`, background: project.color }} />
                  </div>
                  <span className="token-bar-value">{Math.round(project.progress * 100)}%</span>
                </div>
              </div>

              {/* Description */}
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <label>Description</label>
                <span className="detail-value">{project.description}</span>
              </div>

              {/* Links */}
              {(project.notionUrl || project.repoUrl) && (
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <label>Links</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {project.notionUrl && (
                      <a href={project.notionUrl} target="_blank" rel="noopener noreferrer"
                         style={{ fontSize: '11px', color: 'var(--cyan)', textDecoration: 'none', padding: '4px 10px', border: '1px solid var(--border)', borderRadius: '4px' }}>
                        📋 Notion
                      </a>
                    )}
                    {project.repoUrl && (
                      <a href={project.repoUrl} target="_blank" rel="noopener noreferrer"
                         style={{ fontSize: '11px', color: 'var(--cyan)', textDecoration: 'none', padding: '4px 10px', border: '1px solid var(--border)', borderRadius: '4px' }}>
                        ⚙️ GitHub
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Agents */}
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <label>Agents — Tap to Chat</label>
                <div style={{ marginTop: '8px' }}>
                  {/* Default agent */}
                  <button
                    onClick={() => handleAgentClick(null)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 12px', marginBottom: '6px',
                      background: 'rgba(0,240,255,0.04)', border: '1px solid var(--border)',
                      borderRadius: '6px', cursor: 'pointer', color: '#c8d8e8', fontFamily: 'Share Tech Mono, monospace',
                      fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <span>⚡ Default Agent</span>
                    <span style={{ fontSize: '10px', color: 'var(--cyan)' }}>CHAT →</span>
                  </button>

                  {project.agents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => handleAgentClick(agent.name)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 12px', marginBottom: '6px',
                        background: 'rgba(0,240,255,0.04)', border: '1px solid var(--border)',
                        borderRadius: '6px', cursor: 'pointer', color: '#c8d8e8', fontFamily: 'Share Tech Mono, monospace',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: agent.state === 'active' ? 'var(--green)' : '#3a4a5a',
                            boxShadow: agent.state === 'active' ? '0 0 6px var(--green)' : 'none',
                          }} />
                          <span>{agent.name}</span>
                          <span style={{ fontSize: '9px', color: '#4a5a6a' }}>{agent.role}</span>
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--cyan)' }}>CHAT →</span>
                      </div>
                      <div style={{ marginTop: '4px', height: '3px', borderRadius: '2px', background: 'rgba(0,240,255,0.04)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${agent.contribution * 100}%`, background: agent.state === 'active' ? project.color : '#3a4a5a', borderRadius: '2px' }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
