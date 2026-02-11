"use client";
import React from "react";
import { useChatStore } from "@/store/useChatStore";
import { useSignalR } from "@/hooks/useSignalR";
import { ChatWindow } from "./ChatWindow";

export function ChatContainer() {
  const openWindows = useChatStore((state) => state.openWindows);
  const closeChat = useChatStore((state) => state.closeChat);
  const openChat = useChatStore((state) => state.openChat);
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    setToken(localStorage.getItem("accessToken"));
  }, []);

  const connection = useSignalR(token);

  React.useEffect(() => {
    if (!connection) return;

    connection.on("ReceiveMessage", (msg) => {
      const isWindowOpen = useChatStore.getState().openWindows.some(w => w.userId === msg.senderId);
      
      if (!isWindowOpen) {
        // @ts-ignore
        useChatStore.getState().notifyNewMessage?.(msg.senderId);
      }
    });

    return () => connection.off("ReceiveMessage");
  }, [connection, openChat]);

  if (openWindows.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-24 flex flex-row-reverse items-end gap-4 z-50 pointer-events-none p-4 pb-0 max-w-[calc(100vw-100px)] overflow-x-auto no-scrollbar">
      {openWindows.map((win) => (
        <div key={win.userId} className="pointer-events-auto pb-4">
          <ChatWindow 
            userId={win.userId} 
            userName={win.userName} 
            connection={connection}
            onClose={() => closeChat(win.userId)}
          />
        </div>
      ))}
    </div>
  );
}