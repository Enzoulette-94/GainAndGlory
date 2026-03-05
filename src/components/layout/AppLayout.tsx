import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { Header } from './Header';
import { SideNav, BottomNav } from './Navigation';
import { Loader } from '../common/Loader';

export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) return <Loader fullScreen text="Chargement..." />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <NotificationProvider>
      <div className="flex min-h-screen bg-[#080808] relative">
        {/* Fond spartiate global */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: 'url(/spartan.avif)',
            backgroundSize: 'cover',
            backgroundPosition: '65% 35%',
          }}
        >
          <div className="absolute inset-0 bg-black/85" />
        </div>
        <div className="relative z-10 flex flex-1 min-h-screen">
          <SideNav />
          <div className="flex-1 flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 pb-16 lg:pb-0">
              <div className="max-w-7xl mx-auto px-4 py-6">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
        <BottomNav />
      </div>
    </NotificationProvider>
  );
}
