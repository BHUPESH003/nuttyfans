import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ConversationList } from 'src/components/messaging/ConversationList';
import { ChatInterface } from 'src/components/messaging/ChatInterface';
import { Conversation } from 'src/types/messaging';

export const MessagingPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Conversation List - Fixed width sidebar */}
      <div className="w-80 border-r flex-shrink-0">
        <ConversationList
          onSelectConversation={handleSelectConversation}
          selectedConversationId={conversationId}
        />
      </div>

      {/* Chat Interface or Empty State */}
      <div className="flex-1">
        {selectedConversation ? (
          <ChatInterface
            conversationId={selectedConversation.id}
            otherUser={selectedConversation.participants[0]}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}; 