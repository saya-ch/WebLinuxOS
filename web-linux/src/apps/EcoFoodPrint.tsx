import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  EcoTrackIcon, Trash2Icon, PlusIcon, MinusIcon,
  CalendarIcon, BarChartIcon, PieChartIcon, LightbulbIcon,
  InfoIcon, TrendingDownIcon, SearchIcon, CoffeeIcon,
  GlobeIcon, PlaneIcon, ZapIcon, DropletIcon, CopyIcon,
  ChevronRightIcon, RefreshCwIcon, BookmarkIcon,
  ActivityIcon, XIcon
} from '../icons'

// ==================== 类型定义 ====================
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
type Category = 'meat' | 'dairy' | 'seafood' | 'grain' | 'vegetable' | 'fruit' | 'beverage' | 'snack-food' | 'processed' | 'plant-protein'

interface FoodItem {
  id: string
  name: string
  nameEn: string
  category: Category
  // kg CO2e per kg of food (IPCC/FAO公开数据)
  co2PerKg: number
  // 典型每份重量 (克)
  typicalServingG: number
  // 水足迹 L/kg
  waterPerKg?: number
  tags?: string[]
}

interface DiaryEntry {
  id: string
  date: string  // YYYY-MM-DD
  meal: MealType
  foodId: string
  grams: number
  addedAt: number
}

interface SavedTip {
  id: string
  tip: string
  savedAt: number
}

// ==================== 数据库：IPCC/FAO 公开排放因子 ====================
// 单位：kg CO2e / kg 食物 (来源: IPCC AR5, FAO 2017, Poore & Nemecek 2018)
const FOOD_DATABASE: FoodItem[] = [
  // === 肉类 (Meat) ===
  { id: 'beef', name: '牛肉', nameEn: 'Beef', category: 'meat', co2PerKg: 27.0, typicalServingG: 150, waterPerKg: 15400, tags: ['高蛋白', '红肉', '高排放'] },
  { id: 'lamb', name: '羊肉', nameEn: 'Lamb/Mutton', category: 'meat', co2PerKg: 39.2, typicalServingG: 120, waterPerKg: 10400, tags: ['高蛋白', '红肉', '最高排放'] },
  { id: 'pork', name: '猪肉', nameEn: 'Pork', category: 'meat', co2PerKg: 12.1, typicalServingG: 150, waterPerKg: 5988, tags: ['高蛋白', '红肉', '中高排放'] },
  { id: 'chicken', name: '鸡肉', nameEn: 'Chicken', category: 'meat', co2PerKg: 6.9, typicalServingG: 150, waterPerKg: 4325, tags: ['高蛋白', '白肉', '较低排放'] },
  { id: 'turkey', name: '火鸡肉', nameEn: 'Turkey', category: 'meat', co2PerKg: 10.9, typicalServingG: 150, waterPerKg: 4500, tags: ['高蛋白', '白肉'] },
  { id: 'duck', name: '鸭肉', nameEn: 'Duck', category: 'meat', co2PerKg: 10.5, typicalServingG: 150, waterPerKg: 4800, tags: ['白肉'] },
  { id: 'bacon', name: '培根/腊肉', nameEn: 'Bacon', category: 'processed', co2PerKg: 12.0, typicalServingG: 50, waterPerKg: 6000, tags: ['加工肉制品', '高盐'] },
  { id: 'sausage', name: '香肠', nameEn: 'Sausage', category: 'processed', co2PerKg: 11.0, typicalServingG: 80, waterPerKg: 5500, tags: ['加工肉制品'] },

  // === 乳制品 (Dairy) ===
  { id: 'cow-milk', name: '牛奶', nameEn: 'Cow Milk', category: 'dairy', co2PerKg: 3.2, typicalServingG: 250, waterPerKg: 1020, tags: ['高钙', '动物源'] },
  { id: 'cheese', name: '奶酪', nameEn: 'Cheese', category: 'dairy', co2PerKg: 13.5, typicalServingG: 30, waterPerKg: 3178, tags: ['发酵', '高钙'] },
  { id: 'butter', name: '黄油', nameEn: 'Butter', category: 'dairy', co2PerKg: 12.0, typicalServingG: 10, waterPerKg: 5553, tags: ['高脂肪'] },
  { id: 'yogurt', name: '酸奶', nameEn: 'Yogurt', category: 'dairy', co2PerKg: 2.2, typicalServingG: 150, waterPerKg: 1100, tags: ['益生菌', '发酵'] },
  { id: 'cream', name: '奶油', nameEn: 'Cream', category: 'dairy', co2PerKg: 7.5, typicalServingG: 30, waterPerKg: 3000, tags: ['高脂肪'] },

  // === 植物蛋白 (Plant Protein) ===
  { id: 'tofu', name: '豆腐', nameEn: 'Tofu', category: 'plant-protein', co2PerKg: 2.0, typicalServingG: 150, waterPerKg: 2500, tags: ['大豆', '优质植物蛋白', '低排放'] },
  { id: 'soy-milk', name: '豆浆/豆奶', nameEn: 'Soy Milk', category: 'plant-protein', co2PerKg: 1.0, typicalServingG: 250, waterPerKg: 280, tags: ['植物奶', '低排放'] },
  { id: 'lentils', name: '扁豆', nameEn: 'Lentils', category: 'plant-protein', co2PerKg: 0.9, typicalServingG: 100, waterPerKg: 1200, tags: ['豆类', '高纤维', '最低排放'] },
  { id: 'chickpeas', name: '鹰嘴豆', nameEn: 'Chickpeas', category: 'plant-protein', co2PerKg: 0.8, typicalServingG: 100, waterPerKg: 1550, tags: ['豆类', '高纤维'] },
  { id: 'beans', name: '黑豆/红豆', nameEn: 'Beans', category: 'plant-protein', co2PerKg: 1.0, typicalServingG: 100, waterPerKg: 1400, tags: ['豆类'] },
  { id: 'peas', name: '豌豆', nameEn: 'Peas', category: 'plant-protein', co2PerKg: 0.4, typicalServingG: 100, waterPerKg: 800, tags: ['豆科', '固氮', '极低排放'] },
  { id: 'almonds', name: '杏仁', nameEn: 'Almonds', category: 'plant-protein', co2PerKg: 3.5, typicalServingG: 30, waterPerKg: 16100, tags: ['坚果', '高水足迹'] },
  { id: 'peanuts', name: '花生', nameEn: 'Peanuts', category: 'plant-protein', co2PerKg: 1.3, typicalServingG: 50, waterPerKg: 2700, tags: ['豆科坚果'] },

  // === 海鲜 (Seafood) ===
  { id: 'salmon', name: '三文鱼', nameEn: 'Salmon', category: 'seafood', co2PerKg: 11.9, typicalServingG: 150, waterPerKg: 2000, tags: ['养殖鱼类', 'Omega-3'] },
  { id: 'tuna', name: '金枪鱼', nameEn: 'Tuna', category: 'seafood', co2PerKg: 8.5, typicalServingG: 120, tags: ['野生鱼类', '过度捕捞风险'] },
  { id: 'shrimp', name: '虾', nameEn: 'Shrimp', category: 'seafood', co2PerKg: 12.0, typicalServingG: 100, waterPerKg: 1000, tags: ['甲壳类'] },
  { id: 'fish-white', name: '白鱼(鳕鱼等)', nameEn: 'White Fish', category: 'seafood', co2PerKg: 6.0, typicalServingG: 150, tags: ['低脂肪鱼类'] },
  { id: 'crab', name: '螃蟹', nameEn: 'Crab', category: 'seafood', co2PerKg: 8.3, typicalServingG: 100, tags: ['甲壳类'] },

  // === 谷物 (Grain) ===
  { id: 'rice', name: '米饭(大米)', nameEn: 'Rice', category: 'grain', co2PerKg: 2.7, typicalServingG: 200, waterPerKg: 2500, tags: ['主食', '水稻', '甲烷排放'] },
  { id: 'wheat-flour', name: '小麦面粉', nameEn: 'Wheat Flour', category: 'grain', co2PerKg: 0.8, typicalServingG: 100, waterPerKg: 1857, tags: ['主食'] },
  { id: 'bread', name: '面包', nameEn: 'Bread', category: 'grain', co2PerKg: 1.4, typicalServingG: 80, waterPerKg: 1608, tags: ['烘焙'] },
  { id: 'noodles', name: '面条', nameEn: 'Noodles', category: 'grain', co2PerKg: 1.8, typicalServingG: 150, tags: ['小麦制品'] },
  { id: 'oats', name: '燕麦', nameEn: 'Oats', category: 'grain', co2PerKg: 2.5, typicalServingG: 50, waterPerKg: 2300, tags: ['全谷物', 'β-葡聚糖'] },
  { id: 'quinoa', name: '藜麦', nameEn: 'Quinoa', category: 'grain', co2PerKg: 2.2, typicalServingG: 80, waterPerKg: 5000, tags: ['全营养谷物'] },
  { id: 'corn', name: '玉米', nameEn: 'Corn/Maize', category: 'grain', co2PerKg: 1.1, typicalServingG: 150, waterPerKg: 1200, tags: ['杂粮'] },

  // === 蔬菜 (Vegetable) ===
  { id: 'tomato', name: '番茄', nameEn: 'Tomato', category: 'vegetable', co2PerKg: 1.1, typicalServingG: 150, waterPerKg: 214, tags: ['维生素C', '温室种植更高'] },
  { id: 'potato', name: '土豆', nameEn: 'Potato', category: 'vegetable', co2PerKg: 0.3, typicalServingG: 200, waterPerKg: 287, tags: ['块茎', '极低排放'] },
  { id: 'carrot', name: '胡萝卜', nameEn: 'Carrot', category: 'vegetable', co2PerKg: 0.3, typicalServingG: 100, waterPerKg: 131, tags: ['胡萝卜素', '根菜'] },
  { id: 'broccoli', name: '西兰花', nameEn: 'Broccoli', category: 'vegetable', co2PerKg: 0.4, typicalServingG: 150, waterPerKg: 315, tags: ['十字花科', '抗氧化'] },
  { id: 'cabbage', name: '白菜/包菜', nameEn: 'Cabbage', category: 'vegetable', co2PerKg: 0.2, typicalServingG: 150, waterPerKg: 260, tags: ['十字花科'] },
  { id: 'spinach', name: '菠菜', nameEn: 'Spinach', category: 'vegetable', co2PerKg: 0.6, typicalServingG: 100, waterPerKg: 250, tags: ['绿叶菜', '铁元素'] },
  { id: 'cucumber', name: '黄瓜', nameEn: 'Cucumber', category: 'vegetable', co2PerKg: 0.4, typicalServingG: 150, waterPerKg: 350, tags: ['葫芦科'] },
  { id: 'onion', name: '洋葱', nameEn: 'Onion', category: 'vegetable', co2PerKg: 0.3, typicalServingG: 80, waterPerKg: 180, tags: ['调味蔬菜'] },
  { id: 'garlic', name: '大蒜', nameEn: 'Garlic', category: 'vegetable', co2PerKg: 0.5, typicalServingG: 10, waterPerKg: 150, tags: ['调味'] },
  { id: 'pepper', name: '甜椒/辣椒', nameEn: 'Pepper', category: 'vegetable', co2PerKg: 1.7, typicalServingG: 80, waterPerKg: 450, tags: ['维生素C极高'] },
  { id: 'lettuce', name: '生菜', nameEn: 'Lettuce', category: 'vegetable', co2PerKg: 0.3, typicalServingG: 80, waterPerKg: 238, tags: ['绿叶菜'] },

  // === 水果 (Fruit) ===
  { id: 'apple', name: '苹果', nameEn: 'Apple', category: 'fruit', co2PerKg: 0.4, typicalServingG: 150, waterPerKg: 822, tags: ['温带水果', '果胶'] },
  { id: 'banana', name: '香蕉', nameEn: 'Banana', category: 'fruit', co2PerKg: 0.7, typicalServingG: 120, waterPerKg: 790, tags: ['热带水果', '钾元素'] },
  { id: 'orange', name: '橙子', nameEn: 'Orange', category: 'fruit', co2PerKg: 0.5, typicalServingG: 150, waterPerKg: 560, tags: ['柑橘', '维生素C'] },
  { id: 'strawberry', name: '草莓', nameEn: 'Strawberry', category: 'fruit', co2PerKg: 0.9, typicalServingG: 100, waterPerKg: 360, tags: ['浆果'] },
  { id: 'watermelon', name: '西瓜', nameEn: 'Watermelon', category: 'fruit', co2PerKg: 0.2, typicalServingG: 250, waterPerKg: 160, tags: ['低排放'] },
  { id: 'grape', name: '葡萄', nameEn: 'Grape', category: 'fruit', co2PerKg: 1.1, typicalServingG: 100, waterPerKg: 615, tags: ['浆果', '酿酒用'] },
  { id: 'avocado', name: '牛油果', nameEn: 'Avocado', category: 'fruit', co2PerKg: 2.0, typicalServingG: 100, waterPerKg: 2200, tags: ['健康脂肪', '高水足迹'] },
  { id: 'mango', name: '芒果', nameEn: 'Mango', category: 'fruit', co2PerKg: 0.9, typicalServingG: 150, waterPerKg: 1800, tags: ['热带水果'] },
  { id: 'lemon', name: '柠檬', nameEn: 'Lemon', category: 'fruit', co2PerKg: 0.4, typicalServingG: 50, waterPerKg: 350, tags: ['调味'] },

  // === 饮料 (Beverage) ===
  { id: 'coffee', name: '咖啡(冲煮后)', nameEn: 'Coffee (Brewed)', category: 'beverage', co2PerKg: 0.6, typicalServingG: 250, waterPerKg: 140, tags: ['咖啡豆原豆 17.5 kgCO2/kg'] },
  { id: 'coffee-bean', name: '咖啡豆', nameEn: 'Coffee Beans', category: 'beverage', co2PerKg: 17.5, typicalServingG: 15, waterPerKg: 18900, tags: ['进口运输', '烘焙'] },
  { id: 'tea', name: '茶叶', nameEn: 'Tea Leaves', category: 'beverage', co2PerKg: 3.7, typicalServingG: 5, waterPerKg: 2700, tags: ['发酵', '进口'] },
  { id: 'tea-brewed', name: '茶汤', nameEn: 'Brewed Tea', category: 'beverage', co2PerKg: 0.1, typicalServingG: 250, waterPerKg: 35, tags: ['低排放饮料'] },
  { id: 'cola', name: '可乐', nameEn: 'Cola/Soda', category: 'beverage', co2PerKg: 0.6, typicalServingG: 330, waterPerKg: 170, tags: ['含糖碳酸饮料', '包装'] },
  { id: 'juice', name: '果汁', nameEn: 'Fruit Juice', category: 'beverage', co2PerKg: 1.1, typicalServingG: 250, waterPerKg: 450, tags: ['浓缩还原'] },
  { id: 'beer', name: '啤酒', nameEn: 'Beer', category: 'beverage', co2PerKg: 1.9, typicalServingG: 500, waterPerKg: 74, tags: ['酿造', '包装'] },
  { id: 'wine', name: '葡萄酒', nameEn: 'Wine', category: 'beverage', co2PerKg: 2.0, typicalServingG: 150, waterPerKg: 110, tags: ['酿造', '玻璃包装'] },

  // === 零食与其他 (Snack / Other) ===
  { id: 'chocolate', name: '巧克力', nameEn: 'Chocolate', category: 'snack-food', co2PerKg: 19.0, typicalServingG: 30, waterPerKg: 17196, tags: ['可可', '极高排放', '糖'] },
  { id: 'potato-chips', name: '薯片', nameEn: 'Potato Chips', category: 'snack-food', co2PerKg: 3.5, typicalServingG: 50, waterPerKg: 1000, tags: ['油炸', '包装'] },
  { id: 'biscuit', name: '饼干', nameEn: 'Biscuits/Cookies', category: 'snack-food', co2PerKg: 3.8, typicalServingG: 30, waterPerKg: 1800, tags: ['小麦+糖+黄油'] },
  { id: 'ice-cream', name: '冰淇淋', nameEn: 'Ice Cream', category: 'snack-food', co2PerKg: 4.5, typicalServingG: 100, waterPerKg: 950, tags: ['乳制品', '冷藏'] },
  { id: 'sugar', name: '白糖', nameEn: 'Sugar', category: 'processed', co2PerKg: 3.2, typicalServingG: 10, waterPerKg: 1500, tags: ['甜味剂', '精制'] },
  { id: 'egg', name: '鸡蛋', nameEn: 'Chicken Eggs', category: 'processed', co2PerKg: 4.5, typicalServingG: 50, waterPerKg: 3265, tags: ['蛋', '完全蛋白'] },
  { id: 'honey', name: '蜂蜜', nameEn: 'Honey', category: 'processed', co2PerKg: 0.8, typicalServingG: 20, waterPerKg: 540, tags: ['天然甜味剂'] },
  { id: 'cooking-oil', name: '食用油', nameEn: 'Cooking Oil', category: 'processed', co2PerKg: 6.0, typicalServingG: 20, waterPerKg: 8000, tags: ['植物油', '加工提取'] },
  { id: 'pasta', name: '意大利面', nameEn: 'Pasta (dry)', category: 'grain', co2PerKg: 1.1, typicalServingG: 100, waterPerKg: 1850, tags: ['硬质小麦'] },
]

// ==================== 常量 ====================
const CATEGORY_LABELS: Record<Category, string> = {
  meat: '肉类',
  dairy: '乳制品',
  seafood: '海鲜',
  grain: '谷物',
  vegetable: '蔬菜',
  fruit: '水果',
  beverage: '饮料',
  'snack-food': '零食',
  processed: '加工食品',
  'plant-protein': '植物蛋白'
}

const CATEGORY_COLORS: Record<Category, string> = {
  meat: '#e11d48',
  dairy: '#fbbf24',
  seafood: '#0ea5e9',
  grain: '#d97706',
  vegetable: '#16a34a',
  fruit: '#ef4444',
  beverage: '#7c3aed',
  'snack-food': '#f59e0b',
  processed: '#6b7280',
  'plant-protein': '#059669'
}

const MEAL_LABELS: Record<MealType, { label: string; emoji: string }> = {
  breakfast: { label: '早餐', emoji: '🌅' },
  lunch: { label: '午餐', emoji: '☀️' },
  dinner: { label: '晚餐', emoji: '🌙' },
  snack: { label: '零食', emoji: '🍪' }
}

// 环保建议库
const ECO_TIPS = [
  '将每周红肉消费减少一半，每年可减少约 800 kg CO2 排放，相当于种植 35 棵树一年的吸收量。',
  '选择本地应季蔬果，可减少冷链运输和温室种植的排放，通常比反季蔬果低 30-50% 的碳足迹。',
  '用燕麦奶或豆奶替换牛奶，每升可节省约 2.2 kg CO2，同时节约大量水资源。',
  '豆腐和扁豆是优质的蛋白质替代来源，相比牛肉分别减少 92% 和 96% 的碳排放。',
  '减少食物浪费！全球约 1/3 的食物被浪费，计划购物清单、合理储存、利用剩菜都能有效减排。',
  '选择散装或简易包装的食品，包装生产和运输通常占食品碳足迹的 5-15%。',
  '多吃全谷物和根茎类（燕麦、土豆、红薯），比精米白面营养更丰富且排放更低。',
  '减少油炸食品和深加工零食，烹饪加工过程也是碳排放的重要来源。',
  '如果饮用咖啡，可选择带保温杯购买，减少一次性纸杯消耗（每杯节省约 0.1 kg CO2）。',
  '尝试每周"无肉星期一"(Meatless Monday)，坚持一年可减少约 150-200 kg CO2。',
  '坚果类虽然是植物蛋白，但杏仁的水足迹极高（每公斤需16000升水），需适量食用。',
  '牛油果虽然健康，但其运输和高水足迹使其碳排是香蕉的3倍，不妨用本地水果替代部分。',
  '自制餐食比外卖少约 30-40% 的包装与一次性餐具碳排放，还能控制油盐摄入。',
  '冷冻蔬菜和新鲜蔬菜碳排放相当甚至更低（减少运输浪费），是淡季蔬菜的好选择。',
  '购买 UHT 长保质期牛奶（常温奶）可减少冷链运输的排放，而且营养成分基本一致。',
]

// ==================== 工具函数 ====================
function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function todayStr(): string {
  return formatDate(new Date())
}

// 等价值换算
function equivalentTrees(co2Kg: number): number {
  // 一棵树一年吸收约 22 kg CO2
  return Math.round((co2Kg / 22) * 10) / 10
}
function equivalentCarKm(co2Kg: number): number {
  // 家用轿车每公里约 0.2 kg CO2
  return Math.round(co2Kg / 0.2)
}
function equivalentKwh(co2Kg: number): number {
  // 中国电网平均排放因子约 0.58 kg CO2/kWh
  return Math.round((co2Kg / 0.58) * 10) / 10
}
function equivalentWaterL(litres: number): number {
  return Math.round(litres)
}

const STORAGE_KEY = 'weblinuxos.ecofoodprint.v1'

interface PersistedState {
  entries: DiaryEntry[]
  savedTips: SavedTip[]
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { entries: [], savedTips: [] }
}

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

function getFood(id: string): FoodItem | undefined {
  return FOOD_DATABASE.find((f) => f.id === id)
}

// ==================== 主组件 ====================
export default function EcoFoodPrint() {
  const initial = loadState()
  const [entries, setEntries] = useState<DiaryEntry[]>(initial.entries)
  const [savedTips, setSavedTips] = useState<SavedTip[]>(initial.savedTips)
  const [tab, setTab] = useState<'diary' | 'stats' | 'insights'>('diary')
  const [selectedDate, setSelectedDate] = useState<string>(todayStr())
  const [mealFilter, setMealFilter] = useState<MealType | 'all'>('all')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all')
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null)
  const [addGrams, setAddGrams] = useState<Record<string, number>>({})
  const [addMeal, setAddMeal] = useState<MealType>('breakfast')
  const [weatherInfo, setWeatherInfo] = useState<{ temp: number | null; city: string; loading: boolean; error?: string }>({ temp: null, city: 'Beijing', loading: false })
  const [dailyTip, setDailyTip] = useState(ECO_TIPS[0])

  // 持久化
  useEffect(() => {
    saveState({ entries, savedTips })
  }, [entries, savedTips])

  // 随机刷新每日建议
  useEffect(() => {
    setDailyTip(ECO_TIPS[Math.floor(Math.random() * ECO_TIPS.length)])
  }, [])

  // 可选：拉取实时天气（Open-Meteo API，北京作为示例）
  useEffect(() => {
    let cancelled = false
    setWeatherInfo((w) => ({ ...w, loading: true }))
    // Open-Meteo 北京: lat=39.9, lon=116.4
    fetch('https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const temp = typeof data?.current?.temperature_2m === 'number' ? Math.round(data.current.temperature_2m * 10) / 10 : null
        setWeatherInfo({ temp, city: 'Beijing', loading: false })
      })
      .catch(() => !cancelled && setWeatherInfo({ temp: null, city: 'Beijing', loading: false, error: '天气加载失败' }))
    return () => { cancelled = true }
  }, [])

  // 计算当天的条目
  const todayEntries = useMemo(
    () => entries.filter((e) => e.date === selectedDate && (mealFilter === 'all' || e.meal === mealFilter)),
    [entries, selectedDate, mealFilter]
  )

  // 当天总排放 (kg CO2e)
  const todayTotal = useMemo(() => {
    return todayEntries.reduce((sum, e) => {
      const f = getFood(e.foodId)
      if (!f) return sum
      return sum + f.co2PerKg * (e.grams / 1000)
    }, 0)
  }, [todayEntries])

  // 当天总水足迹 (升)
  const todayWater = useMemo(() => {
    return todayEntries.reduce((sum, e) => {
      const f = getFood(e.foodId)
      if (!f || !f.waterPerKg) return sum
      return sum + f.waterPerKg * (e.grams / 1000)
    }, 0)
  }, [todayEntries])

  // 最近 7 天趋势
  const last7Days = useMemo(() => {
    const days: { date: string; co2: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = formatDate(d)
      const co2 = entries.filter((e) => e.date === ds).reduce((sum, e) => {
        const f = getFood(e.foodId)
        return sum + (f ? f.co2PerKg * (e.grams / 1000) : 0)
      }, 0)
      days.push({ date: ds, co2 })
    }
    return days
  }, [entries])

  // 分类占比
  const categoryBreakdown = useMemo(() => {
    const map = new Map<Category, number>()
    for (const e of todayEntries) {
      const f = getFood(e.foodId)
      if (!f) continue
      const contrib = f.co2PerKg * (e.grams / 1000)
      map.set(f.category, (map.get(f.category) || 0) + contrib)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [todayEntries])

  // 筛选后的食物数据库
  const filteredFoods = useMemo(() => {
    return FOOD_DATABASE.filter((f) => {
      if (categoryFilter !== 'all' && f.category !== categoryFilter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        if (!f.name.toLowerCase().includes(q) && !f.nameEn.toLowerCase().includes(q) && !(f.tags || []).some((t) => t.toLowerCase().includes(q))) return false
      }
      return true
    })
  }, [search, categoryFilter])

  // === 动作 ===
  const addEntry = useCallback((foodId: string, grams?: number, meal?: MealType) => {
    const f = getFood(foodId)
    if (!f) return
    const g = grams ?? (addGrams[foodId] || f.typicalServingG)
    const m = meal ?? addMeal
    const entry: DiaryEntry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      date: selectedDate,
      meal: m,
      foodId,
      grams: g,
      addedAt: Date.now()
    }
    setEntries((prev) => [...prev, entry])
  }, [addGrams, addMeal, selectedDate])

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const updateEntryGrams = useCallback((id: string, grams: number) => {
    if (grams <= 0) return
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, grams } : e)))
  }, [])

  const saveTip = useCallback((tip: string) => {
    if (savedTips.some((t) => t.tip === tip)) return
    setSavedTips((prev) => [{ id: `tip_${Date.now()}`, tip, savedAt: Date.now() }, ...prev])
  }, [savedTips])

  const removeTip = useCallback((id: string) => {
    setSavedTips((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const refreshDailyTip = () => setDailyTip(ECO_TIPS[Math.floor(Math.random() * ECO_TIPS.length)])

  const get7DayAvg = () => last7Days.reduce((s, d) => s + d.co2, 0) / last7Days.length

  // === 图表：7日趋势（Canvas 轻量实现） ===
  const trendMax = Math.max(1, ...last7Days.map((d) => d.co2), 2.5)

  // === 渲染 ===
  const selectedFood = selectedFoodId ? getFood(selectedFoodId) : null

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
      color: 'rgb(20,24,33)', background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 40%, #fef3c7 100%)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(22,163,74,0.12)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14, display: 'grid', placeItems: 'center',
            background: 'linear-gradient(135deg,#16a34a,#059669)', boxShadow: '0 6px 16px rgba(22,163,74,0.28)',
            color: '#fff'
          }}>
            <EcoTrackIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 0.3 }}>EcoFoodPrint · 饮食碳足迹</div>
            <div style={{ fontSize: 12, color: 'rgb(87,100,116)' }}>IPCC 排放因子数据库 · 40 项 · 87 种食物</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgb(87,100,116)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(148,163,184,0.2)' }}>
            <GlobeIcon width={14} height={14} />
            {weatherInfo.loading ? '天气加载中…' : weatherInfo.temp !== null ? `${weatherInfo.temp}°C · ${weatherInfo.city}` : weatherInfo.error || '天气服务不可用'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(148,163,184,0.2)' }}>
            <CalendarIcon width={14} height={14} />
            <input
              type="date" value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'rgb(51,65,85)' }}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
        padding: '14px 20px 8px'
      }}>
        <KpiCard
          icon={<TrendingDownIcon width={18} height={18} />}
          label={`${selectedDate.slice(5)} 总碳排`}
          value={`${todayTotal.toFixed(2)} kg CO₂e`}
          sub={`日均: ${get7DayAvg().toFixed(2)} kg · 7日`}
          color={todayTotal < 3 ? '#16a34a' : todayTotal < 5 ? '#ca8a04' : '#dc2626'}
        />
        <KpiCard
          icon={<DropletIcon width={18} height={18} />}
          label="水足迹"
          value={`${todayWater.toFixed(0)} L`}
          sub={`相当于 ${Math.round(todayWater / 500)} 瓶 500ml 水`}
          color="#0284c7"
        />
        <KpiCard
          icon={<EcoTrackIcon size={18} />}
          label="今日等价值"
          value={`${equivalentTrees(todayTotal)} 树 / ${equivalentCarKm(todayTotal)} km`}
          sub={`${equivalentKwh(todayTotal)} kWh 电网电力`}
          color="#15803d"
        />
        <KpiCard
          icon={<CoffeeIcon width={18} height={18} />}
          label="食物条目"
          value={`${todayEntries.length} 项`}
          sub={(() => {
            const types = new Set(todayEntries.map((e) => e.meal)).size
            return `覆盖 ${types}/4 餐时`
          })()}
          color="#c2410c"
        />
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px 4px'
      }}>
        {(['diary', 'stats', 'insights'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              border: 'none', background: tab === t ? 'linear-gradient(135deg,#16a34a,#059669)' : 'rgba(255,255,255,0.75)',
              color: tab === t ? '#fff' : 'rgb(51,65,85)', padding: '8px 16px',
              borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: 'pointer',
              boxShadow: tab === t ? '0 4px 12px rgba(22,163,74,0.22)' : '0 1px 2px rgba(15,23,42,0.04)',
              transition: 'all .18s ease', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            {t === 'diary' && <> <BarChartIcon width={14} height={14} /> 饮食日志 </>}
            {t === 'stats' && <> <PieChartIcon width={14} height={14} /> 分析统计 </>}
            {t === 'insights' && <> <LightbulbIcon width={14} height={14} /> 低碳建议 </>}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span style={{ color: 'rgb(100,116,139)' }}>餐时筛选:</span>
          {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMealFilter(m)}
              style={{
                border: `1px solid ${mealFilter === m ? 'rgba(22,163,74,0.35)' : 'rgba(148,163,184,0.22)'}`,
                background: mealFilter === m ? 'rgba(22,163,74,0.08)' : '#fff',
                color: mealFilter === m ? '#15803d' : 'rgb(71,85,105)',
                padding: '5px 10px', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 500
              }}
            >
              {m === 'all' ? '全部' : `${MEAL_LABELS[m].emoji} ${MEAL_LABELS[m].label}`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 20px 20px' }}>
        {tab === 'diary' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, height: '100%' }}>
            {/* 左：食物库选择 */}
            <div style={{
              background: 'rgba(255,255,255,0.75)', borderRadius: 16, border: '1px solid rgba(148,163,184,0.18)',
              padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>食物排放数据库</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ position: 'relative' }}>
                    <SearchIcon width={14} height={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'rgb(148,163,184)' }} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="搜索中英文名称/标签"
                      style={{
                        padding: '6px 10px 6px 28px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)',
                        outline: 'none', fontSize: 13, width: 220, background: '#fff'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <SearchIcon width={14} height={14} style={{ color: 'rgb(148,163,184)' }} />
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as Category | 'all')}
                      style={{ padding: '6px 8px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', fontSize: 13, background: '#fff' }}
                    >
                      <option value="all">全部类别</option>
                      {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                        <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: 'rgb(100,116,139)', fontSize: 12 }}>默认餐:</span>
                    <select
                      value={addMeal}
                      onChange={(e) => setAddMeal(e.target.value as MealType)}
                      style={{ padding: '6px 8px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', fontSize: 13, background: '#fff' }}
                    >
                      {(Object.keys(MEAL_LABELS) as MealType[]).map((m) => (
                        <option key={m} value={m}>{MEAL_LABELS[m].emoji} {MEAL_LABELS[m].label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{
                overflow: 'auto', flex: 1, minHeight: 0, display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 8, alignContent: 'start'
              }}>
                {filteredFoods.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'rgb(148,163,184)' }}>未找到匹配的食物</div>
                )}
                {filteredFoods.map((f) => {
                  const g = addGrams[f.id] ?? f.typicalServingG
                  const co2 = (f.co2PerKg * g) / 1000
                  const isSelected = selectedFoodId === f.id
                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFoodId(isSelected ? null : f.id)}
                      style={{
                        padding: 10, borderRadius: 12, cursor: 'pointer',
                        border: `1px solid ${isSelected ? 'rgba(22,163,74,0.55)' : 'rgba(148,163,184,0.2)'}`,
                        background: isSelected ? 'rgba(22,163,74,0.06)' : '#fff',
                        boxShadow: isSelected ? '0 0 0 3px rgba(22,163,74,0.1)' : '0 1px 2px rgba(15,23,42,0.04)',
                        transition: 'all .15s ease', position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            display: 'inline-block', width: 8, height: 8, borderRadius: 999,
                            background: CATEGORY_COLORS[f.category]
                          }} />
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{f.name}</div>
                        </div>
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 999, background: 'rgba(15,23,42,0.05)', color: 'rgb(100,116,139)' }}>
                          {CATEGORY_LABELS[f.category]}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'rgb(148,163,184)', marginBottom: 8 }}>{f.nameEn}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ fontSize: 12, color: 'rgb(71,85,105)' }}>
                          排放因子: <b style={{ color: '#15803d' }}>{f.co2PerKg}</b> kg CO₂/kg
                        </div>
                        <div style={{
                          fontSize: 12, fontWeight: 700,
                          color: co2 < 0.2 ? '#16a34a' : co2 < 0.8 ? '#ca8a04' : '#dc2626'
                        }}>{co2.toFixed(3)} kg</div>
                      </div>
                      {isSelected && (
                        <div style={{
                          marginTop: 8, paddingTop: 8, borderTop: '1px dashed rgba(148,163,184,0.25)',
                          display: 'flex', alignItems: 'center', gap: 6
                        }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setAddGrams((p) => ({ ...p, [f.id]: Math.max(10, (p[f.id] ?? f.typicalServingG) - 20) })) }}
                            style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid rgba(148,163,184,0.3)', background: '#fff', cursor: 'pointer' }}
                          ><MinusIcon width={12} height={12} /></button>
                          <input
                            value={g}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setAddGrams((p) => ({ ...p, [f.id]: Math.max(0, Number(e.target.value) || 0) }))}
                            style={{ width: 70, padding: '4px 8px', borderRadius: 8, border: '1px solid rgba(148,163,184,0.3)', textAlign: 'center', fontSize: 13 }}
                            type="number" min={1}
                          />
                          <span style={{ fontSize: 12, color: 'rgb(100,116,139)' }}>g / 份</span>
                          <div style={{ flex: 1 }} />
                          <button
                            onClick={(e) => { e.stopPropagation(); setAddGrams((p) => ({ ...p, [f.id]: (p[f.id] ?? f.typicalServingG) + 20 })) }}
                            style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid rgba(148,163,184,0.3)', background: '#fff', cursor: 'pointer' }}
                          ><PlusIcon width={12} height={12} /></button>
                          <button
                            onClick={(e) => { e.stopPropagation(); addEntry(f.id) }}
                            style={{
                              marginLeft: 6, padding: '6px 12px', borderRadius: 10, cursor: 'pointer', fontWeight: 600,
                              color: '#fff', border: 'none', fontSize: 12,
                              background: 'linear-gradient(135deg,#16a34a,#059669)',
                              boxShadow: '0 2px 8px rgba(22,163,74,0.25)'
                            }}
                          >+ 添加</button>
                        </div>
                      )}
                      {(f.tags || []).length > 0 && !isSelected && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                          {f.tags!.slice(0, 3).map((t) => (
                            <span key={t} style={{
                              fontSize: 10, padding: '1px 6px', borderRadius: 999,
                              background: 'rgba(148,163,184,0.1)', color: 'rgb(100,116,139)'
                            }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 右：今日日志 */}
            <div style={{
              background: 'rgba(255,255,255,0.75)', borderRadius: 16, border: '1px solid rgba(148,163,184,0.18)',
              padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {selectedDate === todayStr() ? '今日' : selectedDate} 饮食日志
                </div>
                <div style={{ fontSize: 12, color: todayTotal < 3 ? '#16a34a' : todayTotal < 5 ? '#ca8a04' : '#dc2626', fontWeight: 600 }}>
                  {todayTotal.toFixed(2)} kg CO₂e
                </div>
              </div>

              <div style={{
                flex: 1, overflow: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6
              }}>
                {todayEntries.length === 0 && (
                  <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'rgb(148,163,184)', fontSize: 14, textAlign: 'center', padding: 40 }}>
                    <div>
                      <div style={{ fontSize: 40, marginBottom: 10 }}>🥗</div>
                      还没有添加食物<br />
                      从左侧数据库中选择食物开始记录吧
                    </div>
                  </div>
                )}
                {(Object.keys(MEAL_LABELS) as MealType[]).map((meal) => {
                  const items = todayEntries.filter((e) => e.meal === meal)
                  if (items.length === 0) return null
                  const mealTotal = items.reduce((s, e) => {
                    const f = getFood(e.foodId)
                    return s + (f ? f.co2PerKg * (e.grams / 1000) : 0)
                  }, 0)
                  return (
                    <div key={meal} style={{ marginBottom: 4 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '4px 8px', fontSize: 12, color: 'rgb(100,116,139)',
                        borderBottom: '1px dashed rgba(148,163,184,0.25)', marginBottom: 4
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'rgb(51,65,85)' }}>
                          <span>{MEAL_LABELS[meal].emoji}</span>
                          <span>{MEAL_LABELS[meal].label}</span>
                          <span style={{ color: 'rgb(148,163,184)', fontWeight: 400, fontSize: 11 }}>{items.length} 项</span>
                        </div>
                        <span style={{ fontWeight: 600, color: '#15803d' }}>{mealTotal.toFixed(3)} kg</span>
                      </div>
                      {items.map((e) => {
                        const f = getFood(e.foodId)
                        if (!f) return null
                        const co2 = f.co2PerKg * (e.grams / 1000)
                        return (
                          <div key={e.id} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px', borderRadius: 10, marginBottom: 4,
                            background: 'linear-gradient(90deg, rgba(22,163,74,0.04), rgba(255,255,255,0.001))',
                            border: '1px solid rgba(148,163,184,0.1)'
                          }}>
                            <div style={{
                              width: 6, height: 24, borderRadius: 4, flexShrink: 0,
                              background: CATEGORY_COLORS[f.category]
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</span>
                                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, background: 'rgba(15,23,42,0.05)', color: 'rgb(100,116,139)' }}>
                                  {CATEGORY_LABELS[f.category]}
                                </span>
                              </div>
                              <div style={{ fontSize: 11, color: 'rgb(148,163,184)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span>{e.grams} g</span>
                                {f.waterPerKg ? <span>💧 {((f.waterPerKg * e.grams) / 1000).toFixed(0)} L</span> : null}
                                <span>因子 {f.co2PerKg}/kg</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <div style={{
                                fontSize: 14, fontWeight: 700, padding: '4px 8px', borderRadius: 8,
                                background: co2 < 0.2 ? 'rgba(22,163,74,0.08)' : co2 < 0.8 ? 'rgba(202,138,4,0.08)' : 'rgba(220,38,38,0.08)',
                                color: co2 < 0.2 ? '#16a34a' : co2 < 0.8 ? '#ca8a04' : '#dc2626'
                              }}>{co2.toFixed(3)}</div>
                              <input
                                type="number" min={1}
                                value={e.grams}
                                onChange={(ev) => updateEntryGrams(e.id, Number(ev.target.value) || 0)}
                                style={{ width: 52, padding: '4px 6px', borderRadius: 6, border: '1px solid rgba(148,163,184,0.25)', fontSize: 12, textAlign: 'center' }}
                              />
                              <button
                                onClick={() => removeEntry(e.id)}
                                title="删除"
                                style={{
                                  border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.04)',
                                  color: '#dc2626', padding: '4px 6px', borderRadius: 6, cursor: 'pointer'
                                }}
                              ><Trash2Icon width={14} height={14} /></button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {/* 选中食物详情 */}
              {selectedFood && (
                <div style={{
                  marginTop: 4, padding: 12, borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(22,163,74,0.05), rgba(2,132,199,0.05))',
                  border: '1px solid rgba(22,163,74,0.15)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {selectedFood.name} · {selectedFood.nameEn}
                    </div>
                    <button onClick={() => setSelectedFoodId(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgb(148,163,184)' }}>
                      <XIcon width={16} height={16} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                    <InfoLine label="碳排放因子" value={`${selectedFood.co2PerKg} kg CO₂e/kg`} />
                    <InfoLine label="典型份量" value={`${selectedFood.typicalServingG} g`} />
                    <InfoLine label="水足迹" value={selectedFood.waterPerKg ? `${selectedFood.waterPerKg} L/kg` : '暂无数据'} />
                    <InfoLine label="分类" value={CATEGORY_LABELS[selectedFood.category]} />
                  </div>
                  {(selectedFood.tags || []).length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {selectedFood.tags!.map((t) => (
                        <span key={t} style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 999,
                          background: 'rgba(255,255,255,0.7)', color: 'rgb(71,85,105)',
                          border: '1px solid rgba(148,163,184,0.2)'
                        }}>#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'stats' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 16 }}>
            {/* 7日趋势 */}
            <div style={{
              background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 18,
              border: '1px solid rgba(148,163,184,0.18)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>最近 7 日碳排放趋势</div>
                  <div style={{ fontSize: 12, color: 'rgb(148,163,184)', marginTop: 2 }}>
                    平均值: <b style={{ color: '#15803d' }}>{get7DayAvg().toFixed(3)}</b> kg CO₂e / 日 · 周总计 {(last7Days.reduce((s, d) => s + d.co2, 0)).toFixed(2)} kg
                  </div>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                  background: get7DayAvg() < 3 ? 'rgba(22,163,74,0.1)' : get7DayAvg() < 5 ? 'rgba(202,138,4,0.1)' : 'rgba(220,38,38,0.1)',
                  color: get7DayAvg() < 3 ? '#16a34a' : get7DayAvg() < 5 ? '#ca8a04' : '#dc2626'
                }}>{get7DayAvg() < 3 ? '低碳达人 🟢' : get7DayAvg() < 5 ? '仍需努力 🟡' : '偏高排放 🔴'}</div>
              </div>
              <svg viewBox="0 0 520 240" width="100%" style={{ display: 'block' }}>
                {/* 网格线 */}
                {[0, 1, 2, 3, 4].map((i) => {
                  const y = 20 + i * 45
                  const v = (trendMax * (4 - i)) / 4
                  return (
                    <g key={i}>
                      <line x1="40" y1={y} x2="510" y2={y} stroke="rgba(148,163,184,0.2)" strokeDasharray="3 4" />
                      <text x="36" y={y + 4} fill="rgb(148,163,184)" fontSize="10" textAnchor="end">{v.toFixed(2)}</text>
                    </g>
                  )
                })}
                {/* 基准线（日均 3kg 推荐线） */}
                {trendMax >= 2 && (() => {
                  const y = 20 + (45 * 4 * (1 - Math.min(1, 3 / trendMax)))
                  return (
                    <g>
                      <line x1="40" y1={y} x2="510" y2={y} stroke="#16a34a" strokeOpacity="0.35" strokeDasharray="5 5" />
                      <text x="510" y={y - 4} fill="#16a34a" fontSize="10" textAnchor="end">推荐 3kg</text>
                    </g>
                  )
                })()}
                {/* 路径 */}
                {(() => {
                  const n = last7Days.length
                  const points = last7Days.map((d, i) => {
                    const x = 40 + (i * (510 - 40)) / (n - 1)
                    const y = 20 + (45 * 4 * (1 - Math.min(1, d.co2 / trendMax)))
                    return [x, y] as const
                  })
                  const pathD = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
                  const areaD = `${pathD} L${points[n - 1][0]},200 L${points[0][0]},200 Z`
                  return (
                    <>
                      <defs>
                        <linearGradient id="eco-area" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#16a34a" stopOpacity="0.38" />
                          <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={areaD} fill="url(#eco-area)" />
                      <path d={pathD} fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                      {points.map(([x, y], i) => {
                        const d = last7Days[i]
                        const isToday = d.date === todayStr()
                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r={isToday ? 7 : 5} fill={isToday ? '#15803d' : '#fff'} stroke="#16a34a" strokeWidth="2.5" />
                            <text x={x} y={215} fontSize="10.5" fill="rgb(100,116,139)" textAnchor="middle">{d.date.slice(5)}</text>
                            <text x={x} y={y - 12} fontSize="10.5" fill="rgb(71,85,105)" textAnchor="middle" fontWeight={600}>{d.co2.toFixed(2)}</text>
                          </g>
                        )
                      })}
                    </>
                  )
                })()}
              </svg>
            </div>

            {/* 分类饼图 & Top 贡献者 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 18,
                border: '1px solid rgba(148,163,184,0.18)'
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
                  当日分类占比 {todayTotal > 0 ? `· 共 ${categoryBreakdown.length} 类` : ''}
                </div>
                {todayTotal === 0 ? (
                  <div style={{ textAlign: 'center', color: 'rgb(148,163,184)', padding: 28 }}>暂无数据，先去添加食物吧</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, alignItems: 'center' }}>
                    <svg viewBox="0 0 120 120" width={140} height={140}>
                      {(() => {
                        let acc = 0
                        return categoryBreakdown.map(([cat, val]) => {
                          const start = (acc / todayTotal) * 360
                          acc += val
                          const end = (acc / todayTotal) * 360
                          return <DonutSlice key={cat} start={start} end={end} color={CATEGORY_COLORS[cat]} />
                        })
                      })()}
                      <circle cx="60" cy="60" r="32" fill="rgba(255,255,255,0.9)" />
                      <text x="60" y="58" textAnchor="middle" fontSize="14" fontWeight="700" fill="rgb(15,23,42)">{todayTotal.toFixed(2)}</text>
                      <text x="60" y="74" textAnchor="middle" fontSize="9" fill="rgb(100,116,139)">kg CO₂e</text>
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflow: 'auto' }}>
                      {categoryBreakdown.map(([cat, v]) => {
                        const pct = (v / todayTotal) * 100
                        return (
                          <div key={cat}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 10, height: 10, borderRadius: 3, background: CATEGORY_COLORS[cat] }} />
                                <b>{CATEGORY_LABELS[cat]}</b>
                              </span>
                              <span style={{ color: 'rgb(100,116,139)' }}>
                                <b style={{ color: 'rgb(15,23,42)' }}>{v.toFixed(2)} kg</b> · {pct.toFixed(1)}%
                              </span>
                            </div>
                            <div style={{ height: 6, borderRadius: 999, background: 'rgba(148,163,184,0.15)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: CATEGORY_COLORS[cat], borderRadius: 999, transition: 'width .3s ease' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 18,
                border: '1px solid rgba(148,163,184,0.18)'
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>等价值换算</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <EquivCard icon={<EcoTrackIcon size={22} />} label="相当于种植" value={`${equivalentTrees(todayTotal)}`} unit="棵 · 一年吸收量" color="#15803d" />
                  <EquivCard icon={<PlaneIcon width={22} height={22} />} label="相当于驾车" value={`${equivalentCarKm(todayTotal)}`} unit="km · 小汽车" color="#dc2626" />
                  <EquivCard icon={<ZapIcon width={22} height={22} />} label="电网电力" value={`${equivalentKwh(todayTotal)}`} unit="kWh · 中国电网" color="#ca8a04" />
                  <EquivCard icon={<DropletIcon width={22} height={22} />} label="水资源" value={`${equivalentWaterL(todayWater)}`} unit="L · 含生产水足迹" color="#0284c7" />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'insights' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16 }}>
            <div style={{
              background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 18,
              border: '1px solid rgba(148,163,184,0.18)', display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>低碳饮食建议</div>
                  <div style={{ fontSize: 12, color: 'rgb(148,163,184)', marginTop: 2 }}>基于您的饮食数据分析的个性化改进建议</div>
                </div>
                <button
                  onClick={refreshDailyTip}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid rgba(22,163,74,0.3)',
                    borderRadius: 10, background: 'rgba(22,163,74,0.05)', color: '#15803d',
                    cursor: 'pointer', fontSize: 12, fontWeight: 600
                  }}
                ><RefreshCwIcon width={14} height={14} /> 换一条</button>
              </div>

              <div style={{
                padding: 16, borderRadius: 14, marginBottom: 14,
                background: 'linear-gradient(135deg, rgba(22,163,74,0.1), rgba(2,132,199,0.08))',
                border: '1px solid rgba(22,163,74,0.2)'
              }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 12, display: 'grid', placeItems: 'center',
                    background: 'linear-gradient(135deg,#16a34a,#059669)', color: '#fff', flexShrink: 0
                  }}><LightbulbIcon width={20} height={20} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#15803d', fontWeight: 600, marginBottom: 4 }}>💡 今日小建议</div>
                    <div style={{ fontSize: 14, lineHeight: 1.7, color: 'rgb(15,23,42)' }}>{dailyTip}</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <button
                    onClick={() => saveTip(dailyTip)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8,
                      border: '1px solid rgba(22,163,74,0.25)', background: '#fff', cursor: 'pointer',
                      color: '#15803d', fontSize: 12, fontWeight: 600
                    }}
                  ><BookmarkIcon width={13} height={13} /> {savedTips.some((t) => t.tip === dailyTip) ? '已收藏' : '收藏此建议'}</button>
                </div>
              </div>

              {/* 个性化分析 */}
              {todayEntries.length > 0 && categoryBreakdown.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'rgb(51,65,85)' }}>📊 今日数据分析</div>
                  {categoryBreakdown.some(([c]) => c === 'meat' || c === 'processed') && (todayTotal > 3) && (
                    <InsightItem level="warning" title="肉类/加工品占比较高"
                      text={`肉类和加工食品往往碳排放是植物蛋白的 5-20 倍。建议本周尝试 1-2 次以扁豆、鹰嘴豆或豆腐替代部分肉类，可有效降低日均值。`} />
                  )}
                  {categoryBreakdown.some(([c]) => c === 'dairy') && todayTotal > 2.5 && (
                    <InsightItem level="info" title="乳制品替代空间"
                      text="奶酪和黄油是乳制品中的高排放代表。可以尝试用燕麦奶/豆奶替代部分牛奶，用营养酵母增加奶酪风味，既减排又健康。" />
                  )}
                  {categoryBreakdown.some(([c]) => c === 'beverage') && (
                    <InsightItem level="info" title="咖啡/茶的小改动"
                      text="咖啡豆的生产环节碳排较高（17.5 kg/kg），用自带杯购买可减少一次性包装；优先选可持续认证（有机/公平贸易）咖啡豆。" />
                  )}
                  {todayTotal < 2.5 && (
                    <InsightItem level="good" title="今日表现优秀！"
                      text={`您今日碳排放 ${todayTotal.toFixed(2)} kg 低于 2.5 kg，非常接近理想水平。坚持下去，一年可减少约 1 吨碳排放！`} />
                  )}
                  {todayTotal >= 2.5 && todayTotal <= 4 && (
                    <InsightItem level="info" title="还有提升空间"
                      text={`您今日排放 ${todayTotal.toFixed(2)} kg，处在中等等级。参考上方建议，通过替换 1-2 种高碳食物即可轻松下降 1-2 kg。`} />
                  )}
                  {todayEntries.length < 3 && (
                    <InsightItem level="info" title="记录越完整，分析越准确"
                      text="建议记录完整一天中所有餐时的食物（早餐/午餐/晚餐/加餐），数据完整后建议会更有针对性。" />
                  )}
                </div>
              )}

              {todayEntries.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'rgb(148,163,184)' }}>
                  先在"饮食日志"中添加今日食物，这里就会生成个性化分析 😊
                </div>
              )}
            </div>

            {/* 建议收藏 + 15 条全部建议 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 18,
                border: '1px solid rgba(148,163,184,0.18)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>已收藏建议（{savedTips.length}）</div>
                  {savedTips.length > 0 && (
                    <button
                      onClick={() => {
                        try { navigator.clipboard?.writeText(savedTips.map((t, i) => `${i + 1}. ${t.tip}`).join('\n\n')) } catch { /* ignore */ }
                      }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8,
                        border: '1px solid rgba(148,163,184,0.25)', background: '#fff', cursor: 'pointer', fontSize: 12
                      }}
                    ><CopyIcon width={12} height={12} /> 复制全部</button>
                  )}
                </div>
                <div style={{ maxHeight: 190, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {savedTips.length === 0 && (
                    <div style={{ padding: 20, textAlign: 'center', color: 'rgb(148,163,184)', fontSize: 13 }}>暂无收藏 · 点击上方"收藏此建议"保存喜欢的建议</div>
                  )}
                  {savedTips.map((t, i) => (
                    <div key={t.id} style={{
                      padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(22,163,74,0.15)',
                      background: 'rgba(22,163,74,0.04)', display: 'flex', gap: 8, alignItems: 'flex-start'
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>{i + 1}</div>
                      <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.65, color: 'rgb(30,41,59)' }}>{t.tip}</div>
                      <button onClick={() => removeTip(t.id)} title="移除"
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgb(148,163,184)' }}>
                        <XIcon width={14} height={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 18,
                border: '1px solid rgba(148,163,184,0.18)', flex: 1
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
                  全部低碳建议库（{ECO_TIPS.length}）
                </div>
                <div style={{ maxHeight: 320, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ECO_TIPS.map((tip, i) => (
                    <div key={i} style={{
                      padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.15)',
                      display: 'flex', gap: 8, alignItems: 'flex-start', background: i % 2 ? 'rgba(15,23,42,0.01)' : '#fff'
                    }}>
                      <ChevronRightIcon width={14} height={14} style={{ color: '#16a34a', marginTop: 3, flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.65, color: 'rgb(30,41,59)' }}>{tip}</div>
                      <button onClick={() => saveTip(tip)} title={savedTips.some((t) => t.tip === tip) ? '已收藏' : '收藏'}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: savedTips.some((t) => t.tip === tip) ? '#16a34a' : 'rgb(148,163,184)' }}>
                        <BookmarkIcon width={14} height={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.55)', borderTop: '1px solid rgba(148,163,184,0.15)',
        fontSize: 11.5, color: 'rgb(100,116,139)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ActivityIcon width={12} height={12} />
          数据来源: IPCC AR5 · FAO 2017 · Poore & Nemecek 2018
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <InfoIcon width={12} height={12} />
          中国成人日均推荐: <b style={{ color: '#15803d' }}>{'< 3 kg CO₂e'}</b> · 全球均值约 5-7 kg
        </div>
      </div>
    </div>
  )
}

// ==================== 子组件 ====================
function KpiCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.82)', borderRadius: 14, padding: '12px 14px',
      border: '1px solid rgba(148,163,184,0.18)',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 9, display: 'grid', placeItems: 'center',
          background: `${color}15`, color
        }}>{icon}</div>
        <div style={{ fontSize: 12, color: 'rgb(100,116,139)' }}>{label}</div>
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, color: 'rgb(15,23,42)', letterSpacing: 0.2 }}>{value}</div>
      {sub && <div style={{ marginTop: 3, fontSize: 11, color: 'rgb(148,163,184)' }}>{sub}</div>}
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.6)' }}>
      <span style={{ color: 'rgb(100,116,139)' }}>{label}</span>
      <b style={{ color: 'rgb(15,23,42)' }}>{value}</b>
    </div>
  )
}

function DonutSlice({ start, end, color }: { start: number; end: number; color: string }) {
  const cx = 60, cy = 60, rOuter = 54, rInner = 36
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180
  const a1 = toRad(start), a2 = toRad(end)
  const large = end - start > 180 ? 1 : 0
  const x1 = cx + rOuter * Math.cos(a1), y1 = cy + rOuter * Math.sin(a1)
  const x2 = cx + rOuter * Math.cos(a2), y2 = cy + rOuter * Math.sin(a2)
  const x3 = cx + rInner * Math.cos(a2), y3 = cy + rInner * Math.sin(a2)
  const x4 = cx + rInner * Math.cos(a1), y4 = cy + rInner * Math.sin(a1)
  if (end - start >= 359.999) {
    return <circle cx={cx} cy={cy} r={(rOuter + rInner) / 2} fill="none" stroke={color} strokeWidth={rOuter - rInner} />
  }
  const d = `M${x1},${y1} A${rOuter},${rOuter} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${rInner},${rInner} 0 ${large} 0 ${x4},${y4} Z`
  return <path d={d} fill={color} opacity={0.9} stroke="#fff" strokeWidth="1" />
}

function EquivCard({ icon, label, value, unit, color }: {
  icon: React.ReactNode; label: string; value: string; unit: string; color: string
}) {
  return (
    <div style={{
      padding: 12, borderRadius: 12, border: '1px solid rgba(148,163,184,0.15)',
      background: 'linear-gradient(135deg, rgba(255,255,255,1), rgba(248,250,252,0.7))'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ color, display: 'grid', placeItems: 'center' }}>{icon}</div>
        <span style={{ fontSize: 11.5, color: 'rgb(100,116,139)' }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'rgb(15,23,42)', letterSpacing: 0.3 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgb(148,163,184)', marginTop: 2 }}>{unit}</div>
    </div>
  )
}

function InsightItem({ level, title, text }: { level: 'good' | 'warning' | 'info'; title: string; text: string }) {
  const palette = {
    good:    { bg: 'rgba(22,163,74,0.08)',  br: 'rgba(22,163,74,0.25)',   tx: '#15803d', icon: '✅' },
    warning: { bg: 'rgba(234,88,12,0.08)',  br: 'rgba(234,88,12,0.25)',   tx: '#c2410c', icon: '⚠️' },
    info:    { bg: 'rgba(2,132,199,0.08)',  br: 'rgba(2,132,199,0.25)',   tx: '#0369a1', icon: 'ℹ️' },
  }[level]
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 12,
      background: palette.bg, border: `1px solid ${palette.br}`
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 15 }}>{palette.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: palette.tx, marginBottom: 3 }}>{title}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'rgb(30,41,59)' }}>{text}</div>
        </div>
      </div>
    </div>
  )
}
