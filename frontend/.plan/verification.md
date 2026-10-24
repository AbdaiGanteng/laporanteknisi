# Verifikasi Implementasi Frontend

## Iterasi perbaikan review — 2026-10-19 19:07 +08:00

Status iterasi: **SUKSES**.

Temuan review yang ditutup:

1. Respons HTTP 2xx hanya mereset laporan bila payload JSON berupa objek dengan `status: "success"`. Payload `{}`, `[]`, `{ "status": "failed" }`, atau `{ "error": "..." }` kini ditampilkan sebagai error dan seluruh state dipertahankan.
2. Setiap pencarian GPS memakai ID request aktif. Edit manual latitude/longitude, perpindahan dari tahap 1, reset sukses, dan unmount menginvalidasi callback lama.
3. PWA memakai base/manifest/service-worker scope `/teknisi/`. Cleanup cache hanya menyentuh prefix `laporan-teknisi-static-`, sedangkan cache runtime dibatasi ke app shell eksplisit dan `/teknisi/assets/`.
4. README menyelaraskan batas empat foto 5 MiB dengan kebutuhan request lebih dari 20 MiB: PHP direkomendasikan `upload_max_filesize=6M`, `post_max_size=32M`, serta limit body Apache/Nginx 32 MiB, berikut restart dan verifikasi Web SAPI Laragon.

Semua perintah npm berikut dijalankan dari `d:\website_ppn\laporanteknisi\frontend`.

### Perintah dan hasil iterasi ini

1. Pemeriksaan PHP aktif — **SUKSES menjalankan pemeriksaan; konfigurasi CLI tidak cukup untuk upload aplikasi**
   - Perintah: `php --ini` dan `php -r` untuk membaca `PHP_SAPI`, `upload_max_filesize`, `post_max_size`, serta `memory_limit`.
   - Hasil: PHP yang ada di `PATH` adalah PHP 8.4 WinGet, SAPI `cli`, dengan `upload_max_filesize=2M`, `post_max_size=8M`, dan `memory_limit=128M`.
   - Ini bukan bukti konfigurasi Web SAPI Laragon dan nilainya memang terlalu kecil untuk empat foto. Endpoint PHP serta konfigurasi Laragon tidak tersedia di workspace, sehingga tidak diubah; prosedur konfigurasi/validasi Web SAPI yang wajib sudah ditambahkan ke README.
2. `npm install` — **SUKSES** (exit code 0)
   - Dependency up-to-date; 22 package diaudit; `found 0 vulnerabilities`.
3. `npm run build` — **SUKSES** (exit code 0)
   - Vite `8.3.4`, 17 modul ditransformasi.
   - Artefak: `dist/index.html` 1,00 kB, `dist/assets/index-CZKtrR3X.css` 13,47 kB, dan `dist/assets/index-cjCVoB2o.js` 162,23 kB.
   - HTML build memakai URL `/teknisi/`; manifest dan service worker tersalin ke `dist/`.
4. `node --check "public/sw.js"` serta pemeriksaan Node untuk JSON manifest, exact dependency, dan ketiadaan script test — **SUKSES**.
5. `npm audit --json` — **SUKSES** (exit code 0), 0 vulnerability pada seluruh severity.
6. Smoke Microsoft Edge headless/CDP melalui preview produksi sementara — **SUKSES**:
   - viewport CSS 390×844, `scrollWidth=390` (tanpa overflow horizontal);
   - stepper computed `sticky`; tinggi tombol minimum 48 px;
   - screenshot mobile terbaru tersimpan di `.plan/smoke-mobile.png`;
   - GPS tetap memakai `enableHighAccuracy=true` dan timeout 20.000 ms;
   - setelah latitude/longitude diketik manual, callback GPS tertunda tidak mengubah `-7.12345678, 110.12345678`, loading selesai, dan feedback pembatalan tampil;
   - mock respons 200 `{ "error": "database unavailable" }` mempertahankan tahap 3, data pelanggan, dan keempat preview foto serta menampilkan error;
   - mock respons 200 `{ "status": "success", "message": "Tersimpan" }` mereset form ke tahap 1;
   - service worker aktif tepat pada scope `http://127.0.0.1:4173/teknisi/`;
   - seluruh URL cache berada di `/teknisi/`; fetch probe `/admin/private.css` tidak tersimpan.
7. Helper smoke sementara dihapus; pemeriksaan listener port 4173/9333 — **SUKSES**, tidak ada preview/debug server yang tertinggal.
8. `npm ls --depth=0 --json` — **SUKSES**:
   - `react` `18.3.1`, `react-dom` `18.3.1`, Vite `8.3.4`, `@vitejs/plugin-react` `6.1.2`.
9. Pemeriksaan file wajib dan seluruh 18 nama field API — **SUKSES**.
10. Pemeriksaan Git/backend root — workspace bukan repository Git, tidak ada commit dibuat, dan tidak ada path `api/`, `config/`, atau `uploads/` untuk disentuh.

### Review statis tambahan

- Fetch tetap tidak menetapkan `Content-Type`; boundary multipart dibuat browser.
- Tidak ada `console.log` atau logging data laporan pada source aplikasi.
- Cleanup service worker memakai `name.startsWith(CACHE_PREFIX)`, sehingga cache tanpa prefix milik aplikasi tidak dihapus.
- Navigasi yang dicegat hanya `/teknisi/` dan `/teknisi/index.html`; aset runtime harus berada di `/teknisi/assets/` dengan destination statis yang diizinkan.
- Callback GPS memeriksa `activeGpsRequestRef` sebelum setiap state update dan cleanup unmount menaikkan generasi request.
- UI desktop tidak diubah pada iterasi ini; smoke desktop sebelumnya tetap tersimpan di `.plan/smoke-desktop.png`. Perubahan path/scope telah dibuktikan melalui bundle dan browser mobile produksi.

### Keterbatasan lingkungan iterasi ini

Tidak tersedia endpoint PHP/MySQL, konfigurasi Web SAPI Laragon, sertifikat HTTPS aktual, sensor GPS/kamera fisik, atau ponsel fisik. Karena itu limit multipart produksi harus diverifikasi operator setelah menerapkan konfigurasi README. Perilaku form, callback GPS terkontrol, kontrak respons, preview multipart, scope/cache PWA, dan viewport mobile telah diuji di browser nyata (Microsoft Edge headless) dengan server sementara yang sudah dihentikan.

## Riwayat verifikasi iterasi sebelumnya

Status akhir: **SUKSES**.

- Dependency final terpasang, seluruh versi langsung dipin exact, dan `npm audit` melaporkan **0 vulnerability**.
- Build produksi final memakai Vite 8.3.4 dan selesai tanpa error.
- PWA memiliki manifest, ikon 192/512, service worker aktif, serta guard yang tidak mencegat/cache/replay request selain `GET`.
- Smoke browser interaktif berhasil pada viewport CSS mobile 390×844 dan desktop 1440×1000.
- Round-trip multipart/CORS berhasil terhadap API mock lintas-origin sementara; build final sudah dikembalikan ke fallback `/api/installations.php`.
- Tidak ada dev server, mock server, profil browser, atau skrip smoke sementara yang dibiarkan berjalan/tersimpan.
- Tidak ada commit Git yang dibuat sesuai instruksi.

Semua perintah npm dijalankan dari `d:\website_ppn\laporanteknisi\frontend`.

## Perintah final dan hasil

1. `node --version` dan `npm --version` — **SUKSES**
   - Node.js `v24.20.0`.
   - npm `11.19.0`.
2. `npm install` — **SUKSES** (exit code 0)
   - Dependency sudah up-to-date.
   - 22 package diaudit dan npm langsung melaporkan `found 0 vulnerabilities`.
   - `package-lock.json` sesuai dengan `package.json`.
3. `npm run build` — **SUKSES** (exit code 0)
   - Vite `8.3.4` mentransformasi 17 modul.
   - Artefak final: `dist/index.html` 0,96 kB, CSS 13,47 kB, JS 161,74 kB.
   - Bundle final adalah konfigurasi normal tanpa environment mock.
4. `npm audit --json` — **SUKSES** (exit code 0)
   - 0 info, 0 low, 0 moderate, 0 high, 0 critical.
5. `npm ls --depth=0 --json` — **SUKSES** (exit code 0)
   - `react` `18.3.1`.
   - `react-dom` `18.3.1`.
   - `vite` `8.3.4`.
   - `@vitejs/plugin-react` `6.1.2`.
6. Pemeriksaan exact version dan parse JSON manifest melalui Node — **SUKSES**
   - Tidak ada dependency langsung yang diawali `^` atau `~`.
   - `public/manifest.webmanifest` valid JSON.
7. `node --check "public/sw.js"` — **SUKSES** (exit code 0)
   - Sintaks service worker valid.
8. Pemeriksaan bundle final — **SUKSES**
   - `dist/assets/index-CXQOORTf.js` memuat fallback `/api/installations.php`.
   - URL mock `127.0.0.1:8181` tidak ada pada bundle final.
   - `dist/manifest.webmanifest`, `dist/sw.js`, dan `dist/icons/icon-512.png` tersedia.

## Perbaikan temuan review

### 1. Advisory Vite/esbuild

Audit awal pada Vite 5.4.14 — **GAGAL** sebagai security gate karena registry melaporkan 1 moderate dan 1 high. Percobaan Vite 5.4.21 juga masih dilaporkan rentan oleh advisory registry terbaru. Toolchain kemudian dinaikkan ke pasangan exact yang kompatibel:

- Vite `8.3.4`;
- `@vitejs/plugin-react` `6.1.2`;
- Node engine yang didokumentasikan: `^20.19.0 || >=22.12.0`.

Lockfile diregenerasi. Instalasi, audit, dan build final seluruhnya **SUKSES**, dengan 0 vulnerability.

### 2. Lifecycle PWA dan kebijakan cache POST

Ditambahkan:

- `public/manifest.webmanifest`;
- ikon PNG 192×192 dan 512×512 serta favicon SVG;
- registrasi service worker produksi di `src/main.jsx`;
- `public/sw.js` dengan versioned cache, cleanup cache lama, network-first untuk navigasi, dan cache aset statis same-origin;
- metadata manifest/Apple PWA pada `index.html`.

Runtime CDP memastikan service worker aktif pada scope `http://127.0.0.1:4173/`. Pemeriksaan source/build memastikan handler langsung `return` untuk semua request non-`GET` dan cross-origin. Dengan demikian POST laporan tidak disimpan, diantrekan, diputar ulang, atau dijawab dari cache.

### 3. HTTPS Laragon dan CORS

`.env.example` dan seluruh contoh README sekarang memakai endpoint HTTPS generik:

```env
VITE_API_URL=https://laporanteknisi.test/api/installations.php
```

README menjelaskan secure context, sertifikat Laragon yang harus dipercaya perangkat, mixed-content blocking, same-origin fallback, dan kewajiban mencocokkan origin CORS aktual (skema + host + port).

Pencarian read-only tidak menemukan `api/installations.php`, `config/database.php`, maupun header CORS PHP dalam workspace. Karena itu endpoint PHP/DB deployment aktual tidak dapat diuji dari sesi ini dan tidak ada file backend yang disentuh.

### 4. Kontrak foto raster

Kedua input pada setiap kartu memakai:

```text
accept="image/jpeg,image/png,image/webp"
```

Validasi JavaScript hanya menerima MIME JPEG, PNG, atau WebP dan tetap membatasi 5 MB/foto. README secara eksplisit menyatakan `File.type` tidak dapat dijadikan batas keamanan dan API PHP wajib melakukan sniff MIME/ukuran secara independen, menamai file dengan aman, serta mencegah eksekusi upload.

### 5. Smoke browser dan multipart/CORS

Smoke dijalankan dengan Microsoft Edge headless melalui Chrome DevTools Protocol, tanpa menambahkan dependency atau test suite. Screenshot tersimpan sebagai:

- `.plan/smoke-mobile.png` — viewport CSS 390×844;
- `.plan/smoke-desktop.png` — viewport CSS 1440×1000.

Assertion runtime — **SUKSES**:

- mobile: `innerWidth=390`, `innerHeight=844`, `scrollWidth=390` (tanpa overflow horizontal), grid satu kolom;
- desktop: `innerWidth=1440`, `innerHeight=1000`, `scrollWidth=1425`, grid dua kolom;
- stepper dan action bar memiliki computed position `sticky`;
- tinggi tombol minimum 48 px;
- service worker aktif;
- GPS mock browser mengisi `-6.20000000, 106.81666667` dan menangkap opsi `enableHighAccuracy=true`, `timeout=20000`, `maximumAge=0`;
- validasi menahan tahap 1, menampilkan error inline, dan memfokuskan field `name` pertama;
- navigasi mencapai tahap teknis dan foto;
- delapan input foto tersedia (picker + kamera untuk empat kategori), semuanya memakai whitelist raster, dan empat input kamera memakai `capture="environment"`;
- submit tanpa foto menampilkan empat error, live region assertive, dan fokus ke tombol foto pertama;
- data pelanggan, koordinat, dan teknis tetap ada setelah bolak-balik tahap;
- emulasi `prefers-reduced-motion: reduce` menghasilkan transition duration efektif `0.01ms`;
- screenshot memperlihatkan layout mobile/desktop ter-render, bukan halaman kosong.

Round-trip lintas-origin dijalankan dengan build sementara yang menunjuk API mock lokal, lalu build final dibuat ulang tanpa URL tersebut. Hasil — **SUKSES**:

- browser membuat empat objek `File` PNG dan empat preview;
- klik submit ganda hanya menghasilkan **1 request**;
- request memiliki origin `http://127.0.0.1:4173`;
- `Content-Type` dibuat browser sebagai `multipart/form-data` dengan boundary;
- body berisi seluruh 14 field teks dan empat field file dengan nama persis;
- respons JSON sukses lolos CORS, tampil pada live region, menghapus state/foto, dan kembali ke tahap 1;
- mock dan preview server dihentikan setelah pemeriksaan.

## Kegagalan verifikasi sementara yang sudah diselesaikan

- Audit Vite 5.x gagal security gate; diselesaikan dengan Vite 8.3.4/plugin 6.1.2 dan audit final 0 vulnerability.
- Percobaan screenshot awal memakai launcher browser tanpa profil terisolasi sehingga DOM headless tidak tertangkap; diganti CDP dengan profil sementara terisolasi.
- Dua assertion manifest via `Invoke-WebRequest` gagal karena PowerShell mengembalikan content sebagai byte array; manifest kemudian diverifikasi melalui parser JSON Node, HTTP 200, runtime PWA, dan file build.
- Assertion reduced-motion awal menuntut literal `0s`, sedangkan CSS sengaja memakai pola aksesibilitas `0.01ms`; assertion diperbaiki untuk mengukur durasi efektif.
- Satu proses build smoke dan satu `node --check` paralel sempat dihentikan runner tanpa output; keduanya diulang terpisah dan sukses.

## Review statis persyaratan inti

- Form tetap tepat tiga tahap dan satu state induk mempertahankan data antartahap.
- Field pelanggan/lokasi, teknis, STB opsional, rentang koordinat, Rx negatif/desimal, VLAN 1–4094 sebagai string, dan select status port tersedia.
- Empat nama foto persis: `speedtest_photo`, `house_photo`, `odp_photo`, `device_photo`.
- Object URL direvoke saat ganti, hapus, reset sukses, dan unmount.
- `FormData` memuat seluruh field dan file; fetch tidak menetapkan `Content-Type` manual.
- Resolusi endpoint tetap `apiUrl` → `VITE_API_URL` → `/api/installations.php`.
- JSON success/error, HTTP error, non-JSON, dan network error ditangani tanpa logging data sensitif.
- Guard ref + state mencegah double submit; sukses mereset form/foto/error dan kembali ke tahap 1.
- Label, ARIA, live region, focus state, semantic HTML, target sentuh, layout responsif, dan reduced motion tetap tersedia.
- Seluruh perubahan aplikasi berada dalam `frontend/`; backend root tidak diubah.

## Batas verifikasi lingkungan

Tidak tersedia ponsel fisik, sensor kamera/GPS fisik, endpoint PHP, MySQL, sertifikat HTTPS Laragon aktual, atau origin deployment final pada sesi ini. Karena itu yang belum dapat dibuktikan di sini adalah prompt izin GPS perangkat nyata, aplikasi kamera Android/iOS, instal prompt PWA pada perangkat, sertifikat perangkat, dan transaksi PHP/MySQL produksi. Browser desktop + emulasi mobile/touch, geolocation terkontrol, lifecycle service worker, preview/upload foto, multipart, CORS, serta reset sukses telah diuji otomatis. Checklist uji perangkat nyata sebelum rilis tersedia di README.
