import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radio,
  Link2,
  Copy,
  Send,
  Trash2,
  Wifi,
  WifiOff,
  Check,
  Code,
  FileText,
  Globe,
  RefreshCw,
  History,
  Sparkles,
  Zap,
  X,
  Download,
  Share2,
  Shield,
} from 'lucide-react';

type ContentType = 'text' | 'code' | 'link';
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface SyncMessage {
  id: string;
  type: ContentType;
  content: string;
  title?: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}

interface PeerInfo {
  id: string;
  name: string;
  connectedAt: number;
  lastSeen: number;
}

interface ToastNotification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const STORAGE_KEY = 'cross-device-sync-history';
const CHANNEL_NAME = 'weblinux-cross-device-sync';
const MAX_HISTORY = 20;
const PEER_TIMEOUT = 15000;

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const getDeviceName = (): string => {
  const saved = localStorage.getItem('cross-device-sync-name');
  if (saved) return saved;
  const adjectives = ['迅捷', '优雅', '神秘', '闪耀', '勇敢', '智慧', '灵巧', '敏锐'];
  const nouns = ['设备', '终端', '工作站', '节点', '端口', '枢纽'];
  const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}`;
  localStorage.setItem('cross-device-sync-name', name);
  return name;
};

const detectContentType = (content: string): ContentType => {
  const trimmed = content.trim();
  if (/^https?:\/\//i.test(trimmed)) return 'link';
  const codePatterns = [
    /^(const|let|var|function|class|import|export|if|for|while|return|async|await)\s/m,
    /[{}\[\];]\s*$/,
    /^(def |import |from |class |print\()/m,
    /^(<!DOCTYPE|<html|<head|<body|<div|<script|<style)/i,
    /^{[\s\S]*}$/,
    /^\[[\s\S]*\]$/,
  ];
  if (codePatterns.some((p) => p.test(trimmed))) return 'code';
  return 'text';
};

const getTypeIcon = (type: ContentType) => {
  switch (type) {
    case 'code':
      return Code;
    case 'link':
      return Globe;
    default:
      return FileText;
  }
};

const getTypeColor = (type: ContentType): string => {
  switch (type) {
    case 'code':
      return '#00d6c1';
    case 'link':
      return '#7c6cf0';
    default:
      return '#f0f0ff';
  }
};

const loadHistory = (): SyncMessage[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveHistory = (messages: SyncMessage[]): void => {
  try {
    const trimmed = messages.slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    const size = JSON.stringify(messages.slice(0, MAX_HISTORY / 2));
    localStorage.setItem(STORAGE_KEY, size);
  }
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export default function CrossDeviceSync() {
  const [channel, setChannel] = useState<BroadcastChannel | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<SyncMessage[]>(() => loadHistory());
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [inputType, setInputType] = useState<ContentType | 'auto'>('auto');
  const [deviceName, setDeviceName] = useState<string>(() => getDeviceName());
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [autoDetectedType, setAutoDetectedType] = useState<ContentType>('text');

  const myIdRef = useRef<string>(generateId());
  const toastIdRef = useRef(0);
  const peersRef = useRef<PeerInfo[]>([]);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addToast = useCallback((message: string, type: ToastNotification['type'] = 'info') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    const detected = detectContentType(inputValue);
    setAutoDetectedType(detected);
  }, [inputValue]);

  const addMessage = useCallback((msg: SyncMessage) => {
    setMessages((prev) => {
      const next = [msg, ...prev];
      saveHistory(next);
      return next.slice(0, MAX_HISTORY);
    });
  }, []);

  const connectChannel = useCallback(() => {
    if (typeof BroadcastChannel === 'undefined') {
      setConnectionStatus('disconnected');
      setSyncError('当前浏览器不支持 BroadcastChannel API');
      return;
    }

    try {
      const ch = new BroadcastChannel(CHANNEL_NAME);

      ch.onmessage = (event: MessageEvent) => {
        const data = event.data;
        if (!data || !data.type) return;

        switch (data.type) {
          case 'sync-message': {
            if (data.message && data.message.senderId !== myIdRef.current) {
              addMessage(data.message);
              addToast(`收到来自 ${data.message.senderName} 的同步消息`, 'info');
            }
            break;
          }
          case 'peer-join': {
            if (data.peer && data.peer.id !== myIdRef.current) {
              setPeers((prev) => {
                const exists = prev.find((p) => p.id === data.peer.id);
                const updated = exists
                  ? prev.map((p) => (p.id === data.peer.id ? { ...p, lastSeen: Date.now() } : p))
                  : [...prev, { ...data.peer, lastSeen: Date.now() }];
                peersRef.current = updated;
                return updated;
              });
              ch.postMessage({
                type: 'peer-info',
                peer: {
                  id: myIdRef.current,
                  name: deviceName,
                  connectedAt: Date.now(),
                  lastSeen: Date.now(),
                },
              });
            }
            break;
          }
          case 'peer-info': {
            if (data.peer && data.peer.id !== myIdRef.current) {
              setPeers((prev) => {
                const exists = prev.find((p) => p.id === data.peer.id);
                const updated = exists
                  ? prev.map((p) => (p.id === data.peer.id ? { ...p, lastSeen: Date.now(), name: data.peer.name } : p))
                  : [...prev, { ...data.peer, lastSeen: Date.now() }];
                peersRef.current = updated;
                return updated;
              });
            }
            break;
          }
          case 'peer-leave': {
            setPeers((prev) => {
              const updated = prev.filter((p) => p.id !== data.peerId);
              peersRef.current = updated;
              return updated;
            });
            break;
          }
          case 'ping': {
            ch.postMessage({
              type: 'pong',
              peerId: myIdRef.current,
              name: deviceName,
              timestamp: Date.now(),
            });
            break;
          }
          case 'pong': {
            if (data.peerId && data.peerId !== myIdRef.current) {
              setPeers((prev) => {
                const exists = prev.find((p) => p.id === data.peerId);
                if (exists) {
                  const updated = prev.map((p) => (p.id === data.peerId ? { ...p, lastSeen: Date.now(), name: data.name || p.name } : p));
                  peersRef.current = updated;
                  return updated;
                }
                const newPeer: PeerInfo = {
                  id: data.peerId,
                  name: data.name || '未知设备',
                  connectedAt: Date.now(),
                  lastSeen: Date.now(),
                };
                const updated = [...prev, newPeer];
                peersRef.current = updated;
                return updated;
              });
            }
            break;
          }
          case 'clear-history': {
            setMessages([]);
            saveHistory([]);
            addToast('历史记录已被其他设备清除', 'info');
            break;
          }
        }
      };

      ch.postMessage({
        type: 'peer-join',
        peer: {
          id: myIdRef.current,
          name: deviceName,
          connectedAt: Date.now(),
          lastSeen: Date.now(),
        },
      });

      setChannel(ch);
      setConnectionStatus('connected');
      setSyncError(null);
    } catch (err) {
      setConnectionStatus('disconnected');
      setSyncError(`连接失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  }, [addMessage, addToast, deviceName]);

  useEffect(() => {
    connectChannel();
    return () => {
      if (channel) {
        channel.postMessage({ type: 'peer-leave', peerId: myIdRef.current });
        channel.close();
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newHistory: SyncMessage[] = JSON.parse(e.newValue);
          setMessages(newHistory);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (channel && connectionStatus === 'connected') {
        channel.postMessage({ type: 'ping', timestamp: Date.now() });

        setPeers((prev) => {
          const now = Date.now();
          const updated = prev.filter((p) => now - p.lastSeen < PEER_TIMEOUT);
          if (updated.length !== prev.length) {
            peersRef.current = updated;
            return updated;
          }
          return prev;
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [channel, connectionStatus]);

  const sendMessage = useCallback(() => {
    const content = inputValue.trim();
    if (!content || !channel) return;

    const type = inputType === 'auto' ? detectContentType(content) : inputType;

    const msg: SyncMessage = {
      id: generateId(),
      type,
      content,
      senderId: myIdRef.current,
      senderName: deviceName,
      timestamp: Date.now(),
    };

    channel.postMessage({
      type: 'sync-message',
      message: msg,
    });

    addMessage(msg);
    setInputValue('');
    addToast('消息已同步到所有设备', 'success');
  }, [channel, inputValue, inputType, deviceName, addMessage, addToast]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = useCallback(async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (id) setCopiedId(id);
      addToast('已复制到剪贴板', 'success');
      if (id) {
        setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
      }
    } catch {
      addToast('复制失败', 'error');
    }
  }, [addToast]);

  const copyAllContent = useCallback(async () => {
    if (messages.length === 0) {
      addToast('暂无同步内容可复制', 'info');
      return;
    }
    const allContent = messages
      .map((m) => `[${m.senderName}] ${new Date(m.timestamp).toLocaleString('zh-CN')}:\n${m.content}`)
      .join('\n\n---\n\n');
    try {
      await navigator.clipboard.writeText(allContent);
      addToast(`已复制 ${messages.length} 条同步内容`, 'success');
    } catch {
      addToast('复制失败', 'error');
    }
  }, [messages, addToast]);

  const deleteMessage = useCallback((id: string) => {
    setMessages((prev) => {
      const next = prev.filter((m) => m.id !== id);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    if (!confirm('确定要清除所有同步历史记录吗？此操作将通知所有设备。')) return;
    setMessages([]);
    saveHistory([]);
    if (channel) {
      channel.postMessage({ type: 'clear-history' });
    }
    addToast('历史记录已清除', 'info');
  }, [channel, addToast]);

  const downloadAll = useCallback(() => {
    if (messages.length === 0) {
      addToast('暂无同步内容可下载', 'info');
      return;
    }
    const data = {
      exportedAt: new Date().toISOString(),
      device: deviceName,
      messages: messages.map((m) => ({
        type: m.type,
        content: m.content,
        senderName: m.senderName,
        timestamp: m.timestamp,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sync-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('导出文件已下载', 'success');
  }, [messages, deviceName, addToast]);

  const reconnect = () => {
    if (channel) {
      channel.close();
    }
    setConnectionStatus('connecting');
    addToast('正在重新连接...', 'info');
    setTimeout(() => {
      connectChannel();
    }, 500);
  };

  const saveName = () => {
    const newName = tempName.trim();
    if (newName) {
      setDeviceName(newName);
      localStorage.setItem('cross-device-sync-name', newName);
      if (channel) {
        channel.postMessage({ type: 'peer-leave', peerId: myIdRef.current });
        setTimeout(() => {
          channel?.postMessage({
            type: 'peer-join',
            peer: {
              id: myIdRef.current,
              name: newName,
              connectedAt: Date.now(),
              lastSeen: Date.now(),
            },
          });
        }, 100);
      }
      addToast('设备名称已更新', 'success');
    }
    setEditingName(false);
  };

  const connectionColor =
    connectionStatus === 'connected' ? '#22c55e' : connectionStatus === 'connecting' ? '#f59e0b' : '#ef4444';
  const connectionLabel =
    connectionStatus === 'connected' ? '已连接' : connectionStatus === 'connecting' ? '连接中...' : '已断开';

  return (
    <div style={styles.container}>
      <div style={styles.glowOrb1} />
      <div style={styles.glowOrb2} />
      <div style={styles.glowOrb3} />

      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logoWrap}>
              <Radio size={22} style={{ color: '#c4b5fd' }} />
            </div>
            <div>
              <h1 style={styles.title}>跨设备同步</h1>
              <p style={styles.subtitle}>实时跨标签页/窗口消息传递</p>
            </div>
          </div>
          <div style={styles.headerRight}>
            <div style={{ ...styles.statusIndicator, borderColor: connectionColor }}>
              <div style={{ ...styles.statusDot, background: connectionColor }} />
              <span style={styles.statusText}>{connectionLabel}</span>
            </div>
            {connectionStatus !== 'connected' && (
              <button onClick={reconnect} style={styles.reconnectBtn} title="重新连接">
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        </div>

        <div style={styles.deviceInfoBar}>
          <div style={styles.deviceInfoLeft}>
            <Shield size={14} style={{ color: '#7c6cf0' }} />
            <span style={styles.deviceLabel}>本机标识：</span>
            {editingName ? (
              <div style={styles.nameEditWrap}>
                <input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  placeholder="输入设备名称"
                  autoFocus
                  style={styles.nameInput}
                />
                <button onClick={saveName} style={styles.nameSaveBtn}>
                  <Check size={14} />
                </button>
                <button onClick={() => setEditingName(false)} style={styles.nameCancelBtn}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <span style={styles.deviceName} onDoubleClick={() => { setTempName(deviceName); setEditingName(true); }}>
                {deviceName}
              </span>
            )}
          </div>
          <div style={styles.peerCount}>
            <Link2 size={12} style={{ color: '#a6e3a1' }} />
            <span>{peers.length} 台设备在线</span>
          </div>
        </div>

        {peers.length > 0 && (
          <div style={styles.peersRow}>
            {peers.map((peer) => (
              <div key={peer.id} style={styles.peerChip}>
                <Wifi size={12} style={{ color: '#a6e3a1' }} />
                <span>{peer.name}</span>
              </div>
            ))}
          </div>
        )}

        {syncError && (
          <div style={styles.errorBanner}>
            <WifiOff size={14} />
            <span>{syncError}</span>
            <button onClick={() => setSyncError(null)} style={styles.errorCloseBtn}>
              <X size={12} />
            </button>
          </div>
        )}

        <div style={styles.inputSection}>
          <div style={styles.inputHeader}>
            <div style={styles.inputLabel}>
              <Sparkles size={14} style={{ color: '#c4b5fd' }} />
              <span>快速同步</span>
            </div>
            <div style={styles.typeSelector}>
              {([
                { id: 'auto', label: '自动', icon: Zap },
                { id: 'text', label: '文本', icon: FileText },
                { id: 'code', label: '代码', icon: Code },
                { id: 'link', label: '链接', icon: Globe },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setInputType(id)}
                  style={{
                    ...styles.typeBtn,
                    ...(inputType === id ? styles.typeBtnActive : {}),
                  }}
                >
                  <Icon size={12} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.textareaWrap}>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入文本、代码或链接，跨设备实时同步... (Ctrl+Enter 发送)"
              style={styles.textarea}
            />
            {inputType === 'auto' && inputValue && (
              <div style={{
                ...styles.autoDetectBadge,
                color: getTypeColor(autoDetectedType),
              }}>
                检测为: {autoDetectedType === 'code' ? '代码' : autoDetectedType === 'link' ? '链接' : '文本'}
              </div>
            )}
          </div>

          <div style={styles.inputFooter}>
            <span style={styles.charCount}>{inputValue.length} 字符</span>
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || connectionStatus !== 'connected'}
              style={{
                ...styles.sendBtn,
                ...(!inputValue.trim() || connectionStatus !== 'connected' ? styles.sendBtnDisabled : {}),
              }}
            >
              <Send size={14} />
              <span>同步发送</span>
            </button>
          </div>
        </div>

        <div style={styles.historySection}>
          <div style={styles.historyHeader}>
            <div style={styles.historyTitle}>
              <History size={16} style={{ color: '#c4b5fd' }} />
              <span>同步历史</span>
              <span style={styles.countBadge}>{messages.length}/{MAX_HISTORY}</span>
            </div>
            <div style={styles.historyActions}>
              {messages.length > 0 && (
                <>
                  <button onClick={copyAllContent} style={styles.actionBtn} title="复制所有内容">
                    <Copy size={12} />
                    <span>复制全部</span>
                  </button>
                  <button onClick={downloadAll} style={styles.actionBtn} title="导出为文件">
                    <Download size={12} />
                    <span>导出</span>
                  </button>
                  <button onClick={clearHistory} style={styles.actionBtnDanger} title="清除历史">
                    <Trash2 size={12} />
                    <span>清除</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={styles.historyList}>
            {messages.length === 0 ? (
              <div style={styles.emptyState}>
                <Share2 size={32} style={{ color: '#45475a', marginBottom: 12 }} />
                <div style={styles.emptyTitle}>暂无同步记录</div>
                <div style={styles.emptyDesc}>在上方输入内容并发送，其他标签页/窗口将实时收到消息</div>
                <div style={styles.emptyTips}>
                  <div style={styles.tipItem}>
                    <Radio size={14} />
                    <span>同一浏览器多标签页/窗口实时通信</span>
                  </div>
                  <div style={styles.tipItem}>
                    <History size={14} />
                    <span>自动保存最近 20 条历史记录</span>
                  </div>
                  <div style={styles.tipItem}>
                    <Zap size={14} />
                    <span>智能识别文本/代码/链接类型</span>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const TypeIcon = getTypeIcon(msg.type);
                const typeColor = getTypeColor(msg.type);
                const isMine = msg.senderId === myIdRef.current;

                return (
                  <div key={msg.id} style={{ ...styles.messageCard, borderLeftColor: typeColor }}>
                    <div style={styles.messageHeader}>
                      <div style={styles.messageSender}>
                        <div style={{ ...styles.senderAvatar, background: isMine ? 'linear-gradient(135deg, #7c6cf0, #9b8af0)' : 'linear-gradient(135deg, #00d6c1, #00a896)' }}>
                          {msg.senderName.slice(0, 1)}
                        </div>
                        <div>
                          <div style={styles.senderName}>
                            {msg.senderName}
                            {isMine && <span style={styles.mineBadge}>我</span>}
                          </div>
                          <div style={styles.senderTime}>{formatTime(msg.timestamp)}</div>
                        </div>
                      </div>
                      <div style={styles.messageTypeTag}>
                        <TypeIcon size={12} style={{ color: typeColor }} />
                        <span style={{ color: typeColor }}>
                          {msg.type === 'code' ? '代码' : msg.type === 'link' ? '链接' : '文本'}
                        </span>
                      </div>
                    </div>
                    <div style={styles.messageContent}>
                      {msg.type === 'code' ? (
                        <pre style={styles.codeBlock}>{msg.content}</pre>
                      ) : msg.type === 'link' ? (
                        <a
                          href={msg.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ ...styles.linkText, color: typeColor }}
                        >
                          {msg.content}
                        </a>
                      ) : (
                        <div style={styles.textBlock}>{msg.content}</div>
                      )}
                    </div>
                    <div style={styles.messageActions}>
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        style={styles.msgActionBtn}
                      >
                        {copiedId === msg.id ? <Check size={12} style={{ color: '#22c55e' }} /> : <Copy size={12} />}
                        <span>{copiedId === msg.id ? '已复制' : '复制'}</span>
                      </button>
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        style={{ ...styles.msgActionBtn, color: '#f38ba8' }}
                      >
                        <Trash2 size={12} />
                        <span>删除</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div style={styles.toastContainer}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              ...styles.toast,
              ...(toast.type === 'success' ? styles.toastSuccess : {}),
              ...(toast.type === 'error' ? styles.toastError : {}),
            }}
          >
            {toast.type === 'success' ? <Check size={14} /> : toast.type === 'error' ? <X size={14} /> : <Sparkles size={14} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #0a0a14 0%, #0d0d1f 50%, #1a1a2e 100%)',
    color: '#f0f0ff',
    fontFamily: "'Geist', 'Plus Jakarta Sans', 'Noto Sans SC', sans-serif",
  },
  glowOrb1: {
    position: 'absolute',
    top: '-100px',
    right: '-100px',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(124, 108, 240, 0.15) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
    filter: 'blur(40px)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: '-80px',
    left: '-80px',
    width: '250px',
    height: '250px',
    background: 'radial-gradient(circle, rgba(0, 214, 193, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
    filter: 'blur(40px)',
  },
  glowOrb3: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    width: '200px',
    height: '200px',
    background: 'radial-gradient(circle, rgba(244, 114, 182, 0.08) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
    filter: 'blur(40px)',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    padding: '24px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logoWrap: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(124, 108, 240, 0.2), rgba(0, 214, 193, 0.15))',
    border: '1px solid rgba(124, 108, 240, 0.3)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 20px rgba(124, 108, 240, 0.2)',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    margin: 0,
    background: 'linear-gradient(135deg, #fff, #c4b5fd)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '12px',
    color: '#606080',
    margin: 0,
    marginTop: '2px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    background: 'rgba(20, 20, 35, 0.6)',
    border: '1px solid',
    borderRadius: '20px',
    backdropFilter: 'blur(10px)',
    fontSize: '12px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    boxShadow: '0 0 8px currentColor',
    animation: 'pulse 2s ease-in-out infinite',
  },
  statusText: {
    color: '#c0c0e0',
    fontWeight: 500,
  },
  reconnectBtn: {
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(124, 108, 240, 0.1)',
    border: '1px solid rgba(124, 108, 240, 0.3)',
    color: '#c4b5fd',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  deviceInfoBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'rgba(20, 20, 35, 0.4)',
    border: '1px solid rgba(124, 108, 240, 0.12)',
    borderRadius: '12px',
    marginBottom: '12px',
    backdropFilter: 'blur(10px)',
    flexShrink: 0,
  },
  deviceInfoLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
  },
  deviceLabel: {
    color: '#606080',
  },
  deviceName: {
    color: '#e0e0ff',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '2px 8px',
    borderRadius: '6px',
    background: 'rgba(124, 108, 240, 0.1)',
    border: '1px solid rgba(124, 108, 240, 0.2)',
  },
  nameEditWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  nameInput: {
    width: '120px',
    padding: '3px 8px',
    background: 'rgba(8, 8, 15, 0.6)',
    border: '1px solid rgba(124, 108, 240, 0.3)',
    borderRadius: '6px',
    color: '#e0e0ff',
    fontSize: '12px',
    outline: 'none',
  },
  nameSaveBtn: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(34, 197, 94, 0.2)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    color: '#22c55e',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  nameCancelBtn: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  peerCount: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#a6e3a1',
  },
  peersRow: {
    display: 'flex',
    gap: '6px',
    marginBottom: '12px',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  peerChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    background: 'rgba(166, 227, 161, 0.1)',
    border: '1px solid rgba(166, 227, 161, 0.2)',
    color: '#a6e3a1',
    borderRadius: '12px',
    fontSize: '11px',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    borderRadius: '10px',
    marginBottom: '12px',
    fontSize: '12px',
  },
  errorCloseBtn: {
    marginLeft: 'auto',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    color: '#fca5a5',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  inputSection: {
    background: 'rgba(20, 20, 35, 0.5)',
    border: '1px solid rgba(124, 108, 240, 0.15)',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '16px',
    backdropFilter: 'blur(10px)',
    flexShrink: 0,
  },
  inputHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  inputLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#e0e0ff',
  },
  typeSelector: {
    display: 'flex',
    gap: '4px',
    background: 'rgba(8, 8, 15, 0.5)',
    padding: '3px',
    borderRadius: '10px',
  },
  typeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 10px',
    background: 'transparent',
    border: 'none',
    color: '#606080',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  typeBtnActive: {
    background: 'rgba(124, 108, 240, 0.2)',
    color: '#c4b5fd',
    boxShadow: '0 0 10px rgba(124, 108, 240, 0.3)',
  },
  textareaWrap: {
    position: 'relative',
  },
  textarea: {
    width: '100%',
    minHeight: '80px',
    maxHeight: '200px',
    padding: '12px',
    background: 'rgba(8, 8, 15, 0.6)',
    border: '1px solid rgba(124, 108, 240, 0.15)',
    borderRadius: '10px',
    color: '#e0e0ff',
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    resize: 'vertical',
    outline: 'none',
    lineHeight: 1.6,
    boxSizing: 'border-box',
  },
  autoDetectBadge: {
    position: 'absolute',
    bottom: '8px',
    right: '12px',
    padding: '2px 8px',
    background: 'rgba(8, 8, 15, 0.8)',
    border: '1px solid currentColor',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: 500,
  },
  inputFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
  },
  charCount: {
    fontSize: '11px',
    color: '#606080',
  },
  sendBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 20px',
    background: 'linear-gradient(135deg, #7c6cf0, #9b8af0)',
    border: 'none',
    color: '#fff',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    boxShadow: '0 4px 15px rgba(124, 108, 240, 0.4)',
    transition: 'all 0.2s',
  },
  sendBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  historySection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'rgba(20, 20, 35, 0.3)',
    border: '1px solid rgba(124, 108, 240, 0.1)',
    borderRadius: '16px',
    padding: '16px',
    backdropFilter: 'blur(10px)',
    minHeight: 0,
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexShrink: 0,
  },
  historyTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#e0e0ff',
  },
  countBadge: {
    padding: '2px 8px',
    background: 'rgba(124, 108, 240, 0.15)',
    color: '#c4b5fd',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 500,
  },
  historyActions: {
    display: 'flex',
    gap: '6px',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 10px',
    background: 'rgba(124, 108, 240, 0.1)',
    border: '1px solid rgba(124, 108, 240, 0.2)',
    color: '#c4b5fd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 500,
  },
  actionBtnDanger: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 10px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 500,
  },
  historyList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingRight: '4px',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#606080',
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#9090c0',
    marginBottom: '6px',
  },
  emptyDesc: {
    fontSize: '12px',
    maxWidth: '260px',
    marginBottom: '24px',
    lineHeight: 1.6,
  },
  emptyTips: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  tipItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    background: 'rgba(20, 20, 35, 0.4)',
    border: '1px solid rgba(124, 108, 240, 0.1)',
    borderRadius: '10px',
    fontSize: '12px',
    color: '#9090c0',
  },
  messageCard: {
    padding: '14px',
    background: 'rgba(20, 20, 35, 0.5)',
    border: '1px solid rgba(124, 108, 240, 0.1)',
    borderLeft: '3px solid #7c6cf0',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
  },
  messageSender: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  senderAvatar: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#fff',
  },
  senderName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#e0e0ff',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  mineBadge: {
    padding: '1px 6px',
    background: 'rgba(124, 108, 240, 0.2)',
    color: '#c4b5fd',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 500,
  },
  senderTime: {
    fontSize: '11px',
    color: '#606080',
    marginTop: '2px',
  },
  messageTypeTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    background: 'rgba(8, 8, 15, 0.5)',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: 500,
  },
  messageContent: {
    marginBottom: '10px',
  },
  codeBlock: {
    margin: 0,
    padding: '12px',
    background: 'rgba(8, 8, 15, 0.7)',
    border: '1px solid rgba(124, 108, 240, 0.1)',
    borderRadius: '8px',
    color: '#e0e0ff',
    fontSize: '12px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    lineHeight: 1.6,
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  linkText: {
    fontSize: '13px',
    textDecoration: 'none',
    wordBreak: 'break-all',
  },
  textBlock: {
    fontSize: '13px',
    color: '#c0c0e0',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  messageActions: {
    display: 'flex',
    gap: '6px',
  },
  msgActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    background: 'rgba(8, 8, 15, 0.5)',
    border: '1px solid rgba(124, 108, 240, 0.1)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '11px',
    color: '#9090c0',
    transition: 'all 0.2s',
  },
  toastContainer: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    zIndex: 1000,
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: 'rgba(20, 20, 35, 0.95)',
    border: '1px solid rgba(124, 108, 240, 0.3)',
    color: '#f0f0ff',
    borderRadius: '10px',
    fontSize: '13px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  toastSuccess: {
    borderColor: 'rgba(34, 197, 94, 0.4)',
    color: '#86efac',
  },
  toastError: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    color: '#fca5a5',
  },
};