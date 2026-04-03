import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', username: 'Enzoulette' },
    loading: false,
  }),
}));

const mockChallenges = [{
  id: 'ch-1', created_by: 'user-2', title: 'Défi 500 km',
  description: 'Courir 500 km ensemble', type: 'distance',
  target_value: 500, unit: 'km', start_date: '2025-03-01', end_date: '2025-03-31',
  is_flash: false, status: 'active',
  creator: { username: 'Atlas' },
  participations: [{ user_id: 'user-2', contribution: 50, user: { username: 'Atlas', avatar_url: null } }],
}];

vi.mock('../../lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockChallenges, error: null }),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockChallenges[0], error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

let TeamGoalsPage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../pages/TeamGoals');
  TeamGoalsPage = mod.TeamGoalsPage;
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderTeamGoals = () => render(<MemoryRouter><TeamGoalsPage /></MemoryRouter>);

describe('TeamGoalsPage', () => {
  describe('Affichage général', () => {
    it('affiche le titre lié aux objectifs ou défis', async () => {
      renderTeamGoals();
      await q(/objectifs|équipe|défi/i);
    });

    it('affiche l\'onglet Actifs', async () => {
      renderTeamGoals();
      await q(/actif/i);
    });

    it('affiche la section "EN MISSION"', async () => {
      renderTeamGoals();
      await q(/mission/i);
    });

    it('affiche l\'onglet Créer', async () => {
      renderTeamGoals();
      await q(/créer/i);
    });

    it('affiche le défi "Défi 500 km" dans la section active', async () => {
      renderTeamGoals();
      await q(/500 km/i);
    });
  });

  describe('Onglet Créer', () => {
    it('affiche un champ titre dans le formulaire de création', async () => {
      renderTeamGoals();
      await waitFor(() => expect(screen.queryAllByText(/créer/i).length).toBeGreaterThan(0), { timeout: 3000 });
      fireEvent.click(screen.getAllByText(/créer/i)[0]);
      await waitFor(() => {
        expect(screen.queryAllByPlaceholderText(/titre|défi|objectif/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });
});
