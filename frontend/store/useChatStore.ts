import { create } from 'zustand';

interface ChatWindowItem {
  userId: string;
  userName: string;
}

interface ChatState {
  openWindows: ChatWindowItem[];
  isContactListOpen: boolean;
  unreadNotifications: string[]; 
  openChat: (userId: string, userName: string) => void;
  closeChat: (userId: string) => void;
  toggleContactList: () => void;
  markAsRead: (userId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  openWindows: [],
  isContactListOpen: false,
  unreadNotifications: [],
  
  toggleContactList: () => set((state) => ({ 
    isContactListOpen: !state.isContactListOpen 
  })),

  openChat: (userId, userName) => set((state) => {
    if (state.openWindows.some(w => w.userId === userId)) {
      return { 
        isContactListOpen: false,
        unreadNotifications: state.unreadNotifications.filter(id => id !== userId)
      };
    }
    
    const newWindows = [...state.openWindows, { userId, userName }].slice(-3);
    return { 
      openWindows: newWindows, 
      isContactListOpen: false,
      unreadNotifications: state.unreadNotifications.filter(id => id !== userId)
    };
  }),

  closeChat: (userId) => set((state) => ({
    openWindows: state.openWindows.filter(w => w.userId !== userId)
  })),

  markAsRead: (userId) => set((state) => ({
    unreadNotifications: state.unreadNotifications.filter(id => id !== userId)
  })),

  notifyNewMessage: (userId: string) => set((state) => {
    if (state.openWindows.some(w => w.userId === userId)) return state;
    if (state.unreadNotifications.includes(userId)) return state;
    return { unreadNotifications: [...state.unreadNotifications, userId] };
  })
}));