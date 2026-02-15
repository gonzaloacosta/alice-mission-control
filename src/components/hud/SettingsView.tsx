import { useStore } from '../../store';

export function SettingsView() {
  const quality = useStore(s => s.quality);
  const paused = useStore(s => s.paused);
  const setQuality = useStore(s => s.setQuality);
  const togglePause = useStore(s => s.togglePause);

  return (
    <div className="fixed top-14 left-0 right-0 bottom-16 z-25 overflow-y-auto"
         style={{ background: 'rgba(8,12,28,0.96)', backdropFilter: 'blur(20px)' }}>
      <div className="px-4 py-3 border-b sticky top-0 z-10" style={{ borderColor: 'rgba(0,240,255,0.08)', background: 'rgba(8,12,28,0.98)' }}>
        <span className="text-[10px] text-gray-600 tracking-[3px] font-orbitron">SETTINGS</span>
      </div>

      <div className="p-4 space-y-6">
        {/* Quality */}
        <div>
          <div className="text-[9px] text-gray-600 tracking-[2px] mb-3">RENDER QUALITY</div>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map(q => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className="flex-1 py-2.5 rounded-lg text-[10px] tracking-wider font-orbitron transition-all"
                style={{
                  background: quality === q ? 'rgba(0,240,255,0.1)' : 'rgba(0,240,255,0.02)',
                  border: `1px solid ${quality === q ? 'rgba(0,240,255,0.3)' : 'rgba(0,240,255,0.06)'}`,
                  color: quality === q ? '#00f0ff' : '#5a6a7a',
                }}
              >
                {q.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="text-[9px] text-gray-700 mt-1.5">
            {quality === 'low' ? 'No postprocessing — best performance' :
             quality === 'medium' ? 'Bloom enabled — balanced' :
             'Bloom + Vignette + MSAA — best visuals'}
          </div>
        </div>

        {/* Simulation */}
        <div>
          <div className="text-[9px] text-gray-600 tracking-[2px] mb-3">SIMULATION</div>
          <button
            onClick={togglePause}
            className="w-full py-2.5 rounded-lg text-[10px] tracking-wider font-orbitron transition-all"
            style={{
              background: paused ? 'rgba(255,51,85,0.1)' : 'rgba(0,255,136,0.06)',
              border: `1px solid ${paused ? 'rgba(255,51,85,0.3)' : 'rgba(0,255,136,0.15)'}`,
              color: paused ? '#ff3355' : '#00ff88',
            }}
          >
            {paused ? '▶ RESUME SIMULATION' : '⏸ PAUSE SIMULATION'}
          </button>
        </div>

        {/* Links */}
        <div>
          <div className="text-[9px] text-gray-600 tracking-[2px] mb-3">LINKS</div>
          <div className="space-y-2">
            <a href="https://www.notion.so/Projects-3066ba8342198098afebf637fc5a24d6" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 p-3 rounded-lg text-[11px] text-gray-400 transition-all hover:text-cyan-400"
               style={{ background: 'rgba(0,240,255,0.02)', border: '1px solid rgba(0,240,255,0.06)' }}>
              📋 Notion — All Projects
            </a>
            <a href="https://github.com/gonzaloacosta" target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 p-3 rounded-lg text-[11px] text-gray-400 transition-all hover:text-cyan-400"
               style={{ background: 'rgba(0,240,255,0.02)', border: '1px solid rgba(0,240,255,0.06)' }}>
              ⚙️ GitHub — Repositories
            </a>
          </div>
        </div>

        {/* Version */}
        <div className="text-center text-[9px] text-gray-700 pt-4">
          Mission Control Pro v0.1.0 · OpenClaw
        </div>
      </div>
    </div>
  );
}
