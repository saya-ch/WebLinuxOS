import { useState, useMemo } from 'react'
import { Search, Copy, Check, Heart, Plus, Trash2, Code2, FileCode, Sparkles, Star } from 'lucide-react'

interface Snippet {
  id: string
  title: string
  language: string
  category: string
  description: string
  code: string
  custom?: boolean
}

const presetSnippets: Snippet[] = [
  { id: 'js-1', title: '防抖函数', language: 'JavaScript', category: '实用工具', description: '通用防抖实现，支持立即执行模式', code: `function debounce(fn, delay = 300, immediate = false) {
  let timer = null;
  return function (...args) {
    const context = this;
    if (timer) clearTimeout(timer);
    if (immediate && !timer) {
      fn.apply(context, args);
    }
    timer = setTimeout(() => {
      fn.apply(context, args);
      timer = null;
    }, delay);
  };
}` },
  { id: 'js-2', title: '节流函数', language: 'JavaScript', category: '实用工具', description: '时间节流函数实现', code: `function throttle(fn, delay = 300) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}` },
  { id: 'js-3', title: '深拷贝', language: 'JavaScript', category: '实用工具', description: '递归深拷贝实现', code: `function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  const clone = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key]);
    }
  }
  return clone;
}` },
  { id: 'js-4', title: '数组去重', language: 'JavaScript', category: '数组', description: '多种方式实现数组去重', code: `// 方法1: Set
const unique1 = [...new Set(array)];

// 方法2: filter
const unique2 = array.filter((item, i, arr) => arr.indexOf(item) === i);

// 方法3: reduce
const unique3 = array.reduce((acc, item) => {
  if (!acc.includes(item)) acc.push(item);
  return acc;
}, []);` },
  { id: 'js-5', title: 'Fetch API 封装', language: 'JavaScript', category: '网络', description: '通用的 Fetch 请求封装', code: `async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!response.ok) {
    throw new Error('请求失败: ' + response.status);
  }
  return response.json();
}` },
  { id: 'ts-1', title: '泛型接口', language: 'TypeScript', category: '类型', description: '泛型接口定义示例', code: `interface Container<T> {
  value: T;
  getValue(): T;
  setValue(value: T): void;
}

class Box<T> implements Container<T> {
  private _value: T;
  constructor(value: T) { this._value = value; }
  getValue(): T { return this._value; }
  setValue(value: T): void { this._value = value; }
}` },
  { id: 'ts-2', title: '类型守卫', language: 'TypeScript', category: '类型', description: 'TypeScript 类型守卫实现', code: `function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// 使用
const data: unknown = JSON.parse(input);
if (isObject(data)) {
  console.log('Valid object:', data);
}` },
  { id: 'ts-3', title: '工具类型', language: 'TypeScript', category: '类型', description: '常用 TypeScript 工具类型', code: `interface User { id: number; name: string; email: string; age: number; }

// 可选类型
type UserPartial = Partial<User>;

// 必选类型
type UserRequired = Required<User>;

// 只读类型
type UserReadonly = Readonly<User>;

// 选择部分属性
type UserPick = Pick<User, 'id' | 'name'>;

// 排除属性
type UserOmit = Omit<User, 'email'>;` },
  { id: 'py-1', title: '快速排序', language: 'Python', category: '算法', description: '经典快速排序实现', code: `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

# 使用
result = quicksort([3, 6, 8, 10, 1, 2, 1])` },
  { id: 'py-2', title: '装饰器模式', language: 'Python', category: '设计模式', description: 'Python 装饰器详解', code: `import functools
import time

def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        print(f'{func.__name__} 耗时: {elapsed:.4f}秒')
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)
    return '完成'` },
  { id: 'py-3', title: '上下文管理器', language: 'Python', category: '设计模式', description: '自定义上下文管理器', code: `class DatabaseConnection:
    def __init__(self, host, port):
        self.host = host
        self.port = port
    
    def __enter__(self):
        print(f'连接数据库 {self.host}:{self.port}')
        self.connection = {'host': self.host}
        return self.connection
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        print('关闭数据库连接')
        return False

# 使用
with DatabaseConnection('localhost', 5432) as conn:
    print(f'使用连接: {conn}')` },
  { id: 'css-1', title: 'Flex 居中', language: 'CSS', category: '布局', description: 'Flexbox 各种居中方案', code: `/* 水平垂直居中 */
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 水平居中 */
.h-center {
  display: flex;
  justify-content: center;
}

/* 垂直居中 */
.v-center {
  display: flex;
  align-items: center;
}

/* 多行居中 */
.multi-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}` },
  { id: 'css-2', title: '渐变色背景', language: 'CSS', category: '视觉', description: '精美渐变背景集合', code: `.gradient-1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.gradient-2 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
.gradient-3 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}
.gradient-4 {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}` },
  { id: 'css-3', title: '玻璃拟态', language: 'CSS', category: '视觉', description: '毛玻璃效果实现', code: `.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.glass-dark {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}` },
  { id: 'html-1', title: '语义化结构', language: 'HTML', category: '结构', description: 'HTML5 语义化标签模板', code: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>页面标题</title>
</head>
<body>
  <header>
    <nav><ul><li>导航</li></ul></nav>
  </header>
  <main>
    <article>
      <section>主要内容</section>
      <aside>侧边栏</aside>
    </article>
  </main>
  <footer>页脚信息</footer>
</body>
</html>` },
  { id: 'html-2', title: '响应式图片', language: 'HTML', category: '结构', description: 'picture 元素响应式图片', code: `<picture>
  <source media="(min-width: 800px)" srcset="large.jpg">
  <source media="(min-width: 400px)" srcset="medium.jpg">
  <img src="small.jpg" alt="响应式图片">
</picture>

<!-- srcset 用法 -->
<img
  src="image.jpg"
  srcset="image-400.jpg 400w, image-800.jpg 800w"
  sizes="(max-width: 600px) 400px, 800px"
  alt="示例"
>` },
]

const STORAGE_KEY_FAVORITES = 'weblinux-snippet-favorites'
const STORAGE_KEY_CUSTOM = 'weblinux-snippet-custom'

export default function CodeSnippetPlayground() {
  const [search, setSearch] = useState('')
  const [activeLang, setActiveLang] = useState('全部')
  const [activeCat, setActiveCat] = useState('全部')
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_FAVORITES) || '[]') } catch { return [] }
  })
  const [customSnippets, setCustomSnippets] = useState<Snippet[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOM) || '[]') } catch { return [] }
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSnippet, setNewSnippet] = useState({ title: '', language: 'JavaScript', category: '实用工具', description: '', code: '' })

  const allSnippets = useMemo(() => [...customSnippets, ...presetSnippets], [customSnippets])

  const languages = useMemo(() => ['全部', ...new Set(allSnippets.map(s => s.language))], [allSnippets])
  const categories = useMemo(() => ['全部', ...new Set(allSnippets.map(s => s.category))], [allSnippets])

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim()
    return allSnippets.filter(snippet => {
      if (activeLang !== '全部' && snippet.language !== activeLang) return false
      if (activeCat !== '全部' && snippet.category !== activeCat) return false
      if (s) {
        return snippet.title.toLowerCase().includes(s) ||
          snippet.description.toLowerCase().includes(s) ||
          snippet.code.toLowerCase().includes(s)
      }
      return true
    })
  }, [allSnippets, search, activeLang, activeCat])

  const copyToClipboard = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id]
    setFavorites(next)
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(next))
  }

  const deleteCustomSnippet = (id: string) => {
    const next = customSnippets.filter(s => s.id !== id)
    setCustomSnippets(next)
    localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(next))
    if (selectedSnippet?.id === id) setSelectedSnippet(null)
  }

  const addCustomSnippet = () => {
    if (!newSnippet.title || !newSnippet.code) return
    const snippet: Snippet = {
      ...newSnippet,
      id: `custom-${Date.now()}`,
      custom: true,
    }
    const next = [snippet, ...customSnippets]
    setCustomSnippets(next)
    localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(next))
    setShowAddForm(false)
    setNewSnippet({ title: '', language: 'JavaScript', category: '实用工具', description: '', code: '' })
    setSelectedSnippet(snippet)
  }

  const getLangColor = (lang: string) => {
    const colors: Record<string, string> = {
      JavaScript: '#f7df1e', TypeScript: '#3178c6', Python: '#3776ab',
      CSS: '#2965f1', HTML: '#e34f26',
    }
    return colors[lang] || '#8888aa'
  }

  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: '#e0e0f0',
      overflow: 'auto',
      padding: 20,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <style>{`
        .sp-card { transition: all 0.25s ease; }
        .sp-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
        .sp-fade-in { animation: spFadeIn 0.4s ease-out; }
        @keyframes spFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .sp-btn { transition: all 0.2s ease; }
        .sp-btn:hover { transform: translateY(-1px); }
        @keyframes spHeartBeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        .sp-heartbeat { animation: spHeartBeat 0.4s ease; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, minHeight: 'calc(100vh - 80px)' }}>
        {/* 左侧面板 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 头部 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(102,126,234,0.4)',
            }}>
              <Code2 size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>代码片段</div>
              <div style={{ fontSize: 11, color: '#8888aa' }}>预设片段库 · {allSnippets.length} 个片段</div>
            </div>
          </div>

          {/* 搜索框 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', background: 'rgba(255,255,255,0.06)',
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <Search size={14} style={{ color: '#8888aa' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索片段..."
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: '#e0e0f0', fontSize: 13, fontFamily: 'inherit', outline: 'none',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#6666aa', cursor: 'pointer', padding: 0 }}>✕</button>
            )}
          </div>

          {/* 语言筛选 */}
          <div>
            <div style={{ fontSize: 11, color: '#6666aa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>编程语言</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {languages.map(lang => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className="sp-btn"
                  style={{
                    padding: '5px 12px', borderRadius: 8,
                    border: activeLang === lang ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)',
                    background: activeLang === lang ? `${getLangColor(lang)}33` : 'rgba(255,255,255,0.05)',
                    color: activeLang === lang ? getLangColor(lang) : '#aaaacc',
                    cursor: 'pointer', fontSize: 11, fontWeight: activeLang === lang ? 600 : 400,
                    fontFamily: 'inherit',
                  }}
                >{lang}</button>
              ))}
            </div>
          </div>

          {/* 分类筛选 */}
          <div>
            <div style={{ fontSize: 11, color: '#6666aa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>分类</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className="sp-btn"
                  style={{
                    padding: '5px 12px', borderRadius: 8,
                    border: activeCat === cat ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)',
                    background: activeCat === cat ? 'rgba(102,126,234,0.2)' : 'rgba(255,255,255,0.05)',
                    color: activeCat === cat ? '#c5bfff' : '#aaaacc',
                    cursor: 'pointer', fontSize: 11, fontWeight: activeCat === cat ? 600 : 400,
                    fontFamily: 'inherit',
                  }}
                >{cat}</button>
              ))}
            </div>
          </div>

          {/* 添加按钮 */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="sp-btn"
            style={{
              padding: '10px 16px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(102,126,234,0.3)',
            }}
          >
            <Plus size={14} /> 新建片段
          </button>

          {/* 片段列表 */}
          <div style={{
            flex: 1, overflow: 'auto',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)',
            padding: 10,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(snippet => (
                <div
                  key={snippet.id}
                  onClick={() => setSelectedSnippet(snippet)}
                  className="sp-card"
                  style={{
                    padding: 12, borderRadius: 10, cursor: 'pointer',
                    background: selectedSnippet?.id === snippet.id ? 'rgba(102,126,234,0.15)' : 'rgba(255,255,255,0.04)',
                    border: selectedSnippet?.id === snippet.id ? '1px solid rgba(102,126,234,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: 4,
                      background: getLangColor(snippet.language),
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{snippet.title}</span>
                    {favorites.includes(snippet.id) && <Star size={12} style={{ color: '#facc15' }} fill="#facc15" />}
                    {snippet.custom && <Sparkles size={12} style={{ color: '#a29bfe' }} />}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: '#8888aa', display: 'flex', gap: 8 }}>
                    <span>{snippet.language}</span>
                    <span>·</span>
                    <span>{snippet.category}</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: 32, color: '#6666aa', fontSize: 13 }}>
                  <FileCode size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
                  没有匹配的片段
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧详情 */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
          padding: 24, display: 'flex', flexDirection: 'column',
          minHeight: 'calc(100vh - 120px)',
        }}>
          {showAddForm && (
            <div className="sp-fade-in" style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.1)', padding: 16, marginBottom: 16,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>新建代码片段</div>
              <div style={{ display: 'grid', gap: 10 }}>
                <input
                  value={newSnippet.title}
                  onChange={(e) => setNewSnippet({ ...newSnippet, title: e.target.value })}
                  placeholder="片段标题"
                  style={inputStyle}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <select
                    value={newSnippet.language}
                    onChange={(e) => setNewSnippet({ ...newSnippet, language: e.target.value })}
                    style={inputStyle}
                  >
                    <option>JavaScript</option><option>TypeScript</option><option>Python</option>
                    <option>CSS</option><option>HTML</option>
                  </select>
                  <select
                    value={newSnippet.category}
                    onChange={(e) => setNewSnippet({ ...newSnippet, category: e.target.value })}
                    style={inputStyle}
                  >
                    <option>实用工具</option><option>算法</option><option>设计模式</option>
                    <option>布局</option><option>视觉</option><option>结构</option>
                    <option>数组</option><option>网络</option><option>类型</option>
                  </select>
                </div>
                <input
                  value={newSnippet.description}
                  onChange={(e) => setNewSnippet({ ...newSnippet, description: e.target.value })}
                  placeholder="简短描述"
                  style={inputStyle}
                />
                <textarea
                  value={newSnippet.code}
                  onChange={(e) => setNewSnippet({ ...newSnippet, code: e.target.value })}
                  placeholder="粘贴你的代码..."
                  style={{ ...inputStyle, minHeight: 120, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addCustomSnippet} className="sp-btn" style={primaryBtn}>
                    <Plus size={14} /> 添加
                  </button>
                  <button onClick={() => setShowAddForm(false)} className="sp-btn" style={secondaryBtn}>
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedSnippet ? (
            <div className="sp-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    background: `${getLangColor(selectedSnippet.language)}22`,
                    color: getLangColor(selectedSnippet.language),
                    border: `1px solid ${getLangColor(selectedSnippet.language)}44`,
                  }}>{selectedSnippet.language}</div>
                  <span style={{ fontSize: 11, color: '#8888aa' }}>{selectedSnippet.category}</span>
                  {selectedSnippet.custom && <span style={{ fontSize: 11, color: '#a29bfe', display: 'flex', alignItems: 'center', gap: 4 }}><Sparkles size={12} /> 自定义</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => toggleFavorite(selectedSnippet.id)}
                    className={`sp-btn ${favorites.includes(selectedSnippet.id) ? 'sp-heartbeat' : ''}`}
                    style={{
                      padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                      background: favorites.includes(selectedSnippet.id) ? 'rgba(250,204,21,0.1)' : 'rgba(255,255,255,0.05)',
                      color: favorites.includes(selectedSnippet.id) ? '#facc15' : '#aaaacc',
                      cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
                      fontFamily: 'inherit',
                    }}
                  >
                    <Heart size={14} fill={favorites.includes(selectedSnippet.id) ? '#facc15' : 'none'} />
                    {favorites.includes(selectedSnippet.id) ? '已收藏' : '收藏'}
                  </button>
                  {selectedSnippet.custom && (
                    <button
                      onClick={() => deleteCustomSnippet(selectedSnippet.id)}
                      className="sp-btn"
                      style={{
                        padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)',
                        background: 'rgba(239,68,68,0.1)', color: '#f87171',
                        cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
                        fontFamily: 'inherit',
                      }}
                    >
                      <Trash2 size={14} /> 删除
                    </button>
                  )}
                </div>
              </div>

              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f0f0ff', marginBottom: 6 }}>{selectedSnippet.title}</h2>
              <p style={{ margin: 0, fontSize: 13, color: '#aaaacc', marginBottom: 16 }}>{selectedSnippet.description}</p>

              <div style={{
                position: 'relative', flex: 1,
                background: 'rgba(0,0,0,0.35)', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px', background: 'rgba(255,255,255,0.04)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 5, background: '#ff5f56' }} />
                      <div style={{ width: 10, height: 10, borderRadius: 5, background: '#ffbd2e' }} />
                      <div style={{ width: 10, height: 10, borderRadius: 5, background: '#27c93f' }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#8888aa' }}>{selectedSnippet.language}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedSnippet.code, selectedSnippet.id)}
                    className="sp-btn"
                    style={{
                      padding: '5px 10px', borderRadius: 6, border: 'none',
                      background: copiedId === selectedSnippet.id ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.08)',
                      color: copiedId === selectedSnippet.id ? '#4ade80' : '#aaaacc',
                      cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
                      fontFamily: 'inherit',
                    }}
                  >
                    {copiedId === selectedSnippet.id ? <Check size={12} /> : <Copy size={12} />}
                    {copiedId === selectedSnippet.id ? '已复制' : '复制代码'}
                  </button>
                </div>
                <pre style={{
                  margin: 0, padding: 20, overflow: 'auto', flex: 1,
                  fontSize: 13, lineHeight: 1.7, color: '#e0e0f0',
                  fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
                }}>
                  <code>{selectedSnippet.code}</code>
                </pre>
              </div>
            </div>
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: '#6666aa', textAlign: 'center',
            }}>
              <FileCode size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>选择一个代码片段</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>从左侧列表中选择，或创建自己的片段</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.06)',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#e0e0f0',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const primaryBtn: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 8, border: 'none',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
  flex: 1, justifyContent: 'center',
}

const secondaryBtn: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: '#aaaacc', cursor: 'pointer', fontSize: 13,
  fontFamily: 'inherit', flex: 1, justifyContent: 'center',
  display: 'flex', alignItems: 'center', gap: 6,
}