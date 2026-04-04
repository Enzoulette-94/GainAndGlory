import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hybridService } from '../../services/hybrid.service';

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
    supabase: {
      from: vi.fn(() => mockChain),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
});

describe('hybridService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSession', () => {
    it('est une fonction définie', () => {
      expect(typeof hybridService.createSession).toBe('function');
    });

    it('appelle supabase.from avec hybrid_sessions', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'h-1', user_id: 'u-1', date: '2025-01-01T00:00:00Z',
            name: 'Test', notes: null, feedback: null, blocks: [], created_at: '2025-01-01',
          },
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await hybridService.createSession({
        userId: 'u-1',
        date: '2025-01-01T00:00:00Z',
        name: 'Test',
        blocks: [],
      });

      expect(supabase.from).toHaveBeenCalledWith('hybrid_sessions');
      expect(result.id).toBe('h-1');
    });

    it('lève une erreur si Supabase échoue', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      await expect(hybridService.createSession({ userId: 'u-1', date: '2025-01-01', blocks: [] })).rejects.toBeDefined();
    });
  });

  describe('getSessions', () => {
    it('est une fonction définie', () => {
      expect(typeof hybridService.getSessions).toBe('function');
    });

    it('retourne un tableau en cas de succès', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: 'h-1', user_id: 'u-1', date: '2025-01-01', name: null, notes: null, feedback: null, blocks: [], created_at: '2025-01-01' }],
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await hybridService.getSessions('u-1');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    it('retourne un tableau vide si aucune donnée', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await hybridService.getSessions('u-1');
      expect(result).toEqual([]);
    });
  });

  describe('getSessionsCount', () => {
    it('est une fonction définie', () => {
      expect(typeof hybridService.getSessionsCount).toBe('function');
    });

    it('retourne le nombre de sessions', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [{ id: 'h-1' }, { id: 'h-2' }], error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const count = await hybridService.getSessionsCount('u-1');
      expect(count).toBe(2);
    });

    it('retourne 0 en cas d\'erreur', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const count = await hybridService.getSessionsCount('u-1');
      expect(count).toBe(0);
    });
  });

  describe('deleteSession', () => {
    it('est une fonction définie', () => {
      expect(typeof hybridService.deleteSession).toBe('function');
    });

    it('appelle supabase.from avec hybrid_sessions et delete', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      await expect(hybridService.deleteSession('h-1')).resolves.toBeUndefined();
      expect(supabase.from).toHaveBeenCalledWith('hybrid_sessions');
    });
  });
});
