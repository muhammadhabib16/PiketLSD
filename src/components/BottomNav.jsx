import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Camera, History, CalendarDays, UserCog } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';

export default function BottomNav() {
  const { isAuthenticated, userAccount } = useAttendance();

  if (!isAuthenticated) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto px-4 pb-4 pt-1 pointer-events-none">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-1.5 border border-slate-200/90 shadow-xl flex items-center justify-around pointer-events-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center py-1.5 px-3 rounded-xl text-[11px] font-semibold transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Beranda</span>
        </NavLink>

        <NavLink
          to="/absen"
          className={({ isActive }) =>
            `flex flex-col items-center py-1.5 px-3.5 rounded-xl text-[11px] font-bold transition-all ${
              isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
            }`
          }
        >
          <Camera className="w-4 h-4 mb-0.5" />
          <span>Presensi</span>
        </NavLink>

        <NavLink
          to="/izin"
          className={({ isActive }) =>
            `flex flex-col items-center py-1.5 px-3 rounded-xl text-[11px] font-semibold transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <CalendarDays className="w-4 h-4 mb-0.5" />
          <span>Izin</span>
        </NavLink>

        <NavLink
          to="/riwayat"
          className={({ isActive }) =>
            `flex flex-col items-center py-1.5 px-3 rounded-xl text-[11px] font-semibold transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <History className="w-4 h-4 mb-0.5" />
          <span>Riwayat</span>
        </NavLink>

        {userAccount?.role === 'Admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex flex-col items-center py-1.5 px-3 rounded-xl text-[11px] font-semibold transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <UserCog className="w-4 h-4 mb-0.5" />
            <span>Admin</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
}

