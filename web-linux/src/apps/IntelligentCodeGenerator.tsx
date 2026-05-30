import { useState, useRef } from 'react'
import { useStore } from '../store'

const LANGUAGES = [
  { name: 'JavaScript', value: 'javascript', icon: 'JS' },
  { name: 'TypeScript', value: 'typescript', icon: 'TS' },
  { name: 'Python', value: 'python', icon: 'PY' },
  { name: 'HTML/CSS', value: 'html', icon: 'HTML' },
  { name: 'React', value: 'react', icon: '⚛️' },
  { name: 'Node.js', value: 'nodejs', icon: '🟢' },
  { name: 'SQL', value: 'sql', icon: '📊' },
  { name: 'Shell', value: 'bash', icon: '💻' }
]

const TEMPLATES = {
  react: [
    { name: '函数组件', desc: 'React 19 函数式组件', code: `import { useState, useEffect } from 'react'

export function ComponentName() {
  const [state, setState] = useState('')

  useEffect(() => {
    // 初始化逻辑
  }, [])

  return (
    <div className="component">
      <h1>ComponentName</h1>
      <p>{state}</p>
    </div>
  )
}` },
    { name: '计数器', desc: '带加减功能的计数器', code: `import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>计数器</h2>
      <div style={{ fontSize: '48px', margin: '20px' }}>{count}</div>
      <button onClick={() => setCount(c => c + 1)} style={{ padding: '10px 20px', margin: '5px' }}>
        +
      </button>
      <button onClick={() => setCount(c => c - 1)} style={{ padding: '10px 20px', margin: '5px' }}>
        -
      </button>
    </div>
  )
}` },
    { name: 'Todo 列表', desc: '完整的待办事项管理', code: `import { useState } from 'react'

interface Todo {
  id: number
  text: string
  completed: boolean
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, completed: false }])
      setInput('')
    }
  }

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id))
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Todo List</h2>
      <div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="添加新任务..."
          style={{ padding: '8px', marginRight: '8px' }}
        />
        <button onClick={addTodo}>添加</button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos.map(todo => (
          <li key={todo.id} style={{ padding: '8px', margin: '4px 0', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none', flex: 1 }}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)} style={{ marginLeft: '8px' }}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  )
}` }
  ],
  javascript: [
    { name: 'API 调用', desc: 'fetch API 调用示例', code: `async function fetchData(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    })

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`)
    }

    return await response.json()
  } catch (error) {
    console.error('Fetch error:', error)
    throw error
  }
}

// 使用示例
async function main() {
  const data = await fetchData('https://api.example.com/data')
  console.log('Data:', data)
}` },
    { name: '防抖函数', desc: 'Debounce 实现', code: `function debounce(func, wait = 300) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 使用示例
const handleSearch = debounce((query) => {
  console.log('Searching:', query)
}, 500)` },
    { name: '节流函数', desc: 'Throttle 实现', code: `function throttle(func, limit = 100) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 使用示例
const handleScroll = throttle(() => {
  console.log('Scrolling...')
}, 200)` }
  ],
  python: [
    { name: '快速排序', desc: 'Quicksort 算法', code: `def quicksort(arr):
    if len(arr) <= 1:
        return arr

    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]

    return quicksort(left) + middle + quicksort(right)

# 使用示例
numbers = [3, 6, 8, 10, 1, 2, 1]
sorted_numbers = quicksort(numbers)
print(sorted_numbers)` },
    { name: '数据类', desc: '使用 dataclasses', code: `from dataclasses import dataclass
from typing import Optional

@dataclass
class Person:
    name: str
    age: int
    email: Optional[str] = None

    def greet(self) -> str:
        return f"Hello, my name is {self.name}"

# 使用示例
alice = Person(name="Alice", age=30, email="alice@example.com")
print(alice.greet())
print(alice)` },
    { name: '上下文管理器', desc: '自定义 Context Manager', code: `from contextlib import contextmanager
import time

@contextmanager
def timer():
    start = time.perf_counter()
    yield
    end = time.perf_counter()
    print(f"Elapsed: {end - start:.4f}s")

# 使用示例
with timer():
    # 执行一些操作
    total = sum(range(1, 1_000_000))
    print(f"Total: {total}")` }
  ],
  html: [
    { name: '响应式布局', desc: 'Flexbox 布局', code: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>响应式布局</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .card {
            flex: 1 1 300px;
            background: #f0f0f0;
            padding: 20px;
            border-radius: 8px;
        }
        @media (max-width: 600px) {
            .container { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card"><h3>卡片 1</h3><p>内容...</p></div>
        <div class="card"><h3>卡片 2</h3><p>内容...</p></div>
        <div class="card"><h3>卡片 3</h3><p>内容...</p></div>
    </div>
</body>
</html>` },
    { name: '表单验证', desc: 'HTML5 表单', code: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>表单验证</title>
    <style>
        .form-group { margin: 15px 0; }
        input:invalid { border-color: red; }
        input:valid { border-color: green; }
        .error { color: red; font-size: 0.8em; }
    </style>
</head>
<body>
    <form id="registerForm" style="max-width: 400px; margin: 20px auto;">
        <h2>注册</h2>
        <div class="form-group">
            <label>姓名：</label>
            <input type="text" required minlength="2" style="width: 100%; padding: 8px;">
        </div>
        <div class="form-group">
            <label>邮箱：</label>
            <input type="email" required style="width: 100%; padding: 8px;">
        </div>
        <div class="form-group">
            <label>密码：</label>
            <input type="password" required minlength="8" style="width: 100%; padding: 8px;">
        </div>
        <button type="submit" style="padding: 10px 20px;">提交</button>
    </form>
    <script>
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault()
            alert('表单提交成功！')
        })
    </script>
</body>
</html>` }
  ],
  sql: [
    { name: '创建表', desc: '基础表结构', code: `CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 查询示例
SELECT u.username, p.title, p.created_at
FROM users u
JOIN posts p ON u.id = p.user_id
ORDER BY p.created_at DESC
LIMIT 10;` },
    { name: '聚合查询', desc: '统计功能', code: `-- 统计各分类的文章数量
SELECT
    category,
    COUNT(*) AS post_count,
    AVG(views) AS avg_views,
    MAX(created_at) AS latest_post
FROM posts
WHERE status = 'published'
GROUP BY category
HAVING COUNT(*) > 5
ORDER BY post_count DESC;` }
  ],
  bash: [
    { name: '备份脚本', desc: '文件自动备份', code: `#!/bin/bash

# 配置
BACKUP_DIR="$HOME/backups"
SOURCE_DIR="$HOME/documents"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$DATE.tar.gz"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 执行备份
echo "开始备份 $SOURCE_DIR ..."
tar -czf "$BACKUP_DIR/$BACKUP_FILE" -C "$(dirname "$SOURCE_DIR")" "$(basename "$SOURCE_DIR")"

# 保留最近 7 天的备份
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete

echo "备份完成：$BACKUP_FILE"
echo "备份大小：$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)"` },
    { name: '系统信息', desc: '获取系统状态', code: `#!/bin/bash

echo "=== 系统信息 ==="
echo "主机名: $(hostname)"
echo "操作系统: $(uname -s)"
echo "内核版本: $(uname -r)"
echo ""

echo "=== CPU 信息 ==="
echo "CPU 核心数: $(nproc)"
echo ""

echo "=== 内存使用 ==="
free -h
echo ""

echo "=== 磁盘使用 ==="
df -h
echo ""

echo "=== 网络信息 ==="
ip -br addr show
echo ""

echo "=== 运行时间 ==="
uptime` }
  ],
  typescript: [
    { name: '类型安全 API', desc: 'TypeScript API 封装', code: `interface ApiResponse<T> {
  data: T
  error?: string
  status: number
}

interface User {
  id: number
  name: string
  email: string
}

async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options
    })

    const data = await response.json()

    return {
      data,
      status: response.status,
      error: response.ok ? undefined : 'Request failed'
    }
  } catch (error) {
    return {
      data: null as unknown as T,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500
    }
  }
}

// 使用
async function getUsers() {
  const result = await apiRequest<User[]>('/api/users')
  if (result.error) {
    console.error(result.error)
  } else {
    console.log(result.data)
  }
}` },
    { name: '泛型工具', desc: '常用 TypeScript 工具', code: `// 类型工具
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

type Maybe<T> = T | null | undefined

type PromiseResult<T> = T extends Promise<infer U> ? U : T

// 使用示例
interface Config {
  database: {
    host: string
    port: number
  }
  api: {
    url: string
    timeout: number
  }
}

function updateConfig(partial: DeepPartial<Config>) {
  // 更新配置
}

updateConfig({
  database: { host: 'localhost' }
})` }
  ],
  nodejs: [
    { name: 'Express 服务器', desc: '基础 Express API', code: `import express from 'express'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

// 中间件
app.use((req, res, next) => {
  console.log(\`\${req.method} \${req.path}\`)
  next()
})

// 路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ])
})

app.post('/api/users', (req, res) => {
  const user = req.body
  res.status(201).json({ id: Date.now(), ...user })
})

app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`)
})` },
    { name: '文件工具', desc: '文件操作', code: `import fs from 'fs/promises'
import path from 'path'

async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

async function listFiles(dir: string, extension?: string): Promise<string[]> {
  const files = await fs.readdir(dir, { withFileTypes: true })
  return files
    .filter(f => f.isFile() && (!extension || f.name.endsWith(extension)))
    .map(f => f.name)
}

export { readJsonFile, writeJsonFile, listFiles }` }
  ]
}

const CODE_SNIPPETS = {
  javascript: `function hello() {
  console.log('Hello, World!')
}

hello()`,
  react: `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <h1>Hello React!</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  )
}

export default App`,
  python: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

for i in range(10):
    print(fibonacci(i))`,
  html: `<!DOCTYPE html>
<html>
<head>
    <title>Hello</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>`,
  sql: `SELECT * FROM users WHERE active = true;`,
  bash: `#!/bin/bash
echo "Hello, World!"`,
  typescript: `interface User {
  id: number
  name: string
}

const user: User = { id: 1, name: 'John' }
console.log(user)`,
  nodejs: `console.log('Hello, Node.js!')`
}

export default function IntelligentCodeGenerator() {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')
  const [code, setCode] = useState(CODE_SNIPPETS.javascript)
  const [showTemplates, setShowTemplates] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES['react'][0] | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const addFile = useStore((s) => s.addFile)
  const files = useStore((s) => s.files)

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang)
    setCode(CODE_SNIPPETS[lang as keyof typeof CODE_SNIPPETS] || '')
    setSelectedTemplate(null)
  }

  const useTemplate = (template: any) => {
    setSelectedTemplate(template)
    setCode(template.code)
    setShowTemplates(false)
  }

  const saveFile = () => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      react: 'tsx',
      html: 'html',
      sql: 'sql',
      bash: 'sh',
      nodejs: 'js'
    }

    const ext = extensions[selectedLanguage] || 'txt'
    const fileName = `generated_${Date.now()}.${ext}`
    const rootId = files[0]?.id
    if (rootId) {
      addFile(rootId, fileName, 'file')
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      alert('代码已复制到剪贴板！')
    })
  }

  const formatCode = () => {
    try {
      if (selectedLanguage === 'javascript' || selectedLanguage === 'typescript' || selectedLanguage === 'react' || selectedLanguage === 'nodejs') {
        let formatted = code
        formatted = formatted.replace(/\{/g, ' {\n')
        formatted = formatted.replace(/\}/g, '\n}\n')
        formatted = formatted.replace(/;/g, ';\n')
        formatted = formatted.replace(/\n\s*\n/g, '\n')
        setCode(formatted)
      }
    } catch (e) {
      alert('代码格式化失败')
    }
  }

  const clearCode = () => {
    if (confirm('确定要清空代码吗？')) {
      setCode('')
      setSelectedTemplate(null)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#e0e0e0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #444', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>🧠 智能代码生成器</div>
        <div style={{ flex: 1 }}></div>
        <select
          value={selectedLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          style={{ 
            padding: '8px 12px', 
            borderRadius: '6px', 
            border: '1px solid #555', 
            background: '#2a2a4a',
            color: '#e0e0e0',
            cursor: 'pointer'
          }}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.icon} {lang.name}
            </option>
          ))}
        </select>
        <button 
          onClick={() => setShowTemplates(!showTemplates)}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '6px', 
            border: '1px solid #555', 
            background: '#2a2a4a',
            color: '#e0e0e0',
            cursor: 'pointer'
          }}
        >
          📚 模板
        </button>
        <button 
          onClick={formatCode}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '6px', 
            border: '1px solid #555', 
            background: '#2a2a4a',
            color: '#e0e0e0',
            cursor: 'pointer'
          }}
        >
          ✨ 格式化
        </button>
        <button 
          onClick={copyCode}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '6px', 
            border: '1px solid #555', 
            background: '#2a2a4a',
            color: '#e0e0e0',
            cursor: 'pointer'
          }}
        >
          📋 复制
        </button>
        <button 
          onClick={saveFile}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '6px', 
            border: 'none', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          💾 保存
        </button>
        <button 
          onClick={clearCode}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '6px', 
            border: '1px solid #ff5555', 
            background: 'transparent',
            color: '#ff5555',
            cursor: 'pointer'
          }}
        >
          🗑️
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {showTemplates && (
          <div style={{ 
            width: '280px', 
            borderRight: '1px solid #444', 
            overflowY: 'auto',
            background: 'rgba(0,0,0,0.1)'
          }}>
            <div style={{ padding: '12px', borderBottom: '1px solid #444', fontWeight: 'bold' }}>
              📁 代码模板
            </div>
            {TEMPLATES[selectedLanguage as keyof typeof TEMPLATES]?.map((template, idx) => (
              <div
                key={idx}
                onClick={() => useTemplate(template)}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #444',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  background: selectedTemplate === template ? 'rgba(102, 126, 234, 0.3)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (selectedTemplate !== template) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={(e) => {
                  if (selectedTemplate !== template) e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{template.name}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{template.desc}</div>
              </div>
            )) || (
              <div style={{ padding: '12px', color: '#888' }}>暂无该语言模板</div>
            )}
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedTemplate && (
            <div style={{
              padding: '12px',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
              borderBottom: '1px solid #444'
            }}>
              <div style={{ fontWeight: 'bold' }}>{selectedTemplate.name}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>{selectedTemplate.desc}</div>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: '#1e1e3f',
              color: '#d4d4d4',
              fontFamily: "'Fira Code', 'Consolas', monospace",
              fontSize: '14px',
              lineHeight: '1.5',
              padding: '16px',
              resize: 'none',
              tabSize: 2
            }}
          />
        </div>
      </div>

      <div style={{ 
        padding: '8px 16px', 
        borderTop: '1px solid #444', 
        fontSize: '12px', 
        color: '#888',
        display: 'flex',
        justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <span>行数: {code.split('\n').length} | 字符数: {code.length}</span>
        <span>💡 提示：选择语言 → 选择模板 → 自定义修改 → 保存文件</span>
      </div>
    </div>
  )
}
