/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/utils/supabase/client';
import { Conversation, Message, ConversationWithMessages, ConversationPreview } from '../types/chat';
import { CourseLevel } from '../courses';

const supabase = createClient();

export interface CreateConversationData {
  title: string;
  selectedLevel?: CourseLevel;
  selectedCourseId?: string;
}

export interface FetchConversationsParams {
  pageParam?: number;
  limit?: number;
}

export interface FetchConversationsResponse {
  data: ConversationPreview[];
  nextPage?: number;
  hasMore: boolean;
}

export async function createConversation(data: CreateConversationData): Promise<Conversation> {
  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Auth error:', authError);
    throw new Error('User not authenticated');
  }

  console.log('Creating conversation for user:', user.id);
  console.log('Conversation data:', data);

  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      title: data.title,
      selected_level: data.selectedLevel,
      selected_course_id: data.selectedCourseId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  console.log('Created conversation:', conversation);
  return conversation;
}

export async function fetchConversations({ 
  pageParam = 0, 
  limit = 20 
}: FetchConversationsParams): Promise<FetchConversationsResponse> {
  const from = pageParam * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('conversations')
    .select(`
      id,
      title,
      selected_level,
      selected_course_id,
      updated_at,
      messages!inner(content, created_at)
    `)
    .order('updated_at', { ascending: false })
    .range(from, to)
    .limit(limit);

  if (error) {
    console.error('Error fetching conversations:', error);
    throw new Error('Failed to fetch conversations');
  }

  const conversations: ConversationPreview[] = data.map((conv: any) => ({
    id: conv.id,
    title: conv.title,
    selected_level: conv.selected_level,
    selected_course_id: conv.selected_course_id,
    updated_at: conv.updated_at,
    last_message: conv.messages?.[0]?.content || '',
  }));

  return {
    data: conversations,
    nextPage: data.length === limit ? pageParam + 1 : undefined,
    hasMore: data.length === limit,
  };
}

export async function fetchConversationWithMessages(conversationId: string): Promise<ConversationWithMessages> {
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (convError) {
    console.error('Error fetching conversation:', convError);
    throw new Error('Failed to fetch conversation');
  }

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    console.error('Error fetching messages:', messagesError);
    throw new Error('Failed to fetch messages');
  }

  return {
    ...conversation,
    messages: messages || [],
  };
}

export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  toolCalls?: any
): Promise<Message> {
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      tool_calls: toolCalls,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving message:', error);
    throw new Error('Failed to save message');
  }

  return message;
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    console.error('Error deleting conversation:', error);
    throw new Error('Failed to delete conversation');
  }
}

export async function updateConversationTitle(conversationId: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', conversationId);

  if (error) {
    console.error('Error updating conversation title:', error);
    throw new Error('Failed to update conversation title');
  }
}