import { ReactNode } from 'react';
import { Sidebar, View } from './Sidebar';

interface MainLayoutProps {
  activeView: View;
  onChangeView: (v: View) => void;
  children: ReactNode;
}

export function MainLayout({ activeView, onChangeView, children }: MainLayoutProps) {
  return (
    <div className="fixed inset-0 flex" style={{ zIndex: 10 }}>
      <Sidebar activeView={activeView} onChangeView={onChangeView} />
      <div className="flex-1 relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}
