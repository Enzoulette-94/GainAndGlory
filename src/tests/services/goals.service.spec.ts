import { describe, it, expect, vi, beforeEach } from 'vitest';
import { goalsService } from '../../services/goals.service';

vi.mock('../../lib/supabase-client', () => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return {
    supabase: { from: vi.fn(() => mockChain) },
  };
});

describe('goalsService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getGoals', () => {
    it('est une fonction définie', () => {
      expect(typeof goalsService.getGoals).toBe('function');
    });

    it('retourne tous les objectifs d\'un utilisateur', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const goals = [
        { id: '1', type: 'running', title: 'Courir 100 km', status: 'active' },
        { id: '2', type: 'musculation', title: '100 kg au développé', status: 'completed' },
      ];
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: goals, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await goalsService.getGoals('user-1');
      expect(result.length).toBe(2);
    });
  });

  describe('createGoal', () => {
    it('est une fonction définie', () => {
      expect(typeof goalsService.createGoal).toBe('function');
    });

    it('retourne l\'objectif créé', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const newGoal = { id: 'g-1', title: 'Test objectif', type: 'running', status: 'active' };
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: newGoal, error: null }),
      };
      (supabase.from as any).mockReturnValue(mockChain);

      const result = await goalsService.createGoal({
        user_id: 'user-1',
        type: 'running',
        title: 'Test objectif',
      });
      expect(result.title).toBe('Test objectif');
    });
  });

  describe('updateProgress', () => {
    it('est une fonction définie', () => {
      expect(typeof goalsService.updateProgress).toBe('function');
    });

    it('appelle l\'update avec la nouvelle valeur', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const goal = { id: 'goal-1', current_value: 50 };
      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: goal, error: null }),
      };
      (supabase.from as any).mockReturnValue(chain);

      await goalsService.updateProgress('goal-1', 50);
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ current_value: 50 }));
    });
  });

  describe('completeGoal', () => {
    it('est une fonction définie', () => {
      expect(typeof goalsService.completeGoal).toBe('function');
    });

    it('met le status à "completed"', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'goal-1', status: 'completed' }, error: null }),
      };
      (supabase.from as any).mockReturnValue(chain);

      await goalsService.completeGoal('goal-1');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }));
    });
  });

  describe('cancelGoal', () => {
    it('est une fonction définie', () => {
      expect(typeof goalsService.cancelGoal).toBe('function');
    });

    it('met le status à "cancelled"', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'goal-1', status: 'cancelled' }, error: null }),
      };
      (supabase.from as any).mockReturnValue(chain);

      await goalsService.cancelGoal('goal-1');
      expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }));
    });
  });

  describe('deleteGoal', () => {
    it('est une fonction définie', () => {
      expect(typeof goalsService.deleteGoal).toBe('function');
    });

    it('lève une erreur si Supabase échoue', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const eqMock = vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
      (supabase.from as any).mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: eqMock }) });

      await expect(goalsService.deleteGoal('goal-1')).rejects.toBeTruthy();
    });
  });
});
