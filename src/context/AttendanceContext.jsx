import React, { createContext, useContext, useState, useEffect } from 'react';

const AttendanceContext = createContext(null);

export const DEFAULT_GAS_ENDPOINT = import.meta.env.VITE_GAS_API_URL || '';
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

  // Jadwal Piket Mingguan (Senin - Jumat)
  const [jadwalList, setJadwalList] = useState(() => {
    try {
      const saved = localStorage.getItem('ABSENSI_LOCAL_JADWAL');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingJadwal, setLoadingJadwal] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [jadwalError, setJadwalError] = useState(null);

  // Login handler connected directly to backend GAS API (status: "Login")
  const login = async (nim, pin) => {
    const cleanNim = (nim || '').trim();
    const cleanPin = (pin || '').trim();

    if (!cleanNim) {
      return { success: false, message: 'NIM wajib diisi.' };
    }
    if (!cleanPin) {
      return { success: false, message: 'Password wajib diisi.' };
    }

    if (!endpointUrl) {
      return { success: false, message: 'Endpoint Google Apps Script belum dikonfigurasi pada VITE_GAS_API_URL di berkas .env.' };
    }

    try {
      // Autentikasi online langsung ke Google Apps Script (Tab Master_Asisten)
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
        const accountData = {
          userId: json.data.userId || cleanNim,
          userName: json.data.userName || json.data.nama || cleanNim,
          nim: json.data.userId || cleanNim,
          nama: json.data.userName || json.data.nama || cleanNim,
          role: json.data.role || 'Asisten'
        };

        setUserAccount(accountData);
        localStorage.setItem('userAccount', JSON.stringify(accountData));
        localStorage.setItem('ABSENSI_USER_ID', accountData.userId);
        localStorage.setItem('ABSENSI_USER_NAME', accountData.userName);

        return { success: true, data: accountData };
      } else {
        return { success: false, message: json.message || 'NIM atau Password salah.' };
      }
    } catch (err) {
      return { success: false, message: 'Gagal terhubung ke Google Apps Script: ' + err.message };
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

  // Default fallback schedule matrix matching Google Spreadsheet "Jadwal Piket"
  const defaultJadwalData = [
    {
      hari: 'Senin',
      asisten: [
        { nama: 'Muhammad Afiq Jakhel', nim: '-', waktu: '08:00 - 16:00' },
        { nama: 'Anggun Meika Candra', nim: '-', waktu: '08:00 - 16:00' },
        { nama: 'Dhyva Aulia Hendri', nim: '-', waktu: '08:00 - 16:00' },
        { nama: 'Siti Aliani Husnah.F', nim: '-', waktu: '08:00 - 16:00' }
      ]
    },
    {
      hari: 'Selasa',
      asisten: [
        { nama: 'Fathiya Alzhafira', nim: '-', waktu: '08:00 - 16:00' },
        { nama: 'Farhan Fitrahadi', nim: '-', waktu: '08:00 - 16:00' },
        { nama: 'Ervizon Fariz', nim: '-', waktu: '08:00 - 16:00' },
        { nama: 'Martia Perdana Putri', nim: '-', waktu: '08:00 - 16:00' }
      ]
    },
    {
      hari: 'Rabu',
      asisten: [
        { nama: 'Muhammad Habib', nim: '2311522037', waktu: '08:00 - 16:00' },
        { nama: 'Laila Qadriyah', nim: '-', waktu: '08:00 - 16:00' },
        { nama: 'Revin Pahlevi', nim: '-', waktu: '08:00 - 16:00' },
        { nama: 'Varissa Anzani Badri', nim: '-', waktu: '08:00 - 16:00' }
      ]
    },
    {
      hari: 'Kamis',
      asisten: [
        { nama: 'Hafiz Muhammad Faqih', nim: '-', waktu: '08:00 - 16:00' },
        { nama: 'Mikail Samyth Habibillah', nim: '-', waktu: '08:00 - 16:00' },
        { nama: 'Putri Diva Riyanti', nim: '-', waktu: '08:00 - 16:00' },
        { nama: 'Ferdian Rahman', nim: '-', waktu: '08:00 - 16:00' }
      ]
    },
    {
      hari: 'Jumat',
      asisten: [
        { nama: 'Fachri Akbar', nim: '-', waktu: '08:00 - 16:00' },
        { nama: 'Kezia Valerina Damanik', nim: '-', waktu: '08:00 - 16:00' },
        { nama: 'Nayla Thahira Meldian', nim: '-', waktu: '08:00 - 16:00' },
        { nama: 'Rahil Akram Hammad', nim: '-', waktu: '08:00 - 16:00' }
      ]
    }
  ];

  // Helper to normalize dataJadwal from various GAS formats into standard array
  const normalizeJadwal = (raw) => {
    if (!raw) return defaultJadwalData;
    
    // 1. If raw is already an array of { hari, asisten }
    if (Array.isArray(raw) && raw.length > 0 && raw[0].hari) {
      return raw;
    }

    // 2. Exact GAS V6 Script Format: Array of row objects { id, senin, selasa, rabu, kamis, jumat }
    if (Array.isArray(raw) && raw.length > 0 && (raw[0].senin !== undefined || raw[0].selasa !== undefined || raw[0].rabu !== undefined)) {
      const daysMap = {
        'Senin': [],
        'Selasa': [],
        'Rabu': [],
        'Kamis': [],
        'Jumat': []
      };

      raw.forEach(row => {
        ['senin', 'selasa', 'rabu', 'kamis', 'jumat'].forEach(dayKey => {
          const val = (row[dayKey] || '').toString().trim();
          if (val && val !== '-' && val !== '') {
            const formattedDay = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
            daysMap[formattedDay].push({
              nama: val,
              nim: '-',
              waktu: '08:00 - 16:00'
            });
          }
        });
      });

      return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map(day => ({
        hari: day,
        asisten: daysMap[day]
      }));
    }

    // 3. If raw is an object mapping days: { Senin: [...], Selasa: [...] }
    if (typeof raw === 'object' && !Array.isArray(raw)) {
      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
      return days.map(day => ({
        hari: day,
        asisten: Array.isArray(raw[day]) 
          ? raw[day].map(item => typeof item === 'string' ? { nama: item, nim: '-', waktu: '08:00 - 16:00' } : item)
          : []
      }));
    }

    return defaultJadwalData;
  };

  // Fetch Jadwal Piket from GAS GET endpoint (requires ?nim= parameter per GAS V6 doGet)
  const fetchJadwal = async (targetNim = null) => {
    setLoadingJadwal(true);
    setJadwalError(null);
    try {
      const effectiveNim = targetNim || userAccount?.userId || '';
      const queryParam = effectiveNim ? `?nim=${encodeURIComponent(effectiveNim)}` : '';
      if (!queryParam) {
        if (!jadwalList) setJadwalList(defaultJadwalData);
        return;
      }
      const res = await fetch(`${endpointUrl}${queryParam}`, { method: 'GET' });
      const json = await res.json();
      if (json.status === 'success' && json.dataJadwal) {
        const normalized = normalizeJadwal(json.dataJadwal);
        setJadwalList(normalized);
        localStorage.setItem('ABSENSI_LOCAL_JADWAL', JSON.stringify(normalized));
      } else if (!jadwalList) {
        setJadwalList(defaultJadwalData);
      }
    } catch (err) {
      setJadwalError('Gagal memuat data jadwal: ' + err.message);
      if (!jadwalList) {
        setJadwalList(defaultJadwalData);
      }
    } finally {
      setLoadingJadwal(false);
    }
  };

  // Fetch History from GAS doGet endpoint with NIM parameter support (Handles dataAbsensi, dataIzin, dataJadwal)
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
        
        // Normalize dataIzin fields from GAS V5/V6 format
        const rawIzin = Array.isArray(json.dataIzin) ? json.dataIzin : [];
        const izinList = rawIzin.map(item => ({
          ...item,
          tanggalIzin: item.tglBerhalangan || item.tanggalIzin || '-',
          tanggalPengganti: item.tglPengganti || item.tanggalPengganti || '-',
          statusPersetujuan: item.statusApproval || item.statusPersetujuan || item.status || 'Menunggu Persetujuan',
          status: item.statusApproval || item.statusPersetujuan || item.status || 'Menunggu Persetujuan',
          timestamp: item.waktuPengajuan || item.timestamp || '-'
        }));

        setHistory(absensiList);
        setIzinHistory(izinList);

        if (json.dataJadwal) {
          const normalized = normalizeJadwal(json.dataJadwal);
          setJadwalList(normalized);
          localStorage.setItem('ABSENSI_LOCAL_JADWAL', JSON.stringify(normalized));
        }

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
        jadwalList: jadwalList || defaultJadwalData,
        loadingHistory,
        loadingJadwal,
        historyError,
        jadwalError,
        fetchHistory,
        fetchJadwal,
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

