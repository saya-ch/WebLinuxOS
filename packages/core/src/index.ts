// Context and State Management
export { useAppStore as useStore } from './context/store';
export { initApp } from './context/store';
export type { WindowState, AppMetadata } from './context/store';

// App Registry
export { registerApp } from './context/store';

// Window Manager
export { WindowManager } from './window-manager/WindowManager';
export { Window } from './window-manager/Window';
export { TitleBar } from './window-manager/TitleBar';

// Taskbar
export { Taskbar } from './taskbar/Taskbar';
export { StartMenu } from './taskbar/StartMenu';
export { AppIcon } from './taskbar/AppIcon';

// File System
export { useFileSystem } from './filesystem/useFileSystem';
export { FileSystemDB, db, pathToId, idToPath, getParentPath, joinPath, normalizePath } from './filesystem/FileSystem';
export { initializeFileSystem } from './filesystem/initializeFileSystem';
export type { FileNode, FileSystemState } from './filesystem/FileNode';
export { ROOT_ID } from './filesystem/FileNode';

// Shell
export { Shell } from './shell/Shell';
export { useShell } from './shell/useShell';
export type { ShellOutput, ShellState, ShellLine } from './shell/Shell';
