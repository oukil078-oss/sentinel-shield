from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta
import structlog

from app.api.deps import get_db, get_current_user, require_role
from app.db.models import (
    User, DetectionRequest, DetectionResult, URLArtifact, RiskSignal,
    AnalystCase, CaseStatus, CasePriority, DetectionStatus, ModelVersion, AuditLog
)
from app.schemas.detections import (
    DetectionRequestIn, DetectionResultOut, DetectionListItem,
    DetectionDetailOut, AnalyzeResponse, CaseCreate
)
from app.ml.inference import PhishingInference
from app.core.config import get_settings

router = APIRouter()
logger = structlog.get_logger()
settings = get_settings()

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(
    payload: DetectionRequestIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Create request record
    req = DetectionRequest(
        content=payload.content,
        content_type=payload.content_type,
        sender=payload.sender,
        subject=payload.subject,
        raw_headers=payload.raw_headers,
        user_id=current_user.id
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    
    # Run inference
    inference = PhishingInference(settings.MODEL_PATH)
    prediction = inference.predict(payload.content, payload.sender or "")
    
    # Get active model version
    model_version = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
    
    # Create result
    result = DetectionResult(
        request_id=req.id,
        label=prediction["label"],
        confidence=prediction["confidence"],
        risk_score=prediction["risk_score"],
        model_version_id=model_version.id if model_version else None,
        explanations=prediction.get("explanations", []),
        extracted_urls=prediction.get("urls", []),
        suspicious_keywords=prediction.get("keywords", []),
        urgency_markers=prediction.get("urgency", []),
        social_engineering_cues=prediction.get("social_eng", []),
        recommended_actions=prediction.get("actions", [])
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    
    # Create URL artifacts
    for url_data in prediction.get("url_details", []):
        artifact = URLArtifact(
            detection_result_id=result.id,
            url=url_data["url"],
            domain=url_data["domain"],
            is_malicious=url_data.get("is_malicious", False),
            reputation_score=url_data.get("reputation_score", 0.5)
        )
        db.add(artifact)
    
    # Create risk signals
    for sig in prediction.get("risk_signals", []):
        rs = RiskSignal(
            detection_result_id=result.id,
            signal_type=sig["type"],
            severity=sig["severity"],
            description=sig["description"]
        )
        db.add(rs)
    
    db.commit()
    db.refresh(result)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="analyze",
        entity_type="detection",
        entity_id=str(result.id),
        details={"label": prediction["label"], "risk_score": prediction["risk_score"]}
    )
    db.add(audit)
    db.commit()
    
    return AnalyzeResponse(
        result=DetectionResultOut.model_validate(result),
        request_id=req.id
    )

@router.post("/analyze-file")
def analyze_file(
    file: UploadFile = File(...),
    content_type: str = "email",
    sender: Optional[str] = None,
    subject: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = file.file.read().decode("utf-8", errors="ignore")
    payload = DetectionRequestIn(
        content=content,
        content_type=content_type,
        sender=sender,
        subject=subject or file.filename
    )
    return analyze(payload, db, current_user)

@router.get("/", response_model=List[DetectionListItem])
def list_detections(
    limit: int = 50,
    offset: int = 0,
    label: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(DetectionResult, DetectionRequest).join(DetectionRequest).order_by(desc(DetectionResult.created_at))
    if label:
        query = query.filter(DetectionResult.label == label)
    results = query.limit(limit).offset(offset).all()
    out = []
    for dr, dreq in results:
        out.append(DetectionListItem(
            id=dr.id,
            label=dr.label,
            confidence=dr.confidence,
            risk_score=dr.risk_score,
            sender=dreq.sender,
            subject=dreq.subject,
            created_at=dr.created_at,
            reviewed=dr.reviewed
        ))
    return out

@router.get("/{detection_id}", response_model=DetectionDetailOut)
def get_detection(
    detection_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = db.query(DetectionResult).filter(DetectionResult.id == detection_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Detection not found")
    
    # Build detail manually to handle relationships
    req_out = {
        "id": result.request.id,
        "content": result.request.content,
        "content_type": result.request.content_type,
        "sender": result.request.sender,
        "subject": result.request.subject,
        "created_at": result.request.created_at
    }
    
    url_artifacts = db.query(URLArtifact).filter(URLArtifact.detection_result_id == detection_id).all()
    risk_signals = db.query(RiskSignal).filter(RiskSignal.detection_result_id == detection_id).all()
    
    return DetectionDetailOut(
        id=result.id,
        request_id=result.request_id,
        label=result.label,
        confidence=result.confidence,
        risk_score=result.risk_score,
        model_version_id=result.model_version_id,
        explanations=result.explanations,
        extracted_urls=result.extracted_urls,
        suspicious_keywords=result.suspicious_keywords,
        urgency_markers=result.urgency_markers,
        social_engineering_cues=result.social_engineering_cues,
        recommended_actions=result.recommended_actions,
        created_at=result.created_at,
        reviewed=result.reviewed,
        analyst_id=result.analyst_id,
        request=req_out,
        url_artifacts=url_artifacts,
        risk_signals=risk_signals
    )

@router.post("/{detection_id}/create-case")
def create_case_from_detection(
    detection_id: UUID,
    payload: CaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.analyst, RoleEnum.soc_manager, RoleEnum.super_admin))
):
    dr = db.query(DetectionResult).filter(DetectionResult.id == detection_id).first()
    if not dr:
        raise HTTPException(status_code=404, detail="Detection not found")
    
    existing = db.query(AnalystCase).filter(AnalystCase.detection_result_id == detection_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Case already exists for this detection")
    
    case = AnalystCase(
        detection_result_id=detection_id,
        priority=payload.priority,
        title=payload.title or (dr.request.subject or "Untitled Detection"),
        description=payload.description
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return case
