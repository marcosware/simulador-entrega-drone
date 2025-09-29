class Database {
constructor() {
  this.pedidos = [];
  this.drones = [];
  this.entregas = [];
  this.rotas = [];
  this.fila = [];
  this.nextId = 1;
}

generateId() {
  return this.nextId++;
}

// PEDIDOS
createPedido(pedido) {
  const novoPedido = {
    id: this.generateId(),
    ...pedido,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  this.pedidos.push(novoPedido);
  return novoPedido;
}

getPedidos(filters = {}) {
  let filtered = [...this.pedidos];
  
  if (filters.status) {
    filtered = filtered.filter(p => p.status === filters.status);
  }
  if (filters.priority) {
    filtered = filtered.filter(p => p.priority === filters.priority);
  }
  if (filters.assignedTo) {
    filtered = filtered.filter(p => p.assignedTo === filters.assignedTo);
  }
  
  return filtered;
}

getPedidoById(id) {
  return this.pedidos.find(p => p.id === parseInt(id));
}

updatePedido(id, updates) {
  const index = this.pedidos.findIndex(p => p.id === parseInt(id));
  if (index !== -1) {
    this.pedidos[index] = {
      ...this.pedidos[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.pedidos[index];
  }
  return null;
}

deletePedido(id) {
  const index = this.pedidos.findIndex(p => p.id === parseInt(id));
  if (index !== -1) {
    return this.pedidos.splice(index, 1)[0];
  }
  return null;
}

// DRONES
createDrone(drone) {
  const novoDrone = {
    id: this.generateId(),
    ...drone,
    battery: 100,
    currentLoad: 0,
    currentRange: drone.range,
    position: { x: 0, y: 0 },
    status: 'idle',
    assignedOrders: [],
    totalDeliveries: 0,
    totalFlightTime: 0,
    createdAt: new Date().toISOString(),
    lastUpdate: Date.now()
  };
  this.drones.push(novoDrone);
  return novoDrone;
}

getDrones(filters = {}) {
  let filtered = [...this.drones];
  
  if (filters.status) {
    filtered = filtered.filter(d => d.status === filters.status);
  }
  if (filters.batteryMin) {
    filtered = filtered.filter(d => d.battery >= filters.batteryMin);
  }
  
  return filtered;
}

getDroneById(id) {
  return this.drones.find(d => d.id === parseInt(id));
}

updateDrone(id, updates) {
  const index = this.drones.findIndex(d => d.id === parseInt(id));
  if (index !== -1) {
    this.drones[index] = {
      ...this.drones[index],
      ...updates,
      lastUpdate: Date.now()
    };
    return this.drones[index];
  }
  return null;
}

deleteDrone(id) {
  const index = this.drones.findIndex(d => d.id === parseInt(id));
  if (index !== -1) {
    return this.drones.splice(index, 1)[0];
  }
  return null;
}

// ENTREGAS
createEntrega(entrega) {
  const novaEntrega = {
    id: this.generateId(),
    ...entrega,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  this.entregas.push(novaEntrega);
  return novaEntrega;
}

getEntregas(filters = {}) {
  let filtered = [...this.entregas];
  
  if (filters.status) {
    filtered = filtered.filter(e => e.status === filters.status);
  }
  if (filters.droneId) {
    filtered = filtered.filter(e => e.droneId === filters.droneId);
  }
  
  return filtered;
}

getEntregaById(id) {
  return this.entregas.find(e => e.id === parseInt(id));
}

updateEntrega(id, updates) {
  const index = this.entregas.findIndex(e => e.id === parseInt(id));
  if (index !== -1) {
    this.entregas[index] = {
      ...this.entregas[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.entregas[index];
  }
  return null;
}

// ROTAS
createRota(rota) {
  const novaRota = {
    id: this.generateId(),
    ...rota,
    status: 'planned',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  this.rotas.push(novaRota);
  return novaRota;
}

getRotas(filters = {}) {
  let filtered = [...this.rotas];
  
  if (filters.status) {
    filtered = filtered.filter(r => r.status === filters.status);
  }
  if (filters.droneId) {
    filtered = filtered.filter(r => r.droneId === filters.droneId);
  }
  
  return filtered;
}

getRotaById(id) {
  return this.rotas.find(r => r.id === parseInt(id));
}

updateRota(id, updates) {
  const index = this.rotas.findIndex(r => r.id === parseInt(id));
  if (index !== -1) {
    this.rotas[index] = {
      ...this.rotas[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.rotas[index];
  }
  return null;
}

// FILA
getFila() {
  const pedidosPendentes = this.pedidos.filter(p => p.status === 'pending');
  return pedidosPendentes.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
}

// ESTATÍSTICAS
getEstatisticas() {
  const totalPedidos = this.pedidos.length;
  const pedidosPendentes = this.pedidos.filter(p => p.status === 'pending').length;
  const pedidosEntregues = this.pedidos.filter(p => p.status === 'delivered').length;
  const totalDrones = this.drones.length;
  const dronesDisponiveis = this.drones.filter(d => d.status === 'idle' && d.battery > 20).length;
  const totalEntregas = this.entregas.length;
  return {
    pedidos: {
      total: totalPedidos,
      pendentes: pedidosPendentes,
      entregues: pedidosEntregues
    },
    drones: {
      total: totalDrones,
      disponiveis: dronesDisponiveis
    },
    entregas: {
      total: totalEntregas
    }
  };
}
}
const db = new Database();
module.exports = db;
