import { supabase } from '../lib/supabase-client';
import { DEFAULT_EXERCISES } from '../utils/constants';
import type { ProfileRecord } from '../types/models';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const profileRecordsService = {
  async getRecords(userId: string): Promise<ProfileRecord[]> {
    const { data, error } = await db
      .from('profile_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async createRecord(
    userId: string,
    title: string,
    value: string,
    unit: string,
    category: 'musculation' | 'course' | 'calisthenics',
  ): Promise<ProfileRecord> {
    const { data, error } = await db
      .from('profile_records')
      .insert({ user_id: userId, title, value, unit, category })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateRecord(
    id: string,
    title: string,
    value: string,
    unit: string,
    category: 'musculation' | 'course' | 'calisthenics',
  ): Promise<ProfileRecord> {
    const { data, error } = await db
      .from('profile_records')
      .update({ title, value, unit, category })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Crée ou met à jour un record si la nouvelle valeur est meilleure
  async upsertRecord(
    userId: string,
    title: string,
    newValue: number,
    unit: string,
    category: 'musculation' | 'course' | 'calisthenics',
    ascending: boolean, // true = plus bas est meilleur (allure), false = plus haut est meilleur (poids, distance)
  ): Promise<void> {
    const { data: existing } = await db
      .from('profile_records')
      .select('id, value')
      .eq('user_id', userId)
      .eq('title', title)
      .eq('category', category)
      .maybeSingle();

    if (existing) {
      const current = parseFloat(existing.value) || 0;
      const isBetter = ascending ? newValue < current : newValue > current;
      if (isBetter) {
        const { error } = await db.from('profile_records').update({ value: newValue, unit }).eq('id', existing.id);
        if (error) throw error;
      }
    } else {
      const { error } = await db.from('profile_records').insert({ user_id: userId, title, value: newValue, unit, category });
      if (error) throw error;
    }
  },

  async deleteRecord(id: string): Promise<void> {
    const { error } = await db
      .from('profile_records')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Supprime les records muscu dont le titre n'est pas dans DEFAULT_EXERCISES
  async deleteOrphanedMuscuRecords(userId: string): Promise<void> {
    const knownNames = new Set(DEFAULT_EXERCISES.map(e => e.name));

    const { data } = await db
      .from('profile_records')
      .select('id, title')
      .eq('user_id', userId)
      .eq('category', 'musculation');

    const orphanIds: string[] = (data ?? [])
      .filter((r: { id: string; title: string }) => !knownNames.has(r.title))
      .map((r: { id: string }) => r.id);

    if (orphanIds.length === 0) return;

    await db.from('profile_records').delete().in('id', orphanIds);
  },
};
