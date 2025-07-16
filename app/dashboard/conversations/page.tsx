/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { Search, MessageSquare, Trash2, Calendar, ChevronLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { fetchConversations, deleteConversation } from '@/app/lib/services/conversation';
import { ConversationPreview } from '@/app/lib/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function ConversationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  
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
    queryKey: ['conversations-all'],
    queryFn: ({ pageParam = 0 }) => fetchConversations({ pageParam, limit: 30 }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  const fetchNext = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Auto-fetch more when scrolling
  React.useEffect(() => {
    if (inView) {
      fetchNext();
    }
  }, [inView, fetchNext]);

  const conversations = data?.pages.flatMap((page) => page.data) ?? [];

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter((conversation) => 
      conversation.title.toLowerCase().includes(query) ||
      conversation.last_message?.toLowerCase().includes(query) ||
      conversation.selected_level?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

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

  const handleSelectConversation = (conversationId: string) => {
    router.push(`/dashboard?conversation=${conversationId}`);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Retour
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Toutes les conversations</h1>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher dans vos conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Card key={i} className="p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Erreur lors du chargement
                </h3>
                <p className="text-gray-500 mb-4">
                  Impossible de charger les conversations
                </p>
                <Button onClick={() => refetch()}>
                  Réessayer
                </Button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'Aucun résultat trouvé' : 'Aucune conversation'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? `Aucune conversation ne correspond à "${searchQuery}"`
                    : 'Vous n\'avez pas encore de conversations'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Results count */}
                {searchQuery && (
                  <p className="text-sm text-gray-600 mb-4">
                    {filteredConversations.length} résultat(s) pour "{searchQuery}"
                  </p>
                )}

                {/* Conversations list */}
                {filteredConversations.map((conversation, index) => {
                  const updatedAt = new Date(conversation.updated_at);
                  
                  return (
                    <motion.div
                      key={conversation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.02,
                        ease: 'easeOut',
                      }}
                    >
                      <Card 
                        className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                        onClick={() => handleSelectConversation(conversation.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
                              <h3 className="font-medium text-gray-900 truncate">
                                {conversation.title}
                              </h3>
                              {conversation.selected_level && (
                                <span className="inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                                  {conversation.selected_level}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {format(updatedAt, 'dd MMMM yyyy à HH:mm', { locale: fr })}
                              </span>
                            </div>
                            
                            {conversation.last_message && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {conversation.last_message}
                              </p>
                            )}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-4"
                            onClick={(e) => handleDeleteConversation(conversation.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}

                {/* Infinite scroll trigger */}
                <div ref={ref} className="flex justify-center py-8">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Chargement de plus de conversations...</span>
                    </div>
                  )}
                </div>

                {/* End of feed message */}
                {!hasNextPage && conversations.length > 0 && !searchQuery && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">
                      Vous avez atteint la fin de vos conversations
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}