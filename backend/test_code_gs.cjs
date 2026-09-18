/**
 * Test Suite & Mocking Environment for Google Apps Script backend/Code.gs
 */

const fs = require('fs');
const path = require('path');

// --- MOCK GAS ENVIRONMENT ---
class MockRange {
  constructor(sheet, startRow, startCol, numRows = 1, numCols = 1) {
    this.sheet = sheet;
    this.startRow = startRow; // 1-indexed
    this.startCol = startCol; // 1-indexed
    this.numRows = numRows;
    this.numCols = numCols;
  }

  getValues() {
    if (this.numRows <= 0 || this.numCols <= 0) {
      throw new Error("Exception: The number of rows and columns must be at least 1.");
    }
    const result = [];
    for (let r = 0; r < this.numRows; r++) {
      const row = [];
      for (let c = 0; c < this.numCols; c++) {
        const rIdx = this.startRow - 1 + r;
        const cIdx = this.startCol - 1 + c;
        const val = (this.sheet.data[rIdx] && this.sheet.data[rIdx][cIdx] !== undefined)
          ? this.sheet.data[rIdx][cIdx]
          : "";
        row.push(val);
      }
      result.push(row);
    }
    return result;
  }

  getValue() {
    return this.getValues()[0][0];
  }

  setValue(val) {
    this.setValues([[val]]);
  }

  setValues(matrix) {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        const rIdx = this.startRow - 1 + r;
        const cIdx = this.startCol - 1 + c;
        while (this.sheet.data.length <= rIdx) {
          this.sheet.data.push([]);
        }
        this.sheet.data[rIdx][cIdx] = matrix[r][c];
      }
    }
  }
}

class MockSheet {
  constructor(name, initialData = []) {
    this.name = name;
    this.data = JSON.parse(JSON.stringify(initialData));
  }

  getLastRow() {
    return this.data.length;
  }

  getLastColumn() {
    let maxCols = 0;
    for (const row of this.data) {
      if (row.length > maxCols) maxCols = row.length;
    }
    return maxCols;
  }

  getDataRange() {
    return new MockRange(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn()));
  }

  getRange(row, col, numRows = 1, numCols = 1) {
    if (numRows <= 0) {
      throw new Error("Exception: The number of rows must be at least 1.");
    }
    return new MockRange(this, row, col, numRows, numCols);
  }

  appendRow(rowArr) {
    this.data.push([...rowArr]);
  }
}

class MockSpreadsheet {
  constructor() {
    this.sheets = {};
  }

  addSheet(name, data = []) {
    this.sheets[name] = new MockSheet(name, data);
    return this.sheets[name];
  }

  getSheetByName(name) {
    return this.sheets[name] || null;
  }
}

class MockCache {
  constructor() {
    this.store = {};
  }

  get(key) {
    return this.store[key] || null;
  }

  put(key, value, expirationInSeconds) {
    if (typeof value === 'string' && value.length > 100000) {
      throw new Error("Exception: Argument too large: value");
    }
    this.store[key] = value;
  }

  remove(key) {
    delete this.store[key];
  }
}

class MockLock {
  constructor() {
    this.locked = false;
  }
  tryLock(timeout) {
    this.locked = true;
    return true;
  }
  hasLock() {
    return this.locked;
  }
  releaseLock() {
    if (!this.locked) throw new Error("Exception: The lock has already been released");
    this.locked = false;
  }
}

// Global Mocks Setup
let currentSpreadsheet = new MockSpreadsheet();
let currentCache = new MockCache();
let currentLock = new MockLock();
let currentTime = new Date("2026-09-18T10:00:00+07:00"); // Friday 10:00 WIB

function pad(n) { return n < 10 ? '0' + n : '' + n; }

const Utilities = {
  formatDate: (date, tz, fmt) => {
    // Basic date formatter supporting yyyy-MM-dd, HH, mm, u, yyyy-MM-dd HH:mm:ss
    const d = new Date(date);
    if (isNaN(d.getTime())) throw new Error("Exception: Invalid argument: date");
    
    // Convert to GMT+7
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const local = new Date(utc + (3600000 * 7));

    const yyyy = local.getFullYear();
    const MM = pad(local.getMonth() + 1);
    const dd = pad(local.getDate());
    const HH = pad(local.getHours());
    const mm = pad(local.getMinutes());
    const ss = pad(local.getSeconds());

    // Day of week: 1 = Monday, 7 = Sunday
    let day = local.getDay();
    let u = day === 0 ? 7 : day;

    if (fmt === "u") return String(u);
    if (fmt === "HH") return HH;
    if (fmt === "mm") return mm;
    if (fmt === "yyyy-MM-dd") return `${yyyy}-${MM}-${dd}`;
    if (fmt === "yyyy-MM-dd HH:mm:ss") return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
    return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
  },
  base64Decode: (str) => {
    return Buffer.from(str, 'base64');
  },
  newBlob: (data, mime, name) => {
    return { data, mime, name };
  }
};

const SpreadsheetApp = {
  getActiveSpreadsheet: () => currentSpreadsheet
};

const CacheService = {
  getScriptCache: () => currentCache
};

const LockService = {
  getScriptLock: () => currentLock
};

const Session = {
  getScriptTimeZone: () => "GMT+7"
};

const ContentService = {
  MimeType: { JSON: "application/json" },
  createTextOutput: (content) => ({
    content,
    mimeType: null,
    setMimeType: function(mime) { this.mimeType = mime; return this; }
  })
};

const DriveApp = {
  Access: { ANYONE_WITH_LINK: "ANYONE_WITH_LINK" },
  Permission: { VIEW: "VIEW" },
  getFolderById: (id) => ({
    createFile: (blob) => ({
      getUrl: () => `https://drive.google.com/mock-file/${blob.name || 'file.jpg'}`,
      setSharing: (access, permission) => {}
    })
  })
};

// Expose globals for Code.gs
global.SpreadsheetApp = SpreadsheetApp;
global.CacheService = CacheService;
global.LockService = LockService;
global.Session = Session;
global.ContentService = ContentService;
global.DriveApp = DriveApp;
global.Utilities = Utilities;
global.Date = class extends Date {
  constructor(...args) {
    if (args.length === 0) {
      super(currentTime.getTime());
    } else {
      super(...args);
    }
  }
  static now() {
    return currentTime.getTime();
  }
};

// Load Code.gs
const codePath = path.join(__dirname, 'Code.gs');
const codeContent = fs.readFileSync(codePath, 'utf-8');
eval(codeContent);

// Test Runner Helper
let passed = 0;
let failed = 0;

function assert(desc, condition, details = "") {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${desc} -> ${details}`);
    failed++;
  }
}

// Reset Database Fixtures
function setupDatabase() {
  currentSpreadsheet = new MockSpreadsheet();
  currentCache = new MockCache();
  currentLock = new MockLock();

  // Master_Asisten: NIM (0), Nama (1), Org (2-4), PIN (5), Role (6)
  currentSpreadsheet.addSheet("Master_Asisten", [
    ["NIM", "Nama Lengkap", "Bidang", "Email", "No HP", "Password", "Role"],
    ["L200210001", "Muhammad Habib", "Software", "habib@test.com", "0812", "123456", "Admin"],
    ["L200210002", "Budi Santoso", "Hardware", "budi@test.com", "0813", "pass123", "Asisten"],
    ["L200210003", "Siti Aisyah", "Jaringan", "siti@test.com", "0814", "pin789", "Asisten"]
  ]);

  // Log_Absensi: Waktu Masuk, NIM, Nama, Status, GPS, Foto Masuk, Waktu Keluar, Foto Keluar, Catatan
  currentSpreadsheet.addSheet("Log_Absensi", [
    ["Waktu Masuk", "NIM", "Nama", "Status", "Koordinat GPS", "Foto Masuk", "Waktu Keluar", "Foto Keluar", "Catatan Kegiatan"]
  ]);

  // Log_Izin: Waktu Pengajuan, NIM, Nama, Tgl Berhalangan, Tgl Pengganti, Alasan, Status Approval
  currentSpreadsheet.addSheet("Log_Izin", [
    ["Waktu Pengajuan", "NIM", "Nama Lengkap", "Tanggal Berhalangan", "Tanggal Pengganti", "Alasan", "Status Approval"]
  ]);

  // Jadwal_Piket: Kolom A=Senin, B=Selasa, C=Rabu, D=Kamis, E=Jumat
  currentSpreadsheet.addSheet("Jadwal_Piket", [
    ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    ["Budi", "Habib", "Siti", "Budi", "Habib"],
    ["Siti", "", "", "", "Budi"]
  ]);
}

console.log("\n=======================================================");
console.log("       TESTING ORIGINAL backend/Code.gs");
console.log("=======================================================\n");

// TEST 1: LOGIN
console.log("TEST 1: Logika Login (Autentikasi & Role)");
setupDatabase();

// 1.1 Login Sukses Admin
let res = JSON.parse(doPost({ postData: { contents: JSON.stringify({ status: "Login", userId: "L200210001", password: "123456" }) } }).content);
assert("1.1 Login Admin berhasil", res.status === "success" && res.data.role === "Admin");

// 1.2 Login Case Insensitive NIM (e.g. lowercase l200210001)
res = JSON.parse(doPost({ postData: { contents: JSON.stringify({ status: "Login", userId: "l200210001", password: "123456" }) } }).content);
assert("1.2 Login Case-insensitive NIM (l200210001)", res.status === "success", `Actual: ${res.status} (${res.message})`);

// 1.3 Login Gagal Password Salah
res = JSON.parse(doPost({ postData: { contents: JSON.stringify({ status: "Login", userId: "L200210001", password: "wrong" }) } }).content);
assert("1.3 Login Password Salah ditolak", res.status === "error");

// TEST 2: ABSEN MASUK & BATAS JAM
console.log("\nTEST 2: Logika Absen Masuk & Batas Waktu 15:00 WIB");
setupDatabase();

// 2.1 Absen Masuk Jam 10:00 (Sah)
currentTime = new Date("2026-09-18T10:00:00+07:00");
res = JSON.parse(doPost({ postData: { contents: JSON.stringify({
  status: "Masuk", userId: "L200210002", userName: "Budi Santoso", location: "-7.5, 110.8", imageBytes: Buffer.from("dummy").toString('base64')
}) } }).content);
assert("2.1 Absen Masuk jam 10:00 berhasil", res.status === "success");

// 2.2 Duplikat Absen Masuk saat sesi masih aktif
res = JSON.parse(doPost({ postData: { contents: JSON.stringify({
  status: "Masuk", userId: "L200210002", userName: "Budi Santoso", location: "-7.5, 110.8"
}) } }).content);
assert("2.2 Tolak Absen Masuk ganda pada hari yang sama", res.status === "error", `Actual: ${res.status} (${res.message})`);

// 2.3 Absen Masuk Lewat Pukul 15:00 (15:05)
currentTime = new Date("2026-09-18T15:05:00+07:00");
res = JSON.parse(doPost({ postData: { contents: JSON.stringify({
  status: "Masuk", userId: "L200210003", userName: "Siti Aisyah", location: "-7.5, 110.8"
}) } }).content);
assert("2.3 Tolak Absen Masuk lewat pukul 15:00 WIB", res.status === "error" && res.message.includes("15:00"));

// TEST 3: ABSEN KELUAR & ATURAN 2 JAM
console.log("\nTEST 3: Logika Absen Keluar & Durasi Minimal 2 Jam");
// Skenario Budi clock-in jam 10:00 WIB
currentTime = new Date("2026-09-18T11:00:00+07:00"); // 1 Jam kemudian (belum 2 jam)
res = JSON.parse(doPost({ postData: { contents: JSON.stringify({
  status: "Keluar", userId: "L200210002", catatan: "Piket selesai sebagian"
}) } }).content);
assert("3.1 Tolak Absen Keluar jika belum 2 jam (baru 1 jam)", res.status === "error" && res.message.includes("2 jam"), `Actual: ${res.status} (${res.message})`);

// Case insensitive & sanitized NIM pada checkout jam 12:05 (sudah 2 jam lebih)
currentTime = new Date("2026-09-18T12:05:00+07:00");
res = JSON.parse(doPost({ postData: { contents: JSON.stringify({
  status: "Keluar", userId: "l200210002", catatan: "Selesai piket dan merapikan lab" // lowercase NIM
}) } }).content);
assert("3.2 Checkout berhasil setelah 2 jam dengan lowercase NIM (l200210002)", res.status === "success", `Actual: ${res.status} (${res.message})`);

// TEST 4: PENGAJUAN IZIN & APPROVAL ADMIN
console.log("\nTEST 4: Pengajuan Izin & Approval Admin");
setupDatabase();

// 4.1 Asisten ajukan izin
res = JSON.parse(doPost({ postData: { contents: JSON.stringify({
  status: "Izin", userId: "L200210002", userName: "Budi Santoso",
  tanggalIzin: "2026-09-18", tanggalPengganti: "2026-09-21", alasan: "Sakit demam"
}) } }).content);
assert("4.1 Asisten berhasil mengirim pengajuan izin", res.status === "success");

// 4.2 Non-admin coba approve izin (harus ditolak)
res = JSON.parse(doPost({ postData: { contents: JSON.stringify({
  status: "UpdateIzin", userId: "L200210002", rowId: 2, keputusan: "Disetujui" // Budi adalah Asisten, bukan Admin
}) } }).content);
assert("4.2 Non-admin ditolak saat mencoba update status izin", res.status === "error" && res.message.includes("Admin"));

// 4.3 Admin approve izin
res = JSON.parse(doPost({ postData: { contents: JSON.stringify({
  status: "UpdateIzin", userId: "L200210001", rowId: 2, keputusan: "Disetujui"
}) } }).content);
assert("4.3 Admin berhasil menyetujui izin", res.status === "success");

// 4.4 Cek apakah cache Asisten dihapus saat Admin approve izin!
currentCache.put("LSD_DATA_L200210002", "cached_old_assistant_data", 120);
res = JSON.parse(doPost({ postData: { contents: JSON.stringify({
  status: "UpdateIzin", userId: "L200210001", rowId: 2, keputusan: "Disetujui"
}) } }).content);
assert("4.4 Cache milik Asisten (L200210002) harus di-invalidasi saat Admin update izin", currentCache.get("LSD_DATA_L200210002") === null, `Cache value: ${currentCache.get("LSD_DATA_L200210002")}`);

// TEST 5: DOGET & CACHE 100KB CRASH TEST
console.log("\nTEST 5: doGet & Cache Limit (100KB)");
setupDatabase();

// 5.1 doGet asisten biasa (hanya data sendiri)
let getRes = JSON.parse(doGet({ parameter: { nim: "L200210002" } }).content);
assert("5.1 doGet Asisten berhasil dan role diakui Asisten", getRes.status === "success" && getRes.roleDiakui === "Asisten");

// 5.2 doGet Admin dengan lowercase NIM
getRes = JSON.parse(doGet({ parameter: { nim: "l200210001" } }).content);
assert("5.2 doGet Admin dengan lowercase nim diakui Admin", getRes.status === "success" && getRes.roleDiakui === "Admin", `Role diakui: ${getRes.roleDiakui}`);

// 5.3 Payload besar (> 100KB) tidak boleh bikin doGet crash
const bigLogSheet = currentSpreadsheet.getSheetByName("Log_Absensi");
for (let i = 0; i < 500; i++) {
  bigLogSheet.appendRow(["2026-09-18 08:00:00", "L200210001", "Muhammad Habib", "Selesai Piket", "GPS Koordinat Sangat Panjang -7.12345678, 110.12345678", "https://drive.google.com/very/long/url/path/to/photo/file/1234567890", "2026-09-18 10:00:00", "https://drive.google.com/very/long/url/path/to/photo/file/out_1234567890", "Catatan kegiatan asisten lab yang cukup panjang untuk memenuhi kuota buffer memory"]);
}
currentCache = new MockCache();
getRes = JSON.parse(doGet({ parameter: { nim: "L200210001" } }).content);
assert("5.3 doGet tidak crash ketika response > 100KB (Cache put overflow)", getRes.status === "success", `Actual: ${getRes.status} (${getRes.message})`);

// TEST 6: CRON CEKALPAHARIAN
console.log("\nTEST 6: Cron cekAlpaHarian & Auto-Checkout");
setupDatabase();
// Jumat (Hari 5): Jadwal Jumat adalah Habib dan Budi
// Hari ini 2026-09-18 adalah Jumat
currentTime = new Date("2026-09-18T17:00:00+07:00");

// Habib hadir dan checkout normal jam 10:00
const sheetLog = currentSpreadsheet.getSheetByName("Log_Absensi");
sheetLog.appendRow(["2026-09-18 08:00:00", "L200210001", "Muhammad Habib", "Selesai Piket", "GPS", "url", "2026-09-18 10:00:00", "url", "Catatan"]);

// Budi hadir jam 09:00 tapi lupa checkout
sheetLog.appendRow(["2026-09-18 09:00:00", "L200210002", "Budi Santoso", "Hadir Piket", "GPS", "url", "", "", ""]);

// Siti tidak di jadwal Jumat tapi punya izin disetujui
const sheetIzin = currentSpreadsheet.getSheetByName("Log_Izin");
sheetIzin.appendRow(["2026-09-17 10:00:00", "L200210002", "Budi Santoso", "2026-09-18", "2026-09-21", "Sakit", "Disetujui"]);

// Jalankan cron
try {
  cekAlpaHarian();
  assert("6.1 cekAlpaHarian berjalan tanpa error", true);
} catch (e) {
  assert("6.1 cekAlpaHarian berjalan tanpa error", false, e.message);
}

// Cek auto-checkout Budi (baris 3)
const logRows = sheetLog.getDataRange().getValues();
const budiRow = logRows.find(r => r[1] === "L200210002" && r[0].includes("2026-09-18 09:00:00"));
assert("6.2 Asisten yang lupa checkout otomatis ditutup ('Lupa Checkout')", budiRow && budiRow[3] === "Lupa Checkout" && budiRow[6] === "Ditutup Otomatis", `Status: ${budiRow ? budiRow[3] : 'not found'}, WaktuKeluar: ${budiRow ? budiRow[6] : ''}`);

// TEST 7: Sel Jadwal berisi spasi " " tidak boleh mencocokkan semua orang
console.log("\nTEST 7: Jadwal cell dengan spasi ' ' tidak boleh match false-positive");
setupDatabase();
const sheetJdw = currentSpreadsheet.getSheetByName("Jadwal_Piket");
sheetJdw.getRange(2, 5).setValue(" "); // Jumat diisi spasi saja
sheetJdw.getRange(3, 5).setValue("");
const sheetLogTest = currentSpreadsheet.getSheetByName("Log_Absensi");

try {
  cekAlpaHarian();
  const logsAfter = sheetLogTest.getDataRange().getValues();
  const alpaCount = logsAfter.filter(r => r[3] && r[3].includes("Alpa")).length;
  assert("7.1 Sel jadwal spasi ' ' tidak mencatut asisten secara acak sebagai Alpa", alpaCount === 0, `Alpa count: ${alpaCount}`);
} catch (e) {
  assert("7.1 Sel jadwal spasi ' ' tidak error", false, e.message);
}

// TEST 8: Jadwal hanya ada baris header (0 data rows)
console.log("\nTEST 8: Jadwal Piket kosong (hanya header)");
setupDatabase();
const emptyJdw = currentSpreadsheet.getSheetByName("Jadwal_Piket");
emptyJdw.data = [["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]]; // Hanya baris header (getLastRow = 1)
try {
  cekAlpaHarian();
  assert("8.1 cekAlpaHarian aman jika Jadwal_Piket hanya ada header", true);
} catch (e) {
  assert("8.1 cekAlpaHarian aman jika Jadwal_Piket hanya ada header", false, `Crash: ${e.message}`);
}

// TEST 9: Izin Disetujui tapi beda casing NIM (e.g. Master L200210002, Log_Izin l200210002)
console.log("\nTEST 9: Izin Disetujui dengan perbedaan casing NIM");
setupDatabase();
currentTime = new Date("2026-09-18T17:00:00+07:00");
const sheetIzin9 = currentSpreadsheet.getSheetByName("Log_Izin");
// Budi ada di jadwal Jumat. Di Log_Izin NIM Budi ditulis huruf kecil 'l200210002'
sheetIzin9.appendRow(["2026-09-17 10:00:00", "l200210002", "Budi Santoso", "2026-09-18", "2026-09-21", "Sakit", "Disetujui"]);
const sheetLog9 = currentSpreadsheet.getSheetByName("Log_Absensi");

cekAlpaHarian();
const logsAfter9 = sheetLog9.getDataRange().getValues();
const budiLog = logsAfter9.find(r => r[1].toUpperCase() === "L200210002" || r[2].includes("Budi"));
assert("9.1 Asisten berizin sah tidak dihukum Alpa hanya karena beda casing NIM", budiLog && budiLog[3] === "Izin (Ganti Hari)", `Status yang didapat: ${budiLog ? budiLog[3] : 'not found'}`);

// TEST 10: Validasi bypass 2 jam pada checkout jika waktu masuk invalid
console.log("\nTEST 10: Absen Keluar dengan tanggal masuk rusak");
setupDatabase();
const sheetLog10 = currentSpreadsheet.getSheetByName("Log_Absensi");
sheetLog10.appendRow(["FormatTanggalRusak", "L200210002", "Budi Santoso", "Hadir Piket", "GPS", "url", "", "", ""]);
currentTime = new Date("2026-09-18T10:01:00+07:00"); // Baru 1 menit berlalu
res = JSON.parse(doPost({ postData: { contents: JSON.stringify({
  status: "Keluar", userId: "L200210002", catatan: "Checkout kilat ilegal"
}) } }).content);
assert("10.1 Tolak checkout jika waktu masuk invalid (tidak boleh bypass 2 jam)", res.status === "error", `Actual: ${res.status} (${res.message})`);

console.log("\n=======================================================");
console.log(`TEST COMPLETED: ${passed} PASSED, ${failed} FAILED`);
console.log("=======================================================\n");
