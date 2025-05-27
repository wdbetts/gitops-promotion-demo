#!/bin/bash

echo "========================================"
echo "GitOps Promotion Demo with ArgoCD Source Hydrator"
echo "========================================"
echo "This script will demonstrate promoting an application through:"
echo "  1. DEV environment (from main branch)"
echo "  2. STAGING environment (from dev environment)"
echo "  3. PRODUCTION environment (from staging environment)"
echo "========================================"

# Check if ArgoCD is installed and running
if ! command -v argocd &> /dev/null; then
    echo "ArgoCD CLI is not installed. Please install it first."
    exit 1
fi

# Create namespaces if they don't exist
echo "Creating namespaces..."
kubectl create namespace dev --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace staging --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace prod --dry-run=client -o yaml | kubectl apply -f -

# Create the required branches if they don't exist
echo "Creating environment branches..."
git branch -f environments/dev HEAD || true
git branch -f environments/staging environments/dev || true
git branch -f environments/prod environments/staging || true

# Push all branches
git push origin environments/dev environments/staging environments/prod -f

# Apply the ArgoCD applications
echo "Creating ArgoCD applications..."
kubectl apply -f apps/guestbook-dev.yaml
kubectl apply -f apps/guestbook-staging.yaml
kubectl apply -f apps/guestbook-prod.yaml

# Wait for applications to sync
echo "Waiting for initial sync..."
argocd app wait helm-guestbook-dev helm-guestbook-staging helm-guestbook-prod --timeout 300

# Wait a moment for services to be created
sleep 10

# Get service URLs
echo "Getting service URLs..."
DEV_PORT=$(kubectl get svc -n dev gitops-demo-guestbook -o jsonpath='{.spec.ports[0].nodePort}')
STAGING_PORT=$(kubectl get svc -n staging gitops-demo-guestbook -o jsonpath='{.spec.ports[0].nodePort}')
PROD_PORT=$(kubectl get svc -n prod gitops-demo-guestbook -o jsonpath='{.spec.ports[0].nodePort}')

echo -e "\n\n========================================"
echo "Demo Setup Complete!"
echo "========================================"
echo "Your applications are now deployed and will sync automatically:"
echo "  - Dev (from main): http://localhost:$DEV_PORT"
echo "  - Staging (from dev): http://localhost:$STAGING_PORT"
echo "  - Prod (from staging): http://localhost:$PROD_PORT"
echo ""
echo "To promote changes:"
echo "1. Make changes to the main branch and push"
echo "2. ArgoCD will automatically sync dev environment"
echo "3. To promote to staging: git push origin environments/dev:environments/staging"
echo "4. To promote to prod: git push origin environments/staging:environments/prod"
echo "========================================"
