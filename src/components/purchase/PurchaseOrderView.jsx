import React, { useContext, useState, useMemo } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import {
  FileText,
  Plus,
  Search,
  TrendingUp,
  CheckCircle,
  Clock,
  ShieldAlert,
  Printer,
  X,
  ArrowRight,
  ClipboardCheck,
  Tag
} from 'lucide-react';

export default function PurchaseOrderView() {
  const {
    purchaseOrders,
    setPurchaseOrders,
    vendors,
    products,
    activeTabs,
    setActiveTabs,
    logAction
  } = useContext(WmsDataContext);

  const activeTab = activeTabs.purchase || 'po_mgmt';
  const setActiveTab = (tab) => {
    setActiveTabs(prev => ({ ...prev, purchase: tab }));
  };

  // State for PO creation drawer
  const [poDrawerOpen, setPoDrawerOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [poItems, setPoItems] = useState([{ productId: '', expectedQty: 100, rate: 150 }]);
  const [poSearchQuery, setPoSearchQuery] = useState('');

  // State for rate adjustment
  const [rateProductId, setRateProductId] = useState('');
  const [rateVendorId, setRateVendorId] = useState('');
  const [newRate, setNewRate] = useState('');

  // State for challan preview
  const [selectedChallanPo, setSelectedChallanPo] = useState('');

  // Stats calculation
  const stats = useMemo(() => {
    const total = purchaseOrders.length;
    const completed = purchaseOrders.filter(po => po.status === 'Completed').length;
    const active = purchaseOrders.filter(po => po.status === 'Receiving' || po.status === 'Approved').length;
    const pendingValue = purchaseOrders.reduce((sum, po) => {
      if (po.status !== 'Completed') {
        return sum + po.items.reduce((itemSum, item) => itemSum + ((item.expectedQty - (item.receivedQty || 0)) * item.rate), 0);
      }
      return sum;
    }, 0);
    return { total, completed, active, pendingValue };
  }, [purchaseOrders]);

  // Filtered PO list
  const filteredPOs = useMemo(() => {
    const query = poSearchQuery.toLowerCase();
    return purchaseOrders.filter(po => {
      const vendorName = vendors.find(v => v.id === po.vendorId)?.name || '';
      return po.poNo.toLowerCase().includes(query) || vendorName.toLowerCase().includes(query);
    });
  }, [purchaseOrders, poSearchQuery, vendors]);

  const addPoItem = () => {
    setPoItems([...poItems, { productId: '', expectedQty: 100, rate: 150 }]);
  };

  const removePoItem = (index) => {
    setPoItems(poItems.filter((_, idx) => idx !== index));
  };

  const handlePoItemChange = (index, field, value) => {
    setPoItems(poItems.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          [field]: field === 'productId' ? value : Number(value)
        };
      }
      return item;
    }));
  };

  const handleCreatePOSubmit = (e) => {
    e.preventDefault();
    const validItems = poItems.filter(i => i.productId !== '' && i.expectedQty > 0);
    if (validItems.length === 0) {
      alert('Please add at least one product with valid quantity.');
      return;
    }

    const newPO = {
      id: `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
      poNo: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      vendorId: selectedVendor || (vendors[0] ? vendors[0].id : 'V-001'),
      date: new Date().toISOString().split('T')[0],
      status: 'Approved',
      items: validItems.map(item => ({
        productId: item.productId,
        expectedQty: Number(item.expectedQty),
        receivedQty: 0,
        rate: Number(item.rate) || 150
      }))
    };

    setPurchaseOrders([newPO, ...purchaseOrders]);
    logAction(`Created Purchase Order: ${newPO.poNo}`, 'Purchase Order', 'Success');
    alert(`Purchase Order ${newPO.poNo} created successfully!`);

    // Reset state
    setPoDrawerOpen(false);
    setSelectedVendor('');
    setPoItems([{ productId: '', expectedQty: 100, rate: 150 }]);
  };

  const handleUpdateRate = (e) => {
    e.preventDefault();
    if (!rateProductId || !newRate) {
      alert('Please select a product and enter a rate.');
      return;
    }
    logAction(`Updated purchase rate for ${rateProductId} to ₹${newRate}`, 'Purchase Order');
    alert('Purchase rate master updated successfully!');
    setRateProductId('');
    setRateVendorId('');
    setNewRate('');
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6 animate-in fade-in-50 duration-200">

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Purchase Operations</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Manage vendor supply contracts, procurement schedules, goods receipt invoicing, and costing sheets.</p>
        </div>

        {activeTab === 'po_mgmt' && (
          <button
            onClick={() => setPoDrawerOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 text-xs transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create New PO</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-1 overflow-x-auto pb-px no-print">
        {[
          { id: 'po_mgmt', label: 'Purchase Order Mgmt', icon: FileText },
          { id: 'po_material_receiving', label: 'PO Material - Receiving Report', icon: ClipboardCheck },
          { id: 'supplier_material_rate', label: 'Supplier Material Rate Master', icon: Tag },
          { id: 'update_purchase_rate', label: 'Update Purchase Rate', icon: TrendingUp },
          { id: 'vendor_challan', label: 'Vendor Challan Preview', icon: Printer }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${isActive
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

      {/* Main Workspace */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden p-6 min-h-[500px]">

        {/* TAB 1: PO Management */}
        {activeTab === 'po_mgmt' && (
          <div className="space-y-6">

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-250/60 dark:border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total POs</span>
                <span className="text-2xl font-black block mt-1 text-zinc-900 dark:text-white font-mono">{stats.total}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-250/60 dark:border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Completed POs</span>
                <span className="text-2xl font-black block text-emerald-600 mt-1 font-mono">{stats.completed}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-250/60 dark:border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Active POs</span>
                <span className="text-2xl font-black block text-amber-600 mt-1 font-mono">{stats.active}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-250/60 dark:border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Pending Value</span>
                <span className="text-2xl font-black block text-zinc-800 dark:text-zinc-100 mt-1 font-mono">₹{stats.pendingValue.toLocaleString()}</span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by PO number or supplier name..."
                  value={poSearchQuery}
                  onChange={(e) => setPoSearchQuery(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* PO List Table */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold">
                  <tr>
                    <th className="p-3">PO Number</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Creation Date</th>
                    <th className="p-3 text-right">Items / Expected Qty</th>
                    <th className="p-3 text-right">Estimated Cost</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                  {filteredPOs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-zinc-400">No purchase orders found.</td>
                    </tr>
                  ) : (
                    filteredPOs.map(po => {
                      const vendor = vendors.find(v => v.id === po.vendorId);
                      const totalCost = po.items.reduce((s, i) => s + (i.expectedQty * i.rate), 0);
                      const totalExpected = po.items.reduce((s, i) => s + Number(i.expectedQty), 0);
                      const totalReceived = po.items.reduce((s, i) => s + (Number(i.receivedQty) || 0), 0);

                      return (
                        <tr key={po.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                          <td className="p-3 font-mono font-bold text-emerald-600">{po.poNo}</td>
                          <td className="p-3">
                            <span className="font-semibold block">{vendor?.name || 'Unknown'}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">{vendor?.code} • {vendor?.city}</span>
                          </td>
                          <td className="p-3 font-mono">{po.date}</td>
                          <td className="p-3 text-right font-mono font-bold">
                            {totalReceived} / {totalExpected} units <span className="text-[10px] text-zinc-400 font-normal">({po.items.length} SKUs)</span>
                          </td>
                          <td className="p-3 text-right font-mono font-semibold">₹{totalCost.toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${po.status === 'Completed' ? 'bg-emerald-100 text-emerald-850 dark:bg-emerald-950/20 dark:text-emerald-400' :
                                po.status === 'Approved' ? 'bg-sky-100 text-sky-850 dark:bg-sky-955/20 dark:text-sky-400' :
                                  po.status === 'Receiving' ? 'bg-amber-100 text-amber-850 dark:bg-amber-955/20 dark:text-amber-400' :
                                    'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400'
                              }`}>
                              {po.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 2: PO Material Receiving Report */}
        {activeTab === 'po_material_receiving' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold">Purchase Order Inward Reconciliation</h3>
            <span className="text-xs text-zinc-500 block">Compare vendor invoice quantities against warehouse received quantities.</span>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold">
                  <tr>
                    <th className="p-3">PO Link</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3 text-right">Expected Qty</th>
                    <th className="p-3 text-right">Received Qty</th>
                    <th className="p-3 text-right">Discrepancy</th>
                    <th className="p-3 text-center">Reconciliation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                  {purchaseOrders.flatMap(po => {
                    const vendor = vendors.find(v => v.id === po.vendorId);
                    return po.items.map((item, idx) => {
                      const product = products.find(p => p.id === item.productId);
                      const diff = item.expectedQty - (item.receivedQty || 0);
                      return (
                        <tr key={`${po.id}-${idx}`} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                          <td className="p-3 font-mono font-bold text-emerald-600">{po.poNo}</td>
                          <td className="p-3">
                            <span className="font-semibold block">{product?.description || 'Unknown'}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">{product?.code}</span>
                          </td>
                          <td className="p-3">{vendor?.name || 'Unknown'}</td>
                          <td className="p-3 text-right font-mono font-semibold">{item.expectedQty}</td>
                          <td className="p-3 text-right font-mono font-semibold text-emerald-600">{item.receivedQty || 0}</td>
                          <td className={`p-3 text-right font-mono font-bold ${diff > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {diff > 0 ? `-${diff}` : '0'}
                          </td>
                          <td className="p-3 text-center">
                            {diff === 0 ? (
                              <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1"><CheckCircle className="h-3 w-3" /> Fully Matched</span>
                            ) : po.status === 'Completed' ? (
                              <span className="text-[10px] text-rose-600 font-bold flex items-center justify-center gap-1"><ShieldAlert className="h-3 w-3" /> Shortage Closed</span>
                            ) : (
                              <span className="text-[10px] text-amber-500 font-bold flex items-center justify-center gap-1"><Clock className="h-3 w-3" /> Awaiting Balance</span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Supplier Material Rate Master */}
        {activeTab === 'supplier_material_rate' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold">Active Contract Rate Master</h3>
            <span className="text-xs text-zinc-500 block font-normal">Standard billing rates set with suppliers per SKU.</span>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Supplier Code</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">Purchase UOM</th>
                    <th className="p-3 text-right">Standard Contract Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                  {vendors.flatMap(v => {
                    return products.slice(0, 4).map((p, idx) => {
                      const rate = 150 + (p.shelfLifeDays * 5) + (idx * 20);
                      return (
                        <tr key={`${v.id}-${p.id}`} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                          <td className="p-3">
                            <span className="font-semibold block">{p.description}</span>
                            <span className="text-[10px] text-zinc-450 block">{p.code}</span>
                          </td>
                          <td className="p-3 font-mono font-bold text-zinc-500">{v.code}</td>
                          <td className="p-3">{v.name}</td>
                          <td className="p-3 font-mono text-[11px] text-zinc-500">{p.uom}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">₹{rate}</td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Update Purchase Rate */}
        {activeTab === 'update_purchase_rate' && (
          <div className="max-w-xl space-y-6">
            <div>
              <h3 className="text-sm font-bold">Adjust Supplier Pricing Agreements</h3>
              <p className="text-xs text-zinc-500 mt-1">Submit rate changes. These updates apply to new PO creation waves.</p>
            </div>

            <form onSubmit={handleUpdateRate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">Product</label>
                  <select
                    value={rateProductId}
                    onChange={(e) => setRateProductId(e.target.value)}
                    required
                    className="w-full bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Select SKU...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.description} ({p.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">Supplier</label>
                  <select
                    value={rateVendorId}
                    onChange={(e) => setRateVendorId(e.target.value)}
                    required
                    className="w-full bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Select Supplier...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase block">New Contract Rate (₹)</label>
                <input
                  type="number"
                  placeholder="Enter rate per UOM..."
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs transition-colors shadow-md"
              >
                Apply Updated Rate
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: Vendor Challan Preview */}
        {activeTab === 'vendor_challan' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-150 dark:border-zinc-800 pb-4 no-print">
              <div className="space-y-1">
                <h3 className="text-sm font-bold">Gate Entry Challan Dock</h3>
                <p className="text-xs text-zinc-500">Preview generated material gate receipt for vendor trucks arriving at Jamnagar Hub.</p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedChallanPo}
                  onChange={(e) => setSelectedChallanPo(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs"
                >
                  <option value="">Select PO Document...</option>
                  {purchaseOrders.map(p => (
                    <option key={p.id} value={p.poNo}>{p.poNo} - {vendors.find(v => v.id === p.vendorId)?.name}</option>
                  ))}
                </select>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>

            {/* Challan Card */}
            {selectedChallanPo ? (
              <div className="border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#0c0c0f] p-8 rounded-xl max-w-3xl mx-auto shadow-sm space-y-6 text-zinc-900 dark:text-zinc-100">
                <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800 pb-4">
                  <div>
                    <h2 className="text-lg font-black tracking-tight">GNOSIS AGRI WMS - INBOUND DELIVERY CHALLAN</h2>
                    <span className="text-xs text-zinc-500 block">Warehouse Division: Cold Chain Inflow</span>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="font-bold block text-emerald-600">PO: {selectedChallanPo}</span>
                    <span className="text-zinc-400">Date: {new Date().toISOString().split('T')[0]}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-bold text-zinc-400 uppercase text-[9px] block">Vendor / Consignor</span>
                    <span className="font-bold block mt-0.5">
                      {vendors.find(v => v.id === purchaseOrders.find(p => p.poNo === selectedChallanPo)?.vendorId)?.name || 'Direct Vendor'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-zinc-400 uppercase text-[9px] block">Delivery Destination</span>
                    <span className="font-bold block mt-0.5">Jamnagar Main Hub (WH-01)</span>
                  </div>
                </div>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-bold text-zinc-500">
                      <tr>
                        <th className="p-2.5">SKU Code</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 text-right">Expected Qty</th>
                        <th className="p-2.5 text-right">Rate</th>
                        <th className="p-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono">
                      {purchaseOrders.find(p => p.poNo === selectedChallanPo)?.items.map((item, i) => {
                        const prod = products.find(p => p.id === item.productId);
                        return (
                          <tr key={i}>
                            <td className="p-2.5 font-bold">{prod?.code}</td>
                            <td className="p-2.5 font-sans">{prod?.description}</td>
                            <td className="p-2.5 text-right font-bold">{item.expectedQty}</td>
                            <td className="p-2.5 text-right">₹{item.rate}</td>
                            <td className="p-2.5 text-right font-bold">₹{(item.expectedQty * item.rate).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs">
                  <div>
                    <span className="block text-[9px] text-zinc-400 uppercase font-bold">Driver Signature</span>
                    <div className="h-8 border-b border-zinc-300 dark:border-zinc-700"></div>
                  </div>
                  <div>
                    <span className="block text-[9px] text-zinc-400 uppercase font-bold">Security Gate Officer</span>
                    <div className="h-8 border-b border-zinc-300 dark:border-zinc-700"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-xs">
                Select a Purchase Order above to view and print the delivery challan.
              </div>
            )}
          </div>
        )}

      </div>

      {/* CREATE PO MODAL */}
      {poDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-black text-zinc-900 dark:text-white">Create Purchase Order</h3>
                <span className="text-xs text-zinc-400">Initiate procurement contract with approved vendor</span>
              </div>
              <button onClick={() => setPoDrawerOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePOSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Select Supplier Vendor</label>
                <select
                  required
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-semibold"
                >
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Product Line Items</span>
                  <button type="button" onClick={addPoItem} className="text-xs text-emerald-600 font-bold hover:underline">+ Add Line</button>
                </div>

                {poItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 text-xs">
                    <div className="col-span-6">
                      <select
                        required
                        value={item.productId}
                        onChange={(e) => handlePoItemChange(idx, 'productId', e.target.value)}
                        className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-1.5 text-xs"
                      >
                        <option value="">Select SKU...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.description} ({p.uom})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Qty"
                        required
                        value={item.expectedQty}
                        onChange={(e) => handlePoItemChange(idx, 'expectedQty', e.target.value)}
                        className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-1.5 text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Rate ₹"
                        required
                        value={item.rate}
                        onChange={(e) => handlePoItemChange(idx, 'rate', e.target.value)}
                        className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-1.5 text-xs font-mono"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      {poItems.length > 1 && (
                        <button type="button" onClick={() => removePoItem(idx)} className="text-rose-500 font-bold">×</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-xs"
                >
                  Confirm & Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
