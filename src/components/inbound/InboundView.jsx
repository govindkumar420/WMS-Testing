import React, { useContext, useState, useMemo } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import {
  Truck,
  FileText,
  ShieldCheck,
  ArrowRight,
  Layers,
  Search,
  Plus,
  QrCode,
  Calendar,
  Thermometer,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Check,
  Clock,
  ArrowDownToLine,
  Sliders,
  X,
  FileSpreadsheet,
  Package
} from 'lucide-react';

export default function InboundView() {
  const {
    vehicles,
    purchaseOrders,
    vendors,
    products,
    locations,
    inventory,
    registerVehicle,
    closeVehicleEntry,
    processGRN,
    confirmPutaway,
    executeFullPoAutoWorkflow,
    logAction
  } = useContext(WmsDataContext);

  const context = useContext(WmsDataContext);
  const { activeTabs, setActiveTabs } = context;
  const activeTab = activeTabs.inbound || 'workflow';
  const setActiveTab = (tab) => {
    setActiveTabs(prev => ({ ...prev, inbound: tab }));
  };

  const [stockSearch, setStockSearch] = useState('');
  const [grnSearch, setGrnSearch] = useState('');
  const [inwardPoSearch, setInwardPoSearch] = useState('');

  // 1. Receiving Dock States
  const [selectedPoNo, setSelectedPoNo] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [transporter, setTransporter] = useState('');
  const [sealNo, setSealNo] = useState('');
  const [kmReading, setKmReading] = useState('');

  // 2. QC States
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [qcItems, setQcItems] = useState([]);

  // 3. Putaway States
  const [activeLabelItem, setActiveLabelItem] = useState(null);

  // 4. 8-Stage Interactive Inward Process Wizard States
  const [activeWorkflowPo, setActiveWorkflowPo] = useState(null);
  const [workflowStep, setWorkflowStep] = useState(1); // 1 to 8
  const [wizardVehicleNo, setWizardVehicleNo] = useState('GJ10TZ9820');
  const [wizardDriverName, setWizardDriverName] = useState('Yogesh Patel');
  const [wizardTransporter, setWizardTransporter] = useState('Gnosis Trans');
  const [wizardSealNo, setWizardSealNo] = useState('SEAL-8821');
  const [wizardDockTemp, setWizardDockTemp] = useState('3.4');
  const [wizardQcGrading, setWizardQcGrading] = useState('Grade A');
  const [wizardQcBrix, setWizardQcBrix] = useState('13.2');
  const [wizardTargetBin, setWizardTargetBin] = useState('A-01-01');
  const [workflowSuccessLog, setWorkflowSuccessLog] = useState(null);

  // 8 Process Steps definition
  const workflowSteps = [
    { num: 1, title: 'Purchase Order', desc: 'Vendor agreement & SKU quota' },
    { num: 2, title: 'Gate Pass', desc: 'Security issuance & authorization' },
    { num: 3, title: 'Vehicle Entry', desc: 'Dock arrival & yard queue' },
    { num: 4, title: 'Material Receiving', desc: 'Unload & pulp temp probe' },
    { num: 5, title: 'GRN Creation', desc: 'Goods Receipt Note & Lots' },
    { num: 6, title: 'QC & Grading', desc: 'Brix analysis & inspection' },
    { num: 7, title: 'Putaway Binning', desc: 'Cold Room / Rack slotting' },
    { num: 8, title: 'Available Stock', desc: 'Live inventory for orders' }
  ];

  // Helper to determine exact stage of any PO in the 8-step lifecycle
  const getPoStageInfo = (po) => {
    const matchingVeh = vehicles.find(v => v.bookingRefDocNo === po.poNo);
    const totalExpected = po.items.reduce((s, i) => s + Number(i.expectedQty), 0);
    const totalReceived = po.items.reduce((s, i) => s + (Number(i.receivedQty) || 0), 0);

    if (po.status === 'Completed' || totalReceived >= totalExpected) {
      return { step: 8, label: '8. Stock Live in Bins', color: 'emerald', badge: 'Live Stock', isComplete: true };
    }
    if (matchingVeh && matchingVeh.status === 'Putaway Pending') {
      return { step: 7, label: '7. Putaway Pending', color: 'cyan', badge: 'Putaway Pending', isComplete: false };
    }
    if (matchingVeh && (matchingVeh.status === 'QC Approved' || matchingVeh.remark.includes('GRN'))) {
      return { step: 6, label: '6. QC Checked / GRN Done', color: 'blue', badge: 'QC Approved', isComplete: false };
    }
    if (matchingVeh && (matchingVeh.status === 'Unloading' || matchingVeh.status === 'Unload Pending')) {
      return { step: 4, label: '4. Material Receiving / Dock', color: 'amber', badge: 'Material Receiving', isComplete: false };
    }
    if (matchingVeh) {
      return { step: 3, label: '3. Vehicle In Yard', color: 'indigo', badge: 'In Yard', isComplete: false };
    }
    if (po.status === 'Approved') {
      return { step: 2, label: '2. Gate Pass Pending', color: 'purple', badge: 'Gate Pass Pending', isComplete: false };
    }
    return { step: 1, label: '1. PO Approved', color: 'zinc', badge: 'PO Approved', isComplete: false };
  };

  // Filters
  const activeInboundVehicles = useMemo(() => {
    return vehicles.filter(v => v.processType === 'Inbound' && v.status !== 'Closed');
  }, [vehicles]);

  const pendingQcVehicles = useMemo(() => {
    return vehicles.filter(v => v.processType === 'Inbound' && (v.status === 'Unload Pending' || v.status === 'QC Pending'));
  }, [vehicles]);

  const grnHistory = useMemo(() => {
    const query = grnSearch.toLowerCase();
    return vehicles.filter(v => 
      v.processType === 'Inbound' && 
      v.remark.includes('GRN') &&
      (v.gatepassNo.toLowerCase().includes(query) || 
       v.vehicleNo.toLowerCase().includes(query) ||
       v.bookingRefDocNo.toLowerCase().includes(query))
    );
  }, [vehicles, grnSearch]);

  const stageAreaItems = useMemo(() => {
    return inventory.filter(item => item.locationCode === 'Stage Area');
  }, [inventory]);

  const filteredStock = useMemo(() => {
    const query = stockSearch.toLowerCase();
    return inventory.filter(item => {
      const prod = products.find(p => p.id === item.productId);
      return (
        item.batchNo.toLowerCase().includes(query) ||
        item.locationCode.toLowerCase().includes(query) ||
        (prod && (prod.code.toLowerCase().includes(query) || prod.description.toLowerCase().includes(query)))
      );
    });
  }, [inventory, stockSearch, products]);

  const filteredInwardPOs = useMemo(() => {
    const query = inwardPoSearch.toLowerCase();
    return purchaseOrders.filter(po => {
      const vendorName = vendors.find(v => v.id === po.vendorId)?.name || '';
      return po.poNo.toLowerCase().includes(query) || vendorName.toLowerCase().includes(query);
    });
  }, [purchaseOrders, inwardPoSearch, vendors]);

  // Handlers
  const handleCheckInSubmit = (e) => {
    e.preventDefault();
    if (!selectedPoNo || !vehicleNo || !driverName) {
      alert('Please fill out all required check-in fields.');
      return;
    }

    const matchedPo = purchaseOrders.find(po => po.poNo === selectedPoNo);
    const supplierName = vendors.find(v => v.id === matchedPo?.vendorId)?.name || 'Direct Vendor';

    const newV = registerVehicle({
      vehicleNo: vehicleNo.toUpperCase(),
      driverName,
      transporter: transporter || 'Direct Cargo',
      inKmReading: Number(kmReading) || 0,
      sealNumber: sealNo || 'N/A',
      processType: 'Inbound',
      bookingType: 'PO Material',
      bookingRefDocNo: selectedPoNo,
      remark: `Yard Check-In. Supplier: ${supplierName}`
    });

    alert(`Gate Pass issued successfully: ${newV.gatepassNo}. Vehicle cleared for unloading.`);

    setSelectedPoNo('');
    setVehicleNo('');
    setDriverName('');
    setTransporter('');
    setSealNo('');
    setKmReading('');
  };

  const handleStartQC = (veh) => {
    setSelectedVehicle(veh);
    const po = purchaseOrders.find(p => p.poNo === veh.bookingRefDocNo);
    if (po) {
      setQcItems(po.items.map(i => ({
        productId: i.productId,
        expectedQty: i.expectedQty - (i.receivedQty || 0),
        qty: i.expectedQty - (i.receivedQty || 0),
        grading: 'Grade A',
        temp: 3.6,
        isApproved: true,
        mfgDate: new Date().toISOString().split('T')[0]
      })).filter(item => item.expectedQty > 0));
    }
  };

  const handleQcItemChange = (index, field, value) => {
    setQcItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          [field]: field === 'qty' || field === 'temp' ? Number(value) : value
        };
      }
      return item;
    }));
  };

  const handleCompleteQC = (e) => {
    e.preventDefault();
    if (qcItems.length === 0) return;

    const grnNo = processGRN(selectedVehicle.bookingRefDocNo, selectedVehicle.gatepassNo, qcItems);
    alert(`GRN Generated: ${grnNo}. Stock is now in staging. Proceed to Putaway router.`);

    setSelectedVehicle(null);
    setQcItems([]);
    setActiveTab('putaway');
  };

  const handleExecutePutaway = (item, targetBin) => {
    const loc = locations.find(l => l.code === targetBin);
    if (loc?.status === 'Locked') {
      alert('Target bin is locked. Select another destination.');
      return;
    }

    confirmPutaway(item.id, targetBin);
    alert(`Stock batch ${item.batchNo} successfully putaway to bin ${targetBin}. Available in Live Inventory.`);
  };

  const handleVehicleExit = (gpNo) => {
    closeVehicleEntry(gpNo, 'Gate clearance approved. Left warehouse premises.');
    alert(`Vehicle checkout complete. Exited.`);
  };

  // Interactive 8-Stage Stepper Wizard Execution
  const openWorkflowWizard = (po) => {
    setActiveWorkflowPo(po);
    const stage = getPoStageInfo(po);
    setWorkflowStep(stage.step >= 8 ? 8 : Math.max(1, stage.step));
    setWorkflowSuccessLog(null);
  };

  const handleExecuteWizardStep = () => {
    if (!activeWorkflowPo) return;
    const po = activeWorkflowPo;
    const vendor = vendors.find(v => v.id === po.vendorId);
    const vendorName = vendor?.name || 'Direct Supplier';

    if (workflowStep === 1) {
      setWorkflowStep(2);
      logAction(`PO ${po.poNo} validated for Gate Pass generation`, 'Purchase Order');
    } else if (workflowStep === 2) {
      const newV = registerVehicle({
        vehicleNo: wizardVehicleNo.toUpperCase(),
        driverName: wizardDriverName,
        transporter: wizardTransporter || vendorName,
        inKmReading: 48500,
        sealNumber: wizardSealNo,
        processType: 'Inbound',
        bookingType: 'PO Material',
        bookingRefDocNo: po.poNo,
        remark: `Issued Gate Pass for PO ${po.poNo}`
      });
      setWorkflowStep(3);
      logAction(`Issued Gate Pass ${newV.gatepassNo} for PO ${po.poNo}`, 'Gatepass');
    } else if (workflowStep === 3) {
      setWorkflowStep(4);
      logAction(`Vehicle ${wizardVehicleNo} docked at Bay 1 for PO ${po.poNo}`, 'Gatepass');
    } else if (workflowStep === 4) {
      setWorkflowStep(5);
      logAction(`Material unloaded at Dock for PO ${po.poNo}. Core Temp: ${wizardDockTemp}°C`, 'Inbound');
    } else if (workflowStep === 5) {
      setWorkflowStep(6);
      logAction(`GRN generation initiated for PO ${po.poNo}`, 'Inbound');
    } else if (workflowStep === 6) {
      const existingVehicle = vehicles.find(v => v.bookingRefDocNo === po.poNo);
      const gpNo = existingVehicle ? existingVehicle.gatepassNo : `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const qcList = po.items.map(item => ({
        productId: item.productId,
        qty: item.expectedQty - (item.receivedQty || 0),
        grading: wizardQcGrading,
        temp: Number(wizardDockTemp) || 3.2,
        isApproved: true,
        mfgDate: new Date().toISOString().split('T')[0]
      }));

      const grnNo = processGRN(po.poNo, gpNo, qcList);
      setWorkflowStep(7);
      logAction(`QC Passed (${wizardQcGrading}, ${wizardQcBrix}° Brix). Generated GRN ${grnNo}`, 'Quality Check');
    } else if (workflowStep === 7) {
      const stagedItems = inventory.filter(i => i.locationCode === 'Stage Area');
      if (stagedItems.length > 0) {
        stagedItems.forEach(item => {
          confirmPutaway(item.id, wizardTargetBin);
        });
      } else {
        executeFullPoAutoWorkflow(po.poNo, wizardTargetBin);
      }
      setWorkflowStep(8);
      setWorkflowSuccessLog(`Workflow Complete! All materials under ${po.poNo} are now live in Bin ${wizardTargetBin} and ready for orders.`);
      logAction(`Putaway completed to ${wizardTargetBin} for ${po.poNo}. Stock is now live!`, 'Putaway');
    }
  };

  const handle1ClickAutoInward = (po) => {
    const res = executeFullPoAutoWorkflow(po.poNo, wizardTargetBin || 'A-01-01');
    if (res.success) {
      alert(`Success! 8-Stage Inward Complete:\n• PO: ${po.poNo}\n• Gate Pass: ${res.gatepassNo}\n• GRN: ${res.grnNo}\n• Target Bin: ${res.targetBin}\n• Stock Status: Available Live Stock!`);
      if (activeWorkflowPo?.poNo === po.poNo) {
        setWorkflowStep(8);
        setWorkflowSuccessLog(`Auto Inward completed successfully! Gatepass ${res.gatepassNo}, GRN ${res.grnNo}, Putaway to ${res.targetBin}.`);
      }
    }
  };

  return (
    <div className="max-w-[1680px] mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in-50 duration-200">
      
      {/* ------------------------------------------------------------- */}
      {/* TITLE & OVERVIEW BANNER */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Inward Logistics & Material Receiving</h1>
            <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              Complete Inward Pipeline
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            End-to-End Execution: Purchase Order ➔ Gate Pass ➔ Vehicle Entry ➔ Material Receiving ➔ GRN ➔ QC ➔ Putaway ➔ Stock.
          </p>
        </div>
      </div>


      {/* ------------------------------------------------------------- */}
      {/* TABS NAVIGATION */}
      {/* ------------------------------------------------------------- */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-1 overflow-x-auto pb-px">
        {[
          { id: 'workflow', label: 'Inward Lifecycle (8 Stages)', icon: Sparkles },
          { id: 'receiving', label: 'Receiving Dock & Gate-In', icon: Truck },
          { id: 'qc', label: 'Quality Control & Grading', icon: ShieldCheck },
          { id: 'grn', label: 'GRN Creation & Logs', icon: FileText },
          { id: 'putaway', label: 'Putaway Router & Binning', icon: ArrowDownToLine },
          { id: 'stock', label: 'Available Stock Registry', icon: Layers }
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

      {/* ------------------------------------------------------------- */}
      {/* MAIN WORKSPACE PANEL */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden p-6 min-h-[500px]">
        
        {/* TAB 0: Inward Process Lifecycle (8-Stage Stepper & Wizard) */}
        {activeTab === 'workflow' && (
          <div className="space-y-6">
            
            {/* Header & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Purchase Orders Inward Execution Board</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Track and step-by-step execute inbound procurement shipments from PO to Live Stock.</p>
              </div>

              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search PO, supplier, code..."
                  value={inwardPoSearch}
                  onChange={(e) => setInwardPoSearch(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Inward Pipeline Table */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold">
                  <tr>
                    <th className="p-3.5">PO Reference</th>
                    <th className="p-3.5">Supplier / Origin</th>
                    <th className="p-3.5">Received / Expected</th>
                    <th className="p-3.5">Current Lifecycle Stage</th>
                    <th className="p-3.5 text-right">Interactive Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-medium">
                  {filteredInwardPOs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-zinc-400 text-xs">
                        No purchase orders matching this search.
                      </td>
                    </tr>
                  ) : (
                    filteredInwardPOs.map(po => {
                      const vendor = vendors.find(v => v.id === po.vendorId);
                      const totalExpected = po.items.reduce((s, i) => s + Number(i.expectedQty), 0);
                      const totalReceived = po.items.reduce((s, i) => s + (Number(i.receivedQty) || 0), 0);
                      const stage = getPoStageInfo(po);

                      return (
                        <tr key={po.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {po.poNo}
                            <span className="block text-[10px] text-zinc-400 font-normal font-sans">{po.date}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-zinc-900 dark:text-white block">{vendor?.name || 'Direct Supplier'}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">{vendor?.code} • {vendor?.city}</span>
                          </td>
                          <td className="p-3.5 font-mono">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200 block">{totalReceived} / {totalExpected} units</span>
                            <span className="text-[10px] text-zinc-400">{po.items.length} Product Lines</span>
                          </td>
                          <td className="p-3.5">
                            <div className="space-y-1.5 min-w-[200px]">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className={`font-bold ${
                                  stage.step >= 8 ? 'text-emerald-600 dark:text-emerald-400' :
                                  stage.step >= 6 ? 'text-blue-600 dark:text-blue-400' :
                                  stage.step >= 4 ? 'text-amber-600 dark:text-amber-400' :
                                  'text-zinc-600 dark:text-zinc-400'
                                }`}>
                                  {stage.label}
                                </span>
                                <span className="font-mono text-zinc-400 font-bold">{stage.step}/8</span>
                              </div>
                              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden flex">
                                <div
                                  style={{ width: `${(stage.step / 8) * 100}%` }}
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    stage.step >= 8 ? 'bg-emerald-500' :
                                    stage.step >= 6 ? 'bg-blue-500' :
                                    stage.step >= 4 ? 'bg-amber-500' :
                                    'bg-indigo-500'
                                  }`}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openWorkflowWizard(po)}
                                className="inline-flex items-center gap-1 bg-zinc-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors shadow-xs"
                                title="Execute Step-by-Step Inward Wizard"
                              >
                                <span>Execute Flow</span>
                                <ChevronRight className="h-3 w-3" />
                              </button>

                              {stage.step < 8 && (
                                <button
                                  onClick={() => handle1ClickAutoInward(po)}
                                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded-lg text-[11px] transition-colors shadow-xs"
                                  title="Auto-Complete Full 8 Stages to Live Stock"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  <span>Auto Inward</span>
                                </button>
                              )}
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
        )}

        {/* TAB 1: Receiving Dock */}
        {activeTab === 'receiving' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form */}
            <div className="lg:col-span-5 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-zinc-50/30 dark:bg-zinc-900/10 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Log Vehicle Check-In</h3>
                <span className="text-[10px] text-zinc-400">Issue yard clearance pass linked to supplier PO.</span>
              </div>

              <form onSubmit={handleCheckInSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 mb-1">Select Purchase Order Ref</label>
                  <select
                    required
                    value={selectedPoNo}
                    onChange={(e) => {
                      setSelectedPoNo(e.target.value);
                      const po = purchaseOrders.find(p => p.poNo === e.target.value);
                      if (po) {
                        const v = vendors.find(vend => vend.id === po.vendorId);
                        setTransporter(v?.name || '');
                      }
                    }}
                    className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">-- Select Approved PO --</option>
                    {purchaseOrders.filter(po => po.status === 'Approved' || po.status === 'Receiving').map(po => (
                      <option key={po.id} value={po.poNo}>{po.poNo} ({vendors.find(v => v.id === po.vendorId)?.name})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 mb-1">Vehicle Plate No</label>
                    <input
                      type="text"
                      required
                      value={vehicleNo}
                      onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                      placeholder="e.g. GJ10TZ1234"
                      className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 mb-1">Driver Name</label>
                    <input
                      type="text"
                      required
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Driver Name"
                      className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-zinc-500 mb-1">Transporter / Carrier</label>
                    <input
                      type="text"
                      value={transporter}
                      onChange={(e) => setTransporter(e.target.value)}
                      placeholder="Freight agency"
                      className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 mb-1">Odometer (KM)</label>
                    <input
                      type="number"
                      value={kmReading}
                      onChange={(e) => setKmReading(e.target.value)}
                      placeholder="Odo"
                      className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 mb-1">Container Seal Number</label>
                  <input
                    type="text"
                    value={sealNo}
                    onChange={(e) => setSealNo(e.target.value)}
                    placeholder="Seal No (e.g. SEAL-9824)"
                    className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg py-2.5 text-xs transition-colors shadow-sm"
                >
                  Issue Entry Gate Pass
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Active Inbound Trucks in Yard</h3>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block">List of checked-in logistical vehicles currently unloading cargo.</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeInboundVehicles.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-zinc-400 text-xs">
                    No active inbound trucks checked in.
                  </div>
                ) : (
                  activeInboundVehicles.map(veh => (
                    <div key={veh.id} className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl p-4 flex flex-col justify-between h-40 shadow-xs animate-in zoom-in-95 duration-200">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="font-mono font-bold text-zinc-900 dark:text-white text-sm">{veh.vehicleNo}</span>
                          <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">{veh.status}</span>
                        </div>
                        <span className="block text-[10px] text-zinc-400 mt-1">Transporter: {veh.transporter}</span>
                        <span className="block text-[10px] text-zinc-500">PO Ref: {veh.bookingRefDocNo}</span>
                        <span className="block text-[9px] font-mono text-zinc-400 mt-1">Gate Pass: {veh.gatepassNo}</span>
                      </div>

                      <button
                        onClick={() => handleVehicleExit(veh.gatepassNo)}
                        className="w-full flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-900 text-white font-semibold rounded py-1.5 text-[10px] transition-colors"
                      >
                        <span>Check-Out (Gate Out)</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: Quality Control */}
        {activeTab === 'qc' && (
          <div className="space-y-6">
            {selectedVehicle ? (
              <form onSubmit={handleCompleteQC} className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Unload Inspection & Grade Sorting</h3>
                    <span className="text-[10px] text-zinc-400">Inspecting vehicle <span className="font-mono font-bold">{selectedVehicle.vehicleNo}</span> for PO <span className="font-mono font-bold text-emerald-600">{selectedVehicle.bookingRefDocNo}</span></span>
                  </div>
                  <button type="button" onClick={() => setSelectedVehicle(null)} className="text-xs border border-zinc-200 dark:border-zinc-800 px-3 py-1 rounded">Cancel</button>
                </div>

                <div className="space-y-4">
                  {qcItems.map((item, index) => {
                    const prod = products.find(p => p.id === item.productId);
                    return (
                      <div key={item.productId} className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-3">
                          <span className="block font-bold text-xs">{prod?.description}</span>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">{prod?.code} ({prod?.uom})</span>
                          <span className="text-[9px] text-emerald-600 font-bold block mt-1">Rule Temp: {prod?.tempRequired}</span>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[9px] font-bold text-zinc-400 mb-1 uppercase">Received Qty</label>
                          <input type="number" required value={item.qty} onChange={(e) => handleQcItemChange(index, 'qty', e.target.value)} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded p-1 text-xs" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[9px] font-bold text-zinc-400 mb-1 uppercase">Grading</label>
                          <select value={item.grading} onChange={(e) => handleQcItemChange(index, 'grading', e.target.value)} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded p-1 text-xs">
                            <option>Grade A</option>
                            <option>Grade B</option>
                            <option>Grade C</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[9px] font-bold text-zinc-400 mb-1 uppercase">Temp (°C)</label>
                          <input type="number" step="0.1" value={item.temp} onChange={(e) => handleQcItemChange(index, 'temp', e.target.value)} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded p-1 text-xs" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[9px] font-bold text-zinc-400 mb-1 uppercase">Mfg Date</label>
                          <input type="date" value={item.mfgDate} onChange={(e) => handleQcItemChange(index, 'mfgDate', e.target.value)} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded p-0.5 text-[11px]" />
                        </div>
                        <div className="md:col-span-1 text-center">
                          <label className="flex flex-col items-center gap-1 cursor-pointer">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase">Approve</span>
                            <input type="checkbox" checked={item.isApproved} onChange={(e) => handleQcItemChange(index, 'isApproved', e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5" />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-xs shadow-md">Approve QC Inspection & Generate GRN</button>
              </form>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Unloading Dock Queue</h3>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Select active yard vehicles to perform incoming quality audits.</span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {pendingQcVehicles.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-zinc-400 text-xs">
                      No vehicles are checked in and pending unloading quality checks.
                    </div>
                  ) : (
                    pendingQcVehicles.map(veh => (
                      <div key={veh.id} className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl p-4 flex flex-col justify-between h-40 shadow-sm">
                        <div>
                          <span className="font-mono font-bold text-sm block">{veh.vehicleNo}</span>
                          <span className="text-[10px] text-zinc-400 block mt-1">PO Link: {veh.bookingRefDocNo}</span>
                          <span className="text-[10px] text-zinc-500 block">Carrier: {veh.transporter}</span>
                        </div>
                        <button onClick={() => handleStartQC(veh)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded py-1.5 text-xs transition-colors">Start QC Grading</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GRN Creation */}
        {activeTab === 'grn' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2">
              <div>
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Goods Receipt Notes (GRN) Log</h3>
                <span className="text-xs text-zinc-500">History log of closed GRN documents generated after QC clearance.</span>
              </div>
              
              <div className="relative w-72">
                <input
                  type="text"
                  placeholder="Search GRN, Vehicle, PO..."
                  value={grnSearch}
                  onChange={(e) => setGrnSearch(e.target.value)}
                  className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs"
                />
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500">
                    <th className="p-3">Receipt Date</th>
                    <th className="p-3">Gate Pass No</th>
                    <th className="p-3">Vehicle Plate No</th>
                    <th className="p-3">PO Reference</th>
                    <th className="p-3">Driver Name</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-medium">
                  {grnHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-zinc-400">
                        No matching GRN documents found.
                      </td>
                    </tr>
                  ) : (
                    grnHistory.map(grn => (
                      <tr key={grn.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 text-zinc-750">
                        <td className="p-3 font-mono">{grn.inDateTime?.split(' ')[0]}</td>
                        <td className="p-3 font-mono font-bold text-emerald-600">{grn.gatepassNo}</td>
                        <td className="p-3 font-mono font-bold text-zinc-900 dark:text-white">{grn.vehicleNo}</td>
                        <td className="p-3 font-mono">{grn.bookingRefDocNo}</td>
                        <td className="p-3 font-semibold">{grn.driverName}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            GRN Generated
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

        {/* TAB 4: Putaway Router */}
        {activeTab === 'putaway' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Staged Items */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Staging Area Unloaded Batches</h3>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Allocate target storage rack bins for staged GRN inventory items.</span>

              <div className="space-y-3">
                {stageAreaItems.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-xs">
                    Staging area is empty. Perform receiving dock QC runs or launch the 8-Stage Inward Wizard to stage incoming cargo.
                  </div>
                ) : (
                  stageAreaItems.map(item => {
                    const prod = products.find(p => p.id === item.productId);
                    const suggestedLocs = locations.filter(l => l.status === 'Available');
                    const defaultLoc = suggestedLocs.length > 0 ? suggestedLocs[0].code : 'A-01-01';

                    return (
                      <div key={item.id} className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4 items-center animate-in fade-in-50">
                        <div className="cursor-pointer" onClick={() => setActiveLabelItem(item)}>
                          <span className="font-bold text-xs block text-zinc-900 dark:text-white hover:underline">{prod?.description}</span>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">Batch: {item.batchNo} | Qty: {item.qty} units | Temp: {item.tempLog}°C</span>
                        </div>
                        <div className="flex gap-2">
                          <select id={`loc-put-${item.id}`} defaultValue={defaultLoc} className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded p-1 text-xs">
                            {locations.map(l => <option key={l.id} value={l.code}>{l.code} ({l.type})</option>)}
                          </select>
                          <button onClick={() => {
                            const val = document.getElementById(`loc-put-${item.id}`).value;
                            handleExecutePutaway(item, val);
                          }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded text-xs">Confirm Putaway</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Label identification */}
            <div className="lg:col-span-5 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col items-center justify-center">
              {activeLabelItem ? (
                <div className="bg-white text-zinc-950 p-5 rounded shadow-lg border border-zinc-300 text-center w-full max-w-[280px] space-y-3 relative select-none animate-in zoom-in-95 duration-200">
                  <button onClick={() => setActiveLabelItem(null)} className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-800">X</button>
                  <span className="block text-[9px] font-black uppercase text-zinc-400">ZEBRA RFID Ident</span>
                  <div className="mx-auto w-24 h-24 border border-zinc-300 p-2 bg-zinc-50 flex items-center justify-center">
                    <div className="grid grid-cols-5 gap-1.5 w-full h-full opacity-80">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div key={i} className={`rounded-[1px] ${i % 3 === 0 || i === 0 || i === 24 ? 'bg-zinc-900' : 'bg-transparent'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="text-left text-[10px] space-y-0.5 border-t border-dashed border-zinc-200 pt-2 font-mono">
                    <div className="font-sans font-bold text-xs">{products.find(p => p.id === activeLabelItem.productId)?.description}</div>
                    <div>Batch: {activeLabelItem.batchNo}</div>
                    <div>Qty: {activeLabelItem.qty} units</div>
                    <div className="text-rose-600 font-bold">Expiry: {activeLabelItem.expiryDate}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-zinc-400 text-xs py-8">
                  <QrCode className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                  <span>Select any staged putaway batch to print its QR label identification sticker.</span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 5: Available Stock */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2">
              <div>
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Available Stock Registry</h3>
                <span className="text-xs text-zinc-500">Query and search active product batch storage bins.</span>
              </div>
              
              <div className="relative w-72">
                <input
                  type="text"
                  placeholder="Search by SKU, Name, Bin..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs"
                />
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500">
                    <th className="p-3">SKU Code</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3">Storage Bin</th>
                    <th className="p-3">Expiry Date (FEFO)</th>
                    <th className="p-3">Crates Count</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Grading Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-medium">
                  {filteredStock.map(item => {
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

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 8-STAGE INWARD PROCESS WIZARD MODAL */}
      {/* ------------------------------------------------------------- */}
      {activeWorkflowPo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50">
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-zinc-900 dark:text-white">Inward Logistics Execution Wizard</h3>
                  <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-mono font-bold text-xs px-2 py-0.5 rounded-md">
                    {activeWorkflowPo.poNo}
                  </span>
                </div>
                <span className="text-xs text-zinc-400 mt-0.5 block">
                  Supplier: {vendors.find(v => v.id === activeWorkflowPo.vendorId)?.name || 'Direct'}
                </span>
              </div>
              <button
                onClick={() => setActiveWorkflowPo(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10 overflow-x-auto">
              <div className="flex items-center justify-between min-w-[650px] gap-1">
                {workflowSteps.map((step) => {
                  const isCurrent = workflowStep === step.num;
                  const isDone = workflowStep > step.num;
                  return (
                    <button
                      key={step.num}
                      onClick={() => setWorkflowStep(step.num)}
                      className="flex-1 flex flex-col items-center text-center group"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isDone ? 'bg-emerald-600 text-white' :
                        isCurrent ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 ring-2 ring-emerald-500' :
                        'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                      }`}>
                        {isDone ? <Check className="h-3.5 w-3.5" /> : step.num}
                      </div>
                      <span className={`text-[10px] mt-1 whitespace-nowrap font-bold ${isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
                        {step.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Step 1: PO Review */}
              {workflowStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Step 1: Purchase Order Validation</span>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">
                      Purchase Order <strong>{activeWorkflowPo.poNo}</strong> contains <strong>{activeWorkflowPo.items.length} line items</strong> ready for gate entry generation.
                    </p>
                    <div className="space-y-1 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs">
                      {activeWorkflowPo.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between font-mono">
                          <span>{products.find(p => p.id === item.productId)?.description}</span>
                          <span className="font-bold">{item.expectedQty} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Gate Pass */}
              {workflowStep === 2 && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Step 2: Issue Inbound Gate Pass</span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Vehicle Plate Number</label>
                      <input
                        type="text"
                        value={wizardVehicleNo}
                        onChange={(e) => setWizardVehicleNo(e.target.value.toUpperCase())}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Driver Name</label>
                      <input
                        type="text"
                        value={wizardDriverName}
                        onChange={(e) => setWizardDriverName(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Transporter Agency</label>
                      <input
                        type="text"
                        value={wizardTransporter}
                        onChange={(e) => setWizardTransporter(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Container Seal Number</label>
                      <input
                        type="text"
                        value={wizardSealNo}
                        onChange={(e) => setWizardSealNo(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Vehicle Entry */}
              {workflowStep === 3 && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Step 3: Vehicle Dock Inward</span>
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 p-4 rounded-xl text-xs space-y-2">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold">
                      <Truck className="h-4 w-4" />
                      <span>Truck {wizardVehicleNo} Docked in Yard</span>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-300">
                      Security authorization passed. Vehicle is now placed at Unloading Dock Bay 1. Reefer cargo temp: 3.4°C.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Material Receiving */}
              {workflowStep === 4 && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Step 4: Dock Material Receiving & Unloading</span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Dock Core Pulp Temperature (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={wizardDockTemp}
                        onChange={(e) => setWizardDockTemp(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 font-mono font-bold text-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Unload Dock Bay</label>
                      <select className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 font-semibold">
                        <option>Bay 1 (Cold Chain Inward)</option>
                        <option>Bay 2 (Perishable Inward)</option>
                        <option>Bay 3 (Ambient Dry)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: GRN */}
              {workflowStep === 5 && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Step 5: Goods Receipt Note (GRN) Generation</span>
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl text-xs space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                      <FileText className="h-4 w-4" />
                      <span>Ready to generate official GRN document</span>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-300">
                      Material verified against PO line items. Proceeding will generate the formal GRN and lot numbers.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 6: QC & Grading */}
              {workflowStep === 6 && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Step 6: Quality Control (QC) & Brix Analysis</span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Quality Grading</label>
                      <select
                        value={wizardQcGrading}
                        onChange={(e) => setWizardQcGrading(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 font-bold"
                      >
                        <option>Grade A (Export / Prime)</option>
                        <option>Grade B (Standard Market)</option>
                        <option>Grade C (Discount / Processing)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Brix (° Sugar Content)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={wizardQcBrix}
                        onChange={(e) => setWizardQcBrix(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 7: Putaway */}
              {workflowStep === 7 && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">Step 7: Storage Putaway & Bin Allocation</span>
                  <div className="space-y-2 text-xs">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase">Target Storage Location / Cold Room Bin</label>
                    <select
                      value={wizardTargetBin}
                      onChange={(e) => setWizardTargetBin(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 font-mono font-bold text-emerald-600"
                    >
                      {locations.map(l => (
                        <option key={l.id} value={l.code}>{l.code} ({l.type} - {l.status})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 8: Live Stock */}
              {workflowStep === 8 && (
                <div className="space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-5 rounded-2xl text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-300">Material Active in Live Available Stock</h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-md mx-auto">
                      All products under {activeWorkflowPo.poNo} are now successfully put away in bin {wizardTargetBin}. Available for sales orders and FEFO picking!
                    </p>
                  </div>
                </div>
              )}

              {/* Success Log */}
              {workflowSuccessLog && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{workflowSuccessLog}</span>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setWorkflowStep(prev => Math.max(1, prev - 1))}
                disabled={workflowStep === 1}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 disabled:opacity-30"
              >
                Back
              </button>

              <div className="flex items-center gap-2">
                {workflowStep < 8 ? (
                  <button
                    type="button"
                    onClick={handleExecuteWizardStep}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <span>Execute Step {workflowStep}: {workflowSteps[workflowStep - 1]?.title}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveWorkflowPo(null)}
                    className="bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors shadow-xs"
                  >
                    Done & Close
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
