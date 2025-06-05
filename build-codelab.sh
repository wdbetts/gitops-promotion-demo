#!/bin/bash
set -e

CLAAT=$(command -v claat || true)
if [ -z "$CLAAT" ]; then
  echo "claat not found. Install with 'go install github.com/googlecodelabs/tools/claat@latest'" >&2
  exit 1
fi

mkdir -p codelabs
"$CLAAT" export -o codelabs tutorial/gitops_promotion_codelab.md

echo "Codelab exported to codelabs/"
