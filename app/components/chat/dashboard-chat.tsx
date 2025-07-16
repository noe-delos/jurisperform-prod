/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CourseLevel, getCoursesByLevel, findCourseById } from '@/app/lib/courses';
import { createConversation, saveMessage, fetchConversationWithMessages } from '@/app/lib/services/conversation';
import { ConversationWithMessages } from '@/app/lib/types/chat';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Bot, User, Loader2, FileText, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface DashboardChatProps {
  userId: string;
  userLevel?: CourseLevel;
  selectedConversationId?: string;
  onConversationCreated?: (conversationId: string) => void;
}

export function DashboardChat({ 
  userId, 
  userLevel, 
  selectedConversationId,
  onConversationCreated 
}: DashboardChatProps) {
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel>(userLevel || 'L1');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [currentConversation, setCurrentConversation] = useState<ConversationWithMessages | null>(null);
  const [isNewConversation, setIsNewConversation] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    setInput,
  } = useChat({
    api: '/api/chat',
    body: {
      selectedLevel,
      selectedCourseId,
      conversationId: currentConversation?.id,
    },
    onToolCall: ({ toolCall }: any) => {
      // Handle tool calls - update selected course if relevant
      if (toolCall.toolName === 'findRelevantCourse' && toolCall.result?.course) {
        const foundCourse = toolCall.result.course;
        if (foundCourse.level === selectedLevel) {
          setSelectedCourseId(foundCourse.id);
        }
      }
    },
    onFinish: async (message) => {
      // Save the conversation and messages
      if (currentConversation) {
        await saveMessage(currentConversation.id, 'assistant', message.content);
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (conversation) => {
      setCurrentConversation({
        ...conversation,
        messages: [],
      });
      setIsNewConversation(false);
      onConversationCreated?.(conversation.id);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const saveMessageMutation = useMutation({
    mutationFn: ({ conversationId, role, content, toolCalls }: {
      conversationId: string;
      role: 'user' | 'assistant' | 'system';
      content: string;
      toolCalls?: any;
    }) => saveMessage(conversationId, role, content, toolCalls),
  });

  // Load conversation when selectedConversationId changes
  useEffect(() => {
    if (selectedConversationId) {
      fetchConversationWithMessages(selectedConversationId).then((conversation) => {
        setCurrentConversation(conversation);
        setIsNewConversation(false);
        setSelectedLevel(conversation.selected_level || 'L1');
        setSelectedCourseId(conversation.selected_course_id || '');
        
        // Convert messages to the format expected by useChat
        const chatMessages = conversation.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          toolInvocations: msg.tool_calls,
        }));
        setMessages(chatMessages);
      }).catch((error) => {
        console.error('Error loading conversation:', error);
      });
    } else {
      setCurrentConversation(null);
      setIsNewConversation(true);
      setMessages([]);
    }
  }, [selectedConversationId, setMessages]);

  const courses = getCoursesByLevel(selectedLevel);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();

    // Create conversation if it's a new one
    if (isNewConversation) {
      const title = userMessage.length > 50 ? userMessage.slice(0, 50) + '...' : userMessage;
      
      createConversationMutation.mutate({
        title,
        selectedLevel,
        selectedCourseId: selectedCourseId || undefined,
      });
    }

    // Save user message if conversation exists
    if (currentConversation) {
      saveMessageMutation.mutate({
        conversationId: currentConversation.id,
        role: 'user',
        content: userMessage,
      });
    }

    handleSubmit(e);
  };

  // Extract tool calls from messages
  const getToolCallsForMessage = (messageIndex: number) => {
    const message = messages[messageIndex];
    if (!message || message.role !== 'assistant') return [];
    
    const toolCalls = [];
    
    // Check if message has tool invocations
    if (message.toolInvocations) {
      for (const invocation of message.toolInvocations) {
        toolCalls.push({
          toolName: invocation.toolName,
          status: invocation.state,
          args: invocation.args,
        });
      }
    }
    
    return toolCalls;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with course selection - only show for new conversations */}
      {(isNewConversation || !currentConversation) && (
        <div className="flex gap-2 mb-4">
          <Select value={selectedLevel} onValueChange={(value) => setSelectedLevel(value as CourseLevel)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="L1">L1</SelectItem>
              <SelectItem value="L2">L2</SelectItem>
              <SelectItem value="L3">L3</SelectItem>
              <SelectItem value="CRFPA">CRFPA</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCourseId || "none"} onValueChange={(value) => setSelectedCourseId(value === "none" ? "" : value)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Sélectionner un cours (optionnel)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun cours sélectionné</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Messages - only show if there are messages */}
      {messages.length > 0 && (
        <Card className="flex-1 overflow-hidden mb-4">
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => {
              const toolCalls = getToolCallsForMessage(index);
              
              return (
                <div key={message.id}>
                  <div
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                    )}

                    <div
                      className={cn(
                        'max-w-[70%] rounded-lg px-4 py-2',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Tool calls indicator */}
                  {toolCalls.length > 0 && (
                    <div className="ml-11 mt-2 space-y-1">
                      {toolCalls.map((tool: any, toolIndex: number) => (
                        <div
                          key={toolIndex}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          {tool.toolName === 'findRelevantCourse' && (
                            <>
                              <Search className="h-3 w-3" />
                              <span>Recherche du cours pertinent...</span>
                            </>
                          )}
                          {tool.toolName === 'loadCoursePDF' && (
                            <>
                              <FileText className="h-3 w-3" />
                              <span>Chargement du contenu du cours...</span>
                            </>
                          )}
                          {tool.status === 'completed' && (
                            <span className="text-green-600">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </Card>
      )}

      {/* Input - always at the bottom */}
      <form onSubmit={onSubmit} className="flex gap-2">
        <Textarea
          value={input}
          onChange={handleInputChange}
          placeholder={`${messages.length === 0 ? 'Commencez une nouvelle conversation...' : 'Continuez la conversation...'}`}
          className="flex-1 min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e as any);
            }
          }}
        />
        <Button 
          type="submit" 
          size="icon" 
          className="h-[80px] w-[80px]" 
          disabled={isLoading || createConversationMutation.isPending}
        >
          {isLoading || createConversationMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
}