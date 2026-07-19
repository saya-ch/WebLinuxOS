import { useState, useCallback, useRef, useEffect } from 'react'
import { useStore } from '../store'

/**
 * CodeRunnerAdvanced - 高级代码运行器
 * 支持JavaScript/TypeScript实时执行，带有控制台输出捕获
 */

interface ConsoleEntry {
  type: 'log' | 'error' | 'warn' | 'info' | 'result'
  content: string
  time: string
}

const EXAMPLES = {
  javascript: `// JavaScript 示例代码
// 尝试运行各种JavaScript代码

// 数组操作
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log('原始数组:', numbers);
console.log('翻倍后:', doubled);

// 对象解构
const user = { name: '张三', age: 25, city: '北京' };
const { name, age } = user;
console.log(\`用户: \${name}, 年龄: \${age}\`);

// 异步操作模拟
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
console.log('开始等待...');
// 注意: 异步操作可能不会立即显示

// 数学计算
const result = Math.pow(2, 10);
console.log('2^10 =', result);
`,

  algorithms: `// 算法示例 - 快速排序

function quickSort(arr) {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  
  return [...quickSort(left), ...middle, ...quickSort(right)];
}

const unsorted = [64, 34, 25, 12, 22, 11, 90, 5, 77, 30];
console.log('原始数组:', unsorted);

const sorted = quickSort([...unsorted]);
console.log('排序结果:', sorted);

// 二分查找
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

const target = 25;
const index = binarySearch(sorted, target);
console.log(\`查找 \${target}: 索引 \${index}\`);
`,

  dom: `// DOM 操作模拟
// 在沙盒环境中，我们模拟DOM操作

const virtualDOM = {
  elements: [],
  createElement(tag) {
    return {
      tag,
      children: [],
      attributes: {},
      textContent: '',
      setAttribute(name, value) {
        this.attributes[name] = value;
      },
      appendChild(child) {
        this.children.push(child);
      }
    };
  }
};

// 创建虚拟DOM结构
const div = virtualDOM.createElement('div');
div.setAttribute('class', 'container');

const h1 = virtualDOM.createElement('h1');
h1.textContent = 'Hello WebLinuxOS';
div.appendChild(h1);

const ul = virtualDOM.createElement('ul');
for (let i = 1; i <= 3; i++) {
  const li = virtualDOM.createElement('li');
  li.textContent = \`项目 \${i}\`;
  ul.appendChild(li);
}
div.appendChild(ul);

console.log('虚拟DOM结构:');
console.log(JSON.stringify(div, null, 2));
`,

  functional: `// 函数式编程示例

// 高阶函数
const compose = (...fns) => x => fns.reduceRight((acc, fn) => fn(acc), x);
const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);

// 工具函数
const double = x => x * 2;
const addOne = x => x + 1;
const square = x => x * x;

// 组合函数
const transform = pipe(double, addOne, square);
console.log('pipe(double, addOne, square)(3):', transform(3));

// 柯里化
const curry = (fn) => {
  const arity = fn.length;
  return function curried(...args) {
    if (args.length >= arity) return fn(...args);
    return (...more) => curried(...args, ...more);
  };
};

const curriedAdd = curry((a, b, c) => a + b + c);
console.log('curriedAdd(1)(2)(3):', curriedAdd(1)(2)(3));
console.log('curriedAdd(1, 2)(3):', curriedAdd(1, 2)(3));

// 记忆化
const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      console.log(\`缓存命中: \${key}\`);
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

const fibonacci = memoize((n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

console.log('fibonacci(10):', fibonacci(10));
console.log('fibonacci(10) 再次调用:', fibonacci(10));
`
}

export default function CodeRunnerAdvanced() {
  const theme = useStore((s) => s.theme)
  const [code, setCode] = useState(EXAMPLES.javascript)
  const [output, setOutput] = useState<ConsoleEntry[]>([])
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const addOutput = useCallback((type: ConsoleEntry['type'], content: string) => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    setOutput(prev => [...prev, { type, content, time }])
  }, [])

  const runCode = useCallback(() => {
    setIsRunning(true)
    setOutput([])
    setExecutionTime(null)

    const startTime = performance.now()

    // 重写console方法以捕获输出
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    }

    console.log = (...args) => {
      addOutput('log', args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '))
    }
    console.error = (...args) => {
      addOutput('error', args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '))
    }
    console.warn = (...args) => {
      addOutput('warn', args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '))
    }
    console.info = (...args) => {
      addOutput('info', args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '))
    }

    try {
      // 使用Function构造器执行代码
      const fn = new Function(code)
      const result = fn()
      if (result !== undefined) {
        addOutput('result', `返回值: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`)
      }
    } catch (error) {
      addOutput('error', `错误: ${(error as Error).message}`)
    } finally {
      // 恢复原始console
      Object.assign(console, originalConsole)
      const endTime = performance.now()
      setExecutionTime(Math.round((endTime - startTime) * 1000) / 1000)
      setIsRunning(false)
    }
  }, [code, addOutput])

  const clearOutput = useCallback(() => {
    setOutput([])
    setExecutionTime(null)
  }, [])

  const loadExample = useCallback((key: keyof typeof EXAMPLES) => {
    setCode(EXAMPLES[key])
    setOutput([])
    setExecutionTime(null)
  }, [])

  const getOutputColor = (type: ConsoleEntry['type']) => {
    switch (type) {
      case 'error': return theme === 'light' ? '#dc2626' : '#f87171'
      case 'warn': return theme === 'light' ? '#d97706' : '#fbbf24'
      case 'info': return theme === 'light' ? '#2563eb' : '#60a5fa'
      case 'result': return theme === 'light' ? '#059669' : '#34d399'
      default: return theme === 'light' ? '#374151' : '#e5e7eb'
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: theme === 'light' ? '#ffffff' : '#1a1a2e',
      color: theme === 'light' ? '#1f2937' : '#e5e7eb',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 13
    }}>
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '8px 12px',
        borderBottom: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
        background: theme === 'light' ? '#f9fafb' : '#16162e',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={runCode}
          disabled={isRunning}
          style={{
            padding: '6px 16px',
            background: isRunning ? '#6b7280' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: 12
          }}
        >
          {isRunning ? '运行中...' : '运行 (▶)'}
        </button>
        <button
          onClick={clearOutput}
          style={{
            padding: '6px 16px',
            background: theme === 'light' ? '#e5e7eb' : '#374151',
            color: theme === 'light' ? '#374151' : '#e5e7eb',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: 12
          }}
        >
          清空输出
        </button>
        <div style={{ flex: 1 }} />
        <select
          onChange={(e) => loadExample(e.target.value as keyof typeof EXAMPLES)}
          style={{
            padding: '6px 12px',
            background: theme === 'light' ? '#f3f4f6' : '#1f2937',
            color: theme === 'light' ? '#374151' : '#e5e7eb',
            border: `1px solid ${theme === 'light' ? '#d1d5db' : '#4b5563'}`,
            borderRadius: 6,
            fontSize: 12
          }}
        >
          <option value="">选择示例...</option>
          <option value="javascript">基础JavaScript</option>
          <option value="algorithms">算法示例</option>
          <option value="dom">DOM操作模拟</option>
          <option value="functional">函数式编程</option>
        </select>
      </div>

      {/* 主内容区 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 代码编辑区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`
        }}>
          <div style={{
            padding: '8px 12px',
            borderBottom: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
            fontWeight: 600,
            fontSize: 12,
            color: theme === 'light' ? '#6b7280' : '#9ca3af'
          }}>
            代码编辑器
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              flex: 1,
              padding: 12,
              background: theme === 'light' ? '#ffffff' : '#0d0d1a',
              color: theme === 'light' ? '#1f2937' : '#e5e7eb',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              fontSize: 13,
              lineHeight: 1.6
            }}
            placeholder="在此输入JavaScript代码..."
            spellCheck={false}
          />
        </div>

        {/* 输出区 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '8px 12px',
            borderBottom: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 600,
            fontSize: 12,
            color: theme === 'light' ? '#6b7280' : '#9ca3af'
          }}>
            <span>控制台输出</span>
            {executionTime !== null && (
              <span style={{ color: theme === 'light' ? '#10b981' : '#34d399' }}>
                执行时间: {executionTime}ms
              </span>
            )}
          </div>
          <div
            ref={outputRef}
            style={{
              flex: 1,
              padding: 12,
              background: theme === 'light' ? '#f9fafb' : '#0d0d1a',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}
          >
            {output.length === 0 ? (
              <div style={{ color: theme === 'light' ? '#9ca3af' : '#6b7280', fontStyle: 'italic' }}>
                点击"运行"按钮执行代码...
              </div>
            ) : (
              output.map((entry, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <span style={{ color: theme === 'light' ? '#9ca3af' : '#6b7280', fontSize: 11 }}>
                    [{entry.time}]
                  </span>
                  <span style={{ color: getOutputColor(entry.type), marginLeft: 8 }}>
                    {entry.content}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 状态栏 */}
      <div style={{
        padding: '4px 12px',
        borderTop: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
        background: theme === 'light' ? '#f9fafb' : '#16162e',
        fontSize: 11,
        color: theme === 'light' ? '#6b7280' : '#9ca3af',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>JavaScript ES2022</span>
        <span>快捷键: Ctrl+Enter 运行代码</span>
      </div>
    </div>
  )
}