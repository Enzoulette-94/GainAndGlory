import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, hint, icon, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#d4d4d4]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a3a3]">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full bg-[#1c1c1c] border rounded px-4 py-2.5 text-sm text-[#f5f5f5]
            placeholder-[#4a4a4a] outline-none transition-all duration-200
            focus:ring-1 focus:ring-[#c9a870]/30 focus:border-[#c9a870]/50
            ${error ? 'border-red-500' : 'border-white/8 hover:border-white/10'}
            ${icon ? 'pl-10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-[#6b6b6b]">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className = '', id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#d4d4d4]">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`
          w-full bg-[#1c1c1c] border rounded px-4 py-2.5 text-sm text-[#f5f5f5]
          placeholder-[#4a4a4a] outline-none transition-all duration-200
          focus:ring-1 focus:ring-[#c9a870]/30 focus:border-[#c9a870]/50 resize-none
          ${error ? 'border-red-500' : 'border-white/8 hover:border-white/10'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-[#6b6b6b]">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className = '', id, ...props }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#d4d4d4]">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`
          w-full bg-[#1c1c1c] border rounded px-4 py-2.5 text-sm text-[#f5f5f5]
          outline-none transition-all duration-200 cursor-pointer
          focus:ring-1 focus:ring-[#c9a870]/30 focus:border-[#c9a870]/50
          ${error ? 'border-red-500' : 'border-white/8 hover:border-white/10'}
          ${className}
        `}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-[#1c1c1c]">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
