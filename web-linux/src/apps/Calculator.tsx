import { useState, useCallback, useMemo } from 'react'

// 交互式按钮组件
const InteractiveButton = ({ style, children, onClick, disabled = false }: { 
  style: React.CSSProperties, 
  children: React.ReactNode, 
  onClick?: () => void, 
  disabled?: boolean 
}) => {
  const [isPressed, setIsPressed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const getButtonStyle = () => {
    const baseStyle = { ...style }
    
    if (isHovered && !disabled) {
      baseStyle.transform = 'translateY(-2px)'
      baseStyle.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
    }
    
    if (isPressed && !disabled) {
      baseStyle.transform = 'translateY(1px)'
      baseStyle.boxShadow = '0 1px 4px rgba(0,0,0,0.2)'
    }
    
    return baseStyle
  }
  
  return (
    <button
      style={getButtonStyle()}
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => {
        setIsPressed(false)
        setIsHovered(false)
      }}
      onMouseEnter={() => setIsHovered(true)}
    >
      {children}
    </button>
  )
}

type Token = { type: 'number' | 'operator' | 'paren', value: string }

// 历史记录类型
interface HistoryItem {
  expression: string
  result: string
}

// 汇率相关类型
interface ExchangeRates {
  rates: Record<string, number>
  base: string
  timestamp: number
}

// 常用货币列表
const COMMON_CURRENCIES = [
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'HKD', name: '港币', symbol: 'HK$' },
  { code: 'AUD', name: '澳元', symbol: 'A$' },
  { code: 'CAD', name: '加元', symbol: 'C$' },
  { code: 'CHF', name: '瑞郎', symbol: 'Fr' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$' },
  { code: 'NZD', name: '新西兰元', symbol: 'NZ$' },
  { code: 'INR', name: '印度卢比', symbol: '₹' },
  { code: 'KRW', name: '韩元', symbol: '₩' },
  { code: 'RUB', name: '卢布', symbol: '₽' },
  { code: 'BRL', name: '雷亚尔', symbol: 'R$' },
  { code: 'ZAR', name: '兰特', symbol: 'R' },
]

export default function Calculator() {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [resetFlag, setResetFlag] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [angleMode, setAngleMode] = useState<'rad' | 'deg'>('rad')
  // 新增：模式和汇率状态
  const [mode, setMode] = useState<'calc' | 'exchange'>('calc')
  const [exchangeData, setExchangeData] = useState<ExchangeRates | null>(null)
  const [exchangeLoading, setExchangeLoading] = useState(false)
  const [exchangeError, setExchangeError] = useState<string | null>(null)
  const [exchangeFrom, setExchangeFrom] = useState('USD')
  const [exchangeTo, setExchangeTo] = useState('CNY')
  const [exchangeAmount, setExchangeAmount] = useState('1')
  const [lastExchangeFetch, setLastExchangeFetch] = useState(0)

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
      const n = parseInt(display)
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

  // 增强功能：编程计算器
  const handleBinary = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = parseInt(display)
      if (val < 0) throw new Error()
      setDisplay(val.toString(2).toUpperCase())
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleOctal = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = parseInt(display)
      if (val < 0) throw new Error()
      setDisplay(val.toString(8).toUpperCase())
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleHex = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = parseInt(display)
      if (val < 0) throw new Error()
      setDisplay('0x' + val.toString(16).toUpperCase())
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleDegrees = useCallback(() => {
    if (display === 'Error') return
    try {
      const rad = parseFloat(display)
      const deg = (rad * 180) / Math.PI
      setDisplay(String(Math.round(deg * 100) / 100))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  const handleRadians = useCallback(() => {
    if (display === 'Error') return
    try {
      const deg = parseFloat(display)
      const rad = (deg * Math.PI) / 180
      setDisplay(String(Math.round(rad * 100) / 100))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])

  // 从任意进制转换回十进制
  const handleFromBase = useCallback((base: number) => {
    if (display === 'Error') return
    try {
      const val = parseInt(display, base)
      if (isNaN(val)) throw new Error()
      setDisplay(String(val))
      setResetFlag(true)
    } catch {
      setDisplay('Error')
    }
  }, [display])
  
  // 记忆功能
  const [memory, setMemory] = useState<number>(0)

  const handleMemoryAdd = useCallback(() => {
    if (display === 'Error') return
    const val = parseFloat(display)
    if (!isNaN(val)) {
      setMemory(prev => prev + val)
    }
  }, [display])

  const handleMemorySubtract = useCallback(() => {
    if (display === 'Error') return
    const val = parseFloat(display)
    if (!isNaN(val)) {
      setMemory(prev => prev - val)
    }
  }, [display])

  const handleMemoryRecall = useCallback(() => {
    setDisplay(String(memory))
    setResetFlag(true)
  }, [memory])

  const handleMemoryClear = useCallback(() => {
    setMemory(0)
  }, [])

  const handleYx = useCallback(() => {
    setExpression((prev) => prev + (display !== 'Error' ? display : '') + '^(1/')
    setResetFlag(true)
  }, [display])

  const handle10pow = useCallback(() => {
    if (display === 'Error') return
    try {
      const result = Math.pow(10, parseFloat(display))
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

  const handleTanH = useCallback(() => {
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

  const handleMod = useCallback(() => {
    setExpression((prev) => prev + (display !== 'Error' ? display : '') + '%')
    setResetFlag(true)
  }, [display])

  // 科学计算器辅助函数
  const handleNthRoot = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = parseFloat(display)
      const result = Math.pow(val, 1/2) // 默认平方根
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

  const handleLog2 = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.log2(parseFloat(display))
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

  const handleLog1p = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.log1p(parseFloat(display))
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

  const handleExpm1 = useCallback(() => {
    if (display === 'Error') return
    try {
      const val = Math.expm1(parseFloat(display))
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

  const handleSignMemory = useCallback(() => {
    if (memory !== 0) {
      setDisplay(String(memory))
      setResetFlag(true)
    }
  }, [memory])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const handleFromHistory = useCallback((item: HistoryItem) => {
    setDisplay(item.result)
    setExpression(item.expression)
    setShowHistory(false)
    setResetFlag(true)
  }, [])

  // 从 API 获取汇率（使用 open.er-api.com - 免费公开API，无需密钥）
  const fetchExchangeRates = useCallback(async (baseCurrency: string) => {
    const now = Date.now()
    // 缓存1小时：如果缓存不到1小时且已存在数据，则直接使用
    if (exchangeData && exchangeData.base === baseCurrency && (now - lastExchangeFetch) < 60 * 60 * 1000) {
      return
    }
    setExchangeLoading(true)
    setExchangeError(null)
    try {
      const url = `https://open.er-api.com/v6/latest/${baseCurrency}`
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      if (data.result !== 'success') throw new Error('API error')
      setExchangeData({
        rates: data.rates,
        base: data.base_code,
        timestamp: data.time_last_update_unix || Date.now() / 1000,
      })
      setLastExchangeFetch(now)
      // 持久化到localStorage
      try {
        localStorage.setItem('weblinux-rates-' + baseCurrency, JSON.stringify({
          rates: data.rates,
          base: data.base_code,
          timestamp: data.time_last_update_unix || Date.now() / 1000,
          fetchTime: now,
        }))
      } catch { /* ignore */ }
    } catch (err) {
      // 尝试从 localStorage 读取旧数据
      try {
        const cached = localStorage.getItem('weblinux-rates-' + baseCurrency)
        if (cached) {
          const parsed = JSON.parse(cached)
          setExchangeData(parsed)
          setLastExchangeFetch(parsed.fetchTime || Date.now())
          setExchangeError('使用缓存数据（网络不可用）')
        } else {
          // 默认模拟数据
          setExchangeData({
            rates: {
              USD: 1, EUR: 0.92, GBP: 0.79, JPY: 155, CNY: 7.24, HKD: 7.81,
              AUD: 1.52, CAD: 1.36, CHF: 0.90, SGD: 1.35, NZD: 1.64, INR: 83.2,
              KRW: 1370, RUB: 92.5, BRL: 5.15, ZAR: 18.7,
            },
            base: baseCurrency,
            timestamp: Math.floor(Date.now() / 1000),
          })
          setExchangeError('使用模拟汇率数据')
        }
      } catch {
        setExchangeError('无法获取汇率，请稍后再试')
      }
    } finally {
      setExchangeLoading(false)
    }
  }, [exchangeData, lastExchangeFetch])

  // 计算汇率结果
  const getExchangeResult = useCallback((): string => {
    if (!exchangeData) return '—'
    const amt = parseFloat(exchangeAmount) || 0
    if (exchangeFrom === exchangeTo) {
      return amt.toLocaleString(undefined, { maximumFractionDigits: 4 })
    }
    // 注意：API 返回的是相对于 base 的汇率。我们需要将 base 货币作为转换基础
    // 如果 exchangeData.base === exchangeFrom：
    //   result = amt * rates[exchangeTo]
    // 否则：重新计算
    let rate: number
    if (exchangeData.base === exchangeFrom) {
      rate = exchangeData.rates[exchangeTo] || 1
    } else if (exchangeData.base === exchangeTo) {
      rate = 1 / (exchangeData.rates[exchangeFrom] || 1)
    } else {
      // 通过USD或base换算
      const fromBase = exchangeData.rates[exchangeFrom] || 1
      const toBase = exchangeData.rates[exchangeTo] || 1
      rate = toBase / fromBase
    }
    const result = amt * rate
    return result.toLocaleString(undefined, { maximumFractionDigits: 4 })
  }, [exchangeData, exchangeAmount, exchangeFrom, exchangeTo])

  const getCurrencySymbol = (code: string): string => {
    return COMMON_CURRENCIES.find(c => c.code === code)?.symbol || code
  }

  const swapCurrencies = () => {
    const f = exchangeFrom
    setExchangeFrom(exchangeTo)
    setExchangeTo(f)
  }

  // 使用 useMemo 优化按钮样式 - 现代化设计
  const buttonStyles = useMemo(() => ({
    btn: {
      padding: '12px 0',
      fontSize: 18,
      border: 'none',
      background: 'linear-gradient(145deg, #2a2a2a, #252525)',
      color: '#fff',
      cursor: 'pointer',
      borderRadius: 12,
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    },
    op: {
      padding: '12px 0',
      fontSize: 18,
      border: 'none',
      background: 'linear-gradient(145deg, #ff6b35, #f55e24)',
      color: '#fff',
      cursor: 'pointer',
      borderRadius: 12,
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)',
    },
    func: {
      padding: '12px 0',
      fontSize: 14,
      border: 'none',
      background: 'linear-gradient(145deg, #3a3a4a, #333342)',
      color: '#a0a0c0',
      cursor: 'pointer',
      borderRadius: 12,
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    },
    eq: {
      padding: '12px 0',
      fontSize: 18,
      border: 'none',
      background: 'linear-gradient(145deg, #4ade80, #22c55e)',
      color: '#fff',
      cursor: 'pointer',
      borderRadius: 12,
      fontWeight: 'bold',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(74, 222, 128, 0.4)',
    },
    modeToggle: {
      padding: '6px 12px',
      fontSize: 12,
      border: 'none',
      background: 'linear-gradient(145deg, #3a3a4a, #333342)',
      color: '#fff',
      cursor: 'pointer',
      borderRadius: 8,
      transition: 'all 0.2s ease',
    }
  }), [])

  // 如果显示历史记录，渲染历史记录界面 - 现代化设计
  if (showHistory) {
    return (
      <div className="app-container app-calculator" style={{ 
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)', 
        padding: 16, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: '#fff', margin: 0, fontSize: 20, fontWeight: 600 }}>📋 计算历史</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              style={{ 
                padding: '8px 16px', 
                background: 'linear-gradient(145deg, #3a3a4a, #333342)', 
                border: 'none', 
                borderRadius: 8, 
                color: '#fff', 
                cursor: 'pointer',
                fontSize: 13,
                transition: 'all 0.2s ease',
              }}
              onClick={() => setShowHistory(false)}
            >返回</button>
            <button 
              style={{ 
                padding: '8px 16px', 
                background: 'linear-gradient(145deg, #ef4444, #dc2626)', 
                border: 'none', 
                borderRadius: 8, 
                color: '#fff', 
                cursor: 'pointer',
                fontSize: 13,
                transition: 'all 0.2s ease',
              }}
              onClick={clearHistory}
            >清空</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {history.length === 0 ? (
            <div style={{ 
              color: '#888', 
              textAlign: 'center', 
              padding: 40,
              fontSize: 14,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 48 }}>📝</span>
              暂无历史记录
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map((item, index) => (
                <div 
                  key={index}
                  onClick={() => handleFromHistory(item)}
                  style={{
                    background: 'linear-gradient(145deg, #2a2a3a, #252535)',
                    padding: 16,
                    borderRadius: 12,
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ color: '#999', fontSize: 13, marginBottom: 4 }}>{item.expression}</div>
                  <div style={{ 
                    color: '#fff', 
                    fontSize: 20, 
                    fontWeight: 600,
                    background: 'linear-gradient(90deg, #4ade80, #60a5fa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>= {item.result}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app-container app-calculator" style={{ 
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)', 
      padding: 16, 
      height: '100%', 
      overflowY: 'auto' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button
          style={{
            padding: '8px 16px',
            fontSize: 13,
            background: 'linear-gradient(145deg, #3a3a4a, #333342)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setShowHistory(true)}
        >
          📋 历史 ({history.length})
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            style={{
              ...buttonStyles.modeToggle,
              background: mode === 'calc'
                ? 'linear-gradient(145deg, #60a5fa, #3b82f6)'
                : 'linear-gradient(145deg, #3a3a4a, #333342)'
            }}
            onClick={() => setMode('calc')}
          >
            计算器
          </button>
          <button
            style={{
              ...buttonStyles.modeToggle,
              background: mode === 'exchange'
                ? 'linear-gradient(145deg, #f59e0b, #d97706)'
                : 'linear-gradient(145deg, #3a3a4a, #333342)'
            }}
            onClick={() => {
              setMode('exchange')
              fetchExchangeRates(exchangeFrom)
            }}
          >
            💱 汇率
          </button>
          <button
            style={{
              ...buttonStyles.modeToggle,
              display: mode === 'calc' ? 'inline-block' : 'none',
              background: angleMode === 'rad'
                ? 'linear-gradient(145deg, #60a5fa, #3b82f6)'
                : 'linear-gradient(145deg, #3a3a4a, #333342)'
            }}
            onClick={() => setAngleMode(angleMode === 'rad' ? 'deg' : 'rad')}
          >
            {angleMode === 'rad' ? 'Rad' : 'Deg'}
          </button>
        </div>
      </div>

      {mode === 'exchange' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          <div style={{
            background: 'linear-gradient(145deg, #0f0f1a, #0a0a12)',
            borderRadius: 16,
            padding: 20,
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ color: '#aaa', fontSize: 13 }}>源货币</label>
              <select
                value={exchangeFrom}
                onChange={(e) => {
                  const v = e.target.value
                  setExchangeFrom(v)
                  fetchExchangeRates(v)
                }}
                style={{
                  background: '#1a1a2e',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                {COMMON_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <input
              type="number"
              value={exchangeAmount}
              onChange={(e) => setExchangeAmount(e.target.value)}
              placeholder="输入金额"
              style={{
                width: '100%',
                background: 'transparent',
                color: '#fff',
                border: 'none',
                borderBottom: '2px solid #333',
                fontSize: 32,
                fontWeight: 300,
                textAlign: 'right',
                outline: 'none',
                padding: '8px 0',
                letterSpacing: '-1px',
              }}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={swapCurrencies}
              style={{
                background: 'linear-gradient(145deg, #60a5fa, #3b82f6)',
                border: 'none',
                color: '#fff',
                padding: '10px 24px',
                borderRadius: 12,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(96, 165, 250, 0.4)',
                transition: 'all 0.2s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              ⇅ 交换
            </button>
          </div>

          <div style={{
            background: 'linear-gradient(145deg, #0f0f1a, #0a0a12)',
            borderRadius: 16,
            padding: 20,
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ color: '#aaa', fontSize: 13 }}>目标货币</label>
              <select
                value={exchangeTo}
                onChange={(e) => setExchangeTo(e.target.value)}
                style={{
                  background: '#1a1a2e',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                {COMMON_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div style={{
              fontSize: 32,
              fontWeight: 300,
              textAlign: 'right',
              padding: '8px 0',
              color: '#fff',
              letterSpacing: '-1px',
              background: 'linear-gradient(90deg, #4ade80, #60a5fa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {exchangeLoading ? '加载中...' : `${getCurrencySymbol(exchangeTo)} ${getExchangeResult()}`}
            </div>
          </div>

          {exchangeError && (
            <div style={{
              background: 'linear-gradient(145deg, #7c2d12, #431407)',
              color: '#fdba74',
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 13,
              textAlign: 'center',
            }}>
              {exchangeError}
            </div>
          )}

          {exchangeData && !exchangeLoading && (
            <div style={{
              background: 'linear-gradient(145deg, #1f2937, #111827)',
              color: '#9ca3af',
              padding: 12,
              borderRadius: 10,
              fontSize: 12,
              textAlign: 'center',
            }}>
              汇率基准：{exchangeData.base} · 更新于 {new Date(exchangeData.timestamp * 1000).toLocaleString()}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 4 }}>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '1')}>1</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '2')}>2</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '3')}>3</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '4')}>4</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '5')}>5</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '6')}>6</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '7')}>7</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '8')}>8</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '9')}>9</InteractiveButton>
            <InteractiveButton style={buttonStyles.btn} onClick={() => setExchangeAmount(exchangeAmount + '0')}>0</InteractiveButton>
            <InteractiveButton style={buttonStyles.func} onClick={() => setExchangeAmount('')}>清空</InteractiveButton>
            <InteractiveButton style={buttonStyles.func} onClick={() => setExchangeAmount(exchangeAmount.slice(0, -1))}>⌫</InteractiveButton>
            <InteractiveButton style={buttonStyles.func} onClick={() => setExchangeAmount(exchangeAmount + '.')}>.</InteractiveButton>
            <InteractiveButton style={buttonStyles.eq} onClick={() => fetchExchangeRates(exchangeFrom)}>刷新</InteractiveButton>
            <InteractiveButton style={buttonStyles.op} onClick={swapCurrencies}>⇅</InteractiveButton>
          </div>
        </div>
      ) : null}

      {mode === 'calc' && (
        <>
      <div className="app-calc-display" style={{
        background: 'linear-gradient(145deg, #0f0f1a, #0a0a12)',
        borderRadius: 16,
        padding: '20px 16px',
        marginBottom: 16,
        textAlign: 'right',
        minHeight: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ color: '#666', fontSize: 14, minHeight: 22, wordBreak: 'break-all' }}>{expression}</div>
        <div style={{
          color: '#fff',
          fontSize: 40,
          fontWeight: 300,
          wordBreak: 'break-all',
          letterSpacing: '-1px',
        }}>{display}</div>
      </div>

      {/* 第一行：基本功能 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={handleClear}>C</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleClearEntry}>CE</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleBackspace}>⌫</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handlePercent}>%</InteractiveButton>
        <InteractiveButton style={buttonStyles.op} onClick={() => handleOperator('÷')}>÷</InteractiveButton>
      </div>

      {/* 第二行：平方、立方等 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleUnary((x) => x * x)}>x²</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleUnary((x) => x * x * x)}>x³</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleOperator('**')}>xⁿ</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleUnary(Math.sqrt)}>√</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleCubeRoot}>∛</InteractiveButton>
      </div>

      {/* 第三行：三角函数 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleUnary((x) => Math.sin(toRad(x)))}>sin</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleUnary((x) => Math.cos(toRad(x)))}>cos</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleTan}>tan</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleAsin}>sin⁻¹</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleAcos}>cos⁻¹</InteractiveButton>
      </div>

      {/* 第四行：数字7-9和更多函数 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('7')}>7</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('8')}>8</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('9')}>9</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleAtan}>tan⁻¹</InteractiveButton>
        <InteractiveButton style={buttonStyles.op} onClick={() => handleOperator('×')}>×</InteractiveButton>
      </div>

      {/* 第五行：数字4-6和更多函数 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('4')}>4</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('5')}>5</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('6')}>6</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleFactorial}>x!</InteractiveButton>
        <InteractiveButton style={buttonStyles.op} onClick={() => handleOperator('-')}>−</InteractiveButton>
      </div>

      {/* 第六行：数字1-3和更多函数 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.btn} onClick={handleSign}>±</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={() => handleNumber('0')}>0</InteractiveButton>
        <InteractiveButton style={buttonStyles.btn} onClick={handleDecimal}>.</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleAbs}>|x|</InteractiveButton>
        <InteractiveButton style={buttonStyles.op} onClick={() => handleOperator('+')}>+</InteractiveButton>
      </div>

      {/* 第七行：函数 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={handleOpenParen}>(</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleCloseParen}>)</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleConstant(String(Math.PI))}>π</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleConstant(String(Math.E))}>e</InteractiveButton>
        <InteractiveButton style={buttonStyles.eq} onClick={handleEqual}>=</InteractiveButton>
      </div>

      {/* 第八行：三角和幂函数 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleUnary(Math.log)}>ln</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleUnary(Math.log10)}>log</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleExp}>e^x</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handle10x}>10^x</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleReciprocal}>1/x</InteractiveButton>
      </div>

      {/* 第九行：记忆功能 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={handleMemoryClear}>MC</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleMemoryRecall}>MR</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleMemoryAdd}>M+</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleMemorySubtract}>M-</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleSignMemory}>MS</InteractiveButton>
      </div>

      {/* 第十行：进制转换 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={handleBinary}>BIN</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleOctal}>OCT</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleHex}>HEX</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={() => handleFromBase(16)}>FROM</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleMod}>MOD</InteractiveButton>
      </div>

      {/* 第十一行：高级数学函数 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={handleLog2}>LOG2</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleLog1p}>LOG1P</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleExpm1}>EXPM1</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handle10pow}>10^X</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleYx}>Y^X</InteractiveButton>
      </div>
      
      {/* 第十二行：角度转换 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={handleDegrees}>DEG</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleRadians}>RAD</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleFloor}>floor</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleCeil}>ceil</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleRound}>round</InteractiveButton>
      </div>
      
      {/* 第十三行：更多双曲函数 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 8 }}>
        <InteractiveButton style={buttonStyles.func} onClick={handleSinh}>sinh</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleCosh}>cosh</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleTanH}>tanh</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleNthRoot}>NTH</InteractiveButton>
        <InteractiveButton style={buttonStyles.func} onClick={handleAsin}>asin</InteractiveButton>
      </div>
        </>
      )}
    </div>
  )
}
