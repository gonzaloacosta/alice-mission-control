import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useStore } from '../../store';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: number;
  sessionId?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '';
const MIN_HEIGHT = 200;
const MAX_HEIGHT_RATIO = 0.85;

export function ChatPanel() {
  const {
    focusedProjectId,
    isChatOpen,
    selectedAgent,
    chatMessages,
    isStreaming,
    currentSessionId,
    closeChat,
    addChatMessage,
    setStreaming,
    setCurrentSession
  } = useStore();

  const [inputValue, setInputValue] = useState('');
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [panelHeight, setPanelHeight] = useState(() => Math.round(window.innerHeight * 0.5));
  const [isDragging, setIsDragging] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const focusedProject = useStore(s => s.projects.find(p => p.id === focusedProjectId));
  const currentMessages = focusedProjectId ? (chatMessages[focusedProjectId] || []) : [];

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Focus input
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isChatOpen]);

  // Reset panel height on open
  useEffect(() => {
    if (isChatOpen) {
      setPanelHeight(Math.round(window.innerHeight * 0.5));
    }
  }, [isChatOpen]);

  // Resize drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const maxH = window.innerHeight * MAX_HEIGHT_RATIO;
      const newHeight = Math.max(MIN_HEIGHT, Math.min(maxH, window.innerHeight - clientY));
      setPanelHeight(newHeight);
    };

    const handleUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !focusedProjectId || isStreaming) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: Date.now()
    };

    addChatMessage(focusedProjectId, userMessage);
    setInputValue('');
    setStreaming(true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/projects/${focusedProjectId}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage.content, agent: selectedAgent })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const data = await response.json();
      const sessionId = data.sessionId;
      setCurrentSession(sessionId);

      const wsUrl = `${API_BASE.replace('http', 'ws')}/ws/${sessionId}`;
      const ws = new WebSocket(wsUrl);
      setWsConnection(ws);

      let assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        type: 'assistant',
        content: '',
        timestamp: Date.now(),
        sessionId
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'stream':
            if (data.data.type === 'text' && data.data.text) {
              assistantMessage.content += data.data.text;
              addChatMessage(focusedProjectId, { ...assistantMessage });
            }
            break;
          case 'output':
            if (data.text) {
              assistantMessage.content += data.text;
              addChatMessage(focusedProjectId, { ...assistantMessage });
            }
            break;
          case 'error':
            addChatMessage(focusedProjectId, {
              id: `msg-${Date.now()}-error`, type: 'error',
              content: `Error: ${data.text}`, timestamp: Date.now(), sessionId
            });
            break;
          case 'done':
            setStreaming(false);
            setCurrentSession(null);
            ws.close();
            break;
        }
      };

      ws.onerror = () => {
        addChatMessage(focusedProjectId, {
          id: `msg-${Date.now()}-error`, type: 'error',
          content: 'Connection error occurred', timestamp: Date.now()
        });
        setStreaming(false);
        setCurrentSession(null);
      };

      ws.onclose = () => {
        setWsConnection(null);
        setStreaming(false);
        if (currentSessionId === sessionId) setCurrentSession(null);
      };

    } catch (error) {
      addChatMessage(focusedProjectId, {
        id: `msg-${Date.now()}-error`, type: 'error',
        content: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      });
      setStreaming(false);
    }
  };

  const handleStopStreaming = () => {
    if (wsConnection) wsConnection.close();
    if (currentSessionId) {
      fetch(`${API_BASE}/api/v1/sessions/${currentSessionId}/stop`, { method: 'POST' }).catch(console.error);
    }
    setStreaming(false);
    setCurrentSession(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isChatOpen || !focusedProject) return null;

  return (
    <div
      ref={panelRef}
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col"
      style={{ height: `${panelHeight}px` }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className={`h-2 cursor-ns-resize flex items-center justify-center group
          ${isDragging ? 'bg-[#00f0ff]/30' : 'hover:bg-[#00f0ff]/10'}`}
      >
        <div className="w-12 h-1 rounded-full bg-[#00f0ff]/40 group-hover:bg-[#00f0ff]/80 transition-colors" />
      </div>

      {/* Main panel */}
      <div className="flex-1 bg-[#0a0a2e]/95 backdrop-blur-md border-t border-[#00f0ff]/30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#00f0ff]/20 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: focusedProject.color, boxShadow: `0 0 8px ${focusedProject.color}` }}
            />
            <div>
              <h2 className="text-[#00f0ff] font-bold text-sm tracking-wider font-orbitron">
                {focusedProject.name}
              </h2>
              <p className="text-[#e0e0ff]/60 text-xs">
                {focusedProject.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedAgent && (
              <span className="text-[10px] px-2 py-0.5 rounded border font-mono"
                    style={{ borderColor: 'rgba(0,255,136,0.3)', color: '#00ff88', background: 'rgba(0,255,136,0.08)' }}>
                {selectedAgent}
              </span>
            )}
            <button
              onClick={() => {
                const newMax = !isMaximized;
                setIsMaximized(newMax);
                setPanelHeight(newMax ? Math.round(window.innerHeight * 0.92) : Math.round(window.innerHeight * 0.5));
              }}
              className="text-[#e0e0ff]/50 hover:text-[#00f0ff] text-xs px-2 py-1 rounded border border-[#00f0ff]/15 hover:border-[#00f0ff]/40 transition-colors"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? '⊟' : '⊞'}
            </button>
            <button
              onClick={closeChat}
              className="text-[#e0e0ff]/60 hover:text-[#00f0ff] text-xs font-mono px-2 py-1 rounded border border-[#00f0ff]/15 hover:border-[#00f0ff]/40 transition-colors"
              title="Back to project details"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {currentMessages.length === 0 && (
            <div className="text-[#e0e0ff]/40 text-center py-6">
              <p className="text-2xl mb-2">⚡</p>
              <p className="text-sm">Ask Claude Code about <span className="text-[#00f0ff]">{focusedProject.name}</span></p>
            </div>
          )}

          {currentMessages.map(message => (
            <div
              key={message.id}
              className={`p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-[#00f0ff]/10 border-l-4 border-[#00f0ff] ml-8'
                  : message.type === 'error'
                  ? 'bg-red-500/10 border-l-4 border-red-500'
                  : 'bg-[#1a1a3e]/50 border-l-4 border-[#00ff88] mr-8'
              }`}
            >
              <div className="text-xs text-[#e0e0ff]/40 mb-1">
                {message.type === 'user' ? 'You' : message.type === 'error' ? 'Error' : 'Claude Code'}
                {selectedAgent && message.type === 'user' && (
                  <span className="ml-1 text-[#00f0ff]">→ {selectedAgent}</span>
                )}
              </div>
              <div className={`text-sm font-mono ${
                message.type === 'error' ? 'text-red-400' : 'text-[#e0e0ff]'
              } ${message.type !== 'user' ? 'markdown-body' : 'whitespace-pre-wrap'}`}>
                {message.type === 'user' || message.type === 'error'
                  ? message.content
                  : <ReactMarkdown>{message.content}</ReactMarkdown>
                }
              </div>
            </div>
          ))}

          {isStreaming && currentMessages[currentMessages.length - 1]?.type !== 'assistant' && (
            <div className="bg-[#1a1a3e]/50 border-l-4 border-[#00ff88] mr-8 p-3 rounded-lg">
              <div className="text-xs text-[#e0e0ff]/40 mb-1">Claude Code</div>
              <div className="text-sm text-[#00ff88] font-mono flex items-center gap-2">
                <div className="animate-pulse">●</div>
                <span>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[#00f0ff]/15 shrink-0">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask about ${focusedProject.name}...`}
              disabled={isStreaming}
              className="flex-1 bg-[#1a1a3e] border border-[#00f0ff]/20 text-[#e0e0ff] px-3 py-2 rounded-lg focus:outline-none focus:border-[#00f0ff]/60 font-mono text-sm resize-none placeholder-[#e0e0ff]/30"
              rows={2}
            />
            {isStreaming ? (
              <button
                onClick={handleStopStreaming}
                className="px-4 bg-red-600/20 text-red-400 border border-red-400/30 rounded-lg hover:bg-red-600/30 font-mono text-sm transition-colors"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="px-4 bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/25 rounded-lg hover:bg-[#00f0ff]/25 disabled:opacity-30 disabled:cursor-not-allowed font-mono text-sm transition-colors"
              >
                Send
              </button>
            )}
          </div>
          <div className="text-[10px] text-[#e0e0ff]/30 mt-1">
            Enter to send · Shift+Enter for new line · Drag top edge to resize
          </div>
        </div>
      </div>
    </div>
  );
}
