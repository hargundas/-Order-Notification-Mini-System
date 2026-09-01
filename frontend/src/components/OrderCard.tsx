import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  ShoppingBag, 
  DollarSign, 
  Timer, 
  ChevronDown, 
  Loader2 
} from 'lucide-react';
import { Order, OrderStatus } from '../stores/orderStore';

interface OrderCardProps {
  order: Order;
  onAccept: (orderId: string, delayMinutes?: number) => Promise<any>;
  onReject: (orderId: string) => Promise<any>;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onAccept, onReject }) => {
  const [selectedDelay, setSelectedDelay] = useState<number>(15);
  const [showDelayDropdown, setShowDelayDropdown] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const calculateTotal = () => {
    return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleAccept = async (delay?: number) => {
    try {
      setIsProcessing(true);
      await onAccept(order.id, delay);
    } finally {
      setIsProcessing(false);
      setShowDelayDropdown(false);
    }
  };

  const handleReject = async () => {
    if (window.confirm(`Are you sure you want to reject order ${order.id}?`)) {
      try {
        setIsProcessing(true);
        await onReject(order.id);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>ACCEPTED</span>
            {order.delayMinutes && (
              <span className="ml-1 text-emerald-300 font-normal">
                (+{order.delayMinutes}m delay)
              </span>
            )}
          </div>
        );
      case 'REJECTED':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>REJECTED</span>
          </div>
        );
      case 'PENDING':
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>PENDING ACTION</span>
          </div>
        );
    }
  };

  return (
    <div className="glass-card p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all duration-200 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header: ID, Time & Status */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-blue-400 bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-800/60">
              #{order.id}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {formatDate(order.createdAt)}
            </span>
          </div>
          {renderStatusBadge(order.status)}
        </div>

        {/* Customer Info */}
        <div className="py-3 flex items-center gap-2 text-slate-200 font-medium">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-blue-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">{order.customerName}</div>
            <div className="text-xs text-slate-400">Vendor ID: {order.vendorId}</div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-slate-950/40 rounded-xl p-3.5 my-2 border border-slate-900">
          <div className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            <span>Items ({order.items.length})</span>
          </div>
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-slate-800 text-blue-300 font-bold flex items-center justify-center text-[11px]">
                    {item.quantity}x
                  </span>
                  <span className="font-medium text-slate-200">{item.name}</span>
                </div>
                <span className="font-mono text-slate-400">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Total Amount
            </span>
            <span className="font-mono font-bold text-emerald-400 text-base">
              ${calculateTotal().toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons for Pending Orders */}
      {order.status === 'PENDING' && (
        <div className="pt-3 mt-2 border-t border-slate-800 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Quick Accept */}
            <button
              onClick={() => handleAccept()}
              disabled={isProcessing}
              className="btn btn-success text-xs py-2.5"
            >
              {isProcessing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Accept</span>
            </button>

            {/* Quick Accept with 15m delay */}
            <button
              onClick={() => handleAccept(15)}
              disabled={isProcessing}
              className="btn btn-warning text-xs py-2.5"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>+15m Prep</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Custom Delay Option */}
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setShowDelayDropdown(!showDelayDropdown)}
                disabled={isProcessing}
                className="w-full btn btn-ghost text-xs py-2 text-slate-300 justify-between px-3"
              >
                <span className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-blue-400" />
                  <span>Custom Delay ({selectedDelay}m)</span>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showDelayDropdown && (
                <div className="absolute bottom-full left-0 mb-1 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1.5 z-20 space-y-1">
                  {[5, 10, 15, 20, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        setSelectedDelay(mins);
                        handleAccept(mins);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-200 hover:bg-blue-600/30 hover:text-blue-300 rounded transition-colors flex items-center justify-between"
                    >
                      <span>Accept with {mins} minutes delay</span>
                      <span className="font-mono text-slate-400">+{mins}m</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reject Button */}
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="btn btn-danger text-xs py-2 px-3"
              title="Reject order"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
