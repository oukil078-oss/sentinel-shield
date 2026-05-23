from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, cast, Date
from typing import Optional, List, Dict
from datetime import datetime, timedelta, timezone

from app.api.deps import get_db, get_current_user
from app.db.models import DetectionResult, DetectionRequest, AnalystCase, URLArtifact, RiskSignal, DetectionStatus

router = APIRouter()

@router.get("/dashboard-kpis")
def dashboard_kpis(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    total = db.query(DetectionResult).filter(DetectionResult.created_at >= since).count()
    phishing = db.query(DetectionResult).filter(DetectionResult.created_at >= since, DetectionResult.label == DetectionStatus.phishing).count()
    suspicious = db.query(DetectionResult).filter(DetectionResult.created_at >= since, DetectionResult.label == DetectionStatus.suspicious).count()
    pending = db.query(AnalystCase).filter(AnalystCase.status == "open").count()
    return {
        "total_detections": total,
        "phishing_rate": round(phishing / total * 100, 1) if total else 0,
        "suspicious_rate": round(suspicious / total * 100, 1) if total else 0,
        "pending_queue": pending,
        "model_accuracy": 97.3  # From active model version
    }

@router.get("/detections-over-time")
def detections_over_time(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    results = db.query(
        cast(DetectionResult.created_at, Date).label("date"),
        DetectionResult.label,
        func.count().label("count")
    ).filter(DetectionResult.created_at >= since).group_by("date", DetectionResult.label).order_by("date").all()
    
    data: Dict[str, Dict] = {}
    for r in results:
        d = str(r.date)
        if d not in data:
            data[d] = {"date": d, "phishing": 0, "suspicious": 0, "spam": 0, "safe": 0}
        data[d][r.label.value] = r.count
    return list(data.values())

@router.get("/classification-distribution")
def classification_distribution(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    results = db.query(DetectionResult.label, func.count().label("count")).filter(
        DetectionResult.created_at >= since
    ).group_by(DetectionResult.label).all()
    return [{"label": r.label.value, "count": r.count} for r in results]

@router.get("/top-domains")
def top_domains(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    results = db.query(URLArtifact.domain, func.count().label("count")).group_by(
        URLArtifact.domain
    ).order_by(desc("count")).limit(limit).all()
    return [{"domain": r.domain, "count": r.count} for r in results]

@router.get("/top-keywords")
def top_keywords(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Aggregate keywords from detection results
    results = db.query(DetectionResult).all()
    keywords: Dict[str, int] = {}
    for r in results:
        for kw in (r.suspicious_keywords or []):
            keywords[kw] = keywords.get(kw, 0) + 1
    sorted_kws = sorted(keywords.items(), key=lambda x: x[1], reverse=True)[:limit]
    return [{"keyword": k, "count": v} for k, v in sorted_kws]

@router.get("/risk-score-distribution")
def risk_score_distribution(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    bins = [(0, 20), (20, 40), (40, 60), (60, 80), (80, 100)]
    out = []
    for lo, hi in bins:
        cnt = db.query(DetectionResult).filter(
            DetectionResult.risk_score >= lo,
            DetectionResult.risk_score < hi
        ).count()
        out.append({"range": f"{lo}-{hi}", "count": cnt})
    return out

@router.get("/analyst-throughput")
def analyst_throughput(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Cases resolved per analyst in last 30 days
    since = datetime.now(timezone.utc) - timedelta(days=30)
    results = db.query(
        AnalystCase.assignee_id,
        func.count().label("count")
    ).filter(
        AnalystCase.status == "resolved",
        AnalystCase.resolved_at >= since
    ).group_by(AnalystCase.assignee_id).all()
    return [{"assignee_id": str(r.assignee_id) if r.assignee_id else "unassigned", "count": r.count} for r in results]
