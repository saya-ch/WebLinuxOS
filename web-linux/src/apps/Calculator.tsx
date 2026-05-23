import { useState, useCallback, useMemo } from 'react'

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
      setDisplay((prev) => (prev === '0' || prev === 'Error' ? num : prev + num))
    }
  }, [resetFlag])

  const handleOperator = useCallback((op: string) => {
    setExpression((prev) => prev + (display !== 'Error' ? display : '') + op)
    setResetFlag(true)
  }, [display])

  const handleDecimal = useCallback(() => {
    if (resetFlag || display === 'Error') {
      setDisplay('0.')
      setResetFlag(false)
    } else if (!display.includes('.')) {
      setDisplay((prev) => prev + '.')
    }
  }, [resetFlag, display])

  const handleClear = useCallback(() => {
    setDisplay('0')
    setExpression('')
    setResetFlag(false)
  }, [])

  const handleEqual = useCallback(() => {
    if (display === 'Error') {
      handleClear()
      return
    }
    
    try {
      const fullExp = expression + display
      const evalResult = safeCalculate(fullExp)
      
      if (!isFinite(evalResult) || isNaN(evalResult)) {
        throw new Error('无效结果')
      }
      
      // 格式化结果，移除多余的零
      let formatted = String(evalResult)
      if (formatted.includes('.')) {
        formatted = formatted.replace(/\.?0+$/, '')
      }
      
      setDisplay(formatted)
      setExpression('')
      setResetFlag(true)
    } catch {
      setDisplay('Error')
      setExpression('')
      setResetFlag(true)
    }
  }, [expression, display, safeCalculate, handleClear])

  const handleClearEntry = useCallback(() => {
    setDisplay('0')
    setResetFlag(false)
  }, [])

  const handleBackspace = useCallback(() => {
    setDisplay((prev) => {
      if (prev === 'Error') return '0'
      return (prev.length <= 1 || (prev.length === 2 && prev.startsWith('-'))) ? '0' : prev.slice(0, -1)
    })
  }, [])

  const handlePercent = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = parseFloat(display) / 100
      setDisplay(String(val))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleSign = useCallback(() => {
    if (display !== '0' && display !== 'Error') {
      setDisplay((prev) => (prev.startsWith('-') ? prev.slice(1) : '-' + prev))
    }
  }, [display])

  const handleUnary = useCallback((fn: (x: number) => number) => {
    if (display === 'Error') return
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
    if (resetFlag || display === 'Error') {
      setDisplay(value)
      setResetFlag(false)
    } else if (display === '0') {
      setDisplay(value)
    }
  }, [resetFlag, display])

  const handleOpenParen = useCallback(() => {
    if (resetFlag || display === 'Error') {
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
    if (display !== 'Error') {
      setExpression((prev) => prev + display + ')')
      setResetFlag(true)
    }
  }, [display])

  // 使用 useMemo 优化按钮样式
  const buttonStyles = useMemo(() => ({
    btn: {
      padding: '10px 0',
      fontSize: 16,
      border: '1px solid #555',
      background: '#3c3c3c',
      color: '#fff',
      cursor: 'pointer',
      borderRadius: 4,
    },
    op: {
      padding: '10px 0',
      fontSize: 16,
      border: '1px solid #555',
      background: '#555',
      color: '#fff',
      cursor: 'pointer',
      borderRadius: 4,
    },
    func: {
      padding: '10px 0',
      fontSize: 16,
      border: '1px solid #555',
      background: '#2d2d2d',
      color: '#aaa',
      cursor: 'pointer',
      borderRadius: 4,
    },
    eq: {
      padding: '10px 0',
      fontSize: 16,
      border: '1px solid #555',
      background: '#0078d4',
      color: '#fff',
      cursor: 'pointer',
      borderRadius: 4,
      fontWeight: 'bold'
    }
  }), [])

  return (
    <div className="app-container app-calculator" style={{ background: '#1e1e1e', padding: 8 }}>
      <div className="app-calc-display" style={{ 
        background: '#2d2d2d', 
        borderRadius: 8, 
        padding: '16px 12px', 
        marginBottom: 8, 
        textAlign: 'right', 
        minHeight: 80, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'flex-end' 
      }}>
        <div style={{ color: '#888', fontSize: 13, minHeight: 20, wordBreak: 'break-all' }}>{expression}</div>
        <div style={{ color: '#fff', fontSize: 32, fontWeight: 300, wordBreak: 'break-all' }}>{display}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
        <button style={buttonStyles.func} onClick={handleClear}>C</button>
        <button style={buttonStyles.func} onClick={handleClearEntry}>CE</button>
        <button style={buttonStyles.func} onClick={handleBackspace}>⌫</button>
        <button style={buttonStyles.func} onClick={handlePercent}>%</button>
        <button style={buttonStyles.op} onClick={() => handleOperator('÷')}>÷</button>

        <button style={buttonStyles.func} onClick={() => handleUnary((x) => x * x)}>x²</button>
        <button style={buttonStyles.func} onClick={() => handleUnary((x) => x * x * x)}>x³</button>
        <button style={buttonStyles.func} onClick={() => handleOperator('**')}>xⁿ</button>
        <button style={buttonStyles.func} onClick={() => handleUnary(Math.sqrt)}>√</button>
        <button style={buttonStyles.op} onClick={() => handleOperator('×')}>×</button>

        <button style={buttonStyles.btn} onClick={() => handleNumber('7')}>7</button>
        <button style={buttonStyles.btn} onClick={() => handleNumber('8')}>8</button>
        <button style={buttonStyles.btn} onClick={() => handleNumber('9')}>9</button>
        <button style={buttonStyles.func} onClick={() => handleUnary(Math.sin)}>sin</button>
        <button style={buttonStyles.op} onClick={() => handleOperator('-')}>−</button>

        <button style={buttonStyles.btn} onClick={() => handleNumber('4')}>4</button>
        <button style={buttonStyles.btn} onClick={() => handleNumber('5')}>5</button>
        <button style={buttonStyles.btn} onClick={() => handleNumber('6')}>6</button>
        <button style={buttonStyles.func} onClick={() => handleUnary(Math.cos)}>cos</button>
        <button style={buttonStyles.op} onClick={() => handleOperator('+')}>+</button>

        <button style={buttonStyles.btn} onClick={() => handleNumber('1')}>1</button>
        <button style={buttonStyles.btn} onClick={() => handleNumber('2')}>2</button>
        <button style={buttonStyles.btn} onClick={() => handleNumber('3')}>3</button>
        <button style={buttonStyles.func} onClick={() => handleUnary(Math.tan)}>tan</button>
        <button style={buttonStyles.func} onClick={() => handleUnary((x) => x !== 0 ? 1 / x : NaN)}>1/x</button>

        <button style={buttonStyles.btn} onClick={handleSign}>±</button>
        <button style={buttonStyles.btn} onClick={() => handleNumber('0')}>0</button>
        <button style={buttonStyles.btn} onClick={handleDecimal}>.</button>
        <button style={buttonStyles.func} onClick={() => handleUnary(Math.log10)}>log</button>
        <button style={buttonStyles.eq} onClick={handleEqual}>=</button>

        <button style={buttonStyles.func} onClick={handleOpenParen}>(</button>
        <button style={buttonStyles.func} onClick={handleCloseParen}>)</button>
        <button style={buttonStyles.func} onClick={() => handleConstant(String(Math.PI))}>π</button>
        <button style={buttonStyles.func} onClick={() => handleConstant(String(Math.E))}>e</button>
        <button style={buttonStyles.func} onClick={() => handleUnary(Math.log)}>ln</button>
      </div>
    </div>
  )
}
