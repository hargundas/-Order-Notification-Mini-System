import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useOrderStore, Order } from '../stores/orderStore';
import { useAuthStore } from '../stores/authStore';
import { logger } from '../utils/logger';

export const useOrders = () => {
  const orders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const addOrder = useOrderStore((state) => state.addOrder);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);

  const token = useAuthStore((state) => state.token);
  const vendorId = useAuthStore((state) => state.vendorId);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!token || !vendorId) return;

    setIsLoading(true);
    setError(null);
    try {
      logger.info('FETCH_ORDERS_START', `Fetching orders for vendor ${vendorId}`);
      const response = await apiClient.get<Order[]>('/vendor/orders');
      setOrders(response.data);
      logger.info('FETCH_ORDERS_SUCCESS', `Fetched ${response.data.length} orders`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch orders';
      setError(msg);
      logger.error('FETCH_ORDERS_ERROR', msg);
    } finally {
      setIsLoading(false);
    }
  }, [token, vendorId, setOrders]);

  useEffect(() => {
    if (token && vendorId) {
      fetchOrders();
    }
  }, [fetchOrders, token, vendorId]);

  const acceptOrder = async (orderId: string, delayMinutes?: number) => {
    try {
      const url = delayMinutes && delayMinutes > 0
        ? `/vendor/orders/${orderId}/accept?delayMinutes=${delayMinutes}`
        : `/vendor/orders/${orderId}/accept`;

      logger.info('ACCEPT_ORDER_START', `Accepting order ${orderId} (delay: ${delayMinutes || 0}m)`);
      const response = await apiClient.put<Order>(url);

      updateOrderStatus(orderId, 'ACCEPTED', response.data.delayMinutes);
      logger.info('ACCEPT_ORDER_SUCCESS', `Order ${orderId} accepted`);
      return response.data;
    } catch (err: any) {
      logger.error('ACCEPT_ORDER_ERROR', `Failed to accept order ${orderId}: ${err.message}`);
      throw err;
    }
  };

  const rejectOrder = async (orderId: string) => {
    try {
      logger.info('REJECT_ORDER_START', `Rejecting order ${orderId}`);
      const response = await apiClient.put<Order>(`/vendor/orders/${orderId}/reject`);

      updateOrderStatus(orderId, 'REJECTED');
      logger.info('REJECT_ORDER_SUCCESS', `Order ${orderId} rejected`);
      return response.data;
    } catch (err: any) {
      logger.error('REJECT_ORDER_ERROR', `Failed to reject order ${orderId}: ${err.message}`);
      throw err;
    }
  };

  const createCustomerOrder = async (payload: {
    vendorId: string;
    customerName: string;
    items: { name: string; price: number; quantity: number }[];
  }) => {
    try {
      logger.info('CREATE_ORDER_START', `Simulating order for vendor ${payload.vendorId} from ${payload.customerName}`);
      const response = await apiClient.post<Order>('/orders', payload);
      // The WebSocket will deliver this, but adding it optimistically ensures immediate UI feedback
      addOrder(response.data);
      return response.data;
    } catch (err: any) {
      logger.error('CREATE_ORDER_ERROR', `Failed to create order: ${err.message}`);
      throw err;
    }
  };

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
    acceptOrder,
    rejectOrder,
    createCustomerOrder,
  };
};
