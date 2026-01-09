#!/bin/bash

# FIAP SOAT - Build Application with RDS Integration and Push to ECR
# Este script constrói a aplicação NestJS integrada com RDS e faz push para ECR
set -e

echo "🚀 FIAP SOAT - Build Application with RDS for ECR/EKS"
echo "======================================================"

# Variáveis
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-east-1"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
REPOSITORY_NAME="fiap-soat-nestjs-rds-app"
ECR_REPOSITORY="${ECR_REGISTRY}/${REPOSITORY_NAME}"
DOCKER_TAG="latest"

echo "📋 Configuração:"
echo "   AWS Account: $AWS_ACCOUNT_ID"
echo "   AWS Region: $AWS_REGION"
echo "   ECR Registry: $ECR_REGISTRY"
echo "   Repository: $REPOSITORY_NAME (RDS Integration)"
echo "   Full ECR URI: $ECR_REPOSITORY:$DOCKER_TAG"
echo ""

echo "⏳ Verificando se RDS está disponível..."
if aws rds describe-db-instances --db-instance-identifier fiap-soat-db --query 'DBInstances[0].DBInstanceStatus' --output text 2>/dev/null | grep -q "available"; then
    echo "✅ RDS está disponível e pronto para conexões"
    RDS_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier fiap-soat-db --query 'DBInstances[0].Endpoint.Address' --output text)
    echo "   RDS Endpoint: $RDS_ENDPOINT"
else
    echo "⚠️  RDS pode não estar disponível - continuando com build..."
fi

echo ""
echo "🧹 Limpando ambiente Docker existente..."
make clean 2>/dev/null || echo "Nenhum ambiente para limpar"

echo ""
echo "🔨 Fazendo build da imagem para produção (RDS ready)..."
docker build -t fiap-soat-app-rds .

echo ""
echo "🏷️ Taggeando imagem para ECR..."
docker tag fiap-soat-app-rds:latest $ECR_REPOSITORY:$DOCKER_TAG

echo ""
echo "🔐 Fazendo login no ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

echo ""
echo "📦 Criando repositório ECR se não existir..."
aws ecr create-repository --repository-name $REPOSITORY_NAME --region $AWS_REGION 2>/dev/null || echo "Repositório já existe"

echo ""
echo "🚀 Fazendo push da imagem para ECR..."
docker push $ECR_REPOSITORY:$DOCKER_TAG

echo ""
echo "✅ Build e push concluídos com sucesso!"
echo "📋 Próximos passos:"
echo "   1. A imagem está disponível em: $ECR_REPOSITORY:$DOCKER_TAG"
echo "   2. Use o repositório EKS para fazer deploy: cd ../fiap-soat-k8s-terraform"
echo "   3. Execute: ./scripts/deploy-from-ecr.sh"
echo "   4. Configure as variáveis de ambiente RDS no deployment do K8s"
echo ""
echo "🔗 Informações do RDS para configurar no K8s:"
echo "   DATABASE_HOST: $RDS_ENDPOINT"
echo "   DATABASE_PORT: 5432"
echo "   DATABASE_NAME: fiapdb_dev"
echo "   DATABASE_USERNAME: postgresadmin"
echo "   DATABASE_SSL: true"