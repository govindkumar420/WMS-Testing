import React, { useContext, useState } from 'react';
import { WmsDataContext } from '../../context/WmsDataContext';
import { Plus, Edit2, Trash2, Search, X, Check } from 'lucide-react';

export default function GeneralView() {
  const context = useContext(WmsDataContext);
  const { activeTabs, setActiveTabs } = context;
  const activeTab = activeTabs.general || 'products';
  const setActiveTab = (tab) => {
    setActiveTabs(prev => ({ ...prev, general: tab }));
  };
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');

  const tabs = [
    { id: 'company', label: 'Company Master', key: 'wms_companies', stateName: 'companies', setter: context.setCompanies },
    { id: 'warehouses', label: 'Warehouse Master', key: 'wms_warehouses', stateName: 'warehouses', setter: context.setWarehouses },
    { id: 'customers', label: 'Customer Master', key: 'wms_customers', stateName: 'customers', setter: context.setCustomers },
    { id: 'vendors', label: 'Supplier / Vendor', key: 'wms_vendors', stateName: 'vendors', setter: context.setVendors },
    { id: 'products', label: 'Product Master', key: 'wms_products', stateName: 'products', setter: context.setProducts },
    { id: 'categories', label: 'Category Master', key: 'wms_categories', stateName: 'categories', setter: context.setCategories },
    { id: 'uoms', label: 'UOM Master', key: 'wms_uoms', stateName: 'uoms', setter: context.setUoms },
    { id: 'locations', label: 'Location / Rack / Bin', key: 'wms_locations', stateName: 'locations', setter: context.setLocations },
    { id: 'vehicles', label: 'Vehicle Master', key: 'wms_vehicles', stateName: 'vehicles', setter: context.setVehicles },
    { id: 'drivers', label: 'Driver Master', key: 'wms_drivers', stateName: 'drivers', setter: context.setDrivers },
    { id: 'employees', label: 'Employee Master', key: 'wms_employees', stateName: 'employees', setter: context.setEmployees },
    { id: 'users', label: 'User & Role', key: 'wms_users', stateName: 'users', setter: context.setUsers },
    { id: 'barcodes', label: 'Barcode / QR', key: 'wms_barcodes', stateName: 'barcodes', setter: context.setBarcodes },
    { id: 'taxes', label: 'Tax Master', key: 'wms_taxes', stateName: 'taxes', setter: context.setTaxes },
    { id: 'reasons', label: 'Reason Master', key: 'wms_reasons', stateName: 'reasons', setter: context.setReasons }
  ];

  const currentTabInfo = tabs.find(t => t.id === activeTab) || tabs[0];
  const currentData = currentTabInfo ? (context[currentTabInfo.stateName] || []) : [];

  // Filtered data
  const filteredData = currentData.filter(item => {
    const query = searchQuery.toLowerCase();
    return Object.values(item).some(val =>
      val !== null && val !== undefined && val.toString().toLowerCase().includes(query)
    );
  });

  const openAddDrawer = () => {
    setEditId(null);
    setError('');

    // Seed default forms based on active tab
    if (activeTab === 'company') {
      setFormData({ id: `COMP-${Date.now()}`, code: '', name: '', gstNo: '', address: '', contact: '' });
    } else if (activeTab === 'warehouses') {
      setFormData({ id: `WH-${Date.now()}`, name: '', code: '', location: '', type: 'Cold Storage', capacity: 1000 });
    } else if (activeTab === 'customers') {
      setFormData({ id: `C-${Date.now()}`, code: '', name: '', gstNo: '', contact: '', email: '', address: '', city: '' });
    } else if (activeTab === 'vendors') {
      setFormData({ id: `V-${Date.now()}`, code: '', name: '', gstNo: '', contact: '', email: '', city: '' });
    } else if (activeTab === 'products') {
      setFormData({ id: `P-${Date.now()}`, code: '', description: '', category: 'Fruits', uom: 'Box (10kg)', tempRequired: '2-4°C', shelfLifeDays: 14, minQty: 50 });
    } else if (activeTab === 'categories') {
      setFormData({ id: `CAT-${Date.now()}`, name: '', description: '' });
    } else if (activeTab === 'uoms') {
      setFormData({ id: `UOM-${Date.now()}`, code: '', description: '' });
    } else if (activeTab === 'locations') {
      setFormData({ id: `LOC-${Date.now()}`, code: '', warehouseId: context.warehouses[0]?.id || '', rack: '', shelf: '', bin: '', type: 'Cold Storage', status: 'Available', tempZone: '2-4°C' });
    } else if (activeTab === 'vehicles') {
      setFormData({ id: `VEH-${Date.now()}`, vehicleNo: '', type: 'FTL Refrigerated', capacity: 1200, transporter: '' });
    } else if (activeTab === 'drivers') {
      setFormData({ id: `DRV-${Date.now()}`, name: '', mobile: '', licenseNo: '' });
    } else if (activeTab === 'employees') {
      setFormData({ id: `EMP-${Date.now()}`, name: '', role: 'Supervisor', department: 'Inbound Logistics', status: 'Active' });
    } else if (activeTab === 'users') {
      setFormData({ id: `USR-${Date.now()}`, username: '', password: '', role: 'Supervisor', department: 'Logistics', status: 'Active', permissions: ['dashboard', 'inbound', 'inventory'] });
    } else if (activeTab === 'barcodes') {
      setFormData({ id: `BC-${Date.now()}`, barcode: '', qrCode: '', sku: '', product: '' });
    } else if (activeTab === 'taxes') {
      setFormData({ id: `TAX-${Date.now()}`, name: '', cgst: 2.5, sgst: 2.5, igst: 5.0, gstPct: 5.0 });
    } else if (activeTab === 'reasons') {
      setFormData({ id: `RSN-${Date.now()}`, code: '', name: '' });
    }

    setDrawerOpen(true);
  };

  const openEditDrawer = (item) => {
    setEditId(item.id);
    setError('');
    setFormData({ ...item });
    setDrawerOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? Number(value) : value
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Precise duplicate validation per master type
    const isDuplicate = currentData.some(item => {
      if (item.id === editId) return false;

      switch (activeTab) {
        case 'company':
        case 'warehouses':
        case 'customers':
        case 'vendors':
        case 'products':
        case 'uoms':
        case 'locations':
        case 'reasons':
          return Boolean(
            formData.code &&
            item.code &&
            item.code.toString().trim().toLowerCase() === formData.code.toString().trim().toLowerCase()
          );

        case 'categories':
        case 'taxes':
          return Boolean(
            formData.name &&
            item.name &&
            item.name.toString().trim().toLowerCase() === formData.name.toString().trim().toLowerCase()
          );

        case 'vehicles':
          return Boolean(
            formData.vehicleNo &&
            item.vehicleNo &&
            item.vehicleNo.toString().trim().toUpperCase() === formData.vehicleNo.toString().trim().toUpperCase()
          );

        case 'users':
          return Boolean(
            formData.username &&
            item.username &&
            item.username.toString().trim().toLowerCase() === formData.username.toString().trim().toLowerCase()
          );

        case 'barcodes':
          return Boolean(
            formData.barcode &&
            item.barcode &&
            item.barcode.toString().trim() === formData.barcode.toString().trim()
          );

        case 'drivers':
          return Boolean(
            formData.licenseNo &&
            item.licenseNo &&
            item.licenseNo.toString().trim().toLowerCase() === formData.licenseNo.toString().trim().toLowerCase()
          );

        case 'employees':
          return Boolean(
            formData.name &&
            item.name &&
            item.name.toString().trim().toLowerCase() === formData.name.toString().trim().toLowerCase()
          );

        default:
          return false;
      }
    });

    if (isDuplicate) {
      setError('A record with this Code / Identification key already exists.');
      return;
    }

    if (editId) {
      context.updateMasterItem(
        currentTabInfo.key,
        currentTabInfo.setter,
        currentData,
        editId,
        formData,
        currentTabInfo.label
      );
    } else {
      context.addMasterItem(
        currentTabInfo.key,
        currentTabInfo.setter,
        currentData,
        formData,
        currentTabInfo.label
      );
    }

    setDrawerOpen(false);
  };

  const handleDeleteItem = (id) => {
    if (confirm('Are you sure you want to delete this master record?')) {
      context.deleteMasterItem(
        currentTabInfo.key,
        currentTabInfo.setter,
        currentData,
        id,
        currentTabInfo.label
      );
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6 animate-in fade-in-50 duration-200">

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">General Module</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Manage core infrastructure data, business partners, product SKUs, tax settings, and barcodes.</p>
        </div>

        <button
          onClick={openAddDrawer}
          className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg px-4 py-2 text-xs transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Master Record</span>
        </button>
      </div>

      {/* Sub tabs & Search bar Row */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">

        {/* Horizontal tabs list (Compact Badges / Chips style for 15 tabs) */}
        <div className="flex flex-wrap gap-1.5 w-full xl:w-auto -mb-px py-2 max-h-[120px] overflow-y-auto pr-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all border ${activeTab === tab.id
                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/50 shadow-xs'
                : 'bg-white dark:bg-[#0c0c0f] border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full xl:w-72 mb-2 self-end xl:self-center">
          <input
            type="text"
            placeholder={`Search ${currentTabInfo.label}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-sm"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex justify-between">
          <span>{currentTabInfo.label} Database List</span>
          <span>{filteredData.length} records found</span>
        </div>

        <div className="overflow-x-auto">
          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-xs">
              No matching master records found. Click "Add Master Record" to create one.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-100/50 dark:bg-zinc-900/20 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
                  <th className="p-3">Reference / Code</th>

                  {activeTab === 'company' && (
                    <>
                      <th className="p-3">Company Name</th>
                      <th className="p-3">GST Number</th>
                      <th className="p-3">Address</th>
                      <th className="p-3">Contact</th>
                    </>
                  )}
                  {activeTab === 'warehouses' && (
                    <>
                      <th className="p-3">Name</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Capacity</th>
                    </>
                  )}
                  {activeTab === 'customers' && (
                    <>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">GST Number</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">City</th>
                    </>
                  )}
                  {activeTab === 'vendors' && (
                    <>
                      <th className="p-3">Supplier Name</th>
                      <th className="p-3">GST Number</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">City</th>
                    </>
                  )}
                  {activeTab === 'products' && (
                    <>
                      <th className="p-3">Description</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">UOM</th>
                      <th className="p-3">Temp Rule</th>
                      <th className="p-3">Shelf Life</th>
                    </>
                  )}
                  {activeTab === 'categories' && (
                    <>
                      <th className="p-3">Category Name</th>
                      <th className="p-3">Description</th>
                    </>
                  )}
                  {activeTab === 'uoms' && (
                    <>
                      <th className="p-3">UOM Code</th>
                      <th className="p-3">Description</th>
                    </>
                  )}
                  {activeTab === 'locations' && (
                    <>
                      <th className="p-3">Zone / Rack Code</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Temp Zone</th>
                      <th className="p-3">Status</th>
                    </>
                  )}
                  {activeTab === 'vehicles' && (
                    <>
                      <th className="p-3">Vehicle Type</th>
                      <th className="p-3">Capacity (kg)</th>
                      <th className="p-3">Transporter</th>
                    </>
                  )}
                  {activeTab === 'drivers' && (
                    <>
                      <th className="p-3">Driver Name</th>
                      <th className="p-3">Mobile No.</th>
                      <th className="p-3">License No.</th>
                    </>
                  )}
                  {activeTab === 'employees' && (
                    <>
                      <th className="p-3">Employee Name</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Status</th>
                    </>
                  )}
                  {activeTab === 'users' && (
                    <>
                      <th className="p-3">Username</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Status</th>
                    </>
                  )}
                  {activeTab === 'barcodes' && (
                    <>
                      <th className="p-3">QR Code SKU</th>
                      <th className="p-3">SKU Link</th>
                      <th className="p-3">Product Link</th>
                    </>
                  )}
                  {activeTab === 'taxes' && (
                    <>
                      <th className="p-3">GST %</th>
                      <th className="p-3">CGST %</th>
                      <th className="p-3">SGST %</th>
                      <th className="p-3">IGST %</th>
                    </>
                  )}
                  {activeTab === 'reasons' && (
                    <>
                      <th className="p-3">Reason Description</th>
                    </>
                  )}

                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {filteredData.map(item => (
                  <tr key={item.id} className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-zinc-900 dark:text-zinc-50">
                      {item.code || item.vehicleNo || item.username || item.barcode || item.id}
                    </td>

                    {/* Company rendering */}
                    {activeTab === 'company' && (
                      <>
                        <td className="p-3 font-semibold">{item.name}</td>
                        <td className="p-3 font-mono">{item.gstNo}</td>
                        <td className="p-3">{item.address}</td>
                        <td className="p-3 font-mono">{item.contact}</td>
                      </>
                    )}

                    {/* Warehouse rendering */}
                    {activeTab === 'warehouses' && (
                      <>
                        <td className="p-3 font-semibold">{item.name}</td>
                        <td className="p-3">{item.location}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.type === 'Cold Storage' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' : 'bg-amber-50 dark:bg-amber-955/20 text-amber-600'}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="p-3 font-semibold font-mono">{item.capacity} Units</td>
                      </>
                    )}

                    {/* Customer rendering */}
                    {activeTab === 'customers' && (
                      <>
                        <td className="p-3 font-semibold">{item.name}</td>
                        <td className="p-3 font-mono">{item.gstNo || '24AAACT8902A1Z3'}</td>
                        <td className="p-3 font-mono">{item.contact}</td>
                        <td className="p-3">{item.email}</td>
                        <td className="p-3">{item.city}</td>
                      </>
                    )}

                    {/* Supplier rendering */}
                    {activeTab === 'vendors' && (
                      <>
                        <td className="p-3 font-semibold">{item.name}</td>
                        <td className="p-3 font-mono">{item.gstNo || '24AAAVN4321A1Z5'}</td>
                        <td className="p-3 font-mono">{item.contact}</td>
                        <td className="p-3">{item.email}</td>
                        <td className="p-3">{item.city}</td>
                      </>
                    )}

                    {/* Product rendering */}
                    {activeTab === 'products' && (
                      <>
                        <td className="p-3 font-semibold">{item.description}</td>
                        <td className="p-3">{item.category}</td>
                        <td className="p-3 font-mono">{item.uom}</td>
                        <td className="p-3">
                          <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                            {item.tempRequired}
                          </span>
                        </td>
                        <td className="p-3 font-semibold">{item.shelfLifeDays} Days</td>
                      </>
                    )}

                    {/* Category rendering */}
                    {activeTab === 'categories' && (
                      <>
                        <td className="p-3 font-semibold">{item.name}</td>
                        <td className="p-3">{item.description}</td>
                      </>
                    )}

                    {/* UOM rendering */}
                    {activeTab === 'uoms' && (
                      <>
                        <td className="p-3 font-semibold font-mono">{item.code}</td>
                        <td className="p-3">{item.description}</td>
                      </>
                    )}

                    {/* Location rendering */}
                    {activeTab === 'locations' && (
                      <>
                        <td className="p-3 font-semibold">{item.code}</td>
                        <td className="p-3">{item.type}</td>
                        <td className="p-3 font-mono">{item.tempZone}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'Available' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-955/20 text-rose-600'}`}>
                            {item.status}
                          </span>
                        </td>
                      </>
                    )}

                    {/* Vehicle rendering */}
                    {activeTab === 'vehicles' && (
                      <>
                        <td className="p-3">{item.type || 'FTL Refrigerated'}</td>
                        <td className="p-3 font-mono font-semibold">{item.capacity || 1200} kg</td>
                        <td className="p-3 font-semibold">{item.transporter || 'Gnosis Logistics'}</td>
                      </>
                    )}

                    {/* Driver rendering */}
                    {activeTab === 'drivers' && (
                      <>
                        <td className="p-3 font-semibold">{item.name}</td>
                        <td className="p-3 font-mono">{item.mobile}</td>
                        <td className="p-3 font-mono">{item.licenseNo}</td>
                      </>
                    )}

                    {/* Employee rendering */}
                    {activeTab === 'employees' && (
                      <>
                        <td className="p-3 font-semibold">{item.name}</td>
                        <td className="p-3">{item.role}</td>
                        <td className="p-3">{item.department}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">{item.status}</span>
                        </td>
                      </>
                    )}

                    {/* User rendering */}
                    {activeTab === 'users' && (
                      <>
                        <td className="p-3 font-semibold">{item.username}</td>
                        <td className="p-3 font-mono font-bold text-emerald-600">{item.role}</td>
                        <td className="p-3">{item.department || 'Warehouse Operations'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">{item.status}</span>
                        </td>
                      </>
                    )}

                    {/* Barcodes rendering */}
                    {activeTab === 'barcodes' && (
                      <>
                        <td className="p-3 font-mono">{item.qrCode}</td>
                        <td className="p-3 font-mono">{item.sku}</td>
                        <td className="p-3 font-semibold">{item.product}</td>
                      </>
                    )}

                    {/* Taxes rendering */}
                    {activeTab === 'taxes' && (
                      <>
                        <td className="p-3 font-mono font-bold">{item.gstPct}%</td>
                        <td className="p-3 font-mono">{item.cgst}%</td>
                        <td className="p-3 font-mono">{item.sgst}%</td>
                        <td className="p-3 font-mono">{item.igst}%</td>
                      </>
                    )}

                    {/* Reasons rendering */}
                    {activeTab === 'reasons' && (
                      <>
                        <td className="p-3 font-semibold">{item.name}</td>
                      </>
                    )}

                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEditDrawer(item)}
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded text-zinc-400 hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit/Add Record Centered Modal */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c0c0f] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-4 mb-4">
              <div>
                <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">
                  {editId ? 'Edit Master Record' : 'Add Master Record'}
                </h2>
                <span className="text-[11px] text-zinc-400">Manage {currentTabInfo.label} details.</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 text-rose-800 dark:text-rose-455 p-3 rounded-xl text-xs mb-4">
                {error}
              </div>
            )}

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto pr-1">
              <form onSubmit={handleFormSubmit} id="generalMasterForm" className="space-y-4">

                {/* Company Form */}
                {activeTab === 'company' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Company Code</label>
                      <input type="text" name="code" required value={formData.code || ''} onChange={handleFormChange} placeholder="e.g. GN-01" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Company Name</label>
                      <input type="text" name="name" required value={formData.name || ''} onChange={handleFormChange} placeholder="e.g. Gnosis Ventures" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">GST Number</label>
                      <input type="text" name="gstNo" required value={formData.gstNo || ''} onChange={handleFormChange} placeholder="e.g. 24AAAAS1234A1Z1" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Registered Address</label>
                      <input type="text" name="address" required value={formData.address || ''} onChange={handleFormChange} placeholder="Company headquarters" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Contact Phone</label>
                      <input type="text" name="contact" required value={formData.contact || ''} onChange={handleFormChange} placeholder="+91 99887 76655" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                    </div>
                  </>
                )}

                {/* Warehouse Form */}
                {activeTab === 'warehouses' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Warehouse Code</label>
                      <input type="text" name="code" required value={formData.code || ''} onChange={handleFormChange} placeholder="e.g. AMD-02" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Name</label>
                      <input type="text" name="name" required value={formData.name || ''} onChange={handleFormChange} placeholder="e.g. Ahmedabad Hub" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Location Details</label>
                      <input type="text" name="location" required value={formData.location || ''} onChange={handleFormChange} placeholder="Address detail" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Storage Type</label>
                        <select name="type" value={formData.type || 'Cold Storage'} onChange={handleFormChange} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs">
                          <option>Cold Storage</option>
                          <option>Dry Storage</option>
                          <option>Hybrid</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Capacity (Units)</label>
                        <input type="number" name="capacity" required value={formData.capacity || 0} onChange={handleFormChange} className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                      </div>
                    </div>
                  </>
                )}

                {/* Customer Form */}
                {activeTab === 'customers' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Customer Code</label>
                      <input type="text" name="code" required value={formData.code || ''} onChange={handleFormChange} placeholder="e.g. CUST-HYP-04" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Customer Name</label>
                      <input type="text" name="name" required value={formData.name || ''} onChange={handleFormChange} placeholder="e.g. Star Hypermarket" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Contact Phone</label>
                        <input type="text" name="contact" required value={formData.contact || ''} onChange={handleFormChange} placeholder="Phone number" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">City</label>
                        <input type="text" name="city" required value={formData.city || ''} onChange={handleFormChange} placeholder="e.g. Ahmedabad" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Delivery Address</label>
                      <input type="text" name="address" required value={formData.address || ''} onChange={handleFormChange} placeholder="Store shipping address" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Email Address</label>
                      <input type="email" name="email" required value={formData.email || ''} onChange={handleFormChange} placeholder="email@address.com" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                    </div>
                  </>
                )}

                {/* Supplier / Vendor Form */}
                {activeTab === 'vendors' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Supplier Code</label>
                      <input type="text" name="code" required value={formData.code || ''} onChange={handleFormChange} placeholder="e.g. VND-OMS-02" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Supplier Name</label>
                      <input type="text" name="name" required value={formData.name || ''} onChange={handleFormChange} placeholder="e.g. Om Sai Farms" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Contact Phone</label>
                        <input type="text" name="contact" required value={formData.contact || ''} onChange={handleFormChange} placeholder="Phone number" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">City</label>
                        <input type="text" name="city" required value={formData.city || ''} onChange={handleFormChange} placeholder="e.g. Nagpur" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Email Address</label>
                      <input type="email" name="email" required value={formData.email || ''} onChange={handleFormChange} placeholder="email@address.com" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                    </div>
                  </>
                )}

                {/* Product Form */}
                {activeTab === 'products' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Product Code</label>
                      <input type="text" name="code" required value={formData.code || ''} onChange={handleFormChange} placeholder="e.g. PROD-APP-01" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Description</label>
                      <input type="text" name="description" required value={formData.description || ''} onChange={handleFormChange} placeholder="e.g. Fuji Apples" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Category</label>
                        <select name="category" value={formData.category || 'Fruits'} onChange={handleFormChange} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs">
                          <option>Fruits</option>
                          <option>Vegetables</option>
                          <option>Leafy Greens</option>
                          <option>Berries</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">UOM</label>
                        <input type="text" name="uom" required value={formData.uom || ''} onChange={handleFormChange} placeholder="e.g. Box (10kg)" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />

                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Temp Required</label>
                        <input type="text" name="tempRequired" required value={formData.tempRequired || ''} onChange={handleFormChange} placeholder="e.g. 2-4°C" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Shelf Life (Days)</label>
                        <input type="number" name="shelfLifeDays" required value={formData.shelfLifeDays || 0} onChange={handleFormChange} className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Min Alert Qty</label>
                        <input type="number" name="minQty" required value={formData.minQty || 0} onChange={handleFormChange} className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                      </div>
                    </div>
                  </>
                )}

                {/* Categories Form */}
                {activeTab === 'categories' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Category Name</label>
                      <input type="text" name="name" required value={formData.name || ''} onChange={handleFormChange} placeholder="e.g. Leafy Greens" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Description</label>
                      <input type="text" name="description" required value={formData.description || ''} onChange={handleFormChange} placeholder="Fresh herbs and spinach greens" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                    </div>
                  </>
                )}

                {/* UOM Form */}
                {activeTab === 'uoms' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">UOM Code</label>
                      <input type="text" name="code" required value={formData.code || ''} onChange={handleFormChange} placeholder="e.g. Crate" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">UOM Description</label>
                      <input type="text" name="description" required value={formData.description || ''} onChange={handleFormChange} placeholder="20kg plastic returnable container" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                    </div>
                  </>
                )}

                {/* Locations Form */}
                {activeTab === 'locations' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Location / Bin Code</label>
                      <input type="text" name="code" required value={formData.code || ''} onChange={handleFormChange} placeholder="e.g. A-01-02" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Warehouse</label>
                        <select name="warehouseId" value={formData.warehouseId || ''} onChange={handleFormChange} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs">
                          {context.warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Temp Zone</label>
                        <input type="text" name="tempZone" required value={formData.tempZone || ''} onChange={handleFormChange} placeholder="e.g. 2-4°C" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Rack</label>
                        <input type="text" name="rack" required value={formData.rack || ''} onChange={handleFormChange} placeholder="e.g. A" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Shelf</label>
                        <input type="text" name="shelf" required value={formData.shelf || ''} onChange={handleFormChange} placeholder="e.g. 01" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Bin</label>
                        <input type="text" name="bin" required value={formData.bin || ''} onChange={handleFormChange} placeholder="e.g. 02" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Type</label>
                        <select name="type" value={formData.type || 'Cold Storage'} onChange={handleFormChange} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs">
                          <option>Cold Storage</option>
                          <option>Ambient</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Lock Status</label>
                        <select name="status" value={formData.status || 'Available'} onChange={handleFormChange} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs">
                          <option>Available</option>
                          <option>Locked</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Vehicle Form */}
                {activeTab === 'vehicles' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Vehicle Plate Number</label>
                      <input type="text" name="vehicleNo" required value={formData.vehicleNo || ''} onChange={handleFormChange} placeholder="e.g. GJ10TZ1234" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Type</label>
                        <input type="text" name="type" required value={formData.type || ''} onChange={handleFormChange} placeholder="e.g. 10 Tonne Reef" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Capacity (kg)</label>
                        <input type="number" name="capacity" required value={formData.capacity || 0} onChange={handleFormChange} placeholder="e.g. 1200" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-805 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Transporter</label>
                      <input type="text" name="transporter" required value={formData.transporter || ''} onChange={handleFormChange} placeholder="Freight agency name" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                  </>
                )}

                {/* Driver Form */}
                {activeTab === 'drivers' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Driver Name</label>
                      <input type="text" name="name" required value={formData.name || ''} onChange={handleFormChange} placeholder="Ramesh Kumar" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Mobile No.</label>
                      <input type="text" name="mobile" required value={formData.mobile || ''} onChange={handleFormChange} placeholder="+91 99887 76655" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-805 rounded-lg p-2 text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">License Number</label>
                      <input type="text" name="licenseNo" required value={formData.licenseNo || ''} onChange={handleFormChange} placeholder="DL-GJ10-202100456" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                    </div>
                  </>
                )}

                {/* Employee Form */}
                {activeTab === 'employees' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Employee Name</label>
                      <input type="text" name="name" required value={formData.name || ''} onChange={handleFormChange} placeholder="Aarav Patel" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Role</label>
                        <select name="role" value={formData.role || 'Supervisor'} onChange={handleFormChange} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs">
                          <option>Supervisor</option>
                          <option>GRN Operator</option>
                          <option>Picker/Packer</option>
                          <option>Quality Control</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Department</label>
                        <select name="department" value={formData.department || 'Inbound Logistics'} onChange={handleFormChange} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs">
                          <option>Inbound Logistics</option>
                          <option>Outbound Dispatch</option>
                          <option>Quality Audits</option>
                          <option>Storage Control</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Status</label>
                      <select name="status" value={formData.status || 'Active'} onChange={handleFormChange} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs">
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                  </>
                )}

                {/* User & Role Form */}
                {activeTab === 'users' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Username</label>
                      <input type="text" name="username" required value={formData.username || ''} onChange={handleFormChange} placeholder="operator_user" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    {!editId && (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Password</label>
                        <input type="password" name="password" required value={formData.password || ''} onChange={handleFormChange} placeholder="••••••••" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Role / Profile</label>
                        <select name="role" value={formData.role || 'Supervisor'} onChange={handleFormChange} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs">
                          <option>Admin</option>
                          <option>Warehouse Manager</option>
                          <option>Supervisor</option>
                          <option>GRN Operator</option>
                          <option>Quality Control</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Status</label>
                        <select name="status" value={formData.status || 'Active'} onChange={handleFormChange} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs">
                          <option>Active</option>
                          <option>Suspended</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Barcodes Form */}
                {activeTab === 'barcodes' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Barcode String (EAN-13)</label>
                      <input type="text" name="barcode" required value={formData.barcode || ''} onChange={handleFormChange} placeholder="e.g. 8901234567890" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">QR Code Data String</label>
                      <input type="text" name="qrCode" required value={formData.qrCode || ''} onChange={handleFormChange} placeholder="QR-APP-0801" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-805 rounded-lg p-2 text-xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">SKU Reference</label>
                        <select name="sku" value={formData.sku || ''} onChange={handleFormChange} className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs">
                          <option value="">-- Choose SKU --</option>
                          {context.products.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">Product Description</label>
                        <input type="text" name="product" required value={formData.product || ''} onChange={handleFormChange} placeholder="e.g. Gala Apples" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                      </div>
                    </div>
                  </>
                )}

                {/* Tax Form */}
                {activeTab === 'taxes' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Tax Code Name</label>
                      <input type="text" name="name" required value={formData.name || ''} onChange={handleFormChange} placeholder="e.g. GST 5%" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">CGST %</label>
                        <input type="number" step="0.1" name="cgst" required value={formData.cgst || 0} onChange={handleFormChange} className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">SGST %</label>
                        <input type="number" step="0.1" name="sgst" required value={formData.sgst || 0} onChange={handleFormChange} className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 mb-1">IGST %</label>
                        <input type="number" step="0.1" name="igst" required value={formData.igst || 0} onChange={handleFormChange} className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Aggregate GST %</label>
                      <input type="number" step="0.1" name="gstPct" required value={formData.gstPct || 0} onChange={handleFormChange} className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs" />
                    </div>
                  </>
                )}

                {/* Reason Form */}
                {activeTab === 'reasons' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Reason Code</label>
                      <input type="text" name="code" required value={formData.code || ''} onChange={handleFormChange} placeholder="e.g. DMG" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 mb-1">Reason Description</label>
                      <input type="text" name="name" required value={formData.name || ''} onChange={handleFormChange} placeholder="Damaged packaging or crates" className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500" />
                    </div>
                  </>
                )}

              </form>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-zinc-150 dark:border-zinc-800 pt-4 mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-1/3 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl py-2.5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="generalMasterForm"
                className="w-2/3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-2.5 transition-colors shadow-sm active:scale-[0.98]"
              >
                {editId ? 'Update Master Record' : 'Save Master Record'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
