import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Copy, Save, Trash2, Plus, ChevronDown, ChevronRight, Play, Settings, BookOpen, Layers, Zap, Brain, Lightbulb, Wand, FileText, Star, Search, BarChart3 } from 'lucide-react';

interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
  description: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

interface PromptCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
}

const CATEGORIES: PromptCategory[] = [
  { id: 'all', name: '全部', icon: <Layers size={16} />, count: 0 },
  { id: 'coding', name: '编程开发', icon: <Wand size={16} />, count: 0 },
  { id: 'writing', name: '写作创作', icon: <FileText size={16} />, count: 0 },
  { id: 'analysis', name: '数据分析', icon: <BarChart3 size={16} />, count: 0 },
  { id: 'education', name: '教育学习', icon: <BookOpen size={16} />, count: 0 },
  { id: 'business', name: '商业营销', icon: <Zap size={16} />, count: 0 },
  { id: 'creative', name: '创意设计', icon: <Lightbulb size={16} />, count: 0 },
  { id: 'research', name: '研究分析', icon: <Brain size={16} />, count: 0 },
];

const DEFAULT_TEMPLATES: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '代码审查专家',
    category: 'coding',
    content: `你是一位经验丰富的代码审查专家。请审查以下{{language}}代码：

\`\`\`{{language}}
{{code}}
\`\`\`

请从以下方面提供反馈：
1. 代码质量和可读性
2. 潜在的 Bug 和安全问题
3. 性能优化建议
4. 最佳实践建议
5. 改进后的代码示例`,
    variables: ['language', 'code'],
    description: '专业的代码审查，包含质量、安全、性能等多维度分析',
    favorite: true,
  },
  {
    name: '技术文档生成',
    category: 'coding',
    content: `请为以下{{language}}代码生成完整的技术文档：

\`\`\`{{language}}
{{code}}
\`\`\`

文档需包含：
1. 功能概述
2. 参数说明
3. 返回值
4. 使用示例
5. 注意事项`,
    variables: ['language', 'code'],
    description: '自动生成 API 文档和使用说明',
    favorite: false,
  },
  {
    name: '文章润色',
    category: 'writing',
    content: `请以专业编辑的身份润色以下{{language}}文章：

{{text}}

要求：
1. 保持原意不变
2. 优化语言表达
3. 改进文章结构
4. 增加可读性
5. 保持字数在{{word_count}}字左右`,
    variables: ['language', 'text', 'word_count'],
    description: '专业文章润色和优化',
    favorite: false,
  },
  {
    name: 'SQL 查询优化',
    category: 'analysis',
    content: `请优化以下 SQL 查询：

\`\`\`sql
{{sql}}
\`\`\`

分析并提供：
1. 当前查询的问题
2. 性能瓶颈
3. 优化后的 SQL
4. 索引建议
5. 执行计划分析`,
    variables: ['sql'],
    description: 'SQL 查询性能优化建议',
    favorite: true,
  },
  {
    name: '英语翻译',
    category: 'education',
    content: `请将以下{{source_language}}文本翻译成{{target_language}}：

{{text}}

要求：
1. 保持原文的语义和风格
2. 使用自然流畅的目标语言
3. 专业术语保持准确
4. 提供翻译说明（如有需要）`,
    variables: ['source_language', 'target_language', 'text'],
    description: '高质量双语翻译服务',
    favorite: false,
  },
  {
    name: '社交媒体文案',
    category: 'business',
    content: `请为{{platform}}生成产品推广文案：

产品：{{product_name}}
特点：{{product_features}}
目标受众：{{target_audience}}

要求：
1. 符合{{platform}}风格
2. 吸引眼球的标题
3. 简洁有力的描述
4. 包含行动号召
5. 适当使用表情符号`,
    variables: ['platform', 'product_name', 'product_features', 'target_audience'],
    description: '各平台社交媒体文案生成',
    favorite: false,
  },
  {
    name: 'Logo 设计提示',
    category: 'creative',
    content: `请为{{brand_name}}设计一个 Logo 方案：

品牌定位：{{brand_positioning}}
行业：{{industry}}
风格偏好：{{style_preference}}

请提供：
1. 设计理念说明
2. 配色方案建议
3. 字体搭配建议
4. 形态构成建议
5. 应用场景展示`,
    variables: ['brand_name', 'brand_positioning', 'industry', 'style_preference'],
    description: '专业 Logo 设计咨询',
    favorite: false,
  },
  {
    name: '研究综述',
    category: 'research',
    content: `请对以下研究主题进行综述：

主题：{{research_topic}}
领域：{{field}}
时间范围：{{time_range}}

要求：
1. 概述研究背景
2. 梳理主要研究方向
3. 介绍关键研究者和成果
4. 分析当前趋势
5. 提出未来研究方向`,
    variables: ['research_topic', 'field', 'time_range'],
    description: '系统性研究文献综述',
    favorite: false,
  },
  {
    name: '单元测试生成',
    category: 'coding',
    content: `请为以下{{language}}代码生成单元测试：

\`\`\`{{language}}
{{code}}
\`\`\`

要求：
1. 覆盖主要功能
2. 包含边界条件测试
3. 包含错误场景测试
4. 使用{{test_framework}}框架
5. 测试命名规范`,
    variables: ['language', 'code', 'test_framework'],
    description: '自动生成代码单元测试',
    favorite: true,
  },
  {
    name: 'Prompt 优化器',
    category: 'creative',
    content: `请优化以下 AI 提示词：

原提示词：
{{prompt}}

目标：{{goal}}

请提供：
1. 提示词问题分析
2. 优化策略
3. 优化后的提示词
4. 预期效果说明`,
    variables: ['prompt', 'goal'],
    description: 'AI 提示词诊断和优化',
    favorite: false,
  },
];

function PromptEngineeringLab() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'coding',
    content: '',
    description: '',
  });
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const saved = localStorage.getItem('prompt-templates');
    if (saved) {
      try {
        setTemplates(JSON.parse(saved));
      } catch {
        setTemplates(DEFAULT_TEMPLATES.map((t, i) => ({
          ...t,
          id: `default-${i}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })));
      }
    } else {
      setTemplates(DEFAULT_TEMPLATES.map((t, i) => ({
        ...t,
        id: `default-${i}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })));
    }
  };

  const saveTemplates = (newTemplates: PromptTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('prompt-templates', JSON.stringify(newTemplates));
  };

  const filteredTemplates = templates.filter(t => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q);
    }
    return true;
  });

  const categoryCounts = CATEGORIES.map(cat => ({
    ...cat,
    count: cat.id === 'all' ? templates.length : templates.filter(t => t.category === cat.id).length,
  }));

  const handleGenerate = useCallback((template: PromptTemplate) => {
    setGenerating(true);
    setExpandedId(template.id);
    
    // 变量替换 - 用合理的默认值
    let content = template.content;
    const defaults: Record<string, string> = {
      language: 'JavaScript',
      code: 'function hello() { console.log("Hello World"); }',
      text: '这是一段需要润色的文本内容。',
      word_count: '500',
      sql: 'SELECT * FROM users WHERE status = "active" ORDER BY created_at DESC LIMIT 10',
      source_language: '中文',
      target_language: 'English',
      platform: '微信公众号',
      product_name: '创新产品',
      product_features: '功能强大、易用、高效',
      target_audience: '年轻白领',
      brand_name: '创新品牌',
      brand_positioning: '高端创新',
      industry: '科技',
      style_preference: '现代简约',
      research_topic: '人工智能发展趋势',
      field: '计算机科学',
      time_range: '2020-2024',
      test_framework: 'Jest',
      prompt: '写一个排序函数',
      goal: '生成高质量的代码',
    };
    
    template.variables.forEach(v => {
      const regex = new RegExp(`{{${v}}}`, 'g');
      content = content.replace(regex, defaults[v] || `[${v}]`);
    });
    
    setTimeout(() => {
      setGeneratedPrompt(content);
      setGenerating(false);
    }, 500);
  }, []);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('已复制到剪贴板');
    } catch {
      alert('复制失败');
    }
  };

  const handleToggleFavorite = (id: string) => {
    const updated = templates.map(t =>
      t.id === id ? { ...t, favorite: !t.favorite, updatedAt: Date.now() } : t
    );
    saveTemplates(updated);
  };

  const handleDelete = (id: string) => {
    if (!confirm('确定删除此模板？')) return;
    saveTemplates(templates.filter(t => t.id !== id));
  };

  const handleOpenForm = (template?: PromptTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        category: template.category,
        content: template.content,
        description: template.description,
      });
    } else {
      setEditingTemplate(null);
      setFormData({ name: '', category: 'coding', content: '', description: '' });
    }
    setShowForm(true);
  };

  const handleSaveForm = () => {
    if (!formData.name || !formData.content) {
      alert('请填写名称和内容');
      return;
    }

    const variables = [...formData.content.matchAll(/{{(\w+)}}/g)].map(m => m[1]);

    if (editingTemplate) {
      const updated = templates.map(t =>
        t.id === editingTemplate.id
          ? { ...t, ...formData, variables, updatedAt: Date.now() }
          : t
      );
      saveTemplates(updated);
    } else {
      const newTemplate: PromptTemplate = {
        id: `custom-${Date.now()}`,
        ...formData,
        variables,
        favorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      saveTemplates([newTemplate, ...templates]);
    }
    setShowForm(false);
    setEditingTemplate(null);
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: '#fff',
      fontFamily: "'Inter', 'PingFang SC', sans-serif",
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        background: 'rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>AI Prompt 工程实验室</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Prompt Engineering Lab · v1.0</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => handleOpenForm()} style={buttonStyle('primary')}>
            <Plus size={16} /> 新建模板
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: 240,
          padding: '16px 12px',
          background: 'rgba(0,0,0,0.2)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          overflowY: 'auto',
          flexShrink: 0,
        }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 8,
            }}>
              <Search size={16} style={{ opacity: 0.6 }} />
              <input
                type="text"
                placeholder="搜索模板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: 13,
                  width: '100%',
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: 11, textTransform: 'uppercase', opacity: 0.5, marginBottom: 8, paddingLeft: 8 }}>
            分类
          </div>
          {categoryCounts.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '8px 12px',
                background: selectedCategory === cat.id ? 'rgba(102,126,234,0.3)' : 'transparent',
                border: 'none', borderRadius: 8,
                color: selectedCategory === cat.id ? '#fff' : 'rgba(255,255,255,0.7)',
                fontSize: 13, cursor: 'pointer',
                marginBottom: 4, justifyContent: 'space-between',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {cat.icon} {cat.name}
              </span>
              <span style={{
                fontSize: 11, padding: '2px 6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 10,
              }}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {showForm && (
            <div style={formOverlayStyle}>
              <div style={formModalStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ margin: 0 }}>{editingTemplate ? '编辑模板' : '新建模板'}</h3>
                  <button onClick={() => setShowForm(false)} style={closeButtonStyle}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    type="text"
                    placeholder="模板名称"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={inputStyle}
                  />
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={inputStyle}
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <textarea
                    placeholder="模板内容（使用 {{变量名}} 定义变量）"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    style={{
                      ...inputStyle,
                      minHeight: 200,
                      resize: 'vertical',
                      fontFamily: 'monospace',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="模板描述（可选）"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={inputStyle}
                  />
                  {formData.content && (
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      检测到的变量: {[...formData.content.matchAll(/{{(\w+)}}/g)].map(m => `{{${m[1]}}}`).join(', ') || '无'}
                    </div>
                  )}
                  <button onClick={handleSaveForm} style={buttonStyle('primary')}>
                    <Save size={16} /> 保存模板
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Template Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filteredTemplates.map(template => (
              <div key={template.id} style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s',
              }}>
                <div style={{
                  padding: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }} onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      {expandedId === template.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span style={{ fontWeight: 600 }}>{template.name}</span>
                      {template.favorite && <Star size={14} fill="#ffd700" color="#ffd700" />}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>{template.description}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {template.variables.map(v => (
                        <span key={v} style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          background: 'rgba(102,126,234,0.3)',
                          borderRadius: 10,
                        }}>
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {expandedId === template.id && (
                  <div style={{
                    padding: 16,
                    background: 'rgba(0,0,0,0.2)',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <pre style={{
                      fontSize: 12,
                      background: 'rgba(0,0,0,0.3)',
                      padding: 12,
                      borderRadius: 8,
                      overflow: 'auto',
                      margin: '0 0 12px 0',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                    }}>
                      {template.content}
                    </pre>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleGenerate(template)}
                        disabled={generating}
                        style={buttonStyle('primary')}
                      >
                        <Play size={14} /> {generating ? '生成中...' : '预览生成'}
                      </button>
                      <button onClick={() => handleCopy(template.content)} style={buttonStyle('secondary')}>
                        <Copy size={14} /> 复制
                      </button>
                      <button onClick={() => handleOpenForm(template)} style={buttonStyle('ghost')}>
                        <Settings size={14} /> 编辑
                      </button>
                      <button
                        onClick={() => handleToggleFavorite(template.id)}
                        style={buttonStyle('ghost')}
                      >
                        <Star size={14} fill={template.favorite ? '#ffd700' : 'none'} />
                      </button>
                      <button onClick={() => handleDelete(template.id)} style={{ ...buttonStyle('ghost'), color: '#ff6b6b' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Generated Output */}
          {generatedPrompt && (
            <div style={{
              marginTop: 24,
              padding: 20,
              background: 'linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.2) 100%)',
              borderRadius: 12,
              border: '1px solid rgba(102,126,234,0.3)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={18} style={{ color: '#667eea' }} /> 生成的 Prompt
                </h3>
                <button onClick={() => handleCopy(generatedPrompt)} style={buttonStyle('primary')}>
                  <Copy size={14} /> 复制
                </button>
              </div>
              <pre style={{
                background: 'rgba(0,0,0,0.4)',
                padding: 16,
                borderRadius: 8,
                overflow: 'auto',
                maxHeight: 400,
                whiteSpace: 'pre-wrap',
                fontSize: 13,
                lineHeight: 1.6,
              }}>
                {generatedPrompt}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const buttonStyle = (variant: 'primary' | 'secondary' | 'ghost'): React.CSSProperties => {
  const base: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s',
  };
  switch (variant) {
    case 'primary':
      return { ...base, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' };
    case 'secondary':
      return { ...base, background: 'rgba(255,255,255,0.1)', color: '#fff' };
    case 'ghost':
      return { ...base, background: 'transparent', color: 'rgba(255,255,255,0.7)' };
  }
};

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 13,
  outline: 'none',
  width: '100%',
};

const formOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const formModalStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  padding: 24,
  borderRadius: 16,
  width: '90%',
  maxWidth: 560,
  maxHeight: '90vh',
  overflowY: 'auto',
  border: '1px solid rgba(255,255,255,0.1)',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#fff',
  fontSize: 24,
  cursor: 'pointer',
  lineHeight: 1,
};

export default PromptEngineeringLab;
