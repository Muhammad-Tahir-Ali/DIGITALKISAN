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
  cnicFront?: string;
  cnicBack?: string;
  landDoc?: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

// Backend wraps response in: { status: 'success', token, refreshToken, data: { user } }
interface BackendAuthResponse {
  status: string;
  token: string;
  refreshToken?: string;
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
  refreshToken: res.refreshToken ?? res.token,
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
   * Update current user profile (name, phone, etc.)
   */
  updateMe: async (payload: { name?: string; phone?: string }): Promise<User> => {
    const { data } = await api.patch<{ status: string; data: { user: User } }>('/users/me', payload);
    return data.data.user;
  },

  /**
   * Create a new account
   * This now returns a pending status, not the auth token
   */
  register: async (payload: RegisterPayload): Promise<{ status: string; message: string; data: { email: string; devCode?: string } }> => {
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
   * Request a password reset code to be sent to the given email.
   * Always resolves successfully — backend deliberately doesn't reveal whether
   * the email exists (to prevent enumeration).
   */
  forgotPassword: async (email: string): Promise<{ message: string; devCode?: string }> => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  /**
   * Submit the OTP + new password. On success returns auth tokens (auto-login).
   */
  resetPassword: async (payload: {
    email: string; code: string; newPassword: string;
  }): Promise<AuthResponse> => {
    const { data } = await api.post<BackendAuthResponse>('/auth/reset-password', payload);
    return normalizeResponse(data);
  },

  /**
   * Resubmit documents for review (CNIC front/back, land document)
   */
  resubmitDocs: async (payload: {
    cnicFront: string;
    cnicBack: string;
    landDoc?: string;
  }): Promise<void> => {
    await api.post('/auth/resubmit-docs', payload);
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
