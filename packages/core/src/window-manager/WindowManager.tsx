import React from 'react';
import { Window } from './Window';
import { useAppStore, WindowState } from '../context/store';

interface WindowManagerProps {
  appRenderers: Record<string, React.ComponentType<{ windowState: WindowState }>>;
}

export const WindowManager: React.FC<WindowManagerProps> = ({ appRenderers }) => {
  const windows = useAppStore((state) => state.windows);

  return (
    <div className="relative w-full h-full">
      {windows.map((window) => {
        const AppRenderer = appRenderers[window.appId];
        if (!AppRenderer) return null;
        return (
          <Window key={window.id} windowState={window}>
            <AppRenderer windowState={window} />
          </Window>
        );
      })}
    </div>
  );
};
