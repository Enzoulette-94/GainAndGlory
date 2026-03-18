import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', username: 'Test', crossfit_level: 1, crossfit_xp: 0 },
    loading: false,
  }),
}));

const mockSessions = [
  {
    id: 's-1', user_id: 'user-1', date: '2025-03-05T10:00:00Z',
    name: 'Fran', feedback: 'mort', notes: null,
    wod_type: 'for_time',
    total_duration: null, round_duration: null, target_rounds: null,
    result_time: '6:30', result_reps: null, result_rounds: null,
    benchmark_name: null,
    exercises: [
      { name: 'Thruster', reps: 21, weight: 43, duration: null, notes: null },
      { name: 'Pull-up', reps: 21, weight: null, duration: null, notes: null },
    ],
    created_at: '2025-03-05T10:00:00Z',
  },
];

vi.mock('../../services/crossfit.service', () => ({
  crossfitService: {
    getSessions: vi.fn().mockResolvedValue(mockSessions),
    getSessionsCount: vi.fn().mockResolvedValue(1),
    deleteSession: vi.fn().mockResolvedValue(undefined),
  },
}));

let CrossfitPage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../pages/Crossfit');
  CrossfitPage = mod.CrossfitPage;
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderPage = () => render(<MemoryRouter><CrossfitPage /></MemoryRouter>);

describe('CrossfitPage', () => {
  describe('En-tête', () => {
    it('affiche le titre "Crossfit"', async () => {
      renderPage();
      await q(/crossfit/i);
    });

    it('affiche le lien vers une nouvelle séance', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getAllByRole('link', { name: /nouvelle|séance/i }).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Onglets', () => {
    it('affiche les 3 onglets (Séances, Graphiques, Records)', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.queryAllByText(/séances/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/graphiques/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/records/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Liste des séances', () => {
    it('affiche la séance "Fran"', async () => {
      renderPage();
      await q(/fran/i);
    });

    it('affiche le type WOD FOR TIME', async () => {
      renderPage();
      await q(/for.time/i);
    });
  });

  describe('Copie de séance', () => {
    it('affiche le bouton Copier sur chaque SessionCard', async () => {
      renderPage();
      await waitFor(() => {
        const btns = screen.queryAllByText(/copier/i);
        expect(btns.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });
});
