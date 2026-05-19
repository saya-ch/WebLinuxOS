import React from 'react';
import { Menu, Wifi, Volume2, Battery, Clock } from 'lucide-react';
import { useAppStore, AppMetadata } from '../context/store';
import { StartMenu } from './StartMenu';
import { AppIcon } from './AppIcon';

interface TaskbarProps {
  onLaunchApp: (app: AppMetadata) => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({ onLaunchApp }) => {
  const { windows, toggleStartMenu, startMenuOpen, closeStartMenu } = useAppStore();
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative z-50">
      {startMenuOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={closeStartMenu}
        />
      )}
      <div className="h-12 bg-[#252526] border-t border-[#3c3c3c] flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleStartMenu}
            className="p-2 hover:bg-[#2d2d2d] rounded text-[#cccccc] transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="h-6 w-px bg-[#3c3c3c]" />
          <div className="flex items-center gap-1">
            {windows.map((window) => (
              <AppIcon key={window.id} windowState={window} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 text-[#cccccc]">
            <Wifi size={16} />
            <Volume2 size={16} />
            <Battery size={16} />
          </div>
          <div className="h-6 w-px bg-[#3c3c3c]" />
          <div className="flex items-center gap-2 text-[#cccccc] text-sm">
            <Clock size={16} />
            <div className="flex flex-col items-end">
              <span>{formatTime(currentTime)}</span>
              <span className="text-xs text-[#858585]">{formatDate(currentTime)}</span>
            </div>
          </div>
        </div>
      </div>
      {startMenuOpen && <StartMenu onLaunchApp={onLaunchApp} />}
    </div>
  );
};
