import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import {
  LayoutGrid, Save, Trash2, Download, Upload,
  Plus, Monitor, Code, Palette, Briefcase,
  Home, Zap, Clock, Check, AlertCircle
} from 'lucide-react';

interface WorkspaceConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  createdAt: number;
  lastUsedAt: number;
  windows: SavedWindow[];
}

interface SavedWindow {
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
}

const PRESET_WORKSPACES = [
  { name: '开发模式', description: '代码编辑器 + 终端 + 浏览器', icon: 'code', color: '#3b82f6' },
  { name: '设计模式', description: '白板 + 配色工具 + 图片查看器', icon: 'palette', color: '#8b5cf6' },
  { name: '办公模式', description: '文档 + 表格 + 任务管理', icon: 'briefcase', color: '#10b981' },
  { name: '学习模式', description: '笔记 + 阅读器 + 翻译工具', icon: 'home', color: '#f59e0b' },
];

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'code': return Code;
    case 'palette': return Palette;
    case 'briefcase': return Briefcase;
    case 'home': return Home;
    default: return LayoutGrid;
  }
};

export default function WorkspaceManager() {
  const theme = useStore((s) => s.theme);
  const windows = useStore((s) => s.windows);
  const openApp = useStore((s) => s.openApp);
  const clearWindows = useStore((s) => s.clearWindows);
  const updateWindowPosition = useStore((s) => s.updateWindowPosition);
  const updateWindowSize = useStore((s) => s.updateWindowSize);
  const maximizeWindow = useStore((s) => s.maximizeWindow);
  const minimizeWindow = useStore((s) => s.minimizeWindow);

  const [workspaces, setWorkspaces] = useState<WorkspaceConfig[]>([]);
  const [activeTab, setActiveTab] = useState<'saved' | 'presets'>('saved');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('weblinux-workspaces');
      if (saved) {
        setWorkspaces(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load workspaces:', e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('weblinux-workspaces', JSON.stringify(workspaces));
  }, [workspaces]);

  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const saveCurrentWorkspace = useCallback((name: string) => {
    const currentWindows = windows.map((w) => ({
      appId: w.appId,
      title: w.title,
      x: w.x,
      y: w.y,
      width: w.width,
      height: w.height,
      minimized: w.minimized,
      maximized: w.maximized,
    }));

    if (currentWindows.length === 0) {
      showNotification('error', '当前没有打开的窗口');
      return;
    }

    const newWorkspace: WorkspaceConfig = {
      id: `ws-${Date.now()}`,
      name,
      description: `${currentWindows.length} 个窗口`,
      icon: 'layout',
      color: '#6366f1',
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      windows: currentWindows,
    };

    setWorkspaces((prev) => [newWorkspace, ...prev]);
    setShowSaveDialog(false);
    setSaveAsName('');
    showNotification('success', '已保存工作空间');
  }, [windows, showNotification]);

  const loadWorkspace = useCallback(async (workspace: WorkspaceConfig) => {
    setLoading(workspace.id);
    
    try {
      clearWindows();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      for (const win of workspace.windows) {
        openApp(win.appId);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      setTimeout(() => {
        const currentWindows = useStore.getState().windows;
        workspace.windows.forEach((savedWin, index) => {
          const winIndex = currentWindows.length - workspace.windows.length + index;
          const currentWin = currentWindows[winIndex];
          if (currentWin) {
            if (savedWin.maximized) {
              maximizeWindow(currentWin.id);
            } else if (savedWin.minimized) {
              minimizeWindow(currentWin.id);
            } else {
              updateWindowPosition(currentWin.id, savedWin.x, savedWin.y);
              updateWindowSize(currentWin.id, savedWin.width, savedWin.height);
            }
          }
        });
      }, 500);

      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === workspace.id ? { ...w, lastUsedAt: Date.now() } : w
        )
      );

      showNotification('success', '已加载 ' + workspace.name);
    } catch (e) {
      console.error('Failed to load workspace:', e);
      showNotification('error', '加载工作空间失败');
    } finally {
      setLoading(null);
    }
  }, [clearWindows, openApp, maximizeWindow, minimizeWindow, updateWindowPosition, updateWindowSize, showNotification]);

  const deleteWorkspace = useCallback((id: string) => {
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    showNotification('success', '已删除工作空间');
  }, [showNotification]);

  const exportWorkspace = useCallback((workspace: WorkspaceConfig) => {
    const dataStr = JSON.stringify(workspace, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = workspace.name + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importWorkspace = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workspace = JSON.parse(e.target?.result as string);
        workspace.id = 'ws-' + Date.now();
        workspace.createdAt = Date.now();
        workspace.lastUsedAt = Date.now();
        setWorkspaces((prev) => [workspace, ...prev]);
        showNotification('success', '已导入工作空间');
      } catch {
        showNotification('error', '导入失败，文件格式不正确');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [showNotification]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentWindowCount = windows.length;

  const bgColor = theme === 'dark' ? '#1a1a2e' : '#f8f9fa';
  const textColor = theme === 'dark' ? '#e0e0e0' : '#333';
  const borderColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const cardBg = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
  const cardBorder = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: bgColor,
      color: textColor,
    }}>
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid ' + borderColor,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>工作空间管理器</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, opacity: 0.7 }}>
            当前打开 {currentWindowCount} 个窗口
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <label style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid ' + (theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
          }}>
            <Upload size={16} />
            导入
            <input
              type="file"
              accept=".json"
              onChange={importWorkspace}
              style={{ display: 'none' }}
            />
          </label>
          <button
            onClick={() => setShowSaveDialog(true)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <Save size={16} />
            保存当前
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        borderBottom: '1px solid ' + borderColor,
      }}>
        {[
          { id: 'saved', label: '已保存', icon: Clock },
          { id: 'presets', label: '预设模板', icon: Zap },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'saved' | 'presets')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              color: activeTab === tab.id
                ? textColor
                : (theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              borderBottom: activeTab === tab.id
                ? '2px solid #6366f1'
                : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.id === 'saved' && workspaces.length > 0 && (
              <span style={{
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#6366f1',
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 11,
              }}>
                {workspaces.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 20,
      }}>
        {activeTab === 'saved' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {workspaces.length === 0 ? (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '60px 20px',
                opacity: 0.6,
              }}>
                <LayoutGrid size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <p style={{ margin: '0 0 8px 0', fontSize: 16 }}>还没有保存的工作空间</p>
                <p style={{ margin: 0, fontSize: 13 }}>
                  打开一些应用，然后点击保存当前来创建你的第一个工作空间
                </p>
              </div>
            ) : (
              workspaces.map((workspace) => {
                const IconComp = getIconComponent(workspace.icon);
                return (
                  <div
                    key={workspace.id}
                    onDoubleClick={() => loadWorkspace(workspace)}
                    style={{
                      background: cardBg,
                      border: '1px solid ' + cardBorder,
                      borderRadius: 12,
                      padding: 16,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    {loading === workspace.id && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                      }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          border: '3px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: workspace.color + '20',
                        color: workspace.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <IconComp size={22} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{workspace.name}</h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: 12, opacity: 0.6 }}>
                          {workspace.description}
                        </p>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      opacity: 0.5,
                      marginBottom: 12,
                    }}>
                      <Clock size={12} />
                      上次使用: {formatDate(workspace.lastUsedAt)}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => loadWorkspace(workspace)}
                        disabled={loading === workspace.id}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: 'none',
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          color: 'white',
                          cursor: loading === workspace.id ? 'not-allowed' : 'pointer',
                          fontSize: 12,
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          opacity: loading === workspace.id ? 0.6 : 1,
                        }}
                      >
                        <Monitor size={14} />
                        加载
                      </button>
                      <button
                        onClick={() => exportWorkspace(workspace)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: '1px solid ' + (theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                          background: 'transparent',
                          color: 'inherit',
                          cursor: 'pointer',
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="导出"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => deleteWorkspace(workspace.id)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 6,
                          border: '1px solid ' + (theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                          background: 'transparent',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'presets' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {PRESET_WORKSPACES.map((preset, index) => {
              const IconComp = getIconComponent(preset.icon);
              return (
                <div
                  key={index}
                  style={{
                    background: cardBg,
                    border: '1px solid ' + cardBorder,
                    borderRadius: 12,
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: preset.color + '20',
                      color: preset.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <IconComp size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{preset.name}</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: 12, opacity: 0.6 }}>
                        {preset.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      showNotification('info', '预设模板功能开发中...');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid ' + preset.color + '40',
                      background: preset.color + '10',
                      color: preset.color,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <Plus size={14} />
                    使用模板
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showSaveDialog && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            background: theme === 'dark' ? '#1e1e3a' : '#fff',
            borderRadius: 12,
            padding: 24,
            width: '90%',
            maxWidth: 360,
            boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>保存工作空间</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: 13, opacity: 0.7 }}>
              将当前打开的 {currentWindowCount} 个窗口保存为工作空间
            </p>
            <input
              type="text"
              value={saveAsName}
              onChange={(e) => setSaveAsName(e.target.value)}
              placeholder="输入工作空间名称..."
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid ' + (theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                color: 'inherit',
                fontSize: 14,
                marginBottom: 16,
                boxSizing: 'border-box',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && saveAsName.trim()) {
                  saveCurrentWorkspace(saveAsName.trim());
                }
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveAsName('');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid ' + (theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                  background: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (saveAsName.trim()) {
                    saveCurrentWorkspace(saveAsName.trim());
                  }
                }}
                disabled={!saveAsName.trim()}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  cursor: saveAsName.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 500,
                  opacity: saveAsName.trim() ? 1 : 0.5,
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          borderRadius: 8,
          background: notification.type === 'success' ? '#10b981' : notification.type === 'error' ? '#ef4444' : '#3b82f6',
          color: 'white',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 200,
          animation: 'slideUp 0.3s ease',
        }}>
          {notification.type === 'success' ? <Check size={16} /> : notification.type === 'error' ? <AlertCircle size={16} /> : <Plus size={16} />}
          {notification.message}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
