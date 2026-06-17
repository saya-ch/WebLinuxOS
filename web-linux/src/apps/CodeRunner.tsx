import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { marked } from 'marked'

interface Language {
  id: string
  name: string
  icon: string
  monacoLang: string
  template: string
  runCommand?: string
}

const languages: Language[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    icon: 'JS',
    monacoLang: 'javascript',
    template: `// JavaScript 示例代码
console.log("Hello, WebLinuxOS!");

// 数组操作示例
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("数组加倍:", doubled);

// 计算耗时示例
const sum = numbers.reduce((a, b) => a + b, 0);
console.log("求和结果:", sum);

// 错误示例 (可尝试取消注释)
// throw new Error("模拟错误");
`
  },
  {
    id: 'python',
    name: 'Python',
    icon: 'PY',
    monacoLang: 'python',
    template: `# Python 示例代码
print("Hello, WebLinuxOS!")

# 列表操作示例
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print(f"数组加倍: {doubled}")

# 类定义示例
class Calculator:
    def add(self, a, b):
        return a + b

    def multiply(self, a, b):
        return a * b

calc = Calculator()
print(f"5 + 3 = {calc.add(5, 3)}")
print(f"5 * 3 = {calc.multiply(5, 3)}")
`
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    icon: 'TS',
    monacoLang: 'typescript',
    template: `// TypeScript 示例代码
// 提示：当前环境按 JavaScript 执行（类型擦除后执行）

interface User {
  id: number;
  name: string;
  email: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}

const user: User = {
  id: 1,
  name: "WebLinuxOS User",
  email: "user@example.com"
};

console.log(greet(user));

// 泛型示例
function identity<T>(arg: T): T {
  return arg;
}

console.log(identity<string>("TypeScript works!"));
console.log(identity<number>(42));
`
  },
  {
    id: 'html',
    name: 'HTML/CSS',
    icon: 'HTML',
    monacoLang: 'html',
    template: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>WebLinuxOS Demo</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .card {
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(10px);
      padding: 2rem 3rem;
      border-radius: 1rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      text-align: center;
      border: 1px solid rgba(255,255,255,0.2);
    }
    h1 { color: #fff; margin: 0 0 0.5em; }
    p { color: rgba(255,255,255,0.9); }
    button {
      margin-top: 1rem;
      padding: 0.6em 1.4em;
      border: none;
      border-radius: 999px;
      background: #fff;
      color: #764ba2;
      font-weight: 700;
      cursor: pointer;
    }
    button:hover { transform: translateY(-1px); }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello, WebLinuxOS!</h1>
    <p>这是一个 HTML/CSS 预览演示</p>
    <button onclick="alert('欢迎使用 CodeRunner!')">点击我</button>
  </div>
</body>
</html>
`
  },
  {
    id: 'markdown',
    name: 'Markdown',
    icon: 'MD',
    monacoLang: 'markdown',
    template: `# WebLinuxOS 文档

## 简介

WebLinuxOS 是一个基于 Web 的 Linux 桌面环境，提供 **120+ 应用程序** 与丰富的命令行工具。

### 特性

- 多虚拟桌面支持
- 现代化深色主题 + 紫蓝渐变强调色
- 90+ 终端命令

## 代码示例

\`\`\`javascript
console.log("Hello, WebLinuxOS!");
\`\`\`

## 表格示例

| 功能 | 状态 |
|------|------|
| 桌面环境 | ✅ 完成 |
| 终端 | ✅ 完成 |
| 文件管理 | ✅ 完成 |

> 提示：可以在右侧标签页切换"预览"查看实时渲染效果。

[访问 WebLinuxOS](#)
`
  },
  {
    id: 'json',
    name: 'JSON',
    icon: 'JSON',
    monacoLang: 'json',
    template: `{
  "name": "WebLinuxOS",
  "version": "6.2.0",
  "description": "基于Web的Linux桌面环境",
  "features": [
    "多虚拟桌面",
    "120+应用程序",
    "90+终端命令"
  ],
  "author": {
    "name": "WebLinuxOS Team",
    "url": "https://github.com/"
  },
  "stats": {
    "downloads": 10000,
    "stars": 512,
    "isActive": true
  }
}
`
  },
  {
    id: 'sql',
    name: 'SQL',
    icon: 'SQL',
    monacoLang: 'sql',
    template: `-- SQL 模拟查询演示
-- 支持: CREATE TABLE / INSERT INTO / SELECT / UPDATE / DELETE

CREATE TABLE users (
  id INT,
  name VARCHAR(100),
  email VARCHAR(100),
  age INT
);

INSERT INTO users (id, name, email, age) VALUES (1, 'Alice', 'alice@example.com', 28);
INSERT INTO users (id, name, email, age) VALUES (2, 'Bob', 'bob@example.com', 32);
INSERT INTO users (id, name, email, age) VALUES (3, 'Charlie', 'charlie@example.com', 24);
INSERT INTO users (id, name, email, age) VALUES (4, 'Diana', 'diana@example.com', 30);

-- 查询全部
SELECT * FROM users;

-- 带 WHERE 条件
SELECT name, age FROM users WHERE age > 25;

-- 更新
UPDATE users SET age = 29 WHERE id = 1;
SELECT * FROM users WHERE id = 1;

-- 删除
DELETE FROM users WHERE id = 4;
SELECT * FROM users;
`
  },
  {
    id: 'bash',
    name: 'Bash',
    icon: 'SH',
    monacoLang: 'shell',
    template: `#!/bin/bash
# Bash 脚本模拟执行
# 支持: echo / pwd / ls / cat / date / whoami / uname / clear / help

echo "Hello, WebLinuxOS!"
echo "-----------------------"

# 变量与字符串
name="WebLinuxOS"
version="6.2.0"
echo "项目: $name, 版本: $version"

# 系统信息
echo "-----------------------"
date
echo "用户: $(whoami)"
echo "当前目录: $(pwd)"
echo "系统: $(uname -a)"

# 循环
echo "-----------------------"
for i in 1 2 3 4 5; do
  echo "计数: $i"
done

# 列出目录
echo "-----------------------"
echo "目录内容:"
ls -la
`
  }
]

interface OutputLine {
  type: 'stdout' | 'stderr' | 'info' | 'error'
  content: string
  timestamp: Date
}

type RightPanel = 'output' | 'preview'

// ---------- JavaScript 执行沙盒 ----------
interface SandboxResult {
  logs: OutputLine[]
  durationMs: number
  error?: string
}

function stringifyValue(v: unknown): string {
  if (v === undefined) return 'undefined'
  if (v === null) return 'null'
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v, (_k, val) => {
      if (typeof val === 'bigint') return val.toString() + 'n'
      if (typeof val === 'function') return '[Function]'
      if (typeof val === 'symbol') return val.toString()
      if (val instanceof Error) return { name: val.name, message: val.message, stack: val.stack }
      return val
    }, 2)
  } catch {
    return String(v)
  }
}

async function runJavaScriptSandbox(code: string): Promise<SandboxResult> {
  const logs: OutputLine[] = []
  const now = () => new Date()
  const push = (type: OutputLine['type'], content: string) => {
    logs.push({ type, content, timestamp: now() })
  }
  const start = performance.now()

  const customConsole = {
    log: (...args: unknown[]) => push('stdout', args.map(stringifyValue).join(' ')),
    info: (...args: unknown[]) => push('info', args.map(stringifyValue).join(' ')),
    warn: (...args: unknown[]) => push('stderr', args.map(stringifyValue).join(' ')),
    error: (...args: unknown[]) => push('stderr', args.map(stringifyValue).join(' ')),
    debug: (...args: unknown[]) => push('stdout', args.map(stringifyValue).join(' ')),
    clear: () => { logs.length = 0 }
  }

  try {
    const fn = new Function('console', `
      "use strict";
      return (async () => {
        ${code}
      })();
    `)
    const result = await fn(customConsole)
    if (result !== undefined) {
      push('stdout', '=> ' + stringifyValue(result))
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    push('error', message)
  }

  return { logs, durationMs: performance.now() - start }
}

// ---------- TypeScript 简化类型擦除 ----------
// 仅做非常基础的类型擦除，足以处理模板里的 interface 和 : Type 标注
function stripTypeScript(src: string): string {
  let out = src
  // 删除单行注释中的类型声明？不需要 —— 我们删除显式 TS 声明块
  // 删除 interface / type / enum / abstract class / implements 声明 (非常简化)
  out = out.replace(/^\s*interface\s+[A-Za-z_$][\w$]*\s*\{[\s\S]*?\}/gm, '')
  out = out.replace(/^\s*type\s+[A-Za-z_$][\w$]*\s*=[^;]+;/gm, '')
  out = out.replace(/^\s*declare\s+.*$/gm, '')
  out = out.replace(/^\s*(export\s+)?\s*enum\s+[A-Za-z_$][\w$]*\s*\{[\s\S]*?\}/gm, '')
  // 删除 : Type 标注 (变量、形参、函数返回、属性)
  // 形如 ": Type", ": Array<X>", ": X | Y", ": { ... }"
  const typeAnnotationRegex = /:\s*([A-Za-z_$][\w$<>.,\[\]|&\s]*|\{[\s\S]*?\})/g
  out = out.replace(typeAnnotationRegex, '')
  // 删除 <T> 泛型标注 (保留 function identity)
  out = out.replace(/<[A-Za-z_$][\w$<>.,\s]*>/g, '')
  // 删除 "as Type"
  out = out.replace(/\s+as\s+[A-Za-z_$][\w$<>.,\[\]|&\s]*/g, '')
  // 删除 "!" 非空断言
  out = out.replace(/(\w)!/g, '$1')
  // 清除 "implements X, Y" / "extends X implements Y"
  out = out.replace(/implements\s+[A-Za-z_$][\w$,\s]*/g, '')
  // 删除 public / private / protected / readonly 修饰符 (类字段)
  out = out.replace(/^\s*(public|private|protected|readonly)\s+/gm, ' ')
  return out
}

// ---------- JSON 格式化 ----------
function formatJSON(src: string): { ok: boolean; output: string; error?: string } {
  try {
    const parsed = JSON.parse(src)
    return { ok: true, output: JSON.stringify(parsed, null, 2) }
  } catch (e) {
    return { ok: false, output: '', error: e instanceof Error ? e.message : String(e) }
  }
}

// ---------- SQL 模拟引擎 ----------
type Row = Record<string, unknown>
interface SQLTable {
  name: string
  columns: string[]
  rows: Row[]
}

interface SQLResult {
  message?: string
  rows?: Row[]
  columns?: string[]
  error?: string
}

function runSQLSimulation(script: string): SQLResult[] {
  const tables: Record<string, SQLTable> = {}
  const statements = splitSQLStatements(script)
  const results: SQLResult[] = []

  for (const raw of statements) {
    const stmt = raw.trim()
    if (!stmt) continue
    try {
      const res = executeSQLStatement(stmt, tables)
      if (res) results.push(res)
    } catch (e) {
      results.push({ error: e instanceof Error ? e.message : String(e) })
    }
  }
  return results
}

function splitSQLStatements(script: string): string[] {
  // 逐字符扫描，考虑字符串中的 ';' 不分隔
  const out: string[] = []
  let cur = ''
  let inStr: string | null = null
  for (let i = 0; i < script.length; i++) {
    const c = script[i]
    if (inStr) {
      cur += c
      if (c === inStr && script[i - 1] !== '\\') inStr = null
    } else if (c === "'" || c === '"' || c === '`') {
      inStr = c
      cur += c
    } else if (c === ';') {
      out.push(cur)
      cur = ''
    } else {
      cur += c
    }
  }
  if (cur.trim()) out.push(cur)
  return out
}

function executeSQLStatement(stmt: string, tables: Record<string, SQLTable>): SQLResult | null {
  const upper = stmt.toUpperCase().trim()
  // CREATE TABLE
  if (upper.startsWith('CREATE TABLE')) {
    const m = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([A-Za-z_][\w$]*)["`]?\s*\(([\s\S]+)\)\s*;?\s*$/i.exec(stmt)
    if (!m) return { error: 'CREATE TABLE 语法错误' }
    const name = m[1]
    const cols = m[2].split(',').map((c) => c.trim().split(/\s+/)[0]).filter((c) => c.toUpperCase() !== 'PRIMARY' && c.toUpperCase() !== 'FOREIGN' && c.toUpperCase() !== 'UNIQUE' && c.toUpperCase() !== 'KEY')
    tables[name] = { name, columns: cols.map((c) => c.replace(/[`"']/g, '')), rows: [] }
    return { message: `表 ${name} 已创建 (${cols.length} 列)` }
  }

  // INSERT INTO
  if (upper.startsWith('INSERT INTO')) {
    const m = /INSERT\s+INTO\s+["`]?([A-Za-z_][\w$]*)["`]?\s*(?:\(([^)]+)\))?\s*VALUES\s*\(([\s\S]+?)\)\s*;?\s*$/i.exec(stmt)
    if (!m) return { error: 'INSERT 语法错误' }
    const tname = m[1]
    const colNames = m[2] ? m[2].split(',').map((c) => c.trim().replace(/[`"']/g, '')) : null
    const valueStr = m[3]
    const values = parseSQLValueList(valueStr)
    const table = tables[tname]
    if (!table) return { error: `表 ${tname} 不存在` }
    const cols = colNames || table.columns
    if (cols.length !== values.length) {
      return { error: `列数 (${cols.length}) 与值数 (${values.length}) 不匹配` }
    }
    const row: Row = {}
    cols.forEach((c, i) => { row[c] = values[i] })
    table.rows.push(row)
    return { message: `已插入 1 行到 ${tname}` }
  }

  // SELECT
  if (upper.startsWith('SELECT')) {
    return executeSelect(stmt, tables)
  }

  // UPDATE
  if (upper.startsWith('UPDATE')) {
    return executeUpdate(stmt, tables)
  }

  // DELETE
  if (upper.startsWith('DELETE')) {
    return executeDelete(stmt, tables)
  }

  // DROP TABLE
  if (upper.startsWith('DROP TABLE')) {
    const m = /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?["`]?([A-Za-z_][\w$]*)["`]?/i.exec(stmt)
    if (!m) return { error: 'DROP TABLE 语法错误' }
    if (tables[m[1]]) { delete tables[m[1]]; return { message: `表 ${m[1]} 已删除` } }
    return { error: `表 ${m[1]} 不存在` }
  }

  // SHOW TABLES / SHOW TABLE
  if (upper.startsWith('SHOW')) {
    return { message: '现有表: ' + Object.keys(tables).join(', ') }
  }

  return { error: '不支持的语句: ' + stmt.slice(0, 60) }
}

function parseSQLValueList(input: string): unknown[] {
  // 处理带引号字符串、数字、null
  const out: unknown[] = []
  let buf = ''
  let inStr: string | null = null
  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (inStr) {
      buf += c
      if (c === inStr && input[i - 1] !== '\\') { inStr = null }
    } else if (c === "'" || c === '"' || c === '`') {
      inStr = c
      buf += c
    } else if (c === ',') {
      out.push(parseSQLScalar(buf.trim()))
      buf = ''
    } else {
      buf += c
    }
  }
  if (buf.trim()) out.push(parseSQLScalar(buf.trim()))
  return out
}

function parseSQLScalar(v: string): unknown {
  if (v === '') return ''
  if (v.toUpperCase() === 'NULL') return null
  if (v.toUpperCase() === 'TRUE') return true
  if (v.toUpperCase() === 'FALSE') return false
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"')) || (v.startsWith('`') && v.endsWith('`'))) {
    return v.slice(1, -1)
  }
  // 尝试 NOW() / DATE() / DATETIME() 等函数
  if (/^NOW\s*\(\s*\)$/i.test(v)) return new Date().toISOString()
  const num = Number(v)
  if (!Number.isNaN(num) && /^-?\d+(\.\d+)?$/.test(v)) return num
  return v
}

function parseWhereClause(where: string, row: Row): boolean {
  // 支持: col = value, col != value, col > value, col < value, col >= value, col <= value, col LIKE '%xx%', col IS NULL
  // 支持 AND 组合 (每一个条件用 AND 分隔)
  const parts = where.split(/\s+AND\s+/i)
  return parts.every((part) => evaluateWhereCondition(part.trim(), row))
}

function evaluateWhereCondition(cond: string, row: Row): boolean {
  const m =
    /^([A-Za-z_][\w$]*)\s*(=|<>|!=|>=|<=|>|<|LIKE|IS)\s*(.+)$/i.exec(cond)
  if (!m) return false
  const col = m[1]
  const op = m[2].toUpperCase()
  const rawVal = m[3].trim()
  const val = parseSQLScalar(rawVal)
  const rowVal = row[col]
  switch (op) {
    case '=': return String(rowVal) === String(val)
    case '<>':
    case '!=': return String(rowVal) !== String(val)
    case '>': return Number(rowVal) > Number(val)
    case '<': return Number(rowVal) < Number(val)
    case '>=': return Number(rowVal) >= Number(val)
    case '<=': return Number(rowVal) <= Number(val)
    case 'LIKE': {
      const pattern = String(val).replace(/%/g, '.*').replace(/_/g, '.')
      return new RegExp('^' + pattern + '$', 'i').test(String(rowVal))
    }
    case 'IS': {
      const s = String(val).toUpperCase()
      if (s === 'NULL') return rowVal === null || rowVal === undefined
      if (s === 'TRUE') return rowVal === true
      if (s === 'FALSE') return rowVal === false
      return false
    }
    default: return false
  }
}

function executeSelect(stmt: string, tables: Record<string, SQLTable>): SQLResult {
  const m = /SELECT\s+([\s\S]+?)\s+FROM\s+["`]?([A-Za-z_][\w$]*)["`]?(?:\s+WHERE\s+([\s\S]+?))?\s*;?\s*$/i.exec(stmt)
  if (!m) return { error: 'SELECT 语法错误' }
  const colsPart = m[1].trim()
  const tableName = m[2]
  const where = m[3]
  const table = tables[tableName]
  if (!table) return { error: `表 ${tableName} 不存在` }
  let rows = table.rows.slice()
  if (where) rows = rows.filter((r) => parseWhereClause(where.trim(), r))
  let outCols: string[] = []
  let outRows: Row[] = []
  if (colsPart.trim() === '*') {
    outCols = table.columns
    outRows = rows
  } else {
    outCols = colsPart.split(',').map((c) => c.trim().replace(/[`"']/g, ''))
    outRows = rows.map((r) => {
      const nr: Row = {}
      outCols.forEach((c) => { nr[c] = r[c] })
      return nr
    })
  }
  return { columns: outCols, rows: outRows, message: `查询到 ${outRows.length} 行` }
}

function executeUpdate(stmt: string, tables: Record<string, SQLTable>): SQLResult {
  const m = /UPDATE\s+["`]?([A-Za-z_][\w$]*)["`]?\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+?))?\s*;?\s*$/i.exec(stmt)
  if (!m) return { error: 'UPDATE 语法错误' }
  const tableName = m[1]
  const setPart = m[2]
  const where = m[3]
  const table = tables[tableName]
  if (!table) return { error: `表 ${tableName} 不存在` }
  const assignments = setPart.split(',').map((a) => {
    const am = /^\s*([A-Za-z_][\w$]*)\s*=\s*(.+)$/i.exec(a.trim())
    if (!am) throw new Error('SET 子句语法错误: ' + a)
    return { col: am[1], value: parseSQLScalar(am[2].trim()) }
  })
  let count = 0
  for (const row of table.rows) {
    if (!where || parseWhereClause(where.trim(), row)) {
      assignments.forEach(({ col, value }) => { row[col] = value })
      count++
    }
  }
  return { message: `已更新 ${count} 行` }
}

function executeDelete(stmt: string, tables: Record<string, SQLTable>): SQLResult {
  const m = /DELETE\s+FROM\s+["`]?([A-Za-z_][\w$]*)["`]?(?:\s+WHERE\s+([\s\S]+?))?\s*;?\s*$/i.exec(stmt)
  if (!m) return { error: 'DELETE 语法错误' }
  const tableName = m[1]
  const where = m[2]
  const table = tables[tableName]
  if (!table) return { error: `表 ${tableName} 不存在` }
  const beforeLen = table.rows.length
  if (where) {
    table.rows = table.rows.filter((r) => !parseWhereClause(where.trim(), r))
  } else {
    table.rows = []
  }
  return { message: `已删除 ${beforeLen - table.rows.length} 行` }
}

// ---------- Bash 脚本模拟 ----------
interface BashState {
  vars: Record<string, string>
  stdout: string[]
  cwd: string
  files: Record<string, string>
  cleared: boolean
}

function expandVariables(input: string, state: BashState): string {
  // 处理 $VAR / ${VAR} / $(cmd) 形式
  return input
    .replace(/\$\{([A-Za-z_][\w$]*)\}/g, (_m, name) => state.vars[name] ?? '')
    .replace(/\$([A-Za-z_][\w$]*)/g, (_m, name) => state.vars[name] ?? '')
    .replace(/\$\(([^)]*)\)/g, (_m, cmd) => {
      const sub: BashState = { ...state, stdout: [], vars: { ...state.vars } }
      runBashLine(cmd, sub)
      return sub.stdout.join('\n')
    })
}

function runBashLine(rawLine: string, state: BashState): void {
  const line = rawLine.trim()
  if (!line) return
  if (line.startsWith('#')) return

  // 变量赋值: NAME=value
  const assignMatch = /^([A-Za-z_][\w$]*)=(.*)$/.exec(line)
  if (assignMatch && !/\s/.test(line.slice(0, assignMatch.index + assignMatch[1].length))) {
    const name = assignMatch[1]
    let value = assignMatch[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    value = expandVariables(value, state)
    state.vars[name] = value
    return
  }

  // for i in 1 2 3; do ... ; done  (简单单行)
  const forMatch = /^for\s+([A-Za-z_][\w$]*)\s+in\s+(.+?);?\s*do\s+(.+?)\s*;?\s*done$/i.exec(line)
  if (forMatch) {
    const varName = forMatch[1]
    const items = forMatch[2].trim().split(/\s+/).map((s) => expandVariables(s, state))
    const body = forMatch[3]
    for (const item of items) {
      state.vars[varName] = item
      // body 中可能包含多个用 ; 分隔的命令
      body.split(';').forEach((c) => runBashLine(c.trim(), state))
    }
    return
  }

  // if [ "X" == "Y" ]; then ... ; fi
  const ifMatch = /^if\s*\[\s*(.+?)\s*\];?\s*then\s+(.+?)\s*;?\s*fi$/i.exec(line)
  if (ifMatch) {
    const condition = ifMatch[1]
    const body = ifMatch[2]
    // 简单处理 "A" == "B" / "A" != "B" / -n / -z
    const cond = expandVariables(condition, state)
    let pass = false
    const eq = /^["']?(.+?)["']?\s*(==|!=)\s*["']?(.+?)["']?$/.exec(cond)
    if (eq) {
      const a = eq[1].trim(); const b = eq[3].trim(); const op = eq[2]
      pass = op === '==' ? a === b : a !== b
    } else if (/^-n\s+(.+)$/.test(cond)) {
      pass = /^-n\s+(.+)$/.exec(cond)![1].length > 0
    } else if (/^-z\s+(.+)$/.test(cond)) {
      pass = /^-z\s+(.+)$/.exec(cond)![1].length === 0
    } else {
      pass = cond.trim() !== '' && cond.trim() !== '0'
    }
    if (pass) {
      body.split(';').forEach((c) => runBashLine(c.trim(), state))
    }
    return
  }

  // 解析命令
  const tokens = line.split(/\s+/)
  const cmd = tokens[0]
  const args = tokens.slice(1).map((a) => expandVariables(a, state))
  switch (cmd) {
    case 'echo':
      state.stdout.push(args.join(' '))
      return
    case 'pwd':
      state.stdout.push(state.cwd)
      return
    case 'whoami':
      state.stdout.push(state.vars['USER'] || 'user')
      return
    case 'date':
      state.stdout.push(new Date().toString())
      return
    case 'uname':
      if (args.includes('-a') || args.includes('--all')) {
        state.stdout.push('WebLinuxOS 6.2.0 #1 SMP Web x86_64 GNU/Linux (模拟)')
      } else {
        state.stdout.push('WebLinuxOS')
      }
      return
    case 'clear':
    case 'cls':
      state.cleared = true
      return
    case 'help':
      state.stdout.push('可用命令: echo, pwd, ls, cat, date, whoami, uname, clear, help')
      return
    case 'ls': {
      const all = args.includes('-a') || args.includes('-la') || args.includes('-al')
      const long = args.includes('-l') || args.includes('-la') || args.includes('-al')
      const files = Object.keys(state.files)
      const dots = all ? ['.', '..'] : []
      const list = [...dots, ...files]
      if (long) {
        list.forEach((f) => {
          const size = state.files[f]?.length || 4096
          state.stdout.push(`drwxr-xr-x  user user ${String(size).padStart(6)} Jun 18 12:00 ${f}`)
        })
      } else {
        state.stdout.push(list.join('  '))
      }
      return
    }
    case 'cat': {
      if (args.length === 0) {
        state.stdout.push('cat: 缺少文件参数')
        return
      }
      for (const f of args) {
        if (state.files[f] !== undefined) state.stdout.push(state.files[f])
        else state.stdout.push(`cat: ${f}: 没有那个文件或目录`)
      }
      return
    }
    case 'touch':
      for (const f of args) {
        if (state.files[f] === undefined) state.files[f] = ''
      }
      return
    case 'mkdir':
      for (const f of args) state.files[f + '/'] = ''
      return
    case 'rm':
      for (const f of args) delete state.files[f]
      return
    default:
      state.stdout.push(`${cmd}: 命令未找到 (模拟环境)`)
  }
}

function runBashScript(script: string): { output: string; durationMs: number } {
  const start = performance.now()
  const state: BashState = {
    vars: {
      USER: 'user',
      HOME: '/home/user',
      SHELL: '/bin/bash'
    },
    stdout: [],
    cwd: '/home/user',
    files: {
      'readme.md': '# WebLinuxOS\n欢迎使用 CodeRunner 的 Bash 模拟环境。',
      'notes.txt': '学习笔记\n- JavaScript\n- TypeScript\n- SQL\n',
      'config.json': '{\n  "theme": "dark",\n  "version": "6.2.0"\n}\n'
    },
    cleared: false
  }
  // 按行执行 (支持 \ 续行简化忽略)
  script.split(/\r?\n/).forEach((line) => {
    if (state.cleared) { state.stdout = []; state.cleared = false }
    runBashLine(line, state)
  })
  return { output: state.stdout.join('\n'), durationMs: performance.now() - start }
}

// ---------- Markdown 渲染 ----------
async function renderMarkdown(md: string): Promise<string> {
  marked.setOptions({
    breaks: true,
    gfm: true
  })
  return await marked.parse(md)
}

// ---------- UI 组件 ----------
const CodeRunner = memo(function CodeRunner() {
  const [selectedLang, setSelectedLang] = useState<Language>(languages[0])
  const [code, setCode] = useState(selectedLang.template)
  const [output, setOutput] = useState<OutputLine[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [rightPanel, setRightPanel] = useState<RightPanel>('output')
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [markdownHtml, setMarkdownHtml] = useState<string>('')
  const [sqlResults, setSqlResults] = useState<SQLResult[] | null>(null)
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLTextAreaElement>(null)
  const outputEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCode(selectedLang.template)
    setOutput([])
    setSqlResults(null)
    setHtmlContent('')
    setMarkdownHtml('')
    setRightPanel(selectedLang.id === 'html' || selectedLang.id === 'markdown' ? 'preview' : 'output')
  }, [selectedLang])

  useEffect(() => {
    // 自动滚动到底部
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [output])

  const addOutput = useCallback((type: OutputLine['type'], content: string) => {
    setOutput((prev) => [...prev, { type, content, timestamp: new Date() }])
  }, [])

  const runCode = useCallback(async () => {
    setIsRunning(true)
    setOutput([])
    setSqlResults(null)
    const start = performance.now()
    const src = code

    try {
      switch (selectedLang.id) {
        case 'javascript': {
          const res = await runJavaScriptSandbox(src)
          setOutput((prev) => [
            ...prev,
            { type: 'info', content: `▶ 执行 JavaScript (${res.durationMs.toFixed(1)} ms)`, timestamp: new Date() },
            ...res.logs,
            { type: 'info', content: `完成 (${res.durationMs.toFixed(1)} ms)`, timestamp: new Date() }
          ])
          setRightPanel('output')
          break
        }
        case 'typescript': {
          addOutput('info', 'ℹ TypeScript 在模拟环境中按 JavaScript 执行（仅做基础类型擦除）')
          const stripped = stripTypeScript(src)
          const res = await runJavaScriptSandbox(stripped)
          setOutput((prev) => [
            ...prev,
            { type: 'info', content: `▶ 执行 TypeScript (${res.durationMs.toFixed(1)} ms)`, timestamp: new Date() },
            ...res.logs,
            { type: 'info', content: `完成 (${res.durationMs.toFixed(1)} ms)`, timestamp: new Date() }
          ])
          setRightPanel('output')
          break
        }
        case 'python': {
          addOutput('info', 'ℹ 注意：当前 CodeRunner 未内置 Python 解释器')
          addOutput('info', '你可以在 WebLinuxOS 终端中使用 Python，或在 CodePlayground 中尝试')
          setRightPanel('output')
          break
        }
        case 'html': {
          setHtmlContent(src)
          setRightPanel('preview')
          addOutput('info', 'HTML 预览已更新 (在右侧"预览"标签页)')
          break
        }
        case 'markdown': {
          const html = await renderMarkdown(src)
          setMarkdownHtml(html)
          setRightPanel('preview')
          addOutput('info', 'Markdown 已渲染 (在右侧"预览"标签页)')
          break
        }
        case 'json': {
          const fmt = formatJSON(src)
          if (fmt.ok) {
            setOutput([
              { type: 'info', content: `✔ JSON 解析成功`, timestamp: new Date() },
              { type: 'stdout', content: fmt.output, timestamp: new Date() }
            ])
          } else {
            setOutput([
              { type: 'error', content: `✘ JSON 格式错误: ${fmt.error}`, timestamp: new Date() }
            ])
          }
          setRightPanel('output')
          break
        }
        case 'sql': {
          const results = runSQLSimulation(src)
          setSqlResults(results)
          const lines: OutputLine[] = []
          for (const r of results) {
            if (r.error) lines.push({ type: 'error', content: `✘ ${r.error}`, timestamp: new Date() })
            else if (r.message) lines.push({ type: 'info', content: `ℹ ${r.message}`, timestamp: new Date() })
            if (r.rows && r.columns) {
              lines.push({ type: 'stdout', content: renderTextTable(r.columns, r.rows), timestamp: new Date() })
            }
          }
          setOutput((prev) => [...prev, { type: 'info', content: `▶ 执行 SQL 模拟`, timestamp: new Date() }, ...lines])
          setRightPanel('output')
          break
        }
        case 'bash': {
          const res = runBashScript(src)
          setOutput([
            { type: 'info', content: `▶ 执行 Bash 脚本 (${res.durationMs.toFixed(1)} ms)`, timestamp: new Date() },
            { type: 'stdout', content: res.output, timestamp: new Date() }
          ])
          setRightPanel('output')
          break
        }
      }
    } catch (error) {
      addOutput('error', `执行失败: ${error instanceof Error ? error.message : String(error)}`)
    }

    const elapsed = performance.now() - start
    setOutput((prev) => [...prev, { type: 'info', content: `总耗时: ${elapsed.toFixed(1)} ms`, timestamp: new Date() }])
    setIsRunning(false)
  }, [selectedLang, code, addOutput])

  const clearOutput = useCallback(() => {
    setOutput([])
    setSqlResults(null)
  }, [])

  const copyOutput = useCallback(async () => {
    const text = output.map((l) => l.content).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      addOutput('error', '复制到剪贴板失败')
    }
  }, [output, addOutput])

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }, [])

  // 当切换到 HTML 且内容有变更时，自动同步预览
  const handleRunOrPreview = useCallback(() => {
    if (selectedLang.id === 'html') {
      setHtmlContent(code)
      setRightPanel('preview')
      addOutput('info', 'HTML 预览已更新')
    } else if (selectedLang.id === 'markdown') {
      renderMarkdown(code).then((html) => {
        setMarkdownHtml(html)
        setRightPanel('preview')
        addOutput('info', 'Markdown 预览已更新')
      })
    } else {
      runCode()
    }
  }, [selectedLang, code, runCode, addOutput])

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0d1117',
        color: '#c9d1d9',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden'
      }}
    >
      {/* 工具栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: '#161b22',
          borderBottom: '1px solid #30363d',
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.3
            }}
          >
            CodeRunner
          </span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedLang(lang)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border:
                    selectedLang.id === lang.id
                      ? '1px solid #764ba2'
                      : '1px solid #30363d',
                  background: selectedLang.id === lang.id
                    ? 'linear-gradient(135deg, rgba(102,126,234,0.25), rgba(118,75,162,0.25))'
                    : 'transparent',
                  color: selectedLang.id === lang.id ? '#d7d9fc' : '#8b949e',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: selectedLang.id === lang.id ? 600 : 400,
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span
                  style={{
                    background: selectedLang.id === lang.id
                      ? 'linear-gradient(135deg, #667eea, #764ba2)'
                      : '#30363d',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700
                  }}
                >
                  {lang.icon}
                </span>
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setCode(selectedLang.template)}
            style={secondaryBtn}
          >
            重置模板
          </button>
          <button
            onClick={runCode}
            disabled={isRunning}
            style={{
              ...primaryBtn,
              opacity: isRunning ? 0.7 : 1,
              cursor: isRunning ? 'not-allowed' : 'pointer'
            }}
          >
            {isRunning ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                执行中...
              </>
            ) : (
              <>
                <span>▶</span>
                运行代码
              </>
            )}
          </button>
          {(selectedLang.id === 'html' || selectedLang.id === 'markdown') && (
            <button onClick={handleRunOrPreview} style={secondaryBtn}>
              刷新预览
            </button>
          )}
        </div>
      </div>

      {/* 主内容区 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: 0,
          overflow: 'hidden',
          minHeight: 0
        }}
      >
        {/* 代码编辑区 */}
        <div
          style={{
            flex: '1 1 50%',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #30363d',
            minWidth: 0
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              background: '#161b22',
              borderBottom: '1px solid #30363d',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700
                }}
              >
                {selectedLang.icon}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {selectedLang.name} 编辑器
              </span>
            </div>
            <span style={{ fontSize: 11, color: '#8b949e' }}>
              {code.length} 字符 · {code.split('\n').length} 行
            </span>
          </div>
          <textarea
            ref={codeRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            placeholder={`在此输入 ${selectedLang.name} 代码...`}
            style={{
              flex: 1,
              padding: 14,
              background: '#0d1117',
              color: '#e6edf3',
              border: 'none',
              resize: 'none',
              fontSize: 13,
              lineHeight: 1.6,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              outline: 'none',
              whiteSpace: 'pre',
              overflow: 'auto'
            }}
          />
        </div>

        {/* 输出/预览区 */}
        <div
          style={{
            flex: '1 1 50%',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            background: '#0d1117'
          }}
        >
          {/* 面板头部 */}
          <div
            style={{
              padding: '6px 10px',
              background: '#161b22',
              borderBottom: '1px solid #30363d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {(selectedLang.id === 'html' || selectedLang.id === 'markdown') && (
                <>
                  <TabButton
                    active={rightPanel === 'output'}
                    onClick={() => setRightPanel('output')}
                  >
                    输出
                  </TabButton>
                  <TabButton
                    active={rightPanel === 'preview'}
                    onClick={() => setRightPanel('preview')}
                  >
                    预览
                  </TabButton>
                </>
              )}
              {selectedLang.id !== 'html' && selectedLang.id !== 'markdown' && (
                <span style={{ fontSize: 12, fontWeight: 600, color: '#d7d9fc', padding: '4px 10px' }}>
                  输出
                </span>
              )}
              <span style={{ fontSize: 11, color: '#8b949e', paddingLeft: 8 }}>
                {output.length} 行
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={copyOutput} style={miniBtn}>
                {copied ? '已复制 ✓' : '复制'}
              </button>
              <button onClick={clearOutput} style={miniBtn}>
                清空
              </button>
            </div>
          </div>

          {/* 面板内容 */}
          {rightPanel === 'preview' && selectedLang.id === 'html' ? (
            <iframe
              srcDoc={htmlContent || code}
              title="HTML 预览"
              sandbox="allow-scripts allow-forms allow-modals"
              style={{
                flex: 1,
                background: '#fff',
                border: 'none',
                width: '100%',
                height: '100%'
              }}
            />
          ) : rightPanel === 'preview' && selectedLang.id === 'markdown' ? (
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                background: '#fff',
                color: '#1f2328'
              }}
            >
              <div
                style={{
                  padding: 28,
                  maxWidth: 820,
                  margin: '0 auto',
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
                  fontSize: 15,
                  lineHeight: 1.7
                }}
                dangerouslySetInnerHTML={{
                  __html: markdownHtml || '<em style="color:#667eea">点击"运行代码"或"刷新预览"以查看渲染结果。</em>'
                }}
              />
              <MarkdownStyles />
            </div>
          ) : sqlResults && sqlResults.some((r) => r.rows && r.columns) ? (
            // 优先展示表格（当存在 SELECT 结果时），同时保留文本日志
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: 12, overflow: 'auto', borderBottom: '1px solid #30363d', maxHeight: '50%' }}>
                {output.length === 0 ? (
                  <div style={{ color: '#8b949e', fontSize: 13 }}>
                    (无文本输出)
                  </div>
                ) : (
                  output.map((line, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '3px 0',
                        color: lineColor(line.type),
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        fontSize: 12,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        lineHeight: 1.55
                      }}
                    >
                      <span style={{ color: '#484f58', marginRight: 8, fontSize: 11 }}>
                        [{formatTime(line.timestamp)}]
                      </span>
                      {line.content}
                    </div>
                  ))
                )}
                <div ref={outputEndRef} />
              </div>
              <div style={{ padding: 12, overflow: 'auto', flex: 1 }}>
                {sqlResults.map((r, i) => {
                  if (r.rows && r.columns) {
                    return (
                      <div key={i} style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, color: '#58a6ff', marginBottom: 6 }}>
                          {r.message}
                        </div>
                        <ResultTable columns={r.columns} rows={r.rows} />
                      </div>
                    )
                  }
                  if (r.message) {
                    return (
                      <div key={i} style={{ fontSize: 12, color: '#8b949e', marginBottom: 4 }}>
                        ℹ {r.message}
                      </div>
                    )
                  }
                  if (r.error) {
                    return (
                      <div key={i} style={{ fontSize: 12, color: '#f85149', marginBottom: 4 }}>
                        ✘ {r.error}
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: 12,
                background: '#0d1117',
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 12.5,
                lineHeight: 1.6
              }}
            >
              {output.length === 0 ? (
                <div
                  style={{
                    color: '#6e7681',
                    textAlign: 'center',
                    padding: '48px 12px',
                    fontSize: 13
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.7 }}>▷</div>
                  点击上方 <b style={{ color: '#d7d9fc' }}>“运行代码”</b> 查看输出结果
                </div>
              ) : (
                output.map((line, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '3px 0',
                      color: lineColor(line.type),
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    <span style={{ color: '#484f58', marginRight: 8, fontSize: 11 }}>
                      [{formatTime(line.timestamp)}]
                    </span>
                    {line.content}
                  </div>
                ))
              )}
              <div ref={outputEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* 底部状态栏 */}
      <div
        style={{
          padding: '6px 14px',
          background: '#161b22',
          borderTop: '1px solid #30363d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: '#8b949e',
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>语言: <span style={{ color: '#d7d9fc' }}>{selectedLang.name}</span></span>
          <span>|</span>
          <span>行数: {code.split('\n').length}</span>
          <span>|</span>
          <span>字符: {code.length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 700
            }}
          >
            WebLinuxOS CodeRunner
          </span>
          <span>|</span>
          <span>JS · TS · HTML · MD · JSON · SQL · Bash</span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
})

function lineColor(type: OutputLine['type']): string {
  switch (type) {
    case 'error': return '#f85149'
    case 'stderr': return '#ff7b72'
    case 'info': return '#79c0ff'
    case 'stdout':
    default: return '#e6edf3'
  }
}

function renderTextTable(columns: string[], rows: Row[]): string {
  if (rows.length === 0) return '(空结果集)'
  const widths = columns.map((c) =>
    Math.max(c.length, ...rows.map((r) => String(r[c] ?? 'NULL').length))
  )
  const pad = (s: string, w: number) => s + ' '.repeat(Math.max(0, w - s.length))
  const line = '+' + widths.map((w) => '-'.repeat(w + 2)).join('+') + '+'
  const out: string[] = [line]
  out.push('| ' + columns.map((c, i) => pad(c, widths[i])).join(' | ') + ' |')
  out.push(line)
  for (const r of rows) {
    out.push('| ' + columns.map((c, i) => pad(String(r[c] ?? 'NULL'), widths[i])).join(' | ') + ' |')
  }
  out.push(line)
  return out.join('\n')
}

// ---------- 子组件 ----------
function TabButton(props: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={props.onClick}
      style={{
        padding: '5px 12px',
        borderRadius: 6,
        border: props.active ? '1px solid #764ba2' : '1px solid transparent',
        background: props.active
          ? 'linear-gradient(135deg, rgba(102,126,234,0.25), rgba(118,75,162,0.25))'
          : 'transparent',
        color: props.active ? '#d7d9fc' : '#8b949e',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: props.active ? 700 : 500,
        transition: 'all 0.2s'
      }}
    >
      {props.children}
    </button>
  )
}

function ResultTable(props: { columns: string[]; rows: Row[] }) {
  const { columns, rows } = props
  return (
    <div style={{ overflow: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          background: '#161b22',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset'
        }}
      >
        <thead>
          <tr style={{
            background: 'linear-gradient(135deg, rgba(102,126,234,0.3), rgba(118,75,162,0.3))',
            color: '#e6edf3'
          }}>
            {columns.map((c) => (
              <th
                key={c}
                style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: 0.3,
                  borderBottom: '1px solid #30363d'
                }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: 16, textAlign: 'center', color: '#8b949e' }}
              >
                (空结果集)
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr
                key={i}
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid #21262d'
                }}
              >
                {columns.map((c) => (
                  <td
                    key={c}
                    style={{
                      padding: '8px 12px',
                      color: '#e6edf3',
                      fontSize: 12.5
                    }}
                  >
                    {formatCell(r[c])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  return String(v)
}

function MarkdownStyles() {
  return (
    <style>{`
      .markdown-preview-content h1, h1 {
        font-size: 1.9em;
        border-bottom: 1px solid #eaecef;
        padding-bottom: 0.3em;
        margin: 1.2em 0 0.6em;
        font-weight: 700;
        color: #1f2328;
      }
      h2 {
        font-size: 1.5em;
        border-bottom: 1px solid #eaecef;
        padding-bottom: 0.3em;
        margin: 1.2em 0 0.6em;
        font-weight: 700;
        color: #1f2328;
      }
      h3 { font-size: 1.25em; margin: 1em 0 0.5em; font-weight: 700; }
      h4, h5, h6 { font-weight: 700; margin: 1em 0 0.4em; }
      p { margin: 0.7em 0; }
      a { color: #667eea; text-decoration: none; }
      a:hover { text-decoration: underline; color: #764ba2; }
      code {
        background: #f6f8fa;
        color: #764ba2;
        padding: 0.15em 0.4em;
        border-radius: 4px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 85%;
      }
      pre {
        background: #0d1117;
        padding: 16px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 12px 0;
        border: 1px solid #30363d;
      }
      pre code {
        background: transparent;
        color: #e6edf3;
        padding: 0;
        font-size: 13px;
      }
      blockquote {
        margin: 12px 0;
        padding: 0.4em 1em;
        border-left: 4px solid #764ba2;
        color: #57606a;
        background: #f6f8fa;
        border-radius: 4px;
      }
      table {
        border-collapse: collapse;
        margin: 12px 0;
        width: 100%;
        font-size: 14px;
      }
      th, td {
        border: 1px solid #d0d7de;
        padding: 8px 12px;
        text-align: left;
      }
      th {
        background: linear-gradient(135deg, #667eea22, #764ba222);
        font-weight: 700;
      }
      ul, ol { padding-left: 1.8em; margin: 0.5em 0; }
      li { margin: 0.2em 0; }
      hr { border: none; border-top: 1px solid #d0d7de; margin: 20px 0; }
      img { max-width: 100%; border-radius: 6px; }
    `}</style>
  )
}

// ---------- 按钮样式 ----------
const primaryBtn: React.CSSProperties = {
  padding: '7px 16px',
  borderRadius: 6,
  border: 'none',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 12.5,
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  boxShadow: '0 2px 8px rgba(118,75,162,0.35)',
  transition: 'all 0.2s'
}

const secondaryBtn: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: 6,
  border: '1px solid #30363d',
  background: 'transparent',
  color: '#c9d1d9',
  cursor: 'pointer',
  fontSize: 12.5,
  fontWeight: 500,
  transition: 'all 0.2s'
}

const miniBtn: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 5,
  border: '1px solid #30363d',
  background: 'transparent',
  color: '#8b949e',
  cursor: 'pointer',
  fontSize: 11.5,
  transition: 'all 0.2s'
}

export default CodeRunner
