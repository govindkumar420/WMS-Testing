-- =============================================================================
-- SMART WMS (WAREHOUSE MANAGEMENT SYSTEM) - SEED DATA
-- Default relational master & transactional records
-- =============================================================================

-- 1. Users
insert into public.users (id, username, password_hash, name, role, status, email, phone_number, two_factor_enabled, two_factor_method, two_factor_secret, two_factor_backup_codes, permissions)
values
  ('CAT-03', 'Leafy Greens', 'Spinach, coriander, herbs'),
  ('CAT-04', 'Berries', 'Fresh berries including strawberries')
  ('USR-02', 'manager', 'Manager@123', 'Anjali Sharma', 'Warehouse Manager', 'Active', 'manager@gnosiswms.com', '+91 98250 12345', true, 'sms', 'KRSXG5CTMVRXEZLU', '["2H4K-6M8P", "9Q1S-3U5V", "7W9Y-1A3C", "5E7G-9J2L"]'::jsonb, '["dashboard", "masters", "inbound", "outbound", "inventory", "coldchain", "reports"]'::jsonb),
  ('USR-03', 'supervisor', 'Supervisor@123', 'Rajesh Patel', 'Supervisor', 'Active', 'supervisor@gnosiswms.com', '+91 98980 12345', false, 'totp', 'MZXW6YTBOI2G64TF', '[]'::jsonb, '["dashboard", "inbound", "outbound", "inventory", "coldchain", "reports"]'::jsonb),
  ('USR-05', 'qc_inspector', 'Qc@123', 'Dr. Vivek Joshi', 'Quality Control', 'Active', 'qc@gnosiswms.com', '+91 99090 67890', false, 'totp', '', '[]'::jsonb, '["dashboard", "inbound", "coldchain"]'::jsonb),
  ('USR-06', 'picker', 'Picker@123', 'Suresh Kumar', 'Picker/Packer', 'Active', 'picker@gnosiswms.com', '+91 98790 11223', false, 'sms', '', '[]'::jsonb, '["outbound", "inventory"]'::jsonb),
  ('BC-01', '8901234567890', 'QR-APP-0801', 'P-001', 'Cynodon Grass', 'P-001'),
  ('BC-02', '8901234567891', 'QR-ORG-0802', 'P-008', 'Fresh Strawberries', 'P-008')
  name = excluded.name,
  role = excluded.role,
  email = excluded.email,
  phone_number = excluded.phone_number,
  two_factor_enabled = excluded.two_factor_enabled,
  two_factor_method = excluded.two_factor_method,
  ('C-003', 'CUST-HYPER-02', 'Star Hypermarket Ltd', '8877665544', 'procurement@star.com', '24STARK9876L1Z9', 'S.G. Highway, Ahmedabad', 'Star Mall, S.G. Highway, Ahmedabad - 380054', 'Ahmedabad')
  two_factor_backup_codes = excluded.two_factor_backup_codes,
  permissions = excluded.permissions;
-- 2. Companies
insert into public.companies (id, code, name, gst_no, address, contact)
  ('CRT-001', 'Radhe Enterprise Retail', 'C-002', 45, '2026-08-16', 'Cleaned & Restocked'),
  ('CRT-002', 'Star Hypermarket Ltd', 'C-003', 120, '2026-08-17', 'Pending Sanitization')
on conflict (code) do nothing;

-- 3. Warehouses
insert into public.warehouses (id, code, name, location, type, capacity, company_id)
values
  ('WH-01', 'JMN-01', 'Jamnagar Main Hub', 'Jamnagar GIDC, Gujarat', 'Hybrid', 1500, 'COMP-01'),
  ('WH-02', 'AMD-02', 'Ahmedabad Cold Facility', 'Sarkhej, Ahmedabad', 'Cold Storage', 800, 'COMP-01'),
  ('WH-03', 'RJT-03', 'Rajkot Dry Hub', 'Metoda GIDC, Rajkot', 'Dry Storage', 1000, 'COMP-01')
on conflict (id) do nothing;

-- 4. Locations
insert into public.locations (id, code, warehouse_id, rack, shelf, bin, type, status, temp_zone)
values
  ('LOC-01', 'A-01-01', 'WH-01', 'A', '01', '01', 'Cold Storage', 'Available', '2-4°C'),
  ('LOC-02', 'A-01-02', 'WH-01', 'A', '01', '02', 'Cold Storage', 'Available', '2-4°C'),
  ('LOC-03', 'A-02-01', 'WH-01', 'A', '02', '01', 'Cold Storage', 'Available', '2-4°C'),
  ('LOC-04', 'A-02-02', 'WH-01', 'A', '02', '02', 'Cold Storage', 'Locked', '2-4°C'),
  ('LOC-05', 'B-01-01', 'WH-01', 'B', '01', '01', 'Ambient', 'Available', '15-20°C'),
  ('LOC-06', 'B-01-02', 'WH-01', 'B', '01', '02', 'Ambient', 'Available', '15-20°C'),
  ('LOC-07', 'B-02-01', 'WH-01', 'B', '02', '01', 'Ambient', 'Available', '15-20°C'),
  ('LOC-08', 'C-01-01', 'WH-02', 'C', '01', '01', 'Cold Storage', 'Available', '0-2°C'),
  ('LOC-09', 'C-01-02', 'WH-02', 'C', '01', '02', 'Cold Storage', 'Available', '0-2°C'),
  ('LOC-10', 'D-01-01', 'WH-03', 'D', '01', '01', 'Ambient', 'Available', 'Ambient'),
  ('LOC-11', 'D-01-02', 'WH-03', 'D', '01', '02', 'Ambient', 'Available', 'Ambient')
on conflict (id) do nothing;

-- 5. Categories
insert into public.categories (id, name, description)
values
  ('CAT-01', 'Fruits', 'Fresh orchard fruits, apples, citrus, berries'),
  ('CAT-02', 'Vegetables', 'Root crops, brassicas, gourds'),
  ('CAT-03', 'Leafy Greens', 'Spinach, coriander, herbs')
on conflict (name) do nothing;

-- 6. UOMs
insert into public.uoms (id, code, description)
values
  ('UOM-01', 'Kg', 'Kilograms'),
  ('UOM-02', 'Bunch', 'Bunches'),
  ('UOM-03', 'Crate', 'Plastic Crates'),
  ('UOM-04', 'Box', 'Corrugated Boxes')
on conflict (code) do nothing;

-- 7. Products
insert into public.products (id, code, description, category, uom, temp_required, shelf_life_days, min_qty)
values
  ('P-001', 'G256', 'Cynodon Grass', 'Leafy Greens', 'KG', '2-4°C', 14, 100),
  ('P-002', 'P-002', 'Green Peas Fresh', 'Vegetables', 'KG', '2-4°C', 20, 40),
  ('P-003', 'P-003', 'Dragon Fruits', 'Fruits', 'KG', '4-8°C', 25, 50),
  ('P-004', 'PROD-APP-01', 'Fresh Shimla Apples', 'Fruits', 'KG', '2-4°C', 45, 50),
  ('P-005', 'PROD-ORG-02', 'Nagpur Oranges', 'Fruits', 'KG', '4-8°C', 30, 40),
  ('P-006', 'PROD-BAN-03', 'Cavendish Bananas', 'Fruits', 'KG', '13-15°C', 10, 60),
  ('P-007', 'PROD-POT-04', 'Organic Potatoes', 'Vegetables', 'KG', '12-15°C', 90, 100),
  ('P-008', 'PROD-STR-08', 'Fresh Strawberries', 'Berries', 'KG', '0-2°C', 5, 15)
on conflict (id) do update set
  code = excluded.code,
  description = excluded.description,
  category = excluded.category,
  uom = excluded.uom,
  temp_required = excluded.temp_required,
  shelf_life_days = excluded.shelf_life_days,
  min_qty = excluded.min_qty;

-- 8. Barcodes
insert into public.barcodes (id, barcode, qr_code, sku, product, product_id)
values
  ('BC-01', '8901234567890', 'QR-APP-0801', 'P-001', 'Royal Gala Apples', 'P-001'),
  ('BC-02', '8901234567891', 'QR-ORG-0802', 'P-008', 'Nagpur Oranges', 'P-008')
on conflict (barcode) do nothing;

-- 9. Vendors
insert into public.vendors (id, code, name, contact, email, city)
values
  ('V-001', 'VND-GNS-01', 'Gnosis Agri Distributors', '9876543210', 'gnosis@agri.com', 'Nashik'),
  ('V-002', 'VND-OMSAI', 'Om Sai Ram Fruit Centre', '8765432109', 'omsai@fruits.com', 'Nagpur'),
  ('V-003', 'VND-VEGOTIC', 'Vegotic Agro Farms', '7654321098', 'vegotic@agro.com', 'Pune')
on conflict (id) do nothing;

-- 10. Customers
insert into public.customers (id, code, name, contact, email, gst_no, address, delivery_address, city)
values
  ('C-001', 'VND-GNS-88', 'Greens Zoological, Rescue And Rehabilitation Centre Society', '9687064462', 'greens@rescuezoo.org', 'AADTG8371P', '"Vraj" Opp HDFC Bank, Beside Chandanbala Tower, Near Suvidha Shopping Centre, Paldi, Ahmedabad', 'Greens Zoological, Rescue And Rehabilitation Centre Society, "Vraj" Opp HDFC Bank, Beside Chandanbala Tower, Near Suvidha Shopping Centre, Paldi, Ahmedabad, Gujarat, India, Pincode-380007', 'Ahmedabad'),
  ('C-002', 'CUST-RETAIL-01', 'Radhe Enterprise Retail', '9988776655', 'radhe@retail.com', '24ABCDE1234F1Z5', 'Bedi Port Road, Jamnagar', 'Bedi Port Road, Jamnagar, Gujarat - 361001', 'Jamnagar'),
  ('C-003', 'CUST-HYPER-02', 'Star Hypermarket Ltd', '8877665544', 'procurement@star.com', '24STARK9876L1Z9', 'S.G. Highway, Ahmedabad', 'Star Mall, S.G. Highway, Ahmedabad - 380054', 'Ahmedabad')
on conflict (id) do nothing;

-- 11. Drivers & Employees
insert into public.delivery_locations (id, name)
values
  ('DLOC-001', '20 Acre Direct Delivery'),
  ('DLOC-002', '22 ACRE'),
  ('DLOC-003', '28 Acer Direct Delivery'),
  ('DLOC-004', '33 ACRE'),
  ('DLOC-005', '35 ACRE'),
  ('DLOC-006', '50 Acre Direct Delivery (GC)'),
  ('DLOC-007', '50 Acre Direct Delivery (RD)'),
  ('DLOC-008', '50 Acre Direct Delivery(BHS)'),
  ('DLOC-009', '54 ACRE'),
  ('DLOC-010', '54 Acre Direct Delivery'),
  ('DLOC-011', '73 ACRE'),
  ('DLOC-012', 'EC'),
  ('DLOC-013', 'EC Green Belt'),
  ('DLOC-014', 'Gajwan'),
  ('DLOC-015', 'LC 10 QN-1'),
  ('DLOC-016', 'LC-1 (Central Animal Kitchen)'),
  ('DLOC-017', 'LC-10 QN-2'),
  ('DLOC-018', 'LC-6'),
  ('DLOC-019', 'MOU'),
  ('DLOC-020', 'MOU(Food Zone)'),
  ('DLOC-021', 'R and R Direct Delivery'),
  ('DLOC-022', 'RandR'),
  ('DLOC-023', 'Rheino Safari'),
  ('DLOC-024', 'Rhino Safari Direct Delivery'),
  ('DLOC-025', 'VACC Animal Kitchen'),
  ('DLOC-026', 'Vantara Niwas')
on conflict (name) do nothing;

insert into public.kitchen_areas (id, name)
values
  ('KAREA-001', 'ANIMAL KITCHEN'),
  ('KAREA-002', 'HOTEL SITE')
on conflict (name) do nothing;

insert into public.drivers (id, name, mobile, license_no)
values
  ('DRV-01', 'Ramesh Kumar', '+91 99887 76655', 'DL-GJ10-202100456'),
  ('DRV-02', 'Sohan Singh', '+91 88776 65544', 'DL-MH12-201900123')
on conflict (license_no) do nothing;

insert into public.employees (id, name, role, department, status)
values
  ('EMP-01', 'Aarav Patel', 'GRN Operator', 'Inbound Logistics', 'Active'),
  ('EMP-02', 'Karan Sharma', 'Picker/Packer', 'Outbound Warehouse', 'Active')
on conflict (id) do nothing;

-- 12. Taxes & Reasons
insert into public.taxes (id, name, cgst, sgst, igst, gst_pct)
values
  ('TAX-01', 'GST 5%', 2.5, 2.5, 5.0, 5.0),
  ('TAX-02', 'GST 12%', 6.0, 6.0, 12.0, 12.0)
on conflict (id) do nothing;

insert into public.reasons (id, code, name)
values
  ('RSN-01', 'DMG', 'Damaged Packaging'),
  ('RSN-02', 'TEMP', 'Temperature Abuse'),
  ('RSN-03', 'EXP', 'Decay / Expiry'),
  ('RSN-04', 'SHR', 'Shortage Rejection')
on conflict (code) do nothing;

-- 13. Cold Rooms
insert into public.cold_rooms (id, name, min_temp, max_temp, current_temp, current_humidity, status, warehouse_id)
values
  ('CR-1', 'Cold Room 1 (Apple/Berry)', 0.0, 3.0, 1.8, 90, 'Normal', 'WH-01'),
  ('CR-2', 'Cold Room 2 (Citrus/Ripening)', 4.0, 8.0, 5.2, 85, 'Normal', 'WH-01'),
  ('CR-3', 'Deep Freezer (Greens)', -2.0, 1.0, 2.5, 92, 'Alert', 'WH-01'),
  ('CR-4', 'Ambient Stage Area', 15.0, 22.0, 17.5, 60, 'Normal', 'WH-01')
on conflict (id) do update set
  current_temp = excluded.current_temp,
  current_humidity = excluded.current_humidity,
  status = excluded.status;

insert into public.cold_room_telemetry (cold_room_id, temperature, humidity, status, recorded_at)
select seed.cold_room_id, seed.temperature, seed.humidity, seed.status, seed.recorded_at
from (values
  ('CR-1', 1.80::numeric, 90.00::numeric, 'Normal', '2026-08-05 08:00:00+05:30'::timestamptz),
  ('CR-2', 5.20::numeric, 85.00::numeric, 'Normal', '2026-08-05 08:00:00+05:30'::timestamptz),
  ('CR-3', 2.50::numeric, 92.00::numeric, 'Alert', '2026-08-05 08:00:00+05:30'::timestamptz)
) as seed(cold_room_id, temperature, humidity, status, recorded_at)
where not exists (
  select 1
  from public.cold_room_telemetry existing
  where existing.cold_room_id = seed.cold_room_id
    and existing.recorded_at = seed.recorded_at
);

-- 14. Vehicles & Gatepasses
insert into public.vehicles (id, vehicle_no, driver_name, driver_mobile, transporter, gatepass_no, process_type, booking_type, booking_ref_doc_no, in_date_time, out_date_time, in_km_reading, out_km_reading, status, remark, temp_log)
values
  ('VEH-01', 'GJ01MT9901', 'Ramesh Singh', null, 'Gnosis Logistics', 'GP-2026-000101', 'Inbound', 'PO Material', 'PO-2026-001', '2026-08-05 08:30:00+05:30', '2026-08-05 11:20:00+05:30', 124500, 124535, 'Closed', 'Unloaded successfully, normal temperature maintained', '[3.2, 3.4, 3.1]'::jsonb),
  ('VEH-02', 'GJ10TZ1054', 'Yogesh Patel', null, 'Gnosis Trans', 'GP-2026-000102', 'Inbound', 'PO Material', 'PO-2026-002', '2026-08-05 14:15:00+05:30', null, 48512, null, 'QC Approved', 'Waiting for putaway execution', '[4.1, 4.3]'::jsonb),
  ('VEH-03', 'GJ03AZ8008', 'Nilesh Bhai', null, 'Self Transport', 'GP-2026-000103', 'Inbound', 'PO Material', 'PO-2026-003', '2026-08-06 00:45:00+05:30', null, 95400, null, 'Unload Pending', 'Truck in bay 2, waiting shift start', '[1.8]'::jsonb),
  ('VEH-04', 'GJ10TW2815', 'Jignesh Rawal', null, 'Gnosis Logistics', 'GP-2026-000104', 'Outbound', 'Sales Dispatch', 'SO-2026-002', '2026-08-06 01:00:00+05:30', null, 12890, null, 'Loading', 'Picking checklist is in wave, loading starts soon', '[3.5]'::jsonb),
  ('VEH-05', 'GJ15AV7963', 'Aabid Sama', '9687064462', 'Self Transport', 'GP-2026-481779', 'Outbound', 'Sales Dispatch', 'SO-2026-189', '2026-08-21 09:30:00+05:30', null, 54120, null, 'Gate In', 'Checked in at Gate 1, temperature normal', '[3.2]'::jsonb),
  ('VEH-06', 'GJ10TZ1090', 'Mukesh Sharma', '9825012345', 'Express Cargo', 'GP-2026-481801', 'Outbound', 'Sales Dispatch', 'SO-2026-188', '2026-08-21 10:15:00+05:30', null, 88410, null, 'Gate In', 'Reefer vehicle ready for loading bay 02', '[2.8]'::jsonb),
  ('VEH-07', 'HR73B6954', 'Ravi Jadeja', '9687064462', 'Self', 'GP-2026-020267', 'Outbound', 'Sales Dispatch', 'SO-2026-003', '2026-08-22 08:45:00+05:30', null, 32410, null, 'Gate In', 'Ready for outbound sales dispatch', '[3.1]'::jsonb)
on conflict (gatepass_no) do nothing;

-- 14b. Customer Empty Crate Returns
insert into public.customer_crates (id, customer, customer_id, qty, date, status)
values
  ('CRT-001', 'Radhe Enterprise Retail', 'CUST-001', 45, '2026-08-16', 'Cleaned & Restocked'),
  ('CRT-002', 'Star Hypermarket Ltd', 'CUST-002', 120, '2026-08-17', 'Pending Sanitization')
on conflict (id) do nothing;

-- 15. Purchase Orders & PO Items
insert into public.purchase_orders (id, po_no, vendor_id, date, status)
values
  ('PO-2026-001', 'PO-2026-001', 'V-001', '2026-08-01', 'Completed'),
  ('PO-2026-002', 'PO-2026-002', 'V-001', '2026-08-03', 'Receiving'),
  ('PO-2026-003', 'PO-2026-003', 'V-002', '2026-08-05', 'Approved'),
  ('PO-2026-004', 'PO-2026-004', 'V-003', '2026-08-06', 'Draft')
on conflict (po_no) do nothing;

insert into public.goods_receipt_notes (id, grn_no, purchase_order_id, po_no, gatepass_no, vehicle_no, vendor_id, received_date, received_by, status)
values
  ('GRN-001', 'GRN-2026-001', 'PO-2026-001', 'PO-2026-001', 'GP-2026-000101', 'GJ01MT9901', 'V-001', '2026-08-05 10:00:00+05:30', 'operator', 'Completed')
on conflict (grn_no) do nothing;

insert into public.purchase_order_items (id, purchase_order_id, product_id, expected_qty, received_qty, rate)
values
  ('POI-01', 'PO-2026-001', 'P-001', 100, 100, 450),
  ('POI-02', 'PO-2026-002', 'P-002', 150, 150, 320),
  ('POI-03', 'PO-2026-002', 'P-008', 50, 48, 600),
  ('POI-04', 'PO-2026-003', 'P-003', 200, 0, 250),
  ('POI-05', 'PO-2026-003', 'P-005', 100, 0, 180),
  ('POI-06', 'PO-2026-004', 'P-004', 300, 0, 150),
  ('POI-07', 'PO-2026-004', 'P-006', 200, 0, 120)
on conflict (id) do nothing;

-- 16. Inventory Batches
insert into public.inventory (id, product_id, batch_no, lot_no, qty, location_code, mfg_date, expiry_date, warehouse_id, age_days, locked, temp_log, grade)
values
  ('INV-1001', 'P-001', 'B-APP-0801A', 'LOT-99011', 100, 'A-01-01', '2026-08-01', '2026-09-15', 'WH-01', 5, false, 3.2, 'Grade A'),
  ('INV-1002', 'P-002', 'B-ORG-0803A', 'LOT-99023', 150, 'A-01-02', '2026-08-02', '2026-09-01', 'WH-01', 3, false, 4.8, 'Grade A'),
  ('INV-1003', 'P-008', 'B-STR-0804A', 'LOT-99088', 48, 'A-02-01', '2026-08-04', '2026-08-09', 'WH-01', 1, false, 1.1, 'Grade A'),
  ('INV-1004', 'P-004', 'B-POT-0720A', 'LOT-98004', 240, 'B-01-01', '2026-07-20', '2026-10-18', 'WH-01', 16, false, 13.5, 'Grade B')
on conflict (id) do nothing;

-- 17. Sales Orders & Sales Order Items
insert into public.inventory_movements (id, inventory_id, product_id, batch_no, source_location, target_location, qty, movement_type, executed_by, executed_at)
values
  ('MOV-001', 'INV-1001', 'P-001', 'B-APP-0801A', 'Receiving Dock', 'A-01-01', 100, 'Putaway', 'operator', '2026-08-05 10:15:00+05:30')
on conflict (id) do nothing;

insert into public.sales_orders (id, order_no, customer_id, date, status, priority, dispatch_details)
values
  ('SO-2026-001', 'SO-2026-001', 'C-001', '2026-08-04', 'Delivered', 'Normal', '{
    "dispatchNo": "DISP-2026-101",
    "invoiceNo": "INV-DISP-0011",
    "gatePassNo": "GP-2026-OUT01",
    "vehicleNo": "GJ10TZ1090",
    "driverName": "Mukesh Sharma",
    "packedTime": "2026-08-04 10:00:00",
    "dispatchTime": "2026-08-04 11:30:00",
    "deliveryTime": "2026-08-04 15:45:00",
    "signature": "M. Sharma"
  }'::jsonb),
  ('SO-2026-002', 'SO-2026-002', 'C-002', '2026-08-06', 'Picking', 'High', '{}'::jsonb),
  ('SO-2026-003', 'SO-2026-003', 'C-003', '2026-08-06', 'New', 'Normal', '{}'::jsonb)
on conflict (order_no) do nothing;

insert into public.sales_order_items (id, sales_order_id, product_id, qty)
values
  ('SOI-01', 'SO-2026-001', 'P-001', 20),
  ('SOI-02', 'SO-2026-001', 'P-002', 30),
  ('SOI-03', 'SO-2026-002', 'P-001', 40),
  ('SOI-04', 'SO-2026-002', 'P-008', 10),
  ('SOI-05', 'SO-2026-003', 'P-004', 50),
  ('SOI-06', 'SO-2026-003', 'P-005', 25)
on conflict (id) do nothing;

-- 18. Picklists
insert into public.picklists (id, picking_id, order_id, order_no, sales_delivery_no, customer_id, customer_name, delivery_location, area, channel, picking_issue_date, picking_end_date, pick_wise, picklist_generate_mode, picking_status, status, items)
values
  ('PL-1784155332', 'PL1784155332', '189', 'SO-2026-189', '1784155315', 'C-001', 'Reliance Industries Ltd', '54 Acre', 'STAFF KITCHEN', '', '2026-07-16 04:18:44', '2026-07-16 04:23:48', 'Batch Wise', 'HHT', 'Picking Done', 'Picking Done', '[{"productId": "P-001", "qty": 100, "productCode": "PROD-001", "description": "Fresh Apples (Imported)"}]'::jsonb),
  ('PL-1783063444', 'PL1783063444', '188', 'SO-2026-188', '1783063429', 'C-002', 'Radhe Krishna Temple Elephant Welfare Trust', 'Hotel Site', 'HOTEL SITE', '', '2026-07-03 12:56:38', '2026-07-03 12:59:07', 'Batch Wise', 'HHT', 'Picking Done', 'Picking Done', '[{"productId": "P-002", "qty": 150, "productCode": "PROD-002", "description": "Organic Bananas"}]'::jsonb),
  ('PL-1783062618', 'PL1783062618', '187', 'SO-2026-187', '1783062499', 'C-002', 'Radhe Krishna Temple Elephant Welfare Trust', 'Hotel Site Hotel Site', 'HOTEL SITE', '', '', '2026-07-03 12:49:50', 'Batch Wise', 'HHT', 'Picking Done', 'Picking Done', '[{"productId": "P-003", "qty": 80, "productCode": "PROD-003", "description": "Sweet Melons"}]'::jsonb),
  ('PL-1782128718', 'PL1782128718', '157', 'SO-2026-157', '1782128684', 'C-003', 'Khodiyar Animal Welfare Trust', 'Hotel Site', 'HOTEL SITE', '', '', '', 'Batch Wise', 'HHT', 'Picklist completed. But Picking pending', 'Picklist completed. But Picking pending', '[{"productId": "P-004", "qty": 50, "productCode": "PROD-004", "description": "Fresh Carrots"}, {"productId": "P-005", "qty": 25, "productCode": "PROD-005", "description": "Spinach Bunches"}]'::jsonb)
on conflict (id) do nothing;

-- 19. Dispatch Invoices
insert into public.dispatch_invoices (id, order_id, order_no, order_type, priority, order_date, sales_delivery_no, customer_code, customer_name, shipping_address, location, area, order_booking_type, no_of_products, challan_no, invoice_no, gate_pass_no, vehicle_no, driver_name, driver_mobile, dispatch_invoice_date, dispatch_time, status, crates_count, items)
values
  ('INV-189', '189', 'SO-2026-189', 'Dispatch Order', 'Normal', '16-07-2026', '1784155315', 'RIL', 'Reliance Industries Ltd', 'Reliance Industries Ltd, Village: Meghpar, Padana, PO: Motikhavdi, Dist. Jamnagar', '54 Acre', 'STAFF KITCHEN', 'Sales Delivery Order', 1, 'GVL/00012/26-27', 'GVL/00012/26-27', 'GP-2026-481779', 'GJ15AV7963', 'Aabid Sama', '9687064462', '2026-07-16', '2026-07-16 04:23:48', 'Dispatched', '26', '[{"productId": "P-001", "code": "P-001", "description": "Fresh Apples (Imported)", "qty": 100, "uom": "KG"}]'::jsonb),
  ('INV-156', '156', 'SO-2026-156', 'Dispatch Order', 'Normal', '17-06-2026', '1781635208', 'KAWT', 'Khodiyar Animal Welfare Trust', 'Khodiyar Animal Welfare Trust, Survey No 112, Jamnagar', 'Hotel Site', 'STAFF KITCHEN', 'Sales Delivery Order', 2, 'GVL/00008/26-27', 'GVL/00008/26-27', 'GP-2026-481710', 'GJ10TW2815', 'Jignesh Rawal', '9898012345', '2026-06-20', '2026-06-20 11:30:00', 'Dispatched', '35', '[{"productId": "P-004", "code": "P-004", "description": "Fresh Carrots", "qty": 50, "uom": "KG"}, {"productId": "P-005", "code": "P-005", "description": "Spinach Bunches", "qty": 25, "uom": "BUNCH"}]'::jsonb),
  ('INV-188', '188', 'SO-2026-188', 'Dispatch Order', 'High', '03-07-2026', '1783063429', 'RKT', 'Radhe Krishna Temple Elephant Welfare Trust', 'Radhe Krishna Temple, Moti Khavdi, Jamnagar', 'Hotel Site', 'HOTEL SITE', 'Sales Delivery Order', 2, 'GVL/00011/26-27', 'GVL/00011/26-27', 'GP-2026-481755', 'GJ10TZ1090', 'Mukesh Sharma', '9825012345', '2026-07-03', '2026-07-03 12:59:07', 'Dispatched', '40', '[{"productId": "P-002", "code": "P-002", "description": "Organic Bananas", "qty": 150, "uom": "KG"}]'::jsonb),
  ('INV-187', '187', 'SO-2026-187', 'Dispatch Order', 'Normal', '03-07-2026', '1783062499', 'RKT', 'Radhe Krishna Temple Elephant Welfare Trust', 'Radhe Krishna Temple, Moti Khavdi, Jamnagar', 'Hotel Site', 'HOTEL SITE', 'Sales Delivery Order', 1, 'GVL/00010/26-27', 'GVL/00010/26-27', 'GP-2026-481740', 'GJ15AV7963', 'Aabid Sama', '9687064462', '2026-07-03', '2026-07-03 12:49:50', 'Dispatched', '18', '[{"productId": "P-003", "code": "P-003", "description": "Sweet Melons", "qty": 80, "uom": "KG"}]'::jsonb)
on conflict (id) do nothing;

-- 20. Returns & Reverse Logistics
insert into public.returns (id, return_no, type, challan_no, sales_delivery_no, partner_id, customer_name, product_id, no_of_products, total_qty, total_return_qty, qty, reason, temp_log, status, disposition, disposition_date, disposition_details, date, items, action_taken)
values
  ('RET-08165', 'RET-2026-08165', 'Sales Return', 'GVL/08165/26-27', '5515964508', 'C-001', 'Reliance Industries Ltd', 'P-001', 2, 97.50, 0.00, 97.50, 'Gate Delivery POD Verification', 3.8, 'Return Confirmation Pending', null, null, '{}'::jsonb, '2026-08-05', '[{"productCode": "G009", "productDesc": "Banana Robusta", "uom": "KG", "dispatchedQty": 50.00, "returnQty": 0.00, "reason": "Skin blemish"}, {"productCode": "G013", "productDesc": "Beans Cow Pea", "uom": "KG", "dispatchedQty": 47.50, "returnQty": 0.00, "reason": "Packaging strain"}]'::jsonb, 'Awaiting Return Confirmation Disposition'),
  ('RET-08160', 'RET-2026-08160', 'Sales Return', 'GVL/08160/26-27', '7208937574', 'C-002', 'Khodiyar Animal Welfare Trust', 'P-004', 1, 0.50, 0.00, 0.50, 'Weight Tolerance Check', 4.2, 'Return Confirmation Pending', null, null, '{}'::jsonb, '2026-08-05', '[{"productCode": "G031", "productDesc": "Chilli Green", "uom": "KG", "dispatchedQty": 0.50, "returnQty": 0.00, "reason": "Size sorting"}]'::jsonb, 'Awaiting Return Confirmation Disposition'),
  ('RET-08151', 'RET-2026-08151', 'Sales Return', 'GVL/08151/26-27', '1788655849', 'C-003', 'Radhe Krishna Temple Elephant Welfare Trust', 'P-005', 1, 3.00, 0.00, 3.00, 'Wilting / Leaf Damage', 4.0, 'Return Confirmation Pending', null, null, '{}'::jsonb, '2026-08-06', '[{"productCode": "G050", "productDesc": "Green Amaranth", "uom": "KG", "dispatchedQty": 3.00, "returnQty": 0.00, "reason": "Leaf wilting"}]'::jsonb, 'Awaiting Return Confirmation Disposition'),
  ('RET-08148', 'RET-2026-08148', 'Sales Return', 'GVL/08148/26-27', '1788650262', 'C-001', 'Reliance Industries Ltd', 'P-002', 1, 1.00, 0.00, 1.00, 'High Pulp Temperature', 6.5, 'Return Confirmation Pending', null, null, '{}'::jsonb, '2026-08-06', '[{"productCode": "G047", "productDesc": "Ginger", "uom": "KG", "dispatchedQty": 1.00, "returnQty": 0.00, "reason": "Warm pulp temp"}]'::jsonb, 'Awaiting Return Confirmation Disposition'),
  ('RET-08124', 'RET-2026-08124', 'Sales Return', 'GVL/08124/26-27', '1788608337', 'C-002', 'Khodiyar Animal Welfare Trust', 'P-001', 1, 23.30, 0.00, 23.30, 'Surplus Stock at Kitchen', 3.9, 'Return Confirmation Pending', null, null, '{}'::jsonb, '2026-08-07', '[{"productCode": "G051", "productDesc": "Green Peas Fresh", "uom": "KG", "dispatchedQty": 23.30, "returnQty": 0.00, "reason": "Surplus return"}]'::jsonb, 'Awaiting Return Confirmation Disposition'),
  ('RET-08116', 'RET-2026-08116', 'Sales Return', 'GVL/08116/26-27', '1292395959', 'C-001', 'Reliance Industries Ltd', 'P-008', 1, 43.00, 0.00, 43.00, 'Crate Damage in Transit', 4.1, 'Return Confirmation Pending', null, null, '{}'::jsonb, '2026-08-07', '[{"productCode": "G048", "productDesc": "Grapes Imported", "uom": "KG", "dispatchedQty": 43.00, "returnQty": 0.00, "reason": "Crate damage"}]'::jsonb, 'Awaiting Return Confirmation Disposition'),
  ('RET-001', 'RET-2026-001', 'Sales Return', 'GVL/08055/26-27', '1784155315', 'C-001', 'Reliance Industries Ltd', 'P-001', 1, 15.00, 15.00, 15.00, 'Damaged Packaging', 3.8, 'Return To Vendor', 'Return To Vendor', '2026-08-05', '{"disposition": "Return To Vendor", "vendorName": "Fresh Farms Ltd (Jamnagar)", "debitNoteNo": "DBN-2026-0081", "remarks": "Returned to supplier for full credit"}'::jsonb, '2026-08-05', '[{"productCode": "G009", "productDesc": "Fresh Apples (Imported)", "uom": "KG", "dispatchedQty": 15.00, "returnQty": 15.00, "reason": "Damaged Packaging"}]'::jsonb, 'Moved to vendor return bay for supplier dispatch'),
  ('RET-002', 'RET-2026-002', 'Sales Return', 'GVL/08092/26-27', '1781635208', 'C-002', 'Khodiyar Animal Welfare Trust', 'P-008', 1, 20.00, 20.00, 20.00, 'Overripe Grade', 4.5, 'Sale To Local Market', 'Sale To Local Market', '2026-08-06', '{"disposition": "Sale To Local Market", "buyerName": "Jamnagar Sabji Mandi Trader #4", "rate": 18.00, "totalAmount": 360.00, "invoiceNo": "LMS-2026-019", "remarks": "Sold at discounted secondary price"}'::jsonb, '2026-08-06', '[{"productCode": "G014", "productDesc": "Fresh Tomatoes Grade B", "uom": "KG", "dispatchedQty": 20.00, "returnQty": 20.00, "reason": "Overripe Grade"}]'::jsonb, 'Cleared via local wholesale trade bill LMS-2026-019'),
  ('RET-003', 'RET-2026-003', 'Sales Return', 'GVL/08010/26-27', '1783063429', 'C-003', 'Radhe Krishna Temple Elephant Welfare Trust', 'P-005', 1, 10.00, 10.00, 10.00, 'Severe Temperature Abuse / Decayed', 9.8, 'Scrap', 'Scrap', '2026-08-06', '{"disposition": "Scrap", "scrapCertNo": "SCRP-2026-092", "disposalMethod": "Compost Disposal Pit #2", "remarks": "Severe rotting - unsafe for consumption"}'::jsonb, '2026-08-06', '[{"productCode": "G050", "productDesc": "Spinach Bunches", "uom": "BUNCH", "dispatchedQty": 10.00, "returnQty": 10.00, "reason": "Decayed leaves"}]'::jsonb, 'Scrapped and destroyed at organic disposal yard'),
  ('RET-004', 'RET-2026-004', 'QC Return', null, null, 'V-001', null, 'P-002', 1, 25.00, 25.00, 25.00, 'Quality Grading Failure / Bruised', 5.8, 'Rejected', null, null, '{}'::jsonb, '2026-08-07', '[]'::jsonb, 'Rejected during inward dock QC and returned to vendor'),
  ('RET-005', 'RET-2026-005', 'QC Rejection', null, null, 'V-002', null, 'P-004', 1, 12.00, 12.00, 12.00, 'Brix Level Below Spec', 4.1, 'Quarantined', null, null, '{}'::jsonb, '2026-08-08', '[]'::jsonb, 'Held in Quarantine Zone for Supplier Debit Note')
on conflict (id) do nothing;

-- 21. System Settings & Initial Audit Logs
insert into public.system_settings (key, barcode_type, otp_verify, two_factor_enforcement, default_two_factor_method, otp_expiry_seconds, max_otp_attempts, email_notification, sms_notification, auto_location_suggestion, fifo_method)
values ('default', 'QR Code', true, 'optional', 'totp', 300, 5, true, false, true, 'FEFO')
on conflict (key) do nothing;

insert into public.audit_logs (id, timestamp, username, role, action, module, status)
values
  ('LOG-001', '2026-08-05 08:35:00+05:30', 'operator', 'GRN Operator', 'Vehicle Gate-In Registered', 'Gatepass', 'Success'),
  ('LOG-002', '2026-08-05 09:10:00+05:30', 'operator', 'GRN Operator', 'PO Material Unloaded', 'Inbound', 'Success'),
  ('LOG-003', '2026-08-05 09:40:00+05:30', 'qc_inspector', 'Quality Control', 'QC Quality Passed: Batch B-APP-0801A', 'Quality Check', 'Success'),
  ('LOG-004', '2026-08-05 10:15:00+05:30', 'supervisor', 'Supervisor', 'Putaway Completed to Bin A-01-01', 'Putaway', 'Success')
on conflict (id) do nothing;
