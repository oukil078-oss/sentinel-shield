from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timezone

from app.api.deps import get_db, get_current_user, require_role
from app.db.models import ModelVersion, TrainingJob, JobStatus, RoleEnum
from app.ml.train import train_model_job

router = APIRouter()

@router.get("/versions")
def list_versions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(ModelVersion).order_by(ModelVersion.created_at.desc()).all()

@router.get("/active")
def get_active_model(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    mv = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
    if not mv:
        raise HTTPException(status_code=404, detail="No active model")
    return mv

@router.post("/{version_id}/deploy")
def deploy_version(
    version_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(RoleEnum.super_admin, RoleEnum.soc_manager))
):
    mv = db.query(ModelVersion).filter(ModelVersion.id == version_id).first()
    if not mv:
        raise HTTPException(status_code=404, detail="Model version not found")
    # Deactivate current
    db.query(ModelVersion).update({"is_active": False})
    mv.is_active = True
    mv.deployed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(mv)
    return mv

@router.post("/retrain")
def trigger_retrain(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(RoleEnum.super_admin, RoleEnum.soc_manager))
):
    job = TrainingJob(status=JobStatus.queued, algorithm="tfidf_logistic")
    db.add(job)
    db.commit()
    db.refresh(job)
    # In a real setup, use RQ. For demo, we'll run sync or background task.
    background_tasks.add_task(train_model_job, str(job.id))
    return {"job_id": job.id, "status": "queued"}

@router.get("/training-jobs")
def list_training_jobs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(TrainingJob).order_by(TrainingJob.created_at.desc()).all()
