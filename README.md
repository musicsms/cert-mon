# Certificate Monitoring System

A microservices-based certificate monitoring system that checks SSL/TLS certificates from URLs and ports, storing the results in a database. The system runs on Kubernetes.

## Components

- **Cert Checker Service**: Monitors SSL/TLS certificates from specified URLs and ports
- **Database Service**: Manages certificate data storage and retrieval
- **API Gateway**: Provides unified access to all services
- **Common Utils**: Shared utilities and models

## Prerequisites

- Docker
- Kubernetes cluster (local or remote)
- Python 3.9+
- kubectl

## Development Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Build Docker images:
```bash
docker-compose build
```

4. Deploy to Kubernetes:
```bash
kubectl apply -f k8s/
```

## Architecture

The system is built using a microservices architecture where each component runs as a separate service in Kubernetes. Services communicate via REST APIs and use PostgreSQL for data persistence.
