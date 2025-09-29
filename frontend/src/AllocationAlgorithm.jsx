import { useState } from 'react'
import './AllocationAlgorithm.css'

function AllocationAlgorithm({ orders, drones, setOrders, setDrones }) {
const [isRunning, setIsRunning] = useState(false)
const [allocationLog, setAllocationLog] = useState([])

const calculateDistance = (pos1, pos2) => {
return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2))
}

const calculateEfficiency = (drone, order) => {
const distance = calculateDistance(drone.position, { x: order.x, y: order.y })
const weightRatio = order.weight / drone.capacity
const distanceRatio = distance / drone.range
const priorityWeight = 4 - order.priority
return (weightRatio * 0.4) + (distanceRatio * 0.3) + (priorityWeight * 0.3)
}

const canCarryOrder = (drone, order) => {
const distance = calculateDistance(drone.position, { x: order.x, y: order.y })
return drone.currentLoad + order.weight <= drone.capacity && distance <= drone.currentRange
}

const assignOrderToDrone = (droneId, orderId) => {
const drone = drones.find(d => d.id === droneId)
const order = orders.find(o => o.id === orderId)
if (!drone || !order) return false
const updatedDrone = {
  ...drone,
  currentLoad: drone.currentLoad + order.weight,
  assignedOrders: [...drone.assignedOrders, orderId],
  status: 'flying'
}
const updatedOrder = {
  ...order,
  status: 'assigned'
}
setDrones(prev => prev.map(d => d.id === droneId ? updatedDrone : d))
setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o))
return true
}

function runAllocationAlgorithm() {
const log = []
log.push('🚀 Iniciando algoritmo de alocação...')
setAllocationLog([...log])

setOrders(prevOrders => {
let updatedOrders = [...prevOrders]
const pendingOrders = updatedOrders.filter(order => order.status === 'pending')
log.push(`📦 Encontrados ${pendingOrders.length} pedidos pendentes`)
setAllocationLog([...log])
let availableDrones = [...drones].filter(
  drone => drone.status === 'idle' || drone.status === 'flying'
)
log.push(`🚁 Encontrados ${availableDrones.length} drones disponíveis`)
setAllocationLog([...log])

if (availableDrones.length === 0) {
  log.push('❌ Nenhum drone disponível para alocação')
  setAllocationLog([...log])
setIsRunning(false)
return }

availableDrones.sort((a, b) => {
  if (a.status === b.status) return 0
  return a.status === 'idle' ? -1 : 1
})

pendingOrders.forEach(order => {
  for (let i = 0; i < availableDrones.length; i++) {
    const drone = availableDrones[i]

    if (canCarryOrder(drone, order)) {
      const updatedDrone = {
        ...drone,
        currentLoad: drone.currentLoad + order.weight,
        assignedOrders: [...drone.assignedOrders, order.id],
        status: 'flying'
      }
      availableDrones[i] = updatedDrone
      setDrones(prev =>
        prev.map(d => (d.id === updatedDrone.id ? updatedDrone : d))
      )
      updatedOrders = updatedOrders.map(o =>
        o.id === order.id ? { ...o, status: 'assigned', droneId: updatedDrone.id } : o
      )
      log.push(`📦 Pedido ${order.id} alocado ao Drone ${updatedDrone.id}`)
      break
    }
  }
})

return updatedOrders
})
}


const clearLog = () => {
setAllocationLog([])
}

const getPendingOrdersCount = () => {
return orders.filter(order => order.status === 'pending').length
}

const getAvailableDronesCount = () => {
return drones.filter(drone => drone.status === 'idle').length
}

return (
<div className="allocation-container">
  <h2>Algoritmo de Alocação Automática</h2>
  <div className="allocation-stats">
    <div className="stat-card">
      <h3>Pedidos Pendentes</h3>
      <span className="stat-number">{getPendingOrdersCount()}</span>
    </div>
    <div className="stat-card">
      <h3>Drones Disponíveis</h3>
      <span className="stat-number">{getAvailableDronesCount()}</span>
    </div>
    <div className="stat-card">
      <h3>Total de Drones</h3>
      <span className="stat-number">{drones.length}</span>
    </div>
  </div>
  <div className="allocation-controls">
    <button 
      onClick={runAllocationAlgorithm}
      disabled={isRunning || getPendingOrdersCount() === 0 || getAvailableDronesCount() === 0}
      className="run-algorithm-btn"
    >
      {isRunning ? 'Executando...' : 'Executar Algoritmo'}
    </button>
    <button 
      onClick={clearLog}
      disabled={allocationLog.length === 0}
      className="clear-log-btn"
    >
      Limpar Log
    </button>
  </div>
  <div className="algorithm-info">
    <h3>Como Funciona o Algoritmo:</h3>
    <ul>
      <li><strong>Prioridade:</strong> Pedidos de alta prioridade são processados primeiro</li>
      <li><strong>Eficiência:</strong> Calcula a melhor combinação drone-pedido baseada em peso, distância e prioridade</li>
      <li><strong>Capacidade:</strong> Respeita a capacidade máxima de carga de cada drone</li>
      <li><strong>Alcance:</strong> Considera o alcance máximo de cada drone</li>
      <li><strong>Otimização:</strong> Minimiza o número total de viagens necessárias</li>
    </ul>
  </div>
  {allocationLog.length > 0 && (
    <div className="allocation-log">
      <h3>Log de Execução:</h3>
      <div className="log-content">
        {allocationLog.map((entry, index) => (
          <div key={index} className={`log-entry ${entry.includes('✅') ? 'success' : entry.includes('❌') ? 'error' : entry.includes('📊') ? 'summary' : 'info'}`}>
            {entry}
          </div>
        ))}
      </div>
    </div>
  )}
</div>
)
}

export default AllocationAlgorithm
