import { useState, useCallback, useEffect } from 'react'

interface Recipe {
  id: number
  title: string
  image: string
  readyInMinutes: number
  servings: number
  summary: string
  instructions: string
  ingredients: string[]
  sourceUrl: string
  diets: string[]
  cuisines: string[]
}

interface RecipeSearchResult {
  id: number
  title: string
  image: string
  readyInMinutes: number
  servings: number
}

const sampleRecipes: RecipeSearchResult[] = [
  { id: 1, title: '宫保鸡丁', image: '🍗', readyInMinutes: 30, servings: 4 },
  { id: 2, title: '番茄炒蛋', image: '🍅', readyInMinutes: 15, servings: 2 },
  { id: 3, title: '红烧排骨', image: '🍖', readyInMinutes: 60, servings: 4 },
  { id: 4, title: '清蒸鲈鱼', image: '🐟', readyInMinutes: 25, servings: 3 },
  { id: 5, title: '麻婆豆腐', image: '🥘', readyInMinutes: 20, servings: 3 },
  { id: 6, title: '蛋炒饭', image: '🍚', readyInMinutes: 15, servings: 2 },
  { id: 7, title: '红烧肉', image: '🥩', readyInMinutes: 90, servings: 4 },
  { id: 8, title: '酸辣汤', image: '🥣', readyInMinutes: 20, servings: 4 },
  { id: 9, title: '蒜蓉西兰花', image: '🥦', readyInMinutes: 15, servings: 2 },
  { id: 10, title: '糖醋里脊', image: '🍖', readyInMinutes: 35, servings: 3 },
  { id: 11, title: '水煮鱼', image: '🐟', readyInMinutes: 40, servings: 4 },
  { id: 12, title: '葱爆羊肉', image: '🥩', readyInMinutes: 25, servings: 3 }
]

const detailedRecipes: Record<number, Recipe> = {
  1: {
    id: 1,
    title: '宫保鸡丁',
    image: '🍗',
    readyInMinutes: 30,
    servings: 4,
    summary: '经典川菜，以鸡丁、花生米、干辣椒为主要材料，口感麻辣鲜香，是一道下饭的好菜。',
    instructions: '1. 鸡胸肉切丁，加料酒、盐、淀粉腌制\n2. 花生油炸至金黄\n3. 锅中放油，爆香花椒和干辣椒\n4. 加入鸡丁翻炒至变色\n5. 加入葱段、蒜片、姜片\n6. 调入酱油、醋、糖、盐\n7. 最后加入花生米翻炒均匀',
    ingredients: ['鸡胸肉 300g', '花生米 50g', '干辣椒 10个', '花椒 1勺', '葱 2根', '姜 3片', '蒜 3瓣', '酱油 2勺', '醋 1勺', '糖 1勺', '盐 适量', '淀粉 1勺'],
    sourceUrl: '#',
    diets: ['高蛋白'],
    cuisines: ['川菜', '中餐']
  },
  2: {
    id: 2,
    title: '番茄炒蛋',
    image: '🍅',
    readyInMinutes: 15,
    servings: 2,
    summary: '家常菜，简单易做，酸甜可口，是最受欢迎的下饭菜之一。',
    instructions: '1. 番茄切块，鸡蛋打散\n2. 锅中放油，炒散鸡蛋盛出\n3. 锅中再放少许油，炒番茄\n4. 加入少许盐和糖\n5. 番茄出汁后倒入鸡蛋\n6. 翻炒均匀即可',
    ingredients: ['番茄 2个', '鸡蛋 3个', '盐 适量', '糖 1勺', '油 适量'],
    sourceUrl: '#',
    diets: ['素食'],
    cuisines: ['家常菜', '中餐']
  },
  3: {
    id: 3,
    title: '红烧排骨',
    image: '🍖',
    readyInMinutes: 60,
    servings: 4,
    summary: '经典家常菜，色泽红亮，肉质软烂，香味浓郁。',
    instructions: '1. 排骨冷水下锅焯水去血沫\n2. 锅中放油，加冰糖炒出糖色\n3. 放入排骨翻炒上色\n4. 加入葱段、姜片、八角、桂皮\n5. 加入料酒、酱油、老抽\n6. 加水没过排骨，大火烧开后转小火\n7. 炖煮40分钟，大火收汁',
    ingredients: ['排骨 500g', '冰糖 30g', '姜 5片', '葱 2根', '八角 2个', '桂皮 1小块', '酱油 2勺', '老抽 1勺', '料酒 2勺', '盐 适量'],
    sourceUrl: '#',
    diets: ['高蛋白'],
    cuisines: ['家常菜', '中餐']
  },
  4: {
    id: 4,
    title: '清蒸鲈鱼',
    image: '🐟',
    readyInMinutes: 25,
    servings: 3,
    summary: '清淡健康，鱼肉鲜嫩，是一道非常适合家庭制作的海鲜菜。',
    instructions: '1. 鲈鱼处理干净，两面划几刀\n2. 鱼身抹盐，放上姜片和葱段\n3. 水开后蒸8-10分钟\n4. 取出倒掉盘中水\n5. 放上葱丝，淋上热油\n6. 最后淋上蒸鱼豉油',
    ingredients: ['鲈鱼 1条', '姜 5片', '葱 3根', '蒸鱼豉油 2勺', '盐 适量', '油 适量'],
    sourceUrl: '#',
    diets: ['低脂', '高蛋白'],
    cuisines: ['粤菜', '中餐']
  },
  5: {
    id: 5,
    title: '麻婆豆腐',
    image: '🥘',
    readyInMinutes: 20,
    servings: 3,
    summary: '四川传统名菜，麻辣鲜香，豆腐嫩滑，肉末香浓。',
    instructions: '1. 豆腐切块焯水\n2. 锅中放油，炒香肉末\n3. 加入豆瓣酱、花椒粉\n4. 加入适量水烧开\n5. 放入豆腐小火煮5分钟\n6. 勾芡，撒上葱花和花椒粉',
    ingredients: ['嫩豆腐 400g', '肉末 100g', '豆瓣酱 2勺', '花椒粉 1勺', '葱 2根', '蒜 3瓣', '姜 3片', '淀粉 1勺'],
    sourceUrl: '#',
    diets: ['素食可选'],
    cuisines: ['川菜', '中餐']
  },
  6: {
    id: 6,
    title: '蛋炒饭',
    image: '🍚',
    readyInMinutes: 15,
    servings: 2,
    summary: '简单美味，粒粒分明，是最经典的中式炒饭。',
    instructions: '1. 隔夜米饭打散\n2. 鸡蛋打散炒散盛出\n3. 锅中放油，炒香葱花\n4. 倒入米饭翻炒\n5. 加入鸡蛋继续翻炒\n6. 调入盐和少许酱油\n7. 翻炒均匀即可',
    ingredients: ['隔夜米饭 2碗', '鸡蛋 2个', '葱 2根', '盐 适量', '酱油 1勺', '油 适量'],
    sourceUrl: '#',
    diets: [],
    cuisines: ['家常菜', '中餐']
  },
  7: {
    id: 7,
    title: '红烧肉',
    image: '🥩',
    readyInMinutes: 90,
    servings: 4,
    summary: '肥而不腻，入口即化，色泽红亮，是一道经典的中式硬菜。',
    instructions: '1. 五花肉切块，冷水下锅焯水\n2. 锅中放少许油，炒糖色\n3. 放入肉块翻炒上色\n4. 加入葱姜、八角、桂皮\n5. 加料酒、酱油、老抽\n6. 加水炖煮1小时\n7. 大火收汁即可',
    ingredients: ['五花肉 500g', '冰糖 40g', '姜 5片', '葱 2根', '八角 2个', '桂皮 1小块', '酱油 2勺', '老抽 1勺', '料酒 2勺'],
    sourceUrl: '#',
    diets: [],
    cuisines: ['家常菜', '中餐']
  },
  8: {
    id: 8,
    title: '酸辣汤',
    image: '🥣',
    readyInMinutes: 20,
    servings: 4,
    summary: '酸辣开胃，口感丰富，是一道受欢迎的汤品。',
    instructions: '1. 木耳、豆腐、香菇切丝\n2. 锅中放水，加入所有丝料\n3. 加入酱油、醋、盐调味\n4. 勾芡打入蛋花\n5. 撒上香菜和胡椒粉',
    ingredients: ['豆腐 100g', '木耳 30g', '香菇 3朵', '鸡蛋 1个', '香菜 1把', '醋 2勺', '酱油 1勺', '白胡椒粉 1勺', '淀粉 1勺'],
    sourceUrl: '#',
    diets: ['素食可选'],
    cuisines: ['家常菜', '中餐']
  }
}

export default function RecipeBook() {
  const [searchQuery, setSearchQuery] = useState('')
  const [recipes] = useState<RecipeSearchResult[]>(sampleRecipes)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem('recipe-book-favorites')
    return saved ? JSON.parse(saved) : []
  })
  const [viewMode, setViewMode] = useState<'search' | 'detail'>('search')
  const [activeFilter, setActiveFilter] = useState<'all' | 'quick' | 'vegetarian'>('all')

  useEffect(() => {
    localStorage.setItem('recipe-book-favorites', JSON.stringify(favorites))
  }, [favorites])

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
    if (activeFilter === 'quick') {
      return matchesSearch && recipe.readyInMinutes <= 30
    }
    if (activeFilter === 'vegetarian') {
      return matchesSearch && (recipe.id === 2 || recipe.id === 8)
    }
    return matchesSearch
  })

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    )
  }

  const selectRecipe = useCallback((recipeId: number) => {
    setLoading(true)
    setTimeout(() => {
      const recipe = detailedRecipes[recipeId] || {
        ...sampleRecipes.find(r => r.id === recipeId)!,
        summary: '这是一道美味的菜肴。',
        instructions: '1. 准备食材\n2. 烹饪\n3. 享用',
        ingredients: ['食材1', '食材2', '食材3'],
        sourceUrl: '#',
        diets: [],
        cuisines: []
      }
      setSelectedRecipe(recipe)
      setViewMode('detail')
      setLoading(false)
    }, 500)
  }, [])

  const goBack = () => {
    setViewMode('search')
    setSelectedRecipe(null)
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      background: 'linear-gradient(180deg, #1e1e2e 0%, #1a1a2e 100%)',
      color: '#e0e0e0'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '16px 20px', 
        background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {viewMode === 'detail' && (
          <button
            onClick={goBack}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            ← 返回
          </button>
        )}
        <span style={{ fontSize: '24px' }}>🍳</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '18px', color: 'white' }}>
            食谱大全
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
            {viewMode === 'search' ? '探索美味食谱' : selectedRecipe?.title}
          </div>
        </div>
      </div>

      {viewMode === 'search' ? (
        <>
          {/* Search Bar */}
          <div style={{ 
            padding: '16px 20px', 
            background: '#252536',
            borderBottom: '1px solid #3a3a5c'
          }}>
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '16px' }}>🔍</span>
              <input
                type="text"
                placeholder="搜索食谱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: '#1e1e2e',
                  border: '1px solid #3a3a5c',
                  borderRadius: '8px',
                  color: '#e0e0e0',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            
            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { key: 'all', label: '全部', icon: '📋' },
                { key: 'quick', label: '快手菜', icon: '⚡' },
                { key: 'vegetarian', label: '素食', icon: '🥬' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key as any)}
                  style={{
                    padding: '6px 14px',
                    background: activeFilter === filter.key 
                      ? 'linear-gradient(135deg, #e74c3c, #c0392b)' 
                      : '#2d2d3e',
                    border: activeFilter === filter.key 
                      ? 'none' 
                      : '1px solid #3a3a5c',
                    borderRadius: '20px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{filter.icon}</span>
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipe Grid */}
          <div style={{ 
            flex: 1, 
            overflow: 'auto', 
            padding: '16px 20px' 
          }}>
            {filteredRecipes.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#9090a4' 
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍽️</div>
                <div>没有找到相关食谱</div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {filteredRecipes.map(recipe => (
                  <div
                    key={recipe.id}
                    onClick={() => selectRecipe(recipe.id)}
                    style={{
                      background: '#252536',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      border: '1px solid #3a3a5c'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      height: '140px',
                      background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '64px',
                      position: 'relative'
                    }}>
                      {recipe.image}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(recipe.id)
                        }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(0,0,0,0.3)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '18px'
                        }}
                      >
                        {favorites.includes(recipe.id) ? '❤️' : '🤍'}
                      </button>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '16px', 
                        fontWeight: 600,
                        color: '#e0e0e0'
                      }}>
                        {recipe.title}
                      </h3>
                      <div style={{ 
                        display: 'flex', 
                        gap: '16px', 
                        fontSize: '13px', 
                        color: '#9090a4'
                      }}>
                        <span>⏱️ {recipe.readyInMinutes}分钟</span>
                        <span>👥 {recipe.servings}人份</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#9090a4'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <div>加载中...</div>
            </div>
          ) : selectedRecipe && (
            <div>
              {/* Recipe Header */}
              <div style={{
                height: '200px',
                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '80px',
                position: 'relative'
              }}>
                {selectedRecipe.image}
                <button
                  onClick={() => toggleFavorite(selectedRecipe.id)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(0,0,0,0.3)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '24px'
                  }}
                >
                  {favorites.includes(selectedRecipe.id) ? '❤️' : '🤍'}
                </button>
              </div>

              <div style={{ padding: '24px' }}>
                <h1 style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '24px', 
                  fontWeight: 700,
                  color: '#e0e0e0'
                }}>
                  {selectedRecipe.title}
                </h1>

                {/* Quick Info */}
                <div style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  marginBottom: '24px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    background: 'rgba(231, 76, 60, 0.1)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#e74c3c'
                  }}>
                    ⏱️ {selectedRecipe.readyInMinutes} 分钟
                  </div>
                  <div style={{
                    background: 'rgba(46, 204, 113, 0.1)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#2ecc71'
                  }}>
                    👥 {selectedRecipe.servings} 人份
                  </div>
                </div>

                {/* Tags */}
                {selectedRecipe.cuisines.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '14px', 
                      color: '#9090a4',
                      fontWeight: 600
                    }}>
                      菜系
                    </h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedRecipe.cuisines.map((cuisine, i) => (
                        <span
                          key={i}
                          style={{
                            background: '#2d2d3e',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            color: '#9090a4'
                          }}
                        >
                          {cuisine}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '16px', 
                    color: '#e0e0e0',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>📝</span> 简介
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    color: '#a0a0c4',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}>
                    {selectedRecipe.summary}
                  </p>
                </div>

                {/* Ingredients */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '16px', 
                    color: '#e0e0e0',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>🥗</span> 食材
                  </h3>
                  <div style={{ 
                    background: '#252536',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid #3a3a5c'
                  }}>
                    <ul style={{ 
                      listStyle: 'none', 
                      padding: 0, 
                      margin: 0 
                    }}>
                      {selectedRecipe.ingredients.map((ingredient, i) => (
                        <li 
                          key={i}
                          style={{ 
                            padding: '8px 0', 
                            borderBottom: i < selectedRecipe.ingredients.length - 1 ? '1px solid #3a3a5c' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: '#c0c0d4'
                          }}
                        >
                          <span style={{ 
                            width: '8px', 
                            height: '8px', 
                            background: '#e74c3c', 
                            borderRadius: '50%' 
                          }} />
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Instructions */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '16px', 
                    color: '#e0e0e0',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>👨‍🍳</span> 步骤
                  </h3>
                  <div style={{ 
                    background: '#252536',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #3a3a5c'
                  }}>
                    <div style={{ whiteSpace: 'pre-line', color: '#c0c0d4', lineHeight: '2' }}>
                      {selectedRecipe.instructions}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
