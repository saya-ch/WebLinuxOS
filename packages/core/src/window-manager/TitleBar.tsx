import React from 'react';
import { Minus2, Maximize2, X } from 'lucide-react';

interface TitleBarProps {
  title: string;
  icon: string;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  maximized: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title,
  icon,
  onMinimize,
  onMaximize,
  onClose,
  maximized,
}) => {
  return (
    <div className="flex items-center justify-between h-10 bg-[#252526] border-b border-[#3c3c3c] px-3 select-none">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-[#cccccc]">{title}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onMinimize}
          className="p-1.5 hover:bg-[#2d2d2d] rounded text-[#858585] hover:text-[#cccccc] transition-colors"
        >
          <Minus2 size={14} />
        </button>
        <button
          onClick={onMaximize}
          className="p-1.5 hover:bg-[#2d2d2d] rounded text-[#858585] hover:text-[#cccccc] transition-colors"
        >
          <Maximize2 size={14} />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-[#f14c4c] rounded text-[#858585] hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
