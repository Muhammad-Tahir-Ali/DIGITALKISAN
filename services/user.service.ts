import api from './api';

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

const userService = {
  getTopFarmers: async (): Promise<Farmer[]> => {
    const { data } = await api.get('/users/top-farmers');
    return data.data.farmers;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get('/users/stats');
    return data.data;
  },
};

export default userService;
