# Sistem Reservasi Wawancara

Selamat datang di aplikasi **Sistem Reservasi Wawancara**. Aplikasi ini dirancang untuk memudahkan pengaturan jadwal wawancara bagi peserta (Katekumen) dan pengelola (Admin) dalam sebuah kelompok atau kegiatan.

---

## 📋 Fitur Utama

### Untuk Peserta
1. **Pendaftaran Mudah**: Pilih kelompok Anda, masukkan nama lengkap, dan pilih tanggal wawancara yang masih tersedia.
2. **Verifikasi Nama**: Sistem secara otomatis mengecek apakah nama Anda sudah terdaftar dalam daftar peserta.
3. **Tiket Digital**: Setelah berhasil mendaftar, Anda akan mendapatkan tiket digital yang berisi jadwal dan **Kode Akses**. Tiket ini bisa disimpan sebagai gambar (PNG).
4. **Simpan ke Kalender**: Anda bisa langsung memasukkan jadwal wawancara ke Google Calendar atau kalender HP Anda.
5. **Ubah Jadwal**: Salah pilih tanggal? Gunakan Kode Akses 6-digit Anda untuk mencari data Anda kembali dan mengubah jadwal ke tanggal lain.

### Untuk Pengelola (Admin)
1. **Atur Event**: Membuat kelompok baru, menentukan kapan pendaftaran dibuka, dan menyalin link pendaftaran.
2. **Atur Jadwal**: Menentukan tanggal-tanggal wawancara dan kuota (jumlah maksimal peserta) per hari.
3. **Daftar Peserta**: Memasukkan daftar nama yang diperbolehkan mendaftar (bisa langsung tempel/paste dari Excel).
4. **Laporan & Rekap**: Melihat siapa saja yang sudah mendaftar dan mengunduh laporan dalam format PDF.

---

## 🚀 Cara Menjalankan Aplikasi (Untuk Pengembang)

Jika Anda ingin menjalankan aplikasi ini di komputer sendiri:

1. **Persiapan**: Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/).
2. **Instalasi**:
   ```bash
   npm install
   ```
3. **Pengaturan**: Buat file `.env` di folder utama dan masukkan kunci akses database Anda:
   ```env
   VITE_SUPABASE_URL=url_database_anda
   VITE_SUPABASE_ANON_KEY=kunci_akses_anda
   VITE_ADMIN_PASSWORD=kata_sandi_admin_pilihan_anda
   ```
4. **Jalankan**:
   ```bash
   npm run dev
   ```
   Buka alamat yang muncul di layar (biasanya `http://localhost:5173`) di browser Anda.

---
*Dikembangkan untuk membantu proses administrasi yang lebih rapi dan transparan.*
