import { useState, useEffect, useCallback, memo } from 'react'
import { useStore } from '../store'
import {
  FolderOpen, Save, Trash2, Plus, Download,
  Layout, FileText, Monitor, ChevronRight,
  Zap, Star
} from 'lucide-react'

interface Workspace {
  id: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
  windows: any[]
  files: any[]
  settings: any
  pinned?: boolean
  icon?: string
}

const WorkspaceManager = memo(function WorkspaceManager() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  
  const windows = useStore(s => s.windows)
  const files = useStore(s => s.files)
  const theme = useStore(s => s.theme)

  useEffect(() => {
    const saved = localStorage.getItem('weblinux-workspaces')
    if (saved) {
      try {
        setWorkspaces(JSON.parse(saved))
      } catch {
        setWorkspaces([])
      }
    }
  }, [])

  const saveWorkspaces = useCallback((ws: Workspace[]) => {
    setWorkspaces(ws)
    localStorage.setItem('weblinux-workspaces', JSON.stringify(ws))
  }, [])

  const createWorkspace = useCallback(() => {
    if (!newName.trim()) return
    
    const newWorkspace: Workspace = {
      id: `ws-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || '未设置描述',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      windows: JSON.parse(JSON.stringify(windows)),
      files: JSON.parse(JSON.stringify(files)),
      settings: { theme },
      pinned: false,
    }
    
    saveWorkspaces([newWorkspace, ...workspaces])
    setNewName('')
    setNewDesc('')
    setIsCreating(false)
    setSelectedId(newWorkspace.id)
  }, [newName, newDesc, windows, files, theme, workspaces, saveWorkspaces])

  const loadWorkspace = useCallback((ws: Workspace) => {
    const store = useStore.getState()
    
    store.windows.forEach(w => store.closeWindow(w.id))
    
    setTimeout(() => {
      ws.windows.forEach(w => {
        store.openApp(w.appId)
      })
    }, 100)
    
    setSelectedId(ws.id)
    
    const updated = workspaces.map(w => 
      w.id === ws.id ? { ...w, updatedAt: Date.now() } : w
    )
    saveWorkspaces(updated)
  }, [workspaces, saveWorkspaces])

  const deleteWorkspace = useCallback((id: string) => {
    if (!confirm('确定要删除这个工作区吗？')) return
    saveWorkspaces(workspaces.filter(w => w.id !== id))
    if (selectedId === id) setSelectedId(null)
  }, [workspaces, selectedId, saveWorkspaces])

  const updateCurrentWorkspace = useCallback(() => {
    if (!selectedId) return
    
    const updated = workspaces.map(w => 
      w.id === selectedId ? {
        ...w,
        windows: JSON.parse(JSON.stringify(windows)),
        files: JSON.parse(JSON.stringify(files)),
        updatedAt: Date.now(),
      } : w
    )
    saveWorkspaces(updated)
  }, [selectedId, workspaces, windows, files, saveWorkspaces])

  const togglePin = useCallback((id: string) => {
    saveWorkspaces(workspaces.map(w => 
      w.id === id ? { ...w, pinned: !w.pinned } : w
    ).sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return b.updatedAt - a.updatedAt
    }))
  }, [workspaces, saveWorkspaces])

  const exportWorkspace = useCallback((ws: Workspace) => {
    const dataStr = JSON.stringify(ws, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${ws.name}.weblinux-ws.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const selectedWorkspace = workspaces.find(w => w.id === selectedId)

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
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
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, rgba(155, 138, 240, 0.1), rgba(0, 206, 201, 0.08))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #9b8af0, #00cec9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}>
            <Layout size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>工作区管理器</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {workspaces.length} 个工作区
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: 'linear-gradient(135deg, #9b8af0, #7c6cf0)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={16} />
          新建工作区
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: '280px',
          borderRight: '1px solid var(--border-color)',
          overflowY: 'auto',
          padding: '10px',
        }}>
          {isCreating && (
            <div style={{
              background: 'rgba(155, 138, 240, 0.1)',
              border: '1px solid rgba(155, 138, 240, 0.3)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '10px',
            }}>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="工作区名称"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  marginBottom: '8px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && createWorkspace()}
              />
              <input
                type="text"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="描述（可选）"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  marginBottom: '10px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={createWorkspace}
                  style={{
                    flex: 1,
                    padding: '7px 12px',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  创建
                </button>
                <button
                  onClick={() => { setIsCreating(false); setNewName(''); setNewDesc('') }}
                  style={{
                    padding: '7px 12px',
                    background: 'var(--button-bg)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {workspaces.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '13px',
            }}>
              <FolderOpen size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <div>暂无工作区</div>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
                点击"新建工作区"保存当前桌面状态
              </div>
            </div>
          ) : (
            workspaces.map(ws => (
              <div
                key={ws.id}
                onClick={() => setSelectedId(ws.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  transition: 'all 0.15s',
                  background: selectedId === ws.id 
                    ? 'rgba(155, 138, 240, 0.18)' 
                    : 'transparent',
                  border: selectedId === ws.id 
                    ? '1px solid rgba(155, 138, 240, 0.4)' 
                    : '1px solid transparent',
                }}
                onMouseEnter={e => {
                  if (selectedId !== ws.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                  }
                }}
                onMouseLeave={e => {
                  if (selectedId !== ws.id) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 500,
                    fontSize: '13px',
                  }}>
                    {ws.pinned && <Star size={14} style={{ color: '#f59e0b', fill: '#f59e0b' }} />}
                    {ws.name}
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-secondary)', opacity: selectedId === ws.id ? 1 : 0 }} />
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>{ws.windows.length} 窗口</span>
                  <span>·</span>
                  <span>{formatDate(ws.updatedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {selectedWorkspace ? (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}>
                <div>
                  <h3 style={{
                    margin: '0 0 6px',
                    fontSize: '20px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    {selectedWorkspace.pinned && <Star size={20} style={{ color: '#f59e0b', fill: '#f59e0b' }} />}
                    {selectedWorkspace.name}
                  </h3>
                  <p style={{
                    margin: 0,
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                  }}>
                    {selectedWorkspace.description}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '20px',
              }}>
                <div style={{
                  padding: '14px',
                  background: 'rgba(155, 138, 240, 0.08)',
                  borderRadius: '10px',
                  border: '1px solid rgba(155, 138, 240, 0.2)',
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>打开窗口</div>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#9b8af0' }}>{selectedWorkspace.windows.length}</div>
                </div>
                <div style={{
                  padding: '14px',
                  background: 'rgba(0, 206, 201, 0.08)',
                  borderRadius: '10px',
                  border: '1px solid rgba(0, 206, 201, 0.2)',
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>文件数</div>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#00cec9' }}>{selectedWorkspace.files.length}</div>
                </div>
                <div style={{
                  padding: '14px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  borderRadius: '10px',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>最后使用</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f59e0b' }}>{formatDate(selectedWorkspace.updatedAt)}</div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                marginBottom: '24px',
              }}>
                <button
                  onClick={() => loadWorkspace(selectedWorkspace)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    background: 'linear-gradient(135deg, #9b8af0, #7c6cf0)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Zap size={16} />
                  加载工作区
                </button>
                <button
                  onClick={updateCurrentWorkspace}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    background: 'var(--button-bg)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.2s',
                  }}
                >
                  <Save size={16} />
                  更新当前
                </button>
                <button
                  onClick={() => togglePin(selectedWorkspace.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    background: 'var(--button-bg)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  <Star size={16} />
                  {selectedWorkspace.pinned ? '取消置顶' : '置顶'}
                </button>
                <button
                  onClick={() => exportWorkspace(selectedWorkspace)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    background: 'var(--button-bg)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  <Download size={16} />
                  导出
                </button>
                <button
                  onClick={() => deleteWorkspace(selectedWorkspace.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    marginLeft: 'auto',
                  }}
                >
                  <Trash2 size={16} />
                  删除
                </button>
              </div>

              <div style={{
                background: 'var(--card-bg)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-color)',
                  fontWeight: 500,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <Monitor size={16} style={{ color: 'var(--accent)' }} />
                  保存的窗口
                </div>
                <div style={{ padding: '8px' }}>
                  {selectedWorkspace.windows.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      无保存的窗口
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedWorkspace.windows.map((w: any, i: number) => (
                        <div key={i} style={{
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <FileText size={14} style={{ color: 'var(--text-secondary)' }} />
                          {w.title || w.appId}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}>
              <Layout size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <div style={{ fontSize: '15px', marginBottom: '6px' }}>选择一个工作区查看详情</div>
              <div style={{ fontSize: '13px', opacity: 0.7 }}>
                或创建新工作区来保存当前桌面状态
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default WorkspaceManager
