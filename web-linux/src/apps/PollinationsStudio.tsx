import { useState, useEffect, useCallback, useRef, memo } from 'react'
import './PollinationsStudio.css'
import {
  Sparkles, Image, Download, RefreshCw, History,
  Settings, Zap, Palette,
  Grid, Copy, Check,
  Wand2, Heart
} from 'lucide-react'

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  timestamp: number
  style: string
  width: number
  height: number
}

interface StylePreset {
  id: string
  name: string
  prompt: string
  preview?: string
}

const STYLE_PRESETS: StylePreset[] = [
  { id: 'realistic', name: '真实摄影', prompt: 'photorealistic, high quality, 4k, detailed' },
  { id: 'anime', name: '动漫风格', prompt: 'anime style, cel shading, vibrant colors' },
  { id: 'oil', name: '油画风格', prompt: 'oil painting, classical art, textured brushstrokes' },
  { id: 'watercolor', name: '水彩画', prompt: 'watercolor painting, soft colors, artistic' },
  { id: 'cyberpunk', name: '赛博朋克', prompt: 'cyberpunk style, neon lights, futuristic, sci-fi' },
  { id: 'fantasy', name: '奇幻风格', prompt: 'fantasy art, magical, ethereal, dreamy atmosphere' },
  { id: 'pixel', name: '像素艺术', prompt: 'pixel art, 8-bit style, retro game aesthetic' },
  { id: 'portrait', name: '人像写真', prompt: 'portrait photography, studio lighting, professional' },
  { id: 'landscape', name: '风景如画', prompt: 'landscape photography, breathtaking views, nature' },
  { id: 'logo', name: 'Logo设计', prompt: 'logo design, minimalist, professional branding' },
]

const ASPECT_RATIOS = [
  { label: '正方形', ratio: '1:1', width: 1024, height: 1024 },
  { label: '横屏', ratio: '16:9', width: 1280, height: 720 },
  { label: '竖屏', ratio: '9:16', width: 720, height: 1280 },
  { label: '4:3', ratio: '4:3', width: 1024, height: 768 },
  { label: '3:4', ratio: '3:4', width: 768, height: 1024 },
]

const PollinationsStudio = memo(function PollinationsStudio() {
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('realistic')
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0])
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [steps, setSteps] = useState(30)
  const [enhancePrompt, setEnhancePrompt] = useState(false)
  const [copied, setCopied] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pollinations-favorites')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  
  const progressIntervalRef = useRef<number | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem('pollinations-favorites', JSON.stringify(favorites))
    } catch {}
  }, [favorites])

  const generateImage = useCallback(async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    setGenerationProgress(0)
    
    const interval = window.setInterval(() => {
      setGenerationProgress(p => Math.min(90, p + Math.random() * 15))
    }, 300)
    progressIntervalRef.current = interval
    
    try {
      const style = STYLE_PRESETS.find(s => s.id === selectedStyle)
      const fullPrompt = style ? `${prompt}, ${style.prompt}` : prompt
      const encodedPrompt = encodeURIComponent(fullPrompt)
      const seed = Math.floor(Math.random() * 1000000)
      
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${selectedRatio.width}&height=${selectedRatio.height}&seed=${seed}&nologo=true&enhance=${enhancePrompt}`
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const image: GeneratedImage = {
        id: `${Date.now()}-${Math.random()}`,
        url,
        prompt: fullPrompt,
        timestamp: Date.now(),
        style: selectedStyle,
        width: selectedRatio.width,
        height: selectedRatio.height
      }
      
      setImages(prev => [image, ...prev])
      setCurrentImage(image)
      setGenerationProgress(100)
      
    } catch (error) {
      console.error('Image generation failed:', error)
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      setTimeout(() => {
        setIsGenerating(false)
        setGenerationProgress(0)
      }, 300)
    }
  }, [prompt, selectedStyle, selectedRatio, enhancePrompt])

  const downloadImage = useCallback((image: GeneratedImage) => {
    const link = document.createElement('a')
    link.href = image.url
    link.download = `weblinux-${image.id}.png`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [])

  const toggleFavorite = useCallback((imageId: string) => {
    setFavorites(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }, [])

  const handlePromptSuggestion = (suggestion: string) => {
    setPrompt(prev => prev ? `${prev}, ${suggestion}` : suggestion)
  }

  const promptSuggestions = [
    'amazing', 'beautiful', 'detailed', 'professional',
    'cinematic lighting', 'bokeh', 'macro', 'aerial view'
  ]

  return (
    <div className="pollinations-studio">
      <header className="studio-header">
        <div className="studio-brand">
          <div className="brand-icon">
            <Sparkles size={24} />
          </div>
          <div>
            <h1>Pollinations AI 图像工作室</h1>
            <p>免费AI图像生成 · 零配置 · 实时预览</p>
          </div>
        </div>
        
        <div className="studio-actions">
          <button 
            className="action-btn"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History size={18} />
            历史
            {images.length > 0 && <span className="badge">{images.length}</span>}
          </button>
          <button 
            className="action-btn"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={18} />
            设置
          </button>
        </div>
      </header>

      <main className="studio-main">
        <aside className="control-panel">
          <div className="panel-section">
            <label className="section-label">
              <Wand2 size={16} />
              描述你的图像
            </label>
            <textarea
              className="prompt-input"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="描述你想生成的图像，例如：一只可爱的橘猫在窗台上晒太阳..."
              rows={4}
            />
            <div className="prompt-suggestions">
              {promptSuggestions.map(suggestion => (
                <button
                  key={suggestion}
                  className="suggestion-chip"
                  onClick={() => handlePromptSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <label className="section-label">
              <Palette size={16} />
              选择风格
            </label>
            <div className="style-grid">
              {STYLE_PRESETS.map(style => (
                <button
                  key={style.id}
                  className={`style-card ${selectedStyle === style.id ? 'active' : ''}`}
                  onClick={() => setSelectedStyle(style.id)}
                >
                  <div className="style-preview" data-style={style.id}>
                    <Image size={20} />
                  </div>
                  <span className="style-name">{style.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <label className="section-label">
              <Grid size={16} />
              画布比例
            </label>
            <div className="ratio-options">
              {ASPECT_RATIOS.map(ratio => (
                <button
                  key={ratio.ratio}
                  className={`ratio-btn ${selectedRatio.ratio === ratio.ratio ? 'active' : ''}`}
                  onClick={() => setSelectedRatio(ratio)}
                >
                  <span className="ratio-label">{ratio.label}</span>
                  <span className="ratio-value">{ratio.ratio}</span>
                </button>
              ))}
            </div>
          </div>

          {showSettings && (
            <div className="panel-section settings-section">
              <label className="section-label">
                <Settings size={16} />
                高级设置
              </label>
              <div className="setting-row">
                <span>AI增强</span>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={enhancePrompt}
                    onChange={e => setEnhancePrompt(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="setting-row">
                <span>生成步数</span>
                <select value={steps} onChange={e => setSteps(Number(e.target.value))}>
                  <option value={20}>快速 (20)</option>
                  <option value={30}>标准 (30)</option>
                  <option value={50}>高质量 (50)</option>
                </select>
              </div>
            </div>
          )}

          <button
            className={`generate-btn ${isGenerating ? 'generating' : ''}`}
            onClick={generateImage}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={20} className="spinning" />
                生成中... {Math.round(generationProgress)}%
              </>
            ) : (
              <>
                <Zap size={20} />
                生成图像
              </>
            )}
          </button>
        </aside>

        <section className="canvas-area">
          {currentImage ? (
            <div className="image-display">
              <div className="image-container">
                {isGenerating ? (
                  <div className="generating-overlay">
                    <div className="progress-ring">
                      <svg width="80" height="80">
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="4"
                          fill="none"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          stroke="#8b5cf6"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 35}`}
                          strokeDashoffset={`${2 * Math.PI * 35 * (1 - generationProgress / 100)}`}
                          strokeLinecap="round"
                          transform="rotate(-90 40 40)"
                        />
                      </svg>
                      <span>{Math.round(generationProgress)}%</span>
                      <p>AI正在创作中...</p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={currentImage.url}
                    alt={currentImage.prompt}
                    className="generated-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
              </div>
              
              <div className="image-info">
                <div className="info-header">
                  <span className="style-badge">
                    {STYLE_PRESETS.find(s => s.id === currentImage.style)?.name}
                  </span>
                  <span className="resolution-badge">
                    {currentImage.width} × {currentImage.height}
                  </span>
                </div>
                <p className="prompt-text">{currentImage.prompt}</p>
                
                <div className="image-actions">
                  <button onClick={() => copyToClipboard(currentImage.prompt)}>
                    <Copy size={16} />
                    复制提示词
                  </button>
                  <button 
                    onClick={() => toggleFavorite(currentImage.id)}
                    className={favorites.includes(currentImage.id) ? 'favorited' : ''}
                  >
                    <Heart size={16} />
                    {favorites.includes(currentImage.id) ? '已收藏' : '收藏'}
                  </button>
                  <button onClick={() => downloadImage(currentImage)}>
                    <Download size={16} />
                    下载
                  </button>
                  <button onClick={() => {
                    setPrompt(currentImage.prompt)
                    setSelectedStyle(currentImage.style)
                  }}>
                    <RefreshCw size={16} />
                    重新编辑
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-canvas">
              <div className="empty-icon">
                <Image size={64} />
              </div>
              <h2>开始创作</h2>
              <p>在左侧描述你想生成的图像，AI将为你创作独特的视觉作品</p>
              <div className="example-prompts">
                <h3>试试这些提示词：</h3>
                <div className="example-list">
                  <button onClick={() => setPrompt('一只可爱的柯基犬在樱花树下奔跑')}>
                    🐕 一只可爱的柯基犬在樱花树下奔跑
                  </button>
                  <button onClick={() => setPrompt('赛博朋克风格的未来城市夜景')}>
                    🌃 赛博朋克风格的未来城市夜景
                  </button>
                  <button onClick={() => setPrompt('梦幻般的水下世界，色彩斑斓的珊瑚礁')}>
                    🐠 梦幻般的水下世界，色彩斑斓的珊瑚礁
                  </button>
                  <button onClick={() => setPrompt('极简风格的产品设计，白色背景')}>
                    ✨ 极简风格的产品设计，白色背景
                  </button>
                </div>
              </div>
            </div>
          )}

          {showHistory && images.length > 0 && (
            <div className="history-panel">
              <div className="history-header">
                <h3>生成历史</h3>
                <button onClick={() => setImages([])}>清空历史</button>
              </div>
              <div className="history-grid">
                {images.map(img => (
                  <div
                    key={img.id}
                    className={`history-item ${currentImage?.id === img.id ? 'active' : ''}`}
                    onClick={() => setCurrentImage(img)}
                  >
                    <img src={img.url} alt={img.prompt} />
                    <div className="history-overlay">
                      <span className="history-time">
                        {new Date(img.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {copied && (
        <div className="copied-toast">
          <Check size={16} />
          已复制到剪贴板
        </div>
      )}
    </div>
  )
})

export default PollinationsStudio
