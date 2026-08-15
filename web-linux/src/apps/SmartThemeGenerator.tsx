import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import {
  Palette,
  RefreshCw,
  Save,
  Trash2,
  Check,
  Download,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Sun,
  Moon,
  Sliders,
  Wand2,
  Contrast,
} from 'lucide-react'
import { useStore } from '../store'

/* ========== 类型定义 ========== */

type ColorMode = 'hex' | 'rgb' | 'hsl'
type HarmonyAlgorithm = 'monochromatic' | 'complementary' | 'splitComplementary' | 'triadic' | 'tetradic'
type ThemeCategory = 'ai' | 'manual' | 'preset'

interface ThemeColor {
  id: string
  hex: string
  role: 'primary' | 'secondary' | 'accent' | 'background' | 'surface' | 'text' | 'success' | 'warning' | 'error' | 'info'
  locked: boolean
  name: string
}

interface SavedTheme {
  id: string
  name: string
  colors: ThemeColor[]
  createdAt: string
  updatedAt: string
  category: ThemeCategory
  keyword?: string
}

interface ContrastResult {
  ratio: number
  aa: boolean
  aaa: boolean
  aaLarge: boolean
  aaaLarge: boolean
}

interface AIPrompt {
  keyword: string
  mood: string
  temperature: number
}

/* ========== Color 工具类 ========== */

class ColorUtils {
  static clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v))
  }

  static hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '').trim()
    if (h.length === 3) {
      return [
        parseInt(h[0] + h[0], 16),
        parseInt(h[1] + h[1], 16),
        parseInt(h[2] + h[2], 16),
      ]
    }
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ]
  }

  static rgbToHex(r: number, g: number, b: number): string {
    const toHex = (x: number) =>
      this.clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
  }

  static rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    const rn = r / 255, gn = g / 255, bn = b / 255
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
    const l = (max + min) / 2
    let h = 0, s = 0
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break
        case gn: h = ((bn - rn) / d + 2) / 6; break
        case bn: h = ((rn - gn) / d + 4) / 6; break
      }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
  }

  static hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const sn = s / 100, ln = l / 100
    const a = sn * Math.min(ln, 1 - ln)
    const f = (n: number) => {
      const k = (n + h / 30) % 12
      return ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    }
    return [
      Math.round(this.clamp(f(0), 0, 1) * 255),
      Math.round(this.clamp(f(8), 0, 1) * 255),
      Math.round(this.clamp(f(4), 0, 1) * 255),
    ]
  }

  static hexToHsl(hex: string): [number, number, number] {
    const [r, g, b] = this.hexToRgb(hex)
    return this.rgbToHsl(r, g, b)
  }

  static hslToHex(h: number, s: number, l: number): string {
    const [r, g, b] = this.hslToRgb(h, s, l)
    return this.rgbToHex(r, g, b)
  }

  static getLuminance(hex: string): number {
    const [r, g, b] = this.hexToRgb(hex)
    const toLinear = (c: number) => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  }

  static getRelativeLuminance(hex1: string, hex2: string): number {
    const l1 = this.getLuminance(hex1)
    const l2 = this.getLuminance(hex2)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  static getContrastColor(hex: string): string {
    return this.getLuminance(hex) > 0.5 ? '#000000' : '#FFFFFF'
  }

  static mixColors(hex1: string, hex2: string, ratio: number): string {
    const [r1, g1, b1] = this.hexToRgb(hex1)
    const [r2, g2, b2] = this.hexToRgb(hex2)
    const t = this.clamp(ratio, 0, 1)
    return this.rgbToHex(
      Math.round(r1 * (1 - t) + r2 * t),
      Math.round(g1 * (1 - t) + g2 * t),
      Math.round(b1 * (1 - t) + b2 * t),
    )
  }

  static getComplementary(hex: string): string {
    const [h, s, l] = this.hexToHsl(hex)
    return this.hslToHex((h + 180) % 360, s, l)
  }

  static getHarmonyColors(hex: string, algorithm: HarmonyAlgorithm): string[] {
    const [h, s, l] = this.hexToHsl(hex)
    switch (algorithm) {
      case 'monochromatic':
        return [
          this.hslToHex(h, s, this.clamp(l - 25, 10, 90)),
          this.hslToHex(h, s, this.clamp(l - 12, 10, 90)),
          hex,
          this.hslToHex(h, s, this.clamp(l + 12, 10, 90)),
          this.hslToHex(h, s, this.clamp(l + 25, 10, 90)),
        ]
      case 'complementary':
        return [
          this.hslToHex(h, s, l),
          this.hslToHex(h, s, this.clamp(l + 15, 10, 90)),
          this.hslToHex((h + 180) % 360, s, l),
          this.hslToHex((h + 180) % 360, s, this.clamp(l + 15, 10, 90)),
          this.hslToHex(((h + 180) % 360), this.clamp(s - 20, 10, 100), this.clamp(l + 30, 10, 90)),
        ]
      case 'splitComplementary':
        return [
          hex,
          this.hslToHex(h, this.clamp(s - 10, 10, 100), this.clamp(l + 15, 10, 90)),
          this.hslToHex((h + 150) % 360, s, l),
          this.hslToHex((h + 210) % 360, s, l),
          this.hslToHex(((h + 180) % 360), this.clamp(s - 20, 10, 100), this.clamp(l + 20, 10, 90)),
        ]
      case 'triadic':
        return [
          hex,
          this.hslToHex((h + 120) % 360, s, l),
          this.hslToHex((h + 240) % 360, s, l),
          this.hslToHex(h, this.clamp(s - 15, 10, 100), this.clamp(l + 20, 10, 90)),
          this.hslToHex((h + 120) % 360, this.clamp(s - 15, 10, 100), this.clamp(l + 20, 10, 90)),
        ]
      case 'tetradic':
        return [
          hex,
          this.hslToHex((h + 90) % 360, s, l),
          this.hslToHex((h + 180) % 360, s, l),
          this.hslToHex((h + 270) % 360, s, l),
          this.hslToHex(h, this.clamp(s - 20, 10, 100), this.clamp(l + 25, 10, 90)),
        ]
    }
  }

  static isValidHex(hex: string): boolean {
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim())
  }

  static getRandomHex(): string {
    const n = Math.floor(Math.random() * 16777215)
    return `#${n.toString(16).padStart(6, '0').toUpperCase()}`
  }

  static generateFromKeyword(keyword: string, temperature: number): string[] {
    const keywordPalettes: Record<string, string[][]> = {
      ocean: [
        ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#023E8A'],
        ['#03045E', '#0077B6', '#00B4D8', '#48CAE4', '#90E0EF'],
      ],
      sunset: [
        ['#F72585', '#B5179E', '#7209B7', '#F77F00', '#FCBF49'],
        ['#FF6B6B', '#FFE66D', '#FF8E72', '#FFA07A', '#FFD93D'],
      ],
      forest: [
        ['#2D6A4F', '#52B788', '#95D5B2', '#D8F3DC', '#1B4332'],
        ['#1A7431', '#2B9348', '#57A773', '#88B56A', '#D4CFC4'],
      ],
      fire: [
        ['#D00000', '#E85D04', '#FAA307', '#FFBA08', '#6A040F'],
        ['#F94144', '#F3722C', '#F8961E', '#F9C74F', '#90BE6D'],
      ],
      sky: [
        ['#48CAE4', '#90E0EF', '#CAF0F8', '#ADE8F4', '#0077B6'],
        ['#8ECAE6', '#219EBC', '#023047', '#FFB703', '#FB8500'],
      ],
      lavender: [
        ['#E0BBE4', '#957DAD', '#D291BC', '#FEC8D8', '#FFDFD3'],
        ['#B57EDC', '#E6B2E6', '#DDA0DD', '#D8BFD8', '#FFF0F5'],
      ],
      mint: [
        ['#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B500'],
        ['#A8E6CF', '#DCEDC8', '#FFD3B6', '#FFAAA5', '#FF8B94'],
      ],
      corporate: [
        ['#1B263B', '#415A77', '#778DA9', '#E0E1DD', '#0D1B2A'],
        ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'],
      ],
      pastel: [
        ['#FFD6E8', '#FFE9F0', '#E8D5F2', '#D5E8F2', '#D5F2E8'],
        ['#FDFFB6', '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF'],
      ],
      dark: [
        ['#0D0D0D', '#1A1A2E', '#16213E', '#0F3460', '#533483'],
        ['#10002B', '#240046', '#3C096C', '#5A189A', '#7B2CBF'],
      ],
      warm: [
        ['#E63946', '#F1FAEE', '#A8DADC', '#457B9D', '#1D3557'],
        ['#E76F51', '#F4A261', '#E9C46A', '#2A9D8F', '#264653'],
      ],
      cool: [
        ['#0FA3B1', '#B5E2FA', '#F9EDDA', '#EDDBC7', '#FAE5D3'],
        ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'],
      ],
      earth: [
        ['#606C38', '#283618', '#DDA15E', '#BC6C25', '#FEFAE0'],
        ['#582F0E', '#7F4F24', '#936639', '#B6AD90', '#DDB892'],
      ],
      neon: [
        ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF'],
        ['#F72585', '#B5179E', '#7209B7', '#560BAD', '#3A0CA3'],
      ],
      oceanic: [
        ['#023E8A', '#0077B6', '#00B4D8', '#48CAE4', '#CAF0F8'],
        ['#03045E', '#023E8A', '#0077B6', '#00B4D8', '#90E0EF'],
      ],
      cherry: [
        ['#FFB7C5', '#FF69B4', '#FF1493', '#C71585', '#8B0000'],
        ['#FFC8DD', '#FFAFCC', '#BDE0FE', '#A2D2FF', '#CDB4DB'],
      ],
    }

    const moodPalettes: Record<string, string[]> = {
      energetic: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B6B'],
      calm: ['#A8DADC', '#457B9D', '#1D3557', '#F1FAEE', '#E63946'],
      professional: ['#023047', '#219EBC', '#8ECAE6', '#FFB703', '#FB8500'],
      creative: ['#FF006E', '#8338EC', '#3A86FF', '#06FFA5', '#FFBE0B'],
      elegant: ['#2B2D42', '#8D99AE', '#EDF2F4', '#EF233C', '#D90429'],
      playful: ['#FFB5A7', '#FCD5CE', '#F8EDEB', '#F9DCC4', '#FEC89A'],
      minimal: ['#E5E5E5', '#CCCCCC', '#B0B0B0', '#8E8E8E', '#636363'],
      romantic: ['#FFC8DD', '#FFAFCC', '#BDE0FE', '#A2D2FF', '#CDB4DB'],
      adventurous: ['#E63946', '#F1FAEE', '#A8DADC', '#457B9D', '#1D3557'],
      luxurious: ['#D4AF37', '#000000', '#FFFFFF', '#C0C0C0', '#8B7500'],
    }

    const lower = keyword.toLowerCase().trim()
    const t = ColorUtils.clamp(temperature, 0, 1)

    if (moodPalettes[lower]) {
      return moodPalettes[lower]
    }

    for (const key in keywordPalettes) {
      if (lower.includes(key)) {
        const variants = keywordPalettes[key]
        const idx = Math.floor(t * (variants.length - 1))
        return variants[idx]
      }
    }

    const baseHue = (lower.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 7) % 360
    const s = 60 + Math.floor(t * 30)
    const lBase = 45 + Math.floor(t * 20)
    return [
      ColorUtils.hslToHex(baseHue, s, lBase),
      ColorUtils.hslToHex((baseHue + 30) % 360, s - 10, lBase + 15),
      ColorUtils.hslToHex((baseHue + 60) % 360, s - 15, lBase + 25),
      ColorUtils.hslToHex((baseHue + 180) % 360, s - 5, lBase + 5),
      ColorUtils.hslToHex(baseHue, s - 20, lBase - 15),
    ]
  }
}

/* ========== WCAG 对比度计算 ========== */

function getWcagContrast(fg: string, bg: string): ContrastResult {
  const ratio = ColorUtils.getRelativeLuminance(fg, bg)
  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
    aaLarge: ratio >= 3,
    aaaLarge: ratio >= 4.5,
  }
}

/* ========== 初始主题颜色 ========== */

const ROLE_LABELS: Record<ThemeColor['role'], string> = {
  primary: '主色',
  secondary: '次要',
  accent: '强调',
  background: '背景',
  surface: '表面',
  text: '文本',
  success: '成功',
  warning: '警告',
  error: '错误',
  info: '信息',
}
void ROLE_LABELS

const DEFAULT_COLORS: ThemeColor[] = [
  { id: 'c1', hex: '#7C6CF0', role: 'primary', locked: false, name: '主色' },
  { id: 'c2', hex: '#9B8AF0', role: 'secondary', locked: false, name: '次要' },
  { id: 'c3', hex: '#06B6D4', role: 'accent', locked: false, name: '强调' },
  { id: 'c4', hex: '#1A1A2E', role: 'background', locked: false, name: '背景' },
  { id: 'c5', hex: '#252538', role: 'surface', locked: false, name: '表面' },
  { id: 'c6', hex: '#F5F5F7', role: 'text', locked: false, name: '文本' },
  { id: 'c7', hex: '#10B981', role: 'success', locked: false, name: '成功' },
  { id: 'c8', hex: '#F59E0B', role: 'warning', locked: false, name: '警告' },
  { id: 'c9', hex: '#EF4444', role: 'error', locked: false, name: '错误' },
  { id: 'c10', hex: '#3B82F6', role: 'info', locked: false, name: '信息' },
]

/* ========== 辅助函数 ========== */

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function exportToCss(colors: ThemeColor[], theme: 'dark' | 'light'): string {
  const vars = colors.map(c => `  --color-${c.role}: ${c.hex};`)
  const themeVars = theme === 'dark'
    ? `  --bg-primary: ${colors.find(c => c.role === 'background')?.hex || '#1A1A2E'};
  --bg-surface: ${colors.find(c => c.role === 'surface')?.hex || '#252538'};
  --text-primary: ${colors.find(c => c.role === 'text')?.hex || '#F5F5F7'};`
    : `  --bg-primary: ${colors.find(c => c.role === 'text')?.hex || '#F5F5F7'};
  --bg-surface: ${colors.find(c => c.role === 'surface')?.hex || '#FFFFFF'};
  --text-primary: ${colors.find(c => c.role === 'background')?.hex || '#1A1A2E'};`

  return `:root {
${vars.join('\n')}
${themeVars}
}`
}

/* ========== 主组件 ========== */

const STORAGE_KEY_THEMES = 'weblinuxos-smart-themes'

const SmartThemeGenerator = memo(function SmartThemeGenerator() {
  const { setAccentColor, addNotification, accentPresets } = useStore()

  const [colors, setColors] = useState<ThemeColor[]>(DEFAULT_COLORS)
  const [aiPrompt, setAiPrompt] = useState<AIPrompt>({
    keyword: '',
    mood: '',
    temperature: 0.6,
  })
  const [selectedAlgorithm, setSelectedAlgorithm] =
    useState<HarmonyAlgorithm>('complementary')
  const [editingMode, setEditingMode] = useState<ColorMode>('hex')
  const [activeColorId, setActiveColorId] = useState<string>('c1')
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark')
  const [themes, setThemes] = useState<SavedTheme[]>([])
  const [newThemeName, setNewThemeName] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'ai' | 'manual' | 'harmony' | 'manage'>('ai')
  const [showPreview, setShowPreview] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [cssOutput, setCssOutput] = useState('')

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const activeColor = useMemo(
    () => colors.find(c => c.id === activeColorId) || colors[0],
    [colors, activeColorId],
  )

  /* ========== 加载已保存主题 ========== */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEMES)
      if (saved) {
        setThemes(JSON.parse(saved))
      }
    } catch { /* empty */ }
  }, [])

  const persistThemes = useCallback((updated: SavedTheme[]) => {
    setThemes(updated)
    try {
      localStorage.setItem(STORAGE_KEY_THEMES, JSON.stringify(updated))
    } catch { /* empty */ }
  }, [])

  /* ========== AI 生成配色 ========== */
  const generateByKeyword = useCallback(() => {
    if (!aiPrompt.keyword.trim()) {
      addNotification({
        title: '请输入关键词',
        message: '输入一个关键词来生成主题配色',
        type: 'warning',
      })
      return
    }
    setIsGenerating(true)

    setTimeout(() => {
      const source = aiPrompt.mood.trim() || aiPrompt.keyword.trim()
      const generated = ColorUtils.generateFromKeyword(source, aiPrompt.temperature)
      const baseColor = generated[0]

      const [h, s, l] = ColorUtils.hexToHsl(baseColor)
      const bgColor = ColorUtils.hslToHex(h, s * 0.3, 8)
      const surfaceColor = ColorUtils.hslToHex(h, s * 0.4, 14)
      const textColor = ColorUtils.hslToHex(h, 15, 96)

      const updated: ThemeColor[] = [
        { id: 'c1', hex: generated[0], role: 'primary', locked: true, name: '主色' },
        { id: 'c2', hex: generated[1] || ColorUtils.hslToHex((h + 30) % 360, s, l), role: 'secondary', locked: false, name: '次要' },
        { id: 'c3', hex: generated[2] || ColorUtils.hslToHex((h + 60) % 360, s, l), role: 'accent', locked: false, name: '强调' },
        { id: 'c4', hex: bgColor, role: 'background', locked: false, name: '背景' },
        { id: 'c5', hex: surfaceColor, role: 'surface', locked: false, name: '表面' },
        { id: 'c6', hex: textColor, role: 'text', locked: false, name: '文本' },
        { id: 'c7', hex: '#10B981', role: 'success', locked: false, name: '成功' },
        { id: 'c8', hex: '#F59E0B', role: 'warning', locked: false, name: '警告' },
        { id: 'c9', hex: '#EF4444', role: 'error', locked: false, name: '错误' },
        { id: 'c10', hex: generated[3] || ColorUtils.hslToHex((h + 180) % 360, s * 0.8, l), role: 'info', locked: false, name: '信息' },
      ]

      setColors(updated)
      setActiveColorId('c1')
      setIsGenerating(false)

      addNotification({
        title: '配色生成完成',
        message: `基于关键词"${aiPrompt.keyword}"生成了新配色方案`,
        type: 'success',
      })
    }, 400)
  }, [aiPrompt, addNotification])

  /* ========== 和谐度生成 ========== */
  const generateHarmony = useCallback(() => {
    const base = activeColor.hex
    const harmonies = ColorUtils.getHarmonyColors(base, selectedAlgorithm)

    setColors(prev => {
      const next = [...prev]
      const unlockedIndices = next
        .map((c, i) => (!c.locked ? i : -1))
        .filter(i => i >= 0)

      harmonies.forEach((col, i) => {
        if (unlockedIndices[i] !== undefined) {
          next[unlockedIndices[i]] = { ...next[unlockedIndices[i]], hex: col }
        }
      })

      const lockedIdx = next.findIndex(c => c.locked)
      if (lockedIdx >= 0) {
        const secondaryIdx = next.findIndex(c => !c.locked && c.role === 'secondary')
        if (secondaryIdx >= 0) {
          const [h] = ColorUtils.hexToHsl(base)
          next[secondaryIdx] = {
            ...next[secondaryIdx],
            hex: ColorUtils.hslToHex((h + 30) % 360, 60, 55),
          }
        }
      }

      return next
    })
  }, [activeColor, selectedAlgorithm])

  /* ========== 单颜色更新 ========== */
  const updateColorValue = useCallback(
    (id: string, value: string, mode: ColorMode) => {
      setColors(prev =>
        prev.map(c => {
          if (c.id !== id) return c
          let hex = c.hex
          if (mode === 'hex' && ColorUtils.isValidHex(value)) {
            hex = value.toUpperCase()
          } else if (mode === 'rgb') {
            const parts = value.split(',').map(n => parseInt(n.trim(), 10))
            if (parts.length === 3 && parts.every(n => !isNaN(n) && n >= 0 && n <= 255)) {
              hex = ColorUtils.rgbToHex(parts[0], parts[1], parts[2])
            }
          } else if (mode === 'hsl') {
            const parts = value.split(',').map(n => parseFloat(n.trim()))
            if (parts.length === 3 && parts.every(n => !isNaN(n))) {
              hex = ColorUtils.hslToHex(parts[0], parts[1], parts[2])
            }
          }
          return { ...c, hex }
        }),
      )
    },
    [],
  )

  const toggleLock = useCallback((id: string) => {
    setColors(prev => prev.map(c => (c.id === id ? { ...c, locked: !c.locked } : c)))
  }, [])

  /* ========== WCAG 检查 ========== */
  const contrastResults = useMemo(() => {
    const bg = colors.find(c => c.role === 'background')?.hex || '#1A1A2E'
    const text = colors.find(c => c.role === 'text')?.hex || '#F5F5F7'
    const primary = colors.find(c => c.role === 'primary')?.hex || '#7C6CF0'
    const surface = colors.find(c => c.role === 'surface')?.hex || '#252538'

    return {
      textOnBg: getWcagContrast(text, bg),
      textOnSurface: getWcagContrast(text, surface),
      primaryOnBg: getWcagContrast(primary, bg),
      textOnPrimary: getWcagContrast(text, primary),
    }
  }, [colors])

  /* ========== Canvas 实时预览 ========== */
  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const bg = colors.find(c => c.role === 'background')?.hex || '#1A1A2E'
    const surface = colors.find(c => c.role === 'surface')?.hex || '#252538'
    const primary = colors.find(c => c.role === 'primary')?.hex || '#7C6CF0'
    const textColor = colors.find(c => c.role === 'text')?.hex || '#F5F5F7'
    const accent = colors.find(c => c.role === 'accent')?.hex || '#06B6D4'
    const success = colors.find(c => c.role === 'success')?.hex || '#10B981'
    const warning = colors.find(c => c.role === 'warning')?.hex || '#F59E0B'
    const error = colors.find(c => c.role === 'error')?.hex || '#EF4444'
    const info = colors.find(c => c.role === 'info')?.hex || '#3B82F6'

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    const gradient = ctx.createLinearGradient(0, 0, w, h)
    gradient.addColorStop(0, `${primary}40`)
    gradient.addColorStop(1, `${accent}40`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    const cardX = 20, cardY = 20, cardW = w - 40, cardH = 90
    ctx.fillStyle = surface
    ctx.beginPath()
    roundRect(ctx, cardX, cardY, cardW, cardH, 12)
    ctx.fill()

    ctx.fillStyle = textColor
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText('WebLinuxOS 主题预览', cardX + 16, cardY + 28)

    ctx.font = '12px sans-serif'
    ctx.fillStyle = `${textColor}CC`
    ctx.fillText(`主色 ${primary}`, cardX + 16, cardY + 50)
    ctx.fillText(`背景 ${bg}`, cardX + 16, cardY + 68)

    const btnY = cardY + 60
    const btnColors: Array<{ c: string; label: string }> = [
      { c: primary, label: '主按钮' },
      { c: success, label: '成功' },
      { c: warning, label: '警告' },
      { c: error, label: '错误' },
      { c: info, label: '信息' },
    ]
    let btnX = cardX + 16
    const btnW = 64, btnH = 28, gap = 6
    btnColors.forEach(btn => {
      ctx.fillStyle = btn.c
      ctx.beginPath()
      roundRect(ctx, btnX, btnY, btnW, btnH, 6)
      ctx.fill()
      const contrastColor = ColorUtils.getContrastColor(btn.c)
      ctx.fillStyle = contrastColor
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(btn.label, btnX + btnW / 2, btnY + 18)
      ctx.textAlign = 'start'
      btnX += btnW + gap
    })

    const previewY = cardY + cardH + 16
    const itemH = 48, itemGap = 8
    const items = [
      { label: '导航栏', color: surface, text: textColor },
      { label: '卡片', color: ColorUtils.mixColors(primary, surface, 0.15), text: textColor },
      { label: '按钮', color: primary, text: ColorUtils.getContrastColor(primary) },
    ]

    items.forEach((item, i) => {
      const y = previewY + i * (itemH + itemGap)
      ctx.fillStyle = item.color
      ctx.beginPath()
      roundRect(ctx, cardX, y, cardW, itemH, 10)
      ctx.fill()
      ctx.fillStyle = item.text
      ctx.font = 'bold 13px sans-serif'
      ctx.fillText(item.label, cardX + 14, y + 20)
      ctx.font = '11px sans-serif'
      ctx.fillStyle = `${item.text}99`
      ctx.fillText(`这是一个 ${item.label} 示例组件`, cardX + 14, y + 36)
    })

    const swatchY = previewY + items.length * (itemH + itemGap) + 8
    const swatchSize = 36, swatchGap = 8
    const allColors = colors.map(c => c.hex)
    allColors.forEach((col, i) => {
      const x = cardX + i * (swatchSize + swatchGap)
      const y = swatchY
      ctx.fillStyle = col
      ctx.beginPath()
      roundRect(ctx, x, y, swatchSize, swatchSize, 6)
      ctx.fill()
      ctx.fillStyle = ColorUtils.getContrastColor(col)
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(col, x + swatchSize / 2, y + swatchSize / 2 + 3)
      ctx.textAlign = 'start'
    })
  }, [colors])

  useEffect(() => {
    renderPreview()
  }, [renderPreview])

  /* ========== 应用主题到系统 ========== */
  const applyToSystem = useCallback(() => {
    const primary = colors.find(c => c.role === 'primary')?.hex || '#7C6CF0'
    const existingPreset = accentPresets.find(p => p.color === primary || p.colorLight === primary)

    if (existingPreset) {
      setAccentColor(existingPreset.id)
    } else {
      const [r, g, b] = ColorUtils.hexToRgb(primary)
      void r; void g; void b
      const root = document.documentElement
      root.style.setProperty('--accent', primary)
      root.style.setProperty('--color-primary', primary)
      const gradient = `linear-gradient(135deg, ${primary} 0%, ${ColorUtils.getComplementary(primary)} 100%)`
      root.style.setProperty('--accent-gradient', gradient)
      root.style.setProperty('--accent-gradient-bicolor', gradient)
      root.style.setProperty('--accent-bg', `${primary}20`)
      root.style.setProperty('--accent-subtle', `${primary}10`)
      root.style.setProperty('--accent-glow', `0 0 25px ${primary}66`)
      root.style.setProperty('--accent-glow-color', `${primary}66`)
      root.style.setProperty('--gradient-primary', gradient)

      const bg = colors.find(c => c.role === 'background')?.hex
      const text = colors.find(c => c.role === 'text')?.hex
      if (bg) root.style.setProperty('--bg-primary', bg)
      if (text) root.style.setProperty('--text-primary', text)
    }

    addNotification({
      title: '主题已应用',
      message: '新配色方案已成功应用到 WebLinuxOS 系统',
      type: 'success',
    })
  }, [colors, setAccentColor, addNotification, accentPresets])

  /* ========== 保存主题 ========== */
  const saveTheme = useCallback(() => {
    if (!newThemeName.trim()) {
      addNotification({ title: '请输入名称', message: '请为主题命名后再保存', type: 'warning' })
      return
    }
    const now = new Date().toISOString()
    const theme: SavedTheme = {
      id: generateId(),
      name: newThemeName.trim(),
      colors,
      createdAt: now,
      updatedAt: now,
      category: aiPrompt.keyword ? 'ai' : 'manual',
      keyword: aiPrompt.keyword || undefined,
    }
    persistThemes([...themes, theme])
    setNewThemeName('')
    addNotification({ title: '主题已保存', message: `"${theme.name}" 已保存`, type: 'success' })
  }, [colors, newThemeName, themes, persistThemes, addNotification, aiPrompt])

  const deleteTheme = useCallback(
    (id: string) => {
      persistThemes(themes.filter(t => t.id !== id))
    },
    [themes, persistThemes],
  )

  const loadTheme = useCallback((theme: SavedTheme) => {
    setColors(theme.colors)
    setActiveColorId(theme.colors[0]?.id || 'c1')
    setAiPrompt(prev => ({ ...prev, keyword: theme.keyword || '' }))
  }, [])

  /* ========== 导出 CSS ========== */
  const handleExportCss = useCallback(() => {
    const css = exportToCss(colors, previewTheme)
    setCssOutput(css)
    setCopied('css')
    setTimeout(() => setCopied(null), 2000)
  }, [colors, previewTheme])

  const copyToClipboard = useCallback(
    (text: string, label: string) => {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(label)
        setTimeout(() => setCopied(null), 2000)
      })
    },
    [],
  )

  /* ========== 渲染 UI ========== */
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '20px',
        color: 'var(--text-primary)',
        overflow: 'hidden',
        gap: '16px',
      }}
    >
      {/* 头部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Palette size={22} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px' }}>智能主题生成器</h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
              AI 驱动的配色方案设计工作台
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowPreview(p => !p)}
            style={iconBtnStyle(showPreview)}
            title={showPreview ? '隐藏预览' : '显示预览'}
          >
            {showPreview ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button
            onClick={applyToSystem}
            style={{
              ...iconBtnStyle(true),
              background: 'var(--accent-gradient)',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              gap: 6,
            }}
            title="应用到系统"
          >
            <Sparkles size={16} />
            应用主题
          </button>
        </div>
      </div>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--glass-border)' }}>
        {(
          [
            { id: 'ai', label: 'AI 生成', icon: Wand2 },
            { id: 'manual', label: '手动编辑', icon: Sliders },
            { id: 'harmony', label: '和谐度', icon: Contrast },
            { id: 'manage', label: '主题库', icon: Save },
          ] as const
        ).map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: activeTab === tab.id ? 'var(--accent-bg)' : 'transparent',
                border: activeTab === tab.id ? '1px solid var(--accent)' : '1px solid transparent',
                borderRadius: '8px 8px 0 0',
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 主体内容区 */}
      <div style={{ flex: 1, display: 'flex', gap: '16px', overflow: 'hidden' }}>
        {/* 左侧编辑面板 */}
        <div
          style={{
            flex: 1,
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '20px',
            overflowY: 'auto',
            backdropFilter: 'blur(20px)',
          }}
        >
          {activeTab === 'ai' && (
            <AIPanel
              prompt={aiPrompt}
              setPrompt={setAiPrompt}
              onGenerate={generateByKeyword}
              isGenerating={isGenerating}
              onCopy={copyToClipboard}
            />
          )}
          {activeTab === 'manual' && (
            <ManualPanel
              colors={colors}
              activeColorId={activeColorId}
              setActiveColorId={setActiveColorId}
              editingMode={editingMode}
              setEditingMode={setEditingMode}
              onUpdateColor={updateColorValue}
              onToggleLock={toggleLock}
              onCopy={copyToClipboard}
            />
          )}
          {activeTab === 'harmony' && (
            <HarmonyPanel
              colors={colors}
              activeColorId={activeColorId}
              setActiveColorId={setActiveColorId}
              algorithm={selectedAlgorithm}
              setAlgorithm={setSelectedAlgorithm}
              onGenerate={generateHarmony}
              contrastResults={contrastResults}
            />
          )}
          {activeTab === 'manage' && (
            <ManagePanel
              themes={themes}
              newThemeName={newThemeName}
              setNewThemeName={setNewThemeName}
              onSave={saveTheme}
              onLoad={loadTheme}
              onDelete={deleteTheme}
              onCopy={copyToClipboard}
            />
          )}
        </div>

        {/* 右侧预览区 */}
        {showPreview && (
          <div
            style={{
              width: '340px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* 主题切换 */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                padding: '4px',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '10px',
              }}
            >
              {(
                [
                  { id: 'dark', icon: Moon, label: '深色' },
                  { id: 'light', icon: Sun, label: '浅色' },
                ] as const
              ).map(item => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setPreviewTheme(item.id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: previewTheme === item.id ? 'var(--accent-gradient)' : 'transparent',
                      border: 'none',
                      borderRadius: '7px',
                      color: previewTheme === item.id ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: previewTheme === item.id ? 600 : 400,
                    }}
                  >
                    <Icon size={14} />
                    {item.label}
                  </button>
                )
              })}
            </div>

            {/* Canvas 预览 */}
            <div
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '12px',
              }}
            >
              <canvas
                ref={canvasRef}
                width={316}
                height={340}
                style={{ width: '100%', borderRadius: '10px', display: 'block' }}
              />
            </div>

            {/* 对比度检查结果 */}
            <div
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '14px',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Contrast size={12} />
                WCAG 对比度检查
              </div>
              <ContrastRow label="文本 / 背景" result={contrastResults.textOnBg} />
              <ContrastRow label="文本 / 表面" result={contrastResults.textOnSurface} />
              <ContrastRow label="主色 / 背景" result={contrastResults.primaryOnBg} />
              <ContrastRow label="文本 / 主色" result={contrastResults.textOnPrimary} />
            </div>

            {/* CSS 导出 */}
            <div
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '14px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>CSS 变量导出</span>
                <button
                  onClick={handleExportCss}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--accent-bg)',
                    border: '1px solid var(--accent)',
                    borderRadius: '6px',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Download size={12} />
                  生成
                </button>
              </div>
              {cssOutput ? (
                <>
                  <pre
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      overflow: 'auto',
                      color: '#9CDCFE',
                      margin: 0,
                    }}
                  >
                    {cssOutput}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(cssOutput, 'css-code')}
                    style={{
                      marginTop: 8,
                      padding: '6px',
                      background: copied === 'css-code' ? 'var(--success-bg)' : 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '6px',
                      color: copied === 'css-code' ? 'var(--success)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    {copied === 'css-code' ? <Check size={12} /> : <Copy size={12} />}
                    {copied === 'css-code' ? '已复制' : '复制 CSS'}
                  </button>
                </>
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    border: '1px dashed var(--glass-border)',
                    borderRadius: '8px',
                  }}
                >
                  点击"生成"导出 CSS 变量
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

/* ========== 子组件 ========== */

interface AIPanelProps {
  prompt: AIPrompt
  setPrompt: (p: AIPrompt) => void
  onGenerate: () => void
  isGenerating: boolean
  onCopy: (text: string, label: string) => void
}

const AIPanel = memo(function AIPanel({ prompt, setPrompt, onGenerate, isGenerating }: AIPanelProps) {
  const quickKeywords = ['ocean', 'sunset', 'forest', 'fire', 'sky', 'lavender', 'mint', 'corporate', 'neon', 'pastel']
  const quickMoods = ['energetic', 'calm', 'professional', 'creative', 'elegant', 'playful']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={labelStyle}>
          <Wand2 size={14} />
          关键词
        </label>
        <input
          type="text"
          value={prompt.keyword}
          onChange={e => setPrompt({ ...prompt, keyword: e.target.value })}
          placeholder="例如：ocean、sunset、forest..."
          style={inputStyle}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
          {quickKeywords.map(k => (
            <button
              key={k}
              onClick={() => setPrompt({ ...prompt, keyword: k })}
              style={chipStyle(prompt.keyword === k)}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>
          <Sparkles size={14} />
          情绪 / 氛围
        </label>
        <input
          type="text"
          value={prompt.mood}
          onChange={e => setPrompt({ ...prompt, mood: e.target.value })}
          placeholder="例如：calm、energetic、professional..."
          style={inputStyle}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
          {quickMoods.map(m => (
            <button
              key={m}
              onClick={() => setPrompt({ ...prompt, mood: m })}
              style={chipStyle(prompt.mood === m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>
          <Sliders size={14} />
          创造性 (温度): {Math.round(prompt.temperature * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={prompt.temperature * 100}
          onChange={e => setPrompt({ ...prompt, temperature: Number(e.target.value) / 100 })}
          style={{ width: '100%', accentColor: 'var(--accent)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginTop: 4 }}>
          <span>保守</span>
          <span>创意</span>
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating}
        style={{
          padding: '14px',
          background: isGenerating ? 'var(--glass-border)' : 'var(--accent-gradient)',
          border: 'none',
          borderRadius: '12px',
          color: 'white',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          fontSize: '15px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseOver={e => {
          if (!isGenerating) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = 'var(--accent-glow)'
          }
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {isGenerating ? (
          <>
            <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
            生成中...
          </>
        ) : (
          <>
            <Wand2 size={18} />
            AI 生成配色
          </>
        )}
      </button>

      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        💡 提示：尝试输入自然元素（ocean、forest、sunset）或情绪（calm、energetic）来获得不同风格的配色方案。
      </div>
    </div>
  )
})

/* ---------- 手动编辑面板 ---------- */

interface ManualPanelProps {
  colors: ThemeColor[]
  activeColorId: string
  setActiveColorId: (id: string) => void
  editingMode: ColorMode
  setEditingMode: (mode: ColorMode) => void
  onUpdateColor: (id: string, value: string, mode: ColorMode) => void
  onToggleLock: (id: string) => void
  onCopy: (text: string, label: string) => void
}

const ManualPanel = memo(function ManualPanel({
  colors, activeColorId, setActiveColorId,
  editingMode, setEditingMode, onUpdateColor, onToggleLock, onCopy,
}: ManualPanelProps) {
  const activeColor = colors.find(c => c.id === activeColorId) || colors[0]
  
  if (!activeColor) return null
  
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {colors.map((color) => (
          <button
            key={color.id}
            onClick={() => setActiveColorId(color.id)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: color.hex,
              border: activeColorId === color.id ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s',
            }}
            title={color.name}
          >
            {color.locked && (
              <span style={{ position: 'absolute', top: 2, right: 2, fontSize: 10 }}>🔒</span>
            )}
          </button>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        {(['hex', 'rgb', 'hsl'] as ColorMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setEditingMode(mode)}
            style={{
              padding: '6px 12px',
              background: editingMode === mode ? 'var(--accent-bg)' : 'rgba(255,255,255,0.05)',
              border: editingMode === mode ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
              borderRadius: 8,
              color: editingMode === mode ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: editingMode === mode ? 600 : 400,
            }}
          >
            {mode.toUpperCase()}
          </button>
        ))}
      </div>
      
      <ColorSliders
        hex={activeColor.hex}
        onChange={(hex) => onUpdateColor(activeColor.id, hex, 'hex')}
      />
      
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          onClick={() => onToggleLock(activeColor.id)}
          style={{
            padding: '8px 16px',
            background: activeColor.locked ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)',
            border: '1px solid var(--glass-border)',
            borderRadius: 8,
            color: activeColor.locked ? '#fbbf24' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          {activeColor.locked ? '🔒 已锁定' : '🔓 锁定'}
        </button>
        <button
          onClick={() => onCopy(activeColor.hex, `${activeColor.name} HEX`)}
          style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--glass-border)',
            borderRadius: 8,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          📋 复制 HEX
        </button>
      </div>
    </div>
  )
})

/* ---------- 色彩调节滑块 ---------- */

interface ColorSlidersProps {
  hex: string
  onChange: (hex: string) => void
}

const ColorSliders = memo(function ColorSliders({ hex, onChange }: ColorSlidersProps) {
  const [h, s, l] = ColorUtils.hexToHsl(hex)

  const handleChange = (type: 'h' | 's' | 'l', value: number) => {
    let newH = h, newS = s, newL = l
    if (type === 'h') newH = value
    else if (type === 's') newS = value
    else newL = value
    onChange(ColorUtils.hslToHex(newH, newS, newL))
  }

  const sliderStyle = (trackColor: string): React.CSSProperties => ({
    width: '100%',
    height: 8,
    WebkitAppearance: 'none',
    background: trackColor,
    borderRadius: 4,
    outline: 'none',
    cursor: 'pointer',
  })

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <SliderRow
        label="色相 H"
        value={h}
        min={0}
        max={360}
        onChange={v => handleChange('h', v)}
        trackStyle={sliderStyle(`linear-gradient(to right,
          #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)`)}
        displayValue={`${h}°`}
      />
      <SliderRow
        label="饱和度 S"
        value={s}
        min={0}
        max={100}
        onChange={v => handleChange('s', v)}
        trackStyle={sliderStyle(`linear-gradient(to right, ${ColorUtils.hslToHex(h, 0, l)}, ${ColorUtils.hslToHex(h, 100, l)})`)}
        displayValue={`${s}%`}
      />
      <SliderRow
        label="亮度 L"
        value={l}
        min={0}
        max={100}
        onChange={v => handleChange('l', v)}
        trackStyle={sliderStyle(`linear-gradient(to right, #000000, ${ColorUtils.hslToHex(h, s, 50)}, #FFFFFF)`)}
        displayValue={`${l}%`}
      />
    </div>
  )
})

/* ---------- 滑块行 ---------- */

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  trackStyle: React.CSSProperties
  displayValue: string
}

const SliderRow = memo(function SliderRow({
  label,
  value,
  min,
  max,
  onChange,
  trackStyle,
  displayValue,
}: SliderRowProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={trackStyle}
      />
    </div>
  )
})

/* ---------- 和谐度面板 ---------- */

interface HarmonyPanelProps {
  colors: ThemeColor[]
  activeColorId: string
  setActiveColorId: (id: string) => void
  algorithm: HarmonyAlgorithm
  setAlgorithm: (algo: HarmonyAlgorithm) => void
  onGenerate: () => void
  contrastResults: {
    textOnBg: ContrastResult
    textOnSurface: ContrastResult
    primaryOnBg: ContrastResult
    textOnPrimary: ContrastResult
  }
}

const HARMONY_ALGORITHMS: { id: HarmonyAlgorithm; name: string; desc: string }[] = [
  { id: 'monochromatic', name: '单色', desc: '同一色相的不同明度' },
  { id: 'complementary', name: '互补', desc: '色轮对面的颜色' },
  { id: 'splitComplementary', name: '分裂互补', desc: '基色两侧的互补色' },
  { id: 'triadic', name: '三角色', desc: '等边三角形分布' },
  { id: 'tetradic', name: '四角色', desc: '正方形分布' },
]

const HarmonyPanel = memo(function HarmonyPanel({
  colors,
  activeColorId,
  setActiveColorId,
  algorithm,
  setAlgorithm,
  onGenerate,
  contrastResults,
}: HarmonyPanelProps) {
  const active = colors.find(c => c.id === activeColorId) || colors[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={labelStyle}>基础色</label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {colors.slice(0, 5).map(color => (
            <button
              key={color.id}
              onClick={() => setActiveColorId(color.id)}
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: color.hex,
                border: activeColorId === color.id ? '3px solid var(--accent)' : '2px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>和谐算法</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {HARMONY_ALGORITHMS.map(algo => (
            <button
              key={algo.id}
              onClick={() => setAlgorithm(algo.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                background: algorithm === algo.id ? 'var(--accent-bg)' : 'rgba(255,255,255,0.03)',
                border: algorithm === algo.id ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                borderRadius: '10px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: active.hex,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{algo.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{algo.desc}</div>
              </div>
              {algorithm === algo.id && <Check size={16} style={{ color: 'var(--accent)' }} />}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onGenerate}
        style={{
          padding: '14px',
          background: 'var(--accent-gradient)',
          border: 'none',
          borderRadius: '12px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <RefreshCw size={18} />
        应用和谐算法
      </button>

      {/* WCAG 提示 */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          padding: '14px',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: 10 }}>WCAG 状态总览</div>
        <ContrastRowCompact label="文本 / 背景" result={contrastResults.textOnBg} />
        <ContrastRowCompact label="文本 / 表面" result={contrastResults.textOnSurface} />
        <ContrastRowCompact label="主色 / 背景" result={contrastResults.primaryOnBg} />
        <ContrastRowCompact label="文本 / 主色" result={contrastResults.textOnPrimary} />
      </div>
    </div>
  )
})

/* ---------- 主题管理面板 ---------- */

interface ManagePanelProps {
  themes: SavedTheme[]
  newThemeName: string
  setNewThemeName: (n: string) => void
  onSave: () => void
  onLoad: (theme: SavedTheme) => void
  onDelete: (id: string) => void
  onCopy: (text: string, label: string) => void
}

const ManagePanel = memo(function ManagePanel({
  themes,
  newThemeName,
  setNewThemeName,
  onSave,
  onLoad,
  onDelete,
  onCopy,
}: ManagePanelProps) {
  void onCopy
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          value={newThemeName}
          onChange={e => setNewThemeName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSave()}
          placeholder="输入主题名称..."
          style={inputStyle}
        />
        <button
          onClick={onSave}
          style={{
            padding: '0 16px',
            background: 'var(--accent-gradient)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <Save size={14} />
          保存
        </button>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
        已保存 {themes.length} 个主题
      </div>

      {themes.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '10px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            border: '1px dashed var(--glass-border)',
            borderRadius: '12px',
            padding: '40px 20px',
          }}
        >
          <Save size={32} />
          <div>暂无保存的主题</div>
          <div style={{ fontSize: '11px' }}>设计好配色后点击保存</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
          {themes.map(theme => (
            <div
              key={theme.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{theme.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {new Date(theme.createdAt).toLocaleDateString()}
                    {theme.keyword && ` · ${theme.keyword}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => onLoad(theme)}
                    style={{
                      padding: '6px 12px',
                      background: 'var(--accent-bg)',
                      border: '1px solid var(--accent)',
                      borderRadius: '6px',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    加载
                  </button>
                  <button
                    onClick={() => onDelete(theme.id)}
                    style={{
                      padding: '6px',
                      background: 'transparent',
                      border: '1px solid var(--error)',
                      borderRadius: '6px',
                      color: 'var(--error)',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', height: 32, borderRadius: '6px', overflow: 'hidden' }}>
                {theme.colors.slice(0, 8).map((c, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: c.hex,
                      position: 'relative',
                    }}
                    title={`${c.name}: ${c.hex}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

/* ---------- 对比度行（详细版） ---------- */

function ContrastRow({ label, result }: { label: string; result: ContrastResult }) {
  const passAA = result.aa
  const passAAA = result.aaa

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 0',
        borderBottom: '1px solid var(--glass-border)',
        fontSize: '11px',
      }}
    >
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{result.ratio.toFixed(2)}:1</span>
        <span
          style={{
            padding: '2px 6px',
            borderRadius: '4px',
            background: passAA ? 'var(--success-bg)' : 'var(--error-bg)',
            color: passAA ? 'var(--success)' : 'var(--error)',
            fontSize: '10px',
            fontWeight: 600,
          }}
        >
          AA
        </span>
        <span
          style={{
            padding: '2px 6px',
            borderRadius: '4px',
            background: passAAA ? 'var(--success-bg)' : 'var(--error-bg)',
            color: passAAA ? 'var(--success)' : 'var(--error)',
            fontSize: '10px',
            fontWeight: 600,
          }}
        >
          AAA
        </span>
      </div>
    </div>
  )
}

/* ---------- 对比度行（紧凑版） ---------- */

function ContrastRowCompact({ label, result }: { label: string; result: ContrastResult }) {
  const pass = result.aa
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '3px 0',
        fontSize: '11px',
      }}
    >
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontFamily: 'monospace' }}>{result.ratio.toFixed(2)}:1</span>
        <span style={{ color: pass ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
          {pass ? '✓ AA' : '✗ AA'}
        </span>
      </div>
    </div>
  )
}

/* ========== 样式辅助函数 ========== */

function iconBtnStyle(active: boolean): React.CSSProperties {
  return {
    width: 32,
    height: 32,
    padding: 0,
    background: active ? 'var(--accent-bg)' : 'var(--glass-bg)',
    border: active ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
    borderRadius: '8px',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  }
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  color: 'var(--text-secondary)',
  marginBottom: '8px',
  fontWeight: 500,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--glass-border)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  outline: 'none',
  fontSize: '13px',
  transition: 'border-color 0.2s',
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 12px',
    background: active ? 'var(--accent-bg)' : 'rgba(255,255,255,0.05)',
    border: active ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
    borderRadius: '8px',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: active ? 600 : 400,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s',
  }
}

/* ========== Canvas 辅助函数 ========== */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export default SmartThemeGenerator