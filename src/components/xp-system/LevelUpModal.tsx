import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Zap, X } from 'lucide-react';
import { getLevelTitle } from '../../utils/calculations';
import { Button } from '../common/Button';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  discipline?: 'global' | 'musculation' | 'running' | 'calisthenics' | 'crossfit';
}

const disciplineConfig = {
  global: { label: 'Niveau global', color: 'from-red-500 to-red-600', emoji: '⭐' },
  musculation: { label: 'Musculation', color: 'from-blue-500 to-indigo-600', emoji: '💪' },
  running: { label: 'Course', color: 'from-emerald-500 to-teal-600', emoji: '🏃' },
  calisthenics: { label: 'Calisthénie', color: 'from-violet-500 to-purple-600', emoji: '⚡' },
  crossfit: { label: 'Crossfit', color: 'from-orange-500 to-red-600', emoji: '🔥' },
};

function Confetti() {
  const colors = ['#6d28d9', '#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#f97316'];
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      left: Math.random() * 100,
      rotate: Math.random() * 720 - 360,
      x: (Math.random() - 0.5) * 200,
      duration: 2 + Math.random() * 2,
      delay: Math.random() * 0.5,
      color: colors[i % colors.length],
    })),
  []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{ backgroundColor: p.color, left: `${p.left}%`, top: '-10px' }}
          animate={{ y: ['0vh', '110vh'], rotate: [0, p.rotate], x: [0, p.x] }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
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
            className="relative z-10 bg-[#0d0d0d] border border-red-500/50 rounded p-8 max-w-sm w-full text-center shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-700 text-[#a3a3a3] transition-colors"
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
                <strong>Niveau supérieur</strong> !
              </p>
              <h2 className="text-4xl font-black text-white mb-2">
                Niveau {level}
              </h2>
              <p className="text-[#d4d4d4] text-lg font-medium mb-1">{title}</p>
              <p className="text-[#a3a3a3] text-sm">{config.label}</p>
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
