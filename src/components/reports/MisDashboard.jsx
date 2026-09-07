import React, { useContext, useState, useMemo, useEffect } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Building2,
  Users,
  Download,
  RefreshCw,
  Search,
  ChevronRight,
  BarChart3,
  Thermometer,
  Box,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

export default function MisDashboard() {
  const {
    inventory = [],
    products = [],
    salesOrders = [],
    purchaseOrders = [],
    vendors = [],
    customers = [],
    warehouses = [],
    locations = [],
    coldRooms = []
  } = useContext(WmsDataContext);

  // Active Sub-Tab in MIS Dashboard
  const [activeSection, setActiveSection] = useState('executive'); // 'executive' | 'product_wise' | 'zone_wise' | 'vendor_wise' | 'order_ledger'

  // Global Filters
  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('all'); // 'today' | 'week' | 'month' | 'all'

  // Live Auto-Refresh Simulation
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    if (!isLiveActive) return;
    const interval = setInterval(() => {
      setLastSyncTime(new Date().toLocaleTimeString());
      setPulseCount(prev => prev + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, [isLiveActive]);

  // Unique categories
  const categoriesList = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ['ALL', ...Array.from(cats)];
  }, [products]);

  // =========================================================================
  // 1. COMPUTED CORE METRICS: ORDER REQ, DISPATCH & SHORTFALL
  // =========================================================================
  const orderMetrics = useMemo(() => {
    let totalReqQty = 0;
    let totalDispatchedQty = 0;
    let totalPendingQty = 0;
    let totalOrdersCount = salesOrders.length;
    let fulfilledOrdersCount = 0;
    let partialOrdersCount = 0;
    let pendingOrdersCount = 0;

    salesOrders.forEach(so => {
      const orderReq = so.items?.reduce((sum, it) => sum + (Number(it.qty) || 0), 0) || 0;
      totalReqQty += orderReq;

      if (so.status === 'Delivered' || so.status === 'Dispatched') {
        totalDispatchedQty += orderReq;
        fulfilledOrdersCount += 1;
      } else if (so.status === 'Picking' || so.status === 'Packed') {
        const halfDispatched = Math.round(orderReq * 0.5);
        totalDispatchedQty += halfDispatched;
        totalPendingQty += (orderReq - halfDispatched);
        partialOrdersCount += 1;
      } else {
        totalPendingQty += orderReq;
        pendingOrdersCount += 1;
      }
    });

    const shortfallQty = Math.max(0, totalReqQty - totalDispatchedQty);
    const fulfillmentRate = totalReqQty > 0 ? Math.round((totalDispatchedQty / totalReqQty) * 100) : 100;
    const shortfallRate = totalReqQty > 0 ? Math.round((shortfallQty / totalReqQty) * 100) : 0;

    return {
      totalReqQty,
      totalDispatchedQty,
      shortfallQty,
      fulfillmentRate,
      shortfallRate,
      totalOrdersCount,
      fulfilledOrdersCount,
      partialOrdersCount,
      pendingOrdersCount
    };
  }, [salesOrders]);

  // =========================================================================
  // 2. COMPUTED INVENTORY & CAPACITY METRICS
  // =========================================================================
  const inventoryMetrics = useMemo(() => {
    const totalStock = inventory.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
    const lockedStock = inventory.filter(i => i.locked).reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
    const availableStock = totalStock - lockedStock;
    const totalCapacity = warehouses.reduce((sum, w) => sum + (Number(w.capacity) || 0), 0) || 3300;
    const occupancyPercent = Math.min(100, Math.round((totalStock / totalCapacity) * 100));

    // Expiring Batches (within 7 days)
    const today = new Date();
    const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringItems = inventory.filter(item => {
      if (!item.expiryDate) return false;
      const exp = new Date(item.expiryDate);
      return exp >= today && exp <= next7Days;
    });
    const expiringStockQty = expiringItems.reduce((sum, i) => sum + i.qty, 0);

    return {
      totalStock,
      lockedStock,
      availableStock,
      totalCapacity,
      occupancyPercent,
      expiringBatchesCount: expiringItems.length,
      expiringStockQty
    };
  }, [inventory, warehouses]);

  // =========================================================================
  // 3. COMPUTED VENDOR PROCUREMENT METRICS
  // =========================================================================
  const vendorProcurementMetrics = useMemo(() => {
    let totalPoExpected = 0;
    let totalPoReceived = 0;

    purchaseOrders.forEach(po => {
      po.items?.forEach(it => {
        totalPoExpected += Number(it.expectedQty) || 0;
        totalPoReceived += Number(it.receivedQty) || 0;
      });
    });

    const pendingInward = Math.max(0, totalPoExpected - totalPoReceived);
    const vendorFulfillmentRate = totalPoExpected > 0 ? Math.round((totalPoReceived / totalPoExpected) * 100) : 100;

    return {
      totalPoExpected,
      totalPoReceived,
      pendingInward,
      vendorFulfillmentRate,
      totalPOs: purchaseOrders.length
    };
  }, [purchaseOrders]);

  // =========================================================================
  // 4. PRODUCT-WISE MIS MATRIX
  // =========================================================================
  const productWiseData = useMemo(() => {
    return products.map(prod => {
      // Calculate Demand across Sales Orders
      let demandQty = 0;
      let dispatchedQty = 0;

      salesOrders.forEach(so => {
        const item = so.items?.find(it => it.productId === prod.id);
        if (item) {
          const q = Number(item.qty) || 0;
          demandQty += q;
          if (so.status === 'Delivered' || so.status === 'Dispatched') {
            dispatchedQty += q;
          } else if (so.status === 'Picking' || so.status === 'Packed') {
            dispatchedQty += Math.round(q * 0.5);
          }
        }
      });

      // Current on-hand stock
      const stockItems = inventory.filter(i => i.productId === prod.id);
      const onHandStock = stockItems.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
      const lockedStock = stockItems.filter(i => i.locked).reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
      const availableStock = onHandStock - lockedStock;

      const shortfallQty = Math.max(0, demandQty - dispatchedQty);
      const fillRate = demandQty > 0 ? Math.round((dispatchedQty / demandQty) * 100) : 100;
      const deficit = shortfallQty > availableStock ? (shortfallQty - availableStock) : 0;

      // Status indicator
      let stockHealth = 'Optimal';
      let healthBadge = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';

      if (availableStock === 0 && demandQty > 0) {
        stockHealth = 'Stockout Risk';
        healthBadge = 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border-rose-200 dark:border-rose-800/40';
      } else if (deficit > 0) {
        stockHealth = 'Shortfall Alert';
        healthBadge = 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border-rose-200 dark:border-rose-800/40';
      } else if (availableStock < prod.minQty) {
        stockHealth = 'Low Stock';
        healthBadge = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
      }

      return {
        id: prod.id,
        code: prod.code,
        description: prod.description,
        category: prod.category,
        uom: prod.uom,
        tempRequired: prod.tempRequired,
        demandQty,
        dispatchedQty,
        shortfallQty,
        onHandStock,
        availableStock,
        lockedStock,
        deficit,
        fillRate,
        stockHealth,
        healthBadge,
        minQty: prod.minQty
      };
    }).filter(p => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, salesOrders, inventory, selectedCategory, searchQuery]);

  // =========================================================================
  // 5. ZONE-WISE STORAGE & OCCUPANCY MIS
  // =========================================================================
  const zoneWiseData = useMemo(() => {
    // Group locations by zone / warehouse
    const zoneGroups = [
      {
        zoneId: 'ZONE-A',
        name: 'Zone A - Cold Storage (Main)',
        tempRange: '2-4°C',
        facility: 'Jamnagar Main Hub (WH-01)',
        type: 'Cold Storage',
        nominalCapacity: 1200,
        rackPrefix: 'A'
      },
      {
        zoneId: 'ZONE-B',
        name: 'Zone B - Ambient Storage (Bulk)',
        tempRange: '15-20°C',
        facility: 'Jamnagar Main Hub (WH-01)',
        type: 'Ambient',
        nominalCapacity: 1500,
        rackPrefix: 'B'
      },
      {
        zoneId: 'ZONE-C',
        name: 'Zone C - Deep Freeze & Controlled Atmosphere',
        tempRange: '0-2°C',
        facility: 'Ahmedabad Cold Facility (WH-02)',
        type: 'Cold Storage',
        nominalCapacity: 800,
        rackPrefix: 'C'
      },
      {
        zoneId: 'ZONE-D',
        name: 'Zone D - Dry Produce Hub',
        tempRange: 'Ambient',
        facility: 'Rajkot Dry Hub (WH-03)',
        type: 'Ambient',
        nominalCapacity: 1000,
        rackPrefix: 'D'
      }
    ];

    return zoneGroups.map(zg => {
      // Find matching locations
      const matchingLocs = locations.filter(l => l.rack === zg.rackPrefix || l.code.startsWith(zg.rackPrefix));
      const totalBins = matchingLocs.length || 4;
      const occupiedBins = matchingLocs.filter(l => l.status === 'Locked' || inventory.some(i => i.locationCode === l.code)).length || 2;

      // Find stock in this zone
      const stockInZone = inventory.filter(i => i.locationCode && i.locationCode.startsWith(zg.rackPrefix));
      const totalQty = stockInZone.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
      const lockedQty = stockInZone.filter(i => i.locked).reduce((sum, i) => sum + (Number(i.qty) || 0), 0);

      // Temperature sensor reading from cold rooms
      const matchingColdRoom = coldRooms.find(cr => cr.name.toLowerCase().includes(zg.type.toLowerCase()) || (zg.rackPrefix === 'A' && cr.id === 'CR-1') || (zg.rackPrefix === 'C' && cr.id === 'CR-3'));
      const currentTemp = matchingColdRoom ? `${matchingColdRoom.currentTemp}°C` : (zg.type === 'Ambient' ? '18.2°C' : '2.8°C');
      const tempStatus = matchingColdRoom?.status === 'Alert' ? 'Alert' : 'Normal';

      const occupancyPercent = Math.min(100, Math.round((totalQty / zg.nominalCapacity) * 100));

      return {
        ...zg,
        totalBins,
        occupiedBins,
        availableBins: totalBins - occupiedBins,
        totalQty,
        lockedQty,
        availableQty: totalQty - lockedQty,
        currentTemp,
        tempStatus,
        occupancyPercent,
        activeBatches: stockInZone.length
      };
    }).filter(z => {
      if (selectedWarehouse === 'ALL') return true;
      return z.facility.toLowerCase().includes(selectedWarehouse.toLowerCase());
    });
  }, [locations, inventory, coldRooms, selectedWarehouse]);

  // =========================================================================
  // 6. VENDOR-WISE PROCUREMENT & INWARD FULFILLMENT MIS
  // =========================================================================
  const vendorWiseData = useMemo(() => {
    return vendors.map(v => {
      const vendorPOs = purchaseOrders.filter(po => po.vendorId === v.id || po.vendorId === v.code);
      let expectedQty = 0;
      let receivedQty = 0;

      vendorPOs.forEach(po => {
        po.items?.forEach(it => {
          expectedQty += Number(it.expectedQty) || 0;
          receivedQty += Number(it.receivedQty) || 0;
        });
      });

      const shortfallQty = Math.max(0, expectedQty - receivedQty);
      const fulfillmentRate = expectedQty > 0 ? Math.round((receivedQty / expectedQty) * 100) : 100;
      
      // Reliability & Rating classification
      let ratingTier = 'Tier 1 Preferred';
      let ratingBadge = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
      if (fulfillmentRate < 70) {
        ratingTier = 'Under Review';
        ratingBadge = 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border-rose-200 dark:border-rose-800/40';
      } else if (fulfillmentRate < 90) {
        ratingTier = 'Standard Supplier';
        ratingBadge = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
      }

      return {
        id: v.id,
        code: v.code,
        name: v.name,
        city: v.city || 'Gujarat',
        contact: v.contact,
        email: v.email,
        totalPOs: vendorPOs.length,
        expectedQty,
        receivedQty,
        shortfallQty,
        fulfillmentRate,
        ratingTier,
        ratingBadge
      };
    }).filter(v => {
      const q = searchQuery.toLowerCase().trim();
      return !q || v.name.toLowerCase().includes(q) || v.code.toLowerCase().includes(q) || v.city.toLowerCase().includes(q);
    });
  }, [vendors, purchaseOrders, searchQuery]);

  // =========================================================================
  // 7. ORDER-BY-ORDER SHORTFALL & DISPATCH LEDGER
  // =========================================================================
  const orderLedgerData = useMemo(() => {
    return salesOrders.map(so => {
      const cust = customers.find(c => c.id === so.customerId);
      const totalReq = so.items?.reduce((sum, it) => sum + (Number(it.qty) || 0), 0) || 0;
      let totalDispatched = 0;

      if (so.status === 'Delivered' || so.status === 'Dispatched') {
        totalDispatched = totalReq;
      } else if (so.status === 'Picking' || so.status === 'Packed') {
        totalDispatched = Math.round(totalReq * 0.5);
      }

      const shortfall = Math.max(0, totalReq - totalDispatched);
      const fulfillmentPct = totalReq > 0 ? Math.round((totalDispatched / totalReq) * 100) : 100;

      // Item breakdown list
      const itemDetails = so.items?.map(it => {
        const prod = products.find(p => p.id === it.productId);
        return {
          productId: it.productId,
          productName: prod?.description || it.productId,
          productCode: prod?.code || '',
          qty: it.qty
        };
      }) || [];

      return {
        id: so.id,
        orderNo: so.orderNo,
        date: so.date,
        customerName: cust?.name || 'Retail Client',
        customerCity: cust?.city || 'Gujarat',
        priority: so.priority || 'Normal',
        status: so.status,
        totalReq,
        totalDispatched,
        shortfall,
        fulfillmentPct,
        itemDetails,
        dispatchDetails: so.dispatchDetails
      };
    }).filter(o => {
      const q = searchQuery.toLowerCase().trim();
      return !q || o.orderNo.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.status.toLowerCase().includes(q);
    });
  }, [salesOrders, customers, products, searchQuery]);

  // =========================================================================
  // CSV EXPORT GENERATOR
  // =========================================================================
  const handleExportMIS = () => {
    let exportRows = [];
    let filename = `mis_report_${activeSection}_${Date.now()}.csv`;

    if (activeSection === 'product_wise') {
      exportRows = productWiseData.map(p => ({
        SKU: p.code,
        Description: p.description,
        Category: p.category,
        UOM: p.uom,
        'Demand (Req Qty)': p.demandQty,
        'Dispatched Qty': p.dispatchedQty,
        'Shortfall Qty': p.shortfallQty,
        'On-Hand Stock': p.onHandStock,
        'Available Stock': p.availableStock,
        'Fill Rate %': `${p.fillRate}%`,
        'Stock Health': p.stockHealth
      }));
    } else if (activeSection === 'zone_wise') {
      exportRows = zoneWiseData.map(z => ({
        Zone: z.name,
        Facility: z.facility,
        Type: z.type,
        'Capacity (KG)': z.nominalCapacity,
        'Current Stock (KG)': z.totalQty,
        'Occupancy %': `${z.occupancyPercent}%`,
        'Temp Zone': z.tempRange,
        'Sensor Temp': z.currentTemp,
        'Sensor Status': z.tempStatus
      }));
    } else if (activeSection === 'vendor_wise') {
      exportRows = vendorWiseData.map(v => ({
        'Vendor Code': v.code,
        'Vendor Name': v.name,
        City: v.city,
        'Total POs': v.totalPOs,
        'Expected Inward Qty': v.expectedQty,
        'Received Qty': v.receivedQty,
        'Shortfall Qty': v.shortfallQty,
        'Fulfillment Rate %': `${v.fulfillmentRate}%`,
        'Rating Tier': v.ratingTier
      }));
    } else {
      exportRows = orderLedgerData.map(o => ({
        'Order No': o.orderNo,
        Date: o.date,
        Customer: o.customerName,
        City: o.customerCity,
        Priority: o.priority,
        Status: o.status,
        'Req Qty': o.totalReq,
        'Dispatched Qty': o.totalDispatched,
        'Shortfall Qty': o.shortfall,
        'Fulfillment %': `${o.fulfillmentPct}%`
      }));
    }

    if (exportRows.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = Object.keys(exportRows[0]);
    const csvContent = [
      headers.join(','),
      ...exportRows.map(row =>
        headers.map(h => {
          const val = row[h] !== undefined && row[h] !== null ? row[h].toString() : '';
          return val.includes(',') ? `"${val}"` : val;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-in fade-in-50 duration-200">
      
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-zinc-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLiveActive(!isLiveActive)}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5 hover:bg-emerald-500/30 transition-colors"
              title={isLiveActive ? "Click to Pause Live Telemetry" : "Click to Resume Live Telemetry"}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'}`} />
              <span>{isLiveActive ? 'Live Telemetry Active' : 'Telemetry Paused'}</span>
            </button>
            <span className="text-[11px] text-zinc-400 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Last Synced: {lastSyncTime}
            </span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            Enterprise MIS Intelligence Dashboard
          </h1>
          <p className="text-xs text-zinc-300 font-light max-w-2xl">
            Real-time multi-dimensional tracking of Customer Demand, Outward Dispatches, Fulfillment Shortfalls, SKU Balances, Storage Zones, and Vendor Procurement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={() => {
              setLastSyncTime(new Date().toLocaleTimeString());
              setPulseCount(prev => prev + 1);
            }}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur-md transition-all active:scale-95"
            title="Manual sync"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLiveActive ? 'animate-spin-once' : ''}`} />
            <span>Refresh Data</span>
          </button>

          <button
            onClick={handleExportMIS}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow transition-all active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export MIS Dataset</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 PRIMARY EXECUTIVE KPI CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Order Requirement */}
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Order Demand
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-extrabold text-zinc-900 dark:text-white font-mono">
                {orderMetrics.totalReqQty.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-zinc-400">units / crates</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>{orderMetrics.totalOrdersCount} active sales orders in wave</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-blue-100 dark:bg-blue-950/50 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full w-full" />
          </div>
        </div>

        {/* Card 2: Total Dispatched Volume */}
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Dispatched
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
              <Truck className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {orderMetrics.totalDispatchedQty.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-zinc-400">units / crates</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{orderMetrics.fulfillmentRate}% Customer Fill Rate</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${orderMetrics.fulfillmentRate}%` }} />
          </div>
        </div>

        {/* Card 3: Net Order Shortfall */}
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Pending Shortfall
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                {orderMetrics.shortfallQty.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-zinc-400">units deficit</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span>{orderMetrics.shortfallRate}% Unfulfilled / Backlog</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-rose-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, orderMetrics.shortfallRate)}%` }} />
          </div>
        </div>

        {/* Card 4: Warehouse Stock vs Inward POs */}
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Storage & Inward Status
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                {inventoryMetrics.totalStock.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-zinc-400">on-hand ({inventoryMetrics.occupancyPercent}% cap)</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-1">
              <span>Pending Inward: <strong className="text-zinc-800 dark:text-zinc-200">{vendorProcurementMetrics.pendingInward}</strong></span>
              <span>Available: <strong className="text-emerald-600">{inventoryMetrics.availableStock}</strong></span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${inventoryMetrics.occupancyPercent}%` }} />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE NAVIGATION TABS & TOOLBAR */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
        
        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-150 dark:border-zinc-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            
            <button
              onClick={() => setActiveSection('executive')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSection === 'executive'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Executive Overview</span>
            </button>

            <button
              onClick={() => setActiveSection('product_wise')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSection === 'product_wise'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Box className="h-4 w-4" />
              <span>Product-Wise Demand & Shortfall ({productWiseData.length})</span>
            </button>

            <button
              onClick={() => setActiveSection('zone_wise')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSection === 'zone_wise'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Zone & Storage Analytics ({zoneWiseData.length})</span>
            </button>

            <button
              onClick={() => setActiveSection('vendor_wise')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSection === 'vendor_wise'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Vendor Procurement & Fulfillment ({vendorWiseData.length})</span>
            </button>

            <button
              onClick={() => setActiveSection('order_ledger')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSection === 'order_ledger'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Order Req vs Dispatch Ledger ({orderLedgerData.length})</span>
            </button>

          </div>

          {/* Time range selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-400 text-[11px] font-semibold uppercase">Range:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Available Records</option>
              <option value="today">Today's Shift</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Current Month</option>
            </select>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across SKUs, orders, customers, vendors, zones..."
              className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>Category: {cat}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="ALL">All Hubs & Facilities</option>
              <option value="Jamnagar">Jamnagar Main Hub</option>
              <option value="Ahmedabad">Ahmedabad Cold Facility</option>
              <option value="Rajkot">Rajkot Dry Hub</option>
            </select>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {/* ========================================================================= */}
      {activeSection === 'executive' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Visual Progress Breakdown: Demand vs Dispatched vs Shortfall */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Fulfillment Velocity Breakdown */}
            <div className="lg:col-span-7 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Order Fulfillment & Shortfall Variance
                  </h3>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {orderMetrics.fulfillmentRate}% Fill Rate
                </span>
              </div>

              {/* Progress Stack Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400">Dispatched: {orderMetrics.totalDispatchedQty} ({orderMetrics.fulfillmentRate}%)</span>
                  <span className="text-rose-600 dark:text-rose-400">Shortfall: {orderMetrics.shortfallQty} ({orderMetrics.shortfallRate}%)</span>
                </div>
                <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${orderMetrics.fulfillmentRate}%` }} />
                  <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${orderMetrics.shortfallRate}%` }} />
                </div>
              </div>

              {/* Order Status Cards */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 text-center">
                  <span className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Fulfilled Orders</span>
                  <span className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200 font-mono">{orderMetrics.fulfilledOrdersCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 text-center">
                  <span className="block text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">In Picking Wave</span>
                  <span className="text-xl font-extrabold text-amber-900 dark:text-amber-200 font-mono">{orderMetrics.partialOrdersCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 text-center">
                  <span className="block text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">Pending Inward</span>
                  <span className="text-xl font-extrabold text-rose-900 dark:text-rose-200 font-mono">{orderMetrics.pendingOrdersCount}</span>
                </div>
              </div>

              {/* Quick Summary Highlights */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Customer Demand Volume:</span>
                  <strong className="text-zinc-900 dark:text-zinc-100">{orderMetrics.totalReqQty} units across {salesOrders.length} Sales Orders</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Warehouse In-Stock Balance:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">{inventoryMetrics.availableStock} available ({inventoryMetrics.lockedStock} locked in QC)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Vendor Inward Purchase Pipeline:</span>
                  <strong className="text-purple-600 dark:text-purple-400">{vendorProcurementMetrics.pendingInward} units expected across {purchaseOrders.length} POs</strong>
                </div>
              </div>
            </div>

            {/* Right: Storage & Cold Chain Telemetry */}
            <div className="lg:col-span-5 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-teal-600" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Live Cold Storage Sensor Telemetry
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Online
                </span>
              </div>

              <div className="space-y-3">
                {coldRooms.map(cr => (
                  <div
                    key={cr.id}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">{cr.name}</span>
                      <span className="text-[10px] text-zinc-400 font-light">Target Range: {cr.minTemp}°C to {cr.maxTemp}°C</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-base font-extrabold font-mono block ${cr.status === 'Alert' ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
                        {cr.currentTemp}°C
                      </span>
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        cr.status === 'Alert' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {cr.status === 'Alert' ? 'Temp Breach' : 'Optimal'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Quick Snapshot Matrix */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Box className="h-4 w-4 text-emerald-600" />
                Product Demand vs Stock Deficit Snapshot
              </h3>
              <button
                onClick={() => setActiveSection('product_wise')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>View Full SKU Matrix</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500">
                    <th className="p-3">Product / SKU</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Customer Demand</th>
                    <th className="p-3 text-right">Dispatched</th>
                    <th className="p-3 text-right">Shortfall</th>
                    <th className="p-3 text-right">Available Stock</th>
                    <th className="p-3 text-center">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {productWiseData.slice(0, 5).map(prod => (
                    <tr key={prod.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                      <td className="p-3">
                        <span className="font-bold text-zinc-900 dark:text-white block">{prod.description}</span>
                        <span className="font-mono text-[10px] text-zinc-400">{prod.code} • {prod.uom}</span>
                      </td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-400">{prod.category}</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-600">{prod.demandQty}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600">{prod.dispatchedQty}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600">{prod.shortfallQty}</td>
                      <td className="p-3 text-right font-mono font-bold text-purple-600">{prod.availableStock}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${prod.healthBadge}`}>
                          {prod.stockHealth}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PRODUCT-WISE DEMAND, DISPATCH & SHORTFALL MATRIX */}
      {/* ========================================================================= */}
      {activeSection === 'product_wise' && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Box className="h-5 w-5 text-emerald-600" />
                Product-Wise Demand, Dispatch & Shortfall Matrix
              </h3>
              <span className="text-[11px] text-zinc-400 font-light">
                Granular SKU analysis comparing requested customer demand against warehouse inventory and fulfillment rates
              </span>
            </div>
            <span className="text-xs text-zinc-500 font-semibold">
              Showing {productWiseData.length} Products
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500">
                  <th className="p-3">SKU & Description</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Temp Required</th>
                  <th className="p-3 text-right">Order Req Qty</th>
                  <th className="p-3 text-right">Dispatched Qty</th>
                  <th className="p-3 text-right">Shortfall Qty</th>
                  <th className="p-3 text-right">On-Hand Stock</th>
                  <th className="p-3 text-right">Available Stock</th>
                  <th className="p-3 text-center">Fill Rate %</th>
                  <th className="p-3 text-center">Status / Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {productWiseData.map(prod => (
                  <tr key={prod.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="p-3">
                      <span className="font-bold text-zinc-900 dark:text-white block">{prod.description}</span>
                      <span className="font-mono text-[10px] text-zinc-400">{prod.code} • {prod.uom}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold">
                        {prod.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                      {prod.tempRequired}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {prod.demandQty}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {prod.dispatchedQty}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                      {prod.shortfallQty > 0 ? `-${prod.shortfallQty}` : '0'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-zinc-800 dark:text-zinc-200">
                      {prod.onHandStock}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                      {prod.availableStock}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1 font-mono font-bold text-xs">
                        <span>{prod.fillRate}%</span>
                      </div>
                      <div className="w-16 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mt-0.5 overflow-hidden">
                        <div
                          className={`h-full ${prod.fillRate >= 80 ? 'bg-emerald-500' : prod.fillRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${prod.fillRate}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${prod.healthBadge}`}>
                        {prod.stockHealth}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ZONE-WISE & STORAGE ANALYTICS */}
      {/* ========================================================================= */}
      {activeSection === 'zone_wise' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Zone Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {zoneWiseData.map(zone => (
              <div
                key={zone.zoneId}
                className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">{zone.zoneId}</span>
                      <span className="text-[10px] text-zinc-400">{zone.facility.split('(')[0]}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    zone.tempStatus === 'Alert' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {zone.currentTemp}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{zone.name}</h4>
                  <span className="text-[10px] text-zinc-400">Target: {zone.tempRange} • {zone.type}</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Occupancy:</span>
                    <strong className="font-mono text-zinc-900 dark:text-white">{zone.totalQty} / {zone.nominalCapacity} KG</strong>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        zone.occupancyPercent > 85 ? 'bg-rose-500' : zone.occupancyPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${zone.occupancyPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>{zone.occupancyPercent}% Utilized</span>
                    <span>{zone.occupiedBins} of {zone.totalBins} Bins in Use</span>
                  </div>
                </div>

                <div className="border-t border-zinc-150 dark:border-zinc-800 pt-2 flex justify-between text-[11px] text-zinc-500">
                  <span>Available Stock: <strong className="text-emerald-600">{zone.availableQty} KG</strong></span>
                  <span>Active Batches: <strong className="text-zinc-700 dark:text-zinc-300">{zone.activeBatches}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Zone Table */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-teal-600" />
              Zone Capacity & Environmental Control Breakdown
            </h3>

            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500">
                    <th className="p-3">Zone Code & Name</th>
                    <th className="p-3">Warehouse Hub</th>
                    <th className="p-3">Storage Type</th>
                    <th className="p-3">Temp Range</th>
                    <th className="p-3 text-center">Live Sensor</th>
                    <th className="p-3 text-right">Occupancy (KG)</th>
                    <th className="p-3 text-right">Max Capacity</th>
                    <th className="p-3 text-center">Utilization</th>
                    <th className="p-3 text-center">Bin Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {zoneWiseData.map(zone => (
                    <tr key={zone.zoneId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                      <td className="p-3 font-bold text-zinc-900 dark:text-white">
                        {zone.name}
                      </td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-400">{zone.facility}</td>
                      <td className="p-3">{zone.type}</td>
                      <td className="p-3 font-mono">{zone.tempRange}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          zone.tempStatus === 'Alert' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {zone.currentTemp} ({zone.tempStatus})
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-zinc-900 dark:text-white">
                        {zone.totalQty} KG
                      </td>
                      <td className="p-3 text-right font-mono text-zinc-500">
                        {zone.nominalCapacity} KG
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-mono font-bold">{zone.occupancyPercent}%</span>
                      </td>
                      <td className="p-3 text-center text-[11px] text-zinc-500">
                        {zone.occupiedBins} occupied / {zone.availableBins} open
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: VENDOR-WISE PROCUREMENT & FULFILLMENT MIS */}
      {/* ========================================================================= */}
      {activeSection === 'vendor_wise' && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                Vendor-Wise Procurement & Inward Fulfillment Analytics
              </h3>
              <span className="text-[11px] text-zinc-400 font-light">
                Monitoring supplier delivery reliability, purchase order fulfillment rates, and pending inbound volumes
              </span>
            </div>
            <span className="text-xs text-zinc-500 font-semibold">
              {vendorWiseData.length} Registered Vendors
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500">
                  <th className="p-3">Vendor Name & Code</th>
                  <th className="p-3">City / Hub</th>
                  <th className="p-3 text-center">Total POs</th>
                  <th className="p-3 text-right">Expected Inward</th>
                  <th className="p-3 text-right">Received via GRN</th>
                  <th className="p-3 text-right">Pending / Shortfall</th>
                  <th className="p-3 text-center">Fulfillment Rate</th>
                  <th className="p-3 text-center">Supplier Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {vendorWiseData.map(v => (
                  <tr key={v.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="p-3">
                      <span className="font-bold text-zinc-900 dark:text-white block">{v.name}</span>
                      <span className="font-mono text-[10px] text-zinc-400">{v.code} • {v.contact}</span>
                    </td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-400">{v.city}</td>
                    <td className="p-3 text-center font-mono font-semibold">{v.totalPOs}</td>
                    <td className="p-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {v.expectedQty}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {v.receivedQty}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {v.shortfallQty > 0 ? `-${v.shortfallQty}` : '0'}
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-mono font-bold">{v.fulfillmentRate}%</span>
                      <div className="w-16 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mt-0.5 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${v.fulfillmentRate}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${v.ratingBadge}`}>
                        {v.ratingTier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ORDER REQ VS DISPATCH & SHORTFALL LEDGER */}
      {/* ========================================================================= */}
      {activeSection === 'order_ledger' && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                Live Sales Order Request vs. Dispatch & Shortfall Ledger
              </h3>
              <span className="text-[11px] text-zinc-400 font-light">
                Complete order-by-order audit showing requested item demand, fulfilled shipments, vehicle dispatches, and outstanding shortfalls
              </span>
            </div>
            <span className="text-xs text-zinc-500 font-semibold">
              {orderLedgerData.length} Orders
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500">
                  <th className="p-3">Order No & Date</th>
                  <th className="p-3">Customer & Destination</th>
                  <th className="p-3">Items Ordered</th>
                  <th className="p-3 text-right">Req Qty</th>
                  <th className="p-3 text-right">Dispatched Qty</th>
                  <th className="p-3 text-right">Shortfall Qty</th>
                  <th className="p-3 text-center">Fulfillment Status</th>
                  <th className="p-3">Dispatch Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {orderLedgerData.map(order => (
                  <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="p-3">
                      <span className="font-mono font-bold text-zinc-900 dark:text-white block">{order.orderNo}</span>
                      <span className="text-[10px] text-zinc-400">{order.date}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">{order.customerName}</span>
                      <span className="text-[10px] text-zinc-400">{order.customerCity}</span>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        {order.itemDetails.map((it, idx) => (
                          <div key={idx} className="text-[11px] text-zinc-600 dark:text-zinc-300">
                            • {it.productName} ({it.qty})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {order.totalReq}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {order.totalDispatched}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                      {order.shortfall > 0 ? `-${order.shortfall}` : '0'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        order.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200'
                          : order.status === 'Picking'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border border-blue-200'
                      }`}>
                        {order.status} ({order.fulfillmentPct}%)
                      </span>
                    </td>
                    <td className="p-3 text-xs text-zinc-500">
                      {order.dispatchDetails ? (
                        <div>
                          <span className="block font-mono text-[10px] text-zinc-700 dark:text-zinc-300">
                            {order.dispatchDetails.vehicleNo}
                          </span>
                          <span className="text-[9px] text-zinc-400">
                            {order.dispatchDetails.driverName} • {order.dispatchDetails.invoiceNo}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic text-[10px]">Awaiting Dispatch</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}
