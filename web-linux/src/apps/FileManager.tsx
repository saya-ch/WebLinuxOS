import { useState, useCallback, memo, useMemo, useEffect, useRef } from 'react'
import { useStore, findNodeById, validateFileName } from '../store'
import type { FileNode } from '../types'

function formatSize(size: number | undefined): string {
  if (!size) return '0 B'
  if (size < 1024) return `${size} B`
  if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1073741824) return `${(size / 1048576).toFixed(1)} MB`
  return `${(size / 1073741824).toFixed(1)} GB`
}

function getFileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() || ''
}

function isImageFile(name: string): boolean {
  const ext = getFileExtension(name)
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)
}

function isTextFile(name: string): boolean {
  const ext = getFileExtension(name)
  return ['txt', 'md', 'json', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb', 'xml', 'yml', 'yaml', 'sh', 'sql'].includes(ext)
}

const fileTypeIcons: Record<string, string> = {
  'txt': '📝',
  'md': '📘',
  'json': '📋',
  'js': '📄',
  'ts': '📄',
  'tsx': '📄',
  'jsx': '📄',
  'html': '🌐',
  'css': '🎨',
  'py': '🐍',
  'java': '☕',
  'cpp': '⚙️',
  'c': '⚙️',
  'go': '🐹',
  'rs': '🦀',
  'php': '🐘',
  'rb': '💎',
  'xml': '📰',
  'yml': '📋',
  'yaml': '📋',
  'sh': '🖥️',
  'sql': '🗄️',
  'pdf': '📕',
  'doc': '📗',
  'docx': '📗',
  'xls': '📗',
  'xlsx': '📗',
  'ppt': '📙',
  'pptx': '📙',
  'zip': '📦',
  'rar': '📦',
  '7z': '📦',
  'tar': '📦',
  'gz': '📦',
  'jpg': '🖼️',
  'jpeg': '🖼️',
  'png': '🖼️',
  'gif': '🖼️',
  'svg': '🖼️',
  'webp': '🖼️',
  'mp4': '🎬',
  'mkv': '🎬',
  'avi': '🎬',
  'mov': '🎬',
  'mp3': '🎵',
  'wav': '🎵',
  'flac': '🎵',
}

function getFileIcon(name: string, type: 'file' | 'folder'): string {
  if (type === 'folder') return '📁'
  const ext = name.split('.').pop()?.toLowerCase()
  return fileTypeIcons[ext || ''] || '📄'
}

interface TreeItemProps {
  node: FileNode
  depth: number
  isExpanded: boolean
  isSelected: boolean
  onSelect: (id: string) => void
  onDoubleClick: (node: FileNode) => void
  onContextMenu: (e: React.MouseEvent, id: string) => void
  onToggle: (id: string) => void
}

const TreeItem = memo(function TreeItem({
  node,
  depth,
  isExpanded,
  isSelected,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onToggle,
}: TreeItemProps) {
  const hasChildren = node.children && node.children.length > 0
  
  return (
    <div>
      <div
        className={`app-file-tree-item${isSelected ? ' selected' : ''}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => {
          onSelect(node.id)
          if (node.type === 'folder') {
            onToggle(node.id)
          }
        }}
        onDoubleClick={() => onDoubleClick(node)}
        onContextMenu={(e) => onContextMenu(e, node.id)}
      >
        <span className="app-file-tree-icon">
          {node.type === 'folder' ? (isExpanded ? '📂' : '📁') : '📄'}
        </span>
        <span className="app-file-tree-name">{node.name}</span>
      </div>
      {node.type === 'folder' && isExpanded && hasChildren && (
        <div className="app-file-tree-children">
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              isExpanded={false}
              isSelected={false}
              onSelect={onSelect}
              onDoubleClick={onDoubleClick}
              onContextMenu={onContextMenu}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
})

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  fileId: string
}

export default function FileManager() {
  const files = useStore((s) => s.files)
  const addFile = useStore((s) => s.addFile)
  const deleteFile = useStore((s) => s.deleteFile)
  const renameFile = useStore((s) => s.renameFile)
  const openFileWith = useStore((s) => s.openFileWith)
  const copyFile = useStore((s) => s.copyFile)
  const updateFileContent = useStore((s) => s.updateFileContent)
  
  function handleDownload(fileId: string) {
    const node = findNodeById(files, fileId)
    if (node && node.type === 'file') {
      const blob = new Blob([node.content || ''], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = node.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
    closeContextMenu()
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files
    if (!fileList) return
    
    Array.from(fileList).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        const newFileId = `file-${Date.now()}-${Math.random()}`
        addFile(currentNodeId, file.name, 'file')
        // 先添加文件，然后更新内容
        setTimeout(() => {
          // 这里我们需要找到新创建的文件ID，这里做简化处理
          // 实际项目中应该有更好的实现方式
          updateFileContent(newFileId, content)
        }, 100)
      }
      reader.readAsText(file)
    })
    
    // 清空input值，允许重复选择同一文件
    e.target.value = ''
  }

  const [currentPath, setCurrentPath] = useState<string[]>(['root'])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']))
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, fileId: '' })
  const [renameTarget, setRenameTarget] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [newItemInput, setNewItemInput] = useState<'file' | 'folder' | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FileNode[]>([])
  const [clipboard, setClipboard] = useState<FileNode | null>(null)
  const [clipboardMode, setClipboardMode] = useState<'copy' | 'cut' | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'size' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [previewFile, setPreviewFile] = useState<FileNode | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)
  
  const fileListRef = useRef<HTMLDivElement>(null)

  const currentNodeId = currentPath[currentPath.length - 1]
  const currentNode = findNodeById(files, currentNodeId)

  const children = currentNode?.children || []

  const navigateTo = useCallback((nodeId: string) => {
    const node = findNodeById(files, nodeId)
    if (!node) return
    if (node.type === 'folder') {
      let current: string | null = nodeId
      const pathStack: string[] = []
      while (current) {
        pathStack.unshift(current)
        const n = findNodeById(files, current)
        current = n?.parentId || null
      }
      setCurrentPath(pathStack)
      setExpandedFolders((prev) => new Set([...prev, nodeId]))
      setSelectedFileIds(new Set())
    }
  }, [files])

  function navigateToPathSegment(index: number) {
    const newPath = currentPath.slice(0, index + 1)
    setCurrentPath(newPath)
    setExpandedFolders((prev) => new Set([...prev, newPath[newPath.length - 1]]))
  }

  const toggleFolderExpand = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }, [])

  const handleFileDoubleClick = useCallback((file: FileNode) => {
    if (file.type === 'folder') {
      navigateTo(file.id)
    } else {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const codeExts = ['py', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'xml', 'yml', 'yaml', 'sh', 'sql', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb', 'md']
      const appId = codeExts.includes(ext || '') ? 'code-editor' : 'text-editor'
      openFileWith(file.id, appId)
    }
    setSelectedFileIds(new Set([file.id]))
    setLastSelectedId(file.id)
  }, [openFileWith, navigateTo])

  const handleFileClick = useCallback((fileId: string, e: React.MouseEvent) => {
    e.preventDefault()
    
    if (e.shiftKey && lastSelectedId) {
      const displayNodes = searchResults.length > 0 
        ? sortNodes(searchResults) 
        : sortNodes(children)
      
      const lastIndex = displayNodes.findIndex(n => n.id === lastSelectedId)
      const currentIndex = displayNodes.findIndex(n => n.id === fileId)
      
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex)
        const end = Math.max(lastIndex, currentIndex)
        const rangeIds = displayNodes.slice(start, end + 1).map(n => n.id)
        setSelectedFileIds(new Set(rangeIds))
        setLastSelectedId(fileId)
        return
      }
    }
    
    if (e.ctrlKey || e.metaKey) {
      setSelectedFileIds(prev => {
        const next = new Set(prev)
        if (next.has(fileId)) {
          next.delete(fileId)
        } else {
          next.add(fileId)
        }
        return next
      })
    } else {
      setSelectedFileIds(new Set([fileId]))
    }
    setLastSelectedId(fileId)
  }, [lastSelectedId, searchResults, children])

  const handleContextMenu = useCallback((e: React.MouseEvent, fileId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const menuWidth = 200
    const menuHeight = 180
    const x = Math.min(e.clientX, window.innerWidth - menuWidth)
    const y = Math.min(e.clientY, window.innerHeight - menuHeight)
    setContextMenu({ visible: true, x, y, fileId })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, fileId: '' })
  }, [])

  const handleDelete = useCallback((fileId?: string) => {
    const idsToDelete = fileId ? [fileId] : Array.from(selectedFileIds)
    idsToDelete.forEach(id => deleteFile(id))
    setSelectedFileIds(prev => {
      const next = new Set(prev)
      idsToDelete.forEach(id => next.delete(id))
      return next
    })
    closeContextMenu()
  }, [deleteFile, selectedFileIds, closeContextMenu])

  const handleCopy = useCallback((fileId?: string) => {
    const idsToCopy = fileId ? [fileId] : Array.from(selectedFileIds)
    if (idsToCopy.length > 0) {
      const node = findNodeById(files, idsToCopy[0])
      if (node) {
        setClipboard(node)
        setClipboardMode('copy')
      }
    }
    closeContextMenu()
  }, [files, selectedFileIds, closeContextMenu])

  const handleCut = useCallback((fileId?: string) => {
    const idsToCut = fileId ? [fileId] : Array.from(selectedFileIds)
    if (idsToCut.length > 0) {
      const node = findNodeById(files, idsToCut[0])
      if (node) {
        setClipboard(node)
        setClipboardMode('cut')
      }
    }
    closeContextMenu()
  }, [files, selectedFileIds, closeContextMenu])

  const handlePaste = useCallback(() => {
    if (clipboard) {
      if (clipboardMode === 'copy') {
        copyFile(clipboard.id, currentNodeId)
      } else if (clipboardMode === 'cut') {
        copyFile(clipboard.id, currentNodeId)
        deleteFile(clipboard.id)
      }
      setClipboard(null)
      setClipboardMode(null)
    }
  }, [clipboard, clipboardMode, copyFile, deleteFile, currentNodeId])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const items = e.dataTransfer.items
    if (!items) return
    
    Array.from(items).forEach(item => {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const content = event.target?.result as string
            addFile(currentNodeId, file.name, 'file')
            setTimeout(() => {
              const newFile = children.find(c => c.name === file.name)
              if (newFile) {
                updateFileContent(newFile.id, content)
              }
            }, 100)
          }
          reader.readAsText(file)
        }
      }
    })
  }, [currentNodeId, addFile, updateFileContent, children])

  function handleRenameStart(fileId: string) {
    const node = findNodeById(files, fileId)
    if (node) {
      setRenameTarget(fileId)
      setRenameValue(node.name)
    }
    closeContextMenu()
  }

  function handleRenameSubmit() {
    if (renameTarget && renameValue.trim()) {
      const validation = validateFileName(renameValue.trim())
      if (!validation.valid) {
        alert(validation.error || '文件名无效')
        return
      }
      renameFile(renameTarget, renameValue.trim())
    }
    setRenameTarget(null)
    setRenameValue('')
  }

  function handleCreateNew(type: 'file' | 'folder') {
    setNewItemInput(type)
    setNewItemName('')
    closeContextMenu()
  }

  function handleNewItemSubmit() {
    if (newItemName.trim() && newItemInput) {
      const validation = validateFileName(newItemName.trim())
      if (!validation.valid) {
        alert(validation.error || '文件名无效')
        setNewItemInput(null)
        setNewItemName('')
        return
      }
      addFile(currentNodeId, newItemName.trim(), newItemInput)
    }
    setNewItemInput(null)
    setNewItemName('')
  }

  const goToParent = useCallback(() => {
    if (currentPath.length > 1) {
      const newPath = currentPath.slice(0, -1)
      setCurrentPath(newPath)
      setExpandedFolders((prev) => new Set([...prev, newPath[newPath.length - 1]]))
    }
  }, [currentPath])

  function handleRefresh() {
    setSelectedFileIds(new Set())
    setContextMenu({ visible: false, x: 0, y: 0, fileId: '' })
  }

  function searchFiles(query: string, nodes: FileNode[]): FileNode[] {
    if (!query.trim()) return []
    const results: FileNode[] = []
    const lowerQuery = query.toLowerCase()
    
    function search(node: FileNode) {
      if (node.name.toLowerCase().includes(lowerQuery)) {
        results.push(node)
      }
      if (node.children) {
        node.children.forEach(search)
      }
    }
    
    nodes.forEach(search)
    return results
  }

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    const results = searchFiles(query, files)
    setSearchResults(results)
  }, [files])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        const searchInput = document.querySelector('.app-search-input') as HTMLInputElement
        searchInput?.focus()
        return
      }

      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault()
        if (selectedFileIds.size > 0) {
          handleCopy()
        }
        return
      }

      if (e.ctrlKey && e.key === 'x') {
        e.preventDefault()
        if (selectedFileIds.size > 0) {
          handleCut()
        }
        return
      }

      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault()
        handlePaste()
        return
      }

      if (e.key === 'Backspace' && !searchQuery && selectedFileIds.size === 0 && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        goToParent()
        return
      }

      if (e.key === 'Enter' && selectedFileIds.size > 0 && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        const firstId = Array.from(selectedFileIds)[0]
        const node = findNodeById(files, firstId)
        if (node) {
          handleFileDoubleClick(node)
        }
        return
      }

      if (e.key === 'Delete' && selectedFileIds.size > 0 && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        handleDelete()
        return
      }

      if (e.key === 'Escape') {
        setSearchQuery('')
        setSearchResults([])
        setSelectedFileIds(new Set())
        closeContextMenu()
        setPreviewFile(null)
        return
      }

      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        const displayNodes = searchResults.length > 0 ? searchResults : children
        setSelectedFileIds(new Set(displayNodes.map(n => n.id)))
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedFileIds, searchQuery, files, goToParent, handleFileDoubleClick, handleDelete, closeContextMenu, clipboard, clipboardMode, searchResults, children])

  const treeContent = useMemo(() => {
    return files.map((node) => (
      <TreeItem
        key={node.id}
        node={node}
        depth={0}
        isExpanded={expandedFolders.has(node.id)}
        isSelected={selectedFileIds.has(node.id)}
        onSelect={(id) => setSelectedFileIds(prev => {
          const next = new Set(prev)
          if (next.has(id)) {
            next.delete(id)
          } else {
            next.add(id)
          }
          return next
        })}
        onDoubleClick={handleFileDoubleClick}
        onContextMenu={handleContextMenu}
        onToggle={toggleFolderExpand}
      />
    ))
  }, [files, expandedFolders, selectedFileIds, handleFileDoubleClick, handleContextMenu, toggleFolderExpand])

  function getFileDate(node: FileNode): string {
    const baseTime = new Date('2024-01-01').getTime()
    const hash = node.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const offset = (hash % 365) * 86400000
    const date = new Date(baseTime + offset)
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  function getFileSize(node: FileNode): string {
    if (node.type === 'folder') return '--'
    return formatSize((node.content?.length || 0) * 2)
  }

  function getFileSizeBytes(node: FileNode): number {
    if (node.type === 'folder') return 0
    return (node.content?.length || 0) * 2
  }

  function getSortKey(node: FileNode): string | number {
    switch (sortBy) {
      case 'name': return node.name.toLowerCase()
      case 'type': return node.type
      case 'size': return getFileSizeBytes(node)
      case 'date': return getFileDate(node)
      default: return node.name.toLowerCase()
    }
  }

  function sortNodes(nodes: FileNode[]): FileNode[] {
    return [...nodes].sort((a, b) => {
      // 文件夹总是排在前面
      if (a.type === 'folder' && b.type !== 'folder') return -1
      if (a.type !== 'folder' && b.type === 'folder') return 1
      
      const aKey = getSortKey(a)
      const bKey = getSortKey(b)
      
      if (typeof aKey === 'number' && typeof bKey === 'number') {
        return sortOrder === 'asc' ? aKey - bKey : bKey - aKey
      }
      
      const aStr = String(aKey)
      const bStr = String(bKey)
      return sortOrder === 'asc' 
        ? aStr.localeCompare(bStr) 
        : bStr.localeCompare(aStr)
    })
  }

  function toggleSort(newSortBy: 'name' | 'type' | 'size' | 'date') {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('asc')
    }
  }

  return (
    <div className="app-container app-file-manager" onClick={closeContextMenu}>
      <div className="app-toolbar">
        <button className="app-toolbar-btn" onClick={goToParent} title="返回上级">⬆</button>
        <button className="app-toolbar-btn" onClick={handleRefresh} title="刷新">🔄</button>
        <span className="app-toolbar-separator" />
        <button className="app-toolbar-btn" onClick={() => handleCreateNew('folder')} title="新建文件夹">📁+</button>
        <button className="app-toolbar-btn" onClick={() => handleCreateNew('file')} title="新建文件">📄+</button>
        <label className="app-toolbar-btn" title="上传文件" style={{ cursor: 'pointer' }}>
          📤
          <input
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </label>
        {selectedFileIds.size > 0 && (
          <>
            <button className="app-toolbar-btn" onClick={() => handleCopy()} title="复制 (Ctrl+C)">📋</button>
            <button className="app-toolbar-btn" onClick={() => handleCut()} title="剪切 (Ctrl+X)">✂️</button>
            <button className="app-toolbar-btn" onClick={() => { const firstId = Array.from(selectedFileIds)[0]; handleDownload(firstId); }} title="下载">⬇️</button>
            <button className="app-toolbar-btn" onClick={() => handleDelete()} title="删除">🗑</button>
            {selectedFileIds.size === 1 && (
              <button 
                className="app-toolbar-btn" 
                onClick={() => { 
                  const firstId = Array.from(selectedFileIds)[0]; 
                  const node = findNodeById(files, firstId);
                  if (node && node.type === 'file') setPreviewFile(node);
                }} 
                title="预览"
              >👁️</button>
            )}
          </>
        )}
        {clipboard && (
          <button className="app-toolbar-btn" onClick={handlePaste} title="粘贴 (Ctrl+V)">📋📥</button>
        )}
        {selectedFileIds.size > 0 && (
          <span className="app-toolbar-info">已选择 {selectedFileIds.size} 个项目</span>
        )}
        <span className="app-toolbar-separator" />
        <button 
          className={`app-toolbar-btn${viewMode === 'list' ? ' active' : ''}`} 
          onClick={() => setViewMode('list')} 
          title="列表视图"
        >📋</button>
        <button 
          className={`app-toolbar-btn${viewMode === 'grid' ? ' active' : ''}`} 
          onClick={() => setViewMode('grid')} 
          title="网格视图"
        >🗂️</button>
        {newItemInput && (
          <span className="app-toolbar-inline-form">
            <input
              autoFocus
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNewItemSubmit()
                if (e.key === 'Escape') { setNewItemInput(null); setNewItemName('') }
              }}
              onBlur={handleNewItemSubmit}
              placeholder={newItemInput === 'folder' ? '文件夹名' : '文件名'}
              className="app-input"
              style={{ width: 120 }}
            />
          </span>
        )}
        {!newItemInput && (
          <span className="app-toolbar-inline-form" style={{ marginLeft: 'auto' }}>
            <input
              type="text"
              className="app-input app-search-input"
              placeholder="搜索文件 (Ctrl+F)"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 180 }}
            />
          </span>
        )}
      </div>

      <div className="app-file-path-bar">
        {currentPath.map((id, index) => {
          const node = findNodeById(files, id)
          return (
            <span key={id}>
              {index > 0 && <span className="app-path-separator"> / </span>}
              <span
                className="app-path-segment"
                onClick={() => navigateToPathSegment(index)}
              >
                {node?.name || id}
              </span>
            </span>
          )
        })}
      </div>

      <div className="app-file-content">
        <div className="app-file-sidebar">
          <div className="app-file-sidebar-header">目录树</div>
          <div className="app-file-tree">
            {treeContent}
          </div>
        </div>
        <div 
            className="app-file-list-container"
            ref={fileListRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div className="app-file-drop-zone">
                📁 拖拽文件到这里上传
              </div>
            )}
          {viewMode === 'list' && (
            <div className="app-file-list-header">
              <span 
                className="app-file-col-name" 
                onClick={() => toggleSort('name')}
                style={{ cursor: 'pointer' }}
              >
                名称 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </span>
              <span 
                className="app-file-col-type" 
                onClick={() => toggleSort('type')}
                style={{ cursor: 'pointer' }}
              >
                类型 {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
              </span>
              <span 
                className="app-file-col-size" 
                onClick={() => toggleSort('size')}
                style={{ cursor: 'pointer' }}
              >
                大小 {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
              </span>
              <span 
                className="app-file-col-date" 
                onClick={() => toggleSort('date')}
                style={{ cursor: 'pointer' }}
              >
                修改日期 {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </span>
            </div>
          )}
          <div className={`app-file-list ${viewMode === 'grid' ? 'app-file-grid' : ''}`}>
            {(() => {
              const displayNodes = searchResults.length > 0 
                ? sortNodes(searchResults) 
                : sortNodes(children)
              
              if (displayNodes.length === 0 && searchResults.length === 0) {
                return <div className="app-file-empty">此文件夹为空</div>
              }
              
              if (viewMode === 'grid') {
                return displayNodes.map((file) => (
                  <div
                    key={file.id}
                    className={`app-file-grid-item${selectedFileIds.has(file.id) ? ' selected' : ''}`}
                    onClick={(e) => handleFileClick(file.id, e)}
                    onDoubleClick={() => handleFileDoubleClick(file)}
                    onContextMenu={(e) => handleContextMenu(e, file.id)}
                  >
                    <div className="app-file-grid-icon">{getFileIcon(file.name, file.type)}</div>
                    <div className="app-file-grid-name" title={file.name}>
                      {file.name}
                    </div>
                  </div>
                ))
              }
              
              return displayNodes.map((file) => (
                <div
                  key={file.id}
                  className={`app-file-row${selectedFileIds.has(file.id) ? ' selected' : ''}`}
                  onClick={(e) => handleFileClick(file.id, e)}
                  onDoubleClick={() => handleFileDoubleClick(file)}
                  onContextMenu={(e) => handleContextMenu(e, file.id)}
                >
                  <span className="app-file-col-name">
                    <span className="app-file-icon">{getFileIcon(file.name, file.type)}</span>
                    {renameTarget === file.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSubmit()
                          if (e.key === 'Escape') { setRenameTarget(null); setRenameValue('') }
                        }}
                        onBlur={handleRenameSubmit}
                        className="app-input"
                        style={{ width: 100 }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      file.name
                    )}
                  </span>
                  <span className="app-file-col-type">{file.type === 'folder' ? '文件夹' : '文本文件'}</span>
                  <span className="app-file-col-size">{getFileSize(file)}</span>
                  <span className="app-file-col-date">{getFileDate(file)}</span>
                </div>
              ))
            })()}
            {searchResults.length > 0 && (
              <div className="app-file-empty" style={{ paddingTop: '12px', gridColumn: '1 / -1' }}>
                找到 {searchResults.length} 个搜索结果
              </div>
            )}
          </div>
        </div>
      </div>

      {contextMenu.visible && (
        <div
          className="app-context-menu"
          style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="app-context-menu-item" onClick={() => { const node = findNodeById(files, contextMenu.fileId); if (node) handleFileDoubleClick(node); closeContextMenu(); }}>
            📂 打开
          </div>
          <div className="app-context-menu-separator" />
          <div className="app-context-menu-item" onClick={() => handleCopy(contextMenu.fileId)}>
            📋 复制
          </div>
          <div className="app-context-menu-item" onClick={() => handleCut(contextMenu.fileId)}>
            ✂️ 剪切
          </div>
          <div className="app-context-menu-separator" />
          <div className="app-context-menu-item" onClick={() => handleDelete(contextMenu.fileId)}>
            🗑 删除
          </div>
          <div className="app-context-menu-item" onClick={() => handleRenameStart(contextMenu.fileId)}>
            ✏️ 重命名
          </div>
          <div className="app-context-menu-item" onClick={() => handleDownload(contextMenu.fileId)}>
            ⬇️ 下载
          </div>
          {selectedFileIds.size === 1 && (
            <>
              <div className="app-context-menu-separator" />
              <div className="app-context-menu-item" onClick={() => { 
                const node = findNodeById(files, contextMenu.fileId);
                if (node && node.type === 'file') setPreviewFile(node);
                closeContextMenu(); 
              }}>
                👁️ 预览
              </div>
            </>
          )}
          <div className="app-context-menu-separator" />
          <div className="app-context-menu-item" onClick={() => handleCreateNew('folder')}>
            📁 新建文件夹
          </div>
          <div className="app-context-menu-item" onClick={() => handleCreateNew('file')}>
            📄 新建文件
          </div>
          {clipboard && (
            <>
              <div className="app-context-menu-separator" />
              <div className="app-context-menu-item" onClick={() => { handlePaste(); closeContextMenu(); }}>
                📋📥 粘贴
              </div>
            </>
          )}
        </div>
      )}

      {previewFile && (
        <div className="app-modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="app-modal" onClick={(e) => e.stopPropagation()}>
            <div className="app-modal-header">
              <span className="app-modal-title">👁️ {previewFile.name}</span>
              <button className="app-modal-close" onClick={() => setPreviewFile(null)}>✕</button>
            </div>
            <div className="app-modal-content">
              {isImageFile(previewFile.name) ? (
                <img 
                  src={`data:image/png;base64,${btoa(previewFile.content || '')}`} 
                  alt={previewFile.name}
                  className="app-preview-image"
                />
              ) : isTextFile(previewFile.name) ? (
                <pre className="app-preview-text">{previewFile.content || ''}</pre>
              ) : (
                <div className="app-preview-unknown">
                  <div className="app-preview-icon">📄</div>
                  <p>无法预览此文件类型</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>大小: {formatSize((previewFile.content?.length || 0) * 2)}</p>
                </div>
              )}
            </div>
            <div className="app-modal-footer">
              <button className="app-modal-btn" onClick={() => handleDownload(previewFile.id)}>⬇️ 下载</button>
              <button className="app-modal-btn" onClick={() => { 
                openFileWith(previewFile.id, 'text-editor'); 
                setPreviewFile(null); 
              }}>📝 编辑</button>
              <button className="app-modal-btn app-modal-btn-cancel" onClick={() => setPreviewFile(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}