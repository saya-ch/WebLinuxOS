/**
 * 统一壁纸数据
 * 合并 Desktop.tsx 和 WallpaperGallery.tsx 中的壁纸列表，去重并添加名称
 */

export interface WallpaperItem {
  id: number
  name: string
  style: string
}

export const wallpapers: WallpaperItem[] = [
  { id: 1, name: 'Midnight Ocean', style: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' },
  { id: 2, name: 'Purple Dusk', style: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b69 50%, #1a1a2e 100%)' },
  { id: 3, name: 'Dark Matter', style: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  { id: 4, name: 'Steel Grey', style: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
  { id: 5, name: 'Forest Teal', style: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' },
  { id: 6, name: 'Coral Sunrise', style: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' },
  { id: 7, name: 'Royal Blue', style: 'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)' },
  { id: 8, name: 'Violet Dream', style: 'linear-gradient(135deg, #6a0572 0%, #ab83a1 100%)' },
  { id: 9, name: 'Flame', style: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
  { id: 10, name: 'Cotton Candy', style: 'linear-gradient(135deg, #ffb7b2 0%, #e2f0cb 100%)' },
  { id: 11, name: 'Deep Ocean', style: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)' },
  { id: 12, name: 'Northern Lights', style: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
  { id: 13, name: 'Blood Moon', style: 'linear-gradient(135deg, #200122 0%, #6f0000 100%)' },
  { id: 14, name: 'Obsidian', style: 'linear-gradient(135deg, #000000 0%, #434343 100%)' },
  { id: 15, name: 'Twilight', style: 'linear-gradient(135deg, #355c7d 0%, #c96b8a 50%, #f67280 100%)' },
  { id: 16, name: 'Lavender Mist', style: 'linear-gradient(135deg, #654ea3 0%, #eaafc8 100%)' },
  { id: 17, name: 'Ocean Sunset', style: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 18, name: 'Cyan Breeze', style: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 19, name: 'Mint Emerald', style: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 20, name: 'Cosmic Purple', style: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #2a1a3e 100%)' },
  { id: 21, name: 'Deep Teal', style: 'linear-gradient(135deg, #1a2a3a 0%, #2a4a5a 50%, #1a3a4a 100%)' },
  { id: 22, name: 'Violet Night', style: 'linear-gradient(135deg, #2d1b4e 0%, #1a2a4e 50%, #0a1a3e 100%)' },
  { id: 23, name: 'Navy Abyss', style: 'linear-gradient(135deg, #0f1a2a 0%, #1a2a3a 50%, #0a2a4a 100%)' },
  { id: 24, name: 'Gradient Blue', style: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 25, name: 'Forest Green', style: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { id: 26, name: 'Sunset Orange', style: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 27, name: 'Purple Haze', style: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)' },
  { id: 28, name: 'Rose Dawn', style: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' },
  { id: 29, name: 'Night Sky', style: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)' },
  { id: 30, name: 'Cyberpunk', style: 'linear-gradient(135deg, #ff00cc 0%, #3333ff 100%)' },
  { id: 31, name: 'Autumn', style: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
  { id: 32, name: 'Spring', style: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
]

/**
 * 按索引获取壁纸样式
 */
export function getWallpaperByIndex(index: number): string {
  return wallpapers[index]?.style || ''
}
