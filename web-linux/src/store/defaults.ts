import { type ReactNode } from 'react'
import type { DesktopIcon, FileNode } from '../types'
import {
  FolderIcon, TerminalIcon, FileTextIcon, BrowserIcon, CalculatorIcon,
  CalendarIcon, SettingsIcon, ActivityIcon, CodeIcon, ChatIcon, BoardIcon,
  ClipboardIcon, LightningIcon, SearchIcon
} from '../icons'

export const defaultDesktopIcons: DesktopIcon[] = [
  { id: 'icon-smart-search', appId: 'smart-search', name: '智慧搜索', icon: <SearchIcon />, x: 260, y: 320 },
  { id: 'icon-files', appId: 'files', name: '文件管理器', icon: <FolderIcon />, x: 20, y: 20 },
  { id: 'icon-terminal', appId: 'terminal', name: '终端', icon: <TerminalIcon />, x: 20, y: 120 },
  { id: 'icon-editor', appId: 'text-editor', name: '文本编辑器', icon: <FileTextIcon />, x: 20, y: 220 },
  { id: 'icon-browser', appId: 'browser', name: '浏览器', icon: <BrowserIcon />, x: 20, y: 320 },
  { id: 'icon-code', appId: 'code-editor', name: '代码编辑器', icon: <CodeIcon />, x: 20, y: 420 },
  { id: 'icon-calc', appId: 'calculator', name: '计算器', icon: <CalculatorIcon />, x: 140, y: 20 },
  { id: 'icon-calendar', appId: 'calendar', name: '日历', icon: <CalendarIcon />, x: 140, y: 120 },
  { id: 'icon-settings', appId: 'settings', name: '设置', icon: <SettingsIcon />, x: 140, y: 220 },
  { id: 'icon-monitor', appId: 'system-monitor', name: '系统监视器', icon: <ActivityIcon />, x: 140, y: 320 },
  { id: 'icon-ai', appId: 'ai-helper', name: 'AI 助手', icon: <ChatIcon />, x: 140, y: 420 },
  { id: 'icon-kanban', appId: 'kanban-board', name: '任务看板', icon: <BoardIcon />, x: 260, y: 20 },
  { id: 'icon-clipboard', appId: 'clipboard-manager', name: '剪贴板管理', icon: <ClipboardIcon />, x: 260, y: 120 },
  { id: 'icon-commands', appId: 'quick-commands', name: '快捷命令', icon: <LightningIcon />, x: 260, y: 220 },
]

export const defaultFiles: FileNode[] = [
  { id: 'root', name: '/', type: 'folder', parentId: null, children: [
    { id: 'home', name: 'home', type: 'folder', parentId: 'root', children: [
      { id: 'user', name: 'user', type: 'folder', parentId: 'home', children: [
        { id: 'desktop', name: '桌面', type: 'folder', parentId: 'user', children: [] },
        { id: 'documents', name: '文档', type: 'folder', parentId: 'user', children: [
          { id: 'readme', name: 'README.txt', type: 'file', parentId: 'documents', content: '欢迎使用 Web Linux 系统!\n\n这是一个基于 Web 的 Linux 桌面环境。\n\n特性:\n- 50+ 功能齐全的应用程序\n- 完整的窗口管理系统\n- 文件系统\n- 终端仿真器\n\n祝你使用愉快!' },
          { id: 'notes', name: '笔记.txt', type: 'file', parentId: 'documents', content: '今天的待办事项:\n1. 完成项目开发\n2. 测试所有应用程序\n3. 优化性能' },
        ] },
        { id: 'downloads', name: '下载', type: 'folder', parentId: 'user', children: [] },
        { id: 'pictures', name: '图片', type: 'folder', parentId: 'user', children: [] },
        { id: 'music', name: '音乐', type: 'folder', parentId: 'user', children: [] },
        { id: 'videos', name: '视频', type: 'folder', parentId: 'user', children: [] },
      ] },
    ] },
    { id: 'etc', name: 'etc', type: 'folder', parentId: 'root', children: [
      { id: 'hostname', name: 'hostname', type: 'file', parentId: 'etc', content: 'web-linux' },
      { id: 'hosts', name: 'hosts', type: 'file', parentId: 'etc', content: '127.0.0.1 localhost\n::1 localhost' },
    ] },
    { id: 'tmp', name: 'tmp', type: 'folder', parentId: 'root', children: [] },
    { id: 'var', name: 'var', type: 'folder', parentId: 'root', children: [
      { id: 'log', name: 'log', type: 'folder', parentId: 'var', children: [
        { id: 'syslog', name: 'syslog', type: 'file', parentId: 'log', content: '系统日志:\n[INFO] 系统启动完成\n[INFO] 所有服务已就绪\n[INFO] 桌面环境已加载' },
      ] },
    ] },
  ] },
]

export const defaultPinnedApps = ['terminal', 'files', 'browser', 'settings']

export const defaultTotalDesktops = 4
