import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { UserCog, LayoutDashboard, Camera, History, CalendarDays, CalendarRange, LogOut, Clock, ShieldCheck } from 'lucide-react';
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

  const getUserInitials = (name) => {
    if (!name) return 'AS';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-2 sm:top-3 z-30 w-full px-2.5 sm:px-6 lg:px-8 transition-all">
      <div className="max-w-7xl mx-auto bg-white/85 backdrop-blur-xl rounded-2xl sm:rounded-full px-3 sm:px-5 py-2 sm:py-2.5 border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.05)] flex items-center justify-between gap-2.5">
        
        {/* Brand & Live Time */}
        <NavLink to="/" className="flex items-center space-x-2 sm:space-x-3 group min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-full bg-white p-1 border border-blue-200/80 flex items-center justify-center shadow-xs group-hover:border-blue-400 group-hover:shadow-sm transition flex-shrink-0">
            <img
              src="/logo-lsd.png"
              alt="Logo LSD"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition truncate">
                Presensi Piket Lab
              </h1>
              <span className="hidden xs:inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                LSD
              </span>
            </div>
            <p className="text-[9.5px] sm:text-[11px] text-slate-500 font-medium truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse flex-shrink-0" />
              <span>{timeString || 'Memuat waktu...'}</span>
            </p>
          </div>
        </NavLink>

        {/* Desktop Floating Navigation Links */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/80">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-xs font-bold border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </NavLink>
            ))}

            <div className="h-4 w-px bg-slate-300/80 mx-1" />

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50 transition active:scale-95"
              title="Keluar Akun"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </nav>
        )}

        {/* Mobile Header User Profile & Action */}
        {isAuthenticated && (
          <div className="flex items-center gap-1.5 md:hidden flex-shrink-0">
            {/* Admin Quick Switch Icon (if Admin) */}
            {userAccount?.role === 'Admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `p-1.5 rounded-xl border transition shadow-xs flex items-center justify-center touch-manipulation min-w-[34px] min-h-[34px] ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
                      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 active:scale-90'
                  }`
                }
                title="Panel Admin"
                aria-label="Panel Admin"
              >
                <ShieldCheck className="w-4 h-4" />
              </NavLink>
            )}

            <div className="flex items-center gap-1.5 bg-slate-100/90 px-2 py-1 rounded-xl sm:rounded-full border border-slate-200/90">
              <div className="w-6 h-6 rounded-lg sm:rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {getUserInitials(userAccount?.userName)}
              </div>
              <div className="text-left hidden xs:block max-w-[80px] truncate">
                <p className="text-[10px] font-bold text-slate-800 truncate leading-tight">
                  {userAccount?.userName?.split(' ')[0] || 'Asisten'}
                </p>
                <span className="text-[8px] font-semibold text-blue-600 uppercase block leading-none">
                  {userAccount?.role || 'Asisten'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-xl sm:rounded-full border border-rose-200/90 bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-90 transition shadow-xs flex items-center justify-center touch-manipulation min-w-[34px] min-h-[34px]"
              title="Keluar dari Akun"
              aria-label="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </header>
  );
}
