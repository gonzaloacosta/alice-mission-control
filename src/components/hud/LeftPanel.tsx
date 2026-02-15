import { useStore } from '../../store';
import type { AgentState } from '../../types';
import { STATE_COLORS } from '../../types';

const STATES: (AgentState | 'all')[] = ['all', 'running', 'idle', 'warning', 'error', 'recovery'];
const CLUSTERS = ['all', 'core', 'alpha', 'beta', 'gamma', 'delta'];

export function LeftPanel() {
  const filterState = useStore(s => s.filterState);
  const filterCluster = useStore(s => s.filterCluster);
  const searchQuery = useStore(s => s.searchQuery);
  const showLinks = useStore(s => s.showLinks);
  const quality = useStore(s => s.quality);
  const setFilterState = useStore(s => s.setFilterState);
  const setFilterCluster = useStore(s => s.setFilterCluster);
  const setSearchQuery = useStore(s => s.setSearchQuery);
  const toggleLinks = useStore(s => s.toggleLinks);
  const setQuality = useStore(s => s.setQuality);

  return (
    <div className="fixed top-16 left-3 z-20 w-52 rounded-lg overflow-hidden"
         style={{ background: 'rgba(8,12,28,0.92)', border: '1px solid rgba(0,240,255,0.12)', backdropFilter: 'blur(16px)' }}>

      {/* Search */}
      <div className="p-3 border-b border-cyan-900/20">
        <input
          type="text"
          placeholder="Search agent..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border border-cyan-900/30 rounded px-2 py-1.5 text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-cyan-500/50"
          style={{ fontFamily: 'Share Tech Mono, monospace' }}
        />
      </div>

      {/* State filter */}
      <div className="p-3 border-b border-cyan-900/20">
        <div className="text-[9px] text-gray-600 tracking-widest mb-2">STATE</div>
        <div className="flex flex-wrap gap-1">
          {STATES.map(s => (
            <button
              key={s}
              onClick={() => setFilterState(s)}
              className="px-2 py-0.5 rounded text-[10px] tracking-wider transition-all"
              style={{
                background: filterState === s ? `${s === 'all' ? '#00f0ff' : STATE_COLORS[s as AgentState]}20` : 'transparent',
                border: `1px solid ${filterState === s ? (s === 'all' ? '#00f0ff' : STATE_COLORS[s as AgentState]) + '40' : 'rgba(0,240,255,0.08)'}`,
                color: filterState === s ? (s === 'all' ? '#00f0ff' : STATE_COLORS[s as AgentState]) : '#5a6a7a',
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Cluster filter */}
      <div className="p-3 border-b border-cyan-900/20">
        <div className="text-[9px] text-gray-600 tracking-widest mb-2">CLUSTER</div>
        <div className="flex flex-wrap gap-1">
          {CLUSTERS.map(c => (
            <button
              key={c}
              onClick={() => setFilterCluster(c)}
              className="px-2 py-0.5 rounded text-[10px] tracking-wider transition-all"
              style={{
                background: filterCluster === c ? 'rgba(0,240,255,0.1)' : 'transparent',
                border: `1px solid ${filterCluster === c ? 'rgba(0,240,255,0.3)' : 'rgba(0,240,255,0.08)'}`,
                color: filterCluster === c ? '#00f0ff' : '#5a6a7a',
              }}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="p-3">
        <div className="text-[9px] text-gray-600 tracking-widest mb-2">DISPLAY</div>
        <label className="flex items-center gap-2 text-[11px] text-gray-400 cursor-pointer mb-2">
          <input type="checkbox" checked={showLinks} onChange={toggleLinks} className="accent-cyan-400" />
          Network Links
        </label>
        <div className="text-[9px] text-gray-600 tracking-widest mb-1 mt-2">QUALITY</div>
        <div className="flex gap-1">
          {(['low', 'medium', 'high'] as const).map(q => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className="px-2 py-0.5 rounded text-[10px] tracking-wider"
              style={{
                background: quality === q ? 'rgba(0,240,255,0.1)' : 'transparent',
                border: `1px solid ${quality === q ? 'rgba(0,240,255,0.3)' : 'rgba(0,240,255,0.08)'}`,
                color: quality === q ? '#00f0ff' : '#5a6a7a',
              }}
            >
              {q.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
