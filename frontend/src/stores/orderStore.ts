import { create } from 'zustand';

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface Order {
  id: string;
  vendorId: string;
  customerName: string;
  items: { name: string; price: number; quantity: number }[];
  status: OrderStatus;
  delayMinutes?: number;
  createdAt: string;
}

export interface OrderStore {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, delayMinutes?: number) => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],

  setOrders: (orders: Order[]) => {
    set({ orders });
  },

  addOrder: (order: Order) => {
    set((state) => {
      // Prevent duplicates if already present
      const exists = state.orders.some((o) => o.id === order.id);
      if (exists) {
        return {
          orders: state.orders.map((o) => (o.id === order.id ? order : o)),
        };
      }
      return { orders: [order, ...state.orders] };
    });
  },

  updateOrderStatus: (orderId: string, status: OrderStatus, delayMinutes?: number) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
              delayMinutes: delayMinutes !== undefined ? delayMinutes : order.delayMinutes,
            }
          : order
      ),
    }));
  },
}));
