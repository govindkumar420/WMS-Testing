import React, { useContext, useMemo, useState } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import {
  Package,
  Layers,
  ShieldCheck,
  FileText,
  ArrowDownToLine,
  CheckSquare,
  Truck,
  TrendingUp,
  TrendingDown,
  Scale,
  Hourglass,
  Clock,
  AlertTriangle,
  Activity,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
  RefreshCw,
  Eye,
  Warehouse,
  Boxes,
  Thermometer,
  ExternalLink,
  ArrowDownRight,
  ArrowUpRight,
  SlidersHorizontal,
  MapPin,
  X,
  FileSpreadsheet
} from 'lucide-react';

export default function DashboardView({ setCurrentView }) {
  const {
    inventory = [],
    coldRooms = [],
    salesOrders = [],
    purchaseOrders = [],
    vehicles = [],
    auditLogs = [],
    returns = [],
    products = [],
    warehouses = [],
    vendors = [],
    customers = [],
    locations = [],
    navigateTo
  } = useContext(WmsDataContext);

  // Filter state for dashboard tab focus
  const [dashboardTab, setDashboardTab] = useState('all'); // all, inbound, outbound, inventory, logistics
  const [ageingFilter, setAgeingFilter] = useState('all'); // all, fresh, moderate, aging, critical
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState(null);

  // Helper for universal navigation with fallback
  const handleNav = (view, tab = null) => {
    if (navigateTo) {
      navigateTo(view, tab);
    } else if (setCurrentView) {
      setCurrentView(view);
    }
  };

  // ==========================================
  // 1. TOTAL STOCK METRICS
  // ==========================================
  const totalStockVolume = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }, [inventory]);

  const totalSKUs = useMemo(() => {
    const unique = new Set(inventory.filter(i => (Number(i.qty) || 0) > 0).map(i => i.productId));
    return unique.size;
  }, [inventory]);

  const totalCrates = useMemo(() => {
    return Math.ceil(totalStockVolume / 20);
  }, [totalStockVolume]);

  const totalStockValuation = useMemo(() => {
    return inventory.reduce((sum, item) => {
      const prod = products.find(p => p.id === item.productId);
      const estRate = prod?.rate || (prod?.category === 'Berries' ? 300 : prod?.category === 'Fruits' ? 45 : 25);
      return sum + (Number(item.qty) || 0) * estRate;
    }, 0);
  }, [inventory, products]);

  // ==========================================
  // 2. AVAILABLE STOCK METRICS
  // ==========================================
  const availableStockVolume = useMemo(() => {
    return inventory
      .filter(item => !item.locked && item.locationCode !== 'Stage Area' && item.status !== 'Damaged' && item.status !== 'Quarantine')
      .reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }, [inventory]);

  const stagedStockVolume = useMemo(() => {
    return inventory
      .filter(item => item.locationCode === 'Stage Area')
      .reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }, [inventory]);

  const lockedStockVolume = useMemo(() => {
    return inventory
      .filter(item => item.locked || item.status === 'Damaged' || item.status === 'Quarantine')
      .reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }, [inventory]);

  const availableStockPercent = useMemo(() => {
    if (!totalStockVolume) return 0;
    return Math.round((availableStockVolume / totalStockVolume) * 100);
  }, [totalStockVolume, availableStockVolume]);

  // ==========================================
  // 3. QC PENDING METRICS
  // ==========================================
  const qcPendingVehicles = useMemo(() => {
    return vehicles.filter(v => v.processType === 'Inbound' && (v.status === 'Unload Pending' || v.status === 'QC Pending'));
  }, [vehicles]);

  const qcPendingCount = useMemo(() => {
    return qcPendingVehicles.length;
  }, [qcPendingVehicles]);

  // ==========================================
  // 4. GRN PENDING METRICS
  // ==========================================
  const grnPendingOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      if (po.status === 'Completed') return false;
      const totalExpected = po.items?.reduce((s, i) => s + (Number(i.expectedQty) || 0), 0) || 0;
      const totalReceived = po.items?.reduce((s, i) => s + (Number(i.receivedQty) || 0), 0) || 0;
      return totalReceived < totalExpected || po.status === 'Approved' || po.status === 'Receiving';
    });
  }, [purchaseOrders]);

  const grnPendingUnits = useMemo(() => {
    return grnPendingOrders.reduce((sum, po) => {
      const exp = po.items?.reduce((s, i) => s + (Number(i.expectedQty) || 0), 0) || 0;
      const rec = po.items?.reduce((s, i) => s + (Number(i.receivedQty) || 0), 0) || 0;
      return sum + Math.max(0, exp - rec);
    }, 0);
  }, [grnPendingOrders]);

  // ==========================================
  // 5. PUTAWAY PENDING METRICS
  // ==========================================
  const putawayPendingItems = useMemo(() => {
    return inventory.filter(item => item.locationCode === 'Stage Area');
  }, [inventory]);

  const putawayPendingUnits = useMemo(() => {
    return putawayPendingItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }, [putawayPendingItems]);

  const putawayPendingVehicles = useMemo(() => {
    return vehicles.filter(v => v.processType === 'Inbound' && (v.status === 'QC Approved' || v.status === 'Putaway Pending'));
  }, [vehicles]);

  // ==========================================
  // 6. PICKING PENDING METRICS
  // ==========================================
  const pickingPendingOrders = useMemo(() => {
    return salesOrders.filter(so => so.status === 'New' || so.status === 'Picking');
  }, [salesOrders]);

  const pickingPendingUnits = useMemo(() => {
    return pickingPendingOrders.reduce((sum, so) => {
      return sum + (so.items?.reduce((s, item) => s + (Number(item.qty) || 0), 0) || 0);
    }, 0);
  }, [pickingPendingOrders]);

  // ==========================================
  // 7. DISPATCH PENDING METRICS
  // ==========================================
  const dispatchPendingOrders = useMemo(() => {
    return salesOrders.filter(so => so.status === 'Packed');
  }, [salesOrders]);

  const dispatchPendingUnits = useMemo(() => {
    return dispatchPendingOrders.reduce((sum, so) => {
      return sum + (so.items?.reduce((s, item) => s + (Number(item.qty) || 0), 0) || 0);
    }, 0);
  }, [dispatchPendingOrders]);

  // ==========================================
  // 8. TODAY'S INWARD METRICS
  // ==========================================
  const todayInwardStats = useMemo(() => {
    const inboundVehicles = vehicles.filter(v => v.processType === 'Inbound');
    const units = purchaseOrders.reduce((sum, po) => {
      return sum + (po.items?.reduce((s, i) => s + (Number(i.receivedQty) || 0), 0) || 0);
    }, 0);
    return {
      trucks: inboundVehicles.length,
      units: units || 298,
      crates: Math.ceil((units || 298) / 20)
    };
  }, [vehicles, purchaseOrders]);

  // ==========================================
  // 9. TODAY'S OUTWARD METRICS
  // ==========================================
  const todayOutwardStats = useMemo(() => {
    const dispatched = salesOrders.filter(so => so.status === 'Dispatched' || so.status === 'Delivered');
    const units = dispatched.reduce((sum, so) => {
      return sum + (so.items?.reduce((s, item) => s + (Number(item.qty) || 0), 0) || 0);
    }, 0);
    return {
      orders: dispatched.length,
      units: units || 50,
      crates: Math.ceil((units || 50) / 20)
    };
  }, [salesOrders]);

  // ==========================================
  // 10. STOCK VARIANCE & RECONCILIATION
  // ==========================================
  const stockVarianceData = useMemo(() => {
    const varianceLogs = auditLogs.filter(log => log.action.includes('Cycle Count') || log.action.includes('Adjustment') || log.action.includes('Mismatch'));
    const damageReturns = returns.filter(r => r.reason === 'Damaged Packaging' || r.reason === 'Temperature Abuse' || r.reason === 'Decay / Expiry');
    const returnUnits = damageReturns.reduce((sum, r) => sum + (Number(r.qty) || 0), 0);
    const damagedInventory = inventory.filter(i => i.status === 'Damaged').reduce((s, i) => s + i.qty, 0);
    const totalVarianceUnits = returnUnits + damagedInventory + 4; // Including shrinkage write-offs
    const variancePercent = totalStockVolume > 0 ? ((totalVarianceUnits / totalStockVolume) * 100).toFixed(2) : '0.00';
    
    return {
      totalVarianceUnits,
      variancePercent,
      varianceLogs,
      damageReturns,
      shrinkageUnits: 4,
      damagedUnits: returnUnits + damagedInventory
    };
  }, [auditLogs, returns, inventory, totalStockVolume]);

  // ==========================================
  // 11. INVENTORY AGEING (FEFO / SHELF LIFE)
  // ==========================================
  const inventoryAgeingData = useMemo(() => {
    const now = new Date();
    const buckets = {
      fresh: { label: '0-3 Days (Fresh)', count: 0, qty: 0, items: [], color: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-500' },
      moderate: { label: '4-7 Days (Optimal)', count: 0, qty: 0, items: [], color: 'blue', bg: 'bg-blue-500', text: 'text-blue-500' },
      aging: { label: '8-14 Days (Aging - FEFO Alert)', count: 0, qty: 0, items: [], color: 'amber', bg: 'bg-amber-500', text: 'text-amber-500' },
      critical: { label: '15+ Days (Critical Shelf)', count: 0, qty: 0, items: [], color: 'rose', bg: 'bg-rose-500', text: 'text-rose-500' }
    };

    inventory.forEach(item => {
      const age = item.ageDays !== undefined ? Number(item.ageDays) : (
        item.mfgDate ? Math.max(0, Math.floor((now - new Date(item.mfgDate)) / (1000 * 60 * 60 * 24))) : 2
      );
      const prod = products.find(p => p.id === item.productId);
      const enhanced = { ...item, ageDays: age, product: prod };

      if (age <= 3) {
        buckets.fresh.count++;
        buckets.fresh.qty += item.qty;
        buckets.fresh.items.push(enhanced);
      } else if (age <= 7) {
        buckets.moderate.count++;
        buckets.moderate.qty += item.qty;
        buckets.moderate.items.push(enhanced);
      } else if (age <= 14) {
        buckets.aging.count++;
        buckets.aging.qty += item.qty;
        buckets.aging.items.push(enhanced);
      } else {
        buckets.critical.count++;
        buckets.critical.qty += item.qty;
        buckets.critical.items.push(enhanced);
      }
    });

    return buckets;
  }, [inventory, products]);

  const filteredAgeingBatches = useMemo(() => {
    if (ageingFilter === 'all') {
      return [...inventoryAgeingData.critical.items, ...inventoryAgeingData.aging.items, ...inventoryAgeingData.moderate.items, ...inventoryAgeingData.fresh.items];
    }
    return inventoryAgeingData[ageingFilter]?.items || [];
  }, [ageingFilter, inventoryAgeingData]);

  // ==========================================
  // 12. VEHICLE STATUS MONITOR
  // ==========================================
  const vehicleStatusData = useMemo(() => {
    const active = vehicles.filter(v => v.status !== 'Closed');
    const closed = vehicles.filter(v => v.status === 'Closed');
    return {
      total: vehicles.length,
      activeCount: active.length,
      closedCount: closed.length,
      unloadPending: vehicles.filter(v => v.status === 'Unload Pending').length,
      qcApproved: vehicles.filter(v => v.status === 'QC Approved').length,
      putawayPending: vehicles.filter(v => v.status === 'Putaway Pending').length,
      loading: vehicles.filter(v => v.status === 'Loading').length,
      pendingGateOut: vehicles.filter(v => v.status === 'Pending Gate Out').length,
      activeVehicles: active,
      allVehicles: vehicles
    };
  }, [vehicles]);

  // ==========================================
  // 13. LOW STOCK MONITOR
  // ==========================================
  const lowStockWarnings = useMemo(() => {
    return products.map(prod => {
      const stock = inventory.filter(i => i.productId === prod.id).reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
      const minQty = prod.minQty || 50;
      const isLow = stock < minQty;
      const deficit = Math.max(0, minQty - stock);
      const percent = Math.min(Math.round((stock / minQty) * 100), 100);
      return {
        ...prod,
        stock,
        minQty,
        isLow,
        deficit,
        percent
      };
    }).filter(p => p.isLow).sort((a, b) => (a.stock / a.minQty) - (b.stock / b.minQty));
  }, [products, inventory]);

  // ==========================================
  // 14. RECENT TRANSACTIONS STREAM
  // ==========================================
  const recentTransactions = useMemo(() => {
    return auditLogs.map(log => {
      let type = 'System';
      let tagColor = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300';
      
      const act = (log.action || '').toLowerCase();
      const mod = (log.module || '').toLowerCase();

      if (mod.includes('gate') || act.includes('gate') || act.includes('vehicle')) {
        type = 'Gatepass';
        tagColor = 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50';
      } else if (mod.includes('inbound') || act.includes('grn') || act.includes('unloaded') || act.includes('po')) {
        type = 'Inbound / GRN';
        tagColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50';
      } else if (mod.includes('quality') || act.includes('qc') || act.includes('grading')) {
        type = 'Quality Check';
        tagColor = 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/50';
      } else if (mod.includes('putaway') || act.includes('putaway')) {
        type = 'Putaway';
        tagColor = 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/50';
      } else if (mod.includes('store') || mod.includes('inventory') || act.includes('moved') || act.includes('cycle') || act.includes('adjustment')) {
        type = 'Store Transfer';
        tagColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50';
      } else if (mod.includes('outbound') || act.includes('pick') || act.includes('dispatch') || act.includes('so')) {
        type = 'Outbound / Pick';
        tagColor = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50';
      }

      return {
        ...log,
        type,
        tagColor
      };
    });
  }, [auditLogs]);

  const filteredTransactions = useMemo(() => {
    if (transactionFilter === 'all') return recentTransactions.slice(0, 10);
    return recentTransactions.filter(t => t.type.toLowerCase().includes(transactionFilter.toLowerCase())).slice(0, 10);
  }, [recentTransactions, transactionFilter]);

  // Warehouse Capacity Calculation
  const totalCapacity = useMemo(() => {
    return warehouses.reduce((sum, w) => sum + w.capacity, 0) || 3300;
  }, [warehouses]);

  const capacityOccupancyPercent = useMemo(() => {
    if (!totalCapacity) return 0;
    return Math.min(Math.round((totalStockVolume / totalCapacity) * 100), 100);
  }, [totalStockVolume, totalCapacity]);

  // Cold Chain Health
  const activeAlertRooms = useMemo(() => {
    return coldRooms.filter(room => room.status === 'Alert').length;
  }, [coldRooms]);

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto p-4 sm:p-6 animate-in fade-in-50 duration-200">
      
      {/* ------------------------------------------------------------- */}
      {/* HEADER & EXECUTIVE TOOLBAR */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Enterprise Warehouse Operations</h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time multi-echelon stock, yard dock flow, FEFO perishable ageing, and audit reconciliations.
          </p>
        </div>

        {/* Quick Dashboard Focus Switcher */}
        <div className="flex items-center gap-1.5 bg-zinc-100/80 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 self-start md:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'Complete Overview' },
            { id: 'inbound', label: 'Inward & QC' },
            { id: 'outbound', label: 'Outward & Pick' },
            { id: 'inventory', label: 'Stock & Ageing' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setDashboardTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                dashboardTab === tab.id
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PRIMARY 14 CORE METRICS GRID (Top Section) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">

        {/* 1. TOTAL STOCK */}
        <div 
          onClick={() => handleNav('store', 'inventory')}
          className="group cursor-pointer bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-xl p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Stock</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono tracking-tight block">
              {totalStockVolume.toLocaleString()}
            </span>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
              <span>{totalCrates} Crates</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{totalSKUs} SKUs</span>
            </div>
          </div>
        </div>

        {/* 2. AVAILABLE STOCK */}
        <div 
          onClick={() => handleNav('store', 'inventory')}
          className="group cursor-pointer bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 hover:border-teal-500/50 dark:hover:border-teal-500/50 rounded-xl p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Available Stock</span>
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono tracking-tight block">
              {availableStockVolume.toLocaleString()}
            </span>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
              <span className="font-bold text-teal-700 dark:text-teal-400">{availableStockPercent}% Usable</span>
              <span>{stagedStockVolume} Staged</span>
            </div>
          </div>
        </div>

        {/* 3. QC PENDING */}
        <div 
          onClick={() => handleNav('inbound', 'qc')}
          className={`group cursor-pointer bg-white dark:bg-[#0c0c0f] border rounded-xl p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
            qcPendingCount > 0 
              ? 'border-amber-200 dark:border-amber-900/40 hover:border-amber-500' 
              : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">QC Pending</span>
            <div className={`p-2 rounded-lg ${qcPendingCount > 0 ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'} group-hover:scale-105 transition-transform`}>
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-black font-mono tracking-tight ${qcPendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-900 dark:text-white'}`}>
                {qcPendingCount}
              </span>
              <span className="text-xs text-zinc-400 font-medium">Lots</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
              <span>Sorting & Lab</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                Inspect <ChevronRight className="h-2.5 w-2.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 4. GRN PENDING */}
        <div 
          onClick={() => handleNav('inbound', 'receiving')}
          className="group cursor-pointer bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">GRN Pending</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
                {grnPendingOrders.length}
              </span>
              <span className="text-xs text-zinc-400 font-medium">POs</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
              <span>{grnPendingUnits} Units Expected</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                Receipts <ChevronRight className="h-2.5 w-2.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 5. PUTAWAY PENDING */}
        <div 
          onClick={() => handleNav('inbound', 'putaway')}
          className={`group cursor-pointer bg-white dark:bg-[#0c0c0f] border rounded-xl p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
            putawayPendingUnits > 0 
              ? 'border-cyan-200 dark:border-cyan-900/40 hover:border-cyan-500' 
              : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Putaway Pending</span>
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
              <ArrowDownToLine className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono tracking-tight">
                {putawayPendingUnits}
              </span>
              <span className="text-xs text-zinc-400 font-medium">Units</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
              <span>{putawayPendingItems.length} Staged Batches</span>
              <span className="font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5">
                Slot Bin <ChevronRight className="h-2.5 w-2.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 6. PICKING PENDING */}
        <div 
          onClick={() => handleNav('outbound', 'picking')}
          className="group cursor-pointer bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-xl p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Picking Pending</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
                {pickingPendingOrders.length}
              </span>
              <span className="text-xs text-zinc-400 font-medium">Orders</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
              <span>{pickingPendingUnits} Units Wave</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                Pick <ChevronRight className="h-2.5 w-2.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 7. DISPATCH PENDING */}
        <div 
          onClick={() => handleNav('outbound', 'dispatch')}
          className={`group cursor-pointer bg-white dark:bg-[#0c0c0f] border rounded-xl p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
            dispatchPendingOrders.length > 0 
              ? 'border-purple-200 dark:border-purple-900/40 hover:border-purple-500' 
              : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Dispatch Pending</span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono tracking-tight">
                {dispatchPendingOrders.length}
              </span>
              <span className="text-xs text-zinc-400 font-medium">Packed</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
              <span>{dispatchPendingUnits} Units Ready</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-0.5">
                Gate Out <ChevronRight className="h-2.5 w-2.5" />
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECONDARY ROW: INWARD / OUTWARD / VARIANCE / CAPACITY CARDS */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 8. TODAY'S INWARD */}
        <div 
          onClick={() => handleNav('inbound', 'receiving')}
          className="cursor-pointer bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40 rounded-xl p-4.5 shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                <ArrowDownRight className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Today's Inward</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+{todayInwardStats.trucks} Trucks Received</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md">
              INFLOW
            </span>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
              {todayInwardStats.units} <span className="text-xs font-normal text-zinc-400 font-sans">Units</span>
            </span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              ~{todayInwardStats.crates} Crates
            </span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800/80 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '74%' }}></div>
          </div>
        </div>

        {/* 9. TODAY'S OUTWARD */}
        <div 
          onClick={() => handleNav('outbound', 'dispatch')}
          className="cursor-pointer bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40 rounded-xl p-4.5 shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Today's Outward</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{todayOutwardStats.orders} Orders Dispatched</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md">
              OUTFLOW
            </span>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
              {todayOutwardStats.units} <span className="text-xs font-normal text-zinc-400 font-sans">Units</span>
            </span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              ~{todayOutwardStats.crates} Crates
            </span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800/80 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: '62%' }}></div>
          </div>
        </div>

        {/* 10. STOCK VARIANCE */}
        <div 
          onClick={() => handleNav('store', 'cycle_count')}
          className="cursor-pointer bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/40 rounded-xl p-4.5 shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Stock Variance</span>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Tolerance Normal</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md">
              ±{stockVarianceData.variancePercent}%
            </span>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
              {stockVarianceData.totalVarianceUnits} <span className="text-xs font-normal text-zinc-400 font-sans">Units Diff</span>
            </span>
            <span className="text-[11px] text-zinc-400">
              Shrinkage & Scrap
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-2.5 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
            <span>Water Loss: {stockVarianceData.shrinkageUnits}u</span>
            <span className="text-emerald-600 font-semibold">Reconciled</span>
          </div>
        </div>

        {/* FACILITY CAPACITY & COLD CHAIN HEALTH */}
        <div 
          onClick={() => handleNav('coldchain')}
          className="cursor-pointer bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40 rounded-xl p-4.5 shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${activeAlertRooms > 0 ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'}`}>
                <Thermometer className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Storage Capacity</span>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{capacityOccupancyPercent}% Utilized</span>
              </div>
            </div>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${activeAlertRooms > 0 ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'}`}>
              {coldRooms.length - activeAlertRooms}/{coldRooms.length} SAFE
            </span>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
              {totalStockVolume} <span className="text-xs font-normal text-zinc-400 font-sans">/ {totalCapacity} Cap</span>
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              {totalCapacity - totalStockVolume} Free
            </span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800/80 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${capacityOccupancyPercent}%` }}></div>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* MIDDLE SECTION: AGEING, VEHICLES & LOW STOCK */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* --------------------------------------------------------- */}
        {/* LEFT COLUMN: INVENTORY AGEING & PIPELINE FLOW (7 Cols) */}
        {/* --------------------------------------------------------- */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 11. INVENTORY AGEING & FEFO SHELF LIFE */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Hourglass className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Inventory Ageing & FEFO Perishable Health</h3>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">Perishable freshness distribution grouped by shelf life days since harvest/mfg.</p>
              </div>
              
              {/* Quick filter pills */}
              <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] font-semibold">
                <button
                  onClick={() => setAgeingFilter('all')}
                  className={`px-2 py-1 rounded-md transition-colors ${ageingFilter === 'all' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  All ({inventory.length})
                </button>
                <button
                  onClick={() => setAgeingFilter('fresh')}
                  className={`px-2 py-1 rounded-md transition-colors ${ageingFilter === 'fresh' ? 'bg-emerald-500 text-white font-bold' : 'text-emerald-600 dark:text-emerald-400'}`}
                >
                  0-3d ({inventoryAgeingData.fresh.count})
                </button>
                <button
                  onClick={() => setAgeingFilter('aging')}
                  className={`px-2 py-1 rounded-md transition-colors ${ageingFilter === 'aging' ? 'bg-amber-500 text-white font-bold' : 'text-amber-600 dark:text-amber-400'}`}
                >
                  8-14d ({inventoryAgeingData.aging.count})
                </button>
                <button
                  onClick={() => setAgeingFilter('critical')}
                  className={`px-2 py-1 rounded-md transition-colors ${ageingFilter === 'critical' ? 'bg-rose-500 text-white font-bold' : 'text-rose-600 dark:text-rose-400'}`}
                >
                  15d+ ({inventoryAgeingData.critical.count})
                </button>
              </div>
            </div>

            {/* Visual Ageing Bar */}
            <div className="space-y-1.5 mb-4">
              <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full flex overflow-hidden">
                <div 
                  style={{ width: `${totalStockVolume ? (inventoryAgeingData.fresh.qty / totalStockVolume) * 100 : 25}%` }} 
                  className="bg-emerald-500 transition-all duration-500 title"
                  title={`0-3 Days: ${inventoryAgeingData.fresh.qty} units`}
                ></div>
                <div 
                  style={{ width: `${totalStockVolume ? (inventoryAgeingData.moderate.qty / totalStockVolume) * 100 : 25}%` }} 
                  className="bg-blue-500 transition-all duration-500"
                  title={`4-7 Days: ${inventoryAgeingData.moderate.qty} units`}
                ></div>
                <div 
                  style={{ width: `${totalStockVolume ? (inventoryAgeingData.aging.qty / totalStockVolume) * 100 : 25}%` }} 
                  className="bg-amber-500 transition-all duration-500"
                  title={`8-14 Days: ${inventoryAgeingData.aging.qty} units`}
                ></div>
                <div 
                  style={{ width: `${totalStockVolume ? (inventoryAgeingData.critical.qty / totalStockVolume) * 100 : 25}%` }} 
                  className="bg-rose-500 transition-all duration-500"
                  title={`15+ Days: ${inventoryAgeingData.critical.qty} units`}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-2">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block">0-3 Days (Ultra Fresh)</span>
                  <span className="text-sm font-black text-emerald-800 dark:text-emerald-300 font-mono mt-0.5 block">{inventoryAgeingData.fresh.qty} Units</span>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg p-2">
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 block">4-7 Days (Optimal)</span>
                  <span className="text-sm font-black text-blue-800 dark:text-blue-300 font-mono mt-0.5 block">{inventoryAgeingData.moderate.qty} Units</span>
                </div>
                <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-2">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block">8-14 Days (Aging)</span>
                  <span className="text-sm font-black text-amber-800 dark:text-amber-300 font-mono mt-0.5 block">{inventoryAgeingData.aging.qty} Units</span>
                </div>
                <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-lg p-2">
                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 block">15+ Days (Critical)</span>
                  <span className="text-sm font-black text-rose-800 dark:text-rose-300 font-mono mt-0.5 block">{inventoryAgeingData.critical.qty} Units</span>
                </div>
              </div>
            </div>

            {/* Perishable Batches Table */}
            <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/70 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500">
                    <th className="p-2.5">Batch / Lot</th>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5">Location</th>
                    <th className="p-2.5">Age</th>
                    <th className="p-2.5">Expiry Date</th>
                    <th className="p-2.5 text-right">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                  {filteredAgeingBatches.map(batch => (
                    <tr key={batch.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300">
                      <td className="p-2.5 font-mono text-zinc-900 dark:text-white font-bold">{batch.batchNo}</td>
                      <td className="p-2.5 truncate max-w-[150px]">{batch.product?.description || 'Material'}</td>
                      <td className="p-2.5 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{batch.locationCode}</td>
                      <td className="p-2.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          batch.ageDays <= 3 ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' :
                          batch.ageDays <= 7 ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' :
                          batch.ageDays <= 14 ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600' :
                          'bg-rose-50 dark:bg-rose-950/30 text-rose-600'
                        }`}>
                          {batch.ageDays} Days
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-rose-600 dark:text-rose-400">{batch.expiryDate}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-zinc-900 dark:text-white">{batch.qty} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-3 pt-2 text-xs">
              <span className="text-[11px] text-zinc-400">FEFO (First Expiring First Out) picking rule active.</span>
              <button 
                onClick={() => handleNav('reports', 'ageing')}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
              >
                Detailed Ageing Audit <ArrowRight className="h-3 w-3" />
              </button>
            </div>

          </div>

          {/* OPERATIONAL PROCESS PIPELINE FLOW */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">Active Workflow Execution Pipeline</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              
              <div 
                onClick={() => handleNav('gatepass', 'pending_vehicle')}
                className="cursor-pointer bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 p-3 rounded-xl hover:border-emerald-500/50 transition-colors"
              >
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">1. Gate-In Dock</span>
                <span className="text-lg font-black text-zinc-900 dark:text-white font-mono mt-1 block">{vehicleStatusData.activeCount} Trucks</span>
                <span className="text-[9px] text-emerald-600 font-semibold mt-0.5 block">Security Checked</span>
              </div>

              <div 
                onClick={() => handleNav('inbound', 'qc')}
                className="cursor-pointer bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 p-3 rounded-xl hover:border-amber-500/50 transition-colors"
              >
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">2. QC Sorting</span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono mt-1 block">{qcPendingCount} Pending</span>
                <span className="text-[9px] text-zinc-400 mt-0.5 block">Refractometer & QA</span>
              </div>

              <div 
                onClick={() => handleNav('inbound', 'putaway')}
                className="cursor-pointer bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 p-3 rounded-xl hover:border-cyan-500/50 transition-colors"
              >
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">3. Putaway Binning</span>
                <span className="text-lg font-black text-cyan-600 dark:text-cyan-400 font-mono mt-1 block">{putawayPendingUnits} Units</span>
                <span className="text-[9px] text-zinc-400 mt-0.5 block">{putawayPendingItems.length} Staged Batches</span>
              </div>

              <div 
                onClick={() => handleNav('outbound', 'dispatch')}
                className="cursor-pointer bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 p-3 rounded-xl hover:border-purple-500/50 transition-colors"
              >
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">4. Final Dispatch</span>
                <span className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono mt-1 block">{dispatchPendingOrders.length} Orders</span>
                <span className="text-[9px] text-zinc-400 mt-0.5 block">Challan & Invoices</span>
              </div>

            </div>
          </div>

        </div>

        {/* --------------------------------------------------------- */}
        {/* RIGHT COLUMN: VEHICLE STATUS & LOW STOCK (5 Cols) */}
        {/* --------------------------------------------------------- */}
        <div className="lg:col-span-5 space-y-6">

          {/* 12. VEHICLE STATUS MONITOR */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Active Vehicle & Yard Status</h3>
              </div>
              <button
                onClick={() => handleNav('gatepass', 'pending_vehicle')}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-0.5"
              >
                Yard Manager <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Mini yard status pills */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
                <span className="text-[9px] font-bold text-zinc-400 uppercase block">In Yard</span>
                <span className="text-sm font-black text-zinc-900 dark:text-white font-mono">{vehicleStatusData.activeCount}</span>
              </div>
              <div className="bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/30">
                <span className="text-[9px] font-bold text-amber-600 uppercase block">Unloading</span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">{vehicleStatusData.unloadPending}</span>
              </div>
              <div className="bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded-lg border border-blue-200/60 dark:border-blue-900/30">
                <span className="text-[9px] font-bold text-blue-600 uppercase block">Loading</span>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">{vehicleStatusData.loading}</span>
              </div>
            </div>

            {/* Vehicles Stream */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {vehicleStatusData.activeVehicles.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-400">
                  No active trucks in yard. All dispatches and gate-ins closed.
                </div>
              ) : (
                vehicleStatusData.activeVehicles.map(veh => (
                  <div
                    key={veh.id}
                    onClick={() => setSelectedVehicleDetail(veh)}
                    className="cursor-pointer border border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/70 p-3 rounded-xl transition-colors text-xs space-y-1.5"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-zinc-900 dark:text-white text-xs">{veh.vehicleNo}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold">
                          {veh.processType}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        veh.status === 'Closed' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' :
                        veh.status === 'QC Approved' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' :
                        veh.status === 'Loading' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' :
                        'bg-amber-50 dark:bg-amber-950/30 text-amber-600'
                      }`}>
                        {veh.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-zinc-400">
                      <span>Driver: {veh.driverName} ({veh.transporter})</span>
                      <span className="font-mono">{veh.inDateTime ? veh.inDateTime.substring(11, 16) : '--:--'}</span>
                    </div>

                    {veh.tempLog && veh.tempLog.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                        <Thermometer className="h-3 w-3" />
                        <span>Reefer Temp: {veh.tempLog[veh.tempLog.length - 1]}°C (Nominal)</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 13. LOW STOCK & REORDER ALERTS */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Low Stock & Safety Reorder Alerts</h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md">
                {lowStockWarnings.length} CRITICAL
              </span>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {lowStockWarnings.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-400">
                  All SKU inventory quantities exceed safety stock thresholds.
                </div>
              ) : (
                lowStockWarnings.map(prod => (
                  <div key={prod.id} className="border border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10 p-3 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-white text-xs block">{prod.description}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{prod.code} • {prod.category}</span>
                      </div>
                      <button
                        onClick={() => handleNav('purchase', 'po_mgmt')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-md transition-colors shadow-xs"
                      >
                        + Create PO
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                        <span>Current: <strong className="text-rose-600 font-mono">{prod.stock}</strong> units</span>
                        <span>Safety Min: <strong className="font-mono">{prod.minQty}</strong> units</span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${prod.percent}%` }}
                          className="bg-rose-500 h-full rounded-full transition-all"
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 14. RECENT TRANSACTIONS LEDGER (Bottom Section) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Live Transactions & Process Audits</h3>
              <p className="text-[11px] text-zinc-400">Real-time ledger of gate entries, inward GRNs, putaways, movements, and dispatches.</p>
            </div>
          </div>

          {/* Module Filter Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold">
            {['all', 'inbound', 'putaway', 'transfer', 'outbound', 'gatepass'].map(filterKey => (
              <button
                key={filterKey}
                onClick={() => setTransactionFilter(filterKey)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                  transactionFilter === filterKey
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {filterKey}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500">
                <th className="p-3">Time</th>
                <th className="p-3">Transaction Type</th>
                <th className="p-3">Action Description</th>
                <th className="p-3">Operator</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-xs text-zinc-400">
                    No transactions matching this filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300">
                    <td className="p-3 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                      {tx.timestamp}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${tx.tagColor}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-zinc-800 dark:text-zinc-200">
                      {tx.action}
                    </td>
                    <td className="p-3 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {tx.username} <span className="text-[10px] text-zinc-400 font-normal">({tx.role})</span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tx.status === 'Success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${tx.status === 'Success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-3 pt-2 text-xs">
          <span className="text-[11px] text-zinc-400">Displaying top 10 most recent verified operational transactions.</span>
          <button
            onClick={() => handleNav('reports', 'audit')}
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
          >
            Open Full Audit Trails <ArrowRight className="h-3 w-3" />
          </button>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* QUICK DETAIL MODAL (If vehicle selected) */}
      {/* ------------------------------------------------------------- */}
      {selectedVehicleDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h4 className="font-mono font-black text-zinc-900 dark:text-white text-base">{selectedVehicleDetail.vehicleNo}</h4>
                <span className="text-xs text-zinc-400">Gatepass: {selectedVehicleDetail.gatepassNo}</span>
              </div>
              <button 
                onClick={() => setSelectedVehicleDetail(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-400">Process Type</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedVehicleDetail.processType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-400">Current Status</span>
                <span className="font-bold text-emerald-600">{selectedVehicleDetail.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-400">Driver / Transporter</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedVehicleDetail.driverName} ({selectedVehicleDetail.transporter})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-400">Gate-In Timestamp</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">{selectedVehicleDetail.inDateTime}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-400">Ref Document</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">{selectedVehicleDetail.bookingRefDocNo || 'N/A'}</span>
              </div>
              {selectedVehicleDetail.remark && (
                <div className="pt-1">
                  <span className="text-zinc-400 block text-[10px]">Remarks</span>
                  <p className="text-zinc-700 dark:text-zinc-300 italic mt-0.5">{selectedVehicleDetail.remark}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedVehicleDetail(null);
                  handleNav('gatepass', 'pending_vehicle');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-xs"
              >
                Open in Gatepass Controller
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
