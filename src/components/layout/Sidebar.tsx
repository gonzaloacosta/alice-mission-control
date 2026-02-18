import { useState, useEffect } from 'react';
import { useStore } from '../../store';

export type View = 'projects' | 'news' | 'logs' | 'kanban' | 'terminal' | 'settings' | 'openclaw' | 'chat';

interface SidebarProps {
  activeView: View;
  onNewProject?: () => void;
}

const navItems: { id: View; label: string; icon: string }[] = [
  { id: 'projects', label: 'Projects', icon: '🪐' },
  { id: 'news', label: 'News Feed', icon: '📡' },
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'kanban', label: 'Kanban Board', icon: '📊' },
  { id: 'logs', label: 'Activity Log', icon: '📋' },
  { id: 'terminal', label: 'Terminal', icon: '🖥️' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'openclaw', label: 'OpenClaw', icon: '🤖' },
];

export function Sidebar({ activeView, onNewProject }: SidebarProps) {
  const [clock, setClock] = useState('');
  const projects = useStore(s => s.projects);
  const selectedProjectId = useStore(s => s.selectedProjectId);
  const selectProject = useStore(s => s.selectProject);
  const focusProject = useStore(s => s.focusProject);
  const openChats = useStore(s => s.openChats);
  const setActiveView = useStore(s => s.setActiveView);

  useEffect(() => {
    const update = () => setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const handleProjectClick = (projectId: string) => {
    selectProject(projectId);
    focusProject(projectId);
    setActiveView('projects');
  };

  return (
    <div id="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <h1>⬡ ALICE</h1>
        <div className="subtitle">Mission Control</div>
      </div>

      {/* Nav section */}
      <div className="nav-section">Applications</div>

      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-item ${activeView === item.id ? 'active' : ''}`}
          onClick={() => setActiveView(item.id)}
        >
          <span className="icon">{item.icon}</span>
          <span className="label">{item.label}</span>
          {item.id === 'projects' && (
            <span className="badge-count">{projects.length}</span>
          )}
          {item.id === 'chat' && openChats.length > 0 && (
            <span className="badge-count">{openChats.length}</span>
          )}
        </button>
      ))}

      {/* Sessions section */}
      <div className="nav-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Sessions</span>
        {onNewProject && (
          <button
            onClick={onNewProject}
            style={{
              background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.25)',
              borderRadius: '4px', color: 'var(--cyan)', cursor: 'pointer',
              fontSize: '14px', lineHeight: '1', padding: '2px 6px',
              fontFamily: 'Share Tech Mono, monospace', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,240,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,240,255,0.1)'; }}
            title="Create new project"
          >
            +
          </button>
        )}
      </div>

      <div className="sidebar-sessions">
        {projects.map(project => (
          <button
            key={project.id}
            className={`session-item ${selectedProjectId === project.id ? 'selected' : ''}`}
            onClick={() => handleProjectClick(project.id)}
          >
            <div className={`session-dot ${project.status}`} />
            <span className="session-label">{project.name}</span>
            <span className="session-tokens">{project.version}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="clock">{clock}</div>
        <div className="status-line">
          <div className="live-dot" />
          <span>Connected</span>
        </div>
      </div>
    </div>
  );
}
