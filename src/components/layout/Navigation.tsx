import React, { useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Dumbbell, PersonStanding, Scale,
  Calendar, Target, Users, Trophy, CalendarDays, User, Swords, ShieldCheck, MoreHorizontal, X, Zap, Bookmark,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/community', icon: Users, label: 'Les Monstres' },
  { path: '/musculation', icon: Dumbbell, label: 'Muscu' },
  { path: '/running', icon: PersonStanding, label: 'Course' },
  { path: '/calisthenics', icon: Zap, label: 'Calisthénie' },
  { path: '/weight', icon: Scale, label: 'Poids' },
  { path: '/seances', icon: Bookmark, label: 'Séances' },
  { path: '/calendar', icon: Calendar, label: 'Calendrier' },
  { path: '/goals', icon: Target, label: 'Objectifs' },
  { path: '/team-goals', icon: Swords, label: 'Objectifs équipe' },
  { path: '/hall-of-fame', icon: Trophy, label: 'Hall of Fame' },
  { path: '/events', icon: CalendarDays, label: 'Événements' },
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

export function BottomNav() {
  const location = useLocation();
  const { profile } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const mainItems = navItems.slice(0, 4);
  const moreItems = navItems.slice(4);

  const isMoreActive = moreItems.some(item => location.pathname === item.path);

  return (
    <>
      {/* Drawer "Plus" */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-[#c9a870]/20 z-50 rounded-t-xl"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <span className="font-rajdhani font-bold text-[#c9a870] uppercase tracking-wide text-sm">Menu</span>
                <button
                  onClick={() => setShowMore(false)}
                  className="p-1.5 text-[#6b6b6b] hover:text-[#d4d4d4] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1 p-3">
                {moreItems.map(({ path, icon: Icon, label }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setShowMore(false)}
                      className="flex flex-col items-center gap-1 p-3 min-h-[64px] justify-center transition-colors"
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-[#c9a870]' : 'text-[#6b6b6b]'}`} />
                      <span className={`text-xs text-center font-medium leading-tight ${isActive ? 'text-[#c9a870]' : 'text-[#6b6b6b]'}`}>
                        {label}
                      </span>
                    </Link>
                  );
                })}
                {profile?.is_admin && (
                  <Link
                    to="/admin"
                    onClick={() => setShowMore(false)}
                    className="flex flex-col items-center gap-1 p-3 min-h-[64px] justify-center transition-colors"
                  >
                    <ShieldCheck className={`w-5 h-5 ${location.pathname === '/admin' ? 'text-[#c9a870]' : 'text-[#6b6b6b]'}`} />
                    <span className={`text-xs text-center font-medium leading-tight ${location.pathname === '/admin' ? 'text-[#c9a870]' : 'text-[#6b6b6b]'}`}>
                      Admin
                    </span>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* BottomNav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0d0d0d]/95 backdrop-blur-sm border-t border-[#c9a870]/10 z-40">
        <div className="flex items-center justify-around px-2 py-2" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
          {mainItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <NavLink
                key={path}
                to={path}
                className="flex flex-col items-center gap-0.5 px-3 py-2.5 min-w-[44px] min-h-[44px] justify-center"
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#c9a870]' : 'text-[#6b6b6b]'}`} />
                <span className={`text-xs font-medium transition-colors ${isActive ? 'text-[#c9a870]' : 'text-[#6b6b6b]'}`}>
                  {label}
                </span>
              </NavLink>
            );
          })}

          {/* Bouton Plus */}
          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-2.5 min-w-[44px] min-h-[44px] justify-center"
          >
            <MoreHorizontal className={`w-5 h-5 transition-colors ${isMoreActive ? 'text-[#c9a870]' : 'text-[#6b6b6b]'}`} />
            <span className={`text-xs font-medium transition-colors ${isMoreActive ? 'text-[#c9a870]' : 'text-[#6b6b6b]'}`}>
              Plus
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
