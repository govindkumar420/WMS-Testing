import React, { useRef } from 'react';
import { Printer, Download, X, CheckCircle2, ShieldCheck, Truck, Thermometer, Box } from 'lucide-react';

export default function DeliveryChallanModal({ isOpen, onClose, challanData, products = [], customers = [] }) {
  const printRef = useRef(null);

  if (!isOpen || !challanData) return null;

  const {
    so = {},
    customer = {},
    invoiceNo = 'INV-DISP-7712',
    gatePassNo = 'GP-2026-481779',
    challanNo = 'GVL/04874/26-27',
    date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    vendorCode = customer.code || 'VND-GNS-88',
    vehicleNo = 'GJ15AV7963',
    driverName = 'AABID SAMA',
    driverMobile = '9687064462',
    sealNo = 'SEAL-2026-8801',
    deliveryLocation = customer.city || 'Rheino Safari',
    department = 'ANIMAL KITCHEN',
    cratesDispatched = 26,
    displayTemp = '20',
    setTemp = '8°C',
    departureTemp = '10',
    company = {}
  } = challanData;

  const companyName = company.name || 'GNOSIS VENTURES LLP';
  const companyAddress = company.address || 'C/O SHIV COLD STORAGE, SURVEY NO. 105/5 KHIJADIYA BY PASS, CHOWKDI, KHIJADIYA DISTRICT JAMNAGAR-361120';
  const companyGst = company.gstNo || '24AANFG0052H1ZP';

  // Extract order line items
  const orderItems = so.items || [];
  const totalQty = orderItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

  // Generate 17 rows standard challan sheet
  const targetRowCount = Math.max(17, orderItems.length);
  const rows = [];

  for (let i = 0; i < targetRowCount; i++) {
    if (i < orderItems.length) {
      const it = orderItems[i];
      const prod = products.find(p => p.id === it.productId) || {};
      rows.push({
        sr: i + 1,
        code: prod.code ? prod.code.replace('PROD-', '') : (it.code || 'G256'),
        name: prod.description || it.description || 'Product Item',
        uom: prod.uom?.toLowerCase().includes('crate') ? 'CRATE' : (prod.uom?.toLowerCase().includes('box') ? 'BOX' : (prod.uom || 'KG')),
        qtySupplied: (Number(it.qty) || 0).toFixed(2),
        qtyRejected: it.qtyRejected || '',
        remarks: it.remarks || ''
      });
    } else {
      // Empty placeholder rows to match challan template
      rows.push({
        sr: i + 1,
        code: '--',
        name: '---',
        uom: 'KG',
        qtySupplied: '0.00',
        qtyRejected: '',
        remarks: ''
      });
    }
  }

  // Print Handler
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
          <title>Delivery_Challan_${challanNo.replace(/[\/\\]/g, '_')}</title>
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

  // CSV Export Handler
  const handleExportCSV = () => {
    const csvRows = [
      ['COMPANY', companyName],
      ['ADDRESS', companyAddress],
      ['GSTIN', companyGst],
      [],
      ['DELIVERY CHALLAN'],
      ['Challan No', challanNo, 'Date', date],
      ['Buyer Billing', customer.name || 'Greens Zoological', 'Delivery Location', deliveryLocation],
      ['Vehicle No', vehicleNo, 'Driver', `${driverName} (${driverMobile})`],
      ['Seal No', sealNo, 'Crates Dispatched', cratesDispatched],
      ['Display Temp', displayTemp, 'Set Temp', setTemp, 'Departure Temp', departureTemp],
      [],
      ['Sr', 'Product Code', 'Product & Specification', 'UOM', 'Qty Supplied', 'Qty Rejected', 'Remarks']
    ];

    rows.forEach(r => {
      csvRows.push([r.sr, r.code, r.name, r.uom, r.qtySupplied, r.qtyRejected, r.remarks]);
    });

    csvRows.push([]);
    csvRows.push(['', '', 'TOTAL QTY SUPPLIED', '', totalQty.toFixed(2), '', '']);

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.map(x => `"${x}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Delivery_Challan_${challanNo.replace(/[\/\\]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0c0c0f] text-zinc-900 dark:text-zinc-100 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 relative max-h-[95vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Top Control Bar (Screen only) */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4 no-print">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">
                Official Delivery Challan
              </h2>
              <span className="text-[11px] text-zinc-400">
                Challan Ref: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{challanNo}</strong> | Vehicle: <strong className="text-zinc-800 dark:text-zinc-200 font-mono">{vehicleNo}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-colors shadow-sm active:scale-95"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Challan</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-1">
          <div
            ref={printRef}
            className="printable-document bg-white text-zinc-900 p-6 rounded-xl border border-zinc-300 shadow-xs max-w-3xl mx-auto space-y-3 font-sans text-xs"
            style={{ color: '#18181b', backgroundColor: '#ffffff' }}
          >
            {/* 1. Header Box with Logo & Company Info */}
            <div className="border-2 border-[#138A72] rounded-xl p-3 text-center bg-white space-y-1">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6 text-[#138A72]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M2 12c4-4 8 4 12 0 4-4 8 4 12 0" />
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
                <h1 className="text-lg sm:text-xl font-black text-[#138A72] tracking-tight uppercase">
                  {companyName}
                </h1>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-700 font-semibold uppercase leading-tight px-4">
                {companyAddress}
              </p>
              <p className="text-xs font-black text-zinc-900 tracking-wider">
                GSTIN: {companyGst}
              </p>
            </div>

            {/* 2. Banner Bar */}
            <div className="bg-[#138A72] text-white font-black text-xs sm:text-sm uppercase tracking-widest text-center py-1.5 rounded-lg shadow-xs">
              DELIVERY CHALLAN
            </div>

            {/* 3. Buyer Details vs Challan Details Two-Box Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Buyer Box */}
              <div className="border border-[#138A72]/40 rounded-xl overflow-hidden bg-white text-xs">
                <div className="bg-[#e6f7f2] px-3 py-1.5 font-bold text-[#138A72] text-[11px] uppercase tracking-wider border-b border-[#138A72]/30">
                  BUYER DETAILS
                </div>
                <div className="p-3 space-y-2.5 leading-snug text-zinc-800 text-[11px]">
                  <div>
                    <span className="font-bold text-zinc-950 block">Billing Address:</span>
                    <span className="font-semibold text-zinc-900">{customer.name || 'Greens Zoological, Rescue And Rehabilitation Centre Society'}</span>
                    <p className="text-zinc-600 mt-0.5 whitespace-pre-line">
                      {customer.address || '"Vraj" Opp HDFC Bank, Beside Chandanbala Tower,\nNear Suvidha Shopping Centre, Paldi, Ahmedabad'}
                    </p>
                    <span className="font-bold text-zinc-900 block mt-1">GSTIN: {customer.gstNo || 'AADTG8371P'}</span>
                  </div>
                  <div className="pt-1.5 border-t border-zinc-150">
                    <span className="font-bold text-zinc-950 block">Delivery Address:</span>
                    <span className="font-semibold text-zinc-900">{customer.name || 'Greens Zoological, Rescue And Rehabilitation Centre Society'}</span>
                    <p className="text-zinc-600 mt-0.5 whitespace-pre-line">
                      {customer.deliveryAddress || customer.address || 'Greens Zoological, Rescue And Rehabilitation Centre Society,\n"Vraj" Opp HDFC Bank, Beside Chandanbala Tower,\nNear Suvidha Shopping Centre, Paldi, Ahmedabad\nAhmedabad, Gujarat, India, Pincode-380007'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Challan Box */}
              <div className="border border-[#138A72]/40 rounded-xl overflow-hidden bg-white text-xs">
                <div className="bg-[#e6f7f2] px-3 py-1.5 font-bold text-[#138A72] text-[11px] uppercase tracking-wider border-b border-[#138A72]/30">
                  CHALLAN DETAILS
                </div>
                <div className="p-3 space-y-1.5 text-[11px] text-zinc-800 divide-y divide-zinc-100">
                  <div className="flex justify-between py-0.5">
                    <span className="font-semibold text-zinc-600">Challan No:</span>
                    <strong className="font-bold font-mono text-zinc-950">{challanNo}</strong>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-semibold text-zinc-600">Date:</span>
                    <strong className="font-bold text-zinc-950">{date}</strong>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-semibold text-zinc-600">Vendor Code:</span>
                    <strong className="font-bold font-mono text-zinc-950">{vendorCode}</strong>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-semibold text-zinc-600">Vehicle No:</span>
                    <strong className="font-bold font-mono text-zinc-950">{vehicleNo}</strong>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-semibold text-zinc-600">Driver/Mob:</span>
                    <strong className="font-bold text-zinc-950 uppercase">{driverName} / {driverMobile}</strong>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="font-semibold text-zinc-600">Seal No:</span>
                    <strong className="font-bold font-mono text-purple-700">{sealNo}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Telemetry & Cold Chain Dispatched Crates Strip */}
            <div className="border border-[#138A72]/60 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-center border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-[#138A72] text-white font-bold uppercase">
                    <th className="py-1 px-2 border-r border-[#138A72]/30">Delivery Location</th>
                    <th className="py-1 px-2 border-r border-[#138A72]/30">Kitchen / Department</th>
                    <th className="py-1 px-2 border-r border-[#138A72]/30">Crates Dispatched</th>
                    <th className="py-1 px-2 border-r border-[#138A72]/30">Display Temp</th>
                    <th className="py-1 px-2 border-r border-[#138A72]/30">Set Temp</th>
                    <th className="py-1 px-2">Departure Temp</th>
                  </tr>
                </thead>
                <tbody className="bg-white font-semibold text-zinc-800">
                  <tr className="divide-x divide-zinc-200">
                    <td className="py-1.5 px-2 font-medium">{deliveryLocation}</td>
                    <td className="py-1.5 px-2 font-medium">{department}</td>
                    <td className="py-1.5 px-2 font-black text-zinc-950 text-xs bg-emerald-50/50">{cratesDispatched}</td>
                    <td className="py-1.5 px-2 font-mono">{displayTemp}</td>
                    <td className="py-1.5 px-2 font-mono">{setTemp}</td>
                    <td className="py-1.5 px-2 font-mono">{departureTemp}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. Products Line Items Table */}
            <div className="border border-[#138A72]/60 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-[#138A72] text-white font-bold uppercase text-[10px]">
                    <th className="py-1 px-2 text-center w-10 border-r border-[#138A72]/30">Sr.</th>
                    <th className="py-1 px-2 w-28 border-r border-[#138A72]/30">Product Code</th>
                    <th className="py-1 px-2 border-r border-[#138A72]/30">Product & Specification</th>
                    <th className="py-1 px-2 text-center w-14 border-r border-[#138A72]/30">UOM</th>
                    <th className="py-1 px-2 text-right w-24 border-r border-[#138A72]/30">Qty Supplied</th>
                    <th className="py-1 px-2 text-center w-20 border-r border-[#138A72]/30">Qty Rejected</th>
                    <th className="py-1 px-2 w-24">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-800">
                  {rows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'}>
                      <td className="py-1 px-2 text-center font-bold text-zinc-600 border-r border-zinc-200">{row.sr}</td>
                      <td className="py-1 px-2 font-bold font-mono text-zinc-900 border-r border-zinc-200">{row.code}</td>
                      <td className="py-1 px-2 font-semibold text-zinc-900 border-r border-zinc-200">{row.name}</td>
                      <td className="py-1 px-2 text-center font-mono text-zinc-600 border-r border-zinc-200">{row.uom}</td>
                      <td className="py-1 px-2 text-right font-black font-mono text-zinc-950 border-r border-zinc-200">{row.qtySupplied}</td>
                      <td className="py-1 px-2 text-center text-zinc-400 border-r border-zinc-200">{row.qtyRejected}</td>
                      <td className="py-1 px-2 text-zinc-500">{row.remarks}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50/70 border-t-2 border-[#138A72] font-bold text-zinc-900">
                    <td colSpan={4} className="py-1.5 px-3 text-right font-black uppercase text-[10px] tracking-wider">
                      Total Quantity Supplied:
                    </td>
                    <td className="py-1.5 px-2 text-right font-black font-mono text-emerald-800 text-xs">
                      {totalQty.toFixed(2)}
                    </td>
                    <td colSpan={2} className="py-1.5 px-2 text-left text-[10px] text-zinc-500 font-medium">
                      ({cratesDispatched} Total Crates Loaded)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 6. Footer / Signatures Section */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-200 text-center text-[10px] text-zinc-600">
              <div className="border-t border-dashed border-zinc-400 pt-2">
                <span className="font-bold text-zinc-900 block">Receiver's Signature & Stamp</span>
                <span className="text-[9px] text-zinc-400">(Goods Received in Good Order)</span>
              </div>
              <div className="border-t border-dashed border-zinc-400 pt-2">
                <span className="font-bold text-zinc-900 block">Security / Gate Officer</span>
                <span className="text-[9px] text-zinc-400">(Vehicle Gate Out Verified)</span>
              </div>
              <div className="border-t border-dashed border-zinc-400 pt-2">
                <span className="font-bold text-zinc-900 block uppercase">For {companyName}</span>
                <span className="text-[9px] text-zinc-400">(Authorized Signatory)</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
