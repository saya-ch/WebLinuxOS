import { useState } from 'react'

export default function Calculator() {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [resetFlag, setResetFlag] = useState(false)

  function handleNumber(num: string) {
    if (resetFlag) {
      setDisplay(num)
      setResetFlag(false)
    } else {
      setDisplay((prev) => (prev === '0' ? num : prev + num))
    }
  }

  function handleOperator(op: string) {
    setExpression((prev) => prev + display + op)
    setResetFlag(true)
  }

  function handleDecimal() {
    if (resetFlag) {
      setDisplay('0.')
      setResetFlag(false)
    } else if (!display.includes('.')) {
      setDisplay((prev) => prev + '.')
    }
  }

  function handleEqual() {
    try {
      const fullExp = expression + display
      const sanitized = fullExp
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, String(Math.PI))
        .replace(/e(?![xp])/g, String(Math.E))
      const result = Function('"use strict"; return (' + sanitized + ')')()
      setDisplay(String(result))
      setExpression('')
      setResetFlag(true)
    } catch {
      setDisplay('Error')
      setExpression('')
      setResetFlag(true)
    }
  }

  function handleClear() {
    setDisplay('0')
    setExpression('')
    setResetFlag(false)
  }

  function handleClearEntry() {
    setDisplay('0')
    setResetFlag(false)
  }

  function handleBackspace() {
    setDisplay((prev) => (prev.length <= 1 || (prev.length === 2 && prev.startsWith('-')) ? '0' : prev.slice(0, -1)))
  }

  function handlePercent() {
    try {
      const val = parseFloat(display) / 100
      setDisplay(String(val))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }

  function handleSign() {
    if (display !== '0') {
      setDisplay((prev) => (prev.startsWith('-') ? prev.slice(1) : '-' + prev))
    }
  }

  function handleUnary(fn: (x: number) => number) {
    try {
      const val = parseFloat(display)
      setDisplay(String(fn(val)))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }

  function handleConstant(value: string) {
    if (resetFlag) {
      setDisplay(value)
      setResetFlag(false)
    } else if (display === '0') {
      setDisplay(value)
    } else {
      setDisplay((prev) => prev + value)
    }
  }

  function handleOpenParen() {
    if (resetFlag) {
      setExpression((prev) => prev + '(')
      setDisplay('0')
      setResetFlag(false)
    } else if (display === '0') {
      setExpression((prev) => prev + '(')
    } else {
      setExpression((prev) => prev + display + '(')
      setResetFlag(true)
    }
  }

  function handleCloseParen() {
    setExpression((prev) => prev + display + ')')
    setResetFlag(true)
  }

  const btnStyle: React.CSSProperties = {
    padding: '10px 0',
    fontSize: 16,
    border: '1px solid #555',
    background: '#3c3c3c',
    color: '#fff',
    cursor: 'pointer',
    borderRadius: 4,
  }

  const opBtnStyle: React.CSSProperties = { ...btnStyle, background: '#555' }
  const funcBtnStyle: React.CSSProperties = { ...btnStyle, background: '#2d2d2d', color: '#aaa' }
  const eqBtnStyle: React.CSSProperties = { ...btnStyle, background: '#0078d4', color: '#fff', fontWeight: 'bold' }

  return (
    <div className="app-container app-calculator" style={{ background: '#1e1e1e', padding: 8 }}>
      <div className="app-calc-display" style={{ background: '#2d2d2d', borderRadius: 8, padding: '16px 12px', marginBottom: 8, textAlign: 'right', minHeight: 80, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ color: '#888', fontSize: 13, minHeight: 20, wordBreak: 'break-all' }}>{expression}</div>
        <div style={{ color: '#fff', fontSize: 32, fontWeight: 300, wordBreak: 'break-all' }}>{display}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
        <button style={funcBtnStyle} onClick={handleClear}>C</button>
        <button style={funcBtnStyle} onClick={handleClearEntry}>CE</button>
        <button style={funcBtnStyle} onClick={handleBackspace}>⌫</button>
        <button style={funcBtnStyle} onClick={handlePercent}>%</button>
        <button style={opBtnStyle} onClick={() => handleOperator('÷')}>÷</button>

        <button style={funcBtnStyle} onClick={() => handleUnary((x) => x * x)}>x²</button>
        <button style={funcBtnStyle} onClick={() => handleUnary((x) => x * x * x)}>x³</button>
        <button style={funcBtnStyle} onClick={() => handleOperator('**')}>xⁿ</button>
        <button style={funcBtnStyle} onClick={() => handleUnary(Math.sqrt)}>√</button>
        <button style={opBtnStyle} onClick={() => handleOperator('×')}>×</button>

        <button style={btnStyle} onClick={() => handleNumber('7')}>7</button>
        <button style={btnStyle} onClick={() => handleNumber('8')}>8</button>
        <button style={btnStyle} onClick={() => handleNumber('9')}>9</button>
        <button style={funcBtnStyle} onClick={() => handleUnary(Math.sin)}>sin</button>
        <button style={opBtnStyle} onClick={() => handleOperator('-')}>−</button>

        <button style={btnStyle} onClick={() => handleNumber('4')}>4</button>
        <button style={btnStyle} onClick={() => handleNumber('5')}>5</button>
        <button style={btnStyle} onClick={() => handleNumber('6')}>6</button>
        <button style={funcBtnStyle} onClick={() => handleUnary(Math.cos)}>cos</button>
        <button style={opBtnStyle} onClick={() => handleOperator('+')}>+</button>

        <button style={btnStyle} onClick={() => handleNumber('1')}>1</button>
        <button style={btnStyle} onClick={() => handleNumber('2')}>2</button>
        <button style={btnStyle} onClick={() => handleNumber('3')}>3</button>
        <button style={funcBtnStyle} onClick={() => handleUnary(Math.tan)}>tan</button>
        <button style={opBtnStyle} onClick={() => handleOperator('+')}>+</button>

        <button style={btnStyle} onClick={handleSign}>±</button>
        <button style={btnStyle} onClick={() => handleNumber('0')}>0</button>
        <button style={btnStyle} onClick={handleDecimal}>.</button>
        <button style={funcBtnStyle} onClick={() => handleUnary(Math.log10)}>log</button>
        <button style={eqBtnStyle} onClick={handleEqual}>=</button>

        <button style={funcBtnStyle} onClick={handleOpenParen}>(</button>
        <button style={funcBtnStyle} onClick={handleCloseParen}>)</button>
        <button style={funcBtnStyle} onClick={() => handleConstant('π')}>π</button>
        <button style={funcBtnStyle} onClick={() => handleConstant('e')}>e</button>
        <button style={funcBtnStyle} onClick={() => handleUnary(Math.log)}>ln</button>
      </div>
    </div>
  )
}