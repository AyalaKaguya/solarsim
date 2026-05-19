import './index.css'
import { GameEngine } from './game/engine'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

rootElement.style.width = '100vw'
rootElement.style.height = '100vh'
rootElement.style.background = '#000'

const engine = new GameEngine(rootElement as HTMLDivElement)

export default engine
