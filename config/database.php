<?php
/**
 * Konfigurasi Database PDO untuk MySQL Laragon
 * File: config/database.php
 */

declare(strict_types=1);

// Konfigurasi Kredensial Database (Default Laragon)
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'laporanteknisi_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: ''); // Default Laragon tanpa password

/**
 * Mendapatkan instance koneksi PDO MySQL
 * 
 * @return PDO
 * @throws PDOException
 */
function getDbConnection(): PDO
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        DB_HOST,
        DB_PORT,
        DB_NAME
    );

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // Log pesan error teknis ke log internal server
        error_log('Database Connection Error: ' . $e->getMessage());

        // Kembalikan response JSON bersih tanpa membocorkan kredensial ke client
        http_response_code(500);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'status'  => 'error',
            'message' => 'Gagal terhubung ke database server. Pastikan MySQL di Laragon aktif dan database laporanteknisi_db sudah dibuat.'
        ]);
        exit;
    }
}
