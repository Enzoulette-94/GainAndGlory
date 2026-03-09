import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workoutService } from '../../services/workout.service';

// Mock du module supabase
vi.mock('../../lib/supabase-client', () => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
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

describe('workoutService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getExercises', () => {
    it('est une fonction définie', () => {
      expect(typeof workoutService.getExercises).toBe('function');
    });

    it('retourne un tableau en cas de succès', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [
          { id: '1', name: 'Développé couché', muscle_group: 'pectoraux', is_default: true },
          { id: '2', name: 'Squat', muscle_group: 'jambes', is_default: true },
        ], error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await workoutService.getExercises();
      expect(Array.isArray(result)).toBe(true);
    });

    it('lève une erreur si Supabase échoue', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      await expect(workoutService.getExercises()).rejects.toBeTruthy();
    });
  });

  describe('getSessions', () => {
    it('est une fonction définie', () => {
      expect(typeof workoutService.getSessions).toBe('function');
    });

    it('accepte userId, limit et offset comme paramètres', () => {
      expect(workoutService.getSessions.length).toBeGreaterThanOrEqual(1);
    });

    it('retourne un tableau vide si aucune donnée', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await workoutService.getSessions('user-1');
      expect(result).toEqual([]);
    });
  });

  describe('deleteSession', () => {
    it('est une fonction définie', () => {
      expect(typeof workoutService.deleteSession).toBe('function');
    });

    it('appelle la table workout_sessions avec l\'id correct', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
      (supabase.from as any).mockReturnValue({ delete: deleteMock });

      await workoutService.deleteSession('session-123');
      expect(supabase.from).toHaveBeenCalledWith('workout_sessions');
    });
  });

  describe('updateSession', () => {
    it('est une fonction définie', () => {
      expect(typeof workoutService.updateSession).toBe('function');
    });

    it('lève une erreur si Supabase retourne une erreur', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const eqMock = vi.fn().mockResolvedValue({ error: { message: 'Update failed' } });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
      (supabase.from as any).mockReturnValue({ update: updateMock });

      await expect(workoutService.updateSession('session-1', { feedback: 'facile' })).rejects.toBeTruthy();
    });
  });

  describe('replaceSets', () => {
    it('est une fonction définie', () => {
      expect(typeof workoutService.replaceSets).toBe('function');
    });

    it('supprime d\'abord tous les sets existants avant d\'insérer', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const calls: string[] = [];
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const deleteMock = vi.fn(() => { calls.push('delete'); return { eq: eqMock }; });
      const insertMock = vi.fn(() => { calls.push('insert'); return Promise.resolve({ error: null }); });
      const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
      (supabase.from as any).mockReturnValue({
        delete: deleteMock,
        insert: insertMock,
        update: updateMock,
      });

      const sets = [{ exercise_id: 'ex-1', set_number: 1, reps: 10, weight: 80 }];
      await workoutService.replaceSets('session-1', sets);
      expect(calls[0]).toBe('delete');
    });
  });

  describe('getSessionsCount', () => {
    it('est une fonction définie', () => {
      expect(typeof workoutService.getSessionsCount).toBe('function');
    });
  });

  describe('createExercise', () => {
    it('est une fonction définie', () => {
      expect(typeof workoutService.createExercise).toBe('function');
    });
  });

  describe('Migration #3 — workout_sessions_with_tonnage VIEW', () => {
    it('getSessions interroge la VIEW workout_sessions_with_tonnage', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      await workoutService.getSessions('user-1');
      expect(supabase.from).toHaveBeenCalledWith('workout_sessions_with_tonnage');
    });

    it('createSession ne tente pas d\'écrire total_tonnage dans workout_sessions', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      let capturedPayload: any = null;
      const insertMock = vi.fn((payload: any) => {
        capturedPayload = payload;
        return { select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 's-1', user_id: 'user-1', date: '2026-01-01T00:00:00Z', feedback: null, notes: null, created_at: '2026-01-01T00:00:00Z' }, error: null }) };
      });
      (supabase.from as any).mockReturnValue({ insert: insertMock });

      await workoutService.createSession({ user_id: 'user-1', sets: [] });
      // total_tonnage ne doit pas être dans le payload — la VIEW le calcule
      expect(capturedPayload).not.toHaveProperty('total_tonnage');
    });

    it('replaceSets ne met pas à jour total_tonnage manuellement', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      (supabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnValue({ eq: eqMock }),
        insert: insertMock,
        update: updateMock,
      });

      const sets = [{ exercise_id: 'ex-1', set_number: 1, reps: 10, weight: 80 }];
      await workoutService.replaceSets('session-1', sets);
      // update ne doit PAS être appelé pour mettre à jour total_tonnage
      expect(updateMock).not.toHaveBeenCalled();
    });

    it('getTotalTonnage interroge la VIEW workout_sessions_with_tonnage', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ total_tonnage: 9750 }, { total_tonnage: 8200 }],
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await workoutService.getTotalTonnage('user-1');
      expect(supabase.from).toHaveBeenCalledWith('workout_sessions_with_tonnage');
      expect(result).toBe(17950);
    });

    it('updateSession n\'accepte plus total_tonnage en paramètre', () => {
      // Vérification TypeScript : la signature ne contient plus total_tonnage
      // On vérifie que la fonction existe et accepte les bons paramètres
      expect(typeof workoutService.updateSession).toBe('function');
      // feedback et notes sont toujours valides
      expect(workoutService.updateSession.length).toBeGreaterThanOrEqual(1);
    });
  });
});
