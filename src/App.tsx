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

      {/* HUD stats floating over 3D — only on Projects view */}
      {activeView === 'projects' && <TopBar />}

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
          <div className="overlay-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
              <h2 style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--cyan)', letterSpacing: '2px', marginBottom: '12px' }}>
                OPENCLAW ADMIN
              </h2>
              <p style={{ color: '#4a5a6a', fontSize: '12px', marginBottom: '24px' }}>
                Gateway control panel runs in a separate window
              </p>
              <a
                href="/openclaw-ui/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block', padding: '10px 24px',
                  background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)',
                  borderRadius: '6px', color: 'var(--cyan)', textDecoration: 'none',
                  fontFamily: 'Share Tech Mono, monospace', fontSize: '13px', letterSpacing: '1px',
                }}
              >
                OPEN ADMIN PANEL →
              </a>
            </div>
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
