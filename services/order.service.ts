import api from './api';

// ─── Types ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'bidding'
  | 'in_transit'
  | 'delivered'
  | 'disputed'
  | 'cancelled';

export interface Order {
  _id: string;
  buyer: { _id: string; name: string; phone: string };
  farmer: { _id: string; name: string; phone: string; location?: { address: string } };
  product: { _id: string; title: string; pricePerUnit: number; images?: string[] };
  logisticsProvider?: { _id: string; name: string; phone: string };
  quantity: number;
  deliveryFee?: number;
  totalPrice: number;
  shippingAddress: { address: string };
  status: OrderStatus;
  createdAt: string;
}

export interface CreateOrderPayload {
  productId: string;
  quantity: number;
  shippingAddress: { address: string };
  paymentGatewayRef?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

const orderService = {
  /**
   * Create a new order (Buyer only)
   * Also creates the Escrow Transaction automatically on the backend
   */
  create: async (payload: CreateOrderPayload): Promise<Order> => {
    const { data } = await api.post('/orders', payload);
    return data.data.order;
  },

  /**
   * Get orders for the logged-in user
   * Auto-filtered by role: buyers see purchases, farmers see sales, logistics see deliveries
   */
  getMyOrders: async (): Promise<Order[]> => {
    const { data } = await api.get('/orders');
    return data.data.orders;
  },

  /**
   * Get a single order by ID
   */
  getById: async (id: string): Promise<Order> => {
    const { data } = await api.get(`/orders/${id}`);
    return data.data.order;
  },

  /**
   * Update order status (Farmer / Logistics only)
   * Triggers Escrow release automatically when status = 'delivered'
   */
  updateStatus: async (orderId: string, status: OrderStatus): Promise<Order> => {
    const { data } = await api.patch(`/orders/${orderId}/status`, { status });
    return data.data.order;
  },

  /**
   * Get orders available for bidding (Logistics only)
   * Returns paid/bidding orders with no logistics provider assigned
   */
  getAvailableOrders: async (): Promise<Order[]> => {
    const { data } = await api.get('/orders/available');
    return data.data.orders;
  },

  /**
   * Cancel an order (Buyer only)
   * Only works if order status is 'pending' or 'paid'
   * Restores product inventory automatically
   */
  cancel: async (orderId: string): Promise<Order> => {
    const { data } = await api.patch(`/orders/${orderId}/cancel`);
    return data.data.order;
  },
};

export default orderService;
