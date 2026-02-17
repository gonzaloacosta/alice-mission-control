import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import type { View } from './Sidebar';

interface MainLayoutProps {
  activeView: View;
  children: ReactNode;
}

export function MainLayout({ activeView, children }: MainLayoutProps) {
  return (
    <>
      <Sidebar activeView={activeView} />
      {children}
    </>
  );
}
