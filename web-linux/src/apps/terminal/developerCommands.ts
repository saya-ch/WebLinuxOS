import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'

const apiCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_DURATION = 60000

async function fetchWithCache<T>(url: string): Promise<T> {
  const cached = apiCache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const data = await response.json()
  apiCache.set(url, { data, timestamp: Date.now() })
  return data as T
}

async function fetchTextWithCache(url: string): Promise<string> {
  const cached = apiCache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as string
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const data = await response.text()
  apiCache.set(url, { data, timestamp: Date.now() })
  return data
}

interface NpmPackage {
  name: string
  version: string
  description?: string
  score?: { final?: number }
  downloads?: { lastMonth?: number }
}

interface NpmSearchResult {
  objects: { package: NpmPackage }[]
}

interface IpInfo {
  ip: string
}

interface IpGeo {
  status?: string
  country?: string
  city?: string
  lat?: number
  lon?: number
  isp?: string
  org?: string
}

interface LeetCodeProblem {
  difficulty: { level: number }
  stat: {
    frontend_question_id: number
    question__title: string
    total_acs: number
    total_submitted: number
    question__title_slug: string
  }
}

interface LeetCodeData {
  stat_status_pairs: LeetCodeProblem[]
}

registerCommand('npm-search', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    if (context.args.length === 0) {
      return {
        output: '用法: npm-search <包名>\n示例: npm-search react'
      }
    }

    try {
      const query = context.args.join(' ')
      const data = await fetchWithCache<NpmSearchResult>(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=5`
      )

      if (!data.objects || data.objects.length === 0) {
        return {
          output: `未找到包: ${query}`
        }
      }

      const results = data.objects.map((item) => {
        const pkg = item.package
        return `  📦 ${pkg.name}@${pkg.version}\n     🌟 ${pkg.score?.final?.toFixed(2) || 'N/A'}\n     📥 ${pkg.downloads?.lastMonth ? pkg.downloads.lastMonth.toLocaleString() : 'N/A'} 次下载/月\n     📝 ${pkg.description || '无描述'}`
      })

      return {
        output: `npm 包搜索结果 (${query}):\n\n${results.join('\n\n')}`
      }
    } catch (error) {
      return {
        output: `搜索失败: ${error instanceof Error ? error.message : '网络错误'}`
      }
    }
  },
  description: '搜索npm包',
  usage: 'npm-search <包名>',
  examples: ['npm-search react', 'npm-search typescript']
})

registerCommand('ip-info', {
  handler: async (): Promise<CommandResult> => {
    try {
      const data = await fetchWithCache<IpInfo>('https://api.ipify.org?format=json')
      const ip = data.ip

      const geoData = await fetchWithCache<IpGeo>(
        `https://ip-api.com/json/${ip}`
      )

      if (geoData.status === 'fail') {
        return {
          output: `IP: ${ip}\n无法获取地理位置信息`
        }
      }

      return {
        output: `你的IP信息:\n\n  🌐 IP地址: ${ip}\n  🌍 国家: ${geoData.country}\n  🏙️ 城市: ${geoData.city}\n  📍 坐标: ${geoData.lat}, ${geoData.lon}\n  💻 ISP: ${geoData.isp}\n  🏢 组织: ${geoData.org}`
      }
    } catch (error) {
      return {
        output: `获取IP信息失败: ${error instanceof Error ? error.message : '网络错误'}`
      }
    }
  },
  description: '获取当前IP地址和地理位置信息',
  usage: 'ip-info',
  examples: ['ip-info']
})

registerCommand('leetcode', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const difficulty = context.args[0]?.toLowerCase() || 'easy'
    
    try {
      const data = await fetchWithCache<LeetCodeData>(
        `https://leetcode.com/api/problems/all/`
      )

      const problems = data.stat_status_pairs.filter((item) => {
        const level = item.difficulty.level
        if (difficulty === 'easy') return level === 1
        if (difficulty === 'medium') return level === 2
        if (difficulty === 'hard') return level === 3
        return true
      })

      const randomProblem = problems[Math.floor(Math.random() * problems.length)]
      const stat = randomProblem.stat
      const level = randomProblem.difficulty.level
      const difficultyMap: Record<number, string> = { 1: '简单', 2: '中等', 3: '困难' }

      return {
        output: `LeetCode 随机题目 (${difficultyMap[level]}):\n\n  📝 题目: ${stat.frontend_question_id}. ${stat.question__title}\n  📊 通过率: ${stat.total_acs / stat.total_submitted * 100}%\n  🔗 https://leetcode.com/problems/${stat.question__title_slug}/`
      }
    } catch (error) {
      return {
        output: `获取LeetCode题目失败: ${error instanceof Error ? error.message : '网络错误'}`
      }
    }
  },
  description: '获取LeetCode随机算法题目',
  usage: 'leetcode [easy|medium|hard]',
  examples: ['leetcode', 'leetcode medium']
})

registerCommand('tldr', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    if (context.args.length === 0) {
      return {
        output: '用法: tldr <命令名>\n示例: tldr git'
      }
    }

    try {
      const cmd = context.args[0]
      const data = await fetchTextWithCache(
        `https://raw.githubusercontent.com/tldr-pages/tldr/main/pages/common/${cmd}.md`
      )

      return {
        output: `📖 ${cmd} 用法速查:\n\n${data.replace(/`/g, '')}`
      }
    } catch {
      const cmd = context.args[0]
      return {
        output: `未找到命令 "${cmd}" 的速查文档`
      }
    }
  },
  description: '查看命令用法速查（tldr）',
  usage: 'tldr <命令名>',
  examples: ['tldr git', 'tldr ls']
})

registerCommand('whoami', {
  handler: (context: CommandContext): CommandResult => {
    return {
      output: `${context.username}@${context.hostname}\n\n你正在使用 WebLinuxOS 虚拟终端。`
    }
  },
  description: '显示当前用户名',
  usage: 'whoami',
  examples: ['whoami']
})

registerCommand('hostname', {
  handler: (context: CommandContext): CommandResult => {
    return {
      output: context.hostname
    }
  },
  description: '显示主机名',
  usage: 'hostname',
  examples: ['hostname']
})

registerCommand('date', {
  handler: (): CommandResult => {
    const now = new Date()
    return {
      output: now.toString()
    }
  },
  description: '显示当前日期时间',
  usage: 'date',
  examples: ['date']
})

registerCommand('cal', {
  handler: (): CommandResult => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    let output = `      ${['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'][month]} ${year}\n`
    output += `${weekdays.join(' ')}\n`
    
    let row = ''
    for (let i = 0; i < firstDay; i++) {
      row += '   '
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      row += `${day.toString().padStart(2, ' ')} `
      if ((firstDay + day) % 7 === 0) {
        output += row + '\n'
        row = ''
      }
    }
    
    if (row) {
      output += row + '\n'
    }
    
    return {
      output
    }
  },
  description: '显示日历',
  usage: 'cal',
  examples: ['cal']
})