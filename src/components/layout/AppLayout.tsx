import React, { useState, useRef, useCallback } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { Header } from './Header';
import { SideNav, MobileDrawer } from './Navigation';
import { Loader } from '../common/Loader';

export function AppLayout() {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const handleScroll = useCallback(() => {
    if (mainRef.current) {
      setShowScrollTop(mainRef.current.scrollTop > 320);
    }
  }, []);

  const scrollToTop = useCallback(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (loading) return <Loader fullScreen text="Chargement..." />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <NotificationProvider>
      {/* Fond spartiate — fixed, hors du flux */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-[#080808]"
        style={{
          backgroundImage: 'url(/logo.png)',
          backgroundSize: '55%',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/85" />
      </div>

      {/* Layout principal */}
      <div className="relative z-10 flex h-screen overflow-hidden">
        <SideNav />

        {/* Colonne contenu */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onMenuOpen={() => setMobileMenuOpen(true)} />

          {/* Zone scrollable — c'est ici que le scroll se produit */}
          <main
            ref={mainRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto min-h-0"
          >
            <div className="max-w-7xl mx-auto px-4 pt-6 pb-24 lg:pb-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Bouton retour en haut — visible après 320px de scroll */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-4 z-50 w-10 h-10 bg-[#111] border border-[#c9a870]/30 flex items-center justify-center text-[#c9a870] hover:bg-[#c9a870]/10 hover:border-[#c9a870]/60 transition-colors shadow-xl"
            title="Retour en haut"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </NotificationProvider>
  );
}
