import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { useAuthStore } from '@/store/authStore';

const DEV_MACHINE_IP = '192.168.100.30';

// Derive socket server URL from the API URL (strip /api/v1)
const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL
  ? process.env.EXPO_PUBLIC_API_URL.replace('/api/v1', '')
  : __DEV__
    ? (Platform.OS === 'web'
        ? 'http://localhost:3000'
        : `http://${DEV_MACHINE_IP}:3000`)
    : 'https://digital-kisan-api.onrender.com';

let socket: Socket | null = null;

export const socketService = {
  connect(): Socket {
    if (socket) return socket;

    const token = useAuthStore.getState().token;
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    return socket;
  },

  disconnect() {
    socket?.disconnect();
    socket = null;
  },

  joinOrder(orderId: string) {
    if (!socket?.connected) this.connect();
    socket?.emit('join_order', { orderId });
  },

  emitLocation(orderId: string, latitude: number, longitude: number) {
    if (!socket?.connected) return;
    socket.emit('update_location', { orderId, latitude, longitude });
  },

  onDriverLocation(
    cb: (data: { latitude: number; longitude: number; timestamp: number }) => void
  ) {
    if (!socket?.connected) this.connect();
    socket?.on('driver_location', cb);
    return () => { socket?.off('driver_location', cb); };
  },

  onOrderStatusUpdated(
    orderId: string,
    cb: (data: { orderId: string; status: string }) => void
  ) {
    if (!socket?.connected) this.connect();
    const handler = (data: { orderId: string; status: string }) => {
      if (data.orderId === orderId) cb(data);
    };
    socket?.on('order_status_updated', handler);
    return () => { socket?.off('order_status_updated', handler); };
  },
};
