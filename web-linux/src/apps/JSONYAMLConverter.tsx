import React, { useState } from 'react'
import { Copy, FileJson, FileText, CheckCircle2, ArrowRightLeft } from 'lucide-react'

const JSONYAMLConverter: React.FC = () => {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)
  const [direction, setDirection] = useState<'json2yaml' | 'yaml2json'>('json2yaml')
  const [error, setError] = useState<string | null>(null)

  const jsonToYaml = (jsonStr: string): string => {
    const obj = JSON.parse(jsonStr)
    
    const convert = (value: any, indent: number = 0): string => {
      const spaces = '  '.repeat(indent)
      
      if (value === null) return 'null'
      if (typeof value === 'boolean') return value.toString()
      if (typeof value === 'number') return value.toString()
      if (typeof value === 'string') {
        if (value.includes('\n') || value.includes(':') || value.includes('#')) {
          return `|-\n${spaces}  ` + value.split('\n').join(`\n${spaces}  `)
        }
        return `"${value.replace(/"/g, '\\"')}"`
      }
      if (Array.isArray(value)) {
        if (value.length === 0) return '[]'
        return '\n' + value.map(item => `${spaces}- ${convert(item, indent + 1)}`).join('\n')
      }
      if (typeof value === 'object') {
        const keys = Object.keys(value)
        if (keys.length === 0) return '{}'
        return '\n' + keys.map(key => {
          const val = value[key]
          const convertedVal = convert(val, indent + 1)
          if (typeof val === 'object' && val !== null) {
            return `${spaces}${key}:${convertedVal}`
          }
          return `${spaces}${key}: ${convertedVal}`
        }).join('\n')
      }
      return ''
    }
    
    return convert(obj)
  }

  const yamlToJson = (yamlStr: string): string => {
    const lines = yamlStr.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'))
    const result: any = {}
    const stack: any[] = [{ obj: result, indent: -1 }]
    
    for (const line of lines) {
      const indent = line.search(/\S/)
      const content = line.trim()
      
      if (!content) continue
      
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop()
      }
      
      const current = stack[stack.length - 1]
      
      if (content.startsWith('- ')) {
        const value = content.slice(2).trim()
        if (!Array.isArray(current.obj)) {
          const parent = stack[stack.length - 2]
          const lastKey = Object.keys(parent.obj).pop()!
          parent.obj[lastKey] = []
          current.obj = parent.obj[lastKey]
        }
        current.obj.push(parseValue(value))
      } else if (content.includes(':')) {
        const colonIndex = content.indexOf(':')
        const key = content.slice(0, colonIndex).trim()
        const value = content.slice(colonIndex + 1).trim()
        
        const newObj: any = {}
        current.obj[key] = value ? parseValue(value) : newObj
        
        if (!value) {
          stack.push({ obj: newObj, indent })
        }
      }
    }
    
    return JSON.stringify(result, null, 2)
  }

  const parseValue = (value: string): any => {
    if (value === 'true') return true
    if (value === 'false') return false
    if (value === 'null') return null
    if (!isNaN(Number(value))) return Number(value)
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1)
    }
    return value
  }

  const convert = () => {
    try {
      setError(null)
      if (direction === 'json2yaml') {
        const yaml = jsonToYaml(input)
        setOutput(yaml)
      } else {
        const json = yamlToJson(input)
        setOutput(json)
      }
    } catch (e) {
      setError(direction === 'json2yaml' ? 'JSON 解析错误' : 'YAML 解析错误')
    }
  }

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('复制失败:', e)
    }
  }

  const swap = () => {
    setDirection(direction === 'json2yaml' ? 'yaml2json' : 'json2yaml')
    setInput(output)
    setOutput('')
    setError(null)
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-orange-300">JSON/YAML 转换器</h2>
          <p className="text-gray-400 text-sm">在 JSON 和 YAML 之间快速转换</p>
        </div>
        <button
          onClick={swap}
          className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          title="交换"
        >
          <ArrowRightLeft className="w-6 h-6 text-orange-400" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
            {direction === 'json2yaml' ? (
              <><FileJson className="inline w-4 h-4 mr-2" /> JSON 输入</>
            ) : (
              <><FileText className="inline w-4 h-4 mr-2" /> YAML 输入</>
            )}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={direction === 'json2yaml' 
              ? `{"name": "WebLinuxOS", "version": "1.0", "features": ["web", "linux", "desktop"]}` 
              : `name: WebLinuxOS\nversion: "1.0"\nfeatures:\n  - web\n  - linux\n  - desktop`}
            className="flex-1 w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300 flex items-center">
              {direction === 'json2yaml' ? (
                <><FileText className="inline w-4 h-4 mr-2" /> YAML 输出</>
              ) : (
                <><FileJson className="inline w-4 h-4 mr-2" /> JSON 输出</>
              )}
            </label>
            {output && (
              <button
                onClick={copyOutput}
                className="flex items-center space-x-1 text-xs text-gray-400 hover:text-orange-300 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>已复制!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>复制</span>
                  </>
                )}
              </button>
            )}
          </div>
          <div className="flex-1 w-full bg-gray-800 border border-gray-700 rounded-lg p-3 overflow-auto">
            <pre className="text-sm text-gray-200 whitespace-pre-wrap">{output || '输出将显示在这里...'}</pre>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={convert}
          disabled={!input.trim()}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-orange-500/25"
        >
          转换
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-2">功能说明</h3>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• 支持 JSON 和 YAML 双向转换</li>
          <li>• 保留原始数据结构和格式</li>
          <li>• 支持复杂嵌套对象和数组</li>
        </ul>
      </div>
    </div>
  )
}

export default JSONYAMLConverter
