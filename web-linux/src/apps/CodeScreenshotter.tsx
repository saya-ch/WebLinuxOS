import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '../store'
import {
  Copy, Image, Type, Palette, Eye, EyeOff,
  RotateCcw, Sparkles, Monitor,
} from 'lucide-react'

// ============ 类型定义 ============
type LanguageKey =
  | 'javascript' | 'typescript' | 'python' | 'html'
  | 'css' | 'json' | 'sql' | 'bash' | 'go' | 'rust'

type ThemeKey = 'dark' | 'light' | 'neon' | 'glacier' | 'solarized' | 'dracula'

type FontKey = 'JetBrains Mono' | 'Fira Code' | 'Monaco' | 'Consolas' | 'SF Mono' | 'Courier New'

type TemplateKey = 'classic' | 'modern' | 'minimal'

type BackgroundMode = 'solid' | 'gradient' | 'transparent'

interface LanguageDef {
  key: LanguageKey
  label: string
  icon: string
  color: string
  keywords: string[]
  singleLineComment: string
  multiLineCommentStart?: string
  multiLineCommentEnd?: string
}

interface ThemeDef {
  key: ThemeKey
  label: string
  background: string
  text: string
  keyword: string
  string: string
  comment: string
  number: string
  property: string
  tag: string
  constant: string
  function: string
}

interface FontDef {
  key: FontKey
  label: string
  stack: string
}

interface TemplateDef {
  key: TemplateKey
  label: string
  padding: number
  borderRadius: number
  shadow: boolean
  showLineNumbers: boolean
  showWindowControls: boolean
  backgroundMode: BackgroundMode
  backgroundColor: string
  gradientFrom: string
  gradientTo: string
}

interface Token {
  type: 'keyword' | 'string' | 'comment' | 'number' | 'plain' | 'property' | 'tag' | 'constant' | 'function'
  value: string
}

// ============ 语言定义 ============
const LANGUAGES: LanguageDef[] = [
  {
    key: 'javascript', label: 'JavaScript', icon: 'JS', color: '#f7df1e',
    keywords: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'import', 'export', 'default', 'from', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'null', 'undefined', 'true', 'false', 'yield', 'static', 'super', 'delete', 'void'],
    singleLineComment: '//', multiLineCommentStart: '/*', multiLineCommentEnd: '*/',
  },
  {
    key: 'typescript', label: 'TypeScript', icon: 'TS', color: '#3178c6',
    keywords: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'import', 'export', 'default', 'from', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'null', 'undefined', 'true', 'false', 'interface', 'type', 'enum', 'implements', 'public', 'private', 'protected', 'readonly', 'abstract', 'as', 'is', 'keyof', 'never', 'unknown', 'any', 'void', 'static', 'super', 'declare', 'module', 'namespace', 'require'],
    singleLineComment: '//', multiLineCommentStart: '/*', multiLineCommentEnd: '*/',
  },
  {
    key: 'python', label: 'Python', icon: 'Py', color: '#3776ab',
    keywords: ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'yield', 'lambda', 'pass', 'and', 'or', 'not', 'is', 'in', 'True', 'False', 'None', 'global', 'nonlocal', 'assert', 'del', 'async', 'await', 'print', 'self'],
    singleLineComment: '#',
  },
  {
    key: 'html', label: 'HTML', icon: '<>', color: '#e34f26',
    keywords: ['html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'tr', 'td', 'th', 'form', 'input', 'button', 'select', 'option', 'textarea', 'script', 'style', 'link', 'meta', 'title', 'header', 'footer', 'nav', 'main', 'section', 'article', 'aside'],
    singleLineComment: '', multiLineCommentStart: '<!--', multiLineCommentEnd: '-->',
  },
  {
    key: 'css', label: 'CSS', icon: '#', color: '#1572b6',
    keywords: ['color', 'background', 'margin', 'padding', 'border', 'display', 'position', 'width', 'height', 'font', 'text', 'flex', 'grid', 'align', 'justify', 'overflow', 'opacity', 'transform', 'transition', 'animation', 'box', 'outline', 'cursor', 'z-index', 'top', 'left', 'right', 'bottom', 'float', 'clear', 'content', 'visibility', 'min', 'max', 'gap', 'order', 'place', 'none', 'auto', 'inherit', 'initial', 'unset', 'important'],
    singleLineComment: '//', multiLineCommentStart: '/*', multiLineCommentEnd: '*/',
  },
  {
    key: 'json', label: 'JSON', icon: '{}', color: '#292929',
    keywords: ['true', 'false', 'null'],
    singleLineComment: '',
  },
  {
    key: 'sql', label: 'SQL', icon: 'SQ', color: '#e38c00',
    keywords: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'ADD', 'COLUMN', 'INDEX', 'VIEW', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON', 'AS', 'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'BETWEEN', 'LIKE', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'DISTINCT', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'DEFAULT', 'CHECK', 'UNIQUE', 'CONSTRAINT', 'AUTO_INCREMENT', 'INT', 'VARCHAR', 'TEXT', 'BOOLEAN', 'FLOAT', 'DECIMAL', 'DATE', 'DATETIME', 'TIMESTAMP'],
    singleLineComment: '--', multiLineCommentStart: '/*', multiLineCommentEnd: '*/',
  },
  {
    key: 'bash', label: 'Bash', icon: '#!', color: '#4eaa25',
    keywords: ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'function', 'return', 'in', 'select', 'until', 'echo', 'exit', 'read', 'set', 'unset', 'export', 'source', 'alias', 'local', 'declare', 'typeset', 'readonly', 'true', 'false', 'cd', 'ls', 'grep', 'awk', 'sed', 'find', 'cat', 'mkdir', 'rm', 'cp', 'mv', 'chmod', 'chown', 'sudo', 'apt', 'yum', 'npm', 'git', 'docker'],
    singleLineComment: '#',
  },
  {
    key: 'go', label: 'Go', icon: 'Go', color: '#00add8',
    keywords: ['func', 'return', 'if', 'else', 'for', 'switch', 'case', 'break', 'continue', 'default', 'var', 'const', 'type', 'struct', 'interface', 'map', 'chan', 'go', 'select', 'range', 'package', 'import', 'defer', 'fallthrough', 'goto', 'nil', 'true', 'false', 'make', 'new', 'append', 'len', 'cap', 'copy', 'delete', 'close', 'panic', 'recover', 'print', 'println'],
    singleLineComment: '//', multiLineCommentStart: '/*', multiLineCommentEnd: '*/',
  },
  {
    key: 'rust', label: 'Rust', icon: 'Rs', color: '#dea584',
    keywords: ['fn', 'let', 'mut', 'const', 'if', 'else', 'for', 'while', 'loop', 'match', 'return', 'struct', 'enum', 'impl', 'trait', 'pub', 'use', 'mod', 'crate', 'self', 'super', 'where', 'as', 'in', 'ref', 'move', 'type', 'static', 'async', 'await', 'dyn', 'box', 'unsafe', 'extern', 'true', 'false', 'break', 'continue', 'yield', 'Some', 'None', 'Ok', 'Err', 'Vec', 'String', 'Option', 'Result', 'println', 'format', 'macro_rules'],
    singleLineComment: '//', multiLineCommentStart: '/*', multiLineCommentEnd: '*/',
  },
]

// ============ 主题定义 ============
const THEMES: ThemeDef[] = [
  {
    key: 'dark', label: '深色',
    background: '#1e1e2e', text: '#cdd6f4',
    keyword: '#cba6f7', string: '#a6e3a1', comment: '#6c7086',
    number: '#fab387', property: '#89b4fa', tag: '#f38ba8',
    constant: '#f9e2af', function: '#94e2d5',
  },
  {
    key: 'light', label: '浅色',
    background: '#ffffff', text: '#24292e',
    keyword: '#d73a49', string: '#22863a', comment: '#6a737d',
    number: '#005cc5', property: '#0050cc', tag: '#22863a',
    constant: '#005cc5', function: '#6f42c1',
  },
  {
    key: 'neon', label: '霓虹',
    background: '#0a0a1a', text: '#e0e0ff',
    keyword: '#ff79c6', string: '#f1fa8c', comment: '#6272a4',
    number: '#bd93f9', property: '#8be9fd', tag: '#ff79c6',
    constant: '#50fa7b', function: '#50fa7b',
  },
  {
    key: 'glacier', label: '冰川',
    background: '#1a2332', text: '#d4e4f7',
    keyword: '#82aaff', string: '#c3e88d', comment: '#546e7a',
    number: '#f78c6c', property: '#addb67', tag: '#f07178',
    constant: '#ffcb6b', function: '#82aaff',
  },
  {
    key: 'solarized', label: '日光',
    background: '#fdf6e3', text: '#586e75',
    keyword: '#859900', string: '#2aa198', comment: '#93a1a1',
    number: '#d33682', property: '#268bd2', tag: '#cb4b16',
    constant: '#b58900', function: '#268bd2',
  },
  {
    key: 'dracula', label: '德古拉',
    background: '#282a36', text: '#f8f8f2',
    keyword: '#ff79c6', string: '#f1fa8c', comment: '#6272a4',
    number: '#bd93f9', property: '#50fa7b', tag: '#ff79c6',
    constant: '#bd93f9', function: '#50fa7b',
  },
]

// ============ 字体定义 ============
const FONTS: FontDef[] = [
  { key: 'JetBrains Mono', label: 'JetBrains Mono', stack: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace' },
  { key: 'Fira Code', label: 'Fira Code', stack: '"Fira Code", "JetBrains Mono", "SF Mono", Consolas, monospace' },
  { key: 'Monaco', label: 'Monaco', stack: 'Monaco, "SF Mono", Consolas, monospace' },
  { key: 'Consolas', label: 'Consolas', stack: 'Consolas, Monaco, "SF Mono", monospace' },
  { key: 'SF Mono', label: 'SF Mono', stack: '"SF Mono", Monaco, Consolas, monospace' },
  { key: 'Courier New', label: 'Courier New', stack: '"Courier New", Courier, monospace' },
]

// ============ 预设模板 ============
const TEMPLATES: TemplateDef[] = [
  {
    key: 'classic', label: '经典',
    padding: 32, borderRadius: 12, shadow: true,
    showLineNumbers: true, showWindowControls: true,
    backgroundMode: 'solid', backgroundColor: '#1e1e2e',
    gradientFrom: '#667eea', gradientTo: '#764ba2',
  },
  {
    key: 'modern', label: '现代',
    padding: 40, borderRadius: 20, shadow: true,
    showLineNumbers: false, showWindowControls: false,
    backgroundMode: 'gradient', backgroundColor: '#1e1e2e',
    gradientFrom: '#0f0c29', gradientTo: '#302b63',
  },
  {
    key: 'minimal', label: '极简',
    padding: 24, borderRadius: 4, shadow: false,
    showLineNumbers: false, showWindowControls: false,
    backgroundMode: 'solid', backgroundColor: '#0d1117',
    gradientFrom: '#ffffff', gradientTo: '#ffffff',
  },
]

// ============ 示例代码 ============
const SAMPLE_CODE: Record<LanguageKey, string> = {
  javascript: `// Hello World
function greet(name) {
  const message = \`Hello, \${name}!\`;
  console.log(message);
  return message;
}

const result = greet('World');
console.log(result);`,
  typescript: `interface User {
  id: number;
  name: string;
  email?: string;
}

function getUser(id: number): User {
  return { id, name: 'Alice' };
}

const user = getUser(1);
console.log(user.name);`,
  python: `# Fibonacci sequence
def fibonacci(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b

for i in range(10):
    print(fibonacci(i))`,
  html: `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>示例</title>
</head>
<body>
  <h1>Hello World</h1>
  <p>这是一个示例页面</p>
</body>
</html>`,
  css: `.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.card {
  padding: 2rem;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}`,
  json: `{
  "name": "CodeScreenshotter",
  "version": "1.0.0",
  "features": ["syntax-highlight", "export-png", "export-svg"],
  "config": {
    "theme": "dark",
    "language": "auto"
  }
}`,
  sql: `-- 查询示例
SELECT u.id, u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 5
ORDER BY order_count DESC
LIMIT 10;`,
  bash: `#!/bin/bash
# 备份脚本
set -e

BACKUP_DIR="/var/backups"
DATE=$(date +%Y%m%d)

echo "开始备份..."
tar -czf "\${BACKUP_DIR}/backup-\${DATE}.tar.gz" /home/data
echo "备份完成"`,
  go: `package main

import "fmt"

func fibonacci(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacci(n-1) + fibonacci(n-2)
}

func main() {
    for i := 0; i < 10; i++ {
        fmt.Println(fibonacci(i))
    }
}`,
  rust: `fn fibonacci(n: u32) -> u32 {
    match n {
        0 | 1 => n,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn main() {
    for i in 0..10 {
        println!("fibonacci({}) = {}", i, fibonacci(i));
    }
}`,
}

// ============ 语法高亮 ============
function tokenize(code: string, lang: LanguageDef): Token[] {
  const tokens: Token[] = []
  let i = 0
  const len = code.length

  while (i < len) {
    if (lang.multiLineCommentStart && lang.multiLineCommentEnd) {
      if (code.startsWith(lang.multiLineCommentStart, i)) {
        const endIdx = code.indexOf(lang.multiLineCommentEnd, i + lang.multiLineCommentStart.length)
        const end = endIdx === -1 ? len : endIdx + lang.multiLineCommentEnd.length
        tokens.push({ type: 'comment', value: code.slice(i, end) })
        i = end
        continue
      }
    }

    if (lang.singleLineComment && code.startsWith(lang.singleLineComment, i)) {
      const endIdx = code.indexOf('\n', i)
      const end = endIdx === -1 ? len : endIdx
      tokens.push({ type: 'comment', value: code.slice(i, end) })
      i = end
      continue
    }

    if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      const quote = code[i]
      let j = i + 1
      while (j < len && code[j] !== quote) { if (code[j] === '\\') j++; j++ }
      j = Math.min(j + 1, len)
      tokens.push({ type: 'string', value: code.slice(i, j) })
      i = j
      continue
    }

    if (lang.key === 'html' && code[i] === '<' && (code[i + 1] === '/' || /[a-zA-Z]/.test(code[i + 1] || ''))) {
      let j = i + 1
      if (code[j] === '/') j++
      let tagName = ''
      while (j < len && /[a-zA-Z0-9-]/.test(code[j])) { tagName += code[j]; j++ }
      if (tagName && lang.keywords.includes(tagName.toLowerCase())) {
        tokens.push({ type: 'tag', value: code.slice(i, j) })
        i = j
        continue
      }
    }

    if (/[0-9]/.test(code[i]) && (i === 0 || !/[a-zA-Z_]/.test(code[i - 1]))) {
      let j = i
      if (code[j] === '0' && (code[j + 1] === 'x' || code[j + 1] === 'X')) {
        j += 2
        while (j < len && /[0-9a-fA-F]/.test(code[j])) j++
      } else {
        while (j < len && /[0-9]/.test(code[j])) j++
        if (j < len && code[j] === '.') { j++; while (j < len && /[0-9]/.test(code[j])) j++ }
      }
      tokens.push({ type: 'number', value: code.slice(i, j) })
      i = j
      continue
    }

    if (/[a-zA-Z_$]/.test(code[i]) || (lang.key === 'css' && code[i] === '-')) {
      let j = i
      while (j < len && /[a-zA-Z0-9_$\-]/.test(code[j])) j++
      const word = code.slice(i, j)
      if (lang.keywords.includes(word)) {
        tokens.push({ type: 'keyword', value: word })
      } else if (lang.key === 'typescript' && (word === 'true' || word === 'false' || word === 'null' || word === 'undefined')) {
        tokens.push({ type: 'constant', value: word })
      } else if (lang.key === 'javascript' && (word === 'true' || word === 'false' || word === 'null' || word === 'undefined')) {
        tokens.push({ type: 'constant', value: word })
      } else if (lang.key === 'python' && (word === 'True' || word === 'False' || word === 'None')) {
        tokens.push({ type: 'constant', value: word })
      } else if (lang.key === 'rust' && (word === 'true' || word === 'false')) {
        tokens.push({ type: 'constant', value: word })
      } else if (lang.key === 'go' && (word === 'true' || word === 'false' || word === 'nil')) {
        tokens.push({ type: 'constant', value: word })
      } else if (/^[A-Z]/.test(word) && lang.key !== 'css') {
        tokens.push({ type: 'function', value: word })
      } else {
        tokens.push({ type: 'plain', value: word })
      }
      i = j
      continue
    }

    tokens.push({ type: 'plain', value: code[i] })
    i++
  }

  return tokens
}

// ============ Canvas 绘制代码截图 ============
interface RenderConfig {
  code: string
  language: LanguageDef
  theme: ThemeDef
  font: FontDef
  showLineNumbers: boolean
  showWindowControls: boolean
  padding: number
  borderRadius: number
  shadow: boolean
  backgroundMode: BackgroundMode
  backgroundColor: string
  gradientFrom: string
  gradientTo: string
  fontSize: number
  lineHeight: number
  title?: string
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function renderCodeToCanvas(canvas: HTMLCanvasElement, config: RenderConfig) {
  const ctx = canvas.getContext('2d')!
  const {
    code, language, theme, font, showLineNumbers, showWindowControls,
    padding, borderRadius, shadow, backgroundMode, backgroundColor,
    gradientFrom, gradientTo, fontSize, lineHeight, title,
  } = config

  const scale = 2
  const fontStack = font.stack
  ctx.font = `${fontSize}px ${fontStack}`
  const charWidth = ctx.measureText('M').width
  const lineHeightPx = fontSize * lineHeight

  const lines = code.split('\n')
  const maxLineLength = Math.max(...lines.map(l => l.length), 1)

  const lineNumbersWidth = showLineNumbers ? String(lines.length).length * charWidth + 20 : 0
  const titleHeight = showWindowControls ? 44 : 0
  const extraTopPadding = showWindowControls ? 56 : 10
  const titleBarHeight = title ? lineHeightPx + 16 : 0

  const codeWidth = maxLineLength * charWidth
  const width = Math.ceil(padding * 2 + lineNumbersWidth + codeWidth)
  const height = Math.ceil(
    padding * 2 + titleHeight + titleBarHeight + lines.length * lineHeightPx + extraTopPadding - lineHeightPx
  )

  canvas.width = width * scale
  canvas.height = height * scale
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx.scale(scale, scale)

  ctx.clearRect(0, 0, width, height)

  if (shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
    ctx.shadowBlur = 30
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 8
  }

  if (backgroundMode === 'gradient') {
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, gradientFrom)
    gradient.addColorStop(1, gradientTo)
    ctx.fillStyle = gradient
  } else if (backgroundMode === 'transparent') {
    ctx.fillStyle = 'transparent'
  } else {
    ctx.fillStyle = backgroundColor
  }

  drawRoundedRect(ctx, 0, 0, width, height, borderRadius)
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  const codeAreaX = padding + lineNumbersWidth
  let y = padding + extraTopPadding

  if (showWindowControls) {
    const controlY = padding + 16
    const colors = ['#ff5f56', '#ffbd2e', '#27c93f']
    colors.forEach((color, idx) => {
      ctx.beginPath()
      ctx.arc(padding + 16 + idx * 24, controlY, 8, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    })
  }

  if (title) {
    ctx.font = `600 ${fontSize}px ${fontStack}`
    ctx.fillStyle = theme.text
    ctx.textBaseline = 'top'
    ctx.fillText(title, codeAreaX, padding + (showWindowControls ? 16 : 10))
    ctx.font = `${fontSize}px ${fontStack}`
  }

  if (showLineNumbers) {
    ctx.font = `${fontSize}px ${fontStack}`
    ctx.fillStyle = theme.comment
    ctx.textBaseline = 'top'
    lines.forEach((_, idx) => {
      const lineNum = String(idx + 1)
      ctx.fillText(lineNum, padding + 8, y)
      y += lineHeightPx
    })
    y = padding + extraTopPadding
  }

  lines.forEach((line) => {
    if (showLineNumbers) {
      ctx.fillStyle = theme.comment
      ctx.textBaseline = 'top'
      ctx.fillText('', padding + 8, y)
    }

    const tokens = tokenize(line, language)
    let x = codeAreaX
    ctx.textBaseline = 'top'

    tokens.forEach((token) => {
      let color = theme.text
      switch (token.type) {
        case 'keyword': color = theme.keyword; break
        case 'string': color = theme.string; break
        case 'comment': color = theme.comment; break
        case 'number': color = theme.number; break
        case 'property': color = theme.property; break
        case 'tag': color = theme.tag; break
        case 'constant': color = theme.constant; break
        case 'function': color = theme.function; break
        case 'plain':
        default: color = theme.text; break
      }

      ctx.fillStyle = color
      ctx.fillText(token.value, x, y)
      x += ctx.measureText(token.value).width
    })

    y += lineHeightPx
  })
}

// ============ 生成 SVG ============
function generateSVG(config: RenderConfig): string {
  const {
    code, language, theme, font, showLineNumbers, showWindowControls,
    padding, borderRadius, backgroundMode, backgroundColor,
    gradientFrom, gradientTo, fontSize, lineHeight, title,
  } = config

  const fontStack = font.stack.replace(/"/g, '&quot;')
  const lines = code.split('\n')
  const charWidth = fontSize * 0.6
  const lineHeightPx = fontSize * lineHeight

  const lineNumbersWidth = showLineNumbers ? String(lines.length).length * charWidth + 20 : 0
  const titleHeight = showWindowControls ? 44 : 0
  const extraTopPadding = showWindowControls ? 56 : 10
  const titleBarHeight = title ? lineHeightPx + 16 : 0

  const codeWidth = Math.max(...lines.map(l => l.length), 1) * charWidth
  const width = Math.ceil(padding * 2 + lineNumbersWidth + codeWidth + 40)
  const height = Math.ceil(
    padding * 2 + titleHeight + titleBarHeight + lines.length * lineHeightPx + extraTopPadding - lineHeightPx
  )

  let bgRect = ''
  if (backgroundMode === 'gradient') {
    bgRect = `<defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${gradientFrom}"/><stop offset="100%" style="stop-color:${gradientTo}"/></linearGradient></defs><rect width="${width}" height="${height}" rx="${borderRadius}" fill="url(#bg)"/>`
  } else if (backgroundMode === 'transparent') {
    bgRect = `<rect width="${width}" height="${height}" rx="${borderRadius}" fill="transparent"/>`
  } else {
    bgRect = `<rect width="${width}" height="${height}" rx="${borderRadius}" fill="${backgroundColor}"/>`
  }

  let controls = ''
  if (showWindowControls) {
    const cy = padding + 16
    const colors = ['#ff5f56', '#ffbd2e', '#27c93f']
    controls = colors.map((c, idx) =>
      `<circle cx="${padding + 16 + idx * 24}" cy="${cy}" r="8" fill="${c}"/>`
    ).join('')
  }

  let titleText = ''
  if (title) {
    titleText = `<text x="${padding + lineNumbersWidth}" y="${padding + (showWindowControls ? 28 : 16)}" font-family="${fontStack}" font-size="${fontSize}" font-weight="600" fill="${theme.text}">${title}</text>`
  }

  let lineNumbers = ''
  if (showLineNumbers) {
    lines.forEach((_, idx) => {
      lineNumbers += `<text x="${padding + 8}" y="${padding + extraTopPadding + idx * lineHeightPx}" font-family="${fontStack}" font-size="${fontSize}" fill="${theme.comment}">${idx + 1}</text>`
    })
  }

  let codeContent = ''
  lines.forEach((line, lineIdx) => {
    const tokens = tokenize(line, language)
    let x = padding + lineNumbersWidth
    const y = padding + extraTopPadding + lineIdx * lineHeightPx

    tokens.forEach((token) => {
      let color = theme.text
      switch (token.type) {
        case 'keyword': color = theme.keyword; break
        case 'string': color = theme.string; break
        case 'comment': color = theme.comment; break
        case 'number': color = theme.number; break
        case 'property': color = theme.property; break
        case 'tag': color = theme.tag; break
        case 'constant': color = theme.constant; break
        case 'function': color = theme.function; break
      }

      const escaped = token.value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')

      codeContent += `<text x="${x}" y="${y}" font-family="${fontStack}" font-size="${fontSize}" fill="${color}">${escaped}</text>`
      x += token.value.length * charWidth
    })
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${bgRect}${controls}${titleText}${lineNumbers}${codeContent}</svg>`
}

// ============ 主组件 ============
export default function CodeScreenshotter() {
  const theme = useStore((s) => s.theme)
  const isDark = theme === 'dark'

  const [code, setCode] = useState(SAMPLE_CODE.javascript)
  const [language, setLanguage] = useState<LanguageKey>('javascript')
  const [themeKey, setThemeKey] = useState<ThemeKey>('dark')
  const [fontKey, setFontKey] = useState<FontKey>('JetBrains Mono')
  const [templateKey, setTemplateKey] = useState<TemplateKey>('classic')
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('solid')
  const [backgroundColor, setBackgroundColor] = useState('#1e1e2e')
  const [gradientFrom, setGradientFrom] = useState('#667eea')
  const [gradientTo, setGradientTo] = useState('#764ba2')
  const [fontSize, setFontSize] = useState(14)
  const [padding, setPadding] = useState(32)
  const [borderRadius, setBorderRadius] = useState(12)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [showWindowControls, setShowWindowControls] = useState(true)
  const [showShadow, setShowShadow] = useState(true)
  const [title, setTitle] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentLang = useMemo(() => LANGUAGES.find(l => l.key === language)!, [language])
  const currentTheme = useMemo(() => THEMES.find(t => t.key === themeKey)!, [themeKey])
  const currentFont = useMemo(() => FONTS.find(f => f.key === fontKey)!, [fontKey])

  const renderConfig = useMemo<RenderConfig>(() => ({
    code: code || ' ',
    language: currentLang,
    theme: currentTheme,
    font: currentFont,
    showLineNumbers,
    showWindowControls,
    padding,
    borderRadius,
    shadow: showShadow,
    backgroundMode,
    backgroundColor,
    gradientFrom,
    gradientTo,
    fontSize,
    lineHeight: 1.6,
    title: title || undefined,
  }), [code, currentLang, currentTheme, currentFont, showLineNumbers, showWindowControls, padding, borderRadius, showShadow, backgroundMode, backgroundColor, gradientFrom, gradientTo, fontSize, title])

  useEffect(() => {
    if (canvasRef.current && code) {
      renderCodeToCanvas(canvasRef.current, renderConfig)
    }
  }, [renderConfig])

  const applyTemplate = useCallback((tpl: TemplateDef) => {
    setTemplateKey(tpl.key)
    setPadding(tpl.padding)
    setBorderRadius(tpl.borderRadius)
    setShowShadow(tpl.shadow)
    setShowLineNumbers(tpl.showLineNumbers)
    setShowWindowControls(tpl.showWindowControls)
    setBackgroundMode(tpl.backgroundMode)
    setBackgroundColor(tpl.backgroundColor)
    setGradientFrom(tpl.gradientFrom)
    setGradientTo(tpl.gradientTo)
  }, [])

  useEffect(() => {
    const tpl = TEMPLATES.find(t => t.key === templateKey)
    if (tpl) applyTemplate(tpl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCode(ev.target?.result as string || '')
      const ext = file.name.split('.').pop()?.toLowerCase()
      const langMap: Record<string, LanguageKey> = {
        js: 'javascript', ts: 'typescript', py: 'python',
        html: 'html', css: 'css', json: 'json',
        sql: 'sql', sh: 'bash', go: 'go', rs: 'rust',
      }
      if (ext && langMap[ext]) setLanguage(langMap[ext])
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setCode(text)
    } catch { /* ignore */ }
  }, [])

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [code])

  const exportPNG = useCallback(() => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `code-screenshot-${Date.now()}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }, [])

  const exportSVG = useCallback(() => {
    const svg = generateSVG(renderConfig)
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `code-screenshot-${Date.now()}.svg`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }, [renderConfig])

  const loadSample = useCallback(() => {
    setCode(SAMPLE_CODE[language])
  }, [language])

  const clearCode = useCallback(() => {
    setCode('')
    setTitle('')
  }, [])

  const stats = useMemo(() => ({
    lines: code ? code.split('\n').length : 0,
    chars: code.length,
  }), [code])

  // ============ 样式 ============
  const colors = useMemo(() => {
    if (isDark) {
      return {
        bg: '#0d0d1a',
        bgSecondary: '#141428',
        bgPanel: '#1a1d2e',
        border: 'rgba(124, 108, 240, 0.2)',
        borderStrong: 'rgba(124, 108, 240, 0.35)',
        textPrimary: '#f0f0ff',
        textSecondary: '#9090c0',
        textMuted: '#6a6a8a',
        accent: '#9b8af0',
        accentHover: '#b8a8ff',
        accentBg: 'rgba(155, 138, 240, 0.15)',
        codeBg: '#0a0a18',
        inputBg: 'rgba(10, 10, 24, 0.6)',
      }
    }
    return {
      bg: '#f7f8fa',
      bgSecondary: '#ffffff',
      bgPanel: '#ffffff',
      border: 'rgba(0, 0, 0, 0.08)',
      borderStrong: 'rgba(0, 0, 0, 0.15)',
      textPrimary: '#1f2328',
      textSecondary: '#5f6b7a',
      textMuted: '#8a94a4',
      accent: '#6366f1',
      accentHover: '#4f46e5',
      accentBg: 'rgba(99, 102, 241, 0.1)',
      codeBg: '#1e222c',
      inputBg: '#f0f2f5',
    }
  }, [isDark])

  const s = {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      background: colors.bg,
      color: colors.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
      fontSize: 13,
      overflow: 'hidden',
    },
    header: {
      padding: '14px 20px',
      background: colors.bgSecondary,
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexShrink: 0,
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontSize: 17,
      fontWeight: 700,
      background: `linear-gradient(135deg, ${colors.accent}, #ec4899)`,
      WebkitBackgroundClip: 'text' as const,
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text' as const,
    },
    toolbar: {
      padding: '10px 20px',
      background: colors.bgPanel,
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap' as const,
      flexShrink: 0,
    },
    select: {
      padding: '6px 10px',
      border: `1px solid ${colors.borderStrong}`,
      borderRadius: 6,
      background: colors.inputBg,
      color: colors.textPrimary,
      fontSize: 13,
      outline: 'none',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
    btn: (variant: 'primary' | 'secondary' = 'secondary'): React.CSSProperties => ({
      padding: '6px 14px',
      border: variant === 'primary' ? 'none' : `1px solid ${colors.borderStrong}`,
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 12.5,
      fontWeight: 500,
      background: variant === 'primary' ? colors.accent : 'transparent',
      color: variant === 'primary' ? '#fff' : colors.textPrimary,
      transition: 'all 0.2s',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontFamily: 'inherit',
    }),
    divider: {
      width: 1,
      height: 20,
      background: colors.border,
    },
    mainArea: {
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
      minHeight: 0,
    },
    leftPanel: {
      width: '45%',
      display: 'flex',
      flexDirection: 'column' as const,
      minWidth: 0,
      borderRight: `1px solid ${colors.border}`,
    },
    rightPanel: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      minWidth: 0,
      background: backgroundMode === 'transparent'
        ? 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 20px 20px'
        : colors.bgSecondary,
    },
    panelHeader: {
      padding: '8px 14px',
      background: colors.bgSecondary,
      borderBottom: `1px solid ${colors.border}`,
      fontSize: 11,
      fontWeight: 600,
      color: colors.textSecondary,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.06em',
    },
    textarea: {
      flex: 1,
      padding: 14,
      border: 'none',
      resize: 'none' as const,
      fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.65,
      background: colors.codeBg,
      color: '#cdd6f4',
      outline: 'none',
      tabSize: 2,
      spellCheck: false,
    },
    input: {
      padding: '6px 10px',
      border: `1px solid ${colors.borderStrong}`,
      borderRadius: 6,
      background: colors.inputBg,
      color: colors.textPrimary,
      fontSize: 13,
      outline: 'none',
      fontFamily: 'inherit',
    },
    iconBtn: (active?: boolean): React.CSSProperties => ({
      padding: '7px',
      border: `1px solid ${active ? colors.accent : colors.border}`,
      borderRadius: 8,
      background: active ? colors.accentBg : 'transparent',
      color: active ? colors.accent : colors.textSecondary,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
    }),
    statusBar: {
      padding: '6px 20px',
      background: colors.bgSecondary,
      borderTop: `1px solid ${colors.border}`,
      display: 'flex',
      gap: 20,
      fontSize: 11,
      color: colors.textSecondary,
      alignItems: 'center',
      flexShrink: 0,
    },
    langBadge: (color: string): React.CSSProperties => ({
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      background: isDark ? color + '30' : color + '20',
      color,
      border: `1px solid ${color}50`,
      letterSpacing: '0.3px',
    }),
    controlRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      borderBottom: `1px solid ${colors.border}`,
      background: colors.bgPanel,
      flexShrink: 0,
    },
    controlLabel: {
      fontSize: 11,
      fontWeight: 600,
      color: colors.textSecondary,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      minWidth: 70,
    },
    colorInput: {
      width: 36,
      height: 28,
      border: `1px solid ${colors.borderStrong}`,
      borderRadius: 6,
      cursor: 'pointer',
      background: 'transparent',
      padding: 0,
    },
    rangeInput: {
      width: 80,
      cursor: 'pointer',
    },
    toggle: (active: boolean): React.CSSProperties => ({
      padding: '4px 10px',
      border: `1px solid ${active ? colors.accent : colors.borderStrong}`,
      borderRadius: 6,
      background: active ? colors.accentBg : 'transparent',
      color: active ? colors.accent : colors.textSecondary,
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: active ? 600 : 400,
      transition: 'all 0.15s',
    }),
  }

  return (
    <div style={s.container}>
      {/* ====== 顶部标题栏 ====== */}
      <div style={s.header}>
        <div style={s.title}>
          <Sparkles size={20} />
          <span>CodeScreenshotter</span>
        </div>
        <span style={{ fontSize: 12, color: colors.textSecondary }}>
          代码截图生成器
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={s.iconBtn(showPreview)} onClick={() => setShowPreview(!showPreview)} title={showPreview ? '隐藏预览' : '显示预览'}>
            {showPreview ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      </div>

      {/* ====== 工具栏 ====== */}
      <div style={s.toolbar}>
        <select value={language} onChange={e => setLanguage(e.target.value as LanguageKey)} style={s.select}>
          {LANGUAGES.map(l => (<option key={l.key} value={l.key}>{l.icon} {l.label}</option>))}
        </select>
        <div style={s.divider} />
        <select value={themeKey} onChange={e => setThemeKey(e.target.value as ThemeKey)} style={s.select}>
          {THEMES.map(t => (<option key={t.key} value={t.key}>{t.label}主题</option>))}
        </select>
        <div style={s.divider} />
        <select value={fontKey} onChange={e => setFontKey(e.target.value as FontKey)} style={s.select}>
          {FONTS.map(f => (<option key={f.key} value={f.key}>{f.label}</option>))}
        </select>
        <div style={s.divider} />
        <input type="text" placeholder="窗口标题（可选）..." value={title} onChange={e => setTitle(e.target.value)} style={{ ...s.input, width: 180 }} />
        <div style={{ flex: 1 }} />
        <button style={s.btn()} onClick={() => fileInputRef.current?.click()}>
          📂 上传文件
        </button>
        <input ref={fileInputRef} type="file" accept=".js,.ts,.py,.html,.css,.json,.sql,.sh,.go,.rs,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
        <button style={s.btn()} onClick={handlePaste}>📋 粘贴</button>
        <button style={s.btn()} onClick={loadSample}>
          <RotateCcw size={13} /> 示例
        </button>
        <button style={s.btn('primary')} onClick={handleCopyCode}>
          <Copy size={13} /> {copied ? '已复制' : '复制'}
        </button>
        <div style={{ position: 'relative' }}>
          <button style={s.btn('primary')} onClick={() => setShowExportMenu(!showExportMenu)}>
            <Image size={13} /> 导出 ▾
          </button>
          {showExportMenu && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 6px)', right: 0,
              background: colors.bgPanel, border: `1px solid ${colors.borderStrong}`,
              borderRadius: 8, padding: 6, display: 'flex', flexDirection: 'column',
              gap: 4, minWidth: 160, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}>
              <button onClick={() => { exportPNG(); setShowExportMenu(false) }} style={{
                padding: '8px 12px', border: 'none', borderRadius: 6,
                background: 'transparent', color: colors.textPrimary,
                cursor: 'pointer', fontSize: 13, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                🖼️ 导出为 PNG 图片
              </button>
              <button onClick={() => { exportSVG(); setShowExportMenu(false) }} style={{
                padding: '8px 12px', border: 'none', borderRadius: 6,
                background: 'transparent', color: colors.textPrimary,
                cursor: 'pointer', fontSize: 13, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                📐 导出为 SVG 矢量图
              </button>
            </div>
          )}
        </div>
        <button style={s.btn()} onClick={clearCode}>🗑️ 清空</button>
      </div>

      {/* ====== 预设模板 ====== */}
      <div style={{ ...s.controlRow, padding: '8px 20px' }}>
        <span style={s.controlLabel}><Palette size={11} style={{ display: 'inline', marginRight: 4 }} />模板</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {TEMPLATES.map(tpl => (
            <button key={tpl.key} style={s.toggle(templateKey === tpl.key)} onClick={() => applyTemplate(tpl)}>
              {tpl.label}
            </button>
          ))}
        </div>
        <div style={s.divider} />
        <span style={s.controlLabel}><Type size={11} style={{ display: 'inline', marginRight: 4 }} />外观</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.textSecondary }}>
          字号
          <input type="range" min={10} max={24} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={s.rangeInput} />
          <span style={{ color: colors.textPrimary, minWidth: 24 }}>{fontSize}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.textSecondary }}>
          内边距
          <input type="range" min={8} max={80} value={padding} onChange={e => setPadding(Number(e.target.value))} style={s.rangeInput} />
          <span style={{ color: colors.textPrimary, minWidth: 24 }}>{padding}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.textSecondary }}>
          圆角
          <input type="range" min={0} max={32} value={borderRadius} onChange={e => setBorderRadius(Number(e.target.value))} style={s.rangeInput} />
          <span style={{ color: colors.textPrimary, minWidth: 24 }}>{borderRadius}</span>
        </label>
        <div style={s.divider} />
        <span style={s.controlLabel}>背景</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['solid', 'gradient', 'transparent'] as BackgroundMode[]).map(mode => (
            <button key={mode} style={s.toggle(backgroundMode === mode)} onClick={() => setBackgroundMode(mode)}>
              {mode === 'solid' ? '纯色' : mode === 'gradient' ? '渐变' : '透明'}
            </button>
          ))}
        </div>
        {backgroundMode === 'solid' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="color" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} style={s.colorInput} />
            <span style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'monospace' }}>{backgroundColor}</span>
          </div>
        )}
        {backgroundMode === 'gradient' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="color" value={gradientFrom} onChange={e => setGradientFrom(e.target.value)} style={s.colorInput} />
            <span style={{ fontSize: 12, color: colors.textSecondary }}>→</span>
            <input type="color" value={gradientTo} onChange={e => setGradientTo(e.target.value)} style={s.colorInput} />
          </div>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={s.toggle(showLineNumbers)} onClick={() => setShowLineNumbers(!showLineNumbers)}>
            # 行号
          </button>
          <button style={s.toggle(showWindowControls)} onClick={() => setShowWindowControls(!showWindowControls)}>
            <Monitor size={12} style={{ display: 'inline', marginRight: 4 }} /> 窗口
          </button>
          <button style={s.toggle(showShadow)} onClick={() => setShowShadow(!showShadow)}>
            阴影
          </button>
        </div>
      </div>

      {/* ====== 主内容区 ====== */}
      <div style={s.mainArea}>
        {/* 左侧编辑区 */}
        <div style={s.leftPanel}>
          <div style={s.panelHeader}>
            <span style={s.langBadge(currentLang.color)}>{currentLang.icon} {currentLang.label}</span>
            <span>代码编辑器</span>
            <div style={{ flex: 1 }} />
            <span style={{ color: colors.textMuted }}>{stats.lines} 行 · {stats.chars} 字符</span>
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder={`在此输入或粘贴 ${currentLang.label} 代码...`}
            spellCheck={false}
            style={s.textarea}
          />
        </div>

        {/* 右侧预览区 */}
        {showPreview && (
          <div style={s.rightPanel}>
            <div style={s.panelHeader}>
              <Image size={13} />
              <span>预览效果（Canvas 实时渲染）</span>
              <div style={{ flex: 1 }} />
              <span style={{ color: colors.textMuted }}>{fontKey} · {fontSize}px</span>
            </div>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 30,
              overflow: 'auto',
            }}>
              <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto' }} />
            </div>
          </div>
        )}
      </div>

      {/* ====== 状态栏 ====== */}
      <div style={s.statusBar}>
        <span>{stats.lines} 行</span>
        <span>{stats.chars} 字符</span>
        <span style={s.langBadge(currentLang.color)}>{currentLang.icon} {currentLang.label}</span>
        <span style={{ color: colors.textSecondary }}>{currentTheme.label}主题 · {currentFont.label}</span>
        {backgroundMode === 'gradient' && (
          <span style={{ color: colors.textSecondary }}>渐变: {gradientFrom} → {gradientTo}</span>
        )}
        {backgroundMode === 'solid' && (
          <span style={{ color: colors.textSecondary }}>背景: {backgroundColor}</span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, opacity: 0.6 }}>CodeScreenshotter · Canvas 渲染 · PNG/SVG 导出</span>
      </div>
    </div>
  )
}