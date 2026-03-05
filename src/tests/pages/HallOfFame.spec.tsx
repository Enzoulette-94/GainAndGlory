import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', username: 'Enzoulette' },
    loading: false,
  }),
}));

const mockProfiles = [
  { id: 'user-1', username: 'Enzoulette', total_xp: 5000, global_level: 15, avatar_url: null, share_performances: true },
  { id: 'user-2', username: 'Atlas', total_xp: 4500, global_level: 14, avatar_url: null, share_performances: true },
];

const mockRunningSessions = [
  { user_id: 'user-2', distance: 80000 },
  { user_id: 'user-1', distance: 50000 },
];

const mockWorkoutSessions = [
  { user_id: 'user-2', total_tonnage: 12000 },
  { user_id: 'user-1', total_tonnage: 9000 },
];

const mockRecords = [
  { id: 'r-1', user_id: 'user-1', title: 'Deadlift', value: '180', unit: 'kg' },
  { id: 'r-2', user_id: 'user-2', title: 'Deadlift', value: '200', unit: 'kg' },
  { id: 'r-3', user_id: 'user-1', title: '5 km', value: '22:30', unit: 'min' },
];

vi.mock('../../lib/supabase-client', () => {
  const makeChain = (data: unknown) => {
    const result = { data, error: null };
    const chain: any = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.limit = vi.fn().mockResolvedValue(result);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.in = vi.fn().mockReturnValue(chain);
    chain.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
    return chain;
  };

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === 'running_sessions') return makeChain(mockRunningSessions);
        if (table === 'workout_sessions') return makeChain(mockWorkoutSessions);
        if (table === 'profile_records') return makeChain(mockRecords);
        // profiles: used for XP ranking (limit), records ranking (eq), running/muscu (in)
        return makeChain(mockProfiles);
      }),
    },
  };
});

let HallOfFamePage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../pages/HallOfFame');
  HallOfFamePage = mod.HallOfFamePage;
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderHoF = () => render(<MemoryRouter><HallOfFamePage /></MemoryRouter>);

describe('HallOfFamePage', () => {
  describe('Affichage général', () => {
    it('affiche le titre "Hall of Fame"', async () => {
      renderHoF();
      await q(/hall of fame/i);
    });

    it('affiche une section XP', async () => {
      renderHoF();
      await q(/xp/i);
    });

    it('affiche une section Course ou Running', async () => {
      renderHoF();
      await q(/course|running/i);
    });

    it('affiche une section Musculation', async () => {
      renderHoF();
      await q(/musculation/i);
    });
  });

  describe('Classements XP', () => {
    it('affiche le username de l\'utilisateur courant', async () => {
      renderHoF();
      await q(/enzoulette/i);
    });

    it('affiche le badge "VOUS" pour l\'utilisateur courant', async () => {
      renderHoF();
      await q(/vous/i);
    });
  });

  describe('Records Personnels', () => {
    it('affiche la section "Records Personnels"', async () => {
      renderHoF();
      await q(/records personnels/i);
    });

    it('affiche le titre de l\'exercice "Deadlift"', async () => {
      renderHoF();
      await q(/deadlift/i);
    });

    it('affiche l\'exercice "5 km"', async () => {
      renderHoF();
      await q(/5 km/i);
    });

    it('affiche la valeur du record de Deadlift (200)', async () => {
      renderHoF();
      await waitFor(() => {
        expect(screen.queryAllByText(/200/).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche l\'indication de tri "meilleure charge" pour kg', async () => {
      renderHoF();
      await q(/meilleure charge/i);
    });

    it('affiche l\'indication de tri "meilleur temps" pour min', async () => {
      renderHoF();
      await q(/meilleur temps/i);
    });

    it('affiche le sous-titre "profils publics uniquement"', async () => {
      renderHoF();
      await q(/profils publics/i);
    });
  });
});
