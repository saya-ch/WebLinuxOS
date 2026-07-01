import { useState, useMemo, useCallback, useEffect, useRef } from 'react'

interface Problem {
  id: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  description: string
  examples: { input: string; output: string; explanation?: string }[]
  constraints: string[]
  starterCode: string
  solution: string
  hints: string[]
  tags: string[]
}

interface TestResult {
  passed: boolean
  input: string
  expected: string
  actual: string
}

const PROBLEMS: Problem[] = [
  {
    id: 'two-sum',
    title: '两数之和',
    difficulty: 'easy',
    category: '数组 / 哈希表',
    description: '给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值 target 的那两个整数，并返回它们的数组下标。你可以假设每种输入只会对应一个答案，并且你不能使用两次相同的元素。你可以按任意顺序返回答案。',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: '因为 nums[0] + nums[1] == 9 ，返回 [0, 1]' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
      { input: 'nums = [3,3], target = 6', output: '[0,1]' },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      '只会存在一个有效答案',
    ],
    starterCode: `function twoSum(nums, target) {
  // 在这里编写你的代码
  
}`,
    solution: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    hints: [
      '一种暴力的方式是遍历所有可能的数对，时间复杂度 O(n²)',
      '使用哈希表可以将时间复杂度降到 O(n)',
      '遍历数组时，检查 target - 当前数字是否已在哈希表中',
    ],
    tags: ['数组', '哈希表', '双指针'],
  },
  {
    id: 'valid-parentheses',
    title: '有效的括号',
    difficulty: 'easy',
    category: '栈 / 字符串',
    description: '给定一个只包括 \'(\', \')\', \'{\', \'}\', \'[\', \']\' 的字符串 s ，判断字符串是否有效。有效字符串需满足：左括号必须用相同类型的右括号闭合；左括号必须以正确的顺序闭合；每个右括号都有一个对应的相同类型的左括号。',
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
      { input: 's = "([])"', output: 'true' },
    ],
    constraints: [
      '1 <= s.length <= 10^4',
      's 仅由括号 \'()[]{}\' 组成',
    ],
    starterCode: `function isValid(s) {
  // 在这里编写你的代码
  
}`,
    solution: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  
  for (const char of s) {
    if (char in map) {
      if (stack.length === 0 || stack.pop() !== map[char]) {
        return false;
      }
    } else {
      stack.push(char);
    }
  }
  
  return stack.length === 0;
}`,
    hints: [
      '栈是解决括号匹配问题的经典数据结构',
      '遇到左括号入栈，遇到右括号时检查栈顶是否匹配',
      '最后栈应该为空',
    ],
    tags: ['栈', '字符串'],
  },
  {
    id: 'palindrome-number',
    title: '回文数',
    difficulty: 'easy',
    category: '数学',
    description: '给你一个整数 x ，如果 x 是一个回文整数，返回 true ；否则，返回 false 。回文数是指正序（从左向右）和倒序（从右向左）读都是一样的整数。例如，121 是回文，而 123 不是。',
    examples: [
      { input: 'x = 121', output: 'true' },
      { input: 'x = -121', output: 'false', explanation: '从左向右读, 为 -121 。 从右向左读, 为 121- 。因此它不是一个回文数。' },
      { input: 'x = 10', output: 'false', explanation: '从右向左读, 为 01 。因此它不是一个回文数。' },
    ],
    constraints: [
      '-2^31 <= x <= 2^31 - 1',
      '你能不将整数转为字符串来解决这个问题吗？',
    ],
    starterCode: `function isPalindrome(x) {
  // 在这里编写你的代码
  
}`,
    solution: `function isPalindrome(x) {
  if (x < 0 || (x % 10 === 0 && x !== 0)) {
    return false;
  }
  
  let reversed = 0;
  let original = x;
  
  while (x > 0) {
    reversed = reversed * 10 + x % 10;
    x = Math.floor(x / 10);
  }
  
  return original === reversed;
}`,
    hints: [
      '负数不可能是回文数',
      '可以反转数字的一半来避免溢出',
      '或者将数字转为字符串后比较',
    ],
    tags: ['数学', '双指针'],
  },
  {
    id: 'longest-substring',
    title: '无重复字符的最长子串',
    difficulty: 'medium',
    category: '滑动窗口 / 哈希表',
    description: '给定一个字符串 s ，请你找出其中不含有重复字符的最长子串的长度。',
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: '因为无重复字符的最长子串是 "abc"，所以其长度为 3。' },
      { input: 's = "bbbbb"', output: '1', explanation: '因为无重复字符的最长子串是 "b"，所以其长度为 1。' },
      { input: 's = "pwwkew"', output: '3', explanation: '因为无重复字符的最长子串是 "wke"，所以其长度为 3。' },
    ],
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's 由英文字母、数字、符号和空格组成',
    ],
    starterCode: `function lengthOfLongestSubstring(s) {
  // 在这里编写你的代码
  
}`,
    solution: `function lengthOfLongestSubstring(s) {
  let maxLen = 0;
  let left = 0;
  const map = new Map();
  
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (map.has(char) && map.get(char) >= left) {
      left = map.get(char) + 1;
    }
    map.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  
  return maxLen;
}`,
    hints: [
      '滑动窗口是解决这类问题的常用方法',
      '使用哈希表记录字符最后出现的位置',
      '遇到重复字符时，移动左指针到重复位置的下一位',
    ],
    tags: ['滑动窗口', '哈希表', '字符串'],
  },
  {
    id: 'maximum-subarray',
    title: '最大子数组和',
    difficulty: 'medium',
    category: '动态规划 / 分治',
    description: '给你一个整数数组 nums ，请你找出一个具有最大和的连续子数组（子数组最少包含一个元素），返回其最大和。子数组是数组中的一个连续部分。',
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: '连续子数组 [4,-1,2,1] 的和最大，为 6 。' },
      { input: 'nums = [1]', output: '1' },
      { input: 'nums = [5,4,-1,7,8]', output: '23' },
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4',
      '进阶：如果你已经实现复杂度为 O(n) 的解法，尝试使用更为精妙的分治法求解。',
    ],
    starterCode: `function maxSubArray(nums) {
  // 在这里编写你的代码
  
}`,
    solution: `function maxSubArray(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];
  
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  
  return maxSum;
}`,
    hints: [
      '这是经典的动态规划问题（Kadane算法）',
      '对于每个位置，决定是重新开始还是延续前面的子数组',
      '状态转移：dp[i] = max(nums[i], dp[i-1] + nums[i])',
    ],
    tags: ['动态规划', '分治', '数组'],
  },
  {
    id: 'climb-stairs',
    title: '爬楼梯',
    difficulty: 'easy',
    category: '动态规划',
    description: '假设你正在爬楼梯。需要 n 阶你才能到达楼顶。每次你可以爬 1 或 2 个台阶。你有多少种不同的方法可以爬到楼顶呢？',
    examples: [
      { input: 'n = 2', output: '2', explanation: '有两种方法可以爬到楼顶。1. 1 阶 + 1 阶 2. 2 阶' },
      { input: 'n = 3', output: '3', explanation: '有三种方法可以爬到楼顶。1. 1 阶 + 1 阶 + 1 阶 2. 1 阶 + 2 阶 3. 2 阶 + 1 阶' },
    ],
    constraints: [
      '1 <= n <= 45',
    ],
    starterCode: `function climbStairs(n) {
  // 在这里编写你的代码
  
}`,
    solution: `function climbStairs(n) {
  if (n <= 2) return n;
  
  let prev1 = 1;
  let prev2 = 2;
  
  for (let i = 3; i <= n; i++) {
    const current = prev1 + prev2;
    prev1 = prev2;
    prev2 = current;
  }
  
  return prev2;
}`,
    hints: [
      '这本质上是斐波那契数列问题',
      '到达第 n 阶的方法 = 到达第 n-1 阶的方法 + 到达第 n-2 阶的方法',
      '可以用动态规划或递归+记忆化解决',
    ],
    tags: ['动态规划', '递归', '数学'],
  },
  {
    id: 'binary-search',
    title: '二分查找',
    difficulty: 'easy',
    category: '二分查找',
    description: '给定一个 n 个元素有序的（升序）整型数组 nums 和一个目标值 target ，写一个函数搜索 nums 中的 target，如果目标值存在返回下标，否则返回 -1。你可以假设 nums 中的所有元素是不重复的。',
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 出现在 nums 中并且下标为 4' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: '2 不存在 nums 中因此返回 -1' },
    ],
    constraints: [
      '你可以假设 nums 中的所有元素是不重复的。',
      'n 将在 [1, 10000]之间。',
      'nums 的每个元素都将在 [-9999, 9999]之间。',
    ],
    starterCode: `function search(nums, target) {
  // 在这里编写你的代码
  
}`,
    solution: `function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1;
}`,
    hints: [
      '使用左右指针，每次比较中间元素',
      '如果中间元素小于目标，在右半部分继续查找',
      '如果中间元素大于目标，在左半部分继续查找',
    ],
    tags: ['二分查找', '数组'],
  },
  {
    id: 'fizz-buzz',
    title: 'Fizz Buzz',
    difficulty: 'easy',
    category: '数学 / 字符串',
    description: '给你一个整数 n ，找出从 1 到 n 各个数字的 Fizz Buzz 表示。如果数字是 3 的倍数，输出 "Fizz"；如果是 5 的倍数，输出 "Buzz"；如果同时是 3 和 5 的倍数，输出 "FizzBuzz"；否则输出数字本身。',
    examples: [
      { input: 'n = 3', output: '["1","2","Fizz"]' },
      { input: 'n = 5', output: '["1","2","Fizz","4","Buzz"]' },
      { input: 'n = 15', output: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]' },
    ],
    constraints: [
      '1 <= n <= 10^4',
    ],
    starterCode: `function fizzBuzz(n) {
  // 在这里编写你的代码
  
}`,
    solution: `function fizzBuzz(n) {
  const result = [];
  
  for (let i = 1; i <= n; i++) {
    let str = '';
    if (i % 3 === 0) str += 'Fizz';
    if (i % 5 === 0) str += 'Buzz';
    if (str === '') str += i;
    result.push(str);
  }
  
  return result;
}`,
    hints: [
      '使用取模运算判断是否是 3 或 5 的倍数',
      '先检查是否同时是 3 和 5 的倍数',
      '或者分别拼接字符串，最后为空则用数字',
    ],
    tags: ['数学', '字符串', '模拟'],
  },
]

const DIFFICULTY_COLORS = {
  easy: { bg: 'rgba(0, 200, 120, 0.15)', text: '#00c878', label: '简单' },
  medium: { bg: 'rgba(255, 180, 0, 0.15)', text: '#ffb400', label: '中等' },
  hard: { bg: 'rgba(255, 80, 80, 0.15)', text: '#ff5050', label: '困难' },
}

export default function CodeInterviewPrep() {
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(PROBLEMS[0])
  const [code, setCode] = useState(PROBLEMS[0].starterCode)
  const [output, setOutput] = useState('')
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [activeTab, setActiveTab] = useState<'description' | 'solution' | 'hints'>('description')
  const [showHint, setShowHint] = useState<number>(-1)
  const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [solvedProblems, setSolvedProblems] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('weblinux-interview-solved')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem('weblinux-interview-solved', JSON.stringify([...solvedProblems]))
  }, [solvedProblems])

  const filteredProblems = useMemo(() => {
    if (filter === 'all') return PROBLEMS
    return PROBLEMS.filter(p => p.difficulty === filter)
  }, [filter])

  const stats = useMemo(() => {
    const total = PROBLEMS.length
    const solved = solvedProblems.size
    const easy = PROBLEMS.filter(p => p.difficulty === 'easy').filter(p => solvedProblems.has(p.id)).length
    const medium = PROBLEMS.filter(p => p.difficulty === 'medium').filter(p => solvedProblems.has(p.id)).length
    const hard = PROBLEMS.filter(p => p.difficulty === 'hard').filter(p => solvedProblems.has(p.id)).length
    return { total, solved, easy, medium, hard }
  }, [solvedProblems])

  const selectProblem = useCallback((problem: Problem) => {
    setSelectedProblem(problem)
    setCode(problem.starterCode)
    setOutput('')
    setTestResults([])
    setActiveTab('description')
    setShowHint(-1)
  }, [])

  const runCode = useCallback(() => {
    if (!selectedProblem) return

    setOutput('运行中...\n')
    setTestResults([])

    setTimeout(() => {
      try {
        const results: TestResult[] = []
        let allPassed = true

        const userCode = code
        const fnMatch = userCode.match(/function\s+(\w+)/)
        if (!fnMatch) {
          setOutput('错误: 未找到函数定义\n')
          return
        }

        const fnName = fnMatch[1]

        const testCases = selectedProblem.examples.map(ex => {
          const inputStr = ex.input
          let nums: number[] | null = null
          let target: number | null = null
          let s: string | null = null
          let n: number | null = null

          const numsMatch = inputStr.match(/nums\s*=\s*\[([^\]]*)\]/)
          if (numsMatch) {
            nums = numsMatch[1].split(',').map(Number)
          }

          const targetMatch = inputStr.match(/target\s*=\s*(-?\d+)/)
          if (targetMatch) {
            target = parseInt(targetMatch[1])
          }

          const sMatch = inputStr.match(/s\s*=\s*"([^"]*)"/)
          if (sMatch) {
            s = sMatch[1]
          }

          const nMatch = inputStr.match(/n\s*=\s*(\d+)/)
          if (nMatch) {
            n = parseInt(nMatch[1])
          }

          let expected = ex.output
          try {
            expected = JSON.parse(ex.output)
          } catch {
            expected = ex.output
          }

          return { nums, target, s, n, expected, input: ex.input, expectedStr: ex.output }
        })

        const fn = new Function(`${userCode}; return ${fnName};`)()

        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i]
          let actual: unknown

          try {
            if (tc.nums !== null && tc.target !== null) {
              actual = fn(tc.nums, tc.target)
            } else if (tc.s !== null) {
              actual = fn(tc.s)
            } else if (tc.n !== null) {
              actual = fn(tc.n)
            } else if (tc.nums !== null) {
              actual = fn(tc.nums)
            } else {
              actual = fn()
            }
          } catch (e: unknown) {
            const errorMsg = e instanceof Error ? e.message : String(e)
            results.push({
              passed: false,
              input: tc.input,
              expected: tc.expectedStr,
              actual: '运行错误: ' + errorMsg,
            })
            allPassed = false
            continue
          }

          const actualStr = JSON.stringify(actual)
          const expectedStr = typeof tc.expected === 'string' ? tc.expected : JSON.stringify(tc.expected)
          const passed = actualStr === expectedStr || JSON.stringify(actual) === JSON.stringify(tc.expected)

          if (!passed) allPassed = false

          results.push({
            passed,
            input: tc.input,
            expected: tc.expectedStr,
            actual: actualStr,
          })
        }

        setTestResults(results)

        let outputStr = `\n测试结果: ${allPassed ? '全部通过 ✓' : `${results.filter(r => r.passed).length}/${results.length} 通过`}\n\n`
        results.forEach((r, i) => {
          outputStr += `测试用例 ${i + 1}: ${r.passed ? '✓ 通过' : '✗ 失败'}\n`
          outputStr += `  输入: ${r.input}\n`
          outputStr += `  期望: ${r.expected}\n`
          outputStr += `  实际: ${r.actual}\n\n`
        })

        setOutput(outputStr)

        if (allPassed && selectedProblem) {
          setSolvedProblems(prev => new Set([...prev, selectedProblem.id]))
        }
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e)
        setOutput('执行出错: ' + errorMsg + '\n')
      }
    }, 500)
  }, [code, selectedProblem])

  const resetCode = useCallback(() => {
    if (selectedProblem) {
      setCode(selectedProblem.starterCode)
      setOutput('')
      setTestResults([])
    }
  }, [selectedProblem])

  if (!selectedProblem) {
    return (
      <div style={{ padding: 20, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        请选择一道题目开始练习
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
            编程面试准备
          </span>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span>已完成: <strong style={{ color: 'var(--accent)' }}>{stats.solved}/{stats.total}</strong></span>
            <span style={{ color: '#00c878' }}>简单 {stats.easy}</span>
            <span style={{ color: '#ffb400' }}>中等 {stats.medium}</span>
            <span style={{ color: '#ff5050' }}>困难 {stats.hard}</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: 280,
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)',
        }}>
          <div style={{
            padding: '10px 12px',
            display: 'flex',
            gap: 6,
            borderBottom: '1px solid var(--border-color)',
          }}>
            {(['all', 'easy', 'medium', 'hard'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  flex: 1,
                  padding: '6px 4px',
                  fontSize: 11,
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: filter === f ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: filter === f ? 'white' : 'var(--text-secondary)',
                  fontWeight: filter === f ? 600 : 400,
                }}
              >
                {f === 'all' ? '全部' : DIFFICULTY_COLORS[f].label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {filteredProblems.map((problem, i) => (
              <div
                key={problem.id}
                onClick={() => selectProblem(problem)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: selectedProblem.id === problem.id
                    ? 'rgba(139, 124, 240, 0.15)'
                    : 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (selectedProblem.id !== problem.id) {
                    e.currentTarget.style.background = 'var(--bg-tertiary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedProblem.id !== problem.id) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    marginBottom: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{i + 1}.</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {problem.title}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {problem.category}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {solvedProblems.has(problem.id) && (
                    <span style={{ color: '#00c878', fontSize: 14 }}>✓</span>
                  )}
                  <span style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: DIFFICULTY_COLORS[problem.difficulty].bg,
                    color: DIFFICULTY_COLORS[problem.difficulty].text,
                    fontWeight: 600,
                  }}>
                    {DIFFICULTY_COLORS[problem.difficulty].label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <div style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}>
              {selectedProblem.title}
            </div>
            <span style={{
              fontSize: 11,
              padding: '3px 10px',
              borderRadius: 10,
              background: DIFFICULTY_COLORS[selectedProblem.difficulty].bg,
              color: DIFFICULTY_COLORS[selectedProblem.difficulty].text,
              fontWeight: 600,
            }}>
              {DIFFICULTY_COLORS[selectedProblem.difficulty].label}
            </span>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={resetCode}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                重置代码
              </button>
              <button
                onClick={runCode}
                style={{
                  padding: '6px 16px',
                  fontSize: 12,
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--accent)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                ▶ 运行测试
              </button>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div style={{
              width: '45%',
              borderRight: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
              }}>
                {(['description', 'hints', 'solution'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '10px 16px',
                      fontSize: 12,
                      border: 'none',
                      background: 'transparent',
                      color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                      fontWeight: activeTab === tab ? 600 : 400,
                    }}
                  >
                    {tab === 'description' ? '题目描述' : tab === 'hints' ? '提示' : '题解'}
                  </button>
                ))}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 16, fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)' }}>
                {activeTab === 'description' && (
                  <div>
                    <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
                      {selectedProblem.description}
                    </p>

                    <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-primary)' }}>示例：</h4>
                    {selectedProblem.examples.map((ex, i) => (
                      <div key={i} style={{
                        padding: 12,
                        borderRadius: 8,
                        background: 'var(--bg-secondary)',
                        marginBottom: 10,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12,
                      }}>
                        <div style={{ marginBottom: 6 }}><strong>输入:</strong> {ex.input}</div>
                        <div style={{ marginBottom: 6 }}><strong>输出:</strong> {ex.output}</div>
                        {ex.explanation && (
                          <div style={{ color: 'var(--text-tertiary)' }}><strong>解释:</strong> {ex.explanation}</div>
                        )}
                      </div>
                    ))}

                    <h4 style={{ fontSize: 13, fontWeight: 600, margin: '16px 0 10px', color: 'var(--text-primary)' }}>提示：</h4>
                    <ul style={{ color: 'var(--text-secondary)', paddingLeft: 20 }}>
                      {selectedProblem.constraints.map((c, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{c}</li>
                      ))}
                    </ul>

                    <h4 style={{ fontSize: 13, fontWeight: 600, margin: '16px 0 10px', color: 'var(--text-primary)' }}>标签：</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {selectedProblem.tags.map((tag, i) => (
                        <span key={i} style={{
                          padding: '3px 10px',
                          borderRadius: 12,
                          background: 'var(--bg-tertiary)',
                          fontSize: 11,
                          color: 'var(--text-secondary)',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'hints' && (
                  <div>
                    <p style={{ marginBottom: 16, color: 'var(--text-secondary)', fontSize: 12 }}>
                      点击展开提示，先自己思考再看提示哦！
                    </p>
                    {selectedProblem.hints.map((hint, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <button
                          onClick={() => setShowHint(showHint === i ? -1 : i)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            textAlign: 'left',
                            borderRadius: 8,
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                        >
                          💡 提示 {i + 1} {showHint === i ? '▲' : '▼'}
                        </button>
                        {showHint === i && (
                          <div style={{
                            padding: '12px',
                            borderRadius: '0 0 8px 8px',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            borderTop: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: 13,
                          }}>
                            {hint}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'solution' && (
                  <div>
                    <p style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: 12 }}>
                      参考题解（建议先自己尝试后再看）
                    </p>
                    <pre style={{
                      padding: 14,
                      borderRadius: 8,
                      background: 'var(--bg-secondary)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      overflowX: 'auto',
                      color: 'var(--text-primary)',
                      lineHeight: 1.6,
                    }}>
                      {selectedProblem.solution}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{
                padding: '8px 12px',
                borderBottom: '1px solid var(--border-color)',
                fontSize: 12,
                color: 'var(--text-secondary)',
                background: 'var(--bg-secondary)',
              }}>
                代码编辑器 (JavaScript)
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1,
                  padding: 14,
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: "'JetBrains Mono', Consolas, monospace",
                  fontSize: 13,
                  lineHeight: 1.6,
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
              />
              <div style={{
                borderTop: '1px solid var(--border-color)',
                maxHeight: 180,
                overflowY: 'auto',
              }}>
                <div style={{
                  padding: '8px 12px',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border-color)',
                }}>
                  输出结果
                </div>
                <div
                  ref={outputRef}
                  style={{
                    padding: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: testResults.length > 0 && testResults.every(r => r.passed)
                      ? '#00c878'
                      : 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {output || '点击「运行测试」来运行你的代码...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
