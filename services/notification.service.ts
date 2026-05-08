import api from './api';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
  isRead: boolean;
  createdAt: string;
}

const notificationService = {
  /**
   * Get all notifications for the logged in user
   */
  getMyNotifications: async (): Promise<Notification[]> => {
    const { data } = await api.get('/notifications');
    return data.data.notifications;
  },

  /**
   * Mark a specific notification as read
   */
  markAsRead: async (id: string): Promise<Notification> => {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data.data.notification;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};

export default notificationService;
