import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import InteractiveLogo from '../components/InteractiveLogo';
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
    <div className="relative w-full flex-1 flex flex-col justify-center items-center py-6 sm:py-10 px-3.5 sm:px-6 overflow-hidden">
      {/* Subtle Interactive Particle Canvas */}
      <InteractiveDotBackground />

      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/3 w-64 sm:w-80 h-64 sm:h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Login Card Container */}
      <div className="relative z-10 w-full max-w-[430px] mx-auto animate-fadeIn">
        {/* Brand Icon & Heading */}
        <div className="text-center space-y-3 mb-6 sm:mb-8">
          {/* Interactive 3D Physics Logo */}
          <div className="flex justify-center relative">
            <InteractiveLogo size={80} />
          </div>

          <div className="space-y-1.5">
            
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Laboratorium Systems Development
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
              Silakan masukkan NIM dan Password untuk mengakses sistem presensi mandiri
            </p>
          </div>
        </div>

        {/* Main Glassmorphism Login Card */}
        <div className="w-full bg-white/90 backdrop-blur-xl rounded-3xl p-5 sm:p-7 md:p-8 border border-white/80 shadow-2xl shadow-blue-900/5 space-y-5">
          {errorMessage && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50/90 border border-rose-200/80 text-rose-900 text-xs sm:text-sm flex items-start gap-3 animate-shake shadow-xs">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-rose-950">Gagal Masuk</p>
                <p className="text-rose-700 mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-4.5">
            {/* Field 1: NIM */}
            <div className="space-y-1.5">
              <label htmlFor="nim" className="block text-xs font-bold text-slate-700">
                Nomor Induk Mahasiswa (NIM)
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="nim"
                  type="text"
                  autoFocus
                  required
                  value={nimInput}
                  onChange={(e) => setNimInput(e.target.value)}
                  placeholder="Masukkan NIM terdaftar..."
                  className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/90 focus:border-blue-500 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono shadow-2xs"
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="pin" className="block text-xs font-bold text-slate-700">
                  Password Asisten
                </label>
              </div>
              <div className="relative group">
                <div className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="pin"
                  type={showPin ? 'text' : 'password'}
                  required
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Masukkan password Anda..."
                  className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/90 focus:border-blue-500 rounded-2xl pl-10 pr-11 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-mono shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((prev) => !prev)}
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-700 w-10 h-10 rounded-xl transition-colors active:scale-90 touch-manipulation cursor-pointer flex items-center justify-center"
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
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 touch-manipulation min-h-[50px] cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </div>
              ) : (
                <>
                  <span>Masuk ke Sistem Presensi</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

       
          
        </div>
      </div>
    </div>
  );
}

