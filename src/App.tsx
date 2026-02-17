import { useEffect, useState } from 'react';
import { Scene } from './components/scene/Scene';
import { TopBar } from './components/hud/TopBar';
import { ProjectDetail } from './components/hud/ProjectDetail';
import { LogsView } from './components/hud/LogsView';
import { InsightsView } from './components/hud/InsightsView';
import { SettingsView } from './components/hud/SettingsView';
import { ChatPanel } from './components/hud/ChatPanel';
import { TerminalView } from './components/hud/TerminalView';
import ProjectCards from './components/hud/ProjectCards';
import { MainLayout } from './components/layout/MainLayout';
import type { View } from './components/layout/Sidebar';
import { useStore } from './store';

function App() {
  const init = useStore(s => s.init);
  const tick = useStore(s => s.tick);
  const [activeView, setActiveView] = useState<View>('projects');
  const [projectsSubView, setProjectsSubView] = useState<'solar' | 'cards'>('cards');

  useEffect(() => {
    init();
    const interval = setInterval(tick, 3000);
    return () => clearInterval(interval);
  }, [init, tick]);

  return (
    <MainLayout activeView={activeView} onChangeView={setActiveView}>
      {/* 3D scene renders behind for solar view */}
      {activeView === 'projects' && projectsSubView === 'solar' && (
        <div className="absolute inset-0">
          <Scene />
        </div>
      )}

      {/* View content */}
      <div className="relative h-full">
        {/* Projects view with sub-view toggle */}
        {activeView === 'projects' && (
          <div className="h-full flex flex-col">
            {/* Sub-view toggle */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 shrink-0">
              <span className="text-sm text-gray-500 mr-2">View:</span>
              <button
                onClick={() => setProjectsSubView('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  projectsSubView === 'cards' 
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
              >📋 Cards</button>
              <button
                onClick={() => setProjectsSubView('solar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  projectsSubView === 'solar' 
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
              >🪐 Solar System</button>
            </div>
            <div className="flex-1 overflow-auto">
              {projectsSubView === 'cards' && <ProjectCards />}
              {projectsSubView === 'solar' && <ProjectDetail />}
            </div>
          </div>
        )}

        {activeView === 'insights' && <InsightsView />}
        {activeView === 'logs' && <LogsView />}
        {activeView === 'settings' && <SettingsView />}
        {activeView === 'terminal' && <TerminalView />}
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
