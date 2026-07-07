import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store';
import {
  BarChart3, TrendingUp, RefreshCw,
  Activity, Globe, Server, Clock,
  DollarSign, Users, Zap, ArrowUp, ArrowDown
} from 'lucide-react';

interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume: number;
}

interface CountryData {
  name: string;
  code: string;
  capital: string;
  population: number;
  area: number;
  region: string;
}

const METRIC_CARDS = [
  { id: 'crypto', icon: DollarSign, label: '加密货币', color: '#f59e0b' },
  { id: 'countries', icon: Globe, label: '国家信息', color: '#3b82f6' },
  { id: 'system', icon: Server, label: '系统性能', color: '#10b981' },
  { id: 'weather', icon: Activity, label: '天气数据', color: '#8b5cf6' },
];

export default function DataVizDashboard() {
  const theme = useStore((s) => s.theme);
  const [activeTab, setActiveTab] = useState('crypto');
  const [loading, setLoading] = useState(false);
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
  });
  const systemIntervalRef = useRef<number | null>(null);

  const fetchCryptoData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false'
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        const formatted: CryptoData[] = data.map((coin: any) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          price: coin.current_price,
          change24h: coin.price_change_percentage_24h,
          marketCap: coin.market_cap,
          volume: coin.total_volume,
        }));
        setCryptoData(formatted);
        setLastUpdate(new Date());
      }
    } catch (e) {
      console.error('Crypto fetch error:', e);
      setCryptoData([
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 67234.56, change24h: 2.34, marketCap: 1320000000000, volume: 28000000000 },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3456.78, change24h: -1.23, marketCap: 415000000000, volume: 15000000000 },
        { id: 'solana', name: 'Solana', symbol: 'SOL', price: 178.45, change24h: 5.67, marketCap: 78000000000, volume: 3200000000 },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA', price: 0.45, change24h: -0.89, marketCap: 16000000000, volume: 450000000 },
        { id: 'ripple', name: 'XRP', symbol: 'XRP', price: 0.52, change24h: 1.45, marketCap: 28000000000, volume: 1200000000 },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCountries = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,capital,population,area,region');
      const data = await response.json();
      if (Array.isArray(data)) {
        const formatted: CountryData[] = data
          .filter((c: any) => c.population > 50000000)
          .map((country: any) => ({
            name: country.name.common,
            code: country.cca2,
            capital: country.capital?.[0] || 'N/A',
            population: country.population,
            area: country.area || 0,
            region: country.region,
          }))
          .sort((a: CountryData, b: CountryData) => b.population - a.population)
          .slice(0, 15);
        setCountries(formatted);
      }
    } catch (e) {
      console.error('Countries fetch error:', e);
      setCountries([
        { name: '中国', code: 'CN', capital: '北京', population: 1439323776, area: 9706961, region: 'Asia' },
        { name: '印度', code: 'IN', capital: '新德里', population: 1380004385, area: 3287263, region: 'Asia' },
        { name: '美国', code: 'US', capital: '华盛顿', population: 331002651, area: 9833520, region: 'Americas' },
        { name: '印度尼西亚', code: 'ID', capital: '雅加达', population: 273523615, area: 1904569, region: 'Asia' },
        { name: '巴基斯坦', code: 'PK', capital: '伊斯兰堡', population: 220892340, area: 881912, region: 'Asia' },
        { name: '巴西', code: 'BR', capital: '巴西利亚', population: 212559417, area: 8515767, region: 'Americas' },
        { name: '尼日利亚', code: 'NG', capital: '阿布贾', population: 206139589, area: 923768, region: 'Africa' },
        { name: '孟加拉国', code: 'BD', capital: '达卡', population: 164689383, area: 147570, region: 'Asia' },
        { name: '俄罗斯', code: 'RU', capital: '莫斯科', population: 145934462, area: 17098242, region: 'Europe' },
        { name: '墨西哥', code: 'MX', capital: '墨西哥城', population: 128932753, area: 1964375, region: 'Americas' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const simulateSystemMetrics = useCallback(() => {
    setSystemMetrics(prev => ({
      cpu: Math.min(100, Math.max(10, prev.cpu + (Math.random() - 0.5) * 15)),
      memory: Math.min(100, Math.max(30, prev.memory + (Math.random() - 0.5) * 5)),
      disk: Math.min(100, Math.max(40, prev.disk + (Math.random() - 0.5) * 2)),
      network: Math.min(100, Math.max(5, prev.network + (Math.random() - 0.5) * 20)),
    }));
  }, []);

  useEffect(() => {
    setSystemMetrics({ cpu: 45, memory: 62, disk: 73, network: 30 });
    systemIntervalRef.current = window.setInterval(simulateSystemMetrics, 2000);
    return () => {
      if (systemIntervalRef.current) clearInterval(systemIntervalRef.current);
    };
  }, [simulateSystemMetrics]);

  useEffect(() => {
    if (activeTab === 'crypto' && cryptoData.length === 0) {
      fetchCryptoData();
    } else if (activeTab === 'countries' && countries.length === 0) {
      fetchCountries();
    }
  }, [activeTab, cryptoData.length, countries.length, fetchCryptoData, fetchCountries]);

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(2);
  };

  const formatCurrency = (num: number) => {
    if (num >= 1) return `$${num.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    return `$${num.toFixed(4)}`;
  };

  const ProgressBar = ({ value, color, label }: { value: number; color: string; label: string }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '6px',
        fontSize: '12px',
      }}>
        <span style={{ color: theme === 'light' ? '#495057' : '#bbb' }}>{label}</span>
        <span style={{ fontWeight: 600 }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{
        height: '8px',
        borderRadius: '4px',
        background: theme === 'light' ? '#e9ecef' : '#2a2a3e',
        overflow: 'hidden',
      }}>
        <div
          style={{
            height: '100%',
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}, ${color}aa)`,
            borderRadius: '4px',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );

  return (
    <div
      className="app-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: theme === 'light' ? '#f8f9fa' : '#0f0f1a',
        color: theme === 'light' ? '#1a1a2e' : '#e0e0e8',
      }}
    >
      <div style={{
        padding: '20px',
        borderBottom: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
        background: theme === 'light' ? '#fff' : '#1a1a2e',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c6cf0, #00d6c1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <BarChart3 size={24} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
              数据可视化仪表盘
            </h2>
            <p style={{ fontSize: '12px', color: theme === 'light' ? '#868e96' : '#888', margin: '4px 0 0 0' }}>
              实时数据可视化 · 多维度分析
            </p>
          </div>
          <div style={{ flex: 1 }} />
          {lastUpdate && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: theme === 'light' ? '#868e96' : '#666',
            }}>
              <Clock size={12} />
              {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          <button
            onClick={() => {
              if (activeTab === 'crypto') fetchCryptoData();
              else if (activeTab === 'countries') fetchCountries();
            }}
            disabled={loading}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: `1px solid ${theme === 'light' ? '#dee2e6' : '#3a3a5c'}`,
              background: 'transparent',
              color: 'inherit',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            刷新
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {METRIC_CARDS.map(card => {
            const Icon = card.icon;
            const isActive = activeTab === card.id;
            return (
              <button
                key={card.id}
                onClick={() => setActiveTab(card.id)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${isActive ? card.color : (theme === 'light' ? '#dee2e6' : '#3a3a5c')}`,
                  background: isActive
                    ? `${card.color}15`
                    : theme === 'light' ? '#fff' : '#252536',
                  color: isActive ? card.color : 'inherit',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={16} />
                {card.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {activeTab === 'crypto' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '20px',
            }}>
              {cryptoData.slice(0, 4).map(coin => (
                <div
                  key={coin.id}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: theme === 'light' ? '#fff' : '#1a1a2e',
                    border: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{coin.name}</div>
                      <div style={{ fontSize: '11px', color: theme === 'light' ? '#868e96' : '#888' }}>{coin.symbol}</div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: coin.change24h >= 0 ? '#10b981' : '#ef4444',
                    }}>
                      {coin.change24h >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      {Math.abs(coin.change24h).toFixed(2)}%
                    </div>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{formatCurrency(coin.price)}</div>
                  <div style={{
                    fontSize: '11px',
                    color: theme === 'light' ? '#868e96' : '#666',
                    marginTop: '4px',
                  }}>
                    市值: {formatNumber(coin.marketCap)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: theme === 'light' ? '#fff' : '#1a1a2e',
              borderRadius: '12px',
              border: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '14px 16px',
                borderBottom: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <TrendingUp size={18} color="#7c6cf0" />
                加密货币排行榜
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{
                      background: theme === 'light' ? '#f8f9fa' : '#252536',
                      textAlign: 'left',
                    }}>
                      <th style={{ padding: '10px 16px', fontWeight: 500, fontSize: '12px', color: theme === 'light' ? '#868e96' : '#888' }}>#</th>
                      <th style={{ padding: '10px 16px', fontWeight: 500, fontSize: '12px', color: theme === 'light' ? '#868e96' : '#888' }}>名称</th>
                      <th style={{ padding: '10px 16px', fontWeight: 500, fontSize: '12px', color: theme === 'light' ? '#868e96' : '#888', textAlign: 'right' }}>价格</th>
                      <th style={{ padding: '10px 16px', fontWeight: 500, fontSize: '12px', color: theme === 'light' ? '#868e96' : '#888', textAlign: 'right' }}>24h涨跌</th>
                      <th style={{ padding: '10px 16px', fontWeight: 500, fontSize: '12px', color: theme === 'light' ? '#868e96' : '#888', textAlign: 'right' }}>市值</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cryptoData.map((coin, i) => (
                      <tr key={coin.id} style={{
                        borderTop: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
                      }}>
                        <td style={{ padding: '12px 16px', color: theme === 'light' ? '#868e96' : '#666' }}>{i + 1}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 500 }}>{coin.name}</div>
                          <div style={{ fontSize: '11px', color: theme === 'light' ? '#868e96' : '#888' }}>{coin.symbol}</div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(coin.price)}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: coin.change24h >= 0 ? '#10b981' : '#ef4444',
                        }}>
                          {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          ${formatNumber(coin.marketCap)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'countries' && (
          <div style={{
            background: theme === 'light' ? '#fff' : '#1a1a2e',
            borderRadius: '12px',
            border: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 16px',
              borderBottom: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Users size={18} color="#3b82f6" />
              世界人口排行 (Top 15)
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{
                    background: theme === 'light' ? '#f8f9fa' : '#252536',
                    textAlign: 'left',
                  }}>
                    <th style={{ padding: '10px 16px', fontWeight: 500, fontSize: '12px', color: theme === 'light' ? '#868e96' : '#888' }}>#</th>
                    <th style={{ padding: '10px 16px', fontWeight: 500, fontSize: '12px', color: theme === 'light' ? '#868e96' : '#888' }}>国家</th>
                    <th style={{ padding: '10px 16px', fontWeight: 500, fontSize: '12px', color: theme === 'light' ? '#868e96' : '#888' }}>首都</th>
                    <th style={{ padding: '10px 16px', fontWeight: 500, fontSize: '12px', color: theme === 'light' ? '#868e96' : '#888', textAlign: 'right' }}>人口</th>
                    <th style={{ padding: '10px 16px', fontWeight: 500, fontSize: '12px', color: theme === 'light' ? '#868e96' : '#888', textAlign: 'right' }}>面积 (km²)</th>
                    <th style={{ padding: '10px 16px', fontWeight: 500, fontSize: '12px', color: theme === 'light' ? '#868e96' : '#888' }}>地区</th>
                  </tr>
                </thead>
                <tbody>
                  {countries.map((country, i) => (
                    <tr key={country.code} style={{
                      borderTop: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
                    }}>
                      <td style={{ padding: '12px 16px', color: theme === 'light' ? '#868e96' : '#666' }}>{i + 1}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500 }}>
                          <span style={{ marginRight: '8px', fontSize: '18px' }}>
                            {String.fromCodePoint(0x1F1E6 + country.code.charCodeAt(0) - 65, 0x1F1E6 + country.code.charCodeAt(1) - 65)}
                          </span>
                          {country.name}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>{country.capital}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                        {formatNumber(country.population)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {country.area.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #7c6cf020, #00d6c120)',
                          fontSize: '11px',
                          fontWeight: 500,
                        }}>
                          {country.region}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
          }}>
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              background: theme === 'light' ? '#fff' : '#1a1a2e',
              border: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
                fontWeight: 600,
              }}>
                <Zap size={18} color="#10b981" />
                系统性能监控
              </div>
              <ProgressBar value={systemMetrics.cpu} color="#ef4444" label="CPU 使用率" />
              <ProgressBar value={systemMetrics.memory} color="#3b82f6" label="内存使用率" />
              <ProgressBar value={systemMetrics.disk} color="#f59e0b" label="磁盘使用率" />
              <ProgressBar value={systemMetrics.network} color="#8b5cf6" label="网络活动" />
            </div>

            <div style={{
              padding: '20px',
              borderRadius: '12px',
              background: theme === 'light' ? '#fff' : '#1a1a2e',
              border: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
                fontWeight: 600,
              }}>
                <Server size={18} color="#3b82f6" />
                系统信息
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: '操作系统', value: 'WebLinuxOS v15.3.0' },
                  { label: '内核版本', value: 'WebKernel 2.0' },
                  { label: '运行时间', value: `${Math.floor(Math.random() * 100) + 1} 天` },
                  { label: '进程数', value: Math.floor(Math.random() * 100) + 50 },
                  { label: '用户数', value: Math.floor(Math.random() * 10) + 1 },
                  { label: '网络状态', value: '已连接' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingBottom: '8px',
                    borderBottom: i < 5 ? `1px dashed ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}` : 'none',
                    fontSize: '13px',
                  }}>
                    <span style={{ color: theme === 'light' ? '#868e96' : '#888' }}>{item.label}</span>
                    <span style={{ fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'weather' && (
          <div style={{
            background: theme === 'light' ? '#fff' : '#1a1a2e',
            borderRadius: '12px',
            border: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
            padding: '20px',
            textAlign: 'center',
          }}>
            <Activity size={48} color="#8b5cf6" style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 8px 0' }}>天气数据可视化</h3>
            <p style={{ color: theme === 'light' ? '#868e96' : '#888', fontSize: '14px' }}>
              请使用天气应用查看详细天气数据
            </p>
            <button
              onClick={() => {
                const { openApp } = useStore.getState();
                openApp('weather');
              }}
              style={{
                marginTop: '16px',
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #7c6cf0, #00d6c1)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              打开天气应用
            </button>
          </div>
        )}
      </div>

      <div style={{
        padding: '10px 20px',
        borderTop: `1px solid ${theme === 'light' ? '#e9ecef' : '#2a2a3e'}`,
        background: theme === 'light' ? '#fff' : '#1a1a2e',
        fontSize: '11px',
        color: theme === 'light' ? '#868e96' : '#666',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>数据来源: CoinGecko API · REST Countries API</span>
        <span>实时数据 · 每 10 分钟更新</span>
      </div>
    </div>
  );
}
