/**
 * 终端统一 API 服务层
 *
 * 整合所有终端命令中重复使用的 API 调用和工具函数。
 * 所有 fetchWithTimeout / handleApiError 应使用 apiConfig.ts 的全局版本。
 * 本文件提供终端特有的业务函数（天气回退数据、汇率回退数据等）。
 */

// 从全局 apiConfig 导入，避免各命令文件重复定义
export { fetchWithTimeout, handleApiError } from '../../config/apiConfig'

// ============================================================
// 回退数据（Fallback Data）
// ============================================================

export const FALLBACK_WEATHER = {
  temperature: 22,
  apparentTemperature: 21,
  weatherCode: 1,
  weatherDesc: '多云',
  humidity: 55,
  windSpeed: 12,
  precipitation: 0,
  daily: [
    { date: '今天', min: 18, max: 25, weather: '多云' },
    { date: '明天', min: 17, max: 24, weather: '晴' },
    { date: '后天', min: 19, max: 26, weather: '小雨' },
  ],
}

export const FALLBACK_RATES: Record<string, number> = {
  CNY: 7.85, USD: 1.08, GBP: 0.86, JPY: 164.5, CHF: 0.94,
  CAD: 1.47, AUD: 1.65, HKD: 8.42, SGD: 1.44, KRW: 1452.0,
  SEK: 11.2, NOK: 11.5, NZD: 1.78, INR: 91.2, MXN: 18.5,
  BRL: 5.45, ZAR: 19.8, THB: 37.2, TWD: 33.5, PHP: 60.5,
}

export const FALLBACK_NEWS = [
  { title: 'WebLinuxOS 发布新版本', description: '新增多项实用功能和性能优化', source: 'WebLinuxOS' },
  { title: 'AI 技术持续发展', description: '人工智能在各个领域的应用越来越广泛', source: 'Tech News' },
  { title: '前端开发趋势', description: 'React 19 和新特性受到开发者关注', source: 'Dev Weekly' },
  { title: '云计算市场增长', description: '云服务提供商持续扩展服务能力', source: 'Cloud Report' },
  { title: '网络安全重要性', description: '企业加强网络安全防护措施', source: 'Security News' },
]

export const FALLBACK_NPM_PACKAGES = [
  { name: 'react', version: '19.0.0', description: 'React 库' },
  { name: 'vue', version: '3.5.0', description: 'Vue 框架' },
  { name: 'express', version: '4.21.0', description: 'Web 框架' },
  { name: 'typescript', version: '5.7.0', description: 'TypeScript 编译器' },
  { name: 'next', version: '15.0.0', description: 'React 全栈框架' },
  { name: 'vite', version: '6.0.0', description: '前端构建工具' },
  { name: 'tailwindcss', version: '4.0.0', description: 'CSS 框架' },
  { name: 'axios', version: '1.7.0', description: 'HTTP 客户端' },
]

// ============================================================
// 工具函数
// ============================================================

/** 将数字字节转为人类可读字符串 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/** 格式化运行时间 */
export function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const parts: string[] = []
  if (d > 0) parts.push(`${d}天`)
  if (h > 0) parts.push(`${h}小时`)
  if (m > 0) parts.push(`${m}分`)
  parts.push(`${sec}秒`)
  return parts.join(' ')
}

/** HSL 转 Hex */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/** 生成 Pollinations AI 提示词调用 */
export async function pollinationsPrompt(prompt: string, maxTokens = 800): Promise<string> {
  try {
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        prompt,
        max_tokens: maxTokens,
        temperature: 0.85,
      }),
    })
    if (!res.ok) throw new Error('API error')
    return await res.text()
  } catch {
    return ''
  }
}

/** 解析浏览器 UA */
export function parseBrowser(ua: string): string {
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome'
  if (ua.includes('Firefox/')) return 'Firefox'
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari'
  return 'Unknown'
}

/** 解析操作系统 */
export function parseOS(ua: string): string {
  if (ua.includes('Win')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  return 'Unknown'
}
