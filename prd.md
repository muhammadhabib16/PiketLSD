# Product Requirements Document (PRD)
**Nama Proyek:** Sistem Absensi Web Serverless & Manajemen Piket Lab (LSD)
**Fase:** Produksi (V3 - Full Authentication & Privacy)
**Tujuan Integrasi:** Frontend React SPA, Google Apps Script, Google Sheets, Google Drive 

---

## 1. Visi dan Objektif Proyek
* **Tujuan:** Membangun sistem pencatatan kehadiran mandiri berbasis web khusus asisten laboratorium LSD. Sistem dirancang dengan lapisan akun pengguna (Login) agar privasi data riwayat presensi tiap asisten terjamin (hanya bisa melihat datanya sendiri). Sistem tetap mempertahankan fitur wajib piket 2 jam, batas telat masuk, dan audit alpa otomatis.
* **Alasan:** Menutup celah kebocoran privasi data pada REST API, menghilangkan risiko penitipan absen (karena terkunci PIN), serta mengautomasi sanksi alpa untuk mengurangi beban rekapitulasi admin.
* **Dampak:** Terciptanya ekosistem presensi tingkat tinggi (*Enterprise-grade*) yang aman, presisi, dan sepenuhnya beroperasi tanpa biaya *server* basis data pihak ketiga (*Zero-cost backend*).

---

## 2. Arsitektur dan Teknologi Pilihan
* **Frontend (Aplikasi Klien):** React.js (SPA), Tailwind CSS.
  * *Peran:* Menangani antarmuka *Login*, menyimpan status otentikasi di memori, dan mengunci fungsi kirim (*State-aware*).
* **Backend API:** Google Apps Script (`doPost` & `doGet`).
  * *Peran:* Melakukan validasi PIN, menerima data absen, menerima pengajuan izin pengecualian, dan menyaring respons JSON GET berdasarkan otorisasi parameter URL.
* **Database Relasional (Spreadsheet):** Memiliki 4 *tab* utama: `Log_Absensi`, `Jadwal_Piket`, `Master_Asisten` (dilengkapi PIN), dan `Log_Izin`.

---

## 3. Kebutuhan Fungsional Utama

### Fitur 1: Autentikasi Akun (Login)
* **Tindakan:** Frontend tidak lagi menampilkan menu *dropdown* asisten. Aplikasi mengharuskan input NIM dan Password (PIN), yang divalidasi oleh *backend* dengan mencocokkan data di *tab* `Master_Asisten`.
* **Dampak:** Proses *Zero-Trust* maksimal. Variabel pelaporan 100% konsisten dan privasi riwayat asisten terjaga karena data dikunci ke dalam akun yang bersangkutan.

### Fitur 2: Form Pengecualian Jadwal (Log Izin)
* **Tindakan:** Jika asisten tidak bisa hadir di jadwal aslinya, mereka bisa mengajukan tanggal pengganti melalui aplikasi. Data akan masuk ke *tab* `Log_Izin`.
* **Dampak:** Mesin audit otomatis tidak akan mencatat asisten tersebut sebagai "Alpa", melainkan "Izin (Ganti Hari)".

### Fitur 3: Aturan Batas Jam Kerja (*Time-Block & Timer*)
* **Tindakan:** Server secara mutlak akan memutus (*reject*) permintaan masuk di atas pukul 14:00 WIB, dan menolak permintaan keluar sebelum 2 jam berlalu sejak jam masuk.

### Fitur 4: Audit Alpa Otomatis Bersyarat (*Smart Auto-Penalty*)
* **Tindakan:** Skrip `cekAlpaHarian()` dieksekusi otomatis (jam 17:00). Ia membandingkan `Jadwal_Piket` dengan `Log_Absensi`. Jika asisten mangkir, sistem akan mengecek `Log_Izin`. Jika ada izin yang sah, sanksi batal. Jika tidak, asisten dicap "Alpa".

---

## 4. Skema Basis Data (Google Sheets)
Membutuhkan 4 lembar kerja (*tab*):

**A. Tab `Master_Asisten`**
| Kolom A | Kolom B | Kolom C-E | Kolom F |
| :--- | :--- | :--- | :--- |
| NIM (Indeks Login) | Nama Lengkap | Data Organisasi | Password/PIN |

**B. Tab `Log_Absensi`**
Berisi kolom rekaman: Waktu Masuk, NIM, Nama, Status, GPS, Foto Masuk, Waktu Keluar, Foto Keluar, Catatan.

**C. Tab `Log_Izin`**
Berisi kolom: Waktu Pengajuan, NIM, Nama Lengkap, Tanggal Berhalangan, Tanggal Pengganti, Alasan.

**D. Tab `Jadwal_Piket`**
Matriks jadwal mingguan (Kolom A = Senin, Kolom B = Selasa, dst) sebagai patokan wajib hadir bagi Cron Job audit otomatis.