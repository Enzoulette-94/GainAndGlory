import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, User, LogOut, Settings, ChevronDown, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { authService } from '../../services/auth.service';
import { XPBar } from '../xp-system/XPBar';
import { NotificationCenter } from '../notifications/NotificationCenter';

export function Header() {
  const { user, profile } = useAuth();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await authService.signOut();
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#c9a870]/15">
      <div className="flex items-center justify-between px-4 h-[52px] max-w-7xl mx-auto">
        {/* Logo mobile */}
        <Link to="/dashboard" className="lg:hidden flex items-center gap-2 group">
          <Shield className="w-5 h-5 text-[#c9a870] transition-colors group-hover:text-[#dfc99e]" />
          <span className="font-rajdhani font-bold text-[#c9a870] text-base tracking-wide uppercase">G&G</span>
        </Link>

        {/* XP Bar */}
        {profile && (
          <div className="hidden md:block flex-1 max-w-sm mx-4">
            <XPBar profile={profile} compact />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-white/5 text-[#a3a3a3] hover:text-[#d4d4d4] transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <NotificationCenter onClose={() => setShowNotifications(false)} />
              )}
            </AnimatePresence>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 border border-[#c9a870]/50 bg-[#1c1c1c] overflow-hidden flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-[#c9a870] font-rajdhani">
                    {profile?.username?.[0]?.toUpperCase() ?? 'U'}
                  </span>
                )}
              </div>
              <ChevronDown className="w-3 h-3 text-[#a3a3a3] hidden sm:block" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-[#111111] border border-[#c9a870]/20 shadow-xl z-20 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-[#c9a870]/10">
                      <p className="font-rajdhani font-semibold text-[#f5f5f5] text-sm tracking-wide">{profile?.username}</p>
                      <p className="text-xs text-[#a3a3a3]">{user?.email}</p>
                    </div>
                    <div className="p-1">
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[#d4d4d4] hover:bg-white/5 hover:text-[#f5f5f5] transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        Mon profil
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[#d4d4d4] hover:bg-white/5 hover:text-[#f5f5f5] transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Paramètres
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/15 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Se déconnecter
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
