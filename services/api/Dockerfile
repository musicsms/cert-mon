FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create migrations directory if it doesn't exist
RUN mkdir -p migrations/versions

# Expose port
EXPOSE 5000

# Add wait-for-it script
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# Run migrations and start the application
CMD ["/bin/bash", "-c", "/wait-for-it.sh db:5432 -- flask db upgrade && gunicorn --bind 0.0.0.0:5000 wsgi:app"]
