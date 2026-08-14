import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Users, Sparkles, Sun, Moon, X, Palette, Code, FileText } from 'lucide-react'
import type { ToolType, TabType, DrawAction, CollabUser, BCMessage, Point } from './collab/types'
import { USER_COLORS, genId, genRoomId } from './collab/types'
import { buildStyles } from './collab/styles'
import { Whiteboard } from './collab/Whiteboard'
import { CodeEditor } from './collab/CodeEditor'
import { Notes } from './collab/Notes'
import { Sidebar } from './collab/Sidebar'

const CollaborationEnhanced: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [activeTab, setActiveTab] = useState<TabType>('whiteboard')
  const [bgColor, setBgColor] = useState('#0f172a')

  const [tool, setTool] = useState<ToolType>('pen')
  const [color, setColor] = useState('#3b82f6')
  const [brushSize, setBrushSize] = useState(4)
  const [actions, setActions] = useState<DrawAction[]>([])
  const [undoStack, setUndoStack] = useState<DrawAction[]>([])

  const [roomId, setRoomId] = useState('')
  const [connected, setConnected] = useState(false)
  const [joinInput, setJoinInput] = useState('')
  const [users, setUsers] = useState<CollabUser[]>([])
  const [copied, setCopied] = useState(false)
  const [remoteCursors, setRemoteCursors] = useState<Record<string, { x: number; y: number; name: string; color: string }>>({})

  const [userName] = useState(() => `Guest_${genId()}`)
  const [userId] = useState(() => genId())
  const [userColor] = useState(() => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)])

  const [code, setCode] = useState(`// 欢迎使用协作代码编辑器
// 多人实时编辑，跨标签页同步

function greet(name) {
  return \`Hello, \${name}!\`;
}

const users = ['World', 'Collaborators', 'Developers'];
users.forEach(u => console.log(greet(u)));
`)

  const [notes, setNotes] = useState(`# 协作笔记

在此处记录想法、分享灵感。

## 待办事项
- [ ] 完成项目原型
- [ ] 团队讨论
- [ ] 代码审查

## 想法
多人实时协作让创造力无限延伸！
`)

  const bcRef = React.useRef<BroadcastChannel | null>(null)
  const isDark = theme === 'dark'
  const styles = useMemo(() => buildStyles(isDark, bgColor, tool), [isDark, bgColor, tool])

  const broadcast = useCallback((msg: BCMessage) => {
    bcRef.current?.postMessage(msg)
  }, [])

  const undo = useCallback(() => {
    setActions(prev => {
      if (prev.length === 0) return prev
      const next = prev.slice(0, -1)
      const removed = prev[prev.length - 1]
      setUndoStack(s => [...s, removed])
      broadcast({ type: 'undo', userId, userName, roomId, timestamp: Date.now() } as BCMessage)
      return next
    })
  }, [broadcast, userId, userName, roomId])

  const redo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev
      const next = prev.slice(0, -1)
      const restored = prev[prev.length - 1]
      setActions(a => [...a, restored])
      broadcast({
        type: 'redo', userId, userName, roomId,
        payload: { actions: [restored] }, timestamp: Date.now(),
      } as BCMessage)
      return next
    })
  }, [broadcast, userId, userName, roomId])

  const clearCanvas = useCallback(() => {
    setActions([]); setUndoStack([])
    broadcast({ type: 'clear', userId, userName, roomId, timestamp: Date.now() } as BCMessage)
  }, [broadcast, userId, userName, roomId])

  const handleBroadcastDraw = useCallback((action: DrawAction) => {
    if (!connected) return
    broadcast({
      type: 'draw', userId, userName, roomId,
      payload: { action }, timestamp: Date.now(),
    } as BCMessage)
  }, [broadcast, userId, userName, roomId, connected])

  const handleBroadcastCursor = useCallback((pos: Point) => {
    if (!connected) return
    broadcast({
      type: 'cursor', userId, userName, roomId,
      payload: { x: pos.x, y: pos.y, color: userColor }, timestamp: Date.now(),
    } as BCMessage)
  }, [broadcast, userId, userName, roomId, userColor, connected])

  const joinRoom = useCallback((roomName: string) => {
    if (bcRef.current) {
      bcRef.current.close()
    }
    const channel = new BroadcastChannel(`collab-enhanced-${roomName}`)
    bcRef.current = channel
    setRoomId(roomName)
    setConnected(true)

    channel.postMessage({
      type: 'join', userId, userName, roomId: roomName,
      payload: { color: userColor, activeTab }, timestamp: Date.now(),
    } as BCMessage)

    channel.onmessage = (event) => {
      const d = event.data as BCMessage
      if (d.userId === userId) return

      switch (d.type) {
        case 'join': {
          setUsers(prev => {
            if (prev.find(u => u.id === d.userId)) return prev
            return [...prev, {
              id: d.userId, name: d.userName,
              color: d.payload?.color || USER_COLORS[0],
              activeTab: d.payload?.activeTab, joinedAt: d.timestamp,
            }]
          })
          channel.postMessage({
            type: 'sync', userId, userName, roomId: roomName,
            payload: { actions, code, notes, bgColor }, timestamp: Date.now(),
          } as BCMessage)
          break
        }
        case 'leave': {
          setUsers(prev => prev.filter(u => u.id !== d.userId))
          setRemoteCursors(prev => {
            const n = { ...prev }; delete n[d.userId]; return n
          })
          break
        }
        case 'draw': {
          setActions(prev => [...prev, d.payload.action])
          setUndoStack([])
          break
        }
        case 'clear': {
          setActions([]); setUndoStack([])
          break
        }
        case 'undo': {
          setActions(prev => prev.slice(0, -1))
          break
        }
        case 'redo': {
          if (Array.isArray(d.payload?.actions)) {
            setActions(prev => [...prev, ...d.payload.actions])
          }
          break
        }
        case 'sync': {
          if (d.payload?.actions) setActions(d.payload.actions)
          if (typeof d.payload?.code === 'string') setCode(d.payload.code)
          if (typeof d.payload?.notes === 'string') setNotes(d.payload.notes)
          if (typeof d.payload?.bgColor === 'string') setBgColor(d.payload.bgColor)
          break
        }
        case 'code': {
          setCode(d.payload)
          break
        }
        case 'note': {
          setNotes(d.payload)
          break
        }
        case 'cursor': {
          setRemoteCursors(prev => ({
            ...prev,
            [d.userId]: { x: d.payload.x, y: d.payload.y, name: d.userName, color: d.payload.color },
          }))
          break
        }
        case 'request-sync': {
          channel.postMessage({
            type: 'sync', userId, userName, roomId: roomName,
            payload: { actions, code, notes, bgColor }, timestamp: Date.now(),
          } as BCMessage)
          break
        }
      }
    }

    channel.postMessage({
      type: 'request-sync', userId, userName, roomId: roomName, timestamp: Date.now(),
    } as BCMessage)
  }, [userId, userName, userColor, activeTab, actions, code, notes, bgColor])

  const createRoom = () => {
    const id = genRoomId()
    setJoinInput(id)
    joinRoom(id)
  }

  const joinExistingRoom = () => {
    if (joinInput.trim()) joinRoom(joinInput.trim())
  }

  const leaveRoom = () => {
    bcRef.current?.postMessage({
      type: 'leave', userId, userName, roomId, timestamp: Date.now(),
    } as BCMessage)
    bcRef.current?.close()
    bcRef.current = null
    setRoomId(''); setConnected(false); setUsers([])
    setRemoteCursors({})
  }

  const handleCodeChange = (val: string) => {
    setCode(val)
    if (connected) {
      broadcast({ type: 'code', userId, userName, roomId, payload: val, timestamp: Date.now() } as BCMessage)
    }
  }

  const handleNotesChange = (val: string) => {
    setNotes(val)
    if (connected) {
      broadcast({ type: 'note', userId, userName, roomId, payload: val, timestamp: Date.now() } as BCMessage)
    }
  }

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500)
    })
  }

  const userList = useMemo(() => {
    const me: CollabUser = {
      id: userId, name: `${userName} (我)`, color: userColor,
      activeTab, joinedAt: Date.now(),
    }
    return [me, ...users.filter(u => u.id !== userId)]
  }, [userId, userName, userColor, users, activeTab])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, redo])

  useEffect(() => {
    return () => {
      bcRef.current?.close()
    }
  }, [])

  return (
    <div style={styles.app}>
      <div style={{ ...styles.glow, width: 400, height: 400, background: '#6366f1', top: -100, left: -100 }} />
      <div style={{ ...styles.glow, width: 300, height: 300, background: '#8b5cf6', bottom: -50, right: -50 }} />

      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}><Users size={20} /></div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>协作空间</div>
            <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>实时多人协作平台</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          {connected && (
            <div style={{
              ...styles.connectionBadge,
              background: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)',
              color: '#22c55e',
            }}>
              <span style={{ ...styles.dot, background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
              已连接 · {users.length + 1} 人在线
            </div>
          )}
          <button style={styles.iconBtn} onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="切换主题">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {connected ? (
            <button style={styles.btn} onClick={leaveRoom}>
              <X size={16} /> 离开房间
            </button>
          ) : (
            <button style={styles.primaryBtn} onClick={createRoom}>
              <Sparkles size={16} /> 创建房间
            </button>
          )}
        </div>
      </div>

      <div style={styles.body}>
        <Sidebar
          isDark={isDark}
          connected={connected}
          roomId={roomId}
          joinInput={joinInput}
          onJoinInputChange={setJoinInput}
          onJoinRoom={joinExistingRoom}
          onCopyRoomId={copyRoomId}
          copied={copied}
          users={userList}
        />

        <div style={styles.mainArea}>
          <div style={styles.glass}>
            <div style={styles.tabBar}>
              {([
                { id: 'whiteboard', label: '协作白板', icon: Palette },
                { id: 'code', label: '代码编辑', icon: Code },
                { id: 'notes', label: '协作笔记', icon: FileText },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'whiteboard' && (
            <Whiteboard
              isDark={isDark}
              bgColor={bgColor}
              actions={actions}
              undoStack={undoStack}
              tool={tool}
              color={color}
              brushSize={brushSize}
              userId={userId}
              userName={userName}
              remoteCursors={remoteCursors}
              onActionsChange={setActions}
              onUndoStackChange={setUndoStack}
              onToolChange={setTool}
              onColorChange={setColor}
              onBrushSizeChange={setBrushSize}
              onUndo={undo}
              onRedo={redo}
              onClear={clearCanvas}
              onBroadcastDraw={handleBroadcastDraw}
              onBroadcastCursor={handleBroadcastCursor}
              genId={genId}
            />
          )}

          {activeTab === 'code' && (
            <CodeEditor
              isDark={isDark}
              code={code}
              onChange={handleCodeChange}
              connected={connected}
            />
          )}

          {activeTab === 'notes' && (
            <Notes
              isDark={isDark}
              notes={notes}
              onChange={handleNotesChange}
              connected={connected}
            />
          )}
        </div>
      </div>

      <style>{styles.keyframes}</style>
    </div>
  )
}

export default CollaborationEnhanced
