import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  User,
  Search,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Building2,
  CheckCircle2,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';

export default function Jadwal() {
  const {
    jadwalList,
    loadingJadwal,
    jadwalError,
    fetchJadwal,
    userAccount
  } = useAttendance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState('ALL');

  useEffect(() => {
    fetchJadwal();
  }, []);

  // Determine current day in Indonesian
  const getTodayDayName = () => {
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayIndex = new Date().getDay();
    return dayNames[todayIndex];
  };

  const todayName = getTodayDayName();
  const daysList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  // Filter schedule by search query and selected day tab
  const filteredJadwal = (jadwalList || []).filter((item) => {
    const matchesDay = selectedDay === 'ALL' || item.hari === selectedDay;
    if (!matchesDay) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const dayMatches = item.hari.toLowerCase().includes(query);
    const assistantMatches = (item.asisten || []).some(
      (asisten) =>
        (asisten.nama && asisten.nama.toLowerCase().includes(query)) ||
        (asisten.nim && asisten.nim.toLowerCase().includes(query))
    );

    return dayMatches || assistantMatches;
  });

  const getInitials = (name) => {
    if (!name) return 'AS';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-3.5 sm:space-y-4 pb-6 animate-fadeIn">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                Jadwal Piket Laboratorium
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Matriks tugas asisten lab LSD (Senin s.d. Jumat, 08:00 - 16:00 WIB)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchJadwal}
          disabled={loadingJadwal}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-xs font-bold text-slate-700 shadow-xs flex items-center gap-1.5 transition disabled:opacity-50 touch-manipulation"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loadingJadwal ? 'animate-spin' : ''}`} />
          <span>{loadingJadwal ? 'Memperbarui...' : 'Sinkronkan'}</span>
        </button>
      </div>

      {/* 2. Operational Info Card */}
      <div className="rounded-2xl p-3.5 sm:p-4 bg-blue-600 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-200" />
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-blue-100">
              Ketentuan Presensi Piket
            </span>
          </div>
          <p className="text-xs sm:text-sm text-blue-50 leading-relaxed">
            Wajib piket minimal <strong className="text-white">2 Jam</strong> dengan batas check-in sebelum <strong className="text-white">14:00 WIB</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto bg-blue-700 px-3 py-1.5 rounded-xl border border-blue-500 text-xs">
          <Clock className="w-4 h-4 text-amber-300" />
          <span>Jam Lab: <strong>08:00 - 16:00 WIB</strong></span>
        </div>
      </div>

      {/* 3. Search & Day Filter Tabs with Horizontal Scroll */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama asisten atau NIM..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-xs"
            />
          </div>

          {/* Quick Day Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <button
              onClick={() => setSelectedDay('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition shadow-xs active:scale-95 touch-manipulation ${
                selectedDay === 'ALL'
                  ? 'bg-blue-600 text-white shadow-blue-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Semua Hari
            </button>
            {daysList.map((day) => {
              const isToday = day === todayName;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shadow-xs active:scale-95 touch-manipulation ${
                    selectedDay === day
                      ? 'bg-blue-600 text-white shadow-blue-500/20'
                      : isToday
                      ? 'bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200/70'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{day}</span>
                  {isToday && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Schedule Cards / Matrix View */}
      {jadwalError && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>{jadwalError}</span>
        </div>
      )}

      {filteredJadwal.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs sm:text-sm font-semibold text-slate-700">Tidak ada jadwal ditemukan</p>
          <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian atau pilih tab hari lain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredJadwal.map((item) => {
            const isToday = item.hari === todayName;
            const assistants = item.asisten || [];

            return (
              <div
                key={item.hari}
                className={`rounded-2xl p-3.5 sm:p-4 bg-white border transition shadow-xs hover:shadow-md flex flex-col justify-between ${
                  isToday
                    ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-extrabold text-slate-900">
                        {item.hari}
                      </span>
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1 shadow-xs">
                          <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Hari Ini
                        </span>
                      )}
                    </div>
                    <span className="text-[10.5px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      {assistants.length} Asisten
                    </span>
                  </div>

                  {/* Assistants List */}
                  <div className="mt-2.5 space-y-2">
                    {assistants.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">Belum ada asisten ditugaskan</p>
                    ) : (
                      assistants.map((asisten, idx) => {
                        const isUser = userAccount && (asisten.nim === userAccount.userId || asisten.nama === userAccount.userName);
                        return (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                              isUser
                                ? 'bg-blue-50 border-blue-300 text-blue-950 shadow-xs'
                                : 'bg-slate-50 border-slate-200/80 text-slate-800 hover:bg-slate-100/80'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0 shadow-xs ${
                                  isUser
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {getInitials(asisten.nama || asisten)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate flex items-center gap-1">
                                  <span>{asisten.nama || asisten}</span>
                                  {isUser && (
                                    <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white text-[8.5px] font-extrabold">
                                      Saya
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono truncate">
                                  NIM: {asisten.nim || '-'}
                                </p>
                              </div>
                            </div>

                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 flex-shrink-0">
                              {asisten.waktu || '08:00 - 16:00'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> 08:00 - 16:00 WIB
                  </span>
                  <span>Lab LSD</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
