import React from 'react'
import { Copy, Check, Plus } from 'lucide-react'
import type { CollabUser, TabType } from './types'
import { buildStyles } from './styles'

interface SidebarProps {
  isDark: boolean
  connected: boolean
  roomId: string
  joinInput: string
  onJoinInputChange: (v: string) => void
  onJoinRoom: () => void
  onCopyRoomId: () => void
  copied: boolean
  users: CollabUser[]
}

export const Sidebar: React.FC<SidebarProps> = ({
  isDark, connected, roomId, joinInput,
  onJoinInputChange, onJoinRoom, onCopyRoomId, copied, users,
}) => {
  const styles = buildStyles(isDark, '#0f172a', '')

  const tabLabel = (tab?: TabType) => {
    switch (tab) {
      case 'whiteboard': return '🎨 画布'
      case 'code': return '💻 代码'
      case 'notes': return '📝 笔记'
      default: return '空闲'
    }
  }

  return (
    <div style={styles.sidebar}>
      <div style={{ ...styles.glass, ...styles.sideSection }}>
        <div style={styles.sideTitle}>{connected ? '房间信息' : '加入房间'}</div>
        {connected ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 10,
                  background: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
                  fontFamily: 'monospace', fontSize: 16, fontWeight: 700,
                  color: isDark ? '#c7d2fe' : '#4f46e5', textAlign: 'center', letterSpacing: 2,
                }}
              >{roomId}</div>
              <button style={styles.iconBtn} onClick={onCopyRoomId} title="复制房间ID">
                {copied ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
              </button>
            </div>
            <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>
              将此ID分享给好友即可协作
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                style={styles.input}
                placeholder="输入房间ID"
                value={joinInput}
                onChange={e => onJoinInputChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onJoinRoom()}
              />
              <button
                style={{ ...styles.primaryBtn, padding: '8px 12px' }}
                onClick={onJoinRoom}
                disabled={!joinInput.trim()}
              >
                <Plus size={16} />
              </button>
            </div>
            <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>
              或点击右上角创建新房间
            </div>
          </>
        )}
      </div>

      <div style={{ ...styles.glass, ...styles.sideSection, flex: 1 }}>
        <div style={styles.sideTitle}>在线成员 ({users.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {users.map(u => (
            <div key={u.id} style={styles.userChip}>
              <div style={{ ...styles.userAvatar, background: u.color }}>
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{u.name}</div>
                <div style={{ fontSize: 10, color: isDark ? '#64748b' : '#94a3b8' }}>
                  {tabLabel(u.activeTab)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
