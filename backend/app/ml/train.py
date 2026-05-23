import os
import re
import pickle
import json
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Optional
import structlog

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import nltk

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

# Ensure NLTK data
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)

def clean_text(text: str) -> str:
    if not isinstance(text, str):
        text = str(text)
    text = text.lower()
    text = re.sub(r'http[s]?://\S+', ' URL ', text)
    text = re.sub(r'www\.\S+', ' URL ', text)
    text = re.sub(r'\S+@\S+', ' EMAIL ', text)
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def normalize_label(label) -> str:
    if isinstance(label, (int, float)):
        return "phishing" if int(label) == 1 else "safe"
    label = str(label).lower().strip()
    if label in {"1", "phishing", "phish", "malicious", "spam", "fraud", "scam"}:
        return "phishing"
    if label in {"0", "safe", "legitimate", "ham", "benign", "ok"}:
        return "safe"
    return "suspicious"

def inspect_dataset(path: str) -> Dict:
    """Inspect real dataset structure from Kaggle download."""
    logger.info("inspecting_dataset", path=path)
    files = []
    for root, dirs, filenames in os.walk(path):
        for f in filenames:
            if f.endswith(('.csv', '.txt', '.json', '.xlsx')):
                files.append(os.path.join(root, f))
    
    schemas = {}
    for f in files[:5]:
        try:
            if f.endswith('.csv'):
                df = pd.read_csv(f, nrows=5)
                schemas[os.path.basename(f)] = {
                    "columns": list(df.columns),
                    "dtypes": {c: str(df[c].dtype) for c in df.columns},
                    "shape": list(df.shape)
                }
        except Exception as e:
            logger.warning("file_inspect_failed", file=f, error=str(e))
    
    return {"files": files, "schemas": schemas}

def preprocess_dataset(path: str, text_col: str = "text", label_col: str = "label") -> pd.DataFrame:
    """Load and preprocess the phishing dataset."""
    logger.info("preprocessing_dataset", path=path)
    
    # Try common CSV files
    candidates = []
    for root, dirs, filenames in os.walk(path):
        for f in filenames:
            if f.endswith('.csv'):
                candidates.append(os.path.join(root, f))
    
    df = None
    for c in candidates:
        try:
            temp = pd.read_csv(c)
            if text_col in temp.columns or 'email' in temp.columns or 'body' in temp.columns or 'message' in temp.columns:
                df = temp
                logger.info("loaded_csv", file=c, shape=df.shape)
                break
            if len(temp.columns) >= 2:
                # Try to infer columns
                df = temp
                logger.info("loaded_csv_inferred", file=c, shape=df.shape, columns=list(df.columns))
                break
        except Exception as e:
            logger.warning("csv_load_failed", file=c, error=str(e))
    
    if df is None:
        # Fallback: create synthetic but realistic data for demo
        logger.warning("no_dataset_found_using_synthetic")
        df = generate_synthetic_dataset(5000)
    
    # Normalize columns
    text_candidates = [c for c in df.columns if any(k in c.lower() for k in ['text', 'email', 'body', 'message', 'content', 'subject'])]
    label_candidates = [c for c in df.columns if any(k in c.lower() for k in ['label', 'class', 'target', 'type', 'category'])]
    
    text_col_actual = text_candidates[0] if text_candidates else df.columns[0]
    label_col_actual = label_candidates[0] if label_candidates else df.columns[-1]
    
    df = df[[text_col_actual, label_col_actual]].copy()
    df.columns = ['text', 'label']
    df['text'] = df['text'].fillna('').astype(str).apply(clean_text)
    df['label'] = df['label'].apply(normalize_label)
    df = df[df['text'].str.len() > 5].reset_index(drop=True)
    
    logger.info("preprocessing_complete", rows=len(df), classes=df['label'].value_counts().to_dict())
    return df

def generate_synthetic_dataset(n: int = 5000) -> pd.DataFrame:
    """Generate realistic synthetic phishing/safe email data for demo fallback."""
    phishing_templates = [
        "URGENT: Verify your account immediately. Click here to avoid suspension.",
        "Your payment failed. Update your credit card details now.",
        "Security alert: Unusual login attempt detected. Confirm your identity.",
        "You won a prize! Claim now by entering your bank details.",
        "Invoice attached. Please review and pay immediately to avoid late fees.",
        "Your password expires today. Reset now using this secure link.",
        "Amazon order confirmation #{rand}. Click to track your package.",
        "Netflix: Payment issue. Update billing info within 24 hours.",
        "Action required: Your email storage is full. Verify account now.",
        "DocuSign: Please sign this document immediately.",
    ]
    safe_templates = [
        "Hey team, the quarterly review meeting is scheduled for next Tuesday.",
        "Please find the attached report for your review.",
        "Thanks for your order! Your package will arrive in 3-5 business days.",
        "Welcome to the newsletter. Here are this week's updates.",
        "Reminder: dentist appointment tomorrow at 10 AM.",
        "Your monthly statement is now available in your account.",
        "Join us for the all-hands meeting this Friday at 2 PM.",
        "Project update: Phase 2 is complete and on schedule.",
        "Happy birthday! Wishing you a great day ahead.",
        "Meeting notes from today's standup are attached.",
    ]
    
    import random
    data = []
    for _ in range(n):
        if random.random() < 0.4:
            text = random.choice(phishing_templates).replace("{rand}", str(random.randint(1000, 9999)))
            # Add randomness
            text += " " + " ".join(["urgent", "verify", "click", "link", "account", "suspend", "login"][:random.randint(2, 6)])
            label = "phishing"
        else:
            text = random.choice(safe_templates).replace("{rand}", str(random.randint(1000, 9999)))
            label = "safe"
        data.append({"text": text, "label": label})
    return pd.DataFrame(data)

def train_model_job(job_id: str):
    """Training job entry point (would be run by RQ worker in production)."""
    logger.info("training_job_started", job_id=job_id)
    
    try:
        # In production, download from Kaggle
        dataset_path = settings.DATASET_PATH
        if not os.path.exists(dataset_path):
            os.makedirs(dataset_path, exist_ok=True)
        
        # Try real dataset, fallback to synthetic
        try:
            import kagglehub
            path = kagglehub.dataset_download("naserabdullahalam/phishing-email-dataset")
            logger.info("dataset_downloaded", path=path)
            dataset_path = path
        except Exception as e:
            logger.warning("kaggle_download_failed", error=str(e))
        
        df = preprocess_dataset(dataset_path)
        
        X = df['text'].values
        y = df['label'].values
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        X_train, X_val, y_train, y_val = train_test_split(X_train, y_train, test_size=0.125, random_state=42, stratify=y_train)
        
        vectorizer = TfidfVectorizer(max_features=15000, ngram_range=(1, 2), stop_words='english', min_df=2)
        X_train_tfidf = vectorizer.fit_transform(X_train)
        X_val_tfidf = vectorizer.transform(X_val)
        X_test_tfidf = vectorizer.transform(X_test)
        
        clf = LogisticRegression(max_iter=1000, class_weight='balanced', C=1.0, solver='lbfgs')
        clf.fit(X_train_tfidf, y_train)
        
        y_pred = clf.predict(X_test_tfidf)
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        rec = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        version_str = datetime.now(timezone.utc).strftime("v%Y%m%d-%H%M%S")
        artifact_dir = os.path.join(settings.MODEL_PATH, version_str)
        os.makedirs(artifact_dir, exist_ok=True)
        
        model_path = os.path.join(artifact_dir, "model.pkl")
        vectorizer_path = os.path.join(artifact_dir, "vectorizer.pkl")
        meta_path = os.path.join(artifact_dir, "meta.json")
        
        with open(model_path, 'wb') as f:
            pickle.dump(clf, f)
        with open(vectorizer_path, 'wb') as f:
            pickle.dump(vectorizer, f)
        
        meta = {
            "version": version_str,
            "algorithm": "tfidf_logistic",
            "train_rows": len(X_train),
            "val_rows": len(X_val),
            "test_rows": len(X_test),
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "confusion_matrix": cm,
            "classes": list(clf.classes_),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        with open(meta_path, 'w') as f:
            json.dump(meta, f, indent=2)
        
        logger.info("training_job_complete", job_id=job_id, version=version_str, accuracy=acc)
        
        # In real deployment, update DB via SQLAlchemy session
        # For demo, return metadata
        return meta
    except Exception as e:
        logger.error("training_job_failed", job_id=job_id, error=str(e))
        raise
