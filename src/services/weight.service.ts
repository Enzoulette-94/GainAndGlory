import { supabase } from '../lib/supabase-client';
import type { WeightEntry } from '../types/models';

export const weightService = {
  async createEntry(userId: string, weight: number, date?: string, notes?: string, photoFile?: File): Promise<WeightEntry> {
    let photo_url: string | null = null;

    if (photoFile) {
      const ext = photoFile.name.split('.').pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(path, photoFile, { contentType: photoFile.type });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('progress-photos').getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from('weight_entries')
      .insert({
        user_id: userId,
        weight,
        date: date ?? new Date().toISOString().split('T')[0],
        notes: notes ?? null,
        photo_url,
      })
      .select()
      .single();

    if (error) throw error;
    return data as WeightEntry;
  },

  async getEntries(userId: string, limit = 90): Promise<WeightEntry[]> {
    const { data, error } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as WeightEntry[];
  },

  async deleteEntry(entryId: string) {
    const { error } = await supabase.from('weight_entries').delete().eq('id', entryId);
    if (error) throw error;
  },

  async updateEntry(entryId: string, updates: { weight?: number; date?: string; notes?: string | null }) {
    const { error } = await supabase.from('weight_entries').update(updates).eq('id', entryId);
    if (error) throw error;
  },

  async getLatest(userId: string): Promise<WeightEntry | null> {
    const { data, error } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data as WeightEntry | null;
  },

  async getFirstEntry(userId: string): Promise<WeightEntry | null> {
    const { data, error } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data as WeightEntry | null;
  },
};
