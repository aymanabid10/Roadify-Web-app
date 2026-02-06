import { create } from 'zustand';

interface ChatWindowItem {
  userId: string;
  userName: string;
}

interface ChatState {
  openWindows: ChatWindowItem[];
  isContactListOpen: boolean;
  openChat: (userId: string, userName: string) => void;
  closeChat: (userId: string) => void;
  toggleContactList: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  openWindows: [],
  isContactListOpen: false,
  
  toggleContactList: () => set((state) => ({ 
    isContactListOpen: !state.isContactListOpen 
  })),

  openChat: (userId, userName) => set((state) => {
    if (state.openWindows.some(w => w.userId === userId)) return { isContactListOpen: false };
    
    const newWindows = [...state.openWindows, { userId, userName }].slice(-3);
    return { openWindows: newWindows, isContactListOpen: false };
  }),

  closeChat: (userId) => set((state) => ({
    openWindows: state.openWindows.filter(w => w.userId !== userId)
  })),
}));