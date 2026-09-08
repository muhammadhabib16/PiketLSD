import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import ShatteredLogo from '../components/ShatteredLogo';
import InteractiveDotBackground from '../components/InteractiveDotBackground';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, userAccount } = useAttendance();

  const [nimInput, setNimInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to Home
  if (isAuthenticated && userAccount) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const result = await login(nimInput, pinInput);
      if (result.success) {
        navigate('/', { replace: true });
      } else {
        setErrorMessage(result.message || 'NIM atau Password salah. Silakan coba lagi.');
      }
    } catch (err) {
      setErrorMessage('Terjadi kendala saat memproses login: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[80vh] sm:min-h-[85vh] flex flex-col justify-center items-center py-4 sm:py-8 px-3.5 sm:px-4 overflow-hidden">
      {/* Interactive Physics Dot Canvas */}
      <InteractiveDotBackground />

      {/* Main Login Content Card */}
      <div className="relative z-10 w-full max-w-md mx-auto animate-fadeIn">
        {/* Brand Icon & Heading */}
        <div className="text-center space-y-2.5 sm:space-y-3 mb-4 sm:mb-6">
          {/* Shattered Shard Animated Logo */}
          <div className="flex justify-center">
            <ShatteredLogo size={76} />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-blue-50/90 text-blue-700 border border-blue-200/80 mb-2 shadow-xs backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Portal Presensi Asisten
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Laboratorium Systems Development
            </h2>
            <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-1 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
              Masukkan NIM dan Password terdaftar untuk presensi mandiri dan riwayat kehadiran
            </p>
          </div>
        </div>

        {/* Main Login Card */}
        <div className="w-full bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 border border-blue-100 shadow-xl shadow-blue-500/5 space-y-4 sm:space-y-5">
        {errorMessage && (
          <div className="p-3 sm:p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-2.5 animate-shake shadow-xs">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Gagal Masuk</p>
              <p className="text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-4">
          {/* Field 1: NIM */}
          <div className="space-y-1.5">
            <label htmlFor="nim" className="block text-xs sm:text-sm font-bold text-slate-800">
              Nomor Induk Mahasiswa (NIM)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="nim"
                type="text"
                autoFocus
                required
                value={nimInput}
                onChange={(e) => setNimInput(e.target.value)}
                placeholder="Contoh: 2311522037"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition font-mono"
              />
            </div>
          </div>

          {/* Field 2: Password */}
          <div className="space-y-1.5">
            <label htmlFor="pin" className="block text-xs sm:text-sm font-bold text-slate-800">
              Password Asisten
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="pin"
                type={showPin ? 'text' : 'password'}
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan password terdaftar..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPin((prev) => !prev)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1 rounded transition touch-manipulation"
                title={showPin ? 'Sembunyikan Password' : 'Tampilkan Password'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-60 touch-manipulation min-h-[48px]"
          >
            {loading ? (
              <span>Memverifikasi Akun...</span>
            ) : (
              <>
                <span>Masuk ke Sistem Presensi</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  </div>
  );
}
