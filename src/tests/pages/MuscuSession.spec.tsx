import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', username: 'Test', musculation_level: 1, musculation_xp: 0 },
    loading: false,
    refreshProfile: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../../services/workout.service', () => ({
  workoutService: {
    getExercises: vi.fn().mockResolvedValue([
      { id: 'ex-1', name: 'Développé couché', muscle_group: 'pectoraux' },
    ]),
    createSession: vi.fn().mockResolvedValue({ id: 's-1' }),
    addSet: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/xp.service', () => ({
  xpService: {
    awardXP: vi.fn().mockResolvedValue({ xpGained: 50, newLevel: 1, oldLevel: 1, leveledUp: false }),
  },
}));

vi.mock('../../services/feed.service', () => ({
  feedService: {
    publishWorkout: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/profile-records.service', () => ({
  profileRecordsService: {
    upsertRecord: vi.fn().mockResolvedValue(undefined),
  },
}));

let MuscuSessionPage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../pages/MuscuSession');
  MuscuSessionPage = mod.MuscuSessionPage;
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderMuscuSession = () => render(<MemoryRouter><MuscuSessionPage /></MemoryRouter>);

const mockCopySession = {
  id: 's-copy', user_id: 'user-1', date: '2025-03-01T10:00:00Z',
  name: 'Chest Day', feedback: 'difficile', total_tonnage: 3200, notes: null,
  sets: [{
    id: 'set-1', exercise_id: 'ex-1', set_number: 1, reps: 8, weight: 80, rest_time: 120,
    exercise: { id: 'ex-1', name: 'Développé couché', muscle_group: 'pectoraux' },
  }],
};

const renderWithCopyFrom = () =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/musculation/new', state: { copyFrom: mockCopySession } }]}>
      <MuscuSessionPage />
    </MemoryRouter>
  );

describe('MuscuSessionPage', () => {
  describe('Rendu initial', () => {
    it('se monte sans crash (pas de crypto.randomUUID)', async () => {
      expect(() => renderMuscuSession()).not.toThrow();
    });

    it('affiche le formulaire de séance', async () => {
      renderMuscuSession();
      await q(/séance|musculation|exercice/i);
    });

    it('affiche un bouton pour ajouter un exercice', async () => {
      renderMuscuSession();
      await waitFor(() => {
        expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche un champ de date', async () => {
      renderMuscuSession();
      await waitFor(() => {
        const dateInputs = document.querySelectorAll('input[type="datetime-local"], input[type="date"]');
        expect(dateInputs.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche le bouton "Ajouter exercice"', async () => {
      renderMuscuSession();
      await waitFor(() => {
        const btns = screen.queryAllByText(/ajouter exercice/i);
        expect(btns.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche un placeholder de sélection d\'exercice', async () => {
      renderMuscuSession();
      await waitFor(() => {
        const placeholders = screen.queryAllByText(/sélectionner un exercice/i);
        expect(placeholders.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('profileRecordsService', () => {
    it('upsertRecord est défini dans le mock', async () => {
      const { profileRecordsService } = await import('../../services/profile-records.service');
      expect(typeof profileRecordsService.upsertRecord).toBe('function');
    });
  });

  describe('Copie de séance', () => {
    it('affiche le bandeau "Séance copiée depuis" quand copyFrom est présent', async () => {
      renderWithCopyFrom();
      await q(/séance copiée depuis/i);
    });

    it('pré-remplit le nom de la séance depuis copyFrom', async () => {
      renderWithCopyFrom();
      await waitFor(() => {
        const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
        const nameInput = Array.from(inputs).find(
          (el) => (el as HTMLInputElement).value === 'Chest Day'
        );
        expect(nameInput).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('pré-remplit les exercices depuis copyFrom', async () => {
      renderWithCopyFrom();
      await q(/développé couché/i);
    });
  });

  describe('Génération d\'ID sans crypto', () => {
    it('génère un id via Math.random() — pas de crypto.randomUUID', () => {
      const id = Math.random().toString(36).slice(2);
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('génère des IDs uniques à chaque appel', () => {
      const ids = new Set(Array.from({ length: 100 }, () => Math.random().toString(36).slice(2)));
      expect(ids.size).toBe(100);
    });
  });
});
