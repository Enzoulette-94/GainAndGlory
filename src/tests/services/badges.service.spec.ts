import { describe, it, expect, vi, beforeEach } from 'vitest';
import { badgesService } from '../../services/badges.service';

// ─── Mock Supabase ────────────────────────────────────────────────────────────

const mockBadge = { id: 'b-1', code: 'bronze_level', name: 'Niveau Bronze', rarity: 'common', category: 'progression', is_secret: false };
const mockUserBadge = { id: 'ub-1', user_id: 'user-1', badge_id: 'b-1', badge: mockBadge, unlocked_at: '2026-01-01T00:00:00Z' };

vi.mock('../../lib/supabase-client', () => {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.neq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  return {
    supabase: { from: vi.fn(() => chain) },
  };
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('badgesService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── getAllBadges ──────────────────────────────────────────────────────────

  describe('getAllBadges', () => {
    it('est une fonction définie', () => {
      expect(typeof badgesService.getAllBadges).toBe('function');
    });

    it('retourne la liste des badges', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockBadge], error: null }),
      };
      (supabase.from as any).mockReturnValue(chain);

      const result = await badgesService.getAllBadges();
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('bronze_level');
    });

    it('retourne [] si aucun badge', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as any).mockReturnValue(chain);

      const result = await badgesService.getAllBadges();
      expect(result).toEqual([]);
    });

    it('lève une erreur si Supabase échoue', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };
      (supabase.from as any).mockReturnValue(chain);

      await expect(badgesService.getAllBadges()).rejects.toBeTruthy();
    });
  });

  // ── getUserBadges ─────────────────────────────────────────────────────────

  describe('getUserBadges', () => {
    it('est une fonction définie', () => {
      expect(typeof badgesService.getUserBadges).toBe('function');
    });

    it('retourne les badges de l\'utilisateur avec le badge jointé', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockUserBadge], error: null }),
      };
      (supabase.from as any).mockReturnValue(chain);

      const result = await badgesService.getUserBadges('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].badge_id).toBe('b-1');
    });
  });

  // ── unlockBadge ───────────────────────────────────────────────────────────

  describe('unlockBadge', () => {
    it('est une fonction définie', () => {
      expect(typeof badgesService.unlockBadge).toBe('function');
    });

    it('retourne null si le badge n\'existe pas', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const result = await badgesService.unlockBadge('user-1', 'unknown_badge');
      expect(result).toBeNull();
    });

    it('retourne null si le badge est déjà débloqué', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      let callCount = 0;
      (supabase.from as any).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockBadge, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'ub-1' }, error: null }),
        insert: vi.fn().mockReturnThis(),
      }));
      callCount++;

      const result = await badgesService.unlockBadge('user-1', 'bronze_level');
      expect(result).toBeNull();
    });

    it('débloque le badge et le retourne si pas encore débloqué', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      let step = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'badges' && step === 0) {
          step++;
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: mockBadge, error: null }) };
        }
        if (table === 'user_badges' && step === 1) {
          step++;
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
        }
        // insert
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUserBadge, error: null }),
        };
      });

      const result = await badgesService.unlockBadge('user-1', 'bronze_level');
      expect(result).not.toBeNull();
      expect(result?.badge_id).toBe('b-1');
    });
  });

  // ── getBadgeChecks (via checkAndUnlockBadges) ────────────────────────────

  describe('checkAndUnlockBadges', () => {
    it('est une fonction définie', () => {
      expect(typeof badgesService.checkAndUnlockBadges).toBe('function');
    });

    it('ne débloque rien si aucune condition remplie', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockReturnThis(),
      });

      const result = await badgesService.checkAndUnlockBadges('user-1', { globalLevel: 1 });
      expect(result).toEqual([]);
    });
  });
});
