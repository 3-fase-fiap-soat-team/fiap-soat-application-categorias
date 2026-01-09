# 🚀 Estratégia de CI/CD - Deploy Automático no EKS

## 📋 Visão Geral

Pipeline automatizada que faz **build, test e deploy** da aplicação no EKS sempre que houver push para `main`.

---

## 🔄 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                        CI/CD PIPELINE                           │
└─────────────────────────────────────────────────────────────────┘

1️⃣  PUSH para main
      │
      ├─── src/**, Dockerfile, package.json
      │
      ▼
2️⃣  GitHub Actions (Trigger)
      │
      ├─── .github/workflows/ci-cd-eks.yml
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│ JOB 1: 🧪 TEST (Pull Request)                                  │
├─────────────────────────────────────────────────────────────────┤
│  ✅ npm ci (install dependencies)                              │
│  ✅ npm run lint (code quality)                                │
│  ✅ npm run test (unit tests)                                  │
│  ✅ npm run build (compilation check)                          │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│ JOB 2: 🐳 BUILD & PUSH (main branch only)                      │
├─────────────────────────────────────────────────────────────────┤
│  1. Configure AWS Credentials                                  │
│  2. Login to ECR                                               │
│  3. Build Docker image                                         │
│     - Tag: <account>.dkr.ecr.us-east-1.amazonaws.com/         │
│              fiap-soat-application:<SHORT_SHA>                 │
│     - Tag: <account>.dkr.ecr.us-east-1.amazonaws.com/         │
│              fiap-soat-application:latest                      │
│  4. Push to ECR                                                │
│  5. Generate image metadata                                    │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│ JOB 3: 🚀 DEPLOY to EKS (main branch only)                     │
├─────────────────────────────────────────────────────────────────┤
│  1. Configure kubectl                                          │
│     └─ aws eks update-kubeconfig --name fiap-soat-eks-dev     │
│                                                                 │
│  2. Update Deployment                                          │
│     └─ kubectl set image deployment/fiap-soat-application     │
│        fiap-soat-application=<ECR_IMAGE>:<SHORT_SHA>          │
│                                                                 │
│  3. Wait for Rollout                                           │
│     └─ kubectl rollout status (timeout: 10min)                │
│                                                                 │
│  4. Verify Pods                                                │
│     └─ kubectl get pods -n fiap-soat-app                      │
│                                                                 │
│  5. Health Check                                               │
│     └─ curl http://<LOAD_BALANCER>/health                     │
│                                                                 │
│  6. Generate Summary                                           │
│     └─ GitHub Actions Summary with deployment info            │
└─────────────────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│ JOB 4: 📢 NOTIFY (always)                                      │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Success: Log deployment details                            │
│  ❌ Failure: Exit with error code                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Quando a Pipeline Executa

### **Triggers:**

1. **Push para `main`** (Deploy completo):
   ```bash
   git push origin main
   ```
   - ✅ Executa: Build + Push ECR + Deploy EKS
   - 🎯 Objetivo: Atualizar aplicação em produção

2. **Pull Request para `main`** (Apenas testes):
   ```bash
   git push origin feature/nova-feature
   # Abrir PR para main
   ```
   - ✅ Executa: Apenas testes (lint + test + build)
   - 🎯 Objetivo: Validar código antes do merge

3. **Manual Dispatch** (Workflow manual):
   - Via GitHub Actions UI
   - ✅ Executa: Fluxo completo

### **Paths que disparam a pipeline:**
```yaml
paths:
  - 'src/**'           # Qualquer código fonte
  - 'Dockerfile'       # Mudanças no container
  - 'package.json'     # Dependências
  - '.github/workflows/ci-cd-eks.yml'  # Pipeline
```

---

## 🔐 Configuração de Secrets

### **Repositório fiap-soat-application:**

No GitHub: **Settings → Secrets and variables → Actions**

```bash
AWS_DEFAULT_REGION=us-east-1
AWS_ACCESS_KEY_ID=<sua-access-key>
AWS_SECRET_ACCESS_KEY=<sua-secret-key>
AWS_SESSION_TOKEN=<seu-session-token>  # AWS Academy
```

⚠️ **Importante:** AWS Academy = Credenciais expiram a cada 3h

---

## 📦 ECR Image Tagging Strategy

### **Estratégia de Tags:**

```bash
# Tag com SHA curto (7 caracteres)
280273007505.dkr.ecr.us-east-1.amazonaws.com/fiap-soat-application:a1b2c3d

# Tag latest (sempre aponta para último push)
280273007505.dkr.ecr.us-east-1.amazonaws.com/fiap-soat-application:latest
```

### **Benefícios:**

✅ **Rastreabilidade**: Cada imagem vinculada a commit específico  
✅ **Rollback fácil**: Pode reverter para SHA anterior  
✅ **Latest atualizado**: Sempre aponta para versão mais recente  
✅ **Histórico completo**: Todas as imagens preservadas no ECR

---

## 🔄 Kubernetes Rolling Update

### **Como funciona:**

```yaml
# deployment.yaml
spec:
  replicas: 2  # (Recomendado aumentar de 1 para 2)
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0     # Sempre mantém pelo menos 1 pod rodando
      maxSurge: 1           # Cria 1 pod extra durante deploy
```

### **Fluxo de atualização:**

1. **Pod atual rodando**: `fiap-soat-application-abc123` (imagem antiga)
2. **Pipeline atualiza**: `kubectl set image deployment/...`
3. **Kubernetes cria novo pod**: `fiap-soat-application-def456` (imagem nova)
4. **Aguarda novo pod ficar Ready**: Health checks passando
5. **Termina pod antigo**: Graceful shutdown
6. **Atualização completa**: Zero downtime! ✅

---

## 🧪 Testando a Pipeline

### **1. Fazer uma mudança simples:**

```bash
cd /home/rafae/fiap-arch-software/fiap-soat-application

# Editar algum arquivo
echo "// Pipeline test" >> src/main.ts

# Commit e push
git add .
git commit -m "test: testar pipeline CI/CD"
git push origin main
```

### **2. Acompanhar execução:**

- Ir para: **GitHub → fiap-soat-application → Actions**
- Clicar no workflow em execução
- Ver logs em tempo real

### **3. Verificar deploy no EKS:**

```bash
# Ver rollout em andamento
kubectl rollout status deployment/fiap-soat-application -n fiap-soat-app

# Ver pods (deve ter um novo sendo criado)
kubectl get pods -n fiap-soat-app -w

# Ver eventos
kubectl get events -n fiap-soat-app --sort-by='.lastTimestamp'
```

---

## 🎛️ Melhorias Recomendadas

### **1. Aumentar Replicas (Zero Downtime)**

```yaml
# manifests/deployment.yaml
spec:
  replicas: 2  # Alterar de 1 para 2
```

**Benefício:** Durante deploy, sempre haverá pelo menos 1 pod respondendo.

### **2. Adicionar Readiness/Liveness Probes**

```yaml
# manifests/deployment.yaml
spec:
  containers:
  - name: fiap-soat-application
    livenessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 5
```

**Benefício:** Kubernetes só redireciona tráfego quando pod está realmente pronto.

### **3. Resource Limits**

```yaml
# manifests/deployment.yaml
spec:
  containers:
  - name: fiap-soat-application
    resources:
      requests:
        memory: "256Mi"
        cpu: "250m"
      limits:
        memory: "512Mi"
        cpu: "500m"
```

**Benefício:** Evita que um pod consuma todos os recursos do node.

### **4. ConfigMap para Variáveis Não-Secretas**

```yaml
# manifests/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: fiap-soat-app
data:
  NODE_ENV: "production"
  DATABASE_SSL: "true"
  LOG_LEVEL: "info"
```

**Benefício:** Separar configuração de código.

### **5. PodDisruptionBudget**

```yaml
# manifests/pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: fiap-soat-pdb
  namespace: fiap-soat-app
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: fiap-soat-application
```

**Benefício:** Garante disponibilidade durante manutenções do cluster.

---

## 🚨 Troubleshooting

### **Pipeline falha no Build:**

```bash
# Erro comum: Dependências desatualizadas
npm ci --force

# Ou limpar cache do GitHub Actions:
# Settings → Actions → Caches → Delete cache
```

### **Pipeline falha no Push ECR:**

```bash
# Erro: ECR repository não existe
aws ecr create-repository \
  --repository-name fiap-soat-application \
  --region us-east-1

# Erro: Credenciais expiradas (AWS Academy)
# Renovar credenciais no AWS Academy Learner Lab
```

### **Deploy falha no EKS:**

```bash
# Erro: kubectl não consegue conectar
aws eks update-kubeconfig \
  --region us-east-1 \
  --name fiap-soat-eks-dev

# Erro: Image pull error
# Verificar se ECR tem a imagem
aws ecr list-images \
  --repository-name fiap-soat-application \
  --region us-east-1
```

### **Health check falha:**

```bash
# Ver logs do pod
kubectl logs -n fiap-soat-app deployment/fiap-soat-application --tail=100

# Verificar variáveis de ambiente
kubectl exec -n fiap-soat-app deployment/fiap-soat-application -- env | grep DATABASE

# Testar conectividade RDS
kubectl exec -it deployment/fiap-soat-application -n fiap-soat-app -- \
  sh -c 'curl -v telnet://$DATABASE_HOST:$DATABASE_PORT'
```

---

## 📊 Monitoramento

### **Ver histórico de deploys:**

```bash
# Histórico de rollouts
kubectl rollout history deployment/fiap-soat-application -n fiap-soat-app

# Ver revisão específica
kubectl rollout history deployment/fiap-soat-application \
  -n fiap-soat-app --revision=2
```

### **Ver anotações do deployment:**

```bash
kubectl describe deployment fiap-soat-application -n fiap-soat-app | grep -A 5 Annotations
```

### **Reverter deploy (rollback):**

```bash
# Voltar para revisão anterior
kubectl rollout undo deployment/fiap-soat-application -n fiap-soat-app

# Voltar para revisão específica
kubectl rollout undo deployment/fiap-soat-application \
  -n fiap-soat-app --to-revision=1
```

---

## 🎓 Para Apresentação Acadêmica

### **Demonstre:**

1. **Git Workflow** 📝
   ```bash
   git commit -m "feat: nova funcionalidade"
   git push origin main
   ```

2. **GitHub Actions** 🤖
   - Mostre a pipeline executando
   - Explique cada job (Test → Build → Deploy)

3. **ECR Images** 🐳
   ```bash
   aws ecr describe-images --repository-name fiap-soat-application
   ```

4. **Kubernetes Rollout** ⚙️
   ```bash
   kubectl rollout status deployment/fiap-soat-application -n fiap-soat-app
   kubectl get pods -n fiap-soat-app -w
   ```

5. **Zero Downtime** ✅
   ```bash
   # Em um terminal: watch curl http://<LB>/health
   # Em outro terminal: git push origin main
   # Resultado: Nenhuma requisição falha durante deploy!
   ```

---

## 💡 Dicas Importantes

### **AWS Academy (Credenciais temporárias):**

⚠️ **Credenciais expiram a cada 3h**

**Solução:**
1. Renovar credenciais no AWS Learner Lab
2. Atualizar GitHub Secrets
3. Re-executar workflow falhado

### **Custos:**

| Recurso | Custo |
|---------|-------|
| ECR Storage | ~$0.10/GB/mês |
| GitHub Actions | Grátis (público) ou 2000 min/mês (privado) |
| Data Transfer | ~$0.09/GB (out) |

**Total estimado:** < $1/mês (imagens pequenas)

---

## ✅ Checklist de Implementação

- [ ] Criar ECR repository
- [ ] Configurar GitHub Secrets
- [ ] Criar arquivo `.github/workflows/ci-cd-eks.yml`
- [ ] Aumentar replicas para 2 (deployment.yaml)
- [ ] Adicionar probes (liveness/readiness)
- [ ] Testar pipeline com commit simples
- [ ] Verificar rollout no EKS
- [ ] Documentar processo no README

---

**🚀 Com essa pipeline, todo push para `main` faz deploy automático no EKS!**

**📚 Referências:**
- [GitHub Actions](https://docs.github.com/en/actions)
- [AWS ECR](https://docs.aws.amazon.com/ecr/)
- [Kubernetes Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
