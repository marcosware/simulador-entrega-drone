import { useState } from 'react'
import './Pedidos.css'

function Pedidos({ orders, setOrders, gridSize }) {
const [formData, setFormData] = useState({
x: '',
y: '',
weight: '',
priority: '2'
})

const handleInputChange = (e) => {
const { name, value } = e.target
setFormData(prev => ({
  ...prev,
  [name]: value
}))
}

const handleSubmit = (e) => {
e.preventDefault()
if (!formData.x || !formData.y || !formData.weight) {
  alert('Por favor, preencha todos os campos obrigatórios')
  return
}
const x = parseInt(formData.x)
const y = parseInt(formData.y)
const weight = parseFloat(formData.weight)
if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
  alert(`Coordenadas devem estar entre (0,0) e (${gridSize-1},${gridSize-1})`)
  return
}
if (weight <= 0) {
  alert('Peso deve ser maior que zero')
  return
}
const newOrder = {
  id: Date.now(),
  x: x,
  y: y,
  weight: weight,
  priority: parseInt(formData.priority),
  status: 'pending',
  createdAt: new Date().toISOString()
}
setOrders(prev => [...prev, newOrder])
setFormData({
  x: '',
  y: '',
  weight: '',
  priority: '2'
})
alert('Pedido adicionado com sucesso!')
}

const removeOrder = (orderId) => {
setOrders(prev => prev.filter(order => order.id !== orderId))
}

const getPriorityText = (priority) => {
switch(priority) {
  case 1: return 'Alta'
  case 2: return 'Média'
  case 3: return 'Baixa'
  default: return 'Média'
}
}

const getStatusText = (status) => {
switch(status) {
  case 'pending': return 'Pendente'
  case 'assigned': return 'Atribuído'
  case 'delivered': return 'Entregue'
  default: return 'Pendente'
}
}

return (
<div className="pedidos-container">
  <h2>Sistema de Pedidos</h2>
  <form onSubmit={handleSubmit} className="order-form">
    <div className="form-group">
      <label htmlFor="x">Coordenada X (0-{gridSize-1})</label>
      <input 
        name="x" 
        type="number" 
        value={formData.x}
        onChange={handleInputChange}
        min="0" 
        max={gridSize-1}
        required
      />
    </div>
    <div className="form-group">
      <label htmlFor="y">Coordenada Y (0-{gridSize-1})</label>
      <input 
        name="y" 
        type="number" 
        value={formData.y}
        onChange={handleInputChange}
        min="0" 
        max={gridSize-1}
        required
      />
    </div>
    <div className="form-group">
      <label htmlFor="weight">Peso (kg)</label>
      <input 
        name="weight" 
        type="number" 
        step="0.1"
        value={formData.weight}
        onChange={handleInputChange}
        min="0.1"
        required
      />
    </div>
    <div className="form-group">
      <label htmlFor="priority">Prioridade</label>
      <select 
        name="priority" 
        value={formData.priority}
        onChange={handleInputChange}
      >
        <option value="1">Alta</option>
        <option value="2">Média</option>
        <option value="3">Baixa</option>
      </select>
    </div>
    <button type="submit" className="submit-btn">Adicionar Pedido</button>
  </form>
  <div className="orders-list">
    <h3>Pedidos ({orders.length})</h3>
    {orders.length === 0 ? (
      <p>Nenhum pedido cadastrado</p>
    ) : (
      <div className="orders-grid">
        {orders.map(order => (
          <div key={order.id} className={`order-card priority-${order.priority}`}>
            <div className="order-header">
              <span className="order-id">#{order.id}</span>
              <button 
                onClick={() => removeOrder(order.id)}
                className="remove-btn"
                disabled={order.status === 'assigned'}
              >
                ×
              </button>
            </div>
            <div className="order-details">
              <p><strong>Localização:</strong> ({order.x}, {order.y})</p>
              <p><strong>Peso:</strong> {order.weight}kg</p>
              <p><strong>Prioridade:</strong> {getPriorityText(order.priority)}</p>
              <p><strong>Status:</strong> {getStatusText(order.status)}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
)
}

export default Pedidos
