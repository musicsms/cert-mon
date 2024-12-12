#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to copy .env.example to .env if it doesn't exist
setup_env() {
    local dir=$1
    if [ -f "${dir}/.env.example" ]; then
        if [ ! -f "${dir}/.env" ]; then
            cp "${dir}/.env.example" "${dir}/.env"
            echo -e "${GREEN}Created ${dir}/.env from example${NC}"
        else
            echo -e "${YELLOW}${dir}/.env already exists, skipping${NC}"
        fi
    fi
}

# Setup environment files for each service
echo "Setting up environment files..."

# Main services
setup_env "cert_checker"
setup_env "db_service"
setup_env "frontend"

echo -e "\n${GREEN}Environment setup complete!${NC}"
echo -e "${YELLOW}Please review and update the .env files with your actual configuration values${NC}"
