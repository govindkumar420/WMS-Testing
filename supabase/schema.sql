-- =============================================================================
-- SMART WMS (WAREHOUSE MANAGEMENT SYSTEM) - ENTERPRISE DATABASE SCHEMA
-- PostgreSQL & Supabase Compatible DDL
-- Target: Fresh Produce, Cold Storage & Multi-Hub Warehouse Operations
-- =============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =============================================================================
-- 1. UTILITY FUNCTIONS & TRIGGERS
-- =============================================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =============================================================================
-- 2. SECURITY & USER MANAGEMENT
-- =============================================================================

create table if not exists public.users (
  id text primary key default ('USR-' || substr(gen_random_uuid()::text, 1, 8)),
  username text unique not null,
  password_hash text not null,
  name text not null,
  role text not null check (role in ('Admin', 'Warehouse Manager', 'Supervisor', 'GRN Operator', 'Quality Control', 'Picker/Packer', 'Dispatch', 'Operator')),
  status text not null default 'Active' check (status in ('Active', 'Inactive', 'Suspended')),
  email text,
  phone_number text,
  two_factor_enabled boolean not null default false,
  two_factor_method text not null default 'totp' check (two_factor_method in ('totp', 'sms', 'email')),
  two_factor_secret text default '',
  two_factor_backup_codes jsonb not null default '[]'::jsonb,
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create table if not exists public.audit_logs (
  id text primary key default ('LOG-' || floor(extract(epoch from now()) * 1000)::text),
  timestamp timestamptz not null default now(),
  username text not null default 'System',
  role text default 'System',
  action text not null,
  module text not null,
  status text not null default 'Success' check (status in ('Success', 'Warning', 'Failed', 'Error')),
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.system_settings (
  key text primary key default 'default',
  barcode_type text not null default 'QR Code',
  otp_verify boolean not null default true,
  two_factor_enforcement text not null default 'optional' check (two_factor_enforcement in ('disabled', 'optional', 'privileged', 'all')),
  default_two_factor_method text not null default 'totp' check (default_two_factor_method in ('totp', 'sms', 'email')),
  otp_expiry_seconds integer not null default 300,
  max_otp_attempts integer not null default 5,
  email_notification boolean not null default true,
  sms_notification boolean not null default false,
  auto_location_suggestion boolean not null default true,
  fifo_method text not null default 'FEFO' check (fifo_method in ('FEFO', 'FIFO', 'LIFO')),
  extra_config jsonb default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger trg_system_settings_updated_at
  before update on public.system_settings
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- 3. CORE MASTER DATA (Enterprise Hierarchy, Locations, Taxonomy & Partners)
-- =============================================================================

create table if not exists public.companies (
  id text primary key default ('COMP-' || substr(gen_random_uuid()::text, 1, 6)),
  code text unique not null,
  name text not null,
  gst_no text,
  address text,
  contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_companies_updated_at
  before update on public.companies
  for each row execute function public.handle_updated_at();

create table if not exists public.warehouses (
  id text primary key,
  code text unique not null,
  name text not null,
  location text not null,
  type text not null check (type in ('Hybrid', 'Cold Storage', 'Dry Storage', 'Distribution Center')),
  capacity numeric(12,2) not null default 0,
  company_id text references public.companies(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_warehouses_updated_at
  before update on public.warehouses
  for each row execute function public.handle_updated_at();

create table if not exists public.locations (
  id text primary key,
  code text unique not null,
  warehouse_id text not null references public.warehouses(id) on delete cascade,
  rack text not null,
  shelf text not null,
  bin text not null,
  type text not null check (type in ('Cold Storage', 'Ambient', 'Stage Area', 'Deep Freezer', 'Quarantine')),
  status text not null default 'Available' check (status in ('Available', 'Locked', 'Occupied', 'Maintenance')),
  temp_zone text default 'Ambient',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_locations_updated_at
  before update on public.locations
  for each row execute function public.handle_updated_at();

create table if not exists public.categories (
  id text primary key default ('CAT-' || substr(gen_random_uuid()::text, 1, 6)),
  name text unique not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.handle_updated_at();

create table if not exists public.uoms (
  id text primary key default ('UOM-' || substr(gen_random_uuid()::text, 1, 6)),
  code text unique not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_uoms_updated_at
  before update on public.uoms
  for each row execute function public.handle_updated_at();

create table if not exists public.products (
  id text primary key,
  code text unique not null,
  description text not null,
  category text,
  uom text not null default 'KG',
  temp_required text,
  shelf_life_days integer not null default 7,
  min_qty numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

create table if not exists public.barcodes (
  id text primary key default ('BC-' || substr(gen_random_uuid()::text, 1, 6)),
  barcode text unique not null,
  qr_code text unique,
  sku text,
  product text,
  product_id text references public.products(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_barcodes_updated_at
  before update on public.barcodes
  for each row execute function public.handle_updated_at();

create table if not exists public.vendors (
  id text primary key,
  code text unique not null,
  name text not null,
  contact text,
  email text,
  city text,
  address text,
  gst_no text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_vendors_updated_at
  before update on public.vendors
  for each row execute function public.handle_updated_at();

create table if not exists public.customers (
  id text primary key,
  code text unique not null,
  name text not null,
  contact text,
  email text,
  gst_no text,
  address text,
  delivery_address text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_customers_updated_at
  before update on public.customers
  for each row execute function public.handle_updated_at();

create table if not exists public.drivers (
  id text primary key default ('DRV-' || substr(gen_random_uuid()::text, 1, 6)),
  name text not null,
  mobile text not null,
  license_no text unique not null,
  transporter text,
  status text not null default 'Active' check (status in ('Active', 'Inactive', 'Suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_drivers_updated_at
  before update on public.drivers
  for each row execute function public.handle_updated_at();

create table if not exists public.employees (
  id text primary key default ('EMP-' || substr(gen_random_uuid()::text, 1, 6)),
  name text not null,
  role text not null,
  department text not null,
  status text not null default 'Active' check (status in ('Active', 'Inactive', 'On Leave')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_employees_updated_at
  before update on public.employees
  for each row execute function public.handle_updated_at();

create table if not exists public.taxes (
  id text primary key default ('TAX-' || substr(gen_random_uuid()::text, 1, 6)),
  name text not null,
  cgst numeric(5,2) not null default 0,
  sgst numeric(5,2) not null default 0,
  igst numeric(5,2) not null default 0,
  gst_pct numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_taxes_updated_at
  before update on public.taxes
  for each row execute function public.handle_updated_at();

create table if not exists public.reasons (
  id text primary key default ('RSN-' || substr(gen_random_uuid()::text, 1, 6)),
  code text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_reasons_updated_at
  before update on public.reasons
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- 4. COLD CHAIN CONTROLLER & SENSOR LOGS
-- =============================================================================

create table if not exists public.cold_rooms (
  id text primary key,
  name text not null,
  min_temp numeric(5,2) not null,
  max_temp numeric(5,2) not null,
  current_temp numeric(5,2) not null,
  current_humidity numeric(5,2) not null default 85,
  status text not null default 'Normal' check (status in ('Normal', 'Alert', 'Maintenance')),
  warehouse_id text references public.warehouses(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_cold_rooms_updated_at
  before update on public.cold_rooms
  for each row execute function public.handle_updated_at();

create table if not exists public.cold_room_telemetry (
  id bigserial primary key,
  cold_room_id text not null references public.cold_rooms(id) on delete cascade,
  temperature numeric(5,2) not null,
  humidity numeric(5,2),
  status text not null default 'Normal',
  recorded_at timestamptz not null default now()
);

-- =============================================================================
-- 5. GATEPASS, YARD & VEHICLE MANAGEMENT
-- =============================================================================

create table if not exists public.vehicles (
  id text primary key default ('VEH-' || floor(extract(epoch from now()) * 1000)::text),
  vehicle_no text not null,
  driver_name text not null,
  driver_mobile text,
  transporter text,
  gatepass_no text unique not null,
  process_type text not null check (process_type in ('Inbound', 'Outbound')),
  booking_type text not null check (booking_type in ('PO Material', 'Sales Dispatch', 'Return Material', 'Direct', 'Internal Transfer')),
  booking_ref_doc_no text,
  in_date_time timestamptz,
  out_date_time timestamptz,
  in_km_reading numeric(10,2),
  out_km_reading numeric(10,2),
  status text not null default 'Gate In' check (status in ('Gate In', 'Unload Pending', 'QC Approved', 'Putaway Pending', 'Putaway Completed', 'Loading', 'Pending Gate Out', 'Closed')),
  remark text,
  temp_log jsonb default '[]'::jsonb,
  seal_no text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_vehicles_updated_at
  before update on public.vehicles
  for each row execute function public.handle_updated_at();

create table if not exists public.customer_crates (
  id text primary key default ('CRT-' || substr(gen_random_uuid()::text, 1, 6)),
  customer text not null,
  customer_id text references public.customers(id) on delete set null,
  qty integer not null default 0,
  date date not null default current_date,
  status text not null default 'Cleaned & Restocked' check (status in ('Cleaned & Restocked', 'Pending Sanitization', 'Damaged', 'In Transit')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- 6. INBOUND: PURCHASE ORDERS, GRN & QC
-- =============================================================================

create table if not exists public.purchase_orders (
  id text primary key,
  po_no text unique not null,
  vendor_id text not null references public.vendors(id) on delete restrict,
  date date not null,
  status text not null default 'Draft' check (status in ('Draft', 'Approved', 'Receiving', 'Completed', 'Cancelled')),
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_purchase_orders_updated_at
  before update on public.purchase_orders
  for each row execute function public.handle_updated_at();

create table if not exists public.purchase_order_items (
  id text primary key default ('POI-' || substr(gen_random_uuid()::text, 1, 8)),
  purchase_order_id text not null references public.purchase_orders(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  expected_qty numeric(12,2) not null default 0,
  received_qty numeric(12,2) not null default 0,
  rate numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_po_items_updated_at
  before update on public.purchase_order_items
  for each row execute function public.handle_updated_at();

create table if not exists public.goods_receipt_notes (
  id text primary key default ('GRN-' || floor(extract(epoch from now()) * 1000)::text),
  grn_no text unique not null,
  purchase_order_id text references public.purchase_orders(id) on delete set null,
  po_no text,
  gatepass_no text,
  vehicle_no text,
  vendor_id text references public.vendors(id) on delete set null,
  received_date timestamptz not null default now(),
  received_by text,
  status text not null default 'Completed',
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_grn_updated_at
  before update on public.goods_receipt_notes
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- 7. INVENTORY, BATCHES & MOVEMENTS
-- =============================================================================

create table if not exists public.inventory (
  id text primary key default ('INV-' || floor(extract(epoch from now()) * 1000)::text),
  product_id text not null references public.products(id) on delete restrict,
  batch_no text not null,
  lot_no text,
  qty numeric(12,2) not null default 0,
  location_code text not null,
  mfg_date date not null,
  expiry_date date not null,
  warehouse_id text not null references public.warehouses(id) on delete restrict,
  age_days integer default 0,
  locked boolean not null default false,
  temp_log numeric(5,2),
  grade text default 'Grade A',
  supplier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_inventory_updated_at
  before update on public.inventory
  for each row execute function public.handle_updated_at();

create table if not exists public.inventory_movements (
  id text primary key default ('MOV-' || floor(extract(epoch from now()) * 1000)::text),
  inventory_id text references public.inventory(id) on delete set null,
  product_id text references public.products(id) on delete set null,
  batch_no text,
  source_location text not null,
  target_location text not null,
  qty numeric(12,2) not null,
  movement_type text not null check (movement_type in ('Putaway', 'Bin Transfer', 'Restock', 'Split Move', 'Return Restock', 'Scrap Removal')),
  executed_by text,
  executed_at timestamptz not null default now(),
  remarks text
);

-- =============================================================================
-- 8. OUTBOUND: SALES ORDERS, PICKLISTS, DISPATCH & POD
-- =============================================================================

create table if not exists public.sales_orders (
  id text primary key,
  order_no text unique not null,
  customer_id text not null references public.customers(id) on delete restrict,
  date date not null,
  status text not null default 'New' check (status in ('New', 'Picking', 'Packed', 'Dispatched', 'Delivered', 'Cancelled')),
  priority text not null default 'Normal' check (priority in ('Normal', 'High', 'Urgent')),
  sales_delivery_no text,
  order_booking_type text default 'Sales Delivery Order',
  order_type text default 'Dispatch & Purchase Order',
  billing_location text,
  area text,
  shipping_address text,
  shipping_contact_name text,
  shipping_phone text,
  billing_address text,
  gst_no text,
  remarks text,
  pod_status text check (pod_status in ('POD Confirmed', 'Pending', 'Rejected', null)),
  dispatch_details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_sales_orders_updated_at
  before update on public.sales_orders
  for each row execute function public.handle_updated_at();

create table if not exists public.sales_order_items (
  id text primary key default ('SOI-' || substr(gen_random_uuid()::text, 1, 8)),
  sales_order_id text not null references public.sales_orders(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  qty numeric(12,2) not null default 0,
  picked_qty numeric(12,2) default 0,
  rate numeric(12,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_so_items_updated_at
  before update on public.sales_order_items
  for each row execute function public.handle_updated_at();

create table if not exists public.picklists (
  id text primary key,
  picking_id text unique not null,
  order_id text,
  order_no text not null,
  sales_delivery_no text,
  customer_id text references public.customers(id) on delete set null,
  customer_name text,
  delivery_location text,
  area text,
  channel text,
  picking_issue_date text,
  picking_end_date text,
  pick_wise text default 'Batch Wise',
  picklist_generate_mode text default 'HHT',
  picking_status text default 'Picking Done',
  status text default 'Picking Done',
  items jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_picklists_updated_at
  before update on public.picklists
  for each row execute function public.handle_updated_at();

create table if not exists public.dispatch_invoices (
  id text primary key,
  order_id text,
  order_no text not null,
  order_type text default 'Dispatch Order',
  priority text default 'Normal',
  order_date text,
  sales_delivery_no text,
  customer_code text,
  customer_name text,
  shipping_address text,
  location text,
  area text,
  order_booking_type text default 'Sales Delivery Order',
  no_of_products integer default 1,
  challan_no text,
  invoice_no text,
  gate_pass_no text,
  vehicle_no text,
  driver_name text,
  driver_mobile text,
  dispatch_invoice_date text,
  dispatch_time text,
  status text default 'Dispatched',
  crates_count text,
  pod_status text,
  pod_time text,
  receiver_name text,
  receiver_phone text,
  signature text,
  pod_remarks text,
  items jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_dispatch_invoices_updated_at
  before update on public.dispatch_invoices
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- 9. RETURNS & REVERSE LOGISTICS
-- =============================================================================

create table if not exists public.returns (
  id text primary key,
  return_no text unique not null,
  type text not null check (type in ('Sales Return', 'QC Return', 'QC Rejection', 'Customer Return')),
  challan_no text,
  sales_delivery_no text,
  order_id text,
  partner_id text,
  customer_name text,
  product_id text references public.products(id) on delete set null,
  no_of_products integer default 1,
  total_qty numeric(12,2) not null default 0,
  total_return_qty numeric(12,2) not null default 0,
  qty numeric(12,2) not null default 0,
  reason text,
  temp_log numeric(5,2),
  status text not null default 'Return Confirmation Pending' check (status in (
    'Return Confirmation Pending',
    'Return To Vendor',
    'Sale To Local Market',
    'Scrap',
    'Restocked',
    'Rejected',
    'Quarantined'
  )),
  disposition text,
  disposition_date date,
  disposition_details jsonb default '{}'::jsonb,
  date date,
  items jsonb default '[]'::jsonb,
  action_taken text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_returns_updated_at
  before update on public.returns
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- 10. INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

create index if not exists idx_locations_wh on public.locations(warehouse_id);
create index if not exists idx_locations_code on public.locations(code);
create index if not exists idx_inventory_prod on public.inventory(product_id);
create index if not exists idx_inventory_exp on public.inventory(expiry_date asc);
create index if not exists idx_inventory_batch on public.inventory(batch_no);
create index if not exists idx_inventory_loc on public.inventory(location_code);
create index if not exists idx_po_items_po on public.purchase_order_items(purchase_order_id);
create index if not exists idx_so_items_so on public.sales_order_items(sales_order_id);
create index if not exists idx_vehicles_status on public.vehicles(status);
create index if not exists idx_vehicles_gp on public.vehicles(gatepass_no);
create index if not exists idx_picklists_ord on public.picklists(order_no);
create index if not exists idx_dispatch_inv_no on public.dispatch_invoices(invoice_no);
create index if not exists idx_returns_challan on public.returns(challan_no);
create index if not exists idx_returns_status on public.returns(status);
create index if not exists idx_audit_module on public.audit_logs(module, timestamp desc);

-- =============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

alter table public.users enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;
alter table public.companies enable row level security;
alter table public.warehouses enable row level security;
alter table public.locations enable row level security;
alter table public.categories enable row level security;
alter table public.uoms enable row level security;
alter table public.products enable row level security;
alter table public.barcodes enable row level security;
alter table public.vendors enable row level security;
alter table public.customers enable row level security;
alter table public.drivers enable row level security;
alter table public.employees enable row level security;
alter table public.taxes enable row level security;
alter table public.reasons enable row level security;
alter table public.cold_rooms enable row level security;
alter table public.cold_room_telemetry enable row level security;
alter table public.vehicles enable row level security;
alter table public.customer_crates enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.goods_receipt_notes enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.sales_orders enable row level security;
alter table public.sales_order_items enable row level security;
alter table public.picklists enable row level security;
alter table public.dispatch_invoices enable row level security;
alter table public.returns enable row level security;

-- Standard dev policy (permissive access for anon & authenticated)
do $$
declare
  tbl text;
  tables text[] := array[
    'users', 'audit_logs', 'system_settings', 'companies', 'warehouses', 'locations',
    'categories', 'uoms', 'products', 'barcodes', 'vendors', 'customers',
    'drivers', 'employees', 'taxes', 'reasons', 'cold_rooms', 'cold_room_telemetry',
    'vehicles', 'customer_crates', 'purchase_orders', 'purchase_order_items',
    'goods_receipt_notes', 'inventory', 'inventory_movements', 'sales_orders',
    'sales_order_items', 'picklists', 'dispatch_invoices', 'returns'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists "Allow all read on %I" on public.%I', tbl, tbl);
    execute format('create policy "Allow all read on %I" on public.%I for select to anon, authenticated using (true)', tbl, tbl);
    
    execute format('drop policy if exists "Allow all insert on %I" on public.%I', tbl, tbl);
    execute format('create policy "Allow all insert on %I" on public.%I for insert to anon, authenticated with check (true)', tbl, tbl);
    
    execute format('drop policy if exists "Allow all update on %I" on public.%I', tbl, tbl);
    execute format('create policy "Allow all update on %I" on public.%I for update to anon, authenticated using (true) with check (true)', tbl, tbl);
    
    execute format('drop policy if exists "Allow all delete on %I" on public.%I', tbl, tbl);
    execute format('create policy "Allow all delete on %I" on public.%I for delete to anon, authenticated using (true)', tbl, tbl);
  end loop;
end $$;

-- =============================================================================
-- 12. FEFO ALLOCATION STORED PROCEDURE
-- =============================================================================

create or replace function public.get_fefo_picking_recommendation(
  p_product_id text,
  p_required_qty numeric
)
returns table (
  inventory_id text,
  batch_no text,
  location_code text,
  qty_available numeric,
  qty_to_pick numeric,
  expiry_date date
) as $$
declare
  v_remaining numeric := p_required_qty;
  r record;
  v_pick numeric;
begin
  for r in
    select i.id, i.batch_no, i.location_code, i.qty, i.expiry_date
    from public.inventory i
    where i.product_id = p_product_id
      and i.locked = false
      and i.location_code <> 'Stage Area'
      and i.qty > 0
    order by i.expiry_date asc, i.created_at asc
  loop
    exit when v_remaining <= 0;
    v_pick := least(r.qty, v_remaining);
    
    inventory_id := r.id;
    batch_no := r.batch_no;
    location_code := r.location_code;
    qty_available := r.qty;
    qty_to_pick := v_pick;
    expiry_date := r.expiry_date;
    
    v_remaining := v_remaining - v_pick;
    return next;
  end loop;
end;
$$ language plpgsql;
