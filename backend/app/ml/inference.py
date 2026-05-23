import os
import re
import pickle
import json
from urllib.parse import urlparse
from typing import Dict, List, Tuple
import structlog
from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

class PhishingInference:
    def __init__(self, model_dir: str):
        self.model_dir = model_dir
        self.model = None
        self.vectorizer = None
        self.classes = ["safe", "phishing", "suspicious"]
        self._load_model()
    
    def _load_model(self):
        # Find latest model version
        if not os.path.exists(self.model_dir):
            os.makedirs(self.model_dir, exist_ok=True)
        
        versions = [d for d in os.listdir(self.model_dir) if os.path.isdir(os.path.join(self.model_dir, d))]
        if not versions:
            logger.warning("no_model_found_using_fallback")
            self._build_fallback()
            return
        
        latest = sorted(versions, reverse=True)[0]
        vdir = os.path.join(self.model_dir, latest)
        
        try:
            with open(os.path.join(vdir, "model.pkl"), 'rb') as f:
                self.model = pickle.load(f)
            with open(os.path.join(vdir, "vectorizer.pkl"), 'rb') as f:
                self.vectorizer = pickle.load(f)
            with open(os.path.join(vdir, "meta.json"), 'r') as f:
                meta = json.load(f)
                self.classes = meta.get("classes", ["safe", "phishing"])
            logger.info("model_loaded", version=latest)
        except Exception as e:
            logger.error("model_load_failed", error=str(e))
            self._build_fallback()
    
    def _build_fallback(self):
        """Simple heuristic fallback when no trained model exists."""
        self.model = None
        self.vectorizer = None
    
    def predict(self, text: str, sender: str = "") -> Dict:
        urls = self._extract_urls(text)
        keywords = self._extract_keywords(text)
        urgency = self._extract_urgency(text)
        social_eng = self._extract_social_engineering(text)
        
        if self.model and self.vectorizer:
            from app.ml.train import clean_text
            cleaned = clean_text(text)
            X = self.vectorizer.transform([cleaned])
            probs = self.model.predict_proba(X)[0]
            classes = self.model.classes_
            pred_idx = probs.argmax()
            label = classes[pred_idx]
            confidence = float(probs[pred_idx])
            
            # Map label to our enum
            label_str = "safe"
            if label in ["phishing", "1", "spam", "fraud"]:
                label_str = "phishing"
            elif label in ["suspicious", "unknown"]:
                label_str = "suspicious"
            else:
                label_str = "safe"
            
            # Adjust confidence for secondary classes
            if label_str == "safe" and confidence < 0.85:
                if len(probs) > 1 and sorted(probs, reverse=True)[1] > 0.2:
                    label_str = "suspicious"
        else:
            # Fallback heuristic scoring
            score = 0
            if len(urls) > 0: score += 15
            if len(urgency) > 0: score += 20
            if len(social_eng) > 0: score += 20
            if len(keywords) > 3: score += 15
            if "urgent" in text.lower() or "verify" in text.lower(): score += 15
            if "password" in text.lower() or "credit card" in text.lower(): score += 15
            
            confidence = min(score / 100.0 + 0.3, 0.95)
            if score > 60:
                label_str = "phishing"
            elif score > 35:
                label_str = "suspicious"
            else:
                label_str = "safe"
        
        # Composite risk score
        risk_score = int(confidence * 100)
        if len(urls) > 0 and any(self._is_obfuscated(u) for u in urls):
            risk_score = min(risk_score + 15, 100)
        if len(urgency) > 0:
            risk_score = min(risk_score + 10, 100)
        if sender and self._domain_mismatch(text, sender):
            risk_score = min(risk_score + 10, 100)
        
        explanations = self._generate_explanations(text, label_str, confidence, urls, urgency, social_eng, sender)
        url_details = self._analyze_urls(urls)
        actions = self._recommend_actions(label_str, risk_score)
        risk_signals = self._build_risk_signals(label_str, confidence, urls, urgency, social_eng, sender)
        
        return {
            "label": label_str,
            "confidence": round(confidence, 3),
            "risk_score": risk_score,
            "explanations": explanations,
            "urls": urls,
            "keywords": keywords[:10],
            "urgency": urgency,
            "social_eng": social_eng,
            "actions": actions,
            "url_details": url_details,
            "risk_signals": risk_signals
        }
    
    def _extract_urls(self, text: str) -> List[str]:
        pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        urls = re.findall(pattern, text)
        # Also find www. domains
        pattern2 = r'www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        urls2 = re.findall(pattern2, text)
        return list(set(urls + urls2))
    
    def _is_obfuscated(self, url: str) -> bool:
        return any(x in url for x in ['bit.ly', 'tinyurl', 'short.link', 'redirect', '%', '@', '0x'])
    
    def _domain_mismatch(self, text: str, sender: str) -> bool:
        sender_domain = sender.split('@')[-1] if '@' in sender else sender
        urls = self._extract_urls(text)
        for url in urls:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            if domain and sender_domain and sender_domain.lower() not in domain and domain not in sender_domain.lower():
                return True
        return False
    
    def _extract_keywords(self, text: str) -> List[str]:
        phishing_terms = [
            "urgent", "verify", "account", "suspended", "password", "click here",
            "login", "bank", "credit card", "update", "confirm", "security alert",
            "unusual activity", "limited", "expires", "won", "prize", "invoice",
            "payment failed", "billing", "doc", "document", "sign in", "otp",
            "one-time password", "authentication", "credentials", "ssn", "tax"
        ]
        text_lower = text.lower()
        found = [t for t in phishing_terms if t in text_lower]
        return found
    
    def _extract_urgency(self, text: str) -> List[str]:
        urgency_phrases = [
            "immediately", "urgent", "asap", "right now", "within 24 hours",
            "expires today", "last chance", "act now", "limited time",
            "account will be suspended", "verify within", "deadline"
        ]
        text_lower = text.lower()
        found = [p for p in urgency_phrases if p in text_lower]
        return found
    
    def _extract_social_engineering(self, text: str) -> List[str]:
        cues = [
            "dear customer", "dear user", "valued member", "we noticed",
            "unusual sign-in", "attempted login", "confirm your identity",
            "your account", "security team", "it department", "help desk"
        ]
        text_lower = text.lower()
        found = [c for c in cues if c in text_lower]
        return found
    
    def _generate_explanations(self, text: str, label: str, confidence: float, urls: List[str], urgency: List[str], social_eng: List[str], sender: str) -> List[str]:
        explanations = []
        if label == "phishing":
            explanations.append("High-confidence phishing classification from model and heuristics.")
        elif label == "suspicious":
            explanations.append("Message contains mixed signals requiring analyst review.")
        else:
            explanations.append("Low risk indicators detected. Message appears legitimate.")
        
        if urls:
            if any(self._is_obfuscated(u) for u in urls):
                explanations.append("Malicious or obfuscated URL present in message body.")
            else:
                explanations.append(f"{len(urls)} URL(s) detected and analyzed for reputation.")
        
        if sender and self._domain_mismatch(text, sender):
            explanations.append("Suspicious sender domain mismatch detected between sender and embedded links.")
        
        if urgency:
            explanations.append("Urgent credential request or time-pressure language detected.")
        
        if social_eng:
            explanations.append("Social engineering tone and impersonation language found.")
        
        if "payment" in text.lower() or "otp" in text.lower() or "credit card" in text.lower():
            explanations.append("Payment/OTP lure pattern identified in message content.")
        
        if confidence > 0.9 and label == "phishing":
            explanations.append("Model confidence is very high — automated action recommended.")
        
        return explanations
    
    def _analyze_urls(self, urls: List[str]) -> List[Dict]:
        out = []
        for url in urls:
            parsed = urlparse(url if url.startswith('http') else 'http://' + url)
            domain = parsed.netloc.lower()
            is_mal = any(x in domain for x in ['phish', 'fake', 'scam', 'malware', 'bit.ly', 'tinyurl'])
            rep = 0.2 if is_mal else 0.7
            out.append({"url": url, "domain": domain, "is_malicious": is_mal, "reputation_score": rep})
        return out
    
    def _recommend_actions(self, label: str, risk_score: int) -> List[str]:
        actions = []
        if label == "phishing" or risk_score > 80:
            actions.extend(["Block sender domain", "Quarantine message", "Alert SOC team", "Update threat intel feeds"])
        elif label == "suspicious" or risk_score > 50:
            actions.extend(["Send to analyst queue", "Scan attachments", "Check URL reputation", "Notify recipient"])
        else:
            actions.extend(["Allow delivery", "Log for analytics", "Periodic re-scan"])
        return actions
    
    def _build_risk_signals(self, label: str, confidence: float, urls: List[str], urgency: List[str], social_eng: List[str], sender: str) -> List[Dict]:
        signals = []
        if confidence > 0.85:
            signals.append({"type": "model_confidence", "severity": "high", "description": f"Model confidence is {confidence:.0%}"})
        if urls:
            signals.append({"type": "url_present", "severity": "medium", "description": f"{len(urls)} URL(s) embedded in content"})
        if urgency:
            signals.append({"type": "urgency_language", "severity": "high", "description": "Urgency and time-pressure language detected"})
        if social_eng:
            signals.append({"type": "social_engineering", "severity": "medium", "description": "Social engineering and impersonation patterns found"})
        if sender and self._domain_mismatch("", sender):
            signals.append({"type": "sender_anomaly", "severity": "high", "description": "Sender domain shows reputation anomalies"})
        return signals
