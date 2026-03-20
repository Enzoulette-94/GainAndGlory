import { supabase } from '../lib/supabase-client';

const db = supabase as any;

export const notificationService = {
  /** Notify every user except the actor */
  async broadcastToAll(actorId: string, type: string, content: object): Promise<void> {
    try {
      const { data: profiles } = await db
        .from('profiles')
        .select('id')
        .neq('id', actorId);
      if (!profiles?.length) return;
      const rows = profiles.map((p: { id: string }) => ({
        user_id: p.id,
        type,
        content,
        read: false,
      }));
      await db.from('notifications').insert(rows);
    } catch { /* silently fail */ }
  },

  /** Notify a single specific user */
  async notifyUser(userId: string, type: string, content: object): Promise<void> {
    try {
      await db.from('notifications').insert({ user_id: userId, type, content, read: false });
    } catch { /* silently fail */ }
  },
};
