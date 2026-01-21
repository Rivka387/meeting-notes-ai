import os
from typing import Tuple

import httpx
from fastapi import UploadFile


class TranscriptionError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def _detect_language(text: str) -> str:
    he_count = sum(1 for ch in text if "\u0590" <= ch <= "\u05FF")
    en_count = sum(1 for ch in text if "a" <= ch.lower() <= "z")
    return "en" if en_count > he_count else "he"


async def transcribe_audio(file: UploadFile) -> Tuple[str, str]:
    mock_mode = os.getenv("MOCK_MODE", "false").lower() == "true"
    api_url = os.getenv("WHISPER_API_URL")
    api_key = os.getenv("WHISPER_API_KEY")

    if mock_mode or not api_url or not api_key:
        transcript = (
            "נועה: בוקר טוב לכולם. המטרה היום היא לסגור את ה-MVP של מערכת תמלול וסיכום פגישות.\n"
            "אורן: יש לנו חמש שעות לבנות דמו שעובד מקצה לקצה, אז צריך לבחור פתרונות פשוטים אבל יציבים.\n"
            "דניאל: לגבי התמלול, נשתמש ב-Whisper API חיצוני. אם אין מפתח, נעבור למצב MOCK כדי שהדמו תמיד ירוץ.\n"
            "נועה: אחלה. לגבי הסיכום, נשתמש ב-Gemini כברירת מחדל, אבל נבנה שכבת LLMClient קטנה כדי שנוכל להחליף ספק בעתיד.\n"
            "אורן: חשוב שהפלט יהיה JSON קשיח עם summary, participants, decisions, actionItems, language, כולל ריטריי אחד לתיקון JSON.\n"
            "דניאל: מבחינת UI, נרצה מסך נקי: העלאת אודיו, תמלול מלא, כרטיסים לסיכום, החלטות ומשימות, ואז כפתור להורדת Word.\n"
            "נועה: החלטה - אנחנו הולכים על FastAPI ב-backend, React ב-frontend, ו- python-docx לייצוא.\n"
            "אורן: נוודא שיש README ברור עם הוראות הרצה מקומית ודגש על MOCK_MODE כדי שאפשר יהיה להדגים בלי מפתחות.\n"
            "דניאל: צריך גם PROCESS.md שמסביר איך תכננו, איך השתמשנו ב-AI, ואיפה נתקענו.\n"
            "נועה: משימות: אני כותבת את ה-System Prompt, אורן מטפל ב-backend routes ושכבת השירותים, דניאל בונה את ה-UI.\n"
            "אורן: דדליין פנימי - עוד שעתיים שיהיה end-to-end עובד עם Mock, ואז נעשה polish.\n"
            "נועה: מוסכם. נסכם את החלטות: MVP עובד, מערכת שגיאות ברורה, ויצוא Word.\n"
            "דניאל: אני אוסיף הודעות שגיאה ידידותיות בצד לקוח כדי שהמשתמש יבין מה נפל (Whisper/Gemini).\n"
            "נועה: מעולה. ניפגש בעוד שעה לבדיקה.\n"
        )
        return transcript, _detect_language(transcript)

    content = await file.read()
    files = {"file": (file.filename or "audio.wav", content, file.content_type)}
    headers = {"Authorization": f"Bearer {api_key}"}

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(api_url, files=files, headers=headers)
            response.raise_for_status()
            data = response.json()
    except Exception:
        raise TranscriptionError(
            "Transcription failed. Check WHISPER_API_URL/WHISPER_API_KEY or service availability."
        )

    transcript = data.get("text") or data.get("transcript")
    if not transcript:
        raise TranscriptionError("Transcription succeeded but returned empty content.")

    return transcript, _detect_language(transcript)
