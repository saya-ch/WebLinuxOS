const DB_NAME = 'weblinuxos-filesystem'
const DB_VERSION = 2
const STORE_FILES = 'files'
const STORE_META = 'metadata'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' })
      }
    }
  })
}

export async function saveFilesToIndexedDB(files: unknown[]): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_FILES], 'readwrite')
      const store = transaction.objectStore(STORE_FILES)
      store.clear()
      files.forEach((file) => {
        store.put(file)
      })
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch {
    console.warn('IndexedDB save failed, falling back to localStorage')
  }
}

export async function loadFilesFromIndexedDB<T>(): Promise<T[] | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_FILES], 'readonly')
      const store = transaction.objectStore(STORE_FILES)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result as T[])
      request.onerror = () => reject(request.error)
    })
  } catch {
    return null
  }
}

export async function saveMetadata(key: string, value: unknown): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_META], 'readwrite')
      const store = transaction.objectStore(STORE_META)
      store.put({ key, value, updatedAt: Date.now() })
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch {
    console.warn('IndexedDB metadata save failed')
  }
}

export async function loadMetadata<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_META], 'readonly')
      const store = transaction.objectStore(STORE_META)
      const request = store.get(key)
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.value as T : null)
      }
      request.onerror = () => reject(request.error)
    })
  } catch {
    return null
  }
}

export async function exportFileSystem(): Promise<string> {
  const files = await loadFilesFromIndexedDB()
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_META], 'readonly')
    const store = transaction.objectStore(STORE_META)
    const metaRequest = store.getAll()
    metaRequest.onsuccess = () => {
      const exportData = {
        version: DB_VERSION,
        exportedAt: new Date().toISOString(),
        files: files || [],
        metadata: metaRequest.result || [],
      }
      resolve(JSON.stringify(exportData, null, 2))
    }
    metaRequest.onerror = () => reject(metaRequest.error)
  })
}

export async function importFileSystem(jsonData: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonData)
    if (!data.files || !Array.isArray(data.files)) {
      return false
    }
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_FILES, STORE_META], 'readwrite')
      const fileStore = transaction.objectStore(STORE_FILES)
      fileStore.clear()
      data.files.forEach((file: unknown) => {
        fileStore.put(file)
      })
      if (data.metadata && Array.isArray(data.metadata)) {
        const metaStore = transaction.objectStore(STORE_META)
        metaStore.clear()
        data.metadata.forEach((meta: unknown) => {
          metaStore.put(meta)
        })
      }
      transaction.oncomplete = () => resolve(true)
      transaction.onerror = () => reject(transaction.error)
    })
  } catch {
    return false
  }
}
