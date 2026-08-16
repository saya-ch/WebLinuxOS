import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { marked } from 'marked'
import {
  FileText,
  Download,
  Printer,
  Eye,
  EyeOff,
  Palette,
  Settings,
  BookOpen,
  Clipboard,
  Check,
  RotateCcw,
} from 'lucide-react'

type ThemeId = 'classic' | 'modern' | 'minimal'
type PaperSize = 'A4' | 'Letter' | 'Legal' | 'A3'

interface Theme {
  id: ThemeId
  name: string
  description: string
  preview: string
  styles: string
}

interface PageSettings {
  paperSize: PaperSize
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
}

interface Template {
  id: string
  name: string
  icon: string
  content: string
}

const THEMES: Theme[] = [
  {
    id: 'classic',
    name: '经典',
    description: '传统衬线风格，适合正式文档',
    preview: '衬线',
    styles: `
  body { font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.8; color: #2c3e50; max-width: 800px; margin: 0 auto; padding: 60px 50px; background: #ffffff; }
  h1 { font-size: 2.2em; font-weight: 700; text-align: center; margin-bottom: 30px; letter-spacing: 0.02em; border-bottom: 3px double #2c3e50; padding-bottom: 15px; }
  h2 { font-size: 1.6em; font-weight: 700; margin-top: 40px; color: #1a252f; border-bottom: 1px solid #bdc3c7; padding-bottom: 8px; }
  h3 { font-size: 1.3em; font-weight: 600; color: #34495e; }
  h4 { font-size: 1.1em; font-style: italic; color: #566573; }
  p { margin: 14px 0; text-align: justify; }
  a { color: #8e44ad; text-decoration: none; border-bottom: 1px solid #8e44ad; }
  a:hover { background: #8e44ad; color: white; }
  code { background: #f4f6f7; padding: 2px 8px; border-radius: 3px; font-size: 0.9em; font-family: 'Courier New', monospace; }
  pre { background: #2c3e50; color: #ecf0f1; padding: 20px; border-radius: 6px; overflow: auto; line-height: 1.5; }
  pre code { background: transparent; color: inherit; padding: 0; }
  blockquote { border-left: 4px double #8e44ad; margin: 24px 0; padding: 10px 24px; font-style: italic; color: #555; background: #fafafa; }
  blockquote p { margin: 6px 0; }
  table { border-collapse: collapse; width: 100%; margin: 24px 0; }
  th { background: #2c3e50; color: white; padding: 10px 14px; text-align: left; font-weight: 600; }
  td { border: 1px solid #bdc3c7; padding: 10px 14px; }
  tr:nth-child(even) td { background: #f8f9fa; }
  img { max-width: 100%; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  hr { border: none; border-top: 2px double #2c3e50; margin: 36px 0; }
  ul, ol { padding-left: 2em; }
  li { margin: 6px 0; }
  ul li { list-style: disc; }
  ol li { list-style: decimal; }
  strong { font-weight: 700; color: #1a252f; }
  em { font-style: italic; color: #566573; }
  `,
  },
  {
    id: 'modern',
    name: '现代',
    description: '简洁现代风格，适合商业文档',
    preview: '无衬线',
    styles: `
  body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; line-height: 1.7; color: #2d3436; max-width: 800px; margin: 0 auto; padding: 50px 60px; background: #ffffff; }
  h1 { font-size: 2.4em; font-weight: 800; margin-bottom: 24px; letter-spacing: -0.02em; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  h2 { font-size: 1.7em; font-weight: 700; margin-top: 40px; color: #2d3436; position: relative; padding-left: 16px; }
  h2::before { content: ''; position: absolute; left: 0; top: 10px; bottom: 10px; width: 4px; background: linear-gradient(180deg, #667eea, #764ba2); border-radius: 2px; }
  h3 { font-size: 1.3em; font-weight: 600; color: #636e72; }
  h4 { font-size: 1.1em; font-weight: 600; color: #b2bec3; text-transform: uppercase; letter-spacing: 0.05em; }
  p { margin: 14px 0; }
  a { color: #667eea; text-decoration: none; border-bottom: 2px solid transparent; transition: border-color 0.2s; }
  a:hover { border-bottom-color: #667eea; }
  code { background: #f1f2f6; padding: 3px 10px; border-radius: 6px; font-size: 0.9em; color: #667eea; font-family: 'JetBrains Mono', 'Fira Code', monospace; }
  pre { background: #1e1e2e; color: #cdd6f4; padding: 24px; border-radius: 12px; overflow: auto; box-shadow: 0 4px 16px rgba(0,0,0,0.1); line-height: 1.6; }
  pre code { background: transparent; color: inherit; padding: 0; }
  blockquote { border-left: 4px solid #667eea; background: #f8f9ff; padding: 16px 24px; margin: 24px 0; border-radius: 0 12px 12px 0; }
  blockquote p { margin: 6px 0; color: #636e72; }
  table { border-collapse: collapse; width: 100%; margin: 24px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  th { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px 16px; text-align: left; font-weight: 600; }
  td { border: 1px solid #dfe6e9; padding: 12px 16px; }
  tr:nth-child(even) td { background: #f8f9ff; }
  img { max-width: 100%; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
  hr { border: none; height: 3px; background: linear-gradient(90deg, #667eea, #764ba2, #667eea); border-radius: 2px; margin: 36px 0; }
  ul, ol { padding-left: 1.8em; }
  li { margin: 6px 0; }
  ul li { list-style: none; position: relative; }
  ul li::before { content: '▸'; color: #667eea; position: absolute; left: -1.3em; font-weight: bold; }
  ol li { list-style: none; counter-increment: item; position: relative; }
  ol li::before { content: counter(item); background: #667eea; color: white; border-radius: 50%; width: 1.4em; height: 1.4em; display: inline-flex; align-items: center; justify-content: center; font-size: 0.85em; margin-right: 0.5em; }
  ol { counter-reset: item; }
  strong { font-weight: 700; color: #2d3436; }
  em { font-style: italic; color: #636e72; }
  `,
  },
  {
    id: 'minimal',
    name: '极简',
    description: '极简风格，干净利落',
    preview: '极简',
    styles: `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 720px; margin: 0 auto; padding: 70px 40px; background: #ffffff; }
  h1 { font-size: 2em; font-weight: 600; margin-bottom: 8px; letter-spacing: -0.03em; }
  h1::after { content: ''; display: block; width: 40px; height: 3px; background: #1a1a1a; margin-top: 16px; }
  h2 { font-size: 1.4em; font-weight: 600; margin-top: 48px; color: #1a1a1a; }
  h3 { font-size: 1.2em; font-weight: 500; color: #555; }
  h4 { font-size: 1em; font-weight: 500; color: #999; }
  p { margin: 16px 0; color: #333; }
  a { color: #1a1a1a; text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px; }
  a:hover { color: #666; }
  code { background: #f5f5f5; padding: 1px 6px; border-radius: 3px; font-size: 0.9em; color: #666; font-family: 'SF Mono', 'Menlo', monospace; }
  pre { background: #fafafa; color: #333; padding: 20px; border-radius: 6px; overflow: auto; border: 1px solid #eee; line-height: 1.5; }
  pre code { background: transparent; color: inherit; padding: 0; }
  blockquote { border-left: 3px solid #1a1a1a; margin: 24px 0; padding: 8px 20px; color: #555; }
  blockquote p { margin: 4px 0; }
  table { border-collapse: collapse; width: 100%; margin: 24px 0; }
  th { background: transparent; color: #1a1a1a; padding: 8px 0; text-align: left; font-weight: 600; border-bottom: 2px solid #1a1a1a; }
  td { padding: 8px 0; border-bottom: 1px solid #eee; }
  img { max-width: 100%; display: block; margin: 20px auto; }
  hr { border: none; border-top: 1px solid #e0e0e0; margin: 40px 0; }
  ul, ol { padding-left: 1.4em; }
  li { margin: 4px 0; color: #333; }
  ul li { list-style: disc; }
  ol li { list-style: decimal; }
  strong { font-weight: 600; color: #1a1a1a; }
  em { font-style: italic; color: #666; }
  `,
  },
]

const PAPER_SIZES: Record<PaperSize, { width: number; height: number; label: string }> = {
  A4: { width: 210, height: 297, label: 'A4' },
  Letter: { width: 216, height: 279, label: 'Letter' },
  Legal: { width: 216, height: 356, label: 'Legal' },
  A3: { width: 297, height: 420, label: 'A3' },
}

const DEFAULT_MD = `# Markdown 转 PDF 工具

欢迎使用 **Markdown 转 PDF 工具**！这是一个功能强大的文档生成器。

## ✨ 主要功能

- **实时预览** — 边写边看，即时渲染
- **多种主题** — 经典、现代、极简三种精美主题
- **代码高亮** — 自动识别并美化代码块
- **PDF 导出** — 通过浏览器原生打印生成 PDF
- **HTML 导出** — 独立 HTML 文件，便于分享
- **自定义页面** — 支持多种纸张大小和边距设置

## 📝 代码示例

\`\`\`javascript
function greet(name) {
  const message = \`Hello, \${name}!\`;
  console.log(message);
  return message;
}

greet('WebLinuxOS');
\`\`\`

## 📊 表格支持

| 功能 | 状态 | 说明 |
|------|------|------|
| 实时预览 | ✅ | 即时渲染 |
| 主题切换 | ✅ | 3 种主题 |
| PDF 导出 | ✅ | 原生打印 |
| HTML 导出 | ✅ | 独立文件 |

## 💬 引用

> 好的文档是给未来的礼物。—— 佚名

## 📋 列表

### 有序列表
1. 选择主题
2. 编辑内容
3. 预览效果
4. 导出 PDF

### 无序列表
- 支持 Markdown 语法
- 支持代码高亮
- 支持表格
- 支持图片

---

开始创作你的精美文档吧！`

const TEMPLATES: Template[] = [
  {
    id: 'resume',
    name: '简历',
    icon: '📄',
    content: `# 张明

**高级前端工程师**

📧 zhangming@example.com | 📱 +86 138-0000-0000 | 🌐 github.com/zhangming

---

## 个人简介

5 年前端开发经验，专注于 React 生态和用户体验优化。热爱开源，曾参与多个知名开源项目贡献。

## 技术栈

- **核心**: React, TypeScript, Next.js
- **样式**: CSS Modules, Tailwind, Sass
- **构建**: Vite, Webpack, Rollup
- **测试**: Jest, Vitest, Playwright
- **工具**: Git, Docker, CI/CD

## 工作经历

### 某科技有限公司
**高级前端工程师** | 2022.06 - 至今

- 主导公司核心产品前端架构设计与技术选型
- 带领 6 人团队完成从 CRA 到 Vite 的迁移，构建速度提升 300%
- 建立组件库和设计系统，复用率提升 60%
- 推动自动化测试覆盖率从 35% 提升至 85%

### 某互联网公司
**前端工程师** | 2020.03 - 2022.05

- 负责 B 端后台管理系统的开发与维护
- 实现微前端架构，支撑 10+ 业务线独立迭代
- 优化首屏加载时间从 4.2s 降至 1.1s

## 教育背景

**某大学** | 计算机科学与技术 | 本科 | 2016 - 2020

## 开源贡献

- [awesome-react](https://github.com) — 核心维护者
- [toolkit-cli](https://github.com) — 作者，1.2k+ stars`,
  },
  {
    id: 'report',
    name: '报告',
    icon: '📊',
    content: `# 2024 年度技术报告

**报告人**: 技术团队
**日期**: 2024 年 12 月
**版本**: v1.0

---

## 摘要

本年度技术团队在多个关键领域取得了显著进展。本报告将从技术架构、团队建设、项目成果三个维度进行全面回顾和总结。

## 一、技术架构演进

### 1.1 基础设施升级

我们完成了从传统单体架构向微服务架构的全面转型：

- **容器化率**: 从 45% 提升至 98%
- **服务数量**: 新增 23 个微服务实例
- **平均部署时间**: 从 25 分钟缩短至 4 分钟

### 1.2 技术栈更新

| 领域 | 旧技术 | 新技术 | 迁移完成度 |
|------|--------|--------|-----------|
| 前端构建 | Webpack 4 | Vite 5 | 100% |
| 后端框架 | Express | Fastify | 85% |
| 数据库 | MySQL 5.7 | PostgreSQL 16 | 90% |
| 消息队列 | RabbitMQ | NATS JetStream | 75% |

## 二、核心项目成果

### 2.1 数据中台

- 日处理数据量突破 **50TB**
- 实时计算延迟从秒级降至 **100ms 以内**
- 支撑 200+ 业务报表在线查询

### 2.2 AI 平台

\`\`\`python
def predict(user_data):
    model = load_model('recommendation-v3')
    features = preprocess(user_data)
    return model.predict(features)
\`\`\`

- 推荐算法准确率提升 **12.5%**
- 用户点击率增长 **34%**
- 模型推理成本降低 **45%**

## 三、团队建设

- 团队规模: 从 15 人扩展至 28 人
- 人均产出: 提升 40%
- 技术分享: 组织 48 场内部技术讲座

## 四、明年展望

1. 全面拥抱云原生，实现弹性伸缩
2. 加大 AI 基础设施投入
3. 推动开发效能提升 50%

---

> **致谢**: 感谢全体团队成员一年来的辛勤付出！`,
  },
  {
    id: 'notes',
    name: '笔记',
    icon: '📝',
    content: `# 学习笔记

## 2024年12月16日

### 📚 今日学习

#### React Server Components 笔记

RSC 是 React 18 引入的重要特性：

- **服务端渲染**: 组件在服务端执行，直接发送 HTML 到客户端
- **零客户端 JS**: 纯服务端组件不发送任何 JavaScript
- **流式渲染**: 支持逐步加载，提升用户体验

\`\`\`tsx
async function BlogPost({ id }: { id: string }) {
  const post = await db.posts.find(id);
  
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
\`\`\`

### 💡 关键要点

1. RSC 默认是服务端组件，不使用 \`useState\`、\`useEffect\`
2. 需要交互性时，使用 \`"use client"\` 标记为客户端组件
3. 可以在服务端组件中直接访问数据库

### ❓ 待深入研究

- [ ] Server Actions 的最佳实践
- [ ] 与 Next.js App Router 的配合
- [ ] 缓存策略

---

## 2024年12月15日

### 🎯 项目总结

完成了组件库的重构工作：

- 移除了 3 个废弃组件
- 新增了 5 个通用组件
- 单元测试覆盖率达到 92%

### 📖 读书笔记

> 简单性是可靠性的先决条件。—— 《设计数据密集型应用》

---

*本文档由 Markdown 转 PDF 工具自动生成*`,
  },
]

function highlightCode(code: string): string {
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  const patterns: { regex: RegExp; className: string }[] = [
    { regex: /(\/\/.*$|#.*$|\/\*[\s\S]*?\*\/)/gm, className: 'tok-comment' },
    { regex: /\b(function|const|let|var|return|if|else|for|while|import|export|from|class|extends|new|async|await|try|catch|throw|const|typeof|instanceof)\b/g, className: 'tok-keyword' },
    { regex: /\b(string|number|boolean|true|false|null|undefined|void|any)\b/g, className: 'tok-type' },
    { regex: /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g, className: 'tok-string' },
    { regex: /\b(\d+(?:\.\d+)?)\b/g, className: 'tok-number' },
    { regex: /\b(console|log|warn|error|info|table|dir)\b/g, className: 'tok-builtin' },
    { regex: /\b(\w+)(?=\s*\()/g, className: 'tok-function' },
  ]

  let result = escaped
  for (const { regex, className } of patterns) {
    result = result.replace(regex, `<span class="${className}">$1</span>`)
  }

  return result
}

const codeHighlightStyles = `
.tok-comment { color: #6a9955; font-style: italic; }
.tok-keyword { color: #569cd6; font-weight: 600; }
.tok-type { color: #4ec9b0; }
.tok-string { color: #ce9178; }
.tok-number { color: #b5cea8; }
.tok-builtin { color: #4fc1ff; }
.tok-function { color: #dcdcaa; }
`

export default function MarkdownToPDF() {
  const [markdown, setMarkdown] = useState(DEFAULT_MD)
  const [themeId, setThemeId] = useState<ThemeId>('classic')
  const [showPreview, setShowPreview] = useState(true)
  const [title, setTitle] = useState('WebLinuxOS Document')
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [pageSettings, setPageSettings] = useState<PageSettings>({
    paperSize: 'A4',
    marginTop: 20,
    marginRight: 20,
    marginBottom: 20,
    marginLeft: 20,
  })
  const [showTemplates, setShowTemplates] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const currentTheme = useMemo(
    () => THEMES.find((t) => t.id === themeId) || THEMES[0],
    [themeId]
  )

  const htmlContent = useMemo(() => {
    try {
      marked.setOptions({
        breaks: true,
        gfm: true,
      })
      return marked.parse(markdown, { async: false }) as string
    } catch {
      return '<p style="color:red">解析错误</p>'
    }
  }, [markdown])

  const highlightedHtml = useMemo(() => {
    const codeBlocks = htmlContent.split(/(<pre><code[^>]*>[\s\S]*?<\/code><\/pre>)/g)
    return codeBlocks.map((block) => {
      if (block.startsWith('<pre><code')) {
        const match = block.match(/<pre><code(?:[^>]*)>([\s\S]*?)<\/code><\/pre>/)
        if (match) {
          const code = match[1]
          const highlighted = highlightCode(code)
          return `<pre><code>${highlighted}</code></pre>`
        }
      }
      return block
    }).join('')
  }, [htmlContent])

  const paperConfig = PAPER_SIZES[pageSettings.paperSize]

  const fullHTML = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    @page { size: ${pageSettings.paperSize}; margin: ${pageSettings.marginTop}mm ${pageSettings.marginRight}mm ${pageSettings.marginBottom}mm ${pageSettings.marginLeft}mm; }
    ${codeHighlightStyles}
    ${currentTheme.styles}
    @media print {
      body { padding: 0; margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
${highlightedHtml}
</body>
</html>`
  }, [highlightedHtml, currentTheme, title, pageSettings])

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }, [])

  const downloadHTML = useCallback(() => {
    const blob = new Blob([fullHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'document'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [fullHTML, title])

  const exportPDF = useCallback(() => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(fullHTML)
    printWindow.document.close()

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 300)
    }
  }, [fullHTML])

  const loadTemplate = useCallback((template: Template) => {
    setMarkdown(template.content)
    setActiveTemplate(template.id)
    setTitle(`${template.name} - ${title.split(' - ')[0] || 'Document'}`)
    setShowTemplates(false)
  }, [title])

  const resetContent = useCallback(() => {
    setMarkdown(DEFAULT_MD)
    setActiveTemplate(null)
    setTitle('WebLinuxOS Document')
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('md-pdf-content')
      if (saved) setMarkdown(saved)
      const savedTitle = localStorage.getItem('md-pdf-title')
      if (savedTitle) setTitle(savedTitle)
      const savedTheme = localStorage.getItem('md-pdf-theme') as ThemeId | null
      if (savedTheme && THEMES.find((t) => t.id === savedTheme)) setThemeId(savedTheme)
      const savedSettings = localStorage.getItem('md-pdf-settings')
      if (savedSettings) setPageSettings(JSON.parse(savedSettings))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('md-pdf-content', markdown)
      localStorage.setItem('md-pdf-title', title)
      localStorage.setItem('md-pdf-theme', themeId)
      localStorage.setItem('md-pdf-settings', JSON.stringify(pageSettings))
    } catch {}
  }, [markdown, title, themeId, pageSettings])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
      fontFamily: 'inherit',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid var(--glass-border)',
        gap: 12,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--glow-accent)',
          }}>
            <FileText size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Markdown 转 PDF</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文档标题"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: 6,
              padding: '5px 12px',
              color: 'var(--text-primary)',
              fontSize: 12,
              width: 180,
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 6,
            border: '1px solid var(--glass-border)',
          }}>
            <Palette size={13} style={{ color: 'var(--text-secondary)' }} />
            <div style={{ display: 'flex', gap: 4 }}>
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  title={t.description}
                  style={{
                    padding: '3px 8px',
                    fontSize: 11,
                    borderRadius: 4,
                    border: themeId === t.id ? '1px solid var(--accent)' : '1px solid transparent',
                    background: themeId === t.id ? 'var(--accent-bg)' : 'transparent',
                    color: themeId === t.id ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: themeId === t.id ? 600 : 400,
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowTemplates(!showTemplates)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              fontSize: 11,
              borderRadius: 6,
              border: '1px solid var(--glass-border)',
              background: showTemplates ? 'var(--accent-bg)' : 'transparent',
              color: showTemplates ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <BookOpen size={12} /> 模板
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              fontSize: 11,
              borderRadius: 6,
              border: '1px solid var(--glass-border)',
              background: showSettings ? 'var(--accent-bg)' : 'transparent',
              color: showSettings ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Settings size={12} /> 页面设置
          </button>

          <div style={{ width: 1, height: 20, background: 'var(--glass-border)' }} />

          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              fontSize: 11,
              borderRadius: 6,
              border: '1px solid var(--glass-border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
            {showPreview ? '隐藏预览' : '显示预览'}
          </button>

          <button
            onClick={() => copyToClipboard(fullHTML)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              fontSize: 11,
              borderRadius: 6,
              border: '1px solid var(--glass-border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {copied ? <Check size={12} color="var(--color-success)" /> : <Clipboard size={12} />}
            {copied ? '已复制' : '复制HTML'}
          </button>

          <div style={{ width: 1, height: 20, background: 'var(--glass-border)' }} />

          <button
            onClick={resetContent}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              fontSize: 11,
              borderRadius: 6,
              border: '1px solid var(--glass-border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <RotateCcw size={12} /> 重置
          </button>

          <button
            onClick={downloadHTML}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid var(--glass-border)',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            <Download size={12} /> HTML
          </button>

          <button
            onClick={exportPDF}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              fontSize: 12,
              borderRadius: 6,
              border: 'none',
              background: 'var(--accent-gradient)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: 'var(--glow-accent)',
              transition: 'transform 0.2s',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Printer size={13} /> 导出 PDF
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{
          padding: '14px 16px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
          alignItems: 'center',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>纸张大小:</span>
            <select
              value={pageSettings.paperSize}
              onChange={(e) => setPageSettings((s) => ({ ...s, paperSize: e.target.value as PaperSize }))}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                borderRadius: 6,
                padding: '5px 10px',
                color: 'var(--text-primary)',
                fontSize: 12,
                outline: 'none',
              }}
            >
              {Object.entries(PAPER_SIZES).map(([key, val]) => (
                <option key={key} value={key} style={{ background: '#1a1a2e' }}>
                  {val.label} ({val.width}×{val.height}mm)
                </option>
              ))}
            </select>
          </div>

          {(['marginTop', 'marginRight', 'marginBottom', 'marginLeft'] as const).map((key) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {key === 'marginTop' ? '上' : key === 'marginRight' ? '右' : key === 'marginBottom' ? '下' : '左'}:
              </span>
              <input
                type="number"
                min={5}
                max={50}
                value={pageSettings[key]}
                onChange={(e) => setPageSettings((s) => ({ ...s, [key]: Number(e.target.value) }))}
                style={{
                  width: 50,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 4,
                  padding: '4px 8px',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  outline: 'none',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>mm</span>
            </div>
          ))}

          <button
            onClick={() => setPageSettings({ paperSize: 'A4', marginTop: 20, marginRight: 20, marginBottom: 20, marginLeft: 20 })}
            style={{
              marginLeft: 'auto',
              padding: '5px 10px',
              fontSize: 11,
              borderRadius: 4,
              border: '1px solid var(--glass-border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            恢复默认
          </button>
        </div>
      )}

      {/* Templates Panel */}
      {showTemplates && (
        <div style={{
          padding: '14px 16px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          animation: 'fadeIn 0.2s ease',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', alignSelf: 'center' }}>示例模板:</span>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => loadTemplate(t)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                fontSize: 13,
                borderRadius: 8,
                border: activeTemplate === t.id ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                background: activeTemplate === t.id ? 'var(--accent-bg)' : 'rgba(255,255,255,0.03)',
                color: activeTemplate === t.id ? 'var(--accent)' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: activeTemplate === t.id ? 600 : 400,
              }}
            >
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Editor */}
        <div style={{
          width: showPreview ? '50%' : '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: showPreview ? '1px solid var(--glass-border)' : 'none',
        }}>
          <div style={{
            padding: '6px 16px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Markdown 编辑器</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{markdown.length} 字符</span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{markdown.split('\n').length} 行</span>
            </div>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              padding: '16px 20px',
              background: 'rgba(0,0,0,0.2)',
              color: 'var(--text-primary)',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: 13,
              lineHeight: 1.7,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
            }}
            placeholder="在此输入 Markdown 内容..."
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div ref={previewRef} style={{ width: '50%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              padding: '6px 16px',
              background: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                预览 ({currentTheme.name} 主题 · {pageSettings.paperSize})
              </span>
              <button
                onClick={() => copyToClipboard(htmlContent)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  fontSize: 10,
                  borderRadius: 4,
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <Clipboard size={10} /> 复制HTML
              </button>
            </div>
            <div style={{
              flex: 1,
              overflow: 'auto',
              background: '#f8f9fa',
              padding: '20px',
            }}>
              <div style={{
                maxWidth: paperConfig.width > 250 ? 800 : 600,
                margin: '0 auto',
                background: '#fff',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <div
                  style={{
                    padding: `${pageSettings.marginTop}mm ${pageSettings.marginRight}mm ${pageSettings.marginBottom}mm ${pageSettings.marginLeft}mm`,
                    minHeight: '100%',
                  }}
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden print content */}
      <div ref={printRef} style={{ display: 'none' }}>
        <style>{codeHighlightStyles}</style>
        <style>{currentTheme.styles}</style>
        <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
        textarea::selection { background: var(--accent-bg); }
      `}</style>
    </div>
  )
}