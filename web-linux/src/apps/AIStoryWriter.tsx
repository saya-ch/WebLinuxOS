import { useState, useCallback, useEffect, memo } from 'react'
import { SparklesIcon, CopyIcon, DownloadIcon, RefreshCwIcon, BookmarkIcon, BookIcon } from '../icons'

interface Story {
  id: string
  title: string
  genre: string
  content: string
  chapter: number
  createdAt: Date
}

const GENRES = [
  { id: 'fantasy', name: '奇幻', prompt: '奇幻风格，包含魔法、异世界、冒险元素' },
  { id: 'scifi', name: '科幻', prompt: '科幻风格，涉及未来科技、太空、人工智能' },
  { id: 'mystery', name: '悬疑', prompt: '悬疑推理风格，充满悬念与反转' },
  { id: 'romance', name: '浪漫', prompt: '浪漫爱情风格，细腻的情感描写' },
  { id: 'fable', name: '寓言', prompt: '寓言风格，寓意深刻，包含道德教训' },
  { id: 'horror', name: '恐怖', prompt: '恐怖风格，营造阴森恐怖的氛围' },
  { id: 'historical', name: '历史', prompt: '历史背景风格，注重时代细节' },
  { id: 'comedy', name: '喜剧', prompt: '幽默搞笑风格，轻松愉快' },
]

const CHAPTER_PROMPTS = [
  '第一章：开篇介绍主角和世界观',
  '第二章：引入冲突与挑战',
  '第三章：主角遭遇挫折',
  '第四章：关键转折点',
  '第五章：高潮决战',
  '第六章：结局与展望',
]

async function generateStory(
  title: string,
  genrePrompt: string,
  chapter: number
): Promise<string> {
  const prompt = `请创作一个${genrePrompt}风格的故事章节。\n主题：${title}\n章节：${CHAPTER_PROMPTS[chapter] || '继续故事发展'}\n要求：1. 内容精彩，情节引人入胜 2. 人物性格鲜明 3. 场景描写生动 4. 字数在500-800字之间 5. 直接输出故事内容`

  try {
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'flux',
        prompt: prompt,
        max_tokens: 2000,
        temperature: 0.85,
      }),
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    const data = await response.text()
    return data || '生成失败，请重试'
  } catch (error) {
    return generateLocalStory(title, genrePrompt, chapter)
  }
}

function generateLocalStory(title: string, genre: string, _chapter: number): string {
  const templates: Record<string, string[]> = {
    'fantasy': [
      `在一个被遗忘的魔法纪元，${title}的故事开始了...\n\n古老的预言指引着年轻的勇者踏上征程，黑暗势力正在苏醒。\n\n"你准备好了吗？"导师问道。\n勇者握紧了手中的长剑，坚定地点了点头。\n\n冒险，从此刻开始。`,
    ],
    'scifi': [
      `公元3047年，人类已经征服了银河系。\n\n在遥远的殖民地"新希望"星球上，一场神秘的事件正在发生...\n\n指挥官收到了前所未有的信号，它来自宇宙的深处。\n\n"这不是自然现象，"科学家说道，"这是人造的。"\n\n未知，正在等待被揭开。`,
    ],
  }

  const styleTemplates = templates[genre] || {
    'default': [`关于"${title}"的故事，在这个特殊的时刻，一切都将改变...\n\n命运的齿轮开始转动，主角踏上了一段意想不到的旅程。\n\n这只是开始，真正的挑战还在前方等待。`],
  }
  
  return styleTemplates[0]
}

const AIStoryWriter = memo(function AIStoryWriter() {
  const [title, setTitle] = useState('')
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0])
  const [chapter, setChapter] = useState(0)
  const [currentStory, setCurrentStory] = useState<Story | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [chapters, setChapters] = useState<Story[]>([])
  const [savedStories, setSavedStories] = useState<Story[][]>([])
  const [copied, setCopied] = useState(false)

  // 加载保存的故事
  useEffect(() => {
    try {
      const saved = localStorage.getItem('story-chapters')
      if (saved) setChapters(JSON.parse(saved))
      const stories = localStorage.getItem('saved-stories')
      if (stories) setSavedStories(JSON.parse(stories))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('story-chapters', JSON.stringify(chapters))
  }, [chapters])

  useEffect(() => {
    localStorage.setItem('saved-stories', JSON.stringify(savedStories))
  }, [savedStories])

  const handleGenerate = useCallback(async () => {
    if (!title.trim()) return
    setIsGenerating(true)
    try {
      const content = await generateStory(
        title,
        selectedGenre.prompt,
        chapter
      )
      const story: Story = {
        id: `${Date.now()}-${chapter}`,
        title,
        genre: selectedGenre.name,
        content,
        chapter,
        createdAt: new Date(),
      }
      setCurrentStory(story)
      setChapters((prev) => {
        const existing = prev.filter((s) => s.chapter !== chapter)
        return [...existing, story].sort((a, b) => a.chapter - b.chapter)
      })
    } catch (e) {
      console.error('生成失败:', e)
    } finally {
      setIsGenerating(false)
    }
  }, [title, selectedGenre, chapter])

  const handleContinue = useCallback(async () => {
    if (!title.trim()) return
    const nextChapter = chapter + 1
    setChapter(nextChapter)
    setIsGenerating(true)
    try {
      const content = await generateStory(
        title,
        selectedGenre.prompt,
        nextChapter
      )
      const story: Story = {
        id: `${Date.now()}-${nextChapter}`,
        title,
        genre: selectedGenre.name,
        content,
        chapter: nextChapter,
        createdAt: new Date(),
      }
      setCurrentStory(story)
      setChapters((prev) => {
        const existing = prev.filter((s) => s.chapter !== nextChapter)
        return [...existing, story].sort((a, b) => a.chapter - b.chapter)
      })
    } catch (e) {
      console.error('生成失败:', e)
    } finally {
      setIsGenerating(false)
    }
  }, [title, selectedGenre, chapter])

  const handleCopy = useCallback(() => {
    if (!currentStory) return
    const text = `《${currentStory.title}》\n\n第${currentStory.chapter + 1}章 ${CHAPTER_PROMPTS[currentStory.chapter]}\n\n${currentStory.content}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [currentStory])

  const handleDownload = useCallback(() => {
    if (chapters.length === 0) return
    const fullText = chapters
      .sort((a, b) => a.chapter - b.chapter)
      .map(
        (s) =>
          `《${s.title}》\n\n第${s.chapter + 1}章 ${CHAPTER_PROMPTS[s.chapter] || ''}\n\n${s.content}`
      )
      .join('\n\n---\n\n')
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}-story.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [chapters, title])

  const handleSaveAll = useCallback(() => {
    if (chapters.length === 0) return
    setSavedStories((prev) => [...prev, chapters])
    alert('故事已保存！')
  }, [chapters])

  const handleStartNew = useCallback(() => {
    setChapters([])
    setCurrentStory(null)
    setChapter(0)
  }, [])

  const displayStory = currentStory || chapters[chapters.length - 1]

  return (
    <div style={{
      padding: 24,
      height: '100%',
      overflow: 'auto',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a3e 100%)',
      color: '#f0f0ff',
      fontFamily: "'Noto Serif SC', 'Songti SC', serif",
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 28,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            <BookIcon style={{ width: 28, height: 28 }} />
            AI 故事创作工坊
          </div>
          <p style={{ color: '#9090c0', marginTop: 8, fontSize: 14 }}>
            让 AI 为你创作精彩故事，支持多章节连载
          </p>
        </div>

        {/* 控制面板 */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {/* 故事主题 */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#9090c0' }}>
              故事主题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入故事主题，如：魔法学院的秘密..."
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                color: '#fff',
                fontSize: 16,
                outline: 'none',
              }}
            />
          </div>

          {/* 风格选择 */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#9090c0' }}>
              故事风格
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {GENRES.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre)}
                  style={{
                    padding: '8px 16px',
                    background: selectedGenre.id === genre.id
                      ? 'linear-gradient(135deg, #fa709a, #fee140)'
                      : 'rgba(255,255,255,0.08)',
                    border: selectedGenre.id === genre.id
                      ? '1px solid #fa709a'
                      : '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 20,
                    color: selectedGenre.id === genre.id ? '#fff' : '#ccc',
                    cursor: 'pointer',
                    fontSize: 14,
                    transition: 'all 0.3s',
                  }}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          {/* 章节信息 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            padding: '12px 16px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 10,
          }}>
            <span style={{ color: '#9090c0' }}>
              当前章节：第 {chapter + 1} 章 - {CHAPTER_PROMPTS[chapter] || '自定义章节'}
            </span>
            <span style={{ color: '#fa709a', fontWeight: 600 }}>
              已完成 {chapters.length} 章
            </span>
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !title.trim()}
              style={{
                flex: 1,
                padding: '14px 24px',
                background: isGenerating
                  ? 'rgba(250, 112, 154, 0.5)'
                  : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
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
              }}
            >
              {isGenerating ? (
                <>
                  <RefreshCwIcon style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
                  创作中...
                </>
              ) : (
                <>
                  <SparklesIcon style={{ width: 18, height: 18 }} />
                  开始创作
                </>
              )}
            </button>

            {chapters.length > 0 && (
              <button
                onClick={handleContinue}
                disabled={isGenerating}
                style={{
                  padding: '14px 24px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 14,
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                续写下一章
              </button>
            )}
          </div>
        </div>

        {/* 故事展示 */}
        {displayStory && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 20,
            padding: 32,
            marginBottom: 24,
            border: '1px solid rgba(255,255,255,0.1)',
            animation: 'fadeSlideIn 0.5s ease-out',
          }}>
            <h2 style={{
              fontSize: 24,
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: 8,
              color: '#fa709a',
            }}>
              《{displayStory.title}》
            </h2>
            <p style={{
              textAlign: 'center',
              color: '#8080a0',
              marginBottom: 24,
              fontSize: 14,
            }}>
              第 {displayStory.chapter + 1} 章 · {CHAPTER_PROMPTS[displayStory.chapter]}
            </p>
            <pre style={{
              fontSize: 16,
              lineHeight: 2,
              whiteSpace: 'pre-wrap',
              color: '#e0e0f0',
              fontFamily: "'Noto Serif SC', serif",
            }}>
              {displayStory.content}
            </pre>

            {/* 操作按钮 */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              marginTop: 24,
            }}>
              <button
                onClick={handleCopy}
                style={{
                  padding: '8px 16px',
                  background: copied ? '#10b981' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CopyIcon style={{ width: 14, height: 14 }} />
                {copied ? '已复制' : '复制'}
              </button>

              <button
                onClick={handleSaveAll}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <BookmarkIcon style={{ width: 14, height: 14 }} />
                保存全书
              </button>

              <button
                onClick={handleDownload}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <DownloadIcon style={{ width: 14, height: 14 }} />
                下载TXT
              </button>

              <button
                onClick={handleStartNew}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 10,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                新故事
              </button>
            </div>
          </div>
        )}

        {/* 章节列表 */}
        {chapters.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <h3 style={{ marginBottom: 16, fontSize: 16, color: '#9090c0' }}>
              章节导航 ({chapters.length} 章)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chapters.map((story) => (
                <div
                  key={story.id}
                  onClick={() => {
                    setCurrentStory(story)
                    setChapter(story.chapter)
                  }}
                  style={{
                    padding: 12,
                    background: currentStory?.id === story.id
                      ? 'rgba(250,112,154,0.2)'
                      : 'rgba(255,255,255,0.05)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.2s',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>
                      第 {story.chapter + 1} 章
                    </span>
                    <span style={{ color: '#8080a0', marginLeft: 8, fontSize: 13 }}>
                      {CHAPTER_PROMPTS[story.chapter]}
                    </span>
                  </div>
                  <span style={{ color: '#606080', fontSize: 12 }}>
                    {story.content.length} 字
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 已保存的故事 */}
        {savedStories.length > 0 && (
          <div style={{
            marginTop: 24,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <h3 style={{ marginBottom: 16, fontSize: 16, color: '#9090c0' }}>
              已保存的故事 ({savedStories.length})
            </h3>
            <div style={{ maxHeight: 200, overflow: 'auto' }}>
              {savedStories.map((storyChapters, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (storyChapters.length > 0) {
                      setTitle(storyChapters[0].title)
                      setChapters(storyChapters)
                      setCurrentStory(storyChapters[storyChapters.length - 1])
                      setChapter(storyChapters[storyChapters.length - 1].chapter)
                    }
                  }}
                  style={{
                    padding: 10,
                    marginBottom: 8,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>《{storyChapters[0]?.title || '无题'}》</span>
                  <span style={{ color: '#606080' }}>{storyChapters.length} 章</span>
                </div>
              ))}
            </div>
          </div>
        )}
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

export default AIStoryWriter
