import { supabase } from '../lib/supabase-client';
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
    category: 'musculation' | 'course',
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
    category: 'musculation' | 'course',
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

  async deleteRecord(id: string): Promise<void> {
    const { error } = await db
      .from('profile_records')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
