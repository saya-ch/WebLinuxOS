import { useState, useCallback, memo, useRef } from 'react'

interface CodeSnippet {
  id: string
  title: string
  language: string
  code: string
  description: string
  tags: string[]
}

const defaultSnippets: CodeSnippet[] = [
  {
    id: '1',
    title: 'React useState Hook',
    language: 'typescript',
    code: `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}`,
    description: 'Basic React counter using useState hook',
    tags: ['react', 'hooks', 'state']
  },
  {
    id: '2',
    title: 'Python List Comprehension',
    language: 'python',
    code: `# Square numbers from 1 to 10
squares = [x**2 for x in range(1, 11)]

# Filter even numbers
evens = [x for x in range(20) if x % 2 == 0]

# Nested comprehension
matrix = [[i*j for j in range(5)] for i in range(5)]`,
    description: 'Python list comprehension examples',
    tags: ['python', 'list', 'comprehension']
  },
  {
    id: '3',
    title: 'JavaScript Fetch API',
    language: 'javascript',
    code: `// GET request
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// POST request
async function postData(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return response.json();
}`,
    description: 'Modern fetch API patterns with async/await',
    tags: ['javascript', 'fetch', 'async', 'api']
  },
  {
    id: '4',
    title: 'CSS Flexbox Layout',
    language: 'css',
    code: `.flex-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.flex-item {
  flex: 1;
  min-width: 0;
}

.centered {
  display: flex;
  justify-content: center;
  align-items: center;
}`,
    description: 'Common flexbox layout patterns',
    tags: ['css', 'flexbox', 'layout']
  },
  {
    id: '5',
    title: 'Go HTTP Server',
    language: 'go',
    code: `package main

import (
    "fmt"
    "net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, %s!", r.URL.Path[1:])
}

func main() {
    http.HandleFunc("/", handler)
    http.ListenAndServe(":8080", nil)
}`,
    description: 'Simple Go HTTP server',
    tags: ['go', 'http', 'server']
  }
]

const languageIcons: Record<string, string> = {
  javascript: '📜',
  typescript: '📘',
  python: '🐍',
  go: '🐹',
  rust: '🦀',
  java: '☕',
  cpp: '⚙️',
  css: '🎨',
  html: '🌐',
  sql: '🗄️',
  bash: '🖥️',
  markdown: '📝'
}

const languageColors: Record<string, string> = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  python: '#3776ab',
  go: '#00add8',
  rust: '#dea584',
  java: '#b07219',
  cpp: '#f34b7d',
  css: '#563d7c',
  html: '#e34c26',
  sql: '#336e9b',
  bash: '#89e051',
  markdown: '#083fa1'
}

const AIProgrammingAssistantPro = memo(function AIProgrammingAssistantPro() {
  const [activeTab, setActiveTab] = useState<'generate' | 'explain' | 'optimize' | 'snippets' | 'templates'>('generate')
  const [inputCode, setInputCode] = useState('')
  const [output, setOutput] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('typescript')
  const [prompt, setPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [snippets, setSnippets] = useState<CodeSnippet[]>(defaultSnippets)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newSnippet, setNewSnippet] = useState<Partial<CodeSnippet>>({})
  const outputRef = useRef<HTMLDivElement>(null)

  const languages = ['typescript', 'javascript', 'python', 'go', 'rust', 'java', 'cpp', 'css', 'html', 'sql', 'bash', 'markdown']

  // Simulated AI responses
  const generateCode = useCallback(() => {
    if (!prompt.trim()) return
    setIsProcessing(true)
    
    setTimeout(() => {
      const templates: Record<string, string> = {
        'function': `// Generated function based on your request
function generatedFunction(input: any): any {
  // Implementation based on: "${prompt}"
  const result = processInput(input);
  return result;
}

// Helper function
function processInput(data: any): any {
  // Add your logic here
  return data;
}`,
        'class': `// Generated class based on your request
class GeneratedClass {
  private data: any;
  
  constructor(initialData: any) {
    this.data = initialData;
  }
  
  processData(): any {
    // Implementation for: "${prompt}"
    return this.data;
  }
  
  setData(newData: any): void {
    this.data = newData;
  }
}`,
        'api': `// Generated API handler
async function handle${prompt.replace(/\s+/g, '').slice(0, 20)}(request: Request): Response {
  try {
    const data = await request.json();
    // Process: "${prompt}"
    const result = await processData(data);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Processing failed' }), {
      status: 500
    });
  }
}`,
        'default': `// Code generated for: "${prompt}"
// Language: ${selectedLanguage}

// TODO: Implement the following functionality
// ${prompt}

function main() {
  // Your implementation here
  console.log("Generated code for: ${prompt}");
}

main();`
      }

      const key = prompt.toLowerCase().includes('class') ? 'class' :
                  prompt.toLowerCase().includes('api') || prompt.toLowerCase().includes('endpoint') ? 'api' :
                  prompt.toLowerCase().includes('function') ? 'function' : 'default'

      setOutput(templates[key])
      setIsProcessing(false)
    }, 1500)
  }, [prompt, selectedLanguage])

  const explainCode = useCallback(() => {
    if (!inputCode.trim()) return
    setIsProcessing(true)
    
    setTimeout(() => {
      const lines = inputCode.split('\n')
      const explanation = `## Code Analysis

### Overview
This code contains ${lines.length} lines and appears to be written in ${selectedLanguage}.

### Structure Analysis
${lines.slice(0, 10).map((line, i) => {
  if (line.trim().startsWith('function') || line.trim().startsWith('def')) {
    return `**Line ${i + 1}**: Function definition detected`
  }
  if (line.trim().startsWith('class')) {
    return `**Line ${i + 1}**: Class definition detected`
  }
  if (line.trim().startsWith('import') || line.trim().startsWith('from')) {
    return `**Line ${i + 1}**: Import statement`
  }
  if (line.trim().startsWith('const') || line.trim().startsWith('let') || line.trim().startsWith('var')) {
    return `**Line ${i + 1}**: Variable declaration`
  }
  if (line.trim().startsWith('return')) {
    return `**Line ${i + 1}**: Return statement`
  }
  return null
}).filter(Boolean).join('\n')}

### Key Components
- **Functions**: ${inputCode.match(/function|def/g)?.length || 0} detected
- **Classes**: ${inputCode.match(/class/g)?.length || 0} detected
- **Imports**: ${inputCode.match(/import|from/g)?.length || 0} detected
- **Variables**: ${inputCode.match(/const|let|var|=/g)?.length || 0} declarations

### Suggestions
1. Consider adding type annotations for better type safety
2. Add error handling for edge cases
3. Include documentation/comments for complex logic
4. Follow consistent naming conventions`
      
      setOutput(explanation)
      setIsProcessing(false)
    }, 1500)
  }, [inputCode, selectedLanguage])

  const optimizeCode = useCallback(() => {
    if (!inputCode.trim()) return
    setIsProcessing(true)
    
    setTimeout(() => {
      const optimization = `## Optimization Suggestions

### Performance Improvements
1. **Avoid repeated calculations**: Cache results of expensive operations
2. **Use efficient data structures**: Consider using Map/Set instead of Object/Array for lookups
3. **Minimize DOM operations**: Batch updates when possible

### Code Quality
1. **Add type safety**: Use TypeScript interfaces/types
2. **Error handling**: Add try-catch blocks for async operations
3. **Code organization**: Split large functions into smaller, focused ones

### Optimized Version
\`\`\`${selectedLanguage}
// Before optimization:
${inputCode.slice(0, 200)}...

// After optimization (suggestions applied):
// - Added caching for repeated operations
// - Improved error handling
// - Better type annotations
// - Cleaner function decomposition

// Implement the suggested changes for better performance
\`\`\`

### Estimated Improvement
- **Performance**: 20-40% faster execution
- **Memory**: 15-25% reduction in memory usage
- **Readability**: Significantly improved maintainability`
      
      setOutput(optimization)
      setIsProcessing(false)
    }, 1500)
  }, [inputCode, selectedLanguage])

  const filteredSnippets = snippets.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const saveSnippet = useCallback(() => {
    if (!newSnippet.title || !newSnippet.code) return
    const snippet: CodeSnippet = {
      id: Date.now().toString(),
      title: newSnippet.title || '',
      language: newSnippet.language || selectedLanguage,
      code: newSnippet.code || '',
      description: newSnippet.description || '',
      tags: newSnippet.tags || []
    }
    setSnippets(prev => [...prev, snippet])
    setShowSaveDialog(false)
    setNewSnippet({})
  }, [newSnippet, selectedLanguage])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
  }, [])

  return (
    <div className="app-shell" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)',
        background: 'rgba(26, 26, 46, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🤖</span>
          <span style={{ fontSize: '16px', fontWeight: 600 }}>AI 编程助手 Pro</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="app-select"
            style={{ minWidth: '120px' }}
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>
                {languageIcons[lang] || '📄'} {lang.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '8px 16px',
        borderBottom: '1px solid var(--color-border)',
        background: 'rgba(22, 22, 38, 0.3)'
      }}>
        {[
          { id: 'generate', label: '✨ 生成代码', desc: '根据描述生成代码' },
          { id: 'explain', label: '📖 解释代码', desc: '分析代码结构' },
          { id: 'optimize', label: '⚡ 优化代码', desc: '性能优化建议' },
          { id: 'snippets', label: '📚 代码片段', desc: '常用代码库' },
          { id: 'templates', label: '📋 模板', desc: '项目模板' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`app-button ${activeTab === tab.id ? 'app-button-primary' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
            style={{ flex: 1 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, display: 'flex', gap: '16px', padding: '16px', overflow: 'hidden' }}>
        {/* Input Panel */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          minWidth: '300px'
        }}>
          {activeTab === 'generate' && (
            <>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                输入需求描述，AI将生成对应代码
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例如：创建一个处理用户登录的函数，验证邮箱格式..."
                className="app-textarea"
                style={{ flex: 1, minHeight: '150px' }}
              />
              <button
                className="app-button app-button-primary"
                onClick={generateCode}
                disabled={isProcessing || !prompt.trim()}
                style={{ alignSelf: 'flex-end' }}
              >
                {isProcessing ? '⏳ 生成中...' : '✨ 生成代码'}
              </button>
            </>
          )}

          {activeTab === 'explain' && (
            <>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                输入代码，AI将分析其结构和功能
              </div>
              <textarea
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="粘贴需要解释的代码..."
                className="app-textarea"
                style={{ flex: 1, minHeight: '150px' }}
              />
              <button
                className="app-button app-button-primary"
                onClick={explainCode}
                disabled={isProcessing || !inputCode.trim()}
                style={{ alignSelf: 'flex-end' }}
              >
                {isProcessing ? '⏳ 分析中...' : '📖 解释代码'}
              </button>
            </>
          )}

          {activeTab === 'optimize' && (
            <>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                输入代码，AI将提供优化建议
              </div>
              <textarea
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="粘贴需要优化的代码..."
                className="app-textarea"
                style={{ flex: 1, minHeight: '150px' }}
              />
              <button
                className="app-button app-button-primary"
                onClick={optimizeCode}
                disabled={isProcessing || !inputCode.trim()}
                style={{ alignSelf: 'flex-end' }}
              >
                {isProcessing ? '⏳ 分析中...' : '⚡ 优化代码'}
              </button>
            </>
          )}

          {activeTab === 'snippets' && (
            <>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索代码片段..."
                  className="app-input"
                  style={{ flex: 1 }}
                />
                <button
                  className="app-button app-button-primary"
                  onClick={() => setShowSaveDialog(true)}
                >
                  ➕ 添加
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredSnippets.map(snippet => (
                  <div
                    key={snippet.id}
                    className="app-card"
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      borderLeft: `3px solid ${languageColors[snippet.language] || '#7c6cf0'}`
                    }}
                    onClick={() => setSelectedSnippet(snippet)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 124, 240, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = ''}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span>{languageIcons[snippet.language] || '📄'}</span>
                      <span style={{ fontWeight: 500 }}>{snippet.title}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {snippet.language}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {snippet.description}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                      {snippet.tags.map(tag => (
                        <span key={tag} className="chip" style={{ fontSize: '10px' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'templates' && (
            <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {[
                { name: 'React Component', icon: '⚛️', desc: 'React函数组件模板' },
                { name: 'Express Server', icon: '🚂', desc: 'Express.js服务器模板' },
                { name: 'Python Script', icon: '🐍', desc: 'Python脚本模板' },
                { name: 'REST API', icon: '🌐', desc: 'REST API端点模板' },
                { name: 'Database Model', icon: '🗄️', desc: '数据库模型模板' },
                { name: 'Test Suite', icon: '🧪', desc: '测试套件模板' },
                { name: 'CLI Tool', icon: '🖥️', desc: '命令行工具模板' },
                { name: 'Docker Config', icon: '🐳', desc: 'Docker配置模板' }
              ].map(template => (
                <div
                  key={template.name}
                  className="app-card"
                  style={{ cursor: 'pointer', textAlign: 'center' }}
                  onClick={() => {
                    setPrompt(`生成 ${template.name} 模板`)
                    setActiveTab('generate')
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{template.icon}</div>
                  <div style={{ fontWeight: 500 }}>{template.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{template.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Output Panel */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: '300px',
          background: 'rgba(22, 22, 38, 0.5)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>输出结果</span>
            {output && (
              <button
                className="app-button"
                onClick={() => copyToClipboard(output)}
                style={{ fontSize: '12px' }}
              >
                📋 复制
              </button>
            )}
          </div>
          <div
            ref={outputRef}
            style={{
              flex: 1,
              padding: '16px',
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6
            }}
          >
            {isProcessing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                <span className="spin">⏳</span>
                <span>处理中...</span>
              </div>
            ) : selectedSnippet ? (
              <div>
                <div style={{ marginBottom: '12px', fontWeight: 500 }}>
                  {languageIcons[selectedSnippet.language]} {selectedSnippet.title}
                </div>
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '12px',
                  borderRadius: '8px',
                  overflow: 'auto'
                }}>
                  {selectedSnippet.code}
                </pre>
              </div>
            ) : output ? (
              output
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
                选择功能并输入内容开始
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="app-modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="app-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="app-modal-header">
              <span className="app-modal-title">➕ 添加代码片段</span>
              <button className="app-modal-close" onClick={() => setShowSaveDialog(false)}>✕</button>
            </div>
            <div className="app-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  标题
                </label>
                <input
                  type="text"
                  value={newSnippet.title || ''}
                  onChange={(e) => setNewSnippet(prev => ({ ...prev, title: e.target.value }))}
                  className="app-input"
                  style={{ width: '100%' }}
                  placeholder="片段名称"
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  语言
                </label>
                <select
                  value={newSnippet.language || selectedLanguage}
                  onChange={(e) => setNewSnippet(prev => ({ ...prev, language: e.target.value }))}
                  className="app-select"
                  style={{ width: '100%' }}
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  代码
                </label>
                <textarea
                  value={newSnippet.code || ''}
                  onChange={(e) => setNewSnippet(prev => ({ ...prev, code: e.target.value }))}
                  className="app-textarea"
                  style={{ width: '100%', minHeight: '150px' }}
                  placeholder="粘贴代码..."
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  描述
                </label>
                <input
                  type="text"
                  value={newSnippet.description || ''}
                  onChange={(e) => setNewSnippet(prev => ({ ...prev, description: e.target.value }))}
                  className="app-input"
                  style={{ width: '100%' }}
                  placeholder="简要描述"
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  标签（逗号分隔）
                </label>
                <input
                  type="text"
                  value={newSnippet.tags?.join(',') || ''}
                  onChange={(e) => setNewSnippet(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
                  className="app-input"
                  style={{ width: '100%' }}
                  placeholder="react, hooks, state"
                />
              </div>
            </div>
            <div className="app-modal-footer">
              <button className="app-modal-btn app-modal-btn-cancel" onClick={() => setShowSaveDialog(false)}>
                取消
              </button>
              <button className="app-modal-btn" onClick={saveSnippet}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--color-border)',
        fontSize: '11px',
        color: 'var(--text-secondary)',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>语言: {selectedLanguage.toUpperCase()} | 片段: {snippets.length}</span>
        <span>提示: 使用 Ctrl+S 保存当前代码</span>
      </div>
    </div>
  )
})

export default AIProgrammingAssistantPro