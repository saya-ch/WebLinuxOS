import { useState, useCallback, useMemo } from 'react'
import {
  Plus, Trash2, Copy, Download, Send, Eye, FileJson,
  ChevronDown, ChevronRight, Check, X, Play, Settings2,
  Layers, Code, FileText, Sparkles, Terminal,
  Globe, Clock, Database, Hash, Type, List, Key
} from 'lucide-react'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
type ParamType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object'
type TabKey = 'endpoints' | 'params' | 'response' | 'mock' | 'docs'
type MockStatus = 'success' | 'client-error' | 'server-error' | 'redirect' | 'unauthorized'

interface PathParam {
  id: string
  name: string
  type: ParamType
  required: boolean
  description: string
  example: string
}

interface QueryParam {
  id: string
  name: string
  type: ParamType
  required: boolean
  description: string
  example: string
}

interface RequestHeader {
  id: string
  key: string
  value: string
  description: string
}

interface ResponseField {
  id: string
  name: string
  type: ParamType
  required: boolean
  description: string
  example: string
  children?: ResponseField[]
}

interface Endpoint {
  id: string
  name: string
  method: HttpMethod
  path: string
  description: string
  requestBody: string
  requestBodyType: ParamType
  pathParams: PathParam[]
  queryParams: QueryParam[]
  headers: RequestHeader[]
  responseFields: ResponseField[]
  mockResponse: string
  mockStatus: MockStatus
  mockDelay: number
}

const METHOD_COLORS: Record<HttpMethod, { bg: string; border: string; text: string; glow: string }> = {
  GET: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)', text: '#22c55e', glow: '0 0 20px rgba(34,197,94,0.3)' },
  POST: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', text: '#3b82f6', glow: '0 0 20px rgba(59,130,246,0.3)' },
  PUT: { bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.4)', text: '#eab308', glow: '0 0 20px rgba(234,179,8,0.3)' },
  DELETE: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#ef4444', glow: '0 0 20px rgba(239,68,68,0.3)' },
  PATCH: { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.4)', text: '#a855f7', glow: '0 0 20px rgba(168,85,247,0.3)' },
}

const STATUS_OPTIONS: { value: MockStatus; label: string; code: number }[] = [
  { value: 'success', label: '成功 (200)', code: 200 },
  { value: 'created', label: '已创建 (201)', code: 201 } as any,
  { value: 'client-error', label: '客户端错误 (400)', code: 400 },
  { value: 'unauthorized', label: '未授权 (401)', code: 401 },
  { value: 'not-found' as any, label: '未找到 (404)', code: 404 },
  { value: 'server-error', label: '服务器错误 (500)', code: 500 },
]

const uid = () => Math.random().toString(36).slice(2, 10)

const createDefaultEndpoint = (): Endpoint => ({
  id: uid(),
  name: '获取资源列表',
  method: 'GET',
  path: '/api/v1/resources',
  description: '分页获取资源列表，支持按条件筛选和排序',
  requestBody: '',
  requestBodyType: 'object',
  pathParams: [],
  queryParams: [
    { id: uid(), name: 'page', type: 'integer', required: false, description: '页码，从1开始', example: '1' },
    { id: uid(), name: 'limit', type: 'integer', required: false, description: '每页数量', example: '20' },
    { id: uid(), name: 'keyword', type: 'string', required: false, description: '搜索关键词', example: '' },
  ],
  headers: [
    { id: uid(), key: 'Authorization', value: 'Bearer <token>', description: '认证令牌' },
    { id: uid(), key: 'Content-Type', value: 'application/json', description: '请求体类型' },
  ],
  responseFields: [
    { id: uid(), name: 'code', type: 'integer', required: true, description: '状态码，0表示成功', example: '0' },
    { id: uid(), name: 'message', type: 'string', required: true, description: '响应消息', example: 'success' },
    {
      id: uid(), name: 'data', type: 'object', required: true, description: '数据主体', example: '',
      children: [
        { id: uid(), name: 'total', type: 'integer', required: true, description: '总记录数', example: '100' },
        { id: uid(), name: 'items', type: 'array', required: true, description: '资源列表', example: '[]' },
      ],
    },
  ],
  mockResponse: `{
  "code": 0,
  "message": "success",
  "data": {
    "total": 100,
    "items": [
      { "id": 1, "name": "示例资源", "status": "active" }
    ]
  }
}`,
  mockStatus: 'success',
  mockDelay: 300,
})

const INITIAL_ENDPOINTS: Endpoint[] = [createDefaultEndpoint()]

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

function MethodBadge({ method, size = 'sm' }: { method: HttpMethod; size?: 'sm' | 'lg' }) {
  const c = METHOD_COLORS[method]
  const padding = size === 'lg' ? '10px 16px' : '4px 10px'
  const fontSize = size === 'lg' ? 14 : 11
  return (
    <span style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      borderRadius: 6,
      padding,
      fontSize,
      fontWeight: 700,
      letterSpacing: '0.5px',
      textShadow: `0 0 10px ${c.glow}`,
      boxShadow: size === 'lg' ? c.glow : 'none',
    }}>
      {method}
    </span>
  )
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

const PARAM_TYPE_OPTIONS: ParamType[] = ['string', 'number', 'integer', 'boolean', 'array', 'object']

function ParamTypeIcon({ type }: { type: ParamType }) {
  const icons: Record<ParamType, React.ElementType> = {
    string: Type, number: Hash, integer: Hash, boolean: Check, array: List, object: Database,
  }
  const colors: Record<ParamType, string> = {
    string: '#60a5fa', number: '#f59e0b', integer: '#f59e0b', boolean: '#22c55e', array: '#a855f7', object: '#ec4899',
  }
  const Icon = icons[type]
  return <Icon size={12} color={colors[type]} />
}

function generateOpenAPI(endpoints: Endpoint[]): Record<string, unknown> {
  const paths: Record<string, unknown> = {}
  for (const ep of endpoints) {
    const pathKey = ep.path.replace(/\{[^}]+\}/g, (m) => m)
    const operation: Record<string, unknown> = {
      summary: ep.description || ep.name,
      operationId: `${ep.method.toLowerCase()}${ep.path.replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`,
      tags: [ep.path.split('/')[1] || 'default'],
      parameters: [
        ...ep.pathParams.map((p: PathParam) => ({
          name: p.name,
          in: 'path',
          required: p.required,
          description: p.description,
          schema: { type: p.type },
        })),
        ...ep.queryParams.map((p: QueryParam) => ({
          name: p.name,
          in: 'query',
          required: p.required,
          description: p.description,
          schema: { type: p.type },
        })),
        ...ep.headers.map((h: RequestHeader) => ({
          name: h.key,
          in: 'header',
          required: false,
          description: h.description,
          schema: { type: 'string' },
        })),
      ],
      responses: {
        '200': {
          description: '成功响应',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: Object.fromEntries(
                  ep.responseFields.map((f) => [f.name, {
                    type: f.type,
                    description: f.description,
                    example: f.example ? JSON.parse(f.example || 'null') : undefined,
                  }])
                ),
              },
            },
          },
        },
      },
    }

    if (ep.requestBody && ep.method !== 'GET' && ep.method !== 'DELETE') {
      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: { type: ep.requestBodyType },
            example: JSON.parse(ep.requestBody || '{}'),
          },
        },
      }
    }

    if (!paths[pathKey]) paths[pathKey] = {}
    ;(paths[pathKey] as Record<string, unknown>)[ep.method.toLowerCase()] = operation
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'API Design Studio - 自动生成的API文档',
      version: '1.0.0',
      description: '由API设计工作室自动生成的OpenAPI 3.0规范',
    },
    servers: [{ url: '/', description: '本地开发服务器' }],
    paths,
    components: {
      schemas: {},
    },
  }
}

export default function APIDesignStudio() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>(INITIAL_ENDPOINTS)
  const [selectedId, setSelectedId] = useState<string>(INITIAL_ENDPOINTS[0].id)
  const [activeTab, setActiveTab] = useState<TabKey>('endpoints')
  const [baseUrl, setBaseUrl] = useState('https://api.example.com')
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [mockResult, setMockResult] = useState<{ status: number; body: string; time: number } | null>(null)
  const [openJson, setOpenJson] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showDocs, setShowDocs] = useState(false)
  const [hoveredTab, setHoveredTab] = useState<TabKey | null>(null)

  const selected = useMemo(
    () => endpoints.find((e) => e.id === selectedId) || endpoints[0],
    [endpoints, selectedId]
  )

  const updateEndpoint = useCallback((updater: (ep: Endpoint) => Endpoint) => {
    setEndpoints((prev) => prev.map((ep) => (ep.id === selectedId ? updater(ep) : ep)))
  }, [selectedId])

  const addEndpoint = useCallback(() => {
    const newEp = createDefaultEndpoint()
    newEp.name = `新端点 ${endpoints.length + 1}`
    newEp.path = `/api/v1/resource${endpoints.length + 1}`
    setEndpoints((prev) => [...prev, newEp])
    setSelectedId(newEp.id)
    setActiveTab('endpoints')
  }, [endpoints.length])

  const deleteEndpoint = useCallback((id: string) => {
    setEndpoints((prev) => {
      const next = prev.filter((e) => e.id !== id)
      if (id === selectedId && next.length > 0) setSelectedId(next[0].id)
      return next
    })
  }, [selectedId])

  const duplicateEndpoint = useCallback((id: string) => {
    setEndpoints((prev) => {
      const src = prev.find((e) => e.id === id)
      if (!src) return prev
      const copy = { ...src, id: uid(), name: src.name + ' 副本' }
      return [...prev, copy]
    })
  }, [])

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }, [])

  const handleMockTest = useCallback(() => {
    if (!selected) return
    const statusMap: Record<string, number> = {
      success: 200, 'client-error': 400, 'server-error': 500,
      redirect: 301, unauthorized: 401, created: 201, 'not-found': 404,
    }
    const delay = selected.mockDelay
    setMockResult(null)
    setTimeout(() => {
      setMockResult({
        status: statusMap[selected.mockStatus] || 200,
        body: selected.mockResponse || '{}',
        time: delay,
      })
    }, delay)
  }, [selected])

  const openApiSpec = useMemo(() => generateOpenAPI(endpoints), [endpoints])
  const openApiJson = useMemo(() => JSON.stringify(openApiSpec, null, 2), [openApiSpec])

  const exportOpenAPI = useCallback(() => {
    const blob = new Blob([openApiJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'openapi-spec.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [openApiJson])

  const exportEndpointOpenAPI = useCallback(() => {
    if (!selected) return
    const spec = generateOpenAPI([selected])
    const json = JSON.stringify(spec, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selected.path.replace(/\//g, '_').slice(1)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [selected])

  const toggleRow = useCallback((key: string) => {
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const TAB_CONFIG: { key: TabKey; label: string; icon: React.ElementType; hint: string }[] = [
    { key: 'endpoints', label: '端点', icon: Layers, hint: 'RESTful端点管理' },
    { key: 'params', label: '参数', icon: Code, hint: '请求参数定义' },
    { key: 'response', label: '响应', icon: Database, hint: '响应结构定义' },
    { key: 'mock', label: '模拟测试', icon: Play, hint: '模拟请求响应' },
    { key: 'docs', label: '文档', icon: FileText, hint: '自动生成文档' },
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
            <Sparkles size={18} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, background: 'linear-gradient(135deg, #e0e0e8, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              API 设计工作室
            </h2>
            <div style={{ fontSize: 11, color: '#888' }}>RESTful API 可视化设计 · OpenAPI 3.0 · 模拟测试</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...inputStyle, padding: '6px 10px' }}>
            <Globe size={14} color="#888" />
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#e0e0e8', fontSize: 12, outline: 'none', width: 220 }}
              placeholder="API Base URL"
            />
          </div>
          <button onClick={() => setOpenJson(true)} style={{ ...buttonStyle(false), display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileJson size={14} />
            OpenAPI
          </button>
          <button onClick={exportOpenAPI} style={{
            ...buttonStyle(true),
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))',
            border: '1px solid rgba(139,92,246,0.5)',
          }}>
            <Download size={14} />
            导出JSON
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
              <Layers size={16} color="#c4b5fd" />
              <span style={{ fontSize: 13, fontWeight: 600 }}>端点列表</span>
              <span style={{ fontSize: 11, color: '#888', background: 'rgba(255,255,255,0.06)', padding: '1px 7px', borderRadius: 8 }}>
                {endpoints.length}
              </span>
            </div>
            <button
              onClick={addEndpoint}
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
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
            {endpoints.map((ep) => (
              <div
                key={ep.id}
                onClick={() => setSelectedId(ep.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', marginBottom: 6,
                  borderRadius: 10, cursor: 'pointer',
                  background: ep.id === selectedId ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${ep.id === selectedId ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  transition: 'all 0.2s',
                  boxShadow: ep.id === selectedId ? '0 0 20px rgba(139,92,246,0.15)' : 'none',
                }}
              >
                <MethodBadge method={ep.method} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ep.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#888', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ep.path}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); duplicateEndpoint(ep.id) }}
                    style={{
                      width: 22, height: 22, borderRadius: 5,
                      background: 'transparent', border: 'none', color: '#888',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0.6,
                    }}
                    title="复制"
                  >
                    <Copy size={11} />
                  </button>
                  {endpoints.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteEndpoint(ep.id) }}
                      style={{
                        width: 22, height: 22, borderRadius: 5,
                        background: 'transparent', border: 'none', color: '#888',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0.6,
                      }}
                      title="删除"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{
            padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: 11, color: '#666', textAlign: 'center',
          }}>
            {endpoints.length} 个端点 · {endpoints.reduce((acc, e) => acc + e.pathParams.length + e.queryParams.length, 0)} 个参数
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
                  onMouseEnter={() => setHoveredTab(tab.key)}
                  onMouseLeave={() => setHoveredTab(null)}
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
                  {hoveredTab === tab.key && !active && (
                    <span style={{
                      position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)',
                      background: 'rgba(0,0,0,0.8)', color: '#e0e0e8', padding: '4px 8px',
                      borderRadius: 4, fontSize: 10, whiteSpace: 'nowrap',
                    }}>
                      {tab.hint}
                    </span>
                  )}
                </button>
              )
            })}
            <div style={{ flex: 1 }} />
            <button
              onClick={exportEndpointOpenAPI}
              style={{ ...buttonStyle(false), display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={13} />
              导出此端点
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {activeTab === 'endpoints' && (
              <EndpointsPanel endpoint={selected} updateEndpoint={updateEndpoint} />
            )}
            {activeTab === 'params' && selected && (
              <ParamsPanel endpoint={selected} updateEndpoint={updateEndpoint} expandedRows={expandedRows} toggleRow={toggleRow} />
            )}
            {activeTab === 'response' && selected && (
              <ResponsePanel endpoint={selected} updateEndpoint={updateEndpoint} expandedRows={expandedRows} toggleRow={toggleRow} />
            )}
            {activeTab === 'mock' && selected && (
              <MockPanel endpoint={selected} onTest={handleMockTest} mockResult={mockResult} />
            )}
            {activeTab === 'docs' && selected && (
              <DocsPanel endpoint={selected} baseUrl={baseUrl} onShowDocs={() => setShowDocs(true)} />
            )}
          </div>
        </main>
      </div>

      {openJson && (
        <Modal onClose={() => setOpenJson(false)} title="OpenAPI 3.0 规范">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={() => copyToClipboard(openApiJson, 'openapi-copy')} style={{ ...buttonStyle(false), display: 'flex', alignItems: 'center', gap: 6 }}>
              <Copy size={13} />
              {copiedId === 'openapi-copy' ? '已复制' : '复制JSON'}
            </button>
            <button onClick={exportOpenAPI} style={{ ...buttonStyle(true), display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={13} />
              下载文件
            </button>
          </div>
          <pre style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: 16,
            overflow: 'auto', maxHeight: '60vh',
            fontSize: 12, lineHeight: 1.6,
            color: '#a6e3a1', fontFamily: 'monospace',
            margin: 0,
          }}>
            {openApiJson}
          </pre>
        </Modal>
      )}

      {showDocs && selected && (
        <Modal onClose={() => setShowDocs(false)} title={`API文档 - ${selected.name}`}>
          <DocsPreview endpoint={selected} baseUrl={baseUrl} />
        </Modal>
      )}
    </div>
  )
}

function EndpointsPanel({ endpoint, updateEndpoint }: {
  endpoint: Endpoint
  updateEndpoint: (fn: (ep: Endpoint) => Endpoint) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <GlassPanel>
        <SectionHeader icon={Settings2} title="端点配置" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: '#888', marginBottom: 4, display: 'block' }}>请求方法</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as HttpMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => updateEndpoint((ep) => ({ ...ep, method: m }))}
                  style={{
                    flex: 1, padding: '8px 4px',
                    borderRadius: 8, border: `1px solid ${METHOD_COLORS[m].border}`,
                    background: endpoint.method === m ? METHOD_COLORS[m].bg : 'rgba(255,255,255,0.03)',
                    color: endpoint.method === m ? METHOD_COLORS[m].text : '#888',
                    cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    transition: 'all 0.2s',
                    boxShadow: endpoint.method === m ? METHOD_COLORS[m].glow : 'none',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#888', marginBottom: 4, display: 'block' }}>API路径</label>
            <input
              value={endpoint.path}
              onChange={(e) => updateEndpoint((ep) => ({ ...ep, path: e.target.value }))}
              style={{ ...inputStyle, width: '100%', fontFamily: 'monospace' }}
              placeholder="/api/v1/resource"
            />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 11, color: '#888', marginBottom: 4, display: 'block' }}>端点名称</label>
          <input
            value={endpoint.name}
            onChange={(e) => updateEndpoint((ep) => ({ ...ep, name: e.target.value }))}
            style={{ ...inputStyle, width: '100%' }}
            placeholder="为端点命名"
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 11, color: '#888', marginBottom: 4, display: 'block' }}>描述</label>
          <textarea
            value={endpoint.description}
            onChange={(e) => updateEndpoint((ep) => ({ ...ep, description: e.target.value }))}
            rows={3}
            style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
            placeholder="描述此API端点的用途和功能..."
          />
        </div>
      </GlassPanel>

      <GlassPanel>
        <SectionHeader icon={Code} title="请求体" />
        {endpoint.method !== 'GET' && endpoint.method !== 'DELETE' ? (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <select
                value={endpoint.requestBodyType}
                onChange={(e) => updateEndpoint((ep) => ({ ...ep, requestBodyType: e.target.value as ParamType }))}
                style={{ ...inputStyle, padding: '6px 10px' }}
              >
                {PARAM_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <span style={{ fontSize: 11, color: '#888', alignSelf: 'center' }}>定义请求体结构(JSON)</span>
            </div>
            <textarea
              value={endpoint.requestBody}
              onChange={(e) => updateEndpoint((ep) => ({ ...ep, requestBody: e.target.value }))}
              rows={6}
              style={{ ...inputStyle, width: '100%', fontFamily: 'monospace', fontSize: 12 }}
              placeholder='{"key": "value"}'
            />
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#888', textAlign: 'center', padding: 20 }}>
            {endpoint.method} 请求通常不需要请求体
          </div>
        )}
      </GlassPanel>
    </div>
  )
}

function ParamsPanel({ endpoint, updateEndpoint }: {
  endpoint: Endpoint
  updateEndpoint: (fn: (ep: Endpoint) => Endpoint) => void
  expandedRows: Record<string, boolean>
  toggleRow: (key: string) => void
}) {
  const addPathParam = () => updateEndpoint((ep) => ({
    ...ep,
    pathParams: [...ep.pathParams, { id: uid(), name: 'id', type: 'string', required: true, description: '资源ID', example: '1' }],
  }))
  const addQueryParam = () => updateEndpoint((ep) => ({
    ...ep,
    queryParams: [...ep.queryParams, { id: uid(), name: 'param', type: 'string', required: false, description: '', example: '' }],
  }))
  const addHeader = () => updateEndpoint((ep) => ({
    ...ep,
    headers: [...ep.headers, { id: uid(), key: 'X-Custom-Header', value: '', description: '' }],
  }))

  const updatePathParam = (id: string, patch: Partial<PathParam>) =>
    updateEndpoint((ep) => ({ ...ep, pathParams: ep.pathParams.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
  const removePathParam = (id: string) =>
    updateEndpoint((ep) => ({ ...ep, pathParams: ep.pathParams.filter((p) => p.id !== id) }))

  const updateQueryParam = (id: string, patch: Partial<QueryParam>) =>
    updateEndpoint((ep) => ({ ...ep, queryParams: ep.queryParams.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
  const removeQueryParam = (id: string) =>
    updateEndpoint((ep) => ({ ...ep, queryParams: ep.queryParams.filter((p) => p.id !== id) }))

  const updateHeader = (id: string, patch: Partial<RequestHeader>) =>
    updateEndpoint((ep) => ({ ...ep, headers: ep.headers.map((h) => (h.id === id ? { ...h, ...patch } : h)) }))
  const removeHeader = (id: string) =>
    updateEndpoint((ep) => ({ ...ep, headers: ep.headers.filter((h) => h.id !== id) }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <GlassPanel>
        <SectionHeader
          icon={Key}
          title="路径参数"
          count={endpoint.pathParams.length}
          action={
            <button onClick={addPathParam} style={buttonStyle(false)}>
              <Plus size={13} /> 添加
            </button>
          }
        />
        {endpoint.pathParams.length === 0 ? (
          <div style={{ fontSize: 12, color: '#666', textAlign: 'center', padding: 16 }}>
            暂无路径参数。在路径中使用 <code style={{ color: '#c4b5fd' }}>{'{param}'}</code> 定义参数位置
          </div>
        ) : (
          <ParamTable
            columns={['name', 'type', 'required', 'description', 'example']}
            rows={endpoint.pathParams.map((p) => ({
              id: p.id,
              cells: {
                name: p.name, type: p.type, required: p.required, description: p.description, example: p.example,
              },
            }))}
            onUpdateCell={(id, col, val) => updatePathParam(id, { [col]: val } as Partial<PathParam>)}
            onRemove={removePathParam}
          />
        )}
      </GlassPanel>

      <GlassPanel>
        <SectionHeader
          icon={List}
          title="查询参数"
          count={endpoint.queryParams.length}
          action={
            <button onClick={addQueryParam} style={buttonStyle(false)}>
              <Plus size={13} /> 添加
            </button>
          }
        />
        {endpoint.queryParams.length === 0 ? (
          <div style={{ fontSize: 12, color: '#666', textAlign: 'center', padding: 16 }}>
            暂无查询参数
          </div>
        ) : (
          <ParamTable
            columns={['name', 'type', 'required', 'description', 'example']}
            rows={endpoint.queryParams.map((p) => ({
              id: p.id,
              cells: {
                name: p.name, type: p.type, required: p.required, description: p.description, example: p.example,
              },
            }))}
            onUpdateCell={(id, col, val) => updateQueryParam(id, { [col]: val } as Partial<QueryParam>)}
            onRemove={removeQueryParam}
          />
        )}
      </GlassPanel>

      <GlassPanel>
        <SectionHeader
          icon={Layers}
          title="请求头"
          count={endpoint.headers.length}
          action={
            <button onClick={addHeader} style={buttonStyle(false)}>
              <Plus size={13} /> 添加
            </button>
          }
        />
        {endpoint.headers.length === 0 ? (
          <div style={{ fontSize: 12, color: '#666', textAlign: 'center', padding: 16 }}>
            暂无自定义请求头
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {endpoint.headers.map((h) => (
              <div key={h.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={h.key}
                  onChange={(e) => updateHeader(h.id, { key: e.target.value })}
                  style={{ ...inputStyle, flex: 1, fontFamily: 'monospace' }}
                  placeholder="Header Name"
                />
                <input
                  value={h.value}
                  onChange={(e) => updateHeader(h.id, { value: e.target.value })}
                  style={{ ...inputStyle, flex: 2, fontFamily: 'monospace' }}
                  placeholder="Header Value"
                />
                <button onClick={() => removeHeader(h.id)} style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: 'transparent', border: 'none',
                  color: '#888', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  )
}

function ParamTable({ columns, rows, onUpdateCell, onRemove }: {
  columns: ('name' | 'type' | 'required' | 'description' | 'example')[]
  rows: { id: string; cells: Record<string, string | boolean> }[]
  onUpdateCell: (id: string, col: string, val: string | boolean) => void
  onRemove: (id: string) => void
}) {
  const colLabels: Record<string, string> = {
    name: '名称', type: '类型', required: '必填', description: '描述', example: '示例',
  }
  const colWidths: Record<string, string> = {
    name: '1.2fr', type: '0.8fr', required: '0.5fr', description: '1.5fr', example: '1fr',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', gap: 8, padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {columns.map((c) => (
          <div key={c} style={{ flex: colWidths[c] ? undefined : 1, width: colWidths[c], fontSize: 11, color: '#888', fontWeight: 600 }}>
            {colLabels[c]}
          </div>
        ))}
        <div style={{ width: 28 }} />
      </div>
      {rows.map((row) => (
        <div key={row.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.02)' }}>
          {columns.map((col) => (
            <div key={col} style={{ width: colWidths[col] }}>
              {col === 'type' ? (
                <select
                  value={row.cells[col] as string}
                  onChange={(e) => onUpdateCell(row.id, col, e.target.value)}
                  style={{ ...inputStyle, padding: '4px 6px', fontSize: 11, width: '100%' }}
                >
                  {PARAM_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : col === 'required' ? (
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={row.cells[col] as boolean}
                    onChange={(e) => onUpdateCell(row.id, col, e.target.checked)}
                    style={{ width: 14, height: 14, accentColor: '#8b5cf6' }}
                  />
                </label>
              ) : (
                <input
                  value={row.cells[col] as string}
                  onChange={(e) => onUpdateCell(row.id, col, e.target.value)}
                  style={{ ...inputStyle, padding: '4px 8px', fontSize: 12, width: '100%' }}
                  placeholder={col === 'name' ? '参数名' : col === 'description' ? '描述' : col === 'example' ? '示例值' : ''}
                />
              )}
            </div>
          ))}
          <button onClick={() => onRemove(row.id)} style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'transparent', border: 'none',
            color: '#888', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

function ResponsePanel({ endpoint, updateEndpoint, expandedRows, toggleRow }: {
  endpoint: Endpoint
  updateEndpoint: (fn: (ep: Endpoint) => Endpoint) => void
  expandedRows: Record<string, boolean>
  toggleRow: (key: string) => void
}) {
  const addRootField = () => updateEndpoint((ep) => ({
    ...ep,
    responseFields: [...ep.responseFields, { id: uid(), name: 'field', type: 'string', required: false, description: '', example: '' }],
  }))

  const updateField = (id: string, patch: Partial<ResponseField>, fields?: ResponseField[]) => {
    const fieldList = fields || endpoint.responseFields
    const update = (list: ResponseField[]): ResponseField[] =>
      list.map((f) => {
        if (f.id === id) return { ...f, ...patch }
        if (f.children) return { ...f, children: update(f.children) }
        return f
      })
    updateEndpoint((ep) => ({ ...ep, responseFields: update(fieldList) }))
  }

  const removeField = (id: string, fields?: ResponseField[]) => {
    const fieldList = fields || endpoint.responseFields
    const remove = (list: ResponseField[]): ResponseField[] =>
      list.filter((f) => f.id !== id).map((f) => f.children ? { ...f, children: remove(f.children) } : f)
    updateEndpoint((ep) => ({ ...ep, responseFields: remove(fieldList) }))
  }

  const addChildField = (parentId: string) => {
    const add = (list: ResponseField[]): ResponseField[] =>
      list.map((f) => {
        if (f.id === parentId) {
          return {
            ...f,
            children: [...(f.children || []), { id: uid(), name: 'child', type: 'string', required: false, description: '', example: '' }],
          }
        }
        if (f.children) return { ...f, children: add(f.children) }
        return f
      })
    updateEndpoint((ep) => ({ ...ep, responseFields: add(endpoint.responseFields) }))
  }

  const renderFieldRow = (field: ResponseField, depth: number) => {
    const hasChildren = field.children && field.children.length > 0
    const isExpanded = expandedRows[field.id] ?? true

    return (
      <div key={field.id} style={{ marginLeft: depth * 20 }}>
        <div style={{
          display: 'flex', gap: 6, alignItems: 'center',
          padding: '6px 8px', marginBottom: 4,
          borderRadius: 6,
          background: depth > 0 ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button
            onClick={() => toggleRow(field.id)}
            style={{
              width: 20, height: 20, borderRadius: 4,
              background: 'transparent', border: 'none',
              color: '#888', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span style={{ width: 14 }} />}
          </button>
          <ParamTypeIcon type={field.type} />
          <input
            value={field.name}
            onChange={(e) => updateField(field.id, { name: e.target.value })}
            style={{ ...inputStyle, padding: '4px 8px', fontSize: 12, width: 120, fontFamily: 'monospace' }}
            placeholder="字段名"
          />
          <select
            value={field.type}
            onChange={(e) => updateField(field.id, { type: e.target.value as ParamType })}
            style={{ ...inputStyle, padding: '4px 6px', fontSize: 11, width: 80 }}
          >
            {PARAM_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => updateField(field.id, { required: e.target.checked })}
            style={{ width: 14, height: 14, accentColor: '#8b5cf6' }}
          />
          <input
            value={field.description}
            onChange={(e) => updateField(field.id, { description: e.target.value })}
            style={{ ...inputStyle, padding: '4px 8px', fontSize: 11, flex: 1 }}
            placeholder="描述"
          />
          <input
            value={field.example}
            onChange={(e) => updateField(field.id, { example: e.target.value })}
            style={{ ...inputStyle, padding: '4px 8px', fontSize: 11, width: 120, fontFamily: 'monospace' }}
            placeholder="示例值"
          />
          {field.type === 'object' && (
            <button
              onClick={() => addChildField(field.id)}
              style={{
                width: 24, height: 24, borderRadius: 4,
                background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)',
                color: '#c4b5fd', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title="添加子字段"
            >
              <Plus size={12} />
            </button>
          )}
          <button
            onClick={() => removeField(field.id)}
            style={{
              width: 24, height: 24, borderRadius: 4,
              background: 'transparent', border: 'none',
              color: '#888', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div>{field.children!.map((child) => renderFieldRow(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <GlassPanel>
        <SectionHeader
          icon={Database}
          title="响应结构定义"
          count={endpoint.responseFields.length}
          action={
            <button onClick={addRootField} style={buttonStyle(false)}>
              <Plus size={13} /> 添加字段
            </button>
          }
        />
        {endpoint.responseFields.length === 0 ? (
          <div style={{ fontSize: 12, color: '#666', textAlign: 'center', padding: 20 }}>
            暂无响应字段，点击"添加字段"开始定义响应结构
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '20px 14px 120px 80px 30px 1fr 120px 28px 28px',
              gap: 6, padding: '4px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)',
              fontSize: 10, color: '#888', fontWeight: 600,
            }}>
              <span /> <span>名称</span> <span>类型</span> <span>必填</span> <span>描述</span> <span>示例</span> <span /> <span />
            </div>
            {endpoint.responseFields.map((f) => renderFieldRow(f, 0))}
          </div>
        )}
      </GlassPanel>
    </div>
  )
}

function MockPanel({ endpoint, onTest, mockResult }: {
  endpoint: Endpoint
  onTest: () => void
  mockResult: { status: number; body: string; time: number } | null
}) {
  const [copied, setCopied] = useState(false)
  const [copiedTerminal, setCopiedTerminal] = useState(false)

  const curl = `curl -X ${endpoint.method} "${endpoint.path}"`

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  const copyTerminal = () => {
    navigator.clipboard?.writeText(curl)
    setCopiedTerminal(true)
    setTimeout(() => setCopiedTerminal(false), 1500)
  }

  const statusColor = (code: number) => {
    if (code >= 200 && code < 300) return '#22c55e'
    if (code >= 300 && code < 400) return '#eab308'
    if (code >= 400 && code < 500) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <GlassPanel>
        <SectionHeader icon={Play} title="模拟请求配置" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: '#888', marginBottom: 4, display: 'block' }}>模拟状态码</label>
            <select
              value={endpoint.mockStatus}
              style={{ ...inputStyle, width: '100%' }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#888', marginBottom: 4, display: 'block' }}>
              模拟延迟: {endpoint.mockDelay}ms
            </label>
            <input
              type="range"
              min={0}
              max={3000}
              step={100}
              value={endpoint.mockDelay}
              style={{ width: '100%', accentColor: '#8b5cf6' }}
            />
          </div>
        </div>
      </GlassPanel>

      <GlassPanel>
        <SectionHeader
          icon={FileJson}
          title="模拟响应体"
          action={
            <button onClick={() => copy(endpoint.mockResponse)} style={buttonStyle(false)}>
              <Copy size={13} /> {copied ? '已复制' : '复制'}
            </button>
          }
        />
        <textarea
          value={endpoint.mockResponse}
          rows={10}
          style={{ ...inputStyle, width: '100%', fontFamily: 'monospace', fontSize: 12 }}
          placeholder='{"key": "value"}'
        />
      </GlassPanel>

      <GlassPanel>
        <SectionHeader icon={Terminal} title="cURL 命令" />
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button onClick={onTest} style={{
            ...buttonStyle(true),
            background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))',
            border: '1px solid rgba(139,92,246,0.5)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Send size={14} />
            发送模拟请求
          </button>
          <button onClick={copyTerminal} style={buttonStyle(false)}>
            <Copy size={14} /> {copiedTerminal ? '已复制' : '复制cURL'}
          </button>
        </div>
        <pre style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, padding: 12,
          overflow: 'auto', fontSize: 12,
          color: '#a6e3a1', fontFamily: 'monospace',
          margin: 0,
        }}>
          {curl}
        </pre>
      </GlassPanel>

      {mockResult && (
        <GlassPanel>
          <SectionHeader icon={Check} title="模拟响应结果" />
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{
              padding: '6px 14px', borderRadius: 8,
              background: `${statusColor(mockResult.status)}20`,
              border: `1px solid ${statusColor(mockResult.status)}40`,
              color: statusColor(mockResult.status),
              fontSize: 13, fontWeight: 700,
            }}>
              HTTP {mockResult.status}
            </div>
            <div style={{
              padding: '6px 14px', borderRadius: 8,
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#60a5fa',
              fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Clock size={14} /> {mockResult.time}ms
            </div>
          </div>
          <pre style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: 12,
            overflow: 'auto', maxHeight: 300,
            fontSize: 12, lineHeight: 1.6,
            color: '#a6e3a1', fontFamily: 'monospace',
            margin: 0,
          }}>
            {mockResult.body}
          </pre>
        </GlassPanel>
      )}
    </div>
  )
}

function DocsPanel({ endpoint, baseUrl, onShowDocs }: {
  endpoint: Endpoint
  baseUrl: string
  onShowDocs: () => void
}) {
  const curl = useMemo(() => {
    const url = `${baseUrl.replace(/\/$/, '')}${endpoint.path}`
    return `curl -X ${endpoint.method} "${url}" \\${endpoint.headers.length ? `\n  ${endpoint.headers.map((h) => `-H "${h.key}: ${h.value}"`).join(' \\\n  ')}` : ''}${endpoint.requestBody ? ` \\\n  -d '${endpoint.requestBody.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()}'` : ''}`
  }, [endpoint, baseUrl])

  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard?.writeText(curl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <GlassPanel>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <SectionHeader icon={FileText} title="API 文档预览" />
          <button
            onClick={onShowDocs}
            style={{
              ...buttonStyle(true),
              background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))',
              border: '1px solid rgba(139,92,246,0.5)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Eye size={14} /> 全屏预览
          </button>
        </div>

        <div style={{
          padding: 20,
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <MethodBadge method={endpoint.method} size="lg" />
            <code style={{ fontSize: 14, color: '#e0e0e8', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 6 }}>
              {endpoint.path}
            </code>
          </div>
          <p style={{ fontSize: 13, color: '#a0a0b0', margin: '0 0 16px', lineHeight: 1.6 }}>
            {endpoint.description || '暂无描述'}
          </p>

          {endpoint.pathParams.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>路径参数</h4>
              {endpoint.pathParams.map((p) => (
                <div key={p.id} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <code style={{ color: '#c4b5fd', fontFamily: 'monospace', fontSize: 12, minWidth: 100 }}>{p.name}</code>
                  <span style={{ color: '#888', fontSize: 11, minWidth: 60 }}>{p.type}</span>
                  {p.required && <span style={{ color: '#ef4444', fontSize: 10 }}>必填</span>}
                  <span style={{ color: '#a0a0b0', fontSize: 12, flex: 1 }}>{p.description}</span>
                </div>
              ))}
            </div>
          )}

          {endpoint.queryParams.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>查询参数</h4>
              {endpoint.queryParams.map((p) => (
                <div key={p.id} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <code style={{ color: '#c4b5fd', fontFamily: 'monospace', fontSize: 12, minWidth: 100 }}>{p.name}</code>
                  <span style={{ color: '#888', fontSize: 11, minWidth: 60 }}>{p.type}</span>
                  {p.required && <span style={{ color: '#ef4444', fontSize: 10 }}>必填</span>}
                  <span style={{ color: '#a0a0b0', fontSize: 12, flex: 1 }}>{p.description}</span>
                </div>
              ))}
            </div>
          )}

          {endpoint.requestBody && (endpoint.method === 'POST' || endpoint.method === 'PUT' || endpoint.method === 'PATCH') && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>请求体</h4>
              <pre style={{
                background: 'rgba(0,0,0,0.4)',
                borderRadius: 8, padding: 12,
                overflow: 'auto', fontSize: 12,
                color: '#a6e3a1', fontFamily: 'monospace',
                margin: 0,
              }}>
                {endpoint.requestBody}
              </pre>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 12, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>响应结构</h4>
            <pre style={{
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 8, padding: 12,
              overflow: 'auto', fontSize: 12,
              color: '#a6e3a1', fontFamily: 'monospace',
              margin: 0,
            }}>
              {endpoint.mockResponse || '{}'}
            </pre>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel>
        <SectionHeader
          icon={Terminal}
          title="cURL 命令"
          action={
            <button onClick={copy} style={buttonStyle(false)}>
              <Copy size={13} /> {copied ? '已复制' : '复制'}
            </button>
          }
        />
        <pre style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, padding: 12,
          overflow: 'auto', fontSize: 12,
          color: '#a6e3a1', fontFamily: 'monospace',
          margin: 0,
        }}>
          {curl}
        </pre>
      </GlassPanel>
    </div>
  )
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90vw', maxWidth: 900, maxHeight: '85vh',
          background: 'rgba(20,20,35,0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#888', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 20, overflow: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function DocsPreview({ endpoint, baseUrl }: { endpoint: Endpoint; baseUrl: string }) {
  const curl = useMemo(() => {
    const url = `${baseUrl.replace(/\/$/, '')}${endpoint.path}`
    const parts = [`curl -X ${endpoint.method} "${url}"`]
    for (const h of endpoint.headers) {
      if (h.value) parts.push(`-H "${h.key}: ${h.value}"`)
    }
    if (endpoint.requestBody) {
      parts.push(`-d '${endpoint.requestBody.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()}'`)
    }
    return parts.join(' \\\n  ')
  }, [endpoint, baseUrl])

  const [copiedTerminal, setCopiedTerminal] = useState(false)

  const copyTerminal = () => {
    navigator.clipboard?.writeText(curl)
    setCopiedTerminal(true)
    setTimeout(() => setCopiedTerminal(false), 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        padding: 24,
        background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <MethodBadge method={endpoint.method} size="lg" />
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{endpoint.name}</h2>
            <code style={{ fontSize: 13, color: '#888', fontFamily: 'monospace' }}>
              {baseUrl}{endpoint.path}
            </code>
          </div>
        </div>
        <p style={{ fontSize: 14, color: '#c0c0d0', lineHeight: 1.6 }}>
          {endpoint.description || '暂无描述信息'}
        </p>
      </div>

      {endpoint.pathParams.length > 0 && (
        <ParamsSection title="路径参数" items={endpoint.pathParams.map((p) => ({
          name: p.name, type: p.type, required: p.required, description: p.description, example: p.example,
        }))} />
      )}

      {endpoint.queryParams.length > 0 && (
        <ParamsSection title="查询参数" items={endpoint.queryParams.map((p) => ({
          name: p.name, type: p.type, required: p.required, description: p.description, example: p.example,
        }))} />
      )}

      {endpoint.headers.length > 0 && (
        <div>
          <h4 style={{ fontSize: 12, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>请求头</h4>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12 }}>
            {endpoint.headers.map((h) => (
              <div key={h.id} style={{ display: 'flex', gap: 12, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <code style={{ color: '#c4b5fd', fontFamily: 'monospace', fontSize: 12, minWidth: 160 }}>{h.key}</code>
                <span style={{ color: '#a0a0b0', fontSize: 12, flex: 1, fontFamily: 'monospace' }}>{h.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {endpoint.requestBody && (endpoint.method === 'POST' || endpoint.method === 'PUT' || endpoint.method === 'PATCH') && (
        <div>
          <h4 style={{ fontSize: 12, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>请求体示例</h4>
          <pre style={{
            background: 'rgba(0,0,0,0.4)',
            borderRadius: 8, padding: 14,
            overflow: 'auto', fontSize: 12,
            color: '#a6e3a1', fontFamily: 'monospace',
            margin: 0,
          }}>
            {endpoint.requestBody}
          </pre>
        </div>
      )}

      <div>
        <h4 style={{ fontSize: 12, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>响应示例</h4>
        <pre style={{
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 8, padding: 14,
          overflow: 'auto', fontSize: 12,
          color: '#a6e3a1', fontFamily: 'monospace',
          margin: 0,
        }}>
          {endpoint.mockResponse || '{}'}
        </pre>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h4 style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>cURL 命令</h4>
          <button onClick={copyTerminal} style={{ ...buttonStyle(false), display: 'flex', alignItems: 'center', gap: 6 }}>
            <Copy size={12} /> {copiedTerminal ? '已复制' : '复制'}
          </button>
        </div>
        <pre style={{
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 8, padding: 14,
          overflow: 'auto', fontSize: 12,
          color: '#a6e3a1', fontFamily: 'monospace',
          margin: 0,
        }}>
          {curl}
        </pre>
      </div>
    </div>
  )
}

function ParamsSection({ title, items }: {
  title: string
  items: { name: string; type: string; required: boolean; description: string; example: string }[]
}) {
  return (
    <div>
      <h4 style={{ fontSize: 12, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</h4>
      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, overflow: 'hidden' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{
            display: 'flex', gap: 12, padding: '10px 14px',
            borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            <code style={{ color: '#c4b5fd', fontFamily: 'monospace', fontSize: 12, minWidth: 120 }}>{item.name}</code>
            <span style={{ color: '#888', fontSize: 11, minWidth: 80 }}>{item.type}</span>
            {item.required && <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 600 }}>必填</span>}
            <span style={{ color: '#a0a0b0', fontSize: 12, flex: 1 }}>{item.description}</span>
            {item.example && <code style={{ color: '#60a5fa', fontFamily: 'monospace', fontSize: 11, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.example}</code>}
          </div>
        ))}
      </div>
    </div>
  )
}