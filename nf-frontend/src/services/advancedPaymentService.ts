import { AxiosResponse } from 'axios';
import { api } from './api';
import {
  StripeConnectAccount,
  TaxDocument,
  AdvancedAnalytics,
  PaymentDashboardData,
} from 'src/types/payment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export class AdvancedPaymentService {
  // Stripe Connect Methods
  static async getStripeConnectAccount(): Promise<StripeConnectAccount | null> {
    const response: AxiosResponse<ApiResponse<StripeConnectAccount | null>> = await api.get('/payments/stripe-account');
    return response.data.data;
  }

  static async createStripeConnectAccount(data: {
    businessType: 'individual' | 'company';
    country: string;
    email: string;
  }): Promise<StripeConnectAccount> {
    const response: AxiosResponse<ApiResponse<StripeConnectAccount>> = await api.post('/payments/stripe-account', data);
    return response.data.data;
  }

  static async getStripeConnectOnboardingLink(): Promise<string> {
    const response: AxiosResponse<ApiResponse<{ url: string }>> = await api.get('/payments/stripe-account/onboarding-link');
    return response.data.data.url;
  }

  // Tax Document Methods
  static async getTaxDocuments(): Promise<TaxDocument[]> {
    const response: AxiosResponse<ApiResponse<TaxDocument[]>> = await api.get('/payments/tax-documents');
    return response.data.data;
  }

  static async uploadTaxDocument(data: {
    type: 'W9' | '1099NEC' | 'other';
    year: number;
    file: File;
  }): Promise<TaxDocument> {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('year', data.year.toString());
    formData.append('file', data.file);

    const response: AxiosResponse<ApiResponse<TaxDocument>> = await api.post('/payments/tax-documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  static async downloadTaxDocument(documentId: string): Promise<Blob> {
    const response = await api.get(`/payments/tax-documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Advanced Analytics Methods
  static async getAdvancedAnalytics(params: {
    period: 'day' | 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
  }): Promise<AdvancedAnalytics> {
    const response: AxiosResponse<ApiResponse<AdvancedAnalytics>> = await api.get('/analytics/advanced', {
      params,
    });
    return response.data.data;
  }

  // Dashboard Data
  static async getDashboardData(): Promise<PaymentDashboardData> {
    const response: AxiosResponse<ApiResponse<PaymentDashboardData>> = await api.get('/payments/dashboard');
    return response.data.data;
  }

  // Export Methods
  static async exportEarningsReport(params: {
    startDate: string;
    endDate: string;
    format: 'csv' | 'pdf';
  }): Promise<Blob> {
    const response = await api.get('/payments/export-earnings', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  static async exportTaxReport(params: {
    year: number;
    format: 'csv' | 'pdf';
  }): Promise<Blob> {
    const response = await api.get('/payments/export-tax-report', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }
} 