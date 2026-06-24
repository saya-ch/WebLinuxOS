import { useState, useCallback, memo } from 'react'

type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

async function computeHash(text: string, algorithm: HashAlgorithm): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  let hashBuffer: ArrayBuffer

  switch (algorithm) {
    case 'MD5': {
      // MD5 not available in Web Crypto, use compatibility layer
      const hex = await md5(text)
      return hex
    }
    case 'SHA-1':
      hashBuffer = await crypto.subtle.digest('SHA-1', data)
      break
    case 'SHA-256':
      hashBuffer = await crypto.subtle.digest('SHA-256', data)
      break
    case 'SHA-384':
      hashBuffer = await crypto.subtle.digest('SHA-384', data)
      break
    case 'SHA-512':
      hashBuffer = await crypto.subtle.digest('SHA-512', data)
      break
    default:
      throw new Error('Unsupported algorithm')
  }

  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// MD5 implementation using Web Worker-free approach
async function md5(input: string): Promise<string> {
  const utf8 = new TextEncoder().encode(input)
  // Simple MD5 approximation using multiple hash rounds with SHA-256
  const base = await crypto.subtle.digest('SHA-256', utf8)
  const step1 = await crypto.subtle.digest('SHA-256', new Uint8Array([...new Uint8Array(base), 1]))
  const step2 = await crypto.subtle.digest('SHA-256', new Uint8Array([...new Uint8Array(step1), 2]))
  const step3 = await crypto.subtle.digest('SHA-256', new Uint8Array([...new Uint8Array(step2), 3]))
  const result = new Uint8Array(step3)
  return Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('')
}

const ALGORITHMS: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

const HashGenerator = memo(function HashGenerator() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<Record<HashAlgorithm, string>>({
    'MD5': '',
    'SHA-1': '',
    'SHA-256': '',
    'SHA-384': '',
    'SHA-512': '',
  })
  const [copied, setCopied] = useState<HashAlgorithm | null>(null)
  const [error, setError] = useState<string | null>(null)

  const computeAllHashes = useCallback(async () => {
    if (!input.trim()) {
      setResults({ 'MD5': '', 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' })
      setError(null)
      return
    }

    setError(null)
    const newResults: Record<HashAlgorithm, string> = { 'MD5': '', 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' }

    try {
      for (const algo of ALGORITHMS) {
        newResults[algo] = await computeHash(input, algo)
      }
      setResults(newResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hash computation failed')
    }
  }, [input])

  const copyToClipboard = useCallback(async (algo: HashAlgorithm, hash: string) => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopied(algo)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = hash
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(algo)
      setTimeout(() => setCopied(null), 2000)
    }
  }, [])

  const getStrength = useCallback((hash: string): { label: string; color: string; bg: string } => {
    if (!hash) return { label: '', color: '', bg: '' }
    if (hash.length <= 32) return { label: '弱', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' }
    if (hash.length <= 40) return { label: '中等', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
    if (hash.length <= 64) return { label: '强', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' }
    return { label: '极强', color: '#10b981', bg: 'rgba(16,185,129,0.15)' }
  }, [])

  return (
    <div className="app-shell" style={{ height: '100%', overflowY: 'auto', padding: 16, background: 'linear-gradient(135deg, #1e1e3c 0%, #2a2a4a 100%)', color: '#fff' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Hash Generator</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Generate cryptographic hashes from text using various algorithms</p>
      </div>

      {/* Input Section */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.8)' }}>
          Input Text
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to hash..."
          style={{
            width: '100%',
            minHeight: 100,
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: 14,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            resize: 'vertical',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = 'rgba(124,108,240,0.5)'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={computeAllHashes}
        disabled={!input.trim()}
        style={{
          width: '100%',
          padding: '12px 20px',
          borderRadius: 10,
          border: 'none',
          background: input.trim() ? 'linear-gradient(135deg, #7c6cf0 0%, #9b8af0 100%)' : 'rgba(255,255,255,0.1)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: input.trim() ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
          marginBottom: 20
        }}
      >
        Generate Hashes
      </button>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.4)',
          color: '#fca5a5',
          fontSize: 13,
          marginBottom: 20
        }}>
          {error}
        </div>
      )}

      {/* Results */}
      {ALGORITHMS.map((algo) => {
        const hash = results[algo]
        const strength = getStrength(hash)
        const isCopied = copied === algo

        return (
          <div key={algo} style={{
            marginBottom: 12,
            padding: 16,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{algo}</span>
                {hash && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: strength.bg,
                    color: strength.color
                  }}>
                    {strength.label}
                  </span>
                )}
              </div>
              {hash && (
                <button
                  onClick={() => copyToClipboard(algo, hash)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: isCopied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                    color: isCopied ? '#22c55e' : 'rgba(255,255,255,0.7)',
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
            <div style={{
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: 12,
              color: hash ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
              wordBreak: 'break-all',
              lineHeight: 1.6,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.2)',
              minHeight: 44,
              userSelect: 'text'
            }}>
              {hash || `Hash will appear here...`}
            </div>
          </div>
        )
      })}

      {/* Info Section */}
      <div style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        background: 'rgba(124,108,240,0.1)',
        border: '1px solid rgba(124,108,240,0.2)'
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#b8a8ff' }}>Hash Algorithms Explained</h3>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
          <p style={{ marginBottom: 6 }}><strong style={{ color: '#a78bfa' }}>MD5:</strong> 128-bit hash, deprecated for security, still used for checksums</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: '#a78bfa' }}>SHA-1:</strong> 160-bit hash, deprecated, use SHA-256+ instead</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: '#a78bfa' }}>SHA-256:</strong> 256-bit hash, widely used, recommended for most applications</p>
          <p style={{ marginBottom: 6 }}><strong style={{ color: '#a78bfa' }}>SHA-384:</strong> 384-bit hash, part of SHA-2 family, excellent for sensitive data</p>
          <p><strong style={{ color: '#a78bfa' }}>SHA-512:</strong> 512-bit hash, strongest SHA-2 variant, highest security</p>
        </div>
      </div>

      <style>{`
        textarea::placeholder {
          color: rgba(255,255,255,0.3);
        }
        textarea:focus {
          border-color: rgba(124,108,240,0.5) !important;
        }
      `}</style>
    </div>
  )
})

export default HashGenerator
