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
  MapPin
} from 'lucide-react';
import { useAttendance, REQUIRED_PIKET_DURATION_MS } from '../context/AttendanceContext';
import { useGeolocation } from '../hooks/useGeolocation';
import LocationBadge from '../components/LocationBadge';

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

  // GPS Geolocation Hook (Only needed for Clock-In)
  const isSessionActive = Boolean(piketSession);
  const { latitude, longitude, accuracy, locationString, loading: gpsLoading, error: gpsError, refreshLocation } = useGeolocation(!isSessionActive);

  // Countdown Engine Effect
  useEffect(() => {
    if (!piketSession || !piketSession.startTime) return;

    const calculateTimer = () => {
      const now = Date.now();
      const elapsed = now - piketSession.startTime;
      const remaining = Math.max(0, REQUIRED_PIKET_DURATION_MS - elapsed);
      setRemainingTimeMs(remaining);

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      const pad = (n) => String(n).padStart(2, '0');
      setCountdownString(`${pad(hours)}j ${pad(minutes)}m ${pad(seconds)}d`);

      const elapsedHours = Math.floor(elapsed / (1000 * 60 * 60));
      const elapsedMins = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
      setElapsedString(`${elapsedHours} jam ${elapsedMins} menit`);
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

    const imageSrc = webcamRef.current.getScreenshot({ width: 1080, height: 810 });
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
    setSubmitStep('Memproses foto & mengirim presensi...');

    try {
      const base64Data = capturedImage.includes(',')
        ? capturedImage.split(',')[1]
        : capturedImage;

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
          previewUrl: capturedImage
        };
      } else {
        payload = {
          userId: cleanId,
          status: 'Keluar',
          catatan: catatan.trim(),
          imageBytes: base64Data,
          imageName: `Piket_Keluar_${cleanId}_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          previewUrl: capturedImage
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
    <div className="max-w-4xl mx-auto w-full space-y-4 pb-20 animate-fadeIn">
      {/* 1. Header Navigation & Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {isSessionActive ? 'Checkout Piket & Laporan' : 'Presensi Piket Masuk'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSessionActive
              ? 'Wajib durasi piket 2 jam dan melengkapi laporan inventaris lab'
              : `Presensi piket atas nama ${userName} (${userId})`}
          </p>
        </div>

        {isSessionActive && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Sedang Piket
          </span>
        )}
      </div>

      {/* 2. Error & Time Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs md:text-sm flex items-start gap-3 animate-shake shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block text-rose-950 mb-0.5">Pemberitahuan Sistem:</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Active Session Info & Countdown Card */}
      {isSessionActive && (
        <div className="rounded-2xl p-4 md:p-5 bg-amber-50 border border-amber-300 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sesi Piket Aktif</h3>
                <p className="text-xs text-slate-600">
                  Mulai Masuk: <span className="text-slate-900 font-mono font-semibold">{formatStartTime(piketSession.startTime)}</span> • Durasi: <span className="text-blue-700 font-bold">{elapsedString}</span>
                </p>
              </div>
            </div>

            {/* Countdown Badge */}
            <div
              className={`self-start sm:self-auto px-4 py-2 rounded-xl font-mono text-xs md:text-sm font-bold flex items-center gap-2 shadow-sm ${
                isTimeUnlocked
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-200/80 text-amber-950 border border-amber-300'
              }`}
            >
              {isTimeUnlocked ? <Unlock className="w-4 h-4 text-emerald-700" /> : <Lock className="w-4 h-4 text-amber-800" />}
              <span>{isTimeUnlocked ? '2 Jam Tercapai (Siap Kirim)' : countdownString}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Camera & Form Grid */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* LEFT: Camera Viewport */}
          <div className="rounded-2xl p-4 bg-white border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs md:text-sm mb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" />
                  {isSessionActive ? 'Foto Bukti Kondisi Lab' : 'Foto Selfie Kehadiran'}
                </span>
                <span className="text-xs text-rose-600 font-semibold">*Wajib Foto</span>
              </div>

              {/* Camera Frame */}
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-300 flex items-center justify-center">
                {isFlashing && (
                  <div className="absolute inset-0 bg-white z-20 pointer-events-none opacity-90 transition-opacity duration-300" />
                )}

                {cameraError ? (
                  <div className="p-4 text-center space-y-2 text-white">
                    <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
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
                      videoConstraints={videoConstraints}
                      onUserMedia={() => setCameraReady(true)}
                      onUserMediaError={(err) => {
                        setCameraError('Gagal mengakses kamera. Izinkan akses kamera pada browser Anda.');
                      }}
                      className="w-full h-full object-cover"
                    />

                    {!cameraReady && (
                      <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <span className="text-xs">Menyiapkan kamera...</span>
                      </div>
                    )}
                  </>
                )}

                {/* Floating Camera Actions */}
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 z-10">
                  {!capturedImage && cameraReady && (
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      className="p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur border border-white/20 transition active:scale-95 shadow-md"
                      title="Ganti Kamera Depan/Belakang"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  )}

                  {!capturedImage && cameraReady && (
                    <button
                      type="button"
                      onClick={handleCapture}
                      className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-lg border-2 border-white transition"
                      title="Ambil Foto"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  )}

                  {capturedImage && (
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 backdrop-blur flex items-center gap-1.5 text-xs font-bold active:scale-95 transition shadow-md"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" /> Foto Ulang
                    </button>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              {capturedImage
                ? 'Foto berhasil diambil dan siap dikirim.'
                : 'Arahkan wajah atau ruangan lab ke kamera lalu tekan tombol foto.'}
            </p>
          </div>

          {/* RIGHT: Input / Report & GPS */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* If Active: Laporan Inventaris Textarea */}
              {isSessionActive ? (
                <div className="rounded-2xl p-4 bg-white border border-slate-200 shadow-sm space-y-2">
                  <label htmlFor="inputCatatan" className="block text-xs md:text-sm font-bold text-slate-800 flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Laporan Kondisi & Inventaris Lab *
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                      Wajib Diisi
                    </span>
                  </label>
                  <textarea
                    id="inputCatatan"
                    required
                    rows={4}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Contoh: 30 PC berfungsi normal, ruangan rapi dan bersih, AC dan lampu telah dimatikan."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs md:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition resize-none"
                  />
                  <p className="text-[11px] text-slate-400">
                    Laporkan status perangkat, kebersihan, dan kondisi penutupan lab.
                  </p>
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
            <div>
              {!isSessionActive ? (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs md:text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50"
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
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs md:text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] ${
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
                    <p className="text-[11px] text-center text-amber-800 font-medium">
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
