import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Home, History, MapPin, Clock, User, ExternalLink, ShieldCheck, FileText } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';

export default function Sukses() {
  const navigate = useNavigate();
  const { lastResult } = useAttendance();

  const data = lastResult || {
    userId: '21010045',
    userName: 'Asisten Lab',
    status: 'Masuk',
    catatan: '',
    location: '-6.200000, 106.816666',
    timestamp: new Date().toLocaleString('id-ID'),
    photoUrl: '',
    previewUrl: ''
  };

  const isMasuk = (data.status || '').toLowerCase().includes('masuk');

  return (
    <div className="max-w-xl mx-auto w-full space-y-5 sm:space-y-6 pb-6 animate-fadeIn">

      {/* 1. Success Hero Card */}
      <div className="text-center space-y-3 pt-2">
        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9" />
        </div>

        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
            {isMasuk ? 'Sesi Piket Berhasil Dimulai!' : 'Piket Selesai & Laporan Terkirim!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            {isMasuk
              ? 'Waktu masuk presensi Anda telah dicatat ke sistem. Silakan jalankan piket lab minimal 2 jam.'
              : 'Terima kasih atas tugas piket hari ini. Laporan kondisi lab tersimpan dan sesi Anda telah ditutup.'}
          </p>
        </div>
      </div>

      {/* 2. Digital Attendance Receipt Ticket */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/80 shadow-xs space-y-5">
        
        {/* Ticket Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <img src="/logo-lsd.png" alt="Logo LSD" className="w-5 h-5 object-contain" />
            <span className="text-xs sm:text-sm font-bold text-slate-800">Bukti Presensi Piket Digital</span>
          </div>
          <span className={`px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border ${
            isMasuk
              ? 'bg-blue-50 text-blue-700 border-blue-200/80'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
          }`}>
            {data.status || 'Tercatat'}
          </span>
        </div>

        {/* User & Photo Info */}
        <div className="flex items-center space-x-3.5 sm:space-x-4">
          {data.previewUrl || data.photoUrl ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200 flex-shrink-0 shadow-xs">
              <img
                src={data.previewUrl || data.photoUrl}
                alt="Foto Absen"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
              <User className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-bold text-slate-900 truncate">{data.userName || '-'}</p>
            <p className="text-xs font-mono text-slate-500 mt-0.5">NIM: {data.userId || '-'}</p>
            {data.photoUrl && data.photoUrl.startsWith('http') && (
              <a
                href={data.photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1 font-medium underline"
              >
                Buka di Google Drive <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Metadata Rows */}
        <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/70 space-y-2.5 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 flex items-center gap-2 text-xs sm:text-sm">
              <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" /> Waktu
            </span>
            <span className="font-semibold text-slate-900 text-xs sm:text-sm">{data.timestamp}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <span className="text-slate-600 flex items-center gap-2 text-xs sm:text-sm">
              <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" /> Lokasi GPS
            </span>
            <span className="font-mono text-slate-700 truncate max-w-[170px] sm:max-w-[220px] text-right text-xs">
              {data.location}
            </span>
          </div>

          {data.catatan && (
            <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
              <span className="text-slate-600 flex items-center gap-2 font-medium text-xs sm:text-sm">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" /> Laporan
              </span>
              <p className="text-slate-800 bg-white p-3 rounded-xl border border-slate-200/80 text-xs italic leading-relaxed">
                "{data.catatan}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={() => navigate('/')}
          className="py-3 px-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition active:scale-98 shadow-xs touch-manipulation min-h-[48px] cursor-pointer"
        >
          <Home className="w-4 h-4 text-slate-500" />
          Beranda
        </button>

        <button
          onClick={() => navigate('/riwayat')}
          className="py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition active:scale-98 shadow-md shadow-blue-500/20 touch-manipulation min-h-[48px] cursor-pointer"
        >
          <History className="w-4 h-4" />
          Lihat Riwayat
        </button>
      </div>

    </div>
  );
}

