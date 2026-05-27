import { useState, useCallback, useEffect } from 'react'
import { useStore } from '../store'

type CodeIssue = {
  type: 'error' | 'warning' | 'suggestion' | 'performance'
  severity: 'high' | 'medium' | 'low'
  line?: number
  message: string
  fix?: string
  description: string
}

type ReviewResult = {
  score: number
  issues: CodeIssue[]
  summary: string
  suggestions: string[]
}

const defaultCode = `// 请在这里粘贴或输入你的代码进行审查
function calculateSum(numbers) {
  var result = 0;
  for (let i = 0; i < numbers.length; i++) {
    result = result + numbers[i]
  }
  return result;
}

const data = [1, 2, 3, 4, 5];
console.log(calculateSum(data));

// 让 AI 助手帮你找出问题和优化建议
`

export default function CodeReviewer() {
  const theme = useStore((s) => s.theme)
  const [code, setCode] = useState(defaultCode)
  const [language, setLanguage] = useState<'javascript' | 'python' | 'typescript' | 'html' | 'css'>('javascript')
  const [reviewing, setReviewing] = useState(false)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [autoReview, setAutoReview] = useState(true)

  const reviewCode = useCallback(() => {
    if (!code.trim()) return
    
    setReviewing(true)
    
    // 模拟 AI 代码审查
    setTimeout(() => {
      const issues: CodeIssue[] = []
      const suggestions: string[] = []
      
      // 基础代码分析
      const lines = code.split('\n')
      
      // 检查变量声明
      if (code.includes('var ')) {
        issues.push({
          type: 'suggestion',
          severity: 'medium',
          line: lines.findIndex(line => line.includes('var ')) + 1,
          message: '使用 var 声明变量',
          description: '建议使用 const 或 let 替代 var，以获得更好的作用域控制',
          fix: '将 var 替换为 const 或 let'
        })
      }
      
      // 检查分号
      const missingSemicolons = lines.filter(line => {
        const trimmed = line.trim()
        return trimmed.length > 0 && 
               !trimmed.startsWith('//') && 
               !trimmed.startsWith('/*') &&
               !trimmed.endsWith(';') &&
               !trimmed.endsWith('{') &&
               !trimmed.endsWith('}') &&
               !trimmed.endsWith(',') &&
               !trimmed.endsWith('(')
      })
      
      if (missingSemicolons.length > 3) {
        issues.push({
          type: 'warning',
          severity: 'low',
          message: '缺少分号',
          description: '部分语句结尾缺少分号，可能导致自动分号插入问题',
          fix: '在语句结尾添加分号'
        })
      }
      
      // 检查可简化的操作
      if (code.includes('result = result +')) {
        issues.push({
          type: 'performance',
          severity: 'low',
          line: lines.findIndex(line => line.includes('result = result +')) + 1,
          message: '可简化的赋值操作',
          description: '可以使用 += 操作符简化代码',
          fix: '替换为 result += numbers[i]'
        })
      }
      
      // 检查是否可以使用数组方法
      if (code.includes('for (let i') && code.includes('.length')) {
        suggestions.push('考虑使用数组方法如 reduce()、map() 或 forEach() 来替代传统 for 循环')
      }
      
      // 检查函数命名
      if (code.includes('function ')) {
        suggestions.push('考虑使用箭头函数或函数表达式获得更简洁的语法')
      }
      
      // 通用最佳实践
      suggestions.push('添加 JSDoc 注释来提高代码可读性')
      suggestions.push('考虑添加单元测试来确保代码质量')
      suggestions.push('使用 TypeScript 可以提供更好的类型安全性')
      
      // 计算分数 (0-100)
      let score = 85
      score -= issues.filter(i => i.severity === 'high').length * 15
      score -= issues.filter(i => i.severity === 'medium').length * 8
      score -= issues.filter(i => i.severity === 'low').length * 3
      score = Math.max(0, Math.min(100, score))
      
      // 生成摘要
      const generateSummary = (s: number): string => {
        if (s >= 90) {
          return '优秀！代码质量很好，只有一些小的改进建议。'
        } else if (s >= 70) {
          return '良好！代码整体不错，但有一些可以优化的地方。'
        } else if (s >= 50) {
          return '一般。建议修复发现的问题以提高代码质量。'
        } else {
          return '需要改进。请重点关注高优先级的问题。'
        }
      }
      
      if (issues.length === 0) {
        issues.push({
          type: 'suggestion',
          severity: 'low',
          message: '未发现明显问题',
          description: '代码看起来不错！继续保持良好的编码习惯。',
        })
      }
      
      setResult({
        score,
        issues,
        summary: generateSummary(score),
        suggestions
      })
      
      setReviewing(false)
    }, 1000)
  }, [code])

  // 自动审查（防抖）
  useEffect(() => {
    if (autoReview) {
      const timer = setTimeout(() => {
        reviewCode()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [code, autoReview, reviewCode])

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4ade80'
    if (score >= 70) return '#facc15'
    if (score >= 50) return '#f97316'
    return '#f44747'
  }

  const getIssueIcon = (type: CodeIssue['type']) => {
    switch (type) {
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'suggestion': return '💡'
      case 'performance': return '⚡'
      default: return '📝'
    }
  }

  const getSeverityColor = (severity: CodeIssue['severity']) => {
    switch (severity) {
      case 'high': return '#f44747'
      case 'medium': return '#f97316'
      case 'low': return '#facc15'
      default: return '#94a3b8'
    }
  }

  const loadExample = useCallback((exampleType: string) => {
    switch (exampleType) {
      case 'javascript':
        setCode(`// JavaScript 示例代码
function fetchData(url) {
  return fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log('Data received:', data);
      return data;
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

// 使用 async/await 可以让代码更清晰
async function fetchDataAsync(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Data received:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}`)
        setLanguage('javascript')
        break
      case 'react':
        setCode(`// React 组件示例
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch(\`/api/users/\${userId}\`);
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadUser();
  }, [userId]); // 注意：userId 在依赖数组中
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <div>User not found</div>;
  }
  
  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}`)
        setLanguage('javascript')
        break
      case 'typescript':
        setCode(`// TypeScript 示例代码
interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

class UserService {
  private users: User[] = [];
  
  addUser(user: User): void {
    this.users.push(user);
  }
  
  getUserById(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }
  
  getActiveUsers(): User[] {
    return this.users.filter(u => u.isActive);
  }
}

// 使用示例
const service = new UserService();
service.addUser({
  id: 1,
  name: '张三',
  email: 'zhangsan@example.com',
  isActive: true
});`)
        setLanguage('typescript')
        break
    }
  }, [])

  return (
    <div 
      className="app-container"
      style={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: theme === 'light' ? '#f8fafc' : '#0f172a',
        color: theme === 'light' ? '#1e293b' : '#e2e8f0',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{ 
        padding: '16px 20px',
        borderBottom: `1px solid ${theme === 'light' ? '#e2e8f0' : '#1e293b'}`,
        background: theme === 'light' ? '#ffffff' : '#1e293b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🔍</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px' }}>代码审查助手</div>
            <div style={{ fontSize: '12px', color: theme === 'light' ? '#64748b' : '#94a3b8' }}>
              AI 驱动的代码质量分析
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'javascript' | 'python' | 'typescript' | 'html' | 'css')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${theme === 'light' ? '#cbd5e1' : '#334155'}`,
              background: theme === 'light' ? '#f8fafc' : '#0f172a',
              color: 'inherit',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={autoReview} 
              onChange={(e) => setAutoReview(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            自动审查
          </label>
          
          <button
            onClick={reviewCode}
            disabled={reviewing}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: reviewing ? '#64748b' : '#6366f1',
              color: '#fff',
              cursor: reviewing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {reviewing ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                审查中...
              </>
            ) : (
              <>
                <span>🔍</span>
                立即审查
              </>
            )}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Code Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${theme === 'light' ? '#e2e8f0' : '#1e293b'}` }}>
          <div style={{ 
            padding: '12px 16px',
            borderBottom: `1px solid ${theme === 'light' ? '#e2e8f0' : '#1e293b'}`,
            background: theme === 'light' ? '#f1f5f9' : '#1a2332',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 600, fontSize: '13px' }}>代码输入</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => loadExample('javascript')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'light' ? '#cbd5e1' : '#334155'}`,
                  background: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                JS 示例
              </button>
              <button
                onClick={() => loadExample('react')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'light' ? '#cbd5e1' : '#334155'}`,
                  background: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                React 示例
              </button>
              <button
                onClick={() => loadExample('typescript')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'light' ? '#cbd5e1' : '#334155'}`,
                  background: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                TS 示例
              </button>
            </div>
          </div>
          
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              flex: 1,
              padding: '16px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: '14px',
              lineHeight: '1.6',
              background: theme === 'light' ? '#ffffff' : '#0f172a',
              color: 'inherit'
            }}
            placeholder="在此粘贴或输入代码进行审查..."
          />
        </div>

        {/* Right: Results */}
        <div style={{ width: '500px', display: 'flex', flexDirection: 'column', background: theme === 'light' ? '#f8fafc' : '#111827' }}>
          {/* Score Card */}
          {result && (
            <div style={{ 
              padding: '20px',
              borderBottom: `1px solid ${theme === 'light' ? '#e2e8f0' : '#1e293b'}`,
              background: theme === 'light' ? '#ffffff' : '#1e293b'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>代码质量评分</span>
                <div 
                  style={{
                    fontSize: '48px',
                    fontWeight: 800,
                    color: getScoreColor(result.score),
                    textShadow: `0 0 20px ${getScoreColor(result.score)}33`
                  }}
                >
                  {result.score}
                </div>
              </div>
              <div style={{ 
                height: '8px',
                background: theme === 'light' ? '#e2e8f0' : '#334155',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div 
                  style={{
                    height: '100%',
                    width: `${result.score}%`,
                    background: `linear-gradient(90deg, ${getScoreColor(result.score)}, ${getScoreColor(result.score)}99)`,
                    borderRadius: '4px',
                    transition: 'width 0.5s ease'
                  }}
                />
              </div>
              <p style={{ marginTop: '12px', fontSize: '14px', color: theme === 'light' ? '#475569' : '#94a3b8', lineHeight: '1.5' }}>
                {result.summary}
              </p>
            </div>
          )}

          {/* Issues */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
            {result && result.issues.length > 0 ? (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700 }}>
                  发现的问题 ({result.issues.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.issues.map((issue, index) => (
                    <div 
                      key={index}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: theme === 'light' ? '#ffffff' : '#1e293b',
                        border: `1px solid ${theme === 'light' ? '#e2e8f0' : '#334155'}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{getIssueIcon(issue.type)}</span>
                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{issue.message}</span>
                        {issue.line && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: theme === 'light' ? '#f1f5f9' : '#334155',
                            color: theme === 'light' ? '#64748b' : '#94a3b8'
                          }}>
                            第 {issue.line} 行
                          </span>
                        )}
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: `${getSeverityColor(issue.severity)}22`,
                          color: getSeverityColor(issue.severity),
                          marginLeft: 'auto'
                        }}>
                          {issue.severity === 'high' ? '高' : issue.severity === 'medium' ? '中' : '低'}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: theme === 'light' ? '#475569' : '#94a3b8', lineHeight: '1.5' }}>
                        {issue.description}
                      </p>
                      {issue.fix && (
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: theme === 'light' ? '#f0fdf4' : '#1a2d1e',
                          color: theme === 'light' ? '#166534' : '#4ade80',
                          fontSize: '12px',
                          fontWeight: 500
                        }}>
                          🔧 {issue.fix}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Suggestions */}
            {result && result.suggestions.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700 }}>
                  改进建议
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {result.suggestions.map((suggestion, index) => (
                    <div 
                      key={index}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: theme === 'light' ? '#fef3c7' : '#2d2a14',
                        border: `1px solid ${theme === 'light' ? '#fcd34d' : '#4d4420'}`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>💡</span>
                      <span style={{ fontSize: '13px', lineHeight: '1.5' }}>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Placeholder */}
            {!result && !reviewing && (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                color: theme === 'light' ? '#94a3b8' : '#64748b'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
                <div style={{ fontSize: '16px', marginBottom: '8px', fontWeight: 600 }}>
                  输入代码开始审查
                </div>
                <div style={{ fontSize: '13px' }}>
                  点击"立即审查"或启用自动审查
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
