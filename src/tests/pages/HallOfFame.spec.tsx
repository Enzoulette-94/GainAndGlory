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
  { id: 'user-1', username: 'Enzoulette', total_xp: 5000, global_level: 15, avatar_url: null },
  { id: 'user-2', username: 'Atlas', total_xp: 4500, global_level: 14, avatar_url: null },
];

const mockRunningLeaderboard = [
  { user_id: 'user-2', username: 'Atlas',      global_level: 14, avatar_url: null, total_distance: 80000 },
  { user_id: 'user-1', username: 'Enzoulette', global_level: 15, avatar_url: null, total_distance: 50000 },
];

const mockWorkoutLeaderboard = [
  { user_id: 'user-2', username: 'Atlas',      global_level: 14, avatar_url: null, total_tonnage: 12000 },
  { user_id: 'user-1', username: 'Enzoulette', global_level: 15, avatar_url: null, total_tonnage: 9000 },
];

const mockHofRecords = [
  { id: 'r-1', user_id: 'user-1', title: 'Deadlift', value: '180', unit: 'kg', category: 'musculation', username: 'Enzoulette', global_level: 15, avatar_url: null },
  { id: 'r-2', user_id: 'user-2', title: 'Deadlift', value: '200', unit: 'kg', category: 'musculation', username: 'Atlas',      global_level: 14, avatar_url: null },
  { id: 'r-3', user_id: 'user-1', title: 'Trail des Vosges', value: '2:15:00', unit: '21 km', category: 'course', username: 'Enzoulette', global_level: 15, avatar_url: null },
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
        if (table === 'profiles') return makeChain(mockProfiles);
        return makeChain([]);
      }),
      rpc: vi.fn((name: string) => {
        if (name === 'get_running_leaderboard') return Promise.resolve({ data: mockRunningLeaderboard, error: null });
        if (name === 'get_workout_leaderboard') return Promise.resolve({ data: mockWorkoutLeaderboard, error: null });
        if (name === 'get_hall_of_fame_records') return Promise.resolve({ data: mockHofRecords, error: null });
        return Promise.resolve({ data: [], error: null });
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

  describe('Classements Course et Muscu (RPC)', () => {
    it('appelle get_running_leaderboard via rpc', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      renderHoF();
      await waitFor(() => expect((supabase as any).rpc).toHaveBeenCalledWith('get_running_leaderboard'), { timeout: 3000 });
    });

    it('appelle get_workout_leaderboard via rpc', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      renderHoF();
      await waitFor(() => expect((supabase as any).rpc).toHaveBeenCalledWith('get_workout_leaderboard'), { timeout: 3000 });
    });

    it('affiche Atlas en tête du classement course', async () => {
      renderHoF();
      await q(/atlas/i);
    });
  });

  describe('Records Personnels (RPC)', () => {
    it('affiche la section "Records Personnels"', async () => {
      renderHoF();
      await q(/records personnels/i);
    });

    it('appelle get_hall_of_fame_records via rpc', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      renderHoF();
      await waitFor(() => expect((supabase as any).rpc).toHaveBeenCalledWith('get_hall_of_fame_records'), { timeout: 3000 });
    });

    it('affiche le sous-titre "profils publics uniquement"', async () => {
      renderHoF();
      await q(/profils publics/i);
    });

    it('affiche le titre de l\'exercice muscu "Deadlift"', async () => {
      renderHoF();
      await q(/deadlift/i);
    });

    it('affiche la valeur du record de Deadlift (200)', async () => {
      renderHoF();
      await waitFor(() => {
        expect(screen.queryAllByText(/200/).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche le record de course "Trail des Vosges"', async () => {
      renderHoF();
      await q(/trail des vosges/i);
    });

    it('affiche la durée du record de course (2:15:00)', async () => {
      renderHoF();
      await waitFor(() => {
        expect(screen.queryAllByText(/2:15:00/).length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('affiche l\'indication de tri "meilleure charge" pour muscu', async () => {
      renderHoF();
      await q(/meilleure charge/i);
    });

    it('affiche l\'indication de tri "meilleur temps" pour course', async () => {
      renderHoF();
      await q(/meilleur temps/i);
    });
  });
});
