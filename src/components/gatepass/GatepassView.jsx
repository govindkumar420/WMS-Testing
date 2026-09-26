import React, { useContext, useState, useMemo } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  History,
  Thermometer,
  FileText,
  Navigation,
  X,
  Play,
  RotateCcw,
  List,
  LayoutGrid,
  ArrowRight,
  Trash2,
  Boxes,
  Layers,
  Filter,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function GatepassView() {
  const {
    vehicles,
    setVehicles,
    purchaseOrders,
    salesOrders,
    customers,
    vendors,
    activeTabs,
    setActiveTabs,
    logAction
  } = useContext(WmsDataContext);

  const activeTab = activeTabs.gatepass || 'pending_vehicle';
  const setActiveTab = (tab) => {
    setActiveTabs(prev => ({ ...prev, gatepass: tab }));
  };

  // State for Gate Entry Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [transporter, setTransporter] = useState('');
  const [processType, setProcessType] = useState('Inbound');
  const [bookingType, setBookingType] = useState('PO Material');
  const [bookingRefDocNo, setBookingRefDocNo] = useState('');
  const [inKmReading, setInKmReading] = useState('');
  const [initTemp, setInitTemp] = useState('3.5');
  const [remark, setRemark] = useState('');
  const [gateSearch, setGateSearch] = useState('');
  const [checkoutViewMode, setCheckoutViewMode] = useState('table'); // 'table' | 'grid'

  // Crate logs states
  const [customerCrates, setCustomerCrates] = useState([
    { id: 'CRT-001', customer: 'Radhe Enterprise Retail', qty: 45, date: '2026-08-16', status: 'Cleaned & Restocked' },
    { id: 'CRT-002', customer: 'Star Hypermarket Ltd', qty: 120, date: '2026-08-17', status: 'Pending Sanitization' }
  ]);
  const [newCrateCust, setNewCrateCust] = useState('');
  const [newCrateQty, setNewCrateQty] = useState('');
  const [newCrateStatus, setNewCrateStatus] = useState('Pending Sanitization');
  const [crateSearch, setCrateSearch] = useState('');
  const [crateStatusFilter, setCrateStatusFilter] = useState('ALL');

  // Crate stats
  const crateStats = useMemo(() => {
    const totalLogs = customerCrates.length;
    const totalQty = customerCrates.reduce((sum, c) => sum + (Number(c.qty) || 0), 0);
    const cleanedQty = customerCrates.filter(c => c.status === 'Cleaned & Restocked').reduce((sum, c) => sum + (Number(c.qty) || 0), 0);
    const pendingQty = customerCrates.filter(c => c.status !== 'Cleaned & Restocked').reduce((sum, c) => sum + (Number(c.qty) || 0), 0);
    return { totalLogs, totalQty, cleanedQty, pendingQty };
  }, [customerCrates]);

  // Filtered crate logs
  const filteredCrates = useMemo(() => {
    const query = crateSearch.toLowerCase();
    return customerCrates.filter(c => {
      const matchSearch = c.id.toLowerCase().includes(query) || c.customer.toLowerCase().includes(query);
      const matchStatus = crateStatusFilter === 'ALL' || c.status === crateStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [customerCrates, crateSearch, crateStatusFilter]);

  const toggleCrateStatus = (id) => {
    setCustomerCrates(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'Cleaned & Restocked' ? 'Pending Sanitization' : 'Cleaned & Restocked';
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const deleteCrateLog = (id) => {
    setCustomerCrates(prev => prev.filter(c => c.id !== id));
  };

  // Stats
  const stats = useMemo(() => {
    const inside = vehicles.filter(v => v.status !== 'Closed').length;
    const completed = vehicles.filter(v => v.status === 'Closed').length;
    const inbound = vehicles.filter(v => v.processType === 'Inbound' && v.status !== 'Closed').length;
    const outbound = vehicles.filter(v => v.processType === 'Outbound' && v.status !== 'Closed').length;
    return { inside, completed, inbound, outbound };
  }, [vehicles]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    const query = gateSearch.toLowerCase();
    return vehicles.filter(v =>
      v.vehicleNo.toLowerCase().includes(query) ||
      v.driverName.toLowerCase().includes(query) ||
      v.transporter.toLowerCase().includes(query)
    );
  }, [vehicles, gateSearch]);

  const activeVehicles = useMemo(() => filteredVehicles.filter(v => v.status !== 'Closed'), [filteredVehicles]);
  const closedVehicles = useMemo(() => filteredVehicles.filter(v => v.status === 'Closed'), [filteredVehicles]);

  const handleRegisterGateIn = (e) => {
    e.preventDefault();
    if (!vehicleNo || !driverName || !bookingRefDocNo) {
      alert('Please fill out all required fields.');
      return;
    }

    const gpNo = `GP-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const newVehicle = {
      id: `VEH-${Date.now()}`,
      vehicleNo: vehicleNo.toUpperCase(),
      driverName,
      transporter: transporter || 'Self Transport',
      gatepassNo: gpNo,
      processType,
      bookingType,
      bookingRefDocNo,
      inDateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      outDateTime: '',
      inKmReading: Number(inKmReading) || 10000,
      outKmReading: '',
      status: 'Gate In',
      remark: remark || 'Vehicle registered at main gate',
      tempLog: [Number(initTemp) || 4.0]
    };

    setVehicles([newVehicle, ...vehicles]);
    logAction(`Registered Gate-In for vehicle: ${newVehicle.vehicleNo} (Gatepass: ${gpNo})`, 'Gatepass');
    alert(`Gatepass ${gpNo} generated successfully!`);

    // Reset drawer state
    setDrawerOpen(false);
    setVehicleNo('');
    setDriverName('');
    setTransporter('');
    setBookingRefDocNo('');
    setInKmReading('');
    setInitTemp('3.5');
    setRemark('');
  };

  const handleGateOut = (id, outKm) => {
    if (!outKm) {
      alert('Please enter OUT KM Reading before checkout.');
      return;
    }
    const updated = vehicles.map(v => {
      if (v.id === id) {
        return {
          ...v,
          outKmReading: Number(outKm),
          outDateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'Closed'
        };
      }
      return v;
    });
    setVehicles(updated);
    const targetVeh = vehicles.find(v => v.id === id);
    logAction(`Cleared Gate-Out check for vehicle: ${targetVeh?.vehicleNo}`, 'Gatepass');
    alert(`Vehicle ${targetVeh?.vehicleNo} checked out successfully.`);
  };

  const addCrateLog = (e) => {
    e.preventDefault();
    if (!newCrateCust || !newCrateQty) return;
    const newLog = {
      id: `CRT-${Date.now().toString().substring(8)}`,
      customer: newCrateCust,
      qty: Number(newCrateQty),
      date: new Date().toISOString().split('T')[0],
      status: newCrateStatus || 'Pending Sanitization'
    };
    setCustomerCrates([newLog, ...customerCrates]);
    logAction(`Received ${newCrateQty} empty crates from ${newCrateCust} (${newLog.status})`, 'Store');
    setNewCrateCust('');
    setNewCrateQty('');
    setNewCrateStatus('Pending Sanitization');
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6 animate-in fade-in-50 duration-200">

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Security Gatepass Operations</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Register vehicle yard arrivals, generate gatepasses, manage transport slips, and oversee security dispatch logs.</p>
        </div>

        {activeTab === 'pending_vehicle' && (
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 text-xs transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>New Gate Entry</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-1 overflow-x-auto pb-px">
        {[
          { id: 'pending_vehicle', label: 'Yard Arrival Queue', icon: Truck },
          { id: 'pending_gateout', label: 'Pending Gate-Out Checkout', icon: CheckCircle2 },
          { id: 'vehicle_summary', label: 'Gate Entry Logs (History)', icon: History },
          { id: 'vehicle_tracking', label: 'Live Reefer GPS Tracking', icon: Navigation },
          { id: 'empty_crates', label: 'Empty Crate Return Log', icon: RotateCcw }
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

        {/* TAB 1: Yard Arrival Queue */}
        {activeTab === 'pending_vehicle' && (
          <div className="space-y-6">

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Vehicles in Yard</span>
                <span className="text-2xl font-black block mt-1">{stats.inside}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Inbound Trucks</span>
                <span className="text-2xl font-black block text-sky-600 mt-1">{stats.inbound}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Outbound Trucks</span>
                <span className="text-2xl font-black block text-amber-600 mt-1">{stats.outbound}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Completed Dispatches</span>
                <span className="text-2xl font-black block text-emerald-600 mt-1">{stats.completed}</span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search active yard vehicles by vehicle number or driver..."
                  value={gateSearch}
                  onChange={(e) => setGateSearch(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Active Trucks Table */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold">
                  <tr>
                    <th className="p-3">Gatepass No</th>
                    <th className="p-3">Vehicle No</th>
                    <th className="p-3">Driver & Carrier</th>
                    <th className="p-3">In Temp / KM</th>
                    <th className="p-3">Process / Link</th>
                    <th className="p-3">Gate-In Time</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {activeVehicles.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-zinc-400 font-medium">No active vehicles checked in the yard.</td>
                    </tr>
                  ) : (
                    activeVehicles.map(v => (
                      <tr key={v.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                        <td className="p-3 font-mono font-bold text-emerald-600">{v.gatepassNo}</td>
                        <td className="p-3 font-mono font-bold">{v.vehicleNo}</td>
                        <td className="p-3">
                          <span className="font-semibold block">{v.driverName}</span>
                          <span className="text-[10px] text-zinc-400 block">{v.transporter}</span>
                        </td>
                        <td className="p-3">
                          <span className="block font-mono font-bold text-amber-600">{v.tempLog[0] || 'NA'}°C</span>
                          <span className="text-[10px] text-zinc-400 font-mono block">{v.inKmReading} KM</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold block">{v.processType}</span>
                          <span className="text-[10px] text-zinc-400 font-mono block">{v.bookingRefDocNo}</span>
                        </td>
                        <td className="p-3 font-mono text-zinc-500">{v.inDateTime}</td>
                        <td className="p-3 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-200 dark:border-amber-900/30">
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 2: Pending Gate-Out Checkout */}
        {activeTab === 'pending_gateout' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Clear Vehicles for Gate-Out</h3>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
                  Log checkout readings to unlock vehicles and clear them from yard logs.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    checkoutViewMode === 'table'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                  title="Table Row View"
                >
                  <List className="h-3.5 w-3.5" />
                  <span>Row View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    checkoutViewMode === 'grid'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Card Grid</span>
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search vehicles pending checkout by vehicle no, gatepass, driver..."
                  value={gateSearch}
                  onChange={(e) => setGateSearch(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* View Mode: Row / Table View */}
            {checkoutViewMode === 'table' ? (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3.5">Vehicle & Gatepass</th>
                        <th className="p-3.5">Process / Link</th>
                        <th className="p-3.5">Driver & Carrier</th>
                        <th className="p-3.5">Check-In / KM</th>
                        <th className="p-3.5">Reefer Temp</th>
                        <th className="p-3.5 min-w-[280px]">Gate-Out Checkout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-[#0c0c0f]">
                      {activeVehicles.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-16 text-zinc-400 font-medium">
                            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                            No checked-in vehicles are currently awaiting gate-out checkout.
                          </td>
                        </tr>
                      ) : (
                        activeVehicles.map(v => {
                          const defaultOutKm = (Number(v.inKmReading) || 0) + 15;
                          const latestTemp = v.tempLog && v.tempLog.length > 0 ? v.tempLog[v.tempLog.length - 1] : 'NA';
                          const checkInTime = v.inDateTime ? (v.inDateTime.split(' ')[1] || v.inDateTime) : 'NA';

                          return (
                            <tr key={v.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30 transition-colors">
                              <td className="p-3.5">
                                <span className="text-sm font-black font-mono text-zinc-900 dark:text-zinc-100 block">{v.vehicleNo}</span>
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold block">{v.gatepassNo}</span>
                              </td>
                              <td className="p-3.5">
                                <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold ${
                                  v.processType === 'Inbound'
                                    ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50'
                                    : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                }`}>
                                  {v.processType} Link: {v.bookingRefDocNo}
                                </span>
                                <span className="text-[10px] text-zinc-400 block mt-1">{v.bookingType || 'Standard'}</span>
                              </td>
                              <td className="p-3.5">
                                <span className="font-bold text-zinc-800 dark:text-zinc-200 block text-xs">{v.driverName}</span>
                                <span className="text-[10px] text-zinc-400 block">{v.transporter || 'Self Transport'}</span>
                              </td>
                              <td className="p-3.5">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 font-mono">
                                    <Clock className="h-3 w-3 text-zinc-400" />
                                    <span>{checkInTime}</span>
                                  </div>
                                  <span className="text-[10px] text-zinc-400 font-mono block">In: {v.inKmReading} KM</span>
                                </div>
                              </td>
                              <td className="p-3.5">
                                <div className="flex items-center gap-1.5">
                                  <Thermometer className="h-3.5 w-3.5 text-emerald-500" />
                                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                    {latestTemp}°C
                                  </span>
                                </div>
                              </td>
                              <td className="p-3.5">
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    const outKmVal = e.target.outKm.value;
                                    handleGateOut(v.id, outKmVal);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <div className="relative flex-1">
                                    <input
                                      type="number"
                                      name="outKm"
                                      placeholder="Out KM..."
                                      defaultValue={defaultOutKm}
                                      required
                                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <span className="absolute right-2.5 top-1.5 text-[10px] text-zinc-400 font-bold pointer-events-none">KM</span>
                                  </div>
                                  <button
                                    type="submit"
                                    className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-sm whitespace-nowrap"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Gateout Clear</span>
                                  </button>
                                </form>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* View Mode: Card Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeVehicles.map(v => {
                  let defaultOutKm = (Number(v.inKmReading) || 0) + 15;
                  return (
                    <div key={v.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-zinc-50/20 dark:bg-zinc-900/10 space-y-4 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-base font-black font-mono block">{v.vehicleNo}</span>
                            <span className="text-[10px] text-emerald-600 font-mono block">{v.gatepassNo}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            v.processType === 'Inbound'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/20 dark:text-sky-400'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                          }`}>
                            {v.processType} Link: {v.bookingRefDocNo}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs border-y border-zinc-100 dark:border-zinc-800 py-3 mt-2">
                          <div>
                            <span className="text-[10px] text-zinc-400 block">Driver Name:</span>
                            <span className="font-bold">{v.driverName}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-400 block">In KM Reading:</span>
                            <span className="font-semibold font-mono">{v.inKmReading} KM</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-[10px] text-zinc-400 block">Check-In Time:</span>
                            <span className="font-mono">{v.inDateTime ? (v.inDateTime.split(' ')[1] || v.inDateTime) : 'NA'}</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-[10px] text-zinc-400 block">Temperature Log:</span>
                            <span className="font-bold font-mono text-emerald-600">{v.tempLog[v.tempLog.length - 1] || 'NA'}°C</span>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const outKmVal = e.target.outKm.value;
                        handleGateOut(v.id, outKmVal);
                      }} className="flex gap-2 mt-2">
                        <input
                          type="number"
                          name="outKm"
                          placeholder="Enter Out KM Reading..."
                          defaultValue={defaultOutKm}
                          required
                          className="flex-1 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
                        >
                          Gateout Clear
                        </button>
                      </form>
                    </div>
                  );
                })}

                {activeVehicles.length === 0 && (
                  <div className="col-span-2 text-center py-20 text-zinc-400 font-medium">
                    No checked-in vehicles are currently awaiting checkout.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Gate Entry Logs (History) */}
        {activeTab === 'vehicle_summary' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold">Historical Gate Register Logs</h3>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold">
                  <tr>
                    <th className="p-3">Gatepass No</th>
                    <th className="p-3">Vehicle No</th>
                    <th className="p-3">Carrier / Driver</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Gate-In</th>
                    <th className="p-3">Gate-Out</th>
                    <th className="p-3 text-right">In KM</th>
                    <th className="p-3 text-right">Out KM</th>
                    <th className="p-3">Logs Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {closedVehicles.map(v => (
                    <tr key={v.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 text-zinc-600 dark:text-zinc-350">
                      <td className="p-3 font-mono font-bold text-zinc-400">{v.gatepassNo}</td>
                      <td className="p-3 font-mono font-bold text-zinc-800 dark:text-zinc-200">{v.vehicleNo}</td>
                      <td className="p-3">
                        <span className="font-semibold block text-zinc-800 dark:text-zinc-200">{v.driverName}</span>
                        <span className="text-[10px] text-zinc-450 block">{v.transporter}</span>
                      </td>
                      <td className="p-3">{v.processType} ({v.bookingType})</td>
                      <td className="p-3 font-mono">{v.inDateTime}</td>
                      <td className="p-3 font-mono">{v.outDateTime || 'NA'}</td>
                      <td className="p-3 text-right font-mono">{v.inKmReading}</td>
                      <td className="p-3 text-right font-mono">{v.outKmReading || 'NA'}</td>
                      <td className="p-3 truncate max-w-[200px]" title={v.remark}>{v.remark}</td>
                    </tr>
                  ))}

                  {closedVehicles.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center py-10 text-zinc-400">No historical checkout records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Live Reefer GPS Tracking */}
        {activeTab === 'vehicle_tracking' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Simulated GPS Fleet Tracker</h3>
              <span className="text-xs text-zinc-550 block">Real-time GPS status of cold-chain vehicles and reefers on route.</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Fleet status cards */}
              <div className="lg:col-span-1 space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {vehicles.map(v => (
                  <div key={v.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/40 dark:bg-zinc-900/20 space-y-2 hover:border-emerald-500/50 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-xs">{v.vehicleNo}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${v.status === 'Closed' ? 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20'
                        }`}>
                        {v.status === 'Closed' ? 'At Destination' : 'Transit Active'}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-500 space-y-1 mt-2">
                      <div className="flex justify-between">
                        <span>Route Link:</span>
                        <span className="font-bold">{v.bookingRefDocNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Driver Name:</span>
                        <span className="font-semibold">{v.driverName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Live Reefer Temp:</span>
                        <span className="font-mono font-bold text-emerald-600">{v.tempLog[v.tempLog.length - 1] || '3.5'}°C</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* GPS Tracker Map */}
              <div className="lg:col-span-2 bg-zinc-900 dark:bg-black rounded-xl p-6 relative min-h-[350px] flex flex-col justify-between overflow-hidden shadow-inner border border-zinc-800">

                {/* Simulated GPS grid */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="relative z-10 flex justify-between items-start text-xs text-white">
                  <div>
                    <span className="font-bold text-emerald-500 block uppercase tracking-wider text-[10px]">Reefer Fleet Map</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">3 reefers active within Gujarat logistics corridor</span>
                  </div>
                  <div className="bg-emerald-950/40 border border-emerald-900/60 px-2 py-1 rounded text-emerald-400 text-[10px]">
                    ● GPS Satellites Connected (8)
                  </div>
                </div>

                {/* Simulated Routes */}
                <div className="relative h-64 flex items-center justify-center">

                  {/* Ahmedabad route dot */}
                  <div className="absolute top-1/4 left-1/3 text-center animate-pulse">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block" />
                    <span className="block text-[8px] font-mono text-zinc-450 mt-1 font-bold">Ahmedabad (AMD-02)</span>
                  </div>

                  {/* Jamnagar Main Hub route dot */}
                  <div className="absolute bottom-1/3 left-1/4 text-center">
                    <span className="w-3 h-3 bg-amber-500 rounded-full inline-block animate-ping" />
                    <span className="block text-[8px] font-mono text-zinc-450 mt-1 font-bold">Jamnagar (WH-01)</span>
                  </div>

                  {/* Carrier truck active track line */}
                  <svg className="absolute inset-0 w-full h-full opacity-60 pointer-events-none">
                    <path d="M 120, 80 Q 200, 150 250, 180" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="5" />
                    <path d="M 250, 180 Q 320, 200 420, 140" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5" />
                  </svg>

                </div>

                <div className="relative z-10 text-[9px] text-zinc-400 flex justify-between border-t border-zinc-800/80 pt-4">
                  <span>Zoom Level: Auto (State Highway Grid)</span>
                  <span>Update cycle: 10s</span>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 5: Empty Crate Return Log */}
        {activeTab === 'empty_crates' && (
          <div className="space-y-6">

            {/* Top Row: Inline Registration Card spanning 100% width */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-zinc-50/50 dark:bg-zinc-900/20 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-200/70 dark:border-zinc-800/80 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Log Empty Crates Gate-In</h3>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Audit and register incoming customer/vendor returns of plastic logistic crates.</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-zinc-400">Total Inward Batches:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/40">
                    {crateStats.totalLogs} Logs ({crateStats.totalQty} pcs)
                  </span>
                </div>
              </div>

              <form onSubmit={addCrateLog} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                <div className="lg:col-span-5 space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Customer / Vendor Partner</label>
                  <input
                    type="text"
                    list="crate-partners-list"
                    placeholder="Search or enter customer/vendor (e.g. Radhe Enterprise Retail)..."
                    value={newCrateCust}
                    onChange={(e) => setNewCrateCust(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-medium"
                  />
                  <datalist id="crate-partners-list">
                    {(customers || []).map(c => <option key={c.id} value={c.name} />)}
                    {(vendors || []).map(v => <option key={v.id} value={v.name} />)}
                    <option value="Radhe Enterprise Retail" />
                    <option value="Star Hypermarket Ltd" />
                    <option value="Apex Supermarket" />
                  </datalist>
                </div>

                <div className="lg:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Returned Crate Qty</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 50"
                      value={newCrateQty}
                      onChange={(e) => setNewCrateQty(e.target.value)}
                      required
                      className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-3 pr-10 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-zinc-400 font-bold pointer-events-none">PCS</span>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Initial Status</label>
                  <select
                    value={newCrateStatus}
                    onChange={(e) => setNewCrateStatus(e.target.value)}
                    className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 font-medium"
                  >
                    <option value="Pending Sanitization">Pending Sanitization</option>
                    <option value="Cleaned & Restocked">Cleaned & Restocked</option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-2 px-4 rounded-lg text-xs transition-all shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Register Crates</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Stats Badges Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total Inward Logs</span>
                <span className="text-xl font-black block mt-0.5 font-mono text-zinc-900 dark:text-zinc-100">{crateStats.totalLogs}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total Crates Received</span>
                <span className="text-xl font-black block mt-0.5 font-mono text-zinc-900 dark:text-zinc-100">{crateStats.totalQty} <span className="text-xs font-normal text-zinc-400">pcs</span></span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Cleaned & Restocked</span>
                <span className="text-xl font-black block mt-0.5 font-mono text-emerald-600 dark:text-emerald-400">{crateStats.cleanedQty} <span className="text-xs font-normal text-zinc-400">pcs</span></span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Pending Sanitization</span>
                <span className="text-xl font-black block mt-0.5 font-mono text-amber-600 dark:text-amber-400">{crateStats.pendingQty} <span className="text-xs font-normal text-zinc-400">pcs</span></span>
              </div>
            </div>

            {/* Table Area spanning 100% full width */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Crates Inward Register Logs</h4>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Audit trail of empty crate returns received at the gate.</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[220px]">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search partner or Log ID..."
                      value={crateSearch}
                      onChange={(e) => setCrateSearch(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
                    {['ALL', 'Cleaned & Restocked', 'Pending Sanitization'].map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setCrateStatusFilter(f)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                          crateStatusFilter === f
                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm font-bold'
                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        {f === 'ALL' ? 'All' : f === 'Cleaned & Restocked' ? 'Cleaned' : 'Pending'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full Width Table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3.5">Log ID</th>
                        <th className="p-3.5">Client / Vendor Partner</th>
                        <th className="p-3.5 text-right">Returned Qty</th>
                        <th className="p-3.5">Log Date</th>
                        <th className="p-3.5 text-center">Sanitization Status</th>
                        <th className="p-3.5 text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-[#0c0c0f]">
                      {filteredCrates.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-16 text-zinc-400 font-medium">
                            <Boxes className="h-8 w-8 mx-auto mb-2 text-zinc-400 opacity-60" />
                            No empty crate return logs found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredCrates.map(c => {
                          const isCleaned = c.status === 'Cleaned & Restocked';
                          return (
                            <tr key={c.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30 transition-colors">
                              <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                {c.id}
                              </td>
                              <td className="p-3.5 font-semibold text-zinc-900 dark:text-zinc-100">
                                {c.customer}
                              </td>
                              <td className="p-3.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                {c.qty} <span className="text-[10px] font-normal text-zinc-400 font-sans">pcs</span>
                              </td>
                              <td className="p-3.5 font-mono text-zinc-600 dark:text-zinc-400">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                                  <span>{c.date}</span>
                                </div>
                              </td>
                              <td className="p-3.5 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                  isCleaned
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                                    : 'bg-amber-50 dark:bg-amber-955/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
                                }`}>
                                  {isCleaned ? (
                                    <CheckCircle2 className="h-3 w-3" />
                                  ) : (
                                    <RotateCcw className="h-3 w-3" />
                                  )}
                                  <span>{c.status}</span>
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleCrateStatus(c.id)}
                                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border ${
                                      isCleaned
                                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                                    }`}
                                    title={isCleaned ? "Mark as Pending Sanitization" : "Mark as Cleaned & Restocked"}
                                  >
                                    {isCleaned ? "Mark Pending" : "Mark Cleaned"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteCrateLog(c.id)}
                                    className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                    title="Delete Log Entry"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
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

          </div>
        )}

      </div>

      {/* Centered Modal Dialog for registering Gate Entry (Gate-In) */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0c0c0f] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 space-y-5">

            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-zinc-150 dark:border-zinc-800 pb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Register Vehicle Check-In
                </h3>
                <span className="text-[10px] text-zinc-400 block">
                  Record vehicle security arrival log, driver details, and gatepass.
                </span>
              </div>
            </div>

            <form onSubmit={handleRegisterGateIn} className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="e.g. GJ01MT9901"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    required
                    className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">Driver Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Singh"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    required
                    className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">Transporter / Carrier</label>
                  <input
                    type="text"
                    placeholder="e.g. Gnosis Logistics"
                    value={transporter}
                    onChange={(e) => setTransporter(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">Process Type</label>
                  <select
                    value={processType}
                    onChange={(e) => setProcessType(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="Inbound">Inbound (Material In)</option>
                    <option value="Outbound">Outbound (Dispatch Out)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">Booking Type</label>
                  <select
                    value={bookingType}
                    onChange={(e) => {
                      setBookingType(e.target.value);
                      setBookingRefDocNo('');
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="PO Material">PO Material (Inbound)</option>
                    <option value="Sales Dispatch">Sales Dispatch (Outbound)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">Ref Doc Number (PO/SO)</label>
                  <select
                    value={bookingRefDocNo}
                    onChange={(e) => setBookingRefDocNo(e.target.value)}
                    required
                    className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="">Select Reference...</option>
                    {bookingType === 'PO Material'
                      ? purchaseOrders.map(po => <option key={po.id} value={po.poNo}>{po.poNo}</option>)
                      : salesOrders.map(so => <option key={so.id} value={so.orderNo}>{so.orderNo}</option>)
                    }
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">Inbound Kgs</label>
                  <input
                    type="number"
                    placeholder="e.g. 45000"
                    value={inKmReading}
                    onChange={(e) => setInKmReading(e.target.value)}
                    required
                    className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block">Initial Reefer Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={initTemp}
                    onChange={(e) => setInitTemp(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase block">Remarks / Notes</label>
                <textarea
                  rows="3"
                  placeholder="Enter security checklist details..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="w-1/3 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl py-2.5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <span>Check-In Vehicle</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
