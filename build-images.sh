#!/bin/bash

echo "Building cert-checker image..."
docker build -t cert-checker:latest ./cert_checker

echo "Building db-service image..."
docker build -t db-service:latest ./db_service

echo "Building frontend image..."
docker build -t cert-mon-frontend:latest ./frontend

echo "Listing built images..."
docker images | grep -E 'cert-checker|db-service|cert-mon-frontend'

echo "Done building images!"
