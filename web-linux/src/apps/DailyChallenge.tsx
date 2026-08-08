import { useState, useEffect, useCallback } from 'react'
import { Clock, Trophy, Lightbulb, ChevronRight, RotateCcw, Sparkles, Target, Zap, Award, BarChart3, Code2 } from 'lucide-react'

interface Challenge {
  id: number
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  category: string
  description: string
  examples: string[]
  constraints: string
  hint: string
  solution: string
}

const challenges: Challenge[] = [
  { id: 1, title: '反转字符串', difficulty: 'Easy', category: '字符串', description: '编写一个函数，将输入的字符串反转。你不能使用 JavaScript 的 reverse() 方法。', examples: ['输入: "hello" → 输出: "olleh"', '输入: "world" → 输出: "dlrow"'], constraints: '输入：一个字符串。输出：反转后的字符串。', hint: '尝试使用 for 循环从后向前遍历字符串。', solution: `function reverseString(str) {
  let result = '';
  for (let i = str.length - 1; i >= 0; i--) {
    result += str[i];
  }
  return result;
}` },
  { id: 2, title: '数组求和', difficulty: 'Easy', category: '数组', description: '编写一个函数，计算数组中所有数字的和。', examples: ['输入: [1, 2, 3, 4, 5] → 输出: 15', '输入: [10, -5, 3] → 输出: 8'], constraints: '输入：一个数字数组。输出：所有元素的和。', hint: '使用 reduce 方法或 for 循环累加。', solution: `function sumArray(arr) {
  return arr.reduce((sum, num) => sum + num, 0);
}` },
  { id: 3, title: '回文数判断', difficulty: 'Easy', category: '数字', description: '判断一个整数是否是回文数。回文数正着读和反着读一样。', examples: ['输入: 121 → 输出: true', '输入: -121 → 输出: false', '输入: 10 → 输出: false'], constraints: '不要将整数转换为字符串。', hint: '可以反转一半的数字进行比较。', solution: `function isPalindrome(x) {
  if (x < 0) return false;
  let original = x, reversed = 0;
  while (x > 0) {
    reversed = reversed * 10 + x % 10;
    x = Math.floor(x / 10);
  }
  return original === reversed;
}` },
  { id: 4, title: '两数之和', difficulty: 'Medium', category: '数组', description: '给定一个整数数组和一个目标值，找出数组中和为目标值的两个整数的索引。你可以假设每种输入只会对应一个答案。', examples: ['输入: nums = [2,7,11,15], target = 9 → 输出: [0,1]', '输入: nums = [3,2,4], target = 6 → 输出: [1,2]'], constraints: '时间复杂度尽量为 O(n)。', hint: '使用哈希表存储已遍历的数字及其索引。', solution: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}` },
  { id: 5, title: '无重复字符的最长子串', difficulty: 'Medium', category: '字符串', description: '给定一个字符串，找出不含重复字符的最长子串的长度。', examples: ['输入: "abcabcbb" → 输出: 3 (子串 "abc")', '输入: "bbbbb" → 输出: 1', '输入: "pwwkew" → 输出: 3 (子串 "wke")'], constraints: '字符串由英文字母、数字、符号和空格组成。', hint: '使用滑动窗口和字符索引映射。', solution: `function lengthOfLongestSubstring(s) {
  const map = new Map();
  let maxLen = 0, start = 0;
  for (let end = 0; end < s.length; end++) {
    if (map.has(s[end]) && map.get(s[end]) >= start) {
      start = map.get(s[end]) + 1;
    }
    map.set(s[end], end);
    maxLen = Math.max(maxLen, end - start + 1);
  }
  return maxLen;
}` },
  { id: 6, title: '合并两个有序链表', difficulty: 'Medium', category: '链表', description: '将两个升序排列的链表合并为一个新的升序链表。', examples: ['输入: 1->2->4, 1->3->4 → 输出: 1->1->2->3->4->4'], constraints: '链表节点定义：{ val, next }。', hint: '使用两个指针分别遍历两个链表，每次取较小的节点。', solution: `function mergeTwoLists(l1, l2) {
  const dummy = { val: 0, next: null };
  let current = dummy;
  while (l1 && l2) {
    if (l1.val <= l2.val) {
      current.next = l1; l1 = l1.next;
    } else {
      current.next = l2; l2 = l2.next;
    }
    current = current.next;
  }
  current.next = l1 || l2;
  return dummy.next;
}` },
  { id: 7, title: '接雨水', difficulty: 'Hard', category: '数组', description: '给定 n 个非负整数表示每个宽度为 1 的柱子的高度图，计算按此排列的柱子，下雨之后能接多少雨水。', examples: ['输入: [0,1,0,2,1,0,1,3,2,1,2,1] → 输出: 6'], constraints: '时间复杂度 O(n)，空间复杂度 O(1)。', hint: '使用双指针法，从两端向中间遍历。', solution: `function trap(height) {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0, water = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) leftMax = height[left];
      else water += leftMax - height[left];
      left++;
    } else {
      if (height[right] >= rightMax) rightMax = height[right];
      else water += rightMax - height[right];
      right--;
    }
  }
  return water;
}` },
  { id: 8, title: '最长有效括号', difficulty: 'Hard', category: '字符串', description: '给定一个只包含 "(" 和 ")" 的字符串，找出最长有效括号子串的长度。', examples: ['输入: "(()" → 输出: 2', '输入: ")()())" → 输出: 4', '输入: "" → 输出: 0'], constraints: '字符串长度不超过 10^4。', hint: '可以使用栈或动态规划。', solution: `function longestValidParentheses(s) {
  const stack = [-1];
  let maxLen = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') {
      stack.push(i);
    } else {
      stack.pop();
      if (stack.length === 0) {
        stack.push(i);
      } else {
        maxLen = Math.max(maxLen, i - stack[stack.length - 1]);
      }
    }
  }
  return maxLen;
}` },
  { id: 9, title: '跳跃游戏', difficulty: 'Medium', category: '数组', description: '给定一个非负整数数组，你最初位于数组的第一个位置。数组中的每个元素代表你在该位置可以跳跃的最大长度。判断你是否能够到达最后一个位置。', examples: ['输入: [2,3,1,1,4] → 输出: true', '输入: [3,2,1,0,4] → 输出: false'], constraints: '使用最少的跳跃次数。', hint: '贪心算法：维护当前能到达的最远位置。', solution: `function canJump(nums) {
  let maxReach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false;
    maxReach = Math.max(maxReach, i + nums[i]);
  }
  return true;
}` },
  { id: 10, title: '最大子数组和', difficulty: 'Medium', category: '动态规划', description: '给定一个整数数组，找到一个具有最大和的连续子数组，返回其最大和。', examples: ['输入: [-2,1,-3,4,-1,2,1,-5,4] → 输出: 6 (子数组 [4,-1,2,1])'], constraints: '时间复杂度 O(n)。', hint: 'Kadane 算法：维护以每个元素结尾的最大和。', solution: `function maxSubArray(nums) {
  let maxSum = nums[0], currentSum = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}` },
  { id: 11, title: '合并区间', difficulty: 'Medium', category: '数组', description: '以数组 intervals 表示若干个区间的集合，合并所有重叠的区间。', examples: ['输入: [[1,3],[2,6],[8,10],[15,18]] → 输出: [[1,6],[8,10],[15,18]]'], constraints: '先按起始位置排序。', hint: '排序后依次检查相邻区间是否重叠。', solution: `function merge(intervals) {
  if (intervals.length <= 1) return intervals;
  intervals.sort((a, b) => a[0] - b[0]);
  const result = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const last = result[result.length - 1];
    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      result.push(current);
    }
  }
  return result;
}` },
  { id: 12, title: 'N皇后', difficulty: 'Hard', category: '回溯', description: '将 n 个皇后放置在 n×n 的棋盘上，使她们彼此不能相互攻击。给你返回所有不同的 n 皇后问题的解决方案数量。', examples: ['输入: 4 → 输出: 2', '输入: 1 → 输出: 1'], constraints: '1 ≤ n ≤ 9。', hint: '使用回溯法，逐行放置皇后。', solution: `function totalNQueens(n) {
  let count = 0;
  const board = new Array(n).fill(0);
  function backtrack(row) {
    if (row === n) { count++; return; }
    for (let col = 0; col < n; col++) {
      if (isValid(board, row, col)) {
        board[row] = col;
        backtrack(row + 1);
      }
    }
  }
  function isValid(board, row, col) {
    for (let i = 0; i < row; i++) {
      if (board[i] === col || Math.abs(board[i] - col) === row - i) return false;
    }
    return true;
  }
  backtrack(0);
  return count;
}` },
]

const STORAGE_KEY_PROGRESS = 'weblinux-challenge-progress'
const STORAGE_KEY_STATS = 'weblinux-challenge-stats'

export default function DailyChallenge() {
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | '全部'>('全部')
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [completed, setCompleted] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_PROGRESS) || '[]') } catch { return [] }
  })
  const [stats, setStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_STATS) || '{"totalTime":0,"completedCount":0,"bestTime":null}') } catch { return { totalTime: 0, completedCount: 0, bestTime: null as number | null } }
  })
  const [userCode, setUserCode] = useState('')
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (isRunning) {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [isRunning])

  const getRandomChallenge = useCallback(() => {
    const pool = difficulty === '全部' ? challenges : challenges.filter(c => c.difficulty === difficulty)
    const uncompleted = pool.filter(c => !completed.includes(c.id))
    const source = uncompleted.length > 0 ? uncompleted : pool
    const random = source[Math.floor(Math.random() * source.length)]
    setCurrentChallenge(random)
    setShowHint(false)
    setShowSolution(false)
    setTimer(0)
    setIsRunning(true)
    setUserCode('')
  }, [difficulty, completed])

  useEffect(() => {
    if (!currentChallenge) getRandomChallenge()
  }, [currentChallenge, getRandomChallenge])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const getDifficultyColor = (d: string) => {
    const colors: Record<string, string> = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' }
    return colors[d] || '#8888aa'
  }

  const completeChallenge = () => {
    if (!currentChallenge) return
    setIsRunning(false)
    const newCompleted = completed.includes(currentChallenge.id) ? completed : [...completed, currentChallenge.id]
    setCompleted(newCompleted)
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(newCompleted))

    const newStats = {
      totalTime: stats.totalTime + timer,
      completedCount: newCompleted.length,
      bestTime: stats.bestTime === null ? timer : Math.min(stats.bestTime, timer),
    }
    setStats(newStats)
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(newStats))
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 2000)
  }

  const skipChallenge = () => {
    setIsRunning(false)
    getRandomChallenge()
  }

  const resetProgress = () => {
    if (!confirm('确定要重置所有进度吗？')) return
    setCompleted([])
    setStats({ totalTime: 0, completedCount: 0, bestTime: null })
    localStorage.removeItem(STORAGE_KEY_PROGRESS)
    localStorage.removeItem(STORAGE_KEY_STATS)
    setCurrentChallenge(null)
    getRandomChallenge()
  }

  return (
    <div style={{
      height: '100%',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: '#e0e0f0',
      overflow: 'auto',
      padding: 20,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <style>{`
        .dc-fade-in { animation: dcFadeIn 0.5s ease-out; }
        @keyframes dcFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .dc-btn { transition: all 0.25s ease; }
        .dc-btn:hover { transform: translateY(-1px); }
        @keyframes dcBounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
        .dc-bounce { animation: dcBounce 0.6s ease; }
        @keyframes dcConfetti {
          0% { transform: translateY(0) rotate(0); opacity: 1; }
          100% { transform: translateY(100px) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* 头部 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(102,126,234,0.4)',
          }}>
            <Zap size={22} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>每日编程挑战</div>
            <div style={{ fontSize: 12, color: '#8888aa' }}>练习算法与数据结构 · 记录进步</div>
          </div>
          <button onClick={resetProgress} className="dc-btn" style={{
            padding: '8px 16px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)', color: '#aaaacc',
            cursor: 'pointer', fontSize: 13, display: 'flex',
            alignItems: 'center', gap: 6, fontFamily: 'inherit',
          }}>
            <RotateCcw size={14} /> 重置
          </button>
        </div>

        {/* 统计卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { icon: <Target size={16} />, label: '已完成', value: `${completed.length} / ${challenges.length}`, color: '#a29bfe' },
            { icon: <Clock size={16} />, label: '总练习时间', value: formatTime(stats.totalTime), color: '#60a5fa' },
            { icon: <Trophy size={16} />, label: '最佳时间', value: stats.bestTime ? formatTime(stats.bestTime) : '--:--', color: '#facc15' },
            { icon: <BarChart3 size={16} />, label: '完成率', value: `${Math.round((completed.length / challenges.length) * 100)}%`, color: '#4ade80' },
          ].map(s => (
            <div key={s.label} style={{
              padding: 14,
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${s.color}22`, color: s.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 11, color: '#8888aa' }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0ff' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 难度选择 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['全部', 'Easy', 'Medium', 'Hard'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className="dc-btn"
              style={{
                padding: '8px 18px', borderRadius: 10,
                border: difficulty === d ? '1px solid transparent' : '1px solid rgba(255,255,255,0.1)',
                background: difficulty === d ? (d === '全部' ? 'rgba(102,126,234,0.3)' : `${getDifficultyColor(d)}33`) : 'rgba(255,255,255,0.05)',
                color: difficulty === d ? (d === '全部' ? '#c5bfff' : getDifficultyColor(d)) : '#aaaacc',
                cursor: 'pointer', fontSize: 13, fontWeight: difficulty === d ? 600 : 400,
                fontFamily: 'inherit',
              }}
            >
              {d === '全部' ? '全部难度' : d}
            </button>
          ))}
          <button onClick={getRandomChallenge} className="dc-btn" style={{
            marginLeft: 'auto', padding: '8px 16px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)', color: '#aaaacc',
            cursor: 'pointer', fontSize: 13, display: 'flex',
            alignItems: 'center', gap: 6, fontFamily: 'inherit',
          }}>
            <Sparkles size={14} /> 换一题
          </button>
        </div>

        {/* 挑战卡片 */}
        {currentChallenge && (
          <div className="dc-fade-in" style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24, padding: 24,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* 装饰性背景 */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 4,
              background: `linear-gradient(90deg, ${getDifficultyColor(currentChallenge.difficulty)}, transparent)`,
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f0f0ff' }}>{currentChallenge.title}</h2>
                <span style={{
                  padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                  background: `${getDifficultyColor(currentChallenge.difficulty)}22`,
                  color: getDifficultyColor(currentChallenge.difficulty),
                  border: `1px solid ${getDifficultyColor(currentChallenge.difficulty)}44`,
                }}>{currentChallenge.difficulty}</span>
                <span style={{ fontSize: 11, color: '#8888aa' }}>{currentChallenge.category}</span>
                {completed.includes(currentChallenge.id) && (
                  <span style={{ fontSize: 11, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Award size={12} /> 已完成
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', background: 'rgba(255,255,255,0.06)',
                  borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                  fontFamily: 'monospace', fontSize: 14, color: '#60a5fa', fontWeight: 600,
                }}>
                  <Clock size={14} /> {formatTime(timer)}
                </div>
              </div>
            </div>

            {/* 题目描述 */}
            <div style={{
              padding: 16, background: 'rgba(255,255,255,0.04)',
              borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 14, color: '#e0e0f0', lineHeight: 1.7, marginBottom: 12 }}>
                {currentChallenge.description}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {currentChallenge.examples.map((ex, i) => (
                  <div key={i} style={{
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.3)', borderRadius: 8,
                    fontSize: 12, color: '#c0c0d0', fontFamily: 'monospace',
                  }}>
                    {ex}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: '#8888aa' }}>
                <span style={{ color: '#60a5fa', fontWeight: 600 }}>约束：</span> {currentChallenge.constraints}
              </div>
            </div>

            {/* 代码编辑器 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Code2 size={14} /> 你的代码
                </span>
              </div>
              <textarea
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                placeholder="// 在这里编写你的代码..."
                style={{
                  width: '100%', minHeight: 150, padding: 16,
                  background: 'rgba(0,0,0,0.35)',
                  borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e0e0f0', fontSize: 13, fontFamily: '"Fira Code", Consolas, monospace',
                  outline: 'none', resize: 'vertical', lineHeight: 1.7,
                }}
              />
            </div>

            {/* 提示/解决方案 */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <button onClick={() => setShowHint(!showHint)} className="dc-btn" style={{
                padding: '8px 16px', borderRadius: 10,
                border: '1px solid rgba(250,204,21,0.3)',
                background: showHint ? 'rgba(250,204,21,0.1)' : 'rgba(255,255,255,0.05)',
                color: showHint ? '#facc15' : '#aaaacc',
                cursor: 'pointer', fontSize: 13, display: 'flex',
                alignItems: 'center', gap: 6, fontFamily: 'inherit',
              }}>
                <Lightbulb size={14} /> {showHint ? '隐藏提示' : '显示提示'}
              </button>
              <button onClick={() => setShowSolution(!showSolution)} className="dc-btn" style={{
                padding: '8px 16px', borderRadius: 10,
                border: '1px solid rgba(239,68,68,0.3)',
                background: showSolution ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                color: showSolution ? '#f87171' : '#aaaacc',
                cursor: 'pointer', fontSize: 13, display: 'flex',
                alignItems: 'center', gap: 6, fontFamily: 'inherit',
              }}>
                <Target size={14} /> {showSolution ? '隐藏解答' : '查看解答'}
              </button>
            </div>

            {showHint && (
              <div style={{
                padding: 14, background: 'rgba(250,204,21,0.1)',
                borderRadius: 12, border: '1px solid rgba(250,204,21,0.3)',
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 13, color: '#facc15', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lightbulb size={14} /> 提示
                </div>
                <div style={{ fontSize: 13, color: '#d4d4d8', lineHeight: 1.6 }}>{currentChallenge.hint}</div>
              </div>
            )}

            {showSolution && (
              <div style={{
                padding: 14, background: 'rgba(239,68,68,0.08)',
                borderRadius: 12, border: '1px solid rgba(239,68,68,0.25)',
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 13, color: '#f87171', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Target size={14} /> 参考解答
                </div>
                <pre style={{
                  margin: 0, padding: 14,
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: 10,
                  fontSize: 12, lineHeight: 1.6,
                  color: '#e0e0f0', fontFamily: 'monospace',
                  overflow: 'auto',
                }}>
                  {currentChallenge.solution}
                </pre>
              </div>
            )}

            {/* 底部操作 */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={completeChallenge} className="dc-btn" style={{
                flex: 1, minWidth: 140, padding: '12px 24px', borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: '#0a0a1e', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(67,233,123,0.3)',
              }}>
                <Trophy size={16} /> 完成挑战
              </button>
              <button onClick={skipChallenge} className="dc-btn" style={{
                flex: 1, minWidth: 140, padding: '12px 24px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)', color: '#aaaacc',
                cursor: 'pointer', fontSize: 14, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit',
              }}>
                <ChevronRight size={16} /> 跳过
              </button>
            </div>
          </div>
        )}

        {/* 完成庆祝 */}
        {showCelebration && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
          }}>
            <div className="dc-bounce" style={{
              padding: 40, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 24, textAlign: 'center', boxShadow: '0 20px 60px rgba(102,126,234,0.5)',
            }}>
              <Trophy size={64} color="white" style={{ margin: '0 auto 16px', display: 'block' }} />
              <div style={{ fontSize: 28, fontWeight: 700, color: 'white', marginBottom: 8 }}>太棒了！🎉</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                用时 {formatTime(timer)} 完成挑战！
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

