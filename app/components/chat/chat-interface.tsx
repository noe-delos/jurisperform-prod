/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { CourseLevel, getCoursesByLevel, findCourseById } from '@/app/lib/courses';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Bot, User, Loader2, FileText, Search, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import React from 'react';

interface ChatInterfaceProps {
  userId: string;
  userLevel?: CourseLevel;
}

// Component to render markdown with custom course selection handling
function CleanMarkdown({ 
  content, 
  onCourseDataExtracted 
}: { 
  content: string; 
  onCourseDataExtracted: (data: any) => void;
}) {
  // Extract course selection data before rendering
  useEffect(() => {
    console.log('🔍 Checking content for course selection data:', content.substring(0, 200) + '...');
    
    // Multiple regex patterns to catch different formats
    const patterns = [
      /`COURSE_SELECTION_DATA:(\{[^`]+\})`/g,
      /COURSE_SELECTION_DATA:(\{[^\n]+\})/g,
      /`COURSE_SELECTION_DATA:(\{[\s\S]*?\})`/g
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        try {
          console.log('🎯 Found course selection data match:', match[1]);
          const courseData = JSON.parse(match[1]);
          console.log('🎯 Successfully extracted course selection data:', courseData);
          onCourseDataExtracted(courseData);
          return; // Exit once we find valid data
        } catch (error) {
          console.error('❌ Failed to parse course selection data:', error, 'Raw match:', match[1]);
        }
      }
    }
    
    console.log('🔍 No course selection data found in content');
  }, [content, onCourseDataExtracted]);

  // Custom components for ReactMarkdown
  const components = useMemo(() => ({
    // Intercept code blocks
    code({ node, inline, className, children, ...props }: any) {
      const content = String(children).replace(/\n$/, '');
      
      console.log('🔍 Code block content:', content.substring(0, 50) + '...');
      
      // Check if this is a course selection data block
      if (content.includes('COURSE_SELECTION_DATA:')) {
        console.log('🚫 Blocking course selection data code block from rendering');
        return null;
      }
      
      // For other code blocks, render normally
      if (inline) {
        return (
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold" {...props}>
            {children}
          </code>
        );
      }
      
      return (
        <pre className="overflow-x-auto rounded-lg bg-muted p-4">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      );
    },
    // Override paragraph to filter out hidden content
    p({ children, ...props }: any) {
      // Check if this paragraph contains course selection data
      if (children) {
        const childrenArray = React.Children.toArray(children);
        
        // Check if any child contains the course selection pattern
        const hasHiddenData = childrenArray.some((child: any) => {
          if (typeof child === 'string') {
            const hasData = child.includes('COURSE_SELECTION_DATA:');
            if (hasData) {
              console.log('🚫 Blocking paragraph with course selection data (string):', child.substring(0, 100));
            }
            return hasData;
          }
          if (React.isValidElement(child) && (child as any).props?.children) {
            const content = String((child as any).props.children);
            const hasData = content.includes('COURSE_SELECTION_DATA:');
            if (hasData) {
              console.log('🚫 Blocking paragraph with course selection data (element):', content.substring(0, 100));
            }
            return hasData;
          }
          return false;
        });
        
        if (hasHiddenData) {
          return null;
        }
      }
      
      return <p {...props}>{children}</p>;
    },
    // Override text nodes to filter out course selection data
    text({ children, ...props }: any) {
      const content = String(children);
      if (content.includes('COURSE_SELECTION_DATA:')) {
        console.log('🚫 Blocking text node with course selection data:', content.substring(0, 100));
        return null;
      }
      return children;
    }
  }), []);

  // Clean the content to remove course selection data
  const cleanedContent = useMemo(() => {
    console.log('🧹 Cleaning content, original length:', content.length);
    
    // Multiple patterns to remove course selection data
    let cleaned = content;
    
    // Remove different possible formats
    const removePatterns = [
      /`COURSE_SELECTION_DATA:\{[^`]+\}`/g,
      /COURSE_SELECTION_DATA:\{[^\n]+\}/g,
      /`COURSE_SELECTION_DATA:\{[\s\S]*?\}`/g
    ];
    
    for (const pattern of removePatterns) {
      const before = cleaned.length;
      cleaned = cleaned.replace(pattern, '');
      if (cleaned.length !== before) {
        console.log('🧹 Removed course selection data using pattern:', pattern);
      }
    }
    
    cleaned = cleaned.trim();
    console.log('🧹 Cleaned content length:', cleaned.length);
    
    return cleaned;
  }, [content]);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown components={components}>{cleanedContent}</ReactMarkdown>
    </div>
  );
}

export function ChatInterface({ userId, userLevel }: ChatInterfaceProps) {
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel>(userLevel || 'L1');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handler for course data extraction
  const handleCourseDataExtracted = (courseData: any) => {
    const { courseId, level: courseLevel, courseName, confidence, reason } = courseData;
    console.log('🎯 Handling extracted course data:', { 
      courseId, 
      courseLevel, 
      courseName, 
      confidence, 
      reason,
      currentLevel: selectedLevel,
      currentCourseId: selectedCourseId
    });
    
    // Update level if different
    if (courseLevel !== selectedLevel) {
      console.log('📈 Changing level from', selectedLevel, 'to', courseLevel);
      setSelectedLevel(courseLevel);
    }
    
    // Update course selection
    if (courseId !== selectedCourseId) {
      console.log('📚 Changing course from', selectedCourseId, 'to', courseId);
      setSelectedCourseId(courseId);
    }
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput,
  } = useChat({
    api: '/api/chat',
    body: {
      selectedLevel,
      selectedCourseId,
    },
    onToolCall: ({ toolCall }: any) => {
      console.log('🔧 Tool call in component:', toolCall);
      
      // Handle tool calls - update selected course if relevant
      if (toolCall.toolName === 'findRelevantCourse' && (toolCall as any).result?.course) {
        const foundCourse = toolCall.result.course;
        console.log('🔍 Found course via findRelevantCourse:', foundCourse);
        if (foundCourse.level === selectedLevel) {
          setSelectedCourseId(foundCourse.id);
        }
      }
    },
    onFinish: ({ text, toolInvocations }: any) => {
      console.log('✅ Chat finished with message:', { text: text.slice(0, 100), toolInvocations });
      
      // Course data extraction is now handled by the CleanMarkdown component
      // Process tool invocations for findRelevantCourse fallback
      if (toolInvocations) {
        toolInvocations.forEach((invocation: any) => {
          if (invocation.toolName === 'findRelevantCourse' && invocation.result?.course) {
            const foundCourse = invocation.result.course;
            console.log('🔍 Found course via findRelevantCourse (onFinish):', foundCourse);
            if (foundCourse.level === selectedLevel && foundCourse.id !== selectedCourseId) {
              console.log('📚 Updating course selection via findRelevantCourse');
              setSelectedCourseId(foundCourse.id);
            }
          }
        });
      }
    },
  });

  const courses = getCoursesByLevel(selectedLevel);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleSubmit(e);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header with course selection */}
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

      {/* Messages */}
      <Card className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-2">Bienvenue sur JurisPerform Chat</p>
              <p className="text-sm">Posez vos questions sur vos cours de droit.</p>
            </div>
          )}

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
                      <CleanMarkdown 
                        content={message.content} 
                        onCourseDataExtracted={handleCourseDataExtracted}
                      />
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
                        {tool.toolName === 'updateCourseSelection' && (
                          <>
                            <Target className="h-3 w-3" />
                            <span>Mise à jour de la sélection de cours...</span>
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

      {/* Input */}
      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <Textarea
          value={input}
          onChange={handleInputChange}
          placeholder={`Posez votre question sur ${selectedCourseId ? findCourseById(selectedCourseId)?.name : 'vos cours de droit'}...`}
          className="flex-1 min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e as any);
            }
          }}
        />
        <Button type="submit" size="icon" className="h-[80px] w-[80px]" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
}