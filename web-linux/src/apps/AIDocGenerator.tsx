import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  FileCode, Sparkles, Copy, Eye, EyeOff,
  CheckCircle, AlertCircle, Trash2,
  FileJson, Wand2, History, RotateCcw, Loader2, Code,
  X, FileText,
} from 'lucide-react'
import { API_CONFIG, fetchWithTimeout } from '../config/apiConfig'

type Language = 'ts' | 'js' | 'py' | 'go' | 'rs' | 'java'
type DocStyle = 'jsdoc' | 'google' | 'numpy' | 'doxygen' | 'pydoc'
type ExportFormat = 'markdown' | 'html'

interface AnalyzedFunction {
  name: string
  signature: string
  params: { name: string; type: string }[]
  returnType: string
  body: string
}

interface GeneratedDoc {
  id: string
  functionName: string
  language: Language
  style: DocStyle
  summary: string
  params: { name: string; type: string; desc: string }[]
  returns: { type: string; desc: string }
  fullComment: string
  editedComment: string
  isAI: boolean
  timestamp: number
}

interface HistoryEntry {
  id: string
  title: string
  code: string
  language: Language
  style: DocStyle
  doc: string
  timestamp: number
}

const LANGUAGES: { value: Language; label: string; icon: string }[] = [
  { value: 'ts', label: 'TypeScript', icon: 'TS' },
  { value: 'js', label: 'JavaScript', icon: 'JS' },
  { value: 'py', label: 'Python', icon: 'PY' },
  { value: 'go', label: 'Go', icon: 'GO' },
  { value: 'rs', label: 'Rust', icon: 'RS' },
  { value: 'java', label: 'Java', icon: 'JV' },
]

const STYLES: { value: DocStyle; label: string; desc: string }[] = [
  { value: 'jsdoc', label: 'JSDoc', desc: 'TypeScript/JavaScript 标准' },
  { value: 'google', label: 'Google Style', desc: 'Google 开源风格' },
  { value: 'numpy', label: 'NumPy', desc: 'Python 科学计算风格' },
  { value: 'doxygen', label: 'Doxygen', desc: 'C/C++/Java 文档风格' },
  { value: 'pydoc', label: 'PyDoc', desc: 'Python 传统 docstring' },
]

const SAMPLES: Record<string, { lang: Language; code: string }> = {
  'TypeScript': {
    lang: 'ts',
    code: `interface User {
  id: string;
  name: string;
  email: string;
  roles: Array<'admin' | 'user' | 'guest'>;
}

export function processUsers(
  users: User[],
  filters: { role?: string; searchTerm?: string } = {},
  options: { page?: number; pageSize?: number } = {}
): { total: number; data: User[] } {
  const { role, searchTerm } = filters;
  const { page = 1, pageSize = 20 } = options;
  let result = [...users];
  if (role) result = result.filter(u => u.roles.includes(role as any));
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    result = result.filter(u =>
      u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
    );
  }
  const total = result.length;
  const start = (page - 1) * pageSize;
  return { total, data: result.slice(start, start + pageSize) };
}`,
  },
  'Python': {
    lang: 'py',
    code: `from typing import Dict, List, Optional

def analyze_data(
    data: List[Dict],
    metric: str = "sum",
    threshold: Optional[float] = None,
) -> Dict:
    """Analyze dataset with configurable metrics."""
    results = {}
    for item in data:
        if threshold is None or item.get("value", 0) > threshold:
            key = item.get("category", "unknown")
            if key not in results:
                results[key] = []
            results[key].append(item)
    return {
        "metric": metric,
        "groups": len(results),
        "data": results,
    }`,
  },
  'Go': {
    lang: 'go',
    code: `package main

import "fmt"

type Config struct {
    Name    string
    Port    int
    Debug   bool
}

func StartServer(cfg Config) error {
    if cfg.Port < 1 || cfg.Port > 65535 {
        return fmt.Errorf("invalid port: %d", cfg.Port)
    }
    fmt.Printf("Starting %s on port %d\\n", cfg.Name, cfg.Port)
    return nil
}`,
  },
  'Rust': {
    lang: 'rs',
    code: `pub struct Calculator {
    precision: u8,
}

impl Calculator {
    pub fn new(precision: u8) -> Self {
        Calculator { precision }
    }

    pub fn add(&self, a: f64, b: f64) -> f64 {
        let factor = 10f64.powi(self.precision as i32);
        ((a + b) * factor).round() / factor
    }

    pub fn multiply(&self, a: f64, b: f64) -> f64 {
        let factor = 10f64.powi(self.precision as i32);
        ((a * b) * factor).round() / factor
    }
}`,
  },
  'Java': {
    lang: 'java',
    code: `public class DataProcessor {
    private String name;
    private int capacity;

    public DataProcessor(String name, int capacity) {
        this.name = name;
        this.capacity = capacity;
    }

    public List<String> filterActive(List<String> items, boolean activeOnly) {
        List<String> result = new ArrayList<>();
        for (String item : items) {
            if (!activeOnly || item.startsWith("active_")) {
                result.add(item);
            }
        }
        return result;
    }
}`,
  },
}

function detectLanguage(code: string): Language {
  if (!code.trim()) return 'ts'
  if (/\bdef\s+\w+\s*\(.*\)\s*:|import\s+from\s+typing|from\s+typing/.test(code)) return 'py'
  if (/\bfn\s+\w+|let\s+mut:|impl\s+\w+|pub\s+fn/.test(code)) return 'rs'
  if (/\bfunc\s+\w+|package\s+\w+/.test(code)) return 'go'
  if (/public\s+(class|static|void)|class\s+\w+\s+extends|private\s+\w+\s+\w+\(/.test(code)) return 'java'
  return 'ts'
}

function extractFunctions(code: string, lang: Language): AnalyzedFunction[] {
  const results: AnalyzedFunction[] = []
  if (lang === 'py') {
    const re = /def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*[^:]+)?\s*:/g
    let match
    while ((match = re.exec(code)) !== null) {
      const name = match[1]
      const paramsStr = match[2] || ''
      const params = paramsStr
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => {
          const [pname, ptype] = p.split(':').map(s => s?.trim() ?? '')
          return {
            name: pname.replace(/\s*=\s*.+$/, '').trim(),
            type: ptype || 'Any',
          }
        })
      results.push({ name, signature: match[0], params, returnType: '', body: '' })
    }
  } else if (lang === 'rs') {
    const re = /(?:pub\s+)?fn\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*[^{]+)?\s*\{/g
    let match
    while ((match = re.exec(code)) !== null) {
      const name = match[1]
      const paramsStr = match[2] || ''
      const params = paramsStr
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => {
          const parts = p.split(':').map(s => s?.trim() ?? '')
          return { name: parts[0] || '', type: parts[1] || '_' }
        })
      results.push({ name, signature: match[0], params, returnType: '', body: '' })
    }
  } else if (lang === 'go') {
    const re = /func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(([^)]*)\)\s*(?:\([^)]+\)|[^{]+)?\s*\{/g
    let match
    while ((match = re.exec(code)) !== null) {
      const name = match[1]
      const paramsStr = match[2] || ''
      const params = paramsStr
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => {
          const parts = p.split(/\s+/).filter(Boolean)
          return { name: parts[0] || '', type: parts.slice(1).join(' ') || 'any' }
        })
      results.push({ name, signature: match[0], params, returnType: '', body: '' })
    }
  } else if (lang === 'java') {
    const re = /(?:public|private|protected|static|final|\s)+(\w+)\s+(\w+)\s*\(([^)]*)\)\s*\{/g
    let match
    while ((match = re.exec(code)) !== null) {
      const returnType = match[1]
      const name = match[2]
      const paramsStr = match[3] || ''
      if (name === 'if' || name === 'for' || name === 'while') continue
      const params = paramsStr
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => {
          const parts = p.split(/\s+/).filter(Boolean)
          return { name: parts[parts.length - 1] || '', type: parts.slice(0, -1).join(' ') || 'void' }
        })
      results.push({ name, signature: match[0], params, returnType, body: '' })
    }
  } else {
    const re = /(?:export\s+)?(?:function|const|let|var)\s+(?:async\s+)?(\w+)\s*[=:(]\s*(?:async\s+)?(?:\(([^)]*)\)|function\s*\(([^)]*)\))/g
    let match
    while ((match = re.exec(code)) !== null) {
      const name = match[1]
      const paramsStr = match[2] ?? match[3] ?? ''
      const params = paramsStr
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => {
          const clean = p.replace(/^[?&.]+/, '')
          const [pname, ptype] = clean.split(':').map(s => s?.trim() ?? '')
          return {
            name: pname?.replace(/\s*=\s*.+$/, '').trim() || '',
            type: ptype?.replace(/\s*=.+$/, '').trim() || 'any',
          }
        })
      results.push({ name, signature: match[0], params, returnType: '', body: '' })
    }
  }
  return results
}

function generateCommentStub(fn: AnalyzedFunction, style: DocStyle): string {
  const paramLines = fn.params.map(p => {
    if (style === 'numpy') return `    ${p.name} : ${p.type}\n        Description of ${p.name}`
    if (style === 'doxygen') return ` * @param ${p.name} Description of ${p.name}`
    if (style === 'pydoc') return `    @param ${p.name}: Description`
    return ` * @param ${p.name} Description of ${p.name}`
  })

  const header = style === 'numpy' ? '"""' : style === 'pydoc' ? '"""' : '/**'
  const footer = style === 'numpy' ? '"""' : style === 'pydoc' ? '"""' : ' */'
  const prefix = style === 'numpy' || style === 'pydoc' ? '    ' : ' * '

  const lines: string[] = [header]
  lines.push(`${prefix}TODO: Add description for ${fn.name}`)
  if (paramLines.length > 0) {
    lines.push(style === 'numpy' ? '' : prefix)
    if (style === 'numpy') lines.push(`${prefix}Parameters`)
    else if (style === 'doxygen') {}
    else lines.push(`${prefix}@${style === 'google' ? 'param' : 'param'} ${fn.params.map(p => p.name).join(', ')}`)
    paramLines.forEach(l => lines.push(l))
  }
  if (style !== 'numpy' && style !== 'pydoc') {
    lines.push(`${prefix}@returns Description of return value`)
  }
  lines.push(footer)
  return lines.join('\n')
}

async function pollinateText(prompt: string, systemPrompt = '', model = 'openai', timeout = 60000): Promise<string> {
  const fullPrompt = systemPrompt
    ? `<|im_start|>system\n${systemPrompt}\n<|im_end|>\n<|im_start|>user\n${prompt}\n<|im_end|>\n<|im_start|>assistant\n`
    : prompt
  const res = await fetchWithTimeout(
    `${API_CONFIG.pollinations.textBaseUrl}/${encodeURIComponent(fullPrompt)}?model=${model}&seed=-1&temperature=0.7`,
    { headers: { 'Accept': 'text/plain' } },
    timeout,
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.text()
}

const HISTORY_KEY = 'aidocgenerator_history'
const MAX_HISTORY = 30

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistoryEntry(entry: HistoryEntry) {
  try {
    const history = loadHistory()
    const next = [entry, ...history].slice(0, MAX_HISTORY)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch {}
}

function removeHistoryEntry(id: string) {
  try {
    const history = loadHistory().filter(h => h.id !== id)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {}
}

function generateMarkdown(docs: GeneratedDoc[]): string {
  const sections = docs.map(d => {
    const paramsTable = d.params.length
      ? '| Name | Type | Description |\n| --- | --- | --- |\n' +
        d.params.map(p => `| \`${p.name}\` | \`${p.type}\` | ${p.desc} |`).join('\n')
      : 'None'
    return `## \`${d.functionName}\`

**Language:** ${d.language.toUpperCase()} · **Style:** ${d.style.toUpperCase()}

### Summary

${d.summary}

### Parameters

${paramsTable}

### Returns

- **Type:** \`${d.returns.type}\`
- **Description:** ${d.returns.desc}

### Documentation

\`\`\`${d.language}
${d.editedComment}
\`\`\``
  })
  return `# AI Documentation Report

> Generated at ${new Date().toLocaleString('zh-CN')}
> Powered by Pollinations AI

---

${sections.join('\n\n---\n\n')}`
}

function generateHTML(docs: GeneratedDoc[]): string {
  const cards = docs.map(d => {
    const paramsRows = d.params.length
      ? d.params.map(p => `<tr><td><code>${p.name}</code></td><td><code>${p.type}</code></td><td>${p.desc}</td></tr>`).join('')
      : '<tr><td colspan="3" style="text-align:center;color:#94a3b8;">None</td></tr>'
    return `<div class="doc-card">
  <div class="doc-header">
    <h2><code>${d.functionName}</code></h2>
    <span class="badge">${d.language.toUpperCase()} · ${d.style.toUpperCase()}</span>
  </div>
  <div class="doc-section">
    <h3>Summary</h3>
    <p>${d.summary}</p>
  </div>
  <div class="doc-section">
    <h3>Parameters</h3>
    <table>
      <thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead>
      <tbody>${paramsRows}</tbody>
    </table>
  </div>
  <div class="doc-section">
    <h3>Returns</h3>
    <p><strong>Type:</strong> <code>${d.returns.type}</code><br><strong>Description:</strong> ${d.returns.desc}</p>
  </div>
  <div class="doc-section">
    <h3>Documentation</h3>
    <pre><code>${d.editedComment}</code></pre>
  </div>
</div>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Documentation Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px 20px; }
  .container { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 28px; margin-bottom: 8px; }
  .meta { color: #94a3b8; font-size: 13px; margin-bottom: 32px; }
  .doc-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
  .doc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .doc-header h2 { font-size: 18px; }
  .badge { background: #334155; color: #cbd5e1; padding: 4px 10px; border-radius: 999px; font-size: 12px; }
  .doc-section { margin-bottom: 16px; }
  .doc-section h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #334155; }
  th { color: #94a3b8; font-weight: 600; }
  code { background: #334155; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  pre { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  hr { border: none; border-top: 1px solid #334155; margin: 32px 0; }
</style>
</head>
<body>
<div class="container">
  <h1>📝 AI Documentation Report</h1>
  <p class="meta">Generated at ${new Date().toLocaleString('zh-CN')} · Powered by Pollinations AI</p>
  ${cards}
</div>
</body>
</html>`
}

export default function AIDocGenerator() {
  const [code, setCode] = useState(SAMPLES['TypeScript'].code)
  const [language, setLanguage] = useState<Language>('ts')
  const [style, setStyle] = useState<DocStyle>('jsdoc')
  const [docs, setDocs] = useState<GeneratedDoc[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const detectedLang = useMemo(() => detectLanguage(code), [code])
  const effectiveLang = language === 'ts' && detectedLang !== 'ts' ? detectedLang : language
  const functions = useMemo(() => extractFunctions(code, effectiveLang), [code, effectiveLang])

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  const generateDocs = useCallback(async () => {
    if (!code.trim()) return
    setLoading(true)
    setError(null)

    const fns = functions.length ? functions : [{ name: 'module', signature: '', params: [], returnType: '', body: '' }]
    const targetFns = fns.slice(0, 6)

    const results: GeneratedDoc[] = []
    for (const fn of targetFns) {
      try {
        const paramsDesc = fn.params.map(p => `${p.name}: ${p.type}`).join(', ')
        const prompt = `Generate ${style} documentation for the following ${effectiveLang} function. Respond ONLY with the documentation comment block, no other text.

Function: ${fn.name}
Parameters: ${paramsDesc || 'none'}
Signature: ${fn.signature || fn.name}

Code context:
${code.slice(0, 800)}`

        const systemPrompt = `You are an expert software documentation writer. Generate proper ${style} style documentation for ${effectiveLang} code. The documentation should include a brief description, @param tags for each parameter, and @returns tag. Output only the raw documentation comment.`

        const aiResp = await pollinateText(prompt, systemPrompt)
        const cleanComment = aiResp.trim()

        const paramDocs = fn.params.map(p => ({
          name: p.name,
          type: p.type,
          desc: 'AI 生成的描述',
        }))

        results.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          functionName: fn.name,
          language: effectiveLang,
          style,
          summary: `AI 为 \`${fn.name}\` 生成的文档说明`,
          params: paramDocs,
          returns: { type: fn.returnType || 'void', desc: 'AI 生成的返回值描述' },
          fullComment: cleanComment,
          editedComment: cleanComment,
          isAI: true,
          timestamp: Date.now(),
        })
      } catch (e) {
        const stub = generateCommentStub(fn, style)
        results.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          functionName: fn.name,
          language: effectiveLang,
          style,
          summary: `为 \`${fn.name}\` 生成的占位文档（AI 生成失败）`,
          params: fn.params.map(p => ({ name: p.name, type: p.type, desc: '待补充' })),
          returns: { type: fn.returnType || 'void', desc: '待补充' },
          fullComment: stub,
          editedComment: stub,
          isAI: false,
          timestamp: Date.now(),
        })
      }
    }

    setDocs(results)
    if (results[0]) setActiveId(results[0].id)

    if (results.length > 0) {
      saveHistoryEntry({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: results.map(r => r.functionName).join(', '),
        code,
        language: effectiveLang,
        style,
        doc: results.map(r => r.editedComment).join('\n\n'),
        timestamp: Date.now(),
      })
      setHistory(loadHistory())
    }

    setLoading(false)
  }, [code, functions, effectiveLang, style])

  const generateStubs = useCallback(() => {
    const fns = functions.length ? functions : [{ name: 'module', signature: '', params: [], returnType: '', body: '' }]
    const results: GeneratedDoc[] = fns.slice(0, 8).map(fn => {
      const comment = generateCommentStub(fn, style)
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        functionName: fn.name,
        language: effectiveLang,
        style,
        summary: `占位文档：请编辑或使用 AI 生成`,
        params: fn.params.map(p => ({ name: p.name, type: p.type, desc: '待补充' })),
        returns: { type: fn.returnType || 'void', desc: '待补充' },
        fullComment: comment,
        editedComment: comment,
        isAI: false,
        timestamp: Date.now(),
      }
    })
    setDocs(results)
    if (results[0]) setActiveId(results[0].id)
    setError(null)
  }, [functions, effectiveLang, style])

  const updateEditedComment = useCallback((id: string, value: string) => {
    setDocs(d => d.map(doc => doc.id === id ? { ...doc, editedComment: value } : doc))
  }, [])

  const copyText = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {}
  }, [])

  const exportDocs = useCallback((format: ExportFormat) => {
    if (!docs.length) return
    let content = ''
    let mime = ''
    let ext = ''
    if (format === 'markdown') {
      content = generateMarkdown(docs)
      mime = 'text/markdown'
      ext = 'md'
    } else {
      content = generateHTML(docs)
      mime = 'text/html'
      ext = 'html'
    }
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-doc-${Date.now()}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }, [docs])

  const loadSample = useCallback((key: string) => {
    const sample = SAMPLES[key]
    if (sample) {
      setCode(sample.code)
      setLanguage(sample.lang)
      setDocs([])
      setActiveId(null)
    }
  }, [])

  const loadHistoryEntry = useCallback((entry: HistoryEntry) => {
    setCode(entry.code)
    setLanguage(entry.language)
    setStyle(entry.style)
    setShowHistory(false)
  }, [])

  const deleteHistoryEntry = useCallback((id: string) => {
    removeHistoryEntry(id)
    setHistory(loadHistory())
  }, [])

  const active = docs.find(d => d.id === activeId)

  return (
    <div className="aidoc-root">
      <header className="aidoc-header">
        <div className="aidoc-brand">
          <div className="aidoc-brand-logo">
            <Sparkles size={20} />
          </div>
          <div>
            <h1>AI Doc Generator</h1>
            <p>
              AI 驱动的代码文档生成器 · 检测到
              <code className="aidoc-chip aidoc-chip-lang">{detectedLang.toUpperCase()}</code>
              · 识别到 {functions.length} 个函数
            </p>
          </div>
        </div>
        <div className="aidoc-actions">
          <button className="aidoc-btn" onClick={() => setShowHistory(s => !s)} title="历史">
            <History size={14} /> <span>历史</span>
          </button>
          <button className="aidoc-btn" onClick={() => setShowPreview(p => !p)} title="预览">
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showPreview ? '隐藏预览' : '显示预览'}</span>
          </button>
          <button className="aidoc-btn aidoc-btn-secondary" onClick={generateStubs} disabled={!code.trim()}>
            <Wand2 size={14} /> <span>生成占位</span>
          </button>
          <button className="aidoc-btn aidoc-btn-primary" onClick={generateDocs} disabled={!code.trim() || loading}>
            {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />}
            <span>{loading ? 'AI 生成中...' : 'AI 生成文档'}</span>
          </button>
          <button className="aidoc-btn" onClick={() => exportDocs('markdown')} disabled={!docs.length}>
            <FileText size={14} /> <span>MD</span>
          </button>
          <button className="aidoc-btn" onClick={() => exportDocs('html')} disabled={!docs.length}>
            <FileJson size={14} /> <span>HTML</span>
          </button>
        </div>
      </header>

      <div className="aidoc-config">
        <div className="aidoc-config-grid">
          <label>
            <span>编程语言</span>
            <select value={language} onChange={e => setLanguage(e.target.value as Language)}>
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>注释风格</span>
            <select value={style} onChange={e => setStyle(e.target.value as DocStyle)}>
              {STYLES.map(s => (
                <option key={s.value} value={s.value}>{s.label} — {s.desc}</option>
              ))}
            </select>
          </label>
          <label>
            <span>预设示例</span>
            <select onChange={e => loadSample(e.target.value)} defaultValue="">
              <option value="">加载示例代码...</option>
              {Object.keys(SAMPLES).map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </label>
        </div>
        {error && (
          <div className="aidoc-error">
            <AlertCircle size={14} /> <span>{error}</span>
            <button className="aidoc-icon-btn" onClick={() => setError(null)}><X size={12} /></button>
          </div>
        )}
      </div>

      {showHistory && (
        <div className="aidoc-history">
          <div className="aidoc-history-head">
            <History size={14} /> <span>历史记录 ({history.length})</span>
            <button className="aidoc-icon-btn" onClick={() => setHistory([])} disabled={!history.length}>
              <Trash2 size={12} />
            </button>
          </div>
          {history.length === 0 ? (
            <div className="aidoc-empty-history">暂无历史记录</div>
          ) : (
            <div className="aidoc-history-list">
              {history.map(h => (
                <div key={h.id} className="aidoc-history-item">
                  <div className="aidoc-history-info">
                    <div className="aidoc-history-title">{h.title || 'Untitled'}</div>
                    <div className="aidoc-history-meta">
                      <code className="aidoc-chip">{h.language.toUpperCase()}</code>
                      <code className="aidoc-chip">{h.style.toUpperCase()}</code>
                      <span>{new Date(h.timestamp).toLocaleString('zh-CN')}</span>
                    </div>
                  </div>
                  <div className="aidoc-history-actions">
                    <button className="aidoc-icon-btn" onClick={() => loadHistoryEntry(h)} title="加载">
                      <Code size={12} />
                    </button>
                    <button className="aidoc-icon-btn" onClick={() => deleteHistoryEntry(h.id)} title="删除">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="aidoc-body">
        <div className="aidoc-pane aidoc-pane-left">
          <div className="aidoc-pane-head">
            <FileCode size={14} />
            <span>源代码</span>
            <div className="aidoc-pane-head-actions">
              <span className="aidoc-chip">{code.split('\n').length} 行</span>
              <button className="aidoc-icon-btn" onClick={() => setCode('')} title="清空">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          <textarea
            ref={taRef}
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            placeholder="粘贴或输入源代码…支持 TypeScript / JavaScript / Python / Go / Rust / Java"
          />
        </div>

        <div className="aidoc-pane aidoc-pane-right">
          <div className="aidoc-pane-head">
            <FileJson size={14} />
            <span>生成结果 ({docs.length})</span>
            <div className="aidoc-pane-head-actions">
              {active?.isAI && (
                <span className="aidoc-chip aidoc-chip-ai">
                  <Sparkles size={11} /> AI 生成
                </span>
              )}
            </div>
          </div>

          <div className="aidoc-results">
            {docs.length === 0 && !loading && (
              <div className="aidoc-empty">
                <FileText size={32} opacity={0.4} />
                <p>点击「AI 生成文档」开始，或选择预设示例</p>
              </div>
            )}

            {docs.length > 0 && (
              <div className="aidoc-result-tabs">
                {docs.map(d => (
                  <button
                    key={d.id}
                    className={`aidoc-result-tab ${activeId === d.id ? 'active' : ''}`}
                    onClick={() => setActiveId(d.id)}
                  >
                    <code>{d.functionName}</code>
                    {d.isAI && <span className="aidoc-ai-dot" />}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="aidoc-loading">
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <p>AI 正在分析代码并生成文档...</p>
              </div>
            )}

            {active && !loading && (
              <div className="aidoc-result-body">
                {showPreview && (
                  <div className="aidoc-result-section">
                    <h3>预览</h3>
                    <div className="aidoc-preview">
                      <pre className="aidoc-block">
                        <code>{active.editedComment}</code>
                      </pre>
                    </div>
                  </div>
                )}

                <div className="aidoc-result-section">
                  <div className="aidoc-result-head">
                    <h3>编辑文档</h3>
                    <div className="aidoc-result-actions">
                      <button className="aidoc-icon-btn" onClick={() => copyText(active.editedComment, active.id)} title="复制">
                        {copiedId === active.id ? <CheckCircle size={12} /> : <Copy size={12} />}
                      </button>
                      <button className="aidoc-icon-btn" onClick={() => updateEditedComment(active.id, active.fullComment)} title="重置">
                        <RotateCcw size={12} />
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="aidoc-editor"
                    value={active.editedComment}
                    onChange={e => updateEditedComment(active.id, e.target.value)}
                    spellCheck={false}
                  />
                </div>

                <div className="aidoc-result-section">
                  <h3>函数信息</h3>
                  <table className="aidoc-table">
                    <thead>
                      <tr><th>名称</th><th>类型</th></tr>
                    </thead>
                    <tbody>
                      {active.params.map(p => (
                        <tr key={p.name}>
                          <td><code>{p.name}</code></td>
                          <td><code>{p.type}</code></td>
                        </tr>
                      ))}
                      <tr>
                        <td><code className="aidoc-ret-tag">@returns</code></td>
                        <td><code>{active.returns.type}</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .aidoc-root {
          width: 100%; height: 100%;
          display: flex; flex-direction: column;
          background: var(--color-surface);
          color: var(--text-primary);
          font-family: inherit;
        }
        .aidoc-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; gap: 14px;
          border-bottom: 1px solid var(--color-border);
          background:
            linear-gradient(135deg, rgba(59,130,246,0.06) 0%, transparent 60%),
            rgba(255,255,255,0.015);
        }
        .aidoc-brand { display: flex; align-items: center; gap: 12px; }
        .aidoc-brand-logo {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: #fff; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 20px rgba(59,130,246,0.28);
        }
        .aidoc-brand h1 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.02em; }
        .aidoc-brand p { margin: 2px 0 0; font-size: 12px; color: var(--text-secondary); }
        .aidoc-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .aidoc-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 13px; border-radius: 9px;
          font-size: 12.5px; font-weight: 500;
          border: 1px solid var(--color-border);
          background: var(--glass-bg); color: var(--text-primary);
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .aidoc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .aidoc-btn:not(:disabled):hover { background: var(--accent-subtle); border-color: var(--accent); }
        .aidoc-btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: #fff; border-color: transparent;
          box-shadow: 0 6px 18px rgba(59,130,246,0.25);
        }
        .aidoc-btn-primary:not(:disabled):hover { filter: brightness(1.05); }
        .aidoc-btn-secondary {
          background: rgba(255,255,255,0.03);
        }
        .aidoc-icon-btn {
          background: transparent; border: none; cursor: pointer;
          color: var(--text-secondary);
          padding: 4px; border-radius: 6px;
          display: inline-flex; align-items: center;
        }
        .aidoc-icon-btn:hover { background: var(--glass-bg); color: var(--text-primary); }

        .aidoc-config {
          padding: 14px 20px;
          border-bottom: 1px solid var(--color-border);
          background: rgba(255,255,255,0.012);
        }
        .aidoc-config-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        .aidoc-config label {
          display: flex; flex-direction: column; gap: 5px;
          font-size: 11.5px; color: var(--text-secondary);
        }
        .aidoc-config select {
          padding: 7px 10px; border-radius: 8px;
          border: 1px solid var(--color-border);
          background: var(--glass-bg); color: var(--text-primary);
          font-size: 12.5px; outline: none;
        }
        .aidoc-config select:focus { border-color: var(--accent); }
        .aidoc-error {
          display: flex; align-items: center; gap: 8px;
          margin-top: 10px; padding: 8px 12px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 8px;
          color: var(--color-error);
          font-size: 12px;
        }

        .aidoc-history {
          border-bottom: 1px solid var(--color-border);
          background: rgba(255,255,255,0.015);
          max-height: 240px;
          overflow-y: auto;
        }
        .aidoc-history-head {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 16px;
          font-size: 12px; font-weight: 600;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--color-border);
        }
        .aidoc-history-head .aidoc-icon-btn { margin-left: auto; }
        .aidoc-empty-history {
          padding: 20px; text-align: center;
          font-size: 12px; color: var(--text-secondary);
        }
        .aidoc-history-list {
          display: flex; flex-direction: column;
        }
        .aidoc-history-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px;
          border-bottom: 1px solid var(--color-border);
          transition: var(--transition-smooth);
        }
        .aidoc-history-item:hover { background: rgba(255,255,255,0.02); }
        .aidoc-history-info { flex: 1; min-width: 0; }
        .aidoc-history-title {
          font-size: 13px; font-weight: 500;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .aidoc-history-meta {
          display: flex; gap: 6px; align-items: center;
          margin-top: 4px; font-size: 11px; color: var(--text-secondary);
        }
        .aidoc-history-actions { display: flex; gap: 4px; }

        .aidoc-body {
          flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
          min-height: 0; gap: 16px; padding: 16px 20px 20px;
        }
        @media (max-width: 980px) { .aidoc-body { grid-template-columns: 1fr; } }

        .aidoc-pane {
          display: flex; flex-direction: column;
          background: var(--glass-bg);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          overflow: hidden;
          min-height: 0;
        }
        .aidoc-pane-head {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 14px; font-size: 12.5px; font-weight: 600;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--color-border);
          background: rgba(255,255,255,0.018);
        }
        .aidoc-pane-head-actions { margin-left: auto; display: flex; gap: 8px; align-items: center; }

        .aidoc-pane textarea {
          flex: 1; border: none; outline: none; resize: none;
          padding: 14px 16px; background: transparent;
          color: var(--text-primary); font-size: 13px; line-height: 1.65;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          min-height: 0;
        }

        .aidoc-results { padding: 14px 16px; overflow: auto; display: flex; flex-direction: column; gap: 14px; flex: 1; min-height: 0; }
        .aidoc-empty {
          text-align: center; padding: 44px 16px; color: var(--text-secondary);
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .aidoc-empty p { margin: 0; font-size: 12.5px; }

        .aidoc-result-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
        .aidoc-result-tab {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 10px; border-radius: 7px;
          border: 1px solid var(--color-border);
          background: rgba(255,255,255,0.015);
          color: var(--text-secondary);
          font-size: 11.5px; cursor: pointer;
          transition: var(--transition-smooth);
        }
        .aidoc-result-tab.active {
          background: var(--accent-subtle); color: var(--text-primary);
          border-color: var(--accent);
        }
        .aidoc-ai-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #8b5cf6;
          box-shadow: 0 0 6px #8b5cf6;
        }

        .aidoc-loading {
          text-align: center; padding: 40px 20px;
          color: var(--text-secondary);
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .aidoc-loading p { font-size: 13px; margin: 0; }

        .aidoc-result-body { display: flex; flex-direction: column; gap: 16px; }
        .aidoc-result-section h3 {
          margin: 0 0 8px; font-size: 12.5px; font-weight: 600; color: var(--text-secondary);
          letter-spacing: 0.02em; text-transform: uppercase;
        }
        .aidoc-result-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 8px;
        }
        .aidoc-result-actions { display: flex; gap: 4px; }

        .aidoc-preview {
          background: rgba(0,0,0,0.22);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          overflow: hidden;
        }
        .aidoc-block {
          margin: 0; padding: 12px 14px;
          font-size: 12.5px; line-height: 1.7;
          overflow-x: auto;
        }
        .aidoc-block code {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          color: #cbd5e1;
          white-space: pre;
        }

        .aidoc-editor {
          width: 100%; min-height: 160px;
          padding: 12px 14px;
          background: rgba(0,0,0,0.22);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          color: #e2e8f0;
          font-size: 12.5px; line-height: 1.7;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          resize: vertical;
          outline: none;
        }
        .aidoc-editor:focus { border-color: var(--accent); }

        .aidoc-table {
          width: 100%; border-collapse: collapse; font-size: 12.5px;
          border-radius: 8px; overflow: hidden;
        }
        .aidoc-table th, .aidoc-table td {
          padding: 8px 10px; text-align: left;
          border-bottom: 1px solid var(--color-border);
        }
        .aidoc-table th { background: rgba(255,255,255,0.03); color: var(--text-secondary); font-weight: 600; font-size: 11.5px; }
        .aidoc-ret-tag { color: #f59e0b; }

        .aidoc-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 2px 8px; border-radius: 999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--color-border);
          font-size: 10.5px; font-weight: 600;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
        }
        .aidoc-chip-lang { background: rgba(59,130,246,0.15); color: #60a5fa; border-color: rgba(59,130,246,0.3); }
        .aidoc-chip-ai { background: rgba(139,92,246,0.15); color: #c4b5fd; border-color: rgba(139,92,246,0.3); }
      `}</style>
    </div>
  )
}