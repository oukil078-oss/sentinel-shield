#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}  Sentinel-Shield VPS Deploy Script${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Update and install Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}[1/5] Installing Docker...${NC}"
    if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu
        apt-get update -qq
        apt-get install -y -qq docker.io docker-compose
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        yum install -y -q docker docker-compose
    elif command -v dnf &> /dev/null; then
        dnf install -y -q docker docker-compose
    elif command -v pacman &> /dev/null; then
        # Arch
        pacman -Syu --noconfirm docker docker-compose
    else
        echo "Unsupported OS. Please install Docker manually."
        exit 1
    fi
    systemctl start docker 2>/dev/null || service docker start 2>/dev/null || true
    systemctl enable docker 2>/dev/null || true
fi

# Create app directory
INSTALL_DIR="/opt/sentinel-shield"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Clone repo
echo -e "${YELLOW}[2/5] Cloning repository...${NC}"
if [ -d ".git" ]; then
    git pull origin main
else
    git clone https://github.com/oukil078-oss/sentinel-shield.git .
fi

# Write environment file
echo -e "${YELLOW}[3/5] Configuring environment...${NC}"
cat > .env << 'EOF'
DATABASE_URL=sqlite:///./data/sentinel.db
SECRET_KEY=sentinel-shield-vps-production-secret-key-2026
MODEL_PATH=/app/ml_artifacts
DATASET_PATH=/app/datasets
PORT=8000
EOF

# Pull/build and start
echo -e "${YELLOW}[4/5] Building and starting containers...${NC}"
docker-compose -f docker-compose.local.yml down 2>/dev/null || true
docker-compose -f docker-compose.local.yml up -d --build

# Wait for backend
echo -e "${YELLOW}[5/5] Initializing database...${NC}"
sleep 15

docker-compose -f docker-compose.local.yml exec -T backend python -c "
from app.db.database import init_db
from app.db.seed import seed_all
init_db()
seed_all()
" 2>/dev/null || echo "Database may already be initialized"

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Backend API:    ${BLUE}http://${SERVER_IP}:8000/api/v1${NC}"
echo -e "Health Check:   ${BLUE}http://${SERVER_IP}:8000/health${NC}"
echo -e "API Docs:       ${BLUE}http://${SERVER_IP}:8000/docs${NC}"
echo -e "Frontend:       ${BLUE}http://${SERVER_IP}:3000${NC}"
echo ""
echo "Demo Credentials:"
echo "  Super Admin: zakaryaoukil2003@gmail.com / Zakarya@2026Secure"
echo "  Analyst:     analyst@sentinel-shield.io / Analyst@2026"
echo "  Manager:     manager@sentinel-shield.io / Manager@2026"
echo "  Viewer:      viewer@sentinel-shield.io / Viewer@2026"
echo ""
echo "Next steps:"
echo "  1. Open your Vercel frontend: https://frontend-jfrdwxa1c-oukil078-oss-projects.vercel.app"
echo "  2. Click 'Backend URL' on the login page"
echo "  3. Enter: http://${SERVER_IP}:8000/api/v1"
echo "  4. Save and login with any demo credentials"
echo ""
echo "Commands:"
echo "  View logs:    docker-compose -f docker-compose.local.yml logs -f"
echo "  Stop:         docker-compose -f docker-compose.local.yml down"
echo "  Restart:      docker-compose -f docker-compose.local.yml restart"
echo ""
