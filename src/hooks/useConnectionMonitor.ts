import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

interface ConnectionMetrics {
  latency: number | null;
  lastSuccessfulRequest: Date | null;
  consecutiveFailures: number;
  isHealthy: boolean;
}

export const useConnectionMonitor = () => {
  const { connectionStatus, testConnection, config } = useApp();
  const { toast } = useToast();
  
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    latency: null,
    lastSuccessfulRequest: null,
    consecutiveFailures: 0,
    isHealthy: false,
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  const measureLatency = useCallback(async (): Promise<number | null> => {
    if (!config.apiEnabled) return null;

    const startTime = performance.now();
    try {
      const success = await testConnection();
      const endTime = performance.now();
      
      if (success) {
        return endTime - startTime;
      }
      return null;
    } catch {
      return null;
    }
  }, [testConnection, config.apiEnabled]);

  const updateMetrics = useCallback(async () => {
    const latency = await measureLatency();
    const now = new Date();
    
    setMetrics(prev => {
      const isHealthy = connectionStatus.isOnline && latency !== null && latency < 5000;
      const consecutiveFailures = isHealthy ? 0 : prev.consecutiveFailures + 1;
      
      // Show toast for connection state changes
      if (prev.isHealthy && !isHealthy) {
        toast({
          title: 'Connection Issues',
          description: 'API connection is experiencing problems',
          variant: 'destructive',
        });
      } else if (!prev.isHealthy && isHealthy) {
        toast({
          title: 'Connection Restored',
          description: 'API connection is working normally',
        });
      }

      return {
        latency,
        lastSuccessfulRequest: isHealthy ? now : prev.lastSuccessfulRequest,
        consecutiveFailures,
        isHealthy,
      };
    });
  }, [connectionStatus.isOnline, measureLatency, toast]);

  // Start/stop monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Monitor connection when enabled
  useEffect(() => {
    if (!isMonitoring || !config.apiEnabled) return;

    const interval = setInterval(updateMetrics, 30000); // Check every 30 seconds
    
    // Initial check
    updateMetrics();

    return () => clearInterval(interval);
  }, [isMonitoring, config.apiEnabled, updateMetrics]);

  // Auto-start monitoring when app is configured
  useEffect(() => {
    if (config.apiEnabled) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
  }, [config.apiEnabled, startMonitoring, stopMonitoring]);

  return {
    connectionStatus,
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    testConnection,
    measureLatency,
  };
};