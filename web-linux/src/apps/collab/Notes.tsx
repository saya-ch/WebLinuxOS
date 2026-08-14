import React, { useRef } from 'react'
import { FileText, Copy } from 'lucide-react'
import { buildStyles } from './styles'

interface NotesProps {
  isDark: boolean
  notes: string
  onChange: (val: string) => void
  connected: boolean
}

export const Notes: React.FC<NotesProps> = ({ isDark, notes, onChange, connected }) => {
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const styles = buildStyles(isDark, '#0f172a', '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
      <div style={{ ...styles.glass, padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
        <FileText size={18} color="#6366f1" />
        <span style={{ fontSize: 13, fontWeight: 500 }}>协作笔记</span>
        <span style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', marginLeft: 'auto' }}>
          {connected ? '✓ 实时同步' : '离线模式'} · 自动保存
        </span>
        <button
          style={styles.iconBtn}
          onClick={() => navigator.clipboard.writeText(notes)}
          title="复制笔记"
        >
          <Copy size={16} />
        </button>
      </div>
      <textarea
        ref={notesRef}
        style={styles.notesArea}
        value={notes}
        onChange={e => onChange(e.target.value)}
        placeholder="在此记录想法..."
      />
    </div>
  )
}
