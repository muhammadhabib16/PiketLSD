/**
 * SISTEM ABSENSI & MANAJEMEN PIKET LSD (V8 - ENTERPRISE SECURITY, ROBUST CACHE & AUDIT ENGINE)
 * Fitur: RBAC (Admin & Asisten), Sesi Piket 2 Jam, Validasi Foto Drive, Audit Alpa Otomatis, Cache Invalidation
 */

// ======================================================================
// HELPER UTILITIES: SANITASI STRING, NIM & FORMAT TANGGAL
// ======================================================================

function cleanNimHelper(str) {
  return str ? String(str).replace(/[^a-zA-Z0-9]/g, '').trim() : '';
}

function formatCellDateTime(val, timezone) {
  if (!val) return "-";
  if (val instanceof Date) {
    return Utilities.formatDate(val, timezone, "yyyy-MM-dd HH:mm:ss");
  }
  var str = String(val).trim();
  return str === "" ? "-" : str;
}

function formatCellDateOnly(val, timezone) {
  if (!val) return "-";
  if (val instanceof Date) {
    return Utilities.formatDate(val, timezone, "yyyy-MM-dd");
  }
  var str = String(val).trim();
  var match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  try {
    var d = new Date(str.replace(/-/g, '/'));
    if (!isNaN(d.getTime())) {
      return Utilities.formatDate(d, timezone, "yyyy-MM-dd");
    }
  } catch(e) {}
  return str === "" ? "-" : str;
}

function invalidateCacheHelper(cache, ss, targetNim) {
  if (!cache) return;
  try {
    if (targetNim) {
      cache.remove("LSD_DATA_" + cleanNimHelper(targetNim));
    }
    // Invalidasi semua cache akun Admin agar Dasbor Admin selalu real-time
    var sheetMaster = ss ? ss.getSheetByName("Master_Asisten") : null;
    if (sheetMaster && sheetMaster.getLastRow() > 1) {
      var masterValues = sheetMaster.getDataRange().getValues();
      for (var a = 1; a < masterValues.length; a++) {
        var role = masterValues[a][6] ? String(masterValues[a][6]).trim().toLowerCase() : "";
        if (role === "admin") {
          var adminNim = cleanNimHelper(masterValues[a][0]);
          if (adminNim) cache.remove("LSD_DATA_" + adminNim);
        }
      }
    }
  } catch(e) {}
}

// ======================================================================
// ENDPOINT POST: AUTENTIKASI, IZIN & PRESENSI
// ======================================================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = lock.tryLock(10000);
  if (!hasLock) return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Server sibuk. Silakan coba beberapa detik lagi."})).setMimeType(ContentService.MimeType.JSON);

  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error("Payload data tidak ditemukan.");

    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var waktuSekarang = new Date();
    var timezone = Session.getScriptTimeZone() || "GMT+7";
    var formattedDate = Utilities.formatDate(waktuSekarang, timezone, "yyyy-MM-dd HH:mm:ss");
    
    var cache = CacheService.getScriptCache();

    // =====================================================
    // 1. LOGIKA LOGIN (AUTENTIKASI & ROLE)
    // =====================================================
    if (data.status === "Login") {
      var sheetMaster = ss.getSheetByName("Master_Asisten");
      if (!sheetMaster) throw new Error("Tab 'Master_Asisten' tidak ditemukan.");

      var masterData = sheetMaster.getDataRange().getValues();
      var loginSuccess = false;
      var foundName = "";
      var foundRole = "Asisten"; 
      
      var inputNim = cleanNimHelper(data.userId || data.nim);  
      var inputPass = String(data.password || "").trim();

      for (var m = 1; m < masterData.length; m++) {
        var nimDB = cleanNimHelper(masterData[m][0]);          
        var passDB = masterData[m][5] ? String(masterData[m][5]).trim() : "";

        if (nimDB.toLowerCase() === inputNim.toLowerCase() && passDB === inputPass) {
          loginSuccess = true;
          foundName = masterData[m][1] ? String(masterData[m][1]).trim() : "";        
          var roleRaw = masterData[m][6] ? String(masterData[m][6]).trim() : "Asisten";
          foundRole = roleRaw.toLowerCase() === "admin" ? "Admin" : "Asisten";
          break;
        }
      }

      if (loginSuccess) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "success", 
          message: "Login berhasil.", 
          data: { userId: inputNim, userName: foundName, role: foundRole } 
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        throw new Error("NIM atau Password salah. Akses ditolak.");
      }
    }

    // =====================================================
    // 2. LOGIKA ADMIN: PERSETUJUAN IZIN (APPROVAL)
    // =====================================================
    if (data.status === "UpdateIzin") {
      var sheetMaster = ss.getSheetByName("Master_Asisten");
      if (!sheetMaster) throw new Error("Tab 'Master_Asisten' tidak ditemukan.");
      var masterData = sheetMaster.getDataRange().getValues();
      var isAdmin = false;
      var inputAdminNim = cleanNimHelper(data.userId || data.nim);

      for (var a = 1; a < masterData.length; a++) {
        var nimMaster = cleanNimHelper(masterData[a][0]);
        if (nimMaster.toLowerCase() === inputAdminNim.toLowerCase()) {
          var role = masterData[a][6] ? String(masterData[a][6]).trim().toLowerCase() : "";
          if (role === "admin") isAdmin = true;
          break;
        }
      }

      if (!isAdmin) throw new Error("Otorisasi gagal! Hak akses Anda bukan Admin.");
      
      var sheetIzin = ss.getSheetByName("Log_Izin");
      if (!sheetIzin) throw new Error("Tab 'Log_Izin' tidak ditemukan.");

      var rowId = parseInt(data.rowId, 10);
      if (isNaN(rowId) || rowId < 2 || rowId > sheetIzin.getLastRow()) {
        throw new Error("ID baris izin tidak valid.");
      }

      sheetIzin.getRange(rowId, 7).setValue(data.keputusan); 

      // Ambil NIM asisten pemilik izin dan hapus cachenya agar dasbor asisten langsung update
      var asistenNim = sheetIzin.getRange(rowId, 2).getValue();
      if (asistenNim) {
        cache.remove("LSD_DATA_" + cleanNimHelper(asistenNim));
      }
      cache.remove("LSD_DATA_" + inputAdminNim);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success", message: "Status izin berhasil diubah menjadi: " + data.keputusan
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // =====================================================
    // 3. LOGIKA PENGAJUAN IZIN (OLEH ASISTEN)
    // =====================================================
    if (data.status === "Izin") {
      var sheetIzin = ss.getSheetByName("Log_Izin");
      if (!sheetIzin) throw new Error("Tab 'Log_Izin' tidak ditemukan.");

      if (sheetIzin.getLastRow() === 0) {
        sheetIzin.appendRow(["Waktu Pengajuan", "NIM", "Nama Lengkap", "Tanggal Berhalangan", "Tanggal Pengganti", "Alasan", "Status Approval"]);
      }

      var cleanId = cleanNimHelper(data.userId || data.nim);
      sheetIzin.appendRow([
        formattedDate, cleanId, data.userName || data.nama || "-", data.tanggalIzin, data.tanggalPengganti, data.alasan || "-", "Menunggu Persetujuan"
      ]);

      // Hapus cache asisten dan admin agar pengajuan langsung terlihat
      invalidateCacheHelper(cache, ss, cleanId);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success", message: "Pengajuan Tukar Piket dikirim. Menunggu persetujuan Admin."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // =====================================================
    // 4. LOGIKA ABSEN MASUK & KELUAR
    // =====================================================
    var sheetLog = ss.getSheetByName("Log_Absensi"); 
    if (!sheetLog) throw new Error("Tab 'Log_Absensi' tidak ditemukan.");
    
    if (sheetLog.getLastRow() === 0) {
      sheetLog.appendRow(["Waktu Masuk", "NIM", "Nama", "Status", "Koordinat GPS", "Foto Masuk", "Waktu Keluar", "Foto Keluar", "Catatan Kegiatan"]);
    }

    var cleanUserId = cleanNimHelper(data.userId || data.nim);
    var cleanUserName = String(data.userName || data.nama || cleanUserId).trim();
    var fileUrl = "-";

    // Simpan foto ke Google Drive (jika disertakan)
    if (data.imageBytes && String(data.imageBytes).trim() !== "") {
      try {
        var folderId = "1f593-usQRp4U3keML9f2ZQP_soI5FPe1"; 
        var folder = DriveApp.getFolderById(folderId);
        var cleanBase64 = String(data.imageBytes).replace(/^data:image\/[a-z]+;base64,/, '');
        var decodedImage = Utilities.base64Decode(cleanBase64);
        var blob = Utilities.newBlob(decodedImage, data.mimeType || "image/jpeg", data.imageName || ("Piket_" + data.status + "_" + cleanUserId + ".jpg"));
        var file = folder.createFile(blob);
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch(shareErr) {}
        fileUrl = file.getUrl();
      } catch(driveErr) {
        fileUrl = "Upload Gagal: " + driveErr.message;
      }
    }

    var jamLokal = parseInt(Utilities.formatDate(waktuSekarang, timezone, "HH"), 10);
    var menitLokal = parseInt(Utilities.formatDate(waktuSekarang, timezone, "mm"), 10);

    // --- ABSEN MASUK ---
    if (data.status === "Masuk") {
      if (jamLokal > 15 || (jamLokal === 15 && menitLokal > 0)) {
        throw new Error("Sistem menolak! Batas akhir Absen Masuk adalah pukul 15:00 WIB.");
      }

      var logData = sheetLog.getDataRange().getValues();
      var todayString = Utilities.formatDate(waktuSekarang, timezone, "yyyy-MM-dd");

      for (var i = logData.length - 1; i > 0; i--) {
        var rowNim = cleanNimHelper(logData[i][1]);
        var rowWaktuKeluar = logData[i][6]; 
        var rowDate = logData[i][0] ? formatCellDateOnly(logData[i][0], timezone) : "";

        if (rowNim.toLowerCase() === cleanUserId.toLowerCase() && rowDate === todayString && (rowWaktuKeluar === "" || rowWaktuKeluar === null || rowWaktuKeluar === undefined)) {
          throw new Error("Sistem menolak! Anda sudah melakukan Absen Masuk dan sesi piket Anda masih berjalan.");
        }
      }

      sheetLog.appendRow([formattedDate, cleanUserId, cleanUserName, "Hadir Piket", data.location || "-", fileUrl, "", "", ""]);
      
      // Invalidate cache pribadi & admin
      invalidateCacheHelper(cache, ss, cleanUserId);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success", message: "Absen Masuk piket berhasil dicatat.",
        data: { timestamp: formattedDate, userId: cleanUserId, userName: cleanUserName, status: "Masuk", location: data.location, photoUrl: fileUrl }
      })).setMimeType(ContentService.MimeType.JSON);
    } 
    
    // --- ABSEN KELUAR ---
    else if (data.status === "Keluar") {
      var sheetData = sheetLog.getDataRange().getValues();
      var rowIndex = -1;
      var waktuMasukDB = null;

      for (var i = sheetData.length - 1; i > 0; i--) {
        var rowNim = cleanNimHelper(sheetData[i][1]);
        var rowWaktuKeluar = sheetData[i][6];
        if (rowNim.toLowerCase() === cleanUserId.toLowerCase() && (rowWaktuKeluar === "" || rowWaktuKeluar === null || rowWaktuKeluar === undefined)) {
          rowIndex = i + 1;
          waktuMasukDB = sheetData[i][0];
          break;
        }
      }
      if (rowIndex === -1) throw new Error("Sesi absen masuk tidak ditemukan atau sudah ditutup.");

      // Parsing waktu masuk secara aman
      var waktuMasukMs = 0;
      if (waktuMasukDB instanceof Date) {
        waktuMasukMs = waktuMasukDB.getTime();
      } else if (waktuMasukDB) {
        var strDate = String(waktuMasukDB).trim().replace(/-/g, '/');
        waktuMasukMs = new Date(strDate).getTime();
        if (isNaN(waktuMasukMs)) {
          waktuMasukMs = new Date(String(waktuMasukDB).trim()).getTime();
        }
      }

      if (!waktuMasukMs || isNaN(waktuMasukMs)) {
        throw new Error("Format waktu absen masuk di server tidak valid. Hubungi Admin.");
      }

      var selisihWaktu = waktuSekarang.getTime() - waktuMasukMs;
      var batasWaktuMinimum = 2 * 60 * 60 * 1000; // 2 Jam
      
      if (selisihWaktu < batasWaktuMinimum) {
        var sisaMnt = Math.ceil((batasWaktuMinimum - selisihWaktu) / (1000 * 60));
        if (sisaMnt < 1) sisaMnt = 1;
        throw new Error("Minimal durasi piket 2 jam belum terpenuhi (kurang ±" + sisaMnt + " menit).");
      }
      
      sheetLog.getRange(rowIndex, 4).setValue("Selesai Piket"); 
      sheetLog.getRange(rowIndex, 7).setValue(formattedDate);
      sheetLog.getRange(rowIndex, 8).setValue(fileUrl);
      sheetLog.getRange(rowIndex, 9).setValue(data.catatan || "-");

      // Invalidate cache pribadi & admin
      invalidateCacheHelper(cache, ss, cleanUserId);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success", message: "Absen Keluar & Laporan berhasil dicatat.",
        data: { timestamp: formattedDate, userId: cleanUserId, userName: cleanUserName, status: "Keluar", location: data.location, photoUrl: fileUrl, catatan: data.catatan }
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: error.message})).setMimeType(ContentService.MimeType.JSON);
  } finally {
    try {
      if (lock && lock.hasLock()) {
        lock.releaseLock();
      }
    } catch(e) {}
  }
}

// ======================================================================
// ENDPOINT GET: PENGAMBILAN DATA DENGAN FORMAT STANDAR & CACHE CERDAS
// ======================================================================

function doGet(e) {
  try {
    if (!e || !e.parameter || !e.parameter.nim) {
      throw new Error("Akses ditolak! Parameter NIM tidak ditemukan.");
    }
    var cleanReqNim = cleanNimHelper(e.parameter.nim);
    if (!cleanReqNim) throw new Error("Akses ditolak! Parameter NIM tidak valid.");

    var cache = CacheService.getScriptCache();
    var cacheKey = "LSD_DATA_" + cleanReqNim;
    var cachedResponse = cache.get(cacheKey);

    if (cachedResponse != null) {
      return ContentService.createTextOutput(cachedResponse).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var timezone = Session.getScriptTimeZone() || "GMT+7";
    
    // 1. Validasi Role
    var sheetMaster = ss.getSheetByName("Master_Asisten");
    var userRole = "Asisten"; 
    
    if (sheetMaster && sheetMaster.getLastRow() > 1) {
      var masterData = sheetMaster.getDataRange().getValues();
      for (var m = 1; m < masterData.length; m++) {
        var nimMaster = cleanNimHelper(masterData[m][0]);
        if (nimMaster.toLowerCase() === cleanReqNim.toLowerCase()) {
          var role = masterData[m][6] ? String(masterData[m][6]).trim() : "Asisten";
          userRole = (role.toLowerCase() === "admin") ? "Admin" : "Asisten";
          break;
        }
      }
    }

    var sheetLog = ss.getSheetByName("Log_Absensi"); 
    var sheetIzin = ss.getSheetByName("Log_Izin");
    var sheetJadwal = ss.getSheetByName("Jadwal_Piket"); 

    var recordsAbsen = [];
    var recordsIzin = [];
    var recordsJadwal = []; 

    if (sheetLog && sheetLog.getLastRow() > 1) {
      var valAbsen = sheetLog.getRange(2, 1, sheetLog.getLastRow() - 1, 9).getValues();
      for (var r = 0; r < valAbsen.length; r++) {
        var row = valAbsen[r];
        var nimDB = cleanNimHelper(row[1]);
        if (userRole !== "Admin" && nimDB.toLowerCase() !== cleanReqNim.toLowerCase()) continue; 
        
        var wMasuk = formatCellDateTime(row[0], timezone);
        var wKeluar = formatCellDateTime(row[6], timezone);

        recordsAbsen.push({
          id: r + 1, waktuMasuk: wMasuk,
          userId: nimDB, userName: row[2] ? String(row[2]).trim() : "",
          status: row[3] ? String(row[3]).trim() : "-", location: row[4] ? String(row[4]).trim() : "-",
          photoUrl: row[5] ? String(row[5]).trim() : "-", waktuKeluar: wKeluar,
          photoUrlKeluar: row[7] ? String(row[7]).trim() : "-", catatan: row[8] ? String(row[8]).trim() : "-"
        });
      }
    }

    if (sheetIzin && sheetIzin.getLastRow() > 1) {
      var valIzin = sheetIzin.getRange(2, 1, sheetIzin.getLastRow() - 1, 7).getValues();
      for (var i = 0; i < valIzin.length; i++) {
        var rowIz = valIzin[i];
        var nimIzDB = cleanNimHelper(rowIz[1]);
        if (userRole !== "Admin" && nimIzDB.toLowerCase() !== cleanReqNim.toLowerCase()) continue;

        var wPengajuan = formatCellDateTime(rowIz[0], timezone);
        var tglBerhalangan = formatCellDateOnly(rowIz[3], timezone);
        var tglPengganti = formatCellDateOnly(rowIz[4], timezone);

        recordsIzin.push({
          rowId: i + 2, 
          waktuPengajuan: wPengajuan,
          userId: nimIzDB, userName: rowIz[2] ? String(rowIz[2]).trim() : "-",
          tglBerhalangan: tglBerhalangan,
          tglPengganti: tglPengganti,
          alasan: rowIz[5] ? String(rowIz[5]).trim() : "-",
          statusApproval: rowIz[6] ? String(rowIz[6]).trim() : "Menunggu Persetujuan"
        });
      }
    }

    if (sheetJadwal && sheetJadwal.getLastRow() > 1) {
      var valJadwal = sheetJadwal.getDataRange().getValues();
      for (var j = 1; j < valJadwal.length; j++) {
        var rowJdw = valJadwal[j];
        recordsJadwal.push({
          id: j,
          senin: rowJdw[0] ? String(rowJdw[0]).trim() : "",
          selasa: rowJdw[1] ? String(rowJdw[1]).trim() : "",
          rabu: rowJdw[2] ? String(rowJdw[2]).trim() : "",
          kamis: rowJdw[3] ? String(rowJdw[3]).trim() : "",
          jumat: rowJdw[4] ? String(rowJdw[4]).trim() : ""
        });
      }
    }

    var finalResponseString = JSON.stringify({ 
      status: "success", roleDiakui: userRole,
      dataAbsensi: recordsAbsen.reverse(), dataIzin: recordsIzin.reverse(), dataJadwal: recordsJadwal 
    });

    // Simpan data ke dalam cache selama 120 detik (hanya jika payload < 100KB batas Apps Script)
    if (finalResponseString.length < 100000) {
      try {
        cache.put(cacheKey, finalResponseString, 120);
      } catch(cacheErr) {}
    }

    return ContentService.createTextOutput(finalResponseString).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.message, dataAbsensi: [], dataIzin: [], dataJadwal: [] })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ======================================================================
// CRON JOB (TIME-DRIVEN TRIGGER): AUDIT ALPA & AUTO-CHECKOUT
// ======================================================================

function cekAlpaHarian() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetLog = ss.getSheetByName("Log_Absensi");
  var sheetJadwal = ss.getSheetByName("Jadwal_Piket");
  var sheetMaster = ss.getSheetByName("Master_Asisten");
  var sheetIzin = ss.getSheetByName("Log_Izin"); 

  if (!sheetLog || !sheetJadwal || !sheetMaster || !sheetIzin) return;

  var waktuSekarang = new Date();
  var timezone = Session.getScriptTimeZone() || "GMT+7";
  var hariIni = parseInt(Utilities.formatDate(waktuSekarang, timezone, "u"), 10); 
  var todayString = Utilities.formatDate(waktuSekarang, timezone, "yyyy-MM-dd");
  
  // Lewati Sabtu (6) dan Minggu (7)
  if (hariIni === 6 || hariIni === 7) return;

  // Cek kecukupan baris dan kolom Jadwal_Piket
  if (sheetJadwal.getLastRow() <= 1) return;
  var colIndex = hariIni; 
  if (sheetJadwal.getLastColumn() < colIndex) return;

  var jadwalData = sheetJadwal.getRange(2, colIndex, sheetJadwal.getLastRow() - 1, 1).getValues();
  var namaPanggilanJadwal = [];
  for (var i = 0; i < jadwalData.length; i++) {
    var cellVal = jadwalData[i][0] ? String(jadwalData[i][0]).trim().toLowerCase() : "";
    if (cellVal.length > 0) {
      namaPanggilanJadwal.push(cellVal);
    }
  }
  if (namaPanggilanJadwal.length === 0) return;

  var masterData = sheetMaster.getDataRange().getValues();
  var asistenWajibPiket = []; 
  for (var n = 0; n < namaPanggilanJadwal.length; n++) {
     var panggilan = namaPanggilanJadwal[n];
     if (!panggilan) continue;
     var found = false;
     for (var m = 1; m < masterData.length; m++) { 
        var nimMaster = cleanNimHelper(masterData[m][0]);
        var namaLengkapMaster = masterData[m][1] ? String(masterData[m][1]).trim() : "";
        var namaLower = namaLengkapMaster.toLowerCase();
        
        if (namaLower.indexOf(panggilan) !== -1 || nimMaster.toLowerCase() === panggilan) {
           asistenWajibPiket.push({ nim: nimMaster, nama: namaLengkapMaster });
           found = true; 
           break;
        }
     }
     if (!found) asistenWajibPiket.push({ nim: "NIM Tidak Ditemukan", nama: panggilan });
  }

  // =================================================================
  // BLOK AUTO-CHECKOUT & PENDATAAN ASISTEN YANG SUDAH TERDATA HARI INI
  // =================================================================
  var logData = sheetLog.getDataRange().getValues();
  var nimTerdataHariIni = [];
  
  for (var j = 1; j < logData.length; j++) {
    var rowDateStr = formatCellDateOnly(logData[j][0], timezone);
    if (rowDateStr === todayString) {
       var nimHadir = cleanNimHelper(logData[j][1]);
       if (nimHadir) nimTerdataHariIni.push(nimHadir.toLowerCase());
       
       // CEK APAKAH SESI MASIH TERBUKA (WAKTU KELUAR KOSONG)?
       var waktuKeluar = logData[j][6];
       if (waktuKeluar === "" || waktuKeluar === null || waktuKeluar === undefined) {
          // PAKSA CHECKOUT!
          sheetLog.getRange(j + 1, 4).setValue("Lupa Checkout");
          sheetLog.getRange(j + 1, 7).setValue("Ditutup Otomatis");
          sheetLog.getRange(j + 1, 9).setValue("Sistem Audit: Sesi ditutup paksa. Asisten lalai melakukan absen keluar.");
       }
    }
  }

  // Data Izin yang telah Disetujui
  var dataIzinDB = sheetIzin.getDataRange().getValues();
  var izinHariIni = {}; 
  for (var x = 1; x < dataIzinDB.length; x++) {
     var tglBerhalanganDB = formatCellDateOnly(dataIzinDB[x][3], timezone); 
     var statusApproval = dataIzinDB[x][6] ? String(dataIzinDB[x][6]).trim().toLowerCase() : ""; 
     
     if (tglBerhalanganDB === todayString && statusApproval === "disetujui") {
        var nimIzin = cleanNimHelper(dataIzinDB[x][1]).toLowerCase();
        var tglPenggantiStr = formatCellDateOnly(dataIzinDB[x][4], timezone);
        izinHariIni[nimIzin] = {
           pengganti: tglPenggantiStr || "-",
           alasan: dataIzinDB[x][5] ? String(dataIzinDB[x][5]).trim() : "-"
        };
     }
  }

  var formattedAuditTime = Utilities.formatDate(waktuSekarang, timezone, "yyyy-MM-dd HH:mm:ss");
  for (var k = 0; k < asistenWajibPiket.length; k++) {
    var targetAsisten = asistenWajibPiket[k];
    var targetNimKey = cleanNimHelper(targetAsisten.nim).toLowerCase();
    
    // Jangan append jika asisten sudah terdata hari ini (mencegah duplikasi alpa jika cron jalan lebih dari 1 kali)
    if (nimTerdataHariIni.indexOf(targetNimKey) === -1) {
      if (izinHariIni.hasOwnProperty(targetNimKey)) {
         sheetLog.appendRow([formattedAuditTime, targetAsisten.nim, targetAsisten.nama, "Izin (Ganti Hari)", "-", "-", "-", "-", "Telah disetujui. Ganti piket pada: " + izinHariIni[targetNimKey].pengganti + ". Alasan: " + izinHariIni[targetNimKey].alasan]);
      } else {
         sheetLog.appendRow([formattedAuditTime, targetAsisten.nim, targetAsisten.nama, "Alpa (Tidak Hadir)", "-", "-", "-", "-", "Sistem Audit: Asisten mangkir atau pengajuan izin ditolak/belum disetujui."]);
      }
      nimTerdataHariIni.push(targetNimKey);
    }
  }

  // Invalidate cache semua asisten yang diaudit
  var cache = CacheService.getScriptCache();
  if (cache) {
    for (var u = 0; u < asistenWajibPiket.length; u++) {
      var n = cleanNimHelper(asistenWajibPiket[u].nim);
      if (n) cache.remove("LSD_DATA_" + n);
    }
  }
}