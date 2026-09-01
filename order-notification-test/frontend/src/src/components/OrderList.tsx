import React, { useState, useMemo } from 'react';
import { 
  Inbox, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  PlusCircle, 
  RefreshCw 
} from 'lucide-react';
import { Order, OrderStatus } from '../stores/orderStore';
import { OrderCard } from './OrderCard';

interface OrderListProps {
  orders: Order[];
  isLoading: boolean;
  onRefresh: () => void;
  onAccept: (orderId: string, delayMinutes?: number) => Promise<any>;
  onReject: (orderId: string) => Promise<any>;
  onOpenSimulator: () => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  isLoading,
  onRefresh,
  onAccept,
  onReject,
  onOpenSimulator,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | OrderStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const counts = useMemo(() => {
    return {
      ALL: orders.length,
      PENDING: orders.filter((o) => o.status === 'PENDING').length,
      ACCEPTED: orders.filter((o) => o.status === 'ACCEPTED').length,
      REJECTED: orders.filter((o) => o.status === 'REJECTED').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesTab = activeTab === 'ALL' || order.status === activeTab;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        order.id.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.items.some((item) => item.name.toLowerCase().includes(query));

      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Filters & Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'ALL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>All</span>
            <span className="bg-black/30 px-1.5 py-0.2 rounded-md text-[10px]">
              {counts.ALL}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'PENDING'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
            <span className="bg-black/30 px-1.5 py-0.2 rounded-md text-[10px]">
              {counts.PENDING}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ACCEPTED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'ACCEPTED'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Accepted</span>
            <span className="bg-black/30 px-1.5 py-0.2 rounded-md text-[10px]">
              {counts.ACCEPTED}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
            <span className="bg-black/30 px-1.5 py-0.2 rounded-md text-[10px]">
              {counts.REJECTED}
            </span>
          </button>
        </div>

        {/* Search and Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by customer or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="btn btn-ghost text-xs p-2 text-slate-400 hover:text-slate-200"
            title="Refresh order feed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAccept={onAccept}
              onReject={onReject}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto border border-slate-800">
          <div className="w-16 h-16 rounded-full bg-slate-900/80 flex items-center justify-center text-slate-600 border border-slate-800">
            <Inbox className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-200">No Orders Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {searchQuery
                ? `No orders matching "${searchQuery}" in ${activeTab.toLowerCase()} category.`
                : `There are currently no ${activeTab.toLowerCase()} orders for your store.`}
            </p>
          </div>
          <button
            onClick={onOpenSimulator}
            className="btn btn-primary text-xs py-2 px-4 shadow-lg"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Simulate Customer Order</span>
          </button>
        </div>
      )}
    </div>
  );
};
