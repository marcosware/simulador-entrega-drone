import { useState } from 'react'
import './GenerateCoords.css'

function GenerateCoords ({ max = 5, orders = [], drones = [] }) {
const y_coords = [];
const x_coords = [];

for(let i = 0; i < max; i++) y_coords.push({y: i});
for(let j = 0; j < max; j++) x_coords.push({x: j});

const getCellContent = (x, y) => {
  const cellOrders = orders.filter(order => order.x === x && order.y === y)
  const cellDrones = drones.filter(drone => drone.position.x === x && drone.position.y === y)
  
  return (
    <div className="cell-content">
      <div className="coordinates">({x}, {y})</div>
      {cellOrders.length > 0 && (
        <div className="orders-in-cell">
          {cellOrders.map(order => (
            <div 
              key={order.id} 
              className={`order-marker priority-${order.priority} status-${order.status}`}
              title={`Pedido #${order.id} - ${order.weight}kg - Prioridade ${order.priority}`}
            >
              📦
            </div>
          ))}
        </div>
      )}
      {cellDrones.length > 0 && (
        <div className="drones-in-cell">
          {cellDrones.map(drone => (
            <div 
              key={drone.id} 
              className={`drone-marker status-${drone.status}`}
              title={`${drone.name} - ${drone.currentLoad}/${drone.capacity}kg`}
            >
              🚁
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const getCellClass = (x, y) => {
  const hasOrders = orders.some(order => order.x === x && order.y === y)
  const hasDrones = drones.some(drone => drone.position.x === x && drone.position.y === y)
  
  let classes = 'coords-cell'
  if (hasOrders) classes += ' has-orders'
  if (hasDrones) classes += ' has-drones'
  
  return classes
}

return (
  <div className="map-container">
    <div className="map-legend">
      <h3>Mapa da Cidade</h3>
      <div className="legend-items">
        <div className="legend-item">
          <span className="legend-marker order-marker priority-1">📦</span>
          <span>Pedido Alta Prioridade</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker order-marker priority-2">📦</span>
          <span>Pedido Média Prioridade</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker order-marker priority-3">📦</span>
          <span>Pedido Baixa Prioridade</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker drone-marker status-idle">🚁</span>
          <span>Drone Disponível</span>
        </div>
        <div className="legend-item">
          <span className="legend-marker drone-marker status-flying">🚁</span>
          <span>Drone Em Voo</span>
        </div>
      </div>
    </div>
    
    <table id="coords-table">
      <tbody>
        {y_coords.map((yc) => (
          <tr key={yc.y}>
            {x_coords.map((xc) => (
              <td key={`${xc.x}-${yc.y}`} className={getCellClass(xc.x, yc.y)}>
                {getCellContent(xc.x, yc.y)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
};

export default GenerateCoords;