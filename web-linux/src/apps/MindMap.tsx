import { useState, useEffect, useRef } from 'react'

interface Node {
  id: string
  x: number
  y: number
  text: string
  color: string
}

interface Connection {
  from: string
  to: string
}

const colors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
]

const MindMap = () => {
  const [nodes, setNodes] = useState<Node[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('web-linux-mindmap')
    if (saved) {
      const data = JSON.parse(saved)
      setNodes(data.nodes || [])
      setConnections(data.connections || [])
    } else {
      const initialNodes: Node[] = [
        { id: '1', x: 300, y: 200, text: 'Main Idea', color: colors[4] }
      ]
      setNodes(initialNodes)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('web-linux-mindmap', JSON.stringify({ nodes, connections }))
  }, [nodes, connections])

  const addNode = () => {
    const newNode: Node = {
      id: Date.now().toString(),
      x: 200 + Math.random() * 200,
      y: 150 + Math.random() * 100,
      text: 'New Idea',
      color: colors[Math.floor(Math.random() * colors.length)]
    }
    setNodes(prev => [...prev, newNode])
    setSelectedNode(newNode.id)
  }

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id))
    if (selectedNode === id) setSelectedNode(null)
  }

  const updateNodeText = (id: string, text: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, text } : n))
  }

  const updateNodeColor = (id: string, color: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, color } : n))
  }

  const handleMouseDown = (e: React.MouseEvent, node: Node) => {
    e.stopPropagation()
    setSelectedNode(node.id)
    setDragging(node.id)
    setDragOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left - dragOffset.x
      const y = e.clientY - rect.top - dragOffset.y
      setNodes(prev => prev.map(n => 
        n.id === dragging ? { ...n, x: Math.max(0, x), y: Math.max(0, y) } : n
      ))
    }
  }

  const handleMouseUp = () => {
    setDragging(null)
  }

  const handleCanvasClick = () => {
    setSelectedNode(null)
  }

  const startConnection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setConnecting(id)
  }

  const endConnection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (connecting && connecting !== id) {
      const exists = connections.some(
        c => (c.from === connecting && c.to === id) || 
             (c.from === id && c.to === connecting)
      )
      if (!exists) {
        setConnections(prev => [...prev, { from: connecting, to: id }])
      }
    }
    setConnecting(null)
  }

  const clearMap = () => {
    if (window.confirm('Clear entire mind map?')) {
      setNodes([])
      setConnections([])
      setSelectedNode(null)
    }
  }

  const getNodeCenter = (node: Node) => ({
    x: node.x + 80,
    y: node.y + 30
  })

  const renderConnections = () => {
    return connections.map((conn, i) => {
      const fromNode = nodes.find(n => n.id === conn.from)
      const toNode = nodes.find(n => n.id === conn.to)
      if (!fromNode || !toNode) return null
      
      const from = getNodeCenter(fromNode)
      const to = getNodeCenter(toNode)
      
      return (
        <line
          key={i}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="#64748b"
          strokeWidth="3"
        />
      )
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={addNode}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
          >
            + Add Node
          </button>
          <button 
            onClick={clearMap}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm transition-colors"
          >
            Clear
          </button>
        </div>
        <span className="text-sm text-gray-400">
          {nodes.length} nodes • {connections.length} connections
        </span>
      </div>

      <div 
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-gray-900 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {renderConnections()}
        </svg>

        {nodes.map(node => (
          <div
            key={node.id}
            className={`absolute cursor-grab active:cursor-grabbing select-none transition-shadow ${
              selectedNode === node.id ? 'ring-2 ring-blue-400' : ''
            }`}
            style={{
              left: node.x,
              top: node.y,
              backgroundColor: node.color,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
            onMouseDown={(e) => handleMouseDown(e, node)}
            onMouseUp={(e) => endConnection(e, node.id)}
          >
            <div className="px-4 py-3 min-w-[160px] max-w-[240px] rounded-lg">
              <input
                type="text"
                value={node.text}
                onChange={(e) => updateNodeText(node.id, e.target.value)}
                className="w-full bg-transparent text-white font-medium outline-none placeholder-white/50"
                placeholder="Enter text..."
              />
              <div className="flex gap-1 mt-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); startConnection(e, node.id) }}
                  className="p-1 hover:bg-white/20 rounded text-xs"
                  title="Connect"
                >
                  🔗
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteNode(node.id) }}
                  className="p-1 hover:bg-white/20 rounded text-xs ml-auto"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
            {selectedNode === node.id && (
              <div className="absolute -bottom-10 left-0 right-0 flex justify-center gap-1">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={(e) => { e.stopPropagation(); updateNodeColor(node.id, color) }}
                    className="w-5 h-5 rounded-full border border-white/30"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-4xl mb-2">🧠</p>
              <p>Click "Add Node" to start your mind map</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-gray-700 text-xs text-gray-500 flex items-center gap-4">
        <span>Drag nodes to move</span>
        <span>Click 🔗 then another node to connect</span>
        <span>Click node to select and change color</span>
      </div>
    </div>
  )
}

export default MindMap
