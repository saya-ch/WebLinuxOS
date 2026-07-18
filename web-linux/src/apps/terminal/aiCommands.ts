/**
 * AI 终端命令 — 基于真实 Pollinations.ai API
 *
 * 提供命令:
 *  - ai <prompt>          单轮提问
 *  - ai-chat              进入交互式对话（exit 退出）
 *  - ai-image <prompt>    生成图片并返回 URL
 *  - ai-models            列出可用模型
 *  - ai-translate <text>  翻译文本（自动检测源语言，目标中文）
 *  - ai-explain <text>    用简单语言解释任何概念
 *  - ai-code <描述>        让 AI 生成代码
 */

import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import {
  chat,
  complete,
  generateImage,
  AVAILABLE_TEXT_MODELS,
  DEFAULT_SYSTEM_PROMPT,
  type AIMessage,
} from '../../services/aiService'

const HISTORY_KEY = 'weblinux-terminal-ai-history'

interface HistoryItem {
  role: 'user' | 'assistant'
  content: string
}

function loadHistory(): HistoryItem[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data.slice(-10) : []
  } catch {
    return []
  }
}

function saveHistory(history: HistoryItem[]) {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-10)))
  } catch {
    /* ignore */
  }
}

function clearHistory() {
  try {
    sessionStorage.removeItem(HISTORY_KEY)
  } catch {
    /* ignore */
  }
}

const BANNER = `
╔══════════════════════════════════════════════════╗
║   Nexus AI · 真实联网大模型 (Pollinations.ai)    ║
║                                                  ║
║   • GPT-4o / DeepSeek / Llama / Mistral          ║
║   • 完全免费、无需 API Key                        ║
║   • 输入 exit 退出 · clear 清空上下文            ║
║   • /image <描述> 生成图片                       ║
║   • /model <名称> 切换模型                       ║
╚══════════════════════════════════════════════════╝
`.trim()

// ai <prompt> — 单轮提问，自动包含历史
registerCommand('ai', {
  description: '向真实 AI 大模型提问（基于 Pollinations.ai 免费服务）',
  usage: 'ai <你的问题>',
  examples: ['ai 解释闭包是什么', 'ai 帮我写一个快速排序', 'ai 翻译 hello world 成中文'],
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    if (!args.length) {
      return {
        output: [
          '用法: ai <你的问题>',
          '',
          '示例:',
          '  ai 解释什么是 React Hooks',
          '  ai 用 Python 写一个斐波那契数列',
          '  ai 翻译 "good morning" 成中文',
          '',
          '其他 AI 命令:',
          '  ai-chat         进入交互式对话',
          '  ai-image <描述>  生成图片',
          '  ai-models       列出可用模型',
          '  ai-translate    翻译文本',
          '  ai-explain      解释概念',
          '  ai-code         生成代码',
        ].join('\n'),
      }
    }

    const prompt = args.join(' ')
    const history = loadHistory()
    const messages: AIMessage[] = [
      { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: prompt },
    ]

    try {
      const response = await chat(messages, { temperature: 0.7 })
      // 保存上下文
      saveHistory([
        ...history,
        { role: 'user', content: prompt },
        { role: 'assistant', content: response },
      ])
      return { output: `\n${response}\n` }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return {
        output: [
          '✗ AI 调用失败',
          `  错误: ${msg}`,
          '',
          '提示:',
          '  • 检查网络连接',
          '  • 使用 ai-models 查看可用模型',
          '  • 使用 clear 命令清空 AI 上下文后重试',
        ].join('\n'),
      }
    }
  },
})

// ai-chat — 交互式对话模式（通过提示用户连续输入）
registerCommand('ai-chat', {
  description: '进入 AI 交互对话模式（多轮上下文）',
  usage: 'ai-chat',
  handler: async (): Promise<CommandResult> => {
    // 由于终端命令是单次执行模型，此处给出说明并触发单轮交互
    // 用户可通过连续调用 ai 命令实现多轮对话（自动保留上下文）
    const history = loadHistory()
    return {
      output: [
        BANNER,
        '',
        `当前上下文: ${history.length} 条消息`,
        '',
        '提示:',
        '  • 直接使用 ai <问题> 提问，AI 会自动保留上下文',
        '  • 使用 clear-ai 清空上下文',
        '  • 使用 ai-image <描述> 生成图片',
        '  • 使用 ai-models 查看可用模型',
        '',
        '示例:',
        '  ai 我在学 React，请给我一个学习路线',
        '  ai 接着上一条，给我第一周的详细计划',
      ].join('\n'),
    }
  },
})

// ai-image <prompt> — 生成图像，返回 URL
registerCommand('ai-image', {
  description: '使用 AI 生成图像（FLUX.1 模型）',
  usage: 'ai-image <图片描述>',
  examples: ['ai-image 赛博朋克城市夜景', 'ai-image 一只戴着 VR 眼镜的猫'],
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    if (!args.length) {
      return { output: '用法: ai-image <图片描述>' }
    }
    const prompt = args.join(' ')
    const url = generateImage(prompt, { width: 1024, height: 1024 })
    return {
      output: [
        '🎨 AI 图像已生成',
        '',
        `提示词: ${prompt}`,
        `模型: FLUX.1 · 1024×1024`,
        '',
        '图片链接（在浏览器中打开）:',
        url,
        '',
        '提示: 复制链接到浏览器地址栏即可查看生成的图片',
      ].join('\n'),
    }
  },
})

// ai-models — 列出可用模型
registerCommand('ai-models', {
  description: '列出所有可用的 AI 模型',
  usage: 'ai-models',
  handler: async (): Promise<CommandResult> => {
    const lines = ['可用 AI 模型 (Pollinations.ai)', '']
    for (const m of AVAILABLE_TEXT_MODELS) {
      const tags = [
        m.vision ? '视觉' : '',
        m.reasoning ? '推理' : '',
      ].filter(Boolean).join('/')
      const tagStr = tags ? ` [${tags}]` : ''
      lines.push(`  ${m.name.padEnd(18)}${tagStr}`)
      if (m.description) {
        lines.push(`    ${m.description}`)
      }
    }
    lines.push('')
    lines.push('切换默认模型（在 NexusAI 应用中）或通过 ai --model=<名称> <问题>')
    return { output: lines.join('\n') }
  },
})

// ai-translate — 翻译文本
registerCommand('ai-translate', {
  description: 'AI 翻译文本（自动检测源语言，目标中文）',
  usage: 'ai-translate <文本>',
  examples: ['ai-translate Hello, how are you?'],
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    if (!args.length) return { output: '用法: ai-translate <文本>' }
    const text = args.join(' ')
    try {
      const response = await complete(
        `Translate the following text to Chinese. Only output the translation, no explanations.\n\nText: ${text}`,
        { temperature: 0.3 },
      )
      return { output: `\n原文: ${text}\n译文: ${response.trim()}\n` }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { output: `✗ 翻译失败: ${msg}` }
    }
  },
})

// ai-explain — 解释概念
registerCommand('ai-explain', {
  description: '用简单语言解释任何概念',
  usage: 'ai-explain <概念>',
  examples: ['ai-explain 量子纠缠', 'ai-explain 什么是 Docker'],
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    if (!args.length) return { output: '用法: ai-explain <概念>' }
    const concept = args.join(' ')
    try {
      const response = await chat(
        [
          { role: 'system', content: '你是一位耐心的老师，擅长用简单、形象、易懂的语言解释复杂概念。回答控制在 300 字以内，可以使用类比。' },
          { role: 'user', content: `请解释：${concept}` },
        ],
        { temperature: 0.5 },
      )
      return { output: `\n${response}\n` }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { output: `✗ 解释失败: ${msg}` }
    }
  },
})

// ai-code — 生成代码
registerCommand('ai-code', {
  description: '让 AI 生成代码',
  usage: 'ai-code <需求描述>',
  examples: ['ai-code 用 Python 写一个网页爬虫', 'ai-code 用 React 写一个 TodoList'],
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    if (!args.length) return { output: '用法: ai-code <需求描述>' }
    const requirement = args.join(' ')
    try {
      const response = await chat(
        [
          { role: 'system', content: '你是一位资深工程师。请直接给出代码，使用代码块格式，并标注语言。如有必要，附上简短说明。不要冗长解释。' },
          { role: 'user', content: requirement },
        ],
        { temperature: 0.2 },
      )
      return { output: `\n${response}\n` }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { output: `✗ 代码生成失败: ${msg}` }
    }
  },
})

// clear-ai — 清空 AI 上下文
registerCommand('clear-ai', {
  description: '清空 AI 对话上下文',
  usage: 'clear-ai',
  handler: (): CommandResult => {
    clearHistory()
    return { output: '✓ AI 上下文已清空' }
  },
})
