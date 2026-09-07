import React, { useState, useContext, useEffect } from 'react';
import { WmsDataContext } from './context/WmsDataContext';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import LoginView from './components/common/LoginView';
import DashboardView from './components/dashboard/DashboardView';
import GeneralView from './components/general/GeneralView';
import InboundView from './components/inbound/InboundView';
import ReturnView from './components/return/ReturnView';
import StoreView from './components/store/StoreView';
import OutboundView from './components/outbound/OutboundView';
import ColdChainView from './components/coldchain/ColdChainView';
import ReportsView from './components/reports/ReportsView';
import SecurityView from './components/security/SecurityView';
import PurchaseOrderView from './components/purchase/PurchaseOrderView';
import GatepassView from './components/gatepass/GatepassView';
import DynamicMockView from './components/common/DynamicMockView';

export default function App() {
  const { loggedInUser, warehouses, currentView, setCurrentView } = useContext(WmsDataContext);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  // Set default warehouse once loaded
  useEffect(() => {
    if (warehouses.length > 0 && !selectedWarehouse) {
      setSelectedWarehouse(warehouses[0]);
    }
  }, [warehouses, selectedWarehouse]);

  // Route guarding in layout
  useEffect(() => {
    if (loggedInUser) {
      const perms = loggedInUser.permissions || [];
      
      let permToCheck = currentView;
      if (currentView === 'general' || currentView === 'masters') permToCheck = 'masters';
      else if (currentView === 'store') permToCheck = 'inventory';
      else if (currentView === 'purchase') permToCheck = 'inbound';
      else if (currentView === 'gatepass') permToCheck = 'inbound';
      else if (currentView === 'mock') permToCheck = 'dashboard';

      // If active view is not permitted, switch to dashboard or first permitted view
      if (
        currentView !== 'dashboard' && 
        currentView !== 'mock' && 
        !perms.includes(permToCheck)
      ) {
        setCurrentView('dashboard');
      }
    }
  }, [loggedInUser, currentView, setCurrentView]);

  if (!loggedInUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex flex-col transition-colors duration-200">
      
      {/* Header Banner & Nav */}
      <Header
        selectedWarehouse={selectedWarehouse}
        setSelectedWarehouse={setSelectedWarehouse}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* View Content Port */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-[#09090b]">
          {currentView === 'dashboard' && (
            <DashboardView setCurrentView={setCurrentView} />
          )}
          {currentView === 'general' && <GeneralView />}
          {currentView === 'inbound' && <InboundView />}
          {currentView === 'store' && <StoreView />}
          {currentView === 'return' && <ReturnView />}
          {currentView === 'outbound' && <OutboundView />}
          {currentView === 'coldchain' && <ColdChainView />}
          {currentView === 'reports' && <ReportsView />}
          {currentView === 'security' && <SecurityView />}
          {currentView === 'purchase' && <PurchaseOrderView />}
          {currentView === 'gatepass' && <GatepassView />}
          {currentView === 'mock' && <DynamicMockView />}
        </main>

      </div>

    </div>
  );
}
