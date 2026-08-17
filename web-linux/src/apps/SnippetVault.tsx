import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useStore } from '../store'
import {
  Code2, Search, Plus, Copy, Check, Trash2, Pin, PinOff,
  Star, Download, Upload, BarChart3, Tag, X, Eye,
  ChevronDown, Palette, FileJson, Keyboard,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Snippet {
  id: string
  title: string
  description: string
  code: string
  language: string
  category: string
  tags: string[]
  pinned: boolean
  favorite: boolean
  createdAt: number
  updatedAt: number
}

type TabType = 'browse' | 'stats'
type ViewMode = 'grid' | 'list'

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'weblinux-snippet-vault'

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java',
  'C++', 'C', 'C#', 'HTML', 'CSS', 'SQL', 'Shell', 'Bash',
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'Lua', 'R',
  'Scala', 'Elixir', 'Haskell', 'Perl', 'YAML', 'JSON', 'Markdown',
  'Vue', 'React', 'Dockerfile', 'Makefile', 'GraphQL',
]

const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3776ab',
  Go: '#00add8', Rust: '#dea584', Java: '#b07219', 'C++': '#f34b7d',
  C: '#555555', 'C#': '#178600', HTML: '#e34c26', CSS: '#563d7c',
  SQL: '#e38c00', Shell: '#89e051', Bash: '#89e051', PHP: '#4F5D95',
  Ruby: '#701516', Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB',
  Lua: '#000080', R: '#198CE7', Scala: '#c22d40', Elixir: '#6e4a7e',
  Haskell: '#5e5086', Perl: '#0298c3', YAML: '#cb171e', JSON: '#292929',
  Markdown: '#083fa1', Vue: '#4fc08d', React: '#61dafb', Dockerfile: '#2496ed',
  Makefile: '#427819', GraphQL: '#e535ab',
}

const CATEGORIES = ['前端', '后端', '数据库', 'DevOps', '算法', '工具', '模板', '其他']

const KEYWORDS: Record<string, string[]> = {
  JavaScript: ['const','let','var','function','return','if','else','for','while','do','switch','case','break','continue','new','this','class','extends','super','import','export','default','from','try','catch','finally','throw','async','await','yield','typeof','instanceof','in','of','true','false','null','undefined','void','delete','static','get','set'],
  TypeScript: ['const','let','var','function','return','if','else','for','while','do','switch','case','break','continue','new','this','class','extends','super','import','export','default','from','try','catch','finally','throw','async','await','yield','typeof','instanceof','in','of','true','false','null','undefined','void','delete','static','get','set','type','interface','enum','implements','declare','namespace','as','keyof','infer','readonly','never','unknown','any'],
  Python: ['def','class','return','if','elif','else','for','while','break','continue','import','from','as','try','except','finally','raise','with','lambda','yield','pass','del','global','nonlocal','assert','and','or','not','is','in','True','False','None','self','async','await'],
  Go: ['func','return','if','else','for','range','switch','case','break','continue','go','defer','chan','select','type','struct','interface','map','var','const','import','package','true','false','nil','make','new','append','len','cap'],
  Rust: ['fn','let','mut','if','else','for','while','loop','match','return','struct','enum','impl','trait','pub','use','mod','self','Self','super','where','type','const','static','ref','move','async','await','unsafe','true','false','Some','None','Ok','Err'],
  Java: ['public','private','protected','class','interface','extends','implements','static','final','void','return','if','else','for','while','do','switch','case','break','continue','new','this','super','try','catch','finally','throw','throws','import','package','abstract','synchronized','volatile','transient','instanceof','null','true','false'],
  'C++': ['int','long','double','float','char','bool','void','auto','const','static','class','struct','enum','namespace','using','template','typename','public','private','protected','virtual','override','return','if','else','for','while','do','switch','case','break','continue','new','delete','this','try','catch','throw','nullptr','true','false'],
  SQL: ['SELECT','FROM','WHERE','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','DROP','ALTER','ADD','INDEX','JOIN','LEFT','RIGHT','INNER','OUTER','ON','AND','OR','NOT','IN','BETWEEN','LIKE','ORDER','BY','GROUP','HAVING','LIMIT','OFFSET','AS','DISTINCT','COUNT','SUM','AVG','MIN','MAX','CASE','WHEN','THEN','ELSE','END','UNION','ALL','EXISTS'],
  Shell: ['if','then','else','elif','fi','for','while','do','done','case','esac','function','return','exit','local','export','readonly','source','echo','printf','read','cd','pwd','true','false','shift','set'],
  Bash: ['if','then','else','elif','fi','for','while','do','done','case','esac','function','return','exit','local','export','readonly','source','echo','printf','read','cd','pwd','true','false','shift','set'],
  CSS: ['display','position','top','left','right','bottom','width','height','margin','padding','border','background','color','font','text','flex','grid','gap','align','justify','overflow','opacity','transform','transition','animation','z-index','box-shadow','border-radius','important','none','auto','inherit','initial','relative','absolute','fixed','sticky','column','row','repeat','minmax','fr','px','em','rem','vh','vw'],
  HTML: ['DOCTYPE','html','head','body','div','span','p','a','img','ul','ol','li','h1','h2','h3','h4','h5','h6','table','tr','td','th','form','input','button','select','option','textarea','script','style','link','meta','title','class','id','src','href','type','name','value','placeholder'],
  YAML: ['true','false','null','yes','no','on','off'],
  Ruby: ['def','end','class','module','if','else','elsif','unless','while','until','for','do','begin','rescue','ensure','raise','return','yield','block','lambda','proc','require','include','extend','self','super','nil','true','false','and','or','not'],
  PHP: ['function','class','public','private','protected','static','return','if','else','elseif','for','while','do','switch','case','break','continue','new','this','self','parent','echo','print','array','null','true','false','require','include','use','namespace','trait','interface','extends','implements','abstract','final','try','catch','throw','finally','fn'],
  Swift: ['var','let','func','return','if','else','for','while','switch','case','break','continue','class','struct','enum','protocol','extension','import','guard','self','Self','super','init','deinit','nil','true','false','typealias','associatedtype','public','private','internal','open','fileprivate','weak','unowned','lazy','static','override','mutating','throws','try','catch','throw','async','await','some','any','in','where','as','is'],
  Kotlin: ['fun','val','var','class','object','interface','enum','when','if','else','for','while','do','return','break','continue','import','package','try','catch','finally','throw','null','true','false','this','super','as','is','in','typealias','suspend','data','sealed','abstract','open','override','private','protected','internal','public','companion','init','by','lazy','inline','reified'],
}

const TEMPLATES: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'React useEffect 清理副作用',
    description: 'useEffect 中正确清理定时器、订阅等副作用，避免内存泄漏',
    language: 'TypeScript', category: '前端', favorite: true, pinned: false,
    tags: ['React', 'Hooks', '副作用'],
    code: `useEffect(() => {
  const timer = setInterval(() => console.log('tick'), 1000);
  const controller = new AbortController();
  fetch('/api/data', { signal: controller.signal })
    .then(res => res.json()).then(setData);
  return () => { clearInterval(timer); controller.abort(); };
}, []);`,
  },
  {
    title: 'Python 装饰器计时器',
    description: '使用装饰器自动测量函数执行时间，支持同步和异步函数',
    language: 'Python', category: '工具', favorite: true, pinned: false,
    tags: ['装饰器', '性能', '工具'],
    code: `import time, functools
def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.perf_counter()-start:.4f}s")
        return result
    return wrapper`,
  },
  {
    title: 'Go goroutine 并发模式',
    description: '使用 WaitGroup 和 channel 实现 fan-out/fan-in 并发模式',
    language: 'Go', category: '后端', favorite: false, pinned: false,
    tags: ['并发', 'goroutine', 'channel'],
    code: `func fanOutFanIn(inputs []string) []string {
    var wg sync.WaitGroup
    ch := make(chan string, len(inputs))
    for _, input := range inputs {
        wg.Add(1)
        go func(s string) { defer wg.Done(); ch <- process(s) }(input)
    }
    go func() { wg.Wait(); close(ch) }()
    var results []string
    for r := range ch { results = append(results, r) }
    return results
}`,
  },
  {
    title: '防抖与节流函数',
    description: '前端性能优化必备：防抖(debounce)和节流(throttle)的经典实现',
    language: 'JavaScript', category: '前端', favorite: true, pinned: true,
    tags: ['性能', '防抖', '节流'],
    code: `function debounce(fn, delay=300) {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
function throttle(fn, interval=300) {
  let lastTime = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastTime >= interval) { lastTime = now; fn.apply(this, args); }
  };
}`,
  },
  {
    title: 'CSS Grid 响应式布局',
    description: '使用 CSS Grid 实现自适应响应式布局，无需媒体查询',
    language: 'CSS', category: '前端', favorite: false, pinned: false,
    tags: ['Grid', '响应式', '布局'],
    code: `.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem; padding: 1rem;
}
.holy-grail {
  display: grid;
  grid-template:
    "header header header" auto
    "nav    main   aside"  1fr
    "footer footer footer" auto
    / 200px 1fr 200px;
  min-height: 100vh;
}`,
  },
  {
    title: 'SQL 窗口函数详解',
    description: 'ROW_NUMBER、RANK、LEAD/LAG 等窗口函数的常用模式',
    language: 'SQL', category: '数据库', favorite: true, pinned: false,
    tags: ['窗口函数', '排名', '分析'],
    code: `SELECT name, salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,
  RANK() OVER (ORDER BY salary DESC) AS rank_val,
  LAG(revenue, 1) OVER (ORDER BY date) AS prev_revenue
FROM employees;`,
  },
]

// ─── Syntax Highlighter ──────────────────────────────────────────────────────

function highlightCode(code: string, language: string): string {
  const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const langKey = Object.keys(KEYWORDS).find((k) => language.toLowerCase() === k.toLowerCase()) || ''
  const kwList = KEYWORDS[langKey] || []
  let result = escaped
  result = result.replace(/(\/\/.*$|#.*$|--.*$|\/\*[\s\S]*?\*\/)/gm, '<span style="color:#6a9955">$1</span>')
  result = result.replace(/(&quot;.*?&quot;|"[^"]*"|'[^']*'|`[^`]*`)/g, '<span style="color:#ce9178">$1</span>')
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#b5cea8">$1</span>')
  if (kwList.length > 0) {
    const kwRegex = new RegExp('\\b(' + kwList.join('|').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')\\b', 'g')
    result = result.replace(kwRegex, '<span style="color:#569cd6">$1</span>')
  }
  result = result.replace(/(@\w+)/g, '<span style="color:#dcdcaa">$1</span>')
  return result
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

function loadSnippets(): Snippet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  const seeded = TEMPLATES.map((t, i) => ({
    ...t, id: genId() + i,
    createdAt: Date.now() - (TEMPLATES.length - i) * 86400000,
    updatedAt: Date.now() - (TEMPLATES.length - i) * 86400000,
  }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
  return seeded
}

const saveToStorage = (s: Snippet[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

const timeAgo = (ts: number) => {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}小时前`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}天前`
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Styles (shared) ─────────────────────────────────────────────────────────

const S = {
  container: {
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    background: 'var(--window-bg)', color: 'var(--text-primary)',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", overflow: 'hidden', fontSize: 13,
  } as React.CSSProperties,
  header: {
    padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
    borderBottom: '1px solid var(--glass-border)',
    background: 'linear-gradient(135deg, var(--accent-subtle), var(--window-bg))',
    backdropFilter: 'blur(20px) saturate(180%)', flexShrink: 0,
  } as React.CSSProperties,
  logo: { display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
  logoIcon: {
    width: 36, height: 36, borderRadius: 10, background: 'var(--accent-gradient)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: 'var(--accent-glow)',
  } as React.CSSProperties,
  titleText: { fontWeight: 700, fontSize: 16, color: '#fff' } as React.CSSProperties,
  subtitle: { fontSize: 11, color: 'var(--text-secondary)' } as React.CSSProperties,
  spacer: { flex: 1 } as React.CSSProperties,
  statBadge: {
    fontSize: 11, color: 'var(--text-secondary)', background: 'var(--accent-subtle)',
    padding: '4px 12px', borderRadius: 10, border: '1px solid var(--glass-border)',
  } as React.CSSProperties,
  iconBtn: {
    width: 34, height: 34, borderRadius: 10, border: '1px solid var(--glass-border)',
    background: 'var(--glass-bg)', color: 'var(--text-primary)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
  } as React.CSSProperties,
  primaryBtn: {
    background: 'var(--accent-gradient)', border: 'none', color: '#fff',
    padding: '8px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 6, boxShadow: 'var(--accent-glow)',
  } as React.CSSProperties,
  tabBar: {
    display: 'flex', gap: 2, padding: '0 20px', borderBottom: '1px solid var(--glass-border)',
    background: 'rgba(0,0,0,0.2)', flexShrink: 0,
  } as React.CSSProperties,
  tab: {
    padding: '10px 20px', background: 'transparent', border: 'none',
    borderBottom: '2px solid transparent', color: 'var(--text-secondary)', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
  } as React.CSSProperties,
  subTabBar: {
    display: 'flex', gap: 6, padding: '10px 20px', borderBottom: '1px solid var(--glass-border)',
    background: 'rgba(0,0,0,0.15)', flexShrink: 0, alignItems: 'center', flexWrap: 'wrap',
  } as React.CSSProperties,
  subTab: {
    padding: '6px 14px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
    borderRadius: 20, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12,
    fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5,
  } as React.CSSProperties,
  searchBox: { position: 'relative', flex: 1, minWidth: 200 } as React.CSSProperties,
  searchInput: {
    width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
    borderRadius: 10, padding: '8px 12px 8px 36px', color: 'var(--text-primary)',
    fontSize: 13, outline: 'none',
  } as React.CSSProperties,
  filterSelect: {
    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 10,
    padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13,
    outline: 'none', cursor: 'pointer',
  } as React.CSSProperties,
  viewToggle: {
    display: 'flex', gap: 2, background: 'var(--glass-bg)', borderRadius: 10,
    padding: 3, border: '1px solid var(--glass-border)',
  } as React.CSSProperties,
  viewBtn: {
    background: 'transparent', border: 'none', color: 'var(--text-secondary)',
    padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 12,
  } as React.CSSProperties,
  content: { flex: 1, overflow: 'auto', padding: 20 } as React.CSSProperties,
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '100%', color: 'var(--text-secondary)', gap: 12,
  } as React.CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 } as React.CSSProperties,
  card: {
    background: 'var(--glass-bg)', backdropFilter: 'blur(12px) saturate(180%)',
    WebkitBackdropFilter: 'blur(12px) saturate(180%)', border: '1px solid var(--glass-border)',
    borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s',
    borderLeft: '3px solid var(--accent)', display: 'flex', flexDirection: 'column',
  } as React.CSSProperties,
  cardHeader: { padding: '14px 16px 10px', display: 'flex', alignItems: 'flex-start', gap: 8 } as React.CSSProperties,
  cardTitle: {
    fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
  } as React.CSSProperties,
  cardDesc: { padding: '0 16px 10px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 } as React.CSSProperties,
  codeBlock: {
    margin: '0 16px', background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 14,
    fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace", fontSize: 12,
    lineHeight: 1.6, color: '#d4d4d4', overflow: 'auto', maxHeight: 200, position: 'relative',
    border: '1px solid var(--glass-border)',
  } as React.CSSProperties,
  codeActions: { position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 } as React.CSSProperties,
  codeActionBtn: {
    width: 28, height: 28, borderRadius: 7, border: '1px solid var(--glass-border)',
    background: 'rgba(0,0,0,0.5)', color: 'var(--text-secondary)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  } as React.CSSProperties,
  cardFooter: {
    padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderTop: '1px solid var(--glass-border)', fontSize: 11, color: 'var(--text-secondary)',
    marginTop: 'auto',
  } as React.CSSProperties,
  langBadge: {
    padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 4,
  } as React.CSSProperties,
  tag: {
    display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px',
    borderRadius: 10, background: 'var(--accent-subtle)', fontSize: 10,
    color: 'var(--text-secondary)', marginRight: 4, marginTop: 4,
  } as React.CSSProperties,
  iconBtnSm: {
    width: 28, height: 28, borderRadius: 7, border: '1px solid var(--glass-border)',
    background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  } as React.CSSProperties,
  modalOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20,
  } as React.CSSProperties,
  modal: {
    background: 'var(--window-bg)', border: '1px solid var(--glass-border)', borderRadius: 16,
    padding: 24, width: '90%', maxWidth: 640, maxHeight: '85%', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(20px) saturate(180%)',
  } as React.CSSProperties,
  modalTitle: {
    fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20,
    display: 'flex', alignItems: 'center', gap: 8,
  } as React.CSSProperties,
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 } as React.CSSProperties,
  input: {
    width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--glass-border)',
    background: 'var(--glass-bg)', color: 'var(--text-primary)', fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
  } as React.CSSProperties,
  textarea: {
    width: '100%', minHeight: 200, padding: 12, borderRadius: 10,
    border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)',
    color: '#e2e8f0', fontSize: 13,
    fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
    resize: 'vertical', outline: 'none', lineHeight: 1.6, tabSize: 2, boxSizing: 'border-box',
  } as React.CSSProperties,
  select: {
    width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--glass-border)',
    background: 'var(--glass-bg)', color: 'var(--text-primary)', fontSize: 13,
    outline: 'none', cursor: 'pointer',
  } as React.CSSProperties,
  formRow: { display: 'flex', gap: 12 } as React.CSSProperties,
  formGroup: { marginBottom: 16 } as React.CSSProperties,
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 } as React.CSSProperties,
  cancelBtn: {
    padding: '8px 18px', borderRadius: 10, border: '1px solid var(--glass-border)',
    background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
  } as React.CSSProperties,
  saveBtn: {
    padding: '8px 20px', borderRadius: 10, border: 'none', background: 'var(--accent-gradient)',
    color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, boxShadow: 'var(--accent-glow)',
  } as React.CSSProperties,
  expandContent: {
    padding: '12px 16px 14px', background: 'rgba(0,0,0,0.25)',
    borderTop: '1px solid var(--glass-border)',
  } as React.CSSProperties,
  statsHeader: {
    display: 'flex', gap: 24, padding: '16px 20px', borderBottom: '1px solid var(--glass-border)',
    background: 'linear-gradient(135deg, var(--accent-subtle), transparent)',
    flexShrink: 0, flexWrap: 'wrap',
  } as React.CSSProperties,
  statCard: {
    background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', borderRadius: 14,
    padding: 16, border: '1px solid var(--glass-border)', minWidth: 120, textAlign: 'center',
  } as React.CSSProperties,
  statValue: {
    fontSize: 28, fontWeight: 700, background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } as React.CSSProperties,
  statLabel: { fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 } as React.CSSProperties,
  exportBar: {
    padding: '12px 20px', borderBottom: '1px solid var(--glass-border)',
    background: 'rgba(0,0,0,0.2)', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0,
  } as React.CSSProperties,
  exportBtn: {
    padding: '7px 16px', borderRadius: 10, border: '1px solid var(--glass-border)',
    background: 'var(--glass-bg)', color: 'var(--text-primary)', cursor: 'pointer',
    fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
  } as React.CSSProperties,
  hint: { fontSize: 11, color: 'var(--text-secondary)' } as React.CSSProperties,
  shortcutHint: {
    display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
    color: 'var(--text-secondary)', marginLeft: 'auto',
  } as React.CSSProperties,
  tagChip: {
    background: 'var(--accent-subtle)', border: '1px solid var(--glass-border)',
    borderRadius: 12, padding: '3px 10px 3px 12px', fontSize: 12,
    color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 4,
    marginRight: 6, marginBottom: 6,
  } as React.CSSProperties,
  statsSection: {
    padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 20,
  } as React.CSSProperties,
  statsCard: {
    background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', borderRadius: 14,
    padding: 20, border: '1px solid var(--glass-border)',
  } as React.CSSProperties,
  statsCardTitle: {
    fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12,
    display: 'flex', alignItems: 'center', gap: 8,
  } as React.CSSProperties,
  langItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' } as React.CSSProperties,
  langBar: { height: 6, borderRadius: 3, flex: 1, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' } as React.CSSProperties,
  langBarFill: { height: '100%', borderRadius: 3, transition: 'width 0.3s' } as React.CSSProperties,
}

// ─── SnippetCard Sub-component ───────────────────────────────────────────────

interface SnippetCardProps {
  snippet: Snippet
  expanded: boolean
  onExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onTogglePin: () => void
  onToggleFavorite: () => void
  onCopy: () => void
  copied: boolean
  listMode?: boolean
}

function SnippetCard({
  snippet: s, expanded, onExpand, onEdit, onDelete,
  onTogglePin, onToggleFavorite, onCopy, copied, listMode,
}: SnippetCardProps) {
  const langColor = LANG_COLORS[s.language] || '#8b7cf0'
  const badgeStyle: React.CSSProperties = {
    ...S.langBadge, background: `${langColor}22`, color: langColor,
  }
  const cardStyle: React.CSSProperties = {
    ...S.card,
    borderLeftColor: s.pinned ? '#f59e0b' : 'var(--accent)',
    padding: listMode ? '10px 16px' : undefined,
  }

  return (
    <div style={cardStyle}>
      <div style={S.cardHeader}>
        <button
          style={{ ...S.iconBtnSm, color: s.pinned ? '#f59e0b' : 'var(--text-secondary)' }}
          onClick={onTogglePin}
          title={s.pinned ? '取消置顶' : '置顶'}
        >
          {s.pinned ? <Pin size={14} /> : <PinOff size={14} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={S.cardTitle}>{s.title}</div>
          {s.description && !listMode && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              {s.description.length > 60 ? s.description.slice(0, 60) + '...' : s.description}
            </div>
          )}
        </div>
        <span style={badgeStyle}>{s.language}</span>
      </div>

      {!listMode && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: '0 16px' }}>
            {s.tags.map((t) => <span key={t} style={S.tag}>#{t}</span>)}
          </div>
          <div style={{ position: 'relative', marginTop: 10 }}>
            <div style={S.codeActions}>
              <button style={S.codeActionBtn} onClick={onCopy} title="复制">
                {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
              </button>
              <button style={S.codeActionBtn} onClick={onExpand} title={expanded ? '收起' : '展开'}>
                <Eye size={14} />
              </button>
            </div>
            <pre style={S.codeBlock}>
              <code dangerouslySetInnerHTML={{ __html: highlightCode(s.code.slice(0, expanded ? undefined : 300), s.language) }} />
            </pre>
          </div>
        </>
      )}

      {listMode && (
        <div style={{ padding: '0 16px', marginBottom: 8 }}>
          <div style={{
            fontFamily: "'Fira Code', monospace", fontSize: 12, color: '#d4d4d4',
            background: 'rgba(0,0,0,0.4)', padding: '8px 12px', borderRadius: 8,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {s.code.slice(0, 120)}{s.code.length > 120 ? '...' : ''}
          </div>
        </div>
      )}

      <div style={S.cardFooter}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{s.category}</span>
          <span>·</span>
          <span>{timeAgo(s.updatedAt)}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            style={{ ...S.iconBtnSm, color: s.favorite ? '#ef4444' : 'var(--text-secondary)' }}
            onClick={onToggleFavorite}
            title={s.favorite ? '取消收藏' : '收藏'}
          >
            <Star size={14} fill={s.favorite ? '#ef4444' : 'none'} />
          </button>
          <button style={S.iconBtnSm} onClick={onEdit} title="编辑">
            <ChevronDown size={14} />
          </button>
          <button style={{ ...S.iconBtnSm, color: '#ef4444' }} onClick={onDelete} title="删除">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div style={S.expandContent}>
          <pre style={{ ...S.codeBlock, maxHeight: 400, margin: 0 }}>
            <code dangerouslySetInnerHTML={{ __html: highlightCode(s.code, s.language) }} />
          </pre>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {s.tags.map((t) => <span key={t} style={S.tag}>#{t}</span>)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SnippetVault() {
  const addNotification = useStore((s) => s.addNotification)

  const [snippets, setSnippets] = useState<Snippet[]>(loadSnippets)
  const [activeTab, setActiveTab] = useState<TabType>('browse')
  const [search, setSearch] = useState('')
  const [langFilter, setLangFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formLang, setFormLang] = useState('JavaScript')
  const [formCat, setFormCat] = useState(CATEGORIES[0])
  const [formTags, setFormTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [focusMode, setFocusMode] = useState<'all' | 'favorites' | 'pinned'>('all')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { saveToStorage(snippets) }, [snippets])

  const openCreate = useCallback(() => {
    setFormTitle(''); setFormDesc(''); setFormCode('')
    setFormLang('JavaScript'); setFormCat(CATEGORIES[0])
    setFormTags([]); setEditingId(null); setModalMode('create')
  }, [])

  const saveSnippet = useCallback(() => {
    if (!formTitle.trim() || !formCode.trim()) {
      addNotification({ title: '验证失败', message: '标题和代码内容不能为空', type: 'error' })
      return
    }
    if (editingId) {
      setSnippets((prev) => prev.map((s) => s.id === editingId
        ? { ...s, title: formTitle.trim(), description: formDesc.trim(), code: formCode,
            language: formLang, category: formCat, tags: formTags, updatedAt: Date.now() }
        : s))
      addNotification({ title: '保存成功', message: `「${formTitle.trim()}」已更新`, type: 'success' })
    } else {
      const newSnippet: Snippet = {
        id: genId(), title: formTitle.trim(), description: formDesc.trim(),
        code: formCode, language: formLang, category: formCat, tags: formTags,
        pinned: false, favorite: false, createdAt: Date.now(), updatedAt: Date.now(),
      }
      setSnippets((prev) => [newSnippet, ...prev])
      addNotification({ title: '创建成功', message: `「${formTitle.trim()}」已添加到代码库`, type: 'success' })
    }
    setModalMode(null); setEditingId(null)
  }, [editingId, formTitle, formCode, formDesc, formLang, formCat, formTags, addNotification])

  const saveCurrentFromShortcut = useCallback(() => {
    if (modalMode) saveSnippet()
  }, [modalMode, saveSnippet])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault(); searchRef.current?.focus()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault(); openCreate()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); saveCurrentFromShortcut()
      }
      if (e.key === 'Escape' && modalMode) {
        setModalMode(null); setEditingId(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [modalMode, openCreate, saveCurrentFromShortcut])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    snippets.forEach((s) => s.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [snippets])

  const tagSuggestions = useMemo(() => {
    if (!tagInput) return []
    return allTags.filter((t) => t.toLowerCase().includes(tagInput.toLowerCase()) && !formTags.includes(t)).slice(0, 8)
  }, [tagInput, allTags, formTags])

  const filtered = useMemo(() => {
    let list = [...snippets]
    if (focusMode === 'favorites') list = list.filter((s) => s.favorite)
    if (focusMode === 'pinned') list = list.filter((s) => s.pinned)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((s) =>
        s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q)))
    }
    if (langFilter !== 'all') list = list.filter((s) => s.language === langFilter)
    if (catFilter !== 'all') list = list.filter((s) => s.category === catFilter)
    if (tagFilter) list = list.filter((s) => s.tags.includes(tagFilter))
    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
      return b.updatedAt - a.updatedAt
    })
    return list
  }, [snippets, search, langFilter, catFilter, tagFilter, focusMode])

  const stats = useMemo(() => {
    const langDist: Record<string, number> = {}
    const tagCount: Record<string, number> = {}
    const catDist: Record<string, number> = {}
    snippets.forEach((s) => {
      langDist[s.language] = (langDist[s.language] || 0) + 1
      catDist[s.category] = (catDist[s.category] || 0) + 1
      s.tags.forEach((t) => { tagCount[t] = (tagCount[t] || 0) + 1 })
    })
    const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 15)
    return {
      total: snippets.length, langDist, catDist, topTags,
      pinned: snippets.filter((s) => s.pinned).length,
      favorited: snippets.filter((s) => s.favorite).length,
      langCount: Object.keys(langDist).length,
    }
  }, [snippets])

  const usedLangs = useMemo(() => {
    const set = new Set(snippets.map((s) => s.language))
    return LANGUAGES.filter((l) => set.has(l))
  }, [snippets])

  const openEdit = useCallback((s: Snippet) => {
    setFormTitle(s.title); setFormDesc(s.description); setFormCode(s.code)
    setFormLang(s.language); setFormCat(s.category); setFormTags([...s.tags])
    setEditingId(s.id); setModalMode('edit')
  }, [])

  const deleteSnippet = useCallback((id: string) => {
    const snippet = snippets.find((s) => s.id === id)
    setSnippets((prev) => prev.filter((s) => s.id !== id))
    if (expandedId === id) setExpandedId(null)
    addNotification({
      title: '已删除',
      message: snippet ? `「${snippet.title}」已删除` : '片段已删除',
      type: 'info',
    })
  }, [expandedId, snippets, addNotification])

  const togglePin = useCallback((id: string) => {
    setSnippets((prev) => prev.map((s) => s.id === id ? { ...s, pinned: !s.pinned, updatedAt: Date.now() } : s))
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setSnippets((prev) => prev.map((s) => s.id === id ? { ...s, favorite: !s.favorite } : s))
  }, [])

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id)
      addNotification({ title: '复制成功', message: '代码已复制到剪贴板', type: 'success', duration: 2000 })
      setTimeout(() => setCopiedId(null), 2000)
    }).catch(() => {
      addNotification({ title: '复制失败', message: '请手动复制代码', type: 'error' })
    })
  }, [addNotification])

  const addTag = useCallback((tag: string) => {
    const t = tag.trim()
    if (t && !formTags.includes(t)) setFormTags((prev) => [...prev, t])
    setTagInput('')
  }, [formTags])

  const removeTag = useCallback((tag: string) => {
    setFormTags((prev) => prev.filter((t) => t !== tag))
  }, [])

  const exportJSON = useCallback(() => {
    try {
      const blob = new Blob([JSON.stringify(snippets, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `snippet-vault-${new Date().toISOString().slice(0, 10)}.json`; a.click()
      URL.revokeObjectURL(url)
      addNotification({ title: '导出成功', message: `${snippets.length} 个片段已导出`, type: 'success' })
    } catch {
      addNotification({ title: '导出失败', message: '无法导出数据', type: 'error' })
    }
  }, [snippets, addNotification])

  const importJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (Array.isArray(data)) {
          const imported: Snippet[] = data.map((d: any) => ({
            id: d.id || genId(), title: d.title || '未命名', description: d.description || '',
            code: d.code || '', language: d.language || 'JavaScript', category: d.category || '其他',
            tags: Array.isArray(d.tags) ? d.tags : [], pinned: !!d.pinned, favorite: !!d.favorite,
            createdAt: d.createdAt || Date.now(), updatedAt: d.updatedAt || Date.now(),
          }))
          setSnippets((prev) => [...prev, ...imported])
          addNotification({ title: '导入成功', message: `${imported.length} 个片段已导入`, type: 'success' })
        }
      } catch {
        addNotification({ title: '导入失败', message: '文件格式错误', type: 'error' })
      }
    }
    reader.readAsText(file); e.target.value = ''
  }, [addNotification])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.logo}>
          <div style={S.logoIcon}><Code2 size={18} color="#fff" /></div>
          <div>
            <div style={S.titleText}>Snippet Vault</div>
            <div style={S.subtitle}>代码片段保险库</div>
          </div>
        </div>
        <div style={S.spacer} />
        <span style={S.statBadge}>{stats.total} 片段</span>
        <button style={S.iconBtn} title={showExport ? '收起' : '导入/导出'} onClick={() => setShowExport((s) => !s)}>
          {showExport ? <X size={16} /> : <FileJson size={16} />}
        </button>
        <button style={S.primaryBtn} onClick={openCreate}>
          <Plus size={14} /> 新建片段
        </button>
      </div>

      {/* Export Bar */}
      {showExport && (
        <div style={S.exportBar}>
          <button onClick={exportJSON} style={S.exportBtn}><Download size={14} /> 导出 JSON</button>
          <button onClick={() => fileInputRef.current?.click()} style={S.exportBtn}><Upload size={14} /> 导入 JSON</button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={importJSON} style={{ display: 'none' }} />
          <span style={S.hint}>导出所有片段为 JSON，或从 JSON 文件导入</span>
          <div style={S.shortcutHint}>
            <Keyboard size={12} /> Ctrl+K 搜索 · Ctrl+N 新建 · Ctrl+S 保存
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div style={S.tabBar}>
        <button style={{ ...S.tab, ...(activeTab === 'browse' ? { ...S.tab, borderBottomColor: 'var(--accent)', color: 'var(--accent)' } : {}) }} onClick={() => setActiveTab('browse')}>
          <Code2 size={14} /> 浏览
        </button>
        <button style={{ ...S.tab, ...(activeTab === 'stats' ? { ...S.tab, borderBottomColor: 'var(--accent)', color: 'var(--accent)' } : {}) }} onClick={() => setActiveTab('stats')}>
          <BarChart3 size={14} /> 统计
        </button>
      </div>

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <>
          <div style={S.subTabBar}>
            <div style={{ display: 'flex', gap: 6 }}>
              {([
                { key: 'all', label: '全部', icon: null },
                { key: 'favorites', label: '收藏', icon: <Star size={12} /> },
                { key: 'pinned', label: '置顶', icon: <Pin size={12} /> },
              ] as const).map((t) => (
                <button key={t.key} style={{ ...S.subTab, ...(focusMode === t.key ? { background: 'var(--accent-bg)', color: 'var(--accent)', borderColor: 'var(--accent)' } : {}) }} onClick={() => setFocusMode(t.key)}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
            <div style={{ width: 1, height: 20, background: 'var(--glass-border)' }} />
            <div style={S.searchBox}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索标题、描述、代码、标签..." style={S.searchInput} />
              {search && (
                <span onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14 }}>×</span>
              )}
            </div>
            <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)} style={S.filterSelect}>
              <option value="all">全部语言</option>
              {usedLangs.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={S.filterSelect}>
              <option value="all">全部分类</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} style={S.filterSelect}>
              <option value="">全部标签</option>
              {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div style={{ flex: 1 }} />
            <div style={S.viewToggle}>
              <button style={{ ...S.viewBtn, ...(viewMode === 'grid' ? { background: 'var(--accent-bg)', color: 'var(--accent)' } : {}) }} onClick={() => setViewMode('grid')} title="网格视图">⊞</button>
              <button style={{ ...S.viewBtn, ...(viewMode === 'list' ? { background: 'var(--accent-bg)', color: 'var(--accent)' } : {}) }} onClick={() => setViewMode('list')} title="列表视图">☰</button>
            </div>
          </div>

          <div style={S.content}>
            {filtered.length === 0 ? (
              <div style={S.empty}>
                <Code2 size={64} style={{ opacity: 0.3 }} />
                <div style={{ fontSize: 16, fontWeight: 600 }}>没有找到片段</div>
                <div style={{ fontSize: 13 }}>
                  {search || langFilter !== 'all' || catFilter !== 'all' || tagFilter ? '尝试调整搜索条件' : '点击「新建片段」开始添加'}
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div style={S.grid}>
                {filtered.map((s) => (
                  <SnippetCard key={s.id} snippet={s} expanded={expandedId === s.id}
                    onExpand={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    onEdit={() => openEdit(s)} onDelete={() => deleteSnippet(s.id)}
                    onTogglePin={() => togglePin(s.id)} onToggleFavorite={() => toggleFavorite(s.id)}
                    onCopy={() => copyCode(s.code, s.id)} copied={copiedId === s.id} />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map((s) => (
                  <SnippetCard key={s.id} snippet={s} expanded={expandedId === s.id} listMode
                    onExpand={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    onEdit={() => openEdit(s)} onDelete={() => deleteSnippet(s.id)}
                    onTogglePin={() => togglePin(s.id)} onToggleFavorite={() => toggleFavorite(s.id)}
                    onCopy={() => copyCode(s.code, s.id)} copied={copiedId === s.id} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <>
          <div style={S.statsHeader}>
            <div style={S.statCard}><div style={S.statValue}>{stats.total}</div><div style={S.statLabel}>总片段数</div></div>
            <div style={S.statCard}><div style={{ ...S.statValue, WebkitTextFillColor: '#f59e0b' }}>{stats.pinned}</div><div style={S.statLabel}>📌 已置顶</div></div>
            <div style={S.statCard}><div style={{ ...S.statValue, WebkitTextFillColor: '#ef4444' }}>{stats.favorited}</div><div style={S.statLabel}>❤️ 已收藏</div></div>
            <div style={S.statCard}><div style={S.statValue}>{stats.langCount}</div><div style={S.statLabel}>编程语言</div></div>
          </div>
          <div style={S.statsSection}>
            <div style={S.statsCard}>
              <div style={S.statsCardTitle}><Palette size={14} /> 语言分布</div>
              {Object.entries(stats.langDist).sort((a, b) => b[1] - a[1]).map(([lang, count]) => (
                <div key={lang} style={S.langItem}>
                  <span style={{ width: 80, fontSize: 12, color: 'var(--text-secondary)' }}>{lang}</span>
                  <div style={S.langBar}><div style={{ ...S.langBarFill, width: `${(count / stats.total) * 100}%`, background: LANG_COLORS[lang] || '#8b7cf0' }} /></div>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', minWidth: 30, textAlign: 'right' }}>{count}</span>
                </div>
              ))}
            </div>
            <div style={S.statsCard}>
              <div style={S.statsCardTitle}><Tag size={14} /> 热门标签</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {stats.topTags.map(([tag, count]) => (
                  <span key={tag} style={S.tagChip}>#{tag}<span style={{ color: 'var(--accent)' }}>{count}</span></span>
                ))}
              </div>
            </div>
            <div style={S.statsCard}>
              <div style={S.statsCardTitle}><BarChart3 size={14} /> 分类统计</div>
              {Object.entries(stats.catDist).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <div key={cat} style={S.langItem}>
                  <span style={{ width: 80, fontSize: 12, color: 'var(--text-secondary)' }}>{cat}</span>
                  <div style={S.langBar}><div style={{ ...S.langBarFill, width: `${(count / stats.total) * 100}%`, background: 'var(--accent)' }} /></div>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', minWidth: 30, textAlign: 'right' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {modalMode && (
        <div style={S.modalOverlay} onClick={() => { setModalMode(null); setEditingId(null) }}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTitle}>
              {modalMode === 'create' ? <><Plus size={18} /> 新建代码片段</> : <><Code2 size={18} /> 编辑代码片段</>}
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>标题 *</label>
              <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="片段标题" style={S.input} autoFocus />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>描述</label>
              <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="简短描述..." style={S.input} />
            </div>
            <div style={{ ...S.formRow, marginBottom: 16 }}>
              <div style={{ ...S.formGroup, flex: 1, marginBottom: 0 }}>
                <label style={S.label}>编程语言</label>
                <select value={formLang} onChange={(e) => setFormLang(e.target.value)} style={S.select}>
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ ...S.formGroup, flex: 1, marginBottom: 0 }}>
                <label style={S.label}>分类</label>
                <select value={formCat} onChange={(e) => setFormCat(e.target.value)} style={S.select}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>标签</label>
              <div style={{ position: 'relative' }}>
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) } }}
                  placeholder="输入标签后按回车添加" style={S.input} />
                {tagSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--window-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, zIndex: 10, maxHeight: 160, overflow: 'auto' }}>
                    {tagSuggestions.map((t) => (
                      <div key={t} onClick={() => addTag(t)} style={{ padding: '7px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }}>
                        {t}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 8 }}>
                {formTags.map((t) => (
                  <span key={t} style={S.tagChip}>
                    #{t}
                    <button onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontSize: 12 }}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>代码 *</label>
              <textarea
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="粘贴或编写代码..."
                style={S.textarea}
                spellCheck={false}
              />
            </div>
            <div style={S.modalActions}>
              <button style={S.cancelBtn} onClick={() => { setModalMode(null); setEditingId(null) }}>取消</button>
              <button style={S.saveBtn} onClick={saveSnippet}>
                {modalMode === 'create' ? '创建片段' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}