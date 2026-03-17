import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { getLevelProgress, getLevelTitle, getStatusTitle, getStatusColor, formatNumber } from '../../utils/calculations';
import type { Profile } from '../../types/models';

interface XPBarProps {
  profile: Profile;
  discipline?: 'global' | 'musculation' | 'running' | 'calisthenics' | 'crossfit';
  compact?: boolean;
}

const disciplineConfig = {
  global:       { label: 'Global',      xpKey: 'total_xp',         levelKey: 'global_level',        barGradient: null,                          accentColor: null },
  musculation:  { label: 'Musculation', xpKey: 'musculation_xp',   levelKey: 'musculation_level',   barGradient: 'linear-gradient(to right, #7f1d1d, #ef4444)', accentColor: '#f87171' },
  running:      { label: 'Course',      xpKey: 'running_xp',       levelKey: 'running_level',       barGradient: 'linear-gradient(to right, #1e3a5f, #3b82f6)', accentColor: '#60a5fa' },
  calisthenics: { label: 'Calisthénie', xpKey: 'calisthenics_xp',  levelKey: 'calisthenics_level',  barGradient: 'linear-gradient(to right, #3b0764, #a855f7)', accentColor: '#c084fc' },
  crossfit: { label: 'Crossfit', xpKey: 'crossfit_xp', levelKey: 'crossfit_level', barGradient: 'linear-gradient(to right, #7c2d12, #f97316)', accentColor: '#fb923c' },
};

export function XPBar({ profile, discipline = 'global', compact = false }: XPBarProps) {
  const config = disciplineConfig[discipline];
  const xp = profile[config.xpKey as keyof Profile] as number;
  const { level, current, needed, progress } = getLevelProgress(xp);
  const statusTitle = discipline === 'global' ? getStatusTitle(level) : getLevelTitle(level);
  const statusColor = discipline === 'global' ? getStatusColor(level) : config.accentColor;
  const barBackground = discipline === 'global'
    ? (statusColor ? `linear-gradient(to right, ${statusColor}99, ${statusColor})` : 'linear-gradient(to right, #8b6f47, #c9a870)')
    : (config.barGradient ?? 'linear-gradient(to right, #8b6f47, #c9a870)');

  if (compact) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1 flex-shrink-0">
          <Star className="w-3.5 h-3.5" style={{ color: statusColor ?? '#c9a870' }} />
          <span className="text-xs font-bold font-rajdhani" style={{ color: statusColor ?? '#c9a870' }}>
            Niv.{level}
          </span>
        </div>
        <div className="flex-1 h-1.5 bg-white/10 overflow-hidden min-w-[60px]">
          <motion.div
            className="h-full"
            style={{ background: statusColor ? `linear-gradient(to right, ${statusColor}99, ${statusColor})` : undefined }}
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <span className="text-xs text-[#6b6b6b] flex-shrink-0">{Math.round(progress * 100)}%</span>
        {statusTitle && (
          <span
            className="text-xs font-rajdhani font-semibold hidden lg:block flex-shrink-0 truncate max-w-[140px]"
            style={{ color: statusColor ?? '#a3a3a3' }}
          >
            {statusTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#111111] p-4 border border-white/5 flex flex-col">
      <div className="flex items-start justify-between mb-3 flex-1">
        <div>
          <p className="text-xs text-[#a3a3a3]">{config.label}</p>
          <p className="font-rajdhani font-bold" style={{ color: statusColor ?? '#c9a870' }}>
            Niveau {level}
            {statusTitle && <span className="font-medium opacity-80"> · {statusTitle}</span>}
          </p>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <p className="text-sm font-bold font-rajdhani" style={{ color: statusColor ?? '#c9a870' }}>
            {formatNumber(current)} XP
          </p>
          <p className="text-xs text-[#6b6b6b]">/ {formatNumber(needed)} XP</p>
        </div>
      </div>

      <div className="mt-auto">
        <div className="h-2 bg-white/5 overflow-hidden">
          <motion.div
            className="h-full"
            style={{ background: barBackground }}
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-[#6b6b6b]">Niveau {level}</span>
          <span className="text-xs text-[#6b6b6b]">Niveau {level + 1}</span>
        </div>
      </div>
    </div>
  );
}
