FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Collect static files
RUN python manage.py collectstatic --noinput || true

# Setup database and start server
CMD python manage.py setup_database --skip-sample-data && \
    gunicorn core.wsgi:application --bind 0.0.0.0:$PORT

