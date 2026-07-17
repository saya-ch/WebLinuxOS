import { useState, useMemo, useCallback, useRef } from 'react'

// ============ 类型定义 ============
type LanguageKey = 'javascript' | 'typescript' | 'python' | 'html' | 'css' | 'json' | 'bash' | 'go' | 'rust'
type TabKey = 'editor' | 'diff' | 'templates' | 'markdown'

interface LanguageDef {
  key: LanguageKey
  label: string
  icon: string
  color: string
  ext: string
  keywords: string[]
  singleLineComment: string
  multiLineCommentStart?: string
  multiLineCommentEnd?: string
}

interface TemplateItem {
  id: string
  title: string
  language: LanguageKey
  description: string
  code: string
}

// ============ 语言定义 ============
const LANGUAGES: LanguageDef[] = [
  {
    key: 'javascript', label: 'JavaScript', icon: 'JS', color: '#f7df1e', ext: 'js',
    keywords: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'import', 'export', 'default', 'from', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'null', 'undefined', 'true', 'false', 'yield', 'static', 'super', 'delete', 'void'],
    singleLineComment: '//', multiLineCommentStart: '/*', multiLineCommentEnd: '*/',
  },
  {
    key: 'typescript', label: 'TypeScript', icon: 'TS', color: '#3178c6', ext: 'ts',
    keywords: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'import', 'export', 'default', 'from', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'null', 'undefined', 'true', 'false', 'interface', 'type', 'enum', 'implements', 'public', 'private', 'protected', 'readonly', 'abstract', 'as', 'is', 'keyof', 'never', 'unknown', 'any', 'void', 'static', 'super', 'declare', 'module', 'namespace', 'require'],
    singleLineComment: '//', multiLineCommentStart: '/*', multiLineCommentEnd: '*/',
  },
  {
    key: 'python', label: 'Python', icon: 'Py', color: '#3776ab', ext: 'py',
    keywords: ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'yield', 'lambda', 'pass', 'and', 'or', 'not', 'is', 'in', 'True', 'False', 'None', 'global', 'nonlocal', 'assert', 'del', 'async', 'await', 'print', 'self'],
    singleLineComment: '#',
  },
  {
    key: 'html', label: 'HTML', icon: '<>', color: '#e34f26', ext: 'html',
    keywords: ['html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'tr', 'td', 'th', 'form', 'input', 'button', 'select', 'option', 'textarea', 'script', 'style', 'link', 'meta', 'title', 'header', 'footer', 'nav', 'main', 'section', 'article', 'aside'],
    singleLineComment: '', multiLineCommentStart: '<!--', multiLineCommentEnd: '-->',
  },
  {
    key: 'css', label: 'CSS', icon: '#', color: '#1572b6', ext: 'css',
    keywords: ['color', 'background', 'margin', 'padding', 'border', 'display', 'position', 'width', 'height', 'font', 'text', 'flex', 'grid', 'align', 'justify', 'overflow', 'opacity', 'transform', 'transition', 'animation', 'box', 'outline', 'cursor', 'z-index', 'top', 'left', 'right', 'bottom', 'float', 'clear', 'content', 'visibility', 'min', 'max', 'gap', 'order', 'place', 'none', 'auto', 'inherit', 'initial', 'unset', 'important'],
    singleLineComment: '//', multiLineCommentStart: '/*', multiLineCommentEnd: '*/',
  },
  {
    key: 'json', label: 'JSON', icon: '{}', color: '#292929', ext: 'json',
    keywords: ['true', 'false', 'null'],
    singleLineComment: '',
  },
  {
    key: 'bash', label: 'Bash', icon: '#!', color: '#4eaa25', ext: 'sh',
    keywords: ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'function', 'return', 'in', 'select', 'until', 'echo', 'exit', 'read', 'set', 'unset', 'export', 'source', 'alias', 'local', 'declare', 'typeset', 'readonly', 'true', 'false', 'cd', 'ls', 'grep', 'awk', 'sed', 'find', 'cat', 'mkdir', 'rm', 'cp', 'mv', 'chmod', 'chown', 'sudo', 'apt', 'yum', 'npm', 'git', 'docker'],
    singleLineComment: '#',
  },
  {
    key: 'go', label: 'Go', icon: 'Go', color: '#00add8', ext: 'go',
    keywords: ['func', 'return', 'if', 'else', 'for', 'switch', 'case', 'break', 'continue', 'default', 'var', 'const', 'type', 'struct', 'interface', 'map', 'chan', 'go', 'select', 'range', 'package', 'import', 'defer', 'fallthrough', 'goto', 'nil', 'true', 'false', 'make', 'new', 'append', 'len', 'cap', 'copy', 'delete', 'close', 'panic', 'recover', 'print', 'println'],
    singleLineComment: '//', multiLineCommentStart: '/*', multiLineCommentEnd: '*/',
  },
  {
    key: 'rust', label: 'Rust', icon: 'Rs', color: '#dea584', ext: 'rs',
    keywords: ['fn', 'let', 'mut', 'const', 'if', 'else', 'for', 'while', 'loop', 'match', 'return', 'struct', 'enum', 'impl', 'trait', 'pub', 'use', 'mod', 'crate', 'self', 'super', 'where', 'as', 'in', 'ref', 'move', 'type', 'static', 'async', 'await', 'dyn', 'box', 'unsafe', 'extern', 'true', 'false', 'break', 'continue', 'yield', 'Some', 'None', 'Ok', 'Err', 'Vec', 'String', 'Option', 'Result', 'println', 'format', 'macro_rules'],
    singleLineComment: '//', multiLineCommentStart: '/*', multiLineCommentEnd: '*/',
  },
]

// ============ 代码模板 ============
const TEMPLATES: TemplateItem[] = [
  {
    id: 'js-hello',
    title: 'Hello World',
    language: 'javascript',
    description: '经典的 Hello World 程序',
    code: `// Hello World
console.log('Hello, World!');`,
  },
  {
    id: 'js-api',
    title: 'Fetch API 请求',
    language: 'javascript',
    description: '使用 fetch 进行 GET 和 POST 请求',
    code: `// GET 请求
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('请求失败:', error);
    throw error;
  }
}

// POST 请求
async function postData(url, body) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('请求失败:', error);
    throw error;
  }
}`,
  },
  {
    id: 'js-quicksort',
    title: '快速排序',
    language: 'javascript',
    description: '经典快速排序算法实现',
    code: `// 快速排序
function quickSort(arr) {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);

  return [...quickSort(left), ...middle, ...quickSort(right)];
}

// 使用示例
const data = [64, 34, 25, 12, 22, 11, 90];
console.log('排序前:', data);
console.log('排序后:', quickSort(data));`,
  },
  {
    id: 'js-debounce',
    title: '防抖函数',
    language: 'javascript',
    description: '限制函数触发频率',
    code: `// 防抖函数
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 使用示例
const handleSearch = debounce((keyword) => {
  console.log('搜索:', keyword);
}, 500);`,
  },
  {
    id: 'py-hello',
    title: 'Hello World',
    language: 'python',
    description: 'Python 版 Hello World',
    code: `# Hello World
print("Hello, World!")`,
  },
  {
    id: 'py-api',
    title: 'HTTP 请求',
    language: 'python',
    description: '使用 requests 库发送 HTTP 请求',
    code: `import requests

# GET 请求
def fetch_data(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"请求失败: {e}")
        return None

# POST 请求
def post_data(url, data):
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"请求失败: {e}")
        return None

# 使用示例
result = fetch_data("https://api.example.com/data")
print(result)`,
  },
  {
    id: 'py-bubblesort',
    title: '冒泡排序',
    language: 'python',
    description: 'Python 冒泡排序实现',
    code: `# 冒泡排序
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr

# 使用示例
data = [64, 34, 25, 12, 22, 11, 90]
print("排序前:", data)
print("排序后:", bubble_sort(data))`,
  },
  {
    id: 'ts-interface',
    title: 'TypeScript 接口',
    language: 'typescript',
    description: '常用 TypeScript 接口定义',
    code: `// 用户接口
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
  updatedAt?: Date;
}

// API 响应接口
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// 分页接口
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 使用示例
type UserResponse = ApiResponse<User>;
type UserListResponse = PaginatedResponse<User>;`,
  },
  {
    id: 'html-template',
    title: 'HTML5 模板',
    language: 'html',
    description: '标准 HTML5 页面模板',
    code: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>我的页面</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: sans-serif; }
  </style>
</head>
<body>
  <header>
    <h1>标题</h1>
  </header>
  <main>
    <p>内容区域</p>
  </main>
  <footer>
    <p>页脚</p>
  </footer>
</body>
</html>`,
  },
  {
    id: 'css-flexbox',
    title: 'Flexbox 布局',
    language: 'css',
    description: '常用 Flexbox 布局模式',
    code: `/* 居中布局 */
.center-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

/* 导航栏布局 */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

/* 卡片网格 */
.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.card-grid .card {
  flex: 1 1 300px;
  max-width: calc(33.333% - 11px);
}

/* 侧边栏布局 */
.sidebar-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar-layout .sidebar {
  flex: 0 0 240px;
}

.sidebar-layout .main {
  flex: 1;
}`,
  },
  {
    id: 'bash-script',
    title: 'Bash 脚本模板',
    language: 'bash',
    description: '标准 Bash 脚本模板',
    code: `#!/bin/bash

# 脚本说明
set -euo pipefail

# 变量定义
WORK_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="\${WORK_DIR}/script.log"

# 日志函数
log() {
  local level="$1"
  shift
  local message="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[\${timestamp}] [\${level}] \${message}" | tee -a "\${LOG_FILE}"
}

# 主函数
main() {
  log "INFO" "脚本开始执行"
  # 在这里编写你的逻辑
  log "INFO" "脚本执行完成"
}

main "$@"`,
  },
  {
    id: 'go-server',
    title: 'Go HTTP 服务器',
    language: 'go',
    description: '简单的 Go HTTP 服务器',
    code: `package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
)

type Response struct {
    Code    int         \`json:"code"\`
    Message string      \`json:"message"\`
    Data    interface{} \`json:"data"\`
}

func handler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    resp := Response{
        Code:    200,
        Message: "success",
        Data:    map[string]string{"status": "ok"},
    }
    json.NewEncoder(w).Encode(resp)
}

func main() {
    http.HandleFunc("/api", handler)
    fmt.Println("服务启动在 http://localhost:8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}`,
  },
  {
    id: 'rust-hello',
    title: 'Rust Hello World',
    language: 'rust',
    description: 'Rust 基础程序',
    code: `use std::collections::HashMap;

fn main() {
    println!("Hello, World!");

    // HashMap 示例
    let mut scores: HashMap<String, i32> = HashMap::new();
    scores.insert(String::from("Alice"), 10);
    scores.insert(String::from("Bob"), 20);

    for (name, score) in &scores {
        println!("{}: {}", name, score);
    }

    // Option 示例
    let some_value: Option<i32> = Some(42);
    match some_value {
        Some(v) => println!("值为: {}", v),
        None => println!("无值"),
    }
}`,
  },
]

// ============ 语法高亮 ============
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface Token {
  type: 'keyword' | 'string' | 'comment' | 'number' | 'plain'
  value: string
}

function tokenize(code: string, lang: LanguageDef): Token[] {
  const tokens: Token[] = []
  let i = 0
  const len = code.length

  while (i < len) {
    // 多行注释
    if (lang.multiLineCommentStart && lang.multiLineCommentEnd) {
      if (code.startsWith(lang.multiLineCommentStart, i)) {
        const endIdx = code.indexOf(lang.multiLineCommentEnd, i + lang.multiLineCommentStart.length)
        const end = endIdx === -1 ? len : endIdx + lang.multiLineCommentEnd.length
        tokens.push({ type: 'comment', value: code.slice(i, end) })
        i = end
        continue
      }
    }

    // 单行注释
    if (lang.singleLineComment && code.startsWith(lang.singleLineComment, i)) {
      const endIdx = code.indexOf('\n', i)
      const end = endIdx === -1 ? len : endIdx
      tokens.push({ type: 'comment', value: code.slice(i, end) })
      i = end
      continue
    }

    // 字符串 - 双引号
    if (code[i] === '"') {
      let j = i + 1
      while (j < len && code[j] !== '"') {
        if (code[j] === '\\') j++
        j++
      }
      j = Math.min(j + 1, len)
      tokens.push({ type: 'string', value: code.slice(i, j) })
      i = j
      continue
    }

    // 字符串 - 单引号
    if (code[i] === "'") {
      let j = i + 1
      while (j < len && code[j] !== "'") {
        if (code[j] === '\\') j++
        j++
      }
      j = Math.min(j + 1, len)
      tokens.push({ type: 'string', value: code.slice(i, j) })
      i = j
      continue
    }

    // 字符串 - 反引号（模板字符串）
    if (code[i] === '`') {
      let j = i + 1
      while (j < len && code[j] !== '`') {
        if (code[j] === '\\') j++
        j++
      }
      j = Math.min(j + 1, len)
      tokens.push({ type: 'string', value: code.slice(i, j) })
      i = j
      continue
    }

    // HTML 标签名
    if (lang.key === 'html' && code[i] === '<' && (code[i + 1] === '/' || /[a-zA-Z]/.test(code[i + 1] || ''))) {
      let j = i + 1
      if (code[j] === '/') j++
      let tagName = ''
      while (j < len && /[a-zA-Z0-9-]/.test(code[j])) {
        tagName += code[j]
        j++
      }
      if (tagName && lang.keywords.includes(tagName.toLowerCase())) {
        tokens.push({ type: 'keyword', value: code.slice(i, j) })
        i = j
        continue
      }
    }

    // 数字
    if (/[0-9]/.test(code[i]) && (i === 0 || !/[a-zA-Z_]/.test(code[i - 1]))) {
      let j = i
      if (code[j] === '0' && (code[j + 1] === 'x' || code[j + 1] === 'X')) {
        j += 2
        while (j < len && /[0-9a-fA-F]/.test(code[j])) j++
      } else {
        while (j < len && /[0-9]/.test(code[j])) j++
        if (j < len && code[j] === '.') {
          j++
          while (j < len && /[0-9]/.test(code[j])) j++
        }
      }
      tokens.push({ type: 'number', value: code.slice(i, j) })
      i = j
      continue
    }

    // 标识符/关键字
    if (/[a-zA-Z_$@]/.test(code[i]) || (lang.key === 'css' && code[i] === '-')) {
      let j = i
      while (j < len && /[a-zA-Z0-9_$\-]/.test(code[j])) j++
      const word = code.slice(i, j)
      if (lang.keywords.includes(word)) {
        tokens.push({ type: 'keyword', value: word })
      } else {
        tokens.push({ type: 'plain', value: word })
      }
      i = j
      continue
    }

    // 其他字符
    tokens.push({ type: 'plain', value: code[i] })
    i++
  }

  return tokens
}

function highlightCode(code: string, lang: LanguageDef): string {
  const tokens = tokenize(code, lang)
  const colorMap: Record<Token['type'], string> = {
    keyword: '#c792ea',
    string: '#c3e88d',
    comment: '#546e7a',
    number: '#f78c6c',
    plain: '#eeffff',
  }
  return tokens
    .map(t => `<span style="color:${colorMap[t.type]}">${escapeHtml(t.value)}</span>`)
    .join('')
}

// ============ 工具函数 ============
function formatJSONCode(code: string, indent: number): { result: string; error: string | null } {
  try {
    const parsed = JSON.parse(code)
    return { result: JSON.stringify(parsed, null, indent), error: null }
  } catch (e) {
    return { result: '', error: e instanceof Error ? e.message : 'JSON 格式错误' }
  }
}

function minifyJSONCode(code: string): { result: string; error: string | null } {
  try {
    const parsed = JSON.parse(code)
    return { result: JSON.stringify(parsed), error: null }
  } catch (e) {
    return { result: '', error: e instanceof Error ? e.message : 'JSON 格式错误' }
  }
}

function removeComments(code: string, lang: LanguageDef): string {
  let result = code
  if (lang.multiLineCommentStart && lang.multiLineCommentEnd) {
    const start = lang.multiLineCommentStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const end = lang.multiLineCommentEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(start + '[\\s\\S]*?' + end, 'g'), '')
  }
  if (lang.singleLineComment) {
    const comment = lang.singleLineComment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(comment + '.*$', 'gm'), '')
  }
  return result
}

function minifyCode(code: string, lang: LanguageDef): string {
  let result = removeComments(code, lang)
  result = result.replace(/\n\s*\n/g, '\n')
  result = result
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
  return result
}

function adjustIndent(code: string, direction: 'increase' | 'decrease', size: number): string {
  return code
    .split('\n')
    .map(line => {
      if (direction === 'increase') {
        return ' '.repeat(size) + line
      } else {
        const spaces = line.match(/^ {1,4}/)
        if (spaces) {
          return line.slice(Math.min(spaces[0].length, size))
        }
        return line.replace(/^\t/, '')
      }
    })
    .join('\n')
}

function getCodeStats(code: string) {
  const lines = code ? code.split('\n').length : 0
  const chars = code.length
  const words = code.trim() ? code.trim().split(/\s+/).length : 0
  return { lines, chars, words }
}

function generateMarkdownBlock(code: string, language: LanguageKey): string {
  return `\`\`\`${language}\n${code}\n\`\`\``
}

function simpleDiff(original: string, modified: string) {
  const origLines = original.split('\n')
  const modLines = modified.split('\n')
  const maxLen = Math.max(origLines.length, modLines.length)
  const result: Array<{
    type: 'same' | 'add' | 'remove' | 'change'
    origLineNum: number
    modLineNum: number
    origContent: string
    modContent: string
  }> = []

  for (let i = 0; i < maxLen; i++) {
    const origLine = origLines[i]
    const modLine = modLines[i]
    if (origLine === modLine) {
      result.push({ type: 'same', origLineNum: i + 1, modLineNum: i + 1, origContent: origLine ?? '', modContent: modLine ?? '' })
    } else if (origLine === undefined) {
      result.push({ type: 'add', origLineNum: 0, modLineNum: i + 1, origContent: '', modContent: modLine })
    } else if (modLine === undefined) {
      result.push({ type: 'remove', origLineNum: i + 1, modLineNum: 0, origContent: origLine, modContent: '' })
    } else {
      result.push({ type: 'change', origLineNum: i + 1, modLineNum: i + 1, origContent: origLine, modContent: modLine })
    }
  }
  return result
}

// ============ 组件 ============
export default function CodeShare() {
  const [activeTab, setActiveTab] = useState<TabKey>('editor')
  const [language, setLanguage] = useState<LanguageKey>('javascript')
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [diffOriginal, setDiffOriginal] = useState('')
  const [diffModified, setDiffModified] = useState('')
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [indentSize, setIndentSize] = useState(2)
  const [templateFilter, setTemplateFilter] = useState<LanguageKey | 'all'>('all')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLPreElement>(null)

  const currentLang = useMemo(() => LANGUAGES.find(l => l.key === language)!, [language])
  const stats = useMemo(() => getCodeStats(code), [code])

  const diffResult = useMemo(() => {
    if (!diffOriginal && !diffModified) return null
    return simpleDiff(diffOriginal, diffModified)
  }, [diffOriginal, diffModified])

  const diffStats = useMemo(() => {
    if (!diffResult) return { added: 0, removed: 0, changed: 0 }
    return {
      added: diffResult.filter(d => d.type === 'add').length,
      removed: diffResult.filter(d => d.type === 'remove').length,
      changed: diffResult.filter(d => d.type === 'change').length,
    }
  }, [diffResult])

  const highlightedPreview = useMemo(() => {
    if (!code) return ''
    return highlightCode(code, currentLang)
  }, [code, currentLang])

  const handleCopy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(label)
      setTimeout(() => setCopySuccess(null), 2000)
    } catch {
      setCopySuccess(null)
    }
  }, [])

  const handleDownload = useCallback(() => {
    if (!code) return
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code.${currentLang.ext}`
    a.click()
    URL.revokeObjectURL(url)
  }, [code, currentLang.ext])

  const handleFormatJSON = useCallback(() => {
    const { result, error } = formatJSONCode(code, indentSize)
    if (error) {
      setOutput(`格式化错误: ${error}`)
    } else {
      setCode(result)
      setOutput('JSON 格式化完成')
    }
  }, [code, indentSize])

  const handleMinifyJSON = useCallback(() => {
    const { result, error } = minifyJSONCode(code)
    if (error) {
      setOutput(`压缩错误: ${error}`)
    } else {
      setCode(result)
      setOutput('JSON 压缩完成')
    }
  }, [code])

  const handleMinify = useCallback(() => {
    const result = minifyCode(code, currentLang)
    setCode(result)
    setOutput('代码压缩完成（已移除注释和空行）')
  }, [code, currentLang])

  const handleAdjustIndent = useCallback((direction: 'increase' | 'decrease') => {
    const result = adjustIndent(code, direction, indentSize)
    setCode(result)
    setOutput(direction === 'increase' ? '缩进已增加' : '缩进已减少')
  }, [code, indentSize])

  const handleRemoveComments = useCallback(() => {
    const result = removeComments(code, currentLang)
    setCode(result)
    setOutput('注释已移除')
  }, [code, currentLang])

  const handleGenerateMarkdown = useCallback(() => {
    const md = generateMarkdownBlock(code, language)
    setOutput(md)
  }, [code, language])

  const handleLoadTemplate = useCallback((template: TemplateItem) => {
    setLanguage(template.language)
    setCode(template.code)
    setActiveTab('editor')
    setOutput(`已加载模板: ${template.title}`)
  }, [])

  const handleSyncScroll = useCallback(() => {
    if (textareaRef.current && previewRef.current) {
      previewRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

  const filteredTemplates = useMemo(() => {
    if (templateFilter === 'all') return TEMPLATES
    return TEMPLATES.filter(t => t.language === templateFilter)
  }, [templateFilter])

  // ============ 样式 ============
  const s = {
    container: {
      height: '100%',
      display: 'flex' as const,
      flexDirection: 'column' as const,
      padding: 0,
      background: 'var(--bg-primary, #0d0d1a)',
      color: 'var(--text-primary, #f0f0ff)',
      fontSize: 13,
    },
    toolbar: {
      padding: '10px 16px',
      borderBottom: '1px solid var(--border-color, rgba(124, 108, 240, 0.2))',
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap' as const,
      alignItems: 'center',
      background: 'var(--bg-secondary, #141428)',
    },
    tabBtn: (active: boolean): React.CSSProperties => ({
      padding: '6px 14px',
      border: 'none',
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      background: active ? 'var(--accent, #9b8af0)' : 'transparent',
      color: active ? '#fff' : 'var(--text-secondary, #9090c0)',
      transition: 'all 0.2s',
    }),
    langSelect: {
      padding: '5px 10px',
      border: '1px solid var(--border-color, rgba(124, 108, 240, 0.25))',
      borderRadius: 6,
      background: 'var(--bg-primary, #0d0d1a)',
      color: 'var(--text-primary, #f0f0ff)',
      fontSize: 13,
      outline: 'none',
      cursor: 'pointer',
    },
    btn: (variant: 'primary' | 'secondary' | 'danger' = 'secondary'): React.CSSProperties => ({
      padding: '5px 12px',
      border: 'none',
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 500,
      background: variant === 'primary' ? 'var(--accent, #9b8af0)' : variant === 'danger' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(155, 138, 240, 0.15)',
      color: variant === 'danger' ? '#f87171' : variant === 'primary' ? '#fff' : 'var(--text-primary, #f0f0ff)',
      transition: 'all 0.2s',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
    }),
    mainArea: {
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
    },
    editorPanel: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      borderRight: '1px solid var(--border-color, rgba(124, 108, 240, 0.2))',
      minWidth: 0,
    },
    previewPanel: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      minWidth: 0,
    },
    panelHeader: {
      padding: '6px 12px',
      background: 'var(--bg-secondary, #141428)',
      borderBottom: '1px solid var(--border-color, rgba(124, 108, 240, 0.15))',
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--text-secondary, #9090c0)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    textarea: {
      flex: 1,
      padding: 12,
      border: 'none',
      resize: 'none' as const,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace",
      fontSize: 13,
      lineHeight: 1.6,
      background: 'var(--bg-primary, #0d0d1a)',
      color: 'var(--text-primary, #f0f0ff)',
      outline: 'none',
      tabSize: 2,
    },
    prePreview: {
      flex: 1,
      padding: 12,
      margin: 0,
      overflow: 'auto',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace",
      fontSize: 13,
      lineHeight: 1.6,
      background: '#0a0a18',
      color: '#eeffff',
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-all' as const,
    },
    statusBar: {
      padding: '6px 16px',
      borderTop: '1px solid var(--border-color, rgba(124, 108, 240, 0.2))',
      background: 'var(--bg-secondary, #141428)',
      display: 'flex',
      gap: 20,
      fontSize: 11,
      color: 'var(--text-secondary, #9090c0)',
      alignItems: 'center',
    },
    outputBar: {
      padding: '8px 16px',
      borderTop: '1px solid var(--border-color, rgba(124, 108, 240, 0.2))',
      background: 'var(--bg-secondary, #141428)',
      fontSize: 12,
      color: 'var(--text-secondary, #9090c0)',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace",
      whiteSpace: 'pre-wrap' as const,
      maxHeight: 120,
      overflow: 'auto',
    },
    diffLine: (type: 'same' | 'add' | 'remove' | 'change'): React.CSSProperties => ({
      padding: '1px 12px',
      background: type === 'add' ? 'rgba(46, 204, 113, 0.1)' : type === 'remove' ? 'rgba(231, 76, 60, 0.1)' : type === 'change' ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
      borderLeft: type === 'add' ? '3px solid #2ecc71' : type === 'remove' ? '3px solid #e74c3c' : type === 'change' ? '3px solid #3498db' : '3px solid transparent',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace",
      fontSize: 13,
      lineHeight: 1.5,
    }),
    templateCard: {
      padding: '12px 16px',
      border: '1px solid var(--border-color, rgba(124, 108, 240, 0.2))',
      borderRadius: 8,
      background: 'var(--bg-secondary, #141428)',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    langBadge: (color: string): React.CSSProperties => ({
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      background: color + '20',
      color: color,
      border: `1px solid ${color}40`,
    }),
    divider: {
      width: 1,
      height: 20,
      background: 'var(--border-color, rgba(124, 108, 240, 0.2))',
      margin: '0 4px',
    },
  }

  return (
    <div style={s.container}>
      {/* ====== 顶部工具栏 ====== */}
      <div style={s.toolbar}>
        {/* 标签页切换 */}
        {([
          { key: 'editor' as TabKey, label: '编辑器' },
          { key: 'diff' as TabKey, label: '代码对比' },
          { key: 'templates' as TabKey, label: '模板库' },
          { key: 'markdown' as TabKey, label: 'Markdown' },
        ]).map(tab => (
          <button
            key={tab.key}
            style={s.tabBtn(activeTab === tab.key)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}

        <div style={s.divider} />

        {/* 语言选择 */}
        {activeTab === 'editor' && (
          <>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value as LanguageKey)}
              style={s.langSelect}
            >
              {LANGUAGES.map(l => (
                <option key={l.key} value={l.key}>{l.icon} {l.label}</option>
              ))}
            </select>
            <div style={s.divider} />

            {/* 格式化按钮组 */}
            <button style={s.btn('secondary')} onClick={handleFormatJSON} disabled={language !== 'json'}>
              格式化JSON
            </button>
            <button style={s.btn('secondary')} onClick={handleMinifyJSON} disabled={language !== 'json'}>
              压缩JSON
            </button>
            <button style={s.btn('secondary')} onClick={handleMinify} disabled={!code}>
              压缩代码
            </button>
            <button style={s.btn('secondary')} onClick={handleRemoveComments} disabled={!code}>
              移除注释
            </button>

            <div style={s.divider} />

            <button style={s.btn('secondary')} onClick={() => handleAdjustIndent('increase')} disabled={!code}>
              增加缩进
            </button>
            <button style={s.btn('secondary')} onClick={() => handleAdjustIndent('decrease')} disabled={!code}>
              减少缩进
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary, #9090c0)' }}>缩进:</span>
              <select
                value={indentSize}
                onChange={e => setIndentSize(Number(e.target.value))}
                style={{ ...s.langSelect, padding: '3px 6px', fontSize: 12 }}
              >
                <option value={2}>2</option>
                <option value={4}>4</option>
                <option value={8}>8</option>
              </select>
            </div>

            <div style={{ flex: 1 }} />

            <button
              style={s.btn('secondary')}
              onClick={() => handleCopy(code, 'code')}
              disabled={!code}
            >
              {copySuccess === 'code' ? '已复制' : '复制'}
            </button>
            <button
              style={s.btn('primary')}
              onClick={handleDownload}
              disabled={!code}
            >
              下载
            </button>
            <button style={s.btn('danger')} onClick={() => { setCode(''); setOutput('') }} disabled={!code}>
              清空
            </button>
          </>
        )}

        {activeTab === 'diff' && (
          <>
            <button
              style={s.btn('secondary')}
              onClick={() => { const t = diffOriginal; setDiffOriginal(diffModified); setDiffModified(t) }}
            >
              交换
            </button>
            <button style={s.btn('danger')} onClick={() => { setDiffOriginal(''); setDiffModified('') }}>
              清空
            </button>
            <div style={{ flex: 1 }} />
            <button
              style={s.btn('secondary')}
              onClick={() => {
                if (!diffResult) return
                const text = diffResult.map(d => {
                  if (d.type === 'add') return `+ ${d.modContent}`
                  if (d.type === 'remove') return `- ${d.origContent}`
                  if (d.type === 'change') return `- ${d.origContent}\n+ ${d.modContent}`
                  return `  ${d.origContent}`
                }).join('\n')
                handleCopy(text, 'diff')
              }}
              disabled={!diffResult}
            >
              {copySuccess === 'diff' ? '已复制' : '复制差异'}
            </button>
          </>
        )}

        {activeTab === 'markdown' && (
          <>
            <button
              style={s.btn('primary')}
              onClick={handleGenerateMarkdown}
              disabled={!code}
            >
              生成 Markdown 代码块
            </button>
            <div style={{ flex: 1 }} />
            <button
              style={s.btn('secondary')}
              onClick={() => handleCopy(output, 'md')}
              disabled={!output}
            >
              {copySuccess === 'md' ? '已复制' : '复制'}
            </button>
          </>
        )}

        {activeTab === 'templates' && (
          <select
            value={templateFilter}
            onChange={e => setTemplateFilter(e.target.value as LanguageKey | 'all')}
            style={s.langSelect}
          >
            <option value="all">全部语言</option>
            {LANGUAGES.map(l => (
              <option key={l.key} value={l.key}>{l.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* ====== 主内容区 ====== */}
      {activeTab === 'editor' && (
        <div style={s.mainArea}>
          {/* 左侧：代码输入 */}
          <div style={s.editorPanel}>
            <div style={s.panelHeader}>
              <span style={{ ...s.langBadge(currentLang.color), fontSize: 10 }}>{currentLang.icon} {currentLang.label}</span>
              代码输入
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => { setCode(e.target.value); setOutput('') }}
              onScroll={handleSyncScroll}
              placeholder={`在此输入 ${currentLang.label} 代码...`}
              spellCheck={false}
              style={s.textarea}
            />
          </div>

          {/* 右侧：语法高亮预览 */}
          <div style={s.previewPanel}>
            <div style={s.panelHeader}>
              语法高亮预览
            </div>
            <pre ref={previewRef} style={s.prePreview}>
              {code ? (
                <code dangerouslySetInnerHTML={{ __html: highlightedPreview }} />
              ) : (
                <span style={{ color: 'var(--text-secondary, #9090c0)', fontStyle: 'italic' }}>
                  在左侧输入代码后，这里会显示语法高亮预览
                </span>
              )}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'diff' && (
        <div style={s.mainArea}>
          {/* 左侧：原始代码 */}
          <div style={s.editorPanel}>
            <div style={{ ...s.panelHeader, color: '#e74c3c' }}>
              原始代码
            </div>
            <textarea
              value={diffOriginal}
              onChange={e => setDiffOriginal(e.target.value)}
              placeholder="粘贴原始代码..."
              spellCheck={false}
              style={s.textarea}
            />
          </div>

          {/* 右侧：修改后代码 */}
          <div style={s.previewPanel}>
            <div style={{ ...s.panelHeader, color: '#2ecc71' }}>
              修改后代码
            </div>
            <textarea
              value={diffModified}
              onChange={e => setDiffModified(e.target.value)}
              placeholder="粘贴修改后的代码..."
              spellCheck={false}
              style={{ ...s.textarea, background: '#0a0a18' }}
            />
          </div>
        </div>
      )}

      {/* 对比结果 */}
      {activeTab === 'diff' && diffResult && diffResult.some(d => d.type !== 'same') && (
        <div style={{ maxHeight: 200, overflow: 'auto', background: '#0a0a18', borderTop: '1px solid var(--border-color, rgba(124, 108, 240, 0.2))' }}>
          <div style={{ ...s.panelHeader, background: 'rgba(20, 20, 40, 0.9)' }}>
            对比结果
            <span style={{ marginLeft: 12, color: '#2ecc71' }}>+{diffStats.added}</span>
            <span style={{ color: '#e74c3c' }}>-{diffStats.removed}</span>
            <span style={{ color: '#3498db' }}>~{diffStats.changed}</span>
          </div>
          {diffResult.map((line, i) => (
            <div key={i} style={s.diffLine(line.type)}>
              <span style={{ color: 'var(--text-secondary, #9090c0)', marginRight: 12, minWidth: 32, display: 'inline-block', textAlign: 'right' as const }}>
                {line.origLineNum || ''}
              </span>
              <span style={{ color: line.type === 'add' ? '#2ecc71' : line.type === 'remove' ? '#e74c3c' : line.type === 'change' ? '#3498db' : 'inherit' }}>
                {line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : line.type === 'change' ? '~ ' : '  '}
              </span>
              <span style={{ color: line.type === 'remove' ? '#e74c3c' : line.type === 'change' ? '#e74c3c' : 'inherit' }}>
                {line.origContent}
              </span>
              {line.type === 'change' && (
                <>
                  {'\n'}
                  <span style={{ color: 'var(--text-secondary, #9090c0)', marginRight: 12, minWidth: 32, display: 'inline-block', textAlign: 'right' as const }}>
                    {line.modLineNum || ''}
                  </span>
                  <span style={{ color: '#2ecc71' }}>+ {line.modContent}</span>
                </>
              )}
              {line.type === 'add' && (
                <span style={{ color: '#2ecc71' }}>{line.modContent}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'templates' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}>
            {filteredTemplates.map(t => {
              const langDef = LANGUAGES.find(l => l.key === t.language)!
              return (
                <div
                  key={t.id}
                  style={s.templateCard}
                  onClick={() => handleLoadTemplate(t)}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent, #9b8af0)'
                    ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(155, 138, 240, 0.08)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-color, rgba(124, 108, 240, 0.2))'
                    ;(e.currentTarget as HTMLDivElement).style.background = 'var(--bg-secondary, #141428)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</span>
                    <span style={s.langBadge(langDef.color)}>{langDef.icon} {langDef.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary, #9090c0)', marginBottom: 8 }}>
                    {t.description}
                  </div>
                  <pre style={{
                    margin: 0,
                    padding: '8px 10px',
                    background: '#0a0a18',
                    borderRadius: 6,
                    fontSize: 11,
                    lineHeight: 1.4,
                    color: '#a0a0b0',
                    overflow: 'hidden',
                    maxHeight: 80,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}>
                    {t.code.slice(0, 200)}{t.code.length > 200 ? '...' : ''}
                  </pre>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'markdown' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div style={s.editorPanel}>
              <div style={s.panelHeader}>
                <span style={s.langBadge(currentLang.color)}>{currentLang.icon} {currentLang.label}</span>
                原始代码
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="输入代码后点击'生成 Markdown 代码块'"
                spellCheck={false}
                style={s.textarea}
              />
            </div>
            <div style={s.previewPanel}>
              <div style={s.panelHeader}>
                Markdown 输出
              </div>
              <pre style={s.prePreview}>
                {output ? (
                  <code>{output}</code>
                ) : (
                  <span style={{ color: 'var(--text-secondary, #9090c0)', fontStyle: 'italic' }}>
                    点击工具栏中的"生成 Markdown 代码块"按钮
                  </span>
                )}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ====== 输出消息栏 ====== */}
      {output && (
        <div style={s.outputBar}>{output}</div>
      )}

      {/* ====== 状态栏 ====== */}
      {activeTab === 'editor' && (
        <div style={s.statusBar}>
          <span>行数: {stats.lines}</span>
          <span>字符数: {stats.chars}</span>
          <span>单词数: {stats.words}</span>
          <span style={s.langBadge(currentLang.color)}>{currentLang.icon} {currentLang.label}</span>
          <span>缩进: {indentSize}</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 10, opacity: 0.6 }}>CodeShare - 代码片段分享工具</span>
        </div>
      )}
    </div>
  )
}
