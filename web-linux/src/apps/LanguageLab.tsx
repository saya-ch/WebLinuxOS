import { useEffect, useMemo, useRef, useState } from 'react'

/* ============================================================
 * LanguageLab · 语言实验室
 * 基于两个公开免费 API：
 *  1. Free Dictionary API (dictionaryapi.dev) — 英语词典：
 *     释义、音标、音频、同义词、反义词、例句
 *  2. MyMemory Translation API (mymemory.translated.net) — 多语翻译：
 *     支持 zh-CN / en / ja / ko / fr / de / es / it 等 100+ 语言
 * 两个 API 均免注册、免 Key、CORS 友好。
 *
 * 额外自带：
 *  - 生词本（localStorage，1000 条上限）
 *  - 闪卡复习（基于生词本的翻转抽卡）
 *  - 搜索历史（50 条）
 *  - 24h 内存 + localStorage 缓存，避免重复请求
 *  - 全文本发音（Web Speech API SpeechSynthesis）
 * ============================================================ */

type Tab = 'dictionary' | 'translator' | 'flashcards' | 'vocabulary'

interface Phonetic { text?: string; audio?: string }
interface MeaningDef { definition: string; example?: string; synonyms?: string[]; antonyms?: string[] }
interface Meaning { partOfSpeech: string; definitions: MeaningDef[]; synonyms?: string[]; antonyms?: string[] }
interface DictEntry { word: string; phonetic?: string; phonetics: Phonetic[]; meanings: Meaning[]; sourceUrls?: string[] }

interface VocabItem {
  id: string
  word: string
  meaning: string
  lang: string
  addedAt: number
  reviewCount: number
  lastReviewed?: number
}

const LANG_OPTIONS: Array<{ code: string; label: string; flag: string }> = [
  { code: 'zh-CN', label: '中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
]

const DICT_CACHE_KEY = 'languagelab:dict-cache:v1'
const TRANS_CACHE_KEY = 'languagelab:trans-cache:v1'
const VOCAB_KEY = 'languagelab:vocabulary:v1'
const HISTORY_KEY = 'languagelab:history:v1'

type DictCache = Record<string, { t: number; data: DictEntry[] }>
type TransCache = Record<string, { t: number; data: string }>

const DAY_MS = 86400000

function loadJSON<T>(k: string, fb: T): T {
  try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) as T : fb } catch { return fb }
}
function saveJSON(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ }
}

export default function LanguageLab() {
  const [tab, setTab] = useState<Tab>('dictionary')

  // === Dictionary State ===
  const [dictWord, setDictWord] = useState('serendipity')
  const [dictLoading, setDictLoading] = useState(false)
  const [dictError, setDictError] = useState<string | null>(null)
  const [dictResult, setDictResult] = useState<DictEntry[] | null>(null)
  const [dictHistory, setDictHistory] = useState<string[]>(() => loadJSON(HISTORY_KEY, []))
  const dictCacheRef = useRef<DictCache>(loadJSON(DICT_CACHE_KEY, {}))

  // === Translator State ===
  const [transText, setTransText] = useState('Hello, welcome to the language laboratory.')
  const [transFrom, setTransFrom] = useState('en')
  const [transTo, setTransTo] = useState('zh-CN')
  const [transLoading, setTransLoading] = useState(false)
  const [transError, setTransError] = useState<string | null>(null)
  const [transResult, setTransResult] = useState<string>('')
  const transCacheRef = useRef<TransCache>(loadJSON(TRANS_CACHE_KEY, {}))

  // === Vocabulary ===
  const [vocab, setVocab] = useState<VocabItem[]>(() => loadJSON(VOCAB_KEY, []))
  const [vocabFilter, setVocabFilter] = useState('')

  // === Flashcards ===
  const [cardIndex, setCardIndex] = useState(0)
  const [cardFlipped, setCardFlipped] = useState(false)
  const [cardSessionCount, setCardSessionCount] = useState(0)

  useEffect(() => { saveJSON(VOCAB_KEY, vocab) }, [vocab])
  useEffect(() => { saveJSON(HISTORY_KEY, dictHistory.slice(0, 50)) }, [dictHistory])

  const filteredVocab = useMemo(() => {
    const q = vocabFilter.trim().toLowerCase()
    const list = [...vocab].sort((a, b) => b.addedAt - a.addedAt)
    return q ? list.filter(v => v.word.toLowerCase().includes(q) || v.meaning.toLowerCase().includes(q)) : list
  }, [vocab, vocabFilter])

  /* -------- Dictionary API -------- */
  async function fetchDictionary(word: string) {
    const q = word.trim().toLowerCase()
    if (!q) return
    const now = Date.now()
    const cached = dictCacheRef.current[q]
    if (cached && (now - cached.t) < DAY_MS) {
      setDictResult(cached.data)
      setDictError(null)
      return
    }
    setDictLoading(true)
    setDictError(null)
    try {
      const resp = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`)
      if (!resp.ok) throw new Error(resp.status === 404 ? '未找到该单词，请检查拼写。' : `HTTP ${resp.status}`)
      const data = (await resp.json()) as DictEntry[]
      dictCacheRef.current[q] = { t: now, data }
      saveJSON(DICT_CACHE_KEY, dictCacheRef.current)
      setDictResult(data)
      setDictHistory(prev => {
        const next = [q, ...prev.filter(h => h !== q)]
        return next.slice(0, 50)
      })
    } catch (e) {
      setDictResult(null)
      setDictError(e instanceof Error ? e.message : '查询失败')
    } finally {
      setDictLoading(false)
    }
  }

  /* -------- Translator API -------- */
  async function fetchTranslation() {
    const text = transText.trim()
    if (!text) return
    const key = `${transFrom}:${transTo}:${text}`
    const now = Date.now()
    const cached = transCacheRef.current[key]
    if (cached && (now - cached.t) < DAY_MS) {
      setTransResult(cached.data)
      setTransError(null)
      return
    }
    setTransLoading(true)
    setTransError(null)
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(transFrom)}|${encodeURIComponent(transTo)}`
      const resp = await fetch(url)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const json = (await resp.json()) as { responseData?: { translatedText?: string }; responseStatus?: number }
      const out = json?.responseData?.translatedText || ''
      if (!out) throw new Error('翻译服务返回空结果')
      transCacheRef.current[key] = { t: now, data: out }
      saveJSON(TRANS_CACHE_KEY, transCacheRef.current)
      setTransResult(out)
    } catch (e) {
      setTransResult('')
      setTransError(e instanceof Error ? e.message : '翻译失败')
    } finally {
      setTransLoading(false)
    }
  }

  /* -------- Speech -------- */
  function speak(text: string, lang = 'en-US') {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const fullLang = LANG_OPTIONS.find(l => l.code === lang)?.code
    if (fullLang) u.lang = fullLang === 'zh-CN' ? 'zh-CN' : fullLang
    u.rate = 0.95
    window.speechSynthesis.speak(u)
  }

  /* -------- Vocab helpers -------- */
  function addToVocab(word: string, meaning: string, lang: string = 'en') {
    setVocab(prev => {
      if (prev.some(v => v.word.toLowerCase() === word.toLowerCase())) {
        return prev
      }
      if (prev.length >= 1000) {
        return [...prev.slice(0, 999), {
          id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          word, meaning, lang,
          addedAt: Date.now(), reviewCount: 0,
        }]
      }
      return [{
        id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        word, meaning, lang,
        addedAt: Date.now(), reviewCount: 0,
      }, ...prev]
    })
  }

  function removeVocab(id: string) {
    setVocab(prev => prev.filter(v => v.id !== id))
  }

  function clearVocab() {
    if (confirm('确定清空整个生词本吗？此操作不可撤销。')) setVocab([])
  }

  /* -------- Flashcards -------- */
  const studyDeck = useMemo(() => [...vocab].sort((a, b) => a.reviewCount - b.reviewCount || a.addedAt - b.addedAt), [vocab])
  const currentCard = studyDeck[cardIndex % Math.max(1, studyDeck.length)]

  function markCardReview(remembered: boolean) {
    if (!currentCard) return
    setVocab(prev => prev.map(v => v.id === currentCard.id
      ? { ...v, reviewCount: v.reviewCount + 1, lastReviewed: Date.now() }
      : v,
    ))
    setCardSessionCount(c => c + 1)
    // 若选了「记住了」且是循环末尾则可停止；无论如何翻下一张
    setCardIndex(i => i + 1)
    setCardFlipped(false)
    void remembered
  }

  /* -------- First run auto lookups -------- */
  useEffect(() => { void fetchDictionary(dictWord); void fetchTranslation() /* eslint-disable-next-line */ }, [])

  /* ============ RENDER ============ */
  return (
    <div style={styles.wrap}>
      {/* ========== HEADER ========== */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.brandMark}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 5h16M4 19h16M12 5l-4 7h8l-4 7" />
            </svg>
          </div>
          <div>
            <div style={styles.brandTitle}>LanguageLab</div>
            <div style={styles.brandSub}>语言实验室 · Dictionary + Translator + Flashcards</div>
          </div>
        </div>
        <nav style={styles.tabs}>
          {(['dictionary', 'translator', 'flashcards', 'vocabulary'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              ...styles.tab, ...(tab === t ? styles.tabActive : {}),
            }}>
              {t === 'dictionary' && '📖 词典'}
              {t === 'translator' && '🌐 翻译'}
              {t === 'flashcards' && '🎴 闪卡'}
              {t === 'vocabulary' && `📚 生词本 (${vocab.length})`}
            </button>
          ))}
        </nav>
      </header>

      {/* ========== DICTIONARY ========== */}
      {tab === 'dictionary' && (
        <section style={styles.body}>
          <div style={styles.row}>
            <input
              value={dictWord}
              onChange={e => setDictWord(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') fetchDictionary(dictWord) }}
              placeholder="输入英文单词，例如：serendipity"
              style={styles.input}
            />
            <button style={styles.btnPrimary} onClick={() => fetchDictionary(dictWord)} disabled={dictLoading}>
              {dictLoading ? '查询中…' : '查询'}
            </button>
            <button style={styles.btnGhost} onClick={() => dictWord && speak(dictWord, 'en')}>🔊 朗读</button>
          </div>

          {dictHistory.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              <span style={{ color: 'var(--text-dim)', fontSize: 12, alignSelf: 'center' }}>历史：</span>
              {dictHistory.slice(0, 10).map(h => (
                <button key={h} onClick={() => { setDictWord(h); fetchDictionary(h) }} style={styles.chip}>{h}</button>
              ))}
            </div>
          )}

          {dictError && <div style={styles.errorBox}>{dictError}</div>}

          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {dictLoading && <div style={styles.skeleton}><div style={{ ...styles.sk, width: '30%' }} /><div style={{ ...styles.sk, width: '70%', marginTop: 8 }} /><div style={{ ...styles.sk, width: '55%', marginTop: 8 }} /></div>}
            {!dictLoading && dictResult && dictResult.map((entry, i) => {
              const firstAudio = entry.phonetics.find(p => p.audio)?.audio
              const firstPhonetic = entry.phonetic || entry.phonetics.find(p => p.text)?.text
              return (
                <article key={i} style={styles.entryCard}>
                  <div style={styles.entryHead}>
                    <div>
                      <h2 style={styles.entryWord}>{entry.word}</h2>
                      {firstPhonetic && <span style={styles.entryPhonetic}>/{firstPhonetic}/</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {firstAudio && (
                        <button style={styles.btnGhostSmall} onClick={() => {
                          const a = new Audio(firstAudio); a.play().catch(() => speak(entry.word, 'en'))
                        }}>▶ 发音</button>
                      )}
                      <button
                        style={styles.btnGhostSmall}
                        onClick={() => {
                          const m = entry.meanings[0]
                          const def = m?.definitions[0]?.definition || ''
                          addToVocab(entry.word, `${m?.partOfSpeech || ''} ${def}`.trim())
                        }}
                      >＋ 加入生词本</button>
                    </div>
                  </div>

                  {entry.meanings.map((m, mi) => (
                    <div key={mi} style={{ marginTop: 12 }}>
                      <div style={styles.posTag}>{m.partOfSpeech}</div>
                      <ol style={styles.defList}>
                        {m.definitions.slice(0, 5).map((d, di) => (
                          <li key={di} style={styles.defItem}>
                            <div>{d.definition}</div>
                            {d.example && <div style={styles.example}>“{d.example}”</div>}
                            {(d.synonyms?.length || 0) > 0 && (
                              <div style={styles.relatedRow}>
                                <span className="lbl">同:</span>
                                {d.synonyms!.slice(0, 6).map(s => (
                                  <button key={s} style={styles.miniChip} onClick={() => { setDictWord(s); fetchDictionary(s) }}>{s}</button>
                                ))}
                              </div>
                            )}
                            {(d.antonyms?.length || 0) > 0 && (
                              <div style={styles.relatedRow}>
                                <span className="lbl">反:</span>
                                {d.antonyms!.slice(0, 6).map(s => (
                                  <button key={s} style={styles.miniChip} onClick={() => { setDictWord(s); fetchDictionary(s) }}>{s}</button>
                                ))}
                              </div>
                            )}
                          </li>
                        ))}
                      </ol>
                      {(m.synonyms?.length || 0) > 0 && (
                        <div style={styles.relatedRow}>
                          <strong>同义词:</strong>
                          {m.synonyms!.slice(0, 10).map(s => (
                            <button key={s} style={styles.miniChip} onClick={() => { setDictWord(s); fetchDictionary(s) }}>{s}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </article>
              )
            })}
            {!dictLoading && !dictResult && !dictError && (
              <div style={styles.emptyHint}>输入英文单词开始查询（由 Free Dictionary API 驱动）</div>
            )}
          </div>
        </section>
      )}

      {/* ========== TRANSLATOR ========== */}
      {tab === 'translator' && (
        <section style={styles.body}>
          <div style={styles.transGrid}>
            <div style={styles.transCol}>
              <div style={styles.transHead}>
                <select value={transFrom} onChange={e => setTransFrom(e.target.value)} style={styles.select}>
                  {LANG_OPTIONS.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
                </select>
                <button style={styles.btnGhostSmall} onClick={() => speak(transText, transFrom)}>🔊</button>
              </div>
              <textarea
                value={transText}
                onChange={e => setTransText(e.target.value)}
                placeholder="输入要翻译的文本..."
                style={styles.textarea}
                rows={8}
              />
              <div style={styles.metaRow}>
                <span>{transText.length} 字符</span>
                <button style={styles.btnLink} onClick={() => setTransText('')}>清空</button>
              </div>
            </div>

            <div style={styles.swapCol}>
              <button
                title="交换语言"
                style={styles.swapBtn}
                onClick={() => { const f = transFrom; setTransFrom(transTo); setTransTo(f) }}
              >⇄</button>
            </div>

            <div style={styles.transCol}>
              <div style={styles.transHead}>
                <select value={transTo} onChange={e => setTransTo(e.target.value)} style={styles.select}>
                  {LANG_OPTIONS.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
                </select>
                <button style={styles.btnGhostSmall} onClick={() => speak(transResult, transTo)}>🔊</button>
              </div>
              <div style={{ ...styles.textarea, ...(transLoading ? { opacity: 0.6 } : {}) }}>
                {transLoading ? '翻译中…' : (transResult || <span style={{ color: 'var(--text-dim)' }}>翻译结果将显示在此处</span>)}
              </div>
              <div style={styles.metaRow}>
                <span>{transResult.length} 字符</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {transResult && (
                    <>
                      <button style={styles.btnLink} onClick={() => navigator.clipboard?.writeText(transResult)}>复制</button>
                      <button
                        style={styles.btnLink}
                        onClick={() => addToVocab(transText.slice(0, 40), transResult.slice(0, 200), transFrom)}
                      >＋ 加入生词本</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {transError && <div style={{ ...styles.errorBox, marginTop: 14 }}>{transError}</div>}

          <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button style={styles.btnPrimary} onClick={fetchTranslation} disabled={transLoading}>
              {transLoading ? '翻译中…' : '翻译'}
            </button>
          </div>

          <div style={{ marginTop: 20, padding: 14, background: 'var(--panel-2)', borderRadius: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>⚡ 快速示例</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { text: 'The quick brown fox jumps over the lazy dog.', from: 'en', to: 'zh-CN' },
                { text: '人工智能正在重塑软件开发的方式。', from: 'zh-CN', to: 'en' },
                { text: 'La vie est belle.', from: 'fr', to: 'en' },
                { text: 'Guten Tag, wie geht es dir?', from: 'de', to: 'zh-CN' },
                { text: 'こんにちは世界', from: 'ja', to: 'en' },
              ].map((ex, i) => (
                <button key={i} style={styles.chip} onClick={() => {
                  setTransText(ex.text); setTransFrom(ex.from); setTransTo(ex.to)
                  setTimeout(fetchTranslation, 50)
                }}>例 {i + 1}</button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== FLASHCARDS ========== */}
      {tab === 'flashcards' && (
        <section style={{ ...styles.body, alignItems: 'center' }}>
          {studyDeck.length === 0 ? (
            <div style={styles.emptyBig}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎴</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>生词本是空的</div>
              <div style={{ color: 'var(--text-dim)', textAlign: 'center', maxWidth: 460 }}>
                去「词典」或「翻译」页面查询词或句，点击「＋加入生词本」即可开始积累。
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', maxWidth: 640 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ color: 'var(--text-dim)' }}>
                  第 {(cardIndex % studyDeck.length) + 1} / {studyDeck.length} 张 · 本轮复习 {cardSessionCount} 次
                </div>
                <div style={{ color: 'var(--text-dim)' }}>
                  进度 {(Math.min(cardIndex, studyDeck.length))}/{studyDeck.length}
                </div>
              </div>

              <div
                onClick={() => setCardFlipped(f => !f)}
                style={{
                  ...styles.card,
                  transform: cardFlipped ? 'rotateY(180deg)' : 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center', padding: 32, textAlign: 'center',
                  backfaceVisibility: 'hidden',
                }}>
                  <div style={{ fontSize: 12, letterSpacing: 2, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase' }}>
                    {currentCard.lang || 'WORD'}
                  </div>
                  <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.3 }}>{currentCard.word}</div>
                  <div style={{ marginTop: 24, color: 'var(--text-dim)', fontSize: 13 }}>点击卡片查看释义 · 复习 {currentCard.reviewCount} 次</div>
                </div>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center', padding: 32, textAlign: 'center',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}>
                  <div style={{ fontSize: 12, letterSpacing: 2, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase' }}>MEANING</div>
                  <div style={{ fontSize: 20, lineHeight: 1.6 }}>{currentCard.meaning || '（无释义）'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 28 }}>
                <button style={styles.btnGhost} onClick={() => markCardReview(false)}>😵 忘了</button>
                <button style={styles.btnPrimary} onClick={() => markCardReview(true)}>✅ 记住了</button>
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 8 }}>
                <button style={styles.btnGhostSmall} onClick={() => { setCardIndex(0); setCardFlipped(false) }}>🔁 重新开始</button>
                <button style={styles.btnGhostSmall} onClick={() => { setCardFlipped(f => !f) }}>🔃 翻转</button>
                <button style={styles.btnGhostSmall} onClick={() => speak(currentCard.word, currentCard.lang)}>🔊 朗读</button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========== VOCABULARY ========== */}
      {tab === 'vocabulary' && (
        <section style={styles.body}>
          <div style={styles.row}>
            <input
              value={vocabFilter}
              onChange={e => setVocabFilter(e.target.value)}
              placeholder="搜索生词本中的单词或释义…"
              style={{ ...styles.input, flex: 1 }}
            />
            <button style={styles.btnGhost} onClick={() => setVocabFilter('')}>清除</button>
            <button style={styles.btnDanger} onClick={clearVocab}>清空</button>
          </div>

          <div style={{ marginTop: 14, color: 'var(--text-dim)', fontSize: 13 }}>
            共 {vocab.length} 个词汇（显示 {filteredVocab.length} 个匹配项）
          </div>

          {filteredVocab.length === 0 ? (
            <div style={styles.emptyBig}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>还没有单词</div>
              <div style={{ color: 'var(--text-dim)', maxWidth: 460, textAlign: 'center' }}>
                在「词典」或「翻译」中查到单词后，点击「＋ 加入生词本」开始建立你的词汇库。
              </div>
            </div>
          ) : (
            <div style={styles.vocabGrid}>
              {filteredVocab.map(v => (
                <div key={v.id} style={styles.vocabCard}>
                  <div style={styles.vocabHead}>
                    <div style={styles.vocabWord}>{v.word}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button title="朗读" style={styles.iconBtn} onClick={() => speak(v.word, v.lang)}>🔊</button>
                      <button title="删除" style={styles.iconBtn} onClick={() => removeVocab(v.id)}>🗑</button>
                    </div>
                  </div>
                  <div style={styles.vocabMeaning}>{v.meaning}</div>
                  <div style={styles.vocabMeta}>
                    <span>{new Date(v.addedAt).toLocaleDateString()} 添加</span>
                    <span>复习 {v.reviewCount} 次</span>
                    <span>{LANG_OPTIONS.find(l => l.code === v.lang)?.label || v.lang}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========== FOOTER ========== */}
      <footer style={styles.footer}>
        <span>Powered by Free Dictionary API · MyMemory Translation API · Web Speech API</span>
        <span>数据本地持久化 · 24h 智能缓存</span>
      </footer>
    </div>
  )
}

/* =========================================================
 * STYLES (inline 以确保独立应用不受其他 css 影响)
 * ========================================================= */
const styles: Record<string, React.CSSProperties> = {
  wrap: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '"Source Serif Pro", "Noto Serif SC", Georgia, "Times New Roman", serif',
    color: 'var(--text, #1a1a1a)',
    background: 'linear-gradient(180deg, color-mix(in srgb, var(--panel) 60%, transparent), var(--panel))',
  },
  header: {
    padding: '14px 20px',
    borderBottom: '1px solid var(--border, rgba(127,127,127,0.2))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    flexWrap: 'wrap',
    background: 'color-mix(in srgb, var(--panel) 70%, transparent)',
    backdropFilter: 'blur(8px)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12 },
  brandMark: {
    width: 40, height: 40, borderRadius: 10,
    background: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)',
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 18px -6px rgba(234,88,12,0.5)',
  },
  brandTitle: { fontWeight: 800, fontSize: 20, letterSpacing: 0.2 },
  brandSub: { fontSize: 12, color: 'var(--text-dim, #666)', fontFamily: 'system-ui, sans-serif' },

  tabs: { display: 'flex', gap: 4, padding: 4, background: 'var(--panel-2, rgba(127,127,127,0.08))', borderRadius: 10 },
  tab: {
    background: 'transparent', border: 0, padding: '8px 14px', borderRadius: 8,
    cursor: 'pointer', color: 'var(--text-dim)', fontFamily: 'inherit',
    fontSize: 13, fontWeight: 600, transition: 'all 150ms ease',
  },
  tabActive: {
    background: 'var(--panel, #fff)',
    color: 'var(--text, #1a1a1a)',
    boxShadow: '0 2px 10px -4px rgba(0,0,0,0.15)',
  },

  body: {
    flex: 1, overflow: 'auto',
    padding: '22px 28px',
    display: 'flex', flexDirection: 'column',
  },

  row: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },

  input: {
    flex: 1, minWidth: 240,
    padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--border, rgba(127,127,127,0.2))',
    background: 'var(--panel-2, rgba(127,127,127,0.05))',
    color: 'var(--text)',
    fontSize: 15, fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 150ms ease, background 150ms ease',
  },
  select: {
    padding: '8px 12px', borderRadius: 8,
    border: '1px solid var(--border, rgba(127,127,127,0.2))',
    background: 'var(--panel-2, rgba(127,127,127,0.05))',
    color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
  },

  btnPrimary: {
    padding: '10px 18px', borderRadius: 10, border: 0, cursor: 'pointer',
    background: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)',
    color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
    boxShadow: '0 6px 18px -6px rgba(234,88,12,0.5)',
  },
  btnGhost: {
    padding: '10px 16px', borderRadius: 10,
    border: '1px solid var(--border, rgba(127,127,127,0.2))',
    background: 'var(--panel-2, rgba(127,127,127,0.05))',
    color: 'var(--text)', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
  },
  btnGhostSmall: {
    padding: '6px 10px', borderRadius: 8,
    border: '1px solid var(--border, rgba(127,127,127,0.2))',
    background: 'var(--panel-2, rgba(127,127,127,0.05))',
    color: 'var(--text)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
  },
  btnDanger: {
    padding: '10px 16px', borderRadius: 10, border: 0, cursor: 'pointer',
    background: 'color-mix(in srgb, #ef4444 12%, var(--panel-2, rgba(127,127,127,0.05)))',
    color: '#ef4444', fontWeight: 700, fontFamily: 'inherit',
  },
  btnLink: {
    background: 'transparent', border: 0, padding: '4px 6px',
    cursor: 'pointer', color: 'var(--accent, #3b82f6)', fontSize: 12, fontFamily: 'inherit',
    textDecoration: 'underline',
  },
  iconBtn: {
    background: 'transparent', border: 0, cursor: 'pointer',
    padding: 4, fontSize: 14, opacity: 0.75,
  },

  chip: {
    padding: '5px 10px', borderRadius: 999, border: 0, cursor: 'pointer',
    background: 'var(--panel-2, rgba(127,127,127,0.08))',
    color: 'var(--text)', fontSize: 12, fontFamily: 'inherit',
  },
  miniChip: {
    padding: '2px 8px', borderRadius: 999, border: 0, cursor: 'pointer',
    background: 'color-mix(in srgb, var(--accent, #3b82f6) 12%, var(--panel-2, rgba(127,127,127,0.05)))',
    color: 'var(--accent, #3b82f6)', fontSize: 11, fontFamily: 'system-ui, sans-serif',
    marginRight: 4,
  },

  errorBox: {
    marginTop: 12, padding: 12, borderRadius: 10,
    background: 'color-mix(in srgb, #ef4444 10%, var(--panel-2))',
    border: '1px solid color-mix(in srgb, #ef4444 25%, transparent)',
    color: '#ef4444', fontSize: 14,
  },

  skeleton: { padding: 20, borderRadius: 14, background: 'var(--panel-2, rgba(127,127,127,0.06))' },
  sk: { height: 14, borderRadius: 6, background: 'linear-gradient(90deg, rgba(127,127,127,0.12) 0%, rgba(127,127,127,0.22) 50%, rgba(127,127,127,0.12) 100%)' },

  entryCard: {
    padding: 22, borderRadius: 16,
    background: 'var(--panel, rgba(255,255,255,0.6))',
    border: '1px solid var(--border, rgba(127,127,127,0.15))',
    boxShadow: '0 10px 30px -20px rgba(0,0,0,0.15)',
  },
  entryHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' },
  entryWord: { margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: 0.2 },
  entryPhonetic: { display: 'inline-block', marginLeft: 10, color: 'var(--text-dim)', fontSize: 15 },
  posTag: {
    display: 'inline-block', marginTop: 8,
    padding: '3px 10px', borderRadius: 6,
    background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
    color: 'var(--accent)',
    fontStyle: 'italic', fontSize: 12, fontWeight: 600,
  },
  defList: { margin: '8px 0 0 0', paddingLeft: 22 },
  defItem: { marginBottom: 10, lineHeight: 1.65, fontSize: 15 },
  example: {
    marginTop: 4, fontSize: 13, color: 'var(--text-dim)',
    fontStyle: 'italic',
    borderLeft: '2px solid var(--border, rgba(127,127,127,0.3))',
    paddingLeft: 10,
  },
  relatedRow: { marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12 },

  emptyHint: {
    padding: 40, textAlign: 'center', color: 'var(--text-dim)',
    borderRadius: 14, background: 'var(--panel-2, rgba(127,127,127,0.05))',
  },
  emptyBig: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: 60,
  },

  transGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 56px 1fr',
    gap: 14, alignItems: 'stretch',
  },
  transCol: {
    background: 'var(--panel, rgba(255,255,255,0.6))',
    border: '1px solid var(--border, rgba(127,127,127,0.15))',
    borderRadius: 14,
    padding: 14,
    display: 'flex', flexDirection: 'column',
  },
  transHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  swapCol: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  swapBtn: {
    width: 44, height: 44, borderRadius: '50%', border: 0, cursor: 'pointer',
    background: 'linear-gradient(135deg, #0891b2, #0369a1)', color: '#fff',
    fontSize: 20, fontWeight: 700,
    boxShadow: '0 6px 16px -6px rgba(3,105,161,0.5)',
  },
  textarea: {
    width: '100%', flex: 1,
    minHeight: 180, resize: 'vertical',
    padding: 12, borderRadius: 10,
    border: '1px solid var(--border, rgba(127,127,127,0.2))',
    background: 'var(--panel-2, rgba(127,127,127,0.04))',
    color: 'var(--text)', fontSize: 15, fontFamily: 'inherit', lineHeight: 1.7,
    outline: 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    overflow: 'auto',
  },
  metaRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 12, color: 'var(--text-dim)' },

  card: {
    position: 'relative',
    minHeight: 320,
    borderRadius: 22,
    background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent, #ea580c) 8%, var(--panel)), var(--panel))',
    border: '1px solid var(--border, rgba(127,127,127,0.15))',
    boxShadow: '0 30px 60px -24px rgba(0,0,0,0.25)',
    transformStyle: 'preserve-3d',
    transition: 'transform 500ms cubic-bezier(.2,.8,.2,1)',
  },

  vocabGrid: {
    marginTop: 16,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 12,
  },
  vocabCard: {
    padding: 14, borderRadius: 14,
    background: 'var(--panel, rgba(255,255,255,0.7))',
    border: '1px solid var(--border, rgba(127,127,127,0.15))',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  vocabHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  vocabWord: { fontSize: 18, fontWeight: 700 },
  vocabMeaning: { fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-dim, #555)' },
  vocabMeta: {
    display: 'flex', gap: 10, fontSize: 11, color: 'var(--text-dim, #777)',
    paddingTop: 8, borderTop: '1px dashed var(--border, rgba(127,127,127,0.2))',
    flexWrap: 'wrap',
  },

  footer: {
    padding: '10px 20px',
    borderTop: '1px solid var(--border, rgba(127,127,127,0.15))',
    display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
    fontSize: 11, color: 'var(--text-dim, #888)',
    background: 'color-mix(in srgb, var(--panel) 70%, transparent)',
  },
}
