import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import type { View } from './Sidebar';

interface MainLayoutProps {
  activeView: View;
  onChangeView: (v: View) => void;
  children: ReactNode;
}

export function MainLayout({ activeView, onChangeView, children }: MainLayoutProps) {
  return (
    <>
      <Sidebar activeView={activeView} onChangeView={onChangeView} />
      {children}
    </>
  );
}
