import { useState, useCallback, useMemo } from 'react'
import {
  Folder, File, ChevronRight, ChevronDown, Search, Download, Copy, RefreshCw, Home, FolderOpen,
} from 'lucide-react'

interface FileEntry {
  name: string
  kind: 'file' | 'directory'
  size?: number
  type?: string
  lastModified?: number
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle
  children?: FileEntry[]
  expanded?: boolean
  content?: string | ArrayBuffer | null
}

type SortKey = 'name' | 'size' | 'date'
type ViewMode = 'list' | 'grid'

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (ts: number): string => {
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

const isTextType = (type: string): boolean => {
  return type.startsWith('text/') ||
    type.includes('json') ||
    type.includes('javascript') ||
    type.includes('xml') ||
    type.includes('yaml') ||
    type.includes('markdown') ||
    type.includes('csv') ||
    type === 'application/x-sh' ||
    type === ''
}

const isImageType = (type: string): boolean => {
  return type.startsWith('image/')
}

const hasFileSystemAPI = typeof window !== 'undefined' &&
  'showDirectoryPicker' in window

export default function LocalFileExplorer() {
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [files, setFiles] = useState<FileEntry[]>([])
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [imageContent, setImageContent] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('name')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pathParts, setPathParts] = useState<string[]>([])
  const [currentDir, setCurrentDir] = useState<FileSystemDirectoryHandle | null>(null)

  const sortEntries = useCallback((entries: FileEntry[], key: SortKey): FileEntry[] => {
    return [...entries].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1
      switch (key) {
        case 'name': return a.name.localeCompare(b.name)
        case 'size': return (a.size ?? 0) - (b.size ?? 0)
        case 'date': return (b.lastModified ?? 0) - (a.lastModified ?? 0)
        default: return 0
      }
    })
  }, [])

  const readDirectory = useCallback(async (dirHandle: FileSystemDirectoryHandle, depth = 0): Promise<FileEntry[]> => {
    const entries: FileEntry[] = []
    try {
      for await (const [name, handle] of (dirHandle as any).entries()) {
        const entry: FileEntry = {
          name,
          kind: handle.kind,
          handle,
        }
        if (handle.kind === 'file') {
          try {
            const file = await (handle as FileSystemFileHandle).getFile()
            entry.size = file.size
            entry.type = file.type
            entry.lastModified = file.lastModified
          } catch { /* permission denied */ }
        }
        if (handle.kind === 'directory' && depth < 1) {
          entry.children = await readDirectory(handle as FileSystemDirectoryHandle, depth + 1)
          entry.expanded = false
        }
        entries.push(entry)
      }
    } catch { /* permission denied */ }
    return entries
  }, [])

  const openDirectory = useCallback(async () => {
    if (!hasFileSystemAPI) return
    try {
      setLoading(true)
      setError(null)
      const handle = await (window as any).showDirectoryPicker({ mode: 'read' })
      setRootHandle(handle)
      setCurrentDir(handle)
      setPathParts([handle.name])
      const entries = await readDirectory(handle)
      setFiles(sortEntries(entries, sortBy))
      setSelectedFile(null)
      setFileContent(null)
      setImageContent(null)
    } catch (e: any) {
      if (e.name !== 'AbortError') setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [readDirectory, sortEntries, sortBy])

  const toggleExpand = useCallback(async (entry: FileEntry, path: string[]) => {
    if (entry.kind !== 'directory' || !entry.handle) return
    const newFiles = await toggleInTree(files, entry, path)
    setFiles(newFiles)
  }, [files])

  const toggleInTree = async (tree: FileEntry[], target: FileEntry, path: string[]): Promise<FileEntry[]> => {
    const result: FileEntry[] = []
    for (const entry of tree) {
      if (entry === target) {
        if (entry.expanded) {
          result.push({ ...entry, expanded: false })
        } else {
          let children = entry.children
          if (!children || children.length === 0) {
            children = await readDirectory(entry.handle as FileSystemDirectoryHandle, 0)
          }
          result.push({ ...entry, expanded: true, children: sortEntries(children, sortBy) })
        }
      } else if (entry.children) {
        result.push({ ...entry, children: await toggleInTree(entry.children, target, path) })
      } else {
        result.push(entry)
      }
    }
    return result
  }

  const selectFile = useCallback(async (entry: FileEntry) => {
    if (entry.kind !== 'file' || !entry.handle) return
    try {
      setSelectedFile(entry)
      const fileHandle = entry.handle as FileSystemFileHandle
      const file = await fileHandle.getFile()
      if (isImageType(file.type)) {
        const url = URL.createObjectURL(file)
        setImageContent(url)
        setFileContent(null)
      } else if (isTextType(file.type)) {
        const text = await file.text()
        setFileContent(text)
        setImageContent(null)
      } else {
        setFileContent(`[二进制文件: ${file.type || '未知类型'}, ${formatSize(file.size)}]`)
        setImageContent(null)
      }
    } catch (e: any) {
      setError(e.message)
    }
  }, [])

  const copyContent = useCallback(() => {
    if (fileContent) {
      navigator.clipboard.writeText(fileContent)
    }
  }, [fileContent])

  const downloadFile = useCallback(async (entry: FileEntry) => {
    if (entry.kind !== 'file' || !entry.handle) return
    try {
      const fileHandle = entry.handle as FileSystemFileHandle
      const file = await fileHandle.getFile()
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e.message)
    }
  }, [])

  const refreshDir = useCallback(async () => {
    if (!currentDir) return
    setLoading(true)
    try {
      const entries = await readDirectory(currentDir)
      setFiles(sortEntries(entries, sortBy))
    } finally {
      setLoading(false)
    }
  }, [currentDir, readDirectory, sortEntries, sortBy])

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files
    const filterTree = (entries: FileEntry[]): FileEntry[] => {
      return entries.reduce<FileEntry[]>((acc, entry) => {
        const nameMatch = entry.name.toLowerCase().includes(searchQuery.toLowerCase())
        if (entry.kind === 'directory' && entry.children) {
          const filteredChildren = filterTree(entry.children)
          if (nameMatch || filteredChildren.length > 0) {
            acc.push({ ...entry, children: filteredChildren })
          }
        } else if (nameMatch) {
          acc.push(entry)
        }
        return acc
      }, [])
    }
    return filterTree(files)
  }, [files, searchQuery])

  const renderTree = (entries: FileEntry[], depth = 0, parentPath: string[] = []): React.ReactNode => {
    return entries.map((entry) => {
      const fullPath = [...parentPath, entry.name]
      const indent = depth * 20
      const isSelected = selectedFile === entry

      return (
        <div key={fullPath.join('/')}>
          <div
            onClick={() => entry.kind === 'directory' ? toggleExpand(entry, fullPath) : selectFile(entry)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              paddingLeft: 12 + indent,
              cursor: 'pointer',
              background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              borderRadius: 6,
              fontSize: 13,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
          >
            {entry.kind === 'directory' ? (
              <>
                {entry.expanded ? <ChevronDown size={14} style={{ color: '#6366f1' }} /> : <ChevronRight size={14} style={{ color: '#6366f1' }} />}
                {entry.expanded ? <FolderOpen size={16} style={{ color: '#6366f1' }} /> : <Folder size={16} style={{ color: '#818cf8' }} />}
              </>
            ) : (
              <>
                <span style={{ width: 14 }} />
                <File size={16} style={{ color: '#94a3b8' }} />
              </>
            )}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.name}
            </span>
            {entry.kind === 'file' && entry.size !== undefined && (
              <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0 }}>{formatSize(entry.size)}</span>
            )}
          </div>
          {entry.kind === 'directory' && entry.expanded && entry.children && (
            renderTree(entry.children, depth + 1, fullPath)
          )}
        </div>
      )
    })
  }

  if (!hasFileSystemAPI) {
    return (
      <div style={{
        background: '#1a1b2e', padding: 20, height: '100%', overflowY: 'auto', color: '#e0e0e0',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <FolderOpen size={48} style={{ color: '#6366f1', opacity: 0.5 }} />
        <h3 style={{ margin: 0, color: '#e0e0e0' }}>本地文件浏览器</h3>
        <p style={{ margin: 0, color: '#94a3b8', textAlign: 'center', maxWidth: 400, fontSize: 14 }}>
          此应用需要 File System Access API 支持。<br />
          请使用 Chrome 86+ 或 Edge 86+ 浏览器打开。
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(180deg, #1a1b2e 0%, #1e1f3a 100%)',
      padding: 20, height: '100%', overflowY: 'auto', color: '#e0e0e0',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 10, background: 'rgba(99, 102, 241, 0.15)', borderRadius: 10 }}>
          <FolderOpen size={24} style={{ color: '#6366f1' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>本地文件浏览器</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>使用 File System Access API 浏览本地文件</p>
        </div>
        <button
          onClick={openDirectory}
          style={{
            padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <FolderOpen size={16} /> 打开目录
        </button>
      </div>

      {error && (
        <div style={{
          marginBottom: 16, padding: 12, background: 'rgba(239, 68, 68, 0.15)',
          borderRadius: 8, color: '#fca5a5', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {rootHandle ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, height: 'calc(100% - 80px)' }}>
          {/* Left: File tree */}
          <div style={{
            background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
              <Home size={14} style={{ color: '#6366f1' }} />
              {pathParts.map((part, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8' }}>
                  {i > 0 && <ChevronRight size={12} />}
                  <span style={{ color: i === pathParts.length - 1 ? '#e0e0e0' : '#94a3b8' }}>{part}</span>
                </span>
              ))}
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '6px 10px',
              }}>
                <Search size={14} style={{ color: '#64748b' }} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索文件..."
                  style={{
                    flex: 1, background: 'transparent', border: 'none', color: '#e0e0e0',
                    fontSize: 13, outline: 'none',
                  }}
                />
              </div>
              <button onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} title="切换视图"
                style={{ padding: 6, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, color: '#94a3b8', cursor: 'pointer' }}>
                {viewMode === 'list' ? '☰' : '⊞'}
              </button>
              <select
                value={sortBy}
                onChange={(e) => {
                  const key = e.target.value as SortKey
                  setSortBy(key)
                  setFiles(sortEntries(files, key))
                }}
                style={{
                  padding: '6px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, color: '#e0e0e0', fontSize: 12,
                }}
              >
                <option value="name">名称</option>
                <option value="size">大小</option>
                <option value="date">日期</option>
              </select>
              <button onClick={refreshDir} title="刷新"
                style={{ padding: 6, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, color: '#94a3b8', cursor: 'pointer' }}>
                <RefreshCw size={14} />
              </button>
            </div>

            {/* File list */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>加载中...</div>
              ) : viewMode === 'list' ? (
                renderTree(filteredFiles)
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                  {filteredFiles.map((entry) => (
                    <div
                      key={entry.name}
                      onClick={() => entry.kind === 'file' ? selectFile(entry) : toggleExpand(entry, [entry.name])}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 8,
                        cursor: 'pointer', textAlign: 'center', fontSize: 11,
                      }}
                    >
                      {entry.kind === 'directory' ? <Folder size={24} style={{ color: '#818cf8' }} /> : <File size={24} style={{ color: '#94a3b8' }} />}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{entry.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: File preview */}
          <div style={{
            background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 16,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {selectedFile ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <File size={16} style={{ color: '#6366f1' }} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedFile.name}</span>
                  {selectedFile.size !== undefined && (
                    <span style={{ fontSize: 12, color: '#64748b' }}>{formatSize(selectedFile.size)}</span>
                  )}
                  {selectedFile.type && (
                    <span style={{ fontSize: 11, padding: '2px 6px', background: 'rgba(99,102,241,0.15)', borderRadius: 4, color: '#818cf8' }}>
                      {selectedFile.type}
                    </span>
                  )}
                  <div style={{ flex: 1 }} />
                  {fileContent && (
                    <button onClick={copyContent} title="复制内容"
                      style={{ padding: 6, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, color: '#94a3b8', cursor: 'pointer' }}>
                      <Copy size={14} />
                    </button>
                  )}
                  <button onClick={() => downloadFile(selectedFile)} title="下载"
                    style={{ padding: 6, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, color: '#94a3b8', cursor: 'pointer' }}>
                    <Download size={14} />
                  </button>
                </div>
                {selectedFile.lastModified && (
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                    修改时间: {formatDate(selectedFile.lastModified)}
                  </div>
                )}
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {imageContent ? (
                    <img src={imageContent} alt={selectedFile.name} style={{ maxWidth: '100%', borderRadius: 8 }} />
                  ) : fileContent ? (
                    <pre style={{
                      margin: 0, padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8,
                      fontSize: 13, fontFamily: 'monospace', color: '#c9d1d9',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflow: 'auto',
                    }}>
                      {fileContent}
                    </pre>
                  ) : (
                    <div style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>无法预览此文件</div>
                  )}
                </div>
              </>
            ) : (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', gap: 12,
              }}>
                <File size={40} style={{ opacity: 0.3 }} />
                <span>选择文件以预览内容</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 60, gap: 16,
        }}>
          <FolderOpen size={64} style={{ color: '#6366f1', opacity: 0.3 }} />
          <p style={{ color: '#94a3b8', fontSize: 15 }}>点击「打开目录」按钮选择一个本地文件夹</p>
          <p style={{ color: '#64748b', fontSize: 12 }}>支持浏览、预览、搜索和下载文件</p>
        </div>
      )}
    </div>
  )
}
