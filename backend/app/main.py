from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import structlog
import time

from app.core.config import get_settings
from app.db.database import init_db
from app.api.routes import auth, users, detections, cases, analytics, models, admin, chat, notifications, settings as settings_route

settings = get_settings()
logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("app_startup", app_name=settings.APP_NAME)
    init_db()
    yield
    logger.info("app_shutdown")

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Threat Intelligence. Built for the Modern SOC.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(detections.router, prefix="/api/v1/detections", tags=["Detections"])
app.include_router(cases.router, prefix="/api/v1/cases", tags=["Cases"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(models.router, prefix="/api/v1/models", tags=["Model Management"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["AI Assistant"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(settings_route.router, prefix="/api/v1/settings", tags=["Settings"])

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": settings.APP_NAME}
