/* eslint-disable @typescript-eslint/no-explicit-any */
import { CourseLevel } from '../courses';

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  selected_level?: CourseLevel;
  selected_course_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: any;
  created_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface ConversationPreview {
  id: string;
  title: string;
  selected_level?: CourseLevel;
  selected_course_id?: string;
  updated_at: string;
  last_message?: string;
}