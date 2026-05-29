import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

function RootApp() {
  useEffect(() => {
    const preload = document.getElementById('preload')
    if (preload) {
      setTimeout(() => {
        preload.style.opacity = '0'
        preload.style.transition = 'opacity 0.5s ease'
        setTimeout(() => {
          preload.remove()
        }, 500)
      }, 100)
    }
  }, [])

  return (
    <StrictMode>
      <App />
    </StrictMode>
  )
}

createRoot(document.getElementById('root')!).render(<RootApp />)
