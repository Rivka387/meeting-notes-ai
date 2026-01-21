import json
import os
from pathlib import Path
from typing import Any, Dict

import google.generativeai as genai

PROMPT_PATH = Path(__file__).resolve().parents[1] / "prompts" / "meeting_summary_system.txt"


class SummarizationError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def _load_system_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8")


def _build_user_prompt(transcript: str, language: str) -> str:
    return (
        f"Language: {language}\n"
        "Transcript:\n"
        f"{transcript}\n"
    )


def _parse_json(raw: str) -> Dict[str, Any]:
    return json.loads(raw)


def _normalize_payload(payload: Dict[str, Any], language: str) -> Dict[str, Any]:
    return {
        "summary": payload.get("summary", "").strip(),
        "participants": payload.get("participants", []) or [],
        "decisions": payload.get("decisions", []) or [],
        "actionItems": payload.get("actionItems", []) or [],
        "language": payload.get("language") or language,
    }


def _default_response(language: str) -> Dict[str, Any]:
    return {
        "summary": "No summary available.",
        "participants": [],
        "decisions": [],
        "actionItems": [],
        "language": language,
    }


def _mock_response(language: str) -> Dict[str, Any]:
    return {
        "summary": "הפגישה התמקדה בבניית MVP למערכת תמלול וסיכום עם Whisper ו-Gemini, כולל UI נקי וייצוא Word.",
        "participants": ["נועה", "אורן", "דניאל"],
        "decisions": [
            "שימוש ב-FastAPI ו-React למימוש ה-MVP.",
            "Whisper API לתמלול עם MOCK_MODE לגיבוי.",
            "Gemini כברירת מחדל עם שכבת LLMClient קטנה להחלפה עתידית.",
            "פלט JSON קשיח עם ריטריי אחד לתיקון פורמט.",
        ],
        "actionItems": [
            "נועה: כתיבת System Prompt.",
            "אורן: מימוש routes ושירותים ב-backend.",
            "דניאל: בניית UI והוספת הודעות שגיאה ידידותיות.",
            "הכנת README ו-PROCESS.md להדגמה.",
        ],
        "language": language,
    }


async def summarize_meeting(transcript: str, language_hint: str | None) -> Dict[str, Any]:
    language = language_hint or ("en" if transcript.isascii() else "he")
    mock_mode = os.getenv("MOCK_MODE", "false").lower() == "true"
    api_key = os.getenv("GEMINI_API_KEY")

    if mock_mode and not api_key:
        return _mock_response(language)
    if not api_key:
        return _default_response(language)

    genai.configure(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    model = genai.GenerativeModel(model_name=model_name)

    system_prompt = _load_system_prompt()
    user_prompt = _build_user_prompt(transcript, language)

    try:
        response = model.generate_content([system_prompt, user_prompt])
        raw_text = response.text or ""
    except Exception:
        raise SummarizationError(
            "Summarization failed. Check GEMINI_API_KEY or Gemini service availability."
        )

    try:
        payload = _parse_json(raw_text)
        return _normalize_payload(payload, language)
    except json.JSONDecodeError:
        fix_prompt = (
            "Fix the following content to valid JSON that matches the schema exactly. "
            "Return JSON only.\n\n"
            f"{raw_text}"
        )
        fix_response = model.generate_content([system_prompt, fix_prompt])
        try:
            payload = _parse_json(fix_response.text or "")
            return _normalize_payload(payload, language)
        except json.JSONDecodeError:
            raise SummarizationError("LLM returned invalid JSON after retry.")
