import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';

export default function FormIzin() {
  const navigate = useNavigate();
  const { userAccount, submitIzin } = useAttendance();

  const userId = userAccount?.userId || userAccount?.nim || '';
  const userName = userAccount?.userName || userAccount?.nama || '';

  // Form Fields
  const [tanggalIzin, setTanggalIzin] = useState('');
  const [tanggalPengganti, setTanggalPengganti] = useState('');
  const [alasan, setAlasan] = useState('');

  // Status & Feedback State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  // Quick reason presets
  const quickReasons = [
    'Ada kuliah/praktikum pengganti',
    'Sakit / kondisi kurang sehat',
    'Keperluan akademik mendesak'
  ];

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessInfo(null);

    const cleanId = userId.trim();
    const cleanName = userName.trim();

    if (!cleanId || !cleanName) {
      setErrorMessage('Sesi login tidak valid. Silakan login kembali.');
      return;
    }

    if (!tanggalIzin) {
      setErrorMessage('Silakan tentukan Tanggal Berhalangan.');
      return;
    }

    if (!tanggalPengganti) {
      setErrorMessage('Silakan tentukan Tanggal Pengganti.');
      return;
    }

    if (tanggalIzin === tanggalPengganti) {
      setErrorMessage('Tanggal Pengganti tidak boleh sama dengan Tanggal Berhalangan.');
      return;
    }

    if (!alasan.trim()) {
      setErrorMessage('Mohon isi alasan permohonan izin.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        userId: cleanId,
        userName: cleanName,
        status: 'Izin',
        tanggalIzin: tanggalIzin,
        tanggalPengganti: tanggalPengganti,
        alasan: alasan.trim()
      };

      const result = await submitIzin(payload);

      if (result.success) {
        setSuccessInfo({
          nim: cleanId,
          nama: cleanName,
          tanggalIzin,
          tanggalPengganti,
          alasan: alasan.trim(),
          message: result.message
        });
      } else {
        setErrorMessage(result.message || 'Gagal mengirimkan pengajuan izin ke server.');
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan saat menghubungi server: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessInfo(null);
    setTanggalIzin('');
    setTanggalPengganti('');
    setAlasan('');
    setErrorMessage('');
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const [y, m, d] = dateStr.split('-');
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full space-y-5 sm:space-y-6 pb-4 animate-fadeIn">
      {/* 1. Header Title */}
      <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-slate-200/80">
        <div>
          <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
            Pengajuan Izin / Tukar Jadwal
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Pengajuan atas nama <strong className="text-slate-800 font-semibold">{userName}</strong> ({userId})
          </p>
        </div>
      </div>

      {/* 2. Success Receipt View */}
      {successInfo ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-9 border border-slate-200/80 shadow-xs space-y-5 sm:space-y-6 animate-fadeIn">
          <div className="text-center space-y-2.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Pengajuan Izin Berhasil Terkirim
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {successInfo.message || 'Data telah tercatat dan menunggu persetujuan admin.'}
            </p>
          </div>

          {/* Ticket Summary */}
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/70 space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-2 text-xs">
                <Calendar className="w-4 h-4 text-rose-500 flex-shrink-0" /> Berhalangan:
              </span>
              <span className="font-semibold text-rose-700 text-right truncate ml-2">
                {formatDateDisplay(successInfo.tanggalIzin)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-2 text-xs">
                <CalendarDays className="w-4 h-4 text-emerald-600 flex-shrink-0" /> Pengganti:
              </span>
              <span className="font-semibold text-emerald-700 text-right truncate ml-2">
                {formatDateDisplay(successInfo.tanggalPengganti)}
              </span>
            </div>

            <div className="pt-2 space-y-1.5">
              <span className="text-slate-500 flex items-center gap-2 text-xs">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" /> Alasan:
              </span>
              <p className="p-3 bg-white rounded-xl border border-slate-200/80 text-slate-800 italic text-xs leading-relaxed">
                "{successInfo.alasan}"
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => navigate('/')}
              className="py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs sm:text-sm font-bold transition shadow-md shadow-blue-500/20 touch-manipulation min-h-[46px] cursor-pointer"
            >
              Beranda
            </button>
            <button
              onClick={handleReset}
              className="py-3 px-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition active:scale-98 shadow-xs touch-manipulation min-h-[46px] cursor-pointer"
            >
              Pengajuan Baru
            </button>
          </div>
        </div>
      ) : (
        /* 3. Form Input View */
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-5 sm:p-7 md:p-8 border border-slate-200/80 shadow-xs space-y-5">
            {/* Field 1 & 2: Tanggal Berhalangan & Tanggal Pengganti */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  Tanggal Berhalangan *
                </label>
                <input
                  type="date"
                  value={tanggalIzin}
                  onChange={(e) => setTanggalIzin(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition min-h-[46px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-emerald-600" />
                  Tanggal Pengganti *
                </label>
                <input
                  type="date"
                  value={tanggalPengganti}
                  onChange={(e) => setTanggalPengganti(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition min-h-[46px]"
                  required
                />
              </div>
            </div>

            {/* Field 3: Alasan */}
            <div className="space-y-2.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Alasan Berhalangan / Tukar Piket *
              </label>
              
              <textarea
                rows={3}
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                disabled={submitting}
                placeholder="Contoh: Ada jadwal praktikum pengganti jam 10:00 - 12:00, piket diganti hari Kamis."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition resize-none leading-relaxed"
                required
              />

              {/* Quick Preset Buttons - Horizontal Swipe Chips for Mobile */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Template Cepat (Geser & Tap):
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pe-4 -mx-0.5 px-0.5">
                  {quickReasons.map((rsn, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAlasan(rsn)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 text-[11px] font-medium text-blue-700 border border-blue-200/80 transition whitespace-nowrap flex-shrink-0 touch-manipulation shadow-2xs cursor-pointer"
                    >
                      + {rsn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-md shadow-blue-500/20 disabled:opacity-60 touch-manipulation min-h-[48px] cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengirim Pengajuan...</span>
              </>
            ) : (
              <>
                <span>Kirim Pengajuan Izin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
