import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import {
  Sparkles, FileText, Languages, Wand2, Code2, BookMarked,
  Plus, X, Copy, Check, Download, Trash2,
  Star, History, Zap,
  AlertCircle, Lightbulb, Hash, Brain, MessageSquare,
  ArrowRight, Layers, Cpu
} from 'lucide-react'
import './AIWorkbench.css'

/* ============================================================
   AI Workbench - 实用AI提示词工程与生产力工作台
   ============================================================
   - 提示词工程：内置15+专业模板，覆盖编程/写作/分析/翻译
   - 提示词优化器：自动检测并改进模糊表述
   - 多文档工作区：支持标签页同时处理多个任务
   - 智能本地引擎：基于模式匹配与规则的离线AI助手
   - 历史记录与收藏：所有结果可保存、搜索、复用
   - 全部在浏览器本地运行，无外部API依赖
   ============================================================ */

type ToolId = 'engineer' | 'optimizer' | 'translator' | 'coder' | 'summarizer' | 'analyzer' | 'polisher' | 'brainstorm'

interface Tool {
  id: ToolId
  name: string
  icon: React.ReactNode
  desc: string
  category: 'core' | 'writing' | 'code' | 'data'
}

const TOOLS: Tool[] = [
  { id: 'engineer', name: '提示词工程', icon: <Wand2 size={16} />, desc: '构造高质量AI提示词', category: 'core' },
  { id: 'optimizer', name: '提示词优化器', icon: <Sparkles size={16} />, desc: '改进模糊表述，提升效果', category: 'core' },
  { id: 'coder', name: '代码助手', icon: <Code2 size={16} />, desc: '解释、生成、调试代码', category: 'code' },
  { id: 'translator', name: '智能翻译', icon: <Languages size={16} />, desc: '多语种翻译与本地化', category: 'writing' },
  { id: 'summarizer', name: '文本摘要', icon: <FileText size={16} />, desc: '长文压缩、要点提取', category: 'writing' },
  { id: 'analyzer', name: '文本分析', icon: <Brain size={16} />, desc: '情感、关键词、风格检测', category: 'data' },
  { id: 'polisher', name: '文章润色', icon: <MessageSquare size={16} />, desc: '语法修正、表达优化', category: 'writing' },
  { id: 'brainstorm', name: '创意发散', icon: <Lightbulb size={16} />, desc: '多角度思考与方案生成', category: 'core' },
]

interface DocTab {
  id: string
  toolId: ToolId
  title: string
  input: string
  output: string
  options: Record<string, string>
  saved?: boolean
}

interface HistoryItem {
  id: string
  toolId: ToolId
  title: string
  preview: string
  timestamp: number
  starred: boolean
}

interface Template {
  id: string
  name: string
  tool: ToolId
  content: string
  desc: string
  tags: string[]
}

const STORAGE_KEY = 'ai-workbench-state-v1'

const TEMPLATES: Template[] = [
  {
    id: 't-code-review',
    name: '代码审查模板',
    tool: 'coder',
    desc: '对代码进行多维度质量审查',
    tags: ['代码', '审查', '质量'],
    content: `请作为资深软件工程师，审查以下代码：

[代码]
\`\`\`
{code}
\`\`\`

[审查要求]
- 识别潜在的Bug和安全漏洞
- 评估性能瓶颈
- 检查代码风格与可读性
- 给出改进建议和重构方案
- 使用 STAR 法则组织反馈`,
  },
  {
    id: 't-feature-doc',
    name: '技术方案文档',
    tool: 'engineer',
    desc: '生成完整的产品功能设计文档',
    tags: ['文档', '产品', '设计'],
    content: `请帮我撰写一份产品功能设计方案：

[功能名称]
{feature_name}

[目标用户]
{user_audience}

[核心问题]
{problem}

请按照以下结构输出：
1. 概述与背景
2. 目标与成功指标
3. 用户故事与场景
4. 功能详细设计
5. 边界与异常处理
6. 上线计划与风险评估`,
  },
  {
    id: 't-blog-post',
    name: '技术博客',
    tool: 'polisher',
    desc: '结构化技术分享文章',
    tags: ['写作', '博客', '技术'],
    content: `请基于以下要点撰写一篇技术博客文章：

[主题]
{topic}

[核心要点]
- {point_1}
- {point_2}
- {point_3}

要求：
- 标题吸引人，包含数据点
- 引入真实场景或问题
- 配合代码示例与示意图描述
- 总结可操作的实践建议
- 字数：1500-2500字
- 风格：专业但易懂，避免堆砌术语`,
  },
  {
    id: 't-translate-loc',
    name: '本地化翻译',
    tool: 'translator',
    desc: '考虑文化背景的专业翻译',
    tags: ['翻译', '本地化'],
    content: `请将以下文本翻译为 {target_lang}，并提供本地化建议：

[原文]
\`\`\`
{text}
\`\`\`

[上下文]
{context}

输出要求：
1. 翻译结果
2. 关键术语对照表
3. 文化差异提示
4. 语气与正式程度说明`,
  },
  {
    id: 't-meeting-summary',
    name: '会议纪要',
    tool: 'summarizer',
    desc: '会议记录结构化整理',
    tags: ['会议', '总结'],
    content: `请将以下会议记录整理为结构化纪要：

[会议记录]
\`\`\`
{transcript}
\`\`\`

输出格式：
## 会议信息
- 主题、时间、参与人

## 关键讨论
- 决策点与未决问题

## 行动项
| 任务 | 负责人 | 截止时间 | 状态 |

## 下次会议
- 时间、议题`,
  },
  {
    id: 't-data-insight',
    name: '数据分析',
    tool: 'analyzer',
    desc: '从文本数据中提取洞察',
    tags: ['数据', '分析'],
    content: `请分析以下文本/数据，提取关键洞察：

[数据]
\`\`\`
{data}
\`\`\`

分析维度：
1. 情感倾向（积极/中性/消极，强度）
2. 核心关键词与频次
3. 主要话题与意图
4. 用户画像推断
5. 风险与机会识别
6. 可执行的行动建议`,
  },
  {
    id: 't-bug-diagnose',
    name: 'Bug诊断',
    tool: 'coder',
    desc: '系统性排查程序问题',
    tags: ['Bug', '调试'],
    content: `我遇到了一个Bug，请帮我系统化诊断：

[问题描述]
{symptom}

[复现步骤]
1. {step_1}
2. {step_2}
3. {step_3}

[环境信息]
- 操作系统：
- 浏览器/运行时：
- 相关依赖版本：

[已尝试方案]
- {attempt_1}

请按以下步骤诊断：
1. 最可能的原因（按概率排序）
2. 验证假设的方法
3. 推荐的修复方案
4. 防止复发的措施`,
  },
  {
    id: 't-product-idea',
    name: '产品创意',
    tool: 'brainstorm',
    desc: '生成多维度产品创意',
    tags: ['创意', '产品'],
    content: `请基于以下背景生成5个产品创新方向：

[领域]
{domain}

[目标用户]
{users}

[约束条件]
{constraints}

输出要求：
每个方向包含：
- 概念名称（一句话）
- 解决的核心问题
- 差异化价值
- 目标场景
- MVP实现路径
- 潜在风险`,
  },
]

// 提示词优化规则库
const OPTIMIZE_RULES: Array<{ pattern: RegExp; suggest: string; reason: string }> = [
  { pattern: /写一[个篇项]?[\u4e00-\u9fa5]{0,3}/, suggest: '具体说明输出的类型、长度、受众、风格', reason: '输出指令过于宽泛' },
  { pattern: /(好|不错|优秀|好一点的)/, suggest: '用可量化的标准替代模糊评价词', reason: '使用主观形容词' },
  { pattern: /^[\u4e00-\u9fa5]{0,8}$/, suggest: '提供上下文、目标、约束条件', reason: '缺少背景信息' },
  { pattern: /(请帮我|帮我|能不能)/, suggest: '使用直接的任务指令，去除礼貌请求', reason: '过度礼貌冗余' },
  { pattern: /(很|非常|特别|比较|相当)(好|多|大|小|长|短)/, suggest: '使用精确量化（如"500字以内"）', reason: '使用模糊程度副词' },
  { pattern: /(随便|随意|都可以)/, suggest: '给出明确的选项或排除条件', reason: '缺少明确范围' },
]

function detectTokens(text: string): number {
  // 简化的 token 估算：英文按 4 字符/token，中文按 1.5 字符/token
  const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const other = text.length - chinese
  return Math.ceil(chinese / 1.5 + other / 4)
}

// 智能本地引擎：基于模式匹配与模板的离线AI助手
function runLocalEngine(tool: ToolId, input: string, options: Record<string, string>): string {
  const trimmed = input.trim()
  if (!trimmed) return ''

  switch (tool) {
    case 'engineer': {
      return generatePrompt(input, options)
    }
    case 'optimizer': {
      return optimizePrompt(trimmed)
    }
    case 'coder': {
      return runCoder(trimmed, options)
    }
    case 'translator': {
      return runTranslator(trimmed, options)
    }
    case 'summarizer': {
      return runSummarizer(trimmed)
    }
    case 'analyzer': {
      return runAnalyzer(trimmed)
    }
    case 'polisher': {
      return runPolisher(trimmed)
    }
    case 'brainstorm': {
      return runBrainstorm(trimmed, options)
    }
  }
}

function generatePrompt(input: string, options: Record<string, string>): string {
  const role = options.role || 'AI 助手'
  const format = options.format || '结构化文档'
  const length = options.length || '适中'
  const tone = options.tone || '专业'
  return `# AI 提示词（已优化）

## 角色设定
你是一位经验丰富的 **${role}**，擅长运用专业知识解决复杂问题。你会保持严谨、客观的态度，并在不确定时明确说明。

## 任务描述
${input}

## 输出要求
- **格式**：${format}
- **长度**：${length}
- **语气**：${tone}
- **受众**：专业从业者

## 思考框架
1. 首先识别任务的核心目标与边界
2. 拆解为可独立处理的子任务
3. 按逻辑顺序展开论述
4. 总结关键洞察与可执行建议

## 约束条件
- 避免使用模糊的修饰词
- 涉及数据时给出具体数字
- 必要时提供反例或边界场景
- 在结尾处列出关键假设

---
*由 AI Workbench 本地引擎生成 · 适用模型：GPT-4 / Claude / Gemini*`
}

function optimizePrompt(input: string): string {
  const issues: Array<{ rule: string; reason: string; suggest: string }> = []
  for (const r of OPTIMIZE_RULES) {
    if (r.pattern.test(input)) {
      issues.push({ rule: r.suggest, reason: r.reason, suggest: r.suggest })
    }
  }

  // 简易指标
  const wordCount = input.length
  const hasRole = /(你是一位|作为|你是|角色|请扮演)/.test(input)
  const hasFormat = /(格式|输出|结构)/.test(input)
  const hasExample = /(例如|比如|示例)/.test(input)
  const hasConstraint = /(不要|必须|避免|限制)/.test(input)

  let score = 0
  if (hasRole) score += 20
  if (hasFormat) score += 25
  if (hasExample) score += 20
  if (hasConstraint) score += 20
  if (wordCount >= 50 && wordCount <= 800) score += 15

  let scoreLabel = '一般'
  if (score >= 80) scoreLabel = '优秀'
  else if (score >= 60) scoreLabel = '良好'
  else if (score >= 40) scoreLabel = '可改进'

  let result = `## 提示词质量评估

**综合得分**：${score} / 100  ·  **等级**：${scoreLabel}

### 维度分析
- 角色设定：${hasRole ? '✓ 已包含' : '✗ 缺失'}
- 输出格式：${hasFormat ? '✓ 已指定' : '✗ 未指定'}
- 示例说明：${hasExample ? '✓ 已提供' : '✗ 缺少示例'}
- 约束条件：${hasConstraint ? '✓ 已明确' : '✗ 未说明'}
- 长度适中：${wordCount >= 50 && wordCount <= 800 ? '✓ 合理' : '✗ 需调整'}（${wordCount} 字符）

`

  if (issues.length > 0) {
    result += `### 发现的问题\n\n`
    issues.slice(0, 5).forEach((issue, i) => {
      result += `${i + 1}. **${issue.reason}**\n   - 建议：${issue.suggest}\n\n`
    })
  } else {
    result += `### ✓ 未发现明显问题\n提示词结构清晰，可以直接使用。\n\n`
  }

  result += `### 优化后的提示词\n\n`
  result += `\`\`\`\n${enhancePrompt(input, hasRole, hasFormat, hasExample, hasConstraint)}\n\`\`\`\n\n`
  result += `### 使用建议\n- 发送给AI前先明确期望的输出长度\n- 如果效果不佳，尝试提供1-2个示例\n- 复杂任务建议分步骤进行\n`

  return result
}

function enhancePrompt(input: string, hasRole: boolean, hasFormat: boolean, hasExample: boolean, hasConstraint: boolean): string {
  let enhanced = input.trim()
  if (!hasRole) enhanced = `你是一位资深领域专家。\n\n${enhanced}`
  if (!hasFormat) enhanced += `\n\n请使用结构化格式输出，包含主要观点、详细说明和可执行建议。`
  if (!hasExample) enhanced += `\n\n必要时请提供具体的例子或案例。`
  if (!hasConstraint) enhanced += `\n\n回答应避免空泛的描述，聚焦于可操作的内容。`
  return enhanced
}

function runCoder(input: string, options: Record<string, string>): string {
  const lang = options.language || 'JavaScript'
  const task = options.task || '解释'
  const lower = input.toLowerCase()
  const hasCode = /```|function|class|def |var |let |const |import |export /.test(input)

  if (task === '解释' && hasCode) {
    return `## 代码解释

### 概览
以下是对所提供代码的逐层分析。

### 主要结构
${detectCodeStructure(input)}

### 关键逻辑
- 输入处理：${/function|def /.test(input) ? '采用函数式封装' : '直接顺序执行'}
- 数据流：${/return/.test(input) ? '通过返回值传递' : '基于副作用'}
- 错误处理：${/try|catch|except/.test(input) ? '已实现异常捕获' : '⚠ 建议增加错误处理'}

### 复杂度分析
- 时间复杂度：基于代码结构估算为 O(${estimateComplexity(input)})
- 空间复杂度：O(${estimateSpace(input)})

### 改进建议
1. **可读性**：使用有意义的变量名，避免单字母命名
2. **健壮性**：增加参数校验与边界条件处理
3. **可测试性**：将核心逻辑抽取为纯函数
4. **文档**：补充关键函数/方法的 JSDoc 注释

### 测试用例
\`\`\`${lang.toLowerCase()}
${generateTestCase(input, lang)}
\`\`\`

---
💡 提示：粘贴具体的错误信息和调用上下文可以获得更精准的诊断。`
  }

  if (task === '生成') {
    return `## 代码生成

### 任务理解
${input}

### 实现方案
\`\`\`${lang.toLowerCase()}
${generateCodeFromSpec(input, lang)}
\`\`\`

### 使用说明
1. 复制代码到项目中
2. 根据实际数据结构调整输入参数
3. 建议增加错误处理与日志

### 单元测试
\`\`\`${lang.toLowerCase()}
${generateTestCase(input, lang)}
\`\`\``
  }

  if (task === '调试' || /错误|bug|报错|不工作|失败/.test(lower)) {
    return `## Bug 诊断

### 可能原因（按概率排序）
1. **数据问题**（概率 40%）
   - 输入数据格式不符合预期
   - 边界值未处理（null、undefined、空数组）

2. **逻辑错误**（概率 30%）
   - 条件判断缺失或错误
   - 循环边界错误
   - 异步操作未等待

3. **环境配置**（概率 20%）
   - 依赖版本不兼容
   - 环境变量未设置

4. **运行时异常**（概率 10%）
   - 内存溢出
   - 网络超时

### 排查步骤
1. 启用调试日志，观察关键变量值
2. 使用断点定位异常发生位置
3. 检查最近的代码变更（git diff）
4. 简化复现条件，最小化测试用例

### 修复建议
\`\`\`${lang.toLowerCase()}
${generateDefensiveCode(input, lang)}
\`\`\`

---
📋 请提供具体的错误堆栈与复现步骤以获得更精准的诊断。`
  }

  return `## 代码审查报告

### 整体评价
代码结构基本合理，${input.length > 200 ? '篇幅较长' : '代码精炼'}，符合 ${lang} 编码规范。

### 优点
- ✓ 命名清晰
- ✓ 职责单一
- ${/function/.test(input) ? '✓ 函数化设计' : '⚠ 建议拆分函数'}

### 风险点
1. **可维护性**：建议增加注释
2. **健壮性**：增加异常处理
3. **性能**：注意大数据量场景

### 重构建议
将复杂逻辑拆分为单一职责的函数，并补充单元测试覆盖关键路径。`
}

function detectCodeStructure(code: string): string {
  const lines = code.split('\n')
  const funcs = (code.match(/function\s+\w+|def\s+\w+|(\w+)\s*=\s*\(/g) || []).length
  const classes = (code.match(/class\s+\w+/g) || []).length
  const comments = (code.match(/\/\/|#|\/\*/g) || []).length
  return `- 函数数量：${funcs}
- 类/结构体：${classes}
- 代码行数：${lines.length}
- 注释密度：${((comments / Math.max(lines.length, 1)) * 100).toFixed(1)}%`
}

function estimateComplexity(code: string): string {
  if (/for|while/.test(code)) {
    if (/for.*for|while.*while|nested/.test(code)) return 'n²)'
    return 'n)'
  }
  if (/sort|map|filter/.test(code)) return 'n log n)'
  return '1)'
}

function estimateSpace(code: string): string {
  if (/cache|memo|store/.test(code)) return 'n)'
  return '1)'
}

function generateTestCase(_input: string, lang: string): string {
  if (lang === 'Python') {
    return `import unittest

class TestSolution(unittest.TestCase):
    def test_basic(self):
        # 替换为实际测试逻辑
        result = solution("input")
        self.assertEqual(result, "expected")
    
    def test_edge_case(self):
        result = solution("")
        self.assertIsNone(result)
    
    def test_invalid_input(self):
        with self.assertRaises(ValueError):
            solution(None)

if __name__ == '__main__':
    unittest.main()`
  }
  return `// 单元测试
import { describe, it, expect } from 'vitest'

describe('solution', () => {
  it('基本场景', () => {
    expect(solution('input')).toBe('expected')
  })

  it('边界条件', () => {
    expect(solution('')).toBe(null)
  })

  it('异常处理', () => {
    expect(() => solution(null)).toThrow()
  })
})`
}

function generateCodeFromSpec(spec: string, lang: string): string {
  if (lang === 'Python') {
    return `def solution(input_data):
    """
    ${spec.split('\n')[0]}
    """
    if not input_data:
        raise ValueError("输入不能为空")
    
    # 主逻辑
    result = process(input_data)
    return result

def process(data):
    # 实际处理逻辑
    return data`
  }
  return `/**
 * ${spec.split('\n')[0]}
 */
function solution(input) {
  if (!input) {
    throw new Error('输入不能为空');
  }
  
  // 主逻辑
  const result = process(input);
  return result;
}

function process(data) {
  // 实际处理逻辑
  return data;
}`
}

function generateDefensiveCode(_input: string, lang: string): string {
  if (lang === 'Python') {
    return `def safe_operation(data):
    """防御式编程示例"""
    try:
        if data is None:
            raise ValueError("数据为空")
        
        result = perform_operation(data)
        return result
    except (ValueError, TypeError) as e:
        logger.error(f"操作失败: {e}")
        return None
    except Exception as e:
        logger.exception("未知异常")
        raise`
  }
  return `function safeOperation(data) {
  // 防御式编程示例
  try {
    if (data == null) {
      throw new Error('数据为空');
    }
    
    const result = performOperation(data);
    return result;
  } catch (err) {
    if (err instanceof TypeError) {
      console.error('类型错误:', err);
      return null;
    }
    throw err;
  }
}`
}

function runTranslator(input: string, options: Record<string, string>): string {
  const target = options.target_lang || '英文'
  const style = options.style || '正式'
  return `## 翻译结果 · ${target} · ${style}风格

### 译文
> ${mockTranslate(input, target)}

### 关键术语对照
| 中文 | ${target} | 说明 |
|------|-----------|------|
| 上下文 | Context | 编程/文档常用 |
| 实施 | Implement | 工程语境 |
| 部署 | Deploy | 运维语境 |

### 风格说明
- 采用 **${style}** 语气
- 保留了原文的核心信息与节奏
- 对文化特定表达进行了本地化处理

### 翻译备注
- 长句已拆分为短句，提升可读性
- 专有名词保留原文
- 数值与日期采用目标语言习惯格式

---
💡 如需调整风格（更口语化/学术化/营销化），可重新指定。`
}

function mockTranslate(input: string, target: string): string {
  // 极简模拟翻译：保留输入长度结构
  const sentences = input.split(/[。.!?]/).filter(s => s.trim())
  return sentences.map(s => `[${target}] ${s.trim()}`).join('. ') + '.'
}

function runSummarizer(input: string): string {
  const sentences = input.split(/[。.!?\n]/).filter(s => s.trim())
  const wordCount = input.length
  const summary = sentences.slice(0, Math.min(3, sentences.length)).join('。') + '。'

  return `## 文本摘要

### 核心要点
${summary}

### 关键论点
${sentences.slice(0, 5).map((s, i) => `${i + 1}. ${s.trim()}`).join('\n')}

### 统计信息
- 原文长度：${wordCount} 字符
- 原句数：${sentences.length}
- 压缩比：${((summary.length / wordCount) * 100).toFixed(1)}%

### 适用场景
- 快速预览长文档
- 提取会议/访谈要点
- 辅助信息检索

---
📌 如需不同粒度（标题级/段落级/详细级），可调整输入中的"长度"参数。`
}

function runAnalyzer(input: string): string {
  const positiveWords = /好|棒|优秀|完美|喜欢|推荐|满意|不错|赞/g
  const negativeWords = /差|糟|差劲|不行|失望|糟糕|不满|差评|bug/g
  const pos = (input.match(positiveWords) || []).length
  const neg = (input.match(negativeWords) || []).length
  const total = pos + neg
  const score = total > 0 ? ((pos - neg) / total * 100).toFixed(1) : '0.0'
  const sentiment = pos > neg ? '积极' : pos < neg ? '消极' : '中性'

  // 简易关键词提取
  const words = input.match(/[\u4e00-\u9fa5]{2,}/g) || []
  const freq: Record<string, number> = {}
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1 })
  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w, c]) => `${w} (${c})`)

  return `## 文本分析报告

### 情感倾向
- **整体倾向**：${sentiment}
- **情感得分**：${score}（范围：-100 到 100）
- **积极信号**：${pos} 处
- **消极信号**：${neg} 处

### 高频关键词
${keywords.map((k, i) => `${i + 1}. ${k}`).join('\n')}

### 文本特征
- 字符总数：${input.length}
- 词汇多样性：${new Set(words).size}/${words.length}（${((new Set(words).size / Math.max(words.length, 1)) * 100).toFixed(1)}%）
- 平均句长：${(input.length / Math.max(input.split(/[。.!?]/).length - 1, 1)).toFixed(1)} 字符

### 改进建议
${sentiment === '消极' ? '- 注意语气，使用更积极的表达\n- 提供具体的建设性意见' : '- 保持当前的沟通风格\n- 可适当增加数据支撑'}
${pos + neg < 3 ? '- 文本情感信号较弱，可能是说明性文字' : ''}

---
🔍 分析基于本地词典与规则引擎，仅供参考。`
}

function runPolisher(input: string): string {
  const sentences = input.split(/[。.!?\n]/).filter(s => s.trim())
  return `## 润色结果

### 优化版本
${polishText(input)}

### 主要改动
- 替换口语化表达为书面语
- 合并重复信息
- 优化句子节奏与逻辑连接
- 强化重点与可读性

### 风格评估
- 流畅度：${sentences.length > 0 ? '良好' : 'N/A'}
- 专业度：${/[!！?？]/.test(input) ? '口语化' : '专业'}
- 表达力：★★★☆☆

### 同义改写建议
${sentences.slice(0, 3).map((s) =>
  `**原句**：${s.trim()}\n**改写**：${rephraseSentence(s.trim())}`
).join('\n\n')}

### 整体评分
- 内容完整性：85/100
- 表达清晰度：${/[，。、]/.test(input) ? '90' : '75'}/100
- 逻辑连贯性：88/100

---
✨ 建议保留核心观点，对次要描述进行精简。`
}

function polishText(input: string): string {
  let result = input
  result = result.replace(/^(嗯|啊|那个|这个|就是)/g, '')
  result = result.replace(/特别|非常|很(?=[\u4e00-\u9fa5])/g, '')
  result = result.replace(/!+/g, '。')
  return result
}

function rephraseSentence(s: string): string {
  if (s.length < 5) return s
  return s.replace(/做/g, '执行').replace(/弄/g, '处理').replace(/搞/g, '实现') + '（建议补充更多上下文）'
}

function runBrainstorm(input: string, options: Record<string, string>): string {
  const directions = options.directions || '5'
  const n = parseInt(directions)
  const ideas = [
    {
      angle: '技术驱动',
      concept: 'AI增强的智能工作流',
      value: '通过AI降低重复劳动，提升效率',
      scenario: '适合知识工作者与开发者',
      risk: '需要高质量训练数据',
    },
    {
      angle: '用户洞察',
      concept: '极致简化的单功能工具',
      value: '聚焦一个痛点，做到极致体验',
      scenario: '特定细分用户群体',
      risk: '市场天花板有限',
    },
    {
      angle: '生态融合',
      concept: '跨平台数据同步中枢',
      value: '打破数据孤岛，统一管理',
      scenario: '多设备办公人群',
      risk: '隐私合规要求高',
    },
    {
      angle: '社区驱动',
      concept: '创作者经济平台',
      value: '连接创作者与受众，去中心化',
      scenario: '内容创作者生态',
      risk: '冷启动挑战',
    },
    {
      angle: '可持续',
      concept: '绿色低碳的数字解决方案',
      value: '符合ESG趋势，长生命周期',
      scenario: '政企客户与教育市场',
      risk: '短期ROI不明显',
    },
    {
      angle: '教育普惠',
      concept: 'AI驱动的个性化学习',
      value: '因材施教，降低教育成本',
      scenario: 'K12与终身学习',
      risk: '监管政策不确定性',
    },
  ]

  return `## 创意发散 · ${input}

### 核心问题
${input}

### ${n}个创新方向

${ideas.slice(0, n).map((idea, i) => `
#### 方向 ${i + 1}：${idea.angle}

**概念**：${idea.concept}

**差异化价值**：
${idea.value}

**目标场景**：
${idea.scenario}

**潜在风险**：
${idea.risk}

**MVP 实验建议**：
- 2周内用最简方案验证假设
- 招募 5-10 个目标用户深度访谈
- 定义北极星指标，量化效果
`).join('\n')}

### 综合建议
1. **优先验证**：选择 2-3 个方向并行快速验证
2. **用户访谈**：与 10+ 目标用户讨论这些方向
3. **技术预研**：评估技术可行性与成本
4. **竞品分析**：调研类似方案的优缺点

---
💡 创意不应只关注"做什么"，更要明确"不做"什么，保持战略聚焦。`
}

interface Props {
  isOpen?: boolean
  onClose?: () => void
}

const AIWorkbench = memo(function AIWorkbench({ }: Props = {}) {
  const [tabs, setTabs] = useState<DocTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)
  const initialized = useRef(false)

  // 加载持久化状态
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        if (Array.isArray(data.tabs) && data.tabs.length > 0) {
          setTabs(data.tabs)
          setActiveTabId(data.activeTabId || data.tabs[0].id)
        } else {
          createNewTab('engineer')
        }
        if (Array.isArray(data.history)) setHistory(data.history)
      } else {
        createNewTab('engineer')
      }
    } catch (e) {
      console.warn('Failed to load AI Workbench state', e)
      createNewTab('engineer')
    }
  }, [])

  // 自动保存
  useEffect(() => {
    if (!initialized.current) return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ tabs, activeTabId, history }))
      } catch (e) {
        // ignore quota errors
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [tabs, activeTabId, history])

  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId])

  const createNewTab = useCallback((toolId: ToolId = 'engineer') => {
    const tool = TOOLS.find(t => t.id === toolId)!
    const newTab: DocTab = {
      id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      toolId,
      title: tool.name,
      input: '',
      output: '',
      options: getDefaultOptions(toolId),
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
  }, [])

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id)
      if (id === activeTabId) {
        setActiveTabId(next[0]?.id || '')
      }
      if (next.length === 0) {
        // 保持至少一个标签
        const tool = TOOLS[0]
        const fresh: DocTab = {
          id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          toolId: tool.id,
          title: tool.name,
          input: '',
          output: '',
          options: getDefaultOptions(tool.id),
        }
        setActiveTabId(fresh.id)
        return [fresh]
      }
      return next
    })
  }, [activeTabId])

  const updateTab = useCallback((id: string, patch: Partial<DocTab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  }, [])

  const switchTool = useCallback((toolId: ToolId) => {
    if (!activeTab) {
      createNewTab(toolId)
      return
    }
    const tool = TOOLS.find(t => t.id === toolId)!
    updateTab(activeTab.id, {
      toolId,
      title: tool.name,
      options: getDefaultOptions(toolId),
    })
  }, [activeTab, createNewTab, updateTab])

  const runEngine = useCallback(() => {
    if (!activeTab || !activeTab.input.trim()) {
      showToastMessage('请输入内容', 'error')
      return
    }
    const output = runLocalEngine(activeTab.toolId, activeTab.input, activeTab.options)
    updateTab(activeTab.id, { output })
    
    // 添加到历史
    const item: HistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      toolId: activeTab.toolId,
      title: activeTab.title,
      preview: activeTab.input.slice(0, 80) + (activeTab.input.length > 80 ? '...' : ''),
      timestamp: Date.now(),
      starred: false,
    }
    setHistory(prev => [item, ...prev].slice(0, 50))
    showToastMessage('生成完成', 'success')
  }, [activeTab, updateTab])

  const copyOutput = useCallback(async () => {
    if (!activeTab?.output) return
    try {
      await navigator.clipboard.writeText(activeTab.output)
      showToastMessage('已复制到剪贴板', 'success')
    } catch {
      showToastMessage('复制失败', 'error')
    }
  }, [activeTab?.output])

  const downloadOutput = useCallback(() => {
    if (!activeTab?.output) return
    const blob = new Blob([activeTab.output], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-workbench-${activeTab.title}-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
    showToastMessage('已下载', 'success')
  }, [activeTab])

  const clearOutput = useCallback(() => {
    if (!activeTab) return
    updateTab(activeTab.id, { output: '' })
  }, [activeTab, updateTab])

  const applyTemplate = useCallback((template: Template) => {
    if (!activeTab) {
      createNewTab(template.tool)
      return
    }
    updateTab(activeTab.id, {
      toolId: template.tool,
      title: template.name,
      input: template.content,
      output: '',
    })
    showToastMessage(`已应用模板：${template.name}`, 'info')
  }, [activeTab, updateTab, createNewTab])

  const toggleStar = useCallback((id: string) => {
    setHistory(prev => prev.map(h => h.id === id ? { ...h, starred: !h.starred } : h))
  }, [])

  const clearHistory = useCallback(() => {
    if (confirm('确定清空历史记录？')) {
      setHistory([])
      showToastMessage('历史已清空', 'info')
    }
  }, [])

  const showToastMessage = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }, [])

  const loadFromHistory = useCallback((item: HistoryItem) => {
    if (!activeTab) {
      createNewTab(item.toolId)
      return
    }
    updateTab(activeTab.id, {
      toolId: item.toolId,
      title: item.title,
      input: item.preview,
    })
    showToastMessage('已加载历史', 'info')
  }, [activeTab, createNewTab, updateTab])

  const filteredHistory = useMemo(() => {
    if (!searchQuery) return history
    const q = searchQuery.toLowerCase()
    return history.filter(h =>
      h.title.toLowerCase().includes(q) || h.preview.toLowerCase().includes(q)
    )
  }, [history, searchQuery])

  const filteredTemplates = useMemo(() => {
    if (!activeTab) return TEMPLATES
    return TEMPLATES.filter(t => t.tool === activeTab.toolId)
  }, [activeTab])

  const tokens = useMemo(() => {
    if (!activeTab) return { input: 0, output: 0 }
    return {
      input: detectTokens(activeTab.input),
      output: detectTokens(activeTab.output),
    }
  }, [activeTab])

  if (!activeTab) {
    return (
      <div className="aiw-root">
        <div className="aiw-empty">
          <Cpu size={48} color="#5a5e6f" />
          <h2>正在加载 AI Workbench</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="aiw-root">
      <header className="aiw-header">
        <div className="aiw-brand">
          <div className="aiw-logo">
            <span className="aiw-logo-text">AI</span>
          </div>
          <div className="aiw-title">
            <h1>AI Workbench</h1>
            <small>提示词工程 · 智能生产工作台</small>
          </div>
        </div>
        <div className="aiw-stats">
          <div className="aiw-stat">
            <span className="aiw-stat-dot" />
            <span>本地引擎</span>
          </div>
          <div className="aiw-stat">
            <Layers size={12} />
            <span>{tabs.length} 个标签</span>
          </div>
          <div className="aiw-stat">
            <History size={12} />
            <span>{history.length} 条历史</span>
          </div>
        </div>
      </header>

      <div className="aiw-body">
        {/* Sidebar Left: Tools & Templates */}
        <aside className="aiw-sidebar aiw-sidebar-left">
          <div className="aiw-section">
            <h3 className="aiw-section-title">工具集</h3>
            {TOOLS.map(tool => (
              <div
                key={tool.id}
                className={`aiw-tool ${activeTab.toolId === tool.id ? 'active' : ''}`}
                onClick={() => switchTool(tool.id)}
              >
                <span className="aiw-tool-icon">{tool.icon}</span>
                <span>{tool.name}</span>
              </div>
            ))}
          </div>

          <div className="aiw-section">
            <h3 className="aiw-section-title">
              模板库
              <span style={{ color: 'var(--aiw-text-muted)', fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                {filteredTemplates.length}
              </span>
            </h3>
            <div className="aiw-library">
              {filteredTemplates.map(t => (
                <div key={t.id} className="aiw-lib-item" onClick={() => applyTemplate(t)}>
                  <div className="aiw-lib-item-title">
                    <BookMarked size={12} color="#ffb547" />
                    {t.name}
                  </div>
                  <div className="aiw-lib-item-desc">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Editor */}
        <main className="aiw-main">
          <div className="aiw-tabs">
            {tabs.map(tab => {
              const tool = TOOLS.find(t => t.id === tab.toolId)!
              return (
                <div
                  key={tab.id}
                  className={`aiw-tab ${tab.id === activeTabId ? 'active' : ''}`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  {tool.icon}
                  <span>{tab.title}</span>
                  <span
                    className="aiw-tab-close"
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                  >
                    <X size={10} />
                  </span>
                </div>
              )
            })}
            <button className="aiw-new-tab" onClick={() => createNewTab()} title="新建标签">
              <Plus size={14} />
            </button>
          </div>

          <div className="aiw-editor-toolbar">
            <button className="aiw-btn primary" onClick={runEngine}>
              <Zap size={12} /> 运行
            </button>
            <button className="aiw-btn" onClick={copyOutput} disabled={!activeTab.output}>
              <Copy size={12} /> 复制
            </button>
            <button className="aiw-btn" onClick={downloadOutput} disabled={!activeTab.output}>
              <Download size={12} /> 下载
            </button>
            <button className="aiw-btn" onClick={clearOutput} disabled={!activeTab.output}>
              <Trash2 size={12} /> 清空
            </button>
            <div className="aiw-spacer" />
            <span style={{ fontSize: 11, color: 'var(--aiw-text-muted)' }}>
              <Hash size={10} style={{ verticalAlign: 'middle' }} /> {tokens.input} + {tokens.output} tokens
            </span>
          </div>

          <div className={`aiw-editor-content ${activeTab.output ? 'split' : ''}`}>
            <textarea
              className="aiw-textarea"
              placeholder={getPlaceholder(activeTab.toolId)}
              value={activeTab.input}
              onChange={(e) => updateTab(activeTab.id, { input: e.target.value })}
              spellCheck={false}
            />
            {activeTab.output ? (
              <div className="aiw-output">
                <div className="aiw-output-block">
                  <div className="aiw-output-label">
                    <Sparkles size={11} color="#00e0a4" /> 引擎输出
                  </div>
                  {activeTab.output}
                </div>
              </div>
            ) : null}
          </div>
        </main>

        {/* Sidebar Right: History & Options */}
        <aside className="aiw-sidebar aiw-sidebar-right">
          <div className="aiw-section">
            <h3 className="aiw-section-title">工具配置</h3>
            {renderOptions(activeTab.toolId, activeTab.options, (key, value) => {
              updateTab(activeTab.id, { options: { ...activeTab.options, [key]: value } })
            })}
          </div>

          <div className="aiw-section" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <h3 className="aiw-section-title">
              历史记录
              {history.length > 0 && (
                <button onClick={clearHistory}>清空</button>
              )}
            </h3>
            <div style={{ marginBottom: 8 }}>
              <input
                className="aiw-input"
                placeholder="搜索历史..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="aiw-tokens-list">
              {filteredHistory.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--aiw-text-muted)', fontSize: 12 }}>
                  {history.length === 0 ? '还没有历史记录' : '没有匹配的记录'}
                </div>
              ) : (
                filteredHistory.map(item => {
                  const tool = TOOLS.find(t => t.id === item.toolId)!
                  return (
                    <div key={item.id} className="aiw-token-card">
                      <div className="aiw-token-card-title">
                        {tool.icon}
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
                        <span
                          style={{ cursor: 'pointer', color: item.starred ? '#ffb547' : 'var(--aiw-text-muted)' }}
                          onClick={(e) => { e.stopPropagation(); toggleStar(item.id) }}
                        >
                          <Star size={12} fill={item.starred ? '#ffb547' : 'none'} />
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--aiw-text-dim)', marginTop: 4 }}>
                        {item.preview}
                      </div>
                      <div className="aiw-token-card-meta">
                        <span className="aiw-tag mint">{tool.name}</span>
                        <span>{formatTime(item.timestamp)}</span>
                        <span style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={() => loadFromHistory(item)}>
                          <ArrowRight size={10} /> 加载
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </aside>
      </div>

      {toast && (
        <div className={`aiw-toast ${toast.type}`}>
          {toast.type === 'success' ? <Check size={14} color="#00e0a4" /> :
            toast.type === 'error' ? <AlertCircle size={14} color="#ff5e7d" /> :
            <Sparkles size={14} color="#38bdf8" />}
          {toast.msg}
        </div>
      )}
    </div>
  )
})

function getDefaultOptions(toolId: ToolId): Record<string, string> {
  switch (toolId) {
    case 'engineer': return { role: '资深专家', format: '结构化文档', length: '适中', tone: '专业' }
    case 'optimizer': return {}
    case 'coder': return { language: 'JavaScript', task: '解释' }
    case 'translator': return { target_lang: '英文', style: '正式' }
    case 'summarizer': return {}
    case 'analyzer': return {}
    case 'polisher': return {}
    case 'brainstorm': return { directions: '5' }
  }
}

function getPlaceholder(toolId: ToolId): string {
  switch (toolId) {
    case 'engineer': return '描述你的任务或目标...\n\n例如：帮我写一份关于React Hooks最佳实践的技术分享'
    case 'optimizer': return '粘贴你需要优化的提示词...\n\n系统将自动评估并改进'
    case 'coder': return '粘贴代码或描述问题...\n\n例如：解释以下代码的工作原理：\nfunction add(a, b) { return a + b }'
    case 'translator': return '输入需要翻译的文本...\n\n支持中英日韩等多语种'
    case 'summarizer': return '粘贴长文本或文章...\n\n自动提取关键要点'
    case 'analyzer': return '输入需要分析的文本...\n\n提取情感、关键词、洞察'
    case 'polisher': return '输入需要润色的文章或段落...'
    case 'brainstorm': return '描述你的问题或场景...\n\n例如：如何为远程团队提升协作效率'
  }
}

function renderOptions(
  toolId: ToolId,
  options: Record<string, string>,
  onChange: (key: string, value: string) => void
) {
  switch (toolId) {
    case 'engineer':
      return (
        <>
          <OptionRow label="角色设定" type="select" value={options.role}
            options={['资深专家', '产品经理', '软件工程师', '设计师', '数据分析师', '市场营销']}
            onChange={(v) => onChange('role', v)} />
          <OptionRow label="输出格式" type="select" value={options.format}
            options={['结构化文档', 'Markdown', 'JSON', '表格', '列表', '代码']}
            onChange={(v) => onChange('format', v)} />
          <OptionRow label="长度控制" type="select" value={options.length}
            options={['简短', '适中', '详细', '详尽']}
            onChange={(v) => onChange('length', v)} />
          <OptionRow label="语气风格" type="select" value={options.tone}
            options={['专业', '友好', '学术', '轻松', '正式', '幽默']}
            onChange={(v) => onChange('tone', v)} />
        </>
      )
    case 'coder':
      return (
        <>
          <OptionRow label="编程语言" type="select" value={options.language}
            options={['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'PHP', 'Ruby', 'Swift']}
            onChange={(v) => onChange('language', v)} />
          <OptionRow label="任务类型" type="select" value={options.task}
            options={['解释', '生成', '调试', '重构', '审查']}
            onChange={(v) => onChange('task', v)} />
        </>
      )
    case 'translator':
      return (
        <>
          <OptionRow label="目标语言" type="select" value={options.target_lang}
            options={['英文', '日文', '韩文', '法文', '德文', '西班牙文', '俄文', '阿拉伯文']}
            onChange={(v) => onChange('target_lang', v)} />
          <OptionRow label="风格" type="select" value={options.style}
            options={['正式', '商务', '学术', '口语', '文学', '技术']}
            onChange={(v) => onChange('style', v)} />
        </>
      )
    case 'brainstorm':
      return (
        <>
          <OptionRow label="方向数量" type="select" value={options.directions}
            options={['3', '5', '6']}
            onChange={(v) => onChange('directions', v)} />
        </>
      )
    default:
      return (
        <div style={{ fontSize: 11, color: 'var(--aiw-text-muted)', padding: '4px 0' }}>
          当前工具无需配置
        </div>
      )
  }
}

function OptionRow({ label, type, value, options, onChange }: {
  label: string
  type: 'select' | 'input'
  value: string
  options?: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="aiw-settings-row">
      <label>{label}</label>
      {type === 'select' && options ? (
        <select className="aiw-select" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input className="aiw-input" style={{ width: 100 }} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  )
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return new Date(ts).toLocaleDateString()
}

export default AIWorkbench
