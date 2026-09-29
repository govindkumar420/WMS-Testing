import React, { useContext, useState } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Database,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  ArrowLeftRight,
  ThermometerSnowflake,
  FileSpreadsheet,
  ShieldCheck,
  FileText,
  Truck,
  Settings,
  User
} from 'lucide-react';

export default function Sidebar() {
  const {
    loggedInUser,
    currentView,
    activeTabs,
    navigateTo
  } = useContext(WmsDataContext);

  // Accordion open/close state mapping
  const [openSections, setOpenSections] = useState({
    general: currentView === 'general' || currentView === 'mock',
    masters: currentView === 'general' || currentView === 'masters',
    purchase: currentView === 'purchase',
    gatepass: currentView === 'gatepass',
    inbound: currentView === 'inbound',
    outbound: currentView === 'outbound',
    return: currentView === 'return',
    store: currentView === 'store',
    reports: currentView === 'reports'
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSubNav, setSelectedSubNav] = useState(null);

  const toggleSection = (sectionId) => {
    setOpenSections(prev => Object.fromEntries(
      Object.keys(prev).map(id => [id, id === sectionId && !prev[sectionId]])
    ));
  };

  if (!loggedInUser) return null;

  // Accordion Navigation Definition matching Gnosis WMS structure
  const menuConfig = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      action: () => navigateTo('dashboard'),
      items: []
    },
    {
      id: 'general',
      label: 'General Settings',
      icon: Settings,
      items: [
        { label: 'WMS Installation Info', view: 'mock', tab: 'wms_info' },
        { label: 'User Manual Guide', view: 'mock', tab: 'manual' },
        { label: 'APIs List and Links', view: 'mock', tab: 'apis' },
        { label: 'Department & Process Mgmt', view: 'mock', tab: 'departments' },
        { label: 'Transaction Setting', view: 'mock', tab: 'transaction_settings' },
        { label: 'WMS Billing Plan', view: 'mock', tab: 'billing_plan' },
        { label: 'Reset Transactional DB', view: 'security', tab: 'database' },
        { label: 'User Accounts Management', view: 'security', tab: 'users' },
        { label: 'User Access Log', view: 'security', tab: 'audit' },
        { label: 'Emailer & SMS Settings', view: 'mock', tab: 'email_sms' },
        { label: 'Form Customization Rules', view: 'mock', tab: 'form_rules' }
      ]
    },
    {
      id: 'masters',
      label: 'Master Registry',
      icon: Database,
      items: [
        { label: 'Product/Material Master', view: 'general', tab: 'products' },
        { label: 'Binning/Location Master', view: 'general', tab: 'locations' },
        { label: 'Supplier Masters', view: 'general', tab: 'vendors' },
        { label: 'Customer Masters', view: 'general', tab: 'customers' },
        { label: 'Warehouse Facility Master', view: 'general', tab: 'warehouses' },
        { label: 'Transporter Masters', view: 'general', tab: 'vehicles' },
        { label: 'Line & Station Master', view: 'mock', tab: 'stations' },
        { label: 'Category Master', view: 'general', tab: 'categories' },
        { label: 'UOM Master', view: 'general', tab: 'uoms' },
        { label: 'Driver Master', view: 'general', tab: 'drivers' },
        { label: 'Employee Master', view: 'general', tab: 'employees' },
        { label: 'Barcode/QR Master', view: 'general', tab: 'barcodes' },
        { label: 'Tax Master', view: 'general', tab: 'taxes' },
        { label: 'Reason Master', view: 'general', tab: 'reasons' },
        { label: 'Company Master', view: 'general', tab: 'company' }
      ]
    },
    {
      id: 'purchase',
      label: 'Purchase Order',
      icon: FileText,
      items: [
        { label: 'Purchase Order Mgmt', view: 'purchase', tab: 'po_mgmt' },
        { label: 'PO Material - Receiving Report', view: 'purchase', tab: 'po_material_receiving' },
        { label: 'Supplier Material Rate Master', view: 'purchase', tab: 'supplier_material_rate' },
        { label: 'Update Purchase Rate', view: 'purchase', tab: 'update_purchase_rate' },
        { label: 'Vendor Challan Preview', view: 'purchase', tab: 'vendor_challan' }
      ]
    },
    {
      id: 'gatepass',
      label: 'Gatepass Control',
      icon: Truck,
      items: [
        { label: 'Pending Vehicle / Add New', view: 'gatepass', tab: 'pending_vehicle' },
        { label: 'Pending For Gateout', view: 'gatepass', tab: 'pending_gateout' },
        { label: 'Vehicle Summary Log', view: 'gatepass', tab: 'vehicle_summary' },
        { label: 'Uploaded Inbound Vehicle Mgmt', view: 'mock', tab: 'uploaded_inbound' },
        { label: 'Uploaded Outbound Vehicle Mgmt', view: 'mock', tab: 'uploaded_outbound' },
        { label: 'Vehicle Tracking System', view: 'gatepass', tab: 'vehicle_tracking' },
        { label: 'Open PO Security Gate Pass', view: 'mock', tab: 'po_gate_pass' },
        { label: 'Unload - Empty Return Crates', view: 'gatepass', tab: 'empty_crates' }
      ]
    },
    {
      id: 'inbound',
      label: 'Inward Operations',
      icon: ArrowDownLeft,
      items: [
        { label: 'Inward Lifecycle (8 Stages)', view: 'inbound', tab: 'workflow' },
        { label: 'Unloading Management', view: 'inbound', tab: 'receiving' },
        { label: 'Unload & Initial GRN', view: 'inbound', tab: 'receiving' },
        { label: 'QC: Sorting & Grading', view: 'inbound', tab: 'qc' },
        { label: 'Quality Check & Control', view: 'inbound', tab: 'qc' },
        { label: 'GRN Management', view: 'inbound', tab: 'grn' },
        { label: 'Putaway & Binning Mngmt', view: 'inbound', tab: 'putaway' },
        { label: 'Direct Putaway (GRN & QC)', view: 'inbound', tab: 'putaway' },
        { label: 'Available Inventory Stock', view: 'inbound', tab: 'stock' },
        { label: 'Inward Return Adjustment', view: 'mock', tab: 'inward_return_adj' }
      ]
    },
    {
      id: 'outbound',
      label: 'Outward Process',
      icon: ArrowUpRight,
      items: [
        { label: 'Order Management (SO)', view: 'outbound', tab: 'so' },
        { label: 'Picklist & Picking Management', view: 'outbound', tab: 'picking' },
        { label: 'QA & QC Outbound Management', view: 'outbound', tab: 'dispatch' },
        { label: 'Proof of Delivery (POD)', view: 'outbound', tab: 'delivery' },
        { label: 'Outward Invoice & Challan', view: 'outbound', tab: 'invoice_challan' },
        { label: 'Engine & Kitting Management', view: 'mock', tab: 'kitting' }
      ]
    },
    {
      id: 'return',
      label: 'Returns Control',
      icon: ArrowLeftRight,
      items: [
        { label: 'Sales Return', view: 'return', tab: 'cust_returns' },
        { label: 'QC Return', view: 'return', tab: 'supplier_returns' },
        { label: 'All QC Rejection & Return', view: 'return', tab: 'returns_qc' },
        { label: 'Scrap Management (Quarantine)', view: 'mock', tab: 'scrap' }
      ]
    },
    {
      id: 'store',
      label: 'Store & Inventory',
      icon: Package,
      items: [
        { label: 'Crate Management', view: 'store', tab: 'inventory' },
        { label: 'Available Inventory Movement', view: 'store', tab: 'transfer' },
        { label: 'Block Inventory Movement', view: 'store', tab: 'transfer' },
        { label: 'Stock Inventory Transfer', view: 'store', tab: 'transfer' },
        { label: '2 Bin System Inventory Movement', view: 'mock', tab: 'two_bin' },
        { label: 'WH to WH / Stock Transfer', view: 'store', tab: 'transfer' },
        { label: 'Cycle Count & PIV Management', view: 'store', tab: 'cycle_count' },
        { label: 'Manual Stock Inventory Adj', view: 'store', tab: 'adjustment' },
        { label: 'Cancellation Order Movement', view: 'mock', tab: 'cancel_movement' },
        { label: 'Crate Dispatch & Loading', view: 'mock', tab: 'crate_dispatch' }
      ]
    },
    {
      id: 'reports',
      label: 'Reports & MIS',
      icon: FileSpreadsheet,
      items: [
        { label: 'Executive MIS Dashboard', view: 'reports', tab: 'mis' },
        { label: 'Live Stock Report', view: 'reports', tab: 'stock' },
        { label: 'FEFO Stock Ageing Report', view: 'reports', tab: 'ageing' },
        { label: 'GRN Receipts Log', view: 'reports', tab: 'grn' },
        { label: 'Warehouse Dispatches Report', view: 'reports', tab: 'dispatch' },
        { label: 'Audit Trail Reports', view: 'reports', tab: 'audit' },
        { label: 'Power BI Embedded Sandbox', view: 'reports', tab: 'powerbi' }
      ]
    },
    {
      id: 'security_view',
      label: 'Security & RBAC',
      icon: ShieldCheck,
      action: () => navigateTo('security'),
      items: []
    },
    {
      id: 'coldchain_view',
      label: 'Cold Chain control',
      icon: ThermometerSnowflake,
      action: () => navigateTo('coldchain'),
      items: []
    }
  ];

  return (
    <aside className="relative z-30 h-[calc(100vh-3.5rem)] w-14 shrink-0 sticky top-14">
      <div
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onFocus={() => setIsExpanded(true)}
        onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsExpanded(false);
        }}
        className={`absolute inset-y-0 left-0 flex flex-col justify-between border-r border-zinc-200 bg-white shadow-lg transition-[width] duration-300 ease-out dark:border-zinc-800 dark:bg-[#0c0c0f] ${isExpanded ? 'w-64' : 'w-14'}`}
      >
      <div className={`${isExpanded ? 'p-4' : 'p-2'} space-y-1.5 overflow-y-auto flex-1 select-none scrollbar-thin dark:scrollbar-thumb-zinc-800`}>

        <span aria-hidden={!isExpanded} className={`block overflow-hidden whitespace-nowrap px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400 transition-[opacity,max-width] duration-200 ease-out dark:text-zinc-500 ${isExpanded ? 'max-w-48 opacity-100 delay-75' : 'max-w-0 opacity-0'}`}>
          Gnosis WMS Control
        </span>

        <nav className="space-y-1 mt-2">
          {menuConfig.map(menu => {
            const MenuIcon = menu.icon;
            const hasChildren = menu.items.length > 0;
            const isSectionOpen = openSections[menu.id] || false;

            // Check if current view matches this menu
            const isRootActive = currentView === menu.id ||
              (menu.id === 'security_view' && currentView === 'security') ||
              (menu.id === 'coldchain_view' && currentView === 'coldchain');

            return (
              <div key={menu.id} className="space-y-0.5">

                {/* Main Accordion Button */}
                <button
                  title={isExpanded ? undefined : menu.label}
                  aria-label={menu.label}
                  onClick={() => {
                    if (hasChildren) {
                      toggleSection(menu.id);
                    } else if (menu.action) {
                      menu.action();
                    }
                  }}
                  className={`w-full flex items-center ${isExpanded ? 'justify-between px-3' : 'justify-center px-0'} py-2 text-xs font-semibold rounded-lg transition-all ${isRootActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-l-2 border-emerald-600 dark:border-emerald-400'
                    : 'text-zinc-650 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MenuIcon className={`h-4 w-4 ${isRootActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-450'}`} />
                    <span aria-hidden={!isExpanded} className={`overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-200 ease-out ${isExpanded ? 'max-w-48 opacity-100 delay-75' : 'max-w-0 opacity-0'}`}>
                      {menu.label}
                    </span>
                  </div>
                  {isExpanded && hasChildren && (
                    isSectionOpen ? <ChevronDown className="h-3 w-3 opacity-60" /> : <ChevronRight className="h-3 w-3 opacity-60" />
                  )}
                </button>

                {/* Submenu links */}
                {isExpanded && hasChildren && (
                  <div
                    aria-hidden={!isSectionOpen}
                    inert={!isSectionOpen}
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isSectionOpen ? 'grid-rows-[1fr] opacity-100 mt-0.5' : 'grid-rows-[0fr] opacity-0 mt-0'}`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="pl-6.5 pr-2 py-0.5 space-y-0.5 border-l border-zinc-100 dark:border-zinc-800 ml-4.5">
                        {menu.items.map((item, idx) => {
                          const itemId = `${menu.id}-${idx}`;
                          const hasSelectedItemForCurrentView = selectedSubNav?.view === currentView &&
                            activeTabs[currentView] === selectedSubNav.tab;
                          const isItemActive = hasSelectedItemForCurrentView
                            ? selectedSubNav.id === itemId
                            : currentView === item.view && activeTabs[item.view] === item.tab;
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedSubNav({ id: itemId, view: item.view, tab: item.tab });
                                navigateTo(item.view, item.tab);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${isItemActive
                                ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5'
                                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-450 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                                }`}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </nav>

      </div>

      {/* Footer session info */}
      <div className={`${isExpanded ? 'p-3' : 'p-2'} border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10`}>
        <div title={isExpanded ? undefined : loggedInUser.name} className={`bg-zinc-50 dark:bg-zinc-900/50 rounded-xl ${isExpanded ? 'p-2.5 gap-2.5' : 'p-1.5 justify-center'} border border-zinc-150 dark:border-zinc-800/80 flex items-center`}>
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400">
            <User className="h-3.5 w-3.5" />
          </div>
          {isExpanded && <div className="overflow-hidden">
            <span className="block text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
              {loggedInUser.name}
            </span>
            <span className="block text-[8px] text-zinc-400 capitalize truncate mt-0.5">
              {loggedInUser.role}
            </span>
          </div>}
        </div>
      </div>

      </div>
    </aside>
  );
}
