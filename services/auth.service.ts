import api from './api';
import { User, UserRole } from '@/store/authStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface LoginPayload {
  phone: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// ---------------------------------------------------------------------------
// Auth Service
// ---------------------------------------------------------------------------
const authService = {
  /**
   * Login with email + password
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', payload);
      return data;
    } catch (error) {
      // Mock the API call if no backend
      console.warn('API error, falling back to mock login');
      return new Promise((resolve) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('mock_user_role', 'farmer');
        }
        setTimeout(() => {
          resolve({
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
            user: {
              id: '1',
              name: 'Test User',
              email: 'test@example.com',
              phone: payload.phone,
              role: 'farmer',
              isVerified: true,
              createdAt: new Date().toISOString(),
            },
          });
        }, 1000);
      });
    }
  },

  /**
   * Create a new account
   */
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', payload);
      return data;
    } catch (error) {
      console.warn('API error, falling back to mock register');
      return new Promise((resolve) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('mock_user_role', payload.role || 'buyer');
        }
        setTimeout(() => {
          resolve({
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
            user: {
              id: Math.random().toString(36).substr(2, 9),
              name: payload.name,
              email: payload.email,
              phone: payload.phone,
              role: payload.role,
              isVerified: false,
              createdAt: new Date().toISOString(),
            },
          });
        }, 1500);
      });
    }
  },

  /**
   * Get current authenticated user profile
   */
  me: async (): Promise<User> => {
    try {
      const { data } = await api.get<User>('/auth/me');
      return data;
    } catch (error) {
      console.warn('API error in me(), falling back to mock');
      
      // On web, try to detect the role from previously saved state to maintain consistency
      let mockRole: UserRole = 'farmer';
      if (typeof window !== 'undefined') {
        const storedRole = localStorage.getItem('mock_user_role') as UserRole;
        if (storedRole) mockRole = storedRole;
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: '1',
            name: mockRole === 'farmer' ? 'Test Farmer' : 'Test Buyer',
            email: 'test@example.com',
            phone: '03001234567',
            role: mockRole,
            isVerified: true,
            createdAt: new Date().toISOString(),
          });
        }, 500);
      });
    }
  },

  /**
   * Refresh access token
   */
  refreshToken: async (
    refreshToken: string
  ): Promise<{ token: string; refreshToken: string }> => {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data;
  },

  /**
   * Logout (invalidates server-side refresh token)
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  /**
   * Send password reset email
   */
  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  /**
   * Reset password with OTP
   */
  resetPassword: async (
    token: string,
    password: string
  ): Promise<void> => {
    await api.post('/auth/reset-password', { token, password });
  },
};

export default authService;
