import { useState, useCallback, useMemo, useEffect, type CSSProperties } from 'react'
import { marked } from 'marked'
import { SearchIcon, CopyIcon, DownloadIcon, ChevronRightIcon } from '../icons'

// ─── 图标 ──────────────────────────────────────────────────────────
const ChevronRight = ChevronRightIcon
const ChevronDown = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
)

// ─── 类型 ──────────────────────────────────────────────────────────
interface SyntaxExample {
  label: string
  code: string
  preview?: string
}

interface SyntaxCategory {
  id: string
  title: string
  icon: string
  items: SyntaxExample[]
}

// ─── 语法数据 ──────────────────────────────────────────────────────
const SYNTAX_DATA: SyntaxCategory[] = [
  {
    id: 'headings',
    title: '标题',
    icon: 'H',
    items: [
      { label: '一级标题', code: '# 标题文本', preview: '# 标题文本' },
      { label: '二级标题', code: '## 标题文本', preview: '## 标题文本' },
      { label: '三级标题', code: '### 标题文本', preview: '### 标题文本' },
      { label: '四级标题', code: '#### 标题文本', preview: '#### 标题文本' },
      { label: '五级标题', code: '##### 标题文本', preview: '##### 标题文本' },
      { label: '六级标题', code: '###### 标题文本', preview: '###### 标题文本' },
    ],
  },
  {
    id: 'text',
    title: '文本格式',
    icon: 'A',
    items: [
      { label: '加粗', code: '**加粗文本**', preview: '**加粗文本**' },
      { label: '斜体', code: '*斜体文本*', preview: '*斜体文本*' },
      { label: '粗斜体', code: '***粗斜体***', preview: '***粗斜体***' },
      { label: '删除线', code: '~~删除线文本~~', preview: '~~删除线文本~~' },
      { label: '行内代码', code: '`行内代码`', preview: '`行内代码`' },
      { label: '高亮文本', code: '==高亮文本==', preview: '==高亮文本==' },
      { label: '下标', code: 'H~2~O', preview: 'H~2~O' },
      { label: '上标', code: 'X^2^', preview: 'X^2^' },
    ],
  },
  {
    id: 'lists',
    title: '列表',
    icon: '≡',
    items: [
      {
        label: '无序列表',
        code: '- 列表项 1\n- 列表项 2\n- 列表项 3',
        preview: '- 列表项 1\n- 列表项 2\n- 列表项 3',
      },
      {
        label: '有序列表',
        code: '1. 第一项\n2. 第二项\n3. 第三项',
        preview: '1. 第一项\n2. 第二项\n3. 第三项',
      },
      {
        label: '嵌套列表',
        code: '- 一级列表\n  - 二级列表\n    - 三级列表',
        preview: '- 一级列表\n  - 二级列表\n    - 三级列表',
      },
      {
        label: '任务列表',
        code: '- [x] 已完成任务\n- [ ] 待完成任务\n- [ ] 待完成任务',
        preview: '- [x] 已完成任务\n- [ ] 待完成任务\n- [ ] 待完成任务',
      },
    ],
  },
  {
    id: 'links',
    title: '链接和图片',
    icon: '🔗',
    items: [
      { label: '行内链接', code: '[链接文本](https://example.com)', preview: '[链接文本](https://example.com)' },
      { label: '带标题链接', code: '[链接文本](https://example.com "标题")', preview: '[链接文本](https://example.com "标题")' },
      { label: '引用链接', code: '[链接文本][id]\n\n[id]: https://example.com "标题"', preview: '[链接文本][id]\n\n[id]: https://example.com "标题"' },
      { label: '自动链接', code: '<https://example.com>', preview: '<https://example.com>' },
      { label: '图片', code: '![Alt 文本](https://picsum.photos/200/100)', preview: '![Alt 文本](https://picsum.photos/200/100)' },
      { label: '带标题图片', code: '![Alt 文本](https://picsum.photos/200/100 "图片标题")', preview: '![Alt 文本](https://picsum.photos/200/100 "图片标题")' },
    ],
  },
  {
    id: 'code',
    title: '代码块',
    icon: '<>',
    items: [
      {
        label: 'JavaScript',
        code: '```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));\n```',
        preview: '```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));\n```',
      },
      {
        label: 'Python',
        code: '```python\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))\n```',
        preview: '```python\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))\n```',
      },
      {
        label: 'TypeScript',
        code: '```typescript\ninterface User {\n  name: string;\n  age: number;\n}\n\nconst user: User = { name: "Alice", age: 30 };\n```',
        preview: '```typescript\ninterface User {\n  name: string;\n  age: number;\n}\n\nconst user: User = { name: "Alice", age: 30 };\n```',
      },
      {
        label: 'HTML',
        code: '```html\n<!DOCTYPE html>\n<html>\n<head>\n  <title>示例</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>\n```',
        preview: '```html\n<!DOCTYPE html>\n<html>\n<head>\n  <title>示例</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>\n```',
      },
      {
        label: 'CSS',
        code: '```css\n.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n}\n```',
        preview: '```css\n.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n}\n```',
      },
    ],
  },
  {
    id: 'tables',
    title: '表格',
    icon: '▦',
    items: [
      {
        label: '基本表格',
        code: '| 姓名 | 年龄 | 城市 |\n|------|------|------|\n| 张三 | 25   | 北京 |\n| 李四 | 30   | 上海 |\n| 王五 | 28   | 深圳 |',
        preview: '| 姓名 | 年龄 | 城市 |\n|------|------|------|\n| 张三 | 25   | 北京 |\n| 李四 | 30   | 上海 |\n| 王五 | 28   | 深圳 |',
      },
      {
        label: '对齐方式',
        code: '| 左对齐 | 居中对齐 | 右对齐 |\n|:-------|:-------:|-------:|\n| 左     |    中    |     右 |\n| left   | center  |  right |',
        preview: '| 左对齐 | 居中对齐 | 右对齐 |\n|:-------|:-------:|-------:|\n| 左     |    中    |     右 |\n| left   | center  |  right |',
      },
    ],
  },
  {
    id: 'quotes',
    title: '引用',
    icon: '❝',
    items: [
      {
        label: '单行引用',
        code: '> 这是一段引用文字。',
        preview: '> 这是一段引用文字。',
      },
      {
        label: '多行引用',
        code: '> 第一行引用\n> 第二行引用\n> 第三行引用',
        preview: '> 第一行引用\n> 第二行引用\n> 第三行引用',
      },
      {
        label: '嵌套引用',
        code: '> 外层引用\n> > 内层引用\n> > > 更深层引用',
        preview: '> 外层引用\n> > 内层引用\n> > > 更深层引用',
      },
      {
        label: '引用中的内容',
        code: '> **重要提示**\n> \n> 这是引用中的段落。\n> \n> - 引用中的列表\n> - 另一个列表项',
        preview: '> **重要提示**\n> \n> 这是引用中的段落。\n> \n> - 引用中的列表\n> - 另一个列表项',
      },
    ],
  },
  {
    id: 'hr',
    title: '分割线',
    icon: '—',
    items: [
      { label: '横线分割', code: '---', preview: '---' },
      { label: '星号分割', code: '***', preview: '***' },
      { label: '下划线分割', code: '___', preview: '___' },
    ],
  },
  {
    id: 'footnotes',
    title: '脚注',
    icon: '¹',
    items: [
      {
        label: '基本脚注',
        code: '这是一段带有脚注的文本[^1]。\n\n[^1]: 这是脚注的内容。',
        preview: '这是一段带有脚注的文本[^1]。\n\n[^1]: 这是脚注的内容。',
      },
      {
        label: '内联脚注',
        code: '这是一段带有内联脚注的文本^[这是内联脚注内容]。',
        preview: '这是一段带有内联脚注的文本^[这是内联脚注内容]。',
      },
    ],
  },
  {
    id: 'math',
    title: '数学公式',
    icon: '∑',
    items: [
      {
        label: '行内公式',
        code: '质能方程 $E=mc^2$ 是爱因斯坦提出的著名公式。',
        preview: '质能方程 $E=mc^2$ 是爱因斯坦提出的著名公式。',
      },
      {
        label: '行间公式',
        code: '$$\n\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}\n$$',
        preview: '$$\n\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}\n$$',
      },
      {
        label: '求和公式',
        code: '$$\n\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}\n$$',
        preview: '$$\n\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}\n$$',
      },
      {
        label: '矩阵',
        code: '$$\nA = \\begin{pmatrix}\n  a_{11} & a_{12} \\\\\n  a_{21} & a_{22}\n\\end{pmatrix}\n$$',
        preview: '$$\nA = \\begin{pmatrix}\n  a_{11} & a_{12} \\\\\n  a_{21} & a_{22}\n\\end{pmatrix}\n$$',
      },
    ],
  },
  {
    id: 'mermaid',
    title: 'Mermaid 图表',
    icon: '◇',
    items: [
      {
        label: '流程图',
        code: '```mermaid\ngraph TD\n    A[开始] --> B{条件判断}\n    B -->|是| C[执行操作A]\n    B -->|否| D[执行操作B]\n    C --> E[结束]\n    D --> E\n```',
      },
      {
        label: '时序图',
        code: '```mermaid\nsequenceDiagram\n    participant 用户\n    participant 前端\n    participant 后端\n    用户->>前端: 发送请求\n    前端->>后端: API 请求\n    后端-->>前端: 返回数据\n    前端-->>用户: 显示结果\n```',
      },
      {
        label: '甘特图',
        code: '```mermaid\ngantt\n    title 项目计划\n    section 设计阶段\n    需求分析    :a1, 2024-01-01, 7d\n    UI设计      :a2, after a1, 5d\n    section 开发阶段\n    前端开发    :b1, after a2, 10d\n    后端开发    :b2, after a2, 12d\n    section 测试阶段\n    集成测试    :c1, after b2, 5d\n```',
      },
      {
        label: '类图',
        code: '```mermaid\nclassDiagram\n    class Animal {\n        +String name\n        +int age\n        +makeSound()\n    }\n    class Dog {\n        +fetch()\n    }\n    class Cat {\n        +purr()\n    }\n    Animal <|-- Dog\n    Animal <|-- Cat\n```',
      },
      {
        label: '饼图',
        code: '```mermaid\npie\n    title 项目时间分配\n    "编码" : 40\n    "设计" : 20\n    "测试" : 20\n    "文档" : 10\n    "会议" : 10\n```',
      },
    ],
  },
]

// ─── 默认编辑内容 ──────────────────────────────────────────────────
const DEFAULT_CONTENT = `# Markdown 速查表

欢迎使用 **Markdown 速查表**！点击左侧语法项，示例将自动插入此处。

## 快速示例

### 文本格式
- **加粗文本** 和 *斜体文本*
- ~~删除线~~ 和 \`行内代码\`

### 列表
1. 第一项
2. 第二项
3. 第三项

### 代码块

\`\`\`javascript
console.log('Hello, Markdown!');
\`\`\`

### 表格

| 功能 | 说明 | 状态 |
|------|------|------|
| 标题 | h1-h6 | ✅ |
| 格式 | 加粗/斜体 | ✅ |
| 代码 | 代码块 | ✅ |

### 引用

> 学而不思则罔，思而不学则殆。
> ——孔子

---

开始编写你的 Markdown 内容吧！
`

// ─── 组件 ──────────────────────────────────────────────────────────
export default function MarkdownCheatSheet() {
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [layoutMode, setLayoutMode] = useState<'split' | 'horizontal' | 'preview-only' | 'edit-only'>('split')
  const [fontSize, setFontSize] = useState(14)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [previewFontSize, setPreviewFontSize] = useState(15)

  // 配置 marked
  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
    })
  }, [])

  // 搜索过滤
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return SYNTAX_DATA
    const q = searchQuery.toLowerCase()
    return SYNTAX_DATA.map(cat => ({
      ...cat,
      items: cat.items.filter(
        item =>
          item.label.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          cat.title.toLowerCase().includes(q),
      ),
    })).filter(cat => cat.items.length > 0)
  }, [searchQuery])

  // 折叠切换
  const toggleCollapse = useCallback((id: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // 复制语法
  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }, [])

  // 插入语法到编辑区
  const insertSyntax = useCallback((code: string) => {
    setContent(prev => prev + '\n\n' + code)
  }, [])

  // 导出 HTML
  const exportHTML = useCallback(() => {
    let html: string
    try {
      html = marked.parse(content) as string
    } catch {
      html = '<p>渲染错误</p>'
    }
    const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown 导出</title>
  <style>
    body { max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; }
    h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; }
    h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 6px; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-family: 'SF Mono', Monaco, monospace; font-size: 0.9em; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; padding: 0; color: inherit; }
    blockquote { border-left: 4px solid #ddd; margin: 16px 0; padding: 8px 16px; color: #666; background: #f9f9f9; border-radius: 0 8px 8px 0; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f5f5f5; font-weight: 600; }
    tr:nth-child(even) { background: #fafafa; }
    img { max-width: 100%; border-radius: 8px; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    hr { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    ul, ol { padding-left: 24px; }
    li { margin: 4px 0; }
  </style>
</head>
<body>
${html}
</body>
</html>`
    const blob = new Blob([fullHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'markdown-export.html'
    a.click()
    URL.revokeObjectURL(url)
  }, [content])

  // 预览渲染
  const renderedHTML = useMemo(() => {
    try {
      return marked.parse(content) as string
    } catch {
      return '<p style="color:#f44;">渲染错误</p>'
    }
  }, [content])

  // ─── 样式常量 ──────────────────────────────────────────────────
  const vars = {
    bgPrimary: 'var(--bg-primary, #0f0f1a)',
    bgSecondary: 'var(--bg-secondary, #1a1a2e)',
    bgTertiary: 'var(--bg-tertiary, #16213e)',
    textPrimary: 'var(--text-primary, #e0e0e8)',
    textSecondary: 'var(--text-secondary, #9090a4)',
    accent: 'var(--accent, #7c6cf0)',
    border: 'var(--window-border, rgba(255,255,255,0.08))',
    radius: 'var(--window-radius, 12px)',
  }

  const toolbarBtnStyle = (active = false): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '5px 10px',
    border: `1px solid ${active ? vars.accent : vars.border}`,
    borderRadius: 6,
    background: active ? `${vars.accent}22` : 'transparent',
    color: active ? vars.accent : vars.textSecondary,
    cursor: 'pointer',
    fontSize: 12,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  })

  // ─── 渲染 ──────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: vars.bgPrimary,
        color: vars.textPrimary,
        fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif`,
        overflow: 'hidden',
      }}
    >
      {/* ── 顶部工具栏 ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          borderBottom: `1px solid ${vars.border}`,
          background: vars.bgSecondary,
          flexShrink: 0,
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: vars.accent }}>Markdown 速查表</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* 布局切换 */}
          <div style={{ display: 'flex', gap: 4, padding: '2px', background: vars.bgPrimary, borderRadius: 8 }}>
            <button
              style={toolbarBtnStyle(layoutMode === 'horizontal')}
              onClick={() => setLayoutMode('horizontal')}
              title="上下分栏"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
              <span>上下</span>
            </button>
            <button
              style={toolbarBtnStyle(layoutMode === 'split')}
              onClick={() => setLayoutMode('split')}
              title="左右分栏"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
              <span>左右</span>
            </button>
            <button
              style={toolbarBtnStyle(layoutMode === 'edit-only')}
              onClick={() => setLayoutMode('edit-only')}
              title="仅编辑"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              <span>编辑</span>
            </button>
            <button
              style={toolbarBtnStyle(layoutMode === 'preview-only')}
              onClick={() => setLayoutMode('preview-only')}
              title="仅预览"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>预览</span>
            </button>
          </div>

          {/* 字号调节 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', background: vars.bgPrimary, borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: vars.textSecondary }}>字号</span>
            <button
              style={{ ...toolbarBtnStyle(), padding: '3px 6px' }}
              onClick={() => setFontSize(s => Math.max(11, s - 1))}
              title="减小字号"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <span style={{ fontSize: 12, minWidth: 28, textAlign: 'center', color: vars.textPrimary }}>{fontSize}</span>
            <button
              style={{ ...toolbarBtnStyle(), padding: '3px 6px' }}
              onClick={() => setFontSize(s => Math.min(24, s + 1))}
              title="增大字号"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>

          {/* 导出 */}
          <button
            style={toolbarBtnStyle()}
            onClick={exportHTML}
            title="导出 HTML"
          >
            <DownloadIcon size={14} />
            <span>导出 HTML</span>
          </button>
        </div>
      </div>

      {/* ── 主体区域 ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── 左侧导航面板 ── */}
        <div
          style={{
            width: 280,
            minWidth: 280,
            display: 'flex',
            flexDirection: 'column',
            borderRight: `1px solid ${vars.border}`,
            background: vars.bgSecondary,
            overflow: 'hidden',
          }}
        >
          {/* 搜索框 */}
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${vars.border}` }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                background: vars.bgPrimary,
                borderRadius: 8,
                border: `1px solid ${vars.border}`,
              }}
            >
              <SearchIcon size={14} />
              <input
                type="text"
                placeholder="搜索语法..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: vars.textPrimary,
                  fontSize: 13,
                  fontFamily: 'inherit',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: vars.textSecondary,
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* 分类列表 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
            {filteredCategories.length === 0 && (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: vars.textSecondary, fontSize: 13 }}>
                未找到匹配的语法
              </div>
            )}
            {filteredCategories.map(cat => {
              const isCollapsed = collapsedCategories.has(cat.id)
              return (
                <div key={cat.id} style={{ marginBottom: 2 }}>
                  {/* 分类标题 */}
                  <button
                    onClick={() => toggleCollapse(cat.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      color: vars.textPrimary,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: `${vars.accent}18`,
                        color: vars.accent,
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {cat.icon}
                    </span>
                    <span style={{ flex: 1 }}>{cat.title}</span>
                    <span style={{ display: 'flex', alignItems: 'center', color: vars.textSecondary, transition: 'transform 0.2s', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}>
                      <ChevronRight size={14} />
                    </span>
                  </button>

                  {/* 语法项列表 */}
                  {!isCollapsed && (
                    <div style={{ padding: '0 8px 4px 8px' }}>
                      {cat.items.map((item, idx) => {
                        const itemId = `${cat.id}-${idx}`
                        const isCopied = copiedId === itemId
                        return (
                          <div
                            key={idx}
                            style={{
                              padding: '6px 8px',
                              marginBottom: 2,
                              borderRadius: 6,
                              background: vars.bgPrimary,
                              border: `1px solid ${vars.border}`,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                              ;(e.currentTarget as HTMLDivElement).style.borderColor = `${vars.accent}66`
                              ;(e.currentTarget as HTMLDivElement).style.background = `${vars.bgTertiary}`
                            }}
                            onMouseLeave={e => {
                              ;(e.currentTarget as HTMLDivElement).style.borderColor = vars.border
                              ;(e.currentTarget as HTMLDivElement).style.background = vars.bgPrimary
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, color: vars.textSecondary }}>{item.label}</span>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {/* 复制按钮 */}
                                <button
                                  onClick={e => {
                                    e.stopPropagation()
                                    copyCode(item.code, itemId)
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 22,
                                    height: 22,
                                    borderRadius: 4,
                                    border: 'none',
                                    background: isCopied ? `${vars.accent}33` : 'transparent',
                                    color: isCopied ? vars.accent : vars.textSecondary,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                  }}
                                  title="复制语法"
                                >
                                  {isCopied ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  ) : (
                                    <CopyIcon size={12} />
                                  )}
                                </button>
                                {/* 插入按钮 */}
                                <button
                                  onClick={e => {
                                    e.stopPropagation()
                                    insertSyntax(item.code)
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 22,
                                    height: 22,
                                    borderRadius: 4,
                                    border: 'none',
                                    background: 'transparent',
                                    color: vars.accent,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    lineHeight: 1,
                                    fontWeight: 700,
                                  }}
                                  title="插入到编辑器"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            {/* 语法代码预览 */}
                            <div
                              style={{
                                fontSize: 11,
                                fontFamily: "'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace",
                                color: vars.textSecondary,
                                background: `${vars.bgSecondary}`,
                                padding: '4px 6px',
                                borderRadius: 4,
                                lineHeight: 1.4,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                                maxHeight: 48,
                                overflow: 'hidden',
                              }}
                              onClick={() => {
                                copyCode(item.code, itemId)
                              }}
                            >
                              {item.code}
                            </div>
                            {/* 渲染效果预览 */}
                            {item.preview && (
                              <div
                                style={{
                                  marginTop: 4,
                                  padding: '4px 6px',
                                  borderRadius: 4,
                                  fontSize: 11,
                                  lineHeight: 1.4,
                                  color: vars.textPrimary,
                                  background: `${vars.bgTertiary}`,
                                  maxHeight: 60,
                                  overflow: 'hidden',
                                }}
                                dangerouslySetInnerHTML={{
                                  __html: (() => {
                                    try { return marked.parse(item.preview) as string } catch { return '' }
                                  })(),
                                }}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 右侧主区域 ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 编辑区 + 预览区 */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: layoutMode === 'horizontal' ? 'column' : 'row',
              overflow: 'hidden',
            }}
          >
            {/* 编辑区 */}
            {(layoutMode === 'split' || layoutMode === 'horizontal' || layoutMode === 'edit-only') && (
              <div
                style={{
                  flex: layoutMode === 'edit-only' ? 1 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  borderBottom: layoutMode === 'horizontal' ? `1px solid ${vars.border}` : 'none',
                  borderRight: layoutMode === 'split' ? `1px solid ${vars.border}` : 'none',
                }}
              >
                <div
                  style={{
                    padding: '6px 12px',
                    borderBottom: `1px solid ${vars.border}`,
                    fontSize: 11,
                    color: vars.textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: vars.bgTertiary,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  编辑
                </div>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  style={{
                    flex: 1,
                    width: '100%',
                    padding: '16px',
                    background: vars.bgPrimary,
                    color: vars.textPrimary,
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: "'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace",
                    fontSize,
                    lineHeight: 1.6,
                    tabSize: 2,
                    boxSizing: 'border-box',
                  }}
                  spellCheck={false}
                  placeholder="在此输入 Markdown 内容..."
                />
              </div>
            )}

            {/* 预览区 */}
            {(layoutMode === 'split' || layoutMode === 'horizontal' || layoutMode === 'preview-only') && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '6px 12px',
                    borderBottom: `1px solid ${vars.border}`,
                    fontSize: 11,
                    color: vars.textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: vars.bgTertiary,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    预览
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      style={{ ...toolbarBtnStyle(), padding: '2px 6px' }}
                      onClick={() => setPreviewFontSize(s => Math.max(12, s - 1))}
                      title="减小预览字号"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                    <span style={{ fontSize: 11, minWidth: 24, textAlign: 'center' }}>{previewFontSize}px</span>
                    <button
                      style={{ ...toolbarBtnStyle(), padding: '2px 6px' }}
                      onClick={() => setPreviewFontSize(s => Math.min(24, s + 1))}
                      title="增大预览字号"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                  </div>
                </div>
                <div
                  className="md-cheatsheet-preview"
                  style={{
                    flex: 1,
                    padding: '16px 24px',
                    overflowY: 'auto',
                    background: vars.bgPrimary,
                    fontSize: previewFontSize,
                    lineHeight: 1.7,
                  }}
                  dangerouslySetInnerHTML={{ __html: renderedHTML }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 预览区 Markdown 样式 ── */}
      <style>{`
        .md-cheatsheet-preview h1 {
          font-size: 1.8em;
          font-weight: 700;
          margin: 0 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid ${vars.border};
          color: ${vars.textPrimary};
        }
        .md-cheatsheet-preview h2 {
          font-size: 1.4em;
          font-weight: 600;
          margin: 24px 0 12px 0;
          padding-bottom: 6px;
          border-bottom: 1px solid ${vars.border};
          color: ${vars.textPrimary};
        }
        .md-cheatsheet-preview h3 {
          font-size: 1.2em;
          font-weight: 600;
          margin: 20px 0 10px 0;
          color: ${vars.textPrimary};
        }
        .md-cheatsheet-preview h4,
        .md-cheatsheet-preview h5,
        .md-cheatsheet-preview h6 {
          font-size: 1em;
          font-weight: 600;
          margin: 16px 0 8px 0;
          color: ${vars.textPrimary};
        }
        .md-cheatsheet-preview p {
          margin: 0 0 12px 0;
          color: ${vars.textPrimary};
        }
        .md-cheatsheet-preview a {
          color: ${vars.accent};
          text-decoration: none;
        }
        .md-cheatsheet-preview a:hover {
          text-decoration: underline;
        }
        .md-cheatsheet-preview strong {
          font-weight: 700;
          color: ${vars.textPrimary};
        }
        .md-cheatsheet-preview em {
          font-style: italic;
        }
        .md-cheatsheet-preview del {
          text-decoration: line-through;
          color: var(--text-secondary, #9090a4);
        }
        .md-cheatsheet-preview code {
          background: ${vars.bgTertiary};
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
          font-size: 0.88em;
          color: #e06c75;
        }
        .md-cheatsheet-preview pre {
          background: #1a1a2e;
          border: 1px solid ${vars.border};
          border-radius: 8px;
          padding: 14px 16px;
          overflow-x: auto;
          margin: 12px 0;
        }
        .md-cheatsheet-preview pre code {
          background: none;
          padding: 0;
          color: #abb2bf;
          font-size: 0.92em;
          line-height: 1.5;
        }
        .md-cheatsheet-preview blockquote {
          border-left: 4px solid ${vars.accent};
          margin: 12px 0;
          padding: 8px 16px;
          background: ${vars.bgSecondary};
          border-radius: 0 8px 8px 0;
          color: var(--text-secondary, #9090a4);
        }
        .md-cheatsheet-preview blockquote p {
          color: inherit;
          margin: 4px 0;
        }
        .md-cheatsheet-preview ul, .md-cheatsheet-preview ol {
          padding-left: 24px;
          margin: 8px 0;
        }
        .md-cheatsheet-preview li {
          margin: 4px 0;
          color: ${vars.textPrimary};
        }
        .md-cheatsheet-preview li input[type="checkbox"] {
          margin-right: 6px;
          accent-color: ${vars.accent};
        }
        .md-cheatsheet-preview table {
          border-collapse: collapse;
          width: 100%;
          margin: 12px 0;
          border: 1px solid ${vars.border};
          border-radius: 8px;
          overflow: hidden;
        }
        .md-cheatsheet-preview th {
          background: ${vars.bgTertiary};
          padding: 8px 12px;
          border: 1px solid ${vars.border};
          font-weight: 600;
          text-align: left;
          color: ${vars.textPrimary};
        }
        .md-cheatsheet-preview td {
          padding: 8px 12px;
          border: 1px solid ${vars.border};
          color: ${vars.textPrimary};
        }
        .md-cheatsheet-preview tr:nth-child(even) {
          background: ${vars.bgSecondary};
        }
        .md-cheatsheet-preview hr {
          border: none;
          border-top: 1px solid ${vars.border};
          margin: 24px 0;
        }
        .md-cheatsheet-preview img {
          max-width: 100%;
          border-radius: 8px;
          margin: 8px 0;
        }
        .md-cheatsheet-preview sup {
          font-size: 0.75em;
        }
        .md-cheatsheet-preview sub {
          font-size: 0.75em;
        }

        /* 滚动条美化 */
        .md-cheatsheet-preview::-webkit-scrollbar,
        textarea::-webkit-scrollbar {
          width: 6px;
        }
        .md-cheatsheet-preview::-webkit-scrollbar-track,
        textarea::-webkit-scrollbar-track {
          background: transparent;
        }
        .md-cheatsheet-preview::-webkit-scrollbar-thumb,
        textarea::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
          border-radius: 3px;
        }
        .md-cheatsheet-preview::-webkit-scrollbar-thumb:hover,
        textarea::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  )
}
