import { useState, useCallback, useMemo } from 'react'
import {
  CopyIcon,
  CheckIcon,
  TrashIcon,
  BookIcon,
  ZapIcon,
  GlobeIcon,
  ChartIcon,
  SearchIcon,
  PlusIcon,
  SaveIcon,
  DownloadIcon,
  FileIcon,
  RefreshCwIcon,
  PetIcon,
  TagIcon,
  ShieldIcon
} from '../icons'
import './DevWorkbench.css'

interface CodeTemplate {
  id: string
  name: string
  category: string
  language: string
  description: string
  code: string
  tags: string[]
}

interface ApiMock {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  response: string
  status: number
  delay: number
}

interface KnowledgeNode {
  id: string
  title: string
  content: string
  connections: string[]
  category: string
}

interface AnalysisResult {
  score: number
  suggestions: string[]
  metrics: {
    complexity: number
    maintainability: number
    performance: number
    security: number
  }
}

const CODE_TEMPLATES: CodeTemplate[] = [
  {
    id: '1',
    name: 'React Hook Template',
    category: 'React',
    language: 'TypeScript',
    description: '自定义 React Hook 基础模板',
    code: `import { useState, useEffect } from 'react';

export function useCustomHook<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Effect logic here
  }, [value]);

  return { value, setValue, loading, error };
}`,
    tags: ['react', 'hook', 'typescript']
  },
  {
    id: '2',
    name: 'API Client Class',
    category: 'API',
    language: 'TypeScript',
    description: 'RESTful API 客户端类模板',
    code: `class APIClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'GET',
      headers: this.headers,
    });
    return response.json();
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });
    return response.json();
  }
}`,
    tags: ['api', 'fetch', 'typescript']
  },
  {
    id: '3',
    name: 'Error Handler',
    category: 'Utility',
    language: 'TypeScript',
    description: '统一的错误处理工具',
    code: `class ErrorHandler {
  static handle(error: Error, context?: string): void {
    console.error(\`[\${context || 'App'}] Error:\`, error.message);
    
    // 可根据错误类型进行不同处理
    if (error.name === 'NetworkError') {
      // 网络错误处理
    } else if (error.name === 'ValidationError') {
      // 验证错误处理
    }
  }

  static async wrap<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error as Error, context);
      return null;
    }
  }
}`,
    tags: ['error', 'utility', 'typescript']
  },
  {
    id: '4',
    name: 'Data Validator',
    category: 'Utility',
    language: 'TypeScript',
    description: '数据验证工具类',
    code: `interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean;
}

class DataValidator {
  static validate(
    data: Record<string, unknown>,
    rules: Record<string, ValidationRule>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];

      if (rule.required && !value) {
        errors.push(\`\${field} is required\`);
        continue;
      }

      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(\`\${field} must be at least \${rule.min}\`);
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(\`\${field} must be at most \${rule.max}\`);
        }
      }

      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
          errors.push(\`\${field} format is invalid\`);
        }
      }

      if (rule.custom && !rule.custom(value)) {
        errors.push(\`\${field} custom validation failed\`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}`,
    tags: ['validation', 'utility', 'typescript']
  },
  {
    id: '5',
    name: 'State Machine',
    category: 'Pattern',
    language: 'TypeScript',
    description: '状态机实现模板',
    code: `type State = string;
type Event = string;
type Transition = { from: State; to: State; event: Event };

class StateMachine {
  private current: State;
  private transitions: Transition[];
  private handlers: Map<State, () => void>;

  constructor(initial: State, transitions: Transition[]) {
    this.current = initial;
    this.transitions = transitions;
    this.handlers = new Map();
  }

  onState(state: State, handler: () => void): void {
    this.handlers.set(state, handler);
  }

  dispatch(event: Event): boolean {
    const transition = this.transitions.find(
      t => t.from === this.current && t.event === event
    );

    if (transition) {
      this.current = transition.to;
      const handler = this.handlers.get(this.current);
      if (handler) handler();
      return true;
    }
    return false;
  }

  getCurrentState(): State {
    return this.current;
  }
}`,
    tags: ['pattern', 'state-machine', 'typescript']
  }
]

const SAMPLE_KNOWLEDGE: KnowledgeNode[] = [
  {
    id: '1',
    title: 'React Hooks',
    content: 'React Hooks 是 React 16.8 引入的新特性，允许在不编写类组件的情况下使用 state 和其他 React 特性。',
    connections: ['2', '3'],
    category: '前端'
  },
  {
    id: '2',
    title: 'TypeScript',
    content: 'TypeScript 是 JavaScript 的超集，添加了静态类型检查和基于类的面向对象编程。',
    connections: ['1', '4'],
    category: '语言'
  },
  {
    id: '3',
    title: '状态管理',
    content: '状态管理是前端应用的核心概念，包括 Redux、MobX、Zustand 等多种方案。',
    connections: ['1', '5'],
    category: '前端'
  },
  {
    id: '4',
    title: 'API 设计',
    content: 'RESTful API 设计原则包括资源导向、统一接口、无状态等核心概念。',
    connections: ['2', '6'],
    category: '后端'
  },
  {
    id: '5',
    title: '性能优化',
    content: '前端性能优化涉及代码分割、懒加载、缓存策略、虚拟滚动等技术。',
    connections: ['3', '7'],
    category: '前端'
  },
  {
    id: '6',
    title: '数据库设计',
    content: '数据库设计包括表结构设计、索引优化、查询优化、事务处理等内容。',
    connections: ['4', '7'],
    category: '后端'
  },
  {
    id: '7',
    title: '系统架构',
    content: '系统架构设计涉及微服务、单体架构、分布式系统、高可用设计等。',
    connections: ['5', '6'],
    category: '架构'
  }
]

export default function DevWorkbench() {
  const [activeTab, setActiveTab] = useState<'templates' | 'mock' | 'knowledge' | 'analysis'>('templates')
  const [templates, setTemplates] = useState<CodeTemplate[]>(CODE_TEMPLATES)
  const [mocks, setMocks] = useState<ApiMock[]>([
    {
      id: '1',
      name: '用户列表',
      method: 'GET',
      path: '/api/users',
      response: JSON.stringify([
        { id: 1, name: '用户A', email: 'a@example.com' },
        { id: 2, name: '用户B', email: 'b@example.com' }
      ], null, 2),
      status: 200,
      delay: 100
    }
  ])
  const [knowledge] = useState<KnowledgeNode[]>(SAMPLE_KNOWLEDGE)
  const [analysisCode, setAnalysisCode] = useState('')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [mockResponse, setMockResponse] = useState('')
  const [, setEditingMock] = useState<ApiMock | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItem, setNewItem] = useState<any>({})

  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category))
    return ['all', ...Array.from(cats)]
  }, [templates])

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [templates, searchQuery, selectedCategory])

  const analyzeCode = useCallback(() => {
    if (!analysisCode.trim()) {
      setAnalysisResult(null)
      return
    }

    // 模拟代码分析
    const lines = analysisCode.split('\n').length
    const functions = (analysisCode.match(/function\s+\w+/g) || []).length
    const complexity = Math.min(10, Math.max(1, lines / 20 + functions / 2))
    const maintainability = Math.max(1, 10 - complexity / 2)
    const performance = Math.max(1, 10 - (analysisCode.includes('async') ? 0 : 2))
    const security = analysisCode.includes('validation') || analysisCode.includes('check') ? 9 : 7

    const suggestions: string[] = []
    if (complexity > 7) suggestions.push('考虑将复杂函数拆分为更小的单元')
    if (!analysisCode.includes('try') && analysisCode.includes('async')) suggestions.push('添加错误处理机制')
    if (!analysisCode.includes('interface') && analysisCode.includes('typescript')) suggestions.push('使用接口定义数据结构')
    if (!analysisCode.includes('test')) suggestions.push('添加单元测试')
    if (!analysisCode.includes('doc')) suggestions.push('添加文档注释')

    setAnalysisResult({
      score: Math.round((maintainability + performance + security) / 3),
      suggestions,
      metrics: {
        complexity: Math.round(complexity),
        maintainability: Math.round(maintainability),
        performance: Math.round(performance),
        security: Math.round(security)
      }
    })
  }, [analysisCode])

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }, [])

  const addTemplate = useCallback(() => {
    const newTemplate: CodeTemplate = {
      id: Date.now().toString(),
      name: newItem.name || '新模板',
      category: newItem.category || 'Custom',
      language: newItem.language || 'TypeScript',
      description: newItem.description || '自定义代码模板',
      code: newItem.code || '// 在此处添加代码',
      tags: newItem.tags || ['custom']
    }
    setTemplates(prev => [...prev, newTemplate])
    setShowAddModal(false)
    setNewItem({})
  }, [newItem])

  const addMock = useCallback(() => {
    const newMock: ApiMock = {
      id: Date.now().toString(),
      name: newItem.name || '新API',
      method: newItem.method || 'GET',
      path: newItem.path || '/api/new',
      response: newItem.response || JSON.stringify({ success: true }, null, 2),
      status: newItem.status || 200,
      delay: newItem.delay || 100
    }
    setMocks(prev => [...prev, newMock])
    setShowAddModal(false)
    setNewItem({})
  }, [newItem])

  const testMock = useCallback((mock: ApiMock) => {
    try {
      const data = JSON.parse(mock.response)
      setMockResponse(`✅ Mock响应成功 (${mock.delay}ms延迟)
状态码: ${mock.status}
数据:
${JSON.stringify(data, null, 2)}`)
    } catch {
      setMockResponse('❌ JSON格式错误，请检查响应数据')
    }
  }, [])

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id))
  }, [])

  const deleteMock = useCallback((id: string) => {
    setMocks(prev => prev.filter(m => m.id !== id))
  }, [])

  return (
    <div className="dev-workbench">
      <div className="workbench-header">
        <h1>
          <ZapIcon /> 智能开发者工作台
        </h1>
        <p className="header-description">
          集成代码模板、API Mock服务、知识图谱和智能分析的综合开发工具
        </p>
      </div>

      <div className="workbench-tabs">
        <button
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <FileIcon /> 代码模板库
        </button>
        <button
          className={`tab ${activeTab === 'mock' ? 'active' : ''}`}
          onClick={() => setActiveTab('mock')}
        >
          <GlobeIcon /> API Mock服务
        </button>
        <button
          className={`tab ${activeTab === 'knowledge' ? 'active' : ''}`}
          onClick={() => setActiveTab('knowledge')}
        >
          <BookIcon /> 知识图谱
        </button>
        <button
          className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          <ChartIcon /> 智能分析
        </button>
      </div>

      <div className="workbench-content">
        {/* 代码模板库 */}
        {activeTab === 'templates' && (
          <div className="templates-section">
            <div className="templates-toolbar">
              <div className="search-box">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="搜索模板..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="category-filter">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === 'all' ? '全部' : cat}
                  </button>
                ))}
              </div>
              <button className="add-btn" onClick={() => setShowAddModal(true)}>
                <PlusIcon /> 新建模板
              </button>
            </div>

            <div className="templates-grid">
              {filteredTemplates.map(template => (
                <div key={template.id} className="template-card">
                  <div className="template-header">
                    <div className="template-info">
                      <h3>{template.name}</h3>
                      <span className="template-language">{template.language}</span>
                    </div>
                    <div className="template-actions">
                      <button
                        className="copy-btn"
                        onClick={() => copyToClipboard(template.code, template.id)}
                        title="复制代码"
                      >
                        {copiedId === template.id ? <CheckIcon /> : <CopyIcon />}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => deleteTemplate(template.id)}
                        title="删除"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                  <p className="template-description">{template.description}</p>
                  <div className="template-tags">
                    {template.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                  <pre className="template-code">
                    <code>{template.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Mock服务 */}
        {activeTab === 'mock' && (
          <div className="mock-section">
            <div className="mock-toolbar">
              <button className="add-btn" onClick={() => setShowAddModal(true)}>
                <PlusIcon /> 新建Mock
              </button>
              <button className="export-btn">
                <DownloadIcon /> 导出配置
              </button>
            </div>

            <div className="mock-list">
              {mocks.map(mock => (
                <div key={mock.id} className="mock-card">
                  <div className="mock-header">
                    <div className="mock-method">{mock.method}</div>
                    <div className="mock-path">{mock.path}</div>
                    <h3>{mock.name}</h3>
                  </div>
                  <div className="mock-config">
                    <span className="config-item">
                      状态码: <strong>{mock.status}</strong>
                    </span>
                    <span className="config-item">
                      延迟: <strong>{mock.delay}ms</strong>
                    </span>
                  </div>
                  <pre className="mock-response">{mock.response}</pre>
                  <div className="mock-actions">
                    <button className="test-btn" onClick={() => testMock(mock)}>
                      <ZapIcon /> 测试
                    </button>
                    <button className="edit-btn" onClick={() => setEditingMock(mock)}>
                      <PetIcon /> 编辑
                    </button>
                    <button className="delete-btn" onClick={() => deleteMock(mock.id)}>
                      <TrashIcon /> 删除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {mockResponse && (
              <div className="mock-test-result">
                <pre>{mockResponse}</pre>
              </div>
            )}
          </div>
        )}

        {/* 知识图谱 */}
        {activeTab === 'knowledge' && (
          <div className="knowledge-section">
            <div className="knowledge-toolbar">
              <button className="add-btn">
                <PlusIcon /> 添加知识点
              </button>
              <button className="refresh-btn">
                <RefreshCwIcon /> 重新布局
              </button>
            </div>

            <div className="knowledge-graph">
              <div className="graph-container">
                {knowledge.map(node => (
                  <div key={node.id} className={`knowledge-node category-${node.category}`}>
                    <div className="node-title">{node.title}</div>
                    <div className="node-content">{node.content}</div>
                    <div className="node-category">{node.category}</div>
                  </div>
                ))}
                <svg className="connections-layer">
                  {/* 连接线将在CSS中绘制 */}
                </svg>
              </div>
            </div>

            <div className="knowledge-list">
              {knowledge.map(node => (
                <div key={node.id} className="knowledge-item">
                  <h4>{node.title}</h4>
                  <p>{node.content}</p>
                  <div className="knowledge-meta">
                    <span className="category-tag">{node.category}</span>
                    <span className="connections-count">
                      {node.connections.length} 个连接
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 智能分析 */}
        {activeTab === 'analysis' && (
          <div className="analysis-section">
            <div className="analysis-input">
              <h2>代码质量分析</h2>
              <textarea
                value={analysisCode}
                onChange={(e) => setAnalysisCode(e.target.value)}
                placeholder="在此粘贴你的代码进行分析..."
                rows={15}
              />
              <button className="analyze-btn" onClick={analyzeCode}>
                <ZapIcon /> 开始分析
              </button>
            </div>

            {analysisResult && (
              <div className="analysis-result">
                <div className="result-header">
                  <div className="overall-score">
                    <div className="score-circle" style={{
                      background: `conic-gradient(
                        ${analysisResult.score >= 8 ? '#4ade80' : analysisResult.score >= 6 ? '#fbbf24' : '#ef4444'}
                        ${analysisResult.score * 36}deg,
                        #e5e7eb ${analysisResult.score * 36}deg
                      )`
                    }}>
                      <span>{analysisResult.score}</span>
                    </div>
                    <h3>整体评分</h3>
                  </div>
                </div>

                <div className="metrics-grid">
                  <div className="metric-card">
                    <TagIcon />
                    <h4>复杂度</h4>
                    <div className="metric-value">{analysisResult.metrics.complexity}/10</div>
                    <div className="metric-bar">
                      <div
                        className="bar-fill"
                        style={{ width: `${analysisResult.metrics.complexity * 10}%` }}
                      />
                    </div>
                  </div>
                  <div className="metric-card">
                    <ShieldIcon />
                    <h4>可维护性</h4>
                    <div className="metric-value">{analysisResult.metrics.maintainability}/10</div>
                    <div className="metric-bar">
                      <div
                        className="bar-fill good"
                        style={{ width: `${analysisResult.metrics.maintainability * 10}%` }}
                      />
                    </div>
                  </div>
                  <div className="metric-card">
                    <ZapIcon />
                    <h4>性能</h4>
                    <div className="metric-value">{analysisResult.metrics.performance}/10</div>
                    <div className="metric-bar">
                      <div
                        className="bar-fill good"
                        style={{ width: `${analysisResult.metrics.performance * 10}%` }}
                      />
                    </div>
                  </div>
                  <div className="metric-card">
                    <ShieldIcon />
                    <h4>安全性</h4>
                    <div className="metric-value">{analysisResult.metrics.security}/10</div>
                    <div className="metric-bar">
                      <div
                        className="bar-fill good"
                        style={{ width: `${analysisResult.metrics.security * 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="suggestions-section">
                  <h3>
                    <ZapIcon /> 改进建议
                  </h3>
                  <ul className="suggestions-list">
                    {analysisResult.suggestions.map((suggestion, idx) => (
                      <li key={idx}>
                        <ZapIcon />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 添加模态框 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {activeTab === 'templates' ? '新建代码模板' : '新建API Mock'}
            </h2>
            {activeTab === 'templates' && (
              <div className="modal-form">
                <input
                  placeholder="模板名称"
                  value={newItem.name || ''}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                />
                <input
                  placeholder="分类"
                  value={newItem.category || ''}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                />
                <input
                  placeholder="语言"
                  value={newItem.language || ''}
                  onChange={(e) => setNewItem({...newItem, language: e.target.value})}
                />
                <textarea
                  placeholder="描述"
                  value={newItem.description || ''}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  rows={3}
                />
                <textarea
                  placeholder="代码内容"
                  value={newItem.code || ''}
                  onChange={(e) => setNewItem({...newItem, code: e.target.value})}
                  rows={8}
                />
                <div className="modal-actions">
                  <button className="save-btn" onClick={addTemplate}>
                    <SaveIcon /> 保存
                  </button>
                  <button className="cancel-btn" onClick={() => setShowAddModal(false)}>
                    取消
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'mock' && (
              <div className="modal-form">
                <input
                  placeholder="Mock名称"
                  value={newItem.name || ''}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                />
                <select
                  value={newItem.method || 'GET'}
                  onChange={(e) => setNewItem({...newItem, method: e.target.value})}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
                <input
                  placeholder="路径 /api/example"
                  value={newItem.path || ''}
                  onChange={(e) => setNewItem({...newItem, path: e.target.value})}
                />
                <input
                  type="number"
                  placeholder="状态码"
                  value={newItem.status || 200}
                  onChange={(e) => setNewItem({...newItem, status: parseInt(e.target.value)})}
                />
                <input
                  type="number"
                  placeholder="延迟(ms)"
                  value={newItem.delay || 100}
                  onChange={(e) => setNewItem({...newItem, delay: parseInt(e.target.value)})}
                />
                <textarea
                  placeholder="响应JSON"
                  value={newItem.response || ''}
                  onChange={(e) => setNewItem({...newItem, response: e.target.value})}
                  rows={8}
                />
                <div className="modal-actions">
                  <button className="save-btn" onClick={addMock}>
                    <SaveIcon /> 保存
                  </button>
                  <button className="cancel-btn" onClick={() => setShowAddModal(false)}>
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}