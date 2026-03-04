import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-[#7f1d1d] hover:bg-[#991b1b] text-white border-[#6b1414]',
  secondary: 'bg-[#1c1c1c] hover:bg-[#2a2a2a] text-[#d4d4d4] border-white/10',
  danger: 'bg-red-800 hover:bg-red-700 text-white border-red-900',
  ghost: 'bg-transparent hover:bg-white/5 text-[#a3a3a3] border-transparent',
  outline: 'bg-transparent hover:bg-[#c9a870]/10 text-[#c9a870] border-[#c9a870]/50',
};

const sizeClasses = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-sm px-6 py-3',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-rajdhani font-semibold tracking-wide
        border transition-colors duration-150 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
