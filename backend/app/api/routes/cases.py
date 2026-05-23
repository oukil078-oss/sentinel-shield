from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from app.api.deps import get_db, get_current_user, require_role
from app.db.models import (
    AnalystCase, CaseStatus, CasePriority, User, RoleEnum,
    DetectionResult, ReviewComment, AuditLog
)
from app.schemas.detections import CaseOut, CaseUpdate, CommentCreate, CommentOut, UserBriefOut

router = APIRouter()

@router.get("/", response_model=List[CaseOut])
def list_cases(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee_id: Optional[UUID] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AnalystCase).order_by(desc(AnalystCase.created_at))
    if status:
        query = query.filter(AnalystCase.status == status)
    if priority:
        query = query.filter(AnalystCase.priority == priority)
    if assignee_id:
        query = query.filter(AnalystCase.assignee_id == assignee_id)
    if search:
        query = query.join(DetectionResult).filter(
            DetectionResult.request.has(subject=search)  # simplified
        )
    
    total = query.count()
    cases = query.offset((page - 1) * page_size).limit(page_size).all()
    
    out = []
    for c in cases:
        assignee = None
        if c.assignee:
            assignee = UserBriefOut.model_validate(c.assignee)
        det = c.detection
        det_item = {
            "id": det.id,
            "label": det.label,
            "confidence": det.confidence,
            "risk_score": det.risk_score,
            "sender": det.request.sender,
            "subject": det.request.subject,
            "created_at": det.created_at,
            "reviewed": det.reviewed
        }
        out.append(CaseOut(
            id=c.id,
            detection_result_id=c.detection_result_id,
            status=c.status,
            priority=c.priority,
            assignee_id=c.assignee_id,
            title=c.title,
            description=c.description,
            notes=c.notes,
            created_at=c.created_at,
            updated_at=c.updated_at,
            resolved_at=c.resolved_at,
            detection=det_item,
            assignee=assignee
        ))
    return out

@router.get("/{case_id}", response_model=CaseOut)
def get_case(
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(AnalystCase).filter(AnalystCase.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
    assignee = UserBriefOut.model_validate(c.assignee) if c.assignee else None
    det = c.detection
    det_item = {
        "id": det.id,
        "label": det.label,
        "confidence": det.confidence,
        "risk_score": det.risk_score,
        "sender": det.request.sender,
        "subject": det.request.subject,
        "created_at": det.created_at,
        "reviewed": det.reviewed
    }
    return CaseOut(
        id=c.id,
        detection_result_id=c.detection_result_id,
        status=c.status,
        priority=c.priority,
        assignee_id=c.assignee_id,
        title=c.title,
        description=c.description,
        notes=c.notes,
        created_at=c.created_at,
        updated_at=c.updated_at,
        resolved_at=c.resolved_at,
        detection=det_item,
        assignee=assignee
    )

@router.put("/{case_id}")
def update_case(
    case_id: UUID,
    payload: CaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.analyst, RoleEnum.soc_manager, RoleEnum.super_admin))
):
    c = db.query(AnalystCase).filter(AnalystCase.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
    
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(c, k, v)
    if payload.status == CaseStatus.resolved and not c.resolved_at:
        c.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(c)
    return c

@router.post("/{case_id}/comments")
def add_comment(
    case_id: UUID,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(AnalystCase).filter(AnalystCase.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
    comment = ReviewComment(case_id=case_id, user_id=current_user.id, content=payload.content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment

@router.get("/{case_id}/comments")
def list_comments(
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(ReviewComment).filter(ReviewComment.case_id == case_id).order_by(desc(ReviewComment.created_at)).all()
