import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { id: 'user-1', username: 'Enzoulette', global_level: 5 },
    loading: false,
  }),
}));

const mockFeedItems = [
  {
    id: 'f-1', user_id: 'user-2', type: 'workout', created_at: '2026-03-01T10:00:00Z',
    content: { type: 'workout', tonnage: 8000, sets_count: 12, feedback: 'difficile' },
    user: { id: 'user-2', username: 'Atlas', global_level: 14, avatar_url: null },
    likes_count: 3, comments_count: 1, user_has_liked: false,
  },
  {
    id: 'f-2', user_id: 'user-3', type: 'run', created_at: '2026-03-02T08:00:00Z',
    content: { type: 'run', distance: 10, duration: 2700, pace: 4.5, run_type: 'tempo', feedback: 'difficile' },
    user: { id: 'user-3', username: 'Spartacus', global_level: 12, avatar_url: null },
    likes_count: 5, comments_count: 2, user_has_liked: true,
  },
];

const mockChallenges = [
  {
    id: 'c-1', title: 'Défi Mars : 300 km collectifs', type: 'running',
    target_value: 300, unit: 'km', start_date: '2026-03-01T00:00:00Z',
    end_date: '2026-03-31T23:59:59Z', is_flash: false, status: 'approved',
    created_by: 'user-2', description: 'On vise 300 km !',
    participations: [
      { user_id: 'user-1', contribution: 18, completed: false },
      { user_id: 'user-3', contribution: 28, completed: false },
    ],
  },
];

vi.mock('../../services/feed.service', () => ({
  feedService: {
    getFeed: vi.fn().mockResolvedValue(mockFeedItems),
  },
}));

vi.mock('../../lib/supabase-client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const chain: any = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.order = vi.fn().mockReturnValue(chain);
      chain.limit = vi.fn().mockReturnValue(chain);
      chain.in = vi.fn().mockReturnValue(chain);
      chain.neq = vi.fn().mockReturnValue(chain);
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.delete = vi.fn().mockReturnValue(chain);
      chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
      chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      if (table === 'community_challenges') {
        chain.then = (resolve: any) => Promise.resolve({ data: mockChallenges, error: null }).then(resolve);
      } else {
        chain.then = (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve);
      }
      return chain;
    }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    })),
    removeChannel: vi.fn(),
  },
}));

let CommunityPage: any;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('../../pages/Community');
  CommunityPage = mod.CommunityPage;
});

const q = (pattern: RegExp) =>
  waitFor(() => expect(screen.queryAllByText(pattern).length).toBeGreaterThan(0), { timeout: 3000 });

const renderCommunity = () => render(<MemoryRouter><CommunityPage /></MemoryRouter>);

describe('CommunityPage', () => {
  describe('Rendu général', () => {
    it('se monte sans crash', () => {
      expect(() => renderCommunity()).not.toThrow();
    });

    it('affiche le titre "Communauté" ou "Feed"', async () => {
      renderCommunity();
      await q(/communauté|feed|community/i);
    });

    it('affiche les entrées du feed', async () => {
      renderCommunity();
      await q(/atlas|spartacus/i);
    });
  });

  describe('Feed', () => {
    it('affiche une entrée de type workout', async () => {
      renderCommunity();
      await q(/séance muscu|workout|8\s*000|8000/i);
    });

    it('affiche une entrée de type course', async () => {
      renderCommunity();
      await q(/course|10\s*km/i);
    });

    it('appelle feedService.getFeed au chargement', async () => {
      const { feedService } = await import('../../services/feed.service');
      renderCommunity();
      await waitFor(() => {
        expect(feedService.getFeed).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('Titre de la page', () => {
    it('affiche le titre "Les Monstres"', async () => {
      renderCommunity();
      await q(/les monstres/i);
    });

    it('affiche le sous-titre de la page', async () => {
      renderCommunity();
      await q(/guerriers/i);
    });
  });
});
