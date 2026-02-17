import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useStore } from '../../store';

interface ApiProject {
  id: string;
  name: string;
  dir: string;
  agents: string[];
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: number;
  sessionId?: string;
}

// API base URL - use environment variable or default to same origin
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
    setSelectedAgent,
    addChatMessage,
    setStreaming,
    setCurrentSession
  } = useStore();

  const [inputValue, setInputValue] = useState('');
  const [projectData, setProjectData] = useState<ApiProject | null>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const focusedProject = useStore(s => s.projects.find(p => p.id === focusedProjectId));
  const currentMessages = focusedProjectId ? (chatMessages[focusedProjectId] || []) : [];

  // Fetch project data and agents from API
  useEffect(() => {
    if (!focusedProjectId) return;

    fetch(`${API_BASE}/api/v1/projects`)
      .then(res => res.json())
      .then(data => {
        const project = data.projects.find((p: ApiProject) => p.id === focusedProjectId);
        setProjectData(project || null);
      })
      .catch(error => {
        console.error('Error fetching project data:', error);
      });
  }, [focusedProjectId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Focus input when chat opens
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

    // Add user message immediately
    addChatMessage(focusedProjectId, userMessage);
    setInputValue('');
    setStreaming(true);

    try {
      // Send prompt to API
      const response = await fetch(`${API_BASE}/api/v1/projects/${focusedProjectId}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          agent: selectedAgent
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const sessionId = data.sessionId;
      setCurrentSession(sessionId);

      // Connect to WebSocket for streaming
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
            // Handle structured streaming output
            if (data.data.type === 'text' && data.data.text) {
              assistantMessage.content += data.data.text;
              addChatMessage(focusedProjectId, { ...assistantMessage });
            }
            break;
            
          case 'output':
            // Handle plain text output
            if (data.text) {
              assistantMessage.content += data.text;
              addChatMessage(focusedProjectId, { ...assistantMessage });
            }
            break;
            
          case 'error':
            // Handle error messages
            const errorMessage: ChatMessage = {
              id: `msg-${Date.now()}-error`,
              type: 'error',
              content: `Error: ${data.text}`,
              timestamp: Date.now(),
              sessionId
            };
            addChatMessage(focusedProjectId, errorMessage);
            break;
            
          case 'done':
            // Stream completed
            setStreaming(false);
            setCurrentSession(null);
            ws.close();
            break;
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        const errorMessage: ChatMessage = {
          id: `msg-${Date.now()}-error`,
          type: 'error',
          content: 'Connection error occurred',
          timestamp: Date.now()
        };
        addChatMessage(focusedProjectId, errorMessage);
        setStreaming(false);
        setCurrentSession(null);
      };

      ws.onclose = () => {
        setWsConnection(null);
        setStreaming(false);
        if (currentSessionId === sessionId) {
          setCurrentSession(null);
        }
      };

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        type: 'error',
        content: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      };
      addChatMessage(focusedProjectId, errorMessage);
      setStreaming(false);
    }
  };

  const handleStopStreaming = () => {
    if (wsConnection) {
      wsConnection.close();
    }
    if (currentSessionId) {
      fetch(`${API_BASE}/api/v1/sessions/${currentSessionId}/stop`, { method: 'POST' })
        .catch(console.error);
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
    <div className="fixed top-0 right-0 w-full md:w-[400px] h-full bg-[#0a0a2e]/90 backdrop-blur-sm border-l border-[#00f0ff]/20 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#00f0ff]/20">
        <div>
          <h2 className="text-[#00f0ff] font-bold text-lg tracking-wider font-orbitron">
            {focusedProject.name}
          </h2>
          <p className="text-[#e0e0ff] text-sm opacity-75">
            {focusedProject.description}
          </p>
        </div>
        <button
          onClick={closeChat}
          className="text-[#00f0ff] hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Agent Selector */}
      {projectData?.agents && projectData.agents.length > 0 && (
        <div className="p-3 border-b border-[#00f0ff]/10">
          <label className="block text-[#00f0ff] text-sm font-medium mb-2">Agent:</label>
          <select
            value={selectedAgent || ''}
            onChange={(e) => setSelectedAgent(e.target.value || null)}
            className="w-full bg-[#1a1a3e] border border-[#00f0ff]/30 text-[#e0e0ff] px-3 py-2 rounded focus:outline-none focus:border-[#00f0ff] font-mono text-sm"
          >
            <option value="">Default</option>
            {projectData.agents.map(agent => (
              <option key={agent} value={agent}>{agent}</option>
            ))}
          </select>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentMessages.length === 0 && (
          <div className="text-[#e0e0ff]/50 text-center py-8">
            <p className="mb-2">💬 Start a conversation</p>
            <p className="text-sm">Ask Claude Code about this project</p>
          </div>
        )}

        {currentMessages.map(message => (
          <div
            key={message.id}
            className={`p-3 rounded-lg ${
              message.type === 'user' 
                ? 'bg-[#00f0ff]/10 border-l-4 border-[#00f0ff] ml-4' 
                : message.type === 'error'
                ? 'bg-red-500/10 border-l-4 border-red-500'
                : 'bg-[#1a1a3e]/50 border-l-4 border-[#00ff88] mr-4'
            }`}
          >
            <div className="text-xs text-[#e0e0ff]/50 mb-1">
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

        {isStreaming && (
          <div className="bg-[#1a1a3e]/50 border-l-4 border-[#00ff88] mr-4 p-3 rounded-lg">
            <div className="text-xs text-[#e0e0ff]/50 mb-1">Claude Code</div>
            <div className="text-sm text-[#00ff88] font-mono flex items-center">
              <div className="animate-pulse">●</div>
              <span className="ml-2">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#00f0ff]/20">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Claude Code about this project..."
            disabled={isStreaming}
            className="flex-1 bg-[#1a1a3e] border border-[#00f0ff]/30 text-[#e0e0ff] px-3 py-2 rounded focus:outline-none focus:border-[#00f0ff] font-mono text-sm resize-none"
            rows={3}
          />
          {isStreaming ? (
            <button
              onClick={handleStopStreaming}
              className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-400/30 rounded hover:bg-red-600/30 focus:outline-none font-mono text-sm"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="px-4 py-2 bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 rounded hover:bg-[#00f0ff]/30 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
            >
              Send
            </button>
          )}
        </div>
        <div className="text-xs text-[#e0e0ff]/50 mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}