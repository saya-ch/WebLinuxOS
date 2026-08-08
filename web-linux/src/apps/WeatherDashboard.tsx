import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Eye, Thermometer, MapPin, Search, RefreshCw, Share2, Star, Trash2 } from 'lucide-react';

interface WeatherData {
  city: string;
  region: string;
  country: string;
  temperature: number;
  feelsLike: number;
  description: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  visibility: number;
  uvIndex: number;
  icon: string;
}

interface ForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  description: string;
  icon: string;
  precipitation: number;
}

interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  savedAt: number;
}

const WEATHER_API_BASE = 'https://api.open-meteo.com/v1';
const GEOCODING_API_BASE = 'https://geocoding-api.open-meteo.com/v1';

const WEATHER_ICONS: Record<string, (size?: number) => React.ReactNode> = {
  '0': (size) => <Sun size={size || 48} color="#fbbf24" />,
  '1': (size) => <Sun size={size || 48} color="#fbbf24" />,
  '2': (size) => <Cloud size={size || 48} color="#60a5fa" />,
  '3': (size) => <Cloud size={size || 48} color="#94a3b8" />,
  '45': (size) => <Cloud size={size || 48} color="#cbd5e1" />,
  '48': (size) => <Cloud size={size || 48} color="#cbd5e1" />,
  '51': (size) => <CloudRain size={size || 48} color="#60a5fa" />,
  '53': (size) => <CloudRain size={size || 48} color="#3b82f6" />,
  '55': (size) => <CloudRain size={size || 48} color="#2563eb" />,
  '61': (size) => <CloudRain size={size || 48} color="#60a5fa" />,
  '63': (size) => <CloudRain size={size || 48} color="#3b82f6" />,
  '65': (size) => <CloudRain size={size || 48} color="#2563eb" />,
  '71': (size) => <CloudSnow size={size || 48} color="#e0e7ff" />,
  '73': (size) => <CloudSnow size={size || 48} color="#c7d2fe" />,
  '75': (size) => <CloudSnow size={size || 48} color="#a5b4fc" />,
  '80': (size) => <CloudRain size={size || 48} color="#93c5fd" />,
  '81': (size) => <CloudRain size={size || 48} color="#60a5fa" />,
  '82': (size) => <CloudRain size={size || 48} color="#3b82f6" />,
  '95': (size) => <CloudLightning size={size || 48} color="#fbbf24" />,
  '96': (size) => <CloudLightning size={size || 48} color="#f59e0b" />,
  '99': (size) => <CloudLightning size={size || 48} color="#ef4444" />,
};

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: '晴', 1: '晴', 2: '多云', 3: '阴',
  45: '雾', 48: '雾凇',
  51: '小雨', 53: '中雨', 55: '大雨',
  61: '小雨', 63: '中雨', 65: '大雨',
  71: '小雪', 73: '中雪', 75: '大雪',
  80: '阵雨', 81: '强阵雨', 82: '暴雨',
  95: '雷暴', 96: '雷暴伴冰雹', 99: '雷暴伴大雨',
};

const POPULAR_CITIES = [
  { name: '北京', lat: 39.9042, lon: 116.4074 },
  { name: '上海', lat: 31.2304, lon: 121.4737 },
  { name: '广州', lat: 23.1291, lon: 113.2644 },
  { name: '深圳', lat: 22.5431, lon: 114.0579 },
  { name: '成都', lat: 30.5728, lon: 104.0668 },
  { name: '杭州', lat: 30.2741, lon: 120.1551 },
  { name: '东京', lat: 35.6762, lon: 139.6503 },
  { name: '纽约', lat: 40.7128, lon: -74.0060 },
  { name: '伦敦', lat: 51.5074, lon: -0.1278 },
  { name: '巴黎', lat: 48.8566, lon: 2.3522 },
];

function WeatherDashboard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ name: string; lat: number; lon: number; country: string }[]>([]);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('weather-saved-locations');
    if (saved) {
      try {
        setSavedLocations(JSON.parse(saved));
      } catch {}
    }
    
    const last = localStorage.getItem('weather-last-location');
    if (last) {
      try {
        const loc = JSON.parse(last);
        setSelectedLocation(loc);
        fetchWeather(loc.lat, loc.lon, loc.name);
      } catch {}
    } else {
      fetchWeather(39.9042, 116.4074, '北京');
    }
  }, []);

  const saveLocations = (locations: SavedLocation[]) => {
    setSavedLocations(locations);
    localStorage.setItem('weather-saved-locations', JSON.stringify(locations));
  };

  const saveLastLocation = (loc: { lat: number; lon: number; name: string }) => {
    localStorage.setItem('weather-last-location', JSON.stringify(loc));
  };

  const fetchWeather = useCallback(async (lat: number, lon: number, name: string) => {
    setLoading(true);
    setError(null);

    try {
      const url = `${WEATHER_API_BASE}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,feels_like,visibility,uv_index&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=auto&forecast_days=7`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('获取天气数据失败');
      const data = await response.json();

      const weatherCode = data.current.weather_code;
      const w: WeatherData = {
        city: name,
        region: data.timezone.split('/').pop() || '',
        country: '',
        temperature: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.feels_like),
        description: WEATHER_DESCRIPTIONS[weatherCode] || '未知',
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        windDirection: getWindDirection(data.current.wind_direction_10m),
        visibility: Math.round(data.current.visibility / 1000),
        uvIndex: Math.round(data.current.uv_index),
        icon: String(weatherCode),
      };

      const f: ForecastDay[] = data.daily.time.map((date: string, i: number) => ({
        date: new Date(date).toLocaleDateString('zh-CN', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        maxTemp: Math.round(data.daily.temperature_2m_max[i]),
        minTemp: Math.round(data.daily.temperature_2m_min[i]),
        description: WEATHER_DESCRIPTIONS[data.daily.weather_code[i]] || '未知',
        icon: String(data.daily.weather_code[i]),
        precipitation: Math.round(data.daily.precipitation_sum[i]),
      }));

      setWeather(w);
      setForecast(f);
      setSelectedLocation({ lat, lon, name });
      saveLastLocation({ lat, lon, name });
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchCity = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const url = `${GEOCODING_API_BASE}/search?query=${encodeURIComponent(searchQuery)}&limit=10&language=zh`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('搜索失败');
      const data = await response.json();
      
      setSearchResults(
        (data.results || []).map((r: { name: string; latitude: number; longitude: number; country: string }) => ({
          name: r.name,
          lat: r.latitude,
          lon: r.longitude,
          country: r.country,
        }))
      );
    } catch {
      setSearchResults([]);
    }
  };

  const addToSaved = () => {
    if (!selectedLocation) return;
    if (savedLocations.some(l => l.name === selectedLocation.name)) return;
    
    const newSaved = [...savedLocations, {
      id: `saved-${Date.now()}`,
      name: selectedLocation.name,
      lat: selectedLocation.lat,
      lon: selectedLocation.lon,
      savedAt: Date.now(),
    }];
    saveLocations(newSaved);
  };

  const removeFromSaved = (id: string) => {
    saveLocations(savedLocations.filter(l => l.id !== id));
  };

  const isSaved = selectedLocation ? savedLocations.some(l => l.name === selectedLocation.name) : false;

  const shareWeather = () => {
    if (!weather) return;
    const text = `【${weather.city}天气】${weather.description}，温度 ${weather.temperature}°C，体感 ${weather.feelsLike}°C，湿度 ${weather.humidity}%，风速 ${weather.windSpeed} km/h`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('天气信息已复制到剪贴板');
      });
    }
  };

  function getWindDirection(degrees: number): string {
    const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
    return directions[Math.round((degrees % 360) / 45) % 8];
  }

  const getUVLevel = (uv: number) => {
    if (uv <= 2) return { label: '低', color: '#22c55e' };
    if (uv <= 5) return { label: '中', color: '#f59e0b' };
    if (uv <= 7) return { label: '高', color: '#f97316' };
    if (uv <= 10) return { label: '很高', color: '#ef4444' };
    return { label: '极高', color: '#991b1b' };
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: weather && weather.temperature > 25 ? 
        'linear-gradient(135deg, #ff9a56 0%, #ff6b6b 50%, #ee5a6f 100%)' :
        weather && weather.temperature < 10 ?
        'linear-gradient(135deg, #4b6cb7 0%, #182848 100%)' :
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      fontFamily: "'Inter', 'PingFang SC', sans-serif",
      overflow: 'hidden',
      transition: 'background 0.5s ease',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        background: 'rgba(0,0,0,0.15)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Cloud size={22} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>天气仪表板</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>Weather Dashboard · Powered by Open-Meteo</div>
          </div>
        </div>
        <button onClick={() => selectedLocation && fetchWeather(selectedLocation.lat, selectedLocation.lon, selectedLocation.name)} style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: 10,
          padding: '8px 12px',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <RefreshCw size={14} /> 刷新
        </button>
      </div>

      {/* Search Bar */}
      <div style={{
        padding: '16px 24px',
        background: 'rgba(0,0,0,0.1)',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ flex: 1, display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 12,
            padding: '0 12px',
          }}>
            <Search size={18} style={{ opacity: 0.7 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchCity()}
              placeholder="搜索城市..."
              style={{
                flex: 1,
                padding: '10px 0',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>
          <button onClick={searchCity} style={{
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.3)',
            border: 'none',
            borderRadius: 12,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
          }}>
            搜索
          </button>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {searchResults.length > 0 && (
        <div style={{
          margin: '0 24px 16px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          {searchResults.map((result, i) => (
            <button
              key={i}
              onClick={() => {
                fetchWeather(result.lat, result.lon, result.name);
                setSearchResults([]);
                setSearchQuery('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                borderBottom: i < searchResults.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
              }}
            >
              <MapPin size={14} />
              <span style={{ fontSize: 13 }}>{result.name}</span>
              <span style={{ fontSize: 12, opacity: 0.6 }}>{result.country}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
        {loading && !weather ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', opacity: 0.7 }} />
            <div style={{ marginTop: 12, fontSize: 14, opacity: 0.7 }}>加载天气数据...</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 16, marginBottom: 8 }}>加载失败</div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>{error}</div>
          </div>
        ) : weather ? (
          <>
            {/* Current Weather */}
            <div style={{
              textAlign: 'center',
              padding: '24px 20px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: 20,
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                <MapPin size={18} />
                <span style={{ fontSize: 18, fontWeight: 600 }}>{weather.city}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
                {WEATHER_ICONS[weather.icon] ? WEATHER_ICONS[weather.icon]!(48) : <Cloud size={48} />}
                <div>
                  <div style={{ fontSize: 56, fontWeight: 200, lineHeight: 1 }}>{weather.temperature}°</div>
                  <div style={{ fontSize: 16, opacity: 0.9 }}>{weather.description}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
                <InfoItem icon={<Thermometer size={16} />} label="体感" value={`${weather.feelsLike}°C`} />
                <InfoItem icon={<Droplets size={16} />} label="湿度" value={`${weather.humidity}%`} />
                <InfoItem icon={<Wind size={16} />} label="风速" value={`${weather.windSpeed} km/h`} />
                <InfoItem icon={<Eye size={16} />} label="能见度" value={`${weather.visibility} km`} />
                <InfoItem icon={<Sun size={16} />} label={`紫外线`} value={getUVLevel(weather.uvIndex).label} />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                <button
                  onClick={addToSaved}
                  disabled={isSaved}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px',
                    background: isSaved ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)',
                    border: 'none', borderRadius: 8, color: '#fff', cursor: isSaved ? 'default' : 'pointer',
                    fontSize: 13,
                  }}
                >
                  <Star size={14} fill={isSaved ? '#fbbf24' : 'none'} />
                  {isSaved ? '已保存' : '保存位置'}
                </button>
                <button onClick={shareWeather} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer',
                  fontSize: 13,
                }}>
                  <Share2 size={14} /> 分享
                </button>
              </div>
            </div>

            {/* Forecast */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>7 日预报</div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                {forecast.map((day, i) => (
                  <div key={i} style={{
                    minWidth: 90,
                    padding: '12px',
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 12,
                    textAlign: 'center',
                    flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>{day.date}</div>
                    <div style={{ marginBottom: 8 }}>
                      {WEATHER_ICONS[day.icon] ? 
                        WEATHER_ICONS[day.icon]!(32) : 
                        <Cloud size={32} />
                      }
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{day.maxTemp}°</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{day.minTemp}°</div>
                    {day.precipitation > 0 && (
                      <div style={{ fontSize: 11, marginTop: 4, color: '#93c5fd' }}>
                        💧 {day.precipitation}mm
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Locations */}
            {savedLocations.length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>保存的位置</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {savedLocations.map(loc => (
                    <div
                      key={loc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        background: selectedLocation?.name === loc.name ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                        borderRadius: 10,
                        fontSize: 13,
                      }}
                    >
                      <button
                        onClick={() => fetchWeather(loc.lat, loc.lon, loc.name)}
                        style={{
                          background: 'none', border: 'none', color: '#fff',
                          cursor: 'pointer', fontSize: 13,
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <MapPin size={12} /> {loc.name}
                      </button>
                      <button
                        onClick={() => removeFromSaved(loc.id)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Cities */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>热门城市</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                {POPULAR_CITIES.map(city => (
                  <button
                    key={city.name}
                    onClick={() => fetchWeather(city.lat, city.lon, city.name)}
                    style={{
                      padding: '10px',
                      background: 'rgba(255,255,255,0.15)',
                      border: 'none',
                      borderRadius: 10,
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 13,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
      <span style={{ opacity: 0.7 }}>{icon}</span>
      <span style={{ opacity: 0.8 }}>{label}:</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export default WeatherDashboard;
