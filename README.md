# 🚀 Sistem Presensi Web Modern (React + Vite SPA)

Aplikasi Presensi Web Modern berbasis **Single Page Application (SPA)** dengan **React.js**, **Vite**, **Tailwind CSS**, **react-webcam**, **React Router DOM**, dan **Lucide Icons** yang terhubung langsung ke backend serverless **Google Apps Script**, **Google Sheets**, dan **Google Drive**.

---

## 📱 Fitur Utama & Struktur Halaman

Aplikasi memiliki 4 rute tampilan utama sesuai dengan [frontend.md](frontend.md):

1. **`/` (Dashboard)**:
   - Sapaan dinamis pengguna ("Halo, [Nama]!").
   - Status presensi hari ini (*Sudah Presensi* / *Belum Presensi*).
   - Tombol navigasi cepat (*Presensi Sekarang*, *Riwayat Presensi*).
   - Info presensi terakhir & ketentuan presensi lab.
2. **`/absen` (Form Absen Live Camera)**:
   - Live In-App Camera menggunakan `react-webcam` dengan rasio 4:3 & overlay panduan wajah.
   - Pilihan ganti kamera depan (*selfie*) / belakang (*environment*).
   - Efek shutter flash, snapshot freeze frame, kompresi otomatis ke Base64 JPEG.
   - Deteksi otomatis titik koordinat GPS (*Latitude, Longitude*) beserta estimasi akurasi meter & link Google Maps.
   - Validasi formulir (NIM, Nama, Foto) dan animasi proses pengiriman data ke server Google.
3. **`/sukses` (Konfirmasi Sukses)**:
   - Tiket digital bukti presensi resmi (NIM, Nama, Status, Waktu server, Koordinat GPS, dan preview foto).
   - Tombol cepat untuk kembali ke Beranda atau membuka Riwayat.
4. **`/riwayat` (Riwayat Presensi)**:
   - Daftar log riwayat kehadiran yang ditarik secara real-time dari Google Sheets via `doGet`.
   - Fitur pencarian instan (berdasarkan NIM atau Nama) dan filter status (Semua, Hadir, Selesai Lab, Izin).
   - Tautan langsung untuk membuka berkas foto di Google Drive.

---

## 🔐 Konfigurasi Keamanan & Environment Variables (`.env`)

URL Google Apps Script Web App sekarang disimpan secara aman di dalam berkas environment `.env` dan tidak di-hardcode:

1. Buat berkas `.env` di direktori utama (contoh pada `.env.example`):
```env
VITE_GAS_API_URL=https://script.google.com/macros/s/YOUR_GAS_DEPLOYMENT_ID/exec
```

2. Seluruh modul aplikasi (Kirim Presensi Masuk/Keluar, Pengambilan Riwayat, dan Panel Admin) membaca URL ini secara terpusat melalui `import.meta.env.VITE_GAS_API_URL`.
3. Berkas `.env` telah didaftarkan ke dalam `.gitignore` agar kredensial/endpoint tidak bocor ke repositori publik.

---

## 🛠️ Menjalankan Proyek Secara Lokal

### 1. Prasyarat
- Node.js (versi 18 ke atas)

### 2. Jalankan Mode Pengembangan (Dev Server)
```bash
npm run dev
```
Aplikasi akan terbuka otomatis di peramban pada alamat `http://localhost:3000`.

### 3. Build untuk Produksi
```bash
npm run build
```
Hasil build siap produksi akan berada di direktori `dist/` dan dapat di-deploy ke Vercel, Netlify, atau GitHub Pages.

---

## 📂 Struktur Direktori Proyek

```
c:\absensi lab\
├── package.json             # Konfigurasi dependensi React, Vite, Tailwind
├── vite.config.js           # Konfigurasi bundler Vite
├── tailwind.config.js       # Konfigurasi Tailwind CSS
├── postcss.config.js        # Konfigurasi PostCSS
├── index.html               # File HTML root Vite
├── frontend.md              # Dokumen Spesifikasi Frontend
├── prd.md                   # Dokumen PRD Utama
├── backend/
│   └── Code.gs              # Script Google Apps Script (POST submit & GET history)
└── src/
    ├── main.jsx             # Entry point React DOM
    ├── App.jsx              # Router & Layout Utama
    ├── index.css            # Styling global & glassmorphism utilities
    ├── context/
    │   └── AttendanceContext.jsx # State global & komunikasi API
    ├── hooks/
    │   └── useGeolocation.js     # Hook live GPS tracker
    ├── components/
    │   ├── Header.jsx            # Header & Realtime Digital Clock
    │   ├── BottomNav.jsx         # Mobile Bottom Navigation bar
    │   ├── LocationBadge.jsx     # Widget indikator GPS & link Maps
    │   └── SettingsModal.jsx     # Modal konfigurasi URL Apps Script
    └── pages/
        ├── Dashboard.jsx         # Halaman Beranda
        ├── AbsenForm.jsx         # Halaman Kamera & Form Absen
        ├── Sukses.jsx            # Halaman Tiket Bukti Presensi
        └── Riwayat.jsx           # Halaman Log Riwayat Presensi
```
