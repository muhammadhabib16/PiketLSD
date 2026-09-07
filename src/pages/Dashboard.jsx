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
    <div className="max-w-4xl mx-auto w-full space-y-4 pb-20 animate-fadeIn">
      {/* 1. Hero & Profile Card */}
      <div className="rounded-2xl p-5 md:p-6 bg-blue-600 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 border border-blue-200/60 flex items-center justify-center shadow-sm flex-shrink-0">
              <img
                src="/logo-lsd.png"
                alt="Logo LSD"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-xs text-blue-100">Laboratorium Systems Development</p>
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                Halo, {userAccount?.userName || 'Asisten'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm ${
                isSessionActive
                  ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300/60'
                  : 'bg-white/20 text-white border border-white/30'
              }`}
            >
              {isSessionActive ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>Piket Berjalan</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Siap Piket</span>
                </>
              )}
            </span>

            <button
              onClick={logout}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-rose-500 hover:text-white text-blue-100 border border-white/20 transition text-xs"
              title="Keluar dari Akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Piket Session Timer or Operational Notice */}
        {isSessionActive ? (
          <div className="bg-white/10 rounded-xl p-3.5 border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-blue-200">Mulai Masuk:</span>
              <p className="font-bold text-white text-sm mt-0.5">
                {formatStartTime(piketSession.startTime)}
              </p>
            </div>
            <div className="sm:text-right">
              <span className="text-blue-200">Sisa Waktu Wajib:</span>
              <p className="font-mono font-bold text-amber-300 text-sm mt-0.5">
                {countdownText}
              </p>
            </div>
          </div>
        ) : (
          <div className="pt-2.5 border-t border-white/15 flex items-center justify-between text-xs text-blue-100">
            <span>NIM: <strong className="font-mono text-white">{userAccount?.userId || '-'}</strong></span>
            <span>Jam Operasional: 08:00 - 16:00 WIB</span>
          </div>
        )}
      </div>

      {/* 2. Main Action Cards */}
      <div className={`grid grid-cols-1 ${userAccount?.role === 'Admin' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-3.5`}>
        {/* Card 1: Presensi Masuk / Status Piket */}
        <button
          onClick={() => navigate('/absen')}
          className={`group rounded-2xl p-5 text-left transition shadow-sm flex flex-col justify-between min-h-[140px] border ${
            isSessionActive
              ? 'bg-white border-blue-300 hover:border-blue-500 hover:shadow-md'
              : 'bg-white border-blue-100 hover:border-blue-400 hover:shadow-md ring-1 ring-blue-500/10'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
              isSessionActive ? 'bg-blue-100 text-blue-800' : 'bg-blue-600 text-white shadow-sm'
            }`}>
              <Camera className="w-5 h-5" />
            </div>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition">
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
              {isSessionActive ? 'Lihat Status Piket' : 'Mulai Piket'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isSessionActive
                ? 'Pantau hitung mundur & checkout'
                : 'Selfie presensi masuk live & GPS'}
            </p>
          </div>
        </button>

        {/* Card 2: Pengajuan Izin */}
        <button
          onClick={() => navigate('/izin')}
          className="group rounded-2xl p-5 bg-white border border-blue-100 hover:border-blue-400 hover:shadow-md text-left transition shadow-sm flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center transition-transform group-hover:scale-105">
              <CalendarDays className="w-5 h-5" />
            </div>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition">
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
              Ajukan Izin
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tukar tanggal jadwal piket lab
            </p>
          </div>
        </button>

        {/* Card 3: Riwayat Saya */}
        <button
          onClick={() => navigate('/riwayat')}
          className="group rounded-2xl p-5 bg-white border border-blue-100 hover:border-blue-400 hover:shadow-md text-left transition shadow-sm flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center transition-transform group-hover:scale-105">
              <History className="w-5 h-5" />
            </div>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition">
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
              Riwayat Saya
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Log kehadiran & status izin
            </p>
          </div>
        </button>

        {/* Card 4 [RBAC]: Panel Admin (Harmonized with Blue-White Palette) */}
        {userAccount?.role === 'Admin' && (
          <button
            onClick={() => navigate('/admin')}
            className="group rounded-2xl p-5 bg-blue-700 hover:bg-blue-800 text-white hover:shadow-md text-left transition shadow-sm flex flex-col justify-between min-h-[140px] border border-blue-600"
          >
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-white/15 text-white flex items-center justify-center transition-transform group-hover:scale-105">
                <ShieldCheck className="w-5 h-5 text-blue-100" />
              </div>
              <span className="p-1.5 rounded-lg bg-white/15 text-blue-100 group-hover:bg-white/25 transition">
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">
                  Panel Admin
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white text-blue-800 shadow-xs">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Rekap & approval izin lab
              </p>
            </div>
          </button>
        )}
      </div>

      {/* 3. Recent Log Summary */}
      {lastResult && (
        <div className="rounded-2xl p-4 bg-white border border-blue-100 shadow-sm flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0 border border-blue-100">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Presensi Terakhir Tercatat</p>
              <p className="text-slate-500 text-[11px]">{lastResult.timestamp || '-'} • {lastResult.status || 'Tercatat'}</p>
            </div>
          </div>
          <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 truncate max-w-[150px]">
            {lastResult.location || 'Sinkron Google Sheet'}
          </span>
        </div>
      )}
    </div>
  );
}
