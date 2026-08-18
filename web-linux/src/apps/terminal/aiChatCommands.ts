/**
 * AI Chat 命令 — 直接调用 Pollinations API
 *
 * 提供命令:
 *  - ai <query>    向 AI 助手提问
 *  - ask <query>   ai 命令的别名
 */

import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { fetchWithTimeout, handleApiError } from './terminalApiService'

const AI_API_URL = 'https://text.pollinations.ai/openai/messages'
const AI_TIMEOUT = 10000

const SYSTEM_PROMPT =
  'You are a helpful Linux terminal assistant. Respond concisely in the same language as the query.'

interface AIChoice {
  message?: {
    content?: string
  }
}

interface AIResponse {
  choices?: AIChoice[]
}

const aiHandler = async (context: CommandContext): Promise<CommandResult> => {
  const { args } = context

  if (!args.length) {
    return {
      output: [
        '🤖 AI 助手',
        '',
        '用法: ai <问题>',
        '      ask <问题>',
        '',
        '示例:',
        '  ai 如何查看系统信息',
        '  ai explain the grep command',
        '  ask what is a kernel',
      ].join('\n'),
    }
  }

  const query = args.join(' ')

  try {
    const response = await fetchWithTimeout(
      AI_API_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: query },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      },
      AI_TIMEOUT,
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data: AIResponse = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('AI 返回了空响应')
    }

    return { output: `\n${content.trim()}\n` }
  } catch (error) {
    const errorOutput = [
      '🤖 AI 助手',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      handleApiError(error, 'Pollinations AI'),
      '',
      '提示:',
      '  • 检查网络连接',
      '  • 稍后重试',
      '  • API 免费且无需密钥',
    ].join('\n')

    return { output: errorOutput }
  }
}

registerCommand('ai', {
  handler: aiHandler,
  description: '向AI助手提问',
  usage: 'ai <问题>',
  examples: ['ai 如何查看系统信息', 'ai explain grep command'],
}, { force: true, source: 'aiChatCommands' })

registerCommand('ask', {
  handler: aiHandler,
  description: '向AI助手提问（ai 的别名）',
  usage: 'ask <问题>',
  examples: ['ask 如何查看系统信息', 'ask explain grep command'],
})
