# Frontend Form Pemasangan Teknisi

Aplikasi Vite + React mobile-first/PWA untuk mengirim data pemasangan pelanggan dan empat foto bukti ke REST API PHP. Proyek berdiri sendiri di folder `frontend/` dan tidak mengubah backend pada folder `api/`, `config/`, atau `uploads/`.

## Prasyarat

- Node.js `^20.19.0` atau `>=22.12.0` (persyaratan Vite 8)
- npm
- Backend PHP dan MySQL yang dapat diakses dari browser
- HTTPS saat GPS dan PWA diuji selain melalui `localhost`

## Instalasi

Jalankan dari folder `frontend`:

```powershell
npm install
```

Seluruh dependency langsung dipin ke versi exact di `package.json`.

## Konfigurasi endpoint API

Salin `.env.example` menjadi `.env`, lalu sesuaikan URL API HTTPS Laragon:

```env
VITE_API_URL=https://laporanteknisi.test/api/installations.php
```

Nama host tersebut hanya contoh. Urutan pemilihan endpoint adalah:

1. prop `apiUrl` pada komponen `InstallationForm`;
2. variabel `VITE_API_URL`;
3. fallback same-origin `/api/installations.php` jika keduanya kosong.

Contoh override melalui prop:

```jsx
<InstallationForm apiUrl="https://laporanteknisi.test/api/installations.php" />
```

Untuk deployment same-origin, kosongkan `VITE_API_URL`. Walaupun frontend disajikan pada `/teknisi/`, fallback API tetap mengarah ke `/api/installations.php` pada root origin yang sama. Jangan menaruh kredensial atau rahasia dalam variabel `VITE_*` karena nilainya masuk ke bundle browser. Mulai ulang Vite setelah mengubah `.env`.

## Menjalankan saat pengembangan

Jalankan server pengembangan secara manual:

```powershell
npm run dev
```

Buka URL yang ditampilkan Vite, dengan path aplikasi `/teknisi/`. Server pengembangan tidak perlu dijalankan untuk build produksi.

## Build dan deployment produksi

```powershell
npm run build
```

Hasil build tersedia di `dist/`. Konfigurasi `base` Vite, manifest, dan service worker sengaja memakai path khusus `/teknisi/`. Sajikan **isi** `dist/` pada URL seperti:

```text
https://laporanteknisi.test/teknisi/
```

Jangan menyajikannya sebagai aplikasi root jika origin yang sama juga memuat dashboard admin. Pastikan server mengembalikan `dist/index.html` untuk `/teknisi/` dan `/teknisi/index.html`, serta melayani `/teknisi/assets/`, `/teknisi/icons/`, `/teknisi/sw.js`, dan `/teknisi/manifest.webmanifest` dari build yang sama.

## HTTPS Laragon, GPS, dan mixed content

Geolocation dan instalasi PWA memerlukan secure context. `http://localhost` biasanya dipercaya browser untuk pengembangan pada komputer yang sama, tetapi custom host HTTP seperti `http://laporanteknisi.test` dan alamat LAN HTTP pada ponsel bukan secure context.

Untuk pengujian perangkat:

1. aktifkan SSL/HTTPS untuk virtual host melalui konfigurasi Apache/Nginx Laragon;
2. pastikan sertifikat lokal dipercaya oleh komputer dan perangkat uji;
3. sajikan frontend melalui `https://laporanteknisi.test/teknisi/`;
4. gunakan endpoint API HTTPS juga agar tidak diblokir sebagai mixed content;
5. periksa `window.isSecureContext === true` sebelum menguji GPS.

Nama menu SSL dapat berbeda antarversi Laragon. Gunakan fasilitas SSL virtual host Laragon atau konfigurasi sertifikat web server yang aktif.

## CORS saat origin berbeda

Origin mencakup skema, host, dan port. Jika frontend dan PHP berbeda origin, backend harus mengizinkan **origin frontend aktual** (contoh pengembangan: `http://localhost:5173`) dan menangani `OPTIONS` bila browser mengirim preflight. Respons PHP setidaknya perlu mengizinkan metode `POST` dan mengirim `Vary: Origin` saat origin dipilih dinamis.

Form dikirim sebagai `multipart/form-data` oleh browser. Frontend sengaja tidak menetapkan `Content-Type`, agar boundary upload dibuat otomatis. Same-origin HTTPS adalah konfigurasi produksi paling sederhana karena tidak memerlukan CORS.

## Batas multipart PHP dan web server

Frontend menerima empat foto dengan batas **5 MiB per foto**. Total file saja dapat mencapai 20 MiB; body multipart sedikit lebih besar karena field teks, nama file, dan boundary. Konfigurasi bawaan PHP seperti `upload_max_filesize=2M` dan `post_max_size=8M` tidak cukup dan dapat menolak request sebelum `installations.php` berjalan.

Pada PHP yang benar-benar dipakai web server Laragon, gunakan setidaknya konfigurasi berikut:

```ini
upload_max_filesize = 6M
post_max_size = 32M
memory_limit = 128M
max_file_uploads = 20
```

Selaraskan pula limit web server bila dikonfigurasi:

```apacheconf
# Apache, hanya bila virtual host/direktori menetapkan LimitRequestBody
LimitRequestBody 33554432
```

```nginx
# Nginx, di blok server/location aplikasi
client_max_body_size 32m;
```

Langkah Laragon:

1. buka `php.ini` dari versi PHP yang dipilih Laragon, bukan hanya `php.ini` milik PHP CLI lain di `PATH`;
2. ubah limit PHP di atas dan limit Apache/Nginx bila ada;
3. jalankan **Restart All** di Laragon;
4. verifikasi dari Web SAPI yang melayani API—hasil `php --ini` CLI saja belum membuktikan konfigurasi Apache/Nginx;
5. kirim empat gambar mendekati 5 MiB dan pastikan endpoint tetap menerima `$_POST`/`$_FILES` serta mengembalikan JSON.

Untuk pemeriksaan lokal sementara, endpoint diagnostik yang hanya dapat diakses lokal dapat menampilkan `PHP_SAPI`, `php_ini_loaded_file()`, `ini_get('upload_max_filesize')`, dan `ini_get('post_max_size')`. Hapus endpoint diagnostik sebelum aplikasi dipublikasikan. Jika server tidak boleh menerima body 32 MiB, batas frontend dan backend harus diturunkan bersama; jangan hanya mengubah salah satunya.

Validasi browser hanya membantu pengguna dan **bukan batas keamanan**. API PHP tetap wajib memeriksa error upload, ukuran tiap file, jumlah/ukuran total request, serta isi MIME secara independen (misalnya dengan `finfo`/`getimagesize`), membuat nama file aman, dan mencegah eksekusi skrip dari folder upload.

## Alur dan validasi form

Form terdiri dari tiga tahap:

1. data pelanggan dan koordinat lokasi;
2. data perangkat dan pengukuran sinyal;
3. empat foto wajib, ringkasan, dan pengiriman.

Koordinat dapat diambil melalui GPS atau diisi manual. Koreksi manual membatalkan hasil GPS yang masih tertunda agar callback lama tidak menimpa input. Form hanya direset bila API mengembalikan JSON 2xx dengan `status: "success"`; respons ambigu atau error mempertahankan data dan foto agar dapat dicoba kembali.

Foto hanya menerima JPEG, PNG, atau WebP. Masing-masing mendukung picker, kamera belakang, drag-and-drop, preview, ganti, dan hapus.

## PWA dan kebijakan cache

Manifest, ikon 192/512, dan service worker disertakan pada build produksi. PWA diisolasi pada scope `/teknisi/`:

- service worker hanya mengontrol halaman di scope tersebut;
- cleanup hanya menghapus cache versi lama dengan prefix `laporan-teknisi-static-`, bukan cache aplikasi lain;
- hanya app shell yang eksplisit dan aset build di `/teknisi/assets/` yang boleh disimpan;
- halaman/aset dashboard admin di luar `/teknisi/` tidak dicegat atau disimpan;
- request selain `GET`, termasuk `POST /api/installations.php`, tidak dicegat, disimpan, diantrekan, atau diulang.

Jika versi lama pernah dipasang dengan scope `/`, koordinasikan penghapusan registrasi lama yang script URL-nya tepat mengarah ke `/sw.js` dan cache lama `laporan-teknisi-static-*`. Jangan menghapus seluruh Cache Storage origin karena dapat berisi cache dashboard admin atau aplikasi lain.

Laporan tidak diantrekan offline. Pengiriman tanpa jaringan menampilkan error dan teknisi dapat mencoba lagi setelah koneksi pulih. Saat mengubah kebijakan cache, naikkan versi `CACHE_NAME` di `public/sw.js`.

## Checklist smoke test sebelum rilis

Lakukan pada minimal satu ponsel dan satu browser desktop melalui HTTPS:

- izin GPS berhasil, ditolak, timeout, koreksi manual saat callback tertunda, dan fallback manual;
- kamera belakang/picker, drag-and-drop desktop, ganti serta hapus foto;
- stepper dan action bar tetap terlihat pada viewport kecil;
- fokus keyboard, pesan error, dan live region dapat dipahami;
- request multipart sukses ke PHP dengan origin/CORS aktual dan empat file mendekati batas ukuran;
- respons JSON `status: "success"`, respons 2xx ambigu, non-JSON, HTTP error, dan jaringan putus;
- respons selain sukses eksplisit mempertahankan seluruh isian serta foto;
- instalasi/update PWA hanya pada scope `/teknisi/` dan tidak menyentuh cache aplikasi lain;
- pastikan request `POST /api/installations.php` tidak muncul di Cache Storage.

## Struktur utama

```text
frontend/
├── public/
│   ├── icons/
│   │   ├── icon.svg
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── manifest.webmanifest
│   └── sw.js
├── src/
│   ├── components/
│   │   ├── InstallationForm.jsx
│   │   └── InstallationForm.module.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```
