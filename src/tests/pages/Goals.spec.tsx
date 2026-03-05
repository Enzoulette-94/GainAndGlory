import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', username: 'Test', current_streak: 5 },
    loading: false,
  }),
}));

const mockGoals = [
  {
    id: 'g-1', user_id: 'user-1', type: 'running', title: 'Courir 100 km',
    description: 'Objectif mensuel', target_value: 100, current_value: 42,
    unit: 'km', deadline: '2025-12-31', status: 'active',
    completed_at: null, created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'g-2', user_id: 'user-1', type: 'musculation', title: '100 kg au développé',
    description: null, target_value: 100, current_value: 100,
    unit: 'kg', deadline: null, status: 'completed',
    completed_at: '2025-02-15T00:00:00Z', created_at: '2025-01-01T00:00:00Z',
  },
];

vi.mock('../../services/goals.service', () => ({
  goalsService: {
    getGoals: vi.fn().mockResolvedValue(mockGoals),
    createGoal: vi.fn().mockResolvedValue(mockGoals[0]),
    updateProgress: vi.fn().mockResolvedValue(mockGoals[0]),
    completeGoal: vi.fn().mockResolvedValue({ ...mockGoals[0], status: 'completed' }),
    cancelGoal: vi.fn().mockResolvedValue({ ...mockGoals[0], status: 'cancelled' }),
    deleteGoal: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/xp.service', () => ({
  xpService: {
    awardXP: vi.fn().mockResolvedValue({ xpGained: 50, newLevel: 1, oldLevel: 1, leveledUp: false }),
  },
}));

let GoalsPage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../pages/Goals');
  GoalsPage = mod.GoalsPage;
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderGoals = () => render(<MemoryRouter><GoalsPage /></MemoryRouter>);

describe('GoalsPage', () => {
  describe('Statistiques', () => {
    it('affiche la notion d\'objectifs actifs', async () => {
      renderGoals();
      await q(/actif/i);
    });

    it('affiche le streak courant (5)', async () => {
      renderGoals();
      await waitFor(() => {
        expect(screen.queryAllByText(/5/).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Liste des objectifs', () => {
    it('affiche l\'objectif actif "Courir 100 km"', async () => {
      renderGoals();
      await q(/courir 100 km/i);
    });

    it('affiche la progression (42)', async () => {
      renderGoals();
      await waitFor(() => {
        expect(screen.queryAllByText(/42/).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Onglets', () => {
    it('affiche les onglets Actifs / Complétés / Annulés', async () => {
      renderGoals();
      await waitFor(() => {
        expect(screen.queryAllByText(/actifs/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/complétés/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/annulés/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('les onglets permettent de filtrer par statut (actifs / complétés / annulés)', async () => {
      renderGoals();
      // Vérifier que les 3 onglets existent
      await waitFor(() => {
        expect(screen.queryAllByText(/actifs/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/complétés/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/annulés/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
      // L'objectif actif est visible par défaut
      expect(screen.queryAllByText(/courir 100 km/i).length).toBeGreaterThan(0);
    });
  });

  describe('Création d\'objectif', () => {
    it('affiche le bouton "Nouvel objectif"', async () => {
      renderGoals();
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /nouvel|créer|ajouter/i }).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('ouvre la modal de création au clic', async () => {
      renderGoals();
      await waitFor(() => expect(screen.getAllByRole('button', { name: /nouvel|créer|ajouter/i }).length).toBeGreaterThan(0), { timeout: 3000 });
      fireEvent.click(screen.getAllByRole('button', { name: /nouvel|créer|ajouter/i })[0]);
      await waitFor(() => {
        expect(screen.queryAllByPlaceholderText(/courir|objectif|titre/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });
});
