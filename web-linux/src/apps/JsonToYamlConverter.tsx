import { useState, useCallback, useMemo } from 'react'
import {
  ArrowLeftRight,
  Copy,
  Download,
  Upload,
  Check,
  AlertCircle,
  FileJson,
  FileCode,
  Eye,
  EyeOff,
  Trash2,
  Sparkles,
  FormInput,
} from 'lucide-react'

type Direction = 'json-to-yaml' | 'yaml-to-json'

function jsonToYaml(json: unknown, indent: number = 0): string {
  const spaces = '  '.repeat(indent)

  if (json === null || json === undefined) return 'null'
  if (typeof json === 'boolean') return json ? 'true' : 'false'
  if (typeof json === 'number') return json.toString()
  if (typeof json === 'string') {
    if (
      json.includes('\n') ||
      json.includes(':') ||
      json.includes('#') ||
      json.includes('"') ||
      json.includes("'") ||
      json.trim() === '' ||
      json.startsWith(' ') ||
      json.endsWith(' ') ||
      ['true', 'false', 'null', 'yes', 'no', 'on', 'off'].includes(json.toLowerCase())
    ) {
      return JSON.stringify(json)
    }
    return json
  }

  if (Array.isArray(json)) {
    if (json.length === 0) return '[]'
    return json
      .map((item) => {
        const itemStr = jsonToYaml(item, indent + 1)
        if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
          const keys = Object.keys(item as Record<string, unknown>)
          if (keys.length === 0) return `${spaces}- {}`
          const firstKey = keys[0]
          const firstVal = (item as Record<string, unknown>)[firstKey]
          const restKeys = keys.slice(1)
          const firstValStr = jsonToYaml(firstVal, indent + 2)
          let line = `${spaces}- ${firstKey}: ${
            typeof firstVal === 'object' && firstVal !== null && !Array.isArray(firstVal)
              ? restKeys.length === 0
                ? '{}'
                : `\n${'  '.repeat(indent + 2)}${firstValStr}`
              : firstValStr
          }`
          if (typeof firstVal === 'object' && firstVal !== null && !Array.isArray(firstVal)) {
            const nestedKeys = Object.keys(firstVal as Record<string, unknown>)
            if (nestedKeys.length > 0) {
              line = `${spaces}- ${firstKey}:\n${'  '.repeat(indent + 1)}${jsonToYaml(firstVal, indent + 2).replace(/\n/g, '\n' + '  '.repeat(indent + 1))}`
              if (!line.endsWith('\n')) line += '\n'
              for (const rk of restKeys) {
                const rv = (item as Record<string, unknown>)[rk]
                const rvStr = jsonToYaml(rv, indent + 2)
                if (typeof rv === 'object' && rv !== null && !Array.isArray(rv)) {
                  line += `${'  '.repeat(indent + 1)}${rk}:\n${rvStr}`
                } else {
                  line += `${'  '.repeat(indent + 1)}${rk}: ${rvStr}\n`
                }
              }
              return line.trimEnd()
            }
          }
          for (const rk of restKeys) {
            const rv = (item as Record<string, unknown>)[rk]
            const rvStr = jsonToYaml(rv, indent + 2)
            if (typeof rv === 'object' && rv !== null && !Array.isArray(rv)) {
              line += `\n${'  '.repeat(indent + 1)}${rk}:\n${rvStr}`
            } else {
              line += `\n${'  '.repeat(indent + 1)}${rk}: ${rvStr}`
            }
          }
          return line
        }
        if (Array.isArray(item)) {
          if (item.length === 0) return `${spaces}- []`
          return `${spaces}-\n${itemStr}`
        }
        return `${spaces}- ${itemStr}`
      })
      .join('\n')
  }

  if (typeof json === 'object') {
    const keys = Object.keys(json as Record<string, unknown>)
    if (keys.length === 0) return '{}'
    const obj = json as Record<string, unknown>
    return keys
      .map((key) => {
        const value = obj[key]
        const keyStr =
          key.includes(':') || key.includes('#') || key.includes(' ') || key.trim() === ''
            ? JSON.stringify(key)
            : key
        const valueStr = jsonToYaml(value, indent + 1)
        if (value !== null && typeof value === 'object') {
          if (Array.isArray(value)) {
            if (value.length === 0) return `${spaces}${keyStr}: []`
            return `${spaces}${keyStr}:\n${valueStr}`
          }
          if (Object.keys(value as Record<string, unknown>).length === 0) {
            return `${spaces}${keyStr}: {}`
          }
          return `${spaces}${keyStr}:\n${valueStr}`
        }
        return `${spaces}${keyStr}: ${valueStr}`
      })
      .join('\n')
  }

  return ''
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim()
  if (trimmed === '' || trimmed === '~' || trimmed.toLowerCase() === 'null') return null
  if (trimmed === 'true' || trimmed === 'True' || trimmed === 'TRUE' || trimmed.toLowerCase() === 'yes' || trimmed.toLowerCase() === 'on') return true
  if (trimmed === 'false' || trimmed === 'False' || trimmed === 'FALSE' || trimmed.toLowerCase() === 'no' || trimmed.toLowerCase() === 'off') return false
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10)
  if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed)
  if (/^".*"$/.test(trimmed) || /^'.*'$/.test(trimmed)) return trimmed.slice(1, -1)
  return trimmed
}

function yamlToJson(yaml: string): unknown {
  const lines = yaml.split('\n')
  const cleanedLines: { indent: number; content: string }[] = []

  for (const line of lines) {
    let trimmed = line.replace(/#.*$/, '').replace(/\s+$/, '')
    if (trimmed.trim() === '') continue
    const indent = trimmed.match(/^\s*/)?.[0].length || 0
    cleanedLines.push({ indent, content: trimmed.slice(indent) })
  }

  if (cleanedLines.length === 0) return {}

  let pos = 0

  function parseBlock(currentIndent: number): unknown {
    if (pos >= cleanedLines.length) return null

    const firstLine = cleanedLines[pos]

    if (firstLine.content.startsWith('- ')) {
      const result: unknown[] = []
      while (pos < cleanedLines.length && cleanedLines[pos].indent === currentIndent && cleanedLines[pos].content.startsWith('- ')) {
        const line = cleanedLines[pos]
        const value = line.content.slice(2)
        pos++
        if (value === '') {
          if (pos < cleanedLines.length && cleanedLines[pos].indent > currentIndent) {
            result.push(parseBlock(cleanedLines[pos].indent))
          } else {
            result.push(null)
          }
        } else if (value.includes(': ') || value.endsWith(':')) {
          const tempLine = { indent: currentIndent + 2, content: value }
          const saved = cleanedLines[pos - 1]
          cleanedLines[pos - 1] = tempLine
          const obj = parseBlock(currentIndent + 2)
          cleanedLines[pos - 1] = saved
          result.push(obj)
        } else {
          result.push(parseScalar(value))
        }
      }
      return result
    }

    const result: Record<string, unknown> = {}
    while (pos < cleanedLines.length && cleanedLines[pos].indent === currentIndent) {
      const line = cleanedLines[pos]
      if (line.content.startsWith('- ')) break

      const colonIdx = findColon(line.content)
      if (colonIdx === -1) {
        pos++
        continue
      }

      const key = line.content.slice(0, colonIdx).trim().replace(/^["']|["']$/g, '')
      const rest = line.content.slice(colonIdx + 1).trim()
      pos++

      if (rest === '' || rest === '|' || rest === '>') {
        if (pos < cleanedLines.length && cleanedLines[pos].indent > currentIndent) {
          result[key] = parseBlock(cleanedLines[pos].indent)
        } else {
          result[key] = null
        }
      } else if (rest === '[]') {
        result[key] = []
      } else if (rest === '{}') {
        result[key] = {}
      } else {
        result[key] = parseScalar(rest)
      }
    }
    return result
  }

  function findColon(str: string): number {
    let inSingle = false
    let inDouble = false
    for (let i = 0; i < str.length; i++) {
      const ch = str[i]
      if (ch === "'" && !inDouble) inSingle = !inSingle
      if (ch === '"' && !inSingle) inDouble = !inDouble
      if (ch === ':' && !inSingle && !inDouble) {
        if (i + 1 >= str.length || str[i + 1] === ' ' || str[i + 1] === '\t') {
          return i
        }
      }
    }
    return -1
  }

  return parseBlock(cleanedLines[0].indent)
}

const SAMPLE_JSON = `{
  "name": "WebLinuxOS",
  "version": "93.0.0",
  "features": {
    "terminal": true,
    "fileManager": true,
    "apps": 120
  },
  "languages": ["JavaScript", "TypeScript", "Python"],
  "author": {
    "name": "saya-ch",
    "email": "dev@example.com"
  },
  "tags": ["web", "linux", "os"],
  "config": {
    "theme": "dark",
    "debug": false,
    "maxUpload": null
  }
}`

const SAMPLE_YAML = `name: WebLinuxOS
version: 93.0.0
features:
  terminal: true
  fileManager: true
  apps: 120
languages:
  - JavaScript
  - TypeScript
  - Python
author:
  name: saya-ch
  email: dev@example.com
tags:
  - web
  - linux
  - os
config:
  theme: dark
  debug: false
  maxUpload: null`

export default function JsonToYamlConverter() {
  const [direction, setDirection] = useState<Direction>('json-to-yaml')
  const [input, setInput] = useState(SAMPLE_JSON)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  const convert = useCallback(() => {
    setError('')
    try {
      let result: string
      if (direction === 'json-to-yaml') {
        const parsed = JSON.parse(input)
        result = jsonToYaml(parsed)
      } else {
        const parsed = yamlToJson(input)
        result = JSON.stringify(parsed, null, 2)
      }
      setOutput(result)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '转换失败'
      setError(msg)
      setOutput('')
    }
  }, [direction, input])

  const switchDirection = useCallback(() => {
    setDirection((d) => {
      const newDir = d === 'json-to-yaml' ? 'yaml-to-json' : 'json-to-yaml'
      if (newDir === 'json-to-yaml') {
        setInput(output || SAMPLE_JSON)
      } else {
        setInput(output || SAMPLE_YAML)
      }
      setOutput('')
      setError('')
      return newDir
    })
  }, [output])

  const copyOutput = useCallback(async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }, [output])

  const downloadOutput = useCallback(() => {
    if (!output) return
    const ext = direction === 'json-to-yaml' ? 'yaml' : 'json'
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }, [output, direction])

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        setInput(ev.target?.result as string)
      }
      reader.readAsText(file)
      e.target.value = ''
    },
    []
  )

  const formatInput = useCallback(() => {
    try {
      if (direction === 'json-to-yaml') {
        const parsed = JSON.parse(input)
        setInput(JSON.stringify(parsed, null, 2))
      } else {
        const parsed = yamlToJson(input)
        setInput(JSON.stringify(parsed, null, 2))
        setDirection('json-to-yaml')
        setOutput('')
      }
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '格式错误')
    }
  }, [direction, input])

  const loadSample = useCallback(() => {
    if (direction === 'json-to-yaml') {
      setInput(SAMPLE_JSON)
    } else {
      setInput(SAMPLE_YAML)
    }
    setError('')
    setOutput('')
  }, [direction])

  const clearAll = useCallback(() => {
    setInput('')
    setOutput('')
    setError('')
  }, [])

  const stats = useMemo(() => {
    if (!output) return null
    const lines = output.split('\n').length
    const chars = output.length
    const size = chars < 1024 ? `${chars} B` : `${(chars / 1024).toFixed(1)} KB`
    return { lines, chars, size }
  }, [output])

  const isJsonToYaml = direction === 'json-to-yaml'

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 text-gray-100 overflow-hidden">
      <div className="shrink-0 px-6 py-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ArrowLeftRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                JSON / YAML 转换器
              </h1>
              <p className="text-xs text-gray-400">双向转换 · 实时预览 · 语法验证</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadSample}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              示例
            </button>
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              清空
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
              isJsonToYaml
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span className="text-sm font-medium">JSON</span>
          </div>

          <button
            onClick={switchDirection}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20"
            title="切换方向"
          >
            <ArrowLeftRight className="w-4 h-4 text-white" />
          </button>

          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
              !isJsonToYaml
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span className="text-sm font-medium">YAML</span>
          </div>

          <div className="flex-1" />

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            上传文件
            <input type="file" accept=".json,.yaml,.yml,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={formatInput}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
          >
            <FormInput className="w-3.5 h-3.5" />
            格式化
          </button>
          <button
            onClick={convert}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-emerald-500/20"
          >
            转换
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        <div className="flex flex-col rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              {isJsonToYaml ? (
                <FileJson className="w-4 h-4 text-emerald-400" />
              ) : (
                <FileCode className="w-4 h-4 text-cyan-400" />
              )}
              <span className="text-sm font-medium text-gray-300">
                {isJsonToYaml ? 'JSON 输入' : 'YAML 输入'}
              </span>
            </div>
            <span className="text-xs text-gray-500">{input.length} 字符</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isJsonToYaml ? '粘贴 JSON...' : '粘贴 YAML...'}
            className="flex-1 px-4 py-3 bg-transparent text-sm text-gray-200 placeholder-gray-600 focus:outline-none resize-none font-mono leading-relaxed"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              {isJsonToYaml ? (
                <FileCode className="w-4 h-4 text-cyan-400" />
              ) : (
                <FileJson className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-sm font-medium text-gray-300">
                {isJsonToYaml ? 'YAML 输出' : 'JSON 输出'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {stats && (
                <span className="text-xs text-gray-500">
                  {stats.lines} 行 · {stats.size}
                </span>
              )}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
                title={showPreview ? '显示原始' : '显示预览'}
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={copyOutput}
                disabled={!output}
                className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-30"
                title="复制"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={downloadOutput}
                disabled={!output}
                className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-30"
                title="下载"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {error ? (
              <div className="h-full flex items-start justify-center p-6">
                <div className="max-w-lg w-full rounded-xl bg-red-500/10 border border-red-500/30 p-4">
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">解析错误</span>
                  </div>
                  <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap break-all">
                    {error}
                  </pre>
                </div>
              </div>
            ) : output ? (
              showPreview ? (
                <pre className="px-4 py-3 text-sm text-gray-200 font-mono leading-relaxed whitespace-pre-wrap break-all">
                  {output}
                </pre>
              ) : (
                <textarea
                  value={output}
                  readOnly
                  className="w-full h-full px-4 py-3 bg-transparent text-sm text-gray-200 focus:outline-none resize-none font-mono leading-relaxed"
                  spellCheck={false}
                />
              )
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                点击"转换"开始生成
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}