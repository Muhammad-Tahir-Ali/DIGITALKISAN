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

const userService = {
  getTopFarmers: async (): Promise<Farmer[]> => {
    const { data } = await api.get('/users/top-farmers');
    return data.data.farmers;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get('/users/stats');
    return data.data;
  },

  getWallet: async (): Promise<WalletData> => {
    try {
      const { data } = await api.get('/users/wallet');
      return data.data;
    } catch {
      // Derive from stats if dedicated endpoint doesn't exist
      const stats = await userService.getDashboardStats();
      return {
        availableBalance: stats.totalEarnings,
        totalEarned: stats.totalEarnings,
        inEscrow: 0,
        totalSales: stats.completedOrdersCount,
      };
    }
  },
};

export default userService;
