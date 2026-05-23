# Sentinel-Shield

**AI-Powered Threat Intelligence. Built for the Modern SOC.**

A production-grade AI cybersecurity SaaS platform with real phishing detection, analyst case management, model lifecycle management, and an AI assistant — all wrapped in a premium dark enterprise UI.

---

## Live URLs

- **Frontend (Vercel):** https://frontend-lgiu5sy7y-oukil078-oss-projects.vercel.app
- **Backend API:** Configure your own (see Self-Host section below)
- **GitHub Repo:** https://github.com/oukil078-oss/sentinel-shield

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | zakaryaoukil2003@gmail.com | Zakarya@2026Secure |
| Analyst | analyst@sentinel-shield.io | Analyst@2026 |
| SOC Manager | manager@sentinel-shield.io | Manager@2026 |
| Viewer | viewer@sentinel-shield.io | Viewer@2026 |

---

## Self-Host in 5 Minutes (Any VPS/EC2/DigitalOcean)

### Option 1: One-Command Deploy (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/oukil078-oss/sentinel-shield/main/deploy.sh | bash -s -- /opt/sentinel-shield your-domain.com
```

This installs Docker, clones the repo, builds everything, and starts on ports 8000 (API) and 3000 (frontend).

### Option 2: Manual Docker Deploy

```bash
# 1. Clone
git clone https://github.com/oukil078-oss/sentinel-shield.git
cd sentinel-shield

# 2. Configure environment
cp .env.example .env
# Edit .env and set your domain/keys

# 3. Start everything
docker-compose up -d --build

# 4. Initialize database
docker-compose exec backend python -c "from app.db.database import init_db; init_db()"
docker-compose exec backend python -c "from app.db.seed import seed_all; seed_all()"

# 5. Access
# Backend API: http://your-server:8000
# Frontend:   http://your-server:3000
```

### Option 3: Production with Caddy (Auto HTTPS)

```bash
# Set your domain in .env: DOMAIN=your-domain.com
docker-compose -f docker-compose.prod.yml up -d --build
```

Caddy automatically provisions Let's Encrypt SSL certificates.

---

## Point Vercel Frontend to Your Backend

1. Open the deployed frontend: https://frontend-lgiu5sy7y-oukil078-oss-projects.vercel.app
2. Click **"Backend URL"** on the login page
3. Enter your backend URL: `http://your-server:8000/api/v1` (or `https://your-domain.com/api/v1` with Caddy)
4. Click **Save Backend URL**
5. Log in with any demo credentials above

---

## Tech Stack

**Frontend**
- Next.js 16 (App Router)
- React + TypeScript
- Tailwind CSS with exact design tokens
- Framer Motion animations
- Recharts for data visualization

**Backend**
- FastAPI + Python 3.11
- SQLAlchemy + SQLite/PostgreSQL
- JWT authentication with refresh tokens
- RBAC middleware
- scikit-learn ML pipeline

**Deployment**
- Frontend: Vercel (free)
- Backend: Self-hosted Docker (any VPS)
- Database: SQLite (zero-config) or PostgreSQL

---

## Project Structure

```
sentinel-shield/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # FastAPI routers (auth, detections, cases, analytics, models, admin, chat)
│   │   ├── core/            # Config, security, deps
│   │   ├── db/              # SQLAlchemy models, seed data
│   │   ├── ml/              # Training + inference pipeline
│   │   └── main.py          # App entrypoint
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/                 # Next.js pages (dashboard, detection, cases, analytics, models, admin, chat, settings)
│   ├── components/            # UI components (sidebar, topbar, cards)
│   ├── lib/                   # Utilities
│   ├── Dockerfile
│   └── package.json
├── deploy.sh                # One-command self-host script
├── docker-compose.yml         # Dev compose (backend + frontend)
├── docker-compose.prod.yml    # Prod compose (backend + Caddy)
├── Caddyfile                 # Reverse proxy config
└── README.md
```

---

## Features

- **Sentinel-Phishing**: AI-powered email and SMS phishing detection with explainable risk scoring
- **Sentinel-Cards**: Credit card fraud detection (Coming Soon page)
- **AI Assistant**: Context-aware chatbot acting as a senior phishing analyst
- **Analyst Queue**: Full case management with filters, search, sorting, activity timelines
- **Analytics Dashboard**: Real-time threat metrics with Recharts visualizations
- **Model Management**: Train, deploy, rollback, and monitor ML models
- **Admin Panel**: User management and audit logs
- **Dark/Light Mode**: Premium theme toggle across every page
- **Responsive Design**: Desktop, tablet, and mobile optimized

---

## Owner

**Zakarya Oukil** — zakaryaoukil2003@gmail.com

---

## License

Internal / Demo use. All rights reserved.
