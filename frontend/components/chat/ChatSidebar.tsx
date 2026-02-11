"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { adminApi, UserResponseDto } from "@/lib/api";
import { useChatStore } from "@/store/useChatStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Search, Loader2, Bell } from "lucide-react";
import { useSignalR } from "@/hooks/useSignalR";

export function ChatSidebar() {
  const { isContactListOpen, toggleContactList, openChat, unreadNotifications } = useChatStore();
  
  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
      setToken(localStorage.getItem("accessToken"));
    }, []);
  const connection = useSignalR(token);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const handleIncomingUser = useCallback(async (userId: string) => {
    setUsers(prev => {
      const existingUser = prev.find(u => u.id === userId);
      
      if (existingUser) {
        const filtered = prev.filter(u => u.id !== userId);
        return [existingUser, ...filtered];
      }
      return prev;
    });

    const isAlreadyInState = users.some(u => u.id === userId);
    if (!isAlreadyInState) {
      try {
        const res = await adminApi.getUserById(userId);
        setUsers(prev => [res, ...prev.filter(u => u.id !== userId)]);
      } catch (err) {
        console.error("Erreur fetch user", err);
      }
    }
  }, [users]);

  const handleIncomingUserRef = useRef(handleIncomingUser);
  handleIncomingUserRef.current = handleIncomingUser;

  useEffect(() => {
    if (!connection) return;

    const onMessage = (msg: any) => {
      handleIncomingUserRef.current(msg.senderId);
    };

    connection.on("ReceiveMessage", onMessage);
    return () => connection.off("ReceiveMessage");
  }, [connection]);

  const fetchUsers = useCallback(async (pageNum: number, search: string, isNewSearch: boolean) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await adminApi.getUsers({ searchTerm: search, page: pageNum, pageSize: 15 });
      setUsers(prev => isNewSearch ? res.data : [...prev, ...res.data.filter(u => !prev.some(p => p.id === u.id))]);
      setHasMore(res.data.length === 15);
    } finally {
      setLoading(false);
    }
  }, [loading]);
  
  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchUsers(1, searchTerm, true); }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aNotif = unreadNotifications.includes(a.id) ? 1 : 0;
      const bNotif = unreadNotifications.includes(b.id) ? 1 : 0;
      return bNotif - aNotif;
    });
  }, [users, unreadNotifications]);


  const lastUserRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => {
          const nextPage = prevPage + 1;
          fetchUsers(nextPage, searchTerm, false);
          return nextPage;
        });
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, searchTerm, fetchUsers]);

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4 pointer-events-none">
      {isContactListOpen && (
        <div className="w-72 sm:w-80 bg-card border border-border rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 pointer-events-auto overflow-hidden h-[500px]">
          <div className="p-4 border-b border-border flex justify-between items-center bg-primary text-primary-foreground shrink-0">
            <span className="font-bold text-sm">Contacts</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20 text-white" onClick={toggleContactList}>
              <X size={18} />
            </Button>
          </div>

          <div className="p-2 border-b border-border bg-muted/30 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-9 h-9 text-xs bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-background custom-scrollbar">
            {sortedUsers.map((user, index) => {
              const isLastElement = sortedUsers.length === index + 1;
              const hasUnread = unreadNotifications.includes(user.id);

              return (
                <div key={user.id} ref={isLastElement ? lastUserRef : null}>
                  <button
                    onClick={() => openChat(user.id, user.userName || "Inconnu")}
                    className={`w-full flex items-center gap-3 p-2 hover:bg-accent rounded-lg transition-all text-left group ${hasUnread ? "bg-primary/5 border-l-4 border-primary" : ""}`}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarFallback className="bg-muted text-xs">
                          {user.userName?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden flex-1">
                      <span className={`text-sm truncate transition-colors ${hasUnread ? "font-bold text-primary" : "font-semibold"}`}>
                        {user.userName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {hasUnread ? "Nouveau message !" : "En ligne"}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      )}

      <Button
        onClick={toggleContactList}
        size="icon"
        className="h-14 w-14 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all bg-primary text-primary-foreground pointer-events-auto relative"
      >
        {isContactListOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isContactListOpen && unreadNotifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold h-6 w-6 rounded-full flex items-center justify-center border-2 border-background">
            {unreadNotifications.length}
          </span>
        )}
      </Button>
    </div>
  );
}