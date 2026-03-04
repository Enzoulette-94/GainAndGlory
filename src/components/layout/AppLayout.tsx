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
      <div className="flex min-h-screen bg-[#080808]">
        <SideNav />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 pb-20 lg:pb-0">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <Outlet />
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    </NotificationProvider>
  );
}
