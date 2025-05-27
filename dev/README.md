
# Manifest Hydration

To hydrate the manifests in this repository, run the following commands:

```shell

git clone https://github.com/wdbetts/gitops-promotion-demo.git
# cd into the cloned directory
git checkout a7a3639bfe274ea145b90ceebf8b493446e47628
helm template . --name-template guestbook-dev --include-crds
```