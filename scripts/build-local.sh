#!/bin/bash

IMAGE_NAME="local/tf-next-image-optiomizer-build"

# Run the build
docker build -t "${IMAGE_NAME}" -f buildimage.Dockerfile .

# Copy the artifact back to the host machine
# https://stackoverflow.com/a/31316636/831465
id=$(docker create local/tf-next-image-optiomizer-build sh)
docker cp $id:/app/lib/dist.zip ./lib/dist.zip
docker rm -v $id
