# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables for Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# Set work directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies using uv
RUN uv sync --frozen --no-cache

# Copy application code
COPY . .

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser \
    && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Ensure the virtual environment is in PATH
ENV PATH="/app/.venv/bin:$PATH"

# Expose port (Cloud Run will set PORT env var)
EXPOSE $PORT

# Run with uvicorn and 2 workers
# Cloud Run will provide PORT environment variable
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2