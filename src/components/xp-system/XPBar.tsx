import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Star } from 'lucide-react';
import { getLevelProgress, getLevelTitle, formatNumber } from '../../utils/calculations';
import type { Profile } from '../../types/models';

interface XPBarProps {
  profile: Profile;
  discipline?: 'global' | 'musculation' | 'running';
  compact?: boolean;
}

const disciplineConfig = {
  global: { label: 'Global', xpKey: 'total_xp', levelKey: 'global_level', color: 'from-red-800 to-red-900' },
  musculation: { label: 'Musculation', xpKey: 'musculation_xp', levelKey: 'musculation_level', color: 'from-red-800 to-red-900' },
  running: { label: 'Course', xpKey: 'running_xp', levelKey: 'running_level', color: 'from-blue-700 to-blue-900' },
};

export function XPBar({ profile, discipline = 'global', compact = false }: XPBarProps) {
  const config = disciplineConfig[discipline];
  const xp = profile[config.xpKey as keyof Profile] as number;
  const { level, current, needed, progress } = getLevelProgress(xp);
  const title = getLevelTitle(level);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-bold text-red-300">Niv.{level}</span>
        </div>
        <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden min-w-[60px]">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${config.color}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <span className="text-xs text-slate-400">{Math.round(progress * 100)}%</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl bg-gradient-to-r ${config.color}`}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-slate-400">{config.label}</p>
            <p className="font-bold text-slate-100">Niveau {level} · {title}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-100">{formatNumber(current)} XP</p>
          <p className="text-xs text-slate-400">/ {formatNumber(needed)} XP</p>
        </div>
      </div>

      <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${config.color} relative`}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
        </motion.div>
      </div>

      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-slate-500">Niveau {level}</span>
        <span className="text-xs text-slate-500">Niveau {level + 1}</span>
      </div>
    </div>
  );
}
