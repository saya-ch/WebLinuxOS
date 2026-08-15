import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DatabaseIcon, TrashIcon, DownloadIcon, SearchIcon,
  EyeIcon, EyeOffIcon, CopyIcon, RefreshCwIcon,
  HardDriveIcon, ShieldIcon, AlertTriangleIcon,
  ChevronDownIcon, ChevronRightIcon, PlusIcon,
  FileJsonIcon, KeyIcon, ClockIcon, TableIcon
} from 'lucide-react'

interface StorageItem {
  key: string
  value: string
  size: number
  type: 'string' | 'json' | 'number' | 'boolean' | 'empty'
  source: 'localStorage' | 'sessionStorage'
  createdAt?: number
  updatedAt?: number
}

function getStorage(source: 'localStorage' | 'sessionStorage'): Storage {
  return source === 'localStorage' ? localStorage : sessionStorage
}

interface StorageStats {
  localStorageCount: number
  sessionStorageCount: number
  localStorageSize: number
  sessionStorageSize: number
  totalSize: number
  quotaMB: number
  usagePercent: number
}

interface IndexedDBRecord {
  dbName: string
  storeName: string
  key: IDBValidKey
  value: any
  keyPath?: string | string[]
  autoIncrement?: boolean
}

interface IndexedDBStoreInfo {
  name: string
  keyPath?: string | string[]
  autoIncrement: boolean
  recordCount: number
  indexes: string[]
}

interface IndexedDBInfo {
  name: string
  version: number
  stores: IndexedDBStoreInfo[]
}

const STORAGE_QUOTA_ESTIMATE = 5 * 1024 * 1024

function openDatabase(dbName: string, version?: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = version !== undefined ? indexedDB.open(dbName, version) : indexedDB.open(dbName)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => resolve(request.result)
  })
}

function getAllDatabases(): Promise<{ name: string; version: number }[]> {
  return indexedDB.databases().then(dbs => 
    dbs.filter((db): db is { name: string; version: number } => 
      db.name !== undefined && db.version !== undefined
    )
  )
}

async function getDatabaseInfo(dbName: string): Promise<IndexedDBInfo> {
  const db = await openDatabase(dbName)
  const storeNames = Array.from(db.objectStoreNames)
  const stores: IndexedDBStoreInfo[] = []

  for (const storeName of storeNames) {
    const store = db.transaction(storeName, 'readonly').objectStore(storeName)
    const indexNames = Array.from(store.indexNames)
    const countRequest = store.count()
    const recordCount = await new Promise<number>((resolve, reject) => {
      countRequest.onsuccess = () => resolve(countRequest.result)
      countRequest.onerror = () => reject(countRequest.error)
    })

    stores.push({
      name: storeName,
      keyPath: (store as IDBObjectStore & { keyPath?: string | string[] }).keyPath,
      autoIncrement: (store as IDBObjectStore & { autoIncrement?: boolean }).autoIncrement ?? false,
      recordCount,
      indexes: indexNames,
    })
  }

  const version = db.version
  db.close()

  return { name: dbName, version, stores }
}

async function getStoreRecords(dbName: string, storeName: string): Promise<IndexedDBRecord[]> {
  const db = await openDatabase(dbName)
  const transaction = db.transaction(storeName, 'readonly')
  const store = transaction.objectStore(storeName)
  const request = store.getAll()

  return new Promise<IndexedDBRecord[]>((resolve, reject) => {
    request.onsuccess = () => {
      const records: IndexedDBRecord[] = request.result.map((value, index) => {
        const keyPath = store.keyPath
        let key: IDBValidKey
        if (keyPath && typeof keyPath === 'string') {
          key = (value as Record<string, IDBValidKey>)[keyPath] ?? index
        } else if (store.autoIncrement || keyPath) {
          key = index
        } else {
          key = index
        }
        return {
          dbName,
          storeName,
          key,
          value,
          keyPath: typeof keyPath === 'string' || Array.isArray(keyPath) ? keyPath : undefined,
          autoIncrement: store.autoIncrement,
        }
      })
      db.close()
      resolve(records)
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

function deleteDatabase(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

async function deleteRecord(dbName: string, storeName: string, key: IDBValidKey): Promise<void> {
  const db = await openDatabase(dbName)
  const transaction = db.transaction(storeName, 'readwrite')
  const store = transaction.objectStore(storeName)
  const request = store.delete(key)

  return new Promise<void>((resolve, reject) => {
    request.onsuccess = () => {
      db.close()
      resolve()
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

function analyzeValue(value: string): { type: StorageItem['type']; isJson: boolean } {
  if (!value) return { type: 'empty', isJson: false }
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed === 'object' && parsed !== null) {
      return { type: 'json', isJson: true }
    }
    if (typeof parsed === 'number') return { type: 'number', isJson: true }
    if (typeof parsed === 'boolean') return { type: 'boolean', isJson: true }
  } catch {}
  
  if (!isNaN(Number(value)) && value.trim() !== '') return { type: 'number', isJson: false }
  if (value === 'true' || value === 'false') return { type: 'boolean', isJson: false }
  return { type: 'string', isJson: false }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function LocalStorageInspector() {
  const [items, setItems] = useState<StorageItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [showValue, setShowValue] = useState(true)
  const [stats, setStats] = useState<StorageStats>({
    localStorageCount: 0,
    sessionStorageCount: 0,
    localStorageSize: 0,
    sessionStorageSize: 0,
    totalSize: 0,
    quotaMB: 5,
    usagePercent: 0,
  })
  const [activeTab, setActiveTab] = useState<'localStorage' | 'sessionStorage' | 'indexedDB'>('localStorage')
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [indexedDBDatabases, setIndexedDBDatabases] = useState<{ name: string; version: number }[]>([])
  const [selectedDB, setSelectedDB] = useState<string | null>(null)
  const [selectedStore, setSelectedStore] = useState<string | null>(null)
  const [indexedDBRecords, setIndexedDBRecords] = useState<IndexedDBRecord[]>([])
  const [indexedDBInfo, setIndexedDBInfo] = useState<IndexedDBInfo | null>(null)
  const [indexedDBLoading, setIndexedDBLoading] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<IndexedDBRecord | null>(null)

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 2500)
  }, [])

  const loadIndexedDBDatabases = useCallback(async () => {
    setIndexedDBLoading(true)
    try {
      const dbs = await getAllDatabases()
      setIndexedDBDatabases(dbs)
      if (dbs.length > 0 && !selectedDB) {
        setSelectedDB(dbs[0].name)
      }
    } catch (e) {
      showNotification(`加载 IndexedDB 失败: ${e instanceof Error ? e.message : '未知错误'}`, 'error')
    } finally {
      setIndexedDBLoading(false)
    }
  }, [selectedDB, showNotification])

  const loadDatabaseInfo = useCallback(async (dbName: string) => {
    setIndexedDBLoading(true)
    setSelectedStore(null)
    setIndexedDBRecords([])
    setSelectedRecord(null)
    try {
      const info = await getDatabaseInfo(dbName)
      setIndexedDBInfo(info)
      if (info.stores.length > 0) {
        setSelectedStore(info.stores[0].name)
      }
    } catch (e) {
      showNotification(`加载数据库信息失败: ${e instanceof Error ? e.message : '未知错误'}`, 'error')
    } finally {
      setIndexedDBLoading(false)
    }
  }, [showNotification])

  const loadStoreRecords = useCallback(async (dbName: string, storeName: string) => {
    setIndexedDBLoading(true)
    setSelectedRecord(null)
    try {
      const records = await getStoreRecords(dbName, storeName)
      setIndexedDBRecords(records)
    } catch (e) {
      showNotification(`加载记录失败: ${e instanceof Error ? e.message : '未知错误'}`, 'error')
    } finally {
      setIndexedDBLoading(false)
    }
  }, [showNotification])

  const loadStorage = useCallback(() => {
    const loaded: StorageItem[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key) || ''
        const { type } = analyzeValue(value)
        loaded.push({
          key,
          value,
          size: key.length + value.length,
          type,
          source: 'localStorage',
        })
      }
    }
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key) {
        const value = sessionStorage.getItem(key) || ''
        const { type } = analyzeValue(value)
        loaded.push({
          key,
          value,
          size: key.length + value.length,
          type,
          source: 'sessionStorage',
        })
      }
    }
    
    setItems(loaded)
    
    const lsSize = loaded.filter(i => i.source === 'localStorage').reduce((sum, i) => sum + i.size, 0)
    const ssSize = loaded.filter(i => i.source === 'sessionStorage').reduce((sum, i) => sum + i.size, 0)
    const totalSize = lsSize + ssSize
    
    setStats({
      localStorageCount: loaded.filter(i => i.source === 'localStorage').length,
      sessionStorageCount: loaded.filter(i => i.source === 'sessionStorage').length,
      localStorageSize: lsSize,
      sessionStorageSize: ssSize,
      totalSize,
      quotaMB: STORAGE_QUOTA_ESTIMATE / (1024 * 1024),
      usagePercent: Math.round((totalSize / STORAGE_QUOTA_ESTIMATE) * 100),
    })
  }, [])

  useEffect(() => {
    loadStorage()
  }, [loadStorage])

  useEffect(() => {
    if (activeTab === 'indexedDB') {
      loadIndexedDBDatabases()
    }
  }, [activeTab, loadIndexedDBDatabases])

  useEffect(() => {
    if (selectedDB) {
      loadDatabaseInfo(selectedDB)
    }
  }, [selectedDB, loadDatabaseInfo])

  useEffect(() => {
    if (selectedDB && selectedStore) {
      loadStoreRecords(selectedDB, selectedStore)
    }
  }, [selectedDB, selectedStore, loadStoreRecords])

  const handleDeleteRecord = useCallback(async (dbName: string, storeName: string, key: IDBValidKey) => {
    if (!confirm(`确定要删除记录 ${String(key)} 吗？`)) return
    try {
      await deleteRecord(dbName, storeName, key)
      showNotification(`已删除记录 ${String(key)}`, 'success')
      setSelectedRecord(null)
      loadStoreRecords(dbName, storeName)
      loadDatabaseInfo(dbName)
    } catch (e) {
      showNotification(`删除失败: ${e instanceof Error ? e.message : '未知错误'}`, 'error')
    }
  }, [showNotification, loadStoreRecords, loadDatabaseInfo])

  const handleDeleteDatabase = useCallback(async (dbName: string) => {
    if (!confirm(`确定要删除数据库 "${dbName}" 吗？此操作将永久删除该数据库及其所有数据。`)) return
    try {
      await deleteDatabase(dbName)
      showNotification(`已删除数据库 "${dbName}"`, 'success')
      setSelectedDB(null)
      setSelectedStore(null)
      setIndexedDBRecords([])
      setIndexedDBInfo(null)
      setSelectedRecord(null)
      loadIndexedDBDatabases()
    } catch (e) {
      showNotification(`删除数据库失败: ${e instanceof Error ? e.message : '未知错误'}`, 'error')
    }
  }, [showNotification, loadIndexedDBDatabases])

  const handleExportIndexedDB = useCallback(async () => {
    if (!selectedDB) return
    try {
      const exportData: Record<string, unknown> = {
        database: selectedDB,
        exportTime: new Date().toISOString(),
        stores: {},
      }
      const info = await getDatabaseInfo(selectedDB)
      for (const store of info.stores) {
        const records = await getStoreRecords(selectedDB, store.name)
        ;(exportData.stores as Record<string, unknown>)[store.name] = records.map(r => ({
          key: r.key,
          value: r.value,
        }))
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `indexeddb-${selectedDB}-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      showNotification('导出成功', 'success')
    } catch (e) {
      showNotification(`导出失败: ${e instanceof Error ? e.message : '未知错误'}`, 'error')
    }
  }, [selectedDB, showNotification])

  const filteredItems = useMemo(() => {
    let result = items
    if (activeTab === 'localStorage') {
      result = result.filter(i => i.source === 'localStorage')
    } else if (activeTab === 'sessionStorage') {
      result = result.filter(i => i.source === 'sessionStorage')
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(i => 
        i.key.toLowerCase().includes(q) || 
        i.value.toLowerCase().includes(q)
      )
    }
    return result.sort((a, b) => b.size - a.size)
  }, [items, activeTab, search])

  const handleSelectItem = useCallback((item: StorageItem) => {
    setSelectedKey(item.key)
    setEditingValue(item.value)
  }, [])

  const handleSaveValue = useCallback(() => {
    if (!selectedKey) return
    const item = items.find(i => i.key === selectedKey)
    if (!item) return
    
    try {
      getStorage(item.source).setItem(selectedKey, editingValue)
      showNotification(`已保存 "${selectedKey}"`, 'success')
      loadStorage()
    } catch (e) {
      showNotification(`保存失败: ${e instanceof Error ? e.message : '未知错误'}`, 'error')
    }
  }, [selectedKey, editingValue, items, showNotification, loadStorage])

  const handleDeleteItem = useCallback((key: string) => {
    const item = items.find(i => i.key === key)
    if (!item) return
    
    if (!confirm(`确定要删除 "${key}" 吗？`)) return
    
    try {
      getStorage(item.source).removeItem(key)
      showNotification(`已删除 "${key}"`, 'success')
      setSelectedKey(null)
      loadStorage()
    } catch (e) {
      showNotification(`删除失败: ${e instanceof Error ? e.message : '未知错误'}`, 'error')
    }
  }, [items, showNotification, loadStorage])

  const handleClearAll = useCallback(() => {
    const source = activeTab === 'localStorage' ? localStorage : 
                   activeTab === 'sessionStorage' ? sessionStorage : null
    if (!source) return
    
    const count = source.length
    if (count === 0) {
      showNotification('存储已为空', 'info')
      return
    }
    
    if (!confirm(`确定要清空 ${activeTab} 吗？共 ${count} 项将被删除。`)) return
    
    try {
      source.clear()
      showNotification(`已清空 ${count} 项数据`, 'success')
      setSelectedKey(null)
      loadStorage()
    } catch (e) {
      showNotification(`清空失败: ${e instanceof Error ? e.message : '未知错误'}`, 'error')
    }
  }, [activeTab, showNotification, loadStorage])

  const handleExport = useCallback(() => {
    const exportData: Record<string, Record<string, string>> = {
      localStorage: {},
      sessionStorage: {},
    }
    
    items.forEach(item => {
      exportData[item.source][item.key] = item.value
    })
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `storage-export-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    showNotification('导出成功', 'success')
  }, [items, showNotification])

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showNotification('已复制到剪贴板', 'success')
    })
  }, [showNotification])

  const handleAddItem = useCallback(() => {
    if (!newKey.trim()) {
      showNotification('请输入键名', 'error')
      return
    }
    
    try {
      if (activeTab === 'localStorage') {
        localStorage.setItem(newKey.trim(), newValue)
      } else if (activeTab === 'sessionStorage') {
        sessionStorage.setItem(newKey.trim(), newValue)
      }
      showNotification(`已添加 "${newKey.trim()}"`, 'success')
      setNewKey('')
      setNewValue('')
      setShowAddModal(false)
      loadStorage()
    } catch (e) {
      showNotification(`添加失败: ${e instanceof Error ? e.message : '未知错误'}`, 'error')
    }
  }, [newKey, newValue, activeTab, showNotification, loadStorage])

  const toggleSection = useCallback((key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const typeColors: Record<StorageItem['type'], string> = {
    string: '#3b82f6',
    json: '#10b981',
    number: '#f59e0b',
    boolean: '#8b5cf6',
    empty: '#6b7280',
  }

  const usagePercent = stats.usagePercent
  const usageColor = usagePercent > 90 ? '#ef4444' : usagePercent > 70 ? '#f59e0b' : '#10b981'

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fade-in ${
          notification.type === 'success' ? 'bg-emerald-600' :
          notification.type === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <DatabaseIcon size={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold">本地存储管理器</h1>
              <p className="text-xs text-slate-400">浏览器存储分析与管理工具</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadStorage}
              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors flex items-center gap-2 text-sm"
            >
              <RefreshCwIcon size={14} />
              刷新
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors flex items-center gap-2 text-sm"
            >
              <DownloadIcon size={14} />
              导出
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-2 text-sm"
            >
              <PlusIcon size={14} />
              新建
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <KeyIcon size={12} />
              LocalStorage
            </div>
            <div className="text-xl font-semibold">{stats.localStorageCount}</div>
            <div className="text-xs text-slate-500">{formatSize(stats.localStorageSize)}</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <ClockIcon size={12} />
              SessionStorage
            </div>
            <div className="text-xl font-semibold">{stats.sessionStorageCount}</div>
            <div className="text-xs text-slate-500">{formatSize(stats.sessionStorageSize)}</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 col-span-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <HardDriveIcon size={12} />
              存储使用量
            </div>
            <div className="h-2 bg-slate-600 rounded-full overflow-hidden mb-1">
              <div 
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, usagePercent)}%`, backgroundColor: usageColor }}
              />
            </div>
            <div className="text-xs text-slate-400">
              {formatSize(stats.totalSize)} / {stats.quotaMB} MB ({usagePercent}%)
            </div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-center">
            <div className="text-center">
              {usagePercent > 90 ? (
                <AlertTriangleIcon size={32} className="text-red-500 mx-auto mb-1" />
              ) : usagePercent > 70 ? (
                <ShieldIcon size={32} className="text-amber-500 mx-auto mb-1" />
              ) : (
                <ShieldIcon size={32} className="text-emerald-500 mx-auto mb-1" />
              )}
              <div className="text-xs text-slate-400">
                {usagePercent > 90 ? '即将满' : usagePercent > 70 ? '使用较多' : '空间充足'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          {(['localStorage', 'sessionStorage', 'indexedDB'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {tab === 'localStorage' ? 'LocalStorage' : tab === 'sessionStorage' ? 'SessionStorage' : 'IndexedDB'}
            </button>
          ))}
          <div className="flex-1" />
          <div className="relative">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索键或值..."
              className="pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-64"
            />
          </div>
          <button
            onClick={handleClearAll}
            className="px-3 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 transition-colors flex items-center gap-2 text-sm"
            disabled={activeTab === 'indexedDB'}
          >
            <TrashIcon size={14} />
            清空
          </button>
        </div>
      </div>

      {activeTab === 'indexedDB' ? (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-slate-700 overflow-y-auto">
            <div className="p-3 border-b border-slate-700">
              <label className="text-xs text-slate-400 block mb-2">数据库</label>
              <select
                value={selectedDB || ''}
                onChange={(e) => setSelectedDB(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">选择数据库...</option>
                {indexedDBDatabases.map(db => (
                  <option key={db.name} value={db.name}>{db.name} (v{db.version})</option>
                ))}
              </select>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={loadIndexedDBDatabases}
                  className="flex-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center justify-center gap-1"
                >
                  <RefreshCwIcon size={12} /> 刷新
                </button>
                {selectedDB && (
                  <button
                    onClick={() => handleDeleteDatabase(selectedDB)}
                    className="px-2 py-1 bg-red-600/80 hover:bg-red-600 rounded text-xs flex items-center justify-center gap-1"
                    title="删除数据库"
                  >
                    <TrashIcon size={12} />
                  </button>
                )}
              </div>
            </div>

            {indexedDBLoading && !selectedDB ? (
              <div className="p-4 text-center text-slate-500 text-sm">加载中...</div>
            ) : indexedDBDatabases.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">暂无 IndexedDB 数据库</div>
            ) : !selectedDB ? (
              <div className="p-4 text-center text-slate-500 text-sm">请选择一个数据库</div>
            ) : indexedDBInfo ? (
              <div>
                <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-700">
                  Stores ({indexedDBInfo.stores.length})
                </div>
                {indexedDBInfo.stores.map(store => (
                  <div
                    key={store.name}
                    onClick={() => setSelectedStore(store.name)}
                    className={`px-3 py-2 border-b border-slate-700/50 cursor-pointer transition-colors ${
                      selectedStore === store.name ? 'bg-slate-700' : 'hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <TableIcon size={14} className="text-indigo-400" />
                        <span className="text-sm truncate">{store.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">{store.recordCount}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      {store.keyPath && (
                        <span className="px-1.5 py-0.5 bg-slate-700 rounded">
                          keyPath: {Array.isArray(store.keyPath) ? store.keyPath.join(', ') : store.keyPath}
                        </span>
                      )}
                      {store.autoIncrement && (
                        <span className="px-1.5 py-0.5 bg-slate-700 rounded text-amber-400">auto</span>
                      )}
                    </div>
                    {store.indexes.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {store.indexes.map(idx => (
                          <span key={idx} className="text-xs px-1.5 py-0.5 bg-slate-700/50 rounded text-slate-400">
                            idx: {idx}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto border-r border-slate-700">
              <div className="sticky top-0 bg-slate-900 z-10 p-3 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-sm">
                    {selectedStore || '选择 Store'} 
                    {indexedDBRecords.length > 0 && (
                      <span className="text-slate-500 font-normal ml-2">({indexedDBRecords.length} 条记录)</span>
                    )}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {selectedDB && (
                    <button
                      onClick={handleExportIndexedDB}
                      className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center gap-1"
                      title="导出为 JSON"
                    >
                      <DownloadIcon size={12} /> 导出
                    </button>
                  )}
                  {selectedDB && selectedStore && (
                    <button
                      onClick={() => loadStoreRecords(selectedDB, selectedStore)}
                      className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center gap-1"
                    >
                      <RefreshCwIcon size={12} /> 刷新
                    </button>
                  )}
                </div>
              </div>

              {indexedDBLoading ? (
                <div className="p-8 text-center text-slate-500 text-sm">加载中...</div>
              ) : !selectedStore ? (
                <div className="p-8 text-center text-slate-500">
                  <TableIcon size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">请选择一个 Store</p>
                </div>
              ) : indexedDBRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <DatabaseIcon size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">该 Store 为空</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {indexedDBRecords.map((record, idx) => (
                    <div
                      key={String(record.key) + '-' + idx}
                      onClick={() => setSelectedRecord(record)}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedRecord && selectedRecord.key === record.key && selectedRecord.storeName === record.storeName
                          ? 'bg-slate-700' 
                          : 'hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <KeyIcon size={12} className="text-amber-400" />
                          <span className="text-xs text-slate-400">{String(record.key)}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRecord(record.dbName, record.storeName, record.key)
                          }}
                          className="p-1 rounded hover:bg-red-600/30 transition-colors"
                          title="删除记录"
                        >
                          <TrashIcon size={12} className="text-red-400" />
                        </button>
                      </div>
                      <div className="text-xs text-slate-500 font-mono truncate">
                        {typeof record.value === 'object' 
                          ? JSON.stringify(record.value).slice(0, 80) + (JSON.stringify(record.value).length > 80 ? '...' : '')
                          : String(record.value).slice(0, 80) + (String(record.value).length > 80 ? '...' : '')
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-96 overflow-y-auto p-4">
              {selectedRecord ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold break-all">
                        {String(selectedRecord.key)}
                      </h2>
                      <p className="text-sm text-slate-400">
                        {selectedRecord.dbName} / {selectedRecord.storeName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(JSON.stringify(selectedRecord.value, null, 2))}
                        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                        title="复制"
                      >
                        <CopyIcon size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(selectedRecord.dbName, selectedRecord.storeName, selectedRecord.key)}
                        className="p-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors"
                        title="删除记录"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </div>

                  {selectedRecord.keyPath && (
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs px-2 py-1 bg-slate-700 rounded">
                        keyPath: {Array.isArray(selectedRecord.keyPath) ? selectedRecord.keyPath.join(', ') : selectedRecord.keyPath}
                      </span>
                      {selectedRecord.autoIncrement && (
                        <span className="text-xs px-2 py-1 bg-amber-900/50 text-amber-400 rounded">autoIncrement</span>
                      )}
                    </div>
                  )}

                  <div>
                    <div 
                      className="flex items-center justify-between cursor-pointer p-2 bg-slate-700/50 rounded-t-lg border border-slate-600"
                      onClick={() => toggleSection('indexeddb-preview')}
                    >
                      <span className="text-sm font-medium">JSON 预览</span>
                      {expandedSections['indexeddb-preview'] !== false ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
                    </div>
                    {expandedSections['indexeddb-preview'] !== false && (
                      <div className="border border-t-0 border-slate-600 rounded-b-lg p-3 bg-slate-800">
                        <pre className="text-sm overflow-auto max-h-96">
                          {(() => {
                            try {
                              return JSON.stringify(selectedRecord.value, null, 2)
                            } catch {
                              return String(selectedRecord.value)
                            }
                          })()}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div>
                    <div 
                      className="flex items-center justify-between cursor-pointer p-2 bg-slate-700/50 rounded-t-lg border border-slate-600"
                      onClick={() => toggleSection('indexeddb-raw')}
                    >
                      <span className="text-sm font-medium">原始值</span>
                      {expandedSections['indexeddb-raw'] !== false ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
                    </div>
                    {expandedSections['indexeddb-raw'] !== false && (
                      <div className="border border-t-0 border-slate-600 rounded-b-lg p-3 bg-slate-800">
                        <code className="text-xs text-slate-300 break-all">
                          {typeof selectedRecord.value === 'object'
                            ? JSON.stringify(selectedRecord.value)
                            : String(selectedRecord.value)}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <FileJsonIcon size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-sm">选择记录查看详情</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-96 border-r border-slate-700 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <DatabaseIcon size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无数据</p>
              </div>
            ) : (
              filteredItems.map(item => (
                <div
                  key={item.key}
                  onClick={() => handleSelectItem(item)}
                  className={`p-3 border-b border-slate-700/50 cursor-pointer transition-colors ${
                    selectedKey === item.key ? 'bg-slate-700' : 'hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileJsonIcon size={14} style={{ color: typeColors[item.type] }} />
                      <span className="font-medium text-sm truncate">{item.key}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span 
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: typeColors[item.type] + '20', color: typeColors[item.type] }}
                      >
                        {item.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate max-w-[200px]">
                      {showValue ? item.value.slice(0, 50) + (item.value.length > 50 ? '...' : '') : '••••••••'}
                    </span>
                    <span>{formatSize(item.size)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {selectedKey ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedKey}</h2>
                    <p className="text-sm text-slate-400">
                      {items.find(i => i.key === selectedKey)?.source} · 
                      {items.find(i => i.key === selectedKey)?.type} · 
                      {formatSize(items.find(i => i.key === selectedKey)?.size || 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowValue(!showValue)}
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                      title={showValue ? '隐藏值' : '显示值'}
                    >
                      {showValue ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                    <button
                      onClick={() => handleCopy(editingValue)}
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                      title="复制值"
                    >
                      <CopyIcon size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(selectedKey)}
                      className="p-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors"
                      title="删除"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <div 
                    className="flex items-center justify-between cursor-pointer p-2 bg-slate-700/50 rounded-t-lg border border-slate-600"
                    onClick={() => toggleSection('editor')}
                  >
                    <span className="text-sm font-medium">值编辑器</span>
                    {expandedSections.editor !== false ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
                  </div>
                  {expandedSections.editor !== false && (
                    <div className="border border-t-0 border-slate-600 rounded-b-lg">
                      <textarea
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="w-full h-64 p-3 bg-slate-800 text-slate-100 font-mono text-sm resize-none focus:outline-none"
                        spellCheck={false}
                      />
                      <div className="p-2 bg-slate-700/30 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {editingValue.length} 字符 · {new Blob([editingValue]).size} 字节
                        </span>
                        <button
                          onClick={handleSaveValue}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-medium transition-colors"
                        >
                          保存更改
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div 
                    className="flex items-center justify-between cursor-pointer p-2 bg-slate-700/50 rounded-t-lg border border-slate-600"
                    onClick={() => toggleSection('preview')}
                  >
                    <span className="text-sm font-medium">JSON 预览</span>
                    {expandedSections.preview !== false ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
                  </div>
                  {expandedSections.preview !== false && (
                    <div className="border border-t-0 border-slate-600 rounded-b-lg p-3 bg-slate-800">
                      <pre className="text-sm overflow-auto max-h-64">
                        {(() => {
                          try {
                            const parsed = JSON.parse(editingValue)
                            return JSON.stringify(parsed, null, 2)
                          } catch {
                            return <span className="text-slate-500">非 JSON 格式，无法预览</span>
                          }
                        })()}
                      </pre>
                    </div>
                  )}
                </div>

                <div>
                  <div 
                    className="flex items-center justify-between cursor-pointer p-2 bg-slate-700/50 rounded-t-lg border border-slate-600"
                    onClick={() => toggleSection('raw')}
                  >
                    <span className="text-sm font-medium">原始值</span>
                    {expandedSections.raw !== false ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
                  </div>
                  {expandedSections.raw !== false && (
                    <div className="border border-t-0 border-slate-600 rounded-b-lg p-3 bg-slate-800">
                      <code className="text-xs text-slate-300 break-all">{showValue ? editingValue : '••••••••••••'}</code>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <DatabaseIcon size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm">选择左侧的条目查看详情</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl border border-slate-600">
            <h2 className="text-lg font-semibold mb-4">新建存储项</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">存储位置</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('localStorage')}
                    className={`flex-1 py-2 rounded-lg text-sm ${
                      activeTab === 'localStorage' ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    LocalStorage
                  </button>
                  <button
                    onClick={() => setActiveTab('sessionStorage')}
                    className={`flex-1 py-2 rounded-lg text-sm ${
                      activeTab === 'sessionStorage' ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    SessionStorage
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">键名</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="例如: my-key"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">值</label>
                <textarea
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="输入值（支持 JSON）"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg h-32 resize-none focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddItem}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
