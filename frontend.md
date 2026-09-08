# Product Requirements Document (PRD) - Frontend Absensi (Edisi Piket Lab & Admin)
**Nama Proyek:** Frontend Web Absensi Modern & Manajemen Sesi Piket 
**Platform:** Mobile-First Web Application (SPA - Single Page Application)  
**Endpoint API Utama:** `https://script.google.com/macros/s/AKfycbyRIu-ErPECyZjOpRh6ZwN-V8jDw9bVqr5RCMJ_RZZLZ8TLcYd3h61IP2I0Qh-1AZcB/exec`

---

## 1. Visi dan Ruang Lingkup Frontend
*   **Maksud & Tujuan:** Membangun antarmuka interaktif yang memiliki sistem Autentikasi dan *Role-Based Access Control* (RBAC) untuk menjamin keamanan identitas dan pembatasan wewenang. Pengalaman pengguna dibuat sehalus aplikasi *native*, mencegah praktik "titip absen", dan melindungi privasi riwayat presensi.
*   **Ruang Lingkup:** 
    1. Mengelola autentikasi pengguna dan menyimpan profil sesi beserta **hak akses (role)** ke memori lokal (`LocalStorage`).
    2. Menyediakan formulir pengajuan pertukaran jadwal/izin.
    3. Menyediakan rute Dasbor Pribadi (`/riwayat`) untuk pemantauan presensi dan izin secara privat.
    4. Menyediakan rute Dasbor Admin (`/admin`) dengan fitur Persetujuan Izin Bertingkat, yang hanya bisa diakses oleh pengguna berstatus "Admin".

---

## 2. Struktur Komponen dan Alur Halaman (UI/UX)

### A. Tampilan Login (`/login`) - *Pintu Utama*
*   **Fungsi:** Memvalidasi identitas sebelum asisten bisa menggunakan fitur aplikasi.
*   **Elemen UI:** Input teks untuk NIM, input *password* untuk PIN, dan tombol "Masuk".
*   **Perilaku:** Saat berhasil (respons API `status: "success"`), aplikasi menyimpan objek `userAccount` (berisi `userId`, `userName`, dan `role`) ke `LocalStorage` lalu mengarahkan (*redirect*) pengguna ke rute `/`.

### B. Tampilan Dashboard Utama (`/`)
*   **Fungsi:** Halaman beranda operasional pribadi.
*   **Perilaku & Elemen:** 
    *   Teks sapaan "Halo, [Nama Asisten]".
    *   Tombol "Mulai Piket". Jika `piketSession` (timer absen) aktif, tombol berubah menjadi "Lihat Status Piket".
    *   Tautan "Ajukan Izin / Tukar Jadwal" (`/izin`).
    *   Tautan "Lihat Riwayat Saya" (`/riwayat`).
    *   **[Fitur RBAC]:** Tombol/Tautan "Masuk Panel Admin" (`/admin`). *Elemen ini HANYA dirender (dimunculkan) jika properti `userAccount.role === "Admin"`.*
    *   Tombol "Logout" (untuk menghapus `userAccount` dari memori dan melempar kembali ke `/login`).

### C. Tampilan Form Absen (`/absen`) - *State-Aware Component*
*   **Kondisi 1: Belum Ada Sesi (Absen Masuk)**
    *   *Elemen UI:* Hanya pratinjau kamera *live*, indikator pencarian lokasi, dan tombol "Mulai Piket" (Tidak ada input nama).
    *   *Payload (JSON):* `userId` & `userName` ditarik otomatis dari `LocalStorage`. 
    *   *Penanganan Error:* Wajib menampilkan sembulan (*alert/toast*) jika asisten absen lewat pukul 14:00 WIB.
*   **Kondisi 2: Sesi Sedang Berjalan (Absen Keluar)**
    *   *Elemen UI:* Teks "Waktu Mulai: HH:MM", **Timer Hitung Mundur** 2 Jam, Form Laporan (`textarea`), dan kamera *live*.
    *   *Tombol Dinamis:* Abu-abu (*disabled*) selama *timer* > 0. Aktif merah jika *timer* = 0.

### D. Tampilan Form Izin (`/izin`)
*   **Fungsi:** Halaman pengajuan pengecualian jadwal.
*   **Elemen UI:** Input `date` "Tanggal Berhalangan", `date` "Tanggal Pengganti", `textarea` "Alasan", dan tombol "Kirim".
*   **Payload (JSON):** Status `Izin` dengan identitas disuntikkan dari `LocalStorage`.

### E. Tampilan Riwayat & Dasbor Admin (`/riwayat` & `/admin`)
Kedua rute ini menggunakan API *fetching* yang sama, yakni menarik data melalui GET parameter `?nim=[NIM_DARI_LOCALSTORAGE]`.
*   **Riwayat Pribadi (`/riwayat`):**
    *   Menampilkan Tabel Riwayat Hadir dan Tabel Status Pengajuan Izin khusus milik asisten yang sedang *login*.
*   **Dasbor Admin (`/admin`):** 
    *   *Gatekeeper:* Di dalam komponen, validasi `if (userAccount.role !== "Admin")` paksa *redirect* pengguna kembali ke `/`.
    *   *Data:* Karena NIM yang dikirim adalah milik Admin, *backend* akan secara otomatis menyuplai seluruh data asisten lab LSD.
    *   **Fitur Aksi:** Pada Tabel Pengajuan Izin, terdapat tombol **[Setujui]** (Hijau) dan **[Tolak]** (Merah) di setiap baris berstatus "Menunggu Persetujuan".

    ### E. Tampilan Riwayat & Dasbor Admin (`/riwayat` & `/admin`)
Kedua rute ini menggunakan API *fetching* yang sama, yakni menarik data melalui GET parameter `?nim=[NIM_DARI_LOCALSTORAGE]`.
*   **Riwayat Pribadi (`/riwayat`):**
    *   Menampilkan Tabel Riwayat Hadir dan Tabel Status Pengajuan Izin khusus milik asisten yang sedang *login*.
*   **Dasbor Admin (`/admin`):** 
    *   *Gatekeeper:* Di dalam komponen, validasi `if (userAccount.role !== "Admin")` paksa *redirect* pengguna kembali ke `/`.
    *   *Data:* Karena NIM yang dikirim adalah milik Admin, *backend* akan secara otomatis menyuplai seluruh data asisten lab LSD.
    *   **Fitur Aksi:** Pada Tabel Pengajuan Izin, terdapat tombol **[Setujui]** (Hijau) dan **[Tolak]** (Merah) di setiap baris berstatus "Menunggu Persetujuan".

### F. Tampilan Jadwal Piket (`/jadwal`)
*   **Fungsi:** Halaman referensi bagi asisten untuk melihat matriks jadwal tugas selama satu minggu penuh.
*   **Elemen UI:** Tabel informatif yang memetakan nama-nama asisten berdasarkan kolom hari kerja (Senin s.d. Jumat).
*   **Sumber Data:** Diambil dari *property* `dataJadwal` pada respons JSON fungsi `GET`. Karena data ini bersifat publik (untuk internal lab), data jadwal akan selalu dirender secara penuh (tidak difilter) terlepas dari apakah yang *login* adalah Asisten biasa maupun Admin.

---

## 3. Langkah Implementasi Frontend (Arahan Pengembangan)

### Langkah 1: Konstruksi Sistem Autentikasi Lanjutan
*   **Apa yang dilakukan:** Di `App.jsx`, buat *Router Wrapper* (seperti `RequireAuth`). Jika `localStorage` kosong, arahkan ke `/login`. Khusus untuk rute `/admin`, buat *wrapper* tambahan (`RequireAdmin`) yang mengecek apakah `role === "Admin"`.
*   **Alasannya:** Mencegah asisten biasa yang mengetahui URL `/admin` untuk mengakses halaman tersebut secara paksa.

### Langkah 2: Pembangunan Mesin Hitung Mundur (Timer Engine)
*   **Apa yang dilakukan:** Buat `useEffect` di form absen keluar untuk menghitung selisih batas 2 jam guna memblokir tombol Keluar secara dinamis.

### Langkah 3: Modifikasi Payload Jaringan Bersumber Akun Lokal
*   **Apa yang dilakukan:** Pada fungsi kirim JSON, langsung *inject* nilai dari properti `localStorage.getItem('userAccount')` agar antarmuka bersih dari input manual yang berpotensi salah ketik.

### Langkah 4: Membangun Mekanisme Approval (Persetujuan) Terotorisasi
*   **Apa yang dilakukan:** Di dalam komponen `AdminDashboard.jsx`, buat fungsi `handleApproval(rowId, keputusan)` yang melakukan *request* POST ke API dengan payload:
    `{ status: "UpdateIzin", userId: userAccount.userId, rowId: rowId, keputusan: "Disetujui" / "Ditolak" }`
*   **Alasannya:** Saat tombol "Setuju" ditekan, React mengirimkan `userId` (NIM admin) ke *backend*. *Backend* akan memverifikasi sekali lagi ke *Database* untuk memastikan bahwa NIM tersebut benar-benar memiliki wewenang Admin sebelum mengubah status izin.