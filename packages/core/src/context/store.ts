import { create } from 'zustand';

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  icon: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  props?: Record<string, any>;
}

export interface AppMetadata {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
}

interface AppState {
  windows: WindowState[];
  activeWindowId: string | null;
  nextZIndex: number;
  startMenuOpen: boolean;
  registeredApps: AppMetadata[];

  openWindow: (appId: string, title: string, icon: string, props?: Record<string, any>) => void;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, x: number, y: number) => void;
  updateWindowSize: (windowId: string, width: number, height: number) => void;
  toggleStartMenu: () => void;
  closeStartMenu: () => void;
  registerApp: (app: AppMetadata) => void;
  initApp: () => void;
}

let windowIdCounter = 0;

export const useAppStore = create<AppState>((set, get) => ({
  windows: [],
  activeWindowId: null,
  nextZIndex: 1,
  startMenuOpen: false,
  registeredApps: [],

  openWindow: (appId, title, icon, props) => {
    const id = `window-${++windowIdCounter}`;
    const state = get();
    const newWindow: WindowState = {
      id,
      appId,
      title,
      icon,
      position: { x: 100 + state.windows.length * 30, y: 100 + state.windows.length * 30 },
      size: { width: 800, height: 600 },
      zIndex: state.nextZIndex,
      minimized: false,
      maximized: false,
      props,
    };

    set({
      windows: [...state.windows, newWindow],
      activeWindowId: id,
      nextZIndex: state.nextZIndex + 1,
    });
  },

  closeWindow: (windowId) => {
    const state = get();
    const filteredWindows = state.windows.filter((w) => w.id !== windowId);
    const newActiveId = state.activeWindowId === windowId 
      ? filteredWindows.length > 0 
        ? filteredWindows[filteredWindows.length - 1].id 
        : null 
      : state.activeWindowId;

    set({
      windows: filteredWindows,
      activeWindowId: newActiveId,
    });
  },

  minimizeWindow: (windowId) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === windowId ? { ...w, minimized: true } : w
      ),
    }));
  },

  maximizeWindow: (windowId) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === windowId ? { ...w, maximized: !w.maximized } : w
      ),
    }));
  },

  focusWindow: (windowId) => {
    const state = get();
    const zIndex = state.nextZIndex;
    set({
      windows: state.windows.map((w) =>
        w.id === windowId ? { ...w, zIndex, minimized: false } : w
      ),
      activeWindowId: windowId,
      nextZIndex: zIndex + 1,
    });
  },

  updateWindowPosition: (windowId, x, y) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === windowId ? { ...w, position: { x, y } } : w
      ),
    }));
  },

  updateWindowSize: (windowId, width, height) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === windowId ? { ...w, size: { width, height } } : w
      ),
    }));
  },

  toggleStartMenu: () => {
    set((state) => ({ startMenuOpen: !state.startMenuOpen }));
  },

  closeStartMenu: () => {
    set({ startMenuOpen: false });
  },

  registerApp: (app) => {
    set((state) => {
      if (state.registeredApps.some((a) => a.id === app.id)) return state;
      return { registeredApps: [...state.registeredApps, app] };
    });
  },

  initApp: () => {
    // Initialize app - can be expanded later
    console.log('WebLinuxOS initialized');
  },
}));

export const registerApp = (app: AppMetadata) => {
  useAppStore.getState().registerApp(app);
};

export const initApp = () => {
  useAppStore.getState().initApp();
};
