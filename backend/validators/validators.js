const Joi = require('joi');

const pedidoSchema = Joi.object({
x: Joi.number().integer().min(0).max(10).required()
  .messages({
    'number.base': 'Coordenada X deve ser um número',
    'number.integer': 'Coordenada X deve ser um número inteiro',
    'number.min': 'Coordenada X deve ser maior ou igual a 0',
    'number.max': 'Coordenada X deve ser menor ou igual a 10',
    'any.required': 'Coordenada X é obrigatória'
  }),
y: Joi.number().integer().min(0).max(10).required()
  .messages({
    'number.base': 'Coordenada Y deve ser um número',
    'number.integer': 'Coordenada Y deve ser um número inteiro',
    'number.min': 'Coordenada Y deve ser maior ou igual a 0',
    'number.max': 'Coordenada Y deve ser menor ou igual a 10',
    'any.required': 'Coordenada Y é obrigatória'
  }),
weight: Joi.number().positive().max(50).required()
  .messages({
    'number.base': 'Peso deve ser um número',
    'number.positive': 'Peso deve ser maior que zero',
    'number.max': 'Peso deve ser menor ou igual a 50kg',
    'any.required': 'Peso é obrigatório'
  }),
priority: Joi.number().integer().valid(1, 2, 3).default(2)
  .messages({
    'number.base': 'Prioridade deve ser um número',
    'number.integer': 'Prioridade deve ser um número inteiro',
    'any.only': 'Prioridade deve ser 1 (alta), 2 (média) ou 3 (baixa)'
  }),
description: Joi.string().max(500).optional()
  .messages({
    'string.max': 'Descrição deve ter no máximo 500 caracteres'
  }),
clientName: Joi.string().max(100).optional()
  .messages({
    'string.max': 'Nome do cliente deve ter no máximo 100 caracteres'
  }),
clientPhone: Joi.string().max(20).optional()
  .messages({
    'string.max': 'Telefone deve ter no máximo 20 caracteres'
  })
});

const droneSchema = Joi.object({
name: Joi.string().min(2).max(50).required()
  .messages({
    'string.base': 'Nome deve ser uma string',
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 50 caracteres',
    'any.required': 'Nome é obrigatório'
  }),
capacity: Joi.number().positive().max(100).required()
  .messages({
    'number.base': 'Capacidade deve ser um número',
    'number.positive': 'Capacidade deve ser maior que zero',
    'number.max': 'Capacidade deve ser menor ou igual a 100kg',
    'any.required': 'Capacidade é obrigatória'
  }),
range: Joi.number().positive().max(50).required()
  .messages({
    'number.base': 'Alcance deve ser um número',
    'number.positive': 'Alcance deve ser maior que zero',
    'number.max': 'Alcance deve ser menor ou igual a 50km',
    'any.required': 'Alcance é obrigatório'
  }),
batteryConsumption: Joi.number().positive().max(10).default(0.5)
  .messages({
    'number.base': 'Consumo de bateria deve ser um número',
    'number.positive': 'Consumo de bateria deve ser maior que zero',
    'number.max': 'Consumo de bateria deve ser menor ou igual a 10% por km'
  }),
model: Joi.string().max(50).optional()
  .messages({
    'string.max': 'Modelo deve ter no máximo 50 caracteres'
  })
});

const pedidoUpdateSchema = Joi.object({
status: Joi.string().valid('pending', 'assigned', 'in_transit', 'delivered', 'cancelled').optional(),
assignedTo: Joi.number().integer().positive().optional(),
priority: Joi.number().integer().valid(1, 2, 3).optional(),
description: Joi.string().max(500).optional()
});

const droneUpdateSchema = Joi.object({
status: Joi.string().valid('idle', 'flying', 'delivering', 'charging', 'low_battery', 'maintenance').optional(),
battery: Joi.number().min(0).max(100).optional(),
position: Joi.object({
  x: Joi.number().integer().min(0).max(10),
  y: Joi.number().integer().min(0).max(10)
}).optional(),
currentLoad: Joi.number().min(0).optional(),
currentRange: Joi.number().min(0).optional()
});

const queryParamsSchema = Joi.object({
page: Joi.number().integer().min(1).default(1),
limit: Joi.number().integer().min(1).max(100).default(10),
status: Joi.string().optional(),
priority: Joi.number().integer().valid(1, 2, 3).optional(),
sortBy: Joi.string().valid('createdAt', 'priority', 'weight', 'status').default('createdAt'),
sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

const validateData = (schema) => {
return (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors
    });
  }
  req.validatedData = value;
  next();
};
};

const validateQuery = (req, res, next) => {
const { error, value } = queryParamsSchema.validate(req.query, { abortEarly: false });
if (error) {
  const errors = error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message
  }));
  return res.status(400).json({
    error: 'Parâmetros de query inválidos',
    details: errors
  });
}
req.queryParams = value;
next();
};

module.exports = {
pedidoSchema,
droneSchema,
pedidoUpdateSchema,
droneUpdateSchema,
queryParamsSchema,
validateData,
validateQuery
};
