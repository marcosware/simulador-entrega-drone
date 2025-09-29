const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const pedidosRoutes = require('./routes/pedidos');
const dronesRoutes = require('./routes/drones');
const entregasRoutes = require('./routes/entregas');
const rotasRoutes = require('./routes/rotas');
const filaRoutes = require('./routes/fila');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
origin: process.env.FRONTEND_URL || 'http://localhost:5173',
credentials: true
}));

const limiter = rateLimit({
windowMs: 15 * 60 * 1000,
max: 100, 
message: {
  error: 'Muitas requisições. Tente novamente em 15 minutos.'
}
});
app.use(limiter);
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
res.json({
  status: 'OK',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
  uptime: process.uptime()
});
});

app.use('/api/pedidos', pedidosRoutes);
app.use('/api/drones', dronesRoutes);
app.use('/api/entregas', entregasRoutes);
app.use('/api/rotas', rotasRoutes);
app.use('/api/fila', filaRoutes);

app.get('/api', (req, res) => {
res.json({
  name: 'Drone Delivery API',
  version: '1.0.0',
  description: 'API RESTful para simulador de entregas por drones',
  endpoints: {
    pedidos: '/api/pedidos',
    drones: '/api/drones',
    entregas: '/api/entregas',
    rotas: '/api/rotas',
    fila: '/api/fila'
  },
  documentation: '/api/docs'
});
});

app.use((err, req, res, next) => {
console.error(err.stack);
res.status(500).json({
  error: 'Erro interno do servidor',
  message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
});
});

app.use('*', (req, res) => {
res.status(404).json({
  error: 'Endpoint não encontrado',
  path: req.originalUrl,
  method: req.method
});
});

app.listen(PORT, () => {
console.log(`🚁 Servidor da API rodando na porta ${PORT}`);
console.log(`📚 Documentação: http://localhost:${PORT}/api`);
console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
