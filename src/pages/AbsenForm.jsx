import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import {
  Camera,
  SwitchCamera,
  RotateCcw,
  Send,
  AlertCircle,
  Clock,
  FileText,
  Loader2,
  Lock,
  Unlock,
  CheckCircle2,
  MapPin,
  Sparkles,
  Info
} from 'lucide-react';
import { useAttendance, REQUIRED_PIKET_DURATION_MS } from '../context/AttendanceContext';
import { useGeolocation } from '../hooks/useGeolocation';
import LocationBadge from '../components/LocationBadge';
import { compressImageAspectRatio } from '../utils/imageCompressor';

export default function AbsenForm() {
  const navigate = useNavigate();
  const {
    userAccount,
    piketSession,
    submitAttendance
  } = useAttendance();

  const webcamRef = useRef(null);

  // Assistant Identity is locked directly from authenticated userAccount
  const userId = piketSession ? piketSession.userId : userAccount?.userId || '';
  const userName = piketSession ? piketSession.userName : userAccount?.userName || '';
  const [catatan, setCatatan] = useState('');

  // Camera State
  const [facingMode, setFacingMode] = useState('user');
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Timer Engine State
  const [remainingTimeMs, setRemainingTimeMs] = useState(0);
  const [elapsedString, setElapsedString] = useState('');
  const [countdownString, setCountdownString] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // GPS Geolocation Hook (Only needed for Clock-In)
  const isSessionActive = Boolean(piketSession);
  const { latitude, longitude, accuracy, locationString, loading: gpsLoading, error: gpsError, refreshLocation } = useGeolocation(!isSessionActive);

  // Check 14:00 WIB Cutoff for Clock-in (frontend.md Section 2.C)
  const checkIsPastCutoff = () => {
    try {
      const now = new Date();
      const wibTimeString = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Jakarta',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      const [h, m] = wibTimeString.split(':').map(Number);
      return h > 14 || (h === 14 && m > 0);
    } catch {
      const now = new Date();
      return now.getHours() > 14 || (now.getHours() === 14 && now.getMinutes() > 0);
    }
  };

  const isPastCutoff = !isSessionActive && checkIsPastCutoff();

  // Quick report templates for mobile convenience
  const quickTemplates = [
    '30 PC berfungsi normal, ruangan bersih & rapi.',
    'Lab rapi, AC dan lampu telah dimatikan.',
    'Semua perangkat aman, lab telah dikunci.'
  ];

  // Countdown Engine Effect
  useEffect(() => {
    if (!piketSession || !piketSession.startTime) return;

    const calculateTimer = () => {
      const now = Date.now();
      const elapsed = now - piketSession.startTime;
      const remaining = Math.max(0, REQUIRED_PIKET_DURATION_MS - elapsed);
      setRemainingTimeMs(remaining);

      const progress = Math.min(100, Math.round((elapsed / REQUIRED_PIKET_DURATION_MS) * 100));
      setProgressPercent(progress);

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      const pad = (n) => String(n).padStart(2, '0');
      setCountdownString(`${pad(hours)}j ${pad(minutes)}m ${pad(seconds)}d`);

      const elapsedHours = Math.floor(elapsed / (1000 * 60 * 60));
      const elapsedMins = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
      setElapsedString(`${elapsedHours}j ${elapsedMins}m`);
    };

    calculateTimer();
    const interval = setInterval(calculateTimer, 1000);
    return () => clearInterval(interval);
  }, [piketSession]);

  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: facingMode
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    setCameraReady(false);
  };

  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 300);

    // Capture using the camera's natural aspect ratio to prevent stretching/distortion (gepeng) on mobile
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setErrorMessage('');
    }
  }, [webcamRef]);

  const handleRetake = () => {
    setCapturedImage(null);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanId = userId.trim();
    const cleanName = userName.trim();

    if (!isSessionActive) {
      if (!cleanId || !cleanName) {
        setErrorMessage('Sesi akun tidak valid. Silakan login kembali.');
        return;
      }
      if (!capturedImage) {
        setErrorMessage('Wajib mengambil foto selfie kehadiran live sebelum mengirim presensi.');
        return;
      }
    } else {
      if (remainingTimeMs > 0) {
        setErrorMessage(`Durasi piket wajib 2 jam belum tercapai. Sisa waktu: ${countdownString}`);
        return;
      }
      if (!catatan.trim()) {
        setErrorMessage('Mohon tulis laporan inventaris/kondisi lab sebelum menyelesaikan piket.');
        return;
      }
      if (!capturedImage) {
        setErrorMessage('Wajib mengambil foto bukti kondisi lab / selfie checkout.');
        return;
      }
    }

    setSubmitting(true);
    setSubmitStep('Mengompres foto HD (anti-distorsi)...');

    try {
      // 1. Proportional Canvas Compression strictly preserving aspect ratio (anti-melar / anti-gepeng)
      const compressed = await compressImageAspectRatio(capturedImage, {
        maxDimension: 960,
        quality: 0.80
      });

      const base64Data = compressed.base64;
      const previewUrl = compressed.dataUrl;

      setSubmitStep('Mengunggah presensi ke server...');

      let payload;
      if (!isSessionActive) {
        payload = {
          userId: cleanId,
          userName: cleanName,
          status: 'Masuk',
          catatan: 'Mulai Piket Lab',
          location: locationString || (latitude ? `${latitude}, ${longitude}` : '-'),
          imageBytes: base64Data,
          imageName: `Piket_Masuk_${cleanId}_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          previewUrl: previewUrl
        };
      } else {
        payload = {
          userId: cleanId,
          status: 'Keluar',
          catatan: catatan.trim(),
          imageBytes: base64Data,
          imageName: `Piket_Keluar_${cleanId}_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          previewUrl: previewUrl
        };
      }

      const response = await submitAttendance(payload);

      if (response.success) {
        setSubmitStep('Berhasil! Mengalihkan...');
        setTimeout(() => {
          navigate('/sukses');
        }, 400);
      } else {
        setErrorMessage(response.message || 'Sistem menolak permintaan presensi.');
        setSubmitting(false);
      }
    } catch (err) {
      setErrorMessage('Gagal menghubungi server: ' + err.message);
      setSubmitting(false);
    }
  };

  const formatStartTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }) + ' WIB';
  };

  const isTimeUnlocked = remainingTimeMs <= 0;

  return (
    <div className="max-w-4xl mx-auto w-full space-y-5 sm:space-y-6 pb-4 animate-fadeIn">
      {/* 1. Header Navigation & Title */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200">
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 truncate">
            {isSessionActive ? 'Checkout Piket & Laporan' : 'Presensi Piket Masuk'}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
            {isSessionActive
              ? 'Wajib durasi 2 jam & laporan kondisi lab'
              : `Presensi atas nama ${userName} (${userId})`}
          </p>
        </div>

        {isSessionActive && (
          <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 flex-shrink-0 shadow-2xs">
            <Clock className="w-3.5 h-3.5 animate-pulse" /> Sedang Piket
          </span>
        )}
      </div>

      {/* 2. Error & Time Alerts */}
      {errorMessage && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-3 animate-shake shadow-xs">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block text-rose-950 mb-0.5">Pemberitahuan Sistem:</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* 14:00 WIB Cutoff Alert Banner (frontend.md Section 2.C) */}
      {isPastCutoff && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm flex items-start gap-3.5 shadow-xs animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <span>Pemberitahuan Batas Waktu Piket (&gt; 14:00 WIB)</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-200 text-amber-900">
                PENTING
              </span>
            </div>
            <p className="text-[11.5px] sm:text-xs text-amber-800 leading-relaxed">
              Waktu sekarang telah melewati pukul <strong>14:00 WIB</strong>. Laboratorium tutup pukul <strong>16:00 WIB</strong> dan sesi piket membutuhkan durasi wajib minimal <strong>2 jam</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Active Session Info & Countdown Card */}
      {isSessionActive && (
        <div className="rounded-3xl p-4 sm:p-6 bg-amber-50/90 border border-amber-300 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-amber-200/80 text-amber-900 flex-shrink-0 shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Sesi Piket Sedang Berjalan</h3>
                <p className="text-[11px] sm:text-xs text-slate-600">
                  Masuk: <span className="text-slate-900 font-mono font-semibold">{formatStartTime(piketSession.startTime)}</span> • Berjalan: <span className="text-blue-700 font-bold">{elapsedString}</span>
                </p>
              </div>
            </div>

            {/* Countdown Badge */}
            <div
              className={`self-start sm:self-auto px-4 py-2 rounded-xl font-mono text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs ${
                isTimeUnlocked
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-amber-200 text-amber-950 border border-amber-300'
              }`}
            >
              {isTimeUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4 text-amber-800" />}
              <span>{isTimeUnlocked ? '2 Jam Tercapai (Siap Kirim)' : countdownString}</span>
            </div>
          </div>

          {/* Mini progress track */}
          <div className="w-full bg-amber-200/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 3. Main Camera & Form Grid */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8">
          
          {/* LEFT: Camera Viewport */}
          <div className="rounded-3xl p-4 sm:p-6 bg-white border border-slate-200/90 shadow-xs space-y-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2.5">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Camera className="w-4 h-4 text-blue-600" />
                  {isSessionActive ? 'Foto Kondisi / Inventaris Lab' : 'Foto Selfie Kehadiran Live'}
                </span>
                <span className="text-[11px] text-rose-600 font-semibold">*Wajib Foto</span>
              </div>

              {/* Camera Frame (Natural aspect ratio on all mobile and desktop screens) */}
              <div className="relative w-full aspect-[4/3] max-h-[460px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-300 flex items-center justify-center shadow-inner">
                {isFlashing && (
                  <div className="absolute inset-0 bg-white z-20 pointer-events-none opacity-90 transition-opacity duration-300" />
                )}

                {cameraError ? (
                  <div className="p-4 text-center space-y-2 text-white">
                    <AlertCircle className="w-7 h-7 text-rose-400 mx-auto" />
                    <p className="text-xs text-rose-200">{cameraError}</p>
                  </div>
                ) : capturedImage ? (
                  <img
                    src={capturedImage}
                    alt="Pratinjau Presensi"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      mirrored={facingMode === 'user'}
                      videoConstraints={videoConstraints}
                      onUserMedia={() => setCameraReady(true)}
                      onUserMediaError={() => {
                        setCameraError('Gagal mengakses kamera. Izinkan akses kamera pada browser Anda.');
                      }}
                      className="w-full h-full object-cover"
                    />

                    {!cameraReady && (
                      <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white space-y-2">
                        <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                        <span className="text-xs">Menyiapkan kamera...</span>
                      </div>
                    )}
                  </>
                )}

                {/* Floating Camera Actions */}
                <div className="absolute bottom-3 sm:bottom-4 inset-x-0 flex items-center justify-center gap-4 sm:gap-6 z-10 px-3">
                  {!capturedImage && cameraReady && (
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-slate-900/80 hover:bg-slate-900 active:scale-90 text-white backdrop-blur-md border border-white/30 flex items-center justify-center transition shadow-lg touch-manipulation cursor-pointer"
                      title="Ganti Kamera Depan/Belakang"
                    >
                      <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  )}

                  {!capturedImage && cameraReady && (
                    <button
                      type="button"
                      onClick={handleCapture}
                      className="w-15 h-15 sm:w-18 sm:h-18 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-90 text-white flex items-center justify-center shadow-xl border-4 border-white transition touch-manipulation ring-4 ring-blue-500/40 cursor-pointer"
                      title="Ambil Foto"
                    >
                      <Camera className="w-7 h-7 sm:w-8 sm:h-8" />
                    </button>
                  )}

                  {capturedImage && (
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 text-white border border-white/25 backdrop-blur-md flex items-center gap-2 text-xs sm:text-sm font-bold active:scale-95 transition shadow-lg touch-manipulation cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-400" /> Foto Ulang
                    </button>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[10.5px] sm:text-[11px] text-slate-500 text-center">
              {capturedImage
                ? '✓ Foto tersimpan dan siap dikirim.'
                : 'Arahkan kamera ke wajah atau kondisi lab lalu tekan tombol shutter.'}
            </p>
          </div>

          {/* RIGHT: Input / Report & GPS */}
          <div className="space-y-4 sm:space-y-5 flex flex-col justify-between">
            <div className="space-y-3.5">
              {/* If Active: Laporan Inventaris Textarea */}
              {isSessionActive ? (
                <div className="rounded-3xl p-4 sm:p-6 bg-white border border-slate-200/90 shadow-xs space-y-3.5">
                  <label htmlFor="inputCatatan" className="block text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Laporan Kondisi & Inventaris Lab *
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                      Wajib Diisi
                    </span>
                  </label>
                  
                  <textarea
                    id="inputCatatan"
                    required
                    rows={3}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Contoh: 30 PC berfungsi normal, ruangan rapi dan bersih, AC dan lampu telah dimatikan."
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition resize-none leading-relaxed"
                  />

                  {/* Quick Preset Buttons - Horizontal Swipe Chips on Mobile */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Template Cepat (Geser & Tap):
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pe-4 -mx-0.5 px-0.5">
                      {quickTemplates.map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCatatan(tmpl)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 text-[11px] font-medium text-blue-700 border border-blue-200/80 transition whitespace-nowrap flex-shrink-0 touch-manipulation shadow-2xs cursor-pointer"
                        >
                          + {tmpl.split(',')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* GPS Geolocation Verification Badge (Hanya saat Masuk) */
                <LocationBadge
                  latitude={latitude}
                  longitude={longitude}
                  accuracy={accuracy}
                  locationString={locationString}
                  loading={gpsLoading}
                  error={gpsError}
                  onRefresh={refreshLocation}
                />
              )}
            </div>

            {/* Submit Action Button */}
            <div className="pt-1">
              {!isSessionActive ? (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 touch-manipulation min-h-[48px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{submitStep || 'Mencatat Presensi Masuk...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Presensi Masuk Piket</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-1.5">
                  <button
                    type="submit"
                    disabled={submitting || !isTimeUnlocked}
                    className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] min-h-[48px] touch-manipulation ${
                      isTimeUnlocked
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                        : 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>{submitStep || 'Mengirim Laporan...'}</span>
                      </>
                    ) : isTimeUnlocked ? (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Selesai Piket & Kirim Laporan</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-slate-500" />
                        <span>Durasi Belum 2 Jam (Sisa: {countdownString})</span>
                      </>
                    )}
                  </button>
                  {!isTimeUnlocked && (
                    <p className="text-[10.5px] sm:text-[11px] text-center text-amber-800 font-medium">
                      * Tombol checkout aktif otomatis setelah hitung mundur 2 jam selesai.
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </form>
    </div>
  );
}
