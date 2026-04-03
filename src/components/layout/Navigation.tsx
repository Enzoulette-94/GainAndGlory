import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Dumbbell, PersonStanding, Scale,
  Calendar, Target, Users, Trophy, User, Swords, ShieldCheck, X, Zap, Bookmark, Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/calendar', icon: Calendar, label: 'Calendrier' },
  { path: '/community', icon: Users, label: 'Les Monstres' },
  { path: '/musculation', icon: Dumbbell, label: 'Muscu' },
  { path: '/running', icon: PersonStanding, label: 'Course' },
  { path: '/calisthenics', icon: Zap, label: 'Calisthénie' },
  { path: '/crossfit', icon: Flame, label: 'Crossfit' },
  { path: '/weight', icon: Scale, label: 'Poids' },
  { path: '/seances', icon: Bookmark, label: 'Séances' },
  { path: '/goals', icon: Target, label: 'Objectifs' },
  { path: '/team-goals', icon: Swords, label: 'Objectifs équipe' },
  { path: '/hall-of-fame', icon: Trophy, label: 'Hall of Fame' },
  { path: '/profile', icon: User, label: 'Profil' },
];

export function SideNav() {
  const { profile } = useAuth();
  return (
    <nav className="hidden lg:flex flex-col gap-0.5 w-60 bg-[#0d0d0d] border-r border-[#c9a870]/10 min-h-screen">
      {/* Logo */}
      <div className="flex items-center px-4 h-[52px] mb-2 border-b border-[#c9a870]/10 flex-shrink-0">
        <span className="font-rajdhani font-bold text-[#c9a870] text-lg tracking-wide uppercase">Gain &amp; Glory</span>
      </div>
      <div className="flex flex-col gap-0.5 px-2 py-2">
      {navItems.map(({ path, icon: Icon, label }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) => `
            flex items-center gap-3 px-3 py-2.5 text-sm font-medium
            transition-colors duration-150
            ${isActive
              ? 'bg-[#c9a870]/10 text-[#c9a870] border-l-2 border-[#c9a870] pl-[10px]'
              : 'text-[#a3a3a3] hover:bg-white/5 hover:text-[#d4d4d4] border-l-2 border-transparent pl-[10px]'
            }
          `}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {label}
        </NavLink>
      ))}
        {profile?.is_admin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 text-sm font-medium
              transition-colors duration-150 mt-2 border-t border-[#c9a870]/10 pt-3
              ${isActive
                ? 'text-[#c9a870] border-l-2 border-[#c9a870] pl-[10px] bg-[#c9a870]/10'
                : 'text-[#a3a3a3] hover:bg-white/5 hover:text-[#d4d4d4] border-l-2 border-transparent pl-[10px]'
              }
            `}
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            Admin
          </NavLink>
        )}
      </div>
    </nav>
  );
}

export function MobileDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { profile } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/70 z-40"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.nav
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-[#0d0d0d] border-r border-[#c9a870]/10 z-50 flex flex-col overflow-y-auto"
          >
            {/* Header drawer */}
            <div className="flex items-center justify-between px-4 h-[52px] border-b border-[#c9a870]/10 flex-shrink-0">
              <span className="font-rajdhani font-bold text-[#c9a870] text-base tracking-wide uppercase">Gain &amp; Glory</span>
              <button onClick={onClose} className="p-1.5 text-[#6b6b6b] hover:text-[#d4d4d4] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Nav items */}
            <div className="flex flex-col gap-0.5 px-2 py-2 flex-1 overflow-y-auto max-h-[calc(100vh-52px)]">
              {navItems.map(({ path, icon: Icon, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 text-sm font-medium
                    transition-colors duration-150
                    ${isActive
                      ? 'bg-[#c9a870]/10 text-[#c9a870] border-l-2 border-[#c9a870] pl-[10px]'
                      : 'text-[#a3a3a3] hover:bg-white/5 hover:text-[#d4d4d4] border-l-2 border-transparent pl-[10px]'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </NavLink>
              ))}
              {profile?.is_admin && (
                <NavLink
                  to="/admin"
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 text-sm font-medium
                    transition-colors duration-150 mt-2 border-t border-[#c9a870]/10 pt-3
                    ${isActive
                      ? 'text-[#c9a870] border-l-2 border-[#c9a870] pl-[10px] bg-[#c9a870]/10'
                      : 'text-[#a3a3a3] hover:bg-white/5 hover:text-[#d4d4d4] border-l-2 border-transparent pl-[10px]'
                    }
                  `}
                >
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  Admin
                </NavLink>
              )}
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
