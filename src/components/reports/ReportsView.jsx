import React, { useContext, useState, useMemo } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import MisDashboard from './MisDashboard';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  Layers,
  History,
  ShieldCheck,
  TrendingDown,
  BarChart3,
  Database,
  RefreshCw,
  CloudLightning,
  Cpu,
  Settings,
  Terminal,
  ArrowRight,
  Truck
} from 'lucide-react';

export default function ReportsView() {
  const {
    inventory,
    products,
    vehicles,
    auditLogs,
    salesOrders,
    customers,
    vendors
  } = useContext(WmsDataContext);

  const context = useContext(WmsDataContext);
  const { activeTabs, setActiveTabs } = context;
  const reportType = activeTabs.reports || 'mis';
  const setReportType = (tab) => {
    setActiveTabs(prev => ({ ...prev, reports: tab }));
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Power BI Sim States
  const [syncLogs, setSyncLogs] = useState([
    'Gateway Service: Active (GW-GNOSIS-01)',
    'DirectQuery Connection: Stable',
    'Last sync check: ' + new Date().toLocaleTimeString(),
    'Ready for direct user trigger...'
  ]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [scheduledSync, setScheduledSync] = useState('15m');
  const [pbiPage, setPbiPage] = useState('wastage'); // wastage, coldchain, efficiency

  const handlePbiSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Triggering manual workspace sync...`,
      'Step 1/5: Verifying SQL Server DirectQuery gateway connection...'
    ]);

    setTimeout(() => {
      setSyncLogs(prev => [
        ...prev,
        'Step 2/5: Connection established. Re-indexing transactional tables (Products, PurchaseOrders, GRNs, Returns)...',
        `- Syncing Products (${products.length} records)`,
        `- Syncing Inventory (${inventory.length} records)`
      ]);
    }, 1000);

    setTimeout(() => {
      setSyncLogs(prev => [
        ...prev,
        'Step 3/5: Compiling Inbound and Outbound KPIs...',
        `- Syncing Sales Orders (${salesOrders.length} records)`,
        `- Syncing Vehicles (${vehicles.length} records)`
      ]);
    }, 2000);

    setTimeout(() => {
      setSyncLogs(prev => [
        ...prev,
        'Step 4/5: Compiling audit trails and temperature logs...',
        `- Syncing Audit Logs (${auditLogs.length} records)`
      ]);
    }, 3000);

    setTimeout(() => {
      setSyncLogs(prev => [
        ...prev,
        'Step 5/5: Syncing datasets to Power BI Workspace (Gnosis WMS Analytics)...',
        'Power BI Cache invalidated. Workspace dashboard refreshed successfully.',
        `[${new Date().toLocaleTimeString()}] Sync Completed successfully.`
      ]);
      setIsSyncing(false);
    }, 4000);
  };

  // 1. Compile Live Stock Report Data
  const stockReportData = useMemo(() => {
    return inventory.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return {
        batchNo: item.batchNo,
        productCode: prod?.code || 'Unknown',
        productName: prod?.description || 'Unknown',
        category: prod?.category || 'Unknown',
        location: item.locationCode,
        qty: item.qty,
        uom: prod?.uom || 'Box',
        mfgDate: item.mfgDate,
        expiryDate: item.expiryDate,
        ageDays: item.ageDays || 0
      };
    });
  }, [inventory, products]);

  // 2. Compile Ageing Distribution Data
  const ageingStats = useMemo(() => {
    let fresh = 0; // < 5 days
    let mid = 0;   // 5 - 12 days
    let critical = 0; // > 12 days
    
    inventory.forEach(item => {
      // Calculate age based on Mfg Date to today
      const today = new Date();
      const mfg = new Date(item.mfgDate);
      const diffTime = today - mfg;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 0;
      
      if (diffDays < 5) fresh += item.qty;
      else if (diffDays <= 12) mid += item.qty;
      else critical += item.qty;
    });

    return { fresh, mid, critical };
  }, [inventory]);

  // 3. Compile GRN Receipts History
  const grnHistoryData = useMemo(() => {
    const inboundVehs = vehicles.filter(v => v.processType === 'Inbound' && v.remark.includes('GRN'));
    return inboundVehs.map(v => {
      return {
        date: v.inDateTime.split(' ')[0],
        gatepass: v.gatepassNo,
        vehicle: v.vehicleNo,
        poRef: v.bookingRefDocNo,
        driver: v.driverName,
        status: v.status,
        remark: v.remark
      };
    });
  }, [vehicles]);

  // 4. Compile Outbound Dispatches
  const dispatchHistoryData = useMemo(() => {
    const completedSOs = salesOrders.filter(so => so.status === 'Dispatched' || so.status === 'Delivered');
    return completedSOs.map(so => {
      const cust = customers.find(c => c.id === so.customerId);
      return {
        date: so.date,
        orderNo: so.orderNo,
        customer: cust?.name || 'Unknown',
        vehicle: so.dispatchDetails?.vehicleNo || 'NA',
        invoiceNo: so.dispatchDetails?.invoiceNo || 'NA',
        status: so.status,
        deliveredAt: so.dispatchDetails?.deliveryTime || 'In-transit'
      };
    });
  }, [salesOrders, customers]);

  // Filters logic
  const getFilteredData = () => {
    const query = searchQuery.toLowerCase();
    let data = [];

    if (reportType === 'stock') data = stockReportData;
    else if (reportType === 'grn') data = grnHistoryData;
    else if (reportType === 'dispatch') data = dispatchHistoryData;
    else if (reportType === 'audit') data = auditLogs;
    else return []; // Ageing is graphical

    return data.filter(item => {
      // String search match
      const stringMatch = Object.values(item).some(val => 
        val !== null && val !== undefined && val.toString().toLowerCase().includes(query)
      );

      // Date range match
      let dateMatch = true;
      const dateVal = item.date || item.mfgDate || item.timestamp?.split(' ')[0];
      if (dateVal) {
        if (startDate && new Date(dateVal) < new Date(startDate)) dateMatch = false;
        if (endDate && new Date(dateVal) > new Date(endDate)) dateMatch = false;
      }

      return stringMatch && dateMatch;
    });
  };

  const filteredList = getFilteredData();

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredList.length === 0) {
      alert('No data rows available to export.');
      return;
    }

    // Extract Headers
    const headers = Object.keys(filteredList[0]);
    const csvRows = [
      headers.join(','), // Header row
      ...filteredList.map(row => 
        headers.map(header => {
          const val = row[header] !== null && row[header] !== undefined ? row[header].toString() : '';
          // Quote strings containing commas
          return val.includes(',') ? `"${val}"` : val;
        }).join(',')
      )
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wms_report_${reportType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6 animate-in fade-in-50 duration-200">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Exportable audit trails, historical stock dispatches, and warehouse quality reports.</p>
        </div>

        {reportType !== 'ageing' && reportType !== 'powerbi' && (
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 text-xs transition-colors shadow-sm self-start sm:self-auto"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV / Excel</span>
          </button>
        )}
      </div>

      {/* Report selector tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          onClick={() => setReportType('mis')}
          className={`flex items-center justify-center gap-2 p-2.5 text-xs font-bold rounded-xl border transition-all ${
            reportType === 'mis'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-sm'
              : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Executive MIS</span>
        </button>

        <button
          onClick={() => setReportType('stock')}
          className={`flex items-center justify-center gap-2 p-2.5 text-xs font-bold rounded-xl border transition-all ${
            reportType === 'stock'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-sm'
              : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Live Stock</span>
        </button>

        <button
          onClick={() => setReportType('ageing')}
          className={`flex items-center justify-center gap-2 p-2.5 text-xs font-bold rounded-xl border transition-all ${
            reportType === 'ageing'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-sm'
              : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
          }`}
        >
          <TrendingDown className="h-4 w-4" />
          <span>FEFO Ageing</span>
        </button>

        <button
          onClick={() => setReportType('grn')}
          className={`flex items-center justify-center gap-2 p-2.5 text-xs font-bold rounded-xl border transition-all ${
            reportType === 'grn'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-sm'
              : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
          }`}
        >
          <History className="h-4 w-4" />
          <span>GRN Receipts</span>
        </button>

        <button
          onClick={() => setReportType('dispatch')}
          className={`flex items-center justify-center gap-2 p-2.5 text-xs font-bold rounded-xl border transition-all ${
            reportType === 'dispatch'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-sm'
              : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>Dispatches</span>
        </button>

        <button
          onClick={() => setReportType('audit')}
          className={`flex items-center justify-center gap-2 p-2.5 text-xs font-bold rounded-xl border transition-all ${
            reportType === 'audit'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-sm'
              : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Audit Trail</span>
        </button>

        <button
          onClick={() => setReportType('powerbi')}
          className={`flex items-center justify-center gap-2 p-2.5 text-xs font-bold rounded-xl border transition-all ${
            reportType === 'powerbi'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-sm'
              : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Power BI</span>
        </button>
      </div>

      {/* Render MIS Dashboard or Tabular Reports */}
      {reportType === 'mis' ? (
        <MisDashboard />
      ) : (
        <>
          {/* Filter Options (hidden for ageing and powerbi) */}
          {reportType !== 'ageing' && reportType !== 'powerbi' && (
            <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="relative">
                <span className="block text-[10px] text-zinc-400 uppercase font-bold mb-1">Text Query Match</span>
                <input
                  type="text"
                  placeholder="Search table rows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:outline-none"
                />
              </div>
              <div>
                <span className="block text-[10px] text-zinc-400 uppercase font-bold mb-1">Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-1.5 text-xs text-zinc-800 dark:text-zinc-200"
                />
              </div>
              <div>
                <span className="block text-[10px] text-zinc-400 uppercase font-bold mb-1">End Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-1.5 text-xs text-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>
          )}

          {/* Main Reports Table Panel */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
            
            {/* Table Rendering */}
            {reportType === 'powerbi' ? (
              <div className="space-y-6">
            {/* Embedded Header Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-xs">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-450 p-2.5 rounded-lg">
                  <Database className="h-5.5 w-5.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-805 dark:text-zinc-200 uppercase tracking-widest flex items-center gap-1.5">
                    DirectQuery Connection Status
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                  </h3>
                  <span className="block text-[10px] text-zinc-400 mt-0.5">
                    Database: <span className="font-bold text-zinc-700 dark:text-zinc-350">WMS_Prod_DB</span> | 
                    Server: <span className="font-mono text-zinc-750 dark:text-zinc-400 ml-1">wms-server.database.windows.net</span>
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handlePbiSync}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync Database Workspace</span>
                </button>
                <button
                  onClick={() => alert('Downloading Power BI dataset template file: GnosisWMS_DirectQuery_v1.pbit')}
                  className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-900 text-white font-semibold rounded-lg px-3 py-1.5 text-xs transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .PBIT Template</span>
                </button>
              </div>
            </div>

            {/* Split Panel: Report Canvas & Config Console */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Power BI Canvas Simulation (8 columns) */}
              <div className="lg:col-span-8 border border-zinc-250 dark:border-zinc-850 rounded-xl overflow-hidden shadow-md flex flex-col bg-[#f3f2f1] dark:bg-[#1a1918]">
                
                {/* Simulated Power BI Top Bar */}
                <div className="bg-[#eae9e8] dark:bg-[#252423] border-b border-zinc-300 dark:border-zinc-800 px-3 py-2 flex justify-between items-center text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center gap-4">
                    <span className="text-yellow-600 dark:text-yellow-550 font-black tracking-wider text-xs">Power BI</span>
                    <div className="h-4 w-px bg-zinc-350 dark:bg-zinc-800" />
                    <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer">File</span>
                    <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer">Export</span>
                    <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer flex items-center gap-1">Share</span>
                    <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer">Get Insights</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Embedded Sandbox</span>
                    <span className="text-zinc-400 font-mono">Last refresh: Just now</span>
                  </div>
                </div>

                {/* Simulated Report Panel */}
                <div className="p-5 flex-1 space-y-6">
                  {/* Report Navigation tabs inside report */}
                  <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    {[
                      { id: 'wastage', label: 'Wastage Rate Analysis' },
                      { id: 'coldchain', label: 'Cold Chain Alerts log' },
                      { id: 'efficiency', label: 'Store Pick & Putaway KPIs' }
                    ].map(page => (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => setPbiPage(page.id)}
                        className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors ${
                          pbiPage === page.id
                            ? 'bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-955/20 dark:border-yellow-800 dark:text-yellow-400'
                            : 'bg-white border-zinc-250 text-zinc-500 dark:bg-[#0c0c0f] dark:border-zinc-800'
                        }`}
                      >
                        {page.label}
                      </button>
                    ))}
                  </div>

                  {/* Page 1: Wastage Page */}
                  {pbiPage === 'wastage' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                          <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Aggregate Fruit Loss</span>
                          <span className="block text-xl font-black text-rose-500 mt-1">2.4%</span>
                          <span className="block text-[8px] text-zinc-400 mt-1">Target: &lt; 3.0%</span>
                        </div>
                        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                          <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Aggregate Vegetable Loss</span>
                          <span className="block text-xl font-black text-emerald-600 mt-1">1.1%</span>
                          <span className="block text-[8px] text-zinc-400 mt-1">Target: &lt; 2.5%</span>
                        </div>
                        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                          <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest">FEFO Shrinkage Prevention</span>
                          <span className="block text-xl font-black text-blue-600 mt-1">94.8%</span>
                          <span className="block text-[8px] text-zinc-400 mt-1">Efficiency index</span>
                        </div>
                      </div>

                      {/* Chart visual */}
                      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4">
                        <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Wastage / Return Reasons Breakdown (Last 30 Days)</span>
                        <div className="space-y-3">
                          {[
                            { reason: 'Damaged Packaging', count: 18, color: 'bg-amber-500', pct: 45 },
                            { reason: 'Temperature Abuse', count: 12, color: 'bg-rose-500', pct: 30 },
                            { reason: 'Expired / Harvest Decay', count: 6, color: 'bg-purple-500', pct: 15 },
                            { reason: 'Wrong Delivery Rejections', count: 4, color: 'bg-blue-500', pct: 10 }
                          ].map(item => (
                            <div key={item.reason} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-semibold text-zinc-650 dark:text-zinc-450">
                                <span>{item.reason} ({item.count} occurrences)</span>
                                <span>{item.pct}%</span>
                              </div>
                              <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                                <div style={{ width: `${item.pct}%` }} className={`${item.color} h-full rounded-full`} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Page 2: Cold Chain Page */}
                  {pbiPage === 'coldchain' && (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <span className="block text-[10px] font-bold text-zinc-405 uppercase tracking-widest mb-3">Live Cold Room Deflux & Alerts Index</span>
                        <div className="space-y-3 font-sans">
                          {[
                            { name: 'Cold Room 1 (Apple/Berry)', temp: '1.8°C', target: '0-3°C', health: 'Normal', color: 'bg-emerald-500' },
                            { name: 'Cold Room 2 (Citrus/Ripening)', temp: '5.2°C', target: '4-8°C', health: 'Normal', color: 'bg-emerald-500' },
                            { name: 'Deep Freezer (Greens)', temp: '2.5°C', target: '-2-1°C', health: 'High Alert', color: 'bg-rose-500 animate-pulse' },
                            { name: 'Ambient Stage Area', temp: '17.5°C', target: '15-22°C', health: 'Normal', color: 'bg-emerald-500' }
                          ].map(cr => (
                            <div key={cr.name} className="border border-zinc-150 dark:border-zinc-850 p-2.5 rounded-lg flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${cr.color}`} />
                                <span className="font-bold text-zinc-800 dark:text-zinc-250">{cr.name}</span>
                              </div>
                              <div className="flex gap-6 text-zinc-450">
                                <span>Temp: <span className="font-mono font-bold text-zinc-705 dark:text-white">{cr.temp}</span></span>
                                <span>Target: <span className="font-mono">{cr.target}</span></span>
                                <span className="font-bold uppercase tracking-wider">{cr.health}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <span className="block text-[10px] font-bold text-zinc-405 uppercase tracking-widest mb-2">Transit Cold Chain Compliance Log</span>
                        <p className="text-[10px] text-zinc-450 leading-normal font-light">
                          98.2% of vehicles check-in with container temperatures within compliance guidelines. Outliers logged automatically.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Page 3: Efficiency Page */}
                  {pbiPage === 'efficiency' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                          <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Average Inbound GRN Cycle Time</span>
                          <span className="block text-2xl font-black text-zinc-800 dark:text-white">42 mins</span>
                          <span className="block text-[9px] text-zinc-400 mt-1">Vehicle check-in to Put-away complete</span>
                        </div>
                        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-805 rounded-xl p-4">
                          <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Outbound Picking Cycle Time</span>
                          <span className="block text-2xl font-black text-zinc-800 dark:text-white">28 mins</span>
                          <span className="block text-[9px] text-zinc-400 mt-1">SO confirmation to Dispatch gatepass</span>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                        <span className="block text-[10px] font-bold text-zinc-405 uppercase tracking-widest mb-2">Daily Wave Picking Success Index</span>
                        <div className="w-full bg-zinc-150 dark:bg-zinc-850 h-8 rounded-lg overflow-hidden flex font-mono text-[10px] text-white font-bold text-center">
                          <div className="bg-emerald-600 w-[85%] flex items-center justify-center">On-Time (85%)</div>
                          <div className="bg-amber-500 w-[10%] flex items-center justify-center">Delayed (10%)</div>
                          <div className="bg-rose-500 w-[5%] flex items-center justify-center">Miss (5%)</div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Simulated Power BI Footer */}
                <div className="bg-[#eae9e8] dark:bg-[#252423] border-t border-zinc-300 dark:border-zinc-800 px-4 py-1.5 flex justify-between items-center text-[10px] text-zinc-450">
                  <span>Page 1 of 1</span>
                  <span>Microsoft Power BI Embedded</span>
                </div>
              </div>

              {/* Gateway Configuration & Terminal Console (4 columns) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Gateway config panel */}
                <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-2">
                    <Settings className="h-4.5 w-4.5 text-zinc-405" />
                    <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-250 uppercase tracking-widest">Gateway Configuration</h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-1">DirectQuery scheduled refresh</label>
                      <select
                        value={scheduledSync}
                        onChange={(e) => setScheduledSync(e.target.value)}
                        className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded p-1.5 font-semibold text-zinc-700 dark:text-zinc-300"
                      >
                        <option value="15m">Every 15 Minutes (Recommended)</option>
                        <option value="1h">Hourly Interval</option>
                        <option value="1d">Daily Scheduled Refresh</option>
                        <option value="none">Manual Sync Only</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 border-t border-zinc-150 dark:border-zinc-800 pt-3">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Gateway Connector:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Connection Mode:</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-350">DirectQuery (Live)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">DirectQuery Latency:</span>
                        <span className="font-mono font-bold text-zinc-705 dark:text-zinc-350">120 ms</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gateway Terminal Console */}
                <div className="border border-zinc-200 dark:border-zinc-800 bg-[#09090b] text-[#38bdf8] font-mono rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-zinc-900 border-b border-zinc-850 px-3 py-1.5 flex justify-between items-center text-[10px] text-zinc-400 font-sans">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5" />
                      <span>Power BI Sync Console Log</span>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>

                  <div className="p-3 text-[10px] space-y-2 h-[220px] overflow-y-auto leading-relaxed select-text">
                    {syncLogs.map((log, idx) => (
                      <div key={idx} className="whitespace-pre-wrap">
                        {log.startsWith('Ready') ? (
                          <span className="text-[#a1a1aa]">{log}</span>
                        ) : log.includes('Sync Completed') ? (
                          <span className="text-emerald-400 font-bold">{log}</span>
                        ) : log.includes('Step') ? (
                          <span className="text-yellow-400 font-bold">{log}</span>
                        ) : log.startsWith('-') ? (
                          <span className="text-[#a1a1aa] pl-3">{log}</span>
                        ) : (
                          <span>{log}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        ) : reportType === 'ageing' ? (
          // Ageing distribution report (tab 2 graphical)
          <div className="space-y-8 py-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">FEFO Freshness Ageing Distribution</h3>
              <span className="text-[10px] text-zinc-400">Total warehouse stock grouped by time elapsed since harvest/packaging date.</span>
            </div>

            {/* Ageing Bars */}
            <div className="space-y-6 max-w-2xl">
              
              {/* Fresh */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-zinc-650 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>Fresh Stock (&lt; 5 Days)</span>
                  <span className="font-mono text-zinc-850 dark:text-zinc-100">{ageingStats.fresh} Units</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-4 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min((ageingStats.fresh / (inventory.reduce((s, i) => s + i.qty, 0) || 1)) * 100, 100)}%` }}
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  ></div>
                </div>
              </div>

              {/* Mid */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-zinc-650 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>Intermediate (5-12 Days)</span>
                  <span className="font-mono text-zinc-850 dark:text-zinc-100">{ageingStats.mid} Units</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-4 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min((ageingStats.mid / (inventory.reduce((s, i) => s + i.qty, 0) || 1)) * 100, 100)}%` }}
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  ></div>
                </div>
              </div>

              {/* Critical */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-zinc-650 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>Critical (FEFO Priority; &gt; 12 Days)</span>
                  <span className="font-mono text-zinc-850 dark:text-zinc-100">{ageingStats.critical} Units</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-4 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min((ageingStats.critical / (inventory.reduce((s, i) => s + i.qty, 0) || 1)) * 100, 100)}%` }}
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  ></div>
                </div>
              </div>

            </div>

            {/* Explanation box */}
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl p-4 max-w-2xl text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
              <span className="font-bold text-zinc-900 dark:text-zinc-50 block mb-1">FEFO Execution Logic Note:</span>
              The system automatically pushes any stock categorized in the <span className="font-bold text-rose-500">Critical Ageing</span> tier to picking wave allocations first. This minimizes shipping wastage and guarantees optimal product shelf-life rotation at customer retail hubs.
            </div>

          </div>
        ) : (
          <div className="overflow-x-auto">
            {filteredList.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-xs">
                No matching transactional records found. Try modifying date bounds or query.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-bold text-zinc-500 uppercase tracking-wider text-[9px]">
                    {Object.keys(filteredList[0]).map(header => (
                      <th key={header} className="p-3">{header.replace(/([A-Z])/g, ' $1').trim()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {filteredList.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                      {Object.values(row).map((val, cellIdx) => (
                        <td key={cellIdx} className="p-3 font-medium text-zinc-850 dark:text-zinc-300 max-w-[200px] truncate">
                          {val !== null && val !== undefined ? val.toString() : 'NA'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  )}

</div>
);
}
