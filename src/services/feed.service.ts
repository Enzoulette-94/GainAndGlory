import { supabase } from '../lib/supabase-client';
import type { ActivityFeedItem } from '../types/models';

const db = supabase as any;

export const feedService = {
  // Récupérer le feed global (tous les users qui partagent)
  async getFeed(limit = 20, offset = 0): Promise<ActivityFeedItem[]> {
    const { data, error } = await db
      .from('activity_feed')
      .select(`
        *,
        user:profiles(id, username, global_level, avatar_url),
        likes:activity_likes(id, user_id),
        comments:activity_comments(
          id, content, created_at,
          user:profiles(id, username)
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return (data ?? []) as ActivityFeedItem[];
  },

  // Feed personnel
  async getUserFeed(userId: string, limit = 20): Promise<ActivityFeedItem[]> {
    const { data, error } = await db
      .from('activity_feed')
      .select(`
        *,
        user:profiles(id, username, global_level, avatar_url),
        likes:activity_likes(id, user_id),
        comments:activity_comments(
          id, content, created_at,
          user:profiles(id, username)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as ActivityFeedItem[];
  },

  // Like / Unlike
  async toggleLike(activityId: string, userId: string): Promise<boolean> {
    const { data: existing } = await db
      .from('activity_likes')
      .select('id')
      .eq('activity_id', activityId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await db.from('activity_likes').delete().eq('id', existing.id);
      return false; // unliked
    } else {
      await db.from('activity_likes').insert({ activity_id: activityId, user_id: userId });
      return true; // liked
    }
  },

  // Ajouter un commentaire
  async addComment(activityId: string, userId: string, content: string) {
    const { data, error } = await db
      .from('activity_comments')
      .insert({ activity_id: activityId, user_id: userId, content })
      .select(`*, user:profiles(id, username)`)
      .single();
    if (error) throw error;
    return data;
  },

  // Supprimer un commentaire
  async deleteComment(commentId: string) {
    const { error } = await db.from('activity_comments').delete().eq('id', commentId);
    if (error) throw error;
  },

  // Publier une séance muscu dans le feed
  async publishWorkout(userId: string, tonnage: number, setsCount: number, feedback?: string, sessionId?: string, name?: string) {
    try {
      await db.from('activity_feed').insert({
        user_id: userId,
        type: 'workout',
        content: { type: 'workout', tonnage, sets_count: setsCount, feedback, session_id: sessionId, name },
      });
    } catch { /* ignore */ }
  },

  // Publier une course dans le feed
  async publishRun(userId: string, distance: number, duration: number, pace: number, runType?: string, sessionId?: string, name?: string, feedback?: string) {
    try {
      await db.from('activity_feed').insert({
        user_id: userId,
        type: 'run',
        content: { type: 'run', distance, duration, pace, run_type: runType, session_id: sessionId, name, feedback },
      });
    } catch { /* ignore */ }
  },
};
