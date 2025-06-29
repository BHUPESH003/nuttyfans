import { User } from './user';
import { Post } from './post';

export type ReportReason =
  | 'INAPPROPRIATE_CONTENT'
  | 'SPAM'
  | 'HARASSMENT'
  | 'HATE_SPEECH'
  | 'VIOLENCE'
  | 'COPYRIGHT'
  | 'SCAM'
  | 'OTHER';

export interface Report {
  id: string;
  reason: ReportReason;
  description?: string;
  reporterId: string;
  reporter: User;
  postId: string;
  post: Post;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

export interface ReportCreateInput {
  reason: ReportReason;
  description?: string;
  postId: string;
}

export interface ReportUpdateInput {
  status: Report['status'];
  adminNotes?: string;
} 