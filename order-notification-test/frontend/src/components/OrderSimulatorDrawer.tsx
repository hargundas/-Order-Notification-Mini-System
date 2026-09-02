import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Plus, 
  Trash2, 
  Sparkles, 
  ShoppingBag, 
  DollarSign, 
  User, 
  Loader2 
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { getApiBaseUrl } from '../utils/serverUrl';

interface OrderSimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    vendorId: string;
    customerName: string;
    items: { name: string; price: number; quantity: number }[];
  }) => Promise<any>;
}

interface Preset {
  title: string;
  customer: string;
  items: { name: string; price: number; quantity: number }[];
}

const PRESETS: Preset[] = [
  {
    title: '🍔 Classic Burger Meal',
    customer: 'Sarah Jenkins',
    items: [
      { name: 'Double Bacon Cheeseburger', price: 14.5, quantity: 1 },
      { name: 'Crispy Truffle Fries', price: 5.5, quantity: 1 },
      { name: 'Vanilla Shake', price: 4.5, quantity: 1 },
    ],
  },
  {
    title: '🍕 Pizza Party Bundle',
    customer: 'David Miller',
    items: [
      { name: 'Large Pepperoni & Basil Pizza', price: 22.0, quantity: 2 },
      { name: 'Garlic Knots with Marinara', price: 6.0, quantity: 1 },
      { name: '2L Soda', price: 3.5, quantity: 2 },
    ],
  },
  {
    title: '🍣 Sushi Feast Deluxe',
    customer: 'Elena Rostova',
    items: [
      { name: 'Dragon Roll 8pcs', price: 16.0, quantity: 2 },
      { name: 'Salmon Nigiri 4pcs', price: 11.0, quantity: 1 },
      { name: 'Miso Soup', price: 3.5, quantity: 2 },
    ],
  },
];

export const OrderSimulatorDrawer: React.FC<OrderSimulatorDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const currentVendorId = useAuthStore((state) => state.vendorId) || 'vendor-123';

  const [customerName, setCustomerName] = useState<string>('John Doe');
  const [vendorId, setVendorId] = useState<string>(currentVendorId);
  const [items, setItems] = useState<{ name: string; price: number; quantity: number }[]>([
    { name: 'Cheeseburger Deluxe', price: 12.99, quantity: 2 },
    { name: 'French Fries', price: 4.5, quantity: 1 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { name: '', price: 5.0, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (
    index: number,
    field: 'name' | 'price' | 'quantity',
    value: string | number
  ) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: field === 'name' ? value : Number(value),
    };
    setItems(updated);
  };

  const applyPreset = (preset: Preset) => {
    setCustomerName(preset.customer);
    setItems(preset.items);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || items.some((i) => !i.name.trim())) {
      alert('Please complete all customer and item fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSuccessMessage(null);
      await onSubmit({
        vendorId,
        customerName,
        items,
      });

      setSuccessMessage('Order placed! Pushed via WebSocket & FCM 🚀');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      const serverUrl = getApiBaseUrl();
      const errMsg = err.response?.data?.message || err.message;
      alert(`Error creating order: ${errMsg}\nTarget Server: ${serverUrl}\n\nIf you see a Network Error, click 'Server Settings' (gear icon) in the header to check or update your backend URL.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end transition-opacity duration-300">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-left">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">Customer Order Simulator</h2>
                <p className="text-[11px] text-slate-400">Post simulated orders to POST /orders</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-2 block">Quick Presets</label>
              <div className="grid grid-cols-1 gap-2">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="text-left px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all text-xs text-slate-200 flex items-center justify-between group"
                  >
                    <span className="font-medium">{preset.title}</span>
                    <span className="text-[11px] text-slate-400 group-hover:text-blue-400">
                      ${preset.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target Vendor */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Target Vendor ID
                </label>
                <input
                  type="text"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Customer Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Order Items ({items.length})</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-200 focus:border-blue-500 focus:outline-none"
                          required
                        />
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-200 focus:border-blue-500 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-200 focus:border-blue-500 focus:outline-none"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total summary */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Calculated Total:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>

              {successMessage && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs text-center font-medium animate-slide-down">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn btn-primary text-xs py-3"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Dispatch Customer Order (POST /orders)</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
