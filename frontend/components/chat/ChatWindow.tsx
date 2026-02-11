"use client";
import { useEffect, useState, useRef } from "react";
import { MessageDto, messagesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function ChatWindow({ userId, userName, connection, onClose }: any) {
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [text, setText] = useState("");
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesApi.getConversation(userId).then((res) => setMessages(res.data.reverse()));
  }, [userId]);

  useEffect(() => {
    if (!connection) return;
    const handleMessage = (msg: MessageDto) => {
      if (msg.senderId === userId || msg.receiverId === userId) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    connection.on("ReceiveMessage", handleMessage);
    return () => connection.off("ReceiveMessage");
  }, [connection, userId]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !connection) return;
    await connection.invoke("SendMessage", { receiverId: userId, content: text });
    setText("");
  };

  return (
    <div className="w-80 h-[420px] bg-card text-card-foreground border border-border rounded-t-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      {/* Header */}
      <div className="p-3 bg-primary text-primary-foreground flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6 border border-primary-foreground/20">
            <AvatarFallback className="text-[10px] bg-primary-foreground text-primary">
              {userName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-bold truncate max-w-[140px]">{userName}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/20 text-primary-foreground" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      {/* messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4 bg-background/50">
        <div className="flex flex-col gap-4">
          {messages.map((m) => {
            const isMe = m.senderId === user?.id;
            return (
              <div key={m.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar à côté du message */}
                <Avatar className="h-8 w-8 shrink-0 mb-1">
                  <AvatarFallback className="text-[10px]">
                    {isMe ? user?.username?.[0].toUpperCase() : userName[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* message */}
                <div
                  className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-muted-foreground rounded-bl-none"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input  */}
      <div className="p-3 border-t border-border bg-card">
        <div className="flex gap-2 items-center">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="write you message ..."
            className="h-9 rounded-full bg-muted border-none focus-visible:ring-1 focus-visible:ring-primary text-xs"
          />
          <Button 
            onClick={handleSend} 
            size="icon" 
            disabled={!text.trim()}
            className="h-9 w-9 rounded-full shrink-0 transition-all active:scale-90"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}