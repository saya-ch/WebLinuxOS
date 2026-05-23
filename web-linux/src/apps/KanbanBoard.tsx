import { useState, useEffect } from 'react';
import { useStore } from '../store';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

interface StoredTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface StoredColumn {
  id: string;
  title: string;
  color: string;
  tasks: StoredTask[];
}

const initialColumns: Column[] = [
  {
    id: 'todo',
    title: '待办',
    color: '#6c5ce7',
    tasks: [
      { id: '1', title: '学习 React 19 新特性', priority: 'high', createdAt: new Date() },
      { id: '2', title: '完成 WebLinux 项目', priority: 'high', createdAt: new Date() },
    ],
  },
  {
    id: 'inprogress',
    title: '进行中',
    color: '#007aff',
    tasks: [
      { id: '3', title: '优化代码结构', priority: 'medium', createdAt: new Date() },
    ],
  },
  {
    id: 'review',
    title: '审核',
    color: '#ff9500',
    tasks: [],
  },
  {
    id: 'done',
    title: '完成',
    color: '#34c759',
    tasks: [
      { id: '4', title: '项目初始化', priority: 'low', createdAt: new Date() },
    ],
  },
];

export default function KanbanBoard() {
  const theme = useStore((s) => s.theme);
  const [columns, setColumns] = useState<Column[]>(() => {
    const saved = localStorage.getItem('weblinux-kanban');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as StoredColumn[];
        return parsed.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => ({
            ...t,
            createdAt: new Date(t.createdAt),
          })),
        }));
      } catch {
        return initialColumns;
      }
    }
    return initialColumns;
  });
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<string>('todo');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [draggedTask, setDraggedTask] = useState<{ task: Task; fromColumn: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('weblinux-kanban', JSON.stringify(columns));
  }, [columns]);

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      priority: selectedPriority,
      createdAt: new Date(),
    };
    
    setColumns(prev => prev.map(col => 
      col.id === selectedColumn 
        ? { ...col, tasks: [...col.tasks, newTask] }
        : col
    ));
    
    setNewTaskTitle('');
  };

  const moveTask = (taskId: string, fromColId: string, toColId: string) => {
    setColumns(prev => {
      const fromCol = prev.find(c => c.id === fromColId);
      const task = fromCol?.tasks.find(t => t.id === taskId);
      
      if (!task) return prev;
      
      return prev.map(col => {
        if (col.id === fromColId) {
          return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) };
        }
        if (col.id === toColId) {
          return { ...col, tasks: [...col.tasks, task] };
        }
        return col;
      });
    });
  };

  const deleteTask = (taskId: string, colId: string) => {
    setColumns(prev => prev.map(col => 
      col.id === colId 
        ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
        : col
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff3b30';
      case 'medium': return '#ff9500';
      case 'low': return '#34c759';
      default: return '#8e8e93';
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
      }}
    >
      <div style={{ 
        padding: '16px', 
        borderBottom: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
        background: theme === 'light' ? '#ffffff' : '#252536',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '28px' }}>📋</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>任务看板</div>
            <div style={{ fontSize: '12px', color: theme === 'light' ? '#8e8e93' : '#9090a4' }}>
              拖拽任务来管理你的工作流程
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="添加新任务..."
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
              background: theme === 'light' ? '#f0f0f5' : '#1e1e2e',
              color: 'inherit',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
              background: theme === 'light' ? '#f0f0f5' : '#1e1e2e',
              color: 'inherit',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {columns.map(col => (
              <option key={col.id} value={col.id}>{col.title}</option>
            ))}
          </select>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as 'low' | 'medium' | 'high')}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
              background: theme === 'light' ? '#f0f0f5' : '#1e1e2e',
              color: 'inherit',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <option value="low">低优先级</option>
            <option value="medium">中优先级</option>
            <option value="high">高优先级</option>
          </select>
          <button
            onClick={addTask}
            disabled={!newTaskTitle.trim()}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: newTaskTitle.trim() 
                ? (theme === 'light' ? '#007aff' : '#6c5ce7') 
                : (theme === 'light' ? '#c7c7cc' : '#4a4a7a'),
              color: '#fff',
              cursor: newTaskTitle.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            添加任务
          </button>
        </div>
      </div>
      
      <div style={{ 
        flex: 1, 
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '16px',
        display: 'flex',
        gap: '16px',
      }}>
        {columns.map((col) => (
          <div
            key={col.id}
            style={{
              minWidth: '280px',
              maxWidth: '320px',
              display: 'flex',
              flexDirection: 'column',
              background: theme === 'light' ? '#ffffff' : '#252536',
              borderRadius: '12px',
              border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
              overflow: 'hidden',
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.background = theme === 'light' ? '#e0e0e8' : '#2a2a3e';
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.background = theme === 'light' ? '#ffffff' : '#252536';
            }}
            onDrop={(e) => {
              e.currentTarget.style.background = theme === 'light' ? '#ffffff' : '#252536';
              if (draggedTask && draggedTask.fromColumn !== col.id) {
                moveTask(draggedTask.task.id, draggedTask.fromColumn, col.id);
              }
              setDraggedTask(null);
            }}
          >
            <div style={{ 
              padding: '12px 16px',
              background: `${col.color}20`,
              borderBottom: `1px solid ${col.color}40`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  background: col.color 
                }} />
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{col.title}</span>
              </div>
              <span style={{ 
                fontSize: '12px', 
                background: col.color,
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '10px',
              }}>
                {col.tasks.length}
              </span>
            </div>
            
            <div style={{ 
              flex: 1, 
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              minHeight: '200px',
            }}>
              {col.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDraggedTask({ task, fromColumn: col.id })}
                  onDragEnd={() => setDraggedTask(null)}
                  style={{
                    padding: '12px',
                    background: theme === 'light' ? '#f0f0f5' : '#1e1e2e',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'light' ? '#d1d1d6' : '#3a3a5c'}`,
                    cursor: 'grab',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    opacity: draggedTask?.task.id === task.id ? 0.5 : 1,
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>
                      {task.title}
                    </div>
                    <button
                      onClick={() => deleteTask(task.id, col.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme === 'light' ? '#8e8e93' : '#9090a4',
                        cursor: 'pointer',
                        padding: '4px',
                        fontSize: '16px',
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ 
                    marginTop: '8px', 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{ 
                      fontSize: '11px', 
                      color: getPriorityColor(task.priority),
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}>
                      {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}优先级
                    </span>
                    <span style={{ 
                      fontSize: '11px', 
                      color: theme === 'light' ? '#8e8e93' : '#9090a4',
                    }}>
                      {task.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              
              {col.tasks.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '32px 16px',
                  color: theme === 'light' ? '#8e8e93' : '#9090a4',
                  fontSize: '13px',
                }}>
                  暂无任务
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
