import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import type { View } from './Sidebar';

interface MainLayoutProps {
  activeView: View;
  children: ReactNode;
  onNewProject?: () => void;
}

export function MainLayout({ activeView, children, onNewProject }: MainLayoutProps) {
  return (
    <>
      <Sidebar activeView={activeView} onNewProject={onNewProject} />
      {children}
    </>
  );
}
