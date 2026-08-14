import { useState, useMemo, useCallback } from 'react'
import {
  Regex,
  Copy,
  Check,
  AlertCircle,
  Code2,
  BookOpen,
  Brain,
  Zap,
  Eye,
  ChevronDown,
  ChevronUp,
  FileJson,
  Terminal,
  Search,
} from 'lucide-react'

interface MatchResult {
  text: string
  index: number
  endIndex: number
  groups: string[]
  namedGroups: Record<string, string>
}

interface PresetPattern {
  name: string
  pattern: string
  flags: string
  sample: string
  description: string
}

interface CodeSnippets {
  javascript: string
  python: string
  go: string
}

const PRESET_PATTERNS: PresetPattern[] = [
  {
    name: '邮箱地址',
    pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.]+',
    flags: 'g',
    sample: '联系我们: support@example.com 或 sales@company.co.uk，也可发给 admin@sub.domain.org',
    description: '匹配标准邮箱格式，支持多级域名',
  },
  {
    name: 'URL链接',
    pattern: 'https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w./?%&=-]*',
    flags: 'gi',
    sample: '官方网站 https://www.example.com 和 http://api.test.org/v2?key=1&q=test',
    description: '匹配HTTP/HTTPS URL链接',
  },
  {
    name: '手机号(中国)',
    pattern: '1[3-9]\\d{9}',
    flags: 'g',
    sample: '我的号码是13812345678，备用号15987654321，办公电话010-12345678',
    description: '匹配中国大陆手机号',
  },
  {
    name: 'IP地址',
    pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
    flags: 'g',
    sample: '服务器IP: 192.168.1.1, 网关: 10.0.0.1, DNS: 8.8.8.8, 外部: 203.0.113.42',
    description: '匹配IPv4地址',
  },
  {
    name: '日期格式',
    pattern: '\\d{4}[-/](?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12]\\d|3[01])',
    flags: 'g',
    sample: '项目开始于2024-01-15，预计在2024/12/31完成，里程碑日期2025-06-30',
    description: '匹配YYYY-MM-DD或YYYY/MM/DD格式日期',
  },
  {
    name: 'HTML标签',
    pattern: '<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>([^<]*)</\\1>',
    flags: 'g',
    sample: '<div class="container"><p>Hello <strong>World</strong></p><span class="highlight">文本</span></div>',
    description: '匹配HTML标签及内容',
  },
  {
    name: '中文字符',
    pattern: '[\\u4e00-\\u9fa5]+',
    flags: 'g',
    sample: '这是一段中文文本，包含多个汉字。English text should be ignored. 更多中文内容在这里。',
    description: '匹配连续中文字符',
  },
  {
    name: '数字(含小数)',
    pattern: '-?\\d+(?:\\.\\d+)?',
    flags: 'g',
    sample: '数据统计: 平均值 42.5, 总数 100, 负数 -15.8, 百分比 99.9%',
    description: '匹配整数和小数，含负数',
  },
  {
    name: 'Hex颜色值',
    pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
    flags: 'g',
    sample: '主色调 #FF5733, 背景 #fff, 辅助色 #3498db, 暗色 #2c3e50',
    description: '匹配3位或6位十六进制颜色值',
  },
  {
    name: '身份证号(中国)',
    pattern: '[1-9]\\d{5}(?:19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]',
    flags: 'g',
    sample: '张三的身份证: 110101199003071234, 李四: 31010519851212009X',
    description: '匹配18位中国身份证号码',
  },
]

const FLAG_DESCRIPTIONS: Record<string, string> = {
  g: '全局匹配 - 查找所有匹配项',
  i: '忽略大小写',
  m: '多行模式 - ^和$匹配每行',
  s: '单行模式 - .匹配换行符',
  u: 'Unicode模式',
  y: '粘性匹配',
}

function generateExplain(pattern: string): string[] {
  const parts: string[] = []
  const tokenMap: Array<[RegExp, string]> = [
    [/\\d/, '匹配任意数字 (0-9)'],
    [/\\D/, '匹配任意非数字字符'],
    [/\\w/, '匹配单词字符 (字母、数字、下划线)'],
    [/\\W/, '匹配非单词字符'],
    [/\\s/, '匹配空白字符 (空格、制表符等)'],
    [/\\S/, '匹配非空白字符'],
    [/\./, '匹配任意字符 (除换行)'],
    [/\^/, '匹配字符串开头'],
    [/\$/, '匹配字符串结尾'],
    [/\*/, '匹配前面的元素零次或多次'],
    [/\+/, '匹配前面的元素一次或多次'],
    [/\?/, '匹配前面的元素零次或一次'],
    [/\{(\d+)\}/, '精确匹配{n}次'],
    [/\{(\d+),\}/, '至少匹配{n,}次'],
    [/\{(\d+),(\d+)\}/, '匹配{n,m}次'],
    [/\[/, '开始字符类'],
    [/\]/, '结束字符类'],
    [/\(/, '开始捕获组'],
    [/\)/, '结束捕获组'],
    [/\|/, '或运算'],
    [/\\</, '单词开始边界'],
    [/\\>/, '单词结束边界'],
    [/\\b/, '单词边界'],
    [/\\B/, '非单词边界'],
    [/\(?:/, '开始非捕获组'],
    [/\(?=/, '开始正向前瞻'],
    [/\(?!/, '开始负向前瞻'],
    [/\(?<=/, '开始正向后顾'],
    [/\(?<!/, '开始负向后顾'],
  ]

  let remaining = pattern
  for (const [regex, desc] of tokenMap) {
    const match = remaining.match(regex)
    if (match) {
      parts.push(`${desc} [${match[0]}]`)
      remaining = remaining.slice(match[0].length)
      if (remaining.length === 0) break
    }
  }

  if (parts.length === 0 && pattern) {
    parts.push(`字面量匹配 "${pattern}"`)
  }

  return parts
}

function analyzeComplexity(pattern: string, flags: string): { level: string; score: number; issues: string[] } {
  let score = 0
  const issues: string[] = []

  if (pattern.includes('.*.*') || pattern.includes('.+.+')) {
    score += 30
    issues.push('嵌套量词可能导致灾难性回溯')
  }

  const quantifiers = pattern.match(/[+*?]|\{\d+,?\d*\}/g)
  if (quantifiers && quantifiers.length > 3) {
    score += 15
    issues.push('量词过多，建议简化')
  }

  if (pattern.includes('.*') && pattern.includes('.*')) {
    score += 20
    issues.push('多个.*可能导致性能问题')
  }

  const nestedGroups = (pattern.match(/\([^)]*\([^)]*\)[^)]*\)/g) || [])
  if (nestedGroups.length > 0) {
    score += 10
  }

  if (pattern.length > 100) {
    score += 15
    issues.push('正则表达式过长，建议分拆')
  }

  if (flags.includes('g') && !flags.includes('g')) {
    issues.push('全局标志在循环中可能导致性能问题')
  }

  if (score <= 15) return { level: '简单', score, issues }
  if (score <= 35) return { level: '中等', score, issues }
  if (score <= 55) return { level: '复杂', score, issues }
  return { level: '危险', score, issues }
}

function generateCode(pattern: string, flags: string): CodeSnippets {
  const jsFlags = flags
  const pyFlags = (flags.includes('i') ? 're.IGNORECASE | ' : '') + (flags.includes('m') ? 're.MULTILINE | ' : '') + (flags.includes('s') ? 're.DOTALL' : '')

  const escapedPattern = pattern.replace(/\\/g, '\\\\')

  return {
    javascript: `// JavaScript\nconst regex = /${escapedPattern}/${jsFlags};\nconst matches = text.match(regex);\n// 或使用 matchAll\nfor (const match of text.matchAll(regex)) {\n  console.log('匹配:', match[0], '位置:', match.index);\n  console.log('捕获组:', match.slice(1));\n}`,
    python: `# Python\nimport re\npattern = r'${escapedPattern}'\nregex = re.compile(pattern${pyFlags ? ', ' + pyFlags : ''})\nmatches = regex.findall(text)\nfor match in regex.finditer(text):\n    print(f'匹配: {match.group()}, 位置: {match.start()}')\n    print(f'捕获组: {match.groups()}')`,
    go: `// Go\nimport "regexp"\n\npattern := "${escapedPattern}"\nre, err := regexp.Compile(pattern)\nif err != nil {\n    panic(err)\n}\n\nmatches := re.FindAllStringSubmatchIndex(text, -1)\nfor _, m := range matches {\n    fmt.Printf("匹配: %s\\n", text[m[0]:m[1]])\n    for i := 2; i < len(m); i += 2 {\n        if m[i] >= 0 {\n            fmt.Printf("  组%d: %s\\n", i/2, text[m[i]:m[i+1]])\n        }\n    }\n}`,
  }
}

export default function OnlineRegexTester() {
  const [pattern, setPattern] = useState('[\\w.+-]+@[\\w-]+\\.[\\w.]+')
  const [flags, setFlags] = useState('g')
  const [testString, setTestString] = useState(
    '联系我们: support@example.com 或 sales@company.co.uk，也可发给 admin@sub.domain.org'
  )
  const [replaceText, setReplaceText] = useState('[$1]($2)')
  const [showExplain, setShowExplain] = useState(false)
  const [showComplexity, setShowComplexity] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [codeLang, setCodeLang] = useState<'javascript' | 'python' | 'go'>('javascript')
  const [copied, setCopied] = useState('')
  const [showPresets, setShowPresets] = useState(false)

  const { matches, error } = useMemo(() => {
    const results: MatchResult[] = []
    let currentError = ''

    try {
      const regex = new RegExp(pattern, flags)
      const globalFlag = flags.includes('g')
      let match: RegExpExecArray | null
      const seen = new Set<number>()

      if (globalFlag) {
        while ((match = regex.exec(testString)) !== null) {
          if (match.index === 0 && seen.has(0)) break
          seen.add(match.index)
          results.push({
            text: match[0],
            index: match.index,
            endIndex: match.index + match[0].length,
            groups: match.slice(1),
            namedGroups: match.groups ? { ...match.groups } : {},
          })
          if (match[0].length === 0) regex.lastIndex++
        }
      } else {
        match = regex.exec(testString)
        if (match) {
          results.push({
            text: match[0],
            index: match.index,
            endIndex: match.index + match[0].length,
            groups: match.slice(1),
            namedGroups: match.groups ? { ...match.groups } : {},
          })
        }
      }
    } catch (e) {
      currentError = e instanceof Error ? e.message : '正则表达式错误'
    }

    return { matches: results, error: currentError }
  }, [pattern, flags, testString])

  const replaceResult = useMemo(() => {
    if (!pattern || error) return ''
    try {
      const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
      return testString.replace(regex, replaceText || '')
    } catch {
      return ''
    }
  }, [pattern, flags, testString, replaceText, error])

  const explanation = useMemo(() => generateExplain(pattern), [pattern])
  const complexity = useMemo(() => analyzeComplexity(pattern, flags), [pattern, flags])
  const codeSnippets = useMemo(() => generateCode(pattern, flags), [pattern, flags])

  const toggleFlag = useCallback((f: string) => {
    setFlags((prev) => (prev.includes(f) ? prev.replace(f, '') : prev + f))
  }, [])

  const copyToClipboard = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(''), 1500)
    } catch {}
  }, [])

  const loadPreset = useCallback((preset: PresetPattern) => {
    setPattern(preset.pattern)
    setFlags(preset.flags)
    setTestString(preset.sample)
    setShowPresets(false)
  }, [])

  const renderHighlightedText = useCallback(() => {
    if (error || matches.length === 0) {
      return <span>{testString}</span>
    }

    const sortedMatches = [...matches].sort((a, b) => a.index - b.index)
    const parts: React.ReactNode[] = []
    let lastIndex = 0

    sortedMatches.forEach((match, i) => {
      if (match.index > lastIndex) {
        parts.push(<span key={`t-${i}`}>{testString.slice(lastIndex, match.index)}</span>)
      }
      parts.push(
        <mark
          key={`m-${i}`}
          className="bg-gradient-to-r from-cyan-500/50 to-blue-500/50 text-white rounded px-0.5"
          title={`匹配: "${match.text}"${match.groups.length > 0 ? `\n组: ${match.groups.join(', ')}` : ''}`}
        >
          {testString.slice(match.index, match.endIndex)}
        </mark>
      )
      lastIndex = match.endIndex
    })

    if (lastIndex < testString.length) {
      parts.push(<span key="end">{testString.slice(lastIndex)}</span>)
    }

    return <>{parts}</>
  }, [testString, matches, error])

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 text-gray-100 overflow-hidden">
      <div className="shrink-0 px-6 py-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Regex className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                正则表达式测试器 Pro
              </h1>
              <p className="text-xs text-gray-400">实时匹配 · 捕获组可视化 · 代码生成</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              预设模式
            </button>
          </div>
        </div>

        {showPresets && (
          <div className="mt-3 rounded-xl bg-black/20 border border-white/10 p-3 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {PRESET_PATTERNS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => loadPreset(p)}
                  className="text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="text-xs font-medium text-gray-200">{p.name}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 truncate">{p.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/30 transition-all">
            <span className="text-purple-400 font-mono text-sm shrink-0">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="输入正则表达式..."
              className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 focus:outline-none font-mono"
              spellCheck={false}
            />
            <span className="text-purple-400 font-mono text-sm shrink-0">/</span>
            <input
              type="text"
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              placeholder="gim"
              className="w-16 bg-transparent text-sm text-purple-300 placeholder-gray-600 focus:outline-none font-mono"
              spellCheck={false}
            />
          </div>

          <div className="flex items-center gap-1">
            {(['g', 'i', 'm', 's', 'u'] as const).map((f) => (
              <button
                key={f}
                onClick={() => toggleFlag(f)}
                title={FLAG_DESCRIPTIONS[f]}
                className={`w-9 h-9 rounded-lg text-xs font-mono font-bold transition-all ${
                  flags.includes(f)
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 text-gray-500 hover:bg-white/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-gray-300">测试文本</span>
              </div>
              <span className="text-xs text-gray-500">
                {testString.length} 字符 · {matches.length} 匹配
              </span>
            </div>
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="输入要测试的文本..."
              className="w-full px-4 py-3 bg-transparent text-sm text-gray-200 placeholder-gray-600 focus:outline-none resize-none font-mono leading-relaxed"
              rows={6}
              spellCheck={false}
            />
            <div className="px-4 py-3 border-t border-white/5 bg-black/20">
              <div className="text-[10px] text-gray-500 mb-2 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                匹配高亮
              </div>
              <div className="text-sm font-mono leading-relaxed text-gray-300 min-h-[40px] break-words">
                {renderHighlightedText()}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-medium text-gray-300">替换测试</span>
              </div>
              <button
                onClick={() => copyToClipboard(replaceResult, 'replace')}
                className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
                title="复制结果"
              >
                {copied === 'replace' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="px-4 py-3 space-y-3">
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="替换文本 (可用 $1, $2 引用捕获组)"
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 font-mono"
                spellCheck={false}
              />
              <div className="rounded-lg bg-black/20 p-3 text-sm font-mono text-pink-300 min-h-[40px] whitespace-pre-wrap break-all">
                {replaceResult || '输入替换文本查看结果...'}
              </div>
            </div>
          </div>

          {matches.length > 0 && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-gray-300">匹配结果详情</span>
                </div>
                <span className="text-xs text-gray-500">{matches.length} 项</span>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
                {matches.slice(0, 50).map((m, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-start gap-3 text-xs">
                    <span className="shrink-0 w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 flex items-center justify-center font-mono text-[10px]">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-gray-200 truncate">
                        "{m.text}"
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                        <span>位置: {m.index}-{m.endIndex}</span>
                        {m.groups.length > 0 && (
                          <span className="text-cyan-400">
                            组: [{m.groups.map((g) => `"${g}"`).join(', ')}]
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {matches.length > 50 && (
                  <div className="px-4 py-2 text-xs text-gray-500 text-center">
                    仅显示前50项，共 {matches.length} 项
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="匹配数"
              value={matches.length}
              color={error ? 'red' : matches.length > 0 ? 'emerald' : 'gray'}
            />
            <StatCard
              label="复杂度"
              value={complexity.level}
              color={complexity.score > 35 ? 'red' : complexity.score > 15 ? 'amber' : 'emerald'}
            />
            <StatCard label="字符数" value={pattern.length} color="cyan" />
          </div>

          <button
            onClick={() => setShowExplain(!showExplain)}
            className="w-full rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden text-left"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-gray-300">正则解释</span>
              </div>
              {showExplain ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
            {showExplain && (
              <div className="px-4 pb-3 space-y-1">
                {explanation.length > 0 ? (
                  explanation.map((exp, i) => (
                    <div key={i} className="text-xs text-gray-400 flex items-start gap-2">
                      <span className="text-amber-500 shrink-0">•</span>
                      <span>{exp}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500">输入正则以查看解释</div>
                )}
              </div>
            )}
          </button>

          <button
            onClick={() => setShowComplexity(!showComplexity)}
            className="w-full rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden text-left"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-gray-300">复杂度分析</span>
              </div>
              {showComplexity ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
            {showComplexity && (
              <div className="px-4 pb-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        complexity.score > 35
                          ? 'bg-red-500'
                          : complexity.score > 15
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(complexity.score, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-300 w-16 text-right">
                    {complexity.score}/100
                  </span>
                </div>
                {complexity.issues.length > 0 ? (
                  complexity.issues.map((issue, i) => (
                    <div key={i} className="text-xs text-amber-300 flex items-start gap-2">
                      <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                      {issue}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-emerald-400 flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    未发现性能问题
                  </div>
                )}
              </div>
            )}
          </button>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden">
            <button
              onClick={() => setShowCode(!showCode)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-gray-300">代码生成</span>
              </div>
              {showCode ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {showCode && (
              <div className="px-4 pb-3">
                <div className="flex items-center gap-1 mb-3">
                  {(['javascript', 'python', 'go'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCodeLang(lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        codeLang === lang
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/5 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {lang === 'javascript' ? 'JavaScript' : lang === 'python' ? 'Python' : 'Go'}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <pre className="rounded-lg bg-black/40 p-3 text-xs font-mono text-gray-300 whitespace-pre-wrap overflow-x-auto">
                    {codeSnippets[codeLang]}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(codeSnippets[codeLang], `code-${codeLang}`)}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
                  >
                    {copied === `code-${codeLang}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10',
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
    amber: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
    red: 'text-red-400 border-red-500/20 bg-red-500/10',
    gray: 'text-gray-400 border-gray-500/20 bg-gray-500/10',
  }
  return (
    <div className={`rounded-xl border p-3 ${colorMap[color]}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] opacity-80">{label}</div>
    </div>
  )
}