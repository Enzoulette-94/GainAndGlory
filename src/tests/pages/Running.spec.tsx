import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', username: 'Test', running_level: 2, running_xp: 80 },
    loading: false,
  }),
}));

const mockRuns = [{
  id: 'r-1', user_id: 'user-1', date: '2025-03-04T07:00:00Z',
  name: 'Sortie matinale', distance: 10, duration: 3000,
  pace_min_per_km: 5.0, run_type: 'endurance', feedback: 'facile', notes: 'Belle sortie',
}];

vi.mock('../../services/running.service', () => ({
  runningService: {
    getSessions: vi.fn().mockResolvedValue(mockRuns),
    getSessionsCount: vi.fn().mockResolvedValue(1),
    getTotalDistance: vi.fn().mockResolvedValue(10),
    getPersonalRecords: vi.fn().mockResolvedValue([]),
    getShoes: vi.fn().mockResolvedValue([]),
    deleteSession: vi.fn().mockResolvedValue(undefined),
    updateSession: vi.fn().mockResolvedValue(mockRuns[0]),
  },
}));

let RunningPage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../pages/Running');
  RunningPage = mod.RunningPage;
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderRunning = () => render(<MemoryRouter><RunningPage /></MemoryRouter>);

describe('RunningPage', () => {
  describe('En-tête', () => {
    it('affiche "course" ou "running" quelque part dans la page', async () => {
      renderRunning();
      await q(/course|running/i);
    });

    it('affiche le lien vers une nouvelle course', async () => {
      renderRunning();
      await waitFor(() => {
        expect(screen.getAllByRole('link', { name: /nouvelle|course/i }).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Statistiques', () => {
    it('affiche les statistiques (sorties, distance ou total)', async () => {
      renderRunning();
      await q(/sortie|distance|total/i);
    });
  });

  describe('Onglets', () => {
    it('affiche les 3 onglets : Sorties, Graphiques, Records', async () => {
      renderRunning();
      await waitFor(() => {
        expect(screen.queryAllByText(/sorties/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/graphiques/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/records/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche la course "Sortie matinale"', async () => {
      renderRunning();
      await q(/sortie matinale/i);
    });

    it('affiche la distance de la course', async () => {
      renderRunning();
      await waitFor(() => {
        expect(screen.queryAllByText(/10/).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Filtres', () => {
    it('affiche le filtre "Tous"', async () => {
      renderRunning();
      await q(/tous/i);
    });

    it('affiche le filtre "Endurance"', async () => {
      renderRunning();
      await q(/endurance/i);
    });
  });
});
