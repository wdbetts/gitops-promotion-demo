# GitOps Promotion with ArgoCD and Source Hydrator Tutorial

## 1. Introduction

This tutorial demonstrates how to implement a GitOps-based promotion workflow using ArgoCD with Source Hydrator and GitOps Promoter. You'll learn how to automate the promotion of applications from development to staging to production environments while maintaining a clear change history and approval process.

The demo showcases:
- Environment branch-based deployment strategy
- Automated synchronization between environments
- Separate configuration for development, staging, and production
- Pull request-based promotion workflow with automated checks

By the end of this tutorial, you'll have a fully functional GitOps promotion pipeline running in your local Kubernetes cluster.

## 2. Prerequisites

Before starting this tutorial, ensure you have the following tools installed:

* **kubectl** - Command-line tool for interacting with Kubernetes clusters
* **k3d** or **Docker Desktop with Kubernetes** - For running a local Kubernetes cluster
* **GitHub Account** - Required for repository hosting and GitHub App creation
* **git** - Version control system
* **helm** - Package manager for Kubernetes

You'll also need an existing local Kubernetes cluster. This tutorial was tested with Docker Desktop's Kubernetes feature, but any local cluster should work.

## 3. Setting up the Environment

### Clone the Repository

Clone the demo repository which contains all the necessary application code and Helm charts:

```bash
git clone https://github.com/argoproj-labs/gitops-promotion-demo.git
cd gitops-promotion-demo
```

### Fork the Repository on GitHub

To work through this tutorial, you'll need your own copy of the repository on GitHub:

1. Go to https://github.com/argoproj-labs/gitops-promotion-demo
2. Click the "Fork" button in the top right
3. Follow the prompts to create a fork in your account

Once forked, update your local repository to point to your fork:

```bash
# Replace YOUR_GITHUB_USERNAME with your actual GitHub username
git remote set-url origin https://github.com/YOUR_GITHUB_USERNAME/gitops-promotion-demo.git
```

Now you have your own copy of the repository with all the necessary application code and Helm charts.

## 4. Installing Core Components

### Install ArgoCD with Source Hydrator

1. Install ArgoCD with the Source Hydrator plugin:

```bash
# Create argocd namespace
kubectl create namespace argocd

# Install ArgoCD with Source Hydrator
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install-with-hydrator.yaml
```

2. Wait for ArgoCD pods to be ready:

```bash
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd
```

3. Access the ArgoCD UI:

```bash
# Port forward the ArgoCD server
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

4. Get the initial admin password:

```bash
# Get the password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

5. Access the ArgoCD UI at https://localhost:8080 and log in with username `admin` and the password from the previous step.

### Install GitOps Promoter

1. Install GitOps Promoter using the latest release:

```bash
kubectl apply -f https://github.com/argoproj-labs/gitops-promoter/releases/download/v0.4.0/install.yaml
```

2. Verify the installation:

```bash
kubectl get pods -n promoter-system
```

Wait until all pods are in the `Running` state.

## 5. Configuring GitOps Promoter

### Create a GitHub App

1. Navigate to GitHub: Settings > Developer settings > GitHub Apps > New GitHub App
2. Fill in the following:
   - GitHub App name: `GitOps Promoter Demo`
   - Homepage URL: Can be your repository URL
   - Webhook URL: Leave blank for this demo
   - Webhook secret: Leave blank for this demo
   - Repository permissions:
     - Contents: Read & write
     - Pull requests: Read & write
     - Commit statuses: Read & write
   - Where can this GitHub App be installed? Choose "Only on this account"
3. Click "Create GitHub App"
4. Note the "App ID" from the app page
5. Generate a private key by clicking "Generate a private key" and save the downloaded file
6. Install the app on your forked repository by clicking "Install App" and select your fork of the `gitops-promotion-demo` repository

### Create Kubernetes Secrets for GitHub App Credentials

Create a secret containing the GitHub App's private key:

```bash
# Create a temporary directory for safety
mkdir -p ~/tmp

# Move the private key to this directory (adjust the filename if needed)
mv ~/Downloads/gitops-promoter-demo*.pem ~/tmp/gitops-promoter-demo.private-key.pem

# Create the secret with your private key
kubectl create secret generic github-app-credentials \
  --from-file=githubAppPrivateKey=~/tmp/gitops-promoter-demo.private-key.pem
```

### Create SCM Provider and GitRepository Resources

Create the `git-resources.yaml` file with your GitHub App ID and repository URL:

```bash
# Create git-resources.yaml (replace with your actual App ID and GitHub username)
cat > promoter/git-resources.yaml << EOF
apiVersion: promoter.argoproj.io/v1alpha1
kind: ScmProvider
metadata:
  name: github-provider
  namespace: default
spec:
  type: github
  github:
    appID: YOUR_GITHUB_APP_ID
    baseURL: ""
  secretRef:
    name: github-app-credentials
---
apiVersion: promoter.argoproj.io/v1alpha1
kind: GitRepository
metadata:
  name: demo-repo
  namespace: default
spec:
  url: https://github.com/YOUR_GITHUB_USERNAME/gitops-promotion-demo.git
  scmProviderRef:
    name: github-provider
EOF

# Apply the resource
kubectl apply -f promoter/git-resources.yaml
```

### Create the Promotion Strategy

Create the `promotion-strategy.yaml` file:

```bash
# Create promotion-strategy.yaml
cat > promoter/promotion-strategy.yaml << EOF
apiVersion: promoter.argoproj.io/v1alpha1
kind: PromotionStrategy
metadata:
  name: demo-promotion
  namespace: default
spec:
  environments:
  - branch: environments/dev
    autoMerge: true
  - branch: environments/staging
    autoMerge: true
  - branch: environments/prod
    autoMerge: true
  gitRepositoryRef:
    name: demo-repo
EOF

# Apply the promotion strategy
kubectl apply -f promoter/promotion-strategy.yaml
```

## 6. Building and Pushing the Application

The application code is already included in the repository. Take a moment to familiarize yourself with the structure:

- `app/app.js` - The main Node.js application that displays the version and environment
- `app/versions/` - Contains environment-specific variants of the application
- `app/Dockerfile` - Docker configuration for building the application image
- `app/package.json` - Node.js dependencies

Now, build and push the Docker image:

```bash
# Build and push version 1.0.0
./build-and-push.sh 1.0.0
```

This script builds the Docker image and pushes it to a local Docker registry (localhost:5000). The script handles:

1. Building the application with the specified version
2. Tagging the image appropriately
3. Pushing the image to the local registry

The application adapts to each environment using environment variables that will be set by our Helm chart:
- `APP_VERSION`: The version number (e.g., "1.0.0")
- `APP_ENVIRONMENT`: The environment name ("dev", "staging", or "prod")

## 7. Setting up ArgoCD Applications

### Create Environment Branches

Create the environment branches and push them to your GitHub fork:

```bash
# Create environment branches based on main
git branch -f environments/dev HEAD
git branch -f environments/staging environments/dev
git branch -f environments/prod environments/staging

# Push branches to GitHub
git push origin environments/dev environments/staging environments/prod -f
```

### Create Kubernetes Namespaces

Create namespaces for each environment:

```bash
# Create namespaces
kubectl create namespace dev --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace staging --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace prod --dry-run=client -o yaml | kubectl apply -f -
```

### Deploy the ArgoCD ApplicationSet

Update the ApplicationSet manifest with your GitHub username:

```bash
# Replace YOUR_GITHUB_USERNAME with your actual GitHub username
sed -i '' 's|repoURL: .*|repoURL: https://github.com/YOUR_GITHUB_USERNAME/gitops-promotion-demo.git|' guestbook-appset.yaml

# Apply the ApplicationSet
kubectl apply -f guestbook-appset.yaml
```

## 8. Demonstrating the Promotion Workflow

### Initial Deployment

Verify that ArgoCD has synced the applications:

```bash
# Check the ArgoCD UI or use CLI
kubectl get applications -n argocd
```

Access the dev application:

```bash
# Get the NodePort of the dev service
DEV_PORT=$(kubectl get svc -n dev gitops-demo-guestbook -o jsonpath='{.spec.ports[0].nodePort}')
echo "Dev application available at: http://localhost:$DEV_PORT"
```

### Promoting to Staging

To promote from dev to staging:

```bash
# Push the dev branch to staging
git push origin environments/dev:environments/staging -f
```

GitOps Promoter will handle the promotion, and ArgoCD will sync the staging environment.

Verify the staging application:

```bash
# Get the NodePort of the staging service
STAGING_PORT=$(kubectl get svc -n staging gitops-demo-guestbook -o jsonpath='{.spec.ports[0].nodePort}')
echo "Staging application available at: http://localhost:$STAGING_PORT"
```

### Promoting to Production

To promote from staging to production:

```bash
# Push the staging branch to production
git push origin environments/staging:environments/prod -f
```

Again, GitOps Promoter will handle the change, and ArgoCD will sync the production environment.

Verify the production application:

```bash
# Get the NodePort of the prod service
PROD_PORT=$(kubectl get svc -n prod gitops-demo-guestbook -o jsonpath='{.spec.ports[0].nodePort}')
echo "Production application available at: http://localhost:$PROD_PORT"
```

## 9. Making a Change and Promoting

Let's make a change to the application and promote it through the environments:

1. Update the dev environment to use a new version:

```bash
# Build and push a new version of the application
./build-and-push.sh 1.0.1

# Update the values-dev.yaml file to use the new image tag
sed -i '' 's/tag: "1.0.0"/tag: "1.0.1"/' helm-guestbook/values-dev.yaml

# Commit and push the changes
git add helm-guestbook/values-dev.yaml
git commit -m "Update dev environment to version 1.0.1"
git push origin main

# Update the dev environment branch
git branch -f environments/dev HEAD
git push origin environments/dev -f
```

2. ArgoCD will automatically sync the dev environment with the new version. Verify by accessing the application URL.

3. Promote to staging:

```bash
git push origin environments/dev:environments/staging -f
```

4. Finally, promote to production:

```bash
git push origin environments/staging:environments/prod -f
```

## 10. Conclusion and Next Steps

Congratulations! You've successfully set up a GitOps promotion workflow using ArgoCD with Source Hydrator and GitOps Promoter. This system provides:

- Automated synchronization of applications across environments
- Environment-specific configuration through Helm values
- Promotion workflow with optional approval gates
- Visibility into application status across environments

### Next Steps

To enhance this setup further, you could:

1. Add automated testing as part of the promotion process
2. Implement canary deployments or blue/green deployments
3. Set up notifications for successful deployments or failures
4. Create a dashboard to visualize the status of all environments
5. Add metrics and monitoring to track application performance
