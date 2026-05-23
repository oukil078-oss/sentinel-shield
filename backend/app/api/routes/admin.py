from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timezone

from app.api.deps import get_db, get_current_user, require_role
from app.db.models import User, RoleEnum, AuditLog, ModelVersion, TrainingJob
from app.schemas.auth import UserCreate, UserOut, UserUpdate
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/users")
def admin_list_users(
    db: Session = Depends(get_db),
    current_user = Depends(require_role(RoleEnum.super_admin))
):
    return db.query(User).all()

@router.post("/users")
def admin_create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(RoleEnum.super_admin))
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=payload.role,
        avatar_url=payload.avatar_url
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}")
def admin_update_user(
    user_id: UUID,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(RoleEnum.super_admin))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user

@router.get("/audit-logs")
def list_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(RoleEnum.super_admin))
):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
