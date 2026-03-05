import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: {
      id: 'user-1', username: 'Enzoulette', global_level: 2, total_xp: 90,
      musculation_level: 1, musculation_xp: 0, running_level: 1, running_xp: 50, current_streak: 3,
    },
    loading: false,
  }),
}));

vi.mock('../../services/workout.service', () => ({
  workoutService: {
    getSessions: vi.fn().mockResolvedValue([]),
    getSessionsCount: vi.fn().mockResolvedValue(2),
    getTotalTonnage: vi.fn().mockResolvedValue(0),
  },
}));

vi.mock('../../services/running.service', () => ({
  runningService: {
    getSessions: vi.fn().mockResolvedValue([]),
    getSessionsCount: vi.fn().mockResolvedValue(1),
    getTotalDistance: vi.fn().mockResolvedValue(10),
  },
}));

vi.mock('../../services/weight.service', () => ({
  weightService: {
    getLatest: vi.fn().mockResolvedValue(null),
    getEntries: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

let DashboardPage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../pages/Dashboard');
  DashboardPage = mod.DashboardPage;
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderDashboard = () => render(<MemoryRouter><DashboardPage /></MemoryRouter>);

describe('DashboardPage', () => {
  describe('Affichage général', () => {
    it('affiche le username "Enzoulette"', async () => {
      renderDashboard();
      await q(/enzoulette/i);
    });

    it('affiche la section "Cette semaine"', async () => {
      renderDashboard();
      await q(/cette semaine/i);
    });

    it('affiche la section "Actions rapides"', async () => {
      renderDashboard();
      await q(/actions rapides/i);
    });
  });

  describe('Actions rapides', () => {
    it('affiche le bouton "Séance muscu"', async () => {
      renderDashboard();
      await q(/séance muscu/i);
    });

    it('affiche le bouton "Nouvelle course"', async () => {
      renderDashboard();
      await q(/nouvelle course/i);
    });

    it('affiche le bouton "Peser"', async () => {
      renderDashboard();
      await q(/peser/i);
    });
  });

  describe('Barres XP', () => {
    it('affiche la section Global XP', async () => {
      renderDashboard();
      await q(/global/i);
    });

    it('affiche la section Musculation XP', async () => {
      renderDashboard();
      await q(/musculation/i);
    });

    it('affiche la section Course XP', async () => {
      renderDashboard();
      await waitFor(() => {
        expect(screen.queryAllByText(/course/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });
});
