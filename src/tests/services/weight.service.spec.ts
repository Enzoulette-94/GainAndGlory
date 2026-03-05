import { describe, it, expect, vi, beforeEach } from 'vitest';
import { weightService } from '../../services/weight.service';

vi.mock('../../lib/supabase-client', () => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return {
    supabase: { from: vi.fn(() => mockChain) },
  };
});

describe('weightService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getEntries', () => {
    it('est une fonction définie', () => {
      expect(typeof weightService.getEntries).toBe('function');
    });

    it('retourne les entrées triées par date décroissante', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const entries = [
        { id: '2', weight: 76, date: '2025-03-05', notes: null },
        { id: '1', weight: 75, date: '2025-03-01', notes: null },
      ];
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: entries, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await weightService.getEntries('user-1');
      expect(result.length).toBe(2);
      expect(result[0].weight).toBe(76);
    });
  });

  describe('getLatest', () => {
    it('est une fonction définie', () => {
      expect(typeof weightService.getLatest).toBe('function');
    });

    it('retourne null si aucune entrée', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await weightService.getLatest('user-1');
      expect(result).toBeNull();
    });

    it('retourne la dernière pesée si elle existe', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const entry = { id: '1', weight: 75.5, date: '2025-03-05', user_id: 'user-1' };
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: entry, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await weightService.getLatest('user-1');
      expect(result?.weight).toBe(75.5);
    });
  });

  describe('deleteEntry', () => {
    it('est une fonction définie', () => {
      expect(typeof weightService.deleteEntry).toBe('function');
    });

    it('lève une erreur si Supabase échoue', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const eqMock = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
      (supabase.from as any).mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: eqMock }) });

      await expect(weightService.deleteEntry('entry-1')).rejects.toBeTruthy();
    });
  });

  describe('updateEntry', () => {
    it('est une fonction définie', () => {
      expect(typeof weightService.updateEntry).toBe('function');
    });

    it('appelle la table weight_entries', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
      (supabase.from as any).mockReturnValue({ update: updateMock });

      await weightService.updateEntry('entry-1', { weight: 74 });
      expect(supabase.from).toHaveBeenCalledWith('weight_entries');
    });

    it('lève une erreur si la mise à jour échoue', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const eqMock = vi.fn().mockResolvedValue({ error: { message: 'Update failed' } });
      (supabase.from as any).mockReturnValue({ update: vi.fn().mockReturnValue({ eq: eqMock }) });

      await expect(weightService.updateEntry('entry-1', { weight: 74 })).rejects.toBeTruthy();
    });
  });

  describe('createEntry', () => {
    it('est une fonction définie', () => {
      expect(typeof weightService.createEntry).toBe('function');
    });
  });
});
