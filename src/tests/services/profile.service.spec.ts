import { describe, it, expect, vi, beforeEach } from 'vitest';
import { profileService } from '../../services/profile.service';

// ─── Mock Supabase ────────────────────────────────────────────────────────────

const mockProfile = {
  id: 'user-1', username: 'Enzoulette',
  total_xp: 500, global_level: 5,
  musculation_xp: 300, musculation_level: 3,
  running_xp: 200, running_level: 2,
  current_streak: 3, longest_streak: 7,
  last_activity_date: null, avatar_url: null,
  share_performances: true,
};

vi.mock('../../lib/supabase-client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/avatar.jpg' } }),
      })),
    },
  },
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('profileService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── getProfile ────────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('est une fonction définie', () => {
      expect(typeof profileService.getProfile).toBe('function');
    });

    it('retourne le profil de l\'utilisateur', async () => {
      const result = await profileService.getProfile('user-1');
      expect(result.id).toBe('user-1');
      expect(result.username).toBe('Enzoulette');
    });

    it('lève une erreur si Supabase échoue', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      });

      await expect(profileService.getProfile('user-x')).rejects.toBeTruthy();
    });
  });

  // ── updateProfile ─────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('est une fonction définie', () => {
      expect(typeof profileService.updateProfile).toBe('function');
    });

    it('retourne le profil mis à jour', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const updated = { ...mockProfile, username: 'NewName' };
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updated, error: null }),
      });

      const result = await profileService.updateProfile('user-1', { username: 'NewName' });
      expect(result.username).toBe('NewName');
    });
  });

  // ── isUsernameTaken ───────────────────────────────────────────────────────

  describe('isUsernameTaken', () => {
    it('retourne true si le username existe', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [{ id: 'user-2' }], error: null }),
      });

      const result = await profileService.isUsernameTaken('Enzoulette');
      expect(result).toBe(true);
    });

    it('retourne false si le username est libre', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await profileService.isUsernameTaken('NouveauPseudo');
      expect(result).toBe(false);
    });
  });

  // ── addXP ─────────────────────────────────────────────────────────────────

  describe('addXP', () => {
    it('est une fonction définie', () => {
      expect(typeof profileService.addXP).toBe('function');
    });

    it('incrémente total_xp correctement', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const updatedProfile = { ...mockProfile, total_xp: 600, musculation_xp: 400 };
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({ data: mockProfile, error: null })
          .mockResolvedValue({ data: updatedProfile, error: null }),
      });

      const result = await profileService.addXP('user-1', 100, 'musculation');
      expect(result.total_xp).toBe(600);
    });
  });

  // ── updateStreak ──────────────────────────────────────────────────────────

  describe('updateStreak', () => {
    it('est une fonction définie', () => {
      expect(typeof profileService.updateStreak).toBe('function');
    });

    it('initialise le streak à 1 si pas d\'activité précédente', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const profileNoActivity = { ...mockProfile, last_activity_date: null, current_streak: 0 };
      const updated = { ...profileNoActivity, current_streak: 1 };
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({ data: profileNoActivity, error: null })
          .mockResolvedValue({ data: updated, error: null }),
      });

      const result = await profileService.updateStreak('user-1');
      expect(result.current_streak).toBe(1);
    });

    it('ne modifie pas le streak si déjà actif aujourd\'hui', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const today = new Date().toISOString().split('T')[0];
      const profileToday = { ...mockProfile, last_activity_date: today, current_streak: 5 };
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: profileToday, error: null }),
      });

      const result = await profileService.updateStreak('user-1');
      expect(result.current_streak).toBe(5);
    });
  });
});
