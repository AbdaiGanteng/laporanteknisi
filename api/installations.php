<?php
/**
 * RESTful API Endpoint: Form Pemasangan Baru Teknisi & Aktivasi Billing
 * File: api/installations.php
 * Method: POST (multipart/form-data)
 */

declare(strict_types=1);

// ---------------------------------------------------------------------
// 1. Konfigurasi Header & CORS (Cross-Origin Resource Sharing)
// ---------------------------------------------------------------------
$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost',
    'http://127.0.0.1',
    'http://laporanteknisi.test',
    'https://laporanteknisi.test'
];

$httpOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($httpOrigin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$httpOrigin}");
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Vary: Origin');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=UTF-8');

// Tangani Preflight Request dari Browser (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Pastikan hanya metode POST yang diizinkan
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Metode HTTP tidak diizinkan. Gunakan metode POST.'
    ]);
    exit;
}

// ---------------------------------------------------------------------
// 2. Hubungkan ke Database
// ---------------------------------------------------------------------
require_once __DIR__ . '/../config/database.php';

$pdo = getDbConnection();

// Array penampung file yang berhasil disimpan ke disk (untuk rollback jika ada error)
$uploadedFilesOnDisk = [];

try {
    // -----------------------------------------------------------------
    // 3. Validasi & Sanitasi Input Data Formulir
    // -----------------------------------------------------------------
    $name           = trim($_POST['name'] ?? '');
    $address        = trim($_POST['address'] ?? '');
    $latitudeRaw    = trim($_POST['latitude'] ?? '');
    $longitudeRaw   = trim($_POST['longitude'] ?? '');
    $phone          = trim($_POST['phone'] ?? '');

    $odpCode        = trim($_POST['odp_code'] ?? '');
    $odpPort        = trim($_POST['odp_port'] ?? '');
    $ontSn          = trim($_POST['ont_sn'] ?? '');
    $ontMac         = trim($_POST['ont_mac'] ?? '');
    $stbSn          = trim($_POST['stb_sn'] ?? '');
    $stbMac         = trim($_POST['stb_mac'] ?? '');

    $rxOpticalRaw   = trim($_POST['rx_optical_power'] ?? '');
    $portStatus     = trim($_POST['port_status'] ?? '');
    $vlanIdRaw      = trim($_POST['vlan_id'] ?? '');
    $technicianId   = !empty($_POST['technician_id']) ? (int)$_POST['technician_id'] : null;

    $errors = [];

    // Validasi Data Pelanggan & Lokasi
    if ($name === '') {
        $errors['name'] = 'Nama pelanggan wajib diisi.';
    }
    if ($address === '') {
        $errors['address'] = 'Alamat pelanggan wajib diisi.';
    }
    if ($phone === '') {
        $errors['phone'] = 'Nomor HP / WhatsApp wajib diisi.';
    }

    if ($latitudeRaw === '' || !is_numeric($latitudeRaw)) {
        $errors['latitude'] = 'Latitude harus berupa nilai numerik valid.';
    } else {
        $latFloat = (float)$latitudeRaw;
        if ($latFloat < -90.0 || $latFloat > 90.0) {
            $errors['latitude'] = 'Latitude harus berada dalam rentang -90 hingga 90.';
        }
    }

    if ($longitudeRaw === '' || !is_numeric($longitudeRaw)) {
        $errors['longitude'] = 'Longitude harus berupa nilai numerik valid.';
    } else {
        $lngFloat = (float)$longitudeRaw;
        if ($lngFloat < -180.0 || $lngFloat > 180.0) {
            $errors['longitude'] = 'Longitude harus berada dalam rentang -180 hingga 180.';
        }
    }

    // Validasi Data Jaringan & Perangkat
    if ($odpCode === '') {
        $errors['odp_code'] = 'Kode ODP wajib diisi.';
    }
    if ($odpPort === '') {
        $errors['odp_port'] = 'Nomor port ODP wajib diisi.';
    }
    if ($ontSn === '') {
        $errors['ont_sn'] = 'Serial Number ONT wajib diisi.';
    }
    if ($ontMac === '') {
        $errors['ont_mac'] = 'MAC Address ONT wajib diisi.';
    }

    // Validasi Pengukuran Sinyal
    if ($rxOpticalRaw === '' || !is_numeric($rxOpticalRaw)) {
        $errors['rx_optical_power'] = 'Rx Optical Power harus berupa nilai numerik dBm (contoh: -20.50).';
    }
    if ($portStatus === '') {
        $errors['port_status'] = 'Status port wajib dipilih.';
    }
    if ($vlanIdRaw === '' || !ctype_digit($vlanIdRaw) || (int)$vlanIdRaw < 1 || (int)$vlanIdRaw > 4094) {
        $errors['vlan_id'] = 'VLAN ID harus berupa bilangan bulat antara 1 dan 4094.';
    }

    // -----------------------------------------------------------------
    // 4. Validasi 4 File Foto Bukti Lapangan
    // -----------------------------------------------------------------
    $requiredPhotos = [
        'speedtest_photo' => 'Foto hasil speedtest',
        'house_photo'     => 'Foto rumah pelanggan',
        'odp_photo'       => 'Foto ODP / kabel',
        'device_photo'    => 'Foto perangkat menyala'
    ];

    $allowedMimes      = ['image/jpeg', 'image/png', 'image/webp'];
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    $maxFileSize       = 5 * 1024 * 1024; // 5 Megabytes

    $finfo = new finfo(FILEINFO_MIME_TYPE);

    foreach ($requiredPhotos as $fieldKey => $fieldLabel) {
        if (!isset($_FILES[$fieldKey]) || $_FILES[$fieldKey]['error'] === UPLOAD_ERR_NO_FILE) {
            $errors[$fieldKey] = "{$fieldLabel} wajib diunggah.";
            continue;
        }

        $file = $_FILES[$fieldKey];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors[$fieldKey] = "Gagal mengunggah {$fieldLabel} (Kode error PHP: {$file['error']}).";
            continue;
        }

        if ($file['size'] > $maxFileSize) {
            $errors[$fieldKey] = "Ukuran {$fieldLabel} melebihi batas maksimal 5 MB.";
            continue;
        }

        $tmpPath = $file['tmp_name'];
        $detectedMime = $finfo->file($tmpPath);

        if (!in_array($detectedMime, $allowedMimes, true)) {
            $errors[$fieldKey] = "Format {$fieldLabel} tidak valid. Hanya menerima file JPG, PNG, atau WebP.";
            continue;
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $allowedExtensions, true)) {
            $errors[$fieldKey] = "Ekstensi file {$fieldLabel} tidak diizinkan.";
            continue;
        }
    }

    // Jika terdapat error validasi input teks atau file, hentikan proses
    if (!empty($errors)) {
        http_response_code(422);
        echo json_encode([
            'status'  => 'error',
            'message' => 'Validasi data gagal. Silakan periksa kolom yang ditandai.',
            'errors'  => $errors
        ]);
        exit;
    }

    // -----------------------------------------------------------------
    // 5. Simpan File Foto ke Direktori uploads/
    // -----------------------------------------------------------------
    $uploadDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads';
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
            throw new RuntimeException("Gagal membuat direktori upload: {$uploadDir}");
        }
    }

    $photoPaths = [];
    foreach ($requiredPhotos as $fieldKey => $fieldLabel) {
        $file = $_FILES[$fieldKey];
        $ext  = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($ext === 'jpeg') {
            $ext = 'jpg';
        }

        // Generate nama file acak & unik untuk mencegah benturan dan path traversal
        $uniqueName = sprintf(
            '%s_%s_%s.%s',
            $fieldKey,
            date('Ymd_His'),
            bin2hex(random_bytes(4)),
            $ext
        );

        $destinationPath = $uploadDir . DIRECTORY_SEPARATOR . $uniqueName;

        if (!move_uploaded_file($file['tmp_name'], $destinationPath)) {
            throw new RuntimeException("Gagal menyimpan file {$fieldLabel} ke penyimpanan server.");
        }

        // Catat path absolut untuk keperluan rollback jika transaksi database gagal
        $uploadedFilesOnDisk[] = $destinationPath;

        // Simpan path relatif yang akan disimpan ke database
        $photoPaths[$fieldKey] = 'uploads/' . $uniqueName;
    }

    // -----------------------------------------------------------------
    // 6. Eksekusi Database Transaction (customers & installation_reports)
    // -----------------------------------------------------------------
    $pdo->beginTransaction();

    // 6a. Simpan data pelanggan dengan billing_status 'active' secara otomatis
    $stmtCustomer = $pdo->prepare('
        INSERT INTO customers (
            name, address, latitude, longitude, phone, billing_status
        ) VALUES (
            :name, :address, :latitude, :longitude, :phone, :billing_status
        )
    ');

    $stmtCustomer->execute([
        ':name'           => $name,
        ':address'        => $address,
        ':latitude'       => (float)$latitudeRaw,
        ':longitude'      => (float)$longitudeRaw,
        ':phone'          => $phone,
        ':billing_status' => 'active' // Otomatis aktif agar langsung masuk ke tagihan billing
    ]);

    $customerId = (int)$pdo->lastInsertId();

    // 6b. Simpan data laporan teknis & perangkat
    $stmtReport = $pdo->prepare('
        INSERT INTO installation_reports (
            customer_id, technician_id,
            odp_code, odp_port,
            ont_sn, ont_mac, stb_sn, stb_mac,
            rx_optical_power, port_status, vlan_id,
            speedtest_photo, house_photo, odp_photo, device_photo
        ) VALUES (
            :customer_id, :technician_id,
            :odp_code, :odp_port,
            :ont_sn, :ont_mac, :stb_sn, :stb_mac,
            :rx_optical_power, :port_status, :vlan_id,
            :speedtest_photo, :house_photo, :odp_photo, :device_photo
        )
    ');

    $stmtReport->execute([
        ':customer_id'       => $customerId,
        ':technician_id'     => $technicianId,
        ':odp_code'          => $odpCode,
        ':odp_port'          => $odpPort,
        ':ont_sn'            => $ontSn,
        ':ont_mac'           => $ontMac,
        ':stb_sn'            => $stbSn !== '' ? $stbSn : null,
        ':stb_mac'           => $stbMac !== '' ? $stbMac : null,
        ':rx_optical_power'  => (float)$rxOpticalRaw,
        ':port_status'       => $portStatus,
        ':vlan_id'           => $vlanIdRaw,
        ':speedtest_photo'   => $photoPaths['speedtest_photo'],
        ':house_photo'       => $photoPaths['house_photo'],
        ':odp_photo'         => $photoPaths['odp_photo'],
        ':device_photo'      => $photoPaths['device_photo'],
    ]);

    $reportId = (int)$pdo->lastInsertId();

    // Commit transaksi jika semua query berhasil
    $pdo->commit();

    // -----------------------------------------------------------------
    // 7. Response JSON Sukses
    // -----------------------------------------------------------------
    http_response_code(201);
    echo json_encode([
        'status'  => 'success',
        'message' => 'Data pemasangan berhasil disimpan dan status billing pelanggan aktif.',
        'data'    => [
            'customer_id'      => $customerId,
            'report_id'        => $reportId,
            'customer_name'    => $name,
            'phone'            => $phone,
            'billing_status'   => 'active',
            'rx_optical_power' => (float)$rxOpticalRaw,
            'odp_code'         => $odpCode,
            'ont_sn'           => $ontSn,
            'photos'           => $photoPaths
        ]
    ]);

} catch (Throwable $e) {
    // Rollback transaksi database jika aktif
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    // Bersihkan file yang sempat diupload agar tidak menjadi file sampah di server
    foreach ($uploadedFilesOnDisk as $filePath) {
        if (file_exists($filePath)) {
            @unlink($filePath);
        }
    }

    // Log pesan error internal
    error_log('API Installations Error: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Terjadi kesalahan pada server saat memproses data pemasangan: ' . $e->getMessage()
    ]);
}
