import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Dumbbell, PersonStanding, Scale,
  Calendar, Target, Users, Trophy, CalendarDays, User, Shield,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/musculation', icon: Dumbbell, label: 'Muscu' },
  { path: '/running', icon: PersonStanding, label: 'Course' },
  { path: '/weight', icon: Scale, label: 'Poids' },
  { path: '/calendar', icon: Calendar, label: 'Calendrier' },
  { path: '/goals', icon: Target, label: 'Objectifs' },
  { path: '/community', icon: Users, label: 'Communauté' },
  { path: '/hall-of-fame', icon: Trophy, label: 'Hall of Fame' },
  { path: '/events', icon: CalendarDays, label: 'Événements' },
  { path: '/profile', icon: User, label: 'Profil' },
];

export function SideNav() {
  return (
    <nav className="hidden lg:flex flex-col gap-0.5 p-4 w-60 bg-[#0d0d0d] border-r border-[#c9a870]/10 min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-[#c9a870]/10">
        <Shield className="w-6 h-6 text-[#c9a870]" />
        <span className="font-rajdhani font-bold text-[#c9a870] text-lg tracking-wide uppercase">Gain &amp; Glory</span>
      </div>

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
    </nav>
  );
}

export function BottomNav() {
  const location = useLocation();
  const mainItems = navItems.slice(0, 5);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0d0d0d]/95 backdrop-blur-sm border-t border-[#c9a870]/10 z-40">
      <div className="flex items-center justify-around px-2 py-2">
        {mainItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5"
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#c9a870]' : 'text-[#6b6b6b]'}`} />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-[#c9a870]' : 'text-[#6b6b6b]'}`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
