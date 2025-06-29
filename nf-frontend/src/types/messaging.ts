import { User } from './user';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  isRead: boolean;
  createdAt: string;
  sender?: User;
  receiver?: User;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  lastMessageAt: string;
  isBlocked: boolean;
}

export interface MessageAttachment {
  file: File;
  type: 'image' | 'video' | 'audio';
  previewUrl: string;
}

export interface MessageInput {
  content?: string;
  attachment?: MessageAttachment;
  receiverId: string;
} 