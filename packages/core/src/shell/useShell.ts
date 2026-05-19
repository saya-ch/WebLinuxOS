import { useState, useCallback, useRef, useEffect } from 'react';
import { Shell, ShellOutput } from './Shell';

export interface ShellLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'info';
  content: string;
  path?: string;
}

export const useShell = () => {
  const shellRef = useRef<Shell | null>(null);
  const [lines, setLines] = useState<ShellLine[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    shellRef.current = new Shell();
    setIsInitialized(true);
    
    const welcomeLines: ShellLine[] = [
      { id: 'welcome-1', type: 'output', content: 'Welcome to WebLinuxOS!' },
      { id: 'welcome-2', type: 'output', content: 'Type "help" for available commands.' },
      { id: 'welcome-3', type: 'output', content: '' },
    ];
    setLines(welcomeLines);
  }, []);

  const addLine = useCallback((type: ShellLine['type'], content: string, path?: string) => {
    setLines((prev) => [...prev, { id: Date.now().toString() + Math.random(), type, content, path }]);
  }, []);

  const executeCommand = useCallback(async (input: string) => {
    if (!shellRef.current) return;

    const path = shellRef.current.getCurrentPath();
    addLine('input', input, path);

    const outputs = await shellRef.current.executeCommand(input);
    
    for (const output of outputs) {
      if (output.content === '__CLEAR__') {
        setLines([]);
      } else {
        addLine(output.type, output.content);
      }
    }
  }, [addLine]);

  const getPreviousHistory = useCallback((): string | null => {
    return shellRef.current?.getPreviousHistory() || null;
  }, []);

  const getNextHistory = useCallback((): string | null => {
    return shellRef.current?.getNextHistory() || null;
  }, []);

  const getCurrentPath = useCallback((): string => {
    return shellRef.current?.getCurrentPath() || '/';
  }, []);

  return {
    lines,
    isInitialized,
    executeCommand,
    getPreviousHistory,
    getNextHistory,
    getCurrentPath,
  };
};
