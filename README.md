# Certificate Monitor

A comprehensive SSL certificate monitoring solution that helps track and manage SSL certificates across multiple domains.

## Features

- Monitor SSL certificates for multiple domains
- Track certificate expiration dates
- View certificate details (issuer, subject, validity period, etc.)
- Filter and search certificates
- Automatic certificate status updates
- RESTful API for integration
- Modern React-based dashboard

## Prerequisites

- Docker and Docker Compose (for local development)
- Kubernetes cluster (for production deployment)
- Node.js 16+ (for local frontend development)
- Python 3.9+ (for local backend development)

## Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cert-mon.git
cd cert-mon
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configurations

4. Start the development environment:
```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:5001
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

## Production Deployment

### Docker Swarm Deployment

1. Initialize Docker Swarm:
```bash
docker swarm init
```

2. Deploy the stack:
```bash
docker stack deploy -c docker-compose.prod.yml certmon
```

### Kubernetes Deployment

1. Create Kubernetes secrets:
```bash
kubectl create secret generic certmon-secrets --from-file=.env
```

2. Apply Kubernetes manifests:
```bash
kubectl apply -f k8s/
```

The Kubernetes deployment includes:
- Horizontal Pod Autoscaling
- Ingress configuration
- Persistent volume claims for database
- Monitoring with Prometheus and Grafana
- Liveness and readiness probes

## Environment Variables

See `.env.example` for a complete list of configuration options. Key variables include:

### Application
- `NODE_ENV`: Application environment (development/production)
- `FLASK_ENV`: Flask environment
- `LOG_LEVEL`: Logging level

### API
- `API_PORT`: API server port
- `SECRET_KEY`: Flask secret key
- `CORS_ORIGINS`: Allowed CORS origins

### Database
- `POSTGRES_*`: PostgreSQL configuration
- `DATABASE_URL`: Database connection string

### Redis & Celery
- `REDIS_*`: Redis configuration
- `CELERY_*`: Celery worker configuration

## Security Considerations

1. Never commit `.env` files to version control
2. Use strong passwords in production
3. Enable SSL/TLS in production
4. Regularly update dependencies
5. Use secrets management in production (e.g., Kubernetes secrets, HashiCorp Vault)

## Monitoring and Logging

The application includes:
- Prometheus metrics
- Grafana dashboards
- Structured logging
- Health check endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
