import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestions = [
  '帮我写一个 Python 脚本',
  '解释一下什么是 React hooks',
  '创建一个待办事项列表',
  '优化我的代码',
  '解释什么是递归',
];

export default function AIHelper() {
  const theme = useStore((s) => s.theme);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是 WebLinux 的 AI 助手。我可以帮你回答问题、写代码、提供建议。有什么我可以帮你的吗？',
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

  const generateResponse = (userInput: string): string => {
    const lower = userInput.toLowerCase();
    
    if (lower.includes('python') || lower.includes('代码')) {
      return '好的，我来帮你写一个简单的 Python 脚本示例：\n\n```python\ndef fibonacci(n):\n    sequence = [0, 1]\n    while len(sequence) < n:\n        sequence.append(sequence[-1] + sequence[-2])\n    return sequence\n\nprint(fibonacci(10))\n```\n\n这个脚本会生成斐波那契数列！你可以在终端里运行它试试。';
    }
    
    if (lower.includes('react') || lower.includes('hook')) {
      return 'React Hooks 是 React 16.8 引入的新特性，让你可以在函数组件中使用状态和其他 React 特性。\n\n常见的 Hooks 包括：\n• useState - 管理状态\n• useEffect - 副作用处理\n• useContext - 上下文访问\n• useRef - 引用访问\n• useMemo - 性能优化';
    }
    
    if (lower.includes('待办') || lower.includes('todo')) {
      return '创建待办事项是个好主意！WebLinux 已经内置了待办事项应用。你可以通过以下方式使用：\n\n1. 点击任务栏的启动器按钮\n2. 搜索"待办事项"\n3. 开始添加你的任务\n\n或者，如果你想要代码示例，我很乐意提供！';
    }
    
    if (lower.includes('你好') || lower.includes('hi')) {
      return '你好！很高兴见到你！有什么我可以帮你的吗？我可以：\n\n• 回答技术问题\n• 提供代码示例\n• 解释编程概念\n• 或者只是随便聊聊';
    }
    
    const responses = [
      '很有趣的问题！让我想想...🤔\n\n基于我的理解，这是一个很好的话题。你可以在 WebLinux 中探索更多功能，比如使用终端、文件管理器，或者代码编辑器来继续学习！',
      '这是个很棒的问题！虽然我是一个模拟的 AI 助手，但我可以提供一些通用的建议。你想探索 WebLinux 的哪些功能呢？',
      '好想法！在 WebLinux 中，你可以：\n\n• 使用终端练习命令\n• 在代码编辑器写代码\n• 在文件管理器中管理虚拟文件\n\n想让我详细介绍某个功能吗？',
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(input),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div 
      className="app-container"
      style={{ 
        background: theme === 'light' ? '#f0f0f5' : '#1e1e2e',
        color: theme === 'light' ? '#1c1c1e' : '#e0e0e8',
      }}
    >
      <div style={{ 
        padding: '16px', 
        borderBottom: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
        background: theme === 'light' ? '#ffffff' : '#252536',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>🤖</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>AI 助手</div>
            <div style={{ fontSize: '12px', color: theme === 'light' ? '#8e8e93' : '#9090a4' }}>随时为你提供帮助</div>
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
              maxWidth: '80%',
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
