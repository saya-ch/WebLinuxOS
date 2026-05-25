import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';

type Language = 'javascript' | 'html' | 'css' | 'markdown';

interface Snippet {
  id: string;
  title: string;
  code: string;
  language: Language;
  createdAt: Date;
}

const defaultSnippets: Snippet[] = [
  {
    id: '1',
    title: 'Hello World (JS)',
    language: 'javascript',
    code: `// 试试运行这个简单的示例！
console.log("Hello, WebLinuxOS!");
let a = 10;
let b = 20;
console.log(\`a + b = \${a + b}\`);

// 还可以操作DOM
document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h1 style="color: #6c5ce7;">🎉 运行成功!</h1><p>这是通过JavaScript动态生成的内容</p></div>';`,
    createdAt: new Date(),
  },
  {
    id: '2',
    title: '动画效果 (CSS)',
    language: 'css',
    code: `body {
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: system-ui;
}

.animated-box {
  width: 200px;
  height: 200px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  color: #6c5ce7;
  font-weight: bold;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}`,
    createdAt: new Date(),
  },
  {
    id: '3',
    title: '个人网页 (HTML)',
    language: 'html',
    code: `<div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: system-ui;">
  <div style="text-align: center;">
    <div style="width: 120px; height: 120px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 48px;">👨‍💻</div>
    <h1 style="color: #333; margin-bottom: 10px;">张三</h1>
    <p style="color: #666; font-size: 18px;">全栈开发者 · 开源爱好者</p>
  </div>
  
  <div style="margin-top: 40px;">
    <h2>🎨 关于我</h2>
    <p>喜欢编程和技术创新，正在WebLinuxOS上学习前端开发！</p>
  </div>
  
  <div style="margin-top: 30px;">
    <button style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 30px; border-radius: 25px; font-size: 16px; cursor: pointer;" onclick="alert('欢迎联系我！')">联系我</button>
  </div>
</div>`,
    createdAt: new Date(),
  },
  {
    id: '4',
    title: 'Markdown 文档',
    language: 'markdown',
    code: `# 📖 欢迎来到 WebLinuxOS

## 这是一个 Markdown 示例

WebLinuxOS 是一个完全运行在浏览器中的操作系统！

### 功能特性

- 🎮 **完整的桌面体验** - 窗口管理、任务栏、开始菜单
- 💻 **终端模拟器** - 支持 40+ 内置命令
- 📁 **文件系统** - 完整的虚拟文件系统
- 🎨 **丰富的应用** - 50+ 预装应用

### 代码示例

\`\`\`javascript
console.log("Hello from WebLinuxOS!");
\`\`\`

### 列表项目

1. 首先
2. 其次
3. 最后

> "代码是写给人看的，顺便让机器执行"
> — 哈罗德·埃布尔森

---

*感谢使用 WebLinuxOS!* 🌟`,
    createdAt: new Date(),
  },
];

export default function CodePlayground() {
  const theme = useStore((s) => s.theme);
  const [activeTab, setActiveTab] = useState<Language>('javascript');
  const [code, setCode] = useState(defaultSnippets[0].code);
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    const saved = localStorage.getItem('weblinux-code-snippets');
    if (saved) {
      try {
        return JSON.parse(saved).map((s: Record<string, unknown>) => ({
          ...s,
          createdAt: new Date(s.createdAt as string),
        }));
      } catch {
        return defaultSnippets;
      }
    }
    return defaultSnippets;
  });
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    localStorage.setItem('weblinux-code-snippets', JSON.stringify(snippets));
  }, [snippets]);

  // 简单的 Markdown 解析器
  const parseMarkdown = (md: string): string => {
    return md
      .replace(/^### (.*$)/gm, '<h3 style="margin-top: 20px;">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 style="margin-top: 24px; border-bottom: 1px solid #ddd; padding-bottom: 8px;">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 style="color: #6c5ce7;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background: #f0f0f5; padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre style="background: #1e1e2e; color: #e0e0e8; padding: 16px; border-radius: 8px; overflow-x: auto;"><code>$1</code></pre>')
      .replace(/^> (.*$)/gm, '<blockquote style="border-left: 4px solid #6c5ce7; padding-left: 16px; color: #666; font-style: italic;">$1</blockquote>')
      .replace(/^- (.*$)/gm, '<li style="margin-left: 20px;">$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li style="margin-left: 20px;">$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|b|p|l|i|q])(.*)$/gm, '<p>$1</p>')
      .replace(/---/g, '<hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">');
  };

  const updatePreview = () => {
    if (!iframeRef.current) return;
    
    let htmlContent = '';
    
    try {
      if (activeTab === 'javascript') {
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif;
                padding: 20px;
                background: #f8fafc;
                margin: 0;
                min-height: 100vh;
                box-sizing: border-box;
              }
              #console {
                background: #1e1e2e;
                color: #e0e0e8;
                padding: 16px;
                border-radius: 12px;
                white-space: pre-wrap;
                word-wrap: break-word;
                font-family: 'JetBrains Mono', 'Fira Code', monospace;
                font-size: 13px;
                line-height: 1.6;
                margin-top: 16px;
              }
              .log-line { margin: 4px 0; }
              .error { color: #ff6b6b; }
              .success { color: #51cf66; }
              .info { color: #74c0fc; }
            </style>
          </head>
          <body>
            <div style="color: #333; font-size: 14px;">
              <strong>📤 控制台输出</strong>
            </div>
            <div id="console"></div>
            <script>
              const consoleEl = document.getElementById('console');
              const logs = [];
              
              const addLog = (type, args) => {
                const text = args.map(arg => {
                  if (typeof arg === 'object') {
                    try {
                      return JSON.stringify(arg, null, 2);
                    } catch {
                      return String(arg);
                    }
                  }
                  return String(arg);
                }).join(' ');
                
                logs.push({ type, text });
                
                consoleEl.innerHTML = logs.map(log => 
                  '<div class="log-line ' + log.type + '">' + 
                  log.text.replace(/</g, '&lt;').replace(/>/g, '&gt;') + 
                  '</div>'
                ).join('');
                consoleEl.scrollTop = consoleEl.scrollHeight;
              };
              
              console.log = function(...args) { addLog('info', args); };
              console.error = function(...args) { addLog('error', args); };
              console.warn = function(...args) { addLog('warning', args); };
              
              try {
                ${code}
              } catch (e) {
                console.error('错误:', e.message);
                console.error(e.stack);
              }
            </script>
          </body>
          </html>
        `;
      } else if (activeTab === 'html') {
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              * { box-sizing: border-box; }
              body { margin: 0; padding: 0; font-family: system-ui; }
            </style>
          </head>
          <body>${code}</body>
          </html>
        `;
      } else if (activeTab === 'css') {
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              * { box-sizing: border-box; }
              body { margin: 0; padding: 40px; font-family: system-ui; }
              ${code}
            </style>
          </head>
          <body>
            <div class="animated-box">✨ WebLinuxOS</div>
            <div style="margin-top: 40px;">
              <h1>样式预览</h1>
              <p>这是一个测试段落，用来展示你的CSS效果。</p>
              <button style="margin-top: 16px; padding: 12px 24px; font-size: 16px;">按钮</button>
              <div style="margin-top: 16px; padding: 20px; background: #f8fafc; border-radius: 8px;">
                <h3>示例卡片</h3>
                <p>在这里添加你的内容...</p>
              </div>
            </div>
          </body>
          </html>
        `;
      } else if (activeTab === 'markdown') {
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif;
                padding: 30px;
                background: #ffffff;
                margin: 0;
                line-height: 1.7;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
              }
              h1, h2, h3 { margin-bottom: 0.5em; margin-top: 1.5em; font-weight: 600; }
              h1 { color: #6c5ce7; font-size: 2.5em; }
              code { background: #f0f0f5; padding: 4px 8px; border-radius: 6px; font-family: monospace; font-size: 0.9em; }
              pre { background: #1e1e2e; color: #e0e0e8; padding: 20px; border-radius: 12px; overflow-x: auto; }
              pre code { background: none; padding: 0; color: inherit; }
              blockquote { border-left: 4px solid #6c5ce7; padding: 0 20px; color: #666; font-style: italic; margin: 1.5em 0; }
              hr { border: none; border-top: 1px solid #e5e5e5; margin: 2em 0; }
            </style>
          </head>
          <body>${parseMarkdown(code)}</body>
          </html>
        `;
      }
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      iframeRef.current.src = URL.createObjectURL(blob);
      setOutput('✅ 预览已更新！');
      
    } catch (e) {
      setOutput(`错误: ${e}`);
    }
  };

  const runCode = () => {
    setIsRunning(true);
    setOutput('运行中...');
    
    setTimeout(() => {
      updatePreview();
      setIsRunning(false);
    }, 100);
  };

  const saveSnippet = () => {
    const title = prompt('请输入代码片段标题:');
    if (title?.trim()) {
      const newSnippet: Snippet = {
        id: Date.now().toString(),
        title: title.trim(),
        code,
        language: activeTab,
        createdAt: new Date(),
      };
      setSnippets([...snippets, newSnippet]);
    }
  };

  const loadSnippet = (snippet: Snippet) => {
    setCode(snippet.code);
    setActiveTab(snippet.language);
    setTimeout(() => updatePreview(), 50);
  };

  const deleteSnippet = (id: string) => {
    if (confirm('确定要删除此代码片段吗?')) {
      setSnippets(snippets.filter(s => s.id !== id));
    }
  };

  const clearCode = () => {
    if (confirm('确定要清空代码吗?')) {
      setCode('');
    }
  };

  // 自动运行代码（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      updatePreview();
    }, 800);
    
    return () => clearTimeout(timer);
  }, [code, activeTab]);

  // 初始化预览
  useEffect(() => {
    setTimeout(() => updatePreview(), 100);
  }, []);

  return (
    <div 
      className="app-container"
      style={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: theme === 'light' ? '#f0f0f5' : '#1e1e2e',
        color: theme === 'light' ? '#1c1c1e' : '#e0e0e8',
      }}
    >
      <div style={{ 
        padding: '12px 16px',
        background: theme === 'light' ? '#ffffff' : '#252536',
        borderBottom: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🎮</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>代码运行器</div>
            <div style={{ fontSize: '11px', color: theme === 'light' ? '#8e8e93' : '#9090a4' }}>
              在浏览器中实时运行代码 · 支持 HTML/CSS/JS/Markdown
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={clearCode}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
              background: theme === 'light' ? '#ffffff' : '#252536',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            🗑 清空
          </button>
          <button
            onClick={saveSnippet}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
              background: theme === 'light' ? '#ffffff' : '#252536',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            💾 保存
          </button>
          <button
            onClick={runCode}
            disabled={isRunning}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: 'none',
              background: isRunning 
                ? '#8e8e93' 
                : (theme === 'light' ? '#007aff' : '#6c5ce7'),
              color: '#fff',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isRunning ? '⏳ 运行中...' : '▶ 立即运行'}
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
      }}>
        <div style={{ 
          width: '220px',
          borderRight: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
          display: 'flex',
          flexDirection: 'column',
          background: theme === 'light' ? '#ffffff' : '#252536',
        }}>
          <div style={{ 
            padding: '14px',
            fontWeight: 700,
            fontSize: '12px',
            borderBottom: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
            textTransform: 'uppercase',
            color: theme === 'light' ? '#8e8e93' : '#9090a4',
            letterSpacing: '0.5px',
          }}>
            📚 示例代码
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {snippets.map((snippet) => (
              <div
                key={snippet.id}
                style={{
                  padding: '14px',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${theme === 'light' ? '#f5f5f7' : '#2e2e44'}`,
                  transition: 'all 0.2s ease',
                }}
                onClick={() => loadSnippet(snippet)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme === 'light' ? '#f8fafc' : '#1a1a2e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ 
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {snippet.title}
                </div>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ 
                    fontSize: '11px',
                    color: theme === 'light' ? '#007aff' : '#a29bfe',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: theme === 'light' ? '#f0f7ff' : '#2a2a4e',
                    fontWeight: 600,
                  }}>
                    {snippet.language.toUpperCase()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSnippet(snippet.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff6b6b',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ 
            display: 'flex',
            borderBottom: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
            background: theme === 'light' ? '#ffffff' : '#252536',
          }}>
            {(['javascript', 'html', 'css', 'markdown'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveTab(lang)}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  background: 'transparent',
                  color: activeTab === lang 
                    ? (theme === 'light' ? '#007aff' : '#6c5ce7')
                    : (theme === 'light' ? '#8e8e93' : '#9090a4'),
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: activeTab === lang ? 700 : 500,
                  borderBottom: activeTab === lang 
                    ? `2px solid ${theme === 'light' ? '#007aff' : '#6c5ce7'}`
                    : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {lang === 'javascript' ? 'JavaScript' : 
                 lang === 'html' ? 'HTML' : 
                 lang === 'css' ? 'CSS' : 
                 'Markdown'}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setShowOutput(!showOutput)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                color: theme === 'light' ? '#8e8e93' : '#9090a4',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {showOutput ? '📄 隐藏输出' : '📄 显示输出'}
            </button>
          </div>

          <div style={{ 
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
          }}>
            <div style={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                padding: '8px 16px',
                fontSize: '11px',
                color: theme === 'light' ? '#8e8e93' : '#9090a4',
                background: theme === 'light' ? '#f8fafc' : '#1a1a2e',
                borderBottom: `1px solid ${theme === 'light' ? '#d1d1d6' : '#2a2a4e'}`,
              }}>
                ✨ 输入代码，右侧将自动预览 · 或者点击「立即运行」查看效果
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1,
                  padding: '20px',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
                  fontSize: '14px',
                  lineHeight: '1.7',
                  background: theme === 'light' ? '#ffffff' : '#0f0f1a',
                  color: theme === 'light' ? '#1c1c1e' : '#e0e0e8',
                  tabSize: 2,
                }}
                placeholder={`// 输入 ${activeTab} 代码...`}
              />
            </div>

            {showOutput && (
              <div style={{ 
                width: '50%',
                borderLeft: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
                display: 'flex',
                flexDirection: 'column',
                background: theme === 'light' ? '#ffffff' : '#252536',
              }}>
                <div style={{ 
                  padding: '12px 16px',
                  borderBottom: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
                  fontWeight: 700,
                  fontSize: '12px',
                  color: theme === 'light' ? '#8e8e93' : '#9090a4',
                  background: theme === 'light' ? '#f8fafc' : '#1a1a2e',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>👁️ 实时预览</span>
                  <span style={{ fontSize: '10px', color: '#6c5ce7', fontWeight: 600 }}>
                    {output}
                  </span>
                </div>
                <div style={{ 
                  flex: 1,
                  overflow: 'hidden',
                  background: '#ffffff',
                }}>
                  <iframe
                    ref={iframeRef}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
