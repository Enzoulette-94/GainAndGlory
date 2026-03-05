import { describe, it, expect, vi, beforeEach } from 'vitest';
import { xpService } from '../../services/xp.service';

// xpService dépend de profileService — on le mocke directement
vi.mock('../../services/profile.service', () => ({
  profileService: {
    getProfile: vi.fn(),
    addXP: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock('../../lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

describe('xpService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('awardXP', () => {
    it('est une fonction définie', () => {
      expect(typeof xpService.awardXP).toBe('function');
    });

    it('retourne les bonnes propriétés après attribution d\'XP', async () => {
      const { profileService } = await import('../../services/profile.service');
      (profileService.getProfile as any).mockResolvedValue({
        total_xp: 50, global_level: 1,
        musculation_xp: 0, musculation_level: 1,
        running_xp: 0, running_level: 1,
      });
      (profileService.addXP as any).mockResolvedValue({
        total_xp: 100, global_level: 2,
        musculation_xp: 50, musculation_level: 1,
      });
      (profileService.updateProfile as any).mockResolvedValue({});

      const result = await xpService.awardXP('user-1', 'WORKOUT_SESSION');
      expect(result).toHaveProperty('xpGained');
      expect(result).toHaveProperty('leveledUp');
      expect(result.xpGained).toBe(50);
    });

    it('détecte une montée de niveau quand l\'XP franchit le seuil', async () => {
      const { profileService } = await import('../../services/profile.service');
      // 95 XP → ajoute 50 XP (WORKOUT) → 145 XP → niveau 2 (seuil 100)
      (profileService.getProfile as any).mockResolvedValue({
        total_xp: 95, global_level: 1,
        musculation_xp: 0, musculation_level: 1,
        running_xp: 0, running_level: 1,
      });
      (profileService.addXP as any).mockResolvedValue({
        total_xp: 145, global_level: 1,
        musculation_xp: 50, musculation_level: 1,
      });
      (profileService.updateProfile as any).mockResolvedValue({});

      const result = await xpService.awardXP('user-1', 'WORKOUT_SESSION');
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBeGreaterThan(result.oldLevel!);
    });

    it('ne détecte pas de level-up si l\'XP est insuffisant', async () => {
      const { profileService } = await import('../../services/profile.service');
      // 0 XP → ajoute 10 XP (WEIGHT_ENTRY) → 10 XP → reste niveau 1
      (profileService.getProfile as any).mockResolvedValue({
        total_xp: 0, global_level: 1,
        musculation_xp: 0, musculation_level: 1,
        running_xp: 0, running_level: 1,
      });
      (profileService.addXP as any).mockResolvedValue({
        total_xp: 10, global_level: 1,
        musculation_xp: 0, musculation_level: 1,
      });
      (profileService.updateProfile as any).mockResolvedValue({});

      const result = await xpService.awardXP('user-1', 'WEIGHT_ENTRY');
      expect(result.leveledUp).toBe(false);
      expect(result.xpGained).toBe(10);
    });
  });
});
