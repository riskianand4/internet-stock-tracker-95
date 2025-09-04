// Legacy inventory API compatibility layer
import { apiClient } from './apiClient';

export class InventoryApiService {
  async healthCheck() {
    const response = await apiClient.healthCheck();
    return response;
  }

  async getProducts(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get(`/api/products${queryString}`);
    return response;
  }

  async createProduct(data: any) {
    const response = await apiClient.post('/api/products', data);
    return response;
  }

  async updateProduct(id: string, data: any) {
    const response = await apiClient.put(`/api/products/${id}`, data);
    return response;
  }

  async deleteProduct(id: string) {
    const response = await apiClient.delete(`/api/products/${id}`);
    return response;
  }

  async getAnalyticsOverview() {
    const response = await apiClient.get('/api/analytics/overview');
    return response;
  }

  async getAnalyticsTrends(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get(`/api/analytics/trends${queryString}`);
    return response;
  }

  async getCategoryAnalysis(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get(`/api/analytics/category-analysis${queryString}`);
    return response;
  }

  async getStockVelocity(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get(`/api/analytics/stock-velocity${queryString}`);
    return response;
  }

  async getSmartInsights(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get(`/api/analytics/insights${queryString}`);
    return response;
  }

  async getStockAlerts() {
    const response = await apiClient.get('/api/analytics/alerts');
    return response;
  }

  async getStockMovements(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get(`/api/stock/movements${queryString}`);
    return response;
  }

  async getInventoryStats() {
    const response = await apiClient.get('/api/analytics/overview');
    return response;
  }

  setToken(token: string | null) {
    apiClient.setToken(token);
  }

  getToken() {
    return apiClient.getToken();
  }
}

export const initializeApiService = () => new InventoryApiService();
export const getApiService = () => new InventoryApiService();
export default InventoryApiService;