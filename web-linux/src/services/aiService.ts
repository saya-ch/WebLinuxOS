/**
 * Real AI Service — 基于 Pollinations.ai 的免费 AI 服务
 *
 * Pollinations.ai 提供完全免费、无需 API Key 的 AI 文本与图像生成接口。
 * 该服务对 GitHub Pages 静态部署友好，可直接在浏览器中调用。
 *
 * 文档: https://pollinations.ai
 *
 * 提供的能力:
 *  - chat(messages, options): 多轮对话（OpenAI 风格 messages 数组）
 *  - complete(prompt, options): 单轮文本补全
 *  - streamChat(messages, options): 流式对话（通过回调逐 token 输出）
 *  - generateImage(prompt, options): 文生图（返回 URL）
 *  - models(): 获取可用模型列表
 */

import { API_CONFIG, fetchWithTimeout } from '../config/apiConfig'

export type AIRole = 'system' | 'user' | 'assistant'

export interface AIMessage {
  role: AIRole
  content: string
}

export interface AIChatOptions {
  /** 模型名称，例如 'openai'、'openai-large'、'mistral'、'llama' 等 */
  model?: string
  /** 随机种子，固定种子可获得可复现输出 */
  seed?: number
  /** 采样温度，0-2 之间，越大越发散 */
  temperature?: number
  /** 是否启用推理模式（部分模型支持） */
  reasoning?: boolean
  /** 私有 token（可选，用于 Pollinations 高级用法） */
  token?: string
  /** 请求超时（毫秒），默认 60s */
  timeout?: number
}

export interface AIImageOptions {
  /** 模型：'flux' | 'turbo' */
  model?: string
  /** 图片宽度 */
  width?: number
  /** 图片高度 */
  height?: number
  /** 随机种子 */
  seed?: number
  /** 生成数量（Pollinations 通过 n 控制） */
  n?: number
  /** 是否私有（不在公共画廊显示） */
  private?: boolean
  /** 增强提示词 */
  enhance?: boolean
  /** 透明背景 */
  transparent?: boolean
}

export interface AIModelInfo {
  name: string
  type: string
  description?: string
  vision?: boolean
  reasoning?: boolean
}

/** 可用的文本模型（硬编码常用列表，避免每次都拉远端） */
export const AVAILABLE_TEXT_MODELS: AIModelInfo[] = [
  { name: 'openai', type: 'chat', description: 'GPT-4o mini — 通用对话，速度快、成本低（Pollinations 免费）' },
  { name: 'openai-large', type: 'chat', description: 'GPT-4o — 推理与视觉能力更强', vision: true, reasoning: true },
  { name: 'openai-fast', type: 'chat', description: 'GPT-4o mini 快速通道，最低延迟' },
  { name: 'mistral', type: 'chat', description: 'Mistral Small 3.1 — 开源对话模型' },
  { name: 'llama', type: 'chat', description: 'Llama 4 Scout — Meta 开源大模型' },
  { name: 'deepseek', type: 'chat', description: 'DeepSeek V3 — 中文与代码能力突出', reasoning: true },
  { name: 'qwen-coder', type: 'chat', description: 'Qwen 2.5 Coder — 代码补全与生成' },
  { name: 'searchgpt', type: 'chat', description: 'SearchGPT — 带联网搜索能力的对话模型' },
  { name: 'unity', type: 'chat', description: 'Unity — 中等规模多场景模型' },
]

/** 可用图像模型 */
export const AVAILABLE_IMAGE_MODELS: AIModelInfo[] = [
  { name: 'flux', type: 'image', description: 'FLUX.1 — 高质量文生图模型' },
  { name: 'turbo', type: 'image', description: 'Turbo — 极速生成（牺牲少量质量）' },
]

/**
 * 多轮对话接口（OpenAI 风格 messages 数组）
 * 使用 POST /openai 接口以获得更稳定的输出
 */
export async function chat(
  messages: AIMessage[],
  options: AIChatOptions = {},
): Promise<string> {
  const model = options.model || API_CONFIG.pollinations.defaultModel
  const url = `${API_CONFIG.pollinations.textBaseUrl}/openai`

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    private: true,
  }
  if (options.seed !== undefined) body.seed = options.seed
  if (options.reasoning !== undefined) body.reasoning = options.reasoning
  if (options.token) body.token = options.token

  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    options.timeout ?? 60_000,
  )

  if (!response.ok) {
    throw new Error(`AI 请求失败: HTTP ${response.status} ${response.statusText}`)
  }

  // 兼容 OpenAI 标准响应
  const data = await response.json()
  const content =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    (typeof data === 'string' ? data : '')
  if (!content) {
    throw new Error('AI 返回为空，请稍后重试或更换模型')
  }
  return content
}

/**
 * 单轮文本补全（GET 接口，更简单但只支持单条 prompt）
 */
export async function complete(
  prompt: string,
  options: AIChatOptions = {},
): Promise<string> {
  const model = options.model || API_CONFIG.pollinations.defaultModel
  const url = new URL(`${API_CONFIG.pollinations.textBaseUrl}/${encodeURIComponent(prompt)}`)
  url.searchParams.set('model', model)
  if (options.seed !== undefined) url.searchParams.set('seed', String(options.seed))
  if (options.temperature !== undefined) url.searchParams.set('temperature', String(options.temperature))
  if (options.reasoning !== undefined) url.searchParams.set('reasoning', String(options.reasoning))

  const response = await fetchWithTimeout(url.toString(), {}, options.timeout ?? 60_000)
  if (!response.ok) {
    throw new Error(`AI 请求失败: HTTP ${response.status}`)
  }
  return await response.text()
}

/**
 * 流式对话 — 通过回调逐块返回，便于终端打字机效果或 UI 实时显示
 * 实现：GET 接口配合 ReadableStream 读取
 */
export async function streamChat(
  messages: AIMessage[],
  onChunk: (delta: string) => void,
  options: AIChatOptions = {},
): Promise<string> {
  const model = options.model || API_CONFIG.pollinations.defaultModel
  const url = `${API_CONFIG.pollinations.textBaseUrl}/openai`

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    stream: true,
    private: true,
  }
  if (options.seed !== undefined) body.seed = options.seed
  if (options.reasoning !== undefined) body.reasoning = options.reasoning

  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    options.timeout ?? 120_000,
  )

  if (!response.ok || !response.body) {
    // 回退到非流式调用
    const full = await chat(messages, options)
    onChunk(full)
    return full
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') continue
      try {
        const json = JSON.parse(payload)
        const delta = json?.choices?.[0]?.delta?.content ?? ''
        if (delta) {
          full += delta
          onChunk(delta)
        }
      } catch {
        // 忽略 JSON 解析失败的帧（可能是注释或心跳）
      }
    }
  }
  return full
}

/**
 * 生成图像，返回可直接使用的图片 URL（无需下载）
 * Pollinations 的 GET /image/{prompt} 直接返回 PNG
 */
export function generateImage(prompt: string, options: AIImageOptions = {}): string {
  const model = options.model || API_CONFIG.pollinations.imageModel
  const url = new URL(`${API_CONFIG.pollinations.imageBaseUrl}/prompt/${encodeURIComponent(prompt)}`)
  url.searchParams.set('model', model)
  url.searchParams.set('width', String(options.width ?? 1024))
  url.searchParams.set('height', String(options.height ?? 1024))
  if (options.seed !== undefined) url.searchParams.set('seed', String(options.seed))
  if (options.n !== undefined) url.searchParams.set('n', String(options.n))
  if (options.private) url.searchParams.set('private', 'true')
  if (options.enhance) url.searchParams.set('enhance', 'true')
  if (options.transparent) url.searchParams.set('transparent', 'true')
  // 加时间戳避免缓存导致相同种子返回同一张图（在未指定 seed 时）
  url.searchParams.set('nologo', 'true')
  return url.toString()
}

/**
 * 获取可用模型列表（实时拉取）
 */
export async function listModels(): Promise<AIModelInfo[]> {
  try {
    const response = await fetchWithTimeout(`${API_CONFIG.pollinations.textBaseUrl}/models`, {}, 10_000)
    if (!response.ok) return AVAILABLE_TEXT_MODELS
    const data = await response.json()
    if (Array.isArray(data)) {
      return data.map((m: unknown) => {
        if (typeof m === 'string') return { name: m, type: 'chat' }
        const obj = m as Record<string, unknown>
        return {
          name: String(obj.name ?? obj.id ?? ''),
          type: String(obj.type ?? 'chat'),
          description: obj.description ? String(obj.description) : undefined,
          vision: Boolean(obj.vision),
          reasoning: Boolean(obj.reasoning),
        }
      })
    }
    return AVAILABLE_TEXT_MODELS
  } catch {
    return AVAILABLE_TEXT_MODELS
  }
}

/**
 * 默认系统提示词 — WebLinuxOS 内置 AI 助手人格
 */
export const DEFAULT_SYSTEM_PROMPT = `你是 WebLinuxOS 内置的 AI 助手"Nexus"。
- 你运行在一个完全在浏览器中执行的 Web Linux 桌面环境中
- 回答需简洁、专业、有用；优先给出可执行的解决方案
- 中文问题用中文回答，英文问题用英文回答
- 当用户询问代码时，使用代码块格式，并标注语言
- 当用户询问系统功能时，可结合 WebLinuxOS 的内置应用进行介绍
- 严禁输出有害、不实或违反伦理的内容`
