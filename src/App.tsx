import { useEffect, useState } from 'react';
import { Scene } from './components/scene/Scene';
import { TopBar } from './components/hud/TopBar';
import { RightPanel } from './components/hud/RightPanel';
import { LogsView } from './components/hud/LogsView';
import { SettingsView } from './components/hud/SettingsView';
import { ChatPanel } from './components/hud/ChatPanel';
import { TerminalView } from './components/hud/TerminalView';
import { NewsView } from './components/hud/NewsView';
import { KanbanView } from './components/hud/KanbanView';
import { RouteView } from './components/hud/RouteView';
import { IframeView } from './components/hud/IframeView';
import { OfficeView } from './components/hud/OfficeView';
import { TeamView } from './components/hud/TeamView';
import { MemoryView } from './components/hud/MemoryView';
import { CalendarView } from './components/hud/CalendarView';
import { TaskBoardView } from './components/hud/TaskBoardView';
import { NewProjectModal } from './components/hud/NewProjectModal';
import { BottomNav } from './components/hud/BottomNav';
import { ProjectsListView } from './components/hud/ProjectsListView';
import { MainLayout } from './components/layout/MainLayout';
import { useStore } from './store';

function App() {
  const init = useStore(s => s.init);
  const tick = useStore(s => s.tick);
  const activeView = useStore(s => s.activeView);
  const addProject = useStore(s => s.addProject);
  const focusedProjectId = useStore(s => s.focusedProjectId);
  const [showNewProject, setShowNewProject] = useState(false);

  useEffect(() => {
    init();
    const interval = setInterval(tick, 3000);
    return () => clearInterval(interval);
  }, [init, tick]);

  // Set CSS variable for detail panel width so overlay views shrink
  useEffect(() => {
    document.documentElement.style.setProperty('--detail-w', focusedProjectId ? '400px' : '0px');
  }, [focusedProjectId]);

  return (
    <>
      {/* 3D scene — always visible behind everything, right of sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 'var(--sidebar-w)',
        right: 'var(--detail-w, 0px)',
        bottom: 0,
        zIndex: 0,
        transition: 'right 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <Scene />
      </div>

      {/* HUD stats floating over 3D — on Overview and Projects views */}
      {(activeView === 'overview' || activeView === 'projects') && <TopBar />}

      {/* Sidebar + layout */}
      <MainLayout activeView={activeView} onNewProject={() => setShowNewProject(true)}>
        {/* Overlay views — shown over 3D scene */}
        {activeView === 'news' && (
          <div className="overlay-view">
            <NewsView />
          </div>
        )}
        {activeView === 'kanban' && (
          <div className="overlay-view">
            <KanbanView />
          </div>
        )}
        {activeView === 'logs' && (
          <div className="overlay-view">
            <LogsView />
          </div>
        )}
        {activeView === 'terminal' && (
          <div className="overlay-view">
            <TerminalView />
          </div>
        )}
        {activeView === 'route' && (
          <div className="overlay-view">
            <RouteView />
          </div>
        )}
        {activeView === 'settings' && (
          <div className="overlay-view">
            <SettingsView />
          </div>
        )}
        {activeView === 'observatory' && (
          <div className="view-container full">
            <IframeView src="/observatory/" title="K8s Observatory" />
          </div>
        )}
        {activeView === 'pki' && (
          <div className="view-container full">
            <IframeView src="/pki/" title="PKI Admin" />
          </div>
        )}
        {activeView === 'office' && (
          <div className="overlay-view">
            <OfficeView />
          </div>
        )}
        {activeView === 'team' && (
          <div className="overlay-view">
            <TeamView />
          </div>
        )}
        {activeView === 'memory' && (
          <div className="overlay-view">
            <MemoryView />
          </div>
        )}
        {activeView === 'calendar' && (
          <div className="overlay-view">
            <CalendarView />
          </div>
        )}
        {activeView === 'tasks' && (
          <div className="overlay-view">
            <TaskBoardView />
          </div>
        )}
        {activeView === 'chat' && (
          <div className="overlay-view">
            <ChatPanel />
          </div>
        )}
        {activeView === 'projects' && (
          <div className="overlay-view mobile-only">
            <ProjectsListView onNewProject={() => setShowNewProject(true)} />
          </div>
        )}
      </MainLayout>

      {/* Right detail panel — slides in from right */}
      <RightPanel />

      {/* Mobile bottom navigation */}
      <BottomNav />

      {/* New project modal */}
      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={(project) => addProject(project)}
        />
      )}
    </>
  );
}

export default App;
