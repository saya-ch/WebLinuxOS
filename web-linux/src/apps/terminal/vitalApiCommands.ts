import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { fetchWithTimeout, handleApiError } from '../../config/apiConfig'

registerCommand('news', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(
        'https://hacker-news.firebaseio.com/v0/topstories.json'
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const storyIds: number[] = await response.json()
      const topIds = storyIds.slice(0, 10)

      const stories = await Promise.all(
        topIds.map(async (id) => {
          try {
            const itemRes = await fetchWithTimeout(
              `https://hacker-news.firebaseio.com/v0/item/${id}.json`
            )
            if (!itemRes.ok) return null
            return await itemRes.json()
          } catch {
            return null
          }
        })
      )

      const validStories = stories.filter(Boolean) as Array<{
        id: number
        title: string
        url?: string
        score?: number
        by?: string
        time?: number
      }>

      if (validStories.length === 0) {
        throw new Error('无新闻数据')
      }

      const output = [
        '📰 Hacker News 热门新闻',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
      ]

      validStories.forEach((story, index) => {
        const score = story.score || 0
        const author = story.by || '未知'
        const title = story.title || '无标题'
        const url = story.url || `https://news.ycombinator.com/item?id=${story.id}`

        output.push(`${(index + 1).toString().padStart(2)}. ${title}`)
        output.push(`    ⭐ ${score} | 👤 ${author}`)
        output.push(`    🔗 ${url}`)
        output.push('')
      })

      output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      output.push('数据来源: Hacker News API')
      output.push('提示: 使用 hn <编号> 查看详情')

      return { output: output.join('\n') }
    } catch (error) {
      const fallbackStories = [
        { title: 'Show HN: WebLinuxOS - 基于Web的完整Linux桌面环境', score: 1200, by: 'saya-ch', url: 'https://github.com/saya-ch/WebLinuxOS' },
        { title: 'Rust 1.80 发布', score: 850, by: 'rustacean', url: 'https://blog.rust-lang.org/' },
        { title: 'TypeScript 5.5 新特性解读', score: 720, by: 'ts-dev', url: 'https://devblogs.microsoft.com/typescript/' },
        { title: 'Linux 内核 6.10 发布', score: 680, by: 'kernel-hacker', url: 'https://kernel.org' },
        { title: 'AI辅助编程工具对比评测', score: 560, by: 'dev-reviewer', url: 'https://example.com/ai-tools' },
      ]

      const output = [
        '📰 Hacker News 热门新闻',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
      ]

      fallbackStories.forEach((story, index) => {
        output.push(`${(index + 1).toString().padStart(2)}. ${story.title}`)
        output.push(`    ⭐ ${story.score} | 👤 ${story.by}`)
        output.push(`    🔗 ${story.url}`)
        output.push('')
      })

      output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      output.push('')
      output.push(handleApiError(error, 'Hacker News API'))
      output.push('提示: 使用备用数据')

      return { output: output.join('\n') }
    }
  },
  description: '获取Hacker News热门新闻',
  usage: 'news',
  examples: ['news']
})

registerCommand('quote', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(
        'https://api.adviceslip.com/advice'
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const advice: string = data?.slip?.advice || ''

      if (!advice) {
        throw new Error('无名言数据')
      }

      const output = [
        '💡 每日励志名言',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `"${advice}"`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '数据来源: Advice Slip API',
      ]

      return { output: output.join('\n') }
    } catch (error) {
      const fallbackQuotes = [
        '代码如诗，简洁为美。',
        '最好的代码是你不需要写的代码。',
        '先让它能跑起来，再让它跑得更快。',
        '过早优化是万恶之源。',
        '程序员的三大谎言: 这很简单、马上就好、不会有bug。',
        '测试不是可选的，而是必须的。',
        '好的架构是长出来的，不是设计出来的。',
        '命名是计算机科学中最难的两件事之一。',
      ]

      const quote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]

      const output = [
        '💡 每日励志名言',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `"${quote}"`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        handleApiError(error, 'Advice Slip API'),
        '提示: 使用备用数据',
      ]

      return { output: output.join('\n') }
    }
  },
  description: '获取每日励志名言',
  usage: 'quote',
  examples: ['quote']
})

registerCommand('joke', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(
        'https://v2.jokeapi.dev/joke/Programming?safe-mode'
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      const output = [
        '😄 编程笑话',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
      ]

      if (data.type === 'twopart') {
        output.push(`${data.setup || ''}`)
        output.push('')
        output.push(`${data.delivery || ''}`)
      } else {
        output.push(`${data.joke || '暂无笑话'}`)
      }

      output.push('')
      output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      output.push('数据来源: JokeAPI')

      return { output: output.join('\n') }
    } catch (error) {
      const fallbackJokes = [
        { setup: '为什么程序员喜欢暗色主题？', delivery: '因为 Bug 都怕光。' },
        { setup: '有10种人懂二进制，他们分别是？', delivery: '懂的和不懂的。' },
        { setup: 'SQL 查询走进酒吧，看见两张桌子，问：', delivery: '"我能加入你们吗？"' },
        { setup: '世界上只有10种人：', delivery: '懂十六进制和不懂十六进制的。' },
        { setup: '为什么程序员把 Halloween 和 Christmas 搞混？', delivery: '因为 Oct 31 == Dec 25。' },
        { setup: '一个程序员走进酒吧，点了一杯啤酒。', delivery: '然后他崩溃了。' },
      ]

      const joke = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)]

      const output = [
        '😄 编程笑话',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `${joke.setup}`,
        '',
        `${joke.delivery}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        handleApiError(error, 'JokeAPI'),
        '提示: 使用备用数据',
      ]

      return { output: output.join('\n') }
    }
  },
  description: '获取编程笑话',
  usage: 'joke',
  examples: ['joke']
})

registerCommand('fact', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(
        'https://uselessfacts.jsph.pl/api/v1/facts'
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const fact: string = data?.text || ''

      if (!fact) {
        throw new Error('无冷知识数据')
      }

      const output = [
        '🤯 有趣冷知识',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `${fact}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '数据来源: UselessFacts',
      ]

      return { output: output.join('\n') }
    } catch (error) {
      const fallbackFacts = [
        '章鱼有三颗心脏，蓝色的血液。',
        '香蕉是浆果，但草莓不是。',
        '蜂蜜永远不会变质，考古学家在古埃及墓穴中发现了 still 可食用的蜂蜜。',
        '人类每天产生约1.5升唾液，一生的唾液可以装满两个游泳池。',
        '北极熊的皮肤是黑色的，毛发是透明的。',
        '蜗牛可以睡三年。',
        '爱因斯坦的大脑重1230克，低于人类平均水平。',
        '地球上的树木比星星还多。',
        '微波炉不能加热葡萄，因为它们会产生等离子体。',
        '日本的方形西瓜是为了方便堆叠而培育的。',
      ]

      const fact = fallbackFacts[Math.floor(Math.random() * fallbackFacts.length)]

      const output = [
        '🤯 有趣冷知识',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `${fact}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        handleApiError(error, 'UselessFacts'),
        '提示: 使用备用数据',
      ]

      return { output: output.join('\n') }
    }
  },
  description: '获取有趣的冷知识',
  usage: 'fact',
  examples: ['fact']
})

registerCommand('github', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const username = args[0]

    if (!username) {
      return {
        output: [
          '🐙 GitHub 用户信息',
          '',
          '用法: github <用户名>',
          '',
          '示例: github torvalds',
          '      github gaearon',
          '      github saya-ch',
        ].join('\n')
      }
    }

    try {
      const response = await fetchWithTimeout(
        `https://api.github.com/users/${encodeURIComponent(username)}`
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!data || !data.login) {
        throw new Error('用户不存在')
      }

      const output = [
        `🐙 GitHub 用户: ${data.login}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `姓名: ${data.name || '未设置'}`,
        `简介: ${data.bio || '暂无简介'}`,
        `所在地: ${data.location || '未知'}`,
        `公司: ${data.company || '未设置'}`,
        `博客: ${data.blog || '未设置'}`,
        '',
        `关注者: ${data.followers?.toLocaleString() || 0}`,
        `关注中: ${data.following?.toLocaleString() || 0}`,
        `公开仓库: ${data.public_repos?.toLocaleString() || 0}`,
        `Gists: ${data.public_gists?.toLocaleString() || 0}`,
        '',
        `创建时间: ${data.created_at ? new Date(data.created_at).toLocaleDateString('zh-CN') : '未知'}`,
        `更新时间: ${data.updated_at ? new Date(data.updated_at).toLocaleDateString('zh-CN') : '未知'}`,
        '',
        `主页: ${data.html_url || ''}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '数据来源: GitHub API',
      ]

      return { output: output.join('\n') }
    } catch (error) {
      const output = [
        `🐙 GitHub 用户: ${username}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        handleApiError(error, 'GitHub API'),
        '',
        '提示: 请检查用户名是否正确，或稍后重试',
        '',
        '用法: github <用户名>',
      ]

      return { output: output.join('\n') }
    }
  },
  description: '查看GitHub用户信息',
  usage: 'github <用户名>',
  examples: ['github torvalds', 'github saya-ch']
})

registerCommand('trending', {
  handler: async (): Promise<CommandResult> => {
    try {
      const response = await fetchWithTimeout(
        'https://api.github.com/search/repositories?q=stars:>1000&sort=stars&order=desc&per_page=10'
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const items: Array<{
        full_name: string
        description?: string
        stargazers_count: number
        language?: string
        html_url: string
        forks_count?: number
      }> = data?.items || []

      if (items.length === 0) {
        throw new Error('无热门仓库数据')
      }

      const output = [
        '📈 GitHub 热门仓库',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
      ]

      items.forEach((repo, index) => {
        output.push(`${(index + 1).toString().padStart(2)}. ${repo.full_name}`)
        output.push(`    ⭐ ${repo.stargazers_count.toLocaleString()} | 🍴 ${repo.forks_count?.toLocaleString() || 0} | ${repo.language || '未知'}`)
        output.push(`    ${repo.description || '暂无描述'}`)
        output.push(`    🔗 ${repo.html_url}`)
        output.push('')
      })

      output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      output.push('数据来源: GitHub API')

      return { output: output.join('\n') }
    } catch (error) {
      const fallbackRepos = [
        { name: 'vercel/next.js', stars: 124000, forks: 26500, language: 'JavaScript', description: 'React框架' },
        { name: 'facebook/react', stars: 228000, forks: 46800, language: 'JavaScript', description: '用于构建用户界面的JavaScript库' },
        { name: 'vuejs/core', stars: 205000, forks: 33700, language: 'TypeScript', description: 'Vue.js核心库' },
        { name: 'tailwindlabs/tailwindcss', stars: 88500, forks: 4400, language: 'TypeScript', description: '实用优先的CSS框架' },
        { name: 'microsoft/TypeScript', stars: 99800, forks: 12300, language: 'TypeScript', description: 'TypeScript是JavaScript的超集' },
        { name: 'nodejs/node', stars: 107000, forks: 29400, language: 'JavaScript', description: 'Node.js运行时' },
        { name: 'rust-lang/rust', stars: 98900, forks: 12700, language: 'Rust', description: '安全、并发、实用的编程语言' },
        { name: 'torvalds/linux', stars: 185000, forks: 54100, language: 'C', description: 'Linux内核源代码' },
      ]

      const output = [
        '📈 GitHub 热门仓库',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
      ]

      fallbackRepos.forEach((repo, index) => {
        output.push(`${(index + 1).toString().padStart(2)}. ${repo.name}`)
        output.push(`    ⭐ ${repo.stars.toLocaleString()} | 🍴 ${repo.forks.toLocaleString()} | ${repo.language}`)
        output.push(`    ${repo.description}`)
        output.push('')
      })

      output.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      output.push('')
      output.push(handleApiError(error, 'GitHub API'))
      output.push('提示: 使用备用数据')

      return { output: output.join('\n') }
    }
  },
  description: '获取GitHub热门仓库',
  usage: 'trending',
  examples: ['trending']
})