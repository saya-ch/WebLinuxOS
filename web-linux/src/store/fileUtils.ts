import type { FileNode } from '../types'

/**
 * 在节点树中根据 id 查找目标节点（深度优先递归）
 *
 * @param nodes  根节点数组
 * @param id     目标节点 id
 * @returns      匹配的 FileNode，未找到时返回 null
 */
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

/**
 * 查找目标节点的父节点
 *
 * @param nodes     根节点数组
 * @param childId   目标子节点 id
 * @returns         父 FileNode，未找到时返回 null
 */
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

/**
 * 按照“/分隔的路径”在文件树中定位节点
 *
 * @param files  根节点数组
 * @param path   路径字符串（如 /home/user/readme.txt）
 * @returns      匹配的 FileNode，未找到时返回 null
 */
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

/**
 * 计算某个节点在文件树中的完整路径
 *
 * @param files     根节点数组
 * @param targetId  目标节点 id
 * @returns         以 / 开头的路径字符串
 */
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

/**
 * 将当前工作目录与目标合并为最终路径，支持相对路径、.. 和 .
 *
 * @param cwd     当前目录路径（如 /home/user）
 * @param target  目标路径（可以是绝对或相对）
 * @returns       规范化后的绝对路径
 */
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

/**
 * 遍历节点树，对每个节点调用回调；
 * 若回调返回新的节点则替换原节点，否则保持并递归其子节点
 *
 * @param nodes     根节点数组
 * @param callback  返回新节点或 undefined 的回调
 * @returns         处理后的节点数组
 */
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

/**
 * 复制一个节点（含其子节点），并为其重新绑定父节点 id
 *
 * @param node           源节点
 * @param newParentId    新的父节点 id
 * @param newId          可选的新节点 id（默认重新生成）
 * @returns              复制后的节点副本
 */
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

/**
 * 从节点树中移除指定 id 的节点
 *
 * @param nodes  根节点数组
 * @param id     需要移除的节点 id
 * @returns      移除后的新节点数组
 */
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

/**
 * 在节点树中根据 id 更新节点
 *
 * @param nodes    根节点数组
 * @param id       目标节点 id
 * @param updater  更新函数，返回替换后的节点
 * @returns        更新后的新节点数组
 */
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

/**
 * 统计节点数和总大小（近似值）
 *
 * @param nodes  根节点数组
 * @returns      { files: 文件数, folders: 文件夹数, totalSize: 内容字符总数 }
 */
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

/**
 * 在节点树中按名称或内容关键字搜索节点
 *
 * @param nodes    根节点数组
 * @param query    搜索关键字
 * @param options  { caseSensitive?: 是否区分大小写; content?: 是否同时匹配文件内容 }
 * @returns        匹配结果数组
 */
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

/**
 * 校验文件名是否合法：不允许空、过长、非法字符以及 . 和 ..
 *
 * @param name  文件/文件夹名
 * @returns       { valid: 是否合法; error?: 错误信息 }
 */
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

/**
 * 生成唯一的文件节点 id
 *
 * @returns 形如 file-169xxxx-random-random 的 id
 */
export function generateFileId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${Math.random().toString(36).slice(2, 5)}`
}

/**
 * 生成一个窗口 id（用于其他模块辅助）
 *
 * @param counter  当前窗口计数
 * @returns        window-<counter>
 */
export function generateWindowId(counter: number): string {
  return `window-${counter}`
}

/**
 * 将节点数组按“文件夹优先、后按名称本地化排序”的顺序排序
 *
 * @param nodes  节点数组
 * @returns      排序后的新节点数组
 */
export function sortNodes(nodes: FileNode[]): FileNode[] {
  if (!nodes || nodes.length === 0) return []
  return [...nodes].sort((a, b) => {
    if (!a || !b) return 0
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name, 'zh-CN')
  })
}

/**
 * 递归获取所有文件节点（不包含文件夹自身）
 *
 * @param nodes  根节点数组
 * @returns      所有文件节点数组
 */
export function getAllFiles(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = []
  function walk(list: FileNode[]) {
    for (const node of list) {
      if (!node) continue
      if (node.type === 'folder') {
        if (node.children) walk(node.children)
      } else {
        result.push(node)
      }
    }
  }
  walk(nodes)
  return result
}

/**
 * 递归获取所有文件节点的完整路径列表（用于显示、搜索与批量处理）
 *
 * @param nodes  根节点数组
 * @returns      所有文件的路径列表（如 [ "/home/user/a.txt", ... ]）
 */
export function getAllFilePaths(nodes: FileNode[]): string[] {
  if (!nodes || nodes.length === 0) return []
  const paths: string[] = []
  // 使用 DFS 遍历：prefix 为当前层已经拼接好的路径前缀
  function walk(list: FileNode[], prefix: string) {
    for (const node of list) {
      if (!node) continue
      const current = prefix === '' ? `/${node.name}` : `${prefix}/${node.name}`
      if (node.type === 'folder') {
        if (node.children && node.children.length > 0) {
          walk(node.children, current)
        }
      } else {
        paths.push(current)
      }
    }
  }
  walk(nodes, '')
  return paths
}

/**
 * 从文件名中提取扩展名（小写形式；无扩展名返回空字符串）
 *
 * @param name  文件名
 * @returns     扩展名（含点号），如 ".txt"
 */
export function getFileExtension(name: string): string {
  if (!name || typeof name !== 'string') return ''
  const trimmed = name.trim()
  const lastDot = trimmed.lastIndexOf('.')
  // 排除以点号开头的隐藏文件，且没有其他点号的情况
  if (lastDot <= 0 || lastDot === trimmed.length - 1) return ''
  return trimmed.slice(lastDot).toLowerCase()
}

/**
 * 快速统计文件树中的文件/文件夹数量与总内容大小（近似估算）
 *
 * @param nodes  根节点数组
 * @returns      { files, folders, totalSize }
 */
export function getFileStats(nodes: FileNode[]): {
  files: number
  folders: number
  totalSize: number
} {
  return countNodes(nodes)
}
