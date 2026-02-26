import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from '../../store';
import type { View } from '../layout/Sidebar';

// SVG icons for bottom nav and tools sheet
const icons: Record<string, React.ReactElement> = {
  overview: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3"/>
      <circle cx="12" cy="12" r="8" strokeDasharray="4 3"/>
    </svg>
  ),
  projects: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  kanban: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="5" height="18" rx="1"/>
      <rect x="10" y="3" width="5" height="12" rx="1"/>
      <rect x="17" y="3" width="5" height="15" rx="1"/>
    </svg>
  ),
  chat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  tools: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <circle cx="17.5" cy="17.5" r="3"/>
    </svg>
  ),
  observatory: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="10" r="3"/>
      <path d="M12 3v4M12 13v8M5 21h14"/>
      <path d="M8 10a4 4 0 018 0" strokeDasharray="3 2"/>
    </svg>
  ),
  news: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="2"/>
      <path d="M12 2a10 10 0 0110 10"/>
      <path d="M12 6a6 6 0 016 6"/>
    </svg>
  ),
  terminal: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="4 17 10 11 4 5"/>
      <line x1="12" y1="19" x2="20" y2="19"/>
    </svg>
  ),
  route: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="5" r="2"/>
      <path d="M12 7v4"/>
      <path d="M7 17l5-6 5 6"/>
      <line x1="5" y1="21" x2="19" y2="21"/>
    </svg>
  ),
  pki: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="11" width="14" height="10" rx="2"/>
      <path d="M12 3a4 4 0 00-4 4v4h8V7a4 4 0 00-4-4z"/>
      <circle cx="12" cy="16" r="1.5"/>
    </svg>
  ),
  settings: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
};

// Primary bottom nav items (reduced from 7 to 5 for better tap targets)
const mobileItems: { id: View | 'tools'; label: string }[] = [
  { id: 'overview', label: 'ORBIT' },
  { id: 'projects', label: 'PROJECTS' },
  { id: 'kanban', label: 'BOARD' },
  { id: 'chat', label: 'CHAT' },
  { id: 'tools' as any, label: 'TOOLS' },
];

// Tools available in the slide-up sheet
const toolItems: { id: View; label: string; desc: string }[] = [
  { id: 'observatory', label: 'Kubiverse', desc: 'Multi-cluster + AWS topology' },
  { id: 'news', label: 'News Feed', desc: 'Latest updates' },
  { id: 'route', label: 'Route Planner', desc: 'Network routes' },
  { id: 'terminal', label: 'Terminal', desc: 'System shell' },
  { id: 'pki', label: 'PKI Admin', desc: 'Certificate management' },
  { id: 'settings', label: 'Settings', desc: 'Preferences' },
];

const toolViewIds = new Set<string>(toolItems.map(t => t.id));

export function BottomNav() {
  const activeView = useStore(s => s.activeView);
  const setActiveView = useStore(s => s.setActiveView);
  const openChats = useStore(s => s.openChats);
  const [toolsOpen, setToolsOpen] = useState(false);

  // Close sheet when view changes (e.g. after selecting a tool)
  useEffect(() => {
    setToolsOpen(false);
  }, [activeView]);

  const isToolActive = toolViewIds.has(activeView);

  const handleNavClick = useCallback((id: View | 'tools') => {
    if (id === 'tools') {
      setToolsOpen(prev => !prev);
    } else {
      setToolsOpen(false);
      setActiveView(id as View);
    }
  }, [setActiveView]);

  const handleToolSelect = useCallback((id: View) => {
    setActiveView(id);
    setToolsOpen(false);
  }, [setActiveView]);

  return (
    <>
      {/* Tools sheet backdrop */}
      {toolsOpen && (
        <div
          className="tools-sheet-backdrop"
          onClick={() => setToolsOpen(false)}
        />
      )}

      {/* Tools slide-up sheet */}
      <div className={`tools-sheet ${toolsOpen ? 'open' : ''}`}>
        <div className="tools-sheet-handle" />
        <div className="tools-sheet-header">Tools</div>
        <div className="tools-sheet-grid">
          {toolItems.map(tool => {
            const active = activeView === tool.id;
            return (
              <button
                key={tool.id}
                className={`tools-sheet-item ${active ? 'active' : ''}`}
                onClick={() => handleToolSelect(tool.id)}
              >
                <span className="tools-sheet-icon">{icons[tool.id]}</span>
                <span className="tools-sheet-label">{tool.label}</span>
                <span className="tools-sheet-desc">{tool.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom navigation bar */}
      <div id="mobile-nav">
        {mobileItems.map(item => {
          const isTools = item.id === 'tools';
          const active = isTools
            ? (isToolActive || toolsOpen)
            : activeView === item.id;
          return (
            <button
              key={item.id}
              className={`mobile-nav-item ${active ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="icon">{icons[item.id]}</span>
              <span className="mobile-label">{item.label}</span>
              {item.id === 'chat' && openChats.length > 0 && (
                <span className="mobile-nav-badge">
                  {openChats.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
