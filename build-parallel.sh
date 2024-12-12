#!/bin/bash

# Exit on any error
set -e

# Configuration
REGISTRY="localhost:5000"
SERVICES=("cert-checker" "db-service" "cert-mon-frontend")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Function to build and push a service
build_and_push() {
    local service=$1
    echo "Building ${service}..."
    
    # Handle frontend differently
    if [ "$service" == "cert-mon-frontend" ]; then
        docker build -t ${REGISTRY}/${service}:latest ./frontend &> /tmp/build_${service}.log
    else
        docker build -t ${REGISTRY}/${service}:latest ./${service//-/_} &> /tmp/build_${service}.log
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Built ${service}${NC}"
        echo "Pushing ${service}..."
        docker push ${REGISTRY}/${service}:latest &> /tmp/push_${service}.log
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Pushed ${service}${NC}"
            return 0
        else
            echo -e "${RED}✗ Failed to push ${service}${NC}"
            cat /tmp/push_${service}.log
            return 1
        fi
    else
        echo -e "${RED}✗ Failed to build ${service}${NC}"
        cat /tmp/build_${service}.log
        return 1
    fi
}

# Main build process
echo "Starting parallel build process..."

# Start all builds in parallel
for service in "${SERVICES[@]}"; do
    build_and_push "$service" &
done

# Wait for all parallel builds to complete
wait

# Check if any builds failed
for service in "${SERVICES[@]}"; do
    if [ ! -f /tmp/push_${service}.log ]; then
        echo -e "${RED}Build process for ${service} failed${NC}"
        exit 1
    fi
done

echo -e "${GREEN}All services built and pushed successfully!${NC}"

# Clean up logs
rm -f /tmp/build_*.log /tmp/push_*.log

# List all images
echo "Built images:"
docker images | grep "${REGISTRY}"
