from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from app.db.models import DetectionStatus, CasePriority, CaseStatus

class DetectionRequestIn(BaseModel):
    content: str = Field(..., min_length=1)
    content_type: str = Field(default="email")  # email, sms
    sender: Optional[str] = None
    subject: Optional[str] = None
    raw_headers: Optional[str] = None

class FileUploadRequest(BaseModel):
    content_type: str = "email"
    sender: Optional[str] = None
    subject: Optional[str] = None

class URLArtifactOut(BaseModel):
    id: UUID
    url: str
    domain: str
    is_malicious: bool
    reputation_score: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True

class RiskSignalOut(BaseModel):
    id: UUID
    signal_type: str
    severity: str
    description: str
    extra_data: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True

class DetectionResultOut(BaseModel):
    id: UUID
    request_id: UUID
    label: DetectionStatus
    confidence: float
    risk_score: int
    model_version_id: Optional[UUID]
    explanations: List[str]
    extracted_urls: List[str]
    suspicious_keywords: List[str]
    urgency_markers: List[str]
    social_engineering_cues: List[str]
    recommended_actions: List[str]
    created_at: datetime
    reviewed: bool
    analyst_id: Optional[UUID]
    
    class Config:
        from_attributes = True

class DetectionDetailOut(DetectionResultOut):
    request: 'DetectionRequestOut'
    url_artifacts: List[URLArtifactOut]
    risk_signals: List[RiskSignalOut]
    
    class Config:
        from_attributes = True

class DetectionRequestOut(BaseModel):
    id: UUID
    content: str
    content_type: str
    sender: Optional[str]
    subject: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

DetectionDetailOut.model_rebuild()

class DetectionListItem(BaseModel):
    id: UUID
    label: DetectionStatus
    confidence: float
    risk_score: int
    sender: Optional[str]
    subject: Optional[str]
    created_at: datetime
    reviewed: bool
    
    class Config:
        from_attributes = True

class AnalyzeResponse(BaseModel):
    result: DetectionResultOut
    request_id: UUID

class CaseCreate(BaseModel):
    detection_result_id: UUID
    priority: CasePriority = CasePriority.medium
    title: Optional[str] = None
    description: Optional[str] = None

class CaseOut(BaseModel):
    id: UUID
    detection_result_id: UUID
    status: CaseStatus
    priority: CasePriority
    assignee_id: Optional[UUID]
    title: str
    description: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    detection: DetectionListItem
    assignee: Optional[UserBriefOut] = None
    
    class Config:
        from_attributes = True

class CaseUpdate(BaseModel):
    status: Optional[CaseStatus] = None
    priority: Optional[CasePriority] = None
    assignee_id: Optional[UUID] = None
    notes: Optional[str] = None

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)

class CommentOut(BaseModel):
    id: UUID
    case_id: UUID
    user_id: UUID
    content: str
    created_at: datetime
    user: UserBriefOut
    
    class Config:
        from_attributes = True

class UserBriefOut(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: str
    avatar_url: Optional[str]
    role: str
    
    class Config:
        from_attributes = True

class CaseFilter(BaseModel):
    status: Optional[CaseStatus] = None
    priority: Optional[CasePriority] = None
    assignee_id: Optional[UUID] = None
    search: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    page: int = 1
    page_size: int = 20
