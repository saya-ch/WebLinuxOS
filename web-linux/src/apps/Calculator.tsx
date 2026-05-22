import { useState, useCallback } from 'react'

type Token = { type: 'number' | 'operator' | 'paren', value: string }

export default function Calculator() {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [resetFlag, setResetFlag] = useState(false)

  const safeCalculate = useCallback((expr: string): number => {
    try {
      const sanitized = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, String(Math.PI))
        .replace(/e(?![xp])/g, String(Math.E))

      const tokens: Token[] = []
      let current = ''
      
      for (let i = 0; i < sanitized.length; i++) {
        const char = sanitized[i]
        if (char.match(/[0-9.]/)) {
          current += char
        } else if (char.match(/[+\-*/()]/)) {
          if (current) {
            tokens.push({ type: 'number', value: current })
            current = ''
          }
          if (char === '*' && sanitized[i + 1] === '*') {
            tokens.push({ type: 'operator', value: '**' })
            i++
          } else {
            tokens.push({ type: char === '(' || char === ')' ? 'paren' : 'operator', value: char })
          }
        }
      }
      if (current) {
        tokens.push({ type: 'number', value: current })
      }

      const applyOperator = (a: number, b: number, op: string): number => {
        switch (op) {
          case '+': return a + b
          case '-': return a - b
          case '*': return a * b
          case '/': 
            if (b === 0) throw new Error('除零错误')
            return a / b
          case '**': return Math.pow(a, b)
          default: throw new Error('未知操作符')
        }
      }

      const precedence = (op: string): number => {
        if (op === '**') return 3
        if (op === '*' || op === '/') return 2
        if (op === '+' || op === '-') return 1
        return 0
      }

      const output: (number | string)[] = []
      const operators: string[] = []

      for (const token of tokens) {
        if (token.type === 'number') {
          output.push(parseFloat(token.value))
        } else if (token.type === 'operator') {
          while (
            operators.length > 0 &&
            operators[operators.length - 1] !== '(' &&
            precedence(operators[operators.length - 1]) >= precedence(token.value)
          ) {
            output.push(operators.pop()!)
          }
          operators.push(token.value)
        } else if (token.type === 'paren') {
          if (token.value === '(') {
            operators.push(token.value)
          } else if (token.value === ')') {
            while (operators.length > 0 && operators[operators.length - 1] !== '(') {
              output.push(operators.pop()!)
            }
            operators.pop()
          }
        }
      }

      while (operators.length > 0) {
        output.push(operators.pop()!)
      }

      const stack: number[] = []
      for (const item of output) {
        if (typeof item === 'number') {
          stack.push(item)
        } else {
          const b = stack.pop()
          const a = stack.pop()
          if (a === undefined || b === undefined) throw new Error('表达式错误')
          stack.push(applyOperator(a, b, item))
        }
      }

      if (stack.length !== 1) throw new Error('计算错误')
      return stack[0]
    } catch {
      throw new Error('计算错误')
    }
  }, [])

  const handleNumber = useCallback((num: string) => {
    if (resetFlag) {
      setDisplay(num)
      setResetFlag(false)
    } else {
      setDisplay((prev) => (prev === '0' ? num : prev + num))
    }
  }, [resetFlag])

  const handleOperator = useCallback((op: string) => {
    setExpression((prev) => prev + display + op)
    setResetFlag(true)
  }, [display])

  const handleDecimal = useCallback(() => {
    if (resetFlag) {
      setDisplay('0.')
      setResetFlag(false)
    } else if (!display.includes('.')) {
      setDisplay((prev) => prev + '.')
    }
  }, [resetFlag, display])

  const handleEqual = useCallback(() => {
    try {
      const fullExp = expression + display
      const evalResult = safeCalculate(fullExp)
      
      if (!isFinite(evalResult) || isNaN(evalResult)) {
        throw new Error('无效结果')
      }
      
      setDisplay(String(evalResult))
      setExpression('')
      setResetFlag(true)
    } catch {
      setDisplay('Error')
      setExpression('')
      setResetFlag(true)
    }
  }, [expression, display, safeCalculate])

  const handleClear = useCallback(() => {
    setDisplay('0')
    setExpression('')
    setResetFlag(false)
  }, [])

  const handleClearEntry = useCallback(() => {
    setDisplay('0')
    setResetFlag(false)
  }, [])

  const handleBackspace = useCallback(() => {
    setDisplay((prev) => (prev.length <= 1 || (prev.length === 2 && prev.startsWith('-')) ? '0' : prev.slice(0, -1)))
  }, [])

  const handlePercent = useCallback(() => {
    try {
      const val = parseFloat(display) / 100
      setDisplay(String(val))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleSign = useCallback(() => {
    if (display !== '0') {
      setDisplay((prev) => (prev.startsWith('-') ? prev.slice(1) : '-' + prev))
    }
  }, [display])

  const handleUnary = useCallback((fn: (x: number) => number) => {
    try {
      const val = parseFloat(display)
      const result = fn(val)
      if (!isFinite(result)) throw new Error()
      setDisplay(String(result))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleConstant = useCallback((value: string) => {
    if (resetFlag) {
      setDisplay(value)
      setResetFlag(false)
    } else if (display === '0') {
      setDisplay(value)
    } else {
      setDisplay((prev) => prev + value)
    }
  }, [resetFlag, display])

  const handleOpenParen = useCallback(() => {
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
  }, [resetFlag, display])

  const handleCloseParen = useCallback(() => {
    setExpression((prev) => prev + display + ')')
    setResetFlag(true)
  }, [display])

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
        <button style={funcBtnStyle} onClick={() => handleUnary((x) => 1 / x)}>1/x</button>

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
