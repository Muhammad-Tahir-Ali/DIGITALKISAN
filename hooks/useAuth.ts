import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore, User, UserRole } from '@/store/authStore';
import authService, { LoginPayload, RegisterPayload } from '@/services/auth.service';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * useAuth — wraps authStore with SecureStore persistence.
 *
 * Usage:
 *   const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth() {
  const store = useAuthStore();

  /**
   * Attempt to rehydrate session from secure storage on app boot.
   * Call this once from the root layout.
   */
  const rehydrate = useCallback(async () => {
    try {
      store.setLoading(true);
      let token, refreshToken;
      
      if (Platform.OS === 'web') {
        token = localStorage.getItem(TOKEN_KEY);
        refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      } else {
        token = await SecureStore.getItemAsync(TOKEN_KEY);
        refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      }

      if (!token || !refreshToken) {
        store.setLoading(false);
        return false;
      }

      // Temporarily set token so api interceptor can attach it
      store.setTokens(token, refreshToken);

      const user = await authService.me();
      store.hydrate(user, token, refreshToken);
      return true;
    } catch {
      if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
      return false;
    } finally {
      store.setLoading(false);
    }
  }, []);

  /**
   * Login and persist tokens to SecureStore.
   */
  const login = useCallback(async (payload: LoginPayload) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const { user, token, refreshToken } = await authService.login(payload);

      if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }

      store.hydrate(user, token, refreshToken);
      return user;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? 'Login failed. Please try again.';
      store.setError(message);
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, []);

  /**
   * Register a new account.
   */
  const register = useCallback(async (payload: RegisterPayload) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await authService.register(payload);
      return response.data; // returns { email: string }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? 'Registration failed. Please try again.';
      store.setError(message);
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, []);

  /**
   * Verify email OTP after registration
   */
  const verifyRegistration = useCallback(async (email: string, code: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const { user, token, refreshToken } = await authService.verifyEmail({ email, code });

      if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }

      store.hydrate(user, token, refreshToken);
      return user;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? 'Verification failed. Please check your code.';
      store.setError(message);
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, []);

  /**
   * Request a password reset code by email. Never throws on unknown email
   * — backend deliberately responds the same either way.
   */
  const requestPasswordReset = useCallback(async (email: string) => {
    return authService.forgotPassword(email);
  }, []);

  /**
   * Confirm reset with OTP + new password. On success this also signs the
   * user in (tokens are persisted), so no separate login step is needed.
   */
  const confirmPasswordReset = useCallback(async (
    email: string, code: string, newPassword: string,
  ) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const { user, token, refreshToken } = await authService.resetPassword({
        email, code, newPassword,
      });

      if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }

      store.hydrate(user, token, refreshToken);
      return user;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? 'Could not reset password. Please try again.';
      store.setError(message);
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, []);

  /**
   * Logout: clear store + remove tokens from SecureStore.
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore server errors on logout
    } finally {
      store.logout();
      if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
    }
  }, []);

  /**
   * Update role selection (e.g. from role-select screen).
   */
  const selectRole = useCallback((role: UserRole) => {
    store.setRole(role);
  }, []);

  const updateUser = useCallback(async (payload: { name?: string; phone?: string }) => {
    const oldUser = store.user;
    try {
      // Optimistic update
      if (oldUser) {
        store.hydrate({ ...oldUser, ...payload }, store.token!, store.refreshToken!);
      }
      
      const updatedUser = await authService.updateMe(payload);
      
      // Final update with server response
      store.hydrate(updatedUser, store.token!, store.refreshToken!);
      return updatedUser;
    } catch (err) {
      // Revert on error
      if (oldUser) {
        store.hydrate(oldUser, store.token!, store.refreshToken!);
      }
      throw err;
    }
  }, []);

  return {
    user: store.user as User | null,
    token: store.token,
    role: store.role,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    login,
    register,
    verifyRegistration,
    requestPasswordReset,
    confirmPasswordReset,
    logout,
    rehydrate,
    selectRole,
    updateUser,
  };
}
