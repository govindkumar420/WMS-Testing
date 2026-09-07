import React, { useContext, useState, useMemo } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import { defaultReturns } from '../../utils/mockData';
import {
  ArrowLeftRight,
  CheckSquare,
  Search,
  Plus,
  ClipboardCheck,
  RotateCcw,
  SlidersHorizontal,
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  Boxes,
  Truck,
  DollarSign,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Store,
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function ReturnView() {
  const {
    returns,
    setReturns,
    registerReturn,
    confirmReturnDisposition,
    products,
    vendors,
    customers,
    locations,
    logAction
  } = useContext(WmsDataContext);

  const context = useContext(WmsDataContext);
  const { activeTabs, setActiveTabs } = context;
  const activeTab = activeTabs.return || 'cust_returns';
  const setActiveTab = (tab) => {
    setActiveTabs(prev => ({ ...prev, return: tab }));
  };

  // Top Return View Dropdown Options
  const returnViews = [
    { id: 'cust_returns', label: 'Sales return' },
    { id: 'supplier_returns', label: 'QC return' },
    { id: 'returns_qc', label: 'All QC rejection & return' }
  ];

  // Sales Return Sub-Tabs matching exact user screenshot
  const [salesSubTab, setSalesSubTab] = useState('pending_confirmation');
  const salesSubTabs = [
    { id: 'pending_confirmation', label: 'Return Confirmation Pending' },
    { id: 'return_to_vendor', label: 'Return To Vendor' },
    { id: 'sale_local_market', label: 'Sale To Local Market' },
    { id: 'scrap', label: 'Scrap' },
    { id: 'all_confirmed', label: 'All Confirmed Sales Return' }
  ];

  // Search & Filter states
  const [searchField, setSearchField] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [advanceSearchOpen, setAdvanceSearchOpen] = useState(true);

  // Return Confirmation Modal state
  const [selectedReturnForAction, setSelectedReturnForAction] = useState(null);
  const [dispositionType, setDispositionType] = useState('Return To Vendor'); // 'Return To Vendor' | 'Sale To Local Market' | 'Scrap' | 'Restocked'
  const [confirmedVendorId, setConfirmedVendorId] = useState('');
  const [confirmedDebitNote, setConfirmedDebitNote] = useState('');
  const [confirmedBuyerName, setConfirmedBuyerName] = useState('Jamnagar Mandi Trader');
  const [confirmedRate, setConfirmedRate] = useState('20.00');
  const [confirmedLocalInvoice, setConfirmedLocalInvoice] = useState('');
  const [confirmedScrapReason, setConfirmedScrapReason] = useState('Decayed Organic Matter');
  const [confirmedDisposalMethod, setConfirmedDisposalMethod] = useState('Compost Disposal Pit #1');
  const [confirmedRestockBin, setConfirmedRestockBin] = useState('A-01-01');
  const [confirmedRemarks, setConfirmedRemarks] = useState('');
  const [confirmedReturnQty, setConfirmedReturnQty] = useState('');

  // Log New Return Form Drawer state
  const [showNewReturnForm, setShowNewReturnForm] = useState(false);
  const [formReturnType, setFormReturnType] = useState('Sales Return');
  const [formPartnerId, setFormPartnerId] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [formQty, setFormQty] = useState('');
  const [formTemp, setFormTemp] = useState('4.0');
  const [formReason, setFormReason] = useState('Damaged Packaging');
  const [formStatus, setFormStatus] = useState('Return Confirmation Pending');
  const [formRemarks, setFormRemarks] = useState('');
  const [formChallanNo, setFormChallanNo] = useState('');
  const [formDeliveryNo, setFormDeliveryNo] = useState('');

  // Combined returns ensuring mock defaults + live context entries
  const combinedReturns = useMemo(() => {
    const map = new Map();
    // 1. Seed with defaultReturns
    (defaultReturns || []).forEach(item => {
      const key = item.challanNo || item.id;
      if (key) map.set(key, item);
    });
    // 2. Override with live context returns
    (returns || []).forEach(item => {
      const key = item.challanNo || item.id;
      if (key) map.set(key, item);
    });
    return Array.from(map.values());
  }, [returns]);

  // Universal Filtered List for Returns
  const allFilteredReturns = useMemo(() => {
    let list = combinedReturns;

    // Filter by Keyword & Search field
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim();
      list = list.filter(ret => {
        if (searchField === 'challanNo') return (ret.challanNo || '').toLowerCase().includes(q);
        if (searchField === 'salesDeliveryNo') return (ret.salesDeliveryNo || '').toLowerCase().includes(q);
        if (searchField === 'customer') {
          const custName = ret.customerName || customers.find(c => c.id === ret.partnerId)?.name || '';
          return custName.toLowerCase().includes(q);
        }
        if (searchField === 'product') {
          const prodDesc = products.find(p => p.id === ret.productId)?.description || '';
          const hasItem = (ret.items || []).some(i => (i.productDesc || i.productCode || '').toLowerCase().includes(q));
          return prodDesc.toLowerCase().includes(q) || hasItem;
        }

        // Default 'all'
        const custName = ret.customerName || customers.find(c => c.id === ret.partnerId)?.name || '';
        const vendName = vendors.find(v => v.id === ret.partnerId)?.name || '';
        const prodDesc = products.find(p => p.id === ret.productId)?.description || '';
        const itemsMatch = (ret.items || []).some(i => (i.productDesc || i.productCode || '').toLowerCase().includes(q));

        return (
          (ret.challanNo || '').toLowerCase().includes(q) ||
          (ret.salesDeliveryNo || '').toLowerCase().includes(q) ||
          (ret.returnNo || '').toLowerCase().includes(q) ||
          (ret.reason || '').toLowerCase().includes(q) ||
          custName.toLowerCase().includes(q) ||
          vendName.toLowerCase().includes(q) ||
          prodDesc.toLowerCase().includes(q) ||
          itemsMatch
        );
      });
    }

    // Filter by Date Range
    if (fromDate) {
      list = list.filter(ret => !ret.date || ret.date >= fromDate);
    }
    if (toDate) {
      list = list.filter(ret => !ret.date || ret.date <= toDate);
    }

    return list;
  }, [combinedReturns, searchKeyword, searchField, fromDate, toDate, customers, vendors, products]);

  // Sales Returns Lists by SubTab
  const salesReturnsBySubTab = useMemo(() => {
    const salesList = allFilteredReturns.filter(ret => ret.type === 'Sales Return' || ret.type === 'Customer Return');

    if (salesSubTab === 'pending_confirmation') {
      return salesList.filter(ret => ret.status === 'Return Confirmation Pending' || ret.status === 'Quarantined' || (!ret.disposition && ret.status !== 'Return To Vendor' && ret.status !== 'Sale To Local Market' && ret.status !== 'Scrap' && ret.status !== 'Restocked'));
    } else if (salesSubTab === 'return_to_vendor') {
      return salesList.filter(ret => ret.status === 'Return To Vendor' || ret.disposition === 'Return To Vendor');
    } else if (salesSubTab === 'sale_local_market') {
      return salesList.filter(ret => ret.status === 'Sale To Local Market' || ret.disposition === 'Sale To Local Market');
    } else if (salesSubTab === 'scrap') {
      return salesList.filter(ret => ret.status === 'Scrap' || ret.disposition === 'Scrap');
    } else if (salesSubTab === 'all_confirmed') {
      return salesList.filter(ret => ret.status === 'Return To Vendor' || ret.status === 'Sale To Local Market' || ret.status === 'Scrap' || ret.status === 'Restocked' || Boolean(ret.disposition));
    }
    return salesList;
  }, [allFilteredReturns, salesSubTab]);

  // Vendor QC Returns List
  const qcReturnsList = useMemo(() => {
    return allFilteredReturns.filter(ret =>
      ret.type === 'QC Return' ||
      ret.type === 'Purchase Return' ||
      ret.type === 'Vendor Return' ||
      ret.type === 'QC Rejection'
    );
  }, [allFilteredReturns]);

  // Download Excel / CSV handler
  const handleDownloadExcel = () => {
    const activeList = activeTab === 'cust_returns' ? salesReturnsBySubTab : (activeTab === 'supplier_returns' ? qcReturnsList : allFilteredReturns);

    const headers = ['Delivery Challan No.', 'Sales Delivery No', 'Total No of Products', 'Total Quantity', 'Total Return Qty', 'Partner Name', 'Reason', 'Status', 'Date'];
    const rows = activeList.map(r => [
      `"${r.challanNo || r.returnNo || ''}"`,
      `"${r.salesDeliveryNo || ''}"`,
      `"${r.noOfProducts || (r.items ? r.items.length : 1)}"`,
      `"${(Number(r.totalQty) || Number(r.qty) || 0).toFixed(2)}"`,
      `"${(Number(r.totalReturnQty) || 0).toFixed(2)}"`,
      `"${r.customerName || customers.find(c => c.id === r.partnerId)?.name || vendors.find(v => v.id === r.partnerId)?.name || 'Direct Customer'}"`,
      `"${r.reason || ''}"`,
      `"${r.status || ''}"`,
      `"${r.date || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Return_Confirmation_Report_${salesSubTab}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Return Confirmation Modal
  const handleOpenConfirmationModal = (returnRecord) => {
    setSelectedReturnForAction(returnRecord);
    setDispositionType('Return To Vendor');
    setConfirmedVendorId(vendors[0]?.id || 'V-001');
    setConfirmedDebitNote(`DBN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setConfirmedBuyerName('Jamnagar Mandi Trader #1');
    setConfirmedRate('22.00');
    setConfirmedLocalInvoice(`LMS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setConfirmedScrapReason(returnRecord.reason || 'Decayed Organic Matter');
    setConfirmedDisposalMethod('Compost Disposal Pit #1');
    setConfirmedRestockBin(locations[0]?.code || 'A-01-01');
    setConfirmedReturnQty(returnRecord.totalReturnQty > 0 ? String(returnRecord.totalReturnQty) : String(returnRecord.totalQty || returnRecord.qty || 10));
    setConfirmedRemarks(`Confirmed return disposition on ${new Date().toLocaleDateString()}`);
  };

  // Execute Return Confirmation
  const handleExecuteReturnConfirmation = (e) => {
    e.preventDefault();
    if (!selectedReturnForAction) return;

    confirmReturnDisposition(selectedReturnForAction.id, {
      disposition: dispositionType,
      confirmedReturnQty: Number(confirmedReturnQty) || 0,
      vendorId: confirmedVendorId,
      vendorName: vendors.find(v => v.id === confirmedVendorId)?.name || 'Supplier',
      debitNoteNo: confirmedDebitNote,
      buyerName: confirmedBuyerName,
      rate: Number(confirmedRate) || 0,
      totalAmount: (Number(confirmedRate) || 0) * (Number(confirmedReturnQty) || 0),
      localInvoiceNo: confirmedLocalInvoice,
      scrapReason: confirmedScrapReason,
      disposalMethod: confirmedDisposalMethod,
      locationCode: confirmedRestockBin,
      remarks: confirmedRemarks,
      challanNo: selectedReturnForAction.challanNo
    });

    alert(`Return Confirmation for Challan ${selectedReturnForAction.challanNo} successfully processed under: ${dispositionType}`);
    setSelectedReturnForAction(null);
  };

  // Log New Return submit
  const handleNewReturnSubmit = (e) => {
    e.preventDefault();
    if (!formProductId || !formPartnerId || !formQty) {
      alert('Please fill out all required fields.');
      return;
    }

    registerReturn({
      type: formReturnType,
      partnerId: formPartnerId,
      productId: formProductId,
      qty: Number(formQty),
      totalQty: Number(formQty),
      totalReturnQty: Number(formQty),
      challanNo: formChallanNo || `GVL/${Math.floor(10000 + Math.random() * 90000)}/26-27`,
      salesDeliveryNo: formDeliveryNo || `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      reason: formReason,
      tempLog: Number(formTemp),
      status: formStatus,
      actionTaken: formRemarks || `Logged return shipment with reason: ${formReason}`,
      locationCode: formStatus === 'Restocked' ? 'A-01-01' : null
    });

    // Reset Form
    setFormReturnType('Sales Return');
    setFormPartnerId('');
    setFormProductId('');
    setFormQty('');
    setFormChallanNo('');
    setFormDeliveryNo('');
    setFormTemp('4.0');
    setFormReason('Damaged Packaging');
    setFormStatus('Return Confirmation Pending');
    setFormRemarks('');
    setShowNewReturnForm(false);

    alert('Return registered successfully. Available under Return Control.');
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6 animate-in fade-in-50 duration-200">

      {/* Top Header & Dropdown View Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
            <RotateCcw className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Returns Control</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Manage Sales Return POD confirmations, vendor rejection return logs, local clearance sales, and scrap quarantine.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Main Dropdown requested by user: Sales return, QC return, All QC rejection & return */}
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 shadow-2xs">
            <label htmlFor="return-control-dropdown" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Return Process:</span>
            </label>
            <select
              id="return-control-dropdown"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer shadow-2xs"
            >
              <option value="cust_returns">Sales return</option>
              <option value="supplier_returns">QC return</option>
              <option value="returns_qc">All QC rejection & return</option>
            </select>
          </div>

          <button
            onClick={() => setShowNewReturnForm(true)}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-4 py-2 text-xs transition-all shadow-sm active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Log Return</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: SALES RETURN (Matching the exact provided UI Screenshot) */}
      {activeTab === 'cust_returns' && (
        <div className="space-y-4">
          
          {/* Top Sub-tabs Bar (Return Confirmation Pending, Return To Vendor, Sale To Local Market, Scrap, All Confirmed Sales Return) */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-1 overflow-x-auto pb-px">
            {salesSubTabs.map(tab => {
              const isActive = salesSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSalesSubTab(tab.id)}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                    isActive
                      ? 'border-emerald-700 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-950/10 rounded-t-lg'
                      : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:border-zinc-300'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Ribbon: Advance Search (teal) & Download report in excel */}
          <div className="bg-[#2e7d5e] dark:bg-[#1b4332] text-white p-4 rounded-xl shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setAdvanceSearchOpen(!advanceSearchOpen)}
                className={`px-4 py-1.5 text-xs font-bold rounded transition-colors shadow-2xs ${
                  advanceSearchOpen
                    ? 'bg-[#1b5e20] text-white border border-[#2e7d32]'
                    : 'bg-[#388e3c] text-white hover:bg-[#2e7d32]'
                }`}
              >
                Advance Search
              </button>

              <button
                onClick={handleDownloadExcel}
                className="px-4 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download report in excel</span>
              </button>
            </div>

            {/* Advance Search Filters Row matching screenshot */}
            {advanceSearchOpen && (
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                {/* Select Filter Category */}
                <div className="min-w-[140px]">
                  <select
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value)}
                    className="w-full bg-white text-zinc-900 rounded px-3 py-1.5 text-xs font-medium border-0 focus:ring-2 focus:ring-white cursor-pointer"
                  >
                    <option value="all">Select</option>
                    <option value="challanNo">Delivery Challan No.</option>
                    <option value="salesDeliveryNo">Sales Delivery No</option>
                    <option value="customer">Customer Name</option>
                    <option value="product">Product Name / SKU</option>
                  </select>
                </div>

                {/* Input text */}
                <div className="min-w-[200px] flex-1 max-w-xs">
                  <input
                    type="text"
                    placeholder="Please Enter"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full bg-white text-zinc-900 rounded px-3 py-1.5 text-xs font-medium border-0 focus:ring-2 focus:ring-white placeholder:text-zinc-400"
                  />
                </div>

                {/* Date range From & To */}
                <div className="flex items-center gap-2 text-white font-medium">
                  <span>From :</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="bg-white text-zinc-900 rounded px-2.5 py-1 text-xs border-0 focus:ring-2 focus:ring-white"
                  />
                </div>

                <div className="flex items-center gap-2 text-white font-medium">
                  <span>To :</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="bg-white text-zinc-900 rounded px-2.5 py-1 text-xs border-0 focus:ring-2 focus:ring-white"
                  />
                </div>

                {/* Search Trigger Button */}
                <button
                  onClick={() => {}}
                  className="bg-[#00b4d8] hover:bg-[#0096c7] text-white font-bold px-4 py-1.5 rounded text-xs tracking-wider transition-colors shadow-sm ml-auto sm:ml-0"
                >
                  ADVANCE SEARCH
                </button>
              </div>
            )}
          </div>

          {/* Main Title & Result Indicator matching screenshot */}
          <div className="text-center pt-2">
            <h2 className="text-base font-extrabold text-[#1b7a5a] dark:text-emerald-400 tracking-wider uppercase">
              RETURN CONFIRMATION DATA
            </h2>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
              Searched values : Default Search | Showing {salesReturnsBySubTab.length} by default of {salesReturnsBySubTab.length} entries
            </p>
          </div>

          {/* RETURN DATA TABLE */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1b7a5a] text-white font-semibold text-[11px]">
                    <th className="p-3 border-r border-[#2a8b6c] whitespace-nowrap">Delivery Challan No.</th>
                    <th className="p-3 border-r border-[#2a8b6c] whitespace-nowrap">Sales Delivery No</th>
                    <th className="p-3 border-r border-[#2a8b6c] whitespace-nowrap text-center">Total No of Products</th>
                    <th className="p-3 border-r border-[#2a8b6c] whitespace-nowrap text-center">Total Quantity</th>
                    <th className="p-3 border-r border-[#2a8b6c] whitespace-nowrap text-center">Total Return Qty</th>
                    <th className="p-3 whitespace-nowrap text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 text-zinc-800 dark:text-zinc-200 text-xs">
                  {salesReturnsBySubTab.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-zinc-400">
                        No return records found in {salesSubTabs.find(t => t.id === salesSubTab)?.label}.
                      </td>
                    </tr>
                  ) : (
                    salesReturnsBySubTab.map((ret, index) => {
                      const totalQtyVal = Number(ret.totalQty || ret.qty || 0);
                      const returnQtyVal = Number(ret.totalReturnQty || 0);
                      const numProducts = ret.noOfProducts || (ret.items ? ret.items.length : 1);

                      return (
                        <tr
                          key={ret.id || index}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                        >
                          <td className="p-3 font-mono font-medium border-r border-zinc-100 dark:border-zinc-800">
                            {ret.challanNo || ret.returnNo || 'GVL/08165/26-27'}
                          </td>
                          <td className="p-3 font-mono border-r border-zinc-100 dark:border-zinc-800">
                            {ret.salesDeliveryNo || '5515964508'}
                          </td>
                          <td className="p-3 font-mono text-center border-r border-zinc-100 dark:border-zinc-800">
                            {numProducts}
                          </td>
                          <td className="p-3 font-mono font-bold text-center border-r border-zinc-100 dark:border-zinc-800">
                            {totalQtyVal.toFixed(2)}
                          </td>
                          <td className="p-3 font-mono font-bold text-center border-r border-zinc-100 dark:border-zinc-800">
                            <span className={returnQtyVal > 0 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-zinc-600 dark:text-zinc-300'}>
                              {returnQtyVal.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {salesSubTab === 'pending_confirmation' ? (
                              <button
                                onClick={() => handleOpenConfirmationModal(ret)}
                                className="bg-white hover:bg-emerald-50 dark:bg-transparent dark:hover:bg-emerald-950/20 text-[#1b7a5a] dark:text-emerald-400 border border-[#1b7a5a] dark:border-emerald-600 font-bold px-3 py-1.5 rounded text-[10px] tracking-wider uppercase transition-all shadow-2xs active:scale-95 cursor-pointer"
                              >
                                RETURN CONFIRMATION
                              </button>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  ret.status === 'Return To Vendor'
                                    ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                    : ret.status === 'Sale To Local Market'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                    : ret.status === 'Scrap'
                                    ? 'bg-rose-100 dark:bg-rose-955/40 text-rose-700 dark:text-rose-300'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                }`}>
                                  {ret.disposition || ret.status}
                                </span>
                                <button
                                  onClick={() => handleOpenConfirmationModal(ret)}
                                  className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline cursor-pointer"
                                >
                                  Modify
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: QC RETURN (Purchase / Vendor Returns) */}
      {activeTab === 'supplier_returns' && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">QC Return (Vendor Rejections)</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Rejected goods from inward dock QC inspections destined for vendor return and supplier debit notes.</p>
            </div>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                  <th className="p-3">Ref Return No</th>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Product Description</th>
                  <th className="p-3 text-center">Rejected Qty</th>
                  <th className="p-3">Rejection Reason</th>
                  <th className="p-3">Temp Log</th>
                  <th className="p-3">QA Status</th>
                  <th className="p-3">Action Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {qcReturnsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-zinc-400">No vendor QC returns recorded.</td>
                  </tr>
                ) : (
                  qcReturnsList.map(ret => (
                    <tr key={ret.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300">
                      <td className="p-3 font-mono font-bold text-zinc-900 dark:text-white">{ret.returnNo || ret.challanNo}</td>
                      <td className="p-3 font-semibold">{vendors.find(v => v.id === ret.partnerId)?.name || 'Direct Supplier'}</td>
                      <td className="p-3 font-semibold">{products.find(p => p.id === ret.productId)?.description || ret.items?.[0]?.productDesc || 'Fresh Produce'}</td>
                      <td className="p-3 font-mono font-bold text-center text-rose-600 dark:text-rose-400">{ret.qty} units</td>
                      <td className="p-3">{ret.reason}</td>
                      <td className="p-3 font-mono font-bold">{ret.tempLog}°C</td>
                      <td className="p-3 font-semibold">
                        <span className="bg-rose-50 dark:bg-rose-955/20 text-rose-600 px-2 py-0.5 rounded text-[10px] font-bold">
                          QC Failed
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-zinc-500 dark:text-zinc-400">{ret.actionTaken || 'Returned to Vendor'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: ALL QC REJECTION & RETURN (Comprehensive Logs & Audits) */}
      {activeTab === 'returns_qc' && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">All QC Rejection & Return Master Logs</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Complete historical register of all customer sales returns, POD rejections, supplier returns, and quarantine audits.</p>
          </div>

          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                  <th className="p-3">Ref No</th>
                  <th className="p-3">Return Type</th>
                  <th className="p-3">Challan / Delivery No</th>
                  <th className="p-3">Partner Name</th>
                  <th className="p-3 text-center">Total Qty</th>
                  <th className="p-3 text-center">Return Qty</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {allFilteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-zinc-400">No return logs available.</td>
                  </tr>
                ) : (
                  allFilteredReturns.map(ret => (
                    <tr key={ret.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300">
                      <td className="p-3 font-mono font-bold text-zinc-900 dark:text-white">{ret.returnNo}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ret.type === 'Sales Return' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600' : 'bg-purple-50 dark:bg-purple-950/20 text-purple-600'
                        }`}>
                          {ret.type}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px]">{ret.challanNo || ret.salesDeliveryNo || '-'}</td>
                      <td className="p-3 font-semibold">{ret.customerName || customers.find(c => c.id === ret.partnerId)?.name || vendors.find(v => v.id === ret.partnerId)?.name || 'Partner'}</td>
                      <td className="p-3 font-mono text-center font-bold">{(Number(ret.totalQty) || Number(ret.qty) || 0).toFixed(2)}</td>
                      <td className="p-3 font-mono text-center font-bold text-rose-600">{(Number(ret.totalReturnQty) || 0).toFixed(2)}</td>
                      <td className="p-3">{ret.reason}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ret.status === 'Return Confirmation Pending' ? 'bg-amber-50 dark:bg-amber-955/20 text-amber-600' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                        }`}>
                          {ret.disposition || ret.status}
                        </span>
                      </td>
                      <td className="p-3 text-[10px] text-zinc-400 italic">{ret.actionTaken}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RETURN CONFIRMATION MODAL (Triggered when user clicks 'RETURN CONFIRMATION' on any row) */}
      {selectedReturnForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#1b7a5a] dark:text-emerald-400 tracking-wide uppercase">
                  SALES RETURN CONFIRMATION
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Confirm returned / rejected goods disposition, quantity verification, and inventory action.
                </p>
              </div>
              <button
                onClick={() => setSelectedReturnForAction(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Challan & Reference Summary Info Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Delivery Challan</span>
                <span className="font-mono font-extrabold text-zinc-900 dark:text-zinc-50">{selectedReturnForAction.challanNo || 'GVL/08165/26-27'}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Sales Delivery No</span>
                <span className="font-mono font-extrabold text-zinc-900 dark:text-zinc-50">{selectedReturnForAction.salesDeliveryNo || '5515964508'}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Customer Name</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">{selectedReturnForAction.customerName || 'Reliance Industries Ltd'}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Total Dispatched</span>
                <span className="font-mono font-extrabold text-emerald-600">{(Number(selectedReturnForAction.totalQty) || Number(selectedReturnForAction.qty) || 0).toFixed(2)} KG</span>
              </div>
            </div>

            {/* Delivered Produce Breakdown */}
            {selectedReturnForAction.items && selectedReturnForAction.items.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Delivered Produce Items List:</label>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold">
                      <tr>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Product Description</th>
                        <th className="p-2.5 text-center">Dispatched</th>
                        <th className="p-2.5 text-center">Return Qty</th>
                        <th className="p-2.5">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                      {selectedReturnForAction.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                          <td className="p-2.5 font-mono font-bold text-zinc-900 dark:text-zinc-100">{it.productCode || it.productId || `G00${idx + 1}`}</td>
                          <td className="p-2.5 font-semibold">{it.productDesc || it.description || 'Produce Item'}</td>
                          <td className="p-2.5 font-mono text-center font-bold">{it.dispatchedQty || it.qty || 0} {it.uom || 'KG'}</td>
                          <td className="p-2.5 font-mono text-center font-bold text-rose-600">{it.returnQty || it.rejectedQty || 0} {it.uom || 'KG'}</td>
                          <td className="p-2.5 text-[11px] text-zinc-500">{it.reason || 'Verified at gate'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Confirmation Form */}
            <form onSubmit={handleExecuteReturnConfirmation} className="space-y-4">
              
              {/* Select Return Disposition Route */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Select Return Disposition Route:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Return To Vendor', label: 'Return To Vendor', icon: Truck },
                    { id: 'Sale To Local Market', label: 'Sale To Local Market', icon: Store },
                    { id: 'Scrap', label: 'Scrap', icon: Trash2 },
                    { id: 'Restocked', label: 'Restock to Cold Room', icon: Boxes }
                  ].map(option => {
                    const isSel = dispositionType === option.id;
                    const Icon = option.icon;
                    return (
                      <button
                        type="button"
                        key={option.id}
                        onClick={() => setDispositionType(option.id)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                          isSel
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-[11px]">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Confirmed Return Quantity Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Confirmed Return / Rejected Quantity (KG / Units):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={confirmedReturnQty}
                    onChange={(e) => setConfirmedReturnQty(e.target.value)}
                    className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs font-mono font-bold"
                  />
                </div>

                {/* Conditional Fields based on disposition */}
                {dispositionType === 'Return To Vendor' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Select Target Supplier / Vendor:
                    </label>
                    <select
                      value={confirmedVendorId}
                      onChange={(e) => setConfirmedVendorId(e.target.value)}
                      className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs font-medium"
                    >
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
                      ))}
                    </select>
                  </div>
                )}

                {dispositionType === 'Sale To Local Market' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Secondary Market Selling Rate (₹ / KG):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={confirmedRate}
                      onChange={(e) => setConfirmedRate(e.target.value)}
                      className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs font-bold"
                    />
                  </div>
                )}

                {dispositionType === 'Scrap' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Scrap Destruction Reason:
                    </label>
                    <select
                      value={confirmedScrapReason}
                      onChange={(e) => setConfirmedScrapReason(e.target.value)}
                      className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs"
                    >
                      <option value="Decayed Organic Matter">Decayed Organic Produce</option>
                      <option value="Fungus & Mold Contamination">Fungus & Mold Contamination</option>
                      <option value="Severe Transit Bruising">Severe Transit Crushing</option>
                      <option value="Temperature Abuse Rotting">Temperature Abuse Spoilage</option>
                    </select>
                  </div>
                )}

                {dispositionType === 'Restocked' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Restock Destination Cold Storage Bin:
                    </label>
                    <select
                      value={confirmedRestockBin}
                      onChange={(e) => setConfirmedRestockBin(e.target.value)}
                      className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs"
                    >
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.code}>{loc.code} - {loc.type} ({loc.tempZone})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Disposition Remarks */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Confirmation Remarks & Gate Audit Notes:
                </label>
                <textarea
                  rows={2}
                  value={confirmedRemarks}
                  onChange={(e) => setConfirmedRemarks(e.target.value)}
                  placeholder="Enter return confirmation notes, driver notes, or credit note info..."
                  className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedReturnForAction(null)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#1b7a5a] hover:bg-[#145d44] text-white font-bold px-6 py-2.5 rounded-xl text-xs tracking-wider uppercase transition-all shadow-sm active:scale-95"
                >
                  Confirm & Save Disposition
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* LOG NEW RETURN DRAWER */}
      {showNewReturnForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#0c0c0f] h-full shadow-2xl p-6 flex flex-col justify-between border-l border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-4 mb-6">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">Log Return Entry</h2>
                  <span className="text-[10px] text-zinc-400">Record customer sales return or vendor QC rejection details.</span>
                </div>
                <button
                  onClick={() => setShowNewReturnForm(false)}
                  className="p-1.5 text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-xs"
                >
                  Dismiss
                </button>
              </div>

              <form onSubmit={handleNewReturnSubmit} id="newReturnForm" className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Return Process Type</label>
                  <select
                    value={formReturnType}
                    onChange={(e) => { setFormReturnType(e.target.value); setFormPartnerId(''); }}
                    className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs font-semibold"
                  >
                    <option value="Sales Return">Sales Return (Customer Return)</option>
                    <option value="QC Return">QC Return (Vendor Rejection)</option>
                    <option value="QC Rejection">QC Rejection (Dock Quality Fail)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1">Delivery Challan No.</label>
                    <input
                      type="text"
                      placeholder="e.g. GVL/08165/26-27"
                      value={formChallanNo}
                      onChange={(e) => setFormChallanNo(e.target.value)}
                      className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1">Sales Delivery No</label>
                    <input
                      type="text"
                      placeholder="e.g. 5515964508"
                      value={formDeliveryNo}
                      onChange={(e) => setFormDeliveryNo(e.target.value)}
                      className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">
                    {formReturnType === 'Sales Return' ? 'Select Customer Partner' : 'Select Vendor / Supplier'}
                  </label>
                  <select
                    required
                    value={formPartnerId}
                    onChange={(e) => setFormPartnerId(e.target.value)}
                    className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs"
                  >
                    <option value="">-- Choose Partner --</option>
                    {formReturnType === 'Sales Return'
                      ? customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.city})</option>)
                      : vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.city})</option>)
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Select Product SKU</label>
                  <select
                    required
                    value={formProductId}
                    onChange={(e) => setFormProductId(e.target.value)}
                    className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs"
                  >
                    <option value="">-- Choose SKU --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.description} ({p.code})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1">Quantity (Units / KG)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.1"
                      value={formQty}
                      onChange={(e) => setFormQty(e.target.value)}
                      placeholder="Qty"
                      className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1">Temperature log (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formTemp}
                      onChange={(e) => setFormTemp(e.target.value)}
                      className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Return Reason</label>
                  <select
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs"
                  >
                    <option value="Damaged Packaging">Damaged Packaging / Crates</option>
                    <option value="Temperature Abuse">Temperature Abuse (&gt; 6°C)</option>
                    <option value="Quality Rejection at Gate">Quality Rejection at Gate</option>
                    <option value="Customer Overstock">Customer Surplus Overstock</option>
                    <option value="Wilting / Leaf Damage">Wilting / Leaf Damage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Initial Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs font-semibold"
                  >
                    <option value="Return Confirmation Pending">Return Confirmation Pending</option>
                    <option value="Return To Vendor">Return To Vendor</option>
                    <option value="Sale To Local Market">Sale To Local Market</option>
                    <option value="Scrap">Scrap</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1">Remarks</label>
                  <textarea
                    rows={2}
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    placeholder="Remarks, driver notes..."
                    className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs"
                  />
                </div>
              </form>
            </div>

            <div className="border-t border-zinc-150 dark:border-zinc-800 pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowNewReturnForm(false)}
                className="w-1/3 text-xs bg-transparent border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-lg py-2.5 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="newReturnForm"
                className="w-2/3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg py-2.5 transition-colors shadow-sm"
              >
                Save Return Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
