import { useState, useRef, useCallback, useEffect, memo } from 'react'
import {
  Play, Download, Upload, Trash2, Plus, Settings,
  PlayCircle, Square, GitBranch, Database, Globe, Clock, Bell,
  Flag, ChevronRight, X, Copy, FileJson, Zap, Layers
} from 'lucide-react'

type NodeType = 'start' | 'end' | 'condition' | 'data' | 'api' | 'delay' | 'notify'

interface FlowNode {
  id: string
  type: NodeType
  x: number
  y: number
  label: string
  config: Record<string, unknown>
}

interface FlowEdge {
  id: string
  from: string
  to: string
  label?: string
}

interface Workflow {
  id: string
  name: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  createdAt: number
  updatedAt: number
}

const NODE_WIDTH = 180
const NODE_HEIGHT = 70

const NODE_TYPES: { type: NodeType; label: string; icon: typeof Play; color: string; desc: string }[] = [
  { type: 'start', label: '开始', icon: Flag, color: '#10b981', desc: '工作流起点' },
  { type: 'end', label: '结束', icon: Square, color: '#ef4444', desc: '工作流终点' },
  { type: 'condition', label: '条件判断', icon: GitBranch, color: '#f59e0b', desc: '条件分支逻辑' },
  { type: 'data', label: '数据处理', icon: Database, color: '#8b5cf6', desc: '处理和转换数据' },
  { type: 'api', label: 'API调用', icon: Globe, color: '#3b82f6', desc: '发起HTTP请求' },
  { type: 'delay', label: '延时', icon: Clock, color: '#ec4899', desc: '等待一段时间' },
  { type: 'notify', label: '通知', icon: Bell, color: '#06b6d4', desc: '发送通知消息' },
]

const PRESET_TEMPLATES: Workflow[] = [
  {
    id: 'preset-api-pipeline',
    name: 'API数据处理流水线',
    nodes: [
      { id: 'n1', type: 'start', x: 60, y: 200, label: '开始', config: {} },
      { id: 'n2', type: 'api', x: 300, y: 200, label: '获取数据', config: { url: 'https://api.example.com/data', method: 'GET' } },
      { id: 'n3', type: 'data', x: 540, y: 200, label: '数据转换', config: { transform: 'json' } },
      { id: 'n4', type: 'condition', x: 780, y: 200, label: '数据检查', config: { condition: 'success' } },
      { id: 'n5', type: 'notify', x: 1020, y: 100, label: '成功通知', config: { message: '数据处理成功' } },
      { id: 'n6', type: 'notify', x: 1020, y: 300, label: '失败告警', config: { message: '数据处理失败' } },
      { id: 'n7', type: 'end', x: 1260, y: 200, label: '结束', config: {} },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' },
      { id: 'e2', from: 'n2', to: 'n3' },
      { id: 'e3', from: 'n3', to: 'n4' },
      { id: 'e4', from: 'n4', to: 'n5', label: '是' },
      { id: 'e5', from: 'n4', to: 'n6', label: '否' },
      { id: 'e6', from: 'n5', to: 'n7' },
      { id: 'e7', from: 'n6', to: 'n7' },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'preset-delayed-notify',
    name: '延时通知工作流',
    nodes: [
      { id: 'n1', type: 'start', x: 60, y: 200, label: '开始', config: {} },
      { id: 'n2', type: 'delay', x: 300, y: 200, label: '等待', config: { duration: 5, unit: 'seconds' } },
      { id: 'n3', type: 'notify', x: 540, y: 200, label: '发送提醒', config: { message: '时间到了！' } },
      { id: 'n4', type: 'end', x: 780, y: 200, label: '结束', config: {} },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' },
      { id: 'e2', from: 'n2', to: 'n3' },
      { id: 'e3', from: 'n3', to: 'n4' },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

const STORAGE_KEY = 'flowboard_workflows'
const ACTIVE_KEY = 'flowboard_active'

function generateId(): string {
  return 'id_' + Math.random().toString(36).slice(2, 10)
}

function getNodeIcon(type: NodeType) {
  const found = NODE_TYPES.find(n => n.type === type)
  return found ? found.icon : PlayCircle
}

function getNodeColor(type: NodeType): string {
  const found = NODE_TYPES.find(n => n.type === type)
  return found ? found.color : '#6b7280'
}

function loadWorkflows(): Workflow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveWorkflows(wfs: Workflow[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wfs))
}

function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

function saveActiveId(id: string | null): void {
  if (id) localStorage.setItem(ACTIVE_KEY, id)
  else localStorage.removeItem(ACTIVE_KEY)
}

function createEmptyWorkflow(): Workflow {
  return {
    id: generateId(),
    name: '未命名工作流',
    nodes: [
      { id: generateId(), type: 'start', x: 80, y: 240, label: '开始', config: {} },
      { id: generateId(), type: 'end', x: 480, y: 240, label: '结束', config: {} },
    ],
    edges: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export default memo(function FlowBoard() {
  const [workflows, setWorkflows] = useState<Workflow[]>(() => loadWorkflows())
  const [activeId, setActiveId] = useState<string | null>(() => loadActiveId())
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [connecting, setConnecting] = useState<{ from: string; startX: number; startY: number; mouseX: number; mouseY: number } | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [executingNodeId, setExecutingNodeId] = useState<string | null>(null)
  const [executedEdges, setExecutedEdges] = useState<Set<string>>(new Set())
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeWorkflow = workflows.find(w => w.id === activeId) || null
  const selectedNode = activeWorkflow?.nodes.find(n => n.id === selectedNodeId) || null

  useEffect(() => {
    saveWorkflows(workflows)
  }, [workflows])

  useEffect(() => {
    saveActiveId(activeId)
  }, [activeId])

  const updateActiveWorkflow = useCallback((updater: (wf: Workflow) => Workflow) => {
    setWorkflows(prev => prev.map(w => w.id === activeId ? { ...updater(w), updatedAt: Date.now() } : w))
  }, [activeId])

  const createNewWorkflow = useCallback(() => {
    const wf = createEmptyWorkflow()
    setWorkflows(prev => [wf, ...prev])
    setActiveId(wf.id)
    setSelectedNodeId(null)
  }, [])

  const deleteWorkflow = useCallback((id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id))
    if (activeId === id) {
      const remaining = workflows.filter(w => w.id !== id)
      setActiveId(remaining.length > 0 ? remaining[0].id : null)
    }
    setSelectedNodeId(null)
  }, [activeId, workflows])

  const duplicateWorkflow = useCallback((id: string) => {
    const wf = workflows.find(w => w.id === id)
    if (!wf) return
    const newWf: Workflow = {
      ...wf,
      id: generateId(),
      name: wf.name + ' 副本',
      nodes: wf.nodes.map(n => ({ ...n, id: generateId(), x: n.x + 30, y: n.y + 30 })),
      edges: wf.edges.map(e => {
        const fromNode = wf.nodes.find(n => n.id === e.from)
        const toNode = wf.nodes.find(n => n.id === e.to)
        const newFrom = fromNode ? generateId() : e.from
        const newTo = toNode ? generateId() : e.to
        return { ...e, id: generateId(), from: newFrom, to: newTo }
      }),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const oldIds = wf.nodes.map(n => n.id)
    const newNodes = wf.nodes.map((_n, i) => ({ ...newWf.nodes[i] }))
    const remap: Record<string, string> = {}
    oldIds.forEach((id, i) => { remap[id] = newNodes[i].id })
    newWf.edges = wf.edges.map(e => ({ ...e, id: generateId(), from: remap[e.from] || e.from, to: remap[e.to] || e.to }))
    newWf.nodes = newNodes
    setWorkflows(prev => [newWf, ...prev])
    setActiveId(newWf.id)
  }, [workflows])

  const applyTemplate = useCallback((template: Workflow) => {
    const wf: Workflow = {
      ...template,
      id: generateId(),
      name: template.name,
      nodes: template.nodes.map(n => ({ ...n, id: generateId() })),
      edges: template.edges.map(e => {
        const fromNode = template.nodes.find(n => n.id === e.from)
        const toNode = template.nodes.find(n => n.id === e.to)
        return { ...e, id: generateId(), from: fromNode ? generateId() : e.from, to: toNode ? generateId() : e.to }
      }),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const oldIds = template.nodes.map(n => n.id)
    const newNodes = template.nodes.map((_n, i) => ({ ...wf.nodes[i] }))
    const remap: Record<string, string> = {}
    oldIds.forEach((id, i) => { remap[id] = newNodes[i].id })
    wf.edges = template.edges.map(e => ({ ...e, id: generateId(), from: remap[e.from] || e.from, to: remap[e.to] || e.to }))
    wf.nodes = newNodes
    setWorkflows(prev => [wf, ...prev])
    setActiveId(wf.id)
    setSelectedNodeId(null)
    setShowTemplates(false)
  }, [])

  const addNode = useCallback((type: NodeType, x: number, y: number) => {
    const nodeType = NODE_TYPES.find(n => n.type === type)
    if (!nodeType) return
    const newNode: FlowNode = {
      id: generateId(),
      type,
      x: x - panOffset.x - NODE_WIDTH / 2,
      y: y - panOffset.y - NODE_HEIGHT / 2,
      label: nodeType.label,
      config: getDefaultConfig(type),
    }
    updateActiveWorkflow(wf => ({ ...wf, nodes: [...wf.nodes, newNode] }))
    setSelectedNodeId(newNode.id)
  }, [panOffset, updateActiveWorkflow])

  const getDefaultConfig = (type: NodeType): Record<string, unknown> => {
    switch (type) {
      case 'condition': return { condition: 'value > 0', trueLabel: '是', falseLabel: '否' }
      case 'data': return { operation: 'transform', format: 'json' }
      case 'api': return { url: 'https://api.example.com', method: 'GET', headers: '' }
      case 'delay': return { duration: 3, unit: 'seconds' }
      case 'notify': return { message: '任务完成', level: 'info' }
      default: return {}
    }
  }

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('flow-canvas-bg')) {
      if (e.button === 0) {
        setIsPanning(true)
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
      }
      setSelectedNodeId(null)
    }
  }, [panOffset])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
      return
    }
    if (draggingNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left - panOffset.x - dragOffset.x
      const y = e.clientY - rect.top - panOffset.y - dragOffset.y
      updateActiveWorkflow(wf => ({
        ...wf,
        nodes: wf.nodes.map(n => n.id === draggingNode ? { ...n, x, y } : n),
      }))
    }
    if (connecting) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        setConnecting(prev => prev ? {
          ...prev,
          mouseX: e.clientX - rect.left - panOffset.x,
          mouseY: e.clientY - rect.top - panOffset.y,
        } : null)
      }
    }
  }, [isPanning, panStart, draggingNode, dragOffset, panOffset, connecting, updateActiveWorkflow])

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
    setDraggingNode(null)
    setConnecting(null)
  }, [])

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    const node = activeWorkflow?.nodes.find(n => n.id === nodeId)
    if (!node) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    setDragOffset({
      x: e.clientX - rect.left - panOffset.x - node.x,
      y: e.clientY - rect.top - panOffset.y - node.y,
    })
    setDraggingNode(nodeId)
    setSelectedNodeId(nodeId)
  }, [activeWorkflow, panOffset])

  const handleConnectorMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    const node = activeWorkflow?.nodes.find(n => n.id === nodeId)
    if (!node || !canvasRef.current) return
    const startX = node.x + NODE_WIDTH
    const startY = node.y + NODE_HEIGHT / 2
    const rect = canvasRef.current.getBoundingClientRect()
    setConnecting({
      from: nodeId,
      startX,
      startY,
      mouseX: e.clientX - rect.left - panOffset.x,
      mouseY: e.clientY - rect.top - panOffset.y,
    })
  }, [activeWorkflow, panOffset])

  const handleConnectorMouseUp = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    if (connecting && connecting.from !== nodeId) {
      const edgeExists = activeWorkflow?.edges.some(ed => ed.from === connecting.from && ed.to === nodeId)
      if (!edgeExists) {
        const newEdge: FlowEdge = {
          id: generateId(),
          from: connecting.from,
          to: nodeId,
        }
        updateActiveWorkflow(wf => ({ ...wf, edges: [...wf.edges, newEdge] }))
      }
    }
    setConnecting(null)
  }, [connecting, activeWorkflow, updateActiveWorkflow])

  const deleteNode = useCallback((nodeId: string) => {
    updateActiveWorkflow(wf => ({
      ...wf,
      nodes: wf.nodes.filter(n => n.id !== nodeId),
      edges: wf.edges.filter(e => e.from !== nodeId && e.to !== nodeId),
    }))
    if (selectedNodeId === nodeId) setSelectedNodeId(null)
  }, [selectedNodeId, updateActiveWorkflow])

  const updateNodeConfig = useCallback((nodeId: string, key: string, value: unknown) => {
    updateActiveWorkflow(wf => ({
      ...wf,
      nodes: wf.nodes.map(n => n.id === nodeId ? { ...n, config: { ...n.config, [key]: value } } : n),
    }))
  }, [updateActiveWorkflow])

  const updateNodeLabel = useCallback((nodeId: string, label: string) => {
    updateActiveWorkflow(wf => ({
      ...wf,
      nodes: wf.nodes.map(n => n.id === nodeId ? { ...n, label } : n),
    }))
  }, [updateActiveWorkflow])

  const runSimulation = useCallback(async () => {
    if (!activeWorkflow || isRunning) return
    const startNode = activeWorkflow.nodes.find(n => n.type === 'start')
    if (!startNode) return

    setIsRunning(true)
    setExecutedEdges(new Set())
    setExecutingNodeId(null)

    const visited = new Set<string>()
    const queue: string[] = [startNode.id]

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    while (queue.length > 0) {
      const nodeId = queue.shift()!
      if (visited.has(nodeId)) continue
      visited.add(nodeId)

      const node = activeWorkflow.nodes.find(n => n.id === nodeId)
      if (!node) continue

      setExecutingNodeId(nodeId)
      
      let waitTime = 800
      if (node.type === 'delay') {
        const dur = Number(node.config.duration) || 3
        const unit = node.config.unit as string
        waitTime = unit === 'seconds' ? dur * 200 : dur * 20
      }
      await delay(waitTime)

      const outEdges = activeWorkflow.edges.filter(e => e.from === nodeId)
      
      if (node.type === 'condition' && outEdges.length >= 2) {
        const firstEdge = outEdges[0]
        setExecutedEdges(prev => new Set([...prev, firstEdge.id]))
        queue.push(firstEdge.to)
      } else {
        for (const edge of outEdges) {
          setExecutedEdges(prev => new Set([...prev, edge.id]))
          queue.push(edge.to)
        }
      }

      if (node.type === 'end') break
    }

    await delay(500)
    setExecutingNodeId(null)
    setIsRunning(false)
  }, [activeWorkflow, isRunning])

  const stopSimulation = useCallback(() => {
    setIsRunning(false)
    setExecutingNodeId(null)
    setExecutedEdges(new Set())
  }, [])

  const exportWorkflow = useCallback(() => {
    if (!activeWorkflow) return
    const dataStr = JSON.stringify(activeWorkflow, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeWorkflow.name}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [activeWorkflow])

  const importWorkflow = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wf = JSON.parse(e.target?.result as string) as Workflow
        wf.id = generateId()
        wf.createdAt = Date.now()
        wf.updatedAt = Date.now()
        setWorkflows(prev => [wf, ...prev])
        setActiveId(wf.id)
        setSelectedNodeId(null)
      } catch {
        alert('导入失败：文件格式不正确')
      }
    }
    reader.readAsText(file)
  }, [])

  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) importWorkflow(file)
    e.target.value = ''
  }, [importWorkflow])

  const getEdgePath = (fromNode: FlowNode, toNode: FlowNode): string => {
    const x1 = fromNode.x + NODE_WIDTH
    const y1 = fromNode.y + NODE_HEIGHT / 2
    const x2 = toNode.x
    const y2 = toNode.y + NODE_HEIGHT / 2
    const dx = Math.abs(x2 - x1)
    const controlOffset = Math.max(50, dx * 0.5)
    return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`
  }

  const NodeIcon = selectedNode ? getNodeIcon(selectedNode.type) : PlayCircle

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>
            <Layers size={22} style={{ color: '#8b5cf6' }} />
            <span style={styles.logoText}>FlowBoard</span>
          </div>
          {activeWorkflow && (
            <input
              style={styles.workflowName}
              value={activeWorkflow.name}
              onChange={(e) => updateActiveWorkflow(wf => ({ ...wf, name: e.target.value }))}
            />
          )}
        </div>
        <div style={styles.headerActions}>
          <button style={styles.iconBtn} onClick={() => setShowTemplates(!showTemplates)} title="模板">
            <FileJson size={18} />
          </button>
          <button style={styles.iconBtn} onClick={() => fileInputRef.current?.click()} title="导入">
            <Upload size={18} />
          </button>
          <button style={styles.iconBtn} onClick={exportWorkflow} title="导出JSON" disabled={!activeWorkflow}>
            <Download size={18} />
          </button>
          <button style={styles.iconBtn} onClick={createNewWorkflow} title="新建">
            <Plus size={18} />
          </button>
          <div style={styles.divider} />
          {isRunning ? (
            <button style={{ ...styles.runBtn, background: 'linear-gradient(135deg, #ef4444, #dc2626)' }} onClick={stopSimulation}>
              <Square size={16} /> 停止
            </button>
          ) : (
            <button style={styles.runBtn} onClick={runSimulation} disabled={!activeWorkflow}>
              <Play size={16} /> 模拟执行
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileImport}
        />
      </div>

      <div style={styles.body}>
        <div style={{ ...styles.sidebar, width: showSidebar ? 220 : 0, overflow: showSidebar ? 'visible' : 'hidden' }}>
          {showSidebar && (
            <>
              <div style={styles.sidebarSection}>
                <div style={styles.sidebarTitle}>工作流列表</div>
                <button style={styles.newWfBtn} onClick={createNewWorkflow}>
                  <Plus size={16} /> 新建工作流
                </button>
                <div style={styles.wfList}>
                  {workflows.map(wf => (
                    <div
                      key={wf.id}
                      style={{
                        ...styles.wfItem,
                        background: wf.id === activeId ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                        borderColor: wf.id === activeId ? 'rgba(139, 92, 246, 0.5)' : 'transparent',
                      }}
                      onClick={() => { setActiveId(wf.id); setSelectedNodeId(null) }}
                    >
                      <Zap size={14} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                      <span style={styles.wfItemName}>{wf.name}</span>
                      <div style={styles.wfItemActions}>
                        <button style={styles.miniBtn} onClick={(e) => { e.stopPropagation(); duplicateWorkflow(wf.id) }} title="复制">
                          <Copy size={12} />
                        </button>
                        <button style={styles.miniBtn} onClick={(e) => { e.stopPropagation(); deleteWorkflow(wf.id) }} title="删除">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.sidebarSection}>
                <div style={styles.sidebarTitle}>节点类型</div>
                <div style={styles.nodePalette}>
                  {NODE_TYPES.map(nt => {
                    const Icon = nt.icon
                    return (
                      <div
                        key={nt.type}
                        style={styles.paletteItem}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('nodeType', nt.type)
                          e.dataTransfer.effectAllowed = 'copy'
                        }}
                      >
                        <div style={{ ...styles.paletteIcon, background: nt.color + '20', color: nt.color }}>
                          <Icon size={18} />
                        </div>
                        <div style={styles.paletteLabel}>{nt.label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          style={{ ...styles.toggleSidebar, left: showSidebar ? 220 : 0 }}
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <ChevronRight size={16} style={{ transform: showSidebar ? 'rotate(180deg)' : 'none' }} />
        </button>

        <div
          ref={canvasRef}
          className="flow-canvas-bg"
          style={styles.canvas}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
          onDrop={(e) => {
            e.preventDefault()
            const nodeType = e.dataTransfer.getData('nodeType') as NodeType
            if (nodeType && canvasRef.current) {
              const rect = canvasRef.current.getBoundingClientRect()
              addNode(nodeType, e.clientX - rect.left, e.clientY - rect.top)
            }
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0, top: 0,
              transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            <svg
              style={{ position: 'absolute', left: 0, top: 0, width: '3000px', height: '2000px', pointerEvents: 'none' }}
            >
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                </marker>
                <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                </marker>
              </defs>
              {activeWorkflow?.edges.map(edge => {
                const fromNode = activeWorkflow.nodes.find(n => n.id === edge.from)
                const toNode = activeWorkflow.nodes.find(n => n.id === edge.to)
                if (!fromNode || !toNode) return null
                const path = getEdgePath(fromNode, toNode)
                const isActive = executedEdges.has(edge.id)
                const midX = (fromNode.x + NODE_WIDTH + toNode.x) / 2
                const midY = (fromNode.y + NODE_HEIGHT / 2 + toNode.y + NODE_HEIGHT / 2) / 2
                return (
                  <g key={edge.id}>
                    <path
                      d={path}
                      fill="none"
                      stroke={isActive ? '#10b981' : '#6b7280'}
                      strokeWidth={isActive ? 3 : 2}
                      markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                      style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                    />
                    {edge.label && (
                      <g>
                        <rect x={midX - 20} y={midY - 12} width={40} height={20} rx={4} fill="rgba(255,255,255,0.9)" stroke="#d1d5db" />
                        <text x={midX} y={midY + 2} textAnchor="middle" fontSize={11} fill="#6b7280">{edge.label}</text>
                      </g>
                    )}
                  </g>
                )
              })}
              {connecting && (
                <path
                  d={`M ${connecting.startX} ${connecting.startY} C ${connecting.startX + 80} ${connecting.startY}, ${connecting.mouseX - 80} ${connecting.mouseY}, ${connecting.mouseX} ${connecting.mouseY}`}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
              )}
            </svg>
          </div>

          <div style={{
            position: 'absolute',
            left: 0, top: 0,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}>
            {activeWorkflow?.nodes.map(node => {
              const NodeIcon = getNodeIcon(node.type)
              const color = getNodeColor(node.type)
              const isSelected = selectedNodeId === node.id
              const isExecuting = executingNodeId === node.id
              return (
                <div
                  key={node.id}
                  style={{
                    ...styles.node,
                    left: node.x,
                    top: node.y,
                    borderColor: isSelected ? color : 'rgba(255,255,255,0.2)',
                    boxShadow: isExecuting ? `0 0 20px ${color}80, 0 0 40px ${color}40` : isSelected ? `0 4px 20px ${color}40` : '0 2px 8px rgba(0,0,0,0.15)',
                    transform: isExecuting ? 'scale(1.05)' : 'scale(1)',
                    pointerEvents: 'auto',
                  }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onMouseUp={(e) => handleConnectorMouseUp(e, node.id)}
                >
                  <div style={{ ...styles.nodeAccent, background: color }} />
                  <div style={styles.nodeContent}>
                    <div style={{ ...styles.nodeIcon, background: color + '20', color }}>
                      <NodeIcon size={18} />
                    </div>
                    <div style={styles.nodeLabel}>{node.label}</div>
                  </div>
                  {node.type !== 'end' && (
                    <div
                      style={{ ...styles.connector, right: -8, background: color }}
                      onMouseDown={(e) => handleConnectorMouseDown(e, node.id)}
                    />
                  )}
                  {node.type !== 'start' && (
                    <div style={{ ...styles.connector, left: -8, background: '#6b7280' }} />
                  )}
                  {isExecuting && (
                    <div style={styles.executingPulse}>
                      <div style={{ ...styles.pulseRing, borderColor: color }} />
                      <div style={{ ...styles.pulseRing, borderColor: color, animationDelay: '0.5s' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {!activeWorkflow && (
            <div style={styles.emptyState}>
              <Layers size={48} style={{ color: '#6b7280', marginBottom: 16 }} />
              <div style={styles.emptyTitle}>还没有工作流</div>
              <div style={styles.emptyDesc}>点击"新建工作流"创建你的第一个工作流，或从模板开始</div>
              <button style={styles.runBtn} onClick={createNewWorkflow}>
                <Plus size={16} /> 新建工作流
              </button>
            </div>
          )}
        </div>

        {selectedNode && (
          <div style={styles.propertiesPanel}>
            <div style={styles.panelHeader}>
              <div style={styles.panelTitle}>
                <Settings size={16} /> 节点属性
              </div>
              <button style={styles.closeBtn} onClick={() => setSelectedNodeId(null)}>
                <X size={16} />
              </button>
            </div>
            <div style={styles.panelBody}>
              <div style={styles.propGroup}>
                <label style={styles.propLabel}>节点名称</label>
                <input
                  style={styles.propInput}
                  value={selectedNode.label}
                  onChange={(e) => updateNodeLabel(selectedNode.id, e.target.value)}
                />
              </div>
              <div style={styles.propGroup}>
                <label style={styles.propLabel}>类型</label>
                <div style={{ ...styles.propBadge, background: getNodeColor(selectedNode.type) + '20', color: getNodeColor(selectedNode.type) }}>
                  <NodeIcon size={14} />
                  {NODE_TYPES.find(n => n.type === selectedNode.type)?.label}
                </div>
              </div>

              {selectedNode.type === 'condition' && (
                <>
                  <div style={styles.propGroup}>
                    <label style={styles.propLabel}>条件表达式</label>
                    <textarea
                      style={styles.propTextarea}
                      value={String(selectedNode.config.condition || '')}
                      onChange={(e) => updateNodeConfig(selectedNode.id, 'condition', e.target.value)}
                    />
                  </div>
                  <div style={styles.propGroup}>
                    <label style={styles.propLabel}>真分支标签</label>
                    <input
                      style={styles.propInput}
                      value={String(selectedNode.config.trueLabel || '是')}
                      onChange={(e) => updateNodeConfig(selectedNode.id, 'trueLabel', e.target.value)}
                    />
                  </div>
                  <div style={styles.propGroup}>
                    <label style={styles.propLabel}>假分支标签</label>
                    <input
                      style={styles.propInput}
                      value={String(selectedNode.config.falseLabel || '否')}
                      onChange={(e) => updateNodeConfig(selectedNode.id, 'falseLabel', e.target.value)}
                    />
                  </div>
                </>
              )}

              {selectedNode.type === 'api' && (
                <>
                  <div style={styles.propGroup}>
                    <label style={styles.propLabel}>URL</label>
                    <input
                      style={styles.propInput}
                      value={String(selectedNode.config.url || '')}
                      onChange={(e) => updateNodeConfig(selectedNode.id, 'url', e.target.value)}
                      placeholder="https://api.example.com"
                    />
                  </div>
                  <div style={styles.propGroup}>
                    <label style={styles.propLabel}>方法</label>
                    <select
                      style={styles.propSelect}
                      value={String(selectedNode.config.method || 'GET')}
                      onChange={(e) => updateNodeConfig(selectedNode.id, 'method', e.target.value)}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                </>
              )}

              {selectedNode.type === 'data' && (
                <>
                  <div style={styles.propGroup}>
                    <label style={styles.propLabel}>操作类型</label>
                    <select
                      style={styles.propSelect}
                      value={String(selectedNode.config.operation || 'transform')}
                      onChange={(e) => updateNodeConfig(selectedNode.id, 'operation', e.target.value)}
                    >
                      <option value="transform">数据转换</option>
                      <option value="filter">数据过滤</option>
                      <option value="aggregate">数据聚合</option>
                      <option value="sort">数据排序</option>
                    </select>
                  </div>
                  <div style={styles.propGroup}>
                    <label style={styles.propLabel}>格式</label>
                    <select
                      style={styles.propSelect}
                      value={String(selectedNode.config.format || 'json')}
                      onChange={(e) => updateNodeConfig(selectedNode.id, 'format', e.target.value)}
                    >
                      <option value="json">JSON</option>
                      <option value="xml">XML</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>
                </>
              )}

              {selectedNode.type === 'delay' && (
                <>
                  <div style={styles.propGroup}>
                    <label style={styles.propLabel}>时长</label>
                    <input
                      type="number"
                      style={styles.propInput}
                      value={Number(selectedNode.config.duration) || 3}
                      onChange={(e) => updateNodeConfig(selectedNode.id, 'duration', Number(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div style={styles.propGroup}>
                    <label style={styles.propLabel}>单位</label>
                    <select
                      style={styles.propSelect}
                      value={String(selectedNode.config.unit || 'seconds')}
                      onChange={(e) => updateNodeConfig(selectedNode.id, 'unit', e.target.value)}
                    >
                      <option value="milliseconds">毫秒</option>
                      <option value="seconds">秒</option>
                      <option value="minutes">分钟</option>
                    </select>
                  </div>
                </>
              )}

              {selectedNode.type === 'notify' && (
                <>
                  <div style={styles.propGroup}>
                    <label style={styles.propLabel}>通知内容</label>
                    <textarea
                      style={styles.propTextarea}
                      value={String(selectedNode.config.message || '')}
                      onChange={(e) => updateNodeConfig(selectedNode.id, 'message', e.target.value)}
                    />
                  </div>
                  <div style={styles.propGroup}>
                    <label style={styles.propLabel}>级别</label>
                    <select
                      style={styles.propSelect}
                      value={String(selectedNode.config.level || 'info')}
                      onChange={(e) => updateNodeConfig(selectedNode.id, 'level', e.target.value)}
                    >
                      <option value="info">信息</option>
                      <option value="success">成功</option>
                      <option value="warning">警告</option>
                      <option value="error">错误</option>
                    </select>
                  </div>
                </>
              )}

              <div style={styles.propGroup}>
                <button
                  style={{ ...styles.deleteBtn, marginTop: 12 }}
                  onClick={() => deleteNode(selectedNode.id)}
                  disabled={selectedNode.type === 'start' || selectedNode.type === 'end'}
                >
                  <Trash2 size={14} /> 删除节点
                </button>
                {(selectedNode.type === 'start' || selectedNode.type === 'end') && (
                  <span style={styles.hintText}>开始和结束节点不可删除</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showTemplates && (
        <div style={styles.modalOverlay} onClick={() => setShowTemplates(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>选择模板</span>
              <button style={styles.closeBtn} onClick={() => setShowTemplates(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={styles.modalBody}>
              {PRESET_TEMPLATES.map(template => (
                <div key={template.id} style={styles.templateCard} onClick={() => applyTemplate(template)}>
                  <div style={styles.templateIcon}>
                    <Zap size={24} style={{ color: '#8b5cf6' }} />
                  </div>
                  <div style={styles.templateName}>{template.name}</div>
                  <div style={styles.templateDesc}>{template.nodes.length} 个节点 · {template.edges.length} 条连接</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  )
})

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(49, 46, 129, 0.9))',
    backdropFilter: 'blur(20px)',
    color: '#f1f5f9',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    gap: 16,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  workflowName: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '6px 12px',
    color: '#f1f5f9',
    fontSize: 14,
    outline: 'none',
    minWidth: 200,
    transition: 'border-color 0.2s',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  divider: {
    width: 1,
    height: 24,
    background: 'rgba(255,255,255,0.15)',
    margin: '0 4px',
  },
  runBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  body: {
    flex: 1,
    display: 'flex',
    position: 'relative',
    overflow: 'hidden',
  },
  sidebar: {
    background: 'rgba(0,0,0,0.2)',
    borderRight: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    flexShrink: 0,
  },
  sidebarSection: {
    padding: 16,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  sidebarTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  newWfBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px dashed rgba(139, 92, 246, 0.5)',
    background: 'rgba(139, 92, 246, 0.1)',
    color: '#a78bfa',
    fontSize: 13,
    cursor: 'pointer',
    marginBottom: 12,
    transition: 'all 0.2s',
  },
  wfList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxHeight: 180,
    overflowY: 'auto',
  },
  wfItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    border: '1px solid',
    transition: 'all 0.15s',
    fontSize: 13,
  },
  wfItemName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 12,
  },
  wfItemActions: {
    display: 'flex',
    gap: 4,
    opacity: 0,
    transition: 'opacity 0.15s',
  },
  miniBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    background: 'rgba(255,255,255,0.08)',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodePalette: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  paletteItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'grab',
    transition: 'all 0.2s',
  },
  paletteIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  paletteLabel: {
    fontSize: 13,
    color: '#e2e8f0',
    fontWeight: 500,
  },
  toggleSidebar: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 20,
    height: 40,
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderLeft: 'none',
    borderRadius: '0 6px 6px 0',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    transition: 'left 0.3s ease',
  },
  canvas: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundImage: `
      radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)
    `,
    backgroundSize: '20px 20px',
    cursor: 'grab',
  },
  node: {
    position: 'absolute',
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    background: 'rgba(30, 41, 59, 0.95)',
    border: '2px solid',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    cursor: 'move',
    userSelect: 'none',
    transition: 'box-shadow 0.3s, transform 0.2s',
    overflow: 'hidden',
  },
  nodeAccent: {
    width: 4,
    height: '100%',
    flexShrink: 0,
  },
  nodeContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 14px',
  },
  nodeIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nodeLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#f1f5f9',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  connector: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 14,
    height: 14,
    borderRadius: '50%',
    border: '2px solid #1e293b',
    cursor: 'crosshair',
    zIndex: 5,
    transition: 'transform 0.15s',
  },
  executingPulse: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  pulseRing: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 60,
    height: 60,
    marginLeft: -30,
    marginTop: -30,
    border: '3px solid',
    borderRadius: '50%',
    animation: 'pulse-ring 1s ease-out infinite',
  },
  propertiesPanel: {
    width: 280,
    background: 'rgba(15, 23, 42, 0.95)',
    borderLeft: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelBody: {
    flex: 1,
    padding: 16,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  propGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  propLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 500,
  },
  propInput: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: '8px 10px',
    color: '#f1f5f9',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  propTextarea: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: '8px 10px',
    color: '#f1f5f9',
    fontSize: 13,
    outline: 'none',
    resize: 'vertical',
    minHeight: 60,
    fontFamily: 'inherit',
  },
  propSelect: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: '8px 10px',
    color: '#f1f5f9',
    fontSize: 13,
    outline: 'none',
    cursor: 'pointer',
  },
  propBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    width: 'fit-content',
  },
  deleteBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '10px',
    borderRadius: 8,
    border: '1px solid rgba(239, 68, 68, 0.3)',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  hintText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  emptyState: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#e2e8f0',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 16,
    maxWidth: 300,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    width: 500,
    maxWidth: '90%',
    background: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 600,
  },
  modalBody: {
    padding: 20,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  templateCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: 'rgba(139, 92, 246, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
  },
  templateName: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 4,
  },
  templateDesc: {
    fontSize: 12,
    color: '#94a3b8',
  },
}
