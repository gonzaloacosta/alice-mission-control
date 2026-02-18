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
import { NewProjectModal } from './components/hud/NewProjectModal';
import { MainLayout } from './components/layout/MainLayout';
import { useStore } from './store';

function App() {
  const init = useStore(s => s.init);
  const tick = useStore(s => s.tick);
  const activeView = useStore(s => s.activeView);
  const addProject = useStore(s => s.addProject);
  const [showNewProject, setShowNewProject] = useState(false);

  useEffect(() => {
    init();
    const interval = setInterval(tick, 3000);
    return () => clearInterval(interval);
  }, [init, tick]);

  return (
    <>
      {/* 3D scene — always visible behind everything, right of sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 'var(--sidebar-w)',
        right: 0,
        bottom: 0,
        zIndex: 0,
      }}>
        <Scene />
      </div>

      {/* HUD stats floating over 3D — only on Projects view */}
      {activeView === 'projects' && <TopBar />}

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
        {activeView === 'settings' && (
          <div className="overlay-view">
            <SettingsView />
          </div>
        )}
        {activeView === 'chat' && (
          <div className="overlay-view">
            <ChatPanel />
          </div>
        )}
      </MainLayout>

      {/* Right detail panel — slides in from right */}
      <RightPanel />

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
