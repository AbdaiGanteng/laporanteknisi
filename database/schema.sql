-- =====================================================================
-- Database Schema: Sistem Operasional Teknisi & Dashboard Billing Admin
-- Database Default: laporanteknisi_db (MySQL / MariaDB di Laragon)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `laporanteknisi_db`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `laporanteknisi_db`;

-- ---------------------------------------------------------------------
-- 1. Tabel Pelanggan & Lokasi (customers)
--    Menyimpan profil pelanggan, titik koordinat GPS, dan status billing.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `address` TEXT NOT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `billing_status` ENUM('active', 'inactive', 'pending_installation') DEFAULT 'pending_installation',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_customers_billing_status` (`billing_status`),
  INDEX `idx_customers_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Tabel Laporan Teknis & Perangkat (installation_reports)
--    Menyimpan parameter teknis hasil pemasangan di lapangan dan path foto.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `installation_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `technician_id` INT NULL, -- ID teknisi yang bertugas (opsional)

  -- Data Jaringan & Perangkat Hardware
  `odp_code` VARCHAR(50) NOT NULL,
  `odp_port` VARCHAR(20) NOT NULL,
  `ont_sn` VARCHAR(100) NOT NULL,
  `ont_mac` VARCHAR(50) NOT NULL,
  `stb_sn` VARCHAR(100) NULL,
  `stb_mac` VARCHAR(50) NULL,

  -- Pengukuran Teknis Jaringan
  `rx_optical_power` DECIMAL(5, 2) NOT NULL, -- Contoh: -20.50 dBm
  `port_status` VARCHAR(50) NOT NULL,
  `vlan_id` VARCHAR(50) NOT NULL,

  -- Hasil Pengujian & Bukti Lapangan (Path file relatif ke folder uploads/)
  `speedtest_photo` VARCHAR(255) NOT NULL,
  `house_photo` VARCHAR(255) NOT NULL,
  `odp_photo` VARCHAR(255) NOT NULL,
  `device_photo` VARCHAR(255) NOT NULL,

  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Relasi Foreign Key ke tabel customers (Cascade Delete)
  CONSTRAINT `fk_installation_reports_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  INDEX `idx_reports_customer_id` (`customer_id`),
  INDEX `idx_reports_ont_sn` (`ont_sn`),
  INDEX `idx_reports_odp_code` (`odp_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. View Otomatisasi Billing Admin (v_billing_dashboard)
--    Menyajikan data gabungan pelanggan aktif dan detail teknis siap tagih.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW `v_billing_dashboard` AS
SELECT 
    c.id AS customer_id,
    c.name AS customer_name,
    c.address AS customer_address,
    c.phone AS customer_phone,
    c.latitude,
    c.longitude,
    c.billing_status,
    c.created_at AS registered_at,
    r.id AS report_id,
    r.technician_id,
    r.odp_code,
    r.odp_port,
    r.ont_sn,
    r.ont_mac,
    r.stb_sn,
    r.stb_mac,
    r.rx_optical_power,
    r.port_status,
    r.vlan_id,
    r.speedtest_photo,
    r.house_photo,
    r.odp_photo,
    r.device_photo,
    r.created_at AS installed_at
FROM `customers` c
LEFT JOIN `installation_reports` r ON c.id = r.customer_id;
