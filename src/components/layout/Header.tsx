import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, User, LogOut, Settings, ChevronDown, Shield, Menu, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { authService } from '../../services/auth.service';
import { XPBar } from '../xp-system/XPBar';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { getStatusTitle, getStatusColor } from '../../utils/calculations';

export function Header({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const { user, profile } = useAuth();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [showAlreadyInstalled, setShowAlreadyInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      (installPrompt as any).prompt();
      const { outcome } = await (installPrompt as any).userChoice;
      if (outcome === 'accepted') setInstallPrompt(null);
    } else {
      setShowAlreadyInstalled(true);
    }
    setShowUserMenu(false);
  };

  const handleSignOut = async () => {
    await authService.signOut();
  };

  const statusTitle = profile ? getStatusTitle(profile.global_level) : null;
  const statusColor = profile ? getStatusColor(profile.global_level) : '#c9a870';

  return (
    <header className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#c9a870]/15">
      <div className="flex items-center justify-between px-4 h-[52px] max-w-7xl mx-auto">
        {/* Logo mobile + hamburger */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={onMenuOpen}
            className="p-2 text-[#a3a3a3] hover:text-[#c9a870] transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-1.5 group">
            <Shield className="w-4 h-4 text-[#c9a870]" />
            <span className="font-rajdhani font-bold text-[#c9a870] text-sm tracking-wide uppercase">G&G</span>
          </Link>
        </div>

        {/* XP Bar */}
        {profile && (
          <div className="hidden md:block flex-1 max-w-xl mx-4">
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
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-xs font-bold text-white flex items-center justify-center">
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
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-[#111111] border border-[#c9a870]/20 shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-[#c9a870]/10">
                      <p className="font-rajdhani font-semibold text-[#f5f5f5] text-sm tracking-wide">{profile?.username}</p>
                      {statusTitle && (
                        <p className="text-xs font-rajdhani font-medium mt-0.5" style={{ color: statusColor }}>
                          Niv.{profile?.global_level} · {statusTitle}
                        </p>
                      )}
                      <p className="text-xs text-[#6b6b6b] mt-0.5">{user?.email}</p>
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
                        onClick={handleInstall}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#c9a870] hover:bg-[#c9a870]/10 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Télécharger Gain &amp; Glory
                      </button>
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

      {/* Modale déjà installé */}
      <AnimatePresence>
        {showAlreadyInstalled && (
          <>
            <div className="fixed inset-0 z-[200] bg-black/70" onClick={() => setShowAlreadyInstalled(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed z-[201] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#111] border border-[#c9a870]/30 p-6 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 flex items-center justify-center border-2 border-[#c9a870]/40 bg-[#c9a870]/5">
                  <Download className="w-7 h-7 text-[#c9a870]" />
                </div>
                <div>
                  <h3 className="font-rajdhani font-black text-[#f5f5f5] uppercase tracking-wide text-lg">
                    Déjà installée !
                  </h3>
                  <p className="text-sm text-[#a3a3a3] mt-1">
                    Gain &amp; Glory est déjà présent sur votre bureau ou téléphone. Êtes-vous sûr de vouloir relancer l'installation ?
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowAlreadyInstalled(false)}
                    className="flex-1 py-2 border border-white/10 text-[#6b6b6b] text-sm font-rajdhani hover:bg-white/5 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => setShowAlreadyInstalled(false)}
                    className="flex-1 py-2 bg-[#c9a870]/10 border border-[#c9a870]/50 text-[#c9a870] text-sm font-rajdhani font-bold uppercase tracking-wide hover:bg-[#c9a870]/20 transition-all"
                  >
                    OK
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
