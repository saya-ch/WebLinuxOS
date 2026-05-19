import React, { useState, useEffect, useRef } from 'react';

export const Terminal = () => {
  const [history, setHistory] = useState([
    { type: 'output', text: 'Welcome to WebLinuxOS Terminal' },
    { type: 'output', text: 'Type "help" for available commands' },
    { type: 'output', text: '' }
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    
    setHistory(prev => [...prev, { type: 'input', text: `user@weblinuxos:~$ ${trimmed}` }]);
    
    let output = '';
    switch (trimmed.toLowerCase()) {
      case 'help':
        output = 'Available commands: help, clear, echo, date, whoami, ls, pwd';
        break;
      case 'clear':
        setHistory([]);
        return;
      case 'date':
        output = new Date().toString();
        break;
      case 'whoami':
        output = 'user';
        break;
      case 'pwd':
        output = '/home/user';
        break;
      case 'ls':
        output = 'Documents  Downloads  Pictures  Projects';
        break;
      default:
        if (trimmed.startsWith('echo ')) {
          output = trimmed.slice(5);
        } else if (trimmed) {
          output = `Command not found: ${trimmed}`;
        }
    }
    
    setHistory(prev => [...prev, { type: 'output', text: output }, { type: 'output', text: '' }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-green-400 font-mono text-sm p-4">
      <div className="flex-1 overflow-auto">
        {history.map((line, i) => (
          <div key={i} className={line.type === 'input' ? 'text-cyan-400' : ''}>
            {line.text}
          </div>
        ))}
        <div className="flex items-center">
          <span className="text-cyan-400">user@weblinuxos:~$ </span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-0 outline-none text-green-400"
            autoFocus
          />
        </div>
        <div ref={endRef} />
      </div>
    </div>
  );
};

export const TerminalMetadata = {
  id: 'terminal',
  name: 'Terminal',
  icon: 'Terminal',
  description: 'A command-line interface for WebLinuxOS',
  category: 'System',
};