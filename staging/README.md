
# Manifest Hydration

To hydrate the manifests in this repository, run the following commands:

```shell

git clone https://github.com/wdbetts/gitops-promotion-demo.git
# cd into the cloned directory
git checkout 187884cdb4f9949a0e6ce20bc9404d2546896714
helm template . --name-template guestbook-staging --namespace staging --values ./helm-guestbook/values.yaml --values ./helm-guestbook/values-staging.yaml --include-crds
```