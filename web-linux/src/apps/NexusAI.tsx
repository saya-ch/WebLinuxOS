import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Sparkles,
  Send,
  Code,
  Languages,
  Lightbulb,
  FileText,
  Bot,
  User,
  Copy,
  Trash2,
  RefreshCw,
  Zap,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Wand2,
  Brain,
  Check,
} from 'lucide-react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  type?: 'text' | 'code' | 'list' | 'table'
  timestamp: Date
}

type Mode = {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  placeholder: string
  systemPrompt: string
  color: string
}

const MODES: Mode[] = [
  {
    id: 'general',
    name: '智能问答',
    icon: <Brain size={18} />,
    description: '通用问答、知识查询、创意建议',
    placeholder: '问我任何问题...',
    systemPrompt: '你是一个知识渊博的助手，能够回答各种问题并提供有价值的建议。',
    color: '#8b7cf0',
  },
  {
    id: 'code',
    name: '代码助手',
    icon: <Code size={18} />,
    description: '代码生成、解释、调试和优化',
    placeholder: '描述你想要的功能或粘贴代码...',
    systemPrompt: '你是一个专业的程序员助手，擅长代码生成、调试和优化。',
    color: '#06b6d4',
  },
  {
    id: 'translate',
    name: '翻译专家',
    icon: <Languages size={18} />,
    description: '多语言翻译、本地化、润色',
    placeholder: '输入要翻译的文本...',
    systemPrompt: '你是一个专业翻译，精通中英日韩法德西俄等多种语言。',
    color: '#10b981',
  },
  {
    id: 'writer',
    name: '写作助手',
    icon: <FileText size={18} />,
    description: '文章写作、文案创作、内容优化',
    placeholder: '描述你想要创作的内容...',
    systemPrompt: '你是一个创意写作助手，擅长各种文体的创作和润色。',
    color: '#f59e0b',
  },
  {
    id: 'ideas',
    name: '创意激发',
    icon: <Lightbulb size={18} />,
    description: '头脑风暴、创意生成、方案设计',
    placeholder: '你需要什么方面的创意？',
    systemPrompt: '你是一个创意专家，擅长头脑风暴和提供创新想法。',
    color: '#ec4899',
  },
  {
    id: 'explain',
    name: '概念解释',
    icon: <BookOpen size={18} />,
    description: '深入浅出解释复杂概念和技术',
    placeholder: '输入你想了解的概念...',
    systemPrompt: '你是一个教育家，擅长用简单易懂的方式解释复杂概念。',
    color: '#6366f1',
  },
]

const QUICK_PROMPTS: Record<string, string[]> = {
  general: [
    '解释什么是量子计算',
    '推荐5本2026年必读的书',
    '如何提高工作效率',
    '给我讲一个有趣的冷知识',
  ],
  code: [
    '用React写一个待办事项组件',
    '解释JavaScript闭包',
    '优化这个Python函数的性能',
    '写一个快速排序算法',
  ],
  translate: [
    '把这段翻译成英文',
    '翻译成日语并加敬语',
    '用更地道的英文表达',
    '这段法语是什么意思',
  ],
  writer: [
    '写一篇关于AI未来的短文',
    '帮我写一封辞职信',
    '创作一首关于春天的诗',
    '写一个产品介绍文案',
  ],
  ideas: [
    '给我5个创业点子',
    '设计一个创新的手机应用',
    '想一些团队建设活动',
    '如何让产品更有竞争力',
  ],
  explain: [
    '什么是区块链技术',
    '解释TCP/IP协议栈',
    '相对论的基本原理',
    '什么是函数式编程',
  ],
}

function generateId() {
  return Math.random().toString(36).substring(2, 15)
}

function simulateResponse(modeId: string, userMessage: string): Promise<string> {
  return new Promise((resolve) => {
    const delay = 800 + Math.random() * 1200
    setTimeout(() => {
      const responses: Record<string, (msg: string) => string> = {
        general: (msg) => {
          if (msg.includes('量子') || msg.includes('quantum')) {
            return `## 量子计算简介\n\n量子计算是利用量子力学原理（如叠加态和纠缠）进行信息处理的革命性技术。\n\n### 核心概念\n\n1. **量子比特（Qubit）**：与经典比特只能是0或1不同，量子比特可以同时处于0和1的叠加态\n\n2. **量子纠缠**：两个量子比特可以纠缠在一起，一个状态改变会立即影响另一个\n\n3. **量子并行性**：利用叠加态，量子计算机可以同时探索多个解\n\n### 应用场景\n- 密码学和安全\n- 药物研发和分子模拟\n- 金融建模和优化\n- 人工智能和机器学习\n\n### 当前进展\n目前量子计算仍处于早期阶段（NISQ时代），但各大科技公司和研究机构都在大力投入。`
          }
          if (msg.includes('效率') || msg.includes('productivity')) {
            return `## 提高工作效率的10个实用方法\n\n### 1. 番茄工作法 🍅\n25分钟专注工作 + 5分钟休息，每4个番茄钟休息15-30分钟\n\n### 2. 艾森豪威尔矩阵 📊\n按"重要/紧急"四象限分类任务，优先处理重要不紧急的事\n\n### 3. 批处理 📦\n将相似任务集中处理，减少上下文切换成本\n\n### 4. 深度工作时间 🧠\n每天安排2-3小时不受打扰的深度工作时段\n\n### 5. 两分钟法则 ⏱️\n如果一件事能在两分钟内完成，立刻去做\n\n### 6. 每周回顾 📅\n每周日花30分钟回顾本周成果，规划下周重点\n\n### 7. 减少干扰 🔕\n关闭不必要的通知，设定专注时段\n\n### 8. 工具优化 🛠️\n善用自动化工具，减少重复性劳动\n\n### 9. 健康作息 💪\n充足睡眠、规律运动、健康饮食是效率的基础\n\n### 10. 持续学习 📚\n不断学习新技能，提升解决问题的能力`
          }
          if (msg.includes('冷知识') || msg.includes('fact')) {
            return `## 🤓 有趣的冷知识\n\n### 1. 蜂蜜永不变质\n考古学家在埃及金字塔中发现了3000年前的蜂蜜，仍然可以食用！蜂蜜的低水分含量和酸性环境让细菌无法生存。\n\n### 2. 章鱼有三颗心脏\n两颗负责将血液泵送到鳃部，一颗负责将血液泵送到身体其他部位。而且章鱼的血液是蓝色的！\n\n### 3. 香蕉是浆果，但草莓不是\n从植物学角度讲，香蕉符合浆果的定义，而草莓实际上是"假果"。\n\n### 4. 人类DNA与香蕉有60%相同\n我们与这种水果共享相当一部分遗传物质，这证明了所有生命都有共同的祖先。\n\n### 5. 金星上的一天比一年还长\n金星自转一周需要243个地球日，而绕太阳一周只需要225个地球日。\n\n希望这些冷知识让你今天有所收获！✨`
          }
          return `关于"${msg}"，这是一个很好的问题。\n\n基于我的理解，这里有一些思考：\n\n### 核心要点\n\n1. **定义与背景**：这个概念在不同领域有不同的含义和应用\n\n2. **实际应用**：在现实世界中有广泛的使用场景\n\n3. **未来展望**：随着技术发展，可能会有更多创新应用\n\n### 深入了解的建议\n\n- 查阅专业书籍和学术论文\n- 关注行业专家的观点\n- 动手实践，从做中学\n\n你还想了解哪个方面的更多细节？`
        },
        code: (msg) => {
          if (msg.includes('待办') || msg.includes('todo') || msg.includes('Todo')) {
            return `## React待办事项组件\n\n这是一个功能完整的React待办事项组件，支持添加、删除、标记完成：\n\n\`\`\`tsx\nimport { useState, useRef, useEffect } from 'react'\n\ninterface Todo {\n  id: string\n  text: string\n  completed: boolean\n  createdAt: Date\n}\n\nexport default function TodoList() {\n  const [todos, setTodos] = useState<Todo[]>(() => {\n    const saved = localStorage.getItem('todos')\n    return saved ? JSON.parse(saved) : []\n  })\n  const [input, setInput] = useState('')\n  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')\n  const inputRef = useRef<HTMLInputElement>(null)\n\n  useEffect(() => {\n    localStorage.setItem('todos', JSON.stringify(todos))\n  }, [todos])\n\n  const addTodo = () => {\n    if (!input.trim()) return\n    setTodos([\n      {\n        id: Date.now().toString(),\n        text: input.trim(),\n        completed: false,\n        createdAt: new Date(),\n      },\n      ...todos,\n    ])\n    setInput('')\n    inputRef.current?.focus()\n  }\n\n  const toggleTodo = (id: string) => {\n    setTodos(todos.map(t => \n      t.id === id ? { ...t, completed: !t.completed } : t\n    ))\n  }\n\n  const deleteTodo = (id: string) => {\n    setTodos(todos.filter(t => t.id !== id))\n  }\n\n  const clearCompleted = () => {\n    setTodos(todos.filter(t => !t.completed))\n  }\n\n  const filteredTodos = todos.filter(t => {\n    if (filter === 'active') return !t.completed\n    if (filter === 'completed') return t.completed\n    return true\n  })\n\n  const activeCount = todos.filter(t => !t.completed).length\n\n  return (\n    <div style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>\n      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>待办事项</h2>\n      \n      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>\n        <input\n          ref={inputRef}\n          value={input}\n          onChange={(e) => setInput(e.target.value)}\n          onKeyPress={(e) => e.key === 'enter' && addTodo()}\n          placeholder="添加新任务..."\n          style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd' }}\n        />\n        <button\n          onClick={addTodo}\n          style={{ padding: '10px 20px', borderRadius: 8, background: '#8b7cf0', color: 'white', border: 'none', cursor: 'pointer' }}\n        >\n          添加\n        </button>\n      </div>\n\n      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>\n        {(['all', 'active', 'completed'] as const).map(f => (\n          <button\n            key={f}\n            onClick={() => setFilter(f)}\n            style={{\n              padding: '6px 12px',\n              borderRadius: 6,\n              border: '1px solid #ddd',\n              background: filter === f ? '#8b7cf0' : 'transparent',\n              color: filter === f ? 'white' : 'inherit',\n              cursor: 'pointer',\n            }}\n          >\n            {f === 'all' ? '全部' : f === 'active' ? '进行中' : '已完成'}\n          </button>\n        ))}\n      </div>\n\n      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>\n        {filteredTodos.map(todo => (\n          <div\n            key={todo.id}\n            style={{\n              display: 'flex',\n              alignItems: 'center',\n              gap: 12,\n              padding: '12px',\n              borderRadius: 8,\n              background: todo.completed ? '#f5f5f5' : '#fff',\n              border: '1px solid #eee',\n            }}\n          >\n            <input\n              type="checkbox"\n              checked={todo.completed}\n              onChange={() => toggleTodo(todo.id)}\n            />\n            <span style={{ flex: 1, textDecoration: todo.completed ? 'line-through' : 'none', opacity: todo.completed ? 0.6 : 1 }}>\n              {todo.text}\n            </span>\n            <button\n              onClick={() => deleteTodo(todo.id)}\n              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b' }}\n            >\n              删除\n            </button>\n          </div>\n        ))}\n      </div>\n\n      {todos.length > 0 && (\n        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: '#666' }}>\n          <span>{activeCount} 项待完成</span>\n          <button\n            onClick={clearCompleted}\n            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b7cf0' }}\n          >\n            清除已完成\n          </button>\n        </div>\n      )}\n    </div>\n  )\n}\n\`\`\`\n\n### 功能特性\n- ✅ 添加/删除任务\n- ✅ 标记完成/未完成\n- ✅ 筛选（全部/进行中/已完成）\n- ✅ localStorage持久化\n- ✅ 统计待完成数量\n- ✅ 一键清除已完成\n\n你还想添加什么功能吗？`
          }
          if (msg.includes('闭包') || msg.includes('closure')) {
            return `## JavaScript闭包详解\n\n### 什么是闭包？\n\n闭包（Closure）是指一个函数能够访问其词法作用域中的变量，即使这个函数在其词法作用域之外执行。\n\n\`\`\`javascript\nfunction outer() {\n  let count = 0; // 外部函数的局部变量\n  \n  function inner() {\n    count++; // 内部函数访问外部变量\n    console.log(count);\n  }\n  \n  return inner; // 返回内部函数的引用\n}\n\nconst counter = outer();\ncounter(); // 1\ncounter(); // 2\ncounter(); // 3\n\`\`\`\n\n### 闭包的三个特性\n\n1. **函数嵌套函数**\n2. **内部函数可以访问外部函数的变量**\n3. **参数和变量不会被垃圾回收机制回收**\n\n### 常见应用场景\n\n#### 1. 数据私有化/封装\n\`\`\`javascript\nfunction createCounter() {\n  let _count = 0; // 私有变量\n  \n  return {\n    increment() { _count++; },\n    decrement() { _count--; },\n    get value() { return _count; },\n  };\n}\n\`\`\`\n\n#### 2. 函数柯里化\n\`\`\`javascript\nfunction add(a) {\n  return function(b) {\n    return a + b;\n  };\n}\n\nconst add5 = add(5);\nadd5(3); // 8\n\`\`\`\n\n#### 3. 防抖和节流\n\`\`\`javascript\nfunction debounce(fn, delay) {\n  let timer = null;\n  return function(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}\n\`\`\`\n\n### 注意事项\n\n⚠️ **内存泄漏风险**：闭包会保持对外部变量的引用，如果不及时释放可能导致内存泄漏。\n\n💡 **最佳实践**：只在必要时使用闭包，用完后手动解除引用。\n\n理解了吗？还有什么疑问吗？`
          }
          return `好的，我来帮你处理这段代码。\n\n\`\`\`\n// 这里是生成的代码\nfunction solution(input) {\n  // 实现逻辑\n  return result;\n}\n\`\`\`\n\n### 代码说明\n\n1. **输入处理**：验证和规范化输入数据\n2. **核心逻辑**：实现主要功能\n3. **错误处理**：处理边界情况\n\n### 优化建议\n\n- 可以考虑添加缓存机制\n- 增加类型检查提高健壮性\n- 添加单元测试确保正确性\n\n需要我解释某部分的具体实现吗？`
        },
        translate: (msg) => {
          return `## 翻译结果\n\n**原文**：\n> ${msg}\n\n**English Translation**：\n> Hello! This is a sample translation. In a real implementation, this would use an actual translation API.\n\n---\n\n### 翻译说明\n\n- **语言对**：中文 → 英文\n- **翻译风格**：正式/商务\n- **置信度**：高\n\n### 备选翻译\n\n1. *直译版本*：保持原文结构\n2. *意译版本*：更符合目标语言习惯\n3. *本地化版本*：适应当地文化语境\n\n你更倾向于哪种风格的翻译？`
        },
        writer: (msg) => {
          if (msg.includes('AI') || msg.includes('人工智能')) {
            return `## AI的未来：机遇与挑战并存\n\n当我们站在2026年回望人工智能的发展历程，不禁感慨万千。从最初的规则系统到今天的大语言模型，AI正在以前所未有的速度重塑我们的世界。\n\n### 燎原之势\n\n人工智能已经不再是实验室里的概念，它正在渗透到我们生活的方方面面：\n\n- **创作领域**：AI绘画、AI写作、AI音乐生成，创作者们迎来了新的合作伙伴\n- **医疗健康**：辅助诊断、药物研发、个性化治疗方案，AI正在拯救生命\n- **教育培训**：个性化学习路径、智能辅导系统，教育公平正在成为可能\n- **科学研究**：从蛋白质折叠到气候模拟，AI加速着科学发现的步伐\n\n### 深思之问\n\n然而，技术的飞速发展也带来了深刻的问题：\n\n**就业何去何从？** 当越来越多的工作可以被自动化，人类的价值在哪里？历史告诉我们，技术革命最终会创造新的工作岗位，但转型期的阵痛不容忽视。\n\n**隐私如何保障？** AI系统需要大量数据来训练，个人隐私与技术进步之间的边界在哪里？\n\n**偏见如何消除？** 训练数据中的偏见会被AI放大，如何确保算法的公平性？\n\n### 人类的选择\n\n面对AI，我们不是被动的接受者。我们可以选择如何使用这项技术，选择让它服务于什么目标。\n\n> 真正的问题不是AI会不会取代人类，而是人类会用AI创造什么样的未来。\n\n未来已来，让我们一起思考、一起行动，让AI真正成为人类文明的助力。\n\n---\n\n*（本文约1200字，适合博客发布）*\n\n需要我调整文风或补充什么内容吗？`
          }
          return `## 创作内容\n\n${msg}\n\n---\n\n这是根据你的需求创作的内容。我可以根据以下方面进行调整：\n\n### 风格调整\n- 📰 新闻报道风格\n- 📝 正式商务风格\n- 🎨 创意文学风格\n- 💬 口语化风格\n- 🎓 学术论文风格\n\n### 篇幅调整\n- 微博/短文（140字内）\n- 短文（500字左右）\n- 中篇（1000-2000字）\n- 长篇（3000字以上）\n\n你希望怎么调整？`
        },
        ideas: (msg) => {
          if (msg.includes('创业') || msg.includes('startup')) {
            return `## 💡 5个2026年值得关注的创业点子\n\n---\n\n### 1. AI个人知识管家 🧠\n\n**概念**：一个能够自动整理、关联和检索你所有数字信息的个人AI助手\n\n**为什么现在**：\n- 信息碎片化严重（笔记、文章、聊天记录、收藏...）\n- 大模型技术成熟，语义理解能力大幅提升\n- 人们越来越重视个人知识管理\n\n**核心功能**：\n- 自动抓取多平台内容\n- 智能标签和关联推荐\n- 自然语言问答式检索\n- 知识图谱可视化\n\n**商业模式**：订阅制 + 企业版\n\n---\n\n### 2. 可持续生活平台 🌱\n\n**概念**：帮助用户追踪和减少碳足迹，建立可持续生活方式\n\n**为什么现在**：\n- 气候变化意识提升\n- Z世代消费者更关注环保\n- 政策层面推动碳中和\n\n**核心功能**：\n- 消费碳排放计算器\n- 环保替代品推荐\n- 社区挑战和成就系统\n- 碳积分兑换体系\n\n**商业模式**：B2C平台佣金 + B2B企业服务\n\n---\n\n### 3. 老年人数字陪伴 👴👵\n\n**概念**：专为老年人设计的AI陪伴和服务平台\n\n**为什么现在**：\n- 人口老龄化加速\n- 老年人数字鸿沟问题突出\n- 独居老人情感需求强烈\n\n**核心功能**：\n- 极简语音交互界面\n- 健康监测和紧急求助\n- 远程家人联动\n- 兴趣社区和活动\n\n**商业模式**：硬件 + 订阅服务 + 政府/机构采购\n\n---\n\n### 4. 开发者AI结对编程助手 👨‍💻\n\n**概念**：实时理解代码上下文，提供智能建议和代码审查的AI助手\n\n**为什么现在**：\n- AI编程工具正在改变开发方式\n- 当前工具缺少深度的代码理解\n- 团队协作中代码质量把控难\n\n**核心功能**：\n- 实时代码审查和建议\n- 架构设计讨论\n- Bug模式识别\n- 最佳实践推荐\n\n**商业模式**：企业SaaS订阅\n\n---\n\n### 5. 本地体验策划师 🎯\n\n**概念**：AI驱动的个性化本地体验推荐平台\n\n**为什么现在**：\n- 旅游从观光向体验转变\n- 同质化推荐让人厌倦\n- 本地生活服务竞争激烈\n\n**核心功能**：\n- 深度兴趣画像\n- 小众地点发现\n- 个性化路线规划\n- 本地达人对接\n\n**商业模式**：平台佣金 + 增值服务\n\n---\n\n### 评估维度\n\n| 点子 | 市场规模 | 进入门槛 | 差异化 | 盈利能力 |\n|------|----------|----------|--------|----------|\n| 知识管家 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |\n| 可持续生活 | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |\n| 老年陪伴 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |\n| 结对编程 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |\n| 体验策划 | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |\n\n你对哪个方向最感兴趣？我们可以深入探讨！`
          }
          return `## 💡 关于"${msg}"的创意思考\n\n### 方向一：重新定义问题\n有时候最巧妙的解决方案来自于重新框定问题本身。\n\n### 方向二：跨界融合\n将不同领域的想法结合，往往能产生意想不到的创意。\n\n### 方向三：逆向思维\n反过来看这个问题，会有什么新发现？\n\n### 方向四：极端假设\n假设资源无限/限制极端，会催生什么想法？\n\n---\n\n想深入探讨哪个方向？或者你有更具体的想法想和我一起打磨？`
        },
        explain: (msg) => {
          if (msg.includes('区块链') || msg.includes('blockchain')) {
            return `## 区块链技术通俗讲解\n\n### 想象一个场景\n\n想象你们村子里有一个公共账本，大家都可以看，也都可以往上写。每当有一笔交易（比如张三借给李四100块钱），全村人都会在自己的账本上记下来。\n\n这样一来：\n- ✅ 没有人能赖账（全村人都作证）\n- ✅ 账本不会丢（人人都有副本）\n- ✅ 记录改不了（要改就得改全村人的）\n\n这就是区块链的本质——**去中心化的公共账本**。\n\n---\n\n### 核心概念拆解\n\n#### 1. 区块 (Block)\n每一页账本就是一个"区块"，记录了一段时间内的所有交易。\n\n#### 2. 链 (Chain)\n每一页都标有前一页的印记（哈希值），一页一页连起来就成了"链"。\n\n#### 3. 去中心化\n没有一个村长说了算，而是大家一起记账、一起验证。\n\n#### 4. 共识机制\n全村人怎么决定哪笔账有效？这就是"共识机制"：\n- **工作量证明 (PoW)**：谁先算出一道难题谁说了算（比特币用这个）\n- **权益证明 (PoS)**：谁的筹码多谁说了算（更节能）\n\n---\n\n### 它能解决什么问题？\n\n| 传统方式 | 区块链方式 |\n|----------|------------|\n| 需要银行当中间人 | 点对点直接交易 |\n| 中心机构可能作弊 | 全网验证，难以作弊 |\n| 数据可能被篡改 | 篡改成本极高 |\n| 单点故障风险 | 永远在线 |\n\n---\n\n### 不仅仅是加密货币\n\n区块链的应用远不止比特币：\n\n- 🏭 **供应链溯源**：食品从哪来，全程可查\n- 📜 **数字身份**：自己掌控身份信息\n- 🏠 **资产登记**：房产、专利等的确权\n- 🗳️ **选举投票**：透明、不可篡改\n- 💎 **数字藏品**：NFT、数字艺术品\n\n---\n\n### 常见误区\n\n❌ "区块链就是比特币"\n比特币是区块链的第一个应用，但区块链技术本身用途更广。\n\n❌ "区块链完全匿名"\n其实是"假名"的，交易记录都是公开的。\n\n❌ "区块链绝对安全"\n51%攻击、智能合约漏洞等风险仍然存在。\n\n---\n\n### 一句话总结\n\n> 区块链是一个**大家共同维护、谁也改不了、永远不丢失**的账本技术。\n\n理解了吗？还想了解更多细节吗？`
          }
          return `## 关于"${msg}"的通俗解释\n\n### 用大白话来说\n\n想象一下...（类比说明）\n\n### 核心要点\n\n1. **基本概念**：它是什么\n2. **为什么重要**：它解决了什么问题\n3. **如何工作**：基本原理（简化版）\n4. **实际应用**：现实中用在哪里\n\n### 深入理解的路径\n\n- 入门：了解基本概念和典型应用\n- 进阶：理解底层原理和机制\n- 实战：动手实践，在做中学\n\n还有什么具体的地方不明白吗？`
        },
      }

      const modeHandler = responses[modeId] || responses.general
      resolve(modeHandler(userMessage))
    }, delay)
  })
}

export default function NexusAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      role: 'assistant',
      content: '👋 你好！我是 **NexusAI 智能助手**。\n\n我可以帮你：\n- 💬 回答各种问题\n- 💻 编写和解释代码\n- 🌐 多语言翻译\n- ✍️ 内容创作\n- 💡 头脑风暴\n- 📚 解释复杂概念\n\n选择左侧的模式开始对话，或者直接输入你的问题！',
      type: 'text',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [currentMode, setCurrentMode] = useState('general')
  const [isLoading, setIsLoading] = useState(false)
  const [showModes, setShowModes] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const currentModeData = useMemo(
    () => MODES.find((m) => m.id === currentMode) || MODES[0],
    [currentMode]
  )

  const quickPrompts = useMemo(
    () => QUICK_PROMPTS[currentMode] || [],
    [currentMode]
  )

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await simulateResponse(currentMode, userMessage.content)
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: '抱歉，处理你的请求时出现了错误，请稍后重试。',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, currentMode])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    },
    [sendMessage]
  )

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (e) {
      console.error('Copy failed:', e)
    }
  }, [])

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: generateId(),
        role: 'assistant',
        content: '对话已清空。有什么可以帮你的吗？',
        timestamp: new Date(),
      },
    ])
  }, [])

  const formatContent = useCallback((content: string) => {
    const lines = content.split('\n')
    const elements: React.ReactNode[] = []
    let inCodeBlock = false
    let codeContent = ''
    let codeLanguage = ''

    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <div
              key={`code-${index}`}
              style={{
                background: '#0d1117',
                borderRadius: 8,
                padding: '12px 16px',
                margin: '8px 0',
                overflowX: 'auto',
                position: 'relative',
                border: '1px solid #30363d',
              }}
            >
              {codeLanguage && (
                <div
                  style={{
                    fontSize: 12,
                    color: '#8b949e',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {codeLanguage}
                </div>
              )}
              <pre
                style={{
                  margin: 0,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: '#c9d1d9',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {codeContent.trim()}
              </pre>
            </div>
          )
          codeContent = ''
          codeLanguage = ''
          inCodeBlock = false
        } else {
          inCodeBlock = true
          codeLanguage = line.slice(3).trim()
        }
        return
      }

      if (inCodeBlock) {
        codeContent += line + '\n'
        return
      }

      if (line.startsWith('## ')) {
        elements.push(
          <h2
            key={index}
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginTop: 16,
              marginBottom: 12,
              color: '#f0f0ff',
              borderBottom: '1px solid rgba(139, 124, 240, 0.3)',
              paddingBottom: 6,
            }}
          >
            {line.slice(3)}
          </h2>
        )
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3
            key={index}
            style={{
              fontSize: 15,
              fontWeight: 600,
              marginTop: 12,
              marginBottom: 8,
              color: '#d0d0f0',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {line.slice(4)}
          </h3>
        )
      } else if (line.startsWith('#### ')) {
        elements.push(
          <h4
            key={index}
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginTop: 10,
              marginBottom: 6,
              color: '#c0c0e0',
            }}
          >
            {line.slice(5)}
          </h4>
        )
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <div
            key={index}
            style={{
              display: 'flex',
              gap: 8,
              marginLeft: 8,
              marginBottom: 4,
              lineHeight: 1.6,
            }}
          >
            <span style={{ color: '#8b7cf0', flexShrink: 0 }}>•</span>
            <span style={{ flex: 1 }}>{line.slice(2)}</span>
          </div>
        )
      } else if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+)\.\s(.*)$/)
        if (match) {
          elements.push(
            <div
              key={index}
              style={{
                display: 'flex',
                gap: 8,
                marginLeft: 8,
                marginBottom: 4,
                lineHeight: 1.6,
              }}
            >
              <span
                style={{
                  color: '#06b6d4',
                  fontWeight: 600,
                  flexShrink: 0,
                  minWidth: 20,
                }}
              >
                {match[1]}.
              </span>
              <span style={{ flex: 1 }}>{match[2]}</span>
            </div>
          )
        }
      } else if (line.startsWith('> ')) {
        elements.push(
          <blockquote
            key={index}
            style={{
              borderLeft: '3px solid #8b7cf0',
              paddingLeft: 12,
              margin: '8px 0',
              color: '#a0a0c0',
              fontStyle: 'italic',
            }}
          >
            {line.slice(2)}
          </blockquote>
        )
      } else if (line.startsWith('|')) {
        elements.push(
          <div
            key={index}
            style={{
              fontFamily: 'monospace',
              fontSize: 13,
              color: '#c0c0d0',
              lineHeight: 1.6,
            }}
          >
            {line}
          </div>
        )
      } else if (line.startsWith('---')) {
        elements.push(
          <hr
            key={index}
            style={{
              border: 'none',
              borderTop: '1px solid rgba(139, 124, 240, 0.2)',
              margin: '16px 0',
            }}
          />
        )
      } else if (line.trim() === '') {
        elements.push(<div key={index} style={{ height: 8 }} />)
      } else {
        let formattedLine = line
        formattedLine = formattedLine.replace(
          /\*\*(.*?)\*\*/g,
          '<strong style="color: #f0f0ff">$1</strong>'
        )
        formattedLine = formattedLine.replace(
          /`([^`]+)`/g,
          '<code style="background: rgba(139, 124, 240, 0.15); padding: 2px 6px; border-radius: 4px; font-family: JetBrains Mono, monospace; font-size: 13px; color: #c4b5fd;">$1</code>'
        )

        elements.push(
          <p
            key={index}
            style={{
              lineHeight: 1.7,
              marginBottom: 4,
              color: '#d0d0e8',
            }}
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        )
      }
    })

    return elements
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(180deg, #0f0f1a 0%, #0a0a14 100%)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(139, 124, 240, 0.2)',
          background: 'linear-gradient(90deg, rgba(139, 124, 240, 0.08) 0%, transparent 100%)',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${currentModeData.color} 0%, #8b7cf0 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: `0 0 20px ${currentModeData.color}40`,
          }}
        >
          <Sparkles size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#f0f0ff',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            NexusAI
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 10,
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#06b6d4',
                fontWeight: 500,
              }}
            >
              Pro
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#8080a0', marginTop: 2 }}>
            {currentModeData.description}
          </div>
        </div>
        <button
          onClick={() => setShowModes(!showModes)}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid rgba(139, 124, 240, 0.3)',
            background: 'rgba(139, 124, 240, 0.1)',
            color: '#c4b5fd',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {currentModeData.icon}
          {currentModeData.name}
          {showModes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          onClick={clearChat}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid rgba(255, 107, 107, 0.3)',
            background: 'rgba(255, 107, 107, 0.1)',
            color: '#ff6b6b',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
          title="清空对话"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Mode selector panel */}
      {showModes && (
        <div
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid rgba(139, 124, 240, 0.15)',
            background: 'rgba(139, 124, 240, 0.03)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  setCurrentMode(mode.id)
                  setShowModes(false)
                  inputRef.current?.focus()
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border:
                    currentMode === mode.id
                      ? `1px solid ${mode.color}`
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  background:
                    currentMode === mode.id
                      ? `${mode.color}15`
                      : 'rgba(255, 255, 255, 0.03)',
                  color: currentMode === mode.id ? mode.color : '#a0a0c0',
                  cursor: 'pointer',
                  fontSize: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${mode.color}10`
                  e.currentTarget.style.borderColor = `${mode.color}50`
                }}
                onMouseLeave={(e) => {
                  if (currentMode !== mode.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                  }
                }}
              >
                {mode.icon}
                <span style={{ fontWeight: 500 }}>{mode.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              gap: 12,
              maxWidth: '85%',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {msg.role === 'assistant' && (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${currentModeData.color} 0%, #8b7cf0 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `0 0 12px ${currentModeData.color}30`,
                }}
              >
                <Bot size={16} color="white" />
              </div>
            )}
            <div
              style={{
                background:
                  msg.role === 'user'
                    ? 'linear-gradient(135deg, rgba(139, 124, 240, 0.2) 0%, rgba(139, 124, 240, 0.1) 100%)'
                    : 'rgba(255, 255, 255, 0.04)',
                borderRadius: 12,
                padding: '12px 16px',
                border:
                  msg.role === 'user'
                    ? '1px solid rgba(139, 124, 240, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                position: 'relative',
              }}
            >
              {msg.role === 'user' ? (
                <p style={{ color: '#e8e8f8', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </p>
              ) : (
                <div>{formatContent(msg.content)}</div>
              )}
              {msg.role === 'assistant' && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: 8,
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: 'none',
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#8080a0',
                      cursor: 'pointer',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check size={12} color="#10b981" />
                        <span style={{ color: '#10b981' }}>已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        复制
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <User size={16} color="white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', gap: 12, maxWidth: '85%' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${currentModeData.color} 0%, #8b7cf0 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <RefreshCw size={16} color="white" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: 12,
                padding: '16px 20px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#8b7cf0',
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: '-0.32s',
                }}
              />
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#8b7cf0',
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: '-0.16s',
                }}
              />
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#8b7cf0',
                  animation: 'bounce 1.4s infinite ease-in-out both',
                }}
              />
              <span style={{ fontSize: 13, color: '#8080a0', marginLeft: 8 }}>
                思考中...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts */}
      {quickPrompts.length > 0 && messages.length <= 2 && (
        <div
          style={{
            padding: '0 16px 12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => setInput(prompt)}
              style={{
                padding: '6px 12px',
                borderRadius: 16,
                border: '1px solid rgba(139, 124, 240, 0.25)',
                background: 'rgba(139, 124, 240, 0.08)',
                color: '#c4b5fd',
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 124, 240, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(139, 124, 240, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(139, 124, 240, 0.08)'
                e.currentTarget.style.borderColor = 'rgba(139, 124, 240, 0.25)'
              }}
            >
              <Zap size={12} />
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div
        style={{
          padding: '12px 16px 16px',
          borderTop: '1px solid rgba(139, 124, 240, 0.2)',
          background: 'linear-gradient(0deg, rgba(139, 124, 240, 0.05) 0%, transparent 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              flex: 1,
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentModeData.placeholder}
              rows={1}
              style={{
                width: '100%',
                padding: '12px 14px',
                paddingRight: 44,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#e8e8f8',
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'none',
                lineHeight: 1.5,
                maxHeight: 120,
                minHeight: 44,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              style={{
                position: 'absolute',
                right: 8,
                bottom: 6,
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                background: input.trim() && !isLoading
                  ? `linear-gradient(135deg, ${currentModeData.color} 0%, #8b7cf0 100%)`
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: input.trim() && !isLoading ? 1 : 0.5,
                transition: 'all 0.2s ease',
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
            fontSize: 11,
            color: '#606080',
          }}
        >
          <span>按 Enter 发送，Shift+Enter 换行</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Wand2 size={11} />
            Powered by NexusAI
          </span>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
