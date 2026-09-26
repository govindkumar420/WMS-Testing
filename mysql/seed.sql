-- Gnosis WMS MySQL 8.0 starter seed
-- Run after schema.sql.
USE gnosis_wms;

INSERT INTO users
(id, username, password_hash, name, role, status, email, phone_number, two_factor_enabled, two_factor_method, two_factor_secret, two_factor_backup_codes, permissions)
VALUES
('USR-01', 'admin', 'Admin@123', 'Govind Kumar', 'Admin', 'Active', 'admin@gnosiswms.com', '+91 98765 43210', TRUE, 'totp', 'JBSWY3DPEHPK3PXP', JSON_ARRAY('8F2A-9C4B','3K7M-5P9Q','4R8V-1W2X'), JSON_ARRAY('dashboard','masters','inbound','outbound','inventory','coldchain','reports','security')),
('USR-02', 'manager', 'Manager@123', 'Anjali Sharma', 'Warehouse Manager', 'Active', 'manager@gnosiswms.com', '+91 98250 12345', TRUE, 'sms', 'KRSXG5CTMVRXEZLU', JSON_ARRAY('2H4K-6M8P','9Q1S-3U5V'), JSON_ARRAY('dashboard','masters','inbound','outbound','inventory','coldchain','reports')),
('USR-03', 'supervisor', 'Supervisor@123', 'Rajesh Patel', 'Supervisor', 'Active', 'supervisor@gnosiswms.com', '+91 98980 12345', FALSE, 'totp', '', JSON_ARRAY(), JSON_ARRAY('dashboard','inbound','outbound','inventory','coldchain','reports'))
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), permissions = VALUES(permissions);

INSERT INTO system_settings (`key`, barcode_type, otp_verify, two_factor_enforcement, default_two_factor_method, fifo_method, extra_config)
VALUES ('default', 'QR Code', TRUE, 'optional', 'totp', 'FEFO', JSON_OBJECT())
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

INSERT INTO companies (id, code, name, gst_no, address, contact)
VALUES ('COMP-01', 'GN-01', 'GNOSIS VENTURES LLP', '24AANFG0052H1ZP', 'Jamnagar, Gujarat', '+91 96870 64462')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO warehouses (id, code, name, location, type, capacity, company_id)
VALUES
('WH-01', 'JMN-01', 'Jamnagar Main Hub', 'Jamnagar GIDC, Gujarat', 'Hybrid', 1500, 'COMP-01'),
('WH-02', 'AMD-02', 'Ahmedabad Cold Facility', 'Sarkhej, Ahmedabad', 'Cold Storage', 800, 'COMP-01'),
('WH-03', 'RJT-03', 'Rajkot Dry Hub', 'Metoda GIDC, Rajkot', 'Dry Storage', 1000, 'COMP-01')
ON DUPLICATE KEY UPDATE name = VALUES(name), capacity = VALUES(capacity);

INSERT INTO locations (id, code, warehouse_id, rack, shelf, bin, type, status, temp_zone)
VALUES
('LOC-01', 'A-01-01', 'WH-01', 'A', '01', '01', 'Cold Storage', 'Available', '2-4C'),
('LOC-02', 'A-01-02', 'WH-01', 'A', '01', '02', 'Cold Storage', 'Available', '2-4C'),
('LOC-03', 'A-02-01', 'WH-01', 'A', '02', '01', 'Cold Storage', 'Available', '2-4C'),
('LOC-05', 'B-01-01', 'WH-01', 'B', '01', '01', 'Ambient', 'Available', '15-20C')
ON DUPLICATE KEY UPDATE status = VALUES(status), temp_zone = VALUES(temp_zone);

INSERT INTO categories (id, name, description)
VALUES
('CAT-01', 'Fruits', 'Fresh orchard fruits, citrus and berries'),
('CAT-02', 'Vegetables', 'Root crops and vegetables'),
('CAT-03', 'Leafy Greens', 'Spinach, coriander and herbs')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO uoms (id, code, description)
VALUES
('UOM-01', 'KG', 'Kilograms'),
('UOM-02', 'BUNCH', 'Bunches'),
('UOM-03', 'CRATE', 'Plastic crates'),
('UOM-04', 'BOX', 'Corrugated boxes')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO products (id, code, description, category, uom, temp_required, shelf_life_days, min_qty)
VALUES
('P-001', 'G256', 'Cynodon Grass', 'Leafy Greens', 'KG', '2-4C', 14, 100),
('P-002', 'P-002', 'Green Peas Fresh', 'Vegetables', 'KG', '2-4C', 20, 40),
('P-003', 'P-003', 'Dragon Fruits', 'Fruits', 'KG', '4-8C', 25, 50),
('P-004', 'PROD-APP-01', 'Fresh Shimla Apples', 'Fruits', 'KG', '2-4C', 45, 50),
('P-005', 'PROD-ORG-02', 'Nagpur Oranges', 'Fruits', 'KG', '4-8C', 30, 40),
('P-006', 'PROD-BAN-03', 'Cavendish Bananas', 'Fruits', 'KG', '13-15C', 10, 60),
('P-007', 'PROD-POT-04', 'Organic Potatoes', 'Vegetables', 'KG', '12-15C', 90, 100),
('P-008', 'PROD-STR-08', 'Fresh Strawberries', 'Fruits', 'KG', '0-2C', 5, 15)
ON DUPLICATE KEY UPDATE description = VALUES(description), min_qty = VALUES(min_qty);

INSERT INTO barcodes (id, barcode, qr_code, sku, product, product_id)
VALUES
('BC-01', '8901234567890', 'QR-APP-0801', 'P-001', 'Cynodon Grass', 'P-001'),
('BC-02', '8901234567891', 'QR-ORG-0802', 'P-008', 'Fresh Strawberries', 'P-008')
ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), product = VALUES(product);

INSERT INTO vendors (id, code, name, contact, email, city)
VALUES
('V-001', 'VND-GNS-01', 'Gnosis Agri Distributors', '9876543210', 'gnosis@agri.com', 'Nashik'),
('V-002', 'VND-OMSAI', 'Om Sai Ram Fruit Centre', '8765432109', 'omsai@fruits.com', 'Nagpur'),
('V-003', 'VND-VEGOTIC', 'Vegotic Agro Farms', '7654321098', 'vegotic@agro.com', 'Pune')
ON DUPLICATE KEY UPDATE name = VALUES(name), city = VALUES(city);

INSERT INTO customers (id, code, name, contact, email, city)
VALUES
('C-001', 'CUST-GNS-01', 'Greens Zoological Rescue Centre', '9687064462', 'greens@rescuezoo.org', 'Ahmedabad'),
('C-002', 'CUST-RETAIL-01', 'Radhe Enterprise Retail', '9988776655', 'radhe@retail.com', 'Jamnagar'),
('C-003', 'CUST-HYPER-02', 'Star Hypermarket Ltd', '8877665544', 'procurement@star.com', 'Ahmedabad')
ON DUPLICATE KEY UPDATE name = VALUES(name), city = VALUES(city);

INSERT INTO drivers (id, name, mobile, license_no, status)
VALUES
('DRV-01', 'Ramesh Kumar', '+91 99887 76655', 'DL-GJ10-202100456', 'Active'),
('DRV-02', 'Sohan Singh', '+91 88776 65544', 'DL-MH12-201900123', 'Active')
ON DUPLICATE KEY UPDATE name = VALUES(name), mobile = VALUES(mobile);

INSERT INTO employees (id, name, role, department, status)
VALUES
('EMP-01', 'Aarav Patel', 'GRN Operator', 'Inbound Logistics', 'Active'),
('EMP-02', 'Karan Sharma', 'Picker/Packer', 'Outbound Warehouse', 'Active')
ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status);

INSERT INTO taxes (id, name, cgst, sgst, igst, gst_pct)
VALUES ('TAX-01', 'GST 5%', 2.50, 2.50, 5.00, 5.00), ('TAX-02', 'GST 12%', 6.00, 6.00, 12.00, 12.00)
ON DUPLICATE KEY UPDATE gst_pct = VALUES(gst_pct);

INSERT INTO reasons (id, code, name)
VALUES ('RSN-01', 'DMG', 'Damaged Packaging'), ('RSN-02', 'TEMP', 'Temperature Abuse'), ('RSN-03', 'EXP', 'Decay / Expiry')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO cold_rooms (id, name, min_temp, max_temp, current_temp, current_humidity, status, warehouse_id)
VALUES
('CR-1', 'Cold Room 1 (Apple/Berry)', 0.00, 3.00, 1.80, 90.00, 'Normal', 'WH-01'),
('CR-2', 'Cold Room 2 (Citrus/Ripening)', 4.00, 8.00, 5.20, 85.00, 'Normal', 'WH-01'),
('CR-3', 'Deep Freezer (Greens)', -2.00, 1.00, 2.50, 92.00, 'Alert', 'WH-01')
ON DUPLICATE KEY UPDATE current_temp = VALUES(current_temp), status = VALUES(status);

INSERT INTO vehicles (id, vehicle_no, driver_name, transporter, gatepass_no, process_type, booking_type, booking_ref_doc_no, status, temp_log)
VALUES
('VEH-01', 'GJ01MT9901', 'Ramesh Singh', 'Gnosis Logistics', 'GP-2026-000101', 'Inbound', 'PO Material', 'PO-2026-001', 'Closed', JSON_ARRAY(3.2, 3.4, 3.1)),
('VEH-02', 'GJ10TZ1054', 'Yogesh Patel', 'Gnosis Trans', 'GP-2026-000102', 'Inbound', 'PO Material', 'PO-2026-002', 'QC Approved', JSON_ARRAY(4.1, 4.3)),
('VEH-03', 'GJ15AV7963', 'Aabid Sama', 'Self Transport', 'GP-2026-481779', 'Outbound', 'Sales Dispatch', 'SO-2026-001', 'Gate In', JSON_ARRAY(3.2))
ON DUPLICATE KEY UPDATE status = VALUES(status), remark = VALUES(remark);

INSERT INTO customer_crates (id, customer, customer_id, qty, date, status)
VALUES
('CRT-001', 'Radhe Enterprise Retail', 'C-002', 45, '2026-08-16', 'Cleaned & Restocked'),
('CRT-002', 'Star Hypermarket Ltd', 'C-003', 120, '2026-08-17', 'Pending Sanitization')
ON DUPLICATE KEY UPDATE qty = VALUES(qty), status = VALUES(status);

INSERT INTO cold_room_telemetry (cold_room_id, temperature, humidity, status, recorded_at)
VALUES
('CR-1', 1.80, 90.00, 'Normal', '2026-08-05 08:00:00'),
('CR-2', 5.20, 85.00, 'Normal', '2026-08-05 08:00:00'),
('CR-3', 2.50, 92.00, 'Alert', '2026-08-05 08:00:00');

INSERT INTO purchase_orders (id, po_no, vendor_id, date, status)
VALUES
('PO-2026-001', 'PO-2026-001', 'V-001', '2026-08-01', 'Completed'),
('PO-2026-002', 'PO-2026-002', 'V-001', '2026-08-03', 'Receiving'),
('PO-2026-003', 'PO-2026-003', 'V-002', '2026-08-05', 'Approved')
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO purchase_order_items (id, purchase_order_id, product_id, expected_qty, received_qty, rate)
VALUES
('POI-01', 'PO-2026-001', 'P-001', 100, 100, 450),
('POI-02', 'PO-2026-002', 'P-002', 150, 150, 320),
('POI-03', 'PO-2026-002', 'P-008', 50, 48, 600),
('POI-04', 'PO-2026-003', 'P-003', 200, 0, 250)
ON DUPLICATE KEY UPDATE received_qty = VALUES(received_qty), rate = VALUES(rate);

INSERT INTO goods_receipt_notes (id, grn_no, purchase_order_id, po_no, gatepass_no, vehicle_no, vendor_id, received_date, received_by, status)
VALUES
('GRN-001', 'GRN-2026-001', 'PO-2026-001', 'PO-2026-001', 'GP-2026-000101', 'GJ01MT9901', 'V-001', '2026-08-05 10:00:00', 'operator', 'Completed')
ON DUPLICATE KEY UPDATE status = VALUES(status), received_by = VALUES(received_by);

INSERT INTO inventory (id, product_id, batch_no, lot_no, qty, location_code, mfg_date, expiry_date, warehouse_id, age_days, locked, temp_log, grade)
VALUES
('INV-1001', 'P-001', 'B-APP-0801A', 'LOT-99011', 100, 'A-01-01', '2026-08-01', '2026-09-15', 'WH-01', 5, FALSE, 3.2, 'Grade A'),
('INV-1002', 'P-002', 'B-ORG-0803A', 'LOT-99023', 150, 'A-01-02', '2026-08-02', '2026-09-01', 'WH-01', 3, FALSE, 4.8, 'Grade A'),
('INV-1003', 'P-008', 'B-STR-0804A', 'LOT-99088', 48, 'A-02-01', '2026-08-04', '2026-08-09', 'WH-01', 1, FALSE, 1.1, 'Grade A'),
('INV-1004', 'P-004', 'B-POT-0720A', 'LOT-98004', 240, 'B-01-01', '2026-07-20', '2026-10-18', 'WH-01', 16, FALSE, 13.5, 'Grade B')
ON DUPLICATE KEY UPDATE qty = VALUES(qty), locked = VALUES(locked);

INSERT INTO inventory_movements (id, inventory_id, product_id, batch_no, source_location, target_location, qty, movement_type, executed_by, executed_at)
VALUES
('MOV-001', 'INV-1001', 'P-001', 'B-APP-0801A', 'Receiving Dock', 'A-01-01', 100, 'Putaway', 'operator', '2026-08-05 10:15:00')
ON DUPLICATE KEY UPDATE qty = VALUES(qty), target_location = VALUES(target_location);

INSERT INTO sales_orders (id, order_no, customer_id, date, status, priority, dispatch_details)
VALUES
('SO-2026-001', 'SO-2026-001', 'C-001', '2026-08-04', 'Delivered', 'Normal', JSON_OBJECT('invoiceNo','INV-DISP-0011','vehicleNo','GJ10TZ1090','driverName','Mukesh Sharma')),
('SO-2026-002', 'SO-2026-002', 'C-002', '2026-08-06', 'Picking', 'High', JSON_OBJECT()),
('SO-2026-003', 'SO-2026-003', 'C-003', '2026-08-06', 'New', 'Normal', JSON_OBJECT())
ON DUPLICATE KEY UPDATE status = VALUES(status), dispatch_details = VALUES(dispatch_details);

INSERT INTO sales_order_items (id, sales_order_id, product_id, qty, picked_qty, rate)
VALUES
('SOI-01', 'SO-2026-001', 'P-001', 20, 20, 450),
('SOI-02', 'SO-2026-001', 'P-002', 30, 30, 320),
('SOI-03', 'SO-2026-002', 'P-001', 40, 0, 450),
('SOI-04', 'SO-2026-002', 'P-008', 10, 0, 600),
('SOI-05', 'SO-2026-003', 'P-004', 50, 0, 150)
ON DUPLICATE KEY UPDATE qty = VALUES(qty), picked_qty = VALUES(picked_qty);

INSERT INTO dispatch_invoices (id, order_id, order_no, order_type, priority, order_date, sales_delivery_no, customer_code, customer_name, challan_no, invoice_no, gate_pass_no, vehicle_no, driver_name, dispatch_time, status, crates_count, items)
VALUES
('INV-001', 'SO-2026-001', 'SO-2026-001', 'Dispatch Order', 'Normal', '2026-08-04', '1784155315', 'CUST-GNS-01', 'Greens Zoological Rescue Centre', 'GVL/00012/26-27', 'INV-DISP-0011', 'GP-2026-481779', 'GJ15AV7963', 'Aabid Sama', '2026-08-04 11:30:00', 'Delivered', '26', JSON_ARRAY(JSON_OBJECT('productId','P-001','qty',20,'uom','KG')))
ON DUPLICATE KEY UPDATE status = VALUES(status), dispatch_time = VALUES(dispatch_time);

INSERT INTO picklists (id, picking_id, order_id, order_no, sales_delivery_no, customer_id, customer_name, delivery_location, area, picking_status, status, items)
VALUES
('PL-001', 'PL0001', 'SO-2026-002', 'SO-2026-002', '1783063429', 'C-002', 'Radhe Enterprise Retail', 'Jamnagar', 'STAFF KITCHEN', 'Picklist completed. But Picking pending', 'Picklist completed. But Picking pending', JSON_ARRAY(JSON_OBJECT('productId','P-001','qty',40)))
ON DUPLICATE KEY UPDATE status = VALUES(status), items = VALUES(items);

INSERT INTO returns (id, return_no, type, challan_no, sales_delivery_no, partner_id, customer_name, product_id, no_of_products, total_qty, total_return_qty, qty, reason, temp_log, status, date, items, action_taken)
VALUES
('RET-08165', 'RET-2026-08165', 'Sales Return', 'GVL/08165/26-27', '5515964508', 'C-001', 'Greens Zoological Rescue Centre', 'P-001', 2, 97.50, 0.00, 97.50, 'Gate Delivery POD Verification', 3.8, 'Return Confirmation Pending', '2026-08-05', JSON_ARRAY(JSON_OBJECT('productCode','G009','productDesc','Banana Robusta','uom','KG','dispatchedQty',50.00,'returnQty',0.00)), 'Awaiting Return Confirmation Disposition'),
('RET-001', 'RET-2026-001', 'Sales Return', 'GVL/08055/26-27', '1784155315', 'C-001', 'Greens Zoological Rescue Centre', 'P-001', 1, 15.00, 15.00, 15.00, 'Damaged Packaging', 3.8, 'Return To Vendor', '2026-08-05', JSON_ARRAY(JSON_OBJECT('productCode','G009','productDesc','Fresh Apples','uom','KG','dispatchedQty',15.00,'returnQty',15.00)), 'Moved to vendor return bay')
ON DUPLICATE KEY UPDATE status = VALUES(status), total_return_qty = VALUES(total_return_qty), action_taken = VALUES(action_taken);

INSERT INTO audit_logs (id, timestamp, username, role, action, module, status)
VALUES
('LOG-001', '2026-08-05 08:35:00', 'operator', 'GRN Operator', 'Vehicle Gate-In Registered', 'Gatepass', 'Success'),
('LOG-002', '2026-08-05 09:10:00', 'operator', 'GRN Operator', 'PO Material Unloaded', 'Inbound', 'Success'),
('LOG-003', '2026-08-05 09:40:00', 'qc_inspector', 'Quality Control', 'QC Quality Passed', 'Quality Check', 'Success')
ON DUPLICATE KEY UPDATE action = VALUES(action), status = VALUES(status);
