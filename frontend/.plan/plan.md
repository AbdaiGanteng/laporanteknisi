# Implementation Plan

Keputusan implementasi:
- Workspace aktual kosong dan folder `frontend` belum ada; aplikasi dibuat sebagai proyek Vite terpisah di `frontend/`, sehingga tidak menyentuh atau menimpa calon backend Laragon di `api/`, `config/`, atau `uploads/` pada root.
- Gunakan React `18.3.1`, React DOM `18.3.1`, Vite `5.4.14`, dan `@vitejs/plugin-react` `4.3.4`, seluruhnya exact tanpa `^`/`~`; kombinasi ini stabil dan kompatibel dengan Node.js 18+ serta tidak memerlukan framework UI besar.
- Gunakan native `fetch`, CSS Modules untuk komponen, dan CSS global untuk reset/layout aplikasi. Ini menjaga bundle sederhana, styling terisolasi, dan memenuhi kebutuhan UI mobile-first tanpa dependency tambahan.
- Semua state form, validasi tahap, pengelolaan foto/Object URL, GPS, dan submit ditempatkan di komponen reusable `InstallationForm`; `App.jsx` hanya menjadi contoh integrasi nyata dan dapat meneruskan prop `apiUrl`.

- [ ] 1. Siapkan kerangka aplikasi Vite React terpisah dengan dependency exact dan konfigurasi build minimal.
      Buat manifest dengan script `dev`, `build`, dan `preview`, konfigurasi plugin React, entry HTML, contoh environment endpoint, serta ignore file untuk artefak lokal agar aplikasi dapat dipasang dan dibangun tanpa memengaruhi backend di root.
      Files: `frontend/package.json`, `frontend/vite.config.js`, `frontend/index.html`, `frontend/.env.example`, `frontend/.gitignore`
      Verify: dari `d:\website_ppn\laporanteknisi\frontend`, jalankan `npm install` lalu `npm run build`; instalasi selesai dan Vite menghasilkan bundle produksi di `dist/` tanpa error.

- [ ] 2. Buat entry React, shell aplikasi, dan fondasi visual global mobile-first.
      Mount aplikasi melalui `src/main.jsx`, gunakan `src/App.jsx` sebagai contoh nyata pemakaian `<InstallationForm />`, dan definisikan reset, font system, warna dasar, focus visibility, serta layout responsif di CSS global. Biarkan resolusi endpoint di komponen mengikuti prioritas prop `apiUrl`, `VITE_API_URL`, lalu `/api/installations.php`.
      Files: `frontend/src/main.jsx`, `frontend/src/App.jsx`, `frontend/src/index.css`
      Verify: jalankan `npm run build` dari `frontend`; entry JSX dan seluruh import CSS terkompilasi tanpa error.

- [ ] 3. Implementasikan tahap 1 dan 2 pada komponen `InstallationForm` beserta validasi bertahap dan akses GPS.
      Buat stepper tiga tahap yang selalu terlihat dan mempertahankan state saat navigasi; tahap pelanggan memuat `name`, `address`, `phone`, `latitude`, `longitude`, sedangkan tahap teknis memuat `odp_code`, `odp_port`, `ont_sn`, `ont_mac`, `stb_sn`, `stb_mac`, `rx_optical_power`, `port_status`, dan `vlan_id`. Validasi hanya field wajib, rentang koordinat, angka negatif/desimal Rx, dan VLAN 1–4094; tampilkan error inline, fokuskan field invalid pertama, sediakan keyboard/input type mobile yang sesuai, serta izinkan format perangkat lapangan yang fleksibel dan STB opsional.
      Tambahkan tombol GPS touch-friendly menggunakan `navigator.geolocation.getCurrentPosition` dengan `enableHighAccuracy`, state loading, koordinat yang tetap dapat diedit manual, serta pesan ramah untuk unsupported, izin ditolak, unavailable, dan timeout.
      Files: `frontend/src/components/InstallationForm.jsx`, `frontend/src/components/InstallationForm.module.css`
      Verify: jalankan `npm run build`; build sukses. Lalu buka hasil melalui server HTTP lokal secara manual dan pastikan tombol Lanjut tertahan pada field wajib/rentang invalid, fokus berpindah ke error pertama, nilai tidak hilang setelah Sebelumnya/Lanjut, GPS mengisi koordinat bila diizinkan, dan input koordinat manual tetap bisa digunakan bila GPS gagal.

- [ ] 4. Tambahkan tahap foto reusable dengan pemilihan kamera/file, drag-and-drop, preview aman, dan ringkasan konfirmasi.
      Buat empat kartu wajib bernama persis `speedtest_photo`, `house_photo`, `odp_photo`, dan `device_photo`; masing-masing mendukung klik/pilih, `accept="image/*"`, `capture="environment"`, drag-and-drop, thumbnail, nama/ukuran, hapus, dan ganti. Tolak MIME non-gambar atau file di atas 5 MB per kartu dengan error lokal, dan kelola setiap `URL.createObjectURL` dengan `URL.revokeObjectURL` saat file diganti/dihapus, reset, atau komponen unmount.
      Tampilkan ringkasan teks pelanggan, lokasi, perangkat, sinyal, dan status empat foto tanpa menampilkan gambar ukuran penuh sebelum pengiriman.
      Files: `frontend/src/components/InstallationForm.jsx`, `frontend/src/components/InstallationForm.module.css`
      Verify: jalankan `npm run build`; build sukses. Dalam pemeriksaan manual via HTTP, pastikan semua kartu menerima gambar valid dari picker/drop, menampilkan preview dan metadata, menolak file salah/lebih dari 5 MB, dapat diganti/dihapus, serta mencegah Kirim jika salah satu foto belum valid.

- [ ] 5. Implementasikan submit multipart yang defensif, feedback accessible, dan reset lengkap setelah sukses.
      Susun `FormData` dengan seluruh nama field teks persis seperti skema API dan keempat objek `File`, pertahankan VLAN sebagai string, lalu POST menggunakan native `fetch` tanpa menetapkan `Content-Type`. Gunakan endpoint dengan prioritas prop `apiUrl` → `import.meta.env.VITE_API_URL` → `/api/installations.php`; tangani respons JSON sukses/error, respons non-JSON/non-2xx, dan network error tanpa mencatat data sensitif.
      Tambahkan state submitting yang menonaktifkan navigasi dan mencegah double submit, overlay/spinner atau indikator tombol yang jelas, serta notifikasi sukses/gagal dengan `aria-live`. Setelah sukses, revoke seluruh preview URL, kosongkan data/error/foto, dan kembalikan stepper ke tahap 1.
      Files: `frontend/src/components/InstallationForm.jsx`, `frontend/src/components/InstallationForm.module.css`
      Verify: jalankan `npm run build`; build sukses. Dengan endpoint uji/backend tersedia, periksa Network bahwa request adalah multipart ke URL terkonfigurasi, semua nama field tepat, header boundary dibuat browser, klik ganda tidak membuat request kedua, respons error/non-JSON tampil ramah, dan respons sukses mereset form ke tahap 1.

- [ ] 6. Selesaikan UI responsif/accessibility dan dokumentasi integrasi Laragon berbahasa Indonesia.
      Pastikan card putih/abu muda dengan satu aksen biru/teal, target sentuh minimal sekitar 44 px, label eksplisit, elemen semantic, ARIA secukupnya, kontras/focus state jelas, layout satu kolom di mobile dan maksimal dua kolom di layar lebih besar, serta animasi dinonaktifkan melalui `prefers-reduced-motion`. Dokumentasikan struktur, prasyarat Node, `npm install`, `npm run dev` (dijalankan manual), `npm run build`, konfigurasi `.env` dengan contoh URL Laragon generik, fallback same-origin, prioritas prop `apiUrl`, dan kebutuhan CORS jika origin frontend/backend berbeda.
      Files: `frontend/src/components/InstallationForm.module.css`, `frontend/src/index.css`, `frontend/README.md`
      Verify: dari `d:\website_ppn\laporanteknisi\frontend`, jalankan `npm run build` dan pastikan selesai tanpa error serta menghasilkan `dist/`; tinjau manual pada viewport ponsel dan desktop untuk memastikan stepper tetap terlihat, target kontrol mudah disentuh, fokus keyboard terlihat, layout responsif, dan reduced-motion dihormati.

## Checklist Verifikasi Persyaratan

- [ ] Frontend hanya dibuat di `d:\website_ppn\laporanteknisi\frontend`; tidak ada file backend root yang dihapus atau ditimpa.
- [ ] Dependency React/Vite/plugin ditulis sebagai versi exact yang kompatibel tanpa `^` atau `~`.
- [ ] Stepper memiliki tepat 3 tahap: Pelanggan & Lokasi, Perangkat & Sinyal, Foto Bukti + konfirmasi/kirim.
- [ ] Stepper selalu terlihat; tombol Sebelumnya/Lanjut/Kirim besar, jelas, dan touch-friendly.
- [ ] Validasi per tahap mencegah navigasi/submit, menampilkan pesan inline, memfokuskan error pertama, dan state bertahan saat bolak-balik.
- [ ] `name`, `address`, `phone`, `latitude`, dan `longitude` wajib; latitude -90..90 dan longitude -180..180 serta dapat dikoreksi manual.
- [ ] GPS memakai high accuracy, mempunyai loading state, dan pesan ramah untuk unsupported, permission denied, unavailable, serta timeout.
- [ ] Field teknis lengkap; hanya `stb_sn` dan `stb_mac` opsional, Rx menerima negatif/desimal, VLAN 1–4094 dan dikirim sebagai string, serta status port tetap string.
- [ ] Empat foto wajib memakai nama persis `speedtest_photo`, `house_photo`, `odp_photo`, `device_photo`.
- [ ] Tiap foto mendukung kamera/file picker, drag-and-drop, preview, nama/ukuran, hapus/ganti, MIME gambar, dan batas 5 MB.
- [ ] Semua Object URL direvoke saat ganti, hapus, reset, dan unmount.
- [ ] FormData memuat seluruh field dan File; fetch tidak mengatur `Content-Type` manual.
- [ ] Endpoint mengikuti prioritas prop `apiUrl`, `VITE_API_URL`, lalu `/api/installations.php`.
- [ ] Respons JSON, non-JSON, HTTP error, dan network error ditangani defensif tanpa logging data sensitif.
- [ ] Loading mencegah double submit; notifikasi accessible memakai `aria-live`; sukses mereset seluruh state dan kembali ke tahap 1.
- [ ] Ringkasan konfirmasi tidak menampilkan foto full-size.
- [ ] UI mobile-first, semantic, responsif, target sentuh sekitar 44 px, focus state/kontras baik, dan menghormati `prefers-reduced-motion`.
- [ ] `README.md` berbahasa Indonesia menjelaskan setup, dev manual, build, endpoint Laragon/fallback same-origin, dan CORS.
- [ ] Validasi akhir wajib: `npm install` lalu `npm run build` dari `d:\website_ppn\laporanteknisi\frontend`, dengan build produksi sukses tanpa menjalankan server/watch menetap.
