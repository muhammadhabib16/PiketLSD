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
    <div className="max-w-xl mx-auto w-full space-y-4 pb-20 animate-fadeIn">

      {/* 1. Success Hero Card */}
      <div className="text-center space-y-2.5 pt-1">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8 text-blue-600" />
        </div>

        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            {isMasuk ? 'Sesi Piket Berhasil Dimulai!' : 'Piket Selesai & Laporan Terkirim!'}
          </h2>
          <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-md mx-auto">
            {isMasuk
              ? 'Waktu masuk presensi Anda telah dicatat ke sistem. Silakan jalankan piket lab minimal 2 jam.'
              : 'Terima kasih atas tugas piket hari ini. Laporan kondisi lab tersimpan dan sesi Anda telah ditutup.'}
          </p>
        </div>
      </div>

      {/* 2. Digital Attendance Receipt Ticket */}
      <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-md space-y-4">
        
        {/* Ticket Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <img src="/logo-lsd.png" alt="Logo LSD" className="w-5 h-5 object-contain" />
            <span className="text-xs md:text-sm font-bold text-slate-800">Bukti Presensi Piket Digital</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            isMasuk
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {data.status || 'Tercatat'}
          </span>
        </div>

        {/* User & Photo Info */}
        <div className="flex items-center space-x-4">
          {data.previewUrl || data.photoUrl ? (
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 shadow-sm">
              <img
                src={data.previewUrl || data.photoUrl}
                alt="Foto Absen"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
              <User className="w-7 h-7" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm md:text-base font-bold text-slate-900 truncate">{data.userName || '-'}</p>
            <p className="text-xs font-mono text-slate-500">NIM: {data.userId || '-'}</p>
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
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs md:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" /> Waktu Tercatat
            </span>
            <span className="font-semibold text-slate-900">{data.timestamp}</span>
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
            <span className="text-slate-600 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" /> Koordinat GPS
            </span>
            <span className="font-mono text-slate-700 truncate max-w-[200px] text-right">
              {data.location}
            </span>
          </div>

          {data.catatan && (
            <div className="pt-2 border-t border-slate-200 space-y-1">
              <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                <FileText className="w-4 h-4 text-blue-600" /> Laporan Inventaris
              </span>
              <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 text-xs italic">
                "{data.catatan}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => navigate('/')}
          className="py-3 px-4 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
        >
          <Home className="w-4 h-4 text-slate-500" />
          Beranda
        </button>

        <button
          onClick={() => navigate('/riwayat')}
          className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
        >
          <History className="w-4 h-4" />
          Lihat Riwayat
        </button>
      </div>

    </div>
  );
}

