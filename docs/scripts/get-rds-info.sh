#!/bin/bash

# Script para obter informações do RDS e configurar a aplicação
# Uso: ./get-rds-info.sh

echo "=== FIAP SOAT - RDS Configuration Helper ==="
echo

# Verificar se AWS CLI está configurado
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI não está configurado ou credenciais expiradas"
    echo "Execute: ./aws-config.sh"
    exit 1
fi

echo "✅ AWS CLI configurado"
echo

# Obter informações do RDS
echo "🔍 Buscando instância RDS..."
RDS_INFO=$(aws rds describe-db-instances --db-instance-identifier fiap-soat-db 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "❌ Instância RDS 'fiap-soat-db' não encontrada"
    echo "Verifique se o banco foi provisionado via Terraform"
    echo "Repositório: https://github.com/3-fase-fiap-soat-team/fiap-soat-database-terraform"
    exit 1
fi

# Extrair informações
ENDPOINT=$(echo "$RDS_INFO" | jq -r '.DBInstances[0].Endpoint.Address')
PORT=$(echo "$RDS_INFO" | jq -r '.DBInstances[0].Endpoint.Port')
DB_NAME=$(echo "$RDS_INFO" | jq -r '.DBInstances[0].DBName')
USERNAME=$(echo "$RDS_INFO" | jq -r '.DBInstances[0].MasterUsername')
STATUS=$(echo "$RDS_INFO" | jq -r '.DBInstances[0].DBInstanceStatus')

echo "✅ RDS encontrado!"
echo
echo "📋 Informações do RDS:"
echo "   Endpoint: $ENDPOINT"
echo "   Porta: $PORT"
echo "   Database: $DB_NAME"
echo "   Username: $USERNAME"
echo "   Status: $STATUS"
echo

# Verificar se RDS está disponível
if [ "$STATUS" != "available" ]; then
    echo "⚠️  RDS não está disponível (Status: $STATUS)"
    echo "Aguarde o RDS ficar disponível antes de conectar"
    exit 1
fi

# Criar arquivo .env.rds
echo "📝 Criando arquivo .env.rds..."
cat > .env.rds << EOF
# AWS RDS Environment - Auto-generated $(date)
NODE_ENV=production

# AWS RDS PostgreSQL
DATABASE_HOST=$ENDPOINT
DATABASE_PORT=$PORT
DATABASE_USERNAME=$USERNAME
DATABASE_PASSWORD=SuperSecret123!
DATABASE_NAME=$DB_NAME
DATABASE_SSL=true

# AWS Configuration
AWS_REGION=us-east-1

# Application
PORT=3000
EOF

echo "✅ Arquivo .env.rds criado com sucesso!"
echo

# Testar conectividade
echo "🧪 Testando conectividade com RDS..."
if command -v psql > /dev/null; then
    echo "Testando conexão PostgreSQL..."
    PGPASSWORD=SuperSecret123! psql -h "$ENDPOINT" -U "$USERNAME" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Conexão PostgreSQL bem-sucedida!"
    else
        echo "❌ Falha na conexão PostgreSQL"
        echo "Verifique Security Groups e credenciais"
    fi
else
    echo "ℹ️  psql não instalado - pulando teste de conexão"
fi

echo
echo "🚀 Próximos passos:"
echo "1. Execute: make init-rds"
echo "2. Acesse: http://localhost:3000/health"
echo "3. Teste: make test-rds"
echo