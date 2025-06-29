import { User } from './user';

export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  isActive: boolean;
  creatorId: string;
  creator?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  subscriberId: string;
  subscriber?: User;
  creatorId: string;
  creator?: User;
  tierId: string;
  tier?: SubscriptionTier;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  renewalDate?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionStats {
  totalRevenue: number;
  activeSubscribers: number;
  totalSubscribers: number;
  averageSubscriptionDuration: number;
  churnRate: number;
  revenueByPeriod: {
    period: string;
    revenue: number;
    subscribers: number;
  }[];
  topTiers: {
    tier: SubscriptionTier;
    subscriberCount: number;
    revenue: number;
  }[];
} 