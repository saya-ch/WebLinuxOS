import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';

interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: 'python' | 'javascript' | 'html' | 'css';
  content: string;
  code: string;
  challenge: string;
}

const defaultLessons: Lesson[] = [
  {
    id: '1',
    title: 'Python 基础：Hello World',
    description: '学习如何编写你的第一个 Python 程序',
    difficulty: 'beginner',
    language: 'python',
    content: '# Python 基础课程\n\n在这节课中，我们将学习如何使用 Python 输出 "Hello, World!"。这是每个程序员的第一步！',
    code: 'print("Hello, World!")',
    challenge: '修改代码，让它输出你的名字'
  },
  {
    id: '2',
    title: 'JavaScript：变量与函数',
    description: '学习 JS 的基本语法',
    difficulty: 'beginner',
    language: 'javascript',
    content: '// JavaScript 基础\n\n学习如何声明变量和创建函数',
    code: 'function greet(name) {\n  return "Hello, " + name + "!";\n}\n\nconsole.log(greet("WebLinux"));',
    challenge: '创建一个加法函数'
  },
  {
    id: '3',
    title: 'HTML：构建网页',
    description: '学习 HTML 标签和结构',
    difficulty: 'beginner',
    language: 'html',
    content: '<!-- HTML 基础 -->\n\n学习如何创建网页结构',
    code: '<!DOCTYPE html>\n<html>\n<head>\n  <title>我的第一个网页</title>\n</head>\n<body>\n  <h1>Hello, Web!</h1>\n</body>\n</html>',
    challenge: '添加更多的 HTML 元素'
  }
];

export default function AICodeTutor() {
  const { theme } = useStore();
  const [currentLesson, setCurrentLesson] = useState<Lesson>(defaultLessons[0]);
  const [code, setCode] = useState(defaultLessons[0].code);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: '你好！我是你的 AI 编程导师。让我们开始学习吧！' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const isDark = theme === 'dark';
  const bg = isDark ? '#1e1e2e' : '#f7f7fa';
  const cardBg = isDark ? '#252536' : '#ffffff';
  const border = isDark ? '#3a3a5c' : '#e0e0e6';
  const text = isDark ? '#e0e0e8' : '#1c1c1e';
  const accent = isDark ? '#6c5ce7' : '#007aff';
  const success = isDark ? '#00b894' : '#34c759';

  const runCode = async () => {
    setIsRunning(true);
    setOutput('');
    
    try {
      if (currentLesson.language === 'javascript') {
        const logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(' '));
        
        try {
          const result = Function(code)();
          if (result !== undefined) logs.push(String(result));
        } finally {
          console.log = originalLog;
        }
        
        setOutput(logs.join('\n') || '代码执行成功！');
      } else if (currentLesson.language === 'html') {
        setOutput('HTML 预览模式已激活！\n(在浏览器中打开查看效果)');
      } else if (currentLesson.language === 'python') {
        // 模拟 Python 执行
        setOutput('Python 代码运行成功！\n(需要安装 Pyodide 才能运行真实代码)');
      } else {
        setOutput('代码已准备就绪！');
      }
    } catch {
      setOutput('代码执行出错！');
    } finally {
      setIsRunning(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    
    // 模拟 AI 回复
    setTimeout(() => {
      const responses = [
        '很好的问题！让我为你解释一下。',
        '这个概念很重要，让我们详细探讨。',
        '你问得很好！这里有一个例子。',
        '让我帮你理解这个问题。'
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `${randomResponse}\n\n关于 "${userMsg}"，这是我的建议...` 
      }]);
    }, 800);
  };

  const selectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setCode(lesson.code);
    setOutput('');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: bg,
      color: text,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${border}`,
        background: cardBg,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🎓</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '18px' }}>AI 编程导师</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>交互式编程学习平台</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowChallenge(!showChallenge)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${border}`,
              background: showChallenge ? accent : cardBg,
              color: showChallenge ? '#fff' : text,
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            🎯 挑战模式
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧：课程列表 */}
        <div style={{
          width: '240px',
          borderRight: `1px solid ${border}`,
          background: cardBg,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: `1px solid ${border}`,
            fontWeight: 600,
            fontSize: '14px'
          }}>
            📚 课程列表
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {defaultLessons.map(lesson => (
              <div
                key={lesson.id}
                onClick={() => selectLesson(lesson)}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: currentLesson.id === lesson.id ? accent : 'transparent',
                  color: currentLesson.id === lesson.id ? '#fff' : text,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '4px' }}>
                  {lesson.title}
                </div>
                <div style={{
                  fontSize: '11px',
                  opacity: 0.7,
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{lesson.language.toUpperCase()}</span>
                  <span>{lesson.difficulty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 中间：课程内容和代码编辑器 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 课程内容 */}
          <div style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            borderBottom: `1px solid ${border}`
          }}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '22px' }}>
              {currentLesson.title}
            </h2>
            <p style={{ margin: '0 0 20px 0', opacity: 0.8, fontSize: '14px' }}>
              {currentLesson.description}
            </p>
            
            <div style={{
              background: isDark ? '#1a1a2e' : '#f0f0f5',
              padding: '16px',
              borderRadius: '8px',
              whiteSpace: 'pre-wrap',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              {currentLesson.content}
            </div>

            {showChallenge && (
              <div style={{
                background: isDark ? '#2d3436' : '#fff3cd',
                padding: '16px',
                borderRadius: '8px',
                borderLeft: `4px solid ${accent}`
              }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                  🎯 今日挑战
                </div>
                <div style={{ fontSize: '14px' }}>
                  {currentLesson.challenge}
                </div>
              </div>
            )}
          </div>

          {/* 代码编辑器和输出 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              padding: '12px 16px',
              background: cardBg,
              borderBottom: `1px solid ${border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 500, fontSize: '13px' }}>
                💻 {currentLesson.language.toUpperCase()} 编辑器
              </span>
              <button
                onClick={runCode}
                disabled={isRunning}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isRunning ? (isDark ? '#4a4a7a' : '#c7c7cc') : success,
                  color: '#fff',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 500
                }}
              >
                {isRunning ? '⏳ 运行中...' : '▶ 运行代码'}
              </button>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
              {/* 代码编辑器 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{
                    flex: 1,
                    width: '100%',
                    padding: '16px',
                    border: 'none',
                    background: isDark ? '#1a1a2e' : '#fafafa',
                    color: isDark ? '#dcdcdc' : '#2d3436',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>
              
              {/* 输出面板 */}
              <div style={{
                width: '50%',
                borderLeft: `1px solid ${border}`,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  padding: '12px 16px',
                  background: cardBg,
                  borderBottom: `1px solid ${border}`,
                  fontWeight: 500,
                  fontSize: '13px'
                }}>
                  📤 输出结果
                </div>
                <div style={{
                  flex: 1,
                  padding: '16px',
                  background: isDark ? '#0d1117' : '#f8f8f8',
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                  fontSize: '13px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap'
                }}>
                  {output || '点击"运行代码"查看输出'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：AI 聊天导师 */}
        <div style={{
          width: '320px',
          borderLeft: `1px solid ${border}`,
          background: cardBg,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: `1px solid ${border}`,
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🤖 AI 导师
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '12px'
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: msg.role === 'user' ? accent : (isDark ? '#3a3a5c' : '#f0f0f5'),
                  color: msg.role === 'user' ? '#fff' : text,
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          
          <div style={{
            padding: '12px',
            borderTop: `1px solid ${border}`
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                placeholder="向导师提问..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '20px',
                  border: `1px solid ${border}`,
                  background: bg,
                  color: text,
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleChatSend}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  background: accent,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}