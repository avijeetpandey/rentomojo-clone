# Rentomojo Clone — Kubernetes Manifests

Standard raw Kubernetes manifests (no Helm). Tested with kubectl 1.29 + nginx-ingress-controller.

## Directory layout

```
infra/k8s/
├── namespace.yaml          # rentomojo namespace
├── configmap.yaml          # Non-secret env vars (NODE_ENV, ports, DB coords, CORS)
├── secret.yaml             # JWT_SECRET + POSTGRES_PASSWORD (base64 stubs — replace!)
├── ingress.yaml            # nginx Ingress: /api → backend-svc, / → client-svc
├── postgres/
│   ├── pvc.yaml            # 5Gi ReadWriteOnce PersistentVolumeClaim
│   ├── deployment.yaml     # Postgres 16-alpine (Recreate strategy)
│   └── service.yaml        # ClusterIP :5432 → postgres-svc
├── backend/
│   ├── deployment.yaml     # 2 replicas, RollingUpdate; initContainer runs `prisma migrate deploy`
│   ├── service.yaml        # ClusterIP :4000 → backend-svc
│   └── pdb.yaml            # PodDisruptionBudget minAvailable=1
└── client/
    ├── deployment.yaml     # 2 replicas, RollingUpdate; nginx serving the React SPA
    ├── service.yaml        # ClusterIP :80 → client-svc
    └── pdb.yaml            # PodDisruptionBudget minAvailable=1
```

## Prerequisites

- `kubectl` configured against your cluster
- nginx ingress controller installed (`kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/...`)
- (Optional) cert-manager for automatic TLS

## Apply order

```bash
# 1. Namespace first
kubectl apply -f infra/k8s/namespace.yaml

# 2. Config then secrets (update secret.yaml with real values first!)
kubectl apply -f infra/k8s/configmap.yaml
kubectl apply -f infra/k8s/secret.yaml

# 3. Database
kubectl apply -f infra/k8s/postgres/

# 4. Wait for Postgres to be Ready
kubectl rollout status deployment/postgres -n rentomojo

# 5. Backend (migration initContainer runs automatically)
kubectl apply -f infra/k8s/backend/

# 6. Frontend
kubectl apply -f infra/k8s/client/

# 7. Ingress
kubectl apply -f infra/k8s/ingress.yaml

# Or just run:
make k8s-apply
```

## Updating secrets for production

```bash
# Generate proper base64:
echo -n 'your-strong-jwt-secret' | base64
echo -n 'your-db-password' | base64

# Then edit infra/k8s/secret.yaml and re-apply, or use Sealed Secrets / Vault.
```

## Scaling

```bash
kubectl scale deployment/rentomojo-backend --replicas=4 -n rentomojo
kubectl scale deployment/rentomojo-client  --replicas=4 -n rentomojo
```

## Image tags

Replace `ghcr.io/your-org/rentomojo-backend:latest` and `ghcr.io/your-org/rentomojo-client:latest`
in the deployment YAML files with your actual registry + image + tag before applying.

