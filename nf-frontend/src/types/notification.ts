import { User } from './user';
import { Post } from './post';

export type NotificationType = 
  | 'NEW_SUBSCRIBER'
  | 'NEW_LIKE'
  | 'NEW_COMMENT'
  | 'NEW_MESSAGE'
  | 'SUBSCRIPTION_EXPIRED'
  | 'PAYOUT_PROCESSED'
  | 'POST_REPORTED'
  | 'ACCOUNT_VERIFIED';

export interface Notification {
  id: string;
  type: NotificationType;
  userId: string;
  read: boolean;
  data: {
    message: string;
    actionUrl?: string;
    triggeredBy?: User;
    post?: Post;
    metadata?: Record<string, string | number | boolean | undefined>;
  };
  createdAt: string;
}

export interface NotificationPreferences {
  email: {
    newSubscriber: boolean;
    newMessage: boolean;
    newComment: boolean;
    paymentProcessed: boolean;
    subscriptionExpiring: boolean;
    accountUpdates: boolean;
  };
  push: {
    newSubscriber: boolean;
    newMessage: boolean;
    newComment: boolean;
    paymentProcessed: boolean;
    subscriptionExpiring: boolean;
    accountUpdates: boolean;
  };
  inApp: {
    newSubscriber: boolean;
    newMessage: boolean;
    newComment: boolean;
    paymentProcessed: boolean;
    subscriptionExpiring: boolean;
    accountUpdates: boolean;
  };
} 