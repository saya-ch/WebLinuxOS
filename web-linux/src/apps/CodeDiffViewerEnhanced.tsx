import { memo, useState, useMemo } from 'react'

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed'
  content: string
  lineNumber?: number
  newLineNumber?: number
}

function computeDiff(oldText: string, newText: string): { left: DiffLine[]; right: DiffLine[] } {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')

  const left: DiffLine[] = []
  const right: DiffLine[] = []

  let oldIndex = 0
  let newIndex = 0

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (oldIndex >= oldLines.length) {
      right.push({ type: 'added', content: newLines[newIndex], newLineNumber: newIndex + 1 })
      left.push({ type: 'unchanged', content: '' })
      newIndex++
    } else if (newIndex >= newLines.length) {
      left.push({ type: 'removed', content: oldLines[oldIndex], lineNumber: oldIndex + 1 })
      right.push({ type: 'unchanged', content: '' })
      oldIndex++
    } else if (oldLines[oldIndex] === newLines[newIndex]) {
      left.push({ type: 'unchanged', content: oldLines[oldIndex], lineNumber: oldIndex + 1 })
      right.push({ type: 'unchanged', content: newLines[newIndex], newLineNumber: newIndex + 1 })
      oldIndex++
      newIndex++
    } else {
      const lookaheadOld = oldLines.slice(oldIndex, oldIndex + 3)
      const lookaheadNew = newLines.slice(newIndex, newIndex + 3)

      if (lookaheadNew.includes(oldLines[oldIndex])) {
        right.push({ type: 'added', content: newLines[newIndex], newLineNumber: newIndex + 1 })
        left.push({ type: 'unchanged', content: '' })
        newIndex++
      } else if (lookaheadOld.includes(newLines[newIndex])) {
        left.push({ type: 'removed', content: oldLines[oldIndex], lineNumber: oldIndex + 1 })
        right.push({ type: 'unchanged', content: '' })
        oldIndex++
      } else {
        left.push({ type: 'removed', content: oldLines[oldIndex], lineNumber: oldIndex + 1 })
        right.push({ type: 'added', content: newLines[newIndex], newLineNumber: newIndex + 1 })
        oldIndex++
        newIndex++
      }
    }
  }

  return { left, right }
}

export default memo(function CodeDiffViewer() {
  const [leftText, setLeftText] = useState('')
  const [rightText, setRightText] = useState('')
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split')

  const diff = useMemo(() => {
    return computeDiff(leftText, rightText)
  }, [leftText, rightText])

  const stats = useMemo(() => {
    let added = 0
    let removed = 0
    let unchanged = 0

    diff.right.forEach((line) => {
      if (line.type === 'added') added++
      else if (line.type === 'removed') removed++
      else if (line.type === 'unchanged' && line.content) unchanged++
    })

    return { added, removed, unchanged }
  }, [diff])

  const handleSwap = () => {
    const temp = leftText
    setLeftText(rightText)
    setRightText(temp)
  }

  const handleClear = () => {
    setLeftText('')
    setRightText('')
  }

  const handleSample = () => {
    setLeftText(`function greet(name) {
  const message = "Hello, " + name + "!";
  console.log(message);
  return message;
}

function farewell(name) {
  return "Goodbye, " + name;
}`)

    setRightText(`function greet(name) {
  const message = \`Hello, \${name}!\`;
  console.log(message);
  return message;
}

function farewell(name) {
  return "Take care, " + name;
}

function welcome(name) {
  return "Welcome, " + name;
}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0', background: 'var(--bg-secondary)' }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setViewMode('split')}
            style={{
              padding: '6px 12px',
              background: viewMode === 'split' ? 'var(--accent-color)' : 'var(--bg-secondary)',
              color: viewMode === 'split' ? 'white' : 'var(--text-primary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Split
          </button>
          <button
            onClick={() => setViewMode('unified')}
            style={{
              padding: '6px 12px',
              background: viewMode === 'unified' ? 'var(--accent-color)' : 'var(--bg-secondary)',
              color: viewMode === 'unified' ? 'white' : 'var(--text-primary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Unified
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ color: '#00d084', fontWeight: 'bold' }}>+{stats.added}</span>
            {' / '}
            <span style={{ color: '#ff4757', fontWeight: 'bold' }}>-{stats.removed}</span>
            {' / '}
            <span style={{ color: 'var(--text-secondary)' }}>{stats.unchanged} unchanged</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSample}
            style={{
              padding: '6px 12px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Load Sample
          </button>
          <button
            onClick={handleSwap}
            style={{
              padding: '6px 12px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Swap
          </button>
          <button
            onClick={handleClear}
            style={{
              padding: '6px 12px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {viewMode === 'split' ? (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)' }}>
            <div style={{
              padding: '8px 12px',
              background: 'var(--bg-tertiary)',
              borderBottom: '1px solid var(--border-color)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              fontWeight: '500'
            }}>
              Original
            </div>
            <textarea
              value={leftText}
              onChange={(e) => setLeftText(e.target.value)}
              placeholder="Paste or type original code here..."
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                resize: 'none',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.5',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '8px 12px',
              background: 'var(--bg-tertiary)',
              borderBottom: '1px solid var(--border-color)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              fontWeight: '500'
            }}>
              Modified
            </div>
            <textarea
              value={rightText}
              onChange={(e) => setRightText(e.target.value)}
              placeholder="Paste or type modified code here..."
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                resize: 'none',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: '1.5',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto', padding: '12px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5' }}>
          {diff.right.length === 0 && !leftText && !rightText && (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
              Enter code in both panels to see the diff
            </div>
          )}
          {diff.right.map((line, index) => {
            if (line.type === 'unchanged' && !line.content) return null

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  padding: '2px 8px',
                  background: line.type === 'added' ? 'rgba(0, 208, 132, 0.15)' :
                    line.type === 'removed' ? 'rgba(255, 71, 87, 0.15)' : 'transparent',
                  color: line.type === 'added' ? '#00d084' :
                    line.type === 'removed' ? '#ff4757' : 'var(--text-primary)',
                  borderLeft: line.type === 'added' ? '3px solid #00d084' :
                    line.type === 'removed' ? '3px solid #ff4757' : '3px solid transparent'
                }}
              >
                <span style={{ width: '50px', textAlign: 'right', paddingRight: '12px', color: 'var(--text-secondary)', userSelect: 'none' }}>
                  {line.type === 'removed' ? line.lineNumber : ''}
                </span>
                <span style={{ width: '50px', textAlign: 'right', paddingRight: '12px', color: 'var(--text-secondary)', userSelect: 'none' }}>
                  {line.type === 'added' ? line.newLineNumber : ''}
                </span>
                <span style={{ flex: 1 }}>
                  {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                </span>
                <span style={{ flex: 9, whiteSpace: 'pre' }}>{line.content}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})
