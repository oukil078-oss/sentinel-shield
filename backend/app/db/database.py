from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import structlog
import os

logger = structlog.get_logger()

# Get database URL from env or use SQLite default
database_url = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:nH2eoIZoLnUq90Xy@db.xpccbkhgsrmkqxyprrtg.supabase.co:5432/postgres"
)

# Handle SQLite
if database_url.startswith("sqlite"):
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=False,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    logger.info("database_initialized", engine_type="sqlite" if database_url.startswith("sqlite") else "postgresql")
