import { useEffect, useState } from 'react';
import { Scene } from './components/scene/Scene';
import { TopBar } from './components/hud/TopBar';
import { ProjectDetail } from './components/hud/ProjectDetail';
import { LogsView } from './components/hud/LogsView';
import { InsightsView } from './components/hud/InsightsView';
import { SettingsView } from './components/hud/SettingsView';
import { ChatPanel } from './components/hud/ChatPanel';
import { TerminalView } from './components/hud/TerminalView';
import { MainLayout } from './components/layout/MainLayout';
import type { View } from './components/layout/Sidebar';
import { useStore } from './store';

function App() {
  const init = useStore(s => s.init);
  const tick = useStore(s => s.tick);
  const [activeView, setActiveView] = useState<View>('projects');

  useEffect(() => {
    init();
    const interval = setInterval(tick, 3000);
    return () => clearInterval(interval);
  }, [init, tick]);

  return (
    <MainLayout activeView={activeView} onChangeView={setActiveView}>
      {/* 3D scene always renders behind for projects view */}
      {activeView === 'projects' && (
        <div className="absolute inset-0">
          <Scene />
        </div>
      )}

      {/* TopBar as status bar within content area */}
      <TopBar />

      {/* View content */}
      <div className="relative h-full" style={{ paddingTop: '56px' }}>
        {activeView === 'insights' && <InsightsView />}
        {activeView === 'logs' && <LogsView />}
        {activeView === 'settings' && <SettingsView />}
        {activeView === 'terminal' && <TerminalView />}
        {activeView === 'projects' && <ProjectDetail />}
        {activeView === 'openclaw' && (
          <iframe
            src="/dashboard/"
            className="w-full h-full border-0"
            style={{ background: '#0a0a12' }}
            title="OpenClaw Dashboard"
          />
        )}
      </div>

      {/* Chat panel (available in all views) */}
      <ChatPanel />
    </MainLayout>
  );
}

export default App;
