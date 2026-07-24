import { useState, useRef, useEffect, useCallback } from 'react'

type DataMode = 'ASCII' | 'HEX'
type Parity = 'none' | 'even' | 'odd'
type StopBits = 1 | 2

interface SerialPortInfo {
  vendorId?: number
  productId?: number
}

interface LineEntry {
  id: number
  timestamp: string
  direction: 'rx' | 'tx'
  data: string
  raw: string
}

declare global {
  interface Navigator {
    serial?: {
      requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>
      getPorts(): Promise<SerialPort[]>
      addEventListener(type: string, listener: EventListener): void
      removeEventListener(type: string, listener: EventListener): void
    }
  }
}

interface SerialPortRequestOptions {
  filters?: Array<{ usbVendorId?: number; usbProductId?: number }>
}

interface SerialPort {
  getInfo(): SerialPortInfo
  open(options: SerialOpenOptions): Promise<void>
  close(): Promise<void>
  readable: ReadableStream<Uint8Array> | null
  writable: WritableStream<Uint8Array> | null
  addEventListener(type: string, listener: EventListener): void
  removeEventListener(type: string, listener: EventListener): void
}

interface SerialOpenOptions {
  baudRate: number
  dataBits?: 7 | 8
  stopBits?: StopBits
  parity?: Parity
  flowControl?: 'none' | 'hardware'
}

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600]

function toHex(byte: number): string {
  return byte.toString(16).padStart(2, '0').toUpperCase()
}

function toAscii(byte: number): string {
  return byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.'
}

function formatBytes(bytes: Uint8Array, mode: DataMode): string {
  if (mode === 'HEX') {
    return Array.from(bytes).map(toHex).join(' ')
  }
  return Array.from(bytes).map(toAscii).join('')
}

function getTimestamp(): string {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`
}

export default function WebSerialTerminal() {
  const [connected, setConnected] = useState(false)
  const [baudRate, setBaudRate] = useState(115200)
  const [dataBits, setDataBits] = useState<7 | 8>(8)
  const [stopBits, setStopBits] = useState<StopBits>(1)
  const [parity, setParity] = useState<Parity>('none')
  const [dataMode, setDataMode] = useState<DataMode>('ASCII')
  const [autoScroll, setAutoScroll] = useState(true)
  const [inputData, setInputData] = useState('')
  const [lines, setLines] = useState<LineEntry[]>([])
  const [supported, setSupported] = useState(true)
  const [portInfo, setPortInfo] = useState<string>('')
  const [error, setError] = useState('')
  const [sendWithNewline, setSendWithNewline] = useState(true)

  const portRef = useRef<SerialPort | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null)
  const termRef = useRef<HTMLDivElement>(null)
  const lineIdRef = useRef(0)
  const readLoopRef = useRef(false)

  useEffect(() => {
    setSupported('serial' in navigator)
  }, [])

  useEffect(() => {
    if (autoScroll && termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight
    }
  }, [lines, autoScroll])

  const addLine = useCallback((direction: 'rx' | 'tx', data: string, raw: string) => {
    lineIdRef.current += 1
    const entry: LineEntry = {
      id: lineIdRef.current,
      timestamp: getTimestamp(),
      direction,
      data,
      raw,
    }
    setLines((prev) => {
      const next = [...prev, entry]
      return next.length > 2000 ? next.slice(-1500) : next
    })
  }, [])

  const readLoop = useCallback(async () => {
    if (!portRef.current?.readable) return
    readLoopRef.current = true
    const reader = portRef.current.readable.getReader()
    readerRef.current = reader

    try {
      while (readLoopRef.current) {
        const { value, done } = await reader.read()
        if (done) break
        if (value) {
          const display = formatBytes(value, dataMode)
          const hex = Array.from(value).map(toHex).join(' ')
          addLine('rx', display, hex)
        }
      }
    } catch {
      // Port closed or disconnected
    } finally {
      reader.releaseLock()
      readerRef.current = null
    }
  }, [dataMode, addLine])

  const connect = useCallback(async () => {
    if (!navigator.serial) return
    try {
      setError('')
      const port = await navigator.serial.requestPort()
      portRef.current = port

      await port.open({
        baudRate,
        dataBits,
        stopBits,
        parity,
        flowControl: 'none',
      })

      const info = port.getInfo()
      const infoStr = info.vendorId ? `VID:0x${info.vendorId.toString(16)} PID:0x${info.productId?.toString(16)}` : '未知设备'
      setPortInfo(infoStr)
      setConnected(true)
      addLine('rx', `--- 已连接 @ ${baudRate} bps [${dataBits}${parity === 'none' ? 'N' : parity === 'even' ? 'E' : 'O'}${stopBits}] ---`, '')

      if (port.writable) {
        writerRef.current = port.writable.getWriter()
      }

      readLoop()
    } catch (err) {
      setError(err instanceof Error ? err.message : '连接失败')
      setConnected(false)
    }
  }, [baudRate, dataBits, stopBits, parity, addLine, readLoop])

  const disconnect = useCallback(async () => {
    readLoopRef.current = false
    try {
      if (readerRef.current) {
        await readerRef.current.cancel()
        readerRef.current = null
      }
      if (writerRef.current) {
        writerRef.current.close()
        writerRef.current = null
      }
      if (portRef.current) {
        await portRef.current.close()
        portRef.current = null
      }
    } catch {
      // Ignore close errors
    }
    setConnected(false)
    setPortInfo('')
    addLine('rx', '--- 已断开连接 ---', '')
  }, [addLine])

  const sendData = useCallback(async () => {
    if (!inputData || !writerRef.current) return
    try {
      let bytes: Uint8Array
      if (dataMode === 'HEX') {
        const hexStr = inputData.replace(/\s+/g, '')
        const nums: number[] = []
        for (let i = 0; i < hexStr.length; i += 2) {
          nums.push(parseInt(hexStr.substring(i, i + 2), 16))
        }
        bytes = new Uint8Array(nums)
      } else {
        const text = sendWithNewline ? inputData + '\r\n' : inputData
        bytes = new TextEncoder().encode(text)
      }

      await writerRef.current.write(bytes)
      const display = formatBytes(bytes, dataMode)
      const hex = Array.from(bytes).map(toHex).join(' ')
      addLine('tx', display, hex)
      setInputData('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败')
    }
  }, [inputData, dataMode, sendWithNewline, addLine])

  const clearScreen = useCallback(() => {
    setLines([])
    lineIdRef.current = 0
  }, [])

  if (!supported) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,14,24,0.95)', color: '#a0a0b8', padding: 40, textAlign: 'center' as const }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#cdd6f4' }}>浏览器不支持 Web Serial API</div>
          <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
            Web Serial API 需要在 Chrome 89+ 或 Edge 89+ 中使用<br />
            并需要在 HTTPS 或 localhost 环境下运行<br />
            可在 chrome://flags 中启用 #enable-experimental-web-platform-features
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(14,14,24,0.95)', color: '#cdd6f4', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(108,92,231,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>🔌</span>
        <span style={{ fontSize: 16, fontWeight: 700 }}>串口终端</span>
        {connected && (
          <span style={{ fontSize: 11, color: '#6c7086', marginLeft: 8 }}>{portInfo}</span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: connected ? '#22c55e' : '#6c7086', boxShadow: connected ? '0 0 8px #22c55e' : 'none', transition: 'all 0.3s' }} />
          <span style={{ fontSize: 12, color: connected ? '#22c55e' : '#6c7086', fontWeight: 600 }}>{connected ? '已连接' : '未连接'}</span>
        </div>
      </div>

      {/* Config Bar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(108,92,231,0.15)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: 'rgba(20,20,36,0.6)' }}>
        {/* Baud Rate */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#6c7086' }}>波特率</span>
          <select
            value={baudRate}
            onChange={(e) => setBaudRate(Number(e.target.value))}
            disabled={connected}
            style={{ background: 'rgba(14,14,24,0.8)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 4, padding: '3px 6px', color: '#cdd6f4', fontSize: 12, outline: 'none', cursor: connected ? 'not-allowed' : 'pointer' }}
          >
            {BAUD_RATES.map((b) => <option key={b} value={b} style={{ background: '#1e1e2e' }}>{b}</option>)}
          </select>
        </div>
        {/* Data Bits */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#6c7086' }}>数据位</span>
          <select value={dataBits} onChange={(e) => setDataBits(Number(e.target.value) as 7 | 8)} disabled={connected} style={{ background: 'rgba(14,14,24,0.8)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 4, padding: '3px 6px', color: '#cdd6f4', fontSize: 12, outline: 'none' }}>
            <option value={7} style={{ background: '#1e1e2e' }}>7</option>
            <option value={8} style={{ background: '#1e1e2e' }}>8</option>
          </select>
        </div>
        {/* Stop Bits */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#6c7086' }}>停止位</span>
          <select value={stopBits} onChange={(e) => setStopBits(Number(e.target.value) as StopBits)} disabled={connected} style={{ background: 'rgba(14,14,24,0.8)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 4, padding: '3px 6px', color: '#cdd6f4', fontSize: 12, outline: 'none' }}>
            <option value={1} style={{ background: '#1e1e2e' }}>1</option>
            <option value={2} style={{ background: '#1e1e2e' }}>2</option>
          </select>
        </div>
        {/* Parity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#6c7086' }}>校验</span>
          <select value={parity} onChange={(e) => setParity(e.target.value as Parity)} disabled={connected} style={{ background: 'rgba(14,14,24,0.8)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 4, padding: '3px 6px', color: '#cdd6f4', fontSize: 12, outline: 'none' }}>
            <option value="none" style={{ background: '#1e1e2e' }}>None</option>
            <option value="even" style={{ background: '#1e1e2e' }}>Even</option>
            <option value="odd" style={{ background: '#1e1e2e' }}>Odd</option>
          </select>
        </div>
        {/* Data Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#6c7086' }}>模式</span>
          <select value={dataMode} onChange={(e) => setDataMode(e.target.value as DataMode)} style={{ background: 'rgba(14,14,24,0.8)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 4, padding: '3px 6px', color: '#cdd6f4', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
            <option value="ASCII" style={{ background: '#1e1e2e' }}>ASCII</option>
            <option value="HEX" style={{ background: '#1e1e2e' }}>HEX</option>
          </select>
        </div>
        {/* Auto Scroll */}
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          style={{ background: autoScroll ? 'rgba(108,92,231,0.15)' : 'rgba(14,14,24,0.6)', border: `1px solid ${autoScroll ? 'rgba(108,92,231,0.35)' : 'rgba(108,92,231,0.15)'}`, color: autoScroll ? '#a78bfa' : '#6c7086', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
        >
          {autoScroll ? '↕ 自动滚动' : '↕ 手动滚动'}
        </button>
        {/* Clear */}
        <button
          onClick={clearScreen}
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
        >
          清屏
        </button>
      </div>

      {error && (
        <div style={{ margin: '8px 20px', padding: '6px 12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, fontSize: 12, color: '#f87171' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Terminal Output */}
      <div
        ref={termRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '10px 20px',
          background: 'rgba(8,8,16,0.8)',
          fontFamily: '"Cascadia Code", "Fira Code", "Consolas", monospace',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {lines.length === 0 ? (
          <div style={{ color: '#4a4a5a', padding: 20, textAlign: 'center' }}>
            等待串口数据...<br />
            <span style={{ fontSize: 11 }}>连接串口后，接收的数据将在此显示</span>
          </div>
        ) : (
          lines.map((line) => (
            <div key={line.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={{ color: '#4a4a5a', fontSize: 11, whiteSpace: 'nowrap' as const, minWidth: 80 }}>{line.timestamp}</span>
              <span style={{ color: line.direction === 'rx' ? '#22c55e' : '#f59e0b', fontSize: 11, fontWeight: 700, minWidth: 20 }}>{line.direction === 'rx' ? 'RX' : 'TX'}</span>
              <span style={{ color: line.direction === 'rx' ? '#cdd6f4' : '#f5c542', wordBreak: 'break-all' as const }}>{line.data}</span>
            </div>
          ))
        )}
      </div>

      {/* Input Bar */}
      <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(108,92,231,0.25)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(20,20,36,0.6)' }}>
        {connected ? (
          <>
            <span style={{ color: '#6c5ce7', fontSize: 13, fontWeight: 700 }}>{'>'}</span>
            <input
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendData() }}
              placeholder={dataMode === 'HEX' ? '输入十六进制 (如: 48 65 6C 6C 6F)' : '输入要发送的数据...'}
              style={{
                flex: 1, background: 'rgba(14,14,24,0.8)', border: '1px solid rgba(108,92,231,0.2)',
                borderRadius: 6, padding: '8px 12px', color: '#cdd6f4', fontSize: 13,
                fontFamily: 'inherit', outline: 'none',
              }}
            />
            {dataMode === 'ASCII' && (
              <button
                onClick={() => setSendWithNewline(!sendWithNewline)}
                style={{ background: sendWithNewline ? 'rgba(108,92,231,0.15)' : 'rgba(14,14,24,0.6)', border: `1px solid rgba(108,92,231,0.2)`, color: sendWithNewline ? '#a78bfa' : '#6c7086', borderRadius: 4, padding: '4px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}
              >
                +LF
              </button>
            )}
            <button
              onClick={sendData}
              disabled={!inputData}
              style={{
                padding: '8px 20px', borderRadius: 6, border: 'none',
                background: inputData ? 'linear-gradient(135deg, #6c5ce7, #a78bfa)' : '#2d2d44',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: inputData ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
              }}
            >
              发送
            </button>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              onClick={connect}
              style={{
                padding: '8px 28px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #6c5ce7, #a78bfa)',
                color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: '0 0 12px rgba(108,92,231,0.3)',
              }}
            >
              🔌 连接串口
            </button>
          </div>
        )}
        {connected && (
          <button
            onClick={disconnect}
            style={{
              padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.35)',
              background: 'rgba(239,68,68,0.12)', color: '#f87171', fontSize: 13,
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            断开
          </button>
        )}
      </div>
    </div>
  )
}
