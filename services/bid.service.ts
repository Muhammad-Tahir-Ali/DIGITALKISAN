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

export interface BidWithOrder extends Omit<Bid, 'order'> {
  order: {
    _id: string;
    status: string;
    totalPrice: number;
    deliveryFee?: number;
    shippingAddress: { address: string };
    product: { _id: string; title: string; images?: string[] };
    farmer: { _id: string; name: string; location?: { address: string } };
    createdAt: string;
  } | null;
}

export interface PlaceBidPayload {
  bidAmount: number;
  estimatedDeliveryTime: number;
  message?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

const bidService = {
  place: async (orderId: string, payload: PlaceBidPayload): Promise<Bid> => {
    const { data } = await api.post(`/orders/${orderId}/bids`, payload);
    return data.data.bid;
  },

  getForOrder: async (orderId: string): Promise<Bid[]> => {
    const { data } = await api.get(`/orders/${orderId}/bids`);
    return data.data.bids;
  },

  accept: async (bidId: string): Promise<{ bid: Bid; order: object }> => {
    const { data } = await api.patch(`/bids/${bidId}/accept`);
    return data.data;
  },

  /** Get all bids submitted by the logged-in logistics provider */
  getMyBids: async (): Promise<BidWithOrder[]> => {
    const { data } = await api.get('/bids/my');
    return data.data.bids;
  },
};

export default bidService;
