import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types/auth';
import { apiClient, ApiClientError } from '@/services/apiClient';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export const useAuthManager = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('auth-token');

        if (savedUser && savedToken) {
          apiClient.setToken(savedToken);
          
          // Verify token is still valid
          try {
            const response = await apiClient.verifyToken();
            if (response.success) {
              setAuthState({
                user: JSON.parse(savedUser),
                isLoading: false,
                isAuthenticated: true,
                error: null,
              });
              return;
            }
          } catch (error) {
            // Token invalid, clear it
            localStorage.removeItem('user');
            localStorage.removeItem('auth-token');
            apiClient.setToken(null);
          }
        }

        setAuthState(prev => ({
          ...prev,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Auth initialization failed',
        }));
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiClient.login(email, password);

      if (response.success && response.data?.token && response.data?.user) {
        const userData: User = {
          id: response.data.user.id,
          username: response.data.user.email,
          email: response.data.user.email,
          role: response.data.user.role,
          name: response.data.user.name || response.data.user.email,
        };

        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('auth-token', response.data.token);
        
        // Set token in API client
        apiClient.setToken(response.data.token);

        setAuthState({
          user: userData,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });

        toast.success(`Welcome back, ${userData.name}!`);

        return true;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof ApiClientError 
        ? error.message 
        : error instanceof Error 
          ? error.message 
          : 'Login failed';

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      toast.error(`Login Failed: ${errorMessage}`);

      return false;
    }
  }, []);

  const logout = useCallback(() => {
    // Clear state
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });

    // Clear storage
    localStorage.removeItem('user');
    localStorage.removeItem('auth-token');
    
    // Clear API client token
    apiClient.setToken(null);

    toast.success('You have been successfully logged out.');
  }, []);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await apiClient.refreshToken();
      
      if (response.success && response.data?.token) {
        localStorage.setItem('auth-token', response.data.token);
        apiClient.setToken(response.data.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  }, [logout]);

  // Auto refresh token before expiry
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    // Refresh token every 6 hours (token valid for 7 days)
    const interval = setInterval(() => {
      refreshAuth();
    }, 6 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, refreshAuth]);

  return {
    ...authState,
    login,
    logout,
    refreshAuth,
  };
};