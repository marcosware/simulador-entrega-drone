#!/bin/bash

# Script de inicialização do servidor da API
echo "🚁 Iniciando API RESTful - Simulador de Entregas por Drones"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js primeiro."
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale o npm primeiro."
    exit 1
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar se o arquivo server.js existe
if [ ! -f "server.js" ]; then
    echo "❌ Arquivo server.js não encontrado."
    exit 1
fi

# Definir variáveis de ambiente
export NODE_ENV=${NODE_ENV:-development}
export PORT=${PORT:-3001}
export FRONTEND_URL=${FRONTEND_URL:-http://localhost:5173}

echo "🔧 Configuração:"
echo "   - Ambiente: $NODE_ENV"
echo "   - Porta: $PORT"
echo "   - Frontend URL: $FRONTEND_URL"

# Iniciar o servidor
echo "🚀 Iniciando servidor..."
echo "📚 Documentação: http://localhost:$PORT/api"
echo "🏥 Health Check: http://localhost:$PORT/health"
echo ""

if [ "$NODE_ENV" = "development" ]; then
    echo "🔄 Modo desenvolvimento - usando nodemon"
    npx nodemon server.js
else
    echo "🏭 Modo produção"
    node server.js
fi
