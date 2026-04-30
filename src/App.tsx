import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import RegisterKoperasi from './pages/RegisterKoperasi';
import Home from './pages/Home';
import About from './pages/About';
import HelpCenter from './pages/HelpCenter';
import Dashboard from './pages/Dashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import MemberDashboard from './pages/MemberDashboard';
import { NotificationListener } from './components/NotificationListener';
import { SplashScreen } from './components/SplashScreen';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const { user, profile, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
    </div>
  );

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile && profile.status === 'inactive') {
    logout();
    return <Navigate to="/login" replace />;
  }

  if (profile && role && profile.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { profile, logout, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && profile && profile.status === 'inactive') {
      logout();
    }
  }, [profile, logout, loading]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <>
      <NotificationListener />
      <Routes>
        <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/help" element={<HelpCenter />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register-koperasi" element={<RegisterKoperasi />} />
      
      {/* Super Admin Routes */}
      <Route path="/super-admin/*" element={
        <ProtectedRoute role="super_admin">
          <SuperAdminDashboard />
        </ProtectedRoute>
      } />

      {/* Admin/Bendahara Routes */}
      <Route path="/dashboard/*" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      {/* Member Routes */}
      <Route path="/member/*" element={
        <ProtectedRoute role="anggota">
          <MemberDashboard />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
