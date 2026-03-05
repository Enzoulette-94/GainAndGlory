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

vi.mock('../../lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          { id: 'user-1', username: 'Enzoulette', total_xp: 5000, global_level: 15, avatar_url: null },
          { id: 'user-2', username: 'Atlas', total_xp: 4500, global_level: 14, avatar_url: null },
        ],
        error: null,
      }),
    })),
    rpc: vi.fn().mockResolvedValue({
      data: [
        { id: 'user-2', username: 'Atlas', value: 850, level: 10, avatar_url: null },
        { id: 'user-1', username: 'Enzoulette', value: 650, level: 8, avatar_url: null },
      ],
      error: null,
    }),
  },
}));

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

  describe('Classements', () => {
    it('affiche le username de l\'utilisateur courant', async () => {
      renderHoF();
      await q(/enzoulette/i);
    });

    it('affiche le badge "VOUS" pour l\'utilisateur courant', async () => {
      renderHoF();
      await q(/vous/i);
    });
  });
});
