import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Sparkles,
  Copy,
  Check,
  Trash2,
  Code,
  FileText,
  Lightbulb,
  Wand2,
  Download,
  GitBranch,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RotateCw,
  History,
} from 'lucide-react'

type Lang = 'javascript' | 'typescript' | 'python' | 'go' | 'rust' | 'java' | 'css' | 'html'
type RefactorType = 'extract' | 'rename' | 'simplify' | 'modernize' | 'optimize' | 'add-types'

interface RefactorSuggestion {
  id: string
  type: RefactorType
  title: string
  description: string
  original: string
  refactored: string
  confidence: number
  rationale: string
}

interface HistoryItem {
  id: string
  timestamp: number
  original: string
  refactored: string
  suggestions: number
  language: Lang
}

const LANG_OPTIONS: { value: Lang; label: string; icon: string }[] = [
  { value: 'javascript', label: 'JavaScript', icon: 'JS' },
  { value: 'typescript', label: 'TypeScript', icon: 'TS' },
  { value: 'python', label: 'Python', icon: 'Py' },
  { value: 'go', label: 'Go', icon: 'Go' },
  { value: 'rust', label: 'Rust', icon: 'Rs' },
  { value: 'java', label: 'Java', icon: 'Java' },
  { value: 'css', label: 'CSS', icon: 'CSS' },
  { value: 'html', label: 'HTML', icon: 'HTML' },
]

const REFACTOR_TYPES: { value: RefactorType; label: string; desc: string }[] = [
  { value: 'extract', label: '提取函数', desc: '将重复代码提取为独立函数' },
  { value: 'rename', label: '重命名', desc: '改进变量/函数命名可读性' },
  { value: 'simplify', label: '简化代码', desc: '减少复杂度，去除冗余' },
  { value: 'modernize', label: '现代化', desc: '使用现代语法和最佳实践' },
  { value: 'optimize', label: '性能优化', desc: '提升运行时性能' },
  { value: 'add-types', label: '添加类型', desc: '为无类型代码添加类型注解' },
]

const SAMPLES: Record<Lang, string> = {
  javascript: `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}

function filterItems(items, minPrice) {
  var result = [];
  for (var i = 0; i < items.length; i++) {
    if (items[i].price > minPrice) {
      result.push(items[i]);
    }
  }
  return result;
}

function processOrder(order) {
  var subtotal = calculateTotal(order.items);
  var discount = 0;
  if (order.customer.isVip) {
    discount = subtotal * 0.1;
  }
  var shipping = 10;
  if (subtotal > 100) {
    shipping = 0;
  }
  var tax = (subtotal - discount) * 0.08;
  return {
    subtotal: subtotal,
    discount: discount,
    shipping: shipping,
    tax: tax,
    total: subtotal - discount + shipping + tax
  };
}`,
  typescript: `interface UserData {
  name: string;
  age: number;
  email?: string;
}

function processUserData(data) {
  const result = {};
  result.name = data.name.toUpperCase();
  result.age = data.age;
  if (data.email) {
    result.emailVerified = data.email.includes('@');
  }
  result.status = data.age > 18 ? 'adult' : 'minor';
  return result;
}

const users = [];
for (let i = 0; i < 100; i++) {
  users.push({ id: i, processed: null });
}
users.forEach(user => {
  const userData = fetchUserData(user.id);
  user.processed = processUserData(userData);
});`,
  python: `def process_data(data):
    result = []
    for item in data:
        if item['value'] > 0:
            transformed = item['value'] * 2
            if transformed > 100:
                result.append({
                    'id': item['id'],
                    'value': transformed,
                    'category': 'high'
                })
            else:
                result.append({
                    'id': item['id'],
                    'value': transformed,
                    'category': 'normal'
                })
    return result

def calculate_statistics(numbers):
    total = 0
    count = 0
    minimum = numbers[0]
    maximum = numbers[0]
    for n in numbers:
        total += n
        count += 1
        if n < minimum:
            minimum = n
        if n > maximum:
            maximum = n
    return {
        'mean': total / count,
        'min': minimum,
        'max': maximum,
        'count': count
    }`,
  go: `package main

import "fmt"

type User struct {
    Name string
    Age  int
}

func ProcessUsers(users []User) map[string]User {
    result := make(map[string]User)
    for _, user := range users {
        if user.Age >= 18 {
            result[user.Name] = user
        }
    }
    return result
}

func CalculateSum(numbers []int) int {
    sum := 0
    for _, n := range numbers {
        sum += n
    }
    return sum
}

func main() {
    users := []User{
        {"Alice", 25},
        {"Bob", 17},
        {"Charlie", 30},
    }
    adults := ProcessUsers(users)
    fmt.Printf("Adults: %v\\n", adults)
}`,
  rust: `use std::collections::HashMap;

#[derive(Debug)]
struct User {
    name: String,
    age: u32,
}

fn process_users(users: Vec<User>) -> HashMap<String, User> {
    let mut result = HashMap::new();
    for user in users {
        if user.age >= 18 {
            result.insert(user.name.clone(), user);
        }
    }
    result
}

fn calculate_average(numbers: Vec<f64>) -> f64 {
    if numbers.is_empty() {
        return 0.0;
    }
    let sum: f64 = numbers.iter().sum();
    sum / numbers.len() as f64
}

fn main() {
    let users = vec![
        User { name: "Alice".into(), age: 25 },
        User { name: "Bob".into(), age: 17 },
    ];
    let adults = process_users(users);
    println!("Adults: {:?}", adults);
}`,
  java: `public class DataProcessor {
    public static List<Result> processData(List<Item> items) {
        List<Result> results = new ArrayList<>();
        for (Item item : items) {
            if (item.getValue() > 0) {
                int transformed = item.getValue() * 2;
                String category = transformed > 100 ? "HIGH" : "NORMAL";
                results.add(new Result(item.getId(), transformed, category));
            }
        }
        return results;
    }

    public static Statistics calculateStats(List<Integer> numbers) {
        int sum = 0;
        int min = numbers.get(0);
        int max = numbers.get(0);
        for (int n : numbers) {
            sum += n;
            min = Math.min(min, n);
            max = Math.max(max, n);
        }
        double mean = (double) sum / numbers.size();
        return new Statistics(mean, min, max, numbers.size());
    }
}`,
  css: `.old-button {
  background-color: #3498db;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.old-button:hover {
  background-color: #2980b9;
}

.old-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.old-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.old-input:focus {
  border-color: #3498db;
  outline: none;
}`,
  html: `<div class="container">
  <h1 style="color: blue; font-size: 24px;">My Page Title</h1>
  <p style="color: gray; font-size: 14px;">Welcome to my website!</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
  <button onclick="alert('Hello!')">Click Me</button>
</div>`,
}

function analyzeCode(code: string, language: Lang, refactorType: RefactorType): RefactorSuggestion[] {
  const suggestions: RefactorSuggestion[] = []
  
  if (refactorType === 'simplify') {
    if (code.includes('for (var') || code.includes('for (let') || code.includes('for i = 0')) {
      suggestions.push({
        id: '1',
        type: 'simplify',
        title: '使用forEach替代传统for循环',
        description: '使用现代数组方法提高可读性',
        original: code.match(/for\s*\(\s*(var|let|const)\s+\w+\s*=\s*0;\s*\w+\s*<\s*\w+\.length;\s*\w+\+\+\s*\)\s*\{[^}]+\}/)?.[0] || 'for (var i = 0; i < items.length; i++) { ... }',
        refactored: 'items.forEach(item => { ... })',
        confidence: 0.92,
        rationale: 'forEach更声明式，减少手动索引管理，代码更简洁。对于异步或需要break的场景除外。',
      })
    }
    
    if (code.match(/var\s+\w+\s*=\s*\[\]/) || code.match(/var\s+\w+\s*=\s*\{\}/)) {
      suggestions.push({
        id: '2',
        type: 'simplify',
        title: '使用const/let替代var声明',
        description: '现代变量声明方式',
        original: 'var result = [];',
        refactored: 'const result = [];',
        confidence: 0.95,
        rationale: 'const/let提供更好的作用域管理，const明确表示引用不可变，有助于代码意图表达。',
      })
    }
  }
  
  if (refactorType === 'modernize') {
    if (code.includes('function ') && !code.includes('=>')) {
      suggestions.push({
        id: '3',
        type: 'modernize',
        title: '使用箭头函数',
        description: '现代函数语法',
        original: 'function calculate(a, b) { return a + b; }',
        refactored: 'const calculate = (a, b) => a + b;',
        confidence: 0.88,
        rationale: '箭头函数更简洁，且正确捕获this上下文。注意：需要在回调或方法定义中谨慎使用。',
      })
    }
    
    if (code.match(/\.push\(.*\)/) && code.includes('for')) {
      suggestions.push({
        id: '4',
        type: 'modernize',
        title: '使用数组方法替代push循环',
        description: '使用map/filter/reduce组合',
        original: 'const result = [];\nfor (const item of items) {\n  if (item.active) {\n    result.push(item.name);\n  }\n}',
        refactored: 'const result = items\n  .filter(item => item.active)\n  .map(item => item.name);',
        confidence: 0.9,
        rationale: '函数式组合更声明式，可读性更强，且易于链式组合和测试。',
      })
    }
  }
  
  if (refactorType === 'optimize') {
    if (code.includes('for') && code.includes('.includes(') || code.includes('.indexOf(')) {
      suggestions.push({
        id: '5',
        type: 'optimize',
        title: '使用Set进行O(1)查找',
        description: '提升查找性能',
        original: 'const exists = items.some(item => item.id === targetId);',
        refactored: 'const idSet = new Set(items.map(i => i.id));\nconst exists = idSet.has(targetId);',
        confidence: 0.85,
        rationale: '当需要多次查找时，Set的O(1)查找性能远优于数组的O(n)遍历。一次性构建，多次受益。',
      })
    }
  }
  
  if (refactorType === 'extract') {
    if (code.includes('if') && code.includes('return') && code.split('{').length > 4) {
      suggestions.push({
        id: '6',
        type: 'extract',
        title: '提取条件判断为独立函数',
        description: '提高可测试性和复用性',
        original: 'if (order.customer.isVip && order.total > 100 && !order.processed) { ... }',
        refactored: 'const isEligibleForDiscount = (order) => \n  order.customer.isVip && order.total > 100 && !order.processed;\n\nif (isEligibleForDiscount(order)) { ... }',
        confidence: 0.82,
        rationale: '复杂条件提取为命名函数后，代码意图更清晰，便于单元测试和复用。',
      })
    }
  }
  
  if (refactorType === 'add-types' && (language === 'javascript' || language === 'python')) {
    if (language === 'javascript') {
      suggestions.push({
        id: '7',
        type: 'add-types',
        title: '添加TypeScript类型定义',
        description: '增强类型安全性',
        original: 'function processData(data) { return data.map(x => x.value); }',
        refactored: 'interface DataItem {\n  value: number;\n  id: string;\n}\n\nfunction processData(data: DataItem[]): number[] {\n  return data.map(x => x.value);\n}',
        confidence: 0.9,
        rationale: '类型定义在编译期捕获错误，提供IDE智能提示，大幅提升大型项目的可维护性。',
      })
    }
  }
  
  if (refactorType === 'rename') {
    suggestions.push({
      id: '8',
      type: 'rename',
      title: '改进变量命名',
      description: '使用语义化命名',
      original: 'const d = new Date();\nconst t = d.getTime();\nconst r = t % 1000;',
      refactored: 'const now = new Date();\nconst timestamp = now.getTime();\nconst remainder = timestamp % 1000;',
      confidence: 0.88,
      rationale: '清晰的命名是代码自文档化的关键，减少认知负担，提升协作效率。',
    })
  }
  
  return suggestions
}

function generateRefactoredCode(code: string, language: Lang, refactorType: RefactorType): string {
  let result = code
  
  if (refactorType === 'modernize' && language === 'javascript') {
    result = result.replace(/var\s+(\w+)\s*=/g, 'const $1 =')
    result = result.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*\{/g, 'const $1 = ($2) => {')
  }
  
  if (refactorType === 'simplify') {
    const forLoopRegex = /for\s*\(\s*(var|let|const)\s+(\w+)\s*=\s*0;\s*\2\s*<\s*(\w+)\.length;\s*\2\+\+\s*\)\s*\{([^}]+)\}/g
    result = result.replace(forLoopRegex, (_, _decl, idx, arr, body) => {
      const cleanedBody = body.replace(new RegExp(`${arr}\\[${idx}\\]`, 'g'), 'item')
      return `${arr}.forEach(item => {${cleanedBody}})`
    })
  }
  
  if (refactorType === 'add-types' && language === 'typescript') {
    result = result.replace(/function\s+(\w+)\s*\(([^)]*)\)/g, (_match, funcName, params) => {
      const typedParams = params.split(',').map((p: string) => {
        const trimmed = p.trim()
        if (!trimmed) return p
        if (trimmed.includes(':')) return trimmed
        return `${trimmed}: any`
      }).join(', ')
      return `function ${funcName}(${typedParams}): any`
    })
  }
  
  return result
}

export default function CodeRefactorAI() {
  const [code, setCode] = useState(SAMPLES.javascript)
  const [language, setLanguage] = useState<Lang>('javascript')
  const [refactorType, setRefactorType] = useState<RefactorType>('simplify')
  const [processing, setProcessing] = useState(false)
  const [suggestions, setSuggestions] = useState<RefactorSuggestion[]>([])
  const [refactoredCode, setRefactoredCode] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>('1')
  const [showOriginal] = useState(true)
  void showOriginal
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('code-refactor-history')
      if (saved) setHistory(JSON.parse(saved))
    } catch {}
  }, [])

  const saveHistory = useCallback((item: HistoryItem) => {
    const next = [item, ...history].slice(0, 20)
    setHistory(next)
    try {
      localStorage.setItem('code-refactor-history', JSON.stringify(next))
    } catch {}
  }, [history])

  const loadSample = useCallback(() => {
    setCode(SAMPLES[language])
    setError('')
  }, [language])

  const clearAll = useCallback(() => {
    setCode('')
    setSuggestions([])
    setRefactoredCode('')
    setError('')
  }, [])

  const refactor = useCallback(async () => {
    if (!code.trim()) {
      setError('请输入需要重构的代码')
      return
    }
    setProcessing(true)
    setError('')

    await new Promise((r) => setTimeout(r, 600))

    try {
      const newSuggestions = analyzeCode(code, language, refactorType)
      const newRefactored = generateRefactoredCode(code, language, refactorType)
      
      setSuggestions(newSuggestions)
      setRefactoredCode(newRefactored)
      setExpandedId(newSuggestions[0]?.id || null)

      saveHistory({
        id: Date.now().toString(),
        timestamp: Date.now(),
        original: code.slice(0, 100),
        refactored: newRefactored.slice(0, 100),
        suggestions: newSuggestions.length,
        language,
      })
    } catch (e: any) {
      setError('分析失败: ' + e.message)
    } finally {
      setProcessing(false)
    }
  }, [code, language, refactorType, saveHistory])

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }, [])

  const downloadCode = useCallback(() => {
    const blob = new Blob([refactoredCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `refactored-${Date.now()}.${language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language}`
    a.click()
    URL.revokeObjectURL(url)
  }, [refactoredCode, language])

  const confidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return '#22c55e'
    if (confidence >= 0.75) return '#f59e0b'
    return '#ef4444'
  }

  const stats = useMemo(() => ({
    originalLines: code.split('\n').length,
    originalChars: code.length,
    refactoredLines: refactoredCode.split('\n').length,
    refactoredChars: refactoredCode.length,
    suggestions: suggestions.length,
    avgConfidence: suggestions.length > 0
      ? Math.round((suggestions.reduce((s, x) => s + x.confidence, 0) / suggestions.length) * 100)
      : 0,
  }), [code, refactoredCode, suggestions])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
      color: '#e2e8f0',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <GitBranch size={18} color="#a78bfa" />
          <span style={{ fontSize: 15, fontWeight: 600 }}>AI 代码重构助手</span>
          <span style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 10,
            background: 'rgba(167,139,250,0.15)',
            color: '#a78bfa',
          }}>智能代码分析与重构建议</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {stats.suggestions > 0 && (
            <span style={{
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(34,197,94,0.12)',
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <Sparkles size={12} /> {stats.suggestions} 条建议 · 平均 {stats.avgConfidence}% 置信度
            </span>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 12,
        padding: '10px 20px',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>语言</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Lang)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 6,
              padding: '5px 10px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {LANG_OPTIONS.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>重构类型</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {REFACTOR_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setRefactorType(t.value)}
                title={t.desc}
                style={{
                  padding: '5px 10px',
                  fontSize: 11,
                  borderRadius: 6,
                  border: refactorType === t.value ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.1)',
                  background: refactorType === t.value ? 'rgba(167,139,250,0.15)' : 'transparent',
                  color: refactorType === t.value ? '#a78bfa' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={loadSample}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          <FileText size={13} /> 加载示例
        </button>

        <button
          onClick={clearAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid rgba(239,68,68,0.3)',
            background: 'transparent',
            color: '#ef4444',
            cursor: 'pointer',
          }}
        >
          <Trash2 size={13} /> 清空
        </button>

        <button
          onClick={refactor}
          disabled={processing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 16px',
            fontSize: 12,
            borderRadius: 6,
            border: 'none',
            background: processing ? 'rgba(167,139,250,0.4)' : 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            color: 'white',
            cursor: processing ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            boxShadow: processing ? 'none' : '0 0 20px rgba(167,139,250,0.3)',
          }}
        >
          {processing ? (
            <>
              <RotateCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
              分析中...
            </>
          ) : (
            <>
              <Sparkles size={13} /> 开始重构
            </>
          )}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '8px 20px',
          background: 'rgba(239,68,68,0.1)',
          borderBottom: '1px solid rgba(239,68,68,0.3)',
          color: '#ef4444',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        <div style={{
          width: '50%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Code size={14} color="#94a3b8" />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>原始代码</span>
              <span style={{ fontSize: 10, color: '#64748b' }}>
                {stats.originalLines} 行 · {stats.originalChars} 字符
              </span>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            style={{
              flex: 1,
              padding: '16px 20px',
              background: 'rgba(0,0,0,0.3)',
              color: '#e2e8f0',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: 12,
              lineHeight: 1.6,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
            placeholder="在此粘贴需要重构的代码..."
          />
        </div>

        <div style={{
          width: '50%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wand2 size={14} color="#a78bfa" />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>重构建议 & 结果</span>
              {refactoredCode && (
                <span style={{ fontSize: 10, color: '#64748b' }}>
                  {stats.refactoredLines} 行 · {stats.refactoredChars} 字符
                </span>
              )}
            </div>
            {refactoredCode && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => copyToClipboard(refactoredCode)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    fontSize: 11,
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  {copied ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                  {copied ? '已复制' : '复制'}
                </button>
                <button
                  onClick={downloadCode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    fontSize: 11,
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  <Download size={12} /> 下载
                </button>
              </div>
            )}
          </div>

          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '16px 20px',
          }}>
            {suggestions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.08)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        cursor: 'pointer',
                        background: 'rgba(167,139,250,0.05)',
                      }}
                    >
                      <span style={{
                        fontSize: 10,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: 'rgba(167,139,250,0.2)',
                        color: '#c4b5fd',
                      }}>
                        {REFACTOR_TYPES.find(t => t.value === s.type)?.label}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{s.title}</span>
                      <span style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: confidenceColor(s.confidence) + '22',
                        color: confidenceColor(s.confidence),
                      }}>
                        {Math.round(s.confidence * 100)}%
                      </span>
                      {expandedId === s.id ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />}
                    </div>
                    {expandedId === s.id && (
                      <div style={{ padding: '12px 16px' }}>
                        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10, lineHeight: 1.6 }}>
                          {s.description}
                        </p>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 8,
                          marginBottom: 10,
                        }}>
                          <div>
                            <div style={{ fontSize: 10, color: '#ef4444', marginBottom: 4 }}>原代码</div>
                            <pre style={{
                              background: 'rgba(239,68,68,0.1)',
                              borderRadius: 6,
                              padding: 10,
                              fontSize: 11,
                              color: '#fca5a5',
                              overflow: 'auto',
                              maxHeight: 120,
                              whiteSpace: 'pre-wrap',
                            }}>{s.original}</pre>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: '#22c55e', marginBottom: 4 }}>重构后</div>
                            <pre style={{
                              background: 'rgba(34,197,94,0.1)',
                              borderRadius: 6,
                              padding: 10,
                              fontSize: 11,
                              color: '#86efac',
                              overflow: 'auto',
                              maxHeight: 120,
                              whiteSpace: 'pre-wrap',
                            }}>{s.refactored}</pre>
                          </div>
                        </div>
                        <div style={{
                          padding: '8px 12px',
                          background: 'rgba(167,139,250,0.08)',
                          borderRadius: 6,
                          border: '1px solid rgba(167,139,250,0.2)',
                          fontSize: 11,
                          color: '#c4b5fd',
                          lineHeight: 1.6,
                          display: 'flex',
                          gap: 8,
                        }}>
                          <Lightbulb size={13} style={{ flexShrink: 0 }} />
                          <span><strong>理由：</strong>{s.rationale}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : refactoredCode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(34,197,94,0.08)',
                  borderRadius: 10,
                  border: '1px solid rgba(34,197,94,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <Check size={16} color="#22c55e" />
                  <span style={{ fontSize: 13, color: '#86efac' }}>重构完成！建议查看下方代码改进。</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>重构后代码预览</div>
                  <pre style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 10,
                    padding: 16,
                    fontSize: 12,
                    color: '#e2e8f0',
                    overflow: 'auto',
                    maxHeight: 300,
                    lineHeight: 1.6,
                  }}>{refactoredCode}</pre>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#475569',
                gap: 12,
              }}>
                <Wand2 size={32} />
                <span style={{ fontSize: 13 }}>选择重构类型并点击「开始重构」</span>
                <span style={{ fontSize: 11 }}>获取智能代码改进建议</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div style={{
          maxHeight: 100,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '8px 20px',
          overflow: 'auto',
        }}>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>重构历史（最近20条）</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {history.slice(0, 8).map(h => (
              <div
                key={h.id}
                onClick={() => {
                  setCode(h.original)
                  setLanguage(h.language)
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 10,
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <History size={10} />
                {h.language} · {h.suggestions}条建议
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
      `}</style>
    </div>
  )
}
