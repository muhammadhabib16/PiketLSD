import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { UserCog, LayoutDashboard, Camera, History, CalendarDays, LogOut } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';

export default function Header() {
  const { userAccount, isAuthenticated, logout } = useAttendance();
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
      const timePart = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setTimeString(`${datePart} • ${timePart} WIB`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = isAuthenticated
    ? [
        { to: '/', label: 'Beranda', icon: LayoutDashboard },
        { to: '/absen', label: 'Presensi', icon: Camera },
        { to: '/izin', label: 'Tukar Piket', icon: CalendarDays },
        { to: '/riwayat', label: 'Riwayat Saya', icon: History },
        ...(userAccount?.role === 'Admin'
          ? [{ to: '/admin', label: 'Panel Admin', icon: UserCog }]
          : [])
      ]
    : [];

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-50/95 backdrop-blur border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        
        {/* Brand & Time */}
        <NavLink to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-white p-1 border border-blue-200 flex items-center justify-center shadow-xs group-hover:border-blue-400 transition flex-shrink-0">
            <img
              src="/logo-lsd.png"
              alt="Logo LSD"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition">
                Presensi Piket Lab
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Laboratorium LSD
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {timeString || 'Memuat waktu...'}
            </p>
          </div>
        </NavLink>

        {/* Desktop Navigation Links (Only shown when authenticated) */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </NavLink>
            ))}

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
              title="Keluar Akun"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </nav>
        )}

        {/* Mobile Header Action (Only shown when authenticated) */}
        {isAuthenticated && (
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={logout}
              className="p-2 rounded-xl border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 transition shadow-sm"
              title="Keluar dari Akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </header>
  );
}

