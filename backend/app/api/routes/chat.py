from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timezone

from app.api.deps import get_db, get_current_user
from app.db.models import ChatSession, ChatMessage, User

router = APIRouter()

@router.get("/sessions")
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.updated_at.desc()).all()

@router.post("/sessions")
def create_session(
    title: str = "New Chat",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sess = ChatSession(user_id=current_user.id, title=title)
    db.add(sess)
    db.commit()
    db.refresh(sess)
    return sess

@router.get("/sessions/{session_id}/messages")
def list_messages(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sess = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()

@router.post("/sessions/{session_id}/messages")
def send_message(
    session_id: UUID,
    content: str,
    context: dict = {},
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sess = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    
    user_msg = ChatMessage(session_id=session_id, role="user", content=content, context=context)
    db.add(user_msg)
    
    # Generate assistant response (rule-based for demo)
    assistant_content = generate_chat_response(content, context)
    assistant_msg = ChatMessage(session_id=session_id, role="assistant", content=assistant_content, context=context)
    db.add(assistant_msg)
    
    sess.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(assistant_msg)
    return assistant_msg

def generate_chat_response(content: str, context: dict) -> str:
    c = content.lower()
    if "phishing" in c:
        return "This detection shows several phishing indicators: credential harvesting language, mismatched sender domains, and urgency tactics. I recommend escalating to the analyst queue for deeper inspection."
    if "model" in c:
        return "Our current active model is a TF-IDF + Logistic Regression ensemble trained on 50K+ labeled emails. It achieves 97.3% accuracy with a 0.94 F1 score on the phishing class."
    if "case" in c:
        return "You have 7 open cases in the analyst queue. 2 are marked critical and involve payment/OTP lure patterns. Want me to summarize them?"
    if "url" in c or "link" in c:
        return "I can analyze URLs for domain reputation, path obfuscation, and known malicious patterns. Paste the raw message and I'll extract and evaluate every link."
    return "I'm your Sentinel AI analyst. I can explain detections, summarize cases, review model metrics, and guide you through threat triage. What would you like to dive into?"
