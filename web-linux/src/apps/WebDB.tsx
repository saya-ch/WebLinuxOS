import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Database, Table, Plus, Trash2, Search, Download, Upload,
  X, ChevronRight, Edit2,
  Save, Filter, ArrowUpDown, ArrowUp, ArrowDown, Play,
  Copy, RefreshCw, Check,
} from 'lucide-react'

// ==================== Types ====================

interface IDBTable {
  name: string
  keyPath: string
  autoIncrement: boolean
  rowCount: number
}

interface IDBDatabase {
  name: string
  version: number
  tables: IDBTable[]
}

interface QueryCondition {
  id: string
  field: string
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith' | 'in'
  value: string
  conjunction: 'AND' | 'OR'
}

type SortDirection = 'asc' | 'desc' | null

// ==================== IDBManager ====================

class IDBManager {

  private async openDb(dbName: string, version?: number): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = version
        ? indexedDB.open(dbName, version)
        : indexedDB.open(dbName)

      req.onupgradeneeded = () => {
        // DB upgrade handled by caller
      }
      req.onsuccess = () => {
        const db = req.result
        const tables: IDBTable[] = []
        for (let i = 0; i < db.objectStoreNames.length; i++) {
          const storeName = db.objectStoreNames[i]
          const tx = db.transaction(storeName, 'readonly')
          const store = tx.objectStore(storeName)
          tables.push({
            name: storeName,
            keyPath: (store.keyPath as string) || 'id',
            autoIncrement: !!store.autoIncrement,
            rowCount: 0,
          })
        }
        db.close()
        resolve({ name: dbName, version: req.result.version, tables })
      }
      req.onerror = () => reject(req.error)
    })
  }

  async listDatabases(): Promise<IDBDatabase[]> {
    const dbs = await indexedDB.databases()
    const result: IDBDatabase[] = []
    for (const dbInfo of dbs) {
      if (!dbInfo.name) continue
      try {
        const db = await this.openDb(dbInfo.name)
        result.push(db)
      } catch {
        // skip inaccessible
      }
    }
    // Refresh row counts
    for (const db of result) {
      for (const table of db.tables) {
        table.rowCount = await this.getCount(db.name, table.name)
      }
    }
    return result
  }

  async createDatabase(dbName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName, 1)
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore('default', { keyPath: 'id', autoIncrement: true })
        store.createIndex('id', 'id', { unique: true })
      }
      req.onsuccess = () => {
        req.result.close()
        resolve()
      }
      req.onerror = () => reject(req.error)
    })
  }

  async deleteDatabase(dbName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(dbName)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
      req.onblocked = () => resolve()
    })
  }

  async createTable(dbName: string, tableName: string, keyPath = 'id', autoIncrement = true): Promise<void> {
    return new Promise((resolve, reject) => {
      const openReq = indexedDB.open(dbName)
      openReq.onsuccess = () => {
        const currentVersion = openReq.result.version
        openReq.result.close()

        const upgradeReq = indexedDB.open(dbName, currentVersion + 1)
        upgradeReq.onupgradeneeded = () => {
          upgradeReq.result.createObjectStore(tableName, { keyPath, autoIncrement })
        }
        upgradeReq.onsuccess = () => {
          upgradeReq.result.close()
          resolve()
        }
        upgradeReq.onerror = () => reject(upgradeReq.error)
      }
      openReq.onerror = () => reject(openReq.error)
    })
  }

  async deleteTable(dbName: string, tableName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const openReq = indexedDB.open(dbName)
      openReq.onsuccess = () => {
        const currentVersion = openReq.result.version
        openReq.result.close()

        const upgradeReq = indexedDB.open(dbName, currentVersion + 1)
        upgradeReq.onupgradeneeded = () => {
          upgradeReq.result.deleteObjectStore(tableName)
        }
        upgradeReq.onsuccess = () => {
          upgradeReq.result.close()
          resolve()
        }
        upgradeReq.onerror = () => reject(upgradeReq.error)
      }
      openReq.onerror = () => reject(openReq.error)
    })
  }

  async getTables(dbName: string): Promise<IDBTable[]> {
    const dbInfo = await this.openDb(dbName)
    for (const table of dbInfo.tables) {
      table.rowCount = await this.getCount(dbName, table.name)
    }
    return dbInfo.tables
  }

  async getCount(dbName: string, tableName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const openReq = indexedDB.open(dbName)
      openReq.onsuccess = () => {
        const db = openReq.result
        const tx = db.transaction(tableName, 'readonly')
        const store = tx.objectStore(tableName)
        const countReq = store.count()
        countReq.onsuccess = () => {
          db.close()
          resolve(countReq.result)
        }
        countReq.onerror = () => {
          db.close()
          reject(countReq.error)
        }
      }
      openReq.onerror = () => reject(openReq.error)
    })
  }

  async getAll(dbName: string, tableName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const openReq = indexedDB.open(dbName)
      openReq.onsuccess = () => {
        const db = openReq.result
        const tx = db.transaction(tableName, 'readonly')
        const store = tx.objectStore(tableName)
        const req = store.getAll()
        req.onsuccess = () => {
          db.close()
          resolve(req.result || [])
        }
        req.onerror = () => {
          db.close()
          reject(req.error)
        }
      }
      openReq.onerror = () => reject(openReq.error)
    })
  }

  async getByKey(dbName: string, tableName: string, key: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const openReq = indexedDB.open(dbName)
      openReq.onsuccess = () => {
        const db = openReq.result
        const tx = db.transaction(tableName, 'readonly')
        const store = tx.objectStore(tableName)
        const req = store.get(key)
        req.onsuccess = () => {
          db.close()
          resolve(req.result)
        }
        req.onerror = () => {
          db.close()
          reject(req.error)
        }
      }
      openReq.onerror = () => reject(openReq.error)
    })
  }

  async insert(dbName: string, tableName: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const openReq = indexedDB.open(dbName)
      openReq.onsuccess = () => {
        const db = openReq.result
        const tx = db.transaction(tableName, 'readwrite')
        const store = tx.objectStore(tableName)
        const req = store.add(data)
        req.onsuccess = () => {
          db.close()
          resolve(req.result)
        }
        req.onerror = () => {
          db.close()
          reject(req.error)
        }
      }
      openReq.onerror = () => reject(openReq.error)
    })
  }

  async update(dbName: string, tableName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const openReq = indexedDB.open(dbName)
      openReq.onsuccess = () => {
        const db = openReq.result
        const tx = db.transaction(tableName, 'readwrite')
        const store = tx.objectStore(tableName)
        const req = store.put(data)
        req.onsuccess = () => {
          db.close()
          resolve()
        }
        req.onerror = () => {
          db.close()
          reject(req.error)
        }
      }
      openReq.onerror = () => reject(openReq.error)
    })
  }

  async remove(dbName: string, tableName: string, key: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const openReq = indexedDB.open(dbName)
      openReq.onsuccess = () => {
        const db = openReq.result
        const tx = db.transaction(tableName, 'readwrite')
        const store = tx.objectStore(tableName)
        const req = store.delete(key)
        req.onsuccess = () => {
          db.close()
          resolve()
        }
        req.onerror = () => {
          db.close()
          reject(req.error)
        }
      }
      openReq.onerror = () => reject(openReq.error)
    })
  }

  async clearTable(dbName: string, tableName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const openReq = indexedDB.open(dbName)
      openReq.onsuccess = () => {
        const db = openReq.result
        const tx = db.transaction(tableName, 'readwrite')
        const store = tx.objectStore(tableName)
        const req = store.clear()
        req.onsuccess = () => {
          db.close()
          resolve()
        }
        req.onerror = () => {
          db.close()
          reject(req.error)
        }
      }
      openReq.onerror = () => reject(openReq.error)
    })
  }

  async bulkInsert(dbName: string, tableName: string, records: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const openReq = indexedDB.open(dbName)
      openReq.onsuccess = () => {
        const db = openReq.result
        const tx = db.transaction(tableName, 'readwrite')
        const store = tx.objectStore(tableName)
        for (const record of records) {
          store.add(record)
        }
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => {
          db.close()
          reject(tx.error)
        }
      }
      openReq.onerror = () => reject(openReq.error)
    })
  }

  async getKeyPath(dbName: string, tableName: string): Promise<string> {
    const info = await this.openDb(dbName)
    const table = info.tables.find((t) => t.name === tableName)
    return table?.keyPath || 'id'
  }
}

// ==================== Helpers ====================

const uid = () => Math.random().toString(36).slice(2, 10)

const GLASS: React.CSSProperties = {
  background: 'rgba(20,22,30,0.85)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#e0e0e8',
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
  transition: 'all 0.2s',
  width: '100%',
  boxSizing: 'border-box',
}

const btnStyle = (active?: boolean): React.CSSProperties => ({
  background: active ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
  border: `1px solid ${active ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
  borderRadius: 8,
  color: active ? '#c4b5fd' : '#a0a0b0',
  cursor: 'pointer',
  fontSize: 12,
  padding: '6px 12px',
  transition: 'all 0.2s',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
})

const getFieldNames = (rows: any[]): string[] => {
  const set = new Set<string>()
  for (const row of rows) {
    if (row && typeof row === 'object') {
      for (const key of Object.keys(row)) set.add(key)
    }
  }
  return Array.from(set)
}

const formatValue = (val: any): string => {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

const compareValues = (a: any, b: any, op: QueryCondition['operator']): boolean => {
  const aStr = String(a ?? '')
  const bStr = String(b ?? '')
  const aNum = Number(a)
  const bNum = Number(b)
  const bothNumeric = !isNaN(aNum) && !isNaN(bNum) && aStr.trim() !== '' && bStr.trim() !== ''

  switch (op) {
    case '=':
      return bothNumeric ? aNum === bNum : aStr === bStr
    case '!=':
      return bothNumeric ? aNum !== bNum : aStr !== bStr
    case '>':
      return bothNumeric ? aNum > bNum : aStr > bStr
    case '<':
      return bothNumeric ? aNum < bNum : aStr < bStr
    case '>=':
      return bothNumeric ? aNum >= bNum : aStr >= bStr
    case '<=':
      return bothNumeric ? aNum <= bNum : aStr <= bStr
    case 'contains':
      return aStr.toLowerCase().includes(bStr.toLowerCase())
    case 'startsWith':
      return aStr.toLowerCase().startsWith(bStr.toLowerCase())
    case 'endsWith':
      return aStr.toLowerCase().endsWith(bStr.toLowerCase())
    case 'in': {
      const values = bStr.split(',').map((v) => v.trim().toLowerCase())
      return values.includes(aStr.toLowerCase())
    }
    default:
      return true
  }
}

const applyQuery = (rows: any[], conditions: QueryCondition[]): any[] => {
  if (conditions.length === 0) return rows
  return rows.filter((row) => {
    let result = conditions[0].conjunction === 'OR' ? false : true
    for (let i = 0; i < conditions.length; i++) {
      const cond = conditions[i]
      const rowVal = row?.[cond.field]
      const match = compareValues(rowVal, cond.value, cond.operator)
      if (i === 0) {
        result = match
      } else {
        result = cond.conjunction === 'AND' ? result && match : result || match
      }
    }
    return result
  })
}

// ==================== Main Component ====================

export default function WebDB() {
  const manager = useMemo(() => new IDBManager(), [])

  const [databases, setDatabases] = useState<IDBDatabase[]>([])
  const [selectedDb, setSelectedDb] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{ field: string; dir: SortDirection }>({ field: '', dir: null })
  const [editingRow, setEditingRow] = useState<{ index: number; data: any } | null>(null)
  const [newRowModal, setNewRowModal] = useState(false)
  const [newRowData, setNewRowData] = useState<Record<string, any>>({})
  const [showQueryBuilder, setShowQueryBuilder] = useState(false)
  const [queryConditions, setQueryConditions] = useState<QueryCondition[]>([])
  const [queryResult, setQueryResult] = useState<any[] | null>(null)
  const [newDbName, setNewDbName] = useState('')
  const [newTableInfo, setNewTableInfo] = useState<{ name: string; keyPath: string; autoIncrement: boolean }>({
    name: '', keyPath: 'id', autoIncrement: true,
  })
  const [showNewDbModal, setShowNewDbModal] = useState(false)
  const [showNewTableModal, setShowNewTableModal] = useState(false)
  const [exportData, setExportData] = useState<string | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }, [])

  const refreshDatabases = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const dbs = await manager.listDatabases()
      setDatabases(dbs)
    } catch (e: any) {
      setError(e?.message || '加载数据库列表失败')
    } finally {
      setLoading(false)
    }
  }, [manager])

  useEffect(() => {
    refreshDatabases()
  }, [refreshDatabases])

  const loadTableData = useCallback(async (dbName: string, tableName: string) => {
    setLoading(true)
    setError(null)
    setQueryResult(null)
    try {
      const data = await manager.getAll(dbName, tableName)
      setRows(data)
    } catch (e: any) {
      setError(e?.message || '加载表数据失败')
    } finally {
      setLoading(false)
    }
  }, [manager])

  useEffect(() => {
    if (selectedDb && selectedTable) {
      loadTableData(selectedDb, selectedTable)
    } else {
      setRows([])
    }
  }, [selectedDb, selectedTable, loadTableData])

  const handleSelectDatabase = (dbName: string) => {
    setSelectedDb(dbName)
    setSelectedTable(null)
    setQueryConditions([])
    setQueryResult(null)
  }

  const handleSelectTable = (tableName: string) => {
    setSelectedTable(tableName)
    setQueryConditions([])
    setQueryResult(null)
  }

  const handleCreateDatabase = async () => {
    if (!newDbName.trim()) {
      showToast('请输入数据库名称', 'error')
      return
    }
    try {
      await manager.createDatabase(newDbName.trim())
      showToast(`数据库 "${newDbName}" 创建成功`, 'success')
      setNewDbName('')
      setShowNewDbModal(false)
      await refreshDatabases()
    } catch (e: any) {
      showToast(e?.message || '创建数据库失败', 'error')
    }
  }

  const handleDeleteDatabase = async (dbName: string) => {
    if (!confirm(`确定要删除数据库 "${dbName}" 吗？此操作不可恢复！`)) return
    try {
      await manager.deleteDatabase(dbName)
      showToast(`数据库 "${dbName}" 已删除`, 'success')
      if (selectedDb === dbName) {
        setSelectedDb(null)
        setSelectedTable(null)
      }
      await refreshDatabases()
    } catch (e: any) {
      showToast(e?.message || '删除数据库失败', 'error')
    }
  }

  const handleCreateTable = async () => {
    if (!selectedDb || !newTableInfo.name.trim()) {
      showToast('请输入表名', 'error')
      return
    }
    try {
      await manager.createTable(
        selectedDb,
        newTableInfo.name.trim(),
        newTableInfo.keyPath.trim() || 'id',
        newTableInfo.autoIncrement,
      )
      showToast(`表 "${newTableInfo.name}" 创建成功`, 'success')
      setNewTableInfo({ name: '', keyPath: 'id', autoIncrement: true })
      setShowNewTableModal(false)
      await refreshDatabases()
      setSelectedTable(newTableInfo.name.trim())
    } catch (e: any) {
      showToast(e?.message || '创建表失败', 'error')
    }
  }

  const handleDeleteTable = async () => {
    if (!selectedDb || !selectedTable) return
    if (!confirm(`确定要删除表 "${selectedTable}" 吗？此操作不可恢复！`)) return
    try {
      await manager.deleteTable(selectedDb, selectedTable)
      showToast(`表 "${selectedTable}" 已删除`, 'success')
      setSelectedTable(null)
      await refreshDatabases()
    } catch (e: any) {
      showToast(e?.message || '删除表失败', 'error')
    }
  }

  const handleClearTable = async () => {
    if (!selectedDb || !selectedTable) return
    if (!confirm(`确定要清空表 "${selectedTable}" 的所有数据吗？`)) return
    try {
      await manager.clearTable(selectedDb, selectedTable)
      showToast('表已清空', 'success')
      await loadTableData(selectedDb, selectedTable)
      await refreshDatabases()
    } catch (e: any) {
      showToast(e?.message || '清空表失败', 'error')
    }
  }

  const handleSaveNewRow = async () => {
    if (!selectedDb || !selectedTable) return
    try {
      const keyPath = await manager.getKeyPath(selectedDb, selectedTable)
      const record: any = { ...newRowData }
      // Convert numeric strings back to numbers
      for (const key of Object.keys(record)) {
        const val = record[key]
        if (typeof val === 'string' && val !== '' && !isNaN(Number(val))) {
          record[key] = Number(val)
        }
      }
      // If autoIncrement key is empty, don't include it
      if (!record[keyPath] && keyPath !== 'id') {
        // Let autoIncrement handle it
      }
      await manager.insert(selectedDb, selectedTable, record)
      showToast('记录已添加', 'success')
      setNewRowData({})
      setNewRowModal(false)
      await loadTableData(selectedDb, selectedTable)
      await refreshDatabases()
    } catch (e: any) {
      showToast(e?.message || '添加记录失败', 'error')
    }
  }

  const handleUpdateRow = async () => {
    if (!selectedDb || !selectedTable || !editingRow) return
    try {
      const updated = { ...editingRow.data }
      for (const key of Object.keys(updated)) {
        const val = updated[key]
        if (typeof val === 'string' && val !== '' && !isNaN(Number(val))) {
          updated[key] = Number(val)
        }
      }
      await manager.update(selectedDb, selectedTable, updated)
      showToast('记录已更新', 'success')
      setEditingRow(null)
      await loadTableData(selectedDb, selectedTable)
    } catch (e: any) {
      showToast(e?.message || '更新记录失败', 'error')
    }
  }

  const handleDeleteRow = async (row: any) => {
    if (!selectedDb || !selectedTable) return
    try {
      const keyPath = await manager.getKeyPath(selectedDb, selectedTable)
      await manager.remove(selectedDb, selectedTable, row[keyPath])
      showToast('记录已删除', 'success')
      await loadTableData(selectedDb, selectedTable)
      await refreshDatabases()
    } catch (e: any) {
      showToast(e?.message || '删除记录失败', 'error')
    }
  }

  const handleSort = (field: string) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        return { field, dir: prev.dir === 'asc' ? 'desc' : prev.dir === 'desc' ? null : 'asc' }
      }
      return { field, dir: 'asc' }
    })
  }

  const filteredRows = useMemo(() => {
    let result = queryResult || rows

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((row) =>
        Object.values(row).some((v) =>
          String(v ?? '').toLowerCase().includes(q),
        ),
      )
    }

    if (sortConfig.field && sortConfig.dir) {
      const { field, dir } = sortConfig
      result = [...result].sort((a, b) => {
        const va = a?.[field]
        const vb = b?.[field]
        const vaStr = String(va ?? '')
        const vbStr = String(vb ?? '')
        const vaNum = Number(va)
        const vbNum = Number(vb)
        const bothNumeric = !isNaN(vaNum) && !isNaN(vbNum) && vaStr.trim() !== '' && vbStr.trim() !== ''
        let cmp = 0
        if (bothNumeric) cmp = vaNum - vbNum
        else cmp = vaStr.localeCompare(vbStr)
        return dir === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [rows, queryResult, searchQuery, sortConfig])

  const fieldNames = useMemo(() => getFieldNames(rows), [rows])
  const displayFieldNames = useMemo(() => getFieldNames(filteredRows), [filteredRows])

  // Query builder
  const addQueryCondition = () => {
    setQueryConditions((prev) => [
      ...prev,
      { id: uid(), field: displayFieldNames[0] || '', operator: 'contains', value: '', conjunction: 'AND' },
    ])
  }

  const updateQueryCondition = (id: string, patch: Partial<QueryCondition>) => {
    setQueryConditions((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  const removeQueryCondition = (id: string) => {
    setQueryConditions((prev) => prev.filter((c) => c.id !== id))
  }

  const executeQuery = () => {
    if (queryConditions.length === 0) {
      setQueryResult(null)
      return
    }
    const result = applyQuery(rows, queryConditions)
    setQueryResult(result)
    showToast(`查询完成，找到 ${result.length} 条记录`, 'success')
  }

  const resetQuery = () => {
    setQueryConditions([])
    setQueryResult(null)
  }

  // Import/Export
  const handleExport = () => {
    const data = queryResult || rows
    const json = JSON.stringify(data, null, 2)
    setExportData(json)
    setShowExportModal(true)
  }

  const handleImport = async () => {
    if (!selectedDb || !selectedTable) return
    try {
      const data = JSON.parse(importText)
      if (!Array.isArray(data)) {
        showToast('导入数据必须是 JSON 数组', 'error')
        return
      }
      await manager.bulkInsert(selectedDb, selectedTable, data)
      showToast(`成功导入 ${data.length} 条记录`, 'success')
      setImportText('')
      setShowImportModal(false)
      await loadTableData(selectedDb, selectedTable)
      await refreshDatabases()
    } catch (e: any) {
      showToast(e?.message || '导入失败', 'error')
    }
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    const file = e.target.files[0]
    const text = await file.text()
    setImportText(text)
    setShowImportModal(true)
    e.target.value = ''
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => showToast('已复制到剪贴板', 'success'),
      () => showToast('复制失败', 'error'),
    )
  }

  const downloadJson = (data: string, filename: string) => {
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // ==================== Render ====================

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
      color: '#e0e0e8', fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}>
        <Database size={22} color="#8b5cf6" />
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#e0e0f0' }}>
          WebDB · IndexedDB 管理工具
        </h1>
        <div style={{ flex: 1 }} />
        <button onClick={refreshDatabases} style={btnStyle()} title="刷新">
          <RefreshCw size={14} /> 刷新
        </button>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: 260, display: 'flex', flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.2)',
          flexShrink: 0,
        }}>
          <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#a0a0b0', flex: 1 }}>数据库</span>
            <button
              onClick={() => setShowNewDbModal(true)}
              style={{ ...btnStyle(), padding: '4px 8px' }}
              title="新建数据库"
            >
              <Plus size={14} />
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '0 8px' }}>
            {loading && databases.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>加载中...</div>
            ) : databases.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
                暂无数据库
                <br />
                <span style={{ fontSize: 12 }}>点击 + 创建</span>
              </div>
            ) : (
              databases.map((db) => (
                <div key={db.name} style={{ marginBottom: 4 }}>
                  <div
                    onClick={() => handleSelectDatabase(db.name)}
                    style={{
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      background: selectedDb === db.name ? 'rgba(139,92,246,0.15)' : 'transparent',
                      border: `1px solid ${selectedDb === db.name ? 'rgba(139,92,246,0.4)' : 'transparent'}`,
                      display: 'flex', alignItems: 'center', gap: 8,
                      transition: 'all 0.15s',
                    }}
                  >
                    <ChevronRight
                      size={14}
                      style={{
                        transition: 'transform 0.15s',
                        transform: selectedDb === db.name ? 'rotate(90deg)' : 'none',
                      }}
                    />
                    <Database size={14} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {db.name}
                    </span>
                    <span style={{ fontSize: 11, color: '#666' }}>v{db.version}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteDatabase(db.name) }}
                      style={{
                        background: 'none', border: 'none', color: '#666',
                        cursor: 'pointer', padding: 2, borderRadius: 4,
                      }}
                      title="删除数据库"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {selectedDb === db.name && (
                    <div style={{ paddingLeft: 24, marginTop: 4 }}>
                      {db.tables.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#555', padding: '4px 0' }}>
                          暂无表
                        </div>
                      ) : (
                        db.tables.map((tbl) => (
                          <div
                            key={tbl.name}
                            onClick={() => handleSelectTable(tbl.name)}
                            style={{
                              padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
                              background: selectedTable === tbl.name ? 'rgba(139,92,246,0.15)' : 'transparent',
                              color: selectedTable === tbl.name ? '#c4b5fd' : '#a0a0b0',
                              display: 'flex', alignItems: 'center', gap: 6,
                              fontSize: 12,
                              transition: 'all 0.15s',
                              marginBottom: 2,
                            }}
                          >
                            <Table size={12} />
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tbl.name}
                            </span>
                            <span style={{ fontSize: 10, color: '#555' }}>
                              {tbl.rowCount} 行
                            </span>
                          </div>
                        ))
                      )}
                      <button
                        onClick={() => setShowNewTableModal(true)}
                        style={{
                          ...btnStyle(), width: '100%', marginTop: 6, justifyContent: 'center',
                        }}
                      >
                        <Plus size={12} /> 新建表
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedDb ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#555', fontSize: 14,
            }}>
              <div style={{ textAlign: 'center' }}>
                <Database size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <div>从左侧选择一个数据库开始</div>
                <div style={{ fontSize: 12, marginTop: 8, color: '#444' }}>
                  或点击 + 创建新的数据库
                </div>
              </div>
            </div>
          ) : !selectedTable ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#555', fontSize: 14,
            }}>
              <div style={{ textAlign: 'center' }}>
                <Table size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <div>选择或创建一张表</div>
                <div style={{ fontSize: 12, marginTop: 8, color: '#444' }}>
                  点击 "新建表" 开始
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.15)',
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#c4b5fd' }}>{selectedTable}</span>
                  <span style={{ fontSize: 12, color: '#666' }}>
                    {(queryResult || rows).length} 行
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索所有字段..."
                      style={{ ...inputStyle, paddingLeft: 32 }}
                    />
                  </div>
                </div>

                <button onClick={() => setShowQueryBuilder(!showQueryBuilder)} style={btnStyle(showQueryBuilder)}>
                  <Filter size={14} /> 查询构建器
                </button>
                <button onClick={() => setNewRowModal(true)} style={btnStyle()}>
                  <Plus size={14} /> 新增
                </button>
                <button onClick={handleExport} style={btnStyle()}>
                  <Download size={14} /> 导出
                </button>
                <button onClick={() => setShowImportModal(true)} style={btnStyle()}>
                  <Upload size={14} /> 导入
                </button>
                <button onClick={handleClearTable} style={{ ...btnStyle(), color: '#ef4444' }}>
                  <Trash2 size={14} /> 清空
                </button>
                <button onClick={handleDeleteTable} style={{ ...btnStyle(), color: '#ef4444' }}>
                  <Trash2 size={14} /> 删除表
                </button>
              </div>

              {/* Query Builder */}
              {showQueryBuilder && (
                <div style={{
                  padding: 14, borderBottom: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(139,92,246,0.05)',
                  flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Filter size={14} color="#8b5cf6" />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>查询构建器</span>
                    <div style={{ flex: 1 }} />
                    <button onClick={addQueryCondition} style={btnStyle()}>
                      <Plus size={12} /> 添加条件
                    </button>
                    <button onClick={executeQuery} style={btnStyle(true)}>
                      <Play size={12} /> 执行
                    </button>
                    <button onClick={resetQuery} style={btnStyle()}>
                      <X size={12} /> 重置
                    </button>
                  </div>

                  {queryConditions.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#666', padding: '8px 0' }}>
                      点击 "添加条件" 开始构建查询
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {queryConditions.map((cond, idx) => (
                        <div key={cond.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {idx > 0 && (
                            <select
                              value={cond.conjunction}
                              onChange={(e) => updateQueryCondition(cond.id, { conjunction: e.target.value as 'AND' | 'OR' })}
                              style={{ ...inputStyle, width: 80, padding: '6px 8px' }}
                            >
                              <option value="AND">AND</option>
                              <option value="OR">OR</option>
                            </select>
                          )}
                          {idx === 0 && <span style={{ fontSize: 11, color: '#666', width: 80 }}>WHERE</span>}
                          <select
                            value={cond.field}
                            onChange={(e) => updateQueryCondition(cond.id, { field: e.target.value })}
                            style={{ ...inputStyle, width: 130, padding: '6px 8px' }}
                          >
                            {displayFieldNames.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                          <select
                            value={cond.operator}
                            onChange={(e) => updateQueryCondition(cond.id, { operator: e.target.value as QueryCondition['operator'] })}
                            style={{ ...inputStyle, width: 100, padding: '6px 8px' }}
                          >
                            <option value="=">=</option>
                            <option value="!=">!=</option>
                            <option value=">">{'>'}</option>
                            <option value="<">{'<'}</option>
                            <option value=">=">{'>='}</option>
                            <option value="<=">{'<='}</option>
                            <option value="contains">contains</option>
                            <option value="startsWith">starts with</option>
                            <option value="endsWith">ends with</option>
                            <option value="in">in (...)</option>
                          </select>
                          <input
                            value={cond.value}
                            onChange={(e) => updateQueryCondition(cond.id, { value: e.target.value })}
                            placeholder="值"
                            style={{ ...inputStyle, flex: 1, padding: '6px 8px' }}
                          />
                          <button
                            onClick={() => removeQueryCondition(cond.id)}
                            style={{
                              background: 'none', border: 'none', color: '#666',
                              cursor: 'pointer', padding: 4,
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {queryResult !== null && (
                    <div style={{ marginTop: 10, fontSize: 12, color: '#8b5cf6' }}>
                      查询结果：{queryResult.length} 条记录
                    </div>
                  )}
                </div>
              )}

              {/* Data Grid */}
              <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                {loading && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.3)', zIndex: 10,
                  }}>
                    <div style={{ fontSize: 13, color: '#888' }}>加载中...</div>
                  </div>
                )}

                {error && (
                  <div style={{
                    padding: '12px 16px', background: 'rgba(239,68,68,0.15)',
                    color: '#fca5a5', borderBottom: '1px solid rgba(239,68,68,0.3)',
                    fontSize: 13,
                  }}>
                    {error}
                  </div>
                )}

                {filteredRows.length === 0 && !loading ? (
                  <div style={{
                    padding: 40, textAlign: 'center', color: '#555', fontSize: 13,
                  }}>
                    {searchQuery || queryConditions.length > 0 ? '没有匹配的记录' : '表中暂无数据'}
                  </div>
                ) : (
                  <table style={{
                    width: '100%', borderCollapse: 'collapse',
                    fontSize: 13,
                  }}>
                    <thead style={{
                      position: 'sticky', top: 0, zIndex: 5,
                      background: 'rgba(15,15,26,0.95)',
                    }}>
                      <tr>
                        {displayFieldNames.map((field) => (
                          <th
                            key={field}
                            onClick={() => handleSort(field)}
                            style={{
                              padding: '10px 14px', textAlign: 'left',
                              borderBottom: '2px solid rgba(139,92,246,0.3)',
                              color: '#a0a0b0', fontWeight: 600, fontSize: 12,
                              cursor: 'pointer', userSelect: 'none',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {field}
                              {sortConfig.field === field && sortConfig.dir === 'asc' && <ArrowUp size={12} color="#8b5cf6" />}
                              {sortConfig.field === field && sortConfig.dir === 'desc' && <ArrowDown size={12} color="#8b5cf6" />}
                              {(!sortConfig.field || sortConfig.field !== field) && <ArrowUpDown size={12} style={{ opacity: 0.3 }} />}
                            </span>
                          </th>
                        ))}
                        <th style={{
                          padding: '10px 14px', textAlign: 'right',
                          borderBottom: '2px solid rgba(139,92,246,0.3)',
                          color: '#a0a0b0', fontWeight: 600, fontSize: 12,
                          width: 120,
                        }}>
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139,92,246,0.08)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {displayFieldNames.map((field) => (
                            <td
                              key={field}
                              style={{
                                padding: '8px 14px',
                                whiteSpace: 'nowrap',
                                maxWidth: 300,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={formatValue(row?.[field])}
                            >
                              {formatValue(row?.[field])}
                            </td>
                          ))}
                          <td style={{
                            padding: '6px 14px', textAlign: 'right',
                            whiteSpace: 'nowrap',
                          }}>
                            <div style={{ display: 'inline-flex', gap: 4 }}>
                              <button
                                onClick={() => setEditingRow({ index: idx, data: { ...row } })}
                                style={{
                                  background: 'rgba(139,92,246,0.15)',
                                  border: '1px solid rgba(139,92,246,0.3)',
                                  borderRadius: 6, color: '#c4b5fd',
                                  cursor: 'pointer', padding: '4px 6px',
                                }}
                                title="编辑"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteRow(row)}
                                style={{
                                  background: 'rgba(239,68,68,0.1)',
                                  border: '1px solid rgba(239,68,68,0.3)',
                                  borderRadius: 6, color: '#fca5a5',
                                  cursor: 'pointer', padding: '4px 6px',
                                }}
                                title="删除"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ==================== Modals ==================== */}

      {/* New Database Modal */}
      {showNewDbModal && (
        <Modal onClose={() => setShowNewDbModal(false)} title="新建数据库">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontSize: 13, color: '#a0a0b0' }}>数据库名称</label>
            <input
              value={newDbName}
              onChange={(e) => setNewDbName(e.target.value)}
              placeholder="my-database"
              style={inputStyle}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDatabase()}
            />
            <div style={{ fontSize: 12, color: '#666' }}>
              数据库名称只能包含字母、数字、连字符和下划线
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => setShowNewDbModal(false)} style={btnStyle()}>取消</button>
              <button onClick={handleCreateDatabase} style={btnStyle(true)}>
                <Save size={14} /> 创建
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Table Modal */}
      {showNewTableModal && (
        <Modal onClose={() => setShowNewTableModal(false)} title="新建表">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, color: '#a0a0b0' }}>表名</label>
              <input
                value={newTableInfo.name}
                onChange={(e) => setNewTableInfo((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="users"
                style={{ ...inputStyle, marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#a0a0b0' }}>主键字段 (keyPath)</label>
              <input
                value={newTableInfo.keyPath}
                onChange={(e) => setNewTableInfo((prev) => ({ ...prev, keyPath: e.target.value }))}
                placeholder="id"
                style={{ ...inputStyle, marginTop: 4 }}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#a0a0b0' }}>
              <input
                type="checkbox"
                checked={newTableInfo.autoIncrement}
                onChange={(e) => setNewTableInfo((prev) => ({ ...prev, autoIncrement: e.target.checked }))}
                style={{ accentColor: '#8b5cf6' }}
              />
              自动递增
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => setShowNewTableModal(false)} style={btnStyle()}>取消</button>
              <button onClick={handleCreateTable} style={btnStyle(true)}>
                <Save size={14} /> 创建
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Row Modal */}
      {newRowModal && (
        <Modal onClose={() => { setNewRowModal(false); setNewRowData({}) }} title={`新增记录到 ${selectedTable}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflow: 'auto' }}>
            {fieldNames.length === 0 ? (
              <div style={{ color: '#666', fontSize: 13 }}>
                这张表暂无字段。先添加一条记录来定义字段结构。
              </div>
            ) : (
              fieldNames.map((field) => (
                <div key={field}>
                  <label style={{ fontSize: 12, color: '#a0a0b0', display: 'block', marginBottom: 2 }}>
                    {field}
                  </label>
                  <input
                    value={String(newRowData[field] ?? '')}
                    onChange={(e) => setNewRowData((prev) => ({ ...prev, [field]: e.target.value }))}
                    style={inputStyle}
                    placeholder={field}
                  />
                </div>
              ))
            )}
            <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>
              {fieldNames.length === 0 && '提示：第一条记录的字段将作为表的字段结构'}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => { setNewRowModal(false); setNewRowData({}) }} style={btnStyle()}>取消</button>
              <button onClick={handleSaveNewRow} style={btnStyle(true)}>
                <Save size={14} /> 保存
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Row Modal */}
      {editingRow && (
        <Modal onClose={() => setEditingRow(null)} title="编辑记录">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '60vh', overflow: 'auto' }}>
            {Object.keys(editingRow.data).map((key) => (
              <div key={key}>
                <label style={{ fontSize: 12, color: '#a0a0b0', display: 'block', marginBottom: 2 }}>
                  {key}
                </label>
                <input
                  value={String(editingRow.data[key] ?? '')}
                  onChange={(e) => setEditingRow((prev) => prev ? { ...prev, data: { ...prev.data, [key]: e.target.value } } : null)}
                  style={inputStyle}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => setEditingRow(null)} style={btnStyle()}>取消</button>
              <button onClick={handleUpdateRow} style={btnStyle(true)}>
                <Save size={14} /> 保存
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <Modal onClose={() => setShowExportModal(false)} title="导出 JSON">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => copyToClipboard(exportData || '')} style={btnStyle()}>
                <Copy size={14} /> 复制
              </button>
              <button onClick={() => downloadJson(exportData || '', `${selectedTable || 'data'}.json`)} style={btnStyle()}>
                <Download size={14} /> 下载
              </button>
            </div>
            <textarea
              value={exportData || ''}
              readOnly
              style={{
                ...inputStyle, flex: 1, minHeight: 300,
                fontFamily: 'monospace', fontSize: 12,
                resize: 'vertical',
              }}
            />
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <Modal onClose={() => setShowImportModal(false)} title="导入 JSON">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => fileInputRef.current?.click()} style={btnStyle()}>
                <Upload size={14} /> 选择文件
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                style={{ display: 'none' }}
              />
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>
              粘贴 JSON 数组数据，或选择一个 .json 文件
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='[{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]'
              style={{
                ...inputStyle, flex: 1, minHeight: 300,
                fontFamily: 'monospace', fontSize: 12,
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowImportModal(false)} style={btnStyle()}>取消</button>
              <button onClick={handleImport} style={btnStyle(true)}>
                <Upload size={14} /> 导入
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          padding: '10px 18px', borderRadius: 8,
          background: toast.type === 'success' ? 'rgba(34,197,94,0.9)' : toast.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(100,100,120,0.9)',
          color: 'white', fontSize: 13, zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {toast.type === 'success' && <Check size={14} />}
          {toast.type === 'error' && <X size={14} />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ==================== Modal Component ====================

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode
  onClose: () => void
  title: string
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...GLASS,
          width: '90%', maxWidth: 520, maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center',
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#e0e0f0', flex: 1 }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#888',
              cursor: 'pointer', padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 18, overflow: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}