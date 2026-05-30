import type { FileNode } from './types'

export function findNodeById(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

export function findParentNode(nodes: FileNode[], childId: string): FileNode | null {
  for (const node of nodes) {
    if (node.children) {
      if (node.children.some(c => c.id === childId)) {
        return node
      }
      const found = findParentNode(node.children, childId)
      if (found) return found
    }
  }
  return null
}

export function findNodeByPath(files: FileNode[], path: string): FileNode | null {
  if (path === '/' || path === '') return files[0]
  const parts = path.replace(/^\//, '').split('/')
  let current: FileNode | null = files[0]
  for (const part of parts) {
    if (!part || !current?.children) continue
    current = current.children.find((c) => c.name === part) || null
    if (!current) return null
  }
  return current
}

export function resolvePath(cwd: string, target: string): string {
  if (target.startsWith('/')) return target
  const parts = (cwd + '/' + target).split('/').filter(Boolean)
  const resolved: string[] = []
  for (const part of parts) {
    if (part === '..') {
      resolved.pop()
    } else if (part !== '.') {
      resolved.push(part)
    }
  }
  return '/' + resolved.join('/')
}

export function traverseTree(nodes: FileNode[], callback: (node: FileNode, parent?: FileNode) => FileNode | undefined): FileNode[] {
  return nodes.map(node => {
    const result = callback(node)
    if (result !== undefined) return result
    if (node.children) {
      return { ...node, children: traverseTree(node.children, callback) }
    }
    return node
  }).filter((node): node is FileNode => node !== null)
}

export function copyNodeWithNewParent(node: FileNode, newParentId: string, newId?: string): FileNode {
  const id = newId || `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const newNode: FileNode = {
    ...node,
    id,
    parentId: newParentId,
    children: undefined,
  }
  if (node.children) {
    newNode.children = node.children.map(child => copyNodeWithNewParent(child, id))
  }
  return newNode
}

export function removeFromTree(nodes: FileNode[], id: string): FileNode[] {
  return nodes
    .filter(node => node.id !== id)
    .map(node => {
      if (node.children) {
        return { ...node, children: removeFromTree(node.children, id) }
      }
      return node
    })
}

export function updateInTree(nodes: FileNode[], id: string, updater: (node: FileNode) => FileNode): FileNode[] {
  return nodes.map(node => {
    if (node.id === id) return updater(node)
    if (node.children) {
      return { ...node, children: updateInTree(node.children, id, updater) }
    }
    return node
  })
}

export function validateFileName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: '文件名不能为空' }
  }
  if (name.length > 255) {
    return { valid: false, error: '文件名过长（最大255字符）' }
  }
  const invalidChars = /[<>:"|?*]/
  if (invalidChars.test(name)) {
    return { valid: false, error: '文件名包含非法字符' }
  }
  if (name === '.' || name === '..') {
    return { valid: false, error: '不能使用此文件名' }
  }
  return { valid: true }
}

export function generateFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function generateWindowId(counter: number): string {
  return `window-${counter}`
}
