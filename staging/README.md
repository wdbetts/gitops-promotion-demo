
# Manifest Hydration

To hydrate the manifests in this repository, run the following commands:

```shell

git clone https://github.com/wdbetts/gitops-promotion-demo.git
# cd into the cloned directory
git checkout 1080d6603b3e3478beedd521808ec158aa5dc09b
helm template . --name-template guestbook-staging --namespace staging --values ./helm-guestbook/values.yaml --values ./helm-guestbook/values-staging.yaml --include-crds
```