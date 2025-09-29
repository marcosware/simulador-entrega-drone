import { useState } from 'react'
import './App.css'
import GenerateCoords from './GenerateCoords'
import Pedidos from './Pedidos'
import Drones from './Drones'
import AllocationAlgorithm from './AllocationAlgorithm'

function App() {
const [gridSize, setGridSize] = useState(5)
const [orders, setOrders] = useState([])
const [drones, setDrones] = useState([])
const [activeTab, setActiveTab] = useState('map')

const tabs = [
  { id: 'map', label: 'Mapa', icon: '🗺️' },
  { id: 'orders', label: 'Pedidos', icon: '📦' },
  { id: 'drones', label: 'Drones', icon: '🚁' },
  { id: 'allocation', label: 'Alocação', icon: '⚡' }
]

const renderActiveTab = () => {
  switch(activeTab) {
    case 'map':
      return <GenerateCoords max={gridSize} orders={orders} drones={drones} />
    case 'orders':
      return <Pedidos orders={orders} setOrders={setOrders} gridSize={gridSize} />
    case 'drones':
      return <Drones drones={drones} setDrones={setDrones} orders={orders} setOrders={setOrders} />
    case 'allocation':
      return <AllocationAlgorithm orders={orders} drones={drones} setOrders={setOrders} setDrones={setDrones} />
    default:
      return <GenerateCoords max={gridSize} />
  }
}

return (
  <div className="app">
    <header className="app-header">
      <h1>🚁 Simulador de Entregas por Drones</h1>
      <p>Sistema de logística urbana com otimização de rotas</p>
    </header>
    <div className="app-controls">
      <div className="grid-size-control">
        <label htmlFor="grid-size">Tamanho da Malha:</label>
        <select 
          id="grid-size"
          value={gridSize} 
          onChange={(e) => setGridSize(parseInt(e.target.value))}
        >
          <option value={3}>3x3</option>
          <option value={4}>4x4</option>
          <option value={5}>5x5</option>
          <option value={6}>6x6</option>
          <option value={7}>7x7</option>
          <option value={8}>8x8</option>
        </select>
      </div>
      <div className="system-stats">
        <div className="stat">
          <span className="stat-label">Pedidos:</span>
          <span className="stat-value">{orders.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Drones:</span>
          <span className="stat-value">{drones.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Pendentes:</span>
          <span className="stat-value">{orders.filter(o => o.status === 'pending').length}</span>
        </div>
      </div>
    </div>
    <nav className="app-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
    <main className="app-main">
      {renderActiveTab()}
    </main>
    <footer className="app-footer">
      <p>Desenvolvido como teste técnico da dti digital.</p>
    </footer>
  </div>
)
}

export default App
