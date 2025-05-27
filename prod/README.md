
# Manifest Hydration

To hydrate the manifests in this repository, run the following commands:

```shell

git clone https://github.com/wdbetts/gitops-promotion-demo.git
# cd into the cloned directory
git checkout 0b4c0c9f4eb630780a87bd8ac88ae9497d043c1b
helm template . --name-template guestbook-prod --namespace prod --values ./helm-guestbook/values.yaml --values ./helm-guestbook/values-prod.yaml --include-crds
```