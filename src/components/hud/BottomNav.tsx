import { useStore } from '../../store';
import type { View } from '../layout/Sidebar';

// Simple SVG icons for consistent rendering across platforms
const icons: Record<string, JSX.Element> = {
  projects: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3"/>
      <circle cx="12" cy="12" r="8" strokeDasharray="4 3"/>
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
  news: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="2"/>
      <path d="M12 2a10 10 0 0110 10"/>
      <path d="M12 6a6 6 0 016 6"/>
    </svg>
  ),
  terminal: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="4 17 10 11 4 5"/>
      <line x1="12" y1="19" x2="20" y2="19"/>
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
};

const mobileItems: { id: View; label: string }[] = [
  { id: 'projects', label: 'PROJECTS' },
  { id: 'kanban', label: 'BOARD' },
  { id: 'chat', label: 'CHAT' },
  { id: 'news', label: 'NEWS' },
  { id: 'terminal', label: 'TERMINAL' },
  { id: 'settings', label: 'MORE' },
];

export function BottomNav() {
  const activeView = useStore(s => s.activeView);
  const setActiveView = useStore(s => s.setActiveView);
  const openChats = useStore(s => s.openChats);

  return (
    <div id="mobile-nav">
      {mobileItems.map(item => {
        const active = activeView === item.id;
        return (
          <button
            key={item.id}
            className={`mobile-nav-item ${active ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <span className="icon">{icons[item.id]}</span>
            <span className="mobile-label">{item.label}</span>
            {item.id === 'chat' && openChats.length > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '4px',
                fontSize: '8px', background: 'rgba(0,240,255,0.2)',
                color: 'var(--cyan)', borderRadius: '50%',
                width: '14px', height: '14px', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {openChats.length}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
