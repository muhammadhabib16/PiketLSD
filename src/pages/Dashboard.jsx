import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  History,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  Building2,
  CalendarDays,
  LogOut,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAttendance, REQUIRED_PIKET_DURATION_MS } from '../context/AttendanceContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { userAccount, logout, piketSession, lastResult } = useAttendance();

  const [countdownText, setCountdownText] = useState('');
  const isSessionActive = Boolean(piketSession);

  useEffect(() => {
    if (!piketSession || !piketSession.startTime) return;

    const tick = () => {
      const remaining = Math.max(0, REQUIRED_PIKET_DURATION_MS - (Date.now() - piketSession.startTime));
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      const pad = (n) => String(n).padStart(2, '0');
      if (remaining <= 0) {
        setCountdownText('2 Jam Tercapai (Siap Checkout)');
      } else {
        setCountdownText(`${pad(hours)}j ${pad(minutes)}m ${pad(seconds)}d`);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [piketSession]);

  const formatStartTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }) + ' WIB';
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-3.5 sm:space-y-4 pb-4 animate-fadeIn">
      {/* 1. Hero & Profile Card */}
      <div className="rounded-2xl p-4 sm:p-5 md:p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white p-1 border border-blue-200/60 flex items-center justify-center shadow-sm flex-shrink-0">
              <img
                src="/logo-lsd.png"
                alt="Logo LSD"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-blue-100 truncate">Laboratorium Systems Development</p>
              <h2 className="text-sm sm:text-lg md:text-xl font-bold text-white tracking-tight truncate">
                Halo, {userAccount?.userName || 'Asisten'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <span
              className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 shadow-xs ${
                isSessionActive
                  ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300/60'
                  : 'bg-white/20 text-white border border-white/30 backdrop-blur-xs'
              }`}
            >
              {isSessionActive ? (
                <>
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-pulse" />
                  <span>Piket Aktif</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-300" />
                  <span>Siap Piket</span>
                </>
              )}
            </span>

            <button
              onClick={logout}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-rose-500 hover:text-white text-blue-100 border border-white/20 transition text-xs active:scale-95"
              title="Keluar dari Akun"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Piket Session Timer or Operational Notice */}
        {isSessionActive ? (
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 text-xs">
            <div className="flex items-center justify-between sm:block">
              <span className="text-blue-200 text-[11px]">Mulai Masuk:</span>
              <p className="font-bold text-white text-xs sm:text-sm">
                {formatStartTime(piketSession.startTime)}
              </p>
            </div>
            <div className="flex items-center justify-between sm:text-right pt-1 sm:pt-0 border-t border-white/10 sm:border-t-0">
              <span className="text-blue-200 text-[11px]">Sisa Waktu Wajib:</span>
              <p className="font-mono font-bold text-amber-300 text-xs sm:text-sm">
                {countdownText}
              </p>
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[10.5px] sm:text-xs text-blue-100">
            <span>NIM: <strong className="font-mono text-white">{userAccount?.userId || '-'}</strong></span>
            <span>08:00 - 16:00 WIB</span>
          </div>
        )}
      </div>

      {/* 2. Main Action Cards - Clean 2-column Grid on Mobile for Maximum Thumb Ergonomics */}
      <div className={`grid grid-cols-2 ${userAccount?.role === 'Admin' ? 'lg:grid-cols-4' : 'sm:grid-cols-3'} gap-2.5 sm:gap-3.5`}>
        {/* Card 1: Presensi Masuk / Status Piket */}
        <button
          onClick={() => navigate('/absen')}
          className={`group rounded-2xl p-3.5 sm:p-5 text-left transition shadow-xs hover:shadow-md flex flex-col justify-between min-h-[120px] sm:min-h-[140px] border active:scale-[0.98] ${
            isSessionActive
              ? 'bg-white border-blue-300 ring-1 ring-blue-500/20'
              : 'bg-white border-blue-100 hover:border-blue-400 ring-1 ring-blue-500/10'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
              isSessionActive ? 'bg-blue-100 text-blue-800' : 'bg-blue-600 text-white shadow-xs'
            }`}>
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="p-1 sm:p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition">
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>

          <div className="mt-2.5 sm:mt-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
              {isSessionActive ? 'Status Piket' : 'Mulai Piket'}
            </h3>
            <p className="text-[10.5px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
              {isSessionActive
                ? 'Countdown & checkout'
                : 'Selfie presensi live & GPS'}
            </p>
          </div>
        </button>

        {/* Card 2: Pengajuan Izin */}
        <button
          onClick={() => navigate('/izin')}
          className="group rounded-2xl p-3.5 sm:p-5 bg-white border border-blue-100 hover:border-blue-400 hover:shadow-md text-left transition shadow-xs flex flex-col justify-between min-h-[120px] sm:min-h-[140px] active:scale-[0.98]"
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center transition-transform group-hover:scale-105">
              <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="p-1 sm:p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition">
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>

          <div className="mt-2.5 sm:mt-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
              Ajukan Izin
            </h3>
            <p className="text-[10.5px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
              Tukar jadwal piket lab
            </p>
          </div>
        </button>

        {/* Card 3: Riwayat Saya */}
        <button
          onClick={() => navigate('/riwayat')}
          className="group rounded-2xl p-3.5 sm:p-5 bg-white border border-blue-100 hover:border-blue-400 hover:shadow-md text-left transition shadow-xs flex flex-col justify-between min-h-[120px] sm:min-h-[140px] active:scale-[0.98]"
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center transition-transform group-hover:scale-105">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="p-1 sm:p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition">
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>

          <div className="mt-2.5 sm:mt-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
              Riwayat Saya
            </h3>
            <p className="text-[10.5px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
              Log kehadiran & izin
            </p>
          </div>
        </button>

        {/* Card 4 [RBAC]: Panel Admin */}
        {userAccount?.role === 'Admin' && (
          <button
            onClick={() => navigate('/admin')}
            className="group rounded-2xl p-3.5 sm:p-5 bg-blue-700 hover:bg-blue-800 text-white hover:shadow-md text-left transition shadow-xs flex flex-col justify-between min-h-[120px] sm:min-h-[140px] border border-blue-600 active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/15 text-white flex items-center justify-center transition-transform group-hover:scale-105">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-100" />
              </div>
              <span className="p-1 sm:p-1.5 rounded-lg bg-white/15 text-blue-100 group-hover:bg-white/25 transition">
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>

            <div className="mt-2.5 sm:mt-3">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                  Panel Admin
                </h3>
                <span className="px-1 py-0.2 rounded text-[8px] sm:text-[9px] font-bold bg-white text-blue-800 shadow-xs">
                  ADMIN
                </span>
              </div>
              <p className="text-[10.5px] sm:text-xs text-blue-100 mt-0.5 line-clamp-2">
                Rekap & approval izin
              </p>
            </div>
          </button>
        )}
      </div>

      {/* 3. Recent Log Summary */}
      {lastResult && (
        <div className="rounded-2xl p-3.5 sm:p-4 bg-white border border-blue-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0 border border-blue-100">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 truncate">Presensi Terakhir Tercatat</p>
              <p className="text-slate-500 text-[10.5px] sm:text-[11px] truncate">{lastResult.timestamp || '-'} • {lastResult.status || 'Tercatat'}</p>
            </div>
          </div>
          <span className="font-mono text-[10.5px] sm:text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 truncate self-start sm:self-auto max-w-full sm:max-w-[200px]">
            {lastResult.location || 'Sinkron Google Sheet'}
          </span>
        </div>
      )}
    </div>
  );
}
