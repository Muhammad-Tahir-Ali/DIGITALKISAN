import api from './api';
import type { Order } from './order.service';

export interface Farmer {
  _id: string;
  name: string;
  rating: number;
  ratingsQuantity: number;
  location?: { address: string };
}

export interface DashboardStats {
  totalProducts: number;
  activeOrdersCount: number;
  completedOrdersCount: number;
  totalEarnings: number;
  todaysEarnings: number;
  newAdsToday: number;
  rating: number;
}

export interface WalletData {
  availableBalance: number;
  totalEarned: number;
  inEscrow: number;
  totalSales: number;
}

export interface WalletTransaction {
  _id: string;
  amount: number;
  direction: 'credit' | 'debit';
  type: 'deposit' | 'withdrawal' | 'order_payment' | 'order_refund' | 'payout' | 'escrow_lock' | 'escrow_release';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  createdAt: string;
  balanceAfter: number;
}


export interface VehicleInfo {
  vehicleType?: 'motorcycle' | 'rickshaw' | 'van' | 'truck' | 'pickup';
  plateNumber?: string;
  capacity?: number;
  model?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'buyer' | 'farmer' | 'logistics' | 'admin';
  isVerified: boolean;
  isOnline?: boolean;
  vehicleInfo?: VehicleInfo;
}

const userService = {
  getTopFarmers: async (): Promise<Farmer[]> => {
    const { data } = await api.get('/users/top-farmers');
    return data.data.farmers;
  },

  getUserProfile: async (id: string): Promise<Farmer> => {
    const { data } = await api.get(`/users/${id}`);
    return data.data.user;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
        const { data } = await api.get('/users/stats');
        return data.data;
    },

    getWallet: async (): Promise<WalletData> => {
        const { data } = await api.get('/users/wallet');
        return data.data;
    },

getWalletHistory: async (): Promise<WalletTransaction[]> => {
    const { data } = await api.get('/users/wallet/history');
    return data.data.transactions;
  },

  updateMe: async (payload: { name?: string; phone?: string }): Promise<User> => {
    const { data } = await api.patch('/users/me', payload);
    return data.data.user;
  },

  /** Get full profile including vehicleInfo and isOnline */
  getMyProfile: async (): Promise<User> => {
    const { data } = await api.get('/users/profile');
    return data.data.user;
  },

  /** Update vehicle info (logistics only) */
  updateVehicleInfo: async (vehicleInfo: VehicleInfo): Promise<VehicleInfo> => {
    const { data } = await api.patch('/users/vehicle', vehicleInfo);
    return data.data.vehicleInfo;
  },

  /** Toggle online/offline status (logistics only) */
  toggleOnlineStatus: async (): Promise<{ isOnline: boolean }> => {
    const { data } = await api.patch('/users/toggle-status');
    return data.data;
  },

  /**
   * Add funds to the wallet (Request)
   */
  topupWallet: async (amount: number, method: string, paymentProof?: string): Promise<any> => {
    const { data } = await api.post('/users/wallet/topup', { amount, method, paymentProof });
    return data.data;
  },

  /**
   * Request withdrawal
   */
  requestWithdrawal: async (amount: number, method: string, accountDetails: any): Promise<any> => {
    const { data } = await api.post('/users/wallet/withdraw', { amount, method, accountDetails });
    return data.data;
  },
};

export default userService;

