import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AttendanceProvider } from './context/AttendanceContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AbsenForm from './pages/AbsenForm';
import Sukses from './pages/Sukses';
import Riwayat from './pages/Riwayat';
import Jadwal from './pages/Jadwal';
import FormIzin from './pages/FormIzin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AttendanceProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between relative selection:bg-blue-600 selection:text-white">
          
          {/* Subtle Institutional Top Accent */}
          <div className="h-1.5 w-full bg-blue-600 sticky top-0 z-50"></div>

          {/* Top Header */}
          <Header />

          {/* Main App Viewport with safe mobile bottom spacing */}
          <main className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 flex-1 flex flex-col pt-2.5 sm:pt-4 md:pt-6 pb-24 md:pb-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
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

          {/* Mobile-Only Bottom Navigation */}
          <BottomNav />

        </div>
      </Router>
    </AttendanceProvider>
  );
}

