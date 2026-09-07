import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Settings,
  Building2,
  MapPin,
  Truck,
  Calendar,
  Layers,
  DollarSign,
  Box,
  Thermometer,
  ShieldCheck,
  ChevronRight,
  Check
} from 'lucide-react';

export default function NewSalesOrderModal({
  isOpen,
  onClose,
  onSubmit,
  editOrder = null,
  customers = [],
  products = [],
  warehouses = [],
  inventory = []
}) {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'products'

  // Card 1: Customer Information
  const [customerType, setCustomerType] = useState('existing'); // 'existing' | 'new'
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Card 2: Billing Address
  const [billingContactName, setBillingContactName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('Gujarat');
  const [billingCountry, setBillingCountry] = useState('India');
  const [billingPincode, setBillingPincode] = useState('380007');
  const [gstNo, setGstNo] = useState('');

  // Card 3: Shipping Address
  const [shippingContactName, setShippingContactName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCityStatePin, setShippingCityStatePin] = useState('Ahmedabad, Gujarat - 380007');
  const [shippingPhone, setShippingPhone] = useState('');
  const [billingLocation, setBillingLocation] = useState('Jamnagar Main Hub');
  const [area, setArea] = useState('ANIMAL KITCHEN');

  // Card 4: Order Details
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesDeliveryNo, setSalesDeliveryNo] = useState(() => `${Math.floor(1000000000 + Math.random() * 9000000000)}`);
  const [orderBookingType, setOrderBookingType] = useState('Sales Delivery Order');
  const [orderType, setOrderType] = useState('Dispatch & Purchase Order');
  const [orderPriority, setOrderPriority] = useState('Normal');
  const [remarks, setRemarks] = useState('');

  // Tab 2: Single-line SKU Form State (Top Entry Row)
  const [selectedProductCode, setSelectedProductCode] = useState('');
  const [requiredQtyInput, setRequiredQtyInput] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);

  // Tab 2: Added Order Product Summary List
  const [addedProducts, setAddedProducts] = useState([]);

  // Errors / validation message
  const [formError, setFormError] = useState('');
  const [tab2Message, setTab2Message] = useState('');

  // Calculate live inventory available for any given product ID or code
  const getProductAvailableQty = (prod) => {
    if (!prod) return 0;
    if (inventory && inventory.length > 0) {
      const matched = inventory.filter(inv => inv.productId === prod.id || inv.sku === prod.code);
      if (matched.length > 0) {
        return matched.reduce((s, it) => s + (Number(it.currentQty) || Number(it.qty) || 0), 0);
      }
    }
    // Fallback baseline for demo realism
    return prod.code === 'G256' ? 1250 : prod.code === 'P-002' ? 680 : prod.code === 'P-003' ? 420 : 500;
  };

  // Find currently selected product object from the top dropdown
  const currentProductObj = useMemo(() => {
    return products.find(p => p.code === selectedProductCode || p.id === selectedProductCode) || null;
  }, [selectedProductCode, products]);

  // Set default / initial customer and sample items when opened or when editOrder changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('details');
      setFormError('');
      setTab2Message('');
      setEditingIndex(null);
      setSelectedProductCode('');
      setRequiredQtyInput('');

      if (editOrder) {
        // Populate form from existing Sales Order
        setSelectedCustomerId(editOrder.customerId || '');
        setCustomerCode(editOrder.customerCode || '');
        setCustomerName(editOrder.customerName || '');
        setEmail(editOrder.email || '');
        setPhone(editOrder.phone || '');
        setGstNo(editOrder.gstNo || '');

        // Billing Address
        setBillingContactName(editOrder.billingDetails?.contactName || editOrder.customerName || '');
        setBillingAddress(editOrder.billingDetails?.address || '');
        setBillingCity(editOrder.billingDetails?.city || '');
        setBillingState(editOrder.billingDetails?.state || 'Gujarat');
        setBillingCountry(editOrder.billingDetails?.country || 'India');
        setBillingPincode(editOrder.billingDetails?.pincode || '380007');

        // Shipping Address
        setShippingContactName(editOrder.shippingDetails?.contactName || editOrder.customerName || '');
        setShippingAddress(editOrder.shippingDetails?.address || '');
        setShippingCityStatePin(editOrder.shippingDetails?.cityStatePin || 'Ahmedabad, Gujarat - 380007');
        setShippingPhone(editOrder.shippingDetails?.phone || editOrder.phone || '');
        setBillingLocation(editOrder.shippingDetails?.billingLocation || 'Jamnagar Main Hub');
        setArea(editOrder.shippingDetails?.area || 'ANIMAL KITCHEN');

        // Order Details
        setOrderDate(editOrder.date || new Date().toISOString().split('T')[0]);
        setSalesDeliveryNo(editOrder.salesDeliveryNo || editOrder.orderNo?.replace(/\D/g, '') || `${Math.floor(1000000000 + Math.random() * 9000000000)}`);
        setOrderBookingType(editOrder.orderBookingType || 'Sales Delivery Order');
        setOrderType(editOrder.orderType || 'Dispatch & Purchase Order');
        setOrderPriority(editOrder.priority || 'Normal');
        setRemarks(editOrder.remarks || '');

        // Items mapping
        if (editOrder.items && editOrder.items.length > 0) {
          const mapped = editOrder.items.map(it => {
            const prod = products.find(p => p.id === it.productId || p.code === it.productCode) || {};
            const avail = getProductAvailableQty(prod);
            const packingConfig = prod.category === 'Leafy Greens'
              ? 'Standard Ventilated Crate (10 KG)'
              : prod.category === 'Fruits'
              ? 'Export Grade Corrugated Crate (15 KG)'
              : 'Mesh Poly Bag (20 KG)';

            return {
              id: it.productId || prod.id,
              productId: it.productId || prod.id,
              productCode: it.productCode || prod.code || 'SKU',
              description: it.description || prod.description || 'Product Item',
              uom: it.uom || prod.uom || 'KG',
              packingConfig: it.packingConfig || packingConfig,
              availableQty: avail,
              requiredQty: Number(it.qty || it.requiredQty || 1),
              rate: Number(it.rate) || 45,
              targetArea: it.targetArea || editOrder.shippingDetails?.area || 'ANIMAL KITCHEN'
            };
          });
          setAddedProducts(mapped);
        } else {
          setAddedProducts([]);
        }
      } else {
        // Clean default creation state
        setSalesDeliveryNo(`${Math.floor(1000000000 + Math.random() * 9000000000)}`);
        setOrderDate(new Date().toISOString().split('T')[0]);
        setOrderPriority('Normal');
        setRemarks('');

        if (customers && customers.length > 0) {
          const defaultCust = customers[0];
          handleCustomerSelect(defaultCust.id);
        }

        // Default sample item if products available
        if (products && products.length > 0) {
          const p1 = products[0];
          setAddedProducts([
            {
              id: p1.id,
              productId: p1.id,
              productCode: p1.code || 'G256',
              description: p1.description || 'Cynodon Grass',
              uom: p1.uom || 'KG',
              packingConfig: 'Standard Ventilated Crate (10 KG)',
              availableQty: getProductAvailableQty(p1),
              requiredQty: 100,
              rate: 45,
              targetArea: 'ANIMAL KITCHEN'
            }
          ]);
        } else {
          setAddedProducts([]);
        }
      }
    }
  }, [isOpen, editOrder, customers, products]);

  // Handle Customer Selection & Auto-fill
  const handleCustomerSelect = (custId) => {
    setSelectedCustomerId(custId);
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      setCustomerCode(cust.code || 'VND-GNS-88');
      setCustomerName(cust.name || '');
      setEmail(cust.email || 'greens@rescuezoo.org');
      setPhone(cust.contact || cust.phone || '9687064462');
      setGstNo(cust.gstNo || 'AADTG8371P');

      // Billing Address
      setBillingContactName(cust.contactPerson || cust.name || 'Store In-Charge');
      setBillingAddress(cust.address || '"Vraj" Opp HDFC Bank, Beside Chandanbala Tower, Near Suvidha Shopping Centre, Paldi');
      setBillingCity(cust.city || 'Ahmedabad');
      setBillingState(cust.state || 'Gujarat');
      setBillingCountry(cust.country || 'India');
      setBillingPincode(cust.pincode || '380007');

      // Shipping Address
      setShippingContactName(cust.shippingContactPerson || cust.name || 'Animal Nutrition & Receiving Head');
      setShippingAddress(cust.deliveryAddress || cust.address || 'Greens Zoological, Rescue And Rehabilitation Centre Society, Paldi');
      setShippingCityStatePin(`${cust.city || 'Ahmedabad'}, ${cust.state || 'Gujarat'} - ${cust.pincode || '380007'}`);
      setShippingPhone(cust.contact || cust.phone || '9687064462');
    }
  };

  // Copy Billing Address to Shipping Address
  const handleCopyBillingToShipping = () => {
    setShippingContactName(billingContactName);
    setShippingAddress(billingAddress);
    setShippingCityStatePin(`${billingCity}, ${billingState} - ${billingPincode}`);
    setShippingPhone(phone);
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!customerName.trim()) {
      setFormError('Customer Name is required.');
      return false;
    }
    if (!billingAddress.trim()) {
      setFormError('Billing Address is required.');
      return false;
    }
    if (!shippingAddress.trim()) {
      setFormError('Shipping Address is required.');
      return false;
    }
    if (!orderDate) {
      setFormError('Order Date is required.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSaveAndContinue = () => {
    if (validateStep1()) {
      setActiveTab('products');
    }
  };

  // -------------------------------------------------------------
  // TAB 2 (Order Product) Actions: ADD, EDIT, DELETE
  // -------------------------------------------------------------
  const handleAddProductToSummary = () => {
    setTab2Message('');
    if (!currentProductObj) {
      setTab2Message('Please select a Product Code first.');
      return;
    }

    const qty = Number(requiredQtyInput);
    if (!qty || qty <= 0) {
      setTab2Message('Please enter a valid Required QTY greater than 0.');
      return;
    }

    const avail = getProductAvailableQty(currentProductObj);
    const packingConfig = currentProductObj.category === 'Leafy Greens'
      ? 'Standard Ventilated Crate (10 KG)'
      : currentProductObj.category === 'Fruits'
      ? 'Export Grade Corrugated Crate (15 KG)'
      : 'Mesh Poly Bag (20 KG)';

    if (editingIndex !== null) {
      // Update existing entry
      setAddedProducts(prev => prev.map((item, idx) => {
        if (idx === editingIndex) {
          return {
            ...item,
            productId: currentProductObj.id,
            productCode: currentProductObj.code || currentProductObj.id,
            description: currentProductObj.description,
            uom: currentProductObj.uom || 'KG',
            packingConfig,
            availableQty: avail,
            requiredQty: qty,
            rate: item.rate || 40,
            targetArea: area || 'ANIMAL KITCHEN'
          };
        }
        return item;
      }));
      setEditingIndex(null);
    } else {
      // Check if item already exists in summary, update it instead of duplicate
      const existingIdx = addedProducts.findIndex(p => p.productId === currentProductObj.id || p.productCode === currentProductObj.code);
      if (existingIdx >= 0) {
        setAddedProducts(prev => prev.map((item, idx) => {
          if (idx === existingIdx) {
            return {
              ...item,
              requiredQty: Number(item.requiredQty) + qty
            };
          }
          return item;
        }));
      } else {
        // Add new row
        const newItem = {
          id: currentProductObj.id,
          productId: currentProductObj.id,
          productCode: currentProductObj.code || currentProductObj.id,
          description: currentProductObj.description,
          uom: currentProductObj.uom || 'KG',
          packingConfig,
          availableQty: avail,
          requiredQty: qty,
          rate: 45,
          targetArea: area || 'ANIMAL KITCHEN'
        };
        setAddedProducts(prev => [...prev, newItem]);
      }
    }

    // Reset top entry row
    setSelectedProductCode('');
    setRequiredQtyInput('');
  };

  const handleEditProduct = (index) => {
    const item = addedProducts[index];
    if (item) {
      setSelectedProductCode(item.productCode || item.productId);
      setRequiredQtyInput(item.requiredQty.toString());
      setEditingIndex(index);
      setTab2Message('');
    }
  };

  const handleDeleteProduct = (index) => {
    setAddedProducts(prev => prev.filter((_, idx) => idx !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setSelectedProductCode('');
      setRequiredQtyInput('');
    }
  };

  // Calculations
  const totalRequiredUnits = addedProducts.reduce((sum, it) => sum + (Number(it.requiredQty) || 0), 0);
  const estimatedCrates = Math.ceil(totalRequiredUnits / 10);
  const totalValuation = addedProducts.reduce((sum, it) => {
    const qty = Number(it.requiredQty) || 0;
    const rate = Number(it.rate) || 45;
    return sum + (qty * rate);
  }, 0);

  // Final Form Submission
  const handleFinalSubmit = (e) => {
    if (e) e.preventDefault();

    if (!validateStep1()) {
      setActiveTab('details');
      return;
    }

    if (addedProducts.length === 0) {
      setTab2Message('Please add at least one product using the form above.');
      return;
    }

    const cleanItems = addedProducts.map(it => ({
      productId: it.productId,
      productCode: it.productCode,
      description: it.description,
      uom: it.uom,
      qty: Number(it.requiredQty),
      rate: Number(it.rate) || 45,
      targetArea: it.targetArea || area || 'ANIMAL KITCHEN'
    }));

    const isEdit = !!editOrder;
    const soPayload = {
      id: isEdit ? editOrder.id : `SO-${Date.now()}`,
      orderNo: isEdit ? editOrder.orderNo : `SO-2026-${salesDeliveryNo.substring(salesDeliveryNo.length - 4)}`,
      salesDeliveryNo,
      orderBookingType,
      orderType,
      customerId: selectedCustomerId || (customers[0] && customers[0].id),
      customerName,
      customerCode,
      email,
      phone,
      gstNo,
      billingDetails: {
        contactName: billingContactName,
        address: billingAddress,
        city: billingCity,
        state: billingState,
        country: billingCountry,
        pincode: billingPincode
      },
      shippingDetails: {
        contactName: shippingContactName,
        address: shippingAddress,
        cityStatePin: shippingCityStatePin,
        phone: shippingPhone,
        billingLocation,
        area
      },
      date: orderDate,
      priority: orderPriority,
      remarks,
      items: cleanItems,
      totalUnits: totalRequiredUnits,
      estimatedCrates,
      totalEstimatedValuation: totalValuation,
      status: isEdit ? (editOrder.status || 'New') : 'New',
      dispatchDetails: isEdit ? editOrder.dispatchDetails : undefined
    };

    onSubmit(soPayload, isEdit);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0c0c0f] text-zinc-900 dark:text-zinc-100 rounded-2xl max-w-6xl w-full p-4 sm:p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 relative max-h-[96vh] flex flex-col animate-in zoom-in-95 duration-200">

        {/* Top Header: Navigation Tabs + Back Button */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
          
          {/* Tabs: Order Details / Order Product */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`pb-2 text-sm font-extrabold transition-all relative ${
                activeTab === 'details'
                  ? 'text-[#065f46] dark:text-emerald-400 font-black'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              <span>Order Details</span>
              {activeTab === 'details' && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#065f46] dark:bg-emerald-400 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (validateStep1()) {
                  setActiveTab('products');
                }
              }}
              className={`pb-2 text-sm font-extrabold transition-all relative ${
                activeTab === 'products'
                  ? 'text-[#065f46] dark:text-emerald-400 font-black'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              <span>Order Product</span>
              {activeTab === 'products' && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#065f46] dark:bg-emerald-400 rounded-full" />
              )}
            </button>
          </div>

          {/* Right Action Icons (Edit Badge + Blue Back Arrow Button) */}
          <div className="flex items-center gap-3">
            {editOrder && (
              <span className="font-mono font-bold text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-lg">
                Editing: {editOrder.orderNo}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center"
              title="Back / Close"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {formError && activeTab === 'details' && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{formError}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto pr-1">

          {/* ========================================================= */}
          {/* TAB 1: ORDER DETAILS (4-CARD GRID) */}
          {/* ========================================================= */}
          {activeTab === 'details' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                {/* ---------------- CARD 1: CUSTOMER INFORMATION ---------------- */}
                <div className="border border-cyan-400/40 dark:border-cyan-500/30 rounded-xl overflow-hidden bg-white dark:bg-[#0c0c0f] shadow-xs flex flex-col">
                  {/* Cyan Header */}
                  <div className="bg-[#14b8a6] text-white px-3.5 py-2 font-bold text-xs uppercase tracking-wide flex items-center gap-2 shadow-xs">
                    <Settings className="h-3.5 w-3.5" />
                    <span>Customer Information</span>
                  </div>

                  <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                    {/* Customer Type Radio */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Customer Type <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-4 pt-0.5">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          <input
                            type="radio"
                            name="customerType"
                            value="existing"
                            checked={customerType === 'existing'}
                            onChange={() => setCustomerType('existing')}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Existing Customer</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          <input
                            type="radio"
                            name="customerType"
                            value="new"
                            checked={customerType === 'new'}
                            onChange={() => {
                              setCustomerType('new');
                              setSelectedCustomerId('');
                              setCustomerCode(`CUST-${Date.now().toString().slice(-4)}`);
                              setCustomerName('');
                              setEmail('');
                              setPhone('');
                            }}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>New Customer</span>
                        </label>
                      </div>
                    </div>

                    {/* Customer Code & Name Selector */}
                    {customerType === 'existing' ? (
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                          Cust. Code & Name <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={selectedCustomerId}
                          onChange={(e) => handleCustomerSelect(e.target.value)}
                          className="w-full bg-white dark:bg-[#0c0c0f] border border-emerald-500 rounded-lg p-2 text-xs text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.code || 'CUST'} - {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                          Customer Code <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={customerCode}
                          onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                          placeholder="e.g. VND-GNS-99"
                          className="w-full bg-transparent border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Customer Name */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Customer Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Customer Business / Account Name"
                        className="w-full bg-transparent border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none"
                      />
                    </div>

                    {/* E-mail */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="account@company.com"
                        className="w-full bg-transparent border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 99887 76655"
                        className="w-full bg-transparent border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                  </div>
                </div>

                {/* ---------------- CARD 2: BILLING ADDRESS ---------------- */}
                <div className="border border-rose-400/40 dark:border-rose-500/30 rounded-xl overflow-hidden bg-white dark:bg-[#0c0c0f] shadow-xs flex flex-col">
                  {/* Coral/Rose Header */}
                  <div className="bg-[#f43f5e] text-white px-3.5 py-2 font-bold text-xs uppercase tracking-wide flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <Settings className="h-3.5 w-3.5" />
                      <span>Billing Address</span>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                    
                    {/* Contact Person Name */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Contact Person Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={billingContactName}
                        onChange={(e) => setBillingContactName(e.target.value)}
                        placeholder="Representative / Incharge Name"
                        className="w-full bg-transparent border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        placeholder="Premises / Street / Tower / Landmark"
                        className="w-full bg-transparent border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        City <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={billingCity}
                        onChange={(e) => setBillingCity(e.target.value)}
                        placeholder="e.g. Ahmedabad / Jamnagar"
                        className="w-full bg-transparent border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    {/* State */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        State <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={billingState}
                        onChange={(e) => setBillingState(e.target.value)}
                        placeholder="e.g. Gujarat"
                        className="w-full bg-transparent border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    {/* Country */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Country <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={billingCountry}
                        onChange={(e) => setBillingCountry(e.target.value)}
                        placeholder="India"
                        className="w-full bg-transparent border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    {/* Pincode */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={billingPincode}
                        onChange={(e) => setBillingPincode(e.target.value)}
                        placeholder="e.g. 380007"
                        className="w-full bg-transparent border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                  </div>
                </div>

                {/* ---------------- CARD 3: SHIPPING ADDRESS ---------------- */}
                <div className="border border-orange-400/40 dark:border-orange-500/30 rounded-xl overflow-hidden bg-white dark:bg-[#0c0c0f] shadow-xs flex flex-col">
                  {/* Orange Header */}
                  <div className="bg-[#fb923c] text-white px-3.5 py-2 font-bold text-xs uppercase tracking-wide flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <Settings className="h-3.5 w-3.5" />
                      <span>Shipping Address</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyBillingToShipping}
                      className="text-[9px] bg-white/20 hover:bg-white/30 text-white font-bold px-2 py-0.5 rounded transition-colors"
                      title="Copy details from Billing Address"
                    >
                      Copy Billing
                    </button>
                  </div>

                  <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                    
                    {/* Contact Person Name */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Contact Person Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingContactName}
                        onChange={(e) => setShippingContactName(e.target.value)}
                        placeholder="Receiving Staff / Unit Head"
                        className="w-full bg-transparent border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Delivery Site / Gate / Building"
                        className="w-full bg-transparent border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    {/* City/State/Pincode */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        City/State/Pincode <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingCityStatePin}
                        onChange={(e) => setShippingCityStatePin(e.target.value)}
                        placeholder="e.g. Ahmedabad, Gujarat - 380007"
                        className="w-full bg-transparent border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={shippingPhone}
                        onChange={(e) => setShippingPhone(e.target.value)}
                        placeholder="+91 96870 64462"
                        className="w-full bg-transparent border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    {/* Billing Location */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        Billing Location
                      </label>
                      <select
                        value={billingLocation}
                        onChange={(e) => setBillingLocation(e.target.value)}
                        className="w-full bg-white dark:bg-[#0c0c0f] border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none font-medium"
                      >
                        <option value="Jamnagar Main Hub">Jamnagar Main Hub (WH-01)</option>
                        <option value="Ahmedabad Cold Facility">Ahmedabad Cold Facility (WH-02)</option>
                        <option value="Rajkot Dry Hub">Rajkot Dry Hub (WH-03)</option>
                      </select>
                    </div>

                    {/* Area */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        Area / Kitchen Section
                      </label>
                      <select
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full bg-white dark:bg-[#0c0c0f] border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none font-medium"
                      >
                        <option value="ANIMAL KITCHEN">ANIMAL KITCHEN</option>
                        <option value="Rheino Safari">Rheino Safari</option>
                        <option value="Bird Sanctuary Section">Bird Sanctuary Section</option>
                        <option value="Cold Store Prep Unit">Cold Store Prep Unit</option>
                        <option value="General Store">General Store</option>
                      </select>
                    </div>

                  </div>
                </div>

                {/* ---------------- CARD 4: ORDER DETAILS ---------------- */}
                <div className="border border-rose-400/40 dark:border-rose-500/30 rounded-xl overflow-hidden bg-white dark:bg-[#0c0c0f] shadow-xs flex flex-col">
                  {/* Red/Rose Header */}
                  <div className="bg-[#f43f5e] text-white px-3.5 py-2 font-bold text-xs uppercase tracking-wide flex items-center gap-2 shadow-xs">
                    <Settings className="h-3.5 w-3.5" />
                    <span>Order Details</span>
                  </div>

                  <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between text-xs">
                    
                    {/* Order Date */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        Order Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={orderDate}
                        onChange={(e) => setOrderDate(e.target.value)}
                        className="w-full bg-white dark:bg-[#0c0c0f] border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 font-mono font-semibold focus:outline-none"
                      />
                    </div>

                    {/* Sales Delivery No */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        Sales Delivery No. <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={salesDeliveryNo}
                        onChange={(e) => setSalesDeliveryNo(e.target.value)}
                        placeholder="e.g. 1787247951"
                        className="w-full bg-transparent border-b-2 border-emerald-500 p-1.5 text-xs font-mono font-black text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                    {/* Order Booking Type */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        Order Booking Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={orderBookingType}
                        onChange={(e) => setOrderBookingType(e.target.value)}
                        className="w-full bg-white dark:bg-[#0c0c0f] border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none font-medium"
                      >
                        <option value="Sales Delivery Order">Sales Delivery Order</option>
                        <option value="Direct Wholesale Dispatch">Direct Wholesale Dispatch</option>
                        <option value="Institutional Contract Order">Institutional Contract Order</option>
                        <option value="Sample / Trial QA Order">Sample / Trial QA Order</option>
                      </select>
                    </div>

                    {/* Order Type */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        Order Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value)}
                        className="w-full bg-white dark:bg-[#0c0c0f] border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none font-medium"
                      >
                        <option value="Dispatch & Purchase Order">Dispatch & Purchase Order</option>
                        <option value="Warehouse Direct Dispatch">Warehouse Direct Dispatch</option>
                        <option value="Cold Chain Transfer">Cold Chain Transfer</option>
                        <option value="Consignment Supply">Consignment Supply</option>
                      </select>
                    </div>

                    {/* Order Priority */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        Order priority <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={orderPriority}
                        onChange={(e) => setOrderPriority(e.target.value)}
                        className="w-full bg-white dark:bg-[#0c0c0f] border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none font-medium"
                      >
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent (Express Loading)</option>
                        <option value="Critical">Critical Emergency</option>
                      </select>
                    </div>

                    {/* Remarks */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Remarks
                      </label>
                      <input
                        type="text"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Optional remarks or notes"
                        className="w-full bg-transparent border-b-2 border-emerald-500 p-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>

                  </div>
                </div>

              </div>

              {/* Bottom Continue Action Bar */}
              <div className="flex justify-end pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={handleSaveAndContinue}
                  className="bg-[#138A72] hover:bg-[#0e6f5c] text-white font-extrabold text-xs uppercase tracking-wider px-8 py-2.5 rounded-lg transition-all shadow-md active:scale-98 flex items-center gap-2"
                >
                  <span>Save & Continue</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ORDER PRODUCT (EXACT MATCH TO REFERENCE SCREENSHOT) */}
          {/* ========================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Global Tab 2 Notification / Error */}
              {tab2Message && (
                <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-400 p-2.5 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span className="font-semibold">{tab2Message}</span>
                </div>
              )}

              {/* ---------------- TOP FORM: SINGLE-LINE PRODUCT INPUT ---------------- */}
              <div className="border-t border-b border-zinc-200 dark:border-zinc-800 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
                  
                  {/* 1. Product Code */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#10b981] dark:text-emerald-400">
                      Product Code
                    </label>
                    <div className="relative">
                      <select
                        value={selectedProductCode}
                        onChange={(e) => {
                          setSelectedProductCode(e.target.value);
                          setTab2Message('');
                        }}
                        className="w-full bg-white dark:bg-[#0c0c0f] border border-[#10b981] rounded-none p-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                      >
                        <option value="">Please Select</option>
                        {products.map(p => (
                          <option key={p.id} value={p.code || p.id}>
                            {p.code || p.id} - {p.description}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 2. Product Description (Auto-populated with green underline) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Product Description
                    </label>
                    <div className="border-b-2 border-[#10b981] py-2 px-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 min-h-[34px] flex items-center truncate">
                      {currentProductObj ? currentProductObj.description : <span className="text-zinc-400 italic">--</span>}
                    </div>
                  </div>

                  {/* 3. UOM (Auto-populated with green underline) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      UOM
                    </label>
                    <div className="border-b-2 border-[#10b981] py-2 px-1 text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 min-h-[34px] flex items-center">
                      {currentProductObj ? currentProductObj.uom || 'KG' : <span className="text-zinc-400 italic">--</span>}
                    </div>
                  </div>

                  {/* 4. Available Qty (Auto-populated with green underline) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Available Qty
                    </label>
                    <div className="border-b-2 border-[#10b981] py-2 px-1 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 min-h-[34px] flex items-center">
                      {currentProductObj ? `${getProductAvailableQty(currentProductObj).toFixed(2)} ${currentProductObj.uom || 'KG'}` : <span className="text-zinc-400 italic">--</span>}
                    </div>
                  </div>

                  {/* 5. Required QTY (Input with green underline) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Required QTY <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={requiredQtyInput}
                        onChange={(e) => setRequiredQtyInput(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-transparent border-b-2 border-[#10b981] py-1.5 px-1 text-xs font-mono font-black text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>
                  </div>

                </div>

                {/* ADD Button (Right Aligned) */}
                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={handleAddProductToSummary}
                    className="bg-[#138A72] hover:bg-[#0e6f5c] text-white font-extrabold text-xs uppercase tracking-wider px-8 py-2 rounded transition-all shadow-sm active:scale-98 flex items-center gap-1.5"
                  >
                    {editingIndex !== null ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>UPDATE</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>ADD</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ---------------- BOTTOM SUMMARY CARD & TABLE ---------------- */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-none overflow-hidden shadow-xs">
                
                {/* Solid Green Title Banner */}
                <div className="bg-[#138A72] text-white py-2 px-4 text-center font-bold text-sm tracking-wide">
                  Added Order Product Summary
                </div>

                {/* Table with Slate Grey Header Bar */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#64748b] text-white font-bold text-[11px] uppercase tracking-wider">
                        <th className="py-2.5 px-3">Product Code</th>
                        <th className="py-2.5 px-3">Product Description</th>
                        <th className="py-2.5 px-3">Packing Configuration</th>
                        <th className="py-2.5 px-3 text-right">Available QTY</th>
                        <th className="py-2.5 px-3 text-right">Required QTY</th>
                        <th className="py-2.5 px-3 text-center w-20">EDIT</th>
                        <th className="py-2.5 px-3 text-center w-20">DELETE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                      {addedProducts.map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            {item.productCode}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200">
                            {item.description}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">
                            {item.packingConfig}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                            {Number(item.availableQty).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400">
                            {Number(item.requiredQty).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleEditProduct(idx)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline uppercase inline-flex items-center gap-1"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>Edit</span>
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(idx)}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 dark:text-rose-400 hover:underline uppercase inline-flex items-center gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}

                      {addedProducts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-zinc-400 italic">
                            Please select a product and click ADD above to populate order items.
                          </td>
                        </tr>
                      )}
                    </tbody>

                    {addedProducts.length > 0 && (
                      <tfoot>
                        <tr className="bg-zinc-50 dark:bg-zinc-900 border-t-2 border-zinc-200 dark:border-zinc-800 font-bold text-xs">
                          <td colSpan={4} className="py-2.5 px-3 text-right text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                            Total Quantity Requested:
                          </td>
                          <td className="py-2.5 px-3 text-right font-black font-mono text-emerald-700 dark:text-emerald-400">
                            {totalRequiredUnits.toFixed(2)} KG
                          </td>
                          <td colSpan={2} className="py-2.5 px-3 text-zinc-500 text-[10px]">
                            ({estimatedCrates} Crates)
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* ---------------- BOTTOM ACTIONS: BACK & SUBMIT ---------------- */}
              <div className="flex justify-between items-center pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className="text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold px-4 py-2 rounded transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Order Details</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="bg-[#138A72] hover:bg-[#0e6f5c] text-white font-extrabold text-xs uppercase tracking-wider px-10 py-2.5 rounded transition-all shadow-md active:scale-98 flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{editOrder ? 'SAVE CHANGES' : 'SUBMIT'}</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
