import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Clock,
  User,
  ExternalLink,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogOut,
  Users,
  Eye,
  MapPin,
  Calendar,
  CalendarDays,
  Check,
  X,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { userAccount, endpointUrl, updateApprovalIzin } = useAttendance();

  // RBAC Gatekeeper: Strictly enforce Admin role
  if (!userAccount || userAccount.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  // Active Tab: 'presensi' | 'izin'
  const [activeTab, setActiveTab] = useState('presensi');

  // Data State
  const [absensiRecords, setAbsensiRecords] = useState([]);
  const [izinRecords, setIzinRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoadingRow, setActionLoadingRow] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  useEffect(() => {
    fetchAdminData();
  }, [userAccount?.userId, endpointUrl]);

  const fetchAdminData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Fetch using Admin's NIM which instructs backend to return full lab dataset
      const nimParam = userAccount?.userId ? `?nim=${encodeURIComponent(userAccount.userId)}` : '';
      const res = await fetch(`${endpointUrl}${nimParam}`, { method: 'GET' });
      const json = await res.json();
      if (json.status === 'success') {
        const absensi = Array.isArray(json.dataAbsensi)
          ? json.dataAbsensi
          : Array.isArray(json.data)
          ? json.data
          : [];
        const izin = Array.isArray(json.dataIzin) ? json.dataIzin : [];

        setAbsensiRecords(absensi);
        setIzinRecords(izin);
      } else {
        setErrorMsg(json.message || 'Gagal mengambil data dari server.');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke Google Apps Script: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Multi-tier Approval (Setujui / Tolak) with Admin userId injected
  const handleApproval = async (rowId, keputusan) => {
    if (!rowId) {
      setErrorMsg('Identifier baris tidak valid.');
      return;
    }

    const confirmAction = window.confirm(
      `Apakah Anda yakin ingin memberikan status "${keputusan}" untuk pengajuan izin ini?`
    );
    if (!confirmAction) return;

    setActionLoadingRow(rowId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await updateApprovalIzin({
        rowId,
        keputusan,
        userId: userAccount.userId
      });

      if (res.success) {
        setSuccessMsg(res.message || `Status pengajuan berhasil diubah menjadi ${keputusan}.`);
        setIzinRecords((prev) =>
          prev.map((item) =>
            item.rowId === rowId || item.id === rowId
              ? { ...item, statusPersetujuan: keputusan, status: keputusan }
              : item
          )
        );
        fetchAdminData();
      } else {
        setErrorMsg(res.message || 'Gagal memperbarui status pengajuan.');
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan: ' + err.message);
    } finally {
      setActionLoadingRow(null);
    }
  };

  // Filtered Absensi Records
  const filteredAbsensi = absensiRecords.filter((item) => {
    const matchesSearch =
      (item.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.userId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.catatan || '').toLowerCase().includes(searchTerm.toLowerCase());

    const isAlpa = (item.status || '').toLowerCase().includes('alpa');
    const isDone = item.waktuKeluar && item.waktuKeluar !== '-' && item.waktuKeluar !== '' && !isAlpa;
    const isActive = !isDone && !isAlpa;

    const matchesStatus =
      statusFilter === 'Semua'
        ? true
        : statusFilter === 'Selesai'
        ? isDone
        : statusFilter === 'Aktif'
        ? isActive
        : statusFilter === 'Alpa'
        ? isAlpa
        : true;

    return matchesSearch && matchesStatus;
  });

  // Filtered Izin Records
  const filteredIzin = izinRecords.filter((item) => {
    const matchesSearch =
      (item.userName || item.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.userId || item.nim || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.alasan || '').toLowerCase().includes(searchTerm.toLowerCase());

    const statusPersetujuan = item.statusPersetujuan || item.status || 'Menunggu Persetujuan';
    const matchesStatus =
      statusFilter === 'Semua' || statusPersetujuan.toLowerCase().includes(statusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  // Quick Stats Calculation
  const totalAbsensi = absensiRecords.length;
  const alpaCount = absensiRecords.filter((r) => (r.status || '').toLowerCase().includes('alpa')).length;
  const completedCount = absensiRecords.filter((r) => r.waktuKeluar && r.waktuKeluar !== '-' && r.waktuKeluar !== '' && !(r.status || '').toLowerCase().includes('alpa')).length;
  const activeCount = totalAbsensi - completedCount - alpaCount;

  const totalIzin = izinRecords.length;
  const pendingIzinCount = izinRecords.filter((i) => (i.statusPersetujuan || i.status || '').includes('Menunggu')).length;
  const approvedIzinCount = izinRecords.filter((i) => (i.statusPersetujuan || i.status || '').includes('Disetujui')).length;
  const rejectedIzinCount = izinRecords.filter((i) => (i.statusPersetujuan || i.status || '').includes('Ditolak')).length;

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
    <div className="w-full space-y-3.5 sm:space-y-4 pb-4 animate-fadeIn">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-2.5 sm:pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate('/')}
              className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-500 transition active:scale-95 touch-manipulation"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base sm:text-xl font-bold text-slate-900">
              Panel Admin LSD
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Admin: {userAccount?.userName}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Pengawasan presensi piket lab dan persetujuan izin terotorisasi
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 active:scale-95 transition shadow-xs text-xs font-semibold flex items-center gap-1.5 touch-manipulation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-blue-50/80 rounded-xl border border-blue-200/80">
        <button
          onClick={() => {
            setActiveTab('presensi');
            setStatusFilter('Semua');
          }}
          className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 touch-manipulation ${
            activeTab === 'presensi'
              ? 'bg-white text-blue-600 shadow-xs border border-blue-200'
              : 'text-blue-700 hover:text-blue-900 hover:bg-blue-100/50'
          }`}
        >
          <Users className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Rekap Presensi</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-semibold bg-blue-100 text-blue-800">
            {totalAbsensi}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('izin');
            setStatusFilter('Semua');
          }}
          className={`flex-1 py-2 px-2 sm:px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 touch-manipulation ${
            activeTab === 'izin'
              ? 'bg-white text-blue-600 shadow-xs border border-blue-200'
              : 'text-blue-700 hover:text-blue-900 hover:bg-blue-100/50'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">Persetujuan Izin</span>
          {pendingIzinCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-bold bg-blue-600 text-white shadow-xs animate-pulse">
              {pendingIzinCount}
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-semibold bg-blue-100 text-blue-800">
              {totalIzin}
            </span>
          )}
        </button>
      </div>

      {/* 3. Stat Cards - Compact 2x2 Grid for Mobile */}
      {activeTab === 'presensi' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase">Total</p>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">{totalAbsensi}</p>
            </div>
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-amber-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9.5px] sm:text-[10px] font-bold text-amber-700 uppercase">Aktif</p>
              <p className="text-lg sm:text-xl font-extrabold text-amber-700 mt-0.5">{activeCount}</p>
            </div>
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-emerald-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 uppercase">Selesai</p>
              <p className="text-lg sm:text-xl font-extrabold text-emerald-700 mt-0.5">{completedCount}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-rose-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9.5px] sm:text-[10px] font-bold text-rose-700 uppercase">Alpa</p>
              <p className="text-lg sm:text-xl font-extrabold text-rose-700 mt-0.5">{alpaCount}</p>
            </div>
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase">Total</p>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">{totalIzin}</p>
            </div>
            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-amber-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9.5px] sm:text-[10px] font-bold text-amber-700 uppercase">Menunggu</p>
              <p className="text-lg sm:text-xl font-extrabold text-amber-700 mt-0.5">{pendingIzinCount}</p>
            </div>
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-emerald-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 uppercase">Disetujui</p>
              <p className="text-lg sm:text-xl font-extrabold text-emerald-700 mt-0.5">{approvedIzinCount}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-rose-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[9.5px] sm:text-[10px] font-bold text-rose-700 uppercase">Ditolak</p>
              <p className="text-lg sm:text-xl font-extrabold text-rose-700 mt-0.5">{rejectedIzinCount}</p>
            </div>
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
          </div>
        </div>
      )}

      {/* 4. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama asisten atau NIM..."
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs transition"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
          {(activeTab === 'presensi'
            ? [
                { key: 'Semua', label: 'Semua' },
                { key: 'Aktif', label: 'Sedang Piket' },
                { key: 'Selesai', label: 'Selesai' },
                { key: 'Alpa', label: 'Alpa' }
              ]
            : [
                { key: 'Semua', label: 'Semua' },
                { key: 'Menunggu Persetujuan', label: 'Menunggu' },
                { key: 'Disetujui', label: 'Disetujui' },
                { key: 'Ditolak', label: 'Ditolak' }
              ]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition text-xs active:scale-95 touch-manipulation flex-shrink-0 ${
                statusFilter === tab.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Alerts */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
          <span>{errorMsg}</span>
          <button onClick={fetchAdminData} className="underline font-bold text-amber-800">
            Coba Lagi
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* 6. Main Data Records View: Mobile Cards (<md) + Desktop Table (>=md) */}
      {loading && (activeTab === 'presensi' ? absensiRecords.length === 0 : izinRecords.length === 0) ? (
        <div className="py-12 text-center space-y-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Memuat data dari Spreadsheet...</p>
        </div>
      ) : activeTab === 'presensi' ? (
        filteredAbsensi.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700">Tidak ada rekaman presensi</h4>
          </div>
        ) : (
          <>
            {/* MOBILE CARDS VIEW (< md) */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredAbsensi.map((item, idx) => {
                const isAlpa = (item.status || '').toLowerCase().includes('alpa');
                const isFinished = Boolean(item.waktuKeluar && item.waktuKeluar !== '-' && item.waktuKeluar !== '') && !isAlpa;

                return (
                  <div key={item.id || idx} className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">{item.userName || 'Asisten'}</div>
                        <div className="text-[10.5px] font-mono text-slate-500">NIM: {item.userId || '-'}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${
                          isAlpa
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isFinished
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isAlpa ? 'Alpa' : isFinished ? 'Selesai' : 'Sedang Piket'}
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Masuk:</span>
                        <span className="font-semibold text-slate-800">{item.waktuMasuk || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50">
                        <span className="text-slate-500">Keluar:</span>
                        <span className={isFinished ? 'font-semibold text-slate-800' : 'text-amber-700 italic'}>
                          {isFinished ? item.waktuKeluar : 'Belum Checkout'}
                        </span>
                      </div>
                    </div>

                    {item.catatan && item.catatan !== '-' && (
                      <p className="text-xs text-slate-700 bg-slate-50/70 p-2 rounded-lg border border-slate-100 italic line-clamp-2">
                        "{item.catatan}"
                      </p>
                    )}

                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      {item.location && item.location !== '-' ? (
                        <a
                          href={`https://www.google.com/maps?q=${item.location}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-[10.5px] truncate max-w-[150px]"
                        >
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.photoUrl && item.photoUrl.startsWith('http') && (
                          <a
                            href={item.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-200"
                          >
                            Foto Masuk
                          </a>
                        )}
                        {item.photoUrlKeluar && item.photoUrlKeluar.startsWith('http') && (
                          <a
                            href={item.photoUrlKeluar}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200"
                          >
                            Foto Keluar
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (>= md) */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Asisten</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Masuk</th>
                      <th className="py-3 px-4">Keluar</th>
                      <th className="py-3 px-4">Lokasi</th>
                      <th className="py-3 px-4">Laporan Inventaris</th>
                      <th className="py-3 px-4 text-center">Foto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAbsensi.map((item, idx) => {
                      const isAlpa = (item.status || '').toLowerCase().includes('alpa');
                      const isFinished = Boolean(item.waktuKeluar && item.waktuKeluar !== '-' && item.waktuKeluar !== '') && !isAlpa;

                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-medium">
                            <div className="font-bold text-slate-900">{item.userName || 'Asisten'}</div>
                            <div className="text-[10px] font-mono text-slate-500">NIM: {item.userId || '-'}</div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isAlpa
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : isFinished
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {isAlpa ? 'Alpa' : isFinished ? 'Selesai' : 'Sedang Piket'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                            {item.waktuMasuk || '-'}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={isFinished ? 'text-slate-800 font-medium' : 'text-amber-700 italic'}>
                              {isFinished ? item.waktuKeluar : 'Belum Checkout'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {item.location && item.location !== '-' ? (
                              <a
                                href={`https://www.google.com/maps?q=${item.location}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-[10px]"
                              >
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate max-w-[100px]">{item.location}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="py-3 px-4 max-w-xs">
                            {item.catatan && item.catatan !== '-' ? (
                              <p className="text-slate-700 line-clamp-1 italic text-[11px]" title={item.catatan}>
                                "{item.catatan}"
                              </p>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {item.photoUrl && item.photoUrl.startsWith('http') && (
                                <a
                                  href={item.photoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-200"
                                >
                                  Masuk
                                </a>
                              )}
                              {item.photoUrlKeluar && item.photoUrlKeluar.startsWith('http') && (
                                <a
                                  href={item.photoUrlKeluar}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200"
                                >
                                  Keluar
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      ) : (
        filteredIzin.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700">Tidak ada pengajuan izin</h4>
          </div>
        ) : (
          <>
            {/* MOBILE CARDS VIEW (< md) for Izin Approvals */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredIzin.map((item, idx) => {
                const rowId = item.rowId || item.id || idx + 2;
                const status = item.statusPersetujuan || item.status || 'Menunggu Persetujuan';
                const isPending = status === 'Menunggu Persetujuan';
                const isApproved = status === 'Disetujui';
                const isRowLoading = actionLoadingRow === rowId;

                return (
                  <div key={rowId} className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">{item.userName || item.nama || 'Asisten'}</div>
                        <div className="text-[10.5px] font-mono text-slate-500">NIM: {item.userId || item.nim || '-'}</div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 flex-shrink-0 ${
                          isPending
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : isApproved
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Berhalangan:</span>
                        <span className="font-semibold text-rose-700">{formatDateDisplay(item.tanggalIzin)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50">
                        <span className="text-slate-500">Pengganti:</span>
                        <span className="font-semibold text-emerald-700">{formatDateDisplay(item.tanggalPengganti)}</span>
                      </div>
                    </div>

                    {item.alasan && (
                      <p className="text-xs text-slate-700 italic bg-blue-50/40 p-2 rounded-lg border border-blue-100/60 line-clamp-2">
                        "{item.alasan}"
                      </p>
                    )}

                    {/* Action Buttons for Mobile */}
                    {isPending ? (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => handleApproval(rowId, 'Disetujui')}
                          disabled={isRowLoading}
                          className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50 touch-manipulation min-h-[40px]"
                        >
                          {isRowLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>Setujui</span>
                        </button>

                        <button
                          onClick={() => handleApproval(rowId, 'Ditolak')}
                          disabled={isRowLoading}
                          className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50 touch-manipulation min-h-[40px]"
                        >
                          {isRowLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                          <span>Tolak</span>
                        </button>
                      </div>
                    ) : (
                      <div className="pt-1 border-t border-slate-100 text-right">
                        <span className="text-slate-400 text-[10.5px] italic">Status Selesai</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (>= md) */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Asisten</th>
                      <th className="py-3 px-4">Berhalangan</th>
                      <th className="py-3 px-4">Pengganti</th>
                      <th className="py-3 px-4">Alasan</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredIzin.map((item, idx) => {
                      const rowId = item.rowId || item.id || idx + 2;
                      const status = item.statusPersetujuan || item.status || 'Menunggu Persetujuan';
                      const isPending = status === 'Menunggu Persetujuan';
                      const isApproved = status === 'Disetujui';
                      const isRowLoading = actionLoadingRow === rowId;

                      return (
                        <tr key={rowId} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-medium">
                            <div className="font-bold text-slate-900">{item.userName || item.nama || 'Asisten'}</div>
                            <div className="text-[10px] font-mono text-slate-500">NIM: {item.userId || item.nim || '-'}</div>
                          </td>

                          <td className="py-3 px-4 text-rose-700 font-semibold whitespace-nowrap">
                            {formatDateDisplay(item.tanggalIzin)}
                          </td>

                          <td className="py-3 px-4 text-emerald-700 font-semibold whitespace-nowrap">
                            {formatDateDisplay(item.tanggalPengganti)}
                          </td>

                          <td className="py-3 px-4 max-w-xs">
                            <p className="text-slate-700 italic text-[11px] line-clamp-1" title={item.alasan}>
                              "{item.alasan || '-'}"
                            </p>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isPending
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : isApproved
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}
                            >
                              {status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            {isPending ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleApproval(rowId, 'Disetujui')}
                                  disabled={isRowLoading}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition active:scale-95 disabled:opacity-50"
                                >
                                  {isRowLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                  <span>Setujui</span>
                                </button>

                                <button
                                  onClick={() => handleApproval(rowId, 'Ditolak')}
                                  disabled={isRowLoading}
                                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition active:scale-95 disabled:opacity-50"
                                >
                                  {isRowLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                  <span>Tolak</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">
                                Selesai
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
