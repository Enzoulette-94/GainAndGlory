import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', username: 'Test', calisthenics_level: 1, calisthenics_xp: 0 },
    loading: false,
  }),
}));

const mockSessions = [
  {
    id: 's-1', user_id: 'user-1', date: '2025-03-05T10:00:00Z',
    name: 'Upper body', feedback: 'difficile', notes: null,
    exercises: [
      { name: 'Pull-up', set_type: 'reps', sets: [{ reps: 10, hold_seconds: null }, { reps: 8, hold_seconds: null }] },
    ],
    skills_unlocked: ['pullup_10'],
    total_reps: 18,
    created_at: '2025-03-05T10:00:00Z',
  },
];

vi.mock('../../services/calisthenics.service', () => ({
  calisthenicsService: {
    getSessions: vi.fn().mockResolvedValue(mockSessions),
    getSessionsCount: vi.fn().mockResolvedValue(1),
    getTotalReps: vi.fn().mockResolvedValue(18),
    getUnlockedSkills: vi.fn().mockResolvedValue([{ id: 'sk-1', user_id: 'user-1', skill_code: 'pullup_10', unlocked_at: '2025-03-05T10:00:00Z' }]),
    deleteSession: vi.fn().mockResolvedValue(undefined),
  },
}));

let CalisthenicsPage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../pages/Calisthenics');
  CalisthenicsPage = mod.CalisthenicsPage;
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderPage = () => render(<MemoryRouter><CalisthenicsPage /></MemoryRouter>);

describe('CalisthenicsPage', () => {
  describe('En-tête', () => {
    it('affiche le titre "Calisthénie"', async () => {
      renderPage();
      await q(/calisthénie/i);
    });

    it('affiche le lien vers une nouvelle séance', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getAllByRole('link', { name: /nouvelle|séance/i }).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Statistiques', () => {
    it('affiche la carte de stats séances et les métriques de session', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.queryAllByText(/séances/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/reps/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche le bon nombre de séances', async () => {
      renderPage();
      await q(/1/);
    });
  });

  describe('Onglets', () => {
    it('affiche les 3 onglets', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.queryAllByText(/séances/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/graphiques/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/records/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Liste des séances', () => {
    it('affiche la séance "Upper body"', async () => {
      renderPage();
      await q(/upper body/i);
    });

    it('affiche le feedback de la séance', async () => {
      renderPage();
      await q(/difficile/i);
    });

    it('affiche le nombre de reps', async () => {
      renderPage();
      await q(/18/);
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
