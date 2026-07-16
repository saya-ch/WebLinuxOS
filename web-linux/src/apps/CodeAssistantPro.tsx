import { useState, useCallback, useEffect } from 'react'
import { useStore } from '../store'

interface CodeSnippet {
  id: string
  title: string
  language: string
  code: string
  description: string
  tags: string[]
  createdAt: string
}

export default function CodeAssistantPro() {
  const [activeTab, setActiveTab] = useState<'snippets' | 'ai-help' | 'docs'>('snippets')
  const [snippets, setSnippets] = useState<CodeSnippet[]>(() => {
    const saved = localStorage.getItem('weblinux-code-snippets')
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        title: 'React useEffect Hook',
        language: 'typescript',
        code: `useEffect(() => {
  // Effect logic here
  
  return () => {
    // Cleanup logic
  };
}, [dependencies]);`,
        description: 'React useEffect hook for side effects',
        tags: ['react', 'hooks', 'typescript'],
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Async/Await Error Handling',
        language: 'javascript',
        code: `async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}`,
        description: 'Proper async/await error handling pattern',
        tags: ['javascript', 'async', 'error-handling'],
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'CSS Flexbox Center',
        language: 'css',
        code: `.container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}`,
        description: 'Center elements using flexbox',
        tags: ['css', 'flexbox', 'layout'],
        createdAt: new Date().toISOString(),
      },
    ]
  })
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null)
  const [newSnippet, setNewSnippet] = useState({ title: '', language: 'javascript', code: '', description: '', tags: '' })
  const [showNewSnippet, setShowNewSnippet] = useState(false)
  const [aiQuery, setAiQuery] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLanguage, setFilterLanguage] = useState('all')

  const addNotification = useStore((s) => s.addNotification)

  useEffect(() => {
    localStorage.setItem('weblinux-code-snippets', JSON.stringify(snippets))
  }, [snippets])

  const languages = ['all', 'javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust', 'css', 'html', 'sql', 'bash', 'json']

  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesLanguage = filterLanguage === 'all' || snippet.language === filterLanguage
    return matchesSearch && matchesLanguage
  })

  const handleAddSnippet = useCallback(() => {
    if (!newSnippet.title.trim() || !newSnippet.code.trim()) {
      addNotification({ title: '错误', message: '标题和代码不能为空', type: 'error' })
      return
    }
    const snippet: CodeSnippet = {
      id: Date.now().toString(),
      title: newSnippet.title.trim(),
      language: newSnippet.language,
      code: newSnippet.code.trim(),
      description: newSnippet.description.trim(),
      tags: newSnippet.tags.split(',').map(t => t.trim()).filter(t => t),
      createdAt: new Date().toISOString(),
    }
    setSnippets(prev => [snippet, ...prev])
    setShowNewSnippet(false)
    setNewSnippet({ title: '', language: 'javascript', code: '', description: '', tags: '' })
    addNotification({ title: '成功', message: '代码片段已保存', type: 'success' })
  }, [newSnippet, addNotification])

  const handleDeleteSnippet = useCallback((id: string) => {
    setSnippets(prev => prev.filter(s => s.id !== id))
    if (selectedSnippet?.id === id) {
      setSelectedSnippet(null)
    }
    addNotification({ title: '已删除', message: '代码片段已删除', type: 'info' })
  }, [selectedSnippet, addNotification])

  const handleCopyCode = useCallback(async (code: string) => {
    await navigator.clipboard.writeText(code)
    addNotification({ title: '已复制', message: '代码已复制到剪贴板', type: 'success' })
  }, [addNotification])

  const handleAiQuery = useCallback(async () => {
    if (!aiQuery.trim()) return
    setIsAiLoading(true)
    setAiResponse('')
    
    try {
      const prompt = encodeURIComponent(aiQuery)
      const response = await fetch(`https://api.codex.openai.com/v1/complete?prompt=${prompt}&max_tokens=500`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('API request failed')
      }
      
      const data = await response.json()
      setAiResponse(data.choices?.[0]?.text || data.message || '无法获取响应')
    } catch (error) {
      setAiResponse(`❌ API请求失败，使用本地代码分析:\n\n${analyzeCodeLocally(aiQuery)}`)
    } finally {
      setIsAiLoading(false)
    }
  }, [aiQuery])

  function analyzeCodeLocally(query: string): string {
    const analysis: Record<string, string> = {
      'react': 'React是一个用于构建用户界面的JavaScript库。核心概念包括组件、props、state、hooks和虚拟DOM。',
      'typescript': 'TypeScript是JavaScript的超集，添加了静态类型检查。常用特性包括接口、类型别名、泛型、装饰器等。',
      'hook': 'React Hooks允许在函数组件中使用状态和其他React特性。常用hooks包括useState、useEffect、useContext等。',
      'async': '异步编程是处理耗时操作的方式。JavaScript中常用async/await语法来处理Promise。',
      'css': 'CSS用于样式设计。现代CSS包括Flexbox、Grid、动画、变量等特性。',
      'git': 'Git是版本控制系统。常用命令包括git commit、git push、git pull、git branch等。',
      'node': 'Node.js是JavaScript运行时。常用模块包括fs、http、path等。',
    }
    
    for (const [keyword, info] of Object.entries(analysis)) {
      if (query.toLowerCase().includes(keyword)) {
        return info
      }
    }
    
    return `查询分析: "${query}"\n\n这是一个代码相关的查询。WebLinuxOS的代码助手可以帮助您:\n• 存储和管理代码片段\n• 获取编程问题的解答\n• 学习新的编程语言和技术\n\n尝试搜索特定的技术关键词如: react, typescript, css, git`
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1a1a2e' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(108, 92, 231, 0.3)', background: '#16162a' }}>
        {(['snippets', 'ai-help', 'docs'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === tab ? 'rgba(108, 92, 231, 0.2)' : 'transparent',
              border: 'none',
              color: activeTab === tab ? '#9b8af0' : '#9090c0',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeTab === tab ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            {tab === 'snippets' && '📚'}
            {tab === 'ai-help' && '🤖'}
            {tab === 'docs' && '📖'}
            {tab === 'snippets' && '代码片段'}
            {tab === 'ai-help' && 'AI助手'}
            {tab === 'docs' && '开发文档'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {activeTab === 'snippets' && (
          <>
            <div style={{ width: 300, borderRight: '1px solid rgba(108, 92, 231, 0.3)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px', borderBottom: '1px solid rgba(108, 92, 231, 0.2)' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索代码片段..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#0f0f1a',
                    border: '1px solid rgba(108, 92, 231, 0.3)',
                    borderRadius: 6,
                    color: '#f0f0ff',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 4, borderBottom: '1px solid rgba(108, 92, 231, 0.2)' }}>
                {languages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => setFilterLanguage(lang)}
                    style={{
                      padding: '4px 8px',
                      background: filterLanguage === lang ? 'rgba(108, 92, 231, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid transparent',
                      borderRadius: 4,
                      color: filterLanguage === lang ? '#9b8af0' : '#9090c0',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {filteredSnippets.map(snippet => (
                  <div
                    key={snippet.id}
                    onClick={() => setSelectedSnippet(snippet)}
                    style={{
                      padding: '10px',
                      marginBottom: 6,
                      background: selectedSnippet?.id === snippet.id ? 'rgba(108, 92, 231, 0.2)' : '#16162a',
                      border: `1px solid ${selectedSnippet?.id === snippet.id ? 'rgba(108, 92, 231, 0.5)' : 'transparent'}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ color: '#f0f0ff', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                      {snippet.title}
                    </div>
                    <div style={{ color: '#9090c0', fontSize: 11 }}>
                      {snippet.language}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
                      {snippet.tags.slice(0, 3).map(tag => (
                        <span key={tag} style={{ fontSize: 10, color: '#7c6cf0', background: 'rgba(124, 108, 240, 0.2)', padding: '2px 6px', borderRadius: 3 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredSnippets.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 20px' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                    <div>没有找到匹配的代码片段</div>
                  </div>
                )}
              </div>
              <div style={{ padding: '12px', borderTop: '1px solid rgba(108, 92, 231, 0.3)' }}>
                <button
                  onClick={() => setShowNewSnippet(true)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'linear-gradient(135deg, #7c6cf0, #9b8af0)',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  + 添加新片段
                </button>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {selectedSnippet ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid rgba(108, 92, 231, 0.3)', background: '#16162a' }}>
                    <div>
                      <div style={{ color: '#f0f0ff', fontSize: 14, fontWeight: 500 }}>{selectedSnippet.title}</div>
                      <div style={{ color: '#9090c0', fontSize: 12, marginTop: 2 }}>{selectedSnippet.description}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleCopyCode(selectedSnippet.code)}
                        style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 4, color: '#10b981', cursor: 'pointer', fontSize: 12 }}
                      >
                        📋 复制
                      </button>
                      <button
                        onClick={() => handleDeleteSnippet(selectedSnippet.id)}
                        style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 4, color: '#ef4444', cursor: 'pointer', fontSize: 12 }}
                      >
                        🗑 删除
                      </button>
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
                    <pre style={{ background: '#0f0f1a', padding: '16px', borderRadius: 8, color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {selectedSnippet.code}
                    </pre>
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                    <div style={{ fontSize: 16, marginBottom: 8 }}>选择一个代码片段</div>
                    <div style={{ fontSize: 13 }}>或创建新的代码片段</div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'ai-help' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}>
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiQuery()}
                placeholder="输入编程问题或代码请求..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#0f0f1a',
                  border: '1px solid rgba(108, 92, 231, 0.3)',
                  borderRadius: 8,
                  color: '#f0f0ff',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAiQuery}
                disabled={isAiLoading}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: '10px',
                  background: 'linear-gradient(135deg, #7c6cf0, #9b8af0)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  opacity: isAiLoading ? 0.7 : 1,
                }}
              >
                {isAiLoading ? '⏳ 思考中...' : '🤖 获取答案'}
              </button>
            </div>
            {aiResponse && (
              <div style={{ flex: 1, background: '#0f0f1a', border: '1px solid rgba(108, 92, 231, 0.2)', borderRadius: 8, padding: '16px', overflowY: 'auto' }}>
                <pre style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {aiResponse}
                </pre>
              </div>
            )}
            {!aiResponse && !isAiLoading && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
                  <div style={{ fontSize: 16, marginBottom: 8 }}>AI代码助手</div>
                  <div style={{ fontSize: 13, maxWidth: 300 }}>
                    询问编程问题、获取代码示例、学习新的编程语言和技术
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'docs' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <div style={{ color: '#9b8af0', fontSize: 20, fontWeight: 600, marginBottom: 16 }}>📖 开发文档</div>
              
              <div style={{ background: '#16162a', padding: '16px', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ color: '#f0f0ff', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>React Hooks 速查表</div>
                <div style={{ color: '#9090c0', fontSize: 13, lineHeight: 1.8 }}>
                  <div><strong style={{ color: '#7c6cf0' }}>useState</strong> - 管理组件状态</div>
                  <div><strong style={{ color: '#7c6cf0' }}>useEffect</strong> - 处理副作用</div>
                  <div><strong style={{ color: '#7c6cf0' }}>useContext</strong> - 访问上下文</div>
                  <div><strong style={{ color: '#7c6cf0' }}>useReducer</strong> - 复杂状态管理</div>
                  <div><strong style={{ color: '#7c6cf0' }}>useCallback</strong> - 缓存函数引用</div>
                  <div><strong style={{ color: '#7c6cf0' }}>useMemo</strong> - 缓存计算结果</div>
                </div>
              </div>

              <div style={{ background: '#16162a', padding: '16px', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ color: '#f0f0ff', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>TypeScript 类型注解</div>
                <div style={{ color: '#9090c0', fontSize: 13, lineHeight: 1.8 }}>
                  <div><code style={{ background: '#0f0f1a', padding: '2px 6px', borderRadius: 3 }}>string</code> - 字符串类型</div>
                  <div><code style={{ background: '#0f0f1a', padding: '2px 6px', borderRadius: 3 }}>number</code> - 数字类型</div>
                  <div><code style={{ background: '#0f0f1a', padding: '2px 6px', borderRadius: 3 }}>boolean</code> - 布尔类型</div>
                  <div><code style={{ background: '#0f0f1a', padding: '2px 6px', borderRadius: 3 }}>any</code> - 任意类型</div>
                  <div><code style={{ background: '#0f0f1a', padding: '2px 6px', borderRadius: 3 }}>unknown</code> - 未知类型</div>
                  <div><code style={{ background: '#0f0f1a', padding: '2px 6px', borderRadius: 3 }}>void</code> - 无返回值</div>
                </div>
              </div>

              <div style={{ background: '#16162a', padding: '16px', borderRadius: 8 }}>
                <div style={{ color: '#f0f0ff', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Git 常用命令</div>
                <div style={{ color: '#9090c0', fontSize: 13, lineHeight: 1.8 }}>
                  <div><code style={{ background: '#0f0f1a', padding: '2px 6px', borderRadius: 3 }}>git status</code> - 查看状态</div>
                  <div><code style={{ background: '#0f0f1a', padding: '2px 6px', borderRadius: 3 }}>git add .</code> - 暂存所有文件</div>
                  <div><code style={{ background: '#0f0f1a', padding: '2px 6px', borderRadius: 3 }}>git commit -m "message"</code> - 提交更改</div>
                  <div><code style={{ background: '#0f0f1a', padding: '2px 6px', borderRadius: 3 }}>git push origin main</code> - 推送到远程</div>
                  <div><code style={{ background: '#0f0f1a', padding: '2px 6px', borderRadius: 3 }}>git pull</code> - 拉取最新代码</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showNewSnippet && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1a1a2e', border: '1px solid rgba(108, 92, 231, 0.3)', borderRadius: 12, padding: '20px', width: '480px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ color: '#f0f0ff', fontSize: 16, fontWeight: 500 }}>添加代码片段</div>
              <button onClick={() => setShowNewSnippet(false)} style={{ background: 'transparent', border: 'none', color: '#9090c0', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: '#9090c0', fontSize: 12, display: 'block', marginBottom: 4 }}>标题</label>
              <input
                type="text"
                value={newSnippet.title}
                onChange={(e) => setNewSnippet(prev => ({ ...prev, title: e.target.value }))}
                placeholder="代码片段标题"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#0f0f1a',
                  border: '1px solid rgba(108, 92, 231, 0.3)',
                  borderRadius: 6,
                  color: '#f0f0ff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ color: '#9090c0', fontSize: 12, display: 'block', marginBottom: 4 }}>语言</label>
              <select
                value={newSnippet.language}
                onChange={(e) => setNewSnippet(prev => ({ ...prev, language: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#0f0f1a',
                  border: '1px solid rgba(108, 92, 231, 0.3)',
                  borderRadius: 6,
                  color: '#f0f0ff',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                {languages.filter(l => l !== 'all').map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ color: '#9090c0', fontSize: 12, display: 'block', marginBottom: 4 }}>代码</label>
              <textarea
                value={newSnippet.code}
                onChange={(e) => setNewSnippet(prev => ({ ...prev, code: e.target.value }))}
                placeholder="粘贴代码..."
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0f0f1a',
                  border: '1px solid rgba(108, 92, 231, 0.3)',
                  borderRadius: 6,
                  color: '#f0f0ff',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ color: '#9090c0', fontSize: 12, display: 'block', marginBottom: 4 }}>描述</label>
              <input
                type="text"
                value={newSnippet.description}
                onChange={(e) => setNewSnippet(prev => ({ ...prev, description: e.target.value }))}
                placeholder="代码描述"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#0f0f1a',
                  border: '1px solid rgba(108, 92, 231, 0.3)',
                  borderRadius: 6,
                  color: '#f0f0ff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#9090c0', fontSize: 12, display: 'block', marginBottom: 4 }}>标签（逗号分隔）</label>
              <input
                type="text"
                value={newSnippet.tags}
                onChange={(e) => setNewSnippet(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="react, hooks, typescript"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#0f0f1a',
                  border: '1px solid rgba(108, 92, 231, 0.3)',
                  borderRadius: 6,
                  color: '#f0f0ff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowNewSnippet(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(108, 92, 231, 0.3)',
                  borderRadius: 6,
                  color: '#9090c0',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                取消
              </button>
              <button
                onClick={handleAddSnippet}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'linear-gradient(135deg, #7c6cf0, #9b8af0)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}