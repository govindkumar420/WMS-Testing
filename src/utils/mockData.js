// Default Relational Seed Data for the Fruit & Vegetables WMS

export const defaultUsers = [
  {
    username: 'admin',
    password: 'Admin@123',
    name: 'Govind Kumar',
    role: 'Admin',
    status: 'Active',
    permissions: ['dashboard', 'masters', 'inbound', 'outbound', 'inventory', 'coldchain', 'reports', 'security']
  },
  {
    username: 'manager',
    password: 'Manager@123',
    name: 'Anjali Sharma',
    role: 'Warehouse Manager',
    status: 'Active',
    permissions: ['dashboard', 'masters', 'inbound', 'outbound', 'inventory', 'coldchain', 'reports']
  },
  {
    username: 'supervisor',
    password: 'Supervisor@123',
    name: 'Rajesh Patel',
    role: 'Supervisor',
    status: 'Active',
    permissions: ['dashboard', 'inbound', 'outbound', 'inventory', 'coldchain', 'reports']
  },
  {
    username: 'operator',
    password: 'Operator@123',
    name: 'Amit Mehta',
    role: 'GRN Operator',
    status: 'Active',
    permissions: ['dashboard', 'inbound']
  },
  {
    username: 'qc_inspector',
    password: 'Qc@123',
    name: 'Dr. Vivek Joshi',
    role: 'Quality Control',
    status: 'Active',
    permissions: ['dashboard', 'inbound', 'coldchain']
  },
  {
    username: 'picker',
    password: 'Picker@123',
    name: 'Suresh Kumar',
    role: 'Picker/Packer',
    status: 'Active',
    permissions: ['outbound', 'inventory']
  },
  {
    username: 'dispatch_clerk',
    password: 'Dispatch@123',
    name: 'Vikram Singh',
    role: 'Dispatch',
    status: 'Active',
    permissions: ['dashboard', 'outbound']
  }
];

export const defaultWarehouses = [
  { id: 'WH-01', name: 'Jamnagar Main Hub', code: 'JMN-01', location: 'Jamnagar GIDC, Gujarat', type: 'Hybrid', capacity: 1500 },
  { id: 'WH-02', name: 'Ahmedabad Cold Facility', code: 'AMD-02', location: 'Sarkhej, Ahmedabad', type: 'Cold Storage', capacity: 800 },
  { id: 'WH-03', name: 'Rajkot Dry Hub', code: 'RJT-03', location: 'Metoda GIDC, Rajkot', type: 'Dry Storage', capacity: 1000 }
];

export const defaultLocations = [
  // WH-01 Locations
  { id: 'LOC-01', code: 'A-01-01', warehouseId: 'WH-01', rack: 'A', shelf: '01', bin: '01', type: 'Cold Storage', status: 'Available', tempZone: '2-4°C' },
  { id: 'LOC-02', code: 'A-01-02', warehouseId: 'WH-01', rack: 'A', shelf: '01', bin: '02', type: 'Cold Storage', status: 'Available', tempZone: '2-4°C' },
  { id: 'LOC-03', code: 'A-02-01', warehouseId: 'WH-01', rack: 'A', shelf: '02', bin: '01', type: 'Cold Storage', status: 'Available', tempZone: '2-4°C' },
  { id: 'LOC-04', code: 'A-02-02', warehouseId: 'WH-01', rack: 'A', shelf: '02', bin: '02', type: 'Cold Storage', status: 'Locked', tempZone: '2-4°C' },

  { id: 'LOC-05', code: 'B-01-01', warehouseId: 'WH-01', rack: 'B', shelf: '01', bin: '01', type: 'Ambient', status: 'Available', tempZone: '15-20°C' },
  { id: 'LOC-06', code: 'B-01-02', warehouseId: 'WH-01', rack: 'B', shelf: '01', bin: '02', type: 'Ambient', status: 'Available', tempZone: '15-20°C' },
  { id: 'LOC-07', code: 'B-02-01', warehouseId: 'WH-01', rack: 'B', shelf: '02', bin: '01', type: 'Ambient', status: 'Available', tempZone: '15-20°C' },

  // WH-02 Locations
  { id: 'LOC-08', code: 'C-01-01', warehouseId: 'WH-02', rack: 'C', shelf: '01', bin: '01', type: 'Cold Storage', status: 'Available', tempZone: '0-2°C' },
  { id: 'LOC-09', code: 'C-01-02', warehouseId: 'WH-02', rack: 'C', shelf: '01', bin: '02', type: 'Cold Storage', status: 'Available', tempZone: '0-2°C' },

  // WH-03 Locations
  { id: 'LOC-10', code: 'D-01-01', warehouseId: 'WH-03', rack: 'D', shelf: '01', bin: '01', type: 'Ambient', status: 'Available', tempZone: 'Ambient' },
  { id: 'LOC-11', code: 'D-01-02', warehouseId: 'WH-03', rack: 'D', shelf: '01', bin: '02', type: 'Ambient', status: 'Available', tempZone: 'Ambient' }
];

export const defaultProducts = [
  { id: 'P-001', code: 'G256', description: 'Cynodon Grass', category: 'Leafy Greens', uom: 'KG', tempRequired: '2-4°C', shelfLifeDays: 14, minQty: 100 },
  { id: 'P-002', code: 'P-002', description: 'Green Peas Fresh', category: 'Vegetables', uom: 'KG', tempRequired: '2-4°C', shelfLifeDays: 20, minQty: 40 },
  { id: 'P-003', code: 'P-003', description: 'Dragon Fruits', category: 'Fruits', uom: 'KG', tempRequired: '4-8°C', shelfLifeDays: 25, minQty: 50 },
  { id: 'P-004', code: 'PROD-APP-01', description: 'Fresh Shimla Apples', category: 'Fruits', uom: 'KG', tempRequired: '2-4°C', shelfLifeDays: 45, minQty: 50 },
  { id: 'P-005', code: 'PROD-ORG-02', description: 'Nagpur Oranges', category: 'Fruits', uom: 'KG', tempRequired: '4-8°C', shelfLifeDays: 30, minQty: 40 },
  { id: 'P-006', code: 'PROD-BAN-03', description: 'Cavendish Bananas', category: 'Fruits', uom: 'KG', tempRequired: '13-15°C', shelfLifeDays: 10, minQty: 60 },
  { id: 'P-007', code: 'PROD-POT-04', description: 'Organic Potatoes', category: 'Vegetables', uom: 'KG', tempRequired: '12-15°C', shelfLifeDays: 90, minQty: 100 },
  { id: 'P-008', code: 'PROD-STR-08', description: 'Fresh Strawberries', category: 'Berries', uom: 'KG', tempRequired: '0-2°C', shelfLifeDays: 5, minQty: 15 }
];

export const defaultVendors = [
  { id: 'V-001', code: 'VND-GNS-01', name: 'Gnosis Agri Distributors', contact: '9876543210', email: 'gnosis@agri.com', city: 'Nashik' },
  { id: 'V-002', code: 'VND-OMSAI', name: 'Om Sai Ram Fruit Centre', contact: '8765432109', email: 'omsai@fruits.com', city: 'Nagpur' },
  { id: 'V-003', code: 'VND-VEGOTIC', name: 'Vegotic Agro Farms', contact: '7654321098', email: 'vegotic@agro.com', city: 'Pune' }
];

export const defaultCustomers = [
  {
    id: 'C-001',
    code: 'VND-GNS-88',
    name: 'Greens Zoological, Rescue And Rehabilitation Centre Society',
    contact: '9687064462',
    email: 'greens@rescuezoo.org',
    gstNo: 'AADTG8371P',
    address: '"Vraj" Opp HDFC Bank, Beside Chandanbala Tower,\nNear Suvidha Shopping Centre, Paldi, Ahmedabad',
    deliveryAddress: 'Greens Zoological, Rescue And Rehabilitation Centre Society,\n"Vraj" Opp HDFC Bank, Beside Chandanbala Tower,\nNear Suvidha Shopping Centre, Paldi, Ahmedabad\nAhmedabad, Gujarat, India, Pincode-380007',
    city: 'Ahmedabad'
  },
  {
    id: 'C-002',
    code: 'CUST-RETAIL-01',
    name: 'Radhe Enterprise Retail',
    contact: '9988776655',
    email: 'radhe@retail.com',
    gstNo: '24ABCDE1234F1Z5',
    address: 'Bedi Port Road, Jamnagar',
    deliveryAddress: 'Bedi Port Road, Jamnagar, Gujarat - 361001',
    city: 'Jamnagar'
  },
  {
    id: 'C-003',
    code: 'CUST-HYPER-02',
    name: 'Star Hypermarket Ltd',
    contact: '8877665544',
    email: 'procurement@star.com',
    gstNo: '24STARK9876L1Z9',
    address: 'S.G. Highway, Ahmedabad',
    deliveryAddress: 'Star Mall, S.G. Highway, Ahmedabad - 380054',
    city: 'Ahmedabad'
  }
];

export const defaultVehicles = [
  {
    id: 'VEH-01',
    vehicleNo: 'GJ01MT9901',
    driverName: 'Ramesh Singh',
    transporter: 'Gnosis Logistics',
    gatepassNo: 'GP-2026-000101',
    processType: 'Inbound',
    bookingType: 'PO Material',
    bookingRefDocNo: 'PO-2026-001',
    inDateTime: '2026-08-05 08:30:00',
    outDateTime: '2026-08-05 11:20:00',
    inKmReading: 124500,
    outKmReading: 124535,
    status: 'Closed',
    remark: 'Unloaded successfully, normal temperature maintained',
    tempLog: [3.2, 3.4, 3.1]
  },
  {
    id: 'VEH-02',
    vehicleNo: 'GJ10TZ1054',
    driverName: 'Yogesh Patel',
    transporter: 'Gnosis Trans',
    gatepassNo: 'GP-2026-000102',
    processType: 'Inbound',
    bookingType: 'PO Material',
    bookingRefDocNo: 'PO-2026-002',
    inDateTime: '2026-08-05 14:15:00',
    outDateTime: '',
    inKmReading: 48512,
    outKmReading: '',
    status: 'QC Approved', // Gate Entry -> Unloading -> QC -> Putaway -> Gate Out
    remark: 'Waiting for putaway execution',
    tempLog: [4.1, 4.3]
  },
  {
    id: 'VEH-03',
    vehicleNo: 'GJ03AZ8008',
    driverName: 'Nilesh Bhai',
    transporter: 'Self Transport',
    gatepassNo: 'GP-2026-000103',
    processType: 'Inbound',
    bookingType: 'PO Material',
    bookingRefDocNo: 'PO-2026-003',
    inDateTime: '2026-08-06 00:45:00',
    outDateTime: '',
    inKmReading: 95400,
    outKmReading: '',
    status: 'Unload Pending',
    remark: 'Truck in bay 2, waiting shift start',
    tempLog: [1.8]
  },
  {
    id: 'VEH-04',
    vehicleNo: 'GJ10TW2815',
    driverName: 'Jignesh Rawal',
    transporter: 'Gnosis Logistics',
    gatepassNo: 'GP-2026-000104',
    processType: 'Outbound',
    bookingType: 'Sales Dispatch',
    bookingRefDocNo: 'SO-2026-002',
    inDateTime: '2026-08-06 01:00:00',
    outDateTime: '',
    inKmReading: 12890,
    outKmReading: '',
    status: 'Loading',
    remark: 'Picking checklist is in wave, loading starts soon',
    tempLog: [3.5]
  },
  {
    id: 'VEH-05',
    vehicleNo: 'GJ15AV7963',
    driverName: 'Aabid Sama',
    driverMobile: '9687064462',
    transporter: 'Self Transport',
    gatepassNo: 'GP-2026-481779',
    processType: 'Outbound',
    bookingType: 'Sales Dispatch',
    bookingRefDocNo: 'SO-2026-189',
    inDateTime: '2026-08-21 09:30:00',
    outDateTime: '',
    inKmReading: 54120,
    outKmReading: '',
    status: 'Gate In',
    remark: 'Checked in at Gate 1, temperature normal',
    tempLog: [3.2]
  },
  {
    id: 'VEH-06',
    vehicleNo: 'GJ10TZ1090',
    driverName: 'Mukesh Sharma',
    driverMobile: '9825012345',
    transporter: 'Express Cargo',
    gatepassNo: 'GP-2026-481801',
    processType: 'Outbound',
    bookingType: 'Sales Dispatch',
    bookingRefDocNo: 'SO-2026-188',
    inDateTime: '2026-08-21 10:15:00',
    outDateTime: '',
    inKmReading: 88410,
    outKmReading: '',
    status: 'Gate In',
    remark: 'Reefer vehicle ready for loading bay 02',
    tempLog: [2.8]
  }
];

export const defaultPurchaseOrders = [
  {
    id: 'PO-2026-001',
    poNo: 'PO-2026-001',
    vendorId: 'V-001',
    date: '2026-08-01',
    status: 'Completed',
    items: [
      { productId: 'P-001', expectedQty: 100, receivedQty: 100, rate: 450 }
    ]
  },
  {
    id: 'PO-2026-002',
    poNo: 'PO-2026-002',
    vendorId: 'V-001',
    date: '2026-08-03',
    status: 'Receiving',
    items: [
      { productId: 'P-002', expectedQty: 150, receivedQty: 150, rate: 320 },
      { productId: 'P-008', expectedQty: 50, receivedQty: 48, rate: 600 }
    ]
  },
  {
    id: 'PO-2026-003',
    poNo: 'PO-2026-003',
    vendorId: 'V-002',
    date: '2026-08-05',
    status: 'Approved',
    items: [
      { productId: 'P-003', expectedQty: 200, receivedQty: 0, rate: 250 },
      { productId: 'P-005', expectedQty: 100, receivedQty: 0, rate: 180 }
    ]
  },
  {
    id: 'PO-2026-004',
    poNo: 'PO-2026-004',
    vendorId: 'V-003',
    date: '2026-08-06',
    status: 'Draft',
    items: [
      { productId: 'P-004', expectedQty: 300, receivedQty: 0, rate: 150 },
      { productId: 'P-006', expectedQty: 200, receivedQty: 0, rate: 120 }
    ]
  }
];

export const defaultInventory = [
  {
    id: 'INV-1001',
    productId: 'P-001',
    batchNo: 'B-APP-0801A',
    lotNo: 'LOT-99011',
    qty: 100,
    locationCode: 'A-01-01',
    mfgDate: '2026-08-01',
    expiryDate: '2026-09-15',
    warehouseId: 'WH-01',
    ageDays: 5,
    locked: false,
    tempLog: 3.2,
    grade: 'Grade A'
  },
  {
    id: 'INV-1002',
    productId: 'P-002',
    batchNo: 'B-ORG-0803A',
    lotNo: 'LOT-99023',
    qty: 150,
    locationCode: 'A-01-02',
    mfgDate: '2026-08-02',
    expiryDate: '2026-09-01',
    warehouseId: 'WH-01',
    ageDays: 3,
    locked: false,
    tempLog: 4.8,
    grade: 'Grade A'
  },
  {
    id: 'INV-1003',
    productId: 'P-008',
    batchNo: 'B-STR-0804A',
    lotNo: 'LOT-99088',
    qty: 48,
    locationCode: 'A-02-01',
    mfgDate: '2026-08-04',
    expiryDate: '2026-08-09', // Expiring very soon! FEFO priority
    warehouseId: 'WH-01',
    ageDays: 1,
    locked: false,
    tempLog: 1.1,
    grade: 'Grade A'
  },
  {
    id: 'INV-1004',
    productId: 'P-004',
    batchNo: 'B-POT-0720A',
    lotNo: 'LOT-98004',
    qty: 240,
    locationCode: 'B-01-01',
    mfgDate: '2026-07-20',
    expiryDate: '2026-10-18',
    warehouseId: 'WH-01',
    ageDays: 16,
    locked: false,
    tempLog: 13.5,
    grade: 'Grade B'
  }
];

export const defaultSalesOrders = [
  {
    id: 'SO-2026-001',
    orderNo: 'SO-2026-001',
    customerId: 'C-001',
    date: '2026-08-04',
    status: 'Delivered',
    priority: 'Normal',
    items: [
      { productId: 'P-001', qty: 20 },
      { productId: 'P-002', qty: 30 }
    ],
    dispatchDetails: {
      dispatchNo: 'DISP-2026-101',
      invoiceNo: 'INV-DISP-0011',
      gatePassNo: 'GP-2026-OUT01',
      vehicleNo: 'GJ10TZ1090',
      driverName: 'Mukesh Sharma',
      packedTime: '2026-08-04 10:00:00',
      dispatchTime: '2026-08-04 11:30:00',
      deliveryTime: '2026-08-04 15:45:00',
      signature: 'M. Sharma'
    }
  },
  {
    id: 'SO-2026-002',
    orderNo: 'SO-2026-002',
    customerId: 'C-002',
    date: '2026-08-06',
    status: 'Picking',
    priority: 'High',
    items: [
      { productId: 'P-001', qty: 40 },
      { productId: 'P-008', qty: 10 }
    ]
  },
  {
    id: 'SO-2026-003',
    orderNo: 'SO-2026-003',
    customerId: 'C-003',
    date: '2026-08-06',
    status: 'New',
    priority: 'Normal',
    items: [
      { productId: 'P-004', qty: 50 },
      { productId: 'P-005', qty: 25 }
    ]
  }
];

export const defaultPicklists = [
  {
    id: 'PL-1784155332',
    pickingId: 'PL1784155332',
    orderId: '189',
    orderNo: 'SO-2026-189',
    salesDeliveryNo: '1784155315',
    customerId: 'C-001',
    customerName: 'Reliance Industries Ltd',
    deliveryLocation: '54 Acre',
    area: 'STAFF KITCHEN',
    channel: '',
    pickingIssueDate: '2026-07-16 04:18:44',
    pickingEndDate: '2026-07-16 04:23:48',
    pickWise: 'Batch Wise',
    picklistGenerateMode: 'HHT',
    pickingStatus: 'Picking Done',
    status: 'Picking Done',
    items: [
      { productId: 'P-001', qty: 100, productCode: 'PROD-001', description: 'Fresh Apples (Imported)' }
    ]
  },
  {
    id: 'PL-1783063444',
    pickingId: 'PL1783063444',
    orderId: '188',
    orderNo: 'SO-2026-188',
    salesDeliveryNo: '1783063429',
    customerId: 'C-002',
    customerName: 'Radhe Krishna Temple Elephant Welfare Trust',
    deliveryLocation: 'Hotel Site',
    area: 'HOTEL SITE',
    channel: '',
    pickingIssueDate: '2026-07-03 12:56:38',
    pickingEndDate: '2026-07-03 12:59:07',
    pickWise: 'Batch Wise',
    picklistGenerateMode: 'HHT',
    pickingStatus: 'Picking Done',
    status: 'Picking Done',
    items: [
      { productId: 'P-002', qty: 150, productCode: 'PROD-002', description: 'Organic Bananas' }
    ]
  },
  {
    id: 'PL-1783062618',
    pickingId: 'PL1783062618',
    orderId: '187',
    orderNo: 'SO-2026-187',
    salesDeliveryNo: '1783062499',
    customerId: 'C-002',
    customerName: 'Radhe Krishna Temple Elephant Welfare Trust',
    deliveryLocation: 'Hotel Site Hotel Site',
    area: 'HOTEL SITE',
    channel: '',
    pickingIssueDate: '',
    pickingEndDate: '2026-07-03 12:49:50',
    pickWise: 'Batch Wise',
    picklistGenerateMode: 'HHT',
    pickingStatus: 'Picking Done',
    status: 'Picking Done',
    items: [
      { productId: 'P-003', qty: 80, productCode: 'PROD-003', description: 'Sweet Melons' }
    ]
  },
  {
    id: 'PL-1782128718',
    pickingId: 'PL1782128718',
    orderId: '157',
    orderNo: 'SO-2026-157',
    salesDeliveryNo: '1782128684',
    customerId: 'C-003',
    customerName: 'Khodiyar Animal Welfare Trust',
    deliveryLocation: 'Hotel Site',
    area: 'HOTEL SITE',
    channel: '',
    pickingIssueDate: '',
    pickingEndDate: '',
    pickWise: 'Batch Wise',
    picklistGenerateMode: 'HHT',
    pickingStatus: 'Picklist completed. But Picking pending',
    status: 'Picklist completed. But Picking pending',
    items: [
      { productId: 'P-004', qty: 50, productCode: 'PROD-004', description: 'Fresh Carrots' },
      { productId: 'P-005', qty: 25, productCode: 'PROD-005', description: 'Spinach Bunches' }
    ]
  }
];

export const defaultDispatchInvoices = [
  {
    id: 'INV-189',
    orderId: '189',
    orderNo: 'SO-2026-189',
    orderType: 'Dispatch Order',
    priority: 'Normal',
    orderDate: '16-07-2026',
    salesDeliveryNo: '1784155315',
    customerCode: 'RIL',
    customerName: 'Reliance Industries Ltd',
    shippingAddress: 'Reliance Industries Ltd, Village: Meghpar, Padana, PO: Motikhavdi, Dist. Jamnagar',
    location: '54 Acre',
    area: 'STAFF KITCHEN',
    orderBookingType: 'Sales Delivery Order',
    noOfProducts: 1,
    challanNo: 'GVL/00012/26-27',
    invoiceNo: 'GVL/00012/26-27',
    gatePassNo: 'GP-2026-481779',
    vehicleNo: 'GJ15AV7963',
    driverName: 'Aabid Sama',
    driverMobile: '9687064462',
    dispatchInvoiceDate: '2026-07-16',
    dispatchTime: '2026-07-16 04:23:48',
    status: 'Dispatched',
    cratesCount: '26',
    items: [
      { productId: 'P-001', code: 'P-001', description: 'Fresh Apples (Imported)', qty: 100, uom: 'KG' }
    ]
  },
  {
    id: 'INV-156',
    orderId: '156',
    orderNo: 'SO-2026-156',
    orderType: 'Dispatch Order',
    priority: 'Normal',
    orderDate: '17-06-2026',
    salesDeliveryNo: '1781635208',
    customerCode: 'KAWT',
    customerName: 'Khodiyar Animal Welfare Trust',
    shippingAddress: 'Khodiyar Animal Welfare Trust, Survey No 112, Jamnagar',
    location: 'Hotel Site',
    area: 'STAFF KITCHEN',
    orderBookingType: 'Sales Delivery Order',
    noOfProducts: 2,
    challanNo: 'GVL/00008/26-27',
    invoiceNo: 'GVL/00008/26-27',
    gatePassNo: 'GP-2026-481710',
    vehicleNo: 'GJ10TW2815',
    driverName: 'Jignesh Rawal',
    driverMobile: '9898012345',
    dispatchInvoiceDate: '2026-06-20',
    dispatchTime: '2026-06-20 11:30:00',
    status: 'Dispatched',
    cratesCount: '35',
    items: [
      { productId: 'P-004', code: 'P-004', description: 'Fresh Carrots', qty: 50, uom: 'KG' },
      { productId: 'P-005', code: 'P-005', description: 'Spinach Bunches', qty: 25, uom: 'BUNCH' }
    ]
  },
  {
    id: 'INV-188',
    orderId: '188',
    orderNo: 'SO-2026-188',
    orderType: 'Dispatch Order',
    priority: 'High',
    orderDate: '03-07-2026',
    salesDeliveryNo: '1783063429',
    customerCode: 'RKT',
    customerName: 'Radhe Krishna Temple Elephant Welfare Trust',
    shippingAddress: 'Radhe Krishna Temple, Moti Khavdi, Jamnagar',
    location: 'Hotel Site',
    area: 'HOTEL SITE',
    orderBookingType: 'Sales Delivery Order',
    noOfProducts: 2,
    challanNo: 'GVL/00011/26-27',
    invoiceNo: 'GVL/00011/26-27',
    gatePassNo: 'GP-2026-481755',
    vehicleNo: 'GJ10TZ1090',
    driverName: 'Mukesh Sharma',
    driverMobile: '9825012345',
    dispatchInvoiceDate: '2026-07-03',
    dispatchTime: '2026-07-03 12:59:07',
    status: 'Dispatched',
    cratesCount: '40',
    items: [
      { productId: 'P-002', code: 'P-002', description: 'Organic Bananas', qty: 150, uom: 'KG' }
    ]
  },
  {
    id: 'INV-187',
    orderId: '187',
    orderNo: 'SO-2026-187',
    orderType: 'Dispatch Order',
    priority: 'Normal',
    orderDate: '03-07-2026',
    salesDeliveryNo: '1783062499',
    customerCode: 'RKT',
    customerName: 'Radhe Krishna Temple Elephant Welfare Trust',
    shippingAddress: 'Radhe Krishna Temple, Moti Khavdi, Jamnagar',
    location: 'Hotel Site',
    area: 'HOTEL SITE',
    orderBookingType: 'Sales Delivery Order',
    noOfProducts: 1,
    challanNo: 'GVL/00010/26-27',
    invoiceNo: 'GVL/00010/26-27',
    gatePassNo: 'GP-2026-481740',
    vehicleNo: 'GJ15AV7963',
    driverName: 'Aabid Sama',
    driverMobile: '9687064462',
    dispatchInvoiceDate: '2026-07-03',
    dispatchTime: '2026-07-03 12:49:50',
    status: 'Dispatched',
    cratesCount: '18',
    items: [
      { productId: 'P-003', code: 'P-003', description: 'Sweet Melons', qty: 80, uom: 'KG' }
    ]
  }
];

export const defaultColdRooms = [
  { id: 'CR-1', name: 'Cold Room 1 (Apple/Berry)', minTemp: 0.0, maxTemp: 3.0, currentTemp: 1.8, currentHumidity: 90, status: 'Normal' },
  { id: 'CR-2', name: 'Cold Room 2 (Citrus/Ripening)', minTemp: 4.0, maxTemp: 8.0, currentTemp: 5.2, currentHumidity: 85, status: 'Normal' },
  { id: 'CR-3', name: 'Deep Freezer (Greens)', minTemp: -2.0, maxTemp: 1.0, currentTemp: 2.5, currentHumidity: 92, status: 'Alert' }, // Triggered high alert
  { id: 'CR-4', name: 'Ambient Stage Area', minTemp: 15.0, maxTemp: 22.0, currentTemp: 17.5, currentHumidity: 60, status: 'Normal' }
];

export const defaultAuditLogs = [
  { id: 'LOG-001', timestamp: '2026-08-05 08:35:00', username: 'operator', role: 'GRN Operator', action: 'Vehicle Gate-In Registered', module: 'Gatepass', status: 'Success' },
  { id: 'LOG-002', timestamp: '2026-08-05 09:10:00', username: 'operator', role: 'GRN Operator', action: 'PO Material Unloaded', module: 'Inbound', status: 'Success' },
  { id: 'LOG-003', timestamp: '2026-08-05 09:40:00', username: 'qc_inspector', role: 'Quality Control', action: 'QC Quality Passed: Batch B-APP-0801A', module: 'Quality Check', status: 'Success' },
  { id: 'LOG-004', timestamp: '2026-08-05 10:15:00', username: 'supervisor', role: 'Supervisor', action: 'Putaway Completed to Bin A-01-01', module: 'Putaway', status: 'Success' }
];

export const defaultReturns = [
  {
    id: 'RET-08165',
    returnNo: 'RET-2026-08165',
    type: 'Sales Return',
    challanNo: 'GVL/08165/26-27',
    salesDeliveryNo: '5515964508',
    partnerId: 'C-001',
    customerName: 'Reliance Industries Ltd',
    productId: 'P-001',
    noOfProducts: 2,
    totalQty: 97.50,
    totalReturnQty: 0.00,
    qty: 97.50,
    reason: 'Gate Delivery POD Verification',
    tempLog: 3.8,
    status: 'Return Confirmation Pending',
    date: '2026-08-05',
    items: [
      { productCode: 'G009', productDesc: 'Banana Robusta', uom: 'KG', dispatchedQty: 50.00, returnQty: 0.00, reason: 'Skin blemish' },
      { productCode: 'G013', productDesc: 'Beans Cow Pea', uom: 'KG', dispatchedQty: 47.50, returnQty: 0.00, reason: 'Packaging strain' }
    ],
    actionTaken: 'Awaiting Return Confirmation Disposition'
  },
  {
    id: 'RET-08160',
    returnNo: 'RET-2026-08160',
    type: 'Sales Return',
    challanNo: 'GVL/08160/26-27',
    salesDeliveryNo: '7208937574',
    partnerId: 'C-002',
    customerName: 'Khodiyar Animal Welfare Trust',
    productId: 'P-004',
    noOfProducts: 1,
    totalQty: 0.50,
    totalReturnQty: 0.00,
    qty: 0.50,
    reason: 'Weight Tolerance Check',
    tempLog: 4.2,
    status: 'Return Confirmation Pending',
    date: '2026-08-05',
    items: [
      { productCode: 'G031', productDesc: 'Chilli Green', uom: 'KG', dispatchedQty: 0.50, returnQty: 0.00, reason: 'Size sorting' }
    ],
    actionTaken: 'Awaiting Return Confirmation Disposition'
  },
  {
    id: 'RET-08151',
    returnNo: 'RET-2026-08151',
    type: 'Sales Return',
    challanNo: 'GVL/08151/26-27',
    salesDeliveryNo: '1788655849',
    partnerId: 'C-003',
    customerName: 'Radhe Krishna Temple Elephant Welfare Trust',
    productId: 'P-005',
    noOfProducts: 1,
    totalQty: 3.00,
    totalReturnQty: 0.00,
    qty: 3.00,
    reason: 'Wilting / Leaf Damage',
    tempLog: 4.0,
    status: 'Return Confirmation Pending',
    date: '2026-08-06',
    items: [
      { productCode: 'G050', productDesc: 'Green Amaranth', uom: 'KG', dispatchedQty: 3.00, returnQty: 0.00, reason: 'Leaf wilting' }
    ],
    actionTaken: 'Awaiting Return Confirmation Disposition'
  },
  {
    id: 'RET-08148',
    returnNo: 'RET-2026-08148',
    type: 'Sales Return',
    challanNo: 'GVL/08148/26-27',
    salesDeliveryNo: '1788650262',
    partnerId: 'C-001',
    customerName: 'Reliance Industries Ltd',
    productId: 'P-002',
    noOfProducts: 1,
    totalQty: 1.00,
    totalReturnQty: 0.00,
    qty: 1.00,
    reason: 'High Pulp Temperature',
    tempLog: 6.5,
    status: 'Return Confirmation Pending',
    date: '2026-08-06',
    items: [
      { productCode: 'G047', productDesc: 'Ginger', uom: 'KG', dispatchedQty: 1.00, returnQty: 0.00, reason: 'Warm pulp temp' }
    ],
    actionTaken: 'Awaiting Return Confirmation Disposition'
  },
  {
    id: 'RET-08124',
    returnNo: 'RET-2026-08124',
    type: 'Sales Return',
    challanNo: 'GVL/08124/26-27',
    salesDeliveryNo: '1788608337',
    partnerId: 'C-002',
    customerName: 'Khodiyar Animal Welfare Trust',
    productId: 'P-001',
    noOfProducts: 1,
    totalQty: 23.30,
    totalReturnQty: 0.00,
    qty: 23.30,
    reason: 'Surplus Stock at Kitchen',
    tempLog: 3.9,
    status: 'Return Confirmation Pending',
    date: '2026-08-07',
    items: [
      { productCode: 'G051', productDesc: 'Green Peas Fresh', uom: 'KG', dispatchedQty: 23.30, returnQty: 0.00, reason: 'Surplus return' }
    ],
    actionTaken: 'Awaiting Return Confirmation Disposition'
  },
  {
    id: 'RET-08116',
    returnNo: 'RET-2026-08116',
    type: 'Sales Return',
    challanNo: 'GVL/08116/26-27',
    salesDeliveryNo: '1292395959',
    partnerId: 'C-001',
    customerName: 'Reliance Industries Ltd',
    productId: 'P-008',
    noOfProducts: 1,
    totalQty: 43.00,
    totalReturnQty: 0.00,
    qty: 43.00,
    reason: 'Crate Damage in Transit',
    tempLog: 4.1,
    status: 'Return Confirmation Pending',
    date: '2026-08-07',
    items: [
      { productCode: 'G048', productDesc: 'Grapes Imported', uom: 'KG', dispatchedQty: 43.00, returnQty: 0.00, reason: 'Crate damage' }
    ],
    actionTaken: 'Awaiting Return Confirmation Disposition'
  },
  {
    id: 'RET-001',
    returnNo: 'RET-2026-001',
    type: 'Sales Return',
    challanNo: 'GVL/08055/26-27',
    salesDeliveryNo: '1784155315',
    partnerId: 'C-001',
    customerName: 'Reliance Industries Ltd',
    productId: 'P-001',
    noOfProducts: 1,
    totalQty: 15.00,
    totalReturnQty: 15.00,
    qty: 15,
    reason: 'Damaged Packaging',
    tempLog: 3.8,
    status: 'Return To Vendor',
    disposition: 'Return To Vendor',
    dispositionDate: '2026-08-05',
    dispositionDetails: {
      disposition: 'Return To Vendor',
      vendorName: 'Fresh Farms Ltd (Jamnagar)',
      debitNoteNo: 'DBN-2026-0081',
      remarks: 'Returned to supplier for full credit'
    },
    date: '2026-08-05',
    items: [
      { productCode: 'G009', productDesc: 'Fresh Apples (Imported)', uom: 'KG', dispatchedQty: 15.00, returnQty: 15.00, reason: 'Damaged Packaging' }
    ],
    actionTaken: 'Moved to vendor return bay for supplier dispatch'
  },
  {
    id: 'RET-002',
    returnNo: 'RET-2026-002',
    type: 'Sales Return',
    challanNo: 'GVL/08092/26-27',
    salesDeliveryNo: '1781635208',
    partnerId: 'C-002',
    customerName: 'Khodiyar Animal Welfare Trust',
    productId: 'P-008',
    noOfProducts: 1,
    totalQty: 20.00,
    totalReturnQty: 20.00,
    qty: 20,
    reason: 'Overripe Grade',
    tempLog: 4.5,
    status: 'Sale To Local Market',
    disposition: 'Sale To Local Market',
    dispositionDate: '2026-08-06',
    dispositionDetails: {
      disposition: 'Sale To Local Market',
      buyerName: 'Jamnagar Sabji Mandi Trader #4',
      rate: 18.00,
      totalAmount: 360.00,
      invoiceNo: 'LMS-2026-019',
      remarks: 'Sold at discounted secondary price'
    },
    date: '2026-08-06',
    items: [
      { productCode: 'G014', productDesc: 'Fresh Tomatoes Grade B', uom: 'KG', dispatchedQty: 20.00, returnQty: 20.00, reason: 'Overripe Grade' }
    ],
    actionTaken: 'Cleared via local wholesale trade bill LMS-2026-019'
  },
  {
    id: 'RET-003',
    returnNo: 'RET-2026-003',
    type: 'Sales Return',
    challanNo: 'GVL/08010/26-27',
    salesDeliveryNo: '1783063429',
    partnerId: 'C-003',
    customerName: 'Radhe Krishna Temple Elephant Welfare Trust',
    productId: 'P-005',
    noOfProducts: 1,
    totalQty: 10.00,
    totalReturnQty: 10.00,
    qty: 10,
    reason: 'Severe Temperature Abuse / Decayed',
    tempLog: 9.8,
    status: 'Scrap',
    disposition: 'Scrap',
    dispositionDate: '2026-08-06',
    dispositionDetails: {
      disposition: 'Scrap',
      scrapCertNo: 'SCRP-2026-092',
      disposalMethod: 'Compost Disposal Pit #2',
      remarks: 'Severe rotting - unsafe for consumption'
    },
    date: '2026-08-06',
    items: [
      { productCode: 'G050', productDesc: 'Spinach Bunches', uom: 'BUNCH', dispatchedQty: 10.00, returnQty: 10.00, reason: 'Decayed leaves' }
    ],
    actionTaken: 'Scrapped and destroyed at organic disposal yard'
  },
  {
    id: 'RET-004',
    returnNo: 'RET-2026-004',
    type: 'QC Return',
    partnerId: 'V-001',
    productId: 'P-002',
    qty: 25,
    reason: 'Quality Grading Failure / Bruised',
    tempLog: 5.8,
    status: 'Rejected',
    date: '2026-08-07',
    actionTaken: 'Rejected during inward dock QC and returned to vendor'
  },
  {
    id: 'RET-005',
    returnNo: 'RET-2026-005',
    type: 'QC Rejection',
    partnerId: 'V-002',
    productId: 'P-004',
    qty: 12,
    reason: 'Brix Level Below Spec',
    tempLog: 4.1,
    status: 'Quarantined',
    date: '2026-08-08',
    actionTaken: 'Held in Quarantine Zone for Supplier Debit Note'
  }
];

export const defaultSettings = {
  barcodeType: 'QR Code',
  otpVerify: true,
  emailNotification: true,
  smsNotification: false,
  autoLocationSuggestion: true,
  fifoMethod: 'FEFO' // FEFO: First Expiring First Out (best for fresh veg), FIFO: First In First Out
};

export const defaultCompanies = [
  {
    id: 'COMP-01',
    code: 'GN-01',
    name: 'GNOSIS VENTURES LLP',
    gstNo: '24AANFG0052H1ZP',
    address: 'C/O SHIV COLD STORAGE, SURVEY NO. 105/5 KHIJADIYA BY PASS, CHOWKDI, KHIJADIYA DISTRICT JAMNAGAR-361120',
    contact: '+91 96870 64462'
  }
];

export const defaultCategories = [
  { id: 'CAT-01', name: 'Fruits', description: 'Fresh orchard fruits, apples, citrus, berries' },
  { id: 'CAT-02', name: 'Vegetables', description: 'Root crops, brassicas, gourds' },
  { id: 'CAT-03', name: 'Leafy Greens', description: 'Spinach, coriander, herbs' }
];

export const defaultUoms = [
  { id: 'UOM-01', code: 'Kg', description: 'Kilograms' },

];

export const defaultDrivers = [
  { id: 'DRV-01', name: 'Ramesh Kumar', mobile: '+91 99887 76655', licenseNo: 'DL-GJ10-202100456' },
  { id: 'DRV-02', name: 'Sohan Singh', mobile: '+91 88776 65544', licenseNo: 'DL-MH12-201900123' }
];

export const defaultEmployees = [
  { id: 'EMP-01', name: 'Aarav Patel', role: 'GRN Operator', department: 'Inbound Logistics', status: 'Active' },
  { id: 'EMP-02', name: 'Karan Sharma', role: 'Picker/Packer', department: 'Outbound Warehouse', status: 'Active' }
];

export const defaultBarcodes = [
  { id: 'BC-01', barcode: '8901234567890', qrCode: 'QR-APP-0801', sku: 'P-001', product: 'Royal Gala Apples' },
  { id: 'BC-02', barcode: '8901234567891', qrCode: 'QR-ORG-0802', sku: 'P-008', product: 'Nagpur Oranges' }
];

export const defaultTaxes = [
  { id: 'TAX-01', name: 'GST 5%', cgst: 2.5, sgst: 2.5, igst: 5.0, gstPct: 5.0 },
  { id: 'TAX-02', name: 'GST 12%', cgst: 6.0, sgst: 6.0, igst: 12.0, gstPct: 12.0 }
];

export const defaultReasons = [
  { id: 'RSN-01', code: 'DMG', name: 'Damaged Packaging' },
  { id: 'RSN-02', code: 'TEMP', name: 'Temperature Abuse' },
  { id: 'RSN-03', code: 'EXP', name: 'Decay / Expiry' },
  { id: 'RSN-04', code: 'SHR', name: 'Shortage Rejection' }
];

