import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Dumbbell, PersonStanding, Scale,
  Calendar, Target, Users, Trophy, CalendarDays, User,
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
    <nav className="hidden lg:flex flex-col gap-1 p-4 w-64 bg-slate-900/80 border-r border-slate-700/50 min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-4 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700">
          <Dumbbell className="w-5 h-5 text-white" />
        </div>
        <span className="font-black text-white text-lg">Gain & Glory</span>
      </div>

      {navItems.map(({ path, icon: Icon, label }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) => `
            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            transition-all duration-200
            ${isActive
              ? 'bg-red-700/30 text-red-300 border border-red-700/50'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 z-40">
      <div className="flex items-center justify-around px-2 py-2">
        {mainItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5"
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-red-400' : 'text-slate-500'}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-red-400' : 'text-slate-500'}`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
