import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  BookOpen, Code, Play, CheckCircle2, XCircle, Clock, Star, Shuffle,
  ChevronLeft, ChevronRight, BarChart3, Filter, RefreshCw, Bookmark,
  Trash2, PlusCircle, Search, Lightbulb, GripVertical, Trophy, Flame,
  Target, Brain, Database, Network, MonitorCog, Server, Briefcase, AlertCircle
} from 'lucide-react'

type Difficulty = 'easy' | 'medium' | 'hard'
type Category = 'algorithm' | 'frontend' | 'backend' | 'database' | 'network' | 'os' | 'behavior' | 'system-design'

interface InterviewQuestion {
  id: string
  category: Category
  title: string
  difficulty: Difficulty
  question: string
  hint?: string
  answer: string
  codeExample?: { lang: string; code: string }
  tags: string[]
  source?: string
}

interface UserProgress {
  solved: Record<string, 'correct' | 'wrong' | 'attempted'>
  bookmarks: string[]
  streakDays: string[]  // ISO日期（YYYY-MM-DD）
  lastActive?: string
  customQuestions: InterviewQuestion[]
  settings: { dailyGoal: number }
}

const STORAGE_KEY = 'weblinux_techinterview_progress_v1'

const CATEGORY_META: Record<Category, { name: string; icon: React.ReactNode; color: string }> = {
  'algorithm':      { name: '算法数据结构', icon: <Brain size={16}/>,      color: '#8b5cf6' },
  'frontend':       { name: '前端开发',     icon: <MonitorCog size={16}/>, color: '#38bdf8' },
  'backend':        { name: '后端开发',     icon: <Server size={16}/>,     color: '#10b981' },
  'database':       { name: '数据库',       icon: <Database size={16}/>,   color: '#f59e0b' },
  'network':        { name: '计算机网络',   icon: <Network size={16}/>,    color: '#06b6d4' },
  'os':             { name: '操作系统',     icon: <GripVertical size={16}/>, color: '#f43f5e' },
  'behavior':       { name: '行为面试',     icon: <Briefcase size={16}/>,  color: '#ec4899' },
  'system-design':  { name: '系统设计',     icon: <Target size={16}/>,     color: '#14b8a6' },
}

const DEFAULT_QUESTIONS: InterviewQuestion[] = [
  // ============ 算法 ============
  {
    id: 'algo-1', category: 'algorithm', difficulty: 'easy',
    title: '两数之和 (Two Sum)',
    question: '给定一个整数数组 nums 和一个目标值 target，请你在该数组中找出和为目标值的那两个整数，并返回它们的数组下标。\n你可以假设每种输入只会对应一个答案，不能重复使用同一个元素。',
    hint: '可以用哈希表把 O(n²) 优化到 O(n)',
    answer: '核心思路是使用哈希表存储「元素值 → 下标」的映射，遍历数组时查看 target - nums[i] 是否在哈希表中。\n\n时间复杂度：O(n)，空间复杂度：O(n)',
    codeExample: { lang: 'javascript', code: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}\n\n// 测试\nconsole.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]\nconsole.log(twoSum([3, 2, 4], 6));      // [1, 2]` },
    tags: ['数组', '哈希表', 'LeetCode-1', '经典'],
    source: 'LeetCode #1'
  },
  {
    id: 'algo-2', category: 'algorithm', difficulty: 'easy',
    title: '反转链表 (Reverse Linked List)',
    question: '给你单链表的头节点 head，请你反转链表，并返回反转后的链表。',
    hint: '使用三个指针 prev / curr / next 迭代地反转指针方向',
    answer: '三指针迭代法：prev 始终指向已反转部分的头，curr 指向当前处理节点，next 暂存下一个节点。\n\n时间 O(n)，空间 O(1)',
    codeExample: { lang: 'javascript', code: `class ListNode {\n  constructor(val = 0, next = null) { this.val = val; this.next = next; }\n}\n\nfunction reverseList(head) {\n  let prev = null;\n  let curr = head;\n  while (curr) {\n    const next = curr.next; // 保存下一个\n    curr.next = prev;      // 反转指针\n    prev = curr;           // prev 前进\n    curr = next;           // curr 前进\n  }\n  return prev;\n}\n\n// 构造测试 1->2->3->4->5\nconst n5 = new ListNode(5);\nconst n4 = new ListNode(4, n5);\nconst n3 = new ListNode(3, n4);\nconst n2 = new ListNode(2, n3);\nconst n1 = new ListNode(1, n2);\n\nconst result = reverseList(n1);\n// 打印反转后 5,4,3,2,1\nlet p = result; const arr = [];\nwhile(p) { arr.push(p.val); p = p.next; }\nconsole.log(arr.join(' -> '));` },
    tags: ['链表', '双指针', 'LeetCode-206'],
    source: 'LeetCode #206'
  },
  {
    id: 'algo-3', category: 'algorithm', difficulty: 'medium',
    title: 'LRU Cache 设计',
    question: '请设计并实现一个满足 LRU (最近最少使用) 缓存约束的数据结构。\n\n实现 LRUCache 类：\n- LRUCache(int capacity) 以正整数容量初始化\n- int get(int key) 如果 key 存在则返回值，否则 -1\n- void put(int key, int value) 插入或更新 key-value，超过容量时逐出最久未使用的\n\n要求 get 和 put 的平均时间复杂度都为 O(1)',
    hint: '哈希表 + 双向链表：哈希表存 key→Node，链表维护使用顺序（头部最新，尾部最旧）',
    answer: '核心数据结构：\n1. Map/Dict：key → ListNode\n2. 双向链表：head ↔ node ↔ ... ↔ tail\n\nget(key): 取 node → 移到链表头部 → 返回值\nput(key, val):\n  - key 存在 → 更新值 + 移到头部\n  - key 不存在 → 新建节点 + 放到头部\n    - 若超出容量 → 删除链表尾部节点 + 删除对应 Map 条目',
    codeExample: { lang: 'javascript', code: `// 利用 JS Map 的插入顺序特性，超简洁实现\nclass LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.cache = new Map();\n  }\n  get(key) {\n    if (!this.cache.has(key)) return -1;\n    const value = this.cache.get(key);\n    this.cache.delete(key);      // 删除旧位置\n    this.cache.set(key, value);  // 重新插入=最新位置\n    return value;\n  }\n  put(key, value) {\n    if (this.cache.has(key)) {\n      this.cache.delete(key);\n    } else if (this.cache.size >= this.capacity) {\n      // Map.keys().next().value 是最旧的 key\n      const oldestKey = this.cache.keys().next().value;\n      this.cache.delete(oldestKey);\n    }\n    this.cache.set(key, value);\n  }\n}\n\nconst cache = new LRUCache(2);\ncache.put(1, 1);\ncache.put(2, 2);\nconsole.log(cache.get(1)); // 1，同时 1 变为最新\ncache.put(3, 3);           // 容量满，逐出 2\nconsole.log(cache.get(2)); // -1 (已删除)\ncache.put(4, 4);           // 逐出 1\nconsole.log(cache.get(1)); // -1\nconsole.log(cache.get(3)); // 3\nconsole.log(cache.get(4)); // 4` },
    tags: ['数据结构设计', '哈希表', '链表', 'LeetCode-146'],
    source: 'LeetCode #146'
  },
  {
    id: 'algo-4', category: 'algorithm', difficulty: 'medium',
    title: '最长无重复子串',
    question: '给定一个字符串 s，请你找出其中不含有重复字符的最长子串的长度。',
    hint: '滑动窗口（双指针）+ 哈希集合记录窗口内的字符',
    answer: '滑动窗口思想：left/right 指针维护无重复窗口，用 set 存窗口字符。\n- right 向右扩张，遇到重复字符时不断收缩 left 直到无重复\n- 全程记录最大窗口长度\n\n时间 O(n)，每个指针最多走 n 步',
    codeExample: { lang: 'javascript', code: `function lengthOfLongestSubstring(s) {\n  const set = new Set();\n  let left = 0, maxLen = 0;\n  for (let right = 0; right < s.length; right++) {\n    while (set.has(s[right])) {\n      set.delete(s[left]);\n      left++;\n    }\n    set.add(s[right]);\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  return maxLen;\n}\n\nconsole.log(lengthOfLongestSubstring('abcabcbb')); // 3 (abc)\nconsole.log(lengthOfLongestSubstring('bbbbb'));    // 1\nconsole.log(lengthOfLongestSubstring('pwwkew'));   // 3 (wke)` },
    tags: ['字符串', '滑动窗口', 'LeetCode-3'],
    source: 'LeetCode #3'
  },
  {
    id: 'algo-5', category: 'algorithm', difficulty: 'hard',
    title: '合并 K 个升序链表',
    question: '给你一个链表数组，每个链表都已经按升序排列。请你将所有链表合并到一个升序链表中，返回合并后的链表。',
    hint: '可以分治合并（类似归并排序），每条链表参与 log(k) 次合并。总复杂度 O(N log k)',
    answer: '方法一：分治法。把 lists 分成两半，递归合并左半和右半，再把两条合并好的链表合并。\n方法二：小顶堆存每个链表的头节点最小值，每次出堆一个节点接入结果。',
    tags: ['链表', '分治', '堆', 'LeetCode-23'],
    source: 'LeetCode #23'
  },
  // ============ 前端 ============
  {
    id: 'fe-1', category: 'frontend', difficulty: 'easy',
    title: 'var / let / const 有什么区别？',
    question: '请解释 ES6 中 var、let、const 三种变量声明方式的区别。',
    hint: '从「作用域」「重复声明」「变量提升」「赋值」四个角度对比',
    answer: `| 特性         | var         | let         | const       |
|-------------|-------------|-------------|-------------|
| 作用域       | 函数作用域   | 块级作用域   | 块级作用域   |
| 重复声明     | 允许        | 不允许      | 不允许      |
| 变量提升     | 提升并初始undefined | 提升但进入 TDZ (暂时性死区) | 同 let |
| 重新赋值     | 允许        | 允许        | 不允许      |
| 声明时初始化 | 可忽略      | 可忽略      | 必须赋值    |

⚠️ const 只保证引用不可变：对象属性 / 数组成员仍可修改！`,
    tags: ['JavaScript基础', 'ES6', '高频'],
  },
  {
    id: 'fe-2', category: 'frontend', difficulty: 'medium',
    title: '解释浏览器事件循环 Event Loop',
    question: '请用你自己的话解释浏览器的 JavaScript 事件循环机制，并分析以下代码输出顺序：\nconsole.log("1");\nsetTimeout(() => console.log("2"), 0);\nPromise.resolve().then(() => console.log("3"));\nconsole.log("4");',
    hint: '区分宏任务（setTimeout/script）和微任务（Promise.then/MutationObserver/queueMicrotask），每轮宏任务执行完清空所有微任务',
    answer: `事件循环核心流程：
1. 执行同步代码（调用栈清空）
2. 清空微任务队列（所有微任务）
3. 取出下一个宏任务执行
4. 重复 2-3

宏任务：script 整体、setTimeout、setInterval、I/O、UI 渲染
微任务：Promise.then/catch/finally、MutationObserver、queueMicrotask

题目输出顺序：1 → 4 → 3 → 2

因为：
- 同步 1、4 先执行
- 清空微任务 → 输出 3（Promise.then）
- 下一个宏任务 → 输出 2（setTimeout）`,
    codeExample: { lang: 'javascript', code: `console.log('1');\nsetTimeout(() => console.log('2'), 0);\nPromise.resolve().then(() => console.log('3'));\nconsole.log('4');\n// ⚠️ 请点击运行，上方答案区给出了预期顺序` },
    tags: ['事件循环', '异步', 'Promise', '高频'],
  },
  {
    id: 'fe-3', category: 'frontend', difficulty: 'medium',
    title: 'React useEffect 依赖数组为什么重要？',
    question: '请说明 React Hooks 中 useEffect 的第二个参数（依赖数组）的作用，以及空数组、不传、传变量三种情况的区别。',
    hint: 'useEffect 本质是在「每次渲染后」执行，依赖数组决定 effect 是否跳过执行',
    answer: `依赖数组控制 effect 的执行时机：
1. 不传依赖数组：每次渲染完后都执行
2. 空数组 []：仅在组件挂载后执行一次，卸载时清理
3. [a, b]：仅在 a 或 b 变化后执行

常见坑：
- 依赖缺失：闭包旧值（stale closure）
- 对象/数组依赖：每次渲染都是新引用 → effect 被频繁触发 → 用 useMemo/useCallback 稳定引用
- React 18 StrictMode：挂载 effect 会被双调用，不要忽略 cleanup 函数`,
    tags: ['React', 'Hooks', '高频'],
  },
  {
    id: 'fe-4', category: 'frontend', difficulty: 'easy',
    title: '什么是跨域？如何解决？',
    question: '什么是浏览器同源策略和跨域？请列出至少 5 种常见的跨域解决方案。',
    hint: '同源 = 协议 + 域名 + 端口，三者全部一致',
    answer: `同源策略：浏览器禁止 JS 向不同源的地址发起 XHR/fetch 请求，目的是防止 CSRF。

解决方案：
1. CORS：服务端设置 Access-Control-Allow-Origin（最标准）
2. 反向代理：Nginx / Vite proxy / webpack-dev-server 转发
3. JSONP：只支持 GET，利用 <script> 标签无同源限制
4. postMessage：用于跨窗口/iframe 通信
5. WebSocket：不受同源策略限制
6. document.domain：仅适用于父子域名相同的场景
7. Chrome 插件 / 关闭浏览器安全开关（仅开发用）`,
    tags: ['网络', '浏览器安全'],
  },
  // ============ 后端 ============
  {
    id: 'be-1', category: 'backend', difficulty: 'medium',
    title: '进程和线程的区别？',
    question: '请对比进程与线程，并说明多进程和多线程各自的优缺点。',
    answer: `进程是「资源分配」的最小单位，线程是「CPU 调度」的最小单位。

| 对比项       | 进程                     | 线程                     |
|-------------|--------------------------|--------------------------|
| 资源开销     | 大，独立地址空间/文件句柄 | 小，共享进程资源         |
| 切换成本     | 高                       | 低                       |
| 通信成本     | 高（IPC/管道/共享内存）   | 低（直接读写同地址空间）  |
| 稳定性       | 互相独立，一个挂不影响它   | 一个线程崩可能带崩整个进程|
| 编程难度     | 简单                     | 复杂，需考虑同步/锁      |

选择参考：
- CPU 密集型、稳定性要求高 → 多进程
- I/O 密集型、通信频繁 → 多线程（或协程）`,
    tags: ['操作系统基础', '高频'],
  },
  {
    id: 'be-2', category: 'backend', difficulty: 'medium',
    title: 'HTTP vs HTTPS，HTTPS 握手流程？',
    question: '请说明 HTTP 和 HTTPS 的区别，并描述 TLS 1.2 握手的主要步骤。',
    answer: `区别：
- HTTP 明文传输，端口 80；HTTPS 加了 TLS/SSL 加密层，端口 443

TLS 1.2 握手（简化版）：
1. Client → Server：ClientHello（TLS版本、支持的加密套件、随机数R1）
2. Server → Client：ServerHello（选择的加密套件、随机数R2）+ 数字证书 + ServerHelloDone
3. Client 校验证书合法 → 生成 Pre-Master Secret → 用证书公钥加密发送给 Server
4. 双方用 R1 + R2 + Pre-Master 计算出对称会话密钥
5. Client 发 Finished（用会话密钥加密），Server 验证
6. Server 发 Finished（用会话密钥加密），Client 验证
7. ➡️ 握手完成，后续 HTTP 全部用对称密钥加密

TLS 1.3 已把 RTT 从 2 次降到 1 次甚至 0 次。`,
    tags: ['网络安全', 'HTTPS', 'TLS'],
  },
  // ============ 数据库 ============
  {
    id: 'db-1', category: 'database', difficulty: 'medium',
    title: 'MySQL 索引为什么用 B+ 树？',
    question: 'MySQL InnoDB 引擎的索引底层为什么选择 B+ 树，而不是 B 树、红黑树或哈希表？',
    answer: `选型考量：
1. ❌ 哈希表：等值查询 O(1)，但范围查询/排序全失效；而且哈希冲突
2. ❌ 红黑树 / AVL：二叉结构，树高 ~log2(N)，千万级数据树高 20+ 层 → 20 次磁盘 IO
3. ❌ B 树：每个节点都存数据，同样高度下能存的索引条目少；且叶子节点没有链表，范围查询要回溯
4. ✅ B+ 树：多路平衡树
   - 非叶子节点只存 key，同样 4KB 页能存更多 key → 树矮胖（一般 3-4 层就够）
   - 叶子节点包含所有数据，用链表串联 → 范围查询超顺滑
   - 所有查询都要走到叶子节点 → 查询路径长度稳定`,
    tags: ['MySQL', '索引', 'InnoDB', '高频'],
  },
  {
    id: 'db-2', category: 'database', difficulty: 'hard',
    title: '事务 ACID 与隔离级别',
    question: '请解释事务的 ACID 四大特性，并说明 SQL 标准的 4 个隔离级别分别解决了什么问题。',
    answer: `ACID：
A 原子性（Atomicity） ：事务要么全成功要么全回滚 → undo log
C 一致性（Consistency）：事务前后数据约束不被破坏 → 业务+AID共同保证
I 隔离性（Isolation） ：并发事务互不干扰 → MVCC + 锁
D 持久性（Durability）：已提交数据永不丢失 → redo log + doublewrite

4 个隔离级别：
| 隔离级别                 | 脏读 | 不可重复读 | 幻读 |
|--------------------------|-----|----------|-----|
| Read Uncommitted         | ❌  | ❌        | ❌  |
| Read Committed (多数DB默认) | ✅  | ❌        | ❌  |
| Repeatable Read (MySQL默认)  | ✅  | ✅        | ❌(一定程度解决) |
| Serializable             | ✅  | ✅        | ✅  |

MySQL RR 下通过「间隙锁 + Next-Key Lock」解决当前读的幻读。`,
    tags: ['事务', '隔离级别', 'MySQL'],
  },
  // ============ 网络 ============
  {
    id: 'net-1', category: 'network', difficulty: 'medium',
    title: 'TCP 三次握手和四次挥手',
    question: '请画图描述 TCP 三次握手建立连接和四次挥手关闭连接的过程，并说明为什么连接是三次而不是两次。',
    answer: `三次握手：
Client ──SYN(seq=x)────────────▶ Server
Client ◀──SYN+ACK(seq=y,ack=x+1)─ Server
Client ──ACK(ack=y+1)──────────▶ Server   （进入 ESTABLISHED）

为什么不是两次？
- 防止「已失效的连接请求报文段」突然到达 Server：
  Client 之前发过一个 SYN 卡住了，超时重传成功建立又关闭连接。
  此时老的 SYN 才到 Server，Server 以为是新请求，若只两次握手，Server 会一直等 Client 发数据 → 浪费资源
- 三次握手能确认双方的收发能力均正常：
  第 1 次：Server 知道 Client 能发
  第 2 次：Client 知道 Server 能收能发
  第 3 次：Server 知道 Client 能收

四次挥手：
Client ──FIN(seq=u)────────────▶ Server   (FIN_WAIT_1)
Client ◀──ACK(ack=u+1)────────── Server   (FIN_WAIT_2 / CLOSE_WAIT)
Client ◀──FIN(seq=w,ack=u+1)──── Server   (LAST_ACK)
Client ──ACK(ack=w+1)──────────▶ Server   (TIME_WAIT → 等 2MSL 才关)

TIME_WAIT 等 2MSL：
1. 保证最后一个 ACK 能被 Server 收到（丢了就重发）
2. 让本次连接所有迟到报文在网络中消亡，不污染下一个同四元组的连接`,
    tags: ['TCP', '高频', '计算机网络'],
  },
  // ============ 操作系统 ============
  {
    id: 'os-1', category: 'os', difficulty: 'medium',
    title: '死锁的四个必要条件与解决方法',
    question: '请说明产生死锁的四个必要条件，以及针对每个条件对应的破除策略。',
    answer: `四个必要条件（缺一不可）：
1. 互斥条件：资源任一时刻仅被一个进程占有
2. 占有并等待：进程已持有的资源不释放，同时等待新的资源
3. 不可抢占：已被占有的资源不能被强行剥夺
4. 循环等待：形成进程-资源的环

破除策略：
1. 打破互斥：对非必须互斥的资源允许共享（通常难做到）
2. 打破占有并等待：
   - 静态分配：进程一次性申请所有资源，不满足就不执行
   - 动态策略：申请新资源前必须先释放所有已持有资源
3. 打破不可抢占：允许 OS 强制剥夺（如虚拟化内存的换页）
4. 打破循环等待：
   - 资源有序编号：所有进程必须按编号递增顺序申请资源（最常用）

实际工程中还常用「银行家算法」在分配前预判安全性，避免进入死锁状态。`,
    tags: ['死锁', '进程同步', '操作系统'],
  },
  // ============ 行为面试 ============
  {
    id: 'bh-1', category: 'behavior', difficulty: 'easy',
    title: '自我介绍（3分钟版本结构）',
    question: '请给出一个技术岗 3 分钟自我介绍的标准结构和要点。',
    answer: `推荐 STAR 延伸结构，时间分配约 30 / 60 / 60 / 30 秒：

【第1段 30s】背景总览
"面试官你好，我叫 XX，XX 学校 XX 专业，有 X 年 XX 领域开发经验，目前在 XX 公司负责 XX 模块/团队。"

【第2段 60s】技术栈 + 核心能力
"主要技术栈是 XX（React/Node/Go/Java 等），擅长 XX 方向（性能优化/架构设计/业务建模），过去主导过 XX 类项目 N 个。"

【第3段 60s】最亮的 1-2 个项目（用 STAR）
"举个最有代表性的项目：我当时负责 XX 系统，遇到的困难是 XX（背景Situation + 任务Task），我做了 XX 动作（Action），最后带来 XX 量化结果：性能提升 50%/日活翻倍/NPS +20（Result）。"

【第4段 30s】为什么对这个岗位感兴趣
"关注贵司 XX 业务已久，这次岗位的 XX 方向正好和我的经验匹配，也希望在更大规模的业务场景里进一步打磨，谢谢。"

⚠️ 避坑：
- 不要像念简历一样从头到尾罗列
- 一定要有量化结果
- 不要说和岗位无关的兴趣爱好（除非对方问）`,
    tags: ['自我介绍', '通用'],
  },
  {
    id: 'bh-2', category: 'behavior', difficulty: 'medium',
    title: '说一个你最有成就感的项目',
    question: '请详细说明一个你最有成就感的项目，使用 STAR 原则组织回答。',
    answer: `STAR 答题框架模板：

S（Situation 背景）：
"当时的大背景是... 业务压力/技术债/团队情况..."
→ 让面试官理解项目的复杂度和难度

T（Task 任务 / 你的角色）：
"我在其中担任 XX 角色（主力/负责人），需要完成的目标是 XX"
→ 明确责任边界和目标

A（Action 动作：重点突出）：
"我的思考过程是... 权衡了 A/B/C 三个方案...
最终选择 XX 的原因是...
实施过程中踩了 XX 坑，用 XX 方式解决...
我还主动推动了 XX 跨团队协作..."
→ 这是体现你「思考力 + 执行力 + 沟通力」的核心部分！
一定 3 个点以上，尽量有技术细节

R（Result 结果）：
"最终上线后，指标从 XX 提升到 XX / 节省 N 人日 / 故障下降 XX%"
→ 必须量化！哪怕是近似值也比 "效果很好" 强 100 倍

后续延伸（加分项）：
"复盘后觉得还能改进的地方有 XX，现在团队正在做 XX..."
→ 体现反思能力`,
    tags: ['项目经历', 'STAR', '高频'],
  },
  // ============ 系统设计 ============
  {
    id: 'sd-1', category: 'system-design', difficulty: 'hard',
    title: '设计一个短链接服务',
    question: '请设计一个类似 is.gd / Bitly 的短链接服务，要求：\n1. 支持生成短链接（长→短）和 301/302 跳转（短→长）\n2. 日均 1 亿次写入，100 亿次读取\n3. 短码尽可能短，支持自定义短码',
    hint: '思考：短码生成算法、存储选型、读性能、容量预估、缓存策略、高可用',
    answer: `【容量预估（关键！设计第一步）】
QPS：
- 写入：1亿/日 ≈ 1157 QPS（峰值假设 3x = ~3500）
- 读取：100亿/日 ≈ 115740 QPS（峰值 ~35万）
存储：假设每个短链 1KB，保留 5 年 = 1826 亿字节 ≈ 170 TB

【整体架构】
Client → CDN / Nginx（SLB）→ API Gateway → 短链服务（无状态多副本）→ Redis 集群 → DB（MySQL 分库分表 / DynamoDB）

【核心模块】
1. 短码生成（两种策略）
   A. 自增 ID + Base62 编码：ID=123456 → Base62(123456) = "w7e"
      - 优点：永不重复，短码最短
      - 缺点：容易被遍历；高并发下 ID 生成器要解决（雪花算法/Ticket Server/号段模式）
   B. 哈希 + 冲突检测：长URL做 MD5/SHA 取前 N 位 → 存库前检查冲突（布隆过滤器先过滤）

2. 数据模型
   short_code (PK, 索引) | original_url | created_at | expires_at | click_count | custom_flag

3. 跳转 301 vs 302
   - 301（永久重定向）：浏览器缓存，后续请求不打服务端 ✅ 减轻压力
   - 302（临时重定向）：每次都打服务端，可准确统计点击次数
   - 推荐：有统计需求用 302 + CDN/多级缓存加速

4. 多级缓存
   - L1：CDN（全球节点挡绝大部分读）
   - L2：Redis 本地热点（LRU + TTL）
   - L3：DB 行缓存
   热 80% 流量打在 CDN，冷流量回源

5. 高可用
   - 服务无状态 → 水平扩容
   - Redis 主从 + 哨兵 / Cluster
   - DB 主从复制 + 读写分离 + 分库分表（按 short_code 哈希分片）

6. 自定义短码：独立表存 user_id → custom_code 映射，生成前先检查

7. 反滥用：频控（同一 IP/用户短时间内不能 N 次）、黑名单域名、输入长度限制`,
    tags: ['经典系统设计', '高频'],
  },
]

const DIFF_META: Record<Difficulty, { name: string; color: string }> = {
  easy:   { name: '简单', color: '#10b981' },
  medium: { name: '中等', color: '#f59e0b' },
  hard:   { name: '困难', color: '#ef4444' },
}

export default function TechInterviewPrep() {
  const [progress, setProgress] = useState<UserProgress>({
    solved: {}, bookmarks: [], streakDays: [],
    customQuestions: [], settings: { dailyGoal: 5 }
  })
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'unsolved' | 'correct' | 'wrong' | 'attempted' | 'bookmarked'>('all')
  const [search, setSearch] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [codeOutput, setCodeOutput] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'practice' | 'stats'>('practice')
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [newQ, setNewQ] = useState({ title: '', question: '', answer: '', category: 'algorithm' as Category, difficulty: 'easy' as Difficulty, tags: '' })

  // 加载持久化
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setProgress(JSON.parse(raw))
    } catch {}
  }, [])

  // 持久化
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)) } catch {}
  }, [progress])

  // 每日打卡（活跃则记录今日）
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    if (!progress.streakDays.includes(today)) {
      setProgress(p => ({ ...p, streakDays: [...p.streakDays, today], lastActive: today }))
    } else {
      setProgress(p => ({ ...p, lastActive: today }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const allQuestions = useMemo(() => [...DEFAULT_QUESTIONS, ...progress.customQuestions], [progress.customQuestions])

  const filteredQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      if (filterCategory !== 'all' && q.category !== filterCategory) return false
      if (filterDifficulty !== 'all' && q.difficulty !== filterDifficulty) return false
      const status = progress.solved[q.id]
      if (filterStatus === 'unsolved' && status) return false
      if (filterStatus === 'correct' && status !== 'correct') return false
      if (filterStatus === 'wrong' && status !== 'wrong') return false
      if (filterStatus === 'attempted' && !status) return false
      if (filterStatus === 'bookmarked' && !progress.bookmarks.includes(q.id)) return false
      if (search.trim()) {
        const s = search.toLowerCase()
        if (!q.title.toLowerCase().includes(s)
          && !q.question.toLowerCase().includes(s)
          && !q.tags.some(t => t.toLowerCase().includes(s))) return false
      }
      return true
    })
  }, [allQuestions, filterCategory, filterDifficulty, filterStatus, search, progress.solved, progress.bookmarks])

  const currentQuestion = filteredQuestions[currentIndex]

  const stats = useMemo(() => {
    const total = allQuestions.length
    const solved = Object.keys(progress.solved).length
    const correct = Object.values(progress.solved).filter(s => s === 'correct').length
    const rate = solved ? Math.round(correct / solved * 100) : 0
    // 计算连续打卡天数
    const today = new Date()
    let streak = 0
    for (let i = 0; i < 1000; i++) {
      const d = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10)
      if (progress.streakDays.includes(d)) streak++
      else if (i === 0) continue // 今天还没打卡允许跳过
      else break
    }
    // 今日完成数
    const todayStr = today.toISOString().slice(0, 10)
    const todayDone = progress.streakDays.includes(todayStr)
    const todaySolved = solved  // 简化显示总完成数
    return { total, solved, correct, wrong: solved - correct, rate, streak, todaySolved, todayDone }
  }, [allQuestions, progress.solved, progress.streakDays])

  const markStatus = (status: 'correct' | 'wrong' | 'attempted') => {
    if (!currentQuestion) return
    setProgress(p => ({ ...p, solved: { ...p.solved, [currentQuestion.id]: status } }))
    nextQuestion()
  }

  const nextQuestion = () => {
    setShowAnswer(false); setShowHint(false)
    if (currentIndex < filteredQuestions.length - 1) setCurrentIndex(currentIndex + 1)
  }
  const prevQuestion = () => {
    setShowAnswer(false); setShowHint(false)
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }
  const randomQuestion = () => {
    setShowAnswer(false); setShowHint(false)
    const n = filteredQuestions.length
    if (n > 0) setCurrentIndex(Math.floor(Math.random() * n))
  }
  const toggleBookmark = () => {
    if (!currentQuestion) return
    setProgress(p => ({
      ...p,
      bookmarks: p.bookmarks.includes(currentQuestion.id)
        ? p.bookmarks.filter(id => id !== currentQuestion.id)
        : [...p.bookmarks, currentQuestion.id]
    }))
  }
  const resetProgress = () => {
    if (confirm('确定要清空所有答题进度和收藏吗？（自定义题目将保留）')) {
      setProgress(p => ({ ...p, solved: {}, bookmarks: [] }))
    }
  }
  const runCode = useCallback(() => {
    if (!currentQuestion?.codeExample) return
    setRunning(true)
    setCodeOutput(['▶ 正在执行...'])
    const code = currentQuestion.codeExample!.code
    const logs: string[] = []
    // 沙盒内执行
    try {
      const sandboxConsole = {
        log: (...args: unknown[]) => logs.push(args.map(a => {
          try { return typeof a === 'string' ? a : JSON.stringify(a, null, 0) } catch { return String(a) }
        }).join(' ')),
        error: (...args: unknown[]) => logs.push('❌ ' + args.map(String).join(' ')),
        warn: (...args: unknown[]) => logs.push('⚠️ ' + args.map(String).join(' ')),
      }
      const fn = new Function('console', `"use strict";\n${code}\n`)
      const t0 = performance.now()
      fn(sandboxConsole)
      const t1 = performance.now()
      logs.unshift(`✓ 执行完成，耗时 ${(t1 - t0).toFixed(1)}ms`)
    } catch (err) {
      logs.push('💥 运行错误: ' + (err instanceof Error ? err.message : String(err)))
    }
    setTimeout(() => { setCodeOutput(logs); setRunning(false) }, 120)
  }, [currentQuestion])

  const addCustomQuestion = () => {
    if (!newQ.title.trim() || !newQ.question.trim() || !newQ.answer.trim()) {
      alert('请至少填写题目、问题描述和参考答案')
      return
    }
    const q: InterviewQuestion = {
      id: 'custom-' + Date.now(), category: newQ.category, difficulty: newQ.difficulty,
      title: newQ.title, question: newQ.question, answer: newQ.answer,
      tags: newQ.tags.split(/[,，\s]+/).filter(Boolean),
    }
    setProgress(p => ({ ...p, customQuestions: [q, ...p.customQuestions] }))
    setNewQ({ title: '', question: '', answer: '', category: 'algorithm', difficulty: 'easy', tags: '' })
    setShowAddQuestion(false)
    alert('✅ 已添加到题库，可在「全部题目」或「全部+我的上传」筛选里看到')
  }

  const deleteCustom = (id: string) => {
    if (confirm('确定删除该自定义题目？')) {
      setProgress(p => ({
        ...p,
        customQuestions: p.customQuestions.filter(q => q.id !== id),
        solved: Object.fromEntries(Object.entries(p.solved).filter(([k]) => k !== id)),
        bookmarks: p.bookmarks.filter(b => b !== id)
      }))
    }
  }

  // ======== 渲染 ========
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'inherit', fontFamily: 'inherit' }}>
      {/* 顶部导航 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
        borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
        background: 'var(--panel-bg, rgba(255,255,255,0.02))', flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
          <BookOpen size={20} style={{ color: '#8b5cf6' }} />
          <div style={{ fontWeight: 700, fontSize: 15 }}>TechInterviewPrep · 技术面试刷题助手</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, marginLeft: 10,
            padding: '3px 10px', borderRadius: 999,
            background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', fontSize: 12, fontWeight: 600
          }}>
            <Flame size={14} /> 连续 {stats.streak} 天
          </div>
        </div>
        {(['practice', 'list', 'stats'] as const).map(m => (
          <button key={m} onClick={() => setViewMode(m)} style={{
            padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
            background: viewMode === m ? 'var(--accent, #7c3aed)' : 'var(--button-bg, rgba(127,127,127,0.12))',
            color: viewMode === m ? '#fff' : 'inherit',
            border: '1px solid var(--border, rgba(255,255,255,0.08))',
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
          }}>
            {m === 'practice' && <Target size={14}/>}
            {m === 'list' && <Filter size={14}/>}
            {m === 'stats' && <BarChart3 size={14}/>}
            {m === 'practice' ? '刷题模式' : m === 'list' ? '题库浏览' : '学习统计'}
          </button>
        ))}
        <button onClick={() => setShowAddQuestion(true)} style={btn('#10b981')}>
          <PlusCircle size={14}/> 新建题目
        </button>
        <button onClick={resetProgress} style={btn('#6b7280')}>
          <RefreshCw size={14}/> 重置进度
        </button>
      </div>

      {viewMode === 'stats' && (
        <StatsView stats={stats} allQuestions={allQuestions} progress={progress} />
      )}

      {viewMode === 'list' && (
        <ListView
          questions={filteredQuestions}
          onSelect={(q) => { setViewMode('practice'); setCurrentIndex(filteredQuestions.indexOf(q)); setShowAnswer(false); setShowHint(false) }}
          solved={progress.solved}
          bookmarks={progress.bookmarks}
          customIds={progress.customQuestions.map(q => q.id)}
          onDeleteCustom={deleteCustom}
        />
      )}

      {viewMode === 'practice' && (
        <>
          {/* 筛选栏 */}
          <div style={{
            display: 'flex', gap: 8, padding: 10, flexWrap: 'wrap',
            borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
            background: 'rgba(0,0,0,0.15)', alignItems: 'center'
          }}>
            <div style={{ position: 'relative', flex: '0 1 280px' }}>
              <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setCurrentIndex(0) }}
                placeholder="搜索题目标题/标签..."
                style={{
                  width: '100%', padding: '7px 10px 7px 30px', fontSize: 12,
                  borderRadius: 6, border: '1px solid var(--border, rgba(255,255,255,0.1))',
                  background: 'rgba(0,0,0,0.3)', color: 'inherit', fontFamily: 'inherit'
                }} />
            </div>
            <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value as Category | 'all'); setCurrentIndex(0) }} style={selectS()}>
              <option value="all">全部分类</option>
              {Object.entries(CATEGORY_META).map(([k, v]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
            <select value={filterDifficulty} onChange={e => { setFilterDifficulty(e.target.value as Difficulty | 'all'); setCurrentIndex(0) }} style={selectS()}>
              <option value="all">全部难度</option>
              {Object.entries(DIFF_META).map(([k, v]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as typeof filterStatus); setCurrentIndex(0) }} style={selectS()}>
              <option value="all">全部状态</option>
              <option value="unsolved">🆕 未刷</option>
              <option value="correct">✅ 答对</option>
              <option value="wrong">❌ 答错</option>
              <option value="attempted">📝 尝试过</option>
              <option value="bookmarked">⭐ 收藏</option>
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, opacity: 0.8 }}>
              <CheckCircle2 size={13} style={{ color: '#10b981' }} /> {stats.correct}/{allQuestions.length}
              <span>正确</span>
              <span>·</span>
              <span>{stats.rate}%</span>
              <span>正确率</span>
              <span>·</span>
              <span style={{ fontWeight: 600 }}>第 {Math.min(currentIndex + 1, filteredQuestions.length)} / {filteredQuestions.length}</span>
            </div>
          </div>

          {/* 主体 */}
          {currentQuestion ? (
            <div style={{
              flex: 1, display: 'flex', overflow: 'hidden'
            }}>
              {/* 左侧题目 */}
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                borderRight: '1px solid var(--border, rgba(255,255,255,0.08))'
              }}>
                <div style={{
                  padding: 14, borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
                  display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                  background: 'var(--panel-bg, rgba(255,255,255,0.02))'
                }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
                    borderRadius: 999, fontSize: 12, fontWeight: 500,
                    background: CATEGORY_META[currentQuestion.category].color + '22',
                    color: CATEGORY_META[currentQuestion.category].color
                  }}>
                    {CATEGORY_META[currentQuestion.category].icon} {CATEGORY_META[currentQuestion.category].name}
                  </span>
                  <span style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    background: DIFF_META[currentQuestion.difficulty].color + '22',
                    color: DIFF_META[currentQuestion.difficulty].color
                  }}>
                    {DIFF_META[currentQuestion.difficulty].name}
                  </span>
                  {progress.solved[currentQuestion.id] === 'correct' && (
                    <span style={{ color: '#10b981', fontSize: 12 }}><CheckCircle2 size={14} style={{ display: 'inline' }} /> 答对</span>
                  )}
                  {progress.solved[currentQuestion.id] === 'wrong' && (
                    <span style={{ color: '#ef4444', fontSize: 12 }}><XCircle size={14} style={{ display: 'inline' }} /> 答错</span>
                  )}
                  {progress.bookmarks.includes(currentQuestion.id) && (
                    <span style={{ color: '#f59e0b', fontSize: 12 }}><Star size={14} fill="currentColor" /> 已收藏</span>
                  )}
                  <span style={{ marginLeft: 'auto', fontWeight: 600, fontSize: 14 }}>{currentQuestion.title}</span>
                  {currentQuestion.source && (
                    <span style={{ fontSize: 11, opacity: 0.6 }}>{currentQuestion.source}</span>
                  )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
                  <div style={{
                    whiteSpace: 'pre-wrap', lineHeight: 1.75, fontSize: 14,
                    marginBottom: 14, padding: 14, borderRadius: 10,
                    background: 'rgba(124, 58, 237, 0.08)',
                    border: '1px solid rgba(124, 58, 237, 0.2)'
                  }}>
                    <Clock size={13} style={{ display: 'inline-block', marginRight: 6, opacity: 0.7 }} />
                    <strong>题目：</strong>{currentQuestion.question}
                  </div>

                  {currentQuestion.tags.length > 0 && (
                    <div style={{ marginBottom: 14, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {currentQuestion.tags.map(t => (
                        <span key={t} style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 11,
                          background: 'rgba(127,127,127,0.12)', opacity: 0.85
                        }}>#{t}</span>
                      ))}
                    </div>
                  )}

                  {showHint && currentQuestion.hint && (
                    <div style={{
                      padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 14,
                      background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#fbbf24', whiteSpace: 'pre-wrap', lineHeight: 1.6
                    }}>
                      <Lightbulb size={14} style={{ display: 'inline-block', marginRight: 6 }} />
                      <strong>提示：</strong>{currentQuestion.hint}
                    </div>
                  )}

                  {showAnswer && (
                    <div style={{
                      padding: 16, borderRadius: 10,
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      whiteSpace: 'pre-wrap', lineHeight: 1.75, fontSize: 13.5
                    }}>
                      <Trophy size={14} style={{ display: 'inline-block', marginRight: 6, color: '#10b981' }} />
                      <strong>参考答案：</strong>
                      <div style={{ marginTop: 10 }}>{currentQuestion.answer}</div>
                    </div>
                  )}

                  {!showAnswer && !showHint && (
                    <div style={{ opacity: 0.45, fontSize: 12, textAlign: 'center', padding: 20 }}>
                      💡 先尝试自己作答，点击下方按钮查看提示或参考答案
                    </div>
                  )}
                </div>

                {/* 底部操作栏 */}
                <div style={{
                  padding: 12, borderTop: '1px solid var(--border, rgba(255,255,255,0.08))',
                  display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'
                }}>
                  <button onClick={prevQuestion} disabled={currentIndex === 0} style={btn(undefined, currentIndex === 0)}>
                    <ChevronLeft size={16}/> 上一题
                  </button>
                  <button onClick={nextQuestion} disabled={currentIndex >= filteredQuestions.length - 1} style={btn(undefined, currentIndex >= filteredQuestions.length - 1)}>
                    下一题 <ChevronRight size={16}/>
                  </button>
                  <button onClick={randomQuestion} style={btn()}>
                    <Shuffle size={14}/> 随机
                  </button>
                  <button onClick={() => setShowHint(s => !s)} style={btn('#f59e0b')}>
                    <Lightbulb size={14}/> {showHint ? '隐藏提示' : '看提示'}
                  </button>
                  <button onClick={() => setShowAnswer(s => !s)} style={btn('#8b5cf6')}>
                    {showAnswer ? '隐藏答案' : '看答案'}
                  </button>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button onClick={toggleBookmark} style={btn(progress.bookmarks.includes(currentQuestion.id) ? '#f59e0b' : undefined)}>
                      <Star size={14} fill={progress.bookmarks.includes(currentQuestion.id) ? 'currentColor' : 'none'} />
                      {progress.bookmarks.includes(currentQuestion.id) ? '取消收藏' : '收藏'}
                    </button>
                    <button onClick={() => markStatus('wrong')} style={btn('#ef4444')}>
                      <XCircle size={14}/> 标记答错
                    </button>
                    <button onClick={() => markStatus('correct')} style={btn('#10b981')}>
                      <CheckCircle2 size={14}/> 标记答对
                    </button>
                  </div>
                </div>
              </div>

              {/* 右侧：代码执行面板 */}
              <div style={{ width: 440, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                  padding: '10px 14px', borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
                  fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--panel-bg, rgba(255,255,255,0.02))'
                }}>
                  <Code size={15}/> 代码沙盒
                  {currentQuestion.codeExample && (
                    <span style={{
                      marginLeft: 'auto', fontSize: 11, opacity: 0.7,
                      padding: '2px 8px', borderRadius: 4,
                      background: 'rgba(16,185,129,0.12)', color: '#34d399'
                    }}>有示例代码 ✓</span>
                  )}
                </div>
                <div style={{
                  margin: 12, flex: '0 0 auto', borderRadius: 8, overflow: 'hidden',
                  border: '1px solid var(--border, rgba(255,255,255,0.08))'
                }}>
                  <div style={{
                    padding: '6px 10px', fontSize: 11, opacity: 0.7,
                    background: 'rgba(0,0,0,0.3)',
                    borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    <AlertCircle size={12}/> 输入你的答案代码（或直接运行示例）
                  </div>
                  <pre style={{
                    margin: 0, padding: 12, fontSize: 12,
                    overflow: 'auto', maxHeight: 220,
                    background: '#0d1117', color: '#e5e7eb',
                    fontFamily: 'JetBrains Mono, Consolas, monospace',
                    lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                  }}>{currentQuestion.codeExample?.code || `// 该题目暂无示例代码\n// 可在浏览器 DevTools 的 WebLinuxOS API 中调用代码执行：\n// window.WebLinuxOS.openApp('code-runner-advanced')\nconsole.log('欢迎来到 TechInterviewPrep，祝你面试顺利！')`}</pre>
                </div>
                <div style={{ padding: '0 12px', display: 'flex', gap: 8 }}>
                  <button onClick={runCode} disabled={running} style={btn('#0ea5e9', false)}>
                    {running ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14}/>}
                    {running ? '执行中...' : '运行 (沙盒)'}
                  </button>
                </div>
                <div style={{
                  margin: 12, flex: 1, minHeight: 80,
                  borderRadius: 8, overflow: 'hidden',
                  border: '1px solid var(--border, rgba(255,255,255,0.08))'
                }}>
                  <div style={{
                    padding: '6px 10px', fontSize: 11, opacity: 0.7,
                    background: 'rgba(0,0,0,0.3)',
                    borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    <Code size={12}/> 执行输出
                  </div>
                  <pre style={{
                    margin: 0, padding: 10, fontSize: 12,
                    overflow: 'auto', maxHeight: '100%',
                    background: 'rgba(0,0,0,0.2)', color: '#a7f3d0',
                    fontFamily: 'JetBrains Mono, Consolas, monospace',
                    lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                  }}>{codeOutput.join('\n') || '（点击上方「运行」按钮查看执行结果）'}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 16, opacity: 0.6, padding: 40, textAlign: 'center'
            }}>
              <Filter size={40} />
              <div>当前筛选条件下没有题目</div>
              <button onClick={() => { setFilterCategory('all'); setFilterDifficulty('all'); setFilterStatus('all'); setSearch('') }} style={btn('#7c3aed')}>
                清空所有筛选
              </button>
            </div>
          )}
        </>
      )}

      {/* 新增题目弹窗 */}
      {showAddQuestion && (
        <Modal onClose={() => setShowAddQuestion(false)} title="新建自定义题目">
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <label style={lbl()}>
                分类
                <select value={newQ.category} onChange={e => setNewQ({ ...newQ, category: e.target.value as Category })} style={inputStyle()}>
                  {Object.entries(CATEGORY_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.name}</option>
                  ))}
                </select>
              </label>
              <label style={lbl()}>
                难度
                <select value={newQ.difficulty} onChange={e => setNewQ({ ...newQ, difficulty: e.target.value as Difficulty })} style={inputStyle()}>
                  {Object.entries(DIFF_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.name}</option>
                  ))}
                </select>
              </label>
              <label style={lbl()}>
                标签 (用逗号分隔)
                <input value={newQ.tags} onChange={e => setNewQ({ ...newQ, tags: e.target.value })} placeholder="前端, React, 高频" style={inputStyle()} />
              </label>
            </div>
            <label style={lbl()}>
              标题（题目名称）
              <input value={newQ.title} onChange={e => setNewQ({ ...newQ, title: e.target.value })} placeholder="例：useEffect 依赖数组的作用" style={inputStyle()} />
            </label>
            <label style={lbl()}>
              问题描述
              <textarea value={newQ.question} onChange={e => setNewQ({ ...newQ, question: e.target.value })} rows={4}
                placeholder="详细描述题目，可以包含代码示例或输入输出要求"
                style={inputStyle(true)} />
            </label>
            <label style={lbl()}>
              参考答案 (支持换行和 Markdown 风格的排版)
              <textarea value={newQ.answer} onChange={e => setNewQ({ ...newQ, answer: e.target.value })} rows={6}
                placeholder="详细参考答案，方便日后复习"
                style={inputStyle(true)} />
            </label>
          </div>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setShowAddQuestion(false)} style={btn()}>取消</button>
            <button onClick={addCustomQuestion} style={btn('#10b981')}><PlusCircle size={14}/> 添加到题库</button>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button:hover:enabled { filter: brightness(1.15); }
        button:disabled { opacity: 0.4; cursor: not-allowed; }
        table { border-collapse: collapse; }
        td, th { padding: 6px 10px; border: 1px solid rgba(127,127,127,0.2); }
      `}</style>
    </div>
  )
}

function btn(color?: string, disabled = false): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
    background: color ?? 'var(--button-bg, rgba(127,127,127,0.14))',
    color: disabled ? '#999' : 'inherit',
    border: '1px solid var(--border, rgba(255,255,255,0.08))',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s', fontFamily: 'inherit'
  }
}
function selectS(): React.CSSProperties {
  return {
    padding: '6px 10px', fontSize: 12, borderRadius: 6,
    background: 'rgba(0,0,0,0.3)', color: 'inherit',
    border: '1px solid var(--border, rgba(255,255,255,0.1))', fontFamily: 'inherit'
  }
}
function inputStyle(textarea = false): React.CSSProperties {
  return {
    padding: '8px 10px', borderRadius: 6, fontSize: 13,
    background: 'rgba(0,0,0,0.3)', color: 'inherit',
    border: '1px solid var(--border, rgba(255,255,255,0.1))',
    fontFamily: 'inherit', resize: textarea ? 'vertical' : undefined,
    minHeight: textarea ? 80 : undefined
  }
}
function lbl(): React.CSSProperties {
  return { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 500 }
}

// 列表视图
function ListView({ questions, onSelect, solved, bookmarks, customIds, onDeleteCustom }: {
  questions: InterviewQuestion[]
  onSelect: (q: InterviewQuestion) => void
  solved: Record<string, 'correct' | 'wrong' | 'attempted'>
  bookmarks: string[]
  customIds: string[]
  onDeleteCustom: (id: string) => void
}) {
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
      {questions.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, opacity: 0.6 }}>
          <Filter size={36}/>
          <div style={{ marginTop: 10 }}>未找到符合条件的题目</div>
        </div>
      )}
      <div style={{ display: 'grid', gap: 8 }}>
        {questions.map((q, i) => {
          const isCust = customIds.includes(q.id)
          return (
            <div key={q.id} onClick={() => onSelect(q)}
              style={{
                padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 10,
                alignItems: 'center',
                background: 'rgba(127,127,127,0.05)',
                border: '1px solid var(--border, rgba(255,255,255,0.06))',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(127,127,127,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(127,127,127,0.05)'}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, opacity: 0.6
              }}>{i + 1}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{q.title}</span>
                  <span style={{
                    padding: '1px 7px', borderRadius: 999, fontSize: 10.5,
                    background: CATEGORY_META[q.category].color + '22',
                    color: CATEGORY_META[q.category].color
                  }}>{CATEGORY_META[q.category].name}</span>
                  <span style={{
                    padding: '1px 7px', borderRadius: 999, fontSize: 10.5,
                    background: DIFF_META[q.difficulty].color + '22',
                    color: DIFF_META[q.difficulty].color
                  }}>{DIFF_META[q.difficulty].name}</span>
                  {isCust && <span style={{ fontSize: 10.5, padding: '1px 7px', borderRadius: 999, background: 'rgba(236,72,153,0.15)', color: '#f472b6' }}>我的</span>}
                  {bookmarks.includes(q.id) && <Star size={12} fill="#fbbf24" style={{ color: '#fbbf24' }} />}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {q.question.split('\n')[0]}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {solved[q.id] === 'correct' && <CheckCircle2 size={16} style={{ color: '#10b981' }} />}
                {solved[q.id] === 'wrong' && <XCircle size={16} style={{ color: '#ef4444' }} />}
                {solved[q.id] === 'attempted' && <Bookmark size={14} style={{ color: '#8b5cf6' }} />}
                {isCust && (
                  <button onClick={(e) => { e.stopPropagation(); onDeleteCustom(q.id) }}
                    style={{
                      width: 26, height: 26, borderRadius: 4,
                      border: '1px solid rgba(220,38,38,0.3)',
                      background: 'rgba(220,38,38,0.1)', color: '#f87171',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}><Trash2 size={13}/></button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 统计视图
function StatsView({ stats, allQuestions, progress }: {
  stats: { total: number; solved: number; correct: number; wrong: number; rate: number; streak: number; todaySolved: number; todayDone: boolean }
  allQuestions: InterviewQuestion[]
  progress: UserProgress
}) {
  const byCategory = Object.fromEntries(
    Object.keys(CATEGORY_META).map(k => [k, { total: 0, solved: 0, correct: 0 }])
  ) as Record<string, { total: number; solved: number; correct: number }>
  allQuestions.forEach(q => {
    byCategory[q.category].total++
    if (progress.solved[q.id]) {
      byCategory[q.category].solved++
      if (progress.solved[q.id] === 'correct') byCategory[q.category].correct++
    }
  })
  const pct = (a: number, b: number) => b ? Math.round(a / b * 100) : 0
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: '累计刷题', value: stats.solved, sub: `/${stats.total}`, color: '#8b5cf6', icon: <Target size={18}/> },
          { label: '答对题数', value: stats.correct, sub: `正确率 ${stats.rate}%`, color: '#10b981', icon: <CheckCircle2 size={18}/> },
          { label: '连续打卡', value: stats.streak, sub: '天 🔥', color: '#f59e0b', icon: <Flame size={18}/> },
          { label: '我的收藏', value: progress.bookmarks.length, sub: '道重点题', color: '#ec4899', icon: <Star size={18}/> },
        ].map(k => (
          <div key={k.label} style={{
            padding: 16, borderRadius: 10,
            background: `linear-gradient(135deg, ${k.color}22 0%, transparent 70%)`,
            border: '1px solid var(--border, rgba(255,255,255,0.08))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.85, fontSize: 12, color: k.color, marginBottom: 8 }}>
              {k.icon} {k.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>{k.value}<span style={{ fontSize: 14, opacity: 0.55, fontWeight: 500, marginLeft: 6 }}>{k.sub}</span></div>
          </div>
        ))}
      </div>

      {/* 总进度 */}
      <div style={{
        padding: 18, borderRadius: 12,
        background: 'var(--panel-bg, rgba(255,255,255,0.02))',
        border: '1px solid var(--border, rgba(255,255,255,0.08))', marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>总完成进度</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>{stats.solved}/{stats.total} = {pct(stats.solved, stats.total)}%</div>
        </div>
        <div style={{
          width: '100%', height: 14, borderRadius: 999, overflow: 'hidden',
          background: 'rgba(127,127,127,0.12)'
        }}>
          <div style={{
            height: '100%',
            width: `${pct(stats.solved, stats.total)}%`,
            background: 'linear-gradient(90deg, #8b5cf6, #06b6d4, #10b981)',
            transition: 'width 0.3s'
          }}/>
        </div>
      </div>

      {/* 分类维度 */}
      <div style={{
        padding: 18, borderRadius: 12,
        background: 'var(--panel-bg, rgba(255,255,255,0.02))',
        border: '1px solid var(--border, rgba(255,255,255,0.08))'
      }}>
        <div style={{ fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart3 size={16}/> 各分类刷题情况
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {Object.entries(CATEGORY_META).map(([k, v]) => {
            const s = byCategory[k]
            const p = pct(s.solved, s.total)
            return (
              <div key={k}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: v.color }}>{v.icon}</span>
                  <span style={{ fontSize: 13, width: 120 }}>{v.name}</span>
                  <div style={{ flex: 1, height: 10, background: 'rgba(127,127,127,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      width: `${p}%`, height: '100%',
                      background: v.color, transition: 'width 0.3s'
                    }}/>
                  </div>
                  <span style={{ fontSize: 11, opacity: 0.7, width: 110, textAlign: 'right' }}>
                    {s.solved}/{s.total} ({p}%) · ✅{s.correct}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// 简易Modal
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  const bgRef = useRef<HTMLDivElement>(null)
  return (
    <div ref={bgRef}
      onClick={(e) => e.target === bgRef.current && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
      }}>
      <div style={{
        width: '100%', maxWidth: 720, maxHeight: '90vh', overflow: 'auto',
        padding: 20, borderRadius: 12,
        background: 'var(--modal-bg, #1a1a2e)', color: 'inherit',
        border: '1px solid var(--border, rgba(255,255,255,0.1))',
        boxShadow: '0 20px 80px rgba(0,0,0,0.6)'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', marginBottom: 16,
          fontWeight: 700, fontSize: 16, paddingBottom: 12,
          borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))'
        }}>
          {title}
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'inherit', opacity: 0.6 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
