'use client';

import { useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { Loader2, MessageSquare, Trash2, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { fetchConversations, deleteConversation } from '@/app/lib/services/conversation';
import { ConversationPreview } from '@/app/lib/types/chat';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConversationHistoryProps {
  onSelectConversation?: (conversation: ConversationPreview) => void;
  selectedConversationId?: string;
  isCollapsed?: boolean;
}

export function ConversationHistory({ 
  onSelectConversation,
  selectedConversationId,
  isCollapsed = false 
}: ConversationHistoryProps) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: ({ pageParam = 0 }) => fetchConversations({ pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const fetchNext = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (inView) {
      fetchNext();
    }
  }, [inView, fetchNext]);

  const conversations = data?.pages.flatMap((page) => page.data) ?? [];

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

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          Erreur lors du chargement
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {isCollapsed ? 'Aucune conversation' : 'Aucune conversation pour le moment'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation, index) => {
        const isSelected = selectedConversationId === conversation.id;
        const updatedAt = new Date(conversation.updated_at);
        
        return (
          <motion.div
            key={conversation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              ease: 'easeOut',
            }}
          >
            <div
              className={cn(
                'group flex items-center gap-2 rounded-lg p-2 cursor-pointer transition-all duration-200 hover:bg-gray-100',
                isSelected && 'bg-primary/10 border-primary/20',
                isCollapsed && 'justify-center'
              )}
              onClick={() => handleSelectConversation(conversation)}
              title={isCollapsed ? conversation.title : undefined}
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      {conversation.title}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {format(updatedAt, 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                  
                  {conversation.selected_level && (
                    <div className="mt-1">
                      <span className="inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                        {conversation.selected_level}
                      </span>
                    </div>
                  )}
                  
                  {conversation.last_message && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {conversation.last_message}
                    </p>
                  )}
                </div>
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-16 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {conversation.title}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Infinite scroll trigger */}
      <div ref={ref} className="flex justify-center py-2">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {!isCollapsed && <span className="text-xs">Chargement...</span>}
          </div>
        )}
      </div>

      {/* End of feed message */}
      {!hasNextPage && conversations.length > 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            {isCollapsed ? '•••' : 'Fin de l\'historique'}
          </p>
        </div>
      )}
    </div>
  );
}