import { useState, useEffect } from 'react';
import { useStore } from '../../store';

export type View = 'overview' | 'projects' | 'news' | 'logs' | 'kanban' | 'terminal' | 'settings' | 'chat' | 'route' | 'observatory' | 'pki' | 'office' | 'team' | 'memory' | 'calendar' | 'tasks';

interface SidebarProps {
  activeView: View;
  onNewProject?: () => void;
}

type ProjectNavGroup = {
  title: string;
  items: { id: View; label: string; icon: string }[];
};

const projectGroups: ProjectNavGroup[] = [
  {
    title: 'Workspace',
    items: [
      { id: 'office', label: 'Office', icon: '🏢' },
      { id: 'team', label: 'Team', icon: '👥' },
      { id: 'memory', label: 'Memory', icon: '🧠' },
    ],
  },
  {
    title: 'Planning',
    items: [
      { id: 'calendar', label: 'Calendar', icon: '📅' },
      { id: 'tasks', label: 'Task Board', icon: '📋' },
      { id: 'kanban', label: 'Kanban', icon: '📊' },
      { id: 'logs', label: 'Activity Log', icon: '📝' },
      { id: 'chat', label: 'Chat', icon: '💬' },
    ],
  },
];

const projectSubItems = projectGroups.flatMap((g) => g.items);

// Top-level nav items
const topLevelItems: { id: View; label: string; icon: string }[] = [
  { id: 'observatory', label: 'Kubiverse', icon: '🔭' },
  { id: 'news', label: 'News Feed', icon: '📡' },
  { id: 'route', label: 'Route Planner', icon: '🧭' },
  { id: 'terminal', label: 'Terminal', icon: '🖥️' },
  { id: 'pki', label: 'PKI Admin', icon: '🔐' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar({ activeView, onNewProject }: SidebarProps) {
  const [clock, setClock] = useState('');
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [toolsExpanded, setToolsExpanded] = useState(true);
  const [sessionsExpanded, setSessionsExpanded] = useState(true);
  const projects = useStore(s => s.projects);
  const selectedProjectId = useStore(s => s.selectedProjectId);
  const selectProject = useStore(s => s.selectProject);
  const focusProject = useStore(s => s.focusProject);
  const openChats = useStore(s => s.openChats);
  const setActiveView = useStore(s => s.setActiveView);

  // Auto-expand when a sub-item is active
  const isProjectSubView = projectSubItems.some(i => i.id === activeView) || activeView === 'projects';
  const isToolsView = topLevelItems.some(i => i.id === activeView);

  useEffect(() => {
    if (isProjectSubView) setProjectsExpanded(true);
  }, [isProjectSubView]);

  useEffect(() => {
    if (isToolsView) setToolsExpanded(true);
  }, [isToolsView]);

  useEffect(() => {
    if (selectedProjectId) setSessionsExpanded(true);
  }, [selectedProjectId]);

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
        <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>{projects.length}</span>
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
          fontSize: '10px', color: 'var(--muted-foreground)', marginLeft: 'auto',
          transition: 'transform 0.2s',
          transform: projectsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
        }}>
          ▶
        </span>
      </button>

      {/* Collapsible sub-items */}
      <div style={{
        overflow: 'hidden',
        maxHeight: projectsExpanded ? '520px' : '0',
        transition: 'max-height 0.25s ease',
      }}>
        {projectGroups.map((group) => (
          <div key={group.title}>
            <div style={{
              padding: '6px 12px 4px 28px',
              color: 'var(--muted-foreground)',
              fontSize: '10px',
              fontFamily: 'JetBrains Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {group.title}
            </div>
            {group.items.map(item => (
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
        ))}
      </div>

      {/* ── Tools (collapsible section) ── */}
      <div className="nav-section" style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Tools</span>
        <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>{topLevelItems.length}</span>
      </div>

      <button
        className={`nav-item ${isToolsView ? 'active' : ''}`}
        onClick={() => setToolsExpanded(!toolsExpanded)}
      >
        <span className="icon">🧰</span>
        <span className="label">Tools</span>
        <span style={{
          fontSize: '10px', color: 'var(--muted-foreground)', marginLeft: 'auto',
          transition: 'transform 0.2s',
          transform: toolsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
        }}>
          ▶
        </span>
      </button>

      <div style={{
        overflow: 'hidden',
        maxHeight: toolsExpanded ? '360px' : '0',
        transition: 'max-height 0.25s ease',
      }}>
        {topLevelItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
            style={{ paddingLeft: '28px' }}
          >
            <span className="icon" style={{ fontSize: '13px' }}>{item.icon}</span>
            <span className="label">{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── Sessions (collapsible section) ── */}
      <div className="nav-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <span>Sessions</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>{projects.length}</span>
          {onNewProject && (
            <button
              onClick={onNewProject}
              style={{
                background: 'rgba(125,207,255,0.1)', border: '1px solid rgba(125,207,255,0.25)',
                borderRadius: '4px', color: 'var(--cyan)', cursor: 'pointer',
                fontSize: '14px', lineHeight: '1', padding: '2px 6px',
                fontFamily: 'JetBrains Mono, monospace', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(125,207,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(125,207,255,0.1)'; }}
              title="Create new project"
            >
              +
            </button>
          )}
        </span>
      </div>

      <button
        className={`nav-item ${selectedProjectId ? 'active' : ''}`}
        onClick={() => setSessionsExpanded(!sessionsExpanded)}
      >
        <span className="icon">📁</span>
        <span className="label">Sessions</span>
        <span style={{
          fontSize: '10px', color: 'var(--muted-foreground)', marginLeft: 'auto',
          transition: 'transform 0.2s',
          transform: sessionsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
        }}>
          ▶
        </span>
      </button>

      <div className="sidebar-sessions" style={{ flex: 'unset', maxHeight: sessionsExpanded ? '240px' : '0', transition: 'max-height 0.25s ease' }}>
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
