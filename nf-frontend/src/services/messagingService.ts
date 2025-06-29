import { AxiosResponse } from 'axios';
import { api } from './api';
import { Message, Conversation, MessageInput } from 'src/types/messaging';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: { [key: string]: ((data: string | number | boolean | undefined) => void)[] } = {};

  constructor(private url: string, private token: string) {}

  connect() {
    this.ws = new WebSocket(`${this.url}?token=${this.token}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type && this.listeners[data.type]) {
        this.listeners[data.type].forEach(listener => listener(data.payload));
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, 1000 * Math.pow(2, this.reconnectAttempts));
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  on(type: string, callback: (data: string | number | boolean | undefined) => void) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  off(type: string, callback: (data: string | number | boolean | undefined) => void) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    }
  }

  send(type: string, payload: string | number | boolean | undefined) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export class MessagingService {
  private static wsClient: WebSocketClient | null = null;

  static initializeWebSocket(token: string) {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3000/ws';
    this.wsClient = new WebSocketClient(wsUrl, token);
    this.wsClient.connect();
    return this.wsClient;
  }

  static async getConversations(page = 1, limit = 20): Promise<{
    conversations: Conversation[];
    total: number;
  }> {
    const response: AxiosResponse<ApiResponse<{
      conversations: Conversation[];
      total: number;
    }>> = await api.get('/messages/conversations', {
      params: { page, limit },
    });
    return response.data.data;
  }

  static async getMessages(
    conversationId: string,
    page = 1,
    limit = 50
  ): Promise<{
    messages: Message[];
    total: number;
  }> {
    const response: AxiosResponse<ApiResponse<{
      messages: Message[];
      total: number;
    }>> = await api.get(`/messages/conversations/${conversationId}`, {
      params: { page, limit },
    });
    return response.data.data;
  }

  static async sendMessage(input: MessageInput): Promise<Message> {
    const formData = new FormData();
    
    if (input.content) {
      formData.append('content', input.content);
    }
    
    if (input.attachment) {
      formData.append('file', input.attachment.file);
      formData.append('mediaType', input.attachment.type);
    }
    
    formData.append('receiverId', input.receiverId);

    const response: AxiosResponse<ApiResponse<Message>> = await api.post(
      '/messages',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  }

  static async markAsRead(messageId: string): Promise<void> {
    await api.put(`/messages/${messageId}/read`);
  }

  static async markAllAsRead(conversationId: string): Promise<void> {
    await api.put(`/messages/conversations/${conversationId}/read`);
  }

  static async deleteMessage(messageId: string): Promise<void> {
    await api.delete(`/messages/${messageId}`);
  }

  static async blockUser(userId: string): Promise<void> {
    await api.post(`/messages/block/${userId}`);
  }

  static async unblockUser(userId: string): Promise<void> {
    await api.delete(`/messages/block/${userId}`);
  }

  static onNewMessage(callback: (message: Message) => void) {
    this.wsClient?.on('new_message', callback);
  }

  static onMessageRead(callback: (data: { messageId: string; readAt: string }) => void) {
    this.wsClient?.on('message_read', callback);
  }

  static onUserTyping(callback: (data: { userId: string; conversationId: string }) => void) {
    this.wsClient?.on('user_typing', callback);
  }

  static sendTypingIndicator(conversationId: string) {
    this.wsClient?.send('typing', { conversationId });
  }
} 