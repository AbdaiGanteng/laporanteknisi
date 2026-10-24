# Form pemasangan teknisi tiga tahap dengan GPS dan upload multipart

Implementasi menyediakan alur mobile-first untuk data pelanggan, lokasi, perangkat, pengukuran, empat foto, dan konfirmasi sebelum laporan dikirim ke API PHP. State tunggal, validasi bertahap, serta validasi ulang saat submit menjaga laporan tetap utuh selama navigasi. Empat blocker pass sebelumnya—respons sukses ambigu, callback GPS kedaluwarsa, cache PWA lintas-aplikasi, dan dokumentasi limit multipart—sudah ditutup oleh source dan `.plan/verification.md`. Bukti build, audit dependency, smoke browser, dan round-trip multipart mock seluruhnya sukses.

Watch for: **confirmed** (non-blocking) stack HTTPS/CORS/PHP/MySQL Laragon aktual belum diuji end-to-end; **confirmed** (non-blocking) kamera, GPS, dan instalasi PWA pada perangkat fisik belum diuji.

**Verdict**: APPROVED

## High-level view

Form dibagi tepat menjadi pelanggan/lokasi, perangkat/sinyal, lalu foto/konfirmasi. Nilai bertahan saat maju-mundur; gerbang tiap tahap dan submit penuh mengarahkan fokus ke field invalid pertama tanpa menghapus input.

Geolocation meminta akurasi tinggi dan memiliki fallback manual, pesan error, validasi rentang, serta generasi request yang mengabaikan callback lama. Seluruh field teknis tersedia: STB opsional, Rx menerima negatif/desimal, status port tetap string, dan VLAN dibatasi 1–4094 lalu dikirim sebagai string.

Empat slot foto memakai nama API persis, kamera belakang, picker, drag-and-drop, preview, ganti/hapus, whitelist MIME, batas 5 MiB, dan cleanup object URL. Submit memilih `apiUrl` → `VITE_API_URL` → `/api/installations.php`, tidak memaksakan `Content-Type`, menahan klik ganda, dan hanya mereset ke tahap pertama setelah JSON 2xx dengan `status: "success"`; jalur gagal mempertahankan seluruh laporan.

CSS Modules memberi layout satu kolom pada HP, target sentuh minimal 48 px, stepper/action bar sticky, focus state, ARIA/live region, dan reduced motion tanpa framework UI besar. Dependency langsung dipin exact, pasangan Vite/plugin memenuhi peer range dan terbukti build, tidak ada test suite, serta README Indonesia mencakup Laragon HTTPS, endpoint, CORS, limit upload, deployment `/teknisi/`, dan checklist rilis.

PWA dibatasi pada `/teknisi/`, membersihkan hanya namespace cache sendiri, mengizinkan hanya app shell/aset build, dan melewatkan request non-GET. Ini menjaga submit dan resource dashboard admin se-origin di luar lifecycle cache form teknisi.

<details>
<summary>Issues (2)</summary>

1. **Live Laragon integration evidence (non-blocking)** — **confirmed**: HTTPS/CORS aktual, pertahanan upload server, limit multipart Web SAPI, dan transaksi PHP/MySQL belum diuji; jalankan smoke endpoint aktual dengan empat file mendekati batas sebelum rollout.
2. **Physical-device evidence (non-blocking)** — **confirmed**: kamera, GPS, dan instalasi PWA baru dibuktikan melalui browser/emulasi; jalankan checklist README pada ponsel target dan sertifikat yang dipercaya.

</details>

<details>
<summary>Details</summary>

### Batas kepercayaan upload tetap berada di API PHP

Frontend memeriksa `File.type` dan ukuran untuk feedback, tetapi metadata file browser dapat dipalsukan. **confirmed** — backend aktual tidak tersedia di workspace, sehingga review ini tidak dapat membuktikan sniff MIME berbasis isi, limit per-file/total pada Web SAPI, nama file aman, pencegahan eksekusi dari `uploads/`, origin CORS aktual, atau transaksi PHP/MySQL. README sudah menetapkan kewajiban itu; smoke deployment perlu memastikan empat file mendekati batas tetap menghasilkan JSON dan satu transaksi konsisten melalui HTTPS.

Kontrak klien sendiri fail-closed terhadap respons ambigu: body non-JSON, array, objek kosong, status selain `success`, HTTP error, dan network error mempertahankan data serta preview. Bukti mock juga mencatat satu request untuk klik ganda dan boundary multipart yang dibuat browser.

### Bukti verifikasi berhenti pada mock dan emulasi perangkat

`.plan/verification.md` membuktikan build Vite 8.3.4, audit nol vulnerability, lockfile/manifest/service worker, viewport mobile dan desktop, reduced motion, GPS terkontrol, respons ambigu, reset sukses, scope cache, dan round-trip multipart/CORS mock. Ketiadaan test suite disengaja sesuai brief dan dikompensasi oleh pemeriksaan statis serta smoke browser.

**Not tested:** kamera/GPS fisik, prompt instalasi PWA pada ponsel, sertifikat HTTPS yang dipercaya perangkat, origin CORS deployment, Web SAPI dan limit body Laragon, transaksi PHP/MySQL, serta empat upload mendekati 5 MiB ke endpoint aktual. Ini merupakan dua follow-up verifikasi lingkungan, bukan perubahan source frontend.

</details>

<details>
<summary>File map</summary>

- `src/components/InstallationForm.jsx` — state tiga tahap, validasi, lifecycle GPS/foto, ringkasan, multipart, dan reset sukses.
- `src/components/InstallationForm.module.css` / `src/index.css` — layout mobile-first, sticky controls, touch/focus states, dan reduced motion.
- `src/App.jsx` / `src/main.jsx` — penggunaan form dan registrasi service worker produksi.
- `public/sw.js` / `public/manifest.webmanifest` / `index.html` — installability dan isolasi PWA `/teknisi/`.
- `package.json` / `package-lock.json` / `vite.config.js` — dependency exact, kompatibilitas toolchain, dan base deployment.
- `.env.example` / `README.md` — endpoint, HTTPS Laragon, CORS, limit multipart, dan prosedur rilis.
- `.plan/verification.md` — bukti build/audit/smoke serta batas lingkungan.

Full diff: tidak tersedia karena workspace bukan repository Git; review dilakukan terhadap snapshot frontend yang diminta dan bukti verifikasi coder.

</details>
