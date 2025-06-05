summary: GitOps Promotion with ArgoCD and Source Hydrator
id: gitops-promotion
authors: GitOps Team
status: Published

# GitOps Promotion with ArgoCD and Source Hydrator Tutorial

## Step 1: Introduction

This tutorial demonstrates how to implement a GitOps-based promotion workflow using ArgoCD with Source Hydrator and GitOps Promoter. You'll learn how to automate the promotion of applications from development to staging to production environments while maintaining a clear change history and approval process.

The demo showcases:
- Environment branch-based deployment strategy
- Automated synchronization between environments
- Separate configuration for development, staging, and production
- Pull request-based promotion workflow with automated checks

By the end of this tutorial, you'll have a fully functional GitOps promotion pipeline running in your local Kubernetes cluster.

## Step 2: Prerequisites

Before starting this tutorial, ensure you have the following tools installed:

* **kubectl** - Command-line tool for interacting with Kubernetes clusters
* **k3d** or **Docker Desktop with Kubernetes** - For running a local Kubernetes cluster
* **GitHub Account** - Required for repository hosting and GitHub App creation
* **git** - Version control system
* **helm** - Package manager for Kubernetes

You'll also need an existing local Kubernetes cluster. This tutorial was tested with Docker Desktop's Kubernetes feature, but any local cluster should work.

## Step 3: Setting up the Environment

### Clone and Fork the Repository

1. Fork the repository on GitHub:
   - Go to https://github.com/argoproj-labs/gitops-promotion-demo
   - Click the "Fork" button in the top right
   - Follow the prompts to create a fork in your account

2. Clone your fork locally:

```bash
# Replace YOUR_GITHUB_USERNAME with your actual GitHub username
git clone https://github.com/YOUR_GITHUB_USERNAME/gitops-promotion-demo.git
cd gitops-promotion-demo
```

The repository already contains all necessary files including:
- **Application code** in `app/` directory with Dockerfile and package.json
- **Helm chart** in `helm-guestbook/` with environment-specific values files
- **Build script** `build-and-push.sh` for creating Docker images
- **GitOps Promoter configs** in `promoter/` directory

## Step 4: Installing Core Components

### Install ArgoCD with Source Hydrator

```bash
# Create argocd namespace and install ArgoCD with Source Hydrator
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install-with-hydrator.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Get the initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Access ArgoCD UI (in a separate terminal)
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Access the ArgoCD UI at https://localhost:8080 with username `admin` and the password from above.

### Install GitOps Promoter

```bash
kubectl apply -f https://github.com/argoproj-labs/gitops-promoter/releases/download/v0.4.0/install.yaml

# Verify installation
kubectl get pods -n promoter-system
```

## Step 5: Configuring GitOps Promoter

### Create a GitHub App

1. Navigate to GitHub: Settings > Developer settings > GitHub Apps > New GitHub App
2. Fill in the required fields:
   - GitHub App name: `GitOps Promoter Demo`
   - Homepage URL: Your repository URL
   - Repository permissions: Contents (Read & write), Pull requests (Read & write), Commit statuses (Read & write)
   - Install only on your account
3. Click "Create GitHub App" and note the **App ID**
4. Generate and download a **private key**
5. Install the app on your forked repository

### Configure GitOps Promoter Resources

The repository includes template files in the `promoter/` directory. Update them with your credentials:

```bash
# Create secret with your GitHub App private key
kubectl create secret generic github-app-credentials \
  --from-file=githubAppPrivateKey=/path/to/your/downloaded-key.pem

# Update git-resources.yaml with your GitHub App ID and username
sed -i 's/YOUR_GITHUB_APP_ID/YOUR_ACTUAL_APP_ID/' promoter/git-resources.yaml
sed -i 's/YOUR_GITHUB_USERNAME/YOUR_ACTUAL_USERNAME/' promoter/git-resources.yaml

# Apply GitOps Promoter configuration
kubectl apply -f promoter/git-resources.yaml
kubectl apply -f promoter/promotion-strategy.yaml
kubectl apply -f promoter/argocd-commitstatus.yaml
```

## Step 6: Building and Deploying the Application

### Build the Application Image

The repository includes a ready-to-use Node.js application and build script:

```bash
# Build and push the application image
./build-and-push.sh 1.0.0
```

This creates a Docker image that displays different content based on environment variables (`APP_VERSION` and `APP_ENVIRONMENT`).

### Create Environment Branches and Deploy

```bash
# Create environment branches
git branch -f environments/dev HEAD
git branch -f environments/staging environments/dev
git branch -f environments/prod environments/staging
git push origin environments/dev environments/staging environments/prod -f

# Create Kubernetes namespaces
kubectl create namespace guestbook-dev
kubectl create namespace guestbook-staging
kubectl create namespace guestbook-prod

# Update ApplicationSet with your GitHub username
sed -i 's/wdbetts/YOUR_GITHUB_USERNAME/' guestbook-appset.yaml

# Deploy ArgoCD ApplicationSet
kubectl apply -f guestbook-appset.yaml
```

### Access Your Applications

```bash
# Get service URLs for each environment
DEV_PORT=$(kubectl get svc -n guestbook-dev guestbook-dev -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "Not ready yet")
STAGING_PORT=$(kubectl get svc -n guestbook-staging guestbook-staging -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "Not ready yet")
PROD_PORT=$(kubectl get svc -n guestbook-prod guestbook-prod -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "Not ready yet")

echo "Applications will be available at:"
echo "Dev: http://localhost:$DEV_PORT"
echo "Staging: http://localhost:$STAGING_PORT"
echo "Production: http://localhost:$PROD_PORT"
```

## Step 7: Demonstrating Promotion Workflow

### Promote to Staging

```bash
# Promote dev to staging
git push origin environments/dev:environments/staging -f
```

### Promote to Production

```bash
# Promote staging to production
git push origin environments/staging:environments/prod -f
```

ArgoCD will automatically sync each environment as changes are promoted. You can observe the differences in the web applications - each environment displays its name and version with different styling.

## Step 8: Making Changes and Promoting

### Update Application Version

```bash
# Build new version
./build-and-push.sh 1.0.1

# Update dev environment values
sed -i 's/tag: "1.0.0"/tag: "1.0.1"/' helm-guestbook/values-dev.yaml

# Commit and push changes
git add helm-guestbook/values-dev.yaml
git commit -m "Update dev environment to version 1.0.1"
git push origin main

# Update dev branch and promote through environments
git branch -f environments/dev HEAD
git push origin environments/dev -f

# Promote to staging
git push origin environments/dev:environments/staging -f

# Promote to production
git push origin environments/staging:environments/prod -f
```

## Step 9: Conclusion

Congratulations! You've successfully implemented a GitOps promotion workflow with:

- **Automated deployments** through ArgoCD with Source Hydrator
- **Environment-specific configurations** using Helm values
- **Promotion workflow** managed by GitOps Promoter
- **Branch-based environment strategy** for clear change tracking

### Key Benefits

- **Consistency**: Same application code deployed across all environments
- **Traceability**: Git history shows exactly what was promoted when
- **Rollback capability**: Easy to revert to previous versions
- **Automated sync**: ArgoCD ensures environments stay in sync with Git

### Next Steps

- Add automated testing before promotions
- Implement approval gates for production deployments
- Set up monitoring and alerting
- Explore canary and blue/green deployment strategies