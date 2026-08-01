import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ========== Templates ==========
const TEMPLATE_TECH = `# 技术分享

## WebAssembly 前沿探索

---

## 什么是 WebAssembly？

- 一种**低级二进制格式**，可在浏览器中高效运行
- 兼容 *C/C++/Rust* 等多种语言
- 与 JavaScript 协同工作，**不是替代**

---

## 核心优势

- **高性能**：接近原生执行速度
- **可移植**：一次编译，处处运行
- **安全性**：沙箱化执行环境
- **开放标准**：W3C 推荐标准

---

## 代码示例

\`\`\`rust
fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}
\`\`\`

---

## 应用场景

- 游戏引擎（如 [Unity WebGL](https://unity.com)）
- 视频编辑器
- CAD / 3D 建模
- 科学计算

---

## 路线图

- 2017 — MVP 发布
- 2019 — W3C 推荐
- 2022 — 组件模型提案
- 2025 — 广泛生产采用

---

## 感谢聆听

### Q & A`;

const TEMPLATE_PROJECT = `# 项目汇报

## 智能协作平台 v2.0

---

## 项目概述

- **项目名称**：智能协作平台
- **版本**：v2.0
- **周期**：2025 Q1 - Q2
- **团队规模**：8 人

---

## 里程碑完成情况

- 需求分析与评审 ✅
- 架构设计与技术选型 ✅
- 核心功能开发 ✅
- 集成测试与优化 🔄
- 灰度发布与上线 🔜

---

## 核心功能

- **实时协同编辑**：多人同时在线编辑文档
- **智能推荐**：基于 AI 的内容建议
- **权限管理**：细粒度角色控制
- **数据看板**：项目进度可视化

---

## 关键指标

| 指标 | 目标 | 实际 |
|------|------|------|
| 日活用户 | 5000 | **6200** |
| 响应时间 | < 200ms | *150ms* |
| 可用性 | 99.9% | **99.95%** |

---

## 风险与应对

- **技术风险**：引入 \`WebSocket\` 心跳机制
- **人员风险**：建立知识库与交接文档
- **进度风险**：两周一个迭代，快速验证

---

## 下一步计划

1. 完成集成测试
2. 灰度发布 10% 流量
3. 收集用户反馈
4. 全量上线

---

## 谢谢

### 期待您的反馈`;

const DEFAULT_MARKDOWN = `# Markdown Slides Pro

## 用 Markdown 创建精美演示文稿

---

## 功能亮点

- **实时预览**：编辑即所见
- **幻灯片播放**：全屏演示模式
- **模板系统**：一键套用预设模板
- **导出 HTML**：生成独立演示文件
- **深色主题**：沉浸式创作体验

---

## Markdown 语法支持

- 标题：\`# h1\` \`## h2\` \`### h3\`
- **粗体**：\`**text**\`
- *斜体*：\`*text*\`
- 代码：\\\`code\\\`
- 列表：\`- item\`
- 链接：[示例](https://example.com)

---

## 快捷键

- **→ / 空格**：下一页
- **←**：上一页
- **Esc**：退出播放

---

## 开始创作吧

### 在左侧编辑 Markdown，用 --- 分隔幻灯片`;

// ========== Markdown Parser ==========
function parseMarkdown(md: string): string {
  let html = md;

  // Escape HTML entities
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks: ```lang\ncode\n```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang: string, code: string) => {
    const langLabel = lang ? `<span style="color:#8b5cf6;font-size:0.75em;float:right">${lang}</span>` : '';
    return `<pre style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:8px;padding:16px;overflow-x:auto;margin:12px 0;text-align:left">${langLabel}<code style="font-family:'Fira Code',Menlo,Monaco,monospace;font-size:0.85em;line-height:1.6">${code.trim()}</code></pre>`;
  });

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code style="background:#1a1a2e;color:#c084fc;padding:2px 6px;border-radius:4px;font-family:Menlo,Monaco,monospace;font-size:0.9em">$1</code>');

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:1.4em;margin:0.6em 0 0.4em;color:#06b6d4;font-weight:600">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:1.8em;margin:0.5em 0 0.4em;color:#22d3ee;font-weight:700">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:2.4em;margin:0.3em 0 0.3em;color:#a78bfa;font-weight:800;letter-spacing:-0.02em">$1</h1>');

  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e8e8f4;font-weight:700">$1</strong>');

  // Italic: *text*
  html = html.replace(/\*(.+?)\*/g, '<em style="color:#c4b5fd">$1</em>');

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#818cf8;text-decoration:underline">$1</a>');

  // Unordered lists: - item
  html = html.replace(/^- (.+)$/gm, '<li style="margin:4px 0;font-size:1.15em;line-height:1.8">$1</li>');
  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li[^>]*>.*?<\/li>\s*)+)/g, (match) => {
    return `<ul style="list-style:none;padding-left:1.2em;text-align:left;display:inline-block">${match}</ul>`;
  });

  // Paragraphs: wrap non-tag lines
  html = html.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<')) return line;
    return `<p style="margin:0.4em 0;font-size:1.15em;line-height:1.8">${line}</p>`;
  }).join('\n');

  return html;
}

// ========== Transition Styles ==========
type TransitionType = 'slide' | 'fade';

const transitionDuration = 400;

function getTransitionStyle(type: TransitionType, direction: 'enter' | 'exit'): React.CSSProperties {
  if (type === 'fade') {
    return {
      opacity: direction === 'enter' ? 1 : 0,
      transition: `opacity ${transitionDuration}ms ease-in-out`,
    };
  }
  // slide
  return {
    transform: direction === 'enter' ? 'translateX(0)' : 'translateX(30px)',
    opacity: direction === 'enter' ? 1 : 0,
    transition: `all ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
  } as React.CSSProperties;
}

// ========== Main Component ==========
export default function MarkdownSlidesPro() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [transition, setTransition] = useState<TransitionType>('slide');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumberRef = useRef<HTMLDivElement>(null);

  // Split slides
  const slides = useMemo(() => markdown.split(/^---\s*$/m).map(s => s.trim()).filter(s => s.length > 0), [markdown]);
  const totalSlides = slides.length;

  // Sync current slide
  useEffect(() => {
    if (currentSlide >= totalSlides) {
      setCurrentSlide(Math.max(0, totalSlides - 1));
    }
  }, [totalSlides, currentSlide]);

  // Line numbers
  const lineCount = markdown.split('\n').length;
  const lineNumbers = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1), [lineCount]);

  // Sync scroll between textarea and line numbers
  const handleEditorScroll = useCallback(() => {
    if (editorRef.current && lineNumberRef.current) {
      lineNumberRef.current.scrollTop = editorRef.current.scrollTop;
    }
  }, []);

  // Navigate slides
  const goToSlide = useCallback((index: number, _dir?: 'left' | 'right') => {
    if (index < 0 || index >= totalSlides || isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), transitionDuration);
  }, [totalSlides, isAnimating, currentSlide]);

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) goToSlide(currentSlide + 1, 'right');
  }, [currentSlide, totalSlides, goToSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) goToSlide(currentSlide - 1, 'left');
  }, [currentSlide, goToSlide]);

  // Keyboard navigation in presentation mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPresenting) return;
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prevSlide();
          break;
        case 'Escape':
          e.preventDefault();
          setIsPresenting(false);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, nextSlide, prevSlide]);

  // Load template
  const loadTemplate = useCallback((template: string) => {
    setMarkdown(template);
    setCurrentSlide(0);
    setShowTemplateMenu(false);
  }, []);

  // Render a single slide as HTML string
  const renderSlideHTML = useCallback((slideIndex: number): string => {
    if (slideIndex < 0 || slideIndex >= slides.length) return '';
    return parseMarkdown(slides[slideIndex]);
  }, [slides]);

  // Export HTML
  const exportHTML = useCallback(() => {
    const slideHTMLs = slides.map(s => parseMarkdown(s));
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Markdown Slides Pro 演示文稿</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0a0a1a; color: #e8e8f4; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
.slide { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; padding: 60px; opacity: 0; transform: translateX(30px); transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); pointer-events: none; }
.slide.active { opacity: 1; transform: translateX(0); pointer-events: auto; }
.slide.prev { opacity: 0; transform: translateX(-30px); }
.slide-content { max-width: 1100px; width: 100%; text-align: center; }
.nav { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; align-items: center; z-index: 100; }
.nav-dot { width: 10px; height: 10px; border-radius: 50%; background: #2a2a4a; cursor: pointer; transition: all 0.3s; border: none; }
.nav-dot.active { background: #8b5cf6; transform: scale(1.3); }
.page-num { position: fixed; bottom: 30px; right: 30px; color: #555; font-size: 14px; z-index: 100; }
.hint { position: fixed; bottom: 30px; left: 30px; color: #444; font-size: 12px; z-index: 100; }
h1 { font-size: 2.8em; margin: 0.3em 0; color: #a78bfa; font-weight: 800; letter-spacing: -0.02em; }
h2 { font-size: 2em; margin: 0.5em 0 0.4em; color: #22d3ee; font-weight: 700; }
h3 { font-size: 1.5em; margin: 0.6em 0 0.4em; color: #06b6d4; font-weight: 600; }
p { font-size: 1.2em; margin: 0.4em 0; line-height: 1.8; }
ul { list-style: none; padding-left: 1.2em; text-align: left; display: inline-block; }
li { margin: 6px 0; font-size: 1.2em; line-height: 1.8; }
li::before { content: "•"; color: #8b5cf6; margin-right: 8px; }
a { color: #818cf8; text-decoration: underline; }
code { background: #1a1a2e; color: #c084fc; padding: 2px 6px; border-radius: 4px; font-family: Menlo, Monaco, monospace; font-size: 0.9em; }
pre { background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 8px; padding: 16px; overflow-x: auto; margin: 12px 0; text-align: left; }
pre code { background: none; padding: 0; }
strong { color: #e8e8f4; font-weight: 700; }
em { color: #c4b5fd; }
</style>
</head>
<body>
${slideHTMLs.map((html, i) => `  <div class="slide${i === 0 ? ' active' : ''}" data-index="${i}"><div class="slide-content">${html}</div></div>`).join('\n')}
<div class="nav">${slideHTMLs.map((_, i) => `<button class="nav-dot${i === 0 ? ' active' : ''}" data-index="${i}"></button>`).join('')}</div>
<div class="page-num"><span id="current-page">1</span> / ${slideHTMLs.length}</div>
<div class="hint">← → 翻页 · Esc 退出全屏</div>
<script>
let current = 0;
const total = ${slideHTMLs.length};
const slideEls = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.nav-dot');
const pageNum = document.getElementById('current-page');
function show(index) {
  if (index < 0 || index >= total) return;
  slideEls.forEach((el, i) => { el.className = 'slide' + (i === index ? ' active' : i < index ? ' prev' : ''); });
  dots.forEach((d, i) => d.className = 'nav-dot' + (i === index ? ' active' : ''));
  current = index;
  pageNum.textContent = current + 1;
}
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); show(current + 1); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(current - 1); }
  else if (e.key === 'Escape') { document.exitFullscreen?.(); }
});
dots.forEach(d => d.addEventListener('click', () => show(+d.dataset.index)));
document.documentElement.requestFullscreen?.();
</script>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.html';
    a.click();
    URL.revokeObjectURL(url);
  }, [slides]);

  // Save markdown
  const saveMarkdown = useCallback(() => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'slides.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [markdown]);

  // Load markdown
  const loadMarkdown = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const content = ev.target?.result as string;
          setMarkdown(content);
          setCurrentSlide(0);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  // ===================== Presentation Mode =====================
  if (isPresenting) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0a0a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          overflow: 'hidden',
        }}
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x > rect.width / 2) nextSlide();
          else prevSlide();
        }}
      >
        {/* Current slide */}
        <div
          key={`slide-${currentSlide}`}
          style={{
            maxWidth: '1100px',
            width: '100%',
            padding: '40px',
            textAlign: 'center' as const,
            color: '#e8e8f4',
            fontSize: '1.3rem',
            ...getTransitionStyle(transition, 'enter'),
          }}
          dangerouslySetInnerHTML={{ __html: renderSlideHTML(currentSlide) }}
        />

        {/* Dot indicators */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}>
          {slides.map((_, i) => (
            <div
              key={i}
              onClick={(e) => { e.stopPropagation(); goToSlide(i); }}
              style={{
                width: i === currentSlide ? '24px' : '10px',
                height: '10px',
                borderRadius: '5px',
                backgroundColor: i === currentSlide ? '#8b5cf6' : '#2a2a4a',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Page number */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          right: '30px',
          color: '#555',
          fontSize: '14px',
        }}>
          {currentSlide + 1} / {totalSlides}
        </div>

        {/* Hint */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '30px',
          color: '#444',
          fontSize: '12px',
        }}>
          ← → 翻页 · Esc 退出
        </div>
      </div>
    );
  }

  // ===================== Editor Mode =====================
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0d0d1f',
      color: '#e8e8f4',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
    }}>
      {/* ===== Toolbar ===== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        borderBottom: '1px solid #2a2a4a',
        backgroundColor: '#121228',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#a78bfa' }}>
            ▶ Markdown Slides Pro
          </span>
          <span style={{ color: '#555', fontSize: '12px' }}>
            用 --- 分隔幻灯片
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* Template dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#282850',
                border: '1px solid #3a3a6a',
                borderRadius: '6px',
                color: '#e8e8f4',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              📋 模板
            </button>
            {showTemplateMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: '#1a1a2e',
                border: '1px solid #3a3a6a',
                borderRadius: '8px',
                overflow: 'hidden',
                zIndex: 1000,
                minWidth: '160px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              }}>
                <div
                  onClick={() => loadTemplate(TEMPLATE_TECH)}
                  style={{ padding: '10px 16px', cursor: 'pointer', color: '#e8e8f4', fontSize: '13px', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#282850')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  🔧 技术分享
                </div>
                <div
                  onClick={() => loadTemplate(TEMPLATE_PROJECT)}
                  style={{ padding: '10px 16px', cursor: 'pointer', color: '#e8e8f4', fontSize: '13px', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#282850')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  📊 项目汇报
                </div>
              </div>
            )}
          </div>

          {/* Transition toggle */}
          <button
            onClick={() => setTransition(transition === 'slide' ? 'fade' : 'slide')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#282850',
              border: '1px solid #3a3a6a',
              borderRadius: '6px',
              color: '#e8e8f4',
              cursor: 'pointer',
              fontSize: '13px',
            }}
            title="切换过渡动画"
          >
            🎞 {transition === 'slide' ? '滑动' : '淡入'}
          </button>

          <button onClick={loadMarkdown} style={toolbarBtnStyle}>📂 加载</button>
          <button onClick={saveMarkdown} style={toolbarBtnStyle}>💾 保存</button>
          <button onClick={exportHTML} style={{
            ...toolbarBtnStyle,
            backgroundColor: '#166534',
            border: '1px solid #22c55e',
          }}>
            🌐 导出HTML
          </button>
          <button
            onClick={() => setIsPresenting(true)}
            style={{
              padding: '6px 14px',
              backgroundColor: '#7c3aed',
              border: '1px solid #8b5cf6',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            ▶ 播放
          </button>
        </div>
      </div>

      {/* Close template menu on outside click */}
      {showTemplateMenu && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
          onClick={() => setShowTemplateMenu(false)}
        />
      )}

      {/* ===== Main Content ===== */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* --- Left: Editor --- */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #2a2a4a' }}>
          <div style={{
            padding: '6px 16px',
            backgroundColor: '#121228',
            fontSize: '12px',
            color: '#666',
            borderBottom: '1px solid #2a2a4a',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>Markdown 编辑器</span>
            <span>{lineCount} 行</span>
          </div>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Line numbers */}
            <div
              ref={lineNumberRef}
              style={{
                width: '48px',
                backgroundColor: '#0a0a18',
                color: '#444',
                fontSize: '13px',
                lineHeight: '1.65',
                padding: '12px 8px 12px 0',
                textAlign: 'right',
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                overflow: 'hidden',
                userSelect: 'none',
                flexShrink: 0,
              }}
            >
              {lineNumbers.map(n => (
                <div key={n}>{n}</div>
              ))}
            </div>
            {/* Textarea */}
            <textarea
              ref={editorRef}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              onScroll={handleEditorScroll}
              spellCheck={false}
              style={{
                flex: 1,
                backgroundColor: '#0d0d1f',
                color: '#d4d4e8',
                border: 'none',
                padding: '12px 16px',
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                fontSize: '13px',
                lineHeight: '1.65',
                outline: 'none',
                resize: 'none',
                tabSize: 2,
              }}
            />
          </div>
        </div>

        {/* --- Right: Preview --- */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0f0f24' }}>
          {/* Preview header */}
          <div style={{
            padding: '6px 16px',
            fontSize: '12px',
            color: '#666',
            borderBottom: '1px solid #2a2a4a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#121228',
          }}>
            <span>幻灯片预览 · {currentSlide + 1} / {totalSlides}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={prevSlide} disabled={currentSlide === 0} style={navBtnStyle(currentSlide === 0)}>←</button>
              <button onClick={nextSlide} disabled={currentSlide === totalSlides - 1} style={navBtnStyle(currentSlide === totalSlides - 1)}>→</button>
            </div>
          </div>

          {/* Slide thumbnails strip */}
          <div style={{
            display: 'flex',
            gap: '6px',
            padding: '8px 12px',
            overflowX: 'auto',
            borderBottom: '1px solid #2a2a4a',
            backgroundColor: '#0a0a18',
            flexShrink: 0,
          }}>
            {slides.map((_, index) => (
              <div
                key={index}
                onClick={() => goToSlide(index)}
                style={{
                  minWidth: '72px',
                  height: '48px',
                  backgroundColor: index === currentSlide ? '#2a1a4a' : '#1a1a2e',
                  border: `2px solid ${index === currentSlide ? '#8b5cf6' : '#2a2a4a'}`,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: index === currentSlide ? '#a78bfa' : '#666',
                  cursor: 'pointer',
                  fontWeight: index === currentSlide ? 700 : 400,
                  transition: 'all 0.2s',
                }}
              >
                {index + 1}
              </div>
            ))}
          </div>

          {/* Main slide preview */}
          <div style={{
            flex: 1,
            padding: '20px',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div
              key={`preview-${currentSlide}`}
              style={{
                backgroundColor: '#0a0a1a',
                padding: '40px 36px',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '900px',
                aspectRatio: '16/9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px #2a2a4a',
                color: '#e8e8f4',
                fontSize: '0.85em',
                overflow: 'hidden',
                ...getTransitionStyle(transition, 'enter'),
              }}
              dangerouslySetInnerHTML={{ __html: renderSlideHTML(currentSlide) }}
            />
          </div>

          {/* Bottom dot navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            padding: '10px',
            borderTop: '1px solid #2a2a4a',
            backgroundColor: '#121228',
            flexShrink: 0,
          }}>
            {slides.map((_, i) => (
              <div
                key={i}
                onClick={() => goToSlide(i)}
                style={{
                  width: i === currentSlide ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: i === currentSlide ? '#8b5cf6' : '#2a2a4a',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
            <span style={{ marginLeft: '12px', color: '#555', fontSize: '12px' }}>
              {currentSlide + 1} / {totalSlides}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== Style Helpers ==========
const toolbarBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: '#282850',
  border: '1px solid #3a3a6a',
  borderRadius: '6px',
  color: '#e8e8f4',
  cursor: 'pointer',
  fontSize: '13px',
};

function navBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '4px 10px',
    backgroundColor: '#282850',
    border: '1px solid #3a3a6a',
    borderRadius: '4px',
    color: disabled ? '#444' : '#e8e8f4',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '12px',
  };
}
