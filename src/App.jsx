import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AttendanceProvider } from './context/AttendanceContext';
import { RefreshCw } from 'lucide-react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AbsenForm from './pages/AbsenForm';
import Sukses from './pages/Sukses';
import Riwayat from './pages/Riwayat';
import Jadwal from './pages/Jadwal';
import FormIzin from './pages/FormIzin';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load the Admin Panel bundle on-demand
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function AppLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50 text-slate-800 flex flex-col justify-between relative selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Top Floating Navbar (hidden on login) */}
      {!isLoginPage && <Header />}

      {/* Main App Viewport with generous breathing room below floating navbar */}
      <main
        className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col ${
          isLoginPage ? 'justify-center py-0 px-0' : 'pt-4 sm:pt-6 md:pt-8 pb-32 md:pb-12'
        }`}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Suspense
                  fallback={
                    <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs max-w-md mx-auto my-12">
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                      <p className="text-xs text-slate-500 font-medium">Memuat Panel Admin LSD...</p>
                    </div>
                  }
                >
                  <AdminDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Protected Assistant Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/absen"
            element={
              <ProtectedRoute>
                <AbsenForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jadwal"
            element={
              <ProtectedRoute>
                <Jadwal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/izin"
            element={
              <ProtectedRoute>
                <FormIzin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sukses"
            element={
              <ProtectedRoute>
                <Sukses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/riwayat"
            element={
              <ProtectedRoute>
                <Riwayat />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Institutional Footer (hidden on login) */}
      {!isLoginPage && (
        <div className="pb-24 md:pb-0">
          <Footer />
        </div>
      )}

      {/* Mobile-Only Bottom Navigation (hidden on login) */}
      {!isLoginPage && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AttendanceProvider>
      <Router>
        <AppLayout />
      </Router>
    </AttendanceProvider>
  );
}
