import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Camera, History, CalendarDays, CalendarRange, UserCog } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';

export default function BottomNav() {
  const { isAuthenticated, userAccount, piketSession } = useAttendance();

  if (!isAuthenticated) return null;

  const isPiketActive = Boolean(piketSession);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom,8px))] pt-1 pointer-events-none">
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur-xl rounded-2xl px-2 py-1.5 border border-slate-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.12)] flex items-center justify-between pointer-events-auto">
        
        {/* 1. Beranda */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-semibold transition-all duration-200 active:scale-95 ${
              isActive
                ? 'text-blue-600 font-bold bg-blue-50/90'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span className="truncate">Beranda</span>
        </NavLink>

        {/* 2. Jadwal */}
        <NavLink
          to="/jadwal"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-semibold transition-all duration-200 active:scale-95 ${
              isActive
                ? 'text-blue-600 font-bold bg-blue-50/90'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <CalendarRange className="w-4 h-4 mb-0.5" />
          <span className="truncate">Jadwal</span>
        </NavLink>

        {/* 3. Primary Center Shutter: Presensi */}
        <NavLink
          to="/absen"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center -mt-4 mx-0.5 group`
          }
        >
          {({ isActive }) => (
            <div className="flex flex-col items-center">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 ${
                  isPiketActive
                    ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-amber-500/30 ring-4 ring-white'
                    : isActive
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-500/35 ring-4 ring-white scale-105'
                    : 'bg-gradient-to-tr from-blue-600 to-blue-700 text-white shadow-blue-600/30 ring-4 ring-white'
                }`}
              >
                <Camera className="w-5 h-5" />
              </div>
              <span className={`text-[9.5px] font-bold mt-1 transition ${
                isActive ? 'text-blue-600 font-extrabold' : 'text-slate-600'
              }`}>
                {isPiketActive ? 'Sesi Piket' : 'Presensi'}
              </span>
            </div>
          )}
        </NavLink>

        {/* 4. Izin */}
        <NavLink
          to="/izin"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-semibold transition-all duration-200 active:scale-95 ${
              isActive
                ? 'text-blue-600 font-bold bg-blue-50/90'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <CalendarDays className="w-4 h-4 mb-0.5" />
          <span className="truncate">Izin</span>
        </NavLink>

        {/* 5. Riwayat / Admin */}
        {userAccount?.role === 'Admin' ? (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-semibold transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-blue-600 font-bold bg-blue-50/90'
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <UserCog className="w-4 h-4 mb-0.5" />
            <span className="truncate">Admin</span>
          </NavLink>
        ) : (
          <NavLink
            to="/riwayat"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-semibold transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-blue-600 font-bold bg-blue-50/90'
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <History className="w-4 h-4 mb-0.5" />
            <span className="truncate">Riwayat</span>
          </NavLink>
        )}

      </div>
    </nav>
  );
}
