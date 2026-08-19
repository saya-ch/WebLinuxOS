import { useState, useCallback } from 'react';
import { chat } from '../services/aiService';
import type { AIMessage } from '../services/aiService';

/**
 * AI代码片段生成器
 * 基于Pollinations AI API的专业代码片段生成工具
 * 支持多种语言、多种类型的代码生成
 */

type SnippetType = 'function' | 'class' | 'algorithm' | 'api' | 'test' | 'config' | 'sql';
type Language = 'javascript' | 'typescript' | 'python' | 'go' | 'rust' | 'java' | 'cpp' | 'bash' | 'sql' | 'html' | 'css' | 'json';

interface SnippetTemplate {
  id: SnippetType;
  name: string;
  description: string;
  icon: string;
}

interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  language: Language;
  type: SnippetType;
  code: string;
}

const SNIPPET_TYPES: SnippetTemplate[] = [
  { id: 'function', name: '函数/方法', description: '生成通用函数或方法', icon: 'ƒ' },
  { id: 'class', name: '类/组件', description: '生成类或组件定义', icon: '◇' },
  { id: 'algorithm', name: '算法实现', description: '生成算法或数据结构', icon: '⚡' },
  { id: 'api', name: 'API 端点', description: '生成REST API路由处理', icon: '⇄' },
  { id: 'test', name: '单元测试', description: '生成测试用例', icon: '✓' },
  { id: 'config', name: '配置文件', description: '生成配置代码', icon: '⚙' },
  { id: 'sql', name: 'SQL 查询', description: '生成SQL语句', icon: '▤' },
];

const LANGUAGES: { id: Language; name: string; icon: string }[] = [
  { id: 'javascript', name: 'JavaScript', icon: 'JS' },
  { id: 'typescript', name: 'TypeScript', icon: 'TS' },
  { id: 'python', name: 'Python', icon: 'Py' },
  { id: 'go', name: 'Go', icon: 'Go' },
  { id: 'rust', name: 'Rust', icon: 'Rs' },
  { id: 'java', name: 'Java', icon: 'Jv' },
  { id: 'cpp', name: 'C++', icon: 'C+' },
  { id: 'bash', name: 'Bash', icon: 'Sh' },
  { id: 'sql', name: 'SQL', icon: 'SQL' },
  { id: 'html', name: 'HTML', icon: '<>' },
  { id: 'css', name: 'CSS', icon: '{}' },
  { id: 'json', name: 'JSON', icon: '{}' },
];

const EXAMPLES: Record<SnippetType, string> = {
  function: '一个防抖函数，支持立即执行选项',
  class: '一个实现迭代器模式的自定义集合类',
  algorithm: '快速排序算法，支持自定义比较函数',
  api: '一个Express.js的JWT认证中间件端点',
  test: '为一个React组件编写的单元测试',
  config: '一个Docker Compose配置，包含PostgreSQL和Redis',
  sql: '一个多表连接查询，统计每个部门的平均薪资',
};

export default function AISnippetGenerator() {
  const [prompt, setPrompt] = useState('');
  const [selectedType, setSelectedType] = useState<SnippetType>('function');
  const [selectedLang, setSelectedLang] = useState<Language>('javascript');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [temperature, setTemperature] = useState(0.7);

  const buildPrompt = useCallback(() => {
    const example = EXAMPLES[selectedType];
    const userPrompt = prompt.trim() || example;
    
    const langName = LANGUAGES.find(l => l.id === selectedLang)?.name || selectedLang;
    const typeName = SNIPPET_TYPES.find(t => t.id === selectedType)?.name || selectedType;
    
    return `Generate a ${typeName} in ${langName} for the following requirement:\n\n"${userPrompt}"\n\nRequirements:\n- Production-ready code with error handling\n- Clear variable and function names\n- Follow best practices for ${langName}\n- Include brief inline comments for complex logic\n- Only output the code, no explanation text`;
  }, [prompt, selectedType, selectedLang]);

  const generateCode = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError('');
    setGeneratedCode('');
    setCopied(false);

    try {
      const fullPrompt = buildPrompt();
      
      const messages: AIMessage[] = [
        { role: 'system', content: 'You are an expert programmer. Generate production-ready code. Only output the code itself, no explanations, no markdown formatting.' },
        { role: 'user', content: fullPrompt },
      ];
      
      const text = await chat(messages, {
        temperature: temperature,
        timeout: 60_000,
      });
      
      // 清理响应，移除可能的markdown代码块标记
      let cleanCode = text.trim();
      if (cleanCode.startsWith('```')) {
        const lines = cleanCode.split('\n');
        // 移除第一行（```javascript 或类似的）
        lines.shift();
        // 移除最后一行（```）
        if (lines.length > 0 && lines[lines.length - 1].trim() === '```') {
          lines.pop();
        }
        cleanCode = lines.join('\n').trim();
      }
      
      setGeneratedCode(cleanCode);
      
      // 添加到历史
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        prompt: prompt || EXAMPLES[selectedType],
        language: selectedLang,
        type: selectedType,
        code: cleanCode,
      };
      setHistory(prev => [historyItem, ...prev].slice(0, 20));
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误';
      setError(`生成失败: ${message}`);
      
      // 提供本地回退示例
      setGeneratedCode(getLocalFallback());
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, buildPrompt, temperature, prompt, selectedType, selectedLang]);

  const getLocalFallback = () => {
    const examples: Record<string, string> = {
      javascript: `// ${SNIPPET_TYPES.find(t => t.id === selectedType)?.name} - ${prompt || EXAMPLES[selectedType]}
// 注意：这是本地回退示例，API暂不可用

export function debounce(fn, delay = 300, immediate = false) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    if (immediate && !timer) {
      fn.apply(this, args);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}`,
      typescript: `export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number = 300,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    if (immediate && !timer) {
      fn.apply(this, args);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}`,
      python: `from collections.abc import Callable
from functools import wraps
import time

def timer(func: Callable) -> Callable:
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        print(f"{func.__name__} took {end - start:.4f}s")
        return result
    return wrapper`,
    go: `package main

import (
    "fmt"
    "time"
)

func debounce(fn func(), delay time.Duration) func() {
    var timer *time.Timer
    return func() {
        if timer != nil {
            timer.Stop()
        }
        timer = time.AfterFunc(delay, fn)
    }
}`,
      rust: `use std::time::{Duration, Instant};

pub fn measure_time<F: FnOnce()>(f: F) -> Duration {
    let start = Instant::now();
    f();
    start.elapsed()
}`,
      java: `public class EventBus {
    private final Map<Class<?>, List<Subscriber>> subscribers = new ConcurrentHashMap<>();
    
    public <T> void subscribe(Class<T> eventType, Consumer<T> handler) {
        subscribers.computeIfAbsent(eventType, k -> new CopyOnWriteArrayList<>())
                 .add(new Subscriber(handler));
    }
    
    @SuppressWarnings("unchecked")
    public <T> void publish(T event) {
        List<Subscriber> handlers = subscribers.get(event.getClass());
        if (handlers != null) {
            handlers.forEach(h -> ((Consumer<T>) h.handler).accept(event));
        }
    }
    
    private record Subscriber(Object handler) {}
}`,
      cpp: `template<typename Func, typename... Args>
auto measure_execution_time(Func&& func, Args&&... args) {
    auto start = std::chrono::high_resolution_clock::now();
    auto result = func(std::forward<Args>(args)...);
    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
    return std::make_pair(result, duration);
}`,
      bash: `#!/bin/bash
# 系统健康检查脚本
set -euo pipefail

check_disk_usage() {
    local threshold=\${1:-90}
    echo "检查磁盘使用率（阈值: \${threshold}%）..."
    df -h | awk -v threshold="\$threshold" '{if (\$5 ~ /%/ && int(\$5) >= threshold) print "警告: " \$6 " 使用率 " \$5}'
}

check_memory() {
    echo "内存状态:"
    free -h | grep "Mem:"
}`,
      sql: `-- 员工薪资分析查询
WITH department_stats AS (
    SELECT 
        d.dept_name,
        COUNT(e.emp_id) AS employee_count,
        AVG(e.salary) AS avg_salary,
        MAX(e.salary) AS max_salary,
        MIN(e.salary) AS min_salary
    FROM departments d
    JOIN employees e ON d.dept_id = e.dept_id
    WHERE e.status = 'active'
    GROUP BY d.dept_name
)
SELECT * FROM department_stats
ORDER BY avg_salary DESC;`,
      html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>响应式卡片组件</title>
    <style>
        .card-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            padding: 2rem;
        }
        .card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 1.5rem;
            color: white;
            transition: transform 0.3s ease;
        }
        .card:hover { transform: translateY(-4px); }
    </style>
</head>
<body>
    <div class="card-container">
        <div class="card"><h3>卡片标题</h3><p>卡片描述内容</p></div>
    </div>
</body>
</html>`,
      css: `.glass-panel {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    padding: 24px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.glass-panel:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
}`,
      json: `{
  "name": "web-api-project",
  "version": "1.0.0",
  "config": {
    "port": 3000,
    "database": {
      "host": "localhost",
      "port": 5432,
      "name": "app_db",
      "pool_size": 10
    },
    "cache": {
      "type": "redis",
      "ttl": 3600,
      "max_memory": "256mb"
    }
  }
}`,
    };
    return examples[selectedLang] || examples.javascript;
  };

  const copyCode = useCallback(async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 回退方法
      const textarea = document.createElement('textarea');
      textarea.value = generatedCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedCode]);

  const downloadCode = useCallback(() => {
    if (!generatedCode) return;
    const extMap: Record<Language, string> = {
      javascript: 'js', typescript: 'ts', python: 'py',
      go: 'go', rust: 'rs', java: 'java', cpp: 'cpp',
      bash: 'sh', sql: 'sql', html: 'html', css: 'css', json: 'json'
    };
    const ext = extMap[selectedLang] || 'txt';
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snippet-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedCode, selectedLang]);

  const loadFromHistory = useCallback((item: HistoryItem) => {
    setSelectedType(item.type);
    setSelectedLang(item.language);
    setPrompt(item.prompt);
    setGeneratedCode(item.code);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return (
    <div style={{
      padding: '20px',
      height: '100%',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: '#e0e0e0',
      fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
      overflow: 'auto',
    }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
        }}>✦</div>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>AI 代码片段生成器</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#aaa' }}>基于Pollinations AI · 生产就绪的代码生成</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* 左侧控制面板 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* 类型选择 */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '10px', fontWeight: 500 }}>
              代码类型
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SNIPPET_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: selectedType === type.id ? '#667eea' : 'rgba(255,255,255,0.15)',
                    background: selectedType === type.id ? 'rgba(102,126,234,0.2)' : 'rgba(255,255,255,0.05)',
                    color: selectedType === type.id ? '#fff' : '#ccc',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title={type.description}
                >
                  <span style={{ fontSize: '15px' }}>{type.icon}</span>
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* 语言选择 */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '10px', fontWeight: 500 }}>
              编程语言
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLang(lang.id)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: selectedLang === lang.id ? '#764ba2' : 'rgba(255,255,255,0.1)',
                    background: selectedLang === lang.id ? 'rgba(118,75,162,0.2)' : 'rgba(255,255,255,0.03)',
                    color: selectedLang === lang.id ? '#fff' : '#bbb',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s',
                    fontFamily: 'monospace',
                  }}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          {/* 需求描述 */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '10px', fontWeight: 500 }}>
              需求描述
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`描述你想生成的代码，例如：${EXAMPLES[selectedType]}`}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: '#e0e0e0',
                fontSize: '13px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
              留空将使用默认示例
            </div>
          </div>

          {/* 参数控制 */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '10px', fontWeight: 500 }}>
              生成参数
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#bbb' }}>创造性 (Temperature):</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#667eea' }}
              />
              <span style={{ fontSize: '13px', color: '#667eea', minWidth: '30px', textAlign: 'right' }}>
                {temperature.toFixed(1)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666', marginTop: '4px' }}>
              <span>更稳定</span>
              <span>更有创意</span>
            </div>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={generateCode}
            disabled={isGenerating}
            style={{
              padding: '14px 20px',
              borderRadius: '10px',
              border: 'none',
              background: isGenerating 
                ? 'rgba(102,126,234,0.5)' 
                : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isGenerating ? (
              <>
                <span style={{ 
                  width: '16px', 
                  height: '16px', 
                  border: '2px solid rgba(255,255,255,0.3)', 
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                生成中...
              </>
            ) : (
              <>
                <span>⚡</span>
                生成代码
              </>
            )}
          </button>

          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(231,76,60,0.2)',
              border: '1px solid rgba(231,76,60,0.4)',
              color: '#ff9080',
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}
        </div>

        {/* 右侧代码输出 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            flex: 1,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={copyCode}
                  disabled={!generatedCode}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: copied ? 'rgba(39,201,63,0.2)' : 'transparent',
                    color: copied ? '#27c93f' : '#ccc',
                    cursor: !generatedCode ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s',
                  }}
                >
                  {copied ? '✓ 已复制' : '📋 复制'}
                </button>
                <button
                  onClick={downloadCode}
                  disabled={!generatedCode}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'transparent',
                    color: '#ccc',
                    cursor: !generatedCode ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                  }}
                >
                  ⬇ 下载
                </button>
              </div>
            </div>
            <pre style={{
              margin: 0,
              padding: '16px',
              minHeight: '300px',
              maxHeight: '500px',
              overflow: 'auto',
              background: 'rgba(0,0,0,0.4)',
              color: '#e0e0e0',
              fontSize: '13px',
              lineHeight: '1.6',
              fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {generatedCode || (
                <span style={{ color: '#666' }}>
                  {isGenerating ? '正在生成代码...' : '点击"生成代码"按钮开始'}
                </span>
              )}
            </pre>
          </div>

          {/* 历史记录 */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px' 
            }}>
              <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 500 }}>
                历史记录 ({history.length})
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  清空
                </button>
              )}
            </div>
            <div style={{ maxHeight: '120px', overflow: 'auto' }}>
              {history.length === 0 ? (
                <div style={{ color: '#555', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                  暂无历史记录
                </div>
              ) : (
                history.map(item => (
                  <button
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      marginBottom: '6px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#bbb',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ 
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(102,126,234,0.2)',
                      fontSize: '10px',
                      color: '#667eea',
                    }}>
                      {LANGUAGES.find(l => l.id === item.language)?.icon}
                    </span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.prompt}
                    </span>
                    <span style={{ fontSize: '10px', color: '#666' }}>
                      {new Date(item.timestamp).toLocaleTimeString('zh-CN')}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
