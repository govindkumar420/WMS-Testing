import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import {
  FileSpreadsheet,
  CheckSquare,
  Truck,
  Signature,
  ChevronRight,
  Plus,
  AlertCircle,
  FileText,
  Printer,
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  ArrowRight,
  Thermometer,
  ClipboardList,
  Edit2,
  Trash2,
  Layers,
  Download,
  Check,
  Eye,
  Table,
  LayoutList,
  LayoutGrid
} from 'lucide-react';
import DeliveryChallanModal from './DeliveryChallanModal';
import NewSalesOrderModal from './NewSalesOrderModal';
import PicklistModal from './PicklistModal';
import PodConfirmationModal from './PodConfirmationModal';

export default function OutboundView() {
  const {
    salesOrders,
    setSalesOrders,
    customers,
    products,
    inventory,
    vehicles = [],
    companies = [],
    warehouses = [],
    picklists = [],
    setPicklists,
    createPicklist,
    updatePicklist,
    deletePicklist,
    dispatchInvoices = [],
    setDispatchInvoices,
    createDispatchInvoice,
    updateDispatchInvoice,
    deleteDispatchInvoice,
    getFefoPickingSuggestions,
    executePicking,
    dispatchSalesOrder,
    confirmSOArrival,
    updateSalesOrder,
    deleteSalesOrder,
    logAction,
    navigateTo
  } = useContext(WmsDataContext);

  const [activeStep, setActiveStep] = useState('so'); // so, picking, dispatch, invoice_challan, delivery

  // 1. New/Edit SO state
  const [soDrawerOpen, setSoDrawerOpen] = useState(false);
  const [editingSo, setEditingSo] = useState(null);
  const [deleteConfirmSo, setDeleteConfirmSo] = useState(null);
  const [picklistModalData, setPicklistModalData] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [soItems, setSoItems] = useState([{ productId: '', qty: 1 }]);
  const [soPriority, setSoPriority] = useState('Normal');

  // 2. Picking & Picklist state
  const [selectedSo, setSelectedSo] = useState(null);
  const [activePicks, setActivePicks] = useState(null); // {picks, isFullySatisfied, shortfall}
  const [selectedPicklistIds, setSelectedPicklistIds] = useState([]);
  const [picklistFilterQuery, setPicklistFilterQuery] = useState('');
  const [picklistStatusFilter, setPicklistStatusFilter] = useState('All');

  // 3. Dispatch & Delivery Challan state
  const [vehicleNo, setVehicleNo] = useState('GJ15AV7963');
  const [driverName, setDriverName] = useState('AABID SAMA');
  const [driverMobile, setDriverMobile] = useState('9687064462');
  const [transporter, setTransporter] = useState('Self');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedGatepassNo, setSelectedGatepassNo] = useState('');
  const [cratesCount, setCratesCount] = useState('26');
  const [sealNo, setSealNo] = useState('SEAL-2026-8801');
  const [lrNo, setLrNo] = useState('LR-2026-6104');
  const [vehicleFilterQuery, setVehicleFilterQuery] = useState('');
  const [invoicePrintData, setInvoicePrintData] = useState(null); // Full Challan object
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [podModalData, setPodModalData] = useState(null); // Active POD sign-off modal data

  // Filtered Dispatch Invoices for Outward Invoice & Challan Ledger
  const filteredDispatchInvoices = useMemo(() => {
    let list = dispatchInvoices || [];
    if (invoiceSearchQuery.trim()) {
      const q = invoiceSearchQuery.toLowerCase();
      list = list.filter(inv =>
        inv.orderId?.toLowerCase().includes(q) ||
        inv.orderNo?.toLowerCase().includes(q) ||
        inv.salesDeliveryNo?.toLowerCase().includes(q) ||
        inv.customerCode?.toLowerCase().includes(q) ||
        inv.customerName?.toLowerCase().includes(q) ||
        inv.challanNo?.toLowerCase().includes(q) ||
        inv.invoiceNo?.toLowerCase().includes(q) ||
        inv.area?.toLowerCase().includes(q) ||
        inv.location?.toLowerCase().includes(q) ||
        inv.vehicleNo?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [dispatchInvoices, invoiceSearchQuery]);

  // Telemetry & Delivery Challan fields
  const [deliveryLocation, setDeliveryLocation] = useState('Rheino Safari');
  const [department, setDepartment] = useState('ANIMAL KITCHEN');
  const [displayTemp, setDisplayTemp] = useState('20');
  const [setTemp, setSetTemp] = useState('8°C');
  const [departureTemp, setDepartureTemp] = useState('10');
  const [vendorCode, setVendorCode] = useState('VND-GNS-88');
  const [challanNo, setChallanNo] = useState('GVL/04874/26-27');

  // 4. Signature Canvas state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Filter Sales Orders for each stage
  const pickingPendingOrders = useMemo(() => {
    return salesOrders.filter(so => so.status === 'New');
  }, [salesOrders]);

  const dispatchPendingOrders = useMemo(() => {
    return salesOrders.filter(so => so.status === 'Packed');
  }, [salesOrders]);

  const deliveryPendingOrders = useMemo(() => {
    return salesOrders.filter(so => so.status === 'Dispatched');
  }, [salesOrders]);

  const [deliveryFilterStatus, setDeliveryFilterStatus] = useState('All'); // 'All' | 'Pending' | 'Confirmed'
  const [deliverySearchQuery, setDeliverySearchQuery] = useState('');
  const [deliveryViewMode, setDeliveryViewMode] = useState('table'); // 'table' | 'rows' | 'grid'

  // All generated Delivery Challans from dispatchInvoices + salesOrders
  const allDeliveryChallans = useMemo(() => {
    const list = [];
    const seenChallans = new Set();

    // 1. From dispatchInvoices (which are generated when shipping dispatch happens or from outward invoice ledger)
    (dispatchInvoices || []).forEach(inv => {
      const challanKey = inv.challanNo || inv.invoiceNo || inv.orderId;
      if (!seenChallans.has(challanKey)) {
        seenChallans.add(challanKey);
        const soMatch = salesOrders.find(s => s.id === inv.orderId || s.orderNo === inv.orderId || s.orderNo === inv.orderNo);
        list.push({
          id: inv.id || inv.orderId,
          orderId: inv.orderId,
          orderNo: inv.orderNo || `SO-2026-${inv.orderId}`,
          salesDeliveryNo: inv.salesDeliveryNo || '1784155315',
          challanNo: inv.challanNo || inv.invoiceNo || `GVL/000${inv.orderId}/26-27`,
          invoiceNo: inv.invoiceNo || inv.challanNo || `GVL/000${inv.orderId}/26-27`,
          customerName: inv.customerName,
          customerCode: inv.customerCode,
          shippingAddress: inv.shippingAddress,
          location: inv.location,
          area: inv.area || inv.kitchen || 'STAFF KITCHEN',
          kitchen: inv.kitchen || inv.area || 'STAFF KITCHEN',
          vehicleNo: inv.vehicleNo || 'GJ15AV7963',
          driverName: inv.driverName || 'Aabid Sama',
          driverMobile: inv.driverMobile || '9687064462',
          transporter: inv.transporter || 'Self Transport',
          cratesCount: inv.cratesCount || 26,
          orderDate: inv.orderDate || '16-07-2026',
          dispatchTime: inv.dispatchedDate || inv.dispatchTime || inv.dispatchInvoiceDate || '2026-07-16 04:30:18',
          status: inv.status || 'Dispatched',
          podStatus: inv.podStatus || (inv.status === 'POD Confirmed' || inv.status === 'Delivered' ? 'POD Confirmed' : 'Pending'),
          podDateTime: inv.podDateTime || (inv.status === 'POD Confirmed' ? (inv.podTime || '2026-07-16 04:37:14') : ''),
          items: inv.items || (soMatch ? soMatch.items : [{ productId: 'P-001', qty: 20 }]),
          so: soMatch || {
            id: inv.orderId,
            orderNo: inv.orderNo || `SO-2026-${inv.orderId}`,
            salesDeliveryNo: inv.salesDeliveryNo,
            items: inv.items || [{ productId: 'P-001', qty: 20 }]
          }
        });
      }
    });

    // 2. From salesOrders with status 'Dispatched' or 'Delivered'
    (salesOrders || []).filter(so => so.status === 'Dispatched' || so.status === 'Delivered').forEach(so => {
      const challanKey = so.dispatchDetails?.challanNo || so.dispatchDetails?.invoiceNo || so.id;
      if (!seenChallans.has(challanKey) && !seenChallans.has(so.id)) {
        seenChallans.add(challanKey);
        const cust = customers.find(c => c.id === so.customerId) || {};
        list.push({
          id: so.id,
          orderId: so.id,
          orderNo: so.orderNo,
          salesDeliveryNo: so.salesDeliveryNo || '1784155315',
          challanNo: so.dispatchDetails?.challanNo || `GVL/000${so.id.replace(/\D/g, '')}/26-27`,
          invoiceNo: so.dispatchDetails?.invoiceNo || `GVL/000${so.id.replace(/\D/g, '')}/26-27`,
          customerName: cust.name || so.customerName || 'Customer',
          customerCode: cust.code || so.customerCode || 'CUST',
          shippingAddress: cust.address || so.shippingAddress,
          location: cust.city || so.location,
          area: so.area || 'STAFF KITCHEN',
          kitchen: so.area || 'STAFF KITCHEN',
          vehicleNo: so.dispatchDetails?.vehicleNo || 'GJ15AV7963',
          driverName: so.dispatchDetails?.driverName || 'Aabid Sama',
          driverMobile: so.dispatchDetails?.driverMobile || '9687064462',
          transporter: so.dispatchDetails?.transporter || 'Self Transport',
          cratesCount: so.dispatchDetails?.cratesCount || 26,
          orderDate: so.date || '16-07-2026',
          dispatchTime: so.dispatchDetails?.deliveryTime || so.dispatchDetails?.dispatchTime || '2026-07-16 04:30:18',
          status: so.status,
          podStatus: so.podStatus || (so.status === 'Delivered' ? 'POD Confirmed' : 'Pending'),
          podDateTime: so.dispatchDetails?.deliveryTime || '',
          items: so.items || [],
          so
        });
      }
    });

    return list;
  }, [dispatchInvoices, salesOrders, customers]);

  // Filtered list for Confirm Delivery view
  const filteredDeliveryChallans = useMemo(() => {
    let list = allDeliveryChallans;
    if (deliveryFilterStatus === 'Pending') {
      list = list.filter(c => c.podStatus !== 'POD Confirmed' && c.status !== 'Delivered');
    } else if (deliveryFilterStatus === 'Confirmed') {
      list = list.filter(c => c.podStatus === 'POD Confirmed' || c.status === 'Delivered');
    }
    if (deliverySearchQuery.trim()) {
      const q = deliverySearchQuery.toLowerCase();
      list = list.filter(c =>
        c.challanNo?.toLowerCase().includes(q) ||
        c.invoiceNo?.toLowerCase().includes(q) ||
        c.salesDeliveryNo?.toLowerCase().includes(q) ||
        c.orderNo?.toLowerCase().includes(q) ||
        c.customerName?.toLowerCase().includes(q) ||
        c.customerCode?.toLowerCase().includes(q) ||
        c.vehicleNo?.toLowerCase().includes(q) ||
        c.driverName?.toLowerCase().includes(q) ||
        c.area?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allDeliveryChallans, deliveryFilterStatus, deliverySearchQuery]);

  // Filtered Picklists for Step 2 Picklist Ledger Table
  const filteredPicklists = useMemo(() => {
    let list = picklists || [];
    if (picklistStatusFilter === 'Pending') {
      list = list.filter(p => p.pickingStatus?.includes('pending') || p.status?.includes('pending'));
    } else if (picklistStatusFilter === 'Done') {
      list = list.filter(p => p.pickingStatus === 'Picking Done' || p.status === 'Picking Done');
    }
    if (picklistFilterQuery.trim()) {
      const q = picklistFilterQuery.toLowerCase();
      list = list.filter(p =>
        p.pickingId?.toLowerCase().includes(q) ||
        p.orderId?.toLowerCase().includes(q) ||
        p.salesDeliveryNo?.toLowerCase().includes(q) ||
        p.customerName?.toLowerCase().includes(q) ||
        p.deliveryLocation?.toLowerCase().includes(q) ||
        p.area?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [picklists, picklistStatusFilter, picklistFilterQuery]);

  // Handle Pick Wave Release from Sales Orders
  const handleStartPicking = (so) => {
    setSelectedSo(so);

    // Aggregate picks for all items in the SO using FEFO
    const allPicks = [];
    let isFullySatisfied = true;
    const shortfalls = [];

    (so.items || []).forEach(item => {
      const suggest = getFefoPickingSuggestions(item.productId, item.qty);
      allPicks.push(...suggest.picks);
      if (!suggest.isFullySatisfied) {
        isFullySatisfied = false;
        shortfalls.push({
          productId: item.productId,
          qtyNeeded: item.qty,
          qtyShort: suggest.shortfall
        });
      }
    });

    setActivePicks({
      picks: allPicks,
      isFullySatisfied,
      shortfalls
    });

    // Auto-create or ensure picklist record exists in picklists state
    const cust = customers.find(c => c.id === so.customerId) || {};
    const existing = (picklists || []).find(p => p.orderId === so.orderNo || p.orderId === so.id || p.salesDeliveryNo === so.salesDeliveryNo);
    if (!existing) {
      const numPart = so.salesDeliveryNo || so.orderNo?.replace(/\D/g, '') || Math.floor(1000000000 + Math.random() * 9000000000);
      createPicklist({
        id: `PL-${numPart}`,
        pickingId: `PL${numPart}`,
        orderId: so.orderNo?.replace(/\D/g, '') || so.orderNo,
        orderNo: so.orderNo,
        salesDeliveryNo: so.salesDeliveryNo || `${numPart}`,
        customerId: so.customerId,
        customerName: cust.name || so.customerName || 'Customer',
        deliveryLocation: so.shippingDetails?.billingLocation || cust.city || '54 Acre',
        area: so.shippingDetails?.area || 'STAFF KITCHEN',
        channel: '',
        pickingIssueDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        pickingEndDate: '',
        pickWise: 'Batch Wise',
        picklistGenerateMode: 'HHT',
        pickingStatus: 'Picklist completed. But Picking pending',
        status: 'Picklist completed. But Picking pending',
        items: so.items
      });
    }

    setActiveStep('picking');
  };

  // Handle Complete / Confirm Picking from Picklist row -> navigates to Shipping Dispatch
  const handleConfirmPicklistExecution = (pl) => {
    // 1. Find corresponding SO or items to execute inventory allocation
    let matchedSo = salesOrders.find(so => so.orderNo === pl.orderNo || so.salesDeliveryNo === pl.salesDeliveryNo || so.orderNo?.includes(pl.orderId) || so.id === pl.id);
    if (matchedSo) {
      const allPicks = [];
      (matchedSo.items || []).forEach(item => {
        const suggest = getFefoPickingSuggestions(item.productId, item.qty);
        allPicks.push(...suggest.picks);
      });
      if (allPicks.length > 0) {
        executePicking(matchedSo.id, allPicks);
      }
      matchedSo = { ...matchedSo, status: 'Packed' };
    } else {
      matchedSo = {
        id: pl.id || `SO-${pl.orderId || Date.now()}`,
        orderNo: pl.orderNo || `SO-2026-${pl.orderId}`,
        salesDeliveryNo: pl.salesDeliveryNo,
        customerId: pl.customerId || 'C-001',
        customerName: pl.customerName,
        status: 'Packed',
        priority: 'Normal',
        items: pl.items || [{ productId: 'P-001', qty: 20 }],
        shippingDetails: {
          billingLocation: pl.deliveryLocation,
          area: pl.area
        }
      };
    }

    // 2. Update Picklist to Picking Done
    if (pl.id) {
      updatePicklist(pl.id, {
        pickingStatus: 'Picking Done',
        status: 'Picking Done',
        pickingEndDate: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });
    }

    logAction(`Executed and completed picking for Picklist ${pl.pickingId || pl.orderNo}`, 'Outbound');

    // 3. Immediately select this order and navigate to 3. Shipping Dispatch
    setSelectedSo(matchedSo);
    setActiveStep('dispatch');
  };

  // Open Picklist Modal from a Picklist Ledger Record
  const handleOpenPicklistFromRecord = (pl) => {
    const matchedSo = salesOrders.find(so => so.orderNo === pl.orderNo || so.salesDeliveryNo === pl.salesDeliveryNo || so.orderNo?.includes(pl.orderId)) || {};
    const cust = customers.find(c => c.id === pl.customerId || c.id === matchedSo.customerId) || { name: pl.customerName };
    const items = pl.items || matchedSo.items || [];

    const allPicks = [];
    let isFullySatisfied = true;
    const shortfalls = [];

    items.forEach(item => {
      const suggest = getFefoPickingSuggestions(item.productId, item.qty || 1);
      allPicks.push(...suggest.picks.map(p => ({
        ...p,
        productId: item.productId
      })));
      if (!suggest.isFullySatisfied) {
        isFullySatisfied = false;
        shortfalls.push({
          productId: item.productId,
          qtyNeeded: item.qty,
          qtyShort: suggest.shortfall
        });
      }
    });

    setPicklistModalData({
      so: {
        orderNo: pl.orderNo || `SO-2026-${pl.orderId}`,
        salesDeliveryNo: pl.salesDeliveryNo,
        priority: matchedSo.priority || 'Normal',
        date: pl.pickingIssueDate ? pl.pickingIssueDate.split(' ')[0] : '2026-08-21',
        status: pl.pickingStatus || pl.status,
        shippingDetails: {
          billingLocation: pl.deliveryLocation,
          area: pl.area
        },
        items
      },
      customer: cust,
      picks: allPicks,
      isFullySatisfied,
      shortfalls,
      picklistNo: pl.pickingId,
      date: pl.pickingIssueDate ? pl.pickingIssueDate.split(' ')[0] : new Date().toLocaleDateString('en-GB')
    });
  };

  const handleConfirmPick = () => {
    if (!activePicks.isFullySatisfied) {
      if (!confirm('There is a stock shortfall for this order. Do you want to pick partial stock?')) {
        return;
      }
    }

    executePicking(selectedSo.id, activePicks.picks);

    // Update corresponding picklist
    const matchedPl = (picklists || []).find(p => p.orderId === selectedSo.orderNo || p.orderNo === selectedSo.orderNo || p.salesDeliveryNo === selectedSo.salesDeliveryNo);
    if (matchedPl) {
      updatePicklist(matchedPl.id, {
        pickingStatus: 'Picking Done',
        status: 'Picking Done',
        pickingEndDate: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });
    }

    // Automatically transition to Shipping Dispatch step with this order loaded
    const currentOrder = { ...selectedSo, status: 'Packed' };
    setActivePicks(null);
    setSelectedSo(currentOrder);
    setActiveStep('dispatch');
  };

  // Active Yard Vehicles created via Gatepass for Outward Dispatch
  const yardVehicles = useMemo(() => {
    return (vehicles || []).filter(v => v.status !== 'Closed');
  }, [vehicles]);

  const openOutwardVehicles = useMemo(() => {
    const list = (vehicles || []).filter(v => v.status !== 'Closed');
    const outwards = list.filter(v => v.processType === 'Outbound' || v.bookingType?.includes('Dispatch') || v.status === 'Gate In' || v.status === 'Loading');
    return outwards.length > 0 ? outwards : list;
  }, [vehicles]);

  const filteredYardVehicles = useMemo(() => {
    const q = vehicleFilterQuery.toLowerCase().trim();
    if (!q) return openOutwardVehicles;
    return openOutwardVehicles.filter(v =>
      v.vehicleNo?.toLowerCase().includes(q) ||
      v.driverName?.toLowerCase().includes(q) ||
      v.transporter?.toLowerCase().includes(q) ||
      v.gatepassNo?.toLowerCase().includes(q) ||
      v.bookingRefDocNo?.toLowerCase().includes(q)
    );
  }, [openOutwardVehicles, vehicleFilterQuery]);

  // Auto-fill or suggest open outward vehicle when an order is opened for dispatch
  useEffect(() => {
    if (selectedSo) {
      const totalUnits = selectedSo.items?.reduce((s, i) => s + (Number(i.qty) || 0), 0) || 26;
      setCratesCount(totalUnits.toString());
      setSealNo(`SEAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setLrNo(`LR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);

      const numPart = selectedSo.orderNo ? selectedSo.orderNo.replace(/\D/g, '') : Math.floor(1000 + Math.random() * 9000);
      setChallanNo(`GVL/0${numPart || '4874'}/26-27`);

      const cust = customers.find(c => c.id === selectedSo.customerId);
      if (cust) {
        setVendorCode(cust.code || 'VND-GNS-88');
        setDeliveryLocation(cust.city || 'Rheino Safari');
      }

      if (vehicles && vehicles.length > 0) {
        // 1. Try to find vehicle by booking reference
        let matched = vehicles.find(v =>
          (v.bookingRefDocNo === selectedSo.orderNo || v.bookingRefDocNo === selectedSo.id) &&
          v.status !== 'Closed'
        );

        // 2. If no direct reference, pick first open outward vehicle in yard
        if (!matched) {
          matched = vehicles.find(v => (v.processType === 'Outbound' || v.bookingType?.includes('Dispatch')) && v.status !== 'Closed');
        }

        // 3. If none, pick any open vehicle in yard
        if (!matched) {
          matched = vehicles.find(v => v.status !== 'Closed');
        }

        if (matched) {
          setSelectedVehicleId(matched.id);
          setVehicleNo(matched.vehicleNo);
          setDriverName(matched.driverName);
          setDriverMobile(matched.driverMobile || '9687064462');
          setTransporter(matched.transporter || 'Self Transport');
          setSelectedGatepassNo(matched.gatepassNo || 'GP-2026-481779');
        } else {
          setSelectedVehicleId('VEH-05');
          setVehicleNo('GJ15AV7963');
          setDriverName('Aabid Sama');
          setDriverMobile('9687064462');
          setTransporter('Self Transport');
          setSelectedGatepassNo('GP-2026-481779');
        }
      }
    }
  }, [selectedSo, vehicles, customers]);

  const handleSelectYardVehicle = (veh) => {
    if (veh) {
      setSelectedVehicleId(veh.id);
      setVehicleNo(veh.vehicleNo);
      setDriverName(veh.driverName);
      setTransporter(veh.transporter || 'Self');
      setSelectedGatepassNo(veh.gatepassNo || '');
    } else {
      setSelectedVehicleId('');
      setVehicleNo('GJ15AV7963');
      setDriverName('AABID SAMA');
      setDriverMobile('9687064462');
      setTransporter('Self');
      setSelectedGatepassNo('');
    }
  };

  // Open Delivery Challan Modal from an Invoice Record in the Ledger
  const handleOpenChallanForInvoiceRecord = (inv) => {
    const cust = customers.find(c => c.id === inv.customerId || c.code === inv.customerCode) || {
      name: inv.customerName,
      code: inv.customerCode,
      address: inv.shippingAddress,
      city: inv.location
    };

    setInvoicePrintData({
      so: {
        id: inv.orderId,
        orderNo: inv.orderNo || `SO-2026-${inv.orderId}`,
        salesDeliveryNo: inv.salesDeliveryNo,
        items: inv.items || [{ productId: 'P-001', qty: 20 }]
      },
      customer: cust,
      invoiceNo: inv.invoiceNo,
      gatePassNo: inv.gatePassNo || 'GP-2026-481779',
      challanNo: inv.challanNo,
      date: inv.dispatchInvoiceDate ? inv.dispatchInvoiceDate : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      cratesDispatched: inv.cratesCount || 26,
      sealNo: inv.sealNo || 'SEAL-2026-8801',
      lrNo: inv.lrNo || 'LR-2026-6104',
      vehicleNo: inv.vehicleNo || 'GJ15AV7963',
      driverName: inv.driverName || 'AABID SAMA',
      driverMobile: inv.driverMobile || '9687064462',
      transporter: inv.transporter || 'Self Transport',
      vendorCode: inv.customerCode || 'VND-GNS-88',
      deliveryLocation: inv.location || '54 Acre',
      department: inv.area || 'STAFF KITCHEN',
      displayTemp: inv.displayTemp || '20',
      setTemp: inv.setTemp || '8°C',
      departureTemp: inv.departureTemp || '10',
      company: (companies && companies[0]) || {
        name: 'GNOSIS VENTURES LLP',
        address: 'C/O SHIV COLD STORAGE, SURVEY NO. 105/5 KHIJADIYA BY PASS, CHOWKDI, KHIJADIYA DISTRICT JAMNAGAR-361120',
        gstNo: '24AANFG0052H1ZP'
      }
    });
  };

  // Open Proof of Delivery (POD) Confirmation Modal
  const handleOpenPodConfirmation = (record) => {
    const cust = customers.find(c => c.id === record.customerId || c.code === record.customerCode) || {
      name: record.customerName,
      code: record.customerCode,
      address: record.shippingAddress,
      city: record.location
    };
    setPodModalData({
      id: record.id || record.orderId,
      orderId: record.orderId || record.id,
      so: record.so || record,
      items: record.items || record.so?.items || [],
      customer: cust,
      invoiceNo: record.invoiceNo || record.dispatchDetails?.invoiceNo,
      challanNo: record.challanNo || record.dispatchDetails?.challanNo,
      gatePassNo: record.gatePassNo || record.dispatchDetails?.gatePassNo,
      vehicleNo: record.vehicleNo || record.dispatchDetails?.vehicleNo,
      driverName: record.driverName || record.dispatchDetails?.driverName,
      cratesDispatched: record.cratesCount || record.cratesDispatched || 26,
      deliveryLocation: record.location || record.deliveryLocation || cust.city,
      department: record.area || record.department || 'STAFF KITCHEN'
    });
  };

  // Execute POD confirmation callback
  const handleExecutePodConfirmation = (podResult) => {
    confirmSOArrival(podResult.orderId, podResult.signatureBase64, podResult);
    alert(`Proof of Delivery (POD) confirmed for Challan ${podResult.challanNo}! Delivery marked complete.`);
    setPodModalData(null);
  };

  // Open Delivery Challan Modal for any past or active order
  const handleOpenChallanForOrder = (so) => {
    const cust = customers.find(c => c.id === so.customerId) || {};
    const d = so.dispatchDetails || {};
    const totalUnits = so.items?.reduce((s, i) => s + (Number(i.qty) || 0), 0) || 26;

    setInvoicePrintData({
      so: so,
      customer: cust,
      invoiceNo: d.invoiceNo || 'INV-DISP-7712',
      gatePassNo: d.gatePassNo || 'GP-2026-481779',
      challanNo: d.challanNo || `GVL/0${so.orderNo?.replace(/\D/g, '') || '4874'}/26-27`,
      date: d.dispatchTime ? new Date(d.dispatchTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '01 Jul 2026',
      cratesDispatched: d.cratesCount || totalUnits,
      sealNo: d.sealNo || 'SEAL-2026-8801',
      lrNo: d.lrNo || 'LR-2026-6104',
      vehicleNo: d.vehicleNo || 'GJ15AV7963',
      driverName: d.driverName || 'AABID SAMA',
      driverMobile: d.driverMobile || '9687064462',
      transporter: d.transporter || 'Self',
      vendorCode: d.vendorCode || cust.code || 'VND-GNS-88',
      deliveryLocation: d.deliveryLocation || cust.city || 'Rheino Safari',
      department: d.department || 'ANIMAL KITCHEN',
      displayTemp: d.displayTemp || '20',
      setTemp: d.setTemp || '8°C',
      departureTemp: d.departureTemp || '10',
      company: (companies && companies[0]) || {
        name: 'GNOSIS VENTURES LLP',
        address: 'C/O SHIV COLD STORAGE, SURVEY NO. 105/5 KHIJADIYA BY PASS, CHOWKDI, KHIJADIYA DISTRICT JAMNAGAR-361120',
        gstNo: '24AANFG0052H1ZP'
      }
    });
  };

  // Handle Dispatch Submit
  const handleDispatchSubmit = (e) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedSo.customerId) || {};
    const res = dispatchSalesOrder(selectedSo.id, {
      vehicleNo: vehicleNo || 'GJ15AV7963',
      driverName: driverName || 'AABID SAMA',
      driverMobile: driverMobile || '9687064462',
      transporter: transporter || 'Self',
      vehicleId: selectedVehicleId,
      gatePassNo: selectedGatepassNo,
      cratesCount: cratesCount || '26',
      sealNo: sealNo || 'SEAL-2026-8801',
      lrNo: lrNo || 'LR-2026-6104',
      challanNo: challanNo || `GVL/0${selectedSo.orderNo.replace(/\D/g, '') || '4874'}/26-27`,
      deliveryLocation: deliveryLocation || cust.city || 'Rheino Safari',
      department: department || 'ANIMAL KITCHEN',
      displayTemp: displayTemp || '20',
      setTemp: setTemp || '8°C',
      departureTemp: departureTemp || '10',
      vendorCode: vendorCode || cust.code || 'VND-GNS-88'
    });

    alert(`Order dispatched successfully. Gatepass: ${res.gatePassNo}. Delivery Challan Generated.`);

    // Create / Record in dispatchInvoices ledger
    const numPart = selectedSo.orderNo ? selectedSo.orderNo.replace(/\D/g, '') : Math.floor(1000 + Math.random() * 9000);
    createDispatchInvoice({
      id: `INV-${numPart}`,
      orderId: numPart,
      orderNo: selectedSo.orderNo,
      orderType: 'Dispatch Order',
      priority: selectedSo.priority || 'Normal',
      orderDate: selectedSo.date || new Date().toISOString().substring(0, 10),
      salesDeliveryNo: selectedSo.salesDeliveryNo || `1784${Math.floor(100000 + Math.random() * 900000)}`,
      customerCode: cust.code || 'CUST',
      customerName: cust.name || selectedSo.customerName || 'Customer',
      shippingAddress: cust.address || `${cust.name}, ${cust.city || 'Jamnagar'}`,
      location: deliveryLocation || cust.city || '54 Acre',
      area: department || 'STAFF KITCHEN',
      orderBookingType: 'Sales Delivery Order',
      noOfProducts: selectedSo.items?.length || 1,
      challanNo: challanNo || `GVL/0${numPart}/26-27`,
      invoiceNo: res.invoiceNo || `GVL/0${numPart}/26-27`,
      gatePassNo: res.gatePassNo,
      vehicleNo: vehicleNo || 'GJ15AV7963',
      driverName: driverName || 'Aabid Sama',
      driverMobile: driverMobile || '9687064462',
      dispatchInvoiceDate: new Date().toISOString().substring(0, 10),
      dispatchTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Dispatched',
      cratesCount: cratesCount || '26',
      items: selectedSo.items || []
    });

    setInvoicePrintData({
      so: selectedSo,
      customer: cust,
      invoiceNo: res.invoiceNo,
      gatePassNo: res.gatePassNo,
      challanNo: challanNo || `GVL/0${selectedSo.orderNo.replace(/\D/g, '') || '4874'}/26-27`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      cratesDispatched: cratesCount || 26,
      sealNo: sealNo || 'SEAL-2026-8801',
      lrNo: lrNo || 'LR-2026-6104',
      vehicleNo: vehicleNo || 'GJ15AV7963',
      driverName: driverName || 'AABID SAMA',
      driverMobile: driverMobile || '9687064462',
      transporter: transporter || 'Self',
      vendorCode: vendorCode || cust.code || 'VND-GNS-88',
      deliveryLocation: deliveryLocation || cust.city || 'Rheino Safari',
      department: department || 'ANIMAL KITCHEN',
      displayTemp: displayTemp || '20',
      setTemp: setTemp || '8°C',
      departureTemp: departureTemp || '10',
      company: (companies && companies[0]) || {
        name: 'GNOSIS VENTURES LLP',
        address: 'C/O SHIV COLD STORAGE, SURVEY NO. 105/5 KHIJADIYA BY PASS, CHOWKDI, KHIJADIYA DISTRICT JAMNAGAR-361120',
        gstNo: '24AANFG0052H1ZP'
      }
    });

    // Clear and redirect to 4. Outward Invoice & Challan
    setSelectedSo(null);
    setVehicleNo('GJ15AV7963');
    setDriverName('AABID SAMA');
    setTransporter('Self');
    setSelectedVehicleId('');
    setSelectedGatepassNo('');
    setActiveStep('invoice_challan');
  };

  // 5. Signature Pad Logic
  useEffect(() => {
    if (activeStep === 'delivery' && selectedSo && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#059669'; // Emerald-600
    }
  }, [activeStep, selectedSo]);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleConfirmDelivery = () => {
    const signatureBase64 = canvasRef.current.toDataURL();
    confirmSOArrival(selectedSo.id, signatureBase64);
    alert('Delivery completed. Signature recorded, gate pass vehicle status closed.');
    setSelectedSo(null);
    setActiveStep('so');
  };

  // Handle Open FEFO Picklist Slip
  const handleOpenPicklist = (so) => {
    const cust = customers.find(c => c.id === so.customerId) || {};
    const allPicks = [];
    let isFullySatisfied = true;
    const shortfalls = [];

    (so.items || []).forEach(item => {
      const suggest = getFefoPickingSuggestions(item.productId, item.qty);
      allPicks.push(...suggest.picks.map(p => ({
        ...p,
        productId: item.productId
      })));
      if (!suggest.isFullySatisfied) {
        isFullySatisfied = false;
        shortfalls.push({
          productId: item.productId,
          qtyNeeded: item.qty,
          qtyShort: suggest.shortfall
        });
      }
    });

    setPicklistModalData({
      so,
      customer: cust,
      picks: allPicks,
      isFullySatisfied,
      shortfalls,
      picklistNo: `PL-2026-${so.orderNo ? so.orderNo.replace(/\D/g, '') : Math.floor(1000 + Math.random() * 9000)}`,
      date: so.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    });
  };

  // Handle Edit Sales Order
  const handleEditSalesOrder = (so) => {
    setEditingSo(so);
    setSoDrawerOpen(true);
  };

  // Handle Delete Sales Order
  const handleDeleteSalesOrder = (so) => {
    setDeleteConfirmSo(so);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmSo) return;
    if (typeof deleteSalesOrder === 'function') {
      deleteSalesOrder(deleteConfirmSo.id);
    } else {
      const updated = salesOrders.filter(so => so.id !== deleteConfirmSo.id);
      setSalesOrders(updated);
      logAction(`Deleted Sales Order: ${deleteConfirmSo.orderNo}`, 'Outbound', 'Warning');
    }
    setDeleteConfirmSo(null);
  };

  // Save / Create Sales Order Handler
  const handleSaveSalesOrder = (soPayload, isEdit) => {
    if (isEdit) {
      if (typeof updateSalesOrder === 'function') {
        updateSalesOrder(soPayload.id, soPayload);
      } else {
        const updated = salesOrders.map(so => so.id === soPayload.id ? soPayload : so);
        setSalesOrders(updated);
        logAction(`Updated Sales Order: ${soPayload.orderNo}`, 'Outbound');
      }
    } else {
      const updated = [soPayload, ...(salesOrders || [])];
      setSalesOrders(updated);
      logAction(`Created Sales Order: ${soPayload.orderNo} (Ref: ${soPayload.salesDeliveryNo}) for ${soPayload.customerName || 'Customer'}`, 'Outbound');
    }
    setSoDrawerOpen(false);
    setEditingSo(null);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6 animate-in fade-in-50 duration-200">

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">Outbound Process Console</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Manage Sales Orders, Wave Picking (FIFO/FEFO), Crates Loading, and Deliveries.</p>
        </div>

        <button
          onClick={() => {
            setEditingSo(null);
            setSoDrawerOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 text-xs transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Sales Order</span>
        </button>
      </div>

      {/* 5-Step Process Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          onClick={() => setActiveStep('so')}
          className={`flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-lg border transition-all ${activeStep === 'so'
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-500'
            : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800 text-zinc-500'
            }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>1. Sales Orders</span>
        </button>

        <button
          onClick={() => {
            setActiveStep('picking');
            setSelectedSo(null);
            setActivePicks(null);
          }}
          className={`flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-lg border transition-all ${activeStep === 'picking'
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-500'
            : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800 text-zinc-500'
            }`}
        >
          <CheckSquare className="h-4 w-4" />
          <span>2. Wave Picking</span>
        </button>

        <button
          onClick={() => {
            setActiveStep('dispatch');
            setSelectedSo(null);
          }}
          className={`flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-lg border transition-all ${activeStep === 'dispatch'
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-500'
            : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800 text-zinc-500'
            }`}
        >
          <Truck className="h-4 w-4" />
          <span>3. Shipping Dispatch</span>
        </button>

        <button
          onClick={() => {
            setActiveStep('invoice_challan');
            setSelectedSo(null);
          }}
          className={`flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-lg border transition-all ${activeStep === 'invoice_challan'
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-500'
            : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800 text-zinc-500'
            }`}
        >
          <FileText className="h-4 w-4" />
          <span>4. Outward Invoice & Challan</span>
        </button>

        <button
          onClick={() => {
            setActiveStep('delivery');
            setSelectedSo(null);
          }}
          className={`flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-lg border transition-all ${activeStep === 'delivery'
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-500'
            : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800 text-zinc-500'
            }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>5. Confirm Delivery</span>
        </button>
      </div>

      {/* Main panel card */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden p-6">

        {/* Step 1: Sales Orders ledger */}
        {activeStep === 'so' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    New Sales Orders Ledger
                  </h3>
                </div>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  Showing new incoming orders awaiting picking wave calculation and fulfillment
                </span>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 border border-amber-200/60 dark:border-amber-800/40 self-start sm:self-auto">
                {pickingPendingOrders.length} New Orders Pending
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500">
                    <th className="p-3">Order Number</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Order Date</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Order Items</th>
                    <th className="p-3">Current Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {pickingPendingOrders.map(so => {
                    const cust = customers.find(c => c.id === so.customerId);
                    return (
                      <tr key={so.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                        <td className="p-3 font-mono font-bold text-zinc-900 dark:text-white">{so.orderNo}</td>
                        <td className="p-3 font-semibold">{cust?.name || so.customerName || 'N/A'}</td>
                        <td className="p-3 font-mono">{so.date}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${so.priority === 'High' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600' : 'bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500'}`}>
                            {so.priority}
                          </span>
                        </td>
                        <td className="p-3">
                          {(so.items || []).map(item => {
                            const prod = products.find(p => p.id === item.productId || p.code === item.productCode);
                            return (
                              <div key={item.productId || item.productCode} className="text-[10px] text-zinc-500">
                                {prod?.description || item.description || 'Product'} ({item.qty} expected)
                              </div>
                            );
                          })}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-200/50 dark:border-amber-800/30">
                            {so.status}
                          </span>
                        </td>
                        <td className="p-3 text-right font-semibold">
                          <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                            {/* 1. Primary Action: Release Wave Picking */}
                            <button
                              onClick={() => handleStartPicking(so)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
                              title="Release Wave Picking"
                            >
                              <Layers className="h-3.5 w-3.5" />
                              <span>Release Pick Wave</span>
                            </button>

                            {/* 2. Edit Action Icon Button */}
                            <button
                              onClick={() => handleEditSalesOrder(so)}
                              className="p-1.5 bg-white dark:bg-[#0c0c0f] hover:bg-blue-50 dark:hover:bg-blue-950/30 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-800 shadow-xs"
                              title="Edit Sales Order"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            {/* 3. Delete Action Icon Button */}
                            <button
                              onClick={() => handleDeleteSalesOrder(so)}
                              className="p-1.5 bg-white dark:bg-[#0c0c0f] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-800 shadow-xs"
                              title="Delete Sales Order"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {pickingPendingOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-zinc-400 text-xs">
                        No new sales orders pending. Click <strong className="text-emerald-600 font-bold cursor-pointer hover:underline" onClick={() => { setEditingSo(null); setSoDrawerOpen(true); }}>+ New Sales Order</strong> to create an order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 2: Wave Picking Terminal & Picklist Ledger */}
        {activeStep === 'picking' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {/* Top Toolbar: Search, Filters & Counters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#009688]/10 dark:bg-[#009688]/20 text-[#009688] dark:text-[#26a69a] rounded-xl">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Wave Picklist Management</h3>
                  <span className="text-[10px] text-zinc-500">Track, print, and execute batch-wise HHT warehouse picking lists</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search Picklist ID, Order, Client..."
                    value={picklistFilterQuery}
                    onChange={(e) => setPicklistFilterQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#009688]"
                  />
                </div>

                {/* Status Filter Buttons */}
                <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-100 dark:bg-zinc-900 text-xs">
                  <button
                    onClick={() => setPicklistStatusFilter('All')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${picklistStatusFilter === 'All'
                      ? 'bg-white dark:bg-[#0c0c0f] text-zinc-900 dark:text-white shadow-xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                  >
                    All ({filteredPicklists.length})
                  </button>
                  <button
                    onClick={() => setPicklistStatusFilter('Pending')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${picklistStatusFilter === 'Pending'
                      ? 'bg-white dark:bg-[#0c0c0f] text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                  >
                    Pending ({picklists.filter(p => p.pickingStatus?.includes('pending') || p.status?.includes('pending')).length})
                  </button>
                  <button
                    onClick={() => setPicklistStatusFilter('Done')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${picklistStatusFilter === 'Done'
                      ? 'bg-white dark:bg-[#0c0c0f] text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                  >
                    Done ({picklists.filter(p => p.pickingStatus === 'Picking Done' || p.status === 'Picking Done').length})
                  </button>
                </div>
              </div>
            </div>

            {/* Exact Picklist Ledger Table matching user screenshot */}
            <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xs">
              <table className="w-full text-left text-[11px] border-collapse min-w-[1250px]">
                <thead>
                  <tr className="bg-[#009688] text-white font-bold text-[11px] select-none border-b border-[#00796b]">
                    <th className="p-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={selectedPicklistIds.length > 0 && selectedPicklistIds.length === filteredPicklists.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPicklistIds(filteredPicklists.map(p => p.id));
                          } else {
                            setSelectedPicklistIds([]);
                          }
                        }}
                        className="rounded border-white/60 text-emerald-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="p-3 text-center whitespace-nowrap">Picking ID</th>
                    <th className="p-3 text-center whitespace-nowrap">Order Id</th>
                    <th className="p-3 text-center whitespace-nowrap">Sales Delivery No.</th>
                    <th className="p-3 whitespace-nowrap">Customer Name</th>
                    <th className="p-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <span>Suggested Picklist</span>
                      </div>
                    </th>
                    <th className="p-3 text-center whitespace-nowrap">Billing / Delivery Location</th>
                    <th className="p-3 text-center whitespace-nowrap">Area</th>
                    <th className="p-3 text-center whitespace-nowrap">Channel And Web Store</th>
                    <th className="p-3 text-center whitespace-nowrap">Picking Issue Date</th>
                    <th className="p-3 text-center whitespace-nowrap">Picking END Date</th>
                    <th className="p-3 text-center whitespace-nowrap">Pick Wise</th>
                    <th className="p-3 text-center whitespace-nowrap">Picklist Generate Mode</th>
                    <th className="p-3 text-center whitespace-nowrap">Picking Status</th>
                    <th className="p-3 text-center whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-[#0c0c0f]">
                  {filteredPicklists.map(pl => {
                    const isSelected = selectedPicklistIds.includes(pl.id);
                    const isDone = pl.pickingStatus === 'Picking Done' || pl.status === 'Picking Done';

                    return (
                      <tr
                        key={pl.id}
                        className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors ${isSelected ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                          }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPicklistIds(prev => [...prev, pl.id]);
                              } else {
                                setSelectedPicklistIds(prev => prev.filter(id => id !== pl.id));
                              }
                            }}
                            className="rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* Picking ID */}
                        <td className="p-3 text-center font-mono font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                          {pl.pickingId}
                        </td>

                        {/* Order Id */}
                        <td className="p-3 text-center font-mono text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          {pl.orderId}
                        </td>

                        {/* Sales Delivery No. */}
                        <td className="p-3 text-center font-mono text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          {pl.salesDeliveryNo}
                        </td>

                        {/* Customer Name */}
                        <td className="p-3 font-medium text-zinc-900 dark:text-zinc-100 max-w-[200px] truncate">
                          {pl.customerName}
                        </td>

                        {/* Suggested Picklist (Red PDF icon + checkbox) */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenPicklistFromRecord(pl)}
                              className="p-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded border border-rose-200 dark:border-rose-900/50 transition-colors"
                              title="View / Print Picklist PDF Slip"
                            >
                              <FileText className="h-4 w-4 text-rose-600" />
                            </button>
                            <span className="text-zinc-300 dark:text-zinc-700">|</span>
                            <input
                              type="checkbox"
                              defaultChecked
                              className="rounded border-zinc-300 text-rose-600 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                            />
                          </div>
                        </td>

                        {/* Billing / Delivery Location */}
                        <td className="p-3 text-center text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          {pl.deliveryLocation || '54 Acre'}
                        </td>

                        {/* Area */}
                        <td className="p-3 text-center font-bold text-[10px] text-zinc-700 dark:text-zinc-300 uppercase whitespace-nowrap">
                          {pl.area || 'STAFF KITCHEN'}
                        </td>

                        {/* Channel And Web Store */}
                        <td className="p-3 text-center text-zinc-400 whitespace-nowrap">
                          {pl.channel || ''}
                        </td>

                        {/* Picking Issue Date */}
                        <td className="p-3 text-center font-mono text-[10px] text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          {pl.pickingIssueDate || ''}
                        </td>

                        {/* Picking END Date */}
                        <td className="p-3 text-center font-mono text-[10px] text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          {pl.pickingEndDate || ''}
                        </td>

                        {/* Pick Wise */}
                        <td className="p-3 text-center text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          {pl.pickWise || 'Batch Wise'}
                        </td>

                        {/* Picklist Generate Mode */}
                        <td className="p-3 text-center font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          {pl.picklistGenerateMode || 'HHT'}
                        </td>

                        {/* Picking Status */}
                        <td className="p-3 text-center font-semibold whitespace-nowrap">
                          {isDone ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                              Picking Done
                            </span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                              Picklist completed. But Picking pending
                            </span>
                          )}
                        </td>

                        {/* Action Icons */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            {isDone ? (
                              <>
                                {/* Green Document Icon */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenPicklistFromRecord(pl)}
                                  className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 rounded transition-colors"
                                  title="View / Print Picking Slip"
                                >
                                  <FileText className="h-4 w-4 fill-emerald-600 text-white" />
                                </button>

                                {/* Green Eye Icon */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenPicklistFromRecord(pl)}
                                  className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 rounded transition-colors"
                                  title="Preview Picklist Allocations"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>

                                {/* Red Trash Icon */}
                                <button
                                  type="button"
                                  onClick={() => deletePicklist(pl.id)}
                                  className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 rounded transition-colors"
                                  title="Delete Picklist Record"
                                >
                                  <Trash2 className="h-4 w-4 fill-rose-600 text-white" />
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Orange Edit Icon */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenPicklistFromRecord(pl)}
                                  className="p-1 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-orange-500 rounded transition-colors"
                                  title="Edit Picklist Allocations"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>

                                {/* Orange/Green Checkmark Icon: Confirm Picking */}
                                <button
                                  type="button"
                                  onClick={() => handleConfirmPicklistExecution(pl)}
                                  className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 rounded transition-colors"
                                  title="Confirm & Execute Picking (Done)"
                                >
                                  <Check className="h-4 w-4 stroke-[3]" />
                                </button>

                                {/* Red Trash Icon */}
                                <button
                                  type="button"
                                  onClick={() => deletePicklist(pl.id)}
                                  className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 rounded transition-colors"
                                  title="Delete Picklist Record"
                                >
                                  <Trash2 className="h-4 w-4 fill-rose-600 text-white" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredPicklists.length === 0 && (
                    <tr>
                      <td colSpan={15} className="py-12 text-center text-xs text-zinc-400 italic">
                        No picklists found matching the filter criteria. Release an order from Sales Orders tab to generate a picklist.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 3: Shipping Dispatch */}
        {activeStep === 'dispatch' && (
          <div className="space-y-6">
            {!selectedSo ? (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Orders Packed & Ready for Loading</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dispatchPendingOrders.map(so => {
                    const cust = customers.find(c => c.id === so.customerId);
                    return (
                      <div key={so.id} className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl p-4 flex flex-col justify-between h-40 shadow-sm animate-in fade-in">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="font-mono font-bold text-zinc-950 dark:text-white text-sm">{so.orderNo}</span>
                            <span className="bg-blue-50 dark:bg-blue-950/20 text-blue-600 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">{so.status}</span>
                          </div>
                          <span className="block text-[11px] text-zinc-500 font-semibold mt-1">To: {cust?.name}</span>
                          <span className="block text-[10px] text-zinc-400 mt-1">{so.items.length} lines packed in crates.</span>
                        </div>
                        <button
                          onClick={() => setSelectedSo(so)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded text-xs transition-colors"
                        >
                          Process Loading Gate Pass
                        </button>
                      </div>
                    );
                  })}
                  {dispatchPendingOrders.length === 0 && (
                    <div className="col-span-full text-center py-12 text-zinc-400 text-xs">
                      No packed orders are waiting for loading. Fulfill picking lists from Wave Picking tab.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Enhanced Dispatch & Gatepass Vehicle Selection Form
              <div className="space-y-6 animate-in fade-in-50 duration-200">

                {/* Header with Back button and Order Summary */}
                <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedSo(null);
                        setSelectedVehicleId('');
                        setVehicleNo('');
                        setDriverName('');
                        setTransporter('');
                        setSelectedGatepassNo('');
                      }}
                      className="p-2 bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors shadow-xs"
                      title="Back to Packed Orders List"
                    >
                      <ArrowRight className="h-4 w-4 rotate-180" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-zinc-900 dark:text-white">{selectedSo.orderNo}</span>
                        <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          Packed & Ready
                        </span>
                        {selectedSo.priority === 'High' && (
                          <span className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
                            High Priority
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-0.5">
                        Client: <strong className="text-zinc-800 dark:text-zinc-200">{customers.find(c => c.id === selectedSo.customerId)?.name}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* View Picklist Button in Shipping Dispatch */}
                    <button
                      type="button"
                      onClick={() => handleOpenPicklist(selectedSo)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 transition-colors shadow-xs"
                      title="View / Print Order Picklist"
                    >
                      <ClipboardList className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span>View Picklist</span>
                    </button>

                    {/* Preview Delivery Challan Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenChallanForOrder(selectedSo)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors shadow-xs"
                      title="Preview Delivery Challan Slip"
                    >
                      <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Preview Challan</span>
                    </button>

                    <div className="flex items-center gap-2 text-xs bg-white dark:bg-[#0c0c0f] px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                      <span className="text-zinc-400 font-medium">Items:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{selectedSo.items?.length || 0} SKUs</span>
                      <span className="text-zinc-300 dark:text-zinc-700">|</span>
                      <span className="text-zinc-400 font-medium">Volume:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedSo.items?.reduce((s, i) => s + (Number(i.qty) || 0), 0)} Units
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2-Column Layout: Gatepass Vehicles List vs Dispatch Form */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                  {/* Left Column: Gatepass Created Vehicles in Yard (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                            Open Outward Vehicles in Yard
                          </h3>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          Select any open checked-in vehicle for outward shipment dispatch
                        </span>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 self-start sm:self-auto">
                        {openOutwardVehicles.length} Open for Outward
                      </span>
                    </div>

                    {/* Filter yard vehicles */}
                    {yardVehicles.length > 0 && (
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Filter yard vehicles by plate, driver, or gatepass..."
                          value={vehicleFilterQuery}
                          onChange={(e) => setVehicleFilterQuery(e.target.value)}
                          className="w-full bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-8 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    )}

                    {/* Cards List of Gate Pass Created Vehicles */}
                    <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                      {filteredYardVehicles.map(veh => {
                        const isSelected = selectedVehicleId === veh.id || vehicleNo === veh.vehicleNo;
                        const isSoMatched = (veh.bookingRefDocNo === selectedSo.orderNo || veh.bookingRefDocNo === selectedSo.id);

                        return (
                          <div
                            key={veh.id}
                            onClick={() => handleSelectYardVehicle(veh)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${isSelected
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                              : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-800/60 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40'
                              }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                                  <Truck className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-extrabold text-xs text-zinc-900 dark:text-white">
                                      {veh.vehicleNo}
                                    </span>
                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                      {veh.gatepassNo || 'GP-ENTRY'}
                                    </span>
                                    {isSoMatched && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                                        Matched SO
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                                    Driver: <strong className="text-zinc-700 dark:text-zinc-300">{veh.driverName}</strong> | Carrier: <span className="text-zinc-600 dark:text-zinc-400">{veh.transporter || 'Self Transport'}</span>
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${veh.status === 'Gate In'
                                  ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/40'
                                  : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40'
                                  }`}>
                                  {veh.status}
                                </span>
                                <span className="block text-[9px] text-zinc-400 font-mono mt-1 flex items-center justify-end gap-1">
                                  <Clock className="h-2.5 w-2.5" /> {veh.inDateTime ? veh.inDateTime.substring(11, 16) : 'Checked In'}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex justify-between items-center text-[10px]">
                              <span className="text-zinc-400">
                                Type: <strong className="text-zinc-600 dark:text-zinc-400">{veh.processType || 'Outbound'}</strong> ({veh.bookingType || 'Sales Dispatch'})
                              </span>
                              <span className={`font-bold flex items-center gap-1 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 hover:text-emerald-600'}`}>
                                {isSelected ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Selected for Loading</span>
                                  </>
                                ) : (
                                  <span>Click to Select &rarr;</span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {filteredYardVehicles.length === 0 && (
                        <div className="text-center py-10 px-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3 bg-zinc-50/50 dark:bg-zinc-900/20">
                          <Truck className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
                          <div className="space-y-0.5">
                            <span className="block text-xs font-bold text-zinc-600 dark:text-zinc-300">
                              No matching vehicles checked in the yard
                            </span>
                            <span className="text-[10px] text-zinc-400 block">
                              You can manually enter vehicle details below or register a new truck at the gate.
                            </span>
                          </div>
                          {navigateTo && (
                            <button
                              type="button"
                              onClick={() => navigateTo('gatepass', 'pending_vehicle')}
                              className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40 hover:bg-emerald-100 transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Go to Gatepass Check-In</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Dispatch & Loading Verification Form (5 cols) */}
                  <div className="lg:col-span-5 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-[#0c0c0f] shadow-sm space-y-5 h-fit">
                    <div className="border-b border-zinc-150 dark:border-zinc-800 pb-3">
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span>Loading & Gate-Out Verification</span>
                      </h3>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        Confirm loading and generate official Outbound Gatepass
                      </span>
                    </div>

                    {/* Active Link Notice */}
                    {selectedGatepassNo ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Linked Gatepass Vehicle</span>
                        </div>
                        <div className="text-[11px] text-emerald-800 dark:text-emerald-400 font-mono">
                          Pass ID: <span className="font-bold">{selectedGatepassNo}</span> | Truck: <span className="font-bold">{vehicleNo}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="block text-[11px]">
                          Select a gatepass truck from the list or manually type vehicle details below.
                        </span>
                      </div>
                    )}

                    <form onSubmit={handleDispatchSubmit} className="space-y-4">

                      {/* 1. Gatepass Selector Dropdown */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase flex items-center justify-between">
                          <span>Select Gatepass / Yard Vehicle</span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">Active Yard Queue</span>
                        </label>
                        <select
                          value={selectedVehicleId}
                          onChange={(e) => {
                            const veh = yardVehicles.find(v => v.id === e.target.value);
                            handleSelectYardVehicle(veh);
                          }}
                          className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 font-medium"
                        >
                          <option value="">-- Choose from Gatepass Created Vehicles --</option>
                          {yardVehicles.map(veh => (
                            <option key={veh.id} value={veh.id}>
                              {veh.gatepassNo || 'GP'} | {veh.vehicleNo} - {veh.driverName} ({veh.transporter || 'Self'}) [{veh.status}]
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Dispatch Logistics & Security Details (Crates, Seal, LR) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-150 dark:border-zinc-800">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase">Crates / Carats (Qty)</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              required
                              value={cratesCount}
                              onChange={(e) => setCratesCount(e.target.value)}
                              placeholder="e.g. 25"
                              className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            />
                            <span className="absolute right-2.5 top-2.5 text-[10px] text-zinc-400 font-semibold">Crates</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase">Security Seal No.</label>
                          <input
                            type="text"
                            required
                            value={sealNo}
                            onChange={(e) => setSealNo(e.target.value.toUpperCase())}
                            placeholder="e.g. SEAL-998821"
                            className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase">LR / Bilty No.</label>
                          <input
                            type="text"
                            required
                            value={lrNo}
                            onChange={(e) => setLrNo(e.target.value.toUpperCase())}
                            placeholder="e.g. LR-2026-8812"
                            className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                          />
                        </div>
                      </div>

                      {/* 3. Vehicle & Driver Verification */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-150 dark:border-zinc-800">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase">Outbound Vehicle No.</label>
                          <input
                            type="text"
                            required
                            value={vehicleNo}
                            onChange={(e) => {
                              setVehicleNo(e.target.value.toUpperCase());
                              setSelectedVehicleId('');
                            }}
                            placeholder="e.g. GJ15AV7963"
                            className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase">Driver Name</label>
                          <input
                            type="text"
                            required
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            placeholder="e.g. AABID SAMA"
                            className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase">Driver Mobile / Phone</label>
                          <input
                            type="text"
                            required
                            value={driverMobile}
                            onChange={(e) => setDriverMobile(e.target.value)}
                            placeholder="e.g. 9687064462"
                            className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase">Carrier / Transporter</label>
                          <input
                            type="text"
                            required
                            value={transporter}
                            onChange={(e) => setTransporter(e.target.value)}
                            placeholder="e.g. Self Transport / Gnosis Logistics"
                            className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                          />
                        </div>
                      </div>

                      {/* 4. Delivery Challan & Cold-Chain Telemetry Details */}
                      <div className="pt-2 border-t border-zinc-150 dark:border-zinc-800 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/20 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          <Thermometer className="h-4 w-4" />
                          <span>Delivery Challan & Temperature Telemetry</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase">Challan Ref No.</label>
                            <input
                              type="text"
                              required
                              value={challanNo}
                              onChange={(e) => setChallanNo(e.target.value)}
                              placeholder="e.g. GVL/04874/26-27"
                              className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase">Vendor / Client Code</label>
                            <input
                              type="text"
                              required
                              value={vendorCode}
                              onChange={(e) => setVendorCode(e.target.value)}
                              placeholder="e.g. VND-GNS-88"
                              className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase">Delivery Location</label>
                            <input
                              type="text"
                              required
                              value={deliveryLocation}
                              onChange={(e) => setDeliveryLocation(e.target.value)}
                              placeholder="e.g. Rheino Safari"
                              className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-xs text-zinc-900 dark:text-zinc-100"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase">Kitchen / Department</label>
                            <input
                              type="text"
                              required
                              value={department}
                              onChange={(e) => setDepartment(e.target.value)}
                              placeholder="e.g. ANIMAL KITCHEN"
                              className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-xs text-zinc-900 dark:text-zinc-100"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase">Display Temp</label>
                            <input
                              type="text"
                              required
                              value={displayTemp}
                              onChange={(e) => setDisplayTemp(e.target.value)}
                              placeholder="20"
                              className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 text-center"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase">Set Temp</label>
                            <input
                              type="text"
                              required
                              value={setTemp}
                              onChange={(e) => setSetTemp(e.target.value)}
                              placeholder="8°C"
                              className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 text-center"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase">Departure Temp</label>
                            <input
                              type="text"
                              required
                              value={departureTemp}
                              onChange={(e) => setDepartureTemp(e.target.value)}
                              placeholder="10"
                              className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 text-center"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSo(null);
                            setSelectedVehicleId('');
                            setVehicleNo('GJ15AV7963');
                            setDriverName('AABID SAMA');
                            setTransporter('Self');
                            setSelectedGatepassNo('');
                          }}
                          className="w-1/3 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl py-2.5 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="w-2/3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-2.5 transition-colors shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98]"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Generate Delivery Challan & Dispatch</span>
                        </button>
                      </div>
                    </form>

                  </div>

                </div>

              </div>
            )}

            {/* Official Delivery Challan Modal */}
            <DeliveryChallanModal
              isOpen={Boolean(invoicePrintData)}
              onClose={() => setInvoicePrintData(null)}
              challanData={invoicePrintData}
              products={products}
              customers={customers}
            />
          </div>
        )}

        {/* Step 4: Outward Invoice & Delivery Challan Ledger Table */}
        {activeStep === 'invoice_challan' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {/* Title Banner */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-black text-[#009688] dark:text-[#26a69a] tracking-wide uppercase flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-[#009688] dark:text-[#26a69a]" />
                  <span>DISPATCH INVOICE AND E-WAY BILL DETAILS MANAGEMENT</span>
                </h2>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold mt-0.5">
                  Searched values : Default Search | Showing <strong className="text-zinc-900 dark:text-white">{filteredDispatchInvoices.length}</strong> by default of <strong className="text-zinc-900 dark:text-white">{dispatchInvoices.length}</strong> entries
                </div>
              </div>

              {/* Action Tools: Search & Export */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search order, delivery no, customer, challan..."
                    value={invoiceSearchQuery}
                    onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                    className="w-64 sm:w-80 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {invoiceSearchQuery && (
                    <button
                      onClick={() => setInvoiceSearchQuery('')}
                      className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const csvRows = [
                      ['Order ID', 'Order Type', 'Priority', 'Order Date', 'Sales Delivery Number', 'Customer Code', 'Customer Name', 'Shipping Address', 'Location', 'Area', 'Order Booking Type', 'No. of Products', 'Challan/Invoice Number', 'Dispatch Invoice Date', 'Vehicle No', 'Driver Name'],
                      ...filteredDispatchInvoices.map(inv => [
                        inv.orderId,
                        inv.orderType || 'Dispatch Order',
                        inv.priority || 'Normal',
                        inv.orderDate,
                        inv.salesDeliveryNo,
                        inv.customerCode,
                        inv.customerName,
                        `"${(inv.shippingAddress || '').replace(/"/g, '""')}"`,
                        inv.location,
                        inv.area,
                        inv.orderBookingType || 'Sales Delivery Order',
                        inv.noOfProducts || (inv.items?.length || 1),
                        inv.challanNo || inv.invoiceNo,
                        inv.dispatchInvoiceDate,
                        inv.vehicleNo,
                        inv.driverName
                      ])
                    ];
                    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `Dispatch_Invoices_${new Date().toISOString().substring(0, 10)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors shadow-xs"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Comprehensive 19-Column Ledger Table matching user screenshot */}
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs bg-white dark:bg-[#0c0c0f]">
              <table className="w-full text-left text-xs border-collapse min-w-[1750px]">
                <thead>
                  <tr className="bg-[#009688] text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-2 text-center border-r border-teal-600/40 w-16">Order ID</th>
                    <th className="py-3 px-2 text-center border-r border-teal-600/40 w-24">Order Type</th>
                    <th className="py-3 px-2 text-center border-r border-teal-600/40 w-20">Order Priority</th>
                    <th className="py-3 px-2 text-center border-r border-teal-600/40 w-24">Order Date</th>
                    <th className="py-3 px-2 text-center border-r border-teal-600/40 w-28">Sales Delivery Number</th>
                    <th className="py-3 px-2 text-center border-r border-teal-600/40 w-20">Customer Code</th>
                    <th className="py-3 px-3 text-left border-r border-teal-600/40 w-44">Customer Name</th>
                    <th className="py-3 px-3 text-left border-r border-teal-600/40 w-60">Shipping Address</th>
                    <th className="py-3 px-2 text-center border-r border-teal-600/40 w-24">Location</th>
                    <th className="py-3 px-2 text-center border-r border-teal-600/40 w-28">Area</th>
                    <th className="py-3 px-2 text-center border-r border-teal-600/40 w-28">Order Booking Type</th>
                    <th className="py-3 px-2 text-center border-r border-teal-600/40 w-16">No.of Product</th>
                    <th className="py-3 px-3 text-center border-r border-teal-600/40 w-36">Add & Update Dispatch Invoice Details</th>
                    <th className="py-3 px-2 text-center border-r border-teal-600/40 w-32">Challan / Invoice Number</th>
                    <th className="py-3 px-2 text-center border-r border-teal-600/40 w-28">Print Delivery Challan</th>
                    <th className="py-3 px-2 text-center border-r border-teal-600/40 w-32">Dispatch Invoice</th>
                    <th className="py-3 px-2 text-center w-28">Dispatch Invoice Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200">
                  {filteredDispatchInvoices.map((inv, idx) => (
                    <tr
                      key={inv.id || idx}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      {/* Order ID */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-zinc-900 dark:text-white border-r border-zinc-100 dark:border-zinc-800/60">
                        {inv.orderId}
                      </td>

                      {/* Order Type */}
                      <td className="py-3 px-2 text-center text-[11px] text-zinc-700 dark:text-zinc-300 border-r border-zinc-100 dark:border-zinc-800/60">
                        {inv.orderType || 'Dispatch Order'}
                      </td>

                      {/* Order Priority */}
                      <td className="py-3 px-2 text-center border-r border-zinc-100 dark:border-zinc-800/60">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.priority === 'High'
                          ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border border-rose-200 dark:border-rose-800/40'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                          }`}>
                          {inv.priority || 'Normal'}
                        </span>
                      </td>

                      {/* Order Date */}
                      <td className="py-3 px-2 text-center font-mono text-[11px] text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800/60">
                        {inv.orderDate || '16-07-2026'}
                      </td>

                      {/* Sales Delivery Number */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-zinc-800 dark:text-zinc-200 border-r border-zinc-100 dark:border-zinc-800/60">
                        {inv.salesDeliveryNo || '1784155315'}
                      </td>

                      {/* Customer Code */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-zinc-900 dark:text-white border-r border-zinc-100 dark:border-zinc-800/60">
                        {inv.customerCode || 'RIL'}
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-3 text-left font-semibold text-zinc-900 dark:text-white border-r border-zinc-100 dark:border-zinc-800/60">
                        {inv.customerName}
                      </td>

                      {/* Shipping Address */}
                      <td className="py-3 px-3 text-left text-[11px] text-zinc-500 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800/60">
                        {inv.shippingAddress || 'Reliance Industries Ltd, Village: Meghpar, Padana, PO: Motikhavdi, Dist. Jamnagar'}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-2 text-center text-[11px] text-zinc-700 dark:text-zinc-300 border-r border-zinc-100 dark:border-zinc-800/60">
                        {inv.location || ''}
                      </td>

                      {/* Area */}
                      <td className="py-3 px-2 text-center font-bold text-[11px] text-zinc-800 dark:text-zinc-200 border-r border-zinc-100 dark:border-zinc-800/60">
                        {inv.area || 'STAFF KITCHEN'}
                      </td>

                      {/* Order Booking Type */}
                      <td className="py-3 px-2 text-center text-[11px] text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800/60">
                        {inv.orderBookingType || 'Sales Delivery Order'}
                      </td>

                      {/* No.of Product */}
                      <td className="py-3 px-2 text-center font-bold font-mono text-zinc-900 dark:text-white border-r border-zinc-100 dark:border-zinc-800/60">
                        {inv.noOfProducts || (inv.items?.length || 1)}
                      </td>

                      {/* Add & Update Dispatch Invoice Details + POD Status */}
                      <td className="py-3 px-3 text-center border-r border-zinc-100 dark:border-zinc-800/60">
                        <div className="flex flex-col gap-1.5 items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleOpenChallanForInvoiceRecord(inv)}
                            className="px-3 py-0.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-full text-[10px] font-extrabold shadow-xs transition-colors tracking-wide"
                          >
                            VIEW INVOICE
                          </button>

                          {inv.status === 'POD Confirmed' || inv.podStatus === 'POD Confirmed' ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 flex items-center gap-1 shadow-xs">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>POD Confirmed</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenPodConfirmation(inv)}
                              className="px-2.5 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-[9px] font-extrabold shadow-xs transition-colors flex items-center gap-1 active:scale-95"
                              title="Confirm Proof of Delivery with Customer Signature"
                            >
                              <Check className="h-3 w-3" />
                              <span>Confirm POD</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Challan / Invoice Number */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-zinc-900 dark:text-white text-[11px] border-r border-zinc-100 dark:border-zinc-800/60">
                        {inv.challanNo || inv.invoiceNo || 'GVL/00012/26-27'}
                      </td>

                      {/* Print Delivery Challan (Single Column with Red PDF Icon) */}
                      <td className="py-3 px-2 text-center border-r border-zinc-100 dark:border-zinc-800/60">
                        <button
                          type="button"
                          onClick={() => handleOpenChallanForInvoiceRecord(inv)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-rose-600 dark:text-rose-400 transition-colors"
                          title="Print Delivery Challan"
                        >
                          <FileText className="h-5 w-5 mx-auto" />
                        </button>
                      </td>

                      {/* Dispatch Invoice */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-zinc-800 dark:text-zinc-200 text-[11px] border-r border-zinc-100 dark:border-zinc-800/60">
                        {inv.invoiceNo || inv.challanNo || 'GVL/00012/26-27'}
                      </td>

                      {/* Dispatch Invoice Date */}
                      <td className="py-3 px-2 text-center font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                        {inv.dispatchInvoiceDate || '2026-07-16'}
                      </td>
                    </tr>
                  ))}

                  {filteredDispatchInvoices.length === 0 && (
                    <tr>
                      <td colSpan={17} className="py-12 text-center text-zinc-400 text-xs">
                        No dispatch invoices or delivery challans found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Delivery Challan Modal for viewing/printing invoice */}
            <DeliveryChallanModal
              isOpen={Boolean(invoicePrintData)}
              onClose={() => setInvoicePrintData(null)}
              challanData={invoicePrintData}
              products={products}
              customers={customers}
            />
          </div>
        )}

        {/* Step 5: Confirm Delivery & All Generated Delivery Challans */}
        {activeStep === 'delivery' && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {/* Header Toolbar & Filters */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-sm sm:text-base font-black text-[#009688] dark:text-[#26a69a] tracking-wide uppercase flex items-center gap-2">
                  <Truck className="h-4.5 w-4.5 text-[#009688] dark:text-[#26a69a]" />
                  <span>OUTWARD DELIVERY CHALLANS & POD CONFIRMATION</span>
                </h2>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold mt-0.5">
                  Showing <strong className="text-zinc-900 dark:text-white">{filteredDeliveryChallans.length}</strong> by default of <strong className="text-zinc-900 dark:text-white">{allDeliveryChallans.length}</strong> delivery challans ready for customer receipt sign-off
                </div>
              </div>

              {/* Action Tools: Search, Filter Tabs, CSV Export, and View Switcher */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search Challan / Vehicle / Client..."
                    value={deliverySearchQuery}
                    onChange={(e) => setDeliverySearchQuery(e.target.value)}
                    className="pl-8.5 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-52 sm:w-60 font-medium"
                  />
                  {deliverySearchQuery && (
                    <button
                      onClick={() => setDeliverySearchQuery('')}
                      className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-100 dark:bg-zinc-900 text-xs">
                  <button
                    onClick={() => setDeliveryFilterStatus('All')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${deliveryFilterStatus === 'All'
                      ? 'bg-white dark:bg-[#0c0c0f] text-zinc-900 dark:text-white shadow-xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                  >
                    All ({allDeliveryChallans.length})
                  </button>
                  <button
                    onClick={() => setDeliveryFilterStatus('Pending')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${deliveryFilterStatus === 'Pending'
                      ? 'bg-white dark:bg-[#0c0c0f] text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                  >
                    Awaiting POD ({allDeliveryChallans.filter(c => c.podStatus !== 'POD Confirmed' && c.status !== 'Delivered').length})
                  </button>
                  <button
                    onClick={() => setDeliveryFilterStatus('Confirmed')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${deliveryFilterStatus === 'Confirmed'
                      ? 'bg-white dark:bg-[#0c0c0f] text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                  >
                    Confirmed ({allDeliveryChallans.filter(c => c.podStatus === 'POD Confirmed' || c.status === 'Delivered').length})
                  </button>
                </div>

                {/* Export CSV Button */}
                <button
                  type="button"
                  onClick={() => {
                    const csvRows = [
                      ['Challan Number', 'Order ID', 'Sales Delivery Number', 'Customer Code', 'Customer Name', 'Kitchen/Area', 'Location', 'Shipping Address', 'Vehicle No', 'Driver Name', 'Transporter', 'Crates Count', 'Dispatch Time', 'POD Status', 'POD Date Time'],
                      ...filteredDeliveryChallans.map(c => [
                        c.challanNo || c.invoiceNo,
                        c.orderId || c.orderNo,
                        c.salesDeliveryNo,
                        c.customerCode,
                        `"${(c.customerName || '').replace(/"/g, '""')}"`,
                        `"${(c.kitchen || c.area || '').replace(/"/g, '""')}"`,
                        c.location || '',
                        `"${(c.shippingAddress || '').replace(/"/g, '""')}"`,
                        c.vehicleNo,
                        c.driverName,
                        c.transporter,
                        c.cratesCount,
                        c.dispatchTime,
                        c.podStatus,
                        c.podDateTime || ''
                      ])
                    ];
                    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `Delivery_Challans_POD_${new Date().toISOString().substring(0, 10)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors shadow-xs"
                  title="Export to CSV"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>

                {/* View Switcher: Table Rows / Card Rows / Grid */}
                <div className="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-100 dark:bg-zinc-900 text-xs">
                  <button
                    type="button"
                    onClick={() => setDeliveryViewMode('table')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${deliveryViewMode === 'table'
                      ? 'bg-white dark:bg-[#0c0c0f] text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    title="Table Row View"
                  >
                    <Table className="h-3.5 w-3.5" />
                    <span>Table Row</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryViewMode('rows')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${deliveryViewMode === 'rows'
                      ? 'bg-white dark:bg-[#0c0c0f] text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    title="Horizontal Card Rows"
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                    <span>Card Rows</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryViewMode('grid')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${deliveryViewMode === 'grid'
                      ? 'bg-white dark:bg-[#0c0c0f] text-emerald-700 dark:text-emerald-400 shadow-xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    title="Grid Cards"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>Grid</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 1. TABLE ROW VIEW (DEFAULT) */}
            {deliveryViewMode === 'table' && (
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs bg-white dark:bg-[#0c0c0f]">
                <table className="w-full text-left text-xs border-collapse min-w-[1550px]">
                  <thead>
                    <tr className="bg-[#009688] text-white text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-2 text-center border-r border-teal-600/40 w-12">#</th>
                      <th className="py-3 px-3 text-left border-r border-teal-600/40 w-44">Challan / Invoice No</th>
                      <th className="py-3 px-2 text-center border-r border-teal-600/40 w-24">Order ID</th>
                      <th className="py-3 px-2 text-center border-r border-teal-600/40 w-32">Sales Delivery No</th>
                      <th className="py-3 px-2 text-center border-r border-teal-600/40 w-20">Cust Code</th>
                      <th className="py-3 px-3 text-left border-r border-teal-600/40 w-52">Customer Name & Address</th>
                      <th className="py-3 px-3 text-left border-r border-teal-600/40 w-44">Kitchen / Area</th>
                      <th className="py-3 px-3 text-left border-r border-teal-600/40 w-40">Vehicle & Driver</th>
                      <th className="py-3 px-2 text-center border-r border-teal-600/40 w-28">Cargo / Crates</th>
                      <th className="py-3 px-2 text-center border-r border-teal-600/40 w-36">Dispatch Time</th>
                      <th className="py-3 px-2 text-center border-r border-teal-600/40 w-36">POD Date/Time</th>
                      <th className="py-3 px-2 text-center border-r border-teal-600/40 w-32">POD Status</th>
                      <th className="py-3 px-3 text-center w-52">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200">
                    {filteredDeliveryChallans.map((challanItem, idx) => {
                      const isConfirmed = challanItem.podStatus === 'POD Confirmed' || challanItem.status === 'Delivered';
                      return (
                        <tr
                          key={challanItem.id || challanItem.challanNo || idx}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                        >
                          {/* Row Index */}
                          <td className="py-3 px-2 text-center text-zinc-400 font-mono text-[10px] border-r border-zinc-100 dark:border-zinc-800/60">
                            {idx + 1}
                          </td>

                          {/* Challan / Invoice No */}
                          <td className="py-3 px-3 text-left font-mono font-bold text-emerald-700 dark:text-emerald-400 border-r border-zinc-100 dark:border-zinc-800/60">
                            <div className="flex items-center gap-1.5">
                              <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span className="truncate">{challanItem.challanNo}</span>
                            </div>
                          </td>

                          {/* Order ID */}
                          <td className="py-3 px-2 text-center font-mono font-bold text-zinc-900 dark:text-white border-r border-zinc-100 dark:border-zinc-800/60">
                            {challanItem.orderId || challanItem.orderNo}
                          </td>

                          {/* Sales Delivery Number */}
                          <td className="py-3 px-2 text-center font-mono text-zinc-700 dark:text-zinc-300 border-r border-zinc-100 dark:border-zinc-800/60">
                            {challanItem.salesDeliveryNo}
                          </td>

                          {/* Customer Code */}
                          <td className="py-3 px-2 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400 border-r border-zinc-100 dark:border-zinc-800/60">
                            {challanItem.customerCode || 'CUST'}
                          </td>

                          {/* Customer Name & Address */}
                          <td className="py-3 px-3 text-left border-r border-zinc-100 dark:border-zinc-800/60">
                            <div className="font-semibold text-zinc-900 dark:text-white text-xs">{challanItem.customerName}</div>
                            <div className="text-[10px] text-zinc-400 truncate max-w-[220px]">{challanItem.shippingAddress || 'Jamnagar Site'}</div>
                          </td>

                          {/* Kitchen / Area */}
                          <td className="py-3 px-3 text-left border-r border-zinc-100 dark:border-zinc-800/60">
                            <div className="font-bold text-zinc-800 dark:text-zinc-200 text-[11px]">{challanItem.kitchen || challanItem.area || 'STAFF KITCHEN'}</div>
                            <div className="text-[10px] text-zinc-500">{challanItem.location || ''}</div>
                          </td>

                          {/* Vehicle & Driver */}
                          <td className="py-3 px-3 text-left border-r border-zinc-100 dark:border-zinc-800/60">
                            <div className="font-mono font-bold text-zinc-900 dark:text-white text-[11px]">{challanItem.vehicleNo}</div>
                            <div className="text-[10px] text-zinc-500 truncate">{challanItem.driverName || 'Aabid Sama'}</div>
                          </td>

                          {/* Cargo / Crates */}
                          <td className="py-3 px-2 text-center border-r border-zinc-100 dark:border-zinc-800/60">
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">{challanItem.cratesCount} Crates</span>
                            <span className="text-[10px] text-zinc-500 block truncate">{challanItem.transporter || 'Self'}</span>
                          </td>

                          {/* Dispatch Time */}
                          <td className="py-3 px-2 text-center font-mono text-[10px] text-zinc-500 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800/60">
                            {challanItem.dispatchTime}
                          </td>

                          {/* POD Date / Time */}
                          <td className="py-3 px-2 text-center font-mono text-[10px] border-r border-zinc-100 dark:border-zinc-800/60">
                            {isConfirmed && challanItem.podDateTime ? (
                              <span className="text-emerald-600 font-bold">{challanItem.podDateTime}</span>
                            ) : (
                              <span className="text-zinc-400">-</span>
                            )}
                          </td>

                          {/* POD Status Badge */}
                          <td className="py-3 px-2 text-center border-r border-zinc-100 dark:border-zinc-800/60">
                            {isConfirmed ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 px-2 py-0.5 rounded-full text-[9px] font-extrabold shadow-xs">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>POD Confirmed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 px-2 py-0.5 rounded-full text-[9px] font-extrabold shadow-xs">
                                <Clock className="h-3 w-3 text-amber-600" />
                                <span>Awaiting POD</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenChallanForInvoiceRecord(challanItem)}
                                className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-lg text-[10px] transition-colors border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 shrink-0 shadow-xs"
                                title="View Delivery Challan Document"
                              >
                                <FileText className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Challan</span>
                              </button>

                              {isConfirmed ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenChallanForInvoiceRecord(challanItem)}
                                  className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg text-[10px] transition-colors border border-emerald-300 dark:border-emerald-800/60 flex items-center gap-1 shrink-0"
                                  title="View Signed Delivery Proof"
                                >
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  <span>View POD</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPodConfirmation(challanItem)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-colors shadow-xs flex items-center gap-1 shrink-0 active:scale-95"
                                  title="Sign & Confirm Proof of Delivery"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>Confirm POD</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredDeliveryChallans.length === 0 && (
                      <tr>
                        <td colSpan={13} className="py-12 text-center text-zinc-400 text-xs">
                          No delivery challans found matching current filter. Complete dispatches in Shipping Dispatch tab to generate outward challans.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. HORIZONTAL CARD ROW VIEW */}
            {deliveryViewMode === 'rows' && (
              <div className="space-y-3">
                {filteredDeliveryChallans.map((challanItem) => {
                  const isConfirmed = challanItem.podStatus === 'POD Confirmed' || challanItem.status === 'Delivered';

                  return (
                    <div
                      key={challanItem.id || challanItem.challanNo}
                      className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all"
                    >
                      {/* Left Info Row Grid */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                        {/* Section 1: Challan & Order ID */}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm tracking-wide">
                              {challanItem.challanNo}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 font-mono">
                            <span>Order: <strong className="text-zinc-800 dark:text-zinc-200">{challanItem.orderId || challanItem.orderNo}</strong></span>
                            <span>•</span>
                            <span>Deliv: <strong className="text-zinc-800 dark:text-zinc-200">{challanItem.salesDeliveryNo}</strong></span>
                          </div>
                        </div>

                        {/* Section 2: Customer & Area */}
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-white text-xs flex items-center gap-1.5">
                            <span className="truncate">{challanItem.customerName}</span>
                            <span className="font-mono text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                              {challanItem.customerCode}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 truncate">
                            <strong>Area:</strong> {challanItem.kitchen || challanItem.area || 'STAFF KITCHEN'} {challanItem.location ? `(${challanItem.location})` : ''}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                            {challanItem.shippingAddress || 'Jamnagar Site'}
                          </div>
                        </div>

                        {/* Section 3: Vehicle & Cargo */}
                        <div>
                          <div className="text-xs text-zinc-800 dark:text-zinc-200">
                            <span className="font-mono font-bold text-zinc-900 dark:text-white">{challanItem.vehicleNo}</span>
                            <span className="text-zinc-500 ml-1.5">({challanItem.driverName || 'Aabid Sama'})</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            <strong className="text-emerald-700 dark:text-emerald-400">{challanItem.cratesCount} Crates</strong> • {challanItem.transporter || 'Self Transport'}
                          </div>
                        </div>

                        {/* Section 4: Timestamps & Status */}
                        <div>
                          <div className="flex items-center gap-2">
                            {isConfirmed ? (
                              <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-1 shadow-xs">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>POD Confirmed</span>
                              </span>
                            ) : (
                              <span className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-1 shadow-xs">
                                <Clock className="h-3 w-3 text-amber-600" />
                                <span>Awaiting POD</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-1">
                            <span>Dispatched: {challanItem.dispatchTime}</span>
                            {isConfirmed && challanItem.podDateTime && (
                              <span className="block text-emerald-600 font-bold">POD: {challanItem.podDateTime}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 xl:pt-0 border-t xl:border-t-0 border-zinc-100 dark:border-zinc-800 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenChallanForInvoiceRecord(challanItem)}
                          className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 shadow-xs"
                        >
                          <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>View Challan</span>
                        </button>

                        {isConfirmed ? (
                          <button
                            type="button"
                            onClick={() => handleOpenChallanForInvoiceRecord(challanItem)}
                            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl text-xs transition-colors border border-emerald-300 dark:border-emerald-800/60 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Delivered & Signed</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenPodConfirmation(challanItem)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5 active:scale-98"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Confirm POD</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredDeliveryChallans.length === 0 && (
                  <div className="text-center py-16 bg-white dark:bg-[#0c0c0f] rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
                    <FileText className="h-8 w-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                    No delivery challans found matching current filter. Complete dispatches in Shipping Dispatch tab to generate outward challans.
                  </div>
                )}
              </div>
            )}

            {/* 3. GRID CARDS VIEW */}
            {deliveryViewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                {filteredDeliveryChallans.map((challanItem) => {
                  const isConfirmed = challanItem.podStatus === 'POD Confirmed' || challanItem.status === 'Delivered';

                  return (
                    <div
                      key={challanItem.id || challanItem.challanNo}
                      className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] rounded-2xl p-4.5 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all space-y-4"
                    >
                      {/* Top Challan Header */}
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm tracking-wide">
                              {challanItem.challanNo}
                            </span>
                          </div>

                          {isConfirmed ? (
                            <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-1 shadow-xs">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>POD Confirmed</span>
                            </span>
                          ) : (
                            <span className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-1 shadow-xs">
                              <Clock className="h-3 w-3 text-amber-600" />
                              <span>Awaiting POD</span>
                            </span>
                          )}
                        </div>

                        {/* Reference Numbers */}
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-500 font-mono">
                          <span>Order: <strong className="text-zinc-800 dark:text-zinc-200">{challanItem.orderId || challanItem.orderNo}</strong></span>
                          <span>•</span>
                          <span>Delivery No: <strong className="text-zinc-800 dark:text-zinc-200">{challanItem.salesDeliveryNo}</strong></span>
                        </div>

                        {/* Customer Details */}
                        <div className="mt-3 bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800/80 space-y-1 text-xs">
                          <div className="font-bold text-zinc-900 dark:text-white flex items-center justify-between">
                            <span>{challanItem.customerName}</span>
                            <span className="font-mono text-[10px] text-emerald-600">{challanItem.customerCode}</span>
                          </div>
                          <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                            <strong>Kitchen/Area:</strong> {challanItem.kitchen || challanItem.area || 'STAFF KITCHEN'} {challanItem.location ? `(${challanItem.location})` : ''}
                          </div>
                          <div className="text-[10px] text-zinc-500 truncate">
                            {challanItem.shippingAddress || 'Jamnagar Site'}
                          </div>
                        </div>

                        {/* Dispatch & Transport Info */}
                        <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] text-zinc-600 dark:text-zinc-400">
                          <div className="bg-zinc-50/70 dark:bg-zinc-900/30 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                            <span className="text-zinc-400 block text-[9px] uppercase font-bold">Vehicle & Driver</span>
                            <span className="font-mono font-bold text-zinc-900 dark:text-white block">{challanItem.vehicleNo}</span>
                            <span className="text-zinc-500 truncate block">{challanItem.driverName || 'Aabid Sama'}</span>
                          </div>

                          <div className="bg-zinc-50/70 dark:bg-zinc-900/30 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                            <span className="text-zinc-400 block text-[9px] uppercase font-bold">Cargo & Transporter</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 block">{challanItem.cratesCount} Crates</span>
                            <span className="text-zinc-500 truncate block">{challanItem.transporter || 'Self Transport'}</span>
                          </div>
                        </div>

                        {/* Timestamps */}
                        <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                          <span>Dispatched: {challanItem.dispatchTime}</span>
                          {isConfirmed && challanItem.podDateTime && (
                            <span className="text-emerald-600 font-bold">POD: {challanItem.podDateTime}</span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                        <button
                          type="button"
                          onClick={() => handleOpenChallanForInvoiceRecord(challanItem)}
                          className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold py-1.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 border border-zinc-200 dark:border-zinc-700 shadow-xs"
                        >
                          <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>View Delivery Challan</span>
                        </button>

                        {isConfirmed ? (
                          <button
                            type="button"
                            onClick={() => handleOpenChallanForInvoiceRecord(challanItem)}
                            className="w-full bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold py-1.5 rounded-xl text-xs transition-colors border border-emerald-300 dark:border-emerald-800/60 flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Delivered & Signed (View POD)</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenPodConfirmation(challanItem)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Confirm POD Sign-Off</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredDeliveryChallans.length === 0 && (
                  <div className="col-span-full text-center py-16 bg-white dark:bg-[#0c0c0f] rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
                    <FileText className="h-8 w-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                    No delivery challans found matching current filter. Complete dispatches in Shipping Dispatch tab to generate outward challans.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Delivery Challan Modal */}
      <DeliveryChallanModal
        isOpen={!!invoicePrintData}
        onClose={() => setInvoicePrintData(null)}
        challanData={invoicePrintData}
        products={products}
        customers={customers}
      />

      {/* Pod Confirmation Modal */}
      <PodConfirmationModal
        isOpen={Boolean(podModalData)}
        onClose={() => setPodModalData(null)}
        challanData={podModalData}
        onConfirmPod={handleExecutePodConfirmation}
      />

      {/* Warehouse FEFO Picklist Modal */}
      <PicklistModal
        isOpen={!!picklistModalData}
        onClose={() => setPicklistModalData(null)}
        picklistData={picklistModalData}
        onConfirmPickWave={(so) => {
          setPicklistModalData(null);
          handleConfirmPicklistExecution(picklistModalData.so || so);
        }}
        products={products}
        customers={customers}
        company={(companies && companies[0]) || {
          name: 'GNOSIS VENTURES LLP',
          address: 'C/O SHIV COLD STORAGE, SURVEY NO. 105/5 KHIJADIYA BY PASS, CHOWKDI, KHIJADIYA DISTRICT JAMNAGAR-361120',
          gstNo: '24AANFG0052H1ZP'
        }}
      />

      {/* Professional Multi-Tab Sales Order Creation / Edit Modal */}
      <NewSalesOrderModal
        isOpen={soDrawerOpen}
        onClose={() => {
          setSoDrawerOpen(false);
          setEditingSo(null);
        }}
        onSubmit={handleSaveSalesOrder}
        editOrder={editingSo}
        customers={customers}
        products={products}
        warehouses={warehouses}
        inventory={inventory}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmSo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c0c0f] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">Delete Sales Order</h3>
                <p className="text-xs text-zinc-500">This action will remove the order from the active ledger.</p>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 my-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Order No:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">{deleteConfirmSo.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Customer:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {customers.find(c => c.id === deleteConfirmSo.customerId)?.name || deleteConfirmSo.customerName || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Items:</span>
                <span className="text-zinc-700 dark:text-zinc-300">{deleteConfirmSo.items?.length || 0} product line(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Status:</span>
                <span className="font-bold text-emerald-600">{deleteConfirmSo.status}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmSo(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
