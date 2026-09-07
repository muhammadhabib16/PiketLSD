import React, { createContext, useContext, useState, useEffect } from 'react';
import { DATA_ASISTEN } from '../dataAsisten';

const AttendanceContext = createContext(null);

export const DEFAULT_GAS_ENDPOINT = import.meta.env.VITE_GAS_API_URL || 'https://script.google.com/macros/s/AKfycbyRIu-ErPECyZjOpRh6ZwN-V8jDw9bVqr5RCMJ_RZZLZ8TLcYd3h61IP2I0Qh-1AZcB/exec';
export const REQUIRED_PIKET_DURATION_MS = 2 * 60 * 60 * 1000; // 2 Jam (7.200.000 ms)

export function AttendanceProvider({ children }) {
  // Endpoint URL configuration strictly sourced from Environment Variable (VITE_GAS_API_URL)
  const endpointUrl = import.meta.env.VITE_GAS_API_URL || DEFAULT_GAS_ENDPOINT;

  // Authenticated User Account (Persisted in LocalStorage)
  const [userAccount, setUserAccount] = useState(() => {
    try {
      const saved = localStorage.getItem('userAccount');
      if (saved) return JSON.parse(saved);
      // Backwards compatibility check
      const oldId = localStorage.getItem('ABSENSI_USER_ID');
      const oldName = localStorage.getItem('ABSENSI_USER_NAME');
      if (oldId && oldName) {
        const account = { userId: oldId, userName: oldName, nim: oldId, nama: oldName };
        localStorage.setItem('userAccount', JSON.stringify(account));
        return account;
      }
      return null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = Boolean(userAccount && userAccount.userId);

  // Piket Session (Persistent State in LocalStorage)
  const [piketSession, setPiketSession] = useState(() => {
    try {
      const saved = localStorage.getItem('piketSession');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Last Result
  const [lastResult, setLastResult] = useState(() => {
    try {
      const saved = localStorage.getItem('ABSENSI_LAST_RESULT');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // History list (Personal & Global Absensi)
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('ABSENSI_LOCAL_HISTORY');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Izin History list (Personal & Global Log_Izin)
  const [izinHistory, setIzinHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('ABSENSI_LOCAL_IZIN');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Login handler connected directly to backend GAS API (status: "Login") & Master Data
  const login = async (nim, pin) => {
    const cleanNim = (nim || '').trim();
    const cleanPin = (pin || '').trim();

    if (!cleanNim) {
      return { success: false, message: 'NIM wajib diisi.' };
    }
    if (!cleanPin) {
      return { success: false, message: 'Password/PIN wajib diisi.' };
    }

    try {
      // 1. Coba autentikasi online langsung ke Google Apps Script (Tab Master_Asisten Kolom F)
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          status: 'Login',
          userId: cleanNim,
          nim: cleanNim,
          password: cleanPin
        })
      });

      const json = await res.json();

      if (json.status === 'success' && json.data) {
        // Resolve assistant role
        const matchedLocal = DATA_ASISTEN.find(a => a.nim.toString().trim() === cleanNim);
        const resolvedRole = json.data.role || matchedLocal?.role || (cleanNim === '2311522037' ? 'Admin' : 'Asisten');

        const accountData = {
          userId: json.data.userId || cleanNim,
          userName: json.data.userName,
          nim: json.data.userId || cleanNim,
          nama: json.data.userName,
          role: resolvedRole
        };

        setUserAccount(accountData);
        localStorage.setItem('userAccount', JSON.stringify(accountData));
        localStorage.setItem('ABSENSI_USER_ID', accountData.userId);
        localStorage.setItem('ABSENSI_USER_NAME', accountData.userName);

        return { success: true, data: accountData };
      } else if (json.status === 'error') {
        return { success: false, message: json.message || 'NIM atau Password salah.' };
      }
    } catch (err) {
      // 2. Fallback offline: Cocokkan terhadap Master Data lokal jika koneksi ke GAS offline
      const assistant = DATA_ASISTEN.find(
        (a) => a.nim.toString().trim() === cleanNim
      );

      if (!assistant) {
        return { success: false, message: 'NIM tidak ditemukan di tabel Master Data Asisten.' };
      }

      const masterPassword = (assistant.password || assistant.pin || '').toString().trim();
      if (cleanPin !== masterPassword) {
        return { success: false, message: 'Password yang dimasukkan tidak sesuai dengan data di Master Asisten.' };
      }

      const accountData = {
        userId: assistant.nim,
        userName: assistant.nama,
        nim: assistant.nim,
        nama: assistant.nama,
        role: assistant.role || (assistant.nim === '2311522037' ? 'Admin' : 'Asisten')
      };

      setUserAccount(accountData);
      localStorage.setItem('userAccount', JSON.stringify(accountData));
      localStorage.setItem('ABSENSI_USER_ID', assistant.nim);
      localStorage.setItem('ABSENSI_USER_NAME', assistant.nama);

      return { success: true, data: accountData };
    }
  };

  // Logout handler
  const logout = () => {
    setUserAccount(null);
    localStorage.removeItem('userAccount');
    localStorage.removeItem('ABSENSI_USER_ID');
    localStorage.removeItem('ABSENSI_USER_NAME');
  };

  // Start Piket Session
  const startPiketSession = (sessionData) => {
    const session = {
      userId: sessionData.userId || userAccount?.userId,
      userName: sessionData.userName || userAccount?.userName,
      startTime: sessionData.startTime || Date.now(),
      startLocation: sessionData.location || '',
      startPhotoUrl: sessionData.photoUrl || '',
      status: 'SEDANG_PIKET'
    };
    setPiketSession(session);
    localStorage.setItem('piketSession', JSON.stringify(session));
  };

  // End Piket Session (Cleanup)
  const endPiketSession = () => {
    setPiketSession(null);
    localStorage.removeItem('piketSession');
  };

  // Fast Forward Session for testing (Sets start time to 2 hours ago)
  const fastForwardSession = () => {
    if (!piketSession) return;
    const updated = {
      ...piketSession,
      startTime: Date.now() - REQUIRED_PIKET_DURATION_MS - 5000 // 2 hours + 5 seconds ago
    };
    setPiketSession(updated);
    localStorage.setItem('piketSession', JSON.stringify(updated));
  };

  // Submit Attendance to GAS
  const submitAttendance = async (payload) => {
    const currentId = payload.userId || userAccount?.userId || '';
    const currentName = payload.userName || userAccount?.userName || '';

    const body = {
      userId: currentId,
      nim: currentId,
      userName: currentName,
      nama: currentName,
      status: payload.status || 'Masuk', // "Masuk" atau "Keluar"
      catatan: payload.catatan || '',
      location: payload.location || 'Lokasi Tidak Diketahui',
      imageBytes: payload.imageBytes || '',
      mimeType: payload.mimeType || 'image/jpeg',
      imageName: `Absen_${payload.status || 'Piket'}_${currentId}_${Date.now()}.jpg`
    };

    try {
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });

      const json = await res.json();

      if (json.status === 'success') {
        const resultData = {
          userId: currentId,
          userName: currentName,
          status: payload.status,
          catatan: payload.catatan || '',
          location: payload.location,
          timestamp: json.data?.timestamp || new Date().toLocaleString('id-ID'),
          photoUrl: json.data?.photoUrl || payload.previewUrl || '',
          previewUrl: payload.previewUrl || ''
        };

        setLastResult(resultData);
        localStorage.setItem('ABSENSI_LAST_RESULT', JSON.stringify(resultData));

        if (payload.status === 'Masuk') {
          // Initialize active session
          startPiketSession({
            userId: currentId,
            userName: currentName,
            startTime: Date.now(),
            location: payload.location,
            photoUrl: resultData.photoUrl
          });
        } else if (payload.status === 'Keluar') {
          // Cleanup session on Clock-Out
          endPiketSession();
        }

        // Update local history cache
        setHistory((prev) => {
          const updated = [resultData, ...prev.filter(item => item.timestamp !== resultData.timestamp)];
          localStorage.setItem('ABSENSI_LOCAL_HISTORY', JSON.stringify(updated.slice(0, 30)));
          return updated;
        });

        return { success: true, data: resultData };
      } else {
        return { success: false, message: json.message || 'Gagal memproses data di server.' };
      }
    } catch (err) {
      return { success: false, message: 'Gagal terhubung ke Google Apps Script: ' + err.message };
    }
  };

  // Submit Izin / Tukar Jadwal to GAS
  const submitIzin = async (payload) => {
    const currentId = payload.userId || userAccount?.userId || '';
    const currentName = payload.userName || userAccount?.userName || '';

    const body = {
      userId: currentId,
      nim: currentId,
      userName: currentName,
      nama: currentName,
      status: 'Izin',
      tanggalIzin: payload.tanggalIzin,
      tanggalPengganti: payload.tanggalPengganti,
      alasan: payload.alasan || ''
    };

    try {
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });

      const json = await res.json();

      if (json.status === 'success') {
        // Refresh history to include the new submission
        if (currentId) {
          fetchHistory(currentId);
        }
        return { 
          success: true, 
          message: json.message || 'Pengajuan Tukar Piket berhasil dicatat sistem.' 
        };
      } else {
        return { 
          success: false, 
          message: json.message || 'Gagal mengajukan izin ke server.' 
        };
      }
    } catch (err) {
      return { 
        success: false, 
        message: 'Gagal terhubung ke Google Apps Script: ' + err.message 
      };
    }
  };

  // Fetch History from GAS doGet endpoint with NIM parameter support (Handles dataAbsensi & dataIzin)
  const fetchHistory = async (targetNim = null) => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const effectiveNim = targetNim || userAccount?.userId || '';
      const queryParam = effectiveNim ? `?nim=${encodeURIComponent(effectiveNim)}` : '';
      const res = await fetch(`${endpointUrl}${queryParam}`, {
        method: 'GET'
      });
      const json = await res.json();
      if (json.status === 'success') {
        const absensiList = Array.isArray(json.dataAbsensi)
          ? json.dataAbsensi
          : Array.isArray(json.data)
          ? json.data
          : [];
        const izinList = Array.isArray(json.dataIzin) ? json.dataIzin : [];

        setHistory(absensiList);
        setIzinHistory(izinList);

        localStorage.setItem('ABSENSI_LOCAL_HISTORY', JSON.stringify(absensiList.slice(0, 50)));
        localStorage.setItem('ABSENSI_LOCAL_IZIN', JSON.stringify(izinList.slice(0, 50)));
      } else {
        setHistoryError(json.message || 'Gagal memuat riwayat.');
      }
    } catch (err) {
      setHistoryError('Tidak dapat menarik data realtime: ' + err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle Multi-tier Leave Approval for Admin (POST { status: "UpdateIzin", userId, rowId, keputusan })
  const updateApprovalIzin = async ({ rowId, keputusan, userId = null }) => {
    try {
      const adminId = userId || userAccount?.userId || '';
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          status: 'UpdateIzin',
          userId: adminId,
          rowId: rowId,
          keputusan: keputusan
        })
      });

      const json = await res.json();
      if (json.status === 'success') {
        // Optimistically update local izin list
        setIzinHistory((prev) =>
          prev.map((item) =>
            item.rowId === rowId || item.id === rowId
              ? { ...item, statusPersetujuan: keputusan, status: keputusan }
              : item
          )
        );
        return { success: true, message: json.message || `Status pengajuan berhasil diubah menjadi ${keputusan}.` };
      } else {
        return { success: false, message: json.message || 'Gagal memperbarui status pengajuan izin.' };
      }
    } catch (err) {
      return { success: false, message: 'Gagal terhubung ke Google Apps Script: ' + err.message };
    }
  };

  return (
    <AttendanceContext.Provider
      value={{
        endpointUrl,
        userAccount,
        isAuthenticated,
        login,
        logout,
        piketSession,
        startPiketSession,
        endPiketSession,
        fastForwardSession,
        lastResult,
        submitAttendance,
        submitIzin,
        history,
        izinHistory,
        loadingHistory,
        historyError,
        fetchHistory,
        updateApprovalIzin
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}

