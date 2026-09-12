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
  CalendarRange,
  LogOut,
  Sparkles,
  ShieldCheck,
  User,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { useAttendance, REQUIRED_PIKET_DURATION_MS } from '../context/AttendanceContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { userAccount, logout, piketSession, lastResult, jadwalList } = useAttendance();

  const [countdownText, setCountdownText] = useState('');
  const [percentComplete, setPercentComplete] = useState(0);
  const isSessionActive = Boolean(piketSession);

  // Determine today's day name in Indonesian
  const getTodayDayName = () => {
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayIndex = new Date().getDay();
    return dayNames[todayIndex];
  };

  const todayName = getTodayDayName();
  const todaySchedule = (jadwalList || []).find(item => item.hari === todayName);

  useEffect(() => {
    if (!piketSession || !piketSession.startTime) return;

    const tick = () => {
      const elapsed = Date.now() - piketSession.startTime;
      const remaining = Math.max(0, REQUIRED_PIKET_DURATION_MS - elapsed);
      const progress = Math.min(100, Math.round((elapsed / REQUIRED_PIKET_DURATION_MS) * 100));
      setPercentComplete(progress);

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
    <div className="max-w-4xl mx-auto w-full space-y-5 sm:space-y-6 pb-4 animate-fadeIn">
      {/* 1. Hero & Profile Card with Clean Gradient */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 md:p-7 bg-blue-600 text-white shadow-sm border border-blue-500/60 space-y-4 sm:space-y-5">
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white p-2 border border-blue-200/90 flex items-center justify-center shadow-xs flex-shrink-0">
              <img
                src="/logo-lsd.png"
                alt="Logo LSD"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-700/80 text-blue-100 border border-blue-500/80">
                  Lab Systems Development
                </span>
              </div>
              <h2 className="text-base sm:text-xl md:text-2xl font-extrabold text-white tracking-tight truncate mt-1">
                Halo, {userAccount?.userName || 'Asisten'} 
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1.5 shadow-sm ${
                isSessionActive
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                  : 'bg-blue-700 text-white border border-blue-500'
              }`}
            >
              {isSessionActive ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Piket Aktif</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Siap Piket</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Dynamic Piket Session Timer or Operational Notice */}
        {isSessionActive ? (
          <div className="relative bg-blue-700/70 rounded-2xl p-3.5 sm:p-4 border border-blue-500/70 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
              <div className="flex items-center justify-between sm:block">
                <span className="text-blue-200 text-[11px]">Mulai Masuk:</span>
                <p className="font-mono font-bold text-white text-xs sm:text-sm">
                  {formatStartTime(piketSession.startTime)}
                </p>
              </div>
              <div className="flex items-center justify-between sm:text-right pt-1.5 sm:pt-0 border-t border-blue-600/80 sm:border-t-0">
                <span className="text-blue-200 text-[11px]">Hitung Mundur Wajib (2 Jam):</span>
                <p className="font-mono font-bold text-amber-300 text-xs sm:text-sm">
                  {countdownText}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-blue-900/40 rounded-full h-2 overflow-hidden border border-blue-500/50">
              <div
                className="bg-amber-400 h-full transition-all duration-500 rounded-full"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="relative pt-3 border-t border-blue-500/60 flex items-center justify-between text-[11px] sm:text-xs text-blue-100">
            <span>NIM: <strong className="font-mono text-white tracking-wide">{userAccount?.userId || '-'}</strong></span>
            <span className="bg-blue-700/80 px-2.5 py-0.5 rounded-lg border border-blue-500 text-white font-medium">
              Batas Absen: 14:00 WIB
            </span>
          </div>
        )}
      </div>

      {/* 2. Main Action Cards - Clean Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        
        {/* Card 1: Presensi Masuk / Checkout Piket */}
        <button
          onClick={() => navigate('/absen')}
          className={`group rounded-2xl p-4 sm:p-5 text-left transition-all shadow-xs hover:shadow-md flex flex-col justify-between min-h-[135px] sm:min-h-[150px] border active:scale-[0.97] touch-manipulation ${
            isSessionActive
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/25'
              : 'bg-white border-slate-200/90 hover:border-blue-400'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs ${
              isSessionActive
                ? 'bg-amber-500 text-white'
                : 'bg-blue-600 text-white'
            }`}>
              <Camera className="w-5 h-5" />
            </div>
            <span className="p-1 sm:p-1.5 rounded-xl bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-600 transition">
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
              {isSessionActive ? 'Status Piket' : 'Mulai Piket'}
            </h3>
            <p className="text-[10.5px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
              {isSessionActive
                ? 'Laporan & checkout'
                : 'Selfie presensi live & GPS'}
            </p>
          </div>
        </button>

        {/* Card 2: Jadwal Piket */}
        <button
          onClick={() => navigate('/jadwal')}
          className="group rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md text-left transition-all shadow-xs flex flex-col justify-between min-h-[135px] sm:min-h-[150px] active:scale-[0.97] touch-manipulation"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs">
              <CalendarRange className="w-5 h-5" />
            </div>
            <span className="p-1 sm:p-1.5 rounded-xl bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-600 transition">
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
              Jadwal Piket
            </h3>
            <p className="text-[10.5px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
              Matriks piket Senin - Jumat
            </p>
          </div>
        </button>

        {/* Card 3: Pengajuan Izin */}
        <button
          onClick={() => navigate('/izin')}
          className="group rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md text-left transition-all shadow-xs flex flex-col justify-between min-h-[135px] sm:min-h-[150px] active:scale-[0.97] touch-manipulation"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <span className="p-1 sm:p-1.5 rounded-xl bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-600 transition">
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
              Ajukan Izin
            </h3>
            <p className="text-[10.5px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
              Tukar jadwal piket lab
            </p>
          </div>
        </button>

        {/* Card 4: Riwayat Saya */}
        <button
          onClick={() => navigate('/riwayat')}
          className="group rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md text-left transition-all shadow-xs flex flex-col justify-between min-h-[135px] sm:min-h-[150px] active:scale-[0.97] touch-manipulation"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <span className="p-1 sm:p-1.5 rounded-xl bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-600 transition">
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
              Riwayat Saya
            </h3>
            <p className="text-[10.5px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2">
              Log kehadiran & izin
            </p>
          </div>
        </button>

        {/* Card 5 [RBAC]: Panel Admin */}
        {userAccount?.role === 'Admin' && (
          <button
            onClick={() => navigate('/admin')}
            className="group rounded-2xl p-3.5 sm:p-5 bg-blue-700 hover:bg-blue-800 text-white hover:shadow-md text-left transition shadow-xs flex flex-col justify-between min-h-[125px] sm:min-h-[140px] border border-blue-600 active:scale-[0.97] col-span-2 sm:col-span-1 touch-manipulation"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/15 text-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-blue-100" />
              </div>
              <span className="p-1 sm:p-1.5 rounded-xl bg-white/15 text-blue-100 group-hover:bg-white/25 transition">
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                  Panel Admin
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-extrabold bg-white text-blue-800 shadow-xs">
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

      {/* 3. Quick Snapshot: Jadwal Piket Hari Ini */}
      {todaySchedule && todaySchedule.asisten && todaySchedule.asisten.length > 0 && (
        <div className="rounded-3xl p-4 sm:p-6 bg-white border border-slate-200/90 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100/80">
                <CalendarRange className="w-4 h-4" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Petugas Piket Hari Ini ({todayName})
              </h4>
            </div>
            <button
              onClick={() => navigate('/jadwal')}
              className="text-[11px] sm:text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
            >
              <span>Semua Jadwal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {todaySchedule.asisten.map((ast, idx) => {
              const isUser = userAccount && (ast.nim === userAccount.userId || ast.nama === userAccount.userName);
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition-all ${
                    isUser
                      ? 'bg-blue-50/90 border-blue-300 text-blue-950 font-bold shadow-2xs'
                      : 'bg-slate-50/80 border-slate-200/80 text-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isUser ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-700'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate flex items-center gap-1.5">
                        <span>{ast.nama || ast}</span>
                        {isUser && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white text-[8px] font-extrabold">
                            Saya
                          </span>
                        )}
                      </p>
                      <p className="text-[10.5px] text-slate-500 font-mono">08:00 - 16:00 WIB</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-white border border-slate-200/90 font-mono text-slate-600 flex-shrink-0">
                    Lab LSD
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Ketentuan Singkat Piket Lab */}
      <div className="rounded-3xl p-4 sm:p-6 bg-white border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Ketentuan Singkat Piket
            </h4>
          </div>
          <span className="text-[10.5px] font-semibold text-slate-400">
            SOP Lab LSD
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs text-slate-700">
          <div className="flex items-start gap-2.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
            <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <span><strong>Batas Masuk 14:00 WIB:</strong> Presensi masuk maksimal jam 2 siang.</span>
          </div>

          <div className="flex items-start gap-2.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span><strong>Durasi Wajib 2 Jam:</strong> Minimal bertugas 120 menit sebelum checkout.</span>
          </div>

          <div className="flex items-start gap-2.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
            <Camera className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <span><strong>Selfie Live & GPS:</strong> Wajib kamera langsung di dalam lab dengan GPS aktif.</span>
          </div>

          <div className="flex items-start gap-2.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
            <CalendarDays className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span><strong>Izin / Ganti Hari:</strong> Ajukan sebelum pukul 17:00 WIB agar tidak alpa.</span>
          </div>
        </div>
      </div>

      {/* 5. Recent Log Summary */}
      {lastResult && (
        <div className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0 border border-blue-100">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 truncate">Presensi Terakhir Tercatat</p>
              <p className="text-slate-500 text-[10.5px] sm:text-[11px] truncate">{lastResult.timestamp || '-'} • {lastResult.status || 'Tercatat'}</p>
            </div>
          </div>
          <span className="font-mono text-[10.5px] sm:text-[11px] text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 truncate self-start sm:self-auto max-w-full sm:max-w-[200px]">
            {lastResult.location || 'Sinkron Google Sheet'}
          </span>
        </div>
      )}
    </div>
  );
}
