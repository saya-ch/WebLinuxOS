import { useState } from 'react'
import { useStore } from '../store'

interface DictResult {
  word: string
  phonetic?: string
  audio?: string
  meanings: Array<{
    partOfSpeech: string
    definitions: Array<{
      definition: string
      example?: string
      synonyms?: string[]
      antonyms?: string[]
    }>
  }>
}

export default function Dictionary() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<DictResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('weblinux-dict-history')
    return saved ? JSON.parse(saved) : []
  })
  const [showHistory, setShowHistory] = useState(false)

  const bg = isDark ? '#1a1a2e' : '#f5f5f5'
  const textColor = isDark ? '#e0e0e0' : '#333'
  const inputBg = isDark ? '#0f3460' : '#fff'
  const borderColor = isDark ? '#2a2a4a' : '#ddd'
  const accent = isDark ? '#4fc3f7' : '#1976d2'
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'

  const saveToHistory = (word: string) => {
    const newHistory = [word, ...history.filter(w => w !== word)].slice(0, 20)
    setHistory(newHistory)
    localStorage.setItem('weblinux-dict-history', JSON.stringify(newHistory))
  }

  const searchWord = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query.trim())}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('未找到该单词')
        }
        throw new Error('查询失败')
      }

      const data = await response.json()
      const entry = data[0]

      const result: DictResult = {
        word: entry.word,
        phonetic: entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text,
        audio: entry.phonetics?.find((p: any) => p.audio)?.audio,
        meanings: entry.meanings.map((m: any) => ({
          partOfSpeech: m.partOfSpeech,
          definitions: m.definitions.slice(0, 3).map((d: any) => ({
            definition: d.definition,
            example: d.example,
            synonyms: d.synonyms?.slice(0, 5),
            antonyms: d.antonyms?.slice(0, 5)
          }))
        }))
      }

      setResult(result)
      saveToHistory(entry.word)
      setShowHistory(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败')
    } finally {
      setLoading(false)
    }
  }

  const playAudio = () => {
    if (result?.audio) {
      const audio = new Audio(result.audio)
      audio.play().catch(() => {
        console.log('音频播放失败')
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchWord()
    }
  }

  const handleHistoryClick = (word: string) => {
    setQuery(word)
    setShowHistory(false)
    setTimeout(() => {
      setLoading(true)
      setError(null)
      setResult(null)

      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
        .then(res => {
          if (!res.ok) throw new Error('查询失败')
          return res.json()
        })
        .then(data => {
          const entry = data[0]
          const result: DictResult = {
            word: entry.word,
            phonetic: entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text,
            audio: entry.phonetics?.find((p: any) => p.audio)?.audio,
            meanings: entry.meanings.map((m: any) => ({
              partOfSpeech: m.partOfSpeech,
              definitions: m.definitions.slice(0, 3).map((d: any) => ({
                definition: d.definition,
                example: d.example,
                synonyms: d.synonyms?.slice(0, 5),
                antonyms: d.antonyms?.slice(0, 5)
              }))
            }))
          }
          setResult(result)
        })
        .catch(err => {
          setError(err instanceof Error ? err.message : '查询失败')
        })
        .finally(() => {
          setLoading(false)
        })
    }, 100)
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('weblinux-dict-history')
  }

  return (
    <div style={{ height: '100%', background: bg, color: textColor, fontFamily: 'system-ui, sans-serif', fontSize: 13, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: 16, borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowHistory(true)}
            placeholder="输入英文单词..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 8,
              border: `1px solid ${borderColor}`,
              background: inputBg,
              color: textColor,
              fontSize: 15,
              outline: 'none'
            }}
          />
          <button
            onClick={searchWord}
            disabled={loading}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: loading ? '#666' : accent,
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '查询中...' : '查询'}
          </button>
        </div>

        {showHistory && history.length > 0 && (
          <div style={{
            marginTop: 8,
            background: cardBg,
            borderRadius: 8,
            border: `1px solid ${borderColor}`,
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              borderBottom: `1px solid ${borderColor}`
            }}>
              <span style={{ fontSize: 12, color: '#888' }}>搜索历史</span>
              <button
                onClick={clearHistory}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#f66',
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                清除
              </button>
            </div>
            <div style={{ maxHeight: 150, overflowY: 'auto' }}>
              {history.map((word, i) => (
                <button
                  key={i}
                  onClick={() => handleHistoryClick(word)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    background: 'transparent',
                    color: textColor,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 32 }}>🔍</div>
            <div style={{ marginTop: 8, color: '#888' }}>正在查询...</div>
          </div>
        )}

        {error && !loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48 }}>😕</div>
            <div style={{ marginTop: 12, color: '#f66', fontSize: 14 }}>{error}</div>
            <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
              请检查拼写或尝试其他单词
            </div>
          </div>
        )}

        {result && !loading && (
          <div>
            <div style={{
              padding: 16,
              background: cardBg,
              borderRadius: 12,
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h2 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>{result.word}</h2>
                {result.audio && (
                  <button
                    onClick={playAudio}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: 'none',
                      background: accent,
                      color: '#fff',
                      fontSize: 18,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="播放发音"
                  >
                    🔊
                  </button>
                )}
              </div>
              {result.phonetic && (
                <div style={{ color: '#888', fontSize: 14 }}>{result.phonetic}</div>
              )}
            </div>

            {result.meanings.map((meaning, i) => (
              <div
                key={i}
                style={{
                  padding: 16,
                  background: cardBg,
                  borderRadius: 12,
                  marginBottom: 12
                }}
              >
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: accent,
                  color: '#fff',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  marginBottom: 12
                }}>
                  {meaning.partOfSpeech}
                </div>

                {meaning.definitions.map((def, j) => (
                  <div key={j} style={{ marginBottom: j < meaning.definitions.length - 1 ? 12 : 0 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: '#888', fontSize: 12 }}>{j + 1}.</span>
                      <div>
                        <div style={{ fontSize: 14, lineHeight: 1.6 }}>{def.definition}</div>
                        {def.example && (
                          <div style={{
                            marginTop: 6,
                            padding: '8px 12px',
                            background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                            borderRadius: 6,
                            fontSize: 13,
                            fontStyle: 'italic',
                            color: '#aaa'
                          }}>
                            "{def.example}"
                          </div>
                        )}
                        {def.synonyms && def.synonyms.length > 0 && (
                          <div style={{ marginTop: 8, fontSize: 12 }}>
                            <span style={{ color: '#888' }}>同义词: </span>
                            {def.synonyms.map((s, k) => (
                              <span
                                key={k}
                                style={{
                                  color: accent,
                                  cursor: 'pointer',
                                  marginLeft: 4
                                }}
                                onClick={() => {
                                  setQuery(s)
                                  handleHistoryClick(s)
                                }}
                              >
                                {s}
                                {k < def.synonyms!.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                        {def.antonyms && def.antonyms.length > 0 && (
                          <div style={{ marginTop: 6, fontSize: 12 }}>
                            <span style={{ color: '#888' }}>反义词: </span>
                            {def.antonyms.map((a, k) => (
                              <span
                                key={k}
                                style={{
                                  color: '#f66',
                                  cursor: 'pointer',
                                  marginLeft: 4
                                }}
                                onClick={() => {
                                  setQuery(a)
                                  handleHistoryClick(a)
                                }}
                              >
                                {a}
                                {k < def.antonyms!.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {!result && !loading && !error && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📖</div>
            <div style={{ color: '#888', fontSize: 14 }}>
              输入英文单词开始查询
            </div>
            <div style={{ marginTop: 16, color: '#aaa', fontSize: 12 }}>
              支持查询释义、例句、同义词和反义词
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
