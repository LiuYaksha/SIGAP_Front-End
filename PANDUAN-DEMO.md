# Menjalankan demo SIGAP

Frontend ini mengimplementasikan spesifikasi README.md dan referensi `Sigap.dc.html`, termasuk perluasan mobile warga dan surveyor. Dibangun dengan Vite, JavaScript modular, dan CSS tanpa backend.

## Jalankan

Node.js 20.19+ atau 22.12+:

```sh
npm install
npm run dev
```

Buka `http://localhost:5173`. Untuk build produksi:

```sh
npm run build
npm run preview
```

Server preview menggunakan port 4173. Semua foto dan font IBM Plex tersedia lokal. Font berasal dari Google Fonts dan disalin untuk menghindari ketergantungan jaringan saat presentasi.

## Alamat halaman

| Mode               | Alamat setelah host |
| ------------------ | ------------------- |
| Portal publik      | `/#publik`          |
| Ringkasan petugas  | `/#ringkasan`       |
| GIS                | `/#peta`            |
| Detail kasus utama | `/#kasus/CB-1790`   |
| Pra-verifikasi AI  | `/#verifikasi`      |
| Tugas lapangan     | `/#tugas`           |
| Analitik           | `/#analitik`        |
| Ekspor             | `/#ekspor`          |
| Audit log          | `/#audit`           |
| Pengaturan / reset | `/#administrasi`    |
| Mobile warga       | `/#warga`           |
| Mobile surveyor    | `/#surveyor`        |

Pada desktop, mode mobile ditampilkan dalam bingkai ponsel dengan pilihan persona. Pada ponsel, antarmuka mengisi layar. Portal publik memiliki tombol **Mobile**; sidebar petugas juga menyediakan tautan kedua aplikasi mobile.

Untuk mengakses dari ponsel, gunakan alamat **Network** yang dicetak Vite, pada Wi-Fi yang sama. Perubahan hanya berbagi di browser/origin yang sama, termasuk antartab. Perangkat berbeda mempunyai penyimpanan terpisah; frontend ini belum memiliki sinkronisasi lintas perangkat.

## Skenario presentasi

1. **Portal publik**: pilih Desa Ciburuy, buka kartu kasus, tunjukkan status dan privasi. Coba mode daftar serta reset filter.
2. **Dashboard petugas**: tampilkan metrik awal 23 / 14 / 6 / 9 / 11. Angka dihitung dari 37 kasus tiruan dan merespons perubahan.
3. **Antrean AI**: jalankan simulasi AI, bandingkan kandidat, verifikasi atau gabungkan dengan alasan. Status selesai analisis muncul pada kartu.
4. **Detail CB-1790**: buka rincian skor, lakukan override beralasan, verifikasi, lalu tugaskan unit. Tugas langsung muncul di monitoring dan mobile surveyor.
5. **Mobile warga**: aktifkan **Offline**, buat laporan melalui lima langkah (kategori, foto, lokasi, kondisi, review), centang pernyataan, simpan ke antrean. Buka **Sinkron**, aktifkan **Online**, dan sinkronkan. Buka antrean operator untuk melihat laporan baru.
6. **Mobile surveyor**: buka tugas, checklist, mulai survei, gunakan foto demo atau unggah tiga foto, isi dimensi/catatan/rekomendasi. Simpan draft untuk menunjukkan persistensi, lalu kirim hasil. Jika offline, kirim melalui pusat sinkronisasi.
7. **Verifikasi pekerjaan**: buka Tugas & Progres di web, periksa bukti, lalu verifikasi hasil pekerjaan yang mencapai 100%.
8. **Akuntabilitas**: cari perubahan di Audit Log. Unduh GeoJSON/CSV, tampilkan preview PDF, dan jalankan sinkronisasi konektor simulasi.

Untuk mengulang, buka **Administrasi → Reset seluruh data demo → Reset sekarang**. Ini menghapus perubahan demo lokal.

## Batas simulasi

- AI, SLA kalender Juli 2026, konektor pemerintah, serta peta adalah simulasi frontend; tidak ada panggilan MiniMax, PostGIS, SIPD, Satu Data, atau BPS.
- Peta memakai SVG dengan zoom, marker, klaster per desa, heatmap, layer ilustratif, filter, dan drawer. Citra satelit merupakan ilustrasi berwarna; bukan ubin satelit nyata. Grafik tren bersifat ilustratif.
- Offline adalah mode simulasi antrean dalam aplikasi yang sudah dibuka. Aplikasi ini bukan PWA dan belum menyediakan pemasangan atau cold-start tanpa server.
- Foto infrastruktur dibuat untuk demo menggunakan imagegen, ditandai **FOTO SIMULASI**. Foto contoh dapat dipakai berulang pada bukti; bukan dokumentasi tiga sudut nyata. Tidak memuat identitas warga nyata.
- Unggahan foto PNG/JPG/WebP dibatasi 1 MB per berkas. Data disimpan dalam localStorage; kapasitas mengikuti browser. Gunakan foto demo untuk presentasi panjang.
- Audit merupakan riwayat lokal untuk demonstrasi alur, bukan penyimpanan server yang tahan manipulasi.
- PDF menggunakan preview dokumen dan dialog cetak browser: pilih **Simpan sebagai PDF**.

## Pemeriksaan dan screenshot

```sh
npm test
npm run test:e2e
npm run screenshots
npm run format:check
```

Playwright menggunakan Chromium. Jika belum tersedia:

```sh
npx playwright install chromium
```

Screenshot desktop, tablet, mobile, review laporan, dan formulir survei disimpan dalam `artifacts/screenshots`. Laporan pengujian interaktif ada di `artifacts/playwright-report/index.html` setelah tes berjalan.

## Struktur

- `src/app.js`: routing, UI dan interaksi web, peta, dialog, ekspor.
- `src/mobile.js`: UI warga/surveyor, wizard laporan, draft, antrean, survei.
- `src/store.js`: dataset awal, mutasi kasus, audit, penggabungan, GeoJSON.
- `src/style.css`, `src/mobile.css`: tema referensi dan responsivitas.
- `public/assets`: foto simulasi serta font lokal dan atribusi.
- `tests`: pengujian integritas store dan skenario Playwright.
- `scripts`: screenshot yang dapat diulang.

README.md dan Sigap.dc.html dipertahankan sebagai spesifikasi dan sumber referensi.
