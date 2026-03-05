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

let BottomNav: any;
let SideNav: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../components/layout/Navigation');
  BottomNav = mod.BottomNav;
  SideNav = mod.SideNav;
});

const renderBottomNav = () => render(<MemoryRouter><BottomNav /></MemoryRouter>);
const renderSideNav = () => render(<MemoryRouter><SideNav /></MemoryRouter>);

describe('BottomNav', () => {
  describe('Liens principaux', () => {
    it('affiche les 4 liens principaux', async () => {
      renderBottomNav();
      await waitFor(() => {
        expect(screen.queryAllByText(/dashboard/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/les monstres/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/muscu/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/course/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche le bouton "Plus"', async () => {
      renderBottomNav();
      await waitFor(() => {
        expect(screen.queryAllByText(/plus/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Drawer "Plus"', () => {
    it('ouvre le drawer au clic sur "Plus"', async () => {
      renderBottomNav();
      await waitFor(() => expect(screen.queryAllByText(/plus/i).length).toBeGreaterThan(0), { timeout: 3000 });
      fireEvent.click(screen.getAllByText(/plus/i)[0].closest('button')!);
      await waitFor(() => {
        expect(screen.queryAllByText(/menu/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche les liens secondaires dans le drawer', async () => {
      renderBottomNav();
      await waitFor(() => expect(screen.queryAllByText(/plus/i).length).toBeGreaterThan(0), { timeout: 3000 });
      fireEvent.click(screen.getAllByText(/plus/i)[0].closest('button')!);
      await waitFor(() => {
        expect(screen.queryAllByText(/objectifs/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/hall of fame/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/profil/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('ferme le drawer au clic sur X', async () => {
      renderBottomNav();
      await waitFor(() => expect(screen.queryAllByText(/plus/i).length).toBeGreaterThan(0), { timeout: 3000 });
      fireEvent.click(screen.getAllByText(/plus/i)[0].closest('button')!);
      await waitFor(() => expect(screen.queryAllByText(/menu/i).length).toBeGreaterThan(0), { timeout: 3000 });
      const closeBtn = document.querySelector('button[class*="text-\\[\\#6b6b6b\\]"]');
      if (closeBtn) fireEvent.click(closeBtn);
      await waitFor(() => {
        expect(screen.queryAllByText(/menu/i).length).toBe(0);
      }, { timeout: 3000 });
    });
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
