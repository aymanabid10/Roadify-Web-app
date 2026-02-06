"use client";

import { useAuth } from "@/contexts/auth-context";
import { ChatSidebar } from "./ChatSidebar";
import { ChatContainer } from "./ChatContainer";

export function ChatWrapper() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) return null;

  return (
    <>
      <ChatSidebar />
      <ChatContainer />
    </>
  );
}