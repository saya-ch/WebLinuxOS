import React, { useState } from 'react';
import { Textarea, Tabs, TabsContent, TabsList, TabsTrigger } from '@weblinuxos/ui';
import ReactMarkdown from 'react-markdown';

export const MarkdownEditor = () => {
  const [markdown, setMarkdown] = useState(`# Welcome to Markdown Editor

This is a **simple** markdown editor with real-time preview!

## Features

- Write markdown on the left
- See preview on the right
- Supports standard markdown syntax

## Example

\`\`\`javascript
function hello() {
  return "Hello, world!";
}
\`\`\`

> This is a blockquote

- List item 1
- List item 2
- List item 3
`);

  return (
    <div className="h-full flex flex-col bg-zinc-900 text-zinc-100">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700 bg-zinc-800">
        <span className="text-xs text-zinc-400">document.md</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="split" className="h-full">
          <TabsList className="w-full justify-start border-b border-zinc-700 px-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="split">Split View</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="h-[calc(100%-2.5rem)]">
            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="h-full w-full resize-none border-0 rounded-none bg-transparent font-mono text-sm p-4 focus:ring-0"
            />
          </TabsContent>
          <TabsContent value="split" className="h-[calc(100%-2.5rem)] flex">
            <div className="w-1/2 border-r border-zinc-700">
              <Textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="h-full w-full resize-none border-0 rounded-none bg-transparent font-mono text-sm p-4 focus:ring-0"
              />
            </div>
            <div className="w-1/2 overflow-auto p-4 prose prose-invert max-w-none">
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          </TabsContent>
          <TabsContent value="preview" className="h-[calc(100%-2.5rem)] overflow-auto p-4 prose prose-invert max-w-none">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export const MarkdownEditorMetadata = {
  id: 'markdown-editor',
  name: 'Markdown Editor',
  icon: 'FileText',
  description: 'Write and preview markdown documents',
  category: 'Productivity',
};