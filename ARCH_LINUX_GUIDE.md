# Sentinel-Shield — Arch Linux Local Setup Guide

Complete step-by-step to run Sentinel-Shield on your Arch Linux machine.

---

## Option 1: Docker (Recommended — 5 minutes)

### Step 1: Install Docker & docker-compose

```bash
# Update system
sudo pacman -Syu

# Install Docker and Compose
sudo pacman -S docker docker-compose

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (log out and back in after)
sudo usermod -aG docker $USER
```

> ⚠️ **Important**: After `usermod -aG docker $USER`, you **must log out and log back in** (or reboot) for group changes to take effect.

### Step 2: Clone the Repository

```bash
cd ~
git clone https://github.com/oukil078-oss/sentinel-shield.git
cd sentinel-shield
```

### Step 3: Build & Start Everything

```bash
# Use the local development compose
docker-compose -f docker-compose.local.yml up -d --build
```

This builds the backend (FastAPI) and frontend (Next.js) containers and starts them.

### Step 4: Initialize Database & Seed Data

```bash
# Wait 10 seconds for containers to start, then seed
docker-compose -f docker-compose.local.yml exec backend python -c "
from app.db.database import init_db
from app.db.seed import seed_all
init_db()
seed_all()
"
```

### Step 5: Access the App

| Service | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **API Docs (Swagger)** | http://localhost:8000/docs |
| **Health Check** | http://localhost:8000/health |

### Step 6: Login

Go to http://localhost:3000 and use any of these pre-seeded accounts:

| Role | Email | Password |
|---|---|---|
| Super Admin | `zakaryaoukil2003@gmail.com` | `Zakarya@2026Secure` |
| Analyst | `analyst@sentinel-shield.io` | `Analyst@2026` |
| SOC Manager | `manager@sentinel-shield.io` | `Manager@2026` |
| Viewer | `viewer@sentinel-shield.io` | `Viewer@2026` |

### Useful Docker Commands

```bash
# View logs
docker-compose -f docker-compose.local.yml logs -f

# View backend logs only
docker-compose -f docker-compose.local.yml logs -f backend

# Restart
docker-compose -f docker-compose.local.yml restart

# Stop everything
docker-compose -f docker-compose.local.yml down

# Stop and remove data volumes
docker-compose -f docker-compose.local.yml down -v

# Rebuild after code changes
docker-compose -f docker-compose.local.yml up -d --build
```

---

## Option 2: Native Development (No Docker)

### Step 1: Install System Dependencies

```bash
sudo pacman -Syu
sudo pacman -S python python-pip python-venv nodejs npm git

# Optional: PostgreSQL (SQLite is used by default, zero-config)
# sudo pacman -S postgresql
```

### Step 2: Setup Backend

```bash
cd ~/sentinel-shield/backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database (SQLite — zero config)
python -c "from app.db.database import init_db; init_db()"

# Seed demo data (users, detections, cases, models)
python -c "from app.db.seed import seed_all; seed_all()"

# Train initial ML model (optional — fallback heuristic works without it)
python -c "from app.ml.train import train_model_job; train_model_job('init')"
```

### Step 3: Start Backend

```bash
# From within ~/sentinel-shield/backend, with .venv activated:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be at: http://localhost:8000

### Step 4: Setup Frontend (New Terminal)

```bash
cd ~/sentinel-shield/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will be at: http://localhost:3000

### Step 5: Login

Open http://localhost:3000 and use the demo credentials above.

---

## Troubleshooting

### Port 8000 or 3000 already in use

```bash
# Find what's using port 8000
sudo lsof -i :8000

# Kill it
kill -9 <PID>

# Or use different ports in docker-compose.local.yml
```

### "Cannot connect to Docker daemon"

You forgot to log out/log in after `usermod -aG docker`. Run:
```bash
newgrp docker
```
Or just reboot.

### "Module not found" errors in backend

Make sure you're inside the virtual environment:
```bash
cd ~/sentinel-shield/backend
source .venv/bin/activate
```

### Frontend "Failed to fetch"

The frontend defaults to `http://localhost:8000/api/v1`. Make sure:
1. Backend is running on port 8000
2. No firewall is blocking localhost (shouldn't be an issue on Arch)
3. If you changed ports, update the Backend URL on the login page

### Database locked (SQLite concurrency)

SQLite handles single-writer fine. If you get locks, it means two processes are writing. Restart the backend:
```bash
docker-compose -f docker-compose.local.yml restart backend
```

### Want PostgreSQL instead of SQLite?

```bash
# Install PostgreSQL
sudo pacman -S postgresql
sudo -u postgres initdb -D /var/lib/postgres/data
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql -c "CREATE DATABASE sentinel;"
sudo -u postgres psql -c "CREATE USER sentinel WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sentinel TO sentinel;"

# Set env var before starting backend
export DATABASE_URL="postgresql://sentinel:yourpassword@localhost:5432/sentinel"
```

---

## File Structure After Setup

```
sentinel-shield/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # All API endpoints
│   │   ├── core/            # Config, security
│   │   ├── db/              # Models, seed data
│   │   ├── ml/              # Training + inference
│   │   └── main.py          # Entry point
│   ├── .venv/               # Python virtual env (native only)
│   └── requirements.txt
├── frontend/
│   ├── app/                 # Next.js pages
│   ├── components/            # UI components
│   ├── lib/                   # Utils
│   └── node_modules/          # npm packages
├── data/                      # SQLite database (Docker)
├── ml_artifacts/              # Trained models
├── docker-compose.local.yml   # Local Docker config
└── Dockerfile                 # Backend image
```

---

## Development Tips

### Hot Reload

- **Native**: Both backend (`--reload`) and frontend (`npm run dev`) auto-reload on file changes
- **Docker**: Edit files locally, then run `docker-compose -f docker-compose.local.yml restart <service>`

### Adding New API Endpoints

1. Add route in `backend/app/api/routes/`
2. Register in `backend/app/main.py`
3. Frontend will auto-detect (no rebuild needed in dev mode)

### ML Model Retraining

From the **Model Management** page in the app, click **"Retrain Model"** — this triggers the training pipeline in the background.

Or manually:
```bash
cd ~/sentinel-shield/backend
source .venv/bin/activate
python -c "from app.ml.train import train_model_job; train_model_job('manual')"
```

---

**Owner**: Zakarya Oukil — zakaryaoukil2003@gmail.com
