import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNav } from './BottomNav';

// Mock zustand store
const mockSetActiveView = vi.fn();
let mockActiveView = 'overview';
let mockOpenChats: string[] = [];

vi.mock('../../store', () => ({
  useStore: (selector: any) => {
    const state = {
      activeView: mockActiveView,
      setActiveView: mockSetActiveView,
      openChats: mockOpenChats,
    };
    return selector(state);
  },
}));

describe('BottomNav', () => {
  beforeEach(() => {
    mockActiveView = 'overview';
    mockOpenChats = [];
    mockSetActiveView.mockClear();
  });

  // --- Option A: Primary nav items ---

  it('renders 5 primary nav items: ORBIT, PROJECTS, NEWS, CHAT, MORE', () => {
    render(<BottomNav />);
    expect(screen.getByTestId('nav-overview')).toBeInTheDocument();
    expect(screen.getByTestId('nav-projects')).toBeInTheDocument();
    expect(screen.getByTestId('nav-news')).toBeInTheDocument();
    expect(screen.getByTestId('nav-chat')).toBeInTheDocument();
    expect(screen.getByTestId('nav-more')).toBeInTheDocument();
  });

  it('NEWS is a direct nav item (not inside tools sheet)', () => {
    render(<BottomNav />);
    const newsBtn = screen.getByTestId('nav-news');
    fireEvent.click(newsBtn);
    expect(mockSetActiveView).toHaveBeenCalledWith('news');
  });

  it('only one nav button is active at a time', () => {
    mockActiveView = 'projects';
    render(<BottomNav />);
    const activeItems = document.querySelectorAll('.mobile-nav-item.active');
    expect(activeItems.length).toBe(1);
  });

  it('tapping PROJECTS does NOT activate MORE', () => {
    render(<BottomNav />);
    const projectsBtn = screen.getByTestId('nav-projects');
    fireEvent.click(projectsBtn);
    const moreBtn = screen.getByTestId('nav-more');
    expect(moreBtn.classList.contains('active')).toBe(false);
  });

  // --- Option B: Grouped tools with sections ---

  it('MORE sheet has section headers: VIEWS and SYSTEM', () => {
    render(<BottomNav />);
    const moreBtn = screen.getByTestId('nav-more');
    fireEvent.click(moreBtn);
    expect(screen.getByText('VIEWS')).toBeInTheDocument();
    expect(screen.getByText('SYSTEM')).toBeInTheDocument();
  });

  it('MORE sheet does NOT contain News (promoted to primary nav)', () => {
    render(<BottomNav />);
    const moreBtn = screen.getByTestId('nav-more');
    fireEvent.click(moreBtn);
    const toolLabels = document.querySelectorAll('.tools-sheet-label');
    const labels = Array.from(toolLabels).map(el => el.textContent);
    expect(labels).not.toContain('News Feed');
  });

  it('tools sheet groups Kubiverse and Route under VIEWS', () => {
    render(<BottomNav />);
    const moreBtn = screen.getByTestId('nav-more');
    fireEvent.click(moreBtn);
    const viewsSection = screen.getByTestId('tools-section-views');
    expect(viewsSection).toBeInTheDocument();
    expect(viewsSection.textContent).toContain('Kubiverse');
    expect(viewsSection.textContent).toContain('Route');
  });

  it('tools sheet groups Terminal, PKI Admin, Settings under SYSTEM', () => {
    render(<BottomNav />);
    const moreBtn = screen.getByTestId('nav-more');
    fireEvent.click(moreBtn);
    const systemSection = screen.getByTestId('tools-section-system');
    expect(systemSection).toBeInTheDocument();
    expect(systemSection.textContent).toContain('Terminal');
    expect(systemSection.textContent).toContain('PKI Admin');
    expect(systemSection.textContent).toContain('Settings');
  });

  // --- data-testid coverage ---

  it('all nav buttons have data-testid attributes', () => {
    render(<BottomNav />);
    const navItems = document.querySelectorAll('#mobile-nav button');
    navItems.forEach(btn => {
      expect(btn.getAttribute('data-testid')).toBeTruthy();
    });
  });
});
