import { useState, memo, useEffect } from 'react'
import { useStore } from '../store'
import { apiService } from '../services/apiService'

interface ToolTab {
  id: string
  name: string
  icon: string
  description: string
}

const h3TitleStyle = { margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)' } as const

const OnlineToolkitPro = memo(function OnlineToolkitPro() {
  const [activeTab, setActiveTab] = useState<string>('currency')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [history, setHistory] = useState<Array<{ input: string; output: string; timestamp: number }>>([])
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('CNY')
  const [amount, setAmount] = useState('100')
  const [selectedColor, setSelectedColor] = useState('#7c3aed')
  const [selectedText, setSelectedText] = useState('')
  const [unitType, setUnitType] = useState('length')
  const [unitFrom, setUnitFrom] = useState('meter')
  const [unitTo, setUnitTo] = useState('kilometer')
  const [unitValue, setUnitValue] = useState('1000')
  const [passwordInput, setPasswordInput] = useState('')
  const [timestampSeconds, setTimestampSeconds] = useState('')
  const [timestampMs, setTimestampMs] = useState('')
  const [timestampDateInput, setTimestampDateInput] = useState('')
  
  const [emojiCategory, setEmojiCategory] = useState('smile')
  const [emojiSearch, setEmojiSearch] = useState('')
  const [converterType, setConverterType] = useState('json-yaml')
  const [converterInput, setConverterInput] = useState('')
  const [converterOutput, setConverterOutput] = useState('')
  const [regexPattern, setRegexPattern] = useState('')
  const [regexText, setRegexText] = useState('')
  const [regexFlags, setRegexFlags] = useState('g')
  const [hashInput, setHashInput] = useState('')
  const [hashAlgorithm, setHashAlgorithm] = useState('SHA-256')
  const [hashOutput, setHashOutput] = useState('')
  const addNotification = useStore((s) => s.addNotification)

  const tabs: ToolTab[] = [
    { id: 'currency', name: '汇率转换', icon: '💱', description: '实时汇率查询与转换' },
    { id: 'color', name: '颜色工具', icon: '🎨', description: '颜色转换与调色板生成' },
    { id: 'text', name: '文本分析', icon: '📊', description: '文本统计与分析工具' },
    { id: 'network', name: '网络工具', icon: '🌐', description: '网络检测与诊断' },
    { id: 'code', name: '编码工具', icon: '💻', description: '编解码与格式化' },
    { id: 'generator', name: '生成器', icon: '✨', description: '密码/UUID/哈希生成' },
    { id: 'units', name: '单位转换', icon: '📏', description: '长度/重量/温度/体积转换' },
    { id: 'password', name: '密码检测', icon: '🔐', description: '密码强度实时分析' },
    { id: 'timestamp', name: '时间戳', icon: '⏱️', description: '时间戳转换工具' },
    { id: 'emoji', name: '表情符号', icon: '😀', description: 'Emoji 分类浏览与复制' },
    { id: 'converter', name: '格式转换', icon: '🔄', description: 'JSON/YAML/CSV/进制转换' },
    { id: 'regex', name: '正则测试', icon: '🔍', description: '正则表达式测试器' },
    { id: 'hash', name: '哈希工具', icon: '#️⃣', description: 'MD5/SHA 哈希生成' },
  ]

  const currencies = apiService.getSupportedCurrencies()

  // 汇率转换
  const handleConvertCurrency = async () => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      addNotification({ title: '输入错误', message: '请输入有效金额', type: 'error', duration: 2000 })
      return
    }

    setLoading(true)
    try {
      const result = await apiService.convertCurrencyRealTime(numAmount, fromCurrency, toCurrency)
      if (result) {
        setResult(result)
        setOutput(`${numAmount} ${fromCurrency} = ${result.result} ${toCurrency}\n汇率: 1 ${fromCurrency} = ${result.rate} ${toCurrency}\n日期: ${result.date}`)
        addNotification({ title: '转换成功', message: '实时汇率转换完成', type: 'success', duration: 2000 })
      } else {
        setOutput('转换失败，请稍后重试')
      }
    } catch (e) {
      setOutput(`错误: ${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 颜色分析
  const handleAnalyzeColor = () => {
    const rgb = apiService.hexToRGB(selectedColor)
    if (!rgb) {
      addNotification({ title: '输入错误', message: '请输入有效颜色值', type: 'error', duration: 2000 })
      return
    }

    const hsl = apiService.rgbToHSL(rgb.r, rgb.g, rgb.b)
    const contrastColor = apiService.getContrastColor(selectedColor)
    
    const palette = [
      selectedColor,
      apiService.rgbToHex(Math.min(255, rgb.r + 40), rgb.g, rgb.b),
      apiService.rgbToHex(rgb.r, Math.min(255, rgb.g + 40), rgb.b),
      apiService.rgbToHex(rgb.r, rgb.g, Math.min(255, rgb.b + 40)),
      apiService.rgbToHex(Math.max(0, rgb.r - 40), rgb.g, rgb.b),
    ]

    const complementary = apiService.rgbToHex(
      255 - rgb.r,
      255 - rgb.g,
      255 - rgb.b
    )

    setResult({ rgb, hsl, contrastColor, palette, complementary })
    setOutput(`HEX: ${selectedColor.toUpperCase()}\nRGB: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})\nHSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)\n\n对比色: ${contrastColor}\n互补色: ${complementary}\n\n调色板:\n${palette.join('\n')}`)
    addNotification({ title: '分析完成', message: '颜色分析结果已生成', type: 'success', duration: 2000 })
  }

  // 文本分析
  const handleAnalyzeText = () => {
    if (!selectedText.trim()) {
      addNotification({ title: '输入错误', message: '请输入文本内容', type: 'error', duration: 2000 })
      return
    }

    const analysis = apiService.analyzeText(selectedText)
    setResult(analysis)
    setOutput(`字符数: ${analysis.characters}\n不含空格: ${analysis.charactersNoSpaces}\n单词数: ${analysis.words}\n行数: ${analysis.lines}\n段落数: ${analysis.paragraphs}\n预计阅读时间: ${analysis.readingTime} 分钟`)
    addNotification({ title: '分析完成', message: '文本统计结果已生成', type: 'success', duration: 2000 })
  }

  // 网络状态检测
  const handleNetworkCheck = async () => {
    setLoading(true)
    try {
      const online = navigator.onLine
      const conn = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number; rtt?: number } }).connection
      
      const results: string[] = []
      results.push(`在线状态: ${online ? '✅ 在线' : '❌ 离线'}`)
      
      if (conn) {
        results.push(`网络类型: ${conn.effectiveType || '未知'}`)
        results.push(`下行速度: ${conn.downlink ? `${conn.downlink} Mbps` : '未知'}`)
        results.push(`往返时间: ${conn.rtt ? `${conn.rtt} ms` : '未知'}`)
      } else {
        results.push('网络API不可用')
      }

      // 尝试获取IP信息
      const ipInfo = await apiService.fetchIPInfo()
      if (ipInfo) {
        results.push(`\nIP信息:`)
        results.push(`IP地址: ${ipInfo.ip}`)
        if (ipInfo.city) results.push(`城市: ${ipInfo.city}`)
        if (ipInfo.country_name) results.push(`国家: ${ipInfo.country_name}`)
        if (ipInfo.org) results.push(`组织: ${ipInfo.org}`)
      }

      setOutput(results.join('\n'))
      addNotification({ title: '检测完成', message: '网络状态已检测', type: 'success', duration: 2000 })
    } catch (e) {
      setOutput(`检测错误: ${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 在线状态监听
  useEffect(() => {
    const handleOnline = () => {
      addNotification({ title: '网络恢复', message: '已重新连接到网络', type: 'success', duration: 2000 })
    }
    const handleOffline = () => {
      addNotification({ title: '网络中断', message: '已断开网络连接', type: 'warning', duration: 2000 })
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [addNotification])

  // 编码工具
  const handleEncode = (type: string) => {
    if (!input.trim()) {
      addNotification({ title: '输入错误', message: '请输入要编码的内容', type: 'error', duration: 2000 })
      return
    }

    try {
      let result = ''
      switch (type) {
        case 'base64':
          result = input.startsWith('base64:') 
            ? apiService.base64Decode(input.replace('base64:', ''))
            : apiService.base64Encode(input)
          break
        case 'url':
          result = input.startsWith('decoded:')
            ? apiService.urlDecode(input.replace('decoded:', ''))
            : apiService.urlEncode(input)
          break
        case 'json':
          result = apiService.formatJSON(input)
          break
        case 'json-min':
          result = apiService.minifyJSON(input)
          break
        case 'uuid':
          result = apiService.generateUUID()
          break
        case 'timestamp':
          result = apiService.formatTimestamp(Date.now(), 'absolute')
          break
        case 'password':
          result = apiService.generateStrongPassword(parseInt(input) || 16)
          break
        case 'hash-info':
          result = JSON.stringify(apiService.getHttpStatusInfo(parseInt(input) || 200), null, 2)
          break
        default:
          result = '未知操作'
      }
      setOutput(result)
      setHistory(prev => [{ input, output: result, timestamp: Date.now() }, ...prev].slice(0, 10))
      addNotification({ title: '执行成功', message: `${type} 操作完成`, type: 'success', duration: 2000 })
    } catch (e) {
      setOutput(`错误: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  // 单位转换
  const handleConvertUnits = () => {
    const numValue = parseFloat(unitValue)
    if (isNaN(numValue)) {
      addNotification({ title: '输入错误', message: '请输入有效数值', type: 'error', duration: 2000 })
      return
    }
    const result = apiService.convertUnits(numValue, unitFrom, unitTo)
    if (result !== null) {
      setResult({ value: result, from: unitFrom, to: unitTo })
      setOutput(`${numValue} ${unitLabels[unitFrom] || unitFrom} = ${result} ${unitLabels[unitTo] || unitTo}`)
      addNotification({ title: '转换成功', message: '单位转换完成', type: 'success', duration: 2000 })
    } else {
      setOutput('转换失败，请检查单位选择')
    }
  }

  // 密码生成
  const handleGeneratePassword = () => {
    const pwd = apiService.generateStrongPassword(16)
    setPasswordInput(pwd)
    addNotification({ title: '生成成功', message: '强密码已生成', type: 'success', duration: 2000 })
  }

  // 时间戳转换
  const handleTimestampToDate = () => {
    const ts = parseFloat(timestampSeconds)
    if (isNaN(ts)) {
      addNotification({ title: '输入错误', message: '请输入有效时间戳', type: 'error', duration: 2000 })
      return
    }
    const ms = ts < 1e12 ? ts * 1000 : ts
    setTimestampMs(String(ms))
    const date = new Date(ms)
    setOutput(`时间戳: ${ts}\n日期: ${date.toLocaleString('zh-CN')}\nISO: ${date.toISOString()}\n相对: ${apiService.formatTimestamp(ms, 'relative')}`)
  }

  const handleDateToTimestamp = () => {
    if (!timestampDateInput) {
      addNotification({ title: '输入错误', message: '请选择日期', type: 'error', duration: 2000 })
      return
    }
    const date = new Date(timestampDateInput)
    const sec = Math.floor(date.getTime() / 1000)
    setTimestampSeconds(String(sec))
    setTimestampMs(String(date.getTime()))
    setOutput(`日期: ${date.toLocaleString('zh-CN')}\n秒级时间戳: ${sec}\n毫秒时间戳: ${date.getTime()}`)
  }

  const handleGetCurrentTimestamp = () => {
    const now = Date.now()
    setTimestampSeconds(String(Math.floor(now / 1000)))
    setTimestampMs(String(now))
    setOutput(`当前时间戳:\n秒: ${Math.floor(now / 1000)}\n毫秒: ${now}\n日期: ${new Date(now).toLocaleString('zh-CN')}`)
  }

  // 数据格式转换
  const handleConverter = () => {
    if (!converterInput.trim()) {
      addNotification({ title: '输入错误', message: '请输入要转换的内容', type: 'error', duration: 2000 })
      return
    }
    try {
      let result = ''
      switch (converterType) {
        case 'json-yaml':
          result = jsonToYaml(converterInput)
          break
        case 'yaml-json':
          result = yamlToJson(converterInput)
          break
        case 'json-csv':
          result = jsonToCsv(converterInput)
          break
        case 'csv-json':
          result = csvToJson(converterInput)
          break
        case 'bin-dec':
          result = String(parseInt(converterInput, 2))
          break
        case 'oct-dec':
          result = String(parseInt(converterInput, 8))
          break
        case 'hex-dec':
          result = String(parseInt(converterInput, 16))
          break
        case 'dec-bin':
          result = (parseInt(converterInput, 10) >>> 0).toString(2)
          break
        case 'dec-oct':
          result = (parseInt(converterInput, 10) >>> 0).toString(8)
          break
        case 'dec-hex':
          result = (parseInt(converterInput, 10) >>> 0).toString(16).toUpperCase()
          break
        default:
          result = '未知转换类型'
      }
      setOutput(result)
      setConverterOutput(result)
      addNotification({ title: '转换成功', message: '格式转换完成', type: 'success', duration: 2000 })
    } catch (e) {
      setOutput(`转换错误: ${e instanceof Error ? e.message : '无效输入'}`)
    }
  }

  // 正则测试
  const handleRegexTest = () => {
    if (!regexPattern) {
      addNotification({ title: '输入错误', message: '请输入正则表达式', type: 'error', duration: 2000 })
      return
    }
    try {
      const regex = new RegExp(regexPattern, regexFlags)
      const matches: string[] = []
      let match
      if (regexFlags.includes('g')) {
        while ((match = regex.exec(regexText)) !== null) {
          matches.push(match[0])
          if (match.index === regex.lastIndex) regex.lastIndex++
        }
      } else {
        match = regex.exec(regexText)
        if (match) matches.push(match[0])
      }
      setResult({ matches, count: matches.length })
      setOutput(`匹配数: ${matches.length}\n匹配内容: ${matches.join(', ') || '无'}`)
    } catch (e) {
      setOutput(`正则错误: ${e instanceof Error ? e.message : '无效的正则表达式'}`)
    }
  }

  // 哈希生成
  const handleHashGenerate = async () => {
    if (!hashInput) {
      addNotification({ title: '输入错误', message: '请输入要哈希的内容', type: 'error', duration: 2000 })
      return
    }
    setLoading(true)
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(hashInput)
      const algorithm = hashAlgorithm.toLowerCase().replace('-', '')
      const hashBuffer = await crypto.subtle.digest(algorithm, data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      setHashOutput(hashHex)
      setOutput(hashHex)
      addNotification({ title: '生成成功', message: `${hashAlgorithm} 哈希已生成`, type: 'success', duration: 2000 })
    } catch (e) {
      setOutput(`哈希错误: ${e instanceof Error ? e.message : '不支持的算法'}`)
    } finally {
      setLoading(false)
    }
  }

  // 单位标签映射
  const unitLabels: Record<string, string> = {
    meter: '米', kilometer: '千米', centimeter: '厘米', millimeter: '毫米',
    mile: '英里', yard: '码', foot: '英尺', inch: '英寸',
    kilogram: '千克', gram: '克', milligram: '毫克',
    pound: '磅', ounce: '盎司', ton: '公吨',
    celsius: '摄氏度', fahrenheit: '华氏度', kelvin: '开尔文',
    liter: '升', milliliter: '毫升', gallon: '加仑',
    quart: '夸脱', cup: '杯'
  }

  const unitOptions: Record<string, string[]> = {
    length: ['meter', 'kilometer', 'centimeter', 'millimeter', 'mile', 'yard', 'foot', 'inch'],
    weight: ['kilogram', 'gram', 'milligram', 'pound', 'ounce', 'ton'],
    temperature: ['celsius', 'fahrenheit', 'kelvin'],
    volume: ['liter', 'milliliter', 'gallon', 'quart', 'cup']
  }

  // Emoji 数据
  const emojiData: Record<string, string[]> = {
    smile: ['smile1','smile2','smile3','smile4','smile5','smile6','smile7','smile8','smile9','smile10','smile11','smile12','smile13','smile14','smile15','smile16','smile17','smile18','smile19','smile20','smile21','smile22','smile23','smile24','smile25','smile26','smile27','smile28','smile29','smile30','smile31','smile32','smile33','smile34','smile35','smile36','smile37','smile38','smile39','smile40','smile41','smile42','smile43','smile44','smile45','smile46','smile47','smile48','smile49','smile50','smile51','smile52','smile53','smile54','smile55','smile56','smile57','smile58']
    , gesture: ['gesture1','gesture2','gesture3','gesture4','gesture5','gesture6','gesture7','gesture8','gesture9','gesture10','gesture11','gesture12','gesture13','gesture14','gesture15','gesture16','gesture17','gesture18','gesture19','gesture20','gesture21','gesture22','gesture23','gesture24','gesture25','gesture26','gesture27','gesture28','gesture29','gesture30','gesture31','gesture32','gesture33','gesture34']
    , heart: ['heart1','heart2','heart3','heart4','heart5','heart6','heart7','heart8','heart9','heart10','heart11','heart12','heart13','heart14','heart15','heart16','heart17','heart18','heart19','heart20']
    , animal: ['animal1','animal2','animal3','animal4','animal5','animal6','animal7','animal8','animal9','animal10','animal11','animal12','animal13','animal14','animal15','animal16','animal17','animal18','animal19','animal20','animal21','animal22','animal23','animal24','animal25','animal26','animal27','animal28','animal29','animal30','animal31','animal32','animal33','animal34','animal35','animal36','animal37','animal38','animal39','animal40','animal41','animal42','animal43','animal44','animal45','animal46','animal47','animal48','animal49','animal50','animal51','animal52','animal53','animal54','animal55','animal56','animal57','animal58','animal59','animal60','animal61','animal62','animal63','animal64','animal65','animal66','animal67']
    , food: ['food1','food2','food3','food4','food5','food6','food7','food8','food9','food10','food11','food12','food13','food14','food15','food16','food17','food18','food19','food20','food21','food22','food23','food24','food25','food26','food27','food28','food29','food30','food31','food32','food33','food34','food35','food36','food37','food38','food39','food40','food41','food42','food43','food44','food45','food46','food47','food48','food49','food50','food51','food52','food53','food54','food55','food56','food57','food58','food59','food60','food61','food62','food63','food64','food65','food66','food67','food68','food69','food70','food71','food72','food73','food74','food75','food76','food77','food78','food79','food80','food81','food82','food83','food84','food85','food86','food87','food88','food89','food90','food91','food92','food93','food94','food95','food96','food97','food98','food99','food100','food101','food102','food103']
    , symbol: ['symbol1','symbol2','symbol3','symbol4','symbol5','symbol6','symbol7','symbol8','symbol9','symbol10','symbol11','symbol12','symbol13','symbol14','symbol15','symbol16','symbol17','symbol18','symbol19','symbol20','symbol21','symbol22','symbol23','symbol24','symbol25','symbol26','symbol27','symbol28','symbol29','symbol30','symbol31','symbol32','symbol33','symbol34','symbol35','symbol36','symbol37','symbol38','symbol39','symbol40','symbol41','symbol42','symbol43','symbol44','symbol45','symbol46','symbol47','symbol48','symbol49','symbol50','symbol51','symbol52','symbol53','symbol54','symbol55','symbol56','symbol57','symbol58','symbol59','symbol60','symbol61','symbol62','symbol63','symbol64','symbol65','symbol66','symbol67','symbol68','symbol69','symbol70','symbol71','symbol72','symbol73','symbol74','symbol75','symbol76','symbol77','symbol78','symbol79','symbol80','symbol81','symbol82','symbol83','symbol84','symbol85','symbol86']
  }

  const emojiCategories = [
    { id: 'smile', name: '笑脸', icon: '😀' },
    { id: 'gesture', name: '手势', icon: '👍' },
    { id: 'heart', name: '爱心', icon: '❤️' },
    { id: 'animal', name: '动物', icon: '🐶' },
    { id: 'food', name: '食物', icon: '🍎' },
    { id: 'symbol', name: '符号', icon: '⭐' }
  ]

  // JSON ↔ YAML 简易转换
  const jsonToYaml = (jsonStr: string): string => {
    try {
      const obj = JSON.parse(jsonStr)
      const toYaml = (node: any, indent: number = 0): string => {
        const spaces = ' '.repeat(indent)
        if (node === null || node === undefined) return 'null'
        if (typeof node === 'string') return `"${node}"`
        if (typeof node === 'number' || typeof node === 'boolean') return String(node)
        if (Array.isArray(node)) {
          if (node.length === 0) return '[]'
          return '\n' + node.map(item => {
            const val = toYaml(item, indent + 2)
            if (typeof item === 'object' && item !== null) {
              return `${spaces}-${val.startsWith('\n') ? val : ' ' + val}`
            }
            return `${spaces}- ${val}`
          }).join('\n')
        }
        if (typeof node === 'object') {
          const keys = Object.keys(node)
          if (keys.length === 0) return '{}'
          return '\n' + keys.map(key => {
            const val = toYaml(node[key], indent + 2)
            if (typeof node[key] === 'object' && node[key] !== null) {
              return `${spaces}${key}:${val.startsWith('\n') ? val : ' ' + val}`
            }
            return `${spaces}${key}: ${val}`
          }).join('\n')
        }
        return String(node)
      }
      return toYaml(obj).trim()
    } catch {
      return '无效的 JSON 字符串'
    }
  }

  const yamlToJson = (yamlStr: string): string => {
    try {
      const lines = yamlStr.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'))
      const parseValue = (val: string): any => {
        val = val.trim()
        if (val === 'null' || val === '~') return null
        if (val === 'true') return true
        if (val === 'false') return false
        if (!isNaN(Number(val))) return Number(val)
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          return val.slice(1, -1)
        }
        return val
      }
      const root: any = {}
      const stack: Array<{ indent: number; obj: any }> = [{ indent: -1, obj: root }]
      for (const line of lines) {
        const trimmed = line.replace(/\s+$/, '')
        if (!trimmed.trim()) continue
        const indent = trimmed.length - trimmed.trimStart().length
        while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
          stack.pop()
        }
        const current = stack[stack.length - 1].obj
        if (trimmed.trimStart().startsWith('- ')) {
          const val = parseValue(trimmed.trimStart().slice(2))
          if (Array.isArray(current)) {
            current.push(val)
          }
          continue
        }
        const colonIdx = trimmed.indexOf(':')
        if (colonIdx === -1) continue
        const key = trimmed.slice(0, colonIdx).trim()
        const valStr = trimmed.slice(colonIdx + 1).trim()
        if (valStr === '') {
          const newObj: any = {}
          current[key] = newObj
          stack.push({ indent, obj: newObj })
        } else {
          current[key] = parseValue(valStr)
        }
      }
      return JSON.stringify(root, null, 2)
    } catch {
      return '无效的 YAML 字符串'
    }
  }

  // JSON ↔ CSV 转换
  const jsonToCsv = (jsonStr: string): string => {
    try {
      const data = JSON.parse(jsonStr)
      if (!Array.isArray(data) || data.length === 0) return '需要 JSON 数组且非空'
      const headers = Object.keys(data[0])
      const escapeCsv = (val: any): string => {
        const str = String(val ?? '')
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }
      const rows = [headers.join(',')]
      for (const row of data) {
        rows.push(headers.map(h => escapeCsv(row[h])).join(','))
      }
      return rows.join('\n')
    } catch {
      return '无效的 JSON 数组'
    }
  }

  const csvToJson = (csvStr: string): string => {
    try {
      const lines = csvStr.split('\n').filter(l => l.trim())
      if (lines.length < 2) return '需要至少两行数据（表头+数据）'
      const parseCsvLine = (line: string): string[] => {
        const result: string[] = []
        let i = 0
        while (i < line.length) {
          if (line[i] === '"') {
            let field = ''
            i++
            while (i < line.length) {
              if (line[i] === '"' && line[i + 1] === '"') {
                field += '"'
                i += 2
              } else if (line[i] === '"') {
                i++
                break
              } else {
                field += line[i]
                i++
              }
            }
            result.push(field)
            if (i < line.length && line[i] === ',') i++
          } else {
            let field = ''
            while (i < line.length && line[i] !== ',') {
              field += line[i]
              i++
            }
            result.push(field)
            if (i < line.length && line[i] === ',') i++
          }
        }
        return result
      }
      const headers = parseCsvLine(lines[0])
      const data = []
      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i])
        const obj: Record<string, any> = {}
        headers.forEach((h, idx) => {
          const v = values[idx] ?? ''
          const num = Number(v)
          obj[h] = v === '' ? '' : (!isNaN(num) && v !== '' ? num : v)
        })
        data.push(obj)
      }
      return JSON.stringify(data, null, 2)
    } catch {
      return '无效的 CSV 数据'
    }
  }

  const renderCurrencyTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        padding: '20px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px'
      }}>
        <h3 style={h3TitleStyle}>
          💱 实时汇率转换
        </h3>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>金额</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--window-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              style={{
                padding: '10px 12px',
                background: 'var(--window-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            >
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            
            <span style={{ fontSize: '18px' }}>→</span>
            
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              style={{
                padding: '10px 12px',
                background: 'var(--window-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            >
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={handleConvertCurrency}
          disabled={loading}
          style={{
            marginTop: '16px',
            padding: '10px 24px',
            background: loading ? 'var(--border-color)' : 'var(--accent-gradient)',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: 'white',
            transition: 'all 0.2s',
            width: '100%'
          }}
        >
          {loading ? '转换中...' : '转换'}
        </button>
      </div>

      {result && (
        <div style={{
          padding: '16px',
          background: 'var(--accent-bg)',
          border: '1px solid var(--accent)',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>
            {result.result} {toCurrency}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            汇率: 1 {fromCurrency} = {result.rate} {toCurrency}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            数据更新: {result.date}
          </div>
        </div>
      )}

      <div style={{
        padding: '16px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        display: 'flex',
        gap: '12px'
      }}>
        <button
          onClick={() => {
            const temp = fromCurrency
            setFromCurrency(toCurrency)
            setToCurrency(temp)
          }}
          style={{
            flex: 1,
            padding: '8px',
            background: 'var(--window-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontSize: '12px'
          }}
        >
          🔄 交换货币
        </button>
        <button
          onClick={() => {
            setAmount('1')
            setFromCurrency('USD')
            setToCurrency('CNY')
          }}
          style={{
            flex: 1,
            padding: '8px',
            background: 'var(--window-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontSize: '12px'
          }}
        >
          ⚡ 重置
        </button>
      </div>
    </div>
  )

  const renderColorTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        padding: '20px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px'
      }}>
        <h3 style={h3TitleStyle}>
          🎨 颜色工具
        </h3>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            style={{
              width: '80px',
              height: '80px',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              background: 'transparent'
            }}
          />
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              placeholder="#7c3aed"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--window-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
            />
            <button
              onClick={handleAnalyzeColor}
              style={{
                marginTop: '8px',
                padding: '8px 16px',
                background: 'var(--accent-gradient)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                color: 'white',
                width: '100%'
              }}
            >
              分析颜色
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div style={{
          padding: '16px',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{
              padding: '8px 12px',
              background: selectedColor,
              color: apiService.getContrastColor(selectedColor),
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 500
            }}>
              主色 {selectedColor.toUpperCase()}
            </div>
            <div style={{
              padding: '8px 12px',
              background: apiService.rgbToHex(255 - result.rgb.r, 255 - result.rgb.g, 255 - result.rgb.b),
              color: apiService.getContrastColor(apiService.rgbToHex(255 - result.rgb.r, 255 - result.rgb.g, 255 - result.rgb.b)),
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 500
            }}>
              互补色
            </div>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {result.palette.map((color: string, i: number) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '40px',
                  background: color,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: apiService.getContrastColor(color)
                }}
                title={color}
              >
                {color}
              </div>
            ))}
          </div>

          <div style={{
            padding: '12px',
            background: 'var(--window-bg)',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap'
          }}>
            {output}
          </div>
        </div>
      )}
    </div>
  )

  const renderTextTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        padding: '20px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px'
      }}>
        <h3 style={h3TitleStyle}>
          📊 文本分析
        </h3>

        <textarea
          value={selectedText}
          onChange={(e) => setSelectedText(e.target.value)}
          placeholder="在此输入或粘贴文本进行分析..."
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '12px',
            background: 'var(--window-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />

        <button
          onClick={handleAnalyzeText}
          style={{
            marginTop: '12px',
            padding: '10px 24px',
            background: 'var(--accent-gradient)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: 'white',
            width: '100%'
          }}
        >
          分析文本
        </button>
      </div>

      {result && (
        <div style={{
          padding: '16px',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px'
        }}>
          <StatCard label="字符数" value={result.characters} />
          <StatCard label="不含空格" value={result.charactersNoSpaces} />
          <StatCard label="单词数" value={result.words} />
          <StatCard label="行数" value={result.lines} />
          <StatCard label="段落数" value={result.paragraphs} />
          <StatCard label="阅读时间" value={`${result.readingTime} 分钟`} />
        </div>
      )}
    </div>
  )

  const renderNetworkTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        padding: '20px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px'
      }}>
        <h3 style={h3TitleStyle}>
          🌐 网络工具
        </h3>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{
            flex: 1,
            padding: '12px',
            background: navigator.onLine ? 'var(--accent-bg)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${navigator.onLine ? 'var(--accent)' : '#ef4444'}`,
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px' }}>{navigator.onLine ? '✅' : '❌'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
              {navigator.onLine ? '在线' : '离线'}
            </div>
          </div>
          <div style={{
            flex: 1,
            padding: '12px',
            background: 'var(--window-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px' }}>⚡</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
              {(() => {
                const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection
                return conn?.effectiveType || '未知'
              })()}
            </div>
          </div>
          <div style={{
            flex: 1,
            padding: '12px',
            background: 'var(--window-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px' }}>📶</div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
              {(() => {
                const conn = (navigator as Navigator & { connection?: { downlink?: number } }).connection
                return conn?.downlink ? `${conn.downlink} Mbps` : '未知'
              })()}
            </div>
          </div>
        </div>

        <button
          onClick={handleNetworkCheck}
          disabled={loading}
          style={{
            padding: '10px 24px',
            background: loading ? 'var(--border-color)' : 'var(--accent-gradient)',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: 'white',
            width: '100%'
          }}
        >
          {loading ? '检测中...' : '🔍 检测网络状态'}
        </button>
      </div>

      {output && (
        <div style={{
          padding: '16px',
          background: 'var(--window-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          fontSize: '13px',
          fontFamily: 'monospace',
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap'
        }}>
          {output}
        </div>
      )}
    </div>
  )

  const renderCodeTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        padding: '20px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px'
      }}>
        <h3 style={h3TitleStyle}>
          💻 编码工具
        </h3>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入内容..."
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '10px',
            background: 'var(--window-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontFamily: 'monospace',
            resize: 'vertical'
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '12px' }}>
          <ToolButton label="Base64" onClick={() => handleEncode('base64')} />
          <ToolButton label="URL编码" onClick={() => handleEncode('url')} />
          <ToolButton label="JSON格式化" onClick={() => handleEncode('json')} />
          <ToolButton label="JSON压缩" onClick={() => handleEncode('json-min')} />
        </div>
      </div>

      <div style={{
        padding: '16px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>输出结果</span>
          {output && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(output)
                addNotification({ title: '已复制', message: '结果已复制到剪贴板', type: 'success', duration: 2000 })
              }}
              style={{
                padding: '4px 12px',
                background: 'var(--window-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                color: 'var(--text-secondary)'
              }}
            >
              复制
            </button>
          )}
        </div>
        <div style={{
          padding: '12px',
          background: 'var(--window-bg)',
          borderRadius: '8px',
          fontSize: '13px',
          fontFamily: 'monospace',
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          minHeight: '60px'
        }}>
          {output || '等待输入...'}
        </div>
      </div>
    </div>
  )

  const renderGeneratorTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        padding: '20px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px'
      }}>
        <h3 style={h3TitleStyle}>
          ✨ 生成器
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <GeneratorButton
            label="UUID"
            icon="🔑"
            onClick={() => handleEncode('uuid')}
          />
          <GeneratorButton
            label="时间戳"
            icon="⏰"
            onClick={() => handleEncode('timestamp')}
          />
          <GeneratorButton
            label="密码"
            icon="🔒"
            onClick={() => handleEncode('password')}
          />
          <GeneratorButton
            label="HTTP状态码"
            icon="🌐"
            onClick={() => {
              const code = prompt('输入HTTP状态码:', '200')
              if (code) handleEncode('hash-info')
            }}
          />
        </div>
      </div>

      {output && (
        <div style={{
          padding: '16px',
          background: 'var(--accent-bg)',
          border: '1px solid var(--accent)',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            生成结果
          </div>
          <div style={{
            fontSize: '13px',
            fontFamily: 'monospace',
            color: 'var(--text-primary)',
            wordBreak: 'break-all'
          }}>
            {output}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(output)
              addNotification({ title: '已复制', message: '结果已复制到剪贴板', type: 'success', duration: 2000 })
            }}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: 'var(--accent-gradient)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              color: 'white'
            }}
          >
            📋 复制结果
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div style={{
          padding: '16px',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            📜 历史记录 (最近{history.length}条)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '150px', overflow: 'auto' }}>
            {history.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '8px',
                  background: 'var(--window-bg)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  marginRight: '8px'
                }}>
                  {item.output.slice(0, 50)}
                </span>
                <span style={{ fontSize: '10px' }}>
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderUnitsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        padding: '20px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px'
      }}>
        <h3 style={h3TitleStyle}>
          📏 单位转换
        </h3>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>单位类型</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {Object.keys(unitOptions).map(type => (
              <button
                key={type}
                onClick={() => {
                  setUnitType(type)
                  setUnitFrom(unitOptions[type][0])
                  setUnitTo(unitOptions[type][1] || unitOptions[type][0])
                }}
                style={{
                  padding: '6px 14px',
                  background: unitType === type ? 'var(--accent-gradient)' : 'var(--window-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: unitType === type ? 'white' : 'var(--text-primary)',
                  fontSize: '12px'
                }}
              >
                {({ length: '长度', weight: '重量', temperature: '温度', volume: '体积' } as Record<string, string>)[type]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '100px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>数值</label>
            <input
              type="number"
              value={unitValue}
              onChange={(e) => setUnitValue(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--window-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={unitFrom}
              onChange={(e) => setUnitFrom(e.target.value)}
              style={{
                padding: '10px 12px',
                background: 'var(--window-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            >
              {unitOptions[unitType].map(u => <option key={u} value={u}>{unitLabels[u]}</option>)}
            </select>
            <span style={{ fontSize: '18px' }}>→</span>
            <select
              value={unitTo}
              onChange={(e) => setUnitTo(e.target.value)}
              style={{
                padding: '10px 12px',
                background: 'var(--window-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            >
              {unitOptions[unitType].map(u => <option key={u} value={u}>{unitLabels[u]}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={handleConvertUnits}
          style={{
            marginTop: '16px',
            padding: '10px 24px',
            background: 'var(--accent-gradient)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: 'white',
            width: '100%'
          }}
        >
          转换
        </button>
      </div>

      {result && (
        <div style={{
          padding: '16px',
          background: 'var(--accent-bg)',
          border: '1px solid var(--accent)',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>
            {result.value} {unitLabels[result.to]}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {unitValue} {unitLabels[result.from]} = {result.value} {unitLabels[result.to]}
          </div>
        </div>
      )}
    </div>
  )

  const renderPasswordTab = () => {
    const analysis = passwordInput ? apiService.analyzePasswordStrength(passwordInput) : null
    const getScoreColor = (score: number) => {
      if (score >= 80) return '#22c55e'
      if (score >= 65) return '#84cc16'
      if (score >= 45) return '#eab308'
      if (score >= 25) return '#f97316'
      return '#ef4444'
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          padding: '20px',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px'
        }}>
          <h3 style={h3TitleStyle}>
            🔐 密码强度检测
          </h3>

          <input
            type="text"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="输入密码进行强度检测..."
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--window-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          />

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={handleGeneratePassword}
              style={{
                flex: 1,
                padding: '10px',
                background: 'var(--accent-gradient)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                color: 'white'
              }}
            >
              ✨ 生成强密码
            </button>
            {passwordInput && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(passwordInput)
                  addNotification({ title: '已复制', message: '密码已复制到剪贴板', type: 'success', duration: 2000 })
                }}
                style={{
                  padding: '10px 16px',
                  background: 'var(--window-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--text-primary)'
                }}
              >
                📋 复制
              </button>
            )}
          </div>
        </div>

        {analysis && (
          <div style={{
            padding: '16px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: getScoreColor(analysis.score),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                fontWeight: 700
              }}>
                {analysis.score}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: getScoreColor(analysis.score) }}>
                  {analysis.label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  强度分数: {analysis.score} / 100
                </div>
                <div style={{
                  height: '6px',
                  background: 'var(--window-bg)',
                  borderRadius: '3px',
                  marginTop: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${analysis.score}%`,
                    background: getScoreColor(analysis.score),
                    borderRadius: '3px',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{
                padding: '10px',
                background: 'var(--window-bg)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>{analysis.entropy}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>熵值 (bits)</div>
              </div>
              <div style={{
                padding: '10px',
                background: 'var(--window-bg)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>{passwordInput.length}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>密码长度</div>
              </div>
            </div>

            {analysis.suggestions.length > 0 && (
              <div style={{
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '6px' }}>💡 改进建议</div>
                {analysis.suggestions.map((s, i) => (
                  <div key={i} style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '2px 0' }}>
                    • {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderTimestampTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        padding: '20px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px'
      }}>
        <h3 style={h3TitleStyle}>
          ⏱️ 时间戳工具
        </h3>

        <button
          onClick={handleGetCurrentTimestamp}
          style={{
            width: '100%',
            padding: '12px',
            background: 'var(--accent-gradient)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: 'white',
            marginBottom: '16px'
          }}
        >
          🕐 获取当前时间戳
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>秒级时间戳</label>
            <input
              type="text"
              value={timestampSeconds}
              onChange={(e) => setTimestampSeconds(e.target.value)}
              placeholder="秒"
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--window-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontFamily: 'monospace'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>毫秒时间戳</label>
            <input
              type="text"
              value={timestampMs}
              onChange={(e) => setTimestampMs(e.target.value)}
              placeholder="毫秒"
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--window-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontFamily: 'monospace'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={handleTimestampToDate}
            style={{
              flex: 1,
              padding: '10px',
              background: 'var(--window-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: '13px'
            }}
          >
            🔄 时间戳 → 日期
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>日期转时间戳</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="datetime-local"
              value={timestampDateInput}
              onChange={(e) => setTimestampDateInput(e.target.value)}
              style={{
                flex: 1,
                padding: '10px',
                background: 'var(--window-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}
            />
            <button
              onClick={handleDateToTimestamp}
              style={{
                padding: '10px 16px',
                background: 'var(--accent-gradient)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'white',
                fontSize: '13px'
              }}
            >
              转换
            </button>
          </div>
        </div>
      </div>

      {output && (
        <div style={{
          padding: '16px',
          background: 'var(--window-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          fontSize: '13px',
          fontFamily: 'monospace',
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap'
        }}>
          {output}
        </div>
      )}
    </div>
  )

  const renderEmojiTab = () => {
    const filteredEmojis = (emojiData[emojiCategory] || []).filter(e =>
      emojiSearch ? e.includes(emojiSearch) : true
    )

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          padding: '20px',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px'
        }}>
          <h3 style={h3TitleStyle}>
            😀 表情符号
          </h3>

          <input
            type="text"
            value={emojiSearch}
            onChange={(e) => setEmojiSearch(e.target.value)}
            placeholder="搜索表情符号..."
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'var(--window-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              marginBottom: '12px'
            }}
          />

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {emojiCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setEmojiCategory(cat.id)}
                style={{
                  padding: '6px 12px',
                  background: emojiCategory === cat.id ? 'var(--accent-gradient)' : 'var(--window-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: emojiCategory === cat.id ? 'white' : 'var(--text-primary)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{
          padding: '16px',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            点击表情符号复制到剪贴板 (共 {filteredEmojis.length} 个)
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
            gap: '8px',
            maxHeight: '300px',
            overflow: 'auto'
          }}>
            {filteredEmojis.map((emoji, i) => (
              <button
                key={`${emoji}-${i}`}
                onClick={() => {
                  navigator.clipboard.writeText(emoji)
                  addNotification({ title: '已复制', message: `${emoji} 已复制`, type: 'success', duration: 1500 })
                }}
                style={{
                  padding: '8px',
                  background: 'var(--window-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '22px',
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.2)'
                  e.currentTarget.style.background = 'var(--accent-bg)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.background = 'var(--window-bg)'
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderConverterTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        padding: '20px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px'
      }}>
        <h3 style={h3TitleStyle}>
          🔄 数据格式转换
        </h3>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {[
            { id: 'json-yaml', label: 'JSON → YAML' },
            { id: 'yaml-json', label: 'YAML → JSON' },
            { id: 'json-csv', label: 'JSON → CSV' },
            { id: 'csv-json', label: 'CSV → JSON' },
            { id: 'bin-dec', label: '二进制 → 十进制' },
            { id: 'oct-dec', label: '八进制 → 十进制' },
            { id: 'hex-dec', label: '十六进制 → 十进制' },
            { id: 'dec-bin', label: '十进制 → 二进制' },
            { id: 'dec-oct', label: '十进制 → 八进制' },
            { id: 'dec-hex', label: '十进制 → 十六进制' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setConverterType(opt.id)}
              style={{
                padding: '6px 12px',
                background: converterType === opt.id ? 'var(--accent-gradient)' : 'var(--window-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                color: converterType === opt.id ? 'white' : 'var(--text-primary)',
                fontSize: '11px'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <textarea
          value={converterInput}
          onChange={(e) => setConverterInput(e.target.value)}
          placeholder="输入要转换的内容..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '10px',
            background: 'var(--window-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontFamily: 'monospace',
            resize: 'vertical'
          }}
        />

        <button
          onClick={handleConverter}
          style={{
            marginTop: '12px',
            padding: '10px 24px',
            background: 'var(--accent-gradient)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: 'white',
            width: '100%'
          }}
        >
          转换
        </button>
      </div>

      {converterOutput && (
        <div style={{
          padding: '16px',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>转换结果</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(converterOutput)
                addNotification({ title: '已复制', message: '结果已复制到剪贴板', type: 'success', duration: 2000 })
              }}
              style={{
                padding: '4px 12px',
                background: 'var(--window-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                color: 'var(--text-secondary)'
              }}
            >
              复制
            </button>
          </div>
          <pre style={{
            padding: '12px',
            background: 'var(--window-bg)',
            borderRadius: '8px',
            fontSize: '13px',
            fontFamily: 'monospace',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
            maxHeight: '300px',
            margin: 0
          }}>
            {converterOutput}
          </pre>
        </div>
      )}
    </div>
  )

  const renderRegexTab = () => {
    const getHighlightedText = (): Array<{ text: string; match: boolean }> => {
      if (!regexPattern || !regexText) return [{ text: regexText, match: false }]
      try {
        const regex = new RegExp(regexPattern, regexFlags.includes('g') ? regexFlags : regexFlags + 'g')
        const parts: Array<{ text: string; match: boolean }> = []
        let lastIndex = 0
        let match
        while ((match = regex.exec(regexText)) !== null) {
          if (match.index > lastIndex) {
            parts.push({ text: regexText.slice(lastIndex, match.index), match: false })
          }
          parts.push({ text: match[0], match: true })
          lastIndex = regex.lastIndex
          if (match.index === regex.lastIndex) regex.lastIndex++
        }
        if (lastIndex < regexText.length) {
          parts.push({ text: regexText.slice(lastIndex), match: false })
        }
        return parts
      } catch {
        return [{ text: regexText, match: false }]
      }
    }

    const highlightedText = getHighlightedText()

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          padding: '20px',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px'
        }}>
          <h3 style={h3TitleStyle}>
            🔍 正则表达式测试器
          </h3>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>正则表达式</label>
              <input
                type="text"
                value={regexPattern}
                onChange={(e) => setRegexPattern(e.target.value)}
                placeholder="输入正则表达式..."
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'var(--window-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontFamily: 'monospace'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <select
                value={regexFlags}
                onChange={(e) => setRegexFlags(e.target.value)}
                style={{
                  padding: '10px',
                  background: 'var(--window-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              >
                <option value="g">g (全局)</option>
                <option value="gi">gi (全局+忽略大小写)</option>
                <option value="m">m (多行)</option>
                <option value="gm">gm (全局+多行)</option>
                <option value="gim">gim (全局+忽略+多行)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>测试文本</label>
            <textarea
              value={regexText}
              onChange={(e) => setRegexText(e.target.value)}
              placeholder="输入要测试的文本..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '10px',
                background: 'var(--window-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            onClick={handleRegexTest}
            style={{
              padding: '10px 24px',
              background: 'var(--accent-gradient)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: 'white',
              width: '100%'
            }}
          >
            测试匹配
          </button>
        </div>

        {result && (
          <div style={{
            padding: '16px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              匹配结果 (共 {result.count} 个匹配)
            </div>
            <div style={{
              padding: '12px',
              background: 'var(--window-bg)',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'monospace',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              {highlightedText.map((part, i) =>
                part.match ? (
                  <mark key={i} style={{ background: 'var(--accent)', color: 'white', padding: '0 2px', borderRadius: '2px' }}>
                    {part.text}
                  </mark>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
            </div>
            {result.matches.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>匹配列表:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {result.matches.slice(0, 50).map((m: string, i: number) => (
                    <span
                      key={i}
                      style={{
                        padding: '4px 8px',
                        background: 'var(--accent-bg)',
                        border: '1px solid var(--accent)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: 'var(--accent)',
                        fontFamily: 'monospace'
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderHashTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        padding: '20px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px'
      }}>
        <h3 style={h3TitleStyle}>
          #️⃣ 哈希工具
        </h3>

        <textarea
          value={hashInput}
          onChange={(e) => setHashInput(e.target.value)}
          placeholder="输入要生成哈希的文本..."
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '10px',
            background: 'var(--window-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontFamily: 'monospace',
            resize: 'vertical'
          }}
        />

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>算法:</label>
          <select
            value={hashAlgorithm}
            onChange={(e) => setHashAlgorithm(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 10px',
              background: 'var(--window-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '13px'
            }}
          >
            <option value="SHA-1">SHA-1</option>
            <option value="SHA-256">SHA-256</option>
            <option value="SHA-384">SHA-384</option>
            <option value="SHA-512">SHA-512</option>
          </select>
          <button
            onClick={handleHashGenerate}
            disabled={loading}
            style={{
              padding: '8px 20px',
              background: loading ? 'var(--border-color)' : 'var(--accent-gradient)',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              color: 'white'
            }}
          >
            {loading ? '生成中...' : '生成哈希'}
          </button>
        </div>
      </div>

      {hashOutput && (
        <div style={{
          padding: '16px',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {hashAlgorithm} 哈希值
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(hashOutput)
                addNotification({ title: '已复制', message: '哈希值已复制到剪贴板', type: 'success', duration: 2000 })
              }}
              style={{
                padding: '4px 12px',
                background: 'var(--window-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                color: 'var(--text-secondary)'
              }}
            >
              复制
            </button>
          </div>
          <div style={{
            padding: '12px',
            background: 'var(--window-bg)',
            borderRadius: '8px',
            fontSize: '13px',
            fontFamily: 'monospace',
            color: 'var(--accent)',
            wordBreak: 'break-all',
            lineHeight: '1.5'
          }}>
            {hashOutput}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            长度: {hashOutput.length} 字符 ({hashOutput.length / 2} 字节)
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '16px',
      gap: '16px',
      background: 'var(--window-bg)',
      overflow: 'auto'
    }}>
      {/* 标签页导航 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '4px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setOutput('')
              setResult(null)
            }}
            style={{
              flex: 1,
              padding: '10px 8px',
              background: activeTab === tab.id ? 'var(--accent-gradient)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1 }}>
        {activeTab === 'currency' && renderCurrencyTab()}
        {activeTab === 'color' && renderColorTab()}
        {activeTab === 'text' && renderTextTab()}
        {activeTab === 'network' && renderNetworkTab()}
        {activeTab === 'code' && renderCodeTab()}
        {activeTab === 'generator' && renderGeneratorTab()}
        {activeTab === 'units' && renderUnitsTab()}
        {activeTab === 'password' && renderPasswordTab()}
        {activeTab === 'timestamp' && renderTimestampTab()}
        {activeTab === 'emoji' && renderEmojiTab()}
        {activeTab === 'converter' && renderConverterTab()}
        {activeTab === 'regex' && renderRegexTab()}
        {activeTab === 'hash' && renderHashTab()}
      </div>
    </div>
  )
})

// 辅助组件
const StatCard = memo(function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      padding: '12px',
      background: 'var(--window-bg)',
      borderRadius: '8px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
        {label}
      </div>
    </div>
  )
})

const ToolButton = memo(function ToolButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px',
        background: 'var(--window-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        cursor: 'pointer',
        color: 'var(--text-primary)',
        fontSize: '12px',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--accent-bg)'
        e.currentTarget.style.borderColor = 'var(--accent)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--window-bg)'
        e.currentTarget.style.borderColor = 'var(--border-color)'
      }}
    >
      {label}
    </button>
  )
})

const GeneratorButton = memo(function GeneratorButton({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '16px',
        background: 'var(--window-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        cursor: 'pointer',
        color: 'var(--text-primary)',
        fontSize: '13px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--accent-bg)'
        e.currentTarget.style.borderColor = 'var(--accent)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--window-bg)'
        e.currentTarget.style.borderColor = 'var(--border-color)'
      }}
    >
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
})

export default memo(OnlineToolkitPro)