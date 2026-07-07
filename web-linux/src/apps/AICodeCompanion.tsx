import { useState, useCallback } from 'react'
import { useStore } from '../store'
import { SparklesIcon, Code2Icon, BugIcon, ZapIcon, BookIcon } from '../icons'

interface CodeRequest {
  type: 'generate' | 'explain' | 'debug' | 'optimize' | 'test'
  language: string
  input: string
  context?: string
}

interface CodeResponse {
  result: string
  suggestions: string[]
  warnings?: string[]
  performance?: {
    complexity?: string
    memoryUsage?: string
    bottlenecks?: string[]
  }
}

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift']

const EXAMPLES = {
  generate: {
    title: '代码生成示例',
    description: '描述你想要的功能，AI将生成完整的代码',
    placeholder: '例如：创建一个函数，输入数组并返回最大值和最小值'
  },
  explain: {
    title: '代码解释',
    description: '粘贴代码片段，AI将详细解释每个部分',
    placeholder: '粘贴你想要理解的代码片段...'
  },
  debug: {
    title: '代码调试',
    description: '描述bug现象或粘贴错误代码，AI提供解决方案',
    placeholder: '描述bug症状或粘贴有问题的代码...'
  },
  optimize: {
    title: '性能优化',
    description: '粘贴代码，AI分析性能瓶颈并提供优化建议',
    placeholder: '粘贴需要优化的代码片段...'
  },
  test: {
    title: '测试生成',
    description: '粘贴代码函数，AI自动生成单元测试',
    placeholder: '粘贴需要测试的函数代码...'
  }
}

export default function AICodeCompanion() {
  const theme = useStore((s) => s.theme)
  const [activeTab, setActiveTab] = useState<CodeRequest['type']>('generate')
  const [language, setLanguage] = useState('JavaScript')
  const [input, setInput] = useState('')
  const [context, setContext] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<CodeResponse | null>(null)
  const [history, setHistory] = useState<Array<{ request: CodeRequest; response: CodeResponse }>>([])

  const simulateAIResponse = useCallback((request: CodeRequest): CodeResponse => {
    const responses: Record<CodeRequest['type'], () => CodeResponse> = {
      generate: () => ({
        result: `// ${request.language} 代码生成结果\nfunction findMinMax(arr) {\n  if (!arr || arr.length === 0) return null;\n  \n  let min = arr[0];\n  let max = arr[0];\n  \n  for (let i = 1; i < arr.length; i++) {\n    if (arr[i] < min) min = arr[i];\n    if (arr[i] > max) max = arr[i];\n  }\n  \n  return { min, max, count: arr.length };\n}\n\n// 使用示例\nconst result = findMinMax([3, 7, 2, 9, 1]);\nconsole.log(result); // { min: 1, max: 9, count: 5 }`,
        suggestions: [
          '添加空数组检查以避免错误',
          '考虑使用reduce方法简化代码',
          '可以扩展返回统计信息如平均值',
          '建议添加参数验证和错误处理'
        ],
        performance: {
          complexity: 'O(n) - 单次遍历，高效',
          memoryUsage: 'O(1) - 仅存储两个变量',
          bottlenecks: ['大数组可能需要分批处理']
        }
      }),
      explain: () => ({
        result: `代码解释：

1. **函数声明**: \`findMinMax(arr)\`
   - 定义一个函数接收数组参数
   - 使用参数名arr表示输入数组

2. **边界检查**: \`if (!arr || arr.length === 0)\`
   - 检查数组是否存在且不为空
   - 防止处理空数组导致的错误

3. **初始化**: \`let min = arr[0]; let max = arr[0];\`
   - 将第一个元素设为初始最小值和最大值
   - 避免使用全局最大/最小常量

4. **循环遍历**: \`for (let i = 1; i < arr.length; i++)\`
   - 从第二个元素开始遍历
   - 与当前min和max比较并更新

5. **返回对象**: \`return { min, max, count }\`
   - 返回包含结果的完整对象
   - 提供更多上下文信息`,
        suggestions: [
          '可以使用ES6的解构赋值简化返回',
          '考虑添加数组类型检查',
          '可以支持负数和特殊数值'
        ]
      }),
      debug: () => ({
        result: `调试分析：

问题诊断:
• 检测到可能的空数组处理问题
• 循环索引边界可能不正确
• 返回值可能缺少错误处理

修复方案:
\`\`\`javascript
function findMinMaxFixed(arr) {
  // 添加类型检查
  if (!Array.isArray(arr)) {
    throw new TypeError('Expected array input');
  }
  
  // 空数组处理
  if (arr.length === 0) {
    return { min: null, max: null, count: 0 };
  }
  
  // 使用reduce更安全
  return arr.reduce((acc, val) => {
    if (val < acc.min) acc.min = val;
    if (val > acc.max) acc.max = val;
    return acc;
  }, { min: arr[0], max: arr[0], count: arr.length });
}
\`\`\``,
        suggestions: [
          '添加输入验证防止错误数据',
          '使用try-catch包裹关键操作',
          '记录日志帮助追踪问题',
          '添加单元测试验证修复'
        ],
        warnings: [
          '原始代码缺少错误处理机制',
          '可能抛出未捕获的异常',
          '边界条件可能导致意外行为'
        ]
      }),
      optimize: () => ({
        result: `性能优化分析:

当前性能:
• 时间复杂度: O(n)
• 空间复杂度: O(1)
• 已是最优算法

优化建议:
\`\`\`javascript
// 使用Math方法简化
function findMinMaxOptimized(arr) {
  return {
    min: Math.min(...arr),
    max: Math.max(...arr),
    count: arr.length,
    average: arr.reduce((a, b) => a + b) / arr.length
  };
}

// 并行处理大数据
async function findMinMaxParallel(arr) {
  const chunkSize = Math.ceil(arr.length / 4);
  const chunks = [];
  
  for (let i = 0; i < 4; i++) {
    chunks.push(arr.slice(i * chunkSize, (i + 1) * chunkSize));
  }
  
  const results = await Promise.all(
    chunks.map(chunk => Promise.resolve(findMinMaxOptimized(chunk)))
  );
  
  return {
    min: Math.min(...results.map(r => r.min)),
    max: Math.max(...results.map(r => r.max)),
    count: arr.length
  };
}
\`\`\``,
        suggestions: [
          '使用Math.min/max简化代码',
          '大数据考虑并行处理',
          '添加平均值计算增强功能',
          '考虑缓存优化重复计算'
        ],
        performance: {
          complexity: 'O(n) - 不可进一步优化',
          memoryUsage: 'O(1) - 已是最优',
          bottlenecks: [
            '展开运算符(...)在大数组时可能有性能开销',
            '大数据建议使用Web Workers并行处理'
          ]
        }
      }),
      test: () => ({
        result: `自动生成的单元测试:

\`\`\`javascript
// Jest测试框架
describe('findMinMax', () => {
  test('正常数组', () => {
    expect(findMinMax([3, 7, 2, 9, 1]))
      .toEqual({ min: 1, max: 9, count: 5 });
  });
  
  test('空数组', () => {
    expect(findMinMax([])).toBeNull();
  });
  
  test('单元素数组', () => {
    expect(findMinMax([42]))
      .toEqual({ min: 42, max: 42, count: 1 });
  });
  
  test('负数数组', () => {
    expect(findMinMax([-5, -2, -10]))
      .toEqual({ min: -10, max: -2, count: 3 });
  });
  
  test('混合数组', () => {
    expect(findMinMax([0, -1, 5, -3, 8]))
      .toEqual({ min: -3, max: 8, count: 5 });
  });
  
  test('null输入', () => {
    expect(findMinMax(null)).toBeNull();
  });
  
  test('undefined输入', () => {
    expect(findMinMax(undefined)).toBeNull();
  });
});
\`\`\``,
        suggestions: [
          '添加边界条件测试',
          '测试特殊数值(NaN, Infinity)',
          '测试性能和内存使用',
          '添加集成测试'
        ]
      })
    }

    return responses[request.type]()
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return

    setIsLoading(true)
    setResponse(null)

    const request: CodeRequest = {
      type: activeTab,
      language,
      input,
      context
    }

    // 模拟AI处理延迟
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400))

    const response = simulateAIResponse(request)
    setResponse(response)
    setHistory(prev => [...prev.slice(-9), { request, response }])
    setIsLoading(false)
  }, [activeTab, language, input, context, simulateAIResponse])

  const handleClear = useCallback(() => {
    setInput('')
    setContext('')
    setResponse(null)
  }, [])

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
  }, [])

  return (
    <div className="ai-code-companion" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: theme === 'light' ? '#f8f9fa' : '#1a1a2e',
      color: theme === 'light' ? '#212529' : '#e0e0e8'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${theme === 'light' ? '#dee2e6' : '#2d2d44'}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <SparklesIcon style={{ width: '24px', height: '24px', color: '#8b7cf0' }} />
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>AI Code Companion</h2>
          <p style={{ fontSize: '12px', color: theme === 'light' ? '#6c757d' : '#8a8aa3', margin: '4px 0 0' }}>
            智能编程助手 · 代码生成、解释、调试、优化
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        borderBottom: `1px solid ${theme === 'light' ? '#dee2e6' : '#2d2d44'}`,
        background: theme === 'light' ? '#e9ecef' : '#16162e'
      }}>
        {Object.entries(EXAMPLES).map(([key, example]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as CodeRequest['type'])}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === key 
                ? (theme === 'light' ? '#8b7cf0' : '#6b5bdb')
                : (theme === 'light' ? '#ffffff' : '#2d2d44'),
              color: activeTab === key 
                ? '#ffffff'
                : (theme === 'light' ? '#495057' : '#a0a0c0'),
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {key === 'generate' && <ZapIcon style={{ width: '14px' }} />}
            {key === 'explain' && <BookIcon style={{ width: '14px' }} />}
            {key === 'debug' && <BugIcon style={{ width: '14px' }} />}
            {key === 'optimize' && <ZapIcon style={{ width: '14px' }} />}
            {key === 'test' && <ZapIcon style={{ width: '14px' }} />}
            {example.title}
          </button>
        ))}
      </div>

      {/* Language Selector */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: `1px solid ${theme === 'light' ? '#dee2e6' : '#2d2d44'}`
      }}>
        <label style={{ fontSize: '13px', fontWeight: 500 }}>语言:</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: `1px solid ${theme === 'light' ? '#ced4da' : '#3d3d5c'}`,
            background: theme === 'light' ? '#ffffff' : '#2d2d44',
            color: theme === 'light' ? '#495057' : '#e0e0e8',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          {LANGUAGES.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      {/* Input Section */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        gap: '12px',
        minHeight: '0'
      }}>
        <div style={{
          padding: '12px',
          background: theme === 'light' ? '#e9ecef' : '#2d2d44',
          borderRadius: '6px',
          marginBottom: '8px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
            {EXAMPLES[activeTab].title}
          </div>
          <div style={{ fontSize: '12px', color: theme === 'light' ? '#6c757d' : '#8a8aa3' }}>
            {EXAMPLES[activeTab].description}
          </div>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={EXAMPLES[activeTab].placeholder}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '6px',
            border: `1px solid ${theme === 'light' ? '#ced4da' : '#3d3d5c'}`,
            background: theme === 'light' ? '#ffffff' : '#1a1a2e',
            color: theme === 'light' ? '#212529' : '#e0e0e8',
            fontSize: '14px',
            lineHeight: 1.6,
            resize: 'none',
            fontFamily: 'JetBrains Mono, monospace',
            minHeight: '120px'
          }}
        />

        {/* Context Input (Optional) */}
        {activeTab !== 'generate' && (
          <div style={{ marginTop: '8px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: theme === 'light' ? '#6c757d' : '#8a8aa3',
              marginBottom: '4px'
            }}>
              上下文信息 (可选):
            </label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="例如：这是一个React组件中的helper函数"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'light' ? '#ced4da' : '#3d3d5c'}`,
                background: theme === 'light' ? '#ffffff' : '#1a1a2e',
                color: theme === 'light' ? '#212529' : '#e0e0e8',
                fontSize: '13px'
              }}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '12px'
        }}>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            style={{
              padding: '10px 24px',
              borderRadius: '6px',
              border: 'none',
              background: isLoading 
                ? (theme === 'light' ? '#adb5bd' : '#3d3d5c')
                : '#8b7cf0',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
              opacity: isLoading || !input.trim() ? 0.7 : 1,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid #ffffff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                分析中...
              </>
            ) : (
              <>
                <SparklesIcon style={{ width: '16px' }} />
                开始分析
              </>
            )}
          </button>

          <button
            onClick={handleClear}
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              border: `1px solid ${theme === 'light' ? '#ced4da' : '#3d3d5c'}`,
              background: theme === 'light' ? '#ffffff' : '#2d2d44',
              color: theme === 'light' ? '#495057' : '#a0a0c0',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            清空
          </button>
        </div>
      </div>

      {/* Response Section */}
      {response && (
        <div style={{
          flex: 1,
          padding: '16px',
          background: theme === 'light' ? '#ffffff' : '#16162e',
          borderTop: `1px solid ${theme === 'light' ? '#dee2e6' : '#2d2d44'}`,
          overflow: 'auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
              <Code2Icon style={{ width: '18px', marginRight: '8px', color: '#8b7cf0' }} />
              分析结果
            </h3>
            <button
              onClick={() => handleCopy(response.result)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: `1px solid ${theme === 'light' ? '#ced4da' : '#3d3d5c'}`,
                background: theme === 'light' ? '#ffffff' : '#2d2d44',
                color: theme === 'light' ? '#495057' : '#a0a0c0',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              复制代码
            </button>
          </div>

          {/* Result Code */}
          <pre style={{
            padding: '12px',
            background: theme === 'light' ? '#f8f9fa' : '#1a1a2e',
            borderRadius: '6px',
            border: `1px solid ${theme === 'light' ? '#e9ecef' : '#2d2d44'}`,
            fontSize: '13px',
            lineHeight: 1.6,
            overflow: 'auto',
            fontFamily: 'JetBrains Mono, monospace',
            color: theme === 'light' ? '#212529' : '#e0e0e8',
            whiteSpace: 'pre-wrap'
          }}>
            {response.result}
          </pre>

          {/* Suggestions */}
          {response.suggestions && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
                color: '#8b7cf0'
              }}>
                <ZapIcon style={{ width: '16px', marginRight: '6px' }} />
                建议改进
              </h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {response.suggestions.map((suggestion, idx) => (
                  <li key={idx} style={{
                    padding: '8px 12px',
                    background: theme === 'light' ? '#e9ecef' : '#2d2d44',
                    borderRadius: '4px',
                    fontSize: '13px',
                    borderLeft: '3px solid #8b7cf0'
                  }}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Performance Analysis */}
          {response.performance && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
                color: '#00d4aa'
              }}>
                <ZapIcon style={{ width: '16px', marginRight: '6px' }} />
                性能分析
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '8px'
              }}>
                {response.performance.complexity && (
                  <div style={{
                    padding: '8px',
                    background: theme === 'light' ? '#d1ecf1' : '#1d3557',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    <strong>时间复杂度:</strong> {response.performance.complexity}
                  </div>
                )}
                {response.performance.memoryUsage && (
                  <div style={{
                    padding: '8px',
                    background: theme === 'light' ? '#d4edda' : '#1e3a1e',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    <strong>空间复杂度:</strong> {response.performance.memoryUsage}
                  </div>
                )}
              </div>
              {response.performance.bottlenecks && (
                <div style={{ marginTop: '8px' }}>
                  <strong style={{ fontSize: '12px' }}>潜在瓶颈:</strong>
                  <ul style={{
                    listStyle: 'disc',
                    marginLeft: '20px',
                    fontSize: '12px',
                    color: theme === 'light' ? '#856404' : '#ffa500'
                  }}>
                    {response.performance.bottlenecks.map((bottleneck, idx) => (
                      <li key={idx}>{bottleneck}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Warnings */}
          {response.warnings && response.warnings.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '8px',
                color: '#dc3545'
              }}>
                <BugIcon style={{ width: '16px', marginRight: '6px' }} />
                注意事项
              </h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {response.warnings.map((warning, idx) => (
                  <li key={idx} style={{
                    padding: '8px 12px',
                    background: theme === 'light' ? '#f8d7da' : '#3d1f1f',
                    borderRadius: '4px',
                    fontSize: '13px',
                    borderLeft: '3px solid #dc3545'
                  }}>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* History Panel */}
      {history.length > 0 && (
        <div style={{
          padding: '12px 16px',
          borderTop: `1px solid ${theme === 'light' ? '#dee2e6' : '#2d2d44'}`,
          background: theme === 'light' ? '#e9ecef' : '#16162e'
        }}>
          <div style={{
            fontSize: '12px',
            color: theme === 'light' ? '#6c757d' : '#8a8aa3',
            marginBottom: '8px'
          }}>
            最近查询 ({history.length})
          </div>
          <div style={{
            display: 'flex',
            gap: '8px',
            overflow: 'auto'
          }}>
            {history.slice(-5).map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveTab(item.request.type)
                  setLanguage(item.request.language)
                  setInput(item.request.input)
                  setContext(item.request.context || '')
                  setResponse(item.response)
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: `1px solid ${theme === 'light' ? '#ced4da' : '#3d3d5c'}`,
                  background: theme === 'light' ? '#ffffff' : '#2d2d44',
                  color: theme === 'light' ? '#495057' : '#a0a0c0',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer'
                }}
              >
                {item.request.type} · {item.request.language}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}