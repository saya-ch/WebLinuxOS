import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Heart,
  HeartOff,
  Search,
  RefreshCw,
  Loader2,
  ChevronDown,
  Monitor,
  Palette,
  Wand2,
  Grid3X3,
  X,
  Save,
  Trash2,
  Eye,
} from 'lucide-react'

interface Wallpaper {
  id: string
  url: string
  prompt: string
  category: string
  width: number
  height: number
  seed: number
  createdAt: number
  favorite: boolean
}

interface Category {
  key: string
  label: string
  icon: string
  prompts: string[]
}

interface Resolution {
  label: string
  width: number
  height: number
}

const CATEGORIES: Category[] = [
  { key: 'nature', label: '自然风景', icon: '🌿', prompts: [
    'majestic mountain landscape at sunrise with golden light, misty valleys, pine forests, ultra detailed, 8k',
    'serene lake reflection at sunset, dramatic clouds, water lilies, peaceful atmosphere, cinematic',
    'tropical beach paradise with turquoise water, white sand, palm trees, sunset, dreamy',
    'waterfall in lush green forest, mossy rocks, rainbow mist, ethereal, long exposure photography',
    'autumn forest path with golden leaves, soft sunlight, mist, romantic, painterly',
  ]},
  { key: 'abstract', label: '抽象艺术', icon: '🎨', prompts: [
    'abstract geometric shapes with neon glow, dark background, flowing lines, digital art, cyberpunk',
    'fluid gradient mesh, pastel colors, organic shapes, soft glow, minimalist, elegant',
    'fractal art with vivid colors, infinite recursion, mathematical beauty, psychedelic, intricate',
    'bokeh light particles, dark background, colorful orbs, dreamy atmosphere, ethereal',
    'fluid ink in water, macro photography, swirling colors, mesmerizing, abstract expressionism',
  ]},
  { key: 'cyberpunk', label: '赛博朋克', icon: '🌆', prompts: [
    'cyberpunk city at night, neon lights, rainy streets, reflections, futuristic buildings, cinematic',
    'cyberpunk alleyway, glowing signs, fog, rain, futuristic, blade runner aesthetic, neon noir',
    'cyberpunk skyline with flying cars, neon advertisements, tall buildings, night, moody lighting',
    'cyberpunk Tokyo street, neon kanji signs, rain reflections, dense atmosphere, cinematic',
    'cyberpunk laboratory, holographic displays, glowing circuits, futuristic technology, dark',
  ]},
  { key: 'minimal', label: '极简风格', icon: '⬜', prompts: [
    'minimalist landscape, single tree on hill, foggy background, monochrome, zen aesthetic',
    'minimalist architecture, geometric lines, negative space, soft shadows, clean, elegant',
    'minimalist abstract, single line, subtle gradient, negative space, serene, japandi style',
    'minimalist nature, vast empty beach, lone rock, dramatic sky, long exposure, peaceful',
    'minimalist still life, single object, plain background, soft light, moody, artistic',
  ]},
  { key: 'space', label: '宇宙星空', icon: '🌌', prompts: [
    'nebula in deep space, colorful gas clouds, stars, cosmic dust, ultra detailed, 8k',
    'galaxy spiral with billions of stars, cosmic dust, dark matter, astronomical, magnificent',
    'exoplanet with rings, space backdrop, stars, atmospheric glow, science fiction, epic',
    'starry night sky, milky way, shooting stars, dreamy, ethereal, long exposure',
    'cosmic jellyfish nebula, organic shapes, vibrant colors, deep space, surreal, artistic',
  ]},
  { key: 'fantasy', label: '奇幻梦境', icon: '🦄', prompts: [
    'floating islands in magical sky, waterfalls, fantasy landscape, epic, cinematic, dreamy',
    'enchanted forest with glowing mushrooms, fairy lights, mist, magical, ethereal, whimsical',
    'crystal cave underground, glowing crystals, underground lake, fantasy, mystical, beautiful',
    'dragon perched on mountain peak, dramatic sky, epic fantasy, detailed illustration, majestic',
    'fairy tale castle in clouds, rainbow, magical creatures, fantasy, storybook, whimsical',
  ]},
]

const RESOLUTIONS: Resolution[] = [
  { label: '1280 × 720 (HD)', width: 1280, height: 720 },
  { label: '1920 × 1080 (FHD)', width: 1920, height: 1080 },
  { label: '2560 × 1440 (QHD)', width: 2560, height: 1440 },
  { label: '3840 × 2160 (4K)', width: 3840, height: 2160 },
]

const GLASS_PRESETS = [
  { key: 'none', label: '无', blur: 0, opacity: 0 },
  { key: 'light', label: '轻玻璃', blur: 2, opacity: 0.15 },
  { key: 'medium', label: '中玻璃', blur: 4, opacity: 0.25 },
  { key: 'heavy', label: '重玻璃', blur: 8, opacity: 0.4 },
]

const STORAGE_KEYS = {
  favorites: 'ai-wallpaper-studio-favorites',
  gallery: 'ai-wallpaper-studio-gallery',
  history: 'ai-wallpaper-studio-history',
}

function buildWallpaperUrl(prompt: string, width: number, height: number, seed: number): string {
  const encodedPrompt = encodeURIComponent(prompt)
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`
}

export default function AIWallpaperStudio() {
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [currentCategory, setCurrentCategory] = useState<string>('nature')
  const [currentResolution, setCurrentResolution] = useState<Resolution>(RESOLUTIONS[1])
  const [currentSeed, setCurrentSeed] = useState<number>(() => Math.floor(Math.random() * 1000000))
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [gallery, setGallery] = useState<Wallpaper[]>([])
  const [favorites, setFavorites] = useState<Wallpaper[]>([])
  const [activeTab, setActiveTab] = useState<'create' | 'gallery' | 'favorites'>('create')
  const [glassPreset, setGlassPreset] = useState(GLASS_PRESETS[1])
  const [previewWallpaper, setPreviewWallpaper] = useState<Wallpaper | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const generationTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    const timer = setTimeout(() => setToast(null), 2000)
    generationTimersRef.current.add(timer)
  }, [])

  useEffect(() => {
    try {
      const savedGallery = localStorage.getItem(STORAGE_KEYS.gallery)
      const savedFavorites = localStorage.getItem(STORAGE_KEYS.favorites)
      if (savedGallery) setGallery(JSON.parse(savedGallery))
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.gallery, JSON.stringify(gallery.slice(-50)))
    } catch {
      // ignore
    }
  }, [gallery])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites))
    } catch {
      // ignore
    }
  }, [favorites])

  useEffect(() => {
    return () => {
      generationTimersRef.current.forEach((t) => clearTimeout(t))
    }
  }, [])

  const saveCurrent = useCallback(() => {
    if (!wallpaperUrl) {
      showToast('请先生成壁纸')
      return
    }
    const item: Wallpaper = {
      id: `wp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url: wallpaperUrl,
      prompt: currentPrompt,
      category: currentCategory,
      width: currentResolution.width,
      height: currentResolution.height,
      seed: currentSeed,
      createdAt: Date.now(),
      favorite: false,
    }
    setGallery((prev) => [...prev, item])
    showToast('已保存到画廊')
  }, [wallpaperUrl, currentPrompt, currentCategory, currentResolution, currentSeed, showToast])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      saveCurrent()
    }
  }, [saveCurrent])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const generateWallpaper = useCallback((promptOverride?: string) => {
    const prompt = promptOverride ?? currentPrompt
    if (!prompt.trim()) {
      showToast('请输入提示词或选择模板')
      return
    }
    setIsGenerating(true)
    const newSeed = Math.floor(Math.random() * 1000000)
    setCurrentSeed(newSeed)
    const url = buildWallpaperUrl(prompt, currentResolution.width, currentResolution.height, newSeed)
    setWallpaperUrl(url)
    setCurrentPrompt(prompt)
  }, [currentPrompt, currentResolution, showToast])

  const handleImageLoad = useCallback(() => {
    setIsGenerating(false)
  }, [])

  const handleImageError = useCallback(() => {
    setIsGenerating(false)
    showToast('壁纸生成失败，请重试')
  }, [showToast])

  const selectCategoryPrompt = useCallback((catKey: string, prompt: string) => {
    setCurrentCategory(catKey)
    setCurrentPrompt(prompt)
    setShowTemplates(false)
  }, [])

  const randomPrompt = useCallback(() => {
    const cat = CATEGORIES.find((c) => c.key === currentCategory)
    if (cat) {
      const random = cat.prompts[Math.floor(Math.random() * cat.prompts.length)]
      setCurrentPrompt(random)
    }
  }, [currentCategory])

  const toggleFavorite = useCallback((wp: Wallpaper) => {
    const isFav = wp.favorite
    if (isFav) {
      setFavorites((prev) => prev.filter((f) => f.id !== wp.id))
      setGallery((prev) => prev.map((g) => (g.id === wp.id ? { ...g, favorite: false } : g)))
      showToast('已取消收藏')
    } else {
      const favItem = { ...wp, favorite: true }
      setFavorites((prev) => [favItem, ...prev])
      setGallery((prev) => prev.map((g) => (g.id === wp.id ? { ...g, favorite: true } : g)))
      showToast('已加入收藏')
    }
  }, [showToast])

  const deleteFromGallery = useCallback((id: string) => {
    setGallery((prev) => prev.filter((g) => g.id !== id))
    setFavorites((prev) => prev.filter((f) => f.id !== id))
    showToast('已删除')
  }, [showToast])

  const downloadWallpaper = useCallback((wp: Wallpaper) => {
    const a = document.createElement('a')
    a.href = wp.url
    a.download = `wallpaper-${wp.width}x${wp.height}-${wp.seed}.jpg`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  const applyGlassEffect = useCallback(() => {
    const canvas = previewCanvasRef.current
    if (!canvas || !previewWallpaper) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      if (glassPreset.blur > 0) {
        ctx.filter = `blur(${glassPreset.blur}px)`
        ctx.globalAlpha = glassPreset.opacity
        ctx.fillStyle = 'rgba(20, 10, 50, 0.85)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.filter = 'none'
        ctx.globalAlpha = 1
        ctx.drawImage(img, 0, 0)
      }
    }
    img.onerror = () => {
      showToast('无法加载图片应用效果')
    }
    img.src = previewWallpaper.url
  }, [previewWallpaper, glassPreset, showToast])

  useEffect(() => {
    if (previewWallpaper && glassPreset.key !== 'none') {
      applyGlassEffect()
    }
  }, [previewWallpaper, glassPreset, applyGlassEffect])

  const currentCategoryData = useMemo(
    () => CATEGORIES.find((c) => c.key === currentCategory),
    [currentCategory]
  )

  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(145deg, #06061a 0%, #0d0d25 40%, #161040 100%)',
      color: '#e8e8ff',
      fontFamily: 'inherit',
      overflow: 'hidden',
    }}>
      {/* 顶部栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        background: 'rgba(10, 10, 28, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
          }}>
            <ImageIcon size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>AI 壁纸工作室</div>
            <div style={{ fontSize: 11, color: 'rgba(200, 200, 255, 0.6)' }}>Pollinations AI · 玻璃拟态壁纸</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[
            { key: 'create', label: '创建' },
            { key: 'gallery', label: `画廊 (${gallery.length})` },
            { key: 'favorites', label: `收藏 (${favorites.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'create' | 'gallery' | 'favorites')}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                transition: 'all 0.2s',
                background: activeTab === tab.key ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                color: activeTab === tab.key ? '#fff' : 'rgba(200, 200, 255, 0.6)',
                border: activeTab === tab.key ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {activeTab === 'create' && (
          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, height: '100%' }}>
            {/* 左侧控制面板 */}
            <div style={{
              background: 'rgba(20, 20, 45, 0.5)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              borderRadius: 16,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              overflow: 'auto',
            }}>
              {/* 分类选择 */}
              <div>
                <div style={{ fontSize: 12, color: 'rgba(200, 200, 255, 0.6)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Palette size={14} />
                  壁纸分类
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setCurrentCategory(cat.key)}
                      style={{
                        padding: '10px 6px',
                        borderRadius: 10,
                        border: currentCategory === cat.key ? '1px solid rgba(139, 92, 246, 0.6)' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: currentCategory === cat.key ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        color: '#e8e8ff',
                        cursor: 'pointer',
                        fontSize: 11,
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 提示词输入 */}
              <div>
                <div style={{ fontSize: 12, color: 'rgba(200, 200, 255, 0.6)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Search size={14} />
                  提示词
                </div>
                <textarea
                  value={currentPrompt}
                  onChange={(e) => setCurrentPrompt(e.target.value)}
                  placeholder="描述你想要的壁纸风格，如：cyberpunk city at night, neon lights..."
                  style={{
                    width: '100%',
                    minHeight: 90,
                    padding: 12,
                    borderRadius: 10,
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    background: 'rgba(10, 10, 25, 0.6)',
                    color: '#e8e8ff',
                    fontSize: 12,
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                  }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      background: 'rgba(139, 92, 246, 0.1)',
                      color: '#c4b5fd',
                      cursor: 'pointer',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Wand2 size={14} />
                    灵感模板
                  </button>
                  <button
                    onClick={randomPrompt}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      color: 'rgba(200, 200, 255, 0.8)',
                      cursor: 'pointer',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <RefreshCw size={14} />
                    随机
                  </button>
                </div>

                {showTemplates && currentCategoryData && (
                  <div style={{
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 10,
                    background: 'rgba(10, 10, 25, 0.8)',
                    border: '1px solid rgba(139, 92, 246, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    maxHeight: 200,
                    overflow: 'auto',
                  }}>
                    {currentCategoryData.prompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => selectCategoryPrompt(currentCategoryData.key, p)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'rgba(139, 92, 246, 0.08)',
                          color: '#e8e8ff',
                          cursor: 'pointer',
                          fontSize: 11,
                          textAlign: 'left',
                          lineHeight: 1.4,
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139, 92, 246, 0.18)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)')}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 分辨率选择 */}
              <div>
                <div style={{ fontSize: 12, color: 'rgba(200, 200, 255, 0.6)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Monitor size={14} />
                  分辨率
                </div>
                <div style={{ position: 'relative' }}>
                  <select
                    value={currentResolution.label}
                    onChange={(e) => {
                      const res = RESOLUTIONS.find((r) => r.label === e.target.value)
                      if (res) setCurrentResolution(res)
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 36px 10px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      background: 'rgba(10, 10, 25, 0.6)',
                      color: '#e8e8ff',
                      fontSize: 12,
                      outline: 'none',
                      appearance: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {RESOLUTIONS.map((r) => (
                      <option key={r.label} value={r.label} style={{ background: '#1a1a3a' }}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'rgba(200, 200, 255, 0.5)', pointerEvents: 'none',
                  }} />
                </div>
              </div>

              {/* 玻璃效果预设 */}
              <div>
                <div style={{ fontSize: 12, color: 'rgba(200, 200, 255, 0.6)', marginBottom: 10 }}>
                  玻璃效果
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {GLASS_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      onClick={() => setGlassPreset(preset)}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        borderRadius: 8,
                        border: glassPreset.key === preset.key ? '1px solid rgba(139, 92, 246, 0.6)' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: glassPreset.key === preset.key ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        color: '#e8e8ff',
                        cursor: 'pointer',
                        fontSize: 11,
                        transition: 'all 0.2s',
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 生成按钮 */}
              <button
                onClick={() => generateWallpaper()}
                disabled={isGenerating}
                style={{
                  padding: '14px 24px',
                  borderRadius: 12,
                  border: 'none',
                  background: isGenerating
                    ? 'rgba(139, 92, 246, 0.4)'
                    : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  color: '#fff',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: isGenerating ? 'none' : '0 4px 20px rgba(139, 92, 246, 0.4)',
                  transition: 'all 0.2s',
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    生成壁纸
                  </>
                )}
              </button>

              <button
                onClick={saveCurrent}
                disabled={!wallpaperUrl}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  background: wallpaperUrl ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: wallpaperUrl ? '#c4b5fd' : 'rgba(200, 200, 255, 0.4)',
                  cursor: wallpaperUrl ? 'pointer' : 'not-allowed',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                <Save size={14} />
                保存当前壁纸 (Ctrl+S)
              </button>
            </div>

            {/* 右侧预览区 */}
            <div style={{
              background: 'rgba(15, 15, 35, 0.5)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              borderRadius: 16,
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 400,
            }}>
              {wallpaperUrl ? (
                <>
                  <img
                    src={wallpaperUrl}
                    alt={currentPrompt}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                  {isGenerating && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(10, 10, 25, 0.7)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 16,
                    }}>
                      <Loader2 size={36} className="animate-spin" style={{ color: '#8b5cf6' }} />
                      <div style={{ fontSize: 13, color: 'rgba(200, 200, 255, 0.7)' }}>
                        AI 正在生成壁纸...
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(200, 200, 255, 0.4)' }}>
                        {currentResolution.width} × {currentResolution.height}
                      </div>
                    </div>
                  )}

                  {/* 浮动操作栏 */}
                  <div style={{
                    position: 'absolute',
                    bottom: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 12,
                    background: 'rgba(10, 10, 25, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                  }}>
                    <button
                      onClick={() => {
                        const item: Wallpaper = {
                          id: `wp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                          url: wallpaperUrl,
                          prompt: currentPrompt,
                          category: currentCategory,
                          width: currentResolution.width,
                          height: currentResolution.height,
                          seed: currentSeed,
                          createdAt: Date.now(),
                          favorite: false,
                        }
                        downloadWallpaper(item)
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'rgba(139, 92, 246, 0.2)',
                        color: '#c4b5fd',
                        cursor: 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Download size={14} />
                      下载
                    </button>
                    <button
                      onClick={() => generateWallpaper()}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#e8e8ff',
                        cursor: 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <RefreshCw size={14} />
                      重新生成
                    </button>
                  </div>
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                  opacity: 0.4,
                }}>
                  <ImageIcon size={64} />
                  <div style={{ fontSize: 14 }}>选择分类和提示词，开始创建壁纸</div>
                  <div style={{ fontSize: 12, color: 'rgba(200, 200, 255, 0.5)' }}>
                    Pollinations AI · 免费公开 API
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <WallpaperGrid
            wallpapers={gallery}
            onPreview={setPreviewWallpaper}
            onDownload={downloadWallpaper}
            onToggleFavorite={toggleFavorite}
            onDelete={deleteFromGallery}
            emptyText="画廊为空，生成一些壁纸吧！"
          />
        )}

        {activeTab === 'favorites' && (
          <WallpaperGrid
            wallpapers={favorites}
            onPreview={setPreviewWallpaper}
            onDownload={downloadWallpaper}
            onToggleFavorite={toggleFavorite}
            onDelete={deleteFromGallery}
            emptyText="还没有收藏的壁纸"
          />
        )}
      </div>

      {/* 预览弹窗 */}
      {previewWallpaper && (
        <div
          onClick={() => setPreviewWallpaper(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: 16,
              overflow: 'hidden',
              background: 'rgba(20, 20, 45, 0.8)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}
          >
            <button
              onClick={() => setPreviewWallpaper(null)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 10,
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(0, 0, 0, 0.6)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>

            {glassPreset.key !== 'none' ? (
              <canvas
                ref={previewCanvasRef}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '80vh',
                  display: 'block',
                }}
              />
            ) : (
              <img
                src={previewWallpaper.url}
                alt={previewWallpaper.prompt}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '80vh',
                  display: 'block',
                }}
              />
            )}

            <div style={{
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12,
                  color: 'rgba(200, 200, 255, 0.8)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {previewWallpaper.prompt}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(200, 200, 255, 0.5)', marginTop: 4 }}>
                  {previewWallpaper.width}×{previewWallpaper.height} · 种子 {previewWallpaper.seed}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => toggleFavorite(previewWallpaper)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: previewWallpaper.favorite ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    color: previewWallpaper.favorite ? '#ef4444' : '#e8e8ff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {previewWallpaper.favorite ? <Heart size={16} /> : <HeartOff size={16} />}
                </button>
                <button
                  onClick={() => downloadWallpaper(previewWallpaper)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'rgba(139, 92, 246, 0.2)',
                    color: '#c4b5fd',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Download size={16} />
                  下载
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          borderRadius: 10,
          background: 'rgba(20, 20, 45, 0.95)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          color: '#e8e8ff',
          fontSize: 13,
          zIndex: 10000,
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Eye size={14} />
          {toast}
        </div>
      )}
    </div>
  )
}

interface WallpaperGridProps {
  wallpapers: Wallpaper[]
  onPreview: (wp: Wallpaper) => void
  onDownload: (wp: Wallpaper) => void
  onToggleFavorite: (wp: Wallpaper) => void
  onDelete: (id: string) => void
  emptyText: string
}

function WallpaperGrid({
  wallpapers,
  onPreview,
  onDownload,
  onToggleFavorite,
  onDelete,
  emptyText,
}: WallpaperGridProps) {
  if (wallpapers.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 16,
        opacity: 0.4,
      }}>
        <Grid3X3 size={48} />
        <div style={{ fontSize: 14 }}>{emptyText}</div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 16,
    }}>
      {wallpapers.map((wp) => (
        <div
          key={wp.id}
          style={{
            background: 'rgba(20, 20, 45, 0.5)',
            border: '1px solid rgba(139, 92, 246, 0.12)',
            borderRadius: 12,
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative',
          }}
          onClick={() => onPreview(wp)}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.12)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <div style={{ aspectRatio: '16/10', overflow: 'hidden', background: '#0a0a1a' }}>
            <img
              src={wp.url}
              alt={wp.prompt}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
          </div>

          <div style={{ padding: 12 }}>
            <div style={{
              fontSize: 11,
              color: 'rgba(200, 200, 255, 0.7)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: 8,
            }}>
              {wp.prompt}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}>
              <div style={{ fontSize: 10, color: 'rgba(200, 200, 255, 0.4)' }}>
                {wp.width}×{wp.height}
              </div>

              <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onToggleFavorite(wp)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: 'none',
                    background: wp.favorite ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: wp.favorite ? '#ef4444' : 'rgba(200, 200, 255, 0.6)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {wp.favorite ? <Heart size={13} /> : <HeartOff size={13} />}
                </button>
                <button
                  onClick={() => onDownload(wp)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(200, 200, 255, 0.6)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Download size={13} />
                </button>
                <button
                  onClick={() => onDelete(wp.id)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(200, 200, 255, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}