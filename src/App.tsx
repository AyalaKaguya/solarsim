import { useEffect, useRef } from 'react'
import { GameEngine } from './game/engine'

function App() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const engine = new GameEngine(containerRef.current)
    return () => {
      engine.destroy()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100vw', height: '100vh', background: '#000' }}
    />
  )
}

export default App
