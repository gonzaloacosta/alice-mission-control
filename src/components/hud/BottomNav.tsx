import { useStore } from '../../store';
import type { View } from '../layout/Sidebar';

const mobileItems: { id: View; label: string; icon: string }[] = [
  { id: 'projects', label: 'PROJECTS', icon: '🪐' },
  { id: 'kanban', label: 'BOARD', icon: '📊' },
  { id: 'chat', label: 'CHAT', icon: '💬' },
  { id: 'news', label: 'NEWS', icon: '📡' },
  { id: 'terminal', label: 'TERMINAL', icon: '🖥️' },
  { id: 'settings', label: 'MORE', icon: '⚙️' },
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
            <span className="icon">{item.icon}</span>
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
