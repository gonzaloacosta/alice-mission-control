import { useState, useEffect } from 'react';

export type View = 'projects' | 'insights' | 'logs' | 'terminal' | 'settings' | 'openclaw';

interface SidebarProps {
  activeView: View;
  onChangeView: (v: View) => void;
}

const navItems: { id: View; label: string; icon: string }[] = [
  { id: 'projects', label: 'Projects', icon: '🪐' },
  { id: 'insights', label: 'Insights', icon: '📊' },
  { id: 'logs', label: 'Logs', icon: '📋' },
  { id: 'terminal', label: 'Terminal', icon: '🖥️' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'openclaw', label: 'OpenClaw', icon: '🤖' },
];

export function Sidebar({ activeView, onChangeView }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const sidebarWidth = collapsed && !isMobile ? 64 : 240;

  const handleNav = (v: View) => {
    onChangeView(v);
    if (isMobile) setMobileOpen(false);
  };

  const sidebar = (
    <div
      className="h-full flex flex-col select-none"
      style={{
        width: isMobile ? 240 : sidebarWidth,
        minWidth: isMobile ? 240 : sidebarWidth,
        background: 'linear-gradient(180deg, #0a0f1a 0%, #060b14 100%)',
        borderRight: '1px solid rgba(0,240,255,0.1)',
        transition: 'width 0.25s ease, min-width 0.25s ease',
      }}
    >
      {/* Header */}
      <div className="flex items-center h-14 px-3 gap-3" style={{ borderBottom: '1px solid rgba(0,240,255,0.08)' }}>
        <button
          onClick={() => isMobile ? setMobileOpen(false) : setCollapsed(!collapsed)}
          className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-white/5 transition-colors text-gray-400 hover:text-cyan-400 flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        {(!collapsed || isMobile) && (
          <span
            className="font-bold text-sm tracking-[3px] whitespace-nowrap"
            style={{
              fontFamily: 'Orbitron, sans-serif',
              background: 'linear-gradient(90deg, #00f0ff, #4488ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              opacity: collapsed && !isMobile ? 0 : 1,
              transition: 'opacity 0.2s ease',
            }}
          >
            ALICE
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
        {navItems.map(item => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className="flex items-center gap-3 rounded-lg transition-all relative group"
              style={{
                padding: collapsed && !isMobile ? '10px 0' : '10px 12px',
                justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                background: active ? 'rgba(0,240,255,0.08)' : 'transparent',
                color: active ? '#00f0ff' : '#7a8a9a',
                borderLeft: active ? '3px solid #00f0ff' : '3px solid transparent',
                fontSize: '14px',
              }}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-lg flex-shrink-0 w-6 text-center">{item.icon}</span>
              {(!collapsed || isMobile) && (
                <span
                  className="whitespace-nowrap font-medium tracking-wide"
                  style={{
                    fontFamily: 'Share Tech Mono, monospace',
                    opacity: collapsed && !isMobile ? 0 : 1,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  {item.label}
                </span>
              )}
              {/* Tooltip when collapsed */}
              {collapsed && !isMobile && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded text-xs bg-gray-900 text-gray-200 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
                     style={{ border: '1px solid rgba(0,240,255,0.15)' }}>
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User info at bottom */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          borderTop: '1px solid rgba(0,240,255,0.08)',
          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #00f0ff30, #4488ff30)', color: '#00f0ff', border: '1px solid rgba(0,240,255,0.2)' }}
        >
          G
        </div>
        {(!collapsed || isMobile) && (
          <div style={{ opacity: collapsed && !isMobile ? 0 : 1, transition: 'opacity 0.2s ease' }}>
            <div className="text-sm text-gray-300 font-medium" style={{ fontFamily: 'Share Tech Mono, monospace' }}>Gonzalo</div>
            <div className="text-[10px] text-gray-600">Mission Commander</div>
          </div>
        )}
      </div>
    </div>
  );

  // Mobile: hamburger button + overlay
  if (isMobile) {
    return (
      <>
        {!mobileOpen && (
          <button
            onClick={() => setMobileOpen(true)}
            className="fixed top-3 left-3 z-50 w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
            style={{ background: 'rgba(10,15,26,0.9)', border: '1px solid rgba(0,240,255,0.15)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="relative z-50" style={{ animation: 'slideIn 0.2s ease' }}>
              {sidebar}
            </div>
          </div>
        )}
      </>
    );
  }

  return sidebar;
}
