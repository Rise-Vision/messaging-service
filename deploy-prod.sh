#!/bin/bash

# Exit on any error
set -e

sudo /opt/google-cloud-sdk/bin/gcloud --quiet config set container/cluster messaging-service-prod
sudo /opt/google-cloud-sdk/bin/gcloud config set compute/zone ${CLOUDSDK_COMPUTE_ZONE}
sudo /opt/google-cloud-sdk/bin/gcloud config set container/use_client_certificate True
sudo /opt/google-cloud-sdk/bin/gcloud --quiet container clusters get-credentials messaging-service-prod

TAG=$(grep version package.json |grep -o '[0-9.]*');
echo "Tag value is: $TAG"

sudo chown -R ubuntu:ubuntu /home/ubuntu/.kube
kubectl patch deployment messaging-service -p '{"spec":{"template":{"spec":{"containers":[{"name":"messaging-service","image":"'"$DOCKER_IMAGE_NAME"':v'"$TAG"'"}]}}}}'