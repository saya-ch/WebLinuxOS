import { useState, useCallback, useRef, useEffect } from 'react'

interface CodeSnippet {
  id: string
  title: string
  code: string
  language: string
  createdAt: number
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'HTML', 'CSS',
  'React', 'Vue', 'Node.js', 'SQL', 'Java', 'C++', 'C#'
]

const TEMPLATES = [
  {
    title: 'React 组件',
    code: `import React, { useState } from 'react'

export function MyComponent() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <h1>Hello World</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}`,
    language: 'React'
  },
  {
    title: 'Python 爬虫',
    code: `import requests
from bs4 import BeautifulSoup

def scrape_website(url):
    """简单的网页爬虫示例"""
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # 提取所有链接
    links = [a['href'] for a in soup.find_all('a', href=True)]
    return links

if __name__ == '__main__':
    url = 'https://example.com'
    print(scrape_website(url))`,
    language: 'Python'
  },
  {
    title: 'Node.js API',
    code: `const express = require('express')
const app = express()
const PORT = 3000

app.use(express.json())

// 简单的用户API
app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: '张三' },
    { id: 2, name: '李四' }
  ])
})

app.post('/api/users', (req, res) => {
  const user = req.body
  res.status(201).json(user)
})

app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`)
})`,
    language: 'Node.js'
  },
  {
    title: 'CSS 动画',
    code: `/* 优雅的CSS动画示例 */
.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.glow {
  box-shadow: 0 0 20px rgba(74, 222, 128, 0.5);
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from { box-shadow: 0 0 20px rgba(74, 222, 128, 0.5); }
  to { box-shadow: 0 0 40px rgba(74, 222, 128, 0.8); }
}`,
    language: 'CSS'
  }
]

export default function AICodeAssistant() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('JavaScript')
  const [snippets, setSnippets] = useState<CodeSnippet[]>(() => {
    const saved = localStorage.getItem('weblinux_snippets')
    return saved ? JSON.parse(saved) : []
  })
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是AI代码助手。我可以帮你：\n\n1. 生成代码模板\n2. 解释代码\n3. 修复bug\n4. 优化代码\n\n有什么我可以帮助你的吗？',
      timestamp: Date.now()
    }
  ])
  const [input, setInput] = useState('')
  const [activeTab, setActiveTab] = useState<'editor' | 'chat' | 'snippets'>('editor')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    localStorage.setItem('weblinux_snippets', JSON.stringify(snippets))
  }, [snippets])

  const saveSnippet = useCallback(() => {
    const title = prompt('请输入代码片段标题：') || '未命名'
    const newSnippet: CodeSnippet = {
      id: Date.now().toString(),
      title,
      code,
      language,
      createdAt: Date.now()
    }
    setSnippets(prev => [newSnippet, ...prev])
  }, [code, language])

  const loadSnippet = useCallback((snippet: CodeSnippet) => {
    setCode(snippet.code)
    setLanguage(snippet.language)
    setActiveTab('editor')
  }, [])

  const deleteSnippet = useCallback((id: string) => {
    if (confirm('确定要删除这个代码片段吗？')) {
      setSnippets(prev => prev.filter(s => s.id !== id))
    }
  }, [])

  const generateResponse = useCallback((userInput: string): string => {
    const lowerInput = userInput.toLowerCase()
    
    if (lowerInput.includes('react') || lowerInput.includes('组件')) {
      return '这是一个React组件示例：\n\n```jsx\nimport { useState } from \'react\'\n\nexport function Counter() {\n  const [count, setCount] = useState(0)\n  \n  return (\n    <div>\n      <h2>计数器: {count}</h2>\n      <button onClick={() => setCount(c => c + 1)}>增加</button>\n      <button onClick={() => setCount(c => c - 1)}>减少</button>\n    </div>\n  )\n}\n```\n\n这个组件展示了React useState的基本用法。'
    }
    
    if (lowerInput.includes('python') || lowerInput.includes('爬虫')) {
      return '这是一个Python爬虫示例：\n\n```python\nimport requests\nfrom bs4 import BeautifulSoup\n\ndef scrape(url):\n    res = requests.get(url)\n    soup = BeautifulSoup(res.text, \'html.parser\')\n    return soup.find_all(\'a\')\n```\n\n这使用了requests和BeautifulSoup库来爬取网页内容。'
    }
    
    if (lowerInput.includes('api') || lowerInput.includes('接口')) {
      return '设计RESTful API的最佳实践：\n\n1. 使用名词复数形式 (如 /users, /posts)\n2. 使用正确的HTTP方法 (GET, POST, PUT, DELETE)\n3. 返回合适的状态码\n4. 提供版本控制 (如 /api/v1/users)\n\n示例响应：\n```json\n{\n  "success": true,\n  "data": { "id": 1, "name": "张三" }\n}\n```'
    }
    
    if (lowerInput.includes('css') || lowerInput.includes('动画')) {
      return 'CSS动画技巧：\n\n```css\n.animate {\n  animation: slideIn 0.3s ease-out;\n}\n\n@keyframes slideIn {\n  from {\n    opacity: 0;\n    transform: translateX(-20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateX(0);\n  }\n}\n```\n\n使用CSS变量可以让动画更容易维护。'
    }
    
    return '我理解你的问题了！这里有一些建议：\n\n1. 首先明确你想要实现什么功能\n2. 考虑使用什么技术栈\n3. 从简单的示例开始\n4. 逐步优化和重构\n\n你想让我帮你生成什么类型的代码呢？'
  }, [])

  const sendMessage = useCallback(() => {
    if (!input.trim()) return
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(input),
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, aiMessage])
    }, 800)
  }, [input, generateResponse])

  const formatCode = useCallback(() => {
    try {
      if (language === 'JSON') {
        setCode(JSON.stringify(JSON.parse(code), null, 2))
      } else {
        setCode(code.split('\\n').map(line => line.trim()).join('\\n'))
      }
    } catch {
      alert('代码格式化失败，请检查语法')
    }
  }, [code, language])

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code)
    alert('代码已复制到剪贴板')
  }, [code])

  const clearCode = useCallback(() => {
    if (confirm('确定要清空代码吗？')) {
      setCode('')
    }
  }, [])

  return (
    <div className="app-container" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f23 100%)',
      color: '#fff'
    }}>
      <div style={{
        padding: '16px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <button
          onClick={() => setActiveTab('editor')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'editor' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          ✏️ 代码编辑器
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'chat' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          💬 AI 对话
        </button>
        <button
          onClick={() => setActiveTab('snippets')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'snippets' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.05)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          📚 代码片段
        </button>
      </div>

      {activeTab === 'editor' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={formatCode}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(74, 222, 128, 0.2)',
                  color: '#4ade80',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s ease'
                }}
              >
                🎨 格式化
              </button>
              <button
                onClick={copyCode}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s ease'
                }}
              >
                📋 复制
              </button>
              <button
                onClick={saveSnippet}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s ease'
                }}
              >
                💾 保存
              </button>
              <button
                onClick={clearCode}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s ease'
                }}
              >
                🗑️ 清空
              </button>
            </div>
          </div>

          <div style={{ flex: 1, padding: '16px', overflow: 'hidden' }}>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="在此输入代码..."
              style={{
                width: '100%',
                height: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '16px',
                color: '#e0e0e0',
                fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'none',
                outline: 'none'
              }}
              spellCheck={false}
            />
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>快速模板：</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TEMPLATES.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCode(template.code)
                    setLanguage(template.language)
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#a0a0c0',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {template.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(255,255,255,0.05)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div style={{
            padding: '16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            gap: '12px'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="输入你的问题..."
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
            >
              发送 🚀
            </button>
          </div>
        </div>
      )}

      {activeTab === 'snippets' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {snippets.map((snippet) => (
              <div
                key={snippet.id}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0' }}>{snippet.title}</h3>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                      {snippet.language} · {new Date(snippet.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteSnippet(snippet.id)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️
                  </button>
                </div>
                <pre style={{
                  margin: '0',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '150px',
                  color: 'rgba(255,255,255,0.8)'
                }}>
                  {snippet.code.length > 300 ? snippet.code.slice(0, 300) + '...' : snippet.code}
                </pre>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => loadSnippet(snippet)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'rgba(74, 222, 128, 0.2)',
                      color: '#4ade80',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    加载
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(snippet.code)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#60a5fa',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    📋
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {snippets.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'rgba(255,255,255,0.5)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
              <p>还没有保存任何代码片段</p>
              <p style={{ fontSize: '14px' }}>在代码编辑器中保存你的第一个片段吧！</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
