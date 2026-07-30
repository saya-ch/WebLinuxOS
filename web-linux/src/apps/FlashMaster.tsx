import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  BookOpen, Layers, BarChart3, Plus, Trash2, Edit3, ChevronRight,
  Search, Download, Upload, Flame, Calendar, Target,
  Clock, Star, X, Check, RotateCcw, Settings, Filter,
  Tag, Brain, Zap, Trophy, Play, Eye, FileJson,
  AlertCircle, Sparkles, ArrowLeft, Home, PieChart as PieIcon
} from 'lucide-react'

// ============================================================
// TYPE DEFINITIONS
// ============================================================
type Rating = 'again' | 'hard' | 'good' | 'easy'
type DifficultyPreset = 'beginner' | 'intermediate' | 'advanced'
type View = 'study' | 'browse' | 'stats'
type MasteryLevel = 'new' | 'learning' | 'review' | 'mastered'

interface ReviewLog {
  date: string
  rating: Rating
  intervalBefore: number
  intervalAfter: number
}

interface Card {
  id: string
  deckId: string
  front: string
  back: string
  tags: string[]
  difficulty: DifficultyPreset
  createdAt: string
  lastReviewedAt: string | null
  nextReviewAt: string
  ef: number
  interval: number
  reps: number
  lapses: number
  due: boolean
  isLeech: boolean
  reviewHistory: ReviewLog[]
}

interface Deck {
  id: string
  name: string
  description: string
  color: string
  icon: string
  createdAt: string
  newCardsPerDay: number
  reviewsPerDay: number
  isBuiltin: boolean
  cards?: Card[]
}

interface StudySession {
  date: string
  reviewed: number
  correct: number
  newCards: number
  durationSec: number
}

interface AppState {
  decks: Deck[]
  cards: Card[]
  sessions: StudySession[]
  settings: {
    dailyNewLimit: number
    dailyReviewLimit: number
    againIntervalMin: number
    hardIntervalMin: number
    goodIntervalMin: number
  }
  currentStreak: number
  longestStreak: number
  lastStudyDate: string | null
}

// ============================================================
// CONSTANTS & HELPERS
// ============================================================
const STORAGE_KEY = 'flashmaster-v1'
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
const todayStr = () => new Date().toISOString().slice(0, 10)
const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const DECK_COLORS = [
  'linear-gradient(135deg, #7c3aed, #a855f7)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #10b981, #14b8a6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #6366f1, #06b6d4)',
]

const RATING_STYLES: Record<Rating, { label: string; sub: string; bg: string; border: string; text: string; icon: string }> = {
  again: { label: '重来', sub: '<1 分钟', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#f87171', icon: '🔴' },
  hard: { label: '困难', sub: '~10 分钟', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#fbbf24', icon: '🟠' },
  good: { label: '良好', sub: '按间隔', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.4)', text: '#22d3ee', icon: '🟢' },
  easy: { label: '简单', sub: '×1.3', bg: 'rgba(124,58,237,0.18)', border: 'rgba(124,58,237,0.45)', text: '#c4b5fd', icon: '🟣' },
}

// ============================================================
// SM-2 ALGORITHM
// ============================================================
function applySM2(card: Card, rating: Rating): Card {
  const q = { again: 0, hard: 3, good: 4, easy: 5 }[rating]
  const now = todayStr()
  const prevInterval = card.interval

  let ef = card.ef
  let interval = card.interval
  let reps = card.reps
  let lapses = card.lapses

  ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))

  if (q < 3) {
    reps = 0
    interval = 1
    lapses += 1
  } else {
    reps += 1
    if (reps === 1) {
      interval = rating === 'easy' ? 4 : 1
    } else if (reps === 2) {
      interval = rating === 'easy' ? 8 : (rating === 'hard' ? 3 : 6)
    } else {
      let mult = ef
      if (rating === 'hard') mult = ef * 0.8
      if (rating === 'easy') mult = ef * 1.3
      interval = Math.max(1, Math.round(interval * mult))
    }
  }

  const isLeech = card.isLeech || lapses >= 8

  const history: ReviewLog = {
    date: now,
    rating,
    intervalBefore: prevInterval,
    intervalAfter: interval,
  }

  return {
    ...card,
    ef: +ef.toFixed(2),
    interval,
    reps,
    lapses,
    lastReviewedAt: now,
    nextReviewAt: addDays(now, interval),
    due: false,
    isLeech,
    reviewHistory: [...card.reviewHistory, history].slice(-50),
  }
}

const DEFAULT_EF = 2.5
const newCard = (deckId: string, front: string, back: string, tags: string[] = [], difficulty: DifficultyPreset = 'intermediate'): Card => ({
  id: uid(),
  deckId,
  front,
  back,
  tags,
  difficulty,
  createdAt: todayStr(),
  lastReviewedAt: null,
  nextReviewAt: todayStr(),
  ef: DEFAULT_EF,
  interval: 0,
  reps: 0,
  lapses: 0,
  due: true,
  isLeech: false,
  reviewHistory: [],
})

// ============================================================
// SAMPLE DECK DATA
// ============================================================
const ENGLISH_WORDS = [
  ['abandon', '/əˈbændən/', 'v. 放弃；抛弃', 'He abandoned his car in the snow. 他把车丢弃在雪地里。'],
  ['ability', '/əˈbɪləti/', 'n. 能力；才能', 'She has the ability to solve complex problems.'],
  ['abroad', '/əˈbrɔːd/', 'adv. 在国外', 'He went abroad for further study.'],
  ['absence', '/ˈæbsəns/', 'n. 缺席；不在场', 'His absence was noticed by everyone.'],
  ['absolute', '/ˈæbsəluːt/', 'adj. 绝对的；完全的', 'She has absolute trust in him.'],
  ['absorb', '/əbˈzɔːrb/', 'v. 吸收；吸引', 'Plants absorb carbon dioxide.'],
  ['abstract', '/ˈæbstrækt/', 'adj. 抽象的 n. 摘要', 'Abstract art is not easy to understand.'],
  ['abundant', '/əˈbʌndənt/', 'adj. 丰富的；充裕的', 'The region has abundant natural resources.'],
  ['academic', '/ˌækəˈdemɪk/', 'adj. 学术的', 'She has a strong academic background.'],
  ['accelerate', '/əkˈseləreɪt/', 'v. 加速', 'The car accelerated rapidly.'],
  ['accent', '/ˈæksent/', 'n. 口音；重音', 'He speaks English with a French accent.'],
  ['accept', '/əkˈsept/', 'v. 接受；承认', 'She accepted the job offer.'],
  ['access', '/ˈækses/', 'n. 进入；通道 v. 访问', 'You need a password to access the system.'],
  ['accident', '/ˈæksɪdənt/', 'n. 事故；意外', 'He was injured in a car accident.'],
  ['accompany', '/əˈkʌmpəni/', 'v. 陪伴；伴随', 'She accompanied her mother to the hospital.'],
  ['accomplish', '/əˈkɑːmplɪʃ/', 'v. 完成；实现', 'He accomplished his goal.'],
  ['accurate', '/ˈækjərət/', 'adj. 准确的；精确的', 'The data must be accurate.'],
  ['achieve', '/əˈtʃiːv/', 'v. 达成；实现', 'She achieved great success.'],
  ['acknowledge', '/əkˈnɑːlɪdʒ/', 'v. 承认；确认', 'He acknowledged his mistake.'],
  ['acquire', '/əˈkwaɪər/', 'v. 获得；习得', 'She acquired a new skill.'],
  ['adapt', '/əˈdæpt/', 'v. 适应；改编', 'Children adapt quickly to new environments.'],
  ['adequate', '/ˈædɪkwət/', 'adj. 足够的；适当的', 'We have adequate time to prepare.'],
  ['adjust', '/əˈdʒʌst/', 'v. 调整；调节', 'Please adjust the volume.'],
  ['admire', '/ədˈmaɪər/', 'v. 钦佩；欣赏', 'I admire her courage.'],
  ['admission', '/ədˈmɪʃn/', 'n. 承认；入场；录取', 'He gained admission to the university.'],
  ['adolescent', '/ˌædəˈlesnt/', 'n./adj. 青少年（的）', 'Adolescents need guidance.'],
  ['adopt', '/əˈdɑːpt/', 'v. 采用；收养', 'They adopted a new strategy.'],
  ['advance', '/ədˈvæns/', 'v. 前进；进步 n. 进展', 'Technology advances rapidly.'],
  ['advantage', '/ədˈvæntɪdʒ/', 'n. 优势；好处', 'Experience is a great advantage.'],
  ['adventure', '/ədˈventʃər/', 'n. 冒险；奇遇', 'Life is an adventure.'],
  ['advertise', '/ˈædvərtaɪz/', 'v. 做广告；宣传', 'They advertise their products on TV.'],
  ['advise', '/ədˈvaɪz/', 'v. 建议；劝告', 'I advise you to rest.'],
  ['affect', '/əˈfekt/', 'v. 影响；感动', 'Smoking affects health seriously.'],
  ['afford', '/əˈfɔːrd/', 'v. 负担得起', 'I cannot afford a new car.'],
  ['aggressive', '/əˈɡresɪv/', 'adj. 侵略的；积极的', 'He takes an aggressive approach.'],
  ['agony', '/ˈæɡəni/', 'n. 极度痛苦', 'She was in agony.'],
  ['allocate', '/ˈæləkeɪt/', 'v. 分配；分派', 'Resources were allocated fairly.'],
  ['alternative', '/ɔːlˈtɜːrnətɪv/', 'n./adj. 替代的；选择', 'Is there an alternative plan?'],
  ['ambitious', '/æmˈbɪʃəs/', 'adj. 有雄心的', 'She is an ambitious young woman.'],
  ['analyze', '/ˈænəlaɪz/', 'v. 分析', 'We need to analyze the data carefully.'],
  ['ancient', '/ˈeɪnʃənt/', 'adj. 古代的；古老的', 'This is an ancient temple.'],
  ['anxiety', '/æŋˈzaɪəti/', 'n. 焦虑；忧虑', 'He felt anxiety before the exam.'],
  ['apparent', '/əˈpærənt/', 'adj. 明显的', 'It is apparent that he is lying.'],
  ['appeal', '/əˈpiːl/', 'v./n. 呼吁；上诉；吸引', 'The idea appeals to me.'],
  ['appreciate', '/əˈpriːʃieɪt/', 'v. 欣赏；感激', 'I appreciate your help.'],
  ['approach', '/əˈproʊtʃ/', 'v. 接近 n. 方法', 'We need a new approach.'],
  ['appropriate', '/əˈproʊpriət/', 'adj. 适当的', 'Please wear appropriate clothes.'],
  ['approve', '/əˈpruːv/', 'v. 批准；赞成', 'The committee approved the plan.'],
  ['approximate', '/əˈprɑːksɪmət/', 'adj. 近似的', 'Give me an approximate number.'],
  ['arbitrary', '/ˈɑːrbətreri/', 'adj. 任意的；武断的', 'The decision seemed arbitrary.'],
]

const REACT_CONCEPTS = [
  ['什么是 React 的核心思想？', '**组件化 + 声明式编程**\n- 将 UI 拆分为独立、可复用的组件\n- 描述"UI 应该是什么样子"，而不是命令式操作 DOM\n- `数据驱动视图`：State 变化 → 自动重新渲染'],
  ['React Hook 的使用规则是什么？', '**两条核心规则：**\n1. 只在**函数组件顶层**调用 Hook（不能在循环/条件/嵌套函数里）\n2. 只在**React 函数组件**或**自定义 Hook**里调用\n\n原因：React 依赖 Hook **调用顺序**来对应 state'],
  ['useState 和 useRef 的区别？', '| useState | useRef |\n| --- | --- |\n| 触发重渲染 | **不触发**重渲染 |\n| 值存在 state 里 | 值存在 `.current` |\n| 跨渲染保留 | 跨渲染保留 |\n| 用于 UI 状态 | 用于非 UI 数据、DOM 引用 |'],
  ['useEffect 的依赖数组有哪几种写法？', '```\n// 1. 不写依赖数组：每次渲染后执行\nuseEffect(() => {})\n\n// 2. 空数组 []：只在挂载时执行一次\nuseEffect(() => {}, [])\n\n// 3. [a, b]：a 或 b 变化时执行\nuseEffect(() => {}, [a, b])\n```'],
  ['什么是虚拟 DOM？它为什么高效？', '**虚拟 DOM**：用 JS 对象描述真实 DOM 结构\n\n**高效的原因：**\n1. JS 对象操作比真实 DOM 操作快得多\n2. **Diff 算法**：只比较变化的部分（同层比较、key 优化）\n3. 批量更新 + 合并操作，减少 reflow/repaint'],
  ['useMemo 和 useCallback 的区别？', '- **useMemo**：缓存**计算结果值**，避免重复计算\n  ```\n  const x = useMemo(() => fib(n), [n])\n  ```\n- **useCallback**：缓存**函数引用**，避免子组件不必要的重新渲染\n  ```\n  const fn = useCallback(() => {}, [dep])\n  ```'],
  ['React 中如何做性能优化？', '**常见手段：**\n1. `React.memo`：跳过 props 未变的组件重渲染\n2. `useMemo` / `useCallback`：缓存值和函数\n3. `useTransition` / `useDeferredValue`：标记非紧急更新\n4. 长列表：虚拟滚动（react-window）\n5. 合理拆分组件，避免父组件重渲染影响子组件\n6. 使用 key 帮助 Diff 算法'],
  ['什么是 Context？什么时候应该用？', '**Context**：跨多层组件共享数据，避免 props drilling\n\n**适用场景：**\n- 全局 UI 状态：主题、语言、登录状态\n- 多个深层子组件需要同一份数据\n\n**不适用场景：**\n- 只传 1-2 层：直接传 props\n- 频繁变化的状态：会让所有消费者都重渲染（考虑拆分 Context）'],
  ['useReducer 比 useState 更适合什么场景？', '**当 state 逻辑复杂时：**\n- state 有多个子字段且相互关联\n- 更新逻辑需要集中管理、可测试\n- 需要传递更新函数给深层子组件（dispatch 引用稳定）\n\n```\nconst [state, dispatch] = useReducer(reducer, init)\n```'],
  ['StrictMode 有什么用？', '开发模式下启用额外检查：\n1. **双重调用** reducer / render / effect，帮助发现副作用问题\n2. 检测**过时的 API** 使用（如 findDOMNode、旧 Context）\n3. 检测**意外的副作用**\n\n只在开发模式生效，不影响生产'],
  ['什么是 Hydration？SSR/SSG 中为什么需要？', '**Hydration**：将服务端渲染好的 HTML "水合" 为可交互的 React 应用\n\n过程：\n1. 浏览器收到服务端 HTML + JS bundle\n2. React 渲染出虚拟 DOM，与真实 HTML **匹配**\n3. 绑定事件监听器，接管交互\n\n若服务端与客户端渲染不一致会触发 Hydration Mismatch'],
  ['什么是 React Server Components (RSC)？', '**RSC**：在服务端渲染、**不发送 JS** 到客户端的组件\n\n**优点：**\n- 直接访问数据库 / 文件系统\n- 零 bundle size（不影响客户端 JS）\n- 天然代码分割\n\n**限制：**\n- 不能使用 useState、useEffect、浏览器 API\n- 不能绑定事件（交互需要 Client Component）'],
]

const SYSTEM_DESIGN = [
  ['什么是 CAP 定理？', '**CAP 三选二（分布式系统）：**\n\n| 性质 | 含义 |\n| --- | --- |\n| **C**onsistency 一致性 | 所有节点同一时刻看到相同数据 |\n| **A**vailability 可用性 | 每个请求都能收到响应（数据可能不是最新）|\n| **P**artition tolerance 分区容错 | 节点间消息丢失/延迟，系统仍工作 |\n\n**实际选择：** 网络分区不可避免（必须 P），权衡 C vs A → CP 或 AP'],
  ['微服务架构 vs 单体架构的权衡？', '**单体架构：**\n- ✅ 开发、部署、调试简单\n- ✅ 无分布式复杂性\n- ❌ 代码膨胀后难维护、部署风险高、扩展粒度粗\n\n**微服务：**\n- ✅ 独立部署/扩展、团队解耦、技术栈灵活\n- ❌ 分布式事务、服务发现、链路追踪、部署复杂\n\n**经验法则：** 业务初期优先单体，规模上来再拆分'],
  ['什么是最终一致性？常见模式？', '**最终一致性**：数据更新后，经过一段时间，**最终**所有副本都会一致\n\n**常见模式：**\n1. **读修复 Read Repair**：读时发现不一致，同步修复\n2. **反熵 Anti-Entropy**：后台定期对比修复\n3. **写时复制 COW**：写成功后异步广播\n4. **Saga / 补偿事务**：分布式场景用一系列本地事务 + 回滚操作'],
  ['短链接系统的核心设计思路？', '**核心：长 URL ↔ 短码 映射**\n\n1. **短码生成**：\n   - Base62(数字+大小写字母)，6 位 = 62⁶ ≈ 560 亿种\n   - 自增 ID + 哈希 / 雪花 ID\n2. **存储**：\n   - SQL：短码(主键) → 长 URL\n   - 加 Redis 缓存热点数据\n3. **访问 301/302 重定向**\n4. **可选**：自定义短码、访问统计、过期时间'],
  ['设计一个秒杀系统要考虑哪些点？', '**高并发 + 防超卖：**\n\n1. **流量削峰**：CDN、验证码过滤、队列缓冲请求\n2. **库存预扣**：Redis Lua 原子扣库存（单线程保证不超卖）\n3. **DB 最终一致性**：异步写订单，失败回滚库存\n4. **限流**：令牌桶，按用户/IP 限流\n5. **隔离**：秒杀独立集群，与主业务隔离\n6. **监控 + 降级开关**'],
  ['什么是负载均衡算法？常见类型？', '**把流量分发到多个后端实例的策略：**\n\n- **轮询 Round-Robin**：挨个分\n- **加权轮询**：性能好的机器多分\n- **随机 Random**：简单\n- **最少连接 Least Connections**：分给当前连接少的\n- **一致性哈希 Consistent Hash**：相同请求稳定打到同一节点，节点增减影响小（适合缓存）\n- **IP Hash**：按来源 IP 哈希'],
  ['分布式锁的实现方式对比？', '| 方案 | 原子性 | 可靠性 | 复杂度 |\n| --- | --- | --- | --- |\n| **Redis SETNX** + 过期 | ✅ Lua 原子释放 | 一般（主从切换问题）| 低 |\n| **RedLock** | ✅ | 较好（多实例）| 中 |\n| **ZooKeeper** | ✅ ZAB 协议 | 高（临时节点+watch）| 中高 |\n| **etcd** | ✅ Raft | 高 | 中 |\n\nRedis 简单场景够⽤；金融/订单等一致性要求高 → ZK/etcd'],
  ['如何设计一个消息队列（核心概念）？', '**核心抽象：Topic + 生产者 + 消费者组**\n\n**存储模型：**\n- Queue 模式：一条消息只被一个消费者消费\n- Pub-Sub 模式：每个订阅者都收到\n\n**关键保证：**\n- **至少一次投递 at-least-once**（consumer 手动 ack）\n- **幂等消费**（业务侧去重）\n- **顺序保证**（按 partition / shard 有序）\n- **持久化**：落盘 + 副本\n\n典型：Kafka、RabbitMQ、RocketMQ'],
  ['数据库分库分表的策略？', '**垂直切分**：按业务表分库（用户库、订单库…）\n\n**水平切分**：同一张表按某种 key 散列到多张表：\n- **Range 范围切分**：按时间 / ID 区间（易热点）\n- **Hash / Mod 取模**：均匀分布（扩容需迁移）\n- **一致性哈希**：扩容影响小\n- **Lookup 映射表**：一张小表记录 key → shard 位置\n\n**配套：** 全局 ID（雪花算法）、分布式事务、跨分片查询方案'],
  ['什么是 Backpressure（背压）？', '**生产者速度 > 消费者速度** 时，需要一种机制来阻止生产者把系统压垮\n\n**处理策略：**\n1. **丢弃**：直接丢最旧/最新消息（监控可观测）\n2. **缓冲**：队列 + 溢出策略（如 Kafka 的磁盘持久队列）\n3. **限流**：减慢生产者（TCP 滑动窗口、Reactive Streams）\n4. **降级**：非核心业务暂不处理'],
  ['如何做 API 网关？核心功能有哪些？', '**API 网关 = 所有外部请求的统一入口**\n\n**核心功能：**\n- 路由（反向代理 + 路径匹配）\n- 认证鉴权（JWT/OAuth 校验，一次校验全链路）\n- 限流、熔断、降级\n- 日志、监控、链路追踪（埋点）\n- 协议转换（HTTP → gRPC）\n- 灰度发布 / A/B 测试\n- 缓存 + WAF 安全\n\n代表：Kong、APISIX、Spring Cloud Gateway'],
  ['CDN 的工作原理？能加速什么？', '**CDN**：把内容分发到全球边缘节点，用户就近获取\n\n**加速什么？**\n- ✅ 静态资源：JS/CSS/图片/视频（强缓存）\n- ✅ 静态 HTML 页面（边缘计算也可处理动态）\n- ❌ 强个性化动态数据（效果差，用 ESI / Edge Side Includes）\n\n**工作流程：**\n1. DNS CNAME → CDN 调度 → 最近边缘节点\n2. 命中 → 直接返回；未命中 → 回源拉取 + 缓存'],
]

const ALGO_DATA_STRUCTURE = [
  ['LeetCode 1. 两数之和 Two Sum',
    '**描述**：在数组中找出和为 target 的两个数，返回下标\n\n**复杂度分析：**\n- 暴力：O(n²) 时间，O(1) 空间\n- 哈希表：**O(n)** 时间，**O(n)** 空间\n\n**解题思路：**\n1. 用 `HashMap<值, 索引>` 记录已遍历元素\n2. 对每个 `nums[i]`，检查 `target - nums[i]` 是否在 map 中\n3. 存在则返回两个下标；不存在则把当前元素放入 map\n\n```\nfunction twoSum(nums, target) {\n  const map = new Map()\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i]\n    if (map.has(need)) return [map.get(need), i]\n    map.set(nums[i], i)\n  }\n  return []\n}\n```'],
  ['LeetCode 206. 反转链表 Reverse Linked List',
    '**描述**：反转单链表，返回新的头节点\n\n**复杂度：** O(n) 时间，O(1) 空间\n\n**思路（三指针迭代）：**\n```\nprev = null, curr = head\nwhile curr:\n    nextTmp = curr.next   // 暂存\n    curr.next = prev      // 反转指针\n    prev = curr           // prev 前进\n    curr = nextTmp        // curr 前进\nreturn prev\n```\n\n**关键点：** 先存 next，再改指针，再前进两个指针。'],
  ['LeetCode 3. 无重复字符的最长子串',
    '**描述**：求不含重复字符的最长子串长度\n\n**复杂度：** O(n) 时间，O(Σ) 空间（Σ=字符集）\n\n**思路：滑动窗口 + Map**\n```\nleft = 0, ans = 0, map<char, idx>\nfor right in [0, n):\n    if s[right] in map:\n        left = max(left, map[s[right]] + 1)\n    map[s[right]] = right\n    ans = max(ans, right - left + 1)\nreturn ans\n```\n\n**注意：** `max(left, ...)` 防止 left 回退'],
  ['LeetCode 146. LRU 缓存 LRU Cache',
    '**描述**：设计 get/put 都 O(1) 的 LRU 缓存\n\n**核心数据结构：**\n- **哈希表**：key → 链表节点（O(1) 查找）\n- **双向链表**：按使用顺序排列（头部最近使用，尾部最久未用）\n\n**伪代码：**\n```\nget(key):\n  if key not in map: return -1\n  node = map[key]\n  removeNode(node)\n  addToHead(node)     // 标记刚用过\n  return node.val\n\nput(key, val):\n  if key exists: update & moveToHead\n  else:\n    if size == capacity:\n      removeTail()    // 淘汰最久未用\n    add new node to head\n```'],
  ['LeetCode 200. 岛屿数量 Number of Islands',
    '**描述**：1=陆地、0=水，求连通陆地块数\n\n**复杂度：** O(m·n) 时间 O(m·n) 空间\n\n**思路：DFS / BFS 洪水填充**\n```\ncount = 0\nfor i, j in grid:\n    if grid[i][j] == \'1\':\n        count += 1\n        dfs(grid, i, j)  // 把整个连通块淹掉\nreturn count\n\ndfs(g, i, j):\n    if i,j out of bound or g[i][j] != \'1\': return\n    g[i][j] = \'0\'   // 已访问标记\n    dfs 4 directions\n```'],
  ['LeetCode 53. 最大子数组和 Maximum Subarray',
    '**描述**：找连续子数组的最大和\n\n**复杂度：** O(n) 时间，O(1) 空间\n\n**思路：Kadane 算法（DP 思想）**\n```\nmaxSum = curSum = nums[0]\nfor i = 1 to n-1:\n    // 要么接在前面，要么以自己为新起点\n    curSum = max(nums[i], curSum + nums[i])\n    maxSum = max(maxSum, curSum)\nreturn maxSum\n```\n\n**关键洞察：** 当前缀和为负时，丢弃前缀直接从新元素开始'],
  ['LeetCode 121. 买卖股票最佳时机 Best Time',
    '**描述**：只允许一次买卖，求最大利润\n\n**复杂度：** O(n) 时间，O(1) 空间\n\n**思路：一次遍历维护历史最低**\n```\nminPrice = +∞, profit = 0\nfor price in prices:\n    minPrice = min(minPrice, price)\n    profit = max(profit, price - minPrice)\nreturn profit\n```\n\n**误区：** 不要找全局最小和全局最大（最小可能出现在最大之后）'],
  ['LeetCode 215. 数组第 K 大元素 Kth Largest',
    '**描述**：找无序数组中第 K 大的元素\n\n**方案对比：**\n- 排序：O(n log n)\n- 小顶堆 size=K：**O(n log k)** 空间 O(k)\n- 快速选择 QuickSelect：**平均 O(n)** 最坏 O(n²)，空间 O(1)\n\n**快选伪代码：**\n```\nfunction kth(arr, k):\n    pivot = random element\n    partition 为 左< pivot < 右\n    if 右边数量 >= k: 在右半边找\n    else if 右边数量 == k-1: return pivot\n    else: 在左半边找 第 k-rightCount-1 大\n```'],
  ['LeetCode 70. 爬楼梯 Climbing Stairs',
    '**描述**：每次爬 1 或 2 阶，n 阶有多少种方法？\n\n**复杂度：** O(n) 时间，O(1) 空间\n\n**思路：DP（本质斐波那契）**\n```\n// dp[i] = 到第 i 阶的方法数\n// dp[i] = dp[i-1] + dp[i-2]  (从 i-1 爬1阶 + 从 i-2 爬2阶)\n\na, b = 1, 1\nfor i in 2..n:\n    a, b = b, a + b\nreturn b\n```'],
  ['LeetCode 22. 括号生成 Generate Parentheses',
    '**描述**：生成所有 n 对有效括号组合\n\n**复杂度：** O(C_n) C_n = 卡特兰数\n\n**思路：DFS 回溯，剪枝**\n```\nres = []\nfunction backtrack(path, open, close):\n    if len(path) == 2*n: res.append(path); return\n    if open < n:  // 还能加 (\n        backtrack(path + \'(\', open+1, close)\n    if close < open:  // 只有 ) 比 ( 少才能加 )\n        backtrack(path + \')\', open, close+1)\n```\n\n**剪枝原则：** 任意前缀中 `左括号 >= 右括号` 就是合法的'],
  ['数组 vs 链表 vs 哈希表 对比？',
    '| 结构 | 查 | 插/删 | 空间 |\n| --- | --- | --- | --- |\n| **数组** | O(1) 随机访问 | 平均 O(n) 搬移 | 连续 |\n| **链表** | O(n) 遍历 | O(1)（已知节点）| 分散 + 指针开销 |\n| **哈希表** | 平均 O(1) | 平均 O(1) | 有 load factor 开销 |\n\n**选择经验：**\n- 知道下标 → 数组\n- 频繁中间插入删除 → 链表\n- 快速查找 key → 哈希表（底层一般是数组 + 链表/红黑树）'],
  ['BFS vs DFS 的适用场景？',
    '**BFS（队列，逐层扩展）：**\n- 求**最短路径 / 最少步数**（图/棋盘）\n- 层序遍历树\n- 扩散类问题（腐烂橘子、多源 BFS）\n- 内存：节点多的图易 OOM（每层保存所有节点）\n\n**DFS（栈/递归，一扎到底）：**\n- 遍历所有路径/子集/组合（回溯）\n- 判断环、连通性、拓扑排序\n- 树的前/中/后序\n- 内存：递归深度 O(h)（树高），相对省空间\n\n**记忆：最短路 → BFS；所有方案 → DFS**'],
]

// ============================================================
// BUILT-IN DECKS GENERATION
// ============================================================
function buildBuiltInDecks(): { decks: Deck[]; cards: Card[] } {
  const decks: Deck[] = [
    {
      id: 'builtin-english',
      name: '500 常用英语单词',
      description: '高频 500 英语词汇 · 带音标 · 释义 · 例句',
      color: DECK_COLORS[0],
      icon: '📚',
      createdAt: todayStr(),
      newCardsPerDay: 20,
      reviewsPerDay: 200,
      isBuiltin: true,
    },
    {
      id: 'builtin-react',
      name: 'React 核心概念',
      description: 'React 18 关键概念、Hooks 机制、性能优化',
      color: DECK_COLORS[1],
      icon: '⚛️',
      createdAt: todayStr(),
      newCardsPerDay: 10,
      reviewsPerDay: 100,
      isBuiltin: true,
    },
    {
      id: 'builtin-sysdesign',
      name: '系统设计基础',
      description: 'CAP、一致性、分布式、缓存、MQ、数据库',
      color: DECK_COLORS[2],
      icon: '🧱',
      createdAt: todayStr(),
      newCardsPerDay: 8,
      reviewsPerDay: 100,
      isBuiltin: true,
    },
    {
      id: 'builtin-algo',
      name: '算法与数据结构 · LeetCode',
      description: 'LeetCode 高频题 · 复杂度 · 思路 · 伪代码',
      color: DECK_COLORS[3],
      icon: '🧮',
      createdAt: todayStr(),
      newCardsPerDay: 5,
      reviewsPerDay: 100,
      isBuiltin: true,
    },
  ]
  const cards: Card[] = []
  for (const [w, ipa, mean, ex] of ENGLISH_WORDS) {
    cards.push(newCard('builtin-english',
      `**${w}**  ${ipa}`,
      `**释义：** ${mean}\n\n**例句：** ${ex}`,
      ['english', 'vocabulary'], 'beginner'))
  }
  for (const [front, back] of REACT_CONCEPTS) {
    cards.push(newCard('builtin-react', front, back, ['react', 'frontend'], 'intermediate'))
  }
  for (const [front, back] of SYSTEM_DESIGN) {
    cards.push(newCard('builtin-sysdesign', front, back, ['system-design', 'backend'], 'advanced'))
  }
  for (const [front, back] of ALGO_DATA_STRUCTURE) {
    cards.push(newCard('builtin-algo', front, back, ['algorithm', 'leetcode'], 'advanced'))
  }
  return { decks, cards }
}

// ============================================================
// DEFAULT STATE
// ============================================================
function getDefaultState(): AppState {
  const { decks, cards } = buildBuiltInDecks()
  return {
    decks,
    cards,
    sessions: [],
    settings: {
      dailyNewLimit: 20,
      dailyReviewLimit: 200,
      againIntervalMin: 1,
      hardIntervalMin: 10,
      goodIntervalMin: 1440,
    },
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null,
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const def = getDefaultState()
      // Ensure builtin decks exist
      parsed.decks = parsed.decks || []
      parsed.cards = parsed.cards || []
      for (const bd of def.decks) {
        if (!parsed.decks.find((d: Deck) => d.id === bd.id)) {
          parsed.decks.push(bd)
          const cardsToAdd = def.cards.filter(c => c.deckId === bd.id)
          parsed.cards.push(...cardsToAdd.map(c => ({ ...c, id: uid() })))
        }
      }
      parsed.settings = { ...def.settings, ...(parsed.settings || {}) }
      parsed.sessions = parsed.sessions || []
      return parsed
    }
  } catch {/* noop */}
  return getDefaultState()
}

// ============================================================
// MARKDOWN RENDERING (minimal: **bold**, `code`, links, newlines)
// ============================================================
function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#c4b5fd">$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(6,182,212,0.15);color:#22d3ee;padding:1px 5px;border-radius:3px;font-family:ui-monospace,monospace;font-size:0.92em">$$1</code>')
    .replace(/^- (.+)$/gm, '<li style="margin-left:18px">• $1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li style="margin-left:18px">$1. $2</li>')
    .replace(/\n/g, '<br/>')
  html = html.replace(/(<br\/?>\s*){3,}/g, '<br/><br/>')
  return html
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function FlashMaster() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [view, setView] = useState<View>('study')
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [sessionQueue, setSessionQueue] = useState<Card[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0, elapsedMs: 0 })
  const [streak, setStreak] = useState(0)
  const [todayDone, setTodayDone] = useState({ newCards: 0, reviews: 0 })
  const sessionStartRef = useRef(Date.now())

  // Browse state
  const [browseFilter, setBrowseFilter] = useState<{ deck: string | null; tag: string | null; mastery: MasteryLevel | null; search: string }>({
    deck: null, tag: null, mastery: null, search: ''
  })
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [showCardModal, setShowCardModal] = useState(false)
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [showDeckModal, setShowDeckModal] = useState(false)
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set())

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Persist
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {/* noop */}
    }, 500)
    return () => clearTimeout(t)
  }, [state])

  // Compute today's done counts
  useEffect(() => {
    const today = todayStr()
    let nc = 0, rv = 0
    for (const c of state.cards) {
      if (c.lastReviewedAt === today) {
        rv++
        if (c.reps === 1) nc++
      }
    }
    setTodayDone({ newCards: nc, reviews: rv })
  }, [state.cards])

  // ============== DECK STATS HELPERS ==============
  const deckStats = useMemo(() => {
    const today = todayStr()
    const out: Record<string, { total: number; newCards: number; review: number; mastered: number }> = {}
    for (const d of state.decks) out[d.id] = { total: 0, newCards: 0, review: 0, mastered: 0 }
    for (const c of state.cards) {
      const s = out[c.deckId]
      if (!s) continue
      s.total++
      if (c.reps === 0) s.newCards++
      else if (c.interval >= 21) s.mastered++
      if (c.nextReviewAt <= today || c.reps === 0) s.review++
    }
    return out
  }, [state.cards, state.decks])

  // ============== STUDY QUEUE ==============
  const buildStudyQueue = useCallback((deckId: string | null) => {
    const today = todayStr()
    let cards = state.cards
    if (deckId) cards = cards.filter(c => c.deckId === deckId)
    // Mark due
    const dueCards = cards.filter(c => c.nextReviewAt <= today || c.reps === 0)
    // Order: new cards first (reps=0), then by nextReviewAt
    dueCards.sort((a, b) => {
      if (a.reps === 0 && b.reps > 0) return -1
      if (a.reps > 0 && b.reps === 0) return 1
      return a.nextReviewAt.localeCompare(b.nextReviewAt)
    })
    // Limit
    const limit = deckId
      ? (state.decks.find(d => d.id === deckId)?.newCardsPerDay || 20) + (state.decks.find(d => d.id === deckId)?.reviewsPerDay || 200)
      : state.settings.dailyNewLimit + state.settings.dailyReviewLimit
    return dueCards.slice(0, limit)
  }, [state.cards, state.decks, state.settings])

  const startSession = (deckId: string | null) => {
    const q = buildStudyQueue(deckId)
    setSelectedDeckId(deckId)
    setSessionQueue(q)
    setQueueIndex(0)
    setFlipped(false)
    setSessionStats({ reviewed: 0, correct: 0, elapsedMs: 0 })
    setStreak(0)
    sessionStartRef.current = Date.now()
    setView('study')
  }

  const currentCard = sessionQueue[queueIndex] || null

  const rateCard = (rating: Rating) => {
    if (!currentCard) return
    const updated = applySM2(currentCard, rating)
    setState(s => ({
      ...s,
      cards: s.cards.map(c => c.id === updated.id ? updated : c)
    }))
    setSessionStats(s => ({
      reviewed: s.reviewed + 1,
      correct: s.correct + (rating !== 'again' ? 1 : 0),
      elapsedMs: Date.now() - sessionStartRef.current,
    }))
    if (rating === 'again') setStreak(0)
    else setStreak(s => s + 1)
    setFlipped(false)
    setQueueIndex(i => i + 1)

    // Session log update + streak
    const today = todayStr()
    setState(s => {
      const lastDate = s.lastStudyDate
      let cur = s.currentStreak
      let long = s.longestStreak
      if (lastDate !== today) {
        const yday = addDays(today, -1)
        if (lastDate === yday) cur += 1
        else cur = 1
        if (cur > long) long = cur
      }
      const sessions = [...s.sessions]
      const todayIdx = sessions.findIndex(x => x.date === today)
      if (todayIdx >= 0) {
        sessions[todayIdx] = {
          ...sessions[todayIdx],
          reviewed: sessions[todayIdx].reviewed + 1,
          correct: sessions[todayIdx].correct + (rating !== 'again' ? 1 : 0),
          newCards: sessions[todayIdx].newCards + (currentCard.reps === 0 ? 1 : 0),
          durationSec: Math.round((Date.now() - sessionStartRef.current) / 1000),
        }
      } else {
        sessions.push({
          date: today,
          reviewed: 1,
          correct: rating !== 'again' ? 1 : 0,
          newCards: currentCard.reps === 0 ? 1 : 0,
          durationSec: 1,
        })
      }
      return { ...s, sessions, currentStreak: cur, longestStreak: long, lastStudyDate: today }
    })
  }

  const sessionProgress = sessionQueue.length
    ? Math.round((queueIndex / sessionQueue.length) * 100)
    : 0

  // ============== CRUD CARDS/DECKS ==============
  const upsertCard = (card: Card) => {
    setState(s => ({
      ...s,
      cards: s.cards.find(c => c.id === card.id)
        ? s.cards.map(c => c.id === card.id ? card : c)
        : [...s.cards, card]
    }))
  }
  const deleteCards = (ids: string[]) => {
    const setIds = new Set(ids)
    setState(s => ({ ...s, cards: s.cards.filter(c => !setIds.has(c.id)) }))
  }
  const upsertDeck = (deck: Deck) => {
    setState(s => ({
      ...s,
      decks: s.decks.find(d => d.id === deck.id)
        ? s.decks.map(d => d.id === deck.id ? deck : d)
        : [...s.decks, deck]
    }))
  }
  const deleteDeck = (id: string) => {
    if (!confirm('确定删除该卡组及其所有卡片？此操作不可撤销。')) return
    setState(s => ({
      ...s,
      decks: s.decks.filter(d => d.id !== id),
      cards: s.cards.filter(c => c.deckId !== id),
    }))
  }

  // ============== IMPORT / EXPORT ==============
  const exportAll = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `flashmaster-backup-${todayStr()}.json`; a.click()
    URL.revokeObjectURL(url)
  }
  const exportDeck = (deckId: string) => {
    const deck = state.decks.find(d => d.id === deckId)
    if (!deck) return
    const data = { deck, cards: state.cards.filter(c => c.deckId === deckId) }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `deck-${deck.name}-${todayStr()}.json`; a.click()
    URL.revokeObjectURL(url)
  }
  const importFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result))
        if (json.deck && json.cards) {
          // Single deck import
          const newDeckId = uid()
          const newDeck: Deck = { ...json.deck, id: newDeckId, isBuiltin: false, createdAt: todayStr(), name: json.deck.name + ' (导入)' }
          const newCards: Card[] = json.cards.map((c: Card) => ({
            ...newCard(newDeckId, c.front, c.back, c.tags || [], c.difficulty || 'intermediate'),
            ...(c.tags ? { tags: c.tags } : {}),
          }))
          setState(s => ({ ...s, decks: [...s.decks, newDeck], cards: [...s.cards, ...newCards] }))
          alert(`导入卡组成功：${newDeck.name}（${newCards.length} 张卡片）`)
        } else if (json.decks && json.cards) {
          // Full backup
          if (confirm('将覆盖所有现有数据并恢复为备份内容，是否继续？')) {
            setState(json)
            alert('完整备份已恢复')
          }
        } else {
          alert('未识别的文件格式')
        }
      } catch (e) {
        alert('导入失败：' + (e as Error).message)
      }
    }
    reader.readAsText(file)
  }

  // ============== LEETCODE MODE ==============
  const startLeetCodeMode = () => {
    const algoCards = state.cards.filter(c => c.deckId === 'builtin-algo')
    const shuffled = [...algoCards].sort(() => Math.random() - 0.5).slice(0, 20)
    setSelectedDeckId('builtin-algo')
    setSessionQueue(shuffled)
    setQueueIndex(0)
    setFlipped(false)
    setSessionStats({ reviewed: 0, correct: 0, elapsedMs: 0 })
    setStreak(0)
    sessionStartRef.current = Date.now()
    setView('study')
  }

  // ============== FILTERING ==============
  const filteredCards = useMemo(() => {
    const f = browseFilter
    let out = state.cards
    if (f.deck) out = out.filter(c => c.deckId === f.deck)
    if (f.tag) out = out.filter(c => c.tags.includes(f.tag!))
    if (f.mastery) {
      if (f.mastery === 'new') out = out.filter(c => c.reps === 0)
      else if (f.mastery === 'learning') out = out.filter(c => c.reps > 0 && c.interval < 7)
      else if (f.mastery === 'review') out = out.filter(c => c.interval >= 7 && c.interval < 21)
      else if (f.mastery === 'mastered') out = out.filter(c => c.interval >= 21)
    }
    if (f.search) {
      const q = f.search.toLowerCase()
      out = out.filter(c =>
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return out
  }, [state.cards, browseFilter])

  const allTags = useMemo(() => {
    const s = new Set<string>()
    for (const c of state.cards) for (const t of c.tags) s.add(t)
    return Array.from(s).sort()
  }, [state.cards])

  // ============================================================
  // RENDER
  // ============================================================
  const gradientBg = {
    background: 'linear-gradient(135deg, #0a0420 0%, #0f172a 40%, #0c1a2e 100%)'
  }
  const accentPurple = '#7c3aed'
  const accentCyan = '#06b6d4'

  const selectedDeckName = selectedDeckId ? state.decks.find(d => d.id === selectedDeckId)?.name : '全部卡组'
  const totalTodayDue = useMemo(() => {
    const today = todayStr()
    return state.cards.filter(c => c.nextReviewAt <= today || c.reps === 0).length
  }, [state.cards])

  return (
    <div className="w-full h-full flex flex-col overflow-hidden text-sm" style={{
      ...gradientBg,
      color: '#e8eaf5',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Noto Sans SC', 'PingFang SC', sans-serif",
    }}>
      {/* ===== HEADER ===== */}
      <header className="flex-shrink-0 px-5 py-3 flex items-center justify-between border-b"
        style={{ borderColor: 'rgba(124,58,237,0.18)', background: 'rgba(0,0,0,0.25)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight" style={{ color: '#fff' }}>
              FlashMaster <span className="text-xs font-normal ml-1 px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(6,182,212,0.18)', color: '#22d3ee' }}>间隔重复 SRS</span>
            </div>
            <div className="text-[10.5px]" style={{ color: '#7a85a8' }}>
              基于 SM-2 算法 · 类 Anki/SuperMemo · {state.cards.length.toLocaleString()} 张卡片
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {([
            { k: 'study', label: '学习', icon: <BookOpen size={13} /> },
            { k: 'browse', label: '浏览', icon: <Layers size={13} /> },
            { k: 'stats', label: '统计', icon: <BarChart3 size={13} /> },
          ] as { k: View; label: string; icon: React.ReactNode }[]).map(t => (
            <button key={t.k} onClick={() => setView(t.k)}
              className="px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-all"
              style={{
                background: view === t.k ? 'linear-gradient(135deg, rgba(124,58,237,0.28), rgba(6,182,212,0.22))' : 'transparent',
                color: view === t.k ? '#e8e8ff' : '#7a85a8',
                border: view === t.k ? '1px solid rgba(124,58,237,0.45)' : '1px solid transparent',
                fontWeight: view === t.k ? 600 : 400,
              }}>
              {t.icon} {t.label}
            </button>
          ))}
          <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-md transition-all hover:opacity-80"
            style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee' }} title="导入 JSON">
            <Upload size={13} />
          </button>
          <button onClick={exportAll} className="p-1.5 rounded-md transition-all hover:opacity-80"
            style={{ background: 'rgba(124,58,237,0.15)', color: '#c4b5fd' }} title="导出完整备份">
            <Download size={13} />
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden"
            onChange={e => e.target.files?.[0] && importFile(e.target.files[0])} />
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* ========== LEFT SIDEBAR (DECKS + TODAY) ========== */}
        <aside className="w-72 flex-shrink-0 border-r overflow-y-auto"
          style={{ borderColor: 'rgba(124,58,237,0.12)', background: 'rgba(0,0,0,0.15)' }}>

          {/* Today dashboard */}
          <div className="p-3 border-b" style={{ borderColor: 'rgba(124,58,237,0.12)' }}>
            <div className="text-[11px] font-semibold mb-2.5 flex items-center gap-1.5" style={{ color: '#a8b0c8' }}>
              <Target size={12} style={{ color: accentCyan }} /> 今日看板
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              <TodayTile label="新卡限额" value={`${todayDone.newCards}/${state.settings.dailyNewLimit}`}
                color={accentPurple} icon={<Star size={10} />} />
              <TodayTile label="已复习" value={`${todayDone.reviews}`}
                color={accentCyan} icon={<RotateCcw size={10} />} />
              <TodayTile label="待复习" value={`${totalTodayDue}`}
                color="#f59e0b" icon={<Calendar size={10} />} />
              <TodayTile label="预估时长" value={`${Math.max(1, Math.round(totalTodayDue * 0.4))} 分钟`}
                color="#10b981" icon={<Clock size={10} />} />
            </div>
            <div className="flex items-center justify-between text-[10.5px] mb-2 px-1">
              <span style={{ color: '#7a85a8' }}>
                <Flame size={10} className="inline mr-1" style={{ color: '#ef4444' }} />
                连续 <b style={{ color: '#fca5a5' }}>{state.currentStreak}</b> 天
              </span>
              <span style={{ color: '#7a85a8' }}>
                最长 <b style={{ color: '#c4b5fd' }}>{state.longestStreak}</b> 天
              </span>
            </div>
            <button onClick={() => startSession(null)}
              className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                color: '#fff',
                boxShadow: '0 6px 18px rgba(124,58,237,0.35)',
              }}>
              <Play size={12} /> 开始今日学习
            </button>
            <button onClick={startLeetCodeMode}
              className="w-full py-1.5 mt-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>
              <Brain size={11} /> LeetCode 算法刷题模式
            </button>
          </div>

          {/* Decks list */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: '#a8b0c8' }}>
                <Layers size={12} style={{ color: accentPurple }} /> 我的卡组
              </div>
              <button onClick={() => { setEditingDeck({ id: uid(), name: '', description: '', color: DECK_COLORS[0], icon: '📒', createdAt: todayStr(), newCardsPerDay: 20, reviewsPerDay: 200, isBuiltin: false }); setShowDeckModal(true) }}
                className="p-1 rounded transition-all hover:opacity-80"
                style={{ background: 'rgba(124,58,237,0.15)', color: '#c4b5fd' }}>
                <Plus size={12} />
              </button>
            </div>
            <div className="space-y-1.5">
              {state.decks.map(d => {
                const ds = deckStats[d.id] || { total: 0, newCards: 0, review: 0, mastered: 0 }
                const isSel = selectedDeckId === d.id
                return (
                  <div key={d.id}
                    className={`p-2.5 rounded-lg cursor-pointer transition-all`}
                    style={{
                      background: isSel ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSel ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                    onClick={() => setSelectedDeckId(isSel ? null : d.id)}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-md flex items-center justify-center text-sm flex-shrink-0"
                        style={{ background: d.color, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                        {d.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate" style={{ color: '#e8eaf5' }}>
                          {d.name}
                          {d.isBuiltin && <span className="ml-1 text-[9px] px-1 rounded" style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee' }}>内置</span>}
                        </div>
                        <div className="text-[10px] truncate" style={{ color: '#6b7696' }}>{ds.total} 张</div>
                      </div>
                      <ChevronRight size={12} style={{ color: '#5b6a8c', opacity: isSel ? 1 : 0.3 }} />
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[9.5px] mb-1.5">
                      <span className="px-1 py-0.5 rounded text-center" style={{ background: 'rgba(124,58,237,0.12)', color: '#c4b5fd' }}>新 {ds.newCards}</span>
                      <span className="px-1 py-0.5 rounded text-center" style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee' }}>复 {ds.review}</span>
                      <span className="px-1 py-0.5 rounded text-center" style={{ background: 'rgba(16,185,129,0.12)', color: '#6ee7b7' }}>握 {ds.mastered}</span>
                    </div>
                    {isSel && (
                      <div className="flex gap-1 pt-1.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <button onClick={e => { e.stopPropagation(); startSession(d.id) }}
                          className="flex-1 py-1 rounded text-[10px] font-medium transition-all hover:opacity-80"
                          style={{ background: 'rgba(6,182,212,0.18)', color: '#22d3ee' }}>
                          <Play size={9} className="inline mr-0.5" /> 学
                        </button>
                        <button onClick={e => { e.stopPropagation(); setView('browse'); setBrowseFilter(f => ({ ...f, deck: d.id })) }}
                          className="flex-1 py-1 rounded text-[10px] transition-all hover:opacity-80"
                          style={{ background: 'rgba(255,255,255,0.05)', color: '#a8b0c8' }}>
                          <Eye size={9} className="inline mr-0.5" /> 看
                        </button>
                        <button onClick={e => { e.stopPropagation(); exportDeck(d.id) }}
                          className="p-1 rounded text-[10px] transition-all hover:opacity-80"
                          style={{ background: 'rgba(255,255,255,0.05)', color: '#a8b0c8' }} title="导出卡组">
                          <FileJson size={10} />
                        </button>
                        {!d.isBuiltin && (
                          <>
                            <button onClick={e => { e.stopPropagation(); setEditingDeck(d); setShowDeckModal(true) }}
                              className="p-1 rounded transition-all hover:opacity-80"
                              style={{ background: 'rgba(255,255,255,0.05)', color: '#a8b0c8' }}>
                              <Edit3 size={10} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); deleteDeck(d.id) }}
                              className="p-1 rounded transition-all hover:opacity-80"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                              <Trash2 size={10} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </aside>

        {/* ========== CONTENT AREA ========== */}
        <main className="flex-1 min-w-0 overflow-hidden flex flex-col">

          {/* ===== STUDY VIEW ===== */}
          {view === 'study' && (
            <div className="flex-1 overflow-auto flex flex-col" style={{
              background: 'radial-gradient(ellipse at top, rgba(124,58,237,0.10) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(6,182,212,0.08) 0%, transparent 60%)'
            }}>

              {!currentCard && sessionQueue.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center p-8 max-w-md">
                    <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl mb-5"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', boxShadow: '0 12px 40px rgba(124,58,237,0.45)' }}>
                      <Trophy size={36} />
                    </div>
                    <h2 className="text-xl font-bold mb-2" style={{ color: '#fff' }}>
                      {todayDone.reviews > 0 ? '🎉 今日学习完成！' : '选择一个卡组开始学习'}
                    </h2>
                    <p className="text-xs mb-6 leading-relaxed" style={{ color: '#8b95b8' }}>
                      {todayDone.reviews > 0
                        ? `今日已复习 ${todayDone.reviews} 张卡片，累计连续 ${state.currentStreak} 天打卡。每天一小步，未来一大步。`
                        : '点击左侧卡组的"学"按钮，或点击"开始今日学习"一键复习所有到期卡片。'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => startSession(null)}
                        className="py-2.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: '#fff' }}>
                        <Play size={11} className="inline mr-1" /> 复习全部
                      </button>
                      <button onClick={() => setView('browse')}
                        className="py-2.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#a8b0c8', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Layers size={11} className="inline mr-1" /> 浏览卡片
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {currentCard && (
                <>
                  {/* Session progress bar */}
                  <div className="px-6 pt-5 pb-3 max-w-3xl w-full mx-auto">
                    <div className="flex items-center justify-between mb-2 text-[11px]">
                      <div style={{ color: '#7a85a8' }}>
                        <Home size={10} className="inline mr-1" /> {selectedDeckName}
                        <span className="mx-2">·</span>
                        {state.decks.find(d => d.id === currentCard.deckId)?.icon}{' '}
                        {state.decks.find(d => d.id === currentCard.deckId)?.name}
                      </div>
                      <div style={{ color: '#7a85a8' }}>
                        <Zap size={10} className="inline mr-1" style={{ color: '#fbbf24' }} /> 连续正确
                        <b className="ml-1" style={{ color: streak >= 3 ? '#fbbf24' : '#c4b5fd' }}>{streak}</b>
                        <span className="mx-2">·</span>
                        {queueIndex} / {sessionQueue.length}
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${sessionProgress}%`,
                          background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                          boxShadow: '0 0 10px rgba(124,58,237,0.4)',
                        }}
                      />
                    </div>
                  </div>

                  {/* FLIP CARD */}
                  <div className="flex-1 flex items-center justify-center px-6 pb-2">
                    <div className="w-full max-w-2xl" style={{ perspective: '1500px' }}>
                      <div
                        onClick={() => setFlipped(f => !f)}
                        className="relative cursor-pointer select-none mx-auto"
                        style={{
                          width: '100%',
                          minHeight: 360,
                          transformStyle: 'preserve-3d',
                          transition: 'transform 0.7s cubic-bezier(0.4, 0.0, 0.2, 1)',
                          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        }}
                      >
                        {/* Front */}
                        <div className="absolute inset-0 rounded-2xl p-8 flex flex-col"
                          style={{
                            backfaceVisibility: 'hidden',
                            background: 'linear-gradient(145deg, rgba(124,58,237,0.16) 0%, rgba(15,23,42,0.85) 50%, rgba(6,182,212,0.10) 100%)',
                            border: '1px solid rgba(124,58,237,0.35)',
                            boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                          }}
                        >
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium"
                                style={{ background: 'rgba(124,58,237,0.25)', color: '#c4b5fd' }}>
                                {currentCard.reps === 0 ? '🌱 新卡' : currentCard.interval < 7 ? '📘 学习中' : currentCard.interval < 21 ? '📗 复习' : '✅ 已掌握'}
                              </span>
                              {currentCard.tags.slice(0, 3).map(t => (
                                <span key={t} className="px-1.5 py-0.5 rounded text-[9.5px]"
                                  style={{ background: 'rgba(6,182,212,0.12)', color: '#67e8f9' }}>#{t}</span>
                              ))}
                            </div>
                            <div className="text-[10px]" style={{ color: '#6b7696' }}>
                              EF {currentCard.ef.toFixed(2)} · 间隔 {currentCard.interval}d
                            </div>
                          </div>
                          <div className="flex-1 flex items-center justify-center">
                            <div className="text-lg md:text-xl leading-relaxed text-center" style={{ color: '#f1f5ff' }}
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(currentCard.front) }} />
                          </div>
                          <div className="text-center text-[11px] mt-4 animate-pulse" style={{ color: '#5b6a8c' }}>
                            点击卡片查看答案 👆
                          </div>
                        </div>
                        {/* Back */}
                        <div className="absolute inset-0 rounded-2xl p-8 flex flex-col"
                          style={{
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            background: 'linear-gradient(145deg, rgba(6,182,212,0.16) 0%, rgba(15,23,42,0.9) 50%, rgba(124,58,237,0.12) 100%)',
                            border: '1px solid rgba(6,182,212,0.35)',
                            boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                          }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded"
                              style={{ background: 'rgba(6,182,212,0.18)', color: '#67e8f9' }}>
                              ✨ 答案 / 解析
                            </span>
                            <button onClick={e => { e.stopPropagation(); setFlipped(false) }}
                              className="p-1 rounded transition-all hover:opacity-80"
                              style={{ background: 'rgba(255,255,255,0.05)', color: '#a8b0c8' }}>
                              <ArrowLeft size={12} />
                            </button>
                          </div>
                          <div className="flex-1 overflow-auto text-[13.5px] leading-relaxed" style={{ color: '#e2e8ff' }}
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(currentCard.back) }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating bar */}
                  <div className="px-6 pb-5 max-w-3xl w-full mx-auto">
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {(['again', 'hard', 'good', 'easy'] as Rating[]).map(r => {
                        const s = RATING_STYLES[r]
                        return (
                          <button key={r}
                            disabled={!flipped}
                            onClick={() => rateCard(r)}
                            className="py-3 rounded-xl text-center transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                            style={{
                              background: s.bg,
                              border: `1px solid ${s.border}`,
                              color: s.text,
                            }}>
                            <div className="text-base mb-0.5">{s.icon}</div>
                            <div className="text-xs font-bold">{s.label}</div>
                            <div className="text-[9.5px] opacity-80">{s.sub}</div>
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] px-1" style={{ color: '#6b7696' }}>
                      <span>本轮已复习 <b style={{ color: '#c4b5fd' }}>{sessionStats.reviewed}</b> 张 · 正确率 <b style={{ color: '#6ee7b7' }}>{sessionStats.reviewed ? Math.round(sessionStats.correct / sessionStats.reviewed * 100) : 0}%</b></span>
                      <span>耗时 <b style={{ color: '#67e8f9' }}>{Math.round(sessionStats.elapsedMs / 1000)}s</b></span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===== BROWSE VIEW ===== */}
          {view === 'browse' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Filter bar */}
              <div className="px-5 py-3 border-b flex items-center gap-2 flex-wrap"
                style={{ borderColor: 'rgba(124,58,237,0.12)', background: 'rgba(0,0,0,0.18)' }}>
                <div className="flex items-center gap-1.5">
                  <Filter size={12} style={{ color: accentCyan }} />
                  <select value={browseFilter.deck || ''}
                    onChange={e => setBrowseFilter(f => ({ ...f, deck: e.target.value || null }))}
                    className="px-2.5 py-1.5 rounded-md text-[11px] outline-none"
                    style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(124,58,237,0.2)', color: '#e8eaf5' }}>
                    <option value="">所有卡组</option>
                    {state.decks.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
                  </select>
                </div>
                <select value={browseFilter.tag || ''}
                  onChange={e => setBrowseFilter(f => ({ ...f, tag: e.target.value || null }))}
                  className="px-2.5 py-1.5 rounded-md text-[11px] outline-none"
                  style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(124,58,237,0.2)', color: '#e8eaf5' }}>
                  <option value="">所有标签</option>
                  {allTags.map(t => <option key={t} value={t}>#{t}</option>)}
                </select>
                <select value={browseFilter.mastery || ''}
                  onChange={e => setBrowseFilter(f => ({ ...f, mastery: (e.target.value || null) as MasteryLevel | null }))}
                  className="px-2.5 py-1.5 rounded-md text-[11px] outline-none"
                  style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(124,58,237,0.2)', color: '#e8eaf5' }}>
                  <option value="">掌握度全部</option>
                  <option value="new">🌱 新卡</option>
                  <option value="learning">📘 学习中</option>
                  <option value="review">📗 复习</option>
                  <option value="mastered">✅ 已掌握</option>
                </select>
                <div className="relative flex-1 min-w-[160px]">
                  <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#6b7696' }} />
                  <input value={browseFilter.search}
                    onChange={e => setBrowseFilter(f => ({ ...f, search: e.target.value }))}
                    placeholder="搜索卡片正面 / 反面 / 标签..."
                    className="w-full pl-7 pr-3 py-1.5 rounded-md text-[11px] outline-none"
                    style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(6,182,212,0.18)', color: '#e8eaf5' }} />
                </div>
                <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <button onClick={() => {
                  setEditingCard(newCard(browseFilter.deck || state.decks[0].id, '', '', [], 'intermediate'))
                  setShowCardModal(true)
                }}
                  className="px-2.5 py-1.5 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all hover:opacity-80"
                  style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(6,182,212,0.28))', color: '#fff', border: '1px solid rgba(124,58,237,0.4)' }}>
                  <Plus size={11} /> 新建卡片
                </button>
                {selectedCardIds.size > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10.5px] px-1.5 py-1 rounded" style={{ background: 'rgba(6,182,212,0.15)', color: '#67e8f9' }}>
                      已选 {selectedCardIds.size}
                    </span>
                    <button onClick={() => { if (confirm(`删除 ${selectedCardIds.size} 张卡片？`)) { deleteCards(Array.from(selectedCardIds)); setSelectedCardIds(new Set()) } }}
                      className="px-2 py-1 rounded text-[10.5px] transition-all hover:opacity-80"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                      <Trash2 size={10} className="inline mr-0.5" /> 批量删除
                    </button>
                    <button onClick={() => setSelectedCardIds(new Set())}
                      className="px-2 py-1 rounded text-[10.5px] transition-all hover:opacity-80"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#a8b0c8' }}>取消</button>
                  </div>
                )}
                <div className="ml-auto text-[10.5px]" style={{ color: '#6b7696' }}>
                  共 {filteredCards.length} / {state.cards.length} 张
                </div>
              </div>

              {/* Cards grid */}
              <div className="flex-1 overflow-auto p-5">
                {filteredCards.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <AlertCircle size={40} className="mx-auto mb-3 opacity-40" />
                      <div className="text-sm mb-1" style={{ color: '#a8b0c8' }}>没有符合条件的卡片</div>
                      <div className="text-xs" style={{ color: '#5b6a8c' }}>尝试修改筛选条件或新建卡片</div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredCards.map(c => {
                      const deck = state.decks.find(d => d.id === c.deckId)
                      const mastery: MasteryLevel = c.reps === 0 ? 'new' : c.interval < 7 ? 'learning' : c.interval < 21 ? 'review' : 'mastered'
                      const masteryMap = { new: ['🌱 新卡', '#7c3aed'], learning: ['📘 学习', '#f59e0b'], review: ['📗 复习', '#06b6d4'], mastered: ['✅ 掌握', '#10b981'] }
                      const [ml, mc] = masteryMap[mastery]
                      const selected = selectedCardIds.has(c.id)
                      return (
                        <div key={c.id}
                          className="rounded-xl p-3 transition-all hover:scale-[1.01] cursor-pointer group"
                          style={{
                            background: selected ? 'rgba(6,182,212,0.10)' : 'rgba(255,255,255,0.025)',
                            border: `1px solid ${selected ? 'rgba(6,182,212,0.45)' : 'rgba(255,255,255,0.06)'}`,
                          }}
                          onClick={() => { setEditingCard(c); setShowCardModal(true) }}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <input type="checkbox" checked={selected}
                              onClick={e => e.stopPropagation()}
                              onChange={e => {
                                const ns = new Set(selectedCardIds)
                                e.target.checked ? ns.add(c.id) : ns.delete(c.id)
                                setSelectedCardIds(ns)
                              }}
                              className="mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                <span className="text-[9px] px-1.5 py-0.5 rounded"
                                  style={{ background: `${mc}20`, color: mc }}>{deck?.icon} {deck?.name}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded"
                                  style={{ background: `${mc}20`, color: mc }}>{ml}</span>
                                {c.isLeech && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>水蛭</span>}
                              </div>
                              <div className="text-[12.5px] font-medium line-clamp-2 mb-1.5 leading-snug"
                                style={{ color: '#f1f5ff' }}
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(c.front).slice(0, 200) }} />
                              <div className="text-[11px] line-clamp-2 leading-relaxed" style={{ color: '#8b95b8' }}
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(c.back).slice(0, 260) }} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 mt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {c.tags.slice(0, 3).map(t => (
                                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded"
                                  style={{ background: 'rgba(124,58,237,0.12)', color: '#c4b5fd' }}>#{t}</span>
                              ))}
                            </div>
                            <div className="text-[9.5px]" style={{ color: '#5b6a8c' }}>
                              EF{c.ef.toFixed(1)} · {c.interval}d · R{c.reps}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== STATS VIEW ===== */}
          {view === 'stats' && <StatsView state={state} />}

        </main>
      </div>

      {/* ===== CARD EDIT MODAL ===== */}
      {showCardModal && editingCard && (
        <CardModal card={editingCard}
          decks={state.decks}
          onClose={() => { setShowCardModal(false); setEditingCard(null) }}
          onSave={(c) => { upsertCard(c); setShowCardModal(false); setEditingCard(null) }}
          onDelete={(c) => { deleteCards([c.id]); setShowCardModal(false); setEditingCard(null) }}
        />
      )}
      {/* ===== DECK EDIT MODAL ===== */}
      {showDeckModal && editingDeck && (
        <DeckModal deck={editingDeck}
          onClose={() => { setShowDeckModal(false); setEditingDeck(null) }}
          onSave={(d) => { upsertDeck(d); setShowDeckModal(false); setEditingDeck(null) }}
        />
      )}
    </div>
  )
}

// ============================================================
// SUB COMPONENTS
// ============================================================
function TodayTile({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${color}22` }}>
      <div className="flex items-center gap-1 mb-1 text-[9.5px]" style={{ color }}>
        {icon} {label}
      </div>
      <div className="text-xs font-bold" style={{ color: '#fff' }}>{value}</div>
    </div>
  )
}

// ============ CARD MODAL ============
function CardModal({ card, decks, onClose, onSave, onDelete }: {
  card: Card; decks: Deck[]; onClose: () => void; onSave: (c: Card) => void; onDelete: (c: Card) => void;
}) {
  const [draft, setDraft] = useState<Card>(card)
  const [tagInput, setTagInput] = useState('')
  const [preview, setPreview] = useState(false)
  const isNew = !card.createdAt || card.reviewHistory.length === 0 && card.reps === 0 && card.interval === 0
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ background: 'linear-gradient(135deg, #0e1430 0%, #0b1628 100%)', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
        <div className="px-5 py-3.5 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
          <div className="text-sm font-bold flex items-center gap-2" style={{ color: '#fff' }}>
            <Sparkles size={15} style={{ color: '#c4b5fd' }} />
            {isNew ? '新建卡片' : '编辑卡片'}
          </div>
          <button onClick={onClose} className="p-1 rounded transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#a8b0c8' }}>
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] block mb-1.5" style={{ color: '#8b95b8' }}>所属卡组</label>
              <select value={draft.deckId}
                onChange={e => setDraft({ ...draft, deckId: e.target.value })}
                className="w-full px-3 py-2 rounded-md text-xs outline-none"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(124,58,237,0.2)', color: '#e8eaf5' }}>
                {decks.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] block mb-1.5" style={{ color: '#8b95b8' }}>难度预设</label>
              <select value={draft.difficulty}
                onChange={e => setDraft({ ...draft, difficulty: e.target.value as DifficultyPreset })}
                className="w-full px-3 py-2 rounded-md text-xs outline-none"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(124,58,237,0.2)', color: '#e8eaf5' }}>
                <option value="beginner">🌱 入门</option>
                <option value="intermediate">📘 中等</option>
                <option value="advanced">⚡ 进阶</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px]" style={{ color: '#c4b5fd' }}>卡片正面（问题 / 词汇）</label>
              <button onClick={() => setPreview(p => !p)} className="text-[10px] px-2 py-0.5 rounded transition-all hover:opacity-80"
                style={{ background: 'rgba(6,182,212,0.15)', color: '#67e8f9' }}>
                {preview ? '✏️ 编辑' : '👁 预览'}
              </button>
            </div>
            {preview ? (
              <div className="p-4 rounded-lg text-sm min-h-[96px]"
                style={{ background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.25)', color: '#f1f5ff' }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(draft.front) || '<span style="opacity:0.4">(空)</span>' }} />
            ) : (
              <textarea value={draft.front}
                onChange={e => setDraft({ ...draft, front: e.target.value })}
                rows={3} placeholder="卡片正面内容..."
                className="w-full px-3 py-2 rounded-md text-xs outline-none resize-none"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(124,58,237,0.2)', color: '#e8eaf5', fontFamily: 'inherit' }} />
            )}
          </div>

          <div>
            <label className="text-[11px] block mb-1.5" style={{ color: '#67e8f9' }}>卡片反面（答案 / 解析 / Markdown 支持 **粗体** `代码` 换行）</label>
            {preview ? (
              <div className="p-4 rounded-lg text-sm min-h-[150px] leading-relaxed"
                style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', color: '#e2e8ff' }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(draft.back) || '<span style="opacity:0.4">(空)</span>' }} />
            ) : (
              <textarea value={draft.back}
                onChange={e => setDraft({ ...draft, back: e.target.value })}
                rows={6} placeholder="卡片反面内容..."
                className="w-full px-3 py-2 rounded-md text-xs outline-none resize-none"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(6,182,212,0.2)', color: '#e8eaf5', fontFamily: 'ui-monospace, monospace' }} />
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="text-[11px] block mb-1.5 flex items-center gap-1.5" style={{ color: '#8b95b8' }}>
              <Tag size={11} /> 标签
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {draft.tags.map(t => (
                <span key={t} className="px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1"
                  style={{ background: 'rgba(124,58,237,0.15)', color: '#c4b5fd' }}>
                  #{t}
                  <button onClick={() => setDraft({ ...draft, tags: draft.tags.filter(x => x !== t) })}
                    className="hover:opacity-70"><X size={9} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault()
                    const t = tagInput.trim().replace(/^#/, '')
                    if (!draft.tags.includes(t)) setDraft({ ...draft, tags: [...draft.tags, t] })
                    setTagInput('')
                  }
                }}
                placeholder="输入后按回车添加标签"
                className="flex-1 px-3 py-1.5 rounded-md text-[11px] outline-none"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(124,58,237,0.2)', color: '#e8eaf5' }} />
              <button onClick={() => {
                if (tagInput.trim()) {
                  const t = tagInput.trim().replace(/^#/, '')
                  if (!draft.tags.includes(t)) setDraft({ ...draft, tags: [...draft.tags, t] })
                  setTagInput('')
                }
              }} className="px-3 py-1.5 rounded-md text-[11px]"
                style={{ background: 'rgba(124,58,237,0.2)', color: '#c4b5fd' }}>添加</button>
            </div>
          </div>

          {!isNew && (
            <div className="p-3 rounded-lg grid grid-cols-4 gap-3 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              {[
                ['复习次数', `${draft.reps}`],
                ['当前间隔', `${draft.interval} 天`],
                ['难度系数 EF', draft.ef.toFixed(2)],
                ['失误次数', `${draft.lapses}${draft.isLeech ? ' (水蛭)' : ''}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-[9.5px] mb-1" style={{ color: '#6b7696' }}>{k}</div>
                  <div className="text-xs font-bold" style={{ color: '#e8eaf5' }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t flex items-center gap-2"
          style={{ borderColor: 'rgba(124,58,237,0.15)', background: 'rgba(0,0,0,0.2)' }}>
          {!isNew && (
            <button onClick={() => { if (confirm('确认删除这张卡片？')) onDelete(draft) }}
              className="px-3 py-1.5 rounded-md text-xs transition-all hover:opacity-80"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
              <Trash2 size={11} className="inline mr-0.5" /> 删除
            </button>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-1.5 rounded-md text-xs transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#a8b0c8' }}>取消</button>
          <button onClick={() => onSave(draft)} className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: '#fff', boxShadow: '0 6px 18px rgba(124,58,237,0.35)' }}>
            <Check size={11} className="inline mr-0.5" /> 保存卡片
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ DECK MODAL ============
function DeckModal({ deck, onClose, onSave }: { deck: Deck; onClose: () => void; onSave: (d: Deck) => void }) {
  const [draft, setDraft] = useState<Deck>(deck)
  const icons = ['📚', '📒', '📗', '📘', '📙', '💡', '🧠', '⚛️', '🧱', '🧮', '🎯', '⭐', '🚀', '🔥', '🌱', '🎨']
  const isNew = !deck.name
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ background: 'linear-gradient(135deg, #0e1430 0%, #0b1628 100%)', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
        <div className="px-5 py-3.5 border-b flex items-center justify-between"
          style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
          <div className="text-sm font-bold" style={{ color: '#fff' }}>
            {isNew ? '新建卡组' : '编辑卡组'}
          </div>
          <button onClick={onClose} className="p-1 rounded transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#a8b0c8' }}>
            <X size={14} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] block mb-1.5" style={{ color: '#8b95b8' }}>卡组名称</label>
            <input value={draft.name}
              onChange={e => setDraft({ ...draft, name: e.target.value })}
              placeholder="如：日语 N2 词汇"
              className="w-full px-3 py-2 rounded-md text-xs outline-none"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(124,58,237,0.2)', color: '#e8eaf5' }} />
          </div>
          <div>
            <label className="text-[11px] block mb-1.5" style={{ color: '#8b95b8' }}>描述</label>
            <input value={draft.description}
              onChange={e => setDraft({ ...draft, description: e.target.value })}
              placeholder="一句话描述卡组内容"
              className="w-full px-3 py-2 rounded-md text-xs outline-none"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(124,58,237,0.2)', color: '#e8eaf5' }} />
          </div>
          <div>
            <label className="text-[11px] block mb-1.5" style={{ color: '#8b95b8' }}>图标</label>
            <div className="grid grid-cols-8 gap-1.5">
              {icons.map(ic => (
                <button key={ic} onClick={() => setDraft({ ...draft, icon: ic })}
                  className="w-9 h-9 rounded-md text-base transition-all hover:scale-110"
                  style={{
                    background: draft.icon === ic ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${draft.icon === ic ? 'rgba(124,58,237,0.5)' : 'transparent'}`,
                  }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] block mb-1.5" style={{ color: '#8b95b8' }}>主题色</label>
            <div className="grid grid-cols-6 gap-1.5">
              {DECK_COLORS.map((col, i) => (
                <button key={i} onClick={() => setDraft({ ...draft, color: col })}
                  className="h-9 rounded-md transition-all hover:scale-110"
                  style={{
                    background: col,
                    border: `2px solid ${draft.color === col ? '#fff' : 'transparent'}`,
                    boxShadow: draft.color === col ? '0 0 10px rgba(255,255,255,0.3)' : undefined,
                  }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] block mb-1.5" style={{ color: '#8b95b8' }}>每日新卡上限</label>
              <input type="number" min={1} max={200} value={draft.newCardsPerDay}
                onChange={e => setDraft({ ...draft, newCardsPerDay: Math.max(1, Math.min(200, +e.target.value || 20)) })}
                className="w-full px-3 py-2 rounded-md text-xs outline-none"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(124,58,237,0.2)', color: '#e8eaf5' }} />
            </div>
            <div>
              <label className="text-[11px] block mb-1.5" style={{ color: '#8b95b8' }}>每日复习上限</label>
              <input type="number" min={10} max={1000} value={draft.reviewsPerDay}
                onChange={e => setDraft({ ...draft, reviewsPerDay: Math.max(10, Math.min(1000, +e.target.value || 200)) })}
                className="w-full px-3 py-2 rounded-md text-xs outline-none"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(124,58,237,0.2)', color: '#e8eaf5' }} />
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t flex items-center justify-end gap-2"
          style={{ borderColor: 'rgba(124,58,237,0.15)', background: 'rgba(0,0,0,0.2)' }}>
          <button onClick={onClose} className="px-4 py-1.5 rounded-md text-xs transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#a8b0c8' }}>取消</button>
          <button onClick={() => {
            if (!draft.name.trim()) { alert('请输入卡组名称'); return }
            onSave(draft)
          }} className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: '#fff' }}>
            <Check size={11} className="inline mr-0.5" /> 保存卡组
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ STATS VIEW ============
function StatsView({ state }: { state: AppState }) {
  // Build date range for heatmap (182 days = ~6 months)
  const today = new Date()
  const DAYS = 182
  const dateArr: string[] = []
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    dateArr.push(d.toISOString().slice(0, 10))
  }
  const byDate: Record<string, StudySession> = {}
  for (const s of state.sessions) byDate[s.date] = s

  // Daily counts
  const maxReview = Math.max(1, ...state.sessions.map(s => s.reviewed), 20)

  // Mastery distribution
  const masteryDist = useMemo(() => {
    let n = 0, lg = 0, rv = 0, m = 0
    for (const c of state.cards) {
      if (c.reps === 0) n++
      else if (c.interval < 7) lg++
      else if (c.interval < 21) rv++
      else m++
    }
    return { new: n, learning: lg, review: rv, mastered: m, total: state.cards.length }
  }, [state.cards])

  // Difficulty distribution
  const diffDist = useMemo(() => {
    const out = { beginner: 0, intermediate: 0, advanced: 0 }
    for (const c of state.cards) out[c.difficulty]++
    return out
  }, [state.cards])

  // Total stats
  const totalReviewed = state.sessions.reduce((s, x) => s + x.reviewed, 0)
  const totalCorrect = state.sessions.reduce((s, x) => s + x.correct, 0)
  const totalSec = state.sessions.reduce((s, x) => s + x.durationSec, 0)
  const weeklyReviewed = state.sessions
    .filter(s => s.date >= addDays(todayStr(), -6)).reduce((s, x) => s + x.reviewed, 0)
  const todaySession = byDate[todayStr()]

  // Heatmap render: 53 weeks x 7 days
  const weeks: (string | null)[][] = []
  let cur: (string | null)[] = []
  // Pad beginning with nulls until first Sunday
  const firstDate = new Date(dateArr[0])
  const startPad = firstDate.getDay()
  for (let i = 0; i < startPad; i++) cur.push(null)
  for (const d of dateArr) {
    cur.push(d)
    if (cur.length === 7) { weeks.push(cur); cur = [] }
  }
  if (cur.length) { while (cur.length < 7) cur.push(null); weeks.push(cur) }

  const heatColor = (n: number) => {
    if (n <= 0) return 'rgba(255,255,255,0.04)'
    if (n < 5) return 'rgba(124,58,237,0.28)'
    if (n < 15) return 'rgba(124,58,237,0.55)'
    if (n < 30) return 'rgba(6,182,212,0.55)'
    return 'rgba(6,182,212,0.95)'
  }

  const pieMasteryData = [
    { label: '新卡', value: masteryDist.new, color: '#7c3aed' },
    { label: '学习中', value: masteryDist.learning, color: '#f59e0b' },
    { label: '复习', value: masteryDist.review, color: '#06b6d4' },
    { label: '已掌握', value: masteryDist.mastered, color: '#10b981' },
  ]
  const totalPie = Math.max(1, pieMasteryData.reduce((s, d) => s + d.value, 0))

  return (
    <div className="flex-1 overflow-auto p-6 space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '今日复习', value: todaySession?.reviewed || 0, sub: '卡片', color: '#06b6d4', icon: <Zap size={14} /> },
          { label: '本周复习', value: weeklyReviewed, sub: '卡片', color: '#7c3aed', icon: <Calendar size={14} /> },
          { label: '累计掌握', value: masteryDist.mastered, sub: `总卡 ${masteryDist.total}`, color: '#10b981', icon: <Trophy size={14} /> },
          { label: '累计正确率', value: totalReviewed ? Math.round(totalCorrect / totalReviewed * 100) : 0, sub: `${totalCorrect}/${totalReviewed}`, color: '#f59e0b', icon: <Star size={14} /> },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-xl relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${s.color}22 0%, rgba(255,255,255,0.02) 100%)`,
              border: `1px solid ${s.color}30`,
            }}>
            <div className="absolute -right-3 -top-3 w-12 h-12 rounded-full opacity-20" style={{ background: s.color, filter: 'blur(8px)' }} />
            <div className="text-[11px] mb-1 flex items-center gap-1.5" style={{ color: s.color }}>{s.icon} {s.label}</div>
            <div className="text-2xl font-bold mb-0.5" style={{ color: '#fff' }}>{s.value}{i === 3 ? '%' : ''}</div>
            <div className="text-[10px]" style={{ color: '#6b7696' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Streak banner */}
      <div className="rounded-xl p-5 flex items-center gap-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(124,58,237,0.18) 50%, rgba(6,182,212,0.15) 100%)',
          border: '1px solid rgba(239,68,68,0.25)',
        }}>
        <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: 'linear-gradient(135deg, #ef4444, #f59e0b)', boxShadow: '0 10px 30px rgba(239,68,68,0.4)' }}>
          🔥
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold mb-1" style={{ color: '#fff' }}>
            当前连续打卡 <span style={{ color: '#fca5a5' }}>{state.currentStreak}</span> 天
          </div>
          <div className="text-xs" style={{ color: '#b3bddc' }}>
            历史最长：<b style={{ color: '#c4b5fd' }}>{state.longestStreak}</b> 天
            <span className="mx-2">·</span>
            累计学习时长：<b style={{ color: '#67e8f9' }}>{Math.floor(totalSec / 60)} 分 {totalSec % 60} 秒</b>
          </div>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-[10px] mb-1" style={{ color: '#7a85a8' }}>TIP</div>
          <div className="text-[11px] leading-relaxed max-w-[190px]" style={{ color: '#c4ccde' }}>
            坚持每天复习，哪怕 5 分钟。长期记忆的关键不是强度，而是 <b style={{ color: '#fbbf24' }}>间隔重复</b>。
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold flex items-center gap-2" style={{ color: '#fff' }}>
            <Calendar size={15} style={{ color: '#06b6d4' }} /> 学习热力图 · 近 6 个月
          </div>
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: '#6b7696' }}>
            少
            {['rgba(255,255,255,0.04)', 'rgba(124,58,237,0.28)', 'rgba(124,58,237,0.55)', 'rgba(6,182,212,0.55)', 'rgba(6,182,212,0.95)']
              .map((c, i) => <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />)}
            多
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="inline-block">
            {/* Month labels */}
            <div className="flex text-[9px] mb-1" style={{ color: '#6b7696', paddingLeft: 18 }}>
              {(() => {
                const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
                const last: Record<number, boolean> = {}
                const res: React.ReactNode[] = []
                weeks.forEach((w, wi) => {
                  const realDay = w.find(d => d)
                  if (realDay) {
                    const m = new Date(realDay).getMonth()
                    if (!last[m]) { last[m] = true; res.push(<div key={wi} style={{ width: 13 * 7 + 6 }}>{months[m]}</div>) }
                    else res.push(<div key={wi} style={{ width: 13 * 7 + 6 }} />)
                  }
                })
                return res
              })()}
            </div>
            <div className="flex gap-1">
              <div className="flex flex-col gap-[3px] pr-1.5 text-[9px]" style={{ color: '#6b7696', paddingTop: 1 }}>
                <div style={{ height: 11, lineHeight: '11px' }}>日</div>
                <div style={{ height: 11, lineHeight: '11px' }}>一</div>
                <div style={{ height: 11, lineHeight: '11px' }}>二</div>
                <div style={{ height: 11, lineHeight: '11px' }}>三</div>
                <div style={{ height: 11, lineHeight: '11px' }}>四</div>
                <div style={{ height: 11, lineHeight: '11px' }}>五</div>
                <div style={{ height: 11, lineHeight: '11px' }}>六</div>
              </div>
              {weeks.map((wk, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {wk.map((d, di) => {
                    const n = d ? (byDate[d]?.reviewed || 0) : -1
                    return (
                      <div key={di}
                        title={d ? `${d} · 复习 ${n} 张` : ''}
                        className="w-3 h-[11px] rounded-[2px] transition-all hover:scale-125"
                        style={{ background: n >= 0 ? heatColor(n) : 'transparent', outline: d === todayStr() ? '1px solid #fff' : undefined }} />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 7/30 day line chart */}
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold flex items-center gap-2" style={{ color: '#fff' }}>
              <BarChart3 size={15} style={{ color: '#7c3aed' }} /> 复习曲线
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] flex items-center gap-1" style={{ color: '#67e8f9' }}>
                <span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#06b6d4' }} /> 复习数
              </span>
              <span className="text-[10px] flex items-center gap-1" style={{ color: '#c4b5fd' }}>
                <span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#7c3aed' }} /> 新卡
              </span>
            </div>
          </div>
          {(() => {
            const days = 30
            const labels: string[] = []
            const reviews: number[] = []
            const news: number[] = []
            for (let i = days - 1; i >= 0; i--) {
              const d = addDays(todayStr(), -i)
              labels.push(d.slice(5))
              const s = byDate[d]
              reviews.push(s?.reviewed || 0)
              news.push(s?.newCards || 0)
            }
            const W = 560, H = 200, PAD = { t: 18, r: 16, b: 28, l: 32 }
            const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b
            const max = Math.max(maxReview, ...reviews, ...news, 10)
            const stepX = iw / (days - 1)
            const yScale = (v: number) => PAD.t + ih - (v / max) * ih
            const revPath = reviews.map((v, i) => `${i === 0 ? 'M' : 'L'}${PAD.l + i * stepX},${yScale(v)}`).join(' ')
            const revArea = revPath + ` L${PAD.l + (days - 1) * stepX},${PAD.t + ih} L${PAD.l},${PAD.t + ih} Z`
            const newPath = news.map((v, i) => `${i === 0 ? 'M' : 'L'}${PAD.l + i * stepX},${yScale(v)}`).join(' ')
            const newArea = newPath + ` L${PAD.l + (days - 1) * stepX},${PAD.t + ih} L${PAD.l},${PAD.t + ih} Z`
            const ticks = 4
            return (
              <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ fontFamily: 'inherit', display: 'block' }}>
                <defs>
                  <linearGradient id="revG" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="newG" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {Array.from({ length: ticks + 1 }).map((_, i) => {
                  const y = PAD.t + (ih / ticks) * i
                  const val = Math.round(max - (max / ticks) * i)
                  return (
                    <g key={i}>
                      <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                      <text x={PAD.l - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#6b7696">{val}</text>
                    </g>
                  )
                })}
                <path d={revArea} fill="url(#revG)" />
                <path d={newArea} fill="url(#newG)" />
                <path d={revPath} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d={newPath} fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4,3" />
                {labels.map((l, i) => i % 5 === 0 && (
                  <text key={i} x={PAD.l + i * stepX} y={H - 10} textAnchor="middle" fontSize="9" fill="#6b7696">{l}</text>
                ))}
              </svg>
            )
          })()}
        </div>

        {/* Mastery Pie */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-sm font-bold flex items-center gap-2 mb-4" style={{ color: '#fff' }}>
            <PieIcon size={15} style={{ color: '#10b981' }} /> 掌握度分布
          </div>
          {(() => {
            const W = 260, H = 240
            const cx = W / 2, cy = H / 2 - 4
            const R = Math.min(W, H) / 2 - 28
            const rInner = R * 0.6
            let accA = -Math.PI / 2
            return (
              <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ fontFamily: 'inherit', display: 'block' }}>
                {pieMasteryData.map((seg, i) => {
                  if (seg.value <= 0) return null
                  const a0 = accA
                  const a1 = accA + (seg.value / totalPie) * Math.PI * 2
                  accA = a1
                  const pct = (seg.value / totalPie * 100).toFixed(1)
                  const large = a1 - a0 > Math.PI ? 1 : 0
                  const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0)
                  const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1)
                  const xi0 = cx + rInner * Math.cos(a0), yi0 = cy + rInner * Math.sin(a0)
                  const xi1 = cx + rInner * Math.cos(a1), yi1 = cy + rInner * Math.sin(a1)
                  const d = `M${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} L${xi1},${yi1} A${rInner},${rInner} 0 ${large} 0 ${xi0},${yi0} Z`
                  const labelA = (a0 + a1) / 2
                  const lx = cx + (R * 0.82) * Math.cos(labelA)
                  const ly = cy + (R * 0.82) * Math.sin(labelA)
                  return (
                    <g key={i}>
                      <path d={d} fill={seg.color} opacity={0.92} stroke="#0e1430" strokeWidth="1.5">
                        <title>{seg.label}: {seg.value} ({pct}%)</title>
                      </path>
                      {seg.value / totalPie > 0.08 && (
                        <text x={lx} y={ly} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" style={{ paintOrder: 'stroke', stroke: '#0e1430', strokeWidth: 3 }}>{pct}%</text>
                      )}
                    </g>
                  )
                })}
                <text x={cx} y={cy - 2} textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff">{totalPie}</text>
                <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#6b7696">总卡片</text>
              </svg>
            )
          })()}
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {pieMasteryData.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                <span className="text-[10px] flex-1" style={{ color: '#a8b0c8' }}>{s.label}</span>
                <span className="text-[10px] font-semibold" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Difficulty + Top decks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-sm font-bold flex items-center gap-2 mb-4" style={{ color: '#fff' }}>
            <Settings size={15} style={{ color: '#f59e0b' }} /> 按难度分布
          </div>
          {(() => {
            const data = [
              { k: 'beginner', label: '🌱 入门', v: diffDist.beginner, c: '#10b981' },
              { k: 'intermediate', label: '📘 中等', v: diffDist.intermediate, c: '#06b6d4' },
              { k: 'advanced', label: '⚡ 进阶', v: diffDist.advanced, c: '#7c3aed' },
            ]
            const maxV = Math.max(1, ...data.map(d => d.v))
            const total = data.reduce((s, d) => s + d.v, 0)
            return (
              <div className="space-y-3">
                {data.map(d => (
                  <div key={d.k}>
                    <div className="flex items-center justify-between mb-1 text-[11px]">
                      <span style={{ color: '#c4ccde' }}>{d.label}</span>
                      <span style={{ color: '#6b7696' }}>{d.v} ({total ? Math.round(d.v / total * 100) : 0}%)</span>
                    </div>
                    <div className="h-5 rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-md transition-all"
                        style={{ width: `${(d.v / maxV) * 100}%`, background: `linear-gradient(90deg, ${d.c}cc, ${d.c}77)`, boxShadow: `0 0 8px ${d.c}44` }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>

        <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-sm font-bold flex items-center gap-2 mb-4" style={{ color: '#fff' }}>
            <Trophy size={15} style={{ color: '#ec4899' }} /> 卡组学习榜 TOP
          </div>
          <div className="space-y-2">
            {(() => {
              const ds = state.decks.map(d => {
                const cards = state.cards.filter(c => c.deckId === d.id)
                const reviewed = cards.filter(c => c.reps > 0).length
                const mastered = cards.filter(c => c.interval >= 21).length
                return { d, total: cards.length, reviewed, mastered }
              }).sort((a, b) => b.mastered - a.mastered || b.reviewed - a.reviewed).slice(0, 5)
              return ds.map((row, i) => {
                const progress = row.total ? Math.round((row.reviewed / row.total) * 100) : 0
                return (
                  <div key={row.d.id} className="flex items-center gap-3 p-2.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                      style={{
                        background: i === 0 ? 'linear-gradient(135deg,#f59e0b,#ef4444)' :
                          i === 1 ? 'linear-gradient(135deg,#94a3b8,#64748b)' :
                            i === 2 ? 'linear-gradient(135deg,#d97706,#b45309)' :
                              'rgba(255,255,255,0.05)',
                        color: i < 3 ? '#fff' : '#8b95b8',
                      }}>{i + 1}</div>
                    <div className="w-8 h-8 rounded-md flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: row.d.color, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{row.d.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11.5px] font-medium mb-1 truncate" style={{ color: '#e8eaf5' }}>{row.d.name}</div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#7c3aed,#06b6d4)' }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px]" style={{ color: '#67e8f9' }}>学 {row.reviewed}/{row.total}</div>
                      <div className="text-[10px]" style={{ color: '#6ee7b7' }}>握 {row.mastered}</div>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
