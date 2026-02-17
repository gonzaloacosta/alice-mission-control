import { useEffect, useState } from 'react';
import { Scene } from './components/scene/Scene';
import { TopBar } from './components/hud/TopBar';
import { ProjectDetail } from './components/hud/ProjectDetail';
import { BottomNav } from './components/hud/BottomNav';
import { LogsView } from './components/hud/LogsView';
import { InsightsView } from './components/hud/InsightsView';
import { SettingsView } from './components/hud/SettingsView';
import { ChatPanel } from './components/hud/ChatPanel';
import { TerminalView } from './components/hud/TerminalView';
import { useStore } from './store';

type View = 'projects' | 'insights' | 'logs' | 'settings' | 'terminal';

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
    <>
      {/* 3D scene always renders behind */}
      <Scene />
      <TopBar />

      {/* View overlays */}
      {activeView === 'insights' && <InsightsView />}
      {activeView === 'logs' && <LogsView />}
      {activeView === 'settings' && <SettingsView />}
      {activeView === 'terminal' && <TerminalView />}

      {/* Project detail (only in projects view) */}
      {activeView === 'projects' && <ProjectDetail />}

      {/* Chat panel (available in all views) */}
      <ChatPanel />

      <BottomNav activeView={activeView} onChangeView={setActiveView} />
    </>
  );
}

export default App;
