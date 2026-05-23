import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text, ForeignKey,
    Float, JSON, Enum, ARRAY, create_engine
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum

class RoleEnum(str, enum.Enum):
    super_admin = "super_admin"
    analyst = "analyst"
    soc_manager = "soc_manager"
    viewer = "viewer"

class DetectionStatus(str, enum.Enum):
    pending = "pending"
    phishing = "phishing"
    suspicious = "suspicious"
    spam = "spam"
    safe = "safe"
    false_positive = "false_positive"

class CasePriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class CaseStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"
    escalated = "escalated"

class AlertType(str, enum.Enum):
    risk_alert = "risk_alert"
    assignment = "assignment"
    retraining = "retraining"
    deployment = "deployment"
    system = "system"

class JobStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"

class ThemePreference(str, enum.Enum):
    dark = "dark"
    light = "light"
    system = "system"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.viewer)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    detections = relationship("DetectionResult", back_populates="analyst")
    cases = relationship("AnalystCase", back_populates="assignee")
    notifications = relationship("Notification", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")
    settings = relationship("UserSettings", back_populates="user", uselist=False)

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    revoked = Column(Boolean, default=False)

class UserSettings(Base):
    __tablename__ = "user_settings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    theme = Column(Enum(ThemePreference), default=ThemePreference.dark)
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    alert_threshold = Column(String(20), default="medium")  # low, medium, high

    user = relationship("User", back_populates="settings")

class DetectionRequest(Base):
    __tablename__ = "detection_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content = Column(Text, nullable=False)
    content_type = Column(String(20), default="email")  # email, sms, file
    sender = Column(String(255), nullable=True)
    subject = Column(String(500), nullable=True)
    raw_headers = Column(Text, nullable=True)
    file_name = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    result = relationship("DetectionResult", back_populates="request", uselist=False)

class DetectionResult(Base):
    __tablename__ = "detection_results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("detection_requests.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    label = Column(Enum(DetectionStatus), nullable=False)
    confidence = Column(Float, nullable=False)
    risk_score = Column(Integer, nullable=False)  # 0-100
    
    model_version_id = Column(UUID(as_uuid=True), ForeignKey("model_versions.id"), nullable=True)
    
    explanations = Column(JSON, default=list)  # list of explanation strings
    extracted_urls = Column(JSON, default=list)
    suspicious_keywords = Column(JSON, default=list)
    urgency_markers = Column(JSON, default=list)
    social_engineering_cues = Column(JSON, default=list)
    recommended_actions = Column(JSON, default=list)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    analyst_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed = Column(Boolean, default=False)
    
    request = relationship("DetectionRequest", back_populates="result")
    analyst = relationship("User", back_populates="detections")
    model_version = relationship("ModelVersion", back_populates="results")
    case = relationship("AnalystCase", back_populates="detection", uselist=False)

class URLArtifact(Base):
    __tablename__ = "url_artifacts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    detection_result_id = Column(UUID(as_uuid=True), ForeignKey("detection_results.id", ondelete="CASCADE"), nullable=False)
    url = Column(String(1000), nullable=False)
    domain = Column(String(255), nullable=False)
    is_malicious = Column(Boolean, default=False)
    reputation_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class RiskSignal(Base):
    __tablename__ = "risk_signals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    detection_result_id = Column(UUID(as_uuid=True), ForeignKey("detection_results.id", ondelete="CASCADE"), nullable=False)
    signal_type = Column(String(100), nullable=False)
    severity = Column(String(20), default="medium")  # low, medium, high, critical
    description = Column(Text, nullable=False)
    extra_data = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class AnalystCase(Base):
    __tablename__ = "analyst_cases"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    detection_result_id = Column(UUID(as_uuid=True), ForeignKey("detection_results.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    status = Column(Enum(CaseStatus), default=CaseStatus.open)
    priority = Column(Enum(CasePriority), default=CasePriority.medium)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    detection = relationship("DetectionResult", back_populates="case")
    assignee = relationship("User", back_populates="cases")
    comments = relationship("ReviewComment", back_populates="case", cascade="all, delete-orphan")

class ReviewComment(Base):
    __tablename__ = "review_comments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(UUID(as_uuid=True), ForeignKey("analyst_cases.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    case = relationship("AnalystCase", back_populates="comments")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_type = Column(Enum(AlertType), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="medium")
    read = Column(Boolean, default=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    extra_data = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="notifications")

class ModelVersion(Base):
    __tablename__ = "model_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version = Column(String(50), unique=True, nullable=False)
    is_active = Column(Boolean, default=False)
    algorithm = Column(String(100), default="tfidf_logistic")
    
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    confusion_matrix = Column(JSON, nullable=True)
    
    artifact_path = Column(String(500), nullable=True)
    feature_path = Column(String(500), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    deployed_at = Column(DateTime(timezone=True), nullable=True)
    training_job_id = Column(UUID(as_uuid=True), ForeignKey("training_jobs.id"), nullable=True)
    
    results = relationship("DetectionResult", back_populates="model_version")
    training_job = relationship("TrainingJob", back_populates="model_version", uselist=False)

class TrainingJob(Base):
    __tablename__ = "training_jobs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status = Column(Enum(JobStatus), default=JobStatus.queued)
    algorithm = Column(String(100), default="tfidf_logistic")
    dataset_rows = Column(Integer, nullable=True)
    train_rows = Column(Integer, nullable=True)
    val_rows = Column(Integer, nullable=True)
    test_rows = Column(Integer, nullable=True)
    
    log_output = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    model_version = relationship("ModelVersion", back_populates="training_job", uselist=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details = Column(JSON, default=dict)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    context = Column(JSON, default=dict)  # page context, detection id, etc.
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    session = relationship("ChatSession", back_populates="messages")
