
# Manifest Hydration

To hydrate the manifests in this repository, run the following commands:

```shell

git clone https://github.com/wdbetts/gitops-promotion-demo.git
# cd into the cloned directory
git checkout 4b9e7abd3bdbe17d9c1d825e3a3043f4fa80bc63
helm template . --name-template guestbook-staging --namespace staging --values ./helm-guestbook/values.yaml --values ./helm-guestbook/values-staging.yaml --include-crds
```