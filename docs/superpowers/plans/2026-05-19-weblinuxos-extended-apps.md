# WebLinuxOS 扩展应用实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan-by-task.

**目标：** 实现 47 个扩展应用（Phase 3-9）

---

## Phase 3: 开发效率工具 (10个)

### 1. 剪贴板管理器

```tsx
// packages/apps/utils/clipboard-manager/ClipboardManager.tsx
import React, { useState, useEffect } from 'react';
import { Copy, Trash2, Clock } from 'lucide-react';

interface ClipboardItem {
  id: string;
  content: string;
  timestamp: number;
  type: 'text' | 'code';
}

const ClipboardManager: React.FC = () => {
  const [items, setItems] = useState<ClipboardItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('clipboard-history');
    if (saved) {
      setItems(JSON.parse(saved));
    }
  }, []);

  const saveToClipboard = async (content: string) => {
    await navigator.clipboard.writeText(content);
    const newItem: ClipboardItem = {
      id: `clip-${Date.now()}`,
      content,
      timestamp: Date.now(),
      type: content.includes('\n') || content.includes('{') ? 'code' : 'text',
    };
    const newItems = [newItem, ...items.slice(0, 49)];
    setItems(newItems);
    localStorage.setItem('clipboard-history', JSON.stringify(newItems));
  };

  const handleCopy = (content: string) => {
    saveToClipboard(content);
  };

  const handleDelete = (id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    setItems(newItems);
    localStorage.setItem('clipboard-history', JSON.stringify(newItems));
  };

  const handleClear = () => {
    setItems([]);
    localStorage.removeItem('clipboard-history');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
        <span className="text-sm text-[var(--text-secondary)]">
          {items.length} 条记录
        </span>
        <button
          onClick={handleClear}
          className="text-xs text-[var(--color-error)] hover:underline"
        >
          清空历史
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="group border-b border-[var(--border-color)]/50 p-3 hover:bg-[var(--bg-hover)]"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Clock size={12} />
                {new Date(item.timestamp).toLocaleTimeString()}
                {item.type === 'code' && (
                  <span className="px-1 py-0.5 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded">
                    CODE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCopy(item.content)}
                  className="p-1 rounded hover:bg-[var(--bg-tertiary)]"
                  title="复制"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 rounded hover:bg-[var(--color-error)]/20 text-[var(--color-error)]"
                  title="删除"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <pre className="text-sm font-mono whitespace-pre-wrap break-all text-[var(--text-primary)]">
              {item.content.length > 200
                ? item.content.slice(0, 200) + '...'
                : item.content}
            </pre>
          </div>
        ))}

        {items.length === 0 && (
          <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
            暂无剪贴板历史
          </div>
        )}
      </div>
    </div>
  );
};

export default ClipboardManager;
```

### 2. UUID/哈希生成器

```tsx
// packages/apps/utils/uuid-generator/UuidGenerator.tsx
import React, { useState } from 'react';
import { Copy, RefreshCw, Hash, Key } from 'lucide-react';
import { Button, Input, Card } from '@weblinuxos/ui';

const UuidGenerator: React.FC = () => {
  const [uuid, setUuid] = useState('');
  const [hash, setHash] = useState('');
  const [input, setInput] = useState('');
  const [hashType, setHashType] = useState<'md5' | 'sha1' | 'sha256'>('sha256');

  const generateUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleGenerateUuid = () => {
    setUuid(generateUuid());
  };

  const handleGenerateHash = async () => {
    // Simplified hash generation (in production, use crypto.subtle)
    const data = new TextEncoder().encode(input);
    let hashValue = 0;
    for (let i = 0; i < data.length; i++) {
      hashValue = ((hashValue << 5) - hashValue + data[i]) | 0;
    }
    setHash(Math.abs(hashValue).toString(16).padStart(8, '0'));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <Card title="UUID 生成器">
        <div className="flex items-center gap-2">
          <Input value={uuid} readOnly placeholder="生成的 UUID" />
          <Button onClick={() => setUuid(generateUuid())} icon={<RefreshCw size={14} />}>
            生成
          </Button>
          <Button onClick={() => copyToClipboard(uuid)} icon={<Copy size={14} />}>
            复制
          </Button>
        </div>
      </Card>

      <Card title="哈希生成器">
        <div className="space-y-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入文本..."
          />
          <div className="flex items-center gap-2">
            <select
              value={hashType}
              onChange={(e) => setHashType(e.target.value as any)}
              className="px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-sm"
            >
              <option value="md5">MD5</option>
              <option value="sha1">SHA-1</option>
              <option value="sha256">SHA-256</option>
            </select>
            <Button onClick={handleGenerateHash}>生成哈希</Button>
          </div>
          {hash && (
            <div className="flex items-center gap-2">
              <Input value={hash} readOnly className="font-mono" />
              <Button onClick={() => copyToClipboard(hash)} icon={<Copy size={14} />}>
                复制
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UuidGenerator;
```

### 3-10. 其他效率工具

遵循类似模式创建：
- **进制转换计算器** - 支持 2/8/10/16 进制互转
- **Base64 编解码** - 文本和文件 Base64 转换
- **URL 编解码** - URL 参数编码解码
- **颜色选择器** - 颜色板、格式转换 (HEX/RGB/HSL)
- **图标库浏览器** - Lucide 图标预览与复制
- **时间戳转换器** - Unix 时间戳 ↔ 日期
- **差异对比工具** - 文本/代码 diff 对比
- **代码片段库** - 代码片段收藏与分类

---

## Phase 4: 前端开发工具 (8个)

### 11. CSS 编辑器

```tsx
// packages/apps/frontend/css-editor/CssEditor.tsx
import React, { useState } from 'react';
import { Button, Tabs, TabList, Tab, TabPanel } from '@weblinuxos/ui';

const CssEditor: React.FC = () => {
  const [css, setCss] = useState('.box {\n  width: 100px;\n  height: 100px;\n  background: #007acc;\n}');
  const [html, setHtml] = useState('<div class="box">Hello</div>');

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultTab="split">
        <TabList>
          <Tab id="editor">编辑器</Tab>
          <Tab id="preview">预览</Tab>
          <Tab id="split">分屏</Tab>
        </TabList>

        <TabPanel id="editor" className="flex-1 overflow-hidden">
          <textarea
            value={css}
            onChange={(e) => setCss(e.target.value)}
            className="w-full h-full p-4 bg-[var(--bg-primary)] text-[var(--text-primary)] resize-none outline-none font-mono"
            placeholder="编写 CSS..."
          />
        </TabPanel>

        <TabPanel id="preview" className="flex-1 overflow-auto p-4">
          <iframe
            srcDoc={`<html><style>${css}</style><body>${html}</body></html>`}
            className="w-full h-full border-none"
            title="Preview"
          />
        </TabPanel>

        <TabPanel id="split" className="flex-1 flex overflow-hidden">
          <textarea
            value={css}
            onChange={(e) => setCss(e.target.value)}
            className="flex-1 p-4 bg-[var(--bg-primary)] text-[var(--text-primary)] resize-none outline-none font-mono border-r border-[var(--border-color)]"
          />
          <iframe
            srcDoc={`<html><style>${css}</style><body>${html}</body></html>`}
            className="flex-1 border-none"
            title="Preview"
          />
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default CssEditor;
```

### 12-18. 其他前端工具

- **Flexbox/Grid 可视化** - CSS 布局可视化调试
- **字体预览器** - Google Fonts 预览
- **图像压缩工具** - 使用浏览器 Canvas 压缩
- **SVG 编辑器** - SVG 代码编辑与预览
- **Tailwind CSS 工具** - 类名生成与预览
- **渐变生成器** - CSS 渐变可视化
- **动画曲线编辑器** - CSS 动画贝塞尔曲线

---

## Phase 5: API/后端工具 (8个)

### 19. API 测试工具

```tsx
// packages/apps/api-tools/api-tester/ApiTester.tsx
import React, { useState } from 'react';
import { Button, Input, Textarea, Tabs, TabList, Tab, TabPanel, Badge } from '@weblinuxos/ui';
import { Send, Plus, Trash2 } from 'lucide-react';

interface Header {
  key: string;
  value: string;
}

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Header[];
  body: string;
}

const ApiTester: React.FC = () => {
  const [config, setConfig] = useState<RequestConfig>({
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    body: '',
  });
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    time: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const headers: Record<string, string> = {};
      config.headers.forEach((h) => {
        if (h.key && h.value) {
          headers[h.key] = h.value;
        }
      });

      const options: RequestInit = {
        method: config.method,
        headers,
      };

      if (['POST', 'PUT', 'PATCH'].includes(config.method) && config.body) {
        options.body = config.body;
      }

      const res = await fetch(config.url, options);
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        resHeaders[key] = value;
      });

      const body = await res.text();

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body,
        time: Date.now() - startTime,
      });
    } catch (error) {
      setResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        body: String(error),
        time: Date.now() - startTime,
      });
    }

    setLoading(false);
  };

  const addHeader = () => {
    setConfig((prev) => ({
      ...prev,
      headers: [...prev.headers, { key: '', value: '' }],
    }));
  };

  const removeHeader = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index),
    }));
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    setConfig((prev) => ({
      ...prev,
      headers: prev.headers.map((h, i) => (i === index ? { ...h, [field]: value } : h)),
    }));
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 400 && status < 500) return 'warning';
    if (status >= 500) return 'error';
    return 'default';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[var(--border-color)] space-y-3">
        <div className="flex items-center gap-2">
          <select
            value={config.method}
            onChange={(e) => setConfig((prev) => ({ ...prev, method: e.target.value as any }))}
            className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded font-mono text-sm"
          >
            {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <Input
            value={config.url}
            onChange={(e) => setConfig((prev) => ({ ...prev, url: e.target.value }))}
            placeholder="输入 URL..."
            className="flex-1"
          />
          <Button onClick={handleSend} loading={loading} icon={<Send size={14} />}>
            发送
          </Button>
        </div>

        <Tabs defaultTab="headers">
          <TabList>
            <Tab id="headers">Headers ({config.headers.length})</Tab>
            <Tab id="body">Body</Tab>
          </TabList>

          <TabPanel id="headers" className="space-y-2">
            {config.headers.map((header, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={header.key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  placeholder="Key"
                  className="flex-1"
                />
                <Input
                  value={header.value}
                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  placeholder="Value"
                  className="flex-1"
                />
                <Button onClick={() => removeHeader(index)} variant="ghost" size="sm">
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
            <Button onClick={addHeader} variant="ghost" size="sm" icon={<Plus size={14} />}>
              添加 Header
            </Button>
          </TabPanel>

          <TabPanel id="body">
            <Textarea
              value={config.body}
              onChange={(e) => setConfig((prev) => ({ ...prev, body: e.target.value }))}
              placeholder="请求体 (JSON)..."
              className="min-h-[150px] font-mono text-sm"
            />
          </TabPanel>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {response && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant={getStatusColor(response.status) as any}>
                {response.status} {response.statusText}
              </Badge>
              <span className="text-xs text-[var(--text-secondary)]">
                用时: {response.time}ms
              </span>
            </div>

            <div className="text-xs text-[var(--text-secondary)] mb-2">
              Response Headers
            </div>
            <div className="bg-[var(--bg-primary)] rounded p-2 text-xs font-mono mb-4">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key}>
                  <span className="text-[var(--accent-primary)]">{key}</span>: {value}
                </div>
              ))}
            </div>

            <div className="text-xs text-[var(--text-secondary)] mb-2">Response Body</div>
            <pre className="bg-[var(--bg-primary)] rounded p-4 text-sm font-mono overflow-auto max-h-[400px]">
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(response.body), null, 2);
                } catch {
                  return response.body;
                }
              })()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiTester;
```

### 20-26. 其他 API 工具

- **JWT 解码器** - JWT 解析与验证
- **WebSocket 测试器** - WebSocket 连接测试
- **GraphQL 客户端** - GraphQL 查询与探索
- **cURL 生成器** - 从请求生成 cURL 命令
- **OAuth 调试工具** - OAuth 流程调试
- **Webhook 测试器** - Webhook 请求捕获
- **请求历史记录** - API 请求历史管理

---

## Phase 6: 数据库工具 (5个)

### 27. SQL 编辑器

```tsx
// packages/apps/database/sql-editor/SqlEditor.tsx
import React, { useState } from 'react';
import { Button, Textarea, Card, Table } from '@weblinuxos/ui';
import { Play, Download, Upload } from 'lucide-react';

interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTime: number;
}

const SqlEditor: React.FC = () => {
  const [query, setQuery] = useState('SELECT * FROM users;');
  const [results, setResults] = useState<QueryResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Simplified in-memory database simulation
  const executeQuery = async () => {
    try {
      // Simulated execution
      const startTime = Date.now();
      
      // Parse and execute query (simplified)
      const simulatedResults: QueryResult = {
        columns: ['id', 'name', 'email'],
        rows: [
          { id: 1, name: 'Alice', email: 'alice@example.com' },
          { id: 2, name: 'Bob', email: 'bob@example.com' },
        ],
        rowCount: 2,
        executionTime: Date.now() - startTime,
      };

      setResults((prev) => [simulatedResults, ...prev]);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[var(--border-color)]">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="编写 SQL 查询..."
          className="min-h-[100px] font-mono text-sm"
        />
        <div className="flex items-center gap-2 mt-3">
          <Button onClick={executeQuery} icon={<Play size={14} />}>
            执行
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {error && (
          <div className="p-3 bg-[var(--color-error)]/20 text-[var(--color-error)] rounded mb-4">
            {error}
          </div>
        )}

        {results.map((result, index) => (
          <Card key={index} className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--text-secondary)]">
                {result.rowCount} 行 (用时 {result.executionTime}ms)
              </span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    {result.columns.map((col) => (
                      <th key={col} className="text-left px-3 py-2 bg-[var(--bg-tertiary)]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {result.columns.map((col) => (
                        <td key={col} className="px-3 py-2 border-t border-[var(--border-color)]">
                          {String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SqlEditor;
```

### 28-31. 其他数据库工具

- **MongoDB 客户端** - MongoDB 数据浏览（模拟）
- **Redis 客户端** - Redis 键值查看（模拟）
- **ER 图绘制器** - 数据库 ER 图绘制
- **数据库迁移工具** - SQL 迁移脚本生成

---

## Phase 7-9: 资产、文档、终端、安全工具 (16个)

### 32-47. 其他工具

**资产工具：**
- **Favicon 生成器** - 图片转 Favicon
- **占位图生成器** - placeholder.com API
- **图片转 Base64** - 图片 Base64 编码
- **表情符号选择器** - Emoji 查找与复制
- **字符画生成器** - ASCII Art 生成

**文档工具：**
- **表格生成器** - Markdown 表格生成
- **文档预览器** - PDF/MD 文件预览
- **项目文档浏览器** - 项目 README 导航
- **快速笔记** - 临时笔记工具

**终端工具：**
- **Cron 表达式工具** - Cron 表达式解析与预览
- **环境变量管理器** - 环境变量编辑与管理
- **Shell 脚本编辑器** - Shell 脚本编写与运行
- **进程监控面板** - 模拟进程列表

**安全工具：**
- **密码生成器** - 安全密码生成
- **SSL 证书查看器** - SSL 证书信息解析
- **安全头检测器** - HTTP 安全头检查

---

## 应用注册模板

```typescript
// packages/apps/index.ts - 扩展应用注册

import { registerApp } from '@weblinuxos/core';

export const registerExtendedApps = () => {
  // 开发效率工具
  registerApp({
    id: 'clipboard-manager',
    name: '剪贴板管理器',
    icon: '📋',
    category: 'system',
    component: React.lazy(() => import('./utils/clipboard-manager')),
    defaultSize: { width: 400, height: 500 },
  });

  // ... register all extended apps
};
```

---

## 验收标准

- [ ] 所有 47 个扩展应用可正常打开
- [ ] 工具功能完整可用
- [ ] UI 风格与核心应用一致

---

**文档状态：** ✅ 扩展应用实施计划完成
