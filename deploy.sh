#!/bin/bash
set -e

echo "==================================="
echo "  Sentinel-Shield Self-Host Deploy"
echo "==================================="
echo ""

# Configuration
REPO_URL="https://github.com/oukil078-oss/sentinel-shield.git"
INSTALL_DIR="${1:-/opt/sentinel-shield}"
DOMAIN="${2:-localhost}"
EMAIL="${3:-zakaryaoukil2003@gmail.com}"

echo "Installing to: $INSTALL_DIR"
echo "Domain: $DOMAIN"
echo ""

# 1. Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "[1/7] Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    usermod -aG docker $USER || true
fi

# 2. Install docker-compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "[2/7] Installing docker-compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 3. Clone repo
if [ -d "$INSTALL_DIR" ]; then
    echo "[3/7] Updating existing installation..."
    cd "$INSTALL_DIR"
    git pull origin main
else
    echo "[3/7] Cloning repository..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# 4. Create environment file
if [ ! -f .env ]; then
    echo "[4/7] Creating environment configuration..."
    cat > .env << EOF
# Database (using built-in SQLite for zero-config deploy, or set your PostgreSQL)
DATABASE_URL=sqlite:///./data/sentinel.db
SECRET_KEY=$(openssl rand -hex 32)
MODEL_PATH=./ml_artifacts
DATASET_PATH=./datasets
REDIS_URL=
PORT=8000

# Frontend will point to this backend
NEXT_PUBLIC_API_URL=http://$DOMAIN:8000/api/v1
EOF
fi

# 5. Build and start
if [ "$DOMAIN" != "localhost" ]; then
    echo "[5/7] Production build with Caddy reverse proxy..."
    docker-compose -f docker-compose.prod.yml up -d --build
else
    echo "[5/7] Development build..."
    docker-compose up -d --build
fi

# 6. Initialize database and seed
echo "[6/7] Initializing database and seeding data..."
sleep 5
docker-compose exec -T backend python -c "
from app.db.database import init_db
from app.db.seed import seed_all
init_db()
seed_all()
" || echo "Database already initialized or using SQLite auto-init"

# 7. Health check
echo "[7/7] Health check..."
sleep 2
if curl -s http://localhost:8000/health > /dev/null; then
    echo ""
    echo "==================================="
    echo "  DEPLOYMENT SUCCESSFUL!"
    echo "==================================="
    echo ""
    echo "Backend API:    http://$DOMAIN:8000/api/v1"
    echo "Health Check:   http://$DOMAIN:8000/health"
    echo "Frontend:       http://$DOMAIN:3000"
    echo ""
    echo "Demo Credentials:"
    echo "  Super Admin: zakaryaoukil2003@gmail.com / Zakarya@2026Secure"
    echo "  Analyst:     analyst@sentinel-shield.io / Analyst@2026"
    echo "  Manager:     manager@sentinel-shield.io / Manager@2026"
    echo "  Viewer:      viewer@sentinel-shield.io / Viewer@2026"
    echo ""
    echo "To update: cd $INSTALL_DIR && git pull && docker-compose up -d --build"
    echo "To view logs: docker-compose logs -f"
    echo ""
else
    echo "WARNING: Health check failed. Check logs with: docker-compose logs"
fi
