import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Camera, History, CalendarDays, CalendarRange, UserCog } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';

export default function BottomNav() {
  const { isAuthenticated, userAccount } = useAttendance();

  if (!isAuthenticated) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-2.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-1 pointer-events-none">
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur-lg rounded-2xl p-1 border border-slate-200/90 shadow-2xl shadow-blue-900/10 flex items-center justify-around pointer-events-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[9.5px] sm:text-[10.5px] font-semibold transition-all duration-200 active:scale-95 ${
              isActive
                ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5" />
          <span>Beranda</span>
        </NavLink>

        <NavLink
          to="/jadwal"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[9.5px] sm:text-[10.5px] font-semibold transition-all duration-200 active:scale-95 ${
              isActive
                ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <CalendarRange className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5" />
          <span>Jadwal</span>
        </NavLink>

        <NavLink
          to="/absen"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[9.5px] sm:text-[10.5px] font-bold transition-all duration-200 active:scale-95 ${
              isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                : 'bg-blue-600/90 text-white hover:bg-blue-600 shadow-xs'
            }`
          }
        >
          <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5" />
          <span>Presensi</span>
        </NavLink>

        <NavLink
          to="/izin"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[9.5px] sm:text-[10.5px] font-semibold transition-all duration-200 active:scale-95 ${
              isActive
                ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5" />
          <span>Izin</span>
        </NavLink>

        <NavLink
          to="/riwayat"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[9.5px] sm:text-[10.5px] font-semibold transition-all duration-200 active:scale-95 ${
              isActive
                ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5" />
          <span>Riwayat</span>
        </NavLink>

        {userAccount?.role === 'Admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[9.5px] sm:text-[10.5px] font-semibold transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <UserCog className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5" />
            <span>Admin</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
}

