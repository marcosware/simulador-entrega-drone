# 🚁 Simulador de Entregas por Drones

Sistema completo de **simulação de entregas com drones**, composto por:

* **Backend (Node.js + Express)**: API RESTful para gerenciamento de pedidos, drones, entregas, rotas e fila de prioridade.
* **Frontend (React + Vite)**: Interface web para visualização, gerenciamento e simulação das entregas.

---

## Estrutura do Projeto

```
.
├── backend/         # API RESTful
│   ├── models/      # Modelos e banco de dados em memória
│   ├── routes/      # Endpoints (pedidos, drones, entregas, etc.)
│   ├── validators/  # Validações de entrada
│   ├── server.js    # Servidor principal
│   └── package.json
│
└── frontend/        # Interface Web (React + Vite)
    ├── public/      
    ├── src/         # Código da aplicação (componentes, páginas, hooks)
    ├── vite.config.js
    └── package.json
```

---

## Funcionalidades

### Backend

* **Pedidos**: CRUD completo com atribuição a drones
* **Drones**: Gestão de frota, bateria, posição e status
* **Entregas**: Criação, rastreamento e estatísticas
* **Rotas**: Otimização automática de trajetos
* **Fila**: Algoritmo de priorização inteligente

### Frontend

* Dashboard com **visualização dos pedidos e drones**
* **Algoritmo de alocação** para distribuir pedidos automaticamente
* Logs detalhados das alocações
* Interface responsiva (React + Vite)

---

## Pré-requisitos

Você precisa do seguinte instalado na sua máquina de desenvolvimento:

* [Git](https://git-scm.com/downloads)
* Node.js and npm. Versão mínima Node 20.
  - Linux/Mac: [nvm - Node Version Manager](https://github.com/nvm-sh/nvm).
  - Windows: [NodeJS - Guia Microsoft](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows).

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/marcosware/simulador-entrega-drone.git
cd simulador-entrega-drone
```

### 2. Inicie o backend

```bash
cd backend
npm install
npm run dev
```

* API disponível em: `http://localhost:3001/api`
* Health Check: `http://localhost:3001/health`

### 3. Inicie o frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

* Interface disponível em: `http://localhost:5173`

---

## Variáveis de Ambiente

Crie um arquivo `.env` no **backend**:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## Documentação da API

Exemplo de endpoints:

* `POST /api/pedidos` → Criar pedido
* `GET /api/drones/status` → Status da frota
* `GET /api/rotas/optimize` → Otimizar rotas
* `POST /api/fila/process-all` → Processar fila

---


## Testes (backend)

```bash
cd backend
npm test
npm run test:coverage
```

---

## Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.