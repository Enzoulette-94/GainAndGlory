import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

const heightClasses = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
};

export function ProgressBar({
  value,
  color = 'bg-red-500',
  height = 'sm',
  showLabel = false,
  label,
  animated = true,
  className = '',
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={className}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showLabel && <span className="text-xs text-slate-300 font-medium">{Math.round(clampedValue)}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-700/50 rounded-full overflow-hidden ${heightClasses[height]}`}>
        <motion.div
          className={`${heightClasses[height]} rounded-full ${color}`}
          initial={animated ? { width: 0 } : { width: `${clampedValue}%` }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
