import { useState, useCallback } from 'react'
import { useStore } from '../store'
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
  const updateFileContent = useStore((s) => s.updateFileContent)
  const openApp = useStore((s) => s.openApp)

  const [currentPath, setCurrentPath] = useState<string[]>(['root'])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']))
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, fileId: '' })
  const [renameTarget, setRenameTarget] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [newItemInput, setNewItemInput] = useState<'file' | 'folder' | null>(null)
  const [newItemName, setNewItemName] = useState('')

  function findNodeById(nodes: FileNode[], id: string): FileNode | null {
    for (const n of nodes) {
      if (n.id === id) return n
      if (n.children) {
        const found = findNodeById(n.children, id)
        if (found) return found
      }
    }
    return null
  }

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
      openApp('text-editor')
      setTimeout(() => {
        updateFileContent(file.id, file.content || '')
      }, 100)
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
      const node = findNodeById(files, renameTarget)
      if (node) {
        updateFileContent(renameTarget, node.content || '')
      }
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

  function buildTree(nodes: FileNode[], depth: number = 0): React.ReactNode[] {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.has(node.id)
      const isSelected = selectedFileId === node.id
      const hasChildren = node.children && node.children.length > 0
      return (
        <div key={node.id}>
          <div
            className={`app-file-tree-item${isSelected ? ' selected' : ''}`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
            onClick={() => {
              setSelectedFileId(node.id)
              if (node.type === 'folder') {
                toggleFolderExpand(node.id)
              }
            }}
            onDoubleClick={() => handleFileDoubleClick(node)}
            onContextMenu={(e) => handleContextMenu(e, node.id)}
          >
            <span className="app-file-tree-icon">
              {node.type === 'folder' ? (isExpanded ? '📂' : '📁') : '📄'}
            </span>
            <span className="app-file-tree-name">{node.name}</span>
          </div>
          {node.type === 'folder' && isExpanded && hasChildren && (
            <div className="app-file-tree-children">
              {buildTree(node.children!, depth + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  function getFileDate(node: FileNode): string {
    const hash = node.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const now = new Date()
    const past = new Date(now.getTime() - (hash % 90) * 86400000)
    return past.toLocaleDateString('zh-CN')
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
            {buildTree(files)}
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
          <div className="app-context-menu-item" onClick={() => handleFileDoubleClick(findNodeById(files, contextMenu.fileId)!)}>
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