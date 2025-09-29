const express = require('express');
const db = require('../models/database');
const { pedidoSchema, pedidoUpdateSchema, validateData, validateQuery } = require('../validators/validators');

const router = express.Router();

router.post('/', validateData(pedidoSchema), (req, res) => {
  try {
    const pedido = db.createPedido(req.validatedData);
    res.status(201).json({
      success: true,
      message: 'Pedido criado com sucesso',
      data: pedido
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao criar pedido',
      message: error.message
    });
  }
});

router.get('/', validateQuery, (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder, ...filters } = req.queryParams;
    
    let pedidos = db.getPedidos(filters);
    
    // Ordenação
    pedidos.sort((a, b) => {
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
    const paginatedPedidos = pedidos.slice(startIndex, endIndex);
    res.json({
      success: true,
      data: paginatedPedidos,
      pagination: {
        page,
        limit,
        total: pedidos.length,
        pages: Math.ceil(pedidos.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar pedidos',
      message: error.message
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const pedido = db.getPedidoById(req.params.id);
    
    if (!pedido) {
      return res.status(404).json({
        success: false,
        error: 'Pedido não encontrado',
        message: `Pedido com ID ${req.params.id} não foi encontrado`
      });
    }
    
    res.json({
      success: true,
      data: pedido
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar pedido',
      message: error.message
    });
  }
});

router.put('/:id', validateData(pedidoUpdateSchema), (req, res) => {
  try {
    const pedido = db.updatePedido(req.params.id, req.validatedData);
    if (!pedido) {
      return res.status(404).json({
        success: false,
        error: 'Pedido não encontrado',
        message: `Pedido com ID ${req.params.id} não foi encontrado`
      });
    }
    res.json({
      success: true,
      message: 'Pedido atualizado com sucesso',
      data: pedido
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar pedido',
      message: error.message
    });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const pedido = db.deletePedido(req.params.id);
    if (!pedido) {
      return res.status(404).json({
        success: false,
        error: 'Pedido não encontrado',
        message: `Pedido com ID ${req.params.id} não foi encontrado`
      });
    }
    res.json({
      success: true,
      message: 'Pedido deletado com sucesso',
      data: pedido
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar pedido',
      message: error.message
    });
  }
});

router.get('/status/:status', validateQuery, (req, res) => {
  try {
    const { status } = req.params;
    const { page, limit, sortBy, sortOrder } = req.queryParams;
    const pedidos = db.getPedidos({ status });
    pedidos.sort((a, b) => {
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
    const paginatedPedidos = pedidos.slice(startIndex, endIndex);
    res.json({
      success: true,
      data: paginatedPedidos,
      pagination: {
        page,
        limit,
        total: pedidos.length,
        pages: Math.ceil(pedidos.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar pedidos por status',
      message: error.message
    });
  }
});

router.get('/priority/:priority', validateQuery, (req, res) => {
  try {
    const { priority } = req.params;
    const { page, limit, sortBy, sortOrder } = req.queryParams;
    const pedidos = db.getPedidos({ priority: parseInt(priority) });
    pedidos.sort((a, b) => {
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
    const paginatedPedidos = pedidos.slice(startIndex, endIndex);
    res.json({
      success: true,
      data: paginatedPedidos,
      pagination: {
        page,
        limit,
        total: pedidos.length,
        pages: Math.ceil(pedidos.length / limit)
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

router.post('/:id/assign', (req, res) => {
  try {
    const { droneId } = req.body;
    if (!droneId) {
      return res.status(400).json({
        success: false,
        error: 'ID do drone é obrigatório',
        message: 'Forneça o ID do drone para atribuir o pedido'
      });
    }
    const pedido = db.getPedidoById(req.params.id);
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
    if (pedido.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Pedido já foi atribuído ou processado'
      });
    }
    if (drone.status !== 'idle' || drone.battery < 20) {
      return res.status(400).json({
        success: false,
        error: 'Drone não está disponível'
      });
    }
    const pedidoAtualizado = db.updatePedido(req.params.id, {
      status: 'assigned',
      assignedTo: droneId,
      assignedAt: new Date().toISOString()
    });
    const droneAtualizado = db.updateDrone(droneId, {
      status: 'flying',
      assignedOrders: [...drone.assignedOrders, parseInt(req.params.id)],
      currentLoad: drone.currentLoad + pedido.weight
    });
    res.json({
      success: true,
      message: 'Pedido atribuído com sucesso',
      data: {
        pedido: pedidoAtualizado,
        drone: droneAtualizado
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao atribuir pedido',
      message: error.message
    });
  }
});

module.exports = router;
