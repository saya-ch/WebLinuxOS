import { useState, useCallback, useMemo } from 'react';

/**
 * AI正则表达式生成器
 * 基于Pollinations AI API的正则表达式工具
 * 支持自然语言描述生成正则表达式，并提供实时测试
 */

interface RegexExample {
  id: string;
  name: string;
  description: string;
  pattern: string;
  flags: string;
  testCases: { input: string; expected: boolean }[];
}

const EXAMPLES: RegexExample[] = [
  {
    id: 'email',
    name: '邮箱地址',
    description: '匹配标准邮箱格式',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    flags: 'g',
    testCases: [
      { input: 'user@example.com', expected: true },
      { input: 'invalid-email', expected: false },
      { input: 'test@sub.domain.org', expected: true },
    ],
  },
  {
    id: 'phone',
    name: '手机号',
    description: '匹配中国大陆手机号',
    pattern: '1[3-9]\\d{9}',
    flags: 'g',
    testCases: [
      { input: '13812345678', expected: true },
      { input: '12345678901', expected: false },
      { input: '15900001111', expected: true },
    ],
  },
  {
    id: 'url',
    name: 'URL链接',
    description: '匹配HTTP/HTTPS链接',
    pattern: 'https?://[a-zA-Z0-9.-]+(?:/[a-zA-Z0-9./?%&=-]*)?',
    flags: 'g',
    testCases: [
      { input: 'https://example.com', expected: true },
      { input: 'ftp://invalid.com', expected: false },
      { input: 'http://site.com/path?q=1', expected: true },
    ],
  },
  {
    id: 'ipv4',
    name: 'IPv4地址',
    description: '匹配IPv4地址格式',
    pattern: '(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)',
    flags: 'g',
    testCases: [
      { input: '192.168.1.1', expected: true },
      { input: '256.0.0.1', expected: false },
      { input: '10.0.0.255', expected: true },
    ],
  },
  {
    id: 'date',
    name: '日期格式',
    description: '匹配YYYY-MM-DD格式日期',
    pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])',
    flags: 'g',
    testCases: [
      { input: '2024-01-15', expected: true },
      { input: '2024-13-01', expected: false },
      { input: '2023-12-31', expected: true },
    ],
  },
  {
    id: 'hexcolor',
    name: '十六进制颜色',
    description: '匹配#RGB或#RRGGBB格式',
    pattern: '#(?:[0-9a-fA-F]{3}){1,2}',
    flags: 'g',
    testCases: [
      { input: '#fff', expected: true },
      { input: '#gggggg', expected: false },
      { input: '#123456', expected: true },
    ],
  },
];

interface MatchResult {
  match: string;
  index: number;
  groups: Record<string, string> | null;
}

export default function AIRegexGenerator() {
  const [description, setDescription] = useState('');
  const [generatedPattern, setGeneratedPattern] = useState('');
  const [generatedFlags, setGeneratedFlags] = useState('g');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [testString, setTestString] = useState('');
  const [copied, setCopied] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [history, setHistory] = useState<{ pattern: string; description: string; timestamp: number }[]>([]);

  const buildPrompt = useCallback((desc: string) => {
    return `Generate a regular expression for the following requirement:

"${desc}"

Requirements:
1. Output ONLY the regex pattern itself on the first line
2. On the second line, output the recommended flags
3. On the third line, output a brief explanation in Chinese
4. On the fourth line, output 3 test cases in format: input|expected(true/false)
5. Make the regex as precise and efficient as possible
6. Use standard regex syntax (JavaScript compatible)`;
  }, []);

  const generateRegex = useCallback(async () => {
    if (isGenerating || !description.trim()) return;
    setIsGenerating(true);
    setError('');
    setGeneratedPattern('');
    setAiExplanation('');

    try {
      const fullPrompt = buildPrompt(description.trim());
      const response = await fetch(
        `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?temperature=0.3&nologo=true`
      );

      if (!response.ok) {
        throw new Error(`API错误: ${response.status}`);
      }

      const text = (await response.text()).trim();
      const lines = text.split('\n').filter(line => line.trim());
      
      let pattern = '';
      let flags = 'g';
      let explanation = '';

      // 尝试解析AI响应
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // 跳过markdown代码块标记
        if (line === '```' || line.startsWith('```')) continue;
        
        if (!pattern && (line.includes('[') || line.includes('\\') || line.startsWith('^') || line.startsWith('.'))) {
          pattern = line.replace(/^```\w*\s*/, '').trim();
        } else if (pattern && !explanation && /^[gimsuy]+$/.test(line)) {
          flags = line;
        } else if (pattern && !explanation && line.length > 10 && !line.includes('|')) {
          explanation = line;
        }
      }

      // 如果解析失败，尝试更简单的方法
      if (!pattern && lines.length > 0) {
        // 取第一行看起来像正则的内容
        for (const line of lines) {
          const trimmed = line.replace(/^```\w*\s*/, '').replace(/```$/, '').trim();
          if (trimmed.length > 3 && !trimmed.includes(' ') && (trimmed.includes('\\') || trimmed.includes('[') || trimmed.includes('*'))) {
            pattern = trimmed;
            break;
          }
        }
      }

      if (!pattern) {
        throw new Error('无法解析AI生成的正则表达式，请重试或调整描述');
      }

      setGeneratedPattern(pattern);
      setGeneratedFlags(flags);
      setAiExplanation(explanation || '点击测试按钮验证正则表达式');

      setHistory(prev => [
        { pattern, description: description.trim(), timestamp: Date.now() },
        ...prev,
      ].slice(0, 20));

    } catch (err) {
      const message = err instanceof Error ? err.message : '生成失败';
      setError(message);
      // 提供本地回退
      setGeneratedPattern('.+');
      setGeneratedFlags('g');
      setAiExplanation('这是一个匹配任意内容的回退正则表达式。请重试或手动输入。');
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, description, buildPrompt]);

  const testMatches = useCallback((): MatchResult[] => {
    if (!generatedPattern || !testString) return [];
    
    try {
      const regex = new RegExp(generatedPattern, generatedFlags);
      const results: MatchResult[] = [];
      let match;
      let count = 0;
      
      if (regex.global) {
        while ((match = regex.exec(testString)) !== null && count < 50) {
          results.push({
            match: match[0],
            index: match.index,
            groups: match.groups || null,
          });
          if (match[0].length === 0) regex.lastIndex++;
          count++;
        }
      } else {
        match = regex.exec(testString);
        if (match) {
          results.push({
            match: match[0],
            index: match.index,
            groups: match.groups || null,
          });
        }
      }
      return results;
    } catch {
      return [];
    }
  }, [generatedPattern, generatedFlags, testString]);

  const regexValid = useMemo(() => {
    if (!generatedPattern) return null;
    try {
      new RegExp(generatedPattern, generatedFlags);
      return true;
    } catch {
      return false;
    }
  }, [generatedPattern, generatedFlags]);

  const copyRegex = useCallback(async () => {
    if (!generatedPattern) return;
    try {
      await navigator.clipboard.writeText(`/${generatedPattern}/${generatedFlags}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = `/${generatedPattern}/${generatedFlags}`;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedPattern, generatedFlags]);

  const loadExample = useCallback((example: RegexExample) => {
    setDescription(example.description);
    setGeneratedPattern(example.pattern);
    setGeneratedFlags(example.flags);
    setAiExplanation(`${example.name}：${example.description}`);
    setError('');
  }, []);

  const applyFromHistory = useCallback((item: { pattern: string; description: string }) => {
    setDescription(item.description);
    setGeneratedPattern(item.pattern);
    setAiExplanation('从历史记录加载');
    setError('');
  }, []);

  const matches = testMatches();

  return (
    <div style={{
      padding: '20px',
      height: '100%',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      color: '#e0e0e0',
      fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
      overflow: 'auto',
    }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #f72585, #7209b7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
        }}>.*</div>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>AI 正则表达式生成器</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#aaa' }}>用自然语言描述，AI自动生成正则表达式</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* 左侧 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* 自然语言输入 */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '10px', fontWeight: 500 }}>
              描述你想匹配的内容
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：匹配16进制颜色代码、URL链接、邮箱地址等..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: '#e0e0e0',
                fontSize: '13px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={generateRegex}
              disabled={isGenerating || !description.trim()}
              style={{
                marginTop: '10px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: (isGenerating || !description.trim())
                  ? 'rgba(247,37,133,0.4)'
                  : 'linear-gradient(135deg, #f72585, #7209b7)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: (isGenerating || !description.trim()) ? 'not-allowed' : 'pointer',
                width: '100%',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isGenerating ? (
                <>
                  <span style={{ 
                    width: '14px', 
                    height: '14px', 
                    border: '2px solid rgba(255,255,255,0.3)', 
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  生成中...
                </>
              ) : (
                <>✨ 生成正则表达式</>
              )}
            </button>
          </div>

          {/* 预设示例 */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '10px', fontWeight: 500 }}>
              预设示例（点击加载）
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {EXAMPLES.map(example => (
                <button
                  key={example.id}
                  onClick={() => loadExample(example)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(247,37,133,0.3)',
                    background: 'rgba(247,37,133,0.1)',
                    color: '#f72585',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s',
                  }}
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>

          {/* 历史记录 */}
          {history.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '10px', fontWeight: 500 }}>
                历史记录
              </div>
              <div style={{ maxHeight: '100px', overflow: 'auto' }}>
                {history.slice(0, 5).map((item, i) => (
                  <button
                    key={i}
                    onClick={() => applyFromHistory(item)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      marginBottom: '4px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#bbb',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '11px',
                      display: 'flex',
                      gap: '8px',
                    }}
                  >
                    <code style={{ color: '#f72585', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.pattern}
                    </code>
                    <span style={{ color: '#666' }}>{item.description.slice(0, 20)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(231,76,60,0.2)',
              border: '1px solid rgba(231,76,60,0.4)',
              color: '#ff9080',
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}
        </div>

        {/* 右侧 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* 生成的正则 */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
            }}>
              <div style={{ fontSize: '13px', color: '#aaa', fontWeight: 500 }}>
                生成的正则表达式
                {regexValid !== null && !regexValid && (
                  <span style={{ color: '#e74c3c', marginLeft: '10px' }}>⚠ 无效正则</span>
                )}
              </div>
              <button
                onClick={copyRegex}
                disabled={!generatedPattern}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: copied ? 'rgba(39,201,63,0.2)' : 'transparent',
                  color: copied ? '#27c93f' : '#ccc',
                  cursor: !generatedPattern ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                }}
              >
                {copied ? '✓ 已复制' : '📋 复制'}
              </button>
            </div>
            <div style={{ padding: '14px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                background: 'rgba(0,0,0,0.4)',
                borderRadius: '8px',
                padding: '12px',
                fontFamily: 'monospace',
              }}>
                <span style={{ color: '#666', fontSize: '18px' }}>/</span>
                <input
                  value={generatedPattern}
                  onChange={(e) => setGeneratedPattern(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#f72585',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'monospace',
                  }}
                  placeholder="正则表达式"
                />
                <span style={{ color: '#666', fontSize: '18px' }}>/</span>
                <input
                  value={generatedFlags}
                  onChange={(e) => setGeneratedFlags(e.target.value)}
                  style={{
                    width: '60px',
                    background: 'transparent',
                    border: 'none',
                    color: '#7209b7',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'monospace',
                  }}
                  placeholder="flags"
                />
              </div>
              {aiExplanation && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px 12px',
                  background: 'rgba(114,9,183,0.15)',
                  borderRadius: '6px',
                  border: '1px solid rgba(114,9,183,0.3)',
                  fontSize: '12px',
                  color: '#c77dff',
                  lineHeight: '1.6',
                }}>
                  💡 {aiExplanation}
                </div>
              )}
            </div>
          </div>

          {/* 测试区域 */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '10px', fontWeight: 500 }}>
              实时测试
            </div>
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="输入测试文本..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: '#e0e0e0',
                fontSize: '13px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            {matches.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '12px', color: '#27c93f', marginBottom: '6px' }}>
                  找到 {matches.length} 个匹配：
                </div>
                <div style={{ maxHeight: '100px', overflow: 'auto' }}>
                  {matches.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '6px 10px',
                        marginBottom: '4px',
                        borderRadius: '4px',
                        background: 'rgba(39,201,63,0.1)',
                        border: '1px solid rgba(39,201,63,0.3)',
                        fontSize: '12px',
                        display: 'flex',
                        gap: '10px',
                      }}
                    >
                      <code style={{ color: '#27c93f' }}>{m.match}</code>
                      <span style={{ color: '#666' }}>@index {m.index}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {testString && matches.length === 0 && regexValid && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
                未找到匹配
              </div>
            )}
          </div>

          {/* 快速参考 */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '11px',
            color: '#666',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
          }}>
            <span><code style={{ color: '#aaa' }}>.</code> 匹配任意字符</span>
            <span><code style={{ color: '#aaa' }}>\d</code> 数字 [0-9]</span>
            <span><code style={{ color: '#aaa' }}>\w</code> 单词字符</span>
            <span><code style={{ color: '#aaa' }}>\s</code> 空白字符</span>
            <span><code style={{ color: '#aaa' }}>^</code> 开头</span>
            <span><code style={{ color: '#aaa' }}>$</code> 结尾</span>
            <span><code style={{ color: '#aaa' }}>*</code> 0+次</span>
            <span><code style={{ color: '#aaa' }}>+</code> 1+次</span>
            <span><code style={{ color: '#aaa' }}>?</code> 0-1次</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
