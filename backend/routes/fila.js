const express = require('express');
const db = require('../models/database');
const { validateQuery } = require('../validators/validators');

const router = express.Router();

// Função para calcular distância entre dois pontos
const calculateDistance = (pos1, pos2) => {
return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
};

// Função para calcular tempo de entrega estimado
const calculateDeliveryTime = (drone, order) => {
const distance = calculateDistance(drone.position, { x: order.x, y: order.y });
const flightTime = distance * 2; // 2 minutos por km
const batteryFactor = drone.battery > 50 ? 1 : 1.5; // Mais lento com bateria baixa
return flightTime * batteryFactor;
};

// Função para encontrar o melhor drone para um pedido
const findBestDrone = (order) => {
const availableDrones = db.getDrones().filter(drone => 
  drone.status === 'idle' && 
  drone.battery > 20 &&
  drone.currentLoad + order.weight <= drone.capacity
);

if (availableDrones.length === 0) return null;

return availableDrones.reduce((best, drone) => {
  const currentTime = calculateDeliveryTime(drone, order);
  const bestTime = best ? calculateDeliveryTime(best, order) : Infinity;
  return currentTime < bestTime ? drone : best;
}, null);
};

router.get('/', validateQuery, (req, res) => {
try {
  const { page, limit, sortBy, sortOrder } = req.queryParams;
  const fila = db.getFila();
  const filaCompleta = fila.map((pedido, index) => {
    const bestDrone = findBestDrone(pedido);
    const estimatedTime = bestDrone ? calculateDeliveryTime(bestDrone, pedido) : null;
    return {
      ...pedido,
      position: index + 1,
      recommendedDrone: bestDrone ? {
        id: bestDrone.id,
        name: bestDrone.name,
        battery: bestDrone.battery,
        capacity: bestDrone.capacity,
        currentLoad: bestDrone.currentLoad
      } : null,
      estimatedDeliveryTime: estimatedTime,
      canBeAssigned: bestDrone !== null
    };
  });
  
  filaCompleta.sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedFila = filaCompleta.slice(startIndex, endIndex);
  res.json({
    success: true,
    data: paginatedFila,
    pagination: {
      page,
      limit,
      total: filaCompleta.length,
      pages: Math.ceil(filaCompleta.length / limit)
    },
    summary: {
      total: filaCompleta.length,
      assignable: filaCompleta.filter(p => p.canBeAssigned).length,
      unassignable: filaCompleta.filter(p => !p.canBeAssigned).length
    }
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao buscar fila de pedidos',
    message: error.message
  });
}
});

router.post('/process', (req, res) => {
try {
  const fila = db.getFila();
  if (fila.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Fila vazia',
      message: 'Não há pedidos na fila para processar'
    });
  }
  const pedido = fila[0];
  const drone = findBestDrone(pedido);
  if (!drone) {
    return res.status(400).json({
      success: false,
      error: 'Nenhum drone disponível',
      message: 'Não há drones disponíveis para processar este pedido'
    });
  }
  const pedidoAtualizado = db.updatePedido(pedido.id, {
    status: 'assigned',
    assignedTo: drone.id,
    assignedAt: new Date().toISOString()
  });
  const droneAtualizado = db.updateDrone(drone.id, {
    status: 'flying',
    assignedOrders: [...drone.assignedOrders, pedido.id],
    currentLoad: drone.currentLoad + pedido.weight
  });
  const entrega = db.createEntrega({
    pedidoId: pedido.id,
    droneId: drone.id,
    estimatedTime: calculateDeliveryTime(drone, pedido),
    distance: calculateDistance(drone.position, { x: pedido.x, y: pedido.y }),
    status: 'pending'
  });
  res.json({
    success: true,
    message: 'Pedido processado com sucesso',
    data: {
      pedido: pedidoAtualizado,
      drone: droneAtualizado,
      entrega: entrega
    }
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao processar pedido da fila',
    message: error.message
  });
}
});

router.post('/process-all', (req, res) => {
try {
  const fila = db.getFila();
  const processed = [];
  const failed = [];
  for (const pedido of fila) {
    const drone = findBestDrone(pedido);
    if (drone) {
      const pedidoAtualizado = db.updatePedido(pedido.id, {
        status: 'assigned',
        assignedTo: drone.id,
        assignedAt: new Date().toISOString()
      });
      const droneAtualizado = db.updateDrone(drone.id, {
        status: 'flying',
        assignedOrders: [...drone.assignedOrders, pedido.id],
        currentLoad: drone.currentLoad + pedido.weight
      });
      const entrega = db.createEntrega({
        pedidoId: pedido.id,
        droneId: drone.id,
        estimatedTime: calculateDeliveryTime(drone, pedido),
        distance: calculateDistance(drone.position, { x: pedido.x, y: pedido.y }),
        status: 'pending'
      });
      processed.push({
        pedido: pedidoAtualizado,
        drone: droneAtualizado,
        entrega: entrega
      });
    } else {
      failed.push({
        pedido: pedido,
        reason: 'Nenhum drone disponível'
      });
    }
  }
  res.json({
    success: true,
    message: `Processamento concluído: ${processed.length} processados, ${failed.length} falharam`,
    data: {
      processed,
      failed,
      summary: {
        total: fila.length,
        processed: processed.length,
        failed: failed.length
      }
    }
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao processar fila',
    message: error.message
  });
}
});

router.get('/stats', (req, res) => {
try {
  const fila = db.getFila();
  const drones = db.getDrones();
  const stats = {
    fila: {
      total: fila.length,
      byPriority: {
        alta: fila.filter(p => p.priority === 1).length,
        media: fila.filter(p => p.priority === 2).length,
        baixa: fila.filter(p => p.priority === 3).length
      },
      byWeight: {
        leve: fila.filter(p => p.weight <= 5).length,
        medio: fila.filter(p => p.weight > 5 && p.weight <= 15).length,
        pesado: fila.filter(p => p.weight > 15).length
      }
    },
    drones: {
      total: drones.length,
      disponiveis: drones.filter(d => d.status === 'idle' && d.battery > 20).length,
      emUso: drones.filter(d => d.status === 'flying' || d.status === 'delivering').length,
      carregando: drones.filter(d => d.status === 'charging').length,
      bateriaBaixa: drones.filter(d => d.status === 'low_battery').length
    },
    capacidade: {
      totalCapacidade: drones.reduce((sum, d) => sum + d.capacity, 0),
      capacidadeUsada: drones.reduce((sum, d) => sum + d.currentLoad, 0),
      pesoPendente: fila.reduce((sum, p) => sum + p.weight, 0)
    }
  };
  
  res.json({
    success: true,
    data: stats
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao buscar estatísticas da fila',
    message: error.message
  });
}
});

router.get('/priority/:priority', validateQuery, (req, res) => {
try {
  const { priority } = req.params;
  const { page, limit, sortBy, sortOrder } = req.queryParams;
  const fila = db.getFila().filter(p => p.priority === parseInt(priority));
  const filaCompleta = fila.map((pedido, index) => {
    const bestDrone = findBestDrone(pedido);
    const estimatedTime = bestDrone ? calculateDeliveryTime(bestDrone, pedido) : null;
    return {
      ...pedido,
      position: index + 1,
      recommendedDrone: bestDrone ? {
        id: bestDrone.id,
        name: bestDrone.name,
        battery: bestDrone.battery
      } : null,
      estimatedDeliveryTime: estimatedTime,
      canBeAssigned: bestDrone !== null
    };
  });
  filaCompleta.sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedFila = filaCompleta.slice(startIndex, endIndex);
  res.json({
    success: true,
    data: paginatedFila,
    pagination: {
      page,
      limit,
      total: filaCompleta.length,
      pages: Math.ceil(filaCompleta.length / limit)
    }
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao buscar pedidos por prioridade',
    message: error.message
  });
}
});

module.exports = router;
