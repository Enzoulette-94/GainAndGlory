import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', username: 'Test', is_admin: false },
    loading: false,
  }),
}));

let MobileDrawer: any;
let SideNav: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../components/layout/Navigation');
  MobileDrawer = mod.MobileDrawer;
  SideNav = mod.SideNav;
});

const renderDrawer = (isOpen = true) =>
  render(<MemoryRouter><MobileDrawer isOpen={isOpen} onClose={vi.fn()} /></MemoryRouter>);
const renderSideNav = () => render(<MemoryRouter><SideNav /></MemoryRouter>);

describe('MobileDrawer', () => {
  it('affiche tous les liens quand ouvert', async () => {
    renderDrawer(true);
    await waitFor(() => {
      expect(screen.queryAllByText(/dashboard/i).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(/muscu/i).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(/course/i).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(/objectifs/i).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(/hall of fame/i).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(/profil/i).length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('n\'affiche rien quand fermé', async () => {
    renderDrawer(false);
    await waitFor(() => {
      expect(screen.queryAllByText(/dashboard/i).length).toBe(0);
    }, { timeout: 3000 });
  });

  it('appelle onClose au clic sur le bouton X', async () => {
    const onClose = vi.fn();
    render(<MemoryRouter><MobileDrawer isOpen={true} onClose={onClose} /></MemoryRouter>);
    await waitFor(() => expect(screen.queryAllByText(/gain & glory/i).length).toBeGreaterThan(0), { timeout: 3000 });
    const closeBtn = document.querySelector('button[aria-label]') as HTMLElement
      ?? document.querySelectorAll('button')[0] as HTMLElement;
    if (closeBtn) fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('SideNav', () => {
  it('affiche tous les liens sur desktop', async () => {
    renderSideNav();
    await waitFor(() => {
      expect(screen.queryAllByText(/gain & glory/i).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(/muscu/i).length).toBeGreaterThan(0);
      expect(screen.queryAllByText(/objectifs/i).length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });
});
