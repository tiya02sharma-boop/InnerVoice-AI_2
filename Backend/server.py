import re
import os
import io
import json
import random
import requests
from datetime import datetime, timedelta
from typing import List
from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class JournalEntry(BaseModel):
    text: str
    journal_dates: List[str] = Field(default_factory=list)

# Setup Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

# Setup Hugging Face
HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
HF_API_URL = "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english"

QUOTES = {
    "sad": [
        "You are allowed to move gently today. Small steps still count.",
        "Even heavy hearts can heal one breath at a time.",
        "This feeling is real, but it is not the whole story of you.",
        "You deserve softness, especially on difficult days.",
        "Rest is not giving up. It is part of recovery.",
        "Be patient with yourself. Healing is rarely linear.",
        "It is okay to pause and care for your own heart.",
        "You have made it through hard moments before, and that strength is still with you.",
        "Tender days need tender care.",
        "You do not need to have everything figured out to keep going."
    ],
    "anxious": [
        "You do not have to solve everything right now. Just come back to this breath.",
        "Calm can begin with one slow exhale.",
        "Your mind may be racing, but this moment can still be gentle.",
        "Safety can start with grounding in what is true right now.",
        "You can meet this moment without carrying the whole future.",
        "Let your shoulders drop. You are allowed to soften.",
        "A worried mind still deserves compassion.",
        "One steady breath can interrupt a spiral.",
        "You can slow down without falling behind.",
        "Peace often begins in the body before it reaches the mind."
    ],
    "happy": [
        "Notice what supported this lighter moment so you can return to it again.",
        "Joy grows when you let yourself fully feel it.",
        "You are building emotional strength with every healthy habit you keep.",
        "Celebrate the progress that brought you here.",
        "Moments of ease are worth honoring, not rushing past.",
        "Let this good moment become evidence that growth is happening.",
        "You are allowed to feel proud of your progress.",
        "Wellbeing deepens when you practice what already helps.",
        "Carry this energy gently into the rest of your day.",
        "Growth often looks like noticing that today feels a little lighter."
    ],
    "neutral": [
        "Steady days matter too. They are part of healing.",
        "A calm baseline is progress worth noticing.",
        "Ordinary moments can still be meaningful.",
        "Consistency is a quiet form of strength.",
        "Even a simple check-in is an act of self-care.",
        "You are building awareness one entry at a time.",
        "Small reflections can create lasting change.",
        "Showing up for yourself today is enough.",
        "Clarity often grows from regular pauses like this one.",
        "You do not need a dramatic day for your feelings to matter."
    ]
}


def clamp(value: int, minimum: int, maximum: int) -> int:
    return max(minimum, min(maximum, value))


def safe_int(value, default: int) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def pick_quote(emotion: str) -> str:
    return random.choice(QUOTES.get(emotion, QUOTES["neutral"]))


def parse_date(value: str):
    if not value:
        return None
    try:
        if "T" in value:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
        return datetime.fromisoformat(value).date()
    except ValueError:
        return None


def compute_streak(journal_dates: List[str]) -> int:
    all_dates = {parse_date(date_str) for date_str in journal_dates}
    today = datetime.now().date()
    all_dates.add(today)
    all_dates.discard(None)
    if not all_dates:
        return 1

    streak = 0
    cursor = today
    while cursor in all_dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak or 1


def build_support_content(emotion: str, stress_level: str, patterns: List[str], triggers: List[str]):
    emotion = emotion if emotion in {"sad", "anxious", "happy", "neutral"} else "neutral"

    if emotion == "sad":
        suggestion = "Try a CBT reframe: write down one painful thought, then answer it with one kinder and more balanced sentence."
        micro_action = "Step outside or sit by a window for 5 minutes and name 3 things you can see."
    elif emotion == "anxious":
        suggestion = "Pause the spiral by separating facts from fears. Write one thing you know is true and one worry that can wait until later."
        micro_action = "Do one 60-second breathing round: inhale for 4, hold for 4, exhale for 6."
    elif emotion == "happy":
        suggestion = "Capture what helped today feel lighter so you can intentionally repeat it when you need support."
        micro_action = "Write down one win from today and one habit that helped create it."
    else:
        suggestion = "Keep building awareness by noticing what lifted or drained your energy today without judging it."
        micro_action = "Take a short walk, stretch, or drink water before your next task."

    if stress_level == "high" and emotion != "happy":
        micro_action = "Pause for 2 minutes, unclench your jaw and shoulders, and take 5 slow breaths before doing anything else."

    if not patterns:
        patterns = ["Self-reflection is present, but no strong negative pattern was detected."]
    if not triggers:
        triggers = ["No clear trigger was identified from this entry."]

    return suggestion, micro_action, patterns[:4], triggers[:4]


def build_legacy_fields(emotion: str, mood_score: int, stress_level: str, patterns: List[str], triggers: List[str], summary: str):
    mood_score = clamp(mood_score, 0, 10)
    phq9_score = clamp(round((10 - mood_score) * 2.2), 0, 27)
    gad7_map = {"low": 5, "medium": 11, "high": 17}
    gad7_score = gad7_map.get(stress_level, 7)
    if emotion == "happy":
        phq9_score = clamp(phq9_score - 4, 0, 27)
        gad7_score = clamp(gad7_score - 4, 0, 21)
    elif emotion == "sad":
        phq9_score = clamp(phq9_score + 3, 0, 27)
    elif emotion == "anxious":
        gad7_score = clamp(gad7_score + 2, 0, 21)

    risk = "high" if stress_level == "high" and mood_score <= 3 else "medium" if stress_level in {"medium", "high"} else "low"
    legacy_keywords = list(dict.fromkeys((patterns or []) + (triggers or [])))[:6]

    return {
        "phq9_score": phq9_score,
        "gad7_score": gad7_score,
        "risk": risk,
        "keywords": legacy_keywords,
        "patient_message": summary,
        "action_step": build_support_content(emotion, stress_level, patterns, triggers)[1]
    }


def normalize_analysis_payload(payload: dict, journal_dates: List[str]):
    emotion = str(payload.get("emotion", "neutral")).lower().strip()
    if emotion not in {"sad", "anxious", "happy", "neutral"}:
        emotion = "neutral"

    summary = str(payload.get("summary", "You took a moment to reflect on your day, and that matters.")).strip()
    mood_score = clamp(safe_int(payload.get("mood_score", 5), 5), 0, 10)
    stress_level = str(payload.get("stress_level", "medium")).lower().strip()
    if stress_level not in {"low", "medium", "high"}:
        stress_level = "medium"

    key_patterns = payload.get("key_patterns") or []
    triggers = payload.get("triggers") or []
    if not isinstance(key_patterns, list):
        key_patterns = [str(key_patterns)]
    if not isinstance(triggers, list):
        triggers = [str(triggers)]
    key_patterns = [str(item).strip() for item in key_patterns if str(item).strip()]
    triggers = [str(item).strip() for item in triggers if str(item).strip()]

    suggestion, micro_action, key_patterns, triggers = build_support_content(
        emotion, stress_level, key_patterns, triggers
    )
    suggestion = str(payload.get("suggestion", suggestion)).strip() or suggestion
    micro_action = str(payload.get("micro_action", micro_action)).strip() or micro_action
    quote = str(payload.get("motivational_quote", pick_quote(emotion))).strip() or pick_quote(emotion)
    streak = compute_streak(journal_dates)

    normalized = {
        "emotion": emotion,
        "summary": summary,
        "mood_score": mood_score,
        "stress_level": stress_level,
        "key_patterns": key_patterns,
        "triggers": triggers,
        "suggestion": suggestion,
        "micro_action": micro_action,
        "motivational_quote": quote,
        "streak": streak
    }
    normalized.update(build_legacy_fields(emotion, mood_score, stress_level, key_patterns, triggers, summary))
    return normalized

def analyze_with_fallback(text: str, journal_dates: List[str]):
    text_lower = text.lower()
    pattern_keywords = {
        "Overthinking detected": ["overthinking", "what if", "spiral", "obsessing", "can't stop thinking"],
        "Work stress recurring": ["work", "deadline", "meeting", "boss", "office", "workload"],
        "Sleep disruption noticed": ["can't sleep", "insomnia", "woke up", "sleeping too much", "tired"],
        "Self-critical thinking present": ["my fault", "worthless", "burden", "not enough", "guilty"],
        "Emotional exhaustion building": ["drained", "exhausted", "burnt out", "fatigue", "no energy"]
    }
    trigger_keywords = {
        "Work pressure": ["work", "deadline", "boss", "office", "project", "workload"],
        "Lack of sleep": ["can't sleep", "insomnia", "tired", "exhausted", "wake up"],
        "Relationship strain": ["argument", "alone", "lonely", "partner", "family", "friend"],
        "Academic pressure": ["college", "exam", "study", "assignment", "class"],
        "Uncertainty about the future": ["future", "what if", "uncertain", "confused", "stuck"]
    }
    emotion_signals = {
        "sad": ["sad", "down", "unhappy", "crying", "hopeless", "empty", "lonely"],
        "anxious": ["anxious", "worried", "panic", "nervous", "stressed", "overthinking", "restless"],
        "happy": ["happy", "grateful", "joy", "calm", "peaceful", "excited", "hopeful"]
    }

    emotion_scores = {emotion: 0 for emotion in ["sad", "anxious", "happy"]}
    for emotion, words in emotion_signals.items():
        for word in words:
            if re.search(r"\b" + re.escape(word) + r"\b", text_lower):
                emotion_scores[emotion] += 1

    if max(emotion_scores.values()) == 0:
        emotion = "neutral"
    else:
        emotion = max(emotion_scores, key=emotion_scores.get)

    key_patterns = []
    for label, words in pattern_keywords.items():
        if any(re.search(r"\b" + re.escape(word) + r"\b", text_lower) for word in words):
            key_patterns.append(label)

    triggers = []
    for label, words in trigger_keywords.items():
        if any(re.search(r"\b" + re.escape(word) + r"\b", text_lower) for word in words):
            triggers.append(label)

    negative_intensity = len(key_patterns) + len(triggers)
    if emotion == "happy":
        mood_score = 8 if negative_intensity <= 1 else 7
        stress_level = "low" if negative_intensity == 0 else "medium"
    elif emotion == "anxious":
        mood_score = max(2, 6 - negative_intensity)
        stress_level = "high" if negative_intensity >= 3 else "medium"
    elif emotion == "sad":
        mood_score = max(1, 5 - negative_intensity)
        stress_level = "high" if negative_intensity >= 3 else "medium"
    else:
        mood_score = max(4, 7 - negative_intensity)
        stress_level = "medium" if negative_intensity >= 2 else "low"

    if emotion == "sad":
        summary = "You sound emotionally weighed down right now. There are hints of sadness and mental fatigue in this entry."
    elif emotion == "anxious":
        summary = "Your journal reflects mental overload and future-focused worry. Stress seems to be taking up a lot of space today."
    elif emotion == "happy":
        summary = "This entry carries a lighter emotional tone. You seem more connected to gratitude, progress, or relief right now."
    else:
        summary = "Your reflection feels steady overall. There are some signals worth noticing, but no single emotion dominates this entry."

    suggestion, micro_action, key_patterns, triggers = build_support_content(
        emotion, stress_level, key_patterns, triggers
    )
    return normalize_analysis_payload({
        "emotion": emotion,
        "summary": summary,
        "mood_score": mood_score,
        "stress_level": stress_level,
        "key_patterns": key_patterns,
        "triggers": triggers,
        "suggestion": suggestion,
        "micro_action": micro_action,
        "motivational_quote": pick_quote(emotion)
    }, journal_dates)

def analyze_with_ai(text: str, journal_dates: List[str]):
    # Try Hugging Face for sentiment first
    sentiment = "NEUTRAL"
    if HF_API_KEY:
        try:
            headers = {"Authorization": f"Bearer {HF_API_KEY}"}
            response = requests.post(HF_API_URL, headers=headers, json={"inputs": text}, timeout=3)
            if response.ok:
                results = response.json()
                # HF pipeline returns a list of lists: [[{'label': 'NEGATIVE', 'score': 0.99}]]
                if isinstance(results, list) and len(results) > 0 and isinstance(results[0], list):
                    sentiment = results[0][0].get('label', 'NEUTRAL')
        except Exception as e:
            print(f"HF API Error: {e}")

    # Now use Gemini for deep clinical extraction if available
    if model:
        prompt = f"""
        You are a compassionate mental wellness AI analyzing a patient's journal entry for a patient-facing insights dashboard.
        
        Journal Entry: "{text}"
        Hugging Face Sentiment Context: {sentiment}
        
        Analyze the text and infer:
        - dominant emotion
        - a short 2-line summary
        - mood score from 0 to 10
        - stress level as low, medium, or high
        - recurring emotions or negative thinking patterns
        - likely triggers
        - one CBT-style actionable suggestion
        - one very small micro action

        Return ONLY a raw JSON object matching this exact schema:
        {{
            "emotion": "<sad | anxious | happy | neutral>",
            "summary": "<short 2-line summary>",
            "mood_score": <integer 0-10>,
            "stress_level": "<low | medium | high>",
            "key_patterns": ["<pattern1>", "<pattern2>"],
            "triggers": ["<trigger1>", "<trigger2>"],
            "suggestion": "<CBT-style actionable suggestion>",
            "micro_action": "<one small immediate action>"
        }}
        
        Keep key_patterns and triggers short and specific.
        If there are no clear triggers or patterns, return empty arrays.
        Do not add markdown formatting, just return the raw JSON braces.
        """
        try:
            response = model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Clean up potential markdown formatting from Gemini
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
            if result_text.startswith("```"):
                result_text = result_text[3:]
                
            return normalize_analysis_payload(json.loads(result_text.strip()), journal_dates)
        except Exception as e:
            print(f"Gemini API Error: {e}")
            # Fall through to fallback
            
    # If no keys or API fails, use fallback
    return analyze_with_fallback(text, journal_dates)


@app.post("/analyze")
async def analyze(entry: JournalEntry):
    return analyze_with_ai(entry.text, entry.journal_dates)


@app.post("/scan-journal")
async def scan_journal(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    try:
        from PIL import Image, ImageOps
        import pytesseract
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="OCR dependencies are missing. Install pillow, pytesseract, and Tesseract OCR."
        )

    tesseract_cmd = os.getenv("TESSERACT_CMD")
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("L")
        image = ImageOps.autocontrast(image)
        text = pytesseract.image_to_string(image).strip()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not scan this image: {exc}")

    return {"text": text}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
