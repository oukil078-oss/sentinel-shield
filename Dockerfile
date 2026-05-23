FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app/ ./app/
COPY backend/app/db/seed.py ./seed.py

# Create directories for data, models, datasets
RUN mkdir -p /app/data /app/ml_artifacts /app/datasets

ENV PYTHONPATH=/app
ENV PORT=8000

# Initialize and seed on startup
CMD sh -c "python -c 'from app.db.database import init_db; init_db()' && python -c 'from app.db.seed import seed_all; seed_all()' 2>/dev/null || true && uvicorn app.main:app --host 0.0.0.0 --port 8000"
