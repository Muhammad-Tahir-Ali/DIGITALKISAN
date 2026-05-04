import api from './api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Bid {
  _id: string;
  order: string;
  logisticsProvider: {
    _id: string;
    name: string;
    phone: string;
    rating?: number;
  };
  bidAmount: number;
  estimatedDeliveryTime: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface PlaceBidPayload {
  bidAmount: number;
  estimatedDeliveryTime: number;
  message?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

const bidService = {
  /**
   * Place a bid on an order (Logistics only)
   */
  place: async (orderId: string, payload: PlaceBidPayload): Promise<Bid> => {
    const { data } = await api.post(`/orders/${orderId}/bids`, payload);
    return data.data.bid;
  },

  /**
   * Get all bids for a specific order
   */
  getForOrder: async (orderId: string): Promise<Bid[]> => {
    const { data } = await api.get(`/orders/${orderId}/bids`);
    return data.data.bids;
  },

  /**
   * Accept a bid (Farmer only)
   * Auto-assigns logistics provider to the order and rejects all other bids
   */
  accept: async (bidId: string): Promise<{ bid: Bid; order: object }> => {
    const { data } = await api.patch(`/bids/${bidId}/accept`);
    return data.data;
  },
};

export default bidService;
