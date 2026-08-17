import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Cpu, Activity, Clock, Rocket, Play, Check, Trash2, Plus, ChevronRight, Sparkles } from 'lucide-react';

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

interface AppEntry {
  id: string;
  name: string;
  icon: string;
  category: string;
  color: string;
}

const QUICK_APPS: AppEntry[] = [
  { id: 'terminal', name: '终端', icon: '⌨️', category: '系统', color: '#3b82f6' },
  { id: 'code-editor', name: '代码编辑器', icon: '📝', category: '开发', color: '#8b5cf6' },
  { id: 'calculator', name: '计算器', icon: '🧮', category: '工具', color: '#06b6d4' },
  { id: 'file-manager', name: '文件管理器', icon: '📁', category: '系统', color: '#f59e0b' },
  { id: 'browser', name: '浏览器', icon: '🌐', category: '网络', color: '#10b981' },
  { id: 'text-editor', name: '文本编辑器', icon: '📄', category: '办公', color: '#ef4444' },
  { id: 'settings', name: '设置', icon: '⚙️', category: '系统', color: '#6b7280' },
  { id: 'paint', name: '绘图', icon: '🎨', category: '多媒体', color: '#ec4899' },
];

const QUOTES = [
  { text: '代码如诗，简洁为美。', author: '未知' },
  { text: '先让它能跑起来，再让它跑得对，最后让它跑得快。', author: 'Kent Beck' },
  { text: '过早优化是万恶之源。', author: 'Donald Knuth' },
  { text: '命名是计算机科学中最困难的两件事之一。', author: 'Phil Karlton' },
  { text: '代码就像幽默。当你不得不解释它时，它就不那么好了。', author: 'Cory House' },
  { text: '最好的代码是你永远不必写的代码。', author: 'Jeff Atwood' },
  { text: '程序员的三大美德：懒惰、急躁和傲慢。', author: 'Larry Wall' },
  { text: '第一次就写对一个程序是神话。', author: 'Gerald Weinberg' },
];

const DevEfficiencyDashboard: React.FC = () => {
  const [fps, setFps] = useState(60);
  const [memory, setMemory] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [clockTime, setClockTime] = useState(new Date());
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem('dev-dashboard-todos');
    return saved ? JSON.parse(saved) : [
      { id: '1', text: '熟悉代码库结构', done: true, createdAt: Date.now() - 3600000 },
      { id: '2', text: '完成功能开发任务', done: false, createdAt: Date.now() - 1800000 },
      { id: '3', text: '代码审查与优化', done: false, createdAt: Date.now() },
    ];
  });
  const [newTodo, setNewTodo] = useState('');
  const [quote, setQuote] = useState(QUOTES[0]);
  const [workStats, setWorkStats] = useState({ tasksCompleted: 0, totalTime: 0 });

  useEffect(() => {
    const quoteIndex = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[quoteIndex]);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setClockTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateMemory = () => {
      if ('performance' in window && 'memory' in performance) {
        const mem = (performance as any).memory;
        setMemory(Math.round(mem.usedJSHeapSize / (1024 * 1024)));
      }
    };
    updateMemory();
    const interval = setInterval(updateMemory, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const countFrames = () => {
      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }
      rafId = requestAnimationFrame(countFrames);
    };
    rafId = requestAnimationFrame(countFrames);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    localStorage.setItem('dev-dashboard-todos', JSON.stringify(todos));
    const completedCount = todos.filter(t => t.done).length;
    setWorkStats(prev => ({ ...prev, tasksCompleted: completedCount }));
  }, [todos]);

  const addTodo = useCallback(() => {
    if (!newTodo.trim()) return;
    setTodos(prev => [
      ...prev,
      { id: Date.now().toString(), text: newTodo.trim(), done: false, createdAt: Date.now() },
    ]);
    setNewTodo('');
  }, [newTodo]);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  const openApp = useCallback((appId: string) => {
    const event = new CustomEvent('weblinux:open-app', { detail: { appId } });
    window.dispatchEvent(event);
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
  };

  const completedTasks = todos.filter(t => t.done).length;
  const totalTasks = todos.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        color: '#e2e8f0',
        padding: 20,
        gap: 16,
        overflow: 'auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={24} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              开发者效率仪表板
              <Sparkles size={16} style={{ color: '#fbbf24' }} />
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(clockTime)}</div>
          </div>
        </div>
        <div
          style={{
            padding: '10px 20px',
            borderRadius: 16,
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            fontSize: 28,
            fontWeight: 700,
            fontFamily: 'monospace',
          }}
        >
          {clockTime.toLocaleTimeString('zh-CN', { hour12: false })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#60a5fa', fontSize: 13, fontWeight: 600 }}>
            <Activity size={16} />
            <span>FPS 帧率</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: fps >= 50 ? '#10b981' : fps >= 30 ? '#fbbf24' : '#ef4444' }}>
            {fps}
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }}>
            <div
              style={{
                height: '100%',
                borderRadius: 3,
                width: `${Math.min(fps / 60 * 100, 100)}%`,
                background: fps >= 50 ? '#10b981' : fps >= 30 ? '#fbbf24' : '#ef4444',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>

        <div
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a78bfa', fontSize: 13, fontWeight: 600 }}>
            <Cpu size={16} />
            <span>内存使用</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{memory} <span style={{ fontSize: 16, color: '#94a3b8' }}>MB</span></div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }}>
            <div
              style={{
                height: '100%',
                borderRadius: 3,
                width: `${Math.min(memory / 500 * 100, 100)}%`,
                background: '#a78bfa',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>

        <div
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontSize: 13, fontWeight: 600 }}>
            <Clock size={16} />
            <span>运行时间</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'monospace' }}>{formatUptime(uptime)}</div>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>自启动以来</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1 }}>
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Rocket size={18} color="#f472b6" />
              <span style={{ fontSize: 16, fontWeight: 600 }}>待办事项</span>
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              进度: {completedTasks}/{totalTasks} ({progressPercent}%)
            </div>
          </div>

          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }}>
            <div
              style={{
                height: '100%',
                borderRadius: 3,
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #f472b6, #a78bfa)',
                transition: 'width 0.3s',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              placeholder="添加新任务..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(99, 102, 241, 0.3)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: '#e2e8f0',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <button
              onClick={addTodo}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600,
              }}
            >
              <Plus size={16} />
              添加
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todos.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>
                暂无待办任务，开始添加吧！
              </div>
            ) : (
              todos.map(todo => (
                <div
                  key={todo.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: todo.done ? 'rgba(16, 185, 129, 0.1)' : 'rgba(15, 23, 42, 0.6)',
                    border: `1px solid ${todo.done ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
                    transition: 'all 0.2s',
                  }}
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: `2px solid ${todo.done ? '#10b981' : '#6366f1'}`,
                      background: todo.done ? '#10b981' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {todo.done && <Check size={14} color="white" />}
                  </button>
                  <span
                    style={{
                      flex: 1,
                      textDecoration: todo.done ? 'line-through' : 'none',
                      opacity: todo.done ? 0.6 : 1,
                      fontSize: 14,
                    }}
                  >
                    {todo.text}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: 4,
                      opacity: 0.5,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              fontStyle: 'italic',
              fontSize: 13,
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Sparkles size={14} />
            "{quote.text}" — {quote.author}
          </div>
        </div>

        <div
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Play size={18} color="#34d399" />
            <span style={{ fontSize: 16, fontWeight: 600 }}>快捷应用</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {QUICK_APPS.map(app => (
              <button
                key={app.id}
                onClick={() => openApp(app.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = app.color;
                  e.currentTarget.style.boxShadow = `0 4px 12px ${app.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${app.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  {app.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{app.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{app.category}</div>
                </div>
                <ChevronRight size={16} style={{ color: '#64748b' }} />
              </button>
            ))}
          </div>

          <div
            style={{
              marginTop: 'auto',
              padding: '12px 16px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{workStats.tasksCompleted}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>已完成任务</div>
            </div>
            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#60a5fa' }}>{QUICK_APPS.length}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>快捷应用</div>
            </div>
            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#a78bfa' }}>{todos.length}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>总任务</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevEfficiencyDashboard;
