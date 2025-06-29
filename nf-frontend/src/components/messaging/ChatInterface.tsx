import React, { useState, useEffect, useRef } from 'react';
import { MessagingService } from 'src/services/messagingService';
import { Message, MessageInput, MessageAttachment } from 'src/types/messaging';
import { Avatar } from 'src/components/common/Avatar';
import { Button } from 'src/components/common/button';
import { formatDistanceToNow } from 'date-fns';

interface ChatInterfaceProps {
  conversationId: string;
  otherUser: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  otherUser,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadMessages();
    
    // Set up real-time listeners
    MessagingService.onNewMessage((message) => {
      if (message.senderId === otherUser.id || message.receiverId === otherUser.id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    });

    MessagingService.onMessageRead((data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, isRead: true } : msg
        )
      );
    });

    MessagingService.onUserTyping((data) => {
      if (data.userId === otherUser.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    return () => {
      // Clean up typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, otherUser.id]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { messages: newMessages, total } = await MessagingService.getMessages(
        conversationId,
        page
      );
      setMessages((prev) =>
        page === 1 ? newMessages : [...newMessages.reverse(), ...prev]
      );
      setHasMore(messages.length < total);
      if (page === 1) {
        scrollToBottom();
      }
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    
    // Send typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    MessagingService.sendTypingIndicator(conversationId);
    typingTimeoutRef.current = setTimeout(() => {
      // Typing stopped
    }, 2000);
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
      ? 'video'
      : file.type.startsWith('audio/')
      ? 'audio'
      : null;

    if (!type) {
      alert('Unsupported file type');
      return;
    }

    setAttachment({
      file,
      type,
      previewUrl: URL.createObjectURL(file),
    });
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !attachment) || sending) return;

    try {
      setSending(true);
      const messageData: MessageInput = {
        content: messageInput.trim(),
        receiverId: otherUser.id,
      };

      if (attachment) {
        messageData.attachment = attachment;
      }

      const newMessage = await MessagingService.sendMessage(messageData);
      setMessages((prev) => [...prev, newMessage]);
      setMessageInput('');
      setAttachment(null);
      scrollToBottom();
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const loadMoreMessages = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center space-x-3">
        <Avatar
          src={otherUser.avatarUrl}
          alt={otherUser.username}
          size="md"
        />
        <div>
          <h3 className="font-medium">{otherUser.username}</h3>
          {isTyping && (
            <p className="text-sm text-gray-500">typing...</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && page === 1 ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : (
          <>
            {hasMore && (
              <button
                className="w-full text-blue-500 hover:underline mb-4"
                onClick={loadMoreMessages}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            )}

            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.senderId !== otherUser.id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        isOwnMessage
                          ? 'bg-blue-500 text-white rounded-l-lg rounded-tr-lg'
                          : 'bg-gray-100 rounded-r-lg rounded-tl-lg'
                      } p-3`}
                    >
                      {message.mediaUrl && (
                        <div className="mb-2">
                          {message.mediaType === 'image' ? (
                            <img
                              src={message.mediaUrl}
                              alt="Attachment"
                              className="rounded-lg max-w-full"
                            />
                          ) : message.mediaType === 'video' ? (
                            <video
                              src={message.mediaUrl}
                              controls
                              className="rounded-lg max-w-full"
                            />
                          ) : (
                            <audio
                              src={message.mediaUrl}
                              controls
                              className="max-w-full"
                            />
                          )}
                        </div>
                      )}
                      {message.content && (
                        <p className="break-words">{message.content}</p>
                      )}
                      <div
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                        })}
                        {isOwnMessage && message.isRead && (
                          <span className="ml-2">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="p-2 text-center text-red-500 bg-red-50">
          {error}
        </div>
      )}

      <div className="p-4 border-t">
        {attachment && (
          <div className="mb-2 relative">
            {attachment.type === 'image' && (
              <img
                src={attachment.previewUrl}
                alt="Attachment preview"
                className="h-20 rounded-lg"
              />
            )}
            <button
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
              onClick={() => setAttachment(null)}
            >
              ✕
            </button>
          </div>
        )}
        
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={messageInput}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>
          <input
            type="file"
            accept="image/*,video/*,audio/*"
            className="hidden"
            id="attachment"
            onChange={handleAttachmentChange}
          />
          <Button
            variant="secondary"
            onClick={() => document.getElementById('attachment')?.click()}
          >
            📎
          </Button>
          <Button
            variant="primary"
            onClick={handleSendMessage}
            disabled={(!messageInput.trim() && !attachment) || sending}
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}; 