import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
  setMobile: (v: boolean) => void;
  sidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  isMobile: false,
  setMobile: (v) => set({ isMobile: v }),
  sidebarOpen: false,
  openMobileSidebar: () => set({ sidebarOpen: true }),
  closeMobileSidebar: () => set({ sidebarOpen: false }),
}));