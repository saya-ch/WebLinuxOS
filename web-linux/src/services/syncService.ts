/**
 * Realtime Cross-tab Sync Service
 *
 * 基于浏览器原生 BroadcastChannel + localStorage storage 事件构建的轻量级
 * 跨标签页同步层。它让 WebLinuxOS 在多个标签页之间实现：
 *
 *  - Presence 在线感知：每个标签页都有唯一 tabId，可相互感知在线状态
 *  - Clipboard 实时广播：任一标签页的云剪贴板新增条目会被其它标签页实时接收
 *  - Theme / Accent 联动：主题切换在所有标签页同步生效
 *  - Files 变更通知：文件树改动会广播事件，其他标签页可按需重拉
 *  - Notes / 书签 同步：任何基于 storage 的业务数据都可通过通道广播
 *
 * 与云剪贴板（GitHub Gist）的关系：
 *  - 云剪贴板负责跨设备/跨浏览器同步（需 GitHub Token）
 *  - 本服务仅在同一浏览器内同步（无需任何账号），两者是互补关系
 */

import { STORAGE_KEYS, loadFromStorage } from '../store/storageUtils'

const CHANNEL_NAME = 'weblinux-sync-v99'
const PRESENCE_KEY = 'weblinux-sync-presence'
const PRESENCE_TIMEOUT_MS = 15_000

export interface PeerInfo {
  tabId: string
  name: string
  openedAt: number
  lastSeen: number
  theme: string
  url: string
}

export type SyncTopic =
  | 'presence'
  | 'presence-leave'
  | 'clipboard-add'
  | 'clipboard-remove'
  | 'theme-change'
  | 'accent-change'
  | 'file-change'
  | 'note-change'
  | 'desktop-icon-change'
  | 'pinned-change'
  | 'window-event'
  | 'broadcast'

export interface SyncMessage<T = unknown> {
  topic: SyncTopic
  tabId: string
  payload: T
  ts: number
}

type Listener<T = unknown> = (msg: SyncMessage<T>) => void

class SyncServiceImpl {
  private channel: BroadcastChannel | null = null
  private tabId: string
  private peerName: string
  private listeners = new Map<string, Set<Listener>>()
  private peers = new Map<string, PeerInfo>()
  private presenceTimer: ReturnType<typeof setInterval> | null = null
  private storageHandler: ((e: StorageEvent) => void) | null = null
  private storageTopicHandler: ((e: StorageEvent) => void) | null = null
  private onlineHandler: (() => void) | null = null
  private offlineHandler: (() => void) | null = null

  constructor() {
    this.tabId = 't_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
    this.peerName = this.buildPeerName()
    this.init()
  }

  /** 构建人类可读的标签页昵称 */
  private buildPeerName(): string {
    const labels = ['先锋', '骑士', '漫步者', '星舰', '灯塔', '涟漪', '棱镜', '回声', '游侠', '墨痕']
    const animals = ['赤狐', '白鲸', '夜鹰', '树懒', '猎豹', '水獭', '雄狮', '游隼', '熊猫', '章鱼']
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
    return `${pick(labels)}·${pick(animals)}`
  }

  /** 初始化通道与事件监听 */
  private init() {
    if (typeof window === 'undefined') return

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel(CHANNEL_NAME)
        this.channel.onmessage = (ev) => this.onMessage(ev.data as SyncMessage)
      }
    } catch (err) {
      console.warn('[sync] BroadcastChannel 不可用，降级为 storage 事件模式：', (err as Error).message)
    }

    // storage 事件：当其它标签页写入 localStorage 时，本标签页会收到事件
    this.storageHandler = (e) => {
      if (!e.key) return
      if (e.key === STORAGE_KEYS.THEME) {
        const theme = (e.newValue || 'dark').replace(/^"|"$/g, '')
        this.emitLocal('theme-change', theme)
      } else if (e.key === STORAGE_KEYS.ACCENT) {
        const accent = (e.newValue || 'indigo').replace(/^"|"$/g, '')
        this.emitLocal('accent-change', accent)
      } else if (e.key === STORAGE_KEYS.FILES) {
        this.emitLocal('file-change', null)
      } else if (e.key === STORAGE_KEYS.DESKTOP_ICONS) {
        this.emitLocal('desktop-icon-change', null)
      } else if (e.key === STORAGE_KEYS.PINNED_APPS) {
        this.emitLocal('pinned-change', null)
      }
    }
    window.addEventListener('storage', this.storageHandler)

    // 持久化的消息通道（用于携带 payload 的广播）
    this.storageTopicHandler = (e) => {
      if (!e.key || e.key !== PRESENCE_KEY + ':msg' || !e.newValue) return
      try {
        const msg = JSON.parse(e.newValue) as SyncMessage
        if (msg.tabId !== this.tabId) this.onMessage(msg)
      } catch { /* ignore */ }
    }
    window.addEventListener('storage', this.storageTopicHandler)

    // 在线/离线广播
    this.onlineHandler = () => this.announcePresence(true)
    this.offlineHandler = () => this.announcePresence(false)
    window.addEventListener('online', this.onlineHandler)
    window.addEventListener('offline', this.offlineHandler)

    // 定期宣布存在，并清理失联 peer
    this.announcePresence(true)
    this.presenceTimer = setInterval(() => {
      this.announcePresence(true)
      this.prunePeers()
    }, 5000)

    // 标签页关闭前，宣布离开
    window.addEventListener('beforeunload', () => {
      this.announcePresence(false)
    })
    window.addEventListener('pagehide', () => {
      this.announcePresence(false)
    })
  }

  private onMessage(msg: SyncMessage) {
    if (!msg || !msg.topic) return
    if (msg.topic === 'presence') {
      const peer = msg.payload as PeerInfo
      if (peer && peer.tabId !== this.tabId) {
        this.peers.set(peer.tabId, { ...peer, lastSeen: Date.now() })
      }
      return
    }
    if (msg.topic === 'presence-leave') {
      const peerId = msg.payload as string
      this.peers.delete(peerId)
    }
    this.emitLocal(msg.topic, msg.payload, msg.tabId)
  }

  private emitLocal(topic: SyncTopic, payload?: unknown, fromTabId?: string) {
    const set = this.listeners.get(topic)
    if (!set || set.size === 0) return
    const msg: SyncMessage = { topic, tabId: fromTabId || this.tabId, payload, ts: Date.now() }
    set.forEach((fn) => {
      try { fn(msg) } catch (err) { console.warn('[sync] listener error:', err) }
    })
  }

  /** 宣告本标签页在线/离线 */
  private announcePresence(online: boolean) {
    if (online) {
      const info: PeerInfo = {
        tabId: this.tabId,
        name: this.peerName,
        openedAt: Date.now(),
        lastSeen: Date.now(),
        theme: String(loadFromStorage<string>(STORAGE_KEYS.THEME, 'auto') || 'auto'),
        url: window.location.pathname,
      }
      if (this.channel) {
        this.channel.postMessage({ topic: 'presence', tabId: this.tabId, payload: info, ts: Date.now() } as SyncMessage)
      }
      try {
        localStorage.setItem(PRESENCE_KEY + ':' + this.tabId, JSON.stringify(info))
      } catch { /* ignore */ }
    } else {
      const msg: SyncMessage = { topic: 'presence-leave', tabId: this.tabId, payload: this.tabId, ts: Date.now() }
      if (this.channel) {
        try { this.channel.postMessage(msg) } catch { /* ignore */ }
      }
      try {
        localStorage.removeItem(PRESENCE_KEY + ':' + this.tabId)
      } catch { /* ignore */ }
    }
  }

  private prunePeers() {
    const now = Date.now()
    let changed = false
    this.peers.forEach((p, id) => {
      if (now - p.lastSeen > PRESENCE_TIMEOUT_MS) {
        this.peers.delete(id)
        changed = true
        this.emitLocal('presence-leave', id)
      }
    })
    if (changed) this.emitLocal('presence', null)
  }

  /** 广播一条消息到其它标签页 */
  public broadcast<T = unknown>(topic: SyncTopic, payload?: T) {
    const msg: SyncMessage<T> = { topic, tabId: this.tabId, payload: payload as T, ts: Date.now() }
    if (this.channel) {
      try { this.channel.postMessage(msg) } catch { /* ignore */ }
    }
    try {
      localStorage.setItem(PRESENCE_KEY + ':msg', JSON.stringify(msg))
    } catch { /* ignore */ }
  }

  /** 订阅某个 topic 的消息 */
  public subscribe<T = unknown>(topic: SyncTopic, fn: Listener<T>): () => void {
    let set = this.listeners.get(topic) as Set<Listener<unknown>> | undefined
    if (!set) {
      set = new Set<Listener<unknown>>()
      this.listeners.set(topic, set)
    }
    set.add(fn as Listener<unknown>)
    return () => {
      const s = this.listeners.get(topic)
      if (s) s.delete(fn as Listener<unknown>)
    }
  }

  /** 当前标签页 ID */
  public getTabId(): string { return this.tabId }

  /** 当前标签页昵称 */
  public getPeerName(): string { return this.peerName }

  /** 列出所有在线 peer（含自身） */
  public getPeers(): PeerInfo[] {
    const self: PeerInfo = {
      tabId: this.tabId,
      name: this.peerName + ' (本标签页)',
      openedAt: Date.now(),
      lastSeen: Date.now(),
      theme: String(loadFromStorage<string>(STORAGE_KEYS.THEME, 'auto') || 'auto'),
      url: window.location.pathname,
    }
    return [self, ...Array.from(this.peers.values())]
  }

  /** 在线数量（包含自身） */
  public getPeerCount(): number {
    return 1 + this.peers.size
  }

  /** 销毁（用于热重载场景） */
  public destroy() {
    if (this.presenceTimer) clearInterval(this.presenceTimer)
    if (this.storageHandler) window.removeEventListener('storage', this.storageHandler)
    if (this.storageTopicHandler) window.removeEventListener('storage', this.storageTopicHandler)
    if (this.onlineHandler) window.removeEventListener('online', this.onlineHandler)
    if (this.offlineHandler) window.removeEventListener('offline', this.offlineHandler)
    if (this.channel) {
      try { this.channel.close() } catch { /* ignore */ }
    }
    this.announcePresence(false)
  }
}

let _syncService: SyncServiceImpl | null | undefined = undefined
export const getSyncService = (): SyncServiceImpl | null => {
  if (typeof window === 'undefined') return null
  if (_syncService === undefined) {
    try {
      _syncService = new SyncServiceImpl()
    } catch (err) {
      console.warn('[sync] 初始化失败：', (err as Error).message)
      _syncService = null
    }
    try {
      ;(window as unknown as { __weblinuxSync?: SyncServiceImpl }).__weblinuxSync = _syncService || undefined
    } catch { /* ignore */ }
  }
  return _syncService
}
// 便于现有调用直接引用
export const syncService: SyncServiceImpl | null = (typeof window !== 'undefined' ? getSyncService() : null)
