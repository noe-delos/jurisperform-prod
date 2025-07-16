/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { DashboardLayoutClient } from './dashboard-layout-client';
import type { User, UserCourseAccess } from '@/lib/types';

interface DashboardWrapperProps {
  user: User;
  courseAccess: UserCourseAccess[];
  onLogout: () => void;
  children: React.ReactNode;
}

export function DashboardWrapper({ user, courseAccess, onLogout, children }: DashboardWrapperProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string>();

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    // Trigger conversation selection in the dashboard page
    window.dispatchEvent(new CustomEvent('selectConversation', { detail: conversationId }));
  };

  return (
    <DashboardLayoutClient
      user={user}
      courseAccess={courseAccess}
      onLogout={onLogout}
      onSelectConversation={handleConversationSelect}
    >
      {children}
    </DashboardLayoutClient>
  );
}