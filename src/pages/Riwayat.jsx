import React, { useState, useEffect } from 'react';
import {
  History,
  RefreshCw,
  Search,
  MapPin,
  Clock,
  ExternalLink,
  FileText,
  Calendar,
  CalendarDays,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';

export default function Riwayat() {
  const { userAccount, history, izinHistory, loadingHistory, historyError, fetchHistory } = useAttendance();
  const [activeTab, setActiveTab] = useState('absensi'); // 'absensi' | 'izin'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  const currentNim = userAccount?.userId || userAccount?.nim || '';

  useEffect(() => {
    if (currentNim) {
      fetchHistory(currentNim);
    } else {
      fetchHistory();
    }
  }, [currentNim]);

  const handleRefresh = () => {
    if (currentNim) {
      fetchHistory(currentNim);
    } else {
      fetchHistory();
    }
  };

  // Filtered Absensi Records (Privacy locked to current assistant)
  const filteredAbsensi = history.filter((item) => {
    const matchesUser = !currentNim || (item.userId || '').toString().trim() === currentNim.trim();
    if (!matchesUser) return false;

    const matchesSearch =
      (item.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.userId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.catatan || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'Semua' || (item.status || 'Hadir').toLowerCase().includes(statusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  // Filtered Izin Records (Privacy locked to current assistant)
  const filteredIzin = (izinHistory || []).filter((item) => {
    const matchesUser = !currentNim || (item.userId || item.nim || '').toString().trim() === currentNim.trim();
    if (!matchesUser) return false;

    const matchesSearch =
      (item.userName || item.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.userId || item.nim || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.alasan || '').toLowerCase().includes(searchTerm.toLowerCase());

    const statusPersetujuan = item.statusPersetujuan || item.status || 'Menunggu Persetujuan';
    const matchesStatus =
      statusFilter === 'Semua' || statusPersetujuan.toLowerCase().includes(statusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const [y, m, d] = dateStr.split('-');
      if (!d) return dateStr;
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full space-y-4 pb-20 animate-fadeIn">
      {/* 1. Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Riwayat Presensi & Izin Saya
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log presensi piket dan status izin untuk akun <strong className="text-slate-800">{userAccount?.userName}</strong> ({userAccount?.userId})
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loadingHistory}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 active:scale-95 transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold"
          title="Segarkan Riwayat"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* 2. Main Tab Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-blue-50/80 rounded-xl border border-blue-200/80">
        <button
          onClick={() => {
            setActiveTab('absensi');
            setStatusFilter('Semua');
          }}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'absensi'
              ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
              : 'text-blue-700 hover:text-blue-900 hover:bg-blue-100/50'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Presensi Hadir</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
            {filteredAbsensi.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('izin');
            setStatusFilter('Semua');
          }}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'izin'
              ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
              : 'text-blue-700 hover:text-blue-900 hover:bg-blue-100/50'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Pengajuan Izin</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
            {filteredIzin.length}
          </span>
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'absensi'
                ? 'Cari laporan atau lokasi...'
                : 'Cari alasan izin atau tanggal...'
            }
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm transition"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
          {(activeTab === 'absensi'
            ? ['Semua', 'Masuk', 'Keluar', 'Hadir']
            : ['Semua', 'Menunggu Persetujuan', 'Disetujui', 'Ditolak']
          ).map((item) => (
            <button
              key={item}
              onClick={() => setStatusFilter(item)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition text-xs ${
                statusFilter === item
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Error Alert */}
      {historyError && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
          <span>{historyError}</span>
          <button onClick={handleRefresh} className="underline font-bold text-amber-800">
            Coba Lagi
          </button>
        </div>
      )}

      {/* 5. Content View */}
      {loadingHistory && (activeTab === 'absensi' ? history.length === 0 : (izinHistory || []).length === 0) ? (
        <div className="py-12 text-center space-y-2.5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Memuat data dari Google Spreadsheet...</p>
        </div>
      ) : activeTab === 'absensi' ? (
        filteredAbsensi.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700">Tidak ada riwayat presensi</h4>
            <p className="text-[11px] text-slate-400">Belum ada catatan absensi atau filter tidak cocok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredAbsensi.map((record, index) => {
              const isMasuk = (record.status || '').toLowerCase().includes('masuk');
              const isKeluar = (record.status || '').toLowerCase().includes('keluar');

              return (
                <div
                  key={record.id || index}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        {record.timestamp || record.waktuMasuk || '-'}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isMasuk
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : isKeluar
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {record.status || 'Hadir'}
                      </span>
                    </div>

                    {record.catatan && record.catatan !== '-' && (
                      <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic line-clamp-2">
                        "{record.catatan}"
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-mono truncate max-w-[150px]">
                      <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0" />
                      {record.location || '-'}
                    </span>

                    {record.photoUrl && record.photoUrl.startsWith('http') && (
                      <a
                        href={record.photoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold underline"
                      >
                        Foto Drive <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        filteredIzin.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700">Tidak ada pengajuan izin</h4>
            <p className="text-[11px] text-slate-400">Anda belum memiliki riwayat pengajuan izin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredIzin.map((item, index) => {
              const status = item.statusPersetujuan || item.status || 'Menunggu Persetujuan';
              const isPending = status === 'Menunggu Persetujuan';
              const isApproved = status === 'Disetujui';

              return (
                <div
                  key={item.id || index}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-400">
                        {item.timestamp || 'Tercatat'}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                          isPending
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : isApproved
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                        {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {!isPending && !isApproved && <XCircle className="w-3 h-3 text-rose-600" />}
                        <span>{status}</span>
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Berhalangan:</span>
                        <span className="font-semibold text-rose-700">
                          {formatDateDisplay(item.tanggalIzin)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500">Pengganti:</span>
                        <span className="font-semibold text-emerald-700">
                          {formatDateDisplay(item.tanggalPengganti)}
                        </span>
                      </div>
                    </div>

                    {item.alasan && (
                      <p className="text-xs text-slate-700 italic bg-blue-50/40 p-2 rounded-lg border border-blue-100/60 line-clamp-2">
                        "{item.alasan}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
