import { useState, useCallback } from 'react'

type UuidVersion = 'v4' | 'v1' | 'nil'

interface GeneratedUuid {
  id: string
  uuid: string
  version: string
  time: string
}

function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try {
      return (crypto as Crypto).randomUUID()
    } catch {
      // fall through
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function generateUuidV1(): string {
  const pad = (n: number, len: number) => n.toString(16).padStart(len, '0').slice(-len)
  const timeLow = Math.floor(Date.now() / 1000) & 0xffffffff
  const timeMid = Math.floor(Math.random() * 0xffff)
  const timeHiAndVersion = (Math.floor(Math.random() * 0x0fff)) | 0x1000
  const clockSeqHi = (Math.floor(Math.random() * 0x3f)) | 0x80
  const clockSeqLow = Math.floor(Math.random() * 0xff)
  const node = Array.from({ length: 6 }, () => Math.floor(Math.random() * 0xff))
  return [
    pad(timeLow, 8),
    pad(timeMid, 4),
    pad(timeHiAndVersion, 4),
    pad(clockSeqHi, 2) + pad(clockSeqLow, 2),
    node.map((b) => pad(b, 2)).join(''),
  ].join('-')
}

function generateNil(): string {
  return '00000000-0000-0000-0000-000000000000'
}

function generateShortId(length = 11): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false)
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return Promise.resolve(true)
  } catch {
    return Promise.resolve(false)
  }
}

function validateUuid(input: string): { valid: boolean; version: string; lowercase: string } {
  const trimmed = input.trim()
  const re = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
  if (!re.test(trimmed)) {
    return { valid: false, version: 'N/A', lowercase: '' }
  }
  const lower = trimmed.toLowerCase()
  const verChar = lower.charAt(14)
  let version = 'unknown'
  if (lower === '00000000-0000-0000-0000-000000000000') {
    version = 'nil'
  } else if (verChar >= '1' && verChar <= '8') {
    version = 'v' + verChar
  }
  return { valid: true, version, lowercase: lower }
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: '#fafafa',
    color: '#1f2937',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    padding: '18px 22px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
  },
  title: { fontSize: '16px', fontWeight: 600, margin: 0 },
  subtitle: { marginTop: 4, fontSize: '12px', color: '#6b7280', margin: 0 },
  body: {
    padding: 20,
    flex: '1 1 auto',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 16,
    overflowY: 'auto' as const,
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: 18,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  },
  cardTitle: { fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 },
  row: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    alignItems: 'center',
  },
  select: {
    padding: '7px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    fontSize: '13px',
    outline: 'none',
  },
  input: {
    padding: '7px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: '13px',
    outline: 'none',
    width: 90,
  },
  button: {
    padding: '7px 14px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    borderRadius: 8,
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  buttonGhost: {
    padding: '6px 10px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    borderRadius: 6,
    fontSize: '12px',
    cursor: 'pointer',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    maxHeight: 240,
    overflowY: 'auto' as const,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: '8px 12px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: '13px',
  },
  mono: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '12.5px',
    color: '#111827',
    userSelect: 'all' as const,
    wordBreak: 'break-all' as const,
  },
  badge: { fontSize: '11px', color: '#6b7280', whiteSpace: 'nowrap' as const },
  empty: { color: '#9ca3af', fontSize: '13px', textAlign: 'center' as const, padding: '18px 0' },
  inputBox: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  infoRow: {
    fontSize: '12px',
    color: '#4b5563',
    padding: '10px 12px',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    lineHeight: 1.6,
  },
  infoLabel: { color: '#6b7280', marginRight: 6 },
}

export default function UuidTools() {
  const [version, setVersion] = useState<UuidVersion>('v4')
  const [count, setCount] = useState<number>(5)
  const [generated, setGenerated] = useState<GeneratedUuid[]>([])
  const [shortCount, setShortCount] = useState<number>(5)
  const [shortLen, setShortLen] = useState<number>(11)
  const [shortIds, setShortIds] = useState<GeneratedUuid[]>([])
  const [validateInput, setValidateInput] = useState('')
  const [toast, setToast] = useState<string>('')

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 1600)
  }, [])

  const handleGenerate = useCallback(() => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString()
    const items: GeneratedUuid[] = []
    for (let i = 0; i < count; i++) {
      let uuid = ''
      if (version === 'v4') uuid = generateUuidV4()
      else if (version === 'v1') uuid = generateUuidV1()
      else uuid = generateNil()
      items.push({ id: generateShortId(10), uuid, version: version.toUpperCase(), time: timeStr })
    }
    setGenerated((prev) => [...items, ...prev].slice(0, 100))
  }, [version, count])

  const handleGenerateShort = useCallback(() => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString()
    const items: GeneratedUuid[] = []
    for (let i = 0; i < shortCount; i++) {
      items.push({ id: generateShortId(10), uuid: generateShortId(shortLen), version: `长度 ${shortLen}`, time: timeStr })
    }
    setShortIds((prev) => [...items, ...prev].slice(0, 100))
  }, [shortCount, shortLen])

  const handleCopy = useCallback(async (text: string) => {
    const ok = await copyToClipboard(text)
    showToast(ok ? '已复制到剪贴板' : '复制失败')
  }, [showToast])

  const handleCopyList = useCallback(async (list: GeneratedUuid[]) => {
    const text = list.map((g) => g.uuid).join('\n')
    if (!text) return
    const ok = await copyToClipboard(text)
    showToast(ok ? `已复制 ${list.length} 项` : '复制失败')
  }, [showToast])

  const validation = validateUuid(validateInput)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>UUID 工具箱</h2>
        <p style={styles.subtitle}>生成、验证和管理唯一标识符</p>
      </div>
      <div style={styles.body}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>生成 UUID</h3>
          <div style={styles.row}>
            <span style={{ fontSize: 12, color: '#374151' }}>版本</span>
            <select
              style={styles.select}
              value={version}
              onChange={(e) => setVersion(e.target.value as UuidVersion)}
            >
              <option value="v4">UUID v4 (随机)</option>
              <option value="v1">UUID v1 (时间)</option>
              <option value="nil">Nil UUID</option>
            </select>
            <span style={{ fontSize: 12, color: '#374151' }}>数量</span>
            <input
              style={styles.input}
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
            />
            <button style={styles.button} onClick={handleGenerate}>生成</button>
            <button style={{ ...styles.buttonGhost, backgroundColor: '#f3f4f6' }} onClick={() => setGenerated([])}>清空</button>
            <button style={{ ...styles.buttonGhost, backgroundColor: '#f3f4f6' }} onClick={() => handleCopyList(generated)}>复制全部</button>
          </div>
          <div style={styles.list}>
            {generated.length === 0 && <div style={styles.empty}>暂无记录，点击“生成”开始</div>}
            {generated.map((g) => (
              <div style={styles.item} key={g.id}>
                <span style={styles.mono}>{g.uuid}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={styles.badge}>{g.version}</span>
                  <span style={styles.badge}>{g.time}</span>
                  <button style={styles.buttonGhost} onClick={() => handleCopy(g.uuid)}>复制</button>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>短 ID 生成</h3>
          <div style={styles.row}>
            <span style={{ fontSize: 12, color: '#374151' }}>长度</span>
            <input
              style={styles.input}
              type="number"
              min={4}
              max={32}
              value={shortLen}
              onChange={(e) => setShortLen(Math.max(4, Math.min(32, Number(e.target.value) || 4)))}
            />
            <span style={{ fontSize: 12, color: '#374151' }}>数量</span>
            <input
              style={styles.input}
              type="number"
              min={1}
              max={50}
              value={shortCount}
              onChange={(e) => setShortCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
            />
            <button style={styles.button} onClick={handleGenerateShort}>生成</button>
            <button style={{ ...styles.buttonGhost, backgroundColor: '#f3f4f6' }} onClick={() => setShortIds([])}>清空</button>
            <button style={{ ...styles.buttonGhost, backgroundColor: '#f3f4f6' }} onClick={() => handleCopyList(shortIds)}>复制全部</button>
          </div>
          <div style={styles.list}>
            {shortIds.length === 0 && <div style={styles.empty}>暂无短 ID 记录</div>}
            {shortIds.map((g) => (
              <div style={styles.item} key={g.id}>
                <span style={styles.mono}>{g.uuid}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={styles.badge}>{g.version}</span>
                  <span style={styles.badge}>{g.time}</span>
                  <button style={styles.buttonGhost} onClick={() => handleCopy(g.uuid)}>复制</button>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>验证 UUID</h3>
          <input
            style={styles.inputBox}
            placeholder="粘贴 UUID 以验证..."
            value={validateInput}
            onChange={(e) => setValidateInput(e.target.value)}
          />
          {validateInput && (
            <div style={styles.infoRow}>
              <div>
                <span style={styles.infoLabel}>状态：</span>
                <span style={{ color: validation.valid ? '#059669' : '#dc2626', fontWeight: 600 }}>
                  {validation.valid ? '有效 UUID' : '无效格式'}
                </span>
              </div>
              <div>
                <span style={styles.infoLabel}>版本：</span>
                <span>{validation.version}</span>
              </div>
              {validation.valid && (
                <div>
                  <span style={styles.infoLabel}>小写：</span>
                  <span style={styles.mono}>{validation.lowercase}</span>
                  <button style={{ ...styles.buttonGhost, marginLeft: 8 }} onClick={() => handleCopy(validation.lowercase)}>复制</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 18px',
            backgroundColor: '#111827',
            color: '#ffffff',
            borderRadius: 8,
            fontSize: 13,
            zIndex: 999,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
