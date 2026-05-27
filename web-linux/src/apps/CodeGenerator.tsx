import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../store';

interface CodeSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
}

const TEMPLATES: CodeSnippet[] = [
  {
    id: 'react-component',
    title: 'React组件',
    description: '创建一个基础的React函数组件',
    language: 'typescript',
    code: `import { useState, useEffect } from 'react';

interface Props {
  title: string;
  onAction?: () => void;
}

const MyComponent: React.FC<Props> = ({ title, onAction }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('组件已挂载');
    return () => console.log('组件已卸载');
  }, []);

  return (
    <div className="component">
      <h2>{title}</h2>
      <p>计数器: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        增加
      </button>
      {onAction && (
        <button onClick={onAction}>执行操作</button>
      )}
    </div>
  );
};

export default MyComponent;`
  },
  {
    id: 'api-call',
    title: 'API调用',
    description: '一个完整的异步API调用函数',
    language: 'typescript',
    code: `interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

async function fetchData<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(\`HTTP错误: \${response.status}\`);
    }

    const data = await response.json();
    return {
      data,
      status: response.status,
    };
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}

// 使用示例
// const result = await fetchData<User>('/api/users');
// console.log(result.data);`
  },
  {
    id: 'debounce',
    title: '防抖函数',
    description: '一个实用的防抖工具函数',
    language: 'typescript',
    code: `function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// 使用示例
// const handleSearch = debounce((query) => {
//   console.log('搜索:', query);
// }, 300);`
  },
  {
    id: 'local-storage',
    title: 'LocalStorage工具',
    description: '类型安全的LocalStorage操作',
    language: 'typescript',
    code: `const Storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue ?? null;
    } catch {
      return defaultValue ?? null;
    }
  },

  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('存储失败:', error);
    }
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  },

  clear: (): void => {
    localStorage.clear();
  },
};

// 使用示例
// Storage.set('theme', 'dark');
// const theme = Storage.get<string>('theme', 'light');`
  },
  {
    id: 'form-validation',
    title: '表单验证',
    description: '简单的表单验证工具',
    language: 'typescript',
    code: `interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message?: string;
}

interface ValidationErrors {
  [field: string]: string[];
}

function validateForm(
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): { valid: boolean; errors: ValidationErrors } {
  const errors: ValidationErrors = {};

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    const fieldErrors: string[] = [];

    if (rule.required && !value) {
      fieldErrors.push(rule.message || \`\${field}是必填项\`);
    }

    if (rule.minLength && value && value.length < rule.minLength) {
      fieldErrors.push(\`最小长度为\${rule.minLength}\`);
    }

    if (rule.maxLength && value && value.length > rule.maxLength) {
      fieldErrors.push(\`最大长度为\${rule.maxLength}\`);
    }

    if (rule.pattern && value && !rule.pattern.test(value)) {
      fieldErrors.push('格式不正确');
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// 使用示例
// const { valid, errors } = validateForm(
//   { email: '', password: '123' },
//   {
//     email: { required: true, pattern: /^[^@]+@[^@]+$/ },
//     password: { required: true, minLength: 6 },
//   }
// );`
  }
];

const CodeGenerator: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<CodeSnippet>(TEMPLATES[0]);
  const [customCode, setCustomCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [activeTab, setActiveTab] = useState<'template' | 'custom'>('template');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addNotification = useStore(s => s.addNotification);

  const copyToClipboard = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      addNotification({
        title: '已复制',
        message: '代码已复制到剪贴板',
        type: 'success',
      });
    }).catch(() => {
      addNotification({
        title: '复制失败',
        message: '请手动复制',
        type: 'error',
      });
    });
  }, [addNotification]);

  const generateCode = useCallback(() => {
    if (activeTab === 'template') {
      setGeneratedCode(selectedTemplate.code);
    } else {
      setGeneratedCode(customCode);
    }
  }, [activeTab, selectedTemplate, customCode]);

  const selectTemplate = useCallback((template: CodeSnippet) => {
    setSelectedTemplate(template);
  }, []);

  useEffect(() => {
    generateCode();
  }, [selectedTemplate, generateCode]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '16px',
      background: 'var(--window-bg)',
      color: 'var(--text-primary)',
    }}>
      <style>{`
        .code-generator-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
        }
        .tabs {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid var(--window-border);
          padding-bottom: 8px;
        }
        .tab-btn {
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 4px;
        }
        .tab-btn.active {
          background: var(--accent);
          color: white;
        }
        .tab-btn:hover:not(.active) {
          background: var(--hover-bg);
        }
        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
          overflow-y: auto;
        }
        .template-card {
          padding: 16px;
          border: 1px solid var(--window-border);
          border-radius: 8px;
          cursor: pointer;
          background: var(--secondary-bg);
          transition: all 0.2s ease;
        }
        .template-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
        }
        .template-card.selected {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }
        .template-title {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .template-desc {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .template-lang {
          display: inline-block;
          margin-top: 8px;
          padding: 2px 8px;
          background: var(--hover-bg);
          border-radius: 4px;
          font-size: 11px;
          color: var(--text-secondary);
        }
        .code-output-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .code-title {
          font-weight: 600;
          font-size: 14px;
        }
        .copy-btn {
          padding: 8px 16px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .copy-btn:hover {
          opacity: 0.9;
        }
        .code-display {
          flex: 1;
          background: #1e1e1e;
          border: 1px solid var(--window-border);
          border-radius: 8px;
          overflow: auto;
        }
        .code-textarea {
          width: 100%;
          height: 100%;
          min-height: 300px;
          padding: 16px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 13px;
          line-height: 1.5;
          background: transparent;
          color: #d4d4d4;
          border: none;
          outline: none;
          resize: none;
        }
        .custom-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          height: 100%;
        }
        .custom-input {
          flex: 1;
        }
      `}</style>

      <div className="code-generator-container">
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'template' ? 'active' : ''}`}
            onClick={() => setActiveTab('template')}
          >
            📦 模板
          </button>
          <button 
            className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            ✏️ 自定义
          </button>
        </div>

        {activeTab === 'template' && (
          <div className="templates-grid">
            {TEMPLATES.map(template => (
              <div 
                key={template.id}
                className={`template-card ${selectedTemplate.id === template.id ? 'selected' : ''}`}
                onClick={() => selectTemplate(template)}
              >
                <div className="template-title">{template.title}</div>
                <div className="template-desc">{template.description}</div>
                <span className="template-lang">{template.language}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="custom-section">
            <textarea
              ref={textareaRef}
              className="code-textarea custom-input"
              placeholder="输入你的自定义代码需求..."
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="copy-btn" onClick={generateCode}>
                🚀 生成代码
              </button>
            </div>
          </div>
        )}

        <div className="code-output-section">
          <div className="code-header">
            <span className="code-title">
              生成的代码 {activeTab === 'template' && `- ${selectedTemplate.title}`}
            </span>
            <button 
              className="copy-btn"
              onClick={() => copyToClipboard(generatedCode || selectedTemplate.code)}
            >
              📋 复制代码
            </button>
          </div>
          <div className="code-display">
            <pre style={{ margin: 0, padding: '16px', fontFamily: 'Monaco, Menlo, monospace', fontSize: '13px' }}>
              <code>{activeTab === 'template' ? selectedTemplate.code : generatedCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeGenerator;
