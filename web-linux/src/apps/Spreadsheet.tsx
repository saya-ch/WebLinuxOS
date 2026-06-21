import { useState, useCallback } from 'react'

interface CellData {
  value: string
  bold: boolean
  italic: boolean
  align: 'left' | 'center' | 'right'
  bgColor: string
}

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
const ROWS = 10
const COLS = 10

function evaluateFormula(formula: string, cells: Record<string, CellData>): string {
  const getValue = (key: string): number => {
    const cell = cells[key]
    if (!cell) return NaN
    if (cell.value.startsWith('=')) {
      const result = evaluateFormula(cell.value, cells)
      const n = parseFloat(result)
      return isNaN(n) ? NaN : n
    }
    const n = parseFloat(cell.value)
    return isNaN(n) ? NaN : n
  }

  const upper = formula.toUpperCase().trim()

  if (upper.startsWith('=SUM(')) {
    const range = upper.slice(5, -1)
    const result = parseRange(range, getValue)
    return result.reduce((a, b) => a + b, 0).toString()
  }
  if (upper.startsWith('=AVG(')) {
    const range = upper.slice(5, -1)
    const result = parseRange(range, getValue)
    return result.length > 0 ? (result.reduce((a, b) => a + b, 0) / result.length).toFixed(2) : '0'
  }
  if (upper.startsWith('=MAX(')) {
    const range = upper.slice(5, -1)
    const result = parseRange(range, getValue)
    return result.length > 0 ? Math.max(...result).toString() : '0'
  }
  if (upper.startsWith('=MIN(')) {
    const range = upper.slice(5, -1)
    const result = parseRange(range, getValue)
    return result.length > 0 ? Math.min(...result).toString() : '0'
  }
  if (upper.startsWith('=') && upper.length > 1) {
    const ref = upper.slice(1)
    // 优先匹配：单元格引用 + 简单算术运算（例如 =A1+B1、=100*5）
    if (/^[A-J]\d+$/.test(ref) && cells[ref]) {
      const v = parseFloat(cells[ref].value)
      return isNaN(v) ? cells[ref].value : v.toString()
    }
    // 安全计算：A-J 列引用、数字、空格、加减乘除、括号
    if (/^[\sA-J\d+\-*/().,\s]+$/.test(ref)) {
      try {
        const expanded = ref.replace(/([A-J])(\d+)/g, (_m, col, row) => {
          const key = col + row
          const cell = cells[key]
          if (!cell) return '0'
          const cellValue = cell.value.startsWith('=')
            ? evaluateFormula(cell.value, cells)
            : cell.value
          const n = parseFloat(cellValue)
          return isNaN(n) ? '0' : n.toString()
        })
        const result = Function('"use strict"; return (' + expanded + ')')()
        if (typeof result === 'number' && isFinite(result)) {
          return Number(result.toFixed(8)).toString()
        }
      } catch {
        // 静默失败，返回原表达式
      }
    }
  }

  return formula
}

function parseRange(range: string, getCellValue: (key: string) => number): number[] {
  const parts = range.split(':')
  if (parts.length !== 2) {
    const v = getCellValue(parts[0])
    return isNaN(v) ? [] : [v]
  }
  const [start, end] = parts
  const startCol = start.charCodeAt(0) - 65
  const startRow = parseInt(start.slice(1)) - 1
  const endCol = end.charCodeAt(0) - 65
  const endRow = parseInt(end.slice(1)) - 1

  const results: number[] = []
  for (let r = Math.max(0, startRow); r <= Math.min(ROWS - 1, endRow); r++) {
    for (let c = Math.max(0, startCol); c <= Math.min(COLS - 1, endCol); c++) {
      const key = `${COLUMNS[c]}${r + 1}`
      const v = getCellValue(key)
      if (!isNaN(v)) results.push(v)
    }
  }
  return results
}

function getCellKey(col: number, row: number): string {
  return `${COLUMNS[col]}${row + 1}`
}

export default function Spreadsheet() {
  const [cells, setCells] = useState<Record<string, CellData>>({})
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [selectedCell, setSelectedCell] = useState<string | null>(null)
  const [formulaBar, setFormulaBar] = useState('')

  const getDisplayValue = useCallback((key: string): string => {
    const cell = cells[key]
    if (!cell) return ''
    if (cell.value.startsWith('=')) {
      return evaluateFormula(cell.value, cells)
    }
    return cell.value
  }, [cells])

  const startEdit = (key: string) => {
    setEditingCell(key)
    setEditValue(cells[key]?.value || '')
    setFormulaBar(cells[key]?.value || '')
  }

  const commitEdit = () => {
    if (editingCell) {
      setCells((prev) => ({
        ...prev,
        [editingCell]: { ...(prev[editingCell] || { value: '', bold: false, italic: false, align: 'left', bgColor: 'transparent' }), value: editValue }
      }))
      setEditingCell(null)
      setEditValue('')
    }
  }

  const toggleBold = () => {
    if (!selectedCell) return
    setCells((prev) => {
      const cell = prev[selectedCell] || { value: '', bold: false, italic: false, align: 'left', bgColor: 'transparent' }
      return { ...prev, [selectedCell]: { ...cell, bold: !cell.bold } }
    })
  }

  const toggleItalic = () => {
    if (!selectedCell) return
    setCells((prev) => {
      const cell = prev[selectedCell] || { value: '', bold: false, italic: false, align: 'left', bgColor: 'transparent' }
      return { ...prev, [selectedCell]: { ...cell, italic: !cell.italic } }
    })
  }

  const cycleAlign = () => {
    if (!selectedCell) return
    setCells((prev) => {
      const cell = prev[selectedCell] || { value: '', bold: false, italic: false, align: 'left', bgColor: 'transparent' }
      const nextAlign = cell.align === 'left' ? 'center' : cell.align === 'center' ? 'right' : 'left'
      return { ...prev, [selectedCell]: { ...cell, align: nextAlign as 'left' | 'center' | 'right' } }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitEdit()
    } else if (e.key === 'Escape') {
      setEditingCell(null)
    }
  }

  const selectedCellData = selectedCell ? cells[selectedCell] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e', color: '#d4d4d4', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#2d2d2d', borderBottom: '1px solid #444' }}>
        <button onClick={toggleBold} style={{ ...toolBtn, fontWeight: 700, background: selectedCellData?.bold ? '#555' : 'transparent' }}>B</button>
        <button onClick={toggleItalic} style={{ ...toolBtn, fontStyle: 'italic', background: selectedCellData?.italic ? '#555' : 'transparent' }}>I</button>
        <button onClick={cycleAlign} style={toolBtn}>
          {selectedCellData?.align === 'left' ? '⫷' : selectedCellData?.align === 'center' ? '⫿' : '⫸'}
        </button>
        <div style={{ width: 1, height: 20, background: '#555', margin: '0 4px' }} />
        <span style={{ fontSize: 11, color: '#aaa', marginRight: 4 }}>
          {selectedCell || '未选中'}
        </span>
        <input
          value={formulaBar}
          onChange={(e) => {
            setFormulaBar(e.target.value)
            if (editingCell) setEditValue(e.target.value)
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit() }}
          onFocus={() => { if (selectedCell && !editingCell) startEdit(selectedCell) }}
          placeholder="fx - 输入公式 (如 =SUM(A1:A5))"
          style={{
            flex: 1, padding: '4px 10px', background: '#1e1e1e', border: '1px solid #555', borderRadius: 3,
            color: '#d4d4d4', fontSize: 13, outline: 'none', fontFamily: 'monospace'
          }}
        />
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={cornerCell}>#</th>
              {COLUMNS.map((col) => (
                <th key={col} style={headerCell}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, row) => (
              <tr key={row}>
                <td style={rowHeaderCell}>{row + 1}</td>
                {Array.from({ length: COLS }, (_, col) => {
                  const key = getCellKey(col, row)
                  const cell = cells[key]
                  const displayValue = getDisplayValue(key)
                  const isSelected = selectedCell === key
                  const isEditing = editingCell === key

                  return (
                    <td
                      key={key}
                      style={{
                        border: '1px solid #444', minWidth: 80, height: 28, cursor: 'cell',
                        background: isSelected ? '#264f78' : cell?.bgColor || 'transparent',
                        outline: isSelected ? '2px solid #007acc' : 'none',
                        outlineOffset: -2,
                        padding: 0, position: 'relative'
                      }}
                      onClick={() => {
                        setSelectedCell(key)
                        setFormulaBar(cell?.value || '')
                      }}
                      onDoubleClick={() => startEdit(key)}
                    >
                      {isEditing ? (
                        <input
                          value={editValue}
                          onChange={(e) => {
                            setEditValue(e.target.value)
                            setFormulaBar(e.target.value)
                          }}
                          onBlur={commitEdit}
                          onKeyDown={handleKeyDown}
                          autoFocus
                          style={{
                            width: '100%', height: '100%', background: '#fff', color: '#111',
                            border: 'none', outline: 'none', padding: '0 4px', fontSize: 13,
                            boxSizing: 'border-box', fontFamily: 'monospace'
                          }}
                        />
                      ) : (
                        <div style={{
                          padding: '0 4px', fontSize: 13, height: '100%', display: 'flex', alignItems: 'center',
                          justifyContent: cell?.align === 'center' ? 'center' : cell?.align === 'right' ? 'flex-end' : 'flex-start',
                          fontWeight: cell?.bold ? 700 : 400,
                          fontStyle: cell?.italic ? 'italic' : 'normal',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {displayValue}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 12px', background: '#007acc', color: '#fff', fontSize: 11 }}>
        <span>Sheet1</span>
        <span>支持公式: =SUM(), =AVG(), =MAX(), =MIN() | 双击单元格编辑</span>
        <span>{Object.keys(cells).length} 个单元格有数据</span>
      </div>
    </div>
  )
}

const toolBtn: React.CSSProperties = {
  background: 'transparent', border: '1px solid #555', color: '#ccc', cursor: 'pointer',
  padding: '3px 10px', borderRadius: 3, fontSize: 13, fontWeight: 400
}

const cornerCell: React.CSSProperties = {
  background: '#333', border: '1px solid #555', padding: '2px 8px', fontSize: 11, color: '#aaa', minWidth: 30
}

const headerCell: React.CSSProperties = {
  background: '#333', border: '1px solid #555', padding: '2px 8px', fontSize: 11, color: '#aaa', minWidth: 80, textAlign: 'center'
}

const rowHeaderCell: React.CSSProperties = {
  background: '#333', border: '1px solid #555', padding: '2px 6px', fontSize: 11, color: '#aaa', textAlign: 'center'
}