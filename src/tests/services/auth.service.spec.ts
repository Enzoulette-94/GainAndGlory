import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../services/auth.service';

// ─── Mock Supabase ────────────────────────────────────────────────────────────

vi.mock('../../lib/supabase-client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' }, session: { access_token: 'tok' } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('authService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── signUp ────────────────────────────────────────────────────────────────

  describe('signUp', () => {
    it('est une fonction définie', () => {
      expect(typeof authService.signUp).toBe('function');
    });

    it('crée le compte et retourne les données utilisateur', async () => {
      const result = await authService.signUp('test@example.com', 'Password123!', 'Enzoulette');
      expect(result.user?.id).toBe('user-1');
    });

    it('lève une erreur si Supabase auth échoue', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      (supabase.auth.signUp as any).mockResolvedValue({ data: { user: null }, error: { message: 'Email déjà utilisé' } });

      await expect(authService.signUp('dup@example.com', 'pass', 'user')).rejects.toBeTruthy();
    });

    it('lève une erreur si user est null après signUp', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      (supabase.auth.signUp as any).mockResolvedValue({ data: { user: null }, error: null });

      await expect(authService.signUp('test@example.com', 'pass', 'user')).rejects.toThrow();
    });
  });

  // ── signIn ────────────────────────────────────────────────────────────────

  describe('signIn', () => {
    it('est une fonction définie', () => {
      expect(typeof authService.signIn).toBe('function');
    });

    it('retourne la session après connexion réussie', async () => {
      const result = await authService.signIn('test@example.com', 'Password123!');
      expect(result.session?.access_token).toBe('tok');
    });

    it('lève une erreur si les identifiants sont incorrects', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      await expect(authService.signIn('bad@example.com', 'wrong')).rejects.toBeTruthy();
    });
  });

  // ── signOut ───────────────────────────────────────────────────────────────

  describe('signOut', () => {
    it('est une fonction définie', () => {
      expect(typeof authService.signOut).toBe('function');
    });

    it('se déconnecte sans erreur', async () => {
      await expect(authService.signOut()).resolves.toBeUndefined();
    });

    it('lève une erreur si signOut échoue', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      (supabase.auth.signOut as any).mockResolvedValue({ error: { message: 'signOut error' } });

      await expect(authService.signOut()).rejects.toBeTruthy();
    });
  });

  // ── getSession ────────────────────────────────────────────────────────────

  describe('getSession', () => {
    it('est une fonction définie', () => {
      expect(typeof authService.getSession).toBe('function');
    });

    it('retourne null si pas de session active', async () => {
      const result = await authService.getSession();
      expect(result).toBeNull();
    });
  });

  // ── resetPassword ─────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('est une fonction définie', () => {
      expect(typeof authService.resetPassword).toBe('function');
    });

    it('s\'exécute sans erreur', async () => {
      await expect(authService.resetPassword('test@example.com')).resolves.toBeUndefined();
    });
  });

  // ── updatePassword ────────────────────────────────────────────────────────

  describe('updatePassword', () => {
    it('est une fonction définie', () => {
      expect(typeof authService.updatePassword).toBe('function');
    });

    it('s\'exécute sans erreur', async () => {
      await expect(authService.updatePassword('NewPassword123!')).resolves.toBeUndefined();
    });
  });
});
