/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "ai/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CourseLevel, getCoursesByLevel } from "@/app/lib/courses";
import {
  createConversation,
  saveMessage,
  fetchConversationWithMessages,
} from "@/app/lib/services/conversation";
import { ConversationWithMessages } from "@/app/lib/types/chat";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, Search, Check } from "lucide-react";
import { Icon } from "@iconify/react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";

interface DashboardChatImprovedProps {
  userId: string;
  userLevel?: CourseLevel;
  selectedConversationId?: string;
  onConversationCreated?: (conversationId: string) => void;
  onConversationStarted?: () => void;
}

// Component to render markdown with course selection data extraction
function CleanMarkdown({
  content,
  onCourseDataExtracted,
}: {
  content: string;
  onCourseDataExtracted: (data: any) => void;
}) {
  // Extract course selection data AND clean content in one step
  const { cleanedContent, extractedData } = useMemo(() => {
    console.log("🔍 Processing content, original length:", content.length);
    console.log("🔍 Content preview:", content.substring(0, 200) + "...");

    // Multiple regex patterns to catch different formats
    const patterns = [
      /`COURSE_SELECTION_DATA:(\{[^`]+\})`/g,
      /COURSE_SELECTION_DATA:(\{[^\n]+\})/g,
      /`COURSE_SELECTION_DATA:(\{[\s\S]*?\})`/g,
    ];

    let extractedData = null;

    // Try to extract course selection data
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        try {
          console.log("🎯 Found course selection data match:", match[1]);
          const courseData = JSON.parse(match[1]);
          console.log(
            "🎯 Successfully extracted course selection data:",
            courseData
          );
          extractedData = courseData;
          break; // Exit once we find valid data
        } catch (error) {
          console.error(
            "❌ Failed to parse course selection data:",
            error,
            "Raw match:",
            match[1]
          );
        }
      }
    }

    if (!extractedData) {
      console.log("🔍 No course selection data found in content");
    }

    // Clean the content to remove course selection data
    let cleaned = content;

    // Remove different possible formats
    const removePatterns = [
      /`COURSE_SELECTION_DATA:\{[^`]+\}`/g,
      /COURSE_SELECTION_DATA:\{[^\n]+\}/g,
      /`COURSE_SELECTION_DATA:\{[\s\S]*?\}`/g,
    ];

    for (const pattern of removePatterns) {
      const before = cleaned.length;
      cleaned = cleaned.replace(pattern, "");
      if (cleaned.length !== before) {
        console.log("🧹 Removed course selection data using pattern:", pattern);
      }
    }

    cleaned = cleaned.trim();
    console.log("🧹 Cleaned content length:", cleaned.length);

    return { cleanedContent: cleaned, extractedData };
  }, [content]);

  // Trigger course data extraction when data is found
  useEffect(() => {
    if (extractedData) {
      console.log("🎯 Triggering course data extraction:", extractedData);
      onCourseDataExtracted(extractedData);
    }
  }, [extractedData, onCourseDataExtracted]);

  // Custom components for ReactMarkdown
  const components = useMemo(
    () => ({
      h1: ({ children }: any) => (
        <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0 text-gray-900 dark:text-gray-100">
          {children}
        </h1>
      ),
      h2: ({ children }: any) => (
        <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0 text-gray-900 dark:text-gray-100">
          {children}
        </h2>
      ),
      h3: ({ children }: any) => (
        <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-gray-800 dark:text-gray-200">
          {children}
        </h3>
      ),
      h4: ({ children }: any) => (
        <h4 className="text-base font-semibold mb-2 mt-3 first:mt-0 text-gray-800 dark:text-gray-200">
          {children}
        </h4>
      ),
      p: ({ children }: any) => {
        // Check if this paragraph contains course selection data
        if (children) {
          const childrenArray = React.Children.toArray(children);

          // Check if any child contains the course selection pattern
          const hasHiddenData = childrenArray.some((child) => {
            if (typeof child === "string") {
              const hasData = child.includes("COURSE_SELECTION_DATA:");
              if (hasData) {
                console.log(
                  "🚫 Blocking paragraph with course selection data (string):",
                  child.substring(0, 100)
                );
              }
              return hasData;
            }
            if (React.isValidElement(child) && (child as any).props?.children) {
              const content = String((child as any).props.children);
              const hasData = content.includes("COURSE_SELECTION_DATA:");
              if (hasData) {
                console.log(
                  "🚫 Blocking paragraph with course selection data (element):",
                  content.substring(0, 100)
                );
              }
              return hasData;
            }
            return false;
          });

          if (hasHiddenData) {
            return null;
          }
        }

        return (
          <div className="mb-4 mt-4 first:mt-0 last:mb-0 leading-relaxed text-gray-700 dark:text-gray-300">
            {children}
          </div>
        );
      },
      ul: ({ children }: any) => (
        <ul className="mb-4 mt-4 first:mt-0 last:mb-0 pl-6 space-y-1">
          {children}
        </ul>
      ),
      ol: ({ children }: any) => (
        <ol className="mb-4 mt-4 first:mt-0 last:mb-0 pl-6 space-y-1">
          {children}
        </ol>
      ),
      li: ({ children }: any) => (
        <li className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {children}
        </li>
      ),
      strong: ({ children }: any) => (
        <strong className="font-semibold text-gray-900 dark:text-gray-100">
          {children}
        </strong>
      ),
      em: ({ children }: any) => (
        <em className="italic text-gray-800 dark:text-gray-200">{children}</em>
      ),
      blockquote: ({ children }: any) => (
        <blockquote className="border-l-4 border-gray-300 pl-4 py-2 my-4 italic text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
          {children}
        </blockquote>
      ),
      code: ({ children, className }: any) => {
        const content = String(children).replace(/\n$/, "");

        console.log("🔍 Code block content:", content.substring(0, 50) + "...");

        // Check if this is a course selection data block
        if (content.includes("COURSE_SELECTION_DATA:")) {
          console.log(
            "🚫 Blocking course selection data code block from rendering"
          );
          return null;
        }

        const isInline = !className;
        if (isInline) {
          return (
            <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
              {children}
            </code>
          );
        }
        return <code className={className}>{children}</code>;
      },
      pre: ({ children }: any) => (
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4 border">
          {children}
        </pre>
      ),
      // Override text nodes to filter out course selection data
      text: ({ children }: any) => {
        const content = String(children);
        if (content.includes("COURSE_SELECTION_DATA:")) {
          console.log(
            "🚫 Blocking text node with course selection data:",
            content.substring(0, 100)
          );
          return null;
        }
        return children;
      },
    }),
    []
  );

  return (
    <div className="prose w-full max-w-none break-words dark:prose-invert text-base">
      <ReactMarkdown components={components}>{cleanedContent}</ReactMarkdown>
    </div>
  );
}

export function DashboardChatImproved({
  userLevel,
  selectedConversationId,
  onConversationCreated,
  onConversationStarted,
}: DashboardChatImprovedProps) {
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel>(
    userLevel || "L1"
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [currentConversation, setCurrentConversation] =
    useState<ConversationWithMessages | null>(null);
  const [isNewConversation, setIsNewConversation] = useState(true);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Handler for course data extraction
  const handleCourseDataExtracted = (courseData: any) => {
    const {
      courseId,
      level: courseLevel,
      courseName,
      confidence,
      reason,
    } = courseData;
    console.log("🎯 Handling extracted course data:", {
      courseId,
      courseLevel,
      courseName,
      confidence,
      reason,
      currentLevel: selectedLevel,
      currentCourseId: selectedCourseId,
    });

    // Update level if different
    if (courseLevel !== selectedLevel) {
      console.log("📈 Changing level from", selectedLevel, "to", courseLevel);
      setSelectedLevel(courseLevel);
    }

    // Update course selection
    if (courseId !== selectedCourseId) {
      console.log("📚 Changing course from", selectedCourseId, "to", courseId);
      setSelectedCourseId(courseId);
    }
  };

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    setInput,
  } = useChat({
    api: "/api/chat",
    body: {
      selectedLevel,
      selectedCourseId,
      conversationId: currentConversation?.id,
    },
    streamProtocol: "data",
    onToolCall: ({ toolCall }: any) => {
      console.log("🔧 Tool call in component:", {
        toolName: toolCall.toolName,
        state: toolCall.state,
        args: toolCall.args,
        result: toolCall.result,
      });

      // Handle tool calls - update selected course if relevant
      if (
        toolCall.toolName === "findRelevantCourse" &&
        toolCall.state === "result" &&
        toolCall.result?.course
      ) {
        const foundCourse = toolCall.result.course;
        console.log("🎯 Found course:", foundCourse);

        // Update the selected course regardless of level, but also update level if needed
        console.log("📌 Updating selected course to:", foundCourse.id);
        setSelectedCourseId(foundCourse.id);

        // If the found course is at a different level, update the level too
        if (foundCourse.level !== selectedLevel) {
          console.log("📌 Also updating level to:", foundCourse.level);
          setSelectedLevel(foundCourse.level as CourseLevel);
        }
      }
    },
    onFinish: async (message) => {
      console.log("✅ Chat finished with message:", {
        contentLength: message.content.length,
        contentPreview: message.content.slice(0, 100),
        toolInvocations: message.toolInvocations?.length || 0,
      });
      // Save the conversation and messages
      if (currentConversation) {
        await saveMessage(currentConversation.id, "assistant", message.content);
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
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
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const saveMessageMutation = useMutation({
    mutationFn: ({
      conversationId,
      role,
      content,
      toolCalls,
    }: {
      conversationId: string;
      role: "user" | "assistant" | "system";
      content: string;
      toolCalls?: any;
    }) => saveMessage(conversationId, role, content, toolCalls),
  });

  // Load conversation when selectedConversationId changes
  useEffect(() => {
    if (selectedConversationId) {
      fetchConversationWithMessages(selectedConversationId)
        .then((conversation) => {
          setCurrentConversation(conversation);
          setIsNewConversation(false);
          setHasStartedChat(true);
          setSelectedLevel(conversation.selected_level || "L1");
          setSelectedCourseId(conversation.selected_course_id || "");

          // Convert messages to the format expected by useChat
          const chatMessages = conversation.messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            toolInvocations: msg.tool_calls,
          }));
          setMessages(chatMessages);
          onConversationStarted?.();
        })
        .catch((error) => {
          console.error("Error loading conversation:", error);
        });
    } else {
      setCurrentConversation(null);
      setIsNewConversation(true);
      setHasStartedChat(false);
      setMessages([]);
    }
  }, [selectedConversationId, setMessages, onConversationStarted]);

  // Listen for course selection from dashboard
  useEffect(() => {
    const handleCourseSelection = (event: CustomEvent) => {
      const course = event.detail;
      // Map course type to course ID - you may need to adjust this based on your course data
      const courseId = course.toLowerCase();
      setSelectedCourseId(courseId);

      // Update level based on course
      if (course === "L1") setSelectedLevel("L1");
      else if (course === "L2") setSelectedLevel("L2");
      else if (course === "L3") setSelectedLevel("L3");
      else if (course === "CRFPA") setSelectedLevel("CRFPA");
    };

    window.addEventListener(
      "courseSelected",
      handleCourseSelection as EventListener
    );

    return () => {
      window.removeEventListener(
        "courseSelected",
        handleCourseSelection as EventListener
      );
    };
  }, []);

  const courses = getCoursesByLevel(selectedLevel);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto scroll only on specific events
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    // Only scroll when:
    // 1. User sends a message (role === 'user')
    // 2. AI finishes responding (role === 'assistant' and not loading)
    if (
      lastMessage.role === "user" ||
      (lastMessage.role === "assistant" && !isLoading)
    ) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();

    // Start chat mode on first submission
    if (!hasStartedChat) {
      setHasStartedChat(true);
      onConversationStarted?.();
    }

    // Create conversation if it's a new one
    if (isNewConversation) {
      const title =
        userMessage.length > 50
          ? userMessage.slice(0, 50) + "..."
          : userMessage;

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
        role: "user",
        content: userMessage,
      });
    }

    handleSubmit(e);
  };

  // Tool render component for persistent display
  const ToolRender = ({
    toolName,
    status,
  }: {
    toolName: string;
    status: string;
  }) => {
    const getToolInfo = (name: string) => {
      switch (name) {
        case "findRelevantCourse":
          return { icon: Search, label: "Recherche de cours" };
        case "loadCoursePDF":
          return { icon: FileText, label: "Cours identifié" };
        default:
          return { icon: Loader2, label: "Traitement en cours" };
      }
    };

    const { icon: IconComponent, label } = getToolInfo(toolName);

    return (
      <div className="flex items-center gap-2 text-xs py-1 ml-1">
        {status === "call" ? (
          <>
            <IconComponent className="h-3 w-3 animate-spin text-muted-foreground" />
            <AnimatedShinyText className="text-xs px-2 py-0.5 rounded-full">
              {label}
            </AnimatedShinyText>
          </>
        ) : (
          <>
            <div className="h-3 w-3 rounded-full bg-blue-500 flex items-center justify-center">
              <Check className="h-2 w-2 text-white" />
            </div>
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {label}
            </span>
          </>
        )}
      </div>
    );
  };

  // Extract tool calls from messages - show all tools that were used
  const getToolCallsForMessage = (messageIndex: number) => {
    const message = messages[messageIndex];
    if (!message || message.role !== "assistant") return [];

    const toolCalls = [];

    // Check if message has tool invocations
    if (message.toolInvocations) {
      // Show all tool calls that were made
      for (const invocation of message.toolInvocations) {
        const toolCall = {
          toolName: invocation.toolName,
          status: invocation.state,
          args: invocation.args,
        };
        toolCalls.push(toolCall);
      }
    }

    return toolCalls;
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!hasStartedChat ? (
        /* Initial State - Centered */
        <motion.div
          key="initial"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.25,
            ease: "easeInOut",
          }}
          className="h-full flex flex-col justify-center"
        >
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={{
              duration: 0.25,
              ease: "easeInOut",
            }}
            className={cn(
              "shadow-soft mx-auto h-fit min-h-24 max-h-48 w-full max-w-3xl overflow-hidden rounded-[1.5rem] border-2 border-muted bg-card p-1 relative"
            )}
          >
            <form onSubmit={onSubmit} className="relative">
              <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Posez votre question sur le droit..."
                className="h-full w-full flex-1 resize-none border-none min-h-32 bg-transparent p-4 text-lg shadow-none focus-within:outline-none focus-visible:ring-0 pr-16 pb-16"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e as any);
                  }
                }}
              />

              {/* Level and Course Selection - Bottom Left */}
              <div className="absolute bottom-2 left-2 flex gap-1">
                <Select
                  value={selectedLevel}
                  onValueChange={(value) =>
                    setSelectedLevel(value as CourseLevel)
                  }
                >
                  <SelectTrigger className="w-fit h-8 text-xs rounded-full border-none bg-muted/70 hover:bg-muted cursor-pointer px-4 py-2">
                    <SelectValue placeholder="Niveau" />
                  </SelectTrigger>
                  <SelectContent className="shadow-soft rounded-xl border-muted/50 cursor-pointer">
                    <SelectItem value="L1" className="cursor-pointer">
                      L1
                    </SelectItem>
                    <SelectItem value="L2" className="cursor-pointer">
                      L2
                    </SelectItem>
                    <SelectItem value="L3" className="cursor-pointer">
                      L3
                    </SelectItem>
                    <SelectItem value="CRFPA" className="cursor-pointer">
                      CRFPA
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedCourseId || "none"}
                  onValueChange={(value) =>
                    setSelectedCourseId(value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-fit h-8 text-xs rounded-full border-none bg-muted/70 hover:bg-muted cursor-pointer px-4 py-2">
                    <SelectValue placeholder="Cours" />
                  </SelectTrigger>
                  <SelectContent className="shadow-soft rounded-xl border-muted/50 cursor-pointer">
                    <SelectItem value="none" className="cursor-pointer">
                      Aucun
                    </SelectItem>
                    {courses.map((course) => (
                      <SelectItem
                        key={course.id}
                        value={course.id}
                        className="cursor-pointer"
                      >
                        {course.name.length > 25
                          ? course.name.slice(0, 25) + "..."
                          : course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button - Bottom Right */}
              <Button
                type="submit"
                size="icon"
                className="absolute bottom-2 right-2 h-10 w-10 rounded-full"
                disabled={
                  isLoading ||
                  createConversationMutation.isPending ||
                  !input.trim()
                }
              >
                {isLoading || createConversationMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon icon="formkit:submit" className="h-4 w-4" />
                )}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      ) : (
        /* Chat State */
        <motion.div
          key="chat"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.25,
            delay: 0.1,
            ease: "easeInOut",
          }}
          className="h-full flex flex-col pt-10"
        >
          {/* Messages area */}
          <div className="flex-1 mb-4 overflow-hidden">
            <div className="h-full overflow-y-auto p-4 pt-8 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => {
                  const toolCalls = getToolCallsForMessage(index);

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.2,
                        ease: "easeOut",
                      }}
                    >
                      {/* Tool calls indicator - shown above the message */}
                      {toolCalls.length > 0 && message.role === "assistant" && (
                        <div className="mb-3 space-y-1">
                          {toolCalls.map((tool, toolIndex) => (
                            <ToolRender
                              key={toolIndex}
                              toolName={tool.toolName}
                              status={tool.status}
                            />
                          ))}
                        </div>
                      )}

                      <div
                        className={cn(
                          "flex",
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] px-4 py-2",
                            message.role === "user"
                              ? "bg-muted rounded-2xl"
                              : "bg-transparent"
                          )}
                        >
                          {message.role === "user" ? (
                            <p className="whitespace-pre-wrap">
                              {message.content}
                            </p>
                          ) : (
                            <CleanMarkdown
                              content={message.content}
                              onCourseDataExtracted={handleCourseDataExtracted}
                            />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Textarea at bottom for chat mode */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.25,
              delay: 0.15,
              ease: "easeInOut",
            }}
            className={cn(
              "shadow-soft h-fit min-h-24 max-h-48 w-full max-w-4xl mx-auto overflow-hidden rounded-[1.5rem] border-2 border-muted bg-card p-1 relative"
            )}
          >
            <form onSubmit={onSubmit} className="relative">
              <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Continuez la conversation..."
                className="h-full w-full flex-1 resize-none border-none min-h-32 bg-transparent p-4 text-lg shadow-none focus-within:outline-none focus-visible:ring-0 pr-16 pb-16"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e as any);
                  }
                }}
              />

              {/* Level and Course Selection - Bottom Left (also in chat mode) */}
              <div className="absolute bottom-2 left-2 flex gap-1">
                <Select
                  value={selectedLevel}
                  onValueChange={(value) =>
                    setSelectedLevel(value as CourseLevel)
                  }
                >
                  <SelectTrigger className="w-fit h-8 text-xs rounded-full border-none bg-muted/70 hover:bg-muted cursor-pointer px-4 py-2">
                    <SelectValue placeholder="Niveau" />
                  </SelectTrigger>
                  <SelectContent className="shadow-soft rounded-xl border-muted/50 cursor-pointer">
                    <SelectItem value="L1" className="cursor-pointer">
                      L1
                    </SelectItem>
                    <SelectItem value="L2" className="cursor-pointer">
                      L2
                    </SelectItem>
                    <SelectItem value="L3" className="cursor-pointer">
                      L3
                    </SelectItem>
                    <SelectItem value="CRFPA" className="cursor-pointer">
                      CRFPA
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedCourseId || "none"}
                  onValueChange={(value) =>
                    setSelectedCourseId(value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-fit h-8 text-xs rounded-full border-none bg-muted/70 hover:bg-muted cursor-pointer px-4 py-2">
                    <SelectValue placeholder="Cours" />
                  </SelectTrigger>
                  <SelectContent className="shadow-soft rounded-xl border-muted/50 cursor-pointer">
                    <SelectItem value="none" className="cursor-pointer">
                      Aucun
                    </SelectItem>
                    {courses.map((course) => (
                      <SelectItem
                        key={course.id}
                        value={course.id}
                        className="cursor-pointer"
                      >
                        {course.name.length > 25
                          ? course.name.slice(0, 25) + "..."
                          : course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button - Bottom Right */}
              <Button
                type="submit"
                size="icon"
                className="absolute bottom-2 right-2 h-10 w-10 rounded-full"
                disabled={
                  isLoading ||
                  createConversationMutation.isPending ||
                  !input.trim()
                }
              >
                {isLoading || createConversationMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon icon="formkit:submit" className="h-4 w-4" />
                )}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
