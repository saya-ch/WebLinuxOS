import type { FileNode } from '../types'

export function findNodeById(nodes: FileNode[], id: string): FileNode | null {
  if (!nodes || nodes.length === 0) return null
  for (const node of nodes) {
    if (!node) continue
    if (node.id === id) return node
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

export function findParentNode(nodes: FileNode[], childId: string): FileNode | null {
  if (!nodes || nodes.length === 0) return null
  for (const node of nodes) {
    if (!node) continue
    if (node.children && node.children.length > 0) {
      if (node.children.some(c => c && c.id === childId)) {
        return node
      }
      const found = findParentNode(node.children, childId)
      if (found) return found
    }
  }
  return null
}

export function findNodeByPath(files: FileNode[], path: string): FileNode | null {
  if (!files || files.length === 0) return null
  if (path === '/' || path === '' || path === undefined) {
    return files[0] || null
  }
  const parts = path.replace(/^\/+/, '').split('/').filter(Boolean)
  if (parts.length === 0) return files[0] || null
  let current: FileNode | null = files[0] || null
  for (const part of parts) {
    if (!current || current.type !== 'folder' || !current.children) return null
    const next: FileNode | undefined = current.children.find((c) => c && c.name === part)
    if (!next) return null
    current = next
  }
  return current
}

export function getNodePath(files: FileNode[], targetId: string): string {
  if (!files || files.length === 0) return '/'
  const path: string[] = []
  function walk(nodes: FileNode[]): boolean {
    for (const node of nodes) {
      if (!node) continue
      if (node.id === targetId) {
        path.unshift(node.name)
        return true
      }
      if (node.children && node.children.length > 0) {
        if (walk(node.children)) {
          path.unshift(node.name)
          return true
        }
      }
    }
    return false
  }
  walk(files)
  if (path.length === 0) return '/'
  const result = path.join('/')
  return result.startsWith('//') ? result.slice(1) : '/' + result
}

export function resolvePath(cwd: string, target: string): string {
  if (!target) return cwd || '/'
  if (target.startsWith('/')) {
    const parts = target.split('/').filter(Boolean)
    const resolved: string[] = []
    for (const part of parts) {
      if (part === '..') resolved.pop()
      else if (part !== '.') resolved.push(part)
    }
    return '/' + resolved.join('/')
  }
  const base = (cwd || '/') === '/' ? '' : cwd
  const parts = (base + '/' + target).split('/').filter(Boolean)
  const resolved: string[] = []
  for (const part of parts) {
    if (part === '..') resolved.pop()
    else if (part !== '.') resolved.push(part)
  }
  return '/' + resolved.join('/')
}

export function traverseTree(
  nodes: FileNode[],
  callback: (node: FileNode, parent?: FileNode) => FileNode | undefined
): FileNode[] {
  if (!nodes) return []
  return nodes
    .filter((node): node is FileNode => node !== null && node !== undefined)
    .map((node) => {
      const result = callback(node)
      if (result !== undefined) return result
      if (node.children && node.children.length > 0) {
        return { ...node, children: traverseTree(node.children, callback) }
      }
      return node
    })
}

export function copyNodeWithNewParent(node: FileNode, newParentId: string, newId?: string): FileNode {
  if (!node) return { id: generateFileId(), name: 'unknown', type: 'file', parentId: newParentId }
  const id = newId || generateFileId()
  const newNode: FileNode = {
    ...node,
    id,
    parentId: newParentId,
  }
  if (node.children && node.children.length > 0) {
    newNode.children = node.children.map((child) => copyNodeWithNewParent(child, id))
  } else {
    newNode.children = node.type === 'folder' ? [] : undefined
  }
  return newNode
}

export function removeFromTree(nodes: FileNode[], id: string): FileNode[] {
  if (!nodes) return []
  return nodes
    .filter((node) => node && node.id !== id)
    .map((node) => {
      if (node.children && node.children.length > 0) {
        return { ...node, children: removeFromTree(node.children, id) }
      }
      return node
    })
}

export function updateInTree(
  nodes: FileNode[],
  id: string,
  updater: (node: FileNode) => FileNode
): FileNode[] {
  if (!nodes) return []
  return nodes.map((node) => {
    if (node && node.id === id) return updater(node)
    if (node && node.children && node.children.length > 0) {
      return { ...node, children: updateInTree(node.children, id, updater) }
    }
    return node
  })
}

export function countNodes(nodes: FileNode[]): { files: number; folders: number; totalSize: number } {
  let files = 0
  let folders = 0
  let totalSize = 0
  function walk(list: FileNode[]) {
    for (const node of list) {
      if (!node) continue
      if (node.type === 'folder') {
        folders++
        if (node.children) walk(node.children)
      } else {
        files++
        if (node.content) totalSize += node.content.length
      }
    }
  }
  walk(nodes)
  return { files, folders, totalSize }
}

export function searchFiles(
  nodes: FileNode[],
  query: string,
  options: { caseSensitive?: boolean; content?: boolean } = {}
): FileNode[] {
  const results: FileNode[] = []
  const searchTerm = options.caseSensitive ? query : query.toLowerCase()
  function walk(list: FileNode[]) {
    for (const node of list) {
      if (!node) continue
      const nameMatch = options.caseSensitive ? node.name : node.name.toLowerCase()
      if (nameMatch.includes(searchTerm)) {
        results.push(node)
      }
      if (options.content && node.type === 'file' && node.content) {
        const contentMatch = options.caseSensitive
          ? node.content
          : node.content.toLowerCase()
        if (contentMatch.includes(searchTerm) && !results.includes(node)) {
          results.push(node)
        }
      }
      if (node.children && node.children.length > 0) {
        walk(node.children)
      }
    }
  }
  walk(nodes)
  return results
}

export function validateFileName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { valid: false, error: '文件名不能为空' }
  }
  const trimmed = name.trim()
  if (trimmed.length > 255) {
    return { valid: false, error: '文件名过长（最大255字符）' }
  }
  const invalidChars = /[<>:"|?*/\\]/
  if (invalidChars.test(trimmed)) {
    return { valid: false, error: '文件名包含非法字符 (< > : " | ? * / \\)' }
  }
  if (trimmed === '.' || trimmed === '..') {
    return { valid: false, error: '不能使用此文件名' }
  }
  if (/^\s|\s$/.test(trimmed)) {
    return { valid: false, error: '文件名不能以空格开头或结尾' }
  }
  return { valid: true }
}

export function generateFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${Math.random().toString(36).slice(2, 5)}`
}

export function generateWindowId(counter: number): string {
  return `window-${counter}`
}

export function sortNodes(nodes: FileNode[]): FileNode[] {
  if (!nodes || nodes.length === 0) return []
  return [...nodes].sort((a, b) => {
    if (!a || !b) return 0
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name, 'zh-CN')
  })
}
