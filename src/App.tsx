import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Loader } from './components/common/Loader';

function RequireAdmin() {
  const { profile, loading } = useAuth();
  if (loading) return <Loader fullScreen text="Chargement..." />;
  if (!profile?.is_admin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

// Pages auth
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { ResetPasswordPage } from './pages/ResetPassword';

// Pages protégées (lazy)
const DashboardPage = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.DashboardPage })));
const MusculationPage = lazy(() => import('./pages/Musculation').then(m => ({ default: m.MusculationPage })));
const MuscuSessionPage = lazy(() => import('./pages/MuscuSession').then(m => ({ default: m.MuscuSessionPage })));
const RunningPage = lazy(() => import('./pages/Running').then(m => ({ default: m.RunningPage })));
const RunSessionPage = lazy(() => import('./pages/RunSession').then(m => ({ default: m.RunSessionPage })));
const WeightPage = lazy(() => import('./pages/Weight').then(m => ({ default: m.WeightPage })));
const CalendarPage = lazy(() => import('./pages/Calendar').then(m => ({ default: m.CalendarPage })));
const GoalsPage = lazy(() => import('./pages/Goals').then(m => ({ default: m.GoalsPage })));
const CommunityPage = lazy(() => import('./pages/Community').then(m => ({ default: m.CommunityPage })));
const HallOfFamePage = lazy(() => import('./pages/HallOfFame').then(m => ({ default: m.HallOfFamePage })));
const EventsPage = lazy(() => import('./pages/Events').then(m => ({ default: m.EventsPage })));
const ProfilePage = lazy(() => import('./pages/Profile').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/Settings').then(m => ({ default: m.SettingsPage })));
const CalisthenicsPage = lazy(() => import('./pages/Calisthenics').then(m => ({ default: m.CalisthenicsPage })));
const CalisthenicsSessionPage = lazy(() => import('./pages/CalisthenicsSession').then(m => ({ default: m.CalisthenicsSessionPage })));
const TeamGoalsPage = lazy(() => import('./pages/TeamGoals').then(m => ({ default: m.TeamGoalsPage })));
const AdminPage = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminPage })));
const UserProfilePage = lazy(() => import('./pages/UserProfile').then(m => ({ default: m.UserProfilePage })));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loader fullScreen text="Chargement..." />}>
          <Routes>
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* App protégée */}
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              <Route path="/musculation" element={<MusculationPage />} />
              <Route path="/musculation/new" element={<MuscuSessionPage />} />

              <Route path="/running" element={<RunningPage />} />
              <Route path="/running/new" element={<RunSessionPage />} />

              <Route path="/calisthenics" element={<CalisthenicsPage />} />
              <Route path="/calisthenics/new" element={<CalisthenicsSessionPage />} />

              <Route path="/weight" element={<WeightPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/team-goals" element={<TeamGoalsPage />} />
              <Route path="/hall-of-fame" element={<HallOfFamePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profil/:userId" element={<UserProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route element={<RequireAdmin />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
