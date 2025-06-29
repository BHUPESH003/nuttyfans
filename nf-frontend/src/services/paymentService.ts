import { AxiosResponse } from 'axios';
import { api } from './api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  isDefault: boolean;
  details: {
    last4?: string;
    brand?: string;
    expiryMonth?: string;
    expiryYear?: string;
    email?: string;
  };
  createdAt: string;
}

export interface PayoutMethod {
  id: string;
  type: 'bank_account' | 'paypal';
  isDefault: boolean;
  status: 'pending' | 'verified' | 'failed';
  details: {
    accountLast4?: string;
    bankName?: string;
    routingNumber?: string;
    email?: string;
  };
  createdAt: string;
}

export interface PayoutSchedule {
  frequency: 'weekly' | 'monthly';
  nextPayoutDate: string;
  minimumAmount: number;
}

export interface EarningsSummary {
  totalEarnings: number;
  pendingPayout: number;
  lastPayout: {
    amount: number;
    date: string;
    status: 'pending' | 'completed' | 'failed';
  };
  earningsByPeriod: {
    period: string;
    amount: number;
    subscriptions: number;
    tips: number;
  }[];
}

export class PaymentService {
  static async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response: AxiosResponse<ApiResponse<PaymentMethod[]>> = await api.get('/payments/methods');
    return response.data.data;
  }

  static async addPaymentMethod(data: {
    type: 'card' | 'paypal';
    token?: string;
    email?: string;
  }): Promise<PaymentMethod> {
    const response: AxiosResponse<ApiResponse<PaymentMethod>> = await api.post('/payments/methods', data);
    return response.data.data;
  }

  static async removePaymentMethod(methodId: string): Promise<void> {
    await api.delete(`/payments/methods/${methodId}`);
  }

  static async setDefaultPaymentMethod(methodId: string): Promise<PaymentMethod> {
    const response: AxiosResponse<ApiResponse<PaymentMethod>> = await api.put(`/payments/methods/${methodId}/default`);
    return response.data.data;
  }

  static async getPayoutMethods(): Promise<PayoutMethod[]> {
    const response: AxiosResponse<ApiResponse<PayoutMethod[]>> = await api.get('/payments/payout-methods');
    return response.data.data;
  }

  static async addPayoutMethod(data: {
    type: 'bank_account' | 'paypal';
    accountNumber?: string;
    routingNumber?: string;
    email?: string;
  }): Promise<PayoutMethod> {
    const response: AxiosResponse<ApiResponse<PayoutMethod>> = await api.post('/payments/payout-methods', data);
    return response.data.data;
  }

  static async removePayoutMethod(methodId: string): Promise<void> {
    await api.delete(`/payments/payout-methods/${methodId}`);
  }

  static async setDefaultPayoutMethod(methodId: string): Promise<PayoutMethod> {
    const response: AxiosResponse<ApiResponse<PayoutMethod>> = await api.put(`/payments/payout-methods/${methodId}/default`);
    return response.data.data;
  }

  static async getPayoutSchedule(): Promise<PayoutSchedule> {
    const response: AxiosResponse<ApiResponse<PayoutSchedule>> = await api.get('/payments/payout-schedule');
    return response.data.data;
  }

  static async updatePayoutSchedule(data: Partial<PayoutSchedule>): Promise<PayoutSchedule> {
    const response: AxiosResponse<ApiResponse<PayoutSchedule>> = await api.put('/payments/payout-schedule', data);
    return response.data.data;
  }

  static async getEarningsSummary(period: 'week' | 'month' | 'year'): Promise<EarningsSummary> {
    const response: AxiosResponse<ApiResponse<EarningsSummary>> = await api.get('/payments/earnings', {
      params: { period }
    });
    return response.data.data;
  }

  static async requestPayout(amount: number): Promise<void> {
    await api.post('/payments/request-payout', { amount });
  }
} 