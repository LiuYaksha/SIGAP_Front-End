# Panduan Implementasi Frontend Demo SIGAP

Dokumen ini berisi spesifikasi lengkap dan instruksi kerja untuk pembuatan aplikasi web frontend SIGAP (Sistem Informasi Geospasial dan Analitik Pembangunan Desa). Aplikasi ini disiapkan khusus untuk kebutuhan demo dan presentasi juri pada kompetisi Hackathon KMIPN 2026.

Dokumen ini ditujukan langsung kepada developer atau AI agent pelaksana (GPT-6 Astra) agar dapat mengeksekusi seluruh antarmuka web, interaksi, dan skenario data tiruan tanpa memerlukan integrasi backend server aktif.

---

## 1. Ringkasan Proyek dan Tujuan Demo

### 1.1 Konteks Aplikasi
SIGAP adalah platform pemetaan, verifikasi, dan monitoring pembangunan infrastruktur desa berbasis AI agentic dan geospasial. Platform ini menyelesaikan masalah kesenjangan pembangunan desa, data infrastruktur yang belum terintegrasi, serta lambatnya respons terhadap laporan kerusakan fasilitas publik.

Dalam proposal kompetisi, sistem SIGAP memiliki modul AI pra-verifikasi (MiniMax M3), analitik spasial (PostGIS), konsolidasi laporan duplikat berbasis radius, dan sistem scoring prioritas penanganan.

### 1.2 Tujuan Khusus Demo Frontend
1. Menghadirkan prototype web interaktif berkualitas tinggi yang siap dipresentasikan di hadapan dewan juri.
2. Seluruh alur kerja dapat didemonstrasikan secara mandiri di sisi client (frontend-only) tanpa bergantung pada backend atau database eksternal.
3. Seluruh interaksi penting (pindah halaman, filter peta, pembukaan modal, perubahan status laporan, penyesuaian skor prioritas, dan simulasi AI) harus berfungsi lancar dengan data tiruan (mock data) yang realistis.
4. Ruang lingkup pengerjaan saat ini difokuskan penuh pada platform Web (Desktop dan Tablet). Antarmuka mobile aplikasi warga dan surveyor tidak perlu dibuat pada tahap ini.

---

## 2. Acuan Desain dan Standar Visual

Desain antarmuka wajib mengacu secara konsisten pada rancangan visual yang terdapat pada berkas `Sigap.dc.html`, khususnya pada segmen layar Website W-02, W-04, dan P-02.

### 2.1 Tipografi
- Font Utama: IBM Plex Sans (bobot 400, 500, 600, 700).
- Font Data dan Teknis: IBM Plex Mono (untuk nomor tiket, ID kasus, koordinat GPS, stempel waktu, dan angka tabular).
- Angka tabular menggunakan kelas CSS khusus: font-variant-numeric: tabular-nums.

### 2.2 Skema Warna
- Sidebar Dashboard: Hijau Hutan Gelap (#16302b), teks navigasi (#cfe4df), pembatas (#234a43).
- Warna Utama (Aksen / Tombol Aksi): Teal (#0f7a6b), hover (#0a5c50), latar lembut (#e2f1ee), border (#bfe0d9).
- Warna Latar Belakang: Area luar (#e6e8e3), kartu/kontainer (#ffffff), latar halaman (#f9faf8 dan #f4f5f3).
- Warna Garis Pembatas (Border): Netral terang (#e4e7e2), pembatas panel (#d3d7d0), pembatas tipis (#eef0ec).
- Warna Teks: Teks utama (#17191c), teks sekunder (#3a3f45), teks label/penjelasan (#616770), teks non-aktif (#8a9099).

### 2.3 Warna Status Indikator
- Status Kritis / Terlambat / SLA Terlewat: Merah (#c0392b), latar (#f8e2de), teks badge (#a5271a).
- Status Menunggu Verifikasi / Peringatan / Offline: Amber (#b8730a), latar (#f8ecd6), teks badge (#8a5808).
- Status Diproses / Sedang Ditangani: Biru (#2563eb), latar (#e5edfd), teks badge (#1d4ed8).
- Status Terverifikasi / Selesai / Online: Teal Hijau (#0f7a6b), latar (#e2f1ee), teks badge (#0a5c50).
- Status Netral / Arsip / Log: Abu-abu (#616770), latar (#eef0ec).

### 2.4 Karakteristik Komponen
- Radius sudut kartu: 10px hingga 14px.
- Radius sudut tombol: 8px hingga 10px.
- Tombol aksi utama: latar belakang solid #0f7a6b, warna teks putih, font-weight 600 atau 700.
- Tombol aksi sekunder: latar belakang putih, border 1px solid #e4e7e2, teks #3a3f45.
- Badge status berbentuk kapsul bulat (pill badge) dengan titik indikator bundar kecil berdiameter 6px hingga 7px di sisi kiri teks.
- Panel atas tiruan jendela peramban (mock browser header) dengan tiga titik indikator (merah, kuning, hijau) dan bar URL untuk memberikan kesan visual aplikasi web terpadu.

---

## 3. Arsitektur Teknis dan Aturan Frontend

### 3.1 Pendekatan Teknologi
Developer pelaksana bebas memilih tumpukan teknologi frontend yang paling efisien, cepat, dan stabil untuk dijalankan secara lokal:
- Opsi A (Direkomendasikan): SPA berbasis Vite + React atau Next.js (App Router), dipadukan dengan Vanilla CSS, CSS Modules, atau Tailwind CSS dengan konfigurasi warna tema di atas.
- Opsi B: Multi-page / Single-page HTML5, CSS3, dan Vanilla JavaScript modern tanpa proses build kompleks.

### 3.2 Manajemen Data Tiruan (Mock Data Store)
- Seluruh data awal (kasus, laporan warga, tugas lapangan, konfigurasi skor, dan audit log) disimpan di dalam file JavaScript atau JSON terstruktur.
- Untuk interaktivitas demo, gunakan penyimpanan client (State Management React atau LocalStorage browser) agar penambahan laporan, verifikasi kasus, penggabungan tiket, atau override skor dapat langsung terlihat dampaknya pada antarmuka tanpa memuat ulang halaman.

---

## 4. Struktur Navigasi dan Halaman yang Wajib Dibuat

Aplikasi web demo SIGAP terdiri dari dua mode utama:
1. Portal Publik (dapat diakses masyarakat umum tanpa login).
2. Dashboard Internal Pemerintah dan Operator (memerlukan konteks peran operator/verifikator).

Berikut rincian spesifikasi untuk masing-masing halaman.

---

### Halaman 1: Portal Publik (Peta dan Pemantauan Transparan)
Kode Referensi Desain: P-02

Tujuan Halaman:
Memberikan transparansi kepada masyarakat umum mengenai status penanganan fasilitas desa yang rusak tanpa membuka data pribadi pelapor.

Komponen dan Tata Letak:
1. Header Publik:
   - Logo SIGAP (PantauDesa) dengan label badge "Portal Publik".
   - Navigasi menu: Ringkasan, Peta & Daftar, Statistik Publik, Metodologi.
   - Tombol "Masuk Petugas" dan tombol "Lapor Masalah".
2. Filter Bar Horizontal:
   - Dropdown pilihan wilayah (contoh: Kecamatan Cisarua, Desa Ciburuy, Semua Desa).
   - Dropdown pilihan kategori infrastruktur (Jalan, Jembatan, Air Bersih, Irigasi, Fasilitas Umum).
   - Filter pill aktif: "Sedang ditangani", "Juli 2026", tombol Reset.
   - Penghitung jumlah kasus yang sesuai filter (contoh: "37 kasus ditemukan").
   - Tombol toggle tampilan: Mode Peta dan Mode Daftar.
3. Area Tampilan Utama (Split View Peta dan Daftar):
   - Kolom Kiri (Peta Interaktif):
     - Kanvas peta digital (dapat menggunakan Leaflet.js dengan OpenStreetMap atau kanvas mock interaktif bergrid geospasial).
     - Titik klaster geospasial dengan lingkaran representasi jumlah laporan (misal: klaster biru angka 12, klaster hijau angka 18, klaster kuning angka 7).
     - Kotak legenda status di sudut kiri bawah: Terverifikasi, Menunggu Verifikasi, Sedang Ditangani.
     - Kotak catatan privasi di sudut kanan bawah: "Lokasi digeneralisasi untuk melindungi privasi pelapor (UU PDP No. 27/2022)".
   - Kolom Kanan (Daftar Kasus Publik):
     - Kolom pencarian wilayah atau fasilitas.
     - Kartu kasus publik berisi: inisial kategori dalam kotak warna (JL, JB, AR, LP), judul masalah, nama desa, waktu pembaruan terakhir, badge status, dan jumlah laporan pendukung warga.
     - Klik pada kartu akan menampilkan modal popup detail publik berisi ringkasan progres perbaikan, foto kondisi lapangan yang telah disensor/dimoderasi, dan estimasi selesai.
4. Modal Demo "Buat Laporan Cepat":
   - Formulir sederhana bagi pengunjung untuk mencoba simulasi pengiriman laporan baru (pilih kategori, tulis deskripsi, unggah foto demo, pilih titik koordinat). Laporan ini langsung masuk ke antrean verifikasi operator.

---

### Halaman 2: Dashboard Ringkasan Operasional Pemerintah
Kode Referensi Desain: W-02

Tujuan Halaman:
Memberikan ringkasan eksekutif bagi Kepala Desa, Camat, atau Operator Dinas mengenai kondisi pembangunan dan antrean penanganan hari ini.

Komponen dan Tata Letak:
1. Sidebar Navigasi Kiri (Warna #16302b):
   - Logo dan nama aplikasi "PantauDesa / SIGAP".
   - Item menu:
     - Ringkasan (aktif)
     - Peta & Kasus
     - Antrean Verifikasi (dengan badge angka merah "14")
     - Tugas & Progres
     - Analitik & Heatmap
     - Ekspor Laporan
   - Bagian bawah sidebar:
     - Administrasi
     - Audit Log
2. Header Atas:
   - Input pencarian global (cari kasus, desa, atau kode ID).
   - Selector cakupan wilayah aktif (misal: "Kec. Cisarua - Jul 2026").
   - Avatar dan inisial profil operator ("BM - Budi Maulana").
3. Baris Ringkasan Utama:
   - Judul: "Apa yang harus ditangani hari ini?"
   - Subjudul: "Data per 17 Jul 2026 08:40 WIB - cakupan 8 desa".
   - 5 Kartu Metrik Antrean (Queue Cards):
     - Kasus Baru (Angka: 23, garis atas biru)
     - Perlu Verifikasi (Angka: 14, garis atas kuning amber)
     - SLA Terlewat (Angka: 6, garis atas merah)
     - Prioritas Tinggi (Angka: 9, garis atas teal)
     - Perlu Kelengkapan (Angka: 11, garis atas abu-abu)
4. Tata Letak Dua Kolom Bawah:
   - Kolom Kiri:
     - Grafik Batang Umur Backlog Kasus: Perbandingan laporan masuk vs kasus terselesaikan selama 30 hari terakhir.
     - Widget Peta Ringkas Kasus: Menampilkan visualisasi sebaran titik kasus dengan tombol tautan "Buka Peta & Kasus Penuh".
   - Kolom Kanan:
     - Panel Kasus Kritis: Daftar kasus dengan indikator merah/kuning yang membutuhkan perhatian segera, dilengkapi kode kasus (contoh: CB-1790, CB-1802), nama desa, dan penanda sisa batas SLA (contoh: SLA -1h, SLA 2j).
     - Panel Kualitas & Sinkronisasi Data: Indikator persentase sinkronisasi (98% laporan tersinkron) dan penghitung laporan menunggu koneksi surveyor.

---

### Halaman 3: Detail Kasus dan Workspace Operator
Kode Referensi Desain: W-04

Tujuan Halaman:
Pusat kerja operator pemerintah untuk memeriksa bukti, menganalisis penilaian AI, menyesuaikan skor prioritas, menggabungkan kasus duplikat, dan menugaskan unit penanganan.

Komponen dan Tata Letak:
1. Header Detail Kasus:
   - Breadcrumb: "Peta & Kasus / CB-1790".
   - Tag kategori (contoh: "JEMBATAN") dan Judul Kasus: "Jembatan retak RW 07, Dusun Kaler".
   - Deretan badge status: "Menunggu verifikasi", "Prioritas tinggi", "SLA terlewat 1j", dan teks "Desa Kaler - 8 laporan pendukung".
   - Tombol tindakan cepat di sudut kanan atas: Tombol "Gabungkan Kasus" dan tombol "Verifikasi Kasus".
2. Navigasi Tab Internal Kasus:
   - Tab 1: Ringkasan (default aktif)
   - Tab 2: Bukti & Laporan
   - Tab 3: Verifikasi
   - Tab 4: Tugas & Progres
   - Tab 5: Riwayat Audit
3. Konten Tab Ringkasan (Struktur Dua Kolom):
   - Kolom Kiri (Data Analisis dan Bukti):
     - Baris Lokasi dan Dampak:
       - Mini preview peta titik koordinat presisi (-6.8698, 107.5401).
       - Kartu Dampak Masalah: Akses terputus untuk 2 dusun, risiko keselamatan tinggi, layanan sekolah terganggu. Keterangan konsolidasi otomatis dari 8 laporan warga dalam radius 120 meter.
     - Panel Skor Prioritas Cerdas (Priority Scoring Panel):
       - Nilai total skor besar: "82 / 100" dengan label "Confidence tinggi" dan versi formula "model v2.3".
       - Tombol "Override beralasan" untuk simulasi intervensi manual oleh operator.
       - Bar rincian komponen skor:
         - Keselamatan (+34 poin)
         - Jumlah warga terdampak (+22 poin)
         - Jumlah laporan pendukung (+16 poin)
         - Kelewatan batas waktu SLA (+10 poin)
     - Galeri Laporan Pendukung:
       - Thumbnail foto bukti dari warga pelapor yang telah dikonsolidasikan.
       - Tombol tautan "Bandingkan kandidat duplikat".
   - Kolom Kanan (Timeline dan Jejak Keputusan):
     - Garis waktu vertikal aktivitas penanganan:
       - Menunggu verifikasi manual (sistem mendeteksi risiko tinggi).
       - 3 laporan digabung oleh operator Budi Maulana.
       - Kasus dibuat dari hasil konsolidasi otomatis AI.
       - Laporan pertama diterima dari warga.
     - Kotak informasi perlindungan privasi data warga pelapor.
4. Sticky Action Bar Bawah:
   - Label "Aksi kasus:" di sisi kiri.
   - Tombol-tombol aksi interaktif:
     - "Ubah Status" (membuka dropdown pilihan status).
     - "Ekspor Kasus" (simulasi unduh PDF/GeoJSON).
     - "Tugaskan Unit" (membuka modal penugasan unit teknis lapangan).
     - "Verifikasi & Prioritaskan" (tombol utama untuk menyelesaikan tahap verifikasi).

---

### Halaman 4: Antrean Verifikasi dan Konsolidasi AI Agent
Kode Referensi: Ekstensi tema berdasarkan SAD Gambar 3 dan Gambar 6 proposal.

Tujuan Halaman:
Menampilkan keunggulan utama sistem SIGAP, yaitu pra-verifikasi berbasis model visual (MiniMax M3) dan konsolidasi laporan duplikat berbasis radius spasial.

Komponen dan Tata Letak:
1. Header Halaman:
   - Judul: "Antrean Pra-Verifikasi AI & Konsolidasi".
   - Keterangan: "Pemeriksaan otomatis metadata, validasi foto, dan pengelompokan laporan dalam radius 50-100 meter".
   - Filter status: Semua, Perlu Verifikasi Manusia, Terindikasi Duplikat, Kualitas Media Rendah.
2. Kartu Konsolidasi Fasilitas (Facility Cards):
   Setiap kartu mewakili satu titik fasilitas yang telah mengelompokkan beberapa laporan warga:
   - Header kartu: Nama fasilitas dan jarak radius pengelompokan.
   - Penilaian Agen AI (AI Assessment Badges):
     - Skor Keaslian Bukti: "94% Asli" (validitas EXIF GPS & Timestamp).
     - Deteksi Kerusakan Visual: "Kerusakan teridentifikasi: Retak struktural / Lubang jalan".
     - Indikasi Duplikasi: "Tinggi (3 laporan mengarah pada objek yang sama)".
   - Galeri perbandingan foto dari sudut berbeda.
   - Tombol aksi verifikator:
     - "Setujui Sebagai Kasus Baru"
     - "Gabungkan ke Kasus Eksisting"
     - "Kirim Tugas Survei Lapangan"
     - "Minta Foto Tambahan ke Warga"
     - "Tolak Laporan (Beri Alasan)"
3. Modal Dialog Perbandingan Laporan Duplikat:
   - Tampilan perbandingan dua laporan bersisian (side-by-side comparison).
   - Membandingkan foto, waktu pelaporan, jarak GPS antar-titik, dan deskripsi warga untuk memudahkan verifikator mengambil keputusan penggabungan.

---

### Halaman 5: Peta GIS Penuh dan Sebaran Kasus
Kode Referensi: Ekstensi tema W-02 dan P-02.

Tujuan Halaman:
Menyediakan antarmuka GIS analitik bagi operator untuk memantau sebaran kasus di seluruh desa dalam satu layar penuh.

Komponen dan Tata Letak:
1. Peta Interaktif Layar Penuh:
   - Layer kontrol: Pilihan layer peta standar, citra satelit, batas administratif desa, dan sebaran fasilitas publik.
   - Toggle visualisasi: Titik Kasus Individu, Klaster Spasial, dan Heatmap Tingkat Kerusakan.
2. Panel Filter Mengambang (Floating Filter Card):
   - Filter tingkat keparahan: Kritis, Berat, Ringan.
   - Filter kategori: Jalan, Jembatan, Air Bersih, Penerangan, Irigasi.
   - Filter status SLA: Normal, Mendekati SLA, Melewati SLA.
3. Slide-Over Panel Kanan (Drawer Detail Kasus Cepat):
   - Ketika salah satu marker di peta diklik, panel samping kanan akan bergeser masuk menampilkan ringkasan kasus, foto bukti, skor prioritas, dan tombol langsung menuju halaman detail kasus penuh.

---

### Halaman 6: Tugas & Progres Lapangan (Monitoring Surveyor & Unit Teknis)
Kode Referensi: Ekstensi tema berdasarkan alur use-case Surveyor & Unit Teknis.

Tujuan Halaman:
Memantau kemajuan pekerjaan survei dan perbaikan fisik yang sedang dikerjakan oleh petugas di lapangan.

Komponen dan Tata Letak:
1. Tab Filter: Semua Tugas, Tugas Survei Verifikasi, Tugas Perbaikan Fisik.
2. Tabel Monitoring Tugas Interaktif:
   - Kolom Kode Tugas (contoh: TGS-3391, TGS-3402).
   - Kolom Kasus Terkait dan Wilayah.
   - Kolom Petugas / Unit Penanggung Jawab (contoh: Dinas PUPR Wilayah II, Surveyor Dedi).
   - Kolom Batas SLA & Status Waktu (Normal / Sisa 4 Jam / Terlambat 1 Hari).
   - Kolom Progress Bar (0% baru ditugaskan, 50% pengerjaan berjalan, 100% selesai menunggu verifikasi penutupan).
   - Kolom Bukti Pekerjaan: Foto kondisi awal (Sebelum) vs Foto progres (Sesudah).
   - Kolom Aksi: Tombol untuk melihat detail laporan lapangan atau verifikasi hasil pekerjaan.

---

### Halaman 7: Ekspor & Integrasi Sistem Pemerintah
Kode Referensi: Ekstensi tema berdasarkan integrasi SIPD / Satu Data Indonesia.

Tujuan Halaman:
Mendemonstrasikan kesiapan platform untuk interoperabilitas dengan sistem perencanaan dan penganggaran pemerintah daerah.

Komponen dan Tata Letak:
1. Panel Ekspor Dokumen Standar:
   - Tombol ekspor format: GeoJSON (data geospasial desa), CSV (tabel rekapitulasi penanganan), dan PDF (Laporan Pertanggungjawaban Pembangunan).
   - Tombol simulasi unduh yang menghasilkan berkas contoh nyata atau menampilkan preview dokumen siap cetak.
2. Panel Simulasi Integrasi Asinkron (Outbox Monitoring):
   - Status konektor API ke: Portal Satu Data Indonesia, SIPD Kemendagri, dan Sistem BPS.
   - Indikator status: "Tersambung (Hijau)", stempel waktu sinkronisasi terakhir, dan jumlah data yang telah dikirimkan.
   - Tombol "Jalankan Sinkronisasi Manual" yang menampilkan animasi proses sinkronisasi berhasil.

---

### Halaman 8: Audit Log dan Tata Kelola
Kode Referensi: Ekstensi tema navigasi W-02.

Tujuan Halaman:
Menampilkan kepatuhan terhadap transparansi dan akuntabilitas keputusan pemerintah desa, di mana setiap intervensi (seperti perubahan skor prioritas atau penggabungan tiket) tercatat rapi.

Komponen dan Tata Letak:
1. Filter Pencarian Log: Berdasarkan tanggal, nama aktor, jenis tindakan, atau ID kasus.
2. Tabel Rekam Jejak Audit:
   - Timestamp dan Korelasi ID.
   - Nama Pengguna & Peran (contoh: Budi Maulana - Operator, Hendra - Verifikator).
   - Aksi yang Dilakukan (contoh: "Override Skor Prioritas", "Penggabungan Kasus", "Perubahan Status ke Selesai").
   - Nilai Sebelum dan Nilai Sesudah (contoh: Skor 72 diubah menjadi 85).
   - Alasan Wajib yang Dicantumkan oleh Petugas.

---

## 5. Dataset Tiruan Realistis (Mock Data Requirements)

Untuk mendukung demo yang hidup dan meyakinkan, developer wajib menyertakan data tiruan yang memiliki konteks pedesaan Indonesia:

1. Data Wilayah Demo:
   - Kabupaten / Kota: Kabupaten Penajam Paser Utara (Kawasan Penyangga IKN) atau Kabupaten Bandung Barat (Kecamatan Cisarua).
   - Desa yang Digunakan: Desa Ciburuy, Desa Kaler, Desa Girang, Desa Wetan, Dusun Babakan, Dusun Patrol.
2. Contoh Entitas Kasus Utama:
   - Kasus 1: "Jembatan retak RW 07, Dusun Kaler" (Kategori: Jembatan, Skor: 82, SLA: Terlewat 1 jam, Status: Menunggu Verifikasi).
   - Kasus 2: "Jalan berlubang parah akses Pasar Ciburuy" (Kategori: Jalan, Skor: 74, SLA: 4 jam, Status: Sedang Ditangani).
   - Kasus 3: "Pipa distribusi air bersih bocor 3 dusun" (Kategori: Air Bersih, Skor: 89, SLA: 2 jam, Status: Menunggu Verifikasi).
   - Kasus 4: "Penerangan jalan desa mati sepanjang 500 meter" (Kategori: Fasilitas Umum, Skor: 45, SLA: 2 hari, Status: Menunggu Penugasan).
   - Kasus 5: "Longsoran tebing menutup saluran irigasi sawah" (Kategori: Irigasi, Skor: 91, SLA: Kritis, Status: Perlu Survei Cepat).
3. Gambar Placeholder:
   - Gunakan foto infrastruktur pedesaan nyata atau placeholder bertema jalan berlubang, jembatan kayu/beton retak, saluran pipa air, dan tiang lampu agar tampilan terlihat realistis tanpa kotak kosong abu-abu polos.

---

## 6. Skenario Alur Demo Presentasi (Demo Flow Script)

Aplikasi harus memudahkan presenter mendemokan skenario berikut di depan juri:

1. Tahap 1 (Transparansi Publik):
   Buka Portal Publik P-02, tunjukkan peta geospasial desa, saring kasus di Desa Ciburuy, dan tunjukkan bahwa identitas warga pelapor tetap terlindungi berkat proyeksi data teredaksi.
2. Tahap 2 (Monitoring Operasional Pemerintah):
   Masuk ke Dashboard W-02, jelaskan metrik apa saja yang memerlukan perhatian segera (kasus kritis dan batas waktu SLA).
3. Tahap 3 (Kecerdasan Buatan dan Verifikasi):
   Buka halaman Antrean Verifikasi, tunjukkan bagaimana sistem AI mengelompokkan 3 laporan warga yang lokasinya berdekatan menjadi satu kartu fasilitas, serta memperlihatkan skor keaslian foto.
4. Tahap 4 (Manajemen Detail Kasus):
   Buka halaman Detail Kasus W-04 (CB-1790), perlihatkan rincian skor prioritas berbasis 4 faktor, simulasikan penugasan ke Unit Dinas Teknis, dan perbarui status kasus.
5. Tahap 5 (Akuntabilitas dan Ekspor):
   Buka halaman Audit Log untuk membuktikan bahwa seluruh penyesuaian tersimpan aman, lalu buka halaman Ekspor untuk memperlihatkan data siap kirim ke Satu Data Indonesia atau SIPD.

---

## 7. Instruksi Pelaksanaan untuk GPT-6 Astra

Saat mengeksekusi pembuatan kode frontend website ini:

1. Buat struktur berkas yang bersih, rapi, dan mudah dipahami.
2. Pastikan font IBM Plex Sans dan IBM Plex Mono dimuat secara optimal melalui Google Fonts.
3. Seluruh interaksi tombol (seperti tombol tab, modal, filter dropdown, dan tombol ubah status) harus memberikan respons visual yang nyata saat diklik oleh pengguna.
4. Jangan menyisakan teks placeholder seperti "Lorem Ipsum" atau komponen yang bertuliskan "TODO". Seluruh konten harus memiliki teks dan konteks bahasa Indonesia yang konsisten sesuai pedoman di atas.
5. Pastikan kode dapat langsung dijalankan dengan perintah standar (misalnya: `npm run dev` atau cukup membuka berkas HTML utama pada browser).
6. Berikan petunjuk singkat di terminal atau file pengantar mengenai cara menjalankan proyek setelah kode selesai dibuat.

---

## Implementasi demo

Frontend web dan mobile warga/surveyor telah ditambahkan. Jalankan `npm install` lalu `npm run dev`. Panduan halaman, skenario presentasi, batas simulasi, dan pengujian terdapat di [PANDUAN-DEMO.md](PANDUAN-DEMO.md).
