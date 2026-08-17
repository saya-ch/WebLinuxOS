import { useState, useEffect, useRef, useCallback, memo } from 'react'
import {
  Brain, Code2, Play, BookOpen, Trophy, ChevronRight,
  Send, Sparkles, Loader2, RotateCcw, Copy, Check,
  Lightbulb, Target, Database, Globe,
  Terminal, Award, BarChart3, Layers,
} from 'lucide-react'
import { marked } from 'marked'
import { API_CONFIG, fetchWithTimeout, handleApiError } from '../config/apiConfig'

type Lang = 'python' | 'javascript' | 'html' | 'css' | 'sql'
type Difficulty = 'beginner' | 'intermediate' | 'advanced'

interface Lesson {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  language: Lang
  content: string
  code: string
  challenge: string
  hints: string[]
  tests?: { input: string; expected: string }[]
}

interface TutorMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

const LESSONS: Lesson[] = [
  {
    id: 'py-1', title: 'Python 基础：Hello World', description: '学习如何编写第一个 Python 程序',
    difficulty: 'beginner', language: 'python',
    content: `# Python 基础：Hello World\n\n在 Python 中，使用 \`print()\` 函数输出文本到控制台。这是每个程序员的第一步！\n\n\`\`\`python\nprint("Hello, World!")\n\`\`\`\n\n**关键点**：\n- Python 使用缩进（通常4个空格）来定义代码块\n- 不需要分号\n- 字符串可以用单引号或双引号`,
    code: 'print("Hello, World!")',
    challenge: '修改代码，让它输出你的名字和欢迎语，例如："Welcome, Alice!"',
    hints: ['使用 print() 函数', '可以用逗号连接多个字符串: print("Hello", name)'],
    tests: [{ input: '', expected: 'Welcome' }],
  },
  {
    id: 'py-2', title: 'Python 变量与数据类型', description: '理解变量、字符串、数字和布尔值',
    difficulty: 'beginner', language: 'python',
    content: `# 变量与数据类型\n\nPython 支持多种数据类型：\n- **int**: 整数，如 42\n- **float**: 浮点数，如 3.14\n- **str**: 字符串，如 "hello"\n- **bool**: 布尔值，True/False\n\n\`\`\`python\nname = "Python"\nage = 30\npi = 3.14\nis_cool = True\nprint(f"{name} is {age} years old")\n\`\`\``,
    code: 'name = "World"\nage = 5\nprint(f"Hello, {name}! You are {age} years old.")',
    challenge: '创建一个计算BMI的程序：设置身高(米)和体重(公斤)变量，计算并打印BMI值',
    hints: ['BMI = weight / height^2', '使用 ** 运算符计算幂', '使用 round() 保留小数'],
  },
  {
    id: 'py-3', title: 'Python 条件与循环', description: '学习 if/else 和 for/while 循环',
    difficulty: 'intermediate', language: 'python',
    content: `# 条件与循环\n\n**if/elif/else 语句：**\n\`\`\`python\nscore = 85\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelse:\n    print("C")\n\`\`\`\n\n**for 循环：**\n\`\`\`python\nfor i in range(5):\n    print(i)\n\`\`\``,
    code: 'for i in range(1, 11):\n    if i % 2 == 0:\n        print(f"{i} is even")\n    else:\n        print(f"{i} is odd")',
    challenge: '编写一个程序，打印1-100中所有能被3整除但不能被5整除的数',
    hints: ['使用 for i in range(1, 101)', '条件: i % 3 == 0 and i % 5 != 0'],
  },
  {
    id: 'js-1', title: 'JavaScript 变量与函数', description: '学习 const/let 和函数声明',
    difficulty: 'beginner', language: 'javascript',
    content: `// JavaScript 基础\n\n**变量声明：**\n- \`const\`: 常量（推荐优先使用）\n- \`let\`: 可变变量\n- \`var\`: 旧式声明（避免使用）\n\n\`\`\`javascript\nconst greet = (name) => \`Hello, \${name}!\`;\nconsole.log(greet("WebLinux"));\n\`\`\`\n\n**箭头函数**是现代 JS 中定义函数的推荐方式。`,
    code: 'const greet = (name) => `Hello, ${name}!`;\nconst result = greet("World");\nconsole.log(result);',
    challenge: '创建一个函数 add(a, b)，返回两数之和。再创建一个 multiply(a, b) 返回乘积。',
    hints: ['使用箭头函数: const add = (a, b) => a + b', '使用 console.log 输出结果'],
  },
  {
    id: 'js-2', title: 'JavaScript 数组方法', description: '掌握 map/filter/reduce 高阶函数',
    difficulty: 'intermediate', language: 'javascript',
    content: `// 数组高阶函数\n\n**map**: 转换每个元素\n**filter**: 过滤元素\n**reduce**: 聚合计算\n\n\`\`\`javascript\nconst nums = [1, 2, 3, 4, 5];\nconst doubled = nums.map(n => n * 2);\nconst evens = nums.filter(n => n % 2 === 0);\nconst sum = nums.reduce((acc, n) => acc + n, 0);\nconsole.log({ doubled, evens, sum });\n\`\`\``,
    code: 'const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];\nconst squares = numbers.map(n => n * n);\nconst sumOfSquares = squares.reduce((a, b) => a + b, 0);\nconsole.log("Squares:", squares);\nconsole.log("Sum of squares:", sumOfSquares);',
    challenge: '给定数组 [3, 1, 4, 1, 5, 9, 2, 6]，使用 filter 和 map：先过滤出偶数，再将每个偶数乘以3',
    hints: ['链式调用: arr.filter().map()', '偶数条件: n % 2 === 0'],
  },
  {
    id: 'html-1', title: 'HTML 基础结构', description: '构建你的第一个网页',
    difficulty: 'beginner', language: 'html',
    content: `<!-- HTML 基础 -->\n\nHTML (HyperText Markup Language) 是网页的骨架。\n\n**基本结构：**\n\`\`\`html\n<!DOCTYPE html>\n<html>\n<head>\n  <title>页面标题</title>\n</head>\n<body>\n  <h1>标题</h1>\n  <p>段落</p>\n</body>\n</html>\n\`\`\`\n\n**常用标签**：h1-h6, p, div, span, a, img, ul/ol, table`,
    code: '<div style="padding: 20px; font-family: sans-serif;">\n  <h1 style="color: #6366f1;">Hello Web!</h1>\n  <p>这是一个 <strong>精彩</strong> 的网页。</p>\n  <ul>\n    <li>列表项 1</li>\n    <li>列表项 2</li>\n  </ul>\n</div>',
    challenge: '创建一个卡片组件，包含：头像(用emoji代替)、姓名、描述和一个关注按钮',
    hints: ['使用 div 容器', '用 style 属性设置样式', 'border-radius 实现圆角'],
  },
  {
    id: 'css-1', title: 'CSS 布局基础', description: 'Flexbox 弹性布局入门',
    difficulty: 'intermediate', language: 'css',
    content: `/* Flexbox 布局 */\n\nFlexbox 是现代 CSS 布局的核心。\n\n**容器属性：**\n- display: flex\n- justify-content: 主轴对齐\n- align-items: 交叉轴对齐\n- flex-direction: 方向\n\n\`\`\`css\n.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  gap: 16px;\n}\n\`\`\``,
    code: '.container {\n  display: flex;\n  gap: 12px;\n  padding: 20px;\n}\n.item {\n  flex: 1;\n  padding: 20px;\n  background: linear-gradient(135deg, #667eea, #764ba2);\n  color: white;\n  border-radius: 12px;\n  text-align: center;\n}',
    challenge: '编写CSS实现一个经典的"圣杯布局"：左右固定宽度，中间自适应的三栏布局',
    hints: ['使用 display: flex', '左右面板 width: 200px', '中间 flex: 1'],
  },
  {
    id: 'sql-1', title: 'SQL 查询基础', description: '学习 SELECT, WHERE, ORDER BY',
    difficulty: 'beginner', language: 'sql',
    content: `-- SQL 基础查询\n\n**SELECT** 从表中查询数据：\n\n\`\`\`sql\n-- 查询所有列\nSELECT * FROM users;\n\n-- 查询指定列 + 条件\nSELECT name, age FROM users WHERE age > 18;\n\n-- 排序\nSELECT * FROM products ORDER BY price DESC;\n\`\`\`\n\n**常用子句**：WHERE, ORDER BY, LIMIT, DISTINCT`,
    code: 'SELECT id, name, score\nFROM students\nWHERE score >= 80\nORDER BY score DESC\nLIMIT 10;',
    challenge: '假设有 orders 表(id, customer, amount, status)，查询所有已完成(status="paid")且金额大于100的订单，按金额降序排列',
    hints: ['WHERE status = "paid" AND amount > 100', 'ORDER BY amount DESC'],
  },
]

const PROGRESS_KEY = 'weblinux-ai-code-tutor-progress-v2'

function loadProgress(): Record<string, { completed: boolean; score: number }> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveProgress(p: Record<string, { completed: boolean; score: number }>) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

const pollinateText = async (prompt: string, systemPrompt = '', timeout = 60000): Promise<string> => {
  const fullPrompt = systemPrompt
    ? `<|im_start|>system\n${systemPrompt}\n<|im_end|>\n<|im_start|>user\n${prompt}\n<|im_end|>\n<|im_start|>assistant\n`
    : prompt
  const url = `${API_CONFIG.pollinations.textBaseUrl}/${encodeURIComponent(fullPrompt)}?stream=false`
  const res = await fetchWithTimeout(url, { headers: { Accept: 'text/plain' } }, timeout)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.text()
}

function renderMarkdown(content: string): string {
  try {
    return marked.parse(content, { async: false, breaks: true }) as string
  } catch {
    return content.replace(/</g, '&lt;').replace(/\n/g, '<br>')
  }
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: '#10b981',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
}

const LANGUAGE_META: Record<Lang, { label: string; color: string; icon: React.ReactNode }> = {
  python: { label: 'Python', color: '#3b82f6', icon: <Terminal size={14} /> },
  javascript: { label: 'JavaScript', color: '#f59e0b', icon: <Code2 size={14} /> },
  html: { label: 'HTML', color: '#ef4444', icon: <Globe size={14} /> },
  css: { label: 'CSS', color: '#6366f1', icon: <Layers size={14} /> },
  sql: { label: 'SQL', color: '#8b5cf6', icon: <Database size={14} /> },
}

const SYSTEM_PROMPT = `你是一位热情、专业的编程导师。你的目标是帮助学生学习编程。

教学原则：
1. 循序渐进：从简单到复杂，分步教学
2. 鼓励式：肯定学生的努力，培养学习兴趣
3. 实用导向：用实际例子和项目驱动学习
4. 错误教育：当学生犯错时，引导他们思考而不是直接给答案
5. 代码示例：总是提供清晰、可运行的代码示例

回答风格：
- 使用 Markdown 格式
- 代码使用 \`\`\`language 代码块
- 关键点使用加粗
- 解释简洁明了，避免冗长`

const ICON_BTN: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#c4c4e5',
  padding: 6,
  borderRadius: 8,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s',
}

async function runPythonCode(code: string): Promise<{ output: string; error: string | null }> {
  // Lazy-load Pyodide
  if (!(window as any).pyodide) {
    // Dynamically load Pyodide script
    await new Promise<void>((resolve, reject) => {
      if ((window as any).__pyodideLoading) {
        ;(window as any).__pyodideReady.then(() => resolve()).catch(reject)
        return
      }
      ;(window as any).__pyodideLoading = true
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js'
      script.onload = () => {
        ;(window as any).loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/' })
          .then((pyodide: any) => {
            ;(window as any).pyodide = pyodide
            ;(window as any).__pyodideReady = Promise.resolve()
            resolve()
          })
          .catch(reject)
      }
      script.onerror = () => reject(new Error('Pyodide 加载失败'))
      document.head.appendChild(script)
    })
  }

  const pyodide = (window as any).pyodide
  if (!pyodide) {
    throw new Error('Python 运行时未就绪')
  }

  const logs: string[] = []
  pyodide.setStdout({ batched: (s: string) => logs.push(s) })
  pyodide.setStderr({ batched: (s: string) => logs.push(s) })

  try {
    const result = await pyodide.runPythonAsync(code)
    if (result !== undefined && result !== null) {
      logs.push(String(result))
    }
    return { output: logs.join('\n') || '代码执行成功（无输出）', error: null }
  } catch (e: any) {
    return { output: logs.join('\n'), error: e?.message || String(e) }
  }
}

async function runJavaScriptCode(code: string): Promise<{ output: string; error: string | null }> {
  const logs: string[] = []
  const originalConsoleLog = console.log
  const originalConsoleError = console.error
  const originalConsoleWarn = console.warn

  console.log = (...args: unknown[]) => logs.push(args.map(a => {
    if (typeof a === 'object') {
      try { return JSON.stringify(a, null, 2) } catch { return String(a) }
    }
    return String(a)
  }).join(' '))
  console.error = (...args: unknown[]) => logs.push('❌ ' + args.map(String).join(' '))
  console.warn = (...args: unknown[]) => logs.push('⚠️ ' + args.map(String).join(' '))

  try {
    const fn = new Function(code)
    const result = fn()
    if (result !== undefined) {
      logs.push('⇒ ' + (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)))
    }
    return { output: logs.join('\n') || '代码执行成功（无输出）', error: null }
  } catch (e: any) {
    return { output: logs.join('\n'), error: e?.message || String(e) }
  } finally {
    console.log = originalConsoleLog
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
  }
}

const AICodeTutor = memo(function AICodeTutor() {
  const [progress, setProgress] = useState(() => loadProgress())
  const [currentLessonId, setCurrentLessonId] = useState<string>(() => {
    const completed = Object.entries(loadProgress()).filter(([, v]) => v.completed)
    const next = LESSONS.find(l => !completed.find(([id]) => id === l.id))
    return next?.id || LESSONS[0].id
  })
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [showChallenge, setShowChallenge] = useState(false)
  const [, setActiveHintIdx] = useState(0)
  const [activeTab, setActiveTab] = useState<'learn' | 'practice'>('learn')
  const [chatMessages, setChatMessages] = useState<TutorMessage[]>([
    {
      id: uid(), role: 'assistant', timestamp: Date.now(),
      content: '你好！我是你的 AI 编程导师 🎓\n\n在左侧选择一节课开始学习。你可以：\n- 📖 阅读课程内容\n- 💻 在编辑器中尝试代码\n- 🤖 向我提问任何编程问题\n- 🎯 完成挑战任务\n\n让我们开始吧！',
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<Lang | 'all'>('all')
  const [toast, setToast] = useState<string | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  loadingRef.current = aiLoading

  const currentLesson = LESSONS.find(l => l.id === currentLessonId) || LESSONS[0]

  useEffect(() => {
    setCode(currentLesson.code)
    setOutput('')
    setShowChallenge(false)
    setActiveHintIdx(0)
  }, [currentLessonId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => { saveProgress(progress) }, [progress])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const filteredLessons = selectedLanguage === 'all'
    ? LESSONS
    : LESSONS.filter(l => l.language === selectedLanguage)

  const completedCount = Object.values(progress).filter(p => p.completed).length
  const totalCount = LESSONS.length
  const progressPercent = Math.round((completedCount / totalCount) * 100)

  const runCode = useCallback(async () => {
    setIsRunning(true)
    setOutput('')
    try {
      if (currentLesson.language === 'python') {
        setPyodideLoading(true)
        const { output: out, error } = await runPythonCode(code)
        setOutput(error ? `❌ 错误：\n${error}\n\n---\n${out}` : out)
      } else if (currentLesson.language === 'javascript') {
        const { output: out, error } = await runJavaScriptCode(code)
        setOutput(error ? `❌ 错误：\n${error}\n\n---\n${out}` : out)
      } else if (currentLesson.language === 'html') {
        setOutput('🔮 HTML 预览已生成！\n\n(在支持的环境中打开预览窗口查看效果)')
      } else if (currentLesson.language === 'css') {
        setOutput('🎨 CSS 样式定义已就绪\n\n(创建 HTML 页面并应用此样式来查看效果)')
      } else if (currentLesson.language === 'sql') {
        setOutput('🗄️ SQL 查询已解析\n\n(在 SQLite/MySQL/PostgreSQL 等数据库中执行此查询)')
      } else {
        setOutput('✓ 代码已准备就绪')
      }
    } catch (e: any) {
      setOutput(`❌ 执行失败：${e?.message || e}`)
    } finally {
      setIsRunning(false)
      setPyodideLoading(false)
    }
  }, [code, currentLesson])

  const markComplete = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      [currentLesson.id]: { completed: true, score: 100 },
    }))
    showToast(`🎉 课程 "${currentLesson.title}" 已完成！`)
  }, [currentLesson, showToast])

  const sendChat = useCallback(async () => {
    const content = chatInput.trim()
    if (!content || aiLoading) return
    setChatInput('')

    const userMsg: TutorMessage = { id: uid(), role: 'user', content, timestamp: Date.now() }
    setChatMessages(prev => [...prev, userMsg])

    const pendingId = uid()
    setChatMessages(prev => [...prev, { id: pendingId, role: 'assistant', content: '', timestamp: Date.now() }])
    setAiLoading(true)

    const contextPrompt = `当前课程：${currentLesson.title}（${currentLesson.language}，${currentLesson.difficulty}）\n学生的代码：\n\`\`\`${currentLesson.language}\n${code}\n\`\`\`\n\n学生问题：${content}`

    try {
      const response = await pollinateText(contextPrompt, SYSTEM_PROMPT)
      setChatMessages(prev => prev.map(m => m.id === pendingId ? { ...m, content: response } : m))
    } catch (e) {
      setChatMessages(prev => prev.map(m => m.id === pendingId ? { ...m, content: `⚠️ ${handleApiError(e, 'AI 导师')}` } : m))
    } finally {
      setAiLoading(false)
    }
  }, [chatInput, aiLoading, currentLesson, code])

  const requestHint = useCallback(async () => {
    setAiLoading(true)
    const hintPrompt = `为这个编程挑战提供一个提示（不要给出完整答案）：\n挑战：${currentLesson.challenge}\n当前代码：\n${code}`
    const pendingId = uid()
    setChatMessages(prev => [...prev, { id: pendingId, role: 'assistant', content: '💡 正在生成提示...', timestamp: Date.now() }])
    try {
      const response = await pollinateText(hintPrompt, SYSTEM_PROMPT)
      setChatMessages(prev => prev.map(m => m.id === pendingId ? { ...m, content: '💡 ' + response } : m))
    } catch (e) {
      setChatMessages(prev => prev.map(m => m.id === pendingId ? { ...m, content: `⚠️ ${handleApiError(e, 'AI 提示')}` } : m))
    } finally {
      setAiLoading(false)
    }
  }, [currentLesson, code])

  const explainCode = useCallback(async () => {
    if (!code.trim()) {
      showToast('请先在编辑器中编写代码')
      return
    }
    setAiLoading(true)
    const pendingId = uid()
    setChatMessages(prev => [...prev, { id: pendingId, role: 'assistant', content: '🔍 正在分析代码...', timestamp: Date.now() }])
    try {
      const prompt = `请详细解释这段代码的工作原理，用清晰的分步说明：\n\`\`\`${currentLesson.language}\n${code}\n\`\`\``
      const response = await pollinateText(prompt, SYSTEM_PROMPT)
      setChatMessages(prev => prev.map(m => m.id === pendingId ? { ...m, content: '🔍 **代码解析**\n\n' + response } : m))
    } catch (e) {
      setChatMessages(prev => prev.map(m => m.id === pendingId ? { ...m, content: `⚠️ ${handleApiError(e, '代码解析')}` } : m))
    } finally {
      setAiLoading(false)
    }
  }, [code, currentLesson, showToast])

  const generateSolution = useCallback(async () => {
    setAiLoading(true)
    const pendingId = uid()
    setChatMessages(prev => [...prev, { id: pendingId, role: 'assistant', content: '✨ 正在生成参考答案...', timestamp: Date.now() }])
    try {
      const prompt = `为这个编程挑战提供一个完整的解决方案（${currentLesson.language}）：\n挑战描述：${currentLesson.challenge}\n\n请提供完整、可运行的代码，并添加关键步骤的注释。`
      const response = await pollinateText(prompt, SYSTEM_PROMPT)
      setChatMessages(prev => prev.map(m => m.id === pendingId ? { ...m, content: '✨ **参考答案**\n\n' + response } : m))
    } catch (e) {
      setChatMessages(prev => prev.map(m => m.id === pendingId ? { ...m, content: `⚠️ ${handleApiError(e, '生成答案')}` } : m))
    } finally {
      setAiLoading(false)
    }
  }, [currentLesson])

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      showToast('代码已复制到剪贴板')
    } catch {
      showToast('复制失败')
    }
  }, [code, showToast])

  const bg: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(160deg, #0b0b1a 0%, #141432 40%, #1a1040 70%, #0f0823 100%)',
    color: '#e8e8ff',
    fontFamily: 'inherit',
    overflow: 'hidden',
    position: 'relative',
  }

  const starField: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.3), transparent),
      radial-gradient(1px 1px at 60px 70px, rgba(168,85,247,0.4), transparent),
      radial-gradient(1px 1px at 120px 20px, rgba(99,102,241,0.3), transparent),
      radial-gradient(2px 2px at 200px 120px, rgba(255,255,255,0.2), transparent),
      radial-gradient(1px 1px at 280px 50px, rgba(139,92,246,0.4), transparent),
      radial-gradient(1px 1px at 340px 180px, rgba(255,255,255,0.25), transparent)
    `,
    backgroundRepeat: 'repeat',
    backgroundSize: '400px 250px',
    opacity: 0.7,
    pointerEvents: 'none',
  }

  return (
    <div style={bg}>
      <div style={starField} />

      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(139,92,246,0.15)',
        background: 'rgba(10,10,25,0.5)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #f472b6, #8b5cf6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(168,85,247,0.45)',
          }}>
            <Brain size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>AI 编程学院</div>
            <div style={{ fontSize: 11, color: '#8b8bbf', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={11} style={{ color: '#a855f7' }} />
              Pollinations AI · Pyodide · 真实编程学习
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Trophy size={16} style={{ color: '#f59e0b' }} />
            <div style={{ width: 140 }}>
              <div style={{ fontSize: 11, color: '#8b8bbf', marginBottom: 4 }}>
                进度: {completedCount}/{totalCount} 课程
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                  borderRadius: 3,
                  transition: 'width 0.4s ease',
                  boxShadow: '0 0 10px rgba(168,85,247,0.5)',
                }} />
              </div>
            </div>
          </div>

          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#a855f6',
          }}>
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {/* Left Sidebar - Lessons */}
        <aside style={{
          width: 260,
          borderRight: '1px solid rgba(139,92,246,0.1)',
          background: 'rgba(10,10,25,0.35)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Language Filter */}
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8b8bbf', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <BookOpen size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              选择语言
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(['all', 'python', 'javascript', 'html', 'css', 'sql'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: selectedLanguage === lang ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.06)',
                    background: selectedLanguage === lang ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.03)',
                    color: selectedLanguage === lang ? '#e9d5ff' : '#8b8bbf',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {lang === 'all' ? '全部' : LANGUAGE_META[lang as Lang].label}
                </button>
              ))}
            </div>
          </div>

          {/* Lesson List */}
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#8b8bbf',
            padding: '0 16px 8px', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <BarChart3 size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            课程列表
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
            {filteredLessons.map((lesson) => {
              const isActive = lesson.id === currentLessonId
              const isCompleted = progress[lesson.id]?.completed
              return (
                <div
                  key={lesson.id}
                  onClick={() => setCurrentLessonId(lesson.id)}
                  style={{
                    padding: '12px 14px',
                    marginBottom: 6,
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(99,102,241,0.12))'
                      : 'transparent',
                    border: isActive
                      ? '1px solid rgba(168,85,247,0.3)'
                      : '1px solid rgba(255,255,255,0.04)',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {isCompleted && (
                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                      <Check size={14} style={{ color: '#10b981' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: LANGUAGE_META[lesson.language].color + '22',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: LANGUAGE_META[lesson.language].color,
                    }}>
                      {LANGUAGE_META[lesson.language].icon}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600,
                      color: DIFFICULTY_COLORS[lesson.difficulty],
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {lesson.difficulty}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#e9d5ff' : '#c4c4e5', marginBottom: 4 }}>
                    {lesson.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#6a6a9a', lineHeight: 1.4 }}>
                    {lesson.description}
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* Center - Lesson Content + Editor */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Lesson Header */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(139,92,246,0.1)',
            background: 'rgba(10,10,25,0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: LANGUAGE_META[currentLesson.language].color + '22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: LANGUAGE_META[currentLesson.language].color,
                }}>
                  {LANGUAGE_META[currentLesson.language].icon}
                </div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{currentLesson.title}</h2>
                <span style={{
                  padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700,
                  background: DIFFICULTY_COLORS[currentLesson.difficulty] + '22',
                  color: DIFFICULTY_COLORS[currentLesson.difficulty],
                  textTransform: 'uppercase',
                }}>
                  {currentLesson.difficulty}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#8b8bbf' }}>{currentLesson.description}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!progress[currentLesson.id]?.completed && (
                <button
                  onClick={markComplete}
                  style={{
                    padding: '8px 16px', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                  }}
                >
                  <Award size={14} /> 标记完成
                </button>
              )}
              <button
                onClick={() => setShowChallenge(!showChallenge)}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(251,191,36,0.3)',
                  background: showChallenge ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.04)',
                  color: showChallenge ? '#fbbf24' : '#c4c4e5',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Target size={14} /> 挑战模式
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 4, padding: '10px 24px 0',
            borderBottom: '1px solid rgba(139,92,246,0.08)',
          }}>
            {(['learn', 'practice'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px 10px 0',
                  border: 'none',
                  background: activeTab === tab ? 'rgba(168,85,247,0.15)' : 'transparent',
                  color: activeTab === tab ? '#c4c4e5' : '#6a6a9a',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  borderBottom: activeTab === tab ? '2px solid #a855f7' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {tab === 'learn' ? <><BookOpen size={14} /> 学习</> : <><Code2 size={14} /> 练习</>}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {activeTab === 'learn' ? (
              /* Learning content */
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                <div style={{ maxWidth: 720 }}>
                  <div
                    style={{
                      padding: '20px 24px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 14,
                      border: '1px solid rgba(255,255,255,0.06)',
                      marginBottom: 20,
                    }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(currentLesson.content) }}
                  />

                  {showChallenge && (
                    <div style={{
                      padding: '20px 24px',
                      background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.08))',
                      borderRadius: 14,
                      border: '1px solid rgba(251,191,36,0.25)',
                      marginBottom: 16,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Target size={18} style={{ color: '#fbbf24' }} />
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#fbbf24' }}>挑战任务</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#e0e0f0' }}>
                        {currentLesson.challenge}
                      </p>
                      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                        <button
                          onClick={requestHint}
                          style={{
                            padding: '8px 14px', borderRadius: 8,
                            background: 'rgba(251,191,36,0.15)',
                            border: '1px solid rgba(251,191,36,0.3)',
                            color: '#fbbf24', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                          }}
                        >
                          <Lightbulb size={13} /> 提示
                        </button>
                        <button
                          onClick={generateSolution}
                          disabled={aiLoading}
                          style={{
                            padding: '8px 14px', borderRadius: 8,
                            background: aiLoading ? 'rgba(255,255,255,0.06)' : 'rgba(168,85,247,0.15)',
                            border: '1px solid rgba(168,85,247,0.3)',
                            color: aiLoading ? '#6a6a9a' : '#c4c4e5',
                            fontSize: 12, fontWeight: 600,
                            cursor: aiLoading ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}
                        >
                          {aiLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
                          参考答案
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Practice / Code editor */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                  padding: '10px 20px',
                  background: 'rgba(10,10,25,0.4)',
                  borderBottom: '1px solid rgba(139,92,246,0.08)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Code2 size={14} style={{ color: LANGUAGE_META[currentLesson.language].color }} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                      {LANGUAGE_META[currentLesson.language].label} 编辑器
                    </span>
                    <span style={{ fontSize: 11, color: '#6a6a9a' }}>· 实时执行</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={copyCode} style={ICON_BTN} title="复制代码">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => setCode(currentLesson.code)} style={ICON_BTN} title="重置">
                      <RotateCcw size={14} />
                    </button>
                    <button
                      onClick={runCode}
                      disabled={isRunning || pyodideLoading}
                      style={{
                        padding: '7px 18px', borderRadius: 8, border: 'none',
                        background: isRunning || pyodideLoading
                          ? 'rgba(255,255,255,0.08)'
                          : 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        cursor: isRunning || pyodideLoading ? 'not-allowed' : 'pointer',
                        fontSize: 12, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 6,
                        boxShadow: isRunning || pyodideLoading ? 'none' : '0 4px 14px rgba(16,185,129,0.35)',
                      }}
                    >
                      {isRunning || pyodideLoading
                        ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Play size={14} />}
                      {pyodideLoading ? '加载Pyodide...' : isRunning ? '运行中...' : '运行代码'}
                    </button>
                    <button
                      onClick={explainCode}
                      disabled={aiLoading}
                      style={{
                        padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(168,85,247,0.3)',
                        background: aiLoading ? 'rgba(255,255,255,0.06)' : 'rgba(168,85,247,0.12)',
                        color: aiLoading ? '#6a6a9a' : '#c4c4e5',
                        fontSize: 12, fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <Lightbulb size={13} /> AI 解释
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                  {/* Code Editor */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      spellCheck={false}
                      style={{
                        flex: 1,
                        width: '100%',
                        padding: '18px 20px',
                        border: 'none',
                        background: 'rgba(10,10,25,0.5)',
                        color: '#d4d4e8',
                        fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, monospace',
                        fontSize: 13,
                        lineHeight: '1.7',
                        resize: 'none',
                        outline: 'none',
                        tabSize: 4,
                      }}
                    />
                  </div>

                  {/* Output Panel */}
                  <div style={{
                    width: '44%',
                    borderLeft: '1px solid rgba(139,92,246,0.1)',
                    display: 'flex', flexDirection: 'column',
                    background: 'rgba(5,5,15,0.6)',
                  }}>
                    <div style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid rgba(139,92,246,0.08)',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <Terminal size={13} style={{ color: '#10b981' }} />
                      <span style={{ fontWeight: 600, fontSize: 12 }}>输出结果</span>
                    </div>
                    <div style={{
                      flex: 1,
                      padding: '16px',
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      fontSize: 12,
                      lineHeight: 1.6,
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      color: '#c4c4e5',
                    }}>
                      {output || '点击 "运行代码" 查看输出结果'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - AI Tutor Chat */}
        <aside style={{
          width: 340,
          borderLeft: '1px solid rgba(139,92,246,0.12)',
          background: 'rgba(10,10,25,0.4)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid rgba(139,92,246,0.1)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #f472b6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>AI 导师</div>
              <div style={{ fontSize: 10, color: '#8b8bbf' }}>基于 Pollinations AI</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {chatMessages.map((msg) => {
              const isUser = msg.role === 'user'
              return (
                <div
                  key={msg.id}
                  style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', maxWidth: '100%' }}
                >
                  <div style={{
                    maxWidth: '92%',
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: isUser
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))'
                      : 'rgba(255,255,255,0.04)',
                    border: isUser
                      ? '1px solid rgba(139,92,246,0.25)'
                      : '1px solid rgba(255,255,255,0.06)',
                    fontSize: 13,
                    lineHeight: 1.6,
                    wordBreak: 'break-word',
                  }}>
                    {isUser ? (
                      msg.content
                    ) : (
                      <div dangerouslySetInnerHTML={{
                        __html: renderMarkdown(msg.content),
                      }} />
                    )}
                  </div>
                </div>
              )
            })}
            {aiLoading && (
              <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start' }}>
                <div style={{
                  padding: '12px 14px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', gap: 5, alignItems: 'center',
                }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: 3,
                      background: '#a855f7',
                      animation: `bounce 1.2s ${i * 0.15}s infinite`,
                    }}>
                      <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:.4} 40%{transform:scale(1);opacity:1} }`}</style>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick actions */}
          <div style={{
            padding: '8px 16px',
            display: 'flex', gap: 6, flexWrap: 'wrap',
          }}>
            {['解释当前代码', '如何优化？', '给我一个练习', '这个概念是什么？'].map(q => (
              <button
                key={q}
                onClick={() => setChatInput(q)}
                style={{
                  padding: '5px 10px', borderRadius: 12,
                  border: '1px solid rgba(139,92,246,0.2)',
                  background: 'rgba(139,92,246,0.06)',
                  color: '#b5b5dd', fontSize: 11, fontWeight: 500,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <ChevronRight size={9} /> {q}
              </button>
            ))}
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(139,92,246,0.1)' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="向导师提问..."
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#e8e8ff', fontSize: 13, outline: 'none',
                }}
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim() || aiLoading}
                style={{
                  width: 40, height: 40, borderRadius: 12, border: 'none',
                  background: !chatInput.trim() || aiLoading
                    ? 'rgba(255,255,255,0.06)'
                    : 'linear-gradient(135deg, #a855f7, #6366f1)',
                  color: '#fff', cursor: !chatInput.trim() || aiLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {toast && (
        <div style={{
          position: 'absolute', left: '50%', bottom: 24,
          transform: 'translateX(-50%)',
          padding: '10px 18px',
          background: 'rgba(16,185,129,0.95)',
          color: '#fff', borderRadius: 12,
          fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 28px rgba(16,185,129,0.4)',
          display: 'flex', alignItems: 'center', gap: 8,
          zIndex: 999,
          animation: 'toastIn 0.3s ease-out',
        }}>
          <Check size={15} />
          {toast}
          <style>{`@keyframes toastIn { from { opacity:0; transform: translate(-50%, 10px);} to {opacity:1; transform: translate(-50%,0);} }`}</style>
        </div>
      )}
    </div>
  )
})

export default AICodeTutor
