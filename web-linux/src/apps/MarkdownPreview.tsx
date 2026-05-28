import { useState, useMemo, useEffect } from 'react'
import { marked } from 'marked'

interface MarkdownPreviewProps {
  content: string
  onClose?: () => void
}

export default function MarkdownPreview({ content, onClose }: MarkdownPreviewProps) {
  const [html, setHtml] = useState('')
  
  useEffect(() => {
    const renderMarkdown = async () => {
      marked.setOptions({
        breaks: true,
        gfm: true,
      })
      const result = await marked.parse(content || '')
      setHtml(result)
    }
    renderMarkdown()
  }, [content])
  
  return (
    <div 
      className="app-container app-markdown-preview"
      style={{
        padding: '20px',
        background: '#ffffff',
        color: '#1a1a1a',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'auto',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        .markdown-preview-content {
          max-width: 800px;
          margin: 0 auto;
          line-height: 1.6;
        }
        .markdown-preview-content h1 {
          font-size: 2em;
          border-bottom: 1px solid #eaecef;
          padding-bottom: 0.3em;
          margin-top: 0;
          margin-bottom: 16px;
        }
        .markdown-preview-content h2 {
          font-size: 1.5em;
          border-bottom: 1px solid #eaecef;
          padding-bottom: 0.3em;
          margin-top: 24px;
          margin-bottom: 16px;
        }
        .markdown-preview-content h3 {
          font-size: 1.25em;
          margin-top: 24px;
          margin-bottom: 16px;
        }
        .markdown-preview-content p {
          margin-bottom: 16px;
        }
        .markdown-preview-content code {
          background: #f6f8fa;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
          font-size: 85%;
        }
        .markdown-preview-content pre {
          background: #f6f8fa;
          padding: 16px;
          border-radius: 6px;
          overflow-x: auto;
          margin-bottom: 16px;
        }
        .markdown-preview-content pre code {
          background: transparent;
          padding: 0;
        }
        .markdown-preview-content blockquote {
          border-left: 4px solid #dfe2e5;
          color: #6a737d;
          margin: 0 0 16px 0;
          padding: 0 1em;
        }
        .markdown-preview-content ul, .markdown-preview-content ol {
          padding-left: 2em;
          margin-bottom: 16px;
        }
        .markdown-preview-content li {
          margin-bottom: 4px;
        }
        .markdown-preview-content table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 16px;
        }
        .markdown-preview-content th, .markdown-preview-content td {
          border: 1px solid #dfe2e5;
          padding: 6px 13px;
        }
        .markdown-preview-content th {
          background: #f6f8fa;
        }
        .markdown-preview-content hr {
          height: 0.25em;
          padding: 0;
          margin: 24px 0;
          background-color: #e1e4e8;
          border: 0;
        }
        .markdown-preview-content a {
          color: #0366d6;
          text-decoration: none;
        }
        .markdown-preview-content a:hover {
          text-decoration: underline;
        }
        .markdown-preview-content img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
      <div 
        className="markdown-preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
