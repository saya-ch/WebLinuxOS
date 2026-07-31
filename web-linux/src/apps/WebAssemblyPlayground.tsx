import { useState, useCallback } from 'react'
import {
  Code2, Play, Download, AlertCircle, Clock, MemoryStick, Copy, BookOpen, Zap,
} from 'lucide-react'

interface WasmExample {
  id: string
  name: string
  description: string
  watSource: string
  wasmBase64: string
  exports: string[]
  run: (instance: WebAssembly.Instance, input: number) => number | string
  defaultInput: string
}

const examples: WasmExample[] = [
  {
    id: 'add',
    name: '加法函数',
    description: '(module (func (export "add") (param i32 i32) (result i32) local.get 0 local.get 1 i32.add))',
    watSource: `(module
  (func $add (export "add") (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.add
  )
)`,
    wasmBase64: 'AGFzbQEAAAABBQFgAAF/AwIBAAIAAQAIAQVhZGQAAA==',
    exports: ['add'],
    run: (instance, input) => {
      const add = instance.exports.add as (a: number, b: number) => number
      return add(input, input)
    },
    defaultInput: '5',
  },
  {
    id: 'factorial',
    name: '阶乘',
    description: '递归计算 n! 的阶乘函数',
    watSource: `(module
  (func $factorial (export "factorial") (param i32) (result i32)
    local.get 0
    i32.const 1
    i32.le_s
    if (result i32)
      i32.const 1
    else
      local.get 0
      local.get 0
      i32.const 1
      i32.sub
      call $factorial
      i32.mul
    end
  )
)`,
    wasmBase64: 'AGFzbQEAAAABBQFgAAF/AwIBAAACAAAAAQIBAAgBFWZhY3RvcmlhbAAAAgAIAQALQwEBBAAJCgALQwABCACMAQA=',
    exports: ['factorial'],
    run: (instance, input) => {
      const factorial = instance.exports.factorial as (n: number) => number
      return factorial(input)
    },
    defaultInput: '5',
  },
  {
    id: 'fibonacci',
    name: '斐波那契',
    description: '递归计算第 n 个斐波那契数',
    watSource: `(module
  (func $fib (export "fib") (param i32) (result i32)
    local.get 0
    i32.const 2
    i32.lt_s
    if (result i32)
      local.get 0
    else
      local.get 0
      i32.const 2
      i32.sub
      call $fib
      local.get 0
      i32.const 1
      i32.sub
      call $fib
      i32.add
    end
  )
)`,
    wasmBase64: 'AGFzbQEAAAABBQFgAAF/AwIBAAACAAAAAQIBAAgBA2ZpYgAAAAIAAQCCEAEIAQAJDAEJCwALQwABCACOAQA=',
    exports: ['fib'],
    run: (instance, input) => {
      const fib = instance.exports.fib as (n: number) => number
      return fib(input)
    },
    defaultInput: '10',
  },
  {
    id: 'square',
    name: '平方函数',
    description: '(module (func (export "square") (param i32) (result i32) local.get 0 local.get 0 i32.mul))',
    watSource: `(module
  (func $square (export "square") (param i32) (result i32)
    local.get 0
    local.get 0
    i32.mul
  )
)`,
    wasmBase64: 'AGFzbQEAAAABBQFgAAF/AwIBAAABAAAAAQIBAAgBZnNxdWFyZQAAAAIAAQAJ',
    exports: ['square'],
    run: (instance, input) => {
      const square = instance.exports.square as (n: number) => number
      return square(input)
    },
    defaultInput: '7',
  },
]

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export default function WebAssemblyPlayground() {
  const [selectedExample, setSelectedExample] = useState<WasmExample>(examples[0])
  const [watCode, setWatCode] = useState(examples[0].watSource)
  const [inputValue, setInputValue] = useState(examples[0].defaultInput)
  const [result, setResult] = useState<string | null>(null)
  const [execTime, setExecTime] = useState<number | null>(null)
  const [memoryView, setMemoryView] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [wasmInstance, setWasmInstance] = useState<WebAssembly.Instance | null>(null)
  const [isCustom, setIsCustom] = useState(false)

  const loadExample = useCallback((example: WasmExample) => {
    setSelectedExample(example)
    setWatCode(example.watSource)
    setInputValue(example.defaultInput)
    setResult(null)
    setExecTime(null)
    setMemoryView(null)
    setError(null)
    setWasmInstance(null)
    setIsCustom(false)
  }, [])

  const compileAndRun = useCallback(async () => {
    setError(null)
    setResult(null)
    setExecTime(null)
    setMemoryView(null)

    try {
      const example = isCustom ? null : examples.find(e => e.id === selectedExample.id)

      if (isCustom) {
        setError('自定义 WAT 代码编译需要 wabt.js 库支持。请使用上方预构建的示例来体验 WebAssembly 运行。')
        return
      }

      if (!example) {
        setError('未找到对应的预编译示例')
        return
      }

      const bytes = base64ToUint8Array(example.wasmBase64)
      const startTime = performance.now()
      const instance = await WebAssembly.instantiate(bytes)
      const compileTime = performance.now() - startTime

      setWasmInstance(instance)

      const input = parseInt(inputValue, 10)
      if (isNaN(input)) {
        setError('请输入有效的整数')
        return
      }

      const runStart = performance.now()
      const output = example.run(instance, input)
      const runTime = performance.now() - runStart

      setResult(String(output))
      setExecTime(compileTime + runTime)

      const memory = instance.exports.memory as WebAssembly.Memory | undefined
      if (memory) {
        const buffer = new Uint8Array(memory.buffer)
        const nonZero = Array.from(buffer.slice(0, 64))
          .map((b, i) => `${i.toString(16).padStart(2, '0')}: ${b.toString(16).padStart(2, '0')}`)
          .join('  ')
        setMemoryView(nonZero)
      }
    } catch (e: any) {
      setError(e.message || String(e))
    }
  }, [selectedExample, inputValue, isCustom])

  const exportWasm = useCallback(() => {
    const example = examples.find(e => e.id === selectedExample.id)
    if (!example || isCustom) return
    try {
      const bytes = base64ToUint8Array(example.wasmBase64)
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/wasm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${example.id}.wasm`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e.message)
    }
  }, [selectedExample, isCustom])

  const copyWat = useCallback(() => {
    navigator.clipboard.writeText(watCode)
  }, [watCode])

  const switchToCustom = useCallback(() => {
    setIsCustom(true)
    setResult(null)
    setExecTime(null)
    setMemoryView(null)
    setError(null)
    setWasmInstance(null)
  }, [])

  return (
    <div style={{
      background: 'linear-gradient(180deg, #1a1b2e 0%, #1e1f3a 100%)',
      padding: 20, height: '100%', overflowY: 'auto', color: '#e0e0e0',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 10, background: 'rgba(99, 102, 241, 0.15)', borderRadius: 10 }}>
          <Code2 size={24} style={{ color: '#6366f1' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>WebAssembly 游乐场</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>在浏览器中编译和运行 WAT/WASM 代码</p>
        </div>
      </div>

      {/* Example selector */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <BookOpen size={14} style={{ color: '#6366f1' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>预构建示例</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {examples.map((ex) => (
            <button
              key={ex.id}
              onClick={() => loadExample(ex)}
              style={{
                padding: '8px 16px',
                background: !isCustom && selectedExample.id === ex.id
                  ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                  : 'rgba(255,255,255,0.08)',
                border: 'none', borderRadius: 8, color: '#e0e0e0',
                cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
              }}
            >
              {ex.name}
            </button>
          ))}
          <button
            onClick={switchToCustom}
            style={{
              padding: '8px 16px',
              background: isCustom ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.08)',
              border: '1px dashed rgba(99,102,241,0.4)', borderRadius: 8, color: '#e0e0e0',
              cursor: 'pointer', fontSize: 13,
            }}
          >
            自定义 WAT
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left: WAT Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>WAT 源码</span>
            <button onClick={copyWat} title="复制"
              style={{ padding: 4, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 4, color: '#94a3b8', cursor: 'pointer' }}>
              <Copy size={14} />
            </button>
          </div>
          <textarea
            value={watCode}
            onChange={(e) => { setWatCode(e.target.value); setIsCustom(true) }}
            spellCheck={false}
            style={{
              flex: 1, minHeight: 260, padding: 14,
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, color: '#c9d1d9', fontSize: 13,
              fontFamily: "'Fira Code', 'Consolas', monospace",
              resize: 'vertical', lineHeight: 1.6,
            }}
          />
          {!isCustom && selectedExample && (
            <div style={{ fontSize: 12, color: '#64748b', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
              {selectedExample.description}
            </div>
          )}
        </div>

        {/* Right: Controls & Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Input & Run */}
          <div style={{
            padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={14} style={{ color: '#6366f1' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>运行参数</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="输入参数..."
                style={{
                  flex: 1, padding: '10px 14px',
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, color: '#e0e0e0', fontSize: 14, fontFamily: 'monospace',
                }}
              />
              <button
                onClick={compileAndRun}
                style={{
                  padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Play size={16} /> 运行
              </button>
            </div>
            {!isCustom && (
              <button
                onClick={exportWasm}
                style={{
                  padding: '8px 14px', background: 'rgba(255,255,255,0.08)',
                  border: 'none', borderRadius: 8, color: '#94a3b8', cursor: 'pointer',
                  fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
                }}
              >
                <Download size={14} /> 导出 .wasm 文件
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: 12, background: 'rgba(239, 68, 68, 0.15)', borderRadius: 8,
              display: 'flex', alignItems: 'flex-start', gap: 8, color: '#fca5a5', fontSize: 13,
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Result */}
          {result !== null && (
            <div style={{
              padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Zap size={14} style={{ color: '#4ade80' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>运行结果</span>
              </div>
              <div style={{
                padding: 14, background: 'rgba(0,0,0,0.3)', borderRadius: 8,
                fontSize: 20, fontWeight: 700, color: '#4ade80', fontFamily: 'monospace',
              }}>
                {result}
              </div>
              {execTime !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#64748b', fontSize: 12 }}>
                  <Clock size={12} />
                  <span>耗时: {execTime.toFixed(3)} ms</span>
                </div>
              )}
            </div>
          )}

          {/* Memory View */}
          {memoryView && (
            <div style={{
              padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <MemoryStick size={14} style={{ color: '#818cf8' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>内存视图 (前 64 字节)</span>
              </div>
              <pre style={{
                margin: 0, padding: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 6,
                fontSize: 11, fontFamily: 'monospace', color: '#818cf8',
                whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              }}>
                {memoryView}
              </pre>
            </div>
          )}

          {/* Exports list */}
          {wasmInstance && (
            <div style={{
              padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8,
            }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>导出函数: </span>
              {Object.keys(wasmInstance.exports).map((name) => (
                <span key={name} style={{
                  display: 'inline-block', padding: '2px 8px', margin: '0 4px',
                  background: 'rgba(99,102,241,0.15)', borderRadius: 4,
                  fontSize: 12, color: '#818cf8', fontFamily: 'monospace',
                }}>
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
