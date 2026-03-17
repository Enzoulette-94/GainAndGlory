import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', username: 'Test', musculation_level: 3, musculation_xp: 200 },
    loading: false,
  }),
}));

const mockSessions = [
  {
    id: 's-1', user_id: 'user-1', date: '2025-03-05T10:00:00Z',
    name: 'Chest Day', feedback: 'difficile', total_tonnage: 3200, notes: null,
    sets: [{
      id: 'set-1', exercise_id: 'ex-1', set_number: 1, reps: 5, weight: 100, rest_time: 180,
      exercise: { name: 'Développé couché', muscle_group: 'pectoraux' },
    }],
  },
];

vi.mock('../../services/workout.service', () => ({
  workoutService: {
    getSessions: vi.fn().mockResolvedValue(mockSessions),
    getSessionsCount: vi.fn().mockResolvedValue(1),
    getTotalTonnage: vi.fn().mockResolvedValue(3200),
    getPersonalRecords: vi.fn().mockResolvedValue([]),
    getExercises: vi.fn().mockResolvedValue([]),
    deleteSession: vi.fn().mockResolvedValue(undefined),
    updateSession: vi.fn().mockResolvedValue(mockSessions[0]),
    replaceSets: vi.fn().mockResolvedValue(undefined),
  },
}));

let MusculationPage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../pages/Musculation');
  MusculationPage = mod.MusculationPage;
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderMusculation = () => render(<MemoryRouter><MusculationPage /></MemoryRouter>);

describe('MusculationPage', () => {
  describe('En-tête', () => {
    it('affiche le titre "Musculation"', async () => {
      renderMusculation();
      await q(/musculation/i);
    });

    it('affiche le lien vers une nouvelle séance', async () => {
      renderMusculation();
      await waitFor(() => {
        expect(screen.getAllByRole('link', { name: /nouvelle|séance/i }).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Statistiques', () => {
    it('affiche les cartes de statistiques globales', async () => {
      renderMusculation();
      await q(/séance|total/i);
    });
  });

  describe('Onglets', () => {
    it('affiche les 3 onglets : Séances, Graphiques, Records', async () => {
      renderMusculation();
      await waitFor(() => {
        expect(screen.queryAllByText(/séances/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/graphiques/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/records/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche la séance "Chest Day"', async () => {
      renderMusculation();
      await q(/chest day/i);
    });

    it('affiche le tonnage (3200)', async () => {
      renderMusculation();
      await q(/3[\s\u00a0]?200|3200/);
    });
  });

  describe('Filtre par ressenti', () => {
    it('affiche le filtre "Tous"', async () => {
      renderMusculation();
      await q(/tous/i);
    });
  });

  describe('Copie de séance', () => {
    it('affiche le bouton Réutiliser sur chaque SessionCard', async () => {
      renderMusculation();
      await waitFor(() => {
        const btns = screen.queryAllByTitle(/réutiliser/i);
        expect(btns.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });
});
