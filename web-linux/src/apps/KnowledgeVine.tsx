import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import {
  Plus, Trash2, Search, ZoomIn, ZoomOut,
  TreePine, Network, List, LayoutGrid,
  Tag, Link2, Sparkles, Leaf, Sprout, TreeDeciduous,
  Download, Upload, Settings, X, Edit3, Save,
  Clock, Star, ChevronRight, Info
} from 'lucide-react'

type GrowthStage = 'seed' | 'sprout' | 'growing' | 'mature'
type ViewMode = 'tree' | 'mindmap' | 'list' | 'card'

interface NoteNode {
  id: string
  title: string
  content: string
  tags: string[]
  links: string[]
  parentId: string | null
  x: number
  y: number
  growth: GrowthStage
  lastVisited: number
  createdAt: number
  updatedAt: number
  color: string
}

interface Tag {
  id: string
  name: string
  color: string
}

interface KnowledgeVineState {
  nodes: NoteNode[]
  tags: Tag[]
  selectedId: string | null
  view: ViewMode
  zoom: number
  pan: { x: number; y: number }
  activeTag: string | null
  searchQuery: string
}

const STORAGE_KEY = 'knowledge-vine-garden-v1'

const GROWTH_CONFIG: Record<GrowthStage, { label: string; icon: typeof Leaf; days: number }> = {
  seed: { label: '种子', icon: Sparkles, days: 0 },
  sprout: { label: '幼苗', icon: Sprout, days: 3 },
  growing: { label: '成长', icon: Leaf, days: 7 },
  mature: { label: '成熟', icon: TreeDeciduous, days: 14 },
}

const NODE_COLORS = [
  '#4ade80', '#22d3ee', '#a78bfa', '#fb923c',
  '#f472b6', '#facc15', '#60a5fa', '#34d399',
]

const DEFAULT_TAGS: Tag[] = [
  { id: 't-idea', name: '灵感', color: '#fbbf24' },
  { id: 't-learn', name: '学习', color: '#60a5fa' },
  { id: 't-work', name: '工作', color: '#34d399' },
  { id: 't-life', name: '生活', color: '#f472b6' },
  { id: 't-ref', name: '参考', color: '#a78bfa' },
]

function generateId(): string {
  return 'n_' + Math.random().toString(36).slice(2, 10)
}

function calcGrowth(createdAt: number, updatedAt: number): GrowthStage {
  const age = Date.now() - Math.max(createdAt, updatedAt)
  const days = age / (1000 * 60 * 60 * 24)
  if (days >= 14) return 'mature'
  if (days >= 7) return 'growing'
  if (days >= 3) return 'sprout'
  return 'seed'
}

function createSeedData(): KnowledgeVineState {
  const now = Date.now()
  const rootId = generateId()
  const child1 = generateId()
  const child2 = generateId()
  const child3 = generateId()
  const grand1 = generateId()
  const grand2 = generateId()

  const nodes: NoteNode[] = [
    {
      id: rootId,
      title: '我的知识花园',
      content: '欢迎来到知识花园！\n\n这是你的知识树根节点。\n\n点击子节点探索，或创建新的想法。',
      tags: ['t-idea'],
      links: [child1, child2, child3],
      parentId: null,
      x: 400,
      y: 250,
      growth: 'mature',
      lastVisited: now,
      createdAt: now - 30 * 86400000,
      updatedAt: now - 86400000,
      color: NODE_COLORS[0],
    },
    {
      id: child1,
      title: '学习笔记',
      content: '记录学习过程中的重要知识点\n\n## 主题\n- 技术学习\n- 读书心得\n- 课程笔记',
      tags: ['t-learn'],
      links: [grand1, grand2],
      parentId: rootId,
      x: 150,
      y: 150,
      growth: 'growing',
      lastVisited: now - 3600000,
      createdAt: now - 10 * 86400000,
      updatedAt: now - 2 * 86400000,
      color: NODE_COLORS[1],
    },
    {
      id: child2,
      title: '项目想法',
      content: '收集各种项目创意\n\n待做的项目清单：\n1. 个人博客\n2. 开源工具\n3. 副业项目',
      tags: ['t-work', 't-idea'],
      links: [],
      parentId: rootId,
      x: 150,
      y: 350,
      growth: 'sprout',
      lastVisited: now - 86400000,
      createdAt: now - 5 * 86400000,
      updatedAt: now - 3 * 86400000,
      color: NODE_COLORS[2],
    },
    {
      id: child3,
      title: '生活感悟',
      content: '记录生活中的点滴思考\n\n- 每日反思\n- 读书笔记\n- 灵感闪现',
      tags: ['t-life'],
      links: [],
      parentId: rootId,
      x: 650,
      y: 150,
      growth: 'seed',
      lastVisited: now - 2 * 86400000,
      createdAt: now - 2 * 86400000,
      updatedAt: now - 2 * 86400000,
      color: NODE_COLORS[3],
    },
    {
      id: grand1,
      title: 'React 深入',
      content: 'React 核心概念学习笔记\n\n- Hooks 原理\n- Fiber 架构\n- 状态管理',
      tags: ['t-learn', 't-work'],
      links: [],
      parentId: child1,
      x: -50,
      y: 80,
      growth: 'growing',
      lastVisited: now,
      createdAt: now - 8 * 86400000,
      updatedAt: now - 86400000,
      color: NODE_COLORS[5],
    },
    {
      id: grand2,
      title: '设计模式',
      content: '常见设计模式总结\n\n## 创建型\n- 单例、工厂、建造者\n\n## 结构型\n- 适配器、装饰器、代理\n\n## 行为型\n- 观察者、策略、命令',
      tags: ['t-learn'],
      links: [],
      parentId: child1,
      x: -50,
      y: 220,
      growth: 'mature',
      lastVisited: now - 7200000,
      createdAt: now - 20 * 86400000,
      updatedAt: now - 15 * 86400000,
      color: NODE_COLORS[6],
    },
  ]

  return {
    nodes,
    tags: DEFAULT_TAGS,
    selectedId: null,
    view: 'tree',
    zoom: 1,
    pan: { x: 0, y: 0 },
    activeTag: null,
    searchQuery: '',
  }
}

function loadState(): KnowledgeVineState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.nodes && Array.isArray(parsed.nodes)) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return createSeedData()
}

function saveState(state: KnowledgeVineState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota
  }
}

const KnowledgeVine = memo(function KnowledgeVine() {
  const [state, setState] = useState<KnowledgeVineState>(() => loadState())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{ title: string; content: string; tags: string[] }>({ title: '', content: '', tags: [] })
  const [showSettings, setShowSettings] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const dragNode = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      return
    }
    const timer = setTimeout(() => saveState(state), 300)
    return () => clearTimeout(timer)
  }, [state])

  const { nodes, tags, selectedId, view, zoom, pan, activeTag, searchQuery } = state

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedId) || null, [nodes, selectedId])

  const filteredNodes = useMemo(() => {
    let result = nodes
    if (activeTag) {
      result = result.filter(n => n.tags.includes(activeTag))
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      )
    }
    return result
  }, [nodes, activeTag, searchQuery])

  const nodesWithGrowth = useMemo(() =>
    filteredNodes.map(n => ({ ...n, growth: calcGrowth(n.createdAt, n.updatedAt) })),
    [filteredNodes]
  )

  const recentlyVisitedIds = useMemo(() => {
    return [...nodes]
      .sort((a, b) => b.lastVisited - a.lastVisited)
      .slice(0, 5)
      .map(n => n.id)
  }, [nodes])

  const needsReviewIds = useMemo(() => {
    const now = Date.now()
    return nodes.filter(n => {
      const daysSinceVisit = (now - n.lastVisited) / 86400000
      const stage = GROWTH_CONFIG[n.growth]
      return daysSinceVisit >= stage.days && n.growth !== 'seed'
    }).map(n => n.id)
  }, [nodes])

  const selectNode = useCallback((id: string | null) => {
    setState(prev => {
      if (!id) return { ...prev, selectedId: null }
      return {
        ...prev,
        selectedId: id,
        nodes: prev.nodes.map(n =>
          n.id === id ? { ...n, lastVisited: Date.now() } : n
        ),
      }
    })
    setEditingId(null)
  }, [])

  const createNode = useCallback((parentId: string | null = null) => {
    const parent = parentId ? nodes.find(n => n.id === parentId) : null
    const newId = generateId()
    const newNode: NoteNode = {
      id: newId,
      title: '新想法',
      content: '',
      tags: parent?.tags.slice(0, 1) || [],
      links: [],
      parentId,
      x: parent ? parent.x + 120 : 400,
      y: parent ? parent.y + 80 + Math.random() * 40 : 300,
      growth: 'seed',
      lastVisited: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      color: NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)],
    }
    setState(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      selectedId: newId,
    }))
    setEditingId(newId)
    setEditDraft({ title: '新想法', content: '', tags: newNode.tags })
  }, [nodes])

  const deleteNode = useCallback((id: string) => {
    if (!confirm('确定删除这个节点及其所有子节点吗？')) return
    const toDelete = new Set<string>()
    const collectChildren = (parentId: string) => {
      toDelete.add(parentId)
      nodes.filter(n => n.parentId === parentId).forEach(n => collectChildren(n.id))
    }
    collectChildren(id)
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => !toDelete.has(n.id)),
      selectedId: prev.selectedId === id ? null : prev.selectedId,
    }))
    setEditingId(null)
  }, [nodes])

  const startEdit = useCallback((node: NoteNode) => {
    setEditingId(node.id)
    setEditDraft({ title: node.title, content: node.content, tags: [...node.tags] })
  }, [])

  const saveEdit = useCallback(() => {
    if (!editingId) return
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === editingId
          ? { ...n, ...editDraft, updatedAt: Date.now() }
          : n
      ),
    }))
    setEditingId(null)
  }, [editingId, editDraft])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
  }, [])

  const exportData = useCallback(() => {
    const data = JSON.stringify(state, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `knowledge-vine-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [state])

  const importData = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string)
          if (data.nodes && Array.isArray(data.nodes)) {
            setState(prev => ({ ...prev, ...data }))
          }
        } catch {
          alert('导入失败：文件格式错误')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (view !== 'tree' && view !== 'mindmap') return
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setState(prev => ({
      ...prev,
      zoom: Math.max(0.3, Math.min(2.5, prev.zoom * delta)),
    }))
  }, [view])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('.kv-node')) return
    isPanning.current = true
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
  }, [pan])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragNode.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x - dragNode.current.offsetX) / zoom
      const y = (e.clientY - rect.top - pan.y - dragNode.current.offsetY) / zoom
      setState(prev => ({
        ...prev,
        nodes: prev.nodes.map(n =>
          n.id === dragNode.current!.id ? { ...n, x, y } : n
        ),
      }))
      return
    }
    if (isPanning.current) {
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      setState(prev => ({
        ...prev,
        pan: {
          x: panStart.current.panX + dx,
          y: panStart.current.panY + dy,
        },
      }))
    }
  }, [pan, zoom])

  const handleCanvasMouseUp = useCallback(() => {
    isPanning.current = false
    dragNode.current = null
  }, [])

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, node: NoteNode) => {
    e.stopPropagation()
    if (editingId) return
    const target = e.target as HTMLElement
    if (target.closest('button')) return
    dragNode.current = {
      id: node.id,
      offsetX: e.nativeEvent.offsetX,
      offsetY: e.nativeEvent.offsetY,
    }
    selectNode(node.id)
  }, [editingId, selectNode])

  const toggleTag = useCallback((_nodeId: string, tagId: string) => {
    setEditDraft(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(t => t !== tagId)
        : [...prev.tags, tagId]
    }))
  }, [])

  const renderTreeView = () => (
    <div
      className="kv-canvas"
      ref={canvasRef}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
    >
      <svg
        className="kv-svg"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          {nodesWithGrowth.map(n => (
            <linearGradient key={n.id} id={`grad-${n.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={n.color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={n.color} stopOpacity="0.6" />
            </linearGradient>
          ))}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {nodesWithGrowth.map(node => {
          if (!node.parentId) return null
          const parent = nodes.find(n => n.id === node.parentId)
          if (!parent) return null
          const isRecent = recentlyVisitedIds.includes(node.id)
          return (
            <path
              key={`edge-${node.id}`}
              d={`M ${parent.x} ${parent.y} Q ${(parent.x + node.x) / 2} ${parent.y} ${node.x} ${node.y}`}
              fill="none"
              stroke={isRecent ? node.color : 'rgba(255,255,255,0.2)'}
              strokeWidth={isRecent ? 2 : 1.5}
              strokeDasharray={isRecent ? 'none' : '4 4'}
              opacity={isRecent ? 0.8 : 0.4}
            />
          )
        })}
      </svg>
      <div
        className="kv-nodes-container"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {nodesWithGrowth.map(node => {
          const GrowthIcon = GROWTH_CONFIG[node.growth].icon
          const isSelected = selectedId === node.id
          const isRecent = recentlyVisitedIds.includes(node.id)
          const needsReview = needsReviewIds.includes(node.id)
          return (
            <div
              key={node.id}
              className={`kv-node ${isSelected ? 'selected' : ''} ${isRecent ? 'recent' : ''} ${needsReview ? 'needs-review' : ''}`}
              style={{
                left: node.x,
                top: node.y,
                '--node-color': node.color,
              } as React.CSSProperties}
              onMouseDown={(e) => handleNodeMouseDown(e, node)}
              onDoubleClick={() => startEdit(node)}
            >
              <div className="kv-node-glow" />
              <div className="kv-node-header">
                <GrowthIcon size={12} />
                <span className="kv-node-title">{node.title}</span>
              </div>
              {node.tags.length > 0 && (
                <div className="kv-node-tags">
                  {node.tags.slice(0, 2).map(tid => {
                    const t = tags.find(x => x.id === tid)
                    return t ? <span key={tid} className="kv-mini-tag" style={{ background: t.color + '30', color: t.color }}>{t.name}</span> : null
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderListView = () => (
    <div className="kv-list">
      {nodesWithGrowth.map(node => {
        const GrowthIcon = GROWTH_CONFIG[node.growth].icon
        return (
          <div
            key={node.id}
            className={`kv-list-item ${selectedId === node.id ? 'selected' : ''}`}
            onClick={() => selectNode(node.id)}
            onDoubleClick={() => startEdit(node)}
          >
            <div className="kv-list-icon" style={{ color: node.color }}>
              <GrowthIcon size={16} />
            </div>
            <div className="kv-list-content">
              <div className="kv-list-title">{node.title}</div>
              <div className="kv-list-preview">{node.content.slice(0, 80).replace(/\n/g, ' ')}</div>
            </div>
            <div className="kv-list-tags">
              {node.tags.slice(0, 2).map(tid => {
                const t = tags.find(x => x.id === tid)
                return t ? <span key={tid} className="kv-mini-tag" style={{ background: t.color + '30', color: t.color }}>{t.name}</span> : null
              })}
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderCardView = () => (
    <div className="kv-cards">
      {nodesWithGrowth.map(node => {
        const GrowthIcon = GROWTH_CONFIG[node.growth].icon
        return (
          <div
            key={node.id}
            className={`kv-card-item ${selectedId === node.id ? 'selected' : ''}`}
            style={{ borderColor: node.color + '40' }}
            onClick={() => selectNode(node.id)}
            onDoubleClick={() => startEdit(node)}
          >
            <div className="kv-card-header" style={{ background: `linear-gradient(135deg, ${node.color}20, transparent)` }}>
              <GrowthIcon size={18} style={{ color: node.color }} />
              <span className="kv-card-growth">{GROWTH_CONFIG[node.growth].label}</span>
            </div>
            <div className="kv-card-body">
              <h3>{node.title}</h3>
              <p>{node.content.slice(0, 100).replace(/\n/g, ' ')}</p>
            </div>
            <div className="kv-card-footer">
              {node.tags.slice(0, 3).map(tid => {
                const t = tags.find(x => x.id === tid)
                return t ? <span key={tid} className="kv-mini-tag" style={{ background: t.color + '30', color: t.color }}>{t.name}</span> : null
              })}
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderMindMapView = () => {
    return (
      <div
        className="kv-canvas"
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
      >
        <svg
          className="kv-svg"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <defs>
            <filter id="glow-mind">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {nodesWithGrowth.map(node => {
            if (!node.parentId) return null
            const parent = nodes.find(n => n.id === node.parentId)
            if (!parent) return null
            return (
              <path
                key={`mind-edge-${node.id}`}
                d={`M ${parent.x + 80} ${parent.y} C ${parent.x + 140} ${parent.y}, ${node.x - 60} ${node.y}, ${node.x} ${node.y}`}
                fill="none"
                stroke={node.color}
                strokeWidth={2}
                opacity={0.5}
              />
            )
          })}
        </svg>
        <div
          className="kv-nodes-container"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {nodesWithGrowth.map(node => {
            const GrowthIcon = GROWTH_CONFIG[node.growth].icon
            const isSelected = selectedId === node.id
            const isRoot = !node.parentId
            return (
              <div
                key={node.id}
                className={`kv-mind-node ${isRoot ? 'root' : ''} ${isSelected ? 'selected' : ''}`}
                style={{
                  left: node.x,
                  top: node.y,
                  '--node-color': node.color,
                } as React.CSSProperties}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onDoubleClick={() => startEdit(node)}
              >
                <GrowthIcon size={14} />
                <span>{node.title}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="kv-app">
      <style>{`
        .kv-app {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #0a0f1a 0%, #0d1424 50%, #0a1020 100%);
          color: #e2e8f0;
          font-family: 'Inter', system-ui, sans-serif;
          overflow: hidden;
          position: relative;
        }
        .kv-app::before {
          content: '';
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(ellipse at 20% 20%, rgba(74, 222, 128, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(167, 139, 250, 0.08) 0%, transparent 50%);
          pointer-events: none;
        }
        .kv-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 20px;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          position: relative;
          z-index: 10;
        }
        .kv-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 180px;
        }
        .kv-logo {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #4ade80, #22d3ee);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(74, 222, 128, 0.3);
        }
        .kv-brand h1 {
          font-size: 15px;
          font-weight: 600;
          margin: 0;
          background: linear-gradient(135deg, #4ade80, #22d3ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .kv-brand small {
          font-size: 10px;
          color: #64748b;
        }
        .kv-search {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 6px 12px;
          max-width: 400px;
        }
        .kv-search input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #e2e8f0;
          font-size: 12px;
        }
        .kv-search svg { color: #64748b; }
        .kv-view-switch {
          display: flex;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          padding: 3px;
          gap: 2px;
        }
        .kv-view-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s;
        }
        .kv-view-btn:hover { color: #94a3b8; }
        .kv-view-btn.active {
          background: rgba(74, 222, 128, 0.15);
          color: #4ade80;
        }
        .kv-header-actions {
          display: flex;
          gap: 8px;
        }
        .kv-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.04);
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .kv-icon-btn:hover {
          background: rgba(74, 222, 128, 0.1);
          color: #4ade80;
          border-color: rgba(74, 222, 128, 0.3);
        }
        .kv-btn-primary {
          padding: 6px 14px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, #4ade80, #22d3ee);
          color: #0a0f1a;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          box-shadow: 0 0 16px rgba(74, 222, 128, 0.3);
        }
        .kv-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 24px rgba(74, 222, 128, 0.4);
        }
        .kv-body {
          flex: 1;
          display: flex;
          overflow: hidden;
          position: relative;
        }
        .kv-sidebar {
          width: 220px;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(10px);
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .kv-sidebar-section h3 {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #64748b;
          margin: 0 0 10px 0;
          font-weight: 600;
        }
        .kv-tag-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .kv-tag-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          color: #94a3b8;
          transition: all 0.15s;
        }
        .kv-tag-item:hover {
          background: rgba(255, 255, 255, 0.04);
          color: #e2e8f0;
        }
        .kv-tag-item.active {
          background: rgba(74, 222, 128, 0.1);
          color: #4ade80;
        }
        .kv-tag-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .kv-growth-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .kv-growth-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11px;
          color: #94a3b8;
        }
        .kv-stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .kv-stat-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 10px;
          text-align: center;
        }
        .kv-stat-num {
          font-size: 18px;
          font-weight: 700;
          background: linear-gradient(135deg, #4ade80, #22d3ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .kv-stat-label {
          font-size: 10px;
          color: #64748b;
          margin-top: 2px;
        }
        .kv-main {
          flex: 1;
          position: relative;
          overflow: hidden;
        }
        .kv-canvas {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }
        .kv-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .kv-nodes-container {
          position: absolute;
          inset: 0;
        }
        .kv-node {
          position: absolute;
          min-width: 120px;
          max-width: 180px;
          transform: translate(-50%, -50%);
          cursor: grab;
          user-select: none;
        }
        .kv-node:active { cursor: grabbing; }
        .kv-node-glow {
          position: absolute;
          inset: -12px;
          background: radial-gradient(ellipse at center, var(--node-color) 0%, transparent 70%);
          opacity: 0.15;
          filter: blur(8px);
          transition: opacity 0.3s;
          pointer-events: none;
        }
        .kv-node.recent .kv-node-glow { opacity: 0.35; animation: pulse 2s ease-in-out infinite; }
        .kv-node.needs-review .kv-node-glow { opacity: 0.5; animation: pulse 1.5s ease-in-out infinite; }
        .kv-node.selected .kv-node-glow { opacity: 0.5; }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .kv-node-header {
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
          z-index: 1;
          transition: all 0.2s;
        }
        .kv-node.selected .kv-node-header {
          border-color: var(--node-color);
          box-shadow: 0 0 20px rgba(74, 222, 128, 0.2);
        }
        .kv-node-title {
          font-size: 12px;
          font-weight: 500;
          color: #e2e8f0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .kv-node-tags {
          display: flex;
          gap: 4px;
          margin-top: 4px;
          padding: 0 4px;
          flex-wrap: wrap;
        }
        .kv-mini-tag {
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }
        .kv-mind-node {
          position: absolute;
          transform: translate(-50%, -50%);
          padding: 10px 16px;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid var(--node-color);
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: grab;
          white-space: nowrap;
          box-shadow: 0 0 20px color-mix(in srgb, var(--node-color) 30%, transparent);
          transition: all 0.2s;
        }
        .kv-mind-node.root {
          padding: 14px 24px;
          font-size: 14px;
          font-weight: 700;
          background: linear-gradient(135deg, var(--node-color), var(--node-color)80);
          color: #0a0f1a;
          box-shadow: 0 0 30px color-mix(in srgb, var(--node-color) 50%, transparent);
        }
        .kv-mind-node.selected {
          transform: translate(-50%, -50%) scale(1.05);
        }
        .kv-list {
          padding: 16px;
          overflow-y: auto;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .kv-list-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .kv-list-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .kv-list-item.selected {
          background: rgba(74, 222, 128, 0.08);
          border-color: rgba(74, 222, 128, 0.3);
        }
        .kv-list-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .kv-list-content {
          flex: 1;
          min-width: 0;
        }
        .kv-list-title {
          font-size: 13px;
          font-weight: 500;
          color: #e2e8f0;
          margin-bottom: 2px;
        }
        .kv-list-preview {
          font-size: 11px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .kv-list-tags {
          display: flex;
          gap: 4px;
        }
        .kv-cards {
          padding: 20px;
          overflow-y: auto;
          height: 100%;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
          align-content: start;
        }
        .kv-card-item {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
        }
        .kv-card-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .kv-card-item.selected {
          border-color: #4ade80;
          box-shadow: 0 0 20px rgba(74, 222, 128, 0.15);
        }
        .kv-card-header {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .kv-card-growth {
          font-size: 10px;
          color: #64748b;
          font-weight: 500;
        }
        .kv-card-body {
          padding: 14px 16px;
        }
        .kv-card-body h3 {
          margin: 0 0 6px 0;
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
        }
        .kv-card-body p {
          margin: 0;
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .kv-card-footer {
          padding: 10px 16px;
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .kv-detail {
          width: 300px;
          border-left: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .kv-detail-header {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .kv-detail-header h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
        }
        .kv-detail-actions {
          display: flex;
          gap: 4px;
        }
        .kv-detail-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        .kv-detail-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #64748b;
          text-align: center;
          gap: 12px;
        }
        .kv-detail-empty p {
          font-size: 12px;
          margin: 0;
        }
        .kv-title-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 10px 12px;
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 600;
          outline: none;
          margin-bottom: 12px;
        }
        .kv-title-input:focus {
          border-color: #4ade80;
          box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.1);
        }
        .kv-content-textarea {
          width: 100%;
          min-height: 200px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 10px 12px;
          color: #e2e8f0;
          font-size: 12px;
          font-family: inherit;
          line-height: 1.6;
          outline: none;
          resize: vertical;
          margin-bottom: 12px;
        }
        .kv-content-textarea:focus {
          border-color: #4ade80;
          box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.1);
        }
        .kv-view-title {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
          margin: 0 0 12px 0;
        }
        .kv-view-content {
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.7;
          white-space: pre-wrap;
        }
        .kv-meta {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .kv-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: #64748b;
          margin-bottom: 8px;
        }
        .kv-tags-editor {
          margin-bottom: 12px;
        }
        .kv-tags-label {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .kv-tags-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .kv-tag-pick {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s;
        }
        .kv-tag-pick.selected {
          border-color: currentColor;
        }
        .kv-edit-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }
        .kv-edit-btn {
          flex: 1;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          color: #94a3b8;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.15s;
        }
        .kv-edit-btn:hover {
          color: #e2e8f0;
          border-color: rgba(255, 255, 255, 0.2);
        }
        .kv-edit-btn.primary {
          background: linear-gradient(135deg, #4ade80, #22d3ee);
          color: #0a0f1a;
          border-color: transparent;
          font-weight: 600;
        }
        .kv-edit-btn.primary:hover {
          box-shadow: 0 0 16px rgba(74, 222, 128, 0.3);
        }
        .kv-zoom-controls {
          position: absolute;
          bottom: 20px;
          left: 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 5;
        }
        .kv-zoom-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(10px);
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .kv-zoom-btn:hover {
          color: #4ade80;
          border-color: rgba(74, 222, 128, 0.3);
        }
        .kv-zoom-val {
          text-align: center;
          font-size: 10px;
          color: #64748b;
          padding: 4px 0;
        }
        .kv-hint {
          position: absolute;
          bottom: 20px;
          right: 20px;
          font-size: 10px;
          color: #475569;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(10px);
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .kv-settings-panel {
          position: absolute;
          top: 60px;
          right: 20px;
          width: 240px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px;
          z-index: 20;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        .kv-settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .kv-settings-header h3 {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
        }
        .kv-settings-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }
        .kv-settings-row button {
          width: 100%;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          color: #94a3b8;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s;
        }
        .kv-settings-row button:hover {
          background: rgba(74, 222, 128, 0.1);
          color: #4ade80;
          border-color: rgba(74, 222, 128, 0.3);
        }
      `}</style>

      <header className="kv-header">
        <div className="kv-brand">
          <div className="kv-logo">
            <TreePine size={18} color="#0a0f1a" />
          </div>
          <div>
            <h1>KnowledgeVine</h1>
            <small>知识花园</small>
          </div>
        </div>

        <div className="kv-search">
          <Search size={14} />
          <input
            placeholder="搜索知识节点..."
            value={searchQuery}
            onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
          />
        </div>

        <div className="kv-view-switch">
          <button
            className={`kv-view-btn ${view === 'tree' ? 'active' : ''}`}
            onClick={() => setState(prev => ({ ...prev, view: 'tree' }))}
          >
            <TreePine size={13} /> 树状
          </button>
          <button
            className={`kv-view-btn ${view === 'mindmap' ? 'active' : ''}`}
            onClick={() => setState(prev => ({ ...prev, view: 'mindmap' }))}
          >
            <Network size={13} /> 导图
          </button>
          <button
            className={`kv-view-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setState(prev => ({ ...prev, view: 'list' }))}
          >
            <List size={13} /> 列表
          </button>
          <button
            className={`kv-view-btn ${view === 'card' ? 'active' : ''}`}
            onClick={() => setState(prev => ({ ...prev, view: 'card' }))}
          >
            <LayoutGrid size={13} /> 卡片
          </button>
        </div>

        <div className="kv-header-actions">
          <button className="kv-icon-btn" onClick={() => setShowSettings(s => !s)} title="设置">
            <Settings size={14} />
          </button>
          <button className="kv-btn-primary" onClick={() => createNode(selectedId)}>
            <Plus size={13} /> 新节点
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="kv-settings-panel">
          <div className="kv-settings-header">
            <h3>设置</h3>
            <button className="kv-icon-btn" style={{ width: 24, height: 24 }} onClick={() => setShowSettings(false)}>
              <X size={12} />
            </button>
          </div>
          <div className="kv-settings-row">
            <button onClick={exportData}><Download size={14} /> 导出 JSON</button>
            <button onClick={importData}><Upload size={14} /> 导入 JSON</button>
          </div>
        </div>
      )}

      <div className="kv-body">
        <aside className="kv-sidebar">
          <div className="kv-sidebar-section">
            <h3>标签</h3>
            <div className="kv-tag-list">
              <div
                className={`kv-tag-item ${!activeTag ? 'active' : ''}`}
                onClick={() => setState(prev => ({ ...prev, activeTag: null }))}
              >
                <span className="kv-tag-dot" style={{ background: '#64748b' }} />
                全部节点
                <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.7 }}>{nodes.length}</span>
              </div>
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className={`kv-tag-item ${activeTag === tag.id ? 'active' : ''}`}
                  onClick={() => setState(prev => ({ ...prev, activeTag: tag.id }))}
                >
                  <span className="kv-tag-dot" style={{ background: tag.color }} />
                  {tag.name}
                  <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.7 }}>
                    {nodes.filter(n => n.tags.includes(tag.id)).length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="kv-sidebar-section">
            <h3>成长状态</h3>
            <div className="kv-growth-list">
              {(Object.keys(GROWTH_CONFIG) as GrowthStage[]).map(stage => {
                const config = GROWTH_CONFIG[stage]
                const Icon = config.icon
                const count = nodesWithGrowth.filter(n => n.growth === stage).length
                return (
                  <div key={stage} className="kv-growth-item">
                    <Icon size={14} />
                    <span style={{ flex: 1 }}>{config.label}</span>
                    <span style={{ opacity: 0.7 }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {needsReviewIds.length > 0 && (
            <div className="kv-sidebar-section">
              <h3>待复习</h3>
              <div className="kv-tag-list">
                {nodes.filter(n => needsReviewIds.includes(n.id)).slice(0, 5).map(n => (
                  <div
                    key={n.id}
                    className="kv-tag-item"
                    onClick={() => selectNode(n.id)}
                  >
                    <Star size={12} style={{ color: '#fbbf24' }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="kv-sidebar-section" style={{ marginTop: 'auto' }}>
            <div className="kv-stat-grid">
              <div className="kv-stat-card">
                <div className="kv-stat-num">{nodes.length}</div>
                <div className="kv-stat-label">总节点</div>
              </div>
              <div className="kv-stat-card">
                <div className="kv-stat-num">{tags.length}</div>
                <div className="kv-stat-label">标签</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="kv-main">
          {view === 'tree' && renderTreeView()}
          {view === 'mindmap' && renderMindMapView()}
          {view === 'list' && renderListView()}
          {view === 'card' && renderCardView()}

          {(view === 'tree' || view === 'mindmap') && (
            <>
              <div className="kv-zoom-controls">
                <button
                  className="kv-zoom-btn"
                  onClick={() => setState(prev => ({ ...prev, zoom: Math.min(2.5, prev.zoom * 1.2) }))}
                >
                  <ZoomIn size={16} />
                </button>
                <div className="kv-zoom-val">{Math.round(zoom * 100)}%</div>
                <button
                  className="kv-zoom-btn"
                  onClick={() => setState(prev => ({ ...prev, zoom: Math.max(0.3, prev.zoom * 0.8) }))}
                >
                  <ZoomOut size={16} />
                </button>
              </div>
              <div className="kv-hint">
                拖拽画布平移 · 滚轮缩放 · 双击编辑
              </div>
            </>
          )}
        </main>

        <aside className="kv-detail">
          <div className="kv-detail-header">
            <h2>{selectedNode ? (editingId ? '编辑节点' : '节点详情') : '节点详情'}</h2>
            {selectedNode && !editingId && (
              <div className="kv-detail-actions">
                <button className="kv-icon-btn" onClick={() => startEdit(selectedNode)} title="编辑">
                  <Edit3 size={13} />
                </button>
                <button className="kv-icon-btn" onClick={() => createNode(selectedNode.id)} title="添加子节点">
                  <Plus size={13} />
                </button>
                <button className="kv-icon-btn" onClick={() => deleteNode(selectedNode.id)} title="删除">
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>

          <div className="kv-detail-body">
            {!selectedNode ? (
              <div className="kv-detail-empty">
                <Info size={32} style={{ opacity: 0.3 }} />
                <p>选择一个节点查看详情<br />或创建新的知识节点</p>
              </div>
            ) : editingId ? (
              <>
                <input
                  className="kv-title-input"
                  value={editDraft.title}
                  onChange={(e) => setEditDraft(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="节点标题"
                  autoFocus
                />
                <textarea
                  className="kv-content-textarea"
                  value={editDraft.content}
                  onChange={(e) => setEditDraft(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="记录你的想法..."
                />
                <div className="kv-tags-editor">
                  <div className="kv-tags-label">
                    <Tag size={11} /> 标签
                  </div>
                  <div className="kv-tags-picker">
                    {tags.map(tag => (
                      <div
                        key={tag.id}
                        className={`kv-tag-pick ${editDraft.tags.includes(tag.id) ? 'selected' : ''}`}
                        style={{ background: tag.color + '20', color: tag.color }}
                        onClick={() => toggleTag(editingId, tag.id)}
                      >
                        {tag.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="kv-edit-actions">
                  <button className="kv-edit-btn" onClick={cancelEdit}>取消</button>
                  <button className="kv-edit-btn primary" onClick={saveEdit}>
                    <Save size={12} /> 保存
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="kv-view-title" style={{ color: selectedNode.color }}>
                  {selectedNode.title}
                </h2>
                <div className="kv-view-content">{selectedNode.content || '(暂无内容)'}</div>

                {selectedNode.tags.length > 0 && (
                  <div className="kv-meta">
                    <div className="kv-tags-label" style={{ marginBottom: 8 }}>
                      <Tag size={11} /> 标签
                    </div>
                    <div className="kv-tags-picker">
                      {selectedNode.tags.map(tid => {
                        const t = tags.find(x => x.id === tid)
                        return t ? (
                          <span key={tid} className="kv-tag-pick selected" style={{ background: t.color + '20', color: t.color }}>
                            {t.name}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                )}

                <div className="kv-meta">
                  <div className="kv-meta-row">
                    <span><Leaf size={11} style={{ verticalAlign: -2, marginRight: 4 }} /> 成长阶段</span>
                    <span style={{ color: selectedNode.color }}>{GROWTH_CONFIG[selectedNode.growth].label}</span>
                  </div>
                  <div className="kv-meta-row">
                    <span><Clock size={11} style={{ verticalAlign: -2, marginRight: 4 }} /> 上次访问</span>
                    <span>{formatTime(selectedNode.lastVisited)}</span>
                  </div>
                  <div className="kv-meta-row">
                    <span><Sparkles size={11} style={{ verticalAlign: -2, marginRight: 4 }} /> 创建时间</span>
                    <span>{formatDate(selectedNode.createdAt)}</span>
                  </div>
                </div>

                {selectedNode.parentId && (
                  <div className="kv-meta">
                    <div className="kv-tags-label" style={{ marginBottom: 8 }}>
                      <Link2 size={11} /> 父节点
                    </div>
                    {(() => {
                      const parent = nodes.find(n => n.id === selectedNode.parentId)
                      if (!parent) return null
                      return (
                        <div
                          className="kv-tag-pick"
                          style={{ background: parent.color + '20', color: parent.color, cursor: 'pointer' }}
                          onClick={() => selectNode(parent.id)}
                        >
                          <ChevronRight size={11} /> {parent.title}
                        </div>
                      )
                    })()}
                  </div>
                )}

                {(() => {
                  const children = nodes.filter(n => n.parentId === selectedNode.id)
                  if (children.length === 0) return null
                  return (
                    <div className="kv-meta">
                      <div className="kv-tags-label" style={{ marginBottom: 8 }}>
                        <TreeDeciduous size={11} /> 子节点 ({children.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {children.map(child => (
                          <div
                            key={child.id}
                            className="kv-tag-pick"
                            style={{ background: child.color + '15', color: child.color, cursor: 'pointer', justifyContent: 'flex-start' }}
                            onClick={() => selectNode(child.id)}
                          >
                            <ChevronRight size={11} /> {child.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
})

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}天前`
  return new Date(ts).toLocaleDateString()
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('zh-CN')
}

export default KnowledgeVine
