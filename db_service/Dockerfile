# Build stage
FROM python:3.12-slim as builder

WORKDIR /app
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.12-slim

WORKDIR /app
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY . .

# Add non-root user
RUN adduser --disabled-password --gecos "" appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "4"]
