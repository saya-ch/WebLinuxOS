import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  Play, Settings, Shield, Zap,
  Copy, Download, Layers,
  ChevronDown, ChevronRight, X, Check, Gauge, Clock,
  EyeOff, Highlighter,
  PieChart as PieChartIcon, Code2, Activity,
  FileWarning, ListChecks, Rocket
} from 'lucide-react'

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'
type Language = 'javascript' | 'typescript' | 'python' | 'unknown'

interface Rule {
  id: string
  name: string
  category: 'naming' | 'complexity' | 'security' | 'performance' | 'maintainability'
  severity: Severity
  weight: number
  description: string
  fixTime: number
  enabled: boolean
  pattern?: RegExp
  languages?: Language[]
}

interface Issue {
  id: string
  ruleId: string
  ruleName: string
  category: Rule['category']
  severity: Severity
  lineStart: number
  lineEnd: number
  columnStart?: number
  columnEnd?: number
  message: string
  suggestion: string
  fixTime: number
  weight: number
  snippet: string
  ignored: boolean
}

const CATEGORY_META: Record<Rule['category'], { label: string; color: string; icon: React.ReactNode }> = {
  naming: { label: '命名规范', color: '#8b5cf6', icon: <Code2 size={12} /> },
  complexity: { label: '复杂度', color: '#f59e0b', icon: <Layers size={12} /> },
  security: { label: '安全问题', color: '#ef4444', icon: <Shield size={12} /> },
  performance: { label: '性能反模式', color: '#06b6d4', icon: <Zap size={12} /> },
  maintainability: { label: '可维护性', color: '#22c55e', icon: <WrenchIcon size={12} /> }
}

function WrenchIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

const SEVERITY_META: Record<Severity, { label: string; color: string; bg: string; border: string; dot: string; order: number }> = {
  critical: { label: 'Critical', color: '#fca5a5', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)', dot: '#ef4444', order: 0 },
  high: { label: 'High', color: '#fdba74', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', dot: '#f97316', order: 1 },
  medium: { label: 'Medium', color: '#fde047', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.28)', dot: '#eab308', order: 2 },
  low: { label: 'Low', color: '#6ee7b7', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', dot: '#10b981', order: 3 },
  info: { label: 'Info', color: '#93c5fd', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', dot: '#3b82f6', order: 4 }
}

const DEFAULT_RULES: Rule[] = [
  { id: 'hardcoded-secrets', name: '硬编码密钥/密码', category: 'security', severity: 'critical', weight: 10, description: '检测代码中硬编码的API密钥、密码、Token等敏感信息', fixTime: 15, enabled: true, languages: ['javascript', 'typescript', 'python'] },
  { id: 'eval-usage', name: '使用 eval()', category: 'security', severity: 'critical', weight: 9, description: 'eval() 可能导致代码注入和XSS漏洞，应避免使用', fixTime: 20, enabled: true, pattern: /\beval\s*\(/i, languages: ['javascript', 'typescript'] },
  { id: 'xss-dangerous-html', name: 'XSS 危险的 innerHTML', category: 'security', severity: 'high', weight: 8, description: '直接设置 innerHTML 可能导致XSS攻击，建议使用 textContent 或安全的转义方法', fixTime: 15, enabled: true, pattern: /\.innerHTML\s*=|document\.write\s*\(/i, languages: ['javascript', 'typescript'] },
  { id: 'regex-dos', name: '正则表达式 DoS 风险', category: 'security', severity: 'high', weight: 7, description: '嵌套量词/回溯正则可能导致ReDoS攻击，造成CPU占用100%', fixTime: 25, enabled: true, pattern: /\((?:[^()]*\|[^()]*|\+|\*){2,}\)[+*]|\([^)]*[+*][^)]*[+*][^)]*\)/, languages: ['javascript', 'typescript', 'python'] },
  { id: 'sql-injection', name: '潜在 SQL 注入', category: 'security', severity: 'critical', weight: 10, description: '字符串拼接SQL语句可能导致注入攻击，应使用参数化查询/ORM', fixTime: 20, enabled: true, pattern: /(SELECT|INSERT|UPDATE|DELETE|DROP).*['"]\s*[+`]\s*|query\s*\(\s*[`'"]+[^`'"]*\$/, languages: ['javascript', 'typescript', 'python'] },
  { id: 'insecure-random', name: '不安全的随机数', category: 'security', severity: 'medium', weight: 5, description: 'Math.random/random模块不适合安全场景，应使用加密安全随机数', fixTime: 10, enabled: true, pattern: /Math\.random\s*\(|import\s+random\b|from\s+random\s+import/, languages: ['javascript', 'typescript', 'python'] },
  { id: 'camelcase-naming', name: '变量/函数非 camelCase', category: 'naming', severity: 'low', weight: 2, description: 'JavaScript/TypeScript 变量和函数应使用小驼峰命名法', fixTime: 3, enabled: true, languages: ['javascript', 'typescript'] },
  { id: 'snake-case', name: 'Python 命名应为 snake_case', category: 'naming', severity: 'low', weight: 2, description: 'Python 变量和函数应使用下划线命名法 (snake_case)', fixTime: 3, enabled: true, languages: ['python'] },
  { id: 'pascalcase-class', name: '类名非 PascalCase', category: 'naming', severity: 'medium', weight: 4, description: '类名、构造函数、组件应使用大驼峰(PascalCase)命名', fixTime: 3, enabled: true, pattern: /\bclass\s+[a-z]|function\s+[a-z][A-Za-z0-9]*\s*\([^)]*\)\s*\{[^}]*this\./, languages: ['javascript', 'typescript'] },
  { id: 'const-mutable', name: '可变变量建议用 const', category: 'naming', severity: 'info', weight: 1, description: '不被重新赋值的变量应使用 const 而非 let/var 表达不可变意图', fixTime: 2, enabled: true, languages: ['javascript', 'typescript'] },
  { id: 'function-too-long', name: '函数过长 (>50行)', category: 'complexity', severity: 'high', weight: 7, description: '函数超过50行，建议拆分为多个小函数，单一职责', fixTime: 40, enabled: true, languages: ['javascript', 'typescript', 'python'] },
  { id: 'nested-depth', name: '嵌套层级过深 (>4层)', category: 'complexity', severity: 'high', weight: 6, description: '代码嵌套超过4层，可读性差，建议提前返回/抽函数', fixTime: 25, enabled: true, languages: ['javascript', 'typescript', 'python'] },
  { id: 'cyclomatic-complexity', name: '圈复杂度过高', category: 'complexity', severity: 'medium', weight: 5, description: '函数内 if/else/for/while/case 过多 (>15)，建议拆分', fixTime: 30, enabled: true, languages: ['javascript', 'typescript', 'python'] },
  { id: 'god-class', name: '上帝类/超大文件', category: 'complexity', severity: 'medium', weight: 6, description: '文件行数/类成员过多，违反单一职责原则，建议拆模块', fixTime: 60, enabled: true, languages: ['javascript', 'typescript', 'python'] },
  { id: 'duplicate-dom-query', name: '重复 DOM 查询', category: 'performance', severity: 'medium', weight: 5, description: '循环内重复 document.getElementById/querySelector，应在循环外缓存', fixTime: 8, enabled: true, languages: ['javascript', 'typescript'] },
  { id: 'on-squared-loop', name: '疑似 O(n²) 嵌套循环', category: 'performance', severity: 'high', weight: 7, description: '嵌套循环可能导致大数据量下性能问题，考虑用 Map/Set/哈希表优化', fixTime: 20, enabled: true, languages: ['javascript', 'typescript', 'python'] },
  { id: 'unused-imports', name: '未使用的导入', category: 'performance', severity: 'low', weight: 2, description: '未使用的import会增加打包体积，移除可减少树摇负担', fixTime: 2, enabled: true, languages: ['javascript', 'typescript', 'python'] },
  { id: 'sync-xhr', name: '同步 XMLHttpRequest', category: 'performance', severity: 'medium', weight: 4, description: '同步XHR会阻塞主线程，严重影响用户体验，建议使用 fetch/axios 异步', fixTime: 10, enabled: true, pattern: /XMLHttpRequest.*false|xhr\.open\s*\([^,]+,[^,]+,\s*false\)/, languages: ['javascript', 'typescript'] },
  { id: 'magic-numbers', name: '魔法数字', category: 'maintainability', severity: 'low', weight: 3, description: '代码中出现含义不清的数字字面量，建议提取为命名常量', fixTime: 5, enabled: true, languages: ['javascript', 'typescript', 'python'] },
  { id: 'console-log', name: '遗留 console.log', category: 'maintainability', severity: 'low', weight: 1, description: '生产代码建议移除或使用分级日志库(winston/pino)', fixTime: 2, enabled: true, pattern: /console\.log\s*\(/, languages: ['javascript', 'typescript'] },
  { id: 'todo-comment', name: 'TODO/FIXME 注释', category: 'maintainability', severity: 'info', weight: 1, description: '遗留的待办事项提醒，建议尽快处理', fixTime: 10, enabled: true, pattern: /\/\/\s*(TODO|FIXME|HACK|XXX)|#\s*(TODO|FIXME|HACK|XXX)/i, languages: ['javascript', 'typescript', 'python'] },
  { id: 'empty-catch', name: '空 catch 块', category: 'maintainability', severity: 'high', weight: 6, description: '空的catch会吞掉异常，排查问题极难，至少要记录日志', fixTime: 8, enabled: true, languages: ['javascript', 'typescript', 'python'] },
  { id: 'deep-mutate-props', name: '直接修改对象/数组', category: 'maintainability', severity: 'medium', weight: 4, description: '直接修改对象/数组可能引发副作用，建议用展开运算符/immutable方法', fixTime: 12, enabled: true, languages: ['javascript', 'typescript'] }
]

const SAMPLE_CODES: Record<Exclude<Language, 'unknown'>, { name: string; code: string }> = {
  javascript: {
    name: 'JavaScript 示例（带问题）',
    code: `const API_KEY = "sk-abc123def456ghi789";
const DB_PASSWORD = "admin@123";

function processUserData(users) {
  var result = [];
  for (var i = 0; i < users.length; i++) {
    for (var j = 0; j < users.length; j++) {
      if (users[i].id === users[j].managerId) {
        var el = document.getElementById("user-" + users[i].id);
        el.innerHTML = "<div>" + users[i].name + "</div>";
      }
    }
    document.getElementById("count-" + i).textContent = result.length;
  }
  if (users.length > 0) {
    if (users[0].role) {
      if (users[0].role === "admin") {
        if (users[0].active) {
          if (users[0].verified) {
            console.log("Super admin found:", users[0]);
            eval("var perm = " + users[0].permissions);
          }
        }
      }
    }
  }
  return result;
}

function ValidateEmail(input) {
  var re = /^([a-zA-Z0-9]+[_|\\_|\\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\\_|\\.]?)*[a-zA-Z0-9]+\\.[a-zA-Z]{2,3}$/;
  return re.test(input);
}

var xhr = new XMLHttpRequest();
xhr.open("GET", "/api/users", false);
xhr.send();
var data = xhr.responseText;

// TODO: 重构这个大函数
function doEverything(arr) {
  var sql = "SELECT * FROM users WHERE id = " + arr[0] + " AND name = '" + arr[1] + "'";
  try {
    for (let i = 0; i < 100; i++) {
      for (let j = 0; j < 100; j++) {
        for (let k = 0; k < 100; k++) {
          Math.random();
        }
      }
    }
  } catch(e) {
  }
  return 42;
}
`
  },
  typescript: {
    name: 'TypeScript 示例（带问题）',
    code: `import * as _ from 'lodash';
import React, { useState } from 'react';
import moment from 'moment';

const SECRET_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

export interface userData {
  id: number;
  user_name: string;
  is_Active: boolean;
}

export class userService {
  private apiUrl: string = "http://api.example.com";
  private cache: any = {};

  GetUser(id: number): userData | null {
    let result = null;
    if (id > 0) {
      if (this.cache[id]) {
        result = this.cache[id];
      } else {
        if (id < 1000) {
          if (this.apiUrl) {
            try {
              const xhr = new XMLHttpRequest();
              xhr.open("GET", this.apiUrl + "/user/" + id, false);
              xhr.send();
              result = JSON.parse(xhr.responseText);
              console.log("Got user:", result);
              document.getElementById('user-card')!.innerHTML = "<b>" + result.user_name + "</b>";
            } catch(err) {
            }
          }
        }
      }
    }
    let items: any[] = [];
    for (let a = 0; a < 100; a++) {
      for (let b = 0; b < 100; b++) {
        items.push({ a, b, key: Math.random() });
      }
    }
    return result;
  }

  ProcessAll(list: userData[]) {
    for (let i = 0; i < list.length; i++) {
      document.getElementById("row-" + i)!.style.color = "#ff0000";
      document.getElementById("row-" + i)!.style.fontSize = "14px";
      document.getElementById("row-" + i)!.classList.add("active");
    }
    // FIXME: 性能太差需要重写
    const pass = "P@ssw0rd!";
    const sql = \`SELECT * FROM orders WHERE user = \${list[0].id}\`;
    eval("const perm = " + list[0].user_name);
    return 7;
  }
}
`
  },
  python: {
    name: 'Python 示例（带问题）',
    code: `import os
import random
import requests
from datetime import datetime

API_PASSWORD = "MySecurePass123!"
JWT_SECRET = "super-secret-key-change-me"

def getUserData(user_id, userName):
    sql = "SELECT * FROM users WHERE id = " + str(user_id) + " AND name = '" + userName + "'"
    print("Querying:", sql)
    conn = None
    try:
        result = []
        if user_id > 0:
            if userName:
                if len(userName) > 3:
                    if userName.isalnum():
                        if '@' in userName:
                            for i in range(100):
                                for j in range(100):
                                    random.random()
        return result
    except Exception as e:
        pass

def processUsers(userList):
    result = {}
    for userA in userList:
        for userB in userList:
            if userA["id"] == userB["manager_id"]:
                token = "sk-test-" + str(random.randint(1000, 9999))
                userA["token"] = token
                userA["accessed"] = True
                userA["views"] = 42
    return result

class user_data_manager:
    def __init__(self):
        self.a = 1
        self.b = 2
        self.c = 3
        self.d = 4
        self.e = 5
        self.f = 6
        self.cache = {}

    def SaveUser(self, userData):
        sql = f"INSERT INTO users VALUES ({userData['id']}, '{userData['name']}')"
        # TODO: 用参数化查询
        eval("x = " + str(userData.get("age", 0)))
        return True

def ValidateEmail(inputStr):
    import re
    pattern = r'^([a-zA-Z0-9]+[_|\\_|\\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\\_|\\.]?)*[a-zA-Z0-9]+\\.[a-zA-Z]{2,3}$'
    return bool(re.match(pattern, inputStr))

# HACK: 临时方案需要重构
def handle_request(req):
    import math
    return 3.1415926
`
  }
}

const uid = () => Math.random().toString(36).slice(2, 10)

function detectLanguage(code: string): Language {
  const lines = code.split('\n')
  let jsScore = 0, tsScore = 0, pyScore = 0
  for (const line of lines) {
    if (/^\s*(import|from)\s+.*['"].*['"]\s*;?$/.test(line)) jsScore++
    if (/\b(const|let|var)\s+\w+\s*[=:]/.test(line)) jsScore++
    if (/:\s*(string|number|boolean|any|interface|type)\b/.test(line)) tsScore++
    if (/\.tsx?$|\binterface\s+\w+/.test(line)) tsScore += 2
    if (/^\s*(def |class )/.test(line)) pyScore++
    if (/^\s*#/.test(line)) pyScore++
    if (/\bprint\s*\(/.test(line)) pyScore++
    if (/^\s*(if|for|while|try|except)\s+.*:\s*$/.test(line)) pyScore++
    if (/:\s*$/.test(line.trim()) && !/:[^]*=>/.test(line)) pyScore += 0.5
  }
  if (tsScore >= jsScore && tsScore >= pyScore && (tsScore > 0)) return 'typescript'
  if (pyScore > jsScore && pyScore > tsScore) return 'python'
  if (jsScore > 0) return 'javascript'
  return 'unknown'
}

function countLines(code: string) {
  return code.split('\n').length
}

function getLineSnippet(code: string, start: number, end: number) {
  const lines = code.split('\n')
  return lines.slice(Math.max(0, start - 1), end).join('\n').slice(0, 200)
}

function runAnalysis(code: string, lang: Language, rules: Rule[]): Issue[] {
  const issues: Issue[] = []
  if (!code.trim()) return issues
  const lines = code.split('\n')
  const enabledRules = rules.filter(r => r.enabled && (!r.languages || r.languages.includes(lang)))

  for (const rule of enabledRules) {
    const ruleId = rule.id
    const ruleName = rule.name
    const category = rule.category
    const severity = rule.severity
    const weight = rule.weight
    const fixTime = rule.fixTime

    if (rule.pattern) {
      lines.forEach((line, idx) => {
        if (rule.pattern!.test(line)) {
          issues.push({
            id: uid(),
            ruleId, ruleName, category, severity, weight, fixTime,
            lineStart: idx + 1, lineEnd: idx + 1,
            columnStart: (line.search(/\S/) + 1) || 1,
            message: getRuleMessage(ruleId, line.trim().slice(0, 80)),
            suggestion: getRuleSuggestion(ruleId),
            snippet: line.trim().slice(0, 120),
            ignored: false
          })
        }
      })
    }

    if (ruleId === 'hardcoded-secrets') {
      const secretPat = /(password|passwd|pwd|secret|token|api_key|apikey|private_key)\s*[:=]\s*["'][^"']{6,}["']/i
      const jwtPat = /["'](eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)["']/
      const skPat = /["']sk-[A-Za-z0-9]{16,}["']/
      lines.forEach((line, idx) => {
        if (secretPat.test(line) || jwtPat.test(line) || skPat.test(line)) {
          issues.push({
            id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
            lineStart: idx + 1, lineEnd: idx + 1,
            message: `检测到疑似硬编码敏感信息，请使用环境变量/密钥管理服务`,
            suggestion: `将密钥迁移到环境变量 (process.env / os.environ) 或使用 AWS Secrets Manager / Vault 等密钥管理服务`,
            snippet: line.trim().slice(0, 120),
            ignored: false
          })
        }
      })
    }

    if (ruleId === 'camelcase-naming' && (lang === 'javascript' || lang === 'typescript')) {
      lines.forEach((line, idx) => {
        const m = line.match(/^\s*(?:var|let|const)\s+([a-z]\w*[A-Z_]\w*|[A-Z]\w*)\s*[=:;(]/)
        if (m && /_/.test(m[1]) && !/^[A-Z_]+$/.test(m[1])) {
          issues.push({
            id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
            lineStart: idx + 1, lineEnd: idx + 1,
            message: `变量 "${m[1]}" 命名不符合小驼峰规范`,
            suggestion: `改为 camelCase: ${m[1].replace(/_([a-z])/g, (_, c) => c.toUpperCase()).replace(/^[A-Z]/, c => c.toLowerCase())}`,
            snippet: line.trim().slice(0, 120),
            ignored: false
          })
        }
      })
    }

    if (ruleId === 'snake-case' && lang === 'python') {
      lines.forEach((line, idx) => {
        const m = line.match(/^\s*def\s+([a-z]\w*[A-Z]\w*)\s*\(|^\s*([a-z]\w*[A-Z]\w*)\s*=/)
        const name = m && (m[1] || m[2])
        if (name && /[A-Z]/.test(name)) {
          issues.push({
            id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
            lineStart: idx + 1, lineEnd: idx + 1,
            message: `标识符 "${name}" 不符合 Python snake_case 规范`,
            suggestion: `改为 snake_case: ${name.replace(/[A-Z]/g, c => '_' + c.toLowerCase()).replace(/^_/, '')}`,
            snippet: line.trim().slice(0, 120),
            ignored: false
          })
        }
      })
    }

    if (ruleId === 'pascalcase-class') {
      lines.forEach((line, idx) => {
        const m = line.match(/^\s*class\s+([a-z]\w*)/)
        if (m) {
          issues.push({
            id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
            lineStart: idx + 1, lineEnd: idx + 1,
            message: `类名 "${m[1]}" 应使用 PascalCase（大驼峰）`,
            suggestion: `改为: ${m[1].replace(/^[a-z]/, c => c.toUpperCase())}`,
            snippet: line.trim().slice(0, 120),
            ignored: false
          })
        }
      })
    }

    if (ruleId === 'const-mutable' && (lang === 'javascript' || lang === 'typescript')) {
      const seenLets = new Map<string, number>()
      lines.forEach((line, idx) => {
        const m = line.match(/^\s*let\s+(\w+)\s*[=;]/)
        if (m) seenLets.set(m[1], idx + 1)
      })
      const reassigned = new Set<string>()
      for (const l of lines) {
        for (const [n] of seenLets) {
          if (new RegExp(`\\b${n}\\s*\\+?=|\\b${n}\\.`).test(l) && !/^\s*let\s+/.test(l)) reassigned.add(n)
        }
      }
      for (const [n, ln] of seenLets) {
        if (!reassigned.has(n)) {
          issues.push({
            id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
            lineStart: ln, lineEnd: ln,
            message: `变量 "${n}" 未被重新赋值，建议使用 const`,
            suggestion: `将 let ${n} 改为 const ${n} 表达不可变意图`,
            snippet: lines[ln - 1].trim().slice(0, 120),
            ignored: false
          })
        }
      }
    }

    if (ruleId === 'function-too-long') {
      const stack: { name: string; start: number; depth: number }[] = []
      lines.forEach((line, idx) => {
        const ln = idx + 1
        const defMatch = line.match(lang === 'python'
          ? /^(\s*)def\s+(\w+)/
          : /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*[=:]\s*(?:async\s+)?[\(\w])/)
        if (defMatch) {
          const indent = (defMatch[1] || '').length
          while (stack.length && stack[stack.length - 1].depth >= indent) stack.pop()
          stack.push({ name: defMatch[2] || defMatch[3] || defMatch[4] || 'fn', start: ln, depth: indent })
        }
        if (lang === 'python') {
          while (stack.length > 1) {
            const top = stack[stack.length - 1]
            const curIndent = line.match(/^(\s*)/)?.[1].length || 0
            if (curIndent < top.depth && line.trim() && stack.length > 1) {
              if (ln - top.start + 1 > 50) {
                issues.push({
                  id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
                  lineStart: top.start, lineEnd: ln - 1,
                  message: `函数 "${top.name}" 行数 (${ln - top.start}) 超过 50 行阈值`,
                  suggestion: `按职责拆分为多个小函数，每个函数做一件事，推荐 10-25 行最佳`,
                  snippet: getLineSnippet(code, top.start, Math.min(top.start + 3, ln)),
                  ignored: false
                })
              }
              stack.pop()
            } else break
          }
        }
      })
    }

    if (ruleId === 'nested-depth') {
      const depthStack: number[] = []
      lines.forEach((line, idx) => {
        const trimmed = line.trim()
        const ln = idx + 1
        if (lang === 'python') {
          const indent = line.match(/^(\s*)/)?.[1].length || 0
          const level = Math.floor(indent / 4)
          if (level > 4 && /:\s*$/.test(trimmed)) {
            issues.push({
              id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
              lineStart: ln, lineEnd: ln,
              message: `嵌套层级 (${level} 层) 过深，超过 4 层阈值`,
              suggestion: `使用卫语句提前返回，或提取内层逻辑为独立函数，扁平化结构`,
              snippet: trimmed.slice(0, 120),
              ignored: false
            })
          }
        } else {
          if (/^\s*(if|for|while|switch|catch|else\s*if|else)\b/.test(trimmed)) depthStack.push(ln)
          if (/[}]\s*$/.test(trimmed)) depthStack.pop()
          if (depthStack.length > 4 && /^\s*(if|for|while|switch|catch|else\s*if)\b/.test(trimmed)) {
            issues.push({
              id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
              lineStart: ln, lineEnd: ln,
              message: `嵌套层级 (${depthStack.length} 层) 过深，超过 4 层阈值`,
              suggestion: `使用提前返回(guard clause)模式，或提取内层逻辑为独立函数/方法`,
              snippet: trimmed.slice(0, 120),
              ignored: false
            })
          }
        }
      })
    }

    if (ruleId === 'cyclomatic-complexity') {
      let cc = 0
      const funcStarts: { start: number; name: string }[] = []
      lines.forEach((line, idx) => {
        const m = line.match(lang === 'python' ? /^\s*def\s+(\w+)/ : /function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*[=:]\s*(?:async\s+)?[(\w]/)
        if (m) { funcStarts.push({ start: idx, name: m[1] || m[2] || 'fn' }); cc = 0 }
        if (/(\bif\b|\bfor\b|\bwhile\b|\bcase\b|\bcatch\b|&&|\|\||\?[^:]*:)/.test(line)) cc++
        if (cc > 15 && /^\s*\}/.test(line) && funcStarts.length) {
          const fs = funcStarts[funcStarts.length - 1]
          issues.push({
            id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
            lineStart: fs.start + 1, lineEnd: idx + 1,
            message: `函数 "${fs.name}" 圈复杂度 (${cc}) 过高，推荐 ≤10`,
            suggestion: `按条件分支拆分多个函数，使用策略模式/表驱动替代多重 if-else`,
            snippet: getLineSnippet(code, fs.start + 1, Math.min(fs.start + 5, idx + 1)),
            ignored: false
          })
        }
      })
    }

    if (ruleId === 'god-class') {
      const totalLines = lines.length
      if (totalLines > 300) {
        issues.push({
          id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
          lineStart: 1, lineEnd: Math.min(50, totalLines),
          message: `文件行数 (${totalLines}) 过多，建议 ≤300 行`,
          suggestion: `按职责拆分为多个模块/类，遵守单一职责原则(SRP)`,
          snippet: `// 共 ${totalLines} 行代码`,
          ignored: false
        })
      }
      if (lang === 'python') {
        let classStart = -1; let className = ''; let methodCount = 0; let attrCount = 0
        lines.forEach((line, idx) => {
          const cm = line.match(/^\s*class\s+(\w+)/)
          if (cm) { if (methodCount > 15 || attrCount > 10 && classStart >= 0) {
            issues.push({
              id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
              lineStart: classStart + 1, lineEnd: idx,
              message: `类 "${className}" 成员过多 (${methodCount}方法/${attrCount}属性)，疑似上帝类`,
              suggestion: `按职责拆分多个类，使用组合模式，每个类承担单一职责`,
              snippet: getLineSnippet(code, classStart + 1, Math.min(classStart + 5, idx)),
              ignored: false
            })
          }; classStart = idx; className = cm[1]; methodCount = 0; attrCount = 0 }
          if (/^\s+def\s+\w+/.test(line)) methodCount++
          if (/^\s+self\.\w+\s*=/.test(line)) attrCount++
        })
      }
    }

    if (ruleId === 'duplicate-dom-query') {
      const queries = new Map<string, { count: number; firstLine: number }>()
      lines.forEach((line, idx) => {
        const m = line.match(/document\.(getElementById|querySelector)\s*\(\s*["']([^"']+)["']\s*\)/)
        if (m) {
          const key = m[1] + ':' + m[2]
          if (queries.has(key)) {
            const q = queries.get(key)!
            q.count++
            if (q.count === 2) {
              issues.push({
                id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
                lineStart: q.firstLine, lineEnd: idx + 1,
                message: `相同选择器 "${m[2]}" 被重复查询 ${q.count} 次`,
                suggestion: `在循环/函数开始前缓存到变量: const el = document.${m[1]}('${m[2]}')`,
                snippet: getLineSnippet(code, q.firstLine, idx + 1),
                ignored: false
              })
            }
          } else queries.set(key, { count: 1, firstLine: idx + 1 })
        }
      })
    }

    if (ruleId === 'on-squared-loop') {
      const loopStack: { ln: number; varName: string; iterName: string }[] = []
      lines.forEach((line, idx) => {
        const forMatch = line.match(lang === 'python'
          ? /^\s*for\s+(\w+)\s+in\s+(\w+)/
          : /for\s*\(\s*(?:let|const|var)\s+(\w+)\s*[^)]*of\s+(\w+)|for\s*\(\s*(?:let|const|var)\s+(\w+)\s*[^)]*<\s*(\w+)\.length/)
        if (forMatch) {
          const vname = forMatch[1] || forMatch[3]
          const iname = forMatch[2] || forMatch[4]
          loopStack.push({ ln: idx + 1, varName: vname, iterName: iname })
          if (loopStack.length >= 2) {
            const a = loopStack[loopStack.length - 2], b = loopStack[loopStack.length - 1]
            if ((a.iterName && b.iterName && a.iterName === b.iterName) ||
                (a.iterName && b.iterName && lines.slice(a.ln - 1, b.ln - 1).join(' ').includes(b.iterName))) {
              issues.push({
                id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
                lineStart: a.ln, lineEnd: idx + 1,
                message: `疑似 O(n²) 嵌套循环，相同集合 "${a.iterName || b.iterName}" 双重遍历`,
                suggestion: `外层构建 Map/Set/字典，内层 O(1) 查找，可将复杂度降为 O(n)`,
                snippet: getLineSnippet(code, a.ln, idx + 1),
                ignored: false
              })
            }
          }
        }
        if (/^[^\{]*\}[^\{]*$/.test(line) || (lang === 'python' && /^\s*$/.test(line))) loopStack.pop()
      })
    }

    if (ruleId === 'unused-imports') {
      const imports: { name: string; line: number; default?: boolean }[] = []
      lines.forEach((line, idx) => {
        if (lang === 'python') {
          let m = line.match(/^\s*from\s+(\w+)\s+import\s+(.+)/)
          if (m) {
            m[2].split(',').forEach(x => {
              const alias = x.split(' as ').map(s => s.trim())
              imports.push({ name: alias[alias.length - 1], line: idx + 1 })
            })
          }
          m = line.match(/^\s*import\s+(\w+(?:\s*,\s*\w+)*)(?:\s+as\s+(\w+))?/)
          if (m) {
            if (m[2]) imports.push({ name: m[2], line: idx + 1 })
            else m[1].split(',').map(s => s.trim()).forEach(n => imports.push({ name: n, line: idx + 1 }))
          }
        } else {
          let m = line.match(/^\s*import\s+(\w+)\s+from/)
          if (m) imports.push({ name: m[1], line: idx + 1, default: true })
          m = line.match(/^\s*import\s*\{([^}]+)\}\s*from/)
          if (m) m[1].split(',').forEach(x => {
            const alias = x.split(/\s+as\s+/).map(s => s.trim())
            if (alias[0]) imports.push({ name: alias[alias.length - 1], line: idx + 1 })
          })
        }
      })
      const restCode = lines.join('\n')
      imports.forEach(imp => {
        const re = new RegExp(`\\b${imp.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
        const occurrences = (restCode.match(re) || []).length
        if (occurrences <= 1) {
          issues.push({
            id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
            lineStart: imp.line, lineEnd: imp.line,
            message: `导入 "${imp.name}" 未被使用`,
            suggestion: `移除未使用的导入，减小打包体积并避免混淆`,
            snippet: lines[imp.line - 1].trim().slice(0, 120),
            ignored: false
          })
        }
      })
    }

    if (ruleId === 'magic-numbers') {
      const ignoreNums = new Set(['0', '1', '2', '-1', '10', '100', '1000', '60', '24', '365', '3.14159', '1024'])
      lines.forEach((line, idx) => {
        if (lang === 'python' && /^\s*(#|def |class |import |from )/.test(line)) return
        if (/^\s*(import|export|interface|type |enum )/.test(line)) return
        const nums = line.match(/(?<![A-Za-z_$.])(\d{1,3}(?:\.\d+)?)(?![A-Za-z_0-9])/g) || []
        for (const num of nums) {
          if (!ignoreNums.has(num) && !line.includes('const ') && !line.includes('= 0x') && !line.includes('*') && !line.includes('/')) {
            if (Math.abs(parseFloat(num)) > 3 && Math.abs(parseFloat(num)) !== 24 && Math.abs(parseFloat(num)) !== 60) {
              issues.push({
                id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
                lineStart: idx + 1, lineEnd: idx + 1,
                message: `魔法数字 "${num}" 出现在代码中，语义不明确`,
                suggestion: `提取为命名常量: const MAX_RETRY_COUNT = ${num};`,
                snippet: line.trim().slice(0, 120),
                ignored: false
              })
              break
            }
          }
        }
      })
    }

    if (ruleId === 'empty-catch') {
      lines.forEach((line, idx) => {
        if (lang === 'python') {
          if (/^\s*except\s*[^:]*:\s*$/.test(line.trim())) {
            const nextNonEmpty = lines.slice(idx + 1).find(l => l.trim())
            const nextIndent = nextNonEmpty?.match(/^(\s*)/)?.[1].length || 999
            const curIndent = line.match(/^(\s*)/)?.[1].length || 0
            if (nextIndent <= curIndent || (nextNonEmpty && /^\s*pass\s*$/.test(nextNonEmpty))) {
              issues.push({
                id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
                lineStart: idx + 1, lineEnd: idx + 2,
                message: `空的 except 块会吞掉异常，排查问题极难`,
                suggestion: `至少记录日志: logger.error("message", exc_info=True) 或 raise 抛出`,
                snippet: getLineSnippet(code, idx + 1, Math.min(idx + 3, lines.length)),
                ignored: false
              })
            }
          }
        } else {
          if (/\bcatch\s*\([^)]*\)\s*\{\s*\}\s*$/.test(line) || /\bcatch\s*\([^)]*\)\s*\{\s*$/.test(line)) {
            const next = lines[idx + 1]
            if (next && /^\s*\}\s*$/.test(next)) {
              issues.push({
                id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
                lineStart: idx + 1, lineEnd: idx + 2,
                message: `空的 catch 块会静默吞掉异常`,
                suggestion: `添加错误处理和日志: console.error(error) 或上报错误监控`,
                snippet: getLineSnippet(code, idx + 1, Math.min(idx + 3, lines.length)),
                ignored: false
              })
            }
          }
        }
      })
    }

    if (ruleId === 'deep-mutate-props') {
      lines.forEach((line, idx) => {
        if (/\.\w+\s*=\s*[^=]|\[['"]?\w+['"]?\]\s*=\s*[^=]|\.push\s*\(|\.splice\s*\(/.test(line)) {
          if (!/const\s+|let\s+|var\s+/.test(line) && !/^\s*this\./.test(line)) {
            // 简化匹配：对象/数组字面量修改
          }
          if (/\.\w+\s*=\s*[^=].*function|arguments\[/.test(line)) {
            issues.push({
              id: uid(), ruleId, ruleName, category, severity, weight, fixTime,
              lineStart: idx + 1, lineEnd: idx + 1,
              message: `疑似直接修改传入对象/数组参数，可能引发副作用`,
              suggestion: `使用展开运算符 / Object.assign / 数组拷贝创建新对象，遵循不可变原则`,
              snippet: line.trim().slice(0, 120),
              ignored: false
            })
          }
        }
      })
    }
  }

  return issues
    .filter(i => i.message && i.ruleName)
    .sort((a, b) => SEVERITY_META[a.severity].order - SEVERITY_META[b.severity].order || a.lineStart - b.lineStart)
}

function getRuleMessage(ruleId: string, context: string): string {
  const msgMap: Record<string, string> = {
    'eval-usage': `使用 eval() 存在代码注入风险: "${context.slice(0, 50)}"`,
    'xss-dangerous-html': `直接设置 innerHTML/document.write 可能造成 XSS 漏洞`,
    'regex-dos': `该正则模式存在 ReDoS 回溯风险，大数据下会卡死线程`,
    'sql-injection': `字符串拼接 SQL 语句存在注入漏洞`,
    'insecure-random': `使用了非加密安全的随机数生成器`,
    'console-log': `遗留了 console.log 调试语句`,
    'todo-comment': `检测到待办注释提醒`,
    'sync-xhr': `使用了同步 XMLHttpRequest，会阻塞主线程`
  }
  return msgMap[ruleId] || `违反规则：${ruleId}`
}

function getRuleSuggestion(ruleId: string): string {
  const map: Record<string, string> = {
    'eval-usage': `使用 JSON.parse() 解析 JSON，用具体函数替代动态代码执行，或使用沙箱环境`,
    'xss-dangerous-html': `改用 textContent / setText / React 的 {children}，或使用 DOMPurify 转义后再设置 innerHTML`,
    'regex-dos': `使用 RE2 引擎、限制输入长度、或改写为非回溯的确定性正则/手动状态机解析`,
    'sql-injection': `使用参数化查询 (PreparedStatement) 或 ORM 框架，永远不要拼接用户输入到 SQL`,
    'insecure-random': `JS 用 window.crypto.getRandomValues()，Python 用 secrets 模块`,
    'console-log': `移除或使用可分级的日志库，生产环境配置不同日志级别`,
    'todo-comment': `尽快处理该 TODO 事项，设置截止日期或放入 issue 追踪`,
    'sync-xhr': `使用 fetch() 或 axios 异步发送请求，配合 async/await 语法`
  }
  return map[ruleId] || `请参阅规则说明进行修复`
}

function computeScore(issues: Issue[], totalLines: number): number {
  if (!issues.length) return 100
  const active = issues.filter(i => !i.ignored)
  const penaltyPerLine = totalLines < 50 ? 0.5 : totalLines < 200 ? 0.2 : 0.1
  let totalPenalty = 0
  for (const it of active) {
    const mult = { critical: 12, high: 6, medium: 3, low: 1, info: 0.3 }[it.severity]
    totalPenalty += mult * (it.weight / 5)
  }
  totalPenalty += active.length * penaltyPerLine
  const score = Math.max(0, Math.round(100 - totalPenalty))
  return score
}

export default function CodeReviewBot() {
  const [code, setCode] = useState<string>(SAMPLE_CODES.javascript.code)
  const [language, setLanguage] = useState<Language>('javascript')
  const [rules, setRules] = useState<Rule[]>(JSON.parse(JSON.stringify(DEFAULT_RULES)))
  const [issues, setIssues] = useState<Issue[]>([])
  const [expandedRule, setExpandedRule] = useState<string | null>(null)
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null)
  const [highlightLineRange, setHighlightLineRange] = useState<[number, number] | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<Rule['category'] | 'all'>('all')
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'all'>('all')
  const [autoRun, setAutoRun] = useState(true)
  const [showDetail, setShowDetail] = useState<Rule | null>(null)
  const [sampleModal, setSampleModal] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const detected = detectLanguage(code)
    if (detected !== 'unknown') setLanguage(detected)
  }, [])

  const runReview = useCallback(() => {
    const result = runAnalysis(code, language, rules)
    setIssues(result)
  }, [code, language, rules])

  useEffect(() => {
    if (!autoRun) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(runReview, 450)
    return () => clearTimeout(debounceRef.current)
  }, [code, rules, autoRun, runReview])

  useEffect(() => {
    runReview()
  }, [language])

  const filteredIssues = useMemo(() => issues.filter(i => {
    if (filterCategory !== 'all' && i.category !== filterCategory) return false
    if (filterSeverity !== 'all' && i.severity !== filterSeverity) return false
    return true
  }), [issues, filterCategory, filterSeverity])

  const groupedIssues = useMemo(() => {
    const g: Record<Severity, Issue[]> = { critical: [], high: [], medium: [], low: [], info: [] }
    filteredIssues.filter(i => !i.ignored).forEach(i => g[i.severity].push(i))
    return g
  }, [filteredIssues])

  const stats = useMemo(() => {
    const active = issues.filter(i => !i.ignored)
    const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    active.forEach(i => counts[i.severity]++)
    const ruleCounts = new Map<string, { name: string; count: number; severity: Severity }>()
    active.forEach(i => {
      const e = ruleCounts.get(i.ruleId) || { name: i.ruleName, count: 0, severity: i.severity }
      e.count++
      ruleCounts.set(i.ruleId, e)
    })
    const topRules = [...ruleCounts.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
    const totalFix = active.reduce((s, i) => s + i.fixTime, 0)
    const score = computeScore(active, countLines(code))
    return { counts, topRules, totalFix, score, totalLines: countLines(code), activeCount: active.length }
  }, [issues, code])

  const toggleRule = (id: string) => {
    setRules(rs => rs.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }
  const setRuleWeight = (id: string, w: number) => {
    setRules(rs => rs.map(r => r.id === id ? { ...r, weight: w } : r))
  }
  const enableAllRules = () => setRules(rs => rs.map(r => ({ ...r, enabled: true })))
  const disableAllRules = () => setRules(rs => rs.map(r => ({ ...r, enabled: false })))
  const resetDefaults = () => setRules(JSON.parse(JSON.stringify(DEFAULT_RULES)))

  const highlightCode = (start: number, end: number) => {
    setHighlightLineRange([start, end])
    if (textareaRef.current) {
      const lineHeight = 20
      textareaRef.current.scrollTop = Math.max(0, (start - 1) * lineHeight - 80)
    }
  }

  const copyToClipboard = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1500) }
    catch { setCopied('fail') }
  }

  const ignoreIssue = (id: string) => setIssues(is => is.map(i => i.id === id ? { ...i, ignored: !i.ignored } : i))
  const ignoreAllFiltered = () => setIssues(is => is.map(i => filteredIssues.some(f => f.id === i.id) ? { ...i, ignored: true } : i))

  const addNolintComments = () => {
    const targetIssues = filteredIssues.filter(i => !i.ignored)
    const commentSyntax: Record<Language, string> = {
      javascript: ' // nolint:',
      typescript: ' // nolint:',
      python: '  # noqa:',
      unknown: ' // nolint:'
    }
    const lines = code.split('\n')
    const lineAdditions = new Map<number, string>()
    for (const issue of targetIssues) {
      const ln = issue.lineEnd
      lineAdditions.set(ln, (lineAdditions.get(ln) ? ', ' : '') + issue.ruleId)
    }
    for (const [ln, ruleIds] of lineAdditions) {
      const idx = ln - 1
      lines[idx] = lines[idx] + `${commentSyntax[language]}${ruleIds}`
    }
    setCode(lines.join('\n'))
  }

  const generateMarkdownSummary = () => {
    const c = stats.counts
    let md = '# AI 代码审查报告\n\n'
    md += '**生成时间：** ' + new Date().toLocaleString('zh-CN') + '  \n'
    md += '**检测语言：** ' + language.toUpperCase() + '  \n'
    md += '**代码行数：** ' + stats.totalLines + '  \n\n'
    md += '## 总体评分\n\n'
    const barLen = 20
    const filled = Math.round(stats.score / 100 * barLen)
    md += '**代码质量：' + stats.score + ' / 100**  \n'
    md += '[' + '█'.repeat(filled) + '░'.repeat(barLen - filled) + ']\n\n'
    md += '| 级别 | 数量 |\n|---|---|\n'
    const sevList: Severity[] = ['critical', 'high', 'medium', 'low', 'info']
    sevList.forEach(s => { md += '| ' + SEVERITY_META[s].label + ' | ' + c[s] + ' |\n' })
    md += '| **总计** | **' + stats.activeCount + '** |\n\n'
    md += '**预估修复总耗时：约 ' + (stats.totalFix < 60 ? stats.totalFix + ' 分钟' : Math.round(stats.totalFix / 60 * 10) / 10 + ' 小时') + '**\n\n'
    if (stats.topRules.length) {
      md += '## Top 问题类型\n\n'
      stats.topRules.forEach((r, i) => {
        md += (i + 1) + '. **' + r.name + '** — ' + r.count + ' 处 (' + SEVERITY_META[r.severity].label + ')\n'
      })
      md += '\n'
    }
    md += '## 详细问题列表\n\n'
    sevList.forEach(sev => {
      const list = issues.filter(i => i.severity === sev && !i.ignored)
      if (list.length) {
        md += '### ' + SEVERITY_META[sev].label + ' (' + list.length + ')\n\n'
        list.forEach(issue => {
          md += '#### [' + issue.lineStart + '-' + issue.lineEnd + '] ' + issue.ruleName + '\n\n'
          md += '- **描述：** ' + issue.message + '\n'
          md += '- **代码：** \n```\n' + issue.snippet + '\n```\n'
          md += '- **修复建议：** ' + issue.suggestion + '\n'
          md += '- **预估耗时：** ' + issue.fixTime + ' 分钟\n\n'
        })
      }
    })
    md += '---\n*报告由 CodeReviewBot 自动生成 · 纯前端离线运行 · 数据安全无泄露*\n'
    return md
  }

  const exportHTMLReport = () => {
    generateMarkdownSummary()
    const c = stats.counts
    const htmlContent = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>代码审查报告 - CodeReviewBot</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Noto Sans SC',sans-serif;background:linear-gradient(135deg,#0f0f23 0%,#151533 50%,#0f1830 100%);color:#e8e8ff;padding:40px 20px;min-height:100vh}
.container{max-width:960px;margin:0 auto}
.header{background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(0,214,193,0.15));border:1px solid rgba(124,108,240,0.3);border-radius:16px;padding:32px;margin-bottom:24px;backdrop-filter:blur(10px)}
.title{font-size:28px;font-weight:800;background:linear-gradient(135deg,#b8a8ff,#00d6c1);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:12px}
.subtitle{color:#9090c0;font-size:14px;line-height:1.8}
.score-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;margin-bottom:24px}
.score-number{font-size:64px;font-weight:800;background:linear-gradient(135deg,#00d6c1,#2563eb);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;line-height:1}
.score-label{color:#9090c0;margin-top:8px;font-size:14px}
.stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:20px 0}
.stat-box{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;text-align:center}
.stat-count{font-size:24px;font-weight:700}
.stat-label{font-size:12px;margin-top:4px;opacity:0.7}
.section{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;margin-bottom:20px}
h2{font-size:18px;font-weight:700;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.1)}
.issue{background:rgba(0,0,0,0.2);border-left:3px solid var(--c,#fff);border-radius:8px;padding:16px;margin-bottom:12px}
.issue-title{font-size:14px;font-weight:600;margin-bottom:8px;color:#fff}
.issue-meta{font-size:12px;color:#9090c0;margin-bottom:8px}
pre{background:rgba(0,0,0,0.4);padding:10px;border-radius:6px;font-size:12px;overflow-x:auto;border:1px solid rgba(255,255,255,0.08);margin:8px 0;color:#cbd5e1;font-family:'JetBrains Mono',Menlo,monospace}
.footer{text-align:center;color:#666;margin-top:40px;font-size:12px}
table{width:100%;border-collapse:collapse;margin:12px 0}
th,td{padding:10px 12px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.08);font-size:13px}
th{color:#9090c0;font-weight:600}
</style></head><body>
<div class="container">
<div class="header"><div class="title">🤖 AI 代码审查报告</div>
<div class="subtitle">检测语言：<b>${language.toUpperCase()}</b> · 代码行数：<b>${stats.totalLines}</b> · 生成时间：<b>${new Date().toLocaleString('zh-CN')}</b></div></div>
<div class="score-card"><div class="score-number">${stats.score}</div><div class="score-label">代码质量评分 / 100 · 共发现 <b style="color:#fff">${stats.activeCount}</b> 个问题 · 预估修复 <b style="color:#fff">${stats.totalFix < 60 ? stats.totalFix + '分钟' : Math.round(stats.totalFix/60*10)/10 + '小时'}</b></div></div>
<div class="stats-grid">
${(['critical','high','medium','low','info'] as Severity[]).map(s => `<div class="stat-box"><div class="stat-count" style="color:${SEVERITY_META[s].color}">${c[s]}</div><div class="stat-label" style="color:${SEVERITY_META[s].color}">${SEVERITY_META[s].label}</div></div>`).join('')}
</div>
<div class="section"><h2>📈 Top 问题类型</h2>
${stats.topRules.map(r => `<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between"><span><span style="color:${SEVERITY_META[r.severity].color}">●</span> <b>${r.name}</b></span><span style="color:#9090c0">${r.count} 处</span></div>`).join('') || '<p style="color:#9090c0">暂无问题</p>'}
</div>
<div class="section"><h2>🔍 详细问题</h2>
${(['critical','high','medium','low','info'] as Severity[]).map(s => {
  const list = issues.filter(i => i.severity === s && !i.ignored)
  if (!list.length) return ''
  return `<h3 style="color:${SEVERITY_META[s].color};margin:20px 0 12px;font-size:15px">${SEVERITY_META[s].label} (${list.length})</h3>` +
    list.map(i => `<div class="issue" style="--c:${SEVERITY_META[s].dot}">
<div class="issue-title">[行 ${i.lineStart}-${i.lineEnd}] ${i.ruleName}</div>
<div class="issue-meta">${CATEGORY_META[i.category].label} · 修复约 ${i.fixTime} 分钟</div>
<div style="font-size:13px;line-height:1.7;margin-bottom:8px">${i.message}</div>
<pre>${i.snippet.replace(/[<>]/g, c => c==='<'?'&lt;':'&gt;')}</pre>
<div style="font-size:13px;line-height:1.7;color:#8ff0e5"><b>修复建议：</b>${i.suggestion}</div>
</div>`).join('')
}).join('')}
</div>
<div class="footer">报告由 CodeReviewBot 自动生成 · 纯前端离线运行 · 数据安全无泄露</div>
</div></body></html>`
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `code-review-report-${Date.now()}.html`; a.click()
    URL.revokeObjectURL(url)
  }

  const linesCount = countLines(code)
  const lineHeight = 20

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop
  }

  const scoreColor = stats.score >= 85 ? '#10b981' : stats.score >= 65 ? '#eab308' : stats.score >= 40 ? '#f97316' : '#ef4444'

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0f0f23 0%, #151533 50%, #0f1830 100%)',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Noto Sans SC', 'PingFang SC', sans-serif",
      color: '#e8e8ff'
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{
        background: 'linear-gradient(90deg, rgba(124,58,237,0.15), rgba(0,214,193,0.1))',
        borderBottom: '1px solid rgba(124,108,240,0.2)',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #7c3aed, #00d6c1)',
            boxShadow: '0 4px 20px rgba(124,58,237,0.35)'
          }}>
            <FileWarning size={20} color="#fff" />
          </div>
          <div>
            <div className="text-base font-bold" style={{ background: 'linear-gradient(135deg, #b8a8ff, #00d6c1)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CodeReviewBot · AI 代码审查助手
            </div>
            <div className="text-[11px]" style={{ color: '#8080b0' }}>
              纯前端规则引擎 · 离线可用 · 数据安全无泄露
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAutoRun(!autoRun)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-90" style={{
            background: autoRun ? 'rgba(0,214,193,0.12)' : 'rgba(255,255,255,0.04)',
            color: autoRun ? '#00d6c1' : '#aaaacc',
            border: `1px solid ${autoRun ? 'rgba(0,214,193,0.3)' : 'rgba(255,255,255,0.08)'}`
          }}>
            <Activity size={12} /> 自动审查 {autoRun ? '开' : '关'}
          </button>
          <button onClick={runReview} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-90" style={{
            background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 2px 12px rgba(124,58,237,0.3)'
          }}>
            <Play size={12} /> 立即审查
          </button>
          <button onClick={() => setSampleModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-90" style={{
            background: 'rgba(255,255,255,0.04)', color: '#aaaacc', border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <ListChecks size={12} /> 示例代码
          </button>
          <button onClick={exportHTMLReport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-90" style={{
            background: 'rgba(255,255,255,0.04)', color: '#aaaacc', border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <Download size={12} /> 导出报告
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Rules Panel */}
        <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: 280, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#b8a8ff' }}>
              <Settings size={14} /> 审查规则配置
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(124,58,237,0.15)', color: '#b8a8ff' }}>
              {rules.filter(r => r.enabled).length}/{rules.length}
            </span>
          </div>
          <div className="flex items-center gap-1 px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <button onClick={enableAllRules} className="flex-1 text-[11px] py-1 rounded hover:opacity-90" style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' }}>全启用</button>
            <button onClick={disableAllRules} className="flex-1 text-[11px] py-1 rounded hover:opacity-90" style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.18)' }}>全禁用</button>
            <button onClick={resetDefaults} className="flex-1 text-[11px] py-1 rounded hover:opacity-90" style={{ background: 'rgba(59,130,246,0.08)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.18)' }}>默认</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ scrollbarWidth: 'thin' }}>
            {(['security','performance','complexity','maintainability','naming'] as Rule['category'][]).map(cat => {
              const catRules = rules.filter(r => r.category === cat)
              if (!catRules.length) return null
              const meta = CATEGORY_META[cat]
              const catKey = 'cat-' + cat
              const expanded = expandedRule === catKey || expandedRule === null
              return (
                <div key={cat} className="rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <button onClick={() => setExpandedRule(expanded ? cat + '-closed' : catKey)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2">
                      <span style={{ color: meta.color }}>{meta.icon}</span>
                      <span className="text-xs font-semibold" style={{ color: '#e8e8ff' }}>{meta.label}</span>
                      <span className="text-[10px] px-1.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#8080b0' }}>
                        {catRules.filter(r => r.enabled).length}/{catRules.length}
                      </span>
                    </div>
                    {expanded ? <ChevronDown size={12} color="#8080b0" /> : <ChevronRight size={12} color="#8080b0" />}
                  </button>
                  {expanded && (
                    <div className="px-2 pb-2 space-y-1">
                      {catRules.map(r => (
                        <div key={r.id} className="rounded-md p-2 transition-all hover:bg-white/5 cursor-pointer"
                          style={{
                            border: `1px solid ${r.enabled ? SEVERITY_META[r.severity].border : 'rgba(255,255,255,0.04)'}`,
                            background: r.enabled ? SEVERITY_META[r.severity].bg : 'transparent',
                            opacity: r.enabled ? 1 : 0.5
                          }}
                          onClick={(e) => { if (!(e.target as HTMLElement).closest('input')) setShowDetail(r) }}
                        >
                          <div className="flex items-start gap-2">
                            <input type="checkbox" checked={r.enabled} onChange={() => toggleRule(r.id)}
                              className="mt-0.5" style={{ accentColor: '#7c3aed', cursor: 'pointer' }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-medium truncate flex-1" style={{ color: '#e8e8ff' }}>{r.name}</span>
                                <span className="text-[9px] px-1 rounded" style={{
                                  background: SEVERITY_META[r.severity].bg,
                                  color: SEVERITY_META[r.severity].color,
                                  border: `1px solid ${SEVERITY_META[r.severity].border}`
                                }}>{SEVERITY_META[r.severity].label}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="text-[10px]" style={{ color: '#8080b0' }}>权重</span>
                                <input type="range" min={1} max={10} value={r.weight}
                                  onClick={e => e.stopPropagation()}
                                  onChange={(e) => setRuleWeight(r.id, parseInt(e.target.value))}
                                  className="flex-1 h-1" style={{ accentColor: '#7c3aed' }} />
                                <span className="text-[10px] w-4 text-right font-mono" style={{ color: SEVERITY_META[r.severity].color }}>{r.weight}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Middle: Code Editor */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <Code2 size={14} style={{ color: '#8b5cf6' }} />
              <span className="text-sm font-semibold" style={{ color: '#e8e8ff' }}>代码编辑器</span>
              <select value={language} onChange={e => setLanguage(e.target.value as Language)}
                className="text-[11px] px-2 py-1 rounded-md outline-none"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(124,108,240,0.2)', color: '#b8a8ff' }}>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="unknown">自动检测</option>
              </select>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#8080b0' }}>
                {linesCount} 行
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={addNolintComments} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded transition-all hover:opacity-90"
                style={{ background: 'rgba(124,58,237,0.1)', color: '#b8a8ff', border: '1px solid rgba(124,58,237,0.25)' }}>
                <EyeOff size={11} /> 批量 nolint
              </button>
              <button onClick={() => setCode('')} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded transition-all hover:opacity-90"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
                <X size={11} /> 清空
              </button>
            </div>
          </div>
          <div className="flex-1 flex min-h-0 overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0a18, #0d0d20)' }}>
            <div ref={lineNumbersRef} className="flex-shrink-0 py-3 text-right overflow-hidden select-none font-mono"
              style={{
                width: 54, fontSize: 12, lineHeight: `${lineHeight}px`,
                background: 'rgba(0,0,0,0.3)', color: '#4a4a70', borderRight: '1px solid rgba(255,255,255,0.05)',
                paddingRight: 10, paddingLeft: 8
              }}>
              {Array.from({ length: linesCount }, (_, i) => (
                <div key={i + 1} style={{
                  height: lineHeight,
                  fontWeight: highlightLineRange && (i + 1 >= highlightLineRange[0] && i + 1 <= highlightLineRange[1]) ? 700 : 400,
                  color: highlightLineRange && (i + 1 >= highlightLineRange[0] && i + 1 <= highlightLineRange[1]) ? '#00d6c1' : undefined,
                  background: highlightLineRange && (i + 1 >= highlightLineRange[0] && i + 1 <= highlightLineRange[1])
                    ? 'linear-gradient(90deg, rgba(0,214,193,0.18), transparent)' : undefined
                }}>
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              onScroll={handleScroll}
              spellCheck={false}
              placeholder="在此粘贴代码或加载示例... CodeReviewBot 将自动进行20+维度的智能审查"
              className="flex-1 p-3 outline-none resize-none font-mono"
              style={{
                fontSize: 12.5, lineHeight: `${lineHeight}px`, tabSize: 2,
                background: 'transparent', color: '#d4d4ff', caretColor: '#00d6c1',
                backgroundImage: highlightLineRange
                  ? `linear-gradient(to bottom, transparent ${(highlightLineRange[0] - 1) * lineHeight + 3}px, rgba(0,214,193,0.08) ${(highlightLineRange[0] - 1) * lineHeight + 3}px, rgba(0,214,193,0.08) ${highlightLineRange[1] * lineHeight}px, transparent ${highlightLineRange[1] * lineHeight}px)`
                  : undefined
              }}
            />
          </div>
        </div>

        {/* Right: Results Panel */}
        <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: 420, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Stats Header */}
          <div className="p-4 flex-shrink-0" style={{
            background: 'linear-gradient(180deg, rgba(124,58,237,0.12), transparent)',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-20 h-20 rounded-xl flex items-center justify-center relative" style={{
                background: `conic-gradient(${scoreColor} ${stats.score * 3.6}deg, rgba(255,255,255,0.05) 0)`,
                boxShadow: `0 0 30px ${scoreColor}25`
              }}>
                <div className="w-[72%] h-[72%] rounded-full flex items-center justify-center" style={{ background: '#0f0f23' }}>
                  <div className="text-2xl font-extrabold" style={{ color: scoreColor }}>{stats.score}</div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px]" style={{ color: '#8080b0' }}>代码质量评分</div>
                <div className="text-sm font-bold mt-0.5" style={{ color: scoreColor }}>
                  {stats.score >= 85 ? '✨ 优秀' : stats.score >= 65 ? '👍 良好' : stats.score >= 40 ? '⚠️ 需改进' : '🚨 严重'}
                </div>
                <div className="flex gap-1 mt-2">
                  {(['critical','high','medium','low','info'] as Severity[]).map(s => (
                    <div key={s} className="flex-1 text-center py-1 rounded" style={{
                      background: SEVERITY_META[s].bg,
                      border: `1px solid ${SEVERITY_META[s].border}`
                    }}>
                      <div className="text-sm font-extrabold" style={{ color: SEVERITY_META[s].color }}>{stats.counts[s]}</div>
                      <div className="text-[9px]" style={{ color: SEVERITY_META[s].color, opacity: 0.8 }}>{SEVERITY_META[s].label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2 text-[11px]" style={{ color: '#8080b0' }}>
                  <Clock size={11} /> 修复耗时约 <b style={{ color: '#b8a8ff' }}>{stats.totalFix < 60 ? stats.totalFix + '分钟' : (stats.totalFix/60).toFixed(1) + '小时'}</b>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <Gauge size={11} /> {stats.activeCount} 问题
                </div>
              </div>
            </div>

            {/* Top rules pie mini */}
            {stats.topRules.length > 0 && (
              <div className="mt-3 p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-1 mb-2 text-[11px] font-semibold" style={{ color: '#b8a8ff' }}>
                  <PieChartIcon size={11} /> Top 问题类型
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 flex-shrink-0">
                    <TopProblemsDonut data={stats.topRules} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    {stats.topRules.slice(0, 3).map(r => (
                      <div key={r.id} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SEVERITY_META[r.severity].dot }} />
                        <span className="text-[10px] flex-1 truncate" style={{ color: '#c0c0e8' }}>{r.name}</span>
                        <span className="text-[10px] font-mono" style={{ color: SEVERITY_META[r.severity].color }}>×{r.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Filters + Actions */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as any)}
                className="text-[11px] px-2 py-1.5 rounded-md outline-none"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(124,108,240,0.2)', color: '#b8a8ff' }}>
                <option value="all">全部分类</option>
                {(Object.keys(CATEGORY_META) as Rule['category'][]).map(c => (
                  <option key={c} value={c}>{CATEGORY_META[c].label}</option>
                ))}
              </select>
              <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value as any)}
                className="text-[11px] px-2 py-1.5 rounded-md outline-none"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(124,108,240,0.2)', color: '#b8a8ff' }}>
                <option value="all">全部级别</option>
                {(Object.keys(SEVERITY_META) as Severity[]).map(s => (
                  <option key={s} value={s}>{SEVERITY_META[s].label}</option>
                ))}
              </select>
            </div>
            <div className="mt-2 flex gap-2">
              <button onClick={() => copyToClipboard(generateMarkdownSummary(), 'md-summary')}
                className="flex-1 flex items-center justify-center gap-1 text-[11px] py-1.5 rounded-md transition-all hover:opacity-90"
                style={{ background: 'rgba(0,214,193,0.1)', color: '#8ff0e5', border: '1px solid rgba(0,214,193,0.25)' }}>
                {copied === 'md-summary' ? <Check size={11} /> : <Copy size={11} />}
                {copied === 'md-summary' ? '已复制' : 'Markdown 摘要'}
              </button>
              <button onClick={ignoreAllFiltered}
                className="flex-1 flex items-center justify-center gap-1 text-[11px] py-1.5 rounded-md transition-all hover:opacity-90"
                style={{ background: 'rgba(59,130,246,0.08)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}>
                <EyeOff size={11} /> 全部忽略 ({filteredIssues.filter(i => !i.ignored).length})
              </button>
            </div>
          </div>

          {/* Issues list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: 'thin' }}>
            {filteredIssues.filter(i => !i.ignored).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center" style={{ color: '#666699' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{
                  background: 'linear-gradient(135deg, rgba(0,214,193,0.15), rgba(16,185,129,0.1))',
                  border: '1px solid rgba(0,214,193,0.2)'
                }}>
                  <Rocket size={28} color="#00d6c1" />
                </div>
                <div className="text-sm font-semibold" style={{ color: '#8ff0e5' }}>太棒了！</div>
                <div className="text-[11px] mt-1 max-w-[220px]">
                  {code.trim() ? '当前筛选条件下无问题，代码质量优秀 🌟' : '先粘贴或加载示例代码开始审查'}
                </div>
              </div>
            ) : (
              (Object.keys(groupedIssues) as Severity[])
                .sort((a, b) => SEVERITY_META[a].order - SEVERITY_META[b].order)
                .map(sev => groupedIssues[sev].length > 0 && (
                  <div key={sev}>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: SEVERITY_META[sev].dot, boxShadow: `0 0 8px ${SEVERITY_META[sev].dot}80` }} />
                        <span className="text-[11px] font-bold" style={{ color: SEVERITY_META[sev].color }}>
                          {SEVERITY_META[sev].label}
                        </span>
                        <span className="text-[10px] px-1.5 rounded" style={{
                          background: SEVERITY_META[sev].bg, color: SEVERITY_META[sev].color
                        }}>{groupedIssues[sev].length}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {groupedIssues[sev].map(issue => (
                        <div key={issue.id}
                          onClick={() => highlightCode(issue.lineStart, issue.lineEnd)}
                          className="rounded-lg p-3 cursor-pointer transition-all hover:scale-[1.005]"
                          style={{
                            background: SEVERITY_META[issue.severity].bg,
                            border: `1px solid ${SEVERITY_META[issue.severity].border}`,
                            boxShadow: highlightLineRange && highlightLineRange[0] === issue.lineStart
                              ? `0 0 0 2px ${SEVERITY_META[issue.severity].dot}50` : undefined
                          }}>
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{
                                  background: SEVERITY_META[issue.severity].dot, color: '#fff'
                                }}>{SEVERITY_META[issue.severity].label}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                                  color: CATEGORY_META[issue.category].color,
                                  background: CATEGORY_META[issue.category].color + '15',
                                  border: `1px solid ${CATEGORY_META[issue.category].color}30`
                                }}>{CATEGORY_META[issue.category].icon}{CATEGORY_META[issue.category].label}</span>
                                <span className="text-[10px] font-mono" style={{ color: '#8080b0' }}>
                                  L{issue.lineStart}{issue.lineEnd !== issue.lineStart ? `–L${issue.lineEnd}` : ''}
                                </span>
                              </div>
                              <div className="text-xs font-semibold mb-1" style={{ color: '#e8e8ff' }}>
                                {issue.ruleName}
                              </div>
                              <div className="text-[11px] leading-relaxed" style={{ color: '#c0c0e8' }}>
                                {issue.message}
                              </div>
                              {expandedIssue === issue.id && (
                                <div className="mt-2 pt-2" style={{ borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                                  <div className="text-[10px] font-semibold mb-1" style={{ color: '#8ff0e5' }}>💡 修复建议</div>
                                  <div className="text-[11px] leading-relaxed mb-2" style={{ color: '#9fd8d1' }}>{issue.suggestion}</div>
                                  <pre className="text-[10px] p-2 rounded font-mono leading-relaxed" style={{
                                    background: 'rgba(0,0,0,0.35)', color: '#cbd5e1',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    overflow: 'auto'
                                  }}>{issue.snippet}</pre>
                                  <div className="flex items-center justify-between mt-2 text-[10px]" style={{ color: '#8080b0' }}>
                                    <span>⏱ 修复约 <b style={{ color: '#b8a8ff' }}>{issue.fixTime}</b> 分钟 · 权重 <b style={{ color: '#b8a8ff' }}>{issue.weight}</b></span>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-1 mt-2">
                                <button onClick={(e) => { e.stopPropagation(); setExpandedIssue(expandedIssue === issue.id ? null : issue.id) }}
                                  className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1 transition-all hover:opacity-80"
                                  style={{ background: 'rgba(124,58,237,0.12)', color: '#b8a8ff', border: '1px solid rgba(124,58,237,0.25)' }}>
                                  {expandedIssue === issue.id ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                  {expandedIssue === issue.id ? '收起详情' : '查看详情'}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); highlightCode(issue.lineStart, issue.lineEnd) }}
                                  className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1 transition-all hover:opacity-80"
                                  style={{ background: 'rgba(0,214,193,0.1)', color: '#00d6c1', border: '1px solid rgba(0,214,193,0.25)' }}>
                                  <Highlighter size={10} /> 高亮代码
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); ignoreIssue(issue.id) }}
                                  className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1 transition-all hover:opacity-80"
                                  style={{ background: 'rgba(255,255,255,0.04)', color: '#8080b0', border: '1px solid rgba(255,255,255,0.08)' }}>
                                  <EyeOff size={10} /> 忽略
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Sample modal */}
      {sampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
          <div className="rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" style={{
            background: 'linear-gradient(180deg, #151533, #0f0f23)',
            border: '1px solid rgba(124,108,240,0.3)',
            boxShadow: '0 20px 80px rgba(124,58,237,0.25)'
          }}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2">
                <ListChecks size={16} style={{ color: '#b8a8ff' }} />
                <div className="font-semibold" style={{ color: '#e8e8ff' }}>加载示例代码</div>
              </div>
              <button onClick={() => setSampleModal(false)} className="p-1.5 rounded-lg transition-all hover:bg-white/10" style={{ color: '#8080b0' }}>
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(Object.keys(SAMPLE_CODES) as Exclude<Language, 'unknown'>[]).map(lang => (
                <button key={lang} onClick={() => {
                  setCode(SAMPLE_CODES[lang].code); setLanguage(lang); setSampleModal(false)
                }} className="w-full text-left p-4 rounded-xl transition-all hover:scale-[1.01]" style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold" style={{ color: '#e8e8ff' }}>
                      {SAMPLE_CODES[lang].name}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(0,214,193,0.15))',
                      color: '#b8a8ff', border: '1px solid rgba(124,108,240,0.25)'
                    }}>{countLines(SAMPLE_CODES[lang].code)} 行</span>
                  </div>
                  <div className="text-[11px] leading-relaxed" style={{ color: '#8080b0' }}>
                    该示例代码故意包含命名不规范、硬编码密钥、XSS 风险、O(n²) 循环、嵌套过深、魔法数字等 10+ 常见问题，用于演示审查能力。
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rule detail modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} onClick={() => setShowDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="rounded-2xl w-full max-w-lg overflow-hidden" style={{
            background: 'linear-gradient(180deg, #151533, #0f0f23)',
            border: `1px solid ${SEVERITY_META[showDetail.severity].border}`,
            boxShadow: `0 20px 80px ${SEVERITY_META[showDetail.severity].dot}30`
          }}>
            <div className="p-5" style={{ background: SEVERITY_META[showDetail.severity].bg }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: SEVERITY_META[showDetail.severity].dot, color: '#fff' }}>
                      {SEVERITY_META[showDetail.severity].label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{
                      color: CATEGORY_META[showDetail.category].color,
                      background: CATEGORY_META[showDetail.category].color + '20'
                    }}>{CATEGORY_META[showDetail.category].label}</span>
                  </div>
                  <div className="text-lg font-bold" style={{ color: '#e8e8ff' }}>{showDetail.name}</div>
                </div>
                <button onClick={() => setShowDetail(null)} className="p-1.5 rounded-lg transition-all hover:bg-white/10" style={{ color: '#8080b0' }}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-[11px] font-semibold mb-1.5" style={{ color: '#b8a8ff' }}>规则描述</div>
                <div className="text-sm leading-relaxed" style={{ color: '#c0c0e8' }}>{showDetail.description}</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[10px]" style={{ color: '#8080b0' }}>权重</div>
                  <div className="text-xl font-extrabold mt-0.5" style={{ color: SEVERITY_META[showDetail.severity].color }}>{showDetail.weight}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: '#666699' }}>/ 10</div>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[10px]" style={{ color: '#8080b0' }}>修复耗时</div>
                  <div className="text-xl font-extrabold mt-0.5" style={{ color: '#00d6c1' }}>{showDetail.fixTime}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: '#666699' }}>分钟 (估)</div>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-[10px]" style={{ color: '#8080b0' }}>适用语言</div>
                  <div className="text-sm font-bold mt-1" style={{ color: '#8b5cf6' }}>
                    {showDetail.languages ? showDetail.languages.map(l => l.toUpperCase().slice(0,2)).join('/') : 'ALL'}
                  </div>
                </div>
              </div>
              <button onClick={() => { toggleRule(showDetail.id); setShowDetail(null) }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{
                  background: showDetail.enabled ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #7c3aed, #00d6c1)',
                  color: showDetail.enabled ? '#fca5a5' : '#fff',
                  border: `1px solid ${showDetail.enabled ? 'rgba(239,68,68,0.3)' : 'transparent'}`
                }}>
                {showDetail.enabled ? '🚫 禁用此规则' : '✅ 启用此规则'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TopProblemsDonut({ data }: { data: { id: string; name: string; count: number; severity: Severity }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const size = 64
  const stroke = 9
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      {data.map((d, _i) => {
        const pct = d.count / total
        const len = pct * c
        const el = (
          <circle key={d.id} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={SEVERITY_META[d.severity].dot} strokeWidth={stroke}
            strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}
            strokeLinecap="butt" />
        )
        offset += len
        return el
      })}
      <circle cx={size/2} cy={size/2} r={r - stroke * 0.6} fill="#0f0f23" />
    </svg>
  )
}
