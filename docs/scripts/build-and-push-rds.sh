#!/bin/bash

# FIAP SOAT - Build Real Application and Prepare for ECR Push
# Este script constrói a aplicação real NestJS e prepara para deploy no ECR/EKS

set -e

echo "🚀 FIAP SOAT - Build Real Application for ECR/EKS"
echo "=================================================="

# Variáveis
APP_DIR="/home/rafae/fiap-arch-software/fiap-soat-application"
K8S_DIR="/home/rafae/fiap-arch-software/fiap-soat-k8s-terraform"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-east-1"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
REPOSITORY_NAME="fiap-soat-nestjs-app"
ECR_REPOSITORY="${ECR_REGISTRY}/${REPOSITORY_NAME}"
DOCKER_TAG="latest"
NAMESPACE="fiap-soat-app"

echo "📋 Configuração:"
echo "   AWS Account: $AWS_ACCOUNT_ID"
echo "   AWS Region: $AWS_REGION"
echo "   ECR Registry: $ECR_REGISTRY"
echo "   Repository: $REPOSITORY_NAME"
echo "   Full ECR URI: $ECR_REPOSITORY:$DOCKER_TAG"
echo ""

echo "📁 Navegando para o diretório da aplicação..."
cd "$APP_DIR"

echo "🧹 Limpando ambiente Docker existente..."
make clean 2>/dev/null || echo "Nenhum ambiente para limpar"

echo "🔨 Iniciando build da aplicação NestJS real..."
make init

echo "⏳ Aguardando a aplicação subir completamente..."
sleep 60

echo "🏷️  Fazendo tag da imagem para ECR..."
docker tag fiap-soat-application-api-dev:latest $ECR_REPOSITORY:$DOCKER_TAG

echo "📋 Verificando imagens Docker criadas..."
docker images | grep -E "(fiap-soat|$REPOSITORY_NAME)"

echo ""
echo "🔐 Fazendo login no ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

echo ""
echo "🏗️  Criando repositório ECR (se não existir)..."
aws ecr describe-repositories --repository-names $REPOSITORY_NAME --region $AWS_REGION 2>/dev/null || {
    echo "Repositório não existe. Tentando criar..."
    aws ecr create-repository --repository-name $REPOSITORY_NAME --region $AWS_REGION --image-scanning-configuration scanOnPush=true
}

echo ""
echo "📤 Fazendo push da imagem para ECR..."
docker push $ECR_REPOSITORY:$DOCKER_TAG

echo ""
echo "🎯 Navegando para diretório Kubernetes..."
cd "$K8S_DIR"

echo "🔄 Criando deployment para usar imagem ECR..."
cat > manifests/application-nestjs/02-deployment-ecr.yaml << EOF
# FIAP SOAT - Real NestJS Application Deployment using ECR
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fiap-soat-nestjs-ecr
  namespace: $NAMESPACE
  labels:
    app: fiap-soat-nestjs-ecr
    version: v1
    component: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: fiap-soat-nestjs-ecr
  template:
    metadata:
      labels:
        app: fiap-soat-nestjs-ecr
        version: v1
        component: backend
    spec:
      containers:
      - name: fiap-soat-nestjs
        image: $ECR_REPOSITORY:$DOCKER_TAG
        imagePullPolicy: Always
        ports:
        - name: http
          containerPort: 3000
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        # Configurações básicas para demo (em produção usar ConfigMap/Secrets)
        - name: DB_HOST
          value: "postgres-service"
        - name: DB_PORT
          value: "5432"
        - name: DB_USERNAME
          value: "postgres"
        - name: DB_PASSWORD
          value: "postgres123"
        - name: DB_DATABASE
          value: "soat_tech_challenge"
        - name: JWT_SECRET
          value: "fiap-soat-jwt-secret-key-prod"
        - name: MERCADOPAGO_ACCESS_TOKEN
          value: "TEST-demo-token"
        # Health checks
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 60
          periodSeconds: 10
          failureThreshold: 3
          timeoutSeconds: 5
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 5
          failureThreshold: 3
          timeoutSeconds: 3
        # Resource limits
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
EOF

# Criar serviço para a aplicação ECR
cat > manifests/application-nestjs/03-service-ecr.yaml << EOF
# FIAP SOAT - Real NestJS Service using ECR
apiVersion: v1
kind: Service
metadata:
  name: fiap-soat-nestjs-ecr-service
  namespace: $NAMESPACE
  labels:
    app: fiap-soat-nestjs-ecr
    component: backend
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
    service.beta.kubernetes.io/aws-load-balancer-attributes: "load_balancing.cross_zone.enabled=true"
spec:
  type: LoadBalancer
  selector:
    app: fiap-soat-nestjs-ecr
  ports:
  - name: http
    port: 80
    targetPort: 3000
    protocol: TCP
  sessionAffinity: None
EOF

echo "📋 Aplicando manifests da aplicação real no EKS..."
kubectl apply -f manifests/application-nestjs/02-deployment-ecr.yaml
kubectl apply -f manifests/application-nestjs/03-service-ecr.yaml

echo "⏳ Aguardando pods ficarem prontos..."
echo "Isso pode demorar alguns minutos para o pull da imagem ECR..."
kubectl wait --for=condition=ready pod -l app=fiap-soat-nestjs-ecr -n $NAMESPACE --timeout=600s

echo "🌐 Obtendo URL do LoadBalancer..."
kubectl get service fiap-soat-nestjs-ecr-service -n $NAMESPACE

echo ""
echo "✅ Deploy da aplicação REAL concluído com sucesso!"
echo "🏗️  Imagem ECR: $ECR_REPOSITORY:$DOCKER_TAG"
echo "🔗 Acesse a aplicação através do EXTERNAL-IP mostrado acima"
echo ""
echo "📝 Endpoints da aplicação REAL disponíveis:"
echo "   - GET  / (status da API NestJS real)"
echo "   - GET  /health (health check)"
echo "   - GET  /categories (categorias de produtos)"
echo "   - GET  /products (produtos disponíveis)"
echo "   - GET  /products/:id (produto específico)"
echo "   - GET  /customers (listar clientes)"
echo "   - GET  /customers/:cpf (buscar cliente por CPF)"
echo "   - POST /customers (criar novo cliente)"
echo "   - GET  /orders (listar pedidos)"
echo "   - GET  /orders/:id (pedido específico)"
echo "   - GET  /orders/kitchen (pedidos para cozinha)"
echo "   - POST /orders (criar novo pedido)"
echo "   - POST /orders/:id/payment-qrcode (gerar QR code pagamento)"
echo "   - PATCH /orders/:id/prepare (marcar pedido em preparo)"
echo "   - PATCH /orders/:id/finalize (finalizar pedido)"
echo "   - PATCH /orders/:id/deliver (entregar pedido)"
echo "   - POST /webhook/mercadopago (webhook do Mercado Pago)"
echo ""
echo "🎯 A aplicação real FIAP SOAT NestJS está rodando no EKS com imagem do ECR!"

# Cleanup: parar containers locais para liberar recursos
echo ""
echo "🧹 Limpando containers locais para liberar recursos..."
cd "$APP_DIR"
make clean 2>/dev/null || echo "Nenhum container local para limpar"

echo ""
echo "🏁 Processo completo finalizado!"
EOF
