import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Zap, X } from 'lucide-react';
import { getLevelTitle } from '../../utils/calculations';
import { Button } from '../common/Button';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  discipline?: 'global' | 'musculation' | 'running';
}

const disciplineConfig = {
  global: { label: 'Niveau global', color: 'from-red-500 to-red-600', emoji: '⭐' },
  musculation: { label: 'Musculation', color: 'from-blue-500 to-indigo-600', emoji: '💪' },
  running: { label: 'Course', color: 'from-emerald-500 to-teal-600', emoji: '🏃' },
};

function Confetti() {
  const colors = ['#6d28d9', '#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#f97316'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
            top: '-10px',
          }}
          animate={{
            y: ['0vh', '110vh'],
            rotate: [0, Math.random() * 720 - 360],
            x: [0, (Math.random() - 0.5) * 200],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 0.5,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}

export function LevelUpModal({ isOpen, onClose, level, discipline = 'global' }: LevelUpModalProps) {
  const config = disciplineConfig[discipline];
  const title = getLevelTitle(level);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <Confetti />
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative z-10 bg-slate-900 border border-red-500/50 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
              className={`w-24 h-24 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30`}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="text-4xl"
              >
                {config.emoji}
              </motion.span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-red-400 font-semibold text-sm uppercase tracking-wider mb-1">
                Niveau supérieur !
              </p>
              <h2 className="text-4xl font-black text-white mb-2">
                Niveau {level}
              </h2>
              <p className="text-slate-300 text-lg font-medium mb-1">{title}</p>
              <p className="text-slate-400 text-sm">{config.label}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6"
            >
              <Button onClick={onClose} className="w-full" size="lg">
                <Star className="w-5 h-5" />
                Continuer
              </Button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
