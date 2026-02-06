"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { adminApi, UserResponseDto } from "@/lib/api";
import { useChatStore } from "@/store/useChatStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Search, Loader2 } from "lucide-react";

export function ChatSidebar() {
  const { isContactListOpen, toggleContactList, openChat } = useChatStore();
  
  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const pageSize = 15;

  const fetchUsers = useCallback(async (pageNum: number, search: string, isNewSearch: boolean) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await adminApi.getUsers({ 
        searchTerm: search, 
        page: pageNum, 
        pageSize 
      });
      
      const newUsers = res.data;
      setUsers(prev => {
        if (isNewSearch) return newUsers;

        const existingIds = new Set(prev.map(u => u.id));
        const filteredNewUsers = newUsers.filter(u => !existingIds.has(u.id));
        
        return [...prev, ...filteredNewUsers];
      });
      setHasMore(newUsers.length === pageSize);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs", error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      fetchUsers(1, searchTerm, true);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

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
          
          {/* Header */}
          <div className="p-4 border-b border-border flex justify-between items-center bg-primary text-primary-foreground shrink-0">
            <span className="font-bold text-sm">Contacts</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20 text-white" onClick={toggleContactList}>
              <X size={18} />
            </Button>
          </div>

          {/* Search bar */}
          <div className="p-2 border-b border-border bg-muted/30 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                className="pl-9 h-9 text-xs bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Users list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-background custom-scrollbar">
            {users.map((user, index) => {
              const isLastElement = users.length === index + 1;
              return (
                <div 
                  key={user.id} 
                  ref={isLastElement ? lastUserRef : null}
                >
                  <button
                    onClick={() => openChat(user.id, user.userName || "Inconnu")}
                    className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-lg transition-all text-left group"
                  >
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarFallback className="bg-muted text-xs">
                        {user.userName?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {user.userName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">En ligne</span>
                    </div>
                  </button>
                </div>
              );
            })}

            {/* Loading snipper */}
            {loading && (
              <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}

            {!loading && users.length === 0 && (
              <div className="text-center p-8 text-xs text-muted-foreground italic">
                No users found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bouton Trigger */}
      <Button
        onClick={toggleContactList}
        size="icon"
        className="h-14 w-14 rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all bg-primary text-primary-foreground pointer-events-auto"
      >
        {isContactListOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </Button>
    </div>
  );
}