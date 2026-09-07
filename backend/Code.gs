/**
 * Google Apps Script - Backend Sistem Absensi Web Serverless (Edisi Piket Lab LSD - V2)
 * 
 * Arsitektur Database:
 * 1. Tab 'Log_Absensi':
 *    - Col A (0): Waktu Masuk
 *    - Col B (1): NIM
 *    - Col C (2): Nama
 *    - Col D (3): Status ("Hadir Piket", "Selesai Piket", "Alpa")
 *    - Col E (4): Lokasi GPS
 *    - Col F (5): Link Foto Masuk
 *    - Col G (6): Waktu Keluar
 *    - Col H (7): Link Foto Keluar
 *    - Col I (8): Catatan / Laporan Kegiatan
 * 2. Tab 'Jadwal_Piket':
 *    - Matriks jadwal mingguan (Senin - Jumat) daftar asisten piket.
 * 
 * Aturan Bisnis & Validasi:
 * - Batas Masuk: Maksimal pukul 14:00 WIB (Operasional lab selesai 16:00 WIB).
 * - Batas Keluar: Wajib minimal 2 jam durasi piket sejak waktu masuk.
 * - Single-row update: Absen keluar memperbarui baris masuk yang sama (tidak membuat baris duplikat).
 * - Cron Job: Fungsi cekAlpaHarian() mencatat status "Alpa" otomatis bagi yang tidak hadir.
 */

// Konfigurasi ID Folder Google Drive
const DRIVE_FOLDER_ID = "1f593-usQRp4U3keML9f2ZQP_soI5FPe1";
const SHEET_LOG_NAME = "Log_Absensi";
const SHEET_JADWAL_NAME = "Jadwal_Piket";
const REQUIRED_DURATION_MS = 2 * 60 * 60 * 1000; // 2 Jam (7.200.000 ms)

/**
 * Handle HTTP POST Request
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(10000);

  if (!hasLock) {
    return createJsonResponse({
      status: "error",
      message: "Server sedang sibuk memproses antrean data. Silakan coba beberapa detik lagi."
    });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Payload data JSON tidak ditemukan.");
    }

    const data = JSON.parse(e.postData.contents);
    const userId = (data.userId || data.nim || "").toString().trim();
    const userName = (data.userName || data.nama || "").toString().trim();
    const status = (data.status || "Masuk").toString().trim();
    const catatan = (data.catatan || "-").toString().trim();
    const location = (data.location || "Lokasi Tidak Diketahui").toString().trim();
    const imageBytes = data.imageBytes || "";
    const mimeType = data.mimeType || "image/jpeg";
    const imageName = data.imageName || `Piket_${status}_${userId}_${new Date().getTime()}.jpg`;

    if (!userId) {
      throw new Error("NIM / ID Asisten wajib diisi.");
    }

    const now = new Date();
    const timeZone = Session.getScriptTimeZone() || "GMT+7";
    const formattedNow = Utilities.formatDate(now, timeZone, "yyyy-MM-dd HH:mm:ss");

    // Inisialisasi Database Spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(SHEET_LOG_NAME);
    if (!logSheet) {
      logSheet = ss.insertSheet(SHEET_LOG_NAME);
    }

    // Inisialisasi Header Tabel jika sheet baru
    if (logSheet.getLastRow() === 0) {
      logSheet.appendRow([
        "Waktu Masuk",
        "NIM",
        "Nama",
        "Status",
        "Koordinat GPS",
        "Link Foto Masuk",
        "Waktu Keluar",
        "Link Foto Keluar",
        "Catatan Kegiatan"
      ]);
      const headerRange = logSheet.getRange(1, 1, 1, 9);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#2563EB");
      headerRange.setFontColor("#FFFFFF");
    }

    // -------------------------------------------------------------
    // ATURAN 1: ABSEN MASUK
    // -------------------------------------------------------------
    if (status === "Masuk") {
      if (!userName) {
        throw new Error("Nama asisten wajib dipilih dari master data.");
      }

      // Validasi Batas Waktu Masuk: Maksimal Pukul 14:00 WIB
      const currentHour = parseInt(Utilities.formatDate(now, timeZone, "HH"), 10);
      const currentMinute = parseInt(Utilities.formatDate(now, timeZone, "mm"), 10);
      
      // Jika jam > 14 atau (jam == 14 dan menit > 0)
      if (currentHour > 14 || (currentHour === 14 && currentMinute > 0)) {
        return createJsonResponse({
          status: "error",
          message: "Batas waktu presensi masuk telah berakhir (maksimal pukul 14:00 WIB). Operasional lab selesai pukul 16:00 WIB sehingga kewajiban durasi 2 jam tidak dapat terpenuhi."
        });
      }

      // Simpan Foto Masuk ke Google Drive
      let photoUrl = "-";
      if (imageBytes) {
        photoUrl = saveImageToDrive(imageBytes, mimeType, imageName);
      }

      // Tulis Baris Baru ke Log_Absensi
      logSheet.appendRow([
        formattedNow,
        userId,
        userName,
        "Hadir Piket",
        location,
        photoUrl,
        "-", // Waktu Keluar kosong
        "-", // Foto Keluar kosong
        catatan // Catatan awal
      ]);

      return createJsonResponse({
        status: "success",
        message: "Presensi masuk piket berhasil dicatat!",
        data: {
          timestamp: formattedNow,
          userId: userId,
          userName: userName,
          status: "Hadir Piket",
          location: location,
          photoUrl: photoUrl
        }
      });
    }

    // -------------------------------------------------------------
    // ATURAN 2: ABSEN KELUAR (Single-Row Update & Validasi 2 Jam)
    // -------------------------------------------------------------
    if (status === "Keluar") {
      const lastRow = logSheet.getLastRow();
      if (lastRow <= 1) {
        throw new Error("Tidak ditemukan catatan sesi masuk yang aktif untuk NIM ini.");
      }

      const values = logSheet.getRange(2, 1, lastRow - 1, 9).getValues();
      let targetRowIndex = -1;
      let startTimeDate = null;
      let matchedName = userName;

      // Cari dari baris terbaru ke atas (rekaman sesi masuk aktif yang belum checkout)
      for (let i = values.length - 1; i >= 0; i--) {
        const row = values[i];
        const rowNim = row[1] ? row[1].toString().trim() : "";
        const rowWaktuKeluar = row[6] ? row[6].toString().trim() : "";

        if (rowNim === userId && (rowWaktuKeluar === "-" || rowWaktuKeluar === "")) {
          targetRowIndex = i + 2; // Offset header dan 1-indexed
          startTimeDate = new Date(row[0]);
          matchedName = row[2] ? row[2].toString().trim() : userName;
          break;
        }
      }

      if (targetRowIndex === -1 || !startTimeDate || isNaN(startTimeDate.getTime())) {
        throw new Error("Sesi piket aktif untuk NIM " + userId + " tidak ditemukan. Harap pastikan Anda telah melakukan absen masuk terlebih dahulu.");
      }

      // Validasi Durasi Piket Minimal 2 Jam
      const elapsedMs = now.getTime() - startTimeDate.getTime();
      if (elapsedMs < REQUIRED_DURATION_MS) {
        const remainingMinutes = Math.ceil((REQUIRED_DURATION_MS - elapsedMs) / (60 * 1000));
        return createJsonResponse({
          status: "error",
          message: "Durasi piket wajib minimal 2 jam belum terpenuhi. Sisa waktu wajib: " + remainingMinutes + " menit lagi."
        });
      }

      // Simpan Foto Keluar ke Google Drive
      let photoUrlKeluar = "-";
      if (imageBytes) {
        photoUrlKeluar = saveImageToDrive(imageBytes, mimeType, imageName);
      }

      // Perbarui Baris Sesi yang sama (Update Kolom Status, Waktu Keluar, Foto Keluar, Catatan)
      logSheet.getRange(targetRowIndex, 4).setValue("Selesai Piket");
      logSheet.getRange(targetRowIndex, 7).setValue(formattedNow);
      logSheet.getRange(targetRowIndex, 8).setValue(photoUrlKeluar);
      logSheet.getRange(targetRowIndex, 9).setValue(catatan);

      return createJsonResponse({
        status: "success",
        message: "Piket selesai dan laporan kondisi lab berhasil dikirim!",
        data: {
          timestamp: formattedNow,
          userId: userId,
          userName: matchedName,
          status: "Selesai Piket",
          catatan: catatan,
          photoUrl: photoUrlKeluar
        }
      });
    }

    throw new Error("Status presensi tidak valid: " + status);

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.message || "Terjadi kesalahan pada server."
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper untuk menyimpan file foto Base64 ke Google Drive
 */
function saveImageToDrive(imageBytes, mimeType, imageName) {
  try {
    const decodedImage = Utilities.base64Decode(imageBytes);
    const blob = Utilities.newBlob(decodedImage, mimeType, imageName);
    
    let folder;
    if (DRIVE_FOLDER_ID && DRIVE_FOLDER_ID.trim() !== "" && !DRIVE_FOLDER_ID.includes("PASTE_FOLDER_ID")) {
      try {
        folder = DriveApp.getFolderById(DRIVE_FOLDER_ID.trim());
      } catch (e) {
        folder = getOrCreateDefaultFolder();
      }
    } else {
      folder = getOrCreateDefaultFolder();
    }

    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    return "Gagal Simpan Foto: " + err.message;
  }
}

function getOrCreateDefaultFolder() {
  const folders = DriveApp.getFoldersByName("Absensi_Lab_Photos");
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder("Absensi_Lab_Photos");
  }
}

/**
 * Handle HTTP GET Request
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return createJsonResponse({
        status: "online",
        message: "Google Apps Script Backend is running.",
        data: []
      });
    }

    const logSheet = ss.getSheetByName(SHEET_LOG_NAME) || ss.getSheets()[0];
    const lastRow = logSheet.getLastRow();

    if (lastRow <= 1) {
      return createJsonResponse({
        status: "success",
        message: "Belum ada catatan absensi.",
        data: []
      });
    }

    const numCols = Math.max(logSheet.getLastColumn(), 9);
    const values = logSheet.getRange(2, 1, lastRow - 1, numCols).getValues();

    const records = values.map((row, index) => {
      let tsMasuk = row[0];
      if (tsMasuk instanceof Date) {
        tsMasuk = Utilities.formatDate(tsMasuk, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd HH:mm:ss");
      }
      let tsKeluar = row[6];
      if (tsKeluar instanceof Date) {
        tsKeluar = Utilities.formatDate(tsKeluar, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd HH:mm:ss");
      }

      return {
        id: index + 1,
        timestamp: tsMasuk ? tsMasuk.toString() : "",
        waktuMasuk: tsMasuk ? tsMasuk.toString() : "",
        userId: row[1] ? row[1].toString() : "",
        userName: row[2] ? row[2].toString() : "",
        status: row[3] ? row[3].toString() : "Hadir",
        location: row[4] ? row[4].toString() : "-",
        photoUrl: row[5] ? row[5].toString() : "-",
        waktuKeluar: tsKeluar ? tsKeluar.toString() : "-",
        photoUrlKeluar: row[7] ? row[7].toString() : "-",
        catatan: row[8] ? row[8].toString() : ""
      };
    }).reverse();

    return createJsonResponse({
      status: "success",
      total: records.length,
      data: records
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: "Gagal membaca riwayat: " + error.message,
      data: []
    });
  }
}

/**
 * Automasi Audit Alpa Harian (Time-driven Trigger Cron Job)
 * Jalankan terjadwal setiap hari pada pukul 17:00 - 18:00 WIB
 */
function cekAlpaHarian() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(SHEET_LOG_NAME);
  const jadwalSheet = ss.getSheetByName(SHEET_JADWAL_NAME);

  if (!logSheet || !jadwalSheet) return;

  const now = new Date();
  const timeZone = Session.getScriptTimeZone() || "GMT+7";
  const todayStr = Utilities.formatDate(now, timeZone, "yyyy-MM-dd");
  const dayName = Utilities.formatDate(now, timeZone, "EEEE"); // e.g. "Monday"

  // Peta hari bahasa Indonesia
  const mapHari = {
    "Monday": 1,
    "Tuesday": 2,
    "Wednesday": 3,
    "Thursday": 4,
    "Friday": 5
  };

  const colIndex = mapHari[dayName];
  if (!colIndex) return; // Akhir pekan (Sabtu/Minggu) tidak ada piket wajib

  // Baca daftar asisten yang dijadwalkan piket hari ini dari tab Jadwal_Piket
  const jadwalValues = jadwalSheet.getRange(2, colIndex, Math.max(jadwalSheet.getLastRow() - 1, 1), 1).getValues();
  const asistenJadwal = jadwalValues.map(r => r[0].toString().trim()).filter(Boolean);

  // Baca siapa saja yang sudah absen masuk hari ini dari tab Log_Absensi
  const logLastRow = logSheet.getLastRow();
  const hadirHariIni = new Set();

  if (logLastRow > 1) {
    const logValues = logSheet.getRange(2, 1, logLastRow - 1, 3).getValues();
    logValues.forEach(row => {
      const rowDateStr = row[0] instanceof Date
        ? Utilities.formatDate(row[0], timeZone, "yyyy-MM-dd")
        : (row[0] || "").toString().slice(0, 10);

      if (rowDateStr === todayStr) {
        hadirHariIni.add(row[2].toString().trim().toLowerCase()); // Nama asisten
      }
    });
  }

  // Rekam status "Alpa" untuk asisten yang terjadwal namun tidak absen masuk
  asistenJadwal.forEach(nama => {
    if (!hadirHariIni.has(nama.toLowerCase())) {
      logSheet.appendRow([
        todayStr + " 17:00:00",
        "-",
        nama,
        "Alpa (Tidak Hadir)",
        "-",
        "-",
        "-",
        "-",
        "Otomatis oleh Sistem Audit Alpa Harian"
      ]);
    }
  });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

