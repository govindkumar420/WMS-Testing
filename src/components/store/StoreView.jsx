import React, { useContext, useState, useMemo } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import {
  Layers,
  RefreshCw,
  Sliders,
  CheckCircle,
  TrendingDown,
  Search,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

export default function StoreView() {
  const {
    inventory,
    setInventory,
    locations,
    products,
    executeInventoryMovement,
    logAction,
    auditLogs
  } = useContext(WmsDataContext);

  const context = useContext(WmsDataContext);
  const { activeTabs, setActiveTabs } = context;
  const activeTab = activeTabs.store || 'inventory';
  const setActiveTab = (tab) => {
    setActiveTabs(prev => ({ ...prev, store: tab }));
  };
  
  // Stock Transfer states
  const [transferItemId, setTransferItemId] = useState('');
  const [targetLocCode, setTargetLocCode] = useState('');

  // Stock Adjustment states
  const [adjustItemId, setAdjustItemId] = useState('');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Shrinkage (Water Loss)');

  // Cycle Count states
  const [physicalBinCode, setPhysicalBinCode] = useState('');
  const [actualQtyFound, setActualQtyFound] = useState('');

  // Dynamic stock calculations
  const totalStock = useMemo(() => inventory.reduce((sum, item) => sum + item.qty, 0), [inventory]);
  const stockByStatus = useMemo(() => {
    let avail = 0, reserved = 0, damaged = 0, quarantine = 0;
    inventory.forEach(item => {
      if (item.status === 'Available') avail += item.qty;
      else if (item.status === 'Reserved') reserved += item.qty;
      else if (item.status === 'Damaged') damaged += item.qty;
      else quarantine += item.qty;
    });
    return { avail, reserved, damaged, quarantine };
  }, [inventory]);

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!transferItemId || !targetLocCode) {
      alert('Please select both Item and Target Bin.');
      return;
    }

    const item = inventory.find(i => i.id === transferItemId);
    if (!item) return;

    executeInventoryMovement(item.id, item.locationCode, targetLocCode, item.qty, 'operator_user');
    alert(`Transfer complete. Moved ${item.qty} units to ${targetLocCode}.`);
    
    setTransferItemId('');
    setTargetLocCode('');
  };

  const handleAdjustmentSubmit = (e) => {
    e.preventDefault();
    if (!adjustItemId || !adjustQty) {
      alert('Please select Item and Adjustment Quantity.');
      return;
    }

    const qtyVal = Number(adjustQty);
    const updated = inventory.map(item => {
      if (item.id === adjustItemId) {
        const finalQty = Math.max(0, item.qty + qtyVal);
        logAction(`Manual Stock Adjustment (${adjustReason}) on batch ${item.batchNo}: changed by ${qtyVal}`, 'Inventory', 'Success');
        return { ...item, qty: finalQty };
      }
      return item;
    });

    setInventory(updated);
    localStorage.setItem('wms_inventory', JSON.stringify(updated));
    alert('Inventory quantity adjusted successfully.');
    
    setAdjustItemId('');
    setAdjustQty('');
  };

  const handleCycleCountSubmit = (e) => {
    e.preventDefault();
    if (!physicalBinCode || !actualQtyFound) {
      alert('Please specify bin code and actual physical count.');
      return;
    }

    const matchedItems = inventory.filter(i => i.locationCode === physicalBinCode);
    const systemQty = matchedItems.reduce((sum, item) => sum + item.qty, 0);
    const diff = Number(actualQtyFound) - systemQty;

    logAction(`Cycle Count Mismatch Reconciled for Bin ${physicalBinCode}: System Qty: ${systemQty}, Physical Qty: ${actualQtyFound}, Mismatch: ${diff}`, 'Inventory', 'Success');
    alert(`Cycle Count recorded. Mismatch discrepancy of ${diff} units logged for audit trails.`);
    
    setPhysicalBinCode('');
    setActualQtyFound('');
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6 animate-in fade-in-50 duration-200">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Store & Inventory Control</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Manage bin storage layout relocation movements, physical count cycle audits, and water loss shrinkage adjustments.</p>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-1 overflow-x-auto pb-px">
        {[
          { id: 'inventory', label: 'Live Stock Metrics', icon: Layers },
          { id: 'transfer', label: 'Bin Stock Transfer', icon: RefreshCw },
          { id: 'adjustment', label: 'Stock Adjustment', icon: Sliders },
          { id: 'cycle_count', label: 'Cycle Count Audits', icon: CheckCircle }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Panel */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden p-6 min-h-[500px]">
        
        {/* TAB 1: Live Stock */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl p-4">
                <span className="block text-[9px] font-bold text-zinc-400 uppercase">Available Stock</span>
                <span className="text-xl font-black text-emerald-600 mt-1 block">{stockByStatus.avail} units</span>
              </div>
              <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl p-4">
                <span className="block text-[9px] font-bold text-zinc-400 uppercase">Reserved (Outbound)</span>
                <span className="text-xl font-black text-blue-600 mt-1 block">{stockByStatus.reserved} units</span>
              </div>
              <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl p-4">
                <span className="block text-[9px] font-bold text-zinc-400 uppercase">Damaged Stock</span>
                <span className="text-xl font-black text-rose-500 mt-1 block">{stockByStatus.damaged} units</span>
              </div>
              <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl p-4">
                <span className="block text-[9px] font-bold text-zinc-400 uppercase">Quarantine / QA hold</span>
                <span className="text-xl font-black text-amber-500 mt-1 block">{stockByStatus.quarantine} units</span>
              </div>
            </div>

            {/* Inventory table */}
            <div className="overflow-x-auto border border-zinc-205 dark:border-zinc-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500">
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3">Bin Code</th>
                    <th className="p-3">Expiry Date (FEFO)</th>
                    <th className="p-3">Crates Count</th>
                    <th className="p-3">Qty Count</th>
                    <th className="p-3">QA Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {inventory.map(item => {
                    const prod = products.find(p => p.id === item.productId);
                    return (
                      <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300">
                        <td className="p-3 font-mono font-bold text-zinc-900 dark:text-white">{prod?.code}</td>
                        <td className="p-3 font-semibold">{prod?.description}</td>
                        <td className="p-3 font-mono">{item.batchNo}</td>
                        <td className="p-3 font-mono font-bold text-emerald-600">{item.locationCode}</td>
                        <td className="p-3 font-mono text-rose-500 font-bold">{item.expiryDate}</td>
                        <td className="p-3 font-semibold">{Math.ceil(item.qty / 20)} Crates</td>
                        <td className="p-3 font-bold font-mono">{item.qty} units</td>
                        <td className="p-3 font-semibold">{item.grade || 'Grade A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Stock Transfer */}
        {activeTab === 'transfer' && (
          <div className="max-w-md space-y-4 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-zinc-50/30 dark:bg-zinc-900/10 animate-in fade-in-50 duration-200">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Bin-to-Bin Stock Transfer</h3>
              <span className="text-[10px] text-zinc-400">Relocate approved batches between warehouse racks and cold chain zones.</span>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-505 mb-1">Select Batch Item</label>
                <select required value={transferItemId} onChange={(e) => setTransferItemId(e.target.value)} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                  <option value="">-- Choose Stock Batch --</option>
                  {inventory.filter(i => i.locationCode !== 'Stage Area').map(item => (
                    <option key={item.id} value={item.id}>
                      {products.find(p => p.id === item.productId)?.description} ({item.batchNo} at {item.locationCode} - Qty: {item.qty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-505 mb-1">Target Location Bin</label>
                <select required value={targetLocCode} onChange={(e) => setTargetLocCode(e.target.value)} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                  <option value="">-- Select Destination Bin --</option>
                  {locations.map(l => <option key={l.id} value={l.code}>{l.code} ({l.type} - {l.status})</option>)}
                </select>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs shadow-sm">Execute Stock Relocation</button>
            </form>
          </div>
        )}

        {/* TAB 3: Stock Adjustment */}
        {activeTab === 'adjustment' && (
          <div className="max-w-md space-y-4 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-zinc-50/30 dark:bg-zinc-900/10 animate-in fade-in-50 duration-200">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Log Stock Adjustment</h3>
              <span className="text-[10px] text-zinc-400">Record stock shrinkage, physical weight losses, or damaged scrap write-offs.</span>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-505 mb-1">Select Batch Item</label>
                <select required value={adjustItemId} onChange={(e) => setAdjustItemId(e.target.value)} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                  <option value="">-- Choose Stock Batch --</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {products.find(p => p.id === item.productId)?.description} ({item.batchNo} - Current Qty: {item.qty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-505 mb-1">Adjustment Qty (Negative to subtract)</label>
                  <input type="number" required value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} placeholder="e.g. -5 or 10" className="w-full bg-transparent border border-zinc-205 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-505 mb-1">Adjustment Reason</label>
                  <select value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs">
                    <option>Shrinkage (Water Loss)</option>
                    <option>Decay Scrap Disposal</option>
                    <option>Physical Count Mismatch</option>
                    <option>Quality Demotion</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-xs shadow-sm">Log Quantity Adjustment</button>
            </form>
          </div>
        )}

        {/* TAB 4: Cycle Count */}
        {activeTab === 'cycle_count' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in-50 duration-200">
            
            {/* Form */}
            <div className="lg:col-span-5 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-zinc-50/30 dark:bg-zinc-900/10 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Record Cycle Audit</h3>
                <span className="text-[10px] text-zinc-400">Record a physical audit check of a rack bin to verify count mismatches.</span>
              </div>

              <form onSubmit={handleCycleCountSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-505 mb-1">Select Storage Bin</label>
                  <select required value={physicalBinCode} onChange={(e) => setPhysicalBinCode(e.target.value)} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                    <option value="">-- Choose Bin --</option>
                    {locations.map(loc => <option key={loc.id} value={loc.code}>{loc.code}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-505 mb-1">Actual Physical Quantity Found</label>
                  <input type="number" required value={actualQtyFound} onChange={(e) => setActualQtyFound(e.target.value)} placeholder="Physical units count" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                </div>

                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs shadow-sm">Log Audit Mismatch Check</button>
              </form>
            </div>

            {/* Reconciliation Logs */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-bold text-zinc-808 dark:text-zinc-200">Reconciliation Activity Log</h3>
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3 font-mono text-[10px] text-zinc-400">
                {auditLogs.filter(log => log.action.includes('Cycle Count') || log.action.includes('Adjustment')).slice(0, 5).map(log => (
                  <div key={log.id} className="border-b border-zinc-200 dark:border-zinc-850 pb-2">
                    <div className="flex justify-between font-bold text-zinc-750 dark:text-zinc-300">
                      <span>{log.action}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <span className="block mt-1 text-[9px]">Operator: {log.username} ({log.role}) | Status: {log.status}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
