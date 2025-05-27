# GitOps Promotion Demo

This project demonstrates GitOps-based promotion of an application through different environments using locally built Docker images.

## Components

- **App**: A simple Node.js application displaying its version number and environment
- **Helm Chart**: Kubernetes deployment configuration with environment-specific values
- **Build Script**: Helper script to build, tag, and push Docker images to a local registry

## Getting Started

### 1. Building the Application

The application can be built and pushed to a local Docker registry with our helper script:

```bash
./build-and-push.sh <version>
```

For example:
```bash
./build-and-push.sh 1.0.0
```

This builds a single image that can be promoted through environments.

This script will:
- Build the application Docker image with the specified version and environment
- Tag and push the image to your local registry

### 2. Deploying to Kubernetes

Deploy the application to your Docker Desktop Kubernetes cluster:

```bash
helm upgrade --install gitops-demo-dev ./helm-guestbook -f ./helm-guestbook/values-dev.yaml
```

Each environment has its own values file:
- `values-dev.yaml`: Development environment configuration
- `values-staging.yaml`: Staging environment configuration
- `values-prod.yaml`: Production environment configuration

### 3. Accessing the Application

The application is deployed with a NodePort service, so you can access it at:
http://localhost:<node-port>

To find the assigned NodePort:

```bash
kubectl get svc gitops-demo-dev-guestbook -o jsonpath='{.spec.ports[0].nodePort}'
```

## Run the Complete Demo

For a guided demonstration of the GitOps promotion workflow:

```bash
./run-demo.sh
```

This will walk you through:
1. Building and deploying to the dev environment
2. Promoting to staging
3. Promoting to production

## How It Works

The application adapts to each environment using environment variables:
- `APP_VERSION`: The version number (e.g., "1.0.0")
- `APP_ENVIRONMENT`: The environment name ("dev", "staging", or "prod")

These variables are passed through the Helm chart's values files and control both functionality and appearance.

In a real GitOps workflow, you would commit changes to the values files in your Git repository, and your GitOps tool (like Argo CD) would automatically apply the changes to your environments.
