import { useState, useEffect, useCallback } from 'react'

interface PetState {
  hunger: number
  happiness: number
  energy: number
  experience: number
  level: number
}

const Pet = () => {
  const [pet, setPet] = useState<PetState>({
    hunger: 80,
    happiness: 70,
    energy: 90,
    experience: 0,
    level: 1
  })

  const [petType, setPetType] = useState<'cat' | 'dog' | 'bunny'>('cat')
  const [petName, setPetName] = useState('Pixel')
  const [lastUpdated, setLastUpdated] = useState(Date.now())

  useEffect(() => {
    const saved = localStorage.getItem('web-linux-pet')
    if (saved) {
      const data = JSON.parse(saved)
      setPet(data.pet)
      setPetType(data.petType || 'cat')
      setPetName(data.petName || 'Pixel')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('web-linux-pet', JSON.stringify({ pet, petType, petName }))
  }, [pet, petType, petName])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const timePassed = (now - lastUpdated) / 1000 / 60
      if (timePassed >= 1) {
        setPet(prev => ({
          ...prev,
          hunger: Math.max(0, prev.hunger - 1),
          happiness: Math.max(0, prev.happiness - 0.5),
          energy: Math.min(100, prev.energy + 0.5)
        }))
        setLastUpdated(now)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [lastUpdated])

  const feed = useCallback(() => {
    setPet(prev => ({
      ...prev,
      hunger: Math.min(100, prev.hunger + 20),
      experience: prev.experience + 5
    }))
  }, [])

  const play = useCallback(() => {
    if (pet.energy < 10) return
    setPet(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 15),
      energy: Math.max(0, prev.energy - 10),
      experience: prev.experience + 10
    }))
  }, [pet.energy])

  const sleep = useCallback(() => {
    setPet(prev => ({
      ...prev,
      energy: 100,
      experience: prev.experience + 3
    }))
  }, [])

  const checkLevelUp = useCallback(() => {
    const expNeeded = pet.level * 100
    if (pet.experience >= expNeeded) {
      setPet(prev => ({
        ...prev,
        level: prev.level + 1,
        experience: prev.experience - expNeeded
      }))
    }
  }, [pet.experience, pet.level])

  useEffect(() => {
    checkLevelUp()
  }, [pet.experience, checkLevelUp])

  const getMood = () => {
    const avg = (pet.hunger + pet.happiness + pet.energy) / 3
    if (avg > 80) return '😊'
    if (avg > 60) return '🙂'
    if (avg > 40) return '😐'
    if (avg > 20) return '😟'
    return '😢'
  }

  const getPetEmoji = () => {
    switch (petType) {
      case 'cat': return '🐱'
      case 'dog': return '🐶'
      case 'bunny': return '🐰'
    }
  }

  return (
    <div className="p-4 h-full flex flex-col gap-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        {getPetEmoji()} {petName} (Level {pet.level})
      </h2>

      <div className="text-center text-8xl py-8 animate-bounce">
        {getMood()}
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>🍖 Hunger</span>
            <span>{Math.round(pet.hunger)}%</span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-500"
              style={{ 
                width: `${pet.hunger}%`,
                backgroundColor: pet.hunger < 30 ? '#ef4444' : pet.hunger < 60 ? '#f59e0b' : '#22c55e'
              }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>❤️ Happiness</span>
            <span>{Math.round(pet.happiness)}%</span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-500"
              style={{ 
                width: `${pet.happiness}%`,
                backgroundColor: pet.happiness < 30 ? '#ef4444' : pet.happiness < 60 ? '#f59e0b' : '#22c55e'
              }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>⚡ Energy</span>
            <span>{Math.round(pet.energy)}%</span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-500"
              style={{ 
                width: `${pet.energy}%`,
                backgroundColor: pet.energy < 30 ? '#ef4444' : pet.energy < 60 ? '#f59e0b' : '#22c55e'
              }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>✨ Experience</span>
            <span>{pet.experience}/{pet.level * 100}</span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${(pet.experience / (pet.level * 100)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-auto">
        <button 
          onClick={feed}
          className="p-3 bg-green-600 hover:bg-green-500 rounded-lg transition-colors flex flex-col items-center gap-1"
        >
          <span className="text-2xl">🍖</span>
          <span className="text-sm">Feed</span>
        </button>
        
        <button 
          onClick={play}
          disabled={pet.energy < 10}
          className="p-3 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex flex-col items-center gap-1"
        >
          <span className="text-2xl">🎾</span>
          <span className="text-sm">Play</span>
        </button>
        
        <button 
          onClick={sleep}
          className="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex flex-col items-center gap-1"
        >
          <span className="text-2xl">💤</span>
          <span className="text-sm">Sleep</span>
        </button>
      </div>

      <div className="flex gap-2 justify-center">
        <button 
          onClick={() => setPetType('cat')}
          className={`px-3 py-1 rounded-full text-sm ${petType === 'cat' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          🐱 Cat
        </button>
        <button 
          onClick={() => setPetType('dog')}
          className={`px-3 py-1 rounded-full text-sm ${petType === 'dog' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          🐶 Dog
        </button>
        <button 
          onClick={() => setPetType('bunny')}
          className={`px-3 py-1 rounded-full text-sm ${petType === 'bunny' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          🐰 Bunny
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
          placeholder="Pet name"
        />
      </div>
    </div>
  )
}

export default Pet
