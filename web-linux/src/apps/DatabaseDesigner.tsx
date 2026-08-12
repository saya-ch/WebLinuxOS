import { useState, useCallback, useMemo } from 'react'
import {
  Plus, Trash2, Copy, Download, Code,
  Database, Table, Key, Link2, Search,
  Settings, FileCode, GitMerge,
  Hash, Type, Calendar, FileText,
  Grid3X3,
} from 'lucide-react'

type Dialect = 'mysql' | 'postgresql' | 'sqlite'

interface TableField {
  id: string
  name: string
  type: string
  length: string
  nullable: boolean
  isPrimaryKey: boolean
  isForeignKey: boolean
  isUnique: boolean
  isIndexed: boolean
  defaultValue: string
  comment: string
  foreignTable: string
  foreignField: string
}

interface TableModel {
  id: string
  name: string
  comment: string
  fields: TableField[]
}

const uid = () => Math.random().toString(36).slice(2, 10)

const SQL_TYPES: Record<Dialect, string[]> = {
  mysql: [
    'INT', 'BIGINT', 'SMALLINT', 'TINYINT', 'FLOAT', 'DOUBLE', 'DECIMAL',
    'VARCHAR', 'CHAR', 'TEXT', 'LONGTEXT', 'MEDIUMTEXT',
    'DATETIME', 'DATE', 'TIME', 'TIMESTAMP', 'YEAR',
    'BOOLEAN', 'BLOB', 'JSON', 'ENUM', 'SET',
  ],
  postgresql: [
    'INTEGER', 'BIGINT', 'SMALLINT', 'SERIAL', 'BIGSERIAL',
    'REAL', 'DOUBLE PRECISION', 'NUMERIC', 'DECIMAL',
    'VARCHAR', 'CHAR', 'TEXT', 'CHARACTER VARYING',
    'TIMESTAMP', 'DATE', 'TIME', 'TIMESTAMPTZ', 'INTERVAL',
    'BOOLEAN', 'BYTEA', 'JSON', 'JSONB', 'UUID', 'XML',
    'INET', 'CIDR', 'MACADDR', 'POINT', 'LINE', 'POLYGON',
  ],
  sqlite: [
    'INTEGER', 'TEXT', 'REAL', 'BLOB', 'NUMERIC',
    'VARCHAR', 'CHAR', 'BOOLEAN', 'DATE', 'DATETIME', 'TIMESTAMP',
  ],
}

const DIALECT_COLORS: Record<Dialect, { bg: string; border: string; text: string; glow: string }> = {
  mysql: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)', text: '#22c55e', glow: '0 0 20px rgba(34,197,94,0.3)' },
  postgresql: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', text: '#3b82f6', glow: '0 0 20px rgba(59,130,246,0.3)' },
  sqlite: { bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.4)', text: '#eab308', glow: '0 0 20px rgba(234,179,8,0.3)' },
}

const DIALECT_LABELS: Record<Dialect, string> = {
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  sqlite: 'SQLite',
}

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#e0e0e8',
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
  transition: 'all 0.2s',
}

const buttonStyle = (active?: boolean): React.CSSProperties => ({
  background: active ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
  border: `1px solid ${active ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
  borderRadius: 8,
  color: active ? '#c4b5fd' : '#a0a0b0',
  cursor: 'pointer',
  fontSize: 12,
  padding: '6px 12px',
  transition: 'all 0.2s',
})

const createDefaultField = (isFirst = false): TableField => ({
  id: uid(),
  name: isFirst ? 'id' : 'field',
  type: 'INT',
  length: '',
  nullable: !isFirst,
  isPrimaryKey: isFirst,
  isForeignKey: false,
  isUnique: false,
  isIndexed: false,
  defaultValue: '',
  comment: '',
  foreignTable: '',
  foreignField: '',
})

const createDefaultTable = (index: number): TableModel => ({
  id: uid(),
  name: `table_${index}`,
  comment: `数据表 ${index}`,
  fields: [
    { ...createDefaultField(true), name: 'id', isPrimaryKey: true, isIndexed: true },
  ],
})

const INITIAL_TABLES: TableModel[] = [
  {
    id: uid(),
    name: 'users',
    comment: '用户表',
    fields: [
      { id: uid(), name: 'id', type: 'INT', length: '', nullable: false, isPrimaryKey: true, isForeignKey: false, isUnique: true, isIndexed: true, defaultValue: 'AUTO_INCREMENT', comment: '用户ID', foreignTable: '', foreignField: '' },
      { id: uid(), name: 'username', type: 'VARCHAR', length: '50', nullable: false, isPrimaryKey: false, isForeignKey: false, isUnique: true, isIndexed: true, defaultValue: '', comment: '用户名', foreignTable: '', foreignField: '' },
      { id: uid(), name: 'email', type: 'VARCHAR', length: '100', nullable: false, isPrimaryKey: false, isForeignKey: false, isUnique: true, isIndexed: false, defaultValue: '', comment: '邮箱', foreignTable: '', foreignField: '' },
      { id: uid(), name: 'created_at', type: 'DATETIME', length: '', nullable: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, isIndexed: false, defaultValue: 'CURRENT_TIMESTAMP', comment: '创建时间', foreignTable: '', foreignField: '' },
    ],
  },
  {
    id: uid(),
    name: 'orders',
    comment: '订单表',
    fields: [
      { id: uid(), name: 'id', type: 'INT', length: '', nullable: false, isPrimaryKey: true, isForeignKey: false, isUnique: true, isIndexed: true, defaultValue: 'AUTO_INCREMENT', comment: '订单ID', foreignTable: '', foreignField: '' },
      { id: uid(), name: 'user_id', type: 'INT', length: '', nullable: false, isPrimaryKey: false, isForeignKey: true, isUnique: false, isIndexed: true, defaultValue: '', comment: '用户ID外键', foreignTable: 'users', foreignField: 'id' },
      { id: uid(), name: 'total', type: 'DECIMAL', length: '10,2', nullable: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, isIndexed: false, defaultValue: '0.00', comment: '订单金额', foreignTable: '', foreignField: '' },
      { id: uid(), name: 'status', type: 'VARCHAR', length: '20', nullable: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, isIndexed: false, defaultValue: "'pending'", comment: '订单状态', foreignTable: '', foreignField: '' },
    ],
  },
]

function generateDDL(table: TableModel, dialect: Dialect): string {
  const lines: string[] = []
  const hasAutoIncrement = table.fields.some((f) => f.defaultValue === 'AUTO_INCREMENT' && f.isPrimaryKey)

  const getDefaultValue = (field: TableField): string => {
    if (!field.defaultValue) return ''
    if (field.defaultValue === 'AUTO_INCREMENT') {
      if (dialect === 'mysql') return 'AUTO_INCREMENT'
      if (dialect === 'postgresql') return 'DEFAULT nextval(\'' + table.name + '_' + field.name + '_seq\')'
      if (dialect === 'sqlite') return ''
    }
    return `DEFAULT ${field.defaultValue}`
  }

  lines.push(`CREATE TABLE "${table.name}" (`)

  const fieldDefs: string[] = []
  const pkCols: string[] = []
  const fkDefs: string[] = []
  const idxDefs: string[] = []

  for (const field of table.fields) {
    if (field.isPrimaryKey) pkCols.push(`"${field.name}"`)

    let typeStr = field.type
    if (field.length) {
      typeStr = `${field.type}(${field.length})`
    }

    const parts: string[] = [`"${field.name}"`, typeStr]

    if (field.isPrimaryKey && dialect === 'mysql' && hasAutoIncrement) {
      parts.push('AUTO_INCREMENT')
    }

    if (!field.nullable) parts.push('NOT NULL')

    const def = getDefaultValue(field)
    if (def && def !== 'AUTO_INCREMENT') parts.push(def)

    if (field.isPrimaryKey) parts.push('PRIMARY KEY')

    if (field.comment) {
      if (dialect === 'postgresql') {
        // handle separately
      }
    }

    fieldDefs.push(`  ${parts.join(' ')}`)

    if (field.isForeignKey && field.foreignTable && field.foreignField) {
      fkDefs.push(`  FOREIGN KEY ("${field.name}") REFERENCES "${field.foreignTable}" ("${field.foreignField}")`)
    }

    if (field.isUnique && !field.isPrimaryKey) {
      idxDefs.push(`  UNIQUE ("${field.name}")`)
    }

    if (field.isIndexed && !field.isPrimaryKey && !field.isUnique) {
      idxDefs.push(`  INDEX "${table.name}_${field.name}_idx" ("${field.name}")`)
    }
  }

  const allDefs = [...fieldDefs]
  if (fkDefs.length > 0) allDefs.push(...fkDefs)
  if (idxDefs.length > 0) allDefs.push(...idxDefs)

  lines.push(allDefs.join(',\n'))
  lines.push(')')

  if (dialect === 'mysql') {
    const options: string[] = []
    options.push('ENGINE=InnoDB')
    options.push('DEFAULT CHARSET=utf8mb4')
    if (table.comment) options.push(`COMMENT='${table.comment}'`)
    lines.push(options.join(' '))
  } else if (dialect === 'postgresql') {
    if (hasAutoIncrement) {
      lines.push(`;`)
      lines.push(`CREATE SEQUENCE "${table.name}_id_seq" OWNED BY "${table.name}"."id";`)
    }
    if (table.comment) {
      lines.push(`COMMENT ON TABLE "${table.name}" IS '${table.comment}';`)
    }
    for (const field of table.fields) {
      if (field.comment) {
        lines.push(`COMMENT ON COLUMN "${table.name}"."${field.name}" IS '${field.comment}';`)
      }
    }
    return lines.join('\n')
  } else if (dialect === 'sqlite') {
    if (hasAutoIncrement) {
      lines[lines.length - 1] = lines[lines.length - 1].replace('PRIMARY KEY', 'PRIMARY KEY AUTOINCREMENT')
    }
  }

  if (dialect === 'mysql' && table.comment) {
    return lines.join('\n')
  }

  return lines.join('\n') + ';'
}

function GlassPanel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...GLASS, padding: 16, ...style }}>{children}</div>
}

function SectionHeader({ icon: Icon, title, count, action }: {
  icon: React.ElementType
  title: string
  count?: number
  action?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={16} color="#c4b5fd" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e8' }}>{title}</span>
        {count !== undefined && (
          <span style={{ fontSize: 11, color: '#888', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 10 }}>
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  )
}

function DialectBadge({ dialect }: { dialect: Dialect }) {
  const c = DIALECT_COLORS[dialect]
  return (
    <span style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      borderRadius: 6,
      padding: '4px 10px',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.5px',
      textShadow: `0 0 10px ${c.glow}`,
    }}>
      {DIALECT_LABELS[dialect]}
    </span>
  )
}

function FieldTypeIcon({ type }: { type: string }) {
  const upperType = type.toUpperCase()
  let Icon = Type
  let color = '#60a5fa'

  if (upperType.includes('INT') || upperType === 'SERIAL' || upperType === 'BIGSERIAL') {
    Icon = Hash; color = '#f59e0b'
  } else if (upperType.includes('VARCHAR') || upperType.includes('CHAR') || upperType === 'TEXT') {
    Icon = Type; color = '#60a5fa'
  } else if (upperType.includes('TIME') || upperType.includes('DATE')) {
    Icon = Calendar; color = '#a855f7'
  } else if (upperType === 'BOOLEAN') {
    Icon = Key; color = '#22c55e'
  } else if (upperType === 'DECIMAL' || upperType === 'FLOAT' || upperType === 'DOUBLE' || upperType === 'NUMERIC' || upperType === 'REAL') {
    Icon = Hash; color = '#f59e0b'
  } else if (upperType === 'BLOB' || upperType === 'BYTEA') {
    Icon = FileText; color = '#ec4899'
  } else if (upperType === 'JSON' || upperType === 'JSONB' || upperType === 'XML') {
    Icon = FileCode; color = '#14b8a6'
  }

  return <Icon size={12} color={color} />
}

export default function DatabaseDesigner() {
  const [tables, setTables] = useState<TableModel[]>(INITIAL_TABLES)
  const [selectedTableId, setSelectedTableId] = useState<string>(INITIAL_TABLES[0].id)
  const [dialect, setDialect] = useState<Dialect>('mysql')
  const [activeTab, setActiveTab] = useState<'design' | 'ddl' | 'erd'>('design')
  const [copied, setCopied] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showGrid, setShowGrid] = useState(true)

  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selectedTableId) || tables[0],
    [tables, selectedTableId]
  )

  const updateTable = useCallback((tableId: string, updater: (t: TableModel) => TableModel) => {
    setTables((prev) => prev.map((t) => (t.id === tableId ? updater(t) : t)))
  }, [])

  const addTable = useCallback(() => {
    const newTable = createDefaultTable(tables.length + 1)
    setTables((prev) => [...prev, newTable])
    setSelectedTableId(newTable.id)
  }, [tables.length])

  const deleteTable = useCallback((id: string) => {
    setTables((prev) => {
      const next = prev.filter((t) => t.id !== id)
      if (id === selectedTableId && next.length > 0) setSelectedTableId(next[0].id)
      return next
    })
  }, [selectedTableId])

  const duplicateTable = useCallback((id: string) => {
    setTables((prev) => {
      const src = prev.find((t) => t.id === id)
      if (!src) return prev
      const copy: TableModel = {
        ...src,
        id: uid(),
        name: src.name + '_copy',
        fields: src.fields.map((f) => ({ ...f, id: uid() })),
      }
      return [...prev, copy]
    })
  }, [])

  const addField = useCallback((tableId: string) => {
    updateTable(tableId, (t) => ({
      ...t,
      fields: [...t.fields, { ...createDefaultField(false), name: `field_${t.fields.length + 1}` }],
    }))
  }, [updateTable])

  const deleteField = useCallback((tableId: string, fieldId: string) => {
    updateTable(tableId, (t) => ({ ...t, fields: t.fields.filter((f) => f.id !== fieldId) }))
  }, [updateTable])

  const updateField = useCallback((tableId: string, fieldId: string, patch: Partial<TableField>) => {
    updateTable(tableId, (t) => ({
      ...t,
      fields: t.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
    }))
  }, [updateTable])

  const ddl = useMemo(() => {
    return tables.map((t) => generateDDL(t, dialect)).join('\n\n')
  }, [tables, dialect])

  const copyDDL = useCallback(() => {
    navigator.clipboard?.writeText(ddl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [ddl])

  const downloadDDL = useCallback(() => {
    const ext = dialect === 'mysql' ? 'sql' : dialect === 'postgresql' ? 'sql' : 'sql'
    const blob = new Blob([ddl], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `schema.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }, [ddl, dialect])

  const filteredTables = useMemo(() => {
    if (!searchTerm) return tables
    const lower = searchTerm.toLowerCase()
    return tables.filter((t) =>
      t.name.toLowerCase().includes(lower) ||
      t.comment.toLowerCase().includes(lower) ||
      t.fields.some((f) => f.name.toLowerCase().includes(lower))
    )
  }, [tables, searchTerm])

  const TAB_CONFIG: { key: 'design' | 'ddl' | 'erd'; label: string; icon: React.ElementType; hint: string }[] = [
    { key: 'design', label: '表设计', icon: Table, hint: '字段级设计' },
    { key: 'ddl', label: 'SQL DDL', icon: Code, hint: '数据定义语言' },
    { key: 'erd', label: 'ER 图', icon: GitMerge, hint: '实体关系图' },
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--window-bg, #0f0f1a)',
      color: 'var(--text-primary, #e0e0e8)',
      overflow: 'hidden',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.15) 100%)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
          }}>
            <Database size={18} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, background: 'linear-gradient(135deg, #e0e0e8, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              数据库设计器
            </h2>
            <div style={{ fontSize: 11, color: '#888' }}>可视化表结构设计 · SQL DDL 生成 · ER 图</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 8 }}>
            {(['mysql', 'postgresql', 'sqlite'] as Dialect[]).map((d) => (
              <button
                key={d}
                onClick={() => setDialect(d)}
                style={{
                  padding: '6px 12px', borderRadius: 6, border: 'none',
                  background: dialect === d ? DIALECT_COLORS[d].bg : 'transparent',
                  color: dialect === d ? DIALECT_COLORS[d].text : '#888',
                  cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  transition: 'all 0.2s',
                  boxShadow: dialect === d ? DIALECT_COLORS[d].glow : 'none',
                }}
              >
                {DIALECT_LABELS[d]}
              </button>
            ))}
          </div>
          <button onClick={copyDDL} style={{ ...buttonStyle(false), display: 'flex', alignItems: 'center', gap: 6 }}>
            <Copy size={14} />
            {copied ? '已复制' : '复制SQL'}
          </button>
          <button onClick={downloadDDL} style={{
            ...buttonStyle(true),
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))',
            border: '1px solid rgba(139,92,246,0.5)',
          }}>
            <Download size={14} />
            导出DDL
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside style={{
          width: 260, display: 'flex', flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.2)',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Table size={16} color="#c4b5fd" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>表列表</span>
              <span style={{ fontSize: 11, color: '#888', background: 'rgba(255,255,255,0.06)', padding: '1px 7px', borderRadius: 8 }}>
                {tables.length}
              </span>
            </div>
            <button
              onClick={addTable}
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                border: 'none', color: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(139,92,246,0.4)',
              }}
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={{ padding: '0 12px', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...inputStyle, padding: '6px 10px' }}>
              <Search size={14} color="#888" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#e0e0e8', fontSize: 12, outline: 'none', width: '100%' }}
                placeholder="搜索表或字段..."
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
            {filteredTables.map((table) => {
              const pkCount = table.fields.filter((f) => f.isPrimaryKey).length
              const fkCount = table.fields.filter((f) => f.isForeignKey).length
              return (
                <div
                  key={table.id}
                  onClick={() => setSelectedTableId(table.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 6,
                    padding: '10px 12px', marginBottom: 6,
                    borderRadius: 10, cursor: 'pointer',
                    background: table.id === selectedTableId ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${table.id === selectedTableId ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.2s',
                    boxShadow: table.id === selectedTableId ? '0 0 20px rgba(139,92,246,0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))',
                      border: '1px solid rgba(139,92,246,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Table size={13} color="#c4b5fd" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                        {table.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {table.comment}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateTable(table.id) }}
                        style={{
                          width: 22, height: 22, borderRadius: 5,
                          background: 'transparent', border: 'none', color: '#888',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: 0.6,
                        }}
                        title="复制表"
                      >
                        <Copy size={11} />
                      </button>
                      {tables.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTable(table.id) }}
                          style={{
                            width: 22, height: 22, borderRadius: 5,
                            background: 'transparent', border: 'none', color: '#888',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: 0.6,
                          }}
                          title="删除表"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, fontSize: 10 }}>
                    <span style={{ padding: '1px 6px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: '#c4b5fd' }}>
                      {table.fields.length} 字段
                    </span>
                    {pkCount > 0 && (
                      <span style={{ padding: '1px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                        PK: {pkCount}
                      </span>
                    )}
                    {fkCount > 0 && (
                      <span style={{ padding: '1px 6px', borderRadius: 4, background: 'rgba(249,115,22,0.15)', color: '#fb923c' }}>
                        FK: {fkCount}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{
            padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: 11, color: '#666', textAlign: 'center',
          }}>
            {tables.length} 张表 · {tables.reduce((acc, t) => acc + t.fields.length, 0)} 个字段
          </div>
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(0,0,0,0.15)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.15)',
          }}>
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 8,
                    background: active ? 'rgba(139,92,246,0.2)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(139,92,246,0.4)' : '1px solid transparent'}`,
                    color: active ? '#c4b5fd' : '#888',
                    fontSize: 12, cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              )
            })}
            <div style={{ flex: 1 }} />
            <DialectBadge dialect={dialect} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {activeTab === 'design' && selectedTable && (
              <DesignPanel
                table={selectedTable}
                dialect={dialect}
                onUpdateTable={(updater) => updateTable(selectedTable.id, updater)}
                onAddField={() => addField(selectedTable.id)}
                onDeleteField={(fieldId) => deleteField(selectedTable.id, fieldId)}
                onUpdateField={(fieldId, patch) => updateField(selectedTable.id, fieldId, patch)}
              />
            )}
            {activeTab === 'ddl' && selectedTable && (
              <DDLPanel
                table={selectedTable}
                tables={tables}
                dialect={dialect}
                onCopy={copyDDL}
                onDownload={downloadDDL}
              />
            )}
            {activeTab === 'erd' && (
              <ERDPanel
                tables={tables}
                dialect={dialect}
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid(!showGrid)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function DesignPanel({ table, dialect, onUpdateTable, onAddField, onDeleteField, onUpdateField }: {
  table: TableModel
  dialect: Dialect
  onUpdateTable: (updater: (t: TableModel) => TableModel) => void
  onAddField: () => void
  onDeleteField: (fieldId: string) => void
  onUpdateField: (fieldId: string, patch: Partial<TableField>) => void
}) {
  const sqlTypes = SQL_TYPES[dialect]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <GlassPanel>
        <SectionHeader icon={Settings} title="表属性" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: '#888', marginBottom: 4, display: 'block' }}>表名</label>
            <input
              value={table.name}
              onChange={(e) => onUpdateTable((t) => ({ ...t, name: e.target.value }))}
              style={{ ...inputStyle, width: '100%', fontFamily: 'monospace' }}
              placeholder="表名"
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#888', marginBottom: 4, display: 'block' }}>表注释</label>
            <input
              value={table.comment}
              onChange={(e) => onUpdateTable((t) => ({ ...t, comment: e.target.value }))}
              style={{ ...inputStyle, width: '100%' }}
              placeholder="表的描述信息"
            />
          </div>
        </div>
      </GlassPanel>

      <GlassPanel style={{ overflow: 'hidden' }}>
        <SectionHeader
          icon={Grid3X3}
          title="字段定义"
          count={table.fields.length}
          action={
            <button onClick={onAddField} style={{ ...buttonStyle(true), display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={13} /> 添加字段
            </button>
          }
        />

        {table.fields.length === 0 ? (
          <div style={{ fontSize: 12, color: '#666', textAlign: 'center', padding: 32 }}>
            暂无字段，点击"添加字段"开始设计表结构
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={thStyle}>字段名</th>
                  <th style={thStyle}>类型</th>
                  <th style={thStyle}>长度</th>
                  <th style={thStyle}>可空</th>
                  <th style={thStyle}>主键</th>
                  <th style={thStyle}>外键</th>
                  <th style={thStyle}>唯一</th>
                  <th style={thStyle}>索引</th>
                  <th style={thStyle}>默认值</th>
                  <th style={thStyle}>注释</th>
                  <th style={{ ...thStyle, width: 30 }}></th>
                </tr>
              </thead>
              <tbody>
                {table.fields.map((field) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    sqlTypes={sqlTypes}
                    onUpdate={(patch) => onUpdateField(field.id, patch)}
                    onDelete={() => onDeleteField(field.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      <GlassPanel>
        <SectionHeader icon={Key} title="字段约束说明" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <ConstraintItem icon={Key} color="#22c55e" label="PRIMARY KEY" desc="唯一标识每行记录" />
          <ConstraintItem icon={Link2} color="#fb923c" label="FOREIGN KEY" desc="关联其他表的主键" />
          <ConstraintItem icon={Hash} color="#60a5fa" label="UNIQUE" desc="字段值不能重复" />
          <ConstraintItem icon={Search} color="#a855f7" label="INDEX" desc="加速查询性能" />
        </div>
      </GlassPanel>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'left',
  fontSize: 11,
  color: '#888',
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

function ConstraintItem({ icon: Icon, color, label, desc }: {
  icon: React.ElementType
  color: string
  label: string
  desc: string
}) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6,
        background: `${color}20`, border: `1px solid ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={13} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#e0e0e8' }}>{label}</div>
        <div style={{ fontSize: 10, color: '#888' }}>{desc}</div>
      </div>
    </div>
  )
}

function FieldRow({ field, sqlTypes, onUpdate, onDelete }: {
  field: TableField
  sqlTypes: string[]
  onUpdate: (patch: Partial<TableField>) => void
  onDelete: () => void
}) {
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FieldTypeIcon type={field.type} />
          <input
            value={field.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            style={{ ...cellInput, fontFamily: 'monospace', width: '100%' }}
            placeholder="字段名"
          />
        </div>
      </td>
      <td style={tdStyle}>
        <select
          value={field.type}
          onChange={(e) => onUpdate({ type: e.target.value })}
          style={{ ...cellInput, padding: '4px 6px', width: '100%' }}
        >
          {sqlTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </td>
      <td style={tdStyle}>
        <input
          value={field.length}
          onChange={(e) => onUpdate({ length: e.target.value })}
          style={{ ...cellInput, width: 60 }}
          placeholder="长度"
          disabled={!['VARCHAR', 'CHAR', 'DECIMAL', 'NUMERIC'].some((t) => field.type.toUpperCase().includes(t))}
        />
      </td>
      <td style={tdStyleCenter}>
        <input
          type="checkbox"
          checked={field.nullable}
          onChange={(e) => onUpdate({ nullable: e.target.checked })}
          style={{ width: 14, height: 14, accentColor: '#8b5cf6' }}
        />
      </td>
      <td style={tdStyleCenter}>
        <input
          type="checkbox"
          checked={field.isPrimaryKey}
          onChange={(e) => onUpdate({ isPrimaryKey: e.target.checked, isIndexed: e.target.checked ? true : field.isIndexed })}
          style={{ width: 14, height: 14, accentColor: '#22c55e' }}
        />
      </td>
      <td style={tdStyleCenter}>
        <input
          type="checkbox"
          checked={field.isForeignKey}
          onChange={(e) => onUpdate({ isForeignKey: e.target.checked })}
          style={{ width: 14, height: 14, accentColor: '#fb923c' }}
        />
      </td>
      <td style={tdStyleCenter}>
        <input
          type="checkbox"
          checked={field.isUnique}
          onChange={(e) => onUpdate({ isUnique: e.target.checked })}
          style={{ width: 14, height: 14, accentColor: '#60a5fa' }}
        />
      </td>
      <td style={tdStyleCenter}>
        <input
          type="checkbox"
          checked={field.isIndexed}
          onChange={(e) => onUpdate({ isIndexed: e.target.checked })}
          style={{ width: 14, height: 14, accentColor: '#a855f7' }}
        />
      </td>
      <td style={tdStyle}>
        <input
          value={field.defaultValue}
          onChange={(e) => onUpdate({ defaultValue: e.target.value })}
          style={{ ...cellInput, width: 100 }}
          placeholder="默认值"
        />
      </td>
      <td style={tdStyle}>
        <input
          value={field.comment}
          onChange={(e) => onUpdate({ comment: e.target.value })}
          style={{ ...cellInput, width: 120 }}
          placeholder="注释"
        />
      </td>
      <td style={{ ...tdStyle, width: 30 }}>
        <button onClick={onDelete} style={{
          width: 26, height: 26, borderRadius: 6,
          background: 'transparent', border: 'none',
          color: '#888', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0.6,
        }}>
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  )
}

const tdStyle: React.CSSProperties = {
  padding: '6px 8px',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
}

const tdStyleCenter: React.CSSProperties = {
  ...tdStyle,
  textAlign: 'center',
}

const cellInput: React.CSSProperties = {
  background: 'rgba(0,0,0,0.2)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 6,
  color: '#e0e0e8',
  padding: '4px 8px',
  fontSize: 12,
  outline: 'none',
  transition: 'all 0.2s',
}

function DDLPanel({ table, tables, dialect, onDownload }: {
  table: TableModel
  tables: TableModel[]
  dialect: Dialect
  onCopy: () => void
  onDownload: () => void
}) {
  const [selectedTableId, setSelectedTableId] = useState<string>(table.id)
  const [showAll, setShowAll] = useState(true)

  const activeTable = useMemo(
    () => tables.find((t) => t.id === selectedTableId) || tables[0],
    [tables, selectedTableId]
  )

  const ddl = useMemo(() => {
    if (showAll) {
      return tables.map((t) => generateDDL(t, dialect)).join('\n\n')
    }
    return generateDDL(activeTable, dialect)
  }, [tables, activeTable, dialect, showAll])

  const copySingle = useCallback(() => {
    navigator.clipboard?.writeText(ddl)
  }, [ddl])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <GlassPanel>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <SectionHeader icon={Code} title="SQL DDL 预览" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowAll(true)}
              style={buttonStyle(showAll)}
            >
              全部表
            </button>
            <button
              onClick={() => setShowAll(false)}
              style={buttonStyle(!showAll)}
            >
              当前表
            </button>
          </div>
        </div>

        {!showAll && (
          <div style={{ marginBottom: 12 }}>
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              style={{ ...inputStyle, width: '100%' }}
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copySingle} style={{ ...buttonStyle(false), display: 'flex', alignItems: 'center', gap: 6 }}>
            <Copy size={13} /> 复制
          </button>
          <button onClick={onDownload} style={{ ...buttonStyle(true), display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={13} /> 下载 .sql
          </button>
          <div style={{ flex: 1 }} />
          <DialectBadge dialect={dialect} />
        </div>
      </GlassPanel>

      <div style={{
        flex: 1,
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        overflow: 'auto',
        padding: 16,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        lineHeight: 1.7,
        color: '#a6e3a1',
        whiteSpace: 'pre',
      }}>
        {ddl}
      </div>
    </div>
  )
}

function ERDPanel({ tables, dialect, showGrid, onToggleGrid }: {
  tables: TableModel[]
  dialect: Dialect
  showGrid: boolean
  onToggleGrid: () => void
}) {
  const tablesPerRow = Math.min(tables.length, 3)
  const tableWidth = 240
  const tableHeight = 120
  const gapX = 60
  const gapY = 60

  const totalWidth = tablesPerRow * tableWidth + (tablesPerRow - 1) * gapX + 40
  const rows = Math.ceil(tables.length / tablesPerRow)
  const totalHeight = rows * (tableHeight + 40) + (rows - 1) * gapY + 40

  const getTablePosition = (index: number) => {
    const col = index % tablesPerRow
    const row = Math.floor(index / tablesPerRow)
    return {
      x: 20 + col * (tableWidth + gapX),
      y: 20 + row * (tableHeight + gapY),
    }
  }

  const relationships: { from: { x: number; y: number }; to: { x: number; y: number } }[] = []

  tables.forEach((table) => {
    table.fields.forEach((field) => {
      if (field.isForeignKey && field.foreignTable) {
        const targetTable = tables.find((t) => t.name === field.foreignTable)
        if (targetTable) {
          const fromPos = getTablePosition(tables.indexOf(table))
          const toPos = getTablePosition(tables.indexOf(targetTable))
          relationships.push({
            from: { x: fromPos.x + tableWidth, y: fromPos.y + tableHeight / 2 },
            to: { x: toPos.x, y: toPos.y + tableHeight / 2 },
          })
        }
      }
    })
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <GlassPanel>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitMerge size={16} color="#c4b5fd" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e8' }}>实体关系图 (ER Diagram)</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onToggleGrid} style={buttonStyle(showGrid)}>
              {showGrid ? '隐藏网格' : '显示网格'}
            </button>
            <DialectBadge dialect={dialect} />
          </div>
        </div>
      </GlassPanel>

      <div style={{
        flex: 1,
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        overflow: 'auto',
        padding: 20,
      }}>
        <svg
          width={Math.max(totalWidth, 600)}
          height={Math.max(totalHeight, 400)}
          style={{ display: 'block' }}
        >
          {showGrid && (
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              </pattern>
            </defs>
          )}
          {showGrid && <rect width="100%" height="100%" fill="url(#grid)" />}

          {relationships.map((rel, i) => (
            <g key={i}>
              <line
                x1={rel.from.x} y1={rel.from.y}
                x2={rel.to.x} y2={rel.to.y}
                stroke="#fb923c" strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.7"
              />
              <circle cx={rel.from.x} cy={rel.from.y} r="4" fill="#fb923c" />
              <circle cx={rel.to.x} cy={rel.to.y} r="4" fill="#fb923c" />
              <text
                x={(rel.from.x + rel.to.x) / 2}
                y={(rel.from.y + rel.to.y) / 2 - 8}
                fill="#fb923c"
                fontSize="10"
                textAnchor="middle"
                fontFamily="monospace"
              >
                FK
              </text>
            </g>
          ))}

          {tables.map((table, index) => {
            const pos = getTablePosition(index)
            const pkFields = table.fields.filter((f) => f.isPrimaryKey)
            const fkFields = table.fields.filter((f) => f.isForeignKey)

            return (
              <g key={table.id}>
                <rect
                  x={pos.x} y={pos.y}
                  width={tableWidth} height={tableHeight}
                  rx="10" ry="10"
                  fill="rgba(139,92,246,0.1)"
                  stroke="rgba(139,92,246,0.4)"
                  strokeWidth="1.5"
                />
                <rect
                  x={pos.x} y={pos.y}
                  width={tableWidth} height={28}
                  rx="10" ry="10"
                  fill="rgba(139,92,246,0.3)"
                />
                <rect
                  x={pos.x} y={pos.y + 20}
                  width={tableWidth} height={8}
                  fill="rgba(139,92,246,0.3)"
                />
                <text
                  x={pos.x + tableWidth / 2}
                  y={pos.y + 18}
                  fill="#e0e0e8"
                  fontSize="12"
                  fontWeight="700"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {table.name}
                </text>

                <text x={pos.x + 12} y={pos.y + 50} fill="#22c55e" fontSize="10" fontWeight="600">
                  PK
                </text>
                {pkFields.map((f, i) => (
                  <text key={f.id} x={pos.x + 30} y={pos.y + 50 + i * 14} fill="#e0e0e8" fontSize="10" fontFamily="monospace">
                    {f.name}
                  </text>
                ))}

                {fkFields.length > 0 && (
                  <>
                    <text x={pos.x + 12} y={pos.y + 50 + pkFields.length * 14 + 4} fill="#fb923c" fontSize="10" fontWeight="600">
                      FK
                    </text>
                    {fkFields.map((f, i) => (
                      <text key={f.id} x={pos.x + 30} y={pos.y + 50 + pkFields.length * 14 + 4 + (i + 1) * 14} fill="#e0e0e8" fontSize="10" fontFamily="monospace">
                        {f.name} → {f.foreignTable}.{f.foreignField}
                      </text>
                    ))}
                  </>
                )}

                {pkFields.length === 0 && fkFields.length === 0 && (
                  <text x={pos.x + tableWidth / 2} y={pos.y + 70} fill="#888" fontSize="10" textAnchor="middle">
                    无主键/外键
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <GlassPanel>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <LegendItem color="#8b5cf6" label="表结构" />
          <LegendItem color="#22c55e" label="主键 (PK)" />
          <LegendItem color="#fb923c" label="外键 (FK) · 虚线表示关联" />
          <LegendItem color="#60a5fa" label="唯一约束" />
          <LegendItem color="#a855f7" label="索引" />
        </div>
      </GlassPanel>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#aaa' }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: color, boxShadow: `0 0 8px ${color}60` }} />
      {label}
    </div>
  )
}