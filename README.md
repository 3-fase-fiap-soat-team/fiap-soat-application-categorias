# 🚀 SOAT Tech Challenge — Serviço de Categorias (Cloud-Native)

Repositório do serviço de **Categorias** do SOAT Tech Challenge. Implementa listagem e consulta de categorias usando **Clean Architecture**, **TypeORM** e está preparado para deployment cloud-native (EKS + RDS).

---

## 🎯 Sobre o Projeto

Serviço responsável por gerenciar as categorias do SOAT. Principais características:
- ✅ **API REST** para listar e consultar categorias
- ✅ **Clean Architecture** (domain-first)
- ✅ **TypeORM** com migrations para persistência em PostgreSQL
- ✅ **Testes unitários e E2E** (Jest)
- ✅ **Pronto para deploy cloud-native** (EKS + RDS)

> **Nota**: Este repositório implementa apenas o serviço de categorias — outras responsabilidades do sistema (pagamentos, autenticação) estão em repositórios separados listados em "Links Úteis".

---

## 🏗️ Arquitetura Cloud-Native

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS CLOUD                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌─────────────────────────────┐    │
│  │  API Gateway │──────▶│  Lambda (Auth/Signup)      │    │
│  │  REST API    │      │  Node.js 20.x              │    │
│  └──────────────┘      └─────────────────────────────┘    │
│         │                           │                       │
│         │                           ▼                       │
│         │                  ┌──────────────────┐            │
│         │                  │  Cognito User Pool│            │
│         │                  │  (custom:cpf)     │            │
│         │                  └──────────────────┘            │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────────────────────────────────────┐         │
│  │  Network Load Balancer (NLB)                 │         │
│  │  ade6621a32ddf...elb.us-east-1.amazonaws.com │         │
│  └──────────────────────────────────────────────┘         │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  EKS Cluster (fiap-soat-eks-dev)                   │  │
│  │  Kubernetes 1.30 | 2x t3.micro nodes               │  │
│  │                                                     │  │
│  │  ┌────────────────────────────────────────────┐   │  │
│  │  │  Namespace: fiap-soat-app                  │   │  │
│  │  │  ┌──────────────────────────────────────┐  │   │  │
│  │  │  │  Deployment: fiap-soat-application   │  │   │  │
│  │  │  │  - Image: NestJS (ECR)               │  │   │  │
│  │  │  │  - HPA: 1-3 replicas (auto)          │  │   │  │
│  │  │  │  - Resources: 512Mi/500m CPU         │  │   │  │
│  │  │  │  - Health Checks: /health            │  │   │  │
│  │  │  │  - Port: 3000                        │  │   │  │
│  │  │  └──────────────────────────────────────┘  │   │  │
│  │  └────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  RDS PostgreSQL (fiap-soat-db)                      │  │
│  │  PostgreSQL 17.4 | db.t3.micro                      │  │
│  │  Endpoint: fiap-soat-db.cfcimi4ia52v...amazonaws.com│  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deploy e Execução

### ⚠️ Observação: Deploy cloud-native recomendado

A aplicação é pensada para deployment em cloud (EKS + RDS), porém é possível rodar em ambiente local para desenvolvimento e testes (usando um arquivo `.env` apropriado, `npm run start:dev` ou `docker-compose up`).

### Pré-requisitos

- ✅ **EKS Cluster** configurado ([repo EKS](https://github.com/3-fase-fiap-soat-team/fiap-soat-k8s-terraform))
- ✅ **RDS PostgreSQL** provisionado ([repo RDS](https://github.com/3-fase-fiap-soat-team/fiap-soat-database-terraform))
- ✅ **Lambda + Cognito** deployado ([repo Lambda](https://github.com/3-fase-fiap-soat-team/fiap-soat-lambda))
- ✅ **AWS CLI** configurado
- ✅ **kubectl** instalado e configurado
- ✅ **Docker** instalado

### 🔧 Rodando localmente

Opções para desenvolvimento local:

- Usando Node:

```bash
# instalar dependências
npm install

# criar um arquivo .env.local (exemplo abaixo) ou exportar variáveis
# .env.local
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=fiapdb_dev
NODE_ENV=development
PORT=3000

# rodar em modo dev
npm run start:dev

# rodar migrações
npm run migration:up

# rodar testes
npm run test
```

- Usando Docker Compose (requer Postgres acessível ou ajuste do `.env`):

```bash
docker-compose up --build
```

### 1️⃣ Build e Push da Imagem

```bash
# Build da imagem Docker
docker build -t fiap-soat-application:latest .

# Tag para ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
docker tag fiap-soat-application:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/fiap-soat-application:latest

# Push para ECR
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/fiap-soat-application:latest
```

### 2️⃣ Deploy no Kubernetes

```bash
# Aplicar manifests (do repositório EKS)
cd ../fiap-soat-k8s-terraform

# Infraestrutura Kubernetes (namespace, configmap, secret, service, HPA)
kubectl apply -f manifests/namespace.yaml
kubectl apply -f manifests/configmap.yaml
kubectl apply -f manifests/secret.yaml
kubectl apply -f manifests/service.yaml
kubectl apply -f manifests/hpa.yaml

# Deployment da aplicação (neste repositório)
cd ../fiap-soat-application
kubectl apply -f k8s/deployment.yaml

# Verificar deployment
kubectl get all -n fiap-soat-app
kubectl logs -f deployment/fiap-soat-application -n fiap-soat-app
```

> **📝 Nota**: O deployment agora está neste repositório (`k8s/deployment.yaml`) e usa os recursos padronizados:
> - Container: `fiap-soat-application`
> - ConfigMap: `fiap-soat-application-config`
> - Secret: `fiap-soat-application-secrets`
> - Service: `fiap-soat-application-service`
> - Health Checks: Liveness + Readiness probes (`/health`)
> - HPA: Autoscaling 1-3 replicas (gerenciado pelo repo EKS)

### 3️⃣ Rodar Migrações

```bash
# Conectar ao pod
kubectl exec -it deployment/fiap-soat-application -n fiap-soat-app -- /bin/sh

# Rodar migrações
npm run migration:up
```

### 4️⃣ Verificar Health

```bash
# Obter Load Balancer URL
kubectl get svc fiap-soat-application-service -n fiap-soat-app

# Testar endpoints
curl http://<LOAD_BALANCER_URL>/health
curl http://<LOAD_BALANCER_URL>/docs  # Swagger
```

---

## 📂 Arquitetura Limpa (Clean Architecture)

Estrutura de camadas bem definidas:

```
src/
├── core/                    # 🔴 DOMAIN + APPLICATION LAYER
│   ├── categories/          # Domínio: Categorias
│   │   ├── entities/        # Entidades de negócio
│   │   ├── operation/
│   │   │   ├── gateways/    # Interfaces (portas)
│   │   │   ├── presenters/  # Transformadores
│   │   │   └── controllers/ # Controllers de domínio
│   │   └── usecases/        # Casos de uso (CQRS)
│   │       ├── commands/    # Operações de escrita
│   │       └── queries/     # Operações de leitura
│   └── common/              # Compartilhado
│       ├── dtos/
│       └── exceptions/
│
├── external/                # 🟢 INFRASTRUCTURE + INTERFACE LAYER
│   ├── api/                 # Controllers NestJS (HTTP)
│   │   ├── controllers/
│   │   └── dtos/
│   ├── database/            # Persistência (TypeORM)
│   │   ├── entities/
│   │   └── repositories/
│   ├── gateways/            # Integrações externas
│   │   └── mercadopago/
│   └── providers/           # Serviços externos
│
├── config/                  # Configurações
│   └── database.config.ts   # Config cloud-native
├── app.module.ts            # Módulo principal
└── main.ts                  # Entrypoint + validação
```

### Princípios Aplicados

1. ✅ **Separação de Camadas**: Domínio isolado da infraestrutura
2. ✅ **CQRS**: Commands (escrita) e Queries (leitura) separados
3. ✅ **Dependency Inversion**: Domínio define interfaces, infraestrutura implementa
4. ✅ **Use Cases**: Lógica de negócio orquestrada por casos de uso
5. ✅ **Testabilidade**: Domínio testável sem dependências externas

---

## 🔐 Autenticação Serverless

### Lambda + Cognito

```bash
# Signup (criar cliente + user Cognito)
curl -X POST https://nlxpeaq6w0.execute-api.us-east-1.amazonaws.com/dev/signup \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678900",
    "name": "João Silva",
    "email": "joao@example.com"
  }'

# Auth (validar CPF + retornar JWT)
curl -X GET https://nlxpeaq6w0.execute-api.us-east-1.amazonaws.com/dev/auth/12345678900
```

### Fluxo de Autenticação

1. **Signup**: Lambda → NestJS (criar customer) → Cognito (criar user) → JWT
2. **Auth**: Lambda → NestJS (buscar customer) → Cognito (validar) → JWT
3. **Protected Routes**: Validar JWT no NestJS (middleware/guard)

---

## 🗄️ Banco de Dados

### Variáveis de Ambiente Obrigatórias

```bash
# .env.rds (Kubernetes Secret)
DATABASE_HOST=fiap-soat-db.cfcimi4ia52v.us-east-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_USERNAME=postgresadmin
DATABASE_PASSWORD=SuperSecret123!
DATABASE_NAME=fiapdb_dev
DATABASE_SSL=true
NODE_ENV=production
```

### Migrações TypeORM

```bash
# Criar nova migração
npm run migration:create -- -n NomeDaMigracao

# Executar migrações
npm run migration:up

# Reverter migração
npm run migration:down
```

---

## 📊 Endpoints Principais

### Health Checks
- `GET /health` - Status da aplicação

### Categorias
- `GET /categories` - Listar categorias
- `GET /categories/:id` - Buscar categoria por ID

> **Nota**: Alguns endpoints pertencem a outros serviços do ecossistema SOAT e não estão implementados neste repositório.

---

## 🧪 Testes

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

---

## 📚 Links Úteis

- 📦 [Repositório EKS + Kubernetes](https://github.com/3-fase-fiap-soat-team/fiap-soat-k8s-terraform)
- 🗄️ [Repositório RDS Terraform](https://github.com/3-fase-fiap-soat-team/fiap-soat-database-terraform)
- ⚡ [Repositório Lambda + Cognito](https://github.com/3-fase-fiap-soat-team/fiap-soat-lambda)
- 🎨 [Desenho de Fluxo (Miro)](https://miro.com/app/board/uXjVJXtfEMw=/)
- 🏗️ [Diagrama de Infraestrutura](https://drive.google.com/file/d/12MQ86MMUuziVfoD7i3s9g8UmBE3q78vQ/view)
- 🎥 [Vídeo de Apresentação](https://www.youtube.com/watch?v=m_8Sd9t2Jm4)

---

## 💰 Custos AWS

| Recurso | Especificação | Custo Mensal |
|---------|---------------|--------------|
| EKS Control Plane | 1 cluster | $75.00 |
| EC2 (Nodes) | 2x t3.micro | ~$15.00 |
| RDS PostgreSQL | db.t3.micro | ~$15.50 |
| Load Balancer | NLB | ~$22.00 |
| Lambda | 128MB, 30s timeout | ~$0.20 |
| Cognito | User Pool | Grátis |
| ECR | Storage | ~$0.50 |
| **TOTAL** | | **~$128.20/mês** |

**💡 Nota**: Para AWS Academy ($50 créditos), recomenda-se destruir recursos após apresentação.

---

## 🛠️ Troubleshooting

### Aplicação não conecta ao RDS
```bash
# Verificar secret (nome atualizado)
kubectl get secret fiap-soat-application-secrets -n fiap-soat-app -o yaml

# Verificar logs
kubectl logs -f deployment/fiap-soat-application -n fiap-soat-app

# Testar conectividade DNS
kubectl exec -it deployment/fiap-soat-application -n fiap-soat-app -- nslookup fiap-soat-db.cfcimi4ia52v.us-east-1.rds.amazonaws.com
```

### Load Balancer não responde
```bash
# Verificar status do service (nome atualizado)
kubectl describe svc fiap-soat-application-service -n fiap-soat-app

# Verificar target groups na AWS Console
aws elbv2 describe-target-health --target-group-arn <ARN>
```

### Validação de variáveis falha
```bash
# A aplicação agora valida variáveis na inicialização
# Erro típico:
# ❌ Missing required environment variables:
#    - DATABASE_HOST
#    - DATABASE_PASSWORD

# Solução: Verificar secret no Kubernetes (nome atualizado)
kubectl edit secret fiap-soat-application-secrets -n fiap-soat-app
```

---

## 🔄 CI/CD e Deploy Automatizado

### GitHub Actions Workflow

O repositório possui um workflow CI/CD completo (`.github/workflows/ci-cd-eks.yml`) que:

1. **🧪 Testes** (Pull Requests)
   - Executa linting
   - Roda testes unitários
   - Valida build da aplicação

2. **🐳 Build & Push** (Push para main)
   - Build da imagem Docker
   - Tag versionada com SHA do commit
   - Push para Amazon ECR

3. **🚀 Deploy para EKS** (Após build)
   - Configura kubectl
   - Cria deployment se não existir
   - Atualiza imagem do deployment
   - Aguarda rollout completar
   - Verifica health da aplicação

4. **📢 Notificação** (Sempre)
   - Relatório de sucesso/falha
   - Informações do deployment

### Separação de Responsabilidades

**Repositório EKS (`fiap-soat-k8s-terraform`)**:
- ✅ Provisiona cluster EKS via Terraform
- ✅ Aplica infraestrutura K8s (namespace, configmap, secret, service, HPA)

**Repositório Application (este)**:
- ✅ Build e push de imagem Docker
- ✅ Gerencia deployment.yaml
- ✅ Atualiza aplicação no cluster

### Secrets Necessários

Configure no GitHub (`Settings` > `Secrets and variables` > `Actions`):

| Secret | Descrição |
|--------|-----------|
| `AWS_DEFAULT_REGION` | Região AWS (ex: `us-east-1`) |
| `AWS_ACCESS_KEY_ID` | Access Key da AWS |
| `AWS_SECRET_ACCESS_KEY` | Secret Key da AWS |
| `AWS_SESSION_TOKEN` | Session Token (AWS Academy) |

---

## ⚡ Melhorias Implementadas

### ✅ Padronização de Nomenclatura

Todos os recursos Kubernetes agora seguem o padrão `fiap-soat-application-*`:

- Deployment: `fiap-soat-application`
- Service: `fiap-soat-application-service`
- ConfigMap: `fiap-soat-application-config`
- Secret: `fiap-soat-application-secrets`
- Container: `fiap-soat-application`

### ✅ Health Checks

**Liveness Probe**:
- Path: `/health`
- Delay inicial: 30s
- Período: 10s
- Timeout: 5s
- Falhas permitidas: 3

**Readiness Probe**:
- Path: `/health`
- Delay inicial: 10s
- Período: 10s
- Timeout: 5s
- Falhas permitidas: 3

### ✅ Horizontal Pod Autoscaler (HPA)

- **Mínimo**: 1 replica
- **Máximo**: 3 replicas
- **Métricas**: CPU 70%, Memory 80%
- **Gerenciado pelo repositório EKS**

### ✅ Recursos Otimizados

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

---

## 🎓 Observações Acadêmicas

Este projeto demonstra:
- ✅ **Clean Architecture** completa (4 camadas)
- ✅ **CQRS Pattern** (Commands + Queries)
- ✅ **Cloud-Native** (Kubernetes + RDS + Lambda)
- ✅ **Serverless Auth** (Lambda + Cognito)
- ✅ **Fail-Fast Validation** (main.ts)
- ✅ **TypeORM Migrations** (schema versionado)
- ✅ **Swagger Documentation** (OpenAPI 3.0)
- ✅ **Payment Gateway Integration** (Mercado Pago)

---

**📅 Última Atualização**: Janeiro 2025  
**🏆 Tech Challenge FIAP SOAT - Fase 3**

### Objetivos

O serviço de categorias tem como principais objetivos:

1. **Gerenciar categorias**
   - Fornecer API para listagem e consulta de categorias
   - Manter catálogo de categorias versionado via migrations

2. **Suportar integração**
   - Ser consumível por outros serviços do ecossistema

### Funcionalidades Principais

- **Categorias**
  - `GET /categories` — listar categorias
  - `GET /categories/:id` — obter categoria por ID


- **Administração**
  - Manutenção do catálogo de categorias
  - Ferramentas e scripts para gerência de categorias


## Links Importantes
- [Repositório GitHub](https://github.com/fiap-group-273/tech-chalenge)
- [Desenho de Fluxo](https://miro.com/app/board/uXjVJXtfEMw=/?share_link_id=247299580492)
- [Diagrama de Infraestrutura](https://drive.google.com/file/d/12MQ86MMUuziVfoD7i3s9g8UmBE3q78vQ/view?usp=sharing)
- [Vídeo](https://www.youtube.com/watch?v=m_8Sd9t2Jm4)

---

## Desafio SOAT Tech

## Como Executar o Projeto

### Pré-requisitos
- Docker
- Docker Compose
- Make (GNU Make)

#### Instalação do Make

- **macOS** (usando Homebrew):
```bash
brew install make
```

- **Linux** (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install make
```

- **Linux** (Fedora):
```bash
sudo dnf install make
```

- **Windows**:
  - Instale o [Chocolatey](https://chocolatey.org/install)
  - Execute no PowerShell como administrador:
```bash
choco install make
```

### Configuração de Banco de Dados

A aplicação suporta dois modos de execução:
1. **Desenvolvimento Local** - PostgreSQL via Docker Compose
2. **AWS RDS** - PostgreSQL gerenciado na nuvem

#### Arquivos de Configuração

- `.env.local` - Desenvolvimento local com PostgreSQL Docker
- `.env.rds` - Conexão com AWS RDS PostgreSQL
- `.env.example` - Template com todas as variáveis disponíveis

### Execução Local (Docker Compose)

1. **Desenvolvimento Local (Padrão)**:
```bash
# Iniciar com PostgreSQL local
make init
# ou explicitamente
make init-local
```

2. **Conexão com AWS RDS**:
```bash
# Configure primeiro o arquivo .env.rds com as credenciais do RDS
cp .env.example .env.rds
# Edite .env.rds com o endpoint real do RDS

# Inicie com conexão RDS
make init-rds
```

3. **Testar Conexão RDS**:
```bash
# Testa conectividade e roda migrações
make test-rds
```

#### Comandos Úteis

- **Acessar aplicação**: http://localhost:3000
- **Swagger/Docs**: http://localhost:3000/docs  
- **Health Check**: http://localhost:3000/health
- **Database Health**: http://localhost:3000/health/database

```bash
# Criar nova migração
make migrate-create name=nomeDaSuaMigracao

# Limpar containers
make clean

# Logs da aplicação
docker compose logs -f api-dev
```



## Arquitetura Limpa (Clean Architecture)

> **⚠️ Importante**: O projeto segue os princípios da Clean Architecture; o código atual já reflete essa organização.

Este projeto implementa a Arquitetura Limpa, também conhecida como Clean Architecture, é uma forma de organizar o código de um sistema de maneira que ele fique mais desacoplado, testável, sustentável e independente de frameworks, bancos de dados, interfaces gráficas ou outros detalhes externos. A arquitetura é dividida em camadas principais:

### 1. Domínio (Core/Entities)
- Contém as entidades e regras de negócio
- Independente de frameworks e detalhes externos
- Camada mais interna da aplicação

### 2. Aplicação (Use Cases)
- Orquestra o fluxo entre o domínio e o mundo exterior
- Implementa os casos de uso da aplicação
- Define as portas (interfaces) para comunicação com o mundo exterior
- Exemplos:
  - Portas (interfaces) para repositórios e serviços externos
  - Command/Query Handlers
  - Serviços específicos do módulo

### 3. Infraestrutura (Adaptadores)
- Implementa a comunicação com bancos de dados, APIs externas, etc.
- Adapta as interfaces definidas nas camadas internas para tecnologias externas

### 4. Interface (Presenters)
- Responsável por receber e responder requisições externas (ex: controllers, APIs, CLI)
- É a camada mais externa e independente

### Benefícios da Arquitetura Limpa

1. **Independência de Frameworks**
   - O domínio não depende de frameworks externos
   - Fácil trocar tecnologias sem afetar a lógica de negócio

2. **Testabilidade**
   - Domínio pode ser testado isoladamente
   - Adaptadores podem ser mockados facilmente
   - Testes de integração mais focados

3. **Manutenibilidade**
   - Separação clara de responsabilidades
   - Mudanças em uma camada não afetam as outras
   - Código mais organizado e previsível

4. **Flexibilidade**
   - Fácil adicionar novos adaptadores
   - Possibilidade de múltiplas interfaces (REST, GraphQL, CLI)
   - Troca de implementações sem afetar o domínio

### Fluxo de Dados na Arquitetura

1. **Entrada de Dados**
   - Request HTTP → Controller (Interface)
   - Controller valida e transforma os dados
   - Controller chama o caso de uso apropriado

2. **Processamento**
   - Caso de uso orquestra a lógica de negócio
   - Utiliza portas para comunicação com o domínio
   - Domínio executa regras de negócio

3. **Saída de Dados**
   - Domínio retorna resultado
   - Controller transforma o resultado em DTO
   - Resposta HTTP formatada e enviada

### Estrutura do Projeto

```
src/
├── core/                   # Camada de Domínio e Aplicação
│   ├── categories/         # Módulo de Categorias
│   │   ├── entities/       # Entidades de domínio
│   │   ├── operation/      # Casos de uso e controllers
│   │   │   ├── controllers/# Controllers de domínio
│   │   │   ├── gateways/   # Interfaces (portas)
│   │   │   └── presenters/ # Apresentadores
│   │   └── usecases/       # Casos de uso
│   └── common/             # Código compartilhado
├── external/               # Camada de Infraestrutura e Interface
│   ├── api/                # Controllers NestJS (Interface)
│   ├── database/           # Adaptadores de banco de dados
│   ├── gateways/           # Adaptadores de APIs externas
│   └── providers/          # Provedores de serviços
├── interfaces/             # Definições de interfaces
├── app.module.ts           # Módulo principal da aplicação
└── main.ts                 # Ponto de entrada da aplicação
```

### Estrutura dos Módulos

O módulo `categories` segue a arquitetura limpa:

1. **Entities (Domínio)**
   - Contém as entidades e regras de negócio
   - Independente de frameworks externos
   - Não define interfaces externas

2. **Use Cases (Aplicação)**
   - Implementa os casos de uso
   - Define as portas (interfaces) para comunicação externa
   - Implementa o padrão CQRS com commands e queries
   - Serviços específicos do módulo

3. **Infrastructure (Adaptadores)**
   - Implementa os adaptadores de persistência
   - Gerencia a comunicação com o banco de dados

4. **Presenters (Interface)**
   - Contém os controllers HTTP
   - Gerencia a apresentação dos dados
   - Implementa os endpoints REST

### Padrão CQRS (Command Query Responsibility Segregation)

O projeto implementa o padrão CQRS, que separa as operações de leitura (queries) e escrita (commands) em diferentes modelos:

1. **Commands (Comandos)**
   - Responsáveis por operações de escrita
   - Modificam o estado da aplicação
   - Exemplo: Criar categoria, Atualizar pagamento
   - Localização: `usecases/commands/`

2. **Queries (Consultas)**
   - Responsáveis por operações de leitura
   - Não modificam o estado
   - Exemplo: Buscar categorias, Consultar pagamento
   - Localização: `usecases/queries/`

3. **Benefícios do CQRS**
   - Separação clara entre leitura e escrita
   - Otimização independente para cada tipo de operação
   - Melhor escalabilidade
   - Código mais organizado e manutenível

## Integração com Mercado Pago

### Credenciais de Teste

Para testar as integrações com o Mercado Pago, utilize as seguintes credenciais:

```
Usuário de Teste: TESTUSER501385545
Senha: vZuULBwsJJ
```

### Observações sobre o Ambiente de Teste

- As credenciais acima são exclusivas para o ambiente de sandbox
- Transações realizadas não geram cobranças reais
- Cartões de teste disponíveis no ambiente de sandbox do Mercado Pago
- Recomendado para desenvolvimento e testes

## Integração AWS RDS

### Pré-requisitos

1. **RDS Provisionado**: O banco RDS PostgreSQL deve estar criado via Terraform
   - Repositório: [fiap-soat-database-terraform](https://github.com/3-fase-fiap-soat-team/fiap-soat-database-terraform)
   - Responsável: Dev 1 (MathLuchiari)

2. **Credenciais AWS**: Configure o AWS CLI ou use variáveis de ambiente

### Configuração RDS

```bash
# 1. Obter endpoint do RDS (após provisionar via Terraform)
aws rds describe-db-instances --db-instance-identifier fiap-soat-db

# 2. Configurar arquivo .env.rds
DATABASE_HOST=fiap-soat-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_USERNAME=postgresadmin
DATABASE_PASSWORD=SuperSecret123!
DATABASE_NAME=fiapdb_dev
DATABASE_SSL=true
```

### Características RDS

- **Instância**: db.t3.micro (Free Tier)
- **Engine**: PostgreSQL 17.4
- **Storage**: 20GB GP2
- **SSL**: Obrigatório para conexões
- **Backup**: 7 dias de retenção
- **Multi-AZ**: Desabilitado (economia AWS Academy)

### Troubleshooting

```bash
# Verificar conectividade
make test-rds

# Health check detalhado
curl http://localhost:3000/health/database

# Logs de conexão
docker compose --profile rds logs api-rds

# Testar SSL
openssl s_client -connect your-rds-endpoint:5432 -starttls postgres
```

### Segurança

- ✅ **SSL/TLS obrigatório** para conexões RDS
- ✅ **VPC isolada** com subnets privadas
- ✅ **Security Groups** restritivos
- ✅ **Credenciais via** arquivos .env (desenvolvimento)
- 🔄 **TODO**: Migrar para AWS Secrets Manager (produção)

## Evidência de execução dos testes
<img width="1629" height="1013" alt="image" src="https://github.com/user-attachments/assets/de4f488e-8f14-41fe-b511-25e2d3a5e7f4" />

