import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  code?: string;
  language?: string;
}

const suggestions = [
  '帮我写一个 Python 脚本',
  '解释一下什么是 React hooks',
  '创建一个待办事项列表',
  '优化我的代码',
  '解释什么是递归',
  '如何使用终端命令',
  '帮我写一个 JavaScript 函数',
  '教我如何使用 WebLinux',
  '帮我创建一个 API',
  '解释什么是算法复杂度',
  '推荐一些学习资源',
  '帮我调试代码',
];

const quickActions = [
  { icon: '💻', label: '写代码', action: '帮我写一个示例代码' },
  { icon: '📚', label: '学习', action: '教我编程概念' },
  { icon: '🔍', label: '分析', action: '帮我分析代码问题' },
  { icon: '✨', label: '优化', action: '如何优化我的代码' },
  { icon: '🎯', label: '项目', action: '帮我想一个项目创意' },
  { icon: '🐛', label: '调试', action: '帮我找出代码中的bug' },
];

export default function AIHelper() {
  const theme = useStore((s) => s.theme);
  const openApp = useStore((s) => s.openApp);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是 WebLinux 的智能 AI 助手 ✨\n\n我可以帮你：\n• 编写和优化代码（Python、JavaScript等）\n• 解释编程概念和技术\n• 提供实用的小技巧和建议\n• 帮你使用 WebLinux 的各种功能\n\n有什么我可以帮你的吗？',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateCodeSnippet = (topic: string): { code: string; language: string } => {
    const lower = topic.toLowerCase();
    
    if (lower.includes('python') || lower.includes('py')) {
      return {
        language: 'python',
        code: `def fibonacci(n):
    """生成斐波那契数列"""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence

# 示例
result = fibonacci(10)
print(f"斐波那契数列前10项: {result}")`
      };
    }
    
    if (lower.includes('javascript') || lower.includes('js')) {
      return {
        language: 'javascript',
        code: `// 防抖函数
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// 使用示例
const handleSearch = debounce((query) => {
  console.log('搜索:', query);
}, 300);`
      };
    }
    
    if (lower.includes('排序') || lower.includes('sort')) {
      return {
        language: 'javascript',
        code: `// 快速排序算法
function quickSort(arr) {
  if (arr.length <= 1) {
    return arr;
  }
  
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  
  return [...quickSort(left), ...middle, ...quickSort(right)];
}

// 示例
const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log('排序前:', numbers);
console.log('排序后:', quickSort(numbers));`
      };
    }
    
    if (lower.includes('递归') || lower.includes('recursive')) {
      return {
        language: 'python',
        code: `# 递归示例：计算阶乘
def factorial(n):
    """递归计算 n!"""
    if n <= 1:
        return 1
    return n * factorial(n - 1)

# 递归示例：遍历目录
import os

def list_files(directory, indent=0):
    """递归列出目录中的所有文件和文件夹"""
    try:
        items = os.listdir(directory)
        for item in sorted(items):
            path = os.path.join(directory, item)
            print('  ' * indent + ('📁 ' if os.path.isdir(path) else '📄 ') + item)
            if os.path.isdir(path):
                list_files(path, indent + 1)
    except PermissionError:
        print('  ' * indent + '⛔ 无权访问')

# 示例：列出当前目录
list_files('.')`
      };
    }
    
    return {
      language: 'javascript',
      code: `// 通用代码示例
function example() {
  console.log('你好, 世界!');
  
  // 数组操作
  const arr = [1, 2, 3, 4, 5];
  const doubled = arr.map(x => x * 2);
  const sum = arr.reduce((acc, x) => acc + x, 0);
  
  return { doubled, sum };
}`
    };
  };

  const generateResponse = (userInput: string, messageId: string): Message => {
    const lower = userInput.toLowerCase();
    
    // 代码相关
    if (lower.includes('python') || lower.includes('代码') || lower.includes('script')) {
      const snippet = generateCodeSnippet(userInput);
      return {
        id: messageId,
        role: 'assistant',
        content: `好的，我来帮你写一个代码示例：\n\n你可以复制下面的代码到终端或代码编辑器中运行：`,
        timestamp: new Date(),
        code: snippet.code,
        language: snippet.language,
      };
    }
    
    // React 相关
    if (lower.includes('react') || lower.includes('hook')) {
      return {
        id: messageId,
        role: 'assistant',
        content: 'React Hooks 是 React 16.8 引入的新特性，让你可以在函数组件中使用状态和其他 React 特性。\n\n**常用的 Hooks：**\n\n• **useState** - 管理组件状态\n• **useEffect** - 处理副作用（数据获取、订阅等）\n• **useContext** - 访问 React Context\n• **useRef** - 引用 DOM 元素或存储可变值\n• **useMemo** - 缓存计算结果\n• **useCallback** - 缓存函数定义\n\n**示例：**\n```javascript\nimport { useState, useEffect } from "react";\n\nfunction MyComponent() {\n  const [count, setCount] = useState(0);\n  \n  useEffect(() => {\n    document.title = "计数: " + count;\n  }, [count]);\n  \n  return (\n    <button onClick={() => setCount(c => c + 1)}>\n      点击次数: {count}\n    </button>\n  );\n}\n```',
        timestamp: new Date(),
      };
    }
    
    // 待办事项
    if (lower.includes('待办') || lower.includes('todo')) {
      return {
        id: messageId,
        role: 'assistant',
        content: '创建待办事项是个好主意！🎯\n\n**WebLinux 有多种方式管理待办：**\n\n1. **待办事项应用** - 点击任务栏启动器 → 搜索"待办事项"\n2. **番茄工作法** - 专注工作，使用番茄钟\n3. **任务看板** - 可视化管理多个项目\n\n**你也可以直接在这里创建任务：**\n\n```\n☐ 完成项目报告\n☐ 学习 React Hooks\n☐ 优化代码性能\n☐ 写测试用例\n```',
        timestamp: new Date(),
      };
    }
    
    // 终端相关
    if (lower.includes('终端') || lower.includes('命令') || lower.includes('terminal')) {
      return {
        id: messageId,
        role: 'assistant',
        content: '终端是 WebLinux 的强大工具！💻\n\n**常用命令：**\n\n• `ls` - 列出文件\n• `cd` - 切换目录\n• `cat` - 查看文件内容\n• `mkdir` - 创建目录\n• `rm` - 删除文件\n• `python3` - 运行 Python 代码\n\n**示例：**\n```bash\n# 查看当前目录\nls -la\n\n# 创建文件夹\nmkdir myproject\n\n# 运行 Python\npython3 -c "print(\'Hello!\')"\n\n# 系统信息\nsysinfo\n```\n\n输入 `help` 查看所有可用命令！',
        timestamp: new Date(),
      };
    }
    
    // 递归
    if (lower.includes('递归') || lower.includes('recursive')) {
      const snippet = generateCodeSnippet('递归');
      return {
        id: messageId,
        role: 'assistant',
        content: '递归是一种强大的编程技巧！🔄\n\n**递归的核心要素：**\n1. **基本情况** - 递归终止条件\n2. **递归情况** - 函数调用自己\n\n让我给你一个示例：',
        timestamp: new Date(),
        code: snippet.code,
        language: snippet.language,
      };
    }
    
    // 优化相关
    if (lower.includes('优化') || lower.includes('性能')) {
      return {
        id: messageId,
        role: 'assistant',
        content: '代码优化是个好话题！⚡\n\n**常见优化技巧：**\n\n**1. 避免不必要的重渲染**\n```jsx\n// 使用 React.memo 包装组件\nconst MyComponent = React.memo(({ data }) => {\n  return <div>{data}</div>;\n});\n```\n\n**2. 使用 useMemo 和 useCallback**\n```jsx\nconst memoizedValue = useMemo(() => computeExpensive(a, b), [a, b]);\nconst memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);\n```\n\n**3. 懒加载**\n```jsx\nconst HeavyComponent = React.lazy(() => import("./Heavy"));\n```\n\n**4. 避免在渲染中创建新对象**\n\n需要我详细解释某个优化点吗？',
        timestamp: new Date(),
      };
    }
    
    // 文件管理
    if (lower.includes('文件') || lower.includes('file')) {
      return {
        id: messageId,
        role: 'assistant',
        content: 'WebLinux 有强大的文件管理系统！📁\n\n**文件操作：**\n• 双击打开文件\n• 右键查看快捷菜单\n• 拖拽移动文件\n• 支持复制粘贴\n\n**快速访问：**\n• 📄 文档目录\n• 📥 下载目录\n• 🖼️ 图片目录\n• 🎵 音乐目录\n\n你可以直接打开文件管理器体验！',
        timestamp: new Date(),
      };
    }
    
    // 问候
    if (lower.includes('你好') || lower.includes('hi') || lower.includes('hello')) {
      return {
        id: messageId,
        role: 'assistant',
        content: '你好！很高兴见到你！👋\n\n我是 WebLinux 的 AI 助手，随时为你效劳！\n\n**我可以帮你：**\n• 💻 编写和优化代码\n• 📚 解释技术概念\n• 🎯 提供实用建议\n• 🔧 解决问题\n\n有什么我可以帮你的吗？',
        timestamp: new Date(),
      };
    }
    
    // 感谢
    if (lower.includes('谢谢') || lower.includes('感谢') || lower.includes('thx')) {
      return {
        id: messageId,
        role: 'assistant',
        content: '不客气！😊\n\n随时欢迎再来问我问题！\n\n如果遇到任何问题，可以：\n• 📖 查看帮助文档\n• 💬 继续和我聊天\n• 🔧 使用终端命令获取帮助',
        timestamp: new Date(),
      };
    }
    
    // 学习资源推荐
    if (lower.includes('学习') || lower.includes('资源') || lower.includes('教程') && lower.includes('推荐')) {
      return {
        id: messageId,
        role: 'assistant',
        content: '好的学习资源推荐！📚\n\n**编程学习平台：**\n\n• **免费教程**\n  - MDN Web Docs (https://developer.mozilla.org)\n  - freeCodeCamp (https://www.freecodecamp.org)\n  - 阮一峰的网络日志\n\n• **交互式学习**\n  - LeetCode (算法练习)\n  - HackerRank (编程挑战)\n  - Codecademy\n\n• **视频教程**\n  - B站编程教学视频\n  - YouTube 技术频道\n  - Udemy 付费课程(经常打折)\n\n• **中文资源**\n  - 掘金 (https://juejin.cn)\n  - 思否 (https://segmentfault.com)\n  - GitHub 中文精选\n\n**推荐学习路径：**\n1. HTML/CSS/JavaScript 基础\n2. React 或 Vue 框架\n3. Node.js 后端开发\n4. 数据库和 API 设计\n\n想学习哪个方向？我可以给你更具体的建议！',
        timestamp: new Date(),
      };
    }
    
    // 代码调试
    if (lower.includes('调试') || lower.includes('debug') || lower.includes('bug')) {
      return {
        id: messageId,
        role: 'assistant',
        content: '代码调试技巧！🔧\n\n**通用调试方法：**\n\n**1. 使用 console.log**\n```javascript\nconsole.log("变量值:", variable);\nconsole.log("数据类型:", typeof variable);\n```\n\n**2. 使用断点**\n- 浏览器开发者工具 F12\n- 在 Sources 面板设置断点\n- 观察变量值和调用栈\n\n**3. 检查常见错误**\n• 拼写错误\n• 缺少分号或括号\n• 变量未定义\n• 类型不匹配\n• 异步操作未处理\n\n**4. Python 调试**\n```python\n# 使用 print 调试\nprint(f"变量值: {variable}")\n\n# 使用 pdb\nimport pdb; pdb.set_trace()\n\n# 使用 IDE 断点\n```\n\n**5. 调试心态**\n• 冷静分析错误信息\n• 逐行检查代码\n• 注释掉可疑代码\n• 简化问题到最小复现\n\n有具体的代码问题吗？可以粘贴给我看看！',
        timestamp: new Date(),
      };
    }
    
    // WebLinux 使用教程
    if (lower.includes('weblinux') || (lower.includes('使用') && !lower.includes('教程')) || (lower.includes('教程') && lower.includes('weblinux'))) {
      const isTutorial = lower.includes('教程');
      return {
        id: messageId,
        role: 'assistant',
        content: isTutorial 
          ? 'WebLinux 完整使用教程！🚀\n\n**第一章：桌面基础**\n\n**1.1 桌面图标**\n• 双击图标启动应用\n• 单击选中图标\n• 右键打开快捷菜单\n\n**1.2 窗口操作**\n• 拖拽标题栏移动窗口\n• 拖拽边缘调整大小\n• 右上角按钮：最小化、最大化、关闭\n\n**1.3 任务栏**\n• 显示运行中的应用\n• 点击切换应用\n• 右下角快速设置\n\n**第二章：应用使用**\n\n**2.1 终端 (Ctrl+Shift+T)**\n• 输入命令操作\n• 支持 Python 编程\n• Tab 键自动补全\n\n**2.2 文件管理器**\n• 浏览器虚拟文件系统\n• 创建、删除、重命名文件\n• 支持拖拽操作\n\n**2.3 代码编辑器**\n• 语法高亮\n• 代码补全\n• 支持多种语言\n\n**第三章：高级功能**\n\n**3.1 多桌面**\n• Ctrl+Alt+1-4 切换桌面\n• 拖拽窗口到其他桌面\n\n**3.2 快捷键**\n• Ctrl+L 打开启动器\n• Alt+Tab 切换窗口\n• Ctrl+Shift+K 智慧搜索\n\n**3.3 自定义**\n• 更换壁纸\n• 切换主题\n• 添加桌面图标\n\n需要我详细解释某个功能吗？'
          : '很高兴你想了解 WebLinux！🚀\n\n**快速入门指南：**\n\n**1. 桌面环境**\n• 右键桌面可以打开快捷菜单\n• 双击桌面图标启动应用\n• 使用 Ctrl+Alt+方向键切换桌面\n\n**2. 应用启动器**\n• 点击任务栏的 🦊 图标\n• 或使用快捷键 Ctrl+Shift+L\n\n**3. 窗口管理**\n• 拖拽标题栏移动窗口\n• 拖拽边缘调整大小\n• 最小化/最大化/关闭按钮在左上角\n\n**4. 快捷键**\n• Ctrl+Shift+T - 终端\n• Ctrl+Shift+F - 文件管理器\n• Alt+Tab - 切换窗口\n\n需要我详细介绍某个功能吗？',
        timestamp: new Date(),
      };
    }
    
    // 算法复杂度
    if (lower.includes('算法') || lower.includes('复杂度') || lower.includes('complexity')) {
      return {
        id: messageId,
        role: 'assistant',
        content: '算法复杂度是评估算法效率的重要概念！📊\n\n**时间复杂度（常用）：**\n\n• **O(1)** - 常数时间，如数组访问\n• **O(log n)** - 对数时间，如二分查找\n• **O(n)** - 线性时间，如遍历数组\n• **O(n log n)** - 线性对数时间，如快速排序\n• **O(n²)** - 平方时间，如冒泡排序\n• **O(2^n)** - 指数时间，如递归斐波那契\n• **O(n!)** - 阶乘时间，如旅行商问题\n\n**空间复杂度：**\n\n衡量算法所需的内存空间。\n\n**优化建议：**\n• 选择合适的数据结构\n• 避免嵌套循环\n• 使用缓存\n• 分治法\n\n需要我详细解释某个算法吗？',
        timestamp: new Date(),
      };
    }
    
    // 项目创意
    if (lower.includes('项目') || lower.includes('创意') || lower.includes('project')) {
      const projects = [
        '📝 个人博客系统 - 使用 React + Node.js',
        '📊 数据可视化仪表盘 - 展示实时数据',
        '🎮 小游戏开发 - 如贪吃蛇、俄罗斯方块',
        '🤖 AI 聊天机器人 - 基于机器学习',
        '📱 待办事项应用 - 带提醒功能',
        '🛒 电商原型 - 产品展示和购物车',
        '📊 项目管理工具 - 看板和甘特图',
        '🎨 图片编辑器 - 滤镜和裁剪',
      ];
      return {
        id: messageId,
        role: 'assistant',
        content: '好的项目创意！💡\n\n**推荐项目列表：**\n\n' + projects.join('\n') + '\n\n**选择项目的标准：**\n1. 符合你的技能水平\n2. 有实际应用价值\n3. 能够持续迭代\n4. 有学习新技术的机会\n\n你想做哪个方向的项目？我可以帮你制定开发计划！',
        timestamp: new Date(),
      };
    }
    
    // 默认回复
    const responses = [
      '这是个有趣的问题！🤔\n\n让我给你一些建议：\n\n• 尝试在终端中输入命令练习\n• 使用文件管理器整理你的文件\n• 在代码编辑器中编写代码\n• 探索各种应用提高效率\n\n你想了解哪个方面？',
      '好问题！💡\n\n在 WebLinux 中，你可以通过多种方式完成任务。告诉我更多细节，我可以给你更具体的帮助！',
      '很高兴你提问！🎯\n\n我可以帮你：\n• 解答技术问题\n• 提供代码示例\n• 解释概念\n• 给出建议\n\n请告诉我你需要什么帮助？',
    ];
    
    // 使用 messageId 的哈希值来选择响应，确保纯函数
    const responseIndex = parseInt(messageId.slice(-4), 16) % responses.length;
    
    return {
      id: messageId,
      role: 'assistant',
      content: responses[responseIndex],
      timestamp: new Date(),
    };
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const delay = 800 + Math.floor(Math.random() * 1200);
    setTimeout(() => {
      const messageId = crypto.randomUUID();
      const aiResponse = generateResponse(input, messageId);
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, delay);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setMessages((prev) => 
      prev.map((msg) => 
        msg.code === code ? { ...msg, content: msg.content + '\n\n✅ 代码已复制到剪贴板！' } : msg
      )
    );
  };

  const openInTerminal = (code: string, language: string) => {
    if (language === 'python') {
      openApp('terminal');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ai-command', { 
          detail: { command: `python3 -c """${code.replace(/"/g, '\\"')}"""` } 
        }));
      }, 200);
    }
  };

  return (
    <div 
      className="app-container"
      style={{ 
        background: theme === 'light' ? '#f0f0f5' : '#1e1e2e',
        color: theme === 'light' ? '#1c1c1e' : '#e0e0e8',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div style={{ 
        padding: '16px', 
        borderBottom: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
        background: theme === 'light' ? '#ffffff' : '#252536',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>🤖</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>AI 助手</div>
              <div style={{ fontSize: '12px', color: theme === 'light' ? '#8e8e93' : '#9090a4' }}>随时为你提供帮助</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleQuickAction(action.action)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
                  background: theme === 'light' ? '#f0f0f5' : '#2a2a3e',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                }}
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {messages.map((msg) => (
          <div 
            key={msg.id}
            style={{ 
              display: 'flex',
              gap: '12px',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: msg.code ? '95%' : '80%',
            }}
          >
            <div style={{ 
              alignSelf: 'flex-start',
              fontSize: '24px',
              display: msg.role === 'assistant' ? 'block' : 'none',
            }}>
              🤖
            </div>
            <div style={{ 
              flex: 1,
              background: msg.role === 'user' 
                ? (theme === 'light' ? '#007aff' : '#6c5ce7') 
                : (theme === 'light' ? '#ffffff' : '#2a2a3e'),
              color: msg.role === 'user' ? '#fff' : 'inherit',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1px solid ${msg.role === 'user' ? 'transparent' : (theme === 'light' ? '#d1d1d6' : '#3a3a5c')}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {msg.content.split('```').map((part, i) => 
                i % 2 === 1 ? (
                  <pre key={i} style={{ 
                    background: theme === 'light' ? '#f0f0f5' : '#1e1e2e', 
                    padding: '12px', 
                    borderRadius: '8px',
                    overflow: 'auto',
                    fontSize: '13px',
                    margin: '8px 0',
                  }}>
                    <code>{part}</code>
                  </pre>
                ) : <span key={i}>{part}</span>
              )}
              
              {msg.code && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px',
                    padding: '8px 12px',
                    background: theme === 'light' ? '#e8e8ed' : '#1e1e2e',
                    borderRadius: '8px 8px 0 0',
                  }}>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: 600,
                      color: theme === 'light' ? '#007aff' : '#6c5ce7'
                    }}>
                      {msg.language === 'python' ? '🐍 Python' : '💻 JavaScript'}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => copyToClipboard(msg.code!)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: theme === 'light' ? '#007aff' : '#6c5ce7',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        📋 复制
                      </button>
                      {msg.language === 'python' && (
                        <button
                          onClick={() => openInTerminal(msg.code!, msg.language!)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#28a745',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          ▶️ 在终端运行
                        </button>
                      )}
                    </div>
                  </div>
                  <pre style={{ 
                    background: theme === 'light' ? '#f0f0f5' : '#1e1e2e', 
                    padding: '12px', 
                    borderRadius: '0 0 8px 8px',
                    overflow: 'auto',
                    fontSize: '13px',
                    fontFamily: 'Monaco, Menlo, monospace',
                    margin: 0,
                  }}>
                    <code>{msg.code}</code>
                  </pre>
                </div>
              )}
            </div>
            <div style={{ 
              alignSelf: 'flex-start',
              fontSize: '24px',
              display: msg.role === 'user' ? 'block' : 'none',
            }}>
              👤
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            alignItems: 'center',
            padding: '12px 16px',
          }}>
            <span style={{ fontSize: '24px' }}>🤖</span>
            <div style={{ 
              background: theme === 'light' ? '#ffffff' : '#2a2a3e',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  background: theme === 'light' ? '#007aff' : '#6c5ce7', 
                  borderRadius: '50%',
                  animation: 'pulse 1s infinite',
                }}></span>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  background: theme === 'light' ? '#007aff' : '#6c5ce7', 
                  borderRadius: '50%',
                  animation: 'pulse 1s infinite 0.2s',
                }}></span>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  background: theme === 'light' ? '#007aff' : '#6c5ce7', 
                  borderRadius: '50%',
                  animation: 'pulse 1s infinite 0.4s',
                }}></span>
              </div>
            </div>
          </div>
        )}
        
        {messages.length === 1 && !isTyping && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ 
              fontSize: '14px', 
              color: theme === 'light' ? '#8e8e93' : '#9090a4', 
              marginBottom: '12px',
            }}>
              试试这些问题：
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
                    background: 'transparent',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = theme === 'light' ? '#f0f0f5' : '#2a2a3e';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div style={{ 
        padding: '16px',
        borderTop: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
        background: theme === 'light' ? '#ffffff' : '#252536',
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '20px',
              border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
              background: theme === 'light' ? '#f0f0f5' : '#1e1e2e',
              color: 'inherit',
              fontSize: '14px',
              resize: 'none',
              minHeight: '44px',
              maxHeight: '120px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            style={{
              padding: '12px 20px',
              borderRadius: '50%',
              border: 'none',
              background: isTyping || !input.trim() 
                ? (theme === 'light' ? '#c7c7cc' : '#4a4a7a') 
                : (theme === 'light' ? '#007aff' : '#6c5ce7'),
              color: '#fff',
              cursor: isTyping || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: '18px',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
