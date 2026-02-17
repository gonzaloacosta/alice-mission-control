import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const THEME = {
  background: '#0a0a12',
  foreground: '#c8d8e8',
  cursor: '#00f0ff',
  cursorAccent: '#0a0a12',
  selectionBackground: 'rgba(0, 240, 255, 0.2)',
  selectionForeground: '#ffffff',
  black: '#0a0a12',
  red: '#ff3355',
  green: '#00ff88',
  yellow: '#ffcc00',
  blue: '#4488ff',
  magenta: '#aa44ff',
  cyan: '#00f0ff',
  white: '#c8d8e8',
  brightBlack: '#4a5a6a',
  brightRed: '#ff3355',
  brightGreen: '#00ff88',
  brightYellow: '#ffcc00',
  brightBlue: '#4488ff',
  brightMagenta: '#aa44ff',
  brightCyan: '#00f0ff',
  brightWhite: '#ffffff',
};

// ── Types ──────────────────────────────────────────────────

interface PaneNode {
  type: 'pane';
  id: string;
  sessionId: string;
}

interface SplitNode {
  type: 'split';
  direction: 'horizontal' | 'vertical';
  ratio: number; // 0-1
  first: LayoutNode;
  second: LayoutNode;
}

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

function insertSplit(
  node: LayoutNode,
  targetPaneId: string,
  newPane: PaneNode,
  direction: 'horizontal' | 'vertical'
): LayoutNode {
  if (node.type === 'pane') {
    if (node.id === targetPaneId) {
      return { type: 'split', direction, ratio: 0.5, first: node, second: newPane };
    }
    return node;
  }
  return {
    ...node,
    first: insertSplit(node.first, targetPaneId, newPane, direction),
    second: insertSplit(node.second, targetPaneId, newPane, direction),
  };
}

function updateRatio(node: LayoutNode, splitId: string, ratio: number): LayoutNode {
  if (node.type === 'pane') return node;
  // We identify splits by their children, so we pass an id from the drag handler
  // Actually we'll use a ref-based approach in the component
  return {
    ...node,
    ratio: node === (node as SplitNode) ? ratio : node.ratio,
    first: updateRatio(node.first, splitId, ratio),
    second: updateRatio(node.second, splitId, ratio),
  };
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

// ── Pane Component ─────────────────────────────────────────

function TerminalPane({
  pane,
  isActive,
  sessions,
  onFocus,
  onSplitRight,
  onSplitDown,
  onClose,
  onSessionReady,
  canClose,
}: {
  pane: PaneNode;
  isActive: boolean;
  sessions: React.MutableRefObject<Map<string, PaneSession>>;
  onFocus: () => void;
  onSplitRight: () => void;
  onSplitDown: () => void;
  onClose: () => void;
  onSessionReady: (paneId: string, session: PaneSession) => void;
  canClose: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check if we already have a session (re-mount after split)
    const existing = sessions.current.get(pane.id);
    if (existing) {
      // Re-attach existing terminal to new DOM container
      containerRef.current.innerHTML = '';
      existing.terminal.open(containerRef.current);
      const xtermScreen = containerRef.current.querySelector('.xterm-screen') as HTMLElement;
      if (xtermScreen) xtermScreen.style.padding = '8px';
      const xtermViewport = containerRef.current.querySelector('.xterm-viewport') as HTMLElement;
      if (xtermViewport) xtermViewport.style.padding = '8px';
      setTimeout(() => existing.fitAddon.fit(), 50);
      return; // No cleanup — session persists
    }

    if (initialized.current) return;
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

    const ws = connectWs(pane.sessionId);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    };

    ws.onmessage = (e) => term.write(e.data);
    ws.onclose = () => term.write('\r\n\x1b[90m[Session ended]\x1b[0m\r\n');

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    term.onSelectionChange(() => {
      const sel = term.getSelection();
      if (sel) navigator.clipboard.writeText(sel).catch(() => {});
    });

    const session: PaneSession = { terminal: term, fitAddon, ws, sessionId: pane.sessionId };
    onSessionReady(pane.id, session);

    // No cleanup on unmount — sessions are managed by the parent (handleClosePane / closeTab)
  }, [pane.sessionId, pane.id]);

  // Fit on visibility/resize
  useEffect(() => {
    const session = sessions.current.get(pane.id);
    if (!session) return;
    const fit = () => {
      session.fitAddon.fit();
      if (session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(JSON.stringify({ type: 'resize', cols: session.terminal.cols, rows: session.terminal.rows }));
      }
    };
    const ro = new ResizeObserver(() => setTimeout(fit, 20));
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [pane.id]);

  const handleCopy = () => {
    const session = sessions.current.get(pane.id);
    if (session) {
      const sel = session.terminal.getSelection();
      if (sel) navigator.clipboard.writeText(sel).catch(() => {});
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#0a0a12',
        border: isActive ? '1px solid rgba(0,240,255,0.3)' : '1px solid rgba(0,240,255,0.08)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
      onClick={onFocus}
    >
      {/* Pane toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2px 8px',
          background: 'rgba(0,240,255,0.03)',
          borderBottom: '1px solid rgba(0,240,255,0.08)',
          minHeight: '28px',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '11px', color: '#4a5a6a', fontFamily: 'Share Tech Mono, monospace' }}>
          ● {pane.sessionId.slice(0, 8)}
        </span>
        <div style={{ display: 'flex', gap: '2px' }}>
          <ToolbarBtn label="⇥" title="Split Right" onClick={onSplitRight} />
          <ToolbarBtn label="⇩" title="Split Down" onClick={onSplitDown} />
          <ToolbarBtn label="⎘" title="Copy" onClick={handleCopy} />
          {canClose && <ToolbarBtn label="✕" title="Close" onClick={onClose} danger />}
        </div>
      </div>

      {/* Terminal */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: 'hidden' }}
      />
    </div>
  );
}

// ── Toolbar Button ─────────────────────────────────────────

function ToolbarBtn({ label, title, onClick, danger }: { label: string; title: string; onClick: () => void; danger?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? (danger ? 'rgba(255,51,85,0.15)' : 'rgba(0,240,255,0.08)') : 'transparent',
        border: 'none',
        color: hover ? (danger ? '#ff3355' : '#00f0ff') : '#4a5a6a',
        cursor: 'pointer',
        fontSize: '12px',
        padding: '2px 6px',
        borderRadius: '3px',
        lineHeight: 1,
        fontFamily: 'sans-serif',
      }}
    >
      {label}
    </button>
  );
}

// ── Draggable Divider ──────────────────────────────────────

function Divider({
  direction,
  onDrag,
}: {
  direction: 'horizontal' | 'vertical';
  onDrag: (delta: number, total: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startPos = direction === 'horizontal' ? e.clientX : e.clientY;
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const totalSize = direction === 'horizontal' ? parent.clientWidth : parent.clientHeight;

    const onMove = (ev: MouseEvent) => {
      const currentPos = direction === 'horizontal' ? ev.clientX : ev.clientY;
      onDrag(currentPos - startPos, totalSize);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      style={{
        flexShrink: 0,
        background: 'rgba(0,240,255,0.08)',
        ...(direction === 'horizontal'
          ? { width: '4px', cursor: 'col-resize' }
          : { height: '4px', cursor: 'row-resize' }),
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,240,255,0.3)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,240,255,0.08)')}
    />
  );
}

// ── Layout Renderer ────────────────────────────────────────

function LayoutRenderer({
  node,
  sessions,
  activePaneId,
  onFocusPane,
  onSplit,
  onClosePane,
  onRatioChange,
  onSessionReady,
  totalPanes,
}: {
  node: LayoutNode;
  sessions: React.MutableRefObject<Map<string, PaneSession>>;
  activePaneId: string;
  onFocusPane: (id: string) => void;
  onSplit: (paneId: string, dir: 'horizontal' | 'vertical') => void;
  onClosePane: (paneId: string) => void;
  onRatioChange: (node: SplitNode, newRatio: number) => void;
  onSessionReady: (paneId: string, session: PaneSession) => void;
  totalPanes: number;
}) {
  const ratioRef = useRef(0);

  if (node.type === 'pane') {
    return (
      <TerminalPane
        pane={node}
        isActive={node.id === activePaneId}
        sessions={sessions}
        onFocus={() => onFocusPane(node.id)}
        onSplitRight={() => onSplit(node.id, 'horizontal')}
        onSplitDown={() => onSplit(node.id, 'vertical')}
        onClose={() => onClosePane(node.id)}
        onSessionReady={onSessionReady}
        canClose={totalPanes > 1}
      />
    );
  }

  const split = node;
  ratioRef.current = split.ratio;

  const handleDrag = (delta: number, total: number) => {
    const newRatio = Math.max(0.15, Math.min(0.85, ratioRef.current + delta / total));
    onRatioChange(split, newRatio);
  };

  const isH = split.direction === 'horizontal';

  return (
    <div style={{ display: 'flex', flexDirection: isH ? 'row' : 'column', width: '100%', height: '100%' }}>
      <div style={{ [isH ? 'width' : 'height']: `calc(${split.ratio * 100}% - 2px)`, overflow: 'hidden' }}>
        <LayoutRenderer
          node={split.first}
          sessions={sessions}
          activePaneId={activePaneId}
          onFocusPane={onFocusPane}
          onSplit={onSplit}
          onClosePane={onClosePane}
          onRatioChange={onRatioChange}
          onSessionReady={onSessionReady}
          totalPanes={totalPanes}
        />
      </div>
      <Divider direction={split.direction} onDrag={handleDrag} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <LayoutRenderer
          node={split.second}
          sessions={sessions}
          activePaneId={activePaneId}
          onFocusPane={onFocusPane}
          onSplit={onSplit}
          onClosePane={onClosePane}
          onRatioChange={onRatioChange}
          onSessionReady={onSessionReady}
          totalPanes={totalPanes}
        />
      </div>
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
        id: tabId,
        name: `Terminal ${tabCounter.current}`,
        layout: { type: 'pane', id: paneId, sessionId },
        activePaneId: paneId,
      };
      setTabs(prev => [...prev, tab]);
      setActiveTabId(tabId);
    } catch (err) {
      console.error('Failed to create terminal:', err);
    }
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const tab = prev.find(t => t.id === tabId);
      if (tab) {
        // Cleanup all panes in this tab
        for (const p of collectPanes(tab.layout)) {
          const s = sessions.current.get(p.id);
          if (s) {
            s.ws.close();
            s.terminal.dispose();
            deleteSession(s.sessionId);
            sessions.current.delete(p.id);
          }
        }
      }
      const remaining = prev.filter(t => t.id !== tabId);
      return remaining;
    });
    setActiveTabId(prev => {
      if (prev !== tabId) return prev;
      const remaining = tabs.filter(t => t.id !== tabId);
      return remaining.length > 0 ? remaining[remaining.length - 1].id : null;
    });
  }, [tabs]);

  const handleSplit = useCallback(async (paneId: string, direction: 'horizontal' | 'vertical') => {
    try {
      const sessionId = await createSession();
      const newPaneId = `pane-${Date.now()}`;
      const newPane: PaneNode = { type: 'pane', id: newPaneId, sessionId };

      setTabs(prev => prev.map(tab => {
        if (tab.id !== activeTabId) return tab;
        return {
          ...tab,
          layout: insertSplit(tab.layout, paneId, newPane, direction),
          activePaneId: newPaneId,
        };
      }));
    } catch (err) {
      console.error('Failed to split:', err);
    }
  }, [activeTabId]);

  const handleClosePane = useCallback((paneId: string) => {
    // Cleanup session
    const s = sessions.current.get(paneId);
    if (s) {
      s.ws.close();
      s.terminal.dispose();
      deleteSession(s.sessionId);
      sessions.current.delete(paneId);
    }

    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab;
      const newLayout = removePaneFromLayout(tab.layout, paneId);
      if (!newLayout) return tab; // shouldn't happen
      const panes = collectPaneIds(newLayout);
      return {
        ...tab,
        layout: newLayout,
        activePaneId: panes.includes(tab.activePaneId) ? tab.activePaneId : panes[0],
      };
    }));
  }, [activeTabId]);

  const handleFocusPane = useCallback((paneId: string) => {
    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId ? { ...tab, activePaneId: paneId } : tab
    ));
    // Focus the terminal
    const s = sessions.current.get(paneId);
    if (s) s.terminal.focus();
  }, [activeTabId]);

  const handleRatioChange = useCallback((targetNode: SplitNode, newRatio: number) => {
    // Deep update the ratio for the specific split node
    const updateNode = (node: LayoutNode): LayoutNode => {
      if (node.type === 'pane') return node;
      if (node === targetNode) return { ...node, ratio: newRatio };
      return { ...node, first: updateNode(node.first), second: updateNode(node.second) };
    };
    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId ? { ...tab, layout: updateNode(tab.layout) } : tab
    ));
  }, [activeTabId]);

  const handleSessionReady = useCallback((paneId: string, session: PaneSession) => {
    sessions.current.set(paneId, session);
  }, []);

  // Auto-create first tab
  useEffect(() => {
    if (tabs.length === 0) createTab();
  }, []);

  // When no tabs remain, create one
  useEffect(() => {
    if (tabs.length === 0 && tabCounter.current > 0) createTab();
  }, [tabs.length]);

  const totalPanes = activeTab ? collectPaneIds(activeTab.layout).length : 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      background: '#0a0a12',
      fontFamily: 'Share Tech Mono, monospace',
    }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(8,12,28,0.98)',
        borderBottom: '1px solid rgba(0,240,255,0.15)',
        minHeight: '36px',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', flex: 1, overflow: 'auto' }}>
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onClick={() => setActiveTabId(tab.id)}
              onClose={() => closeTab(tab.id)}
              canClose={tabs.length > 1}
            />
          ))}
        </div>
        <button
          onClick={createTab}
          title="New Tab"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#4a5a6a',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px 12px',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#00f0ff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#4a5a6a')}
        >
          +
        </button>
      </div>

      {/* Layout area */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '2px' }}>
        {activeTab && (
          <LayoutRenderer
            key={activeTab.id}
            node={activeTab.layout}
            sessions={sessions}
            activePaneId={activeTab.activePaneId}
            onFocusPane={handleFocusPane}
            onSplit={handleSplit}
            onClosePane={handleClosePane}
            onRatioChange={handleRatioChange}
            onSessionReady={handleSessionReady}
            totalPanes={totalPanes}
          />
        )}
      </div>
    </div>
  );
}

// ── Tab Button ─────────────────────────────────────────────

function TabButton({
  tab,
  isActive,
  onClick,
  onClose,
  canClose,
}: {
  tab: TabData;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
  canClose: boolean;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        cursor: 'pointer',
        fontSize: '12px',
        color: isActive ? '#00f0ff' : '#4a5a6a',
        background: isActive ? 'rgba(0,240,255,0.08)' : 'transparent',
        borderBottom: isActive ? '2px solid #00f0ff' : '2px solid transparent',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      <span style={{ fontSize: '10px', color: isActive ? '#00ff88' : '#4a5a6a' }}>●</span>
      <span>{tab.name}</span>
      {canClose && (
        <span
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            fontSize: '10px',
            color: hover ? '#ff3355' : 'transparent',
            marginLeft: '4px',
            lineHeight: 1,
          }}
        >
          ✕
        </span>
      )}
    </div>
  );
}
