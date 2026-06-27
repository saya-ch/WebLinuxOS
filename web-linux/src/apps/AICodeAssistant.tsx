import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useStore } from '../store'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

export default function AICodeAssistant() {
  const theme = useStore((s) => s.theme)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<'code' | 'chat' | 'explain'>('chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      role: 'assistant',
      content: `👋 欢迎使用 AI 编程助手！

这是一个集成了多种 AI 能力的智能助手，可以帮助您：

• 代码生成与补全 - 栓写函数、类、算法等代码片段
• 代码解释 - 详细解释复杂代码的工作原理
• Bug 修复 - 分析和修复代码中的错误
• 代码优化 - 提出性能和可读性改进建议
• 文档生成 - 自动生成代码注释和文档

使用方式：
1. 选择模式（编程助手/代码解释/聊天对话）
2. 输入您的需求或问题
3. AI 将实时分析和响应

注意：此应用使用本地模拟的 AI 响应来展示功能。您可以集成真实的 AI API（如 OpenAI、Anthropic Claude 等）来获得实际的 AI 能力。

请输入您的问题开始使用！`,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
    
    const sessionId = Date.now().toString()
    setCurrentSessionId(sessionId)
    setSessions([{
      id: sessionId,
      title: '新对话',
      messages: [welcomeMessage],
      createdAt: new Date()
    }])
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Generate AI response (simulated for demonstration)
  const generateResponse = useCallback(async (userMessage: string): Promise<string> => {
    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    // Pattern matching for different types of queries
    const patterns = {
      code: [
        { pattern: /function|函数|方法/i, response: generateCodeResponse },
        { pattern: /class|类|对象/i, response: generateClassResponse },
        { pattern: /algorithm|算法|sort|排序|search|搜索/i, response: generateAlgorithmResponse },
        { pattern: /bug|error|错误|fix|修复/i, response: generateBugFixResponse },
        { pattern: /optimize|优化|performance|性能/i, response: generateOptimizationResponse }
      ],
      explain: [
        { pattern: /explain|解释|what|什么|how|如何|why|为什么/i, response: generateExplanationResponse }
      ],
      chat: [
        { pattern: /hello|hi|你好|您好/i, response: generateGreetingResponse },
        { pattern: /help|帮助|usage|使用/i, response: generateHelpResponse },
        { pattern: /thanks|thank|谢谢|感谢/i, response: generateThanksResponse }
      ]
    }
    
    const modelPatterns = patterns[selectedModel] || patterns.chat
    
    for (const { pattern, response } of modelPatterns) {
      if (pattern.test(userMessage)) {
        return response()
      }
    }
    
    // Default response based on mode
    return generateDefaultResponse(selectedModel)
  }, [selectedModel])

  // Response generators
  function generateCodeResponse(): string {
    const codeExamples = [
      {
        title: 'JavaScript 异步函数示例',
        code: `async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}`
      },
      {
        title: 'Python 快速排序算法',
        code: `def quicksort(arr):
    """
    快速排序算法实现
    时间复杂度: O(n log n)
    """
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quicksort(left) + middle + quicksort(right)`
      },
      {
        title: 'React 组件示例',
        code: `import React, { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`
      }
    ]
    
    const example = codeExamples[Math.floor(Math.random() * codeExamples.length)]
    return `📝 **${example.title}**

根据您的需求，这是一个代码示例：

\`\`\`${example.title.includes('Python') ? 'python' : example.title.includes('React') ? 'jsx' : 'javascript'}
${example.code}
\`\`\`

**说明：**
• 此代码经过优化，具有良好的错误处理
• 支持异步操作和性能优化
• 可根据您的具体需求进行调整

您可以复制此代码到项目中使用，或让我根据您的具体需求进行修改。`
  }

  function generateClassResponse(): string {
    return `🏗️ **类设计示例**

根据您的需求，这里是一个类的设计方案：

\`\`\`typescript
class UserManager {
  private users: Map<string, User>;
  private logger: Logger;
  
  constructor(logger: Logger) {
    this.users = new Map();
    this.logger = logger;
  }
  
  addUser(user: User): boolean {
    if (this.users.has(user.id)) {
      this.logger.warn(\`User \${user.id} already exists\`);
      return false;
    }
    this.users.set(user.id, user);
    this.logger.info(\`Added user \${user.id}\`);
    return true;
  }
  
  getUser(id: string): User | undefined {
    return this.users.get(id);
  }
  
  removeUser(id: string): boolean {
    const exists = this.users.delete(id);
    if (exists) {
      this.logger.info(\`Removed user \${id}\`);
    }
    return exists;
  }
  
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}
\`\`\`

**设计要点：**
• 使用 Map 存储用户数据，提高查找效率
• 集成日志系统，便于调试和监控
• 提供完整的 CRUD 操作方法
• 类型安全，防止运行时错误

如需调整设计，请告诉我具体需求！`
  }

  function generateAlgorithmResponse(): string {
    const algorithms = [
      {
        name: '二分查找',
        complexity: 'O(log n)',
        code: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1`
      },
      {
        name: '深度优先搜索 (DFS)',
        complexity: 'O(V + E)',
        code: `def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()
    
    visited.add(start)
    print(start)
    
    for neighbor in graph[start]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)
    
    return visited`
      }
    ]
    
    const algo = algorithms[Math.floor(Math.random() * algorithms.length)]
    return `🧮 **${algo.name}算法**

时间复杂度: **${algo.complexity}**

\`\`\`python
${algo.code}
\`\`\`

**算法特点：**
• 高效的数据查找/遍历策略
• 适用于大规模数据处理
• 空间复杂度优化
• 可扩展性好

想要其他算法或优化建议吗？`
  }

  function generateBugFixResponse(): string {
    return `🔍 **Bug 分析与修复建议**

根据您描述的问题，可能的原因包括：

**常见 Bug 类型：**
1. **内存泄漏** - 未正确释放资源
2. **类型错误** - 类型转换或匹配问题
3. **异步问题** - race condition 或回调处理不当
4. **边界条件** - 未处理空值或极端情况
5. **状态管理** - 状态更新不及时或不一致

**调试步骤建议：**
\`\`\`javascript
// 1. 添加详细日志
console.log('Debug:', variable);

// 2. 使用断点调试
debugger;

// 3. 检查类型
if (typeof variable !== 'expectedType') {
  console.error('Type mismatch');
}

// 4. 异步错误处理
try {
  await asyncOperation();
} catch (error) {
  console.error('Async error:', error);
}
\`\`\`

**最佳实践：**
• 使用 TypeScript 进行类型检查
• 实现单元测试覆盖关键逻辑
• 添加 ESLint 规则防止常见错误
• 使用 Error Boundary 处理组件错误

请提供具体的代码片段或错误信息，我可以给出更精准的修复方案！`
  }

  function generateOptimizationResponse(): string {
    return `⚡ **性能优化建议**

根据您的需求，以下是关键优化策略：

**JavaScript 优化：**
\`\`\`javascript
// 1. 使用 Web Workers 处理耗时任务
const worker = new Worker('worker.js');

// 2. 虚拟化长列表渲染
import { FixedSizeList } from 'react-window';

// 3. 缓存计算结果
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// 4. 懒加载组件
const LazyComponent = React.lazy(() => import('./HeavyComponent'));
\`\`\`

**React 优化清单：**
• ✓ 使用 React.memo 防止不必要的重新渲染
• ✓ useCallback 缓存回调函数
• ✓ 代码分割减少初始加载时间
• ✓ 图片优化和懒加载
• ✓ 使用 CSS containment 提升渲染性能

**性能指标目标：**
• First Paint: < 1s
• Time to Interactive: < 3s
• Bundle Size: < 200KB
• Lighthouse Score: > 90

请告诉我您要优化的具体代码或场景！`
  }

  function generateExplanationResponse(): string {
    return `📚 **代码解释**

您请求的代码概念解释如下：

**核心概念：**

1. **异步编程**
   - Promise: 表示未来完成或失败的操作
   - async/await: 使异步代码看起来像同步代码
   - 使用场景: API 调用、文件操作、定时器

2. **闭包**
   - 函数记住其创建时的变量环境
   - 用于数据私有化和函数工厂
   - 注意内存泄漏风险

3. **原型链**
   - JavaScript 的继承机制
   - 对象通过 __proto__ 链接
   - 用于共享方法和属性

4. **事件循环**
   - JavaScript 的执行模型
   - 宏任务 vs 微任务
   - 理解定时器和 Promise 的执行顺序

**示例说明：**
\`\`\`javascript
// 闭包示例
function createCounter() {
  let count = 0; // 私有变量
  
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count
  };
}

const counter = createCounter();
counter.increment(); // 1
counter.increment(); // 2
console.log(counter.getCount()); // 2
\`\`\`

需要更详细的某个概念解释吗？`
  }

  function generateGreetingResponse(): string {
    return `👋 很高兴见到您！

我是您的 AI 编程助手，可以帮您解决各种编程问题：

• 栓写和优化代码
• 解释复杂的编程概念
• 分析和修复 Bug
• 提供最佳实践建议
• 生成文档和注释

请告诉我您需要什么帮助？您可以：
1. 描述一个编程问题
2. 请求代码示例
3. 询问技术概念
4. 提交代码片段进行分析`
  }

  function generateHelpResponse(): string {
    return `📖 **使用指南**

**AI 编程助手支持以下功能：**

**模式选择：**
• 🤖 编程助手 - 生成、优化、修复代码
• 💡 代码解释 - 详细解释代码原理和概念
• 💬 聊天对话 - 一般编程讨论和建议

**交互方式：**
1. 自然语言描述需求
2. 提供代码片段请求分析
3. 提出具体技术问题
4. 请求算法或实现示例

**示例提问：**
• "帮我写一个排序函数"
• "这段代码有什么 Bug？"
• "解释一下 Promise 的工作原理"
• "优化这个 React 组件的性能"

**提示：**
• 问题描述越具体，回答越精准
• 提供代码片段可以获得针对性建议
• 可以要求特定语言或框架的示例

准备好了吗？请输入您的问题！`
  }

  function generateThanksResponse(): string {
    return `😊 不客气！

很高兴能帮到您。如果还有其他问题，随时可以继续提问。

**您还可以尝试：**
• 请求更多代码示例
• 深入某个技术话题
• 分享您遇到的实际问题
• 探讨最佳实践和设计模式

我会持续为您提供帮助！`
  }

  function generateDefaultResponse(mode: string): string {
    const modeResponses: Record<string, string> = {
      code: `💻 我理解您需要编程方面的帮助。

请告诉我：
• 您要实现什么功能？
• 使用哪种编程语言？
• 有什么特定的要求或约束？

我可以为您：
• 生成完整代码示例
• 提供多种实现方案
• 分析性能和优化机会
• 生成测试用例

请详细描述您的需求，我会给出针对性的建议！`,
      explain: `💡 我可以帮助您理解编程概念。

您想了解：
• JavaScript/TypeScript 特性
• React/Vue 框架原理
• 算法和数据结构
• 设计模式和架构
• 性能优化策略

请提出具体问题，我会详细解释！`,
      chat: `💬 我在这里随时帮助您！

作为编程助手，我可以：
• 解答技术问题
• 提供代码建议
• 分享最佳实践
• 协助解决 Bug
• 探讨技术选型

请继续提问或描述您的需求！`
    }
    
    return modeResponses[mode] || modeResponses.chat
  }

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return
    
    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    
    try {
      const response = await generateResponse(userMessage.content)
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
      // Update session
      setSessions(prev => prev.map(session => 
        session.id === currentSessionId 
          ? { ...session, messages: [...session.messages, userMessage, assistantMessage], title: session.messages.length === 1 ? input.trim().substring(0, 30) : session.title }
          : session
      ))
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，处理您的请求时出现错误。请稍后再试。',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, generateResponse, currentSessionId])

  // Create new session
  const createNewSession = useCallback(() => {
    const sessionId = Date.now().toString()
    const welcomeMessage: Message = {
      role: 'assistant',
      content: '🆕 新对话已创建。请输入您的问题或需求，我会尽力帮助您！',
      timestamp: new Date()
    }
    
    setCurrentSessionId(sessionId)
    setMessages([welcomeMessage])
    setSessions(prev => [...prev, {
      id: sessionId,
      title: '新对话',
      messages: [welcomeMessage],
      createdAt: new Date()
    }])
  }, [])

  // Switch session
  const switchSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setCurrentSessionId(sessionId)
      setMessages(session.messages)
    }
  }, [sessions])

  // Delete session
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    if (sessionId === currentSessionId && sessions.length > 1) {
      const remainingSession = sessions.find(s => s.id !== sessionId)
      if (remainingSession) {
        switchSession(remainingSession.id)
      } else {
        createNewSession()
      }
    }
  }, [currentSessionId, sessions, switchSession, createNewSession])

  const styles = useMemo(() => ({
    container: {
      display: 'flex' as const,
      height: '100%',
      background: theme === 'light' ? '#f5f5f7' : 'rgba(20, 20, 35, 0.95)',
      color: theme === 'light' ? '#1c1c1e' : '#f0f0ff'
    },
    sidebar: {
      width: '260px',
      background: theme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(26, 26, 46, 0.6)',
      borderRight: `1px solid ${theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(139, 124, 240, 0.2)'}`,
      display: 'flex' as const,
      flexDirection: 'column' as const,
      padding: '16px'
    },
    mainContent: {
      flex: 1,
      display: 'flex' as const,
      flexDirection: 'column' as const,
      padding: '20px'
    },
    header: {
      display: 'flex' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: '20px',
      padding: '16px',
      background: theme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(26, 26, 46, 0.6)',
      borderRadius: '12px',
      border: `1px solid ${theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(139, 124, 240, 0.2)'}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    title: {
      fontSize: '20px',
      fontWeight: 700,
      background: theme === 'light' 
        ? 'linear-gradient(135deg, #007aff 0%, #409cff 100%)'
        : 'linear-gradient(135deg, #e8e8f4 0%, #a29bfe 50%, #8b7cf0 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    modelSelector: {
      display: 'flex' as const,
      gap: '8px',
      padding: '8px',
      background: theme === 'light' ? 'rgba(245, 245, 247, 0.5)' : 'rgba(22, 22, 38, 0.4)',
      borderRadius: '8px'
    },
    modelButton: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      background: theme === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(26, 26, 46, 0.4)',
      color: theme === 'light' ? '#1c1c1e' : '#f0f0ff'
    },
    activeModel: {
      background: theme === 'light' ? '#007aff' : '#9b8af0',
      color: '#fff'
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto' as const,
      marginBottom: '20px',
      padding: '16px',
      background: theme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(26, 26, 46, 0.6)',
      borderRadius: '12px',
      border: `1px solid ${theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(139, 124, 240, 0.2)'}`,
      display: 'flex' as const,
      flexDirection: 'column' as const,
      gap: '16px'
    },
    message: {
      padding: '12px 16px',
      borderRadius: '8px',
      maxWidth: '80%',
      wordWrap: 'break-word' as const,
      whiteSpace: 'pre-wrap' as const
    },
    userMessage: {
      alignSelf: 'flex-end',
      background: theme === 'light' ? '#007aff' : '#9b8af0',
      color: '#fff'
    },
    assistantMessage: {
      alignSelf: 'flex-start',
      background: theme === 'light' ? 'rgba(245, 245, 247, 0.8)' : 'rgba(22, 22, 38, 0.5)',
      border: `1px solid ${theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(139, 124, 240, 0.2)'}`,
      color: theme === 'light' ? '#1c1c1e' : '#f0f0ff'
    },
    inputContainer: {
      display: 'flex' as const,
      gap: '12px',
      alignItems: 'flex-end' as const
    },
    inputArea: {
      flex: 1,
      padding: '12px 16px',
      background: theme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(26, 26, 46, 0.6)',
      borderRadius: '8px',
      border: `1px solid ${theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(139, 124, 240, 0.2)'}`,
      resize: 'none' as const,
      minHeight: '48px',
      maxHeight: '200px',
      fontSize: '14px',
      color: theme === 'light' ? '#1c1c1e' : '#f0f0ff',
      outline: 'none',
      fontFamily: "'Segoe UI', system-ui, sans-serif"
    },
    sendButton: {
      padding: '12px 24px',
      background: theme === 'light' ? '#007aff' : '#9b8af0',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      opacity: loading ? 0.6 : 1
    },
    sessionItem: {
      padding: '10px 12px',
      marginBottom: '6px',
      background: theme === 'light' ? 'rgba(245, 245, 247, 0.5)' : 'rgba(22, 22, 38, 0.4)',
      borderRadius: '6px',
      cursor: 'pointer' as const,
      display: 'flex' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      fontSize: '13px',
      transition: 'background 0.15s ease'
    },
    activeSession: {
      background: theme === 'light' ? 'rgba(0, 122, 255, 0.1)' : 'rgba(139, 124, 240, 0.2)',
      border: `1px solid ${theme === 'light' ? 'rgba(0, 122, 255, 0.3)' : 'rgba(139, 124, 240, 0.4)'}`
    },
    loadingIndicator: {
      display: 'flex' as const,
      alignItems: 'center' as const,
      gap: '8px',
      padding: '12px',
      background: theme === 'light' ? 'rgba(245, 245, 247, 0.8)' : 'rgba(22, 22, 38, 0.5)',
      borderRadius: '8px',
      alignSelf: 'flex-start',
      fontSize: '13px',
      color: theme === 'light' ? '#8e8e93' : '#9090c0'
    },
    spinner: {
      width: '16px',
      height: '16px',
      border: `2px solid ${theme === 'light' ? 'rgba(0, 122, 255, 0.2)' : 'rgba(139, 124, 240, 0.2)'}`,
      borderTop: `2px solid ${theme === 'light' ? '#007aff' : '#9b8af0'}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    newSessionBtn: {
      padding: '10px 16px',
      background: theme === 'light' ? '#007aff' : '#9b8af0',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      marginBottom: '12px',
      width: '100%'
    },
    deleteBtn: {
      padding: '4px 8px',
      background: 'rgba(255, 59, 48, 0.1)',
      color: '#ff3b30',
      border: 'none',
      borderRadius: '4px',
      fontSize: '11px',
      cursor: 'pointer'
    }
  }), [theme, loading])

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <button style={styles.newSessionBtn} onClick={createNewSession}>
          + 新对话
        </button>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sessions.map(session => (
            <div 
              key={session.id}
              style={{
                ...styles.sessionItem,
                ...(session.id === currentSessionId ? styles.activeSession : {})
              }}
              onClick={() => switchSession(session.id)}
              onMouseEnter={(e) => {
                if (session.id !== currentSessionId) {
                  e.currentTarget.style.background = theme === 'light' ? 'rgba(0, 122, 255, 0.05)' : 'rgba(139, 124, 240, 0.1)'
                }
              }}
              onMouseLeave={(e) => {
                if (session.id !== currentSessionId) {
                  e.currentTarget.style.background = theme === 'light' ? 'rgba(245, 245, 247, 0.5)' : 'rgba(22, 22, 38, 0.4)'
                }
              }}
            >
              <span>{session.title}</span>
              {sessions.length > 1 && (
                <button 
                  style={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSession(session.id)
                  }}
                >
                  删除
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>AI 编程助手</div>
          <div style={styles.modelSelector}>
            <button 
              style={{...styles.modelButton, ...(selectedModel === 'code' ? styles.activeModel : {})}}
              onClick={() => setSelectedModel('code')}
            >
              💻 编程助手
            </button>
            <button 
              style={{...styles.modelButton, ...(selectedModel === 'explain' ? styles.activeModel : {})}}
              onClick={() => setSelectedModel('explain')}
            >
              💡 代码解释
            </button>
            <button 
              style={{...styles.modelButton, ...(selectedModel === 'chat' ? styles.activeModel : {})}}
              onClick={() => setSelectedModel('chat')}
            >
              💬 聊天对话
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={styles.messagesContainer}>
          {messages.map((message, index) => (
            <div 
              key={index}
              style={{
                ...styles.message,
                ...(message.role === 'user' ? styles.userMessage : styles.assistantMessage)
              }}
            >
              <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>
                {message.role === 'user' ? '您' : 'AI'} • {message.timestamp.toLocaleTimeString()}
              </div>
              <div>{message.content}</div>
            </div>
          ))}
          
          {loading && (
            <div style={styles.loadingIndicator}>
              <div style={styles.spinner}></div>
              <span>AI 正在思考...</span>
            </div>
          )}
          
          <div ref={messagesEndRef}></div>
        </div>

        {/* Input */}
        <div style={styles.inputContainer}>
          <textarea
            ref={inputRef}
            style={styles.inputArea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="输入您的编程问题... (Shift+Enter 换行)"
            disabled={loading}
          />
          <button 
            style={styles.sendButton}
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            {loading ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  )
}