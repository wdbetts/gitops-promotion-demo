# GitOps Demo Application

This is a simple web application for demonstrating GitOps workflows with Argo CD.

## Features

- Visual display of application version
- Environment detection with automatic UI customization
- Simple UI for clear demonstration of changes across environments

## How to Use

### Building and Pushing the Image

Use the provided script to build and push the image:

```bash
./build-and-push.sh <version>
```

For example:
```bash
./build-and-push.sh 1.0.0    # Build version 1.0.0
```

The same image can then be deployed to different environments using environment-specific Helm values.

### Environment Variables

The application reads these environment variables:

- `APP_VERSION`: The version number to display (e.g., "1.0.0")
- `APP_ENVIRONMENT`: The environment name ("dev", "staging", or "prod")

### Deploying with Helm

After pushing the image, deploy with Helm:

```bash
helm upgrade --install gitops-demo-dev ./helm-guestbook -f ./helm-guestbook/values-dev.yaml
```

## Version Progression Example

1. Start with `1.0.0` in dev
2. Promote to `1.1.0` in staging with minor UI changes
3. Promote to `2.0.0` in production with full UI enhancements
