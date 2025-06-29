import { AxiosResponse } from 'axios';
import { User } from 'src/types/user';
import { api } from './api';
import { Subscription, SubscriptionStats, SubscriptionTier } from 'src/types/subscription';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface SubscriptionResponse {
  subscription: Subscription;
  creator: User;
}

export class SubscriptionService {
  static async getSubscriptionTiers(creatorId: string): Promise<SubscriptionTier[]> {
    const response: AxiosResponse<ApiResponse<SubscriptionTier[]>> = await api.get(`/subscriptions/tiers/${creatorId}`);
    return response.data.data;
  }

  static async createSubscriptionTier(data: Partial<SubscriptionTier>): Promise<SubscriptionTier> {
    const response: AxiosResponse<ApiResponse<SubscriptionTier>> = await api.post('/subscriptions/tiers', data);
    return response.data.data;
  }

  static async updateSubscriptionTier(tierId: string, data: Partial<SubscriptionTier>): Promise<SubscriptionTier> {
    const response: AxiosResponse<ApiResponse<SubscriptionTier>> = await api.put(`/subscriptions/tiers/${tierId}`, data);
    return response.data.data;
  }

  static async deleteSubscriptionTier(tierId: string): Promise<void> {
    await api.delete(`/subscriptions/tiers/${tierId}`);
  }

  static async getSubscribers(params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'expired' | 'cancelled';
  }): Promise<{
    subscribers: Subscription[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
    };
  }> {
    const response: AxiosResponse<ApiResponse<{
      subscribers: Subscription[];
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
      };
    }>> = await api.get('/subscriptions/subscribers', { params });
    return response.data.data;
  }

  static async getSubscriptionStats(period: 'day' | 'week' | 'month' | 'year'): Promise<SubscriptionStats> {
    const response: AxiosResponse<ApiResponse<SubscriptionStats>> = await api.get('/subscriptions/stats', {
      params: { period }
    });
    return response.data.data;
  }

  static async subscribe(creatorId: string, tierId: string): Promise<SubscriptionResponse> {
    const response: AxiosResponse<ApiResponse<SubscriptionResponse>> = await api.post('/subscriptions/subscribe', {
      creatorId,
      tierId
    });
    return response.data.data;
  }

  static async cancelSubscription(subscriptionId: string): Promise<void> {
    await api.post(`/subscriptions/${subscriptionId}/cancel`);
  }
} 