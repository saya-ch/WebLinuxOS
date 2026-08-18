import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Cloud, Folder, File, FileText, Image, Download, Upload, Search,
  Plus, Trash2, Edit3, Copy, Share2, RefreshCw, ChevronRight,
  Home, Grid3X3, List, X, Eye, Link, CheckCircle,
  AlertCircle, Clock, Globe, PieChart,
  FolderPlus, Archive, Music, Video, Code,
  ArrowLeft, Loader, AlertTriangle, WifiOff,
  Star, PanelLeft, PanelRight
} from 'lucide-react';

// ============ 类型定义 ============
type CloudProvider = 'local' | 'webdav' | 'google' | 'dropbox';
type ViewMode = 'grid' | 'list' | 'tree';
type SyncStatus = 'synced' | 'syncing' | 'conflict' | 'error' | 'offline';
type SortKey = 'name' | 'size' | 'date' | 'type';

interface CloudFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size: number;
  mimeType: string;
  modified: number;
  created: number;
  parentId: string;
  provider: CloudProvider;
  path: string;
  syncStatus: SyncStatus;
  shared: boolean;
  starred: boolean;
  content?: string | ArrayBuffer | null;
  thumbnailUrl?: string;
}

interface CloudConnection {
  id: string;
  provider: CloudProvider;
  name: string;
  connected: boolean;
  syncStatus: SyncStatus;
  usedSpace: number;
  totalSpace: number;
  lastSync: number | null;
  config: Record<string, string>;
}

interface UploadTask {
  id: string;
  fileName: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  provider: CloudProvider;
}

interface RecentFile {
  fileId: string;
  name: string;
  provider: CloudProvider;
  accessedAt: number;
  path: string;
}

interface SearchMatch {
  file: CloudFile;
  matchField: 'name' | 'path' | 'content';
  snippet: string;
}

// ============ 常量 ============
const PROVIDER_INFO: Record<CloudProvider, { label: string; color: string; icon: string }> = {
  local: { label: '本地云', color: '#3b82f6', icon: '💾' },
  webdav: { label: 'WebDAV', color: '#8b5cf6', icon: '🌐' },
  google: { label: 'Google Drive', color: '#22c55e', icon: '🔵' },
  dropbox: { label: 'Dropbox', color: '#0ea5e9', icon: '📦' },
};

const SYNC_STATUS_MAP: Record<SyncStatus, { label: string; color: string }> = {
  synced: { label: '已同步', color: '#22c55e' },
  syncing: { label: '同步中', color: '#3b82f6' },
  conflict: { label: '冲突', color: '#f59e0b' },
  error: { label: '错误', color: '#ef4444' },
  offline: { label: '离线', color: '#6b7280' },
};

const DB_NAME = 'CloudDriveDB';
const DB_VERSION = 1;
const FILES_STORE = 'files';
const META_STORE = 'meta';

// ============ IndexedDB 封装 ============
class IDBWrapper {
  private db: IDBDatabase | null = null;

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(FILES_STORE)) {
          db.createObjectStore(FILES_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => { this.db = req.result; resolve(this.db); };
      req.onerror = () => reject(req.error);
    });
  }

  async put(store: string, data: Record<string, unknown>): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(data);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async get(store: string, key: string): Promise<Record<string, unknown> | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result as Record<string, unknown> | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(store: string): Promise<Record<string, unknown>[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result as Record<string, unknown>[]);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(store: string, key: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clear(store: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

const idb = new IDBWrapper();

// ============ 工具函数 ============
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function getFileIcon(file: CloudFile): React.ReactNode {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (file.type === 'folder') return <Folder size={18} style={{ color: '#3b82f6' }} />;
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext))
    return <Image size={18} style={{ color: '#a855f7' }} />;
  if (['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext))
    return <Music size={18} style={{ color: '#f59e0b' }} />;
  if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext))
    return <Video size={18} style={{ color: '#ef4444' }} />;
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'html', 'css', 'json', 'xml', 'yml', 'yaml', 'sh', 'sql'].includes(ext))
    return <Code size={18} style={{ color: '#22c55e' }} />;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext))
    return <Archive size={18} style={{ color: '#f97316' }} />;
  if (['txt', 'md', 'log', 'csv'].includes(ext))
    return <FileText size={18} style={{ color: '#6b7280' }} />;
  return <File size={18} style={{ color: '#9ca3af' }} />;
}

function isPreviewableImage(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext);
}

function isPreviewableText(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return ['txt', 'md', 'log', 'csv', 'js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'html', 'css', 'json', 'xml', 'yml', 'yaml', 'sh', 'sql', 'rtf', 'ini', 'conf', 'env'].includes(ext);
}

function isPreviewablePDF(name: string): boolean {
  return name.split('.').pop()?.toLowerCase() === 'pdf';
}

// ============ 样式 ============
const styles = {
  container: {
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column' as const,
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
    color: '#e2e8f0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden', fontSize: 13,
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 16px', background: 'rgba(15, 15, 26, 0.95)',
    borderBottom: '1px solid rgba(59, 130, 246, 0.15)', backdropFilter: 'blur(20px)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  headerTitle: {
    fontSize: 16, fontWeight: 700,
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: 4, padding: '6px 16px',
    background: 'rgba(15, 15, 26, 0.6)', borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
    flexWrap: 'wrap' as const,
  },
  toolbarBtn: (active?: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
    background: active ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${active ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 6, color: active ? '#60a5fa' : '#94a3b8', cursor: 'pointer',
    fontSize: 12, transition: 'all 0.15s', fontWeight: active ? 600 : 400,
  }),
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, flex: '0 1 280px',
  },
  searchInput: {
    background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0',
    fontSize: 12, width: '100%', '::placeholder': { color: '#64748b' },
  } as React.CSSProperties,
  breadcrumbs: {
    display: 'flex', alignItems: 'center', gap: 2, padding: '4px 16px',
    background: 'rgba(15, 15, 26, 0.4)', overflow: 'auto', whiteSpace: 'nowrap' as const,
  },
  crumb: (isLast?: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 2, padding: '2px 6px',
    color: isLast ? '#60a5fa' : '#94a3b8', cursor: isLast ? 'default' : 'pointer',
    fontSize: 12, fontWeight: isLast ? 600 : 400, borderRadius: 4,
    transition: 'color 0.15s',
  }),
  mainArea: {
    flex: 1, display: 'flex', overflow: 'hidden',
  },
  sidebar: (collapsed: boolean): React.CSSProperties => ({
    width: collapsed ? 48 : 220, minWidth: collapsed ? 48 : 220,
    background: 'rgba(15, 15, 26, 0.7)', borderRight: '1px solid rgba(59, 130, 246, 0.1)',
    display: 'flex', flexDirection: 'column' as const, overflow: 'auto',
    transition: 'width 0.2s, min-width 0.2s', backdropFilter: 'blur(10px)',
  }),
  sidebarSection: {
    padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  sidebarTitle: {
    fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const,
    letterSpacing: 1, marginBottom: 6,
  },
  sidebarItem: (active?: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
    borderRadius: 6, cursor: 'pointer', fontSize: 12,
    background: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
    color: active ? '#60a5fa' : '#cbd5e1', transition: 'all 0.15s',
    marginBottom: 2,
  }),
  contentArea: {
    flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'auto',
    padding: 12, position: 'relative' as const,
  },
  dropZone: (isDragOver: boolean): React.CSSProperties => ({
    flex: 1, minHeight: 0, border: isDragOver ? '2px dashed #3b82f6' : '2px dashed transparent',
    borderRadius: 12, background: isDragOver ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
    transition: 'all 0.2s', display: 'flex', flexDirection: 'column' as const,
    overflow: 'auto',
  }),
  gridContainer: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 10, padding: 4,
  },
  gridItem: (selected?: boolean): React.CSSProperties => ({
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6,
    padding: 12, borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
    background: selected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${selected ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255,255,255,0.06)'}`,
  }),
  listRow: (selected?: boolean): React.CSSProperties => ({
    display: 'grid', gridTemplateColumns: '24px 1fr 80px 100px 80px 60px',
    alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 6,
    cursor: 'pointer', fontSize: 12, transition: 'all 0.1s',
    background: selected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
    border: '1px solid transparent',
  }),
  listHeader: {
    display: 'grid', gridTemplateColumns: '24px 1fr 80px 100px 80px 60px',
    alignItems: 'center', gap: 8, padding: '4px 10px', fontSize: 11,
    color: '#64748b', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  modalOverlay: {
    position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'linear-gradient(135deg, #1e1e32, #2a2a44)', borderRadius: 16,
    border: '1px solid rgba(59, 130, 246, 0.2)', padding: 24, minWidth: 400,
    maxWidth: 600, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
  },
  modalTitle: {
    fontSize: 16, fontWeight: 700, marginBottom: 16,
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  input: {
    width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#e2e8f0',
    fontSize: 13, outline: 'none', marginBottom: 10,
  },
  btn: (variant: 'primary' | 'secondary' | 'danger' = 'primary'): React.CSSProperties => ({
    padding: '6px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500,
    border: 'none', transition: 'all 0.15s',
    background: variant === 'primary' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
      : variant === 'danger' ? '#ef4444' : 'rgba(255,255,255,0.1)',
    color: variant === 'secondary' ? '#cbd5e1' : '#fff',
  }),
  progressBar: (_pct: number): React.CSSProperties => ({
    height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', width: '100%',
  }),
  progressFill: (pct: number): React.CSSProperties => ({
    height: '100%', borderRadius: 2, width: `${pct}%`,
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', transition: 'width 0.2s',
  }),
  statCard: {
    background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12,
    border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8,
  },
  pieCanvas: { display: 'block', margin: '0 auto' },
  previewContainer: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16, overflow: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: 8,
  },
  previewImage: { maxWidth: '100%', maxHeight: '100%', borderRadius: 8, objectFit: 'contain' as const },
  previewText: {
    width: '100%', padding: 16, background: 'rgba(0,0,0,0.3)', borderRadius: 8,
    fontFamily: '"Fira Code", "Cascadia Code", monospace', fontSize: 12, lineHeight: 1.6,
    color: '#a5f3fc', whiteSpace: 'pre-wrap' as const, overflow: 'auto', maxHeight: '100%',
  },
  syncIndicator: (status: SyncStatus): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 6px',
    borderRadius: 4, background: `${SYNC_STATUS_MAP[status].color}20`,
    color: SYNC_STATUS_MAP[status].color,
  }),
  tab: (active?: boolean): React.CSSProperties => ({
    padding: '6px 14px', fontSize: 12, cursor: 'pointer', borderRadius: '6px 6px 0 0',
    fontWeight: active ? 600 : 400, transition: 'all 0.15s',
    background: active ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
    color: active ? '#60a5fa' : '#94a3b8', borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
  }),
  uploadItem: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
    background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 4,
  },
  emptyState: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    justifyContent: 'center', gap: 8, padding: 40, color: '#64748b',
  },
};

// ============ 初始数据 ============
const DEFAULT_CONNECTIONS: CloudConnection[] = [
  {
    id: 'local-default', provider: 'local', name: '本地云存储',
    connected: true, syncStatus: 'synced', usedSpace: 0, totalSpace: 1073741824,
    lastSync: Date.now(), config: {},
  },
];

function createInitialFiles(): CloudFile[] {
  const now = Date.now();
  return [
    { id: 'root', name: '我的云盘', type: 'folder', size: 0, mimeType: '', modified: now, created: now, parentId: '', provider: 'local', path: '/', syncStatus: 'synced', shared: false, starred: false },
    { id: 'docs', name: '文档', type: 'folder', size: 0, mimeType: '', modified: now, created: now, parentId: 'root', provider: 'local', path: '/文档', syncStatus: 'synced', shared: false, starred: false },
    { id: 'images', name: '图片', type: 'folder', size: 0, mimeType: '', modified: now, created: now, parentId: 'root', provider: 'local', path: '/图片', syncStatus: 'synced', shared: false, starred: false },
    { id: 'music', name: '音乐', type: 'folder', size: 0, mimeType: '', modified: now, created: now, parentId: 'root', provider: 'local', path: '/音乐', syncStatus: 'synced', shared: false, starred: false },
    { id: 'code', name: '代码', type: 'folder', size: 0, mimeType: '', modified: now, created: now, parentId: 'root', provider: 'local', path: '/代码', syncStatus: 'synced', shared: false, starred: false },
    { id: 'readme', name: 'README.md', type: 'file', size: 256, mimeType: 'text/markdown', modified: now, created: now, parentId: 'docs', provider: 'local', path: '/文档/README.md', syncStatus: 'synced', shared: false, starred: true, content: '# 欢迎使用云盘\n\n这是您的个人云端存储空间。\n\n## 功能\n- 多云存储支持\n- 文件预览\n- 拖拽上传\n- 搜索文件' },
    { id: 'notes', name: '笔记.txt', type: 'file', size: 128, mimeType: 'text/plain', modified: now, created: now, parentId: 'docs', provider: 'local', path: '/文档/笔记.txt', syncStatus: 'synced', shared: false, starred: false, content: '这是一段笔记内容。\n可以使用云盘来保存和管理您的文件。' },
    { id: 'config', name: 'config.json', type: 'file', size: 512, mimeType: 'application/json', modified: now, created: now, parentId: 'code', provider: 'local', path: '/代码/config.json', syncStatus: 'synced', shared: false, starred: false, content: '{\n  "theme": "dark",\n  "language": "zh-CN",\n  "autoSync": true,\n  "maxStorage": "1GB"\n}' },
    { id: 'appjs', name: 'app.tsx', type: 'file', size: 1024, mimeType: 'text/typescript', modified: now, created: now, parentId: 'code', provider: 'local', path: '/代码/app.tsx', syncStatus: 'synced', shared: false, starred: false, content: 'import React from "react";\n\nexport default function App() {\n  return <div>Hello World</div>;\n}' },
  ];
}

// ============ 主组件 ============
export default function CloudDrive() {
  // === 状态 ===
  const [files, setFiles] = useState<CloudFile[]>(createInitialFiles);
  const [connections, setConnections] = useState<CloudConnection[]>(DEFAULT_CONNECTIONS);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, _setSortBy] = useState<SortKey>('name');
  const [sortAsc, _setSortAsc] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [previewFile, setPreviewFile] = useState<CloudFile | null>(null);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState<'files' | 'analytics' | 'connections' | 'uploads' | 'recent'>('files');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameName, setRenameName] = useState('');
  const [renameFileId, setRenameFileId] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [webdavUrl, setWebdavUrl] = useState('');
  const [webdavUser, setWebdavUser] = useState('');
  const [webdavPass, setWebdavPass] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<CloudProvider | 'all'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pieCanvasRef = useRef<HTMLCanvasElement>(null);

  // === 持久化到 IndexedDB ===
  useEffect(() => {
    (async () => {
      try {
        const saved = await idb.get(META_STORE, 'cloud-drive-state');
        if (saved) {
          if (saved.files) setFiles(saved.files as CloudFile[]);
          if (saved.connections) setConnections(saved.connections as CloudConnection[]);
          if (saved.recentFiles) setRecentFiles(saved.recentFiles as RecentFile[]);
        }
      } catch { /* 忽略 */ }
    })();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      idb.put(META_STORE, { key: 'cloud-drive-state', files, connections, recentFiles }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [files, connections, recentFiles]);

  // === 文件操作 ===
  const currentPath = useMemo(() => {
    const parts: { id: string; name: string }[] = [];
    let id = currentFolderId;
    while (id) {
      const f = files.find(x => x.id === id);
      if (!f) break;
      parts.unshift({ id: f.id, name: f.name });
      id = f.parentId;
    }
    return parts;
  }, [currentFolderId, files]);

  const currentFiles = useMemo(() => {
    let list = files.filter(f => f.parentId === currentFolderId);
    if (activeProvider !== 'all') {
      list = list.filter(f => f.provider === activeProvider);
    }
    if (searchQuery && isSearching) {
      return list;
    }
    return list.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      let cmp = 0;
      switch (sortBy) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'size': cmp = a.size - b.size; break;
        case 'date': cmp = b.modified - a.modified; break;
        case 'type': cmp = a.mimeType.localeCompare(b.mimeType); break;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [files, currentFolderId, activeProvider, searchQuery, isSearching, sortBy, sortAsc]);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) { setIsSearching(false); setSearchResults([]); return; }
    setIsSearching(true);
    const q = searchQuery.toLowerCase();
    const results: SearchMatch[] = [];
    for (const f of files) {
      if (f.name.toLowerCase().includes(q)) {
        results.push({ file: f, matchField: 'name', snippet: f.name });
      } else if (f.path.toLowerCase().includes(q)) {
        results.push({ file: f, matchField: 'path', snippet: f.path });
      } else if (typeof f.content === 'string' && f.content.toLowerCase().includes(q)) {
        const idx = f.content.toLowerCase().indexOf(q);
        const start = Math.max(0, idx - 30);
        const end = Math.min(f.content.length, idx + q.length + 30);
        results.push({ file: f, matchField: 'content', snippet: '...' + f.content.slice(start, end) + '...' });
      }
    }
    setSearchResults(results);
  }, [searchQuery, files]);

  const handleNavigate = useCallback((folderId: string) => {
    setCurrentFolderId(folderId);
    setSelectedFileIds(new Set());
    setIsSearching(false);
    setSearchQuery('');
  }, []);

  const handleCrumbClick = useCallback((idx: number) => {
    if (idx < currentPath.length) {
      handleNavigate(currentPath[idx].id);
    }
  }, [currentPath, handleNavigate]);

  const handleFileClick = useCallback((file: CloudFile, e?: React.MouseEvent) => {
    if (e?.ctrlKey || e?.metaKey) {
      setSelectedFileIds(prev => {
        const next = new Set(prev);
        next.has(file.id) ? next.delete(file.id) : next.add(file.id);
        return next;
      });
      return;
    }
    if (file.type === 'folder') {
      handleNavigate(file.id);
    } else {
      setSelectedFileIds(new Set([file.id]));
    }
    setRecentFiles(prev => {
      const filtered = prev.filter(r => r.fileId !== file.id);
      return [{ fileId: file.id, name: file.name, provider: file.provider, accessedAt: Date.now(), path: file.path }, ...filtered].slice(0, 20);
    });
  }, [handleNavigate]);

  const handleDoubleClick = useCallback((file: CloudFile) => {
    if (file.type === 'folder') {
      handleNavigate(file.id);
    } else {
      setPreviewFile(file);
      if (isPreviewableImage(file.name)) {
        if (typeof file.content === 'string' && file.content.startsWith('data:')) {
          setPreviewImage(file.content);
        } else {
          setPreviewImage(null);
        }
        setPreviewContent(null);
      } else if (isPreviewableText(file.name)) {
        setPreviewContent(typeof file.content === 'string' ? file.content : '(二进制文件，无法预览文本内容)');
        setPreviewImage(null);
      } else if (isPreviewablePDF(file.name)) {
        setPreviewContent('(PDF 预览需要浏览器内置 PDF 查看器)');
        setPreviewImage(null);
      } else {
        setPreviewContent(`(${file.mimeType || '未知类型'} 文件，暂不支持预览)`);
        setPreviewImage(null);
      }
    }
  }, [handleNavigate]);

  const handleCreateFolder = useCallback(() => {
    if (!newFolderName.trim()) return;
    const now = Date.now();
    const parent = files.find(f => f.id === currentFolderId);
    const newFile: CloudFile = {
      id: generateId(), name: newFolderName.trim(), type: 'folder', size: 0,
      mimeType: '', modified: now, created: now, parentId: currentFolderId,
      provider: activeProvider === 'all' ? 'local' : activeProvider,
      path: (parent?.path || '/') + '/' + newFolderName.trim(),
      syncStatus: 'synced', shared: false, starred: false,
    };
    setFiles(prev => [...prev, newFile]);
    setShowNewFolderModal(false);
    setNewFolderName('');
  }, [newFolderName, currentFolderId, files, activeProvider]);

  const handleRename = useCallback(() => {
    if (!renameName.trim()) return;
    setFiles(prev => prev.map(f => f.id === renameFileId ? { ...f, name: renameName.trim(), modified: Date.now() } : f));
    setShowRenameModal(false);
    setRenameName('');
    setRenameFileId('');
  }, [renameName, renameFileId]);

  const handleDelete = useCallback((fileIds: string[]) => {
    const toDelete = new Set<string>();
    const collect = (ids: string[]) => {
      for (const id of ids) {
        toDelete.add(id);
        files.filter(f => f.parentId === id).forEach(f => collect([f.id]));
      }
    };
    collect(fileIds);
    setFiles(prev => prev.filter(f => !toDelete.has(f.id)));
    setSelectedFileIds(new Set());
  }, [files]);

  const handleCopy = useCallback(() => {
    if (selectedFileIds.size === 0) return;
    const copied = Array.from(selectedFileIds).map(id => files.find(f => f.id === id)).filter(Boolean) as CloudFile[];
    const newFiles = copied.map(f => ({
      ...f, id: generateId(), name: f.name + ' (副本)',
      parentId: currentFolderId, modified: Date.now(), syncStatus: 'syncing' as SyncStatus,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, [selectedFileIds, files, currentFolderId]);

  const handleShare = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    const link = `https://cloud.weblinux.os/share/${fileId}?token=${generateId()}`;
    setShareLink(link);
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, shared: true } : f));
    setShowShareModal(true);
  }, [files]);

  const handleStar = useCallback((fileId: string) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, starred: !f.starred } : f));
  }, []);

  const handleDownload = useCallback((file: CloudFile) => {
    const blob = file.content
      ? new Blob([file.content], { type: file.mimeType || 'application/octet-stream' })
      : new Blob([`# ${file.name}\n\n(文件内容占位符)`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // === 上传 ===
  const handleUploadFiles = useCallback((fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    for (const f of arr) {
      const taskId = generateId();
      const task: UploadTask = { id: taskId, fileName: f.name, size: f.size, progress: 0, status: 'uploading', provider: activeProvider === 'all' ? 'local' : activeProvider };
      setUploadTasks(prev => [...prev, task]);

      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: pct } : t));
        }
      };
      reader.onload = () => {
        const now = Date.now();
        const newFile: CloudFile = {
          id: generateId(), name: f.name, type: 'file', size: f.size,
          mimeType: f.type || 'application/octet-stream', modified: now, created: now,
          parentId: currentFolderId, provider: task.provider,
          path: (files.find(x => x.id === currentFolderId)?.path || '/') + '/' + f.name,
          syncStatus: 'synced', shared: false, starred: false,
          content: isPreviewableImage(f.name) && typeof reader.result === 'string' ? reader.result : (typeof reader.result === 'string' ? reader.result : null),
        };
        setFiles(prev => [...prev, newFile]);
        setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, progress: 100, status: 'done' } : t));
        setConnections(prev => prev.map(c => c.provider === task.provider ? { ...c, usedSpace: c.usedSpace + f.size, lastSync: now } : c));
      };
      reader.onerror = () => {
        setUploadTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'error' } : t));
      };

      if (isPreviewableImage(f.name)) {
        reader.readAsDataURL(f);
      } else if (isPreviewableText(f.name) && f.size < 512 * 1024) {
        reader.readAsText(f);
      } else {
        reader.readAsArrayBuffer(f);
      }
    }
  }, [currentFolderId, files, activeProvider]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  }, [handleUploadFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  // === 连接管理 ===
  const handleAddWebDAV = useCallback(() => {
    if (!webdavUrl.trim()) return;
    const conn: CloudConnection = {
      id: generateId(), provider: 'webdav', name: `WebDAV (${new URL(webdavUrl).hostname})`,
      connected: true, syncStatus: 'synced', usedSpace: 0, totalSpace: 5368709120,
      lastSync: Date.now(), config: { url: webdavUrl, user: webdavUser, pass: webdavPass },
    };
    setConnections(prev => [...prev, conn]);
    setWebdavUrl(''); setWebdavUser(''); setWebdavPass('');
    setShowConnectModal(false);
  }, [webdavUrl, webdavUser, webdavPass]);

  const handleAddCloud = useCallback((provider: CloudProvider) => {
    if (provider === 'webdav') { setShowConnectModal(true); return; }
    const info = PROVIDER_INFO[provider];
    const conn: CloudConnection = {
      id: generateId(), provider, name: info.label,
      connected: true, syncStatus: 'synced', usedSpace: 0, totalSpace: 2147483648,
      lastSync: Date.now(), config: {},
    };
    setConnections(prev => [...prev, conn]);
  }, []);

  const handleRemoveConnection = useCallback((connId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connId));
  }, []);

  // === 存储分析饼图 ===
  useEffect(() => {
    if (activePanel !== 'analytics' || !pieCanvasRef.current) return;
    const canvas = pieCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 180;
    canvas.width = size * 2;
    canvas.height = size * 2;
    ctx.scale(2, 2);

    const totalUsed = connections.reduce((s, c) => s + c.usedSpace, 0);
    const totalTotal = connections.reduce((s, c) => s + c.totalSpace, 0);
    const totalFree = totalTotal - totalUsed;

    if (connections.length === 0 || totalTotal === 0) {
      ctx.clearRect(0, 0, size, size);
      return;
    }

    const data = [
      ...connections.map(c => ({ label: c.name, value: c.usedSpace, color: PROVIDER_INFO[c.provider].color })),
      { label: '可用空间', value: Math.max(totalFree, 0), color: '#1e293b' },
    ];
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const cx = size / 2, cy = size / 2, r = 70;

    ctx.clearRect(0, 0, size, size);
    let startAngle = -Math.PI / 2;
    for (const d of data) {
      const slice = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = d.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(15, 15, 26, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (slice > 0.3) {
        const midAngle = startAngle + slice / 2;
        const labelR = r * 0.65;
        const lx = cx + Math.cos(midAngle) * labelR;
        const ly = cy + Math.sin(midAngle) * labelR;
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.label, lx, ly);
      }
      startAngle += slice;
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#0f0f1a';
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatSize(totalUsed), cx, cy - 6);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('/ ' + formatSize(totalTotal), cx, cy + 8);
  }, [activePanel, connections]);

  // === 上下文菜单 ===
  const handleContextMenu = useCallback((e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, fileId });
  }, []);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  // === 渲染辅助 ===
  const renderSyncBadge = (status: SyncStatus) => (
    <span style={styles.syncIndicator(status)}>
      {status === 'synced' && <CheckCircle size={10} />}
      {status === 'syncing' && <Loader size={10} />}
      {status === 'conflict' && <AlertTriangle size={10} />}
      {status === 'error' && <AlertCircle size={10} />}
      {status === 'offline' && <WifiOff size={10} />}
      {SYNC_STATUS_MAP[status].label}
    </span>
  );

  const renderFileGrid = () => (
    <div style={styles.gridContainer}>
      {currentFiles.map(f => (
        <div
          key={f.id}
          style={styles.gridItem(selectedFileIds.has(f.id))}
          onClick={e => handleFileClick(f, e)}
          onDoubleClick={() => handleDoubleClick(f)}
          onContextMenu={e => handleContextMenu(e, f.id)}
        >
          <div style={{ position: 'relative' }}>
            {getFileIcon(f)}
            {f.starred && <Star size={8} style={{ position: 'absolute', top: -2, right: -4, color: '#f59e0b', fill: '#f59e0b' }} />}
          </div>
          <div style={{ fontSize: 11, textAlign: 'center', wordBreak: 'break-all', lineHeight: 1.3, maxWidth: 120 }}>
            {f.name}
          </div>
          <div style={{ fontSize: 10, color: '#64748b' }}>
            {f.type === 'file' ? formatSize(f.size) : ''}
          </div>
        </div>
      ))}
    </div>
  );

  const renderFileList = () => (
    <div style={{ padding: 4 }}>
      <div style={styles.listHeader}>
        <span></span><span>名称</span><span>大小</span><span>修改时间</span><span>同步</span><span>操作</span>
      </div>
      {currentFiles.map(f => (
        <div
          key={f.id}
          style={styles.listRow(selectedFileIds.has(f.id))}
          onClick={e => handleFileClick(f, e)}
          onDoubleClick={() => handleDoubleClick(f)}
          onContextMenu={e => handleContextMenu(e, f.id)}
        >
          <span>{getFileIcon(f)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {f.name}
            {f.starred && <Star size={10} style={{ color: '#f59e0b', fill: '#f59e0b', flexShrink: 0 }} />}
          </span>
          <span style={{ color: '#64748b' }}>{f.type === 'file' ? formatSize(f.size) : '--'}</span>
          <span style={{ color: '#64748b' }}>{formatDate(f.modified)}</span>
          <span>{renderSyncBadge(f.syncStatus)}</span>
          <span style={{ display: 'flex', gap: 4 }}>
            <Eye size={12} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={e => { e.stopPropagation(); handleDoubleClick(f); }} />
            <Download size={12} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={e => { e.stopPropagation(); handleDownload(f); }} />
          </span>
        </div>
      ))}
    </div>
  );

  const renderSearchResults = () => (
    <div style={{ padding: 8 }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
        搜索 "{searchQuery}" 找到 {searchResults.length} 个结果
      </div>
      {searchResults.map((r, i) => (
        <div
          key={i}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.03)', marginBottom: 4 }}
          onClick={() => {
            if (r.file.type === 'folder') handleNavigate(r.file.parentId);
            else { setCurrentFolderId(r.file.parentId); setSelectedFileIds(new Set([r.file.id])); }
            setIsSearching(false); setSearchQuery('');
          }}
        >
          {getFileIcon(r.file)}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12 }}>{r.file.name}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{r.snippet}</div>
          </div>
          <span style={{ fontSize: 10, color: PROVIDER_INFO[r.file.provider].color }}>{PROVIDER_INFO[r.file.provider].label}</span>
        </div>
      ))}
    </div>
  );

  const renderSidebar = () => (
    <div style={styles.sidebar(sidebarCollapsed)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {!sidebarCollapsed && <span style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>导航</span>}
        <div style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
          {sidebarCollapsed ? <PanelRight size={16} /> : <PanelLeft size={16} />}
        </div>
      </div>

      {!sidebarCollapsed && (
        <>
          <div style={styles.sidebarSection}>
            <div style={styles.sidebarTitle}>云存储</div>
            <div
              style={styles.sidebarItem(activeProvider === 'all')}
              onClick={() => setActiveProvider('all')}
            >
              <Cloud size={14} /> 所有存储
            </div>
            {connections.map(c => (
              <div
                key={c.id}
                style={styles.sidebarItem(activeProvider === c.provider)}
                onClick={() => setActiveProvider(c.provider)}
              >
                <span>{PROVIDER_INFO[c.provider].icon}</span>
                <span style={{ flex: 1 }}>{c.name}</span>
                {renderSyncBadge(c.syncStatus)}
              </div>
            ))}
          </div>

          <div style={styles.sidebarSection}>
            <div style={styles.sidebarTitle}>快速访问</div>
            <div style={styles.sidebarItem()} onClick={() => handleNavigate('root')}>
              <Home size={14} /> 根目录
            </div>
            <div style={styles.sidebarItem()} onClick={() => { setActivePanel('recent'); }}>
              <Clock size={14} /> 最近文件
              {recentFiles.length > 0 && <span style={{ fontSize: 10, background: 'rgba(59,130,246,0.2)', color: '#60a5fa', borderRadius: 8, padding: '0 5px' }}>{recentFiles.length}</span>}
            </div>
            <div style={styles.sidebarItem()} onClick={() => setActivePanel('analytics')}>
              <PieChart size={14} /> 存储分析
            </div>
          </div>

          <div style={styles.sidebarSection}>
            <div style={styles.sidebarTitle}>收藏</div>
            {files.filter(f => f.starred).slice(0, 8).map(f => (
              <div key={f.id} style={styles.sidebarItem()} onClick={() => handleFileClick(f)}>
                {getFileIcon(f)}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 12px' }}>
            <div style={{ ...styles.sidebarTitle, marginBottom: 8 }}>存储使用</div>
            {connections.map(c => {
              const pct = c.totalSpace > 0 ? (c.usedSpace / c.totalSpace) * 100 : 0;
              return (
                <div key={c.id} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>
                    <span>{c.name}</span>
                    <span>{formatSize(c.usedSpace)}/{formatSize(c.totalSpace)}</span>
                  </div>
                  <div style={styles.progressBar(pct)}>
                    <div style={styles.progressFill(pct)} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  const renderContentPanel = () => {
    if (activePanel === 'analytics') return renderAnalyticsPanel();
    if (activePanel === 'connections') return renderConnectionsPanel();
    if (activePanel === 'uploads') return renderUploadsPanel();
    if (activePanel === 'recent') return renderRecentPanel();
    return renderFilesPanel();
  };

  const renderFilesPanel = () => (
    <div style={styles.dropZone(isDragOver)}
      onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
    >
      {isDragOver && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10, padding: 24, borderRadius: 12, background: 'rgba(59,130,246,0.15)', border: '2px dashed #3b82f6', color: '#60a5fa', fontWeight: 600, fontSize: 14, pointerEvents: 'none' }}>
          <Upload size={32} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
          释放以上传文件
        </div>
      )}

      {currentFiles.length === 0 && !isSearching ? (
        <div style={styles.emptyState}>
          <Folder size={48} style={{ color: '#334155' }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>空文件夹</div>
          <div style={{ fontSize: 12 }}>拖拽文件到此处上传，或点击上传按钮</div>
        </div>
      ) : isSearching ? renderSearchResults() : viewMode === 'grid' ? renderFileGrid() : renderFileList()}
    </div>
  );

  const renderAnalyticsPanel = () => {
    const totalUsed = connections.reduce((s, c) => s + c.usedSpace, 0);
    const totalTotal = connections.reduce((s, c) => s + c.totalSpace, 0);
    const totalFree = totalTotal - totalUsed;
    const totalFiles = files.filter(f => f.type === 'file').length;
    const totalFolders = files.filter(f => f.type === 'folder').length;
    return (
      <div style={{ padding: 16, overflow: 'auto' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#e2e8f0' }}>存储分析</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={styles.statCard}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>总空间</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#60a5fa' }}>{formatSize(totalTotal)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>已使用</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#a855f7' }}>{formatSize(totalUsed)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>可用</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{formatSize(totalFree)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>文件数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>{totalFiles}</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>文件夹数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0ea5e9' }}>{totalFolders}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#cbd5e1' }}>存储分布</div>
          <canvas ref={pieCanvasRef} style={styles.pieCanvas} />
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#cbd5e1' }}>各服务详情</div>
          {connections.map(c => {
            const pct = c.totalSpace > 0 ? Math.round((c.usedSpace / c.totalSpace) * 100) : 0;
            return (
              <div key={c.id} style={{ ...styles.statCard, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{PROVIDER_INFO[c.provider].icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{c.name}</span>
                    <span style={{ color: '#64748b', fontSize: 11 }}>{pct}%</span>
                  </div>
                  <div style={styles.progressBar(pct)}>
                    <div style={{ ...styles.progressFill(pct), background: PROVIDER_INFO[c.provider].color }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                    {formatSize(c.usedSpace)} / {formatSize(c.totalSpace)}
                    {c.lastSync && <span style={{ marginLeft: 8 }}>最后同步: {formatDate(c.lastSync)}</span>}
                  </div>
                </div>
                {renderSyncBadge(c.syncStatus)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderConnectionsPanel = () => (
    <div style={{ padding: 16, overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>连接管理</div>
        <button style={styles.btn('primary')} onClick={() => setShowConnectModal(true)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={14} /> 添加连接</span>
        </button>
      </div>

      {connections.map(c => (
        <div key={c.id} style={{ ...styles.statCard, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>{PROVIDER_INFO[c.provider].icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{c.name}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {c.provider === 'webdav' && c.config.url && <span>URL: {c.config.url}</span>}
              {c.provider === 'local' && <span>IndexedDB 本地存储</span>}
              {c.provider === 'google' && <span>Google Drive API</span>}
              {c.provider === 'dropbox' && <span>Dropbox API</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
              {renderSyncBadge(c.syncStatus)}
              <span style={{ fontSize: 10, color: '#64748b' }}>
                {formatSize(c.usedSpace)} / {formatSize(c.totalSpace)}
              </span>
              {c.lastSync && <span style={{ fontSize: 10, color: '#64748b' }}>最后同步: {formatDate(c.lastSync)}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <RefreshCw size={14} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => {
              setConnections(prev => prev.map(x => x.id === c.id ? { ...x, syncStatus: 'syncing' as SyncStatus } : x));
              setTimeout(() => setConnections(prev => prev.map(x => x.id === c.id ? { ...x, syncStatus: 'synced' as SyncStatus, lastSync: Date.now() } : x)), 1500);
            }} />
            {c.provider !== 'local' && <Trash2 size={14} style={{ cursor: 'pointer', color: '#ef4444' }} onClick={() => handleRemoveConnection(c.id)} />}
          </div>
        </div>
      ))}

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#cbd5e1' }}>添加云服务</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {(['webdav', 'google', 'dropbox'] as CloudProvider[]).map(p => (
            <div key={p} style={{
              ...styles.statCard, cursor: 'pointer', textAlign: 'center' as const,
              transition: 'all 0.15s',
            }} onClick={() => handleAddCloud(p)}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
            >
              <div style={{ fontSize: 28, marginBottom: 4 }}>{PROVIDER_INFO[p].icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: PROVIDER_INFO[p].color }}>{PROVIDER_INFO[p].label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUploadsPanel = () => (
    <div style={{ padding: 16, overflow: 'auto' }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#e2e8f0' }}>上传任务</div>
      {uploadTasks.length === 0 ? (
        <div style={styles.emptyState}>
          <Upload size={48} style={{ color: '#334155' }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>暂无上传任务</div>
        </div>
      ) : uploadTasks.map(t => (
        <div key={t.id} style={styles.uploadItem}>
          <File size={14} style={{ color: '#94a3b8' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
              <span>{t.fileName}</span>
              <span style={{ color: '#64748b' }}>{formatSize(t.size)}</span>
            </div>
            <div style={styles.progressBar(t.progress)}>
              <div style={styles.progressFill(t.progress)} />
            </div>
          </div>
          <span style={{ fontSize: 11, color: t.status === 'done' ? '#22c55e' : t.status === 'error' ? '#ef4444' : '#3b82f6' }}>
            {t.status === 'done' ? '完成' : t.status === 'error' ? '失败' : `${t.progress}%`}
          </span>
          {t.status === 'done' && <CheckCircle size={14} style={{ color: '#22c55e' }} />}
          {t.status === 'error' && <AlertCircle size={14} style={{ color: '#ef4444' }} />}
          {t.status === 'uploading' && <Loader size={14} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />}
        </div>
      ))}
    </div>
  );

  const renderRecentPanel = () => (
    <div style={{ padding: 16, overflow: 'auto' }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#e2e8f0' }}>最近文件</div>
      {recentFiles.length === 0 ? (
        <div style={styles.emptyState}>
          <Clock size={48} style={{ color: '#334155' }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>暂无最近访问</div>
        </div>
      ) : recentFiles.map(r => {
        const f = files.find(x => x.id === r.fileId);
        return (
          <div key={r.fileId} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
            borderRadius: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.03)', marginBottom: 4,
          }} onClick={() => {
            if (f) { setCurrentFolderId(f.parentId); setSelectedFileIds(new Set([f.id])); }
            setActivePanel('files');
          }}>
            {f ? getFileIcon(f) : <File size={14} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12 }}>{r.name}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>{r.path}</div>
            </div>
            <span style={{ fontSize: 10, color: '#64748b' }}>{formatDate(r.accessedAt)}</span>
            <span style={{ fontSize: 10, color: PROVIDER_INFO[r.provider].color }}>{PROVIDER_INFO[r.provider].label}</span>
          </div>
        );
      })}
    </div>
  );

  const renderPreviewModal = () => {
    if (!previewFile) return null;
    return (
      <div style={styles.modalOverlay} onClick={() => { setPreviewFile(null); setPreviewContent(null); setPreviewImage(null); }}>
        <div style={{ ...styles.modal, minWidth: 500, maxWidth: 800, maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {getFileIcon(previewFile)}
              <span style={{ fontSize: 14, fontWeight: 600 }}>{previewFile.name}</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>{formatSize(previewFile.size)}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Download size={16} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => handleDownload(previewFile)} />
              <X size={16} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => { setPreviewFile(null); setPreviewContent(null); setPreviewImage(null); }} />
            </div>
          </div>
          <div style={styles.previewContainer}>
            {previewImage && <img src={previewImage} style={styles.previewImage} alt={previewFile.name} />}
            {previewContent && <pre style={styles.previewText}>{previewContent}</pre>}
            {!previewImage && !previewContent && (
              <div style={{ color: '#64748b', fontSize: 13 }}>暂不支持预览此文件类型</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderNewFolderModal = () => (
    <div style={styles.modalOverlay} onClick={() => setShowNewFolderModal(false)}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>新建文件夹</div>
        <input style={styles.input} placeholder="文件夹名称" value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} autoFocus />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button style={styles.btn('secondary')} onClick={() => setShowNewFolderModal(false)}>取消</button>
          <button style={styles.btn('primary')} onClick={handleCreateFolder}>创建</button>
        </div>
      </div>
    </div>
  );

  const renderRenameModal = () => (
    <div style={styles.modalOverlay} onClick={() => setShowRenameModal(false)}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>重命名</div>
        <input style={styles.input} placeholder="新名称" value={renameName} onChange={e => setRenameName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleRename()} autoFocus />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button style={styles.btn('secondary')} onClick={() => setShowRenameModal(false)}>取消</button>
          <button style={styles.btn('primary')} onClick={handleRename}>确定</button>
        </div>
      </div>
    </div>
  );

  const renderShareModal = () => (
    <div style={styles.modalOverlay} onClick={() => setShowShareModal(false)}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>分享链接</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, marginBottom: 12 }}>
          <Link size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
          <span style={{ fontSize: 12, wordBreak: 'break-all', flex: 1 }}>{shareLink}</span>
          <button style={{ ...styles.btn('primary'), padding: '4px 10px', fontSize: 11 }} onClick={() => { navigator.clipboard?.writeText(shareLink); }}>复制</button>
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
          任何拥有此链接的人都可以查看此文件
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={styles.btn('secondary')} onClick={() => setShowShareModal(false)}>关闭</button>
        </div>
      </div>
    </div>
  );

  const renderConnectModal = () => (
    <div style={styles.modalOverlay} onClick={() => setShowConnectModal(false)}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalTitle}>添加 WebDAV 连接</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
          输入 WebDAV 服务器地址和凭据以连接云存储
        </div>
        <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>服务器 URL</label>
        <input style={styles.input} placeholder="https://dav.example.com/remote.php/dav/files/" value={webdavUrl} onChange={e => setWebdavUrl(e.target.value)} />
        <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>用户名</label>
        <input style={styles.input} placeholder="username" value={webdavUser} onChange={e => setWebdavUser(e.target.value)} />
        <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 }}>密码 / 应用令牌</label>
        <input style={{ ...styles.input, WebkitTextSecurity: 'disc' } as React.CSSProperties} placeholder="password or app token" value={webdavPass} onChange={e => setWebdavPass(e.target.value)} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button style={styles.btn('secondary')} onClick={() => setShowConnectModal(false)}>取消</button>
          <button style={styles.btn('primary')} onClick={handleAddWebDAV} disabled={!webdavUrl.trim()}>连接</button>
        </div>
      </div>
    </div>
  );

  const renderContextMenu = () => {
    if (!contextMenu) return null;
    const file = files.find(f => f.id === contextMenu.fileId);
    if (!file) return null;
    const menuItems = [
      { icon: <Eye size={12} />, label: '预览', action: () => handleDoubleClick(file) },
      { icon: <Edit3 size={12} />, label: '重命名', action: () => { setRenameFileId(file.id); setRenameName(file.name); setShowRenameModal(true); } },
      { icon: <Copy size={12} />, label: '复制', action: () => { setSelectedFileIds(new Set([file.id])); handleCopy(); } },
      { icon: <Share2 size={12} />, label: '分享', action: () => handleShare(file.id) },
      { icon: <Star size={12} />, label: file.starred ? '取消收藏' : '收藏', action: () => handleStar(file.id) },
      { icon: <Download size={12} />, label: '下载', action: () => handleDownload(file), disabled: file.type === 'folder' },
      { icon: <Trash2 size={12} />, label: '删除', action: () => handleDelete([file.id]), danger: true },
    ];
    return (
      <div style={{
        position: 'fixed' as const, top: contextMenu.y, left: contextMenu.x, zIndex: 2000,
        background: 'rgba(30, 30, 50, 0.95)', borderRadius: 8, padding: '4px 0',
        border: '1px solid rgba(59, 130, 246, 0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        minWidth: 140, backdropFilter: 'blur(10px)',
      }} onClick={e => e.stopPropagation()}>
        {menuItems.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', fontSize: 12,
            cursor: item.disabled ? 'default' : 'pointer', color: item.danger ? '#ef4444' : '#cbd5e1',
            opacity: item.disabled ? 0.4 : 1, transition: 'background 0.1s',
          }} onClick={() => { if (!item.disabled) { item.action(); setContextMenu(null); } }}
            onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = 'rgba(59,130,246,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            {item.icon}{item.label}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* 旋转动画 keyframes */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* 顶部栏 */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Cloud size={20} style={{ color: '#3b82f6' }} />
          <span style={styles.headerTitle}>云盘</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {connections.filter(c => c.connected).map(c => (
            <span key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 8px', borderRadius: 4, background: `${PROVIDER_INFO[c.provider].color}15`, color: PROVIDER_INFO[c.provider].color }}>
              {PROVIDER_INFO[c.provider].icon} {c.name}
            </span>
          ))}
        </div>
      </div>

      {/* 工具栏 */}
      <div style={styles.toolbar}>
        <button style={styles.toolbarBtn()} onClick={() => handleNavigate(currentPath.length > 1 ? currentPath[currentPath.length - 2].id : 'root')}>
          <ArrowLeft size={14} /> 返回
        </button>
        <button style={styles.toolbarBtn()} onClick={() => handleNavigate('root')}>
          <Home size={14} />
        </button>
        <button style={styles.toolbarBtn()} onClick={() => { setFiles(prev => prev); }}>
          <RefreshCw size={14} />
        </button>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
        <button style={styles.toolbarBtn(viewMode === 'grid')} onClick={() => setViewMode('grid')}>
          <Grid3X3 size={14} />
        </button>
        <button style={styles.toolbarBtn(viewMode === 'list')} onClick={() => setViewMode('list')}>
          <List size={14} />
        </button>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
        <button style={styles.toolbarBtn()} onClick={() => setShowNewFolderModal(true)}>
          <FolderPlus size={14} /> 新建
        </button>
        <button style={styles.toolbarBtn()} onClick={() => fileInputRef.current?.click()}>
          <Upload size={14} /> 上传
        </button>
        <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files) handleUploadFiles(e.target.files); e.target.value = ''; }} />
        {selectedFileIds.size > 0 && (
          <>
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
            <button style={styles.toolbarBtn()} onClick={handleCopy}><Copy size={14} /> 复制</button>
            <button style={styles.toolbarBtn()} onClick={() => { const id = Array.from(selectedFileIds)[0]; if (id) handleShare(id); }}><Share2 size={14} /> 分享</button>
            <button style={{ ...styles.toolbarBtn(), color: '#ef4444' }} onClick={() => handleDelete(Array.from(selectedFileIds))}><Trash2 size={14} /> 删除</button>
          </>
        )}
        <div style={{ flex: 1 }} />
        <div style={styles.searchBox}>
          <Search size={14} style={{ color: '#64748b', flexShrink: 0 }} />
          <input
            style={styles.searchInput}
            placeholder="搜索文件..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          {searchQuery && <X size={12} style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => { setSearchQuery(''); setIsSearching(false); setSearchResults([]); }} />}
        </div>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
        <button style={styles.toolbarBtn(activePanel === 'files')} onClick={() => setActivePanel('files')}><Folder size={14} /></button>
        <button style={styles.toolbarBtn(activePanel === 'analytics')} onClick={() => setActivePanel('analytics')}><PieChart size={14} /></button>
        <button style={styles.toolbarBtn(activePanel === 'connections')} onClick={() => setActivePanel('connections')}><Globe size={14} /></button>
        <button style={styles.toolbarBtn(activePanel === 'uploads')} onClick={() => setActivePanel('uploads')}>
          <Upload size={14} />
          {uploadTasks.filter(t => t.status === 'uploading').length > 0 && <span style={{ background: '#3b82f6', borderRadius: 8, padding: '0 5px', fontSize: 10, color: '#fff' }}>{uploadTasks.filter(t => t.status === 'uploading').length}</span>}
        </button>
        <button style={styles.toolbarBtn(activePanel === 'recent')} onClick={() => setActivePanel('recent')}><Clock size={14} /></button>
      </div>

      {/* 面包屑导航 */}
      {activePanel === 'files' && (
        <div style={styles.breadcrumbs}>
          {currentPath.map((p, i) => (
            <React.Fragment key={p.id}>
              <span style={styles.crumb(i === currentPath.length - 1)} onClick={() => handleCrumbClick(i)}>
                {i === 0 ? <Home size={12} /> : p.name}
              </span>
              {i < currentPath.length - 1 && <ChevronRight size={12} style={{ color: '#475569' }} />}
            </React.Fragment>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: '#64748b' }}>
            {currentFiles.length} 项
            {selectedFileIds.size > 0 && <span style={{ color: '#60a5fa', marginLeft: 8 }}>已选 {selectedFileIds.size} 项</span>}
          </span>
        </div>
      )}

      {/* 主区域 */}
      <div style={styles.mainArea}>
        {activePanel === 'files' && renderSidebar()}
        <div style={styles.contentArea}>
          {renderContentPanel()}
        </div>
      </div>

      {/* 弹窗 */}
      {previewFile && renderPreviewModal()}
      {showNewFolderModal && renderNewFolderModal()}
      {showRenameModal && renderRenameModal()}
      {showShareModal && renderShareModal()}
      {showConnectModal && renderConnectModal()}
      {contextMenu && renderContextMenu()}
    </div>
  );
}
