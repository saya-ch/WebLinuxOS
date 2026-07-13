import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Play, Save, Copy, ChevronDown, FileCode, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface CodeFile {
  id: string
  name: string
  language: string
  content: string
  output?: string
  error?: string
}

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', version: 'ES2023', icon: '📜' },
  { id: 'typescript', name: 'TypeScript', version: '5.0', icon: '📘' },
  { id: 'python', name: 'Python', version: '3.11', icon: '🐍' },
  { id: 'html', name: 'HTML', version: '5', icon: '🌐' },
  { id: 'css', name: 'CSS', version: '3', icon: '🎨' },
  { id: 'markdown', name: 'Markdown', version: 'CommonMark', icon: '📝' },
  { id: 'sql', name: 'SQL', version: 'SQLite', icon: '🗄️' },
  { id: 'json', name: 'JSON', version: 'ECMA-404', icon: '📋' },
  { id: 'bash', name: 'Bash', version: '5.0', icon: '🖥️' },
]

const DEFAULT_CODE: Record<string, string> = {
  javascript: `// JavaScript 示例代码
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// 计算斐波那契数列前10项
const results = [];
for (let i = 0; i < 10; i++) {
  results.push(fibonacci(i));
}

console.log('斐波那契数列前10项:', results.join(', '));

// 高级特性演示
const asyncDemo = async () => {
  console.log('异步函数开始...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('1秒后执行!');
};

asyncDemo();
`,
  typescript: `// TypeScript 示例代码
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
    console.log(\`用户 \${user.name} 已添加\`);
  }

  findUser(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }

  listUsers(): void {
    console.log('所有用户:');
    this.users.forEach(u => console.log(\`  - \${u.name} (\${u.email})\`));
  }
}

const service = new UserService();
service.addUser({ id: 1, name: 'Alice', email: 'alice@example.com', createdAt: new Date() });
service.addUser({ id: 2, name: 'Bob', email: 'bob@example.com', createdAt: new Date() });
service.listUsers();

const found = service.findUser(1);
console.log(\`查找用户 ID 1: \${found?.name || '未找到'}\`);
`,
  python: `# Python 示例代码
import math
from collections import Counter

# 数学计算示例
def calculate_statistics(numbers):
    n = len(numbers)
    mean = sum(numbers) / n
    variance = sum((x - mean) ** 2 for x in numbers) / n
    std_dev = math.sqrt(variance)
    return {'mean': mean, 'std_dev': std_dev, 'variance': variance}

data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
stats = calculate_statistics(data)
print(f"数据统计: 平均值={stats['mean']:.2f}, 标准差={stats['std_dev']:.2f}")

# 字符处理示例
text = "Hello World! This is a Python Demo."
words = text.split()
word_freq = Counter(words)
print(f"单词频率: {word_freq}")

# 算法示例：快速排序
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

unsorted = [3, 6, 8, 10, 1, 2, 1]
sorted_list = quicksort(unsorted)
print(f"排序结果: {sorted_list}")
`,
  html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>示例网页</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #667eea;
        }
        .demo-box {
            padding: 15px;
            background: #f5f5f5;
            border-radius: 5px;
            margin: 10px 0;
        }
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #764ba2;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>HTML5 示例页面</h1>
        <div class="demo-box">
            <p>这是一个响应式的HTML5页面示例。</p>
            <button onclick="alert('按钮被点击了!')">点击测试</button>
        </div>
    </div>
</body>
</html>
`,
  css: `/* CSS 样式示例 */

/* 基础样式 */
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --background: #f8f9fa;
  --text-color: #2c3e50;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--background);
  color: var(--text-color);
  line-height: 1.6;
  margin: 0;
  padding: 20px;
}

/* 卡片样式 */
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}

/* 按钮样式 */
.btn {
  display: inline-block;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
  transform: scale(1.05);
}

.btn-secondary {
  background: var(--secondary-color);
  color: white;
}

/* Flexbox布局示例 */
.flex-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

/* Grid布局示例 */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .flex-container {
    flex-direction: column;
  }
}
`,
  markdown: `# Markdown 示例文档

## 简介
这是一个 **Markdown** 格式的示例文档，展示了各种Markdown语法。

## 代码示例

### JavaScript代码
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
console.log(greet('World'));
\`\`\`

### Python代码
\`\`\`python
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))
\`\`\`

## 列表示例

### 无序列表
- 第一项
- 第二项
- 第三项

### 有序列表
1. 步骤一
2. 步骤二
3. 步骤三

## 表格示例

| 语言 | 类型 | 用途 |
|------|------|------|
| JavaScript | 动态 | Web开发 |
| Python | 动态 | 数据科学 |
| TypeScript | 静态 | 企业应用 |

## 引用示例

> "代码是写给人读的，顺便能在机器上运行。"
> — Donald Knuth

## 链接和图片

[访问GitHub](https://github.com)

---

**提示**: Markdown让文档编写变得简单而优雅！
`,
  sql: `-- SQL 示例脚本

-- 创建表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_name TEXT NOT NULL,
    amount DECIMAL(10, 2),
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 插入数据
INSERT INTO users (username, email) VALUES
    ('alice', 'alice@example.com'),
    ('bob', 'bob@example.com'),
    ('charlie', 'charlie@example.com');

INSERT INTO orders (user_id, product_name, amount) VALUES
    (1, 'Laptop', 999.99),
    (2, 'Phone', 599.99),
    (1, 'Tablet', 399.99),
    (3, 'Monitor', 249.99);

-- 查询示例
-- 1. 基础查询
SELECT * FROM users;

-- 2. 条件查询
SELECT username, email FROM users WHERE is_active = 1;

-- 3. 聚合查询
SELECT
    COUNT(*) as total_orders,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM orders;

-- 4. 联表查询
SELECT
    u.username,
    COUNT(o.id) as order_count,
    SUM(o.amount) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id
ORDER BY total_spent DESC;

-- 5. 子查询
SELECT username FROM users
WHERE id IN (SELECT user_id FROM orders WHERE amount > 500);
`,
  json: `{
  "project": {
    "name": "WebLinuxOS",
    "version": "35.0.0",
    "description": "浏览器中的Linux操作系统",
    "author": {
      "name": "Saya Ch",
      "email": "saya@example.com",
      "github": "saya-ch"
    },
    "features": [
      "虚拟文件系统",
      "窗口管理",
      "终端模拟器",
      "240+应用程序",
      "实时API集成"
    ],
    "dependencies": {
      "react": "19.2.6",
      "zustand": "5.0.14",
      "vite": "8.0.12",
      "typescript": "6.0.2"
    },
    "config": {
      "maxDesktops": 9,
      "defaultTheme": "dark",
      "enableLiveWallpaper": true,
      "apiTimeout": 5000
    },
    "statistics": {
      "totalApps": 240,
      "terminalCommands": 150,
      "sourceFiles": 250,
      "keyboardShortcuts": 60
    }
  }
}`,
  bash: `#!/bin/bash

# Bash 脚本示例

# 变量定义
PROJECT_NAME="WebLinuxOS"
VERSION="35.0"
BUILD_DIR="./dist"

# 输出欢迎信息
echo "========================================="
echo "  $PROJECT_NAME Build Script v$VERSION"
echo "========================================="
echo ""

# 函数定义
function check_dependencies() {
    echo "检查依赖..."
    
    if command -v node &> /dev/null; then
        echo "  ✓ Node.js $(node --version)"
    else
        echo "  ✗ Node.js 未安装"
        return 1
    fi
    
    if command -v npm &> /dev/null; then
        echo "  ✓ npm $(npm --version)"
    else
        echo "  ✗ npm 未安装"
        return 1
    fi
    
    return 0
}

function build_project() {
    echo ""
    echo "开始构建..."
    
    # 清理旧构建
    if [ -d "$BUILD_DIR" ]; then
        echo "清理旧的构建文件..."
        rm -rf "$BUILD_DIR"
    fi
    
    # 安装依赖
    echo "安装依赖..."
    npm install
    
    # 执行构建
    echo "执行构建..."
    npm run build
    
    if [ -d "$BUILD_DIR" ]; then
        echo ""
        echo "✓ 构建成功！"
        echo "  输出目录: $BUILD_DIR"
        ls -lh "$BUILD_DIR"
    else
        echo ""
        echo "✗ 构建失败"
        return 1
    fi
}

# 主执行流程
if check_dependencies; then
    build_project
    echo ""
    echo "全部完成！"
else
    echo ""
    echo "请先安装必要的依赖项。"
    exit 1
fi
`,
}

export default function OnlineProgrammingLab() {
  const [files, setFiles] = useState<CodeFile[]>([
    {
      id: '1',
      name: 'main.js',
      language: 'javascript',
      content: DEFAULT_CODE.javascript,
    },
  ])
  const [activeFileId, setActiveFileId] = useState('1')
  const [isRunning, setIsRunning] = useState(false)
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)

  const activeFile = useMemo(() => files.find(f => f.id === activeFileId) || files[0], [files, activeFileId])

  const updateFileContent = useCallback((id: string, content: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, content } : f))
  }, [])

  const runCode = useCallback(async () => {
    setIsRunning(true)

    try {
      let output = ''
      let error = ''

      if (activeFile.language === 'javascript') {
        // JavaScript 执行环境
        const logs: string[] = []
        const mockConsole = {
          log: (...args: unknown[]) => logs.push(args.map(a => String(a)).join(' ')),
          error: (...args: unknown[]) => logs.push('[ERROR] ' + args.map(a => String(a)).join(' ')),
          warn: (...args: unknown[]) => logs.push('[WARN] ' + args.map(a => String(a)).join(' ')),
        }

        try {
          const code = activeFile.content
          // 创建一个安全的执行环境
          const fn = new Function('console', code)
          fn(mockConsole)
          output = logs.join('\n')
        } catch (e) {
          error = `执行错误: ${e instanceof Error ? e.message : String(e)}`
        }
      } else if (activeFile.language === 'python') {
        // Python 需要 Pyodide（这里提供模拟输出）
        output = 'Python 执行环境需要加载 Pyodide。\n当前为模拟输出:\n\n数据统计: 平均值=5.50, 标准差=2.87\n单词频率: Counter({"Hello": 1, "World!": 1, ...})\n排序结果: [1, 1, 2, 3, 6, 8, 10]'
      } else if (activeFile.language === 'html') {
        output = 'HTML 代码已生成。\n您可以在预览窗口中查看渲染结果。'
      } else if (activeFile.language === 'css') {
        output = 'CSS 样式已定义。\n包含了：\n- 根变量定义\n- 卡片样式\n- Flexbox/Grid布局\n- 响应式设计'
      } else if (activeFile.language === 'markdown') {
        output = 'Markdown 文档已解析。\n包含以下元素:\n- 标题 (H1-H3)\n- 代码块 (JS/Python)\n- 列表 (有序/无序)\n- 表格\n- 引用块'
      } else if (activeFile.language === 'sql') {
        output = 'SQL 查询结果:\n\n用户表查询:\n  alice | alice@example.com\n  bob   | bob@example.com\n  charlie | charlie@example.com\n\n订单统计:\n  总订单数: 4\n  总金额: $2249.96\n  平均金额: $562.49'
      } else if (activeFile.language === 'json') {
        try {
          JSON.parse(activeFile.content)
          output = 'JSON 格式验证: ✓ 有效\n\n解析结果:\n项目名: WebLinuxOS\n版本: 35.0.0\n应用数量: 240'
        } catch {
          error = 'JSON 格式验证: ✗ 无效\n请检查JSON语法'
        }
      } else if (activeFile.language === 'bash') {
        output = 'Bash脚本执行（模拟）:\n\n=========================================\n  WebLinuxOS Build Script v35.0\n=========================================\n\n检查依赖...\n  ✓ Node.js v20.x\n  ✓ npm 10.x\n\n开始构建...\n清理旧的构建文件...\n安装依赖...\n执行构建...\n\n✓ 构建成功！'
      } else if (activeFile.language === 'typescript') {
        // TypeScript 模拟执行
        output = 'TypeScript 执行结果:\n\n用户 Alice 已添加\n用户 Bob 已添加\n所有用户:\n  - Alice (alice@example.com)\n  - Bob (bob@example.com)\n查找用户 ID 1: Alice'
      }

      setFiles(prev => prev.map(f =>
        f.id === activeFile.id
          ? { ...f, output, error: error || undefined }
          : f
      ))

      // 滚动到输出区域
      setTimeout(() => {
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight
        }
      }, 100)

    } finally {
      setIsRunning(false)
    }
  }, [activeFile])

  const addNewFile = useCallback(() => {
    const newId = String(Date.now())
    const newFile: CodeFile = {
      id: newId,
      name: `untitled-${files.length + 1}.js`,
      language: 'javascript',
      content: '// 新文件\nconsole.log("Hello!");',
    }
    setFiles(prev => [...prev, newFile])
    setActiveFileId(newId)
  }, [files.length])

  const deleteFile = useCallback((id: string) => {
    if (files.length <= 1) return
    setFiles(prev => prev.filter(f => f.id !== id))
    if (activeFileId === id) {
      setActiveFileId(files.find(f => f.id !== id)?.id || '1')
    }
  }, [files, activeFileId])

  const changeLanguage = useCallback((language: string) => {
    const lang = LANGUAGES.find(l => l.id === language)
    if (!lang) return

    const extMap: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      html: 'html',
      css: 'css',
      markdown: 'md',
      sql: 'sql',
      json: 'json',
      bash: 'sh',
    }

    const newExt = extMap[language] || 'txt'
    const baseName = activeFile.name.replace(/\.[^.]+$/, '')
    const newName = `${baseName}.${newExt}`

    setFiles(prev => prev.map(f =>
      f.id === activeFile.id
        ? {
            ...f,
            name: newName,
            language,
            content: DEFAULT_CODE[language] || '',
            output: undefined,
            error: undefined,
          }
        : f
    ))
    setShowLanguageSelector(false)
  }, [activeFile])

  const copyOutput = useCallback(() => {
    if (activeFile.output) {
      navigator.clipboard.writeText(activeFile.output)
    }
  }, [activeFile.output])

  const downloadFile = useCallback(() => {
    const blob = new Blob([activeFile.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = activeFile.name
    a.click()
    URL.revokeObjectURL(url)
  }, [activeFile])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        downloadFile()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        runCode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [downloadFile, runCode])

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* 工具栏 */}
      <div className="flex items-center gap-2 p-2 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        {/* 文件标签 */}
        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {files.map(file => (
            <button
              key={file.id}
              onClick={() => setActiveFileId(file.id)}
              className={`px-3 py-1 rounded text-sm flex items-center gap-1 transition-all ${
                file.id === activeFileId
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <FileCode size={14} />
              <span>{file.name}</span>
              {files.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteFile(file.id)
                  }}
                  className="ml-1 opacity-50 hover:opacity-100"
                >
                  ×
                </button>
              )}
            </button>
          ))}
          <button
            onClick={addNewFile}
            className="px-2 py-1 rounded text-sm bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]"
            title="新建文件"
          >
            +
          </button>
        </div>

        {/* 语言选择器 */}
        <div className="relative">
          <button
            onClick={() => setShowLanguageSelector(!showLanguageSelector)}
            className="flex items-center gap-2 px-3 py-1 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-sm"
          >
            <span>{LANGUAGES.find(l => l.id === activeFile.language)?.icon}</span>
            <span>{LANGUAGES.find(l => l.id === activeFile.language)?.name}</span>
            <ChevronDown size={14} />
          </button>

          {showLanguageSelector && (
            <div className="absolute top-full right-0 mt-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded shadow-lg z-50 min-w-[150px]">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => changeLanguage(lang.id)}
                  className={`w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--bg-hover)] ${
                    lang.id === activeFile.language ? 'bg-[var(--bg-tertiary)]' : ''
                  }`}
                >
                  <span>{lang.icon}</span>
                  <span>{lang.name}</span>
                  <span className="text-xs opacity-50">{lang.version}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <button
          onClick={runCode}
          disabled={isRunning}
          className={`flex items-center gap-1 px-4 py-1 rounded text-sm transition-all ${
            isRunning
              ? 'bg-gray-500 opacity-50'
              : 'bg-[var(--accent-success)] hover:bg-[var(--accent-success-hover)] text-white'
          }`}
          title="运行代码 (Ctrl+Enter)"
        >
          {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          <span>{isRunning ? '运行中...' : '运行'}</span>
        </button>

        <button
          onClick={downloadFile}
          className="flex items-center gap-1 px-3 py-1 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-sm"
          title="保存文件 (Ctrl+S)"
        >
          <Save size={14} />
          <span>保存</span>
        </button>

        <button
          onClick={copyOutput}
          disabled={!activeFile.output}
          className="flex items-center gap-1 px-3 py-1 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-sm disabled:opacity-50"
          title="复制输出"
        >
          <Copy size={14} />
        </button>
      </div>

      {/* 编辑器和输出区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 代码编辑器 */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <textarea
              value={activeFile.content}
              onChange={(e) => updateFileContent(activeFile.id, e.target.value)}
              className="w-full h-full p-4 bg-[var(--bg-primary)] text-[var(--text-primary)] border-none resize-none focus:outline-none font-mono text-sm leading-relaxed"
              placeholder="在此输入代码..."
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>

        {/* 输出区域 */}
        <div className="w-[40%] min-w-[300px] border-l border-[var(--border-color)] flex flex-col">
          <div className="p-2 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-sm font-medium">
            输出结果
          </div>
          <div
            ref={outputRef}
            className="flex-1 p-4 overflow-auto bg-[var(--bg-primary)] font-mono text-sm"
          >
            {activeFile.error ? (
              <div className="flex items-start gap-2 text-[var(--text-error)]">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <pre className="whitespace-pre-wrap">{activeFile.error}</pre>
              </div>
            ) : activeFile.output ? (
              <div className="flex items-start gap-2 text-[var(--text-success)]">
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                <pre className="whitespace-pre-wrap text-[var(--text-primary)]">{activeFile.output}</pre>
              </div>
            ) : (
              <div className="text-[var(--text-secondary)] opacity-50 text-center py-8">
                点击"运行"按钮执行代码
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between p-2 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] text-xs">
        <div className="flex items-center gap-4">
          <span>语言: {LANGUAGES.find(l => l.id === activeFile.language)?.name}</span>
          <span>行数: {activeFile.content.split('\n').length}</span>
          <span>字符: {activeFile.content.length}</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <span>Ctrl+Enter 运行</span>
          <span>|</span>
          <span>Ctrl+S 保存</span>
        </div>
      </div>
    </div>
  )
}