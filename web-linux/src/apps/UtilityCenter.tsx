import { useState, useEffect, useCallback } from 'react'
import { Calculator, Hash, Globe, Wifi, Clock, Languages, Image, Shield, Settings, Zap } from 'lucide-react'

type ToolCategory = 'conversion' | 'network' | 'security' | 'media' | 'time' | 'productivity'

interface ToolItem {
  id: string
  name: string
  icon: React.ReactNode
  category: ToolCategory
  description: string
}

const TOOLS: ToolItem[] = [
  { id: 'unit', name: '单位转换', icon: <Calculator size={20} />, category: 'conversion', description: '长度、重量、面积等单位换算' },
  { id: 'currency', name: '汇率转换', icon: <Globe size={20} />, category: 'conversion', description: '全球货币实时汇率查询' },
  { id: 'base64', name: 'Base64编码', icon: <Hash size={20} />, category: 'security', description: '文本与Base64互转' },
  { id: 'hash', name: '哈希计算', icon: <Shield size={20} />, category: 'security', description: 'MD5、SHA系列哈希计算' },
  { id: 'url', name: 'URL编码', icon: <Globe size={20} />, category: 'network', description: 'URL编码解码工具' },
  { id: 'ip', name: 'IP查询', icon: <Wifi size={20} />, category: 'network', description: 'IP地址地理位置查询' },
  { id: 'color', name: '颜色转换', icon: <Image size={20} />, category: 'media', description: 'RGB、HEX、HSL颜色互转' },
  { id: 'time', name: '时间工具', icon: <Clock size={20} />, category: 'time', description: '时区转换、时间戳工具' },
  { id: 'translator', name: '翻译工具', icon: <Languages size={20} />, category: 'productivity', description: '多语言文本翻译' },
  { id: 'password', name: '密码生成', icon: <Shield size={20} />, category: 'security', description: '安全密码生成器' },
]

const CATEGORIES: { key: ToolCategory; label: string; icon: React.ReactNode }[] = [
  { key: 'conversion', label: '转换工具', icon: <Zap size={16} /> },
  { key: 'network', label: '网络工具', icon: <Wifi size={16} /> },
  { key: 'security', label: '安全工具', icon: <Shield size={16} /> },
  { key: 'media', label: '媒体工具', icon: <Image size={16} /> },
  { key: 'time', label: '时间工具', icon: <Clock size={16} /> },
  { key: 'productivity', label: '效率工具', icon: <Settings size={16} /> },
]

function UnitConverter() {
  const [value, setValue] = useState('1')
  const [fromUnit, setFromUnit] = useState('m')
  const [toUnit, setToUnit] = useState('km')
  const [result, setResult] = useState('')

  const units = {
    length: [
      { key: 'm', name: '米', rate: 1 },
      { key: 'km', name: '千米', rate: 0.001 },
      { key: 'cm', name: '厘米', rate: 100 },
      { key: 'mm', name: '毫米', rate: 1000 },
      { key: 'in', name: '英寸', rate: 39.3701 },
      { key: 'ft', name: '英尺', rate: 3.28084 },
      { key: 'yd', name: '码', rate: 1.09361 },
      { key: 'mi', name: '英里', rate: 0.000621371 },
    ],
    weight: [
      { key: 'kg', name: '千克', rate: 1 },
      { key: 'g', name: '克', rate: 1000 },
      { key: 'mg', name: '毫克', rate: 1000000 },
      { key: 'lb', name: '磅', rate: 2.20462 },
      { key: 'oz', name: '盎司', rate: 35.274 },
      { key: 't', name: '吨', rate: 0.001 },
    ],
    area: [
      { key: 'm2', name: '平方米', rate: 1 },
      { key: 'km2', name: '平方千米', rate: 0.000001 },
      { key: 'cm2', name: '平方厘米', rate: 10000 },
      { key: 'ha', name: '公顷', rate: 0.0001 },
      { key: 'ac', name: '英亩', rate: 0.000247105 },
      { key: 'sqft', name: '平方英尺', rate: 10.7639 },
    ],
    volume: [
      { key: 'l', name: '升', rate: 1 },
      { key: 'ml', name: '毫升', rate: 1000 },
      { key: 'm3', name: '立方米', rate: 0.001 },
      { key: 'gal', name: '加仑', rate: 0.264172 },
      { key: 'qt', name: '夸脱', rate: 1.05669 },
      { key: 'pt', name: '品脱', rate: 2.11338 },
    ],
  }

  const [type, setType] = useState<keyof typeof units>('length')

  useEffect(() => {
    const num = parseFloat(value)
    if (isNaN(num)) {
      setResult('')
      return
    }
    const from = units[type].find(u => u.key === fromUnit)
    const to = units[type].find(u => u.key === toUnit)
    if (from && to) {
      const converted = (num / from.rate) * to.rate
      setResult(converted.toFixed(6).replace(/\.?0+$/, ''))
    }
  }, [value, fromUnit, toUnit, type])

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-2">
        {Object.keys(units).map((key) => (
          <button
            key={key}
            onClick={() => setType(key as keyof typeof units)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              type === key
                ? 'bg-primary text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {key === 'length' ? '长度' : key === 'weight' ? '重量' : key === 'area' ? '面积' : '体积'}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-lg font-medium"
          placeholder="输入数值"
        />
        <select
          value={fromUnit}
          onChange={(e) => setFromUnit(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
        >
          {units[type].map(u => (
            <option key={u.key} value={u.key}>{u.name}</option>
          ))}
        </select>
        <span className="text-gray-400 text-xl">→</span>
        <select
          value={toUnit}
          onChange={(e) => setToUnit(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
        >
          {units[type].map(u => (
            <option key={u.key} value={u.key}>{u.name}</option>
          ))}
        </select>
      </div>
      {result && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg text-center">
          <span className="text-gray-400">结果：</span>
          <span className="text-xl font-bold text-primary ml-2">{result}</span>
        </div>
      )}
    </div>
  )
}

function HashGenerator() {
  const [input, setInput] = useState('')
  const [algorithm, setAlgorithm] = useState('md5')
  const [result, setResult] = useState('')

  const algorithms = ['md5', 'sha1', 'sha256', 'sha512']

  useEffect(() => {
    if (!input) {
      setResult('')
      return
    }
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    crypto.subtle.digest(algorithm.toUpperCase(), data).then(hash => {
      const hex = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      setResult(hex)
    })
  }, [input, algorithm])

  const copy = () => navigator.clipboard.writeText(result)

  return (
    <div className="p-4">
      <div className="mb-3 flex gap-2">
        {algorithms.map(algo => (
          <button
            key={algo}
            onClick={() => setAlgorithm(algo)}
            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
              algorithm === algo
                ? 'bg-primary text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {algo.toUpperCase()}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white mb-3"
        placeholder="输入要计算哈希的文本"
      />
      {result && (
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-gray-900 rounded-lg text-green-400 text-sm break-all">
            {result}
          </code>
          <button
            onClick={copy}
            className="px-3 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm"
          >
            复制
          </button>
        </div>
      )}
    </div>
  )
}

function URLTools() {
  const [input, setInput] = useState('')
  const [encoded, setEncoded] = useState('')
  const [decoded, setDecoded] = useState('')

  useEffect(() => {
    if (!input) {
      setEncoded('')
      setDecoded('')
      return
    }
    try {
      setEncoded(encodeURIComponent(input))
      setDecoded(decodeURIComponent(input))
    } catch {
      setEncoded('')
      setDecoded('')
    }
  }, [input])

  const copyEncoded = () => navigator.clipboard.writeText(encoded)
  const copyDecoded = () => navigator.clipboard.writeText(decoded)

  return (
    <div className="p-4">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white mb-4"
        placeholder="输入URL或文本"
      />
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-400 mb-1 block">编码结果</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-900 rounded-lg text-blue-400 text-sm break-all">
              {encoded || '-'}
            </code>
            <button onClick={copyEncoded} disabled={!encoded} className="px-3 py-2 bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm">
              复制
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">解码结果</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-900 rounded-lg text-green-400 text-sm break-all">
              {decoded || '-'}
            </code>
            <button onClick={copyDecoded} disabled={!decoded} className="px-3 py-2 bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm">
              复制
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ColorConverter() {
  const [hex, setHex] = useState('#ffffff')
  const [rgb, setRgb] = useState({ r: 255, g: 255, b: 255 })
  const [hsl, setHsl] = useState({ h: 0, s: 0, l: 100 })

  useEffect(() => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      const r = parseInt(result[1], 16)
      const g = parseInt(result[2], 16)
      const b = parseInt(result[3], 16)
      setRgb({ r, g, b })
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h = 0, s = 0, l = (max + min) / 2
      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
          case g: h = ((b - r) / d + 2) / 6; break
          case b: h = ((r - g) / d + 4) / 6; break
        }
      }
      setHsl({ h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) })
    }
  }, [hex])

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-20 h-20 rounded-xl border-2 border-gray-600 shadow-lg"
          style={{ backgroundColor: hex }}
        />
        <input
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          className="w-16 h-16 rounded-lg cursor-pointer"
        />
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-20 text-gray-400">HEX:</span>
          <code className="flex-1 px-3 py-2 bg-gray-900 rounded-lg text-white font-mono">{hex}</code>
          <button onClick={() => navigator.clipboard.writeText(hex)} className="px-3 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm">复制</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-20 text-gray-400">RGB:</span>
          <code className="flex-1 px-3 py-2 bg-gray-900 rounded-lg text-white font-mono">rgb({rgb.r}, {rgb.g}, {rgb.b})</code>
          <button onClick={() => navigator.clipboard.writeText(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)} className="px-3 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm">复制</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-20 text-gray-400">HSL:</span>
          <code className="flex-1 px-3 py-2 bg-gray-900 rounded-lg text-white font-mono">hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</code>
          <button onClick={() => navigator.clipboard.writeText(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)} className="px-3 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm">复制</button>
        </div>
      </div>
    </div>
  )
}

function TimeTools() {
  const [timestamp, setTimestamp] = useState('')
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setDate(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const convert = (ts: string) => {
    const num = parseInt(ts)
    if (!isNaN(num)) {
      const d = new Date(num * 1000)
      setTimestamp(d.toLocaleString('zh-CN'))
    }
  }

  return (
    <div className="p-4">
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-white font-mono mb-2">{date.toLocaleTimeString('zh-CN')}</div>
        <div className="text-gray-400">{date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</div>
        <div className="text-gray-500 mt-1">时间戳: {Math.floor(date.getTime() / 1000)}</div>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-400 mb-1 block">时间戳转日期</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="输入时间戳"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
              onBlur={(e) => convert(e.target.value)}
            />
            <button
              onClick={() => navigator.clipboard.writeText(String(Math.floor(date.getTime() / 1000)))}
              className="px-3 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm"
            >
              复制当前戳
            </button>
          </div>
          {timestamp && <div className="mt-2 text-green-400">{timestamp}</div>}
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">日期转时间戳</label>
          <input
            type="datetime-local"
            value={date.toISOString().slice(0, 16)}
            onChange={(e) => {
              const d = new Date(e.target.value)
              setTimestamp(String(Math.floor(d.getTime() / 1000)))
            }}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
          />
        </div>
      </div>
    </div>
  )
}

function CurrencyConverter() {
  const [amount, setAmount] = useState('1')
  const [from, setFrom] = useState('CNY')
  const [to, setTo] = useState('USD')
  const [result, setResult] = useState('')
  const [rates, setRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  const currencies = [
    { code: 'CNY', name: '人民币' },
    { code: 'USD', name: '美元' },
    { code: 'EUR', name: '欧元' },
    { code: 'GBP', name: '英镑' },
    { code: 'JPY', name: '日元' },
    { code: 'KRW', name: '韩元' },
    { code: 'HKD', name: '港币' },
    { code: 'AUD', name: '澳元' },
    { code: 'CAD', name: '加元' },
    { code: 'SGD', name: '新加坡元' },
  ]

  useEffect(() => {
    setLoading(true)
    fetch('https://api.exchangerate-api.com/v4/latest/CNY')
      .then(res => res.json())
      .then(data => {
        setRates(data.rates || {})
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!amount || !rates[from] || !rates[to]) {
      setResult('')
      return
    }
    const num = parseFloat(amount)
    const converted = (num / rates[from]) * rates[to]
    setResult(converted.toFixed(4))
  }, [amount, from, to, rates])

  return (
    <div className="p-4">
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-lg font-medium"
          placeholder="输入金额"
        />
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
        >
          {currencies.map(c => (
            <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
          ))}
        </select>
        <span className="text-gray-400 text-xl">→</span>
        <select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
        >
          {currencies.map(c => (
            <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
          ))}
        </select>
      </div>
      <div className="mt-4 p-3 bg-gray-800 rounded-lg text-center">
        {loading ? (
          <span className="text-gray-400">加载汇率中...</span>
        ) : (
          <>
            <span className="text-gray-400">结果：</span>
            <span className="text-xl font-bold text-primary ml-2">{result || '-'}</span>
            <span className="text-gray-400 ml-1">{to}</span>
          </>
        )}
      </div>
    </div>
  )
}

function Base64Tools() {
  const [input, setInput] = useState('')
  const [encoded, setEncoded] = useState('')
  const [decoded, setDecoded] = useState('')

  useEffect(() => {
    if (!input) {
      setEncoded('')
      setDecoded('')
      return
    }
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(input)
      const binary = Array.from(data).map(b => String.fromCharCode(b)).join('')
      setEncoded(btoa(binary))
    } catch {
      setEncoded('')
    }
    try {
      setDecoded(atob(input))
    } catch {
      setDecoded('')
    }
  }, [input])

  return (
    <div className="p-4">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white mb-4"
        placeholder="输入文本或Base64"
      />
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Base64编码</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-900 rounded-lg text-blue-400 text-sm break-all">
              {encoded || '-'}
            </code>
            <button onClick={() => navigator.clipboard.writeText(encoded)} disabled={!encoded} className="px-3 py-2 bg-primary hover:bg-primary/80 disabled:bg-gray-600 text-white rounded-lg text-sm">复制</button>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Base64解码</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-900 rounded-lg text-green-400 text-sm break-all">
              {decoded || '-'}
            </code>
            <button onClick={() => navigator.clipboard.writeText(decoded)} disabled={!decoded} className="px-3 py-2 bg-primary hover:bg-primary/80 disabled:bg-gray-600 text-white rounded-lg text-sm">复制</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function IPQuery() {
  const [ip, setIp] = useState('')
  const [info, setInfo] = useState<{ ip?: string; city?: string; region?: string; country?: string; loc?: string; org?: string; timezone?: string }>({})
  const [loading, setLoading] = useState(false)

  const fetchIP = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(ip ? `https://ipinfo.io/${ip}/json` : 'https://ipinfo.io/json')
      const data = await res.json()
      setInfo(data)
    } catch {
      setInfo({})
    }
    setLoading(false)
  }, [ip])

  useEffect(() => {
    fetchIP()
  }, [])

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
          placeholder="输入IP地址（留空查本机）"
        />
        <button onClick={fetchIP} className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg">查询</button>
      </div>
      {loading ? (
        <div className="text-center text-gray-400">查询中...</div>
      ) : info.ip ? (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'IP', value: info.ip },
            { label: '城市', value: info.city },
            { label: '地区', value: info.region },
            { label: '国家', value: info.country },
            { label: '坐标', value: info.loc },
            { label: '运营商', value: info.org },
            { label: '时区', value: info.timezone },
          ].map(item => (
            <div key={item.label} className="p-3 bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-400">{item.label}</div>
              <div className="text-white font-medium">{item.value || '-'}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400">未获取到IP信息</div>
      )}
    </div>
  )
}

function Translator() {
  const [text, setText] = useState('')
  const [from, setFrom] = useState('auto')
  const [to, setTo] = useState('zh')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const languages = [
    { code: 'auto', name: '自动检测' },
    { code: 'zh', name: '中文' },
    { code: 'en', name: '英语' },
    { code: 'ja', name: '日语' },
    { code: 'ko', name: '韩语' },
    { code: 'fr', name: '法语' },
    { code: 'de', name: '德语' },
    { code: 'es', name: '西班牙语' },
    { code: 'ru', name: '俄语' },
    { code: 'pt', name: '葡萄牙语' },
  ]

  const translate = async () => {
    if (!text) return
    setLoading(true)
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`)
      const data = await res.json()
      setResult(data.responseData?.translatedText || '翻译失败')
    } catch {
      setResult('翻译失败')
    }
    setLoading(false)
  }

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-3">
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
        >
          {languages.map(l => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>
        <button onClick={() => { const t = from; setFrom(to); setTo(t) }} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">↔</button>
        <select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
        >
          {languages.map(l => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white mb-3 h-32 resize-none"
        placeholder="输入要翻译的文本"
      />
      <button
        onClick={translate}
        disabled={!text || loading}
        className="w-full py-2 bg-primary hover:bg-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium"
      >
        {loading ? '翻译中...' : '翻译'}
      </button>
      {result && (
        <div className="mt-3 p-3 bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">翻译结果</div>
          <div className="text-white">{result}</div>
        </div>
      )}
    </div>
  )
}

function PasswordGenerator() {
  const [length, setLength] = useState(16)
  const [uppercase, setUppercase] = useState(true)
  const [lowercase, setLowercase] = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [password, setPassword] = useState('')

  const generate = () => {
    let chars = ''
    if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (numbers) chars += '0123456789'
    if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz'
    
    let result = ''
    const array = new Uint32Array(length)
    crypto.getRandomValues(array)
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length]
    }
    setPassword(result)
  }

  useEffect(() => {
    generate()
  }, [length, uppercase, lowercase, numbers, symbols])

  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">密码长度: {length}</label>
        <input
          type="range"
          min="4"
          max="64"
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full"
        />
      </div>
      <div className="space-y-2 mb-4">
        {[
          { key: 'uppercase', label: '包含大写字母', value: uppercase, setter: setUppercase },
          { key: 'lowercase', label: '包含小写字母', value: lowercase, setter: setLowercase },
          { key: 'numbers', label: '包含数字', value: numbers, setter: setNumbers },
          { key: 'symbols', label: '包含特殊字符', value: symbols, setter: setSymbols },
        ].map(item => (
          <label key={item.key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={item.value}
              onChange={(e) => item.setter(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-gray-300">{item.label}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-3 bg-gray-900 rounded-lg text-green-400 font-mono text-center">
          {password}
        </code>
        <button onClick={() => navigator.clipboard.writeText(password)} className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg">复制</button>
      </div>
    </div>
  )
}

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  unit: UnitConverter,
  currency: CurrencyConverter,
  base64: Base64Tools,
  hash: HashGenerator,
  url: URLTools,
  ip: IPQuery,
  color: ColorConverter,
  time: TimeTools,
  translator: Translator,
  password: PasswordGenerator,
}

export default function UtilityCenter() {
  const [selectedTool, setSelectedTool] = useState('unit')
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('conversion')

  const filteredTools = TOOLS.filter(t => t.category === activeCategory)
  const ToolComponent = TOOL_COMPONENTS[selectedTool]

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="flex border-b border-gray-700">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => {
              setActiveCategory(cat.key)
              const firstTool = TOOLS.find(t => t.category === cat.key)
              if (firstTool) setSelectedTool(firstTool.id)
            }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
              activeCategory === cat.key
                ? 'bg-gray-800 text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-gray-700 bg-gray-800/50 overflow-y-auto">
          {filteredTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                selectedTool === tool.id
                  ? 'bg-gray-700 text-primary'
                  : 'text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <span className="text-primary">{tool.icon}</span>
              <div>
                <div className="text-sm font-medium">{tool.name}</div>
                <div className="text-xs text-gray-500">{tool.description}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {ToolComponent && <ToolComponent />}
        </div>
      </div>
    </div>
  )
}