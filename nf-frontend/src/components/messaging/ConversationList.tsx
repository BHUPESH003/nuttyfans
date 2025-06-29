import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessagingService } from 'src/services/messagingService';
import { Conversation } from 'src/types/messaging';
import { Avatar } from 'src/components/common/Avatar';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
  selectedConversationId,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();
    
    // Listen for new messages
    MessagingService.onNewMessage((message) => {
      setConversations((prevConversations) => {
        const conversationIndex = prevConversations.findIndex(
          (c) => c.participants.some((p) => p.id === message.senderId)
        );

        if (conversationIndex === -1) {
          // New conversation
          return [
            {
              id: message.id,
              participants: [message.sender!],
              lastMessage: message,
              unreadCount: 1,
              lastMessageAt: message.createdAt,
              isBlocked: false,
            },
            ...prevConversations,
          ];
        }

        // Update existing conversation
        const updatedConversations = [...prevConversations];
        const conversation = { ...updatedConversations[conversationIndex] };
        conversation.lastMessage = message;
        conversation.lastMessageAt = message.createdAt;
        conversation.unreadCount += 1;
        updatedConversations.splice(conversationIndex, 1);
        updatedConversations.unshift(conversation);
        return updatedConversations;
      });
    });
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const { conversations: newConversations, total } = await MessagingService.getConversations(page);
      setConversations((prev) => (page === 1 ? newConversations : [...prev, ...newConversations]));
      setHasMore(conversations.length < total);
    } catch (err) {
      setError('Failed to load conversations');
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    onSelectConversation(conversation);
    navigate(`/messages/${conversation.id}`);
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Messages</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => {
          const otherParticipant = conversation.participants[0];
          const isSelected = conversation.id === selectedConversationId;
          
          return (
            <div
              key={conversation.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer ${
                isSelected ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleConversationClick(conversation)}
            >
              <div className="flex items-center space-x-3">
                <Avatar
                  src={otherParticipant.avatarUrl}
                  alt={otherParticipant.username}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium truncate">
                      {otherParticipant.username}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {conversation.lastMessageAt &&
                        formatDistanceToNow(new Date(conversation.lastMessageAt), {
                          addSuffix: true,
                        })}
                    </span>
                  </div>
                  <div className="flex justify-between items-start mt-1">
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-500 rounded-full">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {loading && (
          <div className="p-4 text-center text-gray-500">
            Loading...
          </div>
        )}
        
        {!loading && hasMore && (
          <button
            className="w-full p-4 text-blue-500 hover:bg-gray-50"
            onClick={loadMore}
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}; 