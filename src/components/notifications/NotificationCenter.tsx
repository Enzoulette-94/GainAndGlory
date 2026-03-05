import React from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Check, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatRelativeTime } from '../../utils/calculations';
import type { NotificationType } from '../../types/enums';

const notifIcons: Record<NotificationType, string> = {
  flash_challenge: '⚡',
  record_beaten: '📊',
  badge_unlocked: '🏅',
  level_up: '⬆️',
  event_created: '📅',
  like: '❤️',
  comment: '💬',
};

interface NotificationCenterProps {
  onClose: () => void;
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-1rem)] bg-[#0d0d0d] border border-white/8 rounded shadow-2xl z-20 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-red-400" />
            <h3 className="font-semibold text-[#f5f5f5] text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tout lire
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <BellOff className="w-8 h-8 text-[#4a4a4a]" />
              <p className="text-sm text-[#6b6b6b]">Aucune notification</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-[#1c1c1c] transition-colors border-b border-white/5 last:border-0 ${!notif.read ? 'bg-red-900/10' : ''}`}
              >
                <span className="text-lg flex-shrink-0 mt-0.5">
                  {notifIcons[notif.type as NotificationType] ?? '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notif.read ? 'text-[#d4d4d4]' : 'text-[#f5f5f5] font-medium'}`}>
                    {(notif.content as { message?: string })?.message ?? ''}
                  </p>
                  <p className="text-xs text-[#6b6b6b] mt-0.5">
                    {formatRelativeTime(notif.created_at)}
                  </p>
                </div>
                {!notif.read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="p-1 rounded-lg hover:bg-slate-700 text-red-400 transition-colors flex-shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </>
  );
}
