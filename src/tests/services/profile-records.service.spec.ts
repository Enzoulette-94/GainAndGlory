import { describe, it, expect, vi, beforeEach } from 'vitest';
import { profileRecordsService } from '../../services/profile-records.service';

// ─── Mock Supabase ────────────────────────────────────────────────────────────
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

// ─── Données de test ─────────────────────────────────────────────────────────

const mockMuscu = {
  id: 'r-1', user_id: 'user-1',
  title: 'Développé couché',
  value: 125,       // DECIMAL post-migration (kg)
  unit: 'kg',
  category: 'musculation',
  created_at: '2026-01-01T00:00:00Z',
};

const mockCourse = {
  id: 'r-2', user_id: 'user-1',
  title: 'Semi-marathon',
  value: 6120,      // DECIMAL post-migration (secondes : 1:42:00 → 6120s)
  unit: '21 km',
  category: 'course',
  created_at: '2026-02-01T00:00:00Z',
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('profileRecordsService', () => {

  beforeEach(() => vi.clearAllMocks());

  // ── getRecords ─────────────────────────────────────────────────────────────

  describe('getRecords', () => {
    it('est une fonction définie', () => {
      expect(typeof profileRecordsService.getRecords).toBe('function');
    });

    it('retourne un tableau vide si aucun record', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      (supabase.from as any).mockReturnValue(chain);

      const result = await profileRecordsService.getRecords('user-1');
      expect(result).toEqual([]);
    });

    it('retourne les records avec value en DECIMAL (nombre)', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockMuscu, mockCourse], error: null }),
      };
      (supabase.from as any).mockReturnValue(chain);

      const result = await profileRecordsService.getRecords('user-1');
      expect(result).toHaveLength(2);
      // value est un nombre (DECIMAL) et non une chaîne
      expect(typeof result[0].value).toBe('number');
      expect(result[0].value).toBe(125);
    });

    it('retourne les records de course avec value en secondes', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockCourse], error: null }),
      };
      (supabase.from as any).mockReturnValue(chain);

      const result = await profileRecordsService.getRecords('user-1');
      // "1:42:00" → 6120 secondes
      expect(result[0].value).toBe(6120);
    });

    it('lève une erreur si Supabase échoue', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      };
      (supabase.from as any).mockReturnValue(chain);

      await expect(profileRecordsService.getRecords('user-1')).rejects.toBeTruthy();
    });
  });

  // ── createRecord ───────────────────────────────────────────────────────────

  describe('createRecord', () => {
    it('est une fonction définie', () => {
      expect(typeof profileRecordsService.createRecord).toBe('function');
    });

    it('insère un record muscu avec une valeur numérique', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const singleMock = vi.fn().mockResolvedValue({ data: mockMuscu, error: null });
      const chain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: singleMock,
      };
      (supabase.from as any).mockReturnValue(chain);

      const result = await profileRecordsService.createRecord('user-1', 'Développé couché', '125', 'kg', 'musculation');
      expect(singleMock).toHaveBeenCalled();
      expect(result).toMatchObject({ title: 'Développé couché', category: 'musculation' });
    });

    it('insère un record course avec une valeur en secondes', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const singleMock = vi.fn().mockResolvedValue({ data: mockCourse, error: null });
      const chain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: singleMock,
      };
      (supabase.from as any).mockReturnValue(chain);

      // "1:42:00" converti en 6120 avant l'appel
      const result = await profileRecordsService.createRecord('user-1', 'Semi-marathon', '6120', '21 km', 'course');
      expect(result.category).toBe('course');
      expect(result.value).toBe(6120);
    });

    it('inclut la catégorie dans le payload Supabase', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const insertMock = vi.fn().mockReturnThis();
      const chain = {
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMuscu, error: null }),
      };
      (supabase.from as any).mockReturnValue(chain);

      await profileRecordsService.createRecord('user-1', 'Squat', '140', 'kg', 'musculation');
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'musculation' })
      );
    });

    it('lève une erreur si Supabase échoue', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const chain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert error' } }),
      };
      (supabase.from as any).mockReturnValue(chain);

      await expect(
        profileRecordsService.createRecord('user-1', 'Squat', '140', 'kg', 'musculation')
      ).rejects.toBeTruthy();
    });
  });

  // ── updateRecord ───────────────────────────────────────────────────────────

  describe('updateRecord', () => {
    it('est une fonction définie', () => {
      expect(typeof profileRecordsService.updateRecord).toBe('function');
    });

    it('met à jour les champs title, value, unit, category', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const updateMock = vi.fn().mockReturnThis();
      const chain = {
        update: updateMock,
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...mockMuscu, value: 130 }, error: null }),
      };
      (supabase.from as any).mockReturnValue(chain);

      const result = await profileRecordsService.updateRecord('r-1', 'Développé couché', '130', 'kg', 'musculation');
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Développé couché', unit: 'kg', category: 'musculation' })
      );
      expect(result.value).toBe(130);
    });

    it('lève une erreur si Supabase échoue', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update error' } }),
      };
      (supabase.from as any).mockReturnValue(chain);

      await expect(
        profileRecordsService.updateRecord('r-1', 'Squat', '140', 'kg', 'musculation')
      ).rejects.toBeTruthy();
    });
  });

  // ── deleteRecord ───────────────────────────────────────────────────────────

  describe('deleteRecord', () => {
    it('est une fonction définie', () => {
      expect(typeof profileRecordsService.deleteRecord).toBe('function');
    });

    it('supprime le record via son id', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const chain = {
        delete: vi.fn().mockReturnThis(),
        eq: eqMock,
      };
      (supabase.from as any).mockReturnValue(chain);

      await expect(profileRecordsService.deleteRecord('r-1')).resolves.toBeUndefined();
      expect(eqMock).toHaveBeenCalledWith('id', 'r-1');
    });

    it('lève une erreur si Supabase échoue', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const chain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete error' } }),
      };
      (supabase.from as any).mockReturnValue(chain);

      await expect(profileRecordsService.deleteRecord('r-1')).rejects.toBeTruthy();
    });
  });

  // ── Compatibilité migration ────────────────────────────────────────────────

  describe('Compatibilité migration (value DECIMAL)', () => {
    it('les valeurs muscu restent numériques après lecture', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { id: 'r-1', title: 'DC', value: 125, unit: 'kg', category: 'musculation', created_at: '2026-01-01T00:00:00Z' },
            { id: 'r-2', title: 'Squat', value: 140, unit: 'kg', category: 'musculation', created_at: '2026-01-02T00:00:00Z' },
          ],
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValue(chain);

      const result = await profileRecordsService.getRecords('user-1');
      // Le tri numérique fonctionne (140 > 125)
      const sorted = [...result].sort((a, b) => (b.value as number) - (a.value as number));
      expect(sorted[0].title).toBe('Squat');
      expect(sorted[1].title).toBe('DC');
    });

    it('les valeurs course en secondes permettent le tri par meilleur temps', async () => {
      const { supabase } = await import('../../lib/supabase-client');
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { id: 'r-3', title: '10 km', value: 2640, unit: '10 km', category: 'course', created_at: '2026-01-01T00:00:00Z' },  // 44:00
            { id: 'r-4', title: '10 km', value: 2760, unit: '10 km', category: 'course', created_at: '2026-01-02T00:00:00Z' },  // 46:00
          ],
          error: null,
        }),
      };
      (supabase.from as any).mockReturnValue(chain);

      const result = await profileRecordsService.getRecords('user-1');
      // Meilleur temps = valeur la plus petite (ascending pour course)
      const best = [...result].sort((a, b) => (a.value as number) - (b.value as number));
      expect(best[0].value).toBe(2640); // 44:00 gagne
    });
  });
});
