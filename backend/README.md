# 🚁 API RESTful - Simulador de Entregas por Drones

API completa para gerenciamento de entregas por drones com endpoints RESTful bem definidos.

## 🚀 Funcionalidades

- **Pedidos**: CRUD completo com validação
- **Drones**: Gerenciamento de frota com bateria e posição
- **Entregas**: Rastreamento de entregas em tempo real
- **Rotas**: Otimização automática de rotas
- **Fila**: Sistema inteligente de priorização

## 📋 Endpoints Principais

### Pedidos
- `POST /api/pedidos` - Criar pedido
- `GET /api/pedidos` - Listar pedidos
- `POST /api/pedidos/:id/assign` - Atribuir a drone

### Drones
- `POST /api/drones` - Criar drone
- `GET /api/drones/status` - Status da frota
- `POST /api/drones/:id/charge` - Carregar drone

### Entregas
- `GET /api/entregas/rota` - Rota de entrega
- `PUT /api/entregas/:id/status` - Atualizar status

### Rotas
- `POST /api/rotas` - Criar rota otimizada
- `GET /api/rotas/optimize` - Otimizar todas as rotas

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Executar em produção
npm start
```

## 📚 Documentação

Acesse a documentação completa em `/docs/api-docs.md` ou visite:
- **API Docs**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 🔧 Configuração

### Variáveis de Ambiente

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Rate Limiting

- 100 requests por IP a cada 15 minutos
- Headers de resposta incluídos

## 📊 Exemplos de Uso

### Criar Pedido
```bash
curl -X POST http://localhost:3001/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "x": 5,
    "y": 3,
    "weight": 2.5,
    "priority": 1,
    "clientName": "João Silva"
  }'
```

### Status dos Drones
```bash
curl http://localhost:3001/api/drones/status
```

### Otimizar Rotas
```bash
curl http://localhost:3001/api/rotas/optimize
```

## 🏗️ Arquitetura

```
server/
├── models/
│   └── database.js          # Banco de dados em memória
├── routes/
│   ├── pedidos.js           # Endpoints de pedidos
│   ├── drones.js            # Endpoints de drones
│   ├── entregas.js          # Endpoints de entregas
│   ├── rotas.js             # Endpoints de rotas
│   └── fila.js              # Endpoints de fila
├── validators/
│   └── validators.js        # Validação de dados
├── docs/
│   └── api-docs.md          # Documentação da API
├── server.js                # Servidor principal
└── package.json
```

## 🔒 Segurança

- **Helmet**: Headers de segurança
- **CORS**: Configuração de origem
- **Rate Limiting**: Proteção contra spam
- **Validação**: Validação rigorosa de dados

## 📈 Monitoramento

- **Health Check**: `/health`
- **Logs**: Morgan para logging
- **Métricas**: Estatísticas em tempo real

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com coverage
npm run test:coverage
```

## 🚀 Deploy

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### PM2
```bash
pm2 start server.js --name "drone-api"
```

## 📝 Changelog

### v1.0.0
- ✅ Endpoints de pedidos
- ✅ Endpoints de drones
- ✅ Endpoints de entregas
- ✅ Endpoints de rotas
- ✅ Sistema de fila
- ✅ Validação de dados
- ✅ Rate limiting
- ✅ Documentação completa

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.
