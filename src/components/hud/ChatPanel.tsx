import { useState, useEffect, useRef } from 'react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      className="overlay-view"
      style={{
        background: 'var(--panel)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        right: focusedProjectId ? '400px' : '0',
        transition: 'right 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
        {/* Header — aligned with sidebar brand */}
        <div className="detail-header" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="detail-close" onClick={closeChat}>←</button>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: focusedProject.color,
              boxShadow: `0 0 8px ${focusedProject.color}`,
            }} />
            <div>
              <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '14px', color: 'var(--cyan)', letterSpacing: '2px', margin: 0 }}>
                {focusedProject.name}
              </h2>
              <div style={{ fontSize: '10px', color: '#4a5a6a', marginTop: '2px' }}>
                {focusedProject.description}
              </div>
            </div>
          </div>

          {selectedAgent && (
            <span className="badge badge-active" style={{ fontSize: '10px' }}>
              {selectedAgent}
            </span>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {currentMessages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#4a5a6a' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
              <div style={{ fontSize: '12px', fontFamily: 'Share Tech Mono, monospace' }}>
                Ask Claude Code about <span style={{ color: 'var(--cyan)' }}>{focusedProject.name}</span>
              </div>
            </div>
          )}

          {currentMessages.map(message => (
            <div
              key={message.id}
              style={{
                padding: '12px 14px',
                borderRadius: '6px',
                marginBottom: '10px',
                borderLeft: `3px solid ${
                  message.type === 'user' ? 'var(--cyan)' :
                  message.type === 'error' ? 'var(--red)' : 'var(--green)'
                }`,
                background: message.type === 'user'
                  ? 'rgba(0,240,255,0.04)'
                  : message.type === 'error'
                  ? 'rgba(255,51,85,0.04)'
                  : 'rgba(0,255,136,0.04)',
                marginLeft: message.type === 'user' ? '40px' : '0',
                marginRight: message.type === 'assistant' ? '40px' : '0',
              }}
            >
              <div style={{ fontSize: '9px', color: '#4a5a6a', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
                {message.type === 'user' ? 'You' : message.type === 'error' ? 'Error' : 'Claude Code'}
                {selectedAgent && message.type === 'user' && (
                  <span style={{ color: 'var(--cyan)', marginLeft: '4px' }}>→ {selectedAgent}</span>
                )}
              </div>
              <div className={message.type !== 'user' ? 'markdown-body' : ''} style={{
                fontSize: '13px',
                fontFamily: 'Share Tech Mono, monospace',
                color: message.type === 'error' ? 'var(--red)' : '#c8d8e8',
                whiteSpace: message.type === 'user' ? 'pre-wrap' : undefined,
                lineHeight: '1.5',
              }}>
                {message.type === 'user' || message.type === 'error'
                  ? message.content
                  : <ReactMarkdown>{message.content}</ReactMarkdown>
                }
              </div>
            </div>
          ))}

          {isStreaming && currentMessages[currentMessages.length - 1]?.type !== 'assistant' && (
            <div style={{
              padding: '12px 14px', borderRadius: '6px', marginRight: '40px',
              borderLeft: '3px solid var(--green)', background: 'rgba(0,255,136,0.04)',
            }}>
              <div style={{ fontSize: '9px', color: '#4a5a6a', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>Claude Code</div>
              <div style={{ fontSize: '13px', color: 'var(--green)', fontFamily: 'Share Tech Mono, monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="live-dot" />
                <span>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          flexShrink: 0, padding: '12px 20px', borderTop: '1px solid var(--border)',
          background: 'rgba(8,12,28,0.98)',
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask about ${focusedProject.name}...`}
              disabled={isStreaming}
              rows={2}
              style={{
                flex: 1, background: 'rgba(0,240,255,0.03)', border: '1px solid var(--border)',
                color: '#c8d8e8', padding: '10px 12px', borderRadius: '6px', resize: 'none',
                fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', outline: 'none',
              }}
            />
            {isStreaming ? (
              <button
                onClick={handleStopStreaming}
                style={{
                  padding: '0 16px', background: 'rgba(255,51,85,0.1)', color: 'var(--red)',
                  border: '1px solid rgba(255,51,85,0.3)', borderRadius: '6px', cursor: 'pointer',
                  fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', letterSpacing: '1px',
                }}
              >
                STOP
              </button>
            ) : (
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                style={{
                  padding: '0 16px', background: 'rgba(0,240,255,0.1)', color: 'var(--cyan)',
                  border: '1px solid rgba(0,240,255,0.3)', borderRadius: '6px', cursor: 'pointer',
                  fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', letterSpacing: '1px',
                  opacity: inputValue.trim() ? 1 : 0.3,
                }}
              >
                SEND
              </button>
            )}
          </div>
          <div style={{ fontSize: '9px', color: '#3a4a5a', marginTop: '6px', letterSpacing: '1px' }}>
            ENTER TO SEND · SHIFT+ENTER FOR NEW LINE
          </div>
        </div>
    </div>
  );
}
