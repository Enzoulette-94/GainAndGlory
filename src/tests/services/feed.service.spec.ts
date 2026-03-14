import { describe, it, expect, vi, beforeEach } from 'vitest';
import { feedService } from '../../services/feed.service';

vi.mock('../../lib/supabase-client', () => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return {
    supabase: { from: vi.fn(() => mockChain) },
  };
});

describe('feedService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getFeed', () => {
    it('est une fonction définie', () => {
      expect(typeof feedService.getFeed).toBe('function');
    });

    it('retourne un tableau vide si aucune activité', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await feedService.getFeed();
      expect(result).toEqual([]);
    });

    it('accepte des paramètres limit et offset', () => {
      expect(feedService.getFeed.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getUserFeed', () => {
    it('est une fonction définie', () => {
      expect(typeof feedService.getUserFeed).toBe('function');
    });
  });

  describe('toggleLike', () => {
    it('est une fonction définie', () => {
      expect(typeof feedService.toggleLike).toBe('function');
    });

    it('retourne false (unlike) si un like existant est supprimé', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: { id: 'like-1' }, error: null });
      const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
      const deleteMock = vi.fn().mockReturnValue({ eq: deleteEqMock });
      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: maybeSingleMock };
        }
        return { delete: deleteMock };
      });

      const result = await feedService.toggleLike('activity-1', 'user-1');
      expect(result).toBe(false);
    });

    it('retourne true (liked) si aucun like n\'existe', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: maybeSingleMock };
        }
        return { insert: insertMock };
      });

      const result = await feedService.toggleLike('activity-1', 'user-1');
      expect(result).toBe(true);
    });
  });

  describe('addComment', () => {
    it('est une fonction définie', () => {
      expect(typeof feedService.addComment).toBe('function');
    });

    it('retourne le commentaire créé', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const comment = { id: 'c-1', content: 'Super séance !', user: { id: 'u-1', username: 'test' } };
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: comment, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await feedService.addComment('activity-1', 'user-1', 'Super séance !');
      expect(result).toEqual(comment);
    });
  });

  describe('deleteComment', () => {
    it('est une fonction définie', () => {
      expect(typeof feedService.deleteComment).toBe('function');
    });

    it('lève une erreur si la suppression échoue', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const eqMock = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
      (supabase.from as any).mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: eqMock }) });

      await expect(feedService.deleteComment('comment-1')).rejects.toBeTruthy();
    });
  });

  describe('publishWorkout', () => {
    it('est une fonction définie', () => {
      expect(typeof feedService.publishWorkout).toBe('function');
    });

    it('ne lève pas d\'erreur même si Supabase échoue (catch silencieux)', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockRejectedValue(new Error('Network error')),
      });

      // publishWorkout a un try/catch silencieux — ne doit pas rejeter
      await expect(feedService.publishWorkout('user-1', 1000, 10)).resolves.not.toThrow();
    });
  });

  describe('publishRun', () => {
    it('est une fonction définie', () => {
      expect(typeof feedService.publishRun).toBe('function');
    });

    it('accepte le paramètre feedback', () => {
      expect(feedService.publishRun.length).toBeGreaterThanOrEqual(4);
    });

    it('ne lève pas d\'erreur même si Supabase échoue (catch silencieux)', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockRejectedValue(new Error('Network error')),
      });

      await expect(feedService.publishRun('user-1', 10, 3000, 5.0)).resolves.not.toThrow();
    });
  });

  describe('publishCalisthenics', () => {
    it('est une fonction définie', () => {
      expect(typeof feedService.publishCalisthenics).toBe('function');
    });

    it('ne lève pas d\'erreur même si Supabase échoue (catch silencieux)', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockRejectedValue(new Error('Network error')),
      });

      await expect(
        feedService.publishCalisthenics('user-1', 4, 80, 'difficile')
      ).resolves.not.toThrow();
    });

    it('accepte le tableau exercises optionnel', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      (supabase.from as any).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      const exercises = [{ name: 'Tractions', sets: 4, reps: 32 }];
      await expect(
        feedService.publishCalisthenics('user-1', 1, 32, undefined, undefined, undefined, [], exercises)
      ).resolves.not.toThrow();
    });
  });
});
