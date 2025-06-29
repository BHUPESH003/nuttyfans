import { Media } from './media';
import { User } from './user';

export interface Message {
  id: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
  sender?: User;
  receiver?: User;
  media?: Media;
}

export interface Conversation {
  userId: string;
  username: string;
  avatarUrl?: string;
  lastMessageAt: string;
  unreadCount: number;
  lastMessage?: {
    id: string;
    content?: string;
    mediaUrl?: string;
    createdAt: string;
    senderId: string;
  };
}

export interface MessageCreateInput {
  receiverId: string;
  content?: string;
  mediaId?: string;
}

export interface MessageUpdateInput {
  id: string;
  isRead?: boolean;
}

export interface ChatParticipant extends Pick<User, 'id' | 'username' | 'avatarUrl'> {
  isOnline?: boolean;
  lastSeen?: string;
} 