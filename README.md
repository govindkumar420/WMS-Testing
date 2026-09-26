# 🥬 Gnosis WMS - Enterprise Warehouse Management System

[![Deploy to GitHub Pages](https://github.com/govindkumar420/WMS-Testing/actions/workflows/deploy.yml/badge.svg)](https://github.com/govindkumar420/WMS-Testing/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success?style=flat&logo=github)](https://govindkumar420.github.io/WMS-Testing/)

An advanced Enterprise Warehouse Management System built with React, Vite, Tailwind CSS, and optional Supabase backend. Tailored for cold storage, fruit and vegetable logistics, FEFO inventory management, and RBAC security.

🌐 **Live Application URL**: [https://govindkumar420.github.io/WMS-Testing/](https://govindkumar420.github.io/WMS-Testing/)

---

## 🚀 Key Features

- **Dashboard**: Real-time KPI counters, inventory valuation, active shipments, and warehouse health telemetry.
- **Inbound Logistics**: Purchase Orders, ASN, GRN (Goods Receipt Notes), Batch inspection, and Putaway workflows.
- **Store & Inventory**: FEFO (First-Expired, First-Out) shelf-life tracking, multi-zone bins, and cycle counts.
- **Outbound Logistics**: Sales Order fulfillment, FEFO picklists, dispatch invoicing, and digital signature capture.
- **Cold Chain Telemetry**: Real-time temperature & humidity monitoring with threshold alerts.
- **Returns & Gate Pass**: Return order processing, vehicle check-in/out, and security logging.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions with integrated 2FA (TOTP authenticator, SMS, email simulation).

---

## 🔑 Demo Access

You can log in directly using the pre-configured quick demo chips on the login screen or using the following credentials:

| Role | Username | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin123` |
| **Warehouse Manager** | `manager` | `manager123` |
| **Logistics Operator** | `operator` | `operator123` |

---

## 🛠️ GitHub Pages Setup

To ensure the UI deploys and displays properly on GitHub:

1. In your GitHub repository, navigate to **Settings** > **Pages** (under *Code and automation*).
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Every push to the `main` branch will automatically trigger the workflow `.github/workflows/deploy.yml` and publish the site to:
   👉 **`https://govindkumar420.github.io/WMS-Testing/`**

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```