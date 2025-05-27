#!/bin/bash

# Variables
VERSION=${1:-"1.0.0"}
LOCAL_REGISTRY="localhost:5111"
IMAGE_NAME="gitops-demo-app"
FULL_IMAGE_NAME="${LOCAL_REGISTRY}/${IMAGE_NAME}:${VERSION}"

# Step 1: Create a local registry if it doesn't exist
# if ! docker ps | grep -q 'registry:2'; then
#   echo "Starting local Docker registry..."
#   docker run -d -p 5000:5000 --restart=always --name registry registry:2
# else
#   echo "Local Docker registry is already running."
# fi

# Step 3: Build the image with the specified version
echo "Building Docker image with version ${VERSION}..."
docker build \
  --build-arg APP_VERSION=${VERSION} \
  -t ${IMAGE_NAME}:${VERSION} ./app

# Step 4: Tag the image for the local registry
echo "Tagging image for local registry..."
docker tag ${IMAGE_NAME}:${VERSION} ${FULL_IMAGE_NAME}

# Step 5: Push the image to the local registry
echo "Pushing image to local registry..."
docker push ${FULL_IMAGE_NAME}

echo "Image ${FULL_IMAGE_NAME} is now available in your local registry"
echo ""
echo "To deploy to different environments:"
echo "Dev:      helm upgrade --install gitops-demo-dev ./helm-guestbook -f ./helm-guestbook/values-dev.yaml --set image.tag=${VERSION}"
echo "Staging:  helm upgrade --install gitops-demo-staging ./helm-guestbook -f ./helm-guestbook/values-staging.yaml --set image.tag=${VERSION}"
echo "Prod:     helm upgrade --install gitops-demo-prod ./helm-guestbook -f ./helm-guestbook/values-prod.yaml --set image.tag=${VERSION}"
echo ""
echo "This completes the image build for version ${VERSION}"
