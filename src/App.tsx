import { useEffect, useState } from 'react';
import { Scene } from './components/scene/Scene';
import { TopBar } from './components/hud/TopBar';
import { RightPanel } from './components/hud/RightPanel';
import { LogsView } from './components/hud/LogsView';
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

      {/* HUD stats floating over 3D */}
      <TopBar />

      {/* Sidebar + layout */}
      <MainLayout activeView={activeView} onChangeView={setActiveView}>
        {/* Overlay views — shown over 3D scene */}
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
        {activeView === 'openclaw' && (
          <div className="overlay-view">
            <iframe
              src="/dashboard/"
              style={{ width: '100%', height: '100%', border: 'none', background: '#0a0a12' }}
              title="OpenClaw Dashboard"
            />
          </div>
        )}
      </MainLayout>

      {/* Right detail panel — slides in from right */}
      <RightPanel />

      {/* Chat panel — overlay in content area (right of sidebar) */}
      <ChatPanel />
    </>
  );
}

export default App;
