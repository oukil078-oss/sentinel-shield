#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "==================================="
echo "  Sentinel-Shield Arch Linux Setup"
echo "==================================="
echo -e "${NC}"

# Detect if we should use Docker or native
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    USE_DOCKER=true
    echo -e "${GREEN}✓ Docker detected. Using Docker deployment.${NC}"
else
    USE_DOCKER=false
    echo -e "${YELLOW}! Docker not detected. Using native Python/Node deployment.${NC}"
fi

echo ""

# =====================================
# DOCKER PATH
# =====================================
if [ "$USE_DOCKER" = true ]; then
    echo -e "${BLUE}[1/4] Building and starting Docker containers...${NC}"
    
    if ! docker info &> /dev/null; then
        echo -e "${RED}✗ Docker daemon is not running. Start it with: sudo systemctl start docker${NC}"
        exit 1
    fi
    
    docker-compose -f docker-compose.local.yml down &> /dev/null || true
    docker-compose -f docker-compose.local.yml up -d --build
    
    echo -e "${GREEN}✓ Containers started${NC}"
    echo -e "${BLUE}[2/4] Waiting for backend to initialize...${NC}"
    sleep 10
    
    echo -e "${BLUE}[3/4] Seeding database...${NC}"
    docker-compose -f docker-compose.local.yml exec -T backend python -c "
from app.db.database import init_db
from app.db.seed import seed_all
try:
    init_db()
    seed_all()
    print('Database initialized and seeded successfully')
except Exception as e:
    print(f'DB init/seed result: {e}')
" || echo -e "${YELLOW}Database may already be initialized${NC}"
    
    echo -e "${GREEN}✓ Database ready${NC}"
    
    echo ""
    echo -e "${GREEN}===================================${NC}"
    echo -e "${GREEN}  SETUP COMPLETE (Docker)${NC}"
    echo -e "${GREEN}===================================${NC}"
    echo ""
    echo -e "Frontend:  ${BLUE}http://localhost:3000${NC}"
    echo -e "Backend:   ${BLUE}http://localhost:8000${NC}"
    echo -e "API Docs:  ${BLUE}http://localhost:8000/docs${NC}"
    echo ""
    echo "Demo Credentials:"
    echo "  Super Admin: zakaryaoukil2003@gmail.com / Zakarya@2026Secure"
    echo "  Analyst:     analyst@sentinel-shield.io / Analyst@2026"
    echo "  Manager:     manager@sentinel-shield.io / Manager@2026"
    echo "  Viewer:      viewer@sentinel-shield.io / Viewer@2026"
    echo ""
    echo "Commands:"
    echo "  Logs:     docker-compose -f docker-compose.local.yml logs -f"
    echo "  Stop:     docker-compose -f docker-compose.local.yml down"
    echo "  Restart:  docker-compose -f docker-compose.local.yml restart"
    echo ""
    exit 0
fi

# =====================================
# NATIVE PATH
# =====================================
echo -e "${BLUE}[1/6] Checking system dependencies...${NC}"

# Check python
if ! command -v python &> /dev/null; then
    echo -e "${RED}✗ Python not found. Install it: sudo pacman -S python python-pip${NC}"
    exit 1
fi

# Check node
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Install it: sudo pacman -S nodejs npm${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python and Node.js detected${NC}"

# Backend setup
echo -e "${BLUE}[2/6] Setting up Python backend...${NC}"
cd backend

if [ ! -d ".venv" ]; then
    python -m venv .venv
fi

source .venv/bin/activate

pip install -r requirements.txt

echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Database init
echo -e "${BLUE}[3/6] Initializing database...${NC}"
python -c "from app.db.database import init_db; init_db()"
python -c "from app.db.seed import seed_all; seed_all()"
echo -e "${GREEN}✓ Database seeded with demo data${NC}"

# Train initial model (optional, fallback works without it)
echo -e "${BLUE}[4/6] Training initial ML model...${NC}"
python -c "from app.ml.train import train_model_job; train_model_job('init')" || echo -e "${YELLOW}Model training skipped (fallback heuristic will be used)${NC}"

# Start backend in background
echo -e "${BLUE}[5/6] Starting backend server...${NC}"
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid
sleep 3

# Check if backend started
if curl -s http://localhost:8000/health &> /dev/null; then
    echo -e "${GREEN}✓ Backend running on http://localhost:8000${NC}"
else
    echo -e "${YELLOW}! Backend may still be starting. Check backend.log${NC}"
fi

# Frontend setup
echo -e "${BLUE}[6/6] Setting up Next.js frontend...${NC}"
cd ../frontend

if [ ! -d "node_modules" ]; then
    npm install
fi

nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
sleep 5

echo -e "${GREEN}✓ Frontend running on http://localhost:3000${NC}"

# Summary
echo ""
echo -e "${GREEN}===================================${NC}"
echo -e "${GREEN}  SETUP COMPLETE (Native)${NC}"
echo -e "${GREEN}===================================${NC}"
echo ""
echo -e "Frontend:  ${BLUE}http://localhost:3000${NC}"
echo -e "Backend:   ${BLUE}http://localhost:8000${NC}"
echo -e "API Docs:  ${BLUE}http://localhost:8000/docs${NC}"
echo ""
echo "Demo Credentials:"
echo "  Super Admin: zakaryaoukil2003@gmail.com / Zakarya@2026Secure"
echo "  Analyst:     analyst@sentinel-shield.io / Analyst@2026"
echo "  Manager:     manager@sentinel-shield.io / Manager@2026"
echo "  Viewer:      viewer@sentinel-shield.io / Viewer@2026"
echo ""
echo "Process management:"
echo "  Backend PID:  $BACKEND_PID  (log: backend.log)"
echo "  Frontend PID: $FRONTEND_PID (log: frontend.log)"
echo "  Stop:         kill \$(cat backend.pid) && kill \$(cat frontend.pid)"
echo ""
