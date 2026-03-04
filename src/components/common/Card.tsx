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
        border border-white/5
        ${glass
          ? 'bg-white/5 backdrop-blur-sm'
          : 'bg-[#111111]'
        }
        ${hover || onClick ? 'hover:border-[#c9a870]/30 hover:bg-[#1c1c1c] transition-colors duration-150' : ''}
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
    <div className="flex items-start justify-between p-4 border-b border-white/5">
      <div className="flex items-center gap-3">
        {icon && <div className="text-[#c9a870]">{icon}</div>}
        <div>
          <h3 className="font-rajdhani font-semibold text-[#f5f5f5] tracking-wide">{title}</h3>
          {subtitle && <p className="text-xs text-[#a3a3a3] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
