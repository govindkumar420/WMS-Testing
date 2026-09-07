import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Box,
  Thermometer,
  Calendar,
  FileSpreadsheet,
  CheckSquare,
  Square,
  QrCode,
  Barcode
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
  const [checkedItems, setCheckedItems] = useState({});
  const printRef = useRef(null);

  if (!isOpen || !picklistData) return null;

  const {
    so = {},
    customer = {},
    picks = [],
    shortfalls = [],
    isFullySatisfied = true,
    picklistNo = `PL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } = picklistData;

  const totalRequiredQty = (so.items || []).reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalSuggestedPicks = picks.reduce((sum, pick) => sum + (Number(pick.qtyToPick) || 0), 0);

  const toggleCheck = (idx) => {
    setCheckedItems(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

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
      ['WAREHOUSE PICKLIST / MATERIAL PICKING SLIP (FEFO)'],
      ['Picklist No', picklistNo, 'Date', date],
      ['Sales Order No', so.orderNo || 'N/A', 'Customer', customer.name || 'N/A'],
      ['Priority', so.priority || 'Normal', 'Delivery Location', customer.city || so.shippingDetails?.billingLocation || 'N/A'],
      ['Allocation Status', isFullySatisfied ? '100% Reserved' : 'Partial Shortfall', 'Picking Strategy', 'FEFO (Oldest Expiring First)'],
      [],
      ['Line #', 'Location / Bin', 'Batch No', 'Product Code', 'Description', 'Expiry Date (FEFO)', 'UOM', 'Qty to Pick', 'Status']
    ];

    if (picks.length > 0) {
      picks.forEach((pick, idx) => {
        const prod = products.find(p => p.id === pick.productId) || {};
        csvRows.push([
          idx + 1,
          pick.locationCode || 'Stage Area',
          pick.batchNo || 'N/A',
          prod.code || 'SKU',
          prod.description || 'Item',
          pick.expiryDate || 'N/A',
          prod.uom || 'KG',
          pick.qtyToPick || 0,
          checkedItems[idx] ? 'PICKED' : 'PENDING'
        ]);
      });
    } else {
      (so.items || []).forEach((item, idx) => {
        const prod = products.find(p => p.id === item.productId) || {};
        csvRows.push([
          idx + 1,
          'Auto-Allocating',
          'FEFO Batch',
          prod.code || 'SKU',
          prod.description || 'Item',
          'Earliest Expiry',
          prod.uom || 'KG',
          item.qty || 0,
          'PENDING'
        ]);
      });
    }

    csvRows.push([]);
    csvRows.push(['', '', '', '', 'TOTAL QUANTITY', '', '', totalSuggestedPicks || totalRequiredQty, '']);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0c0c0f] text-zinc-900 dark:text-zinc-100 rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 relative max-h-[96vh] flex flex-col animate-in zoom-in-95 duration-200">

        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4 gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-white">
                  Warehouse Material Picklist
                </h2>
                <span className="font-mono font-bold text-xs bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-300/40">
                  {picklistNo}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                FEFO-optimized stock retrieval slip for Order <strong className="text-zinc-800 dark:text-zinc-200">{so.orderNo}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700"
              title="Export CSV for Scanners"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
              title="Print Picklist Slip"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Picklist</span>
            </button>

            {onConfirmPickWave && so.status === 'New' && (
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
                <span>Pick & Pack</span>
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
                  <h1 className="text-xl font-black tracking-tight text-emerald-700 dark:text-emerald-400 uppercase">
                    {company.name}
                  </h1>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 max-w-lg mt-0.5 leading-snug">
                    {company.address}
                  </p>
                  <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                    GSTIN: <strong>{company.gstNo}</strong> | Cold Chain Facility Hub-01
                  </p>
                </div>

                <div className="text-right self-start sm:self-auto border sm:border-l-2 border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 min-w-[200px]">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 dark:text-emerald-400 block">
                    MATERIAL PICKING SLIP
                  </span>
                  <span className="font-mono text-sm font-black text-zinc-900 dark:text-white block mt-0.5">
                    {picklistNo}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                    Date: <strong className="text-zinc-800 dark:text-zinc-200">{date}</strong>
                  </span>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Strategy: FEFO First-Out
                  </span>
                </div>
              </div>
            </div>

            {/* Order & Customer Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs mb-4">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Sales Order Ref</span>
                <span className="font-mono font-black text-zinc-900 dark:text-white">{so.orderNo}</span>
                <span className="text-[10px] text-zinc-500 block">Del. Ref: {so.salesDeliveryNo || 'Direct'}</span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Customer Account</span>
                <span className="font-bold text-zinc-900 dark:text-white truncate block">{customer.name || 'Direct Client'}</span>
                <span className="text-[10px] font-mono text-zinc-500">{customer.code || so.customerCode || 'CUST-01'}</span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Priority & Type</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${so.priority === 'High'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}>
                    {so.priority || 'Normal'} Priority
                  </span>
                  <span className="text-[10px] text-zinc-500">{so.orderBookingType || 'Dispatch'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Destination / Area</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                  {so.shippingDetails?.area || customer.city || 'ANIMAL KITCHEN / Cold Dock'}
                </span>
                <span className="text-[10px] text-zinc-500">Temp Req: 2°C - 8°C</span>
              </div>
            </div>

            {/* Shortfall Alert */}
            {shortfalls && shortfalls.length > 0 && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 p-3 rounded-xl text-xs text-rose-800 dark:text-rose-400 space-y-1 mb-4">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <span>Stock Shortfall Warning in FEFO Allocation</span>
                </div>
                {shortfalls.map(sf => {
                  const prod = products.find(p => p.id === sf.productId);
                  return (
                    <div key={sf.productId} className="pl-5 text-[11px]">
                      • {prod?.description || 'Item'}: Requested {sf.qtyNeeded} units, short by {sf.qtyShort} units in warehouse storage!
                    </div>
                  );
                })}
              </div>
            )}

            {/* Picking Allocation Table */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden mb-4">
              <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                <span>FEFO Bin & Batch Allocation Schedule</span>
                <span>{picks.length > 0 ? `${picks.length} Pick Instructions` : `${so.items?.length || 0} Order Lines`}</span>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold">
                    <th className="p-2.5 text-center w-10">Pick</th>
                    <th className="p-2.5">Source Bin</th>
                    <th className="p-2.5">Batch / Lot</th>
                    <th className="p-2.5">Product SKU & Description</th>
                    <th className="p-2.5">Expiry Date</th>
                    <th className="p-2.5 text-right font-mono">Qty to Pick</th>
                    <th className="p-2.5 text-center w-24">Barcode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                  {picks.length > 0 ? (
                    picks.map((pick, idx) => {
                      const prod = products.find(p => p.id === pick.productId) || {};
                      const isPicked = !!checkedItems[idx];
                      return (
                        <tr
                          key={idx}
                          onClick={() => toggleCheck(idx)}
                          className={`cursor-pointer transition-colors ${isPicked
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                            }`}
                        >
                          <td className="p-2.5 text-center" onClick={(e) => { e.stopPropagation(); toggleCheck(idx); }}>
                            <button type="button" className="text-zinc-400 hover:text-emerald-600 transition-colors">
                              {isPicked ? (
                                <CheckSquare className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                          <td className="p-2.5 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {pick.locationCode || 'Stage Area'}
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                            {pick.batchNo}
                          </td>
                          <td className="p-2.5">
                            <span className="font-semibold text-zinc-900 dark:text-white block">
                              {prod.description || 'Product'}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">{prod.code || pick.productId}</span>
                          </td>
                          <td className="p-2.5 font-semibold text-rose-600 dark:text-rose-400 font-mono text-[11px]">
                            {pick.expiryDate}
                          </td>
                          <td className="p-2.5 text-right font-black font-mono text-zinc-900 dark:text-white text-sm">
                            {pick.qtyToPick} <span className="text-[10px] font-normal text-zinc-500">{prod.uom || 'KG'}</span>
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="font-mono text-[9px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 block">
                              ||| || ||| |
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    (so.items || []).map((item, idx) => {
                      const prod = products.find(p => p.id === item.productId) || {};
                      const isPicked = !!checkedItems[idx];
                      return (
                        <tr
                          key={idx}
                          onClick={() => toggleCheck(idx)}
                          className={`cursor-pointer transition-colors ${isPicked
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                            }`}
                        >
                          <td className="p-2.5 text-center" onClick={(e) => { e.stopPropagation(); toggleCheck(idx); }}>
                            <button type="button" className="text-zinc-400 hover:text-emerald-600 transition-colors">
                              {isPicked ? (
                                <CheckSquare className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                          <td className="p-2.5 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            A-01-01 (Auto)
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                            B-FEFO-ROTATED
                          </td>
                          <td className="p-2.5">
                            <span className="font-semibold text-zinc-900 dark:text-white block">
                              {prod.description || 'Product Line'}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">{prod.code || item.productId}</span>
                          </td>
                          <td className="p-2.5 font-semibold text-rose-600 dark:text-rose-400 font-mono text-[11px]">
                            Earliest Batch
                          </td>
                          <td className="p-2.5 text-right font-black font-mono text-zinc-900 dark:text-white text-sm">
                            {item.qty} <span className="text-[10px] font-normal text-zinc-500">{prod.uom || 'KG'}</span>
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="font-mono text-[9px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 block">
                              ||| || ||| |
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-t-2 border-zinc-200 dark:border-zinc-800 font-bold text-xs">
                    <td colSpan={5} className="p-2.5 text-right uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      Total Allocated Units to Pick:
                    </td>
                    <td className="p-2.5 text-right font-black font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                      {(totalSuggestedPicks || totalRequiredQty).toFixed(2)} Units
                    </td>
                    <td className="p-2.5 text-center text-[10px] text-zinc-500">
                      ~{Math.ceil((totalSuggestedPicks || totalRequiredQty) / 10)} Crates
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Warehouse Staff Sign-off Section */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900/30">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-6">Picker Signature</span>
                <div className="border-t border-dashed border-zinc-300 dark:border-zinc-700 pt-1 text-[10px] text-zinc-600 dark:text-zinc-400 flex justify-between">
                  <span>Name: ____________</span>
                  <span>Date: _________</span>
                </div>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900/30">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-6">QC Checker & Weight</span>
                <div className="border-t border-dashed border-zinc-300 dark:border-zinc-700 pt-1 text-[10px] text-zinc-600 dark:text-zinc-400 flex justify-between">
                  <span>Verified: _________</span>
                  <span>Gross: _____ KG</span>
                </div>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900/30">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-6">Staging / Bay In-Charge</span>
                <div className="border-t border-dashed border-zinc-300 dark:border-zinc-700 pt-1 text-[10px] text-zinc-600 dark:text-zinc-400 flex justify-between">
                  <span>Dock Bay: 02</span>
                  <span>Crates: _____</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
