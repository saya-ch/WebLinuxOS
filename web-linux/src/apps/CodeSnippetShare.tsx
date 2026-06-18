import { useState, useCallback, useMemo, useRef } from 'react'
import { useStore } from '../store'

interface Snippet {
  id: string
  title: string
  description: string
  language: string
  code: string
  tags: string[]
  createdAt: number
}

const LANGUAGES: { value: string; label: string; icon: string; color: string }[] = [
  { value: 'javascript', label: 'JavaScript', icon: 'JS', color: '#f7df1e' },
  { value: 'typescript', label: 'TypeScript', icon: 'TS', color: '#3178c6' },
  { value: 'python', label: 'Python', icon: 'Py', color: '#3776ab' },
  { value: 'html', label: 'HTML', icon: '<>', color: '#e34f26' },
  { value: 'css', label: 'CSS', icon: '#', color: '#1572b6' },
  { value: 'java', label: 'Java', icon: 'Jv', color: '#ed8b00' },
  { value: 'go', label: 'Go', icon: 'Go', color: '#00add8' },
  { value: 'rust', label: 'Rust', icon: 'Rs', color: '#dea584' },
  { value: 'other', label: '其他', icon: '…', color: '#666666' },
]

const NOW = Date.now()

const PRESET_SNIPPETS: Snippet[] = [
  {
    id: 'preset-debounce',
    title: '防抖函数 (Debounce)',
    description: '限制函数触发频率，常用于搜索输入、窗口 resize 等场景',
    language: 'javascript',
    code: `function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 使用示例
const handleSearch = debounce((keyword) => {
  console.log('搜索:', keyword);
}, 500);`,
    tags: ['工具函数', '性能优化', 'JavaScript'],
    createdAt: NOW - 86400000 * 7,
  },
  {
    id: 'preset-throttle',
    title: '节流函数 (Throttle)',
    description: '确保函数在指定时间间隔内最多执行一次',
    language: 'javascript',
    code: `function throttle(fn, delay = 300) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn.apply(this, args);
    }
  };
}

// 使用示例
const onScroll = throttle(() => {
  console.log('滚动位置:', window.scrollY);
}, 200);`,
    tags: ['工具函数', '性能优化', 'JavaScript'],
    createdAt: NOW - 86400000 * 6,
  },
  {
    id: 'preset-deepcopy',
    title: '深拷贝 (Deep Clone)',
    description: '支持基本类型、对象、数组、Date、RegExp 的递归拷贝',
    language: 'javascript',
    code: `function deepClone(obj, map = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (map.has(obj)) return map.get(obj);

  const Constructor = obj.constructor;
  let clone;

  if (obj instanceof Date) {
    clone = new Date(obj.getTime());
  } else if (obj instanceof RegExp) {
    clone = new RegExp(obj.source, obj.flags);
  } else if (obj instanceof Map) {
    clone = new Map();
    obj.forEach((v, k) => clone.set(k, deepClone(v, map)));
  } else if (obj instanceof Set) {
    clone = new Set();
    obj.forEach(v => clone.add(deepClone(v, map)));
  } else if (Array.isArray(obj)) {
    clone = obj.map(item => deepClone(item, map));
  } else {
    clone = {};
  }

  map.set(obj, clone);

  for (const key of Object.keys(obj)) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key], map);
    }
  }

  return clone;
}`,
    tags: ['工具函数', 'JavaScript', '面试'],
    createdAt: NOW - 86400000 * 5,
  },
  {
    id: 'preset-unique',
    title: '数组去重',
    description: '多种方式实现数组去重，包含对象数组按字段去重',
    language: 'javascript',
    code: `// 方式1: Set (简单值去重)
const unique1 = (arr) => [...new Set(arr)];

// 方式2: filter + indexOf
const unique2 = (arr) =>
  arr.filter((item, index) => arr.indexOf(item) === index);

// 方式3: 对象数组按指定字段去重
const uniqueByKey = (arr, key) => {
  const seen = new Set();
  return arr.filter((item) => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

// 使用示例
console.log(unique1([1, 2, 2, 3, 3, 3])); // [1, 2, 3]
console.log(uniqueByKey(
  [{ id: 1 }, { id: 2 }, { id: 1 }],
  'id'
)); // [{ id: 1 }, { id: 2 }]`,
    tags: ['数组', 'JavaScript', '工具函数'],
    createdAt: NOW - 86400000 * 4,
  },
  {
    id: 'preset-fetch',
    title: 'Fetch 封装',
    description: '带超时、错误处理、自动 JSON 解析的 fetch 包装函数',
    language: 'javascript',
    code: `async function request(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 8000,
    ...rest
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      ...rest,
    });

    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }

    const contentType = res.headers.get('content-type') || '';
    return contentType.includes('application/json')
      ? res.json()
      : res.text();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('请求超时');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// 使用示例
request('/api/user', { method: 'POST', body: { name: 'Tom' } })
  .then(data => console.log(data))
  .catch(err => console.error(err));`,
    tags: ['网络', 'Fetch', 'JavaScript'],
    createdAt: NOW - 86400000 * 3,
  },
  {
    id: 'preset-py-readfile',
    title: 'Python 读取文件',
    description: '安全地读取大文件和按行读取的最佳实践',
    language: 'python',
    code: `# 方式1: 读取整个文件 (适合小文件)
with open('data.txt', 'r', encoding='utf-8') as f:
    content = f.read()
    print(content)

# 方式2: 逐行读取 (适合大文件，内存友好)
with open('large.txt', 'r', encoding='utf-8') as f:
    for line_no, line in enumerate(f, 1):
        print(f'{line_no}: {line.rstrip()}')

# 方式3: 读取所有行到列表
with open('data.txt', 'r', encoding='utf-8') as f:
    lines = [line.rstrip() for line in f]

# 方式4: 写入文件
with open('output.txt', 'w', encoding='utf-8') as f:
    f.write('第一行\\n')
    f.write('第二行\\n')

# 方式5: CSV 处理
import csv
with open('data.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(row)`,
    tags: ['Python', '文件操作'],
    createdAt: NOW - 86400000 * 2,
  },
  {
    id: 'preset-ts-types',
    title: 'TypeScript 工具类型',
    description: 'Partial、Required、Pick、Omit、Record 等常用工具类型',
    language: 'typescript',
    code: `interface User {
  id: number;
  name: string;
  email?: string;
  age: number;
}

// Partial: 所有字段变可选
type UserPartial = Partial<User>;
const u1: UserPartial = { name: 'Tom' };

// Required: 所有字段变必填
type UserRequired = Required<User>;

// Pick: 选择部分字段
type UserBasic = Pick<User, 'id' | 'name'>;
const u2: UserBasic = { id: 1, name: 'Tom' };

// Omit: 排除部分字段
type UserWithoutAge = Omit<User, 'age'>;

// Record: 键值对类型
type UserMap = Record<string, User>;
const users: UserMap = { '1': { id: 1, name: 'Tom', age: 20 } };

// Readonly: 只读
type ReadonlyUser = Readonly<User>;

// ReturnType: 获取函数返回类型
function createUser(): User {
  return { id: 1, name: 'Tom', age: 20 };
}
type UserResult = ReturnType<typeof createUser>;`,
    tags: ['TypeScript', '类型', '工具'],
    createdAt: NOW - 86400000,
  },
  {
    id: 'preset-css-flex',
    title: 'CSS Flex 布局',
    description: 'Flexbox 常用布局模式速查',
    language: 'css',
    code: `/* 基础容器 */
.flex-container {
  display: flex;
  flex-direction: row;          /* row | row-reverse | column | column-reverse */
  justify-content: center;      /* flex-start | flex-end | center | space-between | space-around | space-evenly */
  align-items: center;          /* flex-start | flex-end | center | stretch | baseline */
  flex-wrap: wrap;              /* nowrap | wrap | wrap-reverse */
  gap: 12px;
}

/* 子项常用属性 */
.flex-item {
  flex: 1;                      /* 等于 flex-grow: 1; flex-shrink: 1; flex-basis: 0%; */
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 200px;
  align-self: center;
  order: 1;
}

/* 经典布局: 上下居中 */
.center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

/* 经典布局: 两端对齐 */
.space-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 经典布局: 自适应列 */
.grid-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.grid-flex > * {
  flex: 1 1 250px;
}`,
    tags: ['CSS', '布局', 'Flexbox'],
    createdAt: NOW,
  },
]

const STORAGE_KEY = 'weblinux-codesnippet-share-v1'

function loadSnippets(): Snippet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return PRESET_SNIPPETS
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
    return PRESET_SNIPPETS
  } catch {
    return PRESET_SNIPPETS
  }
}

function isPreset(id: string): boolean {
  return id.startsWith('preset-')
}

const CodeSnippetShare = function () {
  const theme = useStore((s) => s.theme)
  const addNotification = useStore((s) => s.addNotification)

  const [snippets, setSnippets] = useState<Snippet[]>(loadSnippets)
  const [searchQuery, setSearchQuery] = useState('')
  const [langFilter, setLangFilter] = useState<string>('all')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    language: 'javascript',
    code: '',
    tags: '',
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const persist = useCallback((next: Snippet[]) => {
    setSnippets(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    snippets.forEach((s) => s.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [snippets])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return snippets
      .filter((s) => {
        if (langFilter !== 'all' && s.language !== langFilter) return false
        if (activeTags.length > 0) {
          const ok = activeTags.every((t) => s.tags.includes(t))
          if (!ok) return false
        }
        if (q) {
          const hay =
            s.title.toLowerCase() +
            ' ' +
            s.description.toLowerCase() +
            ' ' +
            s.code.toLowerCase() +
            ' ' +
            s.tags.join(' ').toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [snippets, searchQuery, langFilter, activeTags])

  const resetForm = () => {
    setForm({ title: '', description: '', language: 'javascript', code: '', tags: '' })
    setEditingId(null)
  }

  const openCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (snippet: Snippet) => {
    setForm({
      title: snippet.title,
      description: snippet.description,
      language: snippet.language,
      code: snippet.code,
      tags: snippet.tags.join(', '),
    })
    setEditingId(snippet.id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const title = form.title.trim()
    const code = form.code.trim()
    if (!title || !code) {
      addNotification({ title: '提示', message: '请填写标题和代码内容', type: 'warning' })
      return
    }
    const tags = form.tags
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)

    if (editingId) {
      const next = snippets.map((s) =>
        s.id === editingId
          ? { ...s, title, description: form.description.trim(), language: form.language, code: form.code, tags }
          : s
      )
      persist(next)
      addNotification({ title: '成功', message: '代码片段已更新', type: 'success' })
    } else {
      const newItem: Snippet = {
        id: 'snippet-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        title,
        description: form.description.trim(),
        language: form.language,
        code: form.code,
        tags,
        createdAt: Date.now(),
      }
      persist([newItem, ...snippets])
      addNotification({ title: '成功', message: '代码片段已创建', type: 'success' })
    }
    setShowForm(false)
    resetForm()
  }

  const handleDelete = (id: string) => {
    if (!confirm('确定删除该代码片段？此操作不可撤销。')) return
    persist(snippets.filter((s) => s.id !== id))
    addNotification({ title: '已删除', message: '代码片段已删除', type: 'info' })
  }

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      addNotification({ title: '已复制', message: '代码已复制到剪贴板', type: 'success' })
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        addNotification({ title: '已复制', message: '代码已复制到剪贴板', type: 'success' })
      } catch {
        addNotification({ title: '复制失败', message: '浏览器不支持复制操作', type: 'error' })
      }
      document.body.removeChild(ta)
    }
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(snippets, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    a.download = `code-snippets-${stamp}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addNotification({ title: '已导出', message: `共 ${snippets.length} 个片段`, type: 'success' })
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || '[]'))
        if (!Array.isArray(data)) throw new Error('格式错误')
        const validated: Snippet[] = data
          .map((raw: any) => {
            if (!raw || typeof raw !== 'object') return null
            const tags = Array.isArray(raw.tags) ? raw.tags.filter((t: any) => typeof t === 'string') : []
            return {
              id: String(raw.id || `import-${Date.now()}-${Math.random()}`),
              title: String(raw.title || '未命名片段'),
              description: String(raw.description || ''),
              language: String(raw.language || 'other'),
              code: String(raw.code || ''),
              tags,
              createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
            }
          })
          .filter((s: Snippet | null): s is Snippet => Boolean(s && s.title && s.code))
        if (validated.length === 0) {
          addNotification({ title: '导入失败', message: '文件中没有有效的代码片段', type: 'error' })
          return
        }
        const existingIds = new Set(snippets.map((s) => s.id))
        const merged: Snippet[] = [
          ...snippets,
          ...validated.map((s) => (existingIds.has(s.id) ? { ...s, id: s.id + '-imp-' + Date.now() } : s)),
        ]
        persist(merged)
        addNotification({ title: '已导入', message: `成功导入 ${validated.length} 个片段`, type: 'success' })
      } catch (err) {
        addNotification({ title: '导入失败', message: '文件格式不是合法的 JSON', type: 'error' })
      }
    }
    reader.onerror = () => {
      addNotification({ title: '导入失败', message: '无法读取文件', type: 'error' })
    }
    reader.readAsText(file)
  }

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const clearFilters = () => {
    setSearchQuery('')
    setLangFilter('all')
    setActiveTags([])
  }

  const resetToPresets = () => {
    if (!confirm('确定重置为预设片段？将清除所有自定义内容。')) return
    persist(PRESET_SNIPPETS)
    setActiveTags([])
    addNotification({ title: '已重置', message: '已恢复为预设片段', type: 'info' })
  }

  const isDark = theme === 'dark'

  const colors = {
    bg: isDark ? '#1a1d24' : '#f7f8fa',
    panel: isDark ? '#242832' : '#ffffff',
    border: isDark ? '#353a47' : '#e4e7eb',
    textPrimary: isDark ? '#e6e8ef' : '#1f2328',
    textSecondary: isDark ? '#9ba3b4' : '#5f6b7a',
    textMuted: isDark ? '#6b7386' : '#8a94a4',
    accent: '#4f7cff',
    accentHover: '#3e6ae0',
    accentBg: isDark ? 'rgba(79, 124, 255, 0.12)' : 'rgba(79, 124, 255, 0.08)',
    success: '#38c172',
    danger: '#ef4444',
    warning: '#f59e0b',
    inputBg: isDark ? '#1a1d24' : '#f7f8fa',
    codeBg: isDark ? '#0f1218' : '#1e222c',
    codeText: '#e6e8ef',
  }

  const langMeta = (lang: string) => {
    return LANGUAGES.find((l) => l.value === lang) || LANGUAGES[LANGUAGES.length - 1]
  }

  const fmtDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      style={{
        height: '100%',
        background: colors.bg,
        color: colors.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      }}
    >
      {/* 顶部栏 */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid ' + colors.border,
          background: colors.panel,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: '16px', fontWeight: 600, marginRight: '8px' }}>📚 代码片段分享</div>
        <div
          style={{
            fontSize: '12px',
            color: colors.textSecondary,
            padding: '3px 8px',
            background: colors.accentBg,
            borderRadius: '10px',
          }}
        >
          共 {snippets.length} 个
        </div>

        <div style={{ flex: 1 }} />

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索标题、描述、代码、标签..."
          style={{
            width: '260px',
            padding: '7px 12px',
            borderRadius: '6px',
            border: '1px solid ' + colors.border,
            background: colors.inputBg,
            color: colors.textPrimary,
            fontSize: '13px',
            outline: 'none',
          }}
        />
        <button
          onClick={openCreate}
          style={{
            padding: '7px 14px',
            borderRadius: '6px',
            border: 'none',
            background: colors.accent,
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          + 新建
        </button>
        <button
          onClick={handleExport}
          style={{
            padding: '7px 12px',
            borderRadius: '6px',
            border: '1px solid ' + colors.border,
            background: 'transparent',
            color: colors.textPrimary,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          导出 JSON
        </button>
        <button
          onClick={handleImportClick}
          style={{
            padding: '7px 12px',
            borderRadius: '6px',
            border: '1px solid ' + colors.border,
            background: 'transparent',
            color: colors.textPrimary,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          导入 JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          onClick={resetToPresets}
          style={{
            padding: '7px 12px',
            borderRadius: '6px',
            border: '1px solid ' + colors.border,
            background: 'transparent',
            color: colors.textSecondary,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          重置预设
        </button>
      </div>

      {/* 过滤器栏 */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid ' + colors.border,
          background: colors.panel,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: colors.textSecondary, marginRight: '4px' }}>语言：</span>
          <button
            onClick={() => setLangFilter('all')}
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              border: '1px solid ' + (langFilter === 'all' ? colors.accent : colors.border),
              background: langFilter === 'all' ? colors.accentBg : 'transparent',
              color: langFilter === 'all' ? colors.accent : colors.textPrimary,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            全部
          </button>
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              onClick={() => setLangFilter(l.value)}
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                border: '1px solid ' + (langFilter === l.value ? colors.accent : colors.border),
                background: langFilter === l.value ? colors.accentBg : 'transparent',
                color: langFilter === l.value ? colors.accent : colors.textPrimary,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>

        {allTags.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: colors.textSecondary, marginRight: '4px' }}>标签：</span>
            {allTags.map((tag) => {
              const active = activeTags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '10px',
                    border: '1px solid ' + (active ? colors.accent : colors.border),
                    background: active ? colors.accentBg : 'transparent',
                    color: active ? colors.accent : colors.textSecondary,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  #{tag}
                </button>
              )
            })}
            {(activeTags.length > 0 || langFilter !== 'all' || searchQuery) && (
              <button
                onClick={clearFilters}
                style={{
                  padding: '3px 10px',
                  borderRadius: '10px',
                  border: '1px solid ' + colors.danger,
                  background: 'transparent',
                  color: colors.danger,
                  fontSize: '12px',
                  cursor: 'pointer',
                  marginLeft: '6px',
                }}
              >
                清除筛选
              </button>
            )}
          </div>
        )}
      </div>

      {/* 卡片列表 */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px',
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: colors.textMuted,
              fontSize: '14px',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
            <div>暂无匹配的代码片段</div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: colors.textMuted }}>
              尝试调整筛选条件或点击"新建"添加自己的代码片段
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '16px',
            }}
          >
            {filtered.map((s) => {
              const meta = langMeta(s.language)
              return (
                <div
                  key={s.id}
                  style={{
                    background: colors.panel,
                    border: '1px solid ' + colors.border,
                    borderRadius: '10px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = isDark
                      ? '0 6px 18px rgba(0,0,0,0.35)'
                      : '0 6px 18px rgba(0,0,0,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid ' + colors.border,
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: meta.color + (isDark ? '33' : '22'),
                            color: meta.color,
                            letterSpacing: '0.5px',
                            flexShrink: 0,
                          }}
                        >
                          {meta.icon}
                        </span>
                        <span
                          style={{
                            fontSize: '12px',
                            color: colors.textSecondary,
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                          }}
                        >
                          {meta.label}
                        </span>
                        {isPreset(s.id) && (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: colors.accentBg,
                              color: colors.accent,
                            }}
                          >
                            预设
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: colors.textPrimary,
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {s.title}
                      </div>
                      {s.description && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: colors.textSecondary,
                            lineHeight: 1.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {s.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <pre
                    style={{
                      margin: 0,
                      padding: '14px 16px',
                      background: colors.codeBg,
                      color: colors.codeText,
                      fontFamily:
                        '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                      fontSize: '12.5px',
                      lineHeight: 1.6,
                      whiteSpace: 'pre',
                      overflow: 'auto',
                      maxHeight: '220px',
                      borderTop: '1px solid ' + colors.border,
                      borderBottom: '1px solid ' + colors.border,
                    }}
                  >
                    <code>{s.code}</code>
                  </pre>

                  {s.tags.length > 0 && (
                    <div
                      style={{
                        padding: '10px 16px 4px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                      }}
                    >
                      {s.tags.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '8px',
                            background: colors.inputBg,
                            color: colors.textSecondary,
                            border: '1px solid ' + colors.border,
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 'auto',
                      background: colors.inputBg,
                      borderTop: '1px solid ' + colors.border,
                    }}
                  >
                    <span style={{ fontSize: '11px', color: colors.textMuted }}>创建于 {fmtDate(s.createdAt)}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleCopy(s.code)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '5px',
                          border: '1px solid ' + colors.border,
                          background: 'transparent',
                          color: colors.textPrimary,
                          fontSize: '11.5px',
                          cursor: 'pointer',
                        }}
                      >
                        📋 复制
                      </button>
                      {!isPreset(s.id) && (
                        <>
                          <button
                            onClick={() => openEdit(s)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '5px',
                              border: '1px solid ' + colors.border,
                              background: 'transparent',
                              color: colors.textPrimary,
                              fontSize: '11.5px',
                              cursor: 'pointer',
                            }}
                          >
                            ✏️ 编辑
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '5px',
                              border: '1px solid ' + colors.border,
                              background: 'transparent',
                              color: colors.danger,
                              fontSize: '11.5px',
                              cursor: 'pointer',
                            }}
                          >
                            🗑️ 删除
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 新建/编辑弹窗 */}
      {showForm && (
        <div
          onClick={() => {
            setShowForm(false)
            resetForm()
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              background: colors.panel,
              border: '1px solid ' + colors.border,
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid ' + colors.border,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 600 }}>
                {editingId ? '编辑代码片段' : '创建代码片段'}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.textSecondary,
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '6px', color: colors.textSecondary }}>
                  标题 <span style={{ color: colors.danger }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="为代码片段起个名字"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid ' + colors.border,
                    background: colors.inputBg,
                    color: colors.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '6px', color: colors.textSecondary }}>
                  描述（可选）
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="简要说明该代码片段的用途"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid ' + colors.border,
                    background: colors.inputBg,
                    color: colors.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '6px', color: colors.textSecondary }}>
                    语言
                  </label>
                  <select
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid ' + colors.border,
                      background: colors.inputBg,
                      color: colors.textPrimary,
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '6px', color: colors.textSecondary }}>
                  标签（英文或中文逗号分隔，可选）
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="例如：工具函数, JavaScript, 面试"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid ' + colors.border,
                    background: colors.inputBg,
                    color: colors.textPrimary,
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '6px', color: colors.textSecondary }}>
                  代码 <span style={{ color: colors.danger }}>*</span>
                </label>
                <textarea
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="在此粘贴或编写代码..."
                  spellCheck={false}
                  style={{
                    width: '100%',
                    minHeight: '220px',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid ' + colors.border,
                    background: colors.codeBg,
                    color: colors.codeText,
                    fontFamily:
                      '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                    fontSize: '12.5px',
                    lineHeight: 1.6,
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box',
                    whiteSpace: 'pre',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid ' + colors.border,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                background: colors.inputBg,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid ' + colors.border,
                  background: 'transparent',
                  color: colors.textPrimary,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  background: colors.accent,
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {editingId ? '保存修改' : '创建'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default CodeSnippetShare
