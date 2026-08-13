import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

const DEFAULT_MARKDOWN = `# 欢迎使用 Markdown 编辑器

这是一个功能丰富的 Markdown 编辑器，支持 **GFM**（GitHub Flavored Markdown）语法。

## ✨ 功能特性

- 实时预览
- 语法高亮
- 工具栏快捷按钮
- 导出 HTML / MD 文件
- 自动保存到本地
- 目录导航生成
- 字数统计与阅读时间

## 📝 基础语法

### 文本格式

**粗体文本** 和 *斜体文本* 以及 ~~删除线~~ 还有 \`行内代码\`

### 列表

1. 有序列表项一
2. 有序列表项二
   - 嵌套无序项
   - 嵌套无序项

### 任务列表

- [x] 已完成的任务
- [ ] 待办的任务
- [ ] 另一个待办

### 链接与图片

访问 [GitHub](https://github.com) 获取更多资源。

### 代码块

\`\`\`javascript
function hello(name) {
  console.log(\`Hello, \${name}!\`);
}
hello('World');
\`\`\`

### 引用

> 这是一段引用文字。
> 可以跨越多行。

### 表格

| 功能 | 语法 | 示例 |
|------|------|------|
| 粗体 | \`**text**\` | **text** |
| 斜体 | \`*text*\` | *text* |
| 代码 | \`\\\`code\\\`\` | \`code\` |

---

开始编写你的文档吧！
`;

interface Heading {
  level: number;
  text: string;
  id: string;
}

function generateId(text: string, index: number): string {
  return 'heading-' + index + '-' + text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

function parseMarkdown(md: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  let headingIndex = 0;

  let text = md;

  text = text.replace(/\r\n/g, '\n');

  const lines = text.split('\n');
  const tokens: Array<{ type: string; content: string; data?: any }> = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      tokens.push({ type: 'code', content: codeLines.join('\n'), data: { lang } });
      continue;
    }

    if (/^---+\s*$/.test(line.trim())) {
      tokens.push({ type: 'hr', content: '' });
      i++;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+)/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      const id = generateId(headingText, headingIndex);
      headings.push({ level, text: headingText, id });
      headingIndex++;
      tokens.push({ type: 'heading', content: headingText, data: { level, id } });
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      tokens.push({ type: 'quote', content: quoteLines.join(' ') });
      continue;
    }

    if (/^\|.+\|$/.test(line.trim())) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
        tableLines.push(lines[i].trim());
        i++;
      }
      tokens.push({ type: 'table', content: tableLines.join('\n') });
      continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        items.push(lines[i]);
        i++;
      }
      tokens.push({ type: 'ulist', content: items.join('\n') });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i]);
        i++;
      }
      tokens.push({ type: 'olist', content: items.join('\n') });
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith('```') &&
      !/^>\s?/.test(lines[i]) &&
      !/^---+\s*$/.test(lines[i].trim()) &&
      !/^[-*+]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^\|.+\|$/.test(lines[i].trim())) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      tokens.push({ type: 'paragraph', content: paraLines.join(' ') });
    }
  }

  function inlineFormat(s: string): string {
    let result = s;

    result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    result = result.replace(/_([^_]+)_/g, '<em>$1</em>');

    result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    return result;
  }

  let html = '';

  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const { level, id } = token.data;
        html += `<h${level} id="${id}" style="scroll-margin-top:80px">${inlineFormat(token.content)}</h${level}>\n`;
        break;
      }
      case 'paragraph': {
        html += `<p>${inlineFormat(token.content)}</p>\n`;
        break;
      }
      case 'code': {
        const { lang } = token.data;
        const escaped = token.content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        html += `<pre><code${lang ? ` class="language-${lang}"` : ''}>${escaped}</code></pre>\n`;
        break;
      }
      case 'hr': {
        html += '<hr />\n';
        break;
      }
      case 'quote': {
        html += `<blockquote>${inlineFormat(token.content)}</blockquote>\n`;
        break;
      }
      case 'ulist': {
        const items = token.content.split('\n');
        let inList = false;
        let listBuffer = '';
        for (const item of items) {
          const taskMatch = /^[-*+]\s+\[( |x|X)\]\s+(.*)/.exec(item);
          const nestedMatch = /^(\s+)[-*+]\s+(.*)/.exec(item);
          if (taskMatch) {
            if (listBuffer) { listBuffer += '</li>'; }
            if (!inList) { listBuffer = '<ul>'; inList = true; }
            const checked = taskMatch[1].toLowerCase() === 'x';
            listBuffer += `<li><input type="checkbox" disabled${checked ? ' checked' : ''} style="margin-right:6px" />${inlineFormat(taskMatch[2])}`;
          } else if (nestedMatch) {
            if (!inList) { listBuffer = '<ul>'; inList = true; }
            listBuffer += `<ul><li>${inlineFormat(nestedMatch[2])}</li></ul>`;
          } else {
            const text = item.replace(/^[-*+]\s+/, '');
            if (listBuffer) { listBuffer += '</li>'; }
            if (!inList) { listBuffer = '<ul>'; inList = true; }
            listBuffer += `<li>${inlineFormat(text)}`;
          }
        }
        if (listBuffer) {
          listBuffer += '</li></ul>';
          html += listBuffer + '\n';
        }
        break;
      }
      case 'olist': {
        const items = token.content.split('\n');
        let listHtml = '<ol>';
        for (const item of items) {
          const text = item.replace(/^\d+\.\s+/, '');
          listHtml += `<li>${inlineFormat(text)}</li>`;
        }
        listHtml += '</ol>';
        html += listHtml + '\n';
        break;
      }
      case 'table': {
        const rows = token.content.split('\n');
        if (rows.length >= 2) {
          const headerCells = rows[0].split('|').map(c => c.trim()).filter(c => c !== '');
          const bodyRows = rows.slice(2);
          let tableHtml = '<table><thead><tr>';
          for (const cell of headerCells) {
            tableHtml += `<th>${inlineFormat(cell)}</th>`;
          }
          tableHtml += '</tr></thead><tbody>';
          for (const row of bodyRows) {
            const cells = row.split('|').map(c => c.trim()).filter(c => c !== '');
            tableHtml += '<tr>';
            for (const cell of cells) {
              tableHtml += `<td>${inlineFormat(cell)}</td>`;
            }
            tableHtml += '</tr>';
          }
          tableHtml += '</tbody></table>';
          html += tableHtml + '\n';
        }
        break;
      }
    }
  }

  return { html, headings };
}

function computeWordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const chineseChars = (trimmed.match(/[\u4e00-\u9fa5]/g) || []).length;
  const nonChineseWords = (trimmed.replace(/[\u4e00-\u9fa5]/g, ' ').trim().split(/\s+/).filter(Boolean)).length;
  return chineseChars + nonChineseWords;
}

function computeReadingTime(wordCount: number): number {
  if (wordCount === 0) return 0;
  return Math.max(1, Math.round(wordCount / 200));
}

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('markdown-editor-content');
      return saved !== null ? saved : DEFAULT_MARKDOWN;
    } catch {
      return DEFAULT_MARKDOWN;
    }
  });

  const [showPreview, setShowPreview] = useState(true);
  const [showToc, setShowToc] = useState(true);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('markdown-editor-content', markdown);
    } catch {}
  }, [markdown]);

  const { html, headings } = useMemo(() => parseMarkdown(markdown), [markdown]);
  const wordCount = useMemo(() => computeWordCount(markdown), [markdown]);
  const readingTime = useMemo(() => computeReadingTime(wordCount), [wordCount]);

  const wrapSelection = useCallback((before: string, after: string = before, placeholder: string = '') => {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = markdown.substring(start, end) || placeholder;
    const newText = markdown.substring(0, start) + before + selected + after + markdown.substring(end);
    setMarkdown(newText);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }, [markdown]);

  const prefixLine = useCallback((prefix: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = markdown.lastIndexOf('\n', start - 1) + 1;
    const lineEndIdx = markdown.indexOf('\n', end);
    const lineEnd = lineEndIdx === -1 ? markdown.length : lineEndIdx;
    const before = markdown.substring(0, lineStart);
    const selection = markdown.substring(lineStart, lineEnd);
    const after = markdown.substring(lineEnd);
    const newLines = selection.split('\n').map(l => prefix + l).join('\n');
    const newText = before + newLines + after;
    setMarkdown(newText);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + newLines.length);
    });
  }, [markdown]);

  const handleBold = () => wrapSelection('**', '**', '粗体文本');
  const handleItalic = () => wrapSelection('*', '*', '斜体文本');
  const handleStrikethrough = () => wrapSelection('~~', '~~', '删除线文本');
  const handleCode = () => wrapSelection('`', '`', 'code');
  const handleCodeBlock = () => {
    wrapSelection('\n```\n', '\n```\n', '在此输入代码');
  };
  const handleLink = () => wrapSelection('[', '](https://example.com)', '链接文本');
  const handleImage = () => wrapSelection('![', '](https://example.com/image.png)', '图片描述');
  const handleHeading = () => prefixLine('## ');
  const handleList = () => prefixLine('- ');
  const handleOrderedList = () => prefixLine('1. ');
  const handleTaskList = () => prefixLine('- [ ] ');
  const handleQuote = () => prefixLine('> ');
  const handleTable = () => {
    const table = '\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容 | 内容 | 内容 |\n';
    setMarkdown(markdown + table);
  };
  const handleHr = () => {
    setMarkdown(markdown + '\n\n---\n\n');
  };

  const handleExportHTML = () => {
    const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>导出文档</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.8; color: #333; }
h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
h1 { font-size: 2em; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
p { margin: 1em 0; }
a { color: #0066cc; }
code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
pre { background: #f4f4f4; padding: 16px; border-radius: 6px; overflow-x: auto; }
pre code { background: none; padding: 0; }
blockquote { border-left: 4px solid #ddd; margin: 1em 0; padding: 0.5em 1em; color: #666; background: #f9f9f9; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
th { background: #f4f4f4; }
img { max-width: 100%; }
hr { border: none; border-top: 1px solid #eee; margin: 2em 0; }
input[type="checkbox"] { margin-right: 6px; }
</style>
</head>
<body>
${html}
</body>
</html>`;
    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMD = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('确定要清空所有内容吗？')) {
      setMarkdown('');
    }
  };

  const handleReset = () => {
    if (confirm('确定要恢复默认示例内容吗？当前内容将被覆盖。')) {
      setMarkdown(DEFAULT_MARKDOWN);
    }
  };

  const scrollToHeading = (id: string) => {
    const container = document.getElementById('md-preview');
    if (!container) return;
    const el = container.querySelector(`#${CSS.escape(id)}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toolbarButtons = [
    { label: 'B', title: '粗体', action: handleBold, style: { fontWeight: 700 } as React.CSSProperties },
    { label: 'I', title: '斜体', action: handleItalic, style: { fontStyle: 'italic' } as React.CSSProperties },
    { label: 'S', title: '删除线', action: handleStrikethrough, style: { textDecoration: 'line-through' } as React.CSSProperties },
    { label: 'H', title: '标题', action: handleHeading, style: {} as React.CSSProperties },
    { label: '• 列表', title: '无序列表', action: handleList, style: {} as React.CSSProperties },
    { label: '1. 列表', title: '有序列表', action: handleOrderedList, style: {} as React.CSSProperties },
    { label: '☐ 任务', title: '任务列表', action: handleTaskList, style: {} as React.CSSProperties },
    { label: '🔗', title: '链接', action: handleLink, style: {} as React.CSSProperties },
    { label: '🖼', title: '图片', action: handleImage, style: {} as React.CSSProperties },
    { label: '</>', title: '行内代码', action: handleCode, style: {} as React.CSSProperties },
    { label: '{ }', title: '代码块', action: handleCodeBlock, style: {} as React.CSSProperties },
    { label: '❝', title: '引用', action: handleQuote, style: {} as React.CSSProperties },
    { label: '☰', title: '表格', action: handleTable, style: {} as React.CSSProperties },
    { label: '—', title: '分割线', action: handleHr, style: {} as React.CSSProperties },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '4px',
          padding: '8px 12px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {toolbarButtons.map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.action}
              title={btn.title}
              style={{
                padding: '5px 10px',
                fontSize: '13px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                ...btn.style,
              }}
              onMouseEnter={e => {
                (e.target as HTMLButtonElement).style.borderColor = 'var(--accent)';
                (e.target as HTMLButtonElement).style.color = 'var(--accent)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLButtonElement).style.borderColor = 'var(--border-color)';
                (e.target as HTMLButtonElement).style.color = 'var(--text-primary)';
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 6px' }} />

        <button
          onClick={() => setShowPreview(!showPreview)}
          title={showPreview ? '隐藏预览' : '显示预览'}
          style={{
            padding: '5px 10px',
            fontSize: '13px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            background: showPreview ? 'var(--accent)' : 'var(--bg-primary)',
            color: showPreview ? '#fff' : 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          {showPreview ? '👁 预览开' : '👁 预览关'}
        </button>

        <button
          onClick={() => setShowToc(!showToc)}
          title="切换目录"
          style={{
            padding: '5px 10px',
            fontSize: '13px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            background: showToc ? 'var(--accent)' : 'var(--bg-primary)',
            color: showToc ? '#fff' : 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          📋 目录
        </button>

        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 6px' }} />

        <button
          onClick={handleExportHTML}
          title="导出为 HTML 文件"
          style={{
            padding: '5px 10px',
            fontSize: '13px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          📄 导出 HTML
        </button>

        <button
          onClick={handleDownloadMD}
          title="下载为 .md 文件"
          style={{
            padding: '5px 10px',
            fontSize: '13px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          💾 下载 MD
        </button>

        <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 6px' }} />

        <button
          onClick={handleReset}
          title="恢复默认示例"
          style={{
            padding: '5px 10px',
            fontSize: '13px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          ↺ 重置
        </button>

        <button
          onClick={handleClear}
          title="清空内容"
          style={{
            padding: '5px 10px',
            fontSize: '13px',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          🗑 清空
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary, #888)' }}>
          <span>📝 {wordCount} 字</span>
          <span>⏱ {readingTime} 分钟阅读</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: showPreview ? 1 : 1, overflow: 'hidden', borderRight: showPreview ? '1px solid var(--border-color)' : 'none' }}>
          <textarea
            ref={editorRef}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
            placeholder="开始编写 Markdown..."
            style={{
              flex: 1,
              padding: '16px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontFamily: '"SF Mono", "Cascadia Code", "Fira Code", "Consolas", monospace',
              fontSize: '14px',
              lineHeight: '1.7',
              tabSize: 2,
              overflow: 'auto',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                const start = e.currentTarget.selectionStart;
                const end = e.currentTarget.selectionEnd;
                const newText = markdown.substring(0, start) + '  ' + markdown.substring(end);
                setMarkdown(newText);
                requestAnimationFrame(() => {
                  e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                });
              }
            }}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div
              id="md-preview"
              style={{
                flex: 1,
                padding: '16px 24px',
                overflow: 'auto',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                lineHeight: '1.8',
                fontSize: '15px',
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        )}

        {/* Table of Contents */}
        {showToc && headings.length > 0 && (
          <div
            style={{
              width: '200px',
              flexShrink: 0,
              borderLeft: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              overflow: 'auto',
              padding: '12px',
              fontSize: '13px',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '10px', color: 'var(--text-primary)' }}>
              📋 目录
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {headings.map((h, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToHeading(h.id)}
                  title={h.text}
                  style={{
                    textAlign: 'left',
                    padding: '4px 6px',
                    fontSize: '12px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-secondary, #888)',
                    cursor: 'pointer',
                    borderRadius: '3px',
                    paddingLeft: `${(h.level - 1) * 12 + 6}px`,
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    (e.target as HTMLButtonElement).style.background = 'var(--bg-hover, rgba(255,255,255,0.08))';
                    (e.target as HTMLButtonElement).style.color = 'var(--accent)';
                  }}
                  onMouseLeave={e => {
                    (e.target as HTMLButtonElement).style.background = 'transparent';
                    (e.target as HTMLButtonElement).style.color = 'var(--text-secondary, #888)';
                  }}
                >
                  {h.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}