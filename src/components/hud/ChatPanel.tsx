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
    projects,
    openChats,
    activeChatKey,
    chatMessages,
    streamingChats,
    currentSessionId,
    closeChatTab,
    addChatMessage,
    setChatMessages,
    setStreamingForChat,
    setCurrentSession,
  } = useStore();

  const [inputValue, setInputValue] = useState('');
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get active chat details
  const activeChat = activeChatKey ? openChats.find(chat => {
    const chatKey = `${chat.projectId}:${chat.agentName || 'default'}`;
    return chatKey === activeChatKey;
  }) : null;

  const activeProject = activeChat ? projects.find(p => p.id === activeChat.projectId) : null;
  const isStreaming = activeChatKey ? (streamingChats[activeChatKey] || false) : false;
  const currentMessages = activeChatKey ? (chatMessages[activeChatKey] || []) : [];

  // Load chat history from API
  const loadChatHistory = async (projectId: string, agentName: string) => {
    if (!projectId || !agentName) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/chat/${projectId}/${agentName}`);
      if (response.ok) {
        const data = await response.json();
        const key = `${projectId}:${agentName}`;
        setChatMessages(key, data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Save message to API
  const saveMessageToAPI = async (projectId: string, agentName: string, role: string, content: string) => {
    try {
      await fetch(`${API_BASE}/api/v1/chat/${projectId}/${agentName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content })
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  // Load history when active chat changes
  useEffect(() => {
    if (activeChat && activeChatKey) {
      const agentName = activeChat.agentName || 'default';
      loadChatHistory(activeChat.projectId, agentName);
    }
  }, [activeChatKey]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Focus input when chat becomes active
  useEffect(() => {
    if (activeChatKey && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeChatKey]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeChat || !activeChatKey || isStreaming) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: Date.now()
    };

    addChatMessage(activeChatKey, userMessage);
    
    // Save user message to API
    const agentName = activeChat.agentName || 'default';
    await saveMessageToAPI(activeChat.projectId, agentName, 'user', userMessage.content);
    
    setInputValue('');
    setStreamingForChat(activeChatKey, true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/projects/${activeChat.projectId}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage.content, agent: activeChat.agentName })
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

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'stream':
            if (data.data.type === 'text' && data.data.text) {
              assistantMessage.content += data.data.text;
              addChatMessage(activeChatKey, { ...assistantMessage });
            }
            break;
          case 'output':
            if (data.text) {
              assistantMessage.content += data.text;
              addChatMessage(activeChatKey, { ...assistantMessage });
            }
            break;
          case 'error':
            const errorMessage = {
              id: `msg-${Date.now()}-error`, type: 'error' as const,
              content: `Error: ${data.text}`, timestamp: Date.now(), sessionId
            };
            addChatMessage(activeChatKey, errorMessage);
            await saveMessageToAPI(activeChat.projectId, agentName, 'error', errorMessage.content);
            break;
          case 'done':
            if (assistantMessage.content) {
              await saveMessageToAPI(activeChat.projectId, agentName, 'assistant', assistantMessage.content);
            }
            setStreamingForChat(activeChatKey, false);
            setCurrentSession(null);
            ws.close();
            break;
        }
      };

      ws.onerror = () => {
        addChatMessage(activeChatKey, {
          id: `msg-${Date.now()}-error`, type: 'error',
          content: 'Connection error occurred', timestamp: Date.now()
        });
        setStreamingForChat(activeChatKey, false);
        setCurrentSession(null);
      };

      ws.onclose = () => {
        setWsConnection(null);
        setStreamingForChat(activeChatKey, false);
        if (currentSessionId === sessionId) setCurrentSession(null);
      };

    } catch (error) {
      addChatMessage(activeChatKey, {
        id: `msg-${Date.now()}-error`, type: 'error',
        content: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      });
      setStreamingForChat(activeChatKey, false);
    }
  };

  const handleStopStreaming = () => {
    if (wsConnection) wsConnection.close();
    if (currentSessionId) {
      fetch(`${API_BASE}/api/v1/sessions/${currentSessionId}/stop`, { method: 'POST' }).catch(console.error);
    }
    if (activeChatKey) {
      setStreamingForChat(activeChatKey, false);
    }
    setCurrentSession(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTabClick = (chat: typeof openChats[0]) => {
    const chatKey = `${chat.projectId}:${chat.agentName || 'default'}`;
    useStore.setState({ activeChatKey: chatKey });
  };

  const handleCloseTab = (e: React.MouseEvent, chat: typeof openChats[0]) => {
    e.stopPropagation();
    const chatKey = `${chat.projectId}:${chat.agentName || 'default'}`;
    closeChatTab(chatKey);
  };

  // Empty state when no chats are open
  if (openChats.length === 0) {
    return (
      <div className="overlay-view" style={{
        background: 'var(--panel)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <h2 style={{ 
            fontFamily: 'Geist, sans-serif', 
            color: 'var(--cyan)', 
            letterSpacing: '2px', 
            marginBottom: '12px',
            fontSize: '18px'
          }}>
            MULTI-CHAT
          </h2>
          <p style={{ 
            color: 'var(--muted-foreground)', 
            fontSize: '14px', 
            marginBottom: '24px',
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            Open a chat from any project's agent list
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay-view" style={{
      background: 'var(--panel)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex', 
        flexShrink: 0, 
        overflowX: 'auto',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(36,40,59,0.6)',
      }}>
        {openChats.map(chat => {
          const project = projects.find(p => p.id === chat.projectId);
          const chatKey = `${chat.projectId}:${chat.agentName || 'default'}`;
          const isActive = activeChatKey === chatKey;
          const hasMsgs = (chatMessages[chatKey] || []).length > 0;
          const isStreamingInTab = streamingChats[chatKey] || false;
          
          return (
            <button
              key={chatKey}
              onClick={() => handleTabClick(chat)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                background: isActive ? 'rgba(125,207,255,0.08)' : 'transparent',
                borderBottom: isActive ? '2px solid var(--cyan)' : '2px solid transparent',
                border: 'none',
                borderRight: '1px solid rgba(125,207,255,0.04)',
                color: isActive ? 'var(--cyan)' : 'var(--muted-foreground)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                position: 'relative',
                minWidth: '120px',
              }}
            >
              {/* Project color indicator */}
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: project?.color || 'var(--cyan)',
                boxShadow: `0 0 6px ${project?.color || 'var(--cyan)'}`,
                flexShrink: 0,
              }} />
              
              {/* Tab label */}
              <span style={{ flex: 1, textAlign: 'left' }}>
                {project?.name || chat.projectId} / {chat.agentName || 'Default'}
              </span>
              
              {/* Indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isStreamingInTab && (
                  <span className="live-dot" style={{ width: '4px', height: '4px' }} />
                )}
                {hasMsgs && !isActive && (
                  <span style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'var(--cyan)',
                    flexShrink: 0,
                  }} />
                )}
              </div>
              
              {/* Close button */}
              <span
                onClick={(e) => handleCloseTab(e, chat)}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  opacity: 0.5,
                  transition: 'opacity 0.15s',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
              >
                ×
              </span>
            </button>
          );
        })}
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {isLoadingHistory && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted-foreground)' }}>
            <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
              Loading chat history...
            </div>
          </div>
        )}
        
        {!isLoadingHistory && currentMessages.length === 0 && activeChat && activeProject && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-foreground)' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
            <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
              Send a task to{' '}
              <span style={{ color: 'var(--cyan)' }}>
                {activeChat.agentName || 'Default Agent'}
              </span>
              {' '}on{' '}
              <span style={{ color: activeProject.color }}>
                {activeProject.name}
              </span>
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
                ? 'rgba(125,207,255,0.04)'
                : message.type === 'error'
                ? 'rgba(247,118,142,0.04)'
                : 'rgba(158,206,106,0.04)',
              marginLeft: message.type === 'user' ? '40px' : '0',
              marginRight: message.type === 'assistant' ? '40px' : '0',
            }}
          >
            <div style={{
              fontSize: '9px',
              color: 'var(--muted-foreground)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '6px'
            }}>
              {message.type === 'user' ? 'You' : 
               message.type === 'error' ? 'Error' : 
               (activeChat?.agentName || 'Claude Code')}
            </div>
            <div className={message.type !== 'user' ? 'markdown-body' : ''} style={{
              fontSize: '13px',
              fontFamily: 'JetBrains Mono, monospace',
              color: message.type === 'error' ? 'var(--red)' : 'var(--foreground)',
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
            padding: '12px 14px',
            borderRadius: '6px',
            marginRight: '40px',
            borderLeft: '3px solid var(--green)',
            background: 'rgba(158,206,106,0.04)',
          }}>
            <div style={{
              fontSize: '9px',
              color: 'var(--muted-foreground)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '6px'
            }}>
              {activeChat?.agentName || 'Claude Code'}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'var(--green)',
              fontFamily: 'JetBrains Mono, monospace',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span className="live-dot" />
              <span>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{
        flexShrink: 0,
        padding: '12px 20px',
        borderTop: '1px solid var(--border)',
        background: 'rgba(36,40,59,0.98)',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={activeChat ? 
              `Task for ${activeChat.agentName || 'Default Agent'} on ${projects.find(p => p.id === activeChat.projectId)?.name}...` :
              'Select a chat tab to send messages...'
            }
            disabled={isStreaming || !activeChat}
            rows={2}
            style={{
              flex: 1,
              background: 'rgba(125,207,255,0.03)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              padding: '10px 12px',
              borderRadius: '6px',
              resize: 'none',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              outline: 'none',
            }}
          />
          {isStreaming ? (
            <button onClick={handleStopStreaming} style={{
              padding: '0 16px',
              background: 'rgba(247,118,142,0.1)',
              color: 'var(--red)',
              border: '1px solid rgba(247,118,142,0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              letterSpacing: '1px',
            }}>STOP</button>
          ) : (
            <button 
              onClick={handleSendMessage} 
              disabled={!inputValue.trim() || !activeChat} 
              style={{
                padding: '0 16px',
                background: 'rgba(125,207,255,0.1)',
                color: 'var(--cyan)',
                border: '1px solid rgba(125,207,255,0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                letterSpacing: '1px',
                opacity: (inputValue.trim() && activeChat) ? 1 : 0.3,
              }}
            >SEND</button>
          )}
        </div>
        <div style={{
          fontSize: '9px',
          color: 'var(--border)',
          marginTop: '6px',
          letterSpacing: '1px'
        }}>
          ENTER TO SEND · SHIFT+ENTER FOR NEW LINE
        </div>
      </div>
    </div>
  );
}