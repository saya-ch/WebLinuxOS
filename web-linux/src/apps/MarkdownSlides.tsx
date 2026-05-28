import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';

// Default sample presentation
const DEFAULT_SLIDES = `# Web Linux OS

## 一个完全在浏览器中运行的 Linux 桌面环境

---

## 功能丰富

- 120+ 个应用程序
- 完整的文件系统
- 终端模拟器
- 虚拟桌面支持

---

## 开发友好

- 支持多种编程语言
- 内置代码编辑器
- API 测试工具
- Git 集成

---

## 创新功能

- AI 助手集成
- 实时协作白板
- 智能项目管理
- Markdown 幻灯片（就是这个！）

---

## 感谢使用

### https://github.com/saya-ch/WebLinuxOS
`;

export default function MarkdownSlides() {
  const [markdown, setMarkdown] = useState(DEFAULT_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const slidesRef = useRef<string[]>([]);
  
  // Split markdown into slides by '---' separator
  const slides = markdown.split(/^---\s*$/m);
  slidesRef.current = slides;
  
  const totalSlides = slides.length;
  
  // Render markdown to HTML
  const renderSlide = (slideIndex: number) => {
    if (slideIndex < 0 || slideIndex >= slides.length) return '';
    return marked.parse(slides[slideIndex], { breaks: true, gfm: true }) as string;
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        switch (e.key) {
          case 'ArrowRight':
          case 'Space':
          case 'PageDown':
            e.preventDefault();
            nextSlide();
            break;
          case 'ArrowLeft':
          case 'PageUp':
            e.preventDefault();
            prevSlide();
            break;
          case 'Escape':
            setIsFullscreen(false);
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, currentSlide, totalSlides]);
  
  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };
  
  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };
  
  const goToSlide = (index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
    }
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  const exportPDF = () => {
    window.print();
  };
  
  const saveToFile = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.md';
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const loadFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setMarkdown(content);
        setCurrentSlide(0);
      };
      reader.readAsText(file);
    }
  };
  
  // If fullscreen, show only the slide
  if (isFullscreen) {
    return (
      <div 
        className="fullscreen-slide"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0a0a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '40px'
        }}
        onClick={() => nextSlide()}
      >
        <div 
          style={{
            maxWidth: '1200px',
            width: '100%',
            fontSize: '1.5rem',
            textAlign: 'center',
            color: '#fff'
          }}
          dangerouslySetInnerHTML={{ __html: renderSlide(currentSlide) }}
        />
        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          color: '#666',
          fontSize: '14px'
        }}>
          {currentSlide + 1} / {totalSlides}
        </div>
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          color: '#666',
          fontSize: '12px'
        }}>
          ← / → to navigate, ESC to exit
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#0d0d1f',
      color: '#e8e8f4',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Top toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #2a2a4a',
        backgroundColor: '#121228'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
          📊 Markdown 幻灯片
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="file"
            id="load-file"
            accept=".md"
            onChange={loadFromFile}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => document.getElementById('load-file')?.click()}
            style={{
              padding: '6px 12px',
              backgroundColor: '#282850',
              border: '1px solid #3a3a6a',
              borderRadius: '6px',
              color: '#e8e8f4',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            📂 加载
          </button>
          <button
            onClick={saveToFile}
            style={{
              padding: '6px 12px',
              backgroundColor: '#282850',
              border: '1px solid #3a3a6a',
              borderRadius: '6px',
              color: '#e8e8f4',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            💾 保存
          </button>
          <button
            onClick={exportPDF}
            style={{
              padding: '6px 12px',
              backgroundColor: '#282850',
              border: '1px solid #3a3a6a',
              borderRadius: '6px',
              color: '#e8e8f4',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            📄 导出 PDF
          </button>
          <button
            onClick={toggleFullscreen}
            style={{
              padding: '6px 12px',
              backgroundColor: '#8b5cf6',
              border: '1px solid #7c3aed',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            🔲 全屏演示
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #2a2a4a' }}>
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#121228',
            fontSize: '12px',
            color: '#888',
            borderBottom: '1px solid #2a2a4a'
          }}>
            Markdown 编辑器 (使用 --- 分隔幻灯片)
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: '#0d0d1f',
              color: '#e8e8f4',
              border: 'none',
              padding: '16px',
              fontFamily: 'Menlo, Monaco, "Courier New", monospace',
              fontSize: '14px',
              lineHeight: '1.6',
              outline: 'none',
              resize: 'none'
            }}
          />
        </div>
        
        {/* Preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#121228' }}>
          <div style={{
            padding: '8px 16px',
            fontSize: '12px',
            color: '#888',
            borderBottom: '1px solid #2a2a4a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>幻灯片 {currentSlide + 1} / {totalSlides}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#282850',
                  border: '1px solid #3a3a6a',
                  borderRadius: '4px',
                  color: currentSlide === 0 ? '#666' : '#e8e8f4',
                  cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '12px'
                }}
              >
                ←
              </button>
              <button
                onClick={nextSlide}
                disabled={currentSlide === totalSlides - 1}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#282850',
                  border: '1px solid #3a3a6a',
                  borderRadius: '4px',
                  color: currentSlide === totalSlides - 1 ? '#666' : '#e8e8f4',
                  cursor: currentSlide === totalSlides - 1 ? 'not-allowed' : 'pointer',
                  fontSize: '12px'
                }}
              >
                →
              </button>
            </div>
          </div>
          
          {/* Slide thumbnails */}
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '8px 12px',
            overflowX: 'auto',
            borderBottom: '1px solid #2a2a4a',
            backgroundColor: '#0d0d1f'
          }}>
            {slides.map((_, index) => (
              <div
                key={index}
                onClick={() => goToSlide(index)}
                style={{
                  minWidth: '80px',
                  height: '60px',
                  backgroundColor: index === currentSlide ? '#8b5cf6' : '#282850',
                  border: `2px solid ${index === currentSlide ? '#a78bfa' : '#3a3a6a'}`,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: index === currentSlide ? '#fff' : '#a0a0c8',
                  cursor: 'pointer',
                  fontWeight: index === currentSlide ? 'bold' : 'normal'
                }}
              >
                {index + 1}
              </div>
            ))}
          </div>
          
          {/* Slide preview */}
          <div style={{
            flex: 1,
            padding: '24px',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div 
              style={{
                backgroundColor: '#0a0a1a',
                padding: '40px',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '900px',
                aspectRatio: '16/9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
              }}
              className="slide-preview"
              dangerouslySetInnerHTML={{ __html: renderSlide(currentSlide) }}
            />
          </div>
        </div>
      </div>
      
      {/* Print styles */}
      <style>{`
        @media print {
          .fullscreen-slide,
          .slide-preview {
            background-color: white !important;
            color: black !important;
          }
        }
        
        /* Simple slide styling */
        .slide-preview h1, .fullscreen-slide h1 {
          font-size: 2.5em;
          margin-bottom: 0.5em;
          color: #8b5cf6;
        }
        .slide-preview h2, .fullscreen-slide h2 {
          font-size: 1.8em;
          margin-bottom: 0.8em;
          color: #06b6d4;
        }
        .slide-preview ul, .fullscreen-slide ul {
          text-align: left;
          display: inline-block;
          font-size: 1.3em;
          line-height: 2;
        }
        .slide-preview p, .fullscreen-slide p {
          font-size: 1.2em;
        }
        .slide-preview code, .fullscreen-slide code {
          background: rgba(139, 92, 246, 0.2);
          padding: 2px 8px;
          border-radius: 4px;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}
