import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const THEME = {
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  cursor: 'var(--cyan)',
  cursorAccent: 'var(--background)',
  selectionBackground: 'rgba(0, 240, 255, 0.2)',
  selectionForeground: 'var(--foreground)',
  black: 'var(--background)',
  red: 'var(--red)',
  green: 'var(--green)',
  yellow: 'var(--yellow)',
  blue: 'var(--blue)',
  magenta: 'var(--purple)',
  cyan: 'var(--cyan)',
  white: 'var(--foreground)',
  brightBlack: 'var(--muted-foreground)',
  brightRed: 'var(--red)',
  brightGreen: 'var(--green)',
  brightYellow: 'var(--yellow)',
  brightBlue: 'var(--blue)',
  brightMagenta: 'var(--purple)',
  brightCyan: 'var(--cyan)',
  brightWhite: 'var(--foreground)',
};

// ── Types ──────────────────────────────────────────────────

interface PaneNode { type: 'pane'; id: string; sessionId: string; }
interface SplitNode { type: 'split'; direction: 'horizontal' | 'vertical'; ratio: number; first: LayoutNode; second: LayoutNode; }
type LayoutNode = PaneNode | SplitNode;

interface TabData {
  id: string;
  name: string;
  layout: LayoutNode;
  activePaneId: string;
}

interface PaneSession {
  terminal: Terminal;
  fitAddon: FitAddon;
  ws: WebSocket;
  sessionId: string;
}

interface PaneRect { id: string; x: number; y: number; w: number; h: number; }

// ── Helpers ────────────────────────────────────────────────

function collectPaneIds(node: LayoutNode): string[] {
  if (node.type === 'pane') return [node.id];
  return [...collectPaneIds(node.first), ...collectPaneIds(node.second)];
}

function collectPanes(node: LayoutNode): PaneNode[] {
  if (node.type === 'pane') return [node];
  return [...collectPanes(node.first), ...collectPanes(node.second)];
}

function removePaneFromLayout(node: LayoutNode, paneId: string): LayoutNode | null {
  if (node.type === 'pane') return node.id === paneId ? null : node;
  const first = removePaneFromLayout(node.first, paneId);
  const second = removePaneFromLayout(node.second, paneId);
  if (!first) return second;
  if (!second) return first;
  return { ...node, first, second };
}

function insertSplit(node: LayoutNode, targetPaneId: string, newPane: PaneNode, direction: 'horizontal' | 'vertical'): LayoutNode {
  if (node.type === 'pane') {
    if (node.id === targetPaneId) {
      return { type: 'split', direction, ratio: 0.5, first: node, second: newPane };
    }
    return node;
  }
  return { ...node, first: insertSplit(node.first, targetPaneId, newPane, direction), second: insertSplit(node.second, targetPaneId, newPane, direction) };
}

// Compute absolute rects for all panes (0-1 normalized)
function computeRects(node: LayoutNode, x: number, y: number, w: number, h: number): PaneRect[] {
  if (node.type === 'pane') return [{ id: node.id, x, y, w, h }];
  const { direction, ratio, first, second } = node;
  const gap = 0.003; // small gap for divider
  if (direction === 'horizontal') {
    const fw = w * ratio - gap / 2;
    const sw = w * (1 - ratio) - gap / 2;
    const sx = x + w * ratio + gap / 2;
    return [...computeRects(first, x, y, fw, h), ...computeRects(second, sx, y, sw, h)];
  } else {
    const fh = h * ratio - gap / 2;
    const sh = h * (1 - ratio) - gap / 2;
    const sy = y + h * ratio + gap / 2;
    return [...computeRects(first, x, y, w, fh), ...computeRects(second, x, sy, w, sh)];
  }
}

// ── API ────────────────────────────────────────────────────

async function createSession(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/v1/terminal`, { method: 'POST' });
  const { sessionId } = await res.json();
  return sessionId;
}

function deleteSession(sessionId: string) {
  fetch(`${API_BASE}/api/v1/terminal/${sessionId}`, { method: 'DELETE' }).catch(() => {});
}

function connectWs(sessionId: string): WebSocket {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return new WebSocket(`${proto}//${location.host}/ws/terminal/${sessionId}`);
}

// ── Persistent Pane Component ──────────────────────────────
// This component never unmounts during splits — it's rendered flat in a list

function TerminalPane({
  paneId,
  sessionId,
  rect,
  isActive,
  sessions,
  onFocus,
  onSplitRight,
  onSplitDown,
  onClose,
  canClose,
}: {
  paneId: string;
  sessionId: string;
  rect: PaneRect;
  isActive: boolean;
  sessions: React.MutableRefObject<Map<string, PaneSession>>;
  onFocus: () => void;
  onSplitRight: () => void;
  onSplitDown: () => void;
  onClose: () => void;
  canClose: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !containerRef.current) return;
    initialized.current = true;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
      lineHeight: 1.4,
      theme: THEME,
      allowTransparency: true,
      scrollback: 10000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current!);

    const xtermScreen = containerRef.current!.querySelector('.xterm-screen') as HTMLElement;
    if (xtermScreen) xtermScreen.style.padding = '8px';
    const xtermViewport = containerRef.current!.querySelector('.xterm-viewport') as HTMLElement;
    if (xtermViewport) xtermViewport.style.padding = '8px';

    setTimeout(() => fitAddon.fit(), 50);

    const ws = connectWs(sessionId);
    ws.onopen = () => ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    ws.onmessage = (e) => term.write(e.data);
    ws.onclose = () => term.write('\r\n\x1b[90m[Session ended]\x1b[0m\r\n');
    term.onData((data) => { if (ws.readyState === WebSocket.OPEN) ws.send(data); });
    term.onSelectionChange(() => { const sel = term.getSelection(); if (sel) navigator.clipboard.writeText(sel).catch(() => {}); });

    sessions.current.set(paneId, { terminal: term, fitAddon, ws, sessionId });
    // No cleanup — sessions managed by parent
  }, [sessionId, paneId]);

  // Refit when rect changes
  useEffect(() => {
    const s = sessions.current.get(paneId);
    if (!s) return;
    const timer = setTimeout(() => {
      s.fitAddon.fit();
      if (s.ws.readyState === WebSocket.OPEN) {
        s.ws.send(JSON.stringify({ type: 'resize', cols: s.terminal.cols, rows: s.terminal.rows }));
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [rect.w, rect.h, paneId]);

  // Also refit on container resize
  useEffect(() => {
    const s = sessions.current.get(paneId);
    if (!s || !containerRef.current) return;
    const ro = new ResizeObserver(() => {
      setTimeout(() => {
        s.fitAddon.fit();
        if (s.ws.readyState === WebSocket.OPEN) {
          s.ws.send(JSON.stringify({ type: 'resize', cols: s.terminal.cols, rows: s.terminal.rows }));
        }
      }, 20);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [paneId]);

  return (
    <div
      onClick={onFocus}
      style={{
        position: 'absolute',
        left: `${rect.x * 100}%`,
        top: `${rect.y * 100}%`,
        width: `${rect.w * 100}%`,
        height: `${rect.h * 100}%`,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--background)',
        border: isActive ? '1px solid rgba(125,207,255,0.3)' : '1px solid rgba(125,207,255,0.08)',
        borderRadius: '4px',
        overflow: 'hidden',
        transition: 'left 0.2s, top 0.2s, width 0.2s, height 0.2s',
      }}
    >
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '2px 8px', background: 'rgba(125,207,255,0.03)',
        borderBottom: '1px solid rgba(125,207,255,0.08)', minHeight: '28px', flexShrink: 0,
      }}>
        <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace' }}>
          ● {sessionId.slice(0, 8)}
        </span>
        <div style={{ display: 'flex', gap: '2px' }}>
          <TBtn label="⇥" title="Split Right" onClick={onSplitRight} />
          <TBtn label="⇩" title="Split Down" onClick={onSplitDown} />
          {canClose && <TBtn label="✕" title="Close" onClick={onClose} danger />}
        </div>
      </div>
      <div ref={containerRef} style={{ flex: 1, overflow: 'hidden' }} />
    </div>
  );
}

function TBtn({ label, title, onClick, danger }: { label: string; title: string; onClick: () => void; danger?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button title={title} onClick={e => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? (danger ? 'rgba(247,118,142,0.15)' : 'rgba(125,207,255,0.08)') : 'transparent',
        border: 'none', color: hover ? (danger ? 'var(--red)' : 'var(--cyan)') : 'var(--muted-foreground)',
        cursor: 'pointer', fontSize: '12px', padding: '2px 6px', borderRadius: '3px', lineHeight: 1,
      }}
    >{label}</button>
  );
}

// ── Tab Button ─────────────────────────────────────────────

function TabButton({ tab, isActive, onClick, onClose, canClose }: {
  tab: TabData; isActive: boolean; onClick: () => void; onClose: () => void; canClose: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', cursor: 'pointer',
        fontSize: '12px', color: isActive ? 'var(--cyan)' : 'var(--muted-foreground)',
        background: isActive ? 'rgba(125,207,255,0.08)' : 'transparent',
        borderBottom: isActive ? '2px solid var(--cyan)' : '2px solid transparent',
        transition: 'all 0.15s', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      <span style={{ fontSize: '10px', color: isActive ? 'var(--green)' : 'var(--muted-foreground)' }}>●</span>
      <span>{tab.name}</span>
      {canClose && (
        <span onClick={e => { e.stopPropagation(); onClose(); }}
          style={{ fontSize: '10px', color: hover ? 'var(--red)' : 'transparent', marginLeft: '4px', lineHeight: 1 }}>✕</span>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────

export function TerminalView() {
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const tabCounter = useRef(0);
  const sessions = useRef<Map<string, PaneSession>>(new Map());

  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId) || null, [tabs, activeTabId]);

  const createTab = useCallback(async () => {
    try {
      const sessionId = await createSession();
      tabCounter.current++;
      const paneId = `pane-${Date.now()}`;
      const tabId = `tab-${Date.now()}`;
      const tab: TabData = {
        id: tabId, name: `Terminal ${tabCounter.current}`,
        layout: { type: 'pane', id: paneId, sessionId },
        activePaneId: paneId,
      };
      setTabs(prev => [...prev, tab]);
      setActiveTabId(tabId);
    } catch (err) { console.error('Failed to create terminal:', err); }
  }, []);

  const destroyPaneSession = useCallback((paneId: string) => {
    const s = sessions.current.get(paneId);
    if (s) {
      s.ws.close();
      s.terminal.dispose();
      deleteSession(s.sessionId);
      sessions.current.delete(paneId);
    }
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const tab = prev.find(t => t.id === tabId);
      if (tab) collectPanes(tab.layout).forEach(p => destroyPaneSession(p.id));
      return prev.filter(t => t.id !== tabId);
    });
    setActiveTabId(prev => {
      if (prev !== tabId) return prev;
      const remaining = tabs.filter(t => t.id !== tabId);
      return remaining.length > 0 ? remaining[remaining.length - 1].id : null;
    });
  }, [tabs, destroyPaneSession]);

  const handleSplit = useCallback(async (paneId: string, direction: 'horizontal' | 'vertical') => {
    try {
      const sessionId = await createSession();
      const newPaneId = `pane-${Date.now()}`;
      const newPane: PaneNode = { type: 'pane', id: newPaneId, sessionId };
      setTabs(prev => prev.map(tab => {
        if (tab.id !== activeTabId) return tab;
        return { ...tab, layout: insertSplit(tab.layout, paneId, newPane, direction), activePaneId: newPaneId };
      }));
    } catch (err) { console.error('Failed to split:', err); }
  }, [activeTabId]);

  const handleClosePane = useCallback((paneId: string) => {
    destroyPaneSession(paneId);
    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab;
      const newLayout = removePaneFromLayout(tab.layout, paneId);
      if (!newLayout) return tab;
      const panes = collectPaneIds(newLayout);
      return { ...tab, layout: newLayout, activePaneId: panes.includes(tab.activePaneId) ? tab.activePaneId : panes[0] };
    }));
  }, [activeTabId, destroyPaneSession]);

  const handleFocusPane = useCallback((paneId: string) => {
    setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, activePaneId: paneId } : tab));
    const s = sessions.current.get(paneId);
    if (s) s.terminal.focus();
  }, [activeTabId]);

  // Ratio change handling removed - not currently used

  useEffect(() => { if (tabs.length === 0) createTab(); }, []);
  useEffect(() => { if (tabs.length === 0 && tabCounter.current > 0) createTab(); }, [tabs.length]);

  // Compute pane rects for active tab
  const panes = activeTab ? collectPanes(activeTab.layout) : [];
  const rects = activeTab ? computeRects(activeTab.layout, 0, 0, 1, 1) : [];
  const rectMap = new Map(rects.map(r => [r.id, r]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: 'var(--background)', fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex', alignItems: 'center', background: 'rgba(36,40,59,0.98)',
        borderBottom: '1px solid rgba(125,207,255,0.15)', minHeight: '36px', flexShrink: 0, overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', flex: 1, overflow: 'auto' }}>
          {tabs.map(tab => (
            <TabButton key={tab.id} tab={tab} isActive={tab.id === activeTabId}
              onClick={() => setActiveTabId(tab.id)} onClose={() => closeTab(tab.id)} canClose={tabs.length > 1} />
          ))}
        </div>
        <button onClick={createTab} title="New Tab"
          style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', fontSize: '16px', padding: '4px 12px', lineHeight: 1 }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--cyan)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-foreground)')}
        >+</button>
      </div>

      {/* Panes area — all panes rendered flat with absolute positioning */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '2px' }}>
        {panes.map(pane => {
          const rect = rectMap.get(pane.id);
          if (!rect) return null;
          return (
            <TerminalPane
              key={pane.id}
              paneId={pane.id}
              sessionId={pane.sessionId}
              rect={rect}
              isActive={activeTab?.activePaneId === pane.id}
              sessions={sessions}
              onFocus={() => handleFocusPane(pane.id)}
              onSplitRight={() => handleSplit(pane.id, 'horizontal')}
              onSplitDown={() => handleSplit(pane.id, 'vertical')}
              onClose={() => handleClosePane(pane.id)}
              canClose={panes.length > 1}
            />
          );
        })}
      </div>
    </div>
  );
}
