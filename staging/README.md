
# Manifest Hydration

To hydrate the manifests in this repository, run the following commands:

```shell

git clone https://github.com/wdbetts/gitops-promotion-demo.git
# cd into the cloned directory
git checkout 29f9f54cdc8cfa03afca963f22093218370f5278
helm template . --name-template guestbook-staging --namespace staging --values ./helm-guestbook/values.yaml --values ./helm-guestbook/values-staging.yaml --include-crds
```