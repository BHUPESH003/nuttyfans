import { PaymentMethod, PayoutMethod } from 'src/services/paymentService';

export interface StripeConnectAccount {
  id: string;
  accountId: string;
  status: 'pending' | 'verified' | 'rejected';
  details: {
    businessType: 'individual' | 'company';
    country: string;
    email: string;
    capabilities: {
      transfers: 'active' | 'inactive' | 'pending';
      cardPayments: 'active' | 'inactive' | 'pending';
    };
  };
  verificationStatus: {
    individualVerified: boolean;
    businessVerified: boolean;
    documentVerified: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TaxDocument {
  id: string;
  type: 'W9' | '1099NEC' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  year: number;
  documentUrl?: string;
  submissionDate: string;
  verificationDate?: string;
  notes?: string;
}

export interface AdvancedAnalytics {
  revenue: {
    total: number;
    subscriptions: number;
    tips: number;
    ppv: number;
    period: 'day' | 'week' | 'month' | 'year';
    breakdown: {
      date: string;
      amount: number;
      source: 'subscription' | 'tip' | 'ppv';
    }[];
  };
  subscribers: {
    total: number;
    active: number;
    churnRate: number;
    retention: number;
    geography: {
      country: string;
      count: number;
    }[];
    growth: {
      date: string;
      newSubscribers: number;
      cancelledSubscribers: number;
    }[];
  };
  content: {
    totalPosts: number;
    engagementRate: number;
    topPerforming: {
      postId: string;
      title: string;
      views: number;
      likes: number;
      comments: number;
      revenue: number;
    }[];
    performance: {
      date: string;
      views: number;
      engagement: number;
      revenue: number;
    }[];
  };
}

export interface PaymentDashboardData {
  stripeAccount: StripeConnectAccount | null;
  taxDocuments: TaxDocument[];
  analytics: AdvancedAnalytics;
  paymentMethods: PaymentMethod[];
  payoutMethods: PayoutMethod[];
} 