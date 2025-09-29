const express = require('express');
const db = require('../models/database');
const { validateQuery } = require('../validators/validators');

const router = express.Router();

const calculateDistance = (pos1, pos2) => {
return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
};

const calculateOptimizedRoute = (drone, pedidos) => {
if (pedidos.length === 0) return [];

const route = [];
let currentPosition = drone.position;
let remainingCapacity = drone.capacity - drone.currentLoad;
let remainingRange = drone.currentRange;
const unvisitedPedidos = [...pedidos];

while (unvisitedPedidos.length > 0 && remainingCapacity > 0 && remainingRange > 0) {
  let bestPedido = null;
  let bestDistance = Infinity;
  let bestIndex = -1;
  
  for (let i = 0; i < unvisitedPedidos.length; i++) {
    const pedido = unvisitedPedidos[i];
    const distance = calculateDistance(currentPosition, { x: pedido.x, y: pedido.y });
    
    if (pedido.weight <= remainingCapacity && 
        distance <= remainingRange && 
        distance < bestDistance) {
        bestPedido = pedido;
        bestDistance = distance;
        bestIndex = i;
    }
  }
  if (bestPedido) {
    route.push({
      pedidoId: bestPedido.id,
      x: bestPedido.x,
      y: bestPedido.y,
      weight: bestPedido.weight,
      priority: bestPedido.priority,
      distance: bestDistance,
      estimatedTime: bestDistance * 2
    });
    currentPosition = { x: bestPedido.x, y: bestPedido.y };
    remainingCapacity -= bestPedido.weight;
    remainingRange -= bestDistance;
    unvisitedPedidos.splice(bestIndex, 1);
  } else {
    break;
  }
}

return route;
};

router.post('/', (req, res) => {
try {
  const { droneId, pedidoIds, optimize = true } = req.body;
  if (!droneId) {
    return res.status(400).json({
      success: false,
      error: 'ID do drone é obrigatório'
    });
  }
  const drone = db.getDroneById(droneId);
  if (!drone) {
    return res.status(404).json({
      success: false,
      error: 'Drone não encontrado'
    });
  }
  let pedidos = [];
  if (pedidoIds && pedidoIds.length > 0) {
    pedidos = pedidoIds.map(id => db.getPedidoById(id)).filter(Boolean);
  } else {
    pedidos = db.getPedidos({ status: 'pending' });
  }
  if (pedidos.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Nenhum pedido encontrado'
    });
  }
  let route = [];
  if (optimize) {
    route = calculateOptimizedRoute(drone, pedidos);
  } else {
    route = pedidos.map(pedido => ({
      pedidoId: pedido.id,
      x: pedido.x,
      y: pedido.y,
      weight: pedido.weight,
      priority: pedido.priority,
      distance: calculateDistance(drone.position, { x: pedido.x, y: pedido.y }),
      estimatedTime: calculateDistance(drone.position, { x: pedido.x, y: pedido.y }) * 2
    }));
  }
  const totalDistance = route.reduce((sum, stop) => sum + stop.distance, 0);
  const totalTime = route.reduce((sum, stop) => sum + stop.estimatedTime, 0);
  const totalWeight = route.reduce((sum, stop) => sum + stop.weight, 0);
  const rota = db.createRota({
    droneId: parseInt(droneId),
    stops: route,
    totalDistance,
    totalTime,
    totalWeight,
    status: 'planned',
    createdAt: new Date().toISOString()
  });
  
  res.status(201).json({
    success: true,
    message: 'Rota criada com sucesso',
    data: rota
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao criar rota',
    message: error.message
  });
}
});

router.get('/', validateQuery, (req, res) => {
try {
  const { page, limit, sortBy, sortOrder, ...filters } = req.queryParams;
  
  let rotas = db.getRotas(filters);
  const rotasCompletas = rotas.map(rota => {
    const drone = db.getDroneById(rota.droneId);
    return {
      ...rota,
      drone: drone ? {
        id: drone.id,
        name: drone.name,
        status: drone.status,
        battery: drone.battery,
        position: drone.position
      } : null
    };
  });
  
  rotasCompletas.sort((a, b) => {
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
  const paginatedRotas = rotasCompletas.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedRotas,
    pagination: {
      page,
      limit,
      total: rotasCompletas.length,
      pages: Math.ceil(rotasCompletas.length / limit)
    }
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao buscar rotas',
    message: error.message
  });
}
});

router.get('/:id', (req, res) => {
try {
  const rota = db.getRotaById(req.params.id);
  
  if (!rota) {
    return res.status(404).json({
      success: false,
      error: 'Rota não encontrada',
      message: `Rota com ID ${req.params.id} não foi encontrada`
    });
  }
  
  const drone = db.getDroneById(rota.droneId);
  
  const rotaCompleta = {
    ...rota,
    drone: drone ? {
      id: drone.id,
      name: drone.name,
      status: drone.status,
      battery: drone.battery,
      position: drone.position,
      capacity: drone.capacity
    } : null
  };
  
  res.json({
    success: true,
    data: rotaCompleta
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao buscar rota',
    message: error.message
  });
}
});

router.get('/drone/:droneId', validateQuery, (req, res) => {
try {
  const { droneId } = req.params;
  const { page, limit, sortBy, sortOrder } = req.queryParams;
  
  const rotas = db.getRotas({ droneId: parseInt(droneId) });
  
  rotas.sort((a, b) => {
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
  const paginatedRotas = rotas.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedRotas,
    pagination: {
      page,
      limit,
      total: rotas.length,
      pages: Math.ceil(rotas.length / limit)
    }
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao buscar rotas do drone',
    message: error.message
  });
}
});

router.put('/:id/status', (req, res) => {
try {
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({
      success: false,
      error: 'Status é obrigatório'
    });
  }
  
  const validStatuses = ['planned', 'active', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Status inválido',
      message: `Status deve ser um dos seguintes: ${validStatuses.join(', ')}`
    });
  }
  
  const rota = db.getRotaById(req.params.id);
  if (!rota) {
    return res.status(404).json({
      success: false,
      error: 'Rota não encontrada'
    });
  }
  
  const updates = { status };
  
  if (status === 'active') {
    updates.startedAt = new Date().toISOString();
  } else if (status === 'completed') {
    updates.completedAt = new Date().toISOString();
  }
  
  const rotaAtualizada = db.updateRota(req.params.id, updates);
  
  res.json({
    success: true,
    message: 'Status da rota atualizado com sucesso',
    data: rotaAtualizada
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao atualizar status da rota',
    message: error.message
  });
}
});

router.get('/optimize', (req, res) => {
try {
  const drones = db.getDrones({ status: 'idle' });
  const pedidosPendentes = db.getPedidos({ status: 'pending' });
  
  const rotasOtimizadas = drones.map(drone => {
    const route = calculateOptimizedRoute(drone, pedidosPendentes);
    
    if (route.length === 0) return null;
    
    const totalDistance = route.reduce((sum, stop) => sum + stop.distance, 0);
    const totalTime = route.reduce((sum, stop) => sum + stop.estimatedTime, 0);
    const totalWeight = route.reduce((sum, stop) => sum + stop.weight, 0);
    
    return {
      droneId: drone.id,
      droneName: drone.name,
      stops: route,
      totalDistance,
      totalTime,
      totalWeight,
      efficiency: totalWeight / totalDistance // kg/km
    };
  }).filter(Boolean);
  
  res.json({
    success: true,
    data: rotasOtimizadas,
    summary: {
      totalDrones: drones.length,
      totalPedidos: pedidosPendentes.length,
      rotasGeradas: rotasOtimizadas.length,
      totalDistance: rotasOtimizadas.reduce((sum, r) => sum + r.totalDistance, 0),
      totalTime: rotasOtimizadas.reduce((sum, r) => sum + r.totalTime, 0)
    }
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao otimizar rotas',
    message: error.message
  });
}
});

module.exports = router;
