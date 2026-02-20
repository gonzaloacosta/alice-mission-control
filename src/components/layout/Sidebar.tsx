import { useState, useEffect } from 'react';
import { useStore } from '../../store';

export type View = 'overview' | 'projects' | 'news' | 'logs' | 'kanban' | 'terminal' | 'settings' | 'chat' | 'route';

interface SidebarProps {
  activeView: View;
  onNewProject?: () => void;
}

// Sub-items under the collapsible "Projects" section
const projectSubItems: { id: View; label: string; icon: string }[] = [
  { id: 'kanban', label: 'Board', icon: '📊' },
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'logs', label: 'Activity Log', icon: '📋' },
];

// Top-level nav items
const topLevelItems: { id: View; label: string; icon: string }[] = [
  { id: 'news', label: 'News Feed', icon: '📡' },
  { id: 'route', label: 'Route Planner', icon: '🧭' },
  { id: 'terminal', label: 'Terminal', icon: '🖥️' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar({ activeView, onNewProject }: SidebarProps) {
  const [clock, setClock] = useState('');
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const projects = useStore(s => s.projects);
  const selectedProjectId = useStore(s => s.selectedProjectId);
  const selectProject = useStore(s => s.selectProject);
  const focusProject = useStore(s => s.focusProject);
  const openChats = useStore(s => s.openChats);
  const setActiveView = useStore(s => s.setActiveView);

  // Auto-expand when a sub-item is active
  const isProjectSubView = projectSubItems.some(i => i.id === activeView) || activeView === 'projects';

  useEffect(() => {
    if (isProjectSubView) setProjectsExpanded(true);
  }, [isProjectSubView]);

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

      {/* ── Projects (collapsible section) ── */}
      <div className="nav-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Projects</span>
        <span style={{ fontSize: '10px', color: '#4a5a6a' }}>{projects.length}</span>
      </div>

      {/* Projects header — click to go to 3D view + toggle */}
      <button
        className={`nav-item ${activeView === 'projects' ? 'active' : ''}`}
        onClick={() => {
          setActiveView('projects');
          setProjectsExpanded(!projectsExpanded);
        }}
      >
        <span className="icon">🪐</span>
        <span className="label">Overview</span>
        <span style={{
          fontSize: '10px', color: '#4a5a6a', marginLeft: 'auto',
          transition: 'transform 0.2s',
          transform: projectsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
        }}>
          ▶
        </span>
      </button>

      {/* Collapsible sub-items */}
      <div style={{
        overflow: 'hidden',
        maxHeight: projectsExpanded ? '200px' : '0',
        transition: 'max-height 0.25s ease',
      }}>
        {projectSubItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
            style={{ paddingLeft: '28px' }}
          >
            <span className="icon" style={{ fontSize: '13px' }}>{item.icon}</span>
            <span className="label">{item.label}</span>
            {item.id === 'chat' && openChats.length > 0 && (
              <span className="badge-count">{openChats.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Top-level items ── */}
      <div className="nav-section" style={{ marginTop: '8px' }}>Tools</div>

      {topLevelItems.map(item => (
        <button
          key={item.id}
          className={`nav-item ${activeView === item.id ? 'active' : ''}`}
          onClick={() => setActiveView(item.id)}
        >
          <span className="icon">{item.icon}</span>
          <span className="label">{item.label}</span>
        </button>
      ))}

      {/* ── Sessions ── */}
      <div className="nav-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
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
