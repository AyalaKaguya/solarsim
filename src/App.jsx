import { useEffect, useRef } from 'react'
import { GameEngine } from './game/engine.js'

function App() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    const engine = new GameEngine(containerRef.current)
    return () => {
      engine.stage.destroy()
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
