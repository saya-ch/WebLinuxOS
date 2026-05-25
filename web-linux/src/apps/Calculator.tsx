import { useState, useCallback, useMemo } from 'react'

type Token = { type: 'number' | 'operator' | 'paren', value: string }

// 历史记录类型
interface HistoryItem {
  expression: string
  result: string
}

export default function Calculator() {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [resetFlag, setResetFlag] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [angleMode, setAngleMode] = useState<'rad' | 'deg'>('rad') // 角度模式：弧度或角度

  // 角度和弧度转换辅助函数
  const toRad = useCallback((x: number): number => {
    return angleMode === 'deg' ? (x * Math.PI) / 180 : x
  }, [angleMode])

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
      
      // 保存到历史记录
      setHistory((prev) => [{
        expression: fullExp,
        result: formatted
      }, ...prev.slice(0, 19)]) // 保留最近20条记录
      
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
      let formatted = String(result)
      if (formatted.includes('.')) {
        formatted = formatted.replace(/\.?0+$/, '')
      }
      setDisplay(formatted)
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [])

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

  // 更多数学函数
  const handleFactorial = useCallback(() => {
    if (display === 'Error') return
    try {
      let n = parseInt(display)
      if (n < 0 || !Number.isInteger(parseFloat(display))) {
        setDisplay('Error')
        return
      }
      let result = 1
      for (let i = 2; i <= n; i++) {
        result *= i
      }
      setDisplay(String(result))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleCubeRoot = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.cbrt(parseFloat(display))
      let formatted = String(val)
      if (formatted.includes('.')) {
        formatted = formatted.replace(/\.?0+$/, '')
      }
      setDisplay(formatted)
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleTan = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.tan(toRad(parseFloat(display)))
      let formatted = String(val)
      if (formatted.includes('.')) {
        formatted = formatted.replace(/\.?0+$/, '')
      }
      setDisplay(formatted)
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display, toRad])

  const handleAsin = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.asin(parseFloat(display))
      const result = angleMode === 'deg' ? (val * 180) / Math.PI : val
      let formatted = String(result)
      if (formatted.includes('.')) {
        formatted = formatted.replace(/\.?0+$/, '')
      }
      setDisplay(formatted)
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display, angleMode])

  const handleAcos = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.acos(parseFloat(display))
      const result = angleMode === 'deg' ? (val * 180) / Math.PI : val
      let formatted = String(result)
      if (formatted.includes('.')) {
        formatted = formatted.replace(/\.?0+$/, '')
      }
      setDisplay(formatted)
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display, angleMode])

  const handleAtan = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.atan(parseFloat(display))
      const result = angleMode === 'deg' ? (val * 180) / Math.PI : val
      let formatted = String(result)
      if (formatted.includes('.')) {
        formatted = formatted.replace(/\.?0+$/, '')
      }
      setDisplay(formatted)
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display, angleMode])

  const handleFloor = useCallback(() => {
    if (display === 'Error') return
    try {
      setDisplay(String(Math.floor(parseFloat(display))))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleCeil = useCallback(() => {
    if (display === 'Error') return
    try {
      setDisplay(String(Math.ceil(parseFloat(display))))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleRound = useCallback(() => {
    if (display === 'Error') return
    try {
      setDisplay(String(Math.round(parseFloat(display))))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleExp = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.exp(parseFloat(display))
      let formatted = String(val)
      if (formatted.includes('.')) {
        formatted = formatted.replace(/\.?0+$/, '')
      }
      setDisplay(formatted)
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handle10x = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.pow(10, parseFloat(display))
      let formatted = String(val)
      if (formatted.includes('.')) {
        formatted = formatted.replace(/\.?0+$/, '')
      }
      setDisplay(formatted)
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleReciprocal = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = parseFloat(display)
      if (val === 0) throw new Error()
      const result = 1 / val
      let formatted = String(result)
      if (formatted.includes('.')) {
        formatted = formatted.replace(/\.?0+$/, '')
      }
      setDisplay(formatted)
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleAbs = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.abs(parseFloat(display))
      setDisplay(String(val))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleSinh = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.sinh(parseFloat(display))
      let formatted = String(val)
      if (formatted.includes('.')) {
        formatted = formatted.replace(/\.?0+$/, '')
      }
      setDisplay(formatted)
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleCosh = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.cosh(parseFloat(display))
      let formatted = String(val)
      if (formatted.includes('.')) {
        formatted = formatted.replace(/\.?0+$/, '')
      }
      setDisplay(formatted)
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleTanh = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.tanh(parseFloat(display))
      let formatted = String(val)
      if (formatted.includes('.')) {
        formatted = formatted.replace(/\.?0+$/, '')
      }
      setDisplay(formatted)
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleFromHistory = useCallback((item: HistoryItem) => {
    setDisplay(item.result)
    setExpression(item.expression)
    setShowHistory(false)
    setResetFlag(true)
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

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
    },
    modeToggle: {
      padding: '5px 10px',
      fontSize: 12,
      border: '1px solid #555',
      background: '#2d2d2d',
      color: '#fff',
      cursor: 'pointer',
      borderRadius: 4,
    }
  }), [])

  // 如果显示历史记录，渲染历史记录界面
  if (showHistory) {
    return (
      <div className="app-container app-calculator" style={{ background: '#1e1e1e', padding: 8, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ color: '#fff', margin: 0 }}>计算历史</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              style={{ padding: '5px 10px', background: '#555', border: '1px solid #666', borderRadius: 4, color: '#fff', cursor: 'pointer' }}
              onClick={() => setShowHistory(false)}
            >返回</button>
            <button 
              style={{ padding: '5px 10px', background: '#d32f2f', border: '1px solid #666', borderRadius: 4, color: '#fff', cursor: 'pointer' }}
              onClick={clearHistory}
            >清空</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {history.length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center', padding: 20 }}>暂无历史记录</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {history.map((item, index) => (
                <div 
                  key={index}
                  onClick={() => handleFromHistory(item)}
                  style={{
                    background: '#2d2d2d',
                    padding: 12,
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: '1px solid #3c3c3c'
                  }}
                >
                  <div style={{ color: '#aaa', fontSize: 12 }}>{item.expression}</div>
                  <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>= {item.result}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app-container app-calculator" style={{ background: '#1e1e1e', padding: 8, height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <button 
          style={{ padding: '4px 8px', fontSize: 11, background: '#2d2d2d', border: '1px solid #3c3c3c', borderRadius: 3, color: '#aaa', cursor: 'pointer' }}
          onClick={() => setShowHistory(true)}
        >
          📋 历史 ({history.length})
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          <button 
            style={{ 
              ...buttonStyles.modeToggle,
              background: angleMode === 'rad' ? '#0078d4' : '#2d2d2d'
            }}
            onClick={() => setAngleMode(angleMode === 'rad' ? 'deg' : 'rad')}
          >
            {angleMode === 'rad' ? 'Rad' : 'Deg'}
          </button>
        </div>
      </div>

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

      {/* 第一行：基本功能 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
        <button style={buttonStyles.func} onClick={handleClear}>C</button>
        <button style={buttonStyles.func} onClick={handleClearEntry}>CE</button>
        <button style={buttonStyles.func} onClick={handleBackspace}>⌫</button>
        <button style={buttonStyles.func} onClick={handlePercent}>%</button>
        <button style={buttonStyles.op} onClick={() => handleOperator('÷')}>÷</button>
      </div>

      {/* 第二行：平方、立方等 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginTop: 4 }}>
        <button style={buttonStyles.func} onClick={() => handleUnary((x) => x * x)}>x²</button>
        <button style={buttonStyles.func} onClick={() => handleUnary((x) => x * x * x)}>x³</button>
        <button style={buttonStyles.func} onClick={() => handleOperator('**')}>xⁿ</button>
        <button style={buttonStyles.func} onClick={() => handleUnary(Math.sqrt)}>√</button>
        <button style={buttonStyles.func} onClick={handleCubeRoot}>∛</button>
      </div>

      {/* 第三行：三角函数 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginTop: 4 }}>
        <button style={buttonStyles.func} onClick={() => handleUnary((x) => Math.sin(toRad(x)))}>sin</button>
        <button style={buttonStyles.func} onClick={() => handleUnary((x) => Math.cos(toRad(x)))}>cos</button>
        <button style={buttonStyles.func} onClick={handleTan}>tan</button>
        <button style={buttonStyles.func} onClick={handleAsin}>sin⁻¹</button>
        <button style={buttonStyles.func} onClick={handleAcos}>cos⁻¹</button>
      </div>

      {/* 第四行：数字7-9和更多函数 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginTop: 4 }}>
        <button style={buttonStyles.btn} onClick={() => handleNumber('7')}>7</button>
        <button style={buttonStyles.btn} onClick={() => handleNumber('8')}>8</button>
        <button style={buttonStyles.btn} onClick={() => handleNumber('9')}>9</button>
        <button style={buttonStyles.func} onClick={handleAtan}>tan⁻¹</button>
        <button style={buttonStyles.op} onClick={() => handleOperator('×')}>×</button>
      </div>

      {/* 第五行：数字4-6和更多函数 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginTop: 4 }}>
        <button style={buttonStyles.btn} onClick={() => handleNumber('4')}>4</button>
        <button style={buttonStyles.btn} onClick={() => handleNumber('5')}>5</button>
        <button style={buttonStyles.btn} onClick={() => handleNumber('6')}>6</button>
        <button style={buttonStyles.func} onClick={handleFactorial}>x!</button>
        <button style={buttonStyles.op} onClick={() => handleOperator('-')}>−</button>
      </div>

      {/* 第六行：数字1-3和更多函数 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginTop: 4 }}>
        <button style={buttonStyles.btn} onClick={handleSign}>±</button>
        <button style={buttonStyles.btn} onClick={() => handleNumber('0')}>0</button>
        <button style={buttonStyles.btn} onClick={handleDecimal}>.</button>
        <button style={buttonStyles.func} onClick={handleAbs}>|x|</button>
        <button style={buttonStyles.op} onClick={() => handleOperator('+')}>+</button>
      </div>

      {/* 第七行：函数 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginTop: 4 }}>
        <button style={buttonStyles.func} onClick={handleOpenParen}>(</button>
        <button style={buttonStyles.func} onClick={handleCloseParen}>)</button>
        <button style={buttonStyles.func} onClick={() => handleConstant(String(Math.PI))}>π</button>
        <button style={buttonStyles.func} onClick={() => handleConstant(String(Math.E))}>e</button>
        <button style={buttonStyles.eq} onClick={handleEqual}>=</button>
      </div>

      {/* 第八行：高级函数 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginTop: 4 }}>
        <button style={buttonStyles.func} onClick={() => handleUnary(Math.log)}>ln</button>
        <button style={buttonStyles.func} onClick={() => handleUnary(Math.log10)}>log</button>
        <button style={buttonStyles.func} onClick={handleExp}>eˣ</button>
        <button style={buttonStyles.func} onClick={handle10x}>10ˣ</button>
        <button style={buttonStyles.func} onClick={handleReciprocal}>1/x</button>
      </div>

      {/* 第九行：更多函数 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginTop: 4 }}>
        <button style={buttonStyles.func} onClick={handleFloor}>⌊x⌋</button>
        <button style={buttonStyles.func} onClick={handleCeil}>⌈x⌉</button>
        <button style={buttonStyles.func} onClick={handleRound}>round</button>
        <button style={buttonStyles.func} onClick={handleSinh}>sinh</button>
        <button style={buttonStyles.func} onClick={handleCosh}>cosh</button>
      </div>
      
      {/* 第十行：更多函数 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginTop: 4 }}>
        <button style={buttonStyles.func} onClick={handleTanh}>tanh</button>
        <button style={{...buttonStyles.func, opacity: 0.5, cursor: 'not-allowed'}} disabled></button>
        <button style={{...buttonStyles.func, opacity: 0.5, cursor: 'not-allowed'}} disabled></button>
        <button style={{...buttonStyles.func, opacity: 0.5, cursor: 'not-allowed'}} disabled></button>
        <button style={{...buttonStyles.func, opacity: 0.5, cursor: 'not-allowed'}} disabled></button>
      </div>
    </div>
  )
}
