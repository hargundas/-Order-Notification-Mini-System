import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useWebSocket } from './hooks/useWebSocket';
import { useOrders } from './hooks/useOrders';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { LoginView } from './components/LoginView';
import { Navbar } from './components/Navbar';
import { NetworkAlertBanner } from './components/NetworkAlertBanner';
import { OrderList } from './components/OrderList';
import { OrderSimulatorDrawer } from './components/OrderSimulatorDrawer';
import { ClientLogViewer } from './components/ClientLogViewer';
import { ShoppingCart, DollarSign, Clock, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // Initialize resilient hooks
  useWebSocket();
  useNetworkStatus();

  const {
    orders,
    isLoading,
    refetch,
    acceptOrder,
    rejectOrder,
    createCustomerOrder,
  } = useOrders();

  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Calculate quick KPI metrics
  const totalRevenue = orders
    .filter((o) => o.status === 'ACCEPTED')
    .reduce(
      (sum, o) =>
        sum + o.items.reduce((iSum, item) => iSum + item.price * item.quantity, 0),
      0
    );

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const acceptedCount = orders.filter((o) => o.status === 'ACCEPTED').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white pb-12">
      {/* Network Alert Banner */}
      <NetworkAlertBanner />

      {/* Navigation Header */}
      <Navbar
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenLogs={() => setIsLogsOpen(true)}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Orders</div>
              <div className="text-xl font-bold font-mono text-white">{orders.length}</div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Pending Action</div>
              <div className="text-xl font-bold font-mono text-amber-400">{pendingCount}</div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Accepted Orders</div>
              <div className="text-xl font-bold font-mono text-emerald-400">{acceptedCount}</div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Accepted Revenue</div>
              <div className="text-xl font-bold font-mono text-white">
                ${totalRevenue.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Order Feed & Controls */}
        <OrderList
          orders={orders}
          isLoading={isLoading}
          onRefresh={refetch}
          onAccept={acceptOrder}
          onReject={rejectOrder}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
        />
      </main>

      {/* Simulator Drawer */}
      <OrderSimulatorDrawer
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSubmit={createCustomerOrder}
      />

      {/* Client Log & Telemetry Drawer */}
      <ClientLogViewer
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
      />
    </div>
  );
};

export default App;
