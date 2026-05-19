# WebLinuxOS 核心系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**目标：** 创建核心系统，包含窗口管理、任务栏、文件系统、Shell 模拟器、全局状态

**架构：** 核心系统独立于 UI 组件库，通过 Context 和 Hooks 提供功能

**技术栈：** React 18 + TypeScript + Zustand + Dexie.js

---

## 1. 项目结构

```
packages/core/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                        # 统一导出
│   │
│   ├── context/                        # 全局状态 (Zustand)
│   │   ├── store.ts                    # 主 Store
│   │   ├── types.ts                    # 状态类型定义
│   │   └── selectors.ts               # 选择器
│   │
│   ├── window-manager/                 # 窗口管理系统
│   │   ├── WindowManager.tsx           # 窗口管理器容器
│   │   ├── Window.tsx                  # 单个窗口组件
│   │   ├── TitleBar.tsx                # 标题栏
│   │   ├── WindowContent.tsx            # 窗口内容插槽
│   │   ├── useWindowManager.ts          # 窗口管理 Hook
│   │   └── types.ts                     # 窗口类型定义
│   │
│   ├── taskbar/                        # 任务栏
│   │   ├── Taskbar.tsx                  # 任务栏主组件
│   │   ├── StartMenu.tsx                # 开始菜单
│   │   ├── SystemTray.tsx               # 系统托盘
│   │   ├── AppIcon.tsx                  # 应用图标
│   │   ├── useTaskbar.ts                # 任务栏 Hook
│   │   └── types.ts                     # 任务栏类型定义
│   │
│   ├── filesystem/                      # 虚拟文件系统
│   │   ├── FileSystem.ts                # 文件系统主类
│   │   ├── FileNode.ts                  # 文件节点类型
│   │   ├── FileOperations.ts            # 文件操作
│   │   ├── useFileSystem.ts             # 文件系统 Hook
│   │   ├── db.ts                        # IndexedDB 配置 (Dexie)
│   │   └── types.ts                     # 文件系统类型定义
│   │
│   └── shell/                           # Shell 模拟器
│       ├── Shell.ts                     # Shell 主类
│       ├── ShellInput.tsx               # Shell 输入组件
│       ├── ShellOutput.tsx              # Shell 输出组件
│       ├── commands/                    # 命令实现
│       │   ├── index.ts
│       │   ├── ls.ts
│       │   ├── cd.ts
│       │   ├── mkdir.ts
│       │   ├── rm.ts
│       │   ├── cat.ts
│       │   ├── touch.ts
│       │   ├── cp.ts
│       │   ├── mv.ts
│       │   └── pwd.ts
│       ├── useShell.ts                  # Shell Hook
│       └── types.ts                     # Shell 类型定义
```

---

## 2. 全局状态管理

### Task 1: 创建 Zustand Store

**Files:**
- Create: `packages/core/src/context/types.ts`
- Create: `packages/core/src/context/store.ts`
- Create: `packages/core/src/context/selectors.ts`
- Create: `packages/core/src/context/index.ts`

- [ ] **Step 1: 创建 types.ts**

```typescript
import { WindowState } from '../window-manager/types';
import { FileSystemState } from '../filesystem/types';

export interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  category: 'development' | 'api' | 'database' | 'frontend' | 'utilities' | 'security' | 'docs' | 'system';
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  defaultSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  resizable?: boolean;
  maximizable?: boolean;
  closable?: boolean;
}

export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
}

export interface SystemState {
  apps: AppDefinition[];
  registeredApps: Map<string, AppDefinition>;
  activeAppId: string | null;
  theme: ThemeConfig;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}
```

- [ ] **Step 2: 创建 store.ts**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WindowState, WindowManagerState } from '../window-manager/types';
import { FileSystemState } from '../filesystem/types';
import { SystemState, AppDefinition, ThemeConfig, Notification } from './types';

interface WindowActions {
  openWindow: (appId: string, props?: Record<string, any>) => string;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  setWindowProps: (id: string, props: Record<string, any>) => void;
}

interface FileSystemActions {
  createFile: (path: string, content: string) => Promise<void>;
  createDirectory: (path: string) => Promise<void>;
  deleteNode: (path: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  listDirectory: (path: string) => Promise<FileSystemState['tree']>;
  moveNode: (from: string, to: string) => Promise<void>;
  copyNode: (from: string, to: string) => Promise<void>;
}

interface SystemActions {
  registerApp: (app: AppDefinition) => void;
  unregisterApp: (appId: string) => void;
  setActiveApp: (appId: string | null) => void;
  setTheme: (theme: ThemeConfig) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

export type AppStore = WindowActions & FileSystemActions & SystemActions;

const defaultTheme: ThemeConfig = {
  name: 'dark',
  colors: {
    primary: '#007acc',
    secondary: '#3794ff',
    background: '#1e1e1e',
    surface: '#252526',
    text: '#cccccc',
    border: '#3c3c3c',
  },
};

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Window State
      windows: [],
      maxZIndex: 0,

      // File System State
      currentPath: '/home/user',
      tree: {
        id: 'root',
        name: '/',
        type: 'folder',
        children: [
          {
            id: 'home',
            name: 'home',
            type: 'folder' as const,
            children: [
              {
                id: 'user',
                name: 'user',
                type: 'folder' as const,
                children: [
                  { id: 'projects', name: 'projects', type: 'folder' as const, children: [] },
                  { id: 'documents', name: 'documents', type: 'folder' as const, children: [] },
                  { id: 'notes', name: 'notes', type: 'folder' as const, children: [] },
                ],
              },
            ],
          },
        ],
      },

      // System State
      apps: [],
      registeredApps: new Map(),
      activeAppId: null,
      theme: defaultTheme,
      notifications: [],

      // Window Actions
      openWindow: (appId, props = {}) => {
        const id = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const app = get().registeredApps.get(appId);
        if (!app) return '';

        set((state) => ({
          windows: [
            ...state.windows,
            {
              id,
              appId,
              title: app.name,
              icon: app.icon,
              position: { x: 100 + state.windows.length * 30, y: 100 + state.windows.length * 30 },
              size: app.defaultSize || { width: 800, height: 600 },
              zIndex: state.maxZIndex + 1,
              minimized: false,
              maximized: false,
              props,
            } as WindowState,
          ],
          maxZIndex: state.maxZIndex + 1,
        }));

        return id;
      },

      closeWindow: (id) => {
        set((state) => ({
          windows: state.windows.filter((w) => w.id !== id),
        }));
      },

      minimizeWindow: (id) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, minimized: true } : w
          ),
        }));
      },

      maximizeWindow: (id) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, maximized: true } : w
          ),
        }));
      },

      restoreWindow: (id) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, minimized: false, maximized: false } : w
          ),
        }));
      },

      focusWindow: (id) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, zIndex: state.maxZIndex + 1 } : w
          ),
          maxZIndex: state.maxZIndex + 1,
        }));
      },

      updateWindowPosition: (id, x, y) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, position: { x, y } } : w
          ),
        }));
      },

      updateWindowSize: (id, width, height) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, size: { width, height } } : w
          ),
        }));
      },

      setWindowProps: (id, props) => {
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === id ? { ...w, props: { ...w.props, ...props } } : w
          ),
        }));
      },

      // File System Actions (Simplified - full implementation in filesystem module)
      createFile: async (path, content) => {
        // Implementation in filesystem module
      },
      createDirectory: async (path) => {
        // Implementation in filesystem module
      },
      deleteNode: async (path) => {
        // Implementation in filesystem module
      },
      readFile: async (path) => {
        return '';
      },
      writeFile: async (path, content) => {
        // Implementation in filesystem module
      },
      listDirectory: async (path) => {
        return get().tree;
      },
      moveNode: async (from, to) => {},
      copyNode: async (from, to) => {},

      // System Actions
      registerApp: (app) => {
        set((state) => {
          const newApps = new Map(state.registeredApps);
          newApps.set(app.id, app);
          return {
            registeredApps: newApps,
            apps: [...state.apps, app],
          };
        });
      },

      unregisterApp: (appId) => {
        set((state) => {
          const newApps = new Map(state.registeredApps);
          newApps.delete(appId);
          return {
            registeredApps: newApps,
            apps: state.apps.filter((a) => a.id !== appId),
          };
        });
      },

      setActiveApp: (appId) => {
        set({ activeAppId: appId });
      },

      setTheme: (theme) => {
        set({ theme });
      },

      addNotification: (notification) => {
        const id = `notif-${Date.now()}`;
        set((state) => ({
          notifications: [
            ...state.notifications,
            {
              ...notification,
              id,
              timestamp: Date.now(),
              read: false,
            },
          ],
        }));
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: 'weblinuxos-storage',
      partialize: (state) => ({
        tree: state.tree,
        currentPath: state.currentPath,
        theme: state.theme,
      }),
    }
  )
);
```

---

## 3. 窗口管理系统

### Task 2: 创建窗口管理组件

**Files:**
- Create: `packages/core/src/window-manager/types.ts`
- Create: `packages/core/src/window-manager/WindowManager.tsx`
- Create: `packages/core/src/window-manager/Window.tsx`
- Create: `packages/core/src/window-manager/TitleBar.tsx`
- Create: `packages/core/src/window-manager/useWindowManager.ts`
- Create: `packages/core/src/window-manager/index.ts`

- [ ] **Step 1: 创建 types.ts**

```typescript
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

export interface WindowManagerState {
  windows: WindowState[];
  maxZIndex: number;
}

export interface WindowComponentProps {
  windowState: WindowState;
  children: React.ReactNode;
}
```

- [ ] **Step 2: 创建 WindowManager.tsx**

```tsx
import React from 'react';
import { useStore } from '../context/store';
import Window from './Window';

const WindowManager: React.FC = () => {
  const windows = useStore((state) => state.windows);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {windows.map((window) => (
        <Window key={window.id} windowState={window} />
      ))}
    </div>
  );
};

export default WindowManager;
```

- [ ] **Step 3: 创建 Window.tsx**

```tsx
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { WindowState } from './types';
import { useStore } from '../context/store';
import TitleBar from './TitleBar';

interface WindowProps {
  windowState: WindowState;
}

const Window: React.FC<WindowProps> = ({ windowState }) => {
  const {
    id,
    appId,
    title,
    icon,
    position,
    size,
    zIndex,
    minimized,
    maximized,
    props,
  } = windowState;

  const { registeredApps, focusWindow, closeWindow, updateWindowPosition, updateWindowSize } = useStore();
  const app = registeredApps.get(appId);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.title-bar-controls')) return;
      focusWindow(id);
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [id, position, focusWindow]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, e.clientX - dragOffset.x);
        const newY = Math.max(0, e.clientY - dragOffset.y);
        updateWindowPosition(id, newX, newY);
      }
      if (isResizing && windowRef.current) {
        const rect = windowRef.current.getBoundingClientRect();
        const newWidth = Math.max(300, e.clientX - rect.left);
        const newHeight = Math.max(200, e.clientY - rect.top);
        updateWindowSize(id, newWidth, newHeight);
      }
    },
    [isDragging, isResizing, id, dragOffset, updateWindowPosition, updateWindowSize]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    focusWindow(id);
  };

  if (minimized) return null;

  const windowStyle: React.CSSProperties = maximized
    ? {
        top: 0,
        left: 0,
        width: '100%',
        height: 'calc(100% - 40px)',
        zIndex,
      }
    : {
        top: position.y,
        left: position.x,
        width: size.width,
        height: size.height,
        zIndex,
      };

  return (
    <div
      ref={windowRef}
      className={`
        absolute flex flex-col
        bg-[var(--bg-secondary)] rounded-lg
        shadow-lg border border-[var(--border-color)]
        pointer-events-auto
        ${maximized ? '' : 'resize overflow-hidden'}
      `}
      style={windowStyle}
      onMouseDown={() => focusWindow(id)}
    >
      <TitleBar
        id={id}
        title={title}
        icon={icon}
        maximized={maximized}
        onClose={() => closeWindow(id)}
      />
      <div
        className="flex-1 overflow-hidden"
        onMouseDown={handleMouseDown}
      >
        {app?.component && (
          <app.component {...props} windowId={id} />
        )}
      </div>
      {!maximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <svg
            viewBox="0 0 16 16"
            className="w-full h-full text-[var(--border-color)]"
          >
            <path
              d="M14 14H10V10M14 14V10M14 14H10"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default Window;
```

- [ ] **Step 4: 创建 TitleBar.tsx**

```tsx
import React from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
import { useStore } from '../context/store';

interface TitleBarProps {
  id: string;
  title: string;
  icon: string;
  maximized: boolean;
  onClose: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({
  id,
  title,
  icon,
  maximized,
  onClose,
}) => {
  const { minimizeWindow, maximizeWindow, restoreWindow } = useStore();

  const handleMinimize = () => minimizeWindow(id);
  const handleMaximize = () => {
    if (maximized) {
      restoreWindow(id);
    } else {
      maximizeWindow(id);
    }
  };

  return (
    <div
      className="
        title-bar flex items-center h-8 px-2
        bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]
        select-none cursor-default
      "
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-[var(--text-primary)] truncate">{title}</span>
      </div>
      <div className="title-bar-controls flex items-center">
        <button
          onClick={handleMinimize}
          className="
            w-8 h-8 flex items-center justify-center
            text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]
            transition-colors
          "
          title="最小化"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="
            w-8 h-8 flex items-center justify-center
            text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]
            transition-colors
          "
          title={maximized ? '还原' : '最大化'}
        >
          {maximized ? <Square size={12} /> : <Maximize2 size={14} />}
        </button>
        <button
          onClick={onClose}
          className="
            w-8 h-8 flex items-center justify-center
            text-[var(--text-secondary)] hover:bg-[var(--color-error)]
            hover:text-white transition-colors
          "
          title="关闭"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
```

---

## 4. 任务栏系统

### Task 3: 创建任务栏组件

**Files:**
- Create: `packages/core/src/taskbar/types.ts`
- Create: `packages/core/src/taskbar/Taskbar.tsx`
- Create: `packages/core/src/taskbar/StartMenu.tsx`
- Create: `packages/core/src/taskbar/SystemTray.tsx`
- Create: `packages/core/src/taskbar/AppIcon.tsx`
- Create: `packages/core/src/taskbar/useTaskbar.ts`
- Create: `packages/core/src/taskbar/index.ts`

- [ ] **Step 1: 创建 Taskbar.tsx**

```tsx
import React, { useState } from 'react';
import { useStore } from '../context/store';
import StartMenu from './StartMenu';
import SystemTray from './SystemTray';
import AppIcon from './AppIcon';

const Taskbar: React.FC = () => {
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const { windows, openWindow, focusWindow, restoreWindow } = useStore();

  const handleAppClick = (appId: string) => {
    openWindow(appId);
    setIsStartMenuOpen(false);
  };

  const handleWindowClick = (windowId: string, minimized: boolean) => {
    if (minimized) {
      restoreWindow(windowId);
    } else {
      focusWindow(windowId);
    }
  };

  const activeWindows = windows.filter((w) => !w.minimized);
  const minimizedWindows = windows.filter((w) => w.minimized);

  return (
    <>
      <div
        className="
          fixed bottom-0 left-0 right-0 h-10
          bg-[var(--bg-tertiary)] border-t border-[var(--border-color)]
          flex items-center px-2 gap-2 z-[var(--z-fixed)]
        "
      >
        <button
          onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
          className={`
            w-8 h-8 flex items-center justify-center rounded
            text-[var(--text-primary)] text-lg
            hover:bg-[var(--bg-hover)]
            ${isStartMenuOpen ? 'bg-[var(--bg-active)]' : ''}
          `}
          title="开始"
        >
          🪟
        </button>

        <div className="h-6 w-px bg-[var(--border-color)]" />

        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {activeWindows.map((window) => (
            <AppIcon
              key={window.id}
              icon={window.icon}
              title={window.title}
              isActive={window.zIndex === Math.max(...windows.map((w) => w.zIndex))}
              onClick={() => handleWindowClick(window.id, window.minimized)}
            />
          ))}
          {minimizedWindows.map((window) => (
            <AppIcon
              key={window.id}
              icon={window.icon}
              title={`${window.title} (已最小化)`}
              isActive={false}
              onClick={() => handleWindowClick(window.id, true)}
            />
          ))}
        </div>

        <SystemTray />
      </div>

      {isStartMenuOpen && (
        <StartMenu
          onClose={() => setIsStartMenuOpen(false)}
          onAppClick={handleAppClick}
        />
      )}
    </>
  );
};

export default Taskbar;
```

- [ ] **Step 2: 创建 StartMenu.tsx**

```tsx
import React, { useMemo } from 'react';
import { useStore } from '../context/store';
import { Search, Settings, Terminal, Code, Database, Globe, Wrench, Shield, FileText } from 'lucide-react';

interface StartMenuProps {
  onClose: () => void;
  onAppClick: (appId: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  development: <Code size={16} />,
  api: <Globe size={16} />,
  database: <Database size={16} />,
  frontend: <Code size={16} />,
  utilities: <Wrench size={16} />,
  security: <Shield size={16} />,
  docs: <FileText size={16} />,
  system: <Terminal size={16} />,
};

const categoryNames: Record<string, string> = {
  development: '开发工具',
  api: 'API 工具',
  database: '数据库',
  frontend: '前端开发',
  utilities: '效率工具',
  security: '安全工具',
  docs: '文档工具',
  system: '系统工具',
};

const StartMenu: React.FC<StartMenuProps> = ({ onClose, onAppClick }) => {
  const { apps } = useStore();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredApps = useMemo(() => {
    if (!searchQuery) return apps;
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        categoryNames[app.category]?.includes(searchQuery)
    );
  }, [apps, searchQuery]);

  const groupedApps = useMemo(() => {
    const groups: Record<string, typeof apps> = {};
    filteredApps.forEach((app) => {
      if (!groups[app.category]) {
        groups[app.category] = [];
      }
      groups[app.category].push(app);
    });
    return groups;
  }, [filteredApps]);

  return (
    <>
      <div className="fixed inset-0 z-[var(--z-modal-backdrop)]" onClick={onClose} />
      <div
        className="
          fixed bottom-11 left-2 w-[600px] max-h-[70vh]
          bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]
          shadow-lg z-[var(--z-modal)] overflow-hidden
        "
      >
        <div className="p-3 border-b border-[var(--border-color)]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="搜索应用..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-9 pr-3 py-2 rounded
                bg-[var(--bg-primary)] border border-[var(--border-color)]
                text-sm text-[var(--text-primary)]
                placeholder:text-[var(--text-secondary)]
                focus:outline-none focus:border-[var(--border-focus)]
              "
            />
          </div>
        </div>

        <div className="p-3 overflow-y-auto max-h-[calc(70vh-100px)]">
          {Object.entries(groupedApps).map(([category, categoryApps]) => (
            <div key={category} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2 text-[var(--text-secondary)] text-xs font-medium">
                {categoryIcons[category]}
                <span>{categoryNames[category] || category}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {categoryApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => onAppClick(app.id)}
                    className="
                      flex flex-col items-center gap-1 p-3 rounded
                      hover:bg-[var(--bg-hover)]
                      transition-colors
                    "
                  >
                    <span className="text-2xl">{app.icon}</span>
                    <span className="text-xs text-[var(--text-primary)] text-center truncate w-full">
                      {app.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-[var(--border-color)] flex justify-end">
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors">
            <Settings size={14} />
            设置
          </button>
        </div>
      </div>
    </>
  );
};

export default StartMenu;
```

- [ ] **Step 3: 创建 SystemTray.tsx**

```tsx
import React from 'react';
import { useStore } from '../context/store';

const SystemTray: React.FC = () => {
  const { notifications } = useStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex items-center gap-2">
      <button
        className="
          flex items-center gap-1 px-2 py-1 rounded
          text-xs text-[var(--text-secondary)]
          hover:bg-[var(--bg-hover)]
        "
        title="通知"
      >
        🔔
        {unreadCount > 0 && (
          <span className="w-4 h-4 flex items-center justify-center rounded-full bg-[var(--color-error)] text-white text-[10px]">
            {unreadCount}
          </span>
        )}
      </button>
      <span className="text-xs text-[var(--text-secondary)]">
        {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
};

export default SystemTray;
```

---

## 5. 文件系统

### Task 4: 创建虚拟文件系统

**Files:**
- Create: `packages/core/src/filesystem/types.ts`
- Create: `packages/core/src/filesystem/db.ts`
- Create: `packages/core/src/filesystem/FileNode.ts`
- Create: `packages/core/src/filesystem/FileOperations.ts`
- Create: `packages/core/src/filesystem/useFileSystem.ts`
- Create: `packages/core/src/filesystem/index.ts`

- [ ] **Step 1: 创建 types.ts**

```typescript
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  parentId: string | null;
  content?: string;
  mimeType?: string;
  size?: number;
  permissions?: string;
  createdAt: number;
  updatedAt: number;
  children?: FileNode[];
}

export interface FileSystemState {
  tree: FileNode;
  currentPath: string;
  selectedPath: string | null;
}

export interface FileOperationResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface DirectoryListing {
  path: string;
  items: FileNode[];
  totalFiles: number;
  totalFolders: number;
}
```

- [ ] **Step 2: 创建 db.ts (Dexie IndexedDB)**

```typescript
import Dexie, { Table } from 'dexie';

export interface DBFileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  parentId: string | null;
  content?: string;
  mimeType?: string;
  size?: number;
  permissions: string;
  createdAt: number;
  updatedAt: number;
}

class WebLinuxFSDatabase extends Dexie {
  files!: Table<DBFileNode>;

  constructor() {
    super('WebLinuxOS_FS');
    this.version(1).stores({
      files: 'id, name, path, parentId, type',
    });
  }
}

export const db = new WebLinuxFSDatabase();

export const initializeFileSystem = async () => {
  const count = await db.files.count();
  if (count === 0) {
    const initialStructure: Omit<DBFileNode, 'createdAt' | 'updatedAt'>[] = [
      { id: 'root', name: '/', type: 'folder', path: '/', parentId: null, permissions: '755' },
      { id: 'home', name: 'home', type: 'folder', path: '/home', parentId: 'root', permissions: '755' },
      { id: 'user', name: 'user', type: 'folder', path: '/home/user', parentId: 'home', permissions: '755' },
      { id: 'projects', name: 'projects', type: 'folder', path: '/home/user/projects', parentId: 'user', permissions: '755' },
      { id: 'documents', name: 'documents', type: 'folder', path: '/home/user/documents', parentId: 'user', permissions: '755' },
      { id: 'notes', name: 'notes', type: 'folder', path: '/home/user/notes', parentId: 'user', permissions: '755' },
      { id: 'tmp', name: 'tmp', type: 'folder', path: '/tmp', parentId: 'root', permissions: '777' },
    ];

    const now = Date.now();
    await db.files.bulkAdd(
      initialStructure.map((item) => ({
        ...item,
        createdAt: now,
        updatedAt: now,
      }))
    );
  }
};
```

- [ ] **Step 3: 创建 FileOperations.ts**

```typescript
import { db } from './db';
import { FileNode, FileOperationResult, DirectoryListing } from './types';

const getMimeType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    js: 'text/javascript',
    ts: 'text/typescript',
    jsx: 'text/javascript',
    tsx: 'text/typescript',
    json: 'application/json',
    html: 'text/html',
    css: 'text/css',
    md: 'text/markdown',
    txt: 'text/plain',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
};

const generateId = () => `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const createFile = async (
  parentPath: string,
  name: string,
  content: string = ''
): Promise<FileOperationResult> => {
  try {
    const parent = await db.files.where('path').equals(parentPath).first();
    if (!parent || parent.type !== 'folder') {
      return { success: false, error: 'Parent directory not found' };
    }

    const existing = await db.files
      .where(['parentId', 'name'])
      .equals([parent.id, name])
      .first();
    if (existing) {
      return { success: false, error: 'File already exists' };
    }

    const now = Date.now();
    const id = generateId();
    const path = `${parentPath}/${name}`;

    await db.files.add({
      id,
      name,
      type: 'file',
      path,
      parentId: parent.id,
      content,
      mimeType: getMimeType(name),
      size: content.length,
      permissions: '644',
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, data: { id, path } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

export const createDirectory = async (
  parentPath: string,
  name: string
): Promise<FileOperationResult> => {
  try {
    const parent = await db.files.where('path').equals(parentPath).first();
    if (!parent || parent.type !== 'folder') {
      return { success: false, error: 'Parent directory not found' };
    }

    const existing = await db.files
      .where(['parentId', 'name'])
      .equals([parent.id, name])
      .first();
    if (existing) {
      return { success: false, error: 'Directory already exists' };
    }

    const now = Date.now();
    const id = generateId();
    const path = `${parentPath}/${name}`;

    await db.files.add({
      id,
      name,
      type: 'folder',
      path,
      parentId: parent.id,
      permissions: '755',
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, data: { id, path } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

export const readFile = async (path: string): Promise<FileOperationResult> => {
  try {
    const file = await db.files.where('path').equals(path).first();
    if (!file) {
      return { success: false, error: 'File not found' };
    }
    if (file.type === 'folder') {
      return { success: false, error: 'Cannot read a directory' };
    }
    return { success: true, data: { content: file.content || '' } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

export const writeFile = async (
  path: string,
  content: string
): Promise<FileOperationResult> => {
  try {
    const file = await db.files.where('path').equals(path).first();
    if (!file) {
      return { success: false, error: 'File not found' };
    }
    if (file.type === 'folder') {
      return { success: false, error: 'Cannot write to a directory' };
    }

    await db.files.update(file.id, {
      content,
      size: content.length,
      updatedAt: Date.now(),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

export const deleteNode = async (path: string): Promise<FileOperationResult> => {
  try {
    const node = await db.files.where('path').equals(path).first();
    if (!node) {
      return { success: false, error: 'File or directory not found' };
    }

    if (node.type === 'folder') {
      const children = await db.files.where('parentId').equals(node.id).toArray();
      for (const child of children) {
        await deleteNode(child.path);
      }
    }

    await db.files.delete(node.id);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

export const listDirectory = async (path: string): Promise<DirectoryListing> => {
  const folder = await db.files.where('path').equals(path).first();
  if (!folder || folder.type !== 'folder') {
    return { path, items: [], totalFiles: 0, totalFolders: 0 };
  }

  const items = await db.files.where('parentId').equals(folder.id).toArray();
  return {
    path,
    items,
    totalFiles: items.filter((i) => i.type === 'file').length,
    totalFolders: items.filter((i) => i.type === 'folder').length,
  };
};

export const moveNode = async (
  from: string,
  to: string
): Promise<FileOperationResult> => {
  try {
    const node = await db.files.where('path').equals(from).first();
    if (!node) {
      return { success: false, error: 'Source not found' };
    }

    const destFolder = await db.files.where('path').equals(to).first();
    if (!destFolder || destFolder.type !== 'folder') {
      return { success: false, error: 'Destination not found or not a folder' };
    }

    const newPath = `${to}/${node.name}`;
    await db.files.update(node.id, {
      path: newPath,
      parentId: destFolder.id,
      updatedAt: Date.now(),
    });

    if (node.type === 'folder') {
      const children = await db.files.where('parentId').equals(node.id).toArray();
      for (const child of children) {
        await moveNode(child.path, newPath);
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

export const getFileTree = async (): Promise<FileNode> => {
  const root = await db.files.where('parentId').equals(null as any).first();
  if (!root) {
    throw new Error('File system not initialized');
  }

  const buildTree = async (node: any): Promise<FileNode> => {
    const children = await db.files.where('parentId').equals(node.id).toArray();
    const treeChildren = await Promise.all(children.map(buildTree));
    return {
      ...node,
      children: treeChildren,
    };
  };

  return buildTree(root);
};
```

---

## 6. Shell 模拟器

### Task 5: 创建 Shell 模拟器

**Files:**
- Create: `packages/core/src/shell/types.ts`
- Create: `packages/core/src/shell/commands/index.ts`
- Create: `packages/core/src/shell/commands/ls.ts`
- Create: `packages/core/src/shell/commands/cd.ts`
- Create: `packages/core/src/shell/commands/pwd.ts`
- Create: `packages/core/src/shell/commands/mkdir.ts`
- Create: `packages/core/src/shell/commands/rm.ts`
- Create: `packages/core/src/shell/commands/cat.ts`
- Create: `packages/core/src/shell/commands/touch.ts`
- Create: `packages/core/src/shell/Shell.tsx`
- Create: `packages/core/src/shell/useShell.ts`
- Create: `packages/core/src/shell/index.ts`

- [ ] **Step 1: 创建 types.ts**

```typescript
export interface CommandResult {
  output: string;
  error?: string;
  exitCode: number;
}

export interface Command {
  name: string;
  description: string;
  usage: string;
  execute: (args: string[], env: ShellEnvironment) => Promise<CommandResult>;
}

export interface ShellEnvironment {
  currentPath: string;
  setCurrentPath: (path: string) => void;
  history: string[];
  addToHistory: (cmd: string) => void;
}

export interface ShellState {
  input: string;
  output: string[];
  history: string[];
  historyIndex: number;
  currentPath: string;
}
```

- [ ] **Step 2: 创建命令实现**

```typescript
// commands/index.ts
import { Command } from './types';
import { lsCommand } from './ls';
import { cdCommand } from './cd';
import { pwdCommand } from './pwd';
import { mkdirCommand } from './mkdir';
import { rmCommand } from './rm';
import { catCommand } from './cat';
import { touchCommand } from './touch';
import { echoCommand } from './echo';
import { whoamiCommand } from './whoami';
import { dateCommand } from './date';
import { clearCommand } from './clear';
import { helpCommand } from './help';

export const commands: Record<string, Command> = {
  ls: lsCommand,
  cd: cdCommand,
  pwd: pwdCommand,
  mkdir: mkdirCommand,
  rm: rmCommand,
  cat: catCommand,
  touch: touchCommand,
  echo: echoCommand,
  whoami: whoamiCommand,
  date: dateCommand,
  clear: clearCommand,
  help: helpCommand,
};

export const getCommandNames = () => Object.keys(commands);
```

```typescript
// commands/ls.ts
import { Command, CommandResult, ShellEnvironment } from '../types';
import { db } from '../../filesystem/db';

export const lsCommand: Command = {
  name: 'ls',
  description: '列出目录内容',
  usage: 'ls [选项] [目录]',
  execute: async (args, env): Promise<CommandResult> => {
    try {
      let targetPath = env.currentPath;
      const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al');
      const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al');

      const nonOptionArgs = args.filter((arg) => !arg.startsWith('-'));
      if (nonOptionArgs.length > 0) {
        targetPath = nonOptionArgs[0];
      }

      const folder = await db.files.where('path').equals(targetPath).first();
      if (!folder) {
        return { output: '', error: `ls: ${targetPath}: 没有那个文件或目录`, exitCode: 1 };
      }

      if (folder.type === 'file') {
        return { output: folder.name, exitCode: 0 };
      }

      const items = await db.files.where('parentId').equals(folder.id).toArray();

      let filteredItems = items;
      if (!showHidden) {
        filteredItems = items.filter((item) => !item.name.startsWith('.'));
      }

      if (showLong) {
        const lines = filteredItems.map((item) => {
          const type = item.type === 'folder' ? 'd' : '-';
          const perms = item.permissions || '644';
          const size = item.size || 0;
          const date = new Date(item.updatedAt).toLocaleDateString();
          return `${type}${perms}  1 user user ${size.toString().padStart(8)} ${date} ${item.name}`;
        });
        return { output: lines.join('\n'), exitCode: 0 };
      }

      const names = filteredItems.map((item) => item.name).join('  ');
      return { output: names || '', exitCode: 0 };
    } catch (error) {
      return { output: '', error: `ls: ${error}`, exitCode: 1 };
    }
  },
};
```

- [ ] **Step 3: 创建 Shell.tsx**

```tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, Terminal as TerminalIcon } from 'lucide-react';
import { commands } from './commands';
import { ShellEnvironment } from './types';

interface ShellProps {
  initialPath?: string;
  onPathChange?: (path: string) => void;
}

const Shell: React.FC<ShellProps> = ({ initialPath = '/home/user', onPathChange }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<{ type: 'command' | 'result' | 'error'; text: string }[]>([
    { type: 'result', text: 'WebLinuxOS Shell v1.0.0' },
    { type: 'result', text: '输入 help 获取帮助\n' },
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentPath, setCurrentPath] = useState(initialPath);

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const env: ShellEnvironment = {
    currentPath,
    setCurrentPath: (path) => {
      setCurrentPath(path);
      onPathChange?.(path);
    },
    history,
    addToHistory: (cmd) => {
      setHistory((prev) => [...prev, cmd]);
    },
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const executeCommand = useCallback(async (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    env.addToHistory(trimmedCmd);
    setHistoryIndex(-1);

    setOutput((prev) => [
      ...prev,
      { type: 'command', text: `${currentPath} $ ${trimmedCmd}` },
    ]);

    const parts = trimmedCmd.split(/\s+/);
    const commandName = parts[0];
    const args = parts.slice(1);

    if (commandName === 'clear') {
      setOutput([]);
      return;
    }

    const command = commands[commandName];
    if (!command) {
      setOutput((prev) => [
        ...prev,
        { type: 'error', text: `${commandName}: 命令未找到` },
      ]);
      return;
    }

    try {
      const result = await command.execute(args, env);
      if (result.output) {
        setOutput((prev) => [
          ...prev,
          { type: 'result', text: result.output },
        ]);
      }
      if (result.error) {
        setOutput((prev) => [
          ...prev,
          { type: 'error', text: result.error },
        ]);
      }
    } catch (error) {
      setOutput((prev) => [
        ...prev,
        { type: 'error', text: `${commandName}: ${error}` },
      ]);
    }
  }, [currentPath, env]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="h-full flex flex-col bg-[var(--bg-primary)] font-mono text-sm"
    >
      <div
        ref={outputRef}
        className="flex-1 overflow-auto p-2"
      >
        {output.map((line, index) => (
          <div
            key={index}
            className={`whitespace-pre-wrap ${
              line.type === 'command'
                ? 'text-[var(--text-primary)]'
                : line.type === 'error'
                ? 'text-[var(--color-error)]'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            {line.text}
          </div>
        ))}
      </div>
      <div className="flex items-center px-2 py-1 border-t border-[var(--border-color)]">
        <span className="text-[var(--accent-primary)] mr-2">{currentPath} $</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-[var(--text-primary)]"
          autoFocus
        />
      </div>
    </div>
  );
};

export default Shell;
```

---

## 7. 统一导出

### Task 6: 创建核心系统统一导出

**Files:**
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: 更新 index.ts**

```typescript
// Context & State
export { useStore } from './context/store';
export * from './context/types';

// Window Manager
export { default as WindowManager } from './window-manager/WindowManager';
export { default as Window } from './window-manager/Window';
export { default as TitleBar } from './window-manager/TitleBar';
export * from './window-manager/types';

// Taskbar
export { default as Taskbar } from './taskbar/Taskbar';
export { default as StartMenu } from './taskbar/StartMenu';
export { default as SystemTray } from './taskbar/SystemTray';
export * from './taskbar/types';

// File System
export { default as Shell } from './shell/Shell';
export * from './shell/types';
export { commands } from './shell/commands';
export * from './filesystem/types';
export * from './filesystem/FileOperations';
export { initializeFileSystem } from './filesystem/db';
```

---

## 验收标准

- [ ] 窗口可拖拽、调整大小、最小化、最大化
- [ ] 任务栏显示打开的窗口
- [ ] 开始菜单显示所有注册的应用
- [ ] Shell 可执行基础命令 (ls, cd, pwd, mkdir, rm, cat, touch)
- [ ] 文件可在虚拟文件系统中创建、编辑、删除
- [ ] 数据持久化到 IndexedDB

---

**文档状态：** ✅ 核心系统实施计划完成
