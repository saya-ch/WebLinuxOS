import { useState, useCallback, memo, useMemo } from 'react'
import { useStore, findNodeById, validateFileName } from '../store'
import type { FileNode } from '../types'

function formatSize(size: number | undefined): string {
  if (!size) return '0 B'
  if (size < 1024) return `${size} B`
  if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1048576).toFixed(1)} MB`
}

function getFileIcon(type: 'file' | 'folder'): string {
  return type === 'folder' ? '📁' : '📄'
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

  const [currentPath, setCurrentPath] = useState<string[]>(['root'])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']))
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, fileId: '' })
  const [renameTarget, setRenameTarget] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [newItemInput, setNewItemInput] = useState<'file' | 'folder' | null>(null)
  const [newItemName, setNewItemName] = useState('')

  const currentNodeId = currentPath[currentPath.length - 1]
  const currentNode = findNodeById(files, currentNodeId)

  const children = currentNode?.children || []

  function navigateTo(nodeId: string) {
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
      setSelectedFileId(null)
    }
  }

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

  function handleFileDoubleClick(file: FileNode) {
    if (file.type === 'folder') {
      navigateTo(file.id)
    } else {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const codeExts = ['py', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'xml', 'yml', 'yaml', 'sh', 'sql', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb', 'md']
      const appId = codeExts.includes(ext || '') ? 'code-editor' : 'text-editor'
      openFileWith(file.id, appId)
    }
  }

  function handleContextMenu(e: React.MouseEvent, fileId: string) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, fileId })
  }

  function closeContextMenu() {
    setContextMenu({ visible: false, x: 0, y: 0, fileId: '' })
  }

  function handleDelete(fileId: string) {
    deleteFile(fileId)
    if (selectedFileId === fileId) setSelectedFileId(null)
    closeContextMenu()
  }

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

  function goToParent() {
    if (currentPath.length > 1) {
      const newPath = currentPath.slice(0, -1)
      setCurrentPath(newPath)
      setExpandedFolders((prev) => new Set([...prev, newPath[newPath.length - 1]]))
    }
  }

  function handleRefresh() {
    setSelectedFileId(null)
    setContextMenu({ visible: false, x: 0, y: 0, fileId: '' })
  }

  const treeContent = useMemo(() => {
    return files.map((node) => (
      <TreeItem
        key={node.id}
        node={node}
        depth={0}
        isExpanded={expandedFolders.has(node.id)}
        isSelected={selectedFileId === node.id}
        onSelect={setSelectedFileId}
        onDoubleClick={handleFileDoubleClick}
        onContextMenu={handleContextMenu}
        onToggle={toggleFolderExpand}
      />
    ))
  }, [files, expandedFolders, selectedFileId])

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

  return (
    <div className="app-container app-file-manager" onClick={closeContextMenu}>
      <div className="app-toolbar">
        <button className="app-toolbar-btn" onClick={goToParent} title="返回上级">⬆</button>
        <button className="app-toolbar-btn" onClick={handleRefresh} title="刷新">🔄</button>
        <span className="app-toolbar-separator" />
        <button className="app-toolbar-btn" onClick={() => handleCreateNew('folder')} title="新建文件夹">📁+</button>
        <button className="app-toolbar-btn" onClick={() => handleCreateNew('file')} title="新建文件">📄+</button>
        {selectedFileId && (
          <button className="app-toolbar-btn" onClick={() => handleDelete(selectedFileId)} title="删除">🗑</button>
        )}
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
        <div className="app-file-list-container">
          <div className="app-file-list-header">
            <span className="app-file-col-name">名称</span>
            <span className="app-file-col-type">类型</span>
            <span className="app-file-col-size">大小</span>
            <span className="app-file-col-date">修改日期</span>
          </div>
          <div className="app-file-list">
            {children.map((file) => (
              <div
                key={file.id}
                className={`app-file-row${selectedFileId === file.id ? ' selected' : ''}`}
                onClick={() => setSelectedFileId(file.id)}
                onDoubleClick={() => handleFileDoubleClick(file)}
                onContextMenu={(e) => handleContextMenu(e, file.id)}
              >
                <span className="app-file-col-name">
                  <span className="app-file-icon">{getFileIcon(file.type)}</span>
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
            ))}
            {children.length === 0 && (
              <div className="app-file-empty">此文件夹为空</div>
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
          <div className="app-context-menu-item" onClick={() => handleDelete(contextMenu.fileId)}>
            🗑 删除
          </div>
          <div className="app-context-menu-item" onClick={() => handleRenameStart(contextMenu.fileId)}>
            ✏️ 重命名
          </div>
          <div className="app-context-menu-separator" />
          <div className="app-context-menu-item" onClick={() => handleCreateNew('folder')}>
            📁 新建文件夹
          </div>
          <div className="app-context-menu-item" onClick={() => handleCreateNew('file')}>
            📄 新建文件
          </div>
        </div>
      )}
    </div>
  )
}