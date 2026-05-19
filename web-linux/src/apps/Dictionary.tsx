import { useState } from 'react'
import { useStore } from '../store'

interface DictEntry {
  word: string
  phonetic: string
  partOfSpeech: string
  definition: string
  example: string
  exampleZh: string
}

const dictionary: DictEntry[] = [
  { word: 'abandon', phonetic: '/əˈbændən/', partOfSpeech: 'v.', definition: '放弃；抛弃；遗弃', example: 'He abandoned his plan to travel.', exampleZh: '他放弃了旅行的计划。' },
  { word: 'brilliant', phonetic: '/ˈbrɪliənt/', partOfSpeech: 'adj.', definition: '杰出的；明亮的；精彩的', example: 'She made a brilliant speech.', exampleZh: '她做了一场精彩的演讲。' },
  { word: 'calculate', phonetic: '/ˈkælkjuleɪt/', partOfSpeech: 'v.', definition: '计算；估计；打算', example: 'We need to calculate the total cost.', exampleZh: '我们需要计算总成本。' },
  { word: 'deliberate', phonetic: '/dɪˈlɪbərət/', partOfSpeech: 'adj./v.', definition: '故意的；深思熟虑的；仔细考虑', example: 'It was a deliberate decision.', exampleZh: '这是一个深思熟虑的决定。' },
  { word: 'elegant', phonetic: '/ˈelɪɡənt/', partOfSpeech: 'adj.', definition: '优雅的；精致的；简洁的', example: 'She wore an elegant dress.', exampleZh: '她穿着一件优雅的连衣裙。' },
  { word: 'fascinate', phonetic: '/ˈfæsɪneɪt/', partOfSpeech: 'v.', definition: '使着迷；深深吸引', example: 'The stars fascinate me.', exampleZh: '星星让我着迷。' },
  { word: 'generous', phonetic: '/ˈdʒenərəs/', partOfSpeech: 'adj.', definition: '慷慨的；大方的；丰富的', example: 'He is generous with his time.', exampleZh: '他乐于付出时间。' },
  { word: 'harmony', phonetic: '/ˈhɑːrməni/', partOfSpeech: 'n.', definition: '和谐；融洽；协调', example: 'They live in harmony with nature.', exampleZh: '他们与自然和谐共处。' },
  { word: 'illustrate', phonetic: '/ˈɪləstreɪt/', partOfSpeech: 'v.', definition: '说明；举例说明；给…加插图', example: 'Let me illustrate my point.', exampleZh: '让我来说明我的观点。' },
  { word: 'jubilant', phonetic: '/ˈdʒuːbɪlənt/', partOfSpeech: 'adj.', definition: '欢欣鼓舞的；喜气洋洋的', example: 'The fans were jubilant after the win.', exampleZh: '获胜后球迷们欣喜若狂。' },
  { word: 'knowledge', phonetic: '/ˈnɒlɪdʒ/', partOfSpeech: 'n.', definition: '知识；学问；了解', example: 'Knowledge is power.', exampleZh: '知识就是力量。' },
  { word: 'magnificent', phonetic: '/mæɡˈnɪfɪsnt/', partOfSpeech: 'adj.', definition: '壮丽的；宏伟的；极好的', example: 'The view from the top is magnificent.', exampleZh: '山顶的景色壮丽极了。' },
  { word: 'negotiate', phonetic: '/nɪˈɡoʊʃieɪt/', partOfSpeech: 'v.', definition: '谈判；协商；商定', example: 'We need to negotiate the terms.', exampleZh: '我们需要协商条款。' },
  { word: 'obstacle', phonetic: '/ˈɒbstəkl/', partOfSpeech: 'n.', definition: '障碍；阻碍；绊脚石', example: 'Lack of money is the main obstacle.', exampleZh: '缺钱是主要的障碍。' },
  { word: 'persevere', phonetic: '/ˌpɜːrsɪˈvɪr/', partOfSpeech: 'v.', definition: '坚持；不屈不挠', example: 'You must persevere with your studies.', exampleZh: '你必须坚持学习。' },
  { word: 'quarantine', phonetic: '/ˈkwɒrəntiːn/', partOfSpeech: 'n./v.', definition: '隔离；检疫', example: 'The patient was put in quarantine.', exampleZh: '该病人被隔离了。' },
  { word: 'resilient', phonetic: '/rɪˈzɪliənt/', partOfSpeech: 'adj.', definition: '有弹性的；能迅速恢复的；适应力强的', example: 'Children are often very resilient.', exampleZh: '孩子们通常适应力很强。' },
  { word: 'sophisticated', phonetic: '/səˈfɪstɪkeɪtɪd/', partOfSpeech: 'adj.', definition: '精密的；复杂的；老练的', example: 'This is a sophisticated system.', exampleZh: '这是一个精密的系统。' },
  { word: 'tremendous', phonetic: '/trɪˈmendəs/', partOfSpeech: 'adj.', definition: '巨大的；极大的；惊人的', example: 'She made a tremendous effort.', exampleZh: '她付出了巨大的努力。' },
  { word: 'ubiquitous', phonetic: '/juːˈbɪkwɪtəs/', partOfSpeech: 'adj.', definition: '无处不在的；普遍存在的', example: 'Smartphones are ubiquitous nowadays.', exampleZh: '如今智能手机无处不在。' },
  { word: 'vulnerable', phonetic: '/ˈvʌlnərəbl/', partOfSpeech: 'adj.', definition: '脆弱的；易受伤的', example: 'Old people are more vulnerable to illness.', exampleZh: '老人更容易受疾病侵袭。' },
  { word: 'wisdom', phonetic: '/ˈwɪzdəm/', partOfSpeech: 'n.', definition: '智慧；才智；明智', example: 'Experience brings wisdom.', exampleZh: '经验带来智慧。' },
]

export default function Dictionary() {
  const { theme } = useStore()
  const isDark = theme === 'dark'
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<DictEntry | null>(null)

  const bg = isDark ? '#1a1a2e' : '#f5f5f5'
  const textColor = isDark ? '#e0e0e0' : '#333'
  const inputBg = isDark ? '#0f3460' : '#fff'
  const borderColor = isDark ? '#2a2a4a' : '#ddd'
  const cardBg = isDark ? '#16213e' : '#fff'

  const filtered = query.trim()
    ? dictionary.filter(
        (d) =>
          d.word.toLowerCase().includes(query.toLowerCase()) ||
          d.definition.includes(query)
      )
    : dictionary

  const speak = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      speechSynthesis.cancel()
      speechSynthesis.speak(utterance)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: bg, color: textColor, fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
      <div style={{ width: 240, background: isDark ? '#16213e' : '#e8e8e8', borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: 10 }}>
          <input
            type="text" placeholder="搜索单词或释义..." value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null) }}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${borderColor}`, background: inputBg, color: textColor, fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filtered.map((d) => (
            <div key={d.word} onClick={() => setSelected(d)} style={{
              padding: '10px 12px', cursor: 'pointer', borderBottom: `1px solid ${borderColor}`,
              background: selected?.word === d.word ? (isDark ? '#0f3460' : '#c8e6c9') : 'transparent',
              borderLeft: selected?.word === d.word ? `3px solid ${isDark ? '#4fc3f7' : '#1976d2'}` : '3px solid transparent',
            }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{d.word}</div>
              <div style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#888' }}>{d.partOfSpeech} {d.definition}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {selected ? (
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 28, color: isDark ? '#4fc3f7' : '#1976d2' }}>{selected.word}</h2>
              <button onClick={() => speak(selected.word)} style={{
                width: 36, height: 36, borderRadius: '50%', border: `1px solid ${borderColor}`,
                background: cardBg, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>🔊</button>
            </div>

            <div style={{ fontSize: 16, color: isDark ? '#9ca3af' : '#666', marginBottom: 16 }}>{selected.phonetic}</div>

            <div style={{ background: cardBg, borderRadius: 10, padding: 16, border: `1px solid ${borderColor}`, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: isDark ? '#4fc3f7' : '#1976d2', fontWeight: 600, marginBottom: 6 }}>{selected.partOfSpeech}</div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>{selected.definition}</div>
              <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: 12 }}>
                <div style={{ fontSize: 11, color: isDark ? '#9ca3af' : '#888', marginBottom: 4 }}>例句</div>
                <div style={{ fontSize: 14, fontStyle: 'italic', marginBottom: 4 }}>{selected.example}</div>
                <div style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#666' }}>{selected.exampleZh}</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>英汉词典</div>
            <div style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#888' }}>
              输入单词或释义进行搜索，或从左侧列表中浏览词汇
            </div>
            <div style={{ marginTop: 20, fontSize: 12, color: isDark ? '#6b7280' : '#aaa' }}>
              共收录 {dictionary.length} 个常用词汇
            </div>
          </div>
        )}
      </div>
    </div>
  )
}