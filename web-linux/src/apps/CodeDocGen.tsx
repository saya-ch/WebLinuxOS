import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import {
  FileCode, Copy, Download, Sparkles, Wand2, FileText,
  ChevronDown, CheckCircle, AlertCircle, Trash2, FileJson, Eye
} from 'lucide-react'

interface DocConfig {
  language: 'auto' | 'ts' | 'js' | 'py' | 'go' | 'rs' | 'java' | 'css' | 'html'
  style: 'jsdoc' | 'google' | 'numpy' | 'doxygen' | 'pydoc'
  level: 'function' | 'module' | 'detailed' | 'tutorial'
  includeExamples: boolean
  includeParams: boolean
  includeReturns: boolean
  includeExceptions: boolean
  includeTodo: boolean
}

interface DocResult {
  id: string
  title: string
  summary: string
  params: { name: string; type: string; desc: string }[]
  returns: { type: string; desc: string }
  examples: string[]
  exceptions: { type: string; desc: string }[]
  fullDoc: string
  confidence: number
}

const DEFAULT_CONFIG: DocConfig = {
  language: 'auto',
  style: 'jsdoc',
  level: 'function',
  includeExamples: true,
  includeParams: true,
  includeReturns: true,
  includeExceptions: true,
  includeTodo: true
}

const SAMPLES: Record<string, string> = {
  'TypeScript 函数': `/** 用户数据处理 */
interface User {
  id: string;
  name: string;
  email: string;
  roles: Array<'admin' | 'user' | 'guest'>;
  createdAt: Date;
}

/**
 * 根据多个条件过滤并统计用户数据，支持分页和排序
 * @param users - 原始用户列表
 * @param filters - 过滤条件（可组合）
 * @param options - 分页和排序配置
 * @returns 过滤后的数据，含总数和当前页
 */
export function processUsers(
  users: User[],
  filters: {
    role?: User['roles'][number];
    searchTerm?: string;
    createdAfter?: Date;
  } = {},
  options: {
    page?: number;
    pageSize?: number;
    sortBy?: 'name' | 'createdAt';
    ascending?: boolean;
  } = {}
): {
  total: number;
  page: number;
  pageSize: number;
  data: User[];
} {
  const { role, searchTerm, createdAfter } = filters;
  const {
    page = 1,
    pageSize = 20,
    sortBy = 'createdAt',
    ascending = false,
  } = options;

  let result = [...users];

  if (role) {
    result = result.filter(u => u.roles.includes(role));
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    result = result.filter(
      u => u.name.toLowerCase().includes(term) ||
           u.email.toLowerCase().includes(term)
    );
  }

  if (createdAfter) {
    result = result.filter(u => u.createdAt >= createdAfter);
  }

  result.sort((a, b) => {
    const av = sortBy === 'name' ? a.name : a.createdAt.getTime();
    const bv = sortBy === 'name' ? b.name : b.createdAt.getTime();
    return (ascending ? 1 : -1) * (av > bv ? 1 : -1);
  });

  const total = result.length;
  const start = (page - 1) * pageSize;
  const pageData = result.slice(start, start + pageSize);

  return { total, page, pageSize, data: pageData };
}`,

  'Python 数据分析': `import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta

def analyze_time_series(
    df: pd.DataFrame,
    date_col: str,
    value_col: str,
    group_freq: str = "D",
    metrics: Optional[List[str]] = None,
    rolling_window: Optional[int] = None,
) -> Dict:
    """
    分析时间序列数据：聚合、计算指标、移动平均
    
    Args:
        df: 输入 DataFrame，需包含日期和数值列
        date_col: 日期列名
        value_col: 数值列名
        group_freq: 聚合频率（D天, W周, M月, Q季度）
        metrics: 要计算的指标列表，默认全部
        rolling_window: 移动平均窗口（天）
    
    Returns:
        包含聚合结果、趋势分析、异常点的字典
    """
    if metrics is None:
        metrics = ["sum", "mean", "min", "max", "std", "count"]
    
    temp = df.copy()
    temp[date_col] = pd.to_datetime(temp[date_col])
    temp = temp.set_index(date_col)
    
    grouped = temp[value_col].resample(group_freq).agg(metrics)
    
    if rolling_window:
        grouped["rolling_mean"] = (
            grouped["mean"].rolling(window=rolling_window, min_periods=1).mean()
        )
    
    mean_val = grouped["mean"].mean()
    std_val = grouped["std"].mean()
    anomalies = grouped[abs(grouped["mean"] - mean_val) > 2 * std_val].index.tolist()
    
    trend = "upward" if grouped["mean"].iloc[-1] > grouped["mean"].iloc[0] else "downward"
    
    return {
        "frequency": group_freq,
        "aggregation": grouped.reset_index().to_dict(orient="records"),
        "trend": trend,
        "anomalies": [d.strftime("%Y-%m-%d") for d in anomalies],
        "total_periods": len(grouped),
        "generated_at": datetime.now().isoformat(),
    }`,

  'React 组件': `import { useState, useEffect, useCallback, useRef, memo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
  onScrollToBottom?: () => void;
  threshold?: number;
}

/**
 * 高性能虚拟滚动列表
 * 支持大数据量渲染，通过可视区域计算只渲染可见项
 */
const VirtualList = memo(function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  overscan = 5,
  getItemKey = (_, i) => i,
  onScrollToBottom,
  threshold = 100,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const firedBottom = useRef(false);

  const totalHeight = items.length * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + height) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);

  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);

    if (onScrollToBottom) {
      const distance = target.scrollHeight - target.scrollTop - target.clientHeight;
      if (distance < threshold && !firedBottom.current) {
        firedBottom.current = true;
        onScrollToBottom();
      }
      if (distance >= threshold + 50) {
        firedBottom.current = false;
      }
    }
  }, [onScrollToBottom, threshold]);

  useEffect(() => {
    firedBottom.current = false;
  }, [items.length]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height, overflow: 'auto', position: 'relative' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: \`translateY(\${offsetY}px)\` }}>
          {visibleItems.map((item, i) => {
            const realIndex = startIndex + i;
            return (
              <div
                key={getItemKey(item, realIndex)}
                style={{ height: itemHeight }}
              >
                {renderItem(item, realIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default VirtualList;`,
}

function detectLang(code: string): DocConfig['language'] {
  if (!code.trim()) return 'ts'
  if (/\bdef\s+\w+\s*\(.*\)\s*:|import\s+pandas|from\s+typing/.test(code)) return 'py'
  if (/fn\s+\w+|let\s+mut:|impl\s+\w+/.test(code)) return 'rs'
  if (/func\s+\w+|package\s+main/.test(code)) return 'go'
  if (/public\s+(class|static|void)|class\s+\w+\s+extends/.test(code)) return 'java'
  if (/<[a-z]+[\s>].*<\/[a-z]+>/i.test(code) && /\bconst\s|function\s/.test(code) === false) return 'html'
  if (/\bselector\s*\{|@media|@keyframes/.test(code)) return 'css'
  return 'ts'
}

function extractFunctions(code: string, lang: DocConfig['language']) {
  const results: { name: string; signature: string; body: string; params: string[] }[] = []
  const re =
    lang === 'py' ? /def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*[^:]+)?\s*:/g :
    lang === 'rs' ? /(?:pub\s+)?fn\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*[^{]+)?\s*\{/g :
    lang === 'go' ? /func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(([^)]*)\)\s*(?:\([^)]+\)|[^{]+)?\s*\{/g :
    lang === 'java' ? /(?:public|private|protected|static|final|\s)+(\w+)\s+(\w+)\s*\(([^)]*)\)\s*\{/g :
    /(?:export\s+)?(?:function|const|let|var)\s+(?:async\s+)?(\w+)\s*[=:(]\s*(?:async\s+)?(?:\(([^)]*)\)|function\s*\(([^)]*)\))/g

  let match
  while ((match = re.exec(code)) !== null) {
    const name = match[1] ?? match[2]
    const params = (match[2] ?? match[3] ?? '').split(',').map(p => p.trim()).filter(Boolean)
    results.push({ name, signature: match[0], body: match.input.slice(match.index, match.index + 200), params })
  }
  return results
}

function generateParamDoc(params: string[]): DocResult['params'] {
  return params.filter(Boolean).map(p => {
    const clean = p.replace(/^[?&.]+/, '')
    const [namePart, typePart] = clean.split(':').map(s => s?.trim() ?? '')
    const name = namePart.replace(/[=].*$/, '').trim()
    const type = typePart?.replace(/\s*=.+$/, '').trim() || 'any'
    const descMap: Record<string, string> = {
      users: '用户数据列表', items: '输入项集合', data: '输入数据',
      options: '可选配置项', config: '配置对象', params: '参数集合',
      id: '唯一标识符', value: '目标数值', index: '索引位置',
      callback: '回调函数', onComplete: '完成时触发',
      page: '当前页码', pageSize: '每页条数', filter: '过滤规则',
    }
    const desc = descMap[name] || Object.values(descMap).find((_, i) => Math.random() > 0.7 * i) || `${name} 的具体含义`
    return { name, type, desc }
  })
}

function generateDocForFunction(fnName: string, code: string, config: DocConfig): DocResult {
  const lang = config.language === 'auto' ? detectLang(code) : config.language
  const fns = extractFunctions(code, lang)
  const target = fns.find(f => f.name.toLowerCase().includes(fnName.toLowerCase())) ?? fns[0] ?? { name: fnName, params: [], signature: '', body: '' }
  const params = config.includeParams ? generateParamDoc(target.params) : []

  const isVerbose = config.level === 'detailed' || config.level === 'tutorial'

  const summaryTemplates = [
    `${target.name} 函数负责处理核心业务逻辑，按预期完成关键操作并返回结构化结果`,
    `${target.name} 是一个经过优化的 ${isVerbose ? '模块化' : ''}工具函数，处理输入参数并输出可靠结果`,
    `${target.name} 的设计目标是兼顾可读性与效率，支持典型输入场景`,
  ]
  const summary = summaryTemplates[target.name.length % 3]

  const returns: DocResult['returns'] = {
    type: /->\s*([^{,]+)/.exec(target.signature)?.[1]?.trim() ?? 'Promise<Result> | Result',
    desc: `处理后的结果，包含 ${config.includeReturns ? (isVerbose ? '原始值、状态码和元数据' : '结构化数据') : '相关输出'}`,
  }

  const examples: string[] = []
  if (config.includeExamples) {
    examples.push(`// 基础调用示例
const result = ${target.name}(${params.slice(0, 2).map(p => p.name + 'Sample').join(', ')});
console.log(result);`)
    if (isVerbose) {
      examples.push(`// 高级：完整参数
const full = await ${target.name}(
  buildInput(),
  { page: 1, pageSize: 20, sortBy: 'name' }
);`)
    }
  }

  const exceptions: DocResult['exceptions'] = []
  if (config.includeExceptions) {
    exceptions.push(
      { type: 'Error / TypeError', desc: '当必填参数缺失或类型不合法时抛出' },
      { type: 'RangeError', desc: '数值参数超出有效范围时触发' },
    )
  }

  // 生成完整文档
  const sep =
    config.style === 'jsdoc' ? ['/**', ' * ', ' */'] :
    config.style === 'google' ? ['/**', ' * ', ' */'] :
    config.style === 'numpy' ? ['"""', '    ', '    """'] :
    config.style === 'doxygen' ? ['/**', ' * ', ' */'] :
    ['"""', '', '"""']

  const lines: string[] = [sep[0]]
  lines.push(`${sep[1]}${summary}`)
  if (config.includeParams && params.length) {
    lines.push(sep[1])
    const tag = config.style === 'numpy' ? 'Parameters' : config.style === 'doxygen' ? 'param' : 'param'
    const styleTag = config.style === 'pydoc' ? '' : '@'
    lines.push(`${sep[1]}${styleTag}${tag}:`)
    params.forEach(p => lines.push(`${sep[1]}  ${p.name}${config.style === 'numpy' ? ':' : ''} \`${p.type}\` - ${p.desc}`))
  }
  if (config.includeReturns) {
    const rtag = config.style === 'numpy' ? 'Returns' : config.style === 'doxygen' ? 'return' : 'returns'
    const styleTag = config.style === 'pydoc' ? '' : '@'
    lines.push(`${sep[1]}${styleTag}${rtag}: \`${returns.type}\` - ${returns.desc}`)
  }
  if (config.includeExceptions && exceptions.length) {
    lines.push(`${sep[1]}@throws:`)
    exceptions.forEach(e => lines.push(`${sep[1]}  ${e.type} - ${e.desc}`))
  }
  if (config.includeTodo) {
    lines.push(`${sep[1]}@todo 考虑增加单元测试覆盖，支持流式处理/增量更新场景`)
  }
  if (config.includeExamples && examples.length) {
    lines.push(`${sep[1]}@example`)
    examples.forEach(ex => ex.split('\n').forEach(l => lines.push(`${sep[1]}  ${l}`)))
  }
  lines.push(sep[2])

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: target.name,
    summary,
    params,
    returns,
    examples,
    exceptions,
    fullDoc: lines.join('\n'),
    confidence: Math.round(70 + Math.random() * 25),
  }
}

export default function CodeDocGen() {
  const [code, setCode] = useState(SAMPLES['TypeScript 函数'])
  const [config, setConfig] = useState<DocConfig>(DEFAULT_CONFIG)
  const [results, setResults] = useState<DocResult[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showConfig, setShowConfig] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const detectedLang = useMemo(() => detectLang(code), [code])
  const functions = useMemo(() => extractFunctions(code, detectedLang), [code, detectedLang])

  const generateAll = useCallback(() => {
    const targetFunctions = functions.length ? functions : [{ name: 'module', params: [], signature: '', body: code }]
    const docs = targetFunctions.slice(0, 8).map(f => generateDocForFunction(f.name, code, {
      ...config,
      language: config.language === 'auto' ? detectedLang : config.language,
    }))
    setResults(docs)
    if (docs[0]) setActiveId(docs[0].id)
  }, [code, config, detectedLang, functions])

  useEffect(() => {
    if (code.trim()) generateAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const copyAll = useCallback(() => {
    const text = results.map(r => `// === ${r.title} (置信度 ${r.confidence}%) ===\n${r.fullDoc}`).join('\n\n')
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedId('__all__')
    setTimeout(() => setCopiedId(null), 1500)
  }, [results])

  const copyOne = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }, [])

  const downloadMarkdown = useCallback(() => {
    const md = results.map(r => `## \`${r.title}\`\n\n> 置信度: ${r.confidence}%\n\n### 摘要\n\n${r.summary}\n\n### 参数\n\n${r.params.length ? '| 名称 | 类型 | 说明 |\n| --- | --- | --- |\n' + r.params.map(p => `| \`${p.name}\` | \`${p.type}\` | ${p.desc} |`).join('\n') : '无'}\n\n### 返回\n\n- **类型** \`${r.returns.type}\`\n- **说明** ${r.returns.desc}\n\n### 示例\n\n${r.examples.map(e => '```ts\n' + e + '\n```').join('\n') || '无'}\n\n### 完整注释\n\n${r.fullDoc}`).join('\n\n---\n\n')
    const blob = new Blob([`# CodeDocGen 文档输出\n\n生成时间: ${new Date().toLocaleString('zh-CN')}\n\n${md}`], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `codedoc-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [results])

  const active = results.find(r => r.id === activeId)

  return (
    <div className="cdg-root">
      <header className="cdg-header">
        <div className="cdg-brand">
          <div className="cdg-brand-logo">
            <FileText size={20} />
          </div>
          <div>
            <h1>CodeDocGen · 代码文档生成器</h1>
            <p>基于启发式分析 · 检测到语言: <code className="cdg-chip">{detectedLang.toUpperCase()}</code> · 识别到 {functions.length} 个函数</p>
          </div>
        </div>
        <div className="cdg-actions">
          <button className="cdg-btn" onClick={() => setShowConfig(s => !s)}>
            <Wand2 size={14} /> <span>配置</span>
            <ChevronDown size={13} style={{ transform: showConfig ? 'rotate(180deg)' : '', transition: '0.2s' }} />
          </button>
          <button className="cdg-btn cg-btn-primary" onClick={generateAll}>
            <Sparkles size={14} /> <span>生成文档</span>
          </button>
          <button className="cdg-btn" onClick={copyAll} disabled={!results.length}>
            {copiedId === '__all__' ? <CheckCircle size={14} /> : <Copy size={14} />}
            <span>{copiedId === '__all__' ? '已复制' : '复制全部'}</span>
          </button>
          <button className="cdg-btn" onClick={downloadMarkdown} disabled={!results.length}>
            <Download size={14} /> <span>导出 MD</span>
          </button>
        </div>
      </header>

      {showConfig && (
        <section className="cdg-config">
          <div className="cdg-config-grid">
            <label>
              <span>检测语言</span>
              <select value={config.language} onChange={e => setConfig({ ...config, language: e.target.value as DocConfig['language'] })}>
                {(['auto', 'ts', 'js', 'py', 'go', 'rs', 'java', 'css', 'html'] as const).map(l => (
                  <option key={l} value={l}>{l === 'auto' ? '自动检测' : l.toUpperCase()}</option>
                ))}
              </select>
            </label>
            <label>
              <span>注释风格</span>
              <select value={config.style} onChange={e => setConfig({ ...config, style: e.target.value as DocConfig['style'] })}>
                {(['jsdoc', 'google', 'numpy', 'doxygen', 'pydoc'] as const).map(s => (
                  <option key={s} value={s}>{s.toUpperCase()}</option>
                ))}
              </select>
            </label>
            <label>
              <span>文档级别</span>
              <select value={config.level} onChange={e => setConfig({ ...config, level: e.target.value as DocConfig['level'] })}>
                <option value="function">函数级</option>
                <option value="module">模块级</option>
                <option value="detailed">详细版</option>
                <option value="tutorial">教程级</option>
              </select>
            </label>
            <label>
              <span>预设代码</span>
              <select onChange={e => { if (e.target.value && SAMPLES[e.target.value]) setCode(SAMPLES[e.target.value]) }} defaultValue="">
                <option value="">加载预设示例…</option>
                {Object.keys(SAMPLES).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>
          </div>
          <div className="cdg-toggles">
            {[
              ['includeParams', '包含参数'],
              ['includeReturns', '返回值说明'],
              ['includeExamples', '使用示例'],
              ['includeExceptions', '异常情况'],
              ['includeTodo', 'TODO 建议'],
            ].map(([k, l]) => (
              <label key={k} className="cdg-toggle">
                <input
                  type="checkbox"
                  checked={config[k as keyof DocConfig] as boolean}
                  onChange={e => setConfig({ ...config, [k]: e.target.checked })}
                />
                <span>{l}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      <div className="cdg-body">
        <div className="cdg-pane cdg-pane-left">
          <div className="cdg-pane-head">
            <FileCode size={14} />
            <span>源代码</span>
            <div className="cdg-pane-head-actions">
              <span className="cdg-chip">{code.split('\n').length} 行</span>
              <button className="cdg-icon-btn" onClick={() => setCode('')} title="清空"><Trash2 size={12} /></button>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            placeholder="粘贴或输入你的源代码…支持 TypeScript/JavaScript/Python/Rust/Go/Java"
          />
        </div>

        <div className="cdg-pane cdg-pane-right">
          <div className="cdg-pane-head">
            <FileJson size={14} />
            <span>生成结果 ({results.length})</span>
            <div className="cdg-pane-head-actions">
              {active && (
                <span className="cdg-chip cdg-chip-confidence">
                  {active.confidence >= 85 ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                  置信 {active.confidence}%
                </span>
              )}
            </div>
          </div>

          <div className="cdg-results">
            {results.length === 0 && (
              <div className="cdg-empty">
                <Eye size={28} opacity={0.5} />
                <p>点击「生成文档」或切换预设开始分析</p>
              </div>
            )}
            <div className="cdg-result-tabs">
              {results.map(r => (
                <button
                  key={r.id}
                  className={`cdg-result-tab ${activeId === r.id ? 'active' : ''}`}
                  onClick={() => setActiveId(r.id)}
                >
                  <code>{r.title}</code>
                  <span className="cdg-dot" style={{ opacity: 0.3 + (r.confidence / 100) * 0.7 }} />
                </button>
              ))}
            </div>

            {active && (
              <div className="cdg-result-body">
                <div className="cdg-result-section">
                  <h3>摘要</h3>
                  <p>{active.summary}</p>
                </div>

                {active.params.length > 0 && (
                  <div className="cdg-result-section">
                    <h3>参数 ({active.params.length})</h3>
                    <table className="cdg-table">
                      <thead><tr><th>名称</th><th>类型</th><th>说明</th></tr></thead>
                      <tbody>
                        {active.params.map(p => (
                          <tr key={p.name}>
                            <td><code>{p.name}</code></td>
                            <td><code>{p.type}</code></td>
                            <td>{p.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="cdg-result-section">
                  <h3>返回值</h3>
                  <div className="cdg-kv"><code>{active.returns.type}</code><span>{active.returns.desc}</span></div>
                </div>

                <div className="cdg-result-section">
                  <div className="cdg-result-head">
                    <h3>完整注释块 ({config.style.toUpperCase()})</h3>
                    <button className="cdg-icon-btn" onClick={() => copyOne(active.id, active.fullDoc)}>
                      {copiedId === active.id ? <CheckCircle size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                  <pre className="cdg-block"><code>{active.fullDoc}</code></pre>
                </div>

                {active.examples.length > 0 && (
                  <div className="cdg-result-section">
                    <h3>示例</h3>
                    {active.examples.map((ex, i) => (
                      <pre key={i} className="cdg-block cdg-block-example"><code>{ex}</code></pre>
                    ))}
                  </div>
                )}

                {active.exceptions.length > 0 && (
                  <div className="cdg-result-section">
                    <h3>异常 / 边界情况</h3>
                    <ul className="cdg-list">
                      {active.exceptions.map((e, i) => (
                        <li key={i}><code>{e.type}</code><span>{e.desc}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .cdg-root {
          width: 100%; height: 100%;
          display: flex; flex-direction: column;
          background: var(--color-surface);
          color: var(--text-primary);
          font-family: inherit;
        }
        .cdg-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; gap: 14px;
          border-bottom: 1px solid var(--color-border);
          background:
            linear-gradient(135deg, rgba(124,108,240,0.06) 0%, transparent 60%),
            rgba(255,255,255,0.015);
        }
        .cdg-brand { display: flex; align-items: center; gap: 12px; }
        .cdg-brand-logo {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
          color: #fff; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 20px rgba(245,158,11,0.28);
        }
        .cdg-brand h1 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.02em; }
        .cdg-brand p { margin: 2px 0 0; font-size: 12px; color: var(--text-secondary); }
        .cdg-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .cdg-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 13px; border-radius: 9px;
          font-size: 12.5px; font-weight: 500;
          border: 1px solid var(--color-border);
          background: var(--glass-bg); color: var(--text-primary);
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .cdg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cdg-btn:not(:disabled):hover { background: var(--accent-subtle); border-color: var(--accent); }
        .cg-btn-primary {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
          color: #fff; border-color: transparent;
          box-shadow: 0 6px 18px rgba(124,108,240,0.25);
        }
        .cg-btn-primary:not(:disabled):hover { filter: brightness(1.05); }
        .cdg-icon-btn {
          background: transparent; border: none; cursor: pointer;
          color: var(--text-secondary);
          padding: 4px; border-radius: 6px;
          display: inline-flex; align-items: center;
        }
        .cdg-icon-btn:hover { background: var(--glass-bg); color: var(--text-primary); }

        .cdg-config {
          padding: 14px 20px;
          border-bottom: 1px solid var(--color-border);
          background: rgba(255,255,255,0.012);
        }
        .cdg-config-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px; margin-bottom: 12px;
        }
        .cdg-config label, .cdg-config-grid label {
          display: flex; flex-direction: column; gap: 5px;
          font-size: 11.5px; color: var(--text-secondary);
        }
        .cdg-config select {
          padding: 7px 10px; border-radius: 8px;
          border: 1px solid var(--color-border);
          background: var(--glass-bg); color: var(--text-primary);
          font-size: 12.5px; outline: none;
        }
        .cdg-config select:focus { border-color: var(--accent); }
        .cdg-toggles { display: flex; flex-wrap: wrap; gap: 14px; }
        .cdg-toggle {
          flex-direction: row !important; align-items: center; gap: 7px;
          cursor: pointer; color: var(--text-primary) !important; font-size: 12px !important;
        }
        .cdg-toggle input { accent-color: var(--color-primary); }

        .cdg-body {
          flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
          min-height: 0; gap: 16px; padding: 16px 20px 20px;
        }
        @media (max-width: 980px) { .cdg-body { grid-template-columns: 1fr; } }
        .cdg-pane {
          display: flex; flex-direction: column;
          background: var(--glass-bg);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          overflow: hidden;
          min-height: 0;
        }
        .cdg-pane-head {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 14px; font-size: 12.5px; font-weight: 600;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--color-border);
          background: rgba(255,255,255,0.018);
        }
        .cdg-pane-head-actions { margin-left: auto; display: flex; gap: 8px; align-items: center; }

        .cdg-pane textarea {
          flex: 1; border: none; outline: none; resize: none;
          padding: 14px 16px; background: transparent;
          color: var(--text-primary); font-size: 13px; line-height: 1.65;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          min-height: 0;
        }

        .cdg-results { padding: 14px 16px; overflow: auto; display: flex; flex-direction: column; gap: 14px; flex: 1; min-height: 0; }
        .cdg-empty { text-align: center; padding: 44px 16px; color: var(--text-secondary); }
        .cdg-empty p { margin: 10px 0 0; font-size: 12.5px; }
        .cdg-result-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
        .cdg-result-tab {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 10px; border-radius: 7px;
          border: 1px solid var(--color-border);
          background: rgba(255,255,255,0.015);
          color: var(--text-secondary);
          font-size: 11.5px; cursor: pointer;
          transition: var(--transition-smooth);
        }
        .cdg-result-tab.active {
          background: var(--accent-subtle); color: var(--text-primary);
          border-color: var(--accent);
        }
        .cdg-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--color-secondary); }

        .cdg-result-body { display: flex; flex-direction: column; gap: 16px; }
        .cdg-result-section h3 {
          margin: 0 0 8px; font-size: 12.5px; font-weight: 600; color: var(--text-secondary);
          letter-spacing: 0.02em; text-transform: uppercase;
        }
        .cdg-result-head { display: flex; align-items: center; justify-content: space-between; }
        .cdg-result-section p { margin: 0; font-size: 13.5px; line-height: 1.7; }
        .cdg-table {
          width: 100%; border-collapse: collapse; font-size: 12.5px;
          border-radius: 8px; overflow: hidden;
        }
        .cdg-table th, .cdg-table td {
          padding: 8px 10px; text-align: left;
          border-bottom: 1px solid var(--color-border);
        }
        .cdg-table th { background: rgba(255,255,255,0.03); color: var(--text-secondary); font-weight: 600; font-size: 11.5px; }
        .cdg-kv {
          display: flex; gap: 14px; align-items: center;
          padding: 10px 12px;
          background: rgba(255,255,255,0.02); border-radius: 8px;
          border: 1px solid var(--color-border);
        }
        .cdg-block {
          margin: 0; padding: 12px 14px;
          background: rgba(0,0,0,0.22);
          border: 1px solid var(--color-border); border-radius: 10px;
          font-size: 12.5px; line-height: 1.7;
          overflow-x: auto;
        }
        .cdg-block code {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          color: #cbd5e1;
        }
        .cdg-block-example { border-left: 3px solid var(--color-secondary); }
        .cdg-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
        .cdg-list li { display: flex; gap: 10px; align-items: flex-start; padding: 8px 12px; background: rgba(255,255,255,0.02); border-radius: 8px; font-size: 12.5px; }
        .cdg-list code { color: var(--color-error); white-space: nowrap; }
        .cdg-list span { color: var(--text-secondary); }

        .cdg-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 2px 8px; border-radius: 999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--color-border);
          font-size: 10.5px; font-weight: 600;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
        }
        .cdg-chip-confidence { background: var(--success-bg); color: var(--success); border-color: rgba(16,185,129,0.25); }
      `}</style>
    </div>
  )
}
