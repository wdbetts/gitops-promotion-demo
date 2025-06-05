**Tutorial Outline:**

1.  **Introduction:**
    *   What the demo will achieve.
2.  **Prerequisites:**
    *   List necessary tools (kubectl, k3d, GitHub Account, git, helm).
    *   Existing local Kubernetes cluster, I used Docker Desktop
3.  **Setting up the Environment:**
    *   Create a GitHub repository for the demo.
    *   Initialize the repository with the helm-guestbook chart and app directory.
    *   Environment branches (`environments/dev`, `environments/dev-next`, etc...) will be created by Argo Source Hydrator
4.  **Installing Core Components:**
    *   Install ArgoCD with source hydrator from https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install-with-hydrator.yaml
    *   Access ArgoCD UI and note the admin password.
    *   Install GitOps Promoter from https://github.com/argoproj-labs/gitops-promoter/releases/download/v0.4.0/install.yaml
5.  **Configuring GitOps Promoter:**
    *   Create a GitHub App.
    *   Note App ID and generate a private key.
    *   Install the GitHub App on the demo repository.
    *   Create Kubernetes Secrets for GitHub App credentials (`github-app-secret.yaml` from promoter).
    *   Create `ScmProvider` and `GitRepository` resources (`git-resources.yaml` from promoter).
    *   Create the `PromotionStrategy` (`promotion-strategy.yaml` from promoter).
6.  **Preparing the Application:**
    *   Explain the structure of the app directory (Node.js app, Dockerfile).
    *   Explain the build-and-push.sh script's role (manual step for the user to understand).
    *   Build and push an initial version of the application image (e.g., `1.0.0`).
7.  **Configuring ArgoCD Applications with Source Hydrator:**
    *   Explain the concept of ArgoCD ApplicationSets or individual Applications for each environment.
    *   Show how to define an ArgoCD Application (guestbook-appset.yaml or individual app manifests) that uses the Helm chart from the repository.
    *   **Crucially, explain how the ArgoCD Source Hydrator will be used here.** This involves referencing the environment-specific branches and Helm value files (`values-dev.yaml`, `values-staging.yaml`, `values-prod.yaml`).
    *   Create Kubernetes namespaces for `dev`, `staging`, and `prod`.
    *   Apply the ArgoCD Application manifests.
8.  **Demonstrating the Promotion Workflow:**
    *   **Initial Deployment:**
        *   Verify ArgoCD syncs the `dev` environment using the `main` branch (or `environments/dev` if configured that way) and `values-dev.yaml`.
        *   Access the `dev` application.
    *   **Promoting to Staging:**
        *   Explain the Git commands to "promote" (e.g., merge or fast-forward `environments/dev` to `environments/staging`).
        *   Observe GitOps Promoter creating a pull request (if configured) or directly pushing.
        *   Verify ArgoCD syncs the `staging` environment using the `environments/staging` branch and `values-staging.yaml`.
        *   Access the `staging` application.
    *   **Promoting to Production:**
        *   Explain the Git commands to promote from `environments/staging` to `environments/prod`.
        *   Observe GitOps Promoter.
        *   Verify ArgoCD syncs the `prod` environment using the `environments/prod` branch and `values-prod.yaml`.
        *   Access the `prod` application.
9.  **Making a Change and Promoting:**
    *   Make a small change to the application code in the app directory.
    *   Update the version in app.js (or relevant file).
    *   Re-build and re-push the Docker image with a new version (e.g., `1.0.1`) using build-and-push.sh.
    *   Update values-dev.yaml (or a common values file if image tag is centralized) to use the new image tag.
    *   Commit and push changes to the `main` branch (or `environments/dev`).
    *   Walk through the promotion process again (dev -> staging -> prod), observing the updated application.
