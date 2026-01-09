# 🔄 Estratégia CI/CD - Análise de Alinhamento

**Data**: Janeiro 2025  
**Objetivo**: Garantir que os workflows dos repositórios EKS e Application estejam 100% alinhados

---

## 📊 Análise dos Workflows Existentes

### 1. **Workflow EKS** (`fiap-soat-k8s-terraform/.github/workflows/deploy-app.yml`)

```yaml
Trigger: 
  - Push para main (paths: manifests/**, workflow)
  - workflow_dispatch (manual)

Responsabilidades:
  ✅ Aplicar manifests Kubernetes (namespace, configmap, secret, deployment, service)
  ✅ Aguardar rollout (kubectl rollout status)
  ✅ Verificar deployment (pods, services, logs, events)
  ✅ Health check via port-forward

Nome do Deployment: fiap-soat-nestjs
Namespace: fiap-soat-app
```

### 2. **Workflow Application** (`fiap-soat-application/.github/workflows/ci-cd-eks.yml`)

```yaml
Trigger:
  - Push para main (paths: src/**, Dockerfile, package.json)
  - Pull Request para main
  - workflow_dispatch (manual)

Responsabilidades:
  ✅ Testes (unit, lint) - apenas em PR
  ✅ Build Docker image
  ✅ Push para ECR (tag: short-sha e latest)
  ✅ Deploy no EKS (kubectl set image)
  ✅ Aguardar rollout
  ✅ Health check via Load Balancer

Nome do Deployment: fiap-soat-application
Namespace: fiap-soat-app
```

---

## ⚠️ **PROBLEMAS IDENTIFICADOS:**

### 1. **Nomes de Deployment Diferentes** ❌

```diff
# Repo EKS (deploy-app.yml):
- kubectl rollout status deployment/fiap-soat-nestjs

# Repo Application (ci-cd-eks.yml):
+ kubectl set image deployment/fiap-soat-application
```

**Problema**: Os workflows referenciam nomes de deployment diferentes!

**Impacto**: 
- Workflow do EKS não vai atualizar o deployment correto
- Pode criar 2 deployments no mesmo namespace
- Confusão sobre qual é o deployment real

---

### 2. **Manifests vs. kubectl set image** ⚠️

**Repo EKS**:
```bash
kubectl apply -f deployment.yaml  # Aplica manifest com imagem hardcoded
```

**Repo Application**:
```bash
kubectl set image deployment/...  # Atualiza imagem dinamicamente
```

**Problema**: 
- Workflow EKS sempre vai aplicar a imagem que está no `deployment.yaml`
- Workflow Application atualiza a imagem via `kubectl set image`
- Se ambos rodarem, a imagem do manifest vai sobrescrever a do CI/CD

---

### 3. **Ordem de Execução Não Definida** ⚠️

Se ambos workflows rodarem ao mesmo tempo:
1. Workflow Application → Build nova imagem → Deploy
2. Workflow EKS → Apply manifests → Sobrescreve com imagem antiga

**Resultado**: Deploy da imagem nova é perdido!

---

## ✅ **SOLUÇÃO PROPOSTA:**

### **Estratégia: Separação de Responsabilidades**

```
┌─────────────────────────────────────────────────────────────────┐
│  REPO: fiap-soat-k8s-terraform                                  │
│  WORKFLOW: deploy-app.yml                                       │
├─────────────────────────────────────────────────────────────────┤
│  RESPONSABILIDADE:                                              │
│    • Aplicar/Atualizar CONFIGURAÇÕES (configmap, secret)        │
│    • Aplicar/Atualizar ESTRUTURA (namespace, service)           │
│    • NÃO aplicar deployment.yaml (deixar para o repo app)       │
│                                                                 │
│  TRIGGER:                                                       │
│    • Push para main em manifests/configmap.yaml                │
│    • Push para main em manifests/secret.yaml                   │
│    • Push para main em manifests/service.yaml                  │
│    • workflow_dispatch (manual)                                 │
│                                                                 │
│  AÇÕES:                                                         │
│    kubectl apply -f namespace.yaml                              │
│    kubectl apply -f configmap.yaml                              │
│    kubectl apply -f secret.yaml                                 │
│    kubectl apply -f service.yaml                                │
│    # NÃO aplicar deployment.yaml                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  REPO: fiap-soat-application                                    │
│  WORKFLOW: ci-cd-eks.yml                                        │
├─────────────────────────────────────────────────────────────────┤
│  RESPONSABILIDADE:                                              │
│    • Build da aplicação (Docker image)                          │
│    • Push para ECR                                              │
│    • Deploy/Atualizar DEPLOYMENT com nova imagem                │
│                                                                 │
│  TRIGGER:                                                       │
│    • Push para main em src/**                                   │
│    • Push para main em Dockerfile                               │
│    • Push para main em package.json                             │
│    • workflow_dispatch (manual)                                 │
│                                                                 │
│  AÇÕES:                                                         │
│    docker build + push to ECR                                   │
│    kubectl set image deployment/fiap-soat-application ...       │
│    kubectl rollout status ...                                   │
│    Health check                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 **MUDANÇAS NECESSÁRIAS:**

### 1. **Padronizar Nome do Deployment** ✅

Escolher **UM** nome e usar em todos os lugares:

**Opção Recomendada**: `fiap-soat-application`

```bash
# Arquivos a atualizar:
✅ fiap-soat-k8s-terraform/manifests/deployment.yaml
   metadata.name: fiap-soat-application
   
✅ fiap-soat-k8s-terraform/manifests/service.yaml
   spec.selector.app: fiap-soat-application
   
✅ fiap-soat-k8s-terraform/.github/workflows/deploy-app.yml
   kubectl rollout status deployment/fiap-soat-application
```

---

### 2. **Atualizar Workflow EKS** ✅

```yaml
# deploy-app.yml - ANTES:
- name: Deploy Kubernetes Manifests
  run: |
    kubectl apply -f namespace.yaml
    kubectl apply -f configmap.yaml
    kubectl apply -f secret.yaml
    kubectl apply -f deployment.yaml  # ❌ REMOVER
    kubectl apply -f service.yaml

# deploy-app.yml - DEPOIS:
- name: Deploy Infrastructure Manifests
  run: |
    echo "📦 Aplicando manifests de infraestrutura..."
    kubectl apply -f namespace.yaml
    kubectl apply -f configmap.yaml
    kubectl apply -f secret.yaml
    kubectl apply -f service.yaml
    # deployment.yaml é gerenciado pelo repo da aplicação
```

---

### 3. **Criar/Atualizar deployment.yaml no Repo Application** ✅

Mover `deployment.yaml` para o repo da aplicação:

```bash
# Estrutura:
fiap-soat-application/
├── .github/workflows/ci-cd-eks.yml
├── k8s/
│   └── deployment.yaml          # ← Manifest do deployment
├── src/
├── Dockerfile
└── package.json
```

**Vantagens**:
- Deployment fica junto com o código
- Facilita sincronização entre código e deploy
- Evita conflitos entre workflows

---

### 4. **Atualizar Workflow Application para Criar Deployment na Primeira Vez** ✅

```yaml
# ci-cd-eks.yml - Adicionar step:
- name: Ensure Deployment Exists
  run: |
    if ! kubectl get deployment ${{ env.K8S_DEPLOYMENT }} -n ${{ env.K8S_NAMESPACE }} &> /dev/null; then
      echo "📦 Deployment não existe, criando pela primeira vez..."
      kubectl apply -f k8s/deployment.yaml
    else
      echo "✅ Deployment já existe, atualizando imagem..."
    fi

- name: Update Deployment Image
  run: |
    kubectl set image deployment/${{ env.K8S_DEPLOYMENT }} ...
```

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO:**

### Fase 1: Padronização de Nomes
- [ ] Atualizar `manifests/deployment.yaml` → `fiap-soat-application`
- [ ] Atualizar `manifests/service.yaml` → selector: `fiap-soat-application`
- [ ] Atualizar workflow EKS → `fiap-soat-application`

### Fase 2: Separação de Responsabilidades
- [ ] Remover `deployment.yaml` do workflow EKS
- [ ] Mover `deployment.yaml` para repo da aplicação (pasta `k8s/`)
- [ ] Atualizar workflow Application para criar deployment se não existir

### Fase 3: Validação
- [ ] Testar workflow EKS (deve aplicar configs, não deployment)
- [ ] Testar workflow Application (deve criar/atualizar deployment)
- [ ] Verificar que ambos workflows não conflitam

---

## 🎯 **FLUXO COMPLETO APÓS IMPLEMENTAÇÃO:**

### **Cenário 1: Mudança de Configuração (configmap, secret)**

```bash
1. Dev altera manifests/configmap.yaml
2. Push para main no repo EKS
3. Workflow deploy-app.yml executa:
   ✅ kubectl apply -f configmap.yaml
   ✅ kubectl apply -f secret.yaml
   ⏭️  Não toca no deployment
4. Dev precisa fazer rollout manual:
   kubectl rollout restart deployment/fiap-soat-application -n fiap-soat-app
```

### **Cenário 2: Mudança de Código (src/, Dockerfile)**

```bash
1. Dev altera src/main.ts
2. Push para main no repo Application
3. Workflow ci-cd-eks.yml executa:
   ✅ Build Docker image (tag: abc123)
   ✅ Push para ECR
   ✅ kubectl set image deployment/fiap-soat-application ...abc123
   ✅ Rollout automático
4. Nova versão deployed!
```

### **Cenário 3: Primeira Instalação (cluster novo)**

```bash
1. Deploy infraestrutura:
   cd fiap-soat-k8s-terraform
   git push origin main  # workflow aplica namespace, configmap, secret, service

2. Deploy aplicação:
   cd fiap-soat-application
   git push origin main  # workflow cria deployment + atualiza imagem
```

---

## 📊 **COMPARAÇÃO: ANTES vs DEPOIS**

| Aspecto | ANTES (Atual) | DEPOIS (Proposto) |
|---------|---------------|-------------------|
| Nome deployment | Inconsistente (fiap-soat-nestjs vs fiap-soat-application) | Padronizado: fiap-soat-application ✅ |
| Responsabilidade EKS | Aplica TODOS manifests (incluindo deployment) | Aplica APENAS configs (namespace, configmap, secret, service) ✅ |
| Responsabilidade App | Build + kubectl set image | Build + kubectl apply/set image ✅ |
| Conflitos | Workflows podem sobrescrever um ao outro ❌ | Separação clara de responsabilidades ✅ |
| deployment.yaml | No repo EKS (longe do código) | No repo Application (junto com código) ✅ |
| Sincronização | Manual | Automática ✅ |

---

## ⚠️ **IMPORTANTE:**

### **Ordem de Deploy Inicial (cluster novo):**

```bash
# 1. Infraestrutura PRIMEIRO (repo EKS)
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f service.yaml

# 2. Aplicação DEPOIS (repo Application)
# Workflow Application vai criar o deployment com a imagem correta
```

### **Regra de Ouro:**

```
🚨 NUNCA aplique deployment.yaml manualmente depois do primeiro deploy!
   O CI/CD da aplicação é a fonte da verdade para a imagem.
```

---

## 🎓 **BENEFÍCIOS DA ESTRATÉGIA:**

1. ✅ **Separação Clara**: Infraestrutura vs Aplicação
2. ✅ **Sem Conflitos**: Workflows não sobrescrevem um ao outro
3. ✅ **Versionamento Correto**: Imagem sempre sincronizada com código
4. ✅ **Rastreabilidade**: Git commit → Docker tag → Deployment
5. ✅ **Escalabilidade**: Adicionar novas aplicações sem conflito

---

## 📝 **PRÓXIMOS PASSOS:**

1. Implementar padronização de nomes
2. Atualizar workflow EKS (remover deployment.yaml)
3. Mover deployment.yaml para repo Application
4. Atualizar workflow Application (criar deployment se não existir)
5. Testar fluxo completo
6. Documentar no README

---

**🎯 Resultado Final**: Workflows 100% alinhados, sem conflitos, e com responsabilidades claramente definidas!