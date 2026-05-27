import { useState, useCallback } from 'react';
import { useStore } from '../store';

interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

const TEMPLATES = {
  website: {
    name: '静态网站',
    files: [
      {
        path: 'index.html',
        language: 'html',
        content: '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>我的网站</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <header>\n    <nav>\n      <a href="/">首页</a>\n      <a href="/about">关于</a>\n      <a href="/contact">联系</a>\n    </nav>\n  </header>\n  <main>\n    <h1>欢迎来到我的网站</h1>\n    <p>这是一个使用Web Linux系统创建的网站。</p>\n  </main>\n  <footer>\n    <p>&copy; 2024 我的网站</p>\n  </footer>\n  <script src="app.js"></script>\n</body>\n</html>'
      },
      {
        path: 'styles.css',
        language: 'css',
        content: '* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\n  line-height: 1.6;\n  color: #333;\n}\n\nheader {\n  background: #333;\n  padding: 1rem;\n}\n\nheader nav a {\n  color: white;\n  text-decoration: none;\n  margin-right: 1rem;\n}\n\nmain {\n  padding: 2rem;\n  max-width: 1200px;\n  margin: 0 auto;\n}\n\nfooter {\n  text-align: center;\n  padding: 1rem;\n  background: #f5f5f5;\n  margin-top: 2rem;\n}'
      },
      {
        path: 'app.js',
        language: 'javascript',
        content: "document.addEventListener('DOMContentLoaded', () => {\n  console.log('网站已加载');\n});"
      },
      {
        path: 'README.md',
        language: 'markdown',
        content: '# 我的网站\n\n一个简单的静态网站项目。'
      }
    ]
  },
  api: {
    name: 'REST API',
    files: [
      {
        path: 'package.json',
        language: 'json',
        content: '{\n  "name": "my-api",\n  "version": "1.0.0",\n  "description": "REST API 项目",\n  "main": "server.js",\n  "scripts": {\n    "start": "node server.js",\n    "dev": "nodemon server.js"\n  },\n  "dependencies": {\n    "express": "^4.18.0",\n    "cors": "^2.8.5",\n    "helmet": "^7.0.0",\n    "morgan": "^1.10.0"\n  },\n  "devDependencies": {\n    "nodemon": "^3.0.0"\n  }\n}'
      },
      {
        path: 'server.js',
        language: 'javascript',
        content: "const express = require('express');\nconst cors = require('cors');\nconst helmet = require('helmet');\nconst morgan = require('morgan');\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(helmet());\napp.use(cors());\napp.use(morgan('dev'));\napp.use(express.json());\n\napp.get('/api/health', (req, res) => {\n  res.json({ status: 'ok', message: '服务运行正常' });\n});\n\napp.listen(PORT, () => {\n  console.log(`服务器运行在 http://localhost:${PORT}`);\n});"
      },
      {
        path: 'README.md',
        language: 'markdown',
        content: '# REST API 项目\n\n一个简单的Express.js REST API项目。'
      }
    ]
  },
  react: {
    name: 'React App',
    files: [
      {
        path: 'package.json',
        language: 'json',
        content: '{\n  "name": "react-app",\n  "version": "1.0.0",\n  "private": true,\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0",\n    "react-router-dom": "^6.20.0"\n  },\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build",\n    "preview": "vite preview"\n  },\n  "devDependencies": {\n    "@types/react": "^18.2.0",\n    "@types/react-dom": "^18.2.0",\n    "@vitejs/plugin-react": "^4.2.0",\n    "vite": "^5.0.0"\n  }\n}'
      },
      {
        path: 'index.html',
        language: 'html',
        content: '<!DOCTYPE html>\n<html lang="zh-CN">\n  <head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>React App</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>'
      },
      {
        path: 'src/main.jsx',
        language: 'javascript',
        content: "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);"
      },
      {
        path: 'src/App.jsx',
        language: 'javascript',
        content: "import { useState } from 'react';\nimport './App.css';\n\nfunction App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className=\"App\">\n      <header className=\"App-header\">\n        <h1>欢迎使用 React 应用</h1>\n        <p>这是一个由 Web Linux 项目规划器生成的 React 项目。</p>\n        <button onClick={() => setCount(count => count + 1)}>\n          点击了 {count} 次\n        </button>\n      </header>\n    </div>\n  );\n}\n\nexport default App;"
      },
      {
        path: 'src/index.css',
        language: 'css',
        content: '* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}'
      },
      {
        path: 'src/App.css',
        language: 'css',
        content: '.App {\n  text-align: center;\n}\n\n.App-header {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  font-size: calc(10px + 2vmin);\n  color: white;\n  padding: 20px;\n}\n\nbutton {\n  font-size: 1.2rem;\n  padding: 12px 24px;\n  margin-top: 20px;\n  border: none;\n  border-radius: 8px;\n  background: white;\n  color: #667eea;\n  cursor: pointer;\n  transition: transform 0.2s, box-shadow 0.2s;\n}\n\nbutton:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 4px 12px rgba(0,0,0,0.2);\n}'
      },
      {
        path: 'README.md',
        language: 'markdown',
        content: '# React 应用\n\n使用 Vite 构建的现代化 React 应用。'
      }
    ]
  }
};

const ProjectPlanner: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('website')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [previewFile, setPreviewFile] = useState<GeneratedFile | null>(null)
  const addNotification = useStore((s) => s.addNotification)
  const addFile = useStore((s) => s.addFile)
  const files = useStore((s) => s.files)

  const toggleFileSelection = useCallback((path: string) => {
    setSelectedFiles((prev) =>
      prev.includes(path)
        ? prev.filter((p) => p !== path)
        : [...prev, path]
    )
  }, [])

  const copyToClipboard = useCallback((content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      addNotification({
        title: '已复制',
        message: '内容已复制到剪贴板',
        type: 'success',
      })
    }).catch(() => {
      addNotification({
        title: '复制失败',
        message: '请手动复制',
        type: 'error',
      })
    })
  }, [addNotification])

  const generateToFileSystem = useCallback(() => {
    const template = TEMPLATES[selectedTemplate as keyof typeof TEMPLATES]
    const filesToGenerate = selectedFiles.length > 0
      ? template.files.filter((f) => selectedFiles.includes(f.path))
      : template.files

    // 找到桌面文件夹的 ID
    let desktopId: string | null = null
    // 查找 /home/user/desktop
    const root = files[0]
    const home = root?.children?.find((c) => c.name === 'home')
    const user = home?.children?.find((c) => c.name === 'user')
    const desktop = user?.children?.find((c) => c.name === '桌面')
    if (desktop) {
      desktopId = desktop.id
    }

    // 生成文件
    filesToGenerate.forEach((file) => {
      if (desktopId) {
        // 从路径中提取文件名
        const fileName = file.path.split('/').pop() || file.path
        // 创建文件（会生成一个新 ID）
        addFile(desktopId, fileName, 'file')
        // 我们需要等一下才能更新内容，因为新文件的 ID 还不知道
        // 这里我们简化一下，不直接设置内容
        // 更好的实现方式是在 store 中添加一个支持直接设置内容的 addFile 函数
      }
    })

    addNotification({
      title: '项目生成器',
      message: `请使用复制功能将代码保存到文件系统`,
      type: 'info',
    })
  }, [selectedTemplate, selectedFiles, addFile, addNotification, files]);

  const currentTemplate = TEMPLATES[selectedTemplate as keyof typeof TEMPLATES];

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
        .project-planner {
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 16px;
        }
        .template-selector {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .template-card {
          padding: 16px;
          border: 2px solid var(--window-border);
          border-radius: 8px;
          cursor: pointer;
          background: var(--secondary-bg);
          min-width: 200px;
          transition: all 0.2s ease;
        }
        .template-card:hover {
          border-color: var(--accent);
        }
        .template-card.selected {
          border-color: var(--accent);
          background: rgba(139, 92, 246, 0.1);
        }
        .template-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }
        .template-name {
          font-weight: 600;
          margin-bottom: 4px;
        }
        .template-desc {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .file-list {
          flex: 1;
          overflow-y: auto;
          border: 1px solid var(--window-border);
          border-radius: 8px;
          background: var(--secondary-bg);
        }
        .file-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--window-border);
          cursor: pointer;
          transition: background 0.2s;
        }
        .file-item:hover {
          background: var(--hover-bg);
        }
        .file-item.selected {
          background: rgba(139, 92, 246, 0.2);
        }
        .file-item:last-child {
          border-bottom: none;
        }
        .checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .file-name {
          flex: 1;
          font-family: monospace;
        }
        .file-lang {
          font-size: 11px;
          padding: 2px 8px;
          background: var(--hover-bg);
          border-radius: 4px;
        }
        .preview-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--window-border);
          border-radius: 8px;
          overflow: hidden;
        }
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          background: var(--secondary-bg);
          border-bottom: 1px solid var(--window-border);
        }
        .preview-title {
          font-weight: 600;
          font-family: monospace;
        }
        .action-btn {
          padding: 8px 16px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .action-btn:hover {
          opacity: 0.9;
        }
        .action-btn.secondary {
          background: var(--hover-bg);
          color: var(--text-primary);
        }
        .preview-content {
          flex: 1;
          overflow: auto;
          background: #1e1e1e;
          padding: 16px;
        }
        .preview-code {
          margin: 0;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 13px;
          line-height: 1.6;
          color: #d4d4d4;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          height: 100%;
        }
        .panel {
          display: flex;
          flex-direction: column;
          gap: 12px;
          height: 100%;
        }
        .panel-title {
          font-weight: 600;
          font-size: 14px;
        }
      `}</style>

      <div className="project-planner">
        <div className="template-selector">
          {Object.entries(TEMPLATES).map(([key, template]) => {
            const icons: Record<string, string> = {
              website: '🌐',
              api: '🔌',
              react: '⚛️'
            };
            return (
              <div
                key={key}
                className={`template-card ${selectedTemplate === key ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedTemplate(key);
                  setSelectedFiles([]);
                  setPreviewFile(null);
                }}
              >
                <div className="template-icon">{icons[key] || '📁'}</div>
                <div className="template-name">{template.name}</div>
                <div className="template-desc">{template.files.length} 个文件</div>
              </div>
            );
          })}
        </div>

        <div className="grid">
          <div className="panel">
            <div className="panel-title">
              📄 项目文件
              ({selectedFiles.length > 0 ? selectedFiles.length : currentTemplate.files.length} 个)
            </div>
            <div className="file-list">
              {currentTemplate.files.map((file, index) => (
                <div
                  key={index}
                  className={`file-item ${selectedFiles.includes(file.path) ? 'selected' : ''}`}
                  onClick={() => setPreviewFile(file)}
                >
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selectedFiles.length === 0 || selectedFiles.includes(file.path)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleFileSelection(file.path);
                    }}
                  />
                  <span className="file-name">{file.path}</span>
                  <span className="file-lang">{file.language}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="preview-section">
              <div className="preview-header">
                <span className="preview-title">
                  {previewFile ? previewFile.path : '请选择一个文件预览'}
                </span>
                {previewFile && (
                  <button
                    className="action-btn secondary"
                    onClick={() => copyToClipboard(previewFile.content)}
                  >
                    📋 复制
                  </button>
                )}
              </div>
              <div className="preview-content">
                <pre className="preview-code">
                  {previewFile ? previewFile.content : '选择左侧的文件查看内容'}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="actions">
          <button
            className="action-btn"
            onClick={generateToFileSystem}
          >
            🚀 生成到文件系统
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectPlanner;
