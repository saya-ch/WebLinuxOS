import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Compass,
  BookOpen,
  Code,
  Check,
  Star,
  Clock,
  TrendingUp,
  Search,
  Filter,
  BookMarked,
  Play,
  ExternalLink,
  Award,
  Target,
  BarChart2,
  Flame,
  Rocket,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Zap,
  FileText,
  MapPin,
} from 'lucide-react'

/* ───────────────────────── 类型定义 ───────────────────────── */
interface LearningPath {
  id: string
  title: string
  category: string
  icon: React.ReactNode
  color: string
  description: string
  difficulty: '入门' | '初级' | '中级' | '高级' | '专家'
  duration: string
  steps: PathStep[]
  tags: string[]
}

interface PathStep {
  id: string
  title: string
  description: string
  type: 'learn' | 'practice' | 'project' | 'read' | 'watch'
  resources: Resource[]
  est: string
}

interface Resource {
  title: string
  type: 'doc' | 'video' | 'course' | 'book' | 'repo' | 'article' | 'practice' | 'tool'
  url: string
  free: boolean
  note?: string
}

/* ───────────────────────── 数据：真实高质量学习路径 ───────────────────────── */
const PATHS: LearningPath[] = [
  {
    id: 'frontend',
    title: '现代前端工程师',
    category: '前端开发',
    icon: <Code size={20} />,
    color: '#60a5fa',
    description: '从零到构建生产级 Web 应用：HTML/CSS → JS → React → TypeScript → 工程化',
    difficulty: '入门',
    duration: '6 - 9 个月',
    tags: ['React', 'TypeScript', 'Vite', 'CSS', 'HTML'],
    steps: [
      {
        id: 'f1', title: 'HTML & CSS 基础',
        description: '掌握语义化 HTML、CSS 选择器、盒模型、Flexbox、Grid、响应式设计',
        type: 'learn', est: '3 周',
        resources: [
          { title: 'MDN HTML 指南', type: 'doc', url: 'https://developer.mozilla.org/zh-CN/docs/Web/HTML', free: true },
          { title: 'MDN CSS 指南', type: 'doc', url: 'https://developer.mozilla.org/zh-CN/docs/Web/CSS', free: true },
          { title: 'freeCodeCamp 响应式网页设计', type: 'course', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', free: true },
          { title: 'CSS Grid Garden', type: 'practice', url: 'https://cssgridgarden.com/#zh-cn', free: true },
        ],
      },
      {
        id: 'f2', title: 'JavaScript 核心语言',
        description: '变量、类型系统、函数、作用域、闭包、异步编程、ES6+ 新特性',
        type: 'learn', est: '4 周',
        resources: [
          { title: 'JavaScript .info 现代教程', type: 'book', url: 'https://zh.javascript.info/', free: true, note: '强烈推荐' },
          { title: 'MDN JavaScript', type: 'doc', url: 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript', free: true },
          { title: 'Eloquent JavaScript', type: 'book', url: 'https://eloquentjavascript.net/', free: true },
        ],
      },
      {
        id: 'f3', title: '浏览器 API & DOM',
        description: 'DOM 操作、事件循环、Fetch / Promise / async、localStorage、Canvas、Web Worker',
        type: 'learn', est: '2 周',
        resources: [
          { title: 'JavaScript30 三十天挑战', type: 'course', url: 'https://javascript30.com/', free: true },
          { title: 'MDN Web API', type: 'doc', url: 'https://developer.mozilla.org/zh-CN/docs/Web/API', free: true },
        ],
      },
      {
        id: 'f4', title: 'React 框架 & 生态',
        description: 'JSX、组件化、Hooks、状态管理、路由、数据请求',
        type: 'learn', est: '4 周',
        resources: [
          { title: 'React 官方文档', type: 'doc', url: 'https://zh-hans.react.dev/', free: true, note: '官方文档最权威' },
          { title: 'React 官方教程', type: 'course', url: 'https://zh-hans.react.dev/learn', free: true },
          { title: 'useHooks', type: 'article', url: 'https://usehooks.com/', free: true },
        ],
      },
      {
        id: 'f5', title: 'TypeScript 类型编程',
        description: '基础类型、泛型、工具类型、高级类型体操、DTS 编写',
        type: 'learn', est: '3 周',
        resources: [
          { title: 'TypeScript 官方手册', type: 'doc', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', free: true },
          { title: 'Type Challenges', type: 'practice', url: 'https://github.com/type-challenges/type-challenges', free: true, note: '类型体操练习合集' },
        ],
      },
      {
        id: 'f6', title: '工程化 & 构建工具',
        description: 'Vite / Webpack、ESLint、Prettier、单测、Babel、性能优化、打包分析',
        type: 'learn', est: '3 周',
        resources: [
          { title: 'Vite 中文文档', type: 'doc', url: 'https://cn.vitejs.dev/', free: true },
          { title: 'ESLint 中文文档', type: 'doc', url: 'https://eslint.nodejs.cn/', free: true },
        ],
      },
      {
        id: 'f7', title: '综合项目实战',
        description: '构建完整的应用：Todo → 博客 → SaaS Dashboard → 开源贡献',
        type: 'project', est: '4 周+',
        resources: [
          { title: 'Frontend Mentor', type: 'practice', url: 'https://www.frontendmentor.io/', free: true, note: '真实 UI 挑战' },
          { title: 'CodeSandbox', type: 'repo', url: 'https://codesandbox.io/', free: true },
        ],
      },
    ],
  },
  {
    id: 'fullstack',
    title: '全栈 JavaScript',
    category: '全栈开发',
    icon: <Rocket size={20} />,
    color: '#34d399',
    description: '从前端到后端：Node.js → Express/Nest → 数据库 → 鉴权 → 部署上线',
    difficulty: '中级',
    duration: '4 - 6 个月',
    tags: ['Node.js', 'MongoDB', 'PostgreSQL', 'REST', 'JWT'],
    steps: [
      {
        id: 'b1', title: 'Node.js 基础 & 模块系统',
        description: 'CommonJS/ESM、文件系统、Buffer、Stream、child_process、事件循环',
        type: 'learn', est: '2 周',
        resources: [
          { title: 'Node.js 中文文档', type: 'doc', url: 'https://nodejs.cn/api/', free: true },
          { title: 'Node School', type: 'course', url: 'https://nodeschool.io/zh-cn/', free: true },
        ],
      },
      {
        id: 'b2', title: 'HTTP & RESTful & Express',
        description: '路由、中间件、错误处理、请求校验、日志、JWT、OAuth',
        type: 'learn', est: '3 周',
        resources: [
          { title: 'Express 官方指南', type: 'doc', url: 'https://expressjs.com/zh-cn/', free: true },
          { title: 'RESTful 最佳实践', type: 'article', url: 'https://stackoverflow.blog/2020/03/02/best-practices-for-rest-api-design/', free: true },
        ],
      },
      {
        id: 'b3', title: '数据库 & ORM',
        description: 'SQL 基础、MongoDB、PostgreSQL、Prisma / TypeORM',
        type: 'learn', est: '3 周',
        resources: [
          { title: 'SQLBolt', type: 'practice', url: 'https://sqlbolt.com/', free: true, note: 'SQL 交互式学习' },
          { title: 'Prisma 中文文档', type: 'doc', url: 'https://prisma.nodejs.cn/', free: true },
          { title: 'MongoDB 大学', type: 'course', url: 'https://learn.mongodb.com/', free: true },
        ],
      },
      {
        id: 'b4', title: '鉴权 & 安全',
        description: '会话 vs JWT、bcrypt 密码哈希、XSS/CSRF 防御、限流、CORS',
        type: 'learn', est: '2 周',
        resources: [
          { title: 'OWASP Top 10', type: 'doc', url: 'https://owasp.org/www-project-top-ten/', free: true },
          { title: 'JWT.io', type: 'tool', url: 'https://jwt.io/', free: true },
        ],
      },
      {
        id: 'b5', title: 'Docker & 部署',
        description: 'Dockerfile、compose、CI/CD (GitHub Actions)、Nginx、Linux 基础',
        type: 'project', est: '2 周',
        resources: [
          { title: 'Docker 入门到实践', type: 'book', url: 'https://vuepress.mirror.docker-practice.com/', free: true },
          { title: 'GitHub Actions 文档', type: 'doc', url: 'https://docs.github.com/zh/actions', free: true },
        ],
      },
    ],
  },
  {
    id: 'python',
    title: 'Python 数据分析 & AI',
    category: '数据 / AI',
    icon: <Sparkles size={20} />,
    color: '#fbbf24',
    description: 'Python → NumPy/Pandas → 数据可视化 → 机器学习 → LLM 应用开发',
    difficulty: '初级',
    duration: '5 - 8 个月',
    tags: ['Python', 'Pandas', 'sklearn', 'LLM', 'LangChain'],
    steps: [
      {
        id: 'p1', title: 'Python 语言基础',
        description: '语法、数据结构、函数、OOP、文件、异常处理、标准库',
        type: 'learn', est: '3 周',
        resources: [
          { title: '菜鸟教程 Python', type: 'doc', url: 'https://www.runoob.com/python3/python3-tutorial.html', free: true },
          { title: 'Python for Everybody', type: 'course', url: 'https://www.py4e.com/', free: true },
          { title: 'HackerRank Python', type: 'practice', url: 'https://www.hackerrank.com/domains/python', free: true },
        ],
      },
      {
        id: 'p2', title: '数据分析三板斧',
        description: 'NumPy 数值计算、Pandas 数据处理、Matplotlib/Seaborn 可视化',
        type: 'learn', est: '4 周',
        resources: [
          { title: 'kaggle Learn', type: 'course', url: 'https://www.kaggle.com/learn', free: true, note: '官方认证课程' },
          { title: 'Python 数据分析第二版', type: 'book', url: 'https://wesmckinney.com/book/', free: true, note: 'Pandas 作者原著' },
        ],
      },
      {
        id: 'p3', title: '统计 & 机器学习基础',
        description: '描述性统计、假设检验、回归、分类、聚类、决策树',
        type: 'learn', est: '4 周',
        resources: [
          { title: 'sklearn 用户指南', type: 'doc', url: 'https://scikit-learn.org/stable/user_guide.html', free: true },
          { title: '统计学习方法（李航）', type: 'book', url: 'https://www.bilibili.com/video/BV1o7411C7Zq/', free: true, note: '中文视频讲解' },
        ],
      },
      {
        id: 'p4', title: 'Kaggle 实战',
        description: '参加 Kaggle 竞赛、Titanic / House Prices、Notebook 写作',
        type: 'project', est: '4 周+',
        resources: [
          { title: 'Kaggle', type: 'practice', url: 'https://www.kaggle.com/', free: true },
        ],
      },
      {
        id: 'p5', title: 'LLM 应用开发',
        description: 'Prompt 工程、RAG 开发、向量数据库、LangChain / LlamaIndex、Agent',
        type: 'learn', est: '4 周',
        resources: [
          { title: 'LangChain 中文文档', type: 'doc', url: 'https://python.langchain.com/zh', free: true },
          { title: 'Prompt Engineering Guide', type: 'doc', url: 'https://www.promptingguide.ai/zh', free: true },
          { title: '吴恩达 Prompt 工程课', type: 'course', url: 'https://www.deeplearning.ai/courses/chatgpt-prompt-engineering-for-developers/', free: false, note: '经典入门' },
        ],
      },
    ],
  },
  {
    id: 'go',
    title: 'Go 微服务架构师',
    category: '后端开发',
    icon: <TrendingUp size={20} />,
    color: '#5eead4',
    description: 'Go 语言 → gRPC → Kubernetes → 分布式系统，构建高并发后端',
    difficulty: '中级',
    duration: '5 - 7 个月',
    tags: ['Go', 'gRPC', 'K8s', '微服务', 'Redis'],
    steps: [
      {
        id: 'g1', title: 'Go 语言基础',
        description: '语法、goroutine/channel 并发模式、接口、错误处理、defer',
        type: 'learn', est: '3 周',
        resources: [
          { title: 'Go 官方指南 Tour', type: 'course', url: 'https://tour.go-zh.org/list', free: true },
          { title: 'Effective Go', type: 'doc', url: 'https://go.dev/doc/effective_go', free: true },
          { title: 'Go by Example', type: 'article', url: 'https://gobyexample-cn.github.io/', free: true },
        ],
      },
      {
        id: 'g2', title: 'Gin 框架 & 中间件',
        description: '路由、中间件、参数绑定、验证、Swagger 文档、JWT',
        type: 'learn', est: '2 周',
        resources: [
          { title: 'Gin 官方文档', type: 'doc', url: 'https://gin-gonic.com/zh-cn/docs/', free: true },
        ],
      },
      {
        id: 'g3', title: 'gRPC & 微服务',
        description: 'Protobuf、服务定义、拦截器、服务注册/发现 (etcd/consul)',
        type: 'learn', est: '3 周',
        resources: [
          { title: 'gRPC 官方文档', type: 'doc', url: 'https://grpc.io/docs/languages/go/quickstart/', free: true },
        ],
      },
      {
        id: 'g4', title: 'Kubernetes & Docker',
        description: 'Pod/Deployment/Service/Ingress、Helm、CI/CD',
        type: 'project', est: '3 周',
        resources: [
          { title: 'K8s 官方教程', type: 'course', url: 'https://kubernetes.io/zh-cn/docs/tutorials/', free: true },
        ],
      },
    ],
  },
  {
    id: 'rust',
    title: 'Rust 系统编程',
    category: '系统开发',
    icon: <Flame size={20} />,
    color: '#fb923c',
    description: '所有权系统、生命周期、unsafe、Tokio 异步、WebAssembly、嵌入式',
    difficulty: '高级',
    duration: '8 - 12 个月',
    tags: ['Rust', 'Tokio', 'WASM', '系统编程'],
    steps: [
      {
        id: 'r1', title: 'Rust 圣经（Rust Book）',
        description: '所有权、借用、生命周期、模式匹配、枚举、trait、错误处理',
        type: 'learn', est: '6 周',
        resources: [
          { title: 'Rust Book 中文', type: 'book', url: 'https://kaisery.github.io/trpl-zh-cn/', free: true, note: '官方推荐' },
          { title: 'Rust By Example', type: 'practice', url: 'https://rustwiki.org/zh-CN/rust-by-example/', free: true },
        ],
      },
      {
        id: 'r2', title: 'Rustlings 练习',
        description: '100+ 小练习，动手写 Rust 代码',
        type: 'practice', est: '2 周',
        resources: [
          { title: 'Rustlings', type: 'repo', url: 'https://github.com/rust-lang/rustlings', free: true },
          { title: 'Exercism Rust 轨道', type: 'practice', url: 'https://exercism.org/tracks/rust', free: true },
        ],
      },
      {
        id: 'r3', title: 'Tokio 异步 & 生态',
        description: 'Future 模型、tokio async runtime、axum web 框架',
        type: 'learn', est: '3 周',
        resources: [
          { title: 'Tokio 官方指南', type: 'book', url: 'https://tokio.rs/tokio/tutorial', free: true },
          { title: 'Async Rust 中文', type: 'book', url: 'https://huangjj27.github.io/async-book/', free: true },
        ],
      },
      {
        id: 'r4', title: 'WebAssembly 实战',
        description: 'Rust → WASM，前端高计算模块、游戏、图形渲染',
        type: 'project', est: '3 周',
        resources: [
          { title: 'Rust WASM 中文', type: 'book', url: 'https://rustwasm.github.io/docs/book/introduction.html', free: true },
        ],
      },
    ],
  },
  {
    id: 'devops',
    title: 'DevOps & SRE 工程师',
    category: '运维 / SRE',
    icon: <Target size={20} />,
    color: '#f472b6',
    description: 'Linux → Docker → K8s → Terraform → 监控告警 → IaC 自动化',
    difficulty: '中级',
    duration: '5 - 7 个月',
    tags: ['Linux', 'Docker', 'K8s', 'Prometheus', 'Terraform'],
    steps: [
      {
        id: 'd1', title: 'Linux 系统管理',
        description: 'Shell、文件系统、进程、用户权限、网络、systemd',
        type: 'learn', est: '3 周',
        resources: [
          { title: 'The Linux Command Line', type: 'book', url: 'https://linuxcommand.org/tlcl.php', free: true },
          { title: '鸟哥 Linux 私房菜', type: 'book', url: 'https://linux.vbird.org/', free: true },
        ],
      },
      {
        id: 'd2', title: 'Shell 脚本 & 自动化',
        description: 'Bash 编程、awk/sed/grep、cron、expect',
        type: 'practice', est: '2 周',
        resources: [
          { title: 'Bash Guide', type: 'doc', url: 'https://linuxize.com/category/bash-script/', free: true },
        ],
      },
      {
        id: 'd3', title: 'Docker & Compose',
        description: '镜像构建、网络、卷、多阶段、compose 编配',
        type: 'learn', est: '2 周',
        resources: [
          { title: 'Docker 入门到实践', type: 'book', url: 'https://vuepress.mirror.docker-practice.com/', free: true },
        ],
      },
      {
        id: 'd4', title: 'Kubernetes & Helm',
        description: '核心对象、K8s 架构、Operator、Helm Chart、CNI/CSI',
        type: 'learn', est: '4 周',
        resources: [
          { title: 'Kubernetes 中文', type: 'doc', url: 'https://kubernetes.io/zh-cn/docs/home/', free: true },
          { title: 'CKA 练习题库', type: 'practice', url: 'https://github.com/kodekloudhub/certified-kubernetes-administrator-course', free: true },
        ],
      },
      {
        id: 'd5', title: '可观测性',
        description: 'Prometheus + Grafana + Loki + Alertmanager + Jaeger',
        type: 'learn', est: '3 周',
        resources: [
          { title: 'Prometheus 官方', type: 'doc', url: 'https://prometheus.io/docs/', free: true },
        ],
      },
    ],
  },
  {
    id: 'mobile',
    title: '跨平台移动开发 (Flutter)',
    category: '移动开发',
    icon: <MapPin size={20} />,
    color: '#a78bfa',
    description: 'Dart → Flutter 框架 → 状态管理 → 原生交互 → 上架发布',
    difficulty: '初级',
    duration: '4 - 6 个月',
    tags: ['Flutter', 'Dart', 'iOS', 'Android'],
    steps: [
      {
        id: 'm1', title: 'Dart 语言',
        description: '强类型 OOP、异步 (Future/Stream)、mixin、null safety',
        type: 'learn', est: '2 周',
        resources: [
          { title: 'Dart 官方中文', type: 'doc', url: 'https://dart.cn/guides', free: true },
          { title: 'DartPad', type: 'practice', url: 'https://dartpad.cn/', free: true },
        ],
      },
      {
        id: 'm2', title: 'Flutter 核心',
        description: 'Widget 树、Stateful/Stateless、布局、动画、主题、路由',
        type: 'learn', est: '4 周',
        resources: [
          { title: 'Flutter 中文文档', type: 'doc', url: 'https://docs.flutter.cn/', free: true },
          { title: 'Flutter Widget of the Week', type: 'video', url: 'https://www.youtube.com/@flutterdev/playlists', free: true },
        ],
      },
      {
        id: 'm3', title: '状态管理 & 架构',
        description: 'Provider / Riverpod / Bloc / GetX、MVVM、Repository 模式',
        type: 'learn', est: '3 周',
        resources: [
          { title: 'Riverpod 文档', type: 'doc', url: 'https://riverpod.dev/docs/introduction/why_riverpod', free: true },
          { title: 'Bloc Library', type: 'doc', url: 'https://bloclibrary.dev/', free: true },
        ],
      },
    ],
  },
]

/* ───────────────────────── 子组件 ───────────────────────── */
function ResourceChip({ r }: { r: Resource }) {
  const typeMap: Record<Resource['type'], { label: string; bg: string; icon: React.ReactNode }> = {
    doc: { label: '文档', bg: 'rgba(96,165,250,0.15)', icon: <FileText size={10} /> },
    video: { label: '视频', bg: 'rgba(239,68,68,0.15)', icon: <Play size={10} /> },
    course: { label: '课程', bg: 'rgba(52,211,153,0.15)', icon: <BookOpen size={10} /> },
    book: { label: '书籍', bg: 'rgba(251,191,36,0.15)', icon: <BookMarked size={10} /> },
    repo: { label: '代码库', bg: 'rgba(244,114,182,0.15)', icon: <Code size={10} /> },
    article: { label: '文章', bg: 'rgba(168,85,247,0.15)', icon: <FileText size={10} /> },
    tool: { label: '工具', bg: 'rgba(94,234,212,0.15)', icon: <Zap size={10} /> },
    practice: { label: '练习', bg: 'rgba(249,115,22,0.15)', icon: <Target size={10} /> },
  }
  const t = typeMap[r.type]
  return (
    <a href={r.url} target="_blank" rel="noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        textDecoration: 'none', color: '#e0e0ff',
        fontSize: 12.5, transition: 'all 0.18s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(139,92,246,0.12)'
        e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
      }}
    >
      <span style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '2px 7px', borderRadius: 999, fontSize: 10,
        background: t.bg, color: '#fff',
      }}>{t.icon}{t.label}</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
      {r.free
        ? <span style={{ fontSize: 10, color: '#10b981', padding: '1px 6px', borderRadius: 999, background: 'rgba(16,185,129,0.12)' }}>免费</span>
        : <span style={{ fontSize: 10, color: '#f59e0b', padding: '1px 6px', borderRadius: 999, background: 'rgba(245,158,11,0.12)' }}>付费</span>}
      <ExternalLink size={12} style={{ opacity: 0.5 }} />
    </a>
  )
}

/* ───────────────────────── 主组件 ───────────────────────── */
const PROGRESS_KEY = 'devaltas_progress_v1'
const SAVED_KEY = 'devaltas_saved_v1'

export default function DevAtlas() {
  const [cat, setCat] = useState<string>('全部')
  const [q, setQ] = useState('')
  const [active, setActive] = useState<LearningPath | null>(null)
  const [progress, setProgress] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}') } catch { return {} }
  })
  const [saved, setSaved] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '{}') } catch { return {} }
  })

  useEffect(() => { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)) }, [progress])
  useEffect(() => { localStorage.setItem(SAVED_KEY, JSON.stringify(saved)) }, [saved])

  const categories = useMemo(() => ['全部', ...Array.from(new Set(PATHS.map(p => p.category)))], [])

  const filtered = useMemo(() => PATHS.filter(p => {
    const byCat = cat === '全部' || p.category === cat
    const byQ = !q
      || p.title.includes(q) || p.description.includes(q)
      || p.tags.some(t => t.toLowerCase().includes(q.toLowerCase()))
      || p.steps.some(s => s.title.includes(q))
    return byCat && byQ
  }), [cat, q])

  const doneFor = useCallback((pid: string) => progress[pid] || [], [progress])
  const setDone = useCallback((pid: string, sid: string) => {
    setProgress(prev => {
      const cur = new Set(prev[pid] || [])
      if (cur.has(sid)) cur.delete(sid)
      else cur.add(sid)
      return { ...prev, [pid]: Array.from(cur) }
    })
  }, [])
  const toggleSave = useCallback((pid: string) => {
    setSaved(s => ({ ...s, [pid]: !s[pid] }))
  }, [])

  // 统计
  const stats = useMemo(() => {
    const totalSteps = PATHS.reduce((n, p) => n + p.steps.length, 0)
    const doneSteps = Object.values(progress).reduce((n, arr) => n + arr.length, 0)
    const savedCount = Object.values(saved).filter(Boolean).length
    return { totalSteps, doneSteps, savedCount, pct: totalSteps ? Math.round(100 * doneSteps / totalSteps) : 0 }
  }, [progress, saved])

  return (
    <div style={{
      height: '100%', width: '100%', display: 'flex',
      background: 'linear-gradient(150deg, #05081a 0%, #0a0e2a 50%, #100830 100%)',
      color: '#e8e8ff', fontFamily: 'inherit',
    }}>
      {/* 侧边栏：路径列表 */}
      <aside style={{
        width: 320, flexShrink: 0,
        borderRight: '1px solid rgba(139,92,246,0.14)',
        background: 'rgba(8,10,25,0.6)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* 头部 */}
        <div style={{
          padding: 18,
          borderBottom: '1px solid rgba(139,92,246,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(16,185,129,0.35)',
            }}>
              <Compass size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>
                DevAtlas 开发者地图
              </div>
              <div style={{ fontSize: 11, color: '#8b8bbf', marginTop: 2 }}>
                系统化学习路径 · 精选免费资源
              </div>
            </div>
          </div>

          {/* 统计条 */}
          <div style={{
            padding: 12, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(99,102,241,0.1))',
            border: '1px solid rgba(99,102,241,0.2)',
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
              <span style={{ color: '#a5a5d5' }}>总体进度</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>{stats.doneSteps} / {stats.totalSteps}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                width: `${stats.pct}%`, height: '100%',
                background: 'linear-gradient(90deg, #10b981, #6366f1)',
                borderRadius: 999, transition: 'width 0.4s',
              }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 12 }}>
              <StatM icon={<BarChart2 size={12} />} label="路径" value={`${PATHS.length}`} />
              <StatM icon={<Award size={12} />} label="已学" value={`${stats.pct}%`} />
              <StatM icon={<BookmarkCheck size={12} />} label="收藏" value={`${stats.savedCount}`} />
            </div>
          </div>

          {/* 搜索 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
            background: 'rgba(255,255,255,0.04)', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)', marginBottom: 10,
          }}>
            <Search size={14} style={{ color: '#6a6a9a' }} />
            <input
              value={q} onChange={e => setQ(e.target.value)}
              placeholder="搜索路径、技能、主题..."
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: '#ececff', fontSize: 12.5,
              }}
            />
            {q && <button onClick={() => setQ('')} style={{
              background: 'none', border: 'none', color: '#6a6a9a', cursor: 'pointer', fontSize: 14,
            }}>×</button>}
          </div>

          {/* 分类 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <Filter size={12} style={{ color: '#6a6a9a', alignSelf: 'center', marginRight: 2 }} />
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)}
                style={{
                  padding: '4px 10px', borderRadius: 999,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: cat === c ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${cat === c ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
                  color: cat === c ? '#c7d2fe' : '#9a9acf',
                  transition: 'all 0.15s',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 路径列表 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 16px' }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#6a6a9a', fontSize: 12 }}>
              没有匹配的路径
            </div>
          )}
          {filtered.map(p => {
            const done = doneFor(p.id).length
            const pct = Math.round(100 * done / p.steps.length)
            const isActive = active?.id === p.id
            return (
              <button key={p.id} onClick={() => setActive(p)}
                style={{
                  width: '100%', textAlign: 'left', marginBottom: 8,
                  padding: 12, borderRadius: 12, cursor: 'pointer',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(16,185,129,0.18))'
                    : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${isActive ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.05)'}`,
                  transition: 'all 0.18s',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(139,92,246,0.08)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: `${p.color}22`, color: p.color,
                    border: `1px solid ${p.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{p.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{
                        fontSize: 13, fontWeight: 700, color: '#f5f5ff',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{p.title}</span>
                      {saved[p.id] && <Star size={12} style={{ color: '#fbbf24', flexShrink: 0 }} />}
                    </div>
                    <div style={{
                      fontSize: 10.5, color: '#8b8bbf', marginTop: 2,
                      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                    }}>
                      <span>{p.category}</span>
                      <span>·</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                        <Clock size={10} /> {p.duration}
                      </span>
                      <span>·</span>
                      <span style={{
                        background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 999,
                        color: pct >= 80 ? '#10b981' : pct > 0 ? '#f59e0b' : '#6a6a9a',
                      }}>{pct}% 完成</span>
                    </div>
                    <div style={{
                      height: 3, marginTop: 10,
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 999, overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: `linear-gradient(90deg, ${p.color}cc, ${p.color})`,
                        borderRadius: 999,
                      }} />
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* 主内容：路径详情 */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {!active ? (
          <div style={{
            padding: 48, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ maxWidth: 520, textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(16,185,129,0.2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(99,102,241,0.25)',
              }}>
                <Compass size={34} style={{ color: '#a78bfa' }} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>
                选择一条你的成长路径
              </h2>
              <p style={{
                fontSize: 13, color: '#9a9acf', lineHeight: 1.75,
                marginBottom: 24,
              }}>
                7 大方向、{PATHS.reduce((n, p) => n + p.steps.length, 0)} 个关键步骤、
                {PATHS.reduce((n, p) => n + p.steps.reduce((m, s) => m + s.resources.length, 0), 0)}+ 精选学习资源。
                所有资源链接均为互联网公开且大部分免费，
                适合在校学生、职业转型、进修提升等任何阶段的开发者。
              </p>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                textAlign: 'left',
              }}>
                {PATHS.slice(0, 4).map(p => (
                  <div key={p.id}
                    style={{
                      padding: 12, borderRadius: 12,
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ color: p.color }}>{p.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#ececff' }}>{p.title}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#8b8bbf' }}>{p.steps.length} 个阶段 · {p.difficulty}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 24, maxWidth: 920, margin: '0 auto' }}>
            {/* 路径头部 */}
            <div style={{
              padding: 20, marginBottom: 20, borderRadius: 18,
              background: `linear-gradient(135deg, ${active.color}18 0%, rgba(10,10,25,0.8) 60%)`,
              border: `1px solid ${active.color}33`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', right: -30, top: -30,
                width: 220, height: 220, borderRadius: '50%',
                background: `radial-gradient(circle, ${active.color}22, transparent 70%)`,
              }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 16,
                      background: `linear-gradient(135deg, ${active.color}, ${active.color}99)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', boxShadow: `0 0 30px ${active.color}55`,
                    }}>{active.icon}</div>
                    <div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
                        flexWrap: 'wrap',
                      }}>
                        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
                          {active.title}
                        </h2>
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 999,
                          background: 'rgba(139,92,246,0.2)', color: '#c4b5fd',
                          border: '1px solid rgba(139,92,246,0.3)', fontWeight: 600,
                        }}>{active.difficulty}</span>
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 999,
                          background: 'rgba(16,185,129,0.15)', color: '#6ee7b7',
                          border: '1px solid rgba(16,185,129,0.25)', fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}><Clock size={10} /> {active.duration}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#b5b5dd', maxWidth: 520, lineHeight: 1.65 }}>
                        {active.description}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => toggleSave(active.id)}
                      style={{
                        width: 40, height: 40, borderRadius: 10, cursor: 'pointer',
                        background: saved[active.id] ? 'rgba(250,204,21,0.18)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${saved[active.id] ? 'rgba(250,204,21,0.45)' : 'rgba(255,255,255,0.06)'}`,
                        color: saved[active.id] ? '#fde047' : '#b5b5dd',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      {saved[active.id] ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    </button>
                    <button onClick={() => {
                      setProgress(p => ({ ...p, [active.id]: active.steps.map(s => s.id) }))
                    }}
                      style={{
                        padding: '0 14px', height: 40, borderRadius: 10, cursor: 'pointer',
                        background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                        color: '#6ee7b7', fontSize: 12, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <Check size={13} /> 全部标记完成
                    </button>
                  </div>
                </div>

                {/* 标签 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
                  {active.tags.map(t => (
                    <span key={t} style={{
                      fontSize: 10.5, padding: '3px 9px', borderRadius: 999,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: '#c4c4e5',
                    }}>{t}</span>
                  ))}
                </div>

                {/* 进度 */}
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6, color: '#a5a5d5' }}>
                    <span>路径进度 {doneFor(active.id).length}/{active.steps.length}</span>
                    <span style={{ fontWeight: 700, color: active.color }}>
                      {Math.round(100 * doneFor(active.id).length / active.steps.length)}%
                    </span>
                  </div>
                  <div style={{
                    height: 8, background: 'rgba(255,255,255,0.05)',
                    borderRadius: 999, overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${100 * doneFor(active.id).length / active.steps.length}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${active.color}dd, ${active.color}99)`,
                      borderRadius: 999, transition: 'width 0.5s cubic-bezier(.2,.8,.2,1)',
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 步骤 */}
            <div style={{ position: 'relative', paddingLeft: 24 }}>
              <div style={{
                position: 'absolute', left: 9, top: 12, bottom: 12,
                width: 2, background: 'linear-gradient(180deg, rgba(139,92,246,0.35), rgba(139,92,246,0.08))',
                borderRadius: 999,
              }} />
              {active.steps.map((s, idx) => {
                const isDone = doneFor(active.id).includes(s.id)
                const typeMap: Record<PathStep['type'], { label: string; color: string }> = {
                  learn: { label: '学习', color: '#60a5fa' },
                  practice: { label: '练习', color: '#f59e0b' },
                  project: { label: '项目', color: '#10b981' },
                  read: { label: '阅读', color: '#a78bfa' },
                  watch: { label: '观看', color: '#f472b6' },
                }
                return (
                  <div key={s.id} style={{ position: 'relative', marginBottom: 16 }}>
                    <div
                      onClick={() => setDone(active.id, s.id)}
                      style={{
                        position: 'absolute', left: -30, top: 16,
                        width: 20, height: 20, borderRadius: 999,
                        background: isDone ? active.color : 'rgba(10,10,25,1)',
                        border: `2px solid ${isDone ? active.color : 'rgba(255,255,255,0.18)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', cursor: 'pointer', zIndex: 2,
                        transition: 'all 0.2s',
                        boxShadow: isDone ? `0 0 12px ${active.color}88` : 'none',
                      }}
                    >
                      {isDone && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div style={{
                      padding: 16, borderRadius: 14,
                      background: isDone
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(10,10,25,0.6))'
                        : 'rgba(255,255,255,0.025)',
                      border: `1px solid ${isDone ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.05)'}`,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      if (!isDone) {
                        e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)'
                        e.currentTarget.style.background = 'rgba(139,92,246,0.05)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isDone) {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
                      }
                    }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            color: '#8b8bbf',
                            letterSpacing: '0.04em',
                          }}>STEP {String(idx + 1).padStart(2, '0')}</span>
                          <h3 style={{
                            fontSize: 15, fontWeight: 700, color: isDone ? '#86efac' : '#f5f5ff',
                            textDecoration: isDone ? 'line-through rgba(16,185,129,0.4)' : 'none',
                          }}>{s.title}</h3>
                          <span style={{
                            fontSize: 10.5, padding: '2px 8px', borderRadius: 999,
                            background: `${typeMap[s.type].color}18`,
                            border: `1px solid ${typeMap[s.type].color}33`,
                            color: typeMap[s.type].color, fontWeight: 600,
                          }}>
                            {typeMap[s.type].label}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 11, color: '#8b8bbf',
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          <Clock size={11} /> {s.est}
                        </span>
                      </div>
                      <p style={{
                        fontSize: 12.5, color: '#b5b5dd', marginBottom: 14, lineHeight: 1.65,
                      }}>{s.description}</p>

                      {/* 资源 */}
                      <div>
                        <div style={{
                          fontSize: 10.5, fontWeight: 700, color: '#8b8bbf',
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          <BookMarked size={11} /> 推荐资源
                        </div>
                        <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                          {s.resources.map((r, i) => <ResourceChip key={i} r={r} />)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{
              marginTop: 28, padding: 16, borderRadius: 14,
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.15)',
              fontSize: 12, color: '#a5a5d5', lineHeight: 1.75,
            }}>
              <div style={{ fontWeight: 600, color: '#c7d2fe', marginBottom: 6 }}>ℹ️ 小提示</div>
              点击步骤左侧的圆形图标即可标记完成。进度会自动保存在本地浏览器。
              所有资源链接均为第三方站点，请在新标签页中打开；如果发现链接失效或有其他更好的资源推荐，欢迎向 WebLinuxOS 项目提交反馈。
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function StatM({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      padding: '6px 8px', borderRadius: 8, textAlign: 'center',
      background: 'rgba(255,255,255,0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#6a6a9a', marginBottom: 2 }}>
        {icon} <span style={{ fontSize: 9 }}>{label}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#ececff' }}>{value}</div>
    </div>
  )
}
