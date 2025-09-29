const express = require('express');
const db = require('../models/database');
const { validateQuery } = require('../validators/validators');
const router = express.Router();

router.post('/', (req, res) => {
try {
  const { pedidoId, droneId, estimatedTime, distance } = req.body;
  if (!pedidoId || !droneId) {
    return res.status(400).json({
      success: false,
      error: 'Dados obrigatórios',
      message: 'pedidoId e droneId são obrigatórios'
    });
  }
  const pedido = db.getPedidoById(pedidoId);
  if (!pedido) {
    return res.status(404).json({
      success: false,
      error: 'Pedido não encontrado'
    });
  }
  const drone = db.getDroneById(droneId);
  if (!drone) {
    return res.status(404).json({
      success: false,
      error: 'Drone não encontrado'
    });
  }
  const entrega = db.createEntrega({
    pedidoId: parseInt(pedidoId),
    droneId: parseInt(droneId),
    estimatedTime: estimatedTime || 0,
    distance: distance || 0,
    status: 'pending',
    startTime: new Date().toISOString()
  });
  res.status(201).json({
    success: true,
    message: 'Entrega criada com sucesso',
    data: entrega
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao criar entrega',
    message: error.message
  });
}
});

router.get('/', validateQuery, (req, res) => {
try {
  const { page, limit, sortBy, sortOrder, ...filters } = req.queryParams;
  let entregas = db.getEntregas(filters);
  const entregasCompletas = entregas.map(entrega => {
    const pedido = db.getPedidoById(entrega.pedidoId);
    const drone = db.getDroneById(entrega.droneId);
    return {
      ...entrega,
      pedido: pedido ? {
        id: pedido.id,
        x: pedido.x,
        y: pedido.y,
        weight: pedido.weight,
        priority: pedido.priority,
        status: pedido.status
      } : null,
      drone: drone ? {
        id: drone.id,
        name: drone.name,
        status: drone.status,
        battery: drone.battery,
        position: drone.position
      } : null
    };
  });
  entregasCompletas.sort((a, b) => {
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
  const paginatedEntregas = entregasCompletas.slice(startIndex, endIndex);
  res.json({
    success: true,
    data: paginatedEntregas,
    pagination: {
      page,
      limit,
      total: entregasCompletas.length,
      pages: Math.ceil(entregasCompletas.length / limit)
    }
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao buscar entregas',
    message: error.message
  });
}
});

router.get('/:id', (req, res) => {
try {
  const entrega = db.getEntregaById(req.params.id);
  if (!entrega) {
    return res.status(404).json({
      success: false,
      error: 'Entrega não encontrada',
      message: `Entrega com ID ${req.params.id} não foi encontrada`
    });
  }
  const pedido = db.getPedidoById(entrega.pedidoId);
  const drone = db.getDroneById(entrega.droneId);
  const entregaCompleta = {
    ...entrega,
    pedido: pedido ? {
      id: pedido.id,
      x: pedido.x,
      y: pedido.y,
      weight: pedido.weight,
      priority: pedido.priority,
      status: pedido.status,
      clientName: pedido.clientName,
      clientPhone: pedido.clientPhone
    } : null,
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
    data: entregaCompleta
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao buscar entrega',
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
  const validStatuses = ['pending', 'in_transit', 'delivered', 'cancelled', 'failed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Status inválido',
      message: `Status deve ser um dos seguintes: ${validStatuses.join(', ')}`
    });
  }
  const entrega = db.getEntregaById(req.params.id);
  if (!entrega) {
    return res.status(404).json({
      success: false,
      error: 'Entrega não encontrada'
    });
  }
  const updates = { status };
  if (status === 'in_transit') {
    updates.startTime = new Date().toISOString();
  } else if (status === 'delivered') {
    updates.deliveredAt = new Date().toISOString();
    updates.actualTime = entrega.startTime ? 
      (new Date() - new Date(entrega.startTime)) / 1000 / 60 : 0; // em minutos
  }
  const entregaAtualizada = db.updateEntrega(req.params.id, updates);
  if (status === 'delivered') {
    const pedido = db.getPedidoById(entrega.pedidoId);
    const drone = db.getDroneById(entrega.droneId);
    if (pedido) {
      db.updatePedido(entrega.pedidoId, {
        status: 'delivered',
        deliveredAt: new Date().toISOString()
      });
    }
    if (drone) {
      const newAssignedOrders = drone.assignedOrders.filter(id => id !== entrega.pedidoId);
      const newStatus = newAssignedOrders.length === 0 ? 'idle' : 'flying';
      db.updateDrone(entrega.droneId, {
        assignedOrders: newAssignedOrders,
        status: newStatus,
        totalDeliveries: drone.totalDeliveries + 1
      });
    }
  }
  res.json({
    success: true,
    message: 'Status da entrega atualizado com sucesso',
    data: entregaAtualizada
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao atualizar status da entrega',
    message: error.message
  });
}
});

router.get('/drone/:droneId', validateQuery, (req, res) => {
try {
  const { droneId } = req.params;
  const { page, limit, sortBy, sortOrder } = req.queryParams;
  const entregas = db.getEntregas({ droneId: parseInt(droneId) });
  const entregasCompletas = entregas.map(entrega => {
    const pedido = db.getPedidoById(entrega.pedidoId);
    return {
      ...entrega,
      pedido: pedido ? {
        id: pedido.id,
        x: pedido.x,
        y: pedido.y,
        weight: pedido.weight,
        priority: pedido.priority,
        status: pedido.status
      } : null
    };
  });
  entregasCompletas.sort((a, b) => {
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
  const paginatedEntregas = entregasCompletas.slice(startIndex, endIndex);
  res.json({
    success: true,
    data: paginatedEntregas,
    pagination: {
      page,
      limit,
      total: entregasCompletas.length,
      pages: Math.ceil(entregasCompletas.length / limit)
    }
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao buscar entregas do drone',
    message: error.message
  });
}
});

router.get('/stats', (req, res) => {
try {
  const entregas = db.getEntregas();
  const stats = {
    total: entregas.length,
    pending: entregas.filter(e => e.status === 'pending').length,
    in_transit: entregas.filter(e => e.status === 'in_transit').length,
    delivered: entregas.filter(e => e.status === 'delivered').length,
    cancelled: entregas.filter(e => e.status === 'cancelled').length,
    failed: entregas.filter(e => e.status === 'failed').length,
    averageTime: 0,
    totalDistance: 0
  };
  const deliveredEntregas = entregas.filter(e => e.status === 'delivered');
  if (deliveredEntregas.length > 0) {
    stats.averageTime = deliveredEntregas.reduce((sum, e) => sum + (e.actualTime || 0), 0) / deliveredEntregas.length;
    stats.totalDistance = deliveredEntregas.reduce((sum, e) => sum + (e.distance || 0), 0);
  }
  res.json({
    success: true,
    data: stats
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao buscar estatísticas das entregas',
    message: error.message
  });
}
});

module.exports = router;
