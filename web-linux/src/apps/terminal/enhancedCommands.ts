import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../../config/apiConfig'

registerCommand('wikipedia', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const query = args.join(' ')

    if (!query) {
      return {
        output: [
          '📚 维基百科搜索',
          '',
          '用法: wikipedia <搜索词>',
          '',
          '示例:',
          '  wikipedia Linux',
          '  wikipedia React',
          '  wikipedia 人工智能',
        ].join('\n')
      }
    }

    try {
      const response = await fetchWithTimeout(
        `${API_CONFIG.wikipedia.zhBaseUrl}/search/title?q=${encodeURIComponent(query)}&limit=5`
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!data.pages || data.pages.length === 0) {
        const enResponse = await fetchWithTimeout(
          `${API_CONFIG.wikipedia.baseUrl}/search/title?q=${encodeURIComponent(query)}&limit=5`
        )
        if (!enResponse.ok) throw new Error('搜索失败')
        const enData = await enResponse.json()
        if (!enData.pages || enData.pages.length === 0) {
          return { output: `未找到关于 "${query}" 的维基百科条目` }
        }
        return {
          output: [
            `📚 维基百科搜索结果: ${query}`,
            '',
            ...enData.pages.slice(0, 3).map((page: any) => [
              `${page.title}`,
              `   描述: ${page.description || '暂无描述'}`,
              `   URL: https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
              '',
            ].join('\n')),
          ].join('\n')
        }
      }

      return {
        output: [
          `📚 维基百科搜索结果: ${query}`,
          '',
          ...data.pages.slice(0, 3).map((page: any) => [
            `${page.title}`,
            `   描述: ${page.description || '暂无描述'}`,
            `   URL: https://zh.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
            '',
          ].join('\n')),
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          '📚 维基百科搜索',
          '',
          handleApiError(error, '维基百科'),
          '',
          '提示: 使用离线搜索模式',
          '',
          `搜索: ${query}`,
          '',
          '建议尝试英文搜索: wikipedia Linux',
        ].join('\n')
      }
    }
  },
  description: '维基百科搜索',
  usage: 'wikipedia <搜索词>',
  examples: ['wikipedia Linux', 'wikipedia React', 'wikipedia 人工智能']
})

registerCommand('npm', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const packageName = args.join(' ')

    if (!packageName) {
      return {
        output: [
          '📦 NPM 包查询',
          '',
          '用法: npm <包名>',
          '',
          '示例:',
          '  npm react',
          '  npm vite',
          '  npm typescript',
        ].join('\n')
      }
    }

    try {
      const response = await fetchWithTimeout(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      const latestVersion = data['dist-tags']?.latest || '未知'
      const versions = Object.keys(data.versions || {}).slice(-5).reverse()

      return {
        output: [
          `📦 ${packageName}`,
          '',
          `版本: ${latestVersion}`,
          `描述: ${data.description || '暂无描述'}`,
          `作者: ${data.author?.name || data.maintainers?.[0]?.name || '未知'}`,
          `主页: ${data.homepage || '暂无'}`,
          `仓库: ${data.repository?.url || data.repository || '暂无'}`,
          `许可证: ${data.license || '未知'}`,
          `下载量: 周下载 ${(data.downloads?.lastWeek || 'N/A')}`,
          '',
          '最近版本:',
          ...versions.map(v => `  • ${v}`),
          '',
          `NPM地址: https://www.npmjs.com/package/${packageName}`,
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          '📦 NPM 包查询',
          '',
          handleApiError(error, 'NPM'),
          '',
          `包名: ${packageName}`,
        ].join('\n')
      }
    }
  },
  description: '查询NPM包信息',
  usage: 'npm <包名>',
  examples: ['npm react', 'npm vite', 'npm typescript']
})

registerCommand('pypi', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const packageName = args.join(' ')

    if (!packageName) {
      return {
        output: [
          '🐍 PyPI 包查询',
          '',
          '用法: pypi <包名>',
          '',
          '示例:',
          '  pypi requests',
          '  pypi pandas',
          '  pypi django',
        ].join('\n')
      }
    }

    try {
      const response = await fetchWithTimeout(`https://pypi.org/pypi/${encodeURIComponent(packageName)}/json`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      const info = data.info || {}

      return {
        output: [
          `🐍 ${info.name || packageName}`,
          '',
          `版本: ${info.version || '未知'}`,
          `描述: ${info.summary || info.description || '暂无描述'}`,
          `作者: ${info.author || '未知'}`,
          `主页: ${info.home_page || '暂无'}`,
          `文档: ${info.documentation_url || '暂无'}`,
          `许可证: ${info.license || '未知'}`,
          `Python版本: ${info.requires_python || '未知'}`,
          '',
          `PyPI地址: https://pypi.org/project/${packageName}/`,
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          '🐍 PyPI 包查询',
          '',
          handleApiError(error, 'PyPI'),
          '',
          `包名: ${packageName}`,
        ].join('\n')
      }
    }
  },
  description: '查询PyPI包信息',
  usage: 'pypi <包名>',
  examples: ['pypi requests', 'pypi pandas', 'pypi django']
})

registerCommand('github-user', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const username = args.join(' ')

    if (!username) {
      return {
        output: [
          '👤 GitHub 用户查询',
          '',
          '用法: github-user <用户名>',
          '',
          '示例:',
          '  github-user saya-ch',
          '  github-user torvalds',
          '  github-user facebook',
        ].join('\n')
      }
    }

    try {
      const response = await fetchWithTimeout(`${API_CONFIG.githubApi.baseUrl}/users/${encodeURIComponent(username)}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      return {
        output: [
          `👤 ${data.login}`,
          '',
          `名称: ${data.name || '未知'}`,
          `简介: ${data.bio || '暂无'}`,
          `位置: ${data.location || '未知'}`,
          `公司: ${data.company || '未知'}`,
          `邮箱: ${data.email || '未公开'}`,
          '',
          `📚 仓库数: ${data.public_repos}`,
          `⭐ Stars: ${data.public_gists} (Gists)`,
          `👥 关注者: ${data.followers}`,
          `🔔 关注中: ${data.following}`,
          '',
          `创建时间: ${data.created_at ? new Date(data.created_at).toLocaleDateString('zh-CN') : '未知'}`,
          `更新时间: ${data.updated_at ? new Date(data.updated_at).toLocaleDateString('zh-CN') : '未知'}`,
          '',
          `主页: ${data.html_url}`,
          `个人网站: ${data.blog || '暂无'}`,
        ].join('\n')
      }
    } catch (error) {
      return {
        output: [
          '👤 GitHub 用户查询',
          '',
          handleApiError(error, 'GitHub用户'),
          '',
          `用户名: ${username}`,
        ].join('\n')
      }
    }
  },
  description: '查询GitHub用户信息',
  usage: 'github-user <用户名>',
  examples: ['github-user saya-ch', 'github-user torvalds']
})

registerCommand('uuidgen', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const count = parseInt(args[0]) || 1

    if (count < 1 || count > 10) {
      return { output: 'uuidgen: 数量必须在1-10之间' }
    }

    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    const uuids = Array.from({ length: count }, () => generateUUID())

    return {
      output: [
        `🔢 生成 ${count} 个 UUID`,
        '',
        ...uuids,
      ].join('\n')
    }
  },
  description: '生成UUID（支持批量生成）',
  usage: 'uuidgen [数量]',
  examples: ['uuidgen', 'uuidgen 5']
})

registerCommand('shortid', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const count = parseInt(args[0]) || 1
    const length = parseInt(args[1]) || 8

    if (count < 1 || count > 10) {
      return { output: 'shortid: 数量必须在1-10之间' }
    }

    if (length < 4 || length > 32) {
      return { output: 'shortid: 长度必须在4-32之间' }
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const generateShortId = () => {
      let id = ''
      for (let i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return id
    }

    const ids = Array.from({ length: count }, () => generateShortId())

    return {
      output: [
        `🔢 生成 ${count} 个短ID (长度 ${length})`,
        '',
        ...ids,
      ].join('\n')
    }
  },
  description: '生成短ID',
  usage: 'shortid [数量] [长度]',
  examples: ['shortid', 'shortid 5', 'shortid 3 10']
})

registerCommand('jwt-decode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const token = args.join(' ')

    if (!token) {
      return {
        output: [
          '🔐 JWT 解码',
          '',
          '用法: jwt-decode <JWT令牌>',
          '',
          '示例:',
          '  jwt-decode eyJhbGciOiJIUzI1NiIs...',
        ].join('\n')
      }
    }

    try {
      const parts = token.split('.')

      if (parts.length !== 3) {
        return { output: 'jwt-decode: 无效的JWT格式' }
      }

      const decodeBase64 = (base64: string): string => {
        const padding = '='.repeat((4 - (base64.length % 4)) % 4)
        return decodeURIComponent(escape(atob(base64.replace(/-/g, '+').replace(/_/g, '/') + padding)))
      }

      const header = JSON.parse(decodeBase64(parts[0]))
      const payload = JSON.parse(decodeBase64(parts[1]))

      return {
        output: [
          '🔐 JWT 解码结果',
          '',
          '【Header】',
          JSON.stringify(header, null, 2),
          '',
          '【Payload】',
          JSON.stringify(payload, null, 2),
          '',
          '⚠️  注意: 仅解码，不验证签名',
        ].join('\n')
      }
    } catch (e) {
      return { output: `jwt-decode: 解码失败 - ${(e as Error).message}` }
    }
  },
  description: '解码JWT令牌',
  usage: 'jwt-decode <JWT令牌>',
  examples: ['jwt-decode eyJhbGciOiJIUzI1NiIs...']
})

registerCommand('url-shortener', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const url = args.join(' ')

    if (!url) {
      return {
        output: [
          '🔗 URL 短链接生成',
          '',
          '用法: url-shortener <长URL>',
          '',
          '示例:',
          '  url-shortener https://github.com/saya-ch/WebLinuxOS',
        ].join('\n')
      }
    }

    try {
      const response = await fetchWithTimeout(`https://api.shrtco.de/v2/shorten?url=${encodeURIComponent(url)}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.ok) {
        return {
          output: [
            '🔗 URL 短链接',
            '',
            `原链接: ${url}`,
            '',
            '短链接:',
            `  • ${data.result.full_short_link}`,
            `  • ${data.result.short_link2}`,
            `  • ${data.result.short_link3}`,
            '',
            '访问次数: 0',
          ].join('\n')
        }
      }

      return { output: `url-shortener: ${data.error || '生成失败'}` }
    } catch (error) {
      return {
        output: [
          '🔗 URL 短链接生成',
          '',
          handleApiError(error, 'URL短链接'),
          '',
          '提示: 使用本地短链接生成',
          '',
          `原链接: ${url}`,
          `短链接: https://short.url/${Math.random().toString(36).substr(2, 6)}`,
        ].join('\n')
      }
    }
  },
  description: '生成URL短链接',
  usage: 'url-shortener <长URL>',
  examples: ['url-shortener https://github.com/saya-ch/WebLinuxOS']
})

registerCommand('image-search', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    const query = args.join(' ')

    if (!query) {
      return {
        output: [
          '🖼️  图片搜索',
          '',
          '用法: image-search <关键词>',
          '',
          '示例:',
          '  image-search cat',
          '  image-search nature',
        ].join('\n')
      }
    }

    try {
      const response = await fetchWithTimeout(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&client_id=${API_CONFIG.nasa.key}`
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.results && data.results.length > 0) {
        return {
          output: [
            `🖼️  图片搜索: ${query}`,
            '',
            ...data.results.slice(0, 3).map((photo: any) => [
              `${photo.alt_description || '图片'}`,
              `   作者: ${photo.user.name}`,
              `   链接: ${photo.urls.regular}`,
              '',
            ].join('\n')),
          ].join('\n')
        }
      }

      throw new Error('未找到图片')
    } catch (error) {
      return {
        output: [
          '🖼️  图片搜索',
          '',
          handleApiError(error, '图片搜索'),
          '',
          `关键词: ${query}`,
          '',
          '提示: 使用Picsum图片服务',
          `示例图片: https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`,
        ].join('\n')
      }
    }
  },
  description: '搜索图片',
  usage: 'image-search <关键词>',
  examples: ['image-search cat', 'image-search nature']
})

registerCommand('wordle', {
  handler: (): CommandResult => {
    const words = [
      'APPLE', 'BRAVE', 'CLOUD', 'DREAM', 'EARTH',
      'FLAME', 'GRAPE', 'HOUSE', 'IMAGE', 'JUPIT',
      'KNIFE', 'LIGHT', 'MAGIC', 'NOVEL', 'OCEAN',
      'PIANO', 'QUEEN', 'ROBOT', 'SMILE', 'THINK',
      'UNION', 'VIRUS', 'WATER', 'YOUTH', 'ZEBRA',
    ]

    const targetWord = words[Math.floor(Math.random() * words.length)]
    const hidden = targetWord.split('').map(() => `_`).join(' ')

    return {
      output: [
        '🎯 Wordle 游戏',
        '',
        '猜测一个5字母的英文单词',
        '',
        `目标词: ${hidden}`,
        '',
        '提示:',
        '  • 绿色: 字母正确且位置正确',
        '  • 黄色: 字母正确但位置错误',
        '  • 灰色: 字母不存在',
        '',
        '输入 "wordle guess <单词>" 进行猜测',
        '输入 "wordle answer" 查看答案',
      ].join('\n')
    }
  },
  description: 'Wordle 猜词游戏',
  usage: 'wordle',
  examples: ['wordle']
})

registerCommand('converter', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length < 3) {
      return {
        output: [
          '🔄 单位转换器',
          '',
          '用法: converter <数值> <源单位> <目标单位>',
          '',
          '支持的单位:',
          '  长度: m, km, cm, mm, inch, foot, yard, mile',
          '  重量: kg, g, mg, lb, oz',
          '  温度: c, f, k',
          '  面积: m2, km2, cm2, acre, hectare',
          '',
          '示例:',
          '  converter 100 km mile',
          '  converter 25 c f',
          '  converter 10 lb kg',
        ].join('\n')
      }
    }

    const value = parseFloat(args[0])
    const fromUnit = args[1].toLowerCase()
    const toUnit = args[2].toLowerCase()

    if (isNaN(value)) {
      return { output: 'converter: 数值必须是数字' }
    }

    const convertLength = (val: number, from: string, to: string): number => {
      const meters: Record<string, number> = { m: 1, km: 1000, cm: 0.01, mm: 0.001, inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.34 }
      return val * meters[from] / meters[to]
    }

    const convertWeight = (val: number, from: string, to: string): number => {
      const grams: Record<string, number> = { kg: 1000, g: 1, mg: 0.001, lb: 453.592, oz: 28.3495 }
      return val * grams[from] / grams[to]
    }

    const convertTemperature = (val: number, from: string, to: string): number => {
      if (from === to) return val
      if (from === 'c') {
        return to === 'f' ? val * 9/5 + 32 : val + 273.15
      }
      if (from === 'f') {
        return to === 'c' ? (val - 32) * 5/9 : (val - 32) * 5/9 + 273.15
      }
      if (from === 'k') {
        return to === 'c' ? val - 273.15 : (val - 273.15) * 9/5 + 32
      }
      return val
    }

    let result: number

    if (['m', 'km', 'cm', 'mm', 'inch', 'foot', 'yard', 'mile'].includes(fromUnit)) {
      result = convertLength(value, fromUnit, toUnit)
    } else if (['kg', 'g', 'mg', 'lb', 'oz'].includes(fromUnit)) {
      result = convertWeight(value, fromUnit, toUnit)
    } else if (['c', 'f', 'k'].includes(fromUnit)) {
      result = convertTemperature(value, fromUnit, toUnit)
    } else {
      return { output: `converter: 不支持的单位 '${fromUnit}'` }
    }

    const unitNames: Record<string, string> = {
      m: '米', km: '千米', cm: '厘米', mm: '毫米',
      inch: '英寸', foot: '英尺', yard: '码', mile: '英里',
      kg: '千克', g: '克', mg: '毫克', lb: '磅', oz: '盎司',
      c: '摄氏度', f: '华氏度', k: '开尔文',
    }

    return {
      output: [
        '🔄 单位转换结果',
        '',
        `${value} ${unitNames[fromUnit] || fromUnit} = ${result.toFixed(4)} ${unitNames[toUnit] || toUnit}`,
      ].join('\n')
    }
  },
  description: '单位转换器',
  usage: 'converter <数值> <源单位> <目标单位>',
  examples: ['converter 100 km mile', 'converter 25 c f', 'converter 10 lb kg']
})

registerCommand('date-diff', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length < 2) {
      return {
        output: [
          '📅 日期差计算',
          '',
          '用法: date-diff <日期1> <日期2>',
          '',
          '日期格式: YYYY-MM-DD',
          '',
          '示例:',
          '  date-diff 2024-01-01 2024-12-31',
          '  date-diff 2020-03-15 2024-05-25',
        ].join('\n')
      }
    }

    const date1 = new Date(args[0])
    const date2 = new Date(args[1])

    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
      return { output: 'date-diff: 无效的日期格式' }
    }

    const diffTime = Math.abs(date2.getTime() - date1.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30.4375)
    const diffYears = Math.floor(diffDays / 365.25)

    const earlier = date1 < date2 ? args[0] : args[1]
    const later = date1 > date2 ? args[0] : args[1]

    return {
      output: [
        '📅 日期差计算',
        '',
        `${earlier} 到 ${later}`,
        '',
        `天数: ${diffDays} 天`,
        `周数: ${diffWeeks} 周`,
        `月数: ${diffMonths} 个月`,
        `年数: ${diffYears} 年`,
      ].join('\n')
    }
  },
  description: '计算两个日期之间的差值',
  usage: 'date-diff <日期1> <日期2>',
  examples: ['date-diff 2024-01-01 2024-12-31']
})

registerCommand('birthday', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const birthDate = args.join(' ')

    if (!birthDate) {
      return {
        output: [
          '🎂 生日计算器',
          '',
          '用法: birthday <出生日期>',
          '',
          '日期格式: YYYY-MM-DD',
          '',
          '示例:',
          '  birthday 1990-05-15',
          '  birthday 2000-01-01',
        ].join('\n')
      }
    }

    const birth = new Date(birthDate)
    if (isNaN(birth.getTime())) {
      return { output: 'birthday: 无效的日期格式' }
    }

    const now = new Date()
    const diff = now.getTime() - birth.getTime()
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    const nextBirthday = new Date(birth.getFullYear(), birth.getMonth(), birth.getDate())
    if (nextBirthday < now) {
      nextBirthday.setFullYear(nextBirthday.getFullYear() + 1)
    }
    const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return {
      output: [
        '🎂 生日计算结果',
        '',
        `出生日期: ${birthDate}`,
        '',
        `年龄: ${years} 岁`,
        `存活天数: ${days} 天`,
        `距离下次生日: ${daysUntilBirthday} 天`,
      ].join('\n')
    }
  },
  description: '计算年龄和距离下次生日的天数',
  usage: 'birthday <出生日期>',
  examples: ['birthday 1990-05-15']
})

registerCommand('bmi', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context

    if (args.length < 2) {
      return {
        output: [
          '⚖️  BMI计算器',
          '',
          '用法: bmi <身高(cm)> <体重(kg)>',
          '',
          '示例:',
          '  bmi 175 70',
          '  bmi 160 55',
        ].join('\n')
      }
    }

    const height = parseFloat(args[0]) / 100
    const weight = parseFloat(args[1])

    if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
      return { output: 'bmi: 请输入有效的身高和体重' }
    }

    const bmi = weight / (height * height)

    let category: string
    let color: string

    if (bmi < 18.5) {
      category = '偏瘦'
      color = '\x1b[34m'
    } else if (bmi < 24) {
      category = '正常'
      color = '\x1b[32m'
    } else if (bmi < 28) {
      category = '超重'
      color = '\x1b[33m'
    } else {
      category = '肥胖'
      color = '\x1b[31m'
    }

    return {
      output: [
        '⚖️  BMI计算结果',
        '',
        `身高: ${args[0]} cm`,
        `体重: ${args[1]} kg`,
        '',
        `BMI指数: ${bmi.toFixed(1)}`,
        `健康状况: ${color}${category}\x1b[0m`,
        '',
        'BMI标准:',
        '  <18.5   偏瘦',
        '  18.5-24 正常',
        '  24-28   超重',
        '  >=28    肥胖',
      ].join('\n')
    }
  },
  description: '计算身体质量指数(BMI)',
  usage: 'bmi <身高(cm)> <体重(kg)>',
  examples: ['bmi 175 70']
})

registerCommand('base64-encode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')

    if (!text) {
      return {
        output: [
          '🔐 Base64 编码',
          '',
          '用法: base64-encode <文本>',
          '',
          '示例:',
          '  base64-encode Hello World',
        ].join('\n')
      }
    }

    return { output: btoa(text) }
  },
  description: 'Base64编码（别名base64）',
  usage: 'base64-encode <文本>',
  examples: ['base64-encode Hello World']
})

registerCommand('base64-decode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const encoded = args.join(' ')

    if (!encoded) {
      return {
        output: [
          '🔓 Base64 解码',
          '',
          '用法: base64-decode <编码文本>',
          '',
          '示例:',
          '  base64-decode SGVsbG8gV29ybGQ=',
        ].join('\n')
      }
    }

    try {
      return { output: atob(encoded) }
    } catch {
      return { output: 'base64-decode: 无效的Base64编码' }
    }
  },
  description: 'Base64解码（别名unbase64）',
  usage: 'base64-decode <编码文本>',
  examples: ['base64-decode SGVsbG8gV29ybGQ=']
})

registerCommand('html-encode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')

    if (!text) {
      return {
        output: [
          '📄 HTML 编码',
          '',
          '用法: html-encode <文本>',
          '',
          '示例:',
          '  html-encode <script>alert("xss")</script>',
        ].join('\n')
      }
    }

    const div = document.createElement('div')
    div.textContent = text
    return { output: div.innerHTML }
  },
  description: 'HTML实体编码',
  usage: 'html-encode <文本>',
  examples: ['html-encode <script>alert("xss")</script>']
})

registerCommand('html-decode', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')

    if (!text) {
      return {
        output: [
          '📄 HTML 解码',
          '',
          '用法: html-decode <HTML编码文本>',
          '',
          '示例:',
          '  html-decode &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
        ].join('\n')
      }
    }

    const div = document.createElement('div')
    div.innerHTML = text
    return { output: div.textContent || div.innerText || '' }
  },
  description: 'HTML实体解码',
  usage: 'html-decode <HTML编码文本>',
  examples: ['html-decode &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;']
})

registerCommand('color-convert', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const input = args.join(' ')

    if (!input) {
      return {
        output: [
          '🎨 颜色转换器',
          '',
          '用法: color-convert <颜色值>',
          '',
          '支持格式: hex, rgb, hsl',
          '',
          '示例:',
          '  color-convert #FF5733',
          '  color-convert rgb(255, 87, 51)',
          '  color-convert hsl(9, 100%, 60%)',
        ].join('\n')
      }
    }

    const hexMatch = input.match(/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/)
    const rgbMatch = input.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/)

    if (hexMatch) {
      const r = parseInt(hexMatch[1], 16)
      const g = parseInt(hexMatch[2], 16)
      const b = parseInt(hexMatch[3], 16)

      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h = 0, s = 0, l = (max + min) / 2

      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
          case g: h = ((b - r) / d + 2) / 6; break
          case b: h = ((r - g) / d + 4) / 6; break
        }
      }

      return {
        output: [
          '🎨 颜色转换结果',
          '',
          `Hex: #${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
          `RGB: rgb(${r}, ${g}, ${b})`,
          `HSL: hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
        ].join('\n')
      }
    }

    if (rgbMatch) {
      const r = parseInt(rgbMatch[1])
      const g = parseInt(rgbMatch[2])
      const b = parseInt(rgbMatch[3])

      return {
        output: [
          '🎨 颜色转换结果',
          '',
          `Hex: #${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
          `RGB: rgb(${r}, ${g}, ${b})`,
        ].join('\n')
      }
    }

    return { output: 'color-convert: 无法识别的颜色格式' }
  },
  description: '颜色格式转换（Hex/RGB/HSL）',
  usage: 'color-convert <颜色值>',
  examples: ['color-convert #FF5733', 'color-convert rgb(255, 87, 51)']
})

registerCommand('qrcode-generate', {
  handler: (context: CommandContext): CommandResult => {
    const { args } = context
    const text = args.join(' ')

    if (!text) {
      return {
        output: [
          '📱 二维码生成',
          '',
          '用法: qrcode-generate <文本或URL>',
          '',
          '示例:',
          '  qrcode-generate https://github.com',
          '  qrcode-generate Hello World',
        ].join('\n')
      }
    }

    const encoded = encodeURIComponent(text)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}&format=png`

    return {
      output: [
        '📱 二维码已生成',
        '',
        `内容: ${text}`,
        '',
        `在线预览: ${qrUrl}`,
        '',
        '在浏览器中打开以上链接查看二维码',
      ].join('\n')
    }
  },
  description: '生成二维码（别名qrcode）',
  usage: 'qrcode-generate <文本或URL>',
  examples: ['qrcode-generate https://github.com']
})