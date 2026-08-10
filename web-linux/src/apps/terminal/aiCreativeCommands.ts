// AI 创意命令集：poetry / story / haiku 等
// 基于 Pollinations AI 公开免费 API，带本地回退

import { registerCommand, type CommandContext } from './commands'

const POEM_STYLES = ['唐诗', '宋词', '现代诗', '俳句', '十四行诗', '诗经', '楚辞', '自由诗']
const GENRES = ['奇幻', '科幻', '悬疑', '浪漫', '寓言', '恐怖', '历史', '喜剧']

async function pollinationsPrompt(prompt: string, maxTokens = 800): Promise<string> {
  try {
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'flux',
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

// ===== poetry 命令 =====
registerCommand('poetry', {
  description: '使用 AI 创作诗歌，支持多种风格',
  usage: 'poetry <主题> [风格]',
  handler: async (ctx: CommandContext) => {
    const args = ctx.args
    if (args.length === 0) {
      return {
        output: '用法: poetry <主题> [风格]\n' +
          `可用风格: ${POEM_STYLES.join(', ')}\n` +
          '示例: poetry 春天 唐诗\n' +
          '      poetry 故乡',
      }
    }

    const topic = args[0]
    const style = args[1] || '唐诗'
    const stylePrompt = POEM_STYLES.includes(style) ? `${style}风格，意境优美` : style

    const prompt = `请创作一首关于"${topic}"的${stylePrompt}。要求：1. 内容原创 2. 语言凝练 3. 富有诗意 4. 直接输出诗歌`
    let result = await pollinationsPrompt(prompt)

    if (!result) {
      result = `《${topic}》\n\n${topic}入梦来，诗意绕心间。\n${style}千古事，唯有情不灭。`
    }

    return { output: result }
  },
})

// ===== story 命令 =====
registerCommand('story', {
  description: '使用 AI 创作故事片段，支持多种体裁',
  usage: 'story <主题> [体裁]',
  handler: async (ctx: CommandContext) => {
    const args = ctx.args
    if (args.length === 0) {
      return {
        output: '用法: story <主题> [体裁]\n' +
          `可用体裁: ${GENRES.join(', ')}\n` +
          '示例: story 魔法学院 奇幻\n' +
          '      story 时间旅行 科幻',
      }
    }

    const topic = args[0]
    const genre = args[1] || '奇幻'
    const genrePrompt = GENRES.includes(genre) ? `${genre}风格，情节精彩` : genre

    const prompt = `请创作一个${genrePrompt}风格的故事片段，主题是"${topic}"。要求：1. 情节引人入胜 2. 人物性格鲜明 3. 场景描写生动 4. 500字左右 5. 直接输出故事`
    let result = await pollinationsPrompt(prompt, 1500)

    if (!result) {
      result = `关于"${topic}"的${genre}故事...\n\n在一个平凡的日子，命运的齿轮开始转动。\n\n"你准备好了吗？"导师问道。\n主角握紧了手中的信物，坚定地点了点头。\n\n冒险，从此刻开始。`
    }

    return { output: result }
  },
})

// ===== haiku 命令 =====
registerCommand('haiku', {
  description: '创作俳句（日本短诗形式）',
  usage: 'haiku <主题>',
  handler: async (ctx: CommandContext) => {
    const args = ctx.args
    const topic = args.join(' ') || '自然'

    const prompt = `请创作一首关于"${topic}"的俳句。要求：5-7-5音节结构，意境空灵，富有禅意。直接输出俳句。`
    let result = await pollinationsPrompt(prompt, 300)

    if (!result) {
      result = `关于${topic}的俳句：\n\n古池畔，\n${topic}影跃入水，\n寂寂无声。`
    }

    return { output: result }
  },
})

// ===== quote-ai 命令 =====
registerCommand('quote-ai', {
  description: '使用 AI 生成主题名言',
  usage: 'quote-ai <主题>',
  handler: async (ctx: CommandContext) => {
    const args = ctx.args
    const topic = args.join(' ') || '人生'

    const prompt = `请创作一句关于"${topic}"的励志名言。要求：简洁有力，富有哲理，不超过30字。直接输出名言。`
    let result = await pollinationsPrompt(prompt, 200)

    if (!result) {
      const quotes: Record<string, string> = {
        '人生': '生活不是等待风暴过去，而是学会在雨中舞蹈。',
        '学习': '学而不思则罔，思而不学则殆。',
        '成功': '成功不是终点，失败也不是末日，重要的是继续前进的勇气。',
        '时间': '时间是最公平的资源，如何使用决定了人生的高度。',
        '梦想': '梦想还是要有的，万一实现了呢？',
      }
      result = quotes[topic] || `"${topic}"——这是一个值得深思的话题。`
    }

    return { output: result }
  },
})

// ===== crypto 命令 =====
registerCommand('crypto', {
  description: '查询加密货币实时价格（基于 CoinGecko API）',
  usage: 'crypto [币种符号]',
  handler: async (ctx: CommandContext) => {
    const args = ctx.args
    const symbol = (args[0] || 'BTC').toUpperCase()
    const coinMap: Record<string, string> = {
      BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin',
      SOL: 'solana', XRP: 'ripple', ADA: 'cardano',
      DOT: 'polkadot', DOGE: 'dogecoin', LINK: 'chainlink',
      MATIC: 'matic-network', AVAX: 'avalanche-2', SHIB: 'shiba-inu',
    }

    const coinId = coinMap[symbol] || symbol.toLowerCase()

    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
      )
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const coin = data[coinId]
      if (!coin) {
        return {
          output: `未找到币种: ${symbol}。支持的币种: BTC, ETH, BNB, SOL, XRP, ADA, DOT, DOGE, LINK`,
        }
      }

      const change = coin.usd_24h_change
      const changeStr = change != null
        ? `${change >= 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(2)}%`
        : 'N/A'

      return {
        output: `${symbol} 价格信息:\n` +
          `  当前价格: $${coin.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
          `  24h变动: ${changeStr}`,
      }
    } catch (e) {
      return { output: `获取 ${symbol} 价格失败，请检查网络或币种符号。` }
    }
  },
})

// ===== weather-ai 命令 =====
registerCommand('weather-ai', {
  description: '查询指定城市的天气（基于 wttr.in API）',
  usage: 'weather-ai <城市>',
  handler: async (ctx: CommandContext) => {
    const args = ctx.args
    if (args.length === 0) {
      return {
        output: '用法: weather-ai <城市>\n示例: weather-ai Beijing\n      weather-ai Shanghai',
      }
    }

    const city = args.join(' ')
    try {
      const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=3`)
      if (!res.ok) throw new Error('API error')
      const text = await res.text()

      const res2 = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=%l:+%c+%t+%h+%w`)
      const detailText = res2.ok ? await res2.text() : ''

      return {
        output: `天气查询 - ${city}:\n${text}${detailText ? '\n' + detailText : ''}`,
      }
    } catch (e) {
      return { output: `获取 ${city} 天气失败` }
    }
  },
})

// ===== 查看所有 AI 创意命令 =====
registerCommand('ai-creative-list', {
  description: '列出所有 AI 创意命令',
  usage: 'ai-creative-list',
  handler: async () => {
    return {
      output: 'AI 创意命令列表:\n' +
        '────────────────────────────────\n' +
        'poetry <主题> [风格]     - AI 诗歌生成\n' +
        'story <主题> [体裁]     - AI 故事创作\n' +
        'haiku <主题>            - AI 俳句创作\n' +
        'quote-ai <主题>         - AI 名言生成\n' +
        '────────────────────────────────\n' +
        '实用 API 命令:\n' +
        'crypto [币种]           - 加密货币价格查询\n' +
        'weather-ai <城市>       - 天气查询\n' +
        '────────────────────────────────',
    }
  },
})
