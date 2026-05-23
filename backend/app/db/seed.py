import os
import sys
import uuid
from datetime import datetime, timezone, timedelta
import random

from app.db.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.db.models import (
    User, RoleEnum, UserSettings, ThemePreference,
    ModelVersion, TrainingJob, JobStatus,
    DetectionRequest, DetectionResult, DetectionStatus,
    URLArtifact, RiskSignal, AnalystCase, CaseStatus, CasePriority,
    Alert, AlertType, Notification, AuditLog,
    ChatSession, ChatMessage
)

# Seeded credentials
SEED_USERS = [
    {
        "email": "zakaryaoukil2003@gmail.com",
        "password": "Zakarya@2026Secure",
        "first_name": "Zakarya",
        "last_name": "Oukil",
        "role": RoleEnum.super_admin,
        "avatar": "https://i.pravatar.cc/150?u=zakarya"
    },
    {
        "email": "analyst@sentinel-shield.io",
        "password": "Analyst@2026",
        "first_name": "Sarah",
        "last_name": "Chen",
        "role": RoleEnum.analyst,
        "avatar": "https://i.pravatar.cc/150?u=sarah"
    },
    {
        "email": "manager@sentinel-shield.io",
        "password": "Manager@2026",
        "first_name": "Marcus",
        "last_name": "Thompson",
        "role": RoleEnum.soc_manager,
        "avatar": "https://i.pravatar.cc/150?u=marcus"
    },
    {
        "email": "viewer@sentinel-shield.io",
        "password": "Viewer@2026",
        "first_name": "Emily",
        "last_name": "Rodriguez",
        "role": RoleEnum.viewer,
        "avatar": "https://i.pravatar.cc/150?u=emily"
    }
]

PHISHING_SAMPLES = [
    ("URGENT: Your account has been compromised. Click here to verify your identity immediately.", "phishing", "security@amaz0n-security.com", "Account Verification Required"),
    ("Congratulations! You've won $5,000. Claim your prize by entering your bank details at this secure portal.", "phishing", "prizes@winning-lottery.net", "Prize Claim Notification"),
    ("Your Netflix subscription payment failed. Update your billing information within 24 hours to avoid suspension.", "phishing", "billing@netflix-supports.com", "Payment Failed"),
    ("DocuSign: Action required - Please review and sign the attached document immediately.", "phishing", "docusign@secure-docsign.net", "Document Signing Required"),
    ("Microsoft 365: Unusual sign-in activity detected from Russia. Confirm this was you or reset your password now.", "phishing", "security@microsoft-365-alert.com", "Unusual Sign-in Activity"),
    ("Invoice #4829 overdue. Please review attached PDF and remit payment to avoid late fees.", "phishing", "billing@supplier-invoices.org", "Overdue Invoice"),
    ("Your password expires today. Update now via this secure link to maintain access.", "phishing", "it-helpdesk@company-internal.net", "Password Expiration Notice"),
    ("IRS Alert: Your tax return has an error. Click here to resolve immediately to avoid penalties.", "phishing", "no-reply@irs-gov-alert.com", "Tax Return Error"),
    ("Apple ID locked due to suspicious activity. Verify your account now.", "phishing", "support@app1e-id-secure.com", "Apple ID Locked"),
    ("Bank of America: Transfer confirmation needed. Approve pending wire transfer of $12,400.", "phishing", "alerts@bofa-secure-alerts.net", "Wire Transfer Approval Needed"),
]

SAFE_SAMPLES = [
    ("Hey team, the Q3 review meeting is scheduled for next Tuesday at 10 AM in Conference Room B.", "safe", "marcus.thompson@company.com", "Q3 Review Meeting"),
    ("Please find the attached monthly analytics report for your review. Let me know if you have questions.", "safe", "sarah.chen@company.com", "Monthly Analytics Report"),
    ("Welcome to the Sentinel-Shield product newsletter. Here are this week's threat intelligence updates.", "safe", "newsletter@sentinel-shield.io", "Weekly Threat Intelligence Digest"),
    ("Your Amazon order #112-3948573-1029384 has been shipped and will arrive on Friday.", "safe", "order-update@amazon.com", "Order Shipped"),
    ("Reminder: Dentist appointment tomorrow at 2:00 PM with Dr. Patel.", "safe", "appointments@smile-dental.com", "Appointment Reminder"),
    ("Project Phoenix update: Phase 2 development is complete and on schedule for release next sprint.", "safe", "pmo@company.com", "Project Phoenix Update"),
    ("Join us for the all-hands meeting this Friday. We'll discuss Q4 goals and team updates.", "safe", "hr@company.com", "All-Hands Meeting Invitation"),
    ("Your monthly credit card statement is now available. Please review your account for any unauthorized charges.", "safe", "statements@chase.com", "Monthly Statement Available"),
    ("Thank you for your recent purchase. Here's your receipt and tracking information.", "safe", "receipts@stripe.com", "Purchase Receipt"),
    ("The security patch for CVE-2024-1234 has been applied to all production servers successfully.", "safe", "devops@company.com", "Security Patch Applied"),
]

SUSPICIOUS_SAMPLES = [
    ("We noticed you recently viewed our product. Here's a special 50% discount just for you. Limited time only!", "suspicious", "marketing@deals-everyday.net", "Special Discount Offer"),
    ("Your package delivery failed. Reschedule delivery by clicking the tracking link below.", "suspicious", "shipping@track-my-package.org", "Delivery Failed Notice"),
    ("Verification needed: Your email storage is at 95%. Upgrade now for free.", "suspicious", "support@email-upgrade-service.com", "Storage Full Warning"),
]

def seed_all():
    db = SessionLocal()
    
    # Clear existing data (careful order)
    for table in [ChatMessage, ChatSession, AuditLog, Notification, Alert, ReviewComment, AnalystCase,
                  RiskSignal, URLArtifact, DetectionResult, DetectionRequest, TrainingJob, ModelVersion,
                  UserSettings, User]:
        db.query(table).delete(synchronize_session=False)
    db.commit()
    
    print("Seeding users...")
    users = []
    for u_data in SEED_USERS:
        user = User(
            id=uuid.uuid4(),
            email=u_data["email"],
            hashed_password=get_password_hash(u_data["password"]),
            first_name=u_data["first_name"],
            last_name=u_data["last_name"],
            role=u_data["role"],
            avatar_url=u_data["avatar"],
            is_active=True,
            created_at=datetime.now(timezone.utc) - timedelta(days=30),
            last_login=datetime.now(timezone.utc) - timedelta(hours=2)
        )
        db.add(user)
        users.append(user)
        
        # Settings
        settings = UserSettings(
            id=uuid.uuid4(),
            user_id=user.id,
            theme=ThemePreference.dark,
            email_notifications=True,
            push_notifications=True,
            alert_threshold="medium"
        )
        db.add(settings)
    db.commit()
    
    user_map = {u.role.value: u for u in users}
    
    print("Seeding model versions...")
    mv1 = ModelVersion(
        id=uuid.uuid4(),
        version="v2025.04.15-001",
        is_active=False,
        algorithm="tfidf_logistic",
        accuracy=0.961,
        precision=0.958,
        recall=0.953,
        f1_score=0.955,
        confusion_matrix=[[420, 18], [22, 390]],
        artifact_path="/ml_artifacts/v2025.04.15-001",
        created_at=datetime.now(timezone.utc) - timedelta(days=30)
    )
    mv2 = ModelVersion(
        id=uuid.uuid4(),
        version="v2025.05.01-002",
        is_active=False,
        algorithm="tfidf_logistic",
        accuracy=0.972,
        precision=0.968,
        recall=0.964,
        f1_score=0.966,
        confusion_matrix=[[850, 12], [15, 823]],
        artifact_path="/ml_artifacts/v2025.05.01-002",
        created_at=datetime.now(timezone.utc) - timedelta(days=14)
    )
    mv3 = ModelVersion(
        id=uuid.uuid4(),
        version="v2025.05.20-003",
        is_active=True,
        algorithm="tfidf_logistic",
        accuracy=0.973,
        precision=0.971,
        recall=0.967,
        f1_score=0.969,
        confusion_matrix=[[1240, 18], [14, 1228]],
        artifact_path="/ml_artifacts/v2025.05.20-003",
        deployed_at=datetime.now(timezone.utc) - timedelta(days=2),
        created_at=datetime.now(timezone.utc) - timedelta(days=3)
    )
    db.add_all([mv1, mv2, mv3])
    db.commit()
    
    print("Seeding training jobs...")
    tj1 = TrainingJob(
        id=uuid.uuid4(),
        status=JobStatus.completed,
        algorithm="tfidf_logistic",
        dataset_rows=5000,
        train_rows=3500,
        val_rows=750,
        test_rows=750,
        log_output="Epoch 1 complete. Accuracy: 0.94\nEpoch 2 complete. Accuracy: 0.96\nFinal: 0.973",
        started_at=datetime.now(timezone.utc) - timedelta(days=30, hours=2),
        completed_at=datetime.now(timezone.utc) - timedelta(days=30),
        created_at=datetime.now(timezone.utc) - timedelta(days=30, hours=3)
    )
    tj2 = TrainingJob(
        id=uuid.uuid4(),
        status=JobStatus.completed,
        algorithm="tfidf_logistic",
        dataset_rows=12000,
        train_rows=8400,
        val_rows=1800,
        test_rows=1800,
        log_output="Training on 12000 rows...\nValidation F1: 0.968\nTest F1: 0.969",
        started_at=datetime.now(timezone.utc) - timedelta(days=3, hours=2),
        completed_at=datetime.now(timezone.utc) - timedelta(days=3),
        created_at=datetime.now(timezone.utc) - timedelta(days=3, hours=3)
    )
    db.add_all([tj1, tj2])
    db.commit()
    
    print("Seeding detections...")
    all_samples = PHISHING_SAMPLES * 3 + SAFE_SAMPLES * 3 + SUSPICIOUS_SAMPLES * 3
    detections = []
    for i in range(50):
        text, label, sender, subject = random.choice(all_samples)
        req = DetectionRequest(
            id=uuid.uuid4(),
            content=text,
            content_type="email",
            sender=sender,
            subject=subject,
            user_id=user_map["analyst"].id,
            created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 14), hours=random.randint(0, 23))
        )
        db.add(req)
        db.flush()
        
        confidence = random.uniform(0.72, 0.99)
        risk_score = int(confidence * 100)
        if label == "safe":
            confidence = random.uniform(0.88, 0.99)
            risk_score = random.randint(5, 30)
        
        result = DetectionResult(
            id=uuid.uuid4(),
            request_id=req.id,
            label=label,
            confidence=round(confidence, 3),
            risk_score=risk_score,
            model_version_id=mv3.id,
            explanations=["Sample explanation for demo"],
            extracted_urls=["http://example.com"] if "http" in text else [],
            suspicious_keywords=["urgent"] if "urgent" in text.lower() else [],
            urgency_markers=["immediately"] if "immediately" in text.lower() else [],
            social_engineering_cues=[],
            recommended_actions=["Review manually"] if label != "safe" else ["Allow"],
            created_at=req.created_at,
            reviewed=random.choice([True, False]),
            analyst_id=user_map["analyst"].id if random.random() > 0.5 else None
        )
        db.add(result)
        detections.append((req, result))
    db.commit()
    
    print("Seeding cases...")
    for i in range(20):
        req, result = random.choice(detections)
        if result.label == "safe":
            continue
        case = AnalystCase(
            id=uuid.uuid4(),
            detection_result_id=result.id,
            status=random.choice([CaseStatus.open, CaseStatus.in_progress, CaseStatus.resolved, CaseStatus.escalated]),
            priority=random.choice([CasePriority.low, CasePriority.medium, CasePriority.high, CasePriority.critical]),
            assignee_id=user_map["analyst"].id if random.random() > 0.3 else None,
            title=req.subject or "Untitled Detection",
            description="Case created from automated detection result.",
            notes=random.choice([None, "Reviewing sender reputation...", "Confirmed phishing, escalated.", "False positive, safe."]),
            created_at=result.created_at,
            updated_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 48)),
            resolved_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 24)) if random.random() > 0.7 else None
        )
        db.add(case)
    db.commit()
    
    print("Seeding alerts...")
    alerts = [
        (AlertType.risk_alert, "High-risk phishing wave detected", "15 high-confidence phishing emails targeting finance team in last hour.", "critical"),
        (AlertType.assignment, "New case assigned", "Case #4821 assigned to you for review.", "medium"),
        (AlertType.deployment, "Model v2025.05.20-003 deployed", "New model version is now active with 97.3% accuracy.", "low"),
        (AlertType.system, "System maintenance scheduled", "Planned maintenance window: Sunday 2 AM UTC.", "low"),
        (AlertType.retraining, "Retraining completed", "Weekly model retraining finished successfully.", "low"),
    ]
    for atype, title, desc, sev in alerts:
        for user in users:
            alert = Alert(
                id=uuid.uuid4(),
                alert_type=atype,
                title=title,
                description=desc,
                severity=sev,
                read=random.choice([True, False]),
                user_id=user.id,
                created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 48))
            )
            db.add(alert)
    db.commit()
    
    print("Seeding notifications...")
    for user in users:
        for i in range(3):
            n = Notification(
                id=uuid.uuid4(),
                user_id=user.id,
                title=random.choice(["New detection", "Case updated", "Model event", "Assignment"]),
                message="Sample notification message for demo purposes.",
                read=random.choice([True, False]),
                created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 72))
            )
            db.add(n)
    db.commit()
    
    print("Seeding audit logs...")
    actions = ["login", "analyze", "create_case", "update_case", "deploy_model", "user_created"]
    for i in range(30):
        user = random.choice(users)
        audit = AuditLog(
            id=uuid.uuid4(),
            user_id=user.id,
            action=random.choice(actions),
            entity_type=random.choice(["detection", "case", "user", "model"]),
            entity_id=str(uuid.uuid4()),
            details={"ip": "10.0.0." + str(random.randint(1, 255))},
            created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 14))
        )
        db.add(audit)
    db.commit()
    
    print("Seeding chat sessions...")
    for user in users:
        sess = ChatSession(
            id=uuid.uuid4(),
            user_id=user.id,
            title="Threat Analysis Discussion",
            created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(1, 7))
        )
        db.add(sess)
        db.flush()
        
        messages = [
            ("user", "Can you explain the latest phishing detection?"),
            ("assistant", "The latest detection shows credential harvesting language, a mismatched sender domain, and urgency markers. I recommend escalating it to the analyst queue."),
            ("user", "What about the model accuracy?"),
            ("assistant", "Our active model v2025.05.20-003 maintains 97.3% accuracy with a 0.969 F1 score. Performance has been stable for the past 72 hours."),
        ]
        for role, content in messages:
            msg = ChatMessage(
                id=uuid.uuid4(),
                session_id=sess.id,
                role=role,
                content=content,
                created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 24))
            )
            db.add(msg)
    db.commit()
    
    db.close()
    print("Seeding complete!")

if __name__ == "__main__":
    seed_all()
