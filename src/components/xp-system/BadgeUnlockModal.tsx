import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { BADGE_RARITY_CONFIG, BADGE_XP_REWARDS } from '../../utils/constants';
import type { UserBadge } from '../../types/models';

interface BadgeUnlockModalProps {
  badge: UserBadge | null;
  onClose: () => void;
}

export function BadgeUnlockModal({ badge, onClose }: BadgeUnlockModalProps) {
  const b = badge?.badge;
  // Fermeture auto après 8 secondes
  useEffect(() => {
    if (!badge) return;
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [badge, onClose]);

  const rarityKey = (b?.rarity ?? 'common') as keyof typeof BADGE_RARITY_CONFIG;
  const config = BADGE_RARITY_CONFIG[rarityKey] ?? BADGE_RARITY_CONFIG.common;
  const xp = BADGE_XP_REWARDS[b?.rarity ?? 'common'] ?? 50;
  const isEpic = ['rare', 'epic', 'legendary'].includes(b?.rarity ?? '');

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/80" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-xs bg-[#0d0d0d] border overflow-hidden"
            style={{ borderColor: config.color + '60' }}
          >
            {/* Top glow band */}
            <div className="h-1 w-full" style={{ background: config.color }} />

            {/* Pulsing bg for epic+ */}
            {isEpic && (
              <motion.div
                animate={{ opacity: [0.05, 0.12, 0.05] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at center, ${config.color}30, transparent 70%)` }}
              />
            )}

            <div className="p-6 text-center space-y-4 relative">
              {/* Header */}
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.2em] font-rajdhani font-bold" style={{ color: config.color }}>
                  ✦ Badge débloqué
                </p>
                <p className="text-[10px] uppercase tracking-widest text-[#4a4a4a] font-rajdhani">
                  {b?.rarity ?? 'commun'}
                </p>
              </div>

              {/* Icon */}
              <motion.div
                animate={isEpic ? { scale: [1, 1.08, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mx-auto w-16 h-16 flex items-center justify-center border-2"
                style={{ borderColor: config.color + '60', backgroundColor: config.bg }}
              >
                <Trophy className="w-8 h-8" style={{ color: config.color }} />
              </motion.div>

              {/* Badge name */}
              <div className="space-y-1">
                <h2 className="font-rajdhani font-black text-2xl text-white uppercase tracking-wide">
                  {b?.name ?? 'Badge'}
                </h2>
                {b?.description && (
                  <p className="text-xs text-[#6b6b6b] leading-relaxed">
                    &ldquo;{b.description}&rdquo;
                  </p>
                )}
              </div>

              {/* XP */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 border"
                style={{ borderColor: config.color + '50', backgroundColor: config.bg }}
              >
                <span className="font-rajdhani font-black text-lg" style={{ color: config.color }}>
                  + {xp} XP
                </span>
              </motion.div>

              {/* Button */}
              <button
                onClick={onClose}
                className="w-full py-2.5 font-rajdhani font-bold uppercase tracking-wide text-sm text-white border border-white/10 hover:bg-white/5 transition-colors"
              >
                Continuer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
