import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { UserCog, LayoutDashboard, Camera, History, CalendarDays, CalendarRange, LogOut } from 'lucide-react';
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
        { to: '/jadwal', label: 'Jadwal Piket', icon: CalendarRange },
        { to: '/izin', label: 'Tukar Piket', icon: CalendarDays },
        { to: '/riwayat', label: 'Riwayat Saya', icon: History },
        ...(userAccount?.role === 'Admin'
          ? [{ to: '/admin', label: 'Panel Admin', icon: UserCog }]
          : [])
      ]
    : [];

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-50/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        
        {/* Brand & Time */}
        <NavLink to="/" className="flex items-center space-x-2.5 sm:space-x-3 group min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-1 border border-blue-200 flex items-center justify-center shadow-xs group-hover:border-blue-400 transition flex-shrink-0">
            <img
              src="/logo-lsd.png"
              alt="Logo LSD"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-xs sm:text-base font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition truncate">
                Presensi Piket Lab
              </h1>
              <span className="hidden xs:inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                LSD
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
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
          <div className="flex items-center gap-1.5 md:hidden flex-shrink-0">
            <button
              onClick={logout}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 active:scale-95 transition shadow-xs flex items-center gap-1 text-xs font-semibold"
              title="Keluar dari Akun"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium hidden xs:inline">Keluar</span>
            </button>
          </div>
        )}

      </div>
    </header>
  );
}

