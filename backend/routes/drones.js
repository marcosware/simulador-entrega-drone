const express = require('express');
const db = require('../models/database');
const { droneSchema, droneUpdateSchema, validateData, validateQuery } = require('../validators/validators');
const router = express.Router();

router.post('/', validateData(droneSchema), (req, res) => {
try {
  const drone = db.createDrone(req.validatedData);
  res.status(201).json({
    success: true,
    message: 'Drone criado com sucesso',
    data: drone
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao criar drone',
    message: error.message
  });
}
});

router.get('/', validateQuery, (req, res) => {
try {
  const { page, limit, sortBy, sortOrder, ...filters } = req.queryParams;
  let drones = db.getDrones(filters);
  drones.sort((a, b) => {
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
  const paginatedDrones = drones.slice(startIndex, endIndex);
  res.json({
    success: true,
    data: paginatedDrones,
    pagination: {
      page,
      limit,
      total: drones.length,
      pages: Math.ceil(drones.length / limit)
    }
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao buscar drones',
    message: error.message
  });
}
});

router.get('/:id', (req, res) => {
try {
  const drone = db.getDroneById(req.params.id);
  if (!drone) {
    return res.status(404).json({
      success: false,
      error: 'Drone não encontrado',
      message: `Drone com ID ${req.params.id} não foi encontrado`
    });
  }
  res.json({
    success: true,
    data: drone
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao buscar drone',
    message: error.message
  });
}
});

router.put('/:id', validateData(droneUpdateSchema), (req, res) => {
try {
  const drone = db.updateDrone(req.params.id, req.validatedData);
  if (!drone) {
    return res.status(404).json({
      success: false,
      error: 'Drone não encontrado',
      message: `Drone com ID ${req.params.id} não foi encontrado`
    });
  }
  
  res.json({
    success: true,
    message: 'Drone atualizado com sucesso',
    data: drone
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao atualizar drone',
    message: error.message
  });
}
});

router.delete('/:id', (req, res) => {
try {
  const drone = db.getDroneById(req.params.id);
  if (!drone) {
    return res.status(404).json({
      success: false,
      error: 'Drone não encontrado',
      message: `Drone com ID ${req.params.id} não foi encontrado`
    });
  }
  if (drone.status !== 'idle') {
    return res.status(400).json({
      success: false,
      error: 'Drone em uso',
      message: 'Não é possível deletar um drone que está em voo ou com pedidos atribuídos'
    });
  }
  const droneDeletado = db.deleteDrone(req.params.id);
  res.json({
    success: true,
    message: 'Drone deletado com sucesso',
    data: droneDeletado
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao deletar drone',
    message: error.message
  });
}
});

router.get('/status/:status', validateQuery, (req, res) => {
try {
  const { status } = req.params;
  const { page, limit, sortBy, sortOrder } = req.queryParams;
  const drones = db.getDrones({ status });
  drones.sort((a, b) => {
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
  const paginatedDrones = drones.slice(startIndex, endIndex);
  res.json({
    success: true,
    data: paginatedDrones,
    pagination: {
      page,
      limit,
      total: drones.length,
      pages: Math.ceil(drones.length / limit)
    }
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao buscar drones por status',
    message: error.message
  });
}
});

router.get('/status', (req, res) => {
try {
  const drones = db.getDrones();
  const statusSummary = {
    total: drones.length,
    idle: drones.filter(d => d.status === 'idle').length,
    flying: drones.filter(d => d.status === 'flying').length,
    delivering: drones.filter(d => d.status === 'delivering').length,
    charging: drones.filter(d => d.status === 'charging').length,
    low_battery: drones.filter(d => d.status === 'low_battery').length,
    maintenance: drones.filter(d => d.status === 'maintenance').length
  };
  const batterySummary = {
    high: drones.filter(d => d.battery > 50).length,
    medium: drones.filter(d => d.battery > 20 && d.battery <= 50).length,
    low: drones.filter(d => d.battery <= 20).length
  };
  res.json({
    success: true,
    data: {
      status: statusSummary,
      battery: batterySummary,
      drones: drones.map(d => ({
        id: d.id,
        name: d.name,
        status: d.status,
        battery: d.battery,
        position: d.position,
        currentLoad: d.currentLoad,
        capacity: d.capacity
      }))
    }
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao buscar status dos drones',
    message: error.message
  });
}
});

router.post('/:id/charge', (req, res) => {
try {
  const drone = db.getDroneById(req.params.id);
  if (!drone) {
    return res.status(404).json({
      success: false,
      error: 'Drone não encontrado'
    });
  }
  if (drone.status === 'flying' || drone.status === 'delivering') {
    return res.status(400).json({
      success: false,
      error: 'Drone em uso',
      message: 'Não é possível carregar um drone que está em voo'
    });
  }
  const droneAtualizado = db.updateDrone(req.params.id, {
    battery: 100,
    status: 'idle',
    lastUpdate: Date.now()
  });
  res.json({
    success: true,
    message: 'Drone carregado com sucesso',
    data: droneAtualizado
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao carregar drone',
    message: error.message
  });
}
});

router.post('/:id/update-position', (req, res) => {
try {
  const { x, y } = req.body;
  if (x === undefined || y === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Coordenadas obrigatórias',
      message: 'Forneça as coordenadas x e y'
    });
  }
  if (x < 0 || x > 10 || y < 0 || y > 10) {
    return res.status(400).json({
      success: false,
      error: 'Coordenadas inválidas',
      message: 'Coordenadas devem estar entre 0 e 10'
    });
  }
  const drone = db.getDroneById(req.params.id);
  if (!drone) {
    return res.status(404).json({
      success: false,
      error: 'Drone não encontrado'
    });
  }
  const distance = Math.sqrt(
    Math.pow(x - drone.position.x, 2) + Math.pow(y - drone.position.y, 2)
  );
  const batteryConsumption = distance * drone.batteryConsumption * 
    (1 + (drone.currentLoad / drone.capacity) * 0.3);
  const newBattery = Math.max(0, drone.battery - batteryConsumption);
  let newStatus = drone.status;
  if (newBattery <= 20 && drone.status !== 'charging') {
    newStatus = 'low_battery';
  } else if (newBattery <= 5) {
    newStatus = 'charging';
  }
  const droneAtualizado = db.updateDrone(req.params.id, {
    position: { x, y },
    battery: newBattery,
    status: newStatus,
    currentRange: drone.currentRange - distance,
    totalFlightTime: drone.totalFlightTime + (distance * 2) // 2 min por km
  });
  res.json({
    success: true,
    message: 'Posição atualizada com sucesso',
    data: droneAtualizado
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao atualizar posição',
    message: error.message
  });
}
});

router.get('/:id/orders', (req, res) => {
try {
  const drone = db.getDroneById(req.params.id);
  if (!drone) {
    return res.status(404).json({
      success: false,
      error: 'Drone não encontrado'
    });
  }
  const pedidos = drone.assignedOrders.map(orderId => 
    db.getPedidoById(orderId)
  ).filter(Boolean);
  
  res.json({
    success: true,
    data: pedidos
  });
} catch (error) {
  res.status(500).json({
    success: false,
    error: 'Erro ao buscar pedidos do drone',
    message: error.message
  });
}
});

module.exports = router;
