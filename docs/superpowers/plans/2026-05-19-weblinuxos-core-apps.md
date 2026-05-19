# WebLinuxOS 核心应用实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**目标：** 实现 9 个核心应用（代码编辑器、终端、文件管理器、数据库客户端、API 测试工具、Git 可视化、Markdown 编辑器、JSON 工具、浏览器预览）

**技术栈：** React 18 + Monaco Editor + Xterm.js + react-markdown

---

## 1. 代码编辑器

### Task 1: Monaco 代码编辑器

**Files:**
- Create: `packages/apps/code-editor/CodeEditor.tsx`
- Create: `packages/apps/code-editor/index.ts`

- [ ] **Step 1: 创建 CodeEditor.tsx**

```tsx
import React, { useState, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useStore } from '@weblinuxos/core';
import { Tabs, Tab, TabList, TabPanel } from '@weblinuxos/ui';
import { File, Plus, Save, FolderOpen } from 'lucide-react';

interface FileTab {
  id: string;
  name: string;
  path: string;
  content: string;
  modified: boolean;
}

const CodeEditor: React.FC = () => {
  const { readFile, writeFile, listDirectory } = useStore();
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [currentContent, setCurrentContent] = useState('');

  const activeTab = tabs.find((t) => t.id === activeTabId);

  useEffect(() => {
    if (activeTab) {
      setCurrentContent(activeTab.content);
    }
  }, [activeTabId]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    monaco.editor.defineTheme('weblinux-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#cccccc',
        'editor.lineHighlightBackground': '#2d2d2d',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#aeafad',
      },
    });
    monaco.editor.setTheme('weblinux-dark');
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!activeTab || value === undefined) return;
    setCurrentContent(value);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, content: value, modified: true } : t
      )
    );
  };

  const handleNewFile = () => {
    const name = prompt('输入文件名:');
    if (!name) return;

    const id = `file-${Date.now()}`;
    setTabs((prev) => [
      ...prev,
      {
        id,
        name,
        path: `/home/user/${name}`,
        content: '',
        modified: false,
      },
    ]);
    setActiveTabId(id);
  };

  const handleOpenFile = async () => {
    const path = prompt('输入文件路径:');
    if (!path) return;

    const result = await readFile(path);
    if (!result.success) {
      alert(result.error);
      return;
    }

    const name = path.split('/').pop() || 'untitled';
    const id = `file-${Date.now()}`;

    setTabs((prev) => [
      ...prev,
      {
        id,
        name,
        path,
        content: result.data?.content || '',
        modified: false,
      },
    ]);
    setActiveTabId(id);
  };

  const handleSave = async () => {
    if (!activeTab) return;

    if (activeTab.path.includes('untitled')) {
      const newPath = prompt('保存为:', activeTab.path);
      if (!newPath) return;
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, path: newPath } : t))
      );
    }

    const result = await writeFile(activeTab.path, currentContent);
    if (result.success) {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, modified: false } : t))
      );
    } else {
      alert(result.error);
    }
  };

  const handleCloseTab = (id: string) => {
    const tab = tabs.find((t) => t.id === id);
    if (tab?.modified) {
      if (!confirm('文件有未保存的更改，确定关闭?')) return;
    }

    setTabs((prev) => prev.filter((t) => t.id !== id));
    if (activeTabId === id) {
      setActiveTabId(tabs.find((t) => t.id !== id)?.id || null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
        <button
          onClick={handleNewFile}
          className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          title="新建文件"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={handleOpenFile}
          className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          title="打开文件"
        >
          <FolderOpen size={16} />
        </button>
        <button
          onClick={handleSave}
          className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          title="保存"
        >
          <Save size={16} />
        </button>
      </div>

      {tabs.length > 0 ? (
        <>
          <Tabs defaultTab={activeTabId || ''}>
            <TabList className="overflow-x-auto">
              {tabs.map((tab) => (
                <Tab
                  key={tab.id}
                  id={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  {tab.modified && <span className="text-[var(--color-warning)]">●</span>}
                  {tab.name}
                </Tab>
              ))}
            </TabList>
          </Tabs>

          {activeTab && (
            <div className="flex-1">
              <Editor
                height="100%"
                language={getLanguageFromFilename(activeTab.name)}
                value={currentContent}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                  lineNumbers: 'on',
                  renderWhitespace: 'selection',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
          <div className="text-center">
            <File size={48} className="mx-auto mb-4 opacity-50" />
            <p>没有打开的文件</p>
            <p className="text-xs mt-2">
              点击 + 创建新文件或使用 Ctrl+O 打开文件
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languages: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    md: 'markdown',
    py: 'python',
    sql: 'sql',
    sh: 'shell',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
  };
  return languages[ext || ''] || 'plaintext';
};

export default CodeEditor;
```

---

## 2. 模拟终端

### Task 2: Xterm.js 终端

**Files:**
- Create: `packages/apps/terminal/Terminal.tsx`
- Create: `packages/apps/terminal/index.ts`

- [ ] **Step 1: 创建 Terminal.tsx**

```tsx
import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useStore } from '@weblinuxos/core';
import { commands } from '@weblinuxos/core';
import 'xterm/css/xterm.css';

const Terminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const currentPathRef = useRef('/home/user');
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  const writeOutput = (text: string, isError = false) => {
    if (xtermRef.current) {
      xtermRef.current.writeln(isError ? `\x1b[31m${text}\x1b[0m` : text);
    }
  };

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const xterm = new XTerm({
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#aeafad',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#f14c4c',
        green: '#4ec9b0',
        yellow: '#dcdcaa',
        blue: '#3794ff',
        magenta: '#c586c0',
        cyan: '#4dc9b0',
        white: '#cccccc',
        brightBlack: '#5a5a5a',
        brightRed: '#f14c4c',
        brightGreen: '#4ec9b0',
        brightYellow: '#dcdcaa',
        brightBlue: '#3794ff',
        brightMagenta: '#c586c0',
        brightCyan: '#4dc9b0',
        brightWhite: '#ffffff',
      },
      fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
      fontSize: 14,
      cursorBlink: true,
      cursorStyle: 'block',
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    xterm.writeln('\x1b[36mWebLinuxOS Shell v1.0.0\x1b[0m');
    xterm.writeln('输入 help 获取帮助\r\n');

    const prompt = () => {
      if (xtermRef.current) {
        xtermRef.current.write(`\r\n\x1b[36m${currentPathRef.current}\x1b[0m $ `);
      }
    };

    prompt();

    let buffer = '';

    const executeCommand = async (cmd: string) => {
      const trimmedCmd = cmd.trim();
      if (!trimmedCmd) {
        prompt();
        return;
      }

      historyRef.current.push(trimmedCmd);
      historyIndexRef.current = -1;

      const parts = trimmedCmd.split(/\s+/);
      const commandName = parts[0];
      const args = parts.slice(1);

      if (commandName === 'clear') {
        xterm.clear();
        prompt();
        return;
      }

      const command = commands[commandName];
      if (!command) {
        writeOutput(`${commandName}: 命令未找到`, true);
        prompt();
        return;
      }

      const env = {
        currentPath: currentPathRef.current,
        setCurrentPath: (path: string) => {
          currentPathRef.current = path;
        },
        history: historyRef.current,
        addToHistory: () => {},
      };

      try {
        const result = await command.execute(args, env);
        if (result.output) {
          writeOutput(result.output);
        }
        if (result.error) {
          writeOutput(result.error, true);
        }
      } catch (error) {
        writeOutput(`${commandName}: ${error}`, true);
      }

      prompt();
    };

    xterm.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      if (domEvent.key === 'Enter') {
        executeCommand(buffer);
        buffer = '';
      } else if (domEvent.key === 'Backspace') {
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          xterm.write('\b \b');
        }
      } else if (domEvent.key === 'ArrowUp') {
        if (historyRef.current.length > 0) {
          if (historyIndexRef.current < historyRef.current.length - 1) {
            historyIndexRef.current++;
            const cmd = historyRef.current[historyRef.current.length - 1 - historyIndexRef.current];
            xterm.write(`\r\x1b[K${currentPathRef.current} $ ${cmd}`);
            buffer = cmd;
          }
        }
      } else if (domvent.key === 'ArrowDown') {
        if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
          const cmd = historyRef.current[historyRef.current.length - 1 - historyIndexRef.current];
          xterm.write(`\r\x1b[K${currentPathRef.current} $ ${cmd}`);
          buffer = cmd;
        } else if (historyIndexRef.current === 0) {
          historyIndexRef.current = -1;
          buffer = '';
          xterm.write(`\r\x1b[K${currentPathRef.current} $ `);
        }
      } else if (printable) {
        buffer += key;
        xterm.write(key);
      }
    });

    xterm.onData((data) => {
      if (data === '\r') {
        executeCommand(buffer);
        buffer = '';
      } else if (data === '\x7f') {
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          xterm.write('\b \b');
        }
      } else {
        buffer += data;
        xterm.write(data);
      }
    });

    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      xterm.dispose();
    };
  }, []);

  return (
    <div ref={terminalRef} className="h-full w-full bg-[var(--bg-primary)]" />
  );
};

export default Terminal;
```

---

## 3. 文件管理器

### Task 3: 文件管理器

**Files:**
- Create: `packages/apps/file-manager/FileManager.tsx`
- Create: `packages/apps/file-manager/index.ts`

- [ ] **Step 1: 创建 FileManager.tsx**

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@weblinuxos/core';
import { Tree, TreeNode } from '@weblinuxos/ui';
import { Folder, File, FolderPlus, FilePlus, Trash2, RefreshCw } from 'lucide-react';
import { getFileTree, createFile, createDirectory, deleteNode, listDirectory } from '@weblinuxos/core';

const FileManager: React.FC = () => {
  const { tree, setTree } = useStore();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [directoryContents, setDirectoryContents] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('list');

  const loadDirectory = useCallback(async (path: string) => {
    const listing = await listDirectory(path);
    setDirectoryContents(listing.items);
    setSelectedPath(path);
  }, []);

  useEffect(() => {
    loadDirectory('/home/user');
  }, [loadDirectory]);

  const handleNodeSelect = async (node: TreeNode) => {
    if (node.type === 'folder') {
      await loadDirectory(node.path || node.name);
    }
  };

  const handleNewFolder = async () => {
    const name = prompt('输入文件夹名称:');
    if (!name || !selectedPath) return;

    const result = await createDirectory(selectedPath, name);
    if (result.success) {
      await loadDirectory(selectedPath);
    } else {
      alert(result.error);
    }
  };

  const handleNewFile = async () => {
    const name = prompt('输入文件名:');
    if (!name || !selectedPath) return;

    const result = await createFile(selectedPath, name, '');
    if (result.success) {
      await loadDirectory(selectedPath);
    } else {
      alert(result.error);
    }
  };

  const handleDelete = async (path: string) => {
    if (!confirm('确定删除?')) return;

    const result = await deleteNode(path);
    if (result.success && selectedPath) {
      await loadDirectory(selectedPath);
    } else if (result.error) {
      alert(result.error);
    }
  };

  const handleRefresh = async () => {
    if (selectedPath) {
      await loadDirectory(selectedPath);
    }
  };

  const handleDoubleClick = async (item: any) => {
    if (item.type === 'folder') {
      await loadDirectory(item.path);
    } else {
      // Open file in code editor
      useStore.getState().openWindow('code-editor', { path: item.path });
    }
  };

  const getFileIcon = (item: any) => {
    if (item.type === 'folder') {
      return <Folder size={16} className="text-[var(--accent-primary)]" />;
    }
    return <File size={16} className="text-[var(--text-secondary)]" />;
  };

  const getParentPath = (path: string) => {
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    return '/' + parts.join('/');
  };

  const getBreadcrumbs = () => {
    if (!selectedPath) return [];
    return selectedPath.split('/').filter(Boolean).map((part, index, arr) => ({
      name: part,
      path: '/' + arr.slice(0, index + 1).join('/'),
    }));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
        <button
          onClick={() => selectedPath && loadDirectory(getParentPath(selectedPath))}
          className="px-2 py-1 text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded hover:bg-[var(--bg-hover)]"
        >
          ⬆️ 返回
        </button>
        <button
          onClick={handleNewFolder}
          className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          title="新建文件夹"
        >
          <FolderPlus size={16} />
        </button>
        <button
          onClick={handleNewFile}
          className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          title="新建文件"
        >
          <FilePlus size={16} />
        </button>
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          title="刷新"
        >
          <RefreshCw size={16} />
        </button>

        <div className="flex-1" />

        <div className="text-xs text-[var(--text-secondary)]">
          {selectedPath}
        </div>
      </div>

      <div className="flex items-center gap-1 px-3 py-1 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-xs">
        {[
          { name: '名称', width: 'flex-1' },
          { name: '大小', width: 'w-24' },
          { name: '修改时间', width: 'w-40' },
        ].map((header) => (
          <div key={header.name} className={`${header.width} text-[var(--text-secondary)] font-medium`}>
            {header.name}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {directoryContents.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedPath(item.path)}
            onDoubleClick={() => handleDoubleClick(item)}
            className="
              flex items-center gap-2 px-3 py-1.5 cursor-pointer
              hover:bg-[var(--bg-hover)]
              border-b border-[var(--border-color)]/50
            "
          >
            <div className="flex-1 flex items-center gap-2 min-w-0">
              {getFileIcon(item)}
              <span className="truncate">{item.name}</span>
            </div>
            <div className="w-24 text-xs text-[var(--text-secondary)]">
              {item.type === 'file' ? formatSize(item.size || 0) : '-'}
            </div>
            <div className="w-40 text-xs text-[var(--text-secondary)]">
              {new Date(item.updatedAt).toLocaleString()}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item.path);
              }}
              className="p-1 rounded opacity-0 hover:opacity-100 hover:bg-[var(--color-error)]/20 text-[var(--color-error)]"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {directoryContents.length === 0 && (
          <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
            <div className="text-center">
              <Folder size={48} className="mx-auto mb-4 opacity-50" />
              <p>文件夹为空</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default FileManager;
```

---

## 4-9. 其他核心应用

### Task 4: Markdown 编辑器

**Files:**
- Create: `packages/apps/markdown-editor/MarkdownEditor.tsx`

```tsx
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useStore } from '@weblinuxos/core';
import { Tabs, TabList, Tab, TabPanel } from '@weblinuxos/ui';
import { Save } from 'lucide-react';

const MarkdownEditor: React.FC<{ windowId?: string }> = () => {
  const { readFile, writeFile } = useStore();
  const [content, setContent] = useState('# Hello World\n\nThis is a **Markdown** editor.');
  const [path, setPath] = useState<string | null>(null);

  const handleSave = async () => {
    const savePath = path || prompt('保存路径:', '/home/user/notes/untitled.md');
    if (!savePath) return;

    const result = await writeFile(savePath, content);
    if (result.success) {
      setPath(savePath);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
        <span className="text-xs text-[var(--text-secondary)]">
          {path || '未保存'}
        </span>
        <button
          onClick={handleSave}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)]"
        >
          <Save size={12} />
          保存
        </button>
      </div>

      <Tabs defaultTab="editor" className="flex-1 flex flex-col">
        <TabList>
          <Tab id="editor">编辑</Tab>
          <Tab id="preview">预览</Tab>
          <Tab id="split">分屏</Tab>
        </TabList>

        <TabPanel id="editor" className="flex-1 overflow-hidden">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full p-4 bg-[var(--bg-primary)] text-[var(--text-primary)] resize-none outline-none font-mono text-sm"
            placeholder="在这里编写 Markdown..."
          />
        </TabPanel>

        <TabPanel id="preview" className="flex-1 overflow-auto p-4">
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </TabPanel>

        <TabPanel id="split" className="flex-1 flex overflow-hidden">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 p-4 bg-[var(--bg-primary)] text-[var(--text-primary)] resize-none outline-none font-mono text-sm border-r border-[var(--border-color)]"
          />
          <div className="flex-1 p-4 overflow-auto bg-[var(--bg-secondary)]">
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default MarkdownEditor;
```

### Task 5: JSON 工具

```tsx
// packages/apps/json-tools/JsonTools.tsx
import React, { useState } from 'react';
import { Button, Textarea, Tabs, TabList, Tab, TabPanel } from '@weblinuxos/ui';
import { Copy, Check, AlertCircle } from 'lucide-react';

const JsonTools: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  };

  const handleValidate = () => {
    try {
      JSON.parse(input);
      setError(null);
      setOutput('✅ JSON 格式有效');
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      <div className="flex items-center gap-2">
        <Button onClick={handleFormat}>格式化</Button>
        <Button onClick={handleMinify}>压缩</Button>
        <Button onClick={handleValidate}>验证</Button>
        <div className="flex-1" />
        <Button onClick={handleCopy} icon={copied ? <Check size={14} /> : <Copy size={14} />}>
          {copied ? '已复制' : '复制'}
        </Button>
      </div>

      <Tabs defaultTab="format">
        <TabList>
          <Tab id="format">格式化</Tab>
          <Tab id="validate">验证</Tab>
          <Tab id="path">JSON Path</Tab>
        </TabList>

        <TabPanel id="format" className="flex-1 flex gap-4 overflow-hidden">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入 JSON..."
            className="flex-1 font-mono text-sm"
          />
          <Textarea
            value={error ? `❌ ${error}` : output}
            readOnly
            className="flex-1 font-mono text-sm"
          />
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default JsonTools;
```

### Task 6-9: API 测试工具、数据库客户端、Git 可视化、浏览器预览

这些应用遵循类似的模式，具体实现将在扩展应用计划中详细说明。

---

## 应用注册

### Task 10: 注册所有核心应用

**Files:**
- Create: `packages/apps/index.ts`

```typescript
import { registerApp } from '@weblinuxos/core';
import CodeEditor from './code-editor/CodeEditor';
import Terminal from './terminal/Terminal';
import FileManager from './file-manager/FileManager';
import MarkdownEditor from './markdown-editor/MarkdownEditor';
import JsonTools from './json-tools/JsonTools';

export const registerApps = () => {
  registerApp({
    id: 'code-editor',
    name: '代码编辑器',
    icon: '📝',
    category: 'development',
    component: CodeEditor,
    defaultSize: { width: 900, height: 700 },
    minSize: { width: 400, height: 300 },
  });

  registerApp({
    id: 'terminal',
    name: '终端',
    icon: '💻',
    category: 'development',
    component: Terminal,
    defaultSize: { width: 800, height: 500 },
    minSize: { width: 400, height: 300 },
  });

  registerApp({
    id: 'file-manager',
    name: '文件管理器',
    icon: '📁',
    category: 'development',
    component: FileManager,
    defaultSize: { width: 700, height: 500 },
    minSize: { width: 400, height: 300 },
  });

  registerApp({
    id: 'markdown-editor',
    name: 'Markdown 编辑器',
    icon: '📄',
    category: 'docs',
    component: MarkdownEditor,
    defaultSize: { width: 800, height: 600 },
    minSize: { width: 400, height: 300 },
  });

  registerApp({
    id: 'json-tools',
    name: 'JSON 工具',
    icon: '{ }',
    category: 'utilities',
    component: JsonTools,
    defaultSize: { width: 800, height: 600 },
  });

  // ... register other core apps
};
```

---

## 验收标准

- [ ] 代码编辑器支持语法高亮和多文件
- [ ] 终端可执行 Shell 命令
- [ ] 文件管理器可浏览和操作文件
- [ ] Markdown 编辑器支持实时预览
- [ ] JSON 工具支持格式化和验证

---

**文档状态：** ✅ 核心应用实施计划完成
