import React, { useState } from 'react';
import { Textarea } from '@weblinuxos/ui';

export const CodeEditor = () => {
  const [code, setCode] = useState(`// Welcome to WebLinuxOS Code Editor
function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("World"));
`);

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700 bg-zinc-800">
        <span className="text-xs text-zinc-400">code.ts</span>
      </div>
      <div className="flex-1 overflow-auto">
        <Textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-full w-full resize-none border-0 rounded-none bg-transparent text-green-400 font-mono text-sm p-4 focus:ring-0"
        />
      </div>
    </div>
  );
};

export const CodeEditorMetadata = {
  id: 'code-editor',
  name: 'Code Editor',
  icon: 'Code2',
  description: 'A simple code editor for writing and editing code',
  category: 'Development',
};