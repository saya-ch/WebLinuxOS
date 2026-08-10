import { useState, useCallback, useEffect, memo } from 'react'
import { SparklesIcon, CopyIcon, RefreshCwIcon, DownloadIcon, MusicIcon, BookIcon, HeartIcon, HeartOffIcon } from '../icons'

interface Poem {
  id: string
  title: string
  content: string
  style: string
  mood: string
  createdAt: Date
}

const POEM_STYLES = [
  { id: 'tang', name: '唐诗', prompt: '唐诗风格，七言绝句，意境深远' },
  { id: 'song', name: '宋词', prompt: '宋词风格，婉约含蓄，韵律优美' },
  { id: 'modern', name: '现代诗', prompt: '现代自由诗，意象丰富，情感真挚' },
  { id: 'haiku', name: '俳句', prompt: '日本俳句风格，简洁空灵，富有禅意' },
  { id: 'sonnet', name: '十四行诗', prompt: '莎士比亚十四行诗风格，抑扬格五音步' },
  { id: 'free', name: '自由诗', prompt: '自由诗风格，无固定格式，表达真我' },
  { id: 'ancient', name: '诗经风格', prompt: '诗经风格，四言为主，质朴典雅' },
  { id: 'chuci', name: '楚辞风格', prompt: '楚辞风格，句式参差，浪漫奇诡' },
]

const MOODS = [
  { id: 'happy', name: '欢快', emoji: '😊' },
  { id: 'sad', name: '忧伤', emoji: '😢' },
  { id: 'love', name: '爱情', emoji: '💕' },
  { id: 'nature', name: '自然', emoji: '🌿' },
  { id: 'philosophy', name: '哲理', emoji: '🤔' },
  { id: 'nostalgia', name: '怀旧', emoji: '🌅' },
  { id: 'courage', name: '豪迈', emoji: '🔥' },
  { id: 'peace', name: '宁静', emoji: '🌙' },
]

async function generatePoem(topic: string, stylePrompt: string, moodName: string): Promise<string> {
  const prompt = `请创作一首关于"${topic}"的${stylePrompt}，要求传达${moodName}的情感。要求：1. 内容原创，意境优美 2. 语言凝练，富有诗意 3. 标题点睛 4. 直接输出诗歌内容，无需解释`
  
  try {
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'flux',
        prompt: prompt,
        max_tokens: 1000,
        temperature: 0.85,
      }),
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    const data = await response.text()
    return data || '生成失败，请重试'
  } catch (error) {
    return generateLocalPoem(topic, stylePrompt, moodName)
  }
}

function generateLocalPoem(topic: string, style: string, mood: string): string {
  const templates: Record<string, string[]> = {
    '唐诗风格，七言绝句，意境深远': [
      `《${topic}》\n\n${topic}影入梦来，\n${mood}意绕心头。\n山川共此时，\n诗意万古流。`,
    ],
    '宋词风格，婉约含蓄，韵律优美': [
      `《${topic}引》\n\n${topic}无语，${mood}情难诉。\n凭栏望断天涯路，\n唯见飞云渡。\n\n思悠悠，恨悠悠，\n恨到归时方始休。`,
    ],
  }

  const styleTemplates = templates[style] || [
    `《${topic}》\n\n${topic}入梦来，诗意绕心间。\n${mood}情千古事，唯有明月照。`,
  ]
  
  return styleTemplates[0]
}

const AIPoetryGenerator = memo(function AIPoetryGenerator() {
  const [topic, setTopic] = useState('春天')
  const [selectedStyle, setSelectedStyle] = useState(POEM_STYLES[0])
  const [selectedMood, setSelectedMood] = useState(MOODS[0])
  const [currentPoem, setCurrentPoem] = useState<Poem | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [history, setHistory] = useState<Poem[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('poetry-history')
      if (saved) setHistory(JSON.parse(saved))
      const favs = localStorage.getItem('poetry-favorites')
      if (favs) setFavorites(JSON.parse(favs))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('poetry-history', JSON.stringify(history.slice(0, 20)))
  }, [history])

  useEffect(() => {
    localStorage.setItem('poetry-favorites', JSON.stringify(favorites))
  }, [favorites])

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return
    setIsGenerating(true)
    try {
      const content = await generatePoem(
        topic,
        selectedStyle.prompt,
        selectedMood.name
      )
      const poem: Poem = {
        id: Date.now().toString(),
        title: topic,
        content,
        style: selectedStyle.name,
        mood: selectedMood.name,
        createdAt: new Date(),
      }
      setCurrentPoem(poem)
      setHistory((prev) => [poem, ...prev].slice(0, 20))
    } catch (e) {
      console.error('生成失败:', e)
    } finally {
      setIsGenerating(false)
    }
  }, [topic, selectedStyle, selectedMood])

  const handleCopy = useCallback(() => {
    if (!currentPoem) return
    const text = `${currentPoem.title}\n\n${currentPoem.content}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [currentPoem])

  const handleDownload = useCallback(() => {
    if (!currentPoem) return
    const text = `${currentPoem.title}\n\n${currentPoem.content}\n\n—— ${currentPoem.style} · ${currentPoem.mood}`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `poem-${currentPoem.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [currentPoem])

  const toggleFavorite = useCallback(() => {
    if (!currentPoem) return
    setFavorites((prev) =>
      prev.includes(currentPoem.id)
        ? prev.filter((id) => id !== currentPoem.id)
        : [...prev, currentPoem.id]
    )
  }, [currentPoem])

  const isFavorite = currentPoem ? favorites.includes(currentPoem.id) : false

  return (
    <div style={{
      padding: 24,
      height: '100%',
      overflow: 'auto',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      color: '#f0f0ff',
      fontFamily: "'Noto Serif SC', 'Songti SC', serif",
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 32,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #4facfe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            <BookIcon style={{ width: 32, height: 32 }} />
            AI 诗歌生成器
          </div>
          <p style={{ color: '#9090c0', marginTop: 8, fontSize: 14 }}>
            输入主题，选择风格与情感，让 AI 为你创作独一无二的诗歌
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#9090c0' }}>
              诗歌主题
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="输入主题，如：春天、故乡、爱情..."
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                color: '#fff',
                fontSize: 16,
                outline: 'none',
                transition: 'border-color 0.3s',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#9090c0' }}>
              诗歌风格
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {POEM_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  style={{
                    padding: '8px 16px',
                    background: selectedStyle.id === style.id
                      ? 'linear-gradient(135deg, #7c6cf0, #9b8af0)'
                      : 'rgba(255,255,255,0.08)',
                    border: selectedStyle.id === style.id
                      ? '1px solid #7c6cf0'
                      : '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 20,
                    color: selectedStyle.id === style.id ? '#fff' : '#ccc',
                    cursor: 'pointer',
                    fontSize: 14,
                    transition: 'all 0.3s',
                  }}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#9090c0' }}>
              情感基调
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood)}
                  style={{
                    padding: '8px 16px',
                    background: selectedMood.id === mood.id
                      ? 'linear-gradient(135deg, #f093fb, #f5576c)'
                      : 'rgba(255,255,255,0.08)',
                    border: selectedMood.id === mood.id
                      ? '1px solid #f093fb'
                      : '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 20,
                    color: selectedMood.id === mood.id ? '#fff' : '#ccc',
                    cursor: 'pointer',
                    fontSize: 14,
                    transition: 'all 0.3s',
                  }}
                >
                  {mood.emoji} {mood.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: isGenerating
                ? 'rgba(124, 108, 240, 0.5)'
                : 'linear-gradient(135deg, #7c6cf0 0%, #9b8af0 50%, #b8a8ff 100%)',
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.3s',
              boxShadow: isGenerating ? 'none' : '0 4px 20px rgba(124,108,240,0.4)',
            }}
          >
            {isGenerating ? (
              <>
                <RefreshCwIcon style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
                AI 正在创作中...
              </>
            ) : (
              <>
                <SparklesIcon style={{ width: 20, height: 20 }} />
                生成诗歌
              </>
            )}
          </button>
        </div>

        {currentPoem && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
            borderRadius: 20,
            padding: 32,
            marginBottom: 24,
            border: '1px solid rgba(255,255,255,0.15)',
            animation: 'fadeSlideIn 0.5s ease-out',
          }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: 8,
              background: 'linear-gradient(135deg, #f093fb, #4facfe)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              《{currentPoem.title}》
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#8080a0',
              marginBottom: 24,
              fontSize: 14,
            }}>
              风格：{currentPoem.style} · 情感：{currentPoem.mood}
            </p>
            <pre style={{
              fontSize: 18,
              lineHeight: 2,
              whiteSpace: 'pre-wrap',
              textAlign: 'center',
              color: '#e0e0f0',
              fontFamily: "'Noto Serif SC', serif",
              marginBottom: 24,
            }}>
              {currentPoem.content}
            </pre>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={handleCopy}
                style={{
                  padding: '10px 20px',
                  background: copied ? '#10b981' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.3s',
                }}
              >
                <CopyIcon style={{ width: 16, height: 16 }} />
                {copied ? '已复制' : '复制'}
              </button>

              <button
                onClick={toggleFavorite}
                style={{
                  padding: '10px 20px',
                  background: isFavorite ? 'rgba(245,87,108,0.3)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${isFavorite ? '#f5576c' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: 10,
                  color: isFavorite ? '#f5576c' : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.3s',
                }}
              >
                {isFavorite ? <HeartIcon style={{ width: 16, height: 16 }} /> : <HeartOffIcon style={{ width: 16, height: 16 }} />}
                {isFavorite ? '已收藏' : '收藏'}
              </button>

              <button
                onClick={handleDownload}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.3s',
                }}
              >
                <DownloadIcon style={{ width: 16, height: 16 }} />
                下载
              </button>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <h3 style={{ marginBottom: 16, fontSize: 16, color: '#9090c0' }}>
              历史记录 ({history.length})
            </h3>
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {history.map((poem) => (
                <div
                  key={poem.id}
                  onClick={() => setCurrentPoem(poem)}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    background: currentPoem?.id === poem.id
                      ? 'rgba(124,108,240,0.2)'
                      : 'rgba(255,255,255,0.05)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>《{poem.title}》</div>
                    <div style={{ fontSize: 12, color: '#8080a0' }}>
                      {poem.style} · {poem.mood}
                    </div>
                  </div>
                  {favorites.includes(poem.id) && (
                    <HeartIcon style={{ width: 16, height: 16, color: '#f5576c' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{
          textAlign: 'center',
          marginTop: 32,
          padding: 20,
          color: '#606080',
          fontSize: 13,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 12,
        }}>
          <MusicIcon style={{ width: 20, height: 20, marginBottom: 8 }} />
          <div>基于 Pollinations AI 免费公开 API · 所有诗歌均本地保存</div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
})

export default AIPoetryGenerator
