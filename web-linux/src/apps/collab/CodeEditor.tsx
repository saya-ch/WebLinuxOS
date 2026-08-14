import React, { useRef } from 'react'
import { Code, Copy } from 'lucide-react'
import { buildStyles } from './styles'

interface CodeEditorProps {
  isDark: boolean
  code: string
  onChange: (val: string) => void
  connected: boolean
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ isDark, code, onChange, connected }) => {
  const codeRef = useRef<HTMLTextAreaElement>(null)
  const styles = buildStyles(isDark, '#0f172a', '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
      <div style={{ ...styles.glass, padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
        <Code size={18} color="#6366f1" />
        <span style={{ fontSize: 13, fontWeight: 500 }}>协作代码编辑器</span>
        <span style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', marginLeft: 'auto' }}>
          {connected ? '✓ 已同步' : '离线模式'}
        </span>
        <button
          style={styles.iconBtn}
          onClick={() => navigator.clipboard.writeText(code)}
          title="复制代码"
        >
          <Copy size={16} />
        </button>
      </div>
      <textarea
        ref={codeRef}
        style={styles.codeArea}
        value={code}
        onChange={e => onChange(e.target.value)}
        spellCheck={false}
        placeholder="在此编写代码..."
      />
    </div>
  )
}
