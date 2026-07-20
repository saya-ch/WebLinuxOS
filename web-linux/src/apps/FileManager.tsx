import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Folder, FolderOpen, FileText, FileCode, FileImage, FileVideo, FileAudio,
  File, ChevronRight, Search, Grid3X3, List,
  ArrowUpDown, FolderPlus, FilePlus,
  Copy, Scissors, ClipboardPaste, Trash2, Pencil, Download,
  ChevronDown, Home, X, Eye, Info,
  SortAsc, SortDesc, RefreshCw, ArrowLeft, ArrowRight,
  AlertTriangle, CheckCircle, ChevronUp,
  Columns, FileSpreadsheet, FileCode2, FileType,
  Braces, HardDrive
} from 'lucide-react';
import { useStore, findNodeById, validateFileName } from '../store';
import type { FileNode } from '../types';

// ============ 工具函数 ============
function formatSize(bytes: number | undefined): string {
  if (bytes === undefined || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}

function getFileExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

function isImageFile(name: string): boolean {
  const ext = getFileExtension(name);
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext);
}

function isTextFile(name: string): boolean {
  const ext = getFileExtension(name);
  return ['txt', 'md', 'log', 'csv', 'rtf'].includes(ext);
}

function isCodeFile(name: string): boolean {
  const ext = getFileExtension(name);
  return ['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb', 'xml', 'yml', 'yaml', 'sh', 'sql', 'vue', 'svelte'].includes(ext);
}

function isJsonFile(name: string): boolean {
  return getFileExtension(name) === 'json';
}

function isMarkdownFile(name: string): boolean {
  return getFileExtension(name) === 'md';
}

function isAudioFile(name: string): boolean {
  const ext = getFileExtension(name);
  return ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'].includes(ext);
}

function isVideoFile(name: string): boolean {
  const ext = getFileExtension(name);
  return ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv'].includes(ext);
}

function isArchiveFile(name: string): boolean {
  const ext = getFileExtension(name);
  return ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext);
}

function isDocumentFile(name: string): boolean {
  const ext = getFileExtension(name);
  return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
}

type FileCategory = 'image' | 'video' | 'audio' | 'code' | 'json' | 'markdown' | 'document' | 'archive' | 'text' | 'unknown';

function getFileCategory(name: string): FileCategory {
  if (isImageFile(name)) return 'image';
  if (isVideoFile(name)) return 'video';
  if (isAudioFile(name)) return 'audio';
  if (isJsonFile(name)) return 'json';
  if (isMarkdownFile(name)) return 'markdown';
  if (isCodeFile(name)) return 'code';
  if (isDocumentFile(name)) return 'document';
  if (isArchiveFile(name)) return 'archive';
  if (isTextFile(name)) return 'text';
  return 'unknown';
}

// 根据文件类型获取对应的 lucide-react 图标组件
function getFileIcon(node: FileNode, size = 16, isExpanded = false): React.ReactNode {
  if (node.type === 'folder') {
    return isExpanded ? <FolderOpen size={size} /> : <Folder size={size} />;
  }
  const ext = getFileExtension(node.name);
  const iconMap: Record<string, React.ReactNode> = {
    // 图片
    jpg: <FileImage size={size} />, jpeg: <FileImage size={size} />, png: <FileImage size={size} />,
    gif: <FileImage size={size} />, svg: <FileImage size={size} />, webp: <FileImage size={size} />, bmp: <FileImage size={size} />,
    // 视频
    mp4: <FileVideo size={size} />, mkv: <FileVideo size={size} />, avi: <FileVideo size={size} />,
    mov: <FileVideo size={size} />, webm: <FileVideo size={size} />,
    // 音频
    mp3: <FileAudio size={size} />, wav: <FileAudio size={size} />, flac: <FileAudio size={size} />,
    m4a: <FileAudio size={size} />, ogg: <FileAudio size={size} />,
    // 代码
    js: <FileCode2 size={size} />, ts: <FileCode2 size={size} />, tsx: <FileCode2 size={size} />,
    jsx: <FileCode2 size={size} />, html: <FileCode2 size={size} />, css: <FileCode2 size={size} />,
    py: <FileCode2 size={size} />, java: <FileCode2 size={size} />, cpp: <FileCode2 size={size} />,
    c: <FileCode2 size={size} />, go: <FileCode2 size={size} />, rs: <FileCode2 size={size} />,
    php: <FileCode2 size={size} />, rb: <FileCode2 size={size} />, sh: <FileCode2 size={size} />,
    sql: <FileCode2 size={size} />, vue: <FileCode2 size={size} />, svelte: <FileCode2 size={size} />,
    // JSON/YAML
    json: <Braces size={size} />, xml: <FileCode size={size} />,
    yml: <FileCode size={size} />, yaml: <FileCode size={size} />,
    // 文档
    pdf: <FileType size={size} />, doc: <FileType size={size} />, docx: <FileType size={size} />,
    xls: <FileSpreadsheet size={size} />, xlsx: <FileSpreadsheet size={size} />,
    ppt: <FileText size={size} />, pptx: <FileText size={size} />,
    // 压缩包
    zip: <FileImage size={size} />, rar: <FileImage size={size} />, '7z': <FileImage size={size} />,
    tar: <FileImage size={size} />, gz: <FileImage size={size} />,
    // 文本
    txt: <FileText size={size} />, md: <FileText size={size} />, log: <FileText size={size} />,
    csv: <FileSpreadsheet size={size} />,
  };
  return iconMap[ext] || <File size={size} />;
}

// 文件图标颜色
function getFileIconColor(node: FileNode): string {
  if (node.type === 'folder') return '#f59e0b';
  const ext = getFileExtension(node.name);
  const colorMap: Record<string, string> = {
    jpg: '#10b981', jpeg: '#10b981', png: '#10b981', gif: '#10b981', svg: '#10b981', webp: '#10b981',
    mp4: '#8b5cf6', mkv: '#8b5cf6', avi: '#8b5cf6', mov: '#8b5cf6', webm: '#8b5cf6',
    mp3: '#f43f5e', wav: '#f43f5e', flac: '#f43f5e', m4a: '#f43f5e', ogg: '#f43f5e',
    js: '#f59e0b', ts: '#3b82f6', tsx: '#3b82f6', jsx: '#3b82f6',
    html: '#ef4444', css: '#8b5cf6', py: '#3b82f6', java: '#f97316',
    cpp: '#06b6d4', c: '#06b6d4', go: '#06b6d4', rs: '#f97316',
    json: '#f59e0b', xml: '#f97316', yml: '#10b981', yaml: '#10b981',
    txt: '#6b7280', md: '#6b7280', log: '#6b7280', csv: '#10b981',
    pdf: '#ef4444', doc: '#3b82f6', docx: '#3b82f6',
    xls: '#10b981', xlsx: '#10b981', ppt: '#f97316', pptx: '#f97316',
    zip: '#6b7280', rar: '#6b7280', '7z': '#6b7280', tar: '#6b7280', gz: '#6b7280',
    sh: '#10b981', sql: '#f97316',
  };
  return colorMap[ext] || '#6b7280';
}

// 文件类型中文标签
function getFileTypeLabel(node: FileNode): string {
  if (node.type === 'folder') return '文件夹';
  const ext = getFileExtension(node.name);
  const labels: Record<string, string> = {
    txt: '文本文件', md: 'Markdown', log: '日志文件', csv: 'CSV 文件',
    jpg: 'JPEG 图像', jpeg: 'JPEG 图像', png: 'PNG 图像', gif: 'GIF 图像',
    svg: 'SVG 矢量图', webp: 'WebP 图像', bmp: 'BMP 图像',
    mp3: 'MP3 音频', wav: 'WAV 音频', flac: 'FLAC 音频', ogg: 'OGG 音频', m4a: 'AAC 音频',
    mp4: 'MP4 视频', mkv: 'MKV 视频', avi: 'AVI 视频', mov: 'MOV 视频', webm: 'WebM 视频',
    js: 'JavaScript', ts: 'TypeScript', tsx: 'TSX', jsx: 'JSX',
    html: 'HTML', css: 'CSS', py: 'Python', java: 'Java', cpp: 'C++', c: 'C',
    go: 'Go', rs: 'Rust', php: 'PHP', rb: 'Ruby', sh: 'Shell 脚本',
    json: 'JSON', xml: 'XML', yml: 'YAML', yaml: 'YAML', sql: 'SQL',
    zip: 'ZIP 压缩包', rar: 'RAR 压缩包', '7z': '7z 压缩包', tar: 'TAR 压缩包', gz: 'GZ 压缩包',
    pdf: 'PDF 文档', doc: 'Word 文档', docx: 'Word 文档',
    xls: 'Excel 文档', xlsx: 'Excel 文档', ppt: 'PPT 文档', pptx: 'PPT 文档',
  };
  return labels[ext] || (ext ? `${ext.toUpperCase()} 文件` : '文件');
}

// 根据扩展名获取打开文件的应用 ID
function getAppIdForFile(name: string): string {
  const ext = getFileExtension(name);
  if (ext === 'md') return 'markdown-editor';
  if (['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb', 'xml', 'yml', 'yaml', 'sh', 'sql', 'json', 'vue', 'svelte'].includes(ext)) {
    return 'code-editor';
  }
  if (isImageFile(name)) return 'image-viewer';
  if (isVideoFile(name)) return 'video-player';
  if (isAudioFile(name)) return 'music-player';
  return 'text-editor';
}

// ============ 类型定义 ============
type SortField = 'name' | 'type' | 'size' | 'date';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'list' | 'grid';

interface ClipboardItem {
  fileIds: string[];
  mode: 'copy' | 'cut';
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  fileId: string | null;
  isBackground: boolean;
}

interface NavHistory {
  past: string[];
  present: string;
  future: string[];
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ============ 主组件 ============
export default function FileManager() {
  // 从 store 获取文件系统状态和操作
  const files = useStore((s) => s.files);
  const addFile = useStore((s) => s.addFile);
  const deleteFile = useStore((s) => s.deleteFile);
  const renameFile = useStore((s) => s.renameFile);
  const copyFile = useStore((s) => s.copyFile);
  const moveFile = useStore((s) => s.moveFile);
  const openFileWith = useStore((s) => s.openFileWith);

  // 导航状态
  const [currentNodeId, setCurrentNodeId] = useState<string>('root');
  const [navHistory, setNavHistory] = useState<NavHistory>({
    past: [],
    present: 'root',
    future: [],
  });

  // 选择状态
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // UI 状态
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  // 交互状态
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, fileId: null, isBackground: false,
  });
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [newItemType, setNewItemType] = useState<'file' | 'folder' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Set<string> | null>(null);
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileNode | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // 拖拽状态
  const [draggingFileIds, setDraggingFileIds] = useState<Set<string>>(new Set());
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Refs
  const renameInputRef = useRef<HTMLInputElement>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileAreaRef = useRef<HTMLDivElement>(null);
  const toastIdCounter = useRef(0);

  // ============ 计算属性 ============
  const currentNode = useMemo(() => findNodeById(files, currentNodeId), [files, currentNodeId]);

  // 当前目录的子项
  const currentChildren = useMemo(() => {
    return currentNode?.children || [];
  }, [currentNode]);

  // 搜索过滤 + 排序后的文件列表
  const displayFiles = useMemo(() => {
    let result = currentChildren;

    // 搜索过滤
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(lowerQuery));
    }

    // 排序（文件夹始终在前）
    return [...result].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;

      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'zh-CN');
          break;
        case 'type':
          comparison = getFileTypeLabel(a).localeCompare(getFileTypeLabel(b), 'zh-CN');
          break;
        case 'size':
          comparison = (a.content?.length || 0) - (b.content?.length || 0);
          break;
        case 'date':
          comparison = getFileDate(a).localeCompare(getFileDate(b));
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [currentChildren, searchQuery, sortField, sortOrder]);

  // 统计信息
  const stats = useMemo(() => {
    let folderCount = 0;
    let fileCount = 0;
    let totalSize = 0;
    currentChildren.forEach(f => {
      if (f.type === 'folder') folderCount++;
      else { fileCount++; totalSize += (f.content?.length || 0) * 2; }
    });
    return { folderCount, fileCount, totalSize, total: currentChildren.length };
  }, [currentChildren]);

  // 获取从根到当前节点的路径
  const pathSegments = useMemo(() => {
    const segments: { id: string; name: string }[] = [];
    let node: FileNode | null = currentNode;
    const stack: FileNode[] = [];
    while (node) {
      stack.unshift(node);
      node = node.parentId ? findNodeById(files, node.parentId) : null;
    }
    stack.forEach(n => segments.push({ id: n.id, name: n.id === 'root' ? '主目录' : n.name }));
    return segments;
  }, [currentNode, files]);

  // ============ 工具函数 ============
  function getFileDate(node: FileNode): string {
    // 基于 id 生成稳定的日期字符串用于排序
    const baseTime = new Date('2024-01-01').getTime();
    const hash = node.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const offset = (hash % 365) * 86400000;
    const date = new Date(baseTime + offset);
    return date.toISOString();
  }

  function formatDateDisplay(node: FileNode): string {
    const baseTime = new Date('2024-01-01').getTime();
    const hash = node.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const offset = (hash % 365) * 86400000;
    const date = new Date(baseTime + offset);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  // Toast 通知
  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastIdCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ============ 导航 ============
  const navigateTo = useCallback((nodeId: string) => {
    const node = findNodeById(files, nodeId);
    if (!node || node.type !== 'folder') return;

    setNavHistory(prev => ({
      past: [...prev.past, prev.present],
      present: nodeId,
      future: [],
    }));
    setCurrentNodeId(nodeId);
    setSelectedFileIds(new Set());
    setLastSelectedId(null);
    setSearchQuery('');
    setRenamingId(null);
    setNewItemInputState(null);
    setExpandedFolders(prev => new Set([...prev, nodeId]));
  }, [files]);

  const goBack = useCallback(() => {
    if (navHistory.past.length === 0) return;
    const previous = navHistory.past[navHistory.past.length - 1];
    setNavHistory(prev => ({
      past: prev.past.slice(0, -1),
      present: previous,
      future: [prev.present, ...prev.future],
    }));
    setCurrentNodeId(previous);
    setSelectedFileIds(new Set());
    setSearchQuery('');
  }, [navHistory]);

  const goForward = useCallback(() => {
    if (navHistory.future.length === 0) return;
    const next = navHistory.future[0];
    setNavHistory(prev => ({
      past: [...prev.past, prev.present],
      present: next,
      future: prev.future.slice(1),
    }));
    setCurrentNodeId(next);
    setSelectedFileIds(new Set());
    setSearchQuery('');
  }, [navHistory]);

  const goUp = useCallback(() => {
    if (currentNode?.parentId) {
      navigateTo(currentNode.parentId);
    }
  }, [currentNode, navigateTo]);

  const navigateToPathIndex = useCallback((index: number) => {
    const targetId = pathSegments[index].id;
    if (targetId !== currentNodeId) {
      navigateTo(targetId);
    }
  }, [pathSegments, currentNodeId, navigateTo]);

  // ============ 文件操作 ============
  const handleFileDoubleClick = useCallback((file: FileNode) => {
    if (file.type === 'folder') {
      navigateTo(file.id);
    } else {
      const appId = getAppIdForFile(file.name);
      openFileWith(file.id, appId);
    }
    setSelectedFileIds(new Set([file.id]));
    setLastSelectedId(file.id);
  }, [navigateTo, openFileWith]);

  const handleFileClick = useCallback((fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (e.shiftKey && lastSelectedId) {
      // Shift+Click 范围选择
      const displayList = displayFiles;
      const lastIndex = displayList.findIndex(n => n.id === lastSelectedId);
      const currentIndex = displayList.findIndex(n => n.id === fileId);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = displayList.slice(start, end + 1).map(n => n.id);
        setSelectedFileIds(new Set(rangeIds));
        return;
      }
    }

    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd+Click 多选切换
      setSelectedFileIds(prev => {
        const next = new Set(prev);
        if (next.has(fileId)) next.delete(fileId);
        else next.add(fileId);
        return next;
      });
    } else {
      setSelectedFileIds(new Set([fileId]));
    }
    setLastSelectedId(fileId);
    // 单击时更新预览
    const file = findNodeById(files, fileId);
    if (file) {
      setPreviewFile(file);
    }
  }, [lastSelectedId, displayFiles, files]);

  const handleBackgroundClick = useCallback(() => {
    setSelectedFileIds(new Set());
    setLastSelectedId(null);
    setRenamingId(null);
    setNewItemInputState(null);
  }, []);

  // 右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent, fileId: string | null = null) => {
    e.preventDefault();
    e.stopPropagation();

    // 如果右键的文件不在已选中列表中，则只选中它
    if (fileId && !selectedFileIds.has(fileId)) {
      setSelectedFileIds(new Set([fileId]));
      setLastSelectedId(fileId);
    }

    const menuWidth = 220;
    const menuHeight = 360;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight);

    setContextMenu({
      visible: true,
      x,
      y,
      fileId,
      isBackground: fileId === null,
    });
  }, [selectedFileIds]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // 删除
  const handleDelete = useCallback((fileIds: Set<string>) => {
    fileIds.forEach(id => deleteFile(id));
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      fileIds.forEach(id => next.delete(id));
      return next;
    });
    setConfirmDelete(null);
    addToast(`已删除 ${fileIds.size} 个项目`, 'success');
  }, [deleteFile, addToast]);

  // 重命名
  const startRename = useCallback((fileId: string) => {
    const node = findNodeById(files, fileId);
    if (node) {
      setRenamingId(fileId);
      setRenameValue(node.name);
    }
    closeContextMenu();
  }, [files, closeContextMenu]);

  const commitRename = useCallback(() => {
    if (!renamingId) return;
    const trimmedName = renameValue.trim();
    if (!trimmedName) {
      setRenamingId(null);
      return;
    }
    const validation = validateFileName(trimmedName);
    if (!validation.valid) {
      addToast(validation.error || '文件名无效', 'error');
      return;
    }
    const node = findNodeById(files, renamingId);
    if (node && node.name !== trimmedName) {
      renameFile(renamingId, trimmedName);
      addToast(`已重命名为 "${trimmedName}"`, 'success');
    }
    setRenamingId(null);
    setRenameValue('');
  }, [renamingId, renameValue, files, renameFile, addToast]);

  // 复制/剪切/粘贴
  const handleCopy = useCallback((fileIds?: string[]) => {
    const ids = fileIds || Array.from(selectedFileIds);
    if (ids.length === 0) return;
    setClipboard({ fileIds: ids, mode: 'copy' });
    addToast(`已复制 ${ids.length} 个项目`, 'info');
    closeContextMenu();
  }, [selectedFileIds, addToast, closeContextMenu]);

  const handleCut = useCallback((fileIds?: string[]) => {
    const ids = fileIds || Array.from(selectedFileIds);
    if (ids.length === 0) return;
    setClipboard({ fileIds: ids, mode: 'cut' });
    addToast(`已剪切 ${ids.length} 个项目`, 'info');
    closeContextMenu();
  }, [selectedFileIds, addToast, closeContextMenu]);

  const handlePaste = useCallback(() => {
    if (!clipboard || clipboard.fileIds.length === 0) return;

    clipboard.fileIds.forEach(id => {
      if (clipboard.mode === 'copy') {
        copyFile(id, currentNodeId);
      } else if (clipboard.mode === 'cut') {
        moveFile(id, currentNodeId);
      }
    });

    addToast(`已粘贴 ${clipboard.fileIds.length} 个项目`, 'success');
    if (clipboard.mode === 'cut') {
      setClipboard(null);
    }
    closeContextMenu();
  }, [clipboard, currentNodeId, copyFile, moveFile, addToast, closeContextMenu]);

  // 新建文件/文件夹
  const setNewItemInputState = useCallback((type: 'file' | 'folder' | null) => {
    setNewItemType(type);
    if (type) {
      setNewItemName(type === 'folder' ? '新建文件夹' : '新建文件.txt');
    } else {
      setNewItemName('');
    }
    closeContextMenu();
  }, [closeContextMenu]);

  const commitNewItem = useCallback(() => {
    if (!newItemType || !newItemName.trim()) {
      setNewItemType(null);
      setNewItemName('');
      return;
    }
    const trimmedName = newItemName.trim();
    const validation = validateFileName(trimmedName);
    if (!validation.valid) {
      addToast(validation.error || '文件名无效', 'error');
      setNewItemType(null);
      setNewItemName('');
      return;
    }
    // 检查重名
    const exists = currentChildren.some(c => c.name === trimmedName);
    if (exists) {
      addToast('已存在同名项目', 'error');
      setNewItemType(null);
      setNewItemName('');
      return;
    }
    addFile(currentNodeId, trimmedName, newItemType);
    addToast(`已创建 ${trimmedName}`, 'success');
    setNewItemType(null);
    setNewItemName('');
  }, [newItemType, newItemName, currentNodeId, currentChildren, addFile, addToast]);

  // 下载文件
  const handleDownload = useCallback((fileId: string) => {
    const node = findNodeById(files, fileId);
    if (node && node.type === 'file') {
      const blob = new Blob([node.content || ''], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = node.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast(`已下载 ${node.name}`, 'success');
    }
    closeContextMenu();
  }, [files, addToast, closeContextMenu]);

  // 切换文件夹展开状态
  const toggleFolderExpand = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  // ============ 拖拽 ============
  const handleDragStart = useCallback((e: React.DragEvent, fileId: string) => {
    const ids = selectedFileIds.has(fileId) ? Array.from(selectedFileIds) : [fileId];
    setDraggingFileIds(new Set(ids));
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(ids));
    if (!selectedFileIds.has(fileId)) {
      setSelectedFileIds(new Set([fileId]));
    }
  }, [selectedFileIds]);

  const handleDragOver = useCallback((e: React.DragEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    const node = findNodeById(files, fileId);
    if (node?.type === 'folder' && !draggingFileIds.has(fileId)) {
      setDragOverFolderId(fileId);
    }
  }, [files, draggingFileIds]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);

    try {
      const sourceIds: string[] = JSON.parse(e.dataTransfer.getData('text/plain'));
      const targetId = targetFolderId || currentNodeId;

      sourceIds.forEach(id => {
        if (id !== targetId) {
          // 检查不是移动到自身或子目录
          const sourceNode = findNodeById(files, id);
          if (sourceNode && targetId !== sourceNode.parentId) {
            moveFile(id, targetId);
          }
        }
      });

      if (sourceIds.length > 0) {
        addToast(`已移动 ${sourceIds.length} 个项目`, 'success');
      }
    } catch {
      // 忽略解析错误
    }
    setDraggingFileIds(new Set());
  }, [currentNodeId, files, moveFile, addToast]);

  const handleDragEnd = useCallback(() => {
    setDraggingFileIds(new Set());
    setDragOverFolderId(null);
  }, []);

  // ============ 排序 ============
  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={11} className="opacity-30" />;
    return sortOrder === 'asc' ? <SortAsc size={11} /> : <SortDesc size={11} />;
  };

  // ============ 键盘快捷键 ============
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 输入框聚焦时不处理
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (renamingId || newItemType) return;

      // Ctrl+A 全选
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedFileIds(new Set(displayFiles.map(f => f.id)));
        return;
      }

      // Ctrl+C 复制
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedFileIds.size > 0) {
        e.preventDefault();
        handleCopy();
        return;
      }

      // Ctrl+X 剪切
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectedFileIds.size > 0) {
        e.preventDefault();
        handleCut();
        return;
      }

      // Ctrl+V 粘贴
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
        e.preventDefault();
        handlePaste();
        return;
      }

      // Ctrl+F 搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Delete 删除
      if (e.key === 'Delete' && selectedFileIds.size > 0) {
        e.preventDefault();
        setConfirmDelete(new Set(selectedFileIds));
        return;
      }

      // F2 重命名
      if (e.key === 'F2' && selectedFileIds.size === 1) {
        e.preventDefault();
        startRename(Array.from(selectedFileIds)[0]);
        return;
      }

      // Enter 打开
      if (e.key === 'Enter' && selectedFileIds.size === 1) {
        e.preventDefault();
        const file = findNodeById(files, Array.from(selectedFileIds)[0]);
        if (file) handleFileDoubleClick(file);
        return;
      }

      // Backspace 返回上级
      if (e.key === 'Backspace') {
        e.preventDefault();
        goUp();
        return;
      }

      // Escape 取消选择
      if (e.key === 'Escape') {
        setSelectedFileIds(new Set());
        setSearchQuery('');
        closeContextMenu();
        return;
      }

      // Alt+左 后退
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
        return;
      }

      // Alt+右 前进
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        goForward();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedFileIds, displayFiles, renamingId, newItemType, clipboard, files,
    handleCopy, handleCut, handlePaste, startRename, handleFileDoubleClick,
    goUp, goBack, goForward, closeContextMenu,
  ]);

  // 关闭右键菜单
  useEffect(() => {
    const handleClick = () => {
      closeContextMenu();
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [closeContextMenu]);

  // 自动聚焦重命名输入框
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      const dotIndex = renameValue.lastIndexOf('.');
      if (dotIndex > 0) {
        renameInputRef.current.setSelectionRange(0, dotIndex);
      } else {
        renameInputRef.current.select();
      }
    }
  }, [renamingId, renameValue]);

  // 自动聚焦新建项输入框
  useEffect(() => {
    if (newItemType && newItemInputRef.current) {
      newItemInputRef.current.focus();
      newItemInputRef.current.select();
    }
  }, [newItemType]);

  // ============ 渲染：目录树 ============
  const renderTreeItem = useCallback((node: FileNode, depth: number = 0): React.ReactNode => {
    if (node.type !== 'folder' && depth > 0) return null;
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFileIds.has(node.id);
    const folderChildren = node.children?.filter(c => c.type === 'folder') || [];

    return (
      <div key={node.id}>
        <div
          className={`app-file-tree-item${isSelected ? ' selected' : ''}${currentNodeId === node.id ? ' current' : ''}`}
          style={{ paddingLeft: `${8 + depth * 14}px` }}
          onClick={(e) => {
            e.stopPropagation();
            if (node.type === 'folder') {
              navigateTo(node.id);
              toggleFolderExpand(node.id);
            }
          }}
        >
          {folderChildren.length > 0 ? (
            <span
              className="app-file-tree-chevron"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolderExpand(node.id);
              }}
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
          ) : (
            <span className="app-file-tree-chevron" style={{ opacity: 0 }}>
              <ChevronRight size={12} />
            </span>
          )}
          <span className="app-file-tree-icon" style={{ color: getFileIconColor(node) }}>
            {node.type === 'folder' ? (isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />) : <File size={14} />}
          </span>
          <span className="app-file-tree-name">{node.id === 'root' ? '主目录' : node.name}</span>
        </div>
        {node.type === 'folder' && isExpanded && folderChildren.length > 0 && (
          <div className="app-file-tree-children">
            {folderChildren.map(child => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }, [expandedFolders, selectedFileIds, currentNodeId, navigateTo, toggleFolderExpand]);

  // ============ 渲染：列表行 ============
  const renderListRow = useCallback((file: FileNode, _index: number) => {
    const isSelected = selectedFileIds.has(file.id);
    const isDragging = draggingFileIds.has(file.id);
    const isDragOver = dragOverFolderId === file.id;
    const isRenaming = renamingId === file.id;

    return (
      <div
        key={file.id}
        className={`app-file-row${isSelected ? ' selected' : ''}${isDragging ? ' dragging' : ''}${isDragOver ? ' drag-over' : ''}`}
        onClick={(e) => handleFileClick(file.id, e)}
        onDoubleClick={() => handleFileDoubleClick(file)}
        onContextMenu={(e) => handleContextMenu(e, file.id)}
        draggable={!isRenaming}
        onDragStart={(e) => handleDragStart(e, file.id)}
        onDragOver={(e) => handleDragOver(e, file.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, file.id)}
        onDragEnd={handleDragEnd}
      >
        <span className="app-file-col-name">
          <span className="app-file-icon" style={{ color: getFileIconColor(file) }}>
            {getFileIcon(file, 16)}
          </span>
          {isRenaming ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              className="app-input app-rename-input"
            />
          ) : (
            <span className="app-file-name-text">{file.name}</span>
          )}
        </span>
        <span className="app-file-col-type">{getFileTypeLabel(file)}</span>
        <span className="app-file-col-size">
          {file.type === 'folder' ? `${file.children?.length || 0} 项` : formatSize((file.content?.length || 0) * 2)}
        </span>
        <span className="app-file-col-date">{formatDateDisplay(file)}</span>
      </div>
    );
  }, [
    selectedFileIds, draggingFileIds, dragOverFolderId, renamingId, renameValue,
    handleFileClick, handleFileDoubleClick, handleContextMenu, handleDragStart,
    handleDragOver, handleDragLeave, handleDrop, handleDragEnd, commitRename,
  ]);

  // ============ 渲染：网格项 ============
  const renderGridItem = useCallback((file: FileNode, _index: number) => {
    const isSelected = selectedFileIds.has(file.id);
    const isDragging = draggingFileIds.has(file.id);
    const isDragOver = dragOverFolderId === file.id;
    const isRenaming = renamingId === file.id;

    return (
      <div
        key={file.id}
        className={`app-file-grid-item${isSelected ? ' selected' : ''}${isDragging ? ' dragging' : ''}${isDragOver ? ' drag-over' : ''}`}
        onClick={(e) => handleFileClick(file.id, e)}
        onDoubleClick={() => handleFileDoubleClick(file)}
        onContextMenu={(e) => handleContextMenu(e, file.id)}
        draggable={!isRenaming}
        onDragStart={(e) => handleDragStart(e, file.id)}
        onDragOver={(e) => handleDragOver(e, file.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, file.id)}
        onDragEnd={handleDragEnd}
      >
        <div className="app-file-grid-icon" style={{ color: getFileIconColor(file) }}>
          {getFileIcon(file, 40)}
        </div>
        {isRenaming ? (
          <input
            ref={renameInputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            className="app-input app-grid-rename-input"
          />
        ) : (
          <div className="app-file-grid-name" title={file.name}>{file.name}</div>
        )}
        {file.type === 'file' && (
          <div className="app-file-grid-size">{formatSize((file.content?.length || 0) * 2)}</div>
        )}
        {file.type === 'folder' && (
          <div className="app-file-grid-size">{file.children?.length || 0} 项</div>
        )}
      </div>
    );
  }, [
    selectedFileIds, draggingFileIds, dragOverFolderId, renamingId, renameValue,
    handleFileClick, handleFileDoubleClick, handleContextMenu, handleDragStart,
    handleDragOver, handleDragLeave, handleDrop, handleDragEnd, commitRename,
  ]);

  // ============ 渲染：预览面板 ============
  const renderPreview = () => {
    if (!previewFile) {
      return (
        <div className="app-preview-empty">
          <Eye size={32} className="opacity-30" />
          <span>选择文件查看预览</span>
        </div>
      );
    }

    const category = getFileCategory(previewFile.name);

    return (
      <div className="app-preview-panel">
        <div className="app-preview-header">
          <span className="app-preview-title">预览</span>
          <button
            className="app-preview-close"
            onClick={() => { setPreviewFile(null); setShowPreview(false); }}
            title="关闭预览"
          >
            <X size={14} />
          </button>
        </div>
        <div className="app-preview-content">
          {/* 图标和名称 */}
          <div className="app-preview-file-header">
            <div
              className="app-preview-icon-wrapper"
              style={{ backgroundColor: getFileIconColor(previewFile) + '20', color: getFileIconColor(previewFile) }}
            >
              {getFileIcon(previewFile, 36)}
            </div>
            <div className="app-preview-file-name" title={previewFile.name}>{previewFile.name}</div>
          </div>

          {/* 文件信息 */}
          <div className="app-preview-info">
            <div className="app-preview-info-row">
              <span className="app-preview-info-label">类型</span>
              <span className="app-preview-info-value">{getFileTypeLabel(previewFile)}</span>
            </div>
            {previewFile.type === 'file' && (
              <div className="app-preview-info-row">
                <span className="app-preview-info-label">大小</span>
                <span className="app-preview-info-value">{formatSize((previewFile.content?.length || 0) * 2)}</span>
              </div>
            )}
            <div className="app-preview-info-row">
              <span className="app-preview-info-label">修改时间</span>
              <span className="app-preview-info-value">{formatDateDisplay(previewFile)}</span>
            </div>
          </div>

          {/* 内容预览 */}
          {previewFile.type === 'file' && (
            <div className="app-preview-content-wrapper">
              {category === 'image' && previewFile.content ? (
                <div className="app-preview-image-wrapper">
                  <img
                    src={`data:image/${getFileExtension(previewFile.name)};base64,${btoa(unescape(encodeURIComponent(previewFile.content)))}`}
                    alt={previewFile.name}
                    className="app-preview-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : category === 'markdown' && previewFile.content ? (
                <div className="app-preview-text-content">
                  <pre>{previewFile.content.substring(0, 500)}{previewFile.content.length > 500 ? '...' : ''}</pre>
                </div>
              ) : (category === 'text' || category === 'code' || category === 'json') && previewFile.content ? (
                <div className="app-preview-text-content">
                  <pre>{previewFile.content.substring(0, 500)}{previewFile.content.length > 500 ? '...' : ''}</pre>
                </div>
              ) : (
                <div className="app-preview-no-content">
                  <span>无法预览此文件类型</span>
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="app-preview-actions">
            <button
              className="app-preview-btn"
              onClick={() => handleFileDoubleClick(previewFile)}
            >
              <Eye size={12} /> 打开
            </button>
            {previewFile.type === 'file' && (
              <button
                className="app-preview-btn"
                onClick={() => handleDownload(previewFile.id)}
              >
                <Download size={12} /> 下载
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============ 渲染：右键菜单 ============
  const renderContextMenu = () => {
    if (!contextMenu.visible) return null;

    const items: { label: string; icon: React.ReactNode; action: () => void; shortcut?: string; danger?: boolean; divider?: boolean; disabled?: boolean }[] = [];

    if (contextMenu.isBackground) {
      // 背景右键菜单
      items.push(
        { label: '新建文件', icon: <FilePlus size={14} />, action: () => setNewItemInputState('file') },
        { label: '新建文件夹', icon: <FolderPlus size={14} />, action: () => setNewItemInputState('folder'), divider: true },
      );
      if (clipboard) {
        items.push(
          { label: '粘贴', icon: <ClipboardPaste size={14} />, action: handlePaste, shortcut: 'Ctrl+V' },
        );
      }
      items.push(
        { label: '全选', icon: <CheckCircle size={14} />, action: () => setSelectedFileIds(new Set(displayFiles.map(f => f.id))), shortcut: 'Ctrl+A', divider: true },
        { label: '刷新', icon: <RefreshCw size={14} />, action: () => { setSelectedFileIds(new Set()); addToast('已刷新', 'info'); }, shortcut: 'F5' },
      );
    } else if (contextMenu.fileId) {
      // 文件右键菜单
      const file = findNodeById(files, contextMenu.fileId);
      if (!file) return null;

      items.push(
        { label: '打开', icon: <Eye size={14} />, action: () => handleFileDoubleClick(file), shortcut: 'Enter' },
        { label: '在预览中显示', icon: <Info size={14} />, action: () => { setPreviewFile(file); setShowPreview(true); }, divider: true },
      );

      items.push(
        { label: '复制', icon: <Copy size={14} />, action: () => handleCopy([file.id]), shortcut: 'Ctrl+C' },
        { label: '剪切', icon: <Scissors size={14} />, action: () => handleCut([file.id]), shortcut: 'Ctrl+X' },
      );

      if (clipboard) {
        items.push(
          { label: '粘贴', icon: <ClipboardPaste size={14} />, action: handlePaste, shortcut: 'Ctrl+V' },
        );
      }

      items.push(
        { label: '重命名', icon: <Pencil size={14} />, action: () => startRename(file.id), shortcut: 'F2', divider: true },
        { label: '删除', icon: <Trash2 size={14} />, action: () => setConfirmDelete(new Set([file.id])), shortcut: 'Delete', danger: true },
      );

      if (file.type === 'file') {
        items.push(
          { label: '下载', icon: <Download size={14} />, action: () => handleDownload(file.id), divider: true },
        );
      }

      items.push(
        { label: '属性', icon: <Info size={14} />, action: () => { setPreviewFile(file); setShowPreview(true); } },
      );
    }

    return (
      <div
        className="app-context-menu"
        style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y }}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item.divider && index > 0 && <div className="app-context-menu-separator" />}
            <button
              className={`app-context-menu-item${item.danger ? ' danger' : ''}${item.disabled ? ' disabled' : ''}`}
              onClick={() => {
                if (!item.disabled) {
                  item.action();
                  closeContextMenu();
                }
              }}
              disabled={item.disabled}
            >
              <span className="app-context-menu-icon">{item.icon}</span>
              <span className="app-context-menu-label">{item.label}</span>
              {item.shortcut && <span className="app-context-menu-shortcut">{item.shortcut}</span>}
            </button>
          </React.Fragment>
        ))}
      </div>
    );
  };

  // ============ 渲染：删除确认对话框 ============
  const renderDeleteConfirm = () => {
    if (!confirmDelete) return null;
    const count = confirmDelete.size;
    const firstName = count === 1 ? findNodeById(files, Array.from(confirmDelete)[0])?.name : null;

    return (
      <div className="app-modal-overlay" onClick={() => setConfirmDelete(null)}>
        <div className="app-modal app-modal-sm" onClick={(e) => e.stopPropagation()}>
          <div className="app-modal-header">
            <AlertTriangle size={18} className="app-modal-icon danger" />
            <span className="app-modal-title">确认删除</span>
            <button className="app-modal-close" onClick={() => setConfirmDelete(null)}>
              <X size={16} />
            </button>
          </div>
          <div className="app-modal-content">
            <p className="app-modal-text">
              {count === 1
                ? `确定要删除 "${firstName}" 吗？`
                : `确定要删除选中的 ${count} 个项目吗？`}
            </p>
            <p className="app-modal-hint">此操作无法撤销</p>
          </div>
          <div className="app-modal-footer">
            <button className="app-modal-btn app-modal-btn-cancel" onClick={() => setConfirmDelete(null)}>
              取消
            </button>
            <button
              className="app-modal-btn app-modal-btn-danger"
              onClick={() => handleDelete(confirmDelete)}
            >
              <Trash2 size={14} /> 删除
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============ 主渲染 ============
  return (
    <div className="app-container app-file-manager" onClick={closeContextMenu}>
      {/* 工具栏 */}
      <div className="app-toolbar">
        {/* 导航按钮 */}
        <div className="app-toolbar-nav">
          <button
            className="app-toolbar-btn"
            onClick={goBack}
            disabled={navHistory.past.length === 0}
            title="后退 (Alt+←)"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            className="app-toolbar-btn"
            onClick={goForward}
            disabled={navHistory.future.length === 0}
            title="前进 (Alt+→)"
          >
            <ArrowRight size={14} />
          </button>
          <button
            className="app-toolbar-btn"
            onClick={goUp}
            disabled={!currentNode?.parentId}
            title="上级目录 (Backspace)"
          >
            <ChevronUp size={14} />
          </button>
          <button
            className="app-toolbar-btn"
            onClick={() => navigateTo('root')}
            title="主目录"
          >
            <Home size={14} />
          </button>
        </div>

        <span className="app-toolbar-separator" />

        {/* 面包屑导航 */}
        <div className="app-breadcrumb">
          {pathSegments.map((segment, index) => (
            <React.Fragment key={segment.id}>
              {index > 0 && <ChevronRight size={12} className="app-breadcrumb-separator" />}
              <button
                className={`app-breadcrumb-item${index === pathSegments.length - 1 ? ' current' : ''}`}
                onClick={() => navigateToPathIndex(index)}
              >
                {index === 0 ? <Home size={11} /> : null}
                <span>{segment.name}</span>
              </button>
            </React.Fragment>
          ))}
        </div>

        <span className="app-toolbar-separator" />

        {/* 新建按钮 */}
        <button
          className="app-toolbar-btn"
          onClick={() => setNewItemInputState('file')}
          title="新建文件"
        >
          <FilePlus size={14} />
        </button>
        <button
          className="app-toolbar-btn"
          onClick={() => setNewItemInputState('folder')}
          title="新建文件夹"
        >
          <FolderPlus size={14} />
        </button>

        <span className="app-toolbar-separator" />

        {/* 复制剪切粘贴 */}
        <button
          className="app-toolbar-btn"
          onClick={() => handleCopy()}
          disabled={selectedFileIds.size === 0}
          title="复制 (Ctrl+C)"
        >
          <Copy size={14} />
        </button>
        <button
          className="app-toolbar-btn"
          onClick={() => handleCut()}
          disabled={selectedFileIds.size === 0}
          title="剪切 (Ctrl+X)"
        >
          <Scissors size={14} />
        </button>
        <button
          className="app-toolbar-btn"
          onClick={handlePaste}
          disabled={!clipboard}
          title="粘贴 (Ctrl+V)"
        >
          <ClipboardPaste size={14} />
        </button>

        <span className="app-toolbar-separator" />

        {/* 删除 */}
        <button
          className="app-toolbar-btn danger"
          onClick={() => selectedFileIds.size > 0 && setConfirmDelete(new Set(selectedFileIds))}
          disabled={selectedFileIds.size === 0}
          title="删除 (Delete)"
        >
          <Trash2 size={14} />
        </button>

        {/* 搜索框 */}
        <div className="app-toolbar-search">
          <Search size={12} className="app-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="app-input app-search-input"
            placeholder="搜索当前目录 (Ctrl+F)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="app-search-clear"
              onClick={() => setSearchQuery('')}
              title="清除搜索"
            >
              <X size={10} />
            </button>
          )}
        </div>

        <span className="app-toolbar-separator" />

        {/* 视图切换 */}
        <div className="app-toolbar-view-toggle">
          <button
            className={`app-toolbar-btn${viewMode === 'list' ? ' active' : ''}`}
            onClick={() => setViewMode('list')}
            title="列表视图"
          >
            <List size={14} />
          </button>
          <button
            className={`app-toolbar-btn${viewMode === 'grid' ? ' active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="网格视图"
          >
            <Grid3X3 size={14} />
          </button>
        </div>

        {/* 预览切换 */}
        <button
          className={`app-toolbar-btn${showPreview ? ' active' : ''}`}
          onClick={() => setShowPreview(!showPreview)}
          title="预览面板"
        >
          <Eye size={14} />
        </button>

        {/* 侧边栏切换 */}
        <button
          className={`app-toolbar-btn${showSidebar ? ' active' : ''}`}
          onClick={() => setShowSidebar(!showSidebar)}
          title="侧边栏"
        >
          <Columns size={14} />
        </button>
      </div>

      {/* 主内容区 */}
      <div className="app-file-content">
        {/* 侧边栏：目录树 */}
        {showSidebar && (
          <div className="app-file-sidebar">
            <div className="app-file-sidebar-header">
              <span>目录树</span>
            </div>
            <div className="app-file-tree">
              {files.filter(f => f.type === 'folder').map(node => renderTreeItem(node, 0))}
            </div>
          </div>
        )}

        {/* 文件列表区 */}
        <div
          className="app-file-list-container"
          ref={fileAreaRef}
          onClick={handleBackgroundClick}
          onContextMenu={(e) => handleContextMenu(e)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, null)}
        >
          {/* 列表视图表头 */}
          {viewMode === 'list' && displayFiles.length > 0 && (
            <div className="app-file-list-header">
              <button
                className="app-file-col-name app-file-col-sortable"
                onClick={() => toggleSort('name')}
              >
                <span>名称</span>
                {renderSortIcon('name')}
              </button>
              <button
                className="app-file-col-type app-file-col-sortable"
                onClick={() => toggleSort('type')}
              >
                <span>类型</span>
                {renderSortIcon('type')}
              </button>
              <button
                className="app-file-col-size app-file-col-sortable"
                onClick={() => toggleSort('size')}
              >
                <span>大小</span>
                {renderSortIcon('size')}
              </button>
              <button
                className="app-file-col-date app-file-col-sortable"
                onClick={() => toggleSort('date')}
              >
                <span>修改日期</span>
                {renderSortIcon('date')}
              </button>
            </div>
          )}

          {/* 文件列表 */}
          <div className={`app-file-list${viewMode === 'grid' ? ' app-file-grid' : ''}`}>
            {/* 新建项输入 */}
            {newItemType && (
              viewMode === 'list' ? (
                <div className="app-file-row new-item">
                  <span className="app-file-col-name">
                    <span className="app-file-icon" style={{ color: newItemType === 'folder' ? '#f59e0b' : '#6b7280' }}>
                      {newItemType === 'folder' ? <Folder size={16} /> : <File size={16} />}
                    </span>
                    <input
                      ref={newItemInputRef}
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onBlur={commitNewItem}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitNewItem();
                        if (e.key === 'Escape') { setNewItemType(null); setNewItemName(''); }
                        e.stopPropagation();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="app-input app-rename-input"
                      placeholder={newItemType === 'folder' ? '文件夹名' : '文件名'}
                    />
                  </span>
                  <span className="app-file-col-type" />
                  <span className="app-file-col-size" />
                  <span className="app-file-col-date" />
                </div>
              ) : (
                <div className="app-file-grid-item new-item">
                  <div className="app-file-grid-icon" style={{ color: newItemType === 'folder' ? '#f59e0b' : '#6b7280' }}>
                    {newItemType === 'folder' ? <Folder size={40} /> : <File size={40} />}
                  </div>
                  <input
                    ref={newItemInputRef}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onBlur={commitNewItem}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitNewItem();
                      if (e.key === 'Escape') { setNewItemType(null); setNewItemName(''); }
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="app-input app-grid-rename-input"
                    placeholder={newItemType === 'folder' ? '文件夹名' : '文件名'}
                  />
                </div>
              )
            )}

            {/* 文件项 */}
            {displayFiles.length === 0 && !newItemType ? (
              <div className="app-file-empty">
                <Folder size={48} className="opacity-30" />
                <span>{searchQuery ? `未找到匹配 "${searchQuery}" 的文件` : '此文件夹为空'}</span>
                {!searchQuery && (
                  <span className="app-file-empty-hint">右键点击可创建新文件或文件夹</span>
                )}
              </div>
            ) : (
              displayFiles.map((file, index) =>
                viewMode === 'list' ? renderListRow(file, index) : renderGridItem(file, index)
              )
            )}
          </div>
        </div>

        {/* 预览面板 */}
        {showPreview && (
          <div className="app-file-preview-panel">
            {renderPreview()}
          </div>
        )}
      </div>

      {/* 状态栏 */}
      <div className="app-status-bar">
        <div className="app-status-left">
          <span className="app-status-item">
            <Folder size={11} /> {stats.folderCount} 个文件夹
          </span>
          <span className="app-status-item">
            <File size={11} /> {stats.fileCount} 个文件
          </span>
          <span className="app-status-item">
            <HardDrive size={11} /> {formatSize(stats.totalSize)}
          </span>
        </div>
        <div className="app-status-center">
          {selectedFileIds.size > 0 && (
            <span className="app-status-item selected">
              <CheckCircle size={11} /> 已选择 {selectedFileIds.size} 项
            </span>
          )}
          {clipboard && (
            <span className="app-status-item clipboard">
              {clipboard.mode === 'copy' ? <Copy size={11} /> : <Scissors size={11} />}
              剪贴板: {clipboard.fileIds.length} 项
            </span>
          )}
        </div>
        <div className="app-status-right">
          <span className="app-status-item path" title={pathSegments.map(s => s.name).join(' / ')}>
            {pathSegments.map(s => s.name).join(' / ')}
          </span>
        </div>
      </div>

      {/* 右键菜单 */}
      {renderContextMenu()}

      {/* 删除确认对话框 */}
      {renderDeleteConfirm()}

      {/* Toast 通知 */}
      {toasts.length > 0 && (
        <div className="app-toast-container">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`app-toast app-toast-${toast.type}`}
              onClick={() => removeToast(toast.id)}
            >
              {toast.type === 'success' && <CheckCircle size={14} />}
              {toast.type === 'error' && <AlertTriangle size={14} />}
              {toast.type === 'info' && <Info size={14} />}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
