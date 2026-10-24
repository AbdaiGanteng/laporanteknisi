# Audit Kesesuaian Keseluruhan — Aplikasi Laporan Teknisi & Billing Admin

## A. Verdict singkat

**Jawaban singkat: belum sesuai secara keseluruhan dan belum siap dianggap sistem end-to-end.** Frontend form teknisi sudah sangat dekat dengan spesifikasi dan build produksi berhasil. Source PHP API serta DDL MySQL juga ada dan secara statis mencakup alur utama. Namun MySQL lokal tidak aktif/menolak koneksi, transaksi dan upload nyata belum dapat diverifikasi, dashboard billing admin aktual tidak ada, dan endpoint tulis belum memiliki autentikasi/otorisasi. Ada pula cacat CORS fail-open yang mengizinkan origin tak dikenal dengan `*`.

**Kategori keseluruhan: PARTIAL — frontend siap untuk integrasi, tetapi MVP operasional terpadu belum terbukti berjalan; production-ready belum tercapai.**

Persentase berikut adalah hitungan transparan, **bukan skor kualitas berbobot**. Denominator adalah 24 kelompok requirement yang tercantum satu per satu pada matriks bagian B; setiap kelompok dihitung sama dan tidak diberi “nilai parsial” terselubung:

- **IMPLEMENTED & VERIFIED: 9/24 (37,5%)** — keberadaan dan aspek terkait berhasil dibuktikan melalui inspeksi source serta build/lint/parse yang relevan.
- **IMPLEMENTED BUT NOT VERIFIED: 8/24 (33,3%)** — source implementasi ada, tetapi perilaku runtime kunci tidak dapat diuji di lingkungan ini.
- **PARTIAL: 5/24 (20,8%)** — hanya sebagian requirement terpenuhi atau ada cacat material.
- **MISSING: 2/24 (8,3%)** — implementasi tidak ditemukan.
- **NOT APPLICABLE: 0/24.**

Dengan kata lain, **17/24 (70,8%) mempunyai implementasi yang tampak lengkap pada level source**, tetapi hanya 9/24 yang dapat diverifikasi dalam cakupan audit read-only ini. Angka 70,8% tidak boleh ditafsirkan sebagai kesiapan produksi.

### Inventaris aktual yang relevan

- Database: `d:\website_ppn\laporanteknisi\database\schema.sql`.
- API: `d:\website_ppn\laporanteknisi\api\installations.php`.
- PDO config: `d:\website_ppn\laporanteknisi\config\database.php`.
- Upload directory: `d:\website_ppn\laporanteknisi\uploads\index.php` dan `.gitkeep`; **tidak ditemukan `.htaccess` atau konfigurasi server upload lain di workspace**.
- Frontend: Vite/React di `d:\website_ppn\laporanteknisi\frontend`, termasuk source, manifest, service worker, ikon, lockfile, dan `dist/`.
- Dokumentasi resmi yang ditemukan hanya `frontend\README.md`; tidak ada README root, `AGENTS.md`, atau `CONTRIBUTING.md`.
- Tidak ditemukan source dashboard/admin, endpoint billing read-side, tabel invoice/payment/subscription, modul user/auth, atau test suite.
- Workspace bukan repository Git. Dokumen `frontend\.plan\*` dibaca hanya sebagai konteks sekunder; klaim lamanya bahwa backend tidak ada sudah tidak sesuai snapshot saat ini dan tidak dipakai sebagai bukti mandiri.

## B. Matriks requirement → status → bukti → catatan

| # | Requirement yang diaudit | Status | Bukti | Catatan |
|---:|---|---|---|---|
| 1 | React.js frontend dengan dependency/build nyata | **IMPLEMENTED & VERIFIED** | `frontend/package.json:6-18`; CMD-01, CMD-02 | React `18.3.1`, React DOM `18.3.1`, Vite `8.3.4`, plugin React `6.1.2`; seluruh dependency langsung exact dan build sukses. |
| 2 | UI mobile-first, clean, dan form tiga tahap | **IMPLEMENTED & VERIFIED** | `frontend/src/components/InstallationForm.jsx:3-9,415-438,919-944`; `frontend/src/components/InstallationForm.module.css:17-27,734-798`; screenshot `frontend/.plan/smoke-mobile.png` dan `smoke-desktop.png`; CMD-01 | Stepper tepat tiga tahap, grid satu kolom lalu dua kolom, stepper/action bar sticky, target sentuh besar. Screenshot adalah artefak lama dan hanya bukti pendukung; build saat ini diverifikasi ulang. |
| 3 | PWA dengan base aplikasi `/teknisi/` | **IMPLEMENTED & VERIFIED** | `frontend/vite.config.js:5-7`; `frontend/public/manifest.webmanifest:7-10`; `frontend/src/main.jsx:13-20`; CMD-03 | Manifest valid, service worker didaftarkan hanya pada produksi, artefak PWA masuk ke `dist/`. Instalasi pada ponsel nyata belum diuji. |
| 4 | Data pelanggan/lokasi: name, address, lat, long, phone, billing status | **IMPLEMENTED & VERIFIED** | `frontend/src/components/InstallationForm.jsx:10,52-102,181-199,217-238`; `api/installations.php:67-112`; `database/schema.sql:18-27` | Semua field tersedia; koordinat wajib dan dibatasi di frontend/API. `billing_status` ada di DB, tetapi constraint DB dibahas pada item 20. |
| 5 | Data ODP/port dan ONT/STB, dengan STB opsional | **IMPLEMENTED & VERIFIED** | `frontend/src/components/InstallationForm.jsx:11-25,104-149`; `api/installations.php:73-128`; `database/schema.sql:40-45` | Nama field cocok; `stb_sn` dan `stb_mac` opsional dan disimpan `NULL` bila kosong. |
| 6 | Rx dBm, status port, VLAN 1–4094 | **IMPLEMENTED & VERIFIED** | `frontend/src/components/InstallationForm.jsx:151-178,249-261`; `api/installations.php:130-138`; `database/schema.sql:48-51` | Frontend/API menerima Rx numerik termasuk negatif/desimal dan memvalidasi VLAN. DB sendiri masih memakai `VARCHAR(50)` untuk VLAN dan tidak mempunyai CHECK. |
| 7 | Empat nama foto wajib dan validasi JPEG/PNG/WebP 5 MiB | **IMPLEMENTED & VERIFIED** | `frontend/src/components/InstallationForm.jsx:26-49,271-282,519-541,812-837`; `api/installations.php:143-184`; `database/schema.sql:53-56` | Kontrak nama tepat: `speedtest_photo`, `house_photo`, `odp_photo`, `device_photo`. Yang terverifikasi di sini adalah source/kompilasi; round-trip upload nyata dicakup item 12–13. |
| 8 | Loading, anti-double-submit, feedback defensif, reset hanya saat sukses, aksesibilitas dasar | **IMPLEMENTED & VERIFIED** | `frontend/src/components/InstallationForm.jsx:325-340,366-381,582-701,721-765,889-990`; `frontend/src/components/InstallationForm.module.css:272-295,646-733,799-817`; `frontend/src/index.css:80-104` | Guard ref mencegah klik ganda; respons non-JSON/HTTP error/status bukan `success` tidak mereset data; ARIA/live region, focus handling, visible focus, dan reduced motion ada. Belum ada audit axe/screen reader aktual. |
| 9 | Supply chain/build frontend | **IMPLEMENTED & VERIFIED** | `frontend/package.json:6-18`; `frontend/package-lock.json`; CMD-01, CMD-02 | `npm audit` melaporkan 0 vulnerability dan `npm ls` sesuai manifest. Tidak ada script test/lint. |
| 10 | GPS browser, lifecycle request, dan fallback manual pada perangkat | **IMPLEMENTED BUT NOT VERIFIED** | `frontend/src/components/InstallationForm.jsx:387-410,443-502,969-1005` | Implementasi menangani unsupported/denied/unavailable/timeout dan mencegah callback lama menimpa koreksi manual. Sensor, permission prompt, akurasi, dan secure context perangkat nyata tidak diuji. |
| 11 | Picker/kamera/drag-drop/preview/ganti/hapus foto pada browser/perangkat | **IMPLEMENTED BUT NOT VERIFIED** | `frontend/src/components/InstallationForm.jsx:503-580,773-895`; `capture="environment"` pada `:827-830` | Source lengkap dan object URL direvoke saat ganti/hapus/reset/unmount, tetapi kamera HP dan interaksi drag/drop tidak diuji ulang dalam audit ini. |
| 12 | FormData ke endpoint, seluruh field/file, tanpa header Content-Type manual; round-trip sukses | **IMPLEMENTED BUT NOT VERIFIED** | `frontend/src/components/InstallationForm.jsx:341-348,638-688`; endpoint `api/installations.php`; CMD-06 hanya menguji jalur error | Kode memakai prioritas prop → `VITE_API_URL` → `/api/installations.php` dan browser membuat boundary. POST sukses multipart nyata dilarang oleh audit read-only dan DB juga tidak tersedia. |
| 13 | `POST /api/installations.php`, OPTIONS/method handling, JSON success/error | **IMPLEMENTED BUT NOT VERIFIED** | `api/installations.php:24-49,307-345`; CMD-06 | OPTIONS 204, GET 405, dan kegagalan DB 500 berhasil dieksekusi via CLI. Jalur HTTP 201 sukses belum dijalankan. Kontrak `status: "success"` cocok dengan frontend. |
| 14 | PDO MySQL, prepared statements, transaction, rollback, lastInsertId | **IMPLEMENTED BUT NOT VERIFIED** | `config/database.php:10-45`; `api/installations.php:242-302,326-335`; CMD-04, CMD-05 | Native prepares aktif; customer dan report berada dalam satu transaksi DB. Koneksi MySQL ditolak sehingga commit/rollback aktual belum dibuktikan. |
| 15 | Empat file dipindah ke `uploads/`, nama acak, cleanup ketika proses DB gagal | **IMPLEMENTED BUT NOT VERIFIED** | `api/installations.php:150-184,195-237,326-335` | Ada MIME sniff dengan `finfo`, whitelist ekstensi, `move_uploaded_file`, dan compensating cleanup. Tidak diuji dengan upload HTTP nyata. |
| 16 | DDL MySQL aktual dapat diterapkan | **IMPLEMENTED BUT NOT VERIFIED** | `database/schema.sql:6-10,16-70,76-103`; CMD-05 | Secara statis DDL memuat InnoDB, utf8mb4, dua tabel, FK cascade, timestamp, index, dan view. Server MySQL tidak menerima koneksi; schema belum dapat dipastikan telah di-import atau kompatibel dengan versi Laragon aktif. |
| 17 | Pelanggan otomatis aktif untuk billing setelah transaksi | **IMPLEMENTED BUT NOT VERIFIED** | `api/installations.php:244-260,307-321`; `database/schema.sql:23-27` | Insert menetapkan `billing_status='active'` dan respons mengembalikannya. Tidak ada row DB aktual yang boleh dibuat dalam audit read-only. |
| 18 | CORS exact-origin allowlist dan preflight aman | **PARTIAL** | `api/installations.php:13-33` | OPTIONS dan allowlist ada, tetapi origin yang **tidak** terdaftar mendapat `Access-Control-Allow-Origin: *` pada baris 27; ini fail-open, bukan allowlist. |
| 19 | Upload hardening dan privasi file | **PARTIAL** | `api/installations.php:150-184,218-236`; `uploads/index.php:3-4`; pencarian `.htaccess`/aturan hardening: tidak ada | Validasi isi/size/nama/cleanup ada. Namun `index.php` hanya menolak akses direktori, bukan akses foto individual; tidak ada aturan repository-level untuk menonaktifkan handler script, `nosniff`, atau authenticated download. |
| 20 | Integritas schema, relasi teknisi, uniqueness, dan histori laporan | **PARTIAL** | `database/schema.sql:23,34-70`; `api/installations.php:82,242-298`; pencarian `UNIQUE`: tidak ada | FK customer cascade memenuhi schema minimum dan tabel secara kardinalitas bisa menyimpan banyak report/customer. Namun API selalu membuat customer baru; `technician_id` tanpa tabel/FK dan berasal dari input; tidak ada uniqueness untuk identitas perangkat/ODP-port; status/range tidak dijaga DB. Ini bukan blocker untuk capture minimum, tetapi melemahkan histori dan konsistensi produksi. |
| 21 | Otomatisasi data lapangan ke sistem billing tanpa input ulang | **PARTIAL** | `api/installations.php:244-321`; `database/schema.sql:76-103`; CMD-05 | Status aktif dan view `v_billing_dashboard` adalah feed awal yang baik. Karena schema belum live dan tidak ada consumer/API billing, integrasi otomatis aktual belum terbukti. |
| 22 | Dashboard billing admin aktual | **MISSING** | Inventaris workspace: pencarian `admin`, `dashboard`, `billing`, `invoice`, `payment` tidak menemukan source; hanya `v_billing_dashboard` di `database/schema.sql:76-103` | Tidak ada UI admin, API daftar/detail billing, login admin, invoice/payment, ataupun deployment dashboard. View SQL bukan dashboard pengguna. |
| 23 | Deployment Laragon, HTTPS, URL/base, dan limit empat foto | **PARTIAL** | `frontend/README.md:23-124,138-164`; `frontend/.env.example:1-2`; CMD-04a, CMD-05 | Dokumentasi frontend untuk `/teknisi/`, HTTPS, CORS, dan rekomendasi `6M/32M` baik. Tidak ada panduan root untuk import schema/deploy API/permission upload. PHP CLI aktif masih `2M/8M`; Web SAPI Laragon tidak dapat diperiksa. |
| 24 | Keamanan minimum data sensitif: authn/authz, TLS enforcement, rate limit, audit log | **MISSING** | Satu-satunya kemunculan `Authorization` adalah header CORS di `api/installations.php:32-33`; tidak ada hasil untuk auth/session/JWT/rate-limit/audit; `technician_id` dipercaya pada `:82` | CORS bukan autentikasi. Endpoint yang dapat dijangkau dapat membuat pelanggan aktif dan menyimpan foto/PII tanpa identitas teknisi yang terbukti. HTTPS hanya didokumentasikan, tidak dipaksakan atau diverifikasi. |

## C. Temuan berurutan berdasarkan severity

### Critical

#### C-01 — Endpoint tulis dan aktivasi billing tidak memiliki autentikasi/otorisasi

- **Status:** CONFIRMED.
- **Dampak:** siapa pun yang dapat menjangkau API dapat mencoba membuat pelanggan berstatus billing aktif, mengisi `technician_id` arbitrer, dan menghabiskan storage/database. Data alamat, GPS, nomor telepon, dan foto rumah/perangkat adalah data sensitif; tanpa identitas dan izin, integritas serta privasinya tidak dapat dipertanggungjawabkan.
- **Bukti:** inventory menunjukkan hanya satu endpoint API; pencarian auth menemukan hanya `Access-Control-Allow-Headers: ... Authorization` tanpa verifikasi token (`api/installations.php:32-33`); `technician_id` dicast langsung dari request (`:82`); status diinsert `active` (`:244-260`); tidak ada rate limit/audit event.
- **Perbaikan konkret:** pasang autentikasi teknisi sebelum parsing/upload, otorisasi role, dan ambil `technician_id` dari principal server—bukan body. Tambahkan rate limit per user/IP, kuota upload, audit event sukses/gagal, serta CSRF bila menggunakan cookie session. Kembalikan 401/403 yang konsisten dan jangan menganggap CORS sebagai kontrol akses.

### High

#### H-01 — CORS allowlist bersifat fail-open

- **Status:** CONFIRMED.
- **Dampak:** origin asing justru menerima `Access-Control-Allow-Origin: *`. Karena request multipart tanpa header khusus dapat menjadi CORS simple request, situs lain dapat memicu request dan membaca respons ketika API terekspos. Cacat ini memperparah tidak adanya auth.
- **Bukti:** cabang origin dikenal memantulkan origin (`api/installations.php:24-26`), sedangkan cabang lain mengirim wildcard (`:27-28`); OPTIONS selalu 204 (`:37-41`).
- **Perbaikan konkret:** untuk origin kosong/same-origin tidak perlu header CORS; untuk origin tak dikenal jangan kirim ACAO dan tolak preflight 403. Pindahkan daftar origin ke konfigurasi environment, izinkan hanya origin HTTPS final, dan tambahkan test allowed/disallowed origin. Tetap terapkan auth karena CORS bukan firewall API.

#### H-02 — Dashboard billing admin yang diminta tidak ada

- **Status:** CONFIRMED.
- **Dampak:** admin tidak mempunyai layar atau API read-side untuk melihat pelanggan baru; klaim “terhubung ke dashboard billing tanpa input manual” belum terpenuhi secara pengguna.
- **Bukti:** hanya ada view `v_billing_dashboard` (`database/schema.sql:76-103`); pencarian seluruh workspace untuk `admin`, `dashboard`, `billing`, `invoice`, dan `payment` tidak menemukan implementasi aplikasi selain nama view/teks.
- **Perbaikan konkret:** definisikan MVP dashboard admin terautentikasi: endpoint list/detail/filter pelanggan aktif dari view/query yang terversi, UI admin, dan status loading/error. Jika “billing” berarti penagihan nyata, tambahkan model paket/langganan/tagihan/pembayaran—jangan menyamakan flag `active` dengan sistem billing lengkap.

#### H-03 — Sistem lokal tidak dapat diverifikasi operasional; MySQL menolak koneksi

- **Status:** CONFIRMED untuk lingkungan audit.
- **Dampak:** schema terpasang, insert dua tabel, commit/rollback, `lastInsertId`, dan aktivasi billing belum terbukti. Karena itu sistem tidak dapat dinyatakan siap di Laragon walaupun source terlihat benar.
- **Bukti:** probe PDO read-only ke `127.0.0.1:3306` gagal dengan SQLSTATE `[HY000] [2002]`, “target machine actively refused it” (CMD-05); POST CLI mengembalikan JSON 500 koneksi DB (CMD-06).
- **Perbaikan konkret:** aktifkan MySQL Laragon, import `database/schema.sql` pada database target, verifikasi tabel/FK/view lewat `information_schema`, lalu jalankan smoke transaction dengan database disposable/test. Pastikan rollback meninggalkan nol customer/report dan menghapus file ketika insert kedua gagal.

#### H-04 — Limit PHP aktif yang terlihat tidak cukup untuk empat foto

- **Status:** CONFIRMED untuk PHP CLI; Web SAPI Laragon NOT VERIFIED.
- **Dampak:** pada limit `upload_max_filesize=2M` dan `post_max_size=8M`, empat foto hingga 5 MiB tidak akan mencapai validasi endpoint secara utuh; PHP dapat mengosongkan `$_POST`/`$_FILES` sebelum aplikasi memprosesnya.
- **Bukti:** CMD-04a melaporkan SAPI `cli`, `2M`, `8M`, dan `memory_limit=128M`; kebutuhan total >20 MiB sudah benar didokumentasikan di `frontend/README.md:89-124`.
- **Perbaikan konkret:** pada **Web SAPI yang benar-benar dipakai Laragon**, set minimal `upload_max_filesize=6M`, `post_max_size=32M`, `max_file_uploads>=20`, dan limit body web server yang selaras; restart Laragon dan validasi lewat request empat file mendekati 5 MiB. Jangan menganggap konfigurasi CLI sebagai bukti Apache/Nginx.

#### H-05 — Foto sensitif belum mempunyai kontrol akses penyimpanan yang memadai

- **Status:** CONFIRMED pada isi workspace; konfigurasi virtual host eksternal NOT VERIFIED.
- **Dampak:** `uploads/index.php` hanya menghalangi listing/root index. File individual dengan path `uploads/<nama>` berpotensi dapat diakses publik tanpa auth; foto rumah, ODP, dan perangkat dapat bocor. Tidak ada kebijakan repository-level untuk menonaktifkan eksekusi/handler dan MIME sniffing.
- **Bukti:** path relatif publik disimpan dan dikembalikan (`api/installations.php:233-236,293-320`); hanya `uploads/index.php:3-4` yang memberi 403; `.htaccess`/konfigurasi equivalent tidak ditemukan.
- **Perbaikan konkret:** simpan upload di luar document root dan sajikan melalui endpoint download terautentikasi/terotorisasi; gunakan nama acak minimal 128-bit; set `Content-Disposition`, MIME tetap, `X-Content-Type-Options: nosniff`, dan cache privacy. Jika tetap di web root, tambahkan aturan Apache/Nginx yang menolak semua handler script dan directory listing—namun akses foto tetap harus melalui authorization.

### Medium

#### M-01 — Validasi backend dan constraint DB belum menjaga format/panjang/domain data

- **Status:** CONFIRMED.
- **Dampak:** nomor telepon/MAC invalid, string melebihi kolom, status port arbitrer, koordinat/status/VLAN di luar invariant melalui writer lain, serta `technician_id` nol/negatif dapat masuk atau memicu 500/truncation tergantung SQL mode.
- **Bukti:** API terutama memeriksa kosong/numerik (`api/installations.php:87-138`); tidak ditemukan `maxlength`, `mb_strlen`, `preg_match`, atau validator format. DB memakai `port_status VARCHAR(50)` dan `vlan_id VARCHAR(50)`, serta `billing_status` tidak diberi `NOT NULL` (`database/schema.sql:20-23,48-51`). `technician_id` hanya cast integer (`api/installations.php:82`) dan tidak mempunyai FK (`database/schema.sql:37`).
- **Perbaikan konkret:** validasi panjang sesuai schema, canonicalize/validasi telepon dan MAC, whitelist `port_status`, tetapkan rentang Rx yang disepakati, dan validasi technician positif. Pada DB, gunakan `SMALLINT UNSIGNED`/CHECK VLAN 1–4094, CHECK koordinat, `billing_status NOT NULL`, serta tabel users/technicians + FK bila identitas teknisi digunakan.

#### M-02 — Tidak ada idempotency atau kebijakan duplikasi identitas perangkat/port

- **Status:** CONFIRMED.
- **Dampak:** bila commit berhasil tetapi respons hilang/non-JSON, frontend sengaja mempertahankan state dan retry dapat membuat customer/report aktif kedua. Klik ganda satu sesi dicegah, tetapi retry jaringan lintas request tidak. Duplikasi ONT atau assignment ODP-port juga tidak dicegah.
- **Bukti:** setiap POST selalu `INSERT INTO customers` lalu report (`api/installations.php:245-299`); tidak ditemukan submission/idempotency key atau `UNIQUE` dalam schema; guard frontend hanya lokal pada `submittingRef` (`frontend/src/components/InstallationForm.jsx:604-701`).
- **Perbaikan konkret:** kirim UUID idempotency dari frontend, simpan sebagai unique key, dan kembalikan hasil lama untuk retry yang sama. Tentukan aturan bisnis current assignment versus history sebelum menambah unique constraint; idealnya normalisasi device/ODP assignment aktif dan biarkan report tetap historis.

#### M-03 — Exception internal dibocorkan dalam respons 500

- **Status:** CONFIRMED.
- **Dampak:** pesan PDO/filesystem dapat mengungkap nama tabel, path server, atau detail implementasi kepada klien/penyerang.
- **Bukti:** exception dicatat dengan benar, tetapi juga digabung ke body JSON di `api/installations.php:338-344`.
- **Perbaikan konkret:** kembalikan pesan generik dan correlation ID saja; simpan detail exception hanya di log terproteksi. Gunakan `JSON_THROW_ON_ERROR` atau fallback response agar kegagalan encoding setelah commit tidak menghasilkan respons ambigu.

#### M-04 — Tidak ada automated test suite/CI untuk kontrak kompleks

- **Status:** CONFIRMED.
- **Dampak:** perubahan kecil pada nama field, transaksi, CORS, upload, lifecycle GPS, atau service worker dapat regresi tanpa terdeteksi. Build hanya membuktikan kompilasi.
- **Bukti:** `frontend/package.json:6-10` hanya mempunyai `dev`, `build`, `preview`; pencarian `.test`/`.spec` tidak menemukan test; backend tidak memiliki Composer/PHPUnit config.
- **Perbaikan konkret:** tambahkan unit test validasi React, integration test multipart PHP dengan MySQL test, test rollback/cleanup/CORS/auth/idempotency, dan browser E2E untuk tiga tahap/PWA. Jalankan lint, test, build, dan migration check di CI.

#### M-05 — Dokumentasi deployment hanya kuat di sisi frontend

- **Status:** CONFIRMED.
- **Dampak:** operator belum mempunyai prosedur tunggal untuk import/upgrade schema, environment PDO, permission/private upload, virtual-host API, auth, backup, dan rollback. Deploy antar mesin berisiko berbeda.
- **Bukti:** hanya `frontend/README.md` ditemukan; tidak ada README root/ops. `config/database.php:10-14` mendukung environment tetapi fallback ke `root` tanpa password untuk Laragon lokal.
- **Perbaikan konkret:** buat runbook root yang menjelaskan versi MySQL/MariaDB/PHP, schema migration, environment non-secret, vhost HTTPS, CORS, Web SAPI limits, permission upload, health check, backup/restore, dan smoke E2E. Default root kosong harus dibatasi untuk local development.

### Low

#### L-01 — Entropi nama file hanya 32-bit dan tidak ada collision guard eksplisit

- **Status:** CONFIRMED.
- **Dampak:** collision normal sangat kecil, tetapi suffix `random_bytes(4)` dapat bertabrakan pada volume/abuse tinggi; destination tidak diperiksa secara eksklusif sehingga overwrite bergantung perilaku filesystem.
- **Bukti:** `api/installations.php:218-228` memakai timestamp detik + delapan digit hex lalu langsung `move_uploaded_file`.
- **Perbaikan konkret:** gunakan minimal `bin2hex(random_bytes(16))`, shard directory bila volume tinggi, dan ulangi pembuatan nama jika destination sudah ada; jangan pernah memakai nama asli klien.

#### L-02 — Dua input file tersembunyi per kartu tetap berpotensi menjadi stop fokus tak terlihat

- **Status:** CONFIRMED secara statis; dampak screen reader/keyboard aktual NOT VERIFIED.
- **Dampak:** input picker dan kamera diposisikan 1×1/clip tetapi tidak dikeluarkan dari tab order, sementara aksi yang sama sudah tersedia sebagai tombol terlihat. Pengguna keyboard dapat mendapat fokus tanpa indikator visual yang berguna.
- **Bukti:** class `visuallyHiddenFile` di `frontend/src/components/InstallationForm.module.css:398-406`; input pada `InstallationForm.jsx:810-839`; tombol visible pada `:857-882`.
- **Perbaikan konkret:** gunakan satu pola aksesibel yang konsisten: input terasosiasi dengan `<label>` yang terlihat, atau keluarkan input programmatic dari tab order dan pertahankan tombol bernama jelas; validasi dengan keyboard dan screen reader.

## D. Hasil command validasi aktual

Semua command dijalankan read-only terhadap data aplikasi; `npm run build` meregenerasi artefak `dist/` dengan nama/ukuran yang sama seperti snapshot yang dibaca, tanpa mengedit source/config. Tidak ada server/watch yang dibiarkan berjalan.

| ID | Command / cwd | Exit code | Ringkasan hasil |
|---|---|---:|---|
| CMD-00 | `git -C "d:\website_ppn\laporanteknisi" status --short --untracked-files=all` dan `git -C ... ls-files` | 1 | Workspace bukan repository Git; status/diff tidak tersedia. |
| CMD-01 | `npm run build` di `d:\website_ppn\laporanteknisi\frontend` | 0 | Vite `8.3.4`; 17 modul; `dist/index.html` 1,00 kB, CSS 13,47 kB, JS 162,23 kB; selesai 435 ms. |
| CMD-02 | `npm audit --json` lalu `npm ls --depth=0 --json` di frontend | 0 | 0 vulnerability seluruh severity; versi installed cocok: React/React DOM `18.3.1`, Vite `8.3.4`, plugin `6.1.2`. |
| CMD-03 | `node --check "d:\...\frontend\public\sw.js"` dan parse kedua manifest dengan Node | 0 | Sintaks service worker valid; manifest source dan dist valid JSON. |
| CMD-04 | `php -l` untuk ketiga file PHP | 0 | Tidak ada syntax error pada `api/installations.php`, `config/database.php`, `uploads/index.php`. |
| CMD-04a | `node --version`, `npm --version`, `php --version`, `php --ini`, dan pembacaan `ini_get` | 0 | Node `v24.20.0`, npm `11.19.0`, PHP `8.4.25` CLI dari WinGet; fileinfo tersedia; PDO driver mysql tersedia; `upload_max_filesize=2M`, `post_max_size=8M`, `memory_limit=128M`; mysql CLI tidak ditemukan. |
| CMD-05 | Probe PDO read-only ke `information_schema` pada database default | 1 | Gagal sebelum query: MySQL `127.0.0.1:3306` actively refused connection. Tidak ada data yang diubah. |
| CMD-06 | Tiga simulasi CLI endpoint dengan `REQUEST_METHOD=OPTIONS`, `GET`, dan empty `POST` | 0 masing-masing | OPTIONS → 204; GET → 405 + JSON error; POST → 500 + JSON koneksi DB yang bersih. CLI SAPI tidak mengekspos daftar header, sehingga header CORS dinilai dari source. |
| CMD-07 | Pemeriksaan listener port smoke sementara `18765` | 0 | `temporary_server_listener=absent`; tidak ada server sementara tertinggal. |

Tidak ada `npm test`, `phpunit`, lint, atau migration test yang dapat dijalankan karena script/config tersebut tidak ada.

## E. Hal yang tidak dapat diverifikasi di lingkungan ini

1. Schema benar-benar sudah di-import, versi MySQL/MariaDB Laragon, FK/view aktual, SQL mode, dan data existing—server DB menolak koneksi.
2. Jalur POST sukses 201, dua insert atomik, `lastInsertId`, rollback ketika insert kedua gagal, dan cleanup empat file pada kegagalan. Audit ini read-only dan tidak boleh membuat record/upload nyata.
3. Konfigurasi PHP **Web SAPI** Laragon, Apache/Nginx `LimitRequestBody`/`client_max_body_size`, permission filesystem, dan konfigurasi virtual host di luar workspace.
4. Header CORS melalui HTTP server aktual. Percobaan smoke HTTP lokal diblokir oleh approval harness sebelum server dijalankan; pemeriksaan listener memastikan tidak ada proses tertinggal. Source tetap cukup untuk mengonfirmasi cabang wildcard.
5. HTTPS `laporanteknisi.test`, trust sertifikat pada ponsel, mixed-content behavior, dan origin deployment final.
6. GPS/kamera fisik Android/iOS, permission lifecycle browser nyata, drag-and-drop aktual, install/update PWA, offline shell, dan audit screen reader/axe. Source/build serta screenshot lama mendukung implementasi, tetapi bukan pengganti uji perangkat.
7. Perlindungan tambahan yang mungkin berada pada konfigurasi Laragon di luar workspace, reverse proxy/WAF, gateway auth, backup, monitoring, atau kebijakan retensi. Karena tidak terlihat, kontrol tersebut tidak boleh diasumsikan ada.
8. Integrasi dengan sistem billing eksternal apa pun; tidak ada client, endpoint, credential/config, webhook, queue, atau dokumentasi integrasi di workspace.

## F. Prioritas tindakan minimum

### Agar mencapai MVP lokal yang benar-benar berjalan

1. **Tutup akses write lebih dulu:** tambahkan autentikasi teknisi minimum, server-derived `technician_id`, deny-by-default CORS, dan rate limit. Jangan menguji dengan data pelanggan nyata sebelum ini.
2. **Aktifkan database Laragon dan terapkan schema:** import `database/schema.sql`, verifikasi dua tabel/FK/view lewat `information_schema`, lalu gunakan database test untuk smoke.
3. **Selaraskan limit upload Web SAPI:** 6 MiB/file dan minimal 32 MiB body, limit web server yang sama, permission direktori yang tepat, serta penyimpanan foto privat/non-executable.
4. **Buat dashboard billing MVP:** read API terautentikasi dan UI admin untuk daftar/detail/filter pelanggan aktif beserta report/foto yang diotorisasi. Jika hanya view yang dibutuhkan sementara, dokumentasikan bahwa ini feed, bukan sistem invoice/payment.
5. **Perkuat validasi dan idempotency:** panjang/format field, whitelist status, constraint VLAN/koordinat/status, UUID submission unique, dan kebijakan duplicate ONT/ODP-port yang tidak merusak histori.
6. **Jalankan smoke end-to-end pada database test:** sukses empat file, tiap kegagalan upload, validation 422, duplicate retry, rollback insert kedua, cleanup file, origin allowed/denied, respons non-JSON, dan empat file mendekati 5 MiB.
7. **Uji frontend pada ponsel HTTPS:** GPS allow/deny/timeout, koreksi manual, kamera/picker, ganti/hapus, viewport kecil, keyboard/focus, PWA scope `/teknisi/`, dan pastikan POST tidak berada di Cache Storage.

### Agar production-ready

1. RBAC teknisi/admin, credential/session/token lifecycle, TLS wajib, CSRF sesuai mekanisme auth, secret management, rate limit/abuse controls, immutable audit trail, dan monitoring/alerting.
2. Penyimpanan objek privat di luar web root dengan authenticated delivery, retention/deletion policy, consent/privacy notice, backup terenkripsi, dan prosedur incident response.
3. Migration versioning alih-alih hanya `CREATE TABLE IF NOT EXISTS`; least-privilege DB user; FK technician; constraint/domain DB; model current device/ODP assignment yang terpisah dari report historis.
4. Idempotency end-to-end dan recovery untuk kasus commit berhasil tetapi respons hilang; sanitasi exception dan correlation ID.
5. Automated tests + CI untuk React, PHP, schema, multipart/rollback, security headers/CORS, browser E2E, dependency audit, dan reproducible deployment.
6. Definisikan scope billing secara eksplisit. Jika diperlukan penagihan sungguhan, tambahkan paket, subscription, billing cycle, invoice, payment, aging/status, dan rekonsiliasi—bukan hanya `billing_status`.

## G. Jawaban eksplisit per lapisan

- **Apakah frontend sudah sesuai?** **YA pada level implementasi source/build, dengan catatan verifikasi perangkat dan live API belum selesai.** Semua 14 field teks, empat foto, tiga tahap, GPS + manual fallback, preview/hapus/ganti, FormData, loading/error/reset, responsive UI, aksesibilitas dasar, dan PWA `/teknisi/` ada. Build dan dependency audit lulus.
- **Apakah backend sudah sesuai?** **SEBAGIAN.** Endpoint, PDO prepared statements, validasi dasar, transaksi, file cleanup, aktivasi status, dan JSON contract ada. Namun success path belum terverifikasi; auth/rate limit tidak ada; CORS fail-open; privacy upload dan error handling belum aman untuk produksi.
- **Apakah database sudah sesuai?** **SEBAGIAN.** DDL mencakup dua tabel, field inti, InnoDB/utf8mb4, timestamps, FK cascade, index, dan view. Tetapi schema belum terbukti diterapkan karena MySQL mati/tidak menerima koneksi; constraint domain, relasi teknisi, idempotency/uniqueness, dan alur histori masih lemah.
- **Apakah billing dashboard sudah sesuai?** **TIDAK.** Hanya ada SQL view bernama `v_billing_dashboard`; tidak ada dashboard UI, read API, auth admin, maupun fungsi billing nyata.
- **Apakah sistem keseluruhan sudah sesuai?** **BELUM.** Frontend yang baik tidak membuktikan sistem end-to-end selesai. Minimum sebelum klaim MVP adalah DB hidup/schema terpasang, upload+transaction smoke berhasil, CORS/auth dibenahi, limit Web SAPI sesuai, penyimpanan foto privat, dan dashboard admin minimal benar-benar tersedia.
