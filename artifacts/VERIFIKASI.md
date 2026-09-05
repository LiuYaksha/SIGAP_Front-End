# Verifikasi demo SIGAP

Pengujian dilakukan menggunakan Chromium melalui Playwright.

- Build produksi Vite berhasil.
- Empat tes integritas data: hitungan antrean, override dan audit, konservasi laporan saat merge, GeoJSON.
- Sebelas tes end-to-end: portal dan filter, laporan baru/persistensi, override/verifikasi/penugasan, merge, simulasi AI dan keputusan antrean, GIS/layer/zoom, ekspor dan sinkronisasi, progres dan penutupan tugas, laporan warga offline sampai antrean operator, draft dan hasil survei, pemeriksaan rute responsif.
- Rute web dan mobile diperiksa pada 1440 × 1000, 820 × 1180, dan 390 × 844. Tidak ditemukan overflow horizontal atau error JavaScript pada pemeriksaan tersebut.
- Delapan belas screenshot disimpan pada `screenshots/`, mencakup portal, dashboard, detail, antrean, tablet, mobile warga/surveyor, lima langkah laporan, detail tugas, form survei, dan sinkronisasi.

Iterasi visual memperbaiki peta mini dan legenda yang bertumpuk, kerapatan dashboard tablet, kontrol unggah foto mobile, keterjangkauan aksi utama surveyor, serta font lokal untuk kestabilan pemuatan.

Ini adalah validasi frontend demo pada viewport dan browser yang diuji, bukan klaim kesempurnaan lintas seluruh perangkat. Petunjuk menjalankan ulang tersedia di `PANDUAN-DEMO.md`.
