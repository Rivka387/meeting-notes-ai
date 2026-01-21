import os
import logging
from typing import Tuple

import httpx
from fastapi import UploadFile


class TranscriptionError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


logger = logging.getLogger(__name__)


def _detect_language(text: str) -> str:
    he_count = sum(1 for ch in text if "\u0590" <= ch <= "\u05FF")
    en_count = sum(1 for ch in text if "a" <= ch.lower() <= "z")
    return "en" if en_count > he_count else "he"


async def transcribe_audio(file: UploadFile, mock_override: bool | None = None) -> Tuple[str, str]:
    env_mock = os.getenv("MOCK_MODE", "false").lower() == "true"
    mock_mode = env_mock if mock_override is None else mock_override
    api_url = os.getenv("WHISPER_API_URL")
    api_key = os.getenv("WHISPER_API_KEY")
    model = os.getenv("WHISPER_MODEL", "whisper-1")

    if mock_mode:
        transcript = (
            "נועה: בוקר טוב, ניישר קו על ה-MVP של מערכת תמלול וסיכום פגישות.\n"
            "אורן: היעד הוא חוויית משתמש פשוטה: העלאת קובץ, תמלול, סיכום, והורדה ל-Word.\n"
            "דניאל: בפרונט נציג תמלול מלא, סיכום, משתתפים, החלטות ומשימות.\n"
            "נועה: נשתמש ב-Whisper לתמלול וב-Gemini לסיכום, ונפעיל מצב דמו לצורך בדיקות.\n"
            "אורן: בבקאנד נבנה routes ל-transcribe, summarize ו-export/docx.\n"
            "דניאל: נוסיף UI ברור ונקפיד על תיעוד רידמי ו-PROCESS.md.\n"
        )
        return transcript, _detect_language(transcript)
    if not api_url or not api_key:
        raise TranscriptionError(
            "Missing WHISPER_API_URL/WHISPER_API_KEY. Set them or enable mock mode."
        )

    content = await file.read()
    files = {"file": (file.filename or "audio.wav", content, file.content_type)}
    headers = {"Authorization": f"Bearer {api_key}"}
    data = {"model": model}

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(api_url, files=files, headers=headers, data=data)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        body = exc.response.text
        logger.exception("Whisper API error: %s %s", status, body)
        raise TranscriptionError(
            f"Transcription failed. Whisper API returned {status}. Details: {body}"
        )
    except Exception as exc:
        logger.exception("Whisper API request failed")
        raise TranscriptionError(
            f"Transcription failed. Check WHISPER_API_URL/WHISPER_API_KEY or service availability. Details: {exc}"
        )

    transcript = data.get("text") or data.get("transcript")
    if not transcript:
        raise TranscriptionError("Transcription succeeded but returned empty content.")

    return transcript, _detect_language(transcript)
