import React from 'react';
import { useAppStore, WindowState } from '../context/store';

interface AppIconProps {
  windowState: WindowState;
}

export const AppIcon: React.FC<AppIconProps> = ({ windowState }) => {
  const { focusWindow, activeWindowId } = useAppStore();
  const isActive = activeWindowId === windowState.id;

  return (
    <button
      onClick={() => focusWindow(windowState.id)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${isActive ? 'bg-[#3794ff] text-white' : 'hover:bg-[#2d2d2d] text-[#cccccc]'}`}
    >
      <span className="text-lg">{windowState.icon}</span>
      <span className="text-sm max-w-[150px] truncate">{windowState.title}</span>
    </button>
  );
};
