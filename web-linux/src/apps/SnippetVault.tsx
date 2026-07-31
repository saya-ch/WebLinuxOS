import { useState, useCallback, useEffect, useRef, useMemo } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Snippet {
  id: string
  title: string
  description: string
  code: string
  language: string
  tags: string[]
  pinned: boolean
  favorite: boolean
  createdAt: number
  updatedAt: number
}

type ViewMode = 'grid' | 'list'
type ModalMode = 'create' | 'edit' | null

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'weblinux-snippet-vault'

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java',
  'C++', 'C', 'C#', 'HTML', 'CSS', 'SQL', 'Shell', 'Bash',
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'Lua', 'R',
  'Scala', 'Elixir', 'Haskell', 'Perl', 'YAML', 'JSON', 'Markdown',
]

const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3776ab',
  Go: '#00add8', Rust: '#dea584', Java: '#b07219',
  'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
  HTML: '#e34c26', CSS: '#563d7c', SQL: '#e38c00',
  Shell: '#89e051', Bash: '#89e051', PHP: '#4F5D95',
  Ruby: '#701516', Swift: '#F05138', Kotlin: '#A97BFF',
  Dart: '#00B4AB', Lua: '#000080', R: '#198CE7',
  Scala: '#c22d40', Elixir: '#6e4a7e', Haskell: '#5e5086',
  Perl: '#0298c3', YAML: '#cb171e', JSON: '#292929', Markdown: '#083fa1',
}

const TEMPLATE_SNIPPETS: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'React useEffect 清理副作用',
    description: 'useEffect 中正确清理定时器、订阅等副作用，避免内存泄漏',
    language: 'TypeScript',
    code: `useEffect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);

  const controller = new AbortController();
  fetch('/api/data', { signal: controller.signal })
    .then(res => res.json())
    .then(setData);

  return () => {
    clearInterval(timer);
    controller.abort();
  };
}, []);`,
    tags: ['React', 'Hooks', '副作用'], pinned: false, favorite: true,
  },
  {
    title: 'Python 装饰器计时器',
    description: '使用装饰器自动测量函数执行时间，支持同步和异步函数',
    language: 'Python',
    code: `import time
import functools

def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} took {elapsed:.4f}s")
        return result
    return wrapper

# 用法
@timer
def slow_function():
    time.sleep(1)
    return "done"`,
    tags: ['装饰器', '性能', '工具'], pinned: false, favorite: true,
  },
  {
    title: 'Go goroutine 并发模式',
    description: '使用 WaitGroup 和 channel 实现 fan-out/fan-in 并发模式',
    language: 'Go',
    code: `func fanOutFanIn(inputs []string) []string {
    var wg sync.WaitGroup
    ch := make(chan string, len(inputs))

    for _, input := range inputs {
        wg.Add(1)
        go func(s string) {
            defer wg.Done()
            result := process(s)
            ch <- result
        }(input)
    }

    go func() {
        wg.Wait()
        close(ch)
    }()

    var results []string
    for r := range ch {
        results = append(results, r)
    }
    return results
}`,
    tags: ['并发', 'goroutine', 'channel'], pinned: false, favorite: false,
  },
  {
    title: 'Rust 错误处理最佳实践',
    description: '使用 thiserror 和 anyhow 进行结构化错误处理',
    language: 'Rust',
    code: `use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Parse error: {0}")]
    Parse(#[from] std::num::ParseIntError),
    #[error("Not found: {0}")]
    NotFound(String),
}

type Result<T> = std::result::Result<T, AppError>;

fn find_user(id: u32) -> Result<String> {
    if id == 0 {
        return Err(AppError::NotFound(
            format!("User {} not found", id)
        ));
    }
    Ok(format!("user_{}", id))
}`,
    tags: ['错误处理', 'thiserror', '模式'], pinned: false, favorite: false,
  },
  {
    title: '防抖与节流函数',
    description: '前端性能优化必备：防抖(debounce)和节流(throttle)的经典实现',
    language: 'JavaScript',
    code: `// 防抖 - 延迟执行，只执行最后一次
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 节流 - 固定频率执行
function throttle(fn, interval = 300) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

// 用法
const handleSearch = debounce(query => {
  fetchResults(query);
}, 500);

const handleScroll = throttle(() => {
  updatePosition();
}, 100);`,
    tags: ['性能', '防抖', '节流'], pinned: true, favorite: true,
  },
  {
    title: 'Java Stream 流式操作',
    description: 'Java 8 Stream API 常用操作：过滤、映射、归约、分组',
    language: 'Java',
    code: `List<Person> people = List.of(
    new Person("Alice", 28),
    new Person("Bob", 35),
    new Person("Charlie", 22)
);

// 过滤 + 映射
List<String> names = people.stream()
    .filter(p -> p.getAge() > 25)
    .map(Person::getName)
    .collect(Collectors.toList());

// 分组
Map<Integer, List<Person>> byAge = people.stream()
    .collect(Collectors.groupingBy(Person::getAge));

// 归约
int totalAge = people.stream()
    .mapToInt(Person::getAge)
    .reduce(0, Integer::sum);

// 统计
IntSummaryStatistics stats = people.stream()
    .mapToInt(Person::getAge)
    .summaryStatistics();`,
    tags: ['Stream', '函数式', '集合'], pinned: false, favorite: false,
  },
  {
    title: 'C++ 智能指针指南',
    description: 'unique_ptr、shared_ptr、weak_ptr 的使用场景与最佳实践',
    language: 'C++',
    code: `// unique_ptr - 独占所有权
auto up = std::make_unique<Widget>(42);
// auto up2 = up; // 编译错误：不可复制
auto up2 = std::move(up); // 可以移动

// shared_ptr - 共享所有权
auto sp1 = std::make_shared<Widget>(42);
auto sp2 = sp1; // 引用计数 +1
std::cout << sp1.use_count(); // 2

// weak_ptr - 打破循环引用
std::weak_ptr<Widget> wp = sp1;
if (auto locked = wp.lock()) {
    locked->doSomething();
}

// 工厂函数模式
std::unique_ptr<Base> createObject(int type) {
    switch (type) {
        case 1: return std::make_unique<DerivedA>();
        case 2: return std::make_unique<DerivedB>();
        default: return nullptr;
    }
}`,
    tags: ['智能指针', '内存管理', 'RAII'], pinned: false, favorite: false,
  },
  {
    title: 'SQL 窗口函数详解',
    description: 'ROW_NUMBER、RANK、LEAD/LAG 等窗口函数的常用模式',
    language: 'SQL',
    code: `-- 分页排名
SELECT name, salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,
  RANK() OVER (ORDER BY salary DESC) AS rank_val,
  DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank
FROM employees;

-- 分组内排名
SELECT dept, name, salary,
  ROW_NUMBER() OVER (
    PARTITION BY dept ORDER BY salary DESC
  ) AS dept_rank
FROM employees;

-- 环比增长
SELECT date, revenue,
  LAG(revenue, 1) OVER (ORDER BY date) AS prev_revenue,
  revenue - LAG(revenue, 1) OVER (ORDER BY date) AS growth
FROM daily_sales;

-- 移动平均
SELECT date, price,
  AVG(price) OVER (
    ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) AS ma7
FROM stock_prices;`,
    tags: ['窗口函数', '排名', '分析'], pinned: false, favorite: true,
  },
  {
    title: 'Shell 脚本模板',
    description: '生产级 Shell 脚本模板，包含参数解析、日志、错误处理',
    language: 'Shell',
    code: `#!/usr/bin/env bash
set -euo pipefail

readonly SCRIPT_NAME=\$(basename "\$0")
readonly LOG_FILE="/tmp/\${SCRIPT_NAME}.log"

log() { echo "[\$(date '+%Y-%m-%d %H:%M:%S')] \$*" | tee -a "\$LOG_FILE"; }
err() { log "ERROR: \$*" >&2; exit 1; }

usage() {
  cat <<EOF
Usage: \$SCRIPT_NAME [OPTIONS] <input>

Options:
  -o, --output DIR   Output directory (default: .)
  -v, --verbose      Enable verbose mode
  -h, --help         Show this help
EOF
  exit 0
}

OUTPUT="."
VERBOSE=0

while [[ \$# -gt 0 ]]; do
  case \$1 in
    -o|--output) OUTPUT="\$2"; shift 2 ;;
    -v|--verbose) VERBOSE=1; shift ;;
    -h|--help) usage ;;
    -*) err "Unknown option: \$1" ;;
    *) INPUT="\$1"; shift ;;
  esac
done

[[ -z "\${INPUT:-}" ]] && err "Input required"
log "Processing: \$INPUT"`,
    tags: ['Shell', '脚本', '模板'], pinned: false, favorite: false,
  },
  {
    title: 'CSS Grid 响应式布局',
    description: '使用 CSS Grid 实现自适应响应式布局，无需媒体查询',
    language: 'CSS',
    code: `.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

/* 瀑布流效果 */
.masonry {
  columns: 3 280px;
  column-gap: 1.5rem;
}

.masonry > * {
  break-inside: avoid;
  margin-bottom: 1.5rem;
}

/* 粘性页脚布局 */
.page {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

/* 圣杯布局 */
.holy-grail {
  display: grid;
  grid-template:
    "header header header" auto
    "nav    main   aside"  1fr
    "footer footer footer" auto
    / 200px 1fr    200px;
  min-height: 100vh;
}`,
    tags: ['Grid', '响应式', '布局'], pinned: false, favorite: false,
  },
  {
    title: 'Python 上下文管理器',
    description: '自定义上下文管理器，支持 with 语句的资源管理',
    language: 'Python',
    code: `from contextlib import contextmanager
import time

# 方式1: 类实现
class Timer:
    def __init__(self, name):
        self.name = name

    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, *exc):
        elapsed = time.perf_counter() - self.start
        print(f"{self.name}: {elapsed:.4f}s")
        return False

# 方式2: 生成器实现 (推荐)
@contextmanager
def timer(name):
    start = time.perf_counter()
    try:
        yield
    finally:
        print(f"{name}: {time.perf_counter() - start:.4f}s")

# 方式3: 临时切换目录
@contextmanager
def cd(path):
    old = os.getcwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(old)

# 用法
with timer("database query"):
    results = db.execute("SELECT * FROM users")`,
    tags: ['上下文管理器', 'with', '资源管理'], pinned: false, favorite: false,
  },
  {
    title: 'TypeScript 泛型工具类型',
    description: '常用的 TypeScript 泛型工具类型实现，提升类型编程能力',
    language: 'TypeScript',
    code: `// 深层 Partial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 深层 Required
type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// 提取 Promise 内部类型
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

// 构造函数参数类型
type ConstructorParams<T> = T extends new (...args: infer P) => any ? P : never;

// 提取函数返回类型
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;

// 将指定 key 变为可选
type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 用法
interface Config {
  db: { host: string; port: number };
  cache: { ttl: number; enabled: boolean };
}

type PartialConfig = DeepPartial<Config>;
// { db?: { host?: string; port?: number }; cache?: { ttl?: number; enabled?: boolean } }`,
    tags: ['泛型', '工具类型', '类型编程'], pinned: true, favorite: true,
  },
  {
    title: 'Docker Compose 微服务模板',
    description: '前后端分离的微服务 Docker Compose 配置模板',
    language: 'YAML',
    code: `version: "3.8"

services:
  api:
    build: ./api
    ports: ["8000:8000"]
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/app
      REDIS_URL: redis://cache:6379
    depends_on:
      db: { condition: service_healthy }
      cache: { condition: service_started }
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      retries: 3

  web:
    build: ./web
    ports: ["3000:80"]
    depends_on: [api]

  db:
    image: postgres:16-alpine
    volumes: ["pgdata:/var/lib/postgresql/data"]
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 5s

  cache:
    image: redis:7-alpine
    volumes: ["redisdata:/data"]

volumes:
  pgdata:
  redisdata:`,
    tags: ['Docker', '微服务', '部署'], pinned: false, favorite: false,
  },
  {
    title: 'Go 接口组合模式',
    description: 'Go 语言接口组合、隐式实现和依赖注入的设计模式',
    language: 'Go',
    code: `// 定义小接口
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

// 接口组合
type ReadWriter interface {
    Reader
    Writer
}

// 依赖注入
type Service struct {
    store  Store
    logger Logger
}

func NewService(s Store, l Logger) *Service {
    return &Service{store: s, logger: l}
}

// 隐式实现 - 无需声明
type memoryStore struct {
    data map[string]string
}

func (m *memoryStore) Get(key string) (string, error) {
    v, ok := m.data[key]
    if !ok {
        return "", ErrNotFound
    }
    return v, nil
}

// Store 接口自动被满足
var _ Store = (*memoryStore)(nil)`,
    tags: ['接口', '设计模式', '依赖注入'], pinned: false, favorite: false,
  },
  {
    title: 'React 自定义 Hook: useLocalStorage',
    description: '将状态同步到 localStorage 的自定义 Hook，支持类型安全',
    language: 'TypeScript',
    code: `function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    const valueToStore =
      value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    window.localStorage.setItem(key, JSON.stringify(valueToStore));
  };

  return [storedValue, setValue];
}

// 用法
const [theme, setTheme] = useLocalStorage('theme', 'dark');
const [user, setUser] = useLocalStorage<User>('user', defaultUser);`,
    tags: ['React', 'Hooks', 'localStorage'], pinned: true, favorite: false,
  },
  {
    title: 'Python 异步编程模式',
    description: 'asyncio 常见异步编程模式：并发请求、超时控制、信号量限流',
    language: 'Python',
    code: `import asyncio

async def fetch(session, url):
    async with session.get(url) as resp:
        return await resp.json()

# 并发执行 + 信号量限流
async def fetch_all(urls, max_concurrent=10):
    sem = asyncio.Semaphore(max_concurrent)

    async def limited_fetch(url):
        async with sem:
            return await fetch(session, url)

    async with aiohttp.ClientSession() as session:
        tasks = [limited_fetch(url) for url in urls]
        return await asyncio.gather(*tasks)

# 超时控制
async def fetch_with_timeout(url, timeout=5.0):
    try:
        return await asyncio.wait_for(
            fetch(session, url), timeout=timeout
        )
    except asyncio.TimeoutError:
        print(f"Timeout: {url}")
        return None

# 生产者-消费者
async def producer(queue):
    for item in range(100):
        await queue.put(item)
    await queue.put(None)  # sentinel

async def consumer(queue):
    while True:
        item = await queue.get()
        if item is None:
            break
        await process(item)`,
    tags: ['异步', 'asyncio', '并发'], pinned: false, favorite: true,
  },
]

// ─── Syntax Highlighter ──────────────────────────────────────────────────────

const KEYWORDS: Record<string, string[]> = {
  JavaScript: ['const','let','var','function','return','if','else','for','while','do','switch','case','break','continue','new','this','class','extends','super','import','export','default','from','try','catch','finally','throw','async','await','yield','typeof','instanceof','in','of','true','false','null','undefined','void','delete','static','get','set','=>'],
  TypeScript: ['const','let','var','function','return','if','else','for','while','do','switch','case','break','continue','new','this','class','extends','super','import','export','default','from','try','catch','finally','throw','async','await','yield','typeof','instanceof','in','of','true','false','null','undefined','void','delete','static','get','set','=>','type','interface','enum','implements','declare','namespace','as','keyof','infer','readonly','never','unknown','any'],
  Python: ['def','class','return','if','elif','else','for','while','break','continue','import','from','as','try','except','finally','raise','with','lambda','yield','pass','del','global','nonlocal','assert','and','or','not','is','in','True','False','None','self','async','await','print','range','len','type','super'],
  Go: ['func','return','if','else','for','range','switch','case','break','continue','go','defer','chan','select','type','struct','interface','map','var','const','import','package','true','false','nil','make','new','append','len','cap','fmt','err','string','int','bool','byte','rune'],
  Rust: ['fn','let','mut','if','else','for','while','loop','match','return','struct','enum','impl','trait','pub','use','mod','self','Self','super','where','type','const','static','ref','move','async','await','unsafe','true','false','Some','None','Ok','Err','Vec','String','Box','Rc','Arc'],
  Java: ['public','private','protected','class','interface','extends','implements','static','final','void','return','if','else','for','while','do','switch','case','break','continue','new','this','super','try','catch','finally','throw','throws','import','package','abstract','synchronized','volatile','transient','instanceof','null','true','false','int','long','double','float','boolean','char','byte','short'],
  'C++': ['int','long','double','float','char','bool','void','auto','const','static','class','struct','enum','namespace','using','template','typename','public','private','protected','virtual','override','return','if','else','for','while','do','switch','case','break','continue','new','delete','this','try','catch','throw','nullptr','true','false','size_t','std','include','define','ifdef','ifndef','endif'],
  SQL: ['SELECT','FROM','WHERE','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','DROP','ALTER','ADD','INDEX','JOIN','LEFT','RIGHT','INNER','OUTER','ON','AND','OR','NOT','IN','BETWEEN','LIKE','ORDER','BY','GROUP','HAVING','LIMIT','OFFSET','AS','DISTINCT','COUNT','SUM','AVG','MIN','MAX','CASE','WHEN','THEN','ELSE','END','UNION','ALL','EXISTS','OVER','PARTITION','ROW_NUMBER','RANK','DENSE_RANK','LEAD','LAG','ASC','DESC','PRIMARY','KEY','FOREIGN','REFERENCES','NULL','IS','DEFAULT','INTEGER','TEXT','VARCHAR','BOOLEAN','DATE','TIMESTAMP'],
  Shell: ['if','then','else','elif','fi','for','while','do','done','case','esac','function','return','exit','local','export','readonly','source','echo','printf','read','cd','pwd','ls','rm','cp','mv','mkdir','cat','grep','sed','awk','find','xargs','sort','uniq','wc','head','tail','cut','tr','tee','true','false','shift','set'],
  Bash: ['if','then','else','elif','fi','for','while','do','done','case','esac','function','return','exit','local','export','readonly','source','echo','printf','read','cd','pwd','true','false','shift','set'],
  CSS: ['display','position','top','left','right','bottom','width','height','margin','padding','border','background','color','font','text','flex','grid','gap','align','justify','overflow','opacity','transform','transition','animation','z-index','box-shadow','border-radius','important','none','auto','inherit','initial','relative','absolute','fixed','sticky','column','row','repeat','minmax','fr','px','em','rem','vh','vw'],
  HTML: ['DOCTYPE','html','head','body','div','span','p','a','img','ul','ol','li','h1','h2','h3','h4','h5','h6','table','tr','td','th','form','input','button','select','option','textarea','script','style','link','meta','title','class','id','src','href','type','name','value','placeholder','disabled','hidden','readonly','required'],
  YAML: ['true','false','null','yes','no','on','off'],
  Ruby: ['def','end','class','module','if','else','elsif','unless','while','until','for','do','begin','rescue','ensure','raise','return','yield','block','lambda','proc','attr_accessor','attr_reader','attr_writer','require','include','extend','self','super','nil','true','false','and','or','not'],
  PHP: ['function','class','public','private','protected','static','return','if','else','elseif','for','while','do','switch','case','break','continue','new','this','self','parent','echo','print','array','null','true','false','require','include','use','namespace','trait','interface','extends','implements','abstract','final','try','catch','throw','finally','fn'],
  Swift: ['var','let','func','return','if','else','for','while','switch','case','break','continue','class','struct','enum','protocol','extension','import','guard','self','Self','super','init','deinit','nil','true','false','typealias','associatedtype','public','private','internal','open','fileprivate','weak','unowned','lazy','static','override','mutating','throws','try','catch','throw','async','await','some','any','in','where','as','is'],
  Kotlin: ['fun','val','var','class','object','interface','enum','when','if','else','for','while','do','return','break','continue','import','package','try','catch','finally','throw','null','true','false','this','super','as','is','in','typealias','suspend','data','sealed','abstract','open','override','private','protected','internal','public','companion','init','by','lazy','inline','reified','crossinline','noinline','it'],
}

function highlightCode(code: string, language: string): string {
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const langKey = Object.keys(KEYWORDS).find(k => language.toLowerCase() === k.toLowerCase()) || ''
  const kwList = KEYWORDS[langKey] || []

  let result = escaped

  // 1) Comments (single-line)
  result = result.replace(/(\/\/.*$|#.*$)/gm, '<span style="color:#6a9955">$1</span>')

  // 2) Strings (double and single quotes, backticks)
  result = result.replace(/(&quot;.*?&quot;|"[^"]*"|'[^']*'|`[^`]*`)/g, '<span style="color:#ce9178">$1</span>')
  result = result.replace(/(f"[^"]*"|f'[^']*')/g, '<span style="color:#ce9178">$1</span>')

  // 3) Numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#b5cea8">$1</span>')

  // 4) Keywords
  if (kwList.length > 0) {
    const kwRegex = new RegExp('\\b(' + kwList.join('|').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')\\b', 'g')
    result = result.replace(kwRegex, '<span style="color:#569cd6">$1</span>')
  }

  // 5) Annotations / decorators
  result = result.replace(/(@\w+)/g, '<span style="color:#dcdcaa">$1</span>')

  return result
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function loadSnippets(): Snippet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  // First time: seed with templates
  const seeded: Snippet[] = TEMPLATE_SNIPPETS.map((t, i) => ({
    ...t,
    id: genId() + i,
    createdAt: Date.now() - (TEMPLATE_SNIPPETS.length - i) * 86400000,
    updatedAt: Date.now() - (TEMPLATE_SNIPPETS.length - i) * 86400000,
  }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
  return seeded
}

function saveSnippets(snippets: Snippet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets))
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}小时前`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}天前`
  return formatDate(ts)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SnippetVault() {
  const [snippets, setSnippets] = useState<Snippet[]>(loadSnippets)
  const [search, setSearch] = useState('')
  const [langFilter, setLangFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [modal, setModal] = useState<ModalMode>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formLang, setFormLang] = useState('JavaScript')
  const [formTags, setFormTags] = useState<string[]>([])

  const codeRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Persist
  useEffect(() => { saveSnippets(snippets) }, [snippets])

  // All unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>()
    snippets.forEach(s => s.tags.forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [snippets])

  // Tag suggestions
  const tagSuggestions = useMemo(() => {
    if (!tagInput) return []
    return allTags.filter(t =>
      t.toLowerCase().includes(tagInput.toLowerCase()) && !formTags.includes(t)
    ).slice(0, 8)
  }, [tagInput, allTags, formTags])

  // Filtered snippets
  const filtered = useMemo(() => {
    let list = [...snippets]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    if (langFilter !== 'all') {
      list = list.filter(s => s.language === langFilter)
    }
    if (tagFilter) {
      list = list.filter(s => s.tags.includes(tagFilter))
    }
    // Pinned first, then by updatedAt
    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
      return b.updatedAt - a.updatedAt
    })
    return list
  }, [snippets, search, langFilter, tagFilter])

  // Stats
  const stats = useMemo(() => {
    const langDist: Record<string, number> = {}
    const tagCount: Record<string, number> = {}
    snippets.forEach(s => {
      langDist[s.language] = (langDist[s.language] || 0) + 1
      s.tags.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1 })
    })
    const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 10)
    return { total: snippets.length, langDist, topTags, pinned: snippets.filter(s => s.pinned).length, favorited: snippets.filter(s => s.favorite).length }
  }, [snippets])

  // CRUD
  const openCreate = useCallback(() => {
    setFormTitle(''); setFormDesc(''); setFormCode(''); setFormLang('JavaScript'); setFormTags([])
    setEditingId(null); setModal('create')
  }, [])

  const openEdit = useCallback((s: Snippet) => {
    setFormTitle(s.title); setFormDesc(s.description); setFormCode(s.code); setFormLang(s.language); setFormTags([...s.tags])
    setEditingId(s.id); setModal('edit')
  }, [])

  const saveSnippet = useCallback(() => {
    if (!formTitle.trim() || !formCode.trim()) return
    if (editingId) {
      setSnippets(prev => prev.map(s => s.id === editingId ? {
        ...s, title: formTitle.trim(), description: formDesc.trim(), code: formCode, language: formLang, tags: formTags, updatedAt: Date.now()
      } : s))
    } else {
      const newSnippet: Snippet = {
        id: genId(), title: formTitle.trim(), description: formDesc.trim(), code: formCode, language: formLang, tags: formTags, pinned: false, favorite: false, createdAt: Date.now(), updatedAt: Date.now()
      }
      setSnippets(prev => [newSnippet, ...prev])
    }
    setModal(null); setEditingId(null)
  }, [editingId, formTitle, formDesc, formCode, formLang, formTags])

  const deleteSnippet = useCallback((id: string) => {
    setSnippets(prev => prev.filter(s => s.id !== id))
    setDeleteConfirmId(null)
    if (expandedId === id) setExpandedId(null)
  }, [expandedId])

  const togglePin = useCallback((id: string) => {
    setSnippets(prev => prev.map(s => s.id === id ? { ...s, pinned: !s.pinned, updatedAt: Date.now() } : s))
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setSnippets(prev => prev.map(s => s.id === id ? { ...s, favorite: !s.favorite } : s))
  }, [])

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }, [])

  const addTag = useCallback((tag: string) => {
    const t = tag.trim()
    if (t && !formTags.includes(t)) setFormTags(prev => [...prev, t])
    setTagInput('')
  }, [formTags])

  const removeTag = useCallback((tag: string) => {
    setFormTags(prev => prev.filter(t => t !== tag))
  }, [])

  // Export
  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(snippets, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `snippet-vault-${new Date().toISOString().slice(0, 10)}.json`
    a.click(); URL.revokeObjectURL(url)
  }, [snippets])

  // Import
  const importJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (Array.isArray(data)) {
          const imported: Snippet[] = data.map((d: any) => ({
            id: d.id || genId(), title: d.title || 'Untitled', description: d.description || '',
            code: d.code || '', language: d.language || 'JavaScript', tags: Array.isArray(d.tags) ? d.tags : [],
            pinned: !!d.pinned, favorite: !!d.favorite,
            createdAt: d.createdAt || Date.now(), updatedAt: d.updatedAt || Date.now()
          }))
          setSnippets(prev => [...prev, ...imported])
        }
      } catch { /* ignore bad JSON */ }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  // Used languages (for filter dropdown)
  const usedLangs = useMemo(() => {
    const set = new Set(snippets.map(s => s.language))
    return LANGUAGES.filter(l => set.has(l))
  }, [snippets])

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: '#0a0a18', color: '#e0e0e0', fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      overflow: 'hidden', fontSize: 13,
    }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid rgba(139,124,240,0.15)',
        background: 'linear-gradient(135deg, rgba(139,124,240,0.08), rgba(10,10,24,0.9))',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>{'{ }'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>Snippet Vault</div>
            <div style={{ fontSize: 11, color: 'rgba(139,124,240,0.7)' }}>代码片段保险库</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#888', background: 'rgba(139,124,240,0.1)', padding: '3px 10px', borderRadius: 10 }}>
          {stats.total} 片段
        </span>
        <button onClick={() => setShowStats(s => !s)} style={btnGhost} title="统计">
          📊
        </button>
        <button onClick={() => setShowExport(s => !s)} style={btnGhost} title="导入/导出">
          💾
        </button>
        <button onClick={openCreate} style={{
          background: 'linear-gradient(135deg, #8b7cf0, #6c5ce7)', border: 'none', color: '#fff',
          padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          + 新建片段
        </button>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid rgba(139,124,240,0.1)', background: '#0d0d20',
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: 14 }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索标题、描述、代码、标签..."
            style={{
              width: '100%', background: '#12122a', border: '1px solid rgba(139,124,240,0.2)',
              borderRadius: 8, padding: '7px 12px 7px 32px', color: '#e0e0e0', fontSize: 13,
              outline: 'none',
            }}
          />
          {search && (
            <span onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666', fontSize: 16 }}>×</span>
          )}
        </div>

        {/* Language filter */}
        <select value={langFilter} onChange={e => setLangFilter(e.target.value)} style={{
          background: '#12122a', border: '1px solid rgba(139,124,240,0.2)', borderRadius: 8,
          padding: '7px 12px', color: '#e0e0e0', fontSize: 13, outline: 'none', cursor: 'pointer',
        }}>
          <option value="all">全部语言</option>
          {usedLangs.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        {/* Tag filter */}
        <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} style={{
          background: '#12122a', border: '1px solid rgba(139,124,240,0.2)', borderRadius: 8,
          padding: '7px 12px', color: '#e0e0e0', fontSize: 13, outline: 'none', cursor: 'pointer',
        }}>
          <option value="">全部标签</option>
          {allTags.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* View mode */}
        <div style={{ display: 'flex', gap: 4, background: '#12122a', borderRadius: 8, padding: 2, border: '1px solid rgba(139,124,240,0.15)' }}>
          {(['grid', 'list'] as ViewMode[]).map(m => (
            <button key={m} onClick={() => setViewMode(m)} style={{
              background: viewMode === m ? 'rgba(139,124,240,0.3)' : 'transparent',
              border: 'none', color: viewMode === m ? '#fff' : '#888', padding: '4px 10px',
              borderRadius: 6, cursor: 'pointer', fontSize: 12, textTransform: 'capitalize',
            }}>
              {m === 'grid' ? '⊞' : '☰'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats Panel ────────────────────────────────────────── */}
      {showStats && (
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid rgba(139,124,240,0.1)',
          background: 'linear-gradient(135deg, rgba(139,124,240,0.05), #0d0d20)',
          display: 'flex', gap: 24, flexWrap: 'wrap', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>总片段数</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#8b7cf0' }}>{stats.total}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>📌 已置顶</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{stats.pinned}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>❤️ 已收藏</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{stats.favorited}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>语言分布</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(stats.langDist).sort((a, b) => b[1] - a[1]).map(([lang, count]) => (
                <span key={lang} style={{
                  background: `${LANG_COLORS[lang] || '#555'}22`, border: `1px solid ${LANG_COLORS[lang] || '#555'}44`,
                  borderRadius: 12, padding: '2px 10px', fontSize: 11, color: LANG_COLORS[lang] || '#aaa',
                }}>
                  {lang} ({count})
                </span>
              ))}
            </div>
          </div>
          <div style={{ minWidth: 180 }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>热门标签</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {stats.topTags.map(([tag, count]) => (
                <span key={tag} style={{
                  background: 'rgba(139,124,240,0.1)', borderRadius: 8, padding: '2px 8px',
                  fontSize: 11, color: '#bbb',
                }}>
                  #{tag} <span style={{ color: '#8b7cf0' }}>{count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Export Panel ───────────────────────────────────────── */}
      {showExport && (
        <div style={{
          padding: '12px 20px', borderBottom: '1px solid rgba(139,124,240,0.1)',
          background: '#0d0d20', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0,
        }}>
          <button onClick={exportJSON} style={{
            background: 'rgba(139,124,240,0.15)', border: '1px solid rgba(139,124,240,0.3)',
            color: '#8b7cf0', padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
          }}>
            📤 导出 JSON
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={{
            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
            color: '#10b981', padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
          }}>
            📥 导入 JSON
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={importJSON} style={{ display: 'none' }} />
          <span style={{ fontSize: 11, color: '#666' }}>导出所有片段为 JSON 文件，或从 JSON 文件导入</span>
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: '#555', gap: 12,
          }}>
            <div style={{ fontSize: 48 }}>📭</div>
            <div style={{ fontSize: 16 }}>没有找到片段</div>
            <div style={{ fontSize: 13 }}>
              {search || langFilter !== 'all' || tagFilter
                ? '尝试调整搜索条件'
                : '点击右上角「新建片段」开始添加'}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 14,
          }}>
            {filtered.map(s => (
              <SnippetCard
                key={s.id} snippet={s} expanded={expandedId === s.id}
                onExpand={() => setExpandedId(expandedId === s.id ? null : s.id)}
                onEdit={() => openEdit(s)}
                onDelete={() => setDeleteConfirmId(s.id)}
                onTogglePin={() => togglePin(s.id)}
                onToggleFavorite={() => toggleFavorite(s.favorite ? '' : s.id)}
                onCopy={() => copyCode(s.code, s.id)}
                copied={copiedId === s.id}
                deleteConfirmId={deleteConfirmId}
                onConfirmDelete={() => deleteSnippet(s.id)}
                onCancelDelete={() => setDeleteConfirmId(null)}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(s => (
              <SnippetRow
                key={s.id} snippet={s} expanded={expandedId === s.id}
                onExpand={() => setExpandedId(expandedId === s.id ? null : s.id)}
                onEdit={() => openEdit(s)}
                onDelete={() => setDeleteConfirmId(s.id)}
                onTogglePin={() => togglePin(s.id)}
                onToggleFavorite={() => toggleFavorite(s.favorite ? '' : s.id)}
                onCopy={() => copyCode(s.code, s.id)}
                copied={copiedId === s.id}
                deleteConfirmId={deleteConfirmId}
                onConfirmDelete={() => deleteSnippet(s.id)}
                onCancelDelete={() => setDeleteConfirmId(null)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modal ─────────────────────────────────────────────── */}
      {modal && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)',
        }} onClick={() => setModal(null)}>
          <div style={{
            background: '#12122a', border: '1px solid rgba(139,124,240,0.3)',
            borderRadius: 16, padding: 24, width: '90%', maxWidth: 640,
            maxHeight: '85%', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 20 }}>
              {modal === 'create' ? '✨ 新建代码片段' : '✏️ 编辑代码片段'}
            </div>

            {/* Title */}
            <label style={labelStyle}>标题 *</label>
            <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="片段标题" style={inputStyle} />

            {/* Language */}
            <label style={labelStyle}>语言</label>
            <select value={formLang} onChange={e => setFormLang(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            {/* Description */}
            <label style={labelStyle}>描述</label>
            <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="简短描述用途" style={inputStyle} />

            {/* Tags */}
            <label style={labelStyle}>标签</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {formTags.map(t => (
                <span key={t} style={{
                  background: 'rgba(139,124,240,0.2)', border: '1px solid rgba(139,124,240,0.4)',
                  borderRadius: 12, padding: '2px 8px 2px 10px', fontSize: 12, color: '#bbb',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {t}
                  <span onClick={() => removeTag(t)} style={{ cursor: 'pointer', color: '#f87171', fontSize: 14 }}>×</span>
                </span>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { addTag(tagInput); e.preventDefault() } }}
                placeholder="输入标签后按 Enter 添加" style={inputStyle}
              />
              {tagSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: '#1a1a35', border: '1px solid rgba(139,124,240,0.3)',
                  borderRadius: 8, zIndex: 10, maxHeight: 160, overflow: 'auto',
                }}>
                  {tagSuggestions.map(t => (
                    <div key={t} onClick={() => addTag(t)} style={{
                      padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: '#ccc',
                    }}
                      onMouseEnter={e => { (e.target as HTMLDivElement).style.background = 'rgba(139,124,240,0.15)' }}
                      onMouseLeave={e => { (e.target as HTMLDivElement).style.background = 'transparent' }}
                    >
                      #{t}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Code */}
            <label style={labelStyle}>代码 *</label>
            <textarea
              ref={codeRef}
              value={formCode} onChange={e => setFormCode(e.target.value)}
              placeholder="粘贴或输入代码..." spellCheck={false}
              style={{
                ...inputStyle, fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
                minHeight: 200, resize: 'vertical', lineHeight: 1.6, fontSize: 13, tabSize: 2,
              }}
            />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setModal(null)} style={btnCancel}>取消</button>
              <button onClick={saveSnippet} disabled={!formTitle.trim() || !formCode.trim()} style={{
                ...btnPrimary,
                opacity: (!formTitle.trim() || !formCode.trim()) ? 0.5 : 1,
                cursor: (!formTitle.trim() || !formCode.trim()) ? 'not-allowed' : 'pointer',
              }}>
                {modal === 'create' ? '创建' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SnippetCard({ snippet: s, expanded, onExpand, onEdit, onDelete, onTogglePin, onToggleFavorite, onCopy, copied, deleteConfirmId, onConfirmDelete, onCancelDelete }: {
  snippet: Snippet; expanded: boolean
  onExpand: () => void; onEdit: () => void; onDelete: () => void
  onTogglePin: () => void; onToggleFavorite: () => void
  onCopy: () => void; copied: boolean
  deleteConfirmId: string | null; onConfirmDelete: () => void; onCancelDelete: () => void
}) {
  const langColor = LANG_COLORS[s.language] || '#8b7cf0'
  const isDeleting = deleteConfirmId === s.id

  return (
    <div style={{
      background: 'rgba(18,18,42,0.6)', border: '1px solid rgba(139,124,240,0.12)',
      borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s',
      borderLeft: `3px solid ${langColor}`,
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            {s.pinned && <span style={{ fontSize: 12 }} title="已置顶">📌</span>}
            <span
              onClick={onToggleFavorite}
              style={{ cursor: 'pointer', fontSize: 13, filter: s.favorite ? 'none' : 'grayscale(1) opacity(0.4)' }}
              title={s.favorite ? '取消收藏' : '收藏'}
            >
              ❤️
            </span>
            <span style={{
              fontSize: 14, fontWeight: 600, color: '#fff',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {s.title}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#777', lineHeight: 1.4, marginBottom: 6 }}>
            {s.description}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              background: `${langColor}22`, border: `1px solid ${langColor}44`,
              borderRadius: 10, padding: '1px 8px', fontSize: 11, color: langColor, fontWeight: 600,
            }}>
              {s.language}
            </span>
            {s.tags.slice(0, 3).map(t => (
              <span key={t} style={{
                background: 'rgba(139,124,240,0.08)', borderRadius: 8, padding: '1px 7px',
                fontSize: 11, color: '#999',
              }}>
                #{t}
              </span>
            ))}
            {s.tags.length > 3 && (
              <span style={{ fontSize: 11, color: '#666' }}>+{s.tags.length - 3}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button onClick={onTogglePin} style={iconBtn} title={s.pinned ? '取消置顶' : '置顶'}>{s.pinned ? '📌' : '📍'}</button>
          <button onClick={onEdit} style={iconBtn} title="编辑">✏️</button>
          <button onClick={onCopy} style={iconBtn} title="复制代码">{copied ? '✅' : '📋'}</button>
          <button onClick={onDelete} style={iconBtn} title="删除">🗑️</button>
        </div>
      </div>

      {/* Delete confirm */}
      {isDeleting && (
        <div style={{
          padding: '8px 14px', background: 'rgba(239,68,68,0.1)',
          borderBottom: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
        }}>
          <span style={{ color: '#f87171' }}>确认删除此片段？</span>
          <button onClick={onConfirmDelete} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '2px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>删除</button>
          <button onClick={onCancelDelete} style={{ background: 'transparent', border: '1px solid #555', color: '#aaa', padding: '2px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>取消</button>
        </div>
      )}

      {/* Code preview */}
      <div
        onClick={onExpand}
        style={{
          margin: '0 10px 10px', background: '#0d1117', borderRadius: 8,
          overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(139,124,240,0.08)',
        }}
      >
        <div style={{
          padding: '6px 12px', background: 'rgba(139,124,240,0.06)',
          borderBottom: '1px solid rgba(139,124,240,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#666',
        }}>
          <span>{s.language}</span>
          <span style={{ fontSize: 10, color: '#555' }}>{expanded ? '收起 ▲' : '展开 ▼'}</span>
        </div>
        <pre style={{
          padding: '10px 14px', margin: 0, overflow: 'auto',
          fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
          fontSize: 12, lineHeight: 1.6, color: '#d4d4d4',
          maxHeight: expanded ? 500 : 120, transition: 'max-height 0.3s',
        }}>
          <code dangerouslySetInnerHTML={{ __html: highlightCode(expanded ? s.code : s.code.split('\n').slice(0, 8).join('\n') + (s.code.split('\n').length > 8 ? '\n...' : ''), s.language) }} />
        </pre>
      </div>

      {/* Footer */}
      <div style={{ padding: '4px 14px 8px', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#555' }}>
        <span>{timeAgo(s.updatedAt)}</span>
        <span>{s.code.split('\n').length} 行</span>
      </div>
    </div>
  )
}

function SnippetRow({ snippet: s, expanded, onExpand, onEdit, onDelete, onTogglePin, onToggleFavorite, onCopy, copied, deleteConfirmId, onConfirmDelete, onCancelDelete }: {
  snippet: Snippet; expanded: boolean
  onExpand: () => void; onEdit: () => void; onDelete: () => void
  onTogglePin: () => void; onToggleFavorite: () => void
  onCopy: () => void; copied: boolean
  deleteConfirmId: string | null; onConfirmDelete: () => void; onCancelDelete: () => void
}) {
  const langColor = LANG_COLORS[s.language] || '#8b7cf0'
  const isDeleting = deleteConfirmId === s.id

  return (
    <div style={{
      background: 'rgba(18,18,42,0.6)', border: '1px solid rgba(139,124,240,0.12)',
      borderRadius: 10, overflow: 'hidden', borderLeft: `3px solid ${langColor}`,
    }}>
      <div
        onClick={onExpand}
        style={{
          padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer',
        }}
      >
        {s.pinned && <span style={{ fontSize: 11 }}>📌</span>}
        <span
          onClick={e => { e.stopPropagation(); onToggleFavorite() }}
          style={{ cursor: 'pointer', fontSize: 12, filter: s.favorite ? 'none' : 'grayscale(1) opacity(0.4)' }}
        >❤️</span>
        <span style={{ fontWeight: 600, color: '#fff', fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '0 1 auto' }}>
          {s.title}
        </span>
        <span style={{
          background: `${langColor}22`, border: `1px solid ${langColor}44`,
          borderRadius: 10, padding: '1px 8px', fontSize: 11, color: langColor, fontWeight: 600, flexShrink: 0,
        }}>
          {s.language}
        </span>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', flexShrink: 0 }}>
          {s.tags.slice(0, 2).map(t => (
            <span key={t} style={{ background: 'rgba(139,124,240,0.08)', borderRadius: 6, padding: '0 6px', fontSize: 10, color: '#888' }}>
              #{t}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 11, color: '#555', flexShrink: 0 }}>{timeAgo(s.updatedAt)}</span>
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button onClick={onCopy} style={iconBtn} title="复制">{copied ? '✅' : '📋'}</button>
          <button onClick={onEdit} style={iconBtn} title="编辑">✏️</button>
          <button onClick={onTogglePin} style={iconBtn} title="置顶">{s.pinned ? '📌' : '📍'}</button>
          <button onClick={onDelete} style={iconBtn} title="删除">🗑️</button>
        </div>
      </div>

      {isDeleting && (
        <div style={{
          padding: '6px 16px', background: 'rgba(239,68,68,0.1)',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
        }}>
          <span style={{ color: '#f87171' }}>确认删除？</span>
          <button onClick={onConfirmDelete} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '2px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>删除</button>
          <button onClick={onCancelDelete} style={{ background: 'transparent', border: '1px solid #555', color: '#aaa', padding: '2px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>取消</button>
        </div>
      )}

      {expanded && (
        <div style={{ margin: '0 12px 12px' }}>
          <div style={{ fontSize: 12, color: '#777', marginBottom: 8, lineHeight: 1.4 }}>{s.description}</div>
          <div style={{
            background: '#0d1117', borderRadius: 8, overflow: 'hidden',
            border: '1px solid rgba(139,124,240,0.08)',
          }}>
            <div style={{
              padding: '4px 12px', background: 'rgba(139,124,240,0.06)',
              borderBottom: '1px solid rgba(139,124,240,0.08)',
              display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666',
            }}>
              <span>{s.language}</span>
              <span>{s.code.split('\n').length} 行</span>
            </div>
            <pre style={{
              padding: '10px 14px', margin: 0, overflow: 'auto',
              fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
              fontSize: 12, lineHeight: 1.6, color: '#d4d4d4', maxHeight: 400,
            }}>
              <code dangerouslySetInnerHTML={{ __html: highlightCode(s.code, s.language) }} />
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const btnGhost: React.CSSProperties = {
  background: 'transparent', border: '1px solid rgba(139,124,240,0.2)',
  color: '#aaa', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
}

const btnCancel: React.CSSProperties = {
  background: 'transparent', border: '1px solid #444', color: '#aaa',
  padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
}

const btnPrimary: React.CSSProperties = {
  background: 'linear-gradient(135deg, #8b7cf0, #6c5ce7)', border: 'none', color: '#fff',
  padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0d0d20', border: '1px solid rgba(139,124,240,0.2)',
  borderRadius: 8, padding: '8px 12px', color: '#e0e0e0', fontSize: 13,
  outline: 'none', marginBottom: 12,
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: '#888', marginBottom: 4,
}

const iconBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 4px',
  fontSize: 14, lineHeight: 1, borderRadius: 4,
}
