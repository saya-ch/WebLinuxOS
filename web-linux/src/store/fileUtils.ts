import type { FileNode } from '../types'

const NODE_CACHE = new Map<string, { node: FileNode; timestamp: number }>()
const PATH_CACHE = new Map<string, { node: FileNode; timestamp: number }>()
const CACHE_TTL = 5000
const MAX_CACHE_SIZE = 200

function getCachedNode(id: string): FileNode | undefined {
  const cached = NODE_CACHE.get(id)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.node
  }
  return undefined
}

function setCachedNode(id: string, node: FileNode): void {
  if (NODE_CACHE.size >= MAX_CACHE_SIZE) {
    const oldestKey = NODE_CACHE.keys().next().value
    if (oldestKey) NODE_CACHE.delete(oldestKey)
  }
  NODE_CACHE.set(id, { node, timestamp: Date.now() })
}

function getCachedPath(path: string): FileNode | undefined {
  const cached = PATH_CACHE.get(path)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.node
  }
  return undefined
}

function setCachedPath(path: string, node: FileNode): void {
  if (PATH_CACHE.size >= MAX_CACHE_SIZE) {
    const oldestKey = PATH_CACHE.keys().next().value
    if (oldestKey) PATH_CACHE.delete(oldestKey)
  }
  PATH_CACHE.set(path, { node, timestamp: Date.now() })
}

export function invalidateCache(): void {
  NODE_CACHE.clear()
  PATH_CACHE.clear()
}

export function findNodeById(nodes: FileNode[], id: string): FileNode | null {
  const cached = getCachedNode(id)
  if (cached) return cached

  if (!nodes || nodes.length === 0) return null
  
  const stack: FileNode[] = [...nodes]
  while (stack.length > 0) {
    const node = stack.pop()
    if (!node) continue
    if (node.id === id) {
      setCachedNode(id, node)
      return node
    }
    if (node.children && node.children.length > 0) {
      stack.push(...node.children)
    }
  }
  return null
}

export function findParentNode(nodes: FileNode[], childId: string): FileNode | null {
  if (!nodes || nodes.length === 0) return null
  
  interface StackItem {
    node: FileNode
    parent: FileNode | null
  }
  
  const stack: StackItem[] = nodes.map(node => ({ node, parent: null }))
  
  while (stack.length > 0) {
    const { node } = stack.pop()!
    if (!node) continue
    
    if (node.children && node.children.length > 0) {
      if (node.children.some(c => c && c.id === childId)) {
        return node
      }
      stack.push(...node.children.map(child => ({ node: child!, parent: node })))
    }
  }
  return null
}

export function findNodeByPath(files: FileNode[], path: string): FileNode | null {
  if (!files || files.length === 0) return null
  
  const normalizedPath = path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
  
  const cached = getCachedPath(normalizedPath)
  if (cached) return cached
  
  if (normalizedPath === '/') {
    const root = files[0] || null
    if (root) setCachedPath('/', root)
    return root
  }
  
  const parts = normalizedPath.slice(1).split('/').filter(Boolean)
  if (parts.length === 0) {
    const root = files[0] || null
    if (root) setCachedPath('/', root)
    return root
  }
  
  let current: FileNode | null = files[0] || null
  let accumulatedPath = ''
  
  for (const part of parts) {
    accumulatedPath += `/${part}`
    if (!current || current.type !== 'folder' || !current.children) {
      const cachedParent = getCachedPath(accumulatedPath)
      if (cachedParent) return cachedParent
      return null
    }
    const next: FileNode | undefined = current.children.find((c) => c && c.name === part)
    if (!next) return null
    current = next
    setCachedPath(accumulatedPath, current)
    setCachedNode(current.id, current)
  }
  
  return current
}

export function getNodePath(files: FileNode[], targetId: string): string {
  if (!files || files.length === 0) return '/'
  
  const pathMap = new Map<string, string>()
  const stack: { node: FileNode; currentPath: string }[] = 
    files.map(node => ({ node, currentPath: '' }))
  
  while (stack.length > 0) {
    const { node, currentPath } = stack.pop()!
    if (!node) continue
    
    const fullPath = currentPath === '' ? `/${node.name}` : `${currentPath}/${node.name}`
    pathMap.set(node.id, fullPath)
    
    if (node.id === targetId) {
      return fullPath
    }
    
    if (node.children && node.children.length > 0) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        const child = node.children[i]
        if (child) {
          stack.push({ node: child, currentPath: fullPath })
        }
      }
    }
  }
  return '/'
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
  
  const result: FileNode[] = []
  const stack: { node: FileNode; parent: FileNode | undefined; index: number }[] = 
    nodes.map((node, index) => ({ node, parent: undefined, index }))
  
  while (stack.length > 0) {
    const { node, parent, index } = stack.pop()!
    if (!node) continue
    
    const callbackResult = callback(node, parent)
    const processedNode = callbackResult !== undefined ? callbackResult : node
    
    if (processedNode.children && processedNode.children.length > 0) {
      const newChildren: FileNode[] = []
      for (let i = processedNode.children.length - 1; i >= 0; i--) {
        const child = processedNode.children[i]
        if (child) {
          stack.push({ node: child, parent: processedNode, index: i })
        }
      }
      result[index] = { ...processedNode, children: newChildren }
    } else {
      result[index] = processedNode
    }
  }
  
  return result.filter((n): n is FileNode => n !== null && n !== undefined)
}

export function copyNodeWithNewParent(node: FileNode, newParentId: string, newId?: string): FileNode {
  if (!node) return { id: generateFileId(), name: 'unknown', type: 'file', parentId: newParentId }
  const id = newId || generateFileId()
  const now = new Date().toISOString()
  const newNode: FileNode = {
    ...node,
    id,
    parentId: newParentId,
    createdAt: node.createdAt || now,
    modifiedAt: now,
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
  
  invalidateCache()
  
  function removeHelper(items: FileNode[]): FileNode[] {
    return items
      .filter((node) => node && node.id !== id)
      .map((node) => {
        if (node && node.children && node.children.length > 0) {
          return { ...node, children: removeHelper(node.children) }
        }
        return node
      })
  }
  
  return removeHelper(nodes)
}

export function updateInTree(
  nodes: FileNode[],
  id: string,
  updater: (node: FileNode) => FileNode
): FileNode[] {
  if (!nodes) return []
  
  invalidateCache()
  
  function updateHelper(items: FileNode[]): FileNode[] {
    return items.map((node) => {
      if (!node) return node
      if (node.id === id) return updater(node)
      if (node.children && node.children.length > 0) {
        return { ...node, children: updateHelper(node.children) }
      }
      return node
    })
  }
  
  return updateHelper(nodes)
}

export function countNodes(nodes: FileNode[]): { files: number; folders: number; totalSize: number } {
  let files = 0
  let folders = 0
  let totalSize = 0
  
  const stack: FileNode[] = [...nodes]
  while (stack.length > 0) {
    const node = stack.pop()
    if (!node) continue
    if (node.type === 'folder') {
      folders++
      if (node.children) {
        stack.push(...node.children)
      }
    } else {
      files++
      if (node.content) totalSize += node.content.length
    }
  }
  
  return { files, folders, totalSize }
}

export function searchFiles(
  nodes: FileNode[],
  query: string,
  options: { caseSensitive?: boolean; content?: boolean; limit?: number } = {}
): FileNode[] {
  const results: FileNode[] = []
  const searchTerm = options.caseSensitive ? query : query.toLowerCase()
  const limit = options.limit || 100
  
  const stack: FileNode[] = [...nodes]
  while (stack.length > 0 && results.length < limit) {
    const node = stack.pop()
    if (!node) continue
    
    const nameMatch = options.caseSensitive ? node.name : node.name.toLowerCase()
    if (nameMatch.includes(searchTerm)) {
      results.push(node)
      if (results.length >= limit) break
    }
    
    if (options.content && node.type === 'file' && node.content) {
      const contentMatch = options.caseSensitive
        ? node.content
        : node.content.toLowerCase()
      if (contentMatch.includes(searchTerm) && !results.includes(node)) {
        results.push(node)
        if (results.length >= limit) break
      }
    }
    
    if (node.children && node.children.length > 0) {
      stack.push(...node.children)
    }
  }
  
  return results.sort((a, b) => {
    const aMatch = (options.caseSensitive ? a.name : a.name.toLowerCase()).indexOf(searchTerm)
    const bMatch = (options.caseSensitive ? b.name : b.name.toLowerCase()).indexOf(searchTerm)
    return aMatch - bMatch
  })
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

export function getAllFiles(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = []
  
  const stack: FileNode[] = [...nodes]
  while (stack.length > 0) {
    const node = stack.pop()
    if (!node) continue
    if (node.type === 'folder') {
      if (node.children) stack.push(...node.children)
    } else {
      result.push(node)
    }
  }
  
  return result
}

export function getAllFilePaths(nodes: FileNode[]): string[] {
  if (!nodes || nodes.length === 0) return []
  const paths: string[] = []
  
  interface StackItem {
    list: FileNode[]
    prefix: string
  }
  
  const stack: StackItem[] = [{ list: nodes, prefix: '' }]
  
  while (stack.length > 0) {
    const { list, prefix } = stack.pop()!
    for (const node of list) {
      if (!node) continue
      const current = prefix === '' ? `/${node.name}` : `${prefix}/${node.name}`
      if (node.type === 'folder') {
        if (node.children && node.children.length > 0) {
          stack.push({ list: node.children, prefix: current })
        }
      } else {
        paths.push(current)
      }
    }
  }
  
  return paths
}

export function getFileExtension(name: string): string {
  if (!name || typeof name !== 'string') return ''
  const trimmed = name.trim()
  const lastDot = trimmed.lastIndexOf('.')
  if (lastDot <= 0 || lastDot === trimmed.length - 1) return ''
  return trimmed.slice(lastDot).toLowerCase()
}

export function getFileStats(nodes: FileNode[]): {
  files: number
  folders: number
  totalSize: number
} {
  return countNodes(nodes)
}