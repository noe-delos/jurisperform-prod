/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Trash2, ChevronRight } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

import { fetchConversations, deleteConversation } from '@/app/lib/services/conversation';
import { ConversationPreview } from '@/app/lib/types/chat';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SidebarConversationHistoryProps {
  onSelectConversation?: (conversation: ConversationPreview) => void;
  selectedConversationId?: string;
  isCollapsed?: boolean;
}

export function SidebarConversationHistory({ 
  onSelectConversation,
  selectedConversationId,
  isCollapsed = false 
}: SidebarConversationHistoryProps) {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['conversations-sidebar'],
    queryFn: () => fetchConversations({ pageParam: 0, limit: 15 }),
  });

  const conversations = data?.data ?? [];

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      return;
    }

    try {
      await deleteConversation(conversationId);
      refetch();
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleSelectConversation = (conversation: ConversationPreview) => {
    onSelectConversation?.(conversation);
  };

  // Group conversations by time period
  const groupedConversations = conversations.reduce((groups: {
    today: ConversationPreview[];
    yesterday: ConversationPreview[];
    earlier: ConversationPreview[];
  }, conversation) => {
    const updatedAt = new Date(conversation.updated_at);
    
    if (isToday(updatedAt)) {
      groups.today.push(conversation);
    } else if (isYesterday(updatedAt)) {
      groups.yesterday.push(conversation);
    } else {
      groups.earlier.push(conversation);
    }
    
    return groups;
  }, { today: [], yesterday: [], earlier: [] });

  if (isLoading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-2">
        <p className="text-xs text-muted-foreground">
          Erreur lors du chargement
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-1 h-6 text-xs">
          Réessayer
        </Button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-4">
        <MessageSquare className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
        <p className="text-xs text-muted-foreground">
          {isCollapsed ? 'Aucune conversation' : 'Aucune conversation pour le moment'}
        </p>
      </div>
    );
  }

  const renderConversationGroup = (title: string, conversations: ConversationPreview[]) => {
    if (conversations.length === 0) return null;

    return (
      <div key={title} className="mb-3">
        {!isCollapsed && (
          <h4 className="text-xs font-medium text-gray-400 mb-1 px-1">
            {title}
          </h4>
        )}
        <div className="space-y-0.5">
          {conversations.map((conversation) => {
            const isSelected = selectedConversationId === conversation.id;
            
            return (
              <div
                key={conversation.id}
                className={cn(
                  'group flex items-center gap-2 rounded px-2 py-1 cursor-pointer transition-all duration-200 hover:bg-gray-100',
                  isSelected && 'bg-primary/10 border-primary/20',
                  isCollapsed && 'justify-center'
                )}
                onClick={() => handleSelectConversation(conversation)}
                title={isCollapsed ? conversation.title : undefined}
              >
                <MessageSquare className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                
                {!isCollapsed && (
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <p className="text-xs font-medium truncate pr-1">
                      {conversation.title}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                )}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-16 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {conversation.title}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {/* Conversations grouped by time */}
      {renderConversationGroup('Aujourd\'hui', groupedConversations.today)}
      {renderConversationGroup('Hier', groupedConversations.yesterday)}
      {renderConversationGroup('Plus ancien', groupedConversations.earlier)}

      {/* View all conversations button */}
      <div className="mt-4 pt-2 border-t border-gray-200">
        <Link href="/dashboard/conversations">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 group",
              isCollapsed ? "justify-center px-2" : "justify-between"
            )}
            title={isCollapsed ? "Toutes les conversations" : undefined}
          >
            {!isCollapsed && (
              <>
                <span className="text-xs">Toutes les conversations</span>
                <ChevronRight className="h-3 w-3" />
              </>
            )}
            {isCollapsed && (
              <MessageSquare className="h-4 w-4" />
            )}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-12 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Toutes les conversations
              </div>
            )}
          </Button>
        </Link>
      </div>
    </div>
  );
}