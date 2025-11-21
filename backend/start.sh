#!/bin/bash
set -e

echo "============================================================"
echo "Starting application..."
echo "============================================================"

# Run database setup
echo "Running database setup..."
python manage.py setup_database --force-update-admin || {
    echo "ERROR: Database setup failed!"
    exit 1
}

# Get port from environment variable, default to 8000 if not set
PORT=${PORT:-8000}

echo "============================================================"
echo "Starting Gunicorn on port $PORT..."
echo "============================================================"
echo "PORT environment variable: $PORT"
echo "============================================================"

# Start gunicorn (exec replaces the shell process)
exec gunicorn core.wsgi:application \
    --bind 0.0.0.0:$PORT \
    --workers 2 \
    --threads 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info

