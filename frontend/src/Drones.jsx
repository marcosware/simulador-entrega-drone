import { useState } from 'react'
import './Drones.css'

function Drones({ drones, setDrones, orders, setOrders }) {
const [droneConfig, setDroneConfig] = useState({
capacity: '',
range: '',
name: ''
})

const handleInputChange = (e) => {
const { name, value } = e.target
setDroneConfig(prev => ({
  ...prev,
  [name]: value
}))
}

const addDrone = (e) => {
e.preventDefault()

if (!droneConfig.capacity || !droneConfig.range || !droneConfig.name) {
  alert('Por favor, preencha todos os campos')
  return
}
const capacity = parseFloat(droneConfig.capacity)
const range = parseFloat(droneConfig.range)
if (capacity <= 0 || range <= 0) {
  alert('Capacidade e alcance devem ser maiores que zero')
  return
}
const newDrone = {
  id: Date.now(),
  name: droneConfig.name,
  capacity: capacity,
  range: range,
  currentLoad: 0,
  currentRange: range,
  position: { x: 0, y: 0 },
  status: 'idle',
  assignedOrders: [],
  totalDeliveries: 0
}
setDrones(prev => [...prev, newDrone])
setDroneConfig({
  capacity: '',
  range: '',
  name: ''
})
alert('Drone adicionado com sucesso!')
}

const removeDrone = (droneId) => {
const drone = drones.find(d => d.id === droneId)
if (drone && drone.status !== 'idle') {
  alert('Não é possível remover um drone que está em voo')
  return
}
setDrones(prev => prev.filter(drone => drone.id !== droneId))
}

const calculateDistance = (pos1, pos2) => {
return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2))
}

const canCarryOrder = (drone, order) => {
const distance = calculateDistance(drone.position, { x: order.x, y: order.y })
return drone.currentLoad + order.weight <= drone.capacity && 
        distance <= drone.currentRange
}

const assignOrderToDrone = (droneId, orderId) => {
setDrones(prevDrones => {
  const drone = prevDrones.find(d => d.id === droneId)
  const order = orders.find(o => o.id === orderId)
  if (!drone || !order) return prevDrones
  if (!canCarryOrder(drone, order)) {
    alert('Drone não pode carregar este pedido (capacidade ou alcance insuficiente)')
    return prevDrones
  }
  if (order.status !== 'pending') {
    alert('Pedido já foi atribuído ou entregue')
    return prevDrones
  }
  setOrders(prevOrders => prevOrders.map(o => 
    o.id === orderId ? { ...o, status: 'assigned' } : o
  ))
  return prevDrones.map(d => {
    if (d.id !== droneId) return d
    return {
      ...d,
      currentLoad: d.currentLoad + order.weight,
      assignedOrders: [...d.assignedOrders, orderId],
      status: 'flying'
    }
  })
})
}

const deliverOrder = (droneId, orderId) => {
setDrones(prevDrones => {
  return prevDrones.map(drone => {
    if (drone.id !== droneId) return drone
    const order = orders.find(o => o.id === orderId)
    if (!order) return drone
    const distance = calculateDistance(drone.position, { x: order.x, y: order.y })
    const remainingOrders = drone.assignedOrders.filter(id => id !== orderId)
    return {
      ...drone,
      currentLoad: drone.currentLoad - order.weight,
      currentRange: drone.currentRange - distance,
      assignedOrders: remainingOrders,
      position: { x: order.x, y: order.y },
      totalDeliveries: drone.totalDeliveries + 1,
      status: remainingOrders.length === 0 ? 'idle' : 'flying'
    }
  })
})
setOrders(prevOrders =>
  prevOrders.map(o =>
    o.id === orderId ? { ...o, status: 'delivered' } : o
  )
)
}

const getStatusText = (status) => {
switch(status) {
  case 'idle': return 'Disponível'
  case 'flying': return 'Em voo'
  case 'delivering': return 'Entregando'
  default: return 'Desconhecido'
}
}

const getStatusClass = (status) => {
switch(status) {
  case 'idle': return 'status-idle'
  case 'flying': return 'status-flying'
  case 'delivering': return 'status-delivering'
  default: return 'status-unknown'
}
}

return (
<div className="drones-container">
  <h2>Sistema de Drones</h2>
  <form onSubmit={addDrone} className="drone-form">
    <div className="form-group">
      <label htmlFor="name">Nome do Drone</label>
      <input 
        name="name" 
        type="text" 
        value={droneConfig.name}
        onChange={handleInputChange}
        placeholder="Ex: Drone-001"
        required
      />
    </div>
    <div className="form-group">
      <label htmlFor="capacity">Capacidade (kg)</label>
      <input 
        name="capacity" 
        type="number" 
        step="0.1"
        value={droneConfig.capacity}
        onChange={handleInputChange}
        min="0.1"
        required
      />
    </div>
    <div className="form-group">
      <label htmlFor="range">Alcance (km)</label>
      <input 
        name="range" 
        type="number" 
        step="0.1"
        value={droneConfig.range}
        onChange={handleInputChange}
        min="0.1"
        required
      />
    </div>
    <button type="submit" className="submit-btn">Adicionar Drone</button>
  </form>
  <div className="drones-list">
    <h3>Frota de Drones ({drones.length})</h3>
    {drones.length === 0 ? (
      <p>Nenhum drone cadastrado</p>
    ) : (
      <div className="drones-grid">
        {drones.map(drone => (
          <div key={drone.id} className="drone-card">
            <div className="drone-header">
              <h4>{drone.name}</h4>
              <button 
                onClick={() => removeDrone(drone.id)}
                className="remove-btn"
                disabled={drone.status !== 'idle'}
              >
                ×
              </button>
            </div>
            <div className="drone-details">
              <p><strong>Status:</strong> <span className={getStatusClass(drone.status)}>{getStatusText(drone.status)}</span></p>
              <p><strong>Capacidade:</strong> {drone.capacity}kg</p>
              <p><strong>Alcance:</strong> {drone.range}km</p>
              <p><strong>Carga Atual:</strong> {drone.currentLoad.toFixed(1)}kg / {drone.capacity}kg</p>
              <p><strong>Alcance Restante:</strong> {drone.currentRange.toFixed(1)}km</p>
              <p><strong>Posição:</strong> ({drone.position.x}, {drone.position.y})</p>
              <p><strong>Entregas:</strong> {drone.totalDeliveries}</p>
            </div>
            {drone.assignedOrders.length > 0 && (
              <div className="assigned-orders">
                <h5>Pedidos Atribuídos:</h5>
                {drone.assignedOrders.map(orderId => {
                  const order = orders.find(o => o.id === orderId)
                  return order ? (
                    <div key={orderId} className="assigned-order">
                      <span>Pedido #{orderId} - {order.weight}kg - ({order.x}, {order.y})</span>
                      <button 
                        onClick={() => deliverOrder(drone.id, orderId)}
                        className="deliver-btn"
                      >
                        Entregar
                      </button>
                    </div>
                  ) : null
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
</div>
)
}

export default Drones
