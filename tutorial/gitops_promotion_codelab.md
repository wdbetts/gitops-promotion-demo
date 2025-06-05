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

Now you have your own copy of the repository with all the necessary application code and Helm charts ready to use.

## Step 4: Installing Core Components

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

## Step 5: Configuring GitOps Promoter

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
6. Install the app on your repository by clicking "Install App" and select your `gitops-promotion-demo` repository

### Create Kubernetes Secrets for GitHub App Credentials

Create a secret containing the GitHub App's private key:

```bash
# Create a temporary directory for safety
mkdir -p ~/tmp

# Move the private key to this directory
mv ~/Downloads/gitops-promoter-demo*.pem ~/tmp/gitops-promoter-demo.private-key.pem

# Create the secret YAML file
cat > promoter/github-app-secret.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: github-app-credentials
  namespace: default
type: Opaque
data:
  githubAppPrivateKey: "$(cat ~/tmp/gitops-promoter-demo.private-key.pem | base64 -w 0)"
EOF

# Apply the secret
kubectl apply -f promoter/github-app-secret.yaml
```

### Create SCM Provider and GitRepository Resources

Create the necessary GitOps Promoter resources:

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

# Update with your actual values and apply
kubectl apply -f promoter/git-resources.yaml
```

### Create the Promotion Strategy

Define the promotion strategy for your environments:

```bash
# Create promotion-strategy.yaml
cat > promoter/promotion-strategy.yaml << EOF
apiVersion: promoter.argoproj.io/v1alpha1
kind: PromotionStrategy
metadata:
  name: demo-promotion
  namespace: default
spec:
  # activeCommitStatuses:
  #   - key: argocd-app-health
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

### Configure ArgoCD Status Reporting

Enable status reporting from ArgoCD to GitHub:

```bash
# Create argocd-commitstatus.yaml
cat > promoter/argocd-commitstatus.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
  labels:
    app.kubernetes.io/name: argocd-cm
    app.kubernetes.io/part-of: argocd
data:
  statusbadge.enabled: "true"
  reposerver.commit.verification.enabled: "false"
EOF

# Apply the ConfigMap
kubectl apply -f promoter/argocd-commitstatus.yaml
```

## Step 6: Preparing the Application

### Node.js Application Structure

Create a simple Node.js application that displays its version and environment:

```bash
# Create app.js
cat > app/app.js << EOF
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const version = process.env.APP_VERSION || '1.0.0';
const environment = process.env.APP_ENVIRONMENT || 'development';

// Set up a basic HTML template with environment-specific styling
const getPageColor = () => {
  switch(environment) {
    case 'prod': return '#28a745'; // Green for production
    case 'staging': return '#ffc107'; // Yellow for staging
    case 'dev': return '#17a2b8'; // Blue for development
    default: return '#6c757d'; // Grey for unknown
  }
};

app.get('/', (req, res) => {
  const color = getPageColor();
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>GitOps Demo App</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: ${color};
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          text-align: center;
          background-color: rgba(0, 0, 0, 0.3);
          padding: 40px;
          border-radius: 8px;
        }
        h1 {
          font-size: 48px;
          margin-bottom: 10px;
        }
        p {
          font-size: 24px;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>GitOps Demo App</h1>
        <p>Version: ${version}</p>
        <p>Environment: ${environment}</p>
      </div>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(\`App running on port \${port}\`);
  console.log(\`Version: \${version}, Environment: \${environment}\`);
});
EOF
```

### Dockerfile for the Application

Create a Dockerfile to containerize the application:

```bash
# Create Dockerfile
cat > app/Dockerfile << EOF
FROM node:slim

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV APP_VERSION=1.0.0
EXPOSE 8080

# Start the application
CMD ["node", "app.js"]

EOF
```

### Package.json

Create a package.json file for the Node.js application:

```bash
# Create package.json
cat > app/package.json << EOF
{
  "name": "gitops-demo-app",
  "version": "1.0.0",
  "description": "Simple demo app for GitOps promotion workflow",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.17.1"
  }
}
EOF
```

### Create Build and Push Script

Create a script to build and push the Docker image:

```bash
# Create build-and-push.sh
cat > build-and-push.sh << EOF
#!/bin/bash

# Check if a version parameter was provided
if [ -z "\$1" ]; then
  echo "Usage: \$0 <version>"
  echo "Example: \$0 1.0.0"
  exit 1
fi

VERSION="\$1"
REGISTRY="localhost:5111"
IMAGE_NAME="gitops-demo-app"

echo "Building and pushing application image version \$VERSION..."

# Build the base image
echo "Building \$REGISTRY/\$IMAGE_NAME:\$VERSION"
docker build -t \$REGISTRY/\$IMAGE_NAME:\$VERSION ./app

# Push the image
echo "Pushing \$REGISTRY/\$IMAGE_NAME:\$VERSION"
docker push \$REGISTRY/\$IMAGE_NAME:\$VERSION

echo "Done! Image is available at \$REGISTRY/\$IMAGE_NAME:\$VERSION"
EOF

# Make the script executable
chmod +x build-and-push.sh
```

Build the initial version of your application:

```bash
# Build and push version 1.0.0
./build-and-push.sh 1.0.0
```

## Step 7: Configuring ArgoCD Applications with Source Hydrator

### Create the Helm Chart

Create a Helm chart for deploying the application:

```bash
# Create Chart.yaml
cat > helm-guestbook/Chart.yaml << EOF
apiVersion: v2
name: gitops-demo
description: A Helm chart for GitOps Promotion Demo
type: application
version: 0.1.0
appVersion: "1.0.0"
EOF

# Create values.yaml (default values)
cat > helm-guestbook/values.yaml << EOF
replicaCount: 1

image:
  repository: localhost:5000/gitops-demo-app
  pullPolicy: Always
  tag: "1.0.0"

nameOverride: ""
fullnameOverride: ""

environment: dev

service:
  type: NodePort
  port: 80
  targetPort: 3000

resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 50m
    memory: 64Mi
EOF

# Create environment-specific values files
cat > helm-guestbook/values-dev.yaml << EOF
environment: dev
image:
  tag: "1.0.0"
EOF

cat > helm-guestbook/values-staging.yaml << EOF
environment: staging
image:
  tag: "1.0.0"
EOF

cat > helm-guestbook/values-prod.yaml << EOF
environment: prod
image:
  tag: "1.0.0"
EOF

# Create deployment.yaml
mkdir -p helm-guestbook/templates
cat > helm-guestbook/templates/deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "gitops-demo.fullname" . }}
  labels:
    {{- include "gitops-demo.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "gitops-demo.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "gitops-demo.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          env:
            - name: APP_VERSION
              value: "{{ .Values.image.tag | default .Chart.AppVersion }}"
            - name: APP_ENVIRONMENT
              value: "{{ .Values.environment }}"
          ports:
            - name: http
              containerPort: 3000
              protocol: TCP
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
EOF

# Create service.yaml
cat > helm-guestbook/templates/service.yaml << EOF
apiVersion: v1
kind: Service
metadata:
  name: {{ include "gitops-demo.fullname" . }}
  labels:
    {{- include "gitops-demo.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.targetPort }}
      protocol: TCP
      name: http
  selector:
    {{- include "gitops-demo.selectorLabels" . | nindent 4 }}
EOF

# Create _helpers.tpl
cat > helm-guestbook/templates/_helpers.tpl << EOF
{{/*
Expand the name of the chart.
*/}}
{{- define "gitops-demo.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "gitops-demo.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- \$name := default .Chart.Name .Values.nameOverride }}
{{- if contains \$name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name \$name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "gitops-demo.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "gitops-demo.labels" -}}
helm.sh/chart: {{ include "gitops-demo.chart" . }}
{{ include "gitops-demo.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "gitops-demo.selectorLabels" -}}
app.kubernetes.io/name: {{ include "gitops-demo.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
EOF
```

### Set up ArgoCD Source Hydrator Configuration

Create ArgoCD Source Hydrator configuration files for each environment:

```bash
# Create the Source Hydrator configuration for dev
cat > helm-guestbook/.argocd-source-dev.yaml << EOF
helm:
  parameters:
  - name: environment
    value: dev
  valuesFiles:
  - values-dev.yaml
EOF

# Create the Source Hydrator configuration for staging
cat > helm-guestbook/.argocd-source-staging.yaml << EOF
helm:
  parameters:
  - name: environment
    value: staging
  valuesFiles:
  - values-staging.yaml
EOF

# Create the Source Hydrator configuration for prod
cat > helm-guestbook/.argocd-source-prod.yaml << EOF
helm:
  parameters:
  - name: environment
    value: prod
  valuesFiles:
  - values-prod.yaml
EOF
```

### Create ArgoCD Application Manifest

Create the ApplicationSet manifest for ArgoCD:

```bash
# Create namespaces for each environment
kubectl create namespace dev
kubectl create namespace staging
kubectl create namespace prod

# Create the ApplicationSet manifest
cat > guestbook-appset.yaml << EOF
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: guestbook
  namespace: argocd
spec:
  generators:
  - list:
      elements:
      - name: dev
        appName: helm-guestbook-dev
        namespace: dev
        hydrationPath: .argocd-source-dev.yaml
      - name: staging
        appName: helm-guestbook-staging
        namespace: staging
        hydrationPath: .argocd-source-staging.yaml
      - name: prod
        appName: helm-guestbook-prod
        namespace: prod
        hydrationPath: .argocd-source-prod.yaml
  template:
    metadata:
      name: '{{appName}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/YOUR_GITHUB_USERNAME/gitops-promotion-demo.git
        targetRevision: environments/{{name}}
        path: helm-guestbook
        plugin:
          name: argocd-lovely-plugin-source-hydrator
          env:
          - name: CONFIG_PATH
            value: '{{hydrationPath}}'
      destination:
        server: https://kubernetes.default.svc
        namespace: '{{namespace}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
EOF

# Replace YOUR_GITHUB_USERNAME with your actual username
# Update and apply the ApplicationSet
kubectl apply -f guestbook-appset.yaml
```

## Step 8: Demonstrating the Promotion Workflow

### Initial Deployment

First, create the environment branches and push them to GitHub:

```bash
# Create environment branches based on main
git branch -f environments/dev HEAD
git branch -f environments/staging environments/dev
git branch -f environments/prod environments/staging

# Push branches to GitHub
git push origin environments/dev environments/staging environments/prod -f
```

Now verify that ArgoCD has synced the applications:

```bash
# Check the ArgoCD UI or use CLI
kubectl get applications -n argocd
```

Access the dev application:

```bash
# Get the NodePort of the dev service
DEV_PORT=$(kubectl get svc -n dev gitops-demo-dev-guestbook -o jsonpath='{.spec.ports[0].nodePort}')
echo "Dev application available at: http://localhost:$DEV_PORT"
```

### Promoting to Staging

To promote from dev to staging:

```bash
# Push the dev branch to staging
git push origin environments/dev:environments/staging -f
```

GitOps Promoter will detect this change and create a pull request (if configured that way) or directly update the staging branch. ArgoCD will then automatically sync the staging environment.

Verify the staging application:

```bash
# Get the NodePort of the staging service
STAGING_PORT=$(kubectl get svc -n staging gitops-demo-staging-guestbook -o jsonpath='{.spec.ports[0].nodePort}')
echo "Staging application available at: http://localhost:$STAGING_PORT"
```

### Promoting to Production

To promote from staging to production:

```bash
# Push the staging branch to production
git push origin environments/staging:environments/prod -f
```

Again, GitOps Promoter will handle the change and ArgoCD will sync the production environment.

Verify the production application:

```bash
# Get the NodePort of the prod service
PROD_PORT=$(kubectl get svc -n prod gitops-demo-prod-guestbook -o jsonpath='{.spec.ports[0].nodePort}')
echo "Production application available at: http://localhost:$PROD_PORT"
```

## Step 9: Making a Change and Promoting

Let's make a change to the application and promote it through the environments:

1. Update the application version:

```bash
# Edit app/app.js to make a visible change
# For example, change the version display or add a new feature

# Build and push a new version of the application
./build-and-push.sh 1.0.1
```

2. Update the dev environment to use the new version:

```bash
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

3. ArgoCD will automatically sync the dev environment with the new version. Verify in the ArgoCD UI or by accessing the application URL.

4. Promote to staging using the same process as before:

```bash
git push origin environments/dev:environments/staging -f
```

5. Finally, promote to production:

```bash
git push origin environments/staging:environments/prod -f
```

## Step 10: Conclusion and Next Steps

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

Remember, GitOps is about more than just automating deployments—it's about ensuring consistency, reliability, and auditability across your entire infrastructure.
