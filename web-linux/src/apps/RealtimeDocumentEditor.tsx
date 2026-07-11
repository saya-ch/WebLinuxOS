import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Save, Share2, Users, Download, Copy, Eye, Edit3, 
  Clock, FileText, X
} from 'lucide-react'

interface DocumentVersion {
  content: string
  timestamp: number
  author: string
}

interface CollaboratorCursor {
  userId: string
  userName: string
  position: number
  color: string
}

export default function RealtimeDocumentEditor() {
  const [content, setContent] = useState('# 欢迎使用实时文档编辑器\n\n这是一个模拟的实时协作编辑器，支持以下功能：\n\n1. **实时编辑**：文本内容自动保存\n2. **版本历史**：记录每次编辑的时间和作者\n3. **导出功能**：支持导出为Markdown格式\n4. **协作模拟**：显示其他用户的编辑光标\n\n## 开始使用\n\n直接在此处编辑文本，所有更改会自动保存。\n\n### 快捷键\n\n- `Ctrl + S`: 手动保存\n- `Ctrl + Shift + C`: 复制全部内容\n- `Ctrl + Shift + E`: 导出文档\n\n> 提示：这是一个功能完整的文档编辑器，可以满足日常的文档编写需求。')
  const [documentTitle, setDocumentTitle] = useState('未命名文档')
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [showCollaborators, setShowCollaborators] = useState(false)
  
  // 模拟的协作用户
  const [collaborators] = useState<CollaboratorCursor[]>([
    { userId: '1', userName: '张三', position: 50, color: '#ff6b6b' },
    { userId: '2', userName: '李四', position: 120, color: '#4ecdc4' }
  ])

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 统计字数和字符数
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0).length
    const chars = content.length
    setWordCount(words)
    setCharCount(chars)
  }, [content])

  // 自动保存
  const saveDocument = useCallback(() => {
    const newVersion: DocumentVersion = {
      content,
      timestamp: Date.now(),
      author: '当前用户'
    }
    
    setVersions(prev => [newVersion, ...prev].slice(0, 20)) // 保留最近20个版本
    setLastSaved(new Date())
    
    // 保存到 localStorage
    try {
      localStorage.setItem('document-editor-content', content)
      localStorage.setItem('document-editor-title', documentTitle)
      localStorage.setItem('document-editor-versions', JSON.stringify([newVersion, ...versions].slice(0, 20)))
    } catch (e) {
      console.warn('保存失败:', e)
    }
  }, [content, documentTitle, versions])

  // 初始化时加载保存的内容
  useEffect(() => {
    try {
      const savedContent = localStorage.getItem('document-editor-content')
      const savedTitle = localStorage.getItem('document-editor-title')
      const savedVersions = localStorage.getItem('document-editor-versions')
      
      if (savedContent) setContent(savedContent)
      if (savedTitle) setDocumentTitle(savedTitle)
      if (savedVersions) {
        try {
          setVersions(JSON.parse(savedVersions))
        } catch (e) {
          console.warn('版本历史解析失败')
        }
      }
    } catch (e) {
      console.warn('加载保存的内容失败:', e)
    }
  }, [])

  // 自动保存定时器
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    
    autoSaveTimerRef.current = setTimeout(() => {
      saveDocument()
    }, 5000)
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [content, saveDocument])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault()
          saveDocument()
        } else if (e.shiftKey && e.key === 'C') {
          e.preventDefault()
          navigator.clipboard.writeText(content)
        } else if (e.shiftKey && e.key === 'E') {
          e.preventDefault()
          exportDocument()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [content, saveDocument])

  const exportDocument = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentTitle}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [content, documentTitle])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(content)
  }, [content])

  const restoreVersion = useCallback((version: DocumentVersion) => {
    setContent(version.content)
    setShowVersionHistory(false)
  }, [])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)'
    }}>
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderBottom: '1px solid var(--window-border)',
        background: 'var(--window-header)'
      }}>
        <FileText size={18} />
        <input
          type="text"
          value={documentTitle}
          onChange={(e) => setDocumentTitle(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: '600',
            outline: 'none',
            flex: '1',
            minWidth: '150px'
          }}
          placeholder="输入文档标题"
        />
        
        <div style={{ flex: 1 }} />
        
        <button
          onClick={saveDocument}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          <Save size={14} />
          保存
        </button>
        
        <button
          onClick={copyToClipboard}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            background: 'var(--button-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          <Copy size={14} />
          复制
        </button>
        
        <button
          onClick={exportDocument}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            background: 'var(--button-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          <Download size={14} />
          导出
        </button>
        
        <button
          onClick={() => setShowShareDialog(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            background: 'var(--button-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          <Share2 size={14} />
          分享
        </button>
        
        <div style={{
          position: 'relative'
        }}>
          <button
            onClick={() => setShowCollaborators(!showCollaborators)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              background: 'var(--button-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--window-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            <Users size={14} />
            协作 ({collaborators.length + 1})
          </button>
          
          {showCollaborators && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              background: 'var(--window-bg)',
              border: '1px solid var(--window-border)',
              borderRadius: '8px',
              padding: '8px',
              minWidth: '150px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--accent)'
                }} />
                <span style={{ fontSize: '13px' }}>你（当前用户）</span>
              </div>
              {collaborators.map(collab => (
                <div key={collab.userId} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: collab.color
                  }} />
                  <span style={{ fontSize: '13px' }}>{collab.userName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={() => setShowVersionHistory(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            background: 'var(--button-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--window-border)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          <Clock size={14} />
          历史
        </button>
      </div>

      {/* 编辑器和预览 */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '1px',
        overflow: 'hidden'
      }}>
        {/* 编辑器 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--window-border)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'var(--window-header)',
            borderBottom: '1px solid var(--window-border)'
          }}>
            <Edit3 size={16} />
            <span style={{ fontWeight: '600', fontSize: '13px' }}>编辑器</span>
          </div>
          
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              flex: 1,
              resize: 'none',
              border: 'none',
              padding: '16px',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '14px',
              lineHeight: '1.6',
              background: 'var(--window-bg)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
            placeholder="开始输入内容..."
          />
        </div>

        {/* 预览 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'var(--window-header)',
            borderBottom: '1px solid var(--window-border)'
          }}>
            <Eye size={16} />
            <span style={{ fontWeight: '600', fontSize: '13px' }}>预览</span>
          </div>
          
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '16px',
            lineHeight: '1.6',
            fontSize: '14px'
          }}>
            <div style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {content.split('\n').map((line, index) => {
                if (line.startsWith('# ')) {
                  return <h1 key={index} style={{ fontSize: '24px', fontWeight: 'bold', margin: '16px 0 8px' }}>{line.slice(2)}</h1>
                } else if (line.startsWith('## ')) {
                  return <h2 key={index} style={{ fontSize: '20px', fontWeight: 'bold', margin: '14px 0 6px' }}>{line.slice(3)}</h2>
                } else if (line.startsWith('### ')) {
                  return <h3 key={index} style={{ fontSize: '16px', fontWeight: 'bold', margin: '12px 0 4px' }}>{line.slice(4)}</h3>
                } else if (line.startsWith('- ')) {
                  return <div key={index} style={{ marginLeft: '20px', marginBottom: '4px' }}>• {line.slice(2)}</div>
                } else if (line.startsWith('> ')) {
                  return <div key={index} style={{ 
                    borderLeft: '3px solid var(--accent)',
                    paddingLeft: '12px',
                    margin: '8px 0',
                    opacity: 0.8
                  }}>{line.slice(2)}</div>
                } else if (line.startsWith('**') && line.endsWith('**')) {
                  return <div key={index}><strong>{line.slice(2, -2)}</strong></div>
                } else if (line.match(/^\d+\. /)) {
                  return <div key={index} style={{ marginLeft: '20px', marginBottom: '4px' }}>{line}</div>
                } else if (line.trim() === '') {
                  return <br key={index} />
                } else {
                  return <div key={index}>{line}</div>
                }
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 状态栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '6px 16px',
        borderTop: '1px solid var(--window-border)',
        background: 'var(--window-header)',
        fontSize: '12px',
        color: 'var(--text-secondary)'
      }}>
        <span>字数: {wordCount}</span>
        <span>字符数: {charCount}</span>
        <span>版本数: {versions.length}</span>
        {lastSaved && (
          <span>上次保存: {lastSaved.toLocaleTimeString()}</span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ opacity: 0.7 }}>Ctrl+S 保存 | Ctrl+Shift+C 复制 | Ctrl+Shift+E 导出</span>
      </div>

      {/* 版本历史对话框 */}
      {showVersionHistory && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'var(--window-bg)',
            borderRadius: '12px',
            padding: '24px',
            width: '600px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: 0 }}>版本历史</h3>
              <button onClick={() => setShowVersionHistory(false)} style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{
              flex: 1,
              overflow: 'auto'
            }}>
              {versions.length === 0 ? (
                <p style={{ textAlign: 'center', opacity: 0.7, padding: '40px' }}>
                  暂无版本历史
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {versions.map((version, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      border: '1px solid var(--window-border)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>
                          {formatTime(version.timestamp)}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                          作者: {version.author} · {version.content.length} 字符
                        </div>
                      </div>
                      <button
                        onClick={() => restoreVersion(version)}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--accent)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        恢复
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 分享对话框 */}
      {showShareDialog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'var(--window-bg)',
            borderRadius: '12px',
            padding: '24px',
            width: '400px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: 0 }}>分享文档</h3>
              <button onClick={() => setShowShareDialog(false)} style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}>
                <X size={20} />
              </button>
            </div>
            
            <p style={{ opacity: 0.7, marginBottom: '16px' }}>
              文档已保存到本地存储。您可以导出文档后通过其他方式分享。
            </p>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  copyToClipboard()
                  setShowShareDialog(false)
                }}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                复制内容
              </button>
              <button
                onClick={() => {
                  exportDocument()
                  setShowShareDialog(false)
                }}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  background: 'var(--button-bg)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--window-border)',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                导出文件
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}