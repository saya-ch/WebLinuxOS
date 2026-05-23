import { useState } from 'react'
import { useStore } from '../store'

const wallpapers = [
  { id: 1, name: 'Gradient Blue', style: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 2, name: 'Ocean Sunset', style: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 3, name: 'Forest Green', style: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { id: 4, name: 'Sunset Orange', style: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 5, name: 'Deep Ocean', style: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)' },
  { id: 6, name: 'Purple Haze', style: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)' },
  { id: 7, name: 'Sunrise', style: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' },
  { id: 8, name: 'Night Sky', style: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)' },
  { id: 9, name: 'Cyberpunk', style: 'linear-gradient(135deg, #ff00cc 0%, #3333ff 100%)' },
  { id: 10, name: 'Autumn', style: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
  { id: 11, name: 'Spring', style: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { id: 12, name: 'Dark Matter', style: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
]

const WallpaperGallery = () => {
  const setWallpaper = useStore(state => state.setWallpaper)
  const currentWallpaper = useStore(state => state.wallpaper)
  const [customColor1, setCustomColor1] = useState('#667eea')
  const [customColor2, setCustomColor2] = useState('#764ba2')

  const applyWallpaper = (style: string) => {
    setWallpaper(style)
  }

  const applyCustom = () => {
    const style = `linear-gradient(135deg, ${customColor1} 0%, ${customColor2} 100%)`
    setWallpaper(style)
  }

  return (
    <div className="p-4 h-full flex flex-col gap-4 overflow-y-auto">
      <h2 className="text-2xl font-bold">🎨 Wallpaper Gallery</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {wallpapers.map(wallpaper => (
          <div 
            key={wallpaper.id}
            className="cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
            style={{ 
              background: wallpaper.style,
              borderColor: currentWallpaper === wallpaper.style ? '#3b82f6' : 'transparent'
            }}
            onClick={() => applyWallpaper(wallpaper.style)}
          >
            <div className="aspect-video flex items-end p-2 bg-black/20">
              <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
                {wallpaper.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-lg font-semibold mb-3">Custom Gradient</h3>
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm">Color 1:</label>
            <input 
              type="color" 
              value={customColor1}
              onChange={(e) => setCustomColor1(e.target.value)}
              className="w-12 h-8 rounded cursor-pointer"
            />
            <span className="text-xs font-mono">{customColor1}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Color 2:</label>
            <input 
              type="color" 
              value={customColor2}
              onChange={(e) => setCustomColor2(e.target.value)}
              className="w-12 h-8 rounded cursor-pointer"
            />
            <span className="text-xs font-mono">{customColor2}</span>
          </div>
          <button 
            onClick={applyCustom}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            Apply
          </button>
        </div>
        
        <div 
          className="mt-3 aspect-video rounded-lg border-2 border-gray-700"
          style={{ background: `linear-gradient(135deg, ${customColor1} 0%, ${customColor2} 100%)` }}
        />
      </div>

      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-lg font-semibold mb-3">Solid Color</h3>
        <div className="grid grid-cols-8 gap-2">
          {['#000000', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#ffffff',
            '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'].map(color => (
            <button
              key={color}
              onClick={() => setWallpaper(color)}
              className="aspect-square rounded-lg border-2 border-gray-600 hover:border-blue-500 transition-colors"
              style={{ background: color }}
            />
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-700">
        <button 
          onClick={() => setWallpaper('')}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Reset to Default
        </button>
      </div>
    </div>
  )
}

export default WallpaperGallery
