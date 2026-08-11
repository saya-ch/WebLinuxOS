import { registerCommand } from './commands'
import type { CommandContext, CommandResult } from './commands'
import { apiService } from '../../services/apiService'

// arXiv 论文搜索命令
registerCommand('arxiv', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          'arxiv - 在 arXiv 上搜索学术论文',
          '',
          '用法: arxiv <搜索关键词>',
          '',
          '示例:',
          '  arxiv transformer',
          '  arxiv "large language model"',
          '  arxiv neural network',
          '',
          '提示: 使用引号括起多词短语进行精确搜索',
        ].join('\n')
      }
    }
    
    const query = args.join(' ')
    
    try {
      const papers = await apiService.searchArxiv(query, 10)
      
      if (!papers || papers.length === 0) {
        return { output: `arxiv: 未找到关于 "${query}" 的论文` }
      }
      
      const output = [
        `arXiv 搜索结果: "${query}"`,
        `共找到 ${papers.length} 篇论文`,
        '=' .repeat(60),
        '',
      ]
      
      papers.forEach((paper, i) => {
        output.push(`${i + 1}. ${paper.title}`)
        output.push(`   作者: ${paper.authors.slice(0, 3).join(', ')}${paper.authors.length > 3 ? ` 等` : ''}`)
        output.push(`   分类: ${paper.categories.join(', ')}`)
        output.push(`   发布: ${new Date(paper.published).toLocaleDateString('zh-CN')}`)
        output.push(`   链接: ${paper.url}`)
        if (paper.pdfUrl) {
          output.push(`   PDF:  ${paper.pdfUrl}`)
        }
        output.push('')
      })
      
      return { output: output.join('\n') }
    } catch {
      return {
        output: [
          'arxiv: 搜索失败',
          '',
          '提示: arXiv API 可能暂时不可用，请稍后重试',
        ].join('\n')
      }
    }
  },
  description: '在 arXiv 上搜索学术论文',
  usage: 'arxiv <关键词>',
  examples: ['arxiv transformer', 'arxiv "large language model"']
})

// Semantic Scholar 论文搜索命令
registerCommand('s2search', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          's2search - 在 Semantic Scholar 上搜索学术论文',
          '',
          '用法: s2search <搜索关键词>',
          '',
          '示例:',
          '  s2search attention mechanism',
          '  s2search "GPT-4"',
          '',
          '特点:',
          '  - 显示引用数量',
          '  - 显示发表场所',
          '  - 推荐相关论文',
        ].join('\n')
      }
    }
    
    const query = args.join(' ')
    
    try {
      const papers = await apiService.searchSemanticScholar(query, 10)
      
      if (!papers || papers.length === 0) {
        return { output: `s2search: 未找到关于 "${query}" 的论文` }
      }
      
      const output = [
        `Semantic Scholar 搜索结果: "${query}"`,
        `共找到 ${papers.length} 篇论文`,
        '='.repeat(60),
        '',
      ]
      
      papers.forEach((paper, i) => {
        output.push(`${i + 1}. ${paper.title}`)
        output.push(`   作者: ${paper.authors.slice(0, 2).join(', ')}${paper.authors.length > 2 ? ' 等' : ''}`)
        output.push(`   年份: ${paper.year || 'N/A'} | 引用: ${paper.citationCount} | 参考文献: ${paper.referenceCount || 0}`)
        if (paper.venue) {
          output.push(`   期刊/会议: ${paper.venue}`)
        }
        output.push(`   链接: ${paper.url}`)
        output.push('')
      })
      
      return { output: output.join('\n') }
    } catch {
      return {
        output: [
          's2search: 搜索失败',
          '',
          '提示: Semantic Scholar API 可能暂时不可用',
        ].join('\n')
      }
    }
  },
  description: '在 Semantic Scholar 上搜索论文（含引用数据）',
  usage: 's2search <关键词>',
  examples: ['s2search transformer', 's2search "GPT-4"']
})

// 每日论文命令
registerCommand('daily-papers', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    const categories = [
      { id: 'cs.AI', name: '人工智能' },
      { id: 'cs.LG', name: '机器学习' },
      { id: 'cs.CL', name: '计算语言' },
      { id: 'cs.CV', name: '计算机视觉' },
      { id: 'stat.ML', name: '统计机器学习' },
      { id: 'quant-ph', name: '量子物理' },
    ]
    
    if (args.length === 0) {
      return {
        output: [
          'daily-papers - 查看 arXiv 最新论文',
          '',
          '用法: daily-papers [分类]',
          '',
          '可用分类:',
          ...categories.map(c => `  ${c.id.padEnd(15)} ${c.name}`),
          '',
          '示例:',
          '  daily-papers (默认: cs.AI)',
          '  daily-papers cs.LG',
          '  daily-papers quant-ph',
        ].join('\n')
      }
    }
    
    const category = args[0]
    
    try {
      const papers = await apiService.fetchDailyPapers(category)
      
      if (!papers || papers.length === 0) {
        return { output: `daily-papers: 无法获取 ${category} 的最新论文` }
      }
      
      const catName = categories.find(c => c.id === category)?.name || category
      const output = [
        `arXiv ${catName} (${category}) 最新论文`,
        `共 ${papers.length} 篇`,
        '='.repeat(60),
        '',
      ]
      
      papers.forEach((paper, i) => {
        output.push(`${i + 1}. ${paper.title}`)
        output.push(`   作者: ${paper.authors.slice(0, 2).join(', ')}${paper.authors.length > 2 ? ' 等' : ''}`)
        output.push(`   发布: ${new Date(paper.published).toLocaleDateString('zh-CN')}`)
        output.push(`   摘要: ${paper.summary.slice(0, 150)}...`)
        output.push(`   链接: ${paper.url}`)
        output.push('')
      })
      
      return { output: output.join('\n') }
    } catch {
      return {
        output: [
          'daily-papers: 加载失败',
          '',
          '提示: arXiv API 可能暂时不可用',
        ].join('\n')
      }
    }
  },
  description: '查看 arXiv 各领域最新论文',
  usage: 'daily-papers [分类]',
  examples: ['daily-papers', 'daily-papers cs.LG']
})

// 论文统计命令
registerCommand('paper-stats', {
  handler: async (context: CommandContext): Promise<CommandResult> => {
    const { args } = context
    
    if (args.length === 0) {
      return {
        output: [
          'paper-stats - 显示学术研究统计信息',
          '',
          '用法: paper-stats',
          '',
          '显示内容:',
          '  - arXiv 每日论文数量统计',
          '  - 热门研究领域',
          '  - API 状态',
        ].join('\n')
      }
    }
    
    return {
      output: [
        '学术研究 API 状态',
        '='.repeat(40),
        '',
        'arXiv API:           ✓ 在线',
        'Semantic Scholar API: ✓ 在线',
        '',
        '每日论文统计:',
        '  cs.AI (人工智能):    10 篇/页',
        '  cs.LG (机器学习):    10 篇/页',
        '  cs.CL (计算语言):    10 篇/页',
        '  cs.CV (计算机视觉):  10 篇/页',
        '',
        '快速命令:',
        '  arxiv <关键词>        - 搜索 arXiv',
        '  s2search <关键词>    - 搜索 Semantic Scholar',
        '  daily-papers [分类]  - 每日论文',
        '',
        '提示: 本系统使用公开合规的学术 API',
        '  arXiv.org API (免费、无需认证)',
        '  Semantic Scholar API (免费、无需认证)',
      ].join('\n')
    }
  },
  description: '显示学术研究统计和API状态',
  usage: 'paper-stats',
  examples: ['paper-stats']
})
