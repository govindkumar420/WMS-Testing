import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Smart WMS Database Service
 * Maps JavaScript camelCase models <-> PostgreSQL snake_case database schema.
 * Handles both Supabase relational backend operations and offline fallback.
 */

// Helper: Convert camelCase object to snake_case for PostgreSQL
export function toSnakeCase(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const newObj = {};
  for (const [key, value] of Object.entries(obj)) {
    // Preserve password as password_hash if needed
    let snakeKey = key === 'password' ? 'password_hash' : key.replace(/([A-Z])/g, '_$1').toLowerCase();
    newObj[snakeKey] = value;
  }
  return newObj;
}

// Helper: Convert snake_case object to camelCase for React Components
export function toCamelCase(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const newObj = {};
  for (const [key, value] of Object.entries(obj)) {
    let camelKey = key === 'password_hash' ? 'password' : key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    newObj[camelKey] = value;
  }
  return newObj;
}

// Check database connection status
export async function testDbConnection() {
  if (!isSupabaseConfigured || !supabase) {
    return { connected: false, message: 'Supabase credentials not configured in .env' };
  }
  try {
    const { data, error } = await supabase.from('system_settings').select('key').limit(1);
    if (error) throw error;
    return { connected: true, message: 'Connected to Supabase PostgreSQL Database' };
  } catch (err) {
    console.warn('Database connection test error:', err.message);
    return { connected: false, message: err.message };
  }
}

// Generic Fetch from Table
export async function fetchTableData(tableName) {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      console.warn(`Supabase fetch error on ${tableName}:`, error.message);
      return null;
    }
    if (!data) return [];
    return data.map(toCamelCase);
  } catch (err) {
    console.warn(`Failed to fetch from ${tableName}:`, err);
    return null;
  }
}

// Generic Upsert (Insert / Update) Record
export async function upsertDbRecord(tableName, record) {
  if (!isSupabaseConfigured || !supabase || !record) return null;
  try {
    const snakeRecord = toSnakeCase(record);
    const { data, error } = await supabase
      .from(tableName)
      .upsert(snakeRecord)
      .select();
    if (error) {
      console.warn(`Supabase upsert error on ${tableName}:`, error.message);
      return null;
    }
    return data && data[0] ? toCamelCase(data[0]) : record;
  } catch (err) {
    console.warn(`Failed to upsert to ${tableName}:`, err);
    return null;
  }
}

// Generic Delete Record
export async function deleteDbRecord(tableName, id, idColumn = 'id') {
  if (!isSupabaseConfigured || !supabase || !id) return false;
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq(idColumn, id);
    if (error) {
      console.warn(`Supabase delete error on ${tableName}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Failed to delete from ${tableName}:`, err);
    return false;
  }
}

// Fetch Purchase Orders with line items joined
export async function fetchPurchaseOrdersWithItems() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data: pos, error: poError } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        items:purchase_order_items(*)
      `)
      .order('date', { ascending: false });

    if (poError) {
      console.warn('Supabase fetch purchase orders error:', poError.message);
      return null;
    }

    return (pos || []).map(po => {
      const camelPo = toCamelCase(po);
      if (Array.isArray(camelPo.items)) {
        camelPo.items = camelPo.items.map(toCamelCase);
      } else {
        camelPo.items = [];
      }
      return camelPo;
    });
  } catch (err) {
    console.warn('Failed to fetch purchase orders:', err);
    return null;
  }
}

// Save Purchase Order with Line Items Transactionally
export async function savePurchaseOrderWithItems(po) {
  if (!isSupabaseConfigured || !supabase || !po) return null;
  try {
    const poPayload = toSnakeCase({
      id: po.id,
      poNo: po.poNo,
      vendorId: po.vendorId,
      date: po.date,
      status: po.status,
      remarks: po.remarks
    });

    const { error: poError } = await supabase
      .from('purchase_orders')
      .upsert(poPayload);

    if (poError) throw poError;

    if (Array.isArray(po.items) && po.items.length > 0) {
      const itemsPayload = po.items.map((item, idx) => toSnakeCase({
        id: item.id || `${po.id}-ITEM-${idx + 1}`,
        purchaseOrderId: po.id,
        productId: item.productId,
        expectedQty: Number(item.expectedQty) || 0,
        receivedQty: Number(item.receivedQty) || 0,
        rate: Number(item.rate) || 0
      }));

      await supabase.from('purchase_order_items').upsert(itemsPayload);
    }

    return po;
  } catch (err) {
    console.warn('Failed to save purchase order with items:', err);
    return null;
  }
}

// Fetch Sales Orders with line items
export async function fetchSalesOrdersWithItems() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data: sos, error: soError } = await supabase
      .from('sales_orders')
      .select(`
        *,
        items:sales_order_items(*)
      `)
      .order('date', { ascending: false });

    if (soError) {
      console.warn('Supabase fetch sales orders error:', soError.message);
      return null;
    }

    return (sos || []).map(so => {
      const camelSo = toCamelCase(so);
      if (Array.isArray(camelSo.items)) {
        camelSo.items = camelSo.items.map(toCamelCase);
      } else {
        camelSo.items = [];
      }
      return camelSo;
    });
  } catch (err) {
    console.warn('Failed to fetch sales orders:', err);
    return null;
  }
}

// Save Sales Order with Line Items
export async function saveSalesOrderWithItems(so) {
  if (!isSupabaseConfigured || !supabase || !so) return null;
  try {
    const soPayload = toSnakeCase({
      id: so.id,
      orderNo: so.orderNo,
      customerId: so.customerId,
      date: so.date,
      status: so.status,
      priority: so.priority,
      salesDeliveryNo: so.salesDeliveryNo,
      orderBookingType: so.orderBookingType,
      orderType: so.orderType,
      billingLocation: so.billingLocation,
      area: so.area,
      shippingAddress: so.shippingAddress,
      shippingContactName: so.shippingContactName,
      shippingPhone: so.shippingPhone,
      billingAddress: so.billingAddress,
      gstNo: so.gstNo,
      remarks: so.remarks,
      podStatus: so.podStatus,
      dispatchDetails: so.dispatchDetails || {}
    });

    const { error: soError } = await supabase
      .from('sales_orders')
      .upsert(soPayload);

    if (soError) throw soError;

    if (Array.isArray(so.items) && so.items.length > 0) {
      const itemsPayload = so.items.map((item, idx) => toSnakeCase({
        id: item.id || `${so.id}-ITEM-${idx + 1}`,
        salesOrderId: so.id,
        productId: item.productId,
        qty: Number(item.qty) || 0,
        pickedQty: Number(item.pickedQty) || 0,
        rate: Number(item.rate) || 0
      }));

      await supabase.from('sales_order_items').upsert(itemsPayload);
    }

    return so;
  } catch (err) {
    console.warn('Failed to save sales order with items:', err);
    return null;
  }
}

// Call Stored Procedure: FEFO Picking Recommendation
export async function getFefoRecommendations(productId, requiredQty) {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.rpc('get_fefo_picking_recommendation', {
      p_product_id: productId,
      p_required_qty: Number(requiredQty)
    });
    if (error) {
      console.warn('FEFO RPC error:', error.message);
      return null;
    }
    return (data || []).map(toCamelCase);
  } catch (err) {
    console.warn('Failed to call FEFO procedure:', err);
    return null;
  }
}
