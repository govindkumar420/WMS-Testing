import React, { useRef, useState, useMemo } from 'react';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Square,
  CheckSquare,
  Layers,
  RotateCcw
} from 'lucide-react';

export default function PicklistModal({
  isOpen,
  onClose,
  picklistData,
  onConfirmPickWave,
  products = [],
  customers = [],
  company = {
    name: 'GNOSIS VENTURES LLP',
    address: 'C/O SHIV COLD STORAGE, SURVEY NO. 105/5 KHIJADIYA BY PASS, CHOWKDI, KHIJADIYA DISTRICT JAMNAGAR-361120',
    gstNo: '24AANFG0052H1ZP'
  }
}) {
  const printRef = useRef(null);

  const {
    so = {},
    customer = {},
    picks = [],
    shortfalls = [],
    isFullySatisfied = true,
    picklistNo = `PL${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } = picklistData || {};

  // Build Normalized Line Items
  const lineItems = useMemo(() => {
    if (!picklistData) return [];

    if (picks && picks.length > 0) {
      return picks.map((p, idx) => {
        const prod = products.find(pr => pr.id === p.productId) || {};
        const reqQty = Number(p.qtyToPick || p.qty || 10);
        return {
          id: p.id || `line-${idx}`,
          sNo: idx + 1,
          productId: p.productId,
          productSku: prod.code || p.productCode || 'PROD-G256',
          description: prod.description || p.description || 'General WMS Supply Grass',
          uom: prod.uom || 'KG',
          suggestedBin: p.locationCode || `A-02-${12 + idx}`,
          batchCode: p.batchNo || `B-G25-${26 + idx}`,
          expiryDate: p.expiryDate || '2026-08-30',
          qtyReq: reqQty,
          isShortfallSuggested: shortfalls.some(sf => sf.productId === p.productId)
        };
      });
    }

    if (so.items && so.items.length > 0) {
      return so.items.map((it, idx) => {
        const prod = products.find(pr => pr.id === it.productId) || {};
        const reqQty = Number(it.qty || 10);
        const sf = shortfalls.find(s => s.productId === it.productId);
        return {
          id: `so-line-${idx}`,
          sNo: idx + 1,
          productId: it.productId,
          productSku: prod.code || it.productCode || 'PROD-G256',
          description: prod.description || it.description || 'General WMS Supply Grass',
          uom: prod.uom || it.uom || 'KG',
          suggestedBin: `A-02-${12 + idx}`,
          batchCode: `B-G25-${26 + idx}`,
          expiryDate: '2026-08-30',
          qtyReq: reqQty,
          isShortfallSuggested: !!sf
        };
      });
    }

    // Default sample data matching exact screenshot
    return [
      { id: '1', sNo: 1, productSku: 'PROD-G256', description: 'General WMS Supply Grass', uom: 'KG', suggestedBin: 'A-02-12', batchCode: 'B-G25-26', expiryDate: '2026-08-30', qtyReq: 10.00 },
      { id: '2', sNo: 2, productSku: 'PROD-G256', description: 'General WMS Supply Grass', uom: 'KG', suggestedBin: 'A-02-13', batchCode: 'B-G25-26', expiryDate: '2026-08-30', qtyReq: 10.00 },
      { id: '3', sNo: 3, productSku: 'PROD-G256', description: 'General WMS Supply Grass', uom: 'KG', suggestedBin: 'A-02-14', batchCode: 'B-G25-26', expiryDate: '2026-08-30', qtyReq: 10.00 },
      { id: '4', sNo: 4, productSku: 'PROD-G256', description: 'General WMS Supply Grass', uom: 'KG', suggestedBin: 'A-02-15', batchCode: 'B-G25-26', expiryDate: '2026-08-30', qtyReq: 10.00 },
      { id: '5', sNo: 5, productSku: 'PROD-G256', description: 'General WMS Supply Grass', uom: 'KG', suggestedBin: 'A-02-16', batchCode: 'B-G25-26', expiryDate: '2026-08-30', qtyReq: 10.00 },
      { id: '6', sNo: 6, productSku: 'PROD-G256', description: 'General WMS Supply Grass', uom: 'KG', suggestedBin: 'A-02-17', batchCode: 'B-G25-26', expiryDate: '2026-08-30', qtyReq: 10.00 }
    ];
  }, [picklistData, picks, so.items, products, shortfalls]);

  // State for Checkboxes, Picked Qty, and Shortfall Reasons
  const [checkedMap, setCheckedMap] = useState({});
  const [pickedQtyMap, setPickedQtyMap] = useState({});
  const [shortfallNoteMap, setShortfallNoteMap] = useState({});

  // Initialize or reset line states
  const initLineState = (lines) => {
    const isDone = so.status === 'Picking Done' || so.status === 'Delivered' || picklistData?.status === 'Picking Done';
    const initCheck = {};
    const initPicked = {};
    const initNote = {};

    lines.forEach((line, idx) => {
      initCheck[idx] = isDone;
      initPicked[idx] = isDone ? line.qtyReq.toFixed(2) : '';
      initNote[idx] = '';
    });

    setCheckedMap(initCheck);
    setPickedQtyMap(initPicked);
    setShortfallNoteMap(initNote);
  };

  React.useEffect(() => {
    if (isOpen && lineItems.length > 0) {
      initLineState(lineItems);
    }
  }, [isOpen, lineItems]);

  if (!isOpen || !picklistData) return null;

  const toggleCheck = (idx) => {
    const nextCheck = !checkedMap[idx];
    setCheckedMap(prev => ({ ...prev, [idx]: nextCheck }));
    if (nextCheck && (!pickedQtyMap[idx] || Number(pickedQtyMap[idx]) === 0)) {
      setPickedQtyMap(prev => ({ ...prev, [idx]: lineItems[idx]?.qtyReq.toFixed(2) }));
    }
  };

  const handlePickedQtyChange = (idx, val) => {
    setPickedQtyMap(prev => ({ ...prev, [idx]: val }));
    if (val && Number(val) > 0) {
      setCheckedMap(prev => ({ ...prev, [idx]: true }));
    } else {
      setCheckedMap(prev => ({ ...prev, [idx]: false }));
    }
  };

  const handleShortfallNoteChange = (idx, note) => {
    setShortfallNoteMap(prev => ({ ...prev, [idx]: note }));
  };

  const handleMarkAllFull = () => {
    const newCheck = {};
    const newPicked = {};
    lineItems.forEach((item, idx) => {
      newCheck[idx] = true;
      newPicked[idx] = item.qtyReq.toFixed(2);
    });
    setCheckedMap(newCheck);
    setPickedQtyMap(newPicked);
  };

  const handleResetChecks = () => {
    initLineState(lineItems);
  };

  // Calculations
  const totalReqQty = lineItems.reduce((sum, item) => sum + Number(item.qtyReq || 0), 0);
  const totalActualPicked = lineItems.reduce((sum, _, idx) => {
    const p = parseFloat(pickedQtyMap[idx]);
    return sum + (isNaN(p) ? 0 : p);
  }, 0);
  const totalShortfall = Math.max(0, totalReqQty - totalActualPicked);

  const handlePrint = () => {
    if (!printRef.current) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Picklist_${picklistNo}_${so.orderNo || 'SO'}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              background: #ffffff !important;
              color: #18181b !important;
              padding: 0 !important;
              margin: 0 !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .no-print, button, .print\\:hidden {
              display: none !important;
            }
            .printable-document {
              padding: 10px !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              max-width: 100% !important;
              width: 100% !important;
              background: #ffffff !important;
              color: #18181b !important;
            }
            .bin-code {
              color: #0284c7 !important;
              font-weight: 700 !important;
            }
            .table-header {
              border-top: 2px solid #009688 !important;
              border-bottom: 2px solid #009688 !important;
            }
            .blank-line {
              border-bottom: 1px solid #71717a !important;
              display: inline-block;
              width: 60px;
              height: 14px;
            }
            .print-checkbox {
              width: 16px;
              height: 16px;
              border: 1.5px solid #52525b !important;
              display: inline-block;
              border-radius: 2px;
            }
          </style>
        </head>
        <body class="bg-white text-zinc-900">
          <div class="printable-document">
            ${printRef.current.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 250);
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['COMPANY', company.name],
      ['ADDRESS', company.address],
      ['GSTIN', company.gstNo],
      [],
      ['WAREHOUSE MATERIAL PICKLIST / FEFO ALLOCATION SLIP'],
      ['Picklist No', picklistNo, 'Date', date],
      ['Sales Order No', so.orderNo || 'N/A', 'Customer', customer.name || so.customerName || 'N/A'],
      ['Delivery Location', so.shippingDetails?.billingLocation || customer.city || 'Jamnagar Main Hub'],
      ['Area Tag', so.shippingDetails?.area || 'ANIMAL KITCHEN'],
      ['Picking Strategy', 'Batch-Wise (FEFO Oldest Expiring First)', 'Mode', 'HHT Scanner'],
      [],
      ['S.No', 'Product SKU', 'Description', 'UOM', 'Suggested Bin', 'Batch Code', 'Expiry Date', 'Qty Req', 'Qty Picked', 'Shortfall', 'Shortfall Reason', 'Status']
    ];

    lineItems.forEach((item, idx) => {
      const pQty = parseFloat(pickedQtyMap[idx]);
      const picked = isNaN(pQty) ? '' : pQty;
      const sf = isNaN(pQty) ? '' : Math.max(0, item.qtyReq - pQty);
      const isChecked = !!checkedMap[idx];

      csvRows.push([
        item.sNo,
        item.productSku,
        item.description,
        item.uom,
        item.suggestedBin,
        item.batchCode,
        item.expiryDate,
        item.qtyReq.toFixed(2),
        picked !== '' ? picked.toFixed(2) : '',
        sf !== '' && sf > 0 ? sf.toFixed(2) : 0,
        shortfallNoteMap[idx] || '',
        isChecked ? 'VERIFIED' : 'PENDING'
      ]);
    });

    csvRows.push([]);
    csvRows.push(['', '', '', '', '', '', 'TOTAL QUANTITY', totalReqQty.toFixed(2), totalActualPicked.toFixed(2), totalShortfall.toFixed(2), '']);

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.map(x => `"${x}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Picklist_${picklistNo}_${so.orderNo || 'SO'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0c0c0f] text-zinc-900 dark:text-zinc-100 rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 relative max-h-[96vh] flex flex-col animate-in zoom-in-95 duration-200">

        {/* Top Modal Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4 gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#009688]/15 dark:bg-[#009688]/25 text-[#009688] dark:text-[#26a69a] rounded-xl border border-[#009688]/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-white">
                  Warehouse Material Picklist
                </h2>
                <span className="font-mono font-bold text-xs bg-[#009688]/15 text-[#009688] px-2.5 py-0.5 rounded-md border border-[#009688]/30">
                  {picklistNo}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Batch-wise FEFO picking schedule with write-in shortfall checks and multi-level approvals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {/* Quick check actions */}
            <button
              type="button"
              onClick={handleMarkAllFull}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg transition-colors border border-emerald-300/60"
              title="Mark all items as 100% picked"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Full Pick</span>
            </button>

            <button
              type="button"
              onClick={handleResetChecks}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300 rounded-lg transition-colors"
              title="Reset checks"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
              title="Export CSV for Handheld Scanners"
            >
              <Download className="h-3.5 w-3.5 text-[#009688]" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#009688] hover:bg-[#00796b] text-white rounded-lg transition-colors shadow-sm"
              title="Print Picklist Slip"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Picklist</span>
            </button>

            {onConfirmPickWave && so.status !== 'Picking Done' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onConfirmPickWave(so);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm"
                title="Execute Wave Picking"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Confirm Picking Done</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="flex-1 overflow-y-auto pr-1 print:overflow-visible print:p-0">
          <div ref={printRef} className="printable-document bg-white text-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-[#111115] dark:text-zinc-100 shadow-xs print:border-none print:shadow-none print:p-0">

            {/* Document Header */}
            <div className="border-b-2 border-zinc-800 dark:border-zinc-600 pb-4 mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-[#009688] dark:text-[#26a69a] uppercase">
                    {company.name}
                  </h1>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 max-w-lg mt-0.5 leading-snug">
                    {company.address}
                  </p>
                  <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                    GSTIN: <strong>{company.gstNo}</strong> | Cold Chain Facility Hub-01
                  </p>
                </div>

                <div className="text-right self-start sm:self-auto border sm:border-l-2 border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 min-w-[210px]">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#009688] dark:text-[#26a69a] block">
                    MATERIAL PICKING SLIP
                  </span>
                  <span className="font-mono text-sm font-black text-zinc-900 dark:text-white block mt-0.5">
                    {picklistNo}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                    Date: <strong className="text-zinc-800 dark:text-zinc-200">{date}</strong>
                  </span>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-[#009688]/15 text-[#009688] dark:text-[#26a69a]">
                    Strategy: Batch-Wise FEFO
                  </span>
                </div>
              </div>
            </div>

            {/* Order & Customer Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs mb-4">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Sales Order Ref</span>
                <span className="font-mono font-black text-zinc-900 dark:text-white">{so.orderNo || `SO-2026-${so.orderId || '1039'}`}</span>
                <span className="text-[10px] text-zinc-500 block">Del. Ref: {so.salesDeliveryNo || picklistData.salesDeliveryNo || '8736061039'}</span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Customer Account</span>
                <span className="font-bold text-zinc-900 dark:text-white truncate block">{customer.name || so.customerName || picklistData.customerName || 'Star Hypermarket Ltd'}</span>
                <span className="text-[10px] font-mono text-zinc-500">{customer.code || so.customerCode || 'CUST-003'}</span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Billing / Delivery Location</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                  {picklistData.deliveryLocation || so.shippingDetails?.billingLocation || customer.city || 'Jamnagar Main Hub'}
                </span>
                <span className="text-[10px] font-bold text-[#009688]">
                  Area: {picklistData.area || so.shippingDetails?.area || 'ANIMAL KITCHEN'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Picking Mode & Status</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#009688]/15 text-[#009688]">
                    {picklistData.picklistGenerateMode || 'HHT'}
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                    {picklistData.pickingStatus || 'Picking Done'}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500">Pick Wise: {picklistData.pickWise || 'Batch Wise'}</span>
              </div>
            </div>

            {/* Shortfall KPI Banner (if any shortfall is detected) */}
            {totalShortfall > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 p-3 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 mb-4 print:border-zinc-300">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="font-bold">
                    Stock Shortfall Alert: <strong className="underline">{totalShortfall.toFixed(2)} Units</strong> remaining unfulfilled across pick lines.
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold bg-amber-200/80 dark:bg-amber-900/60 px-2 py-0.5 rounded text-amber-900 dark:text-amber-100">
                  Write Shortfall Reason Below
                </span>
              </div>
            )}

            {/* Exact Picklist Table Matching User Screenshot */}
            <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl mb-6 shadow-xs">
              <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                <thead>
                  <tr className="table-header border-t-2 border-b-2 border-[#009688] bg-zinc-50 dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-100 font-bold text-xs select-none">
                    <th className="p-3 text-center border-r border-zinc-200 dark:border-zinc-800 w-12">S.No</th>
                    <th className="p-3 text-left border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap">Product SKU</th>
                    <th className="p-3 text-left border-r border-zinc-200 dark:border-zinc-800">Description</th>
                    <th className="p-3 text-center border-r border-zinc-200 dark:border-zinc-800 w-14">UOM</th>
                    <th className="p-3 text-center border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap">Suggested Bin</th>
                    <th className="p-3 text-center border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap">Batch Code</th>
                    <th className="p-3 text-center border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap">Expiry Date</th>
                    <th className="p-3 text-center border-r border-zinc-200 dark:border-zinc-800 w-24">Qty Req</th>
                    <th className="p-3 text-center border-r border-zinc-200 dark:border-zinc-800 w-32">Qty Picked</th>
                    <th className="p-3 text-center w-14">Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-[#0c0c0f]">
                  {lineItems.map((item, idx) => {
                    const isChecked = !!checkedMap[idx];
                    const currentPicked = pickedQtyMap[idx] !== undefined ? pickedQtyMap[idx] : '';
                    const parsedPicked = parseFloat(currentPicked);
                    const hasShortfall = !isNaN(parsedPicked) && parsedPicked < item.qtyReq;
                    const shortfallQty = hasShortfall ? (item.qtyReq - parsedPicked).toFixed(2) : '0.00';

                    return (
                      <tr
                        key={item.id || idx}
                        className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors ${
                          isChecked ? 'bg-emerald-50/40 dark:bg-emerald-950/15' : ''
                        }`}
                      >
                        {/* 1. S.No */}
                        <td className="p-3 text-center font-mono font-bold text-zinc-700 dark:text-zinc-300 border-r border-zinc-200 dark:border-zinc-800">
                          {item.sNo}
                        </td>

                        {/* 2. Product SKU */}
                        <td className="p-3 font-mono font-bold text-zinc-900 dark:text-zinc-100 border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap">
                          {item.productSku}
                        </td>

                        {/* 3. Description */}
                        <td className="p-3 font-medium text-zinc-800 dark:text-zinc-200 border-r border-zinc-200 dark:border-zinc-800">
                          <div>{item.description}</div>
                          {/* Interactive / write-in shortfall notes */}
                          {hasShortfall && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400">
                              <span className="font-bold">⚠️ Shortfall: {shortfallQty} {item.uom}</span>
                              <input
                                type="text"
                                placeholder="Write reason (e.g. damaged stock, short)"
                                value={shortfallNoteMap[idx] || ''}
                                onChange={(e) => handleShortfallNoteChange(idx, e.target.value)}
                                className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded text-[10px] text-amber-900 dark:text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500 print:hidden"
                              />
                              <span className="hidden print:inline text-[9px] text-zinc-500 italic">
                                Reason: {shortfallNoteMap[idx] || '____________________'}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 4. UOM */}
                        <td className="p-3 text-center font-bold text-zinc-700 dark:text-zinc-300 border-r border-zinc-200 dark:border-zinc-800">
                          {item.uom}
                        </td>

                        {/* 5. Suggested Bin (Bold Blue text #0284c7) */}
                        <td className="p-3 text-center font-mono font-bold text-[#0284c7] dark:text-[#38bdf8] border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap bin-code">
                          {item.suggestedBin}
                        </td>

                        {/* 6. Batch Code */}
                        <td className="p-3 text-center font-mono text-zinc-800 dark:text-zinc-200 border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap">
                          {item.batchCode}
                        </td>

                        {/* 7. Expiry Date */}
                        <td className="p-3 text-center font-mono text-zinc-700 dark:text-zinc-300 border-r border-zinc-200 dark:border-zinc-800 whitespace-nowrap">
                          {item.expiryDate}
                        </td>

                        {/* 8. Qty Req */}
                        <td className="p-3 text-center font-black font-mono text-zinc-950 dark:text-white border-r border-zinc-200 dark:border-zinc-800 text-sm">
                          {item.qtyReq.toFixed(2)}
                        </td>

                        {/* 9. Qty Picked (Interactive Input in web view + Underline in Print) */}
                        <td className="p-3 text-center border-r border-zinc-200 dark:border-zinc-800">
                          <div className="print:hidden flex items-center justify-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={item.qtyReq}
                              placeholder={item.qtyReq.toFixed(2)}
                              value={currentPicked}
                              onChange={(e) => handlePickedQtyChange(idx, e.target.value)}
                              className="w-20 px-2 py-1 text-center font-mono font-bold text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#009688]"
                            />
                          </div>
                          <div className="hidden print:block text-center font-mono font-bold">
                            {currentPicked ? (
                              <span>{parseFloat(currentPicked).toFixed(2)}</span>
                            ) : (
                              <span className="blank-line">______</span>
                            )}
                          </div>
                        </td>

                        {/* 10. Check Column (Checkbox in square box) */}
                        <td className="p-3 text-center">
                          <div className="print:hidden inline-flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => toggleCheck(idx)}
                              className="text-zinc-400 hover:text-[#009688] transition-colors cursor-pointer"
                            >
                              {isChecked ? (
                                <CheckSquare className="h-4.5 w-4.5 text-[#009688]" />
                              ) : (
                                <Square className="h-4.5 w-4.5 text-zinc-400" />
                              )}
                            </button>
                          </div>
                          <div className="hidden print:inline-block">
                            <span className="print-checkbox">
                              {isChecked ? '✓' : ''}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/60 border-t-2 border-zinc-300 dark:border-zinc-700 font-bold text-xs">
                    <td colSpan={7} className="p-3 text-right uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      Total Allocated Units:
                    </td>
                    <td className="p-3 text-center font-black font-mono text-zinc-950 dark:text-white text-sm">
                      {totalReqQty.toFixed(2)}
                    </td>
                    <td className="p-3 text-center font-black font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                      {totalActualPicked > 0 ? totalActualPicked.toFixed(2) : '______'}
                    </td>
                    <td className="p-3 text-center text-[10px] text-zinc-400 font-mono">
                      {lineItems.filter((_, idx) => checkedMap[idx]).length}/{lineItems.length}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Dotted Divider before Signatures */}
            <hr className="border-t border-dashed border-zinc-300 dark:border-zinc-700 my-8 print:my-8" />

            {/* 3-Column Formal Sign-Off Footer Matching User Screenshot */}
            <div className="grid grid-cols-3 gap-6 text-center pt-2 pb-4">
              
              {/* 1. Picked By */}
              <div className="flex flex-col items-center">
                <div className="border-t-2 border-zinc-900 dark:border-zinc-300 w-4/5 max-w-[220px] mb-2"></div>
                <div className="font-extrabold text-xs text-zinc-900 dark:text-white uppercase tracking-wide">
                  Picked By
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                  Warehouse Operator
                </div>
              </div>

              {/* 2. Verified & Checked By */}
              <div className="flex flex-col items-center">
                <div className="border-t-2 border-zinc-900 dark:border-zinc-300 w-4/5 max-w-[220px] mb-2"></div>
                <div className="font-extrabold text-xs text-zinc-900 dark:text-white uppercase tracking-wide">
                  Verified & Checked By
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                  Quality Control Executive
                </div>
              </div>

              {/* 3. Approved By */}
              <div className="flex flex-col items-center">
                <div className="border-t-2 border-zinc-900 dark:border-zinc-300 w-4/5 max-w-[220px] mb-2"></div>
                <div className="font-extrabold text-xs text-zinc-900 dark:text-white uppercase tracking-wide">
                  Approved By
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                  Shift Lead / Supervisor
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
