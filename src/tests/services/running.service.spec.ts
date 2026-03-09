import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runningService } from '../../services/running.service';

vi.mock('../../lib/supabase-client', () => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return {
    supabase: { from: vi.fn(() => mockChain) },
  };
});

describe('runningService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getSessions', () => {
    it('est une fonction définie', () => {
      expect(typeof runningService.getSessions).toBe('function');
    });

    it('retourne un tableau vide si aucune session', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await runningService.getSessions('user-1');
      expect(result).toEqual([]);
    });
  });

  describe('getTotalDistance', () => {
    it('est une fonction définie', () => {
      expect(typeof runningService.getTotalDistance).toBe('function');
    });

    it('retourne 0 si aucune session', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await runningService.getTotalDistance('user-1');
      expect(result).toBe(0);
    });

    it('somme correctement les distances', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ distance: 10 }, { distance: 5.5 }, { distance: 21.1 }],
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await runningService.getTotalDistance('user-1');
      expect(result).toBeCloseTo(36.6);
    });
  });

  describe('getPersonalRecords', () => {
    it('est une fonction définie', () => {
      expect(typeof runningService.getPersonalRecords).toBe('function');
    });
  });

  describe('deleteSession', () => {
    it('est une fonction définie', () => {
      expect(typeof runningService.deleteSession).toBe('function');
    });

    it('lève une erreur si Supabase échoue', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const eqMock = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
      (supabase.from as any).mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: eqMock }) });

      await expect(runningService.deleteSession('session-1')).rejects.toBeTruthy();
    });
  });

  describe('updateSession', () => {
    it('est une fonction définie', () => {
      expect(typeof runningService.updateSession).toBe('function');
    });
  });

  describe('getShoes', () => {
    it('est une fonction définie', () => {
      expect(typeof runningService.getShoes).toBe('function');
    });

    it('retourne un tableau de chaussures', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: '1', model: 'Pegasus 40', brand: 'Nike', total_km: 245.3, is_active: true }],
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await runningService.getShoes('user-1');
      expect(Array.isArray(result)).toBe(true);
    });

    it('interroge la VIEW shoes_with_km (migration #4)', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      await runningService.getShoes('user-1');
      expect(supabase.from).toHaveBeenCalledWith('shoes_with_km');
    });

    it('retourne total_km calculé dynamiquement par la VIEW', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: '1', model: 'Pegasus 40', brand: 'Nike', total_km: 245.3, is_active: true }],
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await runningService.getShoes('user-1');
      expect(result[0]).toHaveProperty('total_km');
      expect(result[0].total_km).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Migration #1 — pace_km_per_h supprimée', () => {
    it('createSession ne tente pas d\'écrire pace_km_per_h dans Supabase', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      let capturedPayload: any = null;
      const insertMock = vi.fn((payload: any) => { capturedPayload = payload; return { select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 's-1', user_id: 'user-1', distance: 10000, duration: 3000, pace_min_per_km: 5, created_at: '2026-01-01T00:00:00Z' }, error: null }) }; });
      (supabase.from as any).mockReturnValue({ insert: insertMock });

      await runningService.createSession({ user_id: 'user-1', distance: 10000, duration: 3000 });
      expect(capturedPayload).not.toHaveProperty('pace_km_per_h');
    });

    it('le payload createSession contient pace_min_per_km', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      let capturedPayload: any = null;
      const insertMock = vi.fn((payload: any) => { capturedPayload = payload; return { select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 's-1', user_id: 'user-1', distance: 10000, duration: 3000, pace_min_per_km: 5, created_at: '2026-01-01T00:00:00Z' }, error: null }) }; });
      (supabase.from as any).mockReturnValue({ insert: insertMock });

      await runningService.createSession({ user_id: 'user-1', distance: 10000, duration: 3000 });
      expect(capturedPayload).toHaveProperty('pace_min_per_km');
    });
  });

  describe('getSessionsCount', () => {
    it('est une fonction définie', () => {
      expect(typeof runningService.getSessionsCount).toBe('function');
    });
  });
});
