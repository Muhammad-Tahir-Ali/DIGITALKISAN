import api from './api';
// Removed SecureStore import as storage is handled by useAuth.ts
import { User, UserRole } from '@/store/authStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

// Backend wraps response in: { status: 'success', token, data: { user } }
interface BackendAuthResponse {
  status: string;
  token: string;
  data: { user: User };
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const normalizeResponse = (res: BackendAuthResponse): AuthResponse => ({
  token: res.token,
  refreshToken: res.token, // Backend currently returns one token; extend if refresh added
  user: res.data.user,
});

// ---------------------------------------------------------------------------
// Auth Service
// ---------------------------------------------------------------------------
const authService = {
  /**
   * Login with email + password
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post<BackendAuthResponse>('/auth/login', payload);
    return normalizeResponse(data);
  },

  /**
   * Get current user profile
   */
  me: async (): Promise<User> => {
    const { data } = await api.get<{ status: string; data: { user: User } }>('/auth/me');
    return data.data.user;
  },

  /**
   * Create a new account
   * This now returns a pending status, not the auth token
   */
  register: async (payload: RegisterPayload): Promise<{ status: string; message: string; data: { email: string } }> => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },

  /**
   * Verify email with OTP
   */
  verifyEmail: async (payload: VerifyEmailPayload): Promise<AuthResponse> => {
    const { data } = await api.post<BackendAuthResponse>('/auth/verify-email', payload);
    return normalizeResponse(data);
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
   * Logout (clear tokens from secure storage)
   */
  logout: async (): Promise<void> => {
    // Backend logout logic if needed, storage is cleared in useAuth.ts
  },
};

export default authService;
