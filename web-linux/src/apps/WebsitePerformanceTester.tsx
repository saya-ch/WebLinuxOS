import { useState, useEffect, useCallback } from 'react';
import { Zap, Play, RotateCcw, Trash2, Clock, Gauge, Layers, Download, AlertCircle, CheckCircle, XCircle, ChevronRight, BarChart3 } from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  description: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold: { good: number; poor: number };
}

interface TestResult {
  id: string;
  url: string;
  timestamp: number;
  metrics: PerformanceMetric[];
  lighthouseScore?: number;
  resources: ResourceInfo[];
  recommendations: string[];
}

interface ResourceInfo {
  name: string;
  type: string;
  size: number;
  loadTime: number;
}

const METRIC_DEFINITIONS = [
  {
    name: '首字节时间 (TTFB)',
    key: 'ttfb',
    description: '服务器响应的第一个字节到达时间',
    unit: 'ms',
    threshold: { good: 800, poor: 1800 },
    getValue: () => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      return nav ? Math.round(nav.responseStart - nav.requestStart) : 0;
    },
  },
  {
    name: 'DOM 解析时间',
    key: 'domParse',
    description: '从页面加载到 DOM 解析完成的时间',
    unit: 'ms',
    threshold: { good: 1500, poor: 3500 },
    getValue: () => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      return nav ? Math.round(nav.domInteractive - nav.startTime) : 0;
    },
  },
  {
    name: '页面完全加载时间',
    key: 'loadTime',
    description: '页面所有资源加载完成的时间',
    unit: 'ms',
    threshold: { good: 2500, poor: 6000 },
    getValue: () => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      return nav ? Math.round(nav.loadEventEnd - nav.startTime) : 0;
    },
  },
  {
    name: '资源数量',
    key: 'resourceCount',
    description: '页面加载的资源总数',
    unit: '个',
    threshold: { good: 60, poor: 150 },
    getValue: () => performance.getEntriesByType('resource').length,
  },
  {
    name: '页面大小',
    key: 'pageSize',
    description: '所有资源的总大小',
    unit: 'KB',
    threshold: { good: 1500, poor: 5000 },
    getValue: () => {
      const resources = performance.getEntriesByType('resource');
      return Math.round(resources.reduce((sum, r) => sum + (r as PerformanceResourceTiming).transferSize, 0) / 1024);
    },
  },
  {
    name: '重定向次数',
    key: 'redirects',
    description: '页面加载过程中的 HTTP 重定向次数',
    unit: '次',
    threshold: { good: 0, poor: 3 },
    getValue: () => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      return nav ? nav.redirectCount : 0;
    },
  },
  {
    name: 'DNS 查询时间',
    key: 'dnsTime',
    description: 'DNS 查询耗时',
    unit: 'ms',
    threshold: { good: 200, poor: 500 },
    getValue: () => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      return nav ? Math.round(nav.domainLookupEnd - nav.domainLookupStart) : 0;
    },
  },
  {
    name: 'TCP 连接时间',
    key: 'tcpTime',
    description: 'TCP 握手耗时',
    unit: 'ms',
    threshold: { good: 200, poor: 500 },
    getValue: () => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      return nav ? Math.round(nav.connectEnd - nav.connectStart) : 0;
    },
  },
];

function WebsitePerformanceTester() {
  const [url, setUrl] = useState('https://saya-ch.github.io/WebLinuxOS/');
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [testStep, setTestStep] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('performance-test-results');
    if (saved) {
      try {
        setResults(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const saveResults = (newResults: TestResult[]) => {
    setResults(newResults);
    localStorage.setItem('performance-test-results', JSON.stringify(newResults));
  };

  const runTest = useCallback(async () => {
    if (testing || !url) return;

    setTesting(true);
    setProgress(0);
    setCurrentResult(null);

    const steps = [
      '初始化测试环境...',
      '加载页面...',
      '采集性能指标...',
      '分析资源加载...',
      '生成报告...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setTestStep(steps[i]);
      setProgress(((i + 1) / steps.length) * 100);
      await new Promise(r => setTimeout(r, 500));
    }

    // 采集性能数据
    const metrics: PerformanceMetric[] = METRIC_DEFINITIONS.map(def => {
      const value = def.getValue();
      let rating: 'good' | 'needs-improvement' | 'poor' = 'good';
      if (value > def.threshold.poor) rating = 'poor';
      else if (value > def.threshold.good) rating = 'needs-improvement';
      return {
        name: def.name,
        value,
        unit: def.unit,
        description: def.description,
        rating,
        threshold: def.threshold,
      };
    });

    // 采集资源信息
    const resources = performance.getEntriesByType('resource').map(r => ({
      name: r.name.split('/').pop() || r.name,
      type: (r as PerformanceResourceTiming).initiatorType || 'other',
      size: Math.round((r as PerformanceResourceTiming).transferSize / 1024),
      loadTime: Math.round(r.duration),
    }));

    // 生成建议
    const recommendations: string[] = [];
    const pageSize = metrics.find(m => m.name === '页面大小')?.value || 0;
    const resourceCount = metrics.find(m => m.name === '资源数量')?.value || 0;
    const loadTime = metrics.find(m => m.name === '页面完全加载时间')?.value || 0;
    const ttfb = metrics.find(m => m.name === '首字节时间 (TTFB)')?.value || 0;

    if (pageSize > 5000) {
      recommendations.push('页面资源过大，建议压缩图片和使用 CDN');
    }
    if (resourceCount > 150) {
      recommendations.push('资源数量过多，考虑代码分割和懒加载');
    }
    if (loadTime > 6000) {
      recommendations.push('加载时间过长，优化关键渲染路径');
    }
    if (ttfb > 1800) {
      recommendations.push('首字节时间过长，考虑服务端优化和缓存策略');
    }

    const goodCount = metrics.filter(m => m.rating === 'good').length;
    const lighthouseScore = Math.round((goodCount / metrics.length) * 100);

    const result: TestResult = {
      id: `test-${Date.now()}`,
      url,
      timestamp: Date.now(),
      metrics,
      lighthouseScore,
      resources: resources.sort((a, b) => b.size - a.size).slice(0, 20),
      recommendations,
    };

    const newResults = [result, ...results].slice(0, 20);
    saveResults(newResults);
    setCurrentResult(result);
    setTesting(false);
    setTestStep('');
  }, [testing, url, results]);

  const exportReport = (result: TestResult) => {
    const report = {
      url: result.url,
      timestamp: new Date(result.timestamp).toISOString(),
      lighthouseScore: result.lighthouseScore,
      metrics: result.metrics,
      recommendations: result.recommendations,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
  };

  const clearHistory = () => {
    if (confirm('确定清空所有测试历史？')) {
      saveResults([]);
      setCurrentResult(null);
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return '#22c55e';
      case 'needs-improvement': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const getRatingBg = (rating: string) => {
    switch (rating) {
      case 'good': return 'rgba(34, 197, 94, 0.15)';
      case 'needs-improvement': return 'rgba(245, 158, 11, 0.15)';
      case 'poor': return 'rgba(239, 68, 68, 0.15)';
      default: return 'rgba(148, 163, 184, 0.15)';
    }
  };

  const getRatingLabel = (rating: string) => {
    switch (rating) {
      case 'good': return '良好';
      case 'needs-improvement': return '需改进';
      case 'poor': return '较差';
      default: return '未知';
    }
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleString('zh-CN');

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
      color: '#fff',
      fontFamily: "'Inter', 'PingFang SC', sans-serif",
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Gauge size={20} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>网站性能测试</div>
            <div style={{ fontSize: 12, opacity: 0.5 }}>Website Performance Analyzer · v1.0</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={clearHistory} style={buttonStyle('ghost')}>
            <Trash2 size={14} /> 清空历史
          </button>
        </div>
      </div>

      {/* Test Section */}
      <div style={{
        padding: 24,
        background: 'rgba(6, 182, 212, 0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入网站 URL..."
            disabled={testing}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              color: '#fff',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            onClick={runTest}
            disabled={testing}
            style={{
              ...buttonStyle('primary'),
              padding: '12px 24px',
              minWidth: 140,
            }}
          >
            {testing ? (
              <>
                <RotateCcw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                测试中...
              </>
            ) : (
              <>
                <Play size={16} />
                开始测试
              </>
            )}
          </button>
        </div>

        {testing && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, opacity: 0.7 }}>{testStep}</span>
              <span style={{ fontSize: 13 }}>{Math.round(progress)}%</span>
            </div>
            <div style={{
              height: 4,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.5 }}>
          注意：为获得准确数据，请在要测试的网站上打开此工具。当前页面的性能指标将被采集分析。
        </div>
      </div>

      {/* Results Section */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {currentResult ? (
          <>
            {/* Overall Score */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              padding: 24,
              background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(59,130,246,0.1) 100%)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)',
              marginBottom: 24,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 100, height: 100, borderRadius: '50%',
                  background: `conic-gradient(${getRatingColor(
                    (currentResult.lighthouseScore ?? 0) >= 80 ? 'good' :
                    (currentResult.lighthouseScore ?? 0) >= 50 ? 'needs-improvement' : 'poor'
                  )} ${(currentResult.lighthouseScore ?? 0) * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: '#1a1a2e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column',
                  }}>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>{currentResult.lighthouseScore ?? 0}</div>
                    <div style={{ fontSize: 10, opacity: 0.6 }}>评分</div>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>性能评分</div>
                <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
                  {currentResult.url}
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={14} color="#22c55e" />
                    良好: {currentResult.metrics.filter(m => m.rating === 'good').length}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={14} color="#f59e0b" />
                    需改进: {currentResult.metrics.filter(m => m.rating === 'needs-improvement').length}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <XCircle size={14} color="#ef4444" />
                    较差: {currentResult.metrics.filter(m => m.rating === 'poor').length}
                  </div>
                </div>
              </div>
              <button onClick={() => exportReport(currentResult)} style={buttonStyle('primary')}>
                <Download size={16} /> 导出报告
              </button>
            </div>

            {/* Metrics Grid */}
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={16} /> 性能指标
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
              marginBottom: 24,
            }}>
              {currentResult.metrics.map(metric => (
                <div key={metric.name} style={{
                  padding: 16,
                  background: getRatingBg(metric.rating),
                  border: `1px solid ${getRatingColor(metric.rating)}30`,
                  borderRadius: 12,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{metric.name}</span>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      background: getRatingColor(metric.rating),
                      borderRadius: 10,
                      color: '#fff',
                    }}>
                      {getRatingLabel(metric.rating)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: getRatingColor(metric.rating) }}>
                      {metric.value}
                    </span>
                    <span style={{ fontSize: 12, opacity: 0.6 }}>{metric.unit}</span>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{metric.description}</div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {currentResult.recommendations.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} color="#f59e0b" /> 优化建议
                </div>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 12,
                  padding: 16,
                }}>
                  {currentResult.recommendations.map((rec, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: '8px 0',
                      borderBottom: i < currentResult.recommendations.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}>
                      <ChevronRight size={16} color="#f59e0b" style={{ marginTop: 2 }} />
                      <span style={{ fontSize: 13 }}>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Resources */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={16} /> 主要资源 ({currentResult.resources.length})
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  fontSize: 12,
                  fontWeight: 600,
                  opacity: 0.7,
                }}>
                  <span>资源名称</span>
                  <span>类型</span>
                  <span>大小</span>
                  <span>加载时间</span>
                </div>
                {currentResult.resources.slice(0, 10).map((r, i) => (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    padding: '10px 16px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    fontSize: 12,
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                    <span style={{ opacity: 0.7 }}>{r.type}</span>
                    <span>{r.size} KB</span>
                    <span>{r.loadTime}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            opacity: 0.5,
          }}>
            <Zap size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
              还没有测试结果
            </div>
            <div style={{ fontSize: 13 }}>
              点击上方「开始测试」按钮分析当前页面性能
            </div>
          </div>
        )}

        {/* History */}
        {results.length > 0 && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} /> 测试历史
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {results.slice(0, 10).map(result => (
                <button
                  key={result.id}
                  onClick={() => setCurrentResult(result)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: currentResult?.id === result.id ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 8,
                      background: getRatingBg(
                        (result.lighthouseScore ?? 0) >= 80 ? 'good' :
                        (result.lighthouseScore ?? 0) >= 50 ? 'needs-improvement' : 'poor'
                      ),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 600,
                    }}>
                      {result.lighthouseScore ?? 0}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 500 }}>{result.url}</div>
                      <div style={{ fontSize: 11, opacity: 0.5 }}>{formatTime(result.timestamp)}</div>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ opacity: 0.5 }} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const buttonStyle = (variant: 'primary' | 'ghost'): React.CSSProperties => {
  const base: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s',
  };
  switch (variant) {
    case 'primary':
      return {
        ...base,
        background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        color: '#fff',
      };
    case 'ghost':
      return {
        ...base,
        background: 'transparent',
        color: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(255,255,255,0.1)',
      };
  }
};

export default WebsitePerformanceTester;
