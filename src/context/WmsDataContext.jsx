import React, { createContext, useState, useEffect } from 'react';
import {
  defaultUsers,
  defaultWarehouses,
  defaultLocations,
  defaultProducts,
  defaultVendors,
  defaultCustomers,
  defaultVehicles,
  defaultPurchaseOrders,
  defaultInventory,
  defaultSalesOrders,
  defaultColdRooms,
  defaultAuditLogs,
  defaultSettings,
  defaultReturns,
  defaultCompanies,
  defaultCategories,
  defaultUoms,
  defaultDrivers,
  defaultEmployees,
  defaultBarcodes,
  defaultTaxes,
  defaultReasons,
  defaultPicklists,
  defaultDispatchInvoices
} from '../utils/mockData';

export const WmsDataContext = createContext();

export const WmsDataProvider = ({ children }) => {
  // DB States
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [picklists, setPicklists] = useState([]);
  const [dispatchInvoices, setDispatchInvoices] = useState([]);
  const [coldRooms, setColdRooms] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState({});
  const [returns, setReturns] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTabs, setActiveTabs] = useState({
    general: 'products',
    inbound: 'receiving',
    store: 'inventory',
    return: 'cust_returns',
    outbound: 'so',
    reports: 'mis',
    purchase: 'po_mgmt',
    gatepass: 'pending_vehicle',
  });

  const navigateTo = (view, tab = null) => {
    setCurrentView(view);
    if (tab) {
      setActiveTabs(prev => ({
        ...prev,
        [view]: tab
      }));
    }
  };

  // New General Master States
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [barcodes, setBarcodes] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [reasons, setReasons] = useState([]);

  // Safe Storage Helper
  const safeStorage = {
    get: (key) => {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn(`Storage get error for ${key}:`, e);
        return null;
      }
    },
    set: (key, val) => {
      try {
        localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
      } catch (e) {
        console.warn(`Storage set error for ${key}:`, e);
      }
    },
    remove: (key) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Storage remove error for ${key}:`, e);
      }
    },
    clear: () => {
      try {
        localStorage.clear();
      } catch (e) {
        console.warn(`Storage clear error:`, e);
      }
    }
  };

  // Auth Session State
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Initialize and sync with storage
  useEffect(() => {
    const initData = (key, defaultVal, setter) => {
      const stored = safeStorage.get(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const expectsArray = Array.isArray(defaultVal);
          const validShape = expectsArray
            ? Array.isArray(parsed)
            : parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed);
          if (!validShape) {
            throw new Error(`Invalid stored data for ${key}`);
          }
          if (key === 'wms_returns' && Array.isArray(parsed)) {
            const existingIds = new Set(parsed.map(p => p.id || p.challanNo));
            const missing = (defaultVal || []).filter(d => !existingIds.has(d.id) && !existingIds.has(d.challanNo));
            if (missing.length > 0) {
              const merged = [...parsed, ...missing];
              safeStorage.set(key, merged);
              setter(merged);
              return;
            }
          }
          setter(parsed);
        } catch {
          safeStorage.set(key, defaultVal);
          setter(defaultVal);
        }
      } else {
        safeStorage.set(key, defaultVal);
        setter(defaultVal);
      }
    };

    initData('wms_users', defaultUsers, setUsers);
    initData('wms_warehouses', defaultWarehouses, setWarehouses);
    initData('wms_locations', defaultLocations, setLocations);
    initData('wms_products', defaultProducts, setProducts);
    initData('wms_vendors', defaultVendors, setVendors);
    initData('wms_customers', defaultCustomers, setCustomers);
    initData('wms_vehicles', defaultVehicles, setVehicles);
    initData('wms_purchase_orders', defaultPurchaseOrders, setPurchaseOrders);
    initData('wms_inventory', defaultInventory, setInventory);
    initData('wms_sales_orders', defaultSalesOrders, setSalesOrders);
    initData('wms_picklists', defaultPicklists, setPicklists);
    initData('wms_dispatch_invoices', defaultDispatchInvoices, setDispatchInvoices);
    initData('wms_cold_rooms', defaultColdRooms, setColdRooms);
    initData('wms_audit_logs', defaultAuditLogs, setAuditLogs);
    initData('wms_settings', defaultSettings, setSettings);
    initData('wms_companies', defaultCompanies, setCompanies);
    initData('wms_categories', defaultCategories, setCategories);
    initData('wms_uoms', defaultUoms, setUoms);
    initData('wms_drivers', defaultDrivers, setDrivers);
    initData('wms_employees', defaultEmployees, setEmployees);
    initData('wms_barcodes', defaultBarcodes, setBarcodes);
    initData('wms_taxes', defaultTaxes, setTaxes);
    initData('wms_reasons', defaultReasons, setReasons);
    initData('wms_returns', defaultReturns, setReturns);

    const storedUser = safeStorage.get('wms_logged_in_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && typeof parsedUser === 'object' && !Array.isArray(parsedUser)) {
          setLoggedInUser(parsedUser);
        } else {
          safeStorage.remove('wms_logged_in_user');
        }
      } catch {
        safeStorage.remove('wms_logged_in_user');
      }
    }
  }, []);

  // Helper to save state and storage
  const saveState = (key, data, setter) => {
    safeStorage.set(key, data);
    setter(data);
  };

  // Helper to add audit logs
  const logAction = (action, module, status = 'Success', customUser = null) => {
    const userToLog = customUser || loggedInUser;
    const newLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      username: userToLog ? userToLog.username : 'System',
      role: userToLog ? userToLog.role : 'System',
      action,
      module,
      status
    };
    const updated = [newLog, ...auditLogs];
    saveState('wms_audit_logs', updated, setAuditLogs);
  };

  // 1. Session Auth Logic
  const loginUser = (username, password) => {
    const userPool = users.length > 0 ? users : defaultUsers;
    const found = userPool.find(u => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password);
    if (!found) {
      return { success: false, message: 'Invalid username or password' };
    }
    if (found.status !== 'Active') {
      return { success: false, message: 'Account is deactivated. Please contact Admin.' };
    }

    // Set session
    const sessionUser = {
      username: found.username,
      name: found.name,
      role: found.role,
      permissions: found.permissions
    };
    saveState('wms_logged_in_user', sessionUser, setLoggedInUser);
    logAction('User Logged In', 'Authentication', 'Success', sessionUser);
    return { success: true, user: sessionUser };
  };

  const loginDirectly = (username = 'admin') => {
    const userPool = users.length > 0 ? users : defaultUsers;
    const found = userPool.find(u => u.username.toLowerCase() === username.toLowerCase().trim()) || userPool[0];
    if (found) {
      const sessionUser = {
        username: found.username,
        name: found.name,
        role: found.role,
        permissions: found.permissions
      };
      saveState('wms_logged_in_user', sessionUser, setLoggedInUser);
      logAction('User Direct Demo Login', 'Authentication', 'Success', sessionUser);
      return { success: true, user: sessionUser };
    }
    return { success: false };
  };

  const switchRole = (username) => {
    const userPool = users.length > 0 ? users : defaultUsers;
    const found = userPool.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
    if (found) {
      const sessionUser = {
        username: found.username,
        name: found.name,
        role: found.role,
        permissions: found.permissions
      };
      saveState('wms_logged_in_user', sessionUser, setLoggedInUser);
      logAction(`Switched Role to ${found.role}`, 'Authentication', 'Success', sessionUser);
      return true;
    }
    return false;
  };

  const logoutUser = () => {
    logAction('User Logged Out', 'Authentication');
    safeStorage.remove('wms_logged_in_user');
    setLoggedInUser(null);
  };


  // 2. Master Module CRUD Operations
  const addMasterItem = (tableKey, stateSetter, stateArray, item, moduleName) => {
    const newItem = {
      id: item.id || `REC-${Date.now()}`,
      ...item
    };
    const updated = [...(stateArray || []), newItem];
    if (typeof stateSetter === 'function') {
      stateSetter(updated);
    }
    logAction(`Added record in ${moduleName || 'Masters'}: ${newItem.code || newItem.name || newItem.vehicleNo || newItem.username || newItem.id || ''}`, 'Masters');
    return newItem;
  };

  const updateMasterItem = (tableKey, stateSetter, stateArray, id, updatedItem, moduleName) => {
    const updated = (stateArray || []).map(item => item.id === id ? { ...item, ...updatedItem } : item);
    if (typeof stateSetter === 'function') {
      stateSetter(updated);
    }
    logAction(`Updated record in ${moduleName || 'Masters'}: ${updatedItem.code || updatedItem.name || updatedItem.vehicleNo || updatedItem.username || id}`, 'Masters');
  };

  const deleteMasterItem = (tableKey, stateSetter, stateArray, id, moduleName) => {
    const itemToDelete = (stateArray || []).find(item => item.id === id);
    const updated = (stateArray || []).filter(item => item.id !== id);
    if (typeof stateSetter === 'function') {
      stateSetter(updated);
    }
    logAction(`Deleted record in ${moduleName || 'Masters'}: ${itemToDelete?.code || itemToDelete?.name || itemToDelete?.vehicleNo || itemToDelete?.username || id}`, 'Masters');
  };

  // 3. Inbound Gate Pass / Vehicle Management
  const registerVehicle = (vehicleData) => {
    const newVehicle = {
      id: `VEH-${Date.now()}`,
      gatepassNo: `GP-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      inDateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      outDateTime: '',
      status: 'Unload Pending',
      tempLog: [],
      ...vehicleData
    };
    const updated = [newVehicle, ...vehicles];
    saveState('wms_vehicles', updated, setVehicles);
    logAction(`Registered Vehicle Gate-in: ${newVehicle.vehicleNo}`, 'Gatepass');
    return newVehicle;
  };

  const closeVehicleEntry = (vehicleId, outKm, remark) => {
    const updated = vehicles.map(v => {
      if (v.id === vehicleId) {
        return {
          ...v,
          outKmReading: outKm,
          outDateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'Closed',
          remark: remark
        };
      }
      return v;
    });
    saveState('wms_vehicles', updated, setVehicles);
    const v = vehicles.find(item => item.id === vehicleId);
    logAction(`Registered Vehicle Gate-out: ${v?.vehicleNo}`, 'Gatepass');
  };

  // 4. GRN, QC & Put-away Transactions
  const processGRN = (poNo, gatepassNo, itemsList) => {
    // Generate GRN Number
    const grnNo = `GRN-${Date.now().toString().substring(5)}`;

    // Update Purchase Order received status
    const updatedPOs = purchaseOrders.map(po => {
      if (po.poNo === poNo) {
        const updatedItems = po.items.map(poItem => {
          const receivedInfo = itemsList.find(x => x.productId === poItem.productId);
          if (receivedInfo) {
            return {
              ...poItem,
              receivedQty: Number(poItem.receivedQty || 0) + Number(receivedInfo.qty)
            };
          }
          return poItem;
        });

        // Determine Status
        const allCompleted = updatedItems.every(x => x.receivedQty >= x.expectedQty);
        return {
          ...po,
          status: allCompleted ? 'Completed' : 'Receiving',
          items: updatedItems
        };
      }
      return po;
    });
    saveState('wms_purchase_orders', updatedPOs, setPurchaseOrders);

    // Create Inventory Batches for Approved items
    const newInventoryItems = [];
    itemsList.forEach(item => {
      if (item.isApproved) {
        // Generate Batch No
        const product = products.find(p => p.id === item.productId);
        const code = product ? product.code.replace('PROD-', '') : 'RAW';
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '').substring(2);
        const batchNo = `B-${code}-${dateStr}-${Math.floor(10 + Math.random() * 90)}`;
        const lotNo = `LOT-${Math.floor(90000 + Math.random() * 10000)}`;

        // Calculate Expiry based on shelf life
        const mfg = item.mfgDate || new Date().toISOString().split('T')[0];
        const shelfLife = product ? product.shelfLifeDays : 10;
        const expiry = new Date(new Date(mfg).getTime() + shelfLife * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        newInventoryItems.push({
          id: `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          productId: item.productId,
          batchNo,
          lotNo,
          qty: Number(item.qty),
          locationCode: 'Stage Area', // Put-away pending
          mfgDate: mfg,
          expiryDate: expiry,
          warehouseId: 'WH-01', // Default
          ageDays: 0,
          locked: false,
          tempLog: item.temp,
          grade: item.grading
        });
      }
    });

    if (newInventoryItems.length > 0) {
      const updatedInv = [...inventory, ...newInventoryItems];
      saveState('wms_inventory', updatedInv, setInventory);
    }

    // Update vehicle status to QC Checked / Put-away pending
    const updatedVehicles = vehicles.map(v => {
      if (v.gatepassNo === gatepassNo) {
        return {
          ...v,
          status: 'Putaway Pending',
          remark: `GRN generated: ${grnNo}`
        };
      }
      return v;
    });
    saveState('wms_vehicles', updatedVehicles, setVehicles);

    logAction(`Generated GRN ${grnNo} for PO: ${poNo}`, 'Inbound');
    return grnNo;
  };

  const confirmPutaway = (invId, targetLocCode) => {
    const updatedInv = inventory.map(item => {
      if (item.id === invId) {
        return {
          ...item,
          locationCode: targetLocCode
        };
      }
      return item;
    });
    saveState('wms_inventory', updatedInv, setInventory);

    // Check if there are any pending putaways for the vehicle
    const item = inventory.find(i => i.id === invId);
    logAction(`Executed Putaway of Batch ${item?.batchNo} to Bin ${targetLocCode}`, 'Inbound');
  };

  // Automated Full Inward Workflow: PO -> Gatepass -> Unload -> GRN -> QC -> Putaway -> Live Stock
  const executeFullPoAutoWorkflow = (poNo, targetBin = 'A-01-01') => {
    const po = purchaseOrders.find(p => p.poNo === poNo);
    if (!po) return { success: false, message: 'Purchase Order not found' };

    const vendor = vendors.find(v => v.id === po.vendorId);
    const vendorName = vendor?.name || 'Direct Supplier';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    // 1. Issue Gate Pass & Vehicle Entry
    const newVehicle = {
      id: `VEH-${Date.now()}`,
      vehicleNo: `GJ10TZ${Math.floor(1000 + Math.random() * 9000)}`,
      driverName: 'Ramesh Patel',
      transporter: vendorName,
      gatepassNo: `GP-2026-${randomSuffix}`,
      processType: 'Inbound',
      bookingType: 'PO Material',
      bookingRefDocNo: po.poNo,
      inDateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      outDateTime: '',
      inKmReading: 45200,
      outKmReading: '',
      status: 'Putaway Completed',
      remark: `Full Workflow Executed: PO -> Gatepass -> Unload -> GRN -> QC -> Putaway`,
      tempLog: [3.4, 3.2]
    };
    const updatedVehicles = [newVehicle, ...vehicles];
    saveState('wms_vehicles', updatedVehicles, setVehicles);

    // 2. Generate GRN & Update PO items
    const grnNo = `GRN-${Date.now().toString().substring(5)}`;
    const updatedPOs = purchaseOrders.map(p => {
      if (p.poNo === poNo) {
        return {
          ...p,
          status: 'Completed',
          items: p.items.map(item => ({
            ...item,
            receivedQty: item.expectedQty
          }))
        };
      }
      return p;
    });
    saveState('wms_purchase_orders', updatedPOs, setPurchaseOrders);

    // 3. Create Live Inventory in target location directly (Putaway completed)
    const newInventoryItems = [];
    po.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      const code = product ? product.code.replace('PROD-', '') : 'RAW';
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '').substring(2);
      const batchNo = `B-${code}-${dateStr}-${Math.floor(10 + Math.random() * 90)}`;
      const lotNo = `LOT-${Math.floor(90000 + Math.random() * 10000)}`;
      const mfg = new Date().toISOString().split('T')[0];
      const shelfLife = product ? product.shelfLifeDays : 14;
      const expiry = new Date(new Date(mfg).getTime() + shelfLife * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      newInventoryItems.push({
        id: `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        productId: item.productId,
        batchNo,
        lotNo,
        qty: Number(item.expectedQty),
        locationCode: targetBin,
        mfgDate: mfg,
        expiryDate: expiry,
        warehouseId: 'WH-01',
        ageDays: 0,
        locked: false,
        tempLog: 3.2,
        grade: 'Grade A'
      });
    });

    const updatedInv = [...inventory, ...newInventoryItems];
    saveState('wms_inventory', updatedInv, setInventory);

    logAction(`Executed Full Inward Workflow for ${poNo} (Gatepass ${newVehicle.gatepassNo}, GRN ${grnNo}, Putaway to ${targetBin})`, 'Purchase Order', 'Success');

    return {
      success: true,
      gatepassNo: newVehicle.gatepassNo,
      grnNo,
      batches: newInventoryItems.map(i => i.batchNo),
      targetBin
    };
  };

  // 5. Outbound Order Picking (FIFO/FEFO) & Dispatch
  const getFefoPickingSuggestions = (productId, requiredQty) => {
    // Filter inventory for this product, in warehouse, not locked, not in Stage Area
    const batches = inventory.filter(item =>
      item.productId === productId &&
      !item.locked &&
      item.locationCode !== 'Stage Area' &&
      item.qty > 0
    );

    // Sort by Expiry Date ascending (FEFO)
    batches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    let remaining = requiredQty;
    const picks = [];

    for (const batch of batches) {
      if (remaining <= 0) break;
      const pickQty = Math.min(batch.qty, remaining);
      picks.push({
        inventoryId: batch.id,
        batchNo: batch.batchNo,
        locationCode: batch.locationCode,
        qtyAvailable: batch.qty,
        qtyToPick: pickQty,
        expiryDate: batch.expiryDate
      });
      remaining -= pickQty;
    }

    return {
      picks,
      isFullySatisfied: remaining <= 0,
      shortfall: remaining > 0 ? remaining : 0
    };
  };

  const executePicking = (orderId, picksList) => {
    // Create copy of inventory
    let currentInv = [...inventory];

    picksList.forEach(pick => {
      currentInv = currentInv.map(invItem => {
        if (invItem.id === pick.inventoryId) {
          const newQty = invItem.qty - pick.qtyToPick;
          return {
            ...invItem,
            qty: newQty
          };
        }
        return invItem;
      }).filter(x => x.qty > 0); // Remove empty batches from inventory
    });

    saveState('wms_inventory', currentInv, setInventory);

    // Update Sales Order Status to Packed
    const updatedOrders = salesOrders.map(so => {
      if (so.id === orderId) {
        return {
          ...so,
          status: 'Packed'
        };
      }
      return so;
    });
    saveState('wms_sales_orders', updatedOrders, setSalesOrders);

    logAction(`Completed picking & packing for Order ${orderId}`, 'Outbound');
  };

  const dispatchSalesOrder = (orderId, dispatchData) => {
    // Generate Invoice No, Gatepass No
    const invoiceNo = `INV-DISP-${Math.floor(1000 + Math.random() * 9000)}`;
    const gatePassNo = dispatchData.gatePassNo || `GP-OUT-${Math.floor(100000 + Math.random() * 900000)}`;

    const updatedOrders = salesOrders.map(so => {
      if (so.id === orderId) {
        return {
          ...so,
          status: 'Dispatched',
          dispatchDetails: {
            dispatchNo: `DISP-${Date.now().toString().substring(5)}`,
            invoiceNo,
            gatePassNo,
            packedTime: new Date().toISOString().replace('T', ' ').substring(0, 19).replace(/\.\d+/, ''),
            dispatchTime: new Date().toISOString().replace('T', ' ').substring(0, 19).replace(/\.\d+/, ''),
            ...dispatchData
          }
        };
      }
      return so;
    });
    saveState('wms_sales_orders', updatedOrders, setSalesOrders);

    // Update existing vehicle status or register new Outbound Vehicle Gate Entry
    if (dispatchData.vehicleId) {
      const updatedVehicles = vehicles.map(v => {
        if (v.id === dispatchData.vehicleId) {
          return {
            ...v,
            status: 'Pending Gate Out',
            bookingType: 'Sales Dispatch',
            bookingRefDocNo: orderId,
            remark: `Loaded Order: ${orderId} (Invoice: ${invoiceNo})`
          };
        }
        return v;
      });
      saveState('wms_vehicles', updatedVehicles, setVehicles);
    } else if (dispatchData.vehicleNo) {
      const existingVehicle = vehicles.find(v => v.vehicleNo.toLowerCase() === dispatchData.vehicleNo.toLowerCase() && v.status !== 'Closed');
      if (existingVehicle) {
        const updatedVehicles = vehicles.map(v => {
          if (v.id === existingVehicle.id) {
            return {
              ...v,
              status: 'Pending Gate Out',
              bookingType: 'Sales Dispatch',
              bookingRefDocNo: orderId,
              remark: `Loaded Order: ${orderId} (Invoice: ${invoiceNo})`
            };
          }
          return v;
        });
        saveState('wms_vehicles', updatedVehicles, setVehicles);
      } else {
        registerVehicle({
          vehicleNo: dispatchData.vehicleNo,
          driverName: dispatchData.driverName,
          transporter: dispatchData.transporter || 'Default',
          processType: 'Outbound',
          bookingType: 'Sales Dispatch',
          bookingRefDocNo: orderId,
          remark: `Dispatched Invoice: ${invoiceNo}`,
          gatepassNo: gatePassNo
        });
      }
    }

    logAction(`Dispatched Order ${orderId}. Invoice: ${invoiceNo}`, 'Outbound');
    return { invoiceNo, gatePassNo };
  };

  const confirmSOArrival = (orderId, signatureBase64, podMetadata = {}) => {
    const updatedOrders = (salesOrders || []).map(so => {
      if (so.id === orderId || so.orderNo === orderId || so.salesDeliveryNo === orderId || so.orderNo?.includes(orderId)) {
        return {
          ...so,
          status: 'Delivered',
          podStatus: 'POD Confirmed',
          dispatchDetails: {
            ...so.dispatchDetails,
            deliveryTime: podMetadata.podDateTime || new Date().toISOString().replace('T', ' ').substring(0, 19),
            signature: signatureBase64,
            receiverName: podMetadata.receiverName || 'Customer Receiver',
            receiverPhone: podMetadata.receiverPhone || '',
            podRemarks: podMetadata.remarks || 'Confirmed Delivery POD'
          }
        };
      }
      return so;
    });
    saveState('wms_sales_orders', updatedOrders, setSalesOrders);

    // Update dispatchInvoices ledger entry
    const updatedInvoices = (dispatchInvoices || []).map(inv => {
      if (inv.orderId === orderId || inv.orderNo === orderId || inv.id === orderId || inv.challanNo === orderId || inv.invoiceNo === orderId || inv.salesDeliveryNo === orderId) {
        return {
          ...inv,
          status: 'POD Confirmed',
          podStatus: 'POD Confirmed',
          podTime: podMetadata.podDateTime || new Date().toISOString().replace('T', ' ').substring(0, 19),
          receiverName: podMetadata.receiverName || 'Customer Receiver',
          receiverPhone: podMetadata.receiverPhone || '',
          signature: signatureBase64,
          podRemarks: podMetadata.remarks || 'Confirmed Delivery POD'
        };
      }
      return inv;
    });
    saveState('wms_dispatch_invoices', updatedInvoices, setDispatchInvoices);

    // Close corresponding vehicle status
    const order = (salesOrders || []).find(o => o.id === orderId || o.orderNo === orderId);
    const vehicle = (vehicles || []).find(v => (v.bookingRefDocNo === orderId || v.bookingRefDocNo === order?.orderNo) && v.status !== 'Closed');
    if (vehicle) {
      closeVehicleEntry(vehicle.id, (vehicle.inKmReading || 12000) + 15, 'Delivery Confirmation Signed (POD)');
    }

    // Auto-generate Sales Return entry in 'Return Confirmation Pending' for Returns Control
    const totalReturnQty = podMetadata.items
      ? podMetadata.items.reduce((acc, it) => acc + (Number(it.rejectedQty) || 0), 0)
      : (Number(podMetadata.damageQty) || 0);

    const totalQty = podMetadata.items
      ? podMetadata.items.reduce((acc, it) => acc + (Number(it.dispatchedQty) || 0), 0)
      : (order?.items?.reduce((s, i) => s + Number(i.qty), 0) || 100);

    const challanNumber = podMetadata.challanNo || order?.dispatchDetails?.invoiceNo || `GVL/${Math.floor(10000 + Math.random() * 90000)}/26-27`;
    const salesDeliveryNumber = order?.salesDeliveryNo || podMetadata.salesDeliveryNo || `${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const newSalesReturn = {
      id: `RET-${Date.now()}`,
      returnNo: `RET-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'Sales Return',
      challanNo: challanNumber,
      salesDeliveryNo: salesDeliveryNumber,
      orderId: orderId,
      partnerId: order?.customerId || 'C-001',
      customerName: podMetadata.receiverName || order?.customerName || 'Customer',
      noOfProducts: podMetadata.items?.length || order?.items?.length || 1,
      totalQty: totalQty,
      totalReturnQty: totalReturnQty,
      qty: totalReturnQty > 0 ? totalReturnQty : totalQty,
      reason: podMetadata.remarks || (totalReturnQty > 0 ? 'POD Rejection / Damage at Delivery' : 'POD Completed - Verified at Gate'),
      tempLog: 4.0,
      status: 'Return Confirmation Pending',
      date: new Date().toISOString().substring(0, 10),
      items: (podMetadata.items || []).map(it => ({
        productCode: it.productCode || it.productId || 'G009',
        productDesc: it.productDesc || it.description || 'Produce Item',
        uom: it.uom || 'KG',
        dispatchedQty: Number(it.dispatchedQty) || 0,
        returnQty: Number(it.rejectedQty) || 0,
        reason: it.remark || 'Customer Rejection'
      })),
      actionTaken: 'Awaiting Return Confirmation Disposition'
    };

    setReturns(prev => {
      const existing = (prev || []).filter(r => r.challanNo !== challanNumber);
      const updated = [newSalesReturn, ...existing];
      localStorage.setItem('wms_returns', JSON.stringify(updated));
      return updated;
    });

    logAction(`POD Confirmed & Delivery Completed for Order: ${order?.orderNo || orderId}. Rejection logged in Sales Return.`, 'Outbound');
  };

  const registerReturn = (returnData) => {
    const newReturn = {
      id: returnData.id || `RET-${Date.now()}`,
      returnNo: returnData.returnNo || `RET-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: returnData.date || new Date().toISOString().substring(0, 10),
      status: returnData.status || 'Quarantined',
      totalQty: returnData.qty || returnData.totalQty || 1,
      totalReturnQty: returnData.qty || returnData.totalReturnQty || 0,
      noOfProducts: returnData.items?.length || 1,
      challanNo: returnData.challanNo || `GVL/${Math.floor(10000 + Math.random() * 90000)}/26-27`,
      salesDeliveryNo: returnData.salesDeliveryNo || `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      ...returnData
    };

    const updated = [newReturn, ...(returns || [])];
    saveState('wms_returns', updated, setReturns);
    logAction(`Registered Return ${newReturn.returnNo} (${newReturn.type})`, 'Returns');
    return newReturn;
  };

  const confirmReturnDisposition = (returnId, dispositionData) => {
    const updated = (returns || []).map(ret => {
      if (ret.id === returnId || ret.returnNo === returnId || ret.challanNo === returnId) {
        return {
          ...ret,
          status: dispositionData.disposition, // 'Return To Vendor' | 'Sale To Local Market' | 'Scrap' | 'Restocked'
          disposition: dispositionData.disposition,
          dispositionDate: new Date().toISOString().substring(0, 10),
          dispositionDetails: {
            ...dispositionData,
            confirmedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            confirmedBy: loggedInUser?.username || 'admin'
          },
          totalReturnQty: dispositionData.confirmedReturnQty !== undefined ? Number(dispositionData.confirmedReturnQty) : ret.totalReturnQty,
          actionTaken: `Confirmed disposition: ${dispositionData.disposition}. ${dispositionData.remarks || ''}`
        };
      }
      return ret;
    });

    saveState('wms_returns', updated, setReturns);

    // If Restocked, put back into inventory
    if (dispositionData.disposition === 'Restocked' && dispositionData.locationCode) {
      const retObj = (returns || []).find(r => r.id === returnId || r.returnNo === returnId || r.challanNo === returnId);
      if (retObj) {
        const restockQty = Number(dispositionData.confirmedReturnQty || retObj.totalReturnQty || retObj.qty || 1);
        const newInv = {
          id: `INV-RET-${Date.now()}`,
          productId: retObj.productId || 'P-001',
          batchNo: `B-RET-${new Date().toISOString().substring(2, 10).replace(/-/g, '')}`,
          qty: restockQty,
          locationCode: dispositionData.locationCode || 'A-01-01',
          manufacturingDate: new Date().toISOString().substring(0, 10),
          expiryDate: new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10),
          qualityGrade: 'Grade A',
          supplier: 'Customer Return'
        };
        const updatedInv = [newInv, ...inventory];
        saveState('wms_inventory', updatedInv, setInventory);
      }
    }

    logAction(`Confirmed Return Disposition (${dispositionData.disposition}) for Challan ${dispositionData.challanNo || returnId}`, 'Returns');
    return { success: true };
  };

  const updateSalesOrder = (id, updatedData) => {
    const updated = salesOrders.map(so => so.id === id ? { ...so, ...updatedData } : so);
    saveState('wms_sales_orders', updated, setSalesOrders);
    logAction(`Updated Sales Order: ${updatedData.orderNo || id}`, 'Outbound');
    return updatedData;
  };

  const deleteSalesOrder = (id) => {
    const soToDelete = salesOrders.find(so => so.id === id);
    const updated = salesOrders.filter(so => so.id !== id);
    saveState('wms_sales_orders', updated, setSalesOrders);
    logAction(`Deleted Sales Order: ${soToDelete?.orderNo || id}`, 'Outbound', 'Warning');
    return true;
  };

  const createPicklist = (picklistData) => {
    const newPicklist = {
      id: picklistData.id || `PL-${Date.now()}`,
      pickingId: picklistData.pickingId || `PL${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      pickingIssueDate: picklistData.pickingIssueDate || new Date().toISOString().replace('T', ' ').substring(0, 19),
      pickWise: picklistData.pickWise || 'Batch Wise',
      picklistGenerateMode: picklistData.picklistGenerateMode || 'HHT',
      pickingStatus: picklistData.pickingStatus || 'Picklist completed. But Picking pending',
      status: picklistData.status || 'Picklist completed. But Picking pending',
      ...picklistData
    };
    const updated = [newPicklist, ...(picklists || [])];
    saveState('wms_picklists', updated, setPicklists);
    logAction(`Created Picklist ${newPicklist.pickingId} for Order ${newPicklist.orderNo || newPicklist.orderId}`, 'Outbound');
    return newPicklist;
  };

  const updatePicklist = (id, updatedData) => {
    const updated = (picklists || []).map(p => (p.id === id || p.pickingId === id) ? { ...p, ...updatedData } : p);
    saveState('wms_picklists', updated, setPicklists);
    logAction(`Updated Picklist: ${id}`, 'Outbound');
  };

  const deletePicklist = (id) => {
    const toDel = (picklists || []).find(p => p.id === id || p.pickingId === id);
    const updated = (picklists || []).filter(p => p.id !== id && p.pickingId !== id);
    saveState('wms_picklists', updated, setPicklists);
    logAction(`Deleted Picklist: ${toDel?.pickingId || id}`, 'Outbound', 'Warning');
  };

  const createDispatchInvoice = (invData) => {
    const numPart = invData.orderId ? invData.orderId.replace(/\D/g, '') : Math.floor(1000 + Math.random() * 9000);
    const newInv = {
      id: invData.id || `INV-${numPart}`,
      orderId: invData.orderId || `${numPart}`,
      orderNo: invData.orderNo || `SO-2026-${numPart}`,
      orderType: invData.orderType || 'Dispatch Order',
      priority: invData.priority || 'Normal',
      orderDate: invData.orderDate || new Date().toISOString().substring(0, 10),
      salesDeliveryNo: invData.salesDeliveryNo || `1784${Math.floor(100000 + Math.random() * 900000)}`,
      customerCode: invData.customerCode || 'CUST',
      customerName: invData.customerName || 'Customer',
      shippingAddress: invData.shippingAddress || 'Customer Facility, Jamnagar',
      location: invData.location || '54 Acre',
      area: invData.area || 'STAFF KITCHEN',
      orderBookingType: invData.orderBookingType || 'Sales Delivery Order',
      noOfProducts: invData.noOfProducts || (invData.items?.length || 1),
      challanNo: invData.challanNo || `GVL/0${numPart}/26-27`,
      invoiceNo: invData.invoiceNo || `GVL/0${numPart}/26-27`,
      gatePassNo: invData.gatePassNo || 'GP-2026-481779',
      vehicleNo: invData.vehicleNo || 'GJ15AV7963',
      driverName: invData.driverName || 'Aabid Sama',
      driverMobile: invData.driverMobile || '9687064462',
      dispatchInvoiceDate: invData.dispatchInvoiceDate || new Date().toISOString().substring(0, 10),
      dispatchTime: invData.dispatchTime || new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Dispatched',
      cratesCount: invData.cratesCount || '26',
      items: invData.items || [],
      ...invData
    };
    const updated = [newInv, ...(dispatchInvoices || [])];
    saveState('wms_dispatch_invoices', updated, setDispatchInvoices);
    logAction(`Generated Dispatch Invoice & Challan ${newInv.invoiceNo} for Order ${newInv.orderNo}`, 'Outbound');
    return newInv;
  };

  const updateDispatchInvoice = (id, updatedData) => {
    const updated = (dispatchInvoices || []).map(inv => (inv.id === id || inv.invoiceNo === id || inv.orderId === id) ? { ...inv, ...updatedData } : inv);
    saveState('wms_dispatch_invoices', updated, setDispatchInvoices);
    logAction(`Updated Dispatch Invoice: ${id}`, 'Outbound');
  };

  const deleteDispatchInvoice = (id) => {
    const toDel = (dispatchInvoices || []).find(inv => inv.id === id || inv.invoiceNo === id);
    const updated = (dispatchInvoices || []).filter(inv => inv.id !== id && inv.invoiceNo !== id);
    saveState('wms_dispatch_invoices', updated, setDispatchInvoices);
    logAction(`Deleted Dispatch Invoice: ${toDel?.invoiceNo || id}`, 'Outbound', 'Warning');
  };

  // 6. Inventory Bin-to-Bin Movements (including split quantity)
  const executeInventoryMovement = (invId, targetLocCode, moveQty) => {
    const sourceItem = inventory.find(i => i.id === invId);
    if (!sourceItem) return { success: false, message: 'Source inventory not found' };

    if (moveQty > sourceItem.qty) {
      return { success: false, message: 'Insufficient quantity in source batch' };
    }

    // Verify Target Location status
    const targetLoc = locations.find(l => l.code === targetLocCode);
    if (targetLoc && targetLoc.status === 'Locked') {
      return { success: false, message: `Target Location ${targetLocCode} is locked.` };
    }

    let updatedInventory = [...inventory];

    if (moveQty === sourceItem.qty) {
      // Direct Move
      updatedInventory = updatedInventory.map(item => {
        if (item.id === invId) {
          return {
            ...item,
            locationCode: targetLocCode
          };
        }
        return item;
      });
    } else {
      // Split Move (create new inventory record and deduct from original)
      updatedInventory = updatedInventory.map(item => {
        if (item.id === invId) {
          return {
            ...item,
            qty: item.qty - moveQty
          };
        }
        return item;
      });

      const newRecord = {
        ...sourceItem,
        id: `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        qty: moveQty,
        locationCode: targetLocCode
      };
      updatedInventory.push(newRecord);
    }

    saveState('wms_inventory', updatedInventory, setInventory);
    logAction(`Moved ${moveQty} units of Batch ${sourceItem.batchNo} from ${sourceItem.locationCode} to ${targetLocCode}`, 'Store');
    return { success: true };
  };

  // 7. Cold Chain Controller
  const setColdRoomTempOverride = (roomId, tempVal) => {
    const updated = coldRooms.map(room => {
      if (room.id === roomId) {
        let status = 'Normal';
        if (tempVal < room.minTemp || tempVal > room.maxTemp) {
          status = 'Alert';
        }
        return {
          ...room,
          currentTemp: Number(tempVal),
          status
        };
      }
      return room;
    });
    saveState('wms_cold_rooms', updated, setColdRooms);

    const r = coldRooms.find(item => item.id === roomId);
    if (tempVal < r.minTemp || tempVal > r.maxTemp) {
      logAction(`Cold Room Alert Triggered: ${r.name} temperature is ${tempVal}°C`, 'Cold Chain', 'Warning');
    }
  };

  // 8. User Security & Management
  const addUser = (userData) => {
    const exists = users.some(u => u.username.toLowerCase() === userData.username.toLowerCase().trim());
    if (exists) {
      return { success: false, message: 'Username already exists.' };
    }
    const newUser = {
      username: userData.username.trim().toLowerCase(),
      name: userData.name || userData.username,
      role: userData.role || 'Operator',
      status: userData.status || 'Active',
      password: userData.password || 'User@123',
      permissions: userData.permissions || ['dashboard']
    };
    const updated = [...users, newUser];
    saveState('wms_users', updated, setUsers);
    logAction(`Created new user account: ${newUser.username} (${newUser.role})`, 'Security');
    return { success: true, user: newUser };
  };

  const updateUser = (username, updatedData) => {
    let found = false;
    const updated = users.map(u => {
      if (u.username === username) {
        found = true;
        return {
          ...u,
          ...updatedData
        };
      }
      return u;
    });

    if (!found) {
      return { success: false, message: 'User not found' };
    }

    saveState('wms_users', updated, setUsers);

    // If currently logged in user updated their own profile, sync session
    if (loggedInUser && loggedInUser.username === username) {
      const updatedUser = updated.find(u => u.username === (updatedData.username || username));
      if (updatedUser) {
        const sessionUser = {
          username: updatedUser.username,
          name: updatedUser.name,
          role: updatedUser.role,
          permissions: updatedUser.permissions
        };
        saveState('wms_logged_in_user', sessionUser, setLoggedInUser);
      }
    }

    logAction(`Updated user details for ${username}`, 'Security');
    return { success: true };
  };

  const deleteUser = (username) => {
    if (username === 'admin') {
      return { success: false, message: 'Primary Administrator account cannot be deleted.' };
    }
    if (loggedInUser && loggedInUser.username === username) {
      return { success: false, message: 'You cannot delete the currently logged in user account.' };
    }

    const updated = users.filter(u => u.username !== username);
    saveState('wms_users', updated, setUsers);
    logAction(`Deleted user account: ${username}`, 'Security');
    return { success: true };
  };

  const changeUserPassword = (username, newPassword) => {
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long.' };
    }
    const updated = users.map(u => {
      if (u.username === username) {
        return {
          ...u,
          password: newPassword
        };
      }
      return u;
    });
    saveState('wms_users', updated, setUsers);
    logAction(`Updated password for user ${username}`, 'Security');
    return { success: true };
  };

  const updateUserPermissions = (username, newPerms) => {
    const updated = users.map(u => {
      if (u.username === username) {
        return {
          ...u,
          permissions: newPerms
        };
      }
      return u;
    });
    saveState('wms_users', updated, setUsers);
    logAction(`Updated user permissions for ${username}`, 'Security');
  };

  const updateUserStatus = (username, newStatus) => {
    const updated = users.map(u => {
      if (u.username === username) {
        return {
          ...u,
          status: newStatus
        };
      }
      return u;
    });
    saveState('wms_users', updated, setUsers);
    logAction(`Updated status of user ${username} to ${newStatus}`, 'Security');
  };

  const updateSystemSettings = (newSettings) => {
    saveState('wms_settings', newSettings, setSettings);
    logAction('Updated System settings config', 'Security');
  };

  const resetTransactionDB = () => {
    // Reset transactional tables: inventory, vehicles, POs, SOs, audit logs
    saveState('wms_inventory', defaultInventory, setInventory);
    saveState('wms_vehicles', defaultVehicles, setVehicles);
    saveState('wms_purchase_orders', defaultPurchaseOrders, setPurchaseOrders);
    saveState('wms_sales_orders', defaultSalesOrders, setSalesOrders);
    saveState('wms_cold_rooms', defaultColdRooms, setColdRooms);

    const initialLogs = [{ id: 'LOG-RESET', timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), username: loggedInUser?.username || 'System', role: loggedInUser?.role || 'Admin', action: 'Transactional Database Reset Executed', module: 'Security', status: 'Success' }];
    saveState('wms_audit_logs', initialLogs, setAuditLogs);
  };

  const resetAllDB = () => {
    // Reset everything, including master data and user accounts
    localStorage.clear();
    setUsers(defaultUsers);
    setWarehouses(defaultWarehouses);
    setLocations(defaultLocations);
    setProducts(defaultProducts);
    setVendors(defaultVendors);
    setCustomers(defaultCustomers);
    setVehicles(defaultVehicles);
    setPurchaseOrders(defaultPurchaseOrders);
    setInventory(defaultInventory);
    setSalesOrders(defaultSalesOrders);
    setColdRooms(defaultColdRooms);
    setSettings(defaultSettings);
    setCompanies(defaultCompanies);
    setCategories(defaultCategories);
    setUoms(defaultUoms);
    setDrivers(defaultDrivers);
    setEmployees(defaultEmployees);
    setBarcodes(defaultBarcodes);
    setTaxes(defaultTaxes);
    setReasons(defaultReasons);

    const initialLogs = [{ id: 'LOG-RESET-ALL', timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), username: 'System', role: 'Admin', action: 'Full Master & Transactional Database Reset Executed', module: 'Security', status: 'Success' }];
    setAuditLogs(initialLogs);
    localStorage.setItem('wms_users', JSON.stringify(defaultUsers));
    localStorage.setItem('wms_warehouses', JSON.stringify(defaultWarehouses));
    localStorage.setItem('wms_locations', JSON.stringify(defaultLocations));
    localStorage.setItem('wms_products', JSON.stringify(defaultProducts));
    localStorage.setItem('wms_vendors', JSON.stringify(defaultVendors));
    localStorage.setItem('wms_customers', JSON.stringify(defaultCustomers));
    localStorage.setItem('wms_vehicles', JSON.stringify(defaultVehicles));
    localStorage.setItem('wms_purchase_orders', JSON.stringify(defaultPurchaseOrders));
    localStorage.setItem('wms_inventory', JSON.stringify(defaultInventory));
    localStorage.setItem('wms_sales_orders', JSON.stringify(defaultSalesOrders));
    localStorage.setItem('wms_cold_rooms', JSON.stringify(defaultColdRooms));
    localStorage.setItem('wms_audit_logs', JSON.stringify(initialLogs));
    localStorage.setItem('wms_settings', JSON.stringify(defaultSettings));
    localStorage.setItem('wms_companies', JSON.stringify(defaultCompanies));
    localStorage.setItem('wms_categories', JSON.stringify(defaultCategories));
    localStorage.setItem('wms_uoms', JSON.stringify(defaultUoms));
    localStorage.setItem('wms_drivers', JSON.stringify(defaultDrivers));
    localStorage.setItem('wms_employees', JSON.stringify(defaultEmployees));
    localStorage.setItem('wms_barcodes', JSON.stringify(defaultBarcodes));
    localStorage.setItem('wms_taxes', JSON.stringify(defaultTaxes));
    localStorage.setItem('wms_reasons', JSON.stringify(defaultReasons));
  };

  return (
    <WmsDataContext.Provider value={{
      users,
      warehouses,
      locations,
      products,
      vendors,
      customers,
      vehicles,
      purchaseOrders,
      inventory,
      salesOrders,
      picklists,
      dispatchInvoices,
      coldRooms,
      auditLogs,
      settings,
      loggedInUser,


      // New master lists
      companies,
      categories,
      uoms,
      drivers,
      employees,
      barcodes,
      taxes,
      reasons,

      // Auth functions
      loginUser,
      loginDirectly,
      switchRole,
      logoutUser,

      // Master CRUD helper functions
      addMasterItem,
      updateMasterItem,
      deleteMasterItem,

      // Specific CRUD state helpers
      setUsers: (d) => saveState('wms_users', d, setUsers),
      setWarehouses: (d) => saveState('wms_warehouses', d, setWarehouses),
      setLocations: (d) => saveState('wms_locations', d, setLocations),
      setProducts: (d) => saveState('wms_products', d, setProducts),
      setVendors: (d) => saveState('wms_vendors', d, setVendors),
      setCustomers: (d) => saveState('wms_customers', d, setCustomers),
      setVehicles: (d) => saveState('wms_vehicles', d, setVehicles),
      setPurchaseOrders: (d) => saveState('wms_purchase_orders', d, setPurchaseOrders),
      setInventory: (d) => saveState('wms_inventory', d, setInventory),
      setSalesOrders: (d) => saveState('wms_sales_orders', d, setSalesOrders),
      setPicklists: (d) => saveState('wms_picklists', d, setPicklists),
      setDispatchInvoices: (d) => saveState('wms_dispatch_invoices', d, setDispatchInvoices),
      setCompanies: (d) => saveState('wms_companies', d, setCompanies),
      setCategories: (d) => saveState('wms_categories', d, setCategories),
      setUoms: (d) => saveState('wms_uoms', d, setUoms),
      setDrivers: (d) => saveState('wms_drivers', d, setDrivers),
      setEmployees: (d) => saveState('wms_employees', d, setEmployees),
      setBarcodes: (d) => saveState('wms_barcodes', d, setBarcodes),
      setTaxes: (d) => saveState('wms_taxes', d, setTaxes),
      setReasons: (d) => saveState('wms_reasons', d, setReasons),
      returns,
      setReturns: (d) => saveState('wms_returns', d, setReturns),
      registerReturn,
      confirmReturnDisposition,

      // Inbound Logic
      registerVehicle,
      closeVehicleEntry,
      processGRN,
      confirmPutaway,
      executeFullPoAutoWorkflow,

      // Outbound Logic
      getFefoPickingSuggestions,
      executePicking,
      dispatchSalesOrder,
      confirmSOArrival,
      updateSalesOrder,
      deleteSalesOrder,
      createPicklist,
      updatePicklist,
      deletePicklist,
      createDispatchInvoice,
      updateDispatchInvoice,
      deleteDispatchInvoice,

      // Store Bin movements
      executeInventoryMovement,

      // Cold Chain Temp Controls
      setColdRoomTempOverride,

      // Security & User controls
      addUser,
      updateUser,
      deleteUser,
      changeUserPassword,
      updateUserPermissions,
      updateUserStatus,
      updateSystemSettings,
      resetTransactionDB,
      resetAllDB,
      logAction,

      // Navigation
      currentView,
      setCurrentView,
      activeTabs,
      setActiveTabs,
      navigateTo
    }}>
      {children}
    </WmsDataContext.Provider>
  );
};
