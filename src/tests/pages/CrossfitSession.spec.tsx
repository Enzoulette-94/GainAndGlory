import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', username: 'Test', crossfit_level: 1, crossfit_xp: 0 },
    loading: false,
    refreshProfile: vi.fn(),
  }),
}));

vi.mock('../../services/crossfit.service', () => ({
  crossfitService: {
    createSession: vi.fn().mockResolvedValue({ id: 's-1' }),
  },
}));

vi.mock('../../services/xp.service', () => ({
  xpService: {
    awardXP: vi.fn().mockResolvedValue({ xpGained: 60, newLevel: 1, oldLevel: 1, leveledUp: false }),
  },
}));

vi.mock('../../services/feed.service', () => ({
  feedService: {
    publishCrossfit: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/profile-records.service', () => ({
  profileRecordsService: {
    upsertRecord: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual as object, useNavigate: () => vi.fn() };
});

let CrossfitSessionPage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../pages/CrossfitSession');
  CrossfitSessionPage = mod.CrossfitSessionPage;
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderPage = () => render(<MemoryRouter><CrossfitSessionPage /></MemoryRouter>);

const mockCopySession = {
  id: 's-copy', user_id: 'user-1', date: '2025-03-01T10:00:00Z',
  name: 'Fran', feedback: null, notes: null,
  wod_type: 'for_time' as const,
  total_duration: null, round_duration: null, target_rounds: null,
  result_time: null, result_reps: null, result_rounds: null,
  benchmark_name: null,
  exercises: [
    { name: 'Thruster', reps: 21, weight: 43, duration: null, notes: null },
  ],
  created_at: '2025-03-01T10:00:00Z',
};

const renderWithCopyFrom = () =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/crossfit/new', state: { copyFrom: mockCopySession } }]}>
      <CrossfitSessionPage />
    </MemoryRouter>
  );

describe('CrossfitSessionPage', () => {
  describe('Rendu initial — Step 1 (choix WOD)', () => {
    it('monte sans crash', async () => {
      renderPage();
      await q(/nouvelle séance/i);
    });

    it('affiche les 5 types de WOD', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.queryAllByText(/emom/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/amrap/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/benchmark/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/for rounds/i).length).toBeGreaterThan(0);
        expect(screen.queryAllByText(/for time/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Copie de séance', () => {
    it('affiche le bandeau "Séance copiée depuis" quand copyFrom est présent', async () => {
      renderWithCopyFrom();
      await q(/séance copiée depuis/i);
    });

    it('affiche le formulaire directement (step 2) quand copyFrom est présent', async () => {
      renderWithCopyFrom();
      await waitFor(() => {
        expect(screen.queryAllByText(/informations/i).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('pré-remplit les exercices depuis copyFrom', async () => {
      renderWithCopyFrom();
      await q(/thruster/i);
    });
  });
});
