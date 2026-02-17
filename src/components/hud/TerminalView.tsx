import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Tab {
  id: string;
  sessionId: string;
  name: string;
  terminal: Terminal | null;
  fitAddon: FitAddon | null;
  ws: WebSocket | null;
}

export function TerminalView() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const tabCounter = useRef(0);

  const createTab = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/terminal`, { method: 'POST' });
      const { sessionId } = await res.json();
      tabCounter.current++;
      const id = `tab-${Date.now()}`;
      const tab: Tab = {
        id,
        sessionId,
        name: `Terminal ${tabCounter.current}`,
        terminal: null,
        fitAddon: null,
        ws: null,
      };
      setTabs(prev => [...prev, tab]);
      setActiveTab(id);
    } catch (err) {
      console.error('Failed to create terminal session:', err);
    }
  }, []);

  const closeTab = useCallback(async (tabId: string) => {
    setTabs(prev => {
      const tab = prev.find(t => t.id === tabId);
      if (tab) {
        tab.ws?.close();
        tab.terminal?.dispose();
        fetch(`${API_BASE}/api/v1/terminal/${tab.sessionId}`, { method: 'DELETE' }).catch(() => {});
      }
      const remaining = prev.filter(t => t.id !== tabId);
      return remaining;
    });
    setActiveTab(prev => {
      if (prev === tabId) {
        const remaining = tabs.filter(t => t.id !== tabId);
        return remaining.length > 0 ? remaining[remaining.length - 1].id : null;
      }
      return prev;
    });
  }, [tabs]);

  // Initialize terminal when active tab changes
  useEffect(() => {
    if (!activeTab || !termRef.current) return;
    const tab = tabs.find(t => t.id === activeTab);
    if (!tab) return;

    // Hide all terminals
    const container = termRef.current;
    Array.from(container.children).forEach(c => (c as HTMLElement).style.display = 'none');

    // Check if already initialized
    let termEl = container.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement;
    if (termEl) {
      termEl.style.display = 'block';
      tab.fitAddon?.fit();
      return;
    }

    // Create new terminal
    termEl = document.createElement('div');
    termEl.setAttribute('data-tab', activeTab);
    termEl.style.width = '100%';
    termEl.style.height = '100%';
    container.appendChild(termEl);

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"Fira Code", "Cascadia Code", monospace',
      fontSize: 14,
      theme: {
        background: '#0a0a2e',
        foreground: '#33ff77',
        cursor: '#00f0ff',
        cursorAccent: '#0a0a2e',
        selectionBackground: '#00f0ff30',
        black: '#0a0a2e',
        red: '#ff3355',
        green: '#33ff77',
        yellow: '#ffcc00',
        blue: '#00f0ff',
        magenta: '#ff33ff',
        cyan: '#00f0ff',
        white: '#e0e0e0',
        brightBlack: '#4a5a6a',
        brightRed: '#ff5577',
        brightGreen: '#55ff99',
        brightYellow: '#ffdd33',
        brightBlue: '#33ccff',
        brightMagenta: '#ff55ff',
        brightCyan: '#33ffff',
        brightWhite: '#ffffff',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termEl);
    fitAddon.fit();

    // WebSocket
    const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProto}//${location.host}/ws/terminal/${tab.sessionId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Send initial size
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    };

    ws.onmessage = (e) => {
      term.write(e.data);
    };

    ws.onclose = () => {
      term.write('\r\n\x1b[31m[Session ended]\x1b[0m\r\n');
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    // Update tab ref
    tab.terminal = term;
    tab.fitAddon = fitAddon;
    tab.ws = ws;

    // Resize handler
    const onResize = () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeTab, tabs]);

  // Auto-create first tab
  useEffect(() => {
    if (tabs.length === 0) createTab();
  }, []);

  return (
    <div className="fixed inset-0 z-20 flex flex-col" style={{ top: '48px', bottom: '64px', background: '#0a0a2e' }}>
      {/* Tab bar */}
      <div className="flex items-center gap-0 px-2 py-1 overflow-x-auto shrink-0"
           style={{ background: 'rgba(8,12,28,0.98)', borderBottom: '1px solid rgba(0,240,255,0.15)' }}>
        {tabs.map(tab => (
          <div key={tab.id}
               className="flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs tracking-wider shrink-0"
               style={{
                 fontFamily: 'Orbitron, sans-serif',
                 color: activeTab === tab.id ? '#00f0ff' : '#4a5a6a',
                 background: activeTab === tab.id ? 'rgba(0,240,255,0.08)' : 'transparent',
                 borderBottom: activeTab === tab.id ? '2px solid #00f0ff' : '2px solid transparent',
               }}
               onClick={() => setActiveTab(tab.id)}>
            <span>🖥️ {tab.name}</span>
            <span className="ml-1 hover:text-red-400 text-[10px]"
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}>✕</span>
          </div>
        ))}
        <button onClick={createTab}
                className="px-3 py-1.5 text-xs tracking-wider hover:text-cyan-300"
                style={{ fontFamily: 'Orbitron, sans-serif', color: '#4a5a6a' }}>
          + NEW
        </button>
      </div>

      {/* Terminal container */}
      <div ref={termRef} className="flex-1 overflow-hidden" style={{ padding: '4px' }} />
    </div>
  );
}
