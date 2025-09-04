import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthManager } from '@/hooks/useAuthManager';
import { InventoryApiService } from '@/services/inventoryApi';
import { toast } from 'sonner';

interface AppConfig {
  apiEnabled: boolean;
  baseURL: string;
  version: string;
}

interface ConnectionStatus {
  isOnline: boolean;
  lastCheck: Date | null;
  error: string | null;
}

interface AppContextType {
  // Auth state from useAuthManager
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
  
  // App configuration
  config: AppConfig;
  setConfig: (config: Partial<AppConfig>) => void;
  
  // Connection status
  connectionStatus: ConnectionStatus;
  testConnection: () => Promise<boolean>;
  
  // Legacy compatibility properties
  apiService: any;
  isConfigured: boolean;
  isOnline: boolean;
  clearConfig: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authManager = useAuthManager();
  
  const [apiService] = useState(() => new InventoryApiService());
  
  const [config, setConfigState] = useState<AppConfig>({
    apiEnabled: true,
    baseURL: 'http://localhost:3001',
    version: '1.0.0',
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: false,
    lastCheck: null,
    error: null,
  });

  const setConfig = (newConfig: Partial<AppConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfigState(updatedConfig);
    localStorage.setItem('app-config', JSON.stringify(updatedConfig));
  };

  const testConnection = async (): Promise<boolean> => {
    try {
      const response = await apiService.healthCheck();
      const isOnline = response.success;
      
      setConnectionStatus({
        isOnline,
        lastCheck: new Date(),
        error: isOnline ? null : 'Health check failed',
      });
      
      return isOnline;
    } catch (error) {
      setConnectionStatus({
        isOnline: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Connection failed',
      });
      
      return false;
    }
  };

  const clearConfig = () => {
    setConfigState({
      apiEnabled: false,
      baseURL: 'http://localhost:3001',
      version: '1.0.0',
    });
    localStorage.removeItem('app-config');
  };

  const value: AppContextType = {
    // Auth methods from useAuthManager
    ...authManager,
    
    // App configuration
    config,
    setConfig,
    
    // Connection status
    connectionStatus,
    testConnection,
    
    // Legacy compatibility properties
    apiService,
    isConfigured: config.apiEnabled,
    isOnline: connectionStatus.isOnline,
    clearConfig,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};