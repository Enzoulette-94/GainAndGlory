import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  glass?: boolean;
}

export function Card({ children, className = '', onClick, hover = false, glass = false }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl border border-slate-700/50
        ${glass
          ? 'bg-white/5 backdrop-blur-sm'
          : 'bg-slate-900/80'
        }
        ${hover || onClick ? 'hover:border-red-500/50 hover:bg-slate-800/80 transition-all duration-200' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action, icon }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between p-4 border-b border-slate-700/50">
      <div className="flex items-center gap-3">
        {icon && <div className="text-red-400">{icon}</div>}
        <div>
          <h3 className="font-semibold text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
