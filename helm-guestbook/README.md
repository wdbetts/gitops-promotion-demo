
# Manifest Hydration

To hydrate the manifests in this repository, run the following commands:

```shell

git clone https://github.com/wdbetts/gitops-promotion-demo.git
# cd into the cloned directory
git checkout 33a513cab67ee161d029796e55e560d140706497
helm template . --name-template helm-guestbook-dev --values ./helm-guestbook/values.yaml --values ./helm-guestbook/values-dev.yaml --include-crds
```