import { useState, useCallback, useEffect, useMemo } from 'react'
import { useStore } from '../store'
import {
  Code2, FileCode, Blocks, BookOpen, Settings,
  Copy, Download, Search, Star, Clock, Trash2,
  Play, FolderOpen, Terminal,
  Cpu, Globe, Zap,
  ExternalLink, RefreshCw
} from 'lucide-react'

// 代码片段类型
interface CodeSnippet {
  id: string
  title: string
  code: string
  language: string
  tags: string[]
  category: string
  createdAt: string
  usageCount: number
  favorite: boolean
}

// 项目模板类型
interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  files: TemplateFile[]
  dependencies: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

interface TemplateFile {
  name: string
  content: string
  language: string
}

// API文档类型
interface ApiDoc {
  id: string
  name: string
  description: string
  baseUrl: string
  endpoints: ApiEndpoint[]
  category: string
  authType: string
}

interface ApiEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  description: string
  params?: string[]
}

// 工具链配置类型
interface ToolchainConfig {
  id: string
  name: string
  tools: ToolItem[]
  description: string
}

interface ToolItem {
  name: string
  version: string
  category: string
  config?: string
}

// 预设代码片段库
const defaultSnippets: CodeSnippet[] = [
  {
    id: 'js-1',
    title: 'React useState Hook',
    code: `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`,
    language: 'typescript',
    tags: ['React', 'Hooks', 'State'],
    category: 'React',
    createdAt: new Date().toISOString(),
    usageCount: 0,
    favorite: false
  },
  {
    id: 'js-2',
    title: 'fetch API 基本用法',
    code: `async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}`,
    language: 'javascript',
    tags: ['API', 'Fetch', 'Async'],
    category: '网络请求',
    createdAt: new Date().toISOString(),
    usageCount: 0,
    favorite: false
  },
  {
    id: 'ts-1',
    title: 'TypeScript 泛型函数',
    code: `function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

interface User {
  name: string;
  age: number;
}

const user: User = { name: 'Alice', age: 25 };
const userName = getProperty(user, 'name'); // string
const userAge = getProperty(user, 'age');   // number`,
    language: 'typescript',
    tags: ['TypeScript', 'Generic', 'Types'],
    category: 'TypeScript',
    createdAt: new Date().toISOString(),
    usageCount: 0,
    favorite: false
  },
  {
    id: 'node-1',
    title: 'Express 路基本设置',
    code: 'const express = require(\'express\');\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(express.json());\n\napp.get(\'/api/users\', (req, res) => {\n  res.json({ users: [] });\n});\n\napp.post(\'/api/users\', (req, res) => {\n  const { name, email } = req.body;\n  res.status(201).json({ id: 1, name, email });\n});\n\napp.listen(PORT, () => {\n  console.log(\'Server running on port \' + PORT);\n});',
    language: 'javascript',
    tags: ['Express', 'Node.js', 'API'],
    category: '后端',
    createdAt: new Date().toISOString(),
    usageCount: 0,
    favorite: false
  },
  {
    id: 'css-1',
    title: 'CSS Flexbox 布局模板',
    code: `.container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.item {
  flex: 1;
  min-width: 0;
  padding: 10px;
  border-radius: 8px;
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}`,
    language: 'css',
    tags: ['CSS', 'Flexbox', 'Layout'],
    category: 'CSS',
    createdAt: new Date().toISOString(),
    usageCount: 0,
    favorite: false
  }
]

// 预设项目模板
const projectTemplates: ProjectTemplate[] = [
  {
    id: 'template-react',
    name: 'React + TypeScript 项目',
    description: '现代化的 React 项目模板，包含 TypeScript 和 Vite',
    category: '前端',
    icon: '⚛️',
    files: [
      { name: 'App.tsx', content: 'import { useState } from "react";\n\nfunction App() {\n  return <div>Hello World</div>;\n}\n\nexport default App;', language: 'typescript' },
      { name: 'main.tsx', content: 'import React from "react";\nimport App from "./App";\n\nReactDOM.createRoot(document.getElementById("root")).render(<App />);', language: 'typescript' }
    ],
    dependencies: ['react', 'react-dom', 'typescript', 'vite'],
    difficulty: 'intermediate'
  },
  {
    id: 'template-node',
    name: 'Node.js API 服务',
    description: 'Express + TypeScript 后端 API 模板',
    category: '后端',
    icon: '🟢',
    files: [
      { name: 'server.ts', content: 'import express from "express";\n\nconst app = express();\napp.use(express.json());\n\napp.listen(3000, () => console.log("Server running"));', language: 'typescript' },
      { name: 'routes/users.ts', content: 'app.get("/users", (req, res) => res.json({ users: [] }));', language: 'typescript' }
    ],
    dependencies: ['express', 'typescript', '@types/express'],
    difficulty: 'intermediate'
  },
  {
    id: 'template-cli',
    name: 'CLI 工具项目',
    description: 'Node.js 命令行工具模板',
    category: '工具',
    icon: '💻',
    files: [
      { name: 'index.ts', content: '#!/usr/bin/env node\nimport { program } from "commander";\n\nprogram.version("1.0.0").parse();', language: 'typescript' }
    ],
    dependencies: ['commander', 'chalk', 'inquirer'],
    difficulty: 'beginner'
  },
  {
    id: 'template-library',
    name: 'NPM 库项目',
    description: '可发布的 NPM 包模板',
    category: '库',
    icon: '📦',
    files: [
      { name: 'index.ts', content: 'export function hello(name: string) {\n  return `Hello, ${name}!`;\n}', language: 'typescript' }
    ],
    dependencies: ['typescript', 'vitest'],
    difficulty: 'intermediate'
  }
]

// 预设API文档
const apiDocs: ApiDoc[] = [
  {
    id: 'api-rest',
    name: 'RESTful API 设计指南',
    description: 'RESTful API 最佳实践和设计原则',
    baseUrl: '/api/v1',
    endpoints: [
      { path: '/users', method: 'GET', description: '获取用户列表', params: ['page', 'limit'] },
      { path: '/users/:id', method: 'GET', description: '获取单个用户详情' },
      { path: '/users', method: 'POST', description: '创建新用户' },
      { path: '/users/:id', method: 'PUT', description: '更新用户信息' },
      { path: '/users/:id', method: 'DELETE', description: '删除用户' }
    ],
    category: '设计指南',
    authType: 'Bearer Token'
  },
  {
    id: 'api-open-meteo',
    name: 'Open-Meteo 天气 API',
    description: '免费的天气数据 API',
    baseUrl: 'https://api.open-meteo.com/v1',
    endpoints: [
      { path: '/forecast', method: 'GET', description: '获取天气预报', params: ['latitude', 'longitude', 'hourly'] },
      { path: '/archive', method: 'GET', description: '获取历史天气数据', params: ['latitude', 'longitude', 'start_date', 'end_date'] }
    ],
    category: '公共API',
    authType: '无需认证'
  },
  {
    id: 'api-github',
    name: 'GitHub REST API',
    description: 'GitHub API 接口文档',
    baseUrl: 'https://api.github.com',
    endpoints: [
      { path: '/users/:username', method: 'GET', description: '获取用户信息' },
      { path: '/repos/:owner/:repo', method: 'GET', description: '获取仓库详情' },
      { path: '/repos/:owner/:repo/issues', method: 'GET', description: '获取 Issues 列表' },
      { path: '/repos/:owner/:repo/stargazers', method: 'GET', description: '获取 Star 用户列表' }
    ],
    category: '公共API',
    authType: 'Token / OAuth'
  },
  {
    id: 'api-coingecko',
    name: 'CoinGecko 加密货币 API',
    description: '加密货币行情数据 API',
    baseUrl: 'https://api.coingecko.com/api/v3',
    endpoints: [
      { path: '/ping', method: 'GET', description: '检查API状态' },
      { path: '/coins/list', method: 'GET', description: '获取所有币种列表' },
      { path: '/coins/:id', method: 'GET', description: '获取币种详情' },
      { path: '/simple/price', method: 'GET', description: '获取简单价格', params: ['ids', 'vs_currencies'] }
    ],
    category: '公共API',
    authType: 'API Key (可选)'
  }
]

// 预设工具链配置
const toolchainConfigs: ToolchainConfig[] = [
  {
    id: 'tc-frontend',
    name: '前端开发工具链',
    description: '现代化前端开发必备工具',
    tools: [
      { name: 'Node.js', version: '18.x', category: '运行环境', config: 'ESM' },
      { name: 'Vite', version: '4.x', category: '构建工具', config: 'vite.config.ts' },
      { name: 'TypeScript', version: '5.x', category: '语言', config: 'tsconfig.json' },
      { name: 'ESLint', version: '8.x', category: '代码检查', config: '.eslintrc.js' },
      { name: 'Prettier', version: '3.x', category: '代码格式化', config: '.prettierrc' }
    ]
  },
  {
    id: 'tc-backend',
    name: '后端开发工具链',
    description: 'Node.js 后端开发工具集',
    tools: [
      { name: 'Express', version: '4.x', category: 'Web框架' },
      { name: 'Prisma', version: '5.x', category: 'ORM', config: 'prisma/schema.prisma' },
      { name: 'Jest', version: '29.x', category: '测试框架', config: 'jest.config.js' },
      { name: 'Docker', version: '24.x', category: '容器化', config: 'Dockerfile' }
    ]
  },
  {
    id: 'tc-devops',
    name: 'DevOps 工具链',
    description: '自动化部署和运维工具',
    tools: [
      { name: 'GitHub Actions', version: '', category: 'CI/CD', config: '.github/workflows' },
      { name: 'Docker Compose', version: '2.x', category: '容器编排', config: 'docker-compose.yml' },
      { name: 'Kubernetes', version: '1.28', category: '容器编排', config: 'k8s/' },
      { name: 'Terraform', version: '1.5', category: '基础设施', config: 'terraform/' }
    ]
  }
]

export default function DevEcosystem() {
  const theme = useStore(s => s.theme)
  const addNotification = useStore(s => s.addNotification)

  // 状态管理
  const [activeTab, setActiveTab] = useState<'snippets' | 'templates' | 'docs' | 'tools' | 'run'>('snippets')
  const [snippets, setSnippets] = useState<CodeSnippet[]>(() => {
    const saved = localStorage.getItem('dev-snippets')
    return saved ? JSON.parse(saved) : defaultSnippets
  })
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [selectedApiDoc, setSelectedApiDoc] = useState<ApiDoc | null>(null)
  const [selectedToolchain, setSelectedToolchain] = useState<ToolchainConfig | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [runCode, setRunCode] = useState('')
  const [runOutput, setRunOutput] = useState('')
  const [runLanguage, setRunLanguage] = useState<'javascript' | 'typescript'>('javascript')

  // 保存到本地存储
  useEffect(() => {
    localStorage.setItem('dev-snippets', JSON.stringify(snippets))
  }, [snippets])

  // 获取所有分类
  const snippetCategories = useMemo(() => {
    const cats = new Set(snippets.map(s => s.category))
    return ['all', ...Array.from(cats)]
  }, [snippets])

  // 过滤片段
  const filteredSnippets = useMemo(() => {
    let result = snippets
    if (filterCategory !== 'all') {
      result = result.filter(s => s.category === filterCategory)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.tags.some(t => t.toLowerCase().includes(query)) ||
        s.code.toLowerCase().includes(query)
      )
    }
    return result
  }, [snippets, filterCategory, searchQuery])

  // 复制代码
  const copyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      addNotification({ title: '已复制', message: '代码已复制到剪贴板', type: 'success', duration: 1500 })
    } catch {
      addNotification({ title: '复制失败', message: '无法访问剪贴板', type: 'error', duration: 2000 })
    }
  }, [addNotification])

  // 收藏片段
  const toggleFavorite = useCallback((id: string) => {
    setSnippets(prev => prev.map(s =>
      s.id === id ? { ...s, favorite: !s.favorite } : s
    ))
    addNotification({ title: '收藏更新', message: '收藏状态已更改', type: 'success', duration: 1500 })
  }, [addNotification])

  // 删除片段
  const deleteSnippet = useCallback((id: string) => {
    setSnippets(prev => prev.filter(s => s.id !== id))
    if (selectedSnippet?.id === id) {
      setSelectedSnippet(null)
    }
    addNotification({ title: '已删除', message: '代码片段已删除', type: 'info', duration: 1500 })
  }, [selectedSnippet, addNotification])

  // 添加新片段
  const addSnippet = useCallback(() => {
    const newSnippet: CodeSnippet = {
      id: `snippet-${Date.now()}`,
      title: '新代码片段',
      code: '// 在这里编写你的代码\n',
      language: 'javascript',
      tags: ['新建'],
      category: filterCategory === 'all' ? 'JavaScript' : filterCategory,
      createdAt: new Date().toISOString(),
      usageCount: 0,
      favorite: false
    }
    setSnippets(prev => [...prev, newSnippet])
    setSelectedSnippet(newSnippet)
    addNotification({ title: '创建成功', message: '新代码片段已添加', type: 'success', duration: 1500 })
  }, [filterCategory, addNotification])

  // 使用片段
  const useSnippet = useCallback((snippet: CodeSnippet) => {
    setSnippets(prev => prev.map(s =>
      s.id === snippet.id ? { ...s, usageCount: s.usageCount + 1 } : s
    ))
    setRunCode(snippet.code)
    setRunLanguage(snippet.language as typeof runLanguage)
    setActiveTab('run')
  }, [])

  // 执行代码
  const executeCode = useCallback(() => {
    try {
      // 创建一个安全的执行环境
      const logs: string[] = []
      const mockConsole = {
        log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
        error: (...args: unknown[]) => logs.push('Error: ' + args.map(String).join(' ')),
        warn: (...args: unknown[]) => logs.push('Warning: ' + args.map(String).join(' '))
      }

      // 使用 Function 构造器执行（仅支持 JS）
      const fn = new Function('console', runCode)
      fn(mockConsole)

      setRunOutput(logs.join('\n') || '// 执行成功，无输出')
      addNotification({ title: '执行成功', message: '代码执行完成', type: 'success', duration: 1500 })
    } catch (error) {
      setRunOutput(`// 执行错误:\n${error instanceof Error ? error.message : '未知错误'}`)
      addNotification({ title: '执行失败', message: '代码执行出错', type: 'error', duration: 2000 })
    }
  }, [runCode, addNotification])

  // 样式变量
  const isDark = theme === 'dark'
  const bgGradient = isDark
    ? 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)'
    : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)'
  const cardBg = isDark ? 'rgba(22, 27, 34, 0.8)' : 'rgba(255, 255, 255, 0.95)'
  const accentGradient = 'linear-gradient(135deg, #22c55e 0%, #10b981 50%, #3b82f6 100%)'
  const techGradient = 'linear-gradient(135deg, #3b82f6, #22c55e, #10b981)'
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: bgGradient,
      color: isDark ? '#c9d1d9' : '#1f2937',
      overflow: 'hidden'
    }}>
      {/* 头部 */}
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${borderColor}`,
        background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: techGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(34,197,94,0.3)'
            }}>
              <Blocks size={28} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>开发者生态系统</h1>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.7 }}>代码片段库 + 项目模板 + API文档 + 工具链</p>
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <div style={{
              padding: '10px 16px',
              background: cardBg,
              borderRadius: '12px',
              textAlign: 'center',
              border: `1px solid ${borderColor}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <FileCode size={18} style={{ marginBottom: '4px', color: '#22c55e' }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{snippets.length}</div>
            </div>
            <div style={{
              padding: '10px 16px',
              background: cardBg,
              borderRadius: '12px',
              textAlign: 'center',
              border: `1px solid ${borderColor}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Star size={18} style={{ marginBottom: '4px', color: '#fbbf24' }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{snippets.filter(s => s.favorite).length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 标签导航 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 24px',
        borderBottom: `1px solid ${borderColor}`,
        overflow: 'auto'
      }}>
        {[
          { id: 'snippets', name: '代码片段库', icon: FileCode },
          { id: 'templates', name: '项目模板', icon: FolderOpen },
          { id: 'docs', name: 'API文档', icon: BookOpen },
          { id: 'tools', name: '工具链配置', icon: Settings },
          { id: 'run', name: '代码运行', icon: Play }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: '10px 18px',
              background: activeTab === tab.id
                ? techGradient
                : cardBg,
              color: activeTab === tab.id ? '#fff' : isDark ? '#8b949e' : '#4a5568',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(34,197,94,0.4)' : '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <tab.icon size={18} />
            {tab.name}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, padding: '20px 24px', overflow: 'auto' }}>
        {/* 代码片段库 */}
        {activeTab === 'snippets' && (
          <div style={{ display: 'flex', gap: '24px', height: '100%' }}>
            {/* 片段列表 */}
            <div style={{
              width: '320px',
              background: cardBg,
              borderRadius: '16px',
              padding: '20px',
              border: `1px solid ${borderColor}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* 搜索和过滤 */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <Search size={18} opacity={0.6} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="搜索片段..."
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: isDark ? '#c9d1d9' : '#1f2937',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* 分类过滤 */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {snippetCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      style={{
                        padding: '6px 12px',
                        background: filterCategory === cat ? 'rgba(34,197,94,0.2)' : isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                        color: filterCategory === cat ? '#22c55e' : isDark ? '#8b949e' : '#4a5568',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {cat === 'all' ? '全部' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 片段列表 */}
              <div style={{ flex: 1, overflow: 'auto' }}>
                {filteredSnippets.map(snippet => (
                  <div
                    key={snippet.id}
                    onClick={() => setSelectedSnippet(snippet)}
                    style={{
                      padding: '14px',
                      marginBottom: '8px',
                      background: selectedSnippet?.id === snippet.id
                        ? 'rgba(34,197,94,0.1)'
                        : isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: `1px solid ${selectedSnippet?.id === snippet.id ? '#22c55e' : 'transparent'}`,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '6px'
                    }}>
                      <Code2 size={16} color="#22c55e" />
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{snippet.title}</span>
                      {snippet.favorite && <Star size={14} fill="#fbbf24" color="#fbbf24" />}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        padding: '2px 6px',
                        background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        opacity: 0.7
                      }}>
                        {snippet.language}
                      </span>
                      <span style={{ fontSize: '12px', opacity: 0.6 }}>
                        使用 {snippet.usageCount} 次
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 新建按钮 */}
              <button
                onClick={addSnippet}
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: accentGradient,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
                }}
              >
                <Zap size={18} />
                新建片段
              </button>
            </div>

            {/* 片段详情 */}
            <div style={{
              flex: 1,
              background: cardBg,
              borderRadius: '16px',
              padding: '24px',
              border: `1px solid ${borderColor}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              overflow: 'auto'
            }}>
              {selectedSnippet ? (
                <div>
                  {/* 片段头部 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
                        {selectedSnippet.title}
                      </h3>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          padding: '4px 10px',
                          background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#22c55e'
                        }}>
                          {selectedSnippet.language}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          opacity: 0.6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Clock size={14} />
                          {new Date(selectedSnippet.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <button
                        onClick={() => toggleFavorite(selectedSnippet.id)}
                        style={{
                          padding: '8px 12px',
                          background: selectedSnippet.favorite ? 'rgba(251,191,36,0.2)' : cardBg,
                          color: selectedSnippet.favorite ? '#fbbf24' : isDark ? '#8b949e' : '#4a5568',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Star size={16} fill={selectedSnippet.favorite ? '#fbbf24' : 'none'} />
                        收藏
                      </button>
                      <button
                        onClick={() => copyCode(selectedSnippet.code)}
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(34,197,94,0.1)',
                          color: '#22c55e',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Copy size={16} />
                        复制
                      </button>
                      <button
                        onClick={() => useSnippet(selectedSnippet)}
                        style={{
                          padding: '8px 12px',
                          background: accentGradient,
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(34,197,94,0.3)'
                        }}
                      >
                        <Play size={16} />
                        运行
                      </button>
                      <button
                        onClick={() => deleteSnippet(selectedSnippet.id)}
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(239,68,68,0.1)',
                          color: '#ef4444',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* 标签 */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '20px'
                  }}>
                    {selectedSnippet.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '6px 12px',
                          background: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.05)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#22c55e'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 代码展示 */}
                  <div style={{
                    background: isDark ? '#0d1117' : '#f6f8fa',
                    borderRadius: '12px',
                    padding: '20px',
                    border: `1px solid ${borderColor}`,
                    fontFamily: 'JetBrains Mono, Consolas, monospace',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    overflow: 'auto',
                    maxHeight: '400px'
                  }}>
                    <pre style={{ margin: 0, color: isDark ? '#c9d1d9' : '#24292e' }}>
                      {selectedSnippet.code}
                    </pre>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  opacity: 0.6
                }}>
                  <FileCode size={64} style={{ marginBottom: '16px' }} />
                  <p style={{ margin: 0, fontSize: '16px' }}>选择一个代码片段查看详情</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 项目模板 */}
        {activeTab === 'templates' && (
          <div style={{ display: 'flex', gap: '24px', height: '100%' }}>
            {/* 模板列表 */}
            <div style={{
              width: '320px',
              background: cardBg,
              borderRadius: '16px',
              padding: '20px',
              border: `1px solid ${borderColor}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              overflow: 'auto'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
                可用模板
              </h3>
              {projectTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  style={{
                    padding: '16px',
                    marginBottom: '12px',
                    background: selectedTemplate?.id === template.id
                      ? 'rgba(34,197,94,0.1)'
                      : isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: `1px solid ${selectedTemplate?.id === template.id ? '#22c55e' : 'transparent'}`,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '32px' }}>{template.icon}</span>
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>{template.name}</span>
                  </div>
                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '13px',
                    opacity: 0.7,
                    lineHeight: 1.5
                  }}>
                    {template.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      padding: '4px 8px',
                      background: template.difficulty === 'beginner' ? 'rgba(34,197,94,0.2)'
                        : template.difficulty === 'intermediate' ? 'rgba(59,130,246,0.2)'
                        : 'rgba(239,68,68,0.2)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: template.difficulty === 'beginner' ? '#22c55e'
                        : template.difficulty === 'intermediate' ? '#3b82f6'
                        : '#ef4444'
                    }}>
                      {template.difficulty === 'beginner' ? '入门' : template.difficulty === 'intermediate' ? '中级' : '高级'}
                    </span>
                    <span style={{ fontSize: '12px', opacity: 0.6 }}>
                      {template.files.length} 文件
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 模板详情 */}
            <div style={{
              flex: 1,
              background: cardBg,
              borderRadius: '16px',
              padding: '24px',
              border: `1px solid ${borderColor}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              overflow: 'auto'
            }}>
              {selectedTemplate ? (
                <div>
                  {/* 模板头部 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '24px'
                  }}>
                    <span style={{ fontSize: '48px' }}>{selectedTemplate.icon}</span>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600 }}>
                        {selectedTemplate.name}
                      </h3>
                      <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>
                        {selectedTemplate.description}
                      </p>
                    </div>
                  </div>

                  {/* 文件列表 */}
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
                    项目文件结构
                  </h4>
                  <div style={{ marginBottom: '24px' }}>
                    {selectedTemplate.files.map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px',
                          marginBottom: '8px',
                          background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <FileCode size={18} color="#22c55e" />
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{file.name}</span>
                        <span style={{
                          fontSize: '11px',
                          opacity: 0.6,
                          padding: '2px 6px',
                          background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                          borderRadius: '4px'
                        }}>
                          {file.language}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 依赖列表 */}
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
                    项目依赖
                  </h4>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '24px',
                    flexWrap: 'wrap'
                  }}>
                    {selectedTemplate.dependencies.map(dep => (
                      <span
                        key={dep}
                        style={{
                          padding: '8px 14px',
                          background: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)',
                          borderRadius: '8px',
                          fontSize: '13px',
                          color: '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Blocks size={14} />
                        {dep}
                      </span>
                    ))}
                  </div>

                  {/* 操作按钮 */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => {
                        const allCode = selectedTemplate.files.map(f => `// ${f.name}\n${f.content}`).join('\n\n')
                        copyCode(allCode)
                      }}
                      style={{
                        padding: '12px 20px',
                        background: 'rgba(34,197,94,0.1)',
                        color: '#22c55e',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Copy size={18} />
                      复制全部
                    </button>
                    <button
                      onClick={() => addNotification({ title: '模板下载', message: '请手动复制代码创建项目', type: 'info', duration: 2000 })}
                      style={{
                        padding: '12px 20px',
                        background: accentGradient,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
                      }}
                    >
                      <Download size={18} />
                      下载模板
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  opacity: 0.6
                }}>
                  <FolderOpen size={64} style={{ marginBottom: '16px' }} />
                  <p style={{ margin: 0, fontSize: '16px' }}>选择一个模板查看详情</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* API文档 */}
        {activeTab === 'docs' && (
          <div style={{ display: 'flex', gap: '24px', height: '100%' }}>
            {/* API列表 */}
            <div style={{
              width: '320px',
              background: cardBg,
              borderRadius: '16px',
              padding: '20px',
              border: `1px solid ${borderColor}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              overflow: 'auto'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
                API文档库
              </h3>
              {apiDocs.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedApiDoc(doc)}
                  style={{
                    padding: '16px',
                    marginBottom: '12px',
                    background: selectedApiDoc?.id === doc.id
                      ? 'rgba(34,197,94,0.1)'
                      : isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: `1px solid ${selectedApiDoc?.id === doc.id ? '#22c55e' : 'transparent'}`,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '8px'
                  }}>
                    <Globe size={20} color="#3b82f6" />
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>{doc.name}</span>
                  </div>
                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '13px',
                    opacity: 0.7,
                    lineHeight: 1.5
                  }}>
                    {doc.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      padding: '4px 8px',
                      background: 'rgba(59,130,246,0.2)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#3b82f6'
                    }}>
                      {doc.category}
                    </span>
                    <span style={{ fontSize: '12px', opacity: 0.6 }}>
                      {doc.endpoints.length} 端点
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* API详情 */}
            <div style={{
              flex: 1,
              background: cardBg,
              borderRadius: '16px',
              padding: '24px',
              border: `1px solid ${borderColor}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              overflow: 'auto'
            }}>
              {selectedApiDoc ? (
                <div>
                  {/* API头部 */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600 }}>
                      {selectedApiDoc.name}
                    </h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', opacity: 0.7 }}>
                      {selectedApiDoc.description}
                    </p>
                    <div style={{
                      padding: '12px 16px',
                      background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '12px'
                    }}>
                      <Globe size={20} color="#3b82f6" />
                      <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#3b82f6' }}>
                        {selectedApiDoc.baseUrl}
                      </span>
                      <button
                        onClick={() => copyCode(selectedApiDoc.baseUrl)}
                        style={{
                          padding: '4px 8px',
                          background: 'transparent',
                          border: 'none',
                          color: isDark ? '#8b949e' : '#4a5568',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <span style={{
                        padding: '6px 12px',
                        background: 'rgba(34,197,94,0.1)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#22c55e'
                      }}>
                        认证: {selectedApiDoc.authType}
                      </span>
                    </div>
                  </div>

                  {/* 端点列表 */}
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
                    API端点
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {selectedApiDoc.endpoints.map((endpoint, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '16px',
                          background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          borderRadius: '10px',
                          border: `1px solid ${borderColor}`
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '8px'
                        }}>
                          <span style={{
                            padding: '4px 8px',
                            background: endpoint.method === 'GET' ? 'rgba(34,197,94,0.2)'
                              : endpoint.method === 'POST' ? 'rgba(59,130,246,0.2)'
                              : endpoint.method === 'PUT' ? 'rgba(251,191,36,0.2)'
                              : 'rgba(239,68,68,0.2)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: endpoint.method === 'GET' ? '#22c55e'
                              : endpoint.method === 'POST' ? '#3b82f6'
                              : endpoint.method === 'PUT' ? '#fbbf24'
                              : '#ef4444'
                          }}>
                            {endpoint.method}
                          </span>
                          <span style={{
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            color: '#22c55e'
                          }}>
                            {endpoint.path}
                          </span>
                        </div>
                        <p style={{
                          margin: '0 0 8px 0',
                          fontSize: '13px',
                          opacity: 0.7
                        }}>
                          {endpoint.description}
                        </p>
                        {endpoint.params && (
                          <div style={{
                            display: 'flex',
                            gap: '6px',
                            flexWrap: 'wrap'
                          }}>
                            {endpoint.params.map(param => (
                              <span
                                key={param}
                                style={{
                                  padding: '4px 8px',
                                  background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  opacity: 0.7
                                }}
                              >
                                {param}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 操作按钮 */}
                  <div style={{ marginTop: '24px' }}>
                    <button
                      onClick={() => addNotification({ title: 'API测试', message: '可在REST Client应用中测试此API', type: 'info', duration: 2000 })}
                      style={{
                        padding: '12px 20px',
                        background: accentGradient,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
                      }}
                    >
                      <ExternalLink size={18} />
                      在REST Client中测试
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  opacity: 0.6
                }}>
                  <BookOpen size={64} style={{ marginBottom: '16px' }} />
                  <p style={{ margin: 0, fontSize: '16px' }}>选择一个API文档查看详情</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 工具链配置 */}
        {activeTab === 'tools' && (
          <div style={{ display: 'flex', gap: '24px', height: '100%' }}>
            {/* 工具链列表 */}
            <div style={{
              width: '320px',
              background: cardBg,
              borderRadius: '16px',
              padding: '20px',
              border: `1px solid ${borderColor}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              overflow: 'auto'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
                工具链方案
              </h3>
              {toolchainConfigs.map(tc => (
                <div
                  key={tc.id}
                  onClick={() => setSelectedToolchain(tc)}
                  style={{
                    padding: '16px',
                    marginBottom: '12px',
                    background: selectedToolchain?.id === tc.id
                      ? 'rgba(34,197,94,0.1)'
                      : isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: `1px solid ${selectedToolchain?.id === tc.id ? '#22c55e' : 'transparent'}`,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '8px'
                  }}>
                    <Settings size={20} color="#22c55e" />
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>{tc.name}</span>
                  </div>
                  <p style={{
                    margin: '0 0 12px 0',
                    fontSize: '13px',
                    opacity: 0.7,
                    lineHeight: 1.5
                  }}>
                    {tc.description}
                  </p>
                  <span style={{ fontSize: '12px', opacity: 0.6 }}>
                    {tc.tools.length} 工具
                  </span>
                </div>
              ))}
            </div>

            {/* 工具链详情 */}
            <div style={{
              flex: 1,
              background: cardBg,
              borderRadius: '16px',
              padding: '24px',
              border: `1px solid ${borderColor}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              overflow: 'auto'
            }}>
              {selectedToolchain ? (
                <div>
                  {/* 工具链头部 */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600 }}>
                      {selectedToolchain.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>
                      {selectedToolchain.description}
                    </p>
                  </div>

                  {/* 工具网格 */}
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
                    工具组成
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    {selectedToolchain.tools.map(tool => (
                      <div
                        key={tool.name}
                        style={{
                          padding: '20px',
                          background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                          borderRadius: '12px',
                          border: `1px solid ${borderColor}`,
                          textAlign: 'center'
                        }}
                      >
                        <Cpu size={32} color="#22c55e" style={{ marginBottom: '12px' }} />
                        <h5 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
                          {tool.name}
                        </h5>
                        {tool.version && (
                          <span style={{
                            padding: '4px 10px',
                            background: 'rgba(34,197,94,0.1)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#22c55e',
                            marginBottom: '8px',
                            display: 'inline-block'
                          }}>
                            {tool.version}
                          </span>
                        )}
                        <p style={{
                          margin: '8px 0 0 0',
                          fontSize: '13px',
                          opacity: 0.7
                        }}>
                          {tool.category}
                        </p>
                        {tool.config && (
                          <p style={{
                            margin: '4px 0 0 0',
                            fontSize: '11px',
                            opacity: 0.5,
                            fontFamily: 'monospace'
                          }}>
                            {tool.config}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 操作按钮 */}
                  <div style={{ marginTop: '24px' }}>
                    <button
                      onClick={() => copyCode(selectedToolchain.tools.map(t => `${t.name}: ${t.version}`).join('\n'))}
                      style={{
                        padding: '12px 20px',
                        background: accentGradient,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
                      }}
                    >
                      <Copy size={18} />
                      复制工具列表
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  opacity: 0.6
                }}>
                  <Settings size={64} style={{ marginBottom: '16px' }} />
                  <p style={{ margin: 0, fontSize: '16px' }}>选择一个工具链方案查看详情</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 代码运行 */}
        {activeTab === 'run' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{
              background: cardBg,
              borderRadius: '16px',
              padding: '24px',
              border: `1px solid ${borderColor}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
            }}>
              {/* 语言选择 */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px'
              }}>
                {[
                  { lang: 'javascript', name: 'JavaScript', icon: '🟨' },
                  { lang: 'typescript', name: 'TypeScript', icon: '📘' }
                ].map(lang => (
                  <button
                    key={lang.lang}
                    onClick={() => setRunLanguage(lang.lang as typeof runLanguage)}
                    style={{
                      padding: '10px 18px',
                      background: runLanguage === lang.lang ? accentGradient : cardBg,
                      color: runLanguage === lang.lang ? '#fff' : isDark ? '#8b949e' : '#4a5568',
                      border: `1px solid ${runLanguage === lang.lang ? 'transparent' : borderColor}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{lang.icon}</span>
                    {lang.name}
                  </button>
                ))}
              </div>

              {/* 代码输入 */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, opacity: 0.8 }}>
                    代码编辑器
                  </span>
                  <button
                    onClick={() => setRunCode('')}
                    style={{
                      padding: '4px 8px',
                      background: 'transparent',
                      border: 'none',
                      color: isDark ? '#8b949e' : '#4a5568',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    <RefreshCw size={14} />
                    清空
                  </button>
                </div>
                <textarea
                  value={runCode}
                  onChange={e => setRunCode(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '300px',
                    padding: '20px',
                    background: isDark ? '#0d1117' : '#f6f8fa',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '12px',
                    color: isDark ? '#c9d1d9' : '#24292e',
                    fontFamily: 'JetBrains Mono, Consolas, monospace',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* 运行按钮 */}
              <button
                onClick={executeCode}
                disabled={!runCode.trim()}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: runCode.trim() ? accentGradient : isDark ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.2)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: runCode.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '16px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: runCode.trim() ? '0 4px 16px rgba(34,197,94,0.4)' : 'none',
                  marginBottom: '20px'
                }}
              >
                <Play size={20} />
                运行代码
              </button>

              {/* 输出区域 */}
              {runOutput && (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <Terminal size={18} color="#22c55e" />
                    <span style={{ fontSize: '14px', fontWeight: 600, opacity: 0.8 }}>
                      输出结果
                    </span>
                    <button
                      onClick={() => copyCode(runOutput)}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: 'none',
                        color: isDark ? '#8b949e' : '#4a5568',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <div style={{
                    padding: '20px',
                    background: isDark ? '#0d1117' : '#f6f8fa',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '12px',
                    fontFamily: 'JetBrains Mono, Consolas, monospace',
                    fontSize: '14px',
                    color: isDark ? '#7ee787' : '#22863a',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}>
                    {runOutput}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}