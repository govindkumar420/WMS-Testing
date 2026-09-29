-- Gnosis WMS MySQL 8.0 database schema
-- Generated from the React data model and the existing Supabase schema.
-- The frontend currently uses Supabase/localStorage; this schema is the MySQL target model.

CREATE DATABASE IF NOT EXISTS gnosis_wms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE gnosis_wms;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP PROCEDURE IF EXISTS get_fefo_picking_recommendation;
DROP TABLE IF EXISTS returns;
DROP TABLE IF EXISTS dispatch_invoices;
DROP TABLE IF EXISTS picklists;
DROP TABLE IF EXISTS sales_order_items;
DROP TABLE IF EXISTS sales_orders;
DROP TABLE IF EXISTS inventory_movements;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS goods_receipt_notes;
DROP TABLE IF EXISTS purchase_order_items;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS customer_crates;
DROP TABLE IF EXISTS kitchen_areas;
DROP TABLE IF EXISTS delivery_locations;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS cold_room_telemetry;
DROP TABLE IF EXISTS cold_rooms;
DROP TABLE IF EXISTS reasons;
DROP TABLE IF EXISTS taxes;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS barcodes;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS uoms;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS warehouses;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(160) NOT NULL,
  role VARCHAR(60) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  email VARCHAR(255),
  phone_number VARCHAR(40),
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_method VARCHAR(20) NOT NULL DEFAULT 'totp',
  two_factor_secret VARCHAR(255) DEFAULT '',
  two_factor_backup_codes JSON NOT NULL,
  permissions JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (status IN ('Active', 'Inactive', 'Suspended')),
  CHECK (two_factor_method IN ('totp', 'sms', 'email'))
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  username VARCHAR(100) NOT NULL DEFAULT 'System',
  role VARCHAR(60) DEFAULT 'System',
  action VARCHAR(255) NOT NULL,
  module VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Success',
  details JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (status IN ('Success', 'Warning', 'Failed', 'Error')),
  INDEX idx_audit_module_time (module, timestamp)
) ENGINE=InnoDB;

CREATE TABLE system_settings (
  `key` VARCHAR(64) PRIMARY KEY,
  barcode_type VARCHAR(40) NOT NULL DEFAULT 'QR Code',
  otp_verify BOOLEAN NOT NULL DEFAULT TRUE,
  two_factor_enforcement VARCHAR(20) NOT NULL DEFAULT 'optional',
  default_two_factor_method VARCHAR(20) NOT NULL DEFAULT 'totp',
  otp_expiry_seconds INT NOT NULL DEFAULT 300,
  max_otp_attempts INT NOT NULL DEFAULT 5,
  email_notification BOOLEAN NOT NULL DEFAULT TRUE,
  sms_notification BOOLEAN NOT NULL DEFAULT FALSE,
  auto_location_suggestion BOOLEAN NOT NULL DEFAULT TRUE,
  fifo_method VARCHAR(10) NOT NULL DEFAULT 'FEFO',
  extra_config JSON,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (two_factor_enforcement IN ('disabled', 'optional', 'privileged', 'all')),
  CHECK (default_two_factor_method IN ('totp', 'sms', 'email')),
  CHECK (fifo_method IN ('FEFO', 'FIFO', 'LIFO'))
) ENGINE=InnoDB;

CREATE TABLE companies (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  gst_no VARCHAR(40),
  address TEXT,
  contact VARCHAR(80),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE warehouses (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  location VARCHAR(255) NOT NULL,
  type VARCHAR(60) NOT NULL,
  capacity DECIMAL(12,2) NOT NULL DEFAULT 0,
  company_id VARCHAR(64),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE locations (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  warehouse_id VARCHAR(64) NOT NULL,
  rack VARCHAR(40) NOT NULL,
  shelf VARCHAR(40) NOT NULL,
  bin VARCHAR(40) NOT NULL,
  type VARCHAR(60) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Available',
  temp_zone VARCHAR(40) DEFAULT 'Ambient',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  INDEX idx_locations_warehouse (warehouse_id),
  INDEX idx_locations_code (code)
) ENGINE=InnoDB;

CREATE TABLE categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE uoms (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE products (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  category VARCHAR(120),
  uom VARCHAR(80) NOT NULL DEFAULT 'KG',
  temp_required VARCHAR(40),
  shelf_life_days INT NOT NULL DEFAULT 7,
  min_qty DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category (category)
) ENGINE=InnoDB;

CREATE TABLE barcodes (
  id VARCHAR(64) PRIMARY KEY,
  barcode VARCHAR(120) NOT NULL UNIQUE,
  qr_code VARCHAR(255) UNIQUE,
  sku VARCHAR(100),
  product VARCHAR(255),
  product_id VARCHAR(64),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE vendors (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  contact VARCHAR(80),
  email VARCHAR(255),
  city VARCHAR(100),
  address TEXT,
  gst_no VARCHAR(40),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE customers (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  contact VARCHAR(80),
  email VARCHAR(255),
  gst_no VARCHAR(40),
  address TEXT,
  delivery_address TEXT,
  city VARCHAR(100),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE delivery_locations (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE kitchen_areas (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE drivers (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  mobile VARCHAR(40) NOT NULL,
  license_no VARCHAR(100) NOT NULL UNIQUE,
  transporter VARCHAR(160),
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE employees (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  role VARCHAR(100) NOT NULL,
  department VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE taxes (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  cgst DECIMAL(5,2) NOT NULL DEFAULT 0,
  sgst DECIMAL(5,2) NOT NULL DEFAULT 0,
  igst DECIMAL(5,2) NOT NULL DEFAULT 0,
  gst_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE reasons (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE cold_rooms (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  min_temp DECIMAL(5,2) NOT NULL,
  max_temp DECIMAL(5,2) NOT NULL,
  current_temp DECIMAL(5,2) NOT NULL,
  current_humidity DECIMAL(5,2) NOT NULL DEFAULT 85,
  status VARCHAR(20) NOT NULL DEFAULT 'Normal',
  warehouse_id VARCHAR(64),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE cold_room_telemetry (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cold_room_id VARCHAR(64) NOT NULL,
  temperature DECIMAL(5,2) NOT NULL,
  humidity DECIMAL(5,2),
  status VARCHAR(30) NOT NULL DEFAULT 'Normal',
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cold_room_id) REFERENCES cold_rooms(id) ON DELETE CASCADE,
  INDEX idx_telemetry_room_time (cold_room_id, recorded_at)
) ENGINE=InnoDB;

CREATE TABLE vehicles (
  id VARCHAR(64) PRIMARY KEY,
  vehicle_no VARCHAR(40) NOT NULL,
  driver_name VARCHAR(160) NOT NULL,
  driver_mobile VARCHAR(40),
  transporter VARCHAR(160),
  gatepass_no VARCHAR(100) NOT NULL UNIQUE,
  process_type VARCHAR(20) NOT NULL,
  booking_type VARCHAR(40) NOT NULL,
  booking_ref_doc_no VARCHAR(100),
  in_date_time DATETIME,
  out_date_time DATETIME,
  in_km_reading DECIMAL(10,2),
  out_km_reading DECIMAL(10,2),
  status VARCHAR(40) NOT NULL DEFAULT 'Gate In',
  remark TEXT,
  temp_log JSON,
  seal_no VARCHAR(100),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vehicles_status (status),
  INDEX idx_vehicles_gatepass (gatepass_no)
) ENGINE=InnoDB;

CREATE TABLE customer_crates (
  id VARCHAR(64) PRIMARY KEY,
  customer VARCHAR(200) NOT NULL,
  customer_id VARCHAR(64),
  qty INT NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Cleaned & Restocked',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE purchase_orders (
  id VARCHAR(64) PRIMARY KEY,
  po_no VARCHAR(100) NOT NULL UNIQUE,
  vendor_id VARCHAR(64) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Draft',
  remarks TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE purchase_order_items (
  id VARCHAR(64) PRIMARY KEY,
  purchase_order_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  expected_qty DECIMAL(12,2) NOT NULL DEFAULT 0,
  received_qty DECIMAL(12,2) NOT NULL DEFAULT 0,
  rate DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_po_items_po (purchase_order_id)
) ENGINE=InnoDB;

CREATE TABLE goods_receipt_notes (
  id VARCHAR(64) PRIMARY KEY,
  grn_no VARCHAR(100) NOT NULL UNIQUE,
  purchase_order_id VARCHAR(64),
  po_no VARCHAR(100),
  gatepass_no VARCHAR(100),
  vehicle_no VARCHAR(40),
  vendor_id VARCHAR(64),
  received_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  received_by VARCHAR(100),
  status VARCHAR(40) NOT NULL DEFAULT 'Completed',
  remarks TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE SET NULL,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE inventory (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL,
  batch_no VARCHAR(100) NOT NULL,
  lot_no VARCHAR(100),
  qty DECIMAL(12,2) NOT NULL DEFAULT 0,
  location_code VARCHAR(80) NOT NULL,
  mfg_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  warehouse_id VARCHAR(64) NOT NULL,
  age_days INT DEFAULT 0,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  temp_log DECIMAL(5,2),
  grade VARCHAR(40) DEFAULT 'Grade A',
  supplier VARCHAR(160),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT,
  INDEX idx_inventory_product (product_id),
  INDEX idx_inventory_expiry (expiry_date),
  INDEX idx_inventory_batch (batch_no),
  INDEX idx_inventory_location (location_code)
) ENGINE=InnoDB;

CREATE TABLE inventory_movements (
  id VARCHAR(64) PRIMARY KEY,
  inventory_id VARCHAR(64),
  product_id VARCHAR(64),
  batch_no VARCHAR(100),
  source_location VARCHAR(80) NOT NULL,
  target_location VARCHAR(80) NOT NULL,
  qty DECIMAL(12,2) NOT NULL,
  movement_type VARCHAR(40) NOT NULL,
  executed_by VARCHAR(100),
  executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  remarks TEXT,
  FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE sales_orders (
  id VARCHAR(64) PRIMARY KEY,
  order_no VARCHAR(100) NOT NULL UNIQUE,
  customer_id VARCHAR(64) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'New',
  priority VARCHAR(20) NOT NULL DEFAULT 'Normal',
  sales_delivery_no VARCHAR(100),
  order_booking_type VARCHAR(100) DEFAULT 'Sales Delivery Order',
  order_type VARCHAR(100) DEFAULT 'Dispatch & Purchase Order',
  billing_location VARCHAR(255),
  area VARCHAR(160),
  shipping_address TEXT,
  shipping_contact_name VARCHAR(160),
  shipping_phone VARCHAR(40),
  billing_address TEXT,
  gst_no VARCHAR(40),
  remarks TEXT,
  pod_status VARCHAR(30),
  dispatch_details JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE sales_order_items (
  id VARCHAR(64) PRIMARY KEY,
  sales_order_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  qty DECIMAL(12,2) NOT NULL DEFAULT 0,
  picked_qty DECIMAL(12,2) DEFAULT 0,
  rate DECIMAL(12,2) DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_so_items_order (sales_order_id)
) ENGINE=InnoDB;

CREATE TABLE picklists (
  id VARCHAR(64) PRIMARY KEY,
  picking_id VARCHAR(100) NOT NULL UNIQUE,
  order_id VARCHAR(100),
  order_no VARCHAR(100) NOT NULL,
  sales_delivery_no VARCHAR(100),
  customer_id VARCHAR(64),
  customer_name VARCHAR(200),
  delivery_location VARCHAR(255),
  area VARCHAR(160),
  channel VARCHAR(80),
  picking_issue_date VARCHAR(40),
  picking_end_date VARCHAR(40),
  pick_wise VARCHAR(60) DEFAULT 'Batch Wise',
  picklist_generate_mode VARCHAR(40) DEFAULT 'HHT',
  picking_status VARCHAR(100) DEFAULT 'Picking Done',
  status VARCHAR(100) DEFAULT 'Picking Done',
  items JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  INDEX idx_picklists_order (order_no)
) ENGINE=InnoDB;

CREATE TABLE dispatch_invoices (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(100),
  order_no VARCHAR(100) NOT NULL,
  order_type VARCHAR(100) DEFAULT 'Dispatch Order',
  priority VARCHAR(20) DEFAULT 'Normal',
  order_date VARCHAR(40),
  sales_delivery_no VARCHAR(100),
  customer_code VARCHAR(80),
  customer_name VARCHAR(200),
  shipping_address TEXT,
  location VARCHAR(160),
  area VARCHAR(160),
  order_booking_type VARCHAR(100) DEFAULT 'Sales Delivery Order',
  no_of_products INT DEFAULT 1,
  challan_no VARCHAR(100),
  invoice_no VARCHAR(100),
  gate_pass_no VARCHAR(100),
  vehicle_no VARCHAR(40),
  driver_name VARCHAR(160),
  driver_mobile VARCHAR(40),
  dispatch_invoice_date VARCHAR(40),
  dispatch_time VARCHAR(40),
  status VARCHAR(40) DEFAULT 'Dispatched',
  crates_count VARCHAR(40),
  pod_status VARCHAR(40),
  pod_time VARCHAR(40),
  receiver_name VARCHAR(160),
  receiver_phone VARCHAR(40),
  signature TEXT,
  pod_remarks TEXT,
  items JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dispatch_invoice_no (invoice_no)
) ENGINE=InnoDB;

CREATE TABLE returns (
  id VARCHAR(64) PRIMARY KEY,
  return_no VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(40) NOT NULL,
  challan_no VARCHAR(100),
  sales_delivery_no VARCHAR(100),
  order_id VARCHAR(100),
  partner_id VARCHAR(64),
  customer_name VARCHAR(200),
  product_id VARCHAR(64),
  no_of_products INT DEFAULT 1,
  total_qty DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_return_qty DECIMAL(12,2) NOT NULL DEFAULT 0,
  qty DECIMAL(12,2) NOT NULL DEFAULT 0,
  reason VARCHAR(255),
  temp_log DECIMAL(5,2),
  status VARCHAR(60) NOT NULL DEFAULT 'Return Confirmation Pending',
  disposition VARCHAR(60),
  disposition_date DATE,
  disposition_details JSON,
  date DATE,
  items JSON,
  action_taken TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_returns_challan (challan_no),
  INDEX idx_returns_status (status)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

DELIMITER //
CREATE PROCEDURE get_fefo_picking_recommendation(
  IN p_product_id VARCHAR(64),
  IN p_required_qty DECIMAL(12,2)
)
BEGIN
  DECLARE v_remaining DECIMAL(12,2) DEFAULT p_required_qty;
  DECLARE v_done BOOLEAN DEFAULT FALSE;
  DECLARE v_id VARCHAR(64);
  DECLARE v_batch VARCHAR(100);
  DECLARE v_location VARCHAR(80);
  DECLARE v_qty DECIMAL(12,2);
  DECLARE v_expiry DATE;
  DECLARE v_pick DECIMAL(12,2);
  DECLARE fefo_cursor CURSOR FOR
    SELECT id, batch_no, location_code, qty, expiry_date
    FROM inventory
    WHERE product_id = p_product_id
      AND locked = FALSE
      AND location_code <> 'Stage Area'
      AND qty > 0
    ORDER BY expiry_date ASC, created_at ASC;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

  DROP TEMPORARY TABLE IF EXISTS fefo_recommendations;
  CREATE TEMPORARY TABLE fefo_recommendations (
    inventory_id VARCHAR(64),
    batch_no VARCHAR(100),
    location_code VARCHAR(80),
    qty_available DECIMAL(12,2),
    qty_to_pick DECIMAL(12,2),
    expiry_date DATE
  );

  OPEN fefo_cursor;
  recommendation_loop: LOOP
    FETCH fefo_cursor INTO v_id, v_batch, v_location, v_qty, v_expiry;
    IF v_done OR v_remaining <= 0 THEN LEAVE recommendation_loop; END IF;
    SET v_pick = LEAST(v_qty, v_remaining);
    INSERT INTO fefo_recommendations VALUES (v_id, v_batch, v_location, v_qty, v_pick, v_expiry);
    SET v_remaining = v_remaining - v_pick;
  END LOOP;
  CLOSE fefo_cursor;
  SELECT * FROM fefo_recommendations;
END//
DELIMITER ;

-- Optional application user. Change the password before production use.
-- CREATE USER IF NOT EXISTS 'gnosis_app'@'localhost' IDENTIFIED BY 'change-this-password';
-- GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON gnosis_wms.* TO 'gnosis_app'@'localhost';
-- FLUSH PRIVILEGES;
