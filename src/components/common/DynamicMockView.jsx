import React, { useContext, useState, useMemo } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import { 
  Info, 
  HelpCircle, 
  Terminal, 
  Settings, 
  Layers, 
  Calendar,
  Search,
  CheckCircle,
  FileText,
  Mail,
  Sliders,
  Cpu,
  Layers3
} from 'lucide-react';

export default function DynamicMockView() {
  const { activeTabs } = useContext(WmsDataContext);
  const activeTab = activeTabs.general || activeTabs.inbound || activeTabs.store || activeTabs.outbound || activeTabs.return || 'wms_info';

  const [searchVal, setSearchVal] = useState('');

  // Context dictionary for all simulated reference pages
  const pageDetails = useMemo(() => {
    const data = {
      wms_info: {
        title: 'WMS & Installation Information',
        description: 'Review node hardware configurations, active cloud servers, database statuses, and operational environments.',
        icon: Info,
        stats: [
          { label: 'System Version', value: 'v4.8.2-stable' },
          { label: 'Main Server IP', value: '172.16.20.105' },
          { label: 'Database Nodes', value: 'Active (3)' },
          { label: 'License Status', value: 'Lifetime Enterprise' }
        ],
        headers: ['System Parameter', 'Configuration Value', 'Connection Node', 'Latency/Status'],
        rows: [
          ['Application Server', 'Node A - AWS Mumbai Region', 'ap-south-1a', 'Active (22ms)'],
          ['Secondary Failover', 'Node B - AWS Singapore Region', 'ap-southeast-1b', 'Standby (45ms)'],
          ['Log Aggregator', 'Elasticsearch Cluster v8.11', 'internal-es-01', 'Healthy'],
          ['Main WMS Cache', 'Redis Sentinel Cluster v7.2', 'redis-master-node', '0.4ms response'],
          ['Relational Database', 'MariaDB Galera Multi-Master', 'db-galera-01', 'Healthy (Active-Active)'],
          ['Storage Engine', 'MinIO Object Storage S3 Compatible', 'minio-s3-local', '94.2 TB free']
        ]
      },
      manual: {
        title: 'WMS User Manual & Workflows',
        description: 'Interactive reference guides for warehouse team roles and standard operating procedures (SOP).',
        icon: HelpCircle,
        stats: [
          { label: 'Operator Roles', value: '5 active profiles' },
          { label: 'SOP Handbooks', value: '12 PDFs' },
          { label: 'System Training', value: 'Completed (96%)' },
          { label: 'Help Desk tickets', value: '0 Open' }
        ],
        headers: ['Process Module', 'SOP Code', 'Responsible Operator', 'Validation Rule'],
        rows: [
          ['Inward Receiving Gate-In', 'SOP-IN-GP-01', 'Gate Security / Clerk', 'Verify open PO reference exist in ERP'],
          ['Inbound Unloading Dock', 'SOP-IN-UL-02', 'GRN Operator / Loader', 'Mandatory temp checks for reefers (0-4°C)'],
          ['QC Grading & Sorting', 'SOP-IN-QC-03', 'QC Inspector', 'Log batch parameters: grading, exp dates, and UOM count'],
          ['FIFO/FEFO Putaway Rack Alloc', 'SOP-IN-PA-04', 'Supervisor / Forklift', 'System recommends cold rooms based on crop category'],
          ['Outbound Picking Wave', 'SOP-OUT-PK-01', 'Picker / Packer', 'FIFO sequence prioritizes shortest expiry (FEFO)'],
          ['Dispatch Loading Gatepass', 'SOP-OUT-DP-02', 'Dispatch Clerk', 'Verify customer signature & gatepass matching']
        ]
      },
      apis: {
        title: 'System Integration API Registry',
        description: 'Manage and test outbound webhooks and inbound API integrations (ERP sync, logistics carriers, ecommerce store channels).',
        icon: Terminal,
        stats: [
          { label: 'Total API Calls (24h)', value: '142,504' },
          { label: 'Success Rate', value: '99.98%' },
          { label: 'Active Endpoints', value: '8 Online' },
          { label: 'Auth Token Expiry', value: '240 Days' }
        ],
        headers: ['Integration Channel', 'Endpoint URL Pattern', 'Request Type', 'Sync Interval'],
        rows: [
          ['SAP ERP Core Sync', 'https://api.gnosiswms.com/v2/erp/sync', 'POST / JSON', 'Real-time Webhook'],
          ['Radhe Retail Webstore', 'https://radheretail.com/api/wms/orders', 'GET / Web', 'Every 5 minutes'],
          ['Star Hypermarket Dispatch API', 'https://starhyper.com/inbound/challan', 'POST / XML', 'On shipping checkout'],
          ['Shiprocket Carrier API', 'https://api.shiprocket.in/v1/shipments', 'POST / JSON', 'On label generation'],
          ['GPS Reefer Tracker Webhook', 'https://api.gnosiswms.com/v2/fleet/telemetry', 'PUT / Telemetry', 'Every 30 seconds'],
          ['SMS Gateway Alert Trigger', 'https://smsapi.com/send-notification', 'GET / HTTP', 'On vehicle checkout']
        ]
      },
      departments: {
        title: 'Department & Operational Process Management',
        description: 'Define and assign warehouse organizational divisions, workforce zones, and workflow chains.',
        icon: Sliders,
        stats: [
          { label: 'Active Divisions', value: '4' },
          { label: 'Workforce count', value: '185 staff' },
          { label: 'Shift schedule', value: '2-Shift Matrix' },
          { label: 'Production lines', value: '8 active docks' }
        ],
        headers: ['Department Name', 'Zone Code', 'Section Lead', 'Active Staff Count'],
        rows: [
          ['Inbound Operations', 'Zone IN-Dock A', 'Rajesh Patel', '24 Operators'],
          ['Inventory & Store Control', 'Zone Store-Racks', 'Amit Mehta', '12 Auditing staff'],
          ['Outbound Processing', 'Zone Out-Bay B', 'Karan Sharma', '35 Pickers & Packers'],
          ['Cold Chain Maintenance', 'Zone Cold-Rooms', 'Dr. Vivek Joshi', '6 HVAC Engineers']
        ]
      },
      transaction_settings: {
        title: 'WMS Transactional settings',
        description: 'Toggle system-wide validation rules, barcode formatting rules, automation configurations, and kitting guidelines.',
        icon: Settings,
        stats: [
          { label: 'Auto Location suggesting', value: 'ENABLED' },
          { label: 'Re-entry Block', value: 'ACTIVE' },
          { label: 'Weight threshold', value: '5% margin' },
          { label: 'Default picker logic', value: 'FEFO priority' }
        ],
        headers: ['Setting Parameter', 'Configuration state', 'Override Auth', 'Last updated'],
        rows: [
          ['Allow Negative Inventory Stock', 'DISABLED (Strict Validation)', 'Admin Password Only', '2026-08-01'],
          ['Generate Automatic GRN Slips', 'ENABLED (On QC Pass)', 'Supervisor', '2026-08-03'],
          ['Automatic Reefer Temp Alarm', 'ENABLED (Trigger alerts if >8°C)', 'QC Inspector', '2026-08-05'],
          ['Auto Location Bin Reservation', 'ENABLED (FIFO Match)', 'Manager', '2026-08-06'],
          ['Customer Crate Auto Auditing', 'ENABLED (On POD submit)', 'Admin', '2026-08-06']
        ]
      },
      billing_plan: {
        title: 'WMS billing Plan & Subscription',
        description: 'Review subscription tier, data storage footprint, user seat quotas, and renewal dates.',
        icon: Calendar,
        stats: [
          { label: 'Subscription Plan', value: 'Enterprise Ultimate' },
          { label: 'Database footprint', value: '14.2 GB / Unlimited' },
          { label: 'User Seat limits', value: '28 / 50 seats' },
          { label: 'Renewal due in', value: '14 months' }
        ],
        headers: ['Plan Component', 'Allocated quota', 'Usage Status', 'Overage pricing'],
        rows: [
          ['Concurrent User Sessions', '50 Active Seats', '28 seats active', '₹500 / seat / month'],
          ['Daily API Request Quota', '500,000 requests', '142,504 utilized', '₹0.10 / 1000 requests'],
          ['Reefer Fleet Sensors Link', '100 Active Reefers', '4 trucks linked', '₹200 / truck / month'],
          ['Multi-Warehouse Docks link', '10 facilities', '3 hubs configured', '₹5000 / facility']
        ]
      },
      email_sms: {
        title: 'Emailer & SMS Alerts Scheduler',
        description: 'Configure and test automated SMS / Email notifications sent to vendors, transporters, and clients on WMS events.',
        icon: Mail,
        stats: [
          { label: 'SMS Provider', value: 'Twilio Gateway' },
          { label: 'Email Server SMTP', value: 'AWS SES Connection' },
          { label: 'Daily Alert SMS', value: '124 Sent' },
          { label: 'Fail Rate', value: '0%' }
        ],
        headers: ['Notification Template', 'Trigger Condition', 'Recipient Group', 'Message Preview'],
        rows: [
          ['Gate-In Checkin Slip', 'On Security Gate-In Registry', 'Driver / Transporter', 'Vehicle [No] checked-in for [PO]. Gatepass generated.'],
          ['QC Quality Pass Report', 'On QC grading approval', 'Supplier (Vendor)', 'QC passed for PO [No]. GRN [No] generated.'],
          ['QC Shortage Alert Log', 'On QC discrepancy detection', 'Procurement Dept', 'Discrepancy of [Qty] units detected on PO [No] from [Vendor].'],
          ['Dispatch Gate-Out slip', 'On Shipping Dispatch submit', 'Customer contact', 'Order [No] dispatched in Vehicle [No]. Invoice generated.']
        ]
      },
      form_rules: {
        title: 'Form Validation & Customization Rules',
        description: 'Set custom data schemas, mandatory fields, and formatting expressions for warehouse data entries.',
        icon: Sliders,
        stats: [
          { label: 'Custom Forms', value: '4 configured' },
          { label: 'Active schemas', value: '12 validators' },
          { label: 'Regex patterns', value: '8 formats' },
          { label: 'Strict enforcement', value: 'Active' }
        ],
        headers: ['Target Form Code', 'Field Name', 'Rule Condition', 'System Action'],
        rows: [
          ['FORM-GATE-IN', 'vehicleNo', 'Match Regex: [A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}', 'Reject registration if invalid'],
          ['FORM-GATE-IN', 'inKmReading', 'Value must be > last check-out KM', 'Display alert warning and block submit'],
          ['FORM-QC-CHECK', 'tempRequired', 'Range check: -5°C to +25°C', 'Require QC Inspector signoff if out of range'],
          ['FORM-NEW-PO', 'expectedQty', 'Must be integer > 0', 'Block submission if empty']
        ]
      },
      stations: {
        title: 'Production Lines & Scanner Stations',
        description: 'Manage IP barcode printers, handheld RFID scanners, weighing docks, and conveyor stations.',
        icon: Cpu,
        stats: [
          { label: 'Barcoding Printers', value: '4 Zebra IP Docks' },
          { label: 'Handheld RFID Scanners', value: '12 Zebra TC21' },
          { label: 'Weighing Bridges', value: '2 Docks (A & B)' },
          { label: 'Network status', value: 'All terminals online' }
        ],
        headers: ['Station Code', 'Weighing/Printing type', 'Active Host IP', 'Hardware Status'],
        rows: [
          ['STN-DOCK-A-PRN', 'Zebra ZT411 Label Printer', '192.168.20.50', 'Online (Ready)'],
          ['STN-DOCK-B-PRN', 'Zebra ZT411 Label Printer', '192.168.20.51', 'Online (Ready)'],
          ['STN-SCALE-01', 'Electronic Weighing Bridge 10T', '192.168.20.60', 'Online (Calibrated)'],
          ['STN-SCALE-02', 'Electronic Weighing Bridge 10T', '192.168.20.61', 'Offline (Calibrating)'],
          ['RFID-HANDHELD-01', 'Zebra RFID Gun Terminal', '192.168.20.80', 'Active - Operator Amit'],
          ['RFID-HANDHELD-02', 'Zebra RFID Gun Terminal', '192.168.20.81', 'Active - Operator Suresh']
        ]
      },
      kitting: {
        title: 'kitting, BOM & Assembly Plan Manager',
        description: 'Assemble multi-product gift packs or crop mixes utilizing Bill of Materials (BOM) formulas.',
        icon: Layers,
        stats: [
          { label: 'Active BOM Recipes', value: '4' },
          { label: 'Assembly Orders', value: '2 Pending' },
          { label: 'Assigned Workers', value: '8 Staff' },
          { label: 'Completed kits', value: '250 today' }
        ],
        headers: ['Assembly Order', 'Target Pack Product', 'Raw Materials (BOM)', 'Kitting Status'],
        rows: [
          ['KIT-ORD-001', 'Fruit Salad Mix Basket (5kg)', '2kg Apples, 1.5kg Oranges, 1.5kg Strawberries', 'Picking components in wave'],
          ['KIT-ORD-002', 'Vegetable Stew Kit Pack (3kg)', '1.5kg Potatoes, 1kg Tomatoes, 0.5kg Onions', 'Assembling in Station 3'],
          ['BOM-RECIPE-01', 'Assorted Citrus Gift pack', '3kg Nagpur Oranges, 2kg Sweet Limes', 'Active Recipe (Standard)'],
          ['BOM-RECIPE-02', 'Leafy Greens Organic Pack', '1kg Baby Spinach, 1kg Coriander, 1kg Fenugreek', 'Active Recipe (Standard)']
        ]
      },
      two_bin: {
        title: '2-Bin Kanban Stock replenishment',
        description: 'Track secondary storage bin triggers. When Bin A empty flags, stock is auto-pulled from bulk storage Bin B.',
        icon: Layers3,
        stats: [
          { label: 'Active 2-Bin loops', value: '14' },
          { label: 'Empty triggers', value: '2 Bins' },
          { label: 'Auto Pull waves', value: '1 Active' },
          { label: 'Replenish Time Avg', value: '8.4 minutes' }
        ],
        headers: ['Kanban Loop ID', 'Target Product SKU', 'Active Bin A Location', 'Auxiliary Bin B Location', 'Loop status'],
        rows: [
          ['LOOP-APP-01', 'Fresh Shimla Apples', 'A-01-01 (Active Stock)', 'A-01-02 (Bulk Backup)', 'Stock Normal (Bin A Full)'],
          ['LOOP-ORG-02', 'Nagpur Oranges', 'A-01-02 (Active Stock)', 'A-02-01 (Bulk Backup)', 'Bin A Empty - Auto Replenish Pull generated'],
          ['LOOP-STR-08', 'Fresh Strawberries', 'A-02-01 (Active Stock)', 'A-02-02 (Bulk Backup)', 'Stock Normal (Bin A Full)'],
          ['LOOP-POT-04', 'Organic Potatoes', 'B-01-01 (Active Stock)', 'B-01-02 (Bulk Backup)', 'Bin A Empty - Replenishment In Transit']
        ]
      }
    };

    return data[activeTab] || data['wms_info'];
  }, [activeTab]);

  const IconComponent = pageDetails.icon;

  const filteredRows = useMemo(() => {
    const q = searchVal.toLowerCase();
    return pageDetails.rows.filter(row => 
      row.some(field => field.toString().toLowerCase().includes(q))
    );
  }, [pageDetails, searchVal]);

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6 animate-in fade-in-50 duration-200">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-600/10 p-2 rounded-xl text-emerald-600 dark:text-emerald-400">
            <IconComponent className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">{pageDetails.title}</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{pageDetails.description}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {pageDetails.stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-[#0c0c0f] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">{stat.label}</span>
            <span className="text-lg font-black block mt-1 text-zinc-850 dark:text-zinc-100">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Main Table card */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
        
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Quick search data logs..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Table */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold">
              <tr>
                {pageDetails.headers.map((h, i) => (
                  <th key={i} className="p-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={pageDetails.headers.length} className="text-center py-10 text-zinc-400">No database log records matched your query.</td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className={`p-3 ${cIdx === 0 ? 'font-bold text-zinc-850 dark:text-zinc-200' : ''}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
