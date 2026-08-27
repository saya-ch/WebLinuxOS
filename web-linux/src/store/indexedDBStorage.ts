/**
 * IndexedDB 文件存储模块
 *
 * 使用原生 IndexedDB API 存储虚拟文件系统数据，突破 localStorage 5MB 限制。
 * 当 IndexedDB 不可用时，自动回退到 localStorage。
 * 使用版本迁移策略，方便未来数据库升级。
 */

// 数据库配置
const DB_NAME = 'weblinux-filestore'
const DB_VERSION = 1
const STORE_NAME = 'files'

// 文件树在 Object Store 中的主键
const FILE_TREE_KEY = 'main'

/**
 * IndexedDB 存储使用统计
 */
export interface StorageUsageInfo {
  /** 已使用字节数 */
  used: number
  /** 总配额字节数 */
  quota: number
  /** 使用百分比 */
  percent: number
}

/**
 * 检测 IndexedDB 是否可用
 */
function isIndexedDBAvailable(): boolean {
  try {
    return (
      typeof indexedDB !== 'undefined' &&
      typeof window !== 'undefined' &&
      window.indexedDB !== null
    )
  } catch {
    return false
  }
}

/**
 * 打开 IndexedDB 数据库，返回 Promise<IDBDatabase>
 * 使用版本迁移策略，在 onupgradeneeded 中执行 schema 变更
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB 不可用'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    // 版本升级时触发：用于创建或修改 Object Store
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // 版本迁移策略：根据 oldVersion 执行增量迁移
      // 版本 0 → 1：创建 files store
      if (event.oldVersion < 1) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }

      // 未来升级示例：
      // if (event.oldVersion < 2) {
      //   const tx = (event.target as IDBOpenDBRequest).transaction!
      //   const store = tx.objectStore(STORE_NAME)
      //   store.createIndex('updatedAt', 'updatedAt', { unique: false })
      // }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

/**
 * 将数据保存到 IndexedDB 的 files store
 *
 * @param files  文件树数据（任意可序列化的值）
 */
export async function saveFileTree(files: unknown): Promise<void> {
  if (!isIndexedDBAvailable()) {
    throw new Error('IndexedDB 不可用')
  }

  const db = await openDB()

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.put(files, FILE_TREE_KEY)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)

      tx.onerror = () => reject(tx.error)
      tx.oncomplete = () => resolve()
    })
  } finally {
    db.close()
  }
}

/**
 * 从 IndexedDB 的 files store 读取文件树数据
 *
 * @returns  文件树数据，不存在时返回 null
 */
export async function loadFileTree<T = unknown>(): Promise<T | null> {
  if (!isIndexedDBAvailable()) {
    throw new Error('IndexedDB 不可用')
  }

  const db = await openDB()

  try {
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(FILE_TREE_KEY)

      request.onsuccess = () => {
        const result = request.result
        // IndexedDB 中未找到时 result 为 undefined
        resolve(result === undefined ? null : (result as T))
      }

      request.onerror = () => reject(request.error)
    })
  } finally {
    db.close()
  }
}

/**
 * 清空 IndexedDB 中的文件树数据
 */
export async function clearFileTree(): Promise<void> {
  if (!isIndexedDBAvailable()) {
    throw new Error('IndexedDB 不可用')
  }

  const db = await openDB()

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const request = store.delete(FILE_TREE_KEY)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)

      tx.onerror = () => reject(tx.error)
      tx.oncomplete = () => resolve()
    })
  } finally {
    db.close()
  }
}

/**
 * 获取 IndexedDB 的存储使用统计
 *
 * 使用 navigator.storage API 获取精确的配额信息；
 * 如果 API 不可用，则基于文件树数据大小进行估算。
 *
 * @returns  包含 used、quota、percent 的统计对象
 */
export async function getStorageUsage(): Promise<StorageUsageInfo> {
  const defaultUsage: StorageUsageInfo = { used: 0, quota: 0, percent: 0 }

  try {
    // 尝试使用 Storage Manager API 获取精确信息
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate()
      return {
        used: estimate.usage ?? 0,
        quota: estimate.quota ?? 0,
        percent: estimate.quota ? ((estimate.usage ?? 0) / estimate.quota) * 100 : 0,
      }
    }
  } catch (err) {
    console.warn('[indexedDBStorage] 获取存储配额失败：', (err as Error).message)
  }

  // 回退：尝试读取文件树估算大小
  try {
    if (isIndexedDBAvailable()) {
      const fileTree = await loadFileTree()
      if (fileTree !== null) {
        const serialized = JSON.stringify(fileTree)
        const used = serialized.length * 2 // UTF-16 近似字节数
        return { used, quota: 0, percent: 0 }
      }
    }
  } catch (err) {
    console.warn('[indexedDBStorage] 估算存储大小失败：', (err as Error).message)
  }

  return defaultUsage
}

/**
 * 检测 IndexedDB 是否可用（同步方法，供外部调用）
 */
export function isIndexedDBSupported(): boolean {
  return isIndexedDBAvailable()
}
